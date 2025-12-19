import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface InfraStackProps extends cdk.StackProps {
  environmentSuffix: string;
  projectName?: string;
  apiThrottleRate?: number;
  apiThrottleBurst?: number;
  lambdaMemorySize?: number;
  lambdaTimeout?: number;
  dynamodbReadCapacity?: number;
  dynamodbWriteCapacity?: number;
  enablePointInTimeRecovery?: boolean;
  logRetentionDays?: number;
  enableApiGatewayCaching?: boolean;
  apiGatewayCacheSize?: number;
  apiGatewayCacheTtl?: number;
}

export class InfraStack extends cdk.Stack {
  public readonly apiEndpoint: cdk.CfnOutput;
  public readonly dynamodbTableArn: cdk.CfnOutput;
  public readonly s3BucketName: cdk.CfnOutput;
  public readonly s3BucketArn: cdk.CfnOutput;
  public readonly lambdaFunctionArn: cdk.CfnOutput;
  public readonly lambdaFunctionName: cdk.CfnOutput;
  public readonly wafArn: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id, {
      ...props,
      description: `Serverless infrastructure stack for ${props.projectName || 'TapProject'} - ${props.environmentSuffix} environment`,
    });

    // Set defaults
    const projectName = props.projectName || 'TapProject';
    const isProduction = props.environmentSuffix.toLowerCase().includes('prod');
    const removalPolicy = isProduction
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    // Default configuration values
    const config = {
      apiThrottleRate: props.apiThrottleRate || 100,
      apiThrottleBurst: props.apiThrottleBurst || 200,
      lambdaMemorySize: props.lambdaMemorySize || 512,
      lambdaTimeout: props.lambdaTimeout || 30,
      dynamodbReadCapacity: props.dynamodbReadCapacity || 5,
      dynamodbWriteCapacity: props.dynamodbWriteCapacity || 5,
      enablePointInTimeRecovery:
        props.enablePointInTimeRecovery ?? isProduction,
      logRetentionDays: props.logRetentionDays || (isProduction ? 90 : 7),
      enableApiGatewayCaching: props.enableApiGatewayCaching ?? isProduction,
      apiGatewayCacheSize: Math.max(0, props.apiGatewayCacheSize || 0.5), // 0.5 GB default, ensure non-negative
      apiGatewayCacheTtl: Math.max(0, props.apiGatewayCacheTtl || 300), // 5 minutes default, ensure non-negative
    };

    // Common tags
    const commonTags = {
      ProjectName: projectName,
      Environment: props.environmentSuffix,
    };

    // Apply tags to all resources in the stack
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // ==================== DynamoDB Table ====================
    const dynamoTable = this.createDynamoDBTable(
      props.environmentSuffix,
      removalPolicy,
      config,
      commonTags
    );

    // ==================== S3 Bucket ====================
    const mediaBucket = this.createS3Bucket(
      props.environmentSuffix,
      removalPolicy,
      commonTags
    );

    // ==================== Lambda Function ====================
    const lambdaFunction = this.createLambdaFunction(
      props.environmentSuffix,
      dynamoTable,
      mediaBucket,
      config,
      commonTags,
      removalPolicy
    );

    // ==================== API Gateway ====================
    const api = this.createApiGateway(
      props.environmentSuffix,
      lambdaFunction,
      config,
      commonTags
    );

    // ==================== WAF ====================
    const webAcl = this.createWAF(props.environmentSuffix, api, commonTags);

    // ==================== Outputs ====================
    this.apiEndpoint = new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: `${projectName}-${props.environmentSuffix}-api-endpoint`,
    });

    this.dynamodbTableArn = new cdk.CfnOutput(this, 'DynamoDBTableArn', {
      value: dynamoTable.tableArn,
      description: 'DynamoDB table ARN',
      exportName: `${projectName}-${props.environmentSuffix}-dynamodb-arn`,
    });

    this.s3BucketName = new cdk.CfnOutput(this, 'S3BucketName', {
      value: mediaBucket.bucketName,
      description: 'S3 bucket name for media storage',
      exportName: `${projectName}-${props.environmentSuffix}-s3-bucket-name`,
    });

    this.s3BucketArn = new cdk.CfnOutput(this, 'S3BucketArn', {
      value: mediaBucket.bucketArn,
      description: 'S3 bucket ARN for media storage',
      exportName: `${projectName}-${props.environmentSuffix}-s3-bucket-arn`,
    });

    this.lambdaFunctionArn = new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: lambdaFunction.functionArn,
      description: 'Lambda function ARN',
      exportName: `${projectName}-${props.environmentSuffix}-lambda-arn`,
    });

    this.lambdaFunctionName = new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Lambda function name',
      exportName: `${projectName}-${props.environmentSuffix}-lambda-name`,
    });

    this.wafArn = new cdk.CfnOutput(this, 'WAFArn', {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
      exportName: `${projectName}-${props.environmentSuffix}-waf-arn`,
    });
  }

  /**
   * Utility function to apply tags to CDK resources
   * @param resource - The CDK resource to tag
   * @param tags - Tags object with key-value pairs
   */
  private applyTags(resource: cdk.Resource, tags: any): void {
    if (tags) {
      Object.entries(tags).forEach(([key, value]) => {
        cdk.Tags.of(resource).add(key, value as string);
      });
    }
  }

  private createDynamoDBTable(
    environmentSuffix: string,
    removalPolicy: cdk.RemovalPolicy,
    config: any,
    tags: any
  ): dynamodb.Table {
    const table = new dynamodb.Table(this, 'RequestTable', {
      tableName: `tap-requests-${environmentSuffix}`,
      partitionKey: {
        name: 'RequestId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: config.dynamodbReadCapacity,
      writeCapacity: config.dynamodbWriteCapacity,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: config.enablePointInTimeRecovery,
      },
      removalPolicy,
      contributorInsightsEnabled: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Add metadata
    const cfnTable = table.node.defaultChild as dynamodb.CfnTable;
    cfnTable.addMetadata(
      'Purpose',
      'Store API request data with RequestId as primary key'
    );
    cfnTable.addMetadata(
      'Encryption',
      'AWS managed encryption at rest enabled'
    );

    // Add Global Secondary Index on Timestamp
    table.addGlobalSecondaryIndex({
      indexName: 'TimestampIndex',
      partitionKey: {
        name: 'Timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
      readCapacity: config.dynamodbReadCapacity,
      writeCapacity: config.dynamodbWriteCapacity,
    });

    // Apply tags to the table
    this.applyTags(table, tags);

    return table;
  }

  private createS3Bucket(
    environmentSuffix: string,
    removalPolicy: cdk.RemovalPolicy,
    tags: any
  ): s3.Bucket {
    const bucket = new s3.Bucket(this, 'MediaBucket', {
      bucketName:
        `tap-media-${environmentSuffix}`.toLowerCase() + '-' + this.account,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy,
      autoDeleteObjects: removalPolicy === cdk.RemovalPolicy.DESTROY,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });

    // Add metadata
    const cfnBucket = bucket.node.defaultChild as s3.CfnBucket;
    cfnBucket.addMetadata(
      'Purpose',
      'Store media files with versioning and encryption'
    );
    cfnBucket.addMetadata(
      'Security',
      'AES-256 encryption, SSL enforced, public access blocked'
    );

    // Apply tags to the bucket
    this.applyTags(bucket, tags);

    return bucket;
  }

  private createLambdaFunction(
    environmentSuffix: string,
    table: dynamodb.Table,
    bucket: s3.Bucket,
    config: any,
    tags: any,
    removalPolicy: cdk.RemovalPolicy
  ): lambda.Function {
    // Create CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/tap-processor-${environmentSuffix}`,
      retention: config.logRetentionDays as logs.RetentionDays,
      removalPolicy,
    });

    // Create Lambda execution role with least privilege
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `tap-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description:
        'Execution role for TAP Lambda function with least privilege',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add specific permissions for DynamoDB
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:UpdateItem',
          'dynamodb:Query',
          'dynamodb:BatchWriteItem',
        ],
        resources: [table.tableArn, `${table.tableArn}/index/*`],
      })
    );

    // Add specific permissions for S3
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:PutObject', 's3:GetObject', 's3:GetObjectVersion'],
        resources: [`${bucket.bucketArn}/*`],
      })
    );

    // Create Lambda function
    const lambdaFunction = new lambda.Function(this, 'ProcessorFunction', {
      functionName: `tap-processor-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(this.getLambdaCode()),
      memorySize: config.lambdaMemorySize,
      timeout: cdk.Duration.seconds(config.lambdaTimeout),
      role: lambdaRole,
      environment: {
        DYNAMODB_TABLE_NAME: table.tableName,
        S3_BUCKET_NAME: bucket.bucketName,
        ENVIRONMENT: environmentSuffix,
      },
      logGroup,
      tracing: lambda.Tracing.ACTIVE,
      retryAttempts: 2,
      maxEventAge: cdk.Duration.hours(1),
      reservedConcurrentExecutions: 100,
    });

    // Add metadata
    const cfnFunction = lambdaFunction.node.defaultChild as lambda.CfnFunction;
    cfnFunction.addMetadata(
      'Purpose',
      'Process API requests and store data in DynamoDB'
    );
    cfnFunction.addMetadata(
      'Retries',
      'Configured for 2 retry attempts on transient errors'
    );

    // Apply tags to the function
    this.applyTags(lambdaFunction, tags);

    return lambdaFunction;
  }

  private createApiGateway(
    environmentSuffix: string,
    lambdaFunction: lambda.Function,
    config: any,
    tags: any
  ): apigateway.RestApi {
    // Create REST API
    const api = new apigateway.RestApi(this, 'TapApi', {
      restApiName: `tap-api-${environmentSuffix}`,
      description: `RESTful API for TAP project - ${environmentSuffix}`,
      deployOptions: {
        stageName: environmentSuffix,
        throttlingRateLimit: config.apiThrottleRate,
        throttlingBurstLimit: config.apiThrottleBurst,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        cachingEnabled: config.enableApiGatewayCaching,
        cacheClusterEnabled: config.enableApiGatewayCaching,
        cacheClusterSize: config.enableApiGatewayCaching
          ? `${config.apiGatewayCacheSize}`
          : undefined,
        cacheTtl: config.enableApiGatewayCaching
          ? cdk.Duration.seconds(config.apiGatewayCacheTtl)
          : undefined,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        maxAge: cdk.Duration.hours(1),
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.EDGE],
      },
    });

    // Add metadata
    const cfnApi = api.node.defaultChild as apigateway.CfnRestApi;
    cfnApi.addMetadata(
      'Purpose',
      'RESTful API Gateway with throttling and CORS enabled'
    );
    cfnApi.addMetadata(
      'Throttling',
      `${config.apiThrottleRate} req/sec with ${config.apiThrottleBurst} burst`
    );
    cfnApi.addMetadata(
      'Caching',
      config.enableApiGatewayCaching
        ? `Enabled with ${config.apiGatewayCacheSize}GB cluster and ${config.apiGatewayCacheTtl}s TTL`
        : 'Disabled'
    );

    // Create Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction, {
      requestTemplates: {
        'application/json': '{ "statusCode": "200" }',
      },
      integrationResponses: [
        {
          statusCode: '200',
          responseTemplates: {
            'application/json': '',
          },
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
          },
        },
        {
          statusCode: '400',
          selectionPattern: '4\\d{2}',
          responseTemplates: {
            'application/json': '{ "error": "$context.error.message" }',
          },
        },
        {
          statusCode: '500',
          selectionPattern: '5\\d{2}',
          responseTemplates: {
            'application/json': '{ "error": "Internal server error" }',
          },
        },
      ],
    });

    // Add /process resource
    const processResource = api.root.addResource('process');

    // Add POST method
    processResource.addMethod('POST', lambdaIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
        { statusCode: '400' },
        { statusCode: '500' },
      ],
    });

    // Add GET method for health check
    processResource.addMethod('GET', lambdaIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    // Apply tags to the API
    this.applyTags(api, tags);

    return api;
  }

  private createWAF(
    environmentSuffix: string,
    api: apigateway.RestApi,
    tags: any
  ): wafv2.CfnWebACL {
    // Create WAF Web ACL
    const webAcl = new wafv2.CfnWebACL(this, 'TapWebAcl', {
      name: `tap-waf-${environmentSuffix}`,
      description: 'WAF rules to protect API Gateway from common attacks',
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'SQLiRule',
          priority: 1,
          statement: {
            sqliMatchStatement: {
              fieldToMatch: {
                allQueryArguments: {},
              },
              textTransformations: [
                {
                  priority: 0,
                  type: 'URL_DECODE',
                },
                {
                  priority: 1,
                  type: 'HTML_ENTITY_DECODE',
                },
              ],
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLiRule',
          },
        },
        {
          name: 'RateLimitRule',
          priority: 2,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSet',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `tap-waf-${environmentSuffix}`,
      },
    });

    // Add metadata
    webAcl.addMetadata(
      'Purpose',
      'Protect API Gateway from SQL injection and other common attacks'
    );
    webAcl.addMetadata(
      'Rules',
      'SQL injection protection, rate limiting, AWS managed rules'
    );
    // Apply tags to the WAF
    this.applyTags(webAcl as any, tags);

    const webAclAssociation = new wafv2.CfnWebACLAssociation(
      this,
      'WebAclAssociation',
      {
        resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${api.restApiId}/stages/${environmentSuffix}`,
        webAclArn: webAcl.attrArn,
      }
    );

    // Add explicit dependency to ensure WebACL is created before association
    webAclAssociation.addDependency(webAcl);
    webAclAssociation.addDependency(
      api.deploymentStage.node.defaultChild as apigateway.CfnStage
    );

    return webAcl;
  }

  private getLambdaCode(): string {
    return `
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Initialize AWS SDK v3 clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: { removeUndefinedValues: true },
});
const s3Client = new S3Client({});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const ENVIRONMENT = process.env.ENVIRONMENT;

exports.handler = async (event, context) => {
  console.log('Event received:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));
  
  try {
    const method = event.httpMethod || event.requestContext?.http?.method;
    
    // Handle GET request (health check)
    if (method === 'GET') {
      console.log('Processing health check request');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          status: 'healthy',
          environment: ENVIRONMENT,
          timestamp: new Date().toISOString(),
        }),
      };
    }
    
    // Handle POST request
    if (method === 'POST') {
      console.log('Processing POST request');
      
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      const requestId = context.requestId;
      const timestamp = Date.now();
      
      // Prepare DynamoDB item
      const item = {
        RequestId: requestId,
        Timestamp: timestamp,
        Environment: ENVIRONMENT,
        RequestBody: body,
        CreatedAt: new Date(timestamp).toISOString(),
        TTL: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days TTL
      };
      
      // Store in DynamoDB with retry logic
      let retries = 3;
      while (retries > 0) {
        try {
          await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: item,
            ConditionExpression: 'attribute_not_exists(RequestId)',
          }));
          console.log('Successfully stored item in DynamoDB:', requestId);
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          console.log(\`Retrying DynamoDB operation. Retries left: \${retries}\`);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, 3 - retries) * 100));
        }
      }
      
      // Store metadata in S3 if media content is present
      if (body.mediaContent) {
        const s3Key = \`requests/\${ENVIRONMENT}/\${requestId}.json\`;
        
        await s3Client.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: JSON.stringify(item),
          ContentType: 'application/json',
          ServerSideEncryption: 'AES256',
          Metadata: {
            'request-id': requestId,
            'environment': ENVIRONMENT,
          },
        }));
        console.log('Successfully stored metadata in S3:', s3Key);
      }
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Request processed successfully',
          requestId: requestId,
          timestamp: timestamp,
        }),
      };
    }
    
    // Method not allowed
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Check if it's a transient error that should be retried
    if (error.name === 'ProvisionedThroughputExceededException' || 
        error.name === 'RequestLimitExceeded' ||
        error.name === 'ServiceUnavailable' ||
        error.name === 'ThrottlingException') {
      // Throw error to trigger Lambda retry
      throw error;
    }
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        requestId: context.requestId,
      }),
    };
  }
};
    `;
  }
}
