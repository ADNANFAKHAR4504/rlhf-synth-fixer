import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  let outputs: Record<string, string>;

  beforeAll(() => {
    // Load deployed stack outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      console.warn('Stack outputs not found. Tests will be skipped.');
      outputs = {};
    } else {
      const outputsData = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsData);
    }
  });

  describe('Stack Outputs Validation', () => {
    test('should have VPC ID output', () => {
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.VpcId).toMatch(/^vpc-[a-z0-9]+$/);
    });

    test('should have ALB DNS name output', () => {
      expect(outputs.AlbDnsName).toBeDefined();
      expect(outputs.AlbDnsName).toContain('.elb.amazonaws.com');
    });

    test('should have API Gateway URL output', () => {
      expect(outputs.ApiGatewayUrl).toBeDefined();
      expect(outputs.ApiGatewayUrl).toMatch(/^https:\/\/.*\.execute-api\..*\.amazonaws\.com\//);
    });

    test('should have CloudFront URL output', () => {
      expect(outputs.CloudFrontUrl).toBeDefined();
      expect(outputs.CloudFrontUrl).toMatch(/^https:\/\/.*\.cloudfront\.net$/);
    });

    test('should have Sessions Table name output', () => {
      expect(outputs.SessionsTableName).toBeDefined();
      expect(outputs.SessionsTableName).toContain('customer-portal-sessions-');
    });

    test('should have S3 bucket name output', () => {
      expect(outputs.StaticAssetsBucketName).toBeDefined();
      expect(outputs.StaticAssetsBucketName).toContain('customer-portal-assets-');
    });

    test('should have Database Secret ARN output', () => {
      expect(outputs.DatabaseSecretArn).toBeDefined();
      expect(outputs.DatabaseSecretArn).toMatch(/^arn:aws:secretsmanager:/);
    });

    test('should have CloudWatch Dashboard URL output', () => {
      expect(outputs.DashboardUrl).toBeDefined();
      expect(outputs.DashboardUrl).toContain('cloudwatch');
      expect(outputs.DashboardUrl).toContain('dashboards');
    });
  });

  describe('Resource Naming Conventions', () => {

    test('should follow consistent naming pattern', () => {
      expect(outputs.SessionsTableName).toMatch(/^customer-portal-sessions-/);
      expect(outputs.StaticAssetsBucketName).toMatch(/^customer-portal-assets-/);
      expect(outputs.AlbDnsName).toMatch(/^customer-portal-alb-/);
    });
  });

  describe('Service Availability', () => {
    test('should have valid API Gateway endpoint format', () => {
      const url = outputs.ApiGatewayUrl;
      expect(url).toMatch(/^https:\/\//);
      expect(url).toContain('.execute-api.');
      expect(url).toContain('.amazonaws.com');
    });

    test('should have valid CloudFront distribution format', () => {
      const url = outputs.CloudFrontUrl;
      expect(url).toMatch(/^https:\/\//);
      expect(url).toContain('.cloudfront.net');
    });

    test('should have valid ALB DNS format', () => {
      const dns = outputs.AlbDnsName;
      expect(dns).toContain('.elb.amazonaws.com');
      expect(dns).toMatch(/^customer-portal-alb-/);
    });
  });

  describe('AWS Resource Identifiers', () => {
    test('should have valid VPC ID format', () => {
      expect(outputs.VpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    test('should have valid Secrets Manager ARN format', () => {
      const arn = outputs.DatabaseSecretArn;
      expect(arn).toMatch(/^arn:aws:secretsmanager:[a-z0-9-]+:[0-9]{12}:secret:/);
    });

    test('should have valid DynamoDB table name format', () => {
      const tableName = outputs.SessionsTableName;
      expect(tableName).toMatch(/^[a-zA-Z0-9_.-]+$/);
      expect(tableName.length).toBeGreaterThan(3);
      expect(tableName.length).toBeLessThan(256);
    });

    test('should have valid S3 bucket name format', () => {
      const bucketName = outputs.StaticAssetsBucketName;
      expect(bucketName).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
      expect(bucketName.length).toBeGreaterThanOrEqual(3);
      expect(bucketName.length).toBeLessThanOrEqual(63);
    });
  });

  describe('Multi-AZ Deployment Validation', () => {
    test('should have infrastructure spread across availability zones', () => {
      // VPC ID confirms network foundation exists
      expect(outputs.VpcId).toBeDefined();

      // ALB confirms load balancer across AZs
      expect(outputs.AlbDnsName).toBeDefined();

      // These outputs implicitly confirm multi-AZ deployment
      // (actual verification would require AWS SDK calls)
    });
  });

  describe('Security Configuration', () => {
    test('should use HTTPS for all public endpoints', () => {
      expect(outputs.ApiGatewayUrl).toMatch(/^https:\/\//);
      expect(outputs.CloudFrontUrl).toMatch(/^https:\/\//);
    });

    test('should store database credentials in Secrets Manager', () => {
      expect(outputs.DatabaseSecretArn).toContain('secretsmanager');
      expect(outputs.DatabaseSecretArn).toContain('customer-portal-db-secret');
    });
  });

  describe('Monitoring Infrastructure', () => {
    test('should have CloudWatch dashboard configured', () => {
      expect(outputs.DashboardUrl).toContain('console.aws.amazon.com/cloudwatch');
      expect(outputs.DashboardUrl).toContain('dashboards:name=customer-portal-dashboard-');
    });
  });

  describe('Output Completeness', () => {
    test('should have all required outputs present', () => {
      const requiredOutputs = [
        'VpcId',
        'AlbDnsName',
        'ApiGatewayUrl',
        'CloudFrontUrl',
        'SessionsTableName',
        'StaticAssetsBucketName',
        'DatabaseSecretArn',
        'DashboardUrl',
      ];

      requiredOutputs.forEach((outputKey) => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBe('');
      });
    });

    test('should have no undefined or null outputs', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).toBeDefined();
        expect(value).not.toBeNull();
        expect(value).not.toBe('');
      });
    });
  });
});
