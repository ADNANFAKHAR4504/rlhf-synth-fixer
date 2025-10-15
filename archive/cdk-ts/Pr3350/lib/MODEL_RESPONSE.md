### Reasoning Trace
---

This is a comprehensive requirement for a meal planning system using AWS CDK with TypeScript. Let's break down what I need to build:

1. A CDK application that provisions all the necessary AWS resources
2. The stack name should be TapStack
3. It needs to handle generating 4,000 personalized weekly meal plans daily
4. Key components include:
   - API Gateway
   - Lambda functions for meal planning, grocery lists, nutritional analysis
   - DynamoDB for recipes and user data
   - S3 for image storage
   - Amazon Personalize for recommendations
   - Comprehend Medical for nutritional extraction
   - EventBridge for scheduling
   - SES for email delivery
   - SNS for notifications
   - CloudWatch for monitoring
   - IAM roles for security

I'll create a single TypeScript file that defines all these resources using AWS CDK. Let's start by importing all the necessary CDK libraries and then define our stack.

I'll structure the code as follows:
1. Import necessary CDK modules
2. Define the TapStack class
3. Set up IAM roles and permissions
4. Create the data storage components (DynamoDB, S3)
5. Set up the processing layer with Lambda functions
6. Configure the API Gateway
7. Implement Amazon Personalize and Comprehend Medical
8. Set up EventBridge for scheduling
9. Configure SES and SNS for communication
10. Implement CloudWatch for monitoring
11. Define the main function to initialize the stack

