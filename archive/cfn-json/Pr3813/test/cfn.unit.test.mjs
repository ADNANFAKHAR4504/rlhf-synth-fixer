const { describe, test, expect, beforeAll } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

describe('CloudFormation Template Validation', () => {
  let template;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Video streaming');
    });

    test('should have parameters defined', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have resources defined', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have outputs defined', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.Default).toBe('production');
    });

    test('should have NotificationEmail parameter', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
      expect(template.Parameters.NotificationEmail.Type).toBe('String');
      expect(template.Parameters.NotificationEmail.Default).toBe('admin@example.com');
    });
  });

  describe('S3 Resources', () => {
    test('should have VideoStorageBucket resource', () => {
      const bucket = template.Resources.VideoStorageBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('VideoStorageBucket should have Transfer Acceleration enabled', () => {
      const bucket = template.Resources.VideoStorageBucket;
      expect(bucket.Properties.AccelerateConfiguration).toBeDefined();
      expect(bucket.Properties.AccelerateConfiguration.AccelerationStatus).toBe('Enabled');
    });

    test('VideoStorageBucket should have Intelligent-Tiering configured', () => {
      const bucket = template.Resources.VideoStorageBucket;
      expect(bucket.Properties.IntelligentTieringConfigurations).toBeDefined();
      expect(bucket.Properties.IntelligentTieringConfigurations.length).toBeGreaterThan(0);

      const tieringConfig = bucket.Properties.IntelligentTieringConfigurations[0];
      expect(tieringConfig.Status).toBe('Enabled');
      expect(tieringConfig.Tierings).toBeDefined();
    });

    test('VideoStorageBucket should have lifecycle rules', () => {
      const bucket = template.Resources.VideoStorageBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();

      const rules = bucket.Properties.LifecycleConfiguration.Rules;
      expect(rules.length).toBeGreaterThan(0);

      const deepArchiveRule = rules.find(rule => rule.Id === 'TransitionToDeepArchive');
      expect(deepArchiveRule).toBeDefined();
      expect(deepArchiveRule.Status).toBe('Enabled');
      expect(deepArchiveRule.Transitions[0].TransitionInDays).toBe(365);
      expect(deepArchiveRule.Transitions[0].StorageClass).toBe('DEEP_ARCHIVE');
    });

    test('VideoStorageBucket should have S3 Inventory configured', () => {
      const bucket = template.Resources.VideoStorageBucket;
      expect(bucket.Properties.InventoryConfigurations).toBeDefined();
      expect(bucket.Properties.InventoryConfigurations.length).toBeGreaterThan(0);

      const inventoryConfig = bucket.Properties.InventoryConfigurations[0];
      expect(inventoryConfig.Enabled).toBe(true);
      expect(inventoryConfig.ScheduleFrequency).toBe('Weekly');
      expect(inventoryConfig.OptionalFields).toContain('IntelligentTieringAccessTier');
    });

    test('VideoStorageBucket should have versioning enabled', () => {
      const bucket = template.Resources.VideoStorageBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('VideoStorageBucket should have encryption enabled', () => {
      const bucket = template.Resources.VideoStorageBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('VideoStorageBucket should block public access', () => {
      const bucket = template.Resources.VideoStorageBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('VideoStorageBucket should have proper tags', () => {
      const bucket = template.Resources.VideoStorageBucket;
      expect(bucket.Properties.Tags).toBeDefined();
      expect(bucket.Properties.Tags.length).toBeGreaterThan(0);

      const environmentSuffixTag = bucket.Properties.Tags.find(tag => tag.Key === 'EnvironmentSuffix');
      expect(environmentSuffixTag).toBeDefined();
    });

    test('should have InventoryBucket resource', () => {
      const bucket = template.Resources.InventoryBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('InventoryBucket should have lifecycle rules for cleanup', () => {
      const bucket = template.Resources.InventoryBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();

      const deleteRule = bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(deleteRule.Status).toBe('Enabled');
      expect(deleteRule.ExpirationInDays).toBe(90);
    });

    test('should have InventoryBucketPolicy resource', () => {
      const policy = template.Resources.InventoryBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.PolicyDocument.Statement).toBeDefined();

      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('s3.amazonaws.com');
      expect(statement.Action).toBe('s3:PutObject');
    });

    test('should have VideoStorageBucketPolicy resource', () => {
      const policy = template.Resources.VideoStorageBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');

      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('cloudfront.amazonaws.com');
      expect(statement.Action).toBe('s3:GetObject');
    });
  });

  describe('CloudFront Resources', () => {
    test('should have CloudFrontOriginAccessControl resource', () => {
      const oac = template.Resources.CloudFrontOriginAccessControl;
      expect(oac).toBeDefined();
      expect(oac.Type).toBe('AWS::CloudFront::OriginAccessControl');
      expect(oac.Properties.OriginAccessControlConfig.OriginAccessControlOriginType).toBe('s3');
      expect(oac.Properties.OriginAccessControlConfig.SigningBehavior).toBe('always');
      expect(oac.Properties.OriginAccessControlConfig.SigningProtocol).toBe('sigv4');
    });

    test('should have CloudFrontDistribution resource', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution).toBeDefined();
      expect(distribution.Type).toBe('AWS::CloudFront::Distribution');
    });

    test('CloudFrontDistribution should be enabled', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution.Properties.DistributionConfig.Enabled).toBe(true);
    });

    test('CloudFrontDistribution should use http2and3', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution.Properties.DistributionConfig.HttpVersion).toBe('http2and3');
    });

    test('CloudFrontDistribution should have S3 origin configured', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution.Properties.DistributionConfig.Origins).toBeDefined();
      expect(distribution.Properties.DistributionConfig.Origins.length).toBeGreaterThan(0);

      const origin = distribution.Properties.DistributionConfig.Origins[0];
      expect(origin.Id).toBe('S3VideoOrigin');
      expect(origin.S3OriginConfig).toBeDefined();
    });

    test('CloudFrontDistribution should have default cache behavior', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const cacheBehavior = distribution.Properties.DistributionConfig.DefaultCacheBehavior;

      expect(cacheBehavior).toBeDefined();
      expect(cacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
      expect(cacheBehavior.Compress).toBe(true);
      expect(cacheBehavior.AllowedMethods).toContain('GET');
      expect(cacheBehavior.AllowedMethods).toContain('HEAD');
    });
  });

  describe('IAM Resources', () => {
    test('should have VideoUploadRole resource', () => {
      const role = template.Resources.VideoUploadRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('VideoUploadRole should allow EC2 to assume the role', () => {
      const role = template.Resources.VideoUploadRole;
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];

      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('ec2.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('should have VideoUploadPolicy resource', () => {
      const policy = template.Resources.VideoUploadPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::IAM::Policy');
    });

    test('VideoUploadPolicy should allow upload operations', () => {
      const policy = template.Resources.VideoUploadPolicy;
      const uploadStatement = policy.Properties.PolicyDocument.Statement.find(
        s => s.Sid === 'AllowVideoUpload'
      );

      expect(uploadStatement).toBeDefined();
      expect(uploadStatement.Effect).toBe('Allow');
      expect(uploadStatement.Action).toContain('s3:PutObject');
      expect(uploadStatement.Action).toContain('s3:PutObjectAcl');
    });

    test('VideoUploadPolicy should deny delete operations', () => {
      const policy = template.Resources.VideoUploadPolicy;
      const denyStatement = policy.Properties.PolicyDocument.Statement.find(
        s => s.Sid === 'DenyDelete'
      );

      expect(denyStatement).toBeDefined();
      expect(denyStatement.Effect).toBe('Deny');
      expect(denyStatement.Action).toContain('s3:DeleteObject');
      expect(denyStatement.Action).toContain('s3:DeleteObjectVersion');
      expect(denyStatement.Action).toContain('s3:DeleteBucket');
    });

    test('VideoUploadPolicy should allow bucket listing', () => {
      const policy = template.Resources.VideoUploadPolicy;
      const listStatement = policy.Properties.PolicyDocument.Statement.find(
        s => s.Sid === 'AllowListBucket'
      );

      expect(listStatement).toBeDefined();
      expect(listStatement.Effect).toBe('Allow');
      expect(listStatement.Action).toContain('s3:ListBucket');
      expect(listStatement.Action).toContain('s3:GetBucketLocation');
    });
  });

  describe('Monitoring Resources', () => {
    test('should have SNSTopic resource', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.Subscription).toBeDefined();
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
    });

    test('should have BucketSizeAlarm resource', () => {
      const alarm = template.Resources.BucketSizeAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('BucketSizeBytes');
      expect(alarm.Properties.Namespace).toBe('AWS/S3');
    });

    test('BucketSizeAlarm should have proper configuration', () => {
      const alarm = template.Resources.BucketSizeAlarm;
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.Threshold).toBe(1099511627776);
      expect(alarm.Properties.Period).toBe(86400);
      expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
    });

    test('should have ObjectCountAlarm resource', () => {
      const alarm = template.Resources.ObjectCountAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('NumberOfObjects');
      expect(alarm.Properties.Namespace).toBe('AWS/S3');
    });

    test('ObjectCountAlarm should have proper configuration', () => {
      const alarm = template.Resources.ObjectCountAlarm;
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.Threshold).toBe(100000);
      expect(alarm.Properties.Statistic).toBe('Average');
    });

    test('should have CloudWatchLogGroup resource', () => {
      const logGroup = template.Resources.CloudWatchLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have CloudWatchDashboard resource', () => {
      const dashboard = template.Resources.CloudWatchDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(dashboard.Properties.DashboardBody).toBeDefined();
    });

    test('CloudWatchDashboard should include S3 and CloudFront metrics', () => {
      const dashboard = template.Resources.CloudWatchDashboard;
      const dashboardBodyTemplate = dashboard.Properties.DashboardBody['Fn::Sub'][0];

      expect(dashboardBodyTemplate).toContain('BucketSizeBytes');
      expect(dashboardBodyTemplate).toContain('NumberOfObjects');
      expect(dashboardBodyTemplate).toContain('CloudFront');
      expect(dashboardBodyTemplate).toContain('Requests');
      expect(dashboardBodyTemplate).toContain('BytesDownloaded');
    });
  });

  describe('Resource Naming with EnvironmentSuffix', () => {
    test('VideoStorageBucket name should include EnvironmentSuffix', () => {
      const bucket = template.Resources.VideoStorageBucket;
      const bucketName = bucket.Properties.BucketName['Fn::Sub'];
      expect(bucketName).toContain('${EnvironmentSuffix}');
    });

    test('InventoryBucket name should include EnvironmentSuffix', () => {
      const bucket = template.Resources.InventoryBucket;
      const bucketName = bucket.Properties.BucketName['Fn::Sub'];
      expect(bucketName).toContain('${EnvironmentSuffix}');
    });

    test('VideoUploadRole name should include EnvironmentSuffix', () => {
      const role = template.Resources.VideoUploadRole;
      const roleName = role.Properties.RoleName['Fn::Sub'];
      expect(roleName).toContain('${EnvironmentSuffix}');
    });

    test('VideoUploadPolicy name should include EnvironmentSuffix', () => {
      const policy = template.Resources.VideoUploadPolicy;
      const policyName = policy.Properties.PolicyName['Fn::Sub'];
      expect(policyName).toContain('${EnvironmentSuffix}');
    });

    test('SNSTopic name should include EnvironmentSuffix', () => {
      const topic = template.Resources.SNSTopic;
      const topicName = topic.Properties.TopicName['Fn::Sub'];
      expect(topicName).toContain('${EnvironmentSuffix}');
    });

    test('CloudWatch alarms should include EnvironmentSuffix', () => {
      const bucketSizeAlarm = template.Resources.BucketSizeAlarm;
      const objectCountAlarm = template.Resources.ObjectCountAlarm;

      expect(bucketSizeAlarm.Properties.AlarmName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(objectCountAlarm.Properties.AlarmName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('CloudWatchLogGroup name should include EnvironmentSuffix', () => {
      const logGroup = template.Resources.CloudWatchLogGroup;
      const logGroupName = logGroup.Properties.LogGroupName['Fn::Sub'];
      expect(logGroupName).toContain('${EnvironmentSuffix}');
    });

    test('CloudWatchDashboard name should include EnvironmentSuffix', () => {
      const dashboard = template.Resources.CloudWatchDashboard;
      const dashboardName = dashboard.Properties.DashboardName['Fn::Sub'];
      expect(dashboardName).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Outputs', () => {
    test('should have VideoStorageBucketName output', () => {
      const output = template.Outputs.VideoStorageBucketName;
      expect(output).toBeDefined();
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
      expect(output.Export).toBeDefined();
    });

    test('should have VideoStorageBucketArn output', () => {
      const output = template.Outputs.VideoStorageBucketArn;
      expect(output).toBeDefined();
      expect(output.Description).toContain('ARN');
    });

    test('should have CloudFrontDistributionId output', () => {
      const output = template.Outputs.CloudFrontDistributionId;
      expect(output).toBeDefined();
      expect(output.Description).toContain('CloudFront');
    });

    test('should have CloudFrontDistributionDomain output', () => {
      const output = template.Outputs.CloudFrontDistributionDomain;
      expect(output).toBeDefined();
      expect(output.Description).toContain('domain');
      expect(output.Export).toBeDefined();
    });

    test('should have TransferAccelerationEndpoint output', () => {
      const output = template.Outputs.TransferAccelerationEndpoint;
      expect(output).toBeDefined();
      expect(output.Description).toContain('Transfer Acceleration');
      expect(output.Value['Fn::Sub']).toContain('s3-accelerate');
    });

    test('should have VideoUploadRoleArn output', () => {
      const output = template.Outputs.VideoUploadRoleArn;
      expect(output).toBeDefined();
      expect(output.Description).toContain('IAM role');
    });

    test('should have InventoryBucketName output', () => {
      const output = template.Outputs.InventoryBucketName;
      expect(output).toBeDefined();
      expect(output.Description).toContain('inventory');
    });

    test('should have DashboardURL output', () => {
      const output = template.Outputs.DashboardURL;
      expect(output).toBeDefined();
      expect(output.Description).toContain('Dashboard');
      expect(output.Value['Fn::Sub']).toContain('cloudwatch');
    });

    test('should have 8 outputs in total', () => {
      expect(Object.keys(template.Outputs).length).toBe(8);
    });
  });

  describe('Resource Count', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(13);
    });

    test('should have 2 S3 buckets', () => {
      const buckets = Object.values(template.Resources).filter(
        r => r.Type === 'AWS::S3::Bucket'
      );
      expect(buckets.length).toBe(2);
    });

    test('should have 2 S3 bucket policies', () => {
      const policies = Object.values(template.Resources).filter(
        r => r.Type === 'AWS::S3::BucketPolicy'
      );
      expect(policies.length).toBe(2);
    });

    test('should have 1 CloudFront distribution', () => {
      const distributions = Object.values(template.Resources).filter(
        r => r.Type === 'AWS::CloudFront::Distribution'
      );
      expect(distributions.length).toBe(1);
    });

    test('should have 1 IAM role', () => {
      const roles = Object.values(template.Resources).filter(
        r => r.Type === 'AWS::IAM::Role'
      );
      expect(roles.length).toBe(1);
    });

    test('should have 1 IAM policy', () => {
      const policies = Object.values(template.Resources).filter(
        r => r.Type === 'AWS::IAM::Policy'
      );
      expect(policies.length).toBe(1);
    });

    test('should have 2 CloudWatch alarms', () => {
      const alarms = Object.values(template.Resources).filter(
        r => r.Type === 'AWS::CloudWatch::Alarm'
      );
      expect(alarms.length).toBe(2);
    });

    test('should have 1 SNS topic', () => {
      const topics = Object.values(template.Resources).filter(
        r => r.Type === 'AWS::SNS::Topic'
      );
      expect(topics.length).toBe(1);
    });

    test('should have 1 CloudWatch log group', () => {
      const logGroups = Object.values(template.Resources).filter(
        r => r.Type === 'AWS::Logs::LogGroup'
      );
      expect(logGroups.length).toBe(1);
    });

    test('should have 1 CloudWatch dashboard', () => {
      const dashboards = Object.values(template.Resources).filter(
        r => r.Type === 'AWS::CloudWatch::Dashboard'
      );
      expect(dashboards.length).toBe(1);
    });
  });

  describe('Security Best Practices', () => {
    test('all S3 buckets should block public access', () => {
      const buckets = Object.values(template.Resources).filter(
        r => r.Type === 'AWS::S3::Bucket'
      );

      buckets.forEach(bucket => {
        expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
        expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      });
    });

    test('VideoStorageBucket should have encryption enabled', () => {
      const bucket = template.Resources.VideoStorageBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('CloudFront should enforce HTTPS', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const cacheBehavior = distribution.Properties.DistributionConfig.DefaultCacheBehavior;
      expect(cacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('IAM role should have proper trust policy', () => {
      const role = template.Resources.VideoUploadRole;
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(role.Properties.AssumeRolePolicyDocument.Statement).toBeDefined();
    });
  });

  describe('Tagging Strategy', () => {
    test('all taggable resources should have Environment tag', () => {
      const taggableResources = Object.values(template.Resources).filter(
        r => r.Properties && r.Properties.Tags
      );

      expect(taggableResources.length).toBeGreaterThan(0);

      taggableResources.forEach(resource => {
        const environmentTag = resource.Properties.Tags.find(
          tag => tag.Key === 'Environment'
        );
        expect(environmentTag).toBeDefined();
      });
    });

    test('all taggable resources should have EnvironmentSuffix tag', () => {
      const taggableResources = Object.values(template.Resources).filter(
        r => r.Properties && r.Properties.Tags
      );

      taggableResources.forEach(resource => {
        const environmentSuffixTag = resource.Properties.Tags.find(
          tag => tag.Key === 'EnvironmentSuffix'
        );
        expect(environmentSuffixTag).toBeDefined();
      });
    });
  });
});
