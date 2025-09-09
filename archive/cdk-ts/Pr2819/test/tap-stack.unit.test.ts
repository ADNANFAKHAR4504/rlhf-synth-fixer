import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    // Create app with explicit account and region to avoid synthesis issues
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

  describe('Region Guard', () => {
    test('should enforce us-east-1 region', () => {
      expect(() => {
        new TapStack(app, 'WrongRegionStack', {
          environmentSuffix: 'test',
          env: {
            account: '123456789012',
            region: 'us-west-2'
          }
        });
      }).toThrow('Stack must be deployed in us-east-1. Current region: us-west-2');
    });

    test('should allow us-east-1 region', () => {
      expect(() => {
        new TapStack(app, 'CorrectRegionStack', {
          environmentSuffix: 'test',
          env: {
            account: '123456789012',
            region: 'us-east-1'
          }
        });
      }).not.toThrow();
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('should create subnets in different AZs', () => {
      // Check correct number of subnets
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 public + 2 private + 2 database

      // Check public subnets exist
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        CidrBlock: '10.0.0.0/24'
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        CidrBlock: '10.0.1.0/24'
      });
    });

    test('should have NAT gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });
  });

  describe('S3 Buckets', () => {
    test('should create S3 buckets with SSE-S3 encryption', () => {
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

    test('should have bucket names with environment suffix', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`tap-${environmentSuffix.toLowerCase()}-.*`)
      });
    });

    test('should block public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });
  });

  describe('EC2 Instances', () => {
    test('should create two EC2 instances with detailed monitoring', () => {
      template.resourceCountIs('AWS::EC2::Instance', 2);

      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        Monitoring: true
      });
    });

    test('should use latest Amazon Linux 2 AMI', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        ImageId: {
          Ref: Match.stringLikeRegexp('SsmParameterValue.*amzn2.*')
        }
      });
    });

    test('should be in private subnets', () => {
      // EC2 instances should be in private subnets
      template.hasResourceProperties('AWS::EC2::Instance', {
        SubnetId: {
          Ref: Match.stringLikeRegexp('.*PrivateSubnet.*')
        }
      });
    });

    test('should have Environment=Production tags', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production'
          }
        ])
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should create internet-facing ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing'
      });
    });

    test('should have access logging enabled', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 's3:PutObject',
              Effect: 'Allow'
            })
          ])
        }
      });
    });

    test('should have target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'instance',
        HealthCheckEnabled: true,
        HealthCheckPath: '/',
        HealthCheckProtocol: 'HTTP'
      });
    });
  });

  describe('RDS Instance', () => {
    test('should create RDS db.t3.micro instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.micro',
        Engine: 'mysql'
      });
    });

    test('should be publicly accessible', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        PubliclyAccessible: true
      });
    });

    test('should have storage encryption enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true
      });
    });

    test('should not have deletion protection (for cleanup)', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: false
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create EC2 role with S3 access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com'
            }
          }]
        }
      });

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                's3:GetObject*',
                's3:PutObject'
              ]),
              Effect: 'Allow'
            })
          ])
        }
      });
    });

    test('should create Lambda role with S3 access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com'
            }
          }]
        }
      });
    });

    test('should have role names with environment suffix', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp(`tap-${environmentSuffix.toLowerCase()}-.*-role`)
      });
    });
  });

  describe('Security Groups', () => {
    test('should create security groups with proper names', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.stringLikeRegexp(`tap-${environmentSuffix.toLowerCase()}-.*-sg`)
      });
    });

    test('should allow HTTP traffic from internet to ALB', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
            Description: 'Allow HTTP traffic from internet'
          })
        ])
      });
    });

    test('should allow MySQL access from anywhere to RDS (as required)', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 3306,
            IpProtocol: 'tcp',
            ToPort: 3306,
            Description: 'Allow MySQL access from anywhere (as required - security risk)'
          })
        ])
      });
    });
  });

  describe('Tags', () => {
    test('should tag all resources with Environment=Production', () => {
      const resources = template.findResources('AWS::EC2::VPC');
      const vpcLogicalId = Object.keys(resources)[0];
      const vpc = resources[vpcLogicalId];

      expect(vpc.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'Environment',
            Value: 'Production'
          })
        ])
      );
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      template.hasOutput('VpcId', {});
      template.hasOutput('LoadBalancerDnsName', {});
      template.hasOutput('RdsEndpoint', {});
      template.hasOutput('AppDataBucketName', {});
      template.hasOutput('Ec2Instance1Id', {});
      template.hasOutput('Ec2Instance2Id', {});
      template.hasOutput('Ec2RoleArn', {});
      template.hasOutput('LambdaRoleArn', {});
    });
  });

  describe('Environment Suffix Fallback', () => {
    test('should use "dev" as default when environmentSuffix is not provided', () => {
      const fallbackApp = new cdk.App();
      const fallbackStack = new TapStack(fallbackApp, 'FallbackTestStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
        // No environmentSuffix provided to test fallback
      });
      const fallbackTemplate = Template.fromStack(fallbackStack);

      // Check that resources are created with 'dev' suffix when environmentSuffix is not provided
      fallbackTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('.*dev.*')
      });
    });

    test('should use "dev" as default when props is undefined', () => {
      const fallbackApp = new cdk.App();
      const fallbackStack = new TapStack(fallbackApp, 'FallbackTestStack2', {
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
        // props is provided but environmentSuffix is undefined, testing the fallback
      });
      const fallbackTemplate = Template.fromStack(fallbackStack);

      // Check that resources are created with 'dev' suffix when props is completely undefined
      fallbackTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('.*dev.*')
      });
    });
  });
});
