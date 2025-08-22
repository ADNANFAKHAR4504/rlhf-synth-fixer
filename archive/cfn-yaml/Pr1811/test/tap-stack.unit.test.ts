import fs from 'fs';
import path from 'path';

describe('Secure AWS Infrastructure CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
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
  });

  describe('Parameters', () => {
    const params = [
      'Project',
      'Environment',
      'AllowedIPRange',
      'InstanceType',
      'LatestAmiId'
    ];

    params.forEach(param => {
      test(`should define parameter ${param}`, () => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });
  });

  describe('Resources', () => {
    const resourceChecks: Record<string, string> = {
      SecureKMSKey: 'AWS::KMS::Key',
      SecureKMSKeyAlias: 'AWS::KMS::Alias',
      SecureVPC: 'AWS::EC2::VPC',
      SecureInternetGateway: 'AWS::EC2::InternetGateway',
      AttachGateway: 'AWS::EC2::VPCGatewayAttachment',
      PublicSubnet1: 'AWS::EC2::Subnet',
      PublicSubnet2: 'AWS::EC2::Subnet',
      PrivateSubnet1: 'AWS::EC2::Subnet',
      PrivateSubnet2: 'AWS::EC2::Subnet',
      NatGateway1EIP: 'AWS::EC2::EIP',
      NatGateway2EIP: 'AWS::EC2::EIP',
      NatGateway1: 'AWS::EC2::NatGateway',
      NatGateway2: 'AWS::EC2::NatGateway',
      PublicRouteTable: 'AWS::EC2::RouteTable',
      PublicRoute: 'AWS::EC2::Route',
      PublicSubnet1RouteTableAssociation: 'AWS::EC2::SubnetRouteTableAssociation',
      PublicSubnet2RouteTableAssociation: 'AWS::EC2::SubnetRouteTableAssociation',
      PrivateRouteTable1: 'AWS::EC2::RouteTable',
      PrivateRouteTable2: 'AWS::EC2::RouteTable',
      DefaultPrivateRoute1: 'AWS::EC2::Route',
      DefaultPrivateRoute2: 'AWS::EC2::Route',
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
      DBSubnetGroup: 'AWS::RDS::DBSubnetGroup',
      DBSecret: 'AWS::SecretsManager::Secret',
      RDSEnhancedMonitoringRole: 'AWS::IAM::Role',
      DatabaseInstance: 'AWS::RDS::DBInstance',
      EC2KeyPair: 'AWS::EC2::KeyPair',
      SecureEC2Instance: 'AWS::EC2::Instance',
      EC2LogGroup: 'AWS::Logs::LogGroup',
      RDSLogGroup: 'AWS::Logs::LogGroup',
      S3LogGroup: 'AWS::Logs::LogGroup',
      CloudTrailLogGroup: 'AWS::Logs::LogGroup'
    };

    Object.entries(resourceChecks).forEach(([resourceName, resourceType]) => {
      test(`should define resource ${resourceName} of type ${resourceType}`, () => {
        expect(template.Resources[resourceName]).toBeDefined();
        expect(template.Resources[resourceName].Type).toBe(resourceType);
      });
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'VPCId',
      'PublicSubnet1Id',
      'PublicSubnet2Id',
      'PrivateSubnet1Id',
      'PrivateSubnet2Id',
      'PublicRouteTableId',
      'PrivateRouteTable1Id',
      'PrivateRouteTable2Id',
      'NatGateway1Id',
      'NatGateway2Id',
      'NatGateway1EipAllocationId',
      'NatGateway2EipAllocationId',
      'EC2SecurityGroupId',
      'RDSSecurityGroupId',
      'EC2RoleArn',
      'EC2InstanceProfileName',
      'CloudTrailRoleArn',
      'SecureDataBucketName',
      'CloudTrailBucketName',
      'LoggingBucketName',
      'RDSEndpoint',
      'EC2InstanceId',
      'KMSKeyId',
      'KMSAliasName',
      'EC2LogGroupName',
      'RDSLogGroupName',
      'S3LogGroupName',
      'CloudTrailLogGroupName'
    ];

  expectedOutputs.forEach(out => {
    test(`should have ${out} output`, () => {
      expect(template.Outputs).toBeDefined();
      const output = template.Outputs[out];
      expect(output).toBeDefined();
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toHaveProperty('Fn::Sub');
      expect(typeof output.Export.Name['Fn::Sub']).toBe('string');
    });
  });
  });

  describe('Template Validation', () => {
    test('should be valid JSON object', () => {
      expect(typeof template).toBe('object');
    });

    test('required sections should not be null', () => {
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });
});
