import * as fs from 'fs';
import * as path from 'path';
import {
  loadTemplate,
  validateTemplateStructure,
  getResourcesByType,
  validateResourceTags,
  validateResourceNaming,
  countResourcesByType,
  validateDeletionPolicies,
  validateEncryption,
  validateVPCConfiguration,
  validateSecurityGroups,
} from '../lib/template-loader';

describe('CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    template = loadTemplate();
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBeDefined();
    });

    test('should have DBMasterUsername parameter', () => {
      expect(template.Parameters.DBMasterUsername).toBeDefined();
      expect(template.Parameters.DBMasterUsername.Type).toBe('String');
      expect(template.Parameters.DBMasterUsername.NoEcho).toBe(true);
    });

    test('should have required tagging parameters', () => {
      expect(template.Parameters.CostCenter).toBeDefined();
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.DataClassification).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toBeDefined();
      expect(attachment.Properties.InternetGatewayId).toBeDefined();
    });

    test('should have public subnets in 3 AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();

      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(
        template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch
      ).toBe(true);

      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(
        template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch
      ).toBe(true);

      expect(template.Resources.PublicSubnet3.Type).toBe('AWS::EC2::Subnet');
      expect(
        template.Resources.PublicSubnet3.Properties.MapPublicIpOnLaunch
      ).toBe(true);
    });

    test('should have private subnets in 3 AZs', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();

      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      // MapPublicIpOnLaunch is false by default for private subnets (not explicitly set)
      expect(
        template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch
      ).toBeFalsy();
    });

    test('should have NAT Gateways for each AZ', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();
      expect(template.Resources.NATGateway3).toBeDefined();

      expect(template.Resources.NATGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGateway2.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGateway3.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have Elastic IPs for NAT Gateways', () => {
      expect(template.Resources.EIP1).toBeDefined();
      expect(template.Resources.EIP2).toBeDefined();
      expect(template.Resources.EIP3).toBeDefined();

      expect(template.Resources.EIP1.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.EIP1.Properties.Domain).toBe('vpc');
    });

    test('should have route table for public subnets', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe(
        'AWS::EC2::RouteTable'
      );
    });
  });

  describe('Lambda Resources', () => {
    test('should have Lambda function', () => {
      const lambda = template.Resources.CreditScoringFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('nodejs22.x');
      expect(lambda.Properties.Handler).toBe('index.handler');
    });

    test('should have Lambda execution role', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
    });

    test('should have Lambda invoke permission for ELB', () => {
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe(
        'elasticloadbalancing.amazonaws.com'
      );
    });

    test('should have Lambda log group with retention', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(365);
    });

    test('should have Lambda security group', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('Lambda should be in VPC', () => {
      const lambda = template.Resources.CreditScoringFunction;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
    });
  });

  describe('RDS Resources', () => {
    test('should have Aurora DB cluster', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.Properties.Engine).toBe('aurora-postgresql');
      expect(cluster.Properties.EngineMode).toBe('provisioned');
    });

    test('should have Aurora Serverless v2 scaling configuration', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.ServerlessV2ScalingConfiguration).toBeDefined();
      expect(
        cluster.Properties.ServerlessV2ScalingConfiguration.MinCapacity
      ).toBe(0.5);
      expect(
        cluster.Properties.ServerlessV2ScalingConfiguration.MaxCapacity
      ).toBe(1);
    });

    test('should have DB instance', () => {
      const instance = template.Resources.DBInstance1;
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::RDS::DBInstance');
      expect(instance.Properties.Engine).toBe('aurora-postgresql');
      expect(instance.Properties.DBInstanceClass).toBe('db.serverless');
    });

    test('should have DB subnet group with 3 subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toBeDefined();
      expect(Array.isArray(subnetGroup.Properties.SubnetIds)).toBe(true);
      expect(subnetGroup.Properties.SubnetIds.length).toBe(3);
    });

    test('should have RDS security group', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have encryption enabled with KMS', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toBeDefined();
    });

    test('should have backup retention of 30 days', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.BackupRetentionPeriod).toBe(30);
      expect(cluster.Properties.PreferredBackupWindow).toBeDefined();
    });

    test('should have CloudWatch logs enabled', () => {
      const cluster = template.Resources.DBCluster;
      expect(cluster.Properties.EnableCloudwatchLogsExports).toBeDefined();
      expect(
        Array.isArray(cluster.Properties.EnableCloudwatchLogsExports)
      ).toBe(true);
    });

    test('should have DeletionPolicy set to Delete', () => {
      const cluster = template.Resources.DBCluster;
      const instance = template.Resources.DBInstance1;
      expect(cluster.DeletionPolicy).toBe('Delete');
      expect(instance.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('should have Target Group for Lambda', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.TargetType).toBe('lambda');
    });

    test('should have HTTP Listener', () => {
      const listener = template.Resources.HTTPListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });

    test('should have ALB security group', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have ALB log group with retention', () => {
      const logGroup = template.Resources.ALBLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(365);
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS key', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have KMS key alias', () => {
      const alias = template.Resources.KMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('Resource Tagging', () => {
    const resourcesWithTags = [
      'VPC',
      'InternetGateway',
      'PublicSubnet1',
      'PublicSubnet2',
      'PublicSubnet3',
      'PrivateSubnet1',
      'PrivateSubnet2',
      'PrivateSubnet3',
      'DBCluster',
      'DBInstance1',
      'CreditScoringFunction',
      'ApplicationLoadBalancer',
      'LambdaLogGroup',
      'ALBLogGroup',
    ];

    resourcesWithTags.forEach(resourceName => {
      test(`${resourceName} should have required tags`, () => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();
        expect(resource.Properties.Tags).toBeDefined();
        expect(Array.isArray(resource.Properties.Tags)).toBe(true);

        const tags = resource.Properties.Tags;
        const tagKeys = tags.map((t: any) => t.Key);

        expect(tagKeys).toContain('CostCenter');
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('DataClassification');
      });
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Description).toBeDefined();
      expect(template.Outputs.VPCId.Value).toBeDefined();
    });

    test('should have ALBDNSName output', () => {
      expect(template.Outputs.ALBDNSName).toBeDefined();
      expect(template.Outputs.ALBDNSName.Description).toBeDefined();
      expect(template.Outputs.ALBDNSName.Value).toBeDefined();
    });

    test('should have LambdaFunctionArn output', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn.Description).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn.Value).toBeDefined();
    });

    test('should have DBClusterEndpoint output', () => {
      expect(template.Outputs.DBClusterEndpoint).toBeDefined();
      expect(template.Outputs.DBClusterEndpoint.Description).toBeDefined();
      expect(template.Outputs.DBClusterEndpoint.Value).toBeDefined();
    });

    test('should have KMSKeyId output', () => {
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.KMSKeyId.Description).toBeDefined();
      expect(template.Outputs.KMSKeyId.Value).toBeDefined();
    });
  });

  describe('Security Configuration', () => {
    test('should have no Retain deletion policies', () => {
      const resources = Object.keys(template.Resources);
      resources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('database should not be publicly accessible', () => {
      const instance = template.Resources.DBInstance1;
      expect(instance.Properties.PubliclyAccessible).toBe(false);
    });

    test('Lambda should have execution role', () => {
      const lambda = template.Resources.CreditScoringFunction;
      expect(lambda.Properties.Role).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    test('resource names should use EnvironmentSuffix', () => {
      const resourcesWithNames = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'CreditScoringFunction',
        'ApplicationLoadBalancer',
        'TargetGroup',
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameTag = resource.Properties.Tags?.find(
          (t: any) => t.Key === 'Name'
        );
        const name =
          resource.Properties.Name || resource.Properties.FunctionName;

        if (nameTag) {
          expect(nameTag.Value['Fn::Sub']).toMatch(/\$\{EnvironmentSuffix\}/);
        } else if (name) {
          if (typeof name === 'object' && name['Fn::Sub']) {
            expect(name['Fn::Sub']).toMatch(/\$\{EnvironmentSuffix\}/);
          }
        }
      });
    });
  });

  describe('Helper Function Validation', () => {
    test('validateTemplateStructure should return true', () => {
      expect(validateTemplateStructure(template)).toBe(true);
    });

    test('getResourcesByType should find EC2 subnets', () => {
      const subnets = getResourcesByType(template, 'AWS::EC2::Subnet');
      expect(subnets.length).toBeGreaterThanOrEqual(6);
    });

    test('validateDeletionPolicies should find no Retain policies', () => {
      const result = validateDeletionPolicies(template);
      expect(result.hasRetain).toBe(false);
      expect(result.resources.length).toBe(0);
    });

    test('validateEncryption should find encrypted resources', () => {
      const result = validateEncryption(template);
      expect(result.encrypted.length).toBeGreaterThan(0);
      expect(result.unencrypted.length).toBe(0);
    });

    test('validateVPCConfiguration should pass', () => {
      const result = validateVPCConfiguration(template);
      expect(result.valid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    test('validateSecurityGroups should find security groups', () => {
      const result = validateSecurityGroups(template);
      expect(result.count).toBeGreaterThan(0);
    });

    test('countResourcesByType should count all resource types', () => {
      const counts = countResourcesByType(template);
      expect(Object.keys(counts).length).toBeGreaterThan(0);
      expect(counts['AWS::EC2::VPC']).toBe(1);
      expect(counts['AWS::Lambda::Function']).toBeGreaterThanOrEqual(1);
    });

    test('validateResourceTags should validate required tags', () => {
      const vpc = template.Resources.VPC;
      expect(
        validateResourceTags(vpc, [
          'CostCenter',
          'Environment',
          'DataClassification',
        ])
      ).toBe(true);
      expect(validateResourceTags(vpc, ['NonExistentTag'])).toBe(false);
    });

    test('validateResourceTags should return false for resources without tags', () => {
      const resourceWithoutTags = {
        Type: 'AWS::Test::Resource',
        Properties: {},
      };
      expect(validateResourceTags(resourceWithoutTags, ['AnyTag'])).toBe(false);
    });

    test('validateResourceNaming should validate EnvironmentSuffix usage', () => {
      const vpc = template.Resources.VPC;
      const lambda = template.Resources.CreditScoringFunction;
      expect(validateResourceNaming(vpc)).toBe(true);
      expect(validateResourceNaming(lambda)).toBe(true);
    });

    test('validateResourceNaming should return true for resources without naming', () => {
      const resource = { Type: 'AWS::Test::Resource', Properties: {} };
      expect(validateResourceNaming(resource)).toBe(true);
    });

    test('getResourcesByType should return empty array for non-existent type', () => {
      const resources = getResourcesByType(template, 'AWS::NonExistent::Type');
      expect(resources.length).toBe(0);
    });

    test('validateTemplateStructure should return false for invalid template', () => {
      expect(validateTemplateStructure({})).toBe(false);
      expect(
        validateTemplateStructure({ AWSTemplateFormatVersion: '2010-09-09' })
      ).toBe(false);
      expect(validateTemplateStructure({ Resources: {} })).toBe(false);
    });

    test('validateResourceNaming should return true for resource with FunctionName using Fn::Sub', () => {
      const resourceWithFnSubName = {
        Type: 'AWS::Lambda::Function',
        Properties: {
          FunctionName: { 'Fn::Sub': 'my-function-${EnvironmentSuffix}' },
        },
      };
      expect(validateResourceNaming(resourceWithFnSubName)).toBe(true);
    });

    test('validateResourceNaming should return false for resource with FunctionName missing suffix', () => {
      const resourceWithoutSuffix = {
        Type: 'AWS::Lambda::Function',
        Properties: {
          FunctionName: { 'Fn::Sub': 'my-function-hardcoded' },
        },
      };
      expect(validateResourceNaming(resourceWithoutSuffix)).toBe(false);
    });

    test('validateDeletionPolicies should find Retain policies', () => {
      const templateWithRetain = {
        Resources: {
          MyBucket: {
            Type: 'AWS::S3::Bucket',
            DeletionPolicy: 'Retain',
            Properties: {},
          },
          MyTable: {
            Type: 'AWS::DynamoDB::Table',
            DeletionPolicy: 'Delete',
            Properties: {},
          },
        },
      };
      const result = validateDeletionPolicies(templateWithRetain);
      expect(result.hasRetain).toBe(true);
      expect(result.resources).toContain('MyBucket');
      expect(result.resources.length).toBe(1);
    });

    test('validateEncryption should find unencrypted DBCluster', () => {
      const templateWithUnencryptedDB = {
        Resources: {
          UnencryptedCluster: {
            Type: 'AWS::RDS::DBCluster',
            Properties: {
              StorageEncrypted: false,
            },
          },
        },
      };
      const result = validateEncryption(templateWithUnencryptedDB);
      expect(result.unencrypted).toContain('UnencryptedCluster');
      expect(result.encrypted.length).toBe(0);
    });

    test('validateVPCConfiguration should detect missing VPC', () => {
      const templateWithoutVPC = {
        Resources: {
          MyLambda: {
            Type: 'AWS::Lambda::Function',
            Properties: {},
          },
        },
      };
      const result = validateVPCConfiguration(templateWithoutVPC);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('No VPC resource found');
    });

    test('validateVPCConfiguration should detect insufficient public subnets', () => {
      const templateWithOnePublicSubnet = {
        Resources: {
          VPC: {
            Type: 'AWS::EC2::VPC',
            Properties: { CidrBlock: '10.0.0.0/16' },
          },
          PublicSubnet1: {
            Type: 'AWS::EC2::Subnet',
            Properties: { MapPublicIpOnLaunch: true },
          },
          PrivateSubnet1: {
            Type: 'AWS::EC2::Subnet',
            Properties: { MapPublicIpOnLaunch: false },
          },
          PrivateSubnet2: {
            Type: 'AWS::EC2::Subnet',
            Properties: { MapPublicIpOnLaunch: false },
          },
        },
      };
      const result = validateVPCConfiguration(templateWithOnePublicSubnet);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Less than 2 public subnets found');
      expect(result.issues).toContain('No NAT Gateways found');
    });

    test('validateVPCConfiguration should detect insufficient private subnets', () => {
      const templateWithOnePrivateSubnet = {
        Resources: {
          VPC: {
            Type: 'AWS::EC2::VPC',
            Properties: { CidrBlock: '10.0.0.0/16' },
          },
          PublicSubnet1: {
            Type: 'AWS::EC2::Subnet',
            Properties: { MapPublicIpOnLaunch: true },
          },
          PublicSubnet2: {
            Type: 'AWS::EC2::Subnet',
            Properties: { MapPublicIpOnLaunch: true },
          },
          PrivateSubnet1: {
            Type: 'AWS::EC2::Subnet',
            Properties: { MapPublicIpOnLaunch: false },
          },
        },
      };
      const result = validateVPCConfiguration(templateWithOnePrivateSubnet);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Less than 2 private subnets found');
    });

    test('validateVPCConfiguration should detect missing NAT Gateways', () => {
      const templateWithoutNAT = {
        Resources: {
          VPC: {
            Type: 'AWS::EC2::VPC',
            Properties: { CidrBlock: '10.0.0.0/16' },
          },
          PublicSubnet1: {
            Type: 'AWS::EC2::Subnet',
            Properties: { MapPublicIpOnLaunch: true },
          },
          PublicSubnet2: {
            Type: 'AWS::EC2::Subnet',
            Properties: { MapPublicIpOnLaunch: true },
          },
          PrivateSubnet1: {
            Type: 'AWS::EC2::Subnet',
            Properties: { MapPublicIpOnLaunch: false },
          },
          PrivateSubnet2: {
            Type: 'AWS::EC2::Subnet',
            Properties: { MapPublicIpOnLaunch: false },
          },
        },
      };
      const result = validateVPCConfiguration(templateWithoutNAT);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('No NAT Gateways found');
    });

    test('validateTemplateStructure should return false for template with empty Resources', () => {
      const templateEmptyResources = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {},
      };
      expect(validateTemplateStructure(templateEmptyResources)).toBe(false);
    });

    test('validateResourceNaming should return false for resource without Properties', () => {
      const resourceNoProps = { Type: 'AWS::Test::Resource' };
      expect(validateResourceNaming(resourceNoProps)).toBe(false);
    });

    test('validateSecurityGroups should detect security groups without rules', () => {
      const templateWithSGNoRules = {
        Resources: {
          MySG: {
            Type: 'AWS::EC2::SecurityGroup',
            Properties: {
              GroupDescription: 'Test SG',
            },
          },
        },
      };
      const result = validateSecurityGroups(templateWithSGNoRules);
      expect(result.count).toBe(1);
      expect(result.hasRules).toBe(false);
    });
  });
});
