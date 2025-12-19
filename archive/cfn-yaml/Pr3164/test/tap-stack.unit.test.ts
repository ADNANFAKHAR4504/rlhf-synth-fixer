import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Static Website Infrastructure Tests', () => {
    test('should have all required CloudFormation sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Static Website Infrastructure with S3, CloudFront, Route53, and KMS encryption'
      );
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix to append to resource names (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only lowercase letters and numbers'
      );
    });

    test('should have DomainName parameter', () => {
      expect(template.Parameters.DomainName).toBeDefined();
      const domainParam = template.Parameters.DomainName;
      expect(domainParam.Type).toBe('String');
      expect(domainParam.Default).toBe('');
      expect(domainParam.Description).toContain('Custom domain name');
    });

    test('should have EnableSSL parameter', () => {
      expect(template.Parameters.EnableSSL).toBeDefined();
      const sslParam = template.Parameters.EnableSSL;
      expect(sslParam.Type).toBe('String');
      expect(sslParam.Default).toBe('false');
      expect(sslParam.AllowedValues).toEqual(['true', 'false']);
    });

    test('should have ACMCertificateArn parameter', () => {
      expect(template.Parameters.ACMCertificateArn).toBeDefined();
      const certParam = template.Parameters.ACMCertificateArn;
      expect(certParam.Type).toBe('String');
      expect(certParam.Default).toBe('');
      expect(certParam.Description).toContain('ACM certificate');
    });
  });

  describe('Resources', () => {
    test('should have WebsiteBucket resource', () => {
      expect(template.Resources.WebsiteBucket).toBeDefined();
      const bucket = template.Resources.WebsiteBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have LoggingBucket resource', () => {
      expect(template.Resources.LoggingBucket).toBeDefined();
      const bucket = template.Resources.LoggingBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have KMS resources', () => {
      expect(template.Resources.S3EncryptionKey).toBeDefined();
      expect(template.Resources.S3EncryptionKeyAlias).toBeDefined();

      const key = template.Resources.S3EncryptionKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have CloudFront resources', () => {
      expect(template.Resources.CloudFrontOAC).toBeDefined();
      expect(template.Resources.CloudFrontDistributionSSLWithDomain).toBeDefined();
      expect(template.Resources.CloudFrontDistributionNoDomain).toBeDefined();

      const oac = template.Resources.CloudFrontOAC;
      expect(oac.Type).toBe('AWS::CloudFront::OriginAccessControl');
    });

    test('should have Route53 resources', () => {
      expect(template.Resources.HostedZone).toBeDefined();
      expect(template.Resources.Route53RecordRoot).toBeDefined();
      expect(template.Resources.Route53RecordWWW).toBeDefined();

      const hostedZone = template.Resources.HostedZone;
      expect(hostedZone.Type).toBe('AWS::Route53::HostedZone');
      expect(hostedZone.Condition).toBe('HasDomainName');
    });

    test('should have CloudWatch resources', () => {
      expect(template.Resources.WebsiteLogGroup).toBeDefined();
      expect(template.Resources.CloudFront4xxAlarm).toBeDefined();
      expect(template.Resources.CloudFront5xxAlarm).toBeDefined();

      const logGroup = template.Resources.WebsiteLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('WebsiteBucket should have KMS encryption', () => {
      const bucket = template.Resources.WebsiteBucket;
      const encryption = bucket.Properties.BucketEncryption;

      expect(encryption.ServerSideEncryptionConfiguration).toHaveLength(1);
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionConfiguration[0].BucketKeyEnabled).toBe(true);
    });

    test('WebsiteBucket should have versioning enabled', () => {
      const bucket = template.Resources.WebsiteBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('LoggingBucket should have AES256 encryption', () => {
      const bucket = template.Resources.LoggingBucket;
      const encryption = bucket.Properties.BucketEncryption;

      expect(encryption.ServerSideEncryptionConfiguration).toHaveLength(1);
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('CloudFront distributions should have correct configurations', () => {
      const sslDist = template.Resources.CloudFrontDistributionSSLWithDomain;
      const noDomainDist = template.Resources.CloudFrontDistributionNoDomain;

      expect(sslDist.Properties.DistributionConfig.Enabled).toBe(true);
      expect(sslDist.Properties.DistributionConfig.DefaultRootObject).toBe('index.html');
      expect(sslDist.Properties.DistributionConfig.HttpVersion).toBe('http2');
      expect(sslDist.Properties.DistributionConfig.PriceClass).toBe('PriceClass_100');

      expect(noDomainDist.Properties.DistributionConfig.Enabled).toBe(true);
      expect(noDomainDist.Properties.DistributionConfig.DefaultRootObject).toBe('index.html');
    });

    test('CloudWatch alarms should have correct thresholds', () => {
      const alarm4xx = template.Resources.CloudFront4xxAlarm;
      const alarm5xx = template.Resources.CloudFront5xxAlarm;

      expect(alarm4xx.Properties.Threshold).toBe(5);
      expect(alarm4xx.Properties.MetricName).toBe('4xxErrorRate');
      expect(alarm4xx.Properties.ComparisonOperator).toBe('GreaterThanThreshold');

      expect(alarm5xx.Properties.Threshold).toBe(1);
      expect(alarm5xx.Properties.MetricName).toBe('5xxErrorRate');
      expect(alarm5xx.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'WebsiteBucketName',
        'WebsiteBucketArn',
        'LoggingBucketName',
        'CloudFrontDistributionId',
        'CloudFrontDomainName',
        'WebsiteURL',
        'KMSKeyId',
        'KMSKeyArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('WebsiteBucketName output should be correct', () => {
      const output = template.Outputs.WebsiteBucketName;
      expect(output.Description).toBe('S3 bucket hosting website');
      expect(output.Value).toEqual({ Ref: 'WebsiteBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-WebsiteBucket',
      });
    });

    test('WebsiteBucketArn output should be correct', () => {
      const output = template.Outputs.WebsiteBucketArn;
      expect(output.Description).toBe('ARN of the website bucket');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['WebsiteBucket', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-WebsiteBucketArn',
      });
    });

    test('CloudFrontDistributionId output should be correct', () => {
      const output = template.Outputs.CloudFrontDistributionId;
      expect(output.Description).toBe('CloudFront Distribution ID');
      expect(output.Value['Fn::If']).toBeDefined();
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-CloudFrontDistributionId',
      });
    });

    test('WebsiteURL output should be correct', () => {
      const output = template.Outputs.WebsiteURL;
      expect(output.Description).toBe('URL of the website');
      expect(output.Value['Fn::If']).toBeDefined();
    });

    test('KMS outputs should be correct', () => {
      const keyIdOutput = template.Outputs.KMSKeyId;
      const keyArnOutput = template.Outputs.KMSKeyArn;

      expect(keyIdOutput.Description).toBe('KMS Key ID for S3 encryption');
      expect(keyIdOutput.Value).toEqual({ Ref: 'S3EncryptionKey' });

      expect(keyArnOutput.Description).toBe('KMS Key ARN for S3 encryption');
      expect(keyArnOutput.Value).toEqual({ 'Fn::GetAtt': ['S3EncryptionKey', 'Arn'] });
    });

    test('conditional outputs should exist when domain is provided', () => {
      const conditionalOutputs = ['HostedZoneId', 'NameServers'];

      conditionalOutputs.forEach(outputName => {
        if (template.Outputs[outputName]) {
          expect(template.Outputs[outputName].Condition).toBe('HasDomainName');
        }
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
      expect(template.Conditions).not.toBeNull();
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10); // Static website has multiple resources
    });

    test('should have four parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have multiple outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(8);
    });

    test('should have conditions defined', () => {
      expect(template.Conditions.UseSSL).toBeDefined();
      expect(template.Conditions.HasDomainName).toBeDefined();
      expect(template.Conditions.NoDomainName).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    test('bucket names should follow naming convention with environment suffix', () => {
      const websiteBucket = template.Resources.WebsiteBucket;
      const loggingBucket = template.Resources.LoggingBucket;

      expect(websiteBucket.Properties.BucketName['Fn::If']).toBeDefined();
      expect(loggingBucket.Properties.BucketName['Fn::If']).toBeDefined();
    });

    test('KMS alias should follow naming convention', () => {
      const kmsAlias = template.Resources.S3EncryptionKeyAlias;
      expect(kmsAlias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/${AWS::StackName}-s3-encryption-${EnvironmentSuffix}'
      });
    });


    test('CloudWatch alarms should follow naming convention', () => {
      const alarm4xx = template.Resources.CloudFront4xxAlarm;
      const alarm5xx = template.Resources.CloudFront5xxAlarm;

      expect(alarm4xx.Properties.AlarmName).toEqual({
        'Fn::Sub': '${AWS::StackName}-cloudfront-4xx-errors-${EnvironmentSuffix}'
      });
      expect(alarm5xx.Properties.AlarmName).toEqual({
        'Fn::Sub': '${AWS::StackName}-cloudfront-5xx-errors-${EnvironmentSuffix}'
      });
    });
  });

  describe('Security Configuration', () => {
    test('S3 buckets should have public access blocked', () => {
      const websiteBucket = template.Resources.WebsiteBucket;
      const loggingBucket = template.Resources.LoggingBucket;

      expect(websiteBucket.Properties.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      });

      expect(loggingBucket.Properties.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      });
    });

    test('CloudFront should use Origin Access Control', () => {
      const oac = template.Resources.CloudFrontOAC;
      expect(oac.Properties.OriginAccessControlConfig.SigningBehavior).toBe('always');
      expect(oac.Properties.OriginAccessControlConfig.SigningProtocol).toBe('sigv4');
    });

    test('KMS key should have proper policy', () => {
      const kmsKey = template.Resources.S3EncryptionKey;
      const policy = kmsKey.Properties.KeyPolicy;

      expect(policy.Statement).toHaveLength(2);
      expect(policy.Statement[0].Effect).toBe('Allow');
      expect(policy.Statement[0].Action).toBe('kms:*');
      expect(policy.Statement[1].Principal.Service).toBe('cloudfront.amazonaws.com');
    });
  });
});
