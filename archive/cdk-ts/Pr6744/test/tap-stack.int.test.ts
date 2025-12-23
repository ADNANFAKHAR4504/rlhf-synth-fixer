// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketTaggingCommand,
} from '@aws-sdk/client-s3';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = outputs.AnalyzerRegion || 'us-east-1';
const stackName = `TapStack${environmentSuffix}`;

// Initialize AWS SDK clients
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const iamClient = new IAMClient({ region });
const cfClient = new CloudFormationClient({ region });

describe('Compliance Analyzer Stack Integration Tests', () => {
  // Test that outputs are present
  describe('Stack Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.AnalyzerRegion).toBeDefined();
      expect(outputs.AnalyzerMode).toBe('ReadOnly');
      expect(outputs.AnalyzerVersion).toBe('1.0.0');
      expect(outputs.ReportsBucketName).toBeDefined();
      expect(outputs.AnalyzerFunctionArn).toBeDefined();
      expect(outputs.AnalyzerFunctionName).toBeDefined();
    });

    test('should have correct analyzer configuration outputs', () => {
      expect(outputs.AnalyzerRegion).toBe(region);
      expect(outputs.AnalyzerAccount).toBeDefined();
      expect(outputs.AnalyzerEnvironment).toBe(environmentSuffix);

      // Parse JSON outputs
      const securityChecks = JSON.parse(outputs.SecurityChecks);
      const operationalChecks = JSON.parse(outputs.OperationalChecks);
      const analyzedServices = JSON.parse(outputs.AnalyzedServices);

      expect(Array.isArray(securityChecks)).toBe(true);
      expect(Array.isArray(operationalChecks)).toBe(true);
      expect(Array.isArray(analyzedServices)).toBe(true);
      expect(analyzedServices).toContain('EC2');
      expect(analyzedServices).toContain('S3');
      expect(analyzedServices).toContain('IAM');
      expect(analyzedServices).toContain('Lambda');
      expect(analyzedServices).toContain('RDS');
    });

    test('should have correct compliance scoring configuration', () => {
      const complianceScoring = JSON.parse(outputs.ComplianceScoring);
      expect(complianceScoring.framework).toBe('CIS AWS Foundations Benchmark');
      expect(complianceScoring.scoring.Critical).toBe(-25);
      expect(complianceScoring.scoring.High).toBe(-15);
      expect(complianceScoring.scoring.Medium).toBe(-10);
      expect(complianceScoring.scoring.Low).toBe(-5);
      expect(complianceScoring.scale).toBe('0-100');
    });
  });

  // Test S3 Bucket
  describe('S3 Bucket Validation', () => {
    const bucketName = outputs.ReportsBucketName;

    test('should have bucket name in outputs', () => {
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
      expect(bucketName.length).toBeGreaterThan(0);
    });

    test('should have bucket encryption enabled', async () => {
      try {
        const response = await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: bucketName })
        );
        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        expect(
          response.ServerSideEncryptionConfiguration?.Rules?.[0]
            ?.ApplyServerSideEncryptionByDefault
        ).toBeDefined();
      } catch (error: any) {
        // If bucket doesn't exist or encryption check fails, fail the test
        throw new Error(`Failed to verify bucket encryption: ${error.message}`);
      }
    }, 30000);

    test('should have bucket versioning enabled', async () => {
      try {
        const response = await s3Client.send(
          new GetBucketVersioningCommand({ Bucket: bucketName })
        );
        expect(response.Status).toBe('Enabled');
      } catch (error: any) {
        throw new Error(`Failed to verify bucket versioning: ${error.message}`);
      }
    }, 30000);

    test('should have correct tags on bucket', async () => {
      try {
        const response = await s3Client.send(
          new GetBucketTaggingCommand({ Bucket: bucketName })
        );
        const tags = response.TagSet || [];
        const tagMap = Object.fromEntries(
          tags.map(tag => [tag.Key!, tag.Value!])
        );

        expect(tagMap.Project).toBe('ComplianceAnalyzer');
        expect(tagMap.ManagedBy).toBe('CDK');
        expect(tagMap.Mode).toBe('ReadOnly');
        expect(tagMap.Environment).toBe(environmentSuffix);
      } catch (error: any) {
        throw new Error(`Failed to verify bucket tags: ${error.message}`);
      }
    }, 30000);
  });

  // Test Lambda Function
  describe('Lambda Function Validation', () => {
    const functionName = outputs.AnalyzerFunctionName;
    const functionArn = outputs.AnalyzerFunctionArn;

    test('should have function name and ARN in outputs', () => {
      expect(functionName).toBeDefined();
      expect(functionArn).toBeDefined();
      expect(functionArn).toContain('lambda');
      expect(functionArn).toContain(region);
      expect(functionArn).toContain(functionName);
    });

    test('should have Lambda function deployed', async () => {
      try {
        const response = await lambdaClient.send(
          new GetFunctionCommand({ FunctionName: functionName })
        );
        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.FunctionName).toBe(functionName);
        expect(response.Configuration?.Runtime).toBe('nodejs20.x');
        expect(response.Configuration?.Timeout).toBe(300); // 5 minutes
        expect(response.Configuration?.MemorySize).toBe(512);
      } catch (error: any) {
        throw new Error(`Failed to verify Lambda function: ${error.message}`);
      }
    }, 30000);

    test('should have correct environment variables', async () => {
      try {
        const response = await lambdaClient.send(
          new GetFunctionConfigurationCommand({ FunctionName: functionName })
        );
        expect(response.Environment).toBeDefined();
        expect(response.Environment?.Variables).toBeDefined();
        expect(response.Environment?.Variables?.REPORTS_BUCKET).toBe(
          outputs.ReportsBucketName
        );
        expect(response.Environment?.Variables?.REGION).toBe(region);
      } catch (error: any) {
        throw new Error(
          `Failed to verify Lambda environment variables: ${error.message}`
        );
      }
    }, 30000);

    test('should have correct IAM role attached', async () => {
      try {
        const response = await lambdaClient.send(
          new GetFunctionConfigurationCommand({ FunctionName: functionName })
        );
        expect(response.Role).toBeDefined();
        expect(response.Role).toContain('AnalyzerLambdaRole');
      } catch (error: any) {
        throw new Error(`Failed to verify Lambda IAM role: ${error.message}`);
      }
    }, 30000);
  });

  // Test IAM Role
  describe('IAM Role Validation', () => {
    test('should have IAM role with correct permissions', async () => {
      // Extract role name from Lambda function configuration
      const functionName = outputs.AnalyzerFunctionName;
      const lambdaResponse = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );
      const roleArn = lambdaResponse.Role!;
      const roleName = roleArn.split('/').pop()!;

      try {
        const roleResponse = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName })
        );
        expect(roleResponse.Role).toBeDefined();
        expect(roleResponse.Role?.RoleName).toBe(roleName);
        expect(roleResponse.Role?.AssumeRolePolicyDocument).toBeDefined();

        // Check attached policies
        const attachedPolicies = await iamClient.send(
          new ListAttachedRolePoliciesCommand({ RoleName: roleName })
        );
        expect(attachedPolicies.AttachedPolicies).toBeDefined();
        // Should have AWSLambdaBasicExecutionRole
        const hasBasicExecution = attachedPolicies.AttachedPolicies?.some(p =>
          p.PolicyArn?.includes('AWSLambdaBasicExecutionRole')
        );
        expect(hasBasicExecution).toBe(true);
      } catch (error: any) {
        throw new Error(`Failed to verify IAM role: ${error.message}`);
      }
    }, 30000);
  });

  // Test CloudFormation Stack
  describe('CloudFormation Stack Validation', () => {
    test('should have stack deployed successfully', async () => {
      try {
        const response = await cfClient.send(
          new DescribeStacksCommand({ StackName: stackName })
        );
        expect(response.Stacks).toBeDefined();
        expect(response.Stacks?.length).toBeGreaterThan(0);
        const stack = response.Stacks![0];
        expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(
          stack.StackStatus
        );
      } catch (error: any) {
        throw new Error(
          `Failed to verify CloudFormation stack: ${error.message}`
        );
      }
    }, 30000);

    test('should have all expected resources in stack', async () => {
      try {
        const response = await cfClient.send(
          new DescribeStacksCommand({ StackName: stackName })
        );
        const stack = response.Stacks![0];
        const tags = stack.Tags || [];
        const tagMap = Object.fromEntries(
          tags.map(tag => [tag.Key!, tag.Value!])
        );

        expect(tagMap.Project).toBe('ComplianceAnalyzer');
        expect(tagMap.ManagedBy).toBe('CDK');
        expect(tagMap.Mode).toBe('ReadOnly');
        expect(tagMap.Environment).toBe(environmentSuffix);
      } catch (error: any) {
        throw new Error(`Failed to verify stack tags: ${error.message}`);
      }
    }, 30000);
  });

  // Test Resource Integration
  describe('Resource Integration Tests', () => {
    test('should have Lambda function with access to S3 bucket', async () => {
      const functionName = outputs.AnalyzerFunctionName;
      const bucketName = outputs.ReportsBucketName;

      // Verify Lambda has environment variable pointing to bucket
      const lambdaResponse = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );
      expect(lambdaResponse.Environment?.Variables?.REPORTS_BUCKET).toBe(
        bucketName
      );

      // Verify bucket exists
      try {
        await s3Client.send(
          new GetBucketVersioningCommand({ Bucket: bucketName })
        );
      } catch (error: any) {
        throw new Error(`S3 bucket does not exist: ${error.message}`);
      }
    }, 30000);

    test('should have all outputs match actual deployed resources', async () => {
      // Verify Lambda function name matches output
      const functionName = outputs.AnalyzerFunctionName;
      const lambdaResponse = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );
      expect(lambdaResponse.Configuration?.FunctionName).toBe(functionName);

      // Verify bucket name matches output
      const bucketName = outputs.ReportsBucketName;
      try {
        await s3Client.send(
          new GetBucketVersioningCommand({ Bucket: bucketName })
        );
      } catch (error: any) {
        throw new Error(
          `Bucket ${bucketName} does not exist: ${error.message}`
        );
      }
    }, 30000);
  });
});
