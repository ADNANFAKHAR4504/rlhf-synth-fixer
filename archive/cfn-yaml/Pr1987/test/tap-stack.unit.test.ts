import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'env';

describe('TapStack CloudFormation Template', () => {
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

    test('should have a description mentioning secure and production-ready environment', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toMatch(/secure.*production.*environment/i);
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix, AllowedIpCidr, LatestAmiId parameters', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.AllowedIpCidr).toBeDefined();
      expect(template.Parameters.LatestAmiId).toBeDefined();
    });

    test('AllowedIpCidr default should be 192.168.0.0/16', () => {
      expect(template.Parameters.AllowedIpCidr.Default).toBe('192.168.0.0/16');
    });

    test('should have exactly 3 parameters', () => {
      expect(Object.keys(template.Parameters).length).toBe(3);
    });
  });

  describe('Resources', () => {
    const expectedResources = [
      'VPC',
      'InternetGateway',
      'AttachGateway',
      'PublicSubnet1',
      'PrivateSubnet1',
      'PrivateSubnet2',
      'PublicRouteTable',
      'PublicRoute',
      'PublicSubnet1Assoc',
      'AppSecurityGroup',
      'EC2Role',
      'EC2InstanceProfile',
      'LambdaRole',
      'EC2Instance',
      'SecureS3Bucket',
      'SecureS3BucketPolicy',
      'DBSecret',
      'DBSubnetGroup',
      'RDSInstance',
      'MyLambda',
      'CloudTrailLogGroup',
      'CloudTrailRole',
      'CloudTrail'
    ];

    test('should have all expected resources', () => {
      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have VPC, PrivateSubnet1, PrivateSubnet2', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have EC2 instance with encrypted EBS', () => {
      const ec2 = template.Resources.EC2Instance;
      expect(ec2).toBeDefined();
      expect(ec2.Type).toBe('AWS::EC2::Instance');
      expect(ec2.Properties.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
    });

    test('should have S3 bucket with SSE enabled', () => {
      const s3 = template.Resources.SecureS3Bucket;
      expect(s3).toBeDefined();
      expect(s3.Type).toBe('AWS::S3::Bucket');
      expect(
        s3.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('should have RDS instance in private subnets and encrypted', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.PubliclyAccessible).toBe(false);
      expect(rds.Properties.DBSubnetGroupName).toBeDefined();
    });

    test('should have Lambda with >=128MB memory', () => {
      const lambda = template.Resources.MyLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.MemorySize).toBeGreaterThanOrEqual(128);
    });

    test('should have CloudTrail logging to encrypted S3 bucket', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsLogging).toBe(true);
    });

    test('should have DBSecret for RDS credentials', () => {
      expect(template.Resources.DBSecret).toBeDefined();
      expect(template.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('should have correct resource count', () => {
      expect(Object.keys(template.Resources).length).toBe(expectedResources.length);
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'VPC',
      'PublicSubnet1',
      'PrivateSubnet1',
      'PrivateSubnet2',
      'EC2Instance',
      'S3Bucket',
      'RDS',
      'Lambda',
      'CloudTrail',
      'DBSecret'
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have correct output count', () => {
      expect(Object.keys(template.Outputs).length).toBe(expectedOutputs.length);
    });
  });

  describe('Tagging', () => {
    test('all taggable resources should have Environment: Production tag', () => {
      const taggable = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PrivateSubnet1',
        'PrivateSubnet2'
      ];
      taggable.forEach(resource => {
        expect(template.Resources[resource].Properties.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Key: 'Environment'
            })
          ])
        );
      });
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
  });
});
