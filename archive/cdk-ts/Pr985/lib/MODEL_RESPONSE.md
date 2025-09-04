# CDK TypeScript Security Infrastructure Solution

Here's a comprehensive CDK TypeScript solution for secure AWS infrastructure with all the requested security features:

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
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": false,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:disableRecursiveValidation": true,
    "@aws-cdk/aws-lambda:acceptTermsOfUseFor@aws-cdk_aws-lambda-python-alpha": true
  }
}
```

## bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Secure infrastructure stack with S3, IAM, RDS, GuardDuty, and API Gateway',
  tags: {
    Environment: environmentSuffix,
    Project: 'corp-security-infrastructure',
    Owner: 'security-team'
  }
});
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const accountId = cdk.Stack.of(this).account;
    
    // 1. S3 Bucket with SSE-S3 encryption
    const corpBucket = new s3.Bucket(this, 'corp-secure-bucket', {
      bucketName: `corp-secure-data-${accountId}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [{
        id: 'corp-lifecycle-rule',
        enabled: true,
        transitions: [{
          storageClass: s3.StorageClass.INTELLIGENT_TIERING,
          transitionAfter: cdk.Duration.days(30)
        }]
      }]
    });

    // 2. IAM Role with account boundary
    const corpExecutionRole = new iam.Role(this, 'corp-execution-role', {
      roleName: 'corp-secure-execution-role',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ],
      inlinePolicies: {
        'corp-s3-policy': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject'
              ],
              resources: [corpBucket.bucketArn + '/*'],
              conditions: {
                StringEquals: {
                  'aws:SourceAccount': accountId
                }
              }
            })
          ]
        })
      }
    });

    // IAM User with MFA enforcement
    const corpUser = new iam.User(this, 'corp-secure-user', {
      userName: 'corp-secure-service-user'
    });

    // MFA enforcement policy
    const mfaPolicy = new iam.Policy(this, 'corp-mfa-enforcement-policy', {
      policyName: 'corp-mfa-enforcement',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: ['*'],
          resources: ['*'],
          conditions: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false'
            },
            NumericLessThan: {
              'aws:MultiFactorAuthAge': '3600'
            }
          },
          principals: [corpUser]
        })
      ]
    });

    corpUser.attachInlinePolicy(mfaPolicy);

    // 3. VPC for RDS instance
    const corpVpc = new ec2.Vpc(this, 'corp-secure-vpc', {
      vpcName: 'corp-secure-vpc',
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'corp-private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
        }
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true
    });

    // Security group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'corp-rds-sg', {
      vpc: corpVpc,
      description: 'Security group for corp RDS instance',
      allowAllOutbound: false
    });

    rdsSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/16'),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from VPC'
    );

    // 4. RDS Instance (not internet-accessible)
    const corpDatabase = new rds.DatabaseInstance(this, 'corp-secure-database', {
      instanceIdentifier: 'corp-secure-db',
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      credentials: rds.Credentials.fromGeneratedSecret('corp_admin', {
        description: 'Corp database admin credentials',
        secretName: 'corp/db/credentials'
      }),
      vpc: corpVpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      securityGroups: [rdsSecurityGroup],
      multiAz: false,
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: true,
      storageEncrypted: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // 5. GuardDuty with Extended Threat Detection
    const guardDutyDetector = new guardduty.CfnDetector(this, 'corp-guardduty-detector', {
      enable: true,
      findingPublishingFrequency: 'FIFTEEN_MINUTES',
      dataSources: {
        s3Logs: {
          enable: true
        },
        kubernetesAuditLogs: {
          enable: true
        },
        malwareProtection: {
          scanEc2InstanceWithFindings: {
            ebsVolumes: true
          }
        }
      },
      features: [
        {
          name: 'EKS_AUDIT_LOGS',
          status: 'ENABLED'
        },
        {
          name: 'EBS_MALWARE_PROTECTION',
          status: 'ENABLED'
        },
        {
          name: 'RDS_LOGIN_EVENTS',
          status: 'ENABLED'
        },
        {
          name: 'LAMBDA_NETWORK_LOGS',
          status: 'ENABLED'
        }
      ]
    });

    // 6. API Gateway with comprehensive logging
    const apiLogGroup = new logs.LogGroup(this, 'corp-api-logs', {
      logGroupName: '/aws/apigateway/corp-secure-api',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Lambda function for API Gateway
    const corpLambda = new lambda.Function(this, 'corp-api-function', {
      functionName: 'corp-secure-api-handler',
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info(f"Received request: {json.dumps(event)}")
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'X-Corp-Security': 'enabled'
        },
        'body': json.dumps({
            'message': 'Corp secure API is working',
            'requestId': context.aws_request_id
        })
    }
      `),
      role: corpExecutionRole,
      environment: {
        'BUCKET_NAME': corpBucket.bucketName,
        'DB_ENDPOINT': corpDatabase.instanceEndpoint.hostname
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256
    });

    // API Gateway with logging enabled
    const corpApi = new apigateway.RestApi(this, 'corp-secure-api', {
      restApiName: 'corp-secure-rest-api',
      description: 'Corp secure REST API with comprehensive logging',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        accessLogDestination: apigateway.LogGroupLogDestination.logGroup(apiLogGroup),
        accessLogFormat: apigateway.AccessLogFormat.custom(
          JSON.stringify({
            requestId: apigateway.AccessLogField.contextRequestId(),
            sourceIp: apigateway.AccessLogField.contextIdentitySourceIp(),
            method: apigateway.AccessLogField.contextHttpMethod(),
            path: apigateway.AccessLogField.contextPath(),
            status: apigateway.AccessLogField.contextStatus(),
            responseTime: apigateway.AccessLogField.contextResponseTime(),
            userAgent: apigateway.AccessLogField.contextIdentityUserAgent(),
            error: apigateway.AccessLogField.contextErrorMessage()
          })
        )
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'POST'],
        allowHeaders: ['Content-Type', 'Authorization']
      },
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountPrincipal(accountId)],
            actions: ['execute-api:Invoke'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'aws:SourceAccount': accountId
              }
            }
          })
        ]
      })
    });

    const integration = new apigateway.LambdaIntegration(corpLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' }
    });

    corpApi.root.addMethod('GET', integration, {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Content-Type': true
        }
      }]
    });

    // Output important resource ARNs and endpoints
    new cdk.CfnOutput(this, 'corp-bucket-arn', {
      value: corpBucket.bucketArn,
      description: 'Corp secure S3 bucket ARN'
    });

    new cdk.CfnOutput(this, 'corp-database-endpoint', {
      value: corpDatabase.instanceEndpoint.hostname,
      description: 'Corp secure database endpoint'
    });

    new cdk.CfnOutput(this, 'corp-api-url', {
      value: corpApi.url,
      description: 'Corp secure API Gateway URL'
    });

    new cdk.CfnOutput(this, 'corp-guardduty-detector-id', {
      value: guardDutyDetector.ref,
      description: 'Corp GuardDuty detector ID'
    });
  }
}
```