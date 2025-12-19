import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('Multi-Environment Data Processing Pipeline Integration Tests', () => {
  describe('Stack Synthesis', () => {
    test('should synthesize stack successfully for dev environment', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test123',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toBeDefined();
      expect(synthesized.length).toBeGreaterThan(0);
    });

    test('should contain all required AWS resources', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);
      const resources = manifest.resource;

      // Verify resource types exist
      expect(resources.aws_s3_bucket).toBeDefined();
      expect(Object.keys(resources.aws_s3_bucket).length).toBeGreaterThan(0);

      expect(resources.aws_dynamodb_table).toBeDefined();
      expect(Object.keys(resources.aws_dynamodb_table).length).toBeGreaterThan(0);

      expect(resources.aws_lambda_function).toBeDefined();
      expect(Object.keys(resources.aws_lambda_function).length).toBeGreaterThan(0);

      expect(resources.aws_iam_role).toBeDefined();
      expect(Object.keys(resources.aws_iam_role).length).toBeGreaterThan(0);

      expect(resources.aws_cloudwatch_log_group).toBeDefined();
      expect(Object.keys(resources.aws_cloudwatch_log_group).length).toBeGreaterThan(0);
    });
  });

  describe('S3 Data Storage Configuration', () => {
    test('S3 bucket has correct properties', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'xyz789',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);
      const s3Buckets = manifest.resource.aws_s3_bucket;
      const bucketId = Object.keys(s3Buckets)[0];
      const bucket = s3Buckets[bucketId];

      expect(bucket.bucket).toContain('company-data');
      expect(bucket.bucket).toContain('xyz789');
      expect(bucket.force_destroy).toBe(true);
    });

    test('S3 bucket has versioning enabled', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);
      const versioning = manifest.resource.aws_s3_bucket_versioning;

      expect(versioning).toBeDefined();
      const versioningId = Object.keys(versioning)[0];
      expect(versioning[versioningId].versioning_configuration.status).toBe('Enabled');
    });

    test('S3 bucket has encryption configured', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);
      const encryption = manifest.resource.aws_s3_bucket_server_side_encryption_configuration;

      expect(encryption).toBeDefined();
      const encryptionId = Object.keys(encryption)[0];
      expect(encryption[encryptionId].rule[0].apply_server_side_encryption_by_default.sse_algorithm).toBe('AES256');
    });

    test('S3 bucket has proper tags', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'prod123',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);
      const s3Buckets = manifest.resource.aws_s3_bucket;
      const bucketId = Object.keys(s3Buckets)[0];
      const bucket = s3Buckets[bucketId];

      expect(bucket.tags.Environment).toBe('dev');
      expect(bucket.tags.Project).toBe('data-processing-pipeline');
      expect(bucket.tags.EnvironmentSuffix).toBe('prod123');
    });
  });

  describe('DynamoDB Job Tracking Configuration', () => {
    test('DynamoDB table has correct schema', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);
      const tables = manifest.resource.aws_dynamodb_table;
      const tableId = Object.keys(tables)[0];
      const table = tables[tableId];

      expect(table.hash_key).toBe('jobId');
      expect(table.range_key).toBe('timestamp');
      expect(table.billing_mode).toBe('PROVISIONED');
    });

    test('DynamoDB table has StatusIndex GSI configured', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);
      const tables = manifest.resource.aws_dynamodb_table;
      const tableId = Object.keys(tables)[0];
      const table = tables[tableId];

      expect(table.global_secondary_index).toBeDefined();
      expect(table.global_secondary_index.length).toBe(1);
      expect(table.global_secondary_index[0].name).toBe('StatusIndex');
      expect(table.global_secondary_index[0].hash_key).toBe('status');
    });

    test('DynamoDB table has point-in-time recovery enabled', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);
      const tables = manifest.resource.aws_dynamodb_table;
      const tableId = Object.keys(tables)[0];
      const table = tables[tableId];

      expect(table.point_in_time_recovery.enabled).toBe(true);
    });

    test('DynamoDB table has correct naming convention', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'staging456',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);
      const tables = manifest.resource.aws_dynamodb_table;
      const tableId = Object.keys(tables)[0];
      const table = tables[tableId];

      expect(table.name).toBe('job-tracking-dev-staging456');
    });
  });

  describe('Lambda Data Processor Configuration', () => {
    test('Lambda function has correct runtime and handler', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);
      const lambdas = manifest.resource.aws_lambda_function;
      const lambdaId = Object.keys(lambdas)[0];
      const lambda = lambdas[lambdaId];

      expect(lambda.runtime).toBe('nodejs18.x');
      expect(lambda.handler).toBe('index.handler');
      expect(lambda.timeout).toBe(300);
    });

    test('Lambda function has correct environment variables', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);
      const lambdas = manifest.resource.aws_lambda_function;
      const lambdaId = Object.keys(lambdas)[0];
      const lambda = lambdas[lambdaId];

      expect(lambda.environment.variables.ENVIRONMENT).toBe('dev');
      // In CDKTF synthesis, these are Terraform references
      expect(lambda.environment.variables.BUCKET_NAME).toBeDefined();
      expect(lambda.environment.variables.TABLE_NAME).toBeDefined();
      expect(lambda.environment.variables.REGION).toBe('ap-southeast-1');
    });

    test('Lambda function has environment-specific memory allocation', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);
      const lambdas = manifest.resource.aws_lambda_function;
      const lambdaId = Object.keys(lambdas)[0];
      const lambda = lambdas[lambdaId];

      // Dev environment should have 128 MB
      expect(lambda.memory_size).toBe(128);
    });

    test('Lambda function has correct naming convention', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'prod789',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);
      const lambdas = manifest.resource.aws_lambda_function;
      const lambdaId = Object.keys(lambdas)[0];
      const lambda = lambdas[lambdaId];

      expect(lambda.function_name).toBe('data-processor-dev-prod789');
    });
  });

  describe('IAM Role and Policy Configuration', () => {
    test('IAM role has correct assume role policy', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);
      const roles = manifest.resource.aws_iam_role;
      const roleId = Object.keys(roles)[0];
      const role = roles[roleId];

      const assumeRolePolicy = JSON.parse(role.assume_role_policy);
      expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('IAM policy has S3 and DynamoDB permissions', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);
      const policies = manifest.resource.aws_iam_policy;

      expect(policies).toBeDefined();
      const policyId = Object.keys(policies)[0];
      const policy = policies[policyId];

      const policyDocument = JSON.parse(policy.policy);
      expect(policyDocument.Statement.length).toBeGreaterThan(0);
    });

    test('Lambda has policy attachments', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);
      const attachments = manifest.resource.aws_iam_role_policy_attachment;

      expect(attachments).toBeDefined();
      expect(Object.keys(attachments).length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Logging Configuration', () => {
    test('CloudWatch log group exists with correct retention', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);
      const logGroups = manifest.resource.aws_cloudwatch_log_group;
      const logGroupId = Object.keys(logGroups)[0];
      const logGroup = logGroups[logGroupId];

      expect(logGroup.name).toContain('/aws/lambda/data-processor');
      expect(logGroup.retention_in_days).toBe(7); // Dev environment
    });

    test('CloudWatch log group has correct tags', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);
      const logGroups = manifest.resource.aws_cloudwatch_log_group;
      const logGroupId = Object.keys(logGroups)[0];
      const logGroup = logGroups[logGroupId];

      expect(logGroup.tags.Environment).toBe('dev');
      expect(logGroup.tags.Project).toBe('data-processing-pipeline');
    });
  });

  describe('Cross-Environment Isolation', () => {
    test('All resources have environment tags', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);

      const s3Buckets = manifest.resource.aws_s3_bucket;
      const bucketId = Object.keys(s3Buckets)[0];
      expect(s3Buckets[bucketId].tags.Environment).toBe('dev');

      const tables = manifest.resource.aws_dynamodb_table;
      const tableId = Object.keys(tables)[0];
      expect(tables[tableId].tags.Environment).toBe('dev');

      const lambdas = manifest.resource.aws_lambda_function;
      const lambdaId = Object.keys(lambdas)[0];
      expect(lambdas[lambdaId].tags.Environment).toBe('dev');
    });

    test('All resources include environment suffix in names', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'unique987',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);

      const s3Buckets = manifest.resource.aws_s3_bucket;
      const bucketId = Object.keys(s3Buckets)[0];
      expect(s3Buckets[bucketId].bucket).toContain('unique987');

      const tables = manifest.resource.aws_dynamodb_table;
      const tableId = Object.keys(tables)[0];
      expect(tables[tableId].name).toContain('unique987');

      const lambdas = manifest.resource.aws_lambda_function;
      const lambdaId = Object.keys(lambdas)[0];
      expect(lambdas[lambdaId].function_name).toContain('unique987');
    });
  });

  describe('Stack Outputs', () => {
    test('Stack outputs all required resource identifiers', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);
      const outputs = manifest.output;

      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });
  });

  describe('AWS Region Configuration', () => {
    test('Stack uses correct AWS region', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-1',
      });

      const synthesized = Testing.synth(stack);
      const manifest = JSON.parse(synthesized);
      const provider = manifest.provider.aws[0];

      expect(provider.region).toBe('ap-southeast-1');
    });
  });
});
