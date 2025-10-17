import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack - CI/CD Pipeline', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        InstanceTenancy: 'default',
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: 'vpc-test-cicd',
          },
        ]),
      });
    });

    test('should create public and private subnets', () => {
      // Check for public subnets
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private

      // Check for Internet Gateway
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);

      // Check for NAT Gateway
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('should create security groups', () => {
      // Check application security group
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for application EC2 instances',
        GroupName: 'test-application-sg',
        SecurityGroupIngress: Match.arrayWith([
          {
            Description: 'Allow HTTP from VPC',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
            CidrIp: Match.anyValue(),
          },
        ]),
      });

      // Check CodeBuild security group
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for CodeBuild projects',
        GroupName: 'test-codebuild-sg',
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create artifact bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
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
        // VersioningConfiguration removed (versioning disabled)
        // LifecycleConfiguration removed
      });
    });

    test('should create S3 bucket policy for SSL enforcement', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
              Effect: 'Deny',
              Principal: {
                AWS: '*',
              },
              Resource: Match.anyValue(),
            },
          ]),
        },
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('should create log groups with correct retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/pipeline/test-cicd',
        RetentionInDays: 30,
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/codebuild/test-build',
        RetentionInDays: 7,
      });
    });
  });

  describe('Secrets Manager', () => {
    test('should create database secret with correct configuration', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'secret-test-database-credentials',
        Description: 'Database credentials for production application',
        GenerateSecretString: {
          ExcludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
          GenerateStringKey: 'password',
          PasswordLength: 32,
          SecretStringTemplate:
            '{"username":"dbadmin","engine":"mysql","host":"prod-db.example.com","port":3306}',
        },
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create CodePipeline service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'role-test-pipeline-service',
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
          Version: '2012-10-17',
        },
        Description:
          'Service role for CodePipeline with least privilege access',
      });
    });

    test('should create CodeBuild service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'role-test-codebuild-service',
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
          Version: '2012-10-17',
        },
        ManagedPolicyArns: Match.absent(), // No managed policies, using inline policies
      });
    });

    test('should create CodeDeploy service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'role-test-codedeploy-service',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codedeploy.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        ManagedPolicyArns: Match.anyValue(), // May have managed policies from CDK
      });
    });

    test('should create Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'role-test-lambda-notifications',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        ManagedPolicyArns: Match.absent(), // No managed policies, using inline policies
      });
    });

    test('should create EC2 instance role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'role-test-ec2-codedeploy',
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
          Version: '2012-10-17',
        },
        ManagedPolicyArns: Match.absent(), // No managed policies, using inline policies
      });
    });
  });

  describe('SNS Topic', () => {
    test('should create notification topic with email subscription', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'topic-test-pipeline-notifications',
        DisplayName: 'CI/CD Pipeline Notifications',
      });

      template.hasResourceProperties('AWS::SNS::Subscription', {
        Endpoint: 'prakhar.j@turing.com',
        Protocol: 'email',
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create notification Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'lambda-test-deployment-notifications',
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 256,
        Environment: {
          Variables: {
            SNS_TOPIC_ARN: Match.anyValue(),
          },
        },
      });
    });
  });

  describe('CodeBuild Project', () => {
    test('should create build project with correct configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'build-test-webapp',
        Description: 'Build project for production web application',
        Environment: {
          ComputeType: 'BUILD_GENERAL1_MEDIUM',
          Image: 'aws/codebuild/standard:7.0',
          PrivilegedMode: true,
          Type: 'LINUX_CONTAINER',
          EnvironmentVariables: Match.arrayWith([
            {
              Name: 'AWS_ACCOUNT_ID',
              Type: 'PLAINTEXT',
              Value: Match.anyValue(),
            },
            {
              Name: 'AWS_DEFAULT_REGION',
              Type: 'PLAINTEXT',
              Value: Match.anyValue(),
            },
            {
              Name: 'ENVIRONMENT',
              Type: 'PLAINTEXT',
              Value: 'test',
            },
          ]),
        },
        ServiceRole: Match.anyValue(),
        VpcConfig: {
          SecurityGroupIds: Match.anyValue(),
          Subnets: Match.anyValue(),
          VpcId: Match.anyValue(),
        },
      });
    });

    test('should have correct buildspec configuration', () => {
      const buildProject = template.findResources('AWS::CodeBuild::Project');
      const project = Object.values(buildProject)[0];

      expect(project.Properties.Source.BuildSpec).toContain('"version": "0.2"');
      expect(project.Properties.Source.BuildSpec).toContain('pre_build');
      expect(project.Properties.Source.BuildSpec).toContain('build');
      expect(project.Properties.Source.BuildSpec).toContain('post_build');
      expect(project.Properties.Source.BuildSpec).toContain('artifacts');
      // Cache is disabled to avoid circular dependency
      // expect(project.Properties.Source.BuildSpec).toContain('cache');
    });
  });

  describe('CodeDeploy Application', () => {
    test('should create CodeDeploy application', () => {
      template.hasResourceProperties('AWS::CodeDeploy::Application', {
        ApplicationName: 'deploy-test-webapp',
        ComputePlatform: 'Server',
      });
    });

    test('should create deployment group with auto-rollback', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        ApplicationName: Match.anyValue(),
        DeploymentGroupName: 'dg-test-webapp',
        DeploymentConfigName: 'CodeDeployDefault.OneAtATime',
        AutoRollbackConfiguration: {
          Enabled: true,
          Events: ['DEPLOYMENT_FAILURE', 'DEPLOYMENT_STOP_ON_REQUEST'],
        },
        Ec2TagSet: {
          Ec2TagSetList: [
            {
              Ec2TagGroup: [
                {
                  Key: 'Environment',
                  Type: 'KEY_AND_VALUE',
                  Value: 'test',
                },
                {
                  Key: 'Application',
                  Type: 'KEY_AND_VALUE',
                  Value: 'webapp',
                },
              ],
            },
          ],
        },
      });
    });
  });

  describe('CodePipeline', () => {
    test('should create pipeline with correct stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'pipeline-test-webapp',
        RestartExecutionOnUpdate: true,
        Stages: Match.arrayWith([
          {
            Name: 'Source',
            Actions: Match.arrayWith([
              {
                ActionTypeId: {
                  Category: 'Source',
                  Owner: 'AWS',
                  Provider: 'S3',
                  Version: '1',
                },
                Name: 'S3Source',
                OutputArtifacts: [
                  {
                    Name: 'SourceOutput',
                  },
                ],
                Configuration: Match.anyValue(),
                RoleArn: Match.anyValue(),
                RunOrder: 1,
              },
            ]),
          },
          {
            Name: 'Build',
            Actions: Match.arrayWith([
              {
                ActionTypeId: {
                  Category: 'Build',
                  Owner: 'AWS',
                  Provider: 'CodeBuild',
                  Version: '1',
                },
                Name: 'Build',
                InputArtifacts: [
                  {
                    Name: 'SourceOutput',
                  },
                ],
                OutputArtifacts: [
                  {
                    Name: 'BuildOutput',
                  },
                ],
                Configuration: Match.anyValue(),
                RoleArn: Match.anyValue(),
                RunOrder: 1,
              },
            ]),
          },
          {
            Name: 'ManualApproval',
            Actions: Match.arrayWith([
              {
                ActionTypeId: {
                  Category: 'Approval',
                  Owner: 'AWS',
                  Provider: 'Manual',
                  Version: '1',
                },
                Name: 'ApproveDeployment',
                Configuration: {
                  CustomData:
                    'Please review the build artifacts and approve deployment to production. Ensure SNS email subscribers have confirmed their subscription.',
                  NotificationArn: Match.anyValue(),
                },
                RoleArn: Match.anyValue(),
                RunOrder: 1,
              },
            ]),
          },
          {
            Name: 'Deploy',
            Actions: Match.arrayWith([
              {
                ActionTypeId: {
                  Category: 'Deploy',
                  Owner: 'AWS',
                  Provider: 'CodeDeploy',
                  Version: '1',
                },
                Name: 'Deploy',
                InputArtifacts: [
                  {
                    Name: 'BuildOutput',
                  },
                ],
                Configuration: Match.anyValue(),
                RoleArn: Match.anyValue(),
                RunOrder: 1,
              },
            ]),
          },
        ]),
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create pipeline failure alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'alarm-test-pipeline-failure',
        AlarmDescription: 'Alarm when pipeline execution fails',
        MetricName: 'PipelineExecutionFailure',
        Namespace: 'AWS/CodePipeline',
        Statistic: 'Sum',
        Threshold: 1,
        EvaluationPeriods: 1,
        TreatMissingData: 'notBreaching',
        AlarmActions: Match.anyValue(),
      });
    });

    test('should create build duration alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'alarm-test-build-duration',
        AlarmDescription: 'Alarm when build takes too long',
        MetricName: 'Duration',
        Namespace: 'AWS/CodeBuild',
        Statistic: 'Average',
        Threshold: 900000,
        EvaluationPeriods: 1,
        TreatMissingData: 'notBreaching',
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('should create pipeline event rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: 'rule-test-pipeline-state-changes',
        Description: 'Trigger notifications on pipeline state changes',
        EventPattern: {
          source: ['aws.codepipeline'],
          'detail-type': ['CodePipeline Pipeline Execution State Change'],
          detail: {
            pipeline: Match.anyValue(),
            state: ['FAILED', 'SUCCEEDED', 'CANCELED'],
          },
        },
        State: 'ENABLED',
        Targets: Match.arrayWith([
          {
            Arn: Match.anyValue(),
            Id: 'Target0',
          },
        ]),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export pipeline ARN', () => {
      template.hasOutput('PipelineArn', {
        Description: 'ARN of the CI/CD pipeline',
        Export: {
          Name: 'CICDPipelineArn',
        },
      });
    });

    test('should export artifact bucket name', () => {
      template.hasOutput('ArtifactBucketName', {
        Description: 'Name of the artifact bucket',
        Export: {
          Name: 'CICDArtifactBucket',
        },
      });
    });

    test('should export notification topic ARN', () => {
      template.hasOutput('NotificationTopicArn', {
        Description: 'ARN of the notification topic',
        Export: {
          Name: 'CICDNotificationTopic',
        },
      });
    });

    test('should export VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'ID of the VPC',
        Export: {
          Name: 'CICDVpcId',
        },
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should apply consistent tags to all resources', () => {
      // Check that resources have the expected tags
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Application',
            Value: 'CI-CD-Pipeline',
          },
          {
            Key: 'Environment',
            Value: 'test',
          },
          {
            Key: 'ManagedBy',
            Value: 'AWS-CDK',
          },
        ]),
      });
    });
  });

  describe('Removal Policies', () => {
    test('should set DESTROY policy for S3 bucket', () => {
      template.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });

    test('should set DESTROY policy for Secrets Manager secret', () => {
      template.hasResource('AWS::SecretsManager::Secret', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });

    test('should set DESTROY policy for CloudWatch log groups', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('Environment Configuration', () => {
    test('should use default environment when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: 'vpc-prod-cicd',
          },
        ]),
      });
    });

    test('should use custom environment suffix', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'staging',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: 'vpc-staging-cicd',
          },
        ]),
      });
    });
  });

  describe('Resource Counts', () => {
    test('should create expected number of resources', () => {
      // VPC and networking
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::Subnet', 4);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::NatGateway', 1);

      // Storage and secrets
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::SecretsManager::Secret', 1);

      // Logging
      template.resourceCountIs('AWS::Logs::LogGroup', 2);

      // IAM (includes pipeline action roles)
      template.resourceCountIs('AWS::IAM::Role', 10);

      // CI/CD
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
      template.resourceCountIs('AWS::CodeBuild::Project', 1);
      template.resourceCountIs('AWS::CodeDeploy::Application', 1);
      template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 1);

      // Notifications
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::SNS::Subscription', 1);
      template.resourceCountIs('AWS::Lambda::Function', 1);

      // Monitoring
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
      template.resourceCountIs('AWS::Events::Rule', 2);

      // Outputs (CDK outputs are not CloudFormation resources)
      // template.resourceCountIs('AWS::CloudFormation::Output', 4);
    });
  });
});