Let's write the code:
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as personalize from 'aws-cdk-lib/aws-personalize';
import * as comprehend from 'aws-cdk-lib/aws-comprehend';
import * as logs from 'aws-cdk-lib/aws-logs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. IAM Roles and Permissions
    const lambdaExecutionRole = new iam.Role(this, 'MealPlanningLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });
    
    // Add additional permissions for various services
    lambdaExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));
    lambdaExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
    lambdaExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSESFullAccess'));
    lambdaExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSNSFullAccess'));
    lambdaExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonPersonalizeFullAccess'));
    lambdaExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('ComprehendFullAccess'));

    // 2. Data Storage - DynamoDB Tables
    
    // Recipe Database Table
    const recipeTable = new dynamodb.Table(this, 'RecipeTable', {
      partitionKey: { name: 'recipeId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });
    
    // Add Global Secondary Index for querying by dietary restrictions
    recipeTable.addGlobalSecondaryIndex({
      indexName: 'DietaryRestrictionIndex',
      partitionKey: { name: 'dietaryCategory', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'calories', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // User Preferences Table
    const userPreferencesTable = new dynamodb.Table(this, 'UserPreferencesTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // Meal Plan History Table
    const mealPlanHistoryTable = new dynamodb.Table(this, 'MealPlanHistoryTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'weekStartDate', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });
    
    // 3. S3 Buckets for Recipe Images and Documents
    const recipeImagesBucket = new s3.Bucket(this, 'RecipeImagesBucket', {
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          maxAge: 3000,
        },
      ],
    });
    
    const mealPlanDocumentsBucket = new s3.Bucket(this, 'MealPlanDocumentsBucket', {
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });
    
    // 4. Lambda Functions
    
    // Meal Plan Generation Lambda
    const mealPlanGenerationLambda = new NodejsFunction(this, 'MealPlanGenerationFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'meal-plan-generation.ts'), // This would be the path to your lambda code
      timeout: cdk.Duration.minutes(10),
      memorySize: 1024,
      role: lambdaExecutionRole,
      environment: {
        RECIPE_TABLE_NAME: recipeTable.tableName,
        USER_PREFERENCES_TABLE_NAME: userPreferencesTable.tableName,
        MEAL_PLAN_HISTORY_TABLE_NAME: mealPlanHistoryTable.tableName,
        RECIPE_IMAGES_BUCKET_NAME: recipeImagesBucket.bucketName,
        MEAL_PLAN_DOCUMENTS_BUCKET_NAME: mealPlanDocumentsBucket.bucketName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
    
    // Grocery List Generation Lambda
    const groceryListLambda = new NodejsFunction(this, 'GroceryListFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'grocery-list.ts'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      role: lambdaExecutionRole,
      environment: {
        RECIPE_TABLE_NAME: recipeTable.tableName,
        MEAL_PLAN_HISTORY_TABLE_NAME: mealPlanHistoryTable.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
    
    // Nutritional Analysis Lambda
    const nutritionalAnalysisLambda = new NodejsFunction(this, 'NutritionalAnalysisFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'nutritional-analysis.ts'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      role: lambdaExecutionRole,
      environment: {
        RECIPE_TABLE_NAME: recipeTable.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
    
    // PDF Generation Lambda for Email Attachments
    const pdfGenerationLambda = new NodejsFunction(this, 'PDFGenerationFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'pdf-generation.ts'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      role: lambdaExecutionRole,
      environment: {
        MEAL_PLAN_DOCUMENTS_BUCKET_NAME: mealPlanDocumentsBucket.bucketName,
        RECIPE_IMAGES_BUCKET_NAME: recipeImagesBucket.bucketName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
    
    // Email Sending Lambda
    const emailSendingLambda = new NodejsFunction(this, 'EmailSendingFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'email-sending.ts'),
      timeout: cdk.Duration.minutes(3),
      memorySize: 512,
      role: lambdaExecutionRole,
      environment: {
        MEAL_PLAN_DOCUMENTS_BUCKET_NAME: mealPlanDocumentsBucket.bucketName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
    
    // 5. API Gateway
    const api = new apigateway.RestApi(this, 'MealPlanningApi', {
      description: 'API for meal planning system',
      deployOptions: {
        stageName: 'prod',
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });
    
    // API Resources and Methods
    const mealPlansResource = api.root.addResource('mealplans');
    const userMealPlansResource = mealPlansResource.addResource('{userId}');
    
    // GET method to retrieve user meal plans
    userMealPlansResource.addMethod('GET', new apigateway.LambdaIntegration(mealPlanGenerationLambda));
    
    // POST method to generate a new meal plan
    userMealPlansResource.addMethod('POST', new apigateway.LambdaIntegration(mealPlanGenerationLambda));
    
    const groceryListResource = userMealPlansResource.addResource('grocerylist');
    groceryListResource.addMethod('GET', new apigateway.LambdaIntegration(groceryListLambda));
    
    const nutritionResource = userMealPlansResource.addResource('nutrition');
    nutritionResource.addMethod('GET', new apigateway.LambdaIntegration(nutritionalAnalysisLambda));
    
    // 6. EventBridge for Scheduling
    
    // Daily meal plan generation schedule (4,000 plans)
    const mealPlanGenerationRule = new events.Rule(this, 'DailyMealPlanGenerationRule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '1' }), // Run daily at 1:00 AM UTC
      description: 'Triggers daily meal plan generation for users',
    });
    
    mealPlanGenerationRule.addTarget(new targets.LambdaFunction(mealPlanGenerationLambda));
    
    // Weekly grocery reminder schedule
    const groceryReminderRule = new events.Rule(this, 'WeeklyGroceryReminderRule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '10', dayOfWeek: '5' }), // Run Friday at 10:00 AM UTC
      description: 'Triggers weekly grocery shopping reminders',
    });
    
    // Lambda function for processing grocery reminders
    const groceryReminderLambda = new NodejsFunction(this, 'GroceryReminderFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'grocery-reminder.ts'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      role: lambdaExecutionRole,
      environment: {
        USER_PREFERENCES_TABLE_NAME: userPreferencesTable.tableName,
        MEAL_PLAN_HISTORY_TABLE_NAME: mealPlanHistoryTable.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
    
    groceryReminderRule.addTarget(new targets.LambdaFunction(groceryReminderLambda));
    
    // 7. SNS for Notifications
    
    // Grocery reminder notification topic
    const groceryReminderTopic = new sns.Topic(this, 'GroceryReminderTopic', {
      displayName: 'Grocery Shopping Reminders',
    });
    
    // Grant permissions to the grocery reminder Lambda to publish to the topic
    groceryReminderTopic.grantPublish(groceryReminderLambda);
    
    // System alerts topic for operational monitoring
    const systemAlertsTopic = new sns.Topic(this, 'SystemAlertsTopic', {
      displayName: 'Meal Planning System Alerts',
    });
    
    // 8. CloudWatch Monitoring
    
    // API Gateway Metrics Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'MealPlanningDashboard', {
      dashboardName: 'MealPlanning-Metrics',
    });
    
    // Lambda execution metrics
    const mealPlanGenerationMetrics = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Invocations',
      dimensionsMap: {
        FunctionName: mealPlanGenerationLambda.functionName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });
    
    const mealPlanGenerationErrorMetric = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Errors',
      dimensionsMap: {
        FunctionName: mealPlanGenerationLambda.functionName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });
    
    // Set up CloudWatch alarms for critical functions
    const mealPlanGenerationErrorAlarm = new cloudwatch.Alarm(this, 'MealPlanGenerationErrorAlarm', {
      metric: mealPlanGenerationErrorMetric,
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'Alert when meal plan generation has more than 5 errors in 5 minutes',
      actionsEnabled: true,
    });
    
    mealPlanGenerationErrorAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(systemAlertsTopic));
    
    // Add metrics to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Meal Plan Generation Lambda Metrics',
        left: [mealPlanGenerationMetrics, mealPlanGenerationErrorMetric],
        width: 12,
      })
    );
    
    // 9. SES Configuration for Email Delivery
    
    // Assume SES identity verification is handled separately
    // The email sending Lambda will use the SES API to send emails with PDFs
    
    // 10. Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'Endpoint URL of the meal planning API',
    });
    
    new cdk.CfnOutput(this, 'RecipeTableName', {
      value: recipeTable.tableName,
      description: 'Name of the Recipe DynamoDB table',
    });
    
    new cdk.CfnOutput(this, 'RecipeImagesBucketName', {
      value: recipeImagesBucket.bucketName,
      description: 'Name of the S3 bucket for recipe images',
    });
    
    new cdk.CfnOutput(this, 'MealPlanDocumentsBucketName', {
      value: mealPlanDocumentsBucket.bucketName,
      description: 'Name of the S3 bucket for meal plan documents',
    });
  }
}

// Main function to bootstrap the CDK application
const app = new cdk.App();
new TapStack(app, 'TapStack', {
  env: { 
    region: 'us-west-2' 
  },
  description: 'Meal Planning System for Personalized Nutrition App'
});
```

I noticed that I've included import statements for `personalize` and `comprehend` but I haven't actually implemented those services in the stack. Let me add those implementations:

```typescript
// Adding Amazon Personalize components to the TapStack constructor

// Personalize Dataset Group for meal recommendations
const personalizeDatasetGroup = new cdk.CfnResource(this, 'PersonalizeDatasetGroup', {
  type: 'AWS::Personalize::DatasetGroup',
  properties: {
    Name: 'MealRecommendationDatasetGroup',
  },
});

// Personalize Schema for user data
const userDataSchema = new cdk.CfnResource(this, 'UserDataSchema', {
  type: 'AWS::Personalize::Schema',
  properties: {
    Name: 'MealPlanningUserSchema',
    Domain: 'ECOMMERCE',
    Schema: JSON.stringify({
      type: 'record',
      name: 'Users',
      namespace: 'com.mealplanning.schema',
      fields: [
        { name: 'USER_ID', type: 'string' },
        { name: 'DIETARY_PREFERENCE', type: 'string' },
        { name: 'ALLERGIES', type: ['null', 'string'], default: null },
        { name: 'HEALTH_GOALS', type: ['null', 'string'], default: null }
      ]
    }),
  },
});

// Personalize Schema for item (recipe) data
const itemDataSchema = new cdk.CfnResource(this, 'ItemDataSchema', {
  type: 'AWS::Personalize::Schema',
  properties: {
    Name: 'MealPlanningItemSchema',
    Domain: 'ECOMMERCE',
    Schema: JSON.stringify({
      type: 'record',
      name: 'Items',
      namespace: 'com.mealplanning.schema',
      fields: [
        { name: 'ITEM_ID', type: 'string' },
        { name: 'RECIPE_NAME', type: 'string' },
        { name: 'CATEGORY', type: 'string' },
        { name: 'DIETARY_TAGS', type: ['null', 'string'], default: null },
        { name: 'CALORIES', type: 'int' },
        { name: 'PROTEIN', type: 'int' },
        { name: 'CARBS', type: 'int' },
        { name: 'FAT', type: 'int' }
      ]
    }),
  },
});

// Personalize Dataset for users
const userDataset = new cdk.CfnResource(this, 'UserDataset', {
  type: 'AWS::Personalize::Dataset',
  properties: {
    DatasetGroupArn: personalizeDatasetGroup.getAtt('DatasetGroupArn').toString(),
    DatasetType: 'Users',
    SchemaArn: userDataSchema.getAtt('SchemaArn').toString(),
    Name: 'MealPlanningUserDataset',
  },
});

// Personalize Dataset for items (recipes)
const itemDataset = new cdk.CfnResource(this, 'ItemDataset', {
  type: 'AWS::Personalize::Dataset',
  properties: {
    DatasetGroupArn: personalizeDatasetGroup.getAtt('DatasetGroupArn').toString(),
    DatasetType: 'Items',
    SchemaArn: itemDataSchema.getAtt('SchemaArn').toString(),
    Name: 'MealPlanningItemDataset',
  },
});

// Personalize Dataset for user-item interactions
const interactionSchema = new cdk.CfnResource(this, 'InteractionSchema', {
  type: 'AWS::Personalize::Schema',
  properties: {
    Name: 'MealPlanningInteractionSchema',
    Schema: JSON.stringify({
      type: 'record',
      name: 'Interactions',
      namespace: 'com.mealplanning.schema',
      fields: [
        { name: 'USER_ID', type: 'string' },
        { name: 'ITEM_ID', type: 'string' },
        { name: 'EVENT_TYPE', type: 'string' },
        { name: 'TIMESTAMP', type: 'long' },
        { name: 'RATING', type: ['null', 'float'], default: null }
      ]
    }),
  },
});

const interactionDataset = new cdk.CfnResource(this, 'InteractionDataset', {
  type: 'AWS::Personalize::Dataset',
  properties: {
    DatasetGroupArn: personalizeDatasetGroup.getAtt('DatasetGroupArn').toString(),
    DatasetType: 'Interactions',
    SchemaArn: interactionSchema.getAtt('SchemaArn').toString(),
    Name: 'MealPlanningInteractionDataset',
  },
});

// Recipe Recommender Lambda that uses Amazon Personalize
const recipeRecommenderLambda = new NodejsFunction(this, 'RecipeRecommenderFunction', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'handler',
  entry: path.join(__dirname, 'recipe-recommender.ts'),
  timeout: cdk.Duration.minutes(5),
  memorySize: 1024,
  role: lambdaExecutionRole,
  environment: {
    DATASET_GROUP_ARN: personalizeDatasetGroup.getAtt('DatasetGroupArn').toString(),
    RECIPE_TABLE_NAME: recipeTable.tableName,
    USER_PREFERENCES_TABLE_NAME: userPreferencesTable.tableName,
  },
  logRetention: logs.RetentionDays.ONE_WEEK,
  tracing: lambda.Tracing.ACTIVE,
});

// Add API endpoint for recipe recommendations
const recommendationsResource = api.root.addResource('recommendations');
const userRecommendationsResource = recommendationsResource.addResource('{userId}');
userRecommendationsResource.addMethod('GET', new apigateway.LambdaIntegration(recipeRecommenderLambda));

// Nutritional Information Extractor Lambda that uses Comprehend Medical
const nutritionalExtractionLambda = new NodejsFunction(this, 'NutritionalExtractionFunction', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'handler',
  entry: path.join(__dirname, 'nutritional-extraction.ts'),
  timeout: cdk.Duration.minutes(5),
  memorySize: 1024,
  role: lambdaExecutionRole,
  environment: {
    RECIPE_TABLE_NAME: recipeTable.tableName,
  },
  logRetention: logs.RetentionDays.ONE_WEEK,
  tracing: lambda.Tracing.ACTIVE,
});

// Add API endpoint for nutritional extraction
const extractionResource = api.root.addResource('extract-nutrition');
extractionResource.addMethod('POST', new apigateway.LambdaIntegration(nutritionalExtractionLambda));
```

Now let's combine all of this into one final, comprehensive TypeScript file for our TapStack:

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. IAM Roles and Permissions
    const lambdaExecutionRole = new iam.Role(this, 'MealPlanningLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });
    
    // Add additional permissions for various services
    lambdaExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));
    lambdaExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
    lambdaExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSESFullAccess'));
    lambdaExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSNSFullAccess'));
    lambdaExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('ComprehendMedicalFullAccess'));

    // 2. Data Storage - DynamoDB Tables
    
    // Recipe Database Table
    const recipeTable = new dynamodb.Table(this, 'RecipeTable', {
      partitionKey: { name: 'recipeId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });
    
    // Add Global Secondary Index for querying by dietary restrictions
    recipeTable.addGlobalSecondaryIndex({
      indexName: 'DietaryRestrictionIndex',
      partitionKey: { name: 'dietaryCategory', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'calories', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // User Preferences Table
    const userPreferencesTable = new dynamodb.Table(this, 'UserPreferencesTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // Meal Plan History Table
    const mealPlanHistoryTable = new dynamodb.Table(this, 'MealPlanHistoryTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'weekStartDate', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });
    
    // 3. S3 Buckets for Recipe Images and Documents
    const recipeImagesBucket = new s3.Bucket(this, 'RecipeImagesBucket', {
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          maxAge: 3000,
        },
      ],
    });
    
    const mealPlanDocumentsBucket = new s3.Bucket(this, 'MealPlanDocumentsBucket', {
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });
    
    // 4. Lambda Functions
    
    // Meal Plan Generation Lambda
    const mealPlanGenerationLambda = new NodejsFunction(this, 'MealPlanGenerationFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'meal-plan-generation.ts'), // This would be the path to your lambda code
      timeout: cdk.Duration.minutes(10),
      memorySize: 1024,
      role: lambdaExecutionRole,
      environment: {
        RECIPE_TABLE_NAME: recipeTable.tableName,
        USER_PREFERENCES_TABLE_NAME: userPreferencesTable.tableName,
        MEAL_PLAN_HISTORY_TABLE_NAME: mealPlanHistoryTable.tableName,
        RECIPE_IMAGES_BUCKET_NAME: recipeImagesBucket.bucketName,
        MEAL_PLAN_DOCUMENTS_BUCKET_NAME: mealPlanDocumentsBucket.bucketName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
    
    // Grocery List Generation Lambda
    const groceryListLambda = new NodejsFunction(this, 'GroceryListFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'grocery-list.ts'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      role: lambdaExecutionRole,
      environment: {
        RECIPE_TABLE_NAME: recipeTable.tableName,
        MEAL_PLAN_HISTORY_TABLE_NAME: mealPlanHistoryTable.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
    
    // Nutritional Analysis Lambda
    const nutritionalAnalysisLambda = new NodejsFunction(this, 'NutritionalAnalysisFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'nutritional-analysis.ts'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      role: lambdaExecutionRole,
      environment: {
        RECIPE_TABLE_NAME: recipeTable.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
    
    // PDF Generation Lambda for Email Attachments
    const pdfGenerationLambda = new NodejsFunction(this, 'PDFGenerationFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'pdf-generation.ts'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      role: lambdaExecutionRole,
      environment: {
        MEAL_PLAN_DOCUMENTS_BUCKET_NAME: mealPlanDocumentsBucket.bucketName,
        RECIPE_IMAGES_BUCKET_NAME: recipeImagesBucket.bucketName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
    
    // Email Sending Lambda
    const emailSendingLambda = new NodejsFunction(this, 'EmailSendingFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'email-sending.ts'),
      timeout: cdk.Duration.minutes(3),
      memorySize: 512,
      role: lambdaExecutionRole,
      environment: {
        MEAL_PLAN_DOCUMENTS_BUCKET_NAME: mealPlanDocumentsBucket.bucketName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
    
    // Nutritional Information Extractor Lambda that uses Comprehend Medical
    const nutritionalExtractionLambda = new NodejsFunction(this, 'NutritionalExtractionFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'nutritional-extraction.ts'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      role: lambdaExecutionRole,
      environment: {
        RECIPE_TABLE_NAME: recipeTable.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
    
    // 5. API Gateway
    const api = new apigateway.RestApi(this, 'MealPlanningApi', {
      description: 'API for meal planning system',
      deployOptions: {
        stageName: 'prod',
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });
    
    // API Resources and Methods
    const mealPlansResource = api.root.addResource('mealplans');
    const userMealPlansResource = mealPlansResource.addResource('{userId}');
    
    // GET method to retrieve user meal plans
    userMealPlansResource.addMethod('GET', new apigateway.LambdaIntegration(mealPlanGenerationLambda));
    
    // POST method to generate a new meal plan
    userMealPlansResource.addMethod('POST', new apigateway.LambdaIntegration(mealPlanGenerationLambda));
    
    const groceryListResource = userMealPlansResource.addResource('grocerylist');
    groceryListResource.addMethod('GET', new apigateway.LambdaIntegration(groceryListLambda));
    
    const nutritionResource = userMealPlansResource.addResource('nutrition');
    nutritionResource.addMethod('GET', new apigateway.LambdaIntegration(nutritionalAnalysisLambda));
    
    // Add API endpoint for nutritional extraction
    const extractionResource = api.root.addResource('extract-nutrition');
    extractionResource.addMethod('POST', new apigateway.LambdaIntegration(nutritionalExtractionLambda));
    
    // 6. Amazon Personalize for Recommendations
    
    // Personalize Dataset Group for meal recommendations
    const personalizeDatasetGroup = new cdk.CfnResource(this, 'PersonalizeDatasetGroup', {
      type: 'AWS::Personalize::DatasetGroup',
      properties: {
        Name: 'MealRecommendationDatasetGroup',
      },
    });

    // Personalize Schema for user data
    const userDataSchema = new cdk.CfnResource(this, 'UserDataSchema', {
      type: 'AWS::Personalize::Schema',
      properties: {
        Name: 'MealPlanningUserSchema',
        Domain: 'ECOMMERCE',
        Schema: JSON.stringify({
          type: 'record',
          name: 'Users',
          namespace: 'com.mealplanning.schema',
          fields: [
            { name: 'USER_ID', type: 'string' },
            { name: 'DIETARY_PREFERENCE', type: 'string' },
            { name: 'ALLERGIES', type: ['null', 'string'], default: null },
            { name: 'HEALTH_GOALS', type: ['null', 'string'], default: null }
          ]
        }),
      },
    });

    // Personalize Schema for item (recipe) data
    const itemDataSchema = new cdk.CfnResource(this, 'ItemDataSchema', {
      type: 'AWS::Personalize::Schema',
      properties: {
        Name: 'MealPlanningItemSchema',
        Domain: 'ECOMMERCE',
        Schema: JSON.stringify({
          type: 'record',
          name: 'Items',
          namespace: 'com.mealplanning.schema',
          fields: [
            { name: 'ITEM_ID', type: 'string' },
            { name: 'RECIPE_NAME', type: 'string' },
            { name: 'CATEGORY', type: 'string' },
            { name: 'DIETARY_TAGS', type: ['null', 'string'], default: null },
            { name: 'CALORIES', type: 'int' },
            { name: 'PROTEIN', type: 'int' },
            { name: 'CARBS', type: 'int' },
            { name: 'FAT', type: 'int' }
          ]
        }),
      },
    });

    // Personalize Dataset for users
    const userDataset = new cdk.CfnResource(this, 'UserDataset', {
      type: 'AWS::Personalize::Dataset',
      properties: {
        DatasetGroupArn: personalizeDatasetGroup.getAtt('DatasetGroupArn').toString(),
        DatasetType: 'Users',
        SchemaArn: userDataSchema.getAtt('SchemaArn').toString(),
        Name: 'MealPlanningUserDataset',
      },
    });

    // Personalize Dataset for items (recipes)
    const itemDataset = new cdk.CfnResource(this, 'ItemDataset', {
      type: 'AWS::Personalize::Dataset',
      properties: {
        DatasetGroupArn: personalizeDatasetGroup.getAtt('DatasetGroupArn').toString(),
        DatasetType: 'Items',
        SchemaArn: itemDataSchema.getAtt('SchemaArn').toString(),
        Name: 'MealPlanningItemDataset',
      },
    });

    // Personalize Dataset for user-item interactions
    const interactionSchema = new cdk.CfnResource(this, 'InteractionSchema', {
      type: 'AWS::Personalize::Schema',
      properties: {
        Name: 'MealPlanningInteractionSchema',
        Schema: JSON.stringify({
          type: 'record',
          name: 'Interactions',
          namespace: 'com.mealplanning.schema',
          fields: [
            { name: 'USER_ID', type: 'string' },
            { name: 'ITEM_ID', type: 'string' },
            { name: 'EVENT_TYPE', type: 'string' },
            { name: 'TIMESTAMP', type: 'long' },
            { name: 'RATING', type: ['null', 'float'], default: null }
          ]
        }),
      },
    });

    const interactionDataset = new cdk.CfnResource(this, 'InteractionDataset', {
      type: 'AWS::Personalize::Dataset',
      properties: {
        DatasetGroupArn: personalizeDatasetGroup.getAtt('DatasetGroupArn').toString(),
        DatasetType: 'Interactions',
        SchemaArn: interactionSchema.getAtt('SchemaArn').toString(),
        Name: 'MealPlanningInteractionDataset',
      },
    });

    // Recipe Recommender Lambda that uses Amazon Personalize
    const recipeRecommenderLambda = new NodejsFunction(this, 'RecipeRecommenderFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'recipe-recommender.ts'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      role: lambdaExecutionRole,
      environment: {
        DATASET_GROUP_ARN: personalizeDatasetGroup.getAtt('DatasetGroupArn').toString(),
        RECIPE_TABLE_NAME: recipeTable.tableName,
        USER_PREFERENCES_TABLE_NAME: userPreferencesTable.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });

    // Add API endpoint for recipe recommendations
    const recommendationsResource = api.root.addResource('recommendations');
    const userRecommendationsResource = recommendationsResource.addResource('{userId}');
    userRecommendationsResource.addMethod('GET', new apigateway.LambdaIntegration(recipeRecommenderLambda));
    
    // 7. EventBridge for Scheduling
    
    // Daily meal plan generation schedule (4,000 plans)
    const mealPlanGenerationRule = new events.Rule(this, 'DailyMealPlanGenerationRule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '1' }), // Run daily at 1:00 AM UTC
      description: 'Triggers daily meal plan generation for users',
    });
    
    mealPlanGenerationRule.addTarget(new targets.LambdaFunction(mealPlanGenerationLambda));
    
    // Weekly grocery reminder schedule
    const groceryReminderRule = new events.Rule(this, 'WeeklyGroceryReminderRule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '10', dayOfWeek: '5' }), // Run Friday at 10:00 AM UTC
      description: 'Triggers weekly grocery shopping reminders',
    });
    
    // Lambda function for processing grocery reminders
    const groceryReminderLambda = new NodejsFunction(this, 'GroceryReminderFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'grocery-reminder.ts'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      role: lambdaExecutionRole,
      environment: {
        USER_PREFERENCES_TABLE_NAME: userPreferencesTable.tableName,
        MEAL_PLAN_HISTORY_TABLE_NAME: mealPlanHistoryTable.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
    
    groceryReminderRule.addTarget(new targets.LambdaFunction(groceryReminderLambda));
    
    // 8. SNS for Notifications
    
    // Grocery reminder notification topic
    const groceryReminderTopic = new sns.Topic(this, 'GroceryReminderTopic', {
      displayName: 'Grocery Shopping Reminders',
    });
    
    // Grant permissions to the grocery reminder Lambda to publish to the topic
    groceryReminderTopic.grantPublish(groceryReminderLambda);
    
    // System alerts topic for operational monitoring
    const systemAlertsTopic = new sns.Topic(this, 'SystemAlertsTopic', {
      displayName: 'Meal Planning System Alerts',
    });
    
    // 9. CloudWatch Monitoring
    
    // API Gateway Metrics Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'MealPlanningDashboard', {
      dashboardName: 'MealPlanning-Metrics',
    });
    
    // Lambda execution metrics
    const mealPlanGenerationMetrics = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Invocations',
      dimensionsMap: {
        FunctionName: mealPlanGenerationLambda.functionName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });
    
    const mealPlanGenerationErrorMetric = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Errors',
      dimensionsMap: {
        FunctionName: mealPlanGenerationLambda.functionName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });
    
    // Set up CloudWatch alarms for critical functions
    const mealPlanGenerationErrorAlarm = new cloudwatch.Alarm(this, 'MealPlanGenerationErrorAlarm', {
      metric: mealPlanGenerationErrorMetric,
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'Alert when meal plan generation has more than 5 errors in 5 minutes',
      actionsEnabled: true,
    });
    
    mealPlanGenerationErrorAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(systemAlertsTopic));
    
    // Add metrics to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Meal Plan Generation Lambda Metrics',
        left: [mealPlanGenerationMetrics, mealPlanGenerationErrorMetric],
        width: 12,
      })
    );
    
    // 10. Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'Endpoint URL of the meal planning API',
    });
    
    new cdk.CfnOutput(this, 'RecipeTableName', {
      value: recipeTable.tableName,
      description: 'Name of the Recipe DynamoDB table',
    });
    
    new cdk.CfnOutput(this, 'RecipeImagesBucketName', {
      value: recipeImagesBucket.bucketName,
      description: 'Name of the S3 bucket for recipe images',
    });
    
    new cdk.CfnOutput(this, 'MealPlanDocumentsBucketName', {
      value: mealPlanDocumentsBucket.bucketName,
      description: 'Name of the S3 bucket for meal plan documents',
    });
  }
}

// Main function to bootstrap the CDK application
const app = new cdk.App();
new TapStack(app, 'TapStack', {
  env: { 
    region: 'us-west-2' 
  },
  description: 'Meal Planning System for Personalized Nutrition App'
});
### Answer 
---

# Meal Planning System - AWS CDK Implementation

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // IAM Roles and Permissions
    const lambdaExecutionRole = new iam.Role(this, 'MealPlanningLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });
    
    lambdaExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));
    lambdaExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
    lambdaExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSESFullAccess'));
    lambdaExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSNSFullAccess'));
    lambdaExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('ComprehendMedicalFullAccess'));
    
    // Data Storage - DynamoDB Tables
    const recipeTable = new dynamodb.Table(this, 'RecipeTable', {
      partitionKey: { name: 'recipeId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });
    
    recipeTable.addGlobalSecondaryIndex({
      indexName: 'DietaryRestrictionIndex',
      partitionKey: { name: 'dietaryCategory', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'calories', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const userPreferencesTable = new dynamodb.Table(this, 'UserPreferencesTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    const mealPlanHistoryTable = new dynamodb.Table(this, 'MealPlanHistoryTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'weekStartDate', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });
    
    // S3 Buckets for Recipe Images and Documents
    const recipeImagesBucket = new s3.Bucket(this, 'RecipeImagesBucket', {
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          maxAge: 3000,
        },
      ],
    });
    
    const mealPlanDocumentsBucket = new s3.Bucket(this, 'MealPlanDocumentsBucket', {
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });
    
    // Lambda Functions
    const mealPlanGenerationLambda = new NodejsFunction(this, 'MealPlanGenerationFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'meal-plan-generation.ts'),
      timeout: cdk.Duration.minutes(10),
      memorySize: 1024,
      role: lambdaExecutionRole,
      environment: {
        RECIPE_TABLE_NAME: recipeTable.tableName,
        USER_PREFERENCES_TABLE_NAME: userPreferencesTable.tableName,
        MEAL_PLAN_HISTORY_TABLE_NAME: mealPlanHistoryTable.tableName,
        RECIPE_IMAGES_BUCKET_NAME: recipeImagesBucket.bucketName,
        MEAL_PLAN_DOCUMENTS_BUCKET_NAME: mealPlanDocumentsBucket.bucketName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
    
    const groceryListLambda = new NodejsFunction(this, 'GroceryListFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'grocery-list.ts'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      role: lambdaExecutionRole,
      environment: {
        RECIPE_TABLE_NAME: recipeTable.tableName,
        MEAL_PLAN_HISTORY_TABLE_NAME: mealPlanHistoryTable.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
    
    const nutritionalAnalysisLambda = new NodejsFunction(this, 'NutritionalAnalysisFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'nutritional-analysis.ts'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      role: lambdaExecutionRole,
      environment: {
        RECIPE_TABLE_NAME: recipeTable.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
    
    const pdfGenerationLambda = new NodejsFunction(this, 'PDFGenerationFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'pdf-generation.ts'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      role: lambdaExecutionRole,
      environment: {
        MEAL_PLAN_DOCUMENTS_BUCKET_NAME: mealPlanDocumentsBucket.bucketName,
        RECIPE_IMAGES_BUCKET_NAME: recipeImagesBucket.bucketName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
    
    const emailSendingLambda = new NodejsFunction(this, 'EmailSendingFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'email-sending.ts'),
      timeout: cdk.Duration.minutes(3),
      memorySize: 512,
      role: lambdaExecutionRole,
      environment: {
        MEAL_PLAN_DOCUMENTS_BUCKET_NAME: mealPlanDocumentsBucket.bucketName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
    
    const nutritionalExtractionLambda = new NodejsFunction(this, 'NutritionalExtractionFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, 'nutritional-extraction.ts'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      role: lambdaExecutionRole,
      environment: {
        RECIPE_TABLE_NAME: recipeTable.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE,
    });
    
    // API Gateway
    const api = new apigateway.RestApi(this, 'MealPlanningApi', {
      description: 'API for meal planning system',
      deployOptions: {
        stageName: 'prod',
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });
    
    // API Resources and Methods
    const mealPlansResource = api.root.addResource('mealplans');
    const userMealPlansResource = mealPlansResource.addResource('{userId}');
    
    userMealPlansResource.addMethod('GET', new apigateway.LambdaIntegration(mealPlanGenerationLambda));
    userMealPlansResource.addMethod('POST', new apigateway.LambdaIntegration(mealPlanGenerationLambda));
    
    const groceryListResource = userMealPlansResource.addResource('grocerylist');
    groceryListResource.addMethod('GET', new apigateway.LambdaIntegration(groceryListLambda));
    
    const nutritionResource = userMealPlansResource.addResource('nutrition');
    nutritionResource.addMethod('GET', new apigateway.LambdaIntegration(nutritionalAnalysisLambda));
    
    const extractionResource = api.root.addResource('extract-nutrition');
    extractionResource.addMethod('POST', new apigateway.LambdaIntegration(nutritionalExtractionLambda));
    
    // Amazon Personalize for Recommendations
    const personalizeDatasetGroup = new cdk.CfnResource(this, 'PersonalizeDatasetGroup', {
      type: 'AWS::Personalize::DatasetGroup',
      properties: {
        Name: 'MealRecommendationDatasetGroup',
      },
    });

    const userDataSchema = new cdk.CfnResource(this, 'UserDataSchema', {
      type: 'AWS::Personalize::Schema',
      properties: {
        Name: 'MealPlanningUserSchema',
        Domain: 'ECOMMERCE',
        Schema: JSON.stringify({
          type: 'record',
          name: 'Users',
          namespace: 'com.mealplanning.schema',
          fields: [
            { name: 'USER_ID', type: 'string' },
            { name: 'DIETARY_PREFERENCE', type: 'string' },
            { name: 'ALLERGIES', type: ['null', 'string'], default: null },
            { name: 'HEALTH_GOALS', type: ['null', 'string'], default: null }
          ]
        }),
      },
    });

    const itemDataSchema = new cdk.CfnResource