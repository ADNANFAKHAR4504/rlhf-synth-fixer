import fs from 'fs';
import path from 'path';
import * as validator from '../lib/template-validator';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Master Template', () => {
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

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Master stack');
    });

    test('should have metadata section with parameter interface', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParams = [
        'EnvironmentSuffix',
        'EnvironmentType',
        'CostCenter',
        'VpcCidr',
        'AvailabilityZone1',
        'AvailabilityZone2',
        'AvailabilityZone3',
        'InstanceType',
        'MinSize',
        'MaxSize',
        'DesiredCapacity',
        'DBMasterUsername',
        'DBMasterPassword',
        'EnableElastiCache',
        'TemplatesBucketName',
        'VPCTemplateKey',
        'ComputeTemplateKey',
        'DataTemplateKey',
      ];

      requiredParams.forEach((param) => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix should have correct constraints', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.MinLength).toBe(3);
      expect(param.MaxLength).toBe(10);
      expect(param.AllowedPattern).toBe('[a-z0-9]+');
    });

    test('EnvironmentType should have correct allowed values', () => {
      const param = template.Parameters.EnvironmentType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('InstanceType should have correct allowed values', () => {
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.medium');
      expect(param.AllowedValues).toEqual(['t3.medium', 't3.large', 't3.xlarge']);
    });

    test('DBMasterUsername should have correct pattern', () => {
      const param = template.Parameters.DBMasterUsername;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
    });

    test('DBMasterPassword should be NoEcho', () => {
      const param = template.Parameters.DBMasterPassword;
      expect(param.Type).toBe('String');
      expect(param.NoEcho).toBe(true);
      expect(param.MinLength).toBe(8);
      expect(param.MaxLength).toBe(41);
    });

    test('VpcCidr should have valid CIDR pattern', () => {
      const param = template.Parameters.VpcCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toMatch(/\\d{1,3}/);
    });

    test('Number parameters should have min/max values', () => {
      const minSizeParam = template.Parameters.MinSize;
      expect(minSizeParam.Type).toBe('Number');
      expect(minSizeParam.MinValue).toBe(1);
      expect(minSizeParam.MaxValue).toBe(10);

      const maxSizeParam = template.Parameters.MaxSize;
      expect(maxSizeParam.Type).toBe('Number');
      expect(maxSizeParam.MinValue).toBe(1);
      expect(maxSizeParam.MaxValue).toBe(20);
    });
  });

  describe('Conditions', () => {
    test('should have IsProduction condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
      expect(template.Conditions.IsProduction['Fn::Equals']).toEqual([
        { Ref: 'EnvironmentType' },
        'prod',
      ]);
    });
  });

  describe('Resources - Nested Stacks', () => {
    test('should have all three nested stacks', () => {
      expect(template.Resources.VPCStack).toBeDefined();
      expect(template.Resources.ComputeStack).toBeDefined();
      expect(template.Resources.DataStack).toBeDefined();
    });

    test('VPCStack should have correct type', () => {
      const stack = template.Resources.VPCStack;
      expect(stack.Type).toBe('AWS::CloudFormation::Stack');
    });

    test('VPCStack should pass correct parameters', () => {
      const stack = template.Resources.VPCStack;
      const params = stack.Properties.Parameters;

      expect(params.EnvironmentSuffix).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(params.VpcCidr).toEqual({ Ref: 'VpcCidr' });
      expect(params.AvailabilityZone1).toEqual({ Ref: 'AvailabilityZone1' });
      expect(params.AvailabilityZone2).toEqual({ Ref: 'AvailabilityZone2' });
      expect(params.AvailabilityZone3).toEqual({ Ref: 'AvailabilityZone3' });
      expect(params.CostCenter).toEqual({ Ref: 'CostCenter' });
    });

    test('ComputeStack should use VPCStack outputs', () => {
      const stack = template.Resources.ComputeStack;
      const params = stack.Properties.Parameters;

      expect(params.VpcId).toEqual({ 'Fn::GetAtt': ['VPCStack', 'Outputs.VpcId'] });
      expect(params.PublicSubnet1).toEqual({ 'Fn::GetAtt': ['VPCStack', 'Outputs.PublicSubnet1'] });
      expect(params.PrivateSubnet1).toEqual({ 'Fn::GetAtt': ['VPCStack', 'Outputs.PrivateSubnet1'] });
    });

    test('DataStack should use VPCStack outputs', () => {
      const stack = template.Resources.DataStack;
      const params = stack.Properties.Parameters;

      expect(params.VpcId).toEqual({ 'Fn::GetAtt': ['VPCStack', 'Outputs.VpcId'] });
      expect(params.PrivateSubnet1).toEqual({ 'Fn::GetAtt': ['VPCStack', 'Outputs.PrivateSubnet1'] });
      expect(params.DBMasterUsername).toEqual({ Ref: 'DBMasterUsername' });
      expect(params.DBMasterPassword).toEqual({ Ref: 'DBMasterPassword' });
    });

    test('nested stacks should have tags', () => {
      const vpcStack = template.Resources.VPCStack;
      const computeStack = template.Resources.ComputeStack;
      const dataStack = template.Resources.DataStack;

      [vpcStack, computeStack, dataStack].forEach((stack) => {
        expect(stack.Properties.Tags).toBeDefined();
        expect(stack.Properties.Tags.length).toBeGreaterThan(0);
      });
    });

    test('nested stack template URLs should use TemplatesBucketName parameter', () => {
      const vpcStack = template.Resources.VPCStack;
      expect(vpcStack.Properties.TemplateURL['Fn::Sub']).toContain('${TemplatesBucketName}');
      expect(vpcStack.Properties.TemplateURL['Fn::Sub']).toContain('${VPCTemplateKey}');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = ['VpcId', 'LoadBalancerDNS', 'DatabaseEndpoint'];
      requiredOutputs.forEach((output) => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('outputs should use nested stack outputs', () => {
      const vpcIdOutput = template.Outputs.VpcId;
      expect(vpcIdOutput.Value).toEqual({ 'Fn::GetAtt': ['VPCStack', 'Outputs.VpcId'] });

      const albOutput = template.Outputs.LoadBalancerDNS;
      expect(albOutput.Value).toEqual({ 'Fn::GetAtt': ['ComputeStack', 'Outputs.LoadBalancerDNS'] });

      const dbOutput = template.Outputs.DatabaseEndpoint;
      expect(dbOutput.Value).toEqual({ 'Fn::GetAtt': ['DataStack', 'Outputs.DatabaseEndpoint'] });
    });

    test('outputs should have exports with environmentSuffix', () => {
      const vpcIdOutput = template.Outputs.VpcId;
      expect(vpcIdOutput.Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');

      const albOutput = template.Outputs.LoadBalancerDNS;
      expect(albOutput.Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('CacheEndpoint output should be conditional', () => {
      const cacheOutput = template.Outputs.CacheEndpoint;
      expect(cacheOutput.Condition).toBe('IsProduction');
    });
  });

  describe('Parameter Interface Grouping', () => {
    test('should have parameter groups', () => {
      const paramGroups = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(paramGroups).toBeDefined();
      expect(paramGroups.length).toBeGreaterThanOrEqual(4);
    });

    test('should have environment configuration group', () => {
      const paramGroups = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      const envGroup = paramGroups.find((g: any) => g.Label.default === 'Environment Configuration');
      expect(envGroup).toBeDefined();
      expect(envGroup.Parameters).toContain('EnvironmentSuffix');
      expect(envGroup.Parameters).toContain('EnvironmentType');
      expect(envGroup.Parameters).toContain('CostCenter');
    });

    test('should have parameter labels', () => {
      const paramLabels = template.Metadata['AWS::CloudFormation::Interface'].ParameterLabels;
      expect(paramLabels.EnvironmentSuffix).toBeDefined();
      expect(paramLabels.DBMasterPassword).toBeDefined();
    });
  });
});

describe('VPCStack CloudFormation Nested Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/VPCStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(template.Description).toContain('VPC nested stack');
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParams = [
        'EnvironmentSuffix',
        'VpcCidr',
        'AvailabilityZone1',
        'AvailabilityZone2',
        'AvailabilityZone3',
        'CostCenter',
      ];
      requiredParams.forEach((param) => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });
  });

  describe('Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should use VpcCidr parameter', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
    });

    test('VPC should have DNS enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have 3 public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();
    });

    test('should have 3 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('public subnets should use Fn::Cidr for CIDR calculation', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      expect(subnet1.Properties.CidrBlock['Fn::Select']).toBeDefined();
      expect(subnet1.Properties.CidrBlock['Fn::Select'][1]['Fn::Cidr']).toBeDefined();
    });

    test('public subnets should map public IPs', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have public and private route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
    });

    test('should have S3 endpoint', () => {
      expect(template.Resources.S3Endpoint).toBeDefined();
      expect(template.Resources.S3Endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    test('all resources should have environmentSuffix in name tags', () => {
      const resourcesWithNames = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PrivateSubnet1',
        'PublicRouteTable',
        'PrivateRouteTable',
      ];

      resourcesWithNames.forEach((resourceName) => {
        const resource = template.Resources[resourceName];
        const nameTag = resource.Properties.Tags.find((t: any) => t.Key === 'Name');
        expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('Outputs', () => {
    test('should have all subnet outputs', () => {
      const requiredOutputs = [
        'VpcId',
        'PublicSubnet1',
        'PublicSubnet2',
        'PublicSubnet3',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PrivateSubnet3',
      ];
      requiredOutputs.forEach((output) => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('outputs should have exports', () => {
      const vpcIdOutput = template.Outputs.VpcId;
      expect(vpcIdOutput.Export.Name['Fn::Sub']).toContain('VpcId-${EnvironmentSuffix}');
    });
  });
});

describe('ComputeStack CloudFormation Nested Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/ComputeStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });
  });

  describe('Mappings', () => {
    test('should have PortConfig mapping', () => {
      expect(template.Mappings.PortConfig).toBeDefined();
      expect(template.Mappings.PortConfig.HTTP).toBeDefined();
      expect(template.Mappings.PortConfig.HTTPS).toBeDefined();
    });
  });

  describe('Resources', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should have ALB Security Group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('should have Launch Template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('ALB security group should use FindInMap for ports', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const httpRule = sg.Properties.SecurityGroupIngress[0];
      expect(httpRule.FromPort['Fn::FindInMap']).toBeDefined();
      expect(httpRule.FromPort['Fn::FindInMap']).toEqual(['PortConfig', 'HTTP', 'Port']);
    });

    test('Auto Scaling Group should use Min/Max/Desired from parameters', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toEqual({ Ref: 'MinSize' });
      expect(asg.Properties.MaxSize).toEqual({ Ref: 'MaxSize' });
      expect(asg.Properties.DesiredCapacity).toEqual({ Ref: 'DesiredCapacity' });
    });

    test('resources should have environmentSuffix in name tags', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const nameTag = alb.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Outputs', () => {
    test('should have LoadBalancerDNS output', () => {
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
      expect(template.Outputs.LoadBalancerDNS.Value['Fn::GetAtt']).toEqual([
        'ApplicationLoadBalancer',
        'DNSName',
      ]);
    });
  });
});

describe('DataStack CloudFormation Nested Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/DataStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });
  });

  describe('Mappings', () => {
    test('should have PortConfig for MySQL and Redis', () => {
      expect(template.Mappings.PortConfig.MySQL.Port).toBe('3306');
      expect(template.Mappings.PortConfig.Redis.Port).toBe('6379');
    });
  });

  describe('Conditions', () => {
    test('should have CreateElastiCache condition', () => {
      expect(template.Conditions.CreateElastiCache).toBeDefined();
      expect(template.Conditions.CreateElastiCache['Fn::Equals']).toEqual([
        { Ref: 'EnableElastiCache' },
        'true',
      ]);
    });
  });

  describe('Resources', () => {
    test('should have RDS Aurora cluster', () => {
      expect(template.Resources.AuroraCluster).toBeDefined();
      expect(template.Resources.AuroraCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('Aurora cluster should have snapshot deletion policy', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.DeletionPolicy).toBe('Snapshot');
      expect(cluster.UpdateReplacePolicy).toBe('Snapshot');
    });

    test('Aurora cluster should have storage encryption enabled', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
    });

    test('should have two Aurora instances', () => {
      expect(template.Resources.AuroraInstance1).toBeDefined();
      expect(template.Resources.AuroraInstance2).toBeDefined();
    });

    test('should have DB subnet group with 3 subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Properties.SubnetIds.length).toBe(3);
    });

    test('ElastiCache resources should be conditional', () => {
      expect(template.Resources.ElastiCacheReplicationGroup.Condition).toBe('CreateElastiCache');
      expect(template.Resources.CacheSecurityGroup.Condition).toBe('CreateElastiCache');
      expect(template.Resources.CacheSubnetGroup.Condition).toBe('CreateElastiCache');
    });

    test('ElastiCache should have snapshot deletion policy', () => {
      const cache = template.Resources.ElastiCacheReplicationGroup;
      expect(cache.DeletionPolicy).toBe('Snapshot');
      expect(cache.UpdateReplacePolicy).toBe('Snapshot');
    });

    test('ElastiCache should have encryption enabled', () => {
      const cache = template.Resources.ElastiCacheReplicationGroup;
      expect(cache.Properties.AtRestEncryptionEnabled).toBe(true);
      expect(cache.Properties.TransitEncryptionEnabled).toBe(true);
    });

    test('security groups should use FindInMap for ports', () => {
      const dbSg = template.Resources.DBSecurityGroup;
      const rule = dbSg.Properties.SecurityGroupIngress[0];
      expect(rule.FromPort['Fn::FindInMap']).toEqual(['PortConfig', 'MySQL', 'Port']);
    });

    test('resources should have environmentSuffix in names', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.DBClusterIdentifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Outputs', () => {
    test('should have DatabaseEndpoint output', () => {
      expect(template.Outputs.DatabaseEndpoint).toBeDefined();
      expect(template.Outputs.DatabaseEndpoint.Value['Fn::GetAtt']).toEqual([
        'AuroraCluster',
        'Endpoint.Address',
      ]);
    });

    test('CacheEndpoint output should be conditional', () => {
      expect(template.Outputs.CacheEndpoint.Condition).toBe('CreateElastiCache');
    });
  });
});

