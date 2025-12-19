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
import * as path from 'path';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ==================== S3 BUCKETS ====================
    // Bucket for recipe images and documents
    const recipeMediaBucket = new s3.Bucket(this, 'RecipeMediaBucket', {
      bucketName: `meal-planning-media-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
          enabled: true,
        },
      ],
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: ['*'],
          maxAge: 3000,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Bucket for generated meal plans and PDFs
    const mealPlanDocumentsBucket = new s3.Bucket(
      this,
      'MealPlanDocumentsBucket',
      {
        bucketName: `meal-plan-documents-${this.account}-${this.region}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        lifecycleRules: [
          {
            id: 'expire-old-plans',
            expiration: cdk.Duration.days(90),
            enabled: true,
          },
        ],
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }
    );

    // ==================== DYNAMODB TABLES ====================
    // Recipes table with GSI for dietary requirements
    const recipesTable = new dynamodb.Table(this, 'RecipesTable', {
      tableName: 'meal-planning-recipes',
      partitionKey: { name: 'recipeId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'version', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Global Secondary Index for dietary requirements
    recipesTable.addGlobalSecondaryIndex({
      indexName: 'DietaryRequirementsIndex',
      partitionKey: {
        name: 'dietaryType',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: 'calories', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Global Secondary Index for meal type
    recipesTable.addGlobalSecondaryIndex({
      indexName: 'MealTypeIndex',
      partitionKey: { name: 'mealType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'prepTime', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // User preferences table
    const userPreferencesTable = new dynamodb.Table(
      this,
      'UserPreferencesTable',
      {
        tableName: 'meal-planning-user-preferences',
        partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        pointInTimeRecovery: true,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }
    );

    // Meal plans table
    const mealPlansTable = new dynamodb.Table(this, 'MealPlansTable', {
      tableName: 'meal-planning-meal-plans',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'weekStartDate', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Grocery lists table
    const groceryListsTable = new dynamodb.Table(this, 'GroceryListsTable', {
      tableName: 'meal-planning-grocery-lists',
      partitionKey: { name: 'mealPlanId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Nutritional data table
    const nutritionalDataTable = new dynamodb.Table(
      this,
      'NutritionalDataTable',
      {
        tableName: 'meal-planning-nutritional-data',
        partitionKey: { name: 'recipeId', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }
    );

    // ==================== SNS TOPICS ====================
    const groceryReminderTopic = new sns.Topic(this, 'GroceryReminderTopic', {
      displayName: 'Grocery Shopping Reminders',
      topicName: 'meal-planning-grocery-reminders',
    });

    const mealPlanNotificationTopic = new sns.Topic(
      this,
      'MealPlanNotificationTopic',
      {
        displayName: 'Meal Plan Notifications',
        topicName: 'meal-planning-notifications',
      }
    );

    // ==================== IAM ROLES ====================
    // Role for Lambda functions
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
      inlinePolicies: {
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
                'dynamodb:BatchGetItem',
                'dynamodb:BatchWriteItem',
              ],
              resources: [
                recipesTable.tableArn,
                `${recipesTable.tableArn}/index/*`,
                userPreferencesTable.tableArn,
                mealPlansTable.tableArn,
                groceryListsTable.tableArn,
                nutritionalDataTable.tableArn,
              ],
            }),
          ],
        }),
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              resources: [
                recipeMediaBucket.bucketArn,
                `${recipeMediaBucket.bucketArn}/*`,
                mealPlanDocumentsBucket.bucketArn,
                `${mealPlanDocumentsBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
        SESAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'ses:SendEmail',
                'ses:SendRawEmail',
                'ses:SendTemplatedEmail',
              ],
              resources: ['*'],
            }),
          ],
        }),
        SNSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['sns:Publish'],
              resources: [
                groceryReminderTopic.topicArn,
                mealPlanNotificationTopic.topicArn,
              ],
            }),
          ],
        }),
        PersonalizeAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'personalize:GetRecommendations',
                'personalize:GetPersonalizedRanking',
                'personalize:DescribeCampaign',
              ],
              resources: ['*'],
            }),
          ],
        }),
        ComprehendMedicalAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'comprehendmedical:DetectEntitiesV2',
                'comprehendmedical:InferRxNorm',
                'comprehendmedical:InferICD10CM',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // ==================== LAMBDA LAYERS ====================
    const commonLibsLayer = new lambda.LayerVersion(this, 'CommonLibsLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, 'layers/common-libs')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: 'Common libraries for meal planning functions',
    });

    // ==================== LAMBDA FUNCTIONS ====================
    // Environment variables for all Lambda functions
    const commonEnvironment = {
      RECIPES_TABLE: recipesTable.tableName,
      USER_PREFERENCES_TABLE: userPreferencesTable.tableName,
      MEAL_PLANS_TABLE: mealPlansTable.tableName,
      GROCERY_LISTS_TABLE: groceryListsTable.tableName,
      NUTRITIONAL_DATA_TABLE: nutritionalDataTable.tableName,
      RECIPE_MEDIA_BUCKET: recipeMediaBucket.bucketName,
      MEAL_PLAN_DOCUMENTS_BUCKET: mealPlanDocumentsBucket.bucketName,
      GROCERY_REMINDER_TOPIC_ARN: groceryReminderTopic.topicArn,
      MEAL_PLAN_NOTIFICATION_TOPIC_ARN: mealPlanNotificationTopic.topicArn,
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    };

    // Meal Plan Generator Function
    const mealPlanGeneratorFunction = new lambda.Function(
      this,
      'MealPlanGeneratorFunction',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.generateMealPlan',
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const personalize = new AWS.PersonalizeRuntime();
        const s3 = new AWS.S3();
        const { v4: uuidv4 } = require('uuid');

        exports.generateMealPlan = async (event) => {
          const userId = event.userId || event.pathParameters?.userId;
          
          try {
            // Fetch user preferences
            const userPrefs = await dynamodb.get({
              TableName: process.env.USER_PREFERENCES_TABLE,
              Key: { userId }
            }).promise();
            
            const preferences = userPrefs.Item || {};
            const dietaryRestrictions = preferences.dietaryRestrictions || [];
            const targetCalories = preferences.targetCalories || 2000;
            
            // Get personalized recipe recommendations
            const recommendations = await getPersonalizedRecommendations(userId, preferences);
            
            // Generate weekly meal plan
            const mealPlan = await generateWeeklyMealPlan(userId, recommendations, preferences);
            
            // Store meal plan
            await dynamodb.put({
              TableName: process.env.MEAL_PLANS_TABLE,
              Item: {
                userId,
                weekStartDate: getWeekStartDate(),
                mealPlanId: uuidv4(),
                mealPlan,
                createdAt: new Date().toISOString(),
                ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days TTL
              }
            }).promise();
            
            // Generate grocery list
            await generateGroceryList(mealPlan);
            
            return {
              statusCode: 200,
              body: JSON.stringify({ 
                message: 'Meal plan generated successfully',
                mealPlan 
              })
            };
          } catch (error) {
            console.error('Error generating meal plan:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({ error: 'Failed to generate meal plan' })
            };
          }
        };
        
        async function getPersonalizedRecommendations(userId, preferences) {
          // Implement personalization logic
          return [];
        }
        
        async function generateWeeklyMealPlan(userId, recommendations, preferences) {
          // Implement meal plan generation logic
          return {};
        }
        
        async function generateGroceryList(mealPlan) {
          // Implement grocery list generation
          return {};
        }
        
        function getWeekStartDate() {
          const today = new Date();
          const day = today.getDay();
          const diff = today.getDate() - day + (day === 0 ? -6 : 1);
          return new Date(today.setDate(diff)).toISOString().split('T')[0];
        }
      `),
        environment: commonEnvironment,
        timeout: cdk.Duration.minutes(5),
        memorySize: 1024,
        role: lambdaExecutionRole,
        layers: [commonLibsLayer],
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    // Grocery List Aggregator Function
    const groceryListAggregatorFunction = new lambda.Function(
      this,
      'GroceryListAggregatorFunction',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.aggregateGroceryList',
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        
        exports.aggregateGroceryList = async (event) => {
          const mealPlanId = event.mealPlanId || event.pathParameters?.mealPlanId;
          
          try {
            // Fetch meal plan
            const mealPlan = await dynamodb.query({
              TableName: process.env.MEAL_PLANS_TABLE,
              KeyConditionExpression: 'mealPlanId = :mealPlanId',
              ExpressionAttributeValues: {
                ':mealPlanId': mealPlanId
              }
            }).promise();
            
            if (!mealPlan.Items || mealPlan.Items.length === 0) {
              return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Meal plan not found' })
              };
            }
            
            // Aggregate ingredients from all recipes
            const aggregatedList = await aggregateIngredients(mealPlan.Items[0].mealPlan);
            
            // Optimize and categorize
            const optimizedList = optimizeGroceryList(aggregatedList);
            
            // Store grocery list
            await dynamodb.put({
              TableName: process.env.GROCERY_LISTS_TABLE,
              Item: {
                mealPlanId,
                groceryList: optimizedList,
                createdAt: new Date().toISOString()
              }
            }).promise();
            
            return {
              statusCode: 200,
              body: JSON.stringify({ 
                message: 'Grocery list generated successfully',
                groceryList: optimizedList 
              })
            };
          } catch (error) {
            console.error('Error aggregating grocery list:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({ error: 'Failed to generate grocery list' })
            };
          }
        };
        
        async function aggregateIngredients(mealPlan) {
          // Implement ingredient aggregation logic
          const ingredients = {};
          // Consolidate duplicate items, sum quantities
          return ingredients;
        }
        
        function optimizeGroceryList(aggregatedList) {
          // Organize by store sections
          const categories = {
            produce: [],
            dairy: [],
            meat: [],
            pantry: [],
            frozen: [],
            bakery: []
          };
          
          // Categorize items
          // Return optimized list
          return categories;
        }
      `),
        environment: commonEnvironment,
        timeout: cdk.Duration.minutes(3),
        memorySize: 512,
        role: lambdaExecutionRole,
        layers: [commonLibsLayer],
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    // Nutritional Analysis Function
    const nutritionalAnalysisFunction = new lambda.Function(
      this,
      'NutritionalAnalysisFunction',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.analyzeNutrition',
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const comprehendMedical = new AWS.ComprehendMedical();
        
        exports.analyzeNutrition = async (event) => {
          const recipeId = event.recipeId || event.pathParameters?.recipeId;
          
          try {
            // Fetch recipe details
            const recipe = await dynamodb.get({
              TableName: process.env.RECIPES_TABLE,
              Key: { 
                recipeId,
                version: 1 
              }
            }).promise();
            
            if (!recipe.Item) {
              return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Recipe not found' })
              };
            }
            
            // Extract nutritional information using Comprehend Medical
            const nutritionalData = await extractNutritionalInfo(recipe.Item);
            
            // Calculate macronutrients
            const macros = calculateMacronutrients(nutritionalData);
            
            // Calculate micronutrients
            const micros = calculateMicronutrients(nutritionalData);
            
            // Store nutritional data
            await dynamodb.put({
              TableName: process.env.NUTRITIONAL_DATA_TABLE,
              Item: {
                recipeId,
                calories: macros.calories,
                protein: macros.protein,
                carbohydrates: macros.carbohydrates,
                fat: macros.fat,
                fiber: macros.fiber,
                sugar: macros.sugar,
                sodium: micros.sodium,
                vitamins: micros.vitamins,
                minerals: micros.minerals,
                analyzedAt: new Date().toISOString()
              }
            }).promise();
            
            return {
              statusCode: 200,
              body: JSON.stringify({ 
                message: 'Nutritional analysis completed',
                nutrition: { macros, micros }
              })
            };
          } catch (error) {
            console.error('Error analyzing nutrition:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({ error: 'Failed to analyze nutrition' })
            };
          }
        };
        
        async function extractNutritionalInfo(recipe) {
          // Use Comprehend Medical to extract nutritional entities
          const params = {
            Text: recipe.ingredients.join(' ') + ' ' + recipe.description
          };
          
          try {
            const result = await comprehendMedical.detectEntitiesV2(params).promise();
            return result.Entities;
          } catch (error) {
            console.error('Comprehend Medical error:', error);
            return [];
          }
        }
        
        function calculateMacronutrients(nutritionalData) {
          // Calculate macronutrients from extracted data
          return {
            calories: 0,
            protein: 0,
            carbohydrates: 0,
            fat: 0,
            fiber: 0,
            sugar: 0
          };
        }
        
        function calculateMicronutrients(nutritionalData) {
          // Calculate micronutrients from extracted data
          return {
            sodium: 0,
            vitamins: {},
            minerals: {}
          };
        }
      `),
        environment: commonEnvironment,
        timeout: cdk.Duration.minutes(3),
        memorySize: 512,
        role: lambdaExecutionRole,
        layers: [commonLibsLayer],
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    // Email Delivery Function
    const emailDeliveryFunction = new lambda.Function(
      this,
      'EmailDeliveryFunction',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.sendMealPlanEmail',
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const ses = new AWS.SES();
        const s3 = new AWS.S3();
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const PDFDocument = require('pdfkit');
        const { v4: uuidv4 } = require('uuid');
        
        exports.sendMealPlanEmail = async (event) => {
          const userId = event.userId;
          const mealPlanId = event.mealPlanId;
          
          try {
            // Fetch user details
            const user = await dynamodb.get({
              TableName: process.env.USER_PREFERENCES_TABLE,
              Key: { userId }
            }).promise();
            
            if (!user.Item || !user.Item.email) {
              throw new Error('User email not found');
            }
            
            // Fetch meal plan
            const mealPlan = await dynamodb.query({
              TableName: process.env.MEAL_PLANS_TABLE,
              KeyConditionExpression: 'userId = :userId',
              ExpressionAttributeValues: {
                ':userId': userId
              },
              ScanIndexForward: false,
              Limit: 1
            }).promise();
            
            if (!mealPlan.Items || mealPlan.Items.length === 0) {
              throw new Error('Meal plan not found');
            }
            
            // Generate PDF
            const pdfBuffer = await generateMealPlanPDF(mealPlan.Items[0]);
            
            // Upload PDF to S3
            const pdfKey = \`meal-plans/\${userId}/\${mealPlanId}.pdf\`;
            await s3.putObject({
              Bucket: process.env.MEAL_PLAN_DOCUMENTS_BUCKET,
              Key: pdfKey,
              Body: pdfBuffer,
              ContentType: 'application/pdf'
            }).promise();
            
            // Generate presigned URL (valid for 7 days)
            const presignedUrl = s3.getSignedUrl('getObject', {
              Bucket: process.env.MEAL_PLAN_DOCUMENTS_BUCKET,
              Key: pdfKey,
              Expires: 604800 // 7 days
            });
            
            // Send email with SES
            const emailParams = {
              Source: 'noreply@mealplanning.com',
              Destination: {
                ToAddresses: [user.Item.email]
              },
              Message: {
                Subject: {
                  Data: 'Your Weekly Meal Plan is Ready!'
                },
                Body: {
                  Html: {
                    Data: generateEmailHTML(user.Item.name, mealPlan.Items[0], presignedUrl)
                  },
                  Text: {
                    Data: generateEmailText(user.Item.name, presignedUrl)
                  }
                }
              }
            };
            
            await ses.sendEmail(emailParams).promise();
            
            return {
              statusCode: 200,
              body: JSON.stringify({ 
                message: 'Meal plan email sent successfully'
              })
            };
          } catch (error) {
            console.error('Error sending meal plan email:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({ error: 'Failed to send email' })
            };
          }
        };
        
        async function generateMealPlanPDF(mealPlan) {
          // Generate PDF document
          const doc = new PDFDocument();
          const chunks = [];
          
          doc.on('data', chunk => chunks.push(chunk));
          
          // Add content to PDF
          doc.fontSize(20).text('Weekly Meal Plan', { align: 'center' });
          doc.moveDown();
          
          // Add meal plan details
          // ...
          
          doc.end();
          
          return new Promise((resolve) => {
            doc.on('end', () => {
              resolve(Buffer.concat(chunks));
            });
          });
        }
        
        function generateEmailHTML(userName, mealPlan, pdfUrl) {
          return \`
            <html>
              <body>
                <h1>Hello \${userName}!</h1>
                <p>Your personalized meal plan for this week is ready.</p>
                <p><a href="\${pdfUrl}">Download Your Meal Plan (PDF)</a></p>
                <h2>This Week's Highlights:</h2>
                <!-- Add meal plan highlights -->
              </body>
            </html>
          \`;
        }

        function generateEmailText(userName, pdfUrl) {
          return \`Hello \${userName}!\\n\\nYour meal plan is ready: \${pdfUrl}\`;
        }
      `),
        environment: commonEnvironment,
        timeout: cdk.Duration.minutes(5),
        memorySize: 1024,
        role: lambdaExecutionRole,
        layers: [commonLibsLayer],
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    // Recipe Management Function
    const recipeManagementFunction = new lambda.Function(
      this,
      'RecipeManagementFunction',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.manageRecipes',
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const s3 = new AWS.S3();
        const { v4: uuidv4 } = require('uuid');
        
        exports.manageRecipes = async (event) => {
          const httpMethod = event.httpMethod;
          const resource = event.resource;
          
          try {
            switch(httpMethod) {
              case 'GET':
                return await getRecipe(event);
              case 'POST':
                return await createRecipe(event);
              case 'PUT':
                return await updateRecipe(event);
              case 'DELETE':
                return await deleteRecipe(event);
              default:
                return {
                  statusCode: 405,
                  body: JSON.stringify({ error: 'Method not allowed' })
                };
            }
          } catch (error) {
            console.error('Error managing recipe:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({ error: 'Failed to process request' })
            };
          }
        };
        
        async function getRecipe(event) {
          const recipeId = event.pathParameters?.recipeId;
          
          if (recipeId) {
            const recipe = await dynamodb.get({
              TableName: process.env.RECIPES_TABLE,
              Key: { 
                recipeId,
                version: 1 
              }
            }).promise();
            
            return {
              statusCode: 200,
              body: JSON.stringify(recipe.Item || {})
            };
          } else {
            // Query recipes based on filters
            const dietaryType = event.queryStringParameters?.dietaryType;
            const mealType = event.queryStringParameters?.mealType;
            
            let params = {
              TableName: process.env.RECIPES_TABLE
            };
            
            if (dietaryType) {
              params = {
                ...params,
                IndexName: 'DietaryRequirementsIndex',
                KeyConditionExpression: 'dietaryType = :dietaryType',
                ExpressionAttributeValues: {
                  ':dietaryType': dietaryType
                }
              };
            } else if (mealType) {
              params = {
                ...params,
                IndexName: 'MealTypeIndex',
                KeyConditionExpression: 'mealType = :mealType',
                ExpressionAttributeValues: {
                  ':mealType': mealType
                }
              };
            }
            
            const recipes = await dynamodb.query(params).promise();
            
            return {
              statusCode: 200,
              body: JSON.stringify(recipes.Items)
            };
          }
        }
        
        async function createRecipe(event) {
          const recipe = JSON.parse(event.body);
          recipe.recipeId = uuidv4();
          recipe.version = 1;
          recipe.createdAt = new Date().toISOString();
          
          await dynamodb.put({
            TableName: process.env.RECIPES_TABLE,
            Item: recipe
          }).promise();
          
          return {
            statusCode: 201,
            body: JSON.stringify({ 
              message: 'Recipe created successfully',
              recipeId: recipe.recipeId
            })
          };
        }
        
        async function updateRecipe(event) {
          const recipeId = event.pathParameters.recipeId;
          const updates = JSON.parse(event.body);
          
          // Implementation for recipe updates
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Recipe updated successfully' })
          };
        }
        
        async function deleteRecipe(event) {
          const recipeId = event.pathParameters.recipeId;
          
          await dynamodb.delete({
            TableName: process.env.RECIPES_TABLE,
            Key: { 
              recipeId,
              version: 1 
            }
          }).promise();
          
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Recipe deleted successfully' })
          };
        }
      `),
        environment: commonEnvironment,
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        role: lambdaExecutionRole,
        layers: [commonLibsLayer],
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    // User Preferences Function
    const userPreferencesFunction = new lambda.Function(
      this,
      'UserPreferencesFunction',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.manageUserPreferences',
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        
        exports.manageUserPreferences = async (event) => {
          const httpMethod = event.httpMethod;
          const userId = event.pathParameters?.userId;
          
          try {
            switch(httpMethod) {
              case 'GET':
                return await getUserPreferences(userId);
              case 'PUT':
                return await updateUserPreferences(userId, event.body);
              default:
                return {
                  statusCode: 405,
                  body: JSON.stringify({ error: 'Method not allowed' })
                };
            }
          } catch (error) {
            console.error('Error managing user preferences:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({ error: 'Failed to process request' })
            };
          }
        };
        
        async function getUserPreferences(userId) {
          const result = await dynamodb.get({
            TableName: process.env.USER_PREFERENCES_TABLE,
            Key: { userId }
          }).promise();
          
          return {
            statusCode: 200,
            body: JSON.stringify(result.Item || {})
          };
        }
        
        async function updateUserPreferences(userId, body) {
          const preferences = JSON.parse(body);
          preferences.userId = userId;
          preferences.updatedAt = new Date().toISOString();
          
          await dynamodb.put({
            TableName: process.env.USER_PREFERENCES_TABLE,
            Item: preferences
          }).promise();
          
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Preferences updated successfully' })
          };
        }
      `),
        environment: commonEnvironment,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        role: lambdaExecutionRole,
        layers: [commonLibsLayer],
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    // IAM Role for Batch Meal Plan Generator with Lambda invoke permissions
    const batchLambdaExecutionRole = new iam.Role(
      this,
      'BatchLambdaExecutionRole',
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AWSXRayDaemonWriteAccess'
          ),
        ],
        inlinePolicies: {
          DynamoDBAccess: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                actions: [
                  'dynamodb:GetItem',
                  'dynamodb:PutItem',
                  'dynamodb:UpdateItem',
                  'dynamodb:DeleteItem',
                  'dynamodb:Query',
                  'dynamodb:Scan',
                  'dynamodb:BatchGetItem',
                  'dynamodb:BatchWriteItem',
                ],
                resources: [
                  recipesTable.tableArn,
                  `${recipesTable.tableArn}/index/*`,
                  userPreferencesTable.tableArn,
                  mealPlansTable.tableArn,
                  groceryListsTable.tableArn,
                  nutritionalDataTable.tableArn,
                ],
              }),
            ],
          }),
          LambdaInvokeAccess: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                actions: ['lambda:InvokeFunction'],
                resources: [mealPlanGeneratorFunction.functionArn],
              }),
            ],
          }),
        },
      }
    );

    // Batch Meal Plan Generator (for scheduled generation)
    const batchMealPlanGeneratorFunction = new lambda.Function(
      this,
      'BatchMealPlanGeneratorFunction',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.batchGenerateMealPlans',
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const lambda = new AWS.Lambda();
        
        exports.batchGenerateMealPlans = async (event) => {
          console.log('Starting batch meal plan generation');
          
          try {
            // Fetch all active users
            const users = await getAllActiveUsers();

            console.log(\`Generating meal plans for \${users.length} users\`);
            
            // Process users in batches
            const batchSize = 100;
            const batches = [];
            
            for (let i = 0; i < users.length; i += batchSize) {
              const batch = users.slice(i, i + batchSize);
              batches.push(batch);
            }
            
            // Process each batch in parallel
            const results = await Promise.allSettled(
              batches.map(batch => processBatch(batch))
            );
            
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            console.log(\`Batch generation complete. Successful: \${successful}, Failed: \${failed}\`);
            
            return {
              statusCode: 200,
              body: JSON.stringify({ 
                message: 'Batch generation completed',
                totalUsers: users.length,
                successful: successful * batchSize,
                failed: failed * batchSize
              })
            };
          } catch (error) {
            console.error('Error in batch generation:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({ error: 'Batch generation failed' })
            };
          }
        };
        
        async function getAllActiveUsers() {
          const params = {
            TableName: process.env.USER_PREFERENCES_TABLE,
            FilterExpression: 'isActive = :active',
            ExpressionAttributeValues: {
              ':active': true
            }
          };
          
          const users = [];
          let lastEvaluatedKey = null;
          
          do {
            if (lastEvaluatedKey) {
              params.ExclusiveStartKey = lastEvaluatedKey;
            }
            
            const result = await dynamodb.scan(params).promise();
            users.push(...result.Items);
            lastEvaluatedKey = result.LastEvaluatedKey;
          } while (lastEvaluatedKey);
          
          return users;
        }
        
        async function processBatch(userBatch) {
          // Get the meal plan generator function name from the current stack
          const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME?.replace('BatchMealPlanGeneratorFunction', 'MealPlanGeneratorFunction') || 'MealPlanGeneratorFunction';

          const promises = userBatch.map(user => {
            return lambda.invoke({
              FunctionName: functionName,
              InvocationType: 'Event',
              Payload: JSON.stringify({ userId: user.userId })
            }).promise();
          });

          return Promise.all(promises);
        }
      `),
        environment: commonEnvironment,
        timeout: cdk.Duration.minutes(15),
        memorySize: 3008,
        role: batchLambdaExecutionRole,
        layers: [commonLibsLayer],
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    // ==================== API GATEWAY ====================
    const api = new apigateway.RestApi(this, 'MealPlanningAPI', {
      restApiName: 'Meal Planning Service',
      description: 'API for personalized meal planning system',
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
        dataTraceEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        metricsEnabled: true,
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 2000,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
      },
    });

    // API Resources and Methods
    // Recipes endpoints
    const recipesResource = api.root.addResource('recipes');
    recipesResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(recipeManagementFunction)
    );
    recipesResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(recipeManagementFunction)
    );

    const recipeIdResource = recipesResource.addResource('{recipeId}');
    recipeIdResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(recipeManagementFunction)
    );
    recipeIdResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(recipeManagementFunction)
    );
    recipeIdResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(recipeManagementFunction)
    );

    const recipeNutritionResource = recipeIdResource.addResource('nutrition');
    recipeNutritionResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(nutritionalAnalysisFunction)
    );

    // User endpoints
    const usersResource = api.root.addResource('users');
    const userIdResource = usersResource.addResource('{userId}');

    const preferencesResource = userIdResource.addResource('preferences');
    preferencesResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(userPreferencesFunction)
    );
    preferencesResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(userPreferencesFunction)
    );

    const mealPlansResource = userIdResource.addResource('meal-plans');
    mealPlansResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(mealPlanGeneratorFunction)
    );
    mealPlansResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(mealPlanGeneratorFunction)
    );

    // Grocery lists endpoints
    const groceryListsResource = api.root.addResource('grocery-lists');
    const groceryListIdResource =
      groceryListsResource.addResource('{mealPlanId}');
    groceryListIdResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(groceryListAggregatorFunction)
    );
    groceryListIdResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(groceryListAggregatorFunction)
    );

    // ==================== EVENT BRIDGE RULES ====================
    // Weekly meal plan generation schedule (Every Sunday at 6 AM UTC)
    const weeklyMealPlanRule = new events.Rule(
      this,
      'WeeklyMealPlanGenerationRule',
      {
        ruleName: 'weekly-meal-plan-generation',
        description: 'Triggers weekly meal plan generation for all users',
        schedule: events.Schedule.cron({
          minute: '0',
          hour: '6',
          weekDay: 'SUN',
        }),
      }
    );

    weeklyMealPlanRule.addTarget(
      new targets.LambdaFunction(batchMealPlanGeneratorFunction, {
        retryAttempts: 2,
        maxEventAge: cdk.Duration.hours(2),
      })
    );

    // Daily meal plan generation schedule (For new users or updates)
    const dailyMealPlanRule = new events.Rule(
      this,
      'DailyMealPlanGenerationRule',
      {
        ruleName: 'daily-meal-plan-generation',
        description: 'Triggers daily meal plan generation for new users',
        schedule: events.Schedule.cron({
          minute: '0',
          hour: '8',
        }),
      }
    );

    dailyMealPlanRule.addTarget(
      new targets.LambdaFunction(batchMealPlanGeneratorFunction, {
        retryAttempts: 2,
        maxEventAge: cdk.Duration.hours(1),
      })
    );

    // Grocery reminder schedule (Every Saturday at 10 AM UTC)
    const groceryReminderRule = new events.Rule(this, 'GroceryReminderRule', {
      ruleName: 'grocery-shopping-reminder',
      description: 'Sends grocery shopping reminders',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '10',
        weekDay: 'SAT',
      }),
    });

    const groceryReminderFunction = new lambda.Function(
      this,
      'GroceryReminderFunction',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.sendGroceryReminders',
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const sns = new AWS.SNS();
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        
        exports.sendGroceryReminders = async (event) => {
          console.log('Sending grocery shopping reminders');
          
          try {
            // Get all active users with phone numbers
            const users = await getActiveUsersWithPhones();
            
            // Send reminders via SNS
            const promises = users.map(user => {
              return sns.publish({
                TopicArn: process.env.GROCERY_REMINDER_TOPIC_ARN,
                Message: \`Hi \${user.name}! Don't forget to shop for your weekly groceries. Check your meal plan for this week's list!\`,
                Subject: 'Grocery Shopping Reminder',
                MessageAttributes: {
                  userId: {
                    DataType: 'String',
                    StringValue: user.userId
                  }
                }
              }).promise();
            });
            
            await Promise.all(promises);
            
            return {
              statusCode: 200,
              body: JSON.stringify({ 
                message: 'Reminders sent successfully',
                count: users.length
              })
            };
          } catch (error) {
            console.error('Error sending reminders:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({ error: 'Failed to send reminders' })
            };
          }
        };
        
        async function getActiveUsersWithPhones() {
          const params = {
            TableName: process.env.USER_PREFERENCES_TABLE,
            FilterExpression: 'isActive = :active AND attribute_exists(phoneNumber)',
            ExpressionAttributeValues: {
              ':active': true
            }
          };
          
          const result = await dynamodb.scan(params).promise();
          return result.Items;
        }
      `),
        environment: commonEnvironment,
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        role: lambdaExecutionRole,
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    groceryReminderRule.addTarget(
      new targets.LambdaFunction(groceryReminderFunction)
    );

    // ==================== CLOUDWATCH DASHBOARDS ====================
    const dashboard = new cloudwatch.Dashboard(this, 'MealPlanningDashboard', {
      dashboardName: 'meal-planning-system-metrics',
      defaultInterval: cdk.Duration.hours(6),
    });

    // Add widgets for monitoring
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Request Count',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            dimensionsMap: {
              ApiName: api.restApiName,
              Stage: 'prod',
            },
            statistic: 'Sum',
          }),
        ],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensionsMap: {
              FunctionName: mealPlanGeneratorFunction.functionName,
            },
            statistic: 'Sum',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensionsMap: {
              FunctionName: groceryListAggregatorFunction.functionName,
            },
            statistic: 'Sum',
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read/Write Capacity',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedReadCapacityUnits',
            dimensionsMap: {
              TableName: recipesTable.tableName,
            },
            statistic: 'Sum',
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedWriteCapacityUnits',
            dimensionsMap: {
              TableName: recipesTable.tableName,
            },
            statistic: 'Sum',
          }),
        ],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            dimensionsMap: {
              FunctionName: mealPlanGeneratorFunction.functionName,
            },
            statistic: 'Sum',
            color: cloudwatch.Color.RED,
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            dimensionsMap: {
              FunctionName: emailDeliveryFunction.functionName,
            },
            statistic: 'Sum',
            color: cloudwatch.Color.ORANGE,
          }),
        ],
        width: 12,
        height: 6,
      })
    );

    // ==================== CLOUDWATCH ALARMS ====================
    new cloudwatch.Alarm(this, 'HighAPIErrorRate', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '4XXError',
        dimensionsMap: {
          ApiName: api.restApiName,
          Stage: 'prod',
        },
        statistic: 'Sum',
      }),
      threshold: 100,
      evaluationPeriods: 2,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when API 4XX errors exceed threshold',
    });

    new cloudwatch.Alarm(this, 'LambdaHighErrorRate', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        dimensionsMap: {
          FunctionName: batchMealPlanGeneratorFunction.functionName,
        },
        statistic: 'Sum',
      }),
      threshold: 50,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when batch generation errors exceed threshold',
    });

    // ==================== OUTPUTS ====================
    new cdk.CfnOutput(this, 'APIEndpoint', {
      value: api.url,
      description: 'Meal Planning API endpoint URL',
      exportName: 'MealPlanningAPIEndpoint',
    });

    new cdk.CfnOutput(this, 'RecipeMediaBucketName', {
      value: recipeMediaBucket.bucketName,
      description: 'S3 bucket for recipe media storage',
      exportName: 'RecipeMediaBucket',
    });

    new cdk.CfnOutput(this, 'MealPlanDocumentsBucketName', {
      value: mealPlanDocumentsBucket.bucketName,
      description: 'S3 bucket for meal plan documents',
      exportName: 'MealPlanDocumentsBucket',
    });

    new cdk.CfnOutput(this, 'RecipesTableName', {
      value: recipesTable.tableName,
      description: 'DynamoDB table for recipes',
      exportName: 'RecipesTable',
    });

    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    // ==================== TAGS ====================
    cdk.Tags.of(this).add('Application', 'MealPlanning');
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
```