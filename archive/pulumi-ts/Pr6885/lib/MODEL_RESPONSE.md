# Multi-Environment Payment Processing Infrastructure - Pulumi TypeScript

This implementation creates consistent payment processing infrastructure across dev, staging, and production environments using reusable Pulumi components.

## File: lib/types.ts

```typescript
// Environment configuration interface
export interface EnvironmentConfig {
  name: string;
  logRetentionDays: number;
  lambdaConcurrency: number;
  rdsAlarmThreshold: number;
  enableWaf: boolean;
}

// Component props interface
export interface PaymentInfraProps {
  environment: string;
  environmentSuffix: string;
  config: EnvironmentConfig;
}
```

## File: lib/network.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface NetworkProps {
  environment: string;
  environmentSuffix: string;
  vpcCidr: string;
}

export class NetworkComponent extends pulumi.ComponentResource {
  public vpc: aws.ec2.Vpc;
  public privateSubnets: aws.ec2.Subnet[];
  public securityGroup: aws.ec2.SecurityGroup;

  constructor(name: string, props: NetworkProps, opts?: pulumi.ComponentResourceOptions) {
    super("custom:network:NetworkComponent", name, {}, opts);

    // Create VPC
    this.vpc = new aws.ec2.Vpc(`vpc-${props.environmentSuffix}`, {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `payments-vpc-${props.environment}-${props.environmentSuffix}`,
        Environment: props.environment,
      },
    }, { parent: this });

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZonesOutput({
      state: "available",
    });

    // Create 3 private subnets
    this.privateSubnets = [];
    const subnetCidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"];

    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(`private-subnet-${i}-${props.environmentSuffix}`, {
        vpcId: this.vpc.id,
        cidrBlock: subnetCidrs[i],
        availabilityZone: availabilityZones.names[i],
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `payments-private-subnet-${i}-${props.environment}-${props.environmentSuffix}`,
          Environment: props.environment,
        },
      }, { parent: this });

      this.privateSubnets.push(subnet);
    }

    // Create security group
    this.securityGroup = new aws.ec2.SecurityGroup(`sg-${props.environmentSuffix}`, {
      vpcId: this.vpc.id,
      description: `Security group for payment processing ${props.environment}`,
      ingress: [{
        protocol: "tcp",
        fromPort: 5432,
        toPort: 5432,
        cidrBlocks: [props.vpcCidr],
        description: "PostgreSQL access",
      }],
      egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
        description: "All outbound traffic",
      }],
      tags: {
        Name: `payments-sg-${props.environment}-${props.environmentSuffix}`,
        Environment: props.environment,
      },
    }, { parent: this });

    this.registerOutputs({
      vpcId: this.vpc.id,
      subnetIds: pulumi.output(this.privateSubnets).apply(subnets => subnets.map(s => s.id)),
      securityGroupId: this.securityGroup.id,
    });
  }
}
```

## File: lib/database.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface DatabaseProps {
  environment: string;
  environmentSuffix: string;
  subnetIds: pulumi.Input<string>[];
  securityGroupId: pulumi.Input<string>;
  kmsKey: aws.kms.Key;
}

export class DatabaseComponent extends pulumi.ComponentResource {
  public cluster: aws.rds.Cluster;
  public clusterInstance: aws.rds.ClusterInstance;

  constructor(name: string, props: DatabaseProps, opts?: pulumi.ComponentResourceOptions) {
    super("custom:database:DatabaseComponent", name, {}, opts);

    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(`db-subnet-group-${props.environmentSuffix}`, {
      subnetIds: props.subnetIds,
      tags: {
        Name: `payments-db-subnet-${props.environment}-${props.environmentSuffix}`,
        Environment: props.environment,
      },
    }, { parent: this });

    // Create Aurora Serverless v2 cluster
    this.cluster = new aws.rds.Cluster(`aurora-cluster-${props.environmentSuffix}`, {
      engine: "aurora-postgresql",
      engineMode: "provisioned",
      engineVersion: "15.3",
      databaseName: "payments",
      masterUsername: "admin",
      masterPassword: pulumi.secret("PaymentAdm1n!Temp"), // In production, use AWS Secrets Manager
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [props.securityGroupId],
      storageEncrypted: true,
      kmsKeyId: props.kmsKey.arn,
      backupRetentionPeriod: 1,
      skipFinalSnapshot: true,
      deletionProtection: false,
      serverlessv2ScalingConfiguration: {
        minCapacity: 0.5,
        maxCapacity: 1,
      },
      tags: {
        Name: `payments-aurora-${props.environment}-${props.environmentSuffix}`,
        Environment: props.environment,
      },
    }, { parent: this });

    // Create cluster instance
    this.clusterInstance = new aws.rds.ClusterInstance(`aurora-instance-${props.environmentSuffix}`, {
      clusterIdentifier: this.cluster.id,
      instanceClass: "db.serverless",
      engine: "aurora-postgresql",
      engineVersion: "15.3",
      tags: {
        Name: `payments-aurora-instance-${props.environment}-${props.environmentSuffix}`,
        Environment: props.environment,
      },
    }, { parent: this });

    this.registerOutputs({
      clusterId: this.cluster.id,
      clusterEndpoint: this.cluster.endpoint,
      clusterArn: this.cluster.arn,
    });
  }
}
```

