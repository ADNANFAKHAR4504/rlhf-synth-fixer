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
      expect(template.Description).toContain('Production-ready CloudFormation template');
    });

    test('should have metadata section with parameter interface', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterLabels).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      const requiredParams = ['DomainName', 'HostedZoneId', 'EnvironmentSuffix', 'CertificateArn'];
      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('prod');
      expect(envSuffixParam.MinLength).toBe(1);
      expect(envSuffixParam.MaxLength).toBe(20);
    });

    test('CertificateArn parameter should validate ACM ARN format', () => {
      const certParam = template.Parameters.CertificateArn;
      expect(certParam.AllowedPattern).toContain('arn:aws:acm:us-east-1');
    });
  });

  describe('Conditions', () => {
    test('should have required conditions for optional resources', () => {
      const requiredConditions = [
        'HasDomainName',
        'HasHostedZoneId',
        'HasCertificateArn',
        'CreateCertificate',
        'CreateDNSRecords',
        'UseCertificate'
      ];

      requiredConditions.forEach(condition => {
        expect(template.Conditions[condition]).toBeDefined();
      });
    });
  });

  describe('S3 Resources', () => {
    test('should have WebsiteBucket with proper security configuration', () => {
      const bucket = template.Resources.WebsiteBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const props = bucket.Properties;
      expect(props.PublicAccessBlockConfiguration).toBeDefined();
      expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(props.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(props.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(props.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('should have WebsiteBucket with encryption and versioning', () => {
      const bucket = template.Resources.WebsiteBucket;
      const props = bucket.Properties;

      expect(props.BucketEncryption).toBeDefined();
      expect(props.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(props.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have LogsBucket with lifecycle policies', () => {
      const logsBucket = template.Resources.LogsBucket;
      expect(logsBucket.Type).toBe('AWS::S3::Bucket');

      const props = logsBucket.Properties;
      expect(props.LifecycleConfiguration).toBeDefined();
      expect(props.LifecycleConfiguration.Rules).toHaveLength(2);

      const deleteRule = props.LifecycleConfiguration.Rules.find((rule: any) => rule.Id === 'DeleteOldLogs');
      expect(deleteRule.ExpirationInDays).toBe(90);

      const transitionRule = props.LifecycleConfiguration.Rules.find((rule: any) => rule.Id === 'TransitionToIA');
      expect(transitionRule.Transitions[0].TransitionInDays).toBe(30);
      expect(transitionRule.Transitions[0].StorageClass).toBe('STANDARD_IA');
    });

    test('should have proper bucket naming with environment suffix', () => {
      const websiteBucket = template.Resources.WebsiteBucket;
      const logsBucket = template.Resources.LogsBucket;

      expect(websiteBucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(logsBucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('CloudFront Resources', () => {
    test('should have CloudFront Origin Access Control', () => {
      const oac = template.Resources.CloudFrontOAC;
      expect(oac.Type).toBe('AWS::CloudFront::OriginAccessControl');

      const config = oac.Properties.OriginAccessControlConfig;
      expect(config.OriginAccessControlOriginType).toBe('s3');
      expect(config.SigningBehavior).toBe('always');
      expect(config.SigningProtocol).toBe('sigv4');
    });

    test('should have CloudFront Distribution with proper configuration', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution.Type).toBe('AWS::CloudFront::Distribution');

      const config = distribution.Properties.DistributionConfig;
      expect(config.Enabled).toBe(true);
      expect(config.HttpVersion).toBe('http2and3');
      expect(config.IPV6Enabled).toBe(true);
      expect(config.PriceClass).toBe('PriceClass_100');
      expect(config.DefaultRootObject).toBe('index.html');
    });

    test('should have proper caching behavior configuration', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const behavior = distribution.Properties.DistributionConfig.DefaultCacheBehavior;

      expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https');
      expect(behavior.Compress).toBe(true);
      expect(behavior.AllowedMethods).toContain('GET');
      expect(behavior.AllowedMethods).toContain('HEAD');
      expect(behavior.AllowedMethods).toContain('OPTIONS');
      expect(behavior.CachedMethods).toContain('GET');
      expect(behavior.CachedMethods).toContain('HEAD');
    });

    test('should have custom error responses configured', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const errorResponses = distribution.Properties.DistributionConfig.CustomErrorResponses;

      expect(errorResponses).toHaveLength(2);

      const error403 = errorResponses.find((resp: any) => resp.ErrorCode === 403);
      const error404 = errorResponses.find((resp: any) => resp.ErrorCode === 404);

      expect(error403.ResponseCode).toBe(404);
      expect(error403.ResponsePagePath).toBe('/404.html');
      expect(error404.ResponseCode).toBe(404);
      expect(error404.ResponsePagePath).toBe('/404.html');
    });
  });

  describe('ACM Certificate', () => {
    test('should have conditional ACM certificate with proper configuration', () => {
      const certificate = template.Resources.SSLCertificate;
      expect(certificate.Type).toBe('AWS::CertificateManager::Certificate');
      expect(certificate.Condition).toBe('CreateCertificate');

      const props = certificate.Properties;
      expect(props.ValidationMethod).toBe('DNS');
      expect(props.DomainValidationOptions).toBeDefined();
    });
  });

  describe('Route 53 Resources', () => {
    test('should have DNS records for both IPv4 and IPv6', () => {
      const ipv4Record = template.Resources.DNSRecordIPv4;
      const ipv6Record = template.Resources.DNSRecordIPv6;
      const wwwIpv4Record = template.Resources.WWWDNSRecordIPv4;
      const wwwIpv6Record = template.Resources.WWWDNSRecordIPv6;

      expect(ipv4Record.Type).toBe('AWS::Route53::RecordSet');
      expect(ipv4Record.Properties.Type).toBe('A');
      expect(ipv6Record.Type).toBe('AWS::Route53::RecordSet');
      expect(ipv6Record.Properties.Type).toBe('AAAA');
      expect(wwwIpv4Record.Type).toBe('AWS::Route53::RecordSet');
      expect(wwwIpv6Record.Type).toBe('AWS::Route53::RecordSet');
    });

    test('should have proper CloudFront alias target configuration', () => {
      const ipv4Record = template.Resources.DNSRecordIPv4;
      const aliasTarget = ipv4Record.Properties.AliasTarget;

      expect(aliasTarget.HostedZoneId).toBe('Z2FDTNDATAQYW2');
      expect(aliasTarget.EvaluateTargetHealth).toBe(false);
      expect(aliasTarget.DNSName['Fn::GetAtt']).toEqual(['CloudFrontDistribution', 'DomainName']);
    });
  });

  describe('IAM Resources', () => {
    test('should have CloudWatch monitoring role with proper policies', () => {
      const role = template.Resources.CloudWatchMonitoringRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');

      const statement = assumePolicy.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toContain('cloudwatch.amazonaws.com');
      expect(statement.Principal.Service).toContain('lambda.amazonaws.com');
    });

    test('should have monitoring policy with least-privilege permissions', () => {
      const role = template.Resources.CloudWatchMonitoringRole;
      const policy = role.Properties.Policies[0];

      expect(policy.PolicyDocument.Version).toBe('2012-10-17');

      const statements = policy.PolicyDocument.Statement;
      expect(statements.length).toBeGreaterThan(0);

      const cloudFrontStatement = statements.find((stmt: any) =>
        stmt.Action.some((action: any) => action.startsWith('cloudfront:'))
      );
      expect(cloudFrontStatement).toBeDefined();

      const s3Statement = statements.find((stmt: any) =>
        stmt.Action.some((action: any) => action.startsWith('s3:'))
      );
      expect(s3Statement).toBeDefined();
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have comprehensive CloudWatch alarms', () => {
      const expectedAlarms = [
        'CloudFront4xxErrorAlarm',
        'CloudFront5xxErrorAlarm',
        'CloudFrontCacheHitRateAlarm',
        'CloudFrontRequestCountAlarm',
        'CloudFrontOriginLatencyAlarm'
      ];

      expectedAlarms.forEach(alarmName => {
        expect(template.Resources[alarmName]).toBeDefined();
        expect(template.Resources[alarmName].Type).toBe('AWS::CloudWatch::Alarm');
      });
    });

    test('should have proper alarm thresholds and configurations', () => {
      const error4xxAlarm = template.Resources.CloudFront4xxErrorAlarm;
      const error5xxAlarm = template.Resources.CloudFront5xxErrorAlarm;
      const cacheHitAlarm = template.Resources.CloudFrontCacheHitRateAlarm;
      const requestAlarm = template.Resources.CloudFrontRequestCountAlarm;
      const latencyAlarm = template.Resources.CloudFrontOriginLatencyAlarm;

      expect(error4xxAlarm.Properties.Threshold).toBe(5);
      expect(error5xxAlarm.Properties.Threshold).toBe(1);
      expect(cacheHitAlarm.Properties.Threshold).toBe(70);
      expect(requestAlarm.Properties.Threshold).toBe(10000);
      expect(latencyAlarm.Properties.Threshold).toBe(1000);

      expect(error4xxAlarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(cacheHitAlarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('should have CloudWatch dashboard with comprehensive widgets', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');

      const dashboardBody = JSON.parse(dashboard.Properties.DashboardBody['Fn::Sub']);
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBe(6);

      const widgetTypes = dashboardBody.widgets.map((w: any) => w.type);
      expect(widgetTypes).toContain('metric');
      expect(widgetTypes).toContain('log');
    });
  });

  describe('S3 Bucket Policy', () => {
    test('should have secure bucket policy for CloudFront access', () => {
      const bucketPolicy = template.Resources.WebsiteBucketPolicy;
      expect(bucketPolicy.Type).toBe('AWS::S3::BucketPolicy');

      const statement = bucketPolicy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('cloudfront.amazonaws.com');
      expect(statement.Action).toBe('s3:GetObject');
      expect(statement.Condition.StringEquals['AWS:SourceArn']['Fn::Sub']).toContain('${CloudFrontDistribution}');
    });
  });

  describe('Outputs', () => {
    test('should have comprehensive outputs for operational use', () => {
      const expectedOutputs = [
        'CloudFrontDistributionURL',
        'CloudFrontDistributionId',
        'CloudFrontDistributionDomain',
        'WebsiteBucketName',
        'WebsiteBucketArn',
        'LogsBucketName',
        'CloudWatchDashboardURL',
        'WebsiteURL',
        'MonitoringRoleArn',
        'DeploymentCommand',
        'InvalidateCacheCommand',
        'StackRegion',
        'EnvironmentName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have conditional outputs for domain-specific resources', () => {
      const wwwOutput = template.Outputs.WWWWebsiteURL;
      const certOutput = template.Outputs.SSLCertificateArn;

      expect(wwwOutput.Condition).toBe('HasDomainName');
      expect(certOutput.Condition).toBe('CreateCertificate');
    });

    test('should have proper export names for cross-stack references', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
        }
      });
    });

    test('should have operational command outputs for deployment', () => {
      const deployCmd = template.Outputs.DeploymentCommand;
      const invalidateCmd = template.Outputs.InvalidateCacheCommand;

      expect(deployCmd.Value['Fn::Sub']).toContain('aws s3 sync');
      expect(deployCmd.Value['Fn::Sub']).toContain('${WebsiteBucket}');
      expect(invalidateCmd.Value['Fn::Sub']).toContain('aws cloudfront create-invalidation');
      expect(invalidateCmd.Value['Fn::Sub']).toContain('${CloudFrontDistribution}');
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

    test('should have proper resource count for secure web access layer', () => {
      const resourceTypes = Object.values(template.Resources).map((resource: any) => resource.Type);

      expect(resourceTypes).toContain('AWS::S3::Bucket');
      expect(resourceTypes).toContain('AWS::CloudFront::Distribution');
      expect(resourceTypes).toContain('AWS::CloudFront::OriginAccessControl');
      expect(resourceTypes).toContain('AWS::CertificateManager::Certificate');
      expect(resourceTypes).toContain('AWS::Route53::RecordSet');
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resourceTypes).toContain('AWS::CloudWatch::Alarm');
      expect(resourceTypes).toContain('AWS::CloudWatch::Dashboard');
      expect(resourceTypes).toContain('AWS::S3::BucketPolicy');
    });
  });

  describe('Resource Naming Convention', () => {
    test('should follow consistent naming convention with environment suffix', () => {
      const resourcesWithNaming = [
        'WebsiteBucket',
        'LogsBucket',
        'CloudFrontOAC',
        'CloudWatchMonitoringRole'
      ];

      resourcesWithNaming.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty = resource.Properties.BucketName ||
          resource.Properties.RoleName ||
          resource.Properties.OriginAccessControlConfig?.Name;

        if (nameProperty && nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('should have proper tags for resource management', () => {
      const taggedResources = [
        'WebsiteBucket',
        'LogsBucket',
        'CloudFrontDistribution',
        'CloudWatchMonitoringRole',
        'SSLCertificate'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          expect(tags.find((tag: any) => tag.Key === 'Environment')).toBeDefined();
          expect(tags.find((tag: any) => tag.Key === 'ManagedBy')).toBeDefined();
        }
      });
    });
  });
});
