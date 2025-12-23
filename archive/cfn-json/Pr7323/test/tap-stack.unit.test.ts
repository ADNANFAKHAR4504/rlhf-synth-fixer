import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('CI/CD Pipeline CloudFormation Template', () => {
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
      expect(template.Description).toContain('CI/CD Pipeline');
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Description).toContain('suffix');
    });

    test('should have RepositoryName parameter', () => {
      expect(template.Parameters.RepositoryName).toBeDefined();
      const param = template.Parameters.RepositoryName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('my-app');
    });

    test('should have BranchName parameter', () => {
      expect(template.Parameters.BranchName).toBeDefined();
      const param = template.Parameters.BranchName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('main');
    });

    test('should have StagingAccountId parameter', () => {
      expect(template.Parameters.StagingAccountId).toBeDefined();
      const param = template.Parameters.StagingAccountId;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('123456789012');
    });

    test('should have ProductionAccountId parameter', () => {
      expect(template.Parameters.ProductionAccountId).toBeDefined();
      const param = template.Parameters.ProductionAccountId;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('987654321098');
    });

    test('should have exactly 5 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5);
    });
  });

  describe('CodeCommit Repository', () => {
    test('should exist and be properly configured', () => {
      const repo = template.Resources.CodeCommitRepository;
      expect(repo).toBeDefined();
      expect(repo.Type).toBe('AWS::CodeCommit::Repository');
      expect(repo.DeletionPolicy).toBe('Delete');
    });

    test('should use environmentSuffix in name', () => {
      const repo = template.Resources.CodeCommitRepository;
      expect(repo.Properties.RepositoryName).toEqual({
        'Fn::Sub': '${RepositoryName}-${EnvironmentSuffix}',
      });
    });

    test('should have proper tags', () => {
      const repo = template.Resources.CodeCommitRepository;
      expect(repo.Properties.Tags).toBeDefined();
      expect(Array.isArray(repo.Properties.Tags)).toBe(true);
    });
  });

  describe('ECR Repository', () => {
    test('should exist and be properly configured', () => {
      const ecr = template.Resources.ECRRepository;
      expect(ecr).toBeDefined();
      expect(ecr.Type).toBe('AWS::ECR::Repository');
      expect(ecr.DeletionPolicy).toBe('Delete');
    });

    test('should use environmentSuffix in name', () => {
      const ecr = template.Resources.ECRRepository;
      expect(ecr.Properties.RepositoryName).toEqual({
        'Fn::Sub': 'app-repo-${EnvironmentSuffix}',
      });
    });

    test('should have encryption enabled', () => {
      const ecr = template.Resources.ECRRepository;
      expect(ecr.Properties.EncryptionConfiguration).toBeDefined();
      expect(ecr.Properties.EncryptionConfiguration.EncryptionType).toBe('AES256');
    });

    test('should have image scanning enabled', () => {
      const ecr = template.Resources.ECRRepository;
      expect(ecr.Properties.ImageScanningConfiguration).toBeDefined();
      expect(ecr.Properties.ImageScanningConfiguration.ScanOnPush).toBe(true);
    });

    test('should have lifecycle policy', () => {
      const ecr = template.Resources.ECRRepository;
      expect(ecr.Properties.LifecyclePolicy).toBeDefined();
      expect(ecr.Properties.LifecyclePolicy.LifecyclePolicyText).toBeDefined();
    });
  });

  describe('S3 Artifact Bucket', () => {
    test('should exist and be properly configured', () => {
      const bucket = template.Resources.ArtifactBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    test('should use environmentSuffix in name', () => {
      const bucket = template.Resources.ArtifactBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'pipeline-artifacts-${EnvironmentSuffix}-${AWS::AccountId}',
      });
    });

    test('should have encryption enabled', () => {
      const bucket = template.Resources.ArtifactBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should block public access', () => {
      const bucket = template.Resources.ArtifactBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have versioning enabled', () => {
      const bucket = template.Resources.ArtifactBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have lifecycle rules', () => {
      const bucket = template.Resources.ArtifactBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      expect(Array.isArray(bucket.Properties.LifecycleConfiguration.Rules)).toBe(true);
    });
  });

  describe('IAM Roles', () => {
    test('CodePipeline service role should exist', () => {
      const role = template.Resources.CodePipelineServiceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('CodePipeline role should use environmentSuffix in name', () => {
      const role = template.Resources.CodePipelineServiceRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'codepipeline-service-role-${EnvironmentSuffix}',
      });
    });

    test('CodePipeline role should have correct trust policy', () => {
      const role = template.Resources.CodePipelineServiceRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('codepipeline.amazonaws.com');
    });

    test('CodeBuild service role should exist', () => {
      const role = template.Resources.CodeBuildServiceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('CodeBuild role should use environmentSuffix in name', () => {
      const role = template.Resources.CodeBuildServiceRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'codebuild-service-role-${EnvironmentSuffix}',
      });
    });

    test('CodeDeploy service role should exist', () => {
      const role = template.Resources.CodeDeployServiceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('CodeDeploy role should use correct managed policy', () => {
      const role = template.Resources.CodeDeployServiceRole;
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSCodeDeployRole'
      );
    });

    test('Pipeline event role should exist', () => {
      const role = template.Resources.PipelineEventRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('CodeBuild Project', () => {
    test('should exist and be properly configured', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project).toBeDefined();
      expect(project.Type).toBe('AWS::CodeBuild::Project');
      expect(project.DeletionPolicy).toBe('Delete');
    });

    test('should use environmentSuffix in name', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Properties.Name).toEqual({
        'Fn::Sub': 'build-project-${EnvironmentSuffix}',
      });
    });

    test('should use BUILD_GENERAL1_SMALL compute type', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Properties.Environment.ComputeType).toBe('BUILD_GENERAL1_SMALL');
    });

    test('should have privileged mode enabled for Docker', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Properties.Environment.PrivilegedMode).toBe(true);
    });

    test('should have CloudWatch logs configured', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Properties.LogsConfig).toBeDefined();
      expect(project.Properties.LogsConfig.CloudWatchLogs.Status).toBe('ENABLED');
    });

    test('should have buildspec defined', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Properties.Source.BuildSpec).toBeDefined();
      expect(project.Properties.Source.BuildSpec).toContain('version: 0.2');
    });

    test('should have environment variables', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Properties.Environment.EnvironmentVariables).toBeDefined();
      expect(Array.isArray(project.Properties.Environment.EnvironmentVariables)).toBe(true);
      expect(project.Properties.Environment.EnvironmentVariables.length).toBeGreaterThan(0);
    });
  });

  describe('CodeDeploy Application', () => {
    test('should exist and be properly configured', () => {
      const app = template.Resources.CodeDeployApplication;
      expect(app).toBeDefined();
      expect(app.Type).toBe('AWS::CodeDeploy::Application');
      expect(app.DeletionPolicy).toBe('Delete');
    });

    test('should use environmentSuffix in name', () => {
      const app = template.Resources.CodeDeployApplication;
      expect(app.Properties.ApplicationName).toEqual({
        'Fn::Sub': 'app-deployment-${EnvironmentSuffix}',
      });
    });

    test('should use Server compute platform', () => {
      const app = template.Resources.CodeDeployApplication;
      expect(app.Properties.ComputePlatform).toBe('Server');
    });
  });

  describe('CodeDeploy Deployment Groups', () => {
    test('staging deployment group should exist', () => {
      const group = template.Resources.StagingDeploymentGroup;
      expect(group).toBeDefined();
      expect(group.Type).toBe('AWS::CodeDeploy::DeploymentGroup');
      expect(group.DeletionPolicy).toBe('Delete');
    });

    test('staging deployment group should use environmentSuffix in name', () => {
      const group = template.Resources.StagingDeploymentGroup;
      expect(group.Properties.DeploymentGroupName).toEqual({
        'Fn::Sub': 'staging-deployment-group-${EnvironmentSuffix}',
      });
    });

    test('staging deployment group should have auto rollback enabled', () => {
      const group = template.Resources.StagingDeploymentGroup;
      expect(group.Properties.AutoRollbackConfiguration.Enabled).toBe(true);
    });

    test('production deployment group should exist', () => {
      const group = template.Resources.ProductionDeploymentGroup;
      expect(group).toBeDefined();
      expect(group.Type).toBe('AWS::CodeDeploy::DeploymentGroup');
      expect(group.DeletionPolicy).toBe('Delete');
    });

    test('production deployment group should use environmentSuffix in name', () => {
      const group = template.Resources.ProductionDeploymentGroup;
      expect(group.Properties.DeploymentGroupName).toEqual({
        'Fn::Sub': 'production-deployment-group-${EnvironmentSuffix}',
      });
    });
  });

  describe('SNS Topic', () => {
    test('should exist and be properly configured', () => {
      const topic = template.Resources.PipelineSNSTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.DeletionPolicy).toBe('Delete');
    });

    test('should use environmentSuffix in name', () => {
      const topic = template.Resources.PipelineSNSTopic;
      expect(topic.Properties.TopicName).toEqual({
        'Fn::Sub': 'pipeline-notifications-${EnvironmentSuffix}',
      });
    });

    test('should have topic policy', () => {
      const policy = template.Resources.SNSTopicPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::SNS::TopicPolicy');
    });
  });

  describe('CodePipeline', () => {
    test('should exist and be properly configured', () => {
      const pipeline = template.Resources.Pipeline;
      expect(pipeline).toBeDefined();
      expect(pipeline.Type).toBe('AWS::CodePipeline::Pipeline');
      expect(pipeline.DeletionPolicy).toBe('Delete');
    });

    test('should use environmentSuffix in name', () => {
      const pipeline = template.Resources.Pipeline;
      expect(pipeline.Properties.Name).toEqual({
        'Fn::Sub': 'cicd-pipeline-${EnvironmentSuffix}',
      });
    });

    test('should have 5 stages', () => {
      const pipeline = template.Resources.Pipeline;
      expect(pipeline.Properties.Stages).toBeDefined();
      expect(pipeline.Properties.Stages).toHaveLength(5);
    });

    test('should have Source stage', () => {
      const pipeline = template.Resources.Pipeline;
      const sourceStage = pipeline.Properties.Stages[0];
      expect(sourceStage.Name).toBe('Source');
      expect(sourceStage.Actions[0].ActionTypeId.Provider).toBe('CodeCommit');
    });

    test('should have Build stage', () => {
      const pipeline = template.Resources.Pipeline;
      const buildStage = pipeline.Properties.Stages[1];
      expect(buildStage.Name).toBe('Build');
      expect(buildStage.Actions[0].ActionTypeId.Provider).toBe('CodeBuild');
    });

    test('should have DeployToStaging stage', () => {
      const pipeline = template.Resources.Pipeline;
      const stagingStage = pipeline.Properties.Stages[2];
      expect(stagingStage.Name).toBe('DeployToStaging');
      expect(stagingStage.Actions[0].ActionTypeId.Provider).toBe('CodeDeploy');
    });

    test('should have ManualApproval stage', () => {
      const pipeline = template.Resources.Pipeline;
      const approvalStage = pipeline.Properties.Stages[3];
      expect(approvalStage.Name).toBe('ManualApproval');
      expect(approvalStage.Actions[0].ActionTypeId.Provider).toBe('Manual');
    });

    test('should have DeployToProduction stage', () => {
      const pipeline = template.Resources.Pipeline;
      const prodStage = pipeline.Properties.Stages[4];
      expect(prodStage.Name).toBe('DeployToProduction');
      expect(prodStage.Actions[0].ActionTypeId.Provider).toBe('CodeDeploy');
    });

    test('should have artifact store configured', () => {
      const pipeline = template.Resources.Pipeline;
      expect(pipeline.Properties.ArtifactStore).toBeDefined();
      expect(pipeline.Properties.ArtifactStore.Type).toBe('S3');
    });
  });

  describe('CloudWatch Events', () => {
    test('pipeline trigger rule should exist', () => {
      const rule = template.Resources.PipelineEventRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Events::Rule');
    });

    test('pipeline trigger rule should use environmentSuffix in name', () => {
      const rule = template.Resources.PipelineEventRule;
      expect(rule.Properties.Name).toEqual({
        'Fn::Sub': 'pipeline-trigger-${EnvironmentSuffix}',
      });
    });

    test('pipeline trigger rule should be enabled', () => {
      const rule = template.Resources.PipelineEventRule;
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('pipeline state change rule should exist', () => {
      const rule = template.Resources.PipelineStateChangeRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Events::Rule');
    });

    test('pipeline state change rule should monitor correct states', () => {
      const rule = template.Resources.PipelineStateChangeRule;
      const states = rule.Properties.EventPattern.detail.state;
      expect(states).toContain('STARTED');
      expect(states).toContain('SUCCEEDED');
      expect(states).toContain('FAILED');
    });
  });

  describe('CloudWatch Logs', () => {
    test('build log group should exist', () => {
      const logGroup = template.Resources.BuildLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.DeletionPolicy).toBe('Delete');
    });

    test('build log group should use environmentSuffix in name', () => {
      const logGroup = template.Resources.BuildLogGroup;
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/codebuild/build-project-${EnvironmentSuffix}',
      });
    });

    test('build log group should have retention policy', () => {
      const logGroup = template.Resources.BuildLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });
  });

  describe('Outputs', () => {
    test('should have PipelineArn output', () => {
      expect(template.Outputs.PipelineArn).toBeDefined();
      expect(template.Outputs.PipelineArn.Description).toContain('CodePipeline');
    });

    test('should have PipelineExecutionRoleArn output', () => {
      expect(template.Outputs.PipelineExecutionRoleArn).toBeDefined();
      expect(template.Outputs.PipelineExecutionRoleArn.Description).toContain('execution role');
    });

    test('should have CodeCommitRepositoryCloneUrlHttp output', () => {
      expect(template.Outputs.CodeCommitRepositoryCloneUrlHttp).toBeDefined();
    });

    test('should have ECRRepositoryUri output', () => {
      expect(template.Outputs.ECRRepositoryUri).toBeDefined();
    });

    test('should have ArtifactBucketName output', () => {
      expect(template.Outputs.ArtifactBucketName).toBeDefined();
    });

    test('should have SNSTopicArn output', () => {
      expect(template.Outputs.SNSTopicArn).toBeDefined();
    });

    test('should have CodeBuildProjectName output', () => {
      expect(template.Outputs.CodeBuildProjectName).toBeDefined();
    });

    test('should have CodeDeployApplicationName output', () => {
      expect(template.Outputs.CodeDeployApplicationName).toBeDefined();
    });

    test('should have exactly 8 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });
  });

  describe('Deletion Policies', () => {
    test('all deletable resources should have DeletionPolicy: Delete', () => {
      const resourcesWithDeletionPolicy = [
        'CodeCommitRepository',
        'ECRRepository',
        'ArtifactBucket',
        'CodeBuildProject',
        'CodeDeployApplication',
        'StagingDeploymentGroup',
        'ProductionDeploymentGroup',
        'PipelineSNSTopic',
        'Pipeline',
        'BuildLogGroup',
      ];

      resourcesWithDeletionPolicy.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Resource Count', () => {
    test('should have exactly 17 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(17);
    });
  });

  describe('EnvironmentSuffix Usage', () => {
    test('all named resources should use environmentSuffix', () => {
      const namedResources = [
        'CodeCommitRepository',
        'ECRRepository',
        'ArtifactBucket',
        'CodePipelineServiceRole',
        'CodeBuildServiceRole',
        'CodeBuildProject',
        'CodeDeployApplication',
        'CodeDeployServiceRole',
        'StagingDeploymentGroup',
        'ProductionDeploymentGroup',
        'PipelineSNSTopic',
        'Pipeline',
        'PipelineEventRule',
        'PipelineEventRole',
        'PipelineStateChangeRule',
        'BuildLogGroup',
      ];

      namedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty =
          resource.Properties.RepositoryName ||
          resource.Properties.BucketName ||
          resource.Properties.RoleName ||
          resource.Properties.Name ||
          resource.Properties.ApplicationName ||
          resource.Properties.DeploymentGroupName ||
          resource.Properties.TopicName ||
          resource.Properties.LogGroupName;

        if (nameProperty && typeof nameProperty === 'object' && nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Security Configuration', () => {
    test('S3 bucket should be properly secured', () => {
      const bucket = template.Resources.ArtifactBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
    });

    test('ECR repository should have encryption', () => {
      const ecr = template.Resources.ECRRepository;
      expect(ecr.Properties.EncryptionConfiguration).toBeDefined();
    });

    test('CodeBuild should have CloudWatch logs', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Properties.LogsConfig).toBeDefined();
    });
  });
});
