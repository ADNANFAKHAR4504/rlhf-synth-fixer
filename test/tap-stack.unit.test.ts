import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ---------------- Template Structure ----------------
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain(
        'Secure, scalable AWS infrastructure for mid-sized company'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  // ---------------- Parameters ----------------
  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toContain('Environment suffix for resource naming');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });

    test('should have VPC configuration parameters', () => {
      expect(template.Parameters.VPCCidr).toBeDefined();
      expect(template.Parameters.PublicSubnet1Cidr).toBeDefined();
      expect(template.Parameters.PublicSubnet2Cidr).toBeDefined();
      expect(template.Parameters.PrivateSubnet1Cidr).toBeDefined();
      expect(template.Parameters.PrivateSubnet2Cidr).toBeDefined();
    });

    test('should have EC2 configuration parameters', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.KeyName).toBeDefined();
      expect(template.Parameters.LatestAmiId).toBeDefined();
    });

    test('should have database configuration parameters', () => {
      expect(template.Parameters.DBUsername).toBeDefined();
      expect(template.Parameters.DBInstanceClass).toBeDefined();
    });
  });

  // ---------------- Resources ----------------
  describe('Resources', () => {
    test('should have KMS key and alias', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.KMSAlias).toBeDefined();
      expect(template.Resources.KMSAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('should have VPC and networking resources', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have security groups', () => {
      expect(template.Resources.BastionSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
    });

    test('should have EC2 and Auto Scaling resources', () => {
      expect(template.Resources.BastionHost).toBeDefined();
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ALBTargetGroup).toBeDefined();
    });

    test('should have S3 buckets', () => {
      expect(template.Resources.LogBucket).toBeDefined();
      expect(template.Resources.DataBucket).toBeDefined();
      expect(template.Resources.ContentBucket).toBeDefined();
      expect(template.Resources.LogBucket.Type).toBe('AWS::S3::Bucket');
      expect(template.Resources.DataBucket.Type).toBe('AWS::S3::Bucket');
      expect(template.Resources.ContentBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have RDS database', () => {
      expect(template.Resources.DBInstance).toBeDefined();
      expect(template.Resources.DBInstance.Type).toBe('AWS::RDS::DBInstance');
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSecret).toBeDefined();
    });

    test('should have Lambda function', () => {
      expect(template.Resources.LogProcessorFunction).toBeDefined();
      expect(template.Resources.LogProcessorFunction.Type).toBe('AWS::Lambda::Function');
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
    });

    test('should have CloudFront distribution', () => {
      expect(template.Resources.CloudFrontDistribution).toBeDefined();
      expect(template.Resources.CloudFrontDistribution.Type).toBe('AWS::CloudFront::Distribution');
      expect(template.Resources.CloudFrontOAI).toBeDefined();
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.CPUAlarmHigh).toBeDefined();
      expect(template.Resources.CPUAlarmLow).toBeDefined();
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleDownPolicy).toBeDefined();
    });
  });

  // ---------------- Security & Compliance ----------------
  describe('Security and Compliance', () => {
    test('KMS key should have rotation enabled', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('S3 buckets should have encryption enabled', () => {
      (['LogBucket', 'DataBucket', 'ContentBucket'] as const).forEach((bucketName) => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(
          bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
            .ServerSideEncryptionByDefault.SSEAlgorithm
        ).toBe('aws:kms');
      });
    });

    test('S3 buckets should have public access blocked', () => {
      (['LogBucket', 'DataBucket', 'ContentBucket'] as const).forEach((bucketName) => {
        const bucket = template.Resources[bucketName];
        const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('RDS instance should be encrypted', () => {
      const dbInstance = template.Resources.DBInstance;
      expect(dbInstance.Properties.StorageEncrypted).toBe(true);
      expect(dbInstance.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('RDS instance should not be publicly accessible', () => {
      const dbInstance = template.Resources.DBInstance;
      expect(dbInstance.Properties.PubliclyAccessible).toBe(false);
    });

    test('DB instance should have delete policy for testing', () => {
      const dbInstance = template.Resources.DBInstance;
      expect(dbInstance.DeletionPolicy).toBe('Delete');
      expect(dbInstance.UpdateReplacePolicy).toBe('Delete');
    });

    test('EC2 instances should have encrypted EBS volumes', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const blockDeviceMapping =
        launchTemplate.Properties.LaunchTemplateData.BlockDeviceMappings[0];
      expect(blockDeviceMapping.Ebs.Encrypted).toBe(true);
      expect(blockDeviceMapping.Ebs.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  // ---------------- Resource Naming ----------------
  describe('Resource Naming Convention', () => {
    test('KMS alias should use environment suffix', () => {
      const kmsAlias = template.Resources.KMSAlias;
      expect(kmsAlias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/TapStack${EnvironmentSuffix}-key',
      });
    });

    test('S3 bucket names should include environment suffix', () => {
      const logBucket = template.Resources.LogBucket;
      expect(logBucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'tapstack${EnvironmentSuffix}-logs-${AWS::AccountId}-${AWS::Region}',
      });

      const dataBucket = template.Resources.DataBucket;
      expect(dataBucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'tapstack${EnvironmentSuffix}-data-${AWS::AccountId}-${AWS::Region}',
      });

      const contentBucket = template.Resources.ContentBucket;
      expect(contentBucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'tapstack${EnvironmentSuffix}-content-${AWS::AccountId}-${AWS::Region}',
      });
    });

    test('resource tags should use environment suffix', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags[0].Value).toEqual({
        'Fn::Sub': 'TapStack${EnvironmentSuffix}-VPC',
      });
    });

    test('DB secret name should use environment suffix', () => {
      const dbSecret = template.Resources.DBSecret;
      expect(dbSecret.Properties.Name).toEqual({
        'Fn::Sub': 'TapStack${EnvironmentSuffix}/db/master',
      });
    });
  });

  // ---------------- Outputs ----------------
  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'ALBDNSName',
        'CloudFrontURL',
        'BastionPublicIP',
        'DataBucketName',
        'RDSEndpoint',
        'LambdaFunctionArn',
      ] as const;

      expectedOutputs.forEach((outputName) => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('output export names should use environment suffix (typed to avoid TS7053)', () => {
      const expectedMappings = {
        VPCId: 'TapStack${EnvironmentSuffix}-VPC-ID',
        ALBDNSName: 'TapStack${EnvironmentSuffix}-ALB-DNS',
        CloudFrontURL: 'TapStack${EnvironmentSuffix}-CloudFront-URL',
        BastionPublicIP: 'TapStack${EnvironmentSuffix}-Bastion-IP',
        DataBucketName: 'TapStack${EnvironmentSuffix}-DataBucket',
        RDSEndpoint: 'TapStack${EnvironmentSuffix}-RDS-Endpoint',
        LambdaFunctionArn: 'TapStack${EnvironmentSuffix}-Lambda-ARN',
      } as const;

      type OutputKey = keyof typeof expectedMappings;
      const entries = Object.entries(expectedMappings) as Array<
        [OutputKey, (typeof expectedMappings)[OutputKey]]
      >;

      for (const [outputKey, subVal] of entries) {
        const output = template.Outputs[outputKey];
        expect(output).toBeDefined();
        expect(output.Export.Name).toEqual({ 'Fn::Sub': subVal });
      }
    });
  });

  // ---------------- Template Validation ----------------
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

    test('should have reasonable number of resources for comprehensive infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20);
    });

    test('should have required parameters including EnvironmentSuffix', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThan(5);
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('should have comprehensive outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(7);
    });
  });
});
