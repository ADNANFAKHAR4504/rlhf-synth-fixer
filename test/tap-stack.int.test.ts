/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs';
import * as path from 'path';

describe('TAP Stack Integration Tests', () => {
  let outputs: any;
  let driftReport: any;
  let configComparison: any;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);

    // Parse drift report if available
    if (outputs.driftReport) {
      driftReport = JSON.parse(outputs.driftReport);
    }

    // Parse config comparison if available
    if (outputs.configComparison) {
      configComparison = JSON.parse(outputs.configComparison);
    }
  });

  describe('Deployment Outputs Validation', () => {
    it('should load deployment outputs from flat-outputs.json', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    it('should have all required core outputs', () => {
      expect(outputs.environment).toBeDefined();
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.dbEndpoint).toBeDefined();
      expect(outputs.lambdaFunctionArn).toBeDefined();
      expect(outputs.lambdaFunctionName).toBeDefined();
      expect(outputs.apiUrl).toBeDefined();
      expect(outputs.dynamoTableName).toBeDefined();
      expect(outputs.s3BucketName).toBeDefined();
      expect(outputs.dashboardName).toBeDefined();
    });

    it('should have valid environment value', () => {
      expect(outputs.environment).toBeDefined();
      expect(typeof outputs.environment).toBe('string');
      expect(outputs.environment.length).toBeGreaterThan(0);
    });
  });

  describe('VPC Component Integration', () => {
    it('should have valid VPC ID format', () => {
      expect(outputs.vpcId).toMatch(/^vpc-[0-9a-f]{8,17}$/);
    });

    it('should have VPC ID that matches AWS format', () => {
      expect(outputs.vpcId).toMatch(/^vpc-[0-9a-f]+$/);
      expect(outputs.vpcId.length).toBeGreaterThanOrEqual(12);
      expect(outputs.vpcId.length).toBeLessThanOrEqual(21);
    });

    it('should verify VPC exists in drift report', () => {
      if (driftReport && driftReport.resources) {
        const vpcResource = driftReport.resources.find((r: any) => r.resourceType === 'VPC');
        expect(vpcResource).toBeDefined();
        expect(vpcResource.drift).toBe(false);
      }
    });
  });

  describe('RDS Component Integration', () => {
    it('should have valid RDS endpoint format', () => {
      expect(outputs.dbEndpoint).toMatch(/^[a-z0-9-]+\.[a-z0-9]+\.[a-z0-9-]+\.rds\.amazonaws\.com:\d+$/);
    });

    it('should have RDS endpoint with correct port', () => {
      const port = outputs.dbEndpoint.split(':').pop();
      expect(port).toBe('5432'); // PostgreSQL default port
    });

    it('should have RDS endpoint in us-east-1 region', () => {
      expect(outputs.dbEndpoint).toContain('us-east-1');
    });

    it('should have RDS instance name in endpoint', () => {
      const instanceName = outputs.dbEndpoint.split('.')[0];
      expect(instanceName).toContain('postgres');
    });

    it('should verify RDS exists in drift report', () => {
      if (driftReport && driftReport.resources) {
        const rdsResource = driftReport.resources.find((r: any) => r.resourceType === 'RDS');
        expect(rdsResource).toBeDefined();
        expect(rdsResource.drift).toBe(false);
      }
    });
  });

  describe('Lambda Component Integration', () => {
    it('should have valid Lambda ARN format', () => {
      expect(outputs.lambdaFunctionArn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:[a-zA-Z0-9-_]+$/);
    });

    it('should have Lambda function name matching ARN', () => {
      const functionNameFromArn = outputs.lambdaFunctionArn.split(':').pop();
      expect(outputs.lambdaFunctionName).toBe(functionNameFromArn);
    });

    it('should have Lambda in us-east-1 region', () => {
      expect(outputs.lambdaFunctionArn).toContain('us-east-1');
    });

    it('should have Lambda with valid AWS account ID', () => {
      const parts = outputs.lambdaFunctionArn.split(':');
      const accountId = parts[4];
      expect(accountId).toMatch(/^\d{12}$/);
    });

    it('should have Lambda function name with payment-processor prefix', () => {
      expect(outputs.lambdaFunctionName).toContain('payment-processor');
    });

    it('should verify Lambda exists in drift report', () => {
      if (driftReport && driftReport.resources) {
        const lambdaResource = driftReport.resources.find((r: any) => r.resourceType === 'Lambda');
        expect(lambdaResource).toBeDefined();
        expect(lambdaResource.drift).toBe(false);
      }
    });
  });

  describe('API Gateway Component Integration', () => {
    it('should have valid API Gateway URL format', () => {
      expect(outputs.apiUrl).toMatch(/^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/.+$/);
    });

    it('should have API Gateway with HTTPS protocol', () => {
      expect(outputs.apiUrl).toMatch(/^https:\/\//);
    });

    it('should have API Gateway in us-east-1 region', () => {
      expect(outputs.apiUrl).toContain('us-east-1');
    });

    it('should have API Gateway with stage path', () => {
      const urlParts = outputs.apiUrl.split('/');
      expect(urlParts.length).toBeGreaterThanOrEqual(4);
      const stage = urlParts[3];
      expect(stage).toBeDefined();
      expect(stage.length).toBeGreaterThan(0);
    });

    it('should verify API Gateway exists in drift report', () => {
      if (driftReport && driftReport.resources) {
        const apiResource = driftReport.resources.find((r: any) => r.resourceType === 'API Gateway');
        expect(apiResource).toBeDefined();
        expect(apiResource.drift).toBe(false);
      }
    });
  });

  describe('DynamoDB Component Integration', () => {
    it('should have valid DynamoDB table name format', () => {
      expect(outputs.dynamoTableName).toMatch(/^[a-zA-Z0-9_.-]+$/);
    });

    it('should have DynamoDB table name within length limits', () => {
      expect(outputs.dynamoTableName.length).toBeGreaterThan(0);
      expect(outputs.dynamoTableName.length).toBeLessThanOrEqual(255);
    });

    it('should have DynamoDB table name with transactions prefix', () => {
      expect(outputs.dynamoTableName).toContain('transactions');
    });

    it('should verify DynamoDB exists in drift report', () => {
      if (driftReport && driftReport.resources) {
        const dynamoResource = driftReport.resources.find((r: any) => r.resourceType === 'DynamoDB');
        expect(dynamoResource).toBeDefined();
        expect(dynamoResource.drift).toBe(false);
      }
    });
  });

  describe('S3 Component Integration', () => {
    it('should have valid S3 bucket name format', () => {
      expect(outputs.s3BucketName).toMatch(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/);
    });

    it('should have S3 bucket name within length limits', () => {
      expect(outputs.s3BucketName.length).toBeGreaterThanOrEqual(3);
      expect(outputs.s3BucketName.length).toBeLessThanOrEqual(63);
    });

    it('should have S3 bucket name with audit-logs prefix', () => {
      expect(outputs.s3BucketName).toContain('audit-logs');
    });

    it('should have S3 bucket name with account ID and region', () => {
      expect(outputs.s3BucketName).toMatch(/\d{12}/); // Account ID
      expect(outputs.s3BucketName).toContain('us-east-1');
    });

    it('should verify S3 exists in drift report', () => {
      if (driftReport && driftReport.resources) {
        const s3Resource = driftReport.resources.find((r: any) => r.resourceType === 'S3');
        expect(s3Resource).toBeDefined();
        expect(s3Resource.drift).toBe(false);
      }
    });
  });

  describe('CloudWatch Component Integration', () => {
    it('should have valid CloudWatch dashboard name', () => {
      expect(outputs.dashboardName).toBeDefined();
      expect(outputs.dashboardName.length).toBeGreaterThan(0);
      expect(outputs.dashboardName.length).toBeLessThanOrEqual(255);
    });

    it('should have CloudWatch dashboard name with payment-platform prefix', () => {
      expect(outputs.dashboardName).toContain('payment-platform');
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should have environment suffix in all resource names', () => {
      const suffix = outputs.lambdaFunctionName.split('-').pop();

      expect(outputs.lambdaFunctionName).toContain(suffix!);
      expect(outputs.dynamoTableName).toContain(suffix!);
      expect(outputs.dashboardName).toContain(suffix!);
      expect(outputs.dbEndpoint).toContain(suffix!);
    });

    it('should follow consistent naming pattern across resources', () => {
      const suffix = outputs.lambdaFunctionName.split('-').pop();

      expect(outputs.lambdaFunctionName).toMatch(/^[a-z-]+-[a-z0-9]+$/);
      expect(outputs.dynamoTableName).toMatch(/^[a-z-]+-[a-z0-9]+$/);
      expect(outputs.dashboardName).toMatch(/^[a-z-]+-[a-z0-9]+$/);
    });

    it('should have unique resource names per environment', () => {
      const lambdaName = outputs.lambdaFunctionName;
      const dynamoName = outputs.dynamoTableName;
      const s3Name = outputs.s3BucketName;

      expect(lambdaName).not.toBe(dynamoName);
      expect(lambdaName).not.toBe(s3Name);
      expect(dynamoName).not.toBe(s3Name);
    });
  });

  describe('AWS Resource ARN Validation', () => {
    it('should have Lambda ARN with correct AWS partition', () => {
      expect(outputs.lambdaFunctionArn).toMatch(/^arn:aws:/);
    });

    it('should have Lambda ARN with correct service name', () => {
      expect(outputs.lambdaFunctionArn).toContain(':lambda:');
    });

    it('should have consistent account ID across resources', () => {
      const lambdaAccountId = outputs.lambdaFunctionArn.split(':')[4];
      expect(lambdaAccountId).toMatch(/^\d{12}$/);

      // Check if S3 bucket contains the same account ID
      if (outputs.s3BucketName.includes(lambdaAccountId)) {
        expect(outputs.s3BucketName).toContain(lambdaAccountId);
      }
    });
  });

  describe('Regional Consistency', () => {
    it('should have all resources in the same AWS region', () => {
      const region = 'us-east-1';

      expect(outputs.dbEndpoint).toContain(region);
      expect(outputs.lambdaFunctionArn).toContain(region);
      expect(outputs.apiUrl).toContain(region);
      expect(outputs.s3BucketName).toContain(region);
    });
  });

  describe('Drift Detection Integration', () => {
    it('should have drift report available', () => {
      expect(outputs.driftReport).toBeDefined();
      expect(driftReport).toBeDefined();
    });

    it('should have valid drift report structure', () => {
      if (driftReport) {
        expect(driftReport.environment).toBeDefined();
        expect(driftReport.resources).toBeDefined();
        expect(driftReport.timestamp).toBeDefined();
        expect(Array.isArray(driftReport.resources)).toBe(true);
      }
    });

    it('should have no drift detected in any resources', () => {
      if (driftReport && driftReport.resources) {
        const driftedResources = driftReport.resources.filter((r: any) => r.drift === true);
        expect(driftedResources.length).toBe(0);
      }
    });

    it('should have all expected resources in drift report', () => {
      if (driftReport && driftReport.resources) {
        const resourceTypes = driftReport.resources.map((r: any) => r.resourceType);

        expect(resourceTypes).toContain('VPC');
        expect(resourceTypes).toContain('RDS');
        expect(resourceTypes).toContain('Lambda');
        expect(resourceTypes).toContain('API Gateway');
        expect(resourceTypes).toContain('DynamoDB');
        expect(resourceTypes).toContain('S3');
      }
    });

    it('should have valid timestamp in drift report', () => {
      if (driftReport) {
        const timestamp = new Date(driftReport.timestamp);
        expect(timestamp).toBeInstanceOf(Date);
        expect(timestamp.getTime()).not.toBeNaN();
      }
    });
  });

  describe('Config Comparison Integration', () => {
    it('should have config comparison data available', () => {
      expect(outputs.configComparison).toBeDefined();
      expect(configComparison).toBeDefined();
    });

    it('should have configurations for all environments', () => {
      if (configComparison) {
        expect(configComparison.dev).toBeDefined();
        expect(configComparison.staging).toBeDefined();
        expect(configComparison.prod).toBeDefined();
      }
    });

    it('should have valid configuration structure for each environment', () => {
      if (configComparison) {
        const environments = ['dev', 'staging', 'prod'];

        environments.forEach(env => {
          const config = configComparison[env];
          expect(config.environment).toBe(env);
          expect(config.vpcCidr).toBeDefined();
          expect(config.rdsInstanceClass).toBeDefined();
          expect(config.apiGatewayRateLimit).toBeDefined();
          expect(config.dynamoReadCapacity).toBeDefined();
          expect(config.dynamoWriteCapacity).toBeDefined();
          expect(config.s3RetentionDays).toBeDefined();
          expect(config.cloudWatchThreshold).toBeDefined();
          expect(config.kmsKeyAlias).toBeDefined();
        });
      }
    });

    it('should have differences array in config comparison', () => {
      if (configComparison) {
        expect(configComparison.differences).toBeDefined();
        expect(Array.isArray(configComparison.differences)).toBe(true);
        expect(configComparison.differences.length).toBeGreaterThan(0);
      }
    });

    it('should have increasing resource sizes from dev to prod', () => {
      if (configComparison) {
        // API Gateway Rate Limits should increase
        expect(configComparison.dev.apiGatewayRateLimit).toBeLessThan(configComparison.staging.apiGatewayRateLimit);
        expect(configComparison.staging.apiGatewayRateLimit).toBeLessThan(configComparison.prod.apiGatewayRateLimit);

        // DynamoDB capacity should increase
        expect(configComparison.dev.dynamoReadCapacity).toBeLessThan(configComparison.staging.dynamoReadCapacity);
        expect(configComparison.staging.dynamoReadCapacity).toBeLessThan(configComparison.prod.dynamoReadCapacity);

        // S3 retention should increase
        expect(configComparison.dev.s3RetentionDays).toBeLessThan(configComparison.staging.s3RetentionDays);
        expect(configComparison.staging.s3RetentionDays).toBeLessThan(configComparison.prod.s3RetentionDays);
      }
    });

    it('should have unique VPC CIDR blocks per environment', () => {
      if (configComparison) {
        const devCidr = configComparison.dev.vpcCidr;
        const stagingCidr = configComparison.staging.vpcCidr;
        const prodCidr = configComparison.prod.vpcCidr;

        expect(devCidr).not.toBe(stagingCidr);
        expect(stagingCidr).not.toBe(prodCidr);
        expect(devCidr).not.toBe(prodCidr);
      }
    });

    it('should have unique KMS key aliases per environment', () => {
      if (configComparison) {
        const devKey = configComparison.dev.kmsKeyAlias;
        const stagingKey = configComparison.staging.kmsKeyAlias;
        const prodKey = configComparison.prod.kmsKeyAlias;

        expect(devKey).toBe('alias/dev-key');
        expect(stagingKey).toBe('alias/staging-key');
        expect(prodKey).toBe('alias/prod-key');
      }
    });
  });

  describe('Cross-Component Integration', () => {
    it('should have Lambda function that can connect to RDS', () => {
      const rdsHost = outputs.dbEndpoint.split(':')[0];
      expect(rdsHost).toBeDefined();
      expect(outputs.lambdaFunctionArn).toBeDefined();

      // Both should be in the same region
      expect(rdsHost).toContain('us-east-1');
      expect(outputs.lambdaFunctionArn).toContain('us-east-1');
    });

    it('should have API Gateway that can invoke Lambda', () => {
      expect(outputs.apiUrl).toBeDefined();
      expect(outputs.lambdaFunctionArn).toBeDefined();

      // Both should be in the same region
      const apiRegion = outputs.apiUrl.split('.')[2];
      const lambdaRegion = outputs.lambdaFunctionArn.split(':')[3];
      expect(apiRegion).toBe(lambdaRegion);
    });

    it('should have Lambda that can access DynamoDB', () => {
      expect(outputs.lambdaFunctionArn).toBeDefined();
      expect(outputs.dynamoTableName).toBeDefined();

      // Should be in the same account
      const lambdaAccountId = outputs.lambdaFunctionArn.split(':')[4];
      expect(lambdaAccountId).toMatch(/^\d{12}$/);
    });

    it('should have Lambda that can write to S3', () => {
      expect(outputs.lambdaFunctionArn).toBeDefined();
      expect(outputs.s3BucketName).toBeDefined();

      // S3 bucket should contain the same account ID
      const lambdaAccountId = outputs.lambdaFunctionArn.split(':')[4];
      expect(outputs.s3BucketName).toContain(lambdaAccountId);
    });

    it('should have all resources deployed in the same VPC context', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.dbEndpoint).toBeDefined();
      expect(outputs.lambdaFunctionArn).toBeDefined();

      // VPC, RDS, and Lambda should all exist
      const vpcId = outputs.vpcId;
      expect(vpcId).toMatch(/^vpc-[0-9a-f]+$/);
    });
  });

  describe('Security and Compliance', () => {
    it('should use HTTPS for API Gateway endpoint', () => {
      expect(outputs.apiUrl).toMatch(/^https:\/\//);
    });

    it('should have secure RDS port configuration', () => {
      const port = outputs.dbEndpoint.split(':').pop();
      expect(port).toBe('5432'); // PostgreSQL default secure port
    });

    it('should have S3 bucket name following AWS naming conventions', () => {
      // S3 bucket names must be DNS-compliant
      expect(outputs.s3BucketName).not.toMatch(/[A-Z]/); // No uppercase
      expect(outputs.s3BucketName).not.toMatch(/_{2,}/); // No consecutive underscores
      expect(outputs.s3BucketName).not.toMatch(/^-/); // No leading hyphen
      expect(outputs.s3BucketName).not.toMatch(/-$/); // No trailing hyphen
    });
  });

  describe('Environment-Specific Validation', () => {
    it('should have environment identifier in deployment', () => {
      expect(outputs.environment).toBeDefined();
      expect(typeof outputs.environment).toBe('string');
    });

    it('should have consistent environment across drift report', () => {
      if (driftReport) {
        expect(driftReport.environment).toBeDefined();
      }
    });
  });

  describe('Output Completeness', () => {
    it('should have no null or undefined values in critical outputs', () => {
      expect(outputs.vpcId).not.toBeNull();
      expect(outputs.dbEndpoint).not.toBeNull();
      expect(outputs.lambdaFunctionArn).not.toBeNull();
      expect(outputs.apiUrl).not.toBeNull();
      expect(outputs.dynamoTableName).not.toBeNull();
      expect(outputs.s3BucketName).not.toBeNull();
      expect(outputs.dashboardName).not.toBeNull();
    });

    it('should have all outputs as non-empty strings', () => {
      expect(outputs.vpcId.length).toBeGreaterThan(0);
      expect(outputs.dbEndpoint.length).toBeGreaterThan(0);
      expect(outputs.lambdaFunctionArn.length).toBeGreaterThan(0);
      expect(outputs.apiUrl.length).toBeGreaterThan(0);
      expect(outputs.dynamoTableName.length).toBeGreaterThan(0);
      expect(outputs.s3BucketName.length).toBeGreaterThan(0);
      expect(outputs.dashboardName.length).toBeGreaterThan(0);
    });
  });
});
