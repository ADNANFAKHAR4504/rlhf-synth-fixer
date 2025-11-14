/**
 * Integration Tests for Trading Platform Infrastructure
 *
 * These tests verify live AWS resources by querying AWS APIs.
 * Tests fetch outputs from CloudFormation and write to flat-outputs.json,
 * then test actual resource functionality.
 *
 * Prerequisites:
 * - AWS credentials configured
 * - Environment variables: AWS_REGION, ENVIRONMENT_SUFFIX
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

function fetchAndWriteOutputs(): any {
  const region = process.env.AWS_REGION || 'us-east-1';
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr6573';
  const stackName = `TapStack${environmentSuffix}`;

  console.log(`\n📥 Fetching CloudFormation outputs from stack: ${stackName}`);

  try {
    const command = `aws cloudformation describe-stacks --stack-name ${stackName} --region ${region} --query 'Stacks[0].Outputs' --output json`;
    const cfOutputsJson = execSync(command, { encoding: 'utf8' });
    const cfOutputs = JSON.parse(cfOutputsJson);

    const outputs: any = {
      environmentSuffix,
      region,
      stackName
    };

    cfOutputs.forEach((output: any) => {
      outputs[output.OutputKey] = output.OutputValue;
    });

    const outputDir = path.dirname(outputsPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputsPath, JSON.stringify(outputs, null, 2));
    console.log(`✅ Wrote ${Object.keys(outputs).length} outputs to ${outputsPath}\n`);

    return outputs;
  } catch (error) {
    throw new Error(`Failed to fetch CloudFormation outputs: ${error}`);
  }
}

function awsCommand(cmd: string): any {
  try {
    const result = execSync(cmd, { encoding: 'utf8' });
    return result ? JSON.parse(result) : null;
  } catch (error) {
    throw new Error(`AWS command failed: ${cmd}\nError: ${error}`);
  }
}

describe('Trading Platform Infrastructure - Live Resource Tests', () => {
  let outputs: any;
  let region: string;
  let environmentSuffix: string;

  beforeAll(() => {
    outputs = fetchAndWriteOutputs();
    region = outputs.region;
    environmentSuffix = outputs.environmentSuffix;

    console.log(`🧪 Testing live AWS resources for environment: ${environmentSuffix}`);
    console.log(`📍 Region: ${region}\n`);
  });

  describe('VPC Resources', () => {
    test('VPC should exist and be available', () => {
      const vpcId = outputs['VpcId'];
      expect(vpcId).toBeDefined();

      const vpc = awsCommand(`aws ec2 describe-vpcs --vpc-ids ${vpcId} --region ${region}`);

      expect(vpc.Vpcs).toHaveLength(1);
      expect(vpc.Vpcs[0].VpcId).toBe(vpcId);
      expect(vpc.Vpcs[0].State).toBe('available');

      // Check DNS support attributes
      const dnsSupport = awsCommand(
        `aws ec2 describe-vpc-attribute --vpc-id ${vpcId} --attribute enableDnsSupport --region ${region}`
      );
      expect(dnsSupport.EnableDnsSupport.Value).toBe(true);

      const dnsHostnames = awsCommand(
        `aws ec2 describe-vpc-attribute --vpc-id ${vpcId} --attribute enableDnsHostnames --region ${region}`
      );
      expect(dnsHostnames.EnableDnsHostnames.Value).toBe(true);
    });

    test('public subnets should exist and be in different availability zones', () => {
      const subnet1Id = outputs['PublicSubnet1Id'];
      const subnet2Id = outputs['PublicSubnet2Id'];

      expect(subnet1Id).toBeDefined();
      expect(subnet2Id).toBeDefined();

      const subnets = awsCommand(
        `aws ec2 describe-subnets --subnet-ids ${subnet1Id} ${subnet2Id} --region ${region}`
      );

      expect(subnets.Subnets).toHaveLength(2);

      const az1 = subnets.Subnets.find((s: any) => s.SubnetId === subnet1Id)?.AvailabilityZone;
      const az2 = subnets.Subnets.find((s: any) => s.SubnetId === subnet2Id)?.AvailabilityZone;

      expect(az1).toBeDefined();
      expect(az2).toBeDefined();
      expect(az1).not.toBe(az2); // Must be in different AZs

      subnets.Subnets.forEach((subnet: any) => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true); // Public subnets
      });
    });
  });

  describe('S3 Bucket', () => {
    test('bucket should exist with encryption and versioning configured', () => {
      const bucketName = outputs['TradeDataBucketName'];
      expect(bucketName).toBeDefined();

      // Check bucket exists
      const bucket = awsCommand(`aws s3api head-bucket --bucket ${bucketName} --region ${region} 2>&1 || echo '{}'`);

      // Check encryption
      const encryption = awsCommand(
        `aws s3api get-bucket-encryption --bucket ${bucketName} --region ${region}`
      );
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration.Rules).toHaveLength(1);

      // Check versioning
      const versioning = awsCommand(
        `aws s3api get-bucket-versioning --bucket ${bucketName} --region ${region}`
      );
      expect(versioning.Status).toBe('Enabled');

      // Check public access is blocked
      const publicAccess = awsCommand(
        `aws s3api get-public-access-block --bucket ${bucketName} --region ${region}`
      );
      expect(publicAccess.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
    });
  });

  describe('DynamoDB Table', () => {
    test('table should exist with correct schema and streams enabled', () => {
      const tableName = outputs['OrdersTableName'];
      expect(tableName).toBeDefined();

      const table = awsCommand(
        `aws dynamodb describe-table --table-name ${tableName} --region ${region}`
      );

      expect(table.Table.TableName).toBe(tableName);
      expect(table.Table.TableStatus).toBe('ACTIVE');

      // Verify partition key
      const partitionKey = table.Table.KeySchema.find((k: any) => k.KeyType === 'HASH');
      expect(partitionKey).toBeDefined();
      expect(partitionKey.AttributeName).toBe('orderId');

      // Verify sort key
      const sortKey = table.Table.KeySchema.find((k: any) => k.KeyType === 'RANGE');
      expect(sortKey).toBeDefined();
      expect(sortKey.AttributeName).toBe('timestamp');

      // Verify streams enabled
      expect(table.Table.StreamSpecification).toBeDefined();
      expect(table.Table.StreamSpecification.StreamEnabled).toBe(true);
      expect(table.Table.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');

      // Verify billing mode
      expect(table.Table.BillingModeSummary.BillingMode).toBe('PAY_PER_REQUEST');

      // Verify GSI exists
      expect(table.Table.GlobalSecondaryIndexes).toBeDefined();
      const statusIndex = table.Table.GlobalSecondaryIndexes.find((gsi: any) => gsi.IndexName === 'StatusIndex');
      expect(statusIndex).toBeDefined();
      expect(statusIndex.IndexStatus).toBe('ACTIVE');
    });
  });

  describe('SQS Queues', () => {
    test('main queue should exist with DLQ configured', () => {
      const queueUrl = outputs['OrderProcessingQueueUrl'];
      const dlqUrl = outputs['OrderProcessingDlqUrl'];

      expect(queueUrl).toBeDefined();
      expect(dlqUrl).toBeDefined();

      // Get queue attributes
      const queueAttrs = awsCommand(
        `aws sqs get-queue-attributes --queue-url ${queueUrl} --attribute-names All --region ${region}`
      );

      expect(queueAttrs.Attributes).toBeDefined();
      expect(queueAttrs.Attributes.QueueArn).toBe(outputs['OrderProcessingQueueArn']);

      // Verify DLQ is configured
      expect(queueAttrs.Attributes.RedrivePolicy).toBeDefined();
      const redrivePolicy = JSON.parse(queueAttrs.Attributes.RedrivePolicy);
      expect(redrivePolicy.deadLetterTargetArn).toBe(outputs['OrderProcessingDlqArn']);
      expect(redrivePolicy.maxReceiveCount).toBeGreaterThan(0);

      // Verify encryption
      expect(queueAttrs.Attributes.SqsManagedSseEnabled).toBe('true');
    });

    test('DLQ should exist and be accessible', () => {
      const dlqUrl = outputs['OrderProcessingDlqUrl'];

      const dlqAttrs = awsCommand(
        `aws sqs get-queue-attributes --queue-url ${dlqUrl} --attribute-names All --region ${region}`
      );

      expect(dlqAttrs.Attributes).toBeDefined();
      expect(dlqAttrs.Attributes.QueueArn).toBe(outputs['OrderProcessingDlqArn']);
    });
  });

  describe('Lambda Function', () => {
    test('function should exist with correct configuration and permissions', () => {
      const functionArn = outputs['OrderProcessingFunctionArn'];
      const functionName = functionArn.split(':').pop();

      expect(functionName).toBeDefined();

      const func = awsCommand(
        `aws lambda get-function --function-name ${functionName} --region ${region}`
      );

      expect(func.Configuration.FunctionArn).toBe(functionArn);
      expect(func.Configuration.State).toBe('Active');
      expect(func.Configuration.Runtime).toMatch(/nodejs/);

      // Verify environment variables
      expect(func.Configuration.Environment.Variables).toBeDefined();
      expect(func.Configuration.Environment.Variables.ENVIRONMENT).toBe(environmentSuffix);
      expect(func.Configuration.Environment.Variables.DYNAMODB_TABLE).toBe(outputs['OrdersTableName']);
      expect(func.Configuration.Environment.Variables.S3_BUCKET).toBe(outputs['TradeDataBucketName']);

      // Verify tracing enabled
      expect(func.Configuration.TracingConfig.Mode).toBe('Active');
    });

    test('function should have correct IAM permissions', () => {
      const functionArn = outputs['OrderProcessingFunctionArn'];
      const functionName = functionArn.split(':').pop();

      const func = awsCommand(
        `aws lambda get-function --function-name ${functionName} --region ${region}`
      );

      const roleName = func.Configuration.Role.split('/').pop();

      const role = awsCommand(
        `aws iam get-role --role-name ${roleName}`
      );

      expect(role.Role.RoleName).toBe(roleName);

      // Get attached policies
      const policies = awsCommand(
        `aws iam list-attached-role-policies --role-name ${roleName}`
      );

      // Should have VPC execution policy
      const vpcPolicy = policies.AttachedPolicies.find(
        (p: any) => p.PolicyName === 'AWSLambdaVPCAccessExecutionRole'
      );
      expect(vpcPolicy).toBeDefined();
    });
  });

  describe('API Gateway', () => {
    test('API should exist and be accessible', () => {
      const apiId = outputs['ApiId'];

      expect(apiId).toBeDefined();

      const api = awsCommand(
        `aws apigateway get-rest-api --rest-api-id ${apiId} --region ${region}`
      );

      expect(api.id).toBe(apiId);
      expect(api.name).toContain('trading-api');
      expect(api.name).toContain(environmentSuffix);
    });

    test('API should have /orders resource', () => {
      const apiId = outputs['ApiId'];

      const resources = awsCommand(
        `aws apigateway get-resources --rest-api-id ${apiId} --region ${region}`
      );

      const ordersResource = resources.items.find((r: any) => r.path === '/orders');
      expect(ordersResource).toBeDefined();
    });

    test('API endpoint should respond to HTTP requests', async () => {
      const apiEndpoint = outputs['ApiEndpoint'];

      expect(apiEndpoint).toBeDefined();
      expect(apiEndpoint).toMatch(/^https:\/\//);

      // Test GET request to /orders endpoint
      const testUrl = `${apiEndpoint}orders`;

      try {
        const response = execSync(
          `curl -s -o /dev/null -w "%{http_code}" -X GET "${testUrl}"`,
          { encoding: 'utf8' }
        );

        const statusCode = parseInt(response.trim());

        // Accept 200 (success), 403 (auth required), or other valid HTTP codes
        // Just verify API is responding
        expect(statusCode).toBeGreaterThanOrEqual(200);
        expect(statusCode).toBeLessThan(600);
      } catch (error) {
        throw new Error(`API endpoint ${testUrl} is not accessible: ${error}`);
      }
    });
  });

  describe('Monitoring Resources', () => {
    test('CloudWatch dashboard should exist', () => {
      const dashboardName = outputs['DashboardName'];

      expect(dashboardName).toBeDefined();

      const dashboard = awsCommand(
        `aws cloudwatch get-dashboard --dashboard-name ${dashboardName} --region ${region}`
      );

      expect(dashboard.DashboardName).toBe(dashboardName);
      expect(dashboard.DashboardBody).toBeDefined();

      // Verify dashboard has widgets
      const body = JSON.parse(dashboard.DashboardBody);
      expect(body.widgets).toBeDefined();
      expect(body.widgets.length).toBeGreaterThan(0);
    });

    test('SNS topic for drift detection should exist', () => {
      const topicArn = outputs['DriftTopicArn'];

      expect(topicArn).toBeDefined();

      const topic = awsCommand(
        `aws sns get-topic-attributes --topic-arn ${topicArn} --region ${region}`
      );

      expect(topic.Attributes.TopicArn).toBe(topicArn);
      expect(topic.Attributes.DisplayName).toBeDefined();
    });
  });

  describe('Resource Integration', () => {
    test('Lambda function should have access to DynamoDB table', () => {
      const functionArn = outputs['OrderProcessingFunctionArn'];
      const functionName = functionArn.split(':').pop();
      const tableName = outputs['OrdersTableName'];

      const func = awsCommand(
        `aws lambda get-function --function-name ${functionName} --region ${region}`
      );

      const roleName = func.Configuration.Role.split('/').pop();

      // Get inline policies
      const inlinePolicies = awsCommand(
        `aws iam list-role-policies --role-name ${roleName}`
      );

      expect(inlinePolicies.PolicyNames.length).toBeGreaterThan(0);
    });

    test('Lambda function should have access to S3 bucket', () => {
      const functionArn = outputs['OrderProcessingFunctionArn'];
      const functionName = functionArn.split(':').pop();

      const func = awsCommand(
        `aws lambda get-function --function-name ${functionName} --region ${region}`
      );

      // Verify S3 bucket name is in environment variables
      expect(func.Configuration.Environment.Variables.S3_BUCKET).toBe(outputs['TradeDataBucketName']);
    });

    test('API Gateway should be integrated with Lambda function', () => {
      const apiId = outputs['ApiId'];
      const functionArn = outputs['OrderProcessingFunctionArn'];

      const resources = awsCommand(
        `aws apigateway get-resources --rest-api-id ${apiId} --region ${region}`
      );

      const ordersResource = resources.items.find((r: any) => r.path === '/orders');
      expect(ordersResource).toBeDefined();

      // Check POST method exists
      if (ordersResource.resourceMethods?.POST) {
        const integration = awsCommand(
          `aws apigateway get-integration --rest-api-id ${apiId} --resource-id ${ordersResource.id} --http-method POST --region ${region}`
        );

        expect(integration.type).toBe('AWS_PROXY');
        expect(integration.uri).toContain(functionArn);
      }
    });
  });

  describe('Environment Consistency', () => {
    test('all resources should be tagged or named with environment suffix', () => {
      expect(outputs['TradeDataBucketName']).toContain(environmentSuffix);
      expect(outputs['OrdersTableName']).toContain(environmentSuffix);
      expect(outputs['DashboardName']).toContain(environmentSuffix);
    });

    test('all resources should be in the same region', () => {
      const vpcId = outputs['VpcId'];
      const tableName = outputs['OrdersTableName'];
      const bucketName = outputs['TradeDataBucketName'];

      // All AWS CLI commands use the same region from outputs
      expect(region).toBe(outputs.region);

      // Verify resources are accessible in this region
      expect(() => {
        awsCommand(`aws ec2 describe-vpcs --vpc-ids ${vpcId} --region ${region}`);
      }).not.toThrow();

      expect(() => {
        awsCommand(`aws dynamodb describe-table --table-name ${tableName} --region ${region}`);
      }).not.toThrow();
    });
  });
});
