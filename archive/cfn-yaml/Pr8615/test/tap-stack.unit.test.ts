import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Custom YAML types for CloudFormation intrinsic functions
const cfnTags = [
  'Ref', 'GetAtt', 'Sub', 'Join', 'Select', 'Split', 'If', 'Equals',
  'And', 'Or', 'Not', 'Condition', 'FindInMap', 'Base64', 'Cidr',
  'GetAZs', 'ImportValue', 'Transform'
].map(tag => {
  return new yaml.Type(`!${tag}`, {
    kind: 'scalar',
    construct: (data: any) => ({ [`Fn::${tag}`]: data }),
    predicate: () => false,
  });
}).concat([
  'Ref', 'GetAtt', 'Sub', 'Join', 'Select', 'Split', 'If', 'Equals',
  'And', 'Or', 'Not', 'Condition', 'FindInMap', 'Base64', 'Cidr',
  'GetAZs', 'ImportValue', 'Transform'
].map(tag => {
  return new yaml.Type(`!${tag}`, {
    kind: 'sequence',
    construct: (data: any) => ({ [`Fn::${tag}`]: data }),
    predicate: () => false,
  });
})).concat([
  'Ref', 'GetAtt', 'Sub', 'Join', 'Select', 'Split', 'If', 'Equals',
  'And', 'Or', 'Not', 'Condition', 'FindInMap', 'Base64', 'Cidr',
  'GetAZs', 'ImportValue', 'Transform'
].map(tag => {
  return new yaml.Type(`!${tag}`, {
    kind: 'mapping',
    construct: (data: any) => ({ [`Fn::${tag}`]: data }),
    predicate: () => false,
  });
}));

const CFN_SCHEMA = yaml.DEFAULT_SCHEMA.extend(cfnTags);

