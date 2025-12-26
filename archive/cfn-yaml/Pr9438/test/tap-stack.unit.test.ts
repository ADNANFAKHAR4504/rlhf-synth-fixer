import fs from 'fs';
import path from 'path';

describe('TapStack CI/CD Pipeline CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toBe(
        'Secure and scalable CI/CD pipeline for EC2 deployment with least privilege access'
      );
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('S3 Resources', () => {
    test('should define artifacts bucket with security configurations', () => {
      const bucket = template.Resources.ProdArtifactsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName['Fn::Sub']).toBe(
        'prod-cicd-artifacts-${AWS::AccountId}-${AWS::Region}'
      );
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('should block all public access on artifacts bucket', () => {
      const bucket = template.Resources.ProdArtifactsBucket;
      const publicAccessConfig =
        bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('should enable versioning and lifecycle policies', () => {
      const bucket = template.Resources.ProdArtifactsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].Id).toBe(
        'DeleteOldVersions'
      );
      expect(
        bucket.Properties.LifecycleConfiguration.Rules[0]
          .NoncurrentVersionExpirationInDays
      ).toBe(30);
    });
  });

  describe('SNS Notifications', () => {
    test('should define SNS topic for CI/CD notifications', () => {
      const topic = template.Resources.ProdCicdNotificationsTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.TopicName).toBe('prod-cicd-notifications');
      expect(topic.Properties.DisplayName).toBe(
        'Production CI/CD Pipeline Notifications'
      );
    });
  });

  describe('IAM Roles', () => {
    test('should define CodePipeline service role with correct assume role policy', () => {
      const role = template.Resources.ProdCodePipelineServiceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName).toBe('prod-codepipeline-service-role');
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
      ).toBe('codepipeline.amazonaws.com');
    });

    test('should define CodeBuild service role with correct permissions', () => {
      const role = template.Resources.ProdCodeBuildServiceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName).toBe('prod-codebuild-service-role');
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
      ).toBe('codebuild.amazonaws.com');
      expect(role.Properties.Policies[0].PolicyName).toBe(
        'ProdCodeBuildServicePolicy'
      );
    });

    test('should define CodeDeploy service role with inline policy', () => {
      const role = template.Resources.ProdCodeDeployServiceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName).toBe('prod-codedeploy-service-role');
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
      ).toBe('codedeploy.amazonaws.com');
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies[0].PolicyName).toBe(
        'ProdCodeDeployServicePolicy'
      );
    });

    test('should define EC2 instance role for CodeDeploy agent', () => {
      const role = template.Resources.ProdEc2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
      ).toBe('ec2.amazonaws.com');
    });
  });

  describe('EC2 Instance Profile', () => {
    test('should define instance profile linked to EC2 role', () => {
      const profile = template.Resources.ProdEc2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.InstanceProfileName).toBe(
        'prod-ec2-codedeploy-profile'
      );
      expect(profile.Properties.Roles[0].Ref).toBe('ProdEc2InstanceRole');
    });
  });

  describe('CodeBuild Project', () => {
    test('should define CodeBuild project with correct configuration', () => {
      const project = template.Resources.ProdCodeBuildProject;
      expect(project).toBeDefined();
      expect(project.Type).toBe('AWS::CodeBuild::Project');
      expect(project.Properties.Name).toBe('prod-build-project');
      expect(project.Properties.Environment.Type).toBe('LINUX_CONTAINER');
      expect(project.Properties.TimeoutInMinutes).toBe(15);
    });

    test('should have environment variables and build spec', () => {
      const project = template.Resources.ProdCodeBuildProject;
      const envVars = project.Properties.Environment.EnvironmentVariables;
      expect(
        envVars.find((v: any) => v.Name === 'AWS_DEFAULT_REGION')
      ).toBeDefined();
      expect(
        envVars.find((v: any) => v.Name === 'AWS_ACCOUNT_ID')
      ).toBeDefined();
      expect(project.Properties.Source.BuildSpec).toContain('version: 0.2');
    });
  });

  describe('CodeDeploy Resources', () => {
    test('should define CodeDeploy application', () => {
      const app = template.Resources.ProdCodeDeployApplication;
      expect(app).toBeDefined();
      expect(app.Type).toBe('AWS::CodeDeploy::Application');
      expect(app.Properties.ApplicationName).toBe(
        'prod-deployment-application'
      );
      expect(app.Properties.ComputePlatform).toBe('Server');
    });

    test('should define deployment group with auto-rollback', () => {
      const deploymentGroup = template.Resources.ProdCodeDeployDeploymentGroup;
      expect(deploymentGroup).toBeDefined();
      expect(deploymentGroup.Type).toBe('AWS::CodeDeploy::DeploymentGroup');
      expect(deploymentGroup.Properties.DeploymentConfigName).toBe(
        'CodeDeployDefault.AllAtOnce'
      );
      expect(deploymentGroup.Properties.AutoRollbackConfiguration.Enabled).toBe(
        true
      );
    });

    test('should have EC2 tag filters for deployment targets', () => {
      const deploymentGroup = template.Resources.ProdCodeDeployDeploymentGroup;
      const tagFilters = deploymentGroup.Properties.Ec2TagFilters;
      expect(tagFilters).toHaveLength(2);
      expect(tagFilters[0].Key).toBe('Environment');
      expect(tagFilters[0].Value).toBe('Production');
      expect(tagFilters[1].Key).toBe('Application');
      expect(tagFilters[1].Value).toBe('prod-cicd-target');
    });
  });

  describe('CodePipeline', () => {
    test('should define pipeline with multiple stages', () => {
      const pipeline = template.Resources.ProdCodePipeline;
      expect(pipeline).toBeDefined();
      expect(pipeline.Type).toBe('AWS::CodePipeline::Pipeline');
      expect(pipeline.Properties.Name).toBe('prod-cicd-pipeline');
      expect(pipeline.Properties.Stages).toHaveLength(4);
    });

    test('should have Source, Build, ManualApproval, and Deploy stages', () => {
      const pipeline = template.Resources.ProdCodePipeline;
      const stageNames = pipeline.Properties.Stages.map((s: any) => s.Name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('ManualApproval');
      expect(stageNames).toContain('Deploy');
    });

    test('should use S3 artifact store', () => {
      const pipeline = template.Resources.ProdCodePipeline;
      expect(pipeline.Properties.ArtifactStore.Type).toBe('S3');
      expect(pipeline.Properties.ArtifactStore.Location.Ref).toBe(
        'ProdArtifactsBucket'
      );
    });
  });

  describe('IAM Policy Permissions', () => {
    test('CodePipeline role should have service permissions', () => {
      const role = template.Resources.ProdCodePipelineServiceRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const actions = policy.Statement.flatMap((s: any) => s.Action);
      // Template uses wildcard permissions for simplicity
      expect(actions).toContain('s3:*');
      expect(actions).toContain('codebuild:*');
      expect(actions).toContain('codedeploy:*');
      expect(actions).toContain('sns:*');
    });

    test('CodeBuild role should have CloudWatch Logs and S3 permissions', () => {
      const role = template.Resources.ProdCodeBuildServiceRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const actions = policy.Statement.flatMap((s: any) => s.Action);
      expect(actions).toContain('logs:*');
      expect(actions).toContain('s3:*');
    });

    test('EC2 role should have S3 and CloudWatch access', () => {
      const role = template.Resources.ProdEc2InstanceRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const actions = policy.Statement.flatMap((s: any) => s.Action);
      expect(actions).toContain('s3:*');
      expect(actions).toContain('logs:*');
    });
  });

  describe('Outputs', () => {
    test('should export all pipeline components', () => {
      const outputs = template.Outputs;
      expect(outputs.PipelineName).toBeDefined();
      expect(outputs.ArtifactsBucket).toBeDefined();
      expect(outputs.NotificationsTopic).toBeDefined();
      expect(outputs.CodeDeployApplication).toBeDefined();
      expect(outputs.Ec2InstanceProfile).toBeDefined();
    });

    test('should have correct export names following convention', () => {
      const outputs = template.Outputs;
      Object.keys(outputs).forEach(key => {
        const output = outputs[key];
        expect(output.Export.Name['Fn::Sub']).toMatch(/^\${AWS::StackName}-/);
      });
    });

    test('should reference correct resources in output values', () => {
      const outputs = template.Outputs;
      expect(outputs.PipelineName.Value.Ref).toBe('ProdCodePipeline');
      expect(outputs.ArtifactsBucket.Value.Ref).toBe('ProdArtifactsBucket');
      expect(outputs.NotificationsTopic.Value.Ref).toBe(
        'ProdCicdNotificationsTopic'
      );
      expect(outputs.CodeDeployApplication.Value.Ref).toBe(
        'ProdCodeDeployApplication'
      );
      expect(outputs.Ec2InstanceProfile.Value.Ref).toBe(
        'ProdEc2InstanceProfile'
      );
    });
  });

  describe('Security Best Practices', () => {
    test('should use IAM policies with defined permissions', () => {
      const roles = [
        template.Resources.ProdCodePipelineServiceRole,
        template.Resources.ProdCodeBuildServiceRole,
        template.Resources.ProdEc2InstanceRole,
      ];

      roles.forEach(role => {
        expect(role.Properties.Policies).toBeDefined();
        role.Properties.Policies.forEach((policy: any) => {
          expect(policy.PolicyDocument.Statement).toBeDefined();
          policy.PolicyDocument.Statement.forEach((statement: any) => {
            expect(statement.Effect).toBe('Allow');
            expect(statement.Action).toBeDefined();
            expect(statement.Resource).toBeDefined();
          });
        });
      });
    });

    test('should enforce secure S3 bucket configuration', () => {
      const bucket = template.Resources.ProdArtifactsBucket;
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets
      ).toBe(true);
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
  });

  describe('Template Validation', () => {
    test('should have all required CloudFormation sections', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      // Template has 11 resources (no CloudWatch Event Rules for LocalStack compatibility)
      expect(Object.keys(template.Resources)).toHaveLength(11);
      expect(Object.keys(template.Outputs)).toHaveLength(5);
    });

    test('should have valid resource types and properties', () => {
      const expectedResourceTypes = {
        ProdArtifactsBucket: 'AWS::S3::Bucket',
        ProdCicdNotificationsTopic: 'AWS::SNS::Topic',
        ProdCodePipelineServiceRole: 'AWS::IAM::Role',
        ProdCodeBuildServiceRole: 'AWS::IAM::Role',
        ProdCodeDeployServiceRole: 'AWS::IAM::Role',
        ProdEc2InstanceRole: 'AWS::IAM::Role',
        ProdEc2InstanceProfile: 'AWS::IAM::InstanceProfile',
        ProdCodeBuildProject: 'AWS::CodeBuild::Project',
        ProdCodeDeployApplication: 'AWS::CodeDeploy::Application',
        ProdCodeDeployDeploymentGroup: 'AWS::CodeDeploy::DeploymentGroup',
        ProdCodePipeline: 'AWS::CodePipeline::Pipeline',
      };

      Object.entries(expectedResourceTypes).forEach(([logicalId, type]) => {
        expect(template.Resources[logicalId]).toBeDefined();
        expect(template.Resources[logicalId].Type).toBe(type);
      });
    });
  });
});
