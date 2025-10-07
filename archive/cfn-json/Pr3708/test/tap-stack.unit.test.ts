import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - News Aggregator', () => {
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
      expect(template.Description).toContain('News Aggregator');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
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
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });
  });

  describe('DynamoDB Tables', () => {
    test('should have TurnAroundPromptTable resource', () => {
      expect(template.Resources.TurnAroundPromptTable).toBeDefined();
      expect(template.Resources.TurnAroundPromptTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have ArticlesTable resource', () => {
      expect(template.Resources.ArticlesTable).toBeDefined();
      expect(template.Resources.ArticlesTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have UserPreferencesTable resource', () => {
      expect(template.Resources.UserPreferencesTable).toBeDefined();
      expect(template.Resources.UserPreferencesTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('ArticlesTable should have correct schema', () => {
      const table = template.Resources.ArticlesTable;
      const props = table.Properties;

      expect(props.AttributeDefinitions).toHaveLength(3);
      expect(props.KeySchema[0].AttributeName).toBe('articleId');
      expect(props.BillingMode).toBe('PAY_PER_REQUEST');
      expect(props.DeletionProtectionEnabled).toBe(false);
    });

    test('ArticlesTable should have CategoryTimeIndex GSI', () => {
      const table = template.Resources.ArticlesTable;
      const gsi = table.Properties.GlobalSecondaryIndexes;

      expect(gsi).toHaveLength(1);
      expect(gsi[0].IndexName).toBe('CategoryTimeIndex');
      expect(gsi[0].KeySchema[0].AttributeName).toBe('category');
      expect(gsi[0].KeySchema[1].AttributeName).toBe('publishedAt');
    });

    test('ArticlesTable should have TTL enabled', () => {
      const table = template.Resources.ArticlesTable;
      const ttlSpec = table.Properties.TimeToLiveSpecification;

      expect(ttlSpec.Enabled).toBe(true);
      expect(ttlSpec.AttributeName).toBe('ttl');
    });

    test('ArticlesTable should have DynamoDB Streams enabled', () => {
      const table = template.Resources.ArticlesTable;
      const streamSpec = table.Properties.StreamSpecification;

      expect(streamSpec).toBeDefined();
      expect(streamSpec.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('UserPreferencesTable should have EmailIndex GSI', () => {
      const table = template.Resources.UserPreferencesTable;
      const gsi = table.Properties.GlobalSecondaryIndexes;

      expect(gsi).toHaveLength(1);
      expect(gsi[0].IndexName).toBe('EmailIndex');
      expect(gsi[0].KeySchema[0].AttributeName).toBe('email');
    });

    test('All DynamoDB tables should have deletion policies', () => {
      ['TurnAroundPromptTable', 'ArticlesTable', 'UserPreferencesTable'].forEach(tableName => {
        const table = template.Resources[tableName];
        expect(table.DeletionPolicy).toBe('Delete');
        expect(table.UpdateReplacePolicy).toBe('Delete');
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should have FrontendBucket resource', () => {
      expect(template.Resources.FrontendBucket).toBeDefined();
      expect(template.Resources.FrontendBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('FrontendBucket should have website configuration', () => {
      const bucket = template.Resources.FrontendBucket;
      const webConfig = bucket.Properties.WebsiteConfiguration;

      expect(webConfig).toBeDefined();
      expect(webConfig.IndexDocument).toBe('index.html');
      expect(webConfig.ErrorDocument).toBe('error.html');
    });

    test('FrontendBucket should have CORS configuration', () => {
      const bucket = template.Resources.FrontendBucket;
      const corsConfig = bucket.Properties.CorsConfiguration;

      expect(corsConfig).toBeDefined();
      expect(corsConfig.CorsRules).toHaveLength(1);
      expect(corsConfig.CorsRules[0].AllowedMethods).toContain('GET');
      expect(corsConfig.CorsRules[0].AllowedOrigins).toContain('*');
    });

    test('FrontendBucket should have public access enabled', () => {
      const bucket = template.Resources.FrontendBucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessConfig.BlockPublicAcls).toBe(false);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(false);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(false);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(false);
    });

    test('should have FrontendBucketPolicy resource', () => {
      expect(template.Resources.FrontendBucketPolicy).toBeDefined();
      expect(template.Resources.FrontendBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('CloudFront', () => {
    test('should have CloudFrontOriginAccessIdentity resource', () => {
      expect(template.Resources.CloudFrontOriginAccessIdentity).toBeDefined();
      expect(template.Resources.CloudFrontOriginAccessIdentity.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
    });

    test('CloudFrontOriginAccessIdentity should have correct comment', () => {
      const oai = template.Resources.CloudFrontOriginAccessIdentity;
      expect(oai.Properties.CloudFrontOriginAccessIdentityConfig.Comment).toEqual({
        'Fn::Sub': 'OAI for News Aggregator ${EnvironmentSuffix}',
      });
    });

    test('should have CloudFrontDistribution resource', () => {
      expect(template.Resources.CloudFrontDistribution).toBeDefined();
      expect(template.Resources.CloudFrontDistribution.Type).toBe('AWS::CloudFront::Distribution');
    });

    test('CloudFrontDistribution should be enabled', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution.Properties.DistributionConfig.Enabled).toBe(true);
      expect(distribution.Properties.DistributionConfig.DefaultRootObject).toBe('index.html');
      expect(distribution.Properties.DistributionConfig.HttpVersion).toBe('http2');
    });

    test('CloudFrontDistribution should have correct origins', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const origins = distribution.Properties.DistributionConfig.Origins;

      expect(origins).toHaveLength(2);
      expect(origins[0].Id).toBe('S3Origin');
      expect(origins[1].Id).toBe('APIGatewayOrigin');
    });

    test('CloudFrontDistribution should have S3 origin with OAI', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const s3Origin = distribution.Properties.DistributionConfig.Origins[0];

      expect(s3Origin.DomainName).toEqual({
        'Fn::GetAtt': ['FrontendBucket', 'RegionalDomainName'],
      });
      expect(s3Origin.S3OriginConfig.OriginAccessIdentity).toEqual({
        'Fn::Sub': 'origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}',
      });
    });

    test('CloudFrontDistribution should have API Gateway origin', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const apiOrigin = distribution.Properties.DistributionConfig.Origins[1];

      expect(apiOrigin.DomainName).toEqual({
        'Fn::Sub': '${NewsAggregatorAPI}.execute-api.${AWS::Region}.amazonaws.com',
      });
      expect(apiOrigin.CustomOriginConfig.HTTPSPort).toBe(443);
      expect(apiOrigin.CustomOriginConfig.OriginProtocolPolicy).toBe('https-only');
    });

    test('CloudFrontDistribution should have correct default cache behavior', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const defaultBehavior = distribution.Properties.DistributionConfig.DefaultCacheBehavior;

      expect(defaultBehavior.TargetOriginId).toBe('S3Origin');
      expect(defaultBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
      expect(defaultBehavior.Compress).toBe(true);
      expect(defaultBehavior.DefaultTTL).toBe(86400);
    });

    test('CloudFrontDistribution should have API cache behavior', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const cacheBehaviors = distribution.Properties.DistributionConfig.CacheBehaviors;

      expect(cacheBehaviors).toHaveLength(1);
      expect(cacheBehaviors[0].PathPattern).toBe('/api/*');
      expect(cacheBehaviors[0].TargetOriginId).toBe('APIGatewayOrigin');
      expect(cacheBehaviors[0].ViewerProtocolPolicy).toBe('https-only');
      expect(cacheBehaviors[0].DefaultTTL).toBe(0);
    });

    test('CloudFrontDistribution should have iac-rlhf-amazon tag', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const tags = distribution.Properties.Tags;

      expect(tags).toBeDefined();
      expect(tags).toContainEqual({
        Key: 'iac-rlhf-amazon',
        Value: 'true',
      });
    });

    test('CloudFrontDistribution should use PriceClass_100', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution.Properties.DistributionConfig.PriceClass).toBe('PriceClass_100');
    });
  });

  describe('IAM Role', () => {
    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have Lambda service principal', () => {
      const role = template.Resources.LambdaExecutionRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have DynamoDB access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;

      const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      expect(dynamoPolicy).toBeDefined();
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:PutItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:GetItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:Query');
    });

    test('LambdaExecutionRole should have Comprehend access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;

      const comprehendPolicy = policies.find((p: any) => p.PolicyName === 'ComprehendAccess');
      expect(comprehendPolicy).toBeDefined();
      expect(comprehendPolicy.PolicyDocument.Statement[0].Action).toContain('comprehend:DetectSentiment');
      expect(comprehendPolicy.PolicyDocument.Statement[0].Action).toContain('comprehend:DetectKeyPhrases');
    });

    test('LambdaExecutionRole should have Personalize access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;

      const personalizePolicy = policies.find((p: any) => p.PolicyName === 'PersonalizeAccess');
      expect(personalizePolicy).toBeDefined();
      expect(personalizePolicy.PolicyDocument.Statement[0].Action).toContain('personalize:GetRecommendations');
      expect(personalizePolicy.PolicyDocument.Statement[0].Action).toContain('personalize:PutEvents');
    });
  });

  describe('Lambda Functions', () => {
    test('should have ContentAggregatorFunction resource', () => {
      expect(template.Resources.ContentAggregatorFunction).toBeDefined();
      expect(template.Resources.ContentAggregatorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have UserPreferencesHandlerFunction resource', () => {
      expect(template.Resources.UserPreferencesHandlerFunction).toBeDefined();
      expect(template.Resources.UserPreferencesHandlerFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have PersonalizedFeedHandlerFunction resource', () => {
      expect(template.Resources.PersonalizedFeedHandlerFunction).toBeDefined();
      expect(template.Resources.PersonalizedFeedHandlerFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('ContentAggregatorFunction should have correct runtime', () => {
      const func = template.Resources.ContentAggregatorFunction;
      expect(func.Properties.Runtime).toBe('nodejs22.x');
    });

    test('ContentAggregatorFunction should have correct timeout and memory', () => {
      const func = template.Resources.ContentAggregatorFunction;
      expect(func.Properties.Timeout).toBe(300);
      expect(func.Properties.MemorySize).toBe(1024);
    });

    test('ContentAggregatorFunction should have environment variables', () => {
      const func = template.Resources.ContentAggregatorFunction;
      const envVars = func.Properties.Environment.Variables;

      expect(envVars.ARTICLES_TABLE).toEqual({ Ref: 'ArticlesTable' });
      expect(envVars.USER_PREFERENCES_TABLE).toEqual({ Ref: 'UserPreferencesTable' });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('Lambda functions should have CloudWatch log groups', () => {
      expect(template.Resources.ContentAggregatorLogGroup).toBeDefined();
      expect(template.Resources.UserPreferencesHandlerLogGroup).toBeDefined();
      expect(template.Resources.PersonalizedFeedHandlerLogGroup).toBeDefined();
    });

    test('Log groups should have 7 days retention', () => {
      const logGroups = [
        'ContentAggregatorLogGroup',
        'UserPreferencesHandlerLogGroup',
        'PersonalizedFeedHandlerLogGroup',
      ];

      logGroups.forEach(lgName => {
        expect(template.Resources[lgName].Properties.RetentionInDays).toBe(7);
      });
    });
  });

  describe('API Gateway', () => {
    test('should have NewsAggregatorAPI resource', () => {
      expect(template.Resources.NewsAggregatorAPI).toBeDefined();
      expect(template.Resources.NewsAggregatorAPI.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have API deployment resource', () => {
      expect(template.Resources.APIDeployment).toBeDefined();
      expect(template.Resources.APIDeployment.Type).toBe('AWS::ApiGateway::Deployment');
    });

    test('API deployment should have stage description with method settings', () => {
      const deployment = template.Resources.APIDeployment;
      const stageDesc = deployment.Properties.StageDescription;

      expect(stageDesc.MethodSettings).toBeDefined();
      expect(stageDesc.MethodSettings[0].ThrottlingBurstLimit).toBe(100);
      expect(stageDesc.MethodSettings[0].ThrottlingRateLimit).toBe(50);
      expect(stageDesc.MethodSettings[0].LoggingLevel).toBe('INFO');
    });

    test('should have API resources for users and preferences', () => {
      expect(template.Resources.UsersResource).toBeDefined();
      expect(template.Resources.UserIdResource).toBeDefined();
      expect(template.Resources.UserPreferencesResource).toBeDefined();
      expect(template.Resources.FeedResource).toBeDefined();
    });

    test('should have API methods', () => {
      expect(template.Resources.UserPreferencesGetMethod).toBeDefined();
      expect(template.Resources.UserPreferencesPutMethod).toBeDefined();
      expect(template.Resources.FeedGetMethod).toBeDefined();
    });

    test('API methods should use AWS_PROXY integration', () => {
      const methods = ['UserPreferencesGetMethod', 'UserPreferencesPutMethod', 'FeedGetMethod'];

      methods.forEach(methodName => {
        const method = template.Resources[methodName];
        expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
        expect(method.Properties.Integration.IntegrationHttpMethod).toBe('POST');
      });
    });

    test('should have Lambda invoke permissions for API Gateway', () => {
      expect(template.Resources.UserPreferencesHandlerApiPermission).toBeDefined();
      expect(template.Resources.PersonalizedFeedHandlerApiPermission).toBeDefined();
    });
  });

  describe('EventBridge', () => {
    test('should have ContentAggregationScheduleRule resource', () => {
      expect(template.Resources.ContentAggregationScheduleRule).toBeDefined();
      expect(template.Resources.ContentAggregationScheduleRule.Type).toBe('AWS::Events::Rule');
    });

    test('EventBridge rule should have hourly schedule', () => {
      const rule = template.Resources.ContentAggregationScheduleRule;
      expect(rule.Properties.ScheduleExpression).toBe('rate(1 hour)');
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('EventBridge rule should target ContentAggregator Lambda', () => {
      const rule = template.Resources.ContentAggregationScheduleRule;
      const targets = rule.Properties.Targets;

      expect(targets).toHaveLength(1);
      expect(targets[0].Arn).toEqual({ 'Fn::GetAtt': ['ContentAggregatorFunction', 'Arn'] });
    });

    test('should have Lambda invoke permission for EventBridge', () => {
      expect(template.Resources.ContentAggregatorSchedulePermission).toBeDefined();
      const permission = template.Resources.ContentAggregatorSchedulePermission;
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'ArticlesTableName',
        'UserPreferencesTableName',
        'FrontendBucketName',
        'FrontendBucketWebsiteURL',
        'CloudFrontDistributionDomainName',
        'CloudFrontDistributionId',
        'APIGatewayURL',
        'ContentAggregatorFunctionArn',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
        expect(template.Outputs[outputKey].Description.length).toBeGreaterThan(0);
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('DynamoDB tables should follow naming convention with environment suffix', () => {
      const tables = ['TurnAroundPromptTable', 'ArticlesTable', 'UserPreferencesTable'];

      tables.forEach(tableName => {
        const table = template.Resources[tableName];
        expect(table.Properties.TableName).toHaveProperty('Fn::Sub');
        expect(table.Properties.TableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });

    test('Lambda functions should follow naming convention', () => {
      const functions = [
        'ContentAggregatorFunction',
        'UserPreferencesHandlerFunction',
        'PersonalizedFeedHandlerFunction',
      ];

      functions.forEach(funcName => {
        const func = template.Resources[funcName];
        expect(func.Properties.FunctionName).toHaveProperty('Fn::Sub');
        expect(func.Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
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

    test('should have minimum required resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Security Best Practices', () => {
    test('Lambda functions should use execution role', () => {
      const functions = [
        'ContentAggregatorFunction',
        'UserPreferencesHandlerFunction',
        'PersonalizedFeedHandlerFunction',
      ];

      functions.forEach(funcName => {
        const func = template.Resources[funcName];
        expect(func.Properties.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
      });
    });

    test('DynamoDB tables should have deletion protection disabled for non-prod', () => {
      const tables = ['TurnAroundPromptTable', 'ArticlesTable', 'UserPreferencesTable'];

      tables.forEach(tableName => {
        const table = template.Resources[tableName];
        expect(table.Properties.DeletionProtectionEnabled).toBe(false);
      });
    });
  });
});
