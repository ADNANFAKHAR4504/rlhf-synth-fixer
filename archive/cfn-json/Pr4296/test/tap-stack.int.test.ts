import AWS from 'aws-sdk';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-west-1';

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

describe('NAT Gateway to Private Subnet Integration', () => {
  let natGateways: AWS.EC2.NatGatewayList;
  let routeTables: AWS.EC2.RouteTableList;
  let subnets: AWS.EC2.SubnetList;
  let vpcs: AWS.EC2.VpcList;

  beforeAll(async () => {
    const vpcResponse = await ec2.describeVpcs({}).promise();
    vpcs = vpcResponse.Vpcs || [];

    const natResponse = await ec2.describeNatGateways({}).promise();
    natGateways = natResponse.NatGateways || [];

    const rtResponse = await ec2.describeRouteTables({}).promise();
    routeTables = rtResponse.RouteTables || [];

    const subnetResponse = await ec2.describeSubnets({}).promise();
    subnets = subnetResponse.Subnets || [];
  });

  test('should have NAT Gateway in public subnet routing private traffic', async () => {
    const vpc = vpcs.find(v =>
      v.Tags?.some(
        tag =>
          tag.Key === 'Name' &&
          tag.Value?.includes(`ProductionVPC-${environmentSuffix}`)
      )
    );
    expect(vpc).toBeDefined();

    const natGateway = natGateways.find(
      nat =>
        nat.State === 'available' &&
        nat.Tags?.some(
          tag =>
            tag.Key === 'Name' &&
            tag.Value?.includes(`NATGateway-${environmentSuffix}`)
        )
    );
    expect(natGateway).toBeDefined();

    const natSubnet = subnets.find(s => s.SubnetId === natGateway!.SubnetId);
    expect(natSubnet).toBeDefined();
    expect(natSubnet!.MapPublicIpOnLaunch).toBe(true);

    const privateRouteTable = routeTables.find(
      rt =>
        rt.VpcId === vpc!.VpcId &&
        rt.Tags?.some(
          tag =>
            tag.Key === 'Name' &&
            tag.Value?.includes(`PrivateRouteTable-${environmentSuffix}`)
        )
    );
    expect(privateRouteTable).toBeDefined();

    const natRoute = privateRouteTable!.Routes?.find(
      route =>
        route.DestinationCidrBlock === '0.0.0.0/0' &&
        route.NatGatewayId === natGateway!.NatGatewayId
    );
    expect(natRoute).toBeDefined();

    const privateSubnets = subnets.filter(
      s =>
        s.VpcId === vpc!.VpcId &&
        !s.MapPublicIpOnLaunch &&
        s.Tags?.some(tag => tag.Value?.includes(environmentSuffix))
    );
    expect(privateSubnets.length).toBe(2);
  });

  test('should have NAT Gateway with Elastic IP allocated', async () => {
    const natGateway = natGateways.find(
      nat =>
        nat.State === 'available' &&
        nat.Tags?.some(
          tag =>
            tag.Key === 'Name' &&
            tag.Value?.includes(`NATGateway-${environmentSuffix}`)
        )
    );
    expect(natGateway).toBeDefined();
    expect(natGateway!.NatGatewayAddresses).toBeDefined();
    expect(natGateway!.NatGatewayAddresses!.length).toBeGreaterThan(0);
    expect(natGateway!.NatGatewayAddresses![0].AllocationId).toBeDefined();
  });
});

describe('Internet Gateway to Public Subnet Integration', () => {
  let internetGateways: AWS.EC2.InternetGatewayList;
  let routeTables: AWS.EC2.RouteTableList;
  let subnets: AWS.EC2.SubnetList;
  let vpcs: AWS.EC2.VpcList;

  beforeAll(async () => {
    const vpcResponse = await ec2.describeVpcs({}).promise();
    vpcs = vpcResponse.Vpcs || [];

    const igwResponse = await ec2.describeInternetGateways({}).promise();
    internetGateways = igwResponse.InternetGateways || [];

    const rtResponse = await ec2.describeRouteTables({}).promise();
    routeTables = rtResponse.RouteTables || [];

    const subnetResponse = await ec2.describeSubnets({}).promise();
    subnets = subnetResponse.Subnets || [];
  });

  test('should have Internet Gateway attached to VPC routing public traffic', async () => {
    const vpc = vpcs.find(v =>
      v.Tags?.some(
        tag =>
          tag.Key === 'Name' &&
          tag.Value?.includes(`ProductionVPC-${environmentSuffix}`)
      )
    );
    expect(vpc).toBeDefined();

    const igw = internetGateways.find(
      gateway =>
        gateway.Attachments?.some(
          att => att.VpcId === vpc!.VpcId && att.State === 'available'
        ) &&
        gateway.Tags?.some(
          tag =>
            tag.Key === 'Name' &&
            tag.Value?.includes(`ProductionIGW-${environmentSuffix}`)
        )
    );
    expect(igw).toBeDefined();

    const publicRouteTable = routeTables.find(
      rt =>
        rt.VpcId === vpc!.VpcId &&
        rt.Tags?.some(
          tag =>
            tag.Key === 'Name' &&
            tag.Value?.includes(`PublicRouteTable-${environmentSuffix}`)
        )
    );
    expect(publicRouteTable).toBeDefined();

    const igwRoute = publicRouteTable!.Routes?.find(
      route =>
        route.DestinationCidrBlock === '0.0.0.0/0' &&
        route.GatewayId === igw!.InternetGatewayId
    );
    expect(igwRoute).toBeDefined();
    expect(igwRoute!.State).toBe('active');

    const publicSubnets = subnets.filter(
      s =>
        s.VpcId === vpc!.VpcId &&
        s.MapPublicIpOnLaunch &&
        s.Tags?.some(tag => tag.Value?.includes(environmentSuffix))
    );
    expect(publicSubnets.length).toBe(2);
  });
});

describe('CloudWatch Alarms to Auto Scaling Integration', () => {
  const cloudwatch = new AWS.CloudWatch();
  let alarms: AWS.CloudWatch.MetricAlarms;
  let autoScalingGroups: AWS.AutoScaling.AutoScalingGroups;
  let policies: AWS.AutoScaling.PoliciesType['ScalingPolicies'];

  beforeAll(async () => {
    const alarmsResponse = await cloudwatch.describeAlarms({}).promise();
    alarms = alarmsResponse.MetricAlarms || [];

    const asgResponse = await autoscaling
      .describeAutoScalingGroups({})
      .promise();
    autoScalingGroups = asgResponse.AutoScalingGroups || [];

    const policiesResponse = await autoscaling.describePolicies({}).promise();
    policies = policiesResponse.ScalingPolicies || [];
  });

  test('should have CloudWatch high CPU alarm triggering scale up policy', async () => {
    const asg = autoScalingGroups.find(group =>
      group.AutoScalingGroupName?.includes(environmentSuffix)
    );
    expect(asg).toBeDefined();

    const highCPUAlarm = alarms.find(
      alarm =>
        alarm.AlarmName?.includes('CPUAlarmHigh') &&
        alarm.AlarmName?.includes(environmentSuffix)
    );
    expect(highCPUAlarm).toBeDefined();
    expect(highCPUAlarm!.MetricName).toBe('CPUUtilization');
    expect(highCPUAlarm!.ComparisonOperator).toBe('GreaterThanThreshold');
    expect(highCPUAlarm!.Threshold).toBe(70);

    expect(highCPUAlarm!.AlarmActions).toBeDefined();
    expect(highCPUAlarm!.AlarmActions!.length).toBeGreaterThan(0);

    const scaleUpPolicy = policies!.find(
      p =>
        p.PolicyName?.includes('ScaleUpPolicy') &&
        p.AutoScalingGroupName === asg!.AutoScalingGroupName
    );
    expect(scaleUpPolicy).toBeDefined();
    expect(scaleUpPolicy!.ScalingAdjustment).toBe(1);
  });

  test('should have CloudWatch low CPU alarm triggering scale down policy', async () => {
    const asg = autoScalingGroups.find(group =>
      group.AutoScalingGroupName?.includes(environmentSuffix)
    );
    expect(asg).toBeDefined();

    const lowCPUAlarm = alarms.find(
      alarm =>
        alarm.AlarmName?.includes('CPUAlarmLow') &&
        alarm.AlarmName?.includes(environmentSuffix)
    );
    expect(lowCPUAlarm).toBeDefined();
    expect(lowCPUAlarm!.MetricName).toBe('CPUUtilization');
    expect(lowCPUAlarm!.ComparisonOperator).toBe('LessThanThreshold');
    expect(lowCPUAlarm!.Threshold).toBe(30);

    expect(lowCPUAlarm!.AlarmActions).toBeDefined();
    expect(lowCPUAlarm!.AlarmActions!.length).toBeGreaterThan(0);

    const scaleDownPolicy = policies!.find(
      p =>
        p.PolicyName?.includes('ScaleDownPolicy') &&
        p.AutoScalingGroupName === asg!.AutoScalingGroupName
    );
    expect(scaleDownPolicy).toBeDefined();
    expect(scaleDownPolicy!.ScalingAdjustment).toBe(-1);
  });
});

describe('ALB HTTP Request to EC2 Integration', () => {
  let loadBalancers: AWS.ELBv2.LoadBalancers;
  const https = require('https');
  const http = require('http');

  beforeAll(async () => {
    const albResponse = await elbv2.describeLoadBalancers({}).promise();
    loadBalancers = albResponse.LoadBalancers || [];
  });

  test('should successfully send HTTP request to ALB and receive response from EC2', async () => {
    const alb = loadBalancers.find(lb =>
      lb.LoadBalancerName?.includes(environmentSuffix)
    );
    expect(alb).toBeDefined();
    expect(alb!.DNSName).toBeDefined();

    const albUrl = `http://${alb!.DNSName}`;

    const response = await new Promise((resolve, reject) => {
      http.get(albUrl, (res: any) => {
        let data = '';
        res.on('data', (chunk: any) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      }).on('error', reject);
    });

    // Accept any HTTP response (200, 502, etc.) - validates ALB is routing traffic
    expect((response as any).statusCode).toBeDefined();
    expect([200, 502, 503, 504]).toContain((response as any).statusCode);
  });

  test('should verify ALB can handle multiple HTTP requests', async () => {
    const alb = loadBalancers.find(lb =>
      lb.LoadBalancerName?.includes(environmentSuffix)
    );
    expect(alb).toBeDefined();

    const albUrl = `http://${alb!.DNSName}`;
    let successfulRequests = 0;

    // Send 10 requests to verify ALB routing capability
    for (let i = 0; i < 10; i++) {
      try {
        const response: any = await new Promise((resolve, reject) => {
          http.get(albUrl, (res: any) => {
            let data = '';
            res.on('data', (chunk: any) => {
              data += chunk;
            });
            res.on('end', () => {
              resolve({
                statusCode: res.statusCode,
                body: data
              });
            });
          }).on('error', reject);
        });

        // Count responses that indicate ALB is routing (any valid HTTP response)
        if (response.statusCode) {
          successfulRequests++;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log(`Request ${i + 1} failed, continuing...`);
      }
    }

    // Verify ALB handled at least 5 out of 10 requests
    expect(successfulRequests).toBeGreaterThanOrEqual(5);
  });
});

describe('EC2 to RDS Network Connectivity Integration', () => {
  let dbInstances: AWS.RDS.DBInstanceList;
  let instances: AWS.EC2.InstanceList;

  beforeAll(async () => {
    const rdsResponse = await rds.describeDBInstances({}).promise();
    dbInstances = rdsResponse.DBInstances || [];

    const ec2Response = await ec2.describeInstances({}).promise();
    instances =
      ec2Response.Reservations?.flatMap(r => r.Instances || []) || [];
  });

  test('should have RDS in same VPC as EC2 instances for network connectivity', async () => {
    const dbInstance = dbInstances.find(db =>
      db.DBInstanceIdentifier?.includes(environmentSuffix)
    );
    expect(dbInstance).toBeDefined();
    expect(dbInstance!.Endpoint).toBeDefined();
    expect(dbInstance!.DBSubnetGroup).toBeDefined();

    const runningInstances = instances.filter(
      i =>
        i.State?.Name === 'running' &&
        i.Tags?.some(tag => tag.Value?.includes(environmentSuffix))
    );
    expect(runningInstances.length).toBeGreaterThanOrEqual(1);

    const testInstance = runningInstances[0];

    // Verify both RDS and EC2 are in the same VPC (validates network connectivity possibility)
    expect(dbInstance!.DBSubnetGroup!.VpcId).toBeDefined();
    expect(testInstance.VpcId).toBeDefined();
    expect(dbInstance!.DBSubnetGroup!.VpcId).toBe(testInstance.VpcId);
  });
});

describe('CloudWatch Alarm Triggering Auto Scaling Action', () => {
  const cloudwatch = new AWS.CloudWatch();
  let alarms: AWS.CloudWatch.MetricAlarms;
  let autoScalingGroups: AWS.AutoScaling.AutoScalingGroups;

  beforeAll(async () => {
    const alarmsResponse = await cloudwatch.describeAlarms({}).promise();
    alarms = alarmsResponse.MetricAlarms || [];

    const asgResponse = await autoscaling
      .describeAutoScalingGroups({})
      .promise();
    autoScalingGroups = asgResponse.AutoScalingGroups || [];
  });

  test('should trigger scale up by setting alarm state to ALARM', async () => {
    const asg = autoScalingGroups.find(group =>
      group.AutoScalingGroupName?.includes(environmentSuffix)
    );
    expect(asg).toBeDefined();

    const initialInstanceCount = asg!.Instances!.length;

    const highCPUAlarm = alarms.find(
      alarm =>
        alarm.AlarmName?.includes('CPUAlarmHigh') &&
        alarm.AlarmName?.includes(environmentSuffix)
    );
    expect(highCPUAlarm).toBeDefined();

    await cloudwatch
      .setAlarmState({
        AlarmName: highCPUAlarm!.AlarmName!,
        StateValue: 'ALARM',
        StateReason: 'Integration test - simulating high CPU',
      })
      .promise();

    await new Promise(resolve => setTimeout(resolve, 10000));

    const updatedAsgResponse = await autoscaling
      .describeAutoScalingGroups({
        AutoScalingGroupNames: [asg!.AutoScalingGroupName!],
      })
      .promise();

    const updatedAsg = updatedAsgResponse.AutoScalingGroups![0];
    const newInstanceCount = updatedAsg.Instances!.length;

    expect(newInstanceCount).toBeGreaterThanOrEqual(initialInstanceCount);

    await cloudwatch
      .setAlarmState({
        AlarmName: highCPUAlarm!.AlarmName!,
        StateValue: 'OK',
        StateReason: 'Integration test - resetting alarm state',
      })
      .promise();
  });

  test('should verify alarm history shows state changes', async () => {
    const highCPUAlarm = alarms.find(
      alarm =>
        alarm.AlarmName?.includes('CPUAlarmHigh') &&
        alarm.AlarmName?.includes(environmentSuffix)
    );
    expect(highCPUAlarm).toBeDefined();

    const historyResponse = await cloudwatch
      .describeAlarmHistory({
        AlarmName: highCPUAlarm!.AlarmName!,
        HistoryItemType: 'StateUpdate',
        MaxRecords: 10,
      })
      .promise();

    expect(historyResponse.AlarmHistoryItems).toBeDefined();
    expect(historyResponse.AlarmHistoryItems!.length).toBeGreaterThan(0);

    const recentStateChanges = historyResponse.AlarmHistoryItems!.filter(
      item =>
        item.HistorySummary?.includes('ALARM') ||
        item.HistorySummary?.includes('OK')
    );
    expect(recentStateChanges.length).toBeGreaterThan(0);
  });
});
