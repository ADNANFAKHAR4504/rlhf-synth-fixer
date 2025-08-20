import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(true).toBe(true);
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Production CI/CD Pipeline for Web Application with CodePipeline, CodeBuild, and Elastic Beanstalk deployment'
      );
    });

    test('should not have metadata section', () => {
      expect(template.Metadata).toBeUndefined();
    });
  });

  describe('Parameters', () => {
    test('should have CodeCommitRepositoryName parameter', () => {
      expect(template.Parameters.CodeCommitRepositoryName).toBeDefined();
    });

    test('CodeCommitRepositoryName parameter should have correct properties', () => {
      const param = template.Parameters.CodeCommitRepositoryName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('my-web-app-repo');
      expect(param.Description).toBe('Name of the existing CodeCommit repository');
    });

    test('should have ElasticBeanstalkApplicationName parameter', () => {
      expect(template.Parameters.ElasticBeanstalkApplicationName).toBeDefined();
    });

    test('should have ElasticBeanstalkEnvironmentName parameter', () => {
      expect(template.Parameters.ElasticBeanstalkEnvironmentName).toBeDefined();
    });

    test('should have BranchName parameter', () => {
      expect(template.Parameters.BranchName).toBeDefined();
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toBe('Environment suffix for resource naming to avoid conflicts');
    });
  });

  describe('Resources', () => {
    test('should have prodPipelineArtifactStore resource', () => {
      expect(template.Resources.prodPipelineArtifactStore).toBeDefined();
    });

    test('prodPipelineArtifactStore should be an S3 bucket', () => {
      const bucket = template.Resources.prodPipelineArtifactStore;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have prodCodePipeline resource', () => {
      expect(template.Resources.prodCodePipeline).toBeDefined();
    });

    test('prodCodePipeline should be a CodePipeline', () => {
      const pipeline = template.Resources.prodCodePipeline;
      expect(pipeline.Type).toBe('AWS::CodePipeline::Pipeline');
    });

    test('should have prodCodeBuildProject resource', () => {
      expect(template.Resources.prodCodeBuildProject).toBeDefined();
    });

    test('prodCodeBuildProject should be a CodeBuild project', () => {
      const project = template.Resources.prodCodeBuildProject;
      expect(project.Type).toBe('AWS::CodeBuild::Project');
    });

    test('should have prodCodePipelineServiceRole resource', () => {
      expect(template.Resources.prodCodePipelineServiceRole).toBeDefined();
    });

    test('prodCodePipelineServiceRole should be an IAM role', () => {
      const role = template.Resources.prodCodePipelineServiceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have prodCodeBuildServiceRole resource', () => {
      expect(template.Resources.prodCodeBuildServiceRole).toBeDefined();
    });

    test('should have prodCodeCommitEventRule resource', () => {
      expect(template.Resources.prodCodeCommitEventRule).toBeDefined();
    });

    test('should have prodCloudWatchEventRole resource', () => {
      expect(template.Resources.prodCloudWatchEventRole).toBeDefined();
    });

    test('should have prodCodeBuildLogGroup resource', () => {
      expect(template.Resources.prodCodeBuildLogGroup).toBeDefined();
    });

    test('should have PipelineArtifactLogGroup resource', () => {
      expect(template.Resources.PipelineArtifactLogGroup).toBeDefined();
    });

    test('PipelineArtifactLogGroup should be a CloudWatch Log Group', () => {
      const logGroup = template.Resources.PipelineArtifactLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have PipelineDashboard resource', () => {
      expect(template.Resources.PipelineDashboard).toBeDefined();
    });

    test('PipelineDashboard should be a CloudWatch Dashboard', () => {
      const dashboard = template.Resources.PipelineDashboard;
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'PipelineName',
        'PipelineUrl',
        'CodeBuildProjectName',
        'ArtifactsBucketName',
        'CodeBuildLogGroup',
        'DashboardUrl',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('PipelineName output should be correct', () => {
      const output = template.Outputs.PipelineName;
      expect(output.Description).toBe('Name of the created CodePipeline');
      expect(output.Value).toEqual({ Ref: 'prodCodePipeline' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-PipelineName',
      });
    });

    test('PipelineUrl output should be correct', () => {
      const output = template.Outputs.PipelineUrl;
      expect(output.Description).toBe('URL of the CodePipeline in AWS Console');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${prodCodePipeline}/view',
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-PipelineUrl',
      });
    });

    test('CodeBuildProjectName output should be correct', () => {
      const output = template.Outputs.CodeBuildProjectName;
      expect(output.Description).toBe('Name of the CodeBuild project');
      expect(output.Value).toEqual({ Ref: 'prodCodeBuildProject' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-CodeBuildProject',
      });
    });

    test('ArtifactsBucketName output should be correct', () => {
      const output = template.Outputs.ArtifactsBucketName;
      expect(output.Description).toBe('Name of the S3 bucket storing pipeline artifacts');
      expect(output.Value).toEqual({ Ref: 'prodPipelineArtifactStore' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ArtifactsBucket',
      });
    });

    test('CodeBuildLogGroup output should be correct', () => {
      const output = template.Outputs.CodeBuildLogGroup;
      expect(output.Description).toBe('CloudWatch Log Group for CodeBuild');
      expect(output.Value).toEqual({ Ref: 'prodCodeBuildLogGroup' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-CodeBuildLogGroup',
      });
    });

    test('DashboardUrl output should be correct', () => {
      const output = template.Outputs.DashboardUrl;
      expect(output.Description).toBe('URL of the CloudWatch Dashboard');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${PipelineDashboard}',
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-DashboardUrl',
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

    test('should have exactly ten resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(10);
    });

    test('should have exactly five parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5);
    });

    test('should have exactly six outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });
  });

  describe('Resource Naming Convention', () => {
    test('export names should follow naming convention', () => {
      // Define the expected export names based on the actual template
      const expectedExportNames: { [key: string]: string } = {
        'PipelineName': 'PipelineName',
        'PipelineUrl': 'PipelineUrl',
        'CodeBuildProjectName': 'CodeBuildProject',
        'ArtifactsBucketName': 'ArtifactsBucket',
        'CodeBuildLogGroup': 'CodeBuildLogGroup',
        'DashboardUrl': 'DashboardUrl'
      };

      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        const expectedName = expectedExportNames[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${expectedName}`,
        });
      });
    });

    test('S3 bucket should have proper naming convention', () => {
      const bucket = template.Resources.prodPipelineArtifactStore;
      const bucketName = bucket.Properties.BucketName;
      expect(bucketName).toEqual({
        'Fn::Sub': 'prod${EnvironmentSuffix}-pipeline-artifacts-${AWS::AccountId}-${AWS::Region}',
      });
    });
  });
});
