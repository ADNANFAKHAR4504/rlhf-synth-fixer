import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListBucketsCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  APIGatewayClient,
  GetRestApisCommand,
  GetApiKeysCommand,
  GetUsagePlansCommand,
} from '@aws-sdk/client-api-gateway';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcEndpointsCommand,
} from '@aws-sdk/client-ec2';
import {
  WAFV2Client,
  GetWebACLCommand,
  ListWebACLsCommand,
} from '@aws-sdk/client-wafv2';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  ListTopicsCommand,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListRulesCommand,
} from '@aws-sdk/client-eventbridge';
import {
  IAMClient,
  GetRoleCommand,
  GetPolicyCommand,
} from '@aws-sdk/client-iam';
import { fromIni } from '@aws-sdk/credential-provider-ini';

// Get outputs from flat-outputs.json
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Get environment suffix and region from environment variables
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';
const awsProfile = process.env.AWS_PROFILE;

// Configure AWS SDK client options
const clientConfig: any = { region };
if (awsProfile) {
  clientConfig.credentials = fromIni({ profile: awsProfile });
}

// Initialize AWS SDK clients
const s3Client = new S3Client(clientConfig);
const lambdaClient = new LambdaClient(clientConfig);
const cwLogsClient = new CloudWatchLogsClient(clientConfig);
const apiGatewayClient = new APIGatewayClient(clientConfig);
const kmsClient = new KMSClient(clientConfig);
const ec2Client = new EC2Client(clientConfig);
const wafClient = new WAFV2Client(clientConfig);
const cloudWatchClient = new CloudWatchClient(clientConfig);
const snsClient = new SNSClient(clientConfig);
const eventBridgeClient = new EventBridgeClient(clientConfig);
const iamClient = new IAMClient(clientConfig);

describe('Secure Data Analytics Platform - Integration Tests', () => {
  describe('Environment Configuration', () => {
    test('should have valid environment suffix', () => {
      expect(environmentSuffix).toBeDefined();
      expect(typeof environmentSuffix).toBe('string');
      expect(environmentSuffix.length).toBeGreaterThan(0);
    });

    test('should have valid AWS region', () => {
      expect(region).toBeDefined();
      expect(typeof region).toBe('string');
      expect(region).toMatch(/^[a-z]{2}-[a-z]+-\d+$/);
    });

    test('should have flat-outputs.json file', () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS key output', () => {
      expect(outputs.KmsKeyArn).toBeDefined();
      expect(outputs.KmsKeyArn).toMatch(/^arn:aws:kms:/);
    });

    test('KMS key should exist and be enabled', async () => {
      const keyId = outputs.KmsKeyArn.split('/').pop();
      const keyDescription = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: keyId })
      );

      expect(keyDescription.KeyMetadata).toBeDefined();
      expect(keyDescription.KeyMetadata?.KeyState).toBe('Enabled');
      expect(keyDescription.KeyMetadata?.Description).toContain('encryption');
    });

    test('KMS key should have rotation enabled', async () => {
      const keyId = outputs.KmsKeyArn.split('/').pop();
      const rotationStatus = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: keyId })
      );
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    });
  });

  describe('VPC and Network Configuration', () => {
    test('should have VPC ID output', () => {
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.VpcId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('VPC should exist and be available', async () => {
      const vpcsResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VpcId],
        })
      );

      expect(vpcsResponse.Vpcs).toHaveLength(1);
      const vpc = vpcsResponse.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.VpcId).toBe(outputs.VpcId);
    });

    test('VPC should have exactly 3 private subnets', async () => {
      const subnetsResponse = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VpcId],
            },
          ],
        })
      );

      expect(subnetsResponse.Subnets).toHaveLength(3);
      subnetsResponse.Subnets?.forEach((subnet) => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('VPC should have S3 gateway endpoint', async () => {
      const endpointsResponse = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VpcId],
            },
            {
              Name: 'service-name',
              Values: [`com.amazonaws.${region}.s3`],
            },
          ],
        })
      );

      expect(endpointsResponse.VpcEndpoints).toBeDefined();
      expect(endpointsResponse.VpcEndpoints!.length).toBeGreaterThanOrEqual(1);
      const s3Endpoint = endpointsResponse.VpcEndpoints![0];
      expect(s3Endpoint.State).toBe('available');
      expect(s3Endpoint.VpcEndpointType).toBe('Gateway');
    });

    test('VPC should have DynamoDB gateway endpoint', async () => {
      const endpointsResponse = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VpcId],
            },
            {
              Name: 'service-name',
              Values: [`com.amazonaws.${region}.dynamodb`],
            },
          ],
        })
      );

      expect(endpointsResponse.VpcEndpoints).toBeDefined();
      expect(endpointsResponse.VpcEndpoints!.length).toBeGreaterThanOrEqual(1);
      const dynamoEndpoint = endpointsResponse.VpcEndpoints![0];
      expect(dynamoEndpoint.State).toBe('available');
      expect(dynamoEndpoint.VpcEndpointType).toBe('Gateway');
    });

    test('VPC should have Lambda interface endpoint', async () => {
      const endpointsResponse = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VpcId],
            },
            {
              Name: 'service-name',
              Values: [`com.amazonaws.${region}.lambda`],
            },
          ],
        })
      );

      expect(endpointsResponse.VpcEndpoints).toBeDefined();
      expect(endpointsResponse.VpcEndpoints!.length).toBeGreaterThanOrEqual(1);
      const lambdaEndpoint = endpointsResponse.VpcEndpoints![0];
      expect(lambdaEndpoint.State).toBe('available');
      expect(lambdaEndpoint.VpcEndpointType).toBe('Interface');
    });

    test('should have Lambda security group', async () => {
      expect(outputs.LambdaSecurityGroupId).toBeDefined();

      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.LambdaSecurityGroupId],
        })
      );

      expect(sgResponse.SecurityGroups).toHaveLength(1);
      const sg = sgResponse.SecurityGroups![0];
      expect(sg.GroupName).toContain('Lambda');
      expect(sg.VpcId).toBe(outputs.VpcId);
    });

    test('should have endpoint security group', async () => {
      expect(outputs.EndpointSecurityGroupId).toBeDefined();

      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.EndpointSecurityGroupId],
        })
      );

      expect(sgResponse.SecurityGroups).toHaveLength(1);
      const sg = sgResponse.SecurityGroups![0];
      expect(sg.GroupName).toContain('Endpoint');
      expect(sg.VpcId).toBe(outputs.VpcId);
    });
  });

  describe('S3 Buckets', () => {
    test('should have all bucket name outputs', () => {
      expect(outputs.RawDataBucketName).toBeDefined();
      expect(outputs.ProcessedDataBucketName).toBeDefined();
      expect(outputs.AuditLogsBucketName).toBeDefined();
    });

    test('all three buckets should exist', async () => {
      const bucketsResponse = await s3Client.send(new ListBucketsCommand({}));
      const bucketNames = bucketsResponse.Buckets?.map((b) => b.Name) || [];

      expect(bucketNames).toContain(outputs.RawDataBucketName);
      expect(bucketNames).toContain(outputs.ProcessedDataBucketName);
      expect(bucketNames).toContain(outputs.AuditLogsBucketName);
    });

    test('raw data bucket should have KMS encryption', async () => {
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: outputs.RawDataBucketName,
        })
      );

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    });

    test('raw data bucket should have versioning enabled', async () => {
      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: outputs.RawDataBucketName,
        })
      );

      expect(versioningResponse.Status).toBe('Enabled');
    });

    test('processed data bucket should have KMS encryption', async () => {
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: outputs.ProcessedDataBucketName,
        })
      );

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    });

    test('audit logs bucket should have versioning enabled', async () => {
      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: outputs.AuditLogsBucketName,
        })
      );

      expect(versioningResponse.Status).toBe('Enabled');
    });

    test('should successfully upload encrypted object to raw data bucket', async () => {
      const testKey = `input/integration-test-${Date.now()}.txt`;
      const testData = 'Integration test data - encrypted upload';

      await s3Client.send(
        new PutObjectCommand({
          Bucket: outputs.RawDataBucketName,
          Key: testKey,
          Body: testData,
          ServerSideEncryption: 'aws:kms',
        })
      );

      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: outputs.RawDataBucketName,
          Key: testKey,
        })
      );

      expect(getResponse.ServerSideEncryption).toBe('aws:kms');

      // Cleanup
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: outputs.RawDataBucketName,
          Key: testKey,
        })
      );
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have data processor role ARN output', () => {
      expect(outputs.DataProcessorRoleArn).toBeDefined();
      expect(outputs.DataProcessorRoleArn).toMatch(/^arn:aws:iam::/);
    });

    test('should have permission boundary ARN output', () => {
      expect(outputs.PermissionBoundaryArn).toBeDefined();
      expect(outputs.PermissionBoundaryArn).toMatch(/^arn:aws:iam::/);
    });

    test('data processor role should exist', async () => {
      const roleName = outputs.DataProcessorRoleArn.split('/').pop();
      const roleResponse = await iamClient.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role?.RoleName).toBe(roleName);
      expect(roleResponse.Role?.PermissionsBoundary).toBeDefined();
    });
  });

  describe('Lambda Function', () => {
    test('should have Lambda function name output', () => {
      expect(outputs.DataProcessorFunctionName).toBeDefined();
      expect(outputs.DataProcessorFunctionName).toContain('data-processor');
    });

    test('Lambda function should exist and be configured correctly', async () => {
      const functionResponse = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: outputs.DataProcessorFunctionName,
        })
      );

      expect(functionResponse.Configuration).toBeDefined();
      expect(functionResponse.Configuration?.Runtime).toMatch(/nodejs20/);
      expect(functionResponse.Configuration?.Timeout).toBe(300);
      expect(functionResponse.Configuration?.MemorySize).toBe(512);
      expect(functionResponse.Configuration?.State).toBe('Active');
    });

    test('Lambda function should be in VPC', async () => {
      const functionResponse = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.DataProcessorFunctionName,
        })
      );

      expect(functionResponse.VpcConfig).toBeDefined();
      expect(functionResponse.VpcConfig?.VpcId).toBe(outputs.VpcId);
      expect(functionResponse.VpcConfig?.SubnetIds).toBeDefined();
      expect(functionResponse.VpcConfig?.SubnetIds!.length).toBeGreaterThan(0);
      expect(functionResponse.VpcConfig?.SecurityGroupIds).toContain(outputs.LambdaSecurityGroupId);
    });

    test('Lambda function should have correct environment variables', async () => {
      const functionResponse = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: outputs.DataProcessorFunctionName,
        })
      );

      const env = functionResponse.Environment?.Variables;
      expect(env).toBeDefined();
      expect(env?.RAW_DATA_BUCKET).toBe(outputs.RawDataBucketName);
      expect(env?.PROCESSED_DATA_BUCKET).toBe(outputs.ProcessedDataBucketName);
      expect(env?.KMS_KEY_ID).toBeDefined();
    });

    test('Lambda function should be invocable', async () => {
      const invokeResponse = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: outputs.DataProcessorFunctionName,
          Payload: Buffer.from(
            JSON.stringify({
              Records: [],
            })
          ),
        })
      );

      expect(invokeResponse.StatusCode).toBe(200);
      expect(invokeResponse.FunctionError).toBeUndefined();

      const payload = JSON.parse(
        Buffer.from(invokeResponse.Payload!).toString()
      );
      expect(payload.statusCode).toBe(200);
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have log group name outputs', () => {
      expect(outputs.DataProcessorLogGroupName).toBeDefined();
      expect(outputs.ApiGatewayLogGroupName).toBeDefined();
    });

    test('Lambda log group should exist with correct configuration', async () => {
      const logGroupsResponse = await cwLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.DataProcessorLogGroupName,
        })
      );

      const lambdaLogGroup = logGroupsResponse.logGroups?.find(
        (lg) => lg.logGroupName === outputs.DataProcessorLogGroupName
      );

      expect(lambdaLogGroup).toBeDefined();
      expect(lambdaLogGroup?.retentionInDays).toBe(90);
      expect(lambdaLogGroup?.kmsKeyId).toBeDefined();
    });

    test('API Gateway log group should exist with correct configuration', async () => {
      const logGroupsResponse = await cwLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.ApiGatewayLogGroupName,
        })
      );

      const apiLogGroup = logGroupsResponse.logGroups?.find(
        (lg) => lg.logGroupName === outputs.ApiGatewayLogGroupName
      );

      expect(apiLogGroup).toBeDefined();
      expect(apiLogGroup?.retentionInDays).toBe(90);
      expect(apiLogGroup?.kmsKeyId).toBeDefined();
    });
  });

  describe('API Gateway', () => {
    test('should have API endpoint and key outputs', () => {
      expect(outputs.ApiEndpoint).toBeDefined();
      expect(outputs.ApiKeyId).toBeDefined();
    });

    test('REST API should exist', async () => {
      const apisResponse = await apiGatewayClient.send(
        new GetRestApisCommand({})
      );

      const api = apisResponse.items?.find((a) =>
        a.name?.includes(`analytics-api-${environmentSuffix}`)
      );

      expect(api).toBeDefined();
      expect(api?.endpointConfiguration?.types).toContain('REGIONAL');
    });

    test('API key should exist and be enabled', async () => {
      const apiKeysResponse = await apiGatewayClient.send(
        new GetApiKeysCommand({
          includeValues: false,
        })
      );

      const apiKey = apiKeysResponse.items?.find(
        (k) => k.id === outputs.ApiKeyId
      );

      expect(apiKey).toBeDefined();
      expect(apiKey?.enabled).toBe(true);
      expect(apiKey?.name).toContain(`analytics-api-key-${environmentSuffix}`);
    });

    test('usage plan should exist with correct throttling', async () => {
      const usagePlansResponse = await apiGatewayClient.send(
        new GetUsagePlansCommand({})
      );

      const usagePlan = usagePlansResponse.items?.find((up) =>
        up.name?.includes(`analytics-usage-plan-${environmentSuffix}`)
      );

      expect(usagePlan).toBeDefined();
      expect(usagePlan?.throttle).toBeDefined();
      expect(usagePlan?.throttle?.rateLimit).toBe(100);
      expect(usagePlan?.throttle?.burstLimit).toBe(200);
    });

    test('API endpoint should require authentication', async () => {
      const apiUrl = outputs.ApiEndpoint;
      const response = await fetch(`${apiUrl}data`, {
        method: 'GET',
      });

      expect(response.status).toBe(403);
    });
  });

  describe('WAF Configuration', () => {
    test('should have WAF WebACL ARN output', () => {
      expect(outputs.WebAclArn).toBeDefined();
      expect(outputs.WebAclArn).toMatch(/^arn:aws:wafv2:/);
    });

    test('WAF WebACL should exist with security rules', async () => {
      const webAclsResponse = await wafClient.send(
        new ListWebACLsCommand({
          Scope: 'REGIONAL',
        })
      );

      const webAcl = webAclsResponse.WebACLs?.find((w) =>
        w.Name?.includes(`analytics-waf-${environmentSuffix}`)
      );

      expect(webAcl).toBeDefined();

      if (webAcl?.ARN) {
        const webAclDetails = await wafClient.send(
          new GetWebACLCommand({
            Scope: 'REGIONAL',
            Id: webAcl.Id!,
            Name: webAcl.Name!,
          })
        );

        expect(webAclDetails.WebACL?.Rules).toBeDefined();
        expect(webAclDetails.WebACL?.Rules!.length).toBeGreaterThanOrEqual(3);

        const ruleNames = webAclDetails.WebACL?.Rules?.map((r) => r.Name) || [];
        expect(ruleNames).toContain('RateLimitRule');
        expect(ruleNames).toContain('SQLInjectionProtection');
        expect(ruleNames).toContain('XSSProtection');
      }
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have alarm name outputs', () => {
      expect(outputs.ApiErrorAlarmName).toBeDefined();
      expect(outputs.LambdaErrorAlarmName).toBeDefined();
      expect(outputs.WafBlockedRequestsAlarmName).toBeDefined();
    });

    test('should have SNS topic ARN output', () => {
      expect(outputs.SecurityAlarmTopicArn).toBeDefined();
    });

    test('all security alarms should be configured', async () => {
      const alarmsResponse = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [
            outputs.ApiErrorAlarmName,
            outputs.LambdaErrorAlarmName,
            outputs.WafBlockedRequestsAlarmName,
          ],
        })
      );

      const alarms = alarmsResponse.MetricAlarms || [];
      expect(alarms.length).toBe(3);

      const alarmNames = alarms.map((a) => a.AlarmName);
      expect(alarmNames).toContain(outputs.ApiErrorAlarmName);
      expect(alarmNames).toContain(outputs.LambdaErrorAlarmName);
      expect(alarmNames).toContain(outputs.WafBlockedRequestsAlarmName);
    });

    test('API error alarm should have SNS action', async () => {
      const alarmsResponse = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [outputs.ApiErrorAlarmName],
        })
      );

      const alarm = alarmsResponse.MetricAlarms![0];
      expect(alarm.AlarmActions).toBeDefined();
      expect(alarm.AlarmActions!.length).toBeGreaterThan(0);
      expect(alarm.AlarmActions![0]).toContain(outputs.SecurityAlarmTopicArn);
    });

    test('SNS topic should exist', async () => {
      const topicsResponse = await snsClient.send(new ListTopicsCommand({}));
      const topic = topicsResponse.Topics?.find(
        (t) => t.TopicArn === outputs.SecurityAlarmTopicArn
      );

      expect(topic).toBeDefined();
    });
  });

  describe('EventBridge Rules', () => {
    test('should have S3 event rule name output', () => {
      expect(outputs.S3EventRuleName).toBeDefined();
    });

    test('S3 EventBridge rule should exist', async () => {
      const ruleResponse = await eventBridgeClient.send(
        new DescribeRuleCommand({
          Name: outputs.S3EventRuleName,
        })
      );

      expect(ruleResponse.Name).toBe(outputs.S3EventRuleName);
      expect(ruleResponse.State).toBe('ENABLED');
      expect(ruleResponse.EventPattern).toBeDefined();

      const eventPattern = JSON.parse(ruleResponse.EventPattern!);
      expect(eventPattern.source).toContain('aws.s3');
      expect(eventPattern['detail-type']).toContain('Object Created');
    });
  });

  describe('End-to-End Data Processing Workflow', () => {
    test('complete workflow: upload -> Lambda processing -> verification', async () => {
      const testKey = `input/e2e-test-${Date.now()}.json`;
      const testData = JSON.stringify({
        testId: Date.now(),
        message: 'End-to-end integration test',
        timestamp: new Date().toISOString(),
      });

      // Step 1: Upload file to raw data bucket
      await s3Client.send(
        new PutObjectCommand({
          Bucket: outputs.RawDataBucketName,
          Key: testKey,
          Body: testData,
          ServerSideEncryption: 'aws:kms',
        })
      );

      // Step 2: Verify file is encrypted
      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: outputs.RawDataBucketName,
          Key: testKey,
        })
      );

      expect(getResponse.ServerSideEncryption).toBe('aws:kms');

      // Step 3: Invoke Lambda function with S3 event
      const invokeResponse = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: outputs.DataProcessorFunctionName,
          Payload: Buffer.from(
            JSON.stringify({
              Records: [
                {
                  s3: {
                    bucket: { name: outputs.RawDataBucketName },
                    object: { key: testKey },
                  },
                },
              ],
            })
          ),
        })
      );

      expect(invokeResponse.StatusCode).toBe(200);
      expect(invokeResponse.FunctionError).toBeUndefined();

      const payload = JSON.parse(
        Buffer.from(invokeResponse.Payload!).toString()
      );
      expect(payload.statusCode).toBe(200);

      // Cleanup
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: outputs.RawDataBucketName,
          Key: testKey,
        })
      );
    });
  });
});
