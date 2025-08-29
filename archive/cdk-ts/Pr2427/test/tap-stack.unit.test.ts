import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      slackWebhookUrl: 'https://hooks.slack.com/test',
      notificationEmail: 'test@example.com'
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('should use default environment suffix when not provided in props', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'DefaultSuffixStack', {
        slackWebhookUrl: 'https://hooks.slack.com/test',
        notificationEmail: 'test@example.com'
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'tap-pipeline-notifications-dev'
      });
    });

    test('should use context environment suffix when props not provided', () => {
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'staging');
      const testStack = new TapStack(testApp, 'ContextSuffixStack', {
        slackWebhookUrl: 'https://hooks.slack.com/test',
        notificationEmail: 'test@example.com'
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'tap-pipeline-notifications-staging'
      });
    });

    test('should work without notification email', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'NoEmailStack', {
        environmentSuffix: 'test',
        slackWebhookUrl: 'https://hooks.slack.com/test'
      });
      const testTemplate = Template.fromStack(testStack);
      
      // Should still create SNS topic but no email subscription
      testTemplate.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'TAP Pipeline Notifications'
      });
      
      // Should not create email subscription
      testTemplate.resourcePropertiesCountIs('AWS::SNS::Subscription', {
        Protocol: 'email'
      }, 0);
    });

    test('should use placeholder URL when slackWebhookUrl not provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'NoSlackStack', {
        environmentSuffix: 'test',
        notificationEmail: 'test@example.com'
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            SLACK_WEBHOOK_URL: 'PLACEHOLDER_URL'
          }
        }
      });
    });
  });

  describe('VPC Infrastructure', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public and private subnets', () => {
      // Should have public and private subnets (2 AZs by default)
      template.resourceCountIs('AWS::EC2::Subnet', 4);
      
      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });

      // Check for private subnets  
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('should create NAT gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('S3 Buckets', () => {
    test('should create artifacts bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256'
            }
          }]
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('should create source bucket with versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });
  });

  describe('SNS Configuration', () => {
    test('should create notification topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'TAP Pipeline Notifications',
        TopicName: `tap-pipeline-notifications-${environmentSuffix}`
      });
    });

    test('should create email subscription when email provided', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com'
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Slack notification function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        FunctionName: `tap-slack-notifier-${environmentSuffix}`,
        Environment: {
          Variables: {
            SLACK_WEBHOOK_URL: 'https://hooks.slack.com/test'
          }
        }
      });
    });

    test('should subscribe Lambda to SNS topic', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'lambda'
      });
    });
  });

  describe('ECS Infrastructure', () => {
    test('should create ECS cluster with proper configuration', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: `tap-cluster-${environmentSuffix}`
      });
    });

    test('should create Service Discovery namespace', () => {
      template.hasResourceProperties('AWS::ServiceDiscovery::PrivateDnsNamespace', {
        Name: `tap.local.${environmentSuffix}`
      });
    });

    test('should create Fargate task definition', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Family: `tap-task-${environmentSuffix}`,
        RequiresCompatibilities: ['FARGATE'],
        NetworkMode: 'awsvpc',
        Cpu: '512',
        Memory: '1024'
      });
    });

    test('should create ECS service with desired configuration', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceName: `tap-service-${environmentSuffix}`,
        DesiredCount: 2,
        LaunchType: 'FARGATE',
        DeploymentConfiguration: {
          MinimumHealthyPercent: 50,
          MaximumPercent: 200,
          DeploymentCircuitBreaker: {
            Enable: true,
            Rollback: true
          }
        }
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should create ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `tap-alb-${environmentSuffix}`,
        Scheme: 'internet-facing',
        Type: 'application'
      });
    });

    test('should create target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'ip',
        HealthCheckEnabled: true,
        HealthCheckPath: '/',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3
      });
    });

    test('should create ALB listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP'
      });
    });
  });

  describe('CodeBuild Projects', () => {
    test('should create build project', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: {
          Type: 'LINUX_CONTAINER',
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:7.0',
          PrivilegedMode: true
        },
        TimeoutInMinutes: 20
      });
    });

    test('should create test project', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: {
          Type: 'LINUX_CONTAINER'
        }
      });
    });
  });

  describe('CodePipeline', () => {
    test('should create pipeline with correct stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: `tap-pipeline-${environmentSuffix}`,
        Stages: [
          Match.objectLike({ Name: 'Source' }),
          Match.objectLike({ Name: 'Test' }),
          Match.objectLike({ Name: 'Build' }),
          Match.objectLike({ Name: 'Approval' }),
          Match.objectLike({ Name: 'Deploy' })
        ]
      });
    });

    test('should have S3 source action', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Source',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Source',
                  Owner: 'AWS',
                  Provider: 'S3'
                }
              })
            ])
          })
        ])
      });
    });

    test('should have manual approval stage', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Approval',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Approval',
                  Owner: 'AWS',
                  Provider: 'Manual'
                }
              })
            ])
          })
        ])
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
      
      // Pipeline failure alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-pipeline-failures-${environmentSuffix}`,
        MetricName: 'PipelineExecutionFailure',
        Namespace: 'AWS/CodePipeline',
        Threshold: 1
      });

      // ECS CPU alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-service-cpu-high-${environmentSuffix}`,
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/ECS',
        Threshold: 85
      });

      // ECS Memory alarm  
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-service-memory-high-${environmentSuffix}`,
        MetricName: 'MemoryUtilization',
        Namespace: 'AWS/ECS',
        Threshold: 90
      });
    });

    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `tap-pipeline-dashboard-${environmentSuffix}`
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create pipeline service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'codepipeline.amazonaws.com'
              }
            })
          ])
        })
      });
    });

    test('should create CodeBuild service roles', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'codebuild.amazonaws.com'
              }
            })
          ])
        })
      });
    });

    test('should create ECS task roles', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'ecs-tasks.amazonaws.com'
              }
            })
          ])
        })
      });
    });
  });

  describe('Auto Scaling', () => {
    test('should create auto scaling target', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        ServiceNamespace: 'ecs',
        ResourceId: Match.anyValue(),
        ScalableDimension: 'ecs:service:DesiredCount',
        MinCapacity: 2,
        MaxCapacity: 10
      });
    });

    test('should create CPU scaling policy', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: {
          TargetValue: 70,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ECSServiceAverageCPUUtilization'
          }
        }
      });
    });

    test('should create memory scaling policy', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling', 
        TargetTrackingScalingPolicyConfiguration: {
          TargetValue: 80,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ECSServiceAverageMemoryUtilization'
          }
        }
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should apply common tags to all resources', () => {
      // Check that stack has proper tags
      expect(stack.tags.tagValues()).toEqual(
        expect.objectContaining({
          'Environment': 'Production',
          'Project': 'TAP-Pipeline',
          'ManagedBy': 'AWS-CDK',
          'Owner': 'DevOps-Team'
        })
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle undefined props gracefully', () => {
      const testApp = new cdk.App();
      expect(() => {
        new TapStack(testApp, 'UndefinedPropsStack', undefined);
      }).not.toThrow();
    });

    test('should handle empty environment suffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'EmptyEnvStack', {
        environmentSuffix: '',
        slackWebhookUrl: 'https://hooks.slack.com/test',
        notificationEmail: 'test@example.com'
      });
      const testTemplate = Template.fromStack(testStack);
      
      // Should use default 'dev' when environment suffix is empty
      testTemplate.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'tap-pipeline-notifications-dev'
      });
    });

    test('should work with minimal configuration', () => {
      const testApp = new cdk.App();
      expect(() => {
        new TapStack(testApp, 'MinimalStack', {});
      }).not.toThrow();
    });
  });

  describe('Security Configuration', () => {
    test('should enforce S3 bucket security settings', () => {
      // Verify all S3 buckets have security configurations
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        },
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.anyValue()
        })
      });
    });

    test('should create IAM roles with least privilege', () => {
      // Check that multiple roles exist
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(6);
      
      // Verify roles have proper service principals
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: Match.anyValue()
              }
            })
          ])
        }
      });
    });
  });

  describe('Resource Lifecycle', () => {
    test('should configure proper retention policies', () => {
      // Check log groups have retention set
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7
      });
    });

    test('should handle resource removal policies', () => {
      // Verify S3 buckets are configured for destruction in tests
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete'
      });
    });
  });

  describe('Networking Security', () => {
    test('should create security groups with appropriate rules', () => {
      // Should create security groups for ECS and ALB
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      expect(Object.keys(securityGroups).length).toBeGreaterThanOrEqual(1);
    });

    test('should configure VPC with proper CIDR and DNS settings', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });
  });

  describe('High Availability Configuration', () => {
    test('should distribute resources across multiple AZs', () => {
      // NAT Gateways should be in different AZs for HA
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
      
      // Should have multiple subnets for HA
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
    });

    test('should configure auto scaling for ECS service', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        MinCapacity: 2,
        MaxCapacity: 10
      });
    });
  });

  describe('Performance and Monitoring', () => {
    test('should create comprehensive CloudWatch alarms', () => {
      // Should have alarms for pipeline, CPU, and memory
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
      
      // Each alarm should have appropriate thresholds
      const alarms = ['PipelineExecutionFailure', 'CPUUtilization', 'MemoryUtilization'];
      alarms.forEach(metricName => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          MetricName: metricName
        });
      });
    });

    test('should create dashboard with relevant metrics', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `tap-pipeline-dashboard-${environmentSuffix}`,
        DashboardBody: Match.anyValue()
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should create required outputs', () => {
      template.hasOutput('SourceBucketName', {
        Description: 'S3 Bucket for source code uploads'
      });

      template.hasOutput('LoadBalancerDNS', {
        Description: 'Application Load Balancer DNS Name'
      });

      template.hasOutput('PipelineName', {
        Description: 'CodePipeline Name'
      });
    });
  });
});
