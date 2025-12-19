import fs from 'fs';
import path from 'path';

const environment = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Secure eBook Delivery System CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the converted JSON template
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure Validation', () => {
    test('should have correct CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have comprehensive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe('Secure Global eBook Delivery System with S3, CloudFront, and KMS encryption');
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toHaveLength(3);
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters Validation', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'Environment',
        'DomainName',
        'HostedZoneId',
        'KmsKeyAlias',
        'EnableLogging',
        'EnableWAF',
        'EnableLifecyclePolicies'
      ];

      expectedParams.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedValues).toEqual(['dev', 'test', 'prod']);
      expect(param.Description).toContain('Environment name');
    });

    test('DomainName parameter should be optional', () => {
      const param = template.Parameters.DomainName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toContain('Custom domain name');
    });

    test('KmsKeyAlias parameter should be optional', () => {
      const param = template.Parameters.KmsKeyAlias;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toContain('Existing KMS key alias');
    });

    test('Boolean parameters should have allowed values', () => {
      const booleanParams = ['EnableLogging', 'EnableWAF', 'EnableLifecyclePolicies'];
      booleanParams.forEach(paramName => {
        const param = template.Parameters[paramName];
        expect(param.Type).toBe('String');
        expect(param.AllowedValues).toEqual(['true', 'false']);
      });
    });
  });

  describe('Conditions Validation', () => {
    test('should have all required conditions', () => {
      const expectedConditions = [
        'CreateKmsKey',
        'EnableLoggingCondition',
        'EnableWAFCondition',
        'EnableLifecycleCondition',
        'HasCustomDomain',
        'HasHostedZone'
      ];

      expectedConditions.forEach(conditionName => {
        expect(template.Conditions[conditionName]).toBeDefined();
      });
    });

    test('CreateKmsKey condition should check empty KmsKeyAlias', () => {
      const condition = template.Conditions.CreateKmsKey;
      expect(condition).toEqual({
        'Fn::Equals': [{ Ref: 'KmsKeyAlias' }, '']
      });
    });

    test('HasCustomDomain condition should check for domain name', () => {
      const condition = template.Conditions.HasCustomDomain;
      expect(condition).toBeDefined();
      expect(condition['Fn::Not']).toBeDefined();
    });
  });

  describe('Core Infrastructure Resources', () => {
    test('should have S3 bucket for eBook storage', () => {
      expect(template.Resources.EbooksS3Bucket).toBeDefined();
      expect(template.Resources.EbooksS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have KMS encryption', () => {
      const bucket = template.Resources.EbooksS3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toHaveLength(1);

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.EbooksS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.EbooksS3Bucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have CloudFront Origin Access Identity', () => {
      expect(template.Resources.CloudFrontOAI).toBeDefined();
      expect(template.Resources.CloudFrontOAI.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
    });

    test('should have CloudFront distribution', () => {
      expect(template.Resources.EbooksCloudFrontDistribution).toBeDefined();
      expect(template.Resources.EbooksCloudFrontDistribution.Type).toBe('AWS::CloudFront::Distribution');
    });

    test('CloudFront distribution should have correct properties', () => {
      const distribution = template.Resources.EbooksCloudFrontDistribution;
      const config = distribution.Properties.DistributionConfig;

      expect(config.Enabled).toBe(true);
      expect(config.HttpVersion).toBe('http2');
      expect(config.IPV6Enabled).toBe(true);
      expect(config.PriceClass).toBe('PriceClass_All');
    });

    test('CloudFront should enforce HTTPS', () => {
      const distribution = template.Resources.EbooksCloudFrontDistribution;
      const behavior = distribution.Properties.DistributionConfig.DefaultCacheBehavior;

      expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('should have S3 bucket policy restricting direct access', () => {
      expect(template.Resources.EbooksS3BucketPolicy).toBeDefined();
      expect(template.Resources.EbooksS3BucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('Security Resources', () => {
    test('should have KMS key when no alias provided', () => {
      const kmsKey = template.Resources.EbooksKmsKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Condition).toBe('CreateKmsKey');
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have proper policy', () => {
      const kmsKey = template.Resources.EbooksKmsKey;
      const policy = kmsKey.Properties.KeyPolicy;

      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement).toHaveLength(2);

      // Check CloudFront decrypt permission
      const cfStatement = policy.Statement.find((stmt: any) => stmt.Sid === 'Allow CloudFront to decrypt');
      expect(cfStatement).toBeDefined();
      expect(cfStatement.Effect).toBe('Allow');
      expect(cfStatement.Principal.Service).toBe('cloudfront.amazonaws.com');
    });

    test('S3 bucket policy should deny direct access', () => {
      const policy = template.Resources.EbooksS3BucketPolicy;
      const policyDoc = policy.Properties.PolicyDocument;

      const denyStatement = policyDoc.Statement.find((stmt: any) => stmt.Sid === 'DenyDirectAccess');
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Effect).toBe('Deny');
      expect(denyStatement.Principal).toBe('*');
    });

    test('should have conditional WAF configuration', () => {
      const waf = template.Resources.CloudFrontWebACL;
      expect(waf).toBeDefined();
      expect(waf.Condition).toBe('EnableWAFCondition');
      expect(waf.Type).toBe('AWS::WAFv2::WebACL');
      expect(waf.Properties.Scope).toBe('CLOUDFRONT');
    });
  });

  describe('Monitoring and Alerting', () => {
    test('should have CloudWatch dashboard', () => {
      expect(template.Resources.CloudWatchDashboard).toBeDefined();
      expect(template.Resources.CloudWatchDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('should have error rate alarm', () => {
      expect(template.Resources.HighErrorRateAlarm).toBeDefined();
      expect(template.Resources.HighErrorRateAlarm.Type).toBe('AWS::CloudWatch::Alarm');

      const alarm = template.Resources.HighErrorRateAlarm;
      expect(alarm.Properties.MetricName).toBe('4xxErrorRate');
      expect(alarm.Properties.Threshold).toBe(5);
    });

    test('should have cache hit rate alarm', () => {
      expect(template.Resources.LowCacheHitRateAlarm).toBeDefined();
      expect(template.Resources.LowCacheHitRateAlarm.Type).toBe('AWS::CloudWatch::Alarm');

      const alarm = template.Resources.LowCacheHitRateAlarm;
      expect(alarm.Properties.MetricName).toBe('CacheHitRate');
      expect(alarm.Properties.Threshold).toBe(70);
    });

    test('should have SNS topic for alerts', () => {
      expect(template.Resources.SNSAlertTopic).toBeDefined();
      expect(template.Resources.SNSAlertTopic.Type).toBe('AWS::SNS::Topic');
    });
  });

  describe('Lambda Functions and Automation', () => {
    test('should have cost monitoring Lambda function', () => {
      expect(template.Resources.CostMonitoringFunction).toBeDefined();
      expect(template.Resources.CostMonitoringFunction.Type).toBe('AWS::Lambda::Function');

      const func = template.Resources.CostMonitoringFunction;
      expect(func.Properties.Runtime).toBe('python3.9');
      expect(func.Properties.Timeout).toBe(300);
    });

    test('should have IAM role for Lambda', () => {
      expect(template.Resources.CostMonitoringRole).toBeDefined();
      expect(template.Resources.CostMonitoringRole.Type).toBe('AWS::IAM::Role');

      const role = template.Resources.CostMonitoringRole;
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('should have EventBridge schedule', () => {
      expect(template.Resources.CostMonitoringSchedule).toBeDefined();
      expect(template.Resources.CostMonitoringSchedule.Type).toBe('AWS::Events::Rule');

      const schedule = template.Resources.CostMonitoringSchedule;
      expect(schedule.Properties.ScheduleExpression).toBe('rate(1 day)');
      expect(schedule.Properties.State).toBe('ENABLED');
    });
  });

  describe('Optional Resources', () => {
    test('should have conditional logging bucket', () => {
      const loggingBucket = template.Resources.LoggingBucket;
      expect(loggingBucket).toBeDefined();
      expect(loggingBucket.Condition).toBe('EnableLoggingCondition');
    });

    test('should have conditional SSL certificate', () => {
      const sslCert = template.Resources.SSLCertificate;
      expect(sslCert).toBeDefined();
      expect(sslCert.Condition).toBe('HasCustomDomain');
    });

    test('should have conditional Route 53 records', () => {
      const route53Record = template.Resources.Route53Record;
      expect(route53Record).toBeDefined();
      expect(route53Record.Condition).toBe('HasCustomDomain');
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have required tags', () => {
      const resources = template.Resources;

      Object.keys(resources).forEach(resourceName => {
        const resource = resources[resourceName];
        if (resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;

          // Check for iac-rlhf-amazon tag
          const iacTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
          expect(iacTag).toBeDefined();
          expect(iacTag.Value).toBe('true');

          // Check for Environment tag
          const envTag = tags.find((tag: any) => tag.Key === 'Environment');
          expect(envTag).toBeDefined();
        }
      });
    });

    test('S3 bucket should have proper tags', () => {
      const bucket = template.Resources.EbooksS3Bucket;
      const tags = bucket.Properties.Tags;

      const purposeTag = tags.find((tag: any) => tag.Key === 'Purpose');
      expect(purposeTag.Value).toBe('eBook-storage');
    });

    test('CloudFront distribution should have proper tags', () => {
      const distribution = template.Resources.EbooksCloudFrontDistribution;
      const tags = distribution.Properties.Tags;

      const purposeTag = tags.find((tag: any) => tag.Key === 'Purpose');
      expect(purposeTag.Value).toBe('eBook-delivery');
    });
  });

  describe('Outputs Validation', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'S3BucketName',
        'CloudFrontDistributionDomain',
        'CloudFrontDistributionId',
        'Route53RecordName',
        'CloudFrontOAIId',
        'KmsKeyId',
        'SNSTopicArn',
        'CostMonitoringFunctionArn',
        'Environment'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('S3BucketName output should reference correct resource', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Value.Ref).toBe('EbooksS3Bucket');
      expect(output.Description).toContain('S3 bucket storing eBooks');
    });

    test('CloudFront outputs should reference correct resource', () => {
      const domainOutput = template.Outputs.CloudFrontDistributionDomain;
      const idOutput = template.Outputs.CloudFrontDistributionId;

      expect(domainOutput.Value['Fn::GetAtt'][0]).toBe('EbooksCloudFrontDistribution');
      expect(idOutput.Value.Ref).toBe('EbooksCloudFrontDistribution');
    });

    test('KMS key output should be conditional', () => {
      const kmsOutput = template.Outputs.KmsKeyId;
      expect(kmsOutput.Value['Fn::If']).toBeDefined();
      expect(kmsOutput.Value['Fn::If'][0]).toBe('CreateKmsKey');
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Cross-Account Compatibility', () => {
    test('should not have hardcoded account IDs', () => {
      const templateStr = JSON.stringify(template);
      const hardcodedAccountPatterns = [
        /arn:aws:iam::[0-9]+:/g,
        /aws-account-[0-9]+/g
      ];

      hardcodedAccountPatterns.forEach(pattern => {
        expect(templateStr).not.toMatch(pattern);
      });
    });

    test('should use dynamic references for account ID', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('${AWS::AccountId}');
      expect(templateStr).toContain('${AWS::StackName}');
    });

    test('resource names should be dynamic', () => {
      const bucket = template.Resources.EbooksS3Bucket;
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${Environment}');
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${AWS::AccountId}');
    });
  });

  describe('Cost Optimization Features', () => {
    test('S3 bucket should have lifecycle configuration', () => {
      const bucket = template.Resources.EbooksS3Bucket;
      expect(bucket.Properties.LifecycleConfiguration['Fn::If']).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration['Fn::If'][0]).toBe('EnableLifecycleCondition');
    });

    test('CloudFront should use optimized cache policies', () => {
      const distribution = template.Resources.EbooksCloudFrontDistribution;
      const behavior = distribution.Properties.DistributionConfig.DefaultCacheBehavior;

      expect(behavior.CachePolicyId).toBe('658327ea-f89d-4fab-a63d-7e88639e58f6');
      expect(behavior.Compress).toBe(true);
    });

    test('should have pay-per-request pricing where applicable', () => {
      // This template doesn't use DynamoDB, but if it did:
      // const table = template.Resources.SomeTable;
      // expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });
  });

  describe('Performance Optimization', () => {
    test('CloudFront should support HTTP/2 and IPv6', () => {
      const distribution = template.Resources.EbooksCloudFrontDistribution;
      const config = distribution.Properties.DistributionConfig;

      expect(config.HttpVersion).toBe('http2');
      expect(config.IPV6Enabled).toBe(true);
      expect(config.PriceClass).toBe('PriceClass_All');
    });

    test('CloudFront should have appropriate cache behavior', () => {
      const distribution = template.Resources.EbooksCloudFrontDistribution;
      const behavior = distribution.Properties.DistributionConfig.DefaultCacheBehavior;

      expect(behavior.AllowedMethods.sort()).toEqual(['GET', 'HEAD', 'OPTIONS'].sort());
      expect(behavior.CachedMethods.sort()).toEqual(['GET', 'HEAD'].sort());
    });
  });

  describe('Template Completeness', () => {
    test('should have sufficient resources for production deployment', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(15); // Should have comprehensive set of resources
    });

    test('should handle all authentication scenarios', () => {
      // Check that OAI is properly configured
      const oai = template.Resources.CloudFrontOAI;
      expect(oai).toBeDefined();

      const bucketPolicy = template.Resources.EbooksS3BucketPolicy;
      expect(bucketPolicy).toBeDefined();
    });

    test('should have comprehensive monitoring', () => {
      const monitoringResources = [
        'CloudWatchDashboard',
        'HighErrorRateAlarm',
        'LowCacheHitRateAlarm',
        'SNSAlertTopic'
      ];

      monitoringResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });
  });
});

