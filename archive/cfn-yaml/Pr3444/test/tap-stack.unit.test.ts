import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON for testing
    execSync('node test/convert-templates.js', { cwd: path.join(__dirname, '..') });

    // Load main template
    const templatePath = path.join(__dirname, '../lib/TapStack.test.json');
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
        'Static Website Infrastructure with S3, CloudFront, Route53, CloudWatch, WAF, and Lambda@Edge'
      );
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have DomainName parameter', () => {
      expect(template.Parameters.DomainName).toBeDefined();
      expect(template.Parameters.DomainName.Type).toBe('String');
      expect(template.Parameters.DomainName.Default).toBe('example.com');
      expect(template.Parameters.DomainName.Description).toContain('Domain name');
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
      expect(template.Parameters.EnvironmentSuffix.Description).toContain('Environment suffix');
    });

    test('should have WebACLArn parameter for WAF integration', () => {
      expect(template.Parameters.WebACLArn).toBeDefined();
      expect(template.Parameters.WebACLArn.Type).toBe('String');
      expect(template.Parameters.WebACLArn.Description).toContain('WAF WebACL');
    });

    test('should have SecurityHeadersFunctionArn parameter', () => {
      expect(template.Parameters.SecurityHeadersFunctionArn).toBeDefined();
      expect(template.Parameters.SecurityHeadersFunctionArn.Type).toBe('String');
      expect(template.Parameters.SecurityHeadersFunctionArn.Description).toContain('Lambda@Edge Security Headers');
    });

    test('should have CustomHeadersFunctionArn parameter', () => {
      expect(template.Parameters.CustomHeadersFunctionArn).toBeDefined();
      expect(template.Parameters.CustomHeadersFunctionArn.Type).toBe('String');
      expect(template.Parameters.CustomHeadersFunctionArn.Description).toContain('Lambda@Edge Custom Headers');
    });
  });

  describe('S3 Resources', () => {
    test('should have WebsiteBucket resource', () => {
      expect(template.Resources.WebsiteBucket).toBeDefined();
      expect(template.Resources.WebsiteBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('WebsiteBucket should have correct properties', () => {
      const bucket = template.Resources.WebsiteBucket.Properties;

      // Check bucket name includes environment suffix
      expect(bucket.BucketName).toBeDefined();
      expect(bucket.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');

      // Check website configuration
      expect(bucket.WebsiteConfiguration).toBeDefined();
      expect(bucket.WebsiteConfiguration.IndexDocument).toBe('index.html');
      expect(bucket.WebsiteConfiguration.ErrorDocument).toBe('error.html');

      // Check public access is configured correctly for website
      expect(bucket.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(false);
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(false);

      // Check metrics configuration
      expect(bucket.MetricsConfigurations).toBeDefined();
      expect(bucket.MetricsConfigurations).toHaveLength(1);
      expect(bucket.MetricsConfigurations[0].Id).toBe('EntireBucket');
    });

    test('should have LogsBucket resource', () => {
      expect(template.Resources.LogsBucket).toBeDefined();
      expect(template.Resources.LogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('LogsBucket should have correct properties', () => {
      const bucket = template.Resources.LogsBucket.Properties;

      // Check bucket name includes environment suffix
      expect(bucket.BucketName).toBeDefined();
      expect(bucket.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');

      // Check lifecycle configuration for 30-day deletion
      expect(bucket.LifecycleConfiguration).toBeDefined();
      expect(bucket.LifecycleConfiguration.Rules).toHaveLength(1);
      expect(bucket.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(30);
      expect(bucket.LifecycleConfiguration.Rules[0].Status).toBe('Enabled');

      // Check ownership controls
      expect(bucket.OwnershipControls).toBeDefined();
    });

    test('should have LogsBucketPolicy resource with correct permissions', () => {
      const policy = template.Resources.LogsBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');

      // Check that the policy grants permissions to logging service
      const statements = policy.Properties.PolicyDocument.Statement;
      expect(statements).toBeDefined();
      expect(statements.length).toBeGreaterThan(0);

      // Verify write permission exists
      const writeStatement = statements.find((s: any) => s.Sid === 'AWSLogDeliveryWrite');
      expect(writeStatement).toBeDefined();
      expect(writeStatement.Principal.Service).toBe('logging.s3.amazonaws.com');
    });

    test('should have WebsiteBucketPolicy resource', () => {
      expect(template.Resources.WebsiteBucketPolicy).toBeDefined();
      expect(template.Resources.WebsiteBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('WebsiteBucketPolicy should allow CloudFront OAI and public read', () => {
      const policy = template.Resources.WebsiteBucketPolicy.Properties;
      expect(policy.Bucket.Ref).toBe('WebsiteBucket');
      expect(policy.PolicyDocument.Statement).toBeDefined();
      expect(policy.PolicyDocument.Statement.length).toBeGreaterThanOrEqual(2);

      // Check for OAI access statement
      const oaiStatement = policy.PolicyDocument.Statement.find(
        (s: any) => s.Sid === 'AllowCloudFrontOAIRead'
      );
      expect(oaiStatement).toBeDefined();
      expect(oaiStatement.Effect).toBe('Allow');
      expect(oaiStatement.Action).toBe('s3:GetObject');

      // Check for public read statement
      const publicStatement = policy.PolicyDocument.Statement.find(
        (s: any) => s.Sid === 'AllowPublicRead'
      );
      expect(publicStatement).toBeDefined();
      expect(publicStatement.Effect).toBe('Allow');
      expect(publicStatement.Principal).toBe('*');
    });
  });

  describe('CloudFront Resources', () => {
    test('should have OriginAccessIdentity resource', () => {
      expect(template.Resources.OriginAccessIdentity).toBeDefined();
      expect(template.Resources.OriginAccessIdentity.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
    });

    test('should have CloudFrontDistribution resource', () => {
      expect(template.Resources.CloudFrontDistribution).toBeDefined();
      expect(template.Resources.CloudFrontDistribution.Type).toBe('AWS::CloudFront::Distribution');
    });

    test('CloudFrontDistribution should have correct configuration', () => {
      const distribution = template.Resources.CloudFrontDistribution.Properties.DistributionConfig;

      // Check origins configuration
      expect(distribution.Origins).toBeDefined();
      expect(distribution.Origins).toHaveLength(1);
      expect(distribution.Origins[0].Id).toBe('S3Origin');
      expect(distribution.Origins[0].S3OriginConfig).toBeDefined();
      expect(distribution.Origins[0].S3OriginConfig.OriginAccessIdentity).toBeDefined();

      // Check default cache behavior
      expect(distribution.DefaultCacheBehavior).toBeDefined();
      expect(distribution.DefaultCacheBehavior.TargetOriginId).toBe('S3Origin');
      expect(distribution.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
      expect(distribution.DefaultCacheBehavior.Compress).toBe(true);

      // Check SSL/TLS configuration
      expect(distribution.ViewerCertificate).toBeDefined();
      expect(distribution.ViewerCertificate.MinimumProtocolVersion).toBe('TLSv1.2_2021');
      expect(distribution.ViewerCertificate.CloudFrontDefaultCertificate).toBe(true);

      // Check logging configuration
      expect(distribution.Logging).toBeDefined();
      expect(distribution.Logging.Prefix).toBe('cloudfront-logs/');
      expect(distribution.Logging.IncludeCookies).toBe(false);

      // Check price class for cost optimization
      expect(distribution.PriceClass).toBe('PriceClass_100');

      // Check custom error responses
      expect(distribution.CustomErrorResponses).toBeDefined();
      expect(distribution.CustomErrorResponses).toHaveLength(1);
      expect(distribution.CustomErrorResponses[0].ErrorCode).toBe(404);
      expect(distribution.CustomErrorResponses[0].ResponsePagePath).toBe('/error.html');
    });

    test('CloudFrontDistribution should have tags', () => {
      const distribution = template.Resources.CloudFrontDistribution.Properties;
      expect(distribution.Tags).toBeDefined();
      expect(distribution.Tags).toHaveLength(1);
      expect(distribution.Tags[0].Key).toBe('Environment');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have CloudWatchDashboard resource', () => {
      expect(template.Resources.CloudWatchDashboard).toBeDefined();
      expect(template.Resources.CloudWatchDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('CloudWatchDashboard should have correct properties', () => {
      const dashboard = template.Resources.CloudWatchDashboard.Properties;

      // Check dashboard name includes environment suffix
      expect(dashboard.DashboardName).toBeDefined();
      expect(dashboard.DashboardName['Fn::Sub']).toContain('${EnvironmentSuffix}');

      // Check dashboard body exists
      expect(dashboard.DashboardBody).toBeDefined();
      expect(dashboard.DashboardBody['Fn::Sub']).toBeDefined();

      // Parse dashboard body to verify widgets
      const bodyTemplate = dashboard.DashboardBody['Fn::Sub'];
      expect(bodyTemplate).toContain('CloudFront Metrics');
      expect(bodyTemplate).toContain('S3 Storage Metrics');
      expect(bodyTemplate).toContain('S3 Request Metrics');
      expect(bodyTemplate).toContain('AWS/CloudFront');
      expect(bodyTemplate).toContain('AWS/S3');
      expect(bodyTemplate).toContain('CacheHitRate');
      expect(bodyTemplate).toContain('AllRequests');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'WebsiteBucketName',
        'CloudFrontDistributionId',
        'CloudFrontDomainName',
        'WebsiteURL',
        'LogsBucketName',
        'DashboardURL'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('WebsiteBucketName output should be correct', () => {
      const output = template.Outputs.WebsiteBucketName;
      expect(output.Description).toContain('S3 bucket hosting the website');
      expect(output.Value.Ref).toBe('WebsiteBucket');
      expect(output.Export).toBeDefined();
    });

    test('CloudFrontDistributionId output should be correct', () => {
      const output = template.Outputs.CloudFrontDistributionId;
      expect(output.Description).toContain('CloudFront Distribution ID');
      expect(output.Value.Ref).toBe('CloudFrontDistribution');
      expect(output.Export).toBeDefined();
    });

    test('CloudFrontDomainName output should be correct', () => {
      const output = template.Outputs.CloudFrontDomainName;
      expect(output.Description).toContain('CloudFront Distribution Domain Name');
      expect(output.Value['Fn::GetAtt']).toEqual(['CloudFrontDistribution', 'DomainName']);
      expect(output.Export).toBeDefined();
    });

    test('WebsiteURL output should be correct', () => {
      const output = template.Outputs.WebsiteURL;
      expect(output.Description).toContain('Website URL');
      expect(output.Value['Fn::Sub']).toContain('https://');
      expect(output.Export).toBeDefined();
    });

    test('LogsBucketName output should be correct', () => {
      const output = template.Outputs.LogsBucketName;
      expect(output.Description).toContain('S3 bucket for logs');
      expect(output.Value.Ref).toBe('LogsBucket');
      expect(output.Export).toBeDefined();
    });

    test('DashboardURL output should be correct', () => {
      const output = template.Outputs.DashboardURL;
      expect(output.Description).toContain('CloudWatch Dashboard URL');
      expect(output.Value['Fn::Sub']).toContain('cloudwatch');
      expect(output.Value['Fn::Sub']).toContain('dashboards');
    });

    test('most outputs should have export names', () => {
      // DashboardURL doesn't need an export, but all others should have it
      const outputsNeedingExport = ['WebsiteBucketName', 'CloudFrontDistributionId', 'CloudFrontDomainName', 'WebsiteURL', 'LogsBucketName'];

      outputsNeedingExport.forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });

      // DashboardURL should not have export as it's just a console link
      expect(template.Outputs.DashboardURL).toBeDefined();
      expect(template.Outputs.DashboardURL.Export).toBeUndefined();
    });
  });

  describe('Resource Naming Convention', () => {
    test('all S3 buckets should include environment suffix in name', () => {
      const buckets = ['WebsiteBucket', 'LogsBucket'];
      buckets.forEach(bucketName => {
        if (template.Resources[bucketName]) {
          const bucket = template.Resources[bucketName].Properties;
          expect(bucket.BucketName).toBeDefined();
          expect(bucket.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('dashboard should include environment suffix in name', () => {
      const dashboard = template.Resources.CloudWatchDashboard.Properties;
      expect(dashboard.DashboardName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Security and Best Practices', () => {
    test('CloudFront should enforce HTTPS', () => {
      const distribution = template.Resources.CloudFrontDistribution.Properties.DistributionConfig;
      expect(distribution.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('CloudFront should use TLS 1.2 minimum', () => {
      const distribution = template.Resources.CloudFrontDistribution.Properties.DistributionConfig;
      expect(distribution.ViewerCertificate.MinimumProtocolVersion).toBe('TLSv1.2_2021');
    });

    test('logs bucket should have restricted public access', () => {
      const bucket = template.Resources.LogsBucket.Properties;
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('CloudFront should use Origin Access Identity', () => {
      expect(template.Resources.OriginAccessIdentity).toBeDefined();
      const distribution = template.Resources.CloudFrontDistribution.Properties.DistributionConfig;
      expect(distribution.Origins[0].S3OriginConfig.OriginAccessIdentity).toBeDefined();
    });

    test('logs should have lifecycle policy for cost optimization', () => {
      const bucket = template.Resources.LogsBucket.Properties;
      expect(bucket.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(30);
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

    test('should have correct number of resources', () => {
      const expectedResources = [
        'WebsiteBucket',
        'LogsBucket',
        'LogsBucketPolicy',
        'WebsiteBucketPolicy',
        'OriginAccessIdentity',
        'CloudFrontDistribution',
        'CloudWatchDashboard'
      ];

      expect(Object.keys(template.Resources).length).toBe(expectedResources.length);

      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have correct number of parameters', () => {
      const expectedParams = ['DomainName', 'EnvironmentSuffix', 'WebACLArn', 'SecurityHeadersFunctionArn', 'CustomHeadersFunctionArn'];
      expect(Object.keys(template.Parameters).length).toBe(expectedParams.length);

      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });
  });

  describe('Conditions', () => {
    test('should have HasWebACL condition', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.HasWebACL).toBeDefined();
    });

    test('should have HasLambdaFunctions condition', () => {
      expect(template.Conditions.HasLambdaFunctions).toBeDefined();
    });
  });

  describe('WAF and Lambda@Edge Outputs', () => {
    test('should have WebACLArn output', () => {
      const output = template.Outputs.WebACLArn;
      expect(output).toBeDefined();
      expect(output.Description).toContain('WAF WebACL');
    });

    test('should have SecurityHeadersFunctionArn output', () => {
      const output = template.Outputs.SecurityHeadersFunctionArn;
      expect(output).toBeDefined();
      expect(output.Description).toContain('Lambda@Edge Security Headers');
    });

    test('should have CustomHeadersFunctionArn output', () => {
      const output = template.Outputs.CustomHeadersFunctionArn;
      expect(output).toBeDefined();
      expect(output.Description).toContain('Lambda@Edge Custom Headers');
    });
  });
});

describe('TapStackGlobal CloudFormation Template', () => {
  let globalTemplate: any;

  beforeAll(() => {
    const globalTemplatePath = path.join(__dirname, '../lib/TapStackGlobal.test.json');
    if (fs.existsSync(globalTemplatePath)) {
      const globalTemplateContent = fs.readFileSync(globalTemplatePath, 'utf8');
      globalTemplate = JSON.parse(globalTemplateContent);
    }
  });

  describe('Global Template Structure', () => {
    test('global template should exist', () => {
      expect(globalTemplate).toBeDefined();
    });

    test('should have valid CloudFormation format version', () => {
      expect(globalTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description for global resources', () => {
      expect(globalTemplate.Description).toBeDefined();
      expect(globalTemplate.Description).toContain('Global Resources');
      expect(globalTemplate.Description).toContain('us-east-1');
    });
  });

  describe('Lambda@Edge Resources', () => {
    test('should have LambdaEdgeRole', () => {
      expect(globalTemplate.Resources.LambdaEdgeRole).toBeDefined();
      expect(globalTemplate.Resources.LambdaEdgeRole.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaEdgeRole should have correct trust policy', () => {
      const role = globalTemplate.Resources.LambdaEdgeRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toContain('lambda.amazonaws.com');
      expect(trustPolicy.Statement[0].Principal.Service).toContain('edgelambda.amazonaws.com');
    });

    test('should have SecurityHeadersFunction', () => {
      expect(globalTemplate.Resources.SecurityHeadersFunction).toBeDefined();
      expect(globalTemplate.Resources.SecurityHeadersFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('SecurityHeadersFunction should have correct configuration', () => {
      const func = globalTemplate.Resources.SecurityHeadersFunction.Properties;
      expect(func.Runtime).toBe('nodejs18.x');
      expect(func.Handler).toBe('index.handler');
      expect(func.Timeout).toBe(5);
      expect(func.MemorySize).toBe(128);
    });

    test('should have CustomHeadersFunction', () => {
      expect(globalTemplate.Resources.CustomHeadersFunction).toBeDefined();
      expect(globalTemplate.Resources.CustomHeadersFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have Lambda function versions', () => {
      expect(globalTemplate.Resources.SecurityHeadersFunctionVersion).toBeDefined();
      expect(globalTemplate.Resources.CustomHeadersFunctionVersion).toBeDefined();
    });
  });

  describe('WAF Resources', () => {
    test('should have WebACL resource', () => {
      expect(globalTemplate.Resources.WebACL).toBeDefined();
      expect(globalTemplate.Resources.WebACL.Type).toBe('AWS::WAFv2::WebACL');
    });

    test('WebACL should have CLOUDFRONT scope', () => {
      const webacl = globalTemplate.Resources.WebACL.Properties;
      expect(webacl.Scope).toBe('CLOUDFRONT');
    });

    test('WebACL should have rate limiting rule', () => {
      const webacl = globalTemplate.Resources.WebACL.Properties;
      const rateLimitRule = webacl.Rules.find((r: any) => r.Name === 'RateLimitRule');
      expect(rateLimitRule).toBeDefined();
      expect(rateLimitRule.Statement.RateBasedStatement.Limit).toBe(2000);
      expect(rateLimitRule.Statement.RateBasedStatement.AggregateKeyType).toBe('IP');
    });

    test('WebACL should have AWS managed rule sets', () => {
      const webacl = globalTemplate.Resources.WebACL.Properties;
      const managedRules = ['AWSManagedRulesCommonRuleSet', 'AWSManagedRulesKnownBadInputsRuleSet', 'AWSManagedRulesSQLiRuleSet'];

      managedRules.forEach(ruleName => {
        const rule = webacl.Rules.find((r: any) => r.Name === ruleName);
        expect(rule).toBeDefined();
        expect(rule.Statement.ManagedRuleGroupStatement.VendorName).toBe('AWS');
      });
    });

    test('WebACL should have CloudWatch metrics enabled', () => {
      const webacl = globalTemplate.Resources.WebACL.Properties;
      expect(webacl.VisibilityConfig.CloudWatchMetricsEnabled).toBe(true);
      expect(webacl.VisibilityConfig.SampledRequestsEnabled).toBe(true);
    });
  });

  describe('Global Template Outputs', () => {
    test('should have WebACLArn output', () => {
      expect(globalTemplate.Outputs.WebACLArn).toBeDefined();
      expect(globalTemplate.Outputs.WebACLArn.Value['Fn::GetAtt']).toEqual(['WebACL', 'Arn']);
    });

    test('should have Lambda function ARN outputs', () => {
      expect(globalTemplate.Outputs.SecurityHeadersFunctionArn).toBeDefined();
      expect(globalTemplate.Outputs.CustomHeadersFunctionArn).toBeDefined();
    });

    test('all outputs should have export names', () => {
      Object.keys(globalTemplate.Outputs).forEach(outputKey => {
        const output = globalTemplate.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });
});