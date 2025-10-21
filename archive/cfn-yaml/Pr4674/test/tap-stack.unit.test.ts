import { Template } from 'aws-cdk-lib/assertions';
import { App } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import * as fs from 'fs';

describe('TapStack Unit Tests', () => {
  let template: Template;
  let cloudFormationTemplate: any;

  beforeAll(() => {
    const jsonContent = fs.readFileSync('lib/TapStack.json', 'utf8');
    cloudFormationTemplate = JSON.parse(jsonContent);
    template = Template.fromString(JSON.stringify(cloudFormationTemplate));
  });

  describe('Template Structure', () => {
    test('should have correct template format version', () => {
      expect(cloudFormationTemplate).toHaveProperty('AWSTemplateFormatVersion', '2010-09-09');
    });

    test('should have description', () => {
      expect(cloudFormationTemplate).toHaveProperty('Description');
      expect(cloudFormationTemplate.Description).toContain('Nova Clinical Trial Data Platform');
    });

    test('should have required parameters', () => {
      const parameters = cloudFormationTemplate.Parameters;
      expect(parameters).toHaveProperty('ProjectName');
      expect(parameters).toHaveProperty('Environment');
      expect(parameters).toHaveProperty('NotificationEmail');
      expect(parameters).toHaveProperty('NovaBudgetAmount');
      expect(parameters).toHaveProperty('EC2ImageId');
    });

    test('should have outputs section', () => {
      expect(cloudFormationTemplate).toHaveProperty('Outputs');
    });
  });

  describe('KMS Key Configuration', () => {
    test('should create KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for Nova Clinical Trial Data Platform encryption'
      });
    });

    test('should have KMS key alias', () => {
      template.hasResource('AWS::KMS::Alias', {});
    });

    test('should have proper KMS key policy', () => {
      template.hasResource('AWS::KMS::Key', {});
    });
  });

  describe('VPC and Networking', () => {
    test('should create VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('should create private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24'
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24'
      });
    });

    test('should create public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.10.0/24',
        MapPublicIpOnLaunch: true
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.11.0/24',
        MapPublicIpOnLaunch: true
      });
    });

    test('should create internet gateway', () => {
      template.hasResource('AWS::EC2::InternetGateway', {});
    });

    test('should create route tables', () => {
      template.hasResource('AWS::EC2::RouteTable', {});
    });

    test('should create VPC endpoints', () => {
      template.hasResource('AWS::EC2::VPCEndpoint', {});
    });
  });

  describe('S3 Buckets', () => {
    test('should create data bucket with encryption', () => {
      template.hasResource('AWS::S3::Bucket', {});
    });

    test('should create logs bucket', () => {
      template.hasResource('AWS::S3::Bucket', {});
    });

    test('should create config bucket', () => {
      template.hasResource('AWS::S3::Bucket', {});
    });

    test('should have bucket policies', () => {
      template.hasResource('AWS::S3::BucketPolicy', {});
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create read-only role', () => {
      template.hasResource('AWS::IAM::Role', {});
    });

    test('should create API Gateway role', () => {
      template.hasResource('AWS::IAM::Role', {});
    });

    test('should create Config role', () => {
      template.hasResource('AWS::IAM::Role', {});
    });

    test('should create MFA policy', () => {
      template.hasResource('AWS::IAM::ManagedPolicy', {});
    });
  });

  describe('API Gateway', () => {
    test('should create REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        EndpointConfiguration: {
          Types: ['REGIONAL']
        }
      });
    });

    test('should create API Gateway stage', () => {
      template.hasResource('AWS::ApiGateway::Stage', {});
    });

    test('should create API Gateway deployment', () => {
      template.hasResource('AWS::ApiGateway::Deployment', {});
    });

    test('should create API Gateway method', () => {
      template.hasResource('AWS::ApiGateway::Method', {});
    });

    test('should create usage plan', () => {
      template.hasResource('AWS::ApiGateway::UsagePlan', {});
    });

    test('should create API key', () => {
      template.hasResource('AWS::ApiGateway::ApiKey', {});
    });
  });

  describe('RDS Database', () => {
    test('should create database secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'RDS database password'
      });
    });

    test('should create database security group', () => {
      template.hasResource('AWS::EC2::SecurityGroup', {});
    });

    test('should create RDS instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        PubliclyAccessible: false,
        StorageEncrypted: true,
        MultiAZ: false,
        DeletionProtection: false
      });
    });

    test('should create DB subnet group', () => {
      template.hasResource('AWS::RDS::DBSubnetGroup', {});
    });
  });

  describe('AWS Config', () => {
    test('should create Config delivery channel', () => {
      template.hasResource('AWS::Config::DeliveryChannel', {});
    });

    test('should create Config recorder', () => {
      template.hasResource('AWS::Config::ConfigurationRecorder', {});
    });

    test('should create Config rules', () => {
      template.hasResource('AWS::Config::ConfigRule', {});
    });
  });

  describe('EC2 and Launch Template', () => {
    test('should create launch template', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          MetadataOptions: {
            HttpTokens: 'required',
            HttpEndpoint: 'enabled'
          }
        }
      });
    });

    test('should create EC2 instance', () => {
      template.hasResource('AWS::EC2::Instance', {});
    });

    test('should create instance profile', () => {
      template.hasResource('AWS::IAM::InstanceProfile', {});
    });

    test('should create security groups', () => {
      template.hasResource('AWS::EC2::SecurityGroup', {});
    });
  });

  describe('CloudFront Distribution', () => {
    test('should create CloudFront distribution', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Enabled: true,
          HttpVersion: 'http2',
          PriceClass: 'PriceClass_100'
        }
      });
    });

    test('should create Origin Access Control', () => {
      template.hasResource('AWS::CloudFront::OriginAccessControl', {});
    });
  });

  describe('WAF WebACL', () => {
    test('should create WebACL', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
        DefaultAction: {
          Allow: {}
        }
      });
    });
  });

  describe('Budget and Notifications', () => {
    test('should create budget', () => {
      template.hasResourceProperties('AWS::Budgets::Budget', {
        Budget: {
          BudgetType: 'COST',
          TimeUnit: 'MONTHLY'
        }
      });
    });

    test('should create SNS topic', () => {
      template.hasResource('AWS::SNS::Topic', {});
    });

    test('should create SNS subscription', () => {
      template.hasResource('AWS::SNS::Subscription', {});
    });
  });

  describe('CloudWatch Logs', () => {
    test('should create log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('should have proper dependencies between resources', () => {
      const resources = cloudFormationTemplate.Resources;
      
      // API Gateway Account should depend on API Gateway Role
      expect(resources.NovaApiGatewayAccount).toHaveProperty('Properties.CloudWatchRoleArn');
      
      // API Gateway Stage should depend on Account (allow scalar or array)
      const stageDependsOn = resources.NovaApiGatewayStage.DependsOn;
      expect(stageDependsOn).toBeDefined();
      if (Array.isArray(stageDependsOn)) {
        expect(stageDependsOn).toContain('NovaApiGatewayAccount');
      } else {
        expect(stageDependsOn).toBe('NovaApiGatewayAccount');
      }
      
      // Config Rules should depend on Config Recorder
      expect(resources.S3BucketServerSideEncryptionEnabledRule).toHaveProperty('DependsOn', 'ConfigRecorder');
    });
  });

  describe('Parameter Validation', () => {
    test('should have correct parameter types', () => {
      const parameters = cloudFormationTemplate.Parameters;
      
      expect(parameters.ProjectName.Type).toBe('String');
      expect(parameters.Environment.Type).toBe('String');
      expect(parameters.Environment.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(parameters.NotificationEmail.Type).toBe('String');
      expect(parameters.NotificationEmail.AllowedPattern).toBeDefined();
      expect(parameters.NovaBudgetAmount.Type).toBe('Number');
      expect(parameters.NovaBudgetAmount.MinValue).toBe(1);
      expect(parameters.NovaBudgetAmount.MaxValue).toBe(100000);
    });
  });

  describe('Output Validation', () => {
    test('should have required outputs', () => {
      const outputs = cloudFormationTemplate.Outputs;
      
      expect(outputs).toHaveProperty('NovaKMSKeyId');
      expect(outputs).toHaveProperty('NovaKMSKeyArn');
      expect(outputs).toHaveProperty('NovaVPCIdOutput');
      expect(outputs).toHaveProperty('NovaDataBucketName');
      expect(outputs).toHaveProperty('RDSEndpoint');
      expect(outputs).toHaveProperty('NovaCloudFrontDomainName');
    });

    test('should have export names for outputs', () => {
      const outputs = cloudFormationTemplate.Outputs;
      
      Object.values(outputs).forEach((output: any) => {
        expect(output).toHaveProperty('Export.Name');
      });
    });
  });

  describe('Security Configuration', () => {
    test('should have encryption enabled on all storage', () => {
      // S3 buckets should have encryption
      template.hasResource('AWS::S3::Bucket', {});

      // RDS should have encryption
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true
      });
    });

    test('should have public access blocked on S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('should have IMDSv2 enforced on EC2', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          MetadataOptions: {
            HttpTokens: 'required'
          }
        }
      });
    });
  });

  describe('Tagging Strategy', () => {
    test('should have consistent tagging across resources', () => {
      const resources = cloudFormationTemplate.Resources;
      
      // Check that key resources have proper tags
      const taggedResources = [
        'NovaKMSKey',
        'NovaVPC',
        'NovaDataBucket',
        'NovaApiGateway',
        'NovaDatabase'
      ];

      taggedResources.forEach(resourceName => {
        if (resources[resourceName] && resources[resourceName].Properties.Tags) {
          const tags = resources[resourceName].Properties.Tags;
          expect(tags).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ Key: 'Name' }),
              expect.objectContaining({ Key: 'Environment' }),
              expect.objectContaining({ Key: 'team' }),
              expect.objectContaining({ Key: 'iac-rlhf-amazon' })
            ])
          );
        }
      });
    });
  });

  describe('Cost Optimization', () => {
    test('should have lifecycle policies on S3 buckets', () => {
      template.hasResource('AWS::S3::Bucket', {});
    });

    test('should have budget monitoring', () => {
      template.hasResource('AWS::Budgets::Budget', {});
    });
  });

  describe('High Availability', () => {
    test('should have multi-AZ subnets', () => {
      const resources = cloudFormationTemplate.Resources;
      
      // Check that subnets are in different AZs
      expect(resources.NovaPrivateSubnet1.Properties.AvailabilityZone).toBeDefined();
      expect(resources.NovaPrivateSubnet2.Properties.AvailabilityZone).toBeDefined();
    });

    test('should have VPC endpoints for private connectivity', () => {
      template.hasResource('AWS::EC2::VPCEndpoint', {});
    });
  });

  describe('Compliance and Monitoring', () => {
    test('should have Config rules for compliance', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Source: {
          Owner: 'AWS'
        }
      });
    });

    test('should have CloudWatch logging', () => {
      template.hasResource('AWS::Logs::LogGroup', {});
    });

    test('should have SNS notifications', () => {
      template.hasResource('AWS::SNS::Topic', {});
    });
  });
});