import AWS from 'aws-sdk';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-south-1';

AWS.config.update({ region });

const ec2 = new AWS.EC2();
const elbv2 = new AWS.ELBv2();
const rds = new AWS.RDS();
const autoscaling = new AWS.AutoScaling();

describe('ALB to Auto Scaling Group Integration', () => {
  let loadBalancers: AWS.ELBv2.LoadBalancers;
  let targetGroups: AWS.ELBv2.TargetGroups;
  let autoScalingGroups: AWS.AutoScaling.AutoScalingGroups;

  beforeAll(async () => {
    const albResponse = await elbv2.describeLoadBalancers({}).promise();
    loadBalancers = albResponse.LoadBalancers || [];

    const tgResponse = await elbv2.describeTargetGroups({}).promise();
    targetGroups = tgResponse.TargetGroups || [];

    const asgResponse = await autoscaling
      .describeAutoScalingGroups({})
      .promise();
    autoScalingGroups = asgResponse.AutoScalingGroups || [];
  });

  test('should have ALB connected to target group', async () => {
    const alb = loadBalancers.find(lb =>
      lb.LoadBalancerName?.includes(environmentSuffix)
    );
    expect(alb).toBeDefined();

    const listenersResponse = await elbv2
      .describeListeners({
        LoadBalancerArn: alb!.LoadBalancerArn!,
      })
      .promise();

    const listeners = listenersResponse.Listeners || [];
    expect(listeners.length).toBeGreaterThan(0);

    const httpListener = listeners.find(l => l.Port === 80);
    expect(httpListener).toBeDefined();
    expect(httpListener!.DefaultActions![0].Type).toBe('forward');
  });

  test('should have target group registered with Auto Scaling Group', async () => {
    const asg = autoScalingGroups.find(group =>
      group.AutoScalingGroupName?.includes(environmentSuffix)
    );
    expect(asg).toBeDefined();
    expect(asg!.TargetGroupARNs).toBeDefined();
    expect(asg!.TargetGroupARNs!.length).toBeGreaterThan(0);

    const targetGroupArn = asg!.TargetGroupARNs![0];
    const tg = targetGroups.find(t => t.TargetGroupArn === targetGroupArn);
    expect(tg).toBeDefined();
    expect(tg!.Protocol).toBe('HTTP');
    expect(tg!.Port).toBe(80);
  });

  test('should have target group health checks configured', async () => {
    const asg = autoScalingGroups.find(group =>
      group.AutoScalingGroupName?.includes(environmentSuffix)
    );
    const targetGroupArn = asg!.TargetGroupARNs![0];
    const tg = targetGroups.find(t => t.TargetGroupArn === targetGroupArn);

    expect(tg!.HealthCheckEnabled).toBe(true);
    expect(tg!.HealthCheckProtocol).toBe('HTTP');
    expect(tg!.HealthCheckPath).toBe('/');
    expect(tg!.HealthCheckIntervalSeconds).toBe(30);
  });
});

describe('VPC to Subnet Integration', () => {
  let vpcs: AWS.EC2.VpcList;
  let subnets: AWS.EC2.SubnetList;

  beforeAll(async () => {
    const vpcResponse = await ec2.describeVpcs({}).promise();
    vpcs = vpcResponse.Vpcs || [];

    const subnetResponse = await ec2.describeSubnets({}).promise();
    subnets = subnetResponse.Subnets || [];
  });

  test('should have VPC with correct CIDR and subnets attached', async () => {
    const vpc = vpcs.find(v =>
      v.Tags?.some(
        tag =>
          tag.Key === 'Name' && tag.Value?.includes(`ProductionVPC-${environmentSuffix}`)
      )
    );
    expect(vpc).toBeDefined();
    expect(vpc!.CidrBlock).toBe('10.0.0.0/16');

    const vpcSubnets = subnets.filter(s => s.VpcId === vpc!.VpcId);
    expect(vpcSubnets.length).toBe(4);

    const publicSubnets = vpcSubnets.filter(s => s.MapPublicIpOnLaunch);
    const privateSubnets = vpcSubnets.filter(s => !s.MapPublicIpOnLaunch);

    expect(publicSubnets.length).toBe(2);
    expect(privateSubnets.length).toBe(2);
  });

  test('should have subnets in different availability zones', async () => {
    const vpc = vpcs.find(v =>
      v.Tags?.some(
        tag =>
          tag.Key === 'Name' && tag.Value?.includes(`ProductionVPC-${environmentSuffix}`)
      )
    );
    const vpcSubnets = subnets.filter(s => s.VpcId === vpc!.VpcId);

    const azs = new Set(vpcSubnets.map(s => s.AvailabilityZone));
    expect(azs.size).toBe(2);
  });
});

