import fs from 'fs';
import path from 'path';

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
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Conditions).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have DomainName parameter', () => {
      expect(template.Parameters.DomainName).toBeDefined();
      expect(template.Parameters.DomainName.Type).toBe('String');
      expect(template.Parameters.DomainName.Default).toBe('');
    });

    test('should have Environment parameter with valid values', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.Default).toBe('dev');
      expect(template.Parameters.Environment.AllowedValues).toEqual([
        'dev',
        'staging',
        'prod',
      ]);
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Description).toBeDefined();
    });

    test('should have AlertEmail parameter', () => {
      expect(template.Parameters.AlertEmail).toBeDefined();
      expect(template.Parameters.AlertEmail.Type).toBe('String');
      expect(template.Parameters.AlertEmail.Default).toBe(
        'alerts@example.com'
      );
    });

    test('all parameters should have descriptions', () => {
      Object.keys(template.Parameters).forEach(paramName => {
        expect(template.Parameters[paramName].Description).toBeDefined();
        expect(template.Parameters[paramName].Description.length).toBeGreaterThan(
          0
        );
      });
    });
  });

  describe('Conditions', () => {
    test('should have HasDomainName condition', () => {
      expect(template.Conditions.HasDomainName).toBeDefined();
      expect(template.Conditions.HasDomainName['Fn::Not']).toBeDefined();
    });
  });

  describe('S3 Resources', () => {
    test('should have MarketingWebsiteBucket', () => {
      const bucket = template.Resources.MarketingWebsiteBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('MarketingWebsiteBucket should have deletion policies', () => {
      const bucket = template.Resources.MarketingWebsiteBucket;
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.UpdateReplacePolicy).toBe('Delete');
    });

    test('MarketingWebsiteBucket should have encryption enabled', () => {
      const bucket = template.Resources.MarketingWebsiteBucket;
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration
      ).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('MarketingWebsiteBucket should have versioning enabled', () => {
      const bucket = template.Resources.MarketingWebsiteBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('MarketingWebsiteBucket should block public access', () => {
      const bucket = template.Resources.MarketingWebsiteBucket;
      const publicAccessBlock =
        bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('MarketingWebsiteBucket should have environment tag', () => {
      const bucket = template.Resources.MarketingWebsiteBucket;
      expect(bucket.Properties.Tags).toBeDefined();
      expect(bucket.Properties.Tags.length).toBeGreaterThan(0);
      const envTag = bucket.Properties.Tags.find(
        (tag: any) => tag.Key === 'Environment'
      );
      expect(envTag).toBeDefined();
    });

    test('MarketingWebsiteBucket name should use lowercase and EnvironmentSuffix', () => {
      const bucket = template.Resources.MarketingWebsiteBucket;
      expect(bucket.Properties.BucketName['Fn::Sub']).toMatch(/^tapstack/);
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });

    test('should have MarketingWebsiteBucketPolicy', () => {
      const policy = template.Resources.MarketingWebsiteBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.DeletionPolicy).toBe('Delete');
      expect(policy.UpdateReplacePolicy).toBe('Delete');
    });
  });

  describe('CloudFront Resources', () => {
    test('should have CloudFrontOriginAccessIdentity', () => {
      const oai = template.Resources.CloudFrontOriginAccessIdentity;
      expect(oai).toBeDefined();
      expect(oai.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
      expect(oai.DeletionPolicy).toBe('Delete');
      expect(oai.UpdateReplacePolicy).toBe('Delete');
    });

    test('should have CloudFrontDistribution', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution).toBeDefined();
      expect(distribution.Type).toBe('AWS::CloudFront::Distribution');
      expect(distribution.DeletionPolicy).toBe('Delete');
      expect(distribution.UpdateReplacePolicy).toBe('Delete');
    });

    test('CloudFrontDistribution should be enabled', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution.Properties.DistributionConfig.Enabled).toBe(true);
    });

    test('CloudFrontDistribution should use HTTPS', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const defaultBehavior =
        distribution.Properties.DistributionConfig.DefaultCacheBehavior;
      expect(defaultBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('CloudFrontDistribution should have minimum TLS 1.2', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const viewerCert =
        distribution.Properties.DistributionConfig.ViewerCertificate;
      expect(viewerCert.MinimumProtocolVersion).toBe('TLSv1.2_2021');
    });

    test('should have SSLCertificate with conditional creation', () => {
      const cert = template.Resources.SSLCertificate;
      expect(cert).toBeDefined();
      expect(cert.Type).toBe('AWS::CertificateManager::Certificate');
      expect(cert.Condition).toBe('HasDomainName');
      expect(cert.DeletionPolicy).toBe('Delete');
      expect(cert.UpdateReplacePolicy).toBe('Delete');
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have CouponsTable', () => {
      const table = template.Resources.CouponsTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('CouponsTable should have deletion policies', () => {
      const table = template.Resources.CouponsTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('CouponsTable should use PAY_PER_REQUEST billing', () => {
      const table = template.Resources.CouponsTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('CouponsTable should have encryption enabled', () => {
      const table = template.Resources.CouponsTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('CouponsTable should have point-in-time recovery disabled', () => {
      const table = template.Resources.CouponsTable;
      expect(
        table.Properties.PointInTimeRecoverySpecification
          .PointInTimeRecoveryEnabled
      ).toBe(false);
    });

    test('CouponsTable should have stream enabled', () => {
      const table = template.Resources.CouponsTable;
      expect(table.Properties.StreamSpecification.StreamViewType).toBe(
        'NEW_AND_OLD_IMAGES'
      );
    });

    test('CouponsTable should have TTL enabled', () => {
      const table = template.Resources.CouponsTable;
      expect(table.Properties.TimeToLiveSpecification.Enabled).toBe(true);
      expect(table.Properties.TimeToLiveSpecification.AttributeName).toBe(
        'ttl'
      );
    });

    test('CouponsTable should have required GSIs', () => {
      const table = template.Resources.CouponsTable;
      const gsis = table.Properties.GlobalSecondaryIndexes;
      expect(gsis).toBeDefined();
      expect(gsis.length).toBeGreaterThanOrEqual(2);

      const retailerIndex = gsis.find(
        (gsi: any) => gsi.IndexName === 'RetailerIndex'
      );
      const categoryIndex = gsis.find(
        (gsi: any) => gsi.IndexName === 'CategoryIndex'
      );

      expect(retailerIndex).toBeDefined();
      expect(categoryIndex).toBeDefined();
    });

    test('should have UserPreferencesTable', () => {
      const table = template.Resources.UserPreferencesTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('UserPreferencesTable should have EmailIndex GSI', () => {
      const table = template.Resources.UserPreferencesTable;
      const gsis = table.Properties.GlobalSecondaryIndexes;
      const emailIndex = gsis.find(
        (gsi: any) => gsi.IndexName === 'EmailIndex'
      );
      expect(emailIndex).toBeDefined();
    });

    test('DynamoDB tables should have lowercase names with EnvironmentSuffix', () => {
      const couponsTable = template.Resources.CouponsTable;
      const userPrefsTable = template.Resources.UserPreferencesTable;

      expect(couponsTable.Properties.TableName['Fn::Sub']).toMatch(/^tapstack/);
      expect(couponsTable.Properties.TableName['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
      expect(userPrefsTable.Properties.TableName['Fn::Sub']).toMatch(
        /^tapstack/
      );
      expect(userPrefsTable.Properties.TableName['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });
  });

  describe('Secrets Manager Resources', () => {
    test('should have RetailerAPIKeysSecret', () => {
      const secret = template.Resources.RetailerAPIKeysSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.DeletionPolicy).toBe('Delete');
      expect(secret.UpdateReplacePolicy).toBe('Delete');
    });

    test('RetailerAPIKeysSecret should have valid JSON string', () => {
      const secret = template.Resources.RetailerAPIKeysSecret;
      const secretString = secret.Properties.SecretString;
      expect(secretString).toBeDefined();
      expect(() => JSON.parse(secretString)).not.toThrow();
    });

    test('RetailerAPIKeysSecret should have environment tag', () => {
      const secret = template.Resources.RetailerAPIKeysSecret;
      expect(secret.Properties.Tags).toBeDefined();
      const envTag = secret.Properties.Tags.find(
        (tag: any) => tag.Key === 'Environment'
      );
      expect(envTag).toBeDefined();
    });
  });

  describe('IAM Resources', () => {
    test('should have LambdaExecutionRole', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.DeletionPolicy).toBe('Delete');
      expect(role.UpdateReplacePolicy).toBe('Delete');
    });

    test('LambdaExecutionRole should have correct trust policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Version).toBe('2012-10-17');
      expect(trustPolicy.Statement[0].Effect).toBe('Allow');
      expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have basic execution policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('LambdaExecutionRole should have DynamoDB policy with least privilege', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const dynamoPolicy = policies.find(
        (p: any) => p.PolicyName === 'DynamoDBAccess'
      );

      expect(dynamoPolicy).toBeDefined();
      const statement = dynamoPolicy.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toEqual(
        expect.arrayContaining([
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Query',
          'dynamodb:Scan',
        ])
      );
      expect(statement.Resource).toBeDefined();
    });

    test('LambdaExecutionRole should have Secrets Manager policy with least privilege', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const secretsPolicy = policies.find(
        (p: any) => p.PolicyName === 'SecretsManagerAccess'
      );

      expect(secretsPolicy).toBeDefined();
      const statement = secretsPolicy.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('secretsmanager:GetSecretValue');
      expect(statement.Resource).toBeDefined();
    });

    test('LambdaExecutionRole should have SNS publish policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const snsPolicy = policies.find(
        (p: any) => p.PolicyName === 'SNSPublishAccess'
      );

      expect(snsPolicy).toBeDefined();
      expect(snsPolicy.PolicyDocument.Statement[0].Action).toContain(
        'sns:Publish'
      );
    });

    test('LambdaExecutionRole policies should follow least privilege principle', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;

      policies.forEach((policy: any) => {
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          expect(statement.Effect).toBe('Allow');
          // Ensure actions are specific arrays, not wildcards
          if (policy.PolicyName === 'DynamoDBAccess') {
            expect(Array.isArray(statement.Action)).toBe(true);
            expect(statement.Action.some((a: string) => a.includes('*'))).toBe(
              false
            );
          }
        });
      });
    });
  });

  describe('Lambda Resources', () => {
    const lambdaFunctions = [
      'CouponAggregatorFunction',
      'APIHandlerFunction',
      'CronJobsFunction',
    ];

    lambdaFunctions.forEach(functionName => {
      test(`should have ${functionName}`, () => {
        const func = template.Resources[functionName];
        expect(func).toBeDefined();
        expect(func.Type).toBe('AWS::Lambda::Function');
        expect(func.DeletionPolicy).toBe('Delete');
        expect(func.UpdateReplacePolicy).toBe('Delete');
      });

      test(`${functionName} should have correct runtime`, () => {
        const func = template.Resources[functionName];
        expect(func.Properties.Runtime).toBe('python3.10');
      });

      test(`${functionName} should have valid timeout`, () => {
        const func = template.Resources[functionName];
        expect(func.Properties.Timeout).toBeGreaterThan(0);
        expect(func.Properties.Timeout).toBeLessThanOrEqual(900);
      });

      test(`${functionName} should have valid memory size`, () => {
        const func = template.Resources[functionName];
        expect(func.Properties.MemorySize).toBeGreaterThanOrEqual(128);
        expect(func.Properties.MemorySize).toBeLessThanOrEqual(10240);
      });

      test(`${functionName} should have execution role`, () => {
        const func = template.Resources[functionName];
        expect(func.Properties.Role).toBeDefined();
        expect(func.Properties.Role['Fn::GetAtt']).toContain(
          'LambdaExecutionRole'
        );
      });

      test(`${functionName} should have environment variables`, () => {
        const func = template.Resources[functionName];
        expect(func.Properties.Environment).toBeDefined();
        expect(func.Properties.Environment.Variables).toBeDefined();
      });

      test(`${functionName} should have inline code`, () => {
        const func = template.Resources[functionName];
        expect(func.Properties.Code.ZipFile).toBeDefined();
        expect(func.Properties.Code.ZipFile.length).toBeGreaterThan(0);
      });

      test(`${functionName} name should use lowercase and EnvironmentSuffix`, () => {
        const func = template.Resources[functionName];
        expect(func.Properties.FunctionName['Fn::Sub']).toMatch(/^tapstack/);
        expect(func.Properties.FunctionName['Fn::Sub']).toContain(
          '${EnvironmentSuffix}'
        );
      });
    });

    test('CouponAggregatorFunction should have correct environment variables', () => {
      const func = template.Resources.CouponAggregatorFunction;
      const envVars = func.Properties.Environment.Variables;
      expect(envVars.COUPONS_TABLE).toBeDefined();
      expect(envVars.SECRET_NAME).toBeDefined();
      expect(envVars.ALERT_TOPIC_ARN).toBeDefined();
    });

    test('APIHandlerFunction should have correct environment variables', () => {
      const func = template.Resources.APIHandlerFunction;
      const envVars = func.Properties.Environment.Variables;
      expect(envVars.COUPONS_TABLE).toBeDefined();
      expect(envVars.USER_PREFS_TABLE).toBeDefined();
      expect(envVars.AGGREGATOR_FUNCTION).toBeDefined();
    });

    test('CronJobsFunction should have correct environment variables', () => {
      const func = template.Resources.CronJobsFunction;
      const envVars = func.Properties.Environment.Variables;
      expect(envVars.COUPONS_TABLE).toBeDefined();
      expect(envVars.USER_PREFS_TABLE).toBeDefined();
      expect(envVars.AGGREGATOR_FUNCTION).toBeDefined();
    });
  });

  describe('API Gateway Resources', () => {
    test('should have CouponAPI', () => {
      const api = template.Resources.CouponAPI;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.DeletionPolicy).toBe('Delete');
      expect(api.UpdateReplacePolicy).toBe('Delete');
    });

    test('CouponAPI should have correct endpoint configuration', () => {
      const api = template.Resources.CouponAPI;
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    const apiResources = [
      'ApiResourceCoupons',
      'ApiResourceCouponsRefresh',
      'ApiResourceUsers',
      'ApiResourceUserId',
      'ApiResourceUserPreferences',
    ];

    apiResources.forEach(resourceName => {
      test(`should have ${resourceName}`, () => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::ApiGateway::Resource');
        expect(resource.DeletionPolicy).toBe('Delete');
        expect(resource.UpdateReplacePolicy).toBe('Delete');
      });
    });

    const apiMethods = [
      'GetCouponsMethod',
      'PostRefreshMethod',
      'GetUserPreferencesMethod',
      'PutUserPreferencesMethod',
      'CouponsOptionsMethod',
    ];

    apiMethods.forEach(methodName => {
      test(`should have ${methodName}`, () => {
        const method = template.Resources[methodName];
        expect(method).toBeDefined();
        expect(method.Type).toBe('AWS::ApiGateway::Method');
        expect(method.DeletionPolicy).toBe('Delete');
        expect(method.UpdateReplacePolicy).toBe('Delete');
      });

      test(`${methodName} should use AWS_PROXY integration`, () => {
        const method = template.Resources[methodName];
        expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      });
    });

    test('should have ApiDeployment', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment).toBeDefined();
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.DeletionPolicy).toBe('Delete');
      expect(deployment.UpdateReplacePolicy).toBe('Delete');
    });

    test('ApiDeployment should have metrics enabled', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(
        deployment.Properties.StageDescription.MetricsEnabled
      ).toBe(true);
    });

    test('ApiDeployment should not have logging enabled', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.Properties.StageDescription.LoggingLevel).toBeUndefined();
      expect(deployment.Properties.StageDescription.DataTraceEnabled).toBeUndefined();
    });

    test('should have ApiGatewayInvokePermission', () => {
      const permission = template.Resources.ApiGatewayInvokePermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });
  });

  describe('EventBridge Resources', () => {
    const scheduleRules = [
      'AggregationScheduleRule',
      'ExpiryCheckScheduleRule',
      'WeeklyDigestScheduleRule',
    ];

    scheduleRules.forEach(ruleName => {
      test(`should have ${ruleName}`, () => {
        const rule = template.Resources[ruleName];
        expect(rule).toBeDefined();
        expect(rule.Type).toBe('AWS::Events::Rule');
        expect(rule.DeletionPolicy).toBe('Delete');
        expect(rule.UpdateReplacePolicy).toBe('Delete');
      });

      test(`${ruleName} should be enabled`, () => {
        const rule = template.Resources[ruleName];
        expect(rule.Properties.State).toBe('ENABLED');
      });

      test(`${ruleName} should have schedule expression`, () => {
        const rule = template.Resources[ruleName];
        expect(rule.Properties.ScheduleExpression).toBeDefined();
      });

      test(`${ruleName} should have target`, () => {
        const rule = template.Resources[ruleName];
        expect(rule.Properties.Targets).toBeDefined();
        expect(rule.Properties.Targets.length).toBeGreaterThan(0);
      });

      test(`${ruleName} name should use lowercase and EnvironmentSuffix`, () => {
        const rule = template.Resources[ruleName];
        expect(rule.Properties.Name['Fn::Sub']).toMatch(/^tapstack/);
        expect(rule.Properties.Name['Fn::Sub']).toContain(
          '${EnvironmentSuffix}'
        );
      });
    });

    const schedulePermissions = [
      'AggregationSchedulePermission',
      'ExpiryCheckSchedulePermission',
      'WeeklyDigestSchedulePermission',
    ];

    schedulePermissions.forEach(permissionName => {
      test(`should have ${permissionName}`, () => {
        const permission = template.Resources[permissionName];
        expect(permission).toBeDefined();
        expect(permission.Type).toBe('AWS::Lambda::Permission');
        expect(permission.DeletionPolicy).toBe('Delete');
        expect(permission.UpdateReplacePolicy).toBe('Delete');
        expect(permission.Properties.Principal).toBe('events.amazonaws.com');
      });
    });
  });

  describe('SNS Resources', () => {
    const topics = ['AlertTopic', 'CloudWatchAlarmTopic'];

    topics.forEach(topicName => {
      test(`should have ${topicName}`, () => {
        const topic = template.Resources[topicName];
        expect(topic).toBeDefined();
        expect(topic.Type).toBe('AWS::SNS::Topic');
        expect(topic.DeletionPolicy).toBe('Delete');
        expect(topic.UpdateReplacePolicy).toBe('Delete');
      });

      test(`${topicName} should have email subscription`, () => {
        const topic = template.Resources[topicName];
        expect(topic.Properties.Subscription).toBeDefined();
        expect(topic.Properties.Subscription.length).toBeGreaterThan(0);
        expect(topic.Properties.Subscription[0].Protocol).toBe('email');
      });

      test(`${topicName} name should use lowercase and EnvironmentSuffix`, () => {
        const topic = template.Resources[topicName];
        expect(topic.Properties.TopicName['Fn::Sub']).toMatch(/^tapstack/);
        expect(topic.Properties.TopicName['Fn::Sub']).toContain(
          '${EnvironmentSuffix}'
        );
      });
    });
  });

  describe('CloudWatch Resources', () => {
    const alarms = [
      'LambdaErrorAlarm',
      'DynamoDBThrottleAlarm',
      'APIGateway4XXAlarm',
    ];

    alarms.forEach(alarmName => {
      test(`should have ${alarmName}`, () => {
        const alarm = template.Resources[alarmName];
        expect(alarm).toBeDefined();
        expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
        expect(alarm.DeletionPolicy).toBe('Delete');
        expect(alarm.UpdateReplacePolicy).toBe('Delete');
      });

      test(`${alarmName} should have valid threshold`, () => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.Threshold).toBeGreaterThan(0);
      });

      test(`${alarmName} should have alarm actions`, () => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });

      test(`${alarmName} should have valid comparison operator`, () => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.ComparisonOperator).toBe(
          'GreaterThanThreshold'
        );
      });

      test(`${alarmName} name should use lowercase and EnvironmentSuffix`, () => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.AlarmName['Fn::Sub']).toMatch(/^tapstack/);
        expect(alarm.Properties.AlarmName['Fn::Sub']).toContain(
          '${EnvironmentSuffix}'
        );
      });
    });

    test('should have MonitoringDashboard', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(dashboard.DeletionPolicy).toBe('Delete');
      expect(dashboard.UpdateReplacePolicy).toBe('Delete');
    });

    test('MonitoringDashboard should have valid body', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      const body = dashboard.Properties.DashboardBody['Fn::Sub'];
      expect(() => JSON.parse(body)).not.toThrow();
    });

    const logGroups = [
      'APIHandlerLogGroup',
      'CouponAggregatorLogGroup',
      'CronJobsLogGroup',
    ];

    logGroups.forEach(logGroupName => {
      test(`should have ${logGroupName}`, () => {
        const logGroup = template.Resources[logGroupName];
        expect(logGroup).toBeDefined();
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
        expect(logGroup.DeletionPolicy).toBe('Delete');
        expect(logGroup.UpdateReplacePolicy).toBe('Delete');
      });

      test(`${logGroupName} should have retention policy`, () => {
        const logGroup = template.Resources[logGroupName];
        expect(logGroup.Properties.RetentionInDays).toBeDefined();
        expect(logGroup.Properties.RetentionInDays).toBeGreaterThan(0);
      });
    });
  });

  describe('Outputs', () => {
    test('should have MarketingWebsiteURL output', () => {
      const output = template.Outputs.MarketingWebsiteURL;
      expect(output).toBeDefined();
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
    });

    test('should have APIEndpoint output', () => {
      const output = template.Outputs.APIEndpoint;
      expect(output).toBeDefined();
      expect(output.Description).toBeDefined();
      expect(output.Value).toBeDefined();
    });

    test('should have S3BucketName output', () => {
      const output = template.Outputs.S3BucketName;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'MarketingWebsiteBucket' });
    });

    test('should have CloudFrontDistributionId output', () => {
      const output = template.Outputs.CloudFrontDistributionId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'CloudFrontDistribution' });
    });

    test('should have CouponsTableName output', () => {
      const output = template.Outputs.CouponsTableName;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'CouponsTable' });
    });

    test('should have UserPreferencesTableName output', () => {
      const output = template.Outputs.UserPreferencesTableName;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'UserPreferencesTable' });
    });

    test('should have MonitoringDashboardURL output', () => {
      const output = template.Outputs.MonitoringDashboardURL;
      expect(output).toBeDefined();
      expect(output.Description).toBeDefined();
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(
          template.Outputs[outputName].Description.length
        ).toBeGreaterThan(0);
      });
    });
  });

  describe('Deletion Policies', () => {
    test('all resources should have DeletionPolicy set to Delete', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });

    test('all resources should have UpdateReplacePolicy set to Delete', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.UpdateReplacePolicy).toBe('Delete');
      });
    });
  });

  describe('Security Best Practices', () => {
    test('S3 buckets should have encryption enabled', () => {
      const bucket = template.Resources.MarketingWebsiteBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('S3 buckets should block public access', () => {
      const bucket = template.Resources.MarketingWebsiteBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
    });

    test('DynamoDB tables should have encryption enabled', () => {
      const couponsTable = template.Resources.CouponsTable;
      const userPrefsTable = template.Resources.UserPreferencesTable;
      expect(couponsTable.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(userPrefsTable.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('CloudFront should enforce HTTPS', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const defaultBehavior =
        distribution.Properties.DistributionConfig.DefaultCacheBehavior;
      expect(defaultBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('IAM roles should not use wildcard resources for sensitive operations', () => {
      const role = template.Resources.LambdaExecutionRole;
      const dynamoPolicy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'DynamoDBAccess'
      );
      const secretsPolicy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'SecretsManagerAccess'
      );

      expect(dynamoPolicy.PolicyDocument.Statement[0].Resource).not.toBe('*');
      expect(secretsPolicy.PolicyDocument.Statement[0].Resource).not.toBe('*');
    });
  });

  describe('Naming Conventions', () => {
    test('all resource names should use EnvironmentSuffix', () => {
      const resourcesWithNames = [
        'MarketingWebsiteBucket',
        'CouponsTable',
        'UserPreferencesTable',
        'RetailerAPIKeysSecret',
        'LambdaExecutionRole',
        'CouponAggregatorFunction',
        'APIHandlerFunction',
        'CronJobsFunction',
        'CouponAPI',
        'AlertTopic',
        'CloudWatchAlarmTopic',
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty =
          resource.Properties.BucketName ||
          resource.Properties.TableName ||
          resource.Properties.Name ||
          resource.Properties.RoleName ||
          resource.Properties.FunctionName ||
          resource.Properties.TopicName;

        if (nameProperty && nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('resource names should use lowercase', () => {
      const resourcesWithNames = [
        'MarketingWebsiteBucket',
        'CouponsTable',
        'UserPreferencesTable',
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty =
          resource.Properties.BucketName ||
          resource.Properties.TableName ||
          resource.Properties.Name;

        if (nameProperty && nameProperty['Fn::Sub']) {
          const nameTemplate = nameProperty['Fn::Sub'];
          // Check that the static part before ${} is lowercase
          const staticPart = nameTemplate.split('${')[0];
          expect(staticPart).toBe(staticPart.toLowerCase());
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

    test('should have multiple resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20);
    });

    test('all resource references should point to existing resources', () => {
      const resourceNames = Object.keys(template.Resources);

      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const resourceJson = JSON.stringify(resource);

        // Find all Ref references
        const refMatches = resourceJson.match(/"Ref":"([^"]+)"/g);
        if (refMatches) {
          refMatches.forEach(match => {
            const ref = match.match(/"Ref":"([^"]+)"/)?.[1];
            if (
              ref &&
              !ref.startsWith('AWS::') &&
              ref !== 'AWS::NoValue' &&
              !Object.keys(template.Parameters).includes(ref)
            ) {
              expect(resourceNames).toContain(ref);
            }
          });
        }

        // Find all GetAtt references
        const getAttMatches = resourceJson.match(/"Fn::GetAtt":\["([^"]+)"/g);
        if (getAttMatches) {
          getAttMatches.forEach(match => {
            const ref = match.match(/"Fn::GetAtt":\["([^"]+)"/)?.[1];
            if (ref) {
              expect(resourceNames).toContain(ref);
            }
          });
        }
      });
    });
  });

  describe('Environment Variables and Configuration', () => {
    test('Lambda functions should reference correct DynamoDB tables', () => {
      const apiHandler = template.Resources.APIHandlerFunction;
      const cronJobs = template.Resources.CronJobsFunction;

      expect(
        apiHandler.Properties.Environment.Variables.COUPONS_TABLE.Ref
      ).toBe('CouponsTable');
      expect(
        apiHandler.Properties.Environment.Variables.USER_PREFS_TABLE.Ref
      ).toBe('UserPreferencesTable');
      expect(
        cronJobs.Properties.Environment.Variables.COUPONS_TABLE.Ref
      ).toBe('CouponsTable');
      expect(
        cronJobs.Properties.Environment.Variables.USER_PREFS_TABLE.Ref
      ).toBe('UserPreferencesTable');
    });

    test('Lambda functions should reference correct other resources', () => {
      const aggregator = template.Resources.CouponAggregatorFunction;
      expect(aggregator.Properties.Environment.Variables.SECRET_NAME.Ref).toBe(
        'RetailerAPIKeysSecret'
      );
      expect(
        aggregator.Properties.Environment.Variables.ALERT_TOPIC_ARN.Ref
      ).toBe('AlertTopic');
    });
  });

  describe('Tags', () => {
    test('taggable resources should have Environment tag', () => {
      const taggedResources = [
        'MarketingWebsiteBucket',
        'CouponsTable',
        'UserPreferencesTable',
        'RetailerAPIKeysSecret',
        'SSLCertificate',
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (!resource.Condition || resourceName !== 'SSLCertificate') {
          expect(resource.Properties.Tags).toBeDefined();
          const envTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'Environment'
          );
          expect(envTag).toBeDefined();
        }
      });
    });
  });
});
