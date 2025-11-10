import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1', account: '097219365021' },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'iac-rlhf-amazon', Value: 'true' }),
          Match.objectLike({ Key: 'ManagedBy', Value: 'CDK' }),
        ]),
      });
    });

    test('should create 2 public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        CidrBlock: '10.0.0.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        CidrBlock: '10.0.1.0/24',
      });
    });

    test('should create 2 private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        CidrBlock: '10.0.2.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        CidrBlock: '10.0.3.0/24',
      });
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.hasResourceProperties('AWS::EC2::InternetGateway', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'iac-rlhf-amazon', Value: 'true' }),
        ]),
      });
    });

    test('should create NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });
  });

  describe('S3 Buckets', () => {
    test('should create source bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'tap-dev-pipeline-source-097219365021-ap-northeast-1',
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'iac-rlhf-amazon', Value: 'true' }),
        ]),
      });
    });

    test('should create artifacts bucket with lifecycle policy', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'tap-dev-pipeline-artifacts-097219365021-ap-northeast-1',
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'cleanup-old-artifacts',
              Status: 'Enabled',
              ExpirationInDays: 7,
            },
          ],
        },
      });
    });

    test('should create logging bucket with Glacier transition', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'tap-dev-pipeline-logs-097219365021-ap-northeast-1',
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'transition-to-glacier',
              Status: 'Enabled',
              ExpirationInDays: 90,
              Transitions: [
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 30,
                },
              ],
            },
          ],
        },
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create CodeBuild role with proper permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-dev-codebuild-role',
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
            }),
          ]),
        }),
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'iac-rlhf-amazon', Value: 'true' }),
        ]),
      });
    });

    test('should create CodeDeploy role with inline policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-dev-codedeploy-role',
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codedeploy.amazonaws.com',
              },
            }),
          ]),
        }),
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'CodeDeployPolicy',
          }),
        ]),
      });
    });

    test('should create CodePipeline role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-dev-pipeline-role',
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
            }),
          ]),
        }),
      });
    });

    test('should create EC2 instance role with SSM permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-dev-ec2-role',
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                'arn:',
                Match.objectLike({ Ref: 'AWS::Partition' }),
                ':iam::aws:policy/CloudWatchAgentServerPolicy',
              ]),
            ]),
          }),
        ]),
      });
    });
  });

  describe('SSM Parameters', () => {
    test('should create CodeBuild image parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/tap-dev/codebuild/image',
        Value: 'aws/codebuild/amazonlinux2-x86_64-standard:4.0',
        Type: 'String',
        Description: 'CodeBuild image for the pipeline',
      });
    });

    test('should create Node.js version parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/tap-dev/codebuild/node-version',
        Value: '18',
        Type: 'String',
      });
    });

    test('should create deployment config parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/tap-dev/codedeploy/config',
        Value: 'CodeDeployDefault.HalfAtATime',
        Type: 'String',
      });
    });
  });

  describe('CodeDeploy Configuration', () => {
    test('should create CodeDeploy application', () => {
      template.hasResourceProperties('AWS::CodeDeploy::Application', {
        ApplicationName: 'tap-dev-application',
      });
    });

    test('should create deployment group with auto-rollback', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        DeploymentGroupName: 'tap-dev-deployment-group',
        AutoRollbackConfiguration: {
          Enabled: true,
          Events: Match.arrayWith([
            'DEPLOYMENT_FAILURE',
            'DEPLOYMENT_STOP_ON_ALARM',
          ]),
        },
      });
    });
  });

  describe('CodeBuild Project', () => {
    test('should create CodeBuild project with correct environment', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'tap-dev-build-project',
        Environment: {
          Type: 'LINUX_CONTAINER',
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:5.0',
        },
        Source: {
          Type: 'CODEPIPELINE',
        },
      });
    });
  });

  describe('CodePipeline', () => {
    test('should create pipeline with S3 source stage', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'tap-dev-pipeline',
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Source',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'S3Source',
                ActionTypeId: Match.objectLike({
                  Category: 'Source',
                  Owner: 'AWS',
                  Provider: 'S3',
                }),
              }),
            ]),
          }),
        ]),
      });
    });

    test('should include Build stage', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Build',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'BuildAction',
                ActionTypeId: Match.objectLike({
                  Category: 'Build',
                  Provider: 'CodeBuild',
                }),
              }),
            ]),
          }),
        ]),
      });
    });

    test('should include Deploy stage', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Deploy',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'DeployToEC2',
                ActionTypeId: Match.objectLike({
                  Category: 'Deploy',
                  Provider: 'CodeDeploy',
                }),
              }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('SNS Notifications', () => {
    test('should create SNS topic for pipeline notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'tap-dev-pipeline-notifications',
        DisplayName: 'Pipeline notifications for dev environment',
      });
    });

    test('should have SNS topic policy', () => {
      template.hasResourceProperties('AWS::SNS::TopicPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com',
              },
              Action: 'sns:Publish',
            }),
          ]),
        }),
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create deployment failure alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'tap-dev-deployment-failure',
        Threshold: 1,
        EvaluationPeriods: 1,
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('should create ASG with correct instance type for dev', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '1',
        MaxSize: '3',
        DesiredCapacity: '1',
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'iac-rlhf-amazon', Value: 'true', PropagateAtLaunch: true }),
        ]),
      });
    });

    test('should create launch template with t3.micro for dev', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.micro',
          IamInstanceProfile: Match.objectLike({}),
          UserData: Match.anyValue(),
        }),
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should create ALB', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: 'tap-dev-alb',
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('should create blue and green target groups with health checks', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 2);

      // Blue target group
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: 'tap-dev-blue-tg',
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckPath: '/',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
      });

      // Green target group
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: 'tap-dev-green-tg',
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    test('should create listeners on ports 80 and 8080 for blue/green', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 2);

      // Production listener on port 80
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: Match.arrayWith([
          Match.objectLike({
            Type: 'forward',
          }),
        ]),
      });

      // Test listener on port 8080
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 8080,
        Protocol: 'HTTP',
        DefaultActions: Match.arrayWith([
          Match.objectLike({
            Type: 'forward',
          }),
        ]),
      });
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group allowing HTTP traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('should create EC2 security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('should create log group for CodeBuild', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/codebuild/tap-dev-build-project',
      });
    });
  });

  describe('Event Rules', () => {
    test('should create EventBridge rule for S3 source changes', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        State: 'ENABLED',
        EventPattern: Match.objectLike({
          source: ['aws.s3'],
          'detail-type': ['AWS API Call via CloudTrail'],
          detail: Match.objectLike({
            eventName: ['CompleteMultipartUpload', 'CopyObject', 'PutObject'],
            requestParameters: Match.objectLike({
              key: ['source.zip'],
            }),
          }),
        }),
      });
    });
  });

  describe('Tags', () => {
    test('all resources should have required tags', () => {
      const resources = template.toJSON().Resources;
      const taggableResources = Object.entries(resources).filter(
        ([_, resource]: [string, any]) =>
          resource.Properties?.Tags || resource.Properties?.TagSet
      );

      taggableResources.forEach(([id, resource]: [string, any]) => {
        const tags = resource.Properties.Tags || resource.Properties.TagSet;
        if (Array.isArray(tags)) {
          const hasIacTag = tags.some(
            (tag: any) => tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true'
          );
          const hasEnvTag = tags.some(
            (tag: any) => tag.Key === 'Environment' && tag.Value === 'dev'
          );

          expect(hasIacTag || hasEnvTag).toBeTruthy();
        }
      });
    });
  });

  describe('Production Environment Configuration', () => {
    test('should use larger instances for production', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdTestStack', {
        environmentSuffix: 'prod',
        env: { region: 'ap-northeast-1', account: '097219365021' },
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.large',
        }),
      });
    });

    test('should use higher capacity for production', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdTestStack', {
        environmentSuffix: 'prod',
        env: { region: 'ap-northeast-1', account: '097219365021' },
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '10',
        DesiredCapacity: '2',
      });
    });

    test('should include manual approval stage for production', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdTestStack', {
        environmentSuffix: 'prod',
        env: { region: 'ap-northeast-1', account: '097219365021' },
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'ManualApproval',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'ApproveDeployment',
                ActionTypeId: Match.objectLike({
                  Category: 'Approval',
                  Provider: 'Manual',
                }),
              }),
            ]),
          }),
        ]),
      });
    });

    test('should use different lifecycle policies for production', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdTestStack', {
        environmentSuffix: 'prod',
        env: { region: 'ap-northeast-1', account: '097219365021' },
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'tap-prod-pipeline-logs-097219365021-ap-northeast-1',
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'transition-to-glacier',
              Status: 'Enabled',
              ExpirationInDays: 365,
              Transitions: [
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 60,
                },
              ],
            },
          ],
        },
      });
    });
  });

  describe('Staging Environment Configuration', () => {
    test('should use appropriate instances for staging', () => {
      const stagingApp = new cdk.App();
      const stagingStack = new TapStack(stagingApp, 'StagingTestStack', {
        environmentSuffix: 'staging',
        env: { region: 'ap-northeast-1', account: '097219365021' },
      });
      const stagingTemplate = Template.fromStack(stagingStack);

      stagingTemplate.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.small',
        }),
      });
    });

    test('should use appropriate capacity for staging', () => {
      const stagingApp = new cdk.App();
      const stagingStack = new TapStack(stagingApp, 'StagingTestStack', {
        environmentSuffix: 'staging',
        env: { region: 'ap-northeast-1', account: '097219365021' },
      });
      const stagingTemplate = Template.fromStack(stagingStack);

      stagingTemplate.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '5',
        DesiredCapacity: '2',
      });
    });
  });

  describe('Context Configuration', () => {
    test('should add email subscription when notificationEmail is provided', () => {
      const emailApp = new cdk.App({ context: { notificationEmail: 'test@example.com' } });
      const emailStack = new TapStack(emailApp, 'EmailTestStack', {
        environmentSuffix: 'dev',
        env: { region: 'ap-northeast-1', account: '097219365021' },
      });
      const emailTemplate = Template.fromStack(emailStack);

      emailTemplate.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com',
      });
    });

    test('should not add email subscription when notificationEmail is not provided', () => {
      // This is the default test case (emailStack without context)
      const noEmailApp = new cdk.App();
      const noEmailStack = new TapStack(noEmailApp, 'NoEmailTestStack', {
        environmentSuffix: 'dev',
        env: { region: 'ap-northeast-1', account: '097219365021' },
      });
      const noEmailTemplate = Template.fromStack(noEmailStack);

      // Should not have email subscription
      expect(() => {
        noEmailTemplate.hasResourceProperties('AWS::SNS::Subscription', {
          Protocol: 'email',
        });
      }).toThrow();
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should create CloudWatch Dashboard with pipeline widgets', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'tap-dev-pipeline-dashboard',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export environment output', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs).toHaveProperty('EnvironmentOutput');
      expect(outputs.EnvironmentOutput.Description).toContain('environment');
    });

    test('should export pipeline name output', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs).toHaveProperty('PipelineNameOutput');
    });

    test('should export source bucket output', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs).toHaveProperty('SourceBucketOutput');
    });

    test('should export ALB DNS output', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs).toHaveProperty('ALBDnsOutput');
    });
  });
});
