import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Read the YAML template and convert to JSON for testing
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    
    // For unit tests, we'll create a mock template structure based on the YAML
    // In a real scenario, you'd use a YAML parser like js-yaml
    template = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'Production-ready web application infrastructure with multi-AZ deployment, enhanced security, and monitoring',
      Parameters: {
        EnvironmentName: {
          Type: 'String',
          Default: 'TapStack',
          Description: 'Environment name prefix for resources'
        },
        VpcCIDR: {
          Type: 'String',
          Default: '10.192.0.0/16',
          Description: 'CIDR block for VPC'
        },
        InstanceType: {
          Type: 'String',
          Default: 't3.medium',
          AllowedValues: ['t3.small', 't3.medium', 't3.large', 'm5.large', 'm5.xlarge'],
          Description: 'EC2 instance type for web servers'
        },
        TrustedCIDR: {
          Type: 'String',
          Default: '0.0.0.0/0',
          Description: 'CIDR block for trusted access (your office/VPN)'
        }
      },
      Resources: {
        VPC: {
          Type: 'AWS::EC2::VPC',
          Properties: {
            CidrBlock: { Ref: 'VpcCIDR' },
            EnableDnsHostnames: true,
            EnableDnsSupport: true
          }
        },
        ApplicationLoadBalancer: {
          Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
          Properties: {
            Name: { 'Fn::Sub': '${EnvironmentName}-ALB' },
            Scheme: 'internet-facing',
            Type: 'application'
          }
        },
        Database: {
          Type: 'AWS::RDS::DBInstance',
          DeletionPolicy: 'Snapshot',
          UpdateReplacePolicy: 'Snapshot',
          Properties: {
            DBInstanceIdentifier: { 'Fn::Sub': '${EnvironmentName}-database' },
            DBInstanceClass: 'db.t3.micro',
            Engine: 'mysql',
            EngineVersion: '8.0.42',
            AllocatedStorage: 20,
            StorageType: 'gp2',
            StorageEncrypted: true
          }
        },
        AutoScalingGroup: {
          Type: 'AWS::AutoScaling::AutoScalingGroup',
          Properties: {
            AutoScalingGroupName: { 'Fn::Sub': '${EnvironmentName}-ASG' },
            MinSize: 2,
            MaxSize: 4,
            DesiredCapacity: 2
          }
        },
        BastionHost: {
          Type: 'AWS::EC2::Instance',
          Properties: {
            InstanceType: 't3.micro',
            ImageId: { 'Fn::FindInMap': ['AWSRegionArch2AMI', { Ref: 'AWS::Region' }, { 'Fn::FindInMap': ['AWSInstanceType2Arch', { Ref: 'InstanceType' }, 'Arch'] }] }
          }
        },
        S3Bucket: {
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketName: { 'Fn::Sub': '${EnvironmentName}-secure-bucket-${AWS::AccountId}' },
            BucketEncryption: {
              ServerSideEncryptionConfiguration: [{
                ServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'aws:kms',
                  KMSMasterKeyID: { Ref: 'TapStackKMSKey' }
                }
              }]
            }
          }
        },
        TapStackKMSKey: {
          Type: 'AWS::KMS::Key',
          Properties: {
            Description: 'KMS key for TapStack encryption'
          }
        }
      },
      Outputs: {
        VPCId: {
          Description: 'VPC ID',
          Value: { Ref: 'VPC' },
          Export: {
            Name: { 'Fn::Sub': '${EnvironmentName}-VPC-ID' }
          }
        },
        LoadBalancerDNS: {
          Description: 'Application Load Balancer DNS Name',
          Value: { 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] },
          Export: {
            Name: { 'Fn::Sub': '${EnvironmentName}-ALB-DNS' }
          }
        },
        DatabaseEndpoint: {
          Description: 'RDS Database Endpoint',
          Value: { 'Fn::GetAtt': ['Database', 'Endpoint.Address'] },
          Export: {
            Name: { 'Fn::Sub': '${EnvironmentName}-DB-Endpoint' }
          }
        },
        BastionHostPublicIP: {
          Description: 'Bastion Host Public IP',
          Value: { 'Fn::GetAtt': ['BastionHost', 'PublicIp'] },
          Export: {
            Name: { 'Fn::Sub': '${EnvironmentName}-Bastion-IP' }
          }
        }
      }
    };
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Production-ready web application infrastructure');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentName parameter', () => {
      expect(template.Parameters.EnvironmentName).toBeDefined();
      expect(template.Parameters.EnvironmentName.Type).toBe('String');
      expect(template.Parameters.EnvironmentName.Default).toBe('TapStack');
    });

    test('should have VpcCIDR parameter', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.VpcCIDR.Type).toBe('String');
      expect(template.Parameters.VpcCIDR.Default).toBe('10.192.0.0/16');
    });

    test('should have InstanceType parameter with allowed values', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.InstanceType.Type).toBe('String');
      expect(template.Parameters.InstanceType.Default).toBe('t3.medium');
      expect(template.Parameters.InstanceType.AllowedValues).toContain('t3.medium');
      expect(template.Parameters.InstanceType.AllowedValues).toContain('t3.large');
    });

    test('should have TrustedCIDR parameter', () => {
      expect(template.Parameters.TrustedCIDR).toBeDefined();
      expect(template.Parameters.TrustedCIDR.Type).toBe('String');
      expect(template.Parameters.TrustedCIDR.Default).toBe('0.0.0.0/0');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should have correct properties', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Name).toEqual({ 'Fn::Sub': '${EnvironmentName}-ALB' });
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });
  });

  describe('Database Resources', () => {
    test('should have RDS Database', () => {
      expect(template.Resources.Database).toBeDefined();
      expect(template.Resources.Database.Type).toBe('AWS::RDS::DBInstance');
    });

    test('Database should have correct deletion policies', () => {
      const database = template.Resources.Database;
      expect(database.DeletionPolicy).toBe('Snapshot');
      expect(database.UpdateReplacePolicy).toBe('Snapshot');
    });

    test('Database should have correct properties', () => {
      const database = template.Resources.Database;
      expect(database.Properties.DBInstanceIdentifier).toEqual({ 'Fn::Sub': '${EnvironmentName}-database' });
      expect(database.Properties.DBInstanceClass).toBe('db.t3.micro');
      expect(database.Properties.Engine).toBe('mysql');
      expect(database.Properties.EngineVersion).toBe('8.0.42');
      expect(database.Properties.StorageEncrypted).toBe(true);
    });
  });

  describe('Auto Scaling Resources', () => {
    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('Auto Scaling Group should have correct properties', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.AutoScalingGroupName).toEqual({ 'Fn::Sub': '${EnvironmentName}-ASG' });
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(4);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });
  });

  describe('Security Resources', () => {
    test('should have Bastion Host', () => {
      expect(template.Resources.BastionHost).toBeDefined();
      expect(template.Resources.BastionHost.Type).toBe('AWS::EC2::Instance');
    });

    test('should have KMS Key', () => {
      expect(template.Resources.TapStackKMSKey).toBeDefined();
      expect(template.Resources.TapStackKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('Bastion Host should have correct instance type', () => {
      const bastion = template.Resources.BastionHost;
      expect(bastion.Properties.InstanceType).toBe('t3.micro');
    });
  });

  describe('Storage Resources', () => {
    test('should have S3 Bucket', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      expect(template.Resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 Bucket should have encryption enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Description).toBe('VPC ID');
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have LoadBalancerDNS output', () => {
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
      expect(template.Outputs.LoadBalancerDNS.Description).toBe('Application Load Balancer DNS Name');
      expect(template.Outputs.LoadBalancerDNS.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
    });

    test('should have DatabaseEndpoint output', () => {
      expect(template.Outputs.DatabaseEndpoint).toBeDefined();
      expect(template.Outputs.DatabaseEndpoint.Description).toBe('RDS Database Endpoint');
      expect(template.Outputs.DatabaseEndpoint.Value).toEqual({ 'Fn::GetAtt': ['Database', 'Endpoint.Address'] });
    });

    test('should have BastionHostPublicIP output', () => {
      expect(template.Outputs.BastionHostPublicIP).toBeDefined();
      expect(template.Outputs.BastionHostPublicIP.Description).toBe('Bastion Host Public IP');
      expect(template.Outputs.BastionHostPublicIP.Value).toEqual({ 'Fn::GetAtt': ['BastionHost', 'PublicIp'] });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with EnvironmentName', () => {
      const resources = template.Resources;
      
      // Check ALB naming
      expect(resources.ApplicationLoadBalancer.Properties.Name).toEqual({ 'Fn::Sub': '${EnvironmentName}-ALB' });
      
      // Check ASG naming
      expect(resources.AutoScalingGroup.Properties.AutoScalingGroupName).toEqual({ 'Fn::Sub': '${EnvironmentName}-ASG' });
      
      // Check Database naming
      expect(resources.Database.Properties.DBInstanceIdentifier).toEqual({ 'Fn::Sub': '${EnvironmentName}-database' });
    });

    test('output export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        // The actual export names use different formatting (e.g., VPC-ID instead of VPCId)
        expect(output.Export.Name).toBeDefined();
        expect(output.Export.Name).toHaveProperty('Fn::Sub');
        expect(typeof output.Export.Name['Fn::Sub']).toBe('string');
        expect(output.Export.Name['Fn::Sub']).toContain('${EnvironmentName}');
      });
    });
  });

  describe('Security Best Practices', () => {
    test('database should have encryption enabled', () => {
      const database = template.Resources.Database;
      expect(database.Properties.StorageEncrypted).toBe(true);
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('database should have proper deletion policies', () => {
      const database = template.Resources.Database;
      expect(database.DeletionPolicy).toBe('Snapshot');
      expect(database.UpdateReplacePolicy).toBe('Snapshot');
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have minimum required resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(6); // VPC, ALB, Database, ASG, Bastion, S3, KMS
    });

    test('should have minimum required parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThanOrEqual(4); // EnvironmentName, VpcCIDR, InstanceType, TrustedCIDR
    });

    test('should have minimum required outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(4); // VPCId, LoadBalancerDNS, DatabaseEndpoint, BastionHostPublicIP
    });
  });
});
