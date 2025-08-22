import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure Validation', () => {
    test('should be valid JSON', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
    });
  });

  describe('Tagging Validation', () => {
    const taggableResourceTypes = [
      'AWS::SecretsManager::Secret',
      'AWS::KMS::Key',
      'AWS::EC2::VPC',
      'AWS::EC2::Subnet',
      'AWS::EC2::RouteTable',
      'AWS::EC2::SecurityGroup',
      'AWS::S3::Bucket',
      'AWS::IAM::Role',
      'AWS::EC2::Instance',
      'AWS::RDS::DBSubnetGroup',
      'AWS::RDS::DBInstance',
      'AWS::Logs::LogGroup',
      'AWS::Lambda::Function',
      'AWS::CloudTrail::Trail',
      'AWS::SNS::Topic',
      'AWS::CloudWatch::Alarm',
      'AWS::Config::ConfigurationRecorder',
      'AWS::Config::DeliveryChannel',
      'AWS::Config::ConfigRule'
    ];

    const nonTaggableResourceTypes = [
      'AWS::KMS::Alias',
      'AWS::EC2::SubnetRouteTableAssociation',
      'AWS::S3::BucketPolicy',
      'AWS::IAM::InstanceProfile',
      'AWS::Logs::MetricFilter'
    ];

    test('taggable resources should have Environment and Owner tags', () => {
      Object.entries(template.Resources).forEach(([resourceName, resource]: [string, any]) => {
        if (taggableResourceTypes.includes(resource.Type)) {
          expect(resource.Properties.Tags).toBeDefined();
          
          const tags = resource.Properties.Tags;
          const environmentTag = tags.find((tag: any) => tag.Key === 'Environment');
          const ownerTag = tags.find((tag: any) => tag.Key === 'Owner');
          
          expect(environmentTag).toBeDefined();
          expect(ownerTag).toBeDefined();
          expect(environmentTag.Value).toEqual({ Ref: 'Environment' });
          expect(ownerTag.Value).toEqual({ Ref: 'Owner' });
        }
      });
    });

    test('non-taggable resources should not have Tags property', () => {
      Object.entries(template.Resources).forEach(([resourceName, resource]: [string, any]) => {
        if (nonTaggableResourceTypes.includes(resource.Type)) {
          expect(resource.Properties.Tags).toBeUndefined();
        }
      });
    });
  });

  describe('Availability Zone Constraints', () => {
    test('should not have hardcoded availability zones', () => {
      const templateStr = JSON.stringify(template);
      
      // Check for common AZ patterns
      const azPatterns = [
        /us-east-1[a-z]/g,
        /us-west-[12][a-z]/g,
        /eu-west-1[a-z]/g,
        /ap-southeast-1[a-z]/g
      ];

      azPatterns.forEach(pattern => {
        expect(templateStr).not.toMatch(pattern);
      });
    });

    test('subnets should use Fn::Select with Fn::GetAZs for AZ selection', () => {
      Object.entries(template.Resources).forEach(([resourceName, resource]: [string, any]) => {
        if (resource.Type === 'AWS::EC2::Subnet') {
          const availabilityZone = resource.Properties.AvailabilityZone;
          expect(availabilityZone).toBeDefined();
          expect(availabilityZone['Fn::Select']).toBeDefined();
          expect(availabilityZone['Fn::Select'][1]['Fn::GetAZs']).toBeDefined();
        }
      });
    });
  });

  describe('EC2 AMI Validation', () => {
    test('should use SSM parameter for AMI ID, not hardcoded values', () => {
      const ec2Instances = Object.entries(template.Resources).filter(([name, resource]: [string, any]) => 
        resource.Type === 'AWS::EC2::Instance'
      );

      ec2Instances.forEach(([resourceName, resource]: [string, any]) => {
        const imageId = resource.Properties.ImageId;
        expect(imageId).toEqual({ Ref: 'LatestAmiId' });
      });
    });

    test('LatestAmiId parameter should be SSM parameter type', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
      expect(template.Parameters.LatestAmiId.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
    });
  });

  describe('Security Group Validation', () => {
    test('security groups should only allow SSH/22 from AllowedSshCidr', () => {
      Object.entries(template.Resources).forEach(([resourceName, resource]: [string, any]) => {
        if (resource.Type === 'AWS::EC2::SecurityGroup') {
          const ingressRules = resource.Properties.SecurityGroupIngress || [];
          
          const sshRules = ingressRules.filter((rule: any) => 
            rule.FromPort === 22 && rule.ToPort === 22
          );

          sshRules.forEach((rule: any) => {
            expect(rule.CidrIp).toEqual({ Ref: 'AllowedSshCidr' });
            expect(rule.IpProtocol).toBe('tcp');
          });
        }
      });
    });
  });

  describe('S3 Encryption Validation', () => {
    test('S3 buckets should use SSE-KMS encryption', () => {
      Object.entries(template.Resources).forEach(([resourceName, resource]: [string, any]) => {
        if (resource.Type === 'AWS::S3::Bucket') {
          const encryption = resource.Properties.BucketEncryption;
          expect(encryption).toBeDefined();
          expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
          
          const sseConfig = encryption.ServerSideEncryptionConfiguration[0];
          expect(sseConfig.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
          expect(sseConfig.ServerSideEncryptionByDefault.KMSMasterKeyID).toBeDefined();
        }
      });
    });

    test('S3 buckets should have bucket policy denying unencrypted PUTs', () => {
      const s3Buckets = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::S3::Bucket'
      );

      s3Buckets.forEach(bucketName => {
        const policyName = bucketName + 'Policy';
        const policy = template.Resources[policyName];
        
        expect(policy).toBeDefined();
        expect(policy.Type).toBe('AWS::S3::BucketPolicy');
        
        const policyDocument = policy.Properties.PolicyDocument;
        const denyStatement = policyDocument.Statement.find((stmt: any) => 
          stmt.Effect === 'Deny' && 
          stmt.Condition && 
          stmt.Condition.StringNotEquals &&
          stmt.Condition.StringNotEquals['s3:x-amz-server-side-encryption']
        );
        
        expect(denyStatement).toBeDefined();
      });
    });
  });

  describe('IAM Policy Validation', () => {
    test('IAM roles should not have wildcard (*) permissions', () => {
      Object.entries(template.Resources).forEach(([resourceName, resource]: [string, any]) => {
        if (resource.Type === 'AWS::IAM::Role') {
          const policies = resource.Properties.Policies || [];
          
          policies.forEach((policy: any) => {
            const statements = policy.PolicyDocument.Statement;
            statements.forEach((statement: any) => {
              if (statement.Action) {
                if (Array.isArray(statement.Action)) {
                  expect(statement.Action).not.toContain('*');
                } else {
                  expect(statement.Action).not.toBe('*');
                }
              }
            });
          });
        }
      });
    });
  });

  describe('RDS Validation', () => {
    test('RDS instance should be encrypted with KMS', () => {
      Object.entries(template.Resources).forEach(([resourceName, resource]: [string, any]) => {
        if (resource.Type === 'AWS::RDS::DBInstance') {
          expect(resource.Properties.StorageEncrypted).toBe(true);
          expect(resource.Properties.KmsKeyId).toBeDefined();
        }
      });
    });

    test('RDS should use MySQL engine with AllowedValues', () => {
      Object.entries(template.Resources).forEach(([resourceName, resource]: [string, any]) => {
        if (resource.Type === 'AWS::RDS::DBInstance') {
          expect(resource.Properties.Engine).toBe('mysql');
          expect(resource.Properties.EngineVersion).toEqual({ Ref: 'DBEngineVersion' });
        }
      });
    });

    test('DBEngineVersion parameter should have AllowedValues', () => {
      expect(template.Parameters.DBEngineVersion).toBeDefined();
      expect(template.Parameters.DBEngineVersion.AllowedValues).toBeDefined();
      expect(Array.isArray(template.Parameters.DBEngineVersion.AllowedValues)).toBe(true);
      expect(template.Parameters.DBEngineVersion.AllowedValues.length).toBeGreaterThan(0);
    });

    test('RDS should use Secrets Manager for password, not DBPassword parameter', () => {
      expect(template.Parameters.DBPassword).toBeUndefined();
      
      Object.entries(template.Resources).forEach(([resourceName, resource]: [string, any]) => {
        if (resource.Type === 'AWS::RDS::DBInstance') {
          expect(resource.Properties.MasterUserPassword).toBeDefined();
          expect(resource.Properties.MasterUserPassword['Fn::Sub']).toContain('resolve:secretsmanager:');
        }
      });
    });
  });

  describe('VPC and Networking Validation', () => {
    test('VPC should only have private subnets (no public subnets)', () => {
      const subnets = Object.entries(template.Resources).filter(([name, resource]: [string, any]) => 
        resource.Type === 'AWS::EC2::Subnet'
      );

      subnets.forEach(([subnetName, subnet]: [string, any]) => {
        expect(subnet.Properties.MapPublicIpOnLaunch).toBeFalsy();
      });
    });

    test('should not have Internet Gateway for public access', () => {
      const hasIGW = Object.values(template.Resources).some((resource: any) => 
        resource.Type === 'AWS::EC2::InternetGateway'
      );
      expect(hasIGW).toBe(false);
    });
  });

  describe('CloudTrail Validation', () => {
    test('CloudTrail should be multi-region and have logging enabled', () => {
      Object.entries(template.Resources).forEach(([resourceName, resource]: [string, any]) => {
        if (resource.Type === 'AWS::CloudTrail::Trail') {
          expect(resource.Properties.IncludeGlobalServiceEvents).toBe(true);
          expect(resource.Properties.IsMultiRegionTrail).toBe(true);
          expect(resource.Properties.IsLogging).toBe(true);
        }
      });
    });

    test('CloudTrail should have log file validation enabled', () => {
      Object.entries(template.Resources).forEach(([resourceName, resource]: [string, any]) => {
        if (resource.Type === 'AWS::CloudTrail::Trail') {
          expect(resource.Properties.EnableLogFileValidation).toBe(true);
        }
      });
    });
  });

  describe('CloudWatch Monitoring Validation', () => {
    test('should have MetricFilter for UnauthorizedOperation/AccessDenied', () => {
      const metricFilters = Object.entries(template.Resources).filter(([name, resource]: [string, any]) => 
        resource.Type === 'AWS::Logs::MetricFilter'
      );

      expect(metricFilters.length).toBeGreaterThan(0);

      metricFilters.forEach(([name, filter]: [string, any]) => {
        const filterPattern = filter.Properties.FilterPattern;
        expect(filterPattern).toContain('UnauthorizedOperation');
        expect(filterPattern).toContain('AccessDenied');
      });
    });

    test('should have CloudWatch Alarm for security events', () => {
      const alarms = Object.entries(template.Resources).filter(([name, resource]: [string, any]) => 
        resource.Type === 'AWS::CloudWatch::Alarm'
      );

      expect(alarms.length).toBeGreaterThan(0);
    });
  });

  describe('AWS Config Validation', () => {
    test('should only use ConfigurationRecorder, DeliveryChannel, and ConfigRule', () => {
      const configResources = Object.entries(template.Resources).filter(([name, resource]: [string, any]) => 
        resource.Type.startsWith('AWS::Config::')
      );

      const allowedConfigTypes = [
        'AWS::Config::ConfigurationRecorder',
        'AWS::Config::DeliveryChannel', 
        'AWS::Config::ConfigRule'
      ];

      configResources.forEach(([name, resource]: [string, any]) => {
        expect(allowedConfigTypes).toContain(resource.Type);
      });
    });

    test('should have all required AWS Config resources', () => {
      const configRecorder = Object.values(template.Resources).find((resource: any) => 
        resource.Type === 'AWS::Config::ConfigurationRecorder'
      );
      const deliveryChannel = Object.values(template.Resources).find((resource: any) => 
        resource.Type === 'AWS::Config::DeliveryChannel'
      );
      const configRule = Object.values(template.Resources).find((resource: any) => 
        resource.Type === 'AWS::Config::ConfigRule'
      );

      expect(configRecorder).toBeDefined();
      expect(deliveryChannel).toBeDefined();
      expect(configRule).toBeDefined();
    });
  });
});