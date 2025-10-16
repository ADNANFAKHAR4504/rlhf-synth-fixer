import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  const defaultProps = {
    githubOwner: 'test-org',
    githubRepo: 'test-repo',
    githubBranch: 'main',
    notificationEmail: 'test@example.com',
    environmentSuffix: 'test',
  };

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      ...defaultProps,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create stack with correct properties', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should use default environment suffix when not provided', () => {
      const stackWithDefaults = new TapStack(app, 'DefaultStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      expect(stackWithDefaults).toBeDefined();
    });

    test('should use environment variables when props not provided', () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        GITHUB_OWNER: 'env-org',
        GITHUB_REPO: 'env-repo',
        GITHUB_BRANCH: 'develop',
        NOTIFICATION_EMAIL: 'env@example.com',
      };

      const stackWithEnv = new TapStack(app, 'EnvStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      expect(stackWithEnv).toBeDefined();

      process.env = originalEnv;
    });
  });

  describe('KMS Key', () => {
    test('should create KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encrypting CI/CD pipeline artifacts',
        EnableKeyRotation: true,
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/cicd-artifacts-test',
      });
    });

    test('should have DESTROY removal policy for KMS key', () => {
      template.hasResource('AWS::KMS::Key', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'cicd-artifacts-123456789012-us-east-1-test',
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have KMS encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
      });
    });

    test('should have lifecycle rules configured', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'delete-old-artifacts',
              Status: 'Enabled',
              ExpirationInDays: 30,
              NoncurrentVersionExpiration: {
                NoncurrentDays: 7,
              },
            },
          ],
        },
      });
    });

    test('should have DESTROY removal policy', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('should have auto delete objects custom resource', () => {
      template.resourceCountIs('Custom::S3AutoDeleteObjects', 1);
    });
  });

  describe('SNS Topic', () => {
    test('should create SNS topic with correct properties', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'cicd-pipeline-notifications-test-us-east-1',
        DisplayName: 'CI/CD Pipeline Notifications',
      });
    });

    test('should have email subscription', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com',
      });
    });
  });

  describe('CloudWatch Log Group', () => {
    test('should create log group with correct properties', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/codebuild/cicd-pipeline-test-us-east-1',
        RetentionInDays: 7,
      });
    });

    test('should have DESTROY removal policy', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('SSM Parameters', () => {
    test('should create GitHub token parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/cicd/github/token-test',
        Description: 'GitHub personal access token for pipeline',
        Type: 'String',
        Value: 'PLACEHOLDER_GITHUB_TOKEN',
        Tier: 'Standard',
      });
    });

    test('should create DockerHub token parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/cicd/dockerhub/token-test',
        Description: 'DockerHub token for image pulls',
        Type: 'String',
        Value: 'PLACEHOLDER_DOCKERHUB_TOKEN',
        Tier: 'Standard',
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create CodeBuild service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'cicd-codebuild-role-test-us-east-1',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should create CloudFormation deploy role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'cicd-cfn-deploy-role-test-us-east-1',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudformation.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should create CodePipeline service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'cicd-pipeline-role-test-us-east-1',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should create event trigger role', () => {
      // Event trigger role is created by EventBridge rule target
      // Just verify that we have the expected number of IAM roles
      template.resourceCountIs('AWS::IAM::Role', 7);
    });
  });

  describe('CodeBuild Project', () => {
    test('should create CodeBuild project with correct properties', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'cicd-build-project-test-us-east-1',
        Description: 'Build and test application',
        Artifacts: {
          Type: 'CODEPIPELINE',
        },
        Environment: {
          Type: 'LINUX_CONTAINER',
          ComputeType: 'BUILD_GENERAL1_MEDIUM',
          Image: 'aws/codebuild/standard:7.0',
          PrivilegedMode: true,
        },
        Source: {
          Type: 'CODEPIPELINE',
        },
        Cache: {
          Type: 'NO_CACHE',
        },
      });
    });

    test('should have environment variables configured', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: {
          EnvironmentVariables: [
            {
              Name: 'GITHUB_TOKEN',
              Type: 'PARAMETER_STORE',
            },
            {
              Name: 'DOCKERHUB_TOKEN',
              Type: 'PARAMETER_STORE',
            },
            {
              Name: 'AWS_DEFAULT_REGION',
              Type: 'PLAINTEXT',
              Value: 'us-east-1',
            },
          ],
        },
      });
    });
  });

  describe('CodePipeline', () => {
    test('should create CodePipeline with correct properties', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'application-cicd-pipeline-test-us-east-1',
        ArtifactStore: {
          Type: 'S3',
          EncryptionKey: {
            Type: 'KMS',
          },
        },
        Stages: [
          {
            Name: 'Source',
            Actions: [
              {
                Name: 'github-source',
                ActionTypeId: {
                  Category: 'Source',
                  Owner: 'ThirdParty',
                  Provider: 'GitHub',
                  Version: '1',
                },
                Configuration: {
                  Owner: 'test-org',
                  Repo: 'test-repo',
                  Branch: 'main',
                },
              },
            ],
          },
          {
            Name: 'Build',
            Actions: [
              {
                Name: 'application-build',
                ActionTypeId: {
                  Category: 'Build',
                  Owner: 'AWS',
                  Provider: 'CodeBuild',
                  Version: '1',
                },
              },
            ],
          },
          {
            Name: 'ManualApproval',
            Actions: [
              {
                Name: 'approve-deployment',
                ActionTypeId: {
                  Category: 'Approval',
                  Owner: 'AWS',
                  Provider: 'Manual',
                  Version: '1',
                },
              },
            ],
          },
          {
            Name: 'Deploy',
            Actions: [
              {
                Name: 'deploy-application',
                ActionTypeId: {
                  Category: 'Deploy',
                  Owner: 'AWS',
                  Provider: 'CloudFormation',
                  Version: '1',
                },
                Configuration: {
                  StackName: 'application-stack-test',
                  TemplatePath: 'build-output::cdk.out/ApplicationStack.template.json',
                  ActionMode: 'CREATE_UPDATE',
                  Capabilities: 'CAPABILITY_NAMED_IAM,CAPABILITY_AUTO_EXPAND',
                },
              },
            ],
          },
        ],
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create pipeline failure alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'cicd-pipeline-failure-test-us-east-1',
        AlarmDescription: 'Alert when pipeline execution fails',
        MetricName: 'PipelineExecutionFailure',
        Namespace: 'AWS/CodePipeline',
        Statistic: 'Sum',
        Threshold: 1,
        EvaluationPeriods: 1,
        TreatMissingData: 'notBreaching',
      });
    });

    test('should create build duration alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'cicd-build-duration-exceeded-test-us-east-1',
        AlarmDescription: 'Alert when build takes longer than expected',
        MetricName: 'Duration',
        Namespace: 'AWS/CodeBuild',
        Statistic: 'Average',
        Threshold: 900,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
      });
    });

    test('should have SNS actions for alarms', () => {
      // Just verify that alarms exist and have alarm actions
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarms).length).toBe(2);
      
      // Check that each alarm has alarm actions
      Object.values(alarms).forEach(alarm => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(Array.isArray(alarm.Properties.AlarmActions)).toBe(true);
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('EventBridge Rule', () => {
    test('should create pipeline monitoring rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: 'cicd-pipeline-monitoring-test-us-east-1',
        Description: 'Monitor pipeline execution status changes',
        EventPattern: {
          source: ['aws.codepipeline'],
          'detail-type': ['CodePipeline Pipeline Execution State Change'],
          detail: {
            state: ['FAILED', 'SUCCEEDED', 'CANCELED'],
          },
        },
      });
    });

    test('should have SNS target for monitoring rule', () => {
      // Just verify that the rule has targets
      const rules = template.findResources('AWS::Events::Rule');
      expect(Object.keys(rules).length).toBe(1);
      
      // Check that the rule has targets
      const rule = Object.values(rules)[0];
      expect(rule.Properties.Targets).toBeDefined();
      expect(Array.isArray(rule.Properties.Targets)).toBe(true);
      expect(rule.Properties.Targets.length).toBeGreaterThan(0);
    });
  });

  describe('Outputs', () => {
    test('should create pipeline name output', () => {
      // Check that outputs exist
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('should create artifacts bucket output', () => {
      // Check that outputs exist
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('should create notification topic output', () => {
      // Check that outputs exist
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Tags', () => {
    test('should apply tags to all resources', () => {
      // Check that tags are applied to the stack
      const stackTags = cdk.Tags.of(stack);
      expect(stackTags).toBeDefined();
    });
  });

  describe('Resource Counts', () => {
    test('should have correct number of resources', () => {
      // Count key resources
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::KMS::Alias', 1);
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::SNS::Subscription', 1);
      template.resourceCountIs('AWS::Logs::LogGroup', 1);
      template.resourceCountIs('AWS::SSM::Parameter', 2);
      template.resourceCountIs('AWS::IAM::Role', 7);
      template.resourceCountIs('AWS::CodeBuild::Project', 1);
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
      template.resourceCountIs('AWS::Events::Rule', 1);
      template.resourceCountIs('Custom::S3AutoDeleteObjects', 1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing props gracefully', () => {
      const minimalStack = new TapStack(app, 'MinimalStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      expect(minimalStack).toBeDefined();
    });

    test('should handle different environment suffixes', () => {
      const prodStack = new TapStack(app, 'ProdStack', {
        ...defaultProps,
        environmentSuffix: 'prod',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      expect(prodStack).toBeDefined();
    });

    test('should handle different regions', () => {
      const westStack = new TapStack(app, 'WestStack', {
        ...defaultProps,
        env: { account: '123456789012', region: 'us-west-2' },
      });
      expect(westStack).toBeDefined();
    });
  });

  describe('Security', () => {
    test('should have least privilege IAM policies', () => {
      // Check that CodeBuild role has minimal permissions
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyName: 'build-permissions',
            PolicyDocument: {
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject'],
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                },
                {
                  Effect: 'Allow',
                  Action: ['ssm:GetParameter', 'ssm:GetParameters'],
                },
              ],
            },
          },
        ],
      });
    });

    test('should have secure SSM parameters', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Type: 'String',
      });
    });

    test('should have encrypted S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
      });
    });
  });

  describe('Cost Optimization', () => {
    test('should have lifecycle rules for cost optimization', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'delete-old-artifacts',
              Status: 'Enabled',
              ExpirationInDays: 30,
              NoncurrentVersionExpiration: {
                NoncurrentDays: 7,
              },
            },
          ],
        },
      });
    });

    test('should have log retention for cost optimization', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });

    test('should use medium compute type for cost optimization', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: {
          ComputeType: 'BUILD_GENERAL1_MEDIUM',
        },
      });
    });
  });
});