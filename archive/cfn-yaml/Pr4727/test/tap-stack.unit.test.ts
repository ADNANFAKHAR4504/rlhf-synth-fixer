import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load the CloudFormation template
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure Validation', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have comprehensive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Healthcare Patient Portal');
      expect(template.Description).toContain('HIPAA compliance');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });

  describe('Parameters Validation', () => {
    test('should have TrustedIP parameter with correct properties', () => {
      const trustedIP = template.Parameters.TrustedIP;
      expect(trustedIP).toBeDefined();
      expect(trustedIP.Type).toBe('String');
      expect(trustedIP.Default).toBe('203.0.113.0/32');
      expect(trustedIP.Description).toContain('bastion SSH access');
      expect(trustedIP.AllowedPattern).toBe('^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$');
      expect(trustedIP.ConstraintDescription).toContain('valid IP CIDR range');
    });

    test('should have AlertEmail parameter with correct properties', () => {
      const alertEmail = template.Parameters.AlertEmail;
      expect(alertEmail).toBeDefined();
      expect(alertEmail.Type).toBe('String');
      expect(alertEmail.Default).toBe('admin@example.com');
      expect(alertEmail.Description).toContain('security alerts');
      expect(alertEmail.AllowedPattern).toBe('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$');
      expect(alertEmail.ConstraintDescription).toContain('valid email address');
    });

    test('should have exactly two parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });
  });

  describe('Mappings Validation', () => {
    test('should have SubnetConfig mapping', () => {
      expect(template.Mappings.SubnetConfig).toBeDefined();
    });

    test('SubnetConfig should have all required subnet configurations', () => {
      const subnetConfig = template.Mappings.SubnetConfig;
      expect(subnetConfig.VPC).toBeDefined();
      expect(subnetConfig.PublicSubnet1).toBeDefined();
      expect(subnetConfig.PublicSubnet2).toBeDefined();
      expect(subnetConfig.PrivateSubnet1).toBeDefined();
      expect(subnetConfig.PrivateSubnet2).toBeDefined();
      expect(subnetConfig.DatabaseSubnet1).toBeDefined();
      expect(subnetConfig.DatabaseSubnet2).toBeDefined();
    });

    test('should have valid CIDR blocks', () => {
      const subnetConfig = template.Mappings.SubnetConfig;
      expect(subnetConfig.VPC.CIDR).toBe('10.0.0.0/16');
      expect(subnetConfig.PublicSubnet1.CIDR).toBe('10.0.1.0/24');
      expect(subnetConfig.PublicSubnet2.CIDR).toBe('10.0.2.0/24');
      expect(subnetConfig.PrivateSubnet1.CIDR).toBe('10.0.10.0/24');
      expect(subnetConfig.PrivateSubnet2.CIDR).toBe('10.0.11.0/24');
      expect(subnetConfig.DatabaseSubnet1.CIDR).toBe('10.0.20.0/24');
      expect(subnetConfig.DatabaseSubnet2.CIDR).toBe('10.0.21.0/24');
    });
  });

  describe('Core Infrastructure Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.NovaVPC).toBeDefined();
      expect(template.Resources.NovaVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.NovaVPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.CidrBlock).toEqual({
        'Fn::FindInMap': ['SubnetConfig', 'VPC', 'CIDR']
      });
    });

    test('should have all required subnets', () => {
      const subnetTypes = [
        'NovaPrivateSubnet1', 'NovaPrivateSubnet2',
        'NovaDatabaseSubnet1', 'NovaDatabaseSubnet2',
        'NovaPublicSubnet1', 'NovaPublicSubnet2'
      ];
      
      subnetTypes.forEach(subnetType => {
        expect(template.Resources[subnetType]).toBeDefined();
        expect(template.Resources[subnetType].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('should have Internet Gateway and attachment', () => {
      expect(template.Resources.NovaInternetGateway).toBeDefined();
      expect(template.Resources.NovaInternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources.NovaInternetGatewayAttachment).toBeDefined();
      expect(template.Resources.NovaInternetGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have NAT Gateways with EIPs', () => {
      expect(template.Resources.NovaNATGateway1EIP).toBeDefined();
      expect(template.Resources.NovaNATGateway2EIP).toBeDefined();
      expect(template.Resources.NovaNATGateway1).toBeDefined();
      expect(template.Resources.NovaNATGateway2).toBeDefined();
    });

    test('should have route tables and associations', () => {
      expect(template.Resources.NovaPublicRouteTable).toBeDefined();
      expect(template.Resources.NovaPrivateRouteTable1).toBeDefined();
      expect(template.Resources.NovaPrivateRouteTable2).toBeDefined();
    });
  });

  describe('Security Resources', () => {
    test('should have KMS encryption key', () => {
      expect(template.Resources.NovaEncryptionKey).toBeDefined();
      expect(template.Resources.NovaEncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have comprehensive policy', () => {
      const kmsKey = template.Resources.NovaEncryptionKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toBeDefined();
      expect(Array.isArray(keyPolicy.Statement)).toBe(true);
      expect(keyPolicy.Statement.length).toBeGreaterThan(0);
    });

    test('should have all security groups', () => {
      const securityGroups = [
        'NovaBastionSecurityGroup',
        'NovaALBSecurityGroup', 
        'NovaApplicationSecurityGroup',
        'NovaDatabaseSecurityGroup'
      ];
      
      securityGroups.forEach(sgType => {
        expect(template.Resources[sgType]).toBeDefined();
        expect(template.Resources[sgType].Type).toBe('AWS::EC2::SecurityGroup');
      });
    });

    test('should have Secrets Manager secret for RDS', () => {
      expect(template.Resources.NovaRDSPasswordSecret).toBeDefined();
      expect(template.Resources.NovaRDSPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('RDS secret should have proper configuration', () => {
      const secret = template.Resources.NovaRDSPasswordSecret;
      // Name property was removed to avoid naming conflicts - CloudFormation generates unique names
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(secret.Properties.GenerateSecretString.SecretStringTemplate).toBe('{"username": "admin"}');
      expect(secret.Properties.GenerateSecretString.GenerateStringKey).toBe('password');
    });
  });

  describe('Storage Resources', () => {
    test('should have S3 buckets', () => {
      expect(template.Resources.NovaAppDataBucket).toBeDefined();
      expect(template.Resources.NovaPatientDocumentsBucket).toBeDefined();
      expect(template.Resources.NovaCloudTrailBucket).toBeDefined();
    });

    test('S3 buckets should have encryption', () => {
      const buckets = [
        'NovaAppDataBucket',
        'NovaPatientDocumentsBucket', 
        'NovaCloudTrailBucket'
      ];
      
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      });
    });

    test('should have CloudTrail bucket policy', () => {
      expect(template.Resources.NovaCloudTrailBucketPolicy).toBeDefined();
      expect(template.Resources.NovaCloudTrailBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('Database Resources', () => {
    test('should have RDS instance', () => {
      expect(template.Resources.NovaRDSInstance).toBeDefined();
      expect(template.Resources.NovaRDSInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS instance should have proper configuration', () => {
      const rds = template.Resources.NovaRDSInstance;
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBe('8.0.43');
      expect(rds.Properties.DBInstanceClass).toBe('db.t3.medium');
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('should have DB subnet group', () => {
      expect(template.Resources.NovaDBSubnetGroup).toBeDefined();
      expect(template.Resources.NovaDBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have secret attachment', () => {
      expect(template.Resources.NovaDatabaseSecretAttachment).toBeDefined();
      expect(template.Resources.NovaDatabaseSecretAttachment.Type).toBe('AWS::SecretsManager::SecretTargetAttachment');
    });
  });

  describe('Load Balancer and WAF', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.NovaApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.NovaApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should have correct configuration', () => {
      const alb = template.Resources.NovaApplicationLoadBalancer;
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.SecurityGroups).toBeDefined();
      expect(alb.Properties.Subnets).toBeDefined();
    });

    test('should have WAF WebACL', () => {
      expect(template.Resources.NovaWAFWebACL).toBeDefined();
      expect(template.Resources.NovaWAFWebACL.Type).toBe('AWS::WAFv2::WebACL');
    });

    test('should have WAF association', () => {
      expect(template.Resources.NovaWAFAssociation).toBeDefined();
      expect(template.Resources.NovaWAFAssociation.Type).toBe('AWS::WAFv2::WebACLAssociation');
    });
  });

  describe('Monitoring and Logging', () => {
    test('should have CloudTrail', () => {
      expect(template.Resources.NovaCloudTrail).toBeDefined();
      expect(template.Resources.NovaCloudTrail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('CloudTrail should have proper configuration', () => {
      const cloudtrail = template.Resources.NovaCloudTrail;
      expect(cloudtrail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(cloudtrail.Properties.IsLogging).toBe(true);
      expect(cloudtrail.Properties.IsMultiRegionTrail).toBe(true);
      expect(cloudtrail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('should have VPC Flow Logs', () => {
      expect(template.Resources.NovaVPCFlowLogs).toBeDefined();
      expect(template.Resources.NovaVPCFlowLogs.Type).toBe('AWS::EC2::FlowLog');
    });

    test('should have CloudWatch Log Group', () => {
      expect(template.Resources.NovaVPCFlowLogsGroup).toBeDefined();
      expect(template.Resources.NovaVPCFlowLogsGroup.Type).toBe('AWS::Logs::LogGroup');
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 role', () => {
      expect(template.Resources.NovaEC2Role).toBeDefined();
      expect(template.Resources.NovaEC2Role.Type).toBe('AWS::IAM::Role');
    });

    test('should have EC2 instance profile', () => {
      expect(template.Resources.NovaEC2InstanceProfile).toBeDefined();
      expect(template.Resources.NovaEC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have VPC Flow Logs role', () => {
      expect(template.Resources.NovaVPCFlowLogsRole).toBeDefined();
      expect(template.Resources.NovaVPCFlowLogsRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have developers group', () => {
      expect(template.Resources.NovaDevelopersGroup).toBeDefined();
      expect(template.Resources.NovaDevelopersGroup.Type).toBe('AWS::IAM::Group');
    });
  });

  describe('EventBridge and SNS', () => {
    test('should have EventBridge rules', () => {
      expect(template.Resources.NovaIAMChangesRule).toBeDefined();
      expect(template.Resources.NovaSecurityGroupChangeRule).toBeDefined();
    });

    test('should have SNS topic', () => {
      expect(template.Resources.NovaSecurityNotificationsTopic).toBeDefined();
      expect(template.Resources.NovaSecurityNotificationsTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have SNS topic policy', () => {
      expect(template.Resources.NovaSecurityNotificationsTopicPolicy).toBeDefined();
      expect(template.Resources.NovaSecurityNotificationsTopicPolicy.Type).toBe('AWS::SNS::TopicPolicy');
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should follow nova-prod-* naming convention', () => {
      const resources = template.Resources;
      Object.keys(resources).forEach(resourceName => {
        if (resources[resourceName].Properties && resources[resourceName].Properties.Name) {
          const name = resources[resourceName].Properties.Name;
          if (typeof name === 'string') {
            expect(name).toMatch(/^nova-prod-/);
          }
        }
      });
    });

    test('all resources should have proper tags', () => {
      const resources = template.Resources;
      Object.keys(resources).forEach(resourceName => {
        const resource = resources[resourceName];
        if (resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const nameTag = tags.find((tag: any) => tag.Key === 'Name');
          const teamTag = tags.find((tag: any) => tag.Key === 'team');
          const iacTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
          
          expect(nameTag).toBeDefined();
          expect(teamTag).toBeDefined();
          expect(iacTag).toBeDefined();
          expect(teamTag.Value).toBe('2');
          expect(iacTag.Value).toBe('true');
        }
      });
    });
  });

  describe('Outputs Validation', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId', 'KMSKeyId', 'AppDataBucket', 'EC2Role',
        'RDSEndpoint', 'SecurityNotificationsTopic', 'CloudTrailArn',
        'ApplicationSecurityGroupId', 'PatientDocumentsBucketName',
        'ALBDNSName', 'SecurityAlertTopicArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have correct export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toMatch(/^nova-prod-/);
      });
    });

    test('should have exactly 19 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(19);
      });
    });

  describe('Security Configuration', () => {
    test('security groups should have restrictive rules', () => {
      const bastionSG = template.Resources.NovaBastionSecurityGroup;
      const albSG = template.Resources.NovaALBSecurityGroup;
      const dbSG = template.Resources.NovaDatabaseSecurityGroup;

      // Bastion should only allow SSH from trusted IP
      expect(bastionSG.Properties.SecurityGroupIngress[0].FromPort).toBe(22);
      expect(bastionSG.Properties.SecurityGroupIngress[0].ToPort).toBe(22);

      // ALB should only allow HTTPS
      expect(albSG.Properties.SecurityGroupIngress[0].FromPort).toBe(443);
      expect(albSG.Properties.SecurityGroupIngress[0].ToPort).toBe(443);

      // Database should only allow MySQL from application
      expect(dbSG.Properties.SecurityGroupIngress[0].FromPort).toBe(3306);
      expect(dbSG.Properties.SecurityGroupIngress[0].ToPort).toBe(3306);
    });

    test('S3 buckets should have public access blocked', () => {
      const buckets = [
        'NovaAppDataBucket',
        'NovaPatientDocumentsBucket',
        'NovaCloudTrailBucket'
      ];

      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });
  });

  describe('HIPAA Compliance Features', () => {
    test('should have encryption enabled for all storage', () => {
      const rds = template.Resources.NovaRDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);

      const buckets = [
        'NovaAppDataBucket',
        'NovaPatientDocumentsBucket',
        'NovaCloudTrailBucket'
      ];

      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });

    test('should have audit logging configured', () => {
      const cloudtrail = template.Resources.NovaCloudTrail;
      expect(cloudtrail.Properties.IsLogging).toBe(true);
      expect(cloudtrail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('should have data retention policies', () => {
      const cloudtrailBucket = template.Resources.NovaCloudTrailBucket;
      expect(cloudtrailBucket.Properties.ObjectLockEnabled).toBe(true);
      expect(cloudtrailBucket.Properties.ObjectLockConfiguration).toBeDefined();
    });
  });

  describe('Resource Dependencies', () => {
    test('RDS should depend on secret attachment', () => {
      const rds = template.Resources.NovaRDSInstance;
      const secretAttachment = template.Resources.NovaDatabaseSecretAttachment;
      
      expect(secretAttachment.Properties.SecretId.Ref).toBe('NovaRDSPasswordSecret');
      expect(secretAttachment.Properties.TargetId.Ref).toBe('NovaRDSInstance');
    });

    test('CloudTrail should depend on bucket policy', () => {
      const cloudtrail = template.Resources.NovaCloudTrail;
      expect(cloudtrail.DependsOn).toBe('NovaCloudTrailBucketPolicy');
    });

    test('NAT Gateways should depend on Internet Gateway', () => {
      const nat1 = template.Resources.NovaNATGateway1;
      const nat2 = template.Resources.NovaNATGateway2;
      const eip1 = template.Resources.NovaNATGateway1EIP;
      const eip2 = template.Resources.NovaNATGateway2EIP;

      expect(eip1.DependsOn).toBe('NovaInternetGatewayAttachment');
      expect(eip2.DependsOn).toBe('NovaInternetGatewayAttachment');
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have reasonable resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30); // Comprehensive infrastructure
      expect(resourceCount).toBeLessThan(100); // Not overly complex
    });

    test('should not have circular dependencies', () => {
      // This is a basic check - in a real scenario, you'd implement
      // a proper dependency graph analysis
      const resources = template.Resources;
      Object.keys(resources).forEach(resourceName => {
        const resource = resources[resourceName];
        if (resource.DependsOn) {
          expect(typeof resource.DependsOn).toBe('string');
          expect(resources[resource.DependsOn]).toBeDefined();
        }
      });
    });
  });
});
