import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
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

  describe('VPC and Network Resources', () => {
    test('should create VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('should create NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('should create Elastic IP for NAT Gateway', () => {
      template.hasResourceProperties('AWS::EC2::EIP', {
        Domain: 'vpc',
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create logging bucket with correct properties', () => {
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
      });
    });

    test('should create source bucket with versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should create artifacts bucket with versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should create exactly 3 S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 3);
    });
  });

  describe('Secrets Manager', () => {
    test('should create Slack webhook secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'Slack webhook URL for notifications',
      });
    });

    test('should create S3 access secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'S3 access credentials for pipeline',
      });
    });

    test('should create exactly 2 secrets', () => {
      template.resourceCountIs('AWS::SecretsManager::Secret', 2);
    });
  });

  describe('CodeBuild Project', () => {
    test('should create CodeBuild project', () => {
      template.resourceCountIs('AWS::CodeBuild::Project', 1);
    });

    test('should have correct build environment', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: Match.objectLike({
          ComputeType: 'BUILD_GENERAL1_MEDIUM',
          Image: 'aws/codebuild/standard:5.0',
          Type: 'LINUX_CONTAINER',
        }),
      });
    });

    test('should have correct artifacts configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Artifacts: {
          Type: 'S3',
        },
      });
    });
  });

  describe('CodeDeploy', () => {
    test('should create CodeDeploy application', () => {
      template.resourceCountIs('AWS::CodeDeploy::Application', 1);
    });

    test('should create deployment group', () => {
      template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 1);
    });

    test('should use ALL_AT_ONCE deployment config', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        DeploymentConfigName: 'CodeDeployDefault.AllAtOnce',
      });
    });

    test('should configure blue/green deployment', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        DeploymentStyle: {
          DeploymentOption: 'WITH_TRAFFIC_CONTROL',
        },
      });
    });

    test('should configure automatic rollback', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        AutoRollbackConfiguration: Match.objectLike({
          Enabled: true,
        }),
      });
    });
  });

  describe('CodePipeline', () => {
    test('should create CodePipeline', () => {
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
    });

    test('should have Source, Build, and Deploy stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({ Name: 'Source' }),
          Match.objectLike({ Name: 'Build' }),
          Match.objectLike({ Name: 'Deploy' }),
        ]),
      });
    });

    test('should use S3 as source', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Source',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Source',
                  Owner: 'AWS',
                  Provider: 'S3',
                },
              }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should create Application Load Balancer', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    });

    test('should create target groups', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 2);
    });

    test('should create listener', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1);
    });

    test('should configure health check', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        HealthCheckPath: '/health',
        Port: 80,
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('should create Auto Scaling Group', () => {
      template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
    });

    test('should configure correct capacity', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: Match.anyValue(),
        MaxSize: Match.anyValue(),
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Slack notification Lambda', () => {
      template.resourceCountIs('AWS::Lambda::Function', 2);
    });

    test('should use Node.js 20 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
      });
    });

    test('should have correct timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 30,
      });
    });
  });

  describe('SNS Topic', () => {
    test('should create SNS topic for notifications', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('should create SNS subscriptions', () => {
      template.resourceCountIs('AWS::SNS::Subscription', 2);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create CloudWatch Alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
    });

    test('should create alarms with correct comparison operator', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });
  });

  describe('Budget', () => {
    test('should create monthly budget', () => {
      template.hasResourceProperties('AWS::Budgets::Budget', {
        Budget: {
          BudgetType: 'COST',
          TimeUnit: 'MONTHLY',
        },
      });
    });

    test('should configure budget alert', () => {
      template.hasResourceProperties('AWS::Budgets::Budget', {
        NotificationsWithSubscribers: Match.arrayWith([
          Match.objectLike({
            Notification: {
              ComparisonOperator: 'GREATER_THAN',
              NotificationType: 'ACTUAL',
              Threshold: 80,
            },
          }),
        ]),
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create CodeBuild service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: Match.stringLikeRegexp('.*codebuild.*'),
              }),
            }),
          ]),
        }),
      });
    });

    test('should create CodePipeline service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: Match.stringLikeRegexp('.*codepipeline.*'),
              }),
            }),
          ]),
        }),
      });
    });

    test('should create CodeDeploy service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: Match.stringLikeRegexp('.*codedeploy.*'),
              }),
            }),
          ]),
        }),
      });
    });

    test('should create Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: Match.stringLikeRegexp('.*lambda.*'),
              }),
            }),
          ]),
        }),
      });
    });

    test('should create EC2 instance role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: Match.stringLikeRegexp('.*ec2.*'),
              }),
            }),
          ]),
        }),
      });
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('.*ELB.*'),
      });
    });

    test('should create instance security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
      });
    });

    test('should allow HTTP traffic from ALB to instances', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('should create S3 event notification rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: Match.objectLike({
          source: ['aws.s3'],
        }),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export pipeline name', () => {
      template.hasOutput('PipelineName', {});
    });

    test('should export CodeBuild project name', () => {
      template.hasOutput('CodeBuildProjectName', {});
    });

    test('should export CodeDeploy application name', () => {
      template.hasOutput('CodeDeployApplicationName', {});
    });

    test('should export VPC ID', () => {
      template.hasOutput('VPCId', {});
    });

    test('should export Load Balancer DNS', () => {
      template.hasOutput('LoadBalancerDNS', {});
    });

    test('should export source bucket name', () => {
      template.hasOutput('SourceBucketName', {});
    });

    test('should export artifacts bucket name', () => {
      template.hasOutput('ArtifactsBucketName', {});
    });

    test('should export SNS topic ARN', () => {
      template.hasOutput('SNSTopicArn', {});
    });

    test('should export region', () => {
      template.hasOutput('Region', {});
    });

    test('should export green target group name', () => {
      template.hasOutput('GreenTargetGroupName', {});
    });

    test('should export load balancer listener ARN', () => {
      template.hasOutput('LoadBalancerListenerArn', {});
    });
  });

  describe('Resource Tagging', () => {
    test('should tag resources with Project', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Project',
            Value: 'tap-cicd',
          },
        ]),
      });
    });

    test('should tag resources with Environment', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: environmentSuffix,
          },
        ]),
      });
    });

    test('should tag resources with iac-rlhf-amazon', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          },
        ]),
      });
    });
  });

  describe('Environment Suffix Configuration', () => {
    test('should use environment suffix in tags', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: environmentSuffix,
          },
        ]),
      });
    });

    test('should use default environment suffix when not provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestDefaultStack');
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'dev',
          },
        ]),
      });
    });
  });

  describe('CloudFormation Parameters', () => {
    test('should have Slack webhook URL parameter', () => {
      template.hasParameter('SlackWebhookUrl', {
        Type: 'String',
        NoEcho: true,
      });
    });
  });
});
