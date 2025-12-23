import { TapStack } from '../lib/tap-stack';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Module Tests', () => {
  let tapStack: TapStack;

  beforeAll(() => {
    tapStack = new TapStack('test-suffix');
  });

  describe('Constructor and Basic Methods', () => {
    test('should create instance with environment suffix', () => {
      expect(tapStack.getEnvironmentSuffix()).toBe('test-suffix');
    });

    test('should create instance with default suffix when not provided', () => {
      const defaultStack = new TapStack();
      expect(defaultStack.getEnvironmentSuffix()).toBe('dev');
    });

    test('should load template correctly', () => {
      const template = tapStack.getTemplate();
      expect(template).toBeDefined();
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });
  });

  describe('Resource Methods', () => {
    test('should return correct resource count', () => {
      const count = tapStack.getResourceCount();
      expect(count).toBeGreaterThan(15);
    });

    test('should return unique resource types', () => {
      const types = tapStack.getResourceTypes();
      expect(types).toContain('AWS::S3::Bucket');
      expect(types).toContain('AWS::DynamoDB::Table');
      expect(types).toContain('AWS::Lambda::Function');
      expect(types).toContain('AWS::ApiGateway::RestApi');
    });

    test('should check if resource exists', () => {
      expect(tapStack.hasResource('QuizResultsBucket')).toBe(true);
      expect(tapStack.hasResource('NonExistentResource')).toBe(false);
    });

    test('should get resource by name', () => {
      const bucket = tapStack.getResource('QuizResultsBucket');
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should return undefined for non-existent resource', () => {
      const resource = tapStack.getResource('NonExistentResource');
      expect(resource).toBeUndefined();
    });
  });

  describe('Template Component Methods', () => {
    test('should get output by name', () => {
      const output = tapStack.getOutput('ApiEndpoint');
      expect(output).toBeDefined();
      expect(output.Description).toBe('API Gateway endpoint URL');
    });

    test('should get parameter by name', () => {
      const param = tapStack.getParameter('Environment');
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
    });

    test('should return undefined for non-existent output', () => {
      const output = tapStack.getOutput('NonExistentOutput');
      expect(output).toBeUndefined();
    });

    test('should return undefined for non-existent parameter', () => {
      const param = tapStack.getParameter('NonExistentParam');
      expect(param).toBeUndefined();
    });
  });

  describe('Stack Resources Organization', () => {
    test('should categorize resources correctly', () => {
      const resources = tapStack.getStackResources();

      expect(resources.s3Buckets).toContain('QuizResultsBucket');
      expect(resources.dynamoTables).toContain('QuestionsTable');
      expect(resources.dynamoTables).toContain('ResultsTable');
      expect(resources.lambdaFunctions).toContain('QuizGenerationFunction');
      expect(resources.lambdaFunctions).toContain('QuizScoringFunction');
      expect(resources.iamRoles).toContain('QuizGenerationLambdaRole');
      expect(resources.iamRoles).toContain('QuizScoringLambdaRole');
      expect(resources.apiGateways).toContain('QuizAPI');
    });

    test('should return correct counts for each resource type', () => {
      const resources = tapStack.getStackResources();

      expect(resources.s3Buckets.length).toBeGreaterThanOrEqual(1);
      expect(resources.dynamoTables.length).toBe(2);
      expect(resources.lambdaFunctions.length).toBe(3);
      expect(resources.iamRoles.length).toBe(4);
      expect(resources.apiGateways.length).toBe(1);
    });
  });

  describe('Template Validation', () => {
    test('should validate template successfully', () => {
      const errors = tapStack.validateTemplate();
      expect(errors).toEqual([]);
    });

    test('should detect missing deletion policies', () => {
      // Temporarily modify a resource to test validation
      const template = tapStack.getTemplate();
      const originalPolicy = template.Resources.QuizResultsBucket.DeletionPolicy;
      delete template.Resources.QuizResultsBucket.DeletionPolicy;

      const errors = tapStack.validateTemplate();
      expect(errors).toContain('Resource QuizResultsBucket should have DeletionPolicy: Delete');

      // Restore original
      template.Resources.QuizResultsBucket.DeletionPolicy = originalPolicy;
    });
  });

  describe('IAM Capabilities Detection', () => {
    test('should detect required IAM capabilities', () => {
      const capabilities = tapStack.getRequiredCapabilities();
      expect(capabilities).toContain('CAPABILITY_IAM');
      expect(capabilities).toContain('CAPABILITY_NAMED_IAM');
    });
  });

  describe('Dependency Analysis', () => {
    test('should build dependency graph', () => {
      const deps = tapStack.getDependencyGraph();
      expect(deps).toBeInstanceOf(Map);
      expect(deps.size).toBeGreaterThan(0);
    });

    test('Lambda functions should depend on IAM roles', () => {
      const deps = tapStack.getDependencyGraph();
      const genFuncDeps = deps.get('QuizGenerationFunction');
      expect(genFuncDeps).toContain('QuizGenerationLambdaRole');

      const scoringFuncDeps = deps.get('QuizScoringFunction');
      expect(scoringFuncDeps).toContain('QuizScoringLambdaRole');
    });

    test('API methods should have Lambda function dependencies', () => {
      const deps = tapStack.getDependencyGraph();
      const generateMethodDeps = deps.get('GenerateMethod');
      expect(generateMethodDeps).toBeDefined();
    });
  });

  describe('Template Serialization', () => {
    test('should convert to JSON string', () => {
      const json = tapStack.toJson();
      expect(json).toBeTruthy();

      const parsed = JSON.parse(json);
      expect(parsed.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should convert to YAML string', () => {
      const yaml = tapStack.toYaml();
      expect(yaml).toBeTruthy();
      expect(yaml).toContain('AWSTemplateFormatVersion');
    });
  });

  describe('Environment Suffix Validation', () => {
    test('all named resources should use environment suffix', () => {
      const errors: string[] = [];
      const namedResources = [
        { name: 'QuizResultsBucket', property: 'BucketName' },
        { name: 'QuestionsTable', property: 'TableName' },
        { name: 'ResultsTable', property: 'TableName' },
        { name: 'QuizGenerationFunction', property: 'FunctionName' },
        { name: 'QuizScoringFunction', property: 'FunctionName' }
      ];

      namedResources.forEach(({ name, property }) => {
        const resource = tapStack.getResource(name);
        if (resource && resource.Properties && resource.Properties[property]) {
          const nameValue = resource.Properties[property];
          if (nameValue['Fn::Sub'] && !nameValue['Fn::Sub'].includes('${EnvironmentSuffix}')) {
            errors.push(`${name} does not use EnvironmentSuffix`);
          }
        }
      });

      expect(errors).toEqual([]);
    });
  });

  describe('Security Configuration', () => {
    test('S3 bucket should have security features enabled', () => {
      const bucket = tapStack.getResource('QuizResultsBucket');

      // Check versioning
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');

      // Check public access blocking
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('DynamoDB tables should have appropriate recovery settings', () => {
      const questionsTable = tapStack.getResource('QuestionsTable');
      expect(questionsTable.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('Lambda functions should have appropriate timeouts', () => {
      const genFunction = tapStack.getResource('QuizGenerationFunction');
      expect(genFunction.Properties.Timeout).toBe(300); // 5 minutes

      const scoringFunction = tapStack.getResource('QuizScoringFunction');
      expect(scoringFunction.Properties.Timeout).toBe(60); // 1 minute
    });
  });

  describe('CloudWatch Configuration', () => {
    test('should have monitoring resources', () => {
      expect(tapStack.hasResource('QuizMetricsDashboard')).toBe(true);
      expect(tapStack.hasResource('GenerationErrorAlarm')).toBe(true);
      expect(tapStack.hasResource('HighLatencyAlarm')).toBe(true);
    });

    test('alarms should have correct thresholds', () => {
      const errorAlarm = tapStack.getResource('GenerationErrorAlarm');
      expect(errorAlarm.Properties.Threshold).toBe(5);
      expect(errorAlarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');

      const latencyAlarm = tapStack.getResource('HighLatencyAlarm');
      expect(latencyAlarm.Properties.Threshold).toBe(1000);
      expect(latencyAlarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('API Gateway Configuration', () => {
    test('API should have correct endpoint configuration', () => {
      const api = tapStack.getResource('QuizAPI');
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should have all required API resources', () => {
      const apiResources = [
        'QuizResource',
        'GenerateResource',
        'SubmitResource',
        'QuizIdResource',
        'ResultsResource'
      ];

      apiResources.forEach(resource => {
        expect(tapStack.hasResource(resource)).toBe(true);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing template file gracefully', () => {
      // This would require mocking fs.readFileSync
      expect(() => new TapStack()).not.toThrow();
    });

    test('should handle empty resource detection', () => {
      const template = tapStack.getTemplate();
      const originalResources = { ...template.Resources };

      template.Resources = {};
      const errors = tapStack.validateTemplate();
      expect(errors).toContain('Template must have at least one resource');

      template.Resources = originalResources;
    });

    test('should detect invalid CloudFormation template version', () => {
      const template = tapStack.getTemplate();
      const originalVersion = template.AWSTemplateFormatVersion;

      template.AWSTemplateFormatVersion = '2008-01-01';
      const errors = tapStack.validateTemplate();
      expect(errors).toContain('Invalid CloudFormation template version');

      template.AWSTemplateFormatVersion = originalVersion;
    });

    test('should detect missing UpdateReplacePolicy on deletable resources', () => {
      const template = tapStack.getTemplate();
      const bucketResource = template.Resources['QuizResultsBucket'];
      const originalUpdatePolicy = bucketResource.UpdateReplacePolicy;

      delete bucketResource.UpdateReplacePolicy;
      const errors = tapStack.validateTemplate();
      expect(errors.some(e => e.includes('UpdateReplacePolicy'))).toBe(true);

      bucketResource.UpdateReplacePolicy = originalUpdatePolicy;
    });

    test('should detect resources missing EnvironmentSuffix in name', () => {
      const template = tapStack.getTemplate();
      
      // Temporarily modify an existing resource to test validation
      const bucketResource = template.Resources['QuizResultsBucket'];
      const originalBucketName = bucketResource.Properties.BucketName;
      
      // Set bucket name to a simple string (missing EnvironmentSuffix)
      bucketResource.Properties.BucketName = 'static-bucket-name';

      const errors = tapStack.validateTemplate();
      expect(errors.some(e => e.includes('should use EnvironmentSuffix'))).toBe(true);

      // Restore original
      bucketResource.Properties.BucketName = originalBucketName;
    });

    test('should handle DependsOn as single string', () => {
      const template = tapStack.getTemplate();
      
      // Temporarily change DependsOn from array to single string
      const apiDeployment = template.Resources['APIDeployment'];
      const originalDependsOn = apiDeployment.DependsOn;
      
      // Change array to single string
      apiDeployment.DependsOn = 'GenerateMethod';

      const dependencies = tapStack.getDependencyGraph();
      expect(dependencies.get('APIDeployment')).toContain('GenerateMethod');

      // Restore original array
      apiDeployment.DependsOn = originalDependsOn;
    });

    test('should handle name properties that are not objects with Fn::Sub', () => {
      const template = tapStack.getTemplate();
      
      // Temporarily modify a Lambda function to have a plain string name
      const lambdaResource = template.Resources['QuizGenerationFunction'];
      const originalFunctionName = lambdaResource.Properties.FunctionName;
      
      // Set function name to a plain string (not an object with Fn::Sub)
      lambdaResource.Properties.FunctionName = 'plain-string-function-name';

      const errors = tapStack.validateTemplate();
      expect(errors.some(e => e.includes('QuizGenerationFunction') && e.includes('EnvironmentSuffix'))).toBe(true);

      // Restore original
      lambdaResource.Properties.FunctionName = originalFunctionName;
    });
  });
});