# CDK TypeScript Infrastructure Code


## tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const kmsKey = new kms.Key(this, 'S3BucketKey', {
      description: 'KMS key for S3 bucket encryption',
      alias: `alias/tap/s3-key-${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const bucket = new s3.Bucket(this, 'SecureDataBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const lambdaLogGroup = new logs.LogGroup(this, 'ApiHandlerLogGroup', {
      logGroupName: `/tap/lambda/api-handler-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const lambdaRole = new iam.Role(this, 'ApiHandlerRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `IAM role for the API handler Lambda function in ${environmentSuffix}`,
      inlinePolicies: {
        LambdaLoggingPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              resources: [lambdaLogGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    bucket.grantWrite(lambdaRole);
    kmsKey.grantEncrypt(lambdaRole);

    const apiHandler = new lambda.Function(this, 'ApiHandlerLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: lambdaRole,
      logGroup: lambdaLogGroup,
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
      code: lambda.Code.fromInline(`
        const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
        const s3 = new S3Client({});
        exports.handler = async (event) => {
          console.log('Request:', JSON.stringify(event, null, 2));
          const bucketName = process.env.BUCKET_NAME;
          const key = \`requests/\${new Date().toISOString()}-\${event.requestContext.requestId}.json\`;
          const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: JSON.stringify(event),
            ContentType: 'application/json'
          });
          try {
            await s3.send(command);
            console.log(\`Successfully saved request to s3://\${bucketName}/\${key}\`);
          } catch (error) {
            console.error('Error saving to S3:', error);
            throw error;
          }
          const response = {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: "Request processed and stored successfully.",
              s3_key: key
            })
          };
          console.log('Response:', JSON.stringify(response, null, 2));
          return response;
        };
      `),
    });

    const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayAccessLogs', {
      logGroupName: `/tap/apigw/access-logs-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const apiGatewayCloudWatchRole = new iam.Role(
      this,
      'ApiGatewayCloudWatchRole',
      {
        assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonAPIGatewayPushToCloudWatchLogs'
          ),
        ],
      }
    );

    const cfnAccount = new apigateway.CfnAccount(
      this,
      'ApiGatewayAccountConfig',
      {
        cloudWatchRoleArn: apiGatewayCloudWatchRole.roleArn,
      }
    );

    const api = new apigateway.LambdaRestApi(this, 'SecureApi', {
      handler: apiHandler,
      restApiName: `Tap Service API - ${environmentSuffix}`,
      description: 'API Gateway for the Tap Lambda function',
      proxy: true,
      deployOptions: {
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiLogGroup
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        metricsEnabled: true,
        stageName: environmentSuffix,
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
    });

    api.node.addDependency(cfnAccount);

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'The URL of the API Gateway endpoint',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: apiHandler.functionArn,
      description: 'The ARN of the Lambda function',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: bucket.bucketName,
      description: 'The name of the S3 bucket',
    });

    // Tag all resources in the stack
    cdk.Tags.of(this).add('Project', 'TAP');
  }
}
```
