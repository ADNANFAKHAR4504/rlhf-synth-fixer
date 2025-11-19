import * as fs from 'fs';
import * as path from 'path';

describe('TAP Stack Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);
  });

  describe('Stack Outputs Validation', () => {
    it('should have all required outputs defined', () => {
      expect(outputs).toBeDefined();
      expect(outputs.environment).toBeDefined();
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.dbEndpoint).toBeDefined();
      expect(outputs.lambdaFunctionArn).toBeDefined();
      expect(outputs.apiUrl).toBeDefined();
      expect(outputs.dynamoTableName).toBeDefined();
      expect(outputs.s3BucketName).toBeDefined();
      expect(outputs.dashboardName).toBeDefined();
    });

    it('should have valid environment value', () => {
      expect(['dev', 'staging', 'prod']).toContain(outputs.environment);
    });

    it('should have valid VPC ID format', () => {
      expect(outputs.vpcId).toMatch(/^vpc-[0-9a-f]{8,17}$/);
    });

    it('should have valid RDS endpoint format', () => {
      expect(outputs.dbEndpoint).toMatch(/^[a-z0-9-]+\.[a-z0-9]+\.[a-z0-9-]+\.rds\.amazonaws\.com:\d+$/);
    });

    it('should have valid Lambda ARN format', () => {
      expect(outputs.lambdaFunctionArn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:[a-zA-Z0-9-_]+$/);
    });

    it('should have valid API Gateway URL format', () => {
      expect(outputs.apiUrl).toMatch(/^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/.+$/);
    });

    it('should have valid DynamoDB table name format', () => {
      expect(outputs.dynamoTableName).toMatch(/^[a-zA-Z0-9_.-]+$/);
      expect(outputs.dynamoTableName.length).toBeGreaterThan(0);
      expect(outputs.dynamoTableName.length).toBeLessThanOrEqual(255);
    });

    it('should have valid S3 bucket name format', () => {
      expect(outputs.s3BucketName).toMatch(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/);
    });

    it('should have valid CloudWatch dashboard name', () => {
      expect(outputs.dashboardName).toBeDefined();
      expect(outputs.dashboardName.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should include environment in Lambda function name', () => {
      const functionName = outputs.lambdaFunctionArn.split(':').pop();
      expect(functionName).toContain(outputs.environment);
    });

    it('should include environment in DynamoDB table name', () => {
      expect(outputs.dynamoTableName).toContain(outputs.environment);
    });

    it('should include environment in S3 bucket name', () => {
      expect(outputs.s3BucketName).toContain(outputs.environment);
    });

    it('should include environment in dashboard name', () => {
      expect(outputs.dashboardName).toContain(outputs.environment);
    });
  });

  describe('AWS Service Endpoints', () => {
    it('should have RDS endpoint in correct region', () => {
      expect(outputs.dbEndpoint).toContain('us-east-1');
    });

    it('should have Lambda ARN in correct region', () => {
      expect(outputs.lambdaFunctionArn).toContain('us-east-1');
    });

    it('should have API Gateway URL in correct region', () => {
      expect(outputs.apiUrl).toContain('us-east-1');
    });
  });

  describe('Resource Relationships', () => {
    it('should have consistent environment across all resources', () => {
      const env = outputs.environment;
      const functionName = outputs.lambdaFunctionArn.split(':').pop();

      expect(outputs.dynamoTableName).toContain(env);
      expect(outputs.s3BucketName).toContain(env);
      expect(outputs.dashboardName).toContain(env);
      expect(functionName).toContain(env);
    });
  });
});
