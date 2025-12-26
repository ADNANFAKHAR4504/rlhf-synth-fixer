import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON if needed: cfn-flip lib/TapStack.yml > lib/TapStack.json
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description for static web application infrastructure', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'CloudFormation template to deploy a secure, reusable AWS infrastructure for a static web application.'
      );
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });

  describe('Parameters', () => {
    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have EnvironmentSuffix parameter with correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Description).toBe('Suffix for the environment (e.g., dev, prod)');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBe('Must contain only alphanumeric characters.');
    });

    test('should have ApplicationName parameter with default value', () => {
      const param = template.Parameters.ApplicationName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('webapp');
      expect(param.Description).toBe('Name of the application');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBe('Must contain only alphanumeric characters.');
    });

    test('should have DomainAlias parameter for custom domain', () => {
      const param = template.Parameters.DomainAlias;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toBe('Domain alias for CloudFront distribution (optional)');
    });

    test('should have CertificateArn parameter for SSL certificate', () => {
      const param = template.Parameters.CertificateArn;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toBe('ACM Certificate ARN for custom domain (required if DomainAlias is specified)');
    });
  });

  describe('Conditions', () => {
    test('should have HasDomainAlias condition', () => {
      const condition = template.Conditions.HasDomainAlias;
      expect(condition).toBeDefined();
      expect(condition['Fn::Not']).toBeDefined();
    });

    test('should have HasCertificate condition with proper logic', () => {
      const condition = template.Conditions.HasCertificate;
      expect(condition).toBeDefined();
      expect(condition['Fn::And']).toBeDefined();
      expect(condition['Fn::And']).toHaveLength(2);
    });
  });

  describe('Resources', () => {
    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(6);
    });

    describe('S3 Bucket for Web App', () => {
      test('should have WebAppS3Bucket resource', () => {
        const bucket = template.Resources.WebAppS3Bucket;
        expect(bucket).toBeDefined();
        expect(bucket.Type).toBe('AWS::S3::Bucket');
      });

      test('should have proper encryption configuration', () => {
        const bucket = template.Resources.WebAppS3Bucket;
        const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      });

      test('should have versioning enabled', () => {
        const bucket = template.Resources.WebAppS3Bucket;
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });

      test('should block public access', () => {
        const bucket = template.Resources.WebAppS3Bucket;
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });

      test('should have lifecycle configuration for old versions', () => {
        const bucket = template.Resources.WebAppS3Bucket;
        const lifecycle = bucket.Properties.LifecycleConfiguration.Rules[0];
        expect(lifecycle.Id).toBe('DeleteOldVersions');
        expect(lifecycle.Status).toBe('Enabled');
        expect(lifecycle.NoncurrentVersionExpirationInDays).toBe(30);
      });

      test('should have proper tags', () => {
        const bucket = template.Resources.WebAppS3Bucket;
        const tags = bucket.Properties.Tags;
        expect(tags).toHaveLength(3);
        expect(tags.find((tag: { Key: string; }) => tag.Key === 'Name')).toBeDefined();
        expect(tags.find((tag: { Key: string; }) => tag.Key === 'Environment')).toBeDefined();
        expect(tags.find((tag: { Key: string; }) => tag.Key === 'Application')).toBeDefined();
      });
    });

    describe('CloudFront Origin Access Control', () => {
      test('should have CloudFrontOriginAccessControl resource', () => {
        const oac = template.Resources.CloudFrontOriginAccessControl;
        expect(oac).toBeDefined();
        expect(oac.Type).toBe('AWS::CloudFront::OriginAccessControl');
      });

      test('should have correct OAC configuration', () => {
        const oac = template.Resources.CloudFrontOriginAccessControl;
        const config = oac.Properties.OriginAccessControlConfig;
        expect(config.OriginAccessControlOriginType).toBe('s3');
        expect(config.SigningBehavior).toBe('always');
        expect(config.SigningProtocol).toBe('sigv4');
      });
    });

    describe('Response Headers Policy', () => {
      test('should have ResponseHeadersPolicy resource', () => {
        const policy = template.Resources.ResponseHeadersPolicy;
        expect(policy).toBeDefined();
        expect(policy.Type).toBe('AWS::CloudFront::ResponseHeadersPolicy');
      });

      test('should have security headers configured', () => {
        const policy = template.Resources.ResponseHeadersPolicy;
        const securityConfig = policy.Properties.ResponseHeadersPolicyConfig.SecurityHeadersConfig;
        
        expect(securityConfig.StrictTransportSecurity).toBeDefined();
        expect(securityConfig.StrictTransportSecurity.AccessControlMaxAgeSec).toBe(31536000);
        expect(securityConfig.StrictTransportSecurity.IncludeSubdomains).toBe(true);
        expect(securityConfig.StrictTransportSecurity.Override).toBe(true);

        expect(securityConfig.ContentTypeOptions.Override).toBe(true);
        expect(securityConfig.FrameOptions.FrameOption).toBe('DENY');
        expect(securityConfig.FrameOptions.Override).toBe(true);
        expect(securityConfig.ReferrerPolicy.ReferrerPolicy).toBe('strict-origin-when-cross-origin');
        expect(securityConfig.ReferrerPolicy.Override).toBe(true);
        expect(securityConfig.ContentSecurityPolicy.Override).toBe(true);
      });
    });

    describe('Logging S3 Bucket', () => {
      test('should have LoggingBucket resource', () => {
        const bucket = template.Resources.LoggingBucket;
        expect(bucket).toBeDefined();
        expect(bucket.Type).toBe('AWS::S3::Bucket');
      });

      test('should have proper ownership controls for CloudFront logging', () => {
        const bucket = template.Resources.LoggingBucket;
        const ownership = bucket.Properties.OwnershipControls.Rules[0];
        expect(ownership.ObjectOwnership).toBe('BucketOwnerPreferred');
      });

      test('should allow ACLs for CloudFront logging', () => {
        const bucket = template.Resources.LoggingBucket;
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(false);
        expect(publicAccess.IgnorePublicAcls).toBe(false);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });

      test('should have lifecycle policy for log retention', () => {
        const bucket = template.Resources.LoggingBucket;
        const lifecycle = bucket.Properties.LifecycleConfiguration.Rules[0];
        expect(lifecycle.Id).toBe('DeleteOldLogs');
        expect(lifecycle.Status).toBe('Enabled');
        expect(lifecycle.ExpirationInDays).toBe(90);
      });
    });

    describe('CloudFront Distribution', () => {
      test('should have CloudFrontDistribution resource', () => {
        const distribution = template.Resources.CloudFrontDistribution;
        expect(distribution).toBeDefined();
        expect(distribution.Type).toBe('AWS::CloudFront::Distribution');
      });

      test('should have proper origin configuration', () => {
        const distribution = template.Resources.CloudFrontDistribution;
        const origin = distribution.Properties.DistributionConfig.Origins[0];
        
        expect(origin.Id).toBe('S3Origin');
        expect(origin.S3OriginConfig.OriginAccessIdentity).toBe('');
        expect(origin.OriginAccessControlId.Ref).toBe('CloudFrontOriginAccessControl');
      });

      test('should have correct default cache behavior', () => {
        const distribution = template.Resources.CloudFrontDistribution;
        const behavior = distribution.Properties.DistributionConfig.DefaultCacheBehavior;
        
        expect(behavior.AllowedMethods).toEqual(['GET', 'HEAD', 'OPTIONS']);
        expect(behavior.TargetOriginId).toBe('S3Origin');
        expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https');
        expect(behavior.CachePolicyId).toBe('658327ea-f89d-4fab-a63d-7e88639e58f6');
        expect(behavior.Compress).toBe(true);
      });

      test('should have custom error responses for SPA', () => {
        const distribution = template.Resources.CloudFrontDistribution;
        const errorResponses = distribution.Properties.DistributionConfig.CustomErrorResponses;
        
        expect(errorResponses).toHaveLength(2);
        expect(errorResponses[0].ErrorCode).toBe(404);
        expect(errorResponses[0].ResponseCode).toBe(200);
        expect(errorResponses[0].ResponsePagePath).toBe('/index.html');
        expect(errorResponses[1].ErrorCode).toBe(403);
        expect(errorResponses[1].ResponseCode).toBe(200);
      });

      test('should have proper viewer certificate configuration', () => {
        const distribution = template.Resources.CloudFrontDistribution;
        const viewerCert = distribution.Properties.DistributionConfig.ViewerCertificate;
        
        expect(viewerCert['Fn::If']).toBeDefined();
        expect(viewerCert['Fn::If'][0]).toBe('HasCertificate');
      });

      test('should have logging configuration', () => {
        const distribution = template.Resources.CloudFrontDistribution;
        const logging = distribution.Properties.DistributionConfig.Logging;
        
        expect(logging.IncludeCookies).toBe(false);
        expect(logging.Prefix['Fn::Sub']).toBe('cloudfront-logs/${ApplicationName}-${EnvironmentSuffix}/');
      });

      test('should have cost optimization settings', () => {
        const distribution = template.Resources.CloudFrontDistribution;
        const config = distribution.Properties.DistributionConfig;
        
        expect(config.PriceClass).toBe('PriceClass_100');
        expect(config.HttpVersion).toBe('http2');
        expect(config.IPV6Enabled).toBe(true);
      });
    });

    describe('S3 Bucket Policy', () => {
      test('should have WebAppS3BucketPolicy resource', () => {
        const policy = template.Resources.WebAppS3BucketPolicy;
        expect(policy).toBeDefined();
        expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      });

      test('should have correct policy document for CloudFront access', () => {
        const policy = template.Resources.WebAppS3BucketPolicy;
        const statement = policy.Properties.PolicyDocument.Statement[0];
        
        expect(statement.Sid).toBe('AllowCloudFrontServicePrincipal');
        expect(statement.Effect).toBe('Allow');
        expect(statement.Principal.Service).toBe('cloudfront.amazonaws.com');
        expect(statement.Action).toBe('s3:GetObject');
      });

      test('should have proper condition for source ARN restriction', () => {
        const policy = template.Resources.WebAppS3BucketPolicy;
        const condition = policy.Properties.PolicyDocument.Statement[0].Condition;
        
        expect(condition.StringEquals['AWS:SourceArn']).toBeDefined();
        expect(condition.StringEquals['AWS:SourceArn']['Fn::Sub']).toBe(
          'arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}'
        );
      });
    });
  });

  describe('Outputs', () => {
    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });

    test('should have S3BucketName output', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('Name of the S3 bucket for web app content');
      expect(output.Value.Ref).toBe('WebAppS3Bucket');
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-S3BucketName');
    });

    test('should have S3BucketDomainName output', () => {
      const output = template.Outputs.S3BucketDomainName;
      expect(output.Description).toBe('Regional domain name of the S3 bucket');
      expect(output.Value['Fn::GetAtt']).toEqual(['WebAppS3Bucket', 'RegionalDomainName']);
    });

    test('should have LoggingBucketName output', () => {
      const output = template.Outputs.LoggingBucketName;
      expect(output.Description).toBe('Name of the S3 bucket for CloudFront logs');
      expect(output.Value.Ref).toBe('LoggingBucket');
    });

    test('should have CloudFront distribution outputs', () => {
      const domainOutput = template.Outputs.CloudFrontDistributionDomainName;
      const idOutput = template.Outputs.CloudFrontDistributionId;
      
      expect(domainOutput.Description).toBe('Domain name of the CloudFront distribution');
      expect(domainOutput.Value['Fn::GetAtt']).toEqual(['CloudFrontDistribution', 'DomainName']);
      
      expect(idOutput.Description).toBe('ID of the CloudFront distribution');
      expect(idOutput.Value.Ref).toBe('CloudFrontDistribution');
    });

    test('should have CloudFrontOriginAccessControlId output', () => {
      const output = template.Outputs.CloudFrontOriginAccessControlId;
      expect(output.Description).toBe('CloudFront Origin Access Control ID');
      expect(output.Value.Ref).toBe('CloudFrontOriginAccessControl');
    });

    test('should have WebsiteURL output', () => {
      const output = template.Outputs.WebsiteURL;
      expect(output.Description).toBe('URL of the CloudFront distribution');
      expect(output.Value['Fn::Sub']).toBe('https://${CloudFrontDistribution.DomainName}');
    });

    test('should have conditional CustomDomainURL output', () => {
      const output = template.Outputs.CustomDomainURL;
      expect(output.Condition).toBe('HasDomainAlias');
      expect(output.Description).toBe('Custom domain URL');
      expect(output.Value['Fn::Sub']).toBe('https://${DomainAlias}');
    });

    test('all outputs should have proper export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name['Fn::Sub']).toBe(`\${AWS::StackName}-${outputKey}`);
        }
      });
    });
  });

  describe('Resource Naming Conventions', () => {
    test('should use consistent naming pattern for tags', () => {
      const resourcesWithTags = ['WebAppS3Bucket', 'LoggingBucket', 'CloudFrontDistribution'];
      
      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags;
        
        expect(tags.find((tag: { Key: string; }) => tag.Key === 'Environment')).toBeDefined();
        expect(tags.find((tag: { Key: string; }) => tag.Key === 'Application')).toBeDefined();
        expect(tags.find((tag: { Key: string; }) => tag.Key === 'Name')).toBeDefined();
      });
    });

    test('should use ApplicationName and EnvironmentSuffix in resource naming', () => {
      const oac = template.Resources.CloudFrontOriginAccessControl;
      expect(oac.Properties.OriginAccessControlConfig.Name['Fn::Sub']).toBe(
        '${ApplicationName}-${EnvironmentSuffix}-oac'
      );

      const policy = template.Resources.ResponseHeadersPolicy;
      expect(policy.Properties.ResponseHeadersPolicyConfig.Name['Fn::Sub']).toBe(
        '${ApplicationName}-${EnvironmentSuffix}-security-headers'
      );
    });
  });

  describe('Security Best Practices', () => {
    test('should enforce HTTPS only', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const behavior = distribution.Properties.DistributionConfig.DefaultCacheBehavior;
      expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('should have comprehensive security headers', () => {
      const policy = template.Resources.ResponseHeadersPolicy;
      const securityConfig = policy.Properties.ResponseHeadersPolicyConfig.SecurityHeadersConfig;
      
      expect(securityConfig.StrictTransportSecurity).toBeDefined();
      expect(securityConfig.ContentTypeOptions).toBeDefined();
      expect(securityConfig.FrameOptions).toBeDefined();
      expect(securityConfig.ReferrerPolicy).toBeDefined();
      expect(securityConfig.ContentSecurityPolicy).toBeDefined();
    });

    test('should use encryption for S3 buckets', () => {
      const webAppBucket = template.Resources.WebAppS3Bucket;
      const loggingBucket = template.Resources.LoggingBucket;
      
      expect(webAppBucket.Properties.BucketEncryption).toBeDefined();
      expect(loggingBucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should restrict S3 bucket access via OAC', () => {
      const policy = template.Resources.WebAppS3BucketPolicy;
      const statement = policy.Properties.PolicyDocument.Statement[0];
      
      expect(statement.Principal.Service).toBe('cloudfront.amazonaws.com');
      expect(statement.Condition.StringEquals['AWS:SourceArn']).toBeDefined();
    });
  });
});