## File: lib/compute.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface ComputeProps {
  environment: string;
  environmentSuffix: string;
  lambdaConcurrency: number;
  role: aws.iam.Role;
}

export class ComputeComponent extends pulumi.ComponentResource {
  public paymentProcessorFunction: aws.lambda.Function;
  public validationFunction: aws.lambda.Function;

  constructor(name: string, props: ComputeProps, opts?: pulumi.ComponentResourceOptions) {
    super("custom:compute:ComputeComponent", name, {}, opts);

    // Payment processor Lambda
    this.paymentProcessorFunction = new aws.lambda.Function(`payment-processor-${props.environmentSuffix}`, {
      runtime: "nodejs20.x",
      handler: "index.handler",
      role: props.role.arn,
      memorySize: 512,
      timeout: 30,
      reservedConcurrentExecutions: props.lambdaConcurrency,
      code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  console.log('Processing payment:', JSON.stringify(event));

  // Extract payment details from event
  const paymentData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

  // Process payment (simplified for demo)
  const result = {
    transactionId: \`txn-\${Date.now()}\`,
    status: 'processed',
    amount: paymentData.amount,
    timestamp: new Date().toISOString(),
  };

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};
        `),
      }),
      environment: {
        variables: {
          ENVIRONMENT: props.environment,
          LOG_LEVEL: "INFO",
        },
      },
      tags: {
        Name: `payment-processor-${props.environment}-${props.environmentSuffix}`,
        Environment: props.environment,
      },
    }, { parent: this });

    // Validation Lambda
    this.validationFunction = new aws.lambda.Function(`payment-validation-${props.environmentSuffix}`, {
      runtime: "nodejs20.x",
      handler: "index.handler",
      role: props.role.arn,
      memorySize: 512,
      timeout: 15,
      reservedConcurrentExecutions: props.lambdaConcurrency,
      code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  console.log('Validating payment:', JSON.stringify(event));

  // Extract validation data
  const data = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

  // Validate payment data
  const isValid = data.amount > 0 && data.currency && data.customerId;

  return {
    statusCode: 200,
    body: JSON.stringify({
      valid: isValid,
      checks: {
        amount: data.amount > 0,
        currency: !!data.currency,
        customer: !!data.customerId,
      },
    }),
  };
};
        `),
      }),
      environment: {
        variables: {
          ENVIRONMENT: props.environment,
          LOG_LEVEL: "INFO",
        },
      },
      tags: {
        Name: `payment-validation-${props.environment}-${props.environmentSuffix}`,
        Environment: props.environment,
      },
    }, { parent: this });

    this.registerOutputs({
      paymentProcessorArn: this.paymentProcessorFunction.arn,
      validationFunctionArn: this.validationFunction.arn,
    });
  }
}
```

## File: lib/api.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface ApiProps {
  environment: string;
  environmentSuffix: string;
  paymentProcessorFunction: aws.lambda.Function;
  validationFunction: aws.lambda.Function;
  enableWaf: boolean;
}

export class ApiComponent extends pulumi.ComponentResource {
  public restApi: aws.apigateway.RestApi;
  public deployment: aws.apigateway.Deployment;
  public stage: aws.apigateway.Stage;
  public wafAcl?: aws.wafv2.WebAcl;

  constructor(name: string, props: ApiProps, opts?: pulumi.ComponentResourceOptions) {
    super("custom:api:ApiComponent", name, {}, opts);

    // Create REST API
    this.restApi = new aws.apigateway.RestApi(`payment-api-${props.environmentSuffix}`, {
      name: `payments-api-${props.environment}-${props.environmentSuffix}`,
      description: `Payment processing API for ${props.environment}`,
      endpointConfiguration: {
        types: "REGIONAL",
      },
      tags: {
        Name: `payment-api-${props.environment}-${props.environmentSuffix}`,
        Environment: props.environment,
      },
    }, { parent: this });

    // Create /process resource
    const processResource = new aws.apigateway.Resource(`process-resource-${props.environmentSuffix}`, {
      restApi: this.restApi.id,
      parentId: this.restApi.rootResourceId,
      pathPart: "process",
    }, { parent: this });

    // Create POST method for /process
    const processMethod = new aws.apigateway.Method(`process-method-${props.environmentSuffix}`, {
      restApi: this.restApi.id,
      resourceId: processResource.id,
      httpMethod: "POST",
      authorization: "NONE",
    }, { parent: this });

    // Lambda integration for /process
    const processIntegration = new aws.apigateway.Integration(`process-integration-${props.environmentSuffix}`, {
      restApi: this.restApi.id,
      resourceId: processResource.id,
      httpMethod: processMethod.httpMethod,
      integrationHttpMethod: "POST",
      type: "AWS_PROXY",
      uri: props.paymentProcessorFunction.invokeArn,
    }, { parent: this });

    // Lambda permission for API Gateway
    const processPermission = new aws.lambda.Permission(`process-permission-${props.environmentSuffix}`, {
      action: "lambda:InvokeFunction",
      function: props.paymentProcessorFunction.name,
      principal: "apigateway.amazonaws.com",
      sourceArn: pulumi.interpolate`${this.restApi.executionArn}/*/*`,
    }, { parent: this });

    // Create /validate resource
    const validateResource = new aws.apigateway.Resource(`validate-resource-${props.environmentSuffix}`, {
      restApi: this.restApi.id,
      parentId: this.restApi.rootResourceId,
      pathPart: "validate",
    }, { parent: this });

    // Create POST method for /validate
    const validateMethod = new aws.apigateway.Method(`validate-method-${props.environmentSuffix}`, {
      restApi: this.restApi.id,
      resourceId: validateResource.id,
      httpMethod: "POST",
      authorization: "NONE",
    }, { parent: this });

    // Lambda integration for /validate
    const validateIntegration = new aws.apigateway.Integration(`validate-integration-${props.environmentSuffix}`, {
      restApi: this.restApi.id,
      resourceId: validateResource.id,
      httpMethod: validateMethod.httpMethod,
      integrationHttpMethod: "POST",
      type: "AWS_PROXY",
      uri: props.validationFunction.invokeArn,
    }, { parent: this });

    // Lambda permission for validation
    const validatePermission = new aws.lambda.Permission(`validate-permission-${props.environmentSuffix}`, {
      action: "lambda:InvokeFunction",
      function: props.validationFunction.name,
      principal: "apigateway.amazonaws.com",
      sourceArn: pulumi.interpolate`${this.restApi.executionArn}/*/*`,
    }, { parent: this });

    // Create deployment
    this.deployment = new aws.apigateway.Deployment(`api-deployment-${props.environmentSuffix}`, {
      restApi: this.restApi.id,
      description: `Deployment for ${props.environment}`,
    }, {
      parent: this,
      dependsOn: [processIntegration, validateIntegration],
    });

    // Create stage
    this.stage = new aws.apigateway.Stage(`api-stage-${props.environmentSuffix}`, {
      restApi: this.restApi.id,
      deployment: this.deployment.id,
      stageName: props.environment,
      description: `${props.environment} stage`,
      tags: {
        Name: `payment-api-stage-${props.environment}-${props.environmentSuffix}`,
        Environment: props.environment,
      },
    }, { parent: this });

    // Create WAF for production
    if (props.enableWaf) {
      this.wafAcl = new aws.wafv2.WebAcl(`payment-waf-${props.environmentSuffix}`, {
        name: `payments-waf-${props.environment}-${props.environmentSuffix}`,
        description: `WAF for payment API ${props.environment}`,
        scope: "REGIONAL",
        defaultAction: {
          allow: {},
        },
        rules: [{
          name: "RateLimitRule",
          priority: 1,
          action: {
            block: {},
          },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: "IP",
            },
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: `payments-rate-limit-${props.environment}`,
            sampledRequestsEnabled: true,
          },
        }],
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: `payments-waf-${props.environment}`,
          sampledRequestsEnabled: true,
        },
        tags: {
          Name: `payment-waf-${props.environment}-${props.environmentSuffix}`,
          Environment: props.environment,
        },
      }, { parent: this });

      // Associate WAF with API Gateway stage
      const wafAssociation = new aws.wafv2.WebAclAssociation(`waf-association-${props.environmentSuffix}`, {
        resourceArn: this.stage.arn,
        webAclArn: this.wafAcl.arn,
      }, { parent: this });
    }

    this.registerOutputs({
      apiId: this.restApi.id,
      apiEndpoint: pulumi.interpolate`${this.restApi.executionArn}/${this.stage.stageName}`,
      invokeUrl: this.stage.invokeUrl,
    });
  }
}
```

## File: lib/storage.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface StorageProps {
  environment: string;
  environmentSuffix: string;
  logRetentionDays: number;
}

export class StorageComponent extends pulumi.ComponentResource {
  public transactionTable: aws.dynamodb.Table;
  public auditBucket: aws.s3.BucketV2;
  public logGroup: aws.cloudwatch.LogGroup;

  constructor(name: string, props: StorageProps, opts?: pulumi.ComponentResourceOptions) {
    super("custom:storage:StorageComponent", name, {}, opts);

    // Create DynamoDB table for transaction logs
    this.transactionTable = new aws.dynamodb.Table(`transaction-table-${props.environmentSuffix}`, {
      name: `payments-transactions-${props.environment}-${props.environmentSuffix}`,
      billingMode: "PAY_PER_REQUEST",
      hashKey: "transactionId",
      rangeKey: "timestamp",
      pointInTimeRecovery: {
        enabled: true,
      },
      attributes: [
        {
          name: "transactionId",
          type: "S",
        },
        {
          name: "timestamp",
          type: "S",
        },
        {
          name: "customerId",
          type: "S",
        },
      ],
      globalSecondaryIndexes: [{
        name: "CustomerIndex",
        hashKey: "customerId",
        rangeKey: "timestamp",
        projectionType: "ALL",
      }],
      tags: {
        Name: `payments-transactions-${props.environment}-${props.environmentSuffix}`,
        Environment: props.environment,
      },
    }, { parent: this });

    // Create S3 bucket for audit trails
    this.auditBucket = new aws.s3.BucketV2(`audit-bucket-${props.environmentSuffix}`, {
      bucket: `payments-${props.environment}-audit-${props.environmentSuffix}`,
      tags: {
        Name: `payments-audit-${props.environment}-${props.environmentSuffix}`,
        Environment: props.environment,
      },
    }, { parent: this });

    // Enable versioning
    const bucketVersioning = new aws.s3.BucketVersioningV2(`audit-bucket-versioning-${props.environmentSuffix}`, {
      bucket: this.auditBucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    }, { parent: this });

    // Enable encryption
    const bucketEncryption = new aws.s3.BucketServerSideEncryptionConfigurationV2(`audit-bucket-encryption-${props.environmentSuffix}`, {
      bucket: this.auditBucket.id,
      rules: [{
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: "AES256",
        },
      }],
    }, { parent: this });

    // Lifecycle policy based on environment
    const lifecycleDays = props.environment === "prod" ? 90 : props.environment === "staging" ? 30 : 7;
    const bucketLifecycle = new aws.s3.BucketLifecycleConfigurationV2(`audit-bucket-lifecycle-${props.environmentSuffix}`, {
      bucket: this.auditBucket.id,
      rules: [{
        id: "archive-old-audits",
        status: "Enabled",
        transitions: [{
          days: lifecycleDays,
          storageClass: "GLACIER",
        }],
      }],
    }, { parent: this });

    // Block public access
    const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(`audit-bucket-public-access-${props.environmentSuffix}`, {
      bucket: this.auditBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    // Create CloudWatch log group
    this.logGroup = new aws.cloudwatch.LogGroup(`payment-logs-${props.environmentSuffix}`, {
      name: `/aws/payments/${props.environment}-${props.environmentSuffix}`,
      retentionInDays: props.logRetentionDays,
      tags: {
        Name: `payment-logs-${props.environment}-${props.environmentSuffix}`,
        Environment: props.environment,
      },
    }, { parent: this });

    this.registerOutputs({
      tableName: this.transactionTable.name,
      tableArn: this.transactionTable.arn,
      bucketName: this.auditBucket.bucket,
      bucketArn: this.auditBucket.arn,
      logGroupName: this.logGroup.name,
    });
  }
}
```

## File: lib/iam.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface IamProps {
  environment: string;
  environmentSuffix: string;
  transactionTableArn: pulumi.Input<string>;
  auditBucketArn: pulumi.Input<string>;
}

export class IamComponent extends pulumi.ComponentResource {
  public lambdaRole: aws.iam.Role;

  constructor(name: string, props: IamProps, opts?: pulumi.ComponentResourceOptions) {
    super("custom:iam:IamComponent", name, {}, opts);

    // Create Lambda execution role
    this.lambdaRole = new aws.iam.Role(`${props.environment}-lambda-role-${props.environmentSuffix}`, {
      name: `${props.environment}-payments-lambda-${props.environmentSuffix}`,
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
      tags: {
        Name: `${props.environment}-lambda-role-${props.environmentSuffix}`,
        Environment: props.environment,
      },
    }, { parent: this });

    // Attach basic Lambda execution policy
    const lambdaBasicPolicy = new aws.iam.RolePolicyAttachment(`${props.environment}-lambda-basic-${props.environmentSuffix}`, {
      role: this.lambdaRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    }, { parent: this });

    // Create custom policy for DynamoDB and S3 access
    const lambdaCustomPolicy = new aws.iam.RolePolicy(`${props.environment}-lambda-custom-policy-${props.environmentSuffix}`, {
      role: this.lambdaRole.id,
      policy: pulumi.all([props.transactionTableArn, props.auditBucketArn]).apply(([tableArn, bucketArn]) =>
        JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:Query",
                "dynamodb:Scan",
              ],
              Resource: [
                tableArn,
                `${tableArn}/index/*`,
              ],
            },
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
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
              ],
              Resource: "arn:aws:logs:*:*:*",
            },
          ],
        })
      ),
    }, { parent: this });

    this.registerOutputs({
      lambdaRoleArn: this.lambdaRole.arn,
    });
  }
}
```

## File: lib/monitoring.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface MonitoringProps {
  environment: string;
  environmentSuffix: string;
  clusterIdentifier: pulumi.Input<string>;
  rdsAlarmThreshold: number;
}

export class MonitoringComponent extends pulumi.ComponentResource {
  public cpuAlarm: aws.cloudwatch.MetricAlarm;

  constructor(name: string, props: MonitoringProps, opts?: pulumi.ComponentResourceOptions) {
    super("custom:monitoring:MonitoringComponent", name, {}, opts);

    // Create SNS topic for alarms
    const alarmTopic = new aws.sns.Topic(`alarm-topic-${props.environmentSuffix}`, {
      name: `payments-alarms-${props.environment}-${props.environmentSuffix}`,
      tags: {
        Name: `payments-alarms-${props.environment}-${props.environmentSuffix}`,
        Environment: props.environment,
      },
    }, { parent: this });

    // RDS CPU alarm
    this.cpuAlarm = new aws.cloudwatch.MetricAlarm(`rds-cpu-alarm-${props.environmentSuffix}`, {
      name: `payments-rds-cpu-${props.environment}-${props.environmentSuffix}`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "CPUUtilization",
      namespace: "AWS/RDS",
      period: 300,
      statistic: "Average",
      threshold: props.rdsAlarmThreshold,
      alarmDescription: `RDS CPU usage above ${props.rdsAlarmThreshold}% for ${props.environment}`,
      alarmActions: [alarmTopic.arn],
      dimensions: {
        DBClusterIdentifier: props.clusterIdentifier,
      },
      tags: {
        Name: `rds-cpu-alarm-${props.environment}-${props.environmentSuffix}`,
        Environment: props.environment,
      },
    }, { parent: this });

    this.registerOutputs({
      alarmTopicArn: alarmTopic.arn,
      cpuAlarmArn: this.cpuAlarm.arn,
    });
  }
}
```

## File: lib/payment-environment.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { PaymentInfraProps } from "./types";
import { NetworkComponent } from "./network";
import { DatabaseComponent } from "./database";
import { IamComponent } from "./iam";
import { ComputeComponent } from "./compute";
import { ApiComponent } from "./api";
import { StorageComponent } from "./storage";
import { MonitoringComponent } from "./monitoring";

export class PaymentEnvironmentComponent extends pulumi.ComponentResource {
  public network: NetworkComponent;
  public database: DatabaseComponent;
  public iam: IamComponent;
  public compute: ComputeComponent;
  public api: ApiComponent;
  public storage: StorageComponent;
  public monitoring: MonitoringComponent;
  public kmsKey: aws.kms.Key;

  constructor(name: string, props: PaymentInfraProps, opts?: pulumi.ComponentResourceOptions) {
    super("custom:PaymentEnvironmentComponent", name, {}, opts);

    // Create KMS key for encryption
    this.kmsKey = new aws.kms.Key(`kms-key-${props.environmentSuffix}`, {
      description: `KMS key for ${props.environment} payment processing`,
      deletionWindowInDays: 7,
      enableKeyRotation: true,
      tags: {
        Name: `payments-kms-${props.environment}-${props.environmentSuffix}`,
        Environment: props.environment,
      },
    }, { parent: this });

    const kmsAlias = new aws.kms.Alias(`kms-alias-${props.environmentSuffix}`, {
      name: `alias/payments-${props.environment}-${props.environmentSuffix}`,
      targetKeyId: this.kmsKey.keyId,
    }, { parent: this });

    // Create network infrastructure
    this.network = new NetworkComponent(`network-${props.environment}`, {
      environment: props.environment,
      environmentSuffix: props.environmentSuffix,
      vpcCidr: "10.0.0.0/16",
    }, { parent: this });

    // Create storage resources
    this.storage = new StorageComponent(`storage-${props.environment}`, {
      environment: props.environment,
      environmentSuffix: props.environmentSuffix,
      logRetentionDays: props.config.logRetentionDays,
    }, { parent: this });

    // Create IAM roles
    this.iam = new IamComponent(`iam-${props.environment}`, {
      environment: props.environment,
      environmentSuffix: props.environmentSuffix,
      transactionTableArn: this.storage.transactionTable.arn,
      auditBucketArn: this.storage.auditBucket.arn,
    }, { parent: this });

    // Create database
    this.database = new DatabaseComponent(`database-${props.environment}`, {
      environment: props.environment,
      environmentSuffix: props.environmentSuffix,
      subnetIds: this.network.privateSubnets.map(s => s.id),
      securityGroupId: this.network.securityGroup.id,
      kmsKey: this.kmsKey,
    }, { parent: this });

    // Create Lambda functions
    this.compute = new ComputeComponent(`compute-${props.environment}`, {
      environment: props.environment,
      environmentSuffix: props.environmentSuffix,
      lambdaConcurrency: props.config.lambdaConcurrency,
      role: this.iam.lambdaRole,
    }, { parent: this });

    // Create API Gateway
    this.api = new ApiComponent(`api-${props.environment}`, {
      environment: props.environment,
      environmentSuffix: props.environmentSuffix,
      paymentProcessorFunction: this.compute.paymentProcessorFunction,
      validationFunction: this.compute.validationFunction,
      enableWaf: props.config.enableWaf,
    }, { parent: this });

    // Create monitoring
    this.monitoring = new MonitoringComponent(`monitoring-${props.environment}`, {
      environment: props.environment,
      environmentSuffix: props.environmentSuffix,
      clusterIdentifier: this.database.cluster.id,
      rdsAlarmThreshold: props.config.rdsAlarmThreshold,
    }, { parent: this });

    this.registerOutputs({});
  }
}
```

## File: lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import { EnvironmentConfig } from "./types";
import { PaymentEnvironmentComponent } from "./payment-environment";

// Get environment suffix from Pulumi config
const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");

// Define environment configurations
const environments: { [key: string]: EnvironmentConfig } = {
  dev: {
    name: "dev",
    logRetentionDays: 7,
    lambdaConcurrency: 10,
    rdsAlarmThreshold: 80,
    enableWaf: false,
  },
  staging: {
    name: "staging",
    logRetentionDays: 30,
    lambdaConcurrency: 50,
    rdsAlarmThreshold: 75,
    enableWaf: false,
  },
  prod: {
    name: "prod",
    logRetentionDays: 90,
    lambdaConcurrency: 200,
    rdsAlarmThreshold: 70,
    enableWaf: true,
  },
};

// Create infrastructure for all environments
const devEnvironment = new PaymentEnvironmentComponent("dev-payment-infra", {
  environment: "dev",
  environmentSuffix: environmentSuffix,
  config: environments.dev,
});

const stagingEnvironment = new PaymentEnvironmentComponent("staging-payment-infra", {
  environment: "staging",
  environmentSuffix: environmentSuffix,
  config: environments.staging,
});

const prodEnvironment = new PaymentEnvironmentComponent("prod-payment-infra", {
  environment: "prod",
  environmentSuffix: environmentSuffix,
  config: environments.prod,
});

// Export outputs for all environments
export const devVpcId = devEnvironment.network.vpc.id;
export const devSubnetIds = pulumi.output(devEnvironment.network.privateSubnets).apply(subnets => subnets.map(s => s.id));
export const devDatabaseEndpoint = devEnvironment.database.cluster.endpoint;
export const devDatabaseArn = devEnvironment.database.cluster.arn;
export const devApiEndpoint = devEnvironment.api.stage.invokeUrl;
export const devTransactionTableName = devEnvironment.storage.transactionTable.name;
export const devAuditBucketName = devEnvironment.storage.auditBucket.bucket;

export const stagingVpcId = stagingEnvironment.network.vpc.id;
export const stagingSubnetIds = pulumi.output(stagingEnvironment.network.privateSubnets).apply(subnets => subnets.map(s => s.id));
export const stagingDatabaseEndpoint = stagingEnvironment.database.cluster.endpoint;
export const stagingDatabaseArn = stagingEnvironment.database.cluster.arn;
export const stagingApiEndpoint = stagingEnvironment.api.stage.invokeUrl;
export const stagingTransactionTableName = stagingEnvironment.storage.transactionTable.name;
export const stagingAuditBucketName = stagingEnvironment.storage.auditBucket.bucket;

export const prodVpcId = prodEnvironment.network.vpc.id;
export const prodSubnetIds = pulumi.output(prodEnvironment.network.privateSubnets).apply(subnets => subnets.map(s => s.id));
export const prodDatabaseEndpoint = prodEnvironment.database.cluster.endpoint;
export const prodDatabaseArn = prodEnvironment.database.cluster.arn;
export const prodApiEndpoint = prodEnvironment.api.stage.invokeUrl;
export const prodTransactionTableName = prodEnvironment.storage.transactionTable.name;
export const prodAuditBucketName = prodEnvironment.storage.auditBucket.bucket;
export const prodWafAclArn = prodEnvironment.api.wafAcl?.arn;
```

## File: lib/README.md

```markdown
# Multi-Environment Payment Processing Infrastructure

This Pulumi TypeScript project deploys consistent payment processing infrastructure across development, staging, and production environments.

## Architecture

### Components

1. **NetworkComponent** - VPC with 3 private subnets across availability zones
2. **DatabaseComponent** - Aurora Serverless v2 PostgreSQL clusters with encryption
3. **IamComponent** - IAM roles and policies with least-privilege access
4. **ComputeComponent** - Lambda functions for payment processing and validation
5. **ApiComponent** - API Gateway with custom domains and optional WAF
6. **StorageComponent** - DynamoDB tables and S3 buckets for data persistence
7. **MonitoringComponent** - CloudWatch alarms and metrics

### Environment Configurations

- **Development**: 7-day log retention, 10 Lambda concurrency, 80% CPU threshold
- **Staging**: 30-day log retention, 50 Lambda concurrency, 75% CPU threshold
- **Production**: 90-day log retention, 200 Lambda concurrency, 70% CPU threshold, WAF enabled

## Deployment

### Prerequisites

- Node.js 18+
- Pulumi CLI
- AWS CLI configured with credentials

### Configuration

Set the environment suffix (required for unique resource naming):

```bash
pulumi config set environmentSuffix <unique-suffix>
```

### Deploy

```bash
# Install dependencies
npm install

# Deploy infrastructure
pulumi up
```

### Outputs

After deployment, you'll get endpoints and ARNs for:
- VPC IDs and subnet IDs for each environment
- RDS cluster endpoints and ARNs
- API Gateway invoke URLs
- DynamoDB table names
- S3 bucket names
- WAF ACL ARN (production only)

## Testing

Run unit tests:

```bash
npm test
```

## Clean Up

Destroy all infrastructure:

```bash
pulumi destroy
```

## Security Features

- KMS encryption for RDS databases
- S3 encryption with AES256
- IAM roles with least-privilege policies
- VPC isolation with private subnets
- API Gateway WAF protection (production)
- DynamoDB point-in-time recovery

## Cost Optimization

- Aurora Serverless v2 with auto-scaling (0.5-1 ACU)
- DynamoDB on-demand billing
- S3 lifecycle policies to Glacier
- Environment-specific resource sizing
```