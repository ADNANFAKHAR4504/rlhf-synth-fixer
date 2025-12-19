import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
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

    // ==================== VPC Configuration ====================
    // Create VPC for API Gateway
    const vpc = new ec2.Vpc(this, `TapVpc-${environmentSuffix}`, {
      vpcName: `tap-vpc-${environmentSuffix}`,
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
        },
      ],
    });
    cdk.Tags.of(vpc).add('iac-rlhf-amazon', 'true');

    // VPC Endpoint for API Gateway
    const apiGatewayEndpoint = vpc.addInterfaceEndpoint('ApiGatewayEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
    });
    cdk.Tags.of(apiGatewayEndpoint).add('iac-rlhf-amazon', 'true');

    // ==================== S3 Bucket ====================
    // S3 bucket for static files storage
    const staticFilesBucket = new s3.Bucket(
      this,
      `StaticFilesBucket-${environmentSuffix}`,
      {
        bucketName: `tap-static-files-${environmentSuffix}-${this.account}`,
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        cors: [
          {
            allowedHeaders: ['*'],
            allowedMethods: [
              s3.HttpMethods.GET,
              s3.HttpMethods.PUT,
              s3.HttpMethods.POST,
              s3.HttpMethods.DELETE,
              s3.HttpMethods.HEAD,
            ],
            allowedOrigins: ['*'],
            exposedHeaders: ['ETag'],
            maxAge: 3000,
          },
        ],
      }
    );
    cdk.Tags.of(staticFilesBucket).add('iac-rlhf-amazon', 'true');

    // ==================== DynamoDB Table ====================
    // DynamoDB table for application data
    const applicationTable = new dynamodb.Table(
      this,
      `ApplicationTable-${environmentSuffix}`,
      {
        tableName: `tap-application-table-${environmentSuffix}`,
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'timestamp',
          type: dynamodb.AttributeType.NUMBER,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        pointInTimeRecovery: true,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Add Global Secondary Index for additional query patterns
    applicationTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    cdk.Tags.of(applicationTable).add('iac-rlhf-amazon', 'true');

    // ==================== Secrets Manager ====================
    // Secrets Manager for storing sensitive data
    const apiSecrets = new secretsmanager.Secret(
      this,
      `ApiSecrets-${environmentSuffix}`,
      {
        secretName: `tap-api-secrets-${environmentSuffix}`,
        description: 'API keys and other sensitive configuration',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            apiKey: 'default-api-key',
            dbPassword: 'default-db-password',
          }),
          generateStringKey: 'secretToken',
          excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        },
      }
    );
    cdk.Tags.of(apiSecrets).add('iac-rlhf-amazon', 'true');

    // ==================== CloudWatch Log Groups ====================
    // Log group for Lambda functions
    const lambdaLogGroup = new logs.LogGroup(
      this,
      `LambdaLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/lambda/tap-${environmentSuffix}`,
        retention: logs.RetentionDays.TWO_WEEKS,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );
    cdk.Tags.of(lambdaLogGroup).add('iac-rlhf-amazon', 'true');

    // ==================== IAM Role for Lambda ====================
    // IAM role for Lambda execution
    const lambdaExecutionRole = new iam.Role(
      this,
      `LambdaExecutionRole-${environmentSuffix}`,
      {
        roleName: `tap-lambda-execution-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],
        inlinePolicies: {
          CustomPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                resources: [
                  `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/*`,
                ],
              }),
            ],
          }),
        },
      }
    );
    cdk.Tags.of(lambdaExecutionRole).add('iac-rlhf-amazon', 'true');

    // ==================== Lambda Functions ====================
    // Main application Lambda function
    const mainLambdaFunction = new NodejsFunction(
      this,
      `MainLambdaFunction-${environmentSuffix}`,
      {
        functionName: `tap-main-function-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: 'lib/lambda/main-handler.ts',
        handler: 'handler',
        bundling: {
          externalModules: [
            '@aws-sdk/*', // AWS SDK v3 is included in Node.js 18+ runtime
          ],
          minify: true,
          sourceMap: false,
        },
        role: lambdaExecutionRole,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        vpc: vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        environment: {
          ENVIRONMENT_SUFFIX: environmentSuffix,
          DYNAMODB_TABLE_NAME: applicationTable.tableName,
          S3_BUCKET_NAME: staticFilesBucket.bucketName,
          SECRET_NAME: apiSecrets.secretName,
          REGION: this.region,
        },
        logGroup: lambdaLogGroup,
      }
    );
    cdk.Tags.of(mainLambdaFunction).add('iac-rlhf-amazon', 'true');

    // CRUD operations Lambda function
    const crudLambdaFunction = new NodejsFunction(
      this,
      `CrudLambdaFunction-${environmentSuffix}`,
      {
        functionName: `tap-crud-function-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: 'lib/lambda/crud-handler.ts',
        handler: 'handler',
        bundling: {
          externalModules: [
            '@aws-sdk/*', // AWS SDK v3 is included in Node.js 18+ runtime
          ],
          minify: true,
          sourceMap: false,
        },
        role: lambdaExecutionRole,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        vpc: vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        environment: {
          ENVIRONMENT_SUFFIX: environmentSuffix,
          DYNAMODB_TABLE_NAME: applicationTable.tableName,
          REGION: this.region,
        },
        logGroup: lambdaLogGroup,
      }
    );
    cdk.Tags.of(crudLambdaFunction).add('iac-rlhf-amazon', 'true');

    // File processing Lambda function
    const fileProcessingLambdaFunction = new NodejsFunction(
      this,
      `FileProcessingLambdaFunction-${environmentSuffix}`,
      {
        functionName: `tap-file-processing-function-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: 'lib/lambda/file-processing-handler.ts',
        handler: 'handler',
        bundling: {
          externalModules: [
            '@aws-sdk/*', // AWS SDK v3 is included in Node.js 18+ runtime
          ],
          minify: true,
          sourceMap: false,
        },
        role: lambdaExecutionRole,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        vpc: vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        environment: {
          ENVIRONMENT_SUFFIX: environmentSuffix,
          S3_BUCKET_NAME: staticFilesBucket.bucketName,
          DYNAMODB_TABLE_NAME: applicationTable.tableName,
          REGION: this.region,
        },
        logGroup: lambdaLogGroup,
      }
    );
    cdk.Tags.of(fileProcessingLambdaFunction).add('iac-rlhf-amazon', 'true');

    // ==================== Grant Permissions ====================
    // Grant Lambda functions permissions to access resources
    applicationTable.grantReadWriteData(mainLambdaFunction);
    applicationTable.grantReadWriteData(crudLambdaFunction);
    applicationTable.grantReadWriteData(fileProcessingLambdaFunction);
    staticFilesBucket.grantReadWrite(mainLambdaFunction);
    staticFilesBucket.grantReadWrite(fileProcessingLambdaFunction);
    apiSecrets.grantRead(mainLambdaFunction);

    // ==================== API Gateway ====================
    // REST API Gateway
    const restApi = new apigateway.RestApi(
      this,
      `TapRestApi-${environmentSuffix}`,
      {
        restApiName: `tap-api-${environmentSuffix}`,
        description: 'TAP Serverless Application API',
        deployOptions: {
          stageName: environmentSuffix,
          loggingLevel: apigateway.MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
          tracingEnabled: true,
          metricsEnabled: true,
        },
        defaultCorsPreflightOptions: {
          allowOrigins: apigateway.Cors.ALL_ORIGINS,
          allowMethods: apigateway.Cors.ALL_METHODS,
          allowHeaders: [
            'Content-Type',
            'X-Amz-Date',
            'Authorization',
            'X-Api-Key',
            'X-Amz-Security-Token',
          ],
        },
        endpointConfiguration: {
          types: [apigateway.EndpointType.PRIVATE],
          vpcEndpoints: [apiGatewayEndpoint],
        },
        policy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              principals: [new iam.AnyPrincipal()],
              actions: ['execute-api:Invoke'],
              resources: ['execute-api:/*'],
            }),
          ],
        }),
      }
    );
    cdk.Tags.of(restApi).add('iac-rlhf-amazon', 'true');

    // ==================== API Gateway Integrations ====================
    // Main endpoint integration
    const mainIntegration = new apigateway.LambdaIntegration(
      mainLambdaFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    // CRUD endpoint integration
    const crudIntegration = new apigateway.LambdaIntegration(
      crudLambdaFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    // File processing endpoint integration
    const fileIntegration = new apigateway.LambdaIntegration(
      fileProcessingLambdaFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    // ==================== API Gateway Routes ====================
    // Root endpoint
    const rootResource = restApi.root;
    rootResource.addMethod('GET', mainIntegration);

    // /api resource
    const apiResource = rootResource.addResource('api');
    apiResource.addMethod('GET', mainIntegration);

    // /api/items resource for CRUD operations
    const itemsResource = apiResource.addResource('items');
    itemsResource.addMethod('GET', crudIntegration);
    itemsResource.addMethod('POST', crudIntegration);

    // /api/items/{id} resource
    const itemResource = itemsResource.addResource('{id}');
    itemResource.addMethod('GET', crudIntegration);
    itemResource.addMethod('PUT', crudIntegration);
    itemResource.addMethod('DELETE', crudIntegration);

    // /api/files resource for file operations
    const filesResource = apiResource.addResource('files');
    filesResource.addMethod('GET', fileIntegration);
    filesResource.addMethod('POST', fileIntegration);

    // /api/files/{filename} resource
    const fileResource = filesResource.addResource('{filename}');
    fileResource.addMethod('GET', fileIntegration);
    fileResource.addMethod('DELETE', fileIntegration);

    // ==================== CloudFormation Outputs ====================
    // Output important resource information
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: restApi.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: staticFilesBucket.bucketName,
      description: 'S3 bucket name for static files',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: applicationTable.tableName,
      description: 'DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'SecretName', {
      value: apiSecrets.secretName,
      description: 'Secrets Manager secret name',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'MainLambdaFunctionArn', {
      value: mainLambdaFunction.functionArn,
      description: 'Main Lambda function ARN',
    });
  }
}
