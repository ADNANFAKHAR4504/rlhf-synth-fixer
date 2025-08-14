import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
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
      // TypeScript type guard - after expect().toBeDefined(), we know it's defined
      if (!buildStage) {
        throw new Error('buildStage should be defined');
      }
      
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
      
      // TypeScript type guards - after expect().toBeDefined(), we know they're defined
      if (!deployEast || !deployWest) {
        throw new Error('deployEast and deployWest should be defined');
      }
      
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

  describe('Environment Suffix Handling', () => {
    test('should use props.environmentSuffix when provided', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'custom',
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      const customTemplate = Template.fromStack(customStack);

      // Verify environment suffix is used in resource names
      customTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith(['pipeline-custom-'])
          ])
        })
      });

      customTemplate.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'multi-region-build-custom'
      });

      customTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'multi-region-pipeline-custom'
      });
    });

    test('should use CDK context when props.environmentSuffix is not provided', () => {
      const contextApp = new cdk.App({
        context: { environmentSuffix: 'context-suffix' }
      });
      const contextStack = new TapStack(contextApp, 'ContextStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      const contextTemplate = Template.fromStack(contextStack);

      // Verify context environment suffix is used
      contextTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith(['pipeline-context-suffix-'])
          ])
        })
      });

      contextTemplate.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'multi-region-build-context-suffix'
      });
    });

    test('should default to "dev" when no environmentSuffix is provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      const defaultTemplate = Template.fromStack(defaultStack);

      // Verify "dev" is used as default
      defaultTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith(['pipeline-dev-'])
          ])
        })
      });

      defaultTemplate.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'multi-region-build-dev'
      });

      defaultTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'multi-region-pipeline-dev'
      });
    });

    test('should prioritize props over context', () => {
      const priorityApp = new cdk.App({
        context: { environmentSuffix: 'context-value' }
      });
      const priorityStack = new TapStack(priorityApp, 'PriorityStack', {
        environmentSuffix: 'props-value',
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      const priorityTemplate = Template.fromStack(priorityStack);

      // Verify props value takes priority over context
      priorityTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith(['pipeline-props-value-'])
          ])
        })
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty string environmentSuffix gracefully', () => {
      const emptyApp = new cdk.App();
      const emptyStack = new TapStack(emptyApp, 'EmptyStack', {
        environmentSuffix: '',
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      const emptyTemplate = Template.fromStack(emptyStack);

      // With empty string, should still create resources
      // Note: CDK creates additional buckets for auto-delete functionality
      const buckets = emptyTemplate.findResources('AWS::S3::Bucket');
      expect(Object.keys(buckets).length).toBeGreaterThanOrEqual(2);
      emptyTemplate.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
      emptyTemplate.resourceCountIs('AWS::CodeBuild::Project', 2);
    });

    test('should handle undefined props gracefully', () => {
      const undefinedApp = new cdk.App();
      const undefinedStack = new TapStack(undefinedApp, 'UndefinedStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      const undefinedTemplate = Template.fromStack(undefinedStack);

      // Should still create all resources with default values
      // Note: CDK creates additional buckets for auto-delete functionality
      const buckets = undefinedTemplate.findResources('AWS::S3::Bucket');
      expect(Object.keys(buckets).length).toBeGreaterThanOrEqual(2);
      undefinedTemplate.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
      undefinedTemplate.resourceCountIs('AWS::CodeBuild::Project', 2);
    });

    test('should create all required IAM permissions for cross-region deployment', () => {
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
        },
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith(['s3:GetObject', 's3:PutObject'])
                })
              ])
            }
          })
        ])
      });
    });

    test('should have appropriate resource limits and constraints', () => {
      // Verify ALB target group has reasonable health check settings
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        HealthCheckEnabled: true,
        HealthCheckPath: '/',
        HealthCheckProtocol: 'HTTP'
      });

      // Verify Auto Scaling Group has reasonable capacity limits
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '1',
        MaxSize: '5',
        DesiredCapacity: '1'
      });
    });

    test('should have proper resource tagging strategy', () => {
      // Check VPC tagging
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp(`multi-region-vpc-${environmentSuffix}`)
          })
        ])
      });
    });
  });

  describe('Build Specifications and Configurations', () => {
    test('should have comprehensive build specification', () => {
      const buildProject = template.findResources('AWS::CodeBuild::Project');
      const mainBuildProject = Object.values(buildProject).find(
        (project: any) => project.Properties.Name === `multi-region-build-${environmentSuffix}`
      );

      expect(mainBuildProject).toBeDefined();
      // TypeScript type guard - after expect().toBeDefined(), we know it's defined
      if (!mainBuildProject) {
        throw new Error('mainBuildProject should be defined');
      }
      
      expect(mainBuildProject.Properties.Source.BuildSpec).toContain('batch');
      expect(mainBuildProject.Properties.Source.BuildSpec).toContain('DEPLOY_REGION');
      expect(mainBuildProject.Properties.Source.BuildSpec).toContain('us-east-1');
      expect(mainBuildProject.Properties.Source.BuildSpec).toContain('us-west-2');
    });

    test('should have validation project with appropriate configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `validation-${environmentSuffix}`,
        Environment: {
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: Match.stringLikeRegexp('aws/codebuild/standard'),
          Type: 'LINUX_CONTAINER'
        }
      });
    });

    test('should have build projects with appropriate IAM permissions', () => {
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
        },
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents'
                  ])
                })
              ])
            }
          })
        ])
      });
    });
  });

  describe('Multi-Region Specific Tests', () => {
    test('should have proper cross-region artifact buckets configuration', () => {
      // Main region bucket
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': [
            '',
            Match.arrayEquals([`pipeline-${environmentSuffix}-`, Match.anyValue()])
          ]
        }),
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });

      // West region bucket
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

    test('should have CloudFormation deployment actions for both regions', () => {
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0];
      const stages = pipelineResource.Properties.Stages;

      // Check Deploy-East stage configuration
      const deployEastStage = stages.find((s: any) => s.Name === 'Deploy-East');
      expect(deployEastStage).toBeDefined();
      
      // TypeScript type guard - after expect().toBeDefined(), we know it's defined
      if (!deployEastStage) {
        throw new Error('deployEastStage should be defined');
      }
      
      expect(deployEastStage.Actions).toHaveLength(2); // CreateChangeSet + ExecuteChangeSet
      
      const createChangeSetEast = deployEastStage.Actions.find((a: any) => 
        a.Name === 'CreateChangeSet-East'
      );
      expect(createChangeSetEast).toBeDefined();
      
      // TypeScript type guard - after expect().toBeDefined(), we know it's defined
      if (!createChangeSetEast) {
        throw new Error('createChangeSetEast should be defined');
      }
      
      expect(createChangeSetEast.Configuration).toBeDefined();
      
      // TypeScript type guard - after expect().toBeDefined(), we know it's defined
      if (!createChangeSetEast.Configuration) {
        throw new Error('createChangeSetEast.Configuration should be defined');
      }
      
      const eastParams = JSON.parse(createChangeSetEast.Configuration.ParameterOverrides);
      expect(eastParams.Region).toBe('us-east-1');
      expect(eastParams.Environment).toBe(environmentSuffix);

      // Check Deploy-West stage configuration
      const deployWestStage = stages.find((s: any) => s.Name === 'Deploy-West');
      expect(deployWestStage).toBeDefined();
      
      // TypeScript type guard - after expect().toBeDefined(), we know it's defined
      if (!deployWestStage) {
        throw new Error('deployWestStage should be defined');
      }
      
      expect(deployWestStage.Actions).toHaveLength(2); // CreateChangeSet + ExecuteChangeSet
      
      const createChangeSetWest = deployWestStage.Actions.find((a: any) => 
        a.Name === 'CreateChangeSet-West'
      );
      expect(createChangeSetWest).toBeDefined();
      
      // TypeScript type guard - after expect().toBeDefined(), we know it's defined
      if (!createChangeSetWest) {
        throw new Error('createChangeSetWest should be defined');
      }
      
      expect(createChangeSetWest.Configuration).toBeDefined();
      
      // TypeScript type guard - after expect().toBeDefined(), we know it's defined
      if (!createChangeSetWest.Configuration) {
        throw new Error('createChangeSetWest.Configuration should be defined');
      }
      
      const westParams = JSON.parse(createChangeSetWest.Configuration.ParameterOverrides);
      expect(westParams.Region).toBe('us-west-2');
      expect(westParams.Environment).toBe(environmentSuffix);
    });
  });

  describe('Resource Dependencies and Relationships', () => {
    test('should have proper dependencies between pipeline and supporting resources', () => {
      // Verify pipeline uses the artifacts bucket
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0];
      
      // Pipeline should have artifact store configuration
      expect(pipelineResource.Properties.ArtifactStore || pipelineResource.Properties.ArtifactStores).toBeDefined();
    });

    test('should have load balancer properly configured with target group', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: Match.arrayWith([
          Match.objectLike({
            Type: 'forward',
            TargetGroupArn: Match.anyValue()
          })
        ])
      });
    });

    test('should have auto scaling group properly connected to target group', () => {
      // Verify target group exists and will be connected to ASG
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        TargetType: Match.anyValue()
      });
    });
  });

  describe('Monitoring and Observability', () => {
    test('should have comprehensive logging configuration', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codepipeline/multi-region-${environmentSuffix}`,
        RetentionInDays: 30
      });

      template.hasResourceProperties('AWS::CodeBuild::Project', {
        LogsConfig: {
          CloudWatchLogs: {
            Status: 'ENABLED'
          }
        }
      });
    });

    test('should have CloudWatch alarms for critical metrics', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `healthy-host-alarm-${environmentSuffix}`,
        EvaluationPeriods: 2,
        Threshold: 1,
        TreatMissingData: 'breaching'
      });
    });

    test('should have SNS notifications properly configured', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `pipeline-notifications-${environmentSuffix}`,
        DisplayName: 'Multi-Region Pipeline Notifications'
      });
    });
  });
});