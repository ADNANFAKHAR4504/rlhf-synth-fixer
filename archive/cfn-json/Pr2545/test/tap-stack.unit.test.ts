import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
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
      expect(typeof template.Description).toBe('string');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have Parameters, Resources, and Outputs sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      const requiredParams = [
        'EnvironmentSuffix',
        'DomainName',
        'EnvironmentName',
        'OrganizationPrefix',
        'Department',
        'Purpose',
        'Year'
      ];
      
      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
        expect(template.Parameters[param].Type).toBe('String');
        expect(template.Parameters[param].Description).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBeDefined();
      expect(envSuffixParam.ConstraintDescription).toBeDefined();
    });

    test('EnvironmentName parameter should have allowed values', () => {
      const envNameParam = template.Parameters.EnvironmentName;
      expect(envNameParam.AllowedValues).toEqual(['production', 'staging', 'development']);
    });
  });

  describe('Resources', () => {
    test('should have all required static website hosting resources', () => {
      const requiredResources = [
        'KMSKey',
        'KMSKeyAlias',
        'S3BucketLogs',
        'S3BucketWebsite',
        'CloudFrontOAC',
        'CloudFrontDistribution',
        'S3BucketPolicy',
        'IAMRoleCloudFrontAccess',
        'Route53HostedZone',
        'ACMCertificate',
        'Route53RecordSetA',
        'Route53RecordSetAAAA'
      ];

      requiredResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('all resources should have correct Type property', () => {
      const expectedTypes = {
        'KMSKey': 'AWS::KMS::Key',
        'KMSKeyAlias': 'AWS::KMS::Alias',
        'S3BucketLogs': 'AWS::S3::Bucket',
        'S3BucketWebsite': 'AWS::S3::Bucket',
        'CloudFrontOAC': 'AWS::CloudFront::OriginAccessControl',
        'CloudFrontDistribution': 'AWS::CloudFront::Distribution',
        'S3BucketPolicy': 'AWS::S3::BucketPolicy',
        'IAMRoleCloudFrontAccess': 'AWS::IAM::Role',
        'Route53HostedZone': 'AWS::Route53::HostedZone',
        'ACMCertificate': 'AWS::CertificateManager::Certificate',
        'Route53RecordSetA': 'AWS::Route53::RecordSet',
        'Route53RecordSetAAAA': 'AWS::Route53::RecordSet'
      };

      Object.entries(expectedTypes).forEach(([resourceName, expectedType]) => {
        expect(template.Resources[resourceName].Type).toBe(expectedType);
      });
    });

    test('resources should have correct deletion policies', () => {
      const resourcesWithDeletionPolicy = [
        'KMSKey',
        'S3BucketLogs',
        'S3BucketWebsite',
        'CloudFrontDistribution',
        'Route53HostedZone',
        'ACMCertificate'
      ];

      resourcesWithDeletionPolicy.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
        expect(resource.UpdateReplacePolicy).toBe('Delete');
      });
    });
  });

  describe('S3 Configuration', () => {
    test('S3 buckets should have encryption enabled', () => {
      const bucketResources = ['S3BucketLogs', 'S3BucketWebsite'];
      
      bucketResources.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
        
        const encConfig = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encConfig.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(encConfig.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });
      });
    });

    test('S3 buckets should block public access', () => {
      const bucketResources = ['S3BucketLogs', 'S3BucketWebsite'];
      
      bucketResources.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
        
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('website S3 bucket should have versioning enabled', () => {
      const websiteBucket = template.Resources.S3BucketWebsite;
      expect(websiteBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('website S3 bucket should have logging configured', () => {
      const websiteBucket = template.Resources.S3BucketWebsite;
      expect(websiteBucket.Properties.LoggingConfiguration).toBeDefined();
      expect(websiteBucket.Properties.LoggingConfiguration.DestinationBucketName).toEqual({ Ref: 'S3BucketLogs' });
    });
  });

  describe('CloudFront Configuration', () => {
    test('CloudFront distribution should have correct origin configuration', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const origins = distribution.Properties.DistributionConfig.Origins;
      
      expect(origins).toHaveLength(1);
      expect(origins[0].Id).toBe('S3Origin');
      expect(origins[0].DomainName).toEqual({
        'Fn::GetAtt': ['S3BucketWebsite', 'RegionalDomainName']
      });
      expect(origins[0].OriginAccessControlId).toEqual({ Ref: 'CloudFrontOAC' });
    });

    test('CloudFront distribution should enforce HTTPS', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const defaultCacheBehavior = distribution.Properties.DistributionConfig.DefaultCacheBehavior;
      
      expect(defaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('CloudFront distribution should have IPv6 enabled', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution.Properties.DistributionConfig.IPV6Enabled).toBe(true);
    });
  });

  describe('Route 53 Configuration', () => {
    test('Route53 records should point to CloudFront distribution', () => {
      const recordSets = ['Route53RecordSetA', 'Route53RecordSetAAAA'];
      
      recordSets.forEach(recordName => {
        const record = template.Resources[recordName];
        expect(record.Properties.AliasTarget.DNSName).toEqual({
          'Fn::GetAtt': ['CloudFrontDistribution', 'DomainName']
        });
        expect(record.Properties.AliasTarget.HostedZoneId).toBe('Z2FDTNDATAQYW2');
      });
    });
  });

  describe('Security Configuration', () => {
    test('KMS key should have proper key policy', () => {
      const kmsKey = template.Resources.KMSKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;
      
      expect(keyPolicy.Statement).toHaveLength(2);
      
      // Check root account permissions
      const rootStatement = keyPolicy.Statement.find((stmt: any) => 
        stmt.Sid === 'Enable IAM User Permissions'
      );
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');
      
      // Check CloudFront permissions
      const cfStatement = keyPolicy.Statement.find((stmt: any) => 
        stmt.Sid === 'Allow CloudFront service'
      );
      expect(cfStatement).toBeDefined();
      expect(cfStatement.Principal.Service).toBe('cloudfront.amazonaws.com');
    });

    test('S3 bucket policy should allow CloudFront access only', () => {
      const bucketPolicy = template.Resources.S3BucketPolicy;
      const statement = bucketPolicy.Properties.PolicyDocument.Statement[0];
      
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('cloudfront.amazonaws.com');
      expect(statement.Action).toBe('s3:GetObject');
      expect(statement.Condition.StringEquals['AWS:SourceArn']).toEqual({
        'Fn::Sub': 'arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}'
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'S3BucketName',
        'S3BucketWebsiteEndpoint',
        'CloudFrontDistributionDomainName',
        'Route53HostedZoneId',
        'ACMCertificateArn',
        'KMSKeyId',
        'StackName',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`
        });
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resource names should follow naming convention with environment suffix', () => {
      const resourcesWithNaming = [
        'S3BucketLogs',
        'S3BucketWebsite',
        'CloudFrontOAC',
        'IAMRoleCloudFrontAccess',
        'Route53HostedZone'
      ];

      resourcesWithNaming.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.BucketName) {
          expect(resource.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        } else if (resource.Properties.RoleName) {
          expect(resource.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        } else if (resource.Properties.Name && resource.Type === 'AWS::Route53::HostedZone') {
          // Route53 HostedZone uses domain name directly
          expect(resource.Properties.Name).toEqual({ Ref: 'DomainName' });
        }
      });
    });

    test('KMS key alias should follow naming convention', () => {
      const kmsAlias = template.Resources.KMSKeyAlias;
      expect(kmsAlias.Properties.AliasName['Fn::Sub']).toContain('${EnvironmentSuffix}');
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

    test('should have correct number of resources for static website hosting', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(12);
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(7);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });
  });

  describe('Resource Dependencies', () => {
    test('S3 bucket policy should reference S3 bucket and CloudFront distribution', () => {
      const bucketPolicy = template.Resources.S3BucketPolicy;
      expect(bucketPolicy.Properties.Bucket).toEqual({ Ref: 'S3BucketWebsite' });
      
      const condition = bucketPolicy.Properties.PolicyDocument.Statement[0].Condition;
      expect(condition.StringEquals['AWS:SourceArn']['Fn::Sub']).toContain('${CloudFrontDistribution}');
    });

    test('CloudFront distribution should reference OAC and S3 bucket', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const origin = distribution.Properties.DistributionConfig.Origins[0];
      
      expect(origin.OriginAccessControlId).toEqual({ Ref: 'CloudFrontOAC' });
      expect(origin.DomainName).toEqual({
        'Fn::GetAtt': ['S3BucketWebsite', 'RegionalDomainName']
      });
    });

    test('ACM certificate should reference Route53 hosted zone', () => {
      const certificate = template.Resources.ACMCertificate;
      const domainValidation = certificate.Properties.DomainValidationOptions[0];
      
      expect(domainValidation.HostedZoneId).toEqual({ Ref: 'Route53HostedZone' });
    });
  });
});