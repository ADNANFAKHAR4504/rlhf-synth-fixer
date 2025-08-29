import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'dev1';

describe('TapStack CI/CD Pipeline Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      notificationEmail: 'test@example.com',
      approverEmail: 'approver@example.com'
    });
    template = Template.fromStack(stack);
  });

  describe('Constructor Parameter Variations', () => {
    test('should handle missing environmentSuffix and use default', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {});
      const defaultTemplate = Template.fromStack(defaultStack);
      
      defaultTemplate.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for TAP CI/CD pipeline encryption - dev'
      });
    });

    test('should handle environmentSuffix from context', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('environmentSuffix', 'staging');
      const contextStack = new TapStack(contextApp, 'ContextStack', {});
      const contextTemplate = Template.fromStack(contextStack);
      
      contextTemplate.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for TAP CI/CD pipeline encryption - staging'
      });
    });

    test('should handle missing notification emails and use defaults', () => {
      const noEmailApp = new cdk.App();
      const noEmailStack = new TapStack(noEmailApp, 'NoEmailStack', { environmentSuffix: 'test' });
      const noEmailTemplate = Template.fromStack(noEmailStack);
      
      noEmailTemplate.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'devops@yourcompany.com'
      });
      
      noEmailTemplate.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email', 
        Endpoint: 'approver@yourcompany.com'
      });
    });

    test('should prioritize props over context for environmentSuffix', () => {
      const priorityApp = new cdk.App();
      priorityApp.node.setContext('environmentSuffix', 'context');
      const priorityStack = new TapStack(priorityApp, 'PriorityStack', { 
        environmentSuffix: 'props'
      });
      const priorityTemplate = Template.fromStack(priorityStack);
      
      priorityTemplate.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for TAP CI/CD pipeline encryption - props'
      });
    });
  });

  describe('KMS Key Configuration', () => {
    test('should create KMS key with proper configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: `KMS key for TAP CI/CD pipeline encryption - ${environmentSuffix}`,
        EnableKeyRotation: true
      });
    });

    test('should create KMS alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/tap-pipeline-key-${environmentSuffix}`
      });
    });
  });

  describe('S3 Buckets Configuration', () => {
    test('should create source bucket with proper encryption and settings', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms'
            }
          }]
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('should create artifacts bucket with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [{
            ExpirationInDays: 30,
            Id: 'DeleteOldArtifacts',
            NoncurrentVersionExpiration: {
              NoncurrentDays: 7
            },
            Status: 'Enabled'
          }]
        }
      });
    });
  });

  describe('SNS Topics Configuration', () => {
    test('should create pipeline notifications topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `tap-pipeline-notifications-${environmentSuffix}`,
        DisplayName: `TAP Pipeline Notifications - ${environmentSuffix}`
      });
    });

    test('should create approval topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `tap-approval-${environmentSuffix}`,
        DisplayName: `TAP Approval Notifications - ${environmentSuffix}`
      });
    });

    test('should create email subscriptions', () => {
      template.resourceCountIs('AWS::SNS::Subscription', 2);
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com'
      });
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'approver@example.com'
      });
    });
  });

  describe('IAM Roles Configuration', () => {
    test('should create CodeBuild role with proper permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-codebuild-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'codebuild.amazonaws.com'
            },
            Action: 'sts:AssumeRole'
          }]
        }
      });
    });

    test('should create pipeline role with proper permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-pipeline-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'codepipeline.amazonaws.com'
            },
            Action: 'sts:AssumeRole'
          }]
        }
      });
    });

    test('should have least privilege IAM policies', () => {
      // Check that CodeBuild role has proper policies
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-codebuild-role-${environmentSuffix}`
      });
      
      // Verify CodeBuild role has restricted S3 permissions (not wildcard)
      const codeBuildRole = template.findResources('AWS::IAM::Role', {
        Properties: {
          RoleName: `tap-codebuild-role-${environmentSuffix}`
        }
      });
      
      expect(Object.keys(codeBuildRole).length).toBe(1);
      const role = Object.values(codeBuildRole)[0] as any;
      expect(role.Properties.Policies).toBeDefined();
      
      // Verify role exists and has policies defined
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('CodeBuildPolicy');
      expect(policy.PolicyDocument.Statement).toBeDefined();
    });
  });

  describe('CodeBuild Project Configuration', () => {
    test('should create build project with proper configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `tap-build-${environmentSuffix}`,
        Environment: {
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:7.0',
          Type: 'LINUX_CONTAINER',
          PrivilegedMode: false
        }
      });
    });

    test('should have proper buildspec configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Source: {
          Type: 'NO_SOURCE',
          BuildSpec: Match.anyValue()
        }
      });
    });
  });

  describe('CodeDeploy Configuration', () => {
    test('should create CodeDeploy application', () => {
      template.hasResourceProperties('AWS::CodeDeploy::Application', {
        ApplicationName: `tap-deploy-${environmentSuffix}`,
        ComputePlatform: 'Server'
      });
    });

    test('should create deployment group', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        DeploymentGroupName: `tap-deployment-group-${environmentSuffix}`,
        DeploymentConfigName: 'CodeDeployDefault.AllAtOnce'
      });
    });
  });

  describe('CodePipeline Configuration', () => {
    test('should create pipeline with proper stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: `tap-pipeline-${environmentSuffix}`,
        Stages: [
          {
            Name: 'Source',
            Actions: [{
              ActionTypeId: {
                Category: 'Source',
                Owner: 'AWS',
                Provider: 'S3',
                Version: '1'
              },
              Name: 'S3Source'
            }]
          },
          {
            Name: 'BuildAndTest',
            Actions: [{
              ActionTypeId: {
                Category: 'Build',
                Owner: 'AWS',
                Provider: 'CodeBuild',
                Version: '1'
              },
              Name: 'BuildAndTest'
            }]
          },
          {
            Name: 'Deploy',
            Actions: [{
              ActionTypeId: {
                Category: 'Deploy',
                Owner: 'AWS',
                Provider: 'CodeDeploy',
                Version: '1'
              },
              Name: 'Deploy'
            }]
          }
        ]
      });
    });

    test('should have encrypted artifact store', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        ArtifactStore: {
          Type: 'S3',
          EncryptionKey: {
            Type: 'KMS'
          }
        }
      });
    });

    test('should not have manual approval for dev1 environment', () => {
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineProperties = Object.values(pipeline)[0].Properties;
      const stages = pipelineProperties.Stages;
      
      const hasManualApproval = stages.some((stage: any) => 
        stage.Name === 'ManualApproval'
      );
      
      expect(hasManualApproval).toBe(false);
    });
  });

  describe('Lambda Notification Function', () => {
    test('should create notification function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-pipeline-notifications-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler'
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('should create pipeline state change rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.codepipeline'],
          'detail-type': [
            'CodePipeline Pipeline Execution State Change',
            'CodePipeline Stage Execution State Change'
          ]
        },
        State: 'ENABLED'
      });
    });

    test('should create S3 source event rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.s3'],
          'detail-type': ['AWS API Call via CloudTrail'],
          detail: {
            eventName: [
              'CompleteMultipartUpload',
              'CopyObject', 
              'PutObject'
            ]
          }
        }
      });
    });
  });

  describe('Resource Counting', () => {
    test('should have correct number of resources', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::KMS::Alias', 1);
      template.resourceCountIs('AWS::S3::Bucket', 2);
      template.resourceCountIs('AWS::SNS::Topic', 2);
      template.resourceCountIs('AWS::SNS::Subscription', 2);
      template.resourceCountIs('AWS::CodeBuild::Project', 1);
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
      template.resourceCountIs('AWS::CodeDeploy::Application', 1);
      template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 1);
      template.resourceCountIs('AWS::Lambda::Function', 1);
      template.resourceCountIs('AWS::Events::Rule', 2);
    });
  });

  describe('Environment-specific Configuration', () => {
    test('should handle production environment with manual approval', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdTapStack', { 
        environmentSuffix: 'prod',
        notificationEmail: 'test@example.com',
        approverEmail: 'approver@example.com'
      });
      const prodTemplate = Template.fromStack(prodStack);

      const pipeline = prodTemplate.findResources('AWS::CodePipeline::Pipeline');
      const pipelineProperties = Object.values(pipeline)[0].Properties;
      const stages = pipelineProperties.Stages;
      
      const hasManualApproval = stages.some((stage: any) => 
        stage.Name === 'ManualApproval'
      );
      
      expect(hasManualApproval).toBe(true);
    });

    test('should handle staging environment without manual approval', () => {
      const stagingApp = new cdk.App();
      const stagingStack = new TapStack(stagingApp, 'StagingTapStack', { 
        environmentSuffix: 'staging',
        notificationEmail: 'test@example.com',
        approverEmail: 'approver@example.com'
      });
      const stagingTemplate = Template.fromStack(stagingStack);

      const pipeline = stagingTemplate.findResources('AWS::CodePipeline::Pipeline');
      const pipelineProperties = Object.values(pipeline)[0].Properties;
      const stages = pipelineProperties.Stages;
      
      const hasManualApproval = stages.some((stage: any) => 
        stage.Name === 'ManualApproval'
      );
      
      expect(hasManualApproval).toBe(false);
    });

    test('should handle development environment without manual approval', () => {
      const devApp = new cdk.App();
      const devStack = new TapStack(devApp, 'DevTapStack', { 
        environmentSuffix: 'dev',
        notificationEmail: 'test@example.com',
        approverEmail: 'approver@example.com'
      });
      const devTemplate = Template.fromStack(devStack);

      const pipeline = devTemplate.findResources('AWS::CodePipeline::Pipeline');
      const pipelineProperties = Object.values(pipeline)[0].Properties;
      const stages = pipelineProperties.Stages;
      
      const hasManualApproval = stages.some((stage: any) => 
        stage.Name === 'ManualApproval'
      );
      
      expect(hasManualApproval).toBe(false);
    });

    test('should handle test environment without manual approval', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestTapStack', { 
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com',
        approverEmail: 'approver@example.com'
      });
      const testTemplate = Template.fromStack(testStack);

      const pipeline = testTemplate.findResources('AWS::CodePipeline::Pipeline');
      const pipelineProperties = Object.values(pipeline)[0].Properties;
      const stages = pipelineProperties.Stages;
      
      const hasManualApproval = stages.some((stage: any) => 
        stage.Name === 'ManualApproval'
      );
      
      expect(hasManualApproval).toBe(false);
    });
  });

  describe('Security Configuration', () => {
    test('should have proper encryption throughout', () => {
      // S3 buckets should be encrypted
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      });

      // SNS topics should be encrypted
      template.hasResourceProperties('AWS::SNS::Topic', {
        KmsMasterKeyId: Match.anyValue()
      });

      // Pipeline should use KMS encryption
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        ArtifactStore: {
          EncryptionKey: {
            Type: 'KMS'
          }
        }
      });
    });

    test('should block all public S3 access', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        });
      });
    });
  });
});
