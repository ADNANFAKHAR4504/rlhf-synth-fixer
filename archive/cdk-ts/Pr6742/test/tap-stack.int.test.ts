import fs from 'fs';
import path from 'path';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeVpcEndpointsCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBClustersCommand, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { LambdaClient, GetFunctionCommand, InvokeCommand } from '@aws-sdk/client-lambda';
import { APIGatewayClient, GetRestApiCommand, GetStageCommand, GetResourcesCommand } from '@aws-sdk/client-api-gateway';
import { SQSClient, GetQueueAttributesCommand, SendMessageCommand, ReceiveMessageCommand } from '@aws-sdk/client-sqs';
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand, GetBucketVersioningCommand, GetBucketLifecycleConfigurationCommand } from '@aws-sdk/client-s3';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { WAFV2Client, GetWebACLCommand, ListWebACLsCommand } from '@aws-sdk/client-wafv2';
import { ListSecretsCommand } from '@aws-sdk/client-secrets-manager';

const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;
const region = process.env.AWS_REGION;

if (!environmentSuffix) {
  throw new Error('ENVIRONMENT_SUFFIX environment variable is required');
}

if (!region) {
  throw new Error('AWS_REGION environment variable is required');
}

const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const lambdaClient = new LambdaClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });
const sqsClient = new SQSClient({ region });
const s3Client = new S3Client({ region });
const secretsClient = new SecretsManagerClient({ region });
const ssmClient = new SSMClient({ region });
const wafClient = new WAFV2Client({ region });

describe('Payment Processing Infrastructure Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC should exist and be available', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].VpcId).toBe(vpcId);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toMatch(/^10\.\d+\.\d+\.\d+\/16$/);
    });

    test('VPC should have 4 subnets (2 public, 2 private)', async () => {
      const vpcId = outputs.VpcId;

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(response.Subnets).toHaveLength(4);
      response.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(vpcId);
      });
    });

    test('Security groups should be configured correctly', async () => {
      const vpcId = outputs.VpcId;

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(3);
    });

    test('VPC should have S3 VPC endpoint', async () => {
      const vpcId = outputs.VpcId;

      const response = await ec2Client.send(
        new DescribeVpcEndpointsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
            {
              Name: 'service-name',
              Values: [`com.amazonaws.${region}.s3`],
            },
          ],
        })
      );

      expect(response.VpcEndpoints).toHaveLength(1);
      expect(response.VpcEndpoints![0].State).toBe('available');
    });
  });

  describe('RDS Aurora PostgreSQL Database', () => {
    test('RDS cluster should be available', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      expect(dbEndpoint).toBeDefined();

      const clusterName = dbEndpoint.split('.')[0];
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterName,
        })
      );

      expect(response.DBClusters).toHaveLength(1);
      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.DatabaseName).toBe('paymentdb');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.BackupRetentionPeriod).toBe(7);
    });

    test('RDS cluster should have correct port', async () => {
      const dbPort = outputs.DatabasePort;
      expect(dbPort).toBe('5432');
    });

    test('RDS instance should be available', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      const clusterName = dbEndpoint.split('.')[0];

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          Filters: [
            {
              Name: 'db-cluster-id',
              Values: [clusterName],
            },
          ],
        })
      );

      expect(response.DBInstances!.length).toBeGreaterThanOrEqual(1);
      const instance = response.DBInstances![0];
      expect(instance.DBInstanceStatus).toBe('available');
      expect(instance.Engine).toBe('aurora-postgresql');
    });
  });

  describe('Lambda Function', () => {
    test('Lambda function should exist and be active', async () => {
      const functionName = outputs.LambdaFunctionName;
      expect(functionName).toBeDefined();

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      expect(response.Configuration?.FunctionName).toBe(functionName);
      expect(response.Configuration?.State).toBe('Active');
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.Timeout).toBe(30);
      expect(response.Configuration?.MemorySize).toBe(512);
    });

    test('Lambda function should have correct environment variables', async () => {
      const functionName = outputs.LambdaFunctionName;

      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars).toBeDefined();
      expect(envVars!.ENVIRONMENT).toBe(environmentSuffix);
      expect(envVars!.DB_NAME).toBe('paymentdb');
      expect(envVars!.SSM_CONFIG_PATH).toMatch(/payment-service\/config/);
    });

    test('Lambda function should be invokable', async () => {
      const functionName = outputs.LambdaFunctionName;

      const testEvent = {
        httpMethod: 'GET',
        path: '/health',
        headers: {},
        body: null,
      };

      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: functionName,
          Payload: Buffer.from(JSON.stringify(testEvent)),
        })
      );

      expect(response.StatusCode).toBe(200);
      expect(response.Payload).toBeDefined();
    }, 60000);
  });

  describe('API Gateway', () => {
    test('API Gateway should be deployed', async () => {
      const apiId = outputs.ApiId;
      expect(apiId).toBeDefined();

      const response = await apiGatewayClient.send(
        new GetRestApiCommand({
          restApiId: apiId,
        })
      );

      expect(response.id).toBe(apiId);
      expect(response.name).toBe(`payment-api-${environmentSuffix}`);
    });

    test('API Gateway stage should be deployed', async () => {
      const apiId = outputs.ApiId;

      const response = await apiGatewayClient.send(
        new GetStageCommand({
          restApiId: apiId,
          stageName: environmentSuffix,
        })
      );

      expect(response.stageName).toBe(environmentSuffix);
      expect(response.deploymentId).toBeDefined();
    });

    test('API Gateway should have health and payments resources', async () => {
      const apiId = outputs.ApiId;

      const response = await apiGatewayClient.send(
        new GetResourcesCommand({
          restApiId: apiId,
        })
      );

      const resourcePaths = response.items!.map((item) => item.path);
      expect(resourcePaths).toContain('/health');
      expect(resourcePaths).toContain('/payments');
    });

    test('API Gateway URL should be accessible', async () => {
      const apiUrl = outputs.ApiUrl;
      expect(apiUrl).toBeDefined();
      expect(apiUrl).toMatch(/^https:\/\//);
      expect(apiUrl).toContain('execute-api');
      expect(apiUrl).toContain(region);
    });
  });

  describe('SQS Queues', () => {
    test('Main SQS queue should exist', async () => {
      const queueUrl = outputs.QueueUrl;
      expect(queueUrl).toBeDefined();

      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['All'],
        })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.QueueArn).toBe(outputs.QueueArn);
      expect(response.Attributes!.SqsManagedSseEnabled).toBeDefined();
    });

    test('Queue should have dead letter queue configured', async () => {
      const queueUrl = outputs.QueueUrl;

      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['RedrivePolicy'],
        })
      );

      expect(response.Attributes?.RedrivePolicy).toBeDefined();
      const redrivePolicy = JSON.parse(response.Attributes!.RedrivePolicy!);
      expect(redrivePolicy.maxReceiveCount).toBe(3);
    });

    test('Queue should accept messages', async () => {
      const queueUrl = outputs.QueueUrl;
      const testId = `test-${Date.now()}`;
      const testMessage = {
        testId: testId,
        message: 'Integration test message',
      };

      const sendResponse = await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(testMessage),
        })
      );

      expect(sendResponse.MessageId).toBeDefined();
      expect(sendResponse.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('S3 Bucket', () => {
    test('S3 bucket should exist', async () => {
      const bucketName = outputs.BucketName;
      expect(bucketName).toBeDefined();

      const response = await s3Client.send(
        new HeadBucketCommand({
          Bucket: bucketName,
        })
      );

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('S3 bucket should have encryption enabled', async () => {
      const bucketName = outputs.BucketName;

      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: bucketName,
        })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should have versioning enabled', async () => {
      const bucketName = outputs.BucketName;

      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: bucketName,
        })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket should have lifecycle configuration', async () => {
      const bucketName = outputs.BucketName;

      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: bucketName,
        })
      );

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const expirationRule = response.Rules!.find((rule) => rule.Expiration);
      expect(expirationRule).toBeDefined();
      expect(expirationRule!.Status).toBe('Enabled');
    });

    test('S3 bucket ARN should match outputs', async () => {
      const bucketArn = outputs.BucketArn;
      const bucketName = outputs.BucketName;

      expect(bucketArn).toBe(`arn:aws:s3:::${bucketName}`);
    });
  });

  describe('Secrets Manager', () => {
    test('Database secret should exist', async () => {
      const listResponse = await secretsClient.send(
        new ListSecretsCommand({
          Filters: [
            {
              Key: 'name',
              Values: [`PaymentDatabase${environmentSuffix}`],
            },
          ],
        })
      );

      expect(listResponse.SecretList).toBeDefined();
      expect(listResponse.SecretList!.length).toBeGreaterThan(0);

      const secret = listResponse.SecretList![0];
      expect(secret.Name).toBeDefined();

      const response = await secretsClient.send(
        new GetSecretValueCommand({
          SecretId: secret.Name,
        })
      );

      expect(response.SecretString).toBeDefined();
      const secretValue = JSON.parse(response.SecretString!);
      expect(secretValue.username).toBeDefined();
      expect(secretValue.password).toBeDefined();
      expect(secretValue.engine).toBe('postgres');
      expect(secretValue.port).toBe(5432);
      expect(secretValue.dbname).toBe('paymentdb');
    });
  });

  describe('SSM Parameter Store', () => {
    test('SSM configuration parameter should exist', async () => {
      const parameterName = `/${environmentSuffix}/payment-service/config/settings`;

      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: parameterName,
        })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Name).toBe(parameterName);
      expect(response.Parameter!.Type).toBe('String');
      expect(response.Parameter!.Value).toBeDefined();

      const config = JSON.parse(response.Parameter!.Value!);
      expect(config.maxAmount).toBeDefined();
      expect(config.allowedCurrencies).toBeDefined();
      expect(Array.isArray(config.allowedCurrencies)).toBe(true);
    });
  });

  describe('WAF Web ACL', () => {
    test('WAF Web ACL should exist', async () => {
      const wafAclArn = outputs.WafAclArn;
      expect(wafAclArn).toBeDefined();

      const wafId = wafAclArn.split('/').pop()!;
      const wafName = wafAclArn.split('/')[2];

      const response = await wafClient.send(
        new GetWebACLCommand({
          Name: wafName,
          Scope: 'REGIONAL',
          Id: wafId,
        })
      );

      expect(response.WebACL).toBeDefined();
      expect(response.WebACL!.Name).toBe(`payment-waf-${environmentSuffix}`);
      expect(response.WebACL!.Rules).toBeDefined();
      expect(response.WebACL!.Rules!.length).toBeGreaterThanOrEqual(3);
    });

    test('WAF should have rate limiting rule', async () => {
      const wafAclArn = outputs.WafAclArn;
      const wafId = wafAclArn.split('/').pop()!;
      const wafName = wafAclArn.split('/')[2];

      const response = await wafClient.send(
        new GetWebACLCommand({
          Name: wafName,
          Scope: 'REGIONAL',
          Id: wafId,
        })
      );

      const rateLimitRule = response.WebACL!.Rules!.find(
        (rule) => rule.Name === 'RateLimitRule'
      );
      expect(rateLimitRule).toBeDefined();
      expect(rateLimitRule!.Statement.RateBasedStatement).toBeDefined();
    });

    test('WAF should have AWS managed rules', async () => {
      const wafAclArn = outputs.WafAclArn;
      const wafId = wafAclArn.split('/').pop()!;
      const wafName = wafAclArn.split('/')[2];

      const response = await wafClient.send(
        new GetWebACLCommand({
          Name: wafName,
          Scope: 'REGIONAL',
          Id: wafId,
        })
      );

      const commonRuleSet = response.WebACL!.Rules!.find(
        (rule) => rule.Name === 'AWSManagedRulesCommonRuleSet'
      );
      expect(commonRuleSet).toBeDefined();

      const badInputsRuleSet = response.WebACL!.Rules!.find(
        (rule) => rule.Name === 'AWSManagedRulesKnownBadInputsRuleSet'
      );
      expect(badInputsRuleSet).toBeDefined();
    });
  });

  describe('End-to-End Payment Flow', () => {
    test('Complete payment processing workflow', async () => {
      const queueUrl = outputs.QueueUrl;
      const apiUrl = outputs.ApiUrl;

      const paymentRequest = {
        amount: 100,
        currency: 'USD',
        paymentMethod: 'credit_card',
        timestamp: Date.now(),
      };

      const sendResponse = await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(paymentRequest),
        })
      );

      expect(sendResponse.MessageId).toBeDefined();
      expect(sendResponse.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('Resource Tagging and Naming', () => {
    test('All outputs should follow naming convention', () => {
      expect(outputs.VpcId).toMatch(/^vpc-/);
      expect(outputs.ApiId).toMatch(/^[a-z0-9]+$/);
      expect(outputs.BucketName).toMatch(new RegExp(`-${environmentSuffix}-`));
      expect(outputs.LambdaFunctionName).toMatch(new RegExp(`-${environmentSuffix}$`));
    });

    test('All required outputs should be present', () => {
      const requiredOutputs = [
        'VpcId',
        'DatabaseEndpoint',
        'DatabasePort',
        'ApiUrl',
        'ApiId',
        'QueueUrl',
        'QueueArn',
        'BucketName',
        'BucketArn',
        'LambdaFunctionName',
        'WafAclArn',
      ];

      requiredOutputs.forEach((outputKey) => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBe('');
      });
    });
  });
});
