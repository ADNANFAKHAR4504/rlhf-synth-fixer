import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      const params = template.Parameters;
      expect(params).toBeDefined();
      expect(params.Environment).toBeDefined();
      expect(params.ProjectName).toBeDefined();
      expect(params.NotificationEmail).toBeDefined();
    });

    test('should have correct environment values', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });
  });

  describe('Lambda Function', () => {

    test('should have required environment variables', () => {
      const lambda = template.Resources.LambdaFunction;
      const envVars = lambda.Properties.Environment.Variables;
      expect(envVars).toHaveProperty('ENVIRONMENT');
      expect(envVars).toHaveProperty('DYNAMODB_TABLE');
      expect(envVars).toHaveProperty('S3_BUCKET');
      expect(envVars).toHaveProperty('KMS_KEY_ID');
    });

    test('should have proper IAM role', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Role['Fn::GetAtt']).toEqual(['LambdaExecutionRole', 'Arn']);
    });
  });

  describe('API Gateway', () => {
    test('should be HTTP API type', () => {
      const api = template.Resources.ApiGateway;
      expect(api.Properties.ProtocolType).toBe('HTTP');
    });

    test('should have CORS configuration', () => {
      const api = template.Resources.ApiGateway;
      const cors = api.Properties.CorsConfiguration;
      expect(cors.AllowOrigins).toContain('*');
      expect(cors.AllowMethods).toEqual(expect.arrayContaining(['GET', 'POST', 'PUT', 'DELETE']));
    });

    test('should have Lambda integration', () => {
      const integration = template.Resources.ApiGatewayIntegration;
      expect(integration.Properties.IntegrationType).toBe('AWS_PROXY');
      expect(integration.Properties.PayloadFormatVersion).toBe('2.0');
    });
  });

  describe('DynamoDB Table', () => {
    test('should have correct key schema', () => {
      const table = template.Resources.DynamoDBTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0]).toEqual({
        AttributeName: 'PK',
        KeyType: 'HASH'
      });
      expect(keySchema[1]).toEqual({
        AttributeName: 'SK',
        KeyType: 'RANGE'
      });
    });

    test('should have provisioned throughput', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table.Properties.BillingMode).toBe('PROVISIONED');
      expect(table.Properties.ProvisionedThroughput).toBeDefined();
    });

    test('should have encryption enabled', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
    });
  });

  describe('S3 Bucket', () => {
    test('should have versioning enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have encryption configured', () => {
      const bucket = template.Resources.S3Bucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('should block public access', () => {
      const bucket = template.Resources.S3Bucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('CloudWatch Events', () => {
    test('should have 24-hour schedule', () => {
      const rule = template.Resources.CloudWatchEventRule;
      expect(rule.Properties.ScheduleExpression).toBe('rate(24 hours)');
    });

    test('should target Lambda function', () => {
      const rule = template.Resources.CloudWatchEventRule;
      expect(rule.Properties.Targets[0].Arn['Fn::GetAtt']).toEqual(['LambdaFunction', 'Arn']);
    });
  });

  describe('SNS Topic', () => {
    test('should be encrypted with KMS', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('should have email subscription', () => {
      const subscription = template.Resources.SNSSubscription;
      expect(subscription.Properties.Protocol).toBe('email');
      expect(subscription.Properties.Endpoint.Ref).toBe('NotificationEmail');
    });
  });

  describe('Resource Tags', () => {
    const resources = ['LambdaFunction', 'DynamoDBTable', 'S3Bucket'];

    test.each(resources)('%s should have required tags', (resourceName) => {
      const resource = template.Resources[resourceName];
      const tags = resource.Properties.Tags;

      const hasEnvironmentTag = tags.some((tag: any) =>
        tag.Key === 'Environment' && tag.Value.Ref === 'Environment'
      );
      const hasProjectTag = tags.some((tag: any) =>
        tag.Key === 'Project' && tag.Value.Ref === 'ProjectName'
      );

      expect(hasEnvironmentTag).toBe(true);
      expect(hasProjectTag).toBe(true);
    });
  });
});
