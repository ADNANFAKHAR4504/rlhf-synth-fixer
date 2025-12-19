import * as assert from 'assert';
import * as fs from 'fs';
import path from 'path';

// CloudFormation template interface definitions
interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description: string;
  Parameters: Record<string, Parameter>;
  Resources: Record<string, Resource>;
  Outputs: Record<string, Output>;
}

interface Parameter {
  Type: string;
  Description?: string;
  Default?: any;
  AllowedValues?: any[];
  ConstraintDescription?: string;
}

interface Resource {
  Type: string;
  Properties?: Record<string, any>;
  DependsOn?: string | string[];
  Tags?: Tag[];
}

interface Tag {
  Key: string;
  Value: string | { Ref: string } | { 'Fn::Sub': string };
}

interface Output {
  Description: string;
  Value: any;
}

describe('Language Learning CloudFormation Template Tests', () => {
  let template: CloudFormationTemplate;

  beforeEach(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure Tests', () => {
    it('should have valid AWS template format version', () => {
      assert.strictEqual(template.AWSTemplateFormatVersion, '2010-09-09');
    });

    it('should have a description', () => {
      assert.ok(template.Description);
      assert.ok(template.Description.length > 0);
      assert.ok(template.Description.includes('language learning'));
    });

    it('should have parameters section', () => {
      assert.ok(template.Parameters);
      assert.ok(typeof template.Parameters === 'object');
    });

    it('should have resources section', () => {
      assert.ok(template.Resources);
      assert.ok(typeof template.Resources === 'object');
      assert.ok(Object.keys(template.Resources).length > 0);
    });

    it('should have outputs section', () => {
      assert.ok(template.Outputs);
      assert.ok(typeof template.Outputs === 'object');
      assert.ok(Object.keys(template.Outputs).length > 0);
    });
  });

  describe('Parameters Validation Tests', () => {
    it('should have Environment parameter with correct configuration', () => {
      const envParam = template.Parameters.Environment;
      assert.ok(envParam);
      assert.strictEqual(envParam.Type, 'String');
      assert.strictEqual(envParam.Default, 'Production');
      assert.ok(Array.isArray(envParam.AllowedValues));
      assert.ok(envParam.AllowedValues?.includes('Production'));
      assert.ok(envParam.AllowedValues?.includes('Development'));
      assert.ok(envParam.AllowedValues?.includes('Testing'));
    });

    it('should have PythonRuntime parameter with supported versions', () => {
      const pythonParam = template.Parameters.PythonRuntime;
      assert.ok(pythonParam);
      assert.strictEqual(pythonParam.Type, 'String');
      assert.strictEqual(pythonParam.Default, 'python3.10');
      assert.ok(Array.isArray(pythonParam.AllowedValues));
      assert.ok(pythonParam.AllowedValues?.includes('python3.10'));
      assert.ok(pythonParam.AllowedValues?.includes('python3.9'));
      assert.ok(pythonParam.AllowedValues?.includes('python3.8'));
    });

    it('should have ApiStageName parameter', () => {
      const stageParam = template.Parameters.ApiStageName;
      assert.ok(stageParam);
      assert.strictEqual(stageParam.Type, 'String');
      assert.strictEqual(stageParam.Default, 'v1');
    });

    it('should have LogRetentionInDays parameter with valid retention periods', () => {
      const logParam = template.Parameters.LogRetentionInDays;
      assert.ok(logParam);
      assert.strictEqual(logParam.Type, 'Number');
      assert.strictEqual(logParam.Default, 30);
      assert.ok(Array.isArray(logParam.AllowedValues));
      assert.ok(logParam.AllowedValues?.includes(30));
      assert.ok(logParam.AllowedValues?.includes(365));
    });
  });

  describe('VPC and Networking Resources Tests', () => {
    it('should create VPC with correct CIDR and DNS settings', () => {
      const vpc = template.Resources.VPC;
      assert.ok(vpc);
      assert.strictEqual(vpc.Type, 'AWS::EC2::VPC');
      assert.strictEqual(vpc.Properties?.CidrBlock, '10.0.0.0/16');
      assert.strictEqual(vpc.Properties?.EnableDnsSupport, true);
      assert.strictEqual(vpc.Properties?.EnableDnsHostnames, true);
    });

    it('should create private subnets in different AZs', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      assert.ok(subnet1);
      assert.ok(subnet2);
      assert.strictEqual(subnet1.Type, 'AWS::EC2::Subnet');
      assert.strictEqual(subnet2.Type, 'AWS::EC2::Subnet');
      assert.strictEqual(subnet1.Properties?.CidrBlock, '10.0.1.0/24');
      assert.strictEqual(subnet2.Properties?.CidrBlock, '10.0.2.0/24');
    });

    it('should create VPC endpoints for DynamoDB and S3', () => {
      const dynamoEndpoint = template.Resources.DynamoDBVPCEndpoint;
      const s3Endpoint = template.Resources.S3VPCEndpoint;

      assert.ok(dynamoEndpoint);
      assert.ok(s3Endpoint);
      assert.strictEqual(dynamoEndpoint.Type, 'AWS::EC2::VPCEndpoint');
      assert.strictEqual(s3Endpoint.Type, 'AWS::EC2::VPCEndpoint');
    });
  });

  describe('API Gateway Tests', () => {
    it('should create API Gateway with correct configuration', () => {
      const apiGateway = template.Resources.ApiGateway;
      assert.ok(apiGateway);
      assert.strictEqual(apiGateway.Type, 'AWS::ApiGateway::RestApi');
      assert.strictEqual(apiGateway.Properties?.Name, 'LanguageLearningApi');
      assert.ok(apiGateway.Properties?.EndpointConfiguration);
      assert.deepStrictEqual(apiGateway.Properties?.EndpointConfiguration.Types, ['REGIONAL']);
    });

    it('should create API Gateway stage with correct throttling settings', () => {
      const stage = template.Resources.ApiGatewayStage;
      assert.ok(stage);
      assert.strictEqual(stage.Type, 'AWS::ApiGateway::Stage');

      const methodSettings = stage.Properties?.MethodSettings?.[0];
      assert.ok(methodSettings);
      assert.strictEqual(methodSettings.ThrottlingBurstLimit, 7000);
      assert.strictEqual(methodSettings.ThrottlingRateLimit, 6000);
    });

    it('should create required API resources and methods', () => {
      const resources = [
        'LessonResource',
        'UserProgressResource',
        'SpeechRecognitionResource',
        'GrammarAnalysisResource',
        'RecommendationsResource'
      ];

      const methods = [
        'LessonGetMethod',
        'UserProgressGetMethod',
        'SpeechRecognitionPostMethod',
        'GrammarAnalysisPostMethod',
        'RecommendationsGetMethod'
      ];

      resources.forEach(resourceName => {
        assert.ok(template.Resources[resourceName]);
        assert.strictEqual(template.Resources[resourceName].Type, 'AWS::ApiGateway::Resource');
      });

      methods.forEach(methodName => {
        assert.ok(template.Resources[methodName]);
        assert.strictEqual(template.Resources[methodName].Type, 'AWS::ApiGateway::Method');
      });
    });

    it('should configure Cognito authorization for API methods', () => {
      const lessonMethod = template.Resources.LessonGetMethod;
      assert.ok(lessonMethod);
      assert.strictEqual(lessonMethod.Properties?.AuthorizationType, 'COGNITO_USER_POOLS');
      assert.ok(lessonMethod.Properties?.AuthorizerId);
    });
  });

  describe('Lambda Functions Tests', () => {
    const lambdaFunctions = [
      'LessonDeliveryFunction',
      'UserProgressFunction',
      'SpeechRecognitionFunction',
      'GrammarAnalysisFunction',
      'RecommendationsFunction'
    ];

    lambdaFunctions.forEach(functionName => {
      it(`should create ${functionName} with correct configuration`, () => {
        const lambdaFunction = template.Resources[functionName];
        assert.ok(lambdaFunction);
        assert.strictEqual(lambdaFunction.Type, 'AWS::Lambda::Function');
        assert.strictEqual(lambdaFunction.Properties?.Handler, 'index.handler');
        assert.ok(lambdaFunction.Properties?.Role);
        assert.ok(lambdaFunction.Properties?.Code);
        assert.ok(lambdaFunction.Properties?.Environment?.Variables);
      });
    });

    it('should configure Lambda functions with appropriate memory and timeout', () => {
      const lessonFunction = template.Resources.LessonDeliveryFunction;
      const speechFunction = template.Resources.SpeechRecognitionFunction;

      assert.strictEqual(lessonFunction.Properties?.MemorySize, 512);
      assert.strictEqual(lessonFunction.Properties?.Timeout, 30);
      assert.strictEqual(speechFunction.Properties?.MemorySize, 1024);
      assert.strictEqual(speechFunction.Properties?.Timeout, 60);
    });

    it('should create Dead Letter Queues for all Lambda functions', () => {
      const dlqs = [
        'LessonDeliveryDLQ',
        'UserProgressDLQ',
        'SpeechRecognitionDLQ',
        'GrammarAnalysisDLQ',
        'RecommendationsDLQ'
      ];

      dlqs.forEach(dlqName => {
        const dlq = template.Resources[dlqName];
        assert.ok(dlq);
        assert.strictEqual(dlq.Type, 'AWS::SQS::Queue');
        assert.strictEqual(dlq.Properties?.SqsManagedSseEnabled, true);
      });
    });

    it('should enable X-Ray tracing for Lambda functions', () => {
      const lessonFunction = template.Resources.LessonDeliveryFunction;
      assert.ok(lessonFunction.Properties?.TracingConfig);
      assert.strictEqual(lessonFunction.Properties?.TracingConfig.Mode, 'Active');
    });
  });

  describe('IAM Roles and Policies Tests', () => {
    const iamRoles = [
      'LessonDeliveryFunctionRole',
      'UserProgressFunctionRole',
      'SpeechRecognitionFunctionRole',
      'GrammarAnalysisFunctionRole',
      'RecommendationsFunctionRole'
    ];

    iamRoles.forEach(roleName => {
      it(`should create ${roleName} with correct assume role policy`, () => {
        const role = template.Resources[roleName];
        assert.ok(role);
        assert.strictEqual(role.Type, 'AWS::IAM::Role');

        const assumePolicy = role.Properties?.AssumeRolePolicyDocument;
        assert.ok(assumePolicy);
        assert.strictEqual(assumePolicy.Version, '2012-10-17');

        const statement = assumePolicy.Statement[0];
        assert.strictEqual(statement.Effect, 'Allow');
        assert.strictEqual(statement.Principal.Service, 'lambda.amazonaws.com');
        assert.strictEqual(statement.Action, 'sts:AssumeRole');
      });
    });

    it('should include basic Lambda execution policies', () => {
      const role = template.Resources.LessonDeliveryFunctionRole;
      const managedPolicies = role.Properties?.ManagedPolicyArns;

      assert.ok(Array.isArray(managedPolicies));
      assert.ok(managedPolicies?.includes('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'));
      assert.ok(managedPolicies?.includes('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'));
    });

    it('should have appropriate DynamoDB permissions in Lambda roles', () => {
      const role = template.Resources.UserProgressFunctionRole;
      const policies = role.Properties?.Policies;

      assert.ok(Array.isArray(policies));
      const dynamoPolicy = policies?.find(p => p.PolicyName === 'UserProgressFunctionPolicy');
      assert.ok(dynamoPolicy);

      const statement = dynamoPolicy.PolicyDocument.Statement[0];
      const actions = statement.Action;
      assert.ok(actions.includes('dynamodb:GetItem'));
      assert.ok(actions.includes('dynamodb:PutItem'));
      assert.ok(actions.includes('dynamodb:UpdateItem'));
    });
  });

  describe('DynamoDB Tables Tests', () => {
    it('should create LessonsTable with correct schema', () => {
      const lessonsTable = template.Resources.LessonsTable;
      assert.ok(lessonsTable);
      assert.strictEqual(lessonsTable.Type, 'AWS::DynamoDB::Table');
      assert.strictEqual(lessonsTable.Properties?.TableName, 'LessonsTable');
      assert.strictEqual(lessonsTable.Properties?.BillingMode, 'PAY_PER_REQUEST');

      const keySchema = lessonsTable.Properties?.KeySchema;
      assert.ok(Array.isArray(keySchema));
      assert.strictEqual(keySchema?.[0].AttributeName, 'LessonId');
      assert.strictEqual(keySchema?.[0].KeyType, 'HASH');
    });

    it('should create UserProgressTable with composite key', () => {
      const progressTable = template.Resources.UserProgressTable;
      assert.ok(progressTable);
      assert.strictEqual(progressTable.Type, 'AWS::DynamoDB::Table');

      const keySchema = progressTable.Properties?.KeySchema;
      assert.ok(Array.isArray(keySchema));
      assert.strictEqual(keySchema?.length, 2);
      assert.strictEqual(keySchema?.[0].AttributeName, 'UserId');
      assert.strictEqual(keySchema?.[0].KeyType, 'HASH');
      assert.strictEqual(keySchema?.[1].AttributeName, 'Language');
      assert.strictEqual(keySchema?.[1].KeyType, 'RANGE');
    });

    it('should configure Global Secondary Indexes', () => {
      const lessonsTable = template.Resources.LessonsTable;
      const gsi = lessonsTable.Properties?.GlobalSecondaryIndexes;

      assert.ok(Array.isArray(gsi));
      assert.ok(gsi?.length >= 2);

      const languageIndex = gsi?.find(index => index.IndexName === 'LanguageIndex');
      const difficultyIndex = gsi?.find(index => index.IndexName === 'DifficultyIndex');

      assert.ok(languageIndex);
      assert.ok(difficultyIndex);
      assert.strictEqual(languageIndex.Projection.ProjectionType, 'ALL');
      assert.strictEqual(difficultyIndex.Projection.ProjectionType, 'ALL');
    });

    it('should enable encryption and point-in-time recovery', () => {
      const lessonsTable = template.Resources.LessonsTable;
      assert.ok(lessonsTable.Properties?.SSESpecification);
      assert.strictEqual(lessonsTable.Properties?.SSESpecification.SSEEnabled, true);
      assert.ok(lessonsTable.Properties?.PointInTimeRecoverySpecification);
      assert.strictEqual(lessonsTable.Properties?.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled, true);
    });
  });

  describe('S3 Buckets Tests', () => {
    it('should create AudioBucket with correct configuration', () => {
      const audioBucket = template.Resources.AudioBucket;
      assert.ok(audioBucket);
      assert.strictEqual(audioBucket.Type, 'AWS::S3::Bucket');
      assert.strictEqual(audioBucket.Properties?.VersioningConfiguration?.Status, 'Enabled');
    });

    it('should configure S3 bucket encryption', () => {
      const audioBucket = template.Resources.AudioBucket;
      const encryption = audioBucket.Properties?.BucketEncryption;

      assert.ok(encryption);
      assert.ok(encryption.ServerSideEncryptionConfiguration);
      const sseConfig = encryption.ServerSideEncryptionConfiguration[0];
      assert.strictEqual(sseConfig.ServerSideEncryptionByDefault.SSEAlgorithm, 'AES256');
    });

    it('should configure S3 lifecycle policies', () => {
      const audioBucket = template.Resources.AudioBucket;
      const lifecycle = audioBucket.Properties?.LifecycleConfiguration;

      assert.ok(lifecycle);
      assert.ok(Array.isArray(lifecycle.Rules));
      const rule = lifecycle.Rules[0];
      assert.strictEqual(rule.Status, 'Enabled');
      assert.ok(Array.isArray(rule.Transitions));
    });

    it('should create S3 bucket policies for CloudFront access', () => {
      const bucketPolicy = template.Resources.AudioBucketPolicy;
      assert.ok(bucketPolicy);
      assert.strictEqual(bucketPolicy.Type, 'AWS::S3::BucketPolicy');

      const statement = bucketPolicy.Properties?.PolicyDocument.Statement[0];
      assert.strictEqual(statement.Effect, 'Allow');
      assert.strictEqual(statement.Action, 's3:GetObject');
    });
  });

  describe('CloudFront Distribution Tests', () => {
    it('should create CloudFront distribution with correct origins', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      assert.ok(distribution);
      assert.strictEqual(distribution.Type, 'AWS::CloudFront::Distribution');

      const config = distribution.Properties?.DistributionConfig;
      assert.ok(config);
      assert.strictEqual(config.Enabled, true);
      assert.strictEqual(config.HttpVersion, 'http2');
      assert.ok(Array.isArray(config.Origins));
      assert.strictEqual(config.Origins.length, 2);
    });

    it('should configure cache behaviors correctly', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const config = distribution.Properties?.DistributionConfig;

      assert.ok(config.DefaultCacheBehavior);
      assert.strictEqual(config.DefaultCacheBehavior.ViewerProtocolPolicy, 'redirect-to-https');
      assert.strictEqual(config.DefaultCacheBehavior.Compress, true);

      assert.ok(Array.isArray(config.CacheBehaviors));
      const audioBehavior = config.CacheBehaviors.find((b: any) => b.PathPattern === 'audio/*');
      assert.ok(audioBehavior);
    });

    it('should create Origin Access Identity', () => {
      const oai = template.Resources.CloudFrontOriginAccessIdentity;
      assert.ok(oai);
      assert.strictEqual(oai.Type, 'AWS::CloudFront::CloudFrontOriginAccessIdentity');
    });
  });

  describe('EventBridge and SNS Tests', () => {
    it('should create daily lesson reminder rule', () => {
      const rule = template.Resources.DailyLessonReminderRule;
      assert.ok(rule);
      assert.strictEqual(rule.Type, 'AWS::Events::Rule');
      assert.strictEqual(rule.Properties?.ScheduleExpression, 'cron(0 8 * * ? *)');
      assert.strictEqual(rule.Properties?.State, 'ENABLED');
    });

    it('should create learning milestone rule with event pattern', () => {
      const rule = template.Resources.LearningMilestoneRule;
      assert.ok(rule);
      assert.strictEqual(rule.Type, 'AWS::Events::Rule');

      const eventPattern = rule.Properties?.EventPattern;
      assert.ok(eventPattern);
      assert.ok(Array.isArray(eventPattern.source));
      assert.ok(eventPattern.source.includes('custom.languagelearning'));
    });

    it('should create SNS topics with KMS encryption', () => {
      const dailyTopic = template.Resources.DailyReminderTopic;
      const achievementTopic = template.Resources.AchievementTopic;

      assert.ok(dailyTopic);
      assert.ok(achievementTopic);
      assert.strictEqual(dailyTopic.Type, 'AWS::SNS::Topic');
      assert.strictEqual(achievementTopic.Type, 'AWS::SNS::Topic');
      assert.ok(dailyTopic.Properties?.KmsMasterKeyId);
      assert.ok(achievementTopic.Properties?.KmsMasterKeyId);
    });
  });

  describe('CloudWatch Monitoring Tests', () => {
    it('should create CloudWatch dashboard', () => {
      const dashboard = template.Resources.LanguageLearningDashboard;
      assert.ok(dashboard);
      assert.strictEqual(dashboard.Type, 'AWS::CloudWatch::Dashboard');
      assert.strictEqual(dashboard.Properties?.DashboardName, 'LanguageLearningMetrics');
      assert.ok(dashboard.Properties?.DashboardBody);
    });

    it('should create CloudWatch alarms for API Gateway', () => {
      const alarm = template.Resources.ApiGatewayErrorAlarm;
      assert.ok(alarm);
      assert.strictEqual(alarm.Type, 'AWS::CloudWatch::Alarm');
      assert.strictEqual(alarm.Properties?.MetricName, '4XXError');
      assert.strictEqual(alarm.Properties?.Namespace, 'AWS/ApiGateway');
      assert.strictEqual(alarm.Properties?.Threshold, 100);
    });

    it('should create CloudWatch alarms for Lambda functions', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      assert.ok(alarm);
      assert.strictEqual(alarm.Type, 'AWS::CloudWatch::Alarm');
      assert.strictEqual(alarm.Properties?.MetricName, 'Errors');
      assert.strictEqual(alarm.Properties?.Namespace, 'AWS/Lambda');
      assert.strictEqual(alarm.Properties?.Threshold, 10);
    });
  });

  describe('Cognito Authentication Tests', () => {
    it('should create Cognito User Pool with security settings', () => {
      const userPool = template.Resources.UserPool;
      assert.ok(userPool);
      assert.strictEqual(userPool.Type, 'AWS::Cognito::UserPool');
      assert.strictEqual(userPool.Properties?.UserPoolName, 'LanguageLearningUserPool');
      assert.ok(Array.isArray(userPool.Properties?.AutoVerifiedAttributes));
      assert.ok(userPool.Properties?.AutoVerifiedAttributes?.includes('email'));
    });

    it('should configure password policy', () => {
      const userPool = template.Resources.UserPool;
      const passwordPolicy = userPool.Properties?.Policies?.PasswordPolicy;

      assert.ok(passwordPolicy);
      assert.strictEqual(passwordPolicy.MinimumLength, 8);
      assert.strictEqual(passwordPolicy.RequireLowercase, true);
      assert.strictEqual(passwordPolicy.RequireNumbers, true);
      assert.strictEqual(passwordPolicy.RequireSymbols, true);
      assert.strictEqual(passwordPolicy.RequireUppercase, true);
    });

    it('should create User Pool Client', () => {
      const client = template.Resources.UserPoolClient;
      assert.ok(client);
      assert.strictEqual(client.Type, 'AWS::Cognito::UserPoolClient');
      assert.strictEqual(client.Properties?.GenerateSecret, false);
      assert.ok(Array.isArray(client.Properties?.ExplicitAuthFlows));
    });

    it('should create API Gateway authorizer', () => {
      const authorizer = template.Resources.ApiGatewayCognitoAuthorizer;
      assert.ok(authorizer);
      assert.strictEqual(authorizer.Type, 'AWS::ApiGateway::Authorizer');
      assert.strictEqual(authorizer.Properties?.Type, 'COGNITO_USER_POOLS');
    });
  });

  describe('Security and Encryption Tests', () => {
    it('should create KMS key for SNS encryption', () => {
      const kmsKey = template.Resources.SNSEncryptionKey;
      assert.ok(kmsKey);
      assert.strictEqual(kmsKey.Type, 'AWS::KMS::Key');
      assert.strictEqual(kmsKey.Properties?.EnableKeyRotation, true);

      const keyPolicy = kmsKey.Properties?.KeyPolicy;
      assert.ok(keyPolicy);
      assert.strictEqual(keyPolicy.Version, '2012-10-17');
    });

    it('should create Secrets Manager secret', () => {
      const secret = template.Resources.ApiSecrets;
      assert.ok(secret);
      assert.strictEqual(secret.Type, 'AWS::SecretsManager::Secret');
      assert.strictEqual(secret.Properties?.Name, 'LanguageLearningApiKeys');
      assert.ok(secret.Properties?.SecretString);
    });

    it('should create WAF Web ACL with security rules', () => {
      const waf = template.Resources.WebApplicationFirewallAcl;
      assert.ok(waf);
      assert.strictEqual(waf.Type, 'AWS::WAFv2::WebACL');
      assert.strictEqual(waf.Properties?.Scope, 'REGIONAL');

      const rules = waf.Properties?.Rules;
      assert.ok(Array.isArray(rules));
      assert.ok(rules.length >= 3);

      const rateLimitRule = rules.find(r => r.Name === 'RateLimitRule');
      const sqliRule = rules.find(r => r.Name === 'SQLiRule');
      const xssRule = rules.find(r => r.Name === 'XSSRule');

      assert.ok(rateLimitRule);
      assert.ok(sqliRule);
      assert.ok(xssRule);
    });

    it('should associate WAF with API Gateway', () => {
      const association = template.Resources.WafApiAssociation;
      assert.ok(association);
      assert.strictEqual(association.Type, 'AWS::WAFv2::WebACLAssociation');
      assert.ok(association.Properties?.ResourceArn);
      assert.ok(association.Properties?.WebACLArn);
    });
  });

  describe('Resource Tagging Tests', () => {
    it('should tag resources with Application tag', () => {
      const taggedResources = [
        'LessonDeliveryFunction',
        'UserProgressFunction',
        'SpeechRecognitionFunction',
        'LessonsTable',
        'UserProgressTable',
        'AudioBucket',
        'CloudFrontDistribution'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        assert.ok(resource.Properties?.Tags || resource.Tags);

        const tags = resource.Properties?.Tags || resource.Tags;
        const appTag = tags?.find((tag: Tag) => tag.Key === 'Application');
        assert.ok(appTag);
        assert.strictEqual(appTag.Value, 'LanguageLearningApp');
      });
    });
  });

  describe('Outputs Validation Tests', () => {
    it('should have API Gateway URL output', () => {
      const output = template.Outputs.ApiGatewayUrl;
      assert.ok(output);
      assert.ok(output.Description);
      assert.ok(output.Value);
    });

    it('should have CloudFront Distribution URL output', () => {
      const output = template.Outputs.CloudFrontDistributionUrl;
      assert.ok(output);
      assert.ok(output.Description);
      assert.ok(output.Value);
    });

    it('should have all required outputs for integration', () => {
      const requiredOutputs = [
        'ApiGatewayUrl',
        'CloudFrontDistributionUrl',
        'UserPoolId',
        'UserPoolClientId',
        'LessonsTableName',
        'UserProgressTableName',
        'AudioBucketName',
        'StaticContentBucketName',
        'LessonDeliveryFunctionArn',
        'SpeechRecognitionFunctionArn',
        'DashboardUrl'
      ];

      requiredOutputs.forEach(outputName => {
        const output = template.Outputs[outputName];
        assert.ok(output, `Missing output: ${outputName}`);
        assert.ok(output.Description, `Missing description for output: ${outputName}`);
        assert.ok(output.Value, `Missing value for output: ${outputName}`);
      });
    });
  });

  describe('Resource Dependencies Tests', () => {
    it('should have correct dependencies for API Gateway deployment', () => {
      const deployment = template.Resources.ApiGatewayDeployment;
      assert.ok(deployment.DependsOn);

      const dependencies = Array.isArray(deployment.DependsOn)
        ? deployment.DependsOn
        : [deployment.DependsOn];

      const expectedDependencies = [
        'LessonGetMethod',
        'UserProgressGetMethod',
        'SpeechRecognitionPostMethod',
        'GrammarAnalysisPostMethod',
        'RecommendationsGetMethod'
      ];

      expectedDependencies.forEach(dep => {
        assert.ok(dependencies.includes(dep), `Missing dependency: ${dep}`);
      });
    });

    it('should have correct dependencies for WAF association', () => {
      const association = template.Resources.WafApiAssociation;
      assert.ok(association.DependsOn);

      const dependencies = Array.isArray(association.DependsOn)
        ? association.DependsOn
        : [association.DependsOn];

      assert.ok(dependencies.includes('ApiGatewayStage'));
    });
  });

  describe('Template Validation Tests', () => {
    it('should have valid resource references', () => {
      // Test that all Ref and GetAtt references point to existing resources
      const resourceNames = Object.keys(template.Resources);
      const parameterNames = Object.keys(template.Parameters);

      // Helper function to validate references in an object
      const validateReferences = (obj: any, path: string = '') => {
        if (typeof obj === 'object' && obj !== null) {
          if (obj.Ref) {
            const refTarget = obj.Ref;
            const isValidRef = resourceNames.includes(refTarget) ||
              parameterNames.includes(refTarget) ||
              ['AWS::AccountId', 'AWS::Region', 'AWS::StackName'].includes(refTarget);
            assert.ok(isValidRef, `Invalid Ref: ${refTarget} at ${path}`);
          }

          if (obj['Fn::GetAtt']) {
            const getAttTarget = Array.isArray(obj['Fn::GetAtt'])
              ? obj['Fn::GetAtt'][0]
              : obj['Fn::GetAtt'].split('.')[0];
            assert.ok(resourceNames.includes(getAttTarget),
              `Invalid GetAtt target: ${getAttTarget} at ${path}`);
          }

          Object.entries(obj).forEach(([key, value]) => {
            validateReferences(value, `${path}.${key}`);
          });
        }
      };

      Object.entries(template.Resources).forEach(([resourceName, resource]) => {
        validateReferences(resource, `Resources.${resourceName}`);
      });

      Object.entries(template.Outputs).forEach(([outputName, output]) => {
        validateReferences(output, `Outputs.${outputName}`);
      });
    });

    it('should have consistent naming patterns', () => {
      const resourceNames = Object.keys(template.Resources);

      // Check Lambda function naming consistency
      const lambdaFunctions = resourceNames.filter(name =>
        template.Resources[name].Type === 'AWS::Lambda::Function'
      );

      lambdaFunctions.forEach(functionName => {
        assert.ok(functionName.endsWith('Function'),
          `Lambda function ${functionName} should end with 'Function'`);
      });

      // Check DLQ naming consistency
      const dlqs = resourceNames.filter(name =>
        template.Resources[name].Type === 'AWS::SQS::Queue' &&
        name.includes('DLQ')
      );

      dlqs.forEach(dlqName => {
        assert.ok(dlqName.endsWith('DLQ'),
          `DLQ ${dlqName} should end with 'DLQ'`);
      });
    });
  });
});

export { };
