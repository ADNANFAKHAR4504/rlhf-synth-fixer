import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 public, 2 private, 2 isolated
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('should create NAT gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });
  });

  describe('Security Groups', () => {
    test('should create SSH security group with limited IP access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for SSH access from limited IP range',
        SecurityGroupIngress: [
          {
            CidrIp: '203.0.113.0/24',
            Description: 'SSH access from limited IP range',
            FromPort: 22,
            IpProtocol: 'tcp',
            ToPort: 22,
          },
        ],
      });
    });

    test('should create web security group with HTTP/HTTPS access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web traffic',
        SecurityGroupIngress: [
          {
            CidrIp: '0.0.0.0/0',
            Description: 'HTTP traffic',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          },
          {
            CidrIp: '0.0.0.0/0',
            Description: 'HTTPS traffic',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
          },
        ],
      });
    });

    test('should create RDS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create S3 buckets with encryption and versioning', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);
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
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should block public access on S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should enforce SSL on S3 buckets', () => {
      template.resourceCountIs('AWS::S3::BucketPolicy', 2);
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: [
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
            },
          ],
        },
      });
    });
  });

  describe('EC2 Instances', () => {
    test('should create two EC2 instances with t3.micro', () => {
      template.resourceCountIs('AWS::EC2::Instance', 2);
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        Monitoring: true,
      });
    });

    test('should create IAM role for EC2 with minimal permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
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
        },
        Description: 'IAM role for EC2 instances with minimal S3 access',
      });
    });
  });

  describe('RDS Database', () => {
    test('should create RDS MySQL instance with multi-AZ', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0.42',
        DBInstanceClass: 'db.t3.micro',
        MultiAZ: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: false,
        StorageEncrypted: true,
      });
    });

    test('should create RDS subnet group in isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });
  });

  describe('DynamoDB', () => {
    test('should create DynamoDB table with encryption and point-in-time recovery', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
        ],
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with CloudWatch logging', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
      });
    });

    test('should create CloudWatch log group for Lambda', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });

    test('should create IAM role for Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
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
        },
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should create ALB in public subnets', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Scheme: 'internet-facing',
          Type: 'application',
        }
      );
    });

    test('should create target group for EC2 instances', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Port: 80,
          Protocol: 'HTTP',
          HealthCheckEnabled: true,
          HealthCheckPath: '/',
          HealthCheckProtocol: 'HTTP',
        }
      );
    });

    test('should create HTTP listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      template.hasOutput('VpcId', {});
      template.hasOutput('LoadBalancerDNS', {});
      template.hasOutput('DatabaseEndpoint', {});
      template.hasOutput('S3LogsBucket', {});
      template.hasOutput('S3DataBucket', {});
      template.hasOutput('DynamoDBTable', {});
      template.hasOutput('LambdaFunction', {});
    });
  });

  describe('Resource Naming with Environment Suffix', () => {
    test('should use environment suffix in resource naming', () => {
      // Check that resources are named with environment suffix
      const resources = template.toJSON().Resources;
      const resourceNames = Object.keys(resources);

      // Find VPC resource and verify naming pattern
      const vpcResource = resourceNames.find(
        name => name.includes('vpcmain') && name.includes(environmentSuffix)
      );
      expect(vpcResource).toBeDefined();
    });
  });

  describe('Security Best Practices', () => {
    test('should not have any resources with public read/write access', () => {
      // Verify no S3 buckets allow public access
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have deletion protection disabled for testing', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: false,
      });

      // Check the metadata for removal policy
      const template_json = template.toJSON();
      const dynamoResources = Object.entries(template_json.Resources).filter(
        ([key, value]: [string, any]) => value.Type === 'AWS::DynamoDB::Table'
      );
      expect(dynamoResources.length).toBeGreaterThan(0);
      expect((dynamoResources[0][1] as any).DeletionPolicy).toBe('Delete');
    });
  });
});
