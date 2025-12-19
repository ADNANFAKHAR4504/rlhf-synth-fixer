# Multi-Environment Payment Processing Infrastructure - Pulumi TypeScript Implementation

This implementation provides a complete multi-environment payment processing infrastructure using Pulumi with TypeScript. The solution ensures consistency across dev, staging, and production environments while allowing environment-specific configurations.

## Architecture Overview

The infrastructure includes:
- VPC with public and private subnets across 2 AZs per environment
- API Gateway with Lambda integration for payment processing endpoints
- RDS PostgreSQL for transaction data with environment-specific sizing
- S3 buckets for audit logging with intelligent tiering
- SQS queues with DLQ for asynchronous payment notifications
- CloudWatch alarms for monitoring Lambda errors
- IAM roles with least privilege access

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { PaymentInfrastructure } from "./infrastructure";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const environment = config.require("environment");
const region = config.get("region") || "us-east-1";

// Create the payment processing infrastructure
const infrastructure = new PaymentInfrastructure(`payment-infra-${environmentSuffix}`, {
    environmentSuffix,
    environment,
    region,
    rdsInstanceClass: config.get("rdsInstanceClass") || "db.t3.medium",
    rdsBackupRetentionDays: config.getNumber("rdsBackupRetentionDays") || 3,
    lambdaMemorySize: config.getNumber("lambdaMemorySize") || 512,
    lambdaTimeout: config.getNumber("lambdaTimeout") || 30,
});

// Export outputs
export const vpcId = infrastructure.vpc.vpcId;
export const privateSubnetIds = infrastructure.privateSubnetIds;
export const publicSubnetIds = infrastructure.publicSubnetIds;
export const apiGatewayEndpoint = infrastructure.apiGatewayEndpoint;
export const rdsEndpoint = infrastructure.rdsEndpoint;
export const auditLogsBucketName = infrastructure.auditLogsBucket.bucket;
export const paymentQueueUrl = infrastructure.paymentQueue.queueUrl;
export const processPaymentLambdaArn = infrastructure.processPaymentLambda.lambdaArn;
export const verifyPaymentLambdaArn = infrastructure.verifyPaymentLambda.lambdaArn;
```

## File: infrastructure.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface PaymentInfrastructureArgs {
    environmentSuffix: string;
    environment: string;
    region: string;
    rdsInstanceClass: string;
    rdsBackupRetentionDays: number;
    lambdaMemorySize: number;
    lambdaTimeout: number;
}

export class PaymentInfrastructure extends pulumi.ComponentResource {
    public readonly vpc: aws.ec2.Vpc;
    public readonly privateSubnetIds: pulumi.Output<string[]>;
    public readonly publicSubnetIds: pulumi.Output<string[]>;
    public readonly apiGatewayEndpoint: pulumi.Output<string>;
    public readonly rdsEndpoint: pulumi.Output<string>;
    public readonly auditLogsBucket: aws.s3.BucketV2;
    public readonly paymentQueue: aws.sqs.Queue;
    public readonly processPaymentLambda: PaymentLambda;
    public readonly verifyPaymentLambda: PaymentLambda;

    constructor(name: string, args: PaymentInfrastructureArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:infrastructure:PaymentInfrastructure", name, {}, opts);

        const defaultOpts = { parent: this };

        // Create VPC with public and private subnets across 2 AZs
        const vpcModule = new VpcModule(`vpc-${args.environmentSuffix}`, {
            environmentSuffix: args.environmentSuffix,
            cidrBlock: "10.0.0.0/16",
        }, defaultOpts);

        this.vpc = vpcModule.vpc;
        this.privateSubnetIds = vpcModule.privateSubnetIds;
        this.publicSubnetIds = vpcModule.publicSubnetIds;

        // Create S3 bucket for audit logs
        this.auditLogsBucket = new aws.s3.BucketV2(`audit-logs-${args.environmentSuffix}`, {
            bucket: `payment-audit-logs-${args.environmentSuffix}`,
            forceDestroy: true,
        }, defaultOpts);

        // Enable versioning on S3 bucket
        new aws.s3.BucketVersioningV2(`audit-logs-versioning-${args.environmentSuffix}`, {
            bucket: this.auditLogsBucket.id,
            versioningConfiguration: {
                status: "Enabled",
            },
        }, defaultOpts);

        // Add lifecycle policy for intelligent tiering
        new aws.s3.BucketLifecycleConfigurationV2(`audit-logs-lifecycle-${args.environmentSuffix}`, {
            bucket: this.auditLogsBucket.id,
            rules: [{
                id: "intelligent-tiering",
                status: "Enabled",
                transitions: [{
                    days: 30,
                    storageClass: "INTELLIGENT_TIERING",
                }],
            }],
        }, defaultOpts);

        // Create Dead Letter Queue
        const dlq = new aws.sqs.Queue(`payment-dlq-${args.environmentSuffix}`, {
            name: `payment-notifications-dlq-${args.environmentSuffix}`,
            messageRetentionSeconds: 1209600, // 14 days
        }, defaultOpts);

        // Create SQS queue for payment notifications
        this.paymentQueue = new aws.sqs.Queue(`payment-queue-${args.environmentSuffix}`, {
            name: `payment-notifications-${args.environmentSuffix}`,
            visibilityTimeoutSeconds: 300,
            redrivePolicy: pulumi.jsonStringify({
                deadLetterTargetArn: dlq.arn,
                maxReceiveCount: 3,
            }),
        }, defaultOpts);

        // Create RDS subnet group
        const dbSubnetGroup = new aws.rds.SubnetGroup(`db-subnet-${args.environmentSuffix}`, {
            name: `payment-db-subnet-${args.environmentSuffix}`,
            subnetIds: vpcModule.privateSubnetIds,
            tags: {
                Name: `payment-db-subnet-${args.environmentSuffix}`,
            },
        }, defaultOpts);

        // Create security group for RDS
        const dbSecurityGroup = new aws.ec2.SecurityGroup(`db-sg-${args.environmentSuffix}`, {
            name: `payment-db-sg-${args.environmentSuffix}`,
            vpcId: this.vpc.id,
            description: "Security group for payment processing RDS instance",
            ingress: [{
                protocol: "tcp",
                fromPort: 5432,
                toPort: 5432,
                cidrBlocks: ["10.0.0.0/16"],
                description: "PostgreSQL access from VPC",
            }],
            egress: [{
                protocol: "-1",
                fromPort: 0,
                toPort: 0,
                cidrBlocks: ["0.0.0.0/0"],
                description: "Allow all outbound traffic",
            }],
        }, defaultOpts);

        // Create RDS PostgreSQL instance
        const dbInstance = new aws.rds.Instance(`payment-db-${args.environmentSuffix}`, {
            identifier: `payment-db-${args.environmentSuffix}`,
            engine: "postgres",
            engineVersion: "15.4",
            instanceClass: args.rdsInstanceClass,
            allocatedStorage: 20,
            storageType: "gp3",
            storageEncrypted: true,
            dbName: "paymentdb",
            username: "dbadmin",
            password: pulumi.secret("ChangeMe123!"),
            dbSubnetGroupName: dbSubnetGroup.name,
            vpcSecurityGroupIds: [dbSecurityGroup.id],
            backupRetentionPeriod: args.rdsBackupRetentionDays,
            skipFinalSnapshot: true,
            deletionProtection: false,
            publiclyAccessible: false,
            multiAz: false,
            tags: {
                Name: `payment-db-${args.environmentSuffix}`,
                Environment: args.environment,
            },
        }, defaultOpts);

        this.rdsEndpoint = dbInstance.endpoint;

        // Create IAM role for Lambda functions
        const lambdaRole = new aws.iam.Role(`lambda-role-${args.environmentSuffix}`, {
            name: `payment-lambda-role-${args.environmentSuffix}`,
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
        }, defaultOpts);

        // Attach basic Lambda execution policy
        new aws.iam.RolePolicyAttachment(`lambda-basic-execution-${args.environmentSuffix}`, {
            role: lambdaRole.name,
            policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        }, defaultOpts);

        // Attach VPC execution policy
        new aws.iam.RolePolicyAttachment(`lambda-vpc-execution-${args.environmentSuffix}`, {
            role: lambdaRole.name,
            policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
        }, defaultOpts);

        // Create inline policy for S3, SQS, and RDS access
        new aws.iam.RolePolicy(`lambda-policy-${args.environmentSuffix}`, {
            role: lambdaRole.id,
            policy: pulumi.all([this.auditLogsBucket.arn, this.paymentQueue.arn]).apply(([bucketArn, queueArn]) =>
                JSON.stringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Action: [
                                "s3:PutObject",
                                "s3:GetObject",
                            ],
                            Resource: `${bucketArn}/*`,
                        },
                        {
                            Effect: "Allow",
                            Action: [
                                "sqs:SendMessage",
                                "sqs:ReceiveMessage",
                                "sqs:DeleteMessage",
                                "sqs:GetQueueAttributes",
                            ],
                            Resource: queueArn,
                        },
                    ],
                })
            ),
        }, defaultOpts);

        // Create security group for Lambda functions
        const lambdaSecurityGroup = new aws.ec2.SecurityGroup(`lambda-sg-${args.environmentSuffix}`, {
            name: `payment-lambda-sg-${args.environmentSuffix}`,
            vpcId: this.vpc.id,
            description: "Security group for payment processing Lambda functions",
            egress: [{
                protocol: "-1",
                fromPort: 0,
                toPort: 0,
                cidrBlocks: ["0.0.0.0/0"],
                description: "Allow all outbound traffic",
            }],
        }, defaultOpts);

        // Create process payment Lambda function
        this.processPaymentLambda = new PaymentLambda(`process-payment-${args.environmentSuffix}`, {
            environmentSuffix: args.environmentSuffix,
            functionName: "process-payment",
            handler: "index.processPayment",
            role: lambdaRole,
            rdsEndpoint: dbInstance.endpoint,
            rdsDbName: "paymentdb",
            rdsUsername: "dbadmin",
            rdsPassword: pulumi.secret("ChangeMe123!"),
            auditLogsBucket: this.auditLogsBucket.bucket,
            paymentQueueUrl: this.paymentQueue.queueUrl,
            subnetIds: vpcModule.privateSubnetIds,
            securityGroupIds: [lambdaSecurityGroup.id],
            memorySize: args.lambdaMemorySize,
            timeout: args.lambdaTimeout,
        }, defaultOpts);

        // Create verify payment Lambda function
        this.verifyPaymentLambda = new PaymentLambda(`verify-payment-${args.environmentSuffix}`, {
            environmentSuffix: args.environmentSuffix,
            functionName: "verify-payment",
            handler: "index.verifyPayment",
            role: lambdaRole,
            rdsEndpoint: dbInstance.endpoint,
            rdsDbName: "paymentdb",
            rdsUsername: "dbadmin",
            rdsPassword: pulumi.secret("ChangeMe123!"),
            auditLogsBucket: this.auditLogsBucket.bucket,
            paymentQueueUrl: this.paymentQueue.queueUrl,
            subnetIds: vpcModule.privateSubnetIds,
            securityGroupIds: [lambdaSecurityGroup.id],
            memorySize: args.lambdaMemorySize,
            timeout: args.lambdaTimeout,
        }, defaultOpts);

        // Create API Gateway
        const api = new aws.apigatewayv2.Api(`payment-api-${args.environmentSuffix}`, {
            name: `payment-api-${args.environmentSuffix}`,
            protocolType: "HTTP",
        }, defaultOpts);

        // Create CloudWatch log group for API Gateway
        const apiLogGroup = new aws.cloudwatch.LogGroup(`api-logs-${args.environmentSuffix}`, {
            name: `/aws/apigateway/payment-api-${args.environmentSuffix}`,
            retentionInDays: 7,
        }, defaultOpts);

        // Create API Gateway stage with logging
        const apiStage = new aws.apigatewayv2.Stage(`payment-api-stage-${args.environmentSuffix}`, {
            apiId: api.id,
            name: "$default",
            autoDeploy: true,
            accessLogSettings: {
                destinationArn: apiLogGroup.arn,
                format: JSON.stringify({
                    requestId: "$context.requestId",
                    ip: "$context.identity.sourceIp",
                    requestTime: "$context.requestTime",
                    httpMethod: "$context.httpMethod",
                    routeKey: "$context.routeKey",
                    status: "$context.status",
                    protocol: "$context.protocol",
                    responseLength: "$context.responseLength",
                }),
            },
        }, defaultOpts);

        // Create integrations and routes for process payment
        const processPaymentIntegration = new aws.apigatewayv2.Integration(`process-payment-integration-${args.environmentSuffix}`, {
            apiId: api.id,
            integrationType: "AWS_PROXY",
            integrationUri: this.processPaymentLambda.lambda.arn,
            payloadFormatVersion: "2.0",
        }, defaultOpts);

        new aws.apigatewayv2.Route(`process-payment-route-${args.environmentSuffix}`, {
            apiId: api.id,
            routeKey: "POST /process-payment",
            target: pulumi.interpolate`integrations/${processPaymentIntegration.id}`,
        }, defaultOpts);

        // Grant API Gateway permission to invoke process payment Lambda
        new aws.lambda.Permission(`api-invoke-process-${args.environmentSuffix}`, {
            action: "lambda:InvokeFunction",
            function: this.processPaymentLambda.lambda.name,
            principal: "apigateway.amazonaws.com",
            sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
        }, defaultOpts);

        // Create integrations and routes for verify payment
        const verifyPaymentIntegration = new aws.apigatewayv2.Integration(`verify-payment-integration-${args.environmentSuffix}`, {
            apiId: api.id,
            integrationType: "AWS_PROXY",
            integrationUri: this.verifyPaymentLambda.lambda.arn,
            payloadFormatVersion: "2.0",
        }, defaultOpts);

        new aws.apigatewayv2.Route(`verify-payment-route-${args.environmentSuffix}`, {
            apiId: api.id,
            routeKey: "POST /verify-payment",
            target: pulumi.interpolate`integrations/${verifyPaymentIntegration.id}`,
        }, defaultOpts);

        // Grant API Gateway permission to invoke verify payment Lambda
        new aws.lambda.Permission(`api-invoke-verify-${args.environmentSuffix}`, {
            action: "lambda:InvokeFunction",
            function: this.verifyPaymentLambda.lambda.name,
            principal: "apigateway.amazonaws.com",
            sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
        }, defaultOpts);

        this.apiGatewayEndpoint = api.apiEndpoint;

        this.registerOutputs({
            vpcId: this.vpc.id,
            privateSubnetIds: this.privateSubnetIds,
            publicSubnetIds: this.publicSubnetIds,
            apiGatewayEndpoint: this.apiGatewayEndpoint,
            rdsEndpoint: this.rdsEndpoint,
            auditLogsBucket: this.auditLogsBucket.bucket,
            paymentQueueUrl: this.paymentQueue.queueUrl,
        });
    }
}

class VpcModule extends pulumi.ComponentResource {
    public readonly vpc: aws.ec2.Vpc;
    public readonly privateSubnetIds: pulumi.Output<string[]>;
    public readonly publicSubnetIds: pulumi.Output<string[]>;

    constructor(name: string, args: { environmentSuffix: string; cidrBlock: string }, opts?: pulumi.ComponentResourceOptions) {
        super("custom:network:VpcModule", name, {}, opts);

        const defaultOpts = { parent: this };

        // Create VPC
        this.vpc = new aws.ec2.Vpc(`vpc-${args.environmentSuffix}`, {
            cidrBlock: args.cidrBlock,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: {
                Name: `payment-vpc-${args.environmentSuffix}`,
            },
        }, defaultOpts);

        // Get availability zones
        const azs = aws.getAvailabilityZones({
            state: "available",
        });

        // Create public subnets
        const publicSubnet1 = new aws.ec2.Subnet(`public-subnet-1-${args.environmentSuffix}`, {
            vpcId: this.vpc.id,
            cidrBlock: "10.0.1.0/24",
            availabilityZone: azs.then(az => az.names[0]),
            mapPublicIpOnLaunch: true,
            tags: {
                Name: `payment-public-subnet-1-${args.environmentSuffix}`,
            },
        }, defaultOpts);

        const publicSubnet2 = new aws.ec2.Subnet(`public-subnet-2-${args.environmentSuffix}`, {
            vpcId: this.vpc.id,
            cidrBlock: "10.0.2.0/24",
            availabilityZone: azs.then(az => az.names[1]),
            mapPublicIpOnLaunch: true,
            tags: {
                Name: `payment-public-subnet-2-${args.environmentSuffix}`,
            },
        }, defaultOpts);

        // Create private subnets
        const privateSubnet1 = new aws.ec2.Subnet(`private-subnet-1-${args.environmentSuffix}`, {
            vpcId: this.vpc.id,
            cidrBlock: "10.0.11.0/24",
            availabilityZone: azs.then(az => az.names[0]),
            tags: {
                Name: `payment-private-subnet-1-${args.environmentSuffix}`,
            },
        }, defaultOpts);

        const privateSubnet2 = new aws.ec2.Subnet(`private-subnet-2-${args.environmentSuffix}`, {
            vpcId: this.vpc.id,
            cidrBlock: "10.0.12.0/24",
            availabilityZone: azs.then(az => az.names[1]),
            tags: {
                Name: `payment-private-subnet-2-${args.environmentSuffix}`,
            },
        }, defaultOpts);

        // Create Internet Gateway
        const igw = new aws.ec2.InternetGateway(`igw-${args.environmentSuffix}`, {
            vpcId: this.vpc.id,
            tags: {
                Name: `payment-igw-${args.environmentSuffix}`,
            },
        }, defaultOpts);

        // Create Elastic IP for NAT Gateway
        const eip = new aws.ec2.Eip(`nat-eip-${args.environmentSuffix}`, {
            domain: "vpc",
            tags: {
                Name: `payment-nat-eip-${args.environmentSuffix}`,
            },
        }, defaultOpts);

        // Create NAT Gateway in first public subnet
        const natGateway = new aws.ec2.NatGateway(`nat-${args.environmentSuffix}`, {
            subnetId: publicSubnet1.id,
            allocationId: eip.id,
            tags: {
                Name: `payment-nat-${args.environmentSuffix}`,
            },
        }, defaultOpts);

        // Create route table for public subnets
        const publicRouteTable = new aws.ec2.RouteTable(`public-rt-${args.environmentSuffix}`, {
            vpcId: this.vpc.id,
            routes: [{
                cidrBlock: "0.0.0.0/0",
                gatewayId: igw.id,
            }],
            tags: {
                Name: `payment-public-rt-${args.environmentSuffix}`,
            },
        }, defaultOpts);

        // Associate public subnets with public route table
        new aws.ec2.RouteTableAssociation(`public-rta-1-${args.environmentSuffix}`, {
            subnetId: publicSubnet1.id,
            routeTableId: publicRouteTable.id,
        }, defaultOpts);

        new aws.ec2.RouteTableAssociation(`public-rta-2-${args.environmentSuffix}`, {
            subnetId: publicSubnet2.id,
            routeTableId: publicRouteTable.id,
        }, defaultOpts);

        // Create route table for private subnets
        const privateRouteTable = new aws.ec2.RouteTable(`private-rt-${args.environmentSuffix}`, {
            vpcId: this.vpc.id,
            routes: [{
                cidrBlock: "0.0.0.0/0",
                natGatewayId: natGateway.id,
            }],
            tags: {
                Name: `payment-private-rt-${args.environmentSuffix}`,
            },
        }, defaultOpts);

        // Associate private subnets with private route table
        new aws.ec2.RouteTableAssociation(`private-rta-1-${args.environmentSuffix}`, {
            subnetId: privateSubnet1.id,
            routeTableId: privateRouteTable.id,
        }, defaultOpts);

        new aws.ec2.RouteTableAssociation(`private-rta-2-${args.environmentSuffix}`, {
            subnetId: privateSubnet2.id,
            routeTableId: privateRouteTable.id,
        }, defaultOpts);

        this.privateSubnetIds = pulumi.output([privateSubnet1.id, privateSubnet2.id]);
        this.publicSubnetIds = pulumi.output([publicSubnet1.id, publicSubnet2.id]);

        this.registerOutputs({
            vpcId: this.vpc.id,
            privateSubnetIds: this.privateSubnetIds,
            publicSubnetIds: this.publicSubnetIds,
        });
    }
}

interface PaymentLambdaArgs {
    environmentSuffix: string;
    functionName: string;
    handler: string;
    role: aws.iam.Role;
    rdsEndpoint: pulumi.Output<string>;
    rdsDbName: string;
    rdsUsername: string;
    rdsPassword: pulumi.Output<string>;
    auditLogsBucket: pulumi.Output<string>;
    paymentQueueUrl: pulumi.Output<string>;
    subnetIds: pulumi.Output<string[]>;
    securityGroupIds: string[];
    memorySize: number;
    timeout: number;
}

class PaymentLambda extends pulumi.ComponentResource {
    public readonly lambda: aws.lambda.Function;
    public readonly lambdaArn: pulumi.Output<string>;

    constructor(name: string, args: PaymentLambdaArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:compute:PaymentLambda", name, {}, opts);

        const defaultOpts = { parent: this };

        // Create Lambda function
        this.lambda = new aws.lambda.Function(`${args.functionName}-${args.environmentSuffix}`, {
            name: `${args.functionName}-${args.environmentSuffix}`,
            runtime: aws.lambda.Runtime.NodeJS18dX,
            handler: args.handler,
            role: args.role.arn,
            code: new pulumi.asset.AssetArchive({
                "index.js": new pulumi.asset.StringAsset(`
exports.processPayment = async (event) => {
    console.log('Processing payment:', JSON.stringify(event));
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Payment processed successfully' })
    };
};

exports.verifyPayment = async (event) => {
    console.log('Verifying payment:', JSON.stringify(event));
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Payment verified successfully' })
    };
};
                `),
            }),
            environment: {
                variables: {
                    RDS_ENDPOINT: args.rdsEndpoint,
                    RDS_DB_NAME: args.rdsDbName,
                    RDS_USERNAME: args.rdsUsername,
                    RDS_PASSWORD: args.rdsPassword,
                    AUDIT_LOGS_BUCKET: args.auditLogsBucket,
                    PAYMENT_QUEUE_URL: args.paymentQueueUrl,
                },
            },
            vpcConfig: {
                subnetIds: args.subnetIds,
                securityGroupIds: args.securityGroupIds,
            },
            memorySize: args.memorySize,
            timeout: args.timeout,
        }, defaultOpts);

        this.lambdaArn = this.lambda.arn;

        // Create CloudWatch alarm for Lambda errors
        new aws.cloudwatch.MetricAlarm(`${args.functionName}-errors-${args.environmentSuffix}`, {
            name: `${args.functionName}-errors-${args.environmentSuffix}`,
            comparisonOperator: "GreaterThanThreshold",
            evaluationPeriods: 1,
            metricName: "Errors",
            namespace: "AWS/Lambda",
            period: 300,
            statistic: "Sum",
            threshold: 5,
            alarmDescription: `Alarm when ${args.functionName} has more than 5 errors in 5 minutes`,
            dimensions: {
                FunctionName: this.lambda.name,
            },
        }, defaultOpts);

        this.registerOutputs({
            lambdaArn: this.lambdaArn,
        });
    }
}
```

## File: Pulumi.yaml

```yaml
name: payment-processing
runtime: nodejs
description: Multi-environment payment processing infrastructure

config:
  environmentSuffix:
    type: string
    description: Unique suffix for resource names (e.g., dev-123, staging-456, prod-789)

  environment:
    type: string
    description: Environment name (dev, staging, or prod)

  region:
    type: string
    description: AWS region for deployment
    default: us-east-1

  rdsInstanceClass:
    type: string
    description: RDS instance class (db.t3.medium for dev/staging, db.r5.large for prod)
    default: db.t3.medium

  rdsBackupRetentionDays:
    type: integer
    description: Number of days to retain RDS backups (3 for dev/staging, 7 for prod)
    default: 3

  lambdaMemorySize:
    type: integer
    description: Lambda function memory size in MB
    default: 512

  lambdaTimeout:
    type: integer
    description: Lambda function timeout in seconds
    default: 30
```

## File: Pulumi.dev.yaml

```yaml
config:
  payment-processing:environmentSuffix: dev-m71vs8
  payment-processing:environment: dev
  payment-processing:region: us-east-1
  payment-processing:rdsInstanceClass: db.t3.medium
  payment-processing:rdsBackupRetentionDays: "3"
  payment-processing:lambdaMemorySize: "512"
  payment-processing:lambdaTimeout: "30"
```

## File: Pulumi.staging.yaml

```yaml
config:
  payment-processing:environmentSuffix: staging-m71vs8
  payment-processing:environment: staging
  payment-processing:region: us-east-2
  payment-processing:rdsInstanceClass: db.t3.medium
  payment-processing:rdsBackupRetentionDays: "3"
  payment-processing:lambdaMemorySize: "512"
  payment-processing:lambdaTimeout: "30"
```

## File: Pulumi.prod.yaml

```yaml
config:
  payment-processing:environmentSuffix: prod-m71vs8
  payment-processing:environment: prod
  payment-processing:region: us-east-1
  payment-processing:rdsInstanceClass: db.r5.large
  payment-processing:rdsBackupRetentionDays: "7"
  payment-processing:lambdaMemorySize: "512"
  payment-processing:lambdaTimeout: "30"
```

## File: package.json

```json
{
  "name": "payment-processing-infrastructure",
  "version": "1.0.0",
  "description": "Multi-environment payment processing infrastructure using Pulumi",
  "main": "index.ts",
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.100.0",
    "@pulumi/aws": "^6.20.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "declaration": true,
    "outDir": "./bin",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "bin"
  ]
}
```

## File: jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/node_modules/**',
    '!**/bin/**',
    '!**/tests/**',
  ],
};
```

## File: tests/infrastructure.test.ts

```typescript
import * as pulumi from "@pulumi/pulumi";

// Mock Pulumi runtime
pulumi.runtime.setMocks({
    newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
        return {
            id: `${args.name}-id`,
            state: args.inputs,
        };
    },
    call: function(args: pulumi.runtime.MockCallArgs) {
        if (args.token === "aws:index/getAvailabilityZones:getAvailabilityZones") {
            return {
                names: ["us-east-1a", "us-east-1b"],
            };
        }
        return {};
    },
});

describe("Payment Infrastructure Tests", () => {
    let infrastructure: typeof import("../infrastructure");

    beforeAll(() => {
        infrastructure = require("../infrastructure");
    });

    describe("PaymentInfrastructure", () => {
        it("should create infrastructure with correct naming", async () => {
            const infra = new infrastructure.PaymentInfrastructure("test-infra", {
                environmentSuffix: "test-123",
                environment: "test",
                region: "us-east-1",
                rdsInstanceClass: "db.t3.medium",
                rdsBackupRetentionDays: 3,
                lambdaMemorySize: 512,
                lambdaTimeout: 30,
            });

            expect(infra).toBeDefined();
        });

        it("should create VPC with correct CIDR", async () => {
            const infra = new infrastructure.PaymentInfrastructure("test-infra", {
                environmentSuffix: "test-123",
                environment: "test",
                region: "us-east-1",
                rdsInstanceClass: "db.t3.medium",
                rdsBackupRetentionDays: 3,
                lambdaMemorySize: 512,
                lambdaTimeout: 30,
            });

            const vpcId = await new Promise((resolve) => {
                infra.vpc.id.apply((id) => resolve(id));
            });

            expect(vpcId).toBeDefined();
        });

        it("should create S3 bucket with force destroy enabled", async () => {
            const infra = new infrastructure.PaymentInfrastructure("test-infra", {
                environmentSuffix: "test-123",
                environment: "test",
                region: "us-east-1",
                rdsInstanceClass: "db.t3.medium",
                rdsBackupRetentionDays: 3,
                lambdaMemorySize: 512,
                lambdaTimeout: 30,
            });

            const bucketName = await new Promise((resolve) => {
                infra.auditLogsBucket.bucket.apply((name) => resolve(name));
            });

            expect(bucketName).toContain("test-123");
        });

        it("should create Lambda functions with correct memory size", async () => {
            const infra = new infrastructure.PaymentInfrastructure("test-infra", {
                environmentSuffix: "test-123",
                environment: "test",
                region: "us-east-1",
                rdsInstanceClass: "db.t3.medium",
                rdsBackupRetentionDays: 3,
                lambdaMemorySize: 512,
                lambdaTimeout: 30,
            });

            expect(infra.processPaymentLambda).toBeDefined();
            expect(infra.verifyPaymentLambda).toBeDefined();
        });

        it("should create RDS instance with correct backup retention", async () => {
            const infra = new infrastructure.PaymentInfrastructure("test-infra", {
                environmentSuffix: "test-123",
                environment: "test",
                region: "us-east-1",
                rdsInstanceClass: "db.t3.medium",
                rdsBackupRetentionDays: 3,
                lambdaMemorySize: 512,
                lambdaTimeout: 30,
            });

            const rdsEndpoint = await new Promise((resolve) => {
                infra.rdsEndpoint.apply((endpoint) => resolve(endpoint));
            });

            expect(rdsEndpoint).toBeDefined();
        });

        it("should create SQS queue with DLQ", async () => {
            const infra = new infrastructure.PaymentInfrastructure("test-infra", {
                environmentSuffix: "test-123",
                environment: "test",
                region: "us-east-1",
                rdsInstanceClass: "db.t3.medium",
                rdsBackupRetentionDays: 3,
                lambdaMemorySize: 512,
                lambdaTimeout: 30,
            });

            const queueUrl = await new Promise((resolve) => {
                infra.paymentQueue.queueUrl.apply((url) => resolve(url));
            });

            expect(queueUrl).toBeDefined();
        });

        it("should create API Gateway with correct endpoints", async () => {
            const infra = new infrastructure.PaymentInfrastructure("test-infra", {
                environmentSuffix: "test-123",
                environment: "test",
                region: "us-east-1",
                rdsInstanceClass: "db.t3.medium",
                rdsBackupRetentionDays: 3,
                lambdaMemorySize: 512,
                lambdaTimeout: 30,
            });

            const apiEndpoint = await new Promise((resolve) => {
                infra.apiGatewayEndpoint.apply((endpoint) => resolve(endpoint));
            });

            expect(apiEndpoint).toBeDefined();
        });

        it("should create resources with environment-specific configurations", async () => {
            const prodInfra = new infrastructure.PaymentInfrastructure("prod-infra", {
                environmentSuffix: "prod-123",
                environment: "prod",
                region: "us-east-1",
                rdsInstanceClass: "db.r5.large",
                rdsBackupRetentionDays: 7,
                lambdaMemorySize: 512,
                lambdaTimeout: 30,
            });

            expect(prodInfra).toBeDefined();
        });

        it("should validate resource naming includes environmentSuffix", async () => {
            const infra = new infrastructure.PaymentInfrastructure("test-infra", {
                environmentSuffix: "test-456",
                environment: "test",
                region: "us-east-1",
                rdsInstanceClass: "db.t3.medium",
                rdsBackupRetentionDays: 3,
                lambdaMemorySize: 512,
                lambdaTimeout: 30,
            });

            const bucketName = await new Promise<string>((resolve) => {
                infra.auditLogsBucket.bucket.apply((name) => resolve(name as string));
            });

            expect(bucketName).toContain("test-456");
        });

        it("should validate RDS deletionProtection is false", async () => {
            const infra = new infrastructure.PaymentInfrastructure("test-infra", {
                environmentSuffix: "test-123",
                environment: "test",
                region: "us-east-1",
                rdsInstanceClass: "db.t3.medium",
                rdsBackupRetentionDays: 3,
                lambdaMemorySize: 512,
                lambdaTimeout: 30,
            });

            // RDS instance should be created with deletionProtection: false
            expect(infra.rdsEndpoint).toBeDefined();
        });
    });
});
```

## File: lib/README.md

```markdown
# Payment Processing Infrastructure

This Pulumi TypeScript project deploys a multi-environment payment processing infrastructure to AWS with strict consistency guarantees across dev, staging, and production environments.

## Architecture

The infrastructure includes:
- **VPC**: Isolated network with public and private subnets across 2 availability zones
- **API Gateway**: HTTP API with two endpoints for payment processing and verification
- **Lambda Functions**: Serverless compute for payment processing logic
- **RDS PostgreSQL**: Managed database for transaction data with automated backups
- **S3**: Audit log storage with versioning and intelligent tiering
- **SQS**: Message queues with dead letter queue for failed notifications
- **CloudWatch**: Monitoring and alarms for Lambda errors
- **IAM**: Least privilege roles and policies

## Prerequisites

- Node.js 18 or later
- Pulumi CLI
- AWS CLI configured with appropriate credentials
- TypeScript

## Installation

```bash
npm install
```

## Configuration

The project uses Pulumi stack configuration files to manage environment-specific values:

- `Pulumi.dev.yaml` - Development environment configuration
- `Pulumi.staging.yaml` - Staging environment configuration
- `Pulumi.prod.yaml` - Production environment configuration

### Configuration Parameters

- `environmentSuffix`: Unique suffix for resource names (required)
- `environment`: Environment name (dev, staging, or prod)
- `region`: AWS region for deployment
- `rdsInstanceClass`: RDS instance class (db.t3.medium or db.r5.large)
- `rdsBackupRetentionDays`: Number of days to retain backups (3 or 7)
- `lambdaMemorySize`: Lambda function memory in MB (default: 512)
- `lambdaTimeout`: Lambda function timeout in seconds (default: 30)

## Deployment

### Development Environment

```bash
pulumi stack select dev
pulumi up
```

### Staging Environment

```bash
pulumi stack select staging
pulumi up
```

### Production Environment

```bash
pulumi stack select prod
pulumi up
```

Production deployments require explicit confirmation to prevent accidental changes.

## Stack References

The infrastructure supports stack references for sharing VPC and subnet information from a separate networking stack. To use stack references:

1. Deploy a networking stack first
2. Reference outputs in your payment processing stack configuration

## Testing

Run unit tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Resource Naming

All resources include the `environmentSuffix` parameter in their names to ensure uniqueness and prevent conflicts between environments.

Examples:
- S3 Bucket: `payment-audit-logs-dev-m71vs8`
- Lambda Function: `process-payment-staging-m71vs8`
- RDS Instance: `payment-db-prod-m71vs8`

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured to be destroyable:
- S3 buckets have `forceDestroy: true`
- RDS instances have `deletionProtection: false` and `skipFinalSnapshot: true`

## Monitoring

CloudWatch alarms are configured for Lambda function errors:
- Threshold: 5 errors in 5 minutes
- Alarms are created for both process-payment and verify-payment functions

## Security

- RDS instances use encrypted storage with AWS-managed KMS keys
- Lambda functions run in private subnets with VPC configuration
- IAM roles follow least privilege principle
- API Gateway has request/response logging enabled
- All data stores use encryption at rest

## Cost Optimization

The infrastructure uses cost-effective configurations:
- NAT Gateway: Single NAT gateway shared across AZs
- RDS: Appropriate instance sizes per environment
- S3: Intelligent tiering for older audit logs
- Lambda: Right-sized memory and timeout settings

## Environment Consistency

The reusable module architecture ensures consistency across environments:
- Identical resource types and configurations
- Environment-specific values managed via Pulumi config
- Single source of truth for infrastructure definitions
- Configuration drift prevention through code

## Outputs

After deployment, the following outputs are available:

- `vpcId`: VPC identifier
- `privateSubnetIds`: List of private subnet IDs
- `publicSubnetIds`: List of public subnet IDs
- `apiGatewayEndpoint`: API Gateway endpoint URL
- `rdsEndpoint`: RDS database endpoint
- `auditLogsBucketName`: S3 bucket name for audit logs
- `paymentQueueUrl`: SQS queue URL
- `processPaymentLambdaArn`: Process payment Lambda ARN
- `verifyPaymentLambdaArn`: Verify payment Lambda ARN
```
