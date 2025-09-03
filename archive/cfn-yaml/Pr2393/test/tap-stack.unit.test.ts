import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('AWS CI/CD Pipeline CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
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
      expect(template.Description).toBe(
        'AWS CI/CD Pipeline Infrastructure with CodePipeline, CodeBuild, CodeDeploy and Elastic Beanstalk across multiple environments'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'EnvironmentSuffix',
        'Environment',
        'Project',
        'Owner',
        'CostCenter',
        'GitHubRepository',
        'GitHubBranch',
        'GitHubOwner',
        'NotificationEmail'
      ];

      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBe('Environment suffix for resource naming to avoid conflicts');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });

    test('Environment parameter should have allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toEqual(['Development', 'Testing', 'Production']);
    });

    test('NotificationEmail parameter should have email pattern', () => {
      const param = template.Parameters.NotificationEmail;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    });
  });

  describe('Resources', () => {
    test('should have all required CI/CD pipeline resources', () => {
      const expectedResources = [
        'PipelineKMSKey',
        'PipelineKMSKeyAlias',
        'ArtifactsBucket',
        'PipelineNotificationTopic',
        'PipelineNotificationSubscription',
        'CodePipelineRole',
        'CodeBuildRole',
        'CodeBuildProject',
        'ElasticBeanstalkApplication',
        'EBServiceRole',
        'EBInstanceRole',
        'EBInstanceProfile',
        'DevelopmentEnvironment',
        'TestingEnvironment',
        'ProductionEnvironment',
        'CodePipeline',
        'PipelineEventRule'
      ];

      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('KMS Key should have correct properties', () => {
      const kmsKey = template.Resources.PipelineKMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.DeletionPolicy).toBe('Delete');
      expect(kmsKey.Properties.Description).toBe('KMS Key for CI/CD Pipeline encryption');
    });

    test('S3 Artifacts Bucket should be encrypted', () => {
      const bucket = template.Resources.ArtifactsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('CodeBuild Project should have correct properties', () => {
      const codeBuild = template.Resources.CodeBuildProject;
      expect(codeBuild.Type).toBe('AWS::CodeBuild::Project');
      expect(codeBuild.DeletionPolicy).toBe('Delete');
      expect(codeBuild.Properties.Environment.Image).toBe('aws/codebuild/amazonlinux2-x86_64-standard:5.0');
      expect(codeBuild.Properties.Source.Type).toBe('CODEPIPELINE');
    });

    test('Elastic Beanstalk environments should exist for all stages', () => {
      const devEnv = template.Resources.DevelopmentEnvironment;
      const testEnv = template.Resources.TestingEnvironment;
      const prodEnv = template.Resources.ProductionEnvironment;

      expect(devEnv.Type).toBe('AWS::ElasticBeanstalk::Environment');
      expect(testEnv.Type).toBe('AWS::ElasticBeanstalk::Environment');
      expect(prodEnv.Type).toBe('AWS::ElasticBeanstalk::Environment');

      expect(devEnv.DeletionPolicy).toBe('Delete');
      expect(testEnv.DeletionPolicy).toBe('Delete');
      expect(prodEnv.DeletionPolicy).toBe('Delete');
    });

    test('CodePipeline should have correct stages', () => {
      const pipeline = template.Resources.CodePipeline;
      expect(pipeline.Type).toBe('AWS::CodePipeline::Pipeline');
      expect(pipeline.DeletionPolicy).toBe('Delete');

      const stages = pipeline.Properties.Stages;
      expect(stages).toHaveLength(5); // Source, Build, DeployToDev, DeployToTest, DeployToProd

      const stageNames = stages.map((stage: any) => stage.Name);
      expect(stageNames).toEqual(['Source', 'Build', 'DeployToDev', 'DeployToTest', 'DeployToProd']);
    });

    test('SNS Topic should be encrypted', () => {
      const topic = template.Resources.PipelineNotificationTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.DeletionPolicy).toBe('Delete');
      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'PipelineKMSKey' });
    });

    test('All resources should have DeletionPolicy Delete', () => {
      const resourcesWithDeletionPolicy = [
        'PipelineKMSKey', 'PipelineKMSKeyAlias', 'ArtifactsBucket',
        'PipelineNotificationTopic', 'CodePipelineRole', 'CodeBuildRole',
        'CodeBuildProject', 'ElasticBeanstalkApplication', 'EBServiceRole',
        'EBInstanceRole', 'EBInstanceProfile', 'DevelopmentEnvironment',
        'TestingEnvironment', 'ProductionEnvironment', 'CodePipeline',
        'PipelineEventRule'
      ];

      resourcesWithDeletionPolicy.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'PipelineName',
        'ArtifactsBucketName',
        'KMSKeyId',
        'SNSTopicArn',
        'DevelopmentEnvironmentURL',
        'TestingEnvironmentURL',
        'ProductionEnvironmentURL',
        'CodeBuildProjectName',
        'ElasticBeanstalkApplicationName',
        'StackName',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('PipelineName output should be correct', () => {
      const output = template.Outputs.PipelineName;
      expect(output.Description).toBe('Name of the CodePipeline');
      expect(output.Value).toEqual({ Ref: 'CodePipeline' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-PipelineName',
      });
    });

    test('Environment URLs should be correct', () => {
      const devOutput = template.Outputs.DevelopmentEnvironmentURL;
      const testOutput = template.Outputs.TestingEnvironmentURL;
      const prodOutput = template.Outputs.ProductionEnvironmentURL;

      expect(devOutput.Value).toEqual({
        'Fn::Sub': 'http://${DevelopmentEnvironment}.${AWS::Region}.elasticbeanstalk.com'
      });
      expect(testOutput.Value).toEqual({
        'Fn::Sub': 'http://${TestingEnvironment}.${AWS::Region}.elasticbeanstalk.com'
      });
      expect(prodOutput.Value).toEqual({
        'Fn::Sub': 'http://${ProductionEnvironment}.${AWS::Region}.elasticbeanstalk.com'
      });
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('Name of this CloudFormation stack');
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-StackName',
      });
    });

    test('EnvironmentSuffix output should be correct', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBe(
        'Environment suffix used for this deployment'
      );
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EnvironmentSuffix',
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct number of resources for CI/CD pipeline', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(18); // All CI/CD resources
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(11); // All required parameters
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(12); // All pipeline outputs
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with environment suffix', () => {
      const bucket = template.Resources.ArtifactsBucket;
      const pipeline = template.Resources.CodePipeline;
      const buildProject = template.Resources.CodeBuildProject;

      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'cicd-artifacts-${EnvironmentSuffix}-${AWS::Region}-${AWS::AccountId}'
      });
      expect(pipeline.Properties.Name).toEqual({
        'Fn::Sub': 'cicd-pipeline-${EnvironmentSuffix}'
      });
      expect(buildProject.Properties.Name).toEqual({
        'Fn::Sub': 'cicd-build-${EnvironmentSuffix}'
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });

  describe('Security and Compliance', () => {
    test('all resources should have proper tagging', () => {
      const taggedResources = [
        'PipelineKMSKey', 'ArtifactsBucket', 'PipelineNotificationTopic',
        'CodePipelineRole', 'CodeBuildRole', 'CodeBuildProject',
        'EBServiceRole', 'EBInstanceRole', 'DevelopmentEnvironment',
        'TestingEnvironment', 'ProductionEnvironment', 'CodePipeline'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();

        const tags = resource.Properties.Tags;
        const tagKeys = tags.map((tag: any) => tag.Key);

        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Project');
        expect(tagKeys).toContain('Owner');
        expect(tagKeys).toContain('CostCenter');
      });
    });

    test('encryption should be enforced', () => {
      const bucket = template.Resources.ArtifactsBucket;
      const topic = template.Resources.PipelineNotificationTopic;
      const pipeline = template.Resources.CodePipeline;

      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');

      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'PipelineKMSKey' });

      expect(pipeline.Properties.ArtifactStore.EncryptionKey).toEqual({
        Id: { 'Fn::GetAtt': ['PipelineKMSKey', 'Arn'] },
        Type: 'KMS'
      });
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.ArtifactsBucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });
  });
});
