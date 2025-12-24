import { CloudFormationClient, ListStacksCommand } from '@aws-sdk/client-cloudformation';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { LambdaClient, ListFunctionsCommand } from '@aws-sdk/client-lambda';
import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

describe('Infrastructure Integration Tests', () => {
  const requiredEnvVars = {
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    STACK_NAME: process.env.STACK_NAME || 'test-stack',
    STAGE: process.env.STAGE || 'dev'
  };

  // Environment Tests
  describe('Environment Configuration Tests', () => {
    test('should have valid AWS region configuration', () => {
      expect(requiredEnvVars.AWS_REGION).toMatch(/^[a-z]{2}-[a-z]+-\d{1}$/);
    });

    test('should validate environment setup', () => {
      expect(['dev', 'staging', 'prod']).toContain(requiredEnvVars.STAGE);
    });

    test('should have valid stack name format', () => {
      expect(requiredEnvVars.STACK_NAME).toMatch(/^[a-zA-Z][a-zA-Z0-9-]*$/);
      expect(requiredEnvVars.STACK_NAME.length).toBeLessThanOrEqual(128);
    });

    test('should have API configuration if enabled', () => {
      // Only check API configuration if API Gateway is enabled
      if (process.env.API_ENABLED === 'true') {
        expect(process.env.API_GATEWAY_ENDPOINT).toBeDefined();
        expect(process.env.API_GATEWAY_ENDPOINT).toMatch(
          /^https:\/\/[a-z0-9]+\.execute-api\.[a-z-]+-\d\.amazonaws\.com\/[a-z]+/
        );

        // Check API keys if they're required
        if (process.env.API_KEY_REQUIRED === 'true') {
          expect(process.env.READ_ONLY_API_KEY).toMatch(/^[A-Za-z0-9]{40}$/);
          expect(process.env.ADMIN_API_KEY).toMatch(/^[A-Za-z0-9]{40}$/);
        }
      }
    });
  });

  // AWS Resource Tests
  describe('AWS Resource Tests', () => {
    let s3Client: S3Client;
    let cfClient: CloudFormationClient;
    let dynamoClient: DynamoDBClient;
    let lambdaClient: LambdaClient;

    beforeAll(() => {
      const config = {
        region: requiredEnvVars.AWS_REGION,
        credentials: process.env.CI === 'true' ? undefined : {
          accessKeyId: requiredEnvVars.AWS_ACCESS_KEY_ID!,
          secretAccessKey: requiredEnvVars.AWS_SECRET_ACCESS_KEY!
        }
      };

      s3Client = new S3Client(config);
      cfClient = new CloudFormationClient(config);
      dynamoClient = new DynamoDBClient(config);
      lambdaClient = new LambdaClient(config);
    });

    describe('S3 Tests', () => {
      test('should list S3 buckets', async () => {
        try {
          const command = new ListBucketsCommand({});
          const response = await s3Client.send(command);
          expect(response.Buckets).toBeDefined();

          // Don't require buckets to exist, but if they do, validate them
          if (response.Buckets && response.Buckets.length > 0) {
            response.Buckets.forEach(bucket => {
              expect(bucket.Name).toBeDefined();
              expect(bucket.CreationDate).toBeDefined();
            });
          }
        } catch (error: any) {
          if (error.name === 'CredentialsProviderError') {
            console.warn('Skipping S3 test - no credentials available');
            return;
          }
          throw error;
        }
      });
    });

    describe('CloudFormation Tests', () => {
      test('should validate stack exists if deployed', async () => {
        try {
          const command = new ListStacksCommand({});
          const response = await cfClient.send(command);

          if (response.StackSummaries) {
            const stack = response.StackSummaries.find(
              s => s.StackName === requiredEnvVars.STACK_NAME
            );

            if (stack) {
              expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stack.StackStatus);
            }
          }
        } catch (error: any) {
          if (error.name === 'CredentialsProviderError') {
            console.warn('Skipping CloudFormation test - no credentials available');
            return;
          }
          throw error;
        }
      });
    });

    describe('DynamoDB Tests', () => {
      test('should verify DynamoDB tables if configured', async () => {
        // Skip if DynamoDB is not used in the stack
        if (process.env.USES_DYNAMODB !== 'true') {
          console.log('Skipping DynamoDB tests - not configured for this stack');
          return;
        }

        try {
          const command = new ListTablesCommand({});
          const response = await dynamoClient.send(command);
          expect(response.TableNames).toBeDefined();
        } catch (error: any) {
          if (error.name === 'CredentialsProviderError') {
            console.warn('Skipping DynamoDB test - no credentials available');
            return;
          }
          throw error;
        }
      });
    });

    describe('Lambda Tests', () => {
      test('should check Lambda functions if configured', async () => {
        // Skip if Lambda is not used in the stack
        if (process.env.USES_LAMBDA !== 'true') {
          console.log('Skipping Lambda tests - not configured for this stack');
          return;
        }

        try {
          const command = new ListFunctionsCommand({});
          const response = await lambdaClient.send(command);

          if (response.Functions && response.Functions.length > 0) {
            response.Functions.forEach(fn => {
              if (fn.FunctionName?.includes(requiredEnvVars.STACK_NAME)) {
                expect(fn.Runtime).toBeDefined();
                expect(fn.Timeout).toBeDefined();
                expect(fn.MemorySize).toBeDefined();
              }
            });
          }
        } catch (error: any) {
          if (error.name === 'CredentialsProviderError') {
            console.warn('Skipping Lambda test - no credentials available');
            return;
          }
          throw error;
        }
      });
    });
  });

  // Infrastructure Outputs Tests
  describe('Infrastructure Outputs Tests', () => {
    let outputs: any;

    beforeAll(() => {
      try {
        const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
        outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
      } catch (error) {
        console.warn('Could not load flat-outputs.json');
      }
    });

    describe('VPC and Networking Tests', () => {
      test('should have valid VPC ID', () => {
        expect(outputs.vpc_id).toBeDefined();
        expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]{17}$/);
      });

      test('should have valid subnet configurations', () => {
        // Test public subnets
        const publicSubnets = outputs.public_subnet_ids;
        expect(Array.isArray(publicSubnets)).toBe(true);
        expect(publicSubnets.length).toBeGreaterThan(0);
        publicSubnets.forEach((subnetId: string) => {
          expect(subnetId).toMatch(/^subnet-[a-f0-9]{17}$/);
        });

        // Test private subnets
        const privateSubnets = outputs.private_subnet_ids;
        expect(Array.isArray(privateSubnets)).toBe(true);
        expect(privateSubnets.length).toBeGreaterThan(0);
        privateSubnets.forEach((subnetId: string) => {
          expect(subnetId).toMatch(/^subnet-[a-f0-9]{17}$/);
        });

        // Test database subnets
        const dbSubnets = outputs.database_subnet_ids;
        expect(Array.isArray(dbSubnets)).toBe(true);
        expect(dbSubnets.length).toBeGreaterThan(0);
        dbSubnets.forEach((subnetId: string) => {
          expect(subnetId).toMatch(/^subnet-[a-f0-9]{17}$/);
        });
      });
    });

    describe('Database Tests', () => {
      test('should have valid RDS cluster configuration', () => {
        expect(outputs.rds_cluster_id).toBeDefined();
        expect(outputs.rds_cluster_id).toContain('aurora-cluster-');
      });
    });

    describe('ECS Tests', () => {
      test('should have valid ECS cluster configuration', () => {
        expect(outputs.ecs_cluster_arn).toBeDefined();
        expect(outputs.ecs_cluster_name).toBeDefined();
        expect(outputs.ecs_service_name).toBeDefined();
        expect(outputs.ecs_cluster_arn).toMatch(/^arn:aws:ecs:/);
        expect(outputs.ecs_cluster_name).toContain('ecs-cluster-');
        expect(outputs.ecs_service_name).toContain('trading-app-service-');
      });
    });

    describe('SNS Topics Tests', () => {
      test('should have valid SNS topic configurations', () => {
        expect(outputs.sns_alerts_topic_arn).toBeDefined();
        expect(outputs.sns_status_topic_arn).toBeDefined();
        expect(outputs.sns_alerts_topic_arn).toMatch(/^arn:aws:sns:/);
        expect(outputs.sns_status_topic_arn).toMatch(/^arn:aws:sns:/);
      });
    });

    describe('CloudWatch Tests', () => {
      test('should have valid CloudWatch dashboard configuration', () => {
        expect(outputs.cloudwatch_dashboard_name).toBeDefined();
        expect(outputs.cloudwatch_dashboard_name).toContain('migration-dashboard-');
      });
    });

    describe('Lambda Tests', () => {
      test('should have valid Lambda function configuration', () => {
        expect(outputs.lambda_rollback_function_name).toBeDefined();
        expect(outputs.lambda_rollback_function_name).toContain('migration-rollback-');
      });
    });
  });
});
