import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface RegionalStackProps extends cdk.StackProps {
  tableName: string;
  tableArn: string;
  kmsKeyArn: string;
  region: string;
  environmentSuffix: string;
}

export class RegionalStack extends cdk.Stack {
  public readonly apiGateway: apigateway.RestApi;
  public readonly apiEndpoint: string;
  public readonly healthCheckPath: string = '/health';
  public readonly websiteBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: RegionalStackProps) {
    super(scope, id, props);

    // Create a VPC for the Lambda functions with minimal resources for faster deployment
    const vpc = new ec2.Vpc(this, `PaymentsVpc-${props.environmentSuffix}`, {
      maxAzs: 2,
      natGateways: 0, // Use VPC endpoints instead of NAT Gateway for faster deployment
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Add VPC endpoints for DynamoDB and S3
    vpc.addGatewayEndpoint(`DynamoDbEndpoint-${props.environmentSuffix}`, {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    // Security group for Lambda functions
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      `LambdaSecurityGroup-${props.environmentSuffix}`,
      {
        vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: true,
      }
    );

    // Create the S3 bucket for static website
    // Need explicit bucket name for cross-region access
    this.websiteBucket = new s3.Bucket(
      this,
      `WebsiteBucket-${props.environmentSuffix}`,
      {
        bucketName: `payments-website-${props.region}-${props.environmentSuffix}-${this.account}`.toLowerCase(),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        enforceSSL: true,
      }
    );

    // Create the Lambda Authorizer
    const authorizerLambda = new lambda.Function(
      this,
      `AuthorizerLambda-${props.environmentSuffix}`,
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset('lib/lambdas/authorizer'),
        handler: 'index.handler',
        environment: {
          REGION: props.region,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Create the Transfer Lambda function within VPC
    // Using least privilege IAM role with specific permissions
    const transferLambdaRole = new iam.Role(
      this,
      `TransferLambdaRole-${props.environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      }
    );

    // Add specific permissions to DynamoDB table - no wildcards
    transferLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:UpdateItem',
          'dynamodb:Query',
        ],
        resources: [props.tableArn, `${props.tableArn}/index/*`],
      })
    );

    // Add specific KMS permissions
    transferLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
        resources: [props.kmsKeyArn],
      })
    );

    // Add VPC access permissions
    transferLambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaVPCAccessExecutionRole'
      )
    );

    // Add CloudWatch Logs permissions
    transferLambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole'
      )
    );

    // Create the transfer Lambda function in VPC
    const transferLambda = new lambda.Function(
      this,
      `TransferLambda-${props.environmentSuffix}`,
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset('lib/lambdas/transfer'),
        handler: 'index.handler',
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [lambdaSecurityGroup],
        role: transferLambdaRole,
        environment: {
          TABLE_NAME: props.tableName,
          REGION: props.region,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
        timeout: cdk.Duration.seconds(30),
      }
    );

    // Create the API Gateway with Lambda Authorizer
    this.apiGateway = new apigateway.RestApi(
      this,
      `PaymentsApi-${props.environmentSuffix}`,
      {
        restApiName: `payments-api-${props.environmentSuffix}`,
        deployOptions: {
          stageName: 'prod',
          loggingLevel: apigateway.MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
        },
        defaultCorsPreflightOptions: {
          allowOrigins: apigateway.Cors.ALL_ORIGINS,
          allowMethods: apigateway.Cors.ALL_METHODS,
        },
      }
    );

    const authorizer = new apigateway.TokenAuthorizer(
      this,
      `ApiAuthorizer-${props.environmentSuffix}`,
      {
        handler: authorizerLambda,
      }
    );

    // Add health check endpoint (no authorization required)
    const healthResource = this.apiGateway.root.addResource('health');
    healthResource.addMethod(
      'GET',
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': JSON.stringify({
                status: 'healthy',
                region: props.region,
              }),
            },
          },
        ],
        requestTemplates: {
          'application/json': '{ "statusCode": 200 }',
        },
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL,
            },
          },
        ],
      }
    );

    // Add transfer endpoint with Lambda Authorizer
    const transferResource = this.apiGateway.root.addResource('transfer');

    const transferIntegration = new apigateway.LambdaIntegration(
      transferLambda,
      {
        proxy: true,
      }
    );

    transferResource.addMethod('POST', transferIntegration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
    });

    this.apiEndpoint = this.apiGateway.url;

    // Output values
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.apiGateway.url,
      description: 'URL of the API Gateway',
      exportName: `ApiGatewayUrl-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: this.websiteBucket.bucketName,
      description: 'Name of the S3 bucket for the website',
      exportName: `WebsiteBucketName-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'Region', {
      value: props.region,
      description: 'Deployment Region',
      exportName: `Region-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'HealthCheckPath', {
      value: this.healthCheckPath,
      description: 'Health check path for Route53',
      exportName: `HealthCheckPath-${props.region}-${props.environmentSuffix}`,
    });
  }
}
