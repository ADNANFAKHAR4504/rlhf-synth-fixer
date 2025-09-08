import * as AWS from 'aws-sdk';
import axios from 'axios';

// AWS SDK Configuration
AWS.config.update({ region: 'us-west-1' });
const cloudformation = new AWS.CloudFormation();
const s3 = new AWS.S3();
const secretsManager = new AWS.SecretsManager();
const rds = new AWS.RDS();

// Test configuration
const STACK_NAME = `TapStack${process.env.ENVIRONMENT_SUFFIX || 'dev'}`;
const TIMEOUT = 60000; // Increased timeout for CI environments

// Define the shape of our API response for TypeScript
interface ApiResponse {
  status: string;
  message: string;
  database_version?: string;
  database_name?: string;
}

// Define the shape of our CloudFormation outputs
interface StackOutputs {
  WebsiteBucketName: string;
  WebsiteURL: string;
  ApiGatewayEndpoint: string;
  ApiEndpointURL: string;
  DatabaseEndpoint: string;
  DatabaseSecretArn: string;
}

describe('TapStack Integration Tests', () => {
  let stackOutputs: StackOutputs;

  beforeAll(async () => {
    try {
      const response = await cloudformation
        .describeStacks({ StackName: STACK_NAME })
        .promise();
      const stack = response.Stacks?.[0];
      if (!stack?.Outputs) {
        throw new Error(`Stack ${STACK_NAME} not found or has no outputs`);
      }
      stackOutputs = stack.Outputs.reduce((acc, output) => {
        if (output.OutputKey) {
          acc[output.OutputKey as keyof StackOutputs] =
            output.OutputValue || '';
        }
        return acc;
      }, {} as StackOutputs);
    } catch (error) {
      console.error('Failed to load stack outputs:', error);
      throw error;
    }
  }, TIMEOUT);

  describe('API Gateway Integration', () => {
    test(
      'should return a healthy response from the /api endpoint',
      async () => {
        const { data, status } = await axios.get<ApiResponse>(
          stackOutputs.ApiEndpointURL
        );
        expect(status).toBe(200);
        expect(data.status).toBe('success');
        expect(data.message).toMatch(/connected|success/i);
      },
      TIMEOUT
    );

    test(
      'should have proper CORS headers',
      async () => {
        const { headers } = await axios({
          method: 'options',
          url: stackOutputs.ApiEndpointURL,
        });
        expect(headers['access-control-allow-origin']).toBe('*');
        expect(headers['access-control-allow-methods']).toContain('GET');
      },
      TIMEOUT
    );
  });

  describe('Database and Lambda Integration', () => {
    test(
      'Lambda should connect to the database and retrieve info',
      async () => {
        const { data } = await axios.get<ApiResponse>(
          stackOutputs.ApiEndpointURL
        );
        expect(data.status).toBe('success');
        expect(data.database_version).toMatch(/PostgreSQL/i);
        expect(data.database_name).toBe('mywebappdb');
      },
      TIMEOUT
    );
  });

  describe('Infrastructure Health Checks', () => {
    test(
      'RDS instance should be running and private',
      async () => {
        const response = await rds.describeDBInstances().promise();
        const instance = response.DBInstances?.find(
          db => db.Endpoint?.Address === stackOutputs.DatabaseEndpoint
        );
        expect(instance).toBeDefined();
        expect(instance?.DBInstanceStatus).toBe('available');
        expect(instance?.PubliclyAccessible).toBe(false);
      },
      TIMEOUT
    );

    test(
      'S3 bucket should be configured for website hosting',
      async () => {
        const config = await s3
          .getBucketWebsite({ Bucket: stackOutputs.WebsiteBucketName })
          .promise();
        expect(config.IndexDocument?.Suffix).toBe('index.html');
      },
      TIMEOUT
    );

    test(
      'Secrets Manager secret should contain valid credentials',
      async () => {
        const secretValue = await secretsManager
          .getSecretValue({ SecretId: stackOutputs.DatabaseSecretArn })
          .promise();
        const credentials = JSON.parse(secretValue.SecretString!);
        expect(credentials.username).toBe('postgres');
        expect(credentials.password).toBeDefined();
        expect(credentials.password.length).toBe(32);
      },
      TIMEOUT
    );
  });
});
