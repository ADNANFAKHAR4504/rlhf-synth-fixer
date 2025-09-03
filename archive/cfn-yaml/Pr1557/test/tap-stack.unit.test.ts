import fs from 'fs';
import path from 'path';

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

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'TAP Stack - Task Assignment Platform CloudFormation Template'
      );
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix, TeamEmail, and DBUsername parameters', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.TeamEmail).toBeDefined();
      expect(template.Parameters.DBUsername).toBeDefined();
    });
  });

  describe('Resources', () => {
    test('should have ApplicationKMSKey resource', () => {
      expect(template.Resources.ApplicationKMSKey).toBeDefined();
      expect(template.Resources.ApplicationKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have ApplicationVPC resource', () => {
      expect(template.Resources.ApplicationVPC).toBeDefined();
      expect(template.Resources.ApplicationVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have two private subnets in different AZs', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.AvailabilityZone).not.toEqual(subnet2.Properties.AvailabilityZone);
    });

    test('should have DBSubnetGroup referencing both private subnets', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      expect(dbSubnetGroup).toBeDefined();
      expect(dbSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      const subnetIds = dbSubnetGroup.Properties.SubnetIds;
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should have ApplicationDatabase resource with correct engine version', () => {
      const db = template.Resources.ApplicationDatabase;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.Engine).toBe('mysql');
      expect(['8.0.35', '8.0.37']).toContain(db.Properties.EngineVersion);
    });

    test('should have ApplicationS3Bucket resource with KMS encryption', () => {
      const bucket = template.Resources.ApplicationS3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('should have DBSecret resource for RDS credentials', () => {
      const secret = template.Resources.DBSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString.GenerateStringKey).toBe('password');
    });
  });

  describe('Outputs', () => {
    test('should have VpcId, S3BucketName, and DatabaseEndpoint outputs', () => {
      expect(template.Outputs.VpcId).toBeDefined();
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.DatabaseEndpoint).toBeDefined();
    });

    test('VpcId output should reference ApplicationVPC', () => {
      expect(template.Outputs.VpcId.Value).toEqual({ Ref: 'ApplicationVPC' });
    });

    test('S3BucketName output should reference ApplicationS3Bucket', () => {
      expect(template.Outputs.S3BucketName.Value).toEqual({ Ref: 'ApplicationS3Bucket' });
    });

    test('DatabaseEndpoint output should reference ApplicationDatabase.Endpoint.Address', () => {
      expect(template.Outputs.DatabaseEndpoint.Value).toEqual({
        'Fn::GetAtt': ['ApplicationDatabase', 'Endpoint.Address'],
      });
    });
  });
});
