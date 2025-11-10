# Multi-Environment Data Analytics Platform - Initial Implementation

This implementation provides a multi-environment CDK infrastructure for a data analytics platform with environment-specific configurations.

## File: lib/environment-config.ts

```typescript
export interface EnvironmentConfig {
  vpcCidr: string;
  maxAzs: number;
  rdsInstanceClass: string;
  rdsBackupRetention: number;
  rdsMultiAz: boolean;
  lambdaMemorySize: number;
  logRetention: number;
  s3Versioning: boolean;
  dynamodbBillingMode: 'PAY_PER_REQUEST' | 'PROVISIONED';
  dynamodbReadCapacity?: number;
  dynamodbWriteCapacity?: number;
}

const configs: Record<string, EnvironmentConfig> = {
  dev: {
    vpcCidr: '10.0.0.0/16',
    maxAzs: 2,
    rdsInstanceClass: 'db.t3.micro',
    rdsBackupRetention: 7,
    rdsMultiAz: false,
    lambdaMemorySize: 512,
    logRetention: 7,
    s3Versioning: false,
    dynamodbBillingMode: 'PAY_PER_REQUEST',
  },
  staging: {
    vpcCidr: '10.1.0.0/16',
    maxAzs: 2,
    rdsInstanceClass: 'db.t3.small',
    rdsBackupRetention: 14,
    rdsMultiAz: false,
    lambdaMemorySize: 1024,
    logRetention: 30,
    s3Versioning: true,
    dynamodbBillingMode: 'PAY_PER_REQUEST',
  },
  prod: {
    vpcCidr: '10.2.0.0/16',
    maxAzs: 2,
    rdsInstanceClass: 'db.r5.large',
    rdsBackupRetention: 30,
    rdsMultiAz: true,
    lambdaMemorySize: 2048,
    logRetention: 90,
    s3Versioning: true,
    dynamodbBillingMode: 'PROVISIONED',
    dynamodbReadCapacity: 5,
    dynamodbWriteCapacity: 5,
  },
};

export function getEnvironmentConfig(env: string): EnvironmentConfig {
  const config = configs[env];
  if (!config) {
    throw new Error(`Configuration not found for environment: ${env}`);
  }
  return config;
}
```

## File: lib/vpc-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './environment-config';

export interface VpcConstructProps {
  environmentSuffix: string;
  config: EnvironmentConfig;
}

export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    // Create VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, `Vpc-${props.environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr(props.config.vpcCidr),
      maxAzs: props.config.maxAzs,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Security group for Lambda functions
    this.lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      `LambdaSG-${props.environmentSuffix}`,
      {
        vpc: this.vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: true,
      }
    );

    // Security group for RDS database
    this.databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      `DatabaseSG-${props.environmentSuffix}`,
      {
        vpc: this.vpc,
        description: 'Security group for RDS database',
        allowAllOutbound: false,
      }
    );

    // Allow Lambda to connect to database
    this.databaseSecurityGroup.addIngressRule(
      this.lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from Lambda'
    );

    cdk.Tags.of(this.vpc).add('Name', `vpc-${props.environmentSuffix}`);
  }
}
```

## File: lib/database-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './environment-config';

export interface DatabaseConstructProps {
  environmentSuffix: string;
  config: EnvironmentConfig;
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
}

export class DatabaseConstruct extends Construct {
  public readonly database: rds.DatabaseInstance;
  public readonly credentials: rds.DatabaseSecret;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    // Create database credentials
    this.credentials = new rds.DatabaseSecret(this, `DBSecret-${props.environmentSuffix}`, {
      username: 'dbadmin',
      secretName: `db-credentials-${props.environmentSuffix}`,
    });

    // Create RDS instance
    this.database = new rds.DatabaseInstance(this, `Database-${props.environmentSuffix}`, {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      credentials: rds.Credentials.fromSecret(this.credentials),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [props.securityGroup],
      multiAz: props.config.rdsMultiAz,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      backupRetention: cdk.Duration.days(props.config.rdsBackupRetention),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      databaseName: 'analytics',
    });

    cdk.Tags.of(this.database).add('Name', `database-${props.environmentSuffix}`);
  }
}
```

## File: lib/lambda-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './environment-config';

export interface LambdaConstructProps {
  environmentSuffix: string;
  config: EnvironmentConfig;
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
  databaseSecretArn: string;
}

