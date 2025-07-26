import fs from 'fs';
import path from 'path';

// --- Test Setup ---
// Load the correct template in JSON format.
// Note: You must convert your YAML template to JSON first for this test to work.
const templatePath = path.join(__dirname, '../lib/webapp-environment-setup.json');
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

      test('should block all public access', () => {
        const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    describe('Security Groups', () => {
      const webSg = template.Resources.WebAppServerSecurityGroup;
      const dbSgIngress = template.Resources.DBIngressRule;
      expect(webSg).toBeDefined();
      expect(dbSgIngress).toBeDefined();

      test('WebAppServerSecurityGroup should allow public HTTP and SSH access', () => {
        const ingressRules = webSg.Properties.SecurityGroupIngress;
        expect(ingressRules).toContainEqual({
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
          CidrIp: '0.0.0.0/0'
        });
        expect(ingressRules).toContainEqual({
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          CidrIp: '0.0.0.0/0'
        });
      });

      test('WebAppDatabaseSecurityGroup should only allow access from WebAppServerSecurityGroup on port 3306', () => {
        expect(dbSgIngress.Type).toBe('AWS::EC2::SecurityGroupIngress');
        expect(dbSgIngress.Properties.IpProtocol).toBe('tcp');
        expect(dbSgIngress.Properties.FromPort).toBe(3306);
        expect(dbSgIngress.Properties.ToPort).toBe(3306);
        expect(dbSgIngress.Properties.SourceSecurityGroupId).toEqual({ 'Fn::GetAtt': ['WebAppServerSecurityGroup', 'GroupId'] });
        expect(dbSgIngress.Properties.GroupId).toEqual({ 'Fn::GetAtt': ['WebAppDatabaseSecurityGroup', 'GroupId'] });
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

      test('should be associated with the correct security group and key pair', () => {
        expect(instance.Properties.SecurityGroupIds).toEqual([{ 'Fn::GetAtt': ['WebAppServerSecurityGroup', 'GroupId'] }]);
        expect(instance.Properties.KeyName).toEqual({ 'Ref': 'WebAppServerKeyName' });
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
        expect(passwordRef).toBe('{{resolve:secretsmanager:MyWebAppDBPasswordSecret:SecretString:password}}');
      });

      test('should not be publicly accessible', () => {
        expect(rds.Properties.PubliclyAccessible).toBe(false);
      });

      test('should have deletion protection enabled', () => {
        expect(rds.Properties.DeletionProtection).toBe(true);
      });
    });

    describe('Secrets Manager Secret (MyWebAppDBPasswordSecret)', () => {
      const secret = template.Resources.MyWebAppDBPasswordSecret;
      expect(secret).toBeDefined();

      test('should generate a 16-character password', () => {
        expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(16);
      });

      test('should exclude specific characters', () => {
        expect(secret.Properties.GenerateSecretString.ExcludeCharacters).toBe('"@/\\');
      });

      test('should include the username in the secret string template', () => {
        expect(secret.Properties.GenerateSecretString.SecretStringTemplate).toBe('{"username": "dbadmin"}');
      });
    });
  });

  //################################################################################
  // 4. Outputs Tests
  //################################################################################
  describe('Outputs', () => {
    const outputs = template.Outputs;
    expect(outputs).toBeDefined();

    test('should define and export all required outputs', () => {
      const expectedExports = [
        'WebAppServerId', 'WebAppServerPublicIp', 'WebAppAssetsBucketName',
        'WebAppDatabaseEndpoint', 'WebAppDatabasePort', 'DBMasterUserSecretArn'
      ];

      expectedExports.forEach(outputName => {
        const output = outputs[outputName];
        expect(output).toBeDefined();
        expect(output.Value).toBeDefined();
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toEqual({ 'Fn::Sub': `\${AWS::StackName}-${outputName}` });
      });
    });

    test('WebAppServerId output should reference the EC2 instance', () => {
      expect(outputs.WebAppServerId.Value).toEqual({ 'Ref': 'WebAppServer' });
    });

    test('WebAppDatabaseEndpoint output should get the endpoint address from the RDS instance', () => {
      expect(outputs.WebAppDatabaseEndpoint.Value).toEqual({ 'Fn::GetAtt': ['WebAppDatabase', 'Endpoint.Address'] });
    });
  });
});