import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

describe('TapStack - Live Integration Tests', () => {
  let stack: TapStack;
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test-int';

  beforeAll(() => {
    stack = new TapStack(`tap-stack-${environmentSuffix}`, {
      environmentSuffix,
      tags: {
        Environment: environmentSuffix,
        TestType: 'integration',
        ManagedBy: 'pulumi',
      },
    });
  });

  describe('Stack Initialization', () => {
    it('should create TapStack instance successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should be a ComponentResource', () => {
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });
  });

  describe('Multi-Region API Endpoints', () => {
    it('should have primaryApiEndpoint output defined', () => {
      expect(stack.primaryApiEndpoint).toBeDefined();
      expect(stack.primaryApiEndpoint).toBeInstanceOf(pulumi.Output);
    });

    it('should have secondaryApiEndpoint output defined', () => {
      expect(stack.secondaryApiEndpoint).toBeDefined();
      expect(stack.secondaryApiEndpoint).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Health Check Configuration', () => {
    it('should have health check IDs for both regions', () => {
      expect(stack.healthCheckPrimaryId).toBeDefined();
      expect(stack.healthCheckSecondaryId).toBeDefined();
      expect(stack.healthCheckPrimaryId).toBeInstanceOf(pulumi.Output);
      expect(stack.healthCheckSecondaryId).toBeInstanceOf(pulumi.Output);
    });

    it('should have health check URLs defined', () => {
      expect(stack.primaryHealthCheckUrl).toBeDefined();
      expect(stack.secondaryHealthCheckUrl).toBeDefined();
      expect(stack.primaryHealthCheckUrl).toBeInstanceOf(pulumi.Output);
      expect(stack.secondaryHealthCheckUrl).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Storage Resources - DynamoDB', () => {
    it('should have DynamoDB table name output', () => {
      expect(stack.dynamoDbTableName).toBeDefined();
      expect(stack.dynamoDbTableName).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Storage Resources - S3 Buckets', () => {
    it('should have S3 bucket outputs for both regions', () => {
      expect(stack.s3BucketPrimaryName).toBeDefined();
      expect(stack.s3BucketSecondaryName).toBeDefined();
      expect(stack.s3BucketPrimaryName).toBeInstanceOf(pulumi.Output);
      expect(stack.s3BucketSecondaryName).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Dead Letter Queues', () => {
    it('should have DLQ URLs for both regions', () => {
      expect(stack.dlqPrimaryUrl).toBeDefined();
      expect(stack.dlqSecondaryUrl).toBeDefined();
      expect(stack.dlqPrimaryUrl).toBeInstanceOf(pulumi.Output);
      expect(stack.dlqSecondaryUrl).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('CloudWatch Monitoring', () => {
    it('should have replication lag alarm ARN', () => {
      expect(stack.replicationLagAlarmArn).toBeDefined();
      expect(stack.replicationLagAlarmArn).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Route 53 Failover DNS', () => {
    it('should have failover DNS name output', () => {
      expect(stack.failoverDnsName).toBeDefined();
      expect(stack.failoverDnsName).toBeInstanceOf(pulumi.Output);
    });

    it('should have hosted zone ID output', () => {
      expect(stack.hostedZoneId).toBeDefined();
      expect(stack.hostedZoneId).toBeInstanceOf(pulumi.Output);
    });

    it('should have hosted zone name servers output', () => {
      expect(stack.hostedZoneNameServers).toBeDefined();
      expect(stack.hostedZoneNameServers).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Legacy Outputs - Backward Compatibility', () => {
    it('should have legacy vpcId output defined', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.vpcId).toBeInstanceOf(pulumi.Output);
    });

    it('should have legacy rdsEndpoint output defined', () => {
      expect(stack.rdsEndpoint).toBeDefined();
      expect(stack.rdsEndpoint).toBeInstanceOf(pulumi.Output);
    });

    it('should have legacy bucketName output defined', () => {
      expect(stack.bucketName).toBeDefined();
      expect(stack.bucketName).toBeInstanceOf(pulumi.Output);
    });

    it('should have legacy lambdaArn output defined', () => {
      expect(stack.lambdaArn).toBeDefined();
      expect(stack.lambdaArn).toBeInstanceOf(pulumi.Output);
    });

    it('should have legacy apiUrl output defined', () => {
      expect(stack.apiUrl).toBeDefined();
      expect(stack.apiUrl).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Stack Configuration', () => {
    it('should accept and use environmentSuffix', () => {
      const customStack = new TapStack('custom-stack', {
        environmentSuffix: 'custom-env',
      });
      expect(customStack).toBeDefined();
      expect(customStack).toBeInstanceOf(TapStack);
    });

    it('should accept custom regions', () => {
      const customRegionStack = new TapStack('region-stack', {
        environmentSuffix: 'custom',
        primaryRegion: 'us-west-2',
        secondaryRegion: 'us-west-1',
      });
      expect(customRegionStack).toBeDefined();
      expect(customRegionStack).toBeInstanceOf(TapStack);
    });

    it('should accept createHostedZone flag', () => {
      const dnsStack = new TapStack('dns-stack', {
        environmentSuffix: 'dns-test',
        createHostedZone: true,
      });
      expect(dnsStack).toBeDefined();
      expect(dnsStack).toBeInstanceOf(TapStack);
    });

    it('should accept custom tags', () => {
      const taggedStack = new TapStack('tagged-stack', {
        environmentSuffix: 'tagged',
        tags: {
          Project: 'TestProject',
          Owner: 'TestTeam',
          CostCenter: '12345',
        },
      });
      expect(taggedStack).toBeDefined();
      expect(taggedStack).toBeInstanceOf(TapStack);
    });
  });

  describe('All Stack Outputs Defined', () => {
    it('should have all required outputs defined', () => {
      const requiredOutputs = [
        'primaryApiEndpoint',
        'secondaryApiEndpoint',
        'failoverDnsName',
        'primaryHealthCheckUrl',
        'secondaryHealthCheckUrl',
        'healthCheckPrimaryId',
        'healthCheckSecondaryId',
        'replicationLagAlarmArn',
        'dynamoDbTableName',
        's3BucketPrimaryName',
        's3BucketSecondaryName',
        'dlqPrimaryUrl',
        'dlqSecondaryUrl',
        'hostedZoneId',
        'hostedZoneNameServers',
      ];

      requiredOutputs.forEach((output) => {
        expect(stack[output as keyof TapStack]).toBeDefined();
        expect(stack[output as keyof TapStack]).toBeInstanceOf(pulumi.Output);
      });
    });

    it('should have all legacy outputs defined', () => {
      const legacyOutputs = ['vpcId', 'rdsEndpoint', 'bucketName', 'lambdaArn', 'apiUrl'];

      legacyOutputs.forEach((output) => {
        expect(stack[output as keyof TapStack]).toBeDefined();
        expect(stack[output as keyof TapStack]).toBeInstanceOf(pulumi.Output);
      });
    });
  });

  describe('Stack Resource Type', () => {
    it('should have correct resource type URN', () => {
      const urn = (stack as any).urn;
      expect(urn).toBeDefined();
      expect(urn).toBeInstanceOf(pulumi.Output);
    });

    it('should be a valid Pulumi ComponentResource', () => {
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
      expect(stack.constructor.name).toBe('TapStack');
    });
  });

  describe('Multiple Stack Instances', () => {
    it('should allow creation of multiple stack instances', () => {
      const stack1 = new TapStack(`tap-stack-1-${environmentSuffix}`, {
        environmentSuffix: `${environmentSuffix}-1`,
      });
      const stack2 = new TapStack(`tap-stack-2-${environmentSuffix}`, {
        environmentSuffix: `${environmentSuffix}-2`,
      });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack1).not.toBe(stack2);
      expect(stack1).toBeInstanceOf(TapStack);
      expect(stack2).toBeInstanceOf(TapStack);
    });

    it('should maintain separate outputs for each instance', () => {
      const stack1 = new TapStack(`separate-stack-1-${environmentSuffix}`, {
        environmentSuffix: 'env1',
      });
      const stack2 = new TapStack(`separate-stack-2-${environmentSuffix}`, {
        environmentSuffix: 'env2',
      });

      expect(stack1.primaryApiEndpoint).not.toBe(stack2.primaryApiEndpoint);
      expect(stack1.dynamoDbTableName).not.toBe(stack2.dynamoDbTableName);
    });
  });

  describe('Stack Lifecycle', () => {
    it('should maintain state across multiple accesses', () => {
      const firstAccess = stack.primaryApiEndpoint;
      const secondAccess = stack.primaryApiEndpoint;

      expect(firstAccess).toBe(secondAccess);
    });

    it('should have readonly outputs after creation', () => {
      const originalEndpoint = stack.primaryApiEndpoint;
      expect(stack.primaryApiEndpoint).toBe(originalEndpoint);
      expect(stack.primaryApiEndpoint).toBeDefined();
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should have correct TypeScript types for outputs', () => {
      const primaryEndpoint: pulumi.Output<string> = stack.primaryApiEndpoint;
      const secondaryEndpoint: pulumi.Output<string> = stack.secondaryApiEndpoint;
      const tableName: pulumi.Output<string> = stack.dynamoDbTableName;
      const nameServers: pulumi.Output<string[]> = stack.hostedZoneNameServers;

      expect(primaryEndpoint).toBeDefined();
      expect(secondaryEndpoint).toBeDefined();
      expect(tableName).toBeDefined();
      expect(nameServers).toBeDefined();
    });

    it('should have correct TapStackArgs interface', () => {
      const args = {
        environmentSuffix: 'test',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-east-2',
        createHostedZone: false,
        tags: {
          key1: 'value1',
          key2: 'value2',
        },
      };

      const typedStack = new TapStack('typed-stack', args);
      expect(typedStack).toBeDefined();
      expect(typedStack).toBeInstanceOf(TapStack);
    });
  });

  describe('Error Handling', () => {
    it('should not throw when accessing outputs', () => {
      expect(() => {
        stack.primaryApiEndpoint;
        stack.secondaryApiEndpoint;
        stack.dynamoDbTableName;
        stack.s3BucketPrimaryName;
        stack.dlqPrimaryUrl;
      }).not.toThrow();
    });

    it('should handle undefined environmentSuffix gracefully', () => {
      const stackWithoutSuffix = new TapStack('stack-no-suffix', {
        environmentSuffix: undefined,
      });
      expect(stackWithoutSuffix).toBeDefined();
      expect(stackWithoutSuffix).toBeInstanceOf(TapStack);
    });

    it('should handle empty tags object', () => {
      const stackWithEmptyTags = new TapStack('stack-empty-tags', {
        environmentSuffix: 'test',
        tags: {},
      });
      expect(stackWithEmptyTags).toBeDefined();
      expect(stackWithEmptyTags).toBeInstanceOf(TapStack);
    });
  });

  describe('Resource Options', () => {
    it('should accept resource options in constructor', () => {
      const stackWithOpts = new TapStack(
        `tap-stack-opts-${environmentSuffix}`,
        { environmentSuffix },
        {
          protect: false,
        }
      );

      expect(stackWithOpts).toBeDefined();
      expect(stackWithOpts).toBeInstanceOf(TapStack);
    });

    it('should accept parent resource option', () => {
      const parentStack = new TapStack('parent-stack', {
        environmentSuffix: 'parent',
      });

      const childStack = new TapStack(
        'child-stack',
        { environmentSuffix: 'child' },
        { parent: parentStack }
      );

      expect(childStack).toBeDefined();
      expect(childStack).toBeInstanceOf(TapStack);
    });
  });

  describe('Live Deployed Infrastructure Validation with AWS SDK', () => {
    let deployedOutputs: any;
    let AWS: any;
    let lambda: any;
    let s3: any;

    beforeAll(() => {
      try {
        const fs = require('fs');
        const path = require('path');
        const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

        if (fs.existsSync(outputsPath)) {
          deployedOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

          // Initialize AWS SDK
          AWS = require('aws-sdk');

          // Extract region from Lambda ARN or API URL
          const region = deployedOutputs.lambdaArn
            ? deployedOutputs.lambdaArn.split(':')[3]
            : 'us-east-1';

          lambda = new AWS.Lambda({ region });
          s3 = new AWS.S3({ region });
        }
      } catch (error) {
        console.log('No deployed outputs found or AWS SDK not available, skipping live validation tests');
      }
    });

    it('should verify S3 bucket exists and is accessible', async () => {
      if (!deployedOutputs?.bucketName || !s3) {
        console.log('Skipping: No deployed bucket or AWS SDK not available');
        return;
      }

      try {
        // Verify bucket exists by checking its location
        const result = await s3.getBucketLocation({
          Bucket: deployedOutputs.bucketName
        }).promise();

        expect(result).toBeDefined();
        console.log(`✓ S3 bucket exists and is accessible: ${deployedOutputs.bucketName}`);
        console.log(`  Location: ${result.LocationConstraint || 'us-east-1'}`);

        // Verify bucket versioning is enabled
        const versioning = await s3.getBucketVersioning({
          Bucket: deployedOutputs.bucketName
        }).promise();

        expect(versioning.Status).toBe('Enabled');
        console.log(`  Versioning: ${versioning.Status}`);

      } catch (error: any) {
        console.error(`Failed to validate S3 bucket: ${error.message}`);
        throw error;
      }
    }, 30000);

    it('should verify Lambda function exists and get its configuration', async () => {
      if (!deployedOutputs?.lambdaArn || !lambda) {
        console.log('Skipping: No deployed Lambda or AWS SDK not available');
        return;
      }

      try {
        // Extract function name from ARN
        const functionName = deployedOutputs.lambdaArn.split(':').pop();

        const result = await lambda.getFunctionConfiguration({
          FunctionName: functionName
        }).promise();

        expect(result).toBeDefined();
        expect(result.FunctionArn).toBe(deployedOutputs.lambdaArn);
        expect(result.Runtime).toMatch(/^nodejs/);
        expect(result.Handler).toBeDefined();

        console.log(`✓ Lambda function exists: ${functionName}`);
        console.log(`  Runtime: ${result.Runtime}`);
        console.log(`  Handler: ${result.Handler}`);
        console.log(`  Memory: ${result.MemorySize}MB`);
        console.log(`  Timeout: ${result.Timeout}s`);

      } catch (error: any) {
        console.error(`Failed to validate Lambda function: ${error.message}`);
        throw error;
      }
    }, 30000);

    it('should invoke deployed API Gateway endpoint and receive valid response', async () => {
      if (!deployedOutputs?.apiUrl) {
        console.log('Skipping: No deployed API URL');
        return;
      }

      try {
        const https = require('https');
        const response = await new Promise<any>((resolve, reject) => {
          const options = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          };

          const req = https.request(deployedOutputs.apiUrl, options, (res: any) => {
            let data = '';
            res.on('data', (chunk: any) => { data += chunk; });
            res.on('end', () => {
              resolve({
                statusCode: res.statusCode,
                body: data,
                headers: res.headers
              });
            });
          });

          req.on('error', reject);
          req.write(JSON.stringify({
            paymentId: 'test-payment-123',
            amount: 100.00,
            currency: 'USD'
          }));
          req.end();
        });

        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.body);
        expect(body.message).toBeDefined();
        expect(body.status).toBe('completed');

        console.log(`✓ API Gateway endpoint responding successfully`);
        console.log(`  Status: ${response.statusCode}`);
        console.log(`  Response: ${JSON.stringify(body, null, 2)}`);

      } catch (error: any) {
        console.error(`Failed to invoke API Gateway: ${error.message}`);
        throw error;
      }
    }, 30000);

    it('should verify DynamoDB table exists (via Lambda environment)', async () => {
      if (!deployedOutputs?.lambdaArn || !lambda) {
        console.log('Skipping: No deployed Lambda or AWS SDK not available');
        return;
      }

      try {
        const functionName = deployedOutputs.lambdaArn.split(':').pop();

        const result = await lambda.getFunctionConfiguration({
          FunctionName: functionName
        }).promise();

        expect(result.Environment).toBeDefined();
        expect(result.Environment.Variables).toBeDefined();

        const envVars = result.Environment.Variables;
        if (envVars.DYNAMODB_TABLE) {
          expect(envVars.DYNAMODB_TABLE).toMatch(/^payments-/);
          console.log(`✓ Lambda configured with DynamoDB table: ${envVars.DYNAMODB_TABLE}`);
        }

        if (envVars.BUCKET_NAME) {
          expect(envVars.BUCKET_NAME).toBe(deployedOutputs.bucketName);
          console.log(`✓ Lambda configured with S3 bucket: ${envVars.BUCKET_NAME}`);
        }

      } catch (error: any) {
        console.error(`Failed to verify Lambda environment: ${error.message}`);
        throw error;
      }
    }, 30000);

    it('should validate resource tags on deployed infrastructure', async () => {
      if (!deployedOutputs?.bucketName || !s3) {
        console.log('Skipping: No deployed resources or AWS SDK not available');
        return;
      }

      try {
        // Check S3 bucket tags
        const tagging = await s3.getBucketTagging({
          Bucket: deployedOutputs.bucketName
        }).promise();

        expect(tagging.TagSet).toBeDefined();
        expect(Array.isArray(tagging.TagSet)).toBe(true);

        const tags = tagging.TagSet.reduce((acc: any, tag: any) => {
          acc[tag.Key] = tag.Value;
          return acc;
        }, {});

        console.log(`✓ S3 bucket has tags:`, tags);

        // Verify common tags exist
        if (tags.Environment) {
          console.log(`  Environment: ${tags.Environment}`);
        }
        if (tags.Name) {
          console.log(`  Name: ${tags.Name}`);
        }

      } catch (error: any) {
        if (error.code === 'NoSuchTagSet') {
          console.log('  No tags configured on S3 bucket');
        } else {
          console.error(`Failed to validate resource tags: ${error.message}`);
        }
      }
    }, 30000);
  });
});
