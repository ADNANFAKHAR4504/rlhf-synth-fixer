import fs from 'fs';
import { load } from 'js-yaml';
import path from 'path';

process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCOUNT_ID = '123456789012';

describe('Secure Infrastructure CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const jsonPath = path.resolve(__dirname, '..', 'lib', 'TapStack.json');
    const yamlPath = path.resolve(__dirname, '..', 'lib', 'TapStack.yml');

    if (fs.existsSync(jsonPath)) {
      // CI path: unit-test job creates this via cfn-flip-to-json
      const raw = fs.readFileSync(jsonPath, 'utf8');
      template = JSON.parse(raw);
    } else {
      // Local fallback: parse YAML (uses long-form Fn:: keys which js-yaml can handle)
      const raw = fs.readFileSync(yamlPath, 'utf8');
      template = load(raw);
    }
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
              {
                'Fn::Sub':
                  'arn:aws:s3:::website-content-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}',
              },
              {
                'Fn::Sub':
                  'arn:aws:s3:::website-content-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}/*',
              },
            ]),
          }),
          expect.objectContaining({
            Sid: 'WriteApplicationLogs',
            Action: ['s3:PutObject', 's3:PutObjectAcl'],
            Resource: expect.arrayContaining([
              {
                'Fn::Sub':
                  'arn:aws:s3:::application-logs-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}/*',
              },
            ]),
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
      ).toEqual({ Ref: 'S3AccessLogsBucket' });
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
      ).toEqual({ Ref: 'S3AccessLogsBucket' });
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
      ).toEqual({ Ref: 'S3AccessLogsBucket' });
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
      expect(template.Outputs).toBeDefined();
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
        'Fn::Sub': '${AWS::StackName}-VPCId',
      });
    });

    test('EC2InstanceId output should be correct', () => {
      const output = template.Outputs.EC2InstanceId;
      expect(output.Description).toBe('ID of the created EC2 instance');
      expect(output.Value).toEqual({ Ref: 'SecureEC2Instance' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EC2InstanceId',
      });
    });

    test('EC2PublicIP output should be correct', () => {
      const output = template.Outputs.EC2PublicIP;
      expect(output.Description).toBe('Public IP address of the EC2 instance');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['SecureEC2Instance', 'PublicIp'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EC2PublicIP',
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

    test('KMSKeyId output should be correct', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Description).toBe(
        'ID of the KMS key used for S3 encryption'
      );
      expect(output.Value).toEqual({ Ref: 'InfrastructureKMSKey' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-KMSKeyId',
      });
    });

    test('EC2InstanceRoleArn output should be correct', () => {
      const output = template.Outputs.EC2InstanceRoleArn;
      expect(output.Description).toBe('ARN of the EC2 instance IAM role');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['EC2InstanceRole', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EC2InstanceRoleArn',
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
      expect(resourceCount).toBe(20);
    });

    test('should have the correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
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
        'Fn::Sub':
          's3-access-logs-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}',
      });

      const websiteContentBucket = template.Resources.WebsiteContentBucket;
      expect(websiteContentBucket.Properties.BucketName).toEqual({
        'Fn::Sub':
          'website-content-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}',
      });

      const applicationLogsBucket = template.Resources.ApplicationLogsBucket;
      expect(applicationLogsBucket.Properties.BucketName).toEqual({
        'Fn::Sub':
          'application-logs-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}',
      });

      const backupDataBucket = template.Resources.BackupDataBucket;
      expect(backupDataBucket.Properties.BucketName).toEqual({
        'Fn::Sub':
          'backup-data-${EnvironmentSuffix}-${UniqueId}-${StackNameLower}',
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
});
// This test suite validates the structure and content of the TapStack CloudFormation template
