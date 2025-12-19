### Reasoning Trace
---

This is a comprehensive request for an AWS CDK TypeScript implementation of a conversational AI platform. Let me break down the key requirements:

1. **Conversational Core:**
   - Lex V2 bot with 2 locales (en_US, es_ES) and custom slot type
   - Fulfillment Lambda (Node.js 18.x)
   - IAM permissions for Lambda to be invoked by Lex
   - Lambda needs permissions for Comprehend, Translate, Polly
   - Need actual Lambda code for fulfillment

2. **Context & Session Management:**
   - DynamoDB table with TTL
   - ElastiCache Redis cluster in private subnet
   - Security group configuration
   - Environment variables for Lambda

3. **Real-time Analytics:**
   - Kinesis Data Stream
   - Kinesis Firehose to S3
   - Encrypted S3 bucket
   - Lambda write permissions to Kinesis

4. **Observability:**
   - X-Ray tracing on Lambda
   - Custom CloudWatch metric
   - CloudWatch alarm

I need to create two files:
- `ai-platform-stack.ts` - The main CDK stack
- `main.ts` - The initialization file

Let me structure this properly with all the required components.
### Answer 
---

I'll create a comprehensive CDK solution for your omnichannel AI platform. This implementation focuses on high-level constructs, explicit service integration, and operational observability.

