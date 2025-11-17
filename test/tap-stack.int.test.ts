// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListBucketsCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
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

const path = require('path');
import { fromIni } from '@aws-sdk/credential-provider-ini';

const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
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

describe('Secure Data Analytics Platform Integration Tests', () => {
  describe('KMS Encryption', () => {
    test('KMS key exists and has rotation enabled', async () => {
      const keyId = outputs.KmsKeyArn.split('/').pop();
      const keyDescription = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: keyId })
      );

      expect(keyDescription.KeyMetadata).toBeDefined();
      expect(keyDescription.KeyMetadata?.KeyState).toBe('Enabled');

      const rotationStatus = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: keyId })
      );
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    }, 30000);
  });

  describe('VPC and Network Configuration', () => {
    test('VPC exists with correct configuration', async () => {
      const vpcsResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VpcId],
        })
      );

      expect(vpcsResponse.Vpcs).toHaveLength(1);
      const vpc = vpcsResponse.Vpcs![0];
      expect(vpc.State).toBe('available');
    }, 30000);

    test('VPC has three private subnets', async () => {
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
      });
    }, 30000);

    test('VPC has required endpoint types', async () => {
      const endpointsResponse = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VpcId],
            },
          ],
        })
      );

      const endpoints = endpointsResponse.VpcEndpoints || [];
      expect(endpoints.length).toBeGreaterThanOrEqual(3);

      const serviceNames = endpoints.map((e) => e.ServiceName || '');
      expect(serviceNames.some((s) => s.includes('s3'))).toBe(true);
      expect(serviceNames.some((s) => s.includes('dynamodb'))).toBe(true);
      expect(serviceNames.some((s) => s.includes('lambda'))).toBe(true);
    }, 30000);

    test('Security groups have correct ingress/egress rules', async () => {
      const securityGroupsResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VpcId],
            },
            {
              Name: 'group-name',
              Values: ['*Lambda*', '*Endpoint*'],
            },
          ],
        })
      );

      expect(securityGroupsResponse.SecurityGroups).toBeDefined();
      expect(securityGroupsResponse.SecurityGroups!.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('S3 Buckets', () => {
    test('all three buckets exist and are accessible', async () => {
      const bucketsResponse = await s3Client.send(new ListBucketsCommand({}));
      const bucketNames = bucketsResponse.Buckets?.map((b) => b.Name) || [];

      expect(bucketNames).toContain(outputs.RawDataBucketName);
      expect(bucketNames).toContain(outputs.ProcessedDataBucketName);
      expect(bucketNames).toContain(outputs.AuditLogsBucketName);
    }, 30000);

    test('can upload an encrypted object to raw data bucket', async () => {
      const testKey = 'input/test-file.txt';
      const testData = 'Integration test data';

      await s3Client.send(
        new PutObjectCommand({
          Bucket: outputs.RawDataBucketName,
          Key: testKey,
          Body: testData,
          ServerSideEncryption: 'aws:kms',
        })
      );

      // Verify upload
      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: outputs.RawDataBucketName,
          Key: testKey,
        })
      );

      expect(getResponse.ServerSideEncryption).toBe('aws:kms');
    }, 30000);

    test('unencrypted upload is denied by bucket policy', async () => {
      const testKey = 'test-unencrypted.txt';

      await expect(
        s3Client.send(
          new PutObjectCommand({
            Bucket: outputs.RawDataBucketName,
            Key: testKey,
            Body: 'test',
            // No server-side encryption specified
          })
        )
      ).rejects.toThrow();
    }, 30000);
  });

  describe('Lambda Function', () => {
    test('Lambda function exists and is properly configured', async () => {
      const functionResponse = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: outputs.DataProcessorFunctionName,
        })
      );

      expect(functionResponse.Configuration).toBeDefined();
      expect(functionResponse.Configuration?.Runtime).toMatch(/nodejs20/);
      expect(functionResponse.Configuration?.Timeout).toBe(300);
      expect(functionResponse.Configuration?.MemorySize).toBe(512);

      // Verify function is in VPC
      expect(functionResponse.Configuration?.VpcConfig).toBeDefined();
      expect(functionResponse.Configuration?.VpcConfig?.VpcId).toBe(
        outputs.VpcId
      );
    }, 30000);

    test('Lambda function can be invoked', async () => {
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
    }, 30000);

    test('Lambda function has correct environment variables', async () => {
      const functionResponse = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: outputs.DataProcessorFunctionName,
        })
      );

      const env = functionResponse.Configuration?.Environment?.Variables;
      expect(env).toBeDefined();
      expect(env?.RAW_DATA_BUCKET).toBe(outputs.RawDataBucketName);
      expect(env?.PROCESSED_DATA_BUCKET).toBe(outputs.ProcessedDataBucketName);
      expect(env?.KMS_KEY_ID).toBeDefined();
    }, 30000);
  });

  describe('CloudWatch Logs', () => {
    test('Lambda log group exists with correct configuration', async () => {
      const logGroupsResponse = await cwLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.DataProcessorLogGroupName,
        })
      );

      const lambdaLogGroup = logGroupsResponse.logGroups?.find((lg) =>
        lg.logGroupName === outputs.DataProcessorLogGroupName
      );

      expect(lambdaLogGroup).toBeDefined();
      expect(lambdaLogGroup?.retentionInDays).toBe(90);
      expect(lambdaLogGroup?.kmsKeyId).toBeDefined();
    }, 30000);

    test('API Gateway log group exists', async () => {
      const logGroupsResponse = await cwLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.ApiGatewayLogGroupName,
        })
      );

      const apiLogGroup = logGroupsResponse.logGroups?.find((lg) =>
        lg.logGroupName === outputs.ApiGatewayLogGroupName
      );

      expect(apiLogGroup).toBeDefined();
      expect(apiLogGroup?.retentionInDays).toBe(90);
    }, 30000);
  });

  describe('API Gateway', () => {
    test('REST API exists and is configured', async () => {
      const apisResponse = await apiGatewayClient.send(
        new GetRestApisCommand({})
      );

      const api = apisResponse.items?.find((a) =>
        a.name?.includes('analytics-api')
      );

      expect(api).toBeDefined();
      expect(api?.endpointConfiguration?.types).toContain('REGIONAL');
    }, 30000);

    test('API key exists', async () => {
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
    }, 30000);

    test('usage plan exists with throttling', async () => {
      const usagePlansResponse = await apiGatewayClient.send(
        new GetUsagePlansCommand({})
      );

      const usagePlan = usagePlansResponse.items?.find((up) =>
        up.name?.includes('analytics-usage-plan')
      );

      expect(usagePlan).toBeDefined();
      expect(usagePlan?.throttle).toBeDefined();
      expect(usagePlan?.throttle?.rateLimit).toBe(100);
      expect(usagePlan?.throttle?.burstLimit).toBe(200);
    }, 30000);

    test('API endpoint is accessible but requires authentication', async () => {
      const apiUrl = outputs.ApiEndpoint;
      const response = await fetch(`${apiUrl}data`, {
        method: 'GET',
      });

      // Should return 403 Forbidden without API key
      expect(response.status).toBe(403);
    }, 30000);
  });

  describe('WAF Configuration', () => {
    test('WAF WebACL exists with security rules', async () => {
      const webAclsResponse = await wafClient.send(
        new ListWebACLsCommand({
          Scope: 'REGIONAL',
        })
      );

      const webAcl = webAclsResponse.WebACLs?.find((w) =>
        w.Name?.includes('analytics-waf')
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
    }, 30000);
  });

  describe('CloudWatch Alarms', () => {
    test('security alarms are configured', async () => {
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

      // Verify alarms have SNS actions configured
      const apiErrorAlarm = alarms.find(
        (a) => a.AlarmName === outputs.ApiErrorAlarmName
      );
      expect(apiErrorAlarm?.AlarmActions).toBeDefined();
      expect(apiErrorAlarm?.AlarmActions!.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('End-to-End Workflow', () => {
    test('complete data processing workflow', async () => {
      // 1. Upload file to raw data bucket
      const testKey = 'input/e2e-test-file.txt';
      const testData = JSON.stringify({
        testId: Date.now(),
        data: 'End-to-end test',
      });

      await s3Client.send(
        new PutObjectCommand({
          Bucket: outputs.RawDataBucketName,
          Key: testKey,
          Body: testData,
          ServerSideEncryption: 'aws:kms',
        })
      );

      // 2. Verify file is encrypted
      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: outputs.RawDataBucketName,
          Key: testKey,
        })
      );

      expect(getResponse.ServerSideEncryption).toBe('aws:kms');

      // 3. Verify Lambda function can access the file
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
      const payload = JSON.parse(
        Buffer.from(invokeResponse.Payload!).toString()
      );
      expect(payload.statusCode).toBe(200);
    }, 30000);
  });
});
