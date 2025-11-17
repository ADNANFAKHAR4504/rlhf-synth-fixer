# MODEL_RESPONSE - Initial Pulumi TypeScript Implementation

This document contains the initial implementation generated for the multi-environment payment processing infrastructure.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const environment = config.require("environment");
const environmentSuffix = pulumi.getStack();

// VPC Configuration
const vpc = new aws.ec2.Vpc(`payment-vpc-${environmentSuffix}`, {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
        Name: `payment-vpc-${environmentSuffix}`,
        Environment: environment,
    },
});

// Create 3 private subnets
const azs = ["us-east-1a", "us-east-1b", "us-east-1c"];
const privateSubnets = azs.map((az, index) => {
    return new aws.ec2.Subnet(`payment-private-subnet-${index}-${environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${index + 1}.0/24`,
        availabilityZone: az,
        tags: {
            Name: `payment-private-subnet-${index}-${environmentSuffix}`,
            Environment: environment,
        },
    });
});

// KMS Key for RDS encryption
const rdsKmsKey = new aws.kms.Key(`payment-rds-kms-${environmentSuffix}`, {
    description: `KMS key for RDS encryption in ${environment}`,
    tags: {
        Environment: environment,
    },
});

// DB Subnet Group
const dbSubnetGroup = new aws.rds.SubnetGroup(`payment-db-subnet-${environmentSuffix}`, {
    subnetIds: privateSubnets.map(s => s.id),
    tags: {
        Environment: environment,
    },
});

// RDS PostgreSQL Instance
const db = new aws.rds.Instance(`payment-db-${environmentSuffix}`, {
    engine: "postgres",
    engineVersion: "14.7",
    instanceClass: "db.t3.micro",
    allocatedStorage: 20,
    dbName: "payments",
    username: "admin",
    password: config.requireSecret("dbPassword"),
    dbSubnetGroupName: dbSubnetGroup.name,
    storageEncrypted: true,
    kmsKeyId: rdsKmsKey.arn,
    skipFinalSnapshot: true,
    tags: {
        Environment: environment,
    },
});

// Lambda Execution Role
const lambdaRole = new aws.iam.Role(`${environment}-lambda-role`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "lambda.amazonaws.com",
            },
        }],
    }),
});

// Attach basic Lambda execution policy
const lambdaPolicyAttachment = new aws.iam.RolePolicyAttachment(`${environment}-lambda-policy`, {
    role: lambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

// Lambda function configuration based on environment
const lambdaConfig = {
    dev: { concurrency: 10 },
    staging: { concurrency: 50 },
    prod: { concurrency: 200 },
};

const currentConfig = lambdaConfig[environment as keyof typeof lambdaConfig];

// Lambda Function
const paymentLambda = new aws.lambda.Function(`payment-processor-${environmentSuffix}`, {
    runtime: "nodejs18.x",
    role: lambdaRole.arn,
    handler: "index.handler",
    memorySize: 512,
    reservedConcurrentExecutions: currentConfig.concurrency,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileAsset("./lambda"),
    }),
    environment: {
        variables: {
            DB_HOST: db.endpoint,
            ENVIRONMENT: environment,
        },
    },
    tags: {
        Environment: environment,
    },
});

// DynamoDB Table
const transactionTable = new aws.dynamodb.Table(`payment-transactions-${environmentSuffix}`, {
    attributes: [
        { name: "transactionId", type: "S" },
        { name: "timestamp", type: "N" },
    ],
    hashKey: "transactionId",
    rangeKey: "timestamp",
    billingMode: "PAY_PER_REQUEST",
    pointInTimeRecovery: {
        enabled: true,
    },
    tags: {
        Environment: environment,
    },
});

// S3 Bucket for audit trails
const auditBucket = new aws.s3.Bucket(`payment-audit-${environmentSuffix}`, {
    versioning: {
        enabled: true,
    },
    lifecycleRules: [{
        enabled: true,
        transitions: [{
            days: 90,
            storageClass: "GLACIER",
        }],
    }],
    tags: {
        Environment: environment,
    },
});

// API Gateway
const api = new aws.apigatewayv2.Api(`payment-api-${environmentSuffix}`, {
    protocolType: "HTTP",
    tags: {
        Environment: environment,
    },
});

// API Gateway Integration
const integration = new aws.apigatewayv2.Integration(`payment-integration-${environmentSuffix}`, {
    apiId: api.id,
    integrationType: "AWS_PROXY",
    integrationUri: paymentLambda.arn,
    payloadFormatVersion: "2.0",
});

// API Gateway Route
const route = new aws.apigatewayv2.Route(`payment-route-${environmentSuffix}`, {
    apiId: api.id,
    routeKey: "POST /payment",
    target: pulumi.interpolate`integrations/${integration.id}`,
});

// API Gateway Stage
const stage = new aws.apigatewayv2.Stage(`payment-stage-${environmentSuffix}`, {
    apiId: api.id,
    name: environment,
    autoDeploy: true,
});

// Lambda permission for API Gateway
const lambdaPermission = new aws.lambda.Permission(`payment-lambda-permission-${environmentSuffix}`, {
    action: "lambda:InvokeFunction",
    function: paymentLambda.name,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
});

// CloudWatch Log Group for Lambda
const logRetentionDays = {
    dev: 7,
    staging: 30,
    prod: 90,
};

const lambdaLogGroup = new aws.cloudwatch.LogGroup(`/aws/lambda/${paymentLambda.name}`, {
    retentionInDays: logRetentionDays[environment as keyof typeof logRetentionDays],
    tags: {
        Environment: environment,
    },
});

// CloudWatch Alarm for RDS CPU
const alarmThresholds = {
    dev: 80,
    staging: 75,
    prod: 70,
};

const rdsAlarm = new aws.cloudwatch.MetricAlarm(`payment-rds-cpu-alarm-${environmentSuffix}`, {
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 2,
    metricName: "CPUUtilization",
    namespace: "AWS/RDS",
    period: 300,
    statistic: "Average",
    threshold: alarmThresholds[environment as keyof typeof alarmThresholds],
    dimensions: {
        DBInstanceIdentifier: db.id,
    },
    tags: {
        Environment: environment,
    },
});

// Exports
export const vpcId = vpc.id;
export const dbEndpoint = db.endpoint;
export const lambdaArn = paymentLambda.arn;
export const apiEndpoint = api.apiEndpoint;
export const dynamoTableName = transactionTable.name;
export const auditBucketName = auditBucket.id;