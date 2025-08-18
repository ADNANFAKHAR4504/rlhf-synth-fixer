import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If you're testing a yaml template, run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    const expectedParams = [
      'ProjectName',
      'SourceBucketName',
      'ArtifactsBucketName',
      'NotificationEmail',
    ];
    test('should have all required parameters', () => {
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });
  });

  describe('Resources', () => {
    const expectedResources = [
      'SourceCodeBucket',
      'ArtifactsBucket',
      'CodeBuildLogGroup',
      'LambdaLogGroup',
      'S3LogGroup',
      'PipelineLogGroup',
      'CodePipelineServiceRole',
      'CodeBuildServiceRole',
      'LambdaExecutionRole',
      'ValidationLambda',
      'CodeBuildProject',
      'PipelineNotificationTopic',
      'PipelineNotificationSubscription',
      'CodePipeline',
      'PipelineEventRule',
      'PipelineEventRulePermission',
    ];
    test('should have all main resources', () => {
      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('S3 buckets should have unique, lowercase names', () => {
      const sourceProps = template.Resources.SourceCodeBucket.Properties;
      const artifactsProps = template.Resources.ArtifactsBucket.Properties;
      expect(sourceProps.BucketName['Fn::Sub']).toMatch(/\$\{SourceBucketName\}-\$\{AWS::AccountId\}-\$\{AWS::Region\}/);
      expect(artifactsProps.BucketName['Fn::Sub']).toMatch(/\$\{ArtifactsBucketName\}-\$\{AWS::AccountId\}-\$\{AWS::Region\}/);
    });

    test('IAM roles should have correct trust relationships', () => {
      const codePipelineRole = template.Resources.CodePipelineServiceRole.Properties;
      const codeBuildRole = template.Resources.CodeBuildServiceRole.Properties;
      const lambdaRole = template.Resources.LambdaExecutionRole.Properties;
      expect(codePipelineRole.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('codepipeline.amazonaws.com');
      expect(codeBuildRole.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('codebuild.amazonaws.com');
      expect(lambdaRole.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('ValidationLambda should use python3.9 runtime', () => {
      const lambda = template.Resources.ValidationLambda.Properties;
      expect(lambda.Runtime).toBe('python3.9');
    });

    test('CodeBuildProject should use correct image and environment', () => {
      const cb = template.Resources.CodeBuildProject.Properties;
      expect(cb.Environment.Image).toContain('amazonlinux2');
      expect(cb.Environment.Type).toBe('LINUX_CONTAINER');
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'PipelineName',
      'SourceBucketName',
      'ArtifactsBucketName',
      'CodeBuildProjectName',
      'ValidationLambdaName',
      'PipelineConsoleURL',
      'SourceBucketConsoleURL',
    ];
    test('should have all required outputs', () => {
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resource logical IDs should be unique', () => {
      const resourceKeys = Object.keys(template.Resources);
      const uniqueKeys = new Set(resourceKeys);
      expect(resourceKeys.length).toBe(uniqueKeys.size);
    });
  });
});
