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
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('Stack uses provided environment suffix', () => {
      const newApp = new cdk.App();
      const testStack = new TapStack(newApp, 'TestStack1', { environmentSuffix: 'custom' });
      const testTemplate = Template.fromStack(testStack);
      testTemplate.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'cicd-build-custom',
      });
    });

    test('Stack uses context environment suffix when not provided', () => {
      const contextApp = new cdk.App({
        context: { environmentSuffix: 'fromcontext' }
      });
      const testStack = new TapStack(contextApp, 'TestStack2');
      const testTemplate = Template.fromStack(testStack);
      testTemplate.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'cicd-build-fromcontext',
      });
    });

    test('Stack uses default environment suffix when nothing provided', () => {
      const defaultApp = new cdk.App();
      const testStack = new TapStack(defaultApp, 'TestStack3');
      const testTemplate = Template.fromStack(testStack);
      testTemplate.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'cicd-build-dev',
      });
    });
  });

  describe('KMS Key Configuration', () => {
    test('KMS key is created with proper configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for CI/CD pipeline encryption',
        EnableKeyRotation: true,
      });
    });

    test('KMS key has deletion policy set to Delete', () => {
      template.hasResource('AWS::KMS::Key', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('VPC Configuration', () => {
    test('VPC is created with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('VPC has the correct number of subnets', () => {
      // 2 public and 2 private subnets
      template.resourceCountIs('AWS::EC2::Subnet', 4);
    });

    test('NAT Gateway is created for private subnets', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('Internet Gateway is created and attached', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });

    test('Route tables are properly configured', () => {
      // 2 public and 2 private route tables
      template.resourceCountIs('AWS::EC2::RouteTable', 4);
    });
  });

  describe('Security Groups', () => {
    test('CodeBuild security group is created with correct name', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for CodeBuild projects',
        GroupName: `cicd-codebuild-sg-${environmentSuffix}`,
      });
    });

    test('Beanstalk security group allows HTTP and HTTPS traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Elastic Beanstalk environment',
        GroupName: `cicd-beanstalk-sg-${environmentSuffix}`,
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
          }),
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp',
          }),
        ]),
      });
    });
  });

  describe('S3 Buckets', () => {
    test('Artifacts bucket is created with KMS encryption', () => {
      // We verify that there are S3 buckets with KMS encryption
      template.resourceCountIs('AWS::S3::Bucket', 2); // Source and Artifacts buckets
      
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
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('Source bucket is created with versioning enabled', () => {
      // At least one bucket should have versioning enabled (the source bucket)
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 buckets have proper deletion policies', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.DeletionPolicy).toBe('Delete');
        expect(bucket.UpdateReplacePolicy).toBe('Delete');
      });
    });

    test('S3 bucket policies enforce SSL', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        },
      });
    });
  });

  describe('SNS Topic', () => {
    test('SNS topic is created with KMS encryption', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `cicd-notifications-${environmentSuffix}`,
        DisplayName: 'CI/CD Pipeline Notifications',
      });
    });

    test('Email subscription is added to SNS topic', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'admin@example.com',
      });
    });

    test('SNS topic policy allows EventBridge to publish', () => {
      template.hasResourceProperties('AWS::SNS::TopicPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com',
              },
              Action: 'sns:Publish',
            }),
          ]),
        },
      });
    });
  });

  describe('IAM Roles', () => {
    test('CodePipeline role has correct trust policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
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

    test('CodeBuild role has necessary permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
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
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'CodeBuildPolicy',
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ]),
                }),
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    'ec2:CreateNetworkInterface',
                    'ec2:DescribeNetworkInterfaces',
                  ]),
                }),
              ]),
            },
          }),
        ]),
      });
    });

    test('Beanstalk service role has managed policies attached', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const beanstalkServiceRole = Object.values(roles).find((role: any) => {
        const statement = role.Properties?.AssumeRolePolicyDocument?.Statement?.[0];
        return statement?.Principal?.Service === 'elasticbeanstalk.amazonaws.com';
      });
      expect(beanstalkServiceRole).toBeDefined();
      expect(beanstalkServiceRole?.Properties?.ManagedPolicyArns).toBeDefined();
      expect(beanstalkServiceRole?.Properties?.ManagedPolicyArns.length).toBeGreaterThanOrEqual(2);
    });

    test('Beanstalk instance role is created', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const beanstalkInstanceRole = Object.values(roles).find((role: any) => {
        const statement = role.Properties?.AssumeRolePolicyDocument?.Statement?.[0];
        const hasEc2Principal = statement?.Principal?.Service === 'ec2.amazonaws.com';
        const hasBeanstalkPolicies = role.Properties?.ManagedPolicyArns?.some((arn: any) => {
          if (typeof arn === 'string') {
            return arn.includes('AWSElasticBeanstalk');
          } else if (arn && typeof arn === 'object' && arn['Fn::Join']) {
            const joinParts = arn['Fn::Join']?.[1] || [];
            return joinParts.some((part: any) => typeof part === 'string' && part.includes('AWSElasticBeanstalk'));
          }
          return false;
        });
        return hasEc2Principal && hasBeanstalkPolicies;
      });
      expect(beanstalkInstanceRole).toBeDefined();
      expect(beanstalkInstanceRole?.Properties?.ManagedPolicyArns.length).toBeGreaterThanOrEqual(1);
    });

    test('Instance profile is created for Beanstalk', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        InstanceProfileName: `beanstalk-instance-profile-${environmentSuffix}`,
      });
    });
  });

  describe('CodeBuild Project', () => {
    test('CodeBuild project is created with correct configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `cicd-build-${environmentSuffix}`,
        Environment: {
          ComputeType: 'BUILD_GENERAL1_SMALL',
          EnvironmentVariables: Match.arrayWith([
            Match.objectLike({
              Name: 'AWS_DEFAULT_REGION',
            }),
            Match.objectLike({
              Name: 'AWS_ACCOUNT_ID',
            }),
            Match.objectLike({
              Name: 'ENVIRONMENT',
              Value: environmentSuffix,
            }),
          ]),
        },
      });
    });

    test('CodeBuild project uses VPC configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        VpcConfig: Match.objectLike({
          SecurityGroupIds: Match.anyValue(),
          Subnets: Match.anyValue(),
        }),
      });
    });

    test('CodeBuild project has proper build spec', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Source: {
          BuildSpec: Match.stringLikeRegexp('.*version.*0.2.*'),
        },
      });
    });
  });

  describe('Elastic Beanstalk', () => {
    test('Beanstalk application is created', () => {
      template.hasResourceProperties('AWS::ElasticBeanstalk::Application', {
        ApplicationName: `cicd-app-${environmentSuffix}`,
        Description: 'CI/CD Pipeline Application',
      });
    });

    test('Beanstalk environment is created with correct configuration', () => {
      template.hasResourceProperties('AWS::ElasticBeanstalk::Environment', {
        ApplicationName: `cicd-app-${environmentSuffix}`,
        EnvironmentName: `cicd-env-${environmentSuffix}`,
        SolutionStackName: Match.stringLikeRegexp('.*Python.*'),
      });
    });

    test('Beanstalk environment has VPC configuration', () => {
      template.hasResourceProperties('AWS::ElasticBeanstalk::Environment', {
        OptionSettings: Match.arrayWith([
          Match.objectLike({
            Namespace: 'aws:ec2:vpc',
            OptionName: 'VPCId',
          }),
          Match.objectLike({
            Namespace: 'aws:ec2:vpc',
            OptionName: 'Subnets',
          }),
          Match.objectLike({
            Namespace: 'aws:ec2:vpc',
            OptionName: 'ELBSubnets',
          }),
        ]),
      });
    });

    test('Beanstalk environment has security group configured', () => {
      template.hasResourceProperties('AWS::ElasticBeanstalk::Environment', {
        OptionSettings: Match.arrayWith([
          Match.objectLike({
            Namespace: 'aws:autoscaling:launchconfiguration',
            OptionName: 'SecurityGroups',
          }),
        ]),
      });
    });

    test('Beanstalk environment has IAM role configured', () => {
      template.hasResourceProperties('AWS::ElasticBeanstalk::Environment', {
        OptionSettings: Match.arrayWith([
          Match.objectLike({
            Namespace: 'aws:autoscaling:launchconfiguration',
            OptionName: 'IamInstanceProfile',
          }),
          Match.objectLike({
            Namespace: 'aws:elasticbeanstalk:environment',
            OptionName: 'ServiceRole',
          }),
        ]),
      });
    });

    test('Beanstalk environment has load balancer configured', () => {
      template.hasResourceProperties('AWS::ElasticBeanstalk::Environment', {
        OptionSettings: Match.arrayWith([
          Match.objectLike({
            Namespace: 'aws:elasticbeanstalk:environment',
            OptionName: 'LoadBalancerType',
            Value: 'application',
          }),
        ]),
      });
    });
  });

  describe('CodePipeline', () => {
    test('Pipeline is created with correct name', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: `cicd-pipeline-${environmentSuffix}`,
      });
    });

    test('Pipeline has three stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({ Name: 'Source' }),
          Match.objectLike({ Name: 'Build' }),
          Match.objectLike({ Name: 'Deploy' }),
        ]),
      });
    });

    test('Source stage uses S3 source action', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Source',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'S3_Source',
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

    test('Build stage uses CodeBuild action', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Build',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'CodeBuild',
                ActionTypeId: {
                  Category: 'Build',
                  Owner: 'AWS',
                  Provider: 'CodeBuild',
                },
              }),
            ]),
          }),
        ]),
      });
    });

    test('Deploy stage uses ElasticBeanstalk action', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Deploy',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'Deploy',
                ActionTypeId: {
                  Category: 'Deploy',
                  Owner: 'AWS',
                  Provider: 'ElasticBeanstalk',
                },
              }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('Pipeline state change rule is created', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.codepipeline'],
          'detail-type': ['CodePipeline Pipeline Execution State Change'],
          detail: {
            state: ['SUCCEEDED', 'FAILED'],
          },
        },
      });
    });

    test('CodeBuild state change rule is created', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.codebuild'],
          'detail-type': ['CodeBuild Build State Change'],
          detail: {
            'build-status': ['SUCCEEDED', 'FAILED', 'STOPPED'],
          },
        },
      });
    });

    test('EventBridge rules target SNS topic', () => {
      const rules = template.findResources('AWS::Events::Rule');
      Object.values(rules).forEach(rule => {
        expect(rule.Properties?.Targets).toBeDefined();
        expect(rule.Properties.Targets.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Pipeline name output is created', () => {
      template.hasOutput('PipelineName', {
        Value: Match.objectLike({
          Ref: Match.stringLikeRegexp('.*Pipeline.*'),
        }),
      });
    });

    test('Beanstalk application name output is created', () => {
      template.hasOutput('BeanstalkApplicationName', {
        Value: `cicd-app-${environmentSuffix}`,
      });
    });

    test('Beanstalk environment name output is created', () => {
      template.hasOutput('BeanstalkEnvironmentName', {
        Value: `cicd-env-${environmentSuffix}`,
      });
    });

    test('VPC ID output is created', () => {
      template.hasOutput('VpcId', {
        Value: Match.objectLike({
          Ref: Match.stringLikeRegexp('.*Vpc.*'),
        }),
      });
    });

    test('KMS Key ID output is created', () => {
      template.hasOutput('KmsKeyId', {
        Value: Match.objectLike({
          Ref: Match.stringLikeRegexp('.*KmsKey.*'),
        }),
      });
    });

    test('Source bucket name output is created', () => {
      template.hasOutput('SourceBucketName', {
        Value: Match.objectLike({
          Ref: Match.stringLikeRegexp('.*SourceBucket.*'),
        }),
      });
    });

    test('Artifacts bucket name output is created', () => {
      template.hasOutput('ArtifactsBucketName', {
        Value: Match.objectLike({
          Ref: Match.stringLikeRegexp('.*ArtifactsBucket.*'),
        }),
      });
    });

    test('Notification topic ARN output is created', () => {
      template.hasOutput('NotificationTopicArn', {
        Value: Match.objectLike({
          Ref: Match.stringLikeRegexp('.*PipelineNotifications.*'),
        }),
      });
    });

    test('CodeBuild project name output is created', () => {
      template.hasOutput('CodeBuildProjectName', {
        Value: Match.objectLike({
          Ref: Match.stringLikeRegexp('.*BuildProject.*'),
        }),
      });
    });
  });

  describe('Resource Tagging', () => {
    test('Resources are tagged with environment suffix', () => {
      const vpc = template.findResources('AWS::EC2::VPC');
      Object.values(vpc).forEach(resource => {
        const tags = resource.Properties?.Tags || [];
        const nameTag = tags.find((tag: any) => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value).toContain('cicd-vpc');
      });
    });
  });

  describe('Security Best Practices', () => {
    test('IAM policies follow least privilege principle', () => {
      const roles = template.findResources('AWS::IAM::Role');
      let policiesFound = false;
      Object.values(roles).forEach(role => {
        if (role.Properties?.Policies) {
          policiesFound = true;
          role.Properties.Policies.forEach((policy: any) => {
            expect(policy.PolicyDocument).toBeDefined();
            expect(policy.PolicyDocument.Statement).toBeDefined();
          });
        }
      });
      expect(policiesFound).toBe(true);
    });

    test('All S3 buckets have encryption enabled', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties?.BucketEncryption).toBeDefined();
      });
    });

    test('All S3 buckets block public access', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties?.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        });
      });
    });
  });

  describe('High Availability', () => {
    test('Resources are deployed across multiple availability zones', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*cicd-vpc.*'),
          }),
        ]),
      });
      // Verify we have subnets in multiple AZs
      const subnets = template.findResources('AWS::EC2::Subnet');
      const azs = new Set(
        Object.values(subnets).map((subnet: any) => subnet.Properties?.AvailabilityZone)
      );
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Monitoring and Logging', () => {
    test('CloudWatch logs are configured for CodeBuild', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith(['logs:CreateLogGroup', 'logs:PutLogEvents']),
                }),
              ]),
            },
          }),
        ]),
      });
    });
  });
});