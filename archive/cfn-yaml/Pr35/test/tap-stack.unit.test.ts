// Configuration - These are coming from cdk-outputs after cdk deploy
import fs from 'fs';
import {
  AutoScaling,
  CloudWatch,
  EC2,
  ELBv2,
} from 'aws-sdk';
import axios from 'axios';

const outputs = JSON.parse(
  fs.readFileSync('cdk-outputs/flat-outputs.json', 'utf8')
);

// AWS Service clients
const ec2 = new EC2();
const elbv2 = new ELBv2();
const autoscaling = new AutoScaling();
const cloudwatch = new CloudWatch();

// Destructure outputs, removing Lambda-specific outputs
// Note: MetadataBucketName removed as S3 bucket is no longer part of the stack

describe('ALB Integration Tests', () => {
  test('ALB endpoint should be reachable', async () => {
    const url = outputs.HrALBDNSName;
    const response = await axios.get(`http://${url}`);
    expect(response.status).toBe(200);
  });

  test('ALB should have multiple healthy targets', async () => {
    const albArn = outputs.HrALBArn;
    const targetGroups = await elbv2
      .describeTargetGroups({ LoadBalancerArn: albArn })
      .promise();
    expect(targetGroups.TargetGroups?.length).toBeGreaterThan(0);

    for (const tg of targetGroups.TargetGroups || []) {
      const health = await elbv2
        .describeTargetHealth({ TargetGroupArn: tg.TargetGroupArn! })
        .promise();
      const healthyCount =
        health.TargetHealthDescriptions?.filter(
          (desc: any) => desc.TargetHealth?.State === 'healthy'
        ).length || 0;
      expect(healthyCount).toBeGreaterThan(1);
    }
  });
});

describe('VPC and Subnet Integration Tests', () => {
  test('VPC should exist', async () => {
    const vpcId = outputs.VPCId;
    const result = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
    expect(result.Vpcs?.length).toBe(1);
  });

  test('All public subnets should exist and be in different AZs', async () => {
    const publicSubnetIds = outputs.PublicSubnetIds.split(',');
    const subnets = await ec2
      .describeSubnets({ SubnetIds: publicSubnetIds })
      .promise();
    expect(subnets.Subnets?.length).toBe(3);

    const azs = new Set(subnets.Subnets?.map((s: any) => s.AvailabilityZone));
    expect(azs.size).toBe(3);
  });

  test('All private subnets should exist and be in different AZs', async () => {
    const privateSubnetIds = outputs.PrivateSubnetIds.split(',');
    const subnets = await ec2
      .describeSubnets({ SubnetIds: privateSubnetIds })
      .promise();
    expect(subnets.Subnets?.length).toBe(3);

    const azs = new Set(subnets.Subnets?.map((s: any) => s.AvailabilityZone));
    expect(azs.size).toBe(3);
  });
});

describe('High Availability (HA) Tests', () => {
  test('VPC should have subnets in multiple AZs', async () => {
    const vpcId = outputs.VPCId;
    const subnets = await ec2
      .describeSubnets({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] })
      .promise();
    const azs = new Set(subnets.Subnets?.map((s: any) => s.AvailabilityZone));
    expect(azs.size).toBeGreaterThan(1);
  });
});

describe('🔒 Security & Access Control Tests', () => {
  test('ALB Security Group should have correct ingress rules', async () => {
    const sgDetails = await ec2
      .describeSecurityGroups({
        GroupIds: [outputs.HrALBSecurityGroupId],
      })
      .promise();

    const sg = sgDetails.SecurityGroups![0];
    expect(sg.IpPermissions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          FromPort: 80,
          ToPort: 80,
          IpProtocol: 'tcp',
          IpRanges: expect.arrayContaining([{ CidrIp: '0.0.0.0/0' }]),
        }),
        expect.objectContaining({
          FromPort: 443,
          ToPort: 443,
          IpProtocol: 'tcp',
          IpRanges: expect.arrayContaining([{ CidrIp: '0.0.0.0/0' }]),
        }),
      ])
    );
  });

  test('App Security Group should only allow traffic from ALB', async () => {
    const sgDetails = await ec2
      .describeSecurityGroups({
        GroupIds: [outputs.HrAppSecurityGroupId],
      })
      .promise();

    const sg = sgDetails.SecurityGroups![0];
    const httpRule = sg.IpPermissions?.find((rule: any) => rule.FromPort === 80);
    const httpsRule = sg.IpPermissions?.find((rule: any) => rule.FromPort === 443);

    expect(httpRule?.UserIdGroupPairs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          GroupId: outputs.HrALBSecurityGroupId,
        }),
      ])
    );
    expect(httpsRule?.UserIdGroupPairs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          GroupId: outputs.HrALBSecurityGroupId,
        }),
      ])
    );
  });
});



describe('⚡ Performance & Scalability Tests', () => {
  test('ALB should have healthy targets', async () => {
    const targetGroups = await elbv2
      .describeTargetGroups({ LoadBalancerArn: outputs.HrALBArn })
      .promise();

    expect(targetGroups.TargetGroups?.length).toBeGreaterThan(0);

    for (const tg of targetGroups.TargetGroups || []) {
      const health = await elbv2
        .describeTargetHealth({ TargetGroupArn: tg.TargetGroupArn! })
        .promise();

      const healthyCount =
        health.TargetHealthDescriptions?.filter(
          (desc: any) => desc.TargetHealth?.State === 'healthy'
        ).length || 0;

      expect(healthyCount).toBeGreaterThan(0);
    }
  });

  test('Auto Scaling Group should have correct capacity', async () => {
    const asgs = await autoscaling
      .describeAutoScalingGroups({
        AutoScalingGroupNames: [outputs.HrAutoScalingGroupName],
      })
      .promise();

    const asg = asgs.AutoScalingGroups![0];
    expect(asg.MinSize).toBe(2);
    expect(asg.MaxSize).toBe(6);
    expect(asg.DesiredCapacity).toBe(3);
    expect(asg.Instances?.length).toBe(3);
  });
});

describe('🔄 Resilience & Failover Tests', () => {
  test('ALB should be in multiple AZs', async () => {
    const albDetails = await elbv2
      .describeLoadBalancers({
        LoadBalancerArns: [outputs.HrALBArn],
      })
      .promise();

    const alb = albDetails.LoadBalancers![0];
    expect(alb.AvailabilityZones?.length).toBeGreaterThanOrEqual(2);
  });

  test('Auto Scaling instances should be distributed across AZs', async () => {
    const asgs = await autoscaling
      .describeAutoScalingGroups({
        AutoScalingGroupNames: [outputs.HrAutoScalingGroupName],
      })
      .promise();

    const asg = asgs.AutoScalingGroups![0];
    const azs = new Set(
      asg.Instances?.map((instance: any) => instance.AvailabilityZone)
    );
    expect(azs.size).toBeGreaterThan(1); // Distributed across multiple AZs
  });
});

describe('📊 Monitoring & Observability Tests', () => {
  test('ALB metrics should be available', async () => {
    const albArn = outputs.HrALBArn;
    const albName = albArn.split('/').slice(-3).join('/');

    const metricData = await cloudwatch
      .getMetricStatistics({
        Namespace: 'AWS/ApplicationELB',
        MetricName: 'RequestCount',
        Dimensions: [
          {
            Name: 'LoadBalancer',
            Value: albName,
          },
        ],
        StartTime: new Date(Date.now() - 3600000),
        EndTime: new Date(),
        Period: 300,
        Statistics: ['Sum'],
      })
      .promise();

    expect(metricData.Datapoints).toBeDefined();
  });
});

describe('🏷️ Configuration & Compliance Tests', () => {
  test('All resources should have proper tags', async () => {
    // Check ALB tags
    const albTags = await elbv2
      .describeTags({
        ResourceArns: [outputs.HrALBArn],
      })
      .promise();

    const albTagsMap = albTags.TagDescriptions![0].Tags!.reduce(
      (acc: any, tag: any) => {
        acc[tag.Key!] = tag.Value!;
        return acc;
      },
      {} as Record<string, string>
    );

    expect(albTagsMap).toHaveProperty('Name');
    expect(albTagsMap.Name).toContain(outputs.EnvironmentSuffix);
  });

  test('Environment-specific configurations should be correct', async () => {
    expect(outputs.EnvironmentSuffix).toBeDefined();
    expect(outputs.StackName).toContain(outputs.EnvironmentSuffix);
  });

  test('Network configurations should be secure', async () => {
    const privateSubnets = outputs.PrivateSubnetIds.split(',');

    for (const subnetId of privateSubnets) {
      const routeTables = await ec2
        .describeRouteTables({
          Filters: [
            {
              Name: 'association.subnet-id',
              Values: [subnetId.trim()],
            },
          ],
        })
        .promise();

      // Private subnets should route through NAT Gateway, not Internet Gateway
      const igwRoute = routeTables.RouteTables![0].Routes?.find((route: any) =>
        route.GatewayId?.startsWith('igw-')
      );
      expect(igwRoute).toBeUndefined();

      const natRoute = routeTables.RouteTables![0].Routes?.find((route: any) =>
        route.NatGatewayId?.startsWith('nat-')
      );
      expect(natRoute).toBeDefined();
    }
  });
});

describe('🚀 Infrastructure Validation Tests', () => {
  test('All required outputs should be available', async () => {
    const requiredOutputs = [
      'VPCId',
      'PublicSubnetIds',
      'PrivateSubnetIds',
      'HrALBDNSName',
      'HrALBArn',
      'HrTargetGroupArn',
      'HrAutoScalingGroupName',
    ];

    for (const outputKey of requiredOutputs) {
      expect(outputs[outputKey]).toBeDefined();
      expect(outputs[outputKey]).not.toBe('');
    }
  });

  test('VPC should have subnets in multiple AZs', async () => {
    const privateSubnets = outputs.PrivateSubnetIds.split(',');
    const publicSubnets = outputs.PublicSubnetIds.split(',');

    const allSubnets = [...privateSubnets, ...publicSubnets];
    const subnetDetails = await ec2
      .describeSubnets({
        SubnetIds: allSubnets.map(id => id.trim()),
      })
      .promise();

    const azs = new Set(
      subnetDetails.Subnets?.map((subnet: any) => subnet.AvailabilityZone)
    );
    expect(azs.size).toBeGreaterThanOrEqual(2);
  });

  test('Resource naming should follow conventions', async () => {
    const envSuffix = outputs.EnvironmentSuffix;

    expect(outputs.HrALBName).toContain(envSuffix);
    expect(outputs.TurnAroundPromptTableName).toContain(envSuffix);
  });
});

// Setup and teardown
beforeAll(async () => {
  // Test setup - no cleanup needed as S3 bucket removed from stack
});

afterAll(async () => {
  // Test teardown - no cleanup needed as S3 bucket removed from stack
});