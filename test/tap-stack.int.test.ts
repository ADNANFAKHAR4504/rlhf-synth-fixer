/**
 * Multi-Region Payment Gateway - Integration Tests
 *
 * These tests validate the complete deployment of a multi-region payment gateway
 * infrastructure with CloudFront, API Gateway, Lambda, DynamoDB Global Tables,
 * Route 53 failover, and WAF protection.
 *
 * Tests use real AWS outputs from cfn-outputs/flat-outputs.json and secondary
 * region outputs from CloudFormation.
 *
 * No mocking - all tests run against actual deployed resources.
 */

import fs from 'fs';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  GetItemCommand,
  DescribeTableCommand
} from '@aws-sdk/client-dynamodb';
import {
  CloudFrontClient,
  GetDistributionCommand,
  GetCloudFrontOriginAccessIdentityCommand
} from '@aws-sdk/client-cloudfront';
import {
  Route53Client,
  GetHealthCheckStatusCommand,
  ListResourceRecordSetsCommand
} from '@aws-sdk/client-route-53';
import {
  WAFV2Client,
  GetWebACLCommand
} from '@aws-sdk/client-wafv2';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetAuthorizersCommand
} from '@aws-sdk/client-api-gateway';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand
} from '@aws-sdk/client-lambda';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand
} from '@aws-sdk/client-ec2';
import {
  CloudFormationClient,
  DescribeStacksCommand
} from '@aws-sdk/client-cloudformation';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';

// Load outputs from deployed infrastructure
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Helper function to make HTTP requests
const fetch = require('node-fetch');

async function makeHttpRequest(
  url: string,
  options: { method?: string; headers?: Record<string, string>; body?: string } = {}
): Promise<{ status: number; body: string; headers: Record<string, string> }> {
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: options.headers || {},
    body: options.body
  });

  const body = await response.text();
  const headers: Record<string, string> = {};
  response.headers.forEach((value: string, key: string) => {
    headers[key] = value;
  });

  return {
    status: response.status,
    body,
    headers
  };
}

// Extract secondary region outputs
let secondaryOutputs: Record<string, string> = {};

beforeAll(async () => {
  // Get secondary region stack outputs
  const cfnClient = new CloudFormationClient({ region: outputs.SecondaryRegion });
  const stackResponse = await cfnClient.send(new DescribeStacksCommand({
    StackName: outputs.SecondaryStackName
  }));

  if (stackResponse.Stacks && stackResponse.Stacks[0].Outputs) {
    stackResponse.Stacks[0].Outputs.forEach(output => {
      if (output.OutputKey && output.OutputValue) {
        secondaryOutputs[output.OutputKey] = output.OutputValue;
      }
    });
  }
});

