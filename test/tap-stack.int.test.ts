import fs from 'fs';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  SNSClient,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synth101000780';
const stackName = `TapStack${environmentSuffix}`;

let outputs: Record<string, string> = {};
let stackResources: any[] = [];

const cfnClient = new CloudFormationClient({ region });
const ec2Client = new EC2Client({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const asgClient = new AutoScalingClient({ region });
const snsClient = new SNSClient({ region });
const cwClient = new CloudWatchClient({ region });

describe('TapStack Integration Tests - Multi-Environment Infrastructure', () => {
  beforeAll(async () => {
    try {
      // Load outputs if file exists
      if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
        outputs = JSON.parse(
          fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
        );
      } else {
        // Fallback: get outputs from CloudFormation
        const stackResponse = await cfnClient.send(
          new DescribeStacksCommand({ StackName: stackName })
        );
        const stack = stackResponse.Stacks?.[0];
        if (stack?.Outputs) {
          stack.Outputs.forEach(output => {
            outputs[output.OutputKey!] = output.OutputValue!;
          });
        }
      }

      // Get stack resources
      const resourcesResponse = await cfnClient.send(
        new DescribeStackResourcesCommand({ StackName: stackName })
      );
      stackResources = resourcesResponse.StackResources || [];
    } catch (error) {
      console.error('Setup error:', error);
    }
  }, 30000);

  describe('Stack Deployment', () => {
    test('stack should exist and be in CREATE_COMPLETE state', async () => {
      const response = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks).toHaveLength(1);
      expect(response.Stacks![0].StackStatus).toBe('CREATE_COMPLETE');
    });

    test('stack should have all expected outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'ALBDNSName',
        'RDSEndpoint',
        'LogsBucketName',
        'StaticContentBucketName',
        'SNSTopicArn',
      ];

      expectedOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('all 34 resources should be created', () => {
      expect(stackResources).toHaveLength(34);
    });
  });

  describe('VPC and Networking', () => {
    test('VPC should exist with correct CIDR block', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toMatch(/^10\.\d+\.\d+\.\d+\/16$/);
    });

    test('should have two public and two private subnets', async () => {
      const vpcId = outputs.VPCId;
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(4);

      const publicSubnets = response.Subnets!.filter(subnet =>
        subnet.Tags?.some(
          tag => tag.Key === 'Type' && tag.Value === 'Public'
        )
      );
      const privateSubnets = response.Subnets!.filter(subnet =>
        subnet.Tags?.some(
          tag => tag.Key === 'Type' && tag.Value === 'Private'
        )
      );

      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);
    });

    test('NAT Gateway should exist and be available', async () => {
      const vpcId = outputs.VPCId;
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
      expect(response.NatGateways![0].State).toBe('available');
    });

    test('security groups should implement least privilege', async () => {
      const vpcId = outputs.VPCId;
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      const securityGroups = response.SecurityGroups || [];

      // Find ALB security group
      const albSg = securityGroups.find(sg =>
        sg.GroupName?.includes('alb-sg')
      );
      expect(albSg).toBeDefined();
      expect(
        albSg!.IpPermissions?.some(
          rule => rule.FromPort === 80 || rule.FromPort === 443
        )
      ).toBe(true);

      // Find EC2 security group
      const ec2Sg = securityGroups.find(sg =>
        sg.GroupName?.includes('ec2-sg')
      );
      expect(ec2Sg).toBeDefined();
      expect(ec2Sg!.IpPermissions).toHaveLength(1);
      expect(ec2Sg!.IpPermissions![0].FromPort).toBe(80);

      // Find RDS security group
      const rdsSg = securityGroups.find(sg =>
        sg.GroupName?.includes('rds-sg')
      );
      expect(rdsSg).toBeDefined();
      expect(rdsSg!.IpPermissions).toHaveLength(1);
      expect(rdsSg!.IpPermissions![0].FromPort).toBe(3306);
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB should exist and be active', async () => {
      const albDns = outputs.ALBDNSName;
      expect(albDns).toBeDefined();

      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({})
      );

      const alb = response.LoadBalancers?.find(lb =>
        lb.DNSName === albDns
      );

      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe('active');
      expect(alb!.Scheme).toBe('internet-facing');
      expect(alb!.Type).toBe('application');
    });

    test('ALB should have target group configured', async () => {
      const response = await elbClient.send(
        new DescribeTargetGroupsCommand({})
      );

      const targetGroup = response.TargetGroups?.find(tg =>
        tg.TargetGroupName?.includes(environmentSuffix)
      );

      expect(targetGroup).toBeDefined();
      expect(targetGroup!.Protocol).toBe('HTTP');
      expect(targetGroup!.Port).toBe(80);
      expect(targetGroup!.HealthCheckEnabled).toBe(true);
    });

    test('target group should monitor target health', async () => {
      const response = await elbClient.send(
        new DescribeTargetGroupsCommand({})
      );

      const targetGroup = response.TargetGroups?.find(tg =>
        tg.TargetGroupName?.includes(environmentSuffix)
      );

      if (targetGroup?.TargetGroupArn) {
        const healthResponse = await elbClient.send(
          new DescribeTargetHealthCommand({
            TargetGroupArn: targetGroup.TargetGroupArn,
          })
        );

        expect(healthResponse.TargetHealthDescriptions).toBeDefined();
      }
    });
  });

  describe('Auto Scaling Group', () => {
    test('ASG should exist with correct configuration', async () => {
      const response = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({})
      );

      const asg = response.AutoScalingGroups?.find(group =>
        group.AutoScalingGroupName?.includes(environmentSuffix)
      );

      expect(asg).toBeDefined();
      expect(asg!.MinSize).toBe(1);
      expect(asg!.HealthCheckType).toBe('ELB');
      expect(asg!.HealthCheckGracePeriod).toBe(300);
    });

    test('ASG instances should be in private subnets', async () => {
      const response = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({})
      );

      const asg = response.AutoScalingGroups?.find(group =>
        group.AutoScalingGroupName?.includes(environmentSuffix)
      );

      expect(asg).toBeDefined();
      expect(asg!.VPCZoneIdentifier).toBeDefined();

      const subnetIds = asg!.VPCZoneIdentifier!.split(',');
      const subnetsResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      subnetsResponse.Subnets?.forEach(subnet => {
        const typeTag = subnet.Tags?.find(tag => tag.Key === 'Type');
        expect(typeTag?.Value).toBe('Private');
      });
    });
  });

  describe('RDS Database', () => {
    test('RDS instance should exist and be available', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const dbInstance = response.DBInstances?.find(db =>
        db.DBInstanceIdentifier?.includes(environmentSuffix)
      );

      expect(dbInstance).toBeDefined();
      expect(dbInstance!.DBInstanceStatus).toBe('available');
      expect(dbInstance!.Engine).toBe('mysql');
      expect(dbInstance!.EngineVersion).toMatch(/^8\.0/);
    });

    test('RDS should have encryption enabled', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const dbInstance = response.DBInstances?.find(db =>
        db.DBInstanceIdentifier?.includes(environmentSuffix)
      );

      expect(dbInstance!.StorageEncrypted).toBe(true);
    });

    test('RDS should have automated backups configured', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const dbInstance = response.DBInstances?.find(db =>
        db.DBInstanceIdentifier?.includes(environmentSuffix)
      );

      expect(dbInstance!.BackupRetentionPeriod).toBe(7);
      expect(dbInstance!.PreferredBackupWindow).toBeDefined();
    });

    test('RDS should not be publicly accessible', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const dbInstance = response.DBInstances?.find(db =>
        db.DBInstanceIdentifier?.includes(environmentSuffix)
      );

      expect(dbInstance!.PubliclyAccessible).toBe(false);
    });

    test('RDS endpoint should match output', () => {
      const rdsEndpoint = outputs.RDSEndpoint;
      expect(rdsEndpoint).toBeDefined();
      expect(rdsEndpoint).toContain('.rds.amazonaws.com');
    });
  });

  describe('S3 Buckets', () => {
    test('logs bucket should exist and be accessible', async () => {
      const bucketName = outputs.LogsBucketName;
      expect(bucketName).toBeDefined();

      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.not.toThrow();
    });

    test('logs bucket should have versioning enabled', async () => {
      const bucketName = outputs.LogsBucketName;
      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('logs bucket should have encryption configured', async () => {
      const bucketName = outputs.LogsBucketName;
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('logs bucket should have lifecycle policies', async () => {
      const bucketName = outputs.LogsBucketName;
      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })
      );

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const transitionRule = response.Rules!.find(
        rule => rule.Id === 'TransitionToIA'
      );
      expect(transitionRule).toBeDefined();
      expect(transitionRule!.Status).toBe('Enabled');
    });

    test('static content bucket should exist with versioning and encryption', async () => {
      const bucketName = outputs.StaticContentBucketName;
      expect(bucketName).toBeDefined();

      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.not.toThrow();

      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(versioningResponse.Status).toBe('Enabled');

      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
    });
  });

  describe('Monitoring and Alarms', () => {
    test('SNS topic should exist', () => {
      const snsTopicArn = outputs.SNSTopicArn;
      expect(snsTopicArn).toBeDefined();
      expect(snsTopicArn).toContain('arn:aws:sns');
      expect(snsTopicArn).toContain(region);
    });

    test('SNS topic should have email subscription', async () => {
      const snsTopicArn = outputs.SNSTopicArn;
      const response = await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: snsTopicArn })
      );

      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions!.length).toBeGreaterThan(0);
      expect(
        response.Subscriptions!.some(sub => sub.Protocol === 'email')
      ).toBe(true);
    });

    test('CPU alarm should be configured', async () => {
      const response = await cwClient.send(
        new DescribeAlarmsCommand({})
      );

      const cpuAlarm = response.MetricAlarms?.find(alarm =>
        alarm.AlarmName?.includes(environmentSuffix) &&
        alarm.AlarmName?.includes('cpu')
      );

      expect(cpuAlarm).toBeDefined();
      expect(cpuAlarm!.MetricName).toBe('CPUUtilization');
      expect(cpuAlarm!.Threshold).toBe(80);
      expect(cpuAlarm!.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('CPU alarm should publish to SNS topic', async () => {
      const snsTopicArn = outputs.SNSTopicArn;
      const response = await cwClient.send(
        new DescribeAlarmsCommand({})
      );

      const cpuAlarm = response.MetricAlarms?.find(alarm =>
        alarm.AlarmName?.includes(environmentSuffix) &&
        alarm.AlarmName?.includes('cpu')
      );

      expect(cpuAlarm).toBeDefined();
      expect(cpuAlarm!.AlarmActions).toContain(snsTopicArn);
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('all resources should include environment suffix in naming', () => {
      stackResources.forEach(resource => {
        const physicalId = resource.PhysicalResourceId;
        if (physicalId && typeof physicalId === 'string') {
          if (
            !physicalId.startsWith('arn:') &&
            !physicalId.startsWith('subnet-') &&
            !physicalId.startsWith('sg-') &&
            !physicalId.startsWith('vpc-') &&
            !physicalId.startsWith('igw-') &&
            !physicalId.startsWith('rtb-') &&
            !physicalId.startsWith('nat-') &&
            !physicalId.startsWith('eni-') &&
            !physicalId.startsWith('eipalloc-')
          ) {
            expect(physicalId.toLowerCase()).toContain(
              environmentSuffix.toLowerCase()
            );
          }
        }
      });
    });
  });

  describe('Multi-Environment Consistency', () => {
    test('infrastructure should support parameterized deployment', async () => {
      const response = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );

      const stack = response.Stacks![0];
      const parameters = stack.Parameters || [];

      const envSuffixParam = parameters.find(
        p => p.ParameterKey === 'EnvironmentSuffix'
      );
      expect(envSuffixParam).toBeDefined();
      expect(envSuffixParam!.ParameterValue).toBe(environmentSuffix);
    });

    test('environment-specific configurations should be applied', async () => {
      const response = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );

      const stack = response.Stacks![0];
      const parameters = stack.Parameters || [];

      const envNameParam = parameters.find(
        p => p.ParameterKey === 'EnvironmentName'
      );
      expect(envNameParam).toBeDefined();
      expect(['dev', 'staging', 'prod']).toContain(
        envNameParam!.ParameterValue
      );
    });
  });
});