describe('Template Validator Utilities', () => {
  describe('loadTemplate', () => {
    test('should load TapStack template', () => {
      const template = validator.loadTemplate('TapStack.json');
      expect(template).toBeDefined();
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should load VPCStack template', () => {
      const template = validator.loadTemplate('VPCStack.json');
      expect(template).toBeDefined();
      expect(template.Resources.VPC).toBeDefined();
    });

    test('should load ComputeStack template', () => {
      const template = validator.loadTemplate('ComputeStack.json');
      expect(template).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
    });

    test('should load DataStack template', () => {
      const template = validator.loadTemplate('DataStack.json');
      expect(template).toBeDefined();
      expect(template.Resources.AuroraCluster).toBeDefined();
    });
  });

  describe('validateTemplateStructure', () => {
    test('should validate TapStack structure', () => {
      const template = validator.loadTemplate('TapStack.json');
      expect(validator.validateTemplateStructure(template)).toBe(true);
    });

    test('should validate VPCStack structure', () => {
      const template = validator.loadTemplate('VPCStack.json');
      expect(validator.validateTemplateStructure(template)).toBe(true);
    });

    test('should throw error for missing version', () => {
      const invalidTemplate = { Resources: {} } as any;
      expect(() => validator.validateTemplateStructure(invalidTemplate)).toThrow(
        'Template missing AWSTemplateFormatVersion'
      );
    });

    test('should throw error for invalid version', () => {
      const invalidTemplate = {
        AWSTemplateFormatVersion: '2009-01-01',
        Resources: {},
      } as any;
      expect(() => validator.validateTemplateStructure(invalidTemplate)).toThrow(
        'Invalid AWSTemplateFormatVersion'
      );
    });

    test('should throw error for missing resources', () => {
      const invalidTemplate = { AWSTemplateFormatVersion: '2010-09-09' } as any;
      expect(() => validator.validateTemplateStructure(invalidTemplate)).toThrow(
        'Template must have at least one resource'
      );
    });
  });

  describe('getParameterNames', () => {
    test('should get all parameters from TapStack', () => {
      const template = validator.loadTemplate('TapStack.json');
      const params = validator.getParameterNames(template);
      expect(params).toContain('EnvironmentSuffix');
      expect(params).toContain('EnvironmentType');
      expect(params).toContain('DBMasterPassword');
      expect(params.length).toBeGreaterThan(15);
    });

    test('should return empty array for template without parameters', () => {
      const template = { AWSTemplateFormatVersion: '2010-09-09', Resources: { test: {} } } as any;
      const params = validator.getParameterNames(template);
      expect(params).toEqual([]);
    });
  });

  describe('getResourceNames', () => {
    test('should get all resources from VPCStack', () => {
      const template = validator.loadTemplate('VPCStack.json');
      const resources = validator.getResourceNames(template);
      expect(resources).toContain('VPC');
      expect(resources).toContain('InternetGateway');
      expect(resources).toContain('PublicSubnet1');
      expect(resources.length).toBeGreaterThan(15);
    });

    test('should get all resources from DataStack', () => {
      const template = validator.loadTemplate('DataStack.json');
      const resources = validator.getResourceNames(template);
      expect(resources).toContain('AuroraCluster');
      expect(resources).toContain('DBSecurityGroup');
    });
  });

  describe('getOutputNames', () => {
    test('should get all outputs from TapStack', () => {
      const template = validator.loadTemplate('TapStack.json');
      const outputs = validator.getOutputNames(template);
      expect(outputs).toContain('VpcId');
      expect(outputs).toContain('LoadBalancerDNS');
      expect(outputs).toContain('DatabaseEndpoint');
    });

    test('should return empty array for template without outputs', () => {
      const template = { AWSTemplateFormatVersion: '2010-09-09', Resources: { test: {} } } as any;
      const outputs = validator.getOutputNames(template);
      expect(outputs).toEqual([]);
    });
  });

  describe('hasDefaultValue', () => {
    test('should detect parameters with defaults in TapStack', () => {
      const template = validator.loadTemplate('TapStack.json');
      expect(validator.hasDefaultValue(template, 'EnvironmentType')).toBe(true);
      expect(validator.hasDefaultValue(template, 'InstanceType')).toBe(true);
      expect(validator.hasDefaultValue(template, 'VpcCidr')).toBe(true);
    });

    test('should detect parameters without defaults', () => {
      const template = validator.loadTemplate('TapStack.json');
      expect(validator.hasDefaultValue(template, 'EnvironmentSuffix')).toBe(false);
      expect(validator.hasDefaultValue(template, 'DBMasterPassword')).toBe(false);
    });

    test('should return false for non-existent parameter', () => {
      const template = validator.loadTemplate('TapStack.json');
      expect(validator.hasDefaultValue(template, 'NonExistent')).toBe(false);
    });
  });

  describe('getResourceType', () => {
    test('should get resource types from VPCStack', () => {
      const template = validator.loadTemplate('VPCStack.json');
      expect(validator.getResourceType(template, 'VPC')).toBe('AWS::EC2::VPC');
      expect(validator.getResourceType(template, 'InternetGateway')).toBe('AWS::EC2::InternetGateway');
      expect(validator.getResourceType(template, 'PublicSubnet1')).toBe('AWS::EC2::Subnet');
    });

    test('should throw error for non-existent resource', () => {
      const template = validator.loadTemplate('VPCStack.json');
      expect(() => validator.getResourceType(template, 'NonExistent')).toThrow(
        'Resource NonExistent not found'
      );
    });
  });

  describe('hasTag', () => {
    test('should detect tags in VPCStack resources', () => {
      const template = validator.loadTemplate('VPCStack.json');
      expect(validator.hasTag(template, 'VPC', 'Name')).toBe(true);
      expect(validator.hasTag(template, 'VPC', 'CostCenter')).toBe(true);
    });

    test('should return false for non-existent tag', () => {
      const template = validator.loadTemplate('VPCStack.json');
      expect(validator.hasTag(template, 'VPC', 'NonExistentTag')).toBe(false);
    });

    test('should return false for resource without tags', () => {
      const template = validator.loadTemplate('VPCStack.json');
      expect(validator.hasTag(template, 'S3Endpoint', 'Name')).toBe(false);
    });

    test('should return false for non-existent resource', () => {
      const template = validator.loadTemplate('VPCStack.json');
      expect(validator.hasTag(template, 'NonExistentResource', 'Name')).toBe(false);
    });
  });

  describe('getResourcesByType', () => {
    test('should get all subnets from VPCStack', () => {
      const template = validator.loadTemplate('VPCStack.json');
      const subnets = validator.getResourcesByType(template, 'AWS::EC2::Subnet');
      expect(subnets.length).toBe(6); // 3 public + 3 private
    });

    test('should get all security groups from DataStack', () => {
      const template = validator.loadTemplate('DataStack.json');
      const securityGroups = validator.getResourcesByType(template, 'AWS::EC2::SecurityGroup');
      expect(securityGroups.length).toBeGreaterThanOrEqual(2);
    });

    test('should return empty array for non-existent type', () => {
      const template = validator.loadTemplate('VPCStack.json');
      const resources = validator.getResourcesByType(template, 'AWS::S3::Bucket');
      expect(resources).toEqual([]);
    });
  });

  describe('hasNestedStacks', () => {
    test('should detect nested stacks in TapStack', () => {
      const template = validator.loadTemplate('TapStack.json');
      expect(validator.hasNestedStacks(template)).toBe(true);
    });

    test('should not detect nested stacks in VPCStack', () => {
      const template = validator.loadTemplate('VPCStack.json');
      expect(validator.hasNestedStacks(template)).toBe(false);
    });

    test('should not detect nested stacks in ComputeStack', () => {
      const template = validator.loadTemplate('ComputeStack.json');
      expect(validator.hasNestedStacks(template)).toBe(false);
    });
  });

  describe('validateEnvironmentSuffixUsage', () => {
    test('should validate environmentSuffix usage in VPCStack', () => {
      const template = validator.loadTemplate('VPCStack.json');
      expect(validator.validateEnvironmentSuffixUsage(template)).toBe(true);
    });

    test('should validate environmentSuffix usage in ComputeStack', () => {
      const template = validator.loadTemplate('ComputeStack.json');
      expect(validator.validateEnvironmentSuffixUsage(template)).toBe(true);
    });

    test('should validate environmentSuffix usage in DataStack', () => {
      const template = validator.loadTemplate('DataStack.json');
      expect(validator.validateEnvironmentSuffixUsage(template)).toBe(true);
    });
  });

  describe('getConditionNames', () => {
    test('should get conditions from TapStack', () => {
      const template = validator.loadTemplate('TapStack.json');
      const conditions = validator.getConditionNames(template);
      expect(conditions).toContain('IsProduction');
    });

    test('should get conditions from DataStack', () => {
      const template = validator.loadTemplate('DataStack.json');
      const conditions = validator.getConditionNames(template);
      expect(conditions).toContain('CreateElastiCache');
    });

    test('should return empty array for template without conditions', () => {
      const template = validator.loadTemplate('VPCStack.json');
      const conditions = validator.getConditionNames(template);
      expect(conditions).toEqual([]);
    });
  });

  describe('isConditionalResource', () => {
    test('should detect conditional resources in DataStack', () => {
      const template = validator.loadTemplate('DataStack.json');
      expect(validator.isConditionalResource(template, 'ElastiCacheReplicationGroup')).toBe(true);
      expect(validator.isConditionalResource(template, 'CacheSecurityGroup')).toBe(true);
    });

    test('should detect non-conditional resources', () => {
      const template = validator.loadTemplate('DataStack.json');
      expect(validator.isConditionalResource(template, 'AuroraCluster')).toBe(false);
    });

    test('should return false for non-existent resource', () => {
      const template = validator.loadTemplate('DataStack.json');
      expect(validator.isConditionalResource(template, 'NonExistent')).toBe(false);
    });
  });

  describe('getExportNames', () => {
    test('should get export names from TapStack', () => {
      const template = validator.loadTemplate('TapStack.json');
      const exports = validator.getExportNames(template);
      expect(exports.length).toBeGreaterThan(0);
      expect(exports.some((exp) => exp.includes('VpcId'))).toBe(true);
    });

    test('should get export names from VPCStack', () => {
      const template = validator.loadTemplate('VPCStack.json');
      const exports = validator.getExportNames(template);
      expect(exports.length).toBeGreaterThan(0);
    });
  });

  describe('validateDeletionPolicies', () => {
    test('should validate DataStack deletion policies', () => {
      const template = validator.loadTemplate('DataStack.json');
      const issues = validator.validateDeletionPolicies(template);
      expect(issues).toEqual([]); // All stateful resources should have Snapshot policy
    });

    test('should not report issues for VPCStack', () => {
      const template = validator.loadTemplate('VPCStack.json');
      const issues = validator.validateDeletionPolicies(template);
      expect(issues).toEqual([]); // VPC has no stateful resources
    });

    test('should detect missing deletion policy', () => {
      const templateWithMissingPolicy = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          MyCluster: {
            Type: 'AWS::RDS::DBCluster',
            Properties: {},
          },
        },
      } as any;
      const issues = validator.validateDeletionPolicies(templateWithMissingPolicy);
      expect(issues.length).toBe(1);
      expect(issues[0]).toContain('MyCluster');
    });
  });

  describe('validateEnvironmentSuffixUsage', () => {
    test('should warn about missing environmentSuffix', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const templateWithMissingSuffix = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          MyResource: {
            Type: 'AWS::EC2::VPC',
            Properties: {
              Tags: [
                {
                  Key: 'Name',
                  Value: {
                    'Fn::Sub': 'vpc-${AWS::StackName}', // Missing environmentSuffix
                  },
                },
              ],
            },
          },
        },
      } as any;
      const result = validator.validateEnvironmentSuffixUsage(templateWithMissingSuffix);
      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getExportNames with non-Fn::Sub values', () => {
    test('should handle string export values', () => {
      const templateWithStringExport = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {},
        Outputs: {
          Test: {
            Value: 'test',
            Export: {
              Name: 'PlainStringExport',
            },
          },
        },
      } as any;
      const exports = validator.getExportNames(templateWithStringExport);
      expect(exports).toContain('PlainStringExport');
    });
  });
});
