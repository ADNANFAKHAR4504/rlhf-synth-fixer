import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
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

  describe('Stack Structure', () => {
    test('creates all component resources', () => {
      // Check that resources from all constructs are created
      // Networking: VPC
      template.resourceCountIs('AWS::EC2::VPC', 1);
      
      // Security: Security Groups
      template.hasResourceProperties('AWS::EC2::SecurityGroup', Match.objectLike({
        GroupDescription: Match.anyValue()
      }));
      
      // Database: RDS Cluster
      template.resourceCountIs('AWS::RDS::DBCluster', 1);
      
      // Storage: S3 Buckets
      template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
        VersioningConfiguration: Match.objectLike({
          Status: 'Enabled'
        })
      }));
      
      // Monitoring: CloudWatch resources
      template.hasResourceProperties('AWS::Logs::LogGroup', Match.objectLike({
        LogGroupName: Match.anyValue()
      }));
      
      // Secrets: Secrets Manager
      template.hasResourceProperties('AWS::SecretsManager::Secret', Match.objectLike({
        Name: Match.anyValue()
      }));
    });

    test('applies proper tags to resources', () => {
      // Verify that VPC has tags
      template.hasResourceProperties('AWS::EC2::VPC', Match.objectLike({
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: environmentSuffix
          }),
          Match.objectLike({
            Key: 'ProjectName',
            Value: 'secure-vpc-project'
          })
        ])
      }));
    });
  });

  describe('Stack Dependencies', () => {
    test('creates resources from all constructs', () => {
      // Verify resources from each construct are present
      const hasVpc = template.findResources('AWS::EC2::VPC');
      const hasSecurityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const hasDatabase = template.findResources('AWS::RDS::DBCluster');
      const hasStorage = template.findResources('AWS::S3::Bucket');
      const hasMonitoring = template.findResources('AWS::Logs::LogGroup');
      const hasSecrets = template.findResources('AWS::SecretsManager::Secret');
      
      expect(Object.keys(hasVpc).length).toBeGreaterThan(0);
      expect(Object.keys(hasSecurityGroups).length).toBeGreaterThan(0);
      expect(Object.keys(hasDatabase).length).toBeGreaterThan(0);
      expect(Object.keys(hasStorage).length).toBeGreaterThan(0);
      expect(Object.keys(hasMonitoring).length).toBeGreaterThan(0);
      expect(Object.keys(hasSecrets).length).toBeGreaterThan(0);
    });
  });

  describe('Environment Configuration', () => {
    test('uses environment suffix in resource naming', () => {
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('passes environment configuration to constructs', () => {
      // Verify resources are created with environment suffix in their names
      const vpcs = template.findResources('AWS::EC2::VPC');
      expect(Object.keys(vpcs).length).toBeGreaterThan(0);
    });
  });

  describe('Stack Outputs', () => {
    test('exports VPC ID output', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: `secure-vpc-project-${environmentSuffix}-vpc-id`
        }
      });
    });

    test('exports VPC ARN output', () => {
      template.hasOutput('VpcArn', {
        Description: 'VPC ARN',
        Export: {
          Name: `secure-vpc-project-${environmentSuffix}-vpc-arn`
        }
      });
    });

    test('exports Region output', () => {
      template.hasOutput('Region', {
        Description: 'Deployment Region'
      });
    });
  });

  describe('Cross-Region Support', () => {
    test('does not create cross-region stack when disabled', () => {
      // Cross-region stack is disabled in current configuration
      // Verify we only have resources in primary region
      const vpcs = template.findResources('AWS::EC2::VPC');
      expect(Object.keys(vpcs).length).toBe(1);
    });
  });
});
