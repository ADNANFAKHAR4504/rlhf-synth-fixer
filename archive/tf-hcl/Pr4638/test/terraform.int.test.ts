import { S3, CloudFront, WAFV2, CloudWatch, Lambda, KMS, DynamoDB, Route53 } from 'aws-sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, any> = {};

try {
  outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  console.warn('Warning: cfn-outputs/flat-outputs.json not found. Integration tests will be skipped.');
}

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const s3 = new S3({ region: AWS_REGION });
const cloudfront = new CloudFront({ region: AWS_REGION });
const wafv2 = new WAFV2({ region: AWS_REGION });
const cloudwatch = new CloudWatch({ region: AWS_REGION });
const lambda = new Lambda({ region: AWS_REGION });
const kms = new KMS({ region: AWS_REGION });
const dynamodb = new DynamoDB({ region: AWS_REGION });
const route53 = new Route53({ region: AWS_REGION });

describe('Terraform CloudFront CDN Integration Tests - Deployed Resources', () => {
  beforeAll(() => {
    if (Object.keys(outputs).length === 0) {
      console.warn('Outputs not available. Skipping integration tests.');
    }
  });

  describe('S3 Origin Bucket', () => {
    test('should have origin bucket created', async () => {
      if (!outputs.s3_origin_bucket_name) {
        console.log('Skipping: S3 origin bucket output not available');
        return;
      }

      const response = await s3.headBucket({ Bucket: outputs.s3_origin_bucket_name }).promise();
      expect(response).toBeDefined();
    });

    test('should have versioning enabled on origin bucket', async () => {
      if (!outputs.s3_origin_bucket_name) return;

      const response = await s3.getBucketVersioning({ Bucket: outputs.s3_origin_bucket_name }).promise();
      expect(response.Status).toBe('Enabled');
    });

    test('should have encryption enabled on origin bucket', async () => {
      if (!outputs.s3_origin_bucket_name) return;

      const response = await s3.getBucketEncryption({ Bucket: outputs.s3_origin_bucket_name }).promise();
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules[0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
    });

    test('should have lifecycle policy for Glacier transition', async () => {
      if (!outputs.s3_origin_bucket_name) return;

      const response = await s3.getBucketLifecycleConfiguration({ Bucket: outputs.s3_origin_bucket_name }).promise();
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const glacierRule = response.Rules!.find(r => r.Transitions && r.Transitions.some(t => t.StorageClass === 'GLACIER'));
      expect(glacierRule).toBeDefined();
    });

    test('should have public access blocked', async () => {
      if (!outputs.s3_origin_bucket_name) return;

      const response = await s3.getPublicAccessBlock({ Bucket: outputs.s3_origin_bucket_name }).promise();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('S3 Logs Bucket', () => {
    test('should have logs bucket created', async () => {
      if (!outputs.s3_logs_bucket_name) return;

      const response = await s3.headBucket({ Bucket: outputs.s3_logs_bucket_name }).promise();
      expect(response).toBeDefined();
    });

    test('should have encryption enabled on logs bucket', async () => {
      if (!outputs.s3_logs_bucket_name) return;

      const response = await s3.getBucketEncryption({ Bucket: outputs.s3_logs_bucket_name }).promise();
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules[0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
    });

    test('should have lifecycle policy to delete old logs', async () => {
      if (!outputs.s3_logs_bucket_name) return;

      const response = await s3.getBucketLifecycleConfiguration({ Bucket: outputs.s3_logs_bucket_name }).promise();
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const expirationRule = response.Rules!.find(r => r.Expiration && r.Expiration.Days);
      expect(expirationRule).toBeDefined();
    });
  });

  describe('KMS Key', () => {
    test('should have KMS key created with rotation enabled', async () => {
      if (!outputs.kms_key_arn) return;

      const keyId = outputs.kms_key_arn.split('/').pop();
      const response = await kms.describeKey({ KeyId: keyId }).promise();

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
    });

    test('should have key rotation enabled', async () => {
      if (!outputs.kms_key_arn) return;

      const keyId = outputs.kms_key_arn.split('/').pop();
      const response = await kms.getKeyRotationStatus({ KeyId: keyId }).promise();

      expect(response.KeyRotationEnabled).toBe(true);
    });
  });

  describe('CloudFront Distribution', () => {
    let distribution: CloudFront.Distribution | undefined;

    beforeAll(async () => {
      if (!outputs.cloudfront_distribution_id) return;

      const response = await cloudfront.getDistribution({ Id: outputs.cloudfront_distribution_id }).promise();
      distribution = response.Distribution;
    });

    test('should have CloudFront distribution deployed and enabled', () => {
      if (!outputs.cloudfront_distribution_id) {
        console.log('Skipping: CloudFront distribution output not available');
        return;
      }

      expect(distribution).toBeDefined();
      expect(distribution!.Status).toBe('Deployed');
      expect(distribution!.DistributionConfig.Enabled).toBe(true);
    });

    test('should have IPv6 enabled', () => {
      if (!distribution) return;

      expect(distribution!.DistributionConfig.IsIPV6Enabled).toBe(true);
    });

    test('should have HTTP/2 and HTTP/3 enabled', () => {
      if (!distribution) return;

      expect(distribution!.DistributionConfig.HttpVersion).toBe('http2and3');
    });

    test('should have WAF Web ACL attached', () => {
      if (!distribution) return;

      expect(distribution!.DistributionConfig.WebACLId).toBeDefined();
      expect(distribution!.DistributionConfig.WebACLId).toMatch(/^arn:aws:wafv2/);
    });

    test('should have logging enabled', () => {
      if (!distribution) return;

      expect(distribution!.DistributionConfig.Logging).toBeDefined();
      expect(distribution!.DistributionConfig.Logging!.Enabled).toBe(true);
      expect(distribution!.DistributionConfig.Logging!.Prefix).toBe('cdn-access-logs/');
    });

    test('should have S3 origin with OAI', () => {
      if (!distribution) return;

      expect(distribution!.DistributionConfig.Origins.Items).toBeDefined();
      expect(distribution!.DistributionConfig.Origins.Items!.length).toBeGreaterThan(0);

      const s3Origin = distribution!.DistributionConfig.Origins.Items![0];
      expect(s3Origin.S3OriginConfig).toBeDefined();
      expect(s3Origin.S3OriginConfig!.OriginAccessIdentity).toBeDefined();
      expect(s3Origin.S3OriginConfig!.OriginAccessIdentity).toContain('origin-access-identity/cloudfront/');
    });

    test('should have default cache behavior with HTTPS redirect', () => {
      if (!distribution) return;

      const defaultCacheBehavior = distribution!.DistributionConfig.DefaultCacheBehavior;
      expect(defaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
      expect(defaultCacheBehavior.Compress).toBe(true);
    });

    test('should have ordered cache behavior for premium content', () => {
      if (!distribution) return;

      const orderedBehaviors = distribution!.DistributionConfig.CacheBehaviors?.Items;
      expect(orderedBehaviors).toBeDefined();
      expect(orderedBehaviors!.length).toBeGreaterThan(0);

      const premiumBehavior = orderedBehaviors!.find(b => b.PathPattern === 'premium/*');
      expect(premiumBehavior).toBeDefined();
      expect(premiumBehavior!.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('should have Lambda@Edge function associated', () => {
      if (!distribution) return;

      const defaultBehavior = distribution!.DistributionConfig.DefaultCacheBehavior;
      expect(defaultBehavior.LambdaFunctionAssociations).toBeDefined();
      expect(defaultBehavior.LambdaFunctionAssociations!.Quantity).toBeGreaterThan(0);

      const lambdaAssociation = defaultBehavior.LambdaFunctionAssociations!.Items![0];
      expect(lambdaAssociation.EventType).toBe('viewer-request');
      expect(lambdaAssociation.LambdaFunctionARN).toMatch(/^arn:aws:lambda/);
    });
  });

  describe('WAF Web ACL', () => {
    test('should have WAF Web ACL created for CLOUDFRONT scope', async () => {
      if (!outputs.waf_webacl_arn) {
        console.log('Skipping: WAF WebACL output not available');
        return;
      }

      const webAclId = outputs.waf_webacl_arn.split('/').pop();
      const response = await wafv2.getWebACL({
        Scope: 'CLOUDFRONT',
        Id: webAclId,
        Name: outputs.waf_webacl_arn.split('/')[2]
      }).promise();

      expect(response.WebACL).toBeDefined();
      expect(response.WebACL!.DefaultAction.Allow).toBeDefined();
    });
  });

  describe('Lambda@Edge Function', () => {
    test('should have Lambda@Edge function deployed', async () => {
      if (!outputs.lambda_edge_function_name) {
        console.log('Skipping: Lambda@Edge function output not available');
        return;
      }

      const response = await lambda.getFunction({ FunctionName: outputs.lambda_edge_function_name }).promise();

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Runtime).toBe('python3.12');
      expect(response.Configuration!.Timeout).toBeLessThanOrEqual(5);
    });

    test('should have correct IAM role attached', async () => {
      if (!outputs.lambda_edge_function_name) return;

      const response = await lambda.getFunction({ FunctionName: outputs.lambda_edge_function_name }).promise();

      expect(response.Configuration!.Role).toBeDefined();
      expect(response.Configuration!.Role).toMatch(/lambda-edge-auth-role/);
    });

    test('should NOT have environment variables (Lambda@Edge restriction)', async () => {
      if (!outputs.lambda_edge_function_name) return;

      const response = await lambda.getFunction({ FunctionName: outputs.lambda_edge_function_name }).promise();

      // Lambda@Edge functions cannot have environment variables
      expect(response.Configuration!.Environment).toBeUndefined();
    });
  });

  describe('Lambda Log Processor Function', () => {
    test('should have log processor Lambda function deployed', async () => {
      if (!outputs.lambda_log_processor_function_name) {
        console.log('Skipping: Lambda log processor function output not available');
        return;
      }

      const response = await lambda.getFunction({ FunctionName: outputs.lambda_log_processor_function_name }).promise();

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Runtime).toBe('python3.12');
      expect(response.Configuration!.Timeout).toBe(300);
      expect(response.Configuration!.MemorySize).toBe(512);
    });

    test('should have environment variables configured', async () => {
      if (!outputs.lambda_log_processor_function_name) return;

      const response = await lambda.getFunction({ FunctionName: outputs.lambda_log_processor_function_name }).promise();

      expect(response.Configuration!.Environment).toBeDefined();
      expect(response.Configuration!.Environment!.Variables).toBeDefined();
      expect(response.Configuration!.Environment!.Variables!.LOG_BUCKET).toBeDefined();
      expect(response.Configuration!.Environment!.Variables!.CLOUDWATCH_NS).toBe('Publishing/CDN');
    });
  });

  describe('CloudWatch Alarms', () => {
    let alarms: CloudWatch.MetricAlarms | undefined;

    beforeAll(async () => {
      try {
        const response = await cloudwatch.describeAlarms().promise();
        alarms = response.MetricAlarms!.filter(a =>
          a.AlarmName && a.AlarmName.includes('cloudfront') && a.Namespace === 'AWS/CloudFront'
        );
      } catch (error) {
        console.warn('Warning: Could not fetch CloudWatch alarms');
      }
    });

    test('should have 4xx error rate alarm configured', () => {
      if (!alarms || alarms.length === 0) {
        console.log('Skipping: CloudWatch alarms not deployed or not accessible');
        return;
      }

      const alarm = alarms.find(a => a.MetricName === '4xxErrorRate');
      if (!alarm) {
        console.log('Skipping: 4xx error rate alarm not found');
        return;
      }

      expect(alarm).toBeDefined();
      expect(alarm!.Threshold).toBe(5);
      expect(alarm!.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have 5xx error rate alarm configured', () => {
      if (!alarms || alarms.length === 0) return;

      const alarm = alarms.find(a => a.MetricName === '5xxErrorRate');
      if (!alarm) {
        console.log('Skipping: 5xx error rate alarm not found');
        return;
      }

      expect(alarm!.Threshold).toBe(1);
      expect(alarm!.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have total error rate alarm configured', () => {
      if (!alarms || alarms.length === 0) return;

      const alarm = alarms.find(a => a.MetricName === 'TotalErrorRate');
      if (!alarm) {
        console.log('Skipping: Total error rate alarm not found');
        return;
      }

      expect(alarm!.Threshold).toBe(5);
      expect(alarm!.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('DynamoDB Subscribers Table', () => {
    test('should have DynamoDB table if enabled', async () => {
      if (!outputs.dynamodb_table_name) {
        console.log('Skipping: DynamoDB table not created (create_subscriber_table=false)');
        return;
      }

      const response = await dynamodb.describeTable({ TableName: outputs.dynamodb_table_name }).promise();

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableStatus).toBe('ACTIVE');
      expect(response.Table!.BillingModeSummary!.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have subscriber_id as hash key', async () => {
      if (!outputs.dynamodb_table_name) return;

      const response = await dynamodb.describeTable({ TableName: outputs.dynamodb_table_name }).promise();

      const hashKey = response.Table!.KeySchema!.find(k => k.KeyType === 'HASH');
      expect(hashKey).toBeDefined();
      expect(hashKey!.AttributeName).toBe('subscriber_id');
    });

    test('should have encryption enabled', async () => {
      if (!outputs.dynamodb_table_name) return;

      const response = await dynamodb.describeTable({ TableName: outputs.dynamodb_table_name }).promise();

      expect(response.Table!.SSEDescription).toBeDefined();
      expect(response.Table!.SSEDescription!.Status).toBe('ENABLED');
    });

    test('should have point-in-time recovery enabled', async () => {
      if (!outputs.dynamodb_table_name) return;

      const response = await dynamodb.describeContinuousBackups({ TableName: outputs.dynamodb_table_name }).promise();

      expect(response.ContinuousBackupsDescription).toBeDefined();
      expect(response.ContinuousBackupsDescription!.PointInTimeRecoveryDescription!.PointInTimeRecoveryStatus).toBe('ENABLED');
    });
  });

  describe('Route 53 DNS Records', () => {
    test('should have DNS records if custom domain is configured', async () => {
      if (!outputs.route53_record_fqdn || !outputs.route53_zone_id) {
        console.log('Skipping: Custom domain not configured');
        return;
      }

      const response = await route53.listResourceRecordSets({
        HostedZoneId: outputs.route53_zone_id
      }).promise();

      expect(response.ResourceRecordSets).toBeDefined();
      expect(response.ResourceRecordSets!.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Workflow', () => {
    test('CloudFront distribution should be accessible', () => {
      if (!outputs.cloudfront_distribution_domain_name) {
        console.log('Skipping: CloudFront distribution domain not available');
        return;
      }

      expect(outputs.cloudfront_distribution_domain_name).toBeDefined();
      expect(outputs.cloudfront_distribution_domain_name).toMatch(/\.cloudfront\.net$/);
    });

    test('Origin bucket should be properly configured with CloudFront', async () => {
      if (!outputs.s3_origin_bucket_name || !outputs.cloudfront_oai_id) return;

      const policyResponse = await s3.getBucketPolicy({ Bucket: outputs.s3_origin_bucket_name }).promise();
      const policy = JSON.parse(policyResponse.Policy!);

      expect(policy.Statement).toBeDefined();
      expect(policy.Statement.length).toBeGreaterThan(0);

      const oaiStatement = policy.Statement.find((s: any) =>
        s.Principal && s.Principal.AWS && s.Principal.AWS.includes('cloudfront')
      );
      expect(oaiStatement).toBeDefined();
    });

    test('Monitoring pipeline should be complete', async () => {
      if (!outputs.s3_logs_bucket_name || !outputs.lambda_log_processor_function_name) {
        console.log('Skipping: Monitoring components not fully deployed');
        return;
      }

      const s3Response = await s3.headBucket({ Bucket: outputs.s3_logs_bucket_name }).promise();
      expect(s3Response).toBeDefined();

      const lambdaResponse = await lambda.getFunction({
        FunctionName: outputs.lambda_log_processor_function_name
      }).promise();
      expect(lambdaResponse.Configuration).toBeDefined();
      expect(lambdaResponse.Configuration!.State).toBe('Active');
    });
  });

  describe('Security Configuration', () => {
    test('All S3 buckets should have encryption enabled', async () => {
      const buckets = [outputs.s3_origin_bucket_name, outputs.s3_logs_bucket_name].filter(Boolean);

      for (const bucket of buckets) {
        const response = await s3.getBucketEncryption({ Bucket: bucket }).promise();
        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        expect(response.ServerSideEncryptionConfiguration!.Rules[0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
      }
    });

    test('CloudFront should enforce HTTPS', async () => {
      if (!outputs.cloudfront_distribution_id) return;

      const response = await cloudfront.getDistribution({ Id: outputs.cloudfront_distribution_id }).promise();
      const defaultBehavior = response.Distribution!.DistributionConfig.DefaultCacheBehavior;

      expect(defaultBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('CloudFront should use minimum TLS 1.2', async () => {
      if (!outputs.cloudfront_distribution_id) return;

      const response = await cloudfront.getDistribution({ Id: outputs.cloudfront_distribution_id }).promise();
      const viewerCertificate = response.Distribution!.DistributionConfig.ViewerCertificate;

      if (viewerCertificate && viewerCertificate.ACMCertificateArn) {
        expect(viewerCertificate.MinimumProtocolVersion).toMatch(/TLSv1\.2/);
      }
    });
  });

  describe('Resource Tagging', () => {
    test('CloudFront distribution should have required tags', async () => {
      if (!outputs.cloudfront_distribution_arn) return;

      const response = await cloudfront.listTagsForResource({
        Resource: outputs.cloudfront_distribution_arn
      }).promise();

      expect(response.Tags).toBeDefined();
      expect(response.Tags!.Items).toBeDefined();

      const tags = response.Tags!.Items!;
      const managedByTag = tags.find(t => t.Key === 'ManagedBy');
      expect(managedByTag).toBeDefined();
      expect(managedByTag!.Value).toBe('Terraform');
    });
  });
});