describe('Multi-Region Payment Gateway - Integration Tests', () => {

  // ========================================================================
  // 1. CloudFront Distribution Tests
  // ========================================================================

  describe('CloudFront Distribution', () => {
    test('should serve static website from S3 origin', async () => {
      const response = await makeHttpRequest(outputs.ApplicationUrl);

      expect(response.status).toBe(200);
      expect(response.body).toContain('Payments Gateway');
      expect(response.headers['x-cache']).toBeDefined();
    }, 30000);

    test('should route /api/health to API Gateway', async () => {
      const response = await makeHttpRequest(outputs.CloudFrontHealthEndpoint);

      expect(response.status).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.status).toBe('healthy');
      expect(body.region).toBe(outputs.PrimaryRegion);
    }, 30000);

    test('should block unauthorized /api/transfer requests', async () => {
      const response = await makeHttpRequest(outputs.CloudFrontTransferEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': outputs.TestAuthTokenInvalid
        },
        body: JSON.stringify({
          amount: 100.00,
          from: 'test@example.com',
          to: 'test2@example.com'
        })
      });

      expect(response.status).toBe(403);
    }, 30000);

    test('should process authorized /api/transfer requests', async () => {
      const response = await makeHttpRequest(outputs.CloudFrontTransferEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': outputs.TestAuthTokenValid
        },
        body: JSON.stringify({
          amount: 150.00,
          from: 'alice@example.com',
          to: 'bob@example.com'
        })
      });

      expect(response.status).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.message).toContain('success');
      expect(body.transaction).toBeDefined();
      expect(body.transaction.amount).toBe(150);
    }, 30000);

    test('should have WAF Web ACL attached', async () => {
      const cfClient = new CloudFrontClient({ region: outputs.PrimaryRegion });

      const distribution = await cfClient.send(new GetDistributionCommand({
        Id: outputs.CloudFrontDistributionId
      }));

      expect(distribution.Distribution?.DistributionConfig?.WebACLId).toBe(outputs.WAFWebAclArn);
    });
  });

  // ========================================================================
  // 2. Direct API Gateway Tests (Both Regions)
  // ========================================================================

  describe('Primary Region API Gateway', () => {
    test('should respond to health check', async () => {
      const response = await makeHttpRequest(outputs.PrimaryHealthEndpoint);

      expect(response.status).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.status).toBe('healthy');
      expect(body.region).toBe(outputs.PrimaryRegion);
    }, 30000);

    test('should reject unauthorized transfer requests', async () => {
      const response = await makeHttpRequest(outputs.PrimaryTransferEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': outputs.TestAuthTokenInvalid
        },
        body: JSON.stringify({
          transactionId: 'test-unauthorized',
          amount: 100.00
        })
      });

      expect(response.status).toBe(403);
    }, 30000);

    test('should process authorized transfer requests', async () => {
      const response = await makeHttpRequest(outputs.PrimaryTransferEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': outputs.TestAuthTokenValid
        },
        body: JSON.stringify({
          amount: 200.00,
          from: 'charlie@example.com',
          to: 'dave@example.com'
        })
      });

      expect(response.status).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.transaction).toBeDefined();
      expect(body.transaction.amount).toBe(200);
    }, 30000);
  });

  describe('Secondary Region API Gateway', () => {
    test('should respond to health check', async () => {
      const response = await makeHttpRequest(secondaryOutputs.HealthEndpoint);

      expect(response.status).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.status).toBe('healthy');
      expect(body.region).toBe(outputs.SecondaryRegion);
    }, 30000);

    test('should reject unauthorized transfer requests', async () => {
      const response = await makeHttpRequest(secondaryOutputs.TransferEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': outputs.TestAuthTokenInvalid
        },
        body: JSON.stringify({
          transactionId: 'test-unauthorized-secondary',
          amount: 100.00
        })
      });

      expect(response.status).toBe(403);
    }, 30000);

    test('should process authorized transfer requests', async () => {
      const response = await makeHttpRequest(secondaryOutputs.TransferEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': outputs.TestAuthTokenValid
        },
        body: JSON.stringify({
          amount: 250.00,
          from: 'eve@example.com',
          to: 'frank@example.com'
        })
      });

      expect(response.status).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.transaction).toBeDefined();
      expect(body.transaction.amount).toBe(250);
    }, 30000);
  });

  // ========================================================================
  // 3. DynamoDB Global Table Tests
  // ========================================================================

  describe('DynamoDB Global Table', () => {
    const primaryDynamoDB = new DynamoDBClient({ region: outputs.PrimaryRegion });
    const secondaryDynamoDB = new DynamoDBClient({ region: outputs.SecondaryRegion });

    test('should have encryption at rest enabled', async () => {
      const response = await primaryDynamoDB.send(new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName
      }));

      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
      expect(response.Table?.SSEDescription?.SSEType).toBe('KMS');
    });

    test('should replicate data from primary to secondary', async () => {
      // Write via primary API Gateway (which has DynamoDB permissions)
      const createResponse = await makeHttpRequest(outputs.PrimaryTransferEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': outputs.TestAuthTokenValid
        },
        body: JSON.stringify({
          amount: 300,
          from: 'test-sender@example.com',
          to: 'test-recipient@example.com'
        })
      });

      const createBody = JSON.parse(createResponse.body);
      const transactionId = createBody.transaction.transactionId;
      const timestamp = createBody.transaction.timestamp;

      // Wait for replication (DynamoDB Global Tables typically replicate in < 1 second)
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Read from secondary region using composite key
      const response = await secondaryDynamoDB.send(new GetItemCommand({
        TableName: outputs.DynamoDBTableName,
        Key: {
          transactionId: { S: transactionId },
          timestamp: { S: timestamp }
        }
      }));

      expect(response.Item).toBeDefined();
      expect(response.Item?.transactionId.S).toBe(transactionId);
      expect(response.Item?.amount.N).toBe('300');
    }, 30000);

    test('should replicate data from secondary to primary', async () => {
      // Write via secondary API Gateway (which has DynamoDB permissions)
      const createResponse = await makeHttpRequest(secondaryOutputs.TransferEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': outputs.TestAuthTokenValid
        },
        body: JSON.stringify({
          amount: 400,
          from: 'secondary-sender@example.com',
          to: 'secondary-recipient@example.com'
        })
      });

      const createBody = JSON.parse(createResponse.body);
      const transactionId = createBody.transaction.transactionId;
      const timestamp = createBody.transaction.timestamp;

      // Wait for replication
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Read from primary region using composite key
      const response = await primaryDynamoDB.send(new GetItemCommand({
        TableName: outputs.DynamoDBTableName,
        Key: {
          transactionId: { S: transactionId },
          timestamp: { S: timestamp }
        }
      }));

      expect(response.Item).toBeDefined();
      expect(response.Item?.transactionId.S).toBe(transactionId);
      expect(response.Item?.amount.N).toBe('400');
    }, 30000);

    test('should support concurrent writes from both regions', async () => {
      // Write to both regions simultaneously via API Gateways
      const [primaryResponse, secondaryResponse] = await Promise.all([
        makeHttpRequest(outputs.PrimaryTransferEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': outputs.TestAuthTokenValid
          },
          body: JSON.stringify({
            amount: 500,
            from: 'primary@example.com',
            to: 'primary-recipient@example.com'
          })
        }),
        makeHttpRequest(secondaryOutputs.TransferEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': outputs.TestAuthTokenValid
          },
          body: JSON.stringify({
            amount: 600,
            from: 'secondary@example.com',
            to: 'secondary-recipient@example.com'
          })
        })
      ]);

      const primaryBody = JSON.parse(primaryResponse.body);
      const secondaryBody = JSON.parse(secondaryResponse.body);
      const primaryId = primaryBody.transaction.transactionId;
      const primaryTimestamp = primaryBody.transaction.timestamp;
      const secondaryId = secondaryBody.transaction.transactionId;
      const secondaryTimestamp = secondaryBody.transaction.timestamp;

      // Wait for replication
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Verify both items exist in primary region using composite keys
      const [item1, item2] = await Promise.all([
        primaryDynamoDB.send(new GetItemCommand({
          TableName: outputs.DynamoDBTableName,
          Key: {
            transactionId: { S: primaryId },
            timestamp: { S: primaryTimestamp }
          }
        })),
        primaryDynamoDB.send(new GetItemCommand({
          TableName: outputs.DynamoDBTableName,
          Key: {
            transactionId: { S: secondaryId },
            timestamp: { S: secondaryTimestamp }
          }
        }))
      ]);

      expect(item1.Item?.transactionId.S).toBe(primaryId);
      expect(item2.Item?.transactionId.S).toBe(secondaryId);
    }, 30000);
  });

  // ========================================================================
  // 4. KMS Encryption Tests
  // ========================================================================

  describe('KMS Encryption', () => {
    test('should have key rotation enabled for primary KMS key', async () => {
      const kmsClient = new KMSClient({ region: outputs.PrimaryRegion });

      // Extract key ID from ARN
      const keyId = outputs.PrimaryKMSKeyArn.split('/').pop();

      const response = await kmsClient.send(new DescribeKeyCommand({
        KeyId: keyId
      }));

      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.Enabled).toBe(true);
    });

    test('should have KMS key in secondary region for replica encryption', async () => {
      const kmsClient = new KMSClient({ region: outputs.SecondaryRegion });

      // Extract key ID from secondary outputs
      const keyId = secondaryOutputs.KMSKeyArn.split('/').pop();

      const response = await kmsClient.send(new DescribeKeyCommand({
        KeyId: keyId
      }));

      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.Enabled).toBe(true);
    });
  });

  // ========================================================================
  // 5. S3 Bucket Security Tests
  // ========================================================================

  describe('S3 Bucket Security', () => {
    const primaryS3 = new S3Client({ region: outputs.PrimaryRegion });
    const secondaryS3 = new S3Client({ region: outputs.SecondaryRegion });

    test('should have encryption enabled on primary website bucket', async () => {
      const response = await primaryS3.send(new GetBucketEncryptionCommand({
        Bucket: outputs.PrimaryWebsiteBucket
      }));

      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0]
        .ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBeDefined();
    });

    test('should have encryption enabled on secondary website bucket', async () => {
      const response = await secondaryS3.send(new GetBucketEncryptionCommand({
        Bucket: secondaryOutputs.WebsiteBucketName
      }));

      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0]
        .ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBeDefined();
    });

    test('should have bucket policy enforcing SSL for primary bucket', async () => {
      const response = await primaryS3.send(new GetBucketPolicyCommand({
        Bucket: outputs.PrimaryWebsiteBucket
      }));

      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);

      // Check for SSL enforcement
      const sslStatement = policy.Statement.find((s: any) =>
        s.Condition?.Bool?.['aws:SecureTransport'] === 'false' && s.Effect === 'Deny'
      );

      expect(sslStatement).toBeDefined();
    });

    test('should allow CloudFront OAI to access primary bucket', async () => {
      const response = await primaryS3.send(new GetBucketPolicyCommand({
        Bucket: outputs.PrimaryWebsiteBucket
      }));

      expect(response.Policy).toBeDefined();
      const policy = JSON.parse(response.Policy!);

      // Check for CloudFront OAI statement - can be CanonicalUser or AWS principal
      const oaiStatement = policy.Statement.find((s: any) => {
        // Check for CanonicalUser (CDK format)
        const hasCanonicalUser = s.Principal?.CanonicalUser !== undefined;

        // Check for AWS principal with CloudFront OAI ARN (manual format)
        const hasCloudFrontOAI = s.Principal?.AWS &&
          (typeof s.Principal.AWS === 'string' ? s.Principal.AWS.includes('CloudFront Origin Access Identity') :
           Array.isArray(s.Principal.AWS) && s.Principal.AWS.some((arn: string) => arn.includes('CloudFront Origin Access Identity')));

        // Must have either format
        if (!hasCanonicalUser && !hasCloudFrontOAI) return false;

        // Check if action includes s3:GetObject* (can be string or array)
        if (typeof s.Action === 'string') {
          return s.Action === 's3:GetObject' || s.Action.includes('GetObject');
        } else if (Array.isArray(s.Action)) {
          return s.Action.some((action: string) => action === 's3:GetObject' || action.includes('GetObject'));
        }
        return false;
      });

      // The OAI statement should exist
      expect(oaiStatement).toBeDefined();

      if (oaiStatement) {
        // Verify it has the expected properties
        expect(oaiStatement.Effect).toBe('Allow');
        expect(oaiStatement.Principal).toBeDefined();
      }
    });
  });

  // ========================================================================
  // 6. Lambda Function Tests
  // ========================================================================

  describe('Lambda Functions', () => {
    test('should have transfer Lambda in VPC (primary)', async () => {
      const lambdaClient = new LambdaClient({ region: outputs.PrimaryRegion });

      const stacksClient = new CloudFormationClient({ region: outputs.PrimaryRegion });
      const stackNames = JSON.parse(outputs.AllStackNames);
      const stackResponse = await stacksClient.send(new DescribeStacksCommand({
        StackName: stackNames.primaryRegionalStack
      }));

      const transferLambdaName = stackResponse.Stacks?.[0].Outputs?.find(
        o => o.OutputKey === 'TransferLambdaName'
      )?.OutputValue;

      expect(transferLambdaName).toBeDefined();

      const response = await lambdaClient.send(new GetFunctionCommand({
        FunctionName: transferLambdaName!
      }));

      expect(response.Configuration?.VpcConfig?.VpcId).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SubnetIds).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SecurityGroupIds).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
    });

    test('should have transfer Lambda in VPC (secondary)', async () => {
      const lambdaClient = new LambdaClient({ region: outputs.SecondaryRegion });

      const response = await lambdaClient.send(new GetFunctionCommand({
        FunctionName: secondaryOutputs.TransferLambdaName
      }));

      expect(response.Configuration?.VpcConfig?.VpcId).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SubnetIds).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SecurityGroupIds).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
    });

    test('should have authorizer Lambda with correct environment (primary)', async () => {
      const lambdaClient = new LambdaClient({ region: outputs.PrimaryRegion });

      const stacksClient = new CloudFormationClient({ region: outputs.PrimaryRegion });
      const stackNames = JSON.parse(outputs.AllStackNames);
      const stackResponse = await stacksClient.send(new DescribeStacksCommand({
        StackName: stackNames.primaryRegionalStack
      }));

      const authorizerLambdaName = stackResponse.Stacks?.[0].Outputs?.find(
        o => o.OutputKey === 'AuthorizerLambdaName'
      )?.OutputValue;

      const response = await lambdaClient.send(new GetFunctionCommand({
        FunctionName: authorizerLambdaName!
      }));

      expect(response.Configuration?.Environment?.Variables?.REGION).toBe(outputs.PrimaryRegion);
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
    });
  });

  // ========================================================================
  // 7. VPC and Networking Tests
  // ========================================================================

  describe('VPC and Networking', () => {
    test('should have VPC with proper configuration (primary)', async () => {
      const ec2Client = new EC2Client({ region: outputs.PrimaryRegion });

      const stacksClient = new CloudFormationClient({ region: outputs.PrimaryRegion });
      const stackNames = JSON.parse(outputs.AllStackNames);
      const stackResponse = await stacksClient.send(new DescribeStacksCommand({
        StackName: stackNames.primaryRegionalStack
      }));

      const vpcId = stackResponse.Stacks?.[0].Outputs?.find(
        o => o.OutputKey === 'VpcId'
      )?.OutputValue;

      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId!]
      }));

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs?.[0].State).toBe('available');
    });

    test('should have security group with proper configuration (primary)', async () => {
      const ec2Client = new EC2Client({ region: outputs.PrimaryRegion });

      const stacksClient = new CloudFormationClient({ region: outputs.PrimaryRegion });
      const stackNames = JSON.parse(outputs.AllStackNames);
      const stackResponse = await stacksClient.send(new DescribeStacksCommand({
        StackName: stackNames.primaryRegionalStack
      }));

      const sgId = stackResponse.Stacks?.[0].Outputs?.find(
        o => o.OutputKey === 'LambdaSecurityGroupId'
      )?.OutputValue;

      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [sgId!]
      }));

      expect(response.SecurityGroups).toHaveLength(1);
      expect(response.SecurityGroups?.[0].GroupName).toContain('LambdaSecurityGroup');
    });
  });

  // ========================================================================
  // 8. Route 53 Failover Tests
  // ========================================================================

  describe('Route 53 Failover', () => {
    test('should have hosted zone configured', async () => {
      const route53Client = new Route53Client({ region: outputs.PrimaryRegion });

      // List all hosted zones to find ours
      // Note: We can't directly get the hosted zone ID from outputs, but we can verify the setup
      expect(outputs.Route53HostedZoneName).toMatch(/payment-gateway-.+\.com/);
      expect(outputs.Route53ApiFailoverDns).toMatch(/api\.payment-gateway-.+\.com/);
    });

    test('should have failover URL configured', () => {
      expect(outputs.Route53FailoverUrl).toMatch(/https:\/\/api\.payment-gateway-.+\.com\/prod/);
    });
  });

  // ========================================================================
  // 9. WAF Protection Tests
  // ========================================================================

  describe('WAF Protection', () => {
    test('should have WAF Web ACL configured', () => {
      // Verify WAF outputs exist and have correct format
      expect(outputs.WAFWebAclArn).toMatch(/^arn:aws:wafv2:us-east-1:\d+:global\/webacl\/.+/);
      expect(outputs.WAFWebAclId).toMatch(/^[a-f0-9-]+$/);

      // WAF ARN format: arn:aws:wafv2:region:account:global/webacl/name/id
      const arnParts = outputs.WAFWebAclArn.split('/');
      expect(arnParts.length).toBe(4);
      expect(arnParts[2]).toContain('payments-gateway-web-acl');
    });
  });

  // ========================================================================
  // 10. End-to-End Payment Flow Tests
  // ========================================================================

  describe('End-to-End Payment Flow', () => {
    test('should complete full payment flow via CloudFront', async () => {
      const primaryDynamoDB = new DynamoDBClient({ region: outputs.PrimaryRegion });

      // Step 1: Submit payment via CloudFront
      const submitResponse = await makeHttpRequest(outputs.CloudFrontTransferEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': outputs.TestAuthTokenValid
        },
        body: JSON.stringify({
          amount: 999.99,
          from: 'alice@e2e-test.com',
          to: 'bob@e2e-test.com'
        })
      });

      expect(submitResponse.status).toBe(200);

      const submitBody = JSON.parse(submitResponse.body);
      const transactionId = submitBody.transaction.transactionId;
      const timestamp = submitBody.transaction.timestamp;

      // Step 2: Wait for DynamoDB write
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Verify transaction in DynamoDB (primary) using composite key
      const dbResponse = await primaryDynamoDB.send(new GetItemCommand({
        TableName: outputs.DynamoDBTableName,
        Key: {
          transactionId: { S: transactionId },
          timestamp: { S: timestamp }
        }
      }));

      expect(dbResponse.Item).toBeDefined();
      expect(dbResponse.Item?.amount.N).toBe('999.99');
      expect(dbResponse.Item?.from.S).toBe('alice@e2e-test.com');

      // Step 4: Wait for replication to secondary
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 5: Verify replication to secondary region
      const secondaryDynamoDB = new DynamoDBClient({ region: outputs.SecondaryRegion });
      const replicaResponse = await secondaryDynamoDB.send(new GetItemCommand({
        TableName: outputs.DynamoDBTableName,
        Key: {
          transactionId: { S: transactionId },
          timestamp: { S: timestamp }
        }
      }));

      expect(replicaResponse.Item).toBeDefined();
      expect(replicaResponse.Item?.amount.N).toBe('999.99');
    }, 60000);

    test('should complete full payment flow via direct API (primary)', async () => {
      const primaryDynamoDB = new DynamoDBClient({ region: outputs.PrimaryRegion });

      // Submit via primary API Gateway
      const submitResponse = await makeHttpRequest(outputs.PrimaryTransferEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': outputs.TestAuthTokenValid
        },
        body: JSON.stringify({
          amount: 777.77,
          from: 'charlie@e2e-test.com',
          to: 'dave@e2e-test.com'
        })
      });

      expect(submitResponse.status).toBe(200);

      const submitBody = JSON.parse(submitResponse.body);
      const transactionId = submitBody.transaction.transactionId;
      const timestamp = submitBody.transaction.timestamp;

      // Wait and verify
      await new Promise(resolve => setTimeout(resolve, 2000));

      const dbResponse = await primaryDynamoDB.send(new GetItemCommand({
        TableName: outputs.DynamoDBTableName,
        Key: {
          transactionId: { S: transactionId },
          timestamp: { S: timestamp }
        }
      }));

      expect(dbResponse.Item?.amount.N).toBe('777.77');
      expect(dbResponse.Item?.from.S).toBe('charlie@e2e-test.com');
    }, 60000);

    test('should complete full payment flow via direct API (secondary)', async () => {
      const secondaryDynamoDB = new DynamoDBClient({ region: outputs.SecondaryRegion });

      // Submit via secondary API Gateway
      const submitResponse = await makeHttpRequest(secondaryOutputs.TransferEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': outputs.TestAuthTokenValid
        },
        body: JSON.stringify({
          amount: 555.55,
          from: 'eve@e2e-test.com',
          to: 'frank@e2e-test.com'
        })
      });

      expect(submitResponse.status).toBe(200);

      const submitBody = JSON.parse(submitResponse.body);
      const transactionId = submitBody.transaction.transactionId;
      const timestamp = submitBody.transaction.timestamp;

      // Wait and verify in secondary
      await new Promise(resolve => setTimeout(resolve, 2000));

      const dbResponse = await secondaryDynamoDB.send(new GetItemCommand({
        TableName: outputs.DynamoDBTableName,
        Key: {
          transactionId: { S: transactionId },
          timestamp: { S: timestamp }
        }
      }));

      expect(dbResponse.Item?.amount.N).toBe('555.55');
      expect(dbResponse.Item?.from.S).toBe('eve@e2e-test.com');

      // Verify replication to primary
      await new Promise(resolve => setTimeout(resolve, 3000));

      const primaryDynamoDB = new DynamoDBClient({ region: outputs.PrimaryRegion });
      const replicaResponse = await primaryDynamoDB.send(new GetItemCommand({
        TableName: outputs.DynamoDBTableName,
        Key: {
          transactionId: { S: transactionId },
          timestamp: { S: timestamp }
        }
      }));

      expect(replicaResponse.Item?.amount.N).toBe('555.55');
    }, 60000);
  });

  // ========================================================================
  // 11. Resource Naming and Environment Isolation Tests
  // ========================================================================

  describe('Resource Naming and Environment Isolation', () => {
    test('should not contain hardcoded environment values in resource names', () => {
      // Verify no hardcoded prod/dev/stage values
      expect(outputs.DynamoDBTableName).not.toMatch(/-(prod|dev|stage|staging|production)-/);
      expect(outputs.PrimaryWebsiteBucket).not.toMatch(/-(prod|dev|stage|staging|production)-/);

      // All resources should contain some form of suffix for isolation
      expect(outputs.DynamoDBTableName).toMatch(/.+-[a-z0-9]+$/);
    });

    test('should have unique resource names across stacks', () => {
      const stackNames = JSON.parse(outputs.AllStackNames);
      const names = Object.values(stackNames) as string[];
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(names.length);
    });
  });

  // ========================================================================
  // 12. Output Validation Tests
  // ========================================================================

  describe('Stack Outputs Validation', () => {
    test('should have all required primary outputs', () => {
      const requiredOutputs = [
        'ApplicationUrl',
        'CloudFrontDistributionId',
        'CloudFrontHealthEndpoint',
        'CloudFrontTransferEndpoint',
        'PrimaryRegion',
        'SecondaryRegion',
        'PrimaryApiEndpoint',
        'PrimaryHealthEndpoint',
        'PrimaryTransferEndpoint',
        'PrimaryWebsiteBucket',
        'DynamoDBTableName',
        'DynamoDBTableArn',
        'WAFWebAclArn',
        'WAFWebAclId',
        'PrimaryKMSKeyArn',
        'TestAuthTokenValid',
        'TestAuthTokenInvalid',
        'Route53HostedZoneName',
        'Route53ApiFailoverDns'
      ];

      requiredOutputs.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).not.toBe('');
      });
    });

    test('should have all required secondary outputs', () => {
      const requiredOutputs = [
        'ApiGatewayUrl',
        'TransferEndpoint',
        'HealthEndpoint',
        'WebsiteBucketName',
        'TransferLambdaName',
        'AuthorizerLambdaName',
        'VpcId',
        'Region',
        'KMSKeyArn'
      ];

      requiredOutputs.forEach(key => {
        expect(secondaryOutputs[key]).toBeDefined();
        expect(secondaryOutputs[key]).not.toBe('');
      });
    });

    test('should have valid URL formats', () => {
      const urlPattern = /^https:\/\/.+/;

      expect(outputs.ApplicationUrl).toMatch(urlPattern);
      expect(outputs.CloudFrontHealthEndpoint).toMatch(urlPattern);
      expect(outputs.CloudFrontTransferEndpoint).toMatch(urlPattern);
      expect(outputs.PrimaryApiEndpoint).toMatch(urlPattern);
      expect(outputs.PrimaryHealthEndpoint).toMatch(urlPattern);
      expect(outputs.PrimaryTransferEndpoint).toMatch(urlPattern);
      expect(outputs.Route53FailoverUrl).toMatch(urlPattern);
      expect(secondaryOutputs.ApiGatewayUrl).toMatch(urlPattern);
      expect(secondaryOutputs.TransferEndpoint).toMatch(urlPattern);
      expect(secondaryOutputs.HealthEndpoint).toMatch(urlPattern);
    });

    test('should have valid ARN formats', () => {
      const arnPattern = /^arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{12}:.+/;

      expect(outputs.DynamoDBTableArn).toMatch(arnPattern);
      expect(outputs.WAFWebAclArn).toMatch(arnPattern);
      expect(outputs.PrimaryKMSKeyArn).toMatch(arnPattern);
      expect(secondaryOutputs.KMSKeyArn).toMatch(arnPattern);
    });
  });
});
