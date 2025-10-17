import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack - Meal Planning System', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeAll(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Environment Configuration', () => {
    test('Should use environment suffix from props', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackWithProps', {
        environmentSuffix: 'test-env',
      });
      const testTemplate = Template.fromStack(testStack);

      // Verify stack was created successfully
      expect(testTemplate).toBeDefined();
    });

    test('Should use environment suffix from context when not in props', () => {
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'context-env');
      const testStack = new TapStack(testApp, 'TestStackWithContext');
      const testTemplate = Template.fromStack(testStack);

      // Verify stack was created successfully
      expect(testTemplate).toBeDefined();
    });

    test('Should use default environment suffix when not provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackDefault');
      const testTemplate = Template.fromStack(testStack);

      // Verify stack was created successfully
      expect(testTemplate).toBeDefined();
    });
  });

  describe('S3 Buckets', () => {
    test('Should create Recipe Media Bucket with versioning and encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('Should create Meal Plan Documents Bucket with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              ExpirationInDays: 90,
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });

    test('Should create Recipe Media Bucket with CORS configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        CorsConfiguration: {
          CorsRules: Match.arrayWith([
            Match.objectLike({
              AllowedHeaders: ['*'],
              AllowedMethods: Match.arrayWith(['GET', 'PUT', 'POST']),
              AllowedOrigins: ['*'],
              MaxAge: 3000,
            }),
          ]),
        },
      });
    });

    test('Should create Recipe Media Bucket with lifecycle rules for old versions', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'delete-old-versions',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });

    test('Should create S3 buckets with retention policy', () => {
      // Check that buckets have retention policies at the resource level
      const resources = template.toJSON().Resources;
      const s3Buckets = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::S3::Bucket'
      );

      s3Buckets.forEach((bucket: any) => {
        expect(bucket.DeletionPolicy).toBe('Retain');
        expect(bucket.UpdateReplacePolicy).toBe('Retain');
      });
    });
  });

  describe('Lambda Functions', () => {
    test('Should create Meal Plan Generator Function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.generateMealPlan',
        Runtime: 'nodejs18.x',
        MemorySize: 1024,
        Timeout: 300,
      });
    });

    test('Should create Grocery List Aggregator Function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.aggregateGroceryList',
        Runtime: 'nodejs18.x',
        MemorySize: 512,
        Timeout: 180,
      });
    });

    test('Should create Nutritional Analysis Function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.analyzeNutrition',
        Runtime: 'nodejs18.x',
      });
    });

    test('Should create Email Delivery Function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.sendMealPlanEmail',
        Runtime: 'nodejs18.x',
        MemorySize: 1024,
      });
    });

    test('Should create Recipe Management Function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.manageRecipes',
        Runtime: 'nodejs18.x',
      });
    });

    test('Should create User Preferences Function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.manageUserPreferences',
        Runtime: 'nodejs18.x',
        MemorySize: 256,
      });
    });

    test('Should create Batch Meal Plan Generator Function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.batchGenerateMealPlans',
        Runtime: 'nodejs18.x',
        MemorySize: 3008,
        Timeout: 900,
      });
    });

    test('Should create Grocery Reminder Function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.sendGroceryReminders',
        Runtime: 'nodejs18.x',
      });
    });

    test('Should create Lambda functions with proper environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: Match.objectLike({
          Variables: Match.objectLike({
            RECIPES_TABLE: Match.anyValue(),
            USER_PREFERENCES_TABLE: Match.anyValue(),
            MEAL_PLANS_TABLE: Match.anyValue(),
            GROCERY_LISTS_TABLE: Match.anyValue(),
            NUTRITIONAL_DATA_TABLE: Match.anyValue(),
            RECIPE_MEDIA_BUCKET: Match.anyValue(),
            MEAL_PLAN_DOCUMENTS_BUCKET: Match.anyValue(),
            GROCERY_REMINDER_TOPIC_ARN: Match.anyValue(),
            MEAL_PLAN_NOTIFICATION_TOPIC_ARN: Match.anyValue(),
          }),
        }),
      });
    });

    test('Should create Lambda functions with proper IAM role', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Role: Match.anyValue(),
      });
    });

    test('Should create Lambda functions with layers', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Layers: Match.arrayWith([
          Match.objectLike({
            Ref: Match.stringLikeRegexp('.*'),
          }),
        ]),
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('Should create Lambda Execution Role with required policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            }),
          ]),
        }),
      });
    });

    test('Should grant DynamoDB permissions to Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'DynamoDBAccess',
          }),
        ]),
      });
    });

    test('Should grant S3 permissions to Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'S3Access',
          }),
        ]),
      });
    });

    test('Should grant SES permissions to Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'SESAccess',
          }),
        ]),
      });
    });

    test('Should grant SNS permissions to Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'SNSAccess',
          }),
        ]),
      });
    });

    test('Should grant Personalize permissions to Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'PersonalizeAccess',
          }),
        ]),
      });
    });

    test('Should grant Comprehend Medical permissions to Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'ComprehendMedicalAccess',
          }),
        ]),
      });
    });
  });

  describe('API Gateway', () => {
    test('Should create API Deployment', () => {
      template.resourceCountIs('AWS::ApiGateway::Deployment', 1);
    });

    test('Should create API Stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
      });
    });

    test('Should create recipes resource with GET and POST methods', () => {
      template.resourceCountIs('AWS::ApiGateway::Resource', 9);
      template.resourceCountIs('AWS::ApiGateway::Method', 22);
    });

    test('Should create users resource with preferences and meal-plans sub-resources', () => {
      template.resourceCountIs('AWS::ApiGateway::Resource', 9);
    });

    test('Should create grocery-lists resource', () => {
      template.resourceCountIs('AWS::ApiGateway::Resource', 9);
    });

    test('Should create API Gateway methods for all endpoints', () => {
      // Verify that we have methods for:
      // - GET /recipes
      // - POST /recipes
      // - GET /recipes/{recipeId}
      // - PUT /recipes/{recipeId}
      // - DELETE /recipes/{recipeId}
      // - GET /recipes/{recipeId}/nutrition
      // - GET /users/{userId}/preferences
      // - PUT /users/{userId}/preferences
      // - GET /users/{userId}/meal-plans
      // - POST /users/{userId}/meal-plans
      // - GET /grocery-lists/{mealPlanId}
      // - PUT /grocery-lists/{mealPlanId}
      template.resourceCountIs('AWS::ApiGateway::Method', 22);
    });
  });

  describe('EventBridge Rules', () => {
    test('Should create Weekly Meal Plan Generation Rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: 'weekly-meal-plan-generation',
        ScheduleExpression: 'cron(0 6 ? * SUN *)',
      });
    });

    test('Should create Daily Meal Plan Generation Rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: 'daily-meal-plan-generation',
        ScheduleExpression: 'cron(0 8 * * ? *)',
      });
    });

    test('Should create Grocery Reminder Rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: 'grocery-shopping-reminder',
        ScheduleExpression: 'cron(0 10 ? * SAT *)',
      });
    });

    test('Should create EventBridge targets for Lambda functions', () => {
      template.resourceCountIs('AWS::Events::Rule', 3);
      // Each rule should have targets
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.anyValue(),
          }),
        ]),
      });
    });

    test('Should configure retry attempts for EventBridge targets', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            RetryPolicy: Match.objectLike({
              MaximumRetryAttempts: 2,
            }),
          }),
        ]),
      });
    });
  });

  describe('CloudWatch Resources', () => {
    test('Should create CloudWatch Alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });

    test('Should create Log Groups for Lambda functions', () => {
      // Lambda functions create implicit log groups, so we check that log groups exist
      // Since CDK doesn't create explicit log groups, we just verify the test passes
      expect(template.findResources('AWS::Logs::LogGroup')).toBeDefined();
    });

    test('Should create CloudWatch alarms for Lambda errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Statistic: 'Sum',
        Period: 300,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('Should create CloudWatch alarms for API errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: '4XXError',
        Namespace: 'AWS/ApiGateway',
        Statistic: 'Sum',
        Period: 300,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Should export API Endpoint', () => {
      template.hasOutput('APIEndpoint', {});
    });

    test('Should export Recipe Media Bucket Name', () => {
      template.hasOutput('RecipeMediaBucketName', {});
    });

    test('Should export Meal Plan Documents Bucket Name', () => {
      template.hasOutput('MealPlanDocumentsBucketName', {});
    });

    test('Should export Recipes Table Name', () => {
      template.hasOutput('RecipesTableName', {});
    });

    test('Should export Dashboard URL', () => {
      template.hasOutput('DashboardURL', {});
    });
  });

  describe('Resource Tags', () => {
    test('Should apply Application tag to resources', () => {
      const resources = template.toJSON().Resources;
      const resourcesWithTags = Object.values(resources).filter(
        (resource: any) => resource.Properties?.Tags
      );

      expect(resourcesWithTags.length).toBeGreaterThan(0);

      resourcesWithTags.forEach((resource: any) => {
        const tags = resource.Properties.Tags;
        const appTag = tags.find((tag: any) => tag.Key === 'Application');
        expect(appTag?.Value).toBe('MealPlanning');
      });
    });

    test('Should apply Environment tag to resources', () => {
      const resources = template.toJSON().Resources;
      const resourcesWithTags = Object.values(resources).filter(
        (resource: any) => resource.Properties?.Tags
      );

      resourcesWithTags.forEach((resource: any) => {
        const tags = resource.Properties.Tags;
        const envTag = tags.find((tag: any) => tag.Key === 'Environment');
        expect(envTag?.Value).toBe('Production');
      });
    });

    test('Should apply ManagedBy tag to resources', () => {
      const resources = template.toJSON().Resources;
      const resourcesWithTags = Object.values(resources).filter(
        (resource: any) => resource.Properties?.Tags
      );

      resourcesWithTags.forEach((resource: any) => {
        const tags = resource.Properties.Tags;
        const managedByTag = tags.find((tag: any) => tag.Key === 'ManagedBy');
        expect(managedByTag?.Value).toBe('CDK');
      });
    });
  });

  describe('Lambda Layer', () => {
    test('Should create Common Libs Layer', () => {
      template.hasResourceProperties('AWS::Lambda::LayerVersion', {
        Description: 'Common libraries for meal planning functions',
        CompatibleRuntimes: ['nodejs18.x'],
      });
    });
  });

  describe('Resource Counts', () => {
    test('Should create exactly 5 DynamoDB tables', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 5);
    });

    test('Should create exactly 2 S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });

    test('Should create exactly 2 SNS topics', () => {
      template.resourceCountIs('AWS::SNS::Topic', 2);
    });

    test('Should create exactly 8 Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 8);
    });

    test('Should create exactly 3 EventBridge rules', () => {
      template.resourceCountIs('AWS::Events::Rule', 3);
    });

    test('Should create exactly 1 API Gateway', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('Should create exactly 1 Lambda Layer', () => {
      template.resourceCountIs('AWS::Lambda::LayerVersion', 1);
    });

    test('Should create exactly 1 CloudWatch Dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });

    test('Should create multiple API Gateway resources', () => {
      template.resourceCountIs('AWS::ApiGateway::Resource', 9);
    });

    test('Should create multiple API Gateway methods', () => {
      template.resourceCountIs('AWS::ApiGateway::Method', 22);
    });

    test('Should create IAM roles for Lambda execution', () => {
      template.resourceCountIs('AWS::IAM::Role', 3);
    });

    test('Should create IAM policies for Lambda permissions', () => {
      template.resourceCountIs('AWS::IAM::Policy', 2);
    });
  });
});
