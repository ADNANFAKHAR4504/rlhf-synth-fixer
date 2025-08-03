import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('VPC Infrastructure', () => {
    test('should create a VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 public, 2 private app, 2 private db
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('should create NAT gateways for private subnet connectivity', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create an Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('S3 Infrastructure', () => {
    test('should create an S3 bucket with encryption', () => {
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
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should enforce SSL on S3 bucket', () => {
      // Check that the bucket policy contains an SSL enforcement statement
      const bucketPolicies = template.findResources('AWS::S3::BucketPolicy');
      const bucketPolicyKeys = Object.keys(bucketPolicies);
      expect(bucketPolicyKeys.length).toBeGreaterThan(0);
      
      const bucketPolicy = bucketPolicies[bucketPolicyKeys[0]];
      const statements = bucketPolicy.Properties.PolicyDocument.Statement;
      
      // Look for the SSL enforcement statement
      const sslStatement = statements.find((stmt: any) => 
        stmt.Action === 's3:*' &&
        stmt.Effect === 'Deny' &&
        stmt.Condition?.Bool?.['aws:SecureTransport'] === 'false'
      );
      
      expect(sslStatement).toBeDefined();
    });
  });

  describe('RDS Infrastructure', () => {
    test('should create RDS MySQL instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0.35',
        DBInstanceClass: 'db.t4g.micro',
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: false,
        PubliclyAccessible: false,
      });
    });

    test('should create database subnet group in isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for AppDatabase database',
      });
    });

    test('should create database security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for the RDS database',
      });
    });
  });

  describe('EC2 Infrastructure', () => {
    test('should create EC2 instance in private subnet', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
      });
    });

    test('should create application security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for the application instances',
      });
    });

    test('should create IAM role for EC2 instance', () => {
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
        Description: 'IAM role for application EC2 instances',
      });
    });
  });

  describe('Security Configuration', () => {
    test('should allow database access from application security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
        Description: 'Allow traffic from application instances',
      });
    });
  });

  describe('Tagging Strategy', () => {
    test('should apply environment and project tags to VPC', () => {
      // Check that the VPC has the required tags among others
      const vpcs = template.findResources('AWS::EC2::VPC');
      const vpcKeys = Object.keys(vpcs);
      expect(vpcKeys.length).toBeGreaterThan(0);
      
      const vpc = vpcs[vpcKeys[0]];
      const tags = vpc.Properties.Tags;
      
      // Check for Environment tag
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe(environmentSuffix);
      
      // Check for Project tag
      const projectTag = tags.find((tag: any) => tag.Key === 'Project');
      expect(projectTag).toBeDefined();
      expect(projectTag.Value).toBe('MultiRegionWebApp');
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should export VPC ID', () => {
      template.hasOutput('VpcId', {});
    });

    test('should export S3 bucket name', () => {
      template.hasOutput('AssetBucketName', {});
    });

    test('should export database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {});
    });
  });

  describe('Configuration Edge Cases', () => {
    test('should handle missing props', () => {
      const appNullProps = new cdk.App();
      const stackNullProps = new TapStack(appNullProps, 'TestTapStackNullProps', {});
      const templateNullProps = Template.fromStack(stackNullProps);
      
      // Should still create VPC with default configuration
      templateNullProps.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('should handle missing environment config', () => {
      const appNoContext = new cdk.App();
      const stackNoContext = new TapStack(appNoContext, 'TestTapStackNoContext', { environmentSuffix: 'test' });
      const templateNoContext = Template.fromStack(stackNoContext);
      
      // Should use default instance size (micro) when no context is provided
      templateNoContext.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
      });
      templateNoContext.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t4g.micro',
      });
    });

    test('should handle incomplete environment config', () => {
      const appIncompleteContext = new cdk.App();
      // Set context with missing instanceSize
      appIncompleteContext.node.setContext('test', {
        vpcCidr: '172.16.0.0/16',
        // instanceSize is missing
      });
      const stackIncompleteContext = new TapStack(appIncompleteContext, 'TestTapStackIncomplete', { environmentSuffix: 'test' });
      const templateIncompleteContext = Template.fromStack(stackIncompleteContext);
      
      // Should use default instance size when not specified in context
      templateIncompleteContext.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
      });
      templateIncompleteContext.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t4g.micro',
      });
      // But should use the VPC CIDR from context
      templateIncompleteContext.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '172.16.0.0/16',
      });
    });
  });
});
