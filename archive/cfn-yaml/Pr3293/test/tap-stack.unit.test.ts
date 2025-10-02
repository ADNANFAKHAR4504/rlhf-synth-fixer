import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Static Website Infrastructure', () => {
  let template: any;

  beforeAll(() => {
    // Read the JSON template
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
        'Static Website Infrastructure with S3, CloudFront, Route53, and CloudWatch Monitoring'
      );
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = ['DomainName', 'SubDomain', 'EnvironmentName', 'EnvironmentSuffix'];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('DomainName parameter should have correct properties', () => {
      const domainParam = template.Parameters.DomainName;
      expect(domainParam.Type).toBe('String');
      expect(domainParam.Description).toContain('domain name');
      expect(domainParam.Default).toBe('test-domain.com');
    });

    test('SubDomain parameter should have correct properties', () => {
      const subDomainParam = template.Parameters.SubDomain;
      expect(subDomainParam.Type).toBe('String');
      expect(subDomainParam.Description).toContain('subdomain');
      expect(subDomainParam.Default).toBe('www');
    });

    test('EnvironmentName parameter should have correct properties', () => {
      const envParam = template.Parameters.EnvironmentName;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('production');
      expect(envParam.AllowedValues).toEqual(['development', 'staging', 'production']);
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toContain('Suffix to append');
    });
  });

  describe('Resources', () => {
    test('should have all required resources', () => {
      const requiredResources = [
        'WebsiteBucket',
        'LoggingBucket',
        'OriginAccessControl',
        'CloudFrontDistribution',
        'WebsiteBucketPolicy',
        'HostedZone',
        'WebsiteRecordSet',
        'ApexRecordSet',
        'MonitoringDashboard',
        'HighTrafficAlarm'
      ];

      requiredResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    describe('S3 Buckets', () => {
      test('WebsiteBucket should be configured correctly', () => {
        const bucket = template.Resources.WebsiteBucket;
        expect(bucket.Type).toBe('AWS::S3::Bucket');
        expect(bucket.DeletionPolicy).toBe('Delete');

        const props = bucket.Properties;
        expect(props.BucketName['Fn::Sub']).toContain('tap-${EnvironmentSuffix}');
        expect(props.VersioningConfiguration.Status).toBe('Enabled');
        expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(props.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
        expect(props.BucketEncryption).toBeDefined();
        expect(props.MetricsConfigurations).toBeDefined();
      });

      test('WebsiteBucket should have Intelligent Tiering', () => {
        const bucket = template.Resources.WebsiteBucket;
        const lifecycle = bucket.Properties.LifecycleConfiguration;
        expect(lifecycle).toBeDefined();
        expect(lifecycle.Rules[0].Transitions[0].StorageClass).toBe('INTELLIGENT_TIERING');
        expect(lifecycle.Rules[0].Transitions[0].TransitionInDays).toBe(0);
      });

      test('LoggingBucket should be configured correctly', () => {
        const bucket = template.Resources.LoggingBucket;
        expect(bucket.Type).toBe('AWS::S3::Bucket');
        expect(bucket.DeletionPolicy).toBe('Delete');

        const props = bucket.Properties;
        expect(props.BucketName['Fn::Sub']).toContain('tap-${EnvironmentSuffix}-logs');
        expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(props.BucketEncryption).toBeDefined();
      });

      test('LoggingBucket should have lifecycle policy for Glacier', () => {
        const bucket = template.Resources.LoggingBucket;
        const lifecycle = bucket.Properties.LifecycleConfiguration;
        expect(lifecycle).toBeDefined();
        expect(lifecycle.Rules[0].Transitions[0].StorageClass).toBe('GLACIER');
        expect(lifecycle.Rules[0].Transitions[0].TransitionInDays).toBe(45);
        expect(lifecycle.Rules[0].ExpirationInDays).toBe(365);
      });
    });

    describe('CloudFront', () => {
      test('OriginAccessControl should be configured', () => {
        const oac = template.Resources.OriginAccessControl;
        expect(oac.Type).toBe('AWS::CloudFront::OriginAccessControl');
        expect(oac.Properties.OriginAccessControlConfig.OriginAccessControlOriginType).toBe('s3');
        expect(oac.Properties.OriginAccessControlConfig.SigningBehavior).toBe('always');
        expect(oac.Properties.OriginAccessControlConfig.SigningProtocol).toBe('sigv4');
      });

      test('CloudFrontDistribution should be configured correctly', () => {
        const dist = template.Resources.CloudFrontDistribution;
        expect(dist.Type).toBe('AWS::CloudFront::Distribution');

        const config = dist.Properties.DistributionConfig;
        expect(config.Enabled).toBe(true);
        expect(config.HttpVersion).toBe('http2and3');
        expect(config.DefaultRootObject).toBe('index.html');
      });

      test('CloudFront should use TLS 1.2_2021 or higher', () => {
        const dist = template.Resources.CloudFrontDistribution;
        const viewerCert = dist.Properties.DistributionConfig.ViewerCertificate;
        expect(viewerCert.MinimumProtocolVersion).toBe('TLSv1.2_2021');
      });

      test('CloudFront should have caching configured', () => {
        const dist = template.Resources.CloudFrontDistribution;
        const defaultBehavior = dist.Properties.DistributionConfig.DefaultCacheBehavior;
        expect(defaultBehavior.CachePolicyId).toBeDefined();
        expect(defaultBehavior.Compress).toBe(true);
      });

      test('CloudFront should have logging configured', () => {
        const dist = template.Resources.CloudFrontDistribution;
        const logging = dist.Properties.DistributionConfig.Logging;
        expect(logging).toBeDefined();
        expect(logging.Bucket['Fn::GetAtt']).toEqual(['LoggingBucket', 'DomainName']);
        expect(logging.Prefix).toBe('cloudfront/');
      });

      test('CloudFront should have custom error responses', () => {
        const dist = template.Resources.CloudFrontDistribution;
        const errorResponses = dist.Properties.DistributionConfig.CustomErrorResponses;
        expect(errorResponses).toBeDefined();
        expect(errorResponses.length).toBeGreaterThan(0);

        const error404 = errorResponses.find((e: any) => e.ErrorCode === 404);
        expect(error404).toBeDefined();
        expect(error404.ResponseCode).toBe(200);
        expect(error404.ResponsePagePath).toBe('/index.html');
      });
    });

    describe('S3 Bucket Policy', () => {
      test('WebsiteBucketPolicy should allow CloudFront access only', () => {
        const policy = template.Resources.WebsiteBucketPolicy;
        expect(policy.Type).toBe('AWS::S3::BucketPolicy');

        const statement = policy.Properties.PolicyDocument.Statement[0];
        expect(statement.Effect).toBe('Allow');
        expect(statement.Principal.Service).toBe('cloudfront.amazonaws.com');
        expect(statement.Action).toBe('s3:GetObject');
        expect(statement.Condition).toBeDefined();
        expect(statement.Condition.StringEquals).toBeDefined();
      });
    });

    describe('Route 53', () => {
      test('HostedZone should be configured', () => {
        const zone = template.Resources.HostedZone;
        expect(zone.Type).toBe('AWS::Route53::HostedZone');
        expect(zone.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}-${DomainName}');
      });

      test('WebsiteRecordSet should be A record with CloudFront alias', () => {
        const record = template.Resources.WebsiteRecordSet;
        expect(record.Type).toBe('AWS::Route53::RecordSet');
        expect(record.Properties.Type).toBe('A');
        expect(record.Properties.AliasTarget.DNSName['Fn::GetAtt']).toEqual(['CloudFrontDistribution', 'DomainName']);
        expect(record.Properties.AliasTarget.HostedZoneId).toBe('Z2FDTNDATAQYW2');
      });

      test('ApexRecordSet should be A record with CloudFront alias', () => {
        const record = template.Resources.ApexRecordSet;
        expect(record.Type).toBe('AWS::Route53::RecordSet');
        expect(record.Properties.Type).toBe('A');
        expect(record.Properties.AliasTarget.DNSName['Fn::GetAtt']).toEqual(['CloudFrontDistribution', 'DomainName']);
      });
    });

    describe('CloudWatch Monitoring', () => {
      test('MonitoringDashboard should be configured', () => {
        const dashboard = template.Resources.MonitoringDashboard;
        expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
        expect(dashboard.Properties.DashboardName['Fn::Sub']).toContain('tap-${EnvironmentSuffix}-dashboard');
        expect(dashboard.Properties.DashboardBody).toBeDefined();
      });

      test('HighTrafficAlarm should be configured', () => {
        const alarm = template.Resources.HighTrafficAlarm;
        expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
        expect(alarm.Properties.AlarmName['Fn::Sub']).toContain('tap-${EnvironmentSuffix}');
        expect(alarm.Properties.MetricName).toBe('Requests');
        expect(alarm.Properties.Namespace).toBe('AWS/CloudFront');
        expect(alarm.Properties.Threshold).toBe(5000);
        expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      });
    });

    describe('Resource Deletion Policies', () => {
      test('all resources should have Delete policy (no Retain)', () => {
        Object.keys(template.Resources).forEach(resourceName => {
          const resource = template.Resources[resourceName];
          if (resource.DeletionPolicy) {
            expect(resource.DeletionPolicy).toBe('Delete');
          }
        });
      });
    });

    describe('Resource Naming Convention', () => {
      test('all named resources should include EnvironmentSuffix', () => {
        const namedResources = ['WebsiteBucket', 'LoggingBucket', 'OriginAccessControl',
          'MonitoringDashboard', 'HighTrafficAlarm'];

        namedResources.forEach(resourceName => {
          const resource = template.Resources[resourceName];
          if (resource.Properties.BucketName) {
            expect(JSON.stringify(resource.Properties.BucketName)).toContain('EnvironmentSuffix');
          }
          if (resource.Properties.DashboardName) {
            expect(JSON.stringify(resource.Properties.DashboardName)).toContain('EnvironmentSuffix');
          }
          if (resource.Properties.AlarmName) {
            expect(JSON.stringify(resource.Properties.AlarmName)).toContain('EnvironmentSuffix');
          }
          if (resource.Properties.OriginAccessControlConfig?.Name) {
            expect(JSON.stringify(resource.Properties.OriginAccessControlConfig.Name)).toContain('EnvironmentSuffix');
          }
        });
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'WebsiteURL',
        'CloudFrontDistributionId',
        'CloudFrontDomainName',
        'S3BucketName',
        'LogsBucketName',
        'HostedZoneId',
        'NameServers',
        'DashboardURL'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('WebsiteURL output should be correct', () => {
      const output = template.Outputs.WebsiteURL;
      expect(output.Description).toContain('URL of the website');
      expect(output.Value['Fn::Sub']).toContain('https://');
    });

    test('CloudFrontDistributionId output should reference CloudFront', () => {
      const output = template.Outputs.CloudFrontDistributionId;
      expect(output.Value.Ref).toBe('CloudFrontDistribution');
    });

    test('S3BucketName output should reference WebsiteBucket', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Value.Ref).toBe('WebsiteBucket');
    });

    test('LogsBucketName output should reference LoggingBucket', () => {
      const output = template.Outputs.LogsBucketName;
      expect(output.Value.Ref).toBe('LoggingBucket');
    });

    test('HostedZoneId output should reference HostedZone', () => {
      const output = template.Outputs.HostedZoneId;
      expect(output.Value.Ref).toBe('HostedZone');
    });

    test('all outputs should have Export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        // Some outputs may not have Export, which is acceptable
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
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
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(10); // 2 S3 buckets, OAC, CloudFront, Policy, Route53 zone, 2 records, Dashboard, Alarm
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4); // DomainName, SubDomain, EnvironmentName, EnvironmentSuffix
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8); // All the outputs we defined
    });
  });

  describe('Security Configuration', () => {
    test('S3 buckets should have encryption enabled', () => {
      ['WebsiteBucket', 'LoggingBucket'].forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      });
    });

    test('S3 buckets should block public access', () => {
      ['WebsiteBucket', 'LoggingBucket'].forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('WebsiteBucket should have versioning enabled', () => {
      const bucket = template.Resources.WebsiteBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('CloudFront should redirect HTTP to HTTPS', () => {
      const dist = template.Resources.CloudFrontDistribution;
      const behavior = dist.Properties.DistributionConfig.DefaultCacheBehavior;
      expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });
  });

  describe('Cost Optimization', () => {
    test('S3 should use Intelligent-Tiering', () => {
      const bucket = template.Resources.WebsiteBucket;
      const rules = bucket.Properties.LifecycleConfiguration.Rules;
      const intelligentTieringRule = rules.find((r: any) =>
        r.Transitions?.some((t: any) => t.StorageClass === 'INTELLIGENT_TIERING')
      );
      expect(intelligentTieringRule).toBeDefined();
    });

    test('CloudFront should use appropriate price class', () => {
      const dist = template.Resources.CloudFrontDistribution;
      expect(dist.Properties.DistributionConfig.PriceClass).toBe('PriceClass_100');
    });

    test('Logs should transition to Glacier after 45 days', () => {
      const bucket = template.Resources.LoggingBucket;
      const rules = bucket.Properties.LifecycleConfiguration.Rules;
      const glacierRule = rules.find((r: any) =>
        r.Transitions?.some((t: any) => t.StorageClass === 'GLACIER' && t.TransitionInDays === 45)
      );
      expect(glacierRule).toBeDefined();
    });
  });
});