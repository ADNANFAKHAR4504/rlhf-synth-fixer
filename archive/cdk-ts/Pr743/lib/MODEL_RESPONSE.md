## bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();
new TapStack(app, 'TapStack', {
  env: {
    region: 'us-east-1',
  },
});
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const kmsKey = new kms.Key(this, 'TapS3Key', {
      description: 'KMS key for S3 bucket encryption',
      enableKeyRotation: true,
    });

    const bucket = new s3.Bucket(this, 'TapBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const lambdaRole = new iam.Role(this, 'TapLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    bucket.grantReadWrite(lambdaRole);
    kmsKey.grantEncryptDecrypt(lambdaRole);

    const logGroup = new logs.LogGroup(this, 'TapLambdaLogGroup', {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const lambdaFunction = new lambda.Function(this, 'TapLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      logGroup: logGroup,
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3();
        exports.handler = async (event) => {
          console.log('Request:', JSON.stringify(event, null, 2));
          
          const response = {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: 'Hello from Lambda!',
              timestamp: new Date().toISOString(),
              bucketName: process.env.BUCKET_NAME,
            }),
          };
          
          console.log('Response:', JSON.stringify(response, null, 2));
          
          return response;
        };
      `),
    });

    const api = new apigateway.RestApi(this, 'TapApi', {
      restApiName: 'Tap Service',
      description: 'API Gateway for Tap Lambda function',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction);
    api.root.addMethod('ANY', lambdaIntegration);
    api.root.addProxy({
      defaultIntegration: lambdaIntegration,
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: lambdaFunction.functionArn,
      description: 'Lambda Function ARN',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: bucket.bucketName,
      description: 'S3 Bucket Name',
    });
  }
}
```

## cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": false,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-nordicapis-apigateway:normalizeMethodOptions": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true
  }
}
```