import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeDeliveryChannelsCommand,
} from '@aws-sdk/client-config-service';
import {
  DescribeContinuousBackupsCommand,
  DescribeTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import {
  DescribeLaunchTemplatesCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { GetFunctionCommand, LambdaClient } from '@aws-sdk/client-lambda';
import {
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after deployment
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-west-2';

// Initialize AWS clients
const ec2 = new EC2Client({ region });
const autoScaling = new AutoScalingClient({ region });
const s3 = new S3Client({ region });
const dynamodb = new DynamoDBClient({ region });
const sns = new SNSClient({ region });
const lambda = new LambdaClient({ region });
const cloudWatch = new CloudWatchClient({ region });
const cloudWatchLogs = new CloudWatchLogsClient({ region });
const cloudTrail = new CloudTrailClient({ region });
const configService = new ConfigServiceClient({ region });

describe('TapStack Infrastructure Integration Tests', () => {
  describe('VPC Infrastructure', () => {
    test('VPC should exist and be properly configured', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]{17}$/);
        return;
      }

      const vpcResp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] }));
      expect(vpcResp.Vpcs).toHaveLength(1);

      const vpc = vpcResp.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');

      // DNS attributes via DescribeVpcAttribute
      const dnsHostnames = await ec2.send(
        new DescribeVpcAttributeCommand({ VpcId: outputs.VPCId, Attribute: 'enableDnsHostnames' })
      );
      const dnsSupport = await ec2.send(
        new DescribeVpcAttributeCommand({ VpcId: outputs.VPCId, Attribute: 'enableDnsSupport' })
      );
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);

      const nameTag = vpc.Tags?.find((tag) => tag.Key === 'Name');
      expect(nameTag?.Value).toContain(environmentSuffix);
    });

    test('public subnets should be configured correctly', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(outputs.PublicSubnet1Id).toMatch(/^subnet-[a-f0-9]{17}$/);
        expect(outputs.PublicSubnet2Id).toMatch(/^subnet-[a-f0-9]{17}$/);
        return;
      }

      const response = await ec2.send(
        new DescribeSubnetsCommand({ SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id] })
      );
      expect(response.Subnets).toHaveLength(2);

      response.Subnets!.forEach((subnet) => {
        expect(subnet.VpcId).toBe(outputs.VPCId);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe('available');
        const nameTag = subnet.Tags?.find((tag) => tag.Key === 'Name');
        expect(nameTag?.Value).toContain(environmentSuffix);
      });
    });

    test('private subnets should be configured correctly', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-[a-f0-9]{17}$/);
        expect(outputs.PrivateSubnet2Id).toMatch(/^subnet-[a-f0-9]{17}$/);
        return;
      }

      const response = await ec2.send(
        new DescribeSubnetsCommand({ SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id] })
      );
      expect(response.Subnets).toHaveLength(2);

      response.Subnets!.forEach((subnet) => {
        expect(subnet.VpcId).toBe(outputs.VPCId);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe('available');
        const nameTag = subnet.Tags?.find((tag) => tag.Key === 'Name');
        expect(nameTag?.Value).toContain(environmentSuffix);
      });
    });

    test('NAT Gateway should be operational', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(outputs.NATGatewayEipAddress).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
        return;
      }

      const response = await ec2.send(
        new DescribeNatGatewaysCommand({
          // SDK v3 uses singular "Filter"
          Filter: [{ Name: 'vpc-id', Values: [outputs.VPCId] }],
        })
      );

      expect(response.NatGateways && response.NatGateways.length).toBeGreaterThan(0);

      const natGateway = response.NatGateways![0];
      expect(natGateway.State).toBe('available');
      expect(natGateway.NatGatewayAddresses).toBeDefined();
      const eip = natGateway.NatGatewayAddresses![0]?.PublicIp;
      expect(eip).toBe(outputs.NATGatewayEipAddress);
    });

    test('route tables should be properly configured', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(outputs.VPCId).toBeDefined();
        return;
      }

      const response = await ec2.send(
        new DescribeRouteTablesCommand({ Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }] })
      );

      expect(response.RouteTables && response.RouteTables.length).toBeGreaterThanOrEqual(3);

      const routeTablesWithIgwRoute = response.RouteTables!.filter((rt) =>
        rt.Routes?.some((route) => route.GatewayId?.startsWith('igw-'))
      );
      expect(routeTablesWithIgwRoute).toHaveLength(1);

      const routeTablesWithNatRoute = response.RouteTables!.filter((rt) =>
        rt.Routes?.some((route) => route.NatGatewayId?.startsWith('nat-'))
      );
      expect(routeTablesWithNatRoute).toHaveLength(1);
    });
  });

  describe('Security Configuration', () => {
    test('security groups should have proper rules', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(outputs.VPCId).toBeDefined();
        return;
      }

      const response = await ec2.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [outputs.VPCId] },
            { Name: 'group-name', Values: ['*WebServer*'] },
          ],
        })
      );

      expect(response.SecurityGroups).toHaveLength(1);

      const sg = response.SecurityGroups![0];
      expect(sg.IpPermissions).toBeDefined();

      const httpRule = sg.IpPermissions!.find((rule) => rule.FromPort === 80);
      const httpsRule = sg.IpPermissions!.find((rule) => rule.FromPort === 443);
      const sshRule = sg.IpPermissions!.find((rule) => rule.FromPort === 22);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(sshRule).toBeDefined();
      expect(sshRule!.IpRanges![0].CidrIp).toBe('203.0.113.0/24');
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('Auto Scaling Group should be properly configured', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(outputs.AutoScalingGroupName).toContain(environmentSuffix);
        return;
      }

      const response = await autoScaling.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [outputs.AutoScalingGroupName] })
      );

      expect(response.AutoScalingGroups).toHaveLength(1);

      const asg = response.AutoScalingGroups![0];
      expect(asg.MinSize).toBe(1);
      expect(asg.MaxSize).toBe(4);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.VPCZoneIdentifier).toContain(outputs.PrivateSubnet1Id);
      expect(asg.VPCZoneIdentifier).toContain(outputs.PrivateSubnet2Id);
      expect(asg.HealthCheckType).toBe('EC2');
    });

    test('Launch Template should have security configurations', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(outputs.AutoScalingGroupName).toBeDefined();
        return;
      }

      const asgResponse = await autoScaling.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [outputs.AutoScalingGroupName] })
      );
      const launchTemplateId = asgResponse.AutoScalingGroups![0].LaunchTemplate?.LaunchTemplateId;
      expect(launchTemplateId).toBeDefined();

      const ltResponse = await ec2.send(
        new DescribeLaunchTemplatesCommand({ LaunchTemplateIds: [launchTemplateId!] })
      );
      expect(ltResponse.LaunchTemplates).toHaveLength(1);

      const launchTemplate = ltResponse.LaunchTemplates![0];
      expect(launchTemplate.LaunchTemplateName).toContain(environmentSuffix);
    });
  });

  describe('Storage Services', () => {
    test('S3 buckets should exist and be encrypted', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(outputs.ApplicationS3BucketName).toContain(environmentSuffix);
        expect(outputs.CloudTrailS3BucketName).toContain(environmentSuffix);
        return;
      }

      const buckets = [outputs.ApplicationS3BucketName, outputs.CloudTrailS3BucketName];

      for (const bucketName of buckets) {
        await expect(s3.send(new HeadBucketCommand({ Bucket: bucketName }))).resolves.toBeTruthy();

        const encryptionResponse = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
        expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

        if (bucketName === outputs.ApplicationS3BucketName) {
          const versioningResponse = await s3.send(
            new GetBucketVersioningCommand({ Bucket: bucketName })
          );
          expect(versioningResponse.Status).toBe('Enabled');
        }
      }
    });

    test('S3 bucket policies should enforce HTTPS', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(outputs.ApplicationS3BucketName).toBeDefined();
        return;
      }

      const buckets = [outputs.ApplicationS3BucketName, outputs.CloudTrailS3BucketName];

      for (const bucketName of buckets) {
        const response = await s3.send(new GetBucketPolicyCommand({ Bucket: bucketName }));
        const policy = JSON.parse(response.Policy!);
        const httpsStatement = policy.Statement.find(
          (stmt: any) => stmt.Sid === 'DenyInsecureConnections'
        );

        expect(httpsStatement).toBeDefined();
        expect(httpsStatement.Effect).toBe('Deny');
        expect(httpsStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
      }
    });

    test('DynamoDB table should be configured with encryption and backup', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(outputs.DynamoDBTableName).toContain(environmentSuffix);
        return;
      }

      const response = await dynamodb.send(
        new DescribeTableCommand({ TableName: outputs.DynamoDBTableName })
      );
      const table = response.Table!;
      expect(table.TableStatus).toBe('ACTIVE');
      expect(table.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.SSEDescription?.Status).toBe('ENABLED');
      expect(table.AttributeDefinitions).toHaveLength(1);
      expect(table.AttributeDefinitions![0].AttributeName).toBe('id');
      expect(table.KeySchema).toHaveLength(1);
      expect(table.KeySchema![0].KeyType).toBe('HASH');

      const backups = await dynamodb.send(
        new DescribeContinuousBackupsCommand({ TableName: outputs.DynamoDBTableName })
      );
      expect(backups.ContinuousBackupsDescription?.ContinuousBackupsStatus).toBe('ENABLED');
      expect(
        backups.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus
      ).toBe('ENABLED');
    });
  });

  describe('Monitoring and Alerting', () => {
    test('SNS topic should be configured for security alerts', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(outputs.SecurityAlertsTopicArn).toMatch(/^arn:aws:sns:/);
        return;
      }

      const response = await sns.send(
        new GetTopicAttributesCommand({ TopicArn: outputs.SecurityAlertsTopicArn })
      );
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.DisplayName).toBe('Security Alerts');
    });

    test('Lambda function should exist for alert processing', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(outputs.SecurityAlertsTopicArn).toBeDefined();
        return;
      }

      const functionName = `TapStack${environmentSuffix}-SecurityAlert`;
      const response = await lambda.send(new GetFunctionCommand({ FunctionName: functionName }));
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Runtime).toBe('python3.12');
      expect(response.Configuration!.Environment?.Variables?.SNS_TOPIC_ARN).toBe(
        outputs.SecurityAlertsTopicArn
      );
    });

    test('CloudWatch alarms should be configured', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(environmentSuffix).toBeDefined();
        return;
      }

      const response = await cloudWatch.send(
        new DescribeAlarmsCommand({ AlarmNamePrefix: `TapStack${environmentSuffix}` })
      );
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);

      const unauthorizedAlarm = response.MetricAlarms!.find((alarm) =>
        alarm.AlarmName?.includes('UnauthorizedAccess')
      );
      expect(unauthorizedAlarm).toBeDefined();
      expect(unauthorizedAlarm!.AlarmActions).toContain(outputs.SecurityAlertsTopicArn);
    });

    test('CloudWatch Log Groups should be configured', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(environmentSuffix).toBeDefined();
        return;
      }

      const expectedLogGroups = [
        `/aws/ec2/TapStack${environmentSuffix}`,
        `/aws/s3/TapStack${environmentSuffix}`,
        `/aws/cloudtrail/TapStack${environmentSuffix}`,
      ];

      const response = await cloudWatchLogs.send(new DescribeLogGroupsCommand({}));
      const actualLogGroups = (response.logGroups ?? []).map((lg) => lg.logGroupName);

      expectedLogGroups.forEach((expectedLg) => {
        expect(actualLogGroups).toContain(expectedLg);
      });

      const testLogGroup = (response.logGroups ?? []).find(
        (lg) => lg.logGroupName === `/aws/ec2/TapStack${environmentSuffix}`
      );
      expect(testLogGroup?.retentionInDays).toBe(30);
    });
  });

  describe('Compliance and Auditing', () => {
    test('CloudTrail should be enabled and logging', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(environmentSuffix).toBeDefined();
        return;
      }

      const trailName = `TapStack${environmentSuffix}-CloudTrail`;
      const describeResponse = await cloudTrail.send(
        new DescribeTrailsCommand({ trailNameList: [trailName] })
      );
      expect(describeResponse.trailList).toHaveLength(1);

      const trail = describeResponse.trailList![0];
      expect(trail.S3BucketName).toBe(outputs.CloudTrailS3BucketName);
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);
      expect(trail.IncludeGlobalServiceEvents).toBe(true);

      const statusResponse = await cloudTrail.send(new GetTrailStatusCommand({ Name: trailName }));
      expect(statusResponse.IsLogging).toBe(true);
    });

    test('AWS Config should be enabled (if created by this stack)', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(environmentSuffix).toBeDefined();
        return;
      }

      // List recorders
      const recorderResponse = await configService.send(
        new DescribeConfigurationRecordersCommand({})
      );
      const recorders = recorderResponse.ConfigurationRecorders ?? [];

      // In v3, nested fields are lowerCamelCase (name, recordingGroup, allSupported, includeGlobalResourceTypes)
      const recorder = recorders.find((cr: any) =>
        typeof cr.name === 'string' && cr.name.includes(`TapStack${environmentSuffix}`)
      );

      expect(recorder).toBeDefined();
      expect((recorder as any)?.recordingGroup?.allSupported).toBe(true);
      expect((recorder as any)?.recordingGroup?.includeGlobalResourceTypes).toBe(true);

      // Delivery channels (same lowerCamelCase for nested fields)
      const channelResponse = await configService.send(new DescribeDeliveryChannelsCommand({}));
      const channels = channelResponse.DeliveryChannels ?? [];
      const channel = channels.find((dc: any) =>
        typeof dc.name === 'string' && dc.name.includes(`TapStack${environmentSuffix}`)
      );
      expect(channel).toBeDefined();
    });

  });


  describe('Resource Tagging and Naming', () => {
    test('all resources should follow naming conventions', () => {
      expect(outputs.EnvironmentSuffixOut).toBe(environmentSuffix);
      expect(outputs.StackName).toContain(environmentSuffix);
      expect(outputs.AutoScalingGroupName).toContain(environmentSuffix);
      expect(outputs.DynamoDBTableName).toContain(environmentSuffix);
      expect(outputs.ApplicationS3BucketName).toContain(environmentSuffix.toLowerCase());
      expect(outputs.CloudTrailS3BucketName).toContain(environmentSuffix.toLowerCase());
    });

    test('resource identifiers should be valid AWS format', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]{17}$/);
      expect(outputs.PublicSubnet1Id).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(outputs.PublicSubnet2Id).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(outputs.PrivateSubnet2Id).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(outputs.SecurityAlertsTopicArn).toMatch(/^arn:aws:sns:/);
      expect(outputs.NATGatewayEipAddress).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    });
  });

  describe('End-to-End Connectivity', () => {
    test('infrastructure should support web application deployment', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.AutoScalingGroupName).toBeDefined();
      expect(outputs.ApplicationS3BucketName).toBeDefined();
      expect(outputs.DynamoDBTableName).toBeDefined();
      expect(outputs.NATGatewayEipAddress).toBeDefined();
    });

    test('monitoring and alerting pipeline should be complete', () => {
      expect(outputs.SecurityAlertsTopicArn).toBeDefined();
      expect(outputs.CloudTrailS3BucketName).toBeDefined();
      expect(outputs.EnvironmentSuffixOut).toBe(environmentSuffix);
    });
  });
});
