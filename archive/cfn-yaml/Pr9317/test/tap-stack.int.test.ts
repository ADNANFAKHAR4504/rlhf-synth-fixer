import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import type {
  DescribeLogGroupsCommandOutput,
  LogGroup,
} from '@aws-sdk/client-cloudwatch-logs';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
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

// LocalStack endpoint configuration
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566') ||
                     process.env.LOCALSTACK === 'true';
const endpoint = isLocalStack ? process.env.AWS_ENDPOINT_URL || 'http://localhost:4566' : undefined;

const clientConfig = endpoint ? { region, endpoint } : { region };

// Initialize AWS clients
const ec2 = new EC2Client(clientConfig);
const autoScaling = new AutoScalingClient(clientConfig);
const s3 = new S3Client({ ...clientConfig, forcePathStyle: true });
const dynamodb = new DynamoDBClient(clientConfig);
const sns = new SNSClient(clientConfig);
const lambda = new LambdaClient(clientConfig);
const cloudWatch = new CloudWatchClient(clientConfig);
const cloudWatchLogs = new CloudWatchLogsClient(clientConfig);

// ---------- NEW: helper to fetch a specific log group with pagination ----------
async function getLogGroupByName(name: string): Promise<LogGroup | undefined> {
  let nextToken: string | undefined = undefined;
  do {
    const resp: DescribeLogGroupsCommandOutput = await cloudWatchLogs.send(
      new DescribeLogGroupsCommand({ logGroupNamePrefix: name, nextToken })
    );
    const match = (resp.logGroups ?? []).find(
      (lg: LogGroup) => lg.logGroupName === name
    );
    if (match) return match;
    nextToken = resp.nextToken;
  } while (nextToken);
  return undefined;
}
// -----------------------------------------------------------------------------

