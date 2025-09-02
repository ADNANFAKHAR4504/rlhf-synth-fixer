import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('KMS Key', () => {
    test('should create KMS key with encryption enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: `KMS key for CI/CD pipeline encryption - ${environmentSuffix}`,
        EnableKeyRotation: true,
      });
    });

    test('should create KMS alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/tap-pipeline-${environmentSuffix}`,
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create source bucket with versioning and encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should create artifacts bucket with lifecycle policy', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteArtifacts',
              ExpirationInDays: 30,
              Status: 'Enabled',
            },
          ],
        },
      });
    });
  });

  describe('SNS Topic and Notifications', () => {
    test('should create SNS topic for notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `tap-pipeline-notifications-${environmentSuffix}`,
        DisplayName: `TAP Pipeline Notifications - ${environmentSuffix}`,
      });
    });

    test('should create email subscription', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'admin@example.com',
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create build log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codebuild/tap-build-${environmentSuffix}`,
        RetentionInDays: 30,
      });
    });

    test('should create pipeline log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codepipeline/tap-pipeline-${environmentSuffix}`,
        RetentionInDays: 30,
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create CodeBuild role with correct policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-codebuild-role-${environmentSuffix}`,
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

    test('should create CodePipeline role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-codepipeline-role-${environmentSuffix}`,
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

    test('should create Elastic Beanstalk instance role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-eb-instance-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should create Elastic Beanstalk service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-eb-service-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'elasticbeanstalk.amazonaws.com',
              },
            },
          ],
        },
      });
    });
  });

  describe('CodeBuild Project', () => {
    test('should create CodeBuild project with correct configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `tap-build-${environmentSuffix}`,
        Environment: {
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:7.0',
          Type: 'LINUX_CONTAINER',
          PrivilegedMode: false,
          EnvironmentVariables: [
            {
              Name: 'ENVIRONMENT',
              Type: 'PLAINTEXT',
              Value: environmentSuffix,
            },
            {
              Name: 'AWS_DEFAULT_REGION',
              Type: 'PLAINTEXT',
            },
            {
              Name: 'AWS_ACCOUNT_ID',
              Type: 'PLAINTEXT',
            },
          ],
        },
      });
    });
  });

  describe('Elastic Beanstalk', () => {
    test('should create Elastic Beanstalk application', () => {
      template.hasResourceProperties('AWS::ElasticBeanstalk::Application', {
        ApplicationName: `tap-app-${environmentSuffix}`,
        Description: `TAP Application - ${environmentSuffix} environment`,
      });
    });

    test('should create Elastic Beanstalk environment with correct platform', () => {
      template.hasResourceProperties('AWS::ElasticBeanstalk::Environment', {
        ApplicationName: `tap-app-${environmentSuffix}`,
        EnvironmentName: `tap-env-${environmentSuffix}`,
        SolutionStackName: '64bit Amazon Linux 2023 v6.6.4 running Node.js 20',
      });
    });

    test('should configure environment scaling for dev vs prod', () => {
      const minSize = environmentSuffix === 'prod' ? '2' : '1';
      const maxSize = environmentSuffix === 'prod' ? '6' : '2';

      const ebEnvironment = template.findResources(
        'AWS::ElasticBeanstalk::Environment'
      );
      const environment = Object.values(ebEnvironment)[0] as any;
      const optionSettings = environment.Properties.OptionSettings;

      const minSizeSetting = optionSettings.find(
        (setting: any) =>
          setting.Namespace === 'aws:autoscaling:asg' &&
          setting.OptionName === 'MinSize'
      );
      const maxSizeSetting = optionSettings.find(
        (setting: any) =>
          setting.Namespace === 'aws:autoscaling:asg' &&
          setting.OptionName === 'MaxSize'
      );

      expect(minSizeSetting.Value).toBe(minSize);
      expect(maxSizeSetting.Value).toBe(maxSize);
    });
  });

  describe('CodePipeline', () => {
    test('should create CodePipeline with all required stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: `tap-pipeline-${environmentSuffix}`,
        Stages: [
          {
            Name: 'Source',
            Actions: [
              {
                ActionTypeId: {
                  Category: 'Source',
                  Owner: 'AWS',
                  Provider: 'S3',
                  Version: '1',
                },
                Name: 'S3Source',
                Configuration: {
                  S3ObjectKey: 'source.zip',
                  PollForSourceChanges: true,
                },
              },
            ],
          },
          {
            Name: 'Build',
            Actions: [
              {
                ActionTypeId: {
                  Category: 'Build',
                  Owner: 'AWS',
                  Provider: 'CodeBuild',
                  Version: '1',
                },
                Name: 'Build',
              },
            ],
          },
          {
            Name: 'Deploy',
            Actions: [
              {
                ActionTypeId: {
                  Category: 'Deploy',
                  Owner: 'AWS',
                  Provider: 'ElasticBeanstalk',
                  Version: '1',
                },
                Name: 'Deploy',
              },
            ],
          },
        ],
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `tap-pipeline-${environmentSuffix}`,
      });
    });
  });

  describe('EventBridge Rule', () => {
    test('should create pipeline state change rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Description: `Pipeline state change notifications for ${environmentSuffix}`,
        EventPattern: {
          detail: {
            state: ['FAILED', 'SUCCEEDED'],
          },
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have required outputs', () => {
      template.hasOutput(`SourceBucketName${environmentSuffix}`, {});
      template.hasOutput(`PipelineName${environmentSuffix}`, {});
      template.hasOutput(`DashboardURL${environmentSuffix}`, {});
    });
  });

  describe('Security Best Practices', () => {
    test('should have public access blocked on all S3 buckets', () => {
      template.allResourcesProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have versioning enabled on source bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldVersions',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
              Status: 'Enabled',
            },
          ],
        },
      });
    });

    test('should have lifecycle rules for cost optimization', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldVersions',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
              Status: 'Enabled',
            },
          ],
        },
      });
    });
  });

  describe('Manual Approval for Production', () => {
    test('should include manual approval stage for production environment', () => {
      if (environmentSuffix === 'prod') {
        template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
          Stages: [
            {
              Name: 'Source',
            },
            {
              Name: 'Build',
            },
            {
              Name: 'ManualApproval',
              Actions: [
                {
                  ActionTypeId: {
                    Category: 'Approval',
                    Owner: 'AWS',
                    Provider: 'Manual',
                    Version: '1',
                  },
                  Name: 'ManualApproval',
                },
              ],
            },
            {
              Name: 'Deploy',
            },
          ],
        });
      }
    });

    test('should not include manual approval for non-production environments', () => {
      if (environmentSuffix !== 'prod') {
        const pipelineTemplate = template.findResources(
          'AWS::CodePipeline::Pipeline'
        );
        const pipeline = Object.values(pipelineTemplate)[0] as any;
        const stageNames = pipeline.Properties.Stages.map(
          (stage: any) => stage.Name
        );
        expect(stageNames).not.toContain('ManualApproval');
      }
    });
  });

  describe('Environment Configuration Coverage', () => {
    test('should use context environmentSuffix when props is undefined', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('environmentSuffix', 'staging');
      const contextStack = new TapStack(contextApp, 'ContextStack');
      const contextTemplate = Template.fromStack(contextStack);

      // Check that staging environment creates pipeline with staging name
      contextTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'tap-pipeline-staging',
      });
    });

    test('should use default dev when no props or context provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);

      // Check that default environment creates pipeline with dev name
      defaultTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'tap-pipeline-dev',
      });
    });

    test('should use context notificationEmail when props is undefined', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('notificationEmail', 'test@example.com');
      const contextStack = new TapStack(contextApp, 'NotificationContextStack');
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com',
      });
    });

    test('should use default email when no props or context provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultEmailStack');
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'admin@example.com',
      });
    });
  });

  describe('Production Environment Specific Tests', () => {
    let prodApp: cdk.App;
    let prodStack: TapStack;
    let prodTemplate: Template;

    beforeEach(() => {
      prodApp = new cdk.App();
      prodStack = new TapStack(prodApp, 'ProdStack', { environmentSuffix: 'prod' });
      prodTemplate = Template.fromStack(prodStack);
    });

    test('should configure production scaling with higher limits', () => {
      const ebEnvironment = prodTemplate.findResources(
        'AWS::ElasticBeanstalk::Environment'
      );
      const environment = Object.values(ebEnvironment)[0] as any;
      const optionSettings = environment.Properties.OptionSettings;

      const minSizeSetting = optionSettings.find(
        (setting: any) =>
          setting.Namespace === 'aws:autoscaling:asg' &&
          setting.OptionName === 'MinSize'
      );
      const maxSizeSetting = optionSettings.find(
        (setting: any) =>
          setting.Namespace === 'aws:autoscaling:asg' &&
          setting.OptionName === 'MaxSize'
      );

      expect(minSizeSetting.Value).toBe('2');
      expect(maxSizeSetting.Value).toBe('6');
    });

    test('should include manual approval stage for production', () => {
      const pipeline = prodTemplate.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0] as any;
      const stages = pipelineResource.Properties.Stages;
      
      const stageNames = stages.map((stage: any) => stage.Name);
      expect(stageNames).toContain('ManualApproval');
      
      const approvalStage = stages.find((stage: any) => stage.Name === 'ManualApproval');
      expect(approvalStage.Actions[0].ActionTypeId.Provider).toBe('Manual');
    });

    test('should create production-specific resource names', () => {
      prodTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'tap-pipeline-prod',
      });
      
      prodTemplate.hasResourceProperties('AWS::ElasticBeanstalk::Application', {
        ApplicationName: 'tap-app-prod',
        Description: 'TAP Application - prod environment',
      });
      
      // Check SNS topic has prod suffix
      prodTemplate.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'tap-pipeline-notifications-prod',
        DisplayName: 'TAP Pipeline Notifications - prod',
      });
    });
  });
});
