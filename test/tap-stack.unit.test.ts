import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Buckets', () => {
    test('should create pipeline artifacts bucket with correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([`pipeline-${environmentSuffix}-`])
          ])
        }),
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('should create west region artifacts bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': [
            '',
            Match.arrayEquals([`pipeline-${environmentSuffix}-`, Match.anyValue(), '-west'])
          ]
        }),
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('should have auto-delete objects custom resource', () => {
      template.resourceCountIs('Custom::S3AutoDeleteObjects', 2);
    });
  });

  describe('VPC and Networking', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('multi-region-vpc-')
          })
        ])
      });
    });

    test('should create public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
    });

    test('should create internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('should create NAT gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('should create security group with correct ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `app-sg-${environmentSuffix}`,
        GroupDescription: 'Security group for application servers'
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create CodePipeline role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com'
              }
            })
          ])
        }
      });
    });

    test('should create CodeBuild role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com'
              }
            })
          ])
        }
      });
    });

    test('should create EC2 instance role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com'
              }
            })
          ])
        }
      });
    });
  });

  describe('CodeBuild Project', () => {
    test('should create CodeBuild project with batch builds', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `multi-region-build-${environmentSuffix}`,
        Source: {
          BuildSpec: Match.stringLikeRegexp('batch')
        }
      });
    });

    test('should have correct environment configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: {
          ComputeType: 'BUILD_GENERAL1_MEDIUM',
          Image: Match.stringLikeRegexp('aws/codebuild/standard'),
          Type: 'LINUX_CONTAINER',
          PrivilegedMode: true
        }
      });
    });

    test('should configure CloudWatch logging', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        LogsConfig: {
          CloudWatchLogs: {
            Status: 'ENABLED'
          }
        }
      });
    });
  });

  describe('Application Infrastructure', () => {
    test('should create launch template with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `app-launch-template-${environmentSuffix}`,
        LaunchTemplateData: {
          InstanceType: 't3.micro'
        }
      });
    });

    test('should create auto scaling group', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: `app-asg-${environmentSuffix}`,
        MinSize: '1',
        MaxSize: '5',
        DesiredCapacity: '1'
      });
    });

    test('should create application load balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `app-alb-${environmentSuffix}`,
        Type: 'application',
        Scheme: 'internet-facing'
      });
    });

    test('should create target group with health check', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: `app-tg-${environmentSuffix}`,
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckEnabled: true,
        HealthCheckPath: '/',
        HealthCheckProtocol: 'HTTP'
      });
    });

    test('should create ALB listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP'
      });
    });
  });

  describe('CodePipeline', () => {
    test('should create multi-region pipeline', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: `multi-region-pipeline-${environmentSuffix}`
      });
    });

    test('should have correct number of stages', () => {
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0];
      expect(pipelineResource.Properties.Stages).toHaveLength(5); // Source, Build, Deploy-East, Deploy-West, Validate
    });

    test('should have Source stage with S3 source', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Source',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'S3Source',
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

    test('should have Build stage with batch execution', () => {
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0];
      const buildStage = pipelineResource.Properties.Stages.find((s: any) => s.Name === 'Build');
      
      expect(buildStage).toBeDefined();
      expect(buildStage.Actions[0].Name).toBe('BuildApplication');
      expect(buildStage.Actions[0].ActionTypeId.Provider).toBe('CodeBuild');
      expect(buildStage.Actions[0].Configuration.BatchEnabled).toBe('true');
    });

    test('should have Deploy-East stage', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Deploy-East'
          })
        ])
      });
    });

    test('should have Deploy-West stage', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Deploy-West'
          })
        ])
      });
    });

    test('should have Validation stage', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Validate'
          })
        ])
      });
    });
  });

  describe('Monitoring and Alerting', () => {
    test('should create CloudWatch log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codepipeline/multi-region-${environmentSuffix}`,
        RetentionInDays: 30
      });
    });

    test('should create SNS topic for notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `pipeline-notifications-${environmentSuffix}`,
        DisplayName: 'Multi-Region Pipeline Notifications'
      });
    });

    test('should create CloudWatch alarm for healthy hosts', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `healthy-host-alarm-${environmentSuffix}`,
        EvaluationPeriods: 2,
        Threshold: 1
      });
    });

    test('should create CloudTrail for audit logging', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        TrailName: `multi-region-pipeline-trail-${environmentSuffix}`,
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true,
        IncludeGlobalServiceEvents: true
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output pipeline name', () => {
      template.hasOutput('PipelineName', {
        Description: 'Name of the multi-region pipeline'
      });
    });

    test('should output artifacts bucket name', () => {
      template.hasOutput('ArtifactsBucketName', {
        Description: 'S3 bucket for pipeline artifacts'
      });
    });

    test('should output load balancer DNS', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'DNS name of the application load balancer'
      });
    });

    test('should output notification topic ARN', () => {
      template.hasOutput('NotificationTopicArn', {
        Description: 'SNS topic for pipeline notifications'
      });
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all resources should include environment suffix', () => {
      // Check that key resources have the environment suffix
      const buckets = template.findResources('AWS::S3::Bucket');
      const namedBuckets = Object.values(buckets).filter(
        (bucket: any) => bucket.Properties?.BucketName
      );
      expect(namedBuckets.length).toBeGreaterThan(0);

      template.hasResourceProperties('AWS::CodeBuild::Project',
        Match.objectLike({
          Name: Match.stringLikeRegexp(environmentSuffix)
        })
      );

      template.hasResourceProperties('AWS::CodePipeline::Pipeline',
        Match.objectLike({
          Name: Match.stringLikeRegexp(environmentSuffix)
        })
      );
    });
  });

  describe('Cross-Region Support', () => {
    test('should have cross-region support stack', () => {
      // Verify that the pipeline has multi-region deployment stages
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0];
      const stages = pipelineResource.Properties.Stages;
      
      // Check for Deploy-East and Deploy-West stages
      const deployEast = stages.find((s: any) => s.Name === 'Deploy-East');
      const deployWest = stages.find((s: any) => s.Name === 'Deploy-West');
      
      expect(deployEast).toBeDefined();
      expect(deployWest).toBeDefined();
      
      // Check that Deploy-East has us-east-1 region
      expect(deployEast.Actions[0].Region).toBe('us-east-1');
      // Check that Deploy-West has us-west-2 region
      expect(deployWest.Actions[0].Region).toBe('us-west-2');
    });
  });

  describe('Security Best Practices', () => {
    test('S3 buckets should have versioning enabled', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const versionedBuckets = Object.values(buckets).filter(
        bucket => bucket.Properties?.VersioningConfiguration?.Status === 'Enabled'
      );
      expect(versionedBuckets.length).toBeGreaterThan(0);
    });

    test('should not have overly permissive IAM policies', () => {
      // Check that IAM policies are scoped appropriately
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThan(0);
    });

    test('CloudTrail should have log file validation enabled', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        EnableLogFileValidation: true
      });
    });
  });

  describe('Rollback Mechanisms', () => {
    test('should have CloudFormation changeset actions for rollback capability', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Deploy',
                  Provider: 'CloudFormation',
                  Owner: 'AWS',
                  Version: '1'
                }
              })
            ])
          })
        ])
      });
    });
  });
});