import fs from 'fs';
import path from 'path';

// --- Test Setup ---
// Load the correct template in JSON format.
// Note: You must convert your YAML template to JSON first for this test to work.
const templatePath = path.join(__dirname, '../lib/TapStack.json');
const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

describe('Web App Environment CloudFormation Template', () => {

  //################################################################################
  // 1. Template Structure and Metadata Tests
  //################################################################################
  describe('Template Structure', () => {
    test('should have a valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a meaningful description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('scalable and highly available web application');
    });
  });

  //################################################################################
  // 2. Parameters Tests
  //################################################################################
  describe('Parameters', () => {
    test('should define all required parameters without defaults', () => {
      const requiredParams = ['EnvironmentName', 'OwnerName', 'ProjectName', 'WebAppServerKeyName'];
      requiredParams.forEach(paramName => {
        const param = template.Parameters[paramName];
        expect(param).toBeDefined();
        // The prompt requires these to be simple inputs for reusability.
        expect(param.Default).toBeUndefined();
      });
    });

    test('WebAppServerKeyName parameter should be of type KeyPair', () => {
      expect(template.Parameters.WebAppServerKeyName.Type).toBe('AWS::EC2::KeyPair::KeyName');
    });
  });

  //################################################################################
  // 3. Resource Configuration and Best Practice Tests
  //################################################################################
  describe('Resource Configuration', () => {

    describe('S3 Bucket (WebAppAssets)', () => {
      const bucket = template.Resources.WebAppAssets;
      expect(bucket).toBeDefined();
      
      test('should have server-side encryption enabled with SSE-KMS', () => {
        const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      });

      test('should have versioning enabled', () => {
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });
    });

    describe('EC2 Instance (WebAppServer)', () => {
      const instance = template.Resources.WebAppServer;
      expect(instance).toBeDefined();

      test('should be a t2.micro instance', () => {
        expect(instance.Properties.InstanceType).toBe('t2.micro');
      });

      test('should use the latest Amazon Linux 2 AMI via SSM Parameter', () => {
        expect(instance.Properties.ImageId).toBe('{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}');
      });
    });

    describe('RDS DB Instance (WebAppDatabase)', () => {
      const rds = template.Resources.WebAppDatabase;
      expect(rds).toBeDefined();

      test('should be a db.t3.micro instance class', () => {
        expect(rds.Properties.DBInstanceClass).toBe('db.t3.micro');
      });

      test('should have Multi-AZ enabled for high availability', () => {
        expect(rds.Properties.MultiAZ).toBe(true);
      });

      test('should have 20GB of gp2 storage', () => {
        expect(rds.Properties.AllocatedStorage).toBe('20');
        expect(rds.Properties.StorageType).toBe('gp2');
      });

      test('should retrieve master password securely from the correct Secrets Manager secret', () => {
        const passwordRef = rds.Properties.MasterUserPassword;
        // Updated to check for the new secret name
        expect(passwordRef).toEqual('{{resolve:secretsmanager:MyWebAppDBPasswordSecret:SecretString:password}}');
      });
    });

    describe('Resource Tagging', () => {
        const resourcesWithTags = ['WebAppAssets', 'WebAppServer', 'WebAppDatabase', 'WebAppServerSecurityGroup', 'WebAppDatabaseSecurityGroup', 'MyWebAppDBPasswordSecret'];
        
        resourcesWithTags.forEach(resourceName => {
            test(`${resourceName} should have Environment, Owner, and Project tags`, () => {
                const resource = template.Resources[resourceName];
                const tags = resource.Properties.Tags;
                expect(tags).toBeInstanceOf(Array);

                const hasEnvTag = tags.some(tag => tag.Key === 'Environment' && tag.Value.Ref === 'EnvironmentName');
                const hasOwnerTag = tags.some(tag => tag.Key === 'Owner' && tag.Value.Ref === 'OwnerName');
                const hasProjectTag = tags.some(tag => tag.Key === 'Project' && tag.Value.Ref === 'ProjectName');

                expect(hasEnvTag).toBe(true);
                expect(hasOwnerTag).toBe(true);
                expect(hasProjectTag).toBe(true);
            });
        });
    });
  });

  //################################################################################
  // 4. Outputs Tests
  //################################################################################
  describe('Outputs', () => {
    const expectedOutputs = [
        'WebAppServerId',
        'WebAppServerPublicIp',
        'WebAppAssetsBucketName',
        'WebAppDatabaseEndpoint',
        'WebAppDatabasePort',
        'DBMasterUserSecretArn'
    ];

    test('should define all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('WebAppServerId output should be correctly configured', () => {
        const output = template.Outputs.WebAppServerId;
        expect(output.Value).toEqual({ Ref: 'WebAppServer' });
        expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-WebAppServerId' });
    });

    test('WebAppDatabaseEndpoint output should be correctly configured', () => {
        const output = template.Outputs.WebAppDatabaseEndpoint;
        expect(output.Value).toEqual({ 'Fn::GetAtt': ['WebAppDatabase', 'Endpoint.Address'] });
        expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-WebAppDatabaseEndpoint' });
    });

    test('DBMasterUserSecretArn output should reference the correct secret', () => {
        const output = template.Outputs.DBMasterUserSecretArn;
        expect(output.Value).toEqual({ Ref: 'MyWebAppDBPasswordSecret' });
        expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-DBMasterUserSecretArn' });
    });
  });
});
