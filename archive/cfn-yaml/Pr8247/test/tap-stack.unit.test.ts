import fs from 'fs';
import path from 'path';
import { yamlParse } from 'yaml-cfn';


describe('LocalStack-Compatible CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const jsonPath = path.resolve(__dirname, '..', 'lib', 'TapStack.json');
    const yamlPath = path.resolve(__dirname, '..', 'lib', 'TapStack.yml');

    if (fs.existsSync(jsonPath)) {
      // CI path: unit-test job creates this via cfn-flip-to-json
      const raw = fs.readFileSync(jsonPath, 'utf8');
      template = JSON.parse(raw);
    } else {
      // Local fallback: parse YAML with CloudFormation intrinsic function support
      const raw = fs.readFileSync(yamlPath, 'utf8');
      template = yamlParse(raw);
    }
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'LocalStack-compatible AWS Infrastructure with VPC, S3 buckets, and IAM roles'
      );
    });
  });

  describe('Parameters', () => {
    test('should have YourPublicIP parameter', () => {
      expect(template.Parameters.YourPublicIP).toBeDefined();
    });

    test('YourPublicIP parameter should have correct properties', () => {
      const param = template.Parameters.YourPublicIP;
      expect(param.Type).toBe('String');
      expect(param.Description).toBe(
        'Your public IP address for SSH access (format: x.x.x.x/32)'
      );
      expect(['203.0.113.0/32', undefined]).toContain(param.Default);
      expect(param.AllowedPattern).toBe(
        '^([0-9]{1,3}\\.){3}[0-9]{1,3}/(3[0-2]|[1-2]?[0-9])$'
      );
    });

    test('should have UniqueId parameter', () => {
      expect(template.Parameters.UniqueId).toBeDefined();
    });

    test('UniqueId parameter should have correct properties', () => {
      const param = template.Parameters.UniqueId;
      expect(param.Type).toBe('String');
      expect(param.Description).toBe(
        'Unique identifier for resource naming. Must be lowercase alphanumeric.'
      );
      expect(param.Default).toBe('secureapp');
      expect(param.AllowedPattern).toBe('^[a-z0-9]+$');
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Description).toBe(
        'Environment name (e.g., dev, staging, prod)'
      );
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9\\-]+$');
    });

    test('should have StackNameLower parameter', () => {
      expect(template.Parameters.StackNameLower).toBeDefined();
    });
  });

  describe('Resources', () => {
    test('should have SecureVPC resource', () => {
      expect(template.Resources.SecureVPC).toBeDefined();
      expect(template.Resources.SecureVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.SecureVPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have PublicSubnet resource', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PublicSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet.Properties.CidrBlock).toBe(
        '10.0.1.0/24'
      );
      expect(
        template.Resources.PublicSubnet.Properties.MapPublicIpOnLaunch
      ).toBe(true);
    });

    test('should have PrivateSubnet resource', () => {
      expect(template.Resources.PrivateSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet.Properties.CidrBlock).toBe(
        '10.0.2.0/24'
      );
      expect(
        template.Resources.PrivateSubnet.Properties.MapPublicIpOnLaunch
      ).toBe(false);
    });

    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have ApplicationRole resource', () => {
      expect(template.Resources.ApplicationRole).toBeDefined();
      expect(template.Resources.ApplicationRole.Type).toBe('AWS::IAM::Role');
      expect(
        template.Resources.ApplicationRole.Properties.Policies[0].PolicyDocument
          .Statement
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Sid: 'ReadWebsiteContent',
            Action: ['s3:GetObject', 's3:ListBucket'],
            Resource: expect.arrayContaining([
              {
                'Fn::Sub':
                  'arn:aws:s3:::website-content-${Environment}-${UniqueId}-${StackNameLower}',
              },
              {
                'Fn::Sub':
                  'arn:aws:s3:::website-content-${Environment}-${UniqueId}-${StackNameLower}/*',
              },
            ]),
          }),
          expect.objectContaining({
            Sid: 'WriteApplicationLogs',
            Action: ['s3:PutObject', 's3:PutObjectAcl'],
            Resource: expect.arrayContaining([
              {
                'Fn::Sub':
                  'arn:aws:s3:::application-logs-${Environment}-${UniqueId}-${StackNameLower}/*',
              },
            ]),
          }),
        ])
      );
    });

    test('should have InstanceProfile resource', () => {
      expect(template.Resources.InstanceProfile).toBeDefined();
      expect(template.Resources.InstanceProfile.Type).toBe(
        'AWS::IAM::InstanceProfile'
      );
    });

    test('should have S3AccessLogsBucket resource', () => {
      expect(template.Resources.S3AccessLogsBucket).toBeDefined();
      expect(template.Resources.S3AccessLogsBucket.Type).toBe(
        'AWS::S3::Bucket'
      );
      expect(
        template.Resources.S3AccessLogsBucket.Properties.BucketEncryption
      ).toBeDefined();
    });

    test('should have WebsiteContentBucket resource with encryption and public access blocked', () => {
      const bucket = template.Resources.WebsiteContentBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
      // Verify AES256 encryption (LocalStack compatible)
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('should have ApplicationLogsBucket resource with encryption and public access blocked', () => {
      const bucket = template.Resources.ApplicationLogsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
      // Verify AES256 encryption (LocalStack compatible)
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('should have BackupDataBucket resource with encryption and public access blocked', () => {
      const bucket = template.Resources.BackupDataBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
      // Verify AES256 encryption (LocalStack compatible)
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('should have EC2SecurityGroup resource', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
      expect(
        template.Resources.EC2SecurityGroup.Properties.SecurityGroupIngress[0]
          .CidrIp
      ).toEqual({ Ref: 'YourPublicIP' });
    });

    test('Security group should allow HTTP and HTTPS', () => {
      const ingress =
        template.Resources.EC2SecurityGroup.Properties.SecurityGroupIngress;
      const httpRule = ingress.find(
        (r: any) => r.FromPort === 80 && r.ToPort === 80
      );
      const httpsRule = ingress.find(
        (r: any) => r.FromPort === 443 && r.ToPort === 443
      );

      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have bucket policies', () => {
      expect(template.Resources.WebsiteContentBucketPolicy).toBeDefined();
      expect(template.Resources.WebsiteContentBucketPolicy.Type).toBe(
        'AWS::S3::BucketPolicy'
      );

      expect(template.Resources.ApplicationLogsBucketPolicy).toBeDefined();
      expect(template.Resources.ApplicationLogsBucketPolicy.Type).toBe(
        'AWS::S3::BucketPolicy'
      );

      expect(template.Resources.BackupDataBucketPolicy).toBeDefined();
      expect(template.Resources.BackupDataBucketPolicy.Type).toBe(
        'AWS::S3::BucketPolicy'
      );
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      expect(template.Outputs).toBeDefined();
      const expectedOutputs = [
        'VPCId',
        'PublicSubnetId',
        'PrivateSubnetId',
        'SecurityGroupId',
        'WebsiteContentBucket',
        'ApplicationLogsBucket',
        'BackupDataBucket',
        'S3AccessLogsBucket',
        'ApplicationRoleArn',
        'InternetGatewayId',
      ];
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('ID of the created VPC');
      expect(output.Value).toEqual({ Ref: 'SecureVPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPCId',
      });
    });

    test('PublicSubnetId output should be correct', () => {
      const output = template.Outputs.PublicSubnetId;
      expect(output.Description).toBe('ID of the public subnet');
      expect(output.Value).toEqual({ Ref: 'PublicSubnet' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-PublicSubnetId',
      });
    });

    test('PrivateSubnetId output should be correct', () => {
      const output = template.Outputs.PrivateSubnetId;
      expect(output.Description).toBe('ID of the private subnet');
      expect(output.Value).toEqual({ Ref: 'PrivateSubnet' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-PrivateSubnetId',
      });
    });

    test('SecurityGroupId output should be correct', () => {
      const output = template.Outputs.SecurityGroupId;
      expect(output.Description).toBe('ID of the security group');
      expect(output.Value).toEqual({ Ref: 'EC2SecurityGroup' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-SecurityGroupId',
      });
    });

    test('WebsiteContentBucket output should be correct', () => {
      const output = template.Outputs.WebsiteContentBucket;
      expect(output.Description).toBe('Name of the website content S3 bucket');
      expect(output.Value).toEqual({ Ref: 'WebsiteContentBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-WebsiteContentBucket',
      });
    });

    test('ApplicationLogsBucket output should be correct', () => {
      const output = template.Outputs.ApplicationLogsBucket;
      expect(output.Description).toBe('Name of the application logs S3 bucket');
      expect(output.Value).toEqual({ Ref: 'ApplicationLogsBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ApplicationLogsBucket',
      });
    });

    test('BackupDataBucket output should be correct', () => {
      const output = template.Outputs.BackupDataBucket;
      expect(output.Description).toBe('Name of the backup data S3 bucket');
      expect(output.Value).toEqual({ Ref: 'BackupDataBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-BackupDataBucket',
      });
    });

    test('S3AccessLogsBucket output should be correct', () => {
      const output = template.Outputs.S3AccessLogsBucket;
      expect(output.Description).toBe('Name of the S3 access logs bucket');
      expect(output.Value).toEqual({ Ref: 'S3AccessLogsBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-S3AccessLogsBucket',
      });
    });

    test('ApplicationRoleArn output should be correct', () => {
      const output = template.Outputs.ApplicationRoleArn;
      expect(output.Description).toBe('ARN of the application IAM role');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationRole', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ApplicationRoleArn',
      });
    });

    test('InternetGatewayId output should be correct', () => {
      const output = template.Outputs.InternetGatewayId;
      expect(output.Description).toBe('ID of the Internet Gateway');
      expect(output.Value).toEqual({ Ref: 'InternetGateway' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-InternetGatewayId',
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

    test('should have the correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(18);
    });

    test('should have the correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have the correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10);
    });
  });

  describe('Resource Naming Convention', () => {
    test('VPC name should follow naming convention', () => {
      const vpc = template.Resources.SecureVPC;
      const vpcNameTag = vpc.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(vpcNameTag.Value).toEqual({
        'Fn::Sub': '${AWS::StackName}-secure-vpc',
      });
    });

    test('S3 bucket names should follow naming convention with UniqueId', () => {
      const s3AccessLogsBucket = template.Resources.S3AccessLogsBucket;
      expect(s3AccessLogsBucket.Properties.BucketName).toEqual({
        'Fn::Sub':
          's3-access-logs-${Environment}-${UniqueId}-${StackNameLower}',
      });

      const websiteContentBucket = template.Resources.WebsiteContentBucket;
      expect(websiteContentBucket.Properties.BucketName).toEqual({
        'Fn::Sub':
          'website-content-${Environment}-${UniqueId}-${StackNameLower}',
      });

      const applicationLogsBucket = template.Resources.ApplicationLogsBucket;
      expect(applicationLogsBucket.Properties.BucketName).toEqual({
        'Fn::Sub':
          'application-logs-${Environment}-${UniqueId}-${StackNameLower}',
      });

      const backupDataBucket = template.Resources.BackupDataBucket;
      expect(backupDataBucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'backup-data-${Environment}-${UniqueId}-${StackNameLower}',
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });

  describe('LocalStack Compatibility', () => {
    test('should NOT contain KMS Key resources (not fully supported in LocalStack)', () => {
      expect(template.Resources.InfrastructureKMSKey).toBeUndefined();
    });

    test('should NOT contain EC2 Instance resources (SSM resolve not supported)', () => {
      expect(template.Resources.SecureEC2Instance).toBeUndefined();
    });

    test('should use AES256 encryption instead of KMS for S3 buckets', () => {
      const buckets = [
        'S3AccessLogsBucket',
        'WebsiteContentBucket',
        'ApplicationLogsBucket',
        'BackupDataBucket',
      ];

      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const encryption =
          bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
            .ServerSideEncryptionByDefault;
        expect(encryption.SSEAlgorithm).toBe('AES256');
        expect(encryption.KMSMasterKeyID).toBeUndefined();
      });
    });

    test('S3 buckets should NOT have LoggingConfiguration (limited LocalStack support)', () => {
      const buckets = [
        'WebsiteContentBucket',
        'ApplicationLogsBucket',
        'BackupDataBucket',
      ];

      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.LoggingConfiguration).toBeUndefined();
      });
    });

    test('all S3 buckets should have versioning enabled', () => {
      const buckets = [
        'S3AccessLogsBucket',
        'WebsiteContentBucket',
        'ApplicationLogsBucket',
        'BackupDataBucket',
      ];

      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.VersioningConfiguration.Status).toBe(
          'Enabled'
        );
      });
    });
  });
});
