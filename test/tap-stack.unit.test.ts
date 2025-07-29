import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Define a dummy context for testing purposes to match the stack's logic
const testContext = {
  context: {
    [environmentSuffix]: {
      instanceSize: 'micro',
      vpcCidr: '10.0.0.0/16',
    },
  },
};

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeAll(() => {
    app = new cdk.App(testContext);
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create a VPC with the correct CIDR from context', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('should create public and private subnets', () => {
      // Check for at least one of each required subnet type
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true, // Identifies a public subnet
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false, // Identifies a private subnet
      });
    });
  });

  describe('Database Configuration', () => {
    test('should create an RDS instance with encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
        DBInstanceClass: 'db.t4g.small', // Based on actual implementation
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create an S3 bucket with versioning and encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
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
  });

  describe('Tagging Strategy', () => {
    test('should apply Project and Environment tags to the VPC', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Project', Value: 'SecureCloudEnvironment' }
        ]),
      });
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: environmentSuffix }
        ]),
      });
    });
  });

  describe('Outputs', () => {
    test('should create outputs for important resources', () => {
      // Assert the actual outputs defined in tap-stack.ts
      template.hasOutput('ALBDNS', {});
      template.hasOutput('BastionHostId', {});
      template.hasOutput('DatabaseEndpoint', {});
    });
  });
});