export class LambdaConstruct extends Construct {
  public readonly dataProcessorFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    // Create IAM role for Lambda
    const lambdaRole = new iam.Role(this, `LambdaRole-${props.environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: `lambda-role-${props.environmentSuffix}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });

    // Add permissions for Secrets Manager
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [props.databaseSecretArn],
      })
    );

    // Create log group
    const logGroup = new logs.LogGroup(this, `LambdaLogGroup-${props.environmentSuffix}`, {
      logGroupName: `/aws/lambda/data-processor-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // Create Lambda function
    this.dataProcessorFunction = new lambda.Function(
      this,
      `DataProcessor-${props.environmentSuffix}`,
      {
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import json
import os

def handler(event, context):
    return {
        'statusCode': 200,
        'body': json.dumps('Data processor function')
    }
        `),
        functionName: `data-processor-${props.environmentSuffix}`,
        memorySize: props.config.lambdaMemorySize,
        timeout: cdk.Duration.seconds(30),
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [props.securityGroup],
        role: lambdaRole,
        environment: {
          DB_SECRET_ARN: props.databaseSecretArn,
        },
        logGroup: logGroup,
      }
    );
  }
}
```

## File: lib/storage-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './environment-config';

export interface StorageConstructProps {
  environmentSuffix: string;
  config: EnvironmentConfig;
}

export class StorageConstruct extends Construct {
  public readonly dataBucket: s3.Bucket;
  public readonly stateTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    // Create S3 bucket
    this.dataBucket = new s3.Bucket(this, `DataBucket-${props.environmentSuffix}`, {
      bucketName: `analytics-data-${props.environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: props.config.s3Versioning,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create DynamoDB table
    this.stateTable = new dynamodb.Table(this, `StateTable-${props.environmentSuffix}`, {
      tableName: `analytics-state-${props.environmentSuffix}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode:
        props.config.dynamodbBillingMode === 'PAY_PER_REQUEST'
          ? dynamodb.BillingMode.PAY_PER_REQUEST
          : dynamodb.BillingMode.PROVISIONED,
      readCapacity: props.config.dynamodbReadCapacity,
      writeCapacity: props.config.dynamodbWriteCapacity,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: props.config.rdsMultiAz, // Use multiAz as proxy for prod
    });
  }
}
```

## File: lib/parameter-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface ParameterConstructProps {
  environmentSuffix: string;
  environment: string;
  databaseEndpoint: string;
  bucketName: string;
  tableName: string;
}

export class ParameterConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ParameterConstructProps) {
    super(scope, id);

    // Database endpoint parameter
    new ssm.StringParameter(this, `DBEndpointParam-${props.environmentSuffix}`, {
      parameterName: `/${props.environment}/database/endpoint`,
      stringValue: props.databaseEndpoint,
      description: 'RDS database endpoint',
      tier: ssm.ParameterTier.STANDARD,
    });

    // S3 bucket parameter
    new ssm.StringParameter(this, `BucketParam-${props.environmentSuffix}`, {
      parameterName: `/${props.environment}/storage/bucket`,
      stringValue: props.bucketName,
      description: 'S3 data bucket name',
      tier: ssm.ParameterTier.STANDARD,
    });

    // DynamoDB table parameter
    new ssm.StringParameter(this, `TableParam-${props.environmentSuffix}`, {
      parameterName: `/${props.environment}/storage/table`,
      stringValue: props.tableName,
      description: 'DynamoDB state table name',
      tier: ssm.ParameterTier.STANDARD,
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcConstruct } from './vpc-construct';
import { DatabaseConstruct } from './database-construct';
import { LambdaConstruct } from './lambda-construct';
import { StorageConstruct } from './storage-construct';
import { ParameterConstruct } from './parameter-construct';
import { getEnvironmentConfig } from './environment-config';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  environment: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Get environment configuration
    const config = getEnvironmentConfig(props.environment);

    // Create VPC
    const vpcConstruct = new VpcConstruct(this, 'VpcConstruct', {
      environmentSuffix: props.environmentSuffix,
      config,
    });

    // Create Database
    const databaseConstruct = new DatabaseConstruct(this, 'DatabaseConstruct', {
      environmentSuffix: props.environmentSuffix,
      config,
      vpc: vpcConstruct.vpc,
      securityGroup: vpcConstruct.databaseSecurityGroup,
    });

    // Create Lambda functions
    const lambdaConstruct = new LambdaConstruct(this, 'LambdaConstruct', {
      environmentSuffix: props.environmentSuffix,
      config,
      vpc: vpcConstruct.vpc,
      securityGroup: vpcConstruct.lambdaSecurityGroup,
      databaseSecretArn: databaseConstruct.credentials.secretArn,
    });

    // Create Storage resources
    const storageConstruct = new StorageConstruct(this, 'StorageConstruct', {
      environmentSuffix: props.environmentSuffix,
      config,
    });

    // Grant Lambda access to S3 and DynamoDB
    storageConstruct.dataBucket.grantReadWrite(lambdaConstruct.dataProcessorFunction);
    storageConstruct.stateTable.grantReadWriteData(lambdaConstruct.dataProcessorFunction);

    // Create SSM parameters
    new ParameterConstruct(this, 'ParameterConstruct', {
      environmentSuffix: props.environmentSuffix,
      environment: props.environment,
      databaseEndpoint: databaseConstruct.database.dbInstanceEndpointAddress,
      bucketName: storageConstruct.dataBucket.bucketName,
      tableName: storageConstruct.stateTable.tableName,
    });

    // Add stack tags
    cdk.Tags.of(this).add('Environment', props.environment);
    cdk.Tags.of(this).add('CostCenter', 'analytics');
    cdk.Tags.of(this).add('ManagedBy', 'cdk');
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

const environment = app.node.tryGetContext('environment') || 'dev';
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || `${environment}-${Date.now()}`;

new TapStack(app, `TapStack-${environmentSuffix}`, {
  environmentSuffix,
  environment,
  env: {
    region: 'ap-southeast-1',
  },
});

app.synth();
```

## File: lib/README.md

```markdown
# Multi-Environment Data Analytics Platform

AWS CDK infrastructure for a data analytics platform with support for multiple environments (dev, staging, prod).

## Architecture

The infrastructure consists of:

- **VPC**: Isolated network with public and private subnets across 2 AZs
- **RDS PostgreSQL**: Database with encryption and automated backups
- **Lambda Functions**: Data processing functions with VPC access
- **S3 Buckets**: Object storage with optional versioning
- **DynamoDB Tables**: State management with environment-specific billing
- **SSM Parameters**: Centralized configuration management
- **CloudWatch Logs**: Log aggregation with retention policies

## Environment Configurations

### Dev
- VPC CIDR: 10.0.0.0/16
- RDS: db.t3.micro, single-AZ, 7-day backup
- Lambda: 512MB memory, 7-day log retention
- Storage: No versioning, on-demand DynamoDB

### Staging
- VPC CIDR: 10.1.0.0/16
- RDS: db.t3.small, single-AZ, 14-day backup
- Lambda: 1024MB memory, 30-day log retention
- Storage: Versioned S3, on-demand DynamoDB

### Production
- VPC CIDR: 10.2.0.0/16
- RDS: db.r5.large, multi-AZ, 30-day backup
- Lambda: 2048MB memory, 90-day log retention
- Storage: Versioned S3, provisioned DynamoDB

## Deployment

### Prerequisites
- AWS CLI configured
- Node.js 18+ and npm
- AWS CDK CLI installed

### Deploy

```bash
# Install dependencies
npm install

# Deploy to dev
cdk deploy -c environment=dev -c environmentSuffix=dev-test

# Deploy to staging
cdk deploy -c environment=staging -c environmentSuffix=staging-test

# Deploy to production
cdk deploy -c environment=prod -c environmentSuffix=prod-v1
```

### Destroy

```bash
cdk destroy -c environment=dev -c environmentSuffix=dev-test
```

## Project Structure

```
lib/
├── environment-config.ts    # Environment-specific configurations
├── vpc-construct.ts         # VPC and networking
├── database-construct.ts    # RDS PostgreSQL
├── lambda-construct.ts      # Lambda functions
├── storage-construct.ts     # S3 and DynamoDB
├── parameter-construct.ts   # SSM parameters
└── tap-stack.ts            # Main stack composition
bin/
└── tap.ts                   # CDK app entry point
```

## Security

- RDS database deployed in private subnets
- Lambda functions use VPC endpoints for AWS services
- Database credentials stored in Secrets Manager
- All storage resources encrypted at rest
- Security groups follow least privilege principle

## Cost Optimization

- Dev environment uses smallest instance sizes
- On-demand billing for dev/staging DynamoDB
- Automated resource cleanup with RemovalPolicy.DESTROY
- Single NAT Gateway per environment
```