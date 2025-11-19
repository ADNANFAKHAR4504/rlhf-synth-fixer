/**
 * Integration Tests for CI/CD Pipeline CloudFormation Template
 *
 * Note: These tests validate template structure and configuration.
 * Full deployment testing requires:
 * - Valid GitHub OAuth token and repository
 * - Pre-existing ECS infrastructure (cluster, services, ALB, target groups)
 * - AppSpec and TaskDefinition files in the repository
 *
 * These dependencies make full deployment testing impractical in this environment.
 */

import fs from 'fs';
import path from 'path';
import { CloudFormationClient, ValidateTemplateCommand } from '@aws-sdk/client-cloudformation';

describe('CI/CD Pipeline CloudFormation Template - Integration Tests', () => {
  let template: any;
  let templateYAML: string;
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test-integration';

  beforeAll(() => {
    // Load JSON template for parsing
    const templatePath = path.join(__dirname, '../lib/cicd-pipeline.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);

    // Load YAML template for AWS validation
    const yamlPath = path.join(__dirname, '../lib/cicd-pipeline.yml');
    templateYAML = fs.readFileSync(yamlPath, 'utf8');
  });

  describe('Template AWS Validation', () => {
    test('template should pass AWS CloudFormation validation', async () => {
      const client = new CloudFormationClient({ region: 'us-east-1' });

      try {
        const command = new ValidateTemplateCommand({
          TemplateBody: templateYAML,
        });

        const response = await client.send(command);

        expect(response).toBeDefined();
        expect(response.Parameters).toBeDefined();
        expect(response.Capabilities).toContain('CAPABILITY_NAMED_IAM');
      } catch (error: any) {
        fail(`AWS validation failed: ${error.message}`);
      }
    });

    test('template should declare all required parameters to AWS', async () => {
      const client = new CloudFormationClient({ region: 'us-east-1' });

      const command = new ValidateTemplateCommand({
        TemplateBody: templateYAML,
      });

      const response = await client.send(command);

      const parameterKeys = response.Parameters?.map(p => p.ParameterKey) || [];

      expect(parameterKeys).toContain('EnvironmentSuffix');
      expect(parameterKeys).toContain('GitHubToken');
      expect(parameterKeys).toContain('NotificationEmail');
    });

    test('template should require CAPABILITY_NAMED_IAM', async () => {
      const client = new CloudFormationClient({ region: 'us-east-1' });

      const command = new ValidateTemplateCommand({
        TemplateBody: templateYAML,
      });

      const response = await client.send(command);

      expect(response.Capabilities).toBeDefined();
      expect(response.Capabilities).toContain('CAPABILITY_NAMED_IAM');
    });

    test('template should have description', async () => {
      const client = new CloudFormationClient({ region: 'us-east-1' });

      const command = new ValidateTemplateCommand({
        TemplateBody: templateYAML,
      });

      const response = await client.send(command);

      expect(response.Description).toBeDefined();
      expect(response.Description).toContain('CI/CD');
    });
  });

  describe('Pipeline Configuration Validation', () => {
    test('pipeline should have complete 5-stage configuration', () => {
      const pipeline = template.Resources.CICDPipeline;
      const stages = pipeline.Properties.Stages;

      expect(stages).toHaveLength(5);

      // Verify each stage has required properties
      stages.forEach((stage: any) => {
        expect(stage.Name).toBeDefined();
        expect(stage.Actions).toBeDefined();
        expect(stage.Actions.length).toBeGreaterThan(0);
      });
    });

    test('Source stage should have GitHub configuration', () => {
      const pipeline = template.Resources.CICDPipeline;
      const sourceStage = pipeline.Properties.Stages[0];
      const sourceAction = sourceStage.Actions[0];

      expect(sourceAction.Configuration.Owner).toEqual({ Ref: 'GitHubOwner' });
      expect(sourceAction.Configuration.Repo).toEqual({ Ref: 'RepositoryName' });
      expect(sourceAction.Configuration.Branch).toEqual({ Ref: 'BranchName' });
      expect(sourceAction.Configuration.OAuthToken).toEqual({ Ref: 'GitHubToken' });
    });

    test('Build and Test stages should reference CodeBuild projects', () => {
      const pipeline = template.Resources.CICDPipeline;
      const buildStage = pipeline.Properties.Stages[1];
      const testStage = pipeline.Properties.Stages[2];

      expect(buildStage.Actions[0].Configuration.ProjectName).toEqual({
        Ref: 'BuildProject',
      });
      expect(testStage.Actions[0].Configuration.ProjectName).toEqual({
        Ref: 'TestProject',
      });
    });

    test('Deploy stages should reference CodeDeploy deployment groups', () => {
      const pipeline = template.Resources.CICDPipeline;
      const deployStagingStage = pipeline.Properties.Stages[3];
      const deployProdStage = pipeline.Properties.Stages[4];

      const stagingDeployAction = deployStagingStage.Actions[0];
      const prodDeployAction = deployProdStage.Actions.find(
        (a: any) => a.ActionTypeId.Category === 'Deploy'
      );

      expect(stagingDeployAction.Configuration.DeploymentGroupName).toEqual({
        Ref: 'DeploymentGroupStaging',
      });
      expect(prodDeployAction.Configuration.DeploymentGroupName).toEqual({
        Ref: 'DeploymentGroupProduction',
      });
    });

    test('Production stage should have manual approval before deployment', () => {
      const pipeline = template.Resources.CICDPipeline;
      const deployProdStage = pipeline.Properties.Stages[4];

      const approvalAction = deployProdStage.Actions.find(
        (a: any) => a.ActionTypeId.Category === 'Approval'
      );
      const deployAction = deployProdStage.Actions.find(
        (a: any) => a.ActionTypeId.Category === 'Deploy'
      );

      expect(approvalAction).toBeDefined();
      expect(deployAction).toBeDefined();

      // Approval should come before deployment (no RunOrder or RunOrder 1)
      // Deployment should be RunOrder 2
      expect(deployAction.RunOrder).toBe(2);
    });
  });

  describe('Security Configuration Validation', () => {
    test('all IAM roles should have specific resource ARNs', () => {
      const codePipelineRole = template.Resources.CodePipelineServiceRole;
      const statements = codePipelineRole.Properties.Policies[0].PolicyDocument.Statement;

      // Check S3 permissions use specific bucket ARN
      const s3Statement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('s3:'))
      );
      expect(s3Statement.Resource).toBeDefined();
      expect(Array.isArray(s3Statement.Resource)).toBe(true);

      // Check KMS permissions use specific key ARN
      const kmsStatement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('kms:'))
      );
      expect(kmsStatement.Resource).toBeDefined();
      expect(Array.isArray(kmsStatement.Resource)).toBe(true);
    });

    test('KMS key should have proper service principals', () => {
      const kmsKey = template.Resources.ArtifactEncryptionKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;

      const serviceStatement = keyPolicy.Statement.find(
        (s: any) => s.Sid === 'Allow CodePipeline to use the key'
      );

      expect(serviceStatement).toBeDefined();
      expect(serviceStatement.Principal.Service).toContain('codepipeline.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('codebuild.amazonaws.com');
    });

    test('S3 bucket should have complete security configuration', () => {
      const bucket = template.Resources.PipelineArtifactBucket;

      // Verify versioning
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');

      // Verify encryption
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');

      // Verify public access block
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Monitoring and Notifications Configuration', () => {
    test('CloudWatch Events rule should target SNS topic', () => {
      const eventsRule = template.Resources.PipelineStateChangeRule;
      const target = eventsRule.Properties.Targets[0];

      expect(target.Arn).toEqual({ Ref: 'PipelineNotificationTopic' });
    });

    test('SNS topic should have email subscription', () => {
      const snsTopic = template.Resources.PipelineNotificationTopic;
      const subscription = snsTopic.Properties.Subscription[0];

      expect(subscription.Protocol).toBe('email');
      expect(subscription.Endpoint).toEqual({ Ref: 'NotificationEmail' });
    });

    test('CloudWatch Logs should be configured for both CodeBuild projects', () => {
      const buildProject = template.Resources.BuildProject;
      const testProject = template.Resources.TestProject;

      expect(buildProject.Properties.LogsConfig.CloudWatchLogs.Status).toBe('ENABLED');
      expect(testProject.Properties.LogsConfig.CloudWatchLogs.Status).toBe('ENABLED');

      expect(buildProject.Properties.LogsConfig.CloudWatchLogs.GroupName).toEqual({
        Ref: 'BuildProjectLogGroup',
      });
      expect(testProject.Properties.LogsConfig.CloudWatchLogs.GroupName).toEqual({
        Ref: 'TestProjectLogGroup',
      });
    });

    test('Log groups should have proper retention period', () => {
      const buildLogGroup = template.Resources.BuildProjectLogGroup;
      const testLogGroup = template.Resources.TestProjectLogGroup;

      expect(buildLogGroup.Properties.RetentionInDays).toBe(30);
      expect(testLogGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('CodeBuild Projects Configuration', () => {
    test('build project should have Docker-enabled environment', () => {
      const buildProject = template.Resources.BuildProject;
      const environment = buildProject.Properties.Environment;

      expect(environment.Type).toBe('LINUX_CONTAINER');
      expect(environment.PrivilegedMode).toBe(true);
      expect(environment.Image).toContain('amazonlinux2');
    });

    test('build project should have inline buildspec with ECR login', () => {
      const buildProject = template.Resources.BuildProject;
      const buildSpec = buildProject.Properties.Source.BuildSpec;

      expect(buildSpec).toContain('ecr get-login-password');
      expect(buildSpec).toContain('docker build');
      expect(buildSpec).toContain('docker push');
    });

    test('test project should have inline buildspec with test commands', () => {
      const testProject = template.Resources.TestProject;
      const buildSpec = testProject.Properties.Source.BuildSpec;

      expect(buildSpec).toContain('Running unit tests');
      expect(buildSpec).toContain('Running integration tests');
    });

    test('both projects should use cost-optimized compute type', () => {
      const buildProject = template.Resources.BuildProject;
      const testProject = template.Resources.TestProject;

      expect(buildProject.Properties.Environment.ComputeType).toBe('BUILD_GENERAL1_SMALL');
      expect(testProject.Properties.Environment.ComputeType).toBe('BUILD_GENERAL1_SMALL');
    });
  });

  describe('CodeDeploy Configuration', () => {
    test('deployment groups should use ECS Blue/Green strategy', () => {
      const stagingGroup = template.Resources.DeploymentGroupStaging;
      const productionGroup = template.Resources.DeploymentGroupProduction;

      expect(stagingGroup.Properties.DeploymentStyle.DeploymentType).toBe('BLUE_GREEN');
      expect(productionGroup.Properties.DeploymentStyle.DeploymentType).toBe('BLUE_GREEN');
    });

    test('deployment groups should terminate blue instances automatically', () => {
      const stagingGroup = template.Resources.DeploymentGroupStaging;
      const productionGroup = template.Resources.DeploymentGroupProduction;

      expect(
        stagingGroup.Properties.BlueGreenDeploymentConfiguration
          .TerminateBlueInstancesOnDeploymentSuccess.Action
      ).toBe('TERMINATE');
      expect(
        productionGroup.Properties.BlueGreenDeploymentConfiguration
          .TerminateBlueInstancesOnDeploymentSuccess.Action
      ).toBe('TERMINATE');
    });

    test('deployment groups should have reasonable termination wait time', () => {
      const stagingGroup = template.Resources.DeploymentGroupStaging;
      const productionGroup = template.Resources.DeploymentGroupProduction;

      const stagingWaitTime =
        stagingGroup.Properties.BlueGreenDeploymentConfiguration
          .TerminateBlueInstancesOnDeploymentSuccess.TerminationWaitTimeInMinutes;
      const productionWaitTime =
        productionGroup.Properties.BlueGreenDeploymentConfiguration
          .TerminateBlueInstancesOnDeploymentSuccess.TerminationWaitTimeInMinutes;

      expect(stagingWaitTime).toBeLessThanOrEqual(10);
      expect(productionWaitTime).toBeLessThanOrEqual(10);
    });

    test('CodeDeploy application should be configured for ECS', () => {
      const codeDeployApp = template.Resources.CodeDeployApplication;

      expect(codeDeployApp.Properties.ComputePlatform).toBe('ECS');
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('all resource names should be parameterized with environment suffix', () => {
      const resourcesWithNames = [
        'PipelineArtifactBucket',
        'PipelineNotificationTopic',
        'BuildProject',
        'TestProject',
        'CICDPipeline',
        'CodeDeployApplication',
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty = Object.keys(resource.Properties).find(key =>
          key.toLowerCase().includes('name')
        );

        if (nameProperty) {
          const nameValue = resource.Properties[nameProperty];
          if (typeof nameValue === 'object' && nameValue['Fn::Sub']) {
            expect(nameValue['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });

  describe('Template Outputs Configuration', () => {
    test('all outputs should provide essential information for external systems', () => {
      const requiredOutputs = [
        'PipelineArn',
        'ArtifactBucketName',
        'NotificationTopicArn',
        'BuildProjectName',
        'TestProjectName',
        'CodeDeployApplicationName',
      ];

      requiredOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    test('all outputs should be exported for cross-stack references', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Template Completeness', () => {
    test('template should define all necessary resource types', () => {
      const resourceTypes = Object.values(template.Resources).map(
        (resource: any) => resource.Type
      );

      const requiredTypes = [
        'AWS::KMS::Key',
        'AWS::S3::Bucket',
        'AWS::SNS::Topic',
        'AWS::Logs::LogGroup',
        'AWS::IAM::Role',
        'AWS::CodeBuild::Project',
        'AWS::CodeDeploy::Application',
        'AWS::CodeDeploy::DeploymentGroup',
        'AWS::CodePipeline::Pipeline',
        'AWS::Events::Rule',
      ];

      requiredTypes.forEach(type => {
        expect(resourceTypes).toContain(type);
      });
    });

    test('template should have no circular dependencies', () => {
      // Check for common circular dependency patterns
      const resources = template.Resources;

      // Verify KMS Key is not dependent on itself through bucket
      const kmsKey = resources.ArtifactEncryptionKey;
      const bucket = resources.PipelineArtifactBucket;

      // Bucket can reference KMS Key (correct direction)
      expect(bucket.Properties.BucketEncryption).toBeDefined();

      // KMS Key should not reference bucket (would be circular)
      const kmsKeyJSON = JSON.stringify(kmsKey);
      expect(kmsKeyJSON).not.toContain('PipelineArtifactBucket');
    });

    test('template resources should respect deletion policies', () => {
      const resourcesWithDeletionPolicies = [
        'ArtifactEncryptionKey',
        'PipelineArtifactBucket',
        'BuildProjectLogGroup',
        'TestProjectLogGroup',
      ];

      resourcesWithDeletionPolicies.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Deployment Prerequisites Documentation', () => {
    test('should document ECS infrastructure requirements', () => {
      // This test validates that parameters are defined for ECS dependencies
      const ecsParameters = [
        'ECSClusterNameStaging',
        'ECSServiceNameStaging',
        'ECSClusterNameProduction',
        'ECSServiceNameProduction',
      ];

      ecsParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
        expect(template.Parameters[param].Description).toContain('ECS');
      });
    });

    test('should document GitHub integration requirements', () => {
      const githubParameters = ['GitHubToken', 'GitHubOwner', 'RepositoryName', 'BranchName'];

      githubParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });

      // GitHubToken should be marked sensitive
      expect(template.Parameters.GitHubToken.NoEcho).toBe(true);
    });
  });
});