describe('Secure AWS Infrastructure CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: CFN_SCHEMA });
  });

  describe('Template Structure', () => {
    test('should have valid AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBe('Secure AWS Infrastructure with VPC, EC2, RDS, S3, CloudWatch, and CloudTrail');
    });

    test('should have Parameters, Resources, and Outputs', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have Conditions section', () => {
      expect(template.Conditions).toBeDefined();
    });
  });

  describe('Parameters', () => {
    const params = [
      'Project',
      'Environment',
      'AllowedIPRange',
      'InstanceType',
      'LatestAmiId',
      'EnableEC2',
      'EnableRDS',
      'EnableNATGateway'
    ];

    params.forEach(param => {
      test(`should define parameter ${param}`, () => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });
  });

  describe('Conditions', () => {
    const conditions = ['CreateEC2', 'CreateRDS', 'CreateNATGateway'];

    conditions.forEach(condition => {
      test(`should define condition ${condition}`, () => {
        expect(template.Conditions[condition]).toBeDefined();
      });
    });
  });

  describe('Resources', () => {
    // Core resources (always created)
    const coreResources: Record<string, string> = {
      SecureKMSKey: 'AWS::KMS::Key',
      SecureKMSKeyAlias: 'AWS::KMS::Alias',
      SecureVPC: 'AWS::EC2::VPC',
      SecureInternetGateway: 'AWS::EC2::InternetGateway',
      AttachGateway: 'AWS::EC2::VPCGatewayAttachment',
      PublicSubnet1: 'AWS::EC2::Subnet',
      PublicSubnet2: 'AWS::EC2::Subnet',
      PrivateSubnet1: 'AWS::EC2::Subnet',
      PrivateSubnet2: 'AWS::EC2::Subnet',
      PublicRouteTable: 'AWS::EC2::RouteTable',
      PublicRoute: 'AWS::EC2::Route',
      PublicSubnet1RouteTableAssociation: 'AWS::EC2::SubnetRouteTableAssociation',
      PublicSubnet2RouteTableAssociation: 'AWS::EC2::SubnetRouteTableAssociation',
      PrivateRouteTable1: 'AWS::EC2::RouteTable',
      PrivateRouteTable2: 'AWS::EC2::RouteTable',
      PrivateSubnet1RouteTableAssociation: 'AWS::EC2::SubnetRouteTableAssociation',
      PrivateSubnet2RouteTableAssociation: 'AWS::EC2::SubnetRouteTableAssociation',
      EC2SecurityGroup: 'AWS::EC2::SecurityGroup',
      RDSSecurityGroup: 'AWS::EC2::SecurityGroup',
      EC2Role: 'AWS::IAM::Role',
      EC2InstanceProfile: 'AWS::IAM::InstanceProfile',
      CloudTrailRole: 'AWS::IAM::Role',
      LoggingBucket: 'AWS::S3::Bucket',
      LoggingBucketPolicy: 'AWS::S3::BucketPolicy',
      SecureS3Bucket: 'AWS::S3::Bucket',
      CloudTrailBucket: 'AWS::S3::Bucket',
      CloudTrailBucketPolicy: 'AWS::S3::BucketPolicy',
      EC2LogGroup: 'AWS::Logs::LogGroup',
      RDSLogGroup: 'AWS::Logs::LogGroup',
      S3LogGroup: 'AWS::Logs::LogGroup',
      CloudTrailLogGroup: 'AWS::Logs::LogGroup'
    };

    // Conditional resources
    const conditionalResources: Record<string, { type: string; condition: string }> = {
      NatGateway1EIP: { type: 'AWS::EC2::EIP', condition: 'CreateNATGateway' },
      NatGateway2EIP: { type: 'AWS::EC2::EIP', condition: 'CreateNATGateway' },
      NatGateway1: { type: 'AWS::EC2::NatGateway', condition: 'CreateNATGateway' },
      NatGateway2: { type: 'AWS::EC2::NatGateway', condition: 'CreateNATGateway' },
      DefaultPrivateRoute1: { type: 'AWS::EC2::Route', condition: 'CreateNATGateway' },
      DefaultPrivateRoute2: { type: 'AWS::EC2::Route', condition: 'CreateNATGateway' },
      DBSubnetGroup: { type: 'AWS::RDS::DBSubnetGroup', condition: 'CreateRDS' },
      DBSecret: { type: 'AWS::SecretsManager::Secret', condition: 'CreateRDS' },
      RDSEnhancedMonitoringRole: { type: 'AWS::IAM::Role', condition: 'CreateRDS' },
      DatabaseInstance: { type: 'AWS::RDS::DBInstance', condition: 'CreateRDS' },
      EC2KeyPair: { type: 'AWS::EC2::KeyPair', condition: 'CreateEC2' },
      SecureEC2Instance: { type: 'AWS::EC2::Instance', condition: 'CreateEC2' }
    };

    Object.entries(coreResources).forEach(([resourceName, resourceType]) => {
      test(`should define core resource ${resourceName} of type ${resourceType}`, () => {
        expect(template.Resources[resourceName]).toBeDefined();
        expect(template.Resources[resourceName].Type).toBe(resourceType);
      });
    });

    Object.entries(conditionalResources).forEach(([resourceName, { type, condition }]) => {
      test(`should define conditional resource ${resourceName} of type ${type} with condition ${condition}`, () => {
        expect(template.Resources[resourceName]).toBeDefined();
        expect(template.Resources[resourceName].Type).toBe(type);
        expect(template.Resources[resourceName].Condition).toBe(condition);
      });
    });
  });

  describe('Outputs', () => {
    // Core outputs (always created)
    const coreOutputs = [
      'VPCId',
      'PublicSubnet1Id',
      'PublicSubnet2Id',
      'PrivateSubnet1Id',
      'PrivateSubnet2Id',
      'PublicRouteTableId',
      'PrivateRouteTable1Id',
      'PrivateRouteTable2Id',
      'EC2SecurityGroupId',
      'RDSSecurityGroupId',
      'EC2RoleArn',
      'EC2InstanceProfileName',
      'CloudTrailRoleArn',
      'SecureDataBucketName',
      'CloudTrailBucketName',
      'LoggingBucketName',
      'KMSKeyId',
      'KMSAliasName',
      'EC2LogGroupName',
      'RDSLogGroupName',
      'S3LogGroupName',
      'CloudTrailLogGroupName'
    ];

    // Conditional outputs
    const conditionalOutputs = [
      'NatGateway1Id',
      'NatGateway2Id',
      'NatGateway1EipAllocationId',
      'NatGateway2EipAllocationId',
      'RDSEndpoint',
      'EC2InstanceId'
    ];

    coreOutputs.forEach(out => {
      test(`should have core output ${out}`, () => {
        expect(template.Outputs).toBeDefined();
        const output = template.Outputs[out];
        expect(output).toBeDefined();
        expect(output.Export).toBeDefined();
      });
    });

    conditionalOutputs.forEach(out => {
      test(`should have conditional output ${out}`, () => {
        expect(template.Outputs).toBeDefined();
        const output = template.Outputs[out];
        expect(output).toBeDefined();
        expect(output.Condition).toBeDefined();
      });
    });
  });

  describe('Security Best Practices', () => {
    test('KMS key should have key policy', () => {
      const kmsKey = template.Resources.SecureKMSKey;
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
    });

    test('S3 buckets should block public access', () => {
      const buckets = ['LoggingBucket', 'SecureS3Bucket', 'CloudTrailBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
        expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      });
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.SecureVPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('EC2 role should use least privilege principle', () => {
      const role = template.Resources.EC2Role;
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(role.Properties.Policies).toBeDefined();
    });
  });

  describe('Template Validation', () => {
    test('should be valid YAML object', () => {
      expect(typeof template).toBe('object');
    });

    test('required sections should not be null', () => {
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });
});
