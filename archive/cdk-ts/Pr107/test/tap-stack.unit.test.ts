import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack, EnvironmentConfig } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let template: Template;

  const awsConfig: EnvironmentConfig = {
    environmentName: 'test',
    cloudProvider: 'aws',
    awsRegion: 'us-east-1',
    awsVpcCidr: '10.0.0.0/16',
    awsAmi: 'ami-0c02fb55956c7d316',
    awsInstanceType: 't3.micro',
    awsS3BucketSuffix: 'storage',
    azureLocation: 'East US',
    azureVnetCidr: '10.0.0.0/16',
    azureVmSize: 'Standard_B1s',
    azureStorageSku: 'Standard_LRS',
    azureStorageAccountName: 'teststorage',
  };

  const azureConfig: EnvironmentConfig = {
    ...awsConfig,
    cloudProvider: 'azure',
  };

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('AWS Environment', () => {
    test('should create stack with AWS resources', () => {
      const stack = new TapStack(app, 'TestTapStack', { environmentConfig: awsConfig });
      template = Template.fromStack(stack);

      // Test VPC creation
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });

      // Test EC2 Instance creation
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
      });

      // Test S3 Bucket creation
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

      // Test Security Group creation
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for test AWS EC2 instance',
      });
    });

    test('should create proper CloudFormation outputs for AWS', () => {
      const stack = new TapStack(app, 'TestTapStack', { environmentConfig: awsConfig });
      template = Template.fromStack(stack);

      // Test outputs exist
      template.hasOutput('AWSVpcId', {});
      template.hasOutput('AWSVpcCidr', {});
      template.hasOutput('AWSEC2InstanceId', {});
      template.hasOutput('AWSEC2PublicIp', {});
      template.hasOutput('AWSS3BucketName', {});
    });

    test('should apply correct tags to AWS resources', () => {
      const stack = new TapStack(app, 'TestTapStack', { environmentConfig: awsConfig });
      template = Template.fromStack(stack);

      // Test that VPC has proper tags
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
          { Key: 'ManagedBy', Value: 'CDK' },
          { Key: 'Project', Value: 'MultiCloudInfra' },
        ]),
      });
    });
  });

  describe('Azure Environment', () => {
    test('should create stack with Azure placeholders', () => {
      const stack = new TapStack(app, 'TestTapStack', { environmentConfig: azureConfig });
      template = Template.fromStack(stack);

      // Test Azure placeholder outputs exist
      template.hasOutput('AzureVNetConceptual', {});
      template.hasOutput('AzureVMConceptual', {});
      template.hasOutput('AzureStorageConceptual', {});

      // Should not create AWS resources
      template.resourceCountIs('AWS::EC2::VPC', 0);
      template.resourceCountIs('AWS::EC2::Instance', 0);
      template.resourceCountIs('AWS::S3::Bucket', 0);
    });
  });

  describe('Legacy environmentSuffix Support', () => {
    test('should work with legacy environmentSuffix parameter', () => {
      const stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);

      // Should default to AWS and create resources
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });

      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
      });
    });

    test('should throw error when neither environmentConfig nor environmentSuffix provided', () => {
      expect(() => {
        new TapStack(app, 'TestTapStack', {});
      }).toThrow('Either environmentConfig or environmentSuffix must be provided');
    });
  });

  describe('Resource Configuration', () => {
    test('should use custom VPC CIDR from config', () => {
      const customConfig = { ...awsConfig, awsVpcCidr: '192.168.0.0/16' };
      const stack = new TapStack(app, 'TestTapStack', { environmentConfig: customConfig });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '192.168.0.0/16',
      });
    });

    test('should use custom instance type from config', () => {
      const customConfig = { ...awsConfig, awsInstanceType: 't3.small' };
      const stack = new TapStack(app, 'TestTapStack', { environmentConfig: customConfig });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.small',
      });
    });
  });
});
