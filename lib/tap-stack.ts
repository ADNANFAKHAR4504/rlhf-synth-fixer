import * as cdk from 'aws-cdk-lib';
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

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ========================================
    // 1. NETWORKING & SECURITY INFRASTRUCTURE
    // ========================================

    // Use existing VPC to avoid VPC limit issues
    const vpc = ec2.Vpc.fromLookup(this, 'AIplatformVPC', {
      vpcId: 'vpc-05268f2804fb3a5f5', // Using existing 'main-vpc' with public/private subnets
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
      // DISABLE RETAIN POLICY: Allow deletion when stack is destroyed
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ElastiCache Redis Cluster for session management
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(
      this,
      'RedisSubnetGroup',
      {
        description: 'Subnet group for Redis cluster',
        subnetIds: vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }).subnetIds,
      }
    );

    const redisCluster = new elasticache.CfnCacheCluster(
      this,
      'RedisSessionCluster',
      {
        cacheNodeType: 'cache.r6g.large',
        engine: 'redis',
        numCacheNodes: 1,
        vpcSecurityGroupIds: [redisSG.securityGroupId],
        cacheSubnetGroupName: redisSubnetGroup.ref,
        preferredMaintenanceWindow: 'sun:05:00-sun:06:00',
        engineVersion: '7.0',
      }
    );

    // ========================================
    // 3. REAL-TIME ANALYTICS PIPELINE
    // ========================================

    // S3 Data Lake Bucket (encrypted)
    const dataLakeBucket = new s3.Bucket(this, 'ConversationDataLake', {
      bucketName: `ai-platform-data-lake-${cdk.Aws.ACCOUNT_ID}-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      // DISABLE RETAIN POLICY: Allow deletion when stack is destroyed
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // Automatically delete objects when bucket is deleted
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
      // DISABLE RETAIN POLICY: Allow deletion when stack is destroyed
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ========================================
    // Kinesis Firehose Delivery Role (robust fix)
    // ========================================
    const deliveryStreamRole = new iam.Role(this, 'FirehoseDeliveryRole', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
      inlinePolicies: {
        FirehosePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                's3:AbortMultipartUpload',
                's3:GetBucketLocation',
                's3:GetObject',
                's3:ListBucket',
                's3:ListBucketMultipartUploads',
                's3:PutObject',
              ],
              resources: [
                dataLakeBucket.bucketArn,
                `${dataLakeBucket.bucketArn}/*`,
              ],
            }),
            new iam.PolicyStatement({
              actions: [
                'kinesis:DescribeStream',
                'kinesis:DescribeStreamSummary',
                'kinesis:GetRecords',
                'kinesis:GetShardIterator',
                'kinesis:ListStreams',
                'kinesis:SubscribeToShard',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // ========================================
    // Firehose Delivery Stream (robust fix)
    // ========================================
    const deliveryStream = new firehose.CfnDeliveryStream(
      this,
      'ConversationFirehose',
      {
        deliveryStreamType: 'KinesisStreamAsSource',
        kinesisStreamSourceConfiguration: {
          kinesisStreamArn: eventStream.streamArn,
          roleArn: deliveryStreamRole.roleArn,
        },
        s3DestinationConfiguration: {
          bucketArn: dataLakeBucket.bucketArn,
          roleArn: deliveryStreamRole.roleArn,
          prefix:
            'conversations/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/',
          errorOutputPrefix: 'errors/',
          bufferingHints: {
            intervalInSeconds: 60,
            sizeInMBs: 128,
          },
          compressionFormat: 'GZIP',
          cloudWatchLoggingOptions: {
            enabled: true,
            logGroupName: `/aws/kinesisfirehose/${environmentSuffix}-conversation-firehose`,
            logStreamName: 'S3Delivery',
          },
        },
      }
    );

    // Explicit dependency: wait until stream exists
    deliveryStream.node.addDependency(eventStream);
    deliveryStream.node.addDependency(dataLakeBucket);

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
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
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
    fulfillmentLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'comprehend:DetectSentiment',
          'comprehend:DetectEntities',
          'comprehend:DetectKeyPhrases',
        ],
        resources: ['*'],
      })
    );

    fulfillmentLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['translate:TranslateText'],
        resources: ['*'],
      })
    );

    fulfillmentLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['polly:SynthesizeSpeech'],
        resources: ['*'],
      })
    );

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

    // 1️⃣ Slot type definition
    const productSlotType = {
      Name: 'ProductType',
      Description: 'Types of products in our catalog',
      SlotTypeValues: [
        { SampleValue: { Value: 'laptop' } },
        { SampleValue: { Value: 'phone' } },
        { SampleValue: { Value: 'tablet' } },
        { SampleValue: { Value: 'headphones' } },
      ],
      ValueSelectionSetting: {
        ResolutionStrategy: 'ORIGINAL_VALUE',
      },
    };

    // 2️⃣ Intent definition
    const productInquiryIntent = {
      Name: 'ProductInquiry',
      Description: 'Handle product inquiries',
      SampleUtterances: [
        { Utterance: 'I want to know about {ProductType}' },
        { Utterance: 'Tell me about your {ProductType} options' },
        { Utterance: 'What {ProductType} do you have?' },
      ],
      Slots: [
        {
          Name: 'ProductType',
          Description: 'The type of product',
          SlotTypeName: 'ProductType', // keep only here, valid under Slot
          ValueElicitationSetting: {
            SlotConstraint: 'Required',
            PromptSpecification: {
              MessageGroupsList: [
                {
                  Message: {
                    PlainTextMessage: {
                      Value: 'What type of product are you interested in?',
                    },
                  },
                },
              ],
              MaxRetries: 2,
            },
          },
        },
      ],
      FulfillmentCodeHook: {
        Enabled: true,
      },
    };

    // Create Lex V2 Bot using CfnBot
    const lexBot = new cdk.CfnResource(this, 'OmnichannelAIBot', {
      type: 'AWS::Lex::Bot',
      properties: {
        Name: `OmnichannelAIBot-${environmentSuffix}`,
        RoleArn: lexBotRole.roleArn,
        DataPrivacy: {
          ChildDirected: false,
        },
        IdleSessionTTLInSeconds: 300,
        AutoBuildBotLocales: true,
        BotLocales: [
          {
            LocaleId: 'en_US',
            NluConfidenceThreshold: 0.7,
            Description: 'English US locale',
            VoiceSettings: {
              VoiceId: 'Joanna',
              Engine: 'neural',
            },
            SlotTypes: [productSlotType],
            Intents: [
              productInquiryIntent,
              {
                Name: 'FallbackIntent',
                Description:
                  'Default fallback intent when no other intent matches',
                ParentIntentSignature: 'AMAZON.FallbackIntent',
                FulfillmentCodeHook: { Enabled: false },
              },
            ],
          },
          {
            LocaleId: 'es_ES',
            NluConfidenceThreshold: 0.7,
            Description: 'Spanish Spain locale',
            VoiceSettings: {
              VoiceId: 'Lucia',
              Engine: 'neural',
            },
            SlotTypes: [productSlotType],
            Intents: [
              {
                ...productInquiryIntent,
                Name: 'ConsultaProducto',
                Description: 'Manejar consultas de productos',
                SampleUtterances: [
                  { Utterance: 'Quiero saber sobre {ProductType}' },
                  { Utterance: 'Cuéntame sobre sus opciones de {ProductType}' },
                  { Utterance: '¿Qué {ProductType} tienen?' },
                ],
                Slots: [
                  {
                    Name: 'ProductType',
                    Description: 'El tipo de producto',
                    SlotTypeName: 'ProductType',
                    ValueElicitationSetting: {
                      SlotConstraint: 'Required',
                      PromptSpecification: {
                        MessageGroupsList: [
                          {
                            Message: {
                              PlainTextMessage: {
                                Value:
                                  '¿En qué tipo de producto está interesado?',
                              },
                            },
                          },
                        ],
                        MaxRetries: 2,
                      },
                    },
                  },
                ],
              },
              {
                Name: 'FallbackIntent',
                Description:
                  'Intención predeterminada cuando no hay coincidencias',
                ParentIntentSignature: 'AMAZON.FallbackIntent',
                FulfillmentCodeHook: { Enabled: false },
              },
            ],
          },
        ],
      },
    });

    // ========================================
    // Create a Bot Version after Lex Bot
    // ========================================
    const lexBotVersion = new cdk.CfnResource(this, 'OmnichannelAIBotVersion', {
      type: 'AWS::Lex::BotVersion',
      properties: {
        BotId: lexBot.getAtt('Id').toString(),
        Description: `Version for OmnichannelAIBot-${environmentSuffix}`,
        BotVersionLocaleSpecification: [
          {
            LocaleId: 'en_US',
            BotVersionLocaleDetails: {
              SourceBotVersion: 'DRAFT', // ✅ required: take the current draft locale
            },
          },
          {
            LocaleId: 'es_ES',
            BotVersionLocaleDetails: {
              SourceBotVersion: 'DRAFT',
            },
          },
        ],
      },
    });

    // Ensure alias waits for version creation
    lexBotVersion.node.addDependency(lexBot);

    // ========================================
    // Bot alias with Lambda association
    // ========================================
    const botAlias = new cdk.CfnResource(this, 'ProdBotAlias', {
      type: 'AWS::Lex::BotAlias',
      properties: {
        BotId: lexBot.getAtt('Id').toString(),
        BotAliasName: 'Production',
        // Use the dynamically created BotVersion
        BotVersion: lexBotVersion.getAtt('BotVersion').toString(),
        BotAliasLocaleSettings: [
          {
            LocaleId: 'en_US',
            BotAliasLocaleSetting: {
              Enabled: true,
              CodeHookSpecification: {
                LambdaCodeHook: {
                  LambdaArn: fulfillmentLambda.functionArn,
                  CodeHookInterfaceVersion: '1.0',
                },
              },
            },
          },
          {
            LocaleId: 'es_ES',
            BotAliasLocaleSetting: {
              Enabled: true,
              CodeHookSpecification: {
                LambdaCodeHook: {
                  LambdaArn: fulfillmentLambda.functionArn,
                  CodeHookInterfaceVersion: '1.0',
                },
              },
            },
          },
        ],
        SentimentAnalysisSettings: {
          DetectSentiment: false,
        },
      },
    });
    botAlias.node.addDependency(lexBotVersion);

    // ========================================
    // 7. OPERATIONAL OBSERVABILITY
    // ========================================

    // Custom metric for Intent Recognition Accuracy
    const intentAccuracyMetric = new cloudwatch.Metric({
      namespace: 'AIplatform/Conversational',
      metricName: 'IntentRecognitionAccuracy',
      dimensionsMap: {
        Environment: environmentSuffix,
        BotName: `OmnichannelAIBot-${environmentSuffix}`,
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
    new cloudwatch.Alarm(this, 'FulfillmentLambdaErrorAlarm', {
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
      value: lexBot.getAtt('Id').toString(),
      description: 'Lex V2 Bot ID',
    });

    new cdk.CfnOutput(this, 'BotAliasId', {
      value: botAlias.getAtt('BotAliasId').toString(),
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
// Simple Lambda function for Lex fulfillment
// Note: This is a simplified version for testing purposes

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
