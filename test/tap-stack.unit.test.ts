import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
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

  describe('S3 Buckets', () => {
    test('Should create Recipe Media Bucket with versioning and encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('meal-planning-media-.*'),
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
        BucketName: Match.stringLikeRegexp('meal-plan-documents-.*'),
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
  });

  describe('DynamoDB Tables', () => {
    test('Should create Recipes Table with GSI for dietary requirements', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'meal-planning-recipes',
        BillingMode: 'PAY_PER_REQUEST',
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'DietaryRequirementsIndex',
          }),
        ]),
      });
    });

    test('Should create User Preferences Table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'meal-planning-user-preferences',
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('Should create Meal Plans Table with TTL', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'meal-planning-meal-plans',
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true,
        },
      });
    });

    test('Should create Grocery Lists Table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'meal-planning-grocery-lists',
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('Should create Nutritional Data Table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'meal-planning-nutritional-data',
        BillingMode: 'PAY_PER_REQUEST',
      });
    });
  });

  describe('SNS Topics', () => {
    test('Should create Grocery Reminder Topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Grocery Shopping Reminders',
        TopicName: 'meal-planning-grocery-reminders',
      });
    });

    test('Should create Meal Plan Notification Topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Meal Plan Notifications',
        TopicName: 'meal-planning-notifications',
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
    test('Should create REST API with CORS configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'Meal Planning Service',
      });
    });

    test('Should create API Deployment', () => {
      template.resourceCountIs('AWS::ApiGateway::Deployment', 1);
    });

    test('Should create API Stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('Should create Weekly Meal Plan Generation Rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: 'weekly-meal-plan-generation',
        ScheduleExpression: 'cron(0 6 * * SUN *)',
      });
    });

    test('Should create Daily Meal Plan Generation Rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: 'daily-meal-plan-generation',
        ScheduleExpression: 'cron(0 8 * * * *)',
      });
    });

    test('Should create Grocery Reminder Rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: 'grocery-shopping-reminder',
        ScheduleExpression: 'cron(0 10 * * SAT *)',
      });
    });
  });

  describe('CloudWatch Resources', () => {
    test('Should create CloudWatch Dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'meal-planning-system-metrics',
      });
    });

    test('Should create CloudWatch Alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });

    test('Should create Log Groups for Lambda functions', () => {
      template.resourceCountIs(
        'AWS::Logs::LogGroup',
        Match.anyValue()
      );
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
  });
});
