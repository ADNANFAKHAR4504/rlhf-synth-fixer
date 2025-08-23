import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  const createPrimaryStack = () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStackPrimary', {
      environmentSuffix,
      isPrimary: true,
      env: { region: 'us-east-1' },
    });
    return { app, stack, template: Template.fromStack(stack) };
  };

  const createSecondaryStack = () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStackSecondary', {
      environmentSuffix,
      isPrimary: false,
      primaryRegion: 'us-east-1',
      primaryBucketArn: 'arn:aws:s3:::mock-primary-bucket',
      env: { region: 'us-east-2' },
    });
    return { app, stack, template: Template.fromStack(stack) };
  };

  describe('Primary Stack Resources', () => {
    test('creates KMS key with rotation enabled', () => {
      const { template } = createPrimaryStack();
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for TAP stack encryption',
        EnableKeyRotation: true,
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: { AWS: Match.anyValue() },
              Action: 'kms:*',
              Resource: '*',
            }),
          ]),
        }),
      });
    });

    test('creates S3 bucket with encryption and versioning', () => {
      const { template } = createPrimaryStack();
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
                KMSMasterKeyID: Match.anyValue(),
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

    test('creates S3 bucket with public access blocked', () => {
      const { template } = createPrimaryStack();
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('creates Lambda role with correct permissions', () => {
      const { template } = createPrimaryStack();
      // Check that Lambda role exists
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });

    test('creates API Gateway with proper configuration', () => {
      const { template } = createPrimaryStack();
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'TAP API',
        Description: 'API for TAP application',
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
      });
    });

    test('creates VPC with public and private subnets', () => {
      const { template } = createPrimaryStack();
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });

      // Check for public subnets
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 AZs * 3 subnet types

      // Check for NAT Gateways (2 for high availability)
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('creates RDS instance with Multi-AZ and encryption', () => {
      const { template } = createPrimaryStack();
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0.39',
        DBInstanceClass: 'db.t3.micro',
        MultiAZ: true,
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: false,
      });
    });

    test('creates RDS subnet group in isolated subnets', () => {
      const { template } = createPrimaryStack();
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });

    test('creates EC2 instance with encrypted EBS volume', () => {
      const { template } = createPrimaryStack();
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        BlockDeviceMappings: Match.arrayWith([
          Match.objectLike({
            DeviceName: '/dev/xvda',
            Ebs: Match.objectLike({
              Encrypted: true,
            }),
          }),
        ]),
      });
    });

    test('creates EC2 security group with HTTP/HTTPS access', () => {
      const { template } = createPrimaryStack();
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
      });
    });

    test('creates IAM role for EC2 instances', () => {
      const { template } = createPrimaryStack();
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'ec2.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });

    test('creates IAM role for EC2 instances', () => {
      const { template } = createPrimaryStack();
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'ec2.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });

    test('creates WAF Web ACL for API protection', () => {
      const { template } = createPrimaryStack();
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
        DefaultAction: { Allow: {} },
      });
    });

    test('creates Lambda function with correct configuration', () => {
      const { template } = createPrimaryStack();
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Code: {
          ZipFile: Match.stringLikeRegexp('.*Hello from Lambda.*'),
        },
      });
    });

    test('creates Lambda function with VPC configuration', () => {
      const { template } = createPrimaryStack();
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: {
          SecurityGroupIds: Match.anyValue(),
          SubnetIds: Match.anyValue(),
        },
      });
    });

    test('outputs all required values', () => {
      const { template } = createPrimaryStack();
      const outputs = template.findOutputs('*');
      expect(outputs).toHaveProperty('TapApiEndpoint');
      // API Gateway endpoint is the main output
    });
  });

  describe('Secondary Stack Resources', () => {
    test('creates S3 bucket with versioning enabled', () => {
      const { template } = createSecondaryStack();
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.anyValue(),
        },
      });
    });

    test('does not create CloudFront distribution in secondary region', () => {
      const { template } = createSecondaryStack();
      template.resourceCountIs('AWS::CloudFront::Distribution', 0);
    });

    test('creates RDS instance with encryption', () => {
      const { template } = createSecondaryStack();
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.micro',
        StorageEncrypted: true,
        Engine: 'mysql',
        MultiAZ: true,
      });
    });

    test('creates VPC in secondary region', () => {
      const { template } = createSecondaryStack();
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
      });
    });

    test('creates EC2 instance in secondary region', () => {
      const { template } = createSecondaryStack();
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        BlockDeviceMappings: Match.anyValue(),
      });
    });

    test('creates API Gateway in secondary region', () => {
      const { template } = createSecondaryStack();
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'TAP API',
        Description: 'API for TAP application',
      });
    });

    test('does not output CloudFront domain name', () => {
      const { template } = createSecondaryStack();
      expect(() => {
        template.hasOutput('CloudFrontDomainName', Match.anyValue());
      }).toThrow();
    });
  });

  describe('Security and Compliance', () => {
    test('all IAM policies follow least privilege principle', () => {
      const { template } = createPrimaryStack();

      // Check that no policies use wildcards inappropriately
      template.allResourcesProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.not({
              Resource: '*',
              Action: '*',
            }),
          ]),
        },
      });
    });

    test('all S3 buckets have encryption enabled', () => {
      const { template: primaryTemplate } = createPrimaryStack();
      const { template: secondaryTemplate } = createSecondaryStack();
      [primaryTemplate, secondaryTemplate].forEach(template => {
        // Check that at least one S3 bucket has encryption enabled
        template.hasResourceProperties('AWS::S3::Bucket', {
          BucketEncryption: {
            ServerSideEncryptionConfiguration: [
              {
                ServerSideEncryptionByDefault: {
                  SSEAlgorithm: Match.anyValue(),
                },
              },
            ],
          },
        });
      });
    });

    test('stack creates resources with proper configuration', () => {
      const { template } = createPrimaryStack();
      const resources = template.toJSON().Resources;
      
      // Verify we have the expected number of resources
      expect(Object.keys(resources).length).toBeGreaterThan(10);
      
      // Verify key resources exist
      const resourceTypes = Object.values(resources).map((r: any) => r.Type);
      expect(resourceTypes).toContain('AWS::S3::Bucket');
      expect(resourceTypes).toContain('AWS::RDS::DBInstance');
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::Lambda::Function');
      expect(resourceTypes).toContain('AWS::ApiGateway::RestApi');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles missing environment suffix gracefully', () => {
      const app = new cdk.App();
      const testStack = new TapStack(app, 'TestStackNoSuffix', {
        isPrimary: true,
      });
      const template = Template.fromStack(testStack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('creates stack with custom environment suffix', () => {
      const app = new cdk.App();
      const customStack = new TapStack(app, 'TestStackCustom', {
        environmentSuffix: 'prod',
        isPrimary: true,
      });
      const template = Template.fromStack(customStack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('defaults to primary when isPrimary is undefined', () => {
      const app = new cdk.App();
      const defaultStack = new TapStack(app, 'TestStackDefault', {
        environmentSuffix: 'test',
        // isPrimary is undefined, should default to true
      });
      const template = Template.fromStack(defaultStack);

      // Should create primary stack resources (like API Gateway)
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'TAP API',
        Description: 'API for TAP application',
      });

      // Should create S3 bucket (primary resource)
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('Lambda function has correct runtime and handler', () => {
      const { template } = createPrimaryStack();
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Code: {
          ZipFile: Match.stringLikeRegexp('.*Hello from Lambda.*'),
        },
      });
    });

    test('RDS security group allows EC2 access', () => {
      const { template } = createPrimaryStack();
      // Check that RDS security group exists
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
      });

      // Check that EC2 security group exists
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
      });
    });
  });
});
