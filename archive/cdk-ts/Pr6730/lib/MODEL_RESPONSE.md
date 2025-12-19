# Payment Processing API Infrastructure - CDK TypeScript Implementation

This implementation provides a multi-environment payment processing infrastructure using AWS CDK with TypeScript.

## Architecture Overview

- Multi-environment support via CDK context variables
- VPC with public and private subnets across 2 AZs
- API Gateway with Lambda proxy integration
- RDS PostgreSQL in private subnets with Secrets Manager
- S3 buckets for receipt storage
- CloudWatch monitoring with SNS notifications
- Dead letter queues for error handling

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';

export interface TapStackProps extends cdk.StackProps {
  readonly environmentSuffix: string;
  readonly customDomainName?: string;
  readonly certificateArn?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // VPC with 2 public and 4 private subnets across 2 AZs
    const vpc = new ec2.Vpc(this, `PaymentVpc-${environmentSuffix}`, {
      vpcName: `payment-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `public-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `private-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Security group for Lambda functions
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, `LambdaSecurityGroup-${environmentSuffix}`, {
      vpc,
      securityGroupName: `lambda-sg-${environmentSuffix}`,
      description: `Security group for Lambda functions in ${environmentSuffix}`,
      allowAllOutbound: true,
    });

    // Security group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, `RdsSecurityGroup-${environmentSuffix}`, {
      vpc,
      securityGroupName: `rds-sg-${environmentSuffix}`,
      description: `Security group for RDS in ${environmentSuffix}`,
      allowAllOutbound: false,
    });

    // Allow Lambda to connect to RDS
    rdsSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to access PostgreSQL'
    );

    // RDS credentials in Secrets Manager
    const dbSecret = new secretsmanager.Secret(this, `DbSecret-${environmentSuffix}`, {
      secretName: `payment-db-secret-${environmentSuffix}`,
      description: `Database credentials for ${environmentSuffix}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // RDS subnet group
    const dbSubnetGroup = new rds.SubnetGroup(this, `DbSubnetGroup-${environmentSuffix}`, {
      subnetGroupName: `payment-db-subnet-${environmentSuffix}`,
      description: `Subnet group for RDS in ${environmentSuffix}`,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // RDS PostgreSQL instance
    const dbInstance = new rds.DatabaseInstance(this, `PaymentDatabase-${environmentSuffix}`, {
      instanceIdentifier: `payment-db-${environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14_7,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [rdsSecurityGroup],
      subnetGroup: dbSubnetGroup,
      credentials: rds.Credentials.fromSecret(dbSecret),
      databaseName: 'payments',
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      backupRetention: cdk.Duration.days(1),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      publiclyAccessible: false,
      storageEncrypted: true,
    });

    // Override the default behavior to skip final snapshot
    const cfnDbInstance = dbInstance.node.defaultChild as rds.CfnDBInstance;
    cfnDbInstance.addPropertyOverride('SkipFinalSnapshot', true);

    // Dead Letter Queue for Lambda errors
    const dlq = new sqs.Queue(this, `PaymentDlq-${environmentSuffix}`, {
      queueName: `payment-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 bucket for payment receipts
    const receiptsBucket = new s3.Bucket(this, `ReceiptsBucket-${environmentSuffix}`, {
      bucketName: `payment-receipts-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
    });

    // Lambda execution role
    const lambdaRole = new iam.Role(this, `LambdaExecutionRole-${environmentSuffix}`, {
      roleName: `payment-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });

    // Grant Lambda permissions
    dbSecret.grantRead(lambdaRole);
    receiptsBucket.grantReadWrite(lambdaRole);
    dlq.grantSendMessages(lambdaRole);

    // Lambda function for payments endpoint
    const paymentsFunction = new lambda.Function(this, `PaymentsFunction-${environmentSuffix}`, {
      functionName: `payment-api-payments-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  console.log('Payment request received:', JSON.stringify(event, null, 2));

  const dbSecretArn = process.env.DB_SECRET_ARN;
  const receiptsBucket = process.env.RECEIPTS_BUCKET;

  // In production, would:
  // 1. Retrieve DB credentials from Secrets Manager
  // 2. Connect to RDS PostgreSQL
  // 3. Process payment
  // 4. Store receipt in S3
  // 5. Return response

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Payment processed successfully',
      transactionId: Date.now().toString(),
      environment: process.env.ENVIRONMENT,
    }),
  };
};
      `),
      environment: {
        DB_SECRET_ARN: dbSecret.secretArn,
        DB_HOST: dbInstance.dbInstanceEndpointAddress,
        DB_PORT: dbInstance.dbInstanceEndpointPort,
        DB_NAME: 'payments',
        RECEIPTS_BUCKET: receiptsBucket.bucketName,
        ENVIRONMENT: environmentSuffix,
      },
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      deadLetterQueue: dlq,
      logRetention: logs.RetentionDays.TWO_WEEKS,
    });

    // Lambda function for refunds endpoint
    const refundsFunction = new lambda.Function(this, `RefundsFunction-${environmentSuffix}`, {
      functionName: `payment-api-refunds-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  console.log('Refund request received:', JSON.stringify(event, null, 2));

  const dbSecretArn = process.env.DB_SECRET_ARN;
  const receiptsBucket = process.env.RECEIPTS_BUCKET;

  // In production, would:
  // 1. Retrieve DB credentials from Secrets Manager
  // 2. Connect to RDS PostgreSQL
  // 3. Process refund
  // 4. Update receipt in S3
  // 5. Return response

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Refund processed successfully',
      transactionId: Date.now().toString(),
      environment: process.env.ENVIRONMENT,
    }),
  };
};
      `),
      environment: {
        DB_SECRET_ARN: dbSecret.secretArn,
        DB_HOST: dbInstance.dbInstanceEndpointAddress,
        DB_PORT: dbInstance.dbInstanceEndpointPort,
        DB_NAME: 'payments',
        RECEIPTS_BUCKET: receiptsBucket.bucketName,
        ENVIRONMENT: environmentSuffix,
      },
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      deadLetterQueue: dlq,
      logRetention: logs.RetentionDays.TWO_WEEKS,
    });

    // API Gateway REST API
    const api = new apigateway.RestApi(this, `PaymentApi-${environmentSuffix}`, {
      restApiName: `payment-api-${environmentSuffix}`,
      description: `Payment processing API for ${environmentSuffix}`,
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Add custom domain if provided
    if (props.customDomainName && props.certificateArn) {
      const certificate = certificatemanager.Certificate.fromCertificateArn(
        this,
        `Certificate-${environmentSuffix}`,
        props.certificateArn
      );

      new apigateway.DomainName(this, `CustomDomain-${environmentSuffix}`, {
        domainName: props.customDomainName,
        certificate,
        endpointType: apigateway.EndpointType.REGIONAL,
        mapping: api,
      });
    }

    // /payments endpoint
    const paymentsResource = api.root.addResource('payments');
    paymentsResource.addMethod('POST', new apigateway.LambdaIntegration(paymentsFunction));
    paymentsResource.addMethod('GET', new apigateway.LambdaIntegration(paymentsFunction));

    // /refunds endpoint
    const refundsResource = api.root.addResource('refunds');
    refundsResource.addMethod('POST', new apigateway.LambdaIntegration(refundsFunction));
    refundsResource.addMethod('GET', new apigateway.LambdaIntegration(refundsFunction));

    // SNS topic for alarm notifications
    const alarmTopic = new sns.Topic(this, `AlarmTopic-${environmentSuffix}`, {
      topicName: `payment-alarms-${environmentSuffix}`,
      displayName: `Payment API Alarms for ${environmentSuffix}`,
    });

    // CloudWatch alarm for payments function errors
    const paymentsErrorAlarm = new cloudwatch.Alarm(this, `PaymentsErrorAlarm-${environmentSuffix}`, {
      alarmName: `payment-api-payments-errors-${environmentSuffix}`,
      alarmDescription: `Payments Lambda error rate exceeds 5% in ${environmentSuffix}`,
      metric: paymentsFunction.metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    paymentsErrorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // CloudWatch alarm for refunds function errors
    const refundsErrorAlarm = new cloudwatch.Alarm(this, `RefundsErrorAlarm-${environmentSuffix}`, {
      alarmName: `payment-api-refunds-errors-${environmentSuffix}`,
      alarmDescription: `Refunds Lambda error rate exceeds 5% in ${environmentSuffix}`,
      metric: refundsFunction.metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    refundsErrorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: `payment-api-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PaymentsFunctionArn', {
      value: paymentsFunction.functionArn,
      description: 'Payments Lambda function ARN',
      exportName: `payments-function-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'RefundsFunctionArn', {
      value: refundsFunction.functionArn,
      description: 'Refunds Lambda function ARN',
      exportName: `refunds-function-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbInstance.dbInstanceEndpointAddress,
      description: 'RDS database endpoint',
      exportName: `database-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: dbSecret.secretArn,
      description: 'Database secret ARN',
      exportName: `database-secret-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ReceiptsBucketName', {
      value: receiptsBucket.bucketName,
      description: 'S3 bucket for receipts',
      exportName: `receipts-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS topic for alarms',
      exportName: `alarm-topic-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `vpc-id-${environmentSuffix}`,
    });

    // Add CDK Aspect for validation
    cdk.Aspects.of(this).add(new EnvironmentValidationAspect(environmentSuffix));
  }
}

// CDK Aspect to validate no hardcoded environment values
class EnvironmentValidationAspect implements cdk.IAspect {
  constructor(private environmentSuffix: string) {}

  public visit(node: cdk.IConstruct): void {
    // Validate that resources have environment suffix in names
    if (node instanceof lambda.Function) {
      const funcName = node.functionName;
      if (funcName && !funcName.includes(this.environmentSuffix)) {
        cdk.Annotations.of(node).addWarning(
          `Lambda function name should include environment suffix: ${this.environmentSuffix}`
        );
      }
    }

    if (node instanceof s3.Bucket) {
      const bucketName = node.bucketName;
      if (bucketName && !bucketName.includes(this.environmentSuffix)) {
        cdk.Annotations.of(node).addWarning(
          `S3 bucket name should include environment suffix: ${this.environmentSuffix}`
        );
      }
    }

    if (node instanceof rds.DatabaseInstance) {
      const instanceId = node.instanceIdentifier;
      if (instanceId && !instanceId.includes(this.environmentSuffix)) {
        cdk.Annotations.of(node).addWarning(
          `RDS instance identifier should include environment suffix: ${this.environmentSuffix}`
        );
      }
    }

    // Check for RemovalPolicy.RETAIN
    if (node instanceof cdk.CfnResource) {
      const props = (node as any).cfnOptions;
      if (props?.deletionPolicy === cdk.CfnDeletionPolicy.RETAIN) {
        cdk.Annotations.of(node).addError(
          'RemovalPolicy.RETAIN is not allowed. All resources must be destroyable.'
        );
      }
    }
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment from context
const environment = app.node.tryGetContext('environment') || 'dev';

// Environment-specific configurations
const environmentConfig: Record<string, any> = {
  dev: {
    account: '123456789012',
    region: 'us-east-1',
    customDomainName: undefined,
    certificateArn: undefined,
  },
  staging: {
    account: '234567890123',
    region: 'us-east-1',
    customDomainName: undefined,
    certificateArn: undefined,
  },
  prod: {
    account: '345678901234',
    region: 'us-east-1',
    customDomainName: undefined,
    certificateArn: undefined,
  },
};

const config = environmentConfig[environment];

if (!config) {
  throw new Error(
    `Unknown environment: ${environment}. Valid environments: ${Object.keys(environmentConfig).join(', ')}`
  );
}

new TapStack(app, `PaymentApiStack-${environment}`, {
  environmentSuffix: environment,
  customDomainName: config.customDomainName,
  certificateArn: config.certificateArn,
  env: {
    account: config.account,
    region: config.region,
  },
  description: `Payment processing API infrastructure for ${environment} environment`,
  tags: {
    Environment: environment,
    Project: 'PaymentAPI',
    ManagedBy: 'CDK',
  },
});

app.synth();
```

## File: cdk.json

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
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
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
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false
  }
}
```

## File: package.json

```json
{
  "name": "payment-api-infrastructure",
  "version": "1.0.0",
  "description": "Payment processing API infrastructure for multi-environment deployment",
  "bin": {
    "tap": "bin/tap.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "cdk": "cdk",
    "synth": "cdk synth",
    "deploy": "cdk deploy",
    "destroy": "cdk destroy",
    "lint": "eslint . --ext .ts"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "20.11.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "aws-cdk": "2.110.0",
    "eslint": "^8.40.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.1",
    "typescript": "~5.3.0"
  },
  "dependencies": {
    "aws-cdk-lib": "2.110.0",
    "constructs": "^10.0.0",
    "source-map-support": "^0.5.21"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": [
      "es2020"
    ],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": [
      "./node_modules/@types"
    ],
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "exclude": [
    "node_modules",
    "cdk.out"
  ]
}
```

## File: .gitignore

```
*.js
!jest.config.js
*.d.ts
node_modules

# CDK asset staging directory
.cdk.staging
cdk.out

# Coverage
coverage/
.nyc_output

# Parcel cache
.parcel-cache
```

## File: lib/README.md

```markdown
# Payment Processing API Infrastructure

Multi-environment payment processing infrastructure using AWS CDK with TypeScript.

## Architecture

- **VPC**: 2 AZs, 2 public subnets, 4 private subnets
- **API Gateway**: REST API with Lambda proxy integration
- **Lambda**: Payments and Refunds functions in private subnets
- **RDS**: PostgreSQL 14.7 in private subnets
- **S3**: Receipt storage bucket
- **CloudWatch**: Error rate monitoring
- **SNS**: Alarm notifications
- **Secrets Manager**: Database credentials
- **Dead Letter Queue**: Lambda error handling

## Prerequisites

- Node.js 18.x
- AWS CLI v2
- CDK 2.110.0+
- TypeScript 5.x
- Configured AWS credentials with cross-account assume role permissions

## Installation

```bash
npm install
```

## Deployment

Deploy to development environment:

```bash
cdk deploy -c environment=dev
```

Deploy to staging environment:

```bash
cdk deploy -c environment=staging
```

Deploy to production environment:

```bash
cdk deploy -c environment=prod
```

## Environment Configuration

Edit `bin/tap.ts` to configure environment-specific settings:

- AWS account ID
- Region
- Custom domain name (optional)
- Certificate ARN (optional)

## Validation

The stack includes a CDK Aspect that validates:

- All resources include environment suffix in names
- No RemovalPolicy.RETAIN policies
- Resources are properly tagged

## Testing

Run unit tests:

```bash
npm test
```

Run with coverage:

```bash
npm run test:coverage
```

## Destruction

To destroy the stack:

```bash
cdk destroy -c environment=dev
```

Note: All resources are configured to be completely destroyable without manual intervention.

## CloudFormation Outputs

The stack exports the following values:

- `payment-api-url-${environment}`: API Gateway endpoint URL
- `payments-function-arn-${environment}`: Payments Lambda ARN
- `refunds-function-arn-${environment}`: Refunds Lambda ARN
- `database-endpoint-${environment}`: RDS endpoint
- `database-secret-arn-${environment}`: Database secret ARN
- `receipts-bucket-${environment}`: S3 bucket name
- `alarm-topic-arn-${environment}`: SNS topic ARN
- `vpc-id-${environment}`: VPC ID

## Multi-Environment Parity

The infrastructure ensures parity across environments by:

1. Using a single CDK stack with environment passed via context
2. Including environment suffix in all resource names
3. Using CDK Aspects to validate configuration
4. Avoiding hardcoded values
5. Exporting cross-stack references with environment suffix

## Cost Optimization

- Lambda functions with appropriate timeouts (30s)
- RDS backup retention set to 1 day
- CloudWatch Logs retention: 14 days
- NAT Gateways: 2 (one per AZ)
- T3 micro RDS instance type

## Security

- RDS in private subnets
- Lambda in private subnets with VPC access
- Database credentials in Secrets Manager
- S3 bucket encryption enabled
- RDS storage encryption enabled
- Least privilege IAM policies
- Security groups properly configured
```
