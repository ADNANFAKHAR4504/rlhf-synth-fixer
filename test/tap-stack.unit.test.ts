// test/tap-stack.unit.test.ts
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CfnInclude } from 'aws-cdk-lib/cloudformation-include';
import * as path from 'path';

describe('TapStack Template Tests', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    // Include your existing CloudFormation YAML
    new CfnInclude(stack, 'IncludedTemplate', {
      templateFile: path.join(__dirname, '../lib/TapStack.yml'),
    });

    template = Template.fromStack(stack);
  });

  // VPC Tests
  describe('VPC Resources', () => {
    test('VPC uses hardcoded CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('VPC has DNS support enabled', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('At least two public subnets exist', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const publicSubnets = Object.entries(subnets).filter(([, subnet]) => {
        const props = (subnet as { Properties?: { MapPublicIpOnLaunch?: boolean } })
          .Properties;
        return props?.MapPublicIpOnLaunch === true;
      });
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
    });

    test('At least two private subnets exist', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const privateSubnets = Object.entries(subnets).filter(([, subnet]) => {
        const props = (subnet as { Properties?: { MapPublicIpOnLaunch?: boolean } })
          .Properties;
        return props?.MapPublicIpOnLaunch !== true;
      });
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
    });

    test('Internet Gateway exists', () => {
      template.hasResource('AWS::EC2::InternetGateway', {});
    });

    test('Route tables exist', () => {
      const routeTables = template.findResources('AWS::EC2::RouteTable');
      expect(Object.keys(routeTables).length).toBeGreaterThanOrEqual(2);
    });
  });

  // Security Group Tests
  describe('Security Groups', () => {
    test('Application security group exists', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Enable HTTP and HTTPS access',
      });
    });

    test('Application security group allows HTTP traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          },
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          },
        ],
      });
    });

    test('Database security group exists', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Enable database access from app security group',
      });
    });
  });

  // S3 Bucket Tests
  describe('S3 Bucket', () => {
    test('S3 bucket exists', () => {
      template.hasResource('AWS::S3::Bucket', {});
    });

    test('S3 bucket has server-side encryption enabled', () => {
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
      });
    });

    test('S3 bucket blocks public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });
  });

  // IAM Tests
  describe('IAM Resources', () => {
    test('IAM role exists', () => {
      template.hasResource('AWS::IAM::Role', {});
    });

    test('IAM role has Lambda as trusted principal', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: ['lambda.amazonaws.com'],
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });

    test('IAM role has S3 access policy', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const roleWithS3Policy = Object.values(roles).some((role) => {
        const props = (role as { Properties?: { Policies?: Array<{ PolicyName?: string }> } })
          .Properties;
        return props?.Policies?.some((policy) => policy.PolicyName === 'S3Access');
      });
      expect(roleWithS3Policy).toBe(true);
    });

    test('IAM role has DynamoDB access policy', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const roleWithDDBPolicy = Object.values(roles).some((role) => {
        const props = (role as { Properties?: { Policies?: Array<{ PolicyName?: string }> } })
          .Properties;
        return props?.Policies?.some((policy) => policy.PolicyName === 'DynamoDBAccess');
      });
      expect(roleWithDDBPolicy).toBe(true);
    });
  });

  // Secrets Manager Tests
  describe('Secrets Manager', () => {
    test('Secret exists', () => {
      template.hasResource('AWS::SecretsManager::Secret', {});
    });

    test('Secret generates password automatically', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: {
          SecretStringTemplate: '{"username":"admin"}',
          GenerateStringKey: 'password',
          PasswordLength: 16,
        },
      });
    });
  });

  // DynamoDB Tests
  describe('DynamoDB Table', () => {
    test('DynamoDB table exists', () => {
      template.hasResource('AWS::DynamoDB::Table', {});
    });

    test('DynamoDB table has correct key schema', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
        ],
      });
    });

    test('DynamoDB table uses PAY_PER_REQUEST billing mode', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('DynamoDB table has id attribute defined', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
        ],
      });
    });
  });

  // SNS Tests
  describe('SNS Topic', () => {
    test('SNS topic exists', () => {
      template.hasResource('AWS::SNS::Topic', {});
    });
  });

  // SQS Tests
  describe('SQS Queue', () => {
    test('SQS queue exists', () => {
      template.hasResource('AWS::SQS::Queue', {});
    });

    test('SQS queue has visibility timeout configured', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        VisibilityTimeout: 300,
      });
    });

    test('SQS queue has message retention configured', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        MessageRetentionPeriod: 1209600,
      });
    });

    test('SQS queue policy exists', () => {
      template.hasResource('AWS::SQS::QueuePolicy', {});
    });
  });

  // SNS Subscription Tests
  describe('SNS Subscription', () => {
    test('SNS subscription to SQS exists', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'sqs',
      });
    });
  });

  // Output Tests
  describe('Stack Outputs', () => {
    test('Stack exports DynamoDB table name', () => {
      template.hasOutput('TurnAroundPromptTableName', {});
    });

    test('Stack exports DynamoDB table ARN', () => {
      template.hasOutput('TurnAroundPromptTableArn', {});
    });

    test('Stack exports VPC ID', () => {
      template.hasOutput('VPCId', {});
    });

    test('Stack exports S3 bucket name', () => {
      template.hasOutput('AppLogBucketName', {});
    });

    test('Stack exports SNS topic ARN', () => {
      template.hasOutput('NotificationTopicArn', {});
    });

    test('Stack exports SQS queue URL', () => {
      template.hasOutput('TaskQueueUrl', {});
    });

    test('Stack exports environment suffix', () => {
      template.hasOutput('EnvironmentSuffix', {});
    });
  });
});