describe('TapStack Infrastructure Integration Tests (CloudTrail disabled)', () => {
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

    test('NAT Gateway should be operational (skipped in LocalStack)', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(outputs.NATGatewayEipAddress).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
        return;
      }

      // Skip NAT Gateway check in LocalStack as it's conditionally created
      if (isLocalStack || !outputs.NATGatewayEipAddress) {
        console.log('Skipping NAT Gateway check - not created in LocalStack environment');
        expect(true).toBe(true);
        return;
      }

      const response = await ec2.send(
        new DescribeNatGatewaysCommand({
          // SDK v3 uses singular "Filter" for NAT Gateways
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

      expect(response.RouteTables && response.RouteTables.length).toBeGreaterThanOrEqual(2);

      // LocalStack limitation: Routes array may not be populated properly
      if (!isLocalStack) {
        const routeTablesWithIgwRoute = response.RouteTables!.filter((rt) =>
          rt.Routes?.some((route) => route.GatewayId?.startsWith('igw-'))
        );
        expect(routeTablesWithIgwRoute).toHaveLength(1);
      } else {
        console.log('Skipping IGW route check - LocalStack limitation (routes not returned)');
      }

      // NAT route only exists in non-LocalStack environments
      if (!isLocalStack && outputs.NATGatewayEipAddress) {
        const routeTablesWithNatRoute = response.RouteTables!.filter((rt) =>
          rt.Routes?.some((route) => route.NatGatewayId?.startsWith('nat-'))
        );
        expect(routeTablesWithNatRoute).toHaveLength(1);
      }
    });
  });

  describe('Security Configuration', () => {
    test('security groups should have proper rules', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(outputs.VPCId).toBeDefined();
        return;
      }

      // Filter by VPC and Name tag (template sets Name tag, not GroupName)
      const response = await ec2.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [outputs.VPCId] },
            { Name: 'tag:Name', Values: [`*TapStack${environmentSuffix}-WebServer-SG*`] },
          ],
        })
      );

      expect(response.SecurityGroups && response.SecurityGroups.length).toBeGreaterThan(0);

      const sg = response.SecurityGroups![0];
      expect(sg.IpPermissions).toBeDefined();

      // LocalStack limitation: IpPermissions may not be populated properly
      if (!isLocalStack) {
        const httpRule = sg.IpPermissions!.find((rule) => rule.FromPort === 80);
        const httpsRule = sg.IpPermissions!.find((rule) => rule.FromPort === 443);
        const sshRule = sg.IpPermissions!.find((rule) => rule.FromPort === 22);

        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();
        expect(sshRule).toBeDefined();
        expect(sshRule!.IpRanges![0].CidrIp).toBe('203.0.113.0/24');
      } else {
        console.log('Skipping security group rules check - LocalStack limitation (rules not returned)');
      }
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
    test('Application S3 bucket should exist and be encrypted', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(outputs.ApplicationS3BucketName).toContain(environmentSuffix);
        return;
      }

      const bucketName = outputs.ApplicationS3BucketName;

      await expect(s3.send(new HeadBucketCommand({ Bucket: bucketName }))).resolves.toBeTruthy();

      const encryptionResponse = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

      const versioningResponse = await s3.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(versioningResponse.Status).toBe('Enabled');
    });

    test('Application S3 bucket policy should enforce HTTPS', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(outputs.ApplicationS3BucketName).toBeDefined();
        return;
      }

      const response = await s3.send(new GetBucketPolicyCommand({ Bucket: outputs.ApplicationS3BucketName }));
      const policy = JSON.parse(response.Policy!);
      const httpsStatement = policy.Statement.find(
        (stmt: any) => stmt.Sid === 'DenyInsecureConnections'
      );

      expect(httpsStatement).toBeDefined();
      expect(httpsStatement.Effect).toBe('Deny');
      expect(httpsStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
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

      // LocalStack limitation: PITR is not fully supported in Community Edition
      if (!isLocalStack) {
        expect(
          backups.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus
        ).toBe('ENABLED');
      } else {
        console.log('Skipping PITR check - LocalStack Community Edition limitation (PITR not supported)');
        // In LocalStack, PITR is always DISABLED
        expect(
          backups.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus
        ).toBe('DISABLED');
      }
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

    test('CloudWatch Log Groups should be configured (app & s3)', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(environmentSuffix).toBeDefined();
        return;
      }

      const expected = [
        `/aws/ec2/TapStack${environmentSuffix}`,
        `/aws/s3/TapStack${environmentSuffix}`,
      ];

      for (const lgName of expected) {
        const lg = await getLogGroupByName(lgName);
        expect(lg).toBeDefined();

        // LocalStack limitation: retentionInDays property not preserved
        if (!isLocalStack) {
          expect(lg!.retentionInDays).toBe(30);
        } else {
          console.log(`Skipping retention check for ${lgName} - LocalStack limitation (retention not set)`);
          // In LocalStack, retentionInDays is often null/undefined
        }
      }
    });

    test('There should be NO UnauthorizedAccess alarm (CloudTrail disabled)', async () => {
      if (process.env.NODE_ENV === 'test-mock') {
        expect(true).toBe(true);
        return;
      }

      const response = await cloudWatch.send(
        new DescribeAlarmsCommand({ AlarmNamePrefix: `TapStack${environmentSuffix}` })
      );

      const unauthorizedAlarm = (response.MetricAlarms ?? []).find((alarm) =>
        alarm.AlarmName?.includes('UnauthorizedAccess')
      );
      expect(unauthorizedAlarm).toBeUndefined();
    });
  });

  describe('Resource Tagging and Naming', () => {
    test('all resources should follow naming conventions (no CloudTrail output)', () => {
      expect(outputs.EnvironmentSuffixOut).toBe(environmentSuffix);
      expect(outputs.StackName).toContain(environmentSuffix);
      expect(outputs.AutoScalingGroupName).toContain(environmentSuffix);
      expect(outputs.DynamoDBTableName).toContain(environmentSuffix);
      expect(outputs.ApplicationS3BucketName).toContain(environmentSuffix.toLowerCase());
      // CloudTrailS3BucketName is not expected anymore
      expect(outputs.CloudTrailS3BucketName).toBeUndefined();
    });

    test('resource identifiers should be valid AWS format', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]{17}$/);
      expect(outputs.PublicSubnet1Id).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(outputs.PublicSubnet2Id).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(outputs.PrivateSubnet2Id).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(outputs.SecurityAlertsTopicArn).toMatch(/^arn:aws:sns:/);
      // NAT Gateway EIP is optional in LocalStack
      if (outputs.NATGatewayEipAddress) {
        expect(outputs.NATGatewayEipAddress).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      }
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
      // NAT Gateway EIP is optional in LocalStack
      if (!isLocalStack) {
        expect(outputs.NATGatewayEipAddress).toBeDefined();
      }
    });

    test('monitoring and alerting components should exist (without CloudTrail)', () => {
      expect(outputs.SecurityAlertsTopicArn).toBeDefined();
      expect(outputs.EnvironmentSuffixOut).toBe(environmentSuffix);
      // No CloudTrail bucket expected
      expect(outputs.CloudTrailS3BucketName).toBeUndefined();
    });
  });
});
