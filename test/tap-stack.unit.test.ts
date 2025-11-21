// Multi-Tier Web Application - Single Template Unit Tests
import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description for multi-tier application', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description.toLowerCase()).toContain('multi-tier');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
    });

    test('should have required parameters with validation', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.InstanceType.AllowedValues).toContain('t3.medium');
      expect(template.Parameters.InstanceType.AllowedValues).toContain('t3.large');
      expect(template.Parameters.InstanceType.AllowedValues).toContain('t3.xlarge');
    });

    test('should have VpcCidr with validation', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
      expect(template.Parameters.VpcCidr.Default).toBe('10.0.0.0/16');
    });
  });

  describe('Mappings', () => {
    test('should have PortConfig mapping', () => {
      expect(template.Mappings.PortConfig).toBeDefined();
    });

    test('PortConfig should have all required ports', () => {
      const portConfig = template.Mappings.PortConfig;
      expect(portConfig.HTTP).toBeDefined();
      expect(portConfig.HTTP.Port).toBe('80');
      expect(portConfig.HTTPS).toBeDefined();
      expect(portConfig.HTTPS.Port).toBe('443');
      expect(portConfig.MySQL).toBeDefined();
      expect(portConfig.MySQL.Port).toBe('3306');
      expect(portConfig.Redis).toBeDefined();
      expect(portConfig.Redis.Port).toBe('6379');
    });
  });

  describe('Conditions', () => {
    test('should have CreateElastiCache condition', () => {
      expect(template.Conditions.CreateElastiCache).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have 3 public and 3 private subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.AttachGateway).toBeDefined();
    });
  });

  describe('Compute Resources', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('should have ALB Security Group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe('Data Resources', () => {
    test('should have RDS Aurora Cluster', () => {
      expect(template.Resources.AuroraCluster).toBeDefined();
      expect(template.Resources.AuroraCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('should have Secrets Manager for password', () => {
      expect(template.Resources.DBMasterPasswordSecret).toBeDefined();
      expect(template.Resources.DBMasterPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('RDS should have Snapshot deletion policy', () => {
      expect(template.Resources.AuroraCluster.DeletionPolicy).toBe('Snapshot');
    });

    test('should have conditional ElastiCache', () => {
      const elastiCache = template.Resources.ElastiCacheReplicationGroup;
      if (elastiCache) {
        expect(elastiCache.Condition).toBe('CreateElastiCache');
      }
    });
  });

  describe('Outputs', () => {
    test('should have VPC outputs', () => {
      expect(template.Outputs.VpcId).toBeDefined();
      expect(template.Outputs.VpcId.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have LoadBalancer output', () => {
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
    });

    test('should have Database output', () => {
      expect(template.Outputs.DatabaseEndpoint).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    test('VPC should use EnvironmentSuffix in name', () => {
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('ALB should use EnvironmentSuffix', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const nameTag = alb.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Tagging Strategy', () => {
    test('VPC should have CostCenter tag', () => {
      const vpc = template.Resources.VPC;
      const costCenterTag = vpc.Properties.Tags.find((t: any) => t.Key === 'CostCenter');
      expect(costCenterTag).toBeDefined();
    });
  });

  describe('Security', () => {
    test('RDS should have encryption enabled', () => {
      expect(template.Resources.AuroraCluster.Properties.StorageEncrypted).toBe(true);
    });

    test('ElastiCache should have encryption if created', () => {
      const cache = template.Resources.ElastiCacheReplicationGroup;
      if (cache) {
        expect(cache.Properties.AtRestEncryptionEnabled).toBe(true);
        expect(cache.Properties.TransitEncryptionEnabled).toBe(true);
      }
    });
  });
});





