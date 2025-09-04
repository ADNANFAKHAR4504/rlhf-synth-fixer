import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `cfn-flip lib/TapStack.yml lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
        'Secure infrastructure template for IaC - AWS Nova Model Breaking project with KMS toggle (v5.1 - No-KMS capable)'
      );
    });

    test('should have parameters, resources, conditions, and outputs', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      const requiredParams = ['Environment', 'EnvironmentSuffix', 'ProjectName', 'VpcCidr', 'UseKmsForLogs'];
      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
      expect(envParam.AllowedValues).toEqual(['dev', 'stg', 'prod']);
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming to avoid conflicts'
      );
    });

    test('KMS toggle parameter should exist', () => {
      const kmsParam = template.Parameters.UseKmsForLogs;
      expect(kmsParam.Type).toBe('String');
      expect(kmsParam.Default).toBe('false');
      expect(kmsParam.AllowedValues).toEqual(['true', 'false']);
    });
  });

  describe('Resources', () => {
    test('should have core infrastructure resources', () => {
      const coreResources = ['VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2', 'CloudTrail', 'CloudTrailBucket'];
      coreResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('VPC should be properly configured', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('CloudTrail should be properly configured', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.Properties.IsLogging).toBe(true);
    });

    test('CloudTrail bucket should have proper configuration', () => {
      const bucket = template.Resources.CloudTrailBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('CloudTrail bucket policy should exist and allow CloudTrail service', () => {
      const bucketPolicy = template.Resources.CloudTrailBucketPolicy;
      expect(bucketPolicy).toBeDefined();
      expect(bucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      
      const statements = bucketPolicy.Properties.PolicyDocument.Statement;
      expect(statements.some((stmt: any) => 
        stmt.Principal && stmt.Principal.Service === 'cloudtrail.amazonaws.com'
      )).toBe(true);
    });

    test('should have security resources', () => {
      const securityResources = ['SshSecurityGroup', 'WAFWebACL', 'EC2InstanceRole'];
      securityResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('WAF WebACL should have managed rules', () => {
      const waf = template.Resources.WAFWebACL;
      expect(waf.Type).toBe('AWS::WAFv2::WebACL');
      expect(waf.Properties.DefaultAction).toEqual({ Allow: {} });
      expect(Array.isArray(waf.Properties.Rules)).toBe(true);
      expect(waf.Properties.Rules.length).toBeGreaterThan(0);
    });

    test('should have conditional KMS resources', () => {
      expect(template.Resources.S3EncryptionKey).toBeDefined();
      expect(template.Resources.S3EncryptionKey.Condition).toBe('CreateKmsKey');
      expect(template.Resources.S3EncryptionKeyAlias).toBeDefined();
      expect(template.Resources.S3EncryptionKeyAlias.Condition).toBe('CreateKmsKey');
    });
  });

  describe('Conditions', () => {
    test('should have KMS-related conditions', () => {
      expect(template.Conditions.UseKms).toBeDefined();
      expect(template.Conditions.CreateKmsKey).toBeDefined();
    });

    test('should have feature toggle conditions', () => {
      expect(template.Conditions.EnableCloudWatchLogs).toBeDefined();
      expect(template.Conditions.EnableShield).toBeDefined();
      expect(template.Conditions.WafLogsToS3).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have core infrastructure outputs', () => {
      const expectedOutputs = [
        'CloudTrailBucketName',
        'CloudTrailArn',
        'VpcId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'ApplicationLoadBalancerDNS',
        'WAFWebACLArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('CloudTrailBucketName output should be correct', () => {
      const output = template.Outputs.CloudTrailBucketName;
      expect(output.Description).toBe('Name of the CloudTrail S3 bucket');
      expect(output.Value).toEqual({ Ref: 'CloudTrailBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TrailBucketName',
      });
    });

    test('VpcId output should reference VPC resource', () => {
      const output = template.Outputs.VpcId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('WAFWebACLArn output should use GetAtt', () => {
      const output = template.Outputs.WAFWebACLArn;
      expect(output.Description).toBe('ARN of the WAF Web ACL');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['WAFWebACL', 'Arn'],
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

    test('should have substantial infrastructure resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(15);
    });

    test('should have multiple parameters for configuration', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThanOrEqual(8);
    });

    test('should have multiple outputs for integration', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with environment suffix', () => {
      const vpc = template.Resources.VPC;
      const vpcName = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name').Value;
      expect(vpcName).toEqual({
        'Fn::Sub': 'VPC-${EnvironmentSuffix}-001'
      });
    });

    test('CloudTrail should use environment suffix in name', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.TrailName).toEqual({
        'Fn::Sub': 'Trail-${EnvironmentSuffix}'
      });
    });

    test('export names should follow consistent naming', () => {
      const outputs = Object.keys(template.Outputs);
      outputs.forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toHaveProperty('Fn::Sub');
        }
      });
    });
  });

  describe('Security Configuration', () => {
    test('S3 buckets should have public access blocked', () => {
      const buckets = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::S3::Bucket'
      );
      
      buckets.forEach(bucketKey => {
        const bucket = template.Resources[bucketKey];
        expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      });
    });

    test('CloudTrail should have security best practices', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
    });
  });
});

