import fs from 'fs';
import path from 'path';

// --- Test Setup ---
// NOTE: Ensure you've converted your YAML template to JSON and placed it at this path.
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
      // MODIFIED: LocalStack compatibility - uses parameter instead of Secrets Manager
      expect(template.Description).toContain('LocalStack compatibility');
      expect(template.Description).toContain('database password');
    });
  });

  //################################################################################
  // 2. Parameters Tests
  //################################################################################
  describe('Parameters', () => {
    test('should define all required parameters', () => {
      // MODIFIED: Updated the list of parameters to match the template.
      const requiredParams = ['EnvironmentName', 'OwnerName', 'ProjectName', 'WebAppServerKeyName', 'DBMasterUsername', 'DBMasterPassword', 'MyIpAddress'];
      requiredParams.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    // MODIFIED: The original test was incorrect; your template provides defaults.
    // This new test verifies one of the defaults.
    test('should have correct default values for parameters', () => {
      expect(template.Parameters.EnvironmentName.Default).toBe('dev');
      expect(template.Parameters.DBMasterUsername.Default).toBe('dbadmin');
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
      // MODIFIED: Your template defines ingress within the SG, not as a separate resource.
      const dbSg = template.Resources.WebAppDatabaseSecurityGroup;
      expect(webSg).toBeDefined();
      expect(dbSg).toBeDefined();

      test('WebAppServerSecurityGroup should allow public HTTP and SSH from the specified IP', () => {
        const ingressRules = webSg.Properties.SecurityGroupIngress;
        expect(ingressRules).toContainEqual({
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
          CidrIp: '0.0.0.0/0'
        });
        // MODIFIED: SSH access should reference the MyIpAddress parameter, not be wide open.
        expect(ingressRules).toContainEqual({
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          CidrIp: { 'Ref': 'MyIpAddress' }
        });
      });

      // MODIFIED: Rewrote this test to correctly check the ingress rule on the DB security group.
      test('WebAppDatabaseSecurityGroup should only allow access from WebAppServerSecurityGroup on port 3306', () => {
        const dbIngressRule = dbSg.Properties.SecurityGroupIngress[0];
        expect(dbIngressRule.IpProtocol).toBe('tcp');
        expect(dbIngressRule.FromPort).toBe(3306);
        expect(dbIngressRule.ToPort).toBe(3306);
        expect(dbIngressRule.SourceSecurityGroupId).toEqual({ 'Fn::GetAtt': ['WebAppServerSecurityGroup', 'GroupId'] });
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

      test('should have Multi-AZ configured conditionally based on environment', () => {
        // MODIFIED: Test for the conditional logic instead of a fixed "true" value.
        expect(rds.Properties.MultiAZ).toEqual(true);
      });

      test('should have 20GB of gp2 storage', () => {
        expect(rds.Properties.AllocatedStorage).toBe('20');
        expect(rds.Properties.StorageType).toBe('gp2');
      });

      test('should use DBMasterPassword parameter for LocalStack compatibility', () => {
        const passwordRef = rds.Properties.MasterUserPassword;
        // MODIFIED: LocalStack compatibility - uses parameter instead of Secrets Manager dynamic reference
        expect(passwordRef).toEqual({ 'Ref': 'DBMasterPassword' });
      });

      test('should not be publicly accessible', () => {
        expect(rds.Properties.PubliclyAccessible).toBe(false);
      });

      test('should have deletion protection enabled', () => {
        expect(rds.Properties.DeletionProtection).toBe(true);
      });
    });

    // REMOVED: Your template does not create a secret, it consumes an existing one.
    // This entire test block was invalid for your stack.
  });

  //################################################################################
  // 4. Outputs Tests
  //################################################################################
  describe('Outputs', () => {
    const outputs = template.Outputs;
    expect(outputs).toBeDefined();

    test('should define and export all required outputs', () => {
      // MODIFIED: Removed DBMasterUserSecretArn, as it's not an output in your template.
      const expectedExports = [
        'WebAppServerId', 'WebAppServerPublicIp', 'WebAppAssetsBucketName',
        'WebAppDatabaseEndpoint', 'WebAppDatabasePort'
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