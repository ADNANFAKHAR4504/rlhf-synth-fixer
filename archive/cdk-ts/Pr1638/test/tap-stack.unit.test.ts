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
      environment: 'staging',
      owner: 'test-owner',
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([{ Key: 'Name', Value: 'tap-test-vpc' }]),
      });
    });

    test('creates public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 public, 2 private, 2 database
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          { Key: 'aws-cdk:subnet-type', Value: 'Public' },
        ]),
      });
    });

    test('creates NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('creates Internet Gateway', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {});
      template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {});
    });
  });

  describe('Security Groups', () => {
    test('creates web security group with HTTP/HTTPS rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web servers',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
          }),
        ]),
      });
    });

    test('creates database security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for database',
      });
    });

    test('allows MySQL traffic from web to database', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
        Description: 'Allow MySQL traffic from web servers',
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates EC2 role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            }),
          ]),
        }),
        RoleName: 'tap-test-ec2-role',
      });
    });

    test('creates EC2 role policy for Parameter Store access', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:GetParametersByPath',
              ]),
            }),
          ]),
        }),
      });
    });
  });

  describe('EC2 Instance', () => {
    test('creates EC2 instance with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        Tags: Match.arrayWith([{ Key: 'Name', Value: 'tap-test-web-server' }]),
      });
    });

    test('assigns instance profile to EC2', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {});
    });
  });

  describe('S3 Bucket', () => {
    test('creates S3 bucket with versioning and encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            }),
          ]),
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('bucket has auto-delete policy', () => {
      template.hasResource('Custom::S3AutoDeleteObjects', {});
    });
  });

  describe('RDS Database', () => {
    test('creates RDS MySQL instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        DBInstanceClass: 'db.t3.micro',
        AllocatedStorage: '20',
        StorageEncrypted: true,
        DeletionProtection: false,
      });
    });

    test('creates DB subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });

    test('creates database credentials secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: Match.anyValue(),
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: '{"username":"admin"}',
          GenerateStringKey: 'password',
        }),
      });
    });
  });

  describe('ECS Fargate Service', () => {
    test('creates ECS cluster', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'tap-test-cluster',
      });
    });

    test('creates Fargate task definition', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        RequiresCompatibilities: ['FARGATE'],
        Cpu: '256',
        Memory: '512',
      });
    });

    test('creates Application Load Balancer', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Type: 'application',
          Scheme: 'internet-facing',
        }
      );
    });

    test('creates ECS service', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        LaunchType: 'FARGATE',
        DesiredCount: 1,
      });
    });

    test('configures auto-scaling for Fargate service', () => {
      template.hasResourceProperties(
        'AWS::ApplicationAutoScaling::ScalableTarget',
        {
          MinCapacity: 1,
          MaxCapacity: 10,
          ServiceNamespace: 'ecs',
        }
      );

      // Check CPU scaling policy
      template.hasResourceProperties(
        'AWS::ApplicationAutoScaling::ScalingPolicy',
        {
          TargetTrackingScalingPolicyConfiguration: Match.objectLike({
            TargetValue: 70,
            PredefinedMetricSpecification: Match.objectLike({
              PredefinedMetricType: 'ECSServiceAverageCPUUtilization',
            }),
          }),
        }
      );

      // Check Memory scaling policy
      template.hasResourceProperties(
        'AWS::ApplicationAutoScaling::ScalingPolicy',
        {
          TargetTrackingScalingPolicyConfiguration: Match.objectLike({
            TargetValue: 80,
            PredefinedMetricSpecification: Match.objectLike({
              PredefinedMetricType: 'ECSServiceAverageMemoryUtilization',
            }),
          }),
        }
      );
    });
  });

  describe('Parameter Store', () => {
    test('creates SSM parameters for configuration', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/tap-test/database/endpoint',
        Type: 'String',
      });

      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/tap-test/s3/bucket-name',
        Type: 'String',
      });

      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/tap-test/config/app-version',
        Type: 'String',
        Value: '1.0.0',
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates CPU alarm for EC2 instance', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Threshold: 80,
        EvaluationPeriods: 2,
      });
    });

    test('creates SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'tap-test-alerts',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Export: {
          Name: 'tap-test-vpc-id',
        },
      });
    });

    test('exports S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Export: {
          Name: 'tap-test-s3-bucket',
        },
      });
    });

    test('exports database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Export: {
          Name: 'tap-test-db-endpoint',
        },
      });
    });

    test('exports EC2 instance ID', () => {
      template.hasOutput('EC2InstanceId', {
        Export: {
          Name: 'tap-test-ec2-instance',
        },
      });
    });

    test('exports load balancer URL', () => {
      template.hasOutput('LoadBalancerUrl', {
        Export: {
          Name: 'tap-test-alb-url',
        },
      });
    });

    test('exports ECS cluster name', () => {
      template.hasOutput('EcsClusterName', {
        Export: {
          Name: 'tap-test-ecs-cluster',
        },
      });
    });
  });

  describe('Tagging', () => {
    test('applies common tags to stack', () => {
      const resources = template.toJSON().Resources;
      const taggedResources = Object.values(resources).filter(
        (resource: any) => resource.Properties?.Tags
      );

      expect(taggedResources.length).toBeGreaterThan(0);

      taggedResources.forEach((resource: any) => {
        const tags = resource.Properties.Tags;
        // Tags can be either array format or object format depending on the resource
        if (Array.isArray(tags)) {
          expect(tags).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ Key: 'Environment', Value: 'staging' }),
              expect.objectContaining({ Key: 'Owner', Value: 'test-owner' }),
              expect.objectContaining({
                Key: 'Project',
                Value: 'CloudEnvironmentSetup',
              }),
            ])
          );
        } else {
          expect(tags).toMatchObject({
            Environment: 'staging',
            Owner: 'test-owner',
            Project: 'CloudEnvironmentSetup',
          });
        }
      });
    });
  });

  describe('Resource Naming', () => {
    test('uses environment suffix in resource names', () => {
      // Check VPC name
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([{ Key: 'Name', Value: 'tap-test-vpc' }]),
      });

      // Check security group names
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'tap-test-web-sg',
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'tap-test-db-sg',
      });

      // Check IAM role name
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-test-ec2-role',
      });

      // Check RDS instance identifier
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: 'tap-test-mysql-db',
      });

      // Check ECS cluster name
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'tap-test-cluster',
      });
    });
  });

  describe('Removal Policies', () => {
    test('S3 bucket has DESTROY removal policy', () => {
      const resources = template.toJSON().Resources;
      const s3Bucket = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::S3::Bucket'
      );
      expect(s3Bucket).toHaveProperty('UpdateReplacePolicy', 'Delete');
      expect(s3Bucket).toHaveProperty('DeletionPolicy', 'Delete');
    });

    test('RDS instance has DESTROY removal policy', () => {
      const resources = template.toJSON().Resources;
      const rdsInstance = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::RDS::DBInstance'
      );
      expect(rdsInstance).toHaveProperty('UpdateReplacePolicy', 'Delete');
      expect(rdsInstance).toHaveProperty('DeletionPolicy', 'Delete');
    });
  });
});
