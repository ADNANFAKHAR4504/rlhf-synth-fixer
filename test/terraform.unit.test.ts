import * as fs from 'fs';
import * as path from 'path';

// --- Sanity checks for the Terraform stack file itself ---

const STACK_FILE_PATH = path.resolve(__dirname, '..', 'lib', 'tap_stack.tf');

describe('Terraform single-file stack: tap_stack.tf', () => {
  test('tap_stack.tf exists', () => {
    const exists = fs.existsSync(STACK_FILE_PATH);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${STACK_FILE_PATH}`);
    }
    expect(exists).toBe(true);
  });

  test('does NOT declare provider in tap_stack.tf (provider.tf owns providers)', () => {
    const content = fs.readFileSync(STACK_FILE_PATH, 'utf8');
    const providerRegex = /^\s*provider\s+"aws"/m;
    expect(providerRegex.test(content)).toBe(false);
  });

  test('declares aws_region variable in tap_stack.tf', () => {
    const content = fs.readFileSync(STACK_FILE_PATH, 'utf8');
    const variableRegex = /^\s*variable\s+"aws_region"/m;
    expect(variableRegex.test(content)).toBe(true);
  });
});

// --- Plan-based tests (only run if plan.json is available) ---

const PLAN_JSON_PATH = path.resolve(__dirname, '..', 'lib', 'plan.json');

// This conditional block makes the test suite robust for both local and CI environments.
if (fs.existsSync(PLAN_JSON_PATH)) {
  describe('Terraform Plan Unit Tests', () => {
    let plan: any;

    beforeAll(() => {
      const planJson = fs.readFileSync(PLAN_JSON_PATH, 'utf-8');
      plan = JSON.parse(planJson);
    });

    test('should create the correct number of resources', () => {
      const resourceCount = plan.planned_values.root_module.resources.length;
      expect(resourceCount).toBe(22); // Updated count without WAF resources
    });

    test('S3 bucket should have versioning and encryption enabled', () => {
      const bucketVersioning = plan.planned_values.root_module.resources.find(
        (r: any) =>
          r.type === 'aws_s3_bucket_versioning' &&
          r.name === 'lambda_bucket_versioning'
      );
      const bucketEncryption = plan.planned_values.root_module.resources.find(
        (r: any) =>
          r.type === 'aws_s3_bucket_server_side_encryption_configuration' &&
          r.name === 'lambda_bucket_sse'
      );

      expect(bucketVersioning.values.versioning_configuration[0].status).toBe(
        'Enabled'
      );
      expect(
        bucketEncryption.values.rule[0]
          .apply_server_side_encryption_by_default[0].sse_algorithm
      ).toBe('AES256');
    });

    test('S3 bucket should block all public access', () => {
      const publicAccessBlock = plan.planned_values.root_module.resources.find(
        (r: any) =>
          r.type === 'aws_s3_bucket_public_access_block' &&
          r.name === 'lambda_bucket_pab'
      );

      expect(publicAccessBlock.values.block_public_acls).toBe(true);
      expect(publicAccessBlock.values.block_public_policy).toBe(true);
      expect(publicAccessBlock.values.ignore_public_acls).toBe(true);
      expect(publicAccessBlock.values.restrict_public_buckets).toBe(true);
    });

    test('IAM policy should grant least-privilege permissions', () => {
      const iamPolicy = plan.planned_values.root_module.resources.find(
        (r: any) =>
          r.type === 'aws_iam_policy' && r.name === 'lambda_exec_policy'
      );
      const policyDocument = JSON.parse(iamPolicy.values.policy);
      const statements = policyDocument.Statement;

      const logStatement = statements.find(
        (s: any) => s.Resource === 'arn:aws:logs:*:*:*'
      );
      expect(logStatement.Effect).toBe('Allow');
      expect(logStatement.Action).toEqual([
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ]);

      const dynamoStatement = statements.find((s: any) =>
        s.Action.includes('dynamodb:GetItem')
      );
      expect(dynamoStatement.Effect).toBe('Allow');
      expect(dynamoStatement.Action).toEqual([
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
      ]);
      expect(dynamoStatement.Resource).not.toBe('*');
    });

    test('Lambda function should use Python 3.9 runtime', () => {
      const lambdaFunction = plan.planned_values.root_module.resources.find(
        (r: any) => r.type === 'aws_lambda_function' && r.name === 'tap_lambda'
      );
      expect(lambdaFunction.values.runtime).toBe('python3.9');
    });

    test('Frontend S3 bucket should have versioning and encryption enabled', () => {
      const frontendBucketVersioning =
        plan.planned_values.root_module.resources.find(
          (r: any) =>
            r.type === 'aws_s3_bucket_versioning' &&
            r.name === 'frontend_bucket_versioning'
        );
      const frontendBucketEncryption =
        plan.planned_values.root_module.resources.find(
          (r: any) =>
            r.type === 'aws_s3_bucket_server_side_encryption_configuration' &&
            r.name === 'frontend_bucket_sse'
        );

      expect(
        frontendBucketVersioning.values.versioning_configuration[0].status
      ).toBe('Enabled');
      expect(
        frontendBucketEncryption.values.rule[0]
          .apply_server_side_encryption_by_default[0].sse_algorithm
      ).toBe('AES256');
    });

    test('CloudFront distribution should enforce HTTPS', () => {
      const cloudFrontDistribution =
        plan.planned_values.root_module.resources.find(
          (r: any) =>
            r.type === 'aws_cloudfront_distribution' &&
            r.name === 'frontend_distribution'
        );
      expect(
        cloudFrontDistribution.values.default_cache_behavior[0]
          .viewer_protocol_policy
      ).toBe('redirect-to-https');
    });

    test('API CloudFront distribution should have no caching for API calls', () => {
      const apiCloudFrontDistribution =
        plan.planned_values.root_module.resources.find(
          (r: any) =>
            r.type === 'aws_cloudfront_distribution' &&
            r.name === 'api_distribution'
        );
      expect(
        apiCloudFrontDistribution.values.default_cache_behavior[0].default_ttl
      ).toBe(0);
      expect(
        apiCloudFrontDistribution.values.default_cache_behavior[0].max_ttl
      ).toBe(0);
      expect(
        apiCloudFrontDistribution.values.default_cache_behavior[0].min_ttl
      ).toBe(0);
    });

    test('Cognito User Pool should have strong password policy', () => {
      const cognitoUserPool = plan.planned_values.root_module.resources.find(
        (r: any) =>
          r.type === 'aws_cognito_user_pool' && r.name === 'tap_user_pool'
      );
      const passwordPolicy = cognitoUserPool.values.password_policy[0];
      expect(passwordPolicy.minimum_length).toBe(8);
      expect(passwordPolicy.require_lowercase).toBe(true);
      expect(passwordPolicy.require_numbers).toBe(true);
      expect(passwordPolicy.require_symbols).toBe(true);
      expect(passwordPolicy.require_uppercase).toBe(true);
    });

    test('All resources should have proper tagging', () => {
      const taggedResources = [
        'aws_s3_bucket.frontend_bucket',
        'aws_s3_bucket.lambda_bucket',
        'aws_dynamodb_table.tap_table',
        'aws_apigatewayv2_api.tap_api',
        'aws_cloudfront_distribution.frontend_distribution',
        'aws_cloudfront_distribution.api_distribution',
        'aws_cognito_user_pool.tap_user_pool',
      ];

      taggedResources.forEach(resourcePath => {
        const [resourceType, resourceName] = resourcePath.split('.');
        const resource = plan.planned_values.root_module.resources.find(
          (r: any) => r.type === resourceType && r.name === resourceName
        );
        expect(resource.values.tags.Name).toBeDefined();
        expect(resource.values.tags.Environment).toBeDefined();
        expect(resource.values.tags.Owner).toBeDefined();
      });
    });
  });
} else {
  // If plan.json doesn't exist, skip these tests and inform the user.
  describe('Terraform Plan Unit Tests', () => {
    test.skip('Skipping plan tests: ./lib/plan.json not found. Generate it to run these tests.', () => {});
  });
}
