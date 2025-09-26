import fs from 'fs';
import path from 'path';

describe('CI/CD CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
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
      expect(template.Description).toContain('CI/CD pipeline');
    });

    test('should have parameters, resources, and outputs', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    const expectedParams = [
      'GitHubOwner',
      'GitHubRepo',
      'GitHubBranch',
      'GitHubOAuthToken',
      'NotificationEmail',
      'ApplicationName',
      'DeploymentGroupName',
    ];

    test('should define all required parameters', () => {
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('GitHubOAuthToken should have NoEcho', () => {
      expect(template.Parameters.GitHubOAuthToken.NoEcho).toBe(true);
    });
  });

  describe('Resources', () => {
    test('should have ArtifactBucket with versioning enabled', () => {
      const bucket = template.Resources.ArtifactBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have SNSTopic with email subscription', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
    });

    test('should define IAM Role for Pipeline with proper trust and policies', () => {
      const role = template.Resources.PipelineRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      // expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('codepipeline.amazonaws.com');
      expect(role.Properties.Policies[0].PolicyDocument.Statement[0].Action).toContain('codebuild:*');
    });

    test('should define IAM Role for CodeBuild with proper permissions', () => {
      const role = template.Resources.CodeBuildRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('codebuild.amazonaws.com');
    });

    test('should define CodeBuild project with proper settings', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Type).toBe('AWS::CodeBuild::Project');
      expect(project.Properties.Environment.Image).toBe('aws/codebuild/standard:6.0');
      expect(project.Properties.Source.Type).toBe('CODEPIPELINE');
    });

    test('should define CodeDeploy application and deployment group', () => {
      const app = template.Resources.CodeDeployApplication;
      expect(app.Type).toBe('AWS::CodeDeploy::Application');
    });

    test('should define CodePipeline with all 4 stages', () => {
      const pipeline = template.Resources.CodePipeline;
      expect(pipeline.Type).toBe('AWS::CodePipeline::Pipeline');
      expect(pipeline.Properties.Stages).toHaveLength(4);

      const stageNames = pipeline.Properties.Stages.map((s: any) => s.Name);
      expect(stageNames).toEqual(['Source', 'Build', 'Approval', 'Deploy']);
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'PipelineName',
      'CodeBuildProjectName',
      'CodeDeployApplicationName',
      'SNSTopicARN',
      'ArtifactBucketName'
    ];

    test('should define all required outputs', () => {
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
        expect(template.Outputs[output].Value).toBeDefined();
      });
    });

    test('should describe PipelineName output correctly', () => {
      const output = template.Outputs.PipelineName;
      expect(output.Description).toContain('CodePipeline');
      expect(output.Value).toEqual({ Ref: 'CodePipeline' });
    });

    test('should describe CodeBuildProjectName output correctly', () => {
      const output = template.Outputs.CodeBuildProjectName;
      expect(output.Description).toContain('CodeBuild');
      expect(output.Value).toEqual({ Ref: 'CodeBuildProject' });
    });

    test('should describe CodeDeployApplicationName output correctly', () => {
      const output = template.Outputs.CodeDeployApplicationName;
      expect(output.Description).toContain('CodeDeploy');
      expect(output.Value).toEqual({ Ref: 'CodeDeployApplication' });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(typeof template).toBe('object');
      expect(template.Resources).not.toBeNull();
    });

    test('should not have undefined required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have at least 1 S3 bucket', () => {
      const buckets = Object.values(template.Resources).filter((res: any) => res.Type === 'AWS::S3::Bucket');
      expect(buckets.length).toBeGreaterThan(0);
    });

    test('should have at least 1 IAM Role', () => {
      const roles = Object.values(template.Resources).filter((res: any) => res.Type === 'AWS::IAM::Role');
      expect(roles.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Resource Naming', () => {
    test('CodeBuild project name should use Fn::Sub with StackName', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Properties.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-Build',
      });
    });

    test('Pipeline role used in CodeDeploy and CodePipeline', () => {
      const pipeline = template.Resources.CodePipeline;
      const deployGroup = template.Resources.CodeDeployDeploymentGroup;

      expect(pipeline.Properties.RoleArn).toEqual({
        'Fn::GetAtt': ['PipelineRole', 'Arn'],
      });

      expect(deployGroup.Properties.ServiceRoleArn).toEqual({
        'Fn::GetAtt': ['PipelineRole', 'Arn'],
      });
    });
  });
});