describe('Security Group to RDS Integration', () => {
  let securityGroups: AWS.EC2.SecurityGroupList;
  let dbInstances: AWS.RDS.DBInstanceList;

  beforeAll(async () => {
    const sgResponse = await ec2.describeSecurityGroups({}).promise();
    securityGroups = sgResponse.SecurityGroups || [];

    const rdsResponse = await rds.describeDBInstances({}).promise();
    dbInstances = rdsResponse.DBInstances || [];
  });

  test('should have RDS instance with correct security group attached', async () => {
    const dbInstance = dbInstances.find(db =>
      db.DBInstanceIdentifier?.includes(environmentSuffix)
    );
    expect(dbInstance).toBeDefined();
    expect(dbInstance!.VpcSecurityGroups).toBeDefined();
    expect(dbInstance!.VpcSecurityGroups!.length).toBeGreaterThan(0);

    const rdsSG = securityGroups.find(
      sg =>
        sg.GroupId === dbInstance!.VpcSecurityGroups![0].VpcSecurityGroupId
    );
    expect(rdsSG).toBeDefined();
    expect(rdsSG!.GroupName).toContain('RDSSecurityGroup');
  });

  test('should have RDS security group allowing MySQL from web server SG', async () => {
    const rdsSG = securityGroups.find(sg =>
      sg.Tags?.some(
        tag =>
          tag.Key === 'Name' &&
          tag.Value?.includes(`RDSSecurityGroup-${environmentSuffix}`)
      )
    );
    expect(rdsSG).toBeDefined();

    const mysqlRule = rdsSG!.IpPermissions?.find(
      rule => rule.FromPort === 3306 && rule.ToPort === 3306
    );
    expect(mysqlRule).toBeDefined();
    expect(mysqlRule!.UserIdGroupPairs).toBeDefined();
    expect(mysqlRule!.UserIdGroupPairs!.length).toBeGreaterThan(0);

    const webServerSGId = mysqlRule!.UserIdGroupPairs![0].GroupId;
    const webServerSG = securityGroups.find(sg => sg.GroupId === webServerSGId);
    expect(webServerSG).toBeDefined();
    expect(webServerSG!.GroupName).toContain('WebServerSecurityGroup');
  });

  test('should have RDS in private subnet', async () => {
    const dbInstance = dbInstances.find(db =>
      db.DBInstanceIdentifier?.includes(environmentSuffix)
    );
    expect(dbInstance).toBeDefined();
    expect(dbInstance!.PubliclyAccessible).toBe(false);

    const subnetGroup = dbInstance!.DBSubnetGroup;
    expect(subnetGroup).toBeDefined();
    expect(subnetGroup!.Subnets).toBeDefined();
    expect(subnetGroup!.Subnets!.length).toBe(2);
  });
});

describe('Auto Scaling to EC2 Instances Integration', () => {
  let autoScalingGroups: AWS.AutoScaling.AutoScalingGroups;
  let instances: AWS.EC2.InstanceList;

  beforeAll(async () => {
    const asgResponse = await autoscaling
      .describeAutoScalingGroups({})
      .promise();
    autoScalingGroups = asgResponse.AutoScalingGroups || [];

    const ec2Response = await ec2.describeInstances({}).promise();
    instances =
      ec2Response.Reservations?.flatMap(r => r.Instances || []) || [];
  });

  test('should have Auto Scaling Group managing EC2 instances', async () => {
    const asg = autoScalingGroups.find(group =>
      group.AutoScalingGroupName?.includes(environmentSuffix)
    );
    expect(asg).toBeDefined();
    expect(asg!.Instances).toBeDefined();
    expect(asg!.Instances!.length).toBeGreaterThanOrEqual(2);

    const asgInstanceIds = asg!.Instances!.map(i => i.InstanceId);
    const managedInstances = instances.filter(i =>
      asgInstanceIds.includes(i.InstanceId!)
    );

    expect(managedInstances.length).toBeGreaterThanOrEqual(2);
  });

  test('should have EC2 instances with encrypted EBS volumes', async () => {
    const asg = autoScalingGroups.find(group =>
      group.AutoScalingGroupName?.includes(environmentSuffix)
    );
    const asgInstanceIds = asg!.Instances!.map(i => i.InstanceId);
    const managedInstances = instances.filter(i =>
      asgInstanceIds.includes(i.InstanceId!)
    );

    for (const instance of managedInstances) {
      const volumeIds =
        instance.BlockDeviceMappings?.map(bdm => bdm.Ebs?.VolumeId).filter(
          Boolean
        ) || [];

      if (volumeIds.length > 0) {
        const volumesResponse = await ec2
          .describeVolumes({ VolumeIds: volumeIds as string[] })
          .promise();
        const volumes = volumesResponse.Volumes || [];

        volumes.forEach(volume => {
          expect(volume.Encrypted).toBe(true);
        });
      }
    }
  });

  test('should have EC2 instances with IAM instance profile', async () => {
    const asg = autoScalingGroups.find(group =>
      group.AutoScalingGroupName?.includes(environmentSuffix)
    );
    const asgInstanceIds = asg!.Instances!.map(i => i.InstanceId);
    const managedInstances = instances.filter(i =>
      asgInstanceIds.includes(i.InstanceId!)
    );

    managedInstances.forEach(instance => {
      expect(instance.IamInstanceProfile).toBeDefined();
    });
  });
});

describe('ALB to Security Group Integration', () => {
  let loadBalancers: AWS.ELBv2.LoadBalancers;
  let securityGroups: AWS.EC2.SecurityGroupList;

  beforeAll(async () => {
    const albResponse = await elbv2.describeLoadBalancers({}).promise();
    loadBalancers = albResponse.LoadBalancers || [];

    const sgResponse = await ec2.describeSecurityGroups({}).promise();
    securityGroups = sgResponse.SecurityGroups || [];
  });

  test('should have ALB attached to security group with HTTP/HTTPS rules', async () => {
    const alb = loadBalancers.find(lb =>
      lb.LoadBalancerName?.includes(environmentSuffix)
    );
    expect(alb).toBeDefined();
    expect(alb!.SecurityGroups).toBeDefined();
    expect(alb!.SecurityGroups!.length).toBeGreaterThan(0);

    const albSG = securityGroups.find(
      sg => sg.GroupId === alb!.SecurityGroups![0]
    );
    expect(albSG).toBeDefined();

    const httpRule = albSG!.IpPermissions?.find(
      rule => rule.FromPort === 80 && rule.ToPort === 80
    );
    expect(httpRule).toBeDefined();
    expect(httpRule!.IpRanges).toBeDefined();
    expect(httpRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');

    const httpsRule = albSG!.IpPermissions?.find(
      rule => rule.FromPort === 443 && rule.ToPort === 443
    );
    expect(httpsRule).toBeDefined();
    expect(httpsRule!.IpRanges).toBeDefined();
    expect(httpsRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
  });

  test('should have web server security group accepting traffic from ALB', async () => {
    const alb = loadBalancers.find(lb =>
      lb.LoadBalancerName?.includes(environmentSuffix)
    );
    const albSGId = alb!.SecurityGroups![0];

    const webServerSG = securityGroups.find(sg =>
      sg.Tags?.some(
        tag =>
          tag.Key === 'Name' &&
          tag.Value?.includes(`WebServerSecurityGroup-${environmentSuffix}`)
      )
    );
    expect(webServerSG).toBeDefined();

    const httpRule = webServerSG!.IpPermissions?.find(
      rule => rule.FromPort === 80 && rule.ToPort === 80
    );
    expect(httpRule).toBeDefined();
    expect(httpRule!.UserIdGroupPairs).toBeDefined();
    expect(httpRule!.UserIdGroupPairs!.length).toBeGreaterThan(0);
    expect(httpRule!.UserIdGroupPairs![0].GroupId).toBe(albSGId);
  });
});

describe('RDS Multi-AZ and Backup Configuration', () => {
  let dbInstances: AWS.RDS.DBInstanceList;

  beforeAll(async () => {
    const rdsResponse = await rds.describeDBInstances({}).promise();
    dbInstances = rdsResponse.DBInstances || [];
  });

  test('should have RDS instance with Multi-AZ enabled', async () => {
    const dbInstance = dbInstances.find(db =>
      db.DBInstanceIdentifier?.includes(environmentSuffix)
    );
    expect(dbInstance).toBeDefined();
    expect(dbInstance!.MultiAZ).toBe(true);
  });

  test('should have RDS instance with storage encryption enabled', async () => {
    const dbInstance = dbInstances.find(db =>
      db.DBInstanceIdentifier?.includes(environmentSuffix)
    );
    expect(dbInstance).toBeDefined();
    expect(dbInstance!.StorageEncrypted).toBe(true);
  });

  test('should have RDS instance with backup retention configured', async () => {
    const dbInstance = dbInstances.find(db =>
      db.DBInstanceIdentifier?.includes(environmentSuffix)
    );
    expect(dbInstance).toBeDefined();
    expect(dbInstance!.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
  });
});
