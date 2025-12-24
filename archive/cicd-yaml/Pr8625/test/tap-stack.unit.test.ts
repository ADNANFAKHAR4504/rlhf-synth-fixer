import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
      
      // Verify tags are present
      const vpcs = template.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(vpcs)[0];
      const tags = vpcResource.Properties?.Tags || [];
      const projectTag = tags.find((tag: any) => tag.Key === 'Project');
      expect(projectTag?.Value).toBe('CI-CD-Example');
    });

    test('creates 2 public subnets', () => {
      const publicSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true
        }
      });
      expect(Object.keys(publicSubnets).length).toBe(2);
    });

    test('creates 2 private subnets', () => {
      const privateSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false
        }
      });
      expect(Object.keys(privateSubnets).length).toBe(2);
    });

    test('creates 2 NAT gateways for high availability', () => {
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      expect(Object.keys(natGateways).length).toBe(2);
    });

    test('creates Internet Gateway', () => {
      template.hasResource('AWS::EC2::InternetGateway', {});
    });
  });

  describe('S3 Artifacts Bucket', () => {
    test('creates S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('configures S3 bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        }
      });
    });

    test('configures S3 bucket with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteOldArtifacts',
              ExpirationInDays: 30,
              NoncurrentVersionExpiration: {
                NoncurrentDays: 7
              },
              Status: 'Enabled'
            })
          ])
        }
      });
    });

    test('configures S3 bucket with public access blocked', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('adds bucket policy to deny insecure connections', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false'
                }
              },
              Sid: 'DenyInsecureConnections'
            })
          ])
        }
      });
    });

    test('bucket has RemovalPolicy.DESTROY and autoDeleteObjects', () => {
      template.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete'
      });
      
      template.hasResource('Custom::S3AutoDeleteObjects', {
        Properties: Match.objectLike({
          BucketName: Match.anyValue()
        })
      });
    });
  });

  describe('SNS Notification Topic', () => {
    test('creates SNS topic for notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `ci-cd-notifications-${environmentSuffix}`,
        DisplayName: `CI/CD Pipeline Notifications - ${environmentSuffix}`
      });
    });

    test('configures SNS topic policy for EventBridge', () => {
      template.hasResourceProperties('AWS::SNS::TopicPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com'
              },
              Action: 'sns:Publish'
            })
          ])
        }
      });
    });
  });

  describe('Security Groups', () => {
    test('creates ALB security group with HTTP and HTTPS access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
            CidrIp: '0.0.0.0/0'
          }),
          Match.objectLike({
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp',
            CidrIp: '0.0.0.0/0'
          })
        ])
      });
    });

    test('creates EC2 security group with egress allowed', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: '-1',
            CidrIp: '0.0.0.0/0'
          })
        ])
      });
    });
  });

  describe('IAM Roles', () => {
    test('creates EC2 IAM role with required policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `ci-cd-ec2-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            })
          ])
        })
      });
      
      // Check managed policies separately
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          RoleName: `ci-cd-ec2-role-${environmentSuffix}`
        }
      });
      const roleResource = Object.values(roles)[0];
      const managedPolicies = roleResource?.Properties?.ManagedPolicyArns || [];
      expect(managedPolicies.some((arn: any) => JSON.stringify(arn).includes('CloudWatchAgentServerPolicy'))).toBe(true);
      expect(managedPolicies.some((arn: any) => JSON.stringify(arn).includes('AmazonSSMManagedInstanceCore'))).toBe(true);
    });

    test('creates CodeDeploy service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `ci-cd-codedeploy-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'codedeploy.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            })
          ])
        }
      });
    });

    test('creates CodeBuild service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `ci-cd-codebuild-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            })
          ])
        }
      });
    });

    test('creates CodePipeline service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `ci-cd-pipeline-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            })
          ])
        }
      });
    });
  });

  describe('Application Infrastructure', () => {
    test('creates launch template with correct instance type', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `ci-cd-launch-template-${environmentSuffix}`,
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.micro'
        })
      });
    });

    test('creates Auto Scaling Group with multi-AZ deployment', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: `ci-cd-asg-${environmentSuffix}`,
        MinSize: Match.anyValue(),
        MaxSize: Match.anyValue(),
        DesiredCapacity: Match.anyValue()
      });
    });

    test('creates Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `ci-cd-alb-${environmentSuffix}`,
        Type: 'application',
        Scheme: 'internet-facing'
      });
    });

    test('creates target group with health check', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: `ci-cd-tg-${environmentSuffix}`,
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckPath: '/',
        HealthCheckIntervalSeconds: 30,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 5
      });
    });

    test('creates ALB listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP'
      });
    });
  });

  describe('CodeDeploy Configuration', () => {
    test('creates CodeDeploy application', () => {
      template.hasResourceProperties('AWS::CodeDeploy::Application', {
        ApplicationName: `ci-cd-app-${environmentSuffix}`
      });
    });

    test('creates CodeDeploy deployment group with auto-rollback', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        DeploymentGroupName: `ci-cd-dg-${environmentSuffix}`,
        AutoRollbackConfiguration: {
          Enabled: true,
          Events: Match.arrayWith(['DEPLOYMENT_FAILURE', 'DEPLOYMENT_STOP_ON_REQUEST'])
        }
      });
    });
  });

  describe('CodeBuild Configuration', () => {
    test('creates CodeBuild project', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `ci-cd-project-${environmentSuffix}`,
        Environment: Match.objectLike({
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Type: 'LINUX_CONTAINER'
        })
      });
    });

    test('creates CloudWatch Log Group for CodeBuild', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codebuild/ci-cd-project-${environmentSuffix}`,
        RetentionInDays: 7
      });
    });
  });

  describe('CodePipeline Configuration', () => {
    test('creates CodePipeline', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: `ci-cd-pipeline-${environmentSuffix}`,
        Stages: Match.arrayWith([
          Match.objectLike({ Name: 'Source' }),
          Match.objectLike({ Name: 'Build' }),
          Match.objectLike({ Name: 'Deploy' })
        ])
      });
    });

    test('pipeline uses S3 source action', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Source',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: Match.objectLike({
                  Provider: 'S3',
                  Category: 'Source'
                })
              })
            ])
          })
        ])
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('creates EventBridge rule for CodeBuild state changes', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Description: 'Notify on CodeBuild state changes'
      });
    });

    test('creates EventBridge rule for CodePipeline state changes', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Description: 'Notify on CodePipeline state changes'
      });
    });
  });

  describe('Tagging', () => {
    test('all resources have required tags', () => {
      const resources = [
        'AWS::EC2::VPC',
        'AWS::S3::Bucket',
        'AWS::SNS::Topic',
        'AWS::EC2::SecurityGroup',
        'AWS::IAM::Role',
        'AWS::AutoScaling::AutoScalingGroup',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::CodeDeploy::Application',
        'AWS::CodeBuild::Project'
      ];

      resources.forEach(resourceType => {
        const foundResources = template.findResources(resourceType);
        Object.keys(foundResources).forEach(logicalId => {
          if (foundResources[logicalId].Properties?.Tags) {
            expect(foundResources[logicalId].Properties.Tags).toEqual(
              expect.arrayContaining([
                expect.objectContaining({ Key: 'Project', Value: 'CI-CD-Example' })
              ])
            );
          }
        });
      });
    });
  });

  describe('Stack Outputs', () => {
    test('outputs pipeline name', () => {
      template.hasOutput('PipelineName', {
        Description: 'Name of the CodePipeline'
      });
    });

    test('outputs artifacts bucket name', () => {
      template.hasOutput('ArtifactsBucketName', {
        Description: 'Name of the artifacts S3 bucket'
      });
    });

    test('outputs load balancer DNS', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'DNS name of the Application Load Balancer'
      });
    });
  });

  describe('Environment Suffix Usage', () => {
    test('all resource names include environment suffix', () => {
      // Check VPC
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: `ci-cd-vpc-${environmentSuffix}` })
        ])
      });

      // Check S3 bucket naming
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`ci-cd-artifacts-${environmentSuffix}.*`)
      });

      // Check CodePipeline naming
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: `ci-cd-pipeline-${environmentSuffix}`
      });

      // Check CodeBuild naming
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `ci-cd-project-${environmentSuffix}`
      });

      // Check CodeDeploy naming
      template.hasResourceProperties('AWS::CodeDeploy::Application', {
        ApplicationName: `ci-cd-app-${environmentSuffix}`
      });
    });
  });

  describe('Deployment Region', () => {
    test('stack is configured for us-west-2 region', () => {
      expect(stack.region).toBe('us-west-2');
    });
  });

  describe('Multi-AZ Requirements', () => {
    test('VPC spans multiple availability zones', () => {
      // Check that we have subnets in different AZs
      const subnets = template.findResources('AWS::EC2::Subnet');
      const uniqueAzs = new Set();
      
      Object.values(subnets).forEach(subnet => {
        const az = subnet.Properties?.AvailabilityZone;
        if (az) {
          // In test environment, AZs might be strings like 'dummy1a' and 'dummy1b'
          // Or they might be Fn::Select references
          uniqueAzs.add(JSON.stringify(az));
        }
      });
      
      // Should have at least 2 different AZs
      expect(uniqueAzs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('High Availability', () => {
    test('Auto Scaling Group has minimum 2 instances', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: Match.anyValue(),
        MaxSize: Match.anyValue()
      });

      const asg = template.findResources('AWS::AutoScaling::AutoScalingGroup');
      const asgResource = Object.values(asg)[0];
      expect(parseInt(asgResource.Properties?.MinSize || '0')).toBeGreaterThanOrEqual(2);
    });

    test('NAT Gateways deployed in multiple AZs', () => {
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      expect(Object.keys(natGateways).length).toBeGreaterThanOrEqual(2);
    });
  });
});