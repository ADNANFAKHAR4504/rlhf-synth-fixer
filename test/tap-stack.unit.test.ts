import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { schema } from 'yaml-cfn';

process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCOUNT_ID = '123456789012';

describe('Secure Infrastructure CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure AWS Infrastructure with encrypted storage, least-privilege access, and comprehensive logging'
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
      expect(param.Default).toBe('0.0.0.0/0');
      expect(param.AllowedPattern).toBe(
        '^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$'
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
  });

  describe('Resources', () => {
    test('should have SecureVPC resource', () => {
      expect(template.Resources.SecureVPC).toBeDefined();
      expect(template.Resources.SecureVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have InfrastructureKMSKey resource', () => {
      expect(template.Resources.InfrastructureKMSKey).toBeDefined();
      expect(template.Resources.InfrastructureKMSKey.Type).toBe(
        'AWS::KMS::Key'
      );
    });

    test('should have EC2InstanceRole resource', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
      expect(
        template.Resources.EC2InstanceRole.Properties.Policies[0].PolicyDocument
          .Statement
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Sid: 'ReadWebsiteContent',
            Action: ['s3:GetObject', 's3:ListBucket'],
            Resource: expect.arrayContaining([
              { 'Fn::Sub': 'arn:aws:s3:::website-content-${UniqueId}/*' },
              { 'Fn::GetAtt': ['WebsiteContentBucket', 'Arn'] },
            ]),
          }),
          expect.objectContaining({
            Sid: 'WriteApplicationLogs',
            Action: ['s3:PutObject', 's3:PutObjectAcl'],
            Resource: {
              'Fn::Sub': 'arn:aws:s3:::application-logs-${UniqueId}/*',
            },
          }),
          expect.objectContaining({
            Sid: 'KMSAccess',
            Action: [
              'kms:Decrypt',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:GenerateDataKey',
              'kms:ReEncrypt*',
            ],
            Resource: { 'Fn::GetAtt': ['InfrastructureKMSKey', 'Arn'] },
          }),
        ])
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
      expect(
        bucket.Properties.LoggingConfiguration.DestinationBucketName
      ).toEqual({
        Ref: 'S3AccessLogsBucket',
      });
    });

    test('should have ApplicationLogsBucket resource with encryption and public access blocked', () => {
      const bucket = template.Resources.ApplicationLogsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
      expect(
        bucket.Properties.LoggingConfiguration.DestinationBucketName
      ).toEqual({
        Ref: 'S3AccessLogsBucket',
      });
    });

    test('should have BackupDataBucket resource with encryption and public access blocked', () => {
      const bucket = template.Resources.BackupDataBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
      expect(
        bucket.Properties.LoggingConfiguration.DestinationBucketName
      ).toEqual({
        Ref: 'S3AccessLogsBucket',
      });
    });

    test('should have EC2SecurityGroup resource', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
      expect(
        template.Resources.EC2SecurityGroup.Properties.SecurityGroupIngress[0]
          .CidrIp
      ).toEqual({
        Ref: 'YourPublicIP',
      });
    });

    test('should have SecureEC2Instance resource with encrypted EBS', () => {
      const instance = template.Resources.SecureEC2Instance;
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.BlockDeviceMappings[0].Ebs.Encrypted).toBe(
        true
      );
      expect(instance.Properties.BlockDeviceMappings[0].Ebs.KmsKeyId).toEqual({
        Ref: 'InfrastructureKMSKey',
      });
      expect(instance.Properties.ImageId).toBe(
        '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      );
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'EC2InstanceId',
        'EC2PublicIP',
        'WebsiteContentBucket',
        'ApplicationLogsBucket',
        'BackupDataBucket',
        'S3AccessLogsBucket',
        'KMSKeyId',
        'EC2InstanceRoleArn',
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
        'Fn::Sub': '${AWS::StackName}-VPC-ID',
      });
    });

    test('EC2InstanceId output should be correct', () => {
      const output = template.Outputs.EC2InstanceId;
      expect(output.Description).toBe('ID of the created EC2 instance');
      expect(output.Value).toEqual({ Ref: 'SecureEC2Instance' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EC2-Instance-ID',
      });
    });

    test('EC2PublicIP output should be correct', () => {
      const output = template.Outputs.EC2PublicIP;
      expect(output.Description).toBe('Public IP address of the EC2 instance');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['SecureEC2Instance', 'PublicIp'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EC2-Public-IP',
      });
    });

    test('WebsiteContentBucket output should be correct', () => {
      const output = template.Outputs.WebsiteContentBucket;
      expect(output.Description).toBe('Name of the website content S3 bucket');
      expect(output.Value).toEqual({ Ref: 'WebsiteContentBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-WebsiteContent-Bucket',
      });
    });

    test('ApplicationLogsBucket output should be correct', () => {
      const output = template.Outputs.ApplicationLogsBucket;
      expect(output.Description).toBe('Name of the application logs S3 bucket');
      expect(output.Value).toEqual({ Ref: 'ApplicationLogsBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ApplicationLogs-Bucket',
      });
    });

    test('BackupDataBucket output should be correct', () => {
      const output = template.Outputs.BackupDataBucket;
      expect(output.Description).toBe('Name of the backup data S3 bucket');
      expect(output.Value).toEqual({ Ref: 'BackupDataBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-BackupData-Bucket',
      });
    });

    test('S3AccessLogsBucket output should be correct', () => {
      const output = template.Outputs.S3AccessLogsBucket;
      expect(output.Description).toBe('Name of the S3 access logs bucket');
      expect(output.Value).toEqual({ Ref: 'S3AccessLogsBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-S3-Access-Logs-Bucket',
      });
    });

    test('KMSKeyId output should be correct', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Description).toBe(
        'ID of the KMS key used for S3 encryption'
      );
      expect(output.Value).toEqual({ Ref: 'InfrastructureKMSKey' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-KMS-Key',
      });
    });

    test('EC2InstanceRoleArn output should be correct', () => {
      const output = template.Outputs.EC2InstanceRoleArn;
      expect(output.Description).toBe('ARN of the EC2 instance IAM role');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['EC2InstanceRole', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EC2-Instance-Role-ARN',
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
      expect(resourceCount).toBe(21);
    });

    test('should have the correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have the correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9);
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
        'Fn::Sub': 's3-access-logs-${UniqueId}',
      });

      const websiteContentBucket = template.Resources.WebsiteContentBucket;
      expect(websiteContentBucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'website-content-${UniqueId}',
      });

      const applicationLogsBucket = template.Resources.ApplicationLogsBucket;
      expect(applicationLogsBucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'application-logs-${UniqueId}',
      });

      const backupDataBucket = template.Resources.BackupDataBucket;
      expect(backupDataBucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'backup-data-${UniqueId}',
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (outputKey === 'KMSKeyId') {
          expect(output.Export.Name).toEqual({
            'Fn::Sub': '${AWS::StackName}-KMS-Key',
          });
        } else if (outputKey === 'EC2InstanceRoleArn') {
          expect(output.Export.Name).toEqual({
            'Fn::Sub': '${AWS::StackName}-EC2-Instance-Role-ARN',
          });
        } else {
          expect(output.Export.Name).toEqual({
            'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
          });
        }
      });
    });
  });
});
