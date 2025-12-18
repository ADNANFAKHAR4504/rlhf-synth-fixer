import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface ServerlessStackProps extends cdk.NestedStackProps {
  environmentSuffix?: string;
  allowedIpCidrs?: string[];
}

export class ServerlessStack extends cdk.NestedStack {
  public readonly bucket: s3.Bucket;
  public readonly lambda: lambda.Function;
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props?: ServerlessStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const allowedIpCidrs = props?.allowedIpCidrs || ['0.0.0.0/0'];

    // S3 Bucket for User Data with versioning enabled
    this.bucket = new s3.Bucket(this, 'CorpUserDataBucket', {
      bucketName: `corp-user-data-bucket-${environmentSuffix}`.toLowerCase(),
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // IAM Role for Lambda function
    const lambdaRole = new iam.Role(this, 'CorpLambdaRole', {
      roleName: `CorpLambdaRole-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add permissions to write to S3 bucket
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:PutObject',
          's3:PutObjectAcl',
          's3:GetObject',
          's3:DeleteObject',
        ],
        resources: [`${this.bucket.bucketArn}/*`],
      })
    );

    // Add permissions to list bucket contents
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:ListBucket'],
        resources: [this.bucket.bucketArn],
      })
    );

    // Lambda function for processing user data
    this.lambda = new lambda.Function(this, 'CorpUserDataProcessor', {
      functionName: `CorpUserDataProcessor-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'us-east-1' });

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    // Extract data from the event
    const userData = event.body ? JSON.parse(event.body) : event;
    
    // Log the input data
    console.log('Processing user data:', userData);
    
    // Generate a unique key for the S3 object
    const timestamp = new Date().toISOString();
    const key = \`user-data-\${Date.now()}.json\`;
    
    // Store data in S3 bucket
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      Body: JSON.stringify({
        ...userData,
        processedAt: timestamp,
        requestId: event.requestId || event.requestContext?.requestId || 'unknown'
      }),
      ContentType: 'application/json'
    });
    
    await s3Client.send(putObjectCommand);
    console.log(\`Data stored in S3 with key: \${key}\`);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'User data processed successfully',
        s3Key: key,
        timestamp: timestamp
      })
    };
  } catch (error) {
    console.error('Error processing user data:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Error processing user data',
        error: error.message
      })
    };
  }
};
      `),
      environment: {
        BUCKET_NAME: this.bucket.bucketName,
      },
    });

    // API Gateway with IP whitelisting
    this.api = new apigateway.RestApi(this, 'CorpUserDataApi', {
      restApiName: `CorpUserDataApi-${environmentSuffix}`,
      description: 'API Gateway for processing user data with IP whitelisting',
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['execute-api:/*'],
            conditions: {
              IpAddress: {
                'aws:SourceIp': allowedIpCidrs,
              },
            },
          }),
        ],
      }),
    });

    // Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(this.lambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    // API Gateway resource and method
    const userData = this.api.root.addResource('userdata');
    userData.addMethod('POST', lambdaIntegration);
    userData.addMethod('GET', lambdaIntegration);

    // Add CORS preflight for OPTIONS method
    userData.addMethod(
      'OPTIONS',
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers':
                "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
              'method.response.header.Access-Control-Allow-Origin': "'*'",
              'method.response.header.Access-Control-Allow-Methods':
                "'GET,POST,OPTIONS'",
            },
          },
        ],
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true,
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
        ],
      }
    );

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'Name of the S3 bucket for user data',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.lambda.functionName,
      description: 'Name of the Lambda function',
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.api.url,
      description: 'URL of the API Gateway',
    });

    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: this.api.restApiId,
      description: 'ID of the API Gateway',
    });
  }
}
