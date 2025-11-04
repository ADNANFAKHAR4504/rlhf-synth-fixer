import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

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
  public readonly oai: cloudfront.OriginAccessIdentity;

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
        bucketName:
          `payments-website-${props.region}-${props.environmentSuffix}-${this.account}`.toLowerCase(),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        enforceSSL: true,
      }
    );

    // Create CloudFront Origin Access Identity for this bucket
    this.oai = new cloudfront.OriginAccessIdentity(
      this,
      `WebsiteBucketOAI-${props.environmentSuffix}`,
      {
        comment: `OAI for ${this.websiteBucket.bucketName}`,
      }
    );

    // Grant CloudFront OAI read access to the bucket
    // Use grantRead to merge with existing bucket policy (auto-delete policy)
    this.websiteBucket.grantRead(this.oai);

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
    // Note: No GSIs defined on the table, so only table ARN is needed
    // For Global Tables, construct the ARN using the current region
    // This ensures the Lambda in each region has permissions to its regional replica
    const regionalTableArn = `arn:aws:dynamodb:${props.region}:${cdk.Aws.ACCOUNT_ID}:table/${props.tableName}`;

    transferLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:UpdateItem',
          'dynamodb:Query',
        ],
        resources: [regionalTableArn],
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

    // Add Secrets Manager permissions
    transferLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [
          `arn:aws:secretsmanager:${props.region}:${this.account}:secret:payments/*`,
        ],
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

    // Create Application Load Balancer for VPC Link private integration
    // ALB is required because it supports Lambda targets (NLB does not)
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `TransferALB-${props.environmentSuffix}`,
      {
        vpc,
        internetFacing: false,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      }
    );

    // Create target group for Lambda
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `TransferTargetGroup-${props.environmentSuffix}`,
      {
        targets: [new targets.LambdaTarget(transferLambda)],
      }
    );

    // Add listener to ALB
    const listener = alb.addListener(`Listener-${props.environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Grant ALB permission to invoke Lambda
    transferLambda.grantInvoke(
      new iam.ServicePrincipal('elasticloadbalancing.amazonaws.com')
    );

    // Create VPC Link for private API Gateway integration
    // Note: VPC Link for REST API only supports NLB, but we need ALB for Lambda targets
    // So we create an NLB that forwards to the ALB
    const nlb = new elbv2.NetworkLoadBalancer(
      this,
      `TransferNLB-${props.environmentSuffix}`,
      {
        vpc,
        internetFacing: false,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      }
    );

    // Create NLB target group pointing to ALB listener
    const nlbTargetGroup = new elbv2.NetworkTargetGroup(
      this,
      `NLBTargetGroup-${props.environmentSuffix}`,
      {
        vpc,
        port: 80,
        protocol: elbv2.Protocol.TCP,
        targetType: elbv2.TargetType.ALB,
        targets: [new targets.AlbListenerTarget(listener)],
      }
    );

    // Add listener to NLB
    nlb.addListener(`NLBListener-${props.environmentSuffix}`, {
      port: 80,
      protocol: elbv2.Protocol.TCP,
      defaultTargetGroups: [nlbTargetGroup],
    });

    // Create VPC Link for private API Gateway integration
    const vpcLink = new apigateway.VpcLink(
      this,
      `VpcLink-${props.environmentSuffix}`,
      {
        targets: [nlb],
        vpcLinkName: `payments-vpc-link-${props.environmentSuffix}`,
      }
    );

    // Create the API Gateway with Lambda Authorizer
    this.apiGateway = new apigateway.RestApi(
      this,
      `PaymentsApi-${props.environmentSuffix}`,
      {
        restApiName: `payments-api-${props.environmentSuffix}`,
        endpointConfiguration: {
          types: [apigateway.EndpointType.REGIONAL],
        },
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

    // Create /api resource for CloudFront integration (no path rewriting needed)
    const apiResource = this.apiGateway.root.addResource('api');

    // Add /api/health endpoint (no authorization required)
    const apiHealthResource = apiResource.addResource('health');
    apiHealthResource.addMethod(
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

    // Use HTTP integration with VPC Link for private communication
    const transferIntegration = new apigateway.Integration({
      type: apigateway.IntegrationType.HTTP_PROXY,
      integrationHttpMethod: 'ANY',
      uri: `http://${nlb.loadBalancerDnsName}/`,
      options: {
        connectionType: apigateway.ConnectionType.VPC_LINK,
        vpcLink: vpcLink,
      },
    });

    // Add /api/transfer endpoint with Lambda Authorizer
    const apiTransferResource = apiResource.addResource('transfer');
    apiTransferResource.addMethod('POST', transferIntegration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
    });

    // Also keep the original /health and /transfer endpoints for direct access
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

    const transferResource = this.apiGateway.root.addResource('transfer');
    transferResource.addMethod('POST', transferIntegration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
    });

    this.apiEndpoint = this.apiGateway.url;

    // Output values for integration testing
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.apiGateway.url,
      description: 'URL of the API Gateway',
      exportName: `ApiGatewayUrl-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: this.apiGateway.restApiId,
      description: 'API Gateway REST API ID',
      exportName: `ApiGatewayId-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TransferEndpoint', {
      value: `${this.apiGateway.url}transfer`,
      description: 'Full URL of the /transfer endpoint',
      exportName: `TransferEndpoint-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'HealthEndpoint', {
      value: `${this.apiGateway.url}health`,
      description: 'Full URL of the /health endpoint',
      exportName: `HealthEndpoint-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: this.websiteBucket.bucketName,
      description: 'Name of the S3 bucket for the website',
      exportName: `WebsiteBucketName-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'WebsiteBucketArn', {
      value: this.websiteBucket.bucketArn,
      description: 'ARN of the S3 bucket for the website',
      exportName: `WebsiteBucketArn-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TransferLambdaArn', {
      value: transferLambda.functionArn,
      description: 'ARN of the Transfer Lambda function',
      exportName: `TransferLambdaArn-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TransferLambdaName', {
      value: transferLambda.functionName,
      description: 'Name of the Transfer Lambda function',
      exportName: `TransferLambdaName-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AuthorizerLambdaArn', {
      value: authorizerLambda.functionArn,
      description: 'ARN of the Authorizer Lambda function',
      exportName: `AuthorizerLambdaArn-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AuthorizerLambdaName', {
      value: authorizerLambda.functionName,
      description: 'Name of the Authorizer Lambda function',
      exportName: `AuthorizerLambdaName-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcLinkId', {
      value: vpcLink.vpcLinkId,
      description: 'VPC Link ID',
      exportName: `VpcLinkId-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: lambdaSecurityGroup.securityGroupId,
      description: 'Lambda Security Group ID',
      exportName: `LambdaSecurityGroupId-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ALBDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
      exportName: `ALBDnsName-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'NLBDnsName', {
      value: nlb.loadBalancerDnsName,
      description: 'Network Load Balancer DNS Name',
      exportName: `NLBDnsName-${props.region}-${props.environmentSuffix}`,
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

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: props.tableName,
      description: 'DynamoDB Table Name',
      exportName: `DynamoDBTableName-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DynamoDBTableArn', {
      value: props.tableArn,
      description: 'DynamoDB Table ARN',
      exportName: `DynamoDBTableArn-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KMSKeyArn', {
      value: props.kmsKeyArn,
      description: 'KMS Key ARN for encryption',
      exportName: `KMSKeyArn-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'OAIId', {
      value: this.oai.originAccessIdentityId,
      description: 'CloudFront Origin Access Identity ID',
      exportName: `OAIId-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'OAICanonicalUserId', {
      value: this.oai.cloudFrontOriginAccessIdentityS3CanonicalUserId,
      description: 'CloudFront OAI S3 Canonical User ID',
      exportName: `OAICanonicalUserId-${props.region}-${props.environmentSuffix}`,
    });
  }
}
