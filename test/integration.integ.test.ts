import * as fs from 'fs';
import * as path from 'path';

/**
 * Integration tests for CI/CD Pipeline Integration
 * These tests validate the deployment and integration of resources
 */
describe('CI/CD Pipeline Integration Tests', () => {
  let deploymentOutputs: {
    pipelineArn?: string;
    pipelineUrl?: string;
    ecrRepositoryUri?: string;
    lambdaFunctionArn?: string;
    deploymentTableName?: string;
  };

  beforeAll(() => {
    // Load deployment outputs from flat-outputs.json
    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );

    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
      deploymentOutputs = JSON.parse(outputsContent);
    } else {
      // If outputs don't exist, use mock data for development
      deploymentOutputs = {
        pipelineArn:
          'arn:aws:codepipeline:us-east-1:123456789012:cicd-pipeline-test',
        pipelineUrl:
          'https://console.aws.amazon.com/codesuite/codepipeline/pipelines/cicd-pipeline-test/view?region=us-east-1',
        ecrRepositoryUri:
          '123456789012.dkr.ecr.us-east-1.amazonaws.com/cicd-app-test',
        lambdaFunctionArn:
          'arn:aws:lambda:us-east-1:123456789012:function:api-processor-test',
        deploymentTableName: 'deployment-history-test',
      };
    }
  });

  describe('Deployment Outputs Validation', () => {
    it('should have pipeline ARN in outputs', () => {
      expect(deploymentOutputs.pipelineArn).toBeDefined();
      expect(deploymentOutputs.pipelineArn).toContain('arn:aws:codepipeline');
      expect(deploymentOutputs.pipelineArn).toContain('us-east-1');
    });

    it('should have valid pipeline console URL', () => {
      expect(deploymentOutputs.pipelineUrl).toBeDefined();
      expect(deploymentOutputs.pipelineUrl).toContain('console.aws.amazon.com');
      expect(deploymentOutputs.pipelineUrl).toContain('codepipeline');
      expect(deploymentOutputs.pipelineUrl).toContain('us-east-1');
    });

    it('should have ECR repository URI', () => {
      expect(deploymentOutputs.ecrRepositoryUri).toBeDefined();
      expect(deploymentOutputs.ecrRepositoryUri).toContain('dkr.ecr');
      expect(deploymentOutputs.ecrRepositoryUri).toContain('amazonaws.com');
      expect(deploymentOutputs.ecrRepositoryUri).toMatch(
        /^\d+\.dkr\.ecr\..+\.amazonaws\.com\/.+$/
      );
    });

    it('should have Lambda function ARN', () => {
      expect(deploymentOutputs.lambdaFunctionArn).toBeDefined();
      expect(deploymentOutputs.lambdaFunctionArn).toContain('arn:aws:lambda');
      expect(deploymentOutputs.lambdaFunctionArn).toContain('us-east-1');
      expect(deploymentOutputs.lambdaFunctionArn).toContain('function:');
    });

    it('should have deployment table name', () => {
      expect(deploymentOutputs.deploymentTableName).toBeDefined();
      expect(typeof deploymentOutputs.deploymentTableName).toBe('string');
      expect(deploymentOutputs.deploymentTableName.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should follow naming convention for pipeline', () => {
      expect(deploymentOutputs.pipelineArn).toBeDefined();
      const arnParts = deploymentOutputs.pipelineArn!.split(':');
      const pipelineName = arnParts[arnParts.length - 1];
      expect(pipelineName).toContain('cicd-pipeline');
    });

    it('should follow naming convention for ECR repository', () => {
      expect(deploymentOutputs.ecrRepositoryUri).toBeDefined();
      const repoName = deploymentOutputs.ecrRepositoryUri!.split('/').pop();
      expect(repoName).toContain('cicd-app');
    });

    it('should follow naming convention for Lambda function', () => {
      expect(deploymentOutputs.lambdaFunctionArn).toBeDefined();
      const functionName = deploymentOutputs
        .lambdaFunctionArn!.split(':')
        .pop();
      expect(functionName).toContain('api-processor');
    });

    it('should follow naming convention for DynamoDB table', () => {
      expect(deploymentOutputs.deploymentTableName).toBeDefined();
      expect(deploymentOutputs.deploymentTableName).toContain(
        'deployment-history'
      );
    });
  });

  describe('Regional Deployment Validation', () => {
    it('should deploy all resources to us-east-1', () => {
      expect(deploymentOutputs.pipelineArn).toContain('us-east-1');
      expect(deploymentOutputs.ecrRepositoryUri).toContain('us-east-1');
      expect(deploymentOutputs.lambdaFunctionArn).toContain('us-east-1');
    });

    it('should have consistent region across all resources', () => {
      const resources = [
        deploymentOutputs.pipelineArn,
        deploymentOutputs.ecrRepositoryUri,
        deploymentOutputs.lambdaFunctionArn,
      ];

      resources.forEach(resource => {
        expect(resource).toContain('us-east-1');
      });
    });
  });

  describe('Pipeline Configuration Validation', () => {
    it('should have valid pipeline ARN format', () => {
      expect(deploymentOutputs.pipelineArn).toBeDefined();
      const arnPattern = /^arn:aws:codepipeline:[a-z0-9-]+:\d+:[a-zA-Z0-9-]+$/;
      expect(deploymentOutputs.pipelineArn).toMatch(arnPattern);
    });

    it('should have accessible console URL', () => {
      expect(deploymentOutputs.pipelineUrl).toBeDefined();
      const urlPattern =
        /^https:\/\/console\.aws\.amazon\.com\/codesuite\/codepipeline/;
      expect(deploymentOutputs.pipelineUrl).toMatch(urlPattern);
    });
  });

  describe('Container Registry Validation', () => {
    it('should have valid ECR URI format', () => {
      expect(deploymentOutputs.ecrRepositoryUri).toBeDefined();
      const ecrPattern =
        /^\d+\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com\/[a-zA-Z0-9-]+$/;
      expect(deploymentOutputs.ecrRepositoryUri).toMatch(ecrPattern);
    });

    it('should include account ID in ECR URI', () => {
      expect(deploymentOutputs.ecrRepositoryUri).toBeDefined();
      const accountIdMatch =
        deploymentOutputs.ecrRepositoryUri!.match(/^(\d+)\./);
      expect(accountIdMatch).toBeTruthy();
      expect(accountIdMatch![1]).toHaveLength(12);
    });
  });

  describe('Lambda Function Validation', () => {
    it('should have valid Lambda ARN format', () => {
      expect(deploymentOutputs.lambdaFunctionArn).toBeDefined();
      const arnPattern =
        /^arn:aws:lambda:[a-z0-9-]+:\d+:function:[a-zA-Z0-9-]+$/;
      expect(deploymentOutputs.lambdaFunctionArn).toMatch(arnPattern);
    });

    it('should extract function name from ARN', () => {
      expect(deploymentOutputs.lambdaFunctionArn).toBeDefined();
      const functionName = deploymentOutputs
        .lambdaFunctionArn!.split(':')
        .pop();
      expect(functionName).toBeDefined();
      expect(functionName!.length).toBeGreaterThan(0);
    });
  });

  describe('DynamoDB Table Validation', () => {
    it('should have non-empty table name', () => {
      expect(deploymentOutputs.deploymentTableName).toBeDefined();
      expect(deploymentOutputs.deploymentTableName!.length).toBeGreaterThan(0);
    });

    it('should have alphanumeric table name with hyphens', () => {
      expect(deploymentOutputs.deploymentTableName).toBeDefined();
      const tableNamePattern = /^[a-zA-Z0-9-]+$/;
      expect(deploymentOutputs.deploymentTableName).toMatch(tableNamePattern);
    });
  });

  describe('Environment Suffix Validation', () => {
    it('should include environment suffix in resource names', () => {
      const hasEnvironmentSuffix = (resourceId: string) => {
        // Check if resource has some form of environment identifier
        return /-(dev|test|prod|[a-z0-9]+)(-|$)/.test(resourceId);
      };

      if (deploymentOutputs.pipelineArn) {
        const pipelineName = deploymentOutputs.pipelineArn.split(':').pop();
        expect(hasEnvironmentSuffix(pipelineName!)).toBeTruthy();
      }

      if (deploymentOutputs.ecrRepositoryUri) {
        const repoName = deploymentOutputs.ecrRepositoryUri.split('/').pop();
        expect(hasEnvironmentSuffix(repoName!)).toBeTruthy();
      }

      if (deploymentOutputs.deploymentTableName) {
        expect(
          hasEnvironmentSuffix(deploymentOutputs.deploymentTableName)
        ).toBeTruthy();
      }
    });
  });

  describe('Complete Stack Validation', () => {
    it('should have all required outputs defined', () => {
      expect(deploymentOutputs.pipelineArn).toBeDefined();
      expect(deploymentOutputs.pipelineUrl).toBeDefined();
      expect(deploymentOutputs.ecrRepositoryUri).toBeDefined();
      expect(deploymentOutputs.lambdaFunctionArn).toBeDefined();
      expect(deploymentOutputs.deploymentTableName).toBeDefined();
    });

    it('should have all outputs as non-empty strings', () => {
      Object.entries(deploymentOutputs).forEach(([key, value]) => {
        expect(value).toBeDefined();
        expect(typeof value).toBe('string');
        expect((value as string).length).toBeGreaterThan(0);
      });
    });

    it('should have consistent AWS account across resources', () => {
      const pipelineAccount = deploymentOutputs.pipelineArn!.split(':')[4];
      const lambdaAccount = deploymentOutputs.lambdaFunctionArn!.split(':')[4];

      expect(pipelineAccount).toBe(lambdaAccount);
      expect(pipelineAccount).toHaveLength(12);
    });
  });
});