## `ai-platform-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lex from 'aws-cdk-lib/aws-lexv2models';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as firehose from 'aws-cdk-lib/aws-kinesisfirehose';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class AIPlatformStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    // 1. NETWORKING & SECURITY INFRASTRUCTURE
    // ========================================
    
    // Create VPC for ElastiCache Redis (using high-level construct)
    const vpc = new ec2.Vpc(this, 'AIplatformVPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }
      ]
    });

    // Security group for Lambda
    const lambdaSG = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc,
      description: 'Security group for Fulfillment Lambda',
      allowAllOutbound: true,
    });

    // Security group for Redis
    const redisSG = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc,
      description: 'Security group for ElastiCache Redis',
      allowAllOutbound: false,
    });

    // EXPLICIT CONNECTION: Allow Lambda to connect to Redis on port 6379
    redisSG.addIngressRule(
      lambdaSG,
      ec2.Port.tcp(6379),
      'Allow Lambda to connect to Redis'
    );

    // ========================================
    // 2. CONTEXT & SESSION STORAGE
    // ========================================

    // DynamoDB Table for conversation context with TTL
    const contextTable = new dynamodb.Table(this, 'ConversationContextTable', {
      partitionKey: {
        name: 'conversationId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      // CRUCIAL: Enable TTL for automatic data expiration
      timeToLiveAttribute: 'ttl',
    });

    // ElastiCache Redis Cluster for session management
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis cluster',
      subnetIds: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }).subnetIds,
    });

    const redisCluster = new elasticache.CfnCacheCluster(this, 'RedisSessionCluster', {
      cacheNodeType: 'cache.r6g.large',
      engine: 'redis',
      numCacheNodes: 1,
      vpcSecurityGroupIds: [redisSG.securityGroupId],
      cacheSubnetGroupName: redisSubnetGroup.ref,
      preferredMaintenanceWindow: 'sun:05:00-sun:06:00',
      engineVersion: '7.0',
    });

    // ========================================
    // 3. REAL-TIME ANALYTICS PIPELINE
    // ========================================

    // S3 Data Lake Bucket (encrypted)
    const dataLakeBucket = new s3.Bucket(this, 'ConversationDataLake', {
      bucketName: `ai-platform-data-lake-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'archive-old-data',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    // Kinesis Data Stream for real-time events
    const eventStream = new kinesis.Stream(this, 'ConversationEventStream', {
      streamMode: kinesis.StreamMode.ON_DEMAND,
      encryption: kinesis.StreamEncryption.MANAGED,
      retentionPeriod: cdk.Duration.days(7),
    });

    // Kinesis Firehose Delivery Stream to S3
    const deliveryStreamRole = new iam.Role(this, 'FirehoseDeliveryRole', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
    });

    // EXPLICIT PERMISSIONS: Grant Firehose access to S3 and Kinesis
    dataLakeBucket.grantWrite(deliveryStreamRole);
    eventStream.grantRead(deliveryStreamRole);

    const firehoseStream = new firehose.CfnDeliveryStream(this, 'ConversationFirehose', {
      deliveryStreamType: 'KinesisStreamAsSource',
      kinesisStreamSourceConfiguration: {
        kinesisStreamArn: eventStream.streamArn,
        roleArn: deliveryStreamRole.roleArn,
      },
      s3DestinationConfiguration: {
        bucketArn: dataLakeBucket.bucketArn,
        roleArn: deliveryStreamRole.roleArn,
        prefix: 'conversations/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/',
        errorOutputPrefix: 'errors/',
        bufferingHints: {
          intervalInSeconds: 60,
          sizeInMBs: 128,
        },
        compressionFormat: 'GZIP',
      },
    });

    // ========================================
    // 4. FULFILLMENT LAMBDA FUNCTION
    // ========================================

    // Lambda function for Lex fulfillment
    const fulfillmentLambda = new lambda.Function(this, 'FulfillmentLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(LAMBDA_CODE),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSG],
      // CRUCIAL: Enable X-Ray tracing
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        // EXPLICIT CONNECTION: Pass DynamoDB table name
        CONTEXT_TABLE_NAME: contextTable.tableName,
        // EXPLICIT CONNECTION: Pass Redis endpoint
        REDIS_ENDPOINT: redisCluster.attrRedisEndpointAddress,
        REDIS_PORT: redisCluster.attrRedisEndpointPort,
        // EXPLICIT CONNECTION: Pass Kinesis stream name
        EVENT_STREAM_NAME: eventStream.streamName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // ========================================
    // 5. IAM PERMISSIONS & SERVICE CONNECTIONS
    // ========================================

    // EXPLICIT PERMISSIONS: Grant Lambda access to DynamoDB
    contextTable.grantReadWriteData(fulfillmentLambda);

    // EXPLICIT PERMISSIONS: Grant Lambda access to Kinesis Data Stream
    eventStream.grantWrite(fulfillmentLambda);

    // EXPLICIT PERMISSIONS: Grant Lambda access to AI services
    fulfillmentLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'comprehend:DetectSentiment',
        'comprehend:DetectEntities',
        'comprehend:DetectKeyPhrases',
      ],
      resources: ['*'],
    }));

    fulfillmentLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'translate:TranslateText',
      ],
      resources: ['*'],
    }));

    fulfillmentLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'polly:SynthesizeSpeech',
      ],
      resources: ['*'],
    }));

    // ========================================
    // 6. LEX V2 BOT CONFIGURATION
    // ========================================

    // IAM role for Lex bot
    const lexBotRole = new iam.Role(this, 'LexBotRole', {
      assumedBy: new iam.ServicePrincipal('lexv2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonLexRunBotsOnly'),
      ],
    });

    // EXPLICIT PERMISSION: Grant Lex permission to invoke Lambda
    fulfillmentLambda.grantInvoke(lexBotRole);

    // Custom slot type
    const productSlotType = new lex.CfnBot.SlotTypeProperty({
      name: 'ProductType',
      description: 'Types of products in our catalog',
      slotTypeValues: [
        { sampleValue: { value: 'laptop' } },
        { sampleValue: { value: 'phone' } },
        { sampleValue: { value: 'tablet' } },
        { sampleValue: { value: 'headphones' } },
      ],
      valueSelectionSetting: {
        resolutionStrategy: 'ORIGINAL_VALUE',
      },
    });

    // Create Lex V2 Bot
    const lexBot = new lex.CfnBot(this, 'OmnichannelAIBot', {
      name: 'OmnichannelAIBot',
      roleArn: lexBotRole.roleArn,
      dataPrivacy: {
        childDirected: false,
      },
      idleSessionTtlInSeconds: 300,
      // Bot locales configuration
      botLocales: [
        {
          localeId: 'en_US',
          nluConfidenceThreshold: 0.7,
          description: 'English US locale',
          voiceSettings: {
            voiceId: 'Joanna',
            engine: 'neural',
          },
          slotTypes: [productSlotType],
          intents: [
            {
              intentName: 'ProductInquiry',
              description: 'Handle product inquiries',
              sampleUtterances: [
                { utterance: 'I want to know about {ProductType}' },
                { utterance: 'Tell me about your {ProductType} options' },
                { utterance: 'What {ProductType} do you have?' },
              ],
              slots: [
                {
                  slotName: 'ProductType',
                  description: 'The type of product',
                  slotTypeName: 'ProductType',
                  valueElicitationSetting: {
                    slotConstraint: 'Required',
                    promptSpecification: {
                      messageGroupsList: [
                        {
                          message: {
                            plainTextMessage: {
                              value: 'What type of product are you interested in?',
                            },
                          },
                        },
                      ],
                      maxRetries: 2,
                    },
                  },
                },
              ],
              fulfillmentCodeHook: {
                enabled: true,
              },
            },
          ],
        },
        {
          localeId: 'es_ES',
          nluConfidenceThreshold: 0.7,
          description: 'Spanish Spain locale',
          voiceSettings: {
            voiceId: 'Lucia',
            engine: 'neural',
          },
          slotTypes: [productSlotType],
          intents: [
            {
              intentName: 'ProductInquiry',
              description: 'Manejar consultas de productos',
              sampleUtterances: [
                { utterance: 'Quiero saber sobre {ProductType}' },
                { utterance: 'Cuéntame sobre sus opciones de {ProductType}' },
                { utterance: '¿Qué {ProductType} tienen?' },
              ],
              slots: [
                {
                  slotName: 'ProductType',
                  description: 'El tipo de producto',
                  slotTypeName: 'ProductType',
                  valueElicitationSetting: {
                    slotConstraint: 'Required',
                    promptSpecification: {
                      messageGroupsList: [
                        {
                          message: {
                            plainTextMessage: {
                              value: '¿En qué tipo de producto está interesado?',
                            },
                          },
                        },
                      ],
                      maxRetries: 2,
                    },
                  },
                },
              ],
              fulfillmentCodeHook: {
                enabled: true,
              },
            },
          ],
        },
      ],
    });

    // Bot alias with Lambda association
    const botAlias = new lex.CfnBotAlias(this, 'ProdBotAlias', {
      botId: lexBot.attrId,
      botAliasName: 'Production',
      botAliasLocaleSettings: [
        {
          botAliasLocaleSettingsId: 'en_US',
          enabled: true,
          codeHookSpecification: {
            lambdaCodeHook: {
              lambdaArn: fulfillmentLambda.functionArn,
              codeHookInterfaceVersion: '1.0',
            },
          },
        },
        {
          botAliasLocaleSettingsId: 'es_ES',
          enabled: true,
          codeHookSpecification: {
            lambdaCodeHook: {
              lambdaArn: fulfillmentLambda.functionArn,
              codeHookInterfaceVersion: '1.0',
            },
          },
        },
      ],
    });

    // ========================================
    // 7. OPERATIONAL OBSERVABILITY
    // ========================================

    // Custom metric for Intent Recognition Accuracy
    const intentAccuracyMetric = new cloudwatch.Metric({
      namespace: 'AIplatform/Conversational',
      metricName: 'IntentRecognitionAccuracy',
      dimensionsMap: {
        Environment: 'Production',
        BotName: lexBot.name || 'OmnichannelAIBot',
      },
    });

    // CloudWatch Alarm for low intent recognition accuracy
    new cloudwatch.Alarm(this, 'LowIntentAccuracyAlarm', {
      metric: intentAccuracyMetric.with({
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 0.75,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Intent recognition accuracy has fallen below 75%',
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    });

    // Lambda function metric alarm
    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'FulfillmentLambdaErrorAlarm', {
      metric: fulfillmentLambda.metricErrors({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      alarmDescription: 'Fulfillment Lambda has excessive errors',
    });

    // ========================================
    // 8. OUTPUTS
    // ========================================

    new cdk.CfnOutput(this, 'BotId', {
      value: lexBot.attrId,
      description: 'Lex V2 Bot ID',
    });

    new cdk.CfnOutput(this, 'BotAliasId', {
      value: botAlias.attrBotAliasId,
      description: 'Lex V2 Bot Alias ID',
    });

    new cdk.CfnOutput(this, 'FulfillmentLambdaArn', {
      value: fulfillmentLambda.functionArn,
      description: 'Fulfillment Lambda ARN',
    });

    new cdk.CfnOutput(this, 'DataLakeBucketName', {
      value: dataLakeBucket.bucketName,
      description: 'Data Lake S3 Bucket Name',
    });
  }
}

// ========================================
// LAMBDA SOURCE CODE
// ========================================

const LAMBDA_CODE = `
const AWS = require('aws-sdk');
const redis = require('redis');
const { v4: uuidv4 } = require('uuid');

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();
const kinesis = new AWS.Kinesis();
const comprehend = new AWS.Comprehend();
const translate = new AWS.Translate();

// Redis client configuration
let redisClient;

// Initialize Redis connection
async function initRedis() {
  if (!redisClient) {
    redisClient = redis.createClient({
      host: process.env.REDIS_ENDPOINT,
      port: process.env.REDIS_PORT,
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis Client Error', err);
    });
    
    await redisClient.connect();
  }
  return redisClient;
}

// Main Lambda handler
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  const { currentIntent, sessionState, bot, inputTranscript } = event;
  const sessionId = event.sessionId || uuidv4();
  
  try {
    // Initialize Redis connection
    const redis = await initRedis();
    
    // 1. SENTIMENT ANALYSIS
    const sentimentParams = {
      Text: inputTranscript,
      LanguageCode: bot.localeId.split('_')[0], // Extract language code
    };
    
    const sentimentResult = await comprehend.detectSentiment(sentimentParams).promise();
    console.log('Sentiment analysis:', sentimentResult);
    
    // 2. MULTI-LANGUAGE SUPPORT
    let translatedText = inputTranscript;
    if (bot.localeId !== 'en_US') {
      const translateParams = {
        SourceLanguageCode: bot.localeId.split('_')[0],
        TargetLanguageCode: 'en',
        Text: inputTranscript,
      };
      
      const translateResult = await translate.translateText(translateParams).promise();
      translatedText = translateResult.TranslatedText;
      console.log('Translated text:', translatedText);
    }
    
    // 3. STORE CONTEXT IN DYNAMODB
    const contextItem = {
      conversationId: sessionId,
      timestamp: Date.now(),
      ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours TTL
      intent: currentIntent.name,
      sentiment: sentimentResult.Sentiment,
      sentimentScores: sentimentResult.SentimentScore,
      originalText: inputTranscript,
      translatedText: translatedText,
      locale: bot.localeId,
    };
    
    await dynamodb.put({
      TableName: process.env.CONTEXT_TABLE_NAME,
      Item: contextItem,
    }).promise();
    
    // 4. CACHE SESSION DATA IN REDIS
    await redis.setex(\`session:\${sessionId}\`, 300, JSON.stringify({
      lastIntent: currentIntent.name,
      sentiment: sentimentResult.Sentiment,
      locale: bot.localeId,
    }));
    
    // 5. SEND EVENT TO KINESIS
    const eventData = {
      eventType: 'INTENT_PROCESSED',
      sessionId,
      timestamp: new Date().toISOString(),
      botId: bot.id,
      botAliasId: bot.aliasId,
      localeId: bot.localeId,
      intentName: currentIntent.name,
      sentiment: sentimentResult.Sentiment,
      confidenceScore: currentIntent.nluIntentConfidenceScore,
    };
    
    await kinesis.putRecord({
      StreamName: process.env.EVENT_STREAM_NAME,
      Data: JSON.stringify(eventData),
      PartitionKey: sessionId,
    }).promise();
    
    // 6. PUBLISH CUSTOM METRIC
    const cloudwatch = new AWS.CloudWatch();
    await cloudwatch.putMetricData({
      Namespace: 'AIplatform/Conversational',
      MetricData: [{
        MetricName: 'IntentRecognitionAccuracy',
        Value: currentIntent.nluIntentConfidenceScore || 0,
        Dimensions: [
          {
            Name: 'Environment',
            Value: 'Production',
          },
          {
            Name: 'BotName',
            Value: bot.name,
          },
        ],
        Timestamp: new Date(),
      }],
    }).promise();
    
    // 7. FULFILLMENT LOGIC
    let fulfillmentMessage = 'I can help you with that product inquiry.';
    
    if (currentIntent.name === 'ProductInquiry') {
      const productType = currentIntent.slots?.ProductType;
      if (productType) {
        fulfillmentMessage = \`I'd be happy to tell you about our \${productType} options. We have several models available with different features and price points.\`;
        
        if (bot.localeId === 'es_ES') {
          fulfillmentMessage = \`Estaré encantado de hablarle sobre nuestras opciones de \${productType}. Tenemos varios modelos disponibles con diferentes características y precios.\`;
        }
      }
    }
    
    // Return Lex response
    return {
      sessionState: {
        ...sessionState,
        intent: {
          ...currentIntent,
          state: 'Fulfilled',
        },
      },
      messages: [
        {
          contentType: 'PlainText',
          content: fulfillmentMessage,
        },
      ],
    };
    
  } catch (error) {
    console.error('Error in fulfillment:', error);
    
    return {
      sessionState: {
        ...sessionState,
        intent: {
          ...currentIntent,
          state: 'Failed',
        },
      },
      messages: [
        {
          contentType: 'PlainText',
          content: 'I apologize, but I encountered an error processing your request. Please try again.',
        },
      ],
    };
  }
};
`;
```

## `main.ts`

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AIPlatformStack } from './ai-platform-stack';

const app = new cdk.App();

// Deploy the AI Platform Stack
new AIPlatformStack(app, 'OmnichannelAIPlatformStack', {
  description: 'Omnichannel Conversational AI Platform - Handles 10M daily interactions',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  
  // Stack-level tags for cost tracking and governance
  tags: {
    Project: 'OmnichannelAI',
    Environment: 'Production',
    ManagedBy: 'CDK',
    CostCenter: 'AI-Platform',
  },
});

// Synthesize the app
app.synth();
```

## Key Architecture Highlights

### 1. **Explicit Service Connections**
- **Lex → Lambda**: IAM role grants with `fulfillmentLambda.grantInvoke(lexBotRole)`
- **Lambda → DynamoDB**: Using `contextTable.grantReadWriteData()`
- **Lambda → Kinesis**: Using `eventStream.grantWrite()`
- **Lambda → Redis**: Security group rules for port 6379
- **Firehose → S3**: Explicit IAM role and permissions

### 2. **Security Best Practices**
- All data encrypted at rest (DynamoDB, S3, Kinesis)
- VPC isolation for Redis with private subnets
- Least privilege IAM policies
- Security groups with explicit ingress rules

### 3. **Operational Excellence**
- X-Ray tracing enabled on Lambda
- Custom CloudWatch metrics for NLU performance
- CloudWatch alarms for proactive monitoring
- Structured logging with context

### 4. **Scalability Features**
- On-demand Kinesis streams
- DynamoDB with pay-per-request billing
- Auto-scaling capable infrastructure
- TTL for automatic data lifecycle management

### 5. **Multi-Language Support**
- Lex bot configured with en_US and es_ES locales
- Lambda integrates with Amazon Translate
- Neural voices configured for each locale

To deploy this stack:

```bash
npm install aws-cdk-lib constructs
npm install --save-dev @types/node typescript
npx cdk bootstrap
npx cdk deploy OmnichannelAIPlatformStack
```

This solution provides a production-ready foundation for your omnichannel AI platform with comprehensive service integration, security, and observability.