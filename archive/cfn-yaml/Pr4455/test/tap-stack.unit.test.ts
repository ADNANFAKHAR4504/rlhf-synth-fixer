import fs from 'fs';
import path from 'path';

describe('CI/CD Pipeline CloudFormation Template', () => {
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
        'CI/CD Pipeline for Web Application Deployment using CodePipeline, CodeBuild, and CodeDeploy'
      );
    });

    test('should have parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have required CI/CD pipeline parameters', () => {
      const requiredParams = [
        'DevEnvironmentName',
        'ProdEnvironmentName', 
        'NotificationEmail',
        'ArtifactBucketName',
        'ApplicationName',
        'RepositoryName',
        'CreateCodeCommitRepo',
        'DevInstanceType',
        'ProdInstanceType',
        'KeyPairName',
        'VPCCidr'
      ];

      requiredParams.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
        expect(template.Parameters[paramName].Type).toBe('String');
      });
    });

    test('ApplicationName parameter should have correct default', () => {
      const appNameParam = template.Parameters.ApplicationName;
      expect(appNameParam.Default).toBe('WebApp1');
      expect(appNameParam.Description).toBe('Name of the application to be deployed');
    });

    test('CreateCodeCommitRepo parameter should have correct allowed values', () => {
      const createRepoParam = template.Parameters.CreateCodeCommitRepo;
      expect(createRepoParam.Default).toBe('false');
      expect(createRepoParam.AllowedValues).toEqual(['true', 'false']);
    });

    test('Infrastructure parameters should have correct defaults', () => {
      expect(template.Parameters.DevInstanceType.Default).toBe('t3.micro');
      expect(template.Parameters.ProdInstanceType.Default).toBe('t3.small');
      expect(template.Parameters.VPCCidr.Default).toBe('10.0.0.0/16');
      expect(template.Parameters.KeyPairName.Default).toBe('');
    });

    test('Instance type parameters should have allowed values', () => {
      const devInstanceParam = template.Parameters.DevInstanceType;
      expect(devInstanceParam.AllowedValues).toContain('t3.micro');
      expect(devInstanceParam.AllowedValues).toContain('t3.small');
      
      const prodInstanceParam = template.Parameters.ProdInstanceType;
      expect(prodInstanceParam.AllowedValues).toContain('t3.small');
      expect(prodInstanceParam.AllowedValues).toContain('t3.medium');
    });
  });

  describe('Resources', () => {
    test('should have required CI/CD pipeline resources', () => {
      const requiredResources = [
        'CodePipelineServiceRole',
        'ArtifactBucket',
        'BuildProject',
        'TestProject',
        'Pipeline'
      ];

      requiredResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('should have required VPC infrastructure resources', () => {
      const vpcResources = [
        'ApplicationVPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'ApplicationLoadBalancer'
      ];

      vpcResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('should have required Auto Scaling and EC2 resources', () => {
      const ec2Resources = [
        'ProdLaunchTemplate',
        'DevLaunchTemplate',
        'ProdAutoScalingGroup',
        'DevAutoScalingGroup',
        'ALBSecurityGroup',
        'EC2SecurityGroup'
      ];

      ec2Resources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('should have required security and monitoring resources', () => {
      const securityResources = [
        'S3KMSKey',
        'ApplicationSecrets',
        'CloudTrail',
        'ApplicationDashboard',
        'ApplicationHealthMetric'
      ];

      securityResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('CodePipelineServiceRole should be an IAM role', () => {
      const role = template.Resources.CodePipelineServiceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('ArtifactBucket should be an S3 bucket', () => {
      const bucket = template.Resources.ArtifactBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('BuildProject should be a CodeBuild project', () => {
      const project = template.Resources.BuildProject;
      expect(project.Type).toBe('AWS::CodeBuild::Project');
    });

    test('TestProject should be a CodeBuild project', () => {
      const project = template.Resources.TestProject;
      expect(project.Type).toBe('AWS::CodeBuild::Project');
    });

    test('Pipeline should be a CodePipeline', () => {
      const pipeline = template.Resources.Pipeline;
      expect(pipeline.Type).toBe('AWS::CodePipeline::Pipeline');
    });

    test('all resources should have rlhf-iac-amazon tags', () => {
      const resources = template.Resources;
      Object.keys(resources).forEach(resourceName => {
        const resource = resources[resourceName];
        if (resource.Properties && resource.Properties.Tags) {
          expect(resource.Properties.Tags.some(tag => 
            tag.Key === 'rlhf-iac-amazon' && tag.Value === 'true'
          )).toBe(true);
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'PipelineArn',
        'PipelineConsoleURL',
        'NotificationTopicARN',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have conditional CodeCommit outputs when repository creation is enabled', () => {
      const conditionalOutputs = [
        'CodeCommitRepositoryCloneUrlHTTPS',
        'CodeCommitRepositoryCloneUrlSSH',
      ];

      conditionalOutputs.forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output).toBeDefined();
        expect(output.Condition).toBe('ShouldCreateCodeCommitRepo');
      });
    });

    test('PipelineArn output should be correct', () => {
      const output = template.Outputs.PipelineArn;
      expect(output.Description).toBe('ARN of the CI/CD Pipeline');
      expect(output.Value).toEqual({ Ref: 'Pipeline' });
    });

    test('PipelineConsoleURL output should reference ApplicationName parameter', () => {
      const output = template.Outputs.PipelineConsoleURL;
      expect(output.Description).toBe('Console URL for the CI/CD Pipeline');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://console.aws.amazon.com/codepipeline/home?region=${AWS::Region}#/view/${ApplicationName}-Pipeline',
      });
    });

    test('NotificationTopicARN output should reference PipelineNotificationTopic', () => {
      const output = template.Outputs.NotificationTopicARN;
      expect(output.Description).toBe('ARN of the SNS Topic used for pipeline notifications');
      expect(output.Value).toEqual({ Ref: 'PipelineNotificationTopic' });
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

    test('should have multiple CI/CD pipeline resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(5); // Should have multiple IAM roles, S3 bucket, CodeBuild projects, etc.
    });

    test('should have eleven parameters for comprehensive infrastructure configuration', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(11);
    });

    test('should have comprehensive outputs for all infrastructure components', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(18); // Includes VPC, ALB, ASG, KMS, CloudTrail, Dashboard, etc.
    });
  });

  describe('CI/CD Pipeline Configuration', () => {
    test('should have conditions for optional CodeCommit repository', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.ShouldCreateCodeCommitRepo).toBeDefined();
    });

    test('should have conditional resources for CodeCommit repository', () => {
      const codeCommitRepo = template.Resources.CodeCommitRepo;
      if (codeCommitRepo) {
        expect(codeCommitRepo.Condition).toBe('ShouldCreateCodeCommitRepo');
      }
    });

    test('should have proper IAM role for CodePipeline', () => {
      const role = template.Resources.CodePipelineServiceRole;
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(role.Properties.Policies).toBeDefined();
    });

    test('should reference application name in pipeline configuration', () => {
      const pipeline = template.Resources.Pipeline;
      expect(JSON.stringify(pipeline.Properties)).toContain('ApplicationName');
    });
  });
});
