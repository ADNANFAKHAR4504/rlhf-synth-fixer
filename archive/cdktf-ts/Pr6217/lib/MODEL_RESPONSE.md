# Multi-Environment Payment Processing Infrastructure with CDKTF (TypeScript)

This implementation provides a complete CDKTF infrastructure for deploying payment processing systems across development, staging, and production environments using Terraform workspaces.

## File: lib/main.ts

```typescript
import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput, S3Backend } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { DbInstance } from "@cdktf/provider-aws/lib/db-instance";
import { DbSubnetGroup } from "@cdktf/provider-aws/lib/db-subnet-group";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketVersioningA } from "@cdktf/provider-aws/lib/s3-bucket-versioning";
import { S3BucketLifecycleConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { ApiGatewayRestApi } from "@cdktf/provider-aws/lib/api-gateway-rest-api";
import { ApiGatewayResource } from "@cdktf/provider-aws/lib/api-gateway-resource";
import { ApiGatewayMethod } from "@cdktf/provider-aws/lib/api-gateway-method";
import { ApiGatewayIntegration } from "@cdktf/provider-aws/lib/api-gateway-integration";
import { ApiGatewayDeployment } from "@cdktf/provider-aws/lib/api-gateway-deployment";
import { ApiGatewayStage } from "@cdktf/provider-aws/lib/api-gateway-stage";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { DataAwsSecretsmanagerSecret } from "@cdktf/provider-aws/lib/data-aws-secretsmanager-secret";
import { DataAwsSecretsmanagerSecretVersion } from "@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version";
import { DataAwsAvailabilityZones } from "@cdktf/provider-aws/lib/data-aws-availability-zones";

interface EnvironmentConfig {
  environment: string;
  vpcCidr: string;
  rdsInstanceClass: string;
  lambdaMemory: number;
  logRetentionDays: number;
}

class PaymentProcessingStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: EnvironmentConfig, environmentSuffix: string) {
    super(scope, id);

    // AWS Provider
    new AwsProvider(this, "aws", {
      region: "us-east-1",
    });

    // Backend configuration
    new S3Backend(this, {
      bucket: "terraform-state-payment-processing",
      key: `payment-processing/${config.environment}/terraform.tfstate`,
      region: "us-east-1",
      dynamodbTable: "terraform-state-lock",
      encrypt: true,
    });

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, "available", {
      state: "available",
    });

    // VPC
    const vpc = new Vpc(this, "vpc", {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `payment-vpc-${config.environment}`,
        Environment: config.environment,
        Project: "PaymentProcessing",
        ManagedBy: "Terraform",
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, "igw", {
      vpcId: vpc.id,
      tags: {
        Name: `payment-igw-${config.environment}`,
        Environment: config.environment,
        Project: "PaymentProcessing",
        ManagedBy: "Terraform",
      },
    });

    // Public Subnets
    const publicSubnet1 = new Subnet(this, "public_subnet_1", {
      vpcId: vpc.id,
      cidrBlock: `${config.vpcCidr.split('/')[0].split('.').slice(0, 2).join('.')}.1.0/24`,
      availabilityZone: azs.names[0],
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `payment-public-subnet-1-${config.environment}`,
        Environment: config.environment,
        Project: "PaymentProcessing",
        ManagedBy: "Terraform",
      },
    });

    const publicSubnet2 = new Subnet(this, "public_subnet_2", {
      vpcId: vpc.id,
      cidrBlock: `${config.vpcCidr.split('/')[0].split('.').slice(0, 2).join('.')}.2.0/24`,
      availabilityZone: azs.names[1],
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `payment-public-subnet-2-${config.environment}`,
        Environment: config.environment,
        Project: "PaymentProcessing",
        ManagedBy: "Terraform",
      },
    });

    // Private Subnets
    const privateSubnet1 = new Subnet(this, "private_subnet_1", {
      vpcId: vpc.id,
      cidrBlock: `${config.vpcCidr.split('/')[0].split('.').slice(0, 2).join('.')}.11.0/24`,
      availabilityZone: azs.names[0],
      tags: {
        Name: `payment-private-subnet-1-${config.environment}`,
        Environment: config.environment,
        Project: "PaymentProcessing",
        ManagedBy: "Terraform",
      },
    });

    const privateSubnet2 = new Subnet(this, "private_subnet_2", {
      vpcId: vpc.id,
      cidrBlock: `${config.vpcCidr.split('/')[0].split('.').slice(0, 2).join('.')}.12.0/24`,
      availabilityZone: azs.names[1],
      tags: {
        Name: `payment-private-subnet-2-${config.environment}`,
        Environment: config.environment,
        Project: "PaymentProcessing",
        ManagedBy: "Terraform",
      },
    });

    // Route Table for Public Subnets
    const publicRouteTable = new RouteTable(this, "public_route_table", {
      vpcId: vpc.id,
      route: [
        {
          cidrBlock: "0.0.0.0/0",
          gatewayId: igw.id,
        },
      ],
      tags: {
        Name: `payment-public-rt-${config.environment}`,
        Environment: config.environment,
        Project: "PaymentProcessing",
        ManagedBy: "Terraform",
      },
    });

    new RouteTableAssociation(this, "public_rt_assoc_1", {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, "public_rt_assoc_2", {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    });

    // Security Group for RDS
    const rdsSecurityGroup = new SecurityGroup(this, "rds_sg", {
      name: `payment-rds-sg-${config.environment}`,
      description: "Security group for RDS PostgreSQL instance",
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: "tcp",
          cidrBlocks: [config.vpcCidr],
          description: "PostgreSQL access from VPC",
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow all outbound traffic",
        },
      ],
      tags: {
        Name: `payment-rds-sg-${config.environment}`,
        Environment: config.environment,
        Project: "PaymentProcessing",
        ManagedBy: "Terraform",
      },
    });

    // Security Group for Lambda
    const lambdaSecurityGroup = new SecurityGroup(this, "lambda_sg", {
      name: `payment-lambda-sg-${config.environment}`,
      description: "Security group for Lambda functions",
      vpcId: vpc.id,
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow all outbound traffic",
        },
      ],
      tags: {
        Name: `payment-lambda-sg-${config.environment}`,
        Environment: config.environment,
        Project: "PaymentProcessing",
        ManagedBy: "Terraform",
      },
    });

    // DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, "db_subnet_group", {
      name: `payment-db-subnet-group-${config.environment}`,
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      tags: {
        Name: `payment-db-subnet-group-${config.environment}`,
        Environment: config.environment,
        Project: "PaymentProcessing",
        ManagedBy: "Terraform",
      },
    });

    // Retrieve DB password from Secrets Manager
    const dbPasswordSecret = new DataAwsSecretsmanagerSecret(this, "db_password_secret", {
      name: `payment-db-password-${config.environment}`,
    });

    const dbPasswordSecretVersion = new DataAwsSecretsmanagerSecretVersion(this, "db_password_secret_version", {
      secretId: dbPasswordSecret.id,
    });

    // RDS PostgreSQL Instance
    const rdsInstance = new DbInstance(this, "rds_instance", {
      identifier: `payment-db-${config.environment}`,
      engine: "postgres",
      engineVersion: "14.7",
      instanceClass: config.rdsInstanceClass,
      allocatedStorage: 20,
      storageType: "gp2",
      dbName: "paymentdb",
      username: "dbadmin",
      password: dbPasswordSecretVersion.secretString,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      backupRetentionPeriod: 7,
      skipFinalSnapshot: true,
      multiAz: false,
      publiclyAccessible: false,
      tags: {
        Name: `payment-db-${config.environment}`,
        Environment: config.environment,
        Project: "PaymentProcessing",
        ManagedBy: "Terraform",
      },
    });

    // S3 Bucket for transaction logs
    const transactionLogsBucket = new S3Bucket(this, "transaction_logs_bucket", {
      bucket: `payment-transaction-logs-${config.environment}`,
      tags: {
        Name: `payment-transaction-logs-${config.environment}`,
        Environment: config.environment,
        Project: "PaymentProcessing",
        ManagedBy: "Terraform",
      },
    });

    // Enable versioning on S3 bucket
    new S3BucketVersioningA(this, "transaction_logs_versioning", {
      bucket: transactionLogsBucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    });

    // S3 Lifecycle Policy
    new S3BucketLifecycleConfiguration(this, "transaction_logs_lifecycle", {
      bucket: transactionLogsBucket.id,
      rule: [
        {
          id: "archive-old-logs",
          status: "Enabled",
          transition: [
            {
              days: config.environment === "prod" ? 90 : config.environment === "staging" ? 60 : 30,
              storageClass: "GLACIER",
            },
          ],
        },
      ],
    });

    // IAM Role for Lambda
    const lambdaRole = new IamRole(this, "lambda_role", {
      name: `payment-lambda-role-${config.environment}`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Principal: {
              Service: "lambda.amazonaws.com",
            },
            Effect: "Allow",
          },
        ],
      }),
      tags: {
        Name: `payment-lambda-role-${config.environment}`,
        Environment: config.environment,
        Project: "PaymentProcessing",
        ManagedBy: "Terraform",
      },
    });

    // Attach basic execution policy
    new IamRolePolicyAttachment(this, "lambda_basic_execution", {
      role: lambdaRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    });

    // Attach VPC execution policy
    new IamRolePolicyAttachment(this, "lambda_vpc_execution", {
      role: lambdaRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
    });

    // CloudWatch Log Group for Lambda
    const lambdaLogGroup = new CloudwatchLogGroup(this, "lambda_log_group", {
      name: `/aws/lambda/payment-processor-${config.environment}`,
      retentionInDays: config.logRetentionDays,
      tags: {
        Name: `/aws/lambda/payment-processor-${config.environment}`,
        Environment: config.environment,
        Project: "PaymentProcessing",
        ManagedBy: "Terraform",
      },
    });

    // Lambda Function for payment processing
    const paymentProcessorLambda = new LambdaFunction(this, "payment_processor", {
      functionName: `payment-processor-${config.environment}`,
      runtime: "nodejs18.x",
      handler: "index.handler",
      role: lambdaRole.arn,
      memorySize: config.lambdaMemory,
      timeout: 30,
      vpcConfig: {
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [lambdaSecurityGroup.id],
      },
      environment: {
        variables: {
          ENVIRONMENT: config.environment,
          DB_HOST: rdsInstance.address,
          DB_NAME: "paymentdb",
          DB_USER: "dbadmin",
          S3_BUCKET: transactionLogsBucket.bucket,
        },
      },
      code: {
        zipFile: `
exports.handler = async (event) => {
  console.log('Processing payment:', JSON.stringify(event));
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Payment processed successfully' }),
  };
};
        `,
      },
      tags: {
        Name: `payment-processor-${config.environment}`,
        Environment: config.environment,
        Project: "PaymentProcessing",
        ManagedBy: "Terraform",
      },
    });

    // API Gateway REST API
    const api = new ApiGatewayRestApi(this, "payment_api", {
      name: `payment-api-${config.environment}`,
      description: "Payment Processing API",
      tags: {
        Name: `payment-api-${config.environment}`,
        Environment: config.environment,
        Project: "PaymentProcessing",
        ManagedBy: "Terraform",
      },
    });

    // API Gateway Resource
    const paymentsResource = new ApiGatewayResource(this, "payments_resource", {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: "payments",
    });

    // API Gateway Method
    const paymentsPostMethod = new ApiGatewayMethod(this, "payments_post_method", {
      restApiId: api.id,
      resourceId: paymentsResource.id,
      httpMethod: "POST",
      authorization: "NONE",
    });

    // API Gateway Integration
    new ApiGatewayIntegration(this, "payments_integration", {
      restApiId: api.id,
      resourceId: paymentsResource.id,
      httpMethod: paymentsPostMethod.httpMethod,
      integrationHttpMethod: "POST",
      type: "AWS_PROXY",
      uri: paymentProcessorLambda.invokeArn,
    });

    // API Gateway Deployment
    const deployment = new ApiGatewayDeployment(this, "api_deployment", {
      restApiId: api.id,
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    // API Gateway Stage
    const stage = new ApiGatewayStage(this, "api_stage", {
      deploymentId: deployment.id,
      restApiId: api.id,
      stageName: config.environment,
      tags: {
        Name: `payment-api-stage-${config.environment}`,
        Environment: config.environment,
        Project: "PaymentProcessing",
        ManagedBy: "Terraform",
      },
    });

    // Outputs
    new TerraformOutput(this, "vpc_id", {
      value: vpc.id,
      description: "VPC ID",
    });

    new TerraformOutput(this, "rds_endpoint", {
      value: rdsInstance.endpoint,
      description: "RDS endpoint connection string",
    });

    new TerraformOutput(this, "api_gateway_url", {
      value: `https://${api.id}.execute-api.us-east-1.amazonaws.com/${config.environment}`,
      description: "API Gateway endpoint URL",
    });

    new TerraformOutput(this, "lambda_function_name", {
      value: paymentProcessorLambda.functionName,
      description: "Lambda function name",
    });

    new TerraformOutput(this, "s3_bucket_name", {
      value: transactionLogsBucket.bucket,
      description: "S3 bucket name for transaction logs",
    });
  }
}

const app = new App();

// Environment configurations
const environments: { [key: string]: EnvironmentConfig } = {
  dev: {
    environment: "dev",
    vpcCidr: "10.1.0.0/16",
    rdsInstanceClass: "db.t3.micro",
    lambdaMemory: 128,
    logRetentionDays: 7,
  },
  staging: {
    environment: "staging",
    vpcCidr: "10.2.0.0/16",
    rdsInstanceClass: "db.t3.small",
    lambdaMemory: 256,
    logRetentionDays: 14,
  },
  prod: {
    environment: "prod",
    vpcCidr: "10.3.0.0/16",
    rdsInstanceClass: "db.t3.medium",
    lambdaMemory: 512,
    logRetentionDays: 30,
  },
};

// Get environment from environment variable or default to dev
const environment = process.env.ENVIRONMENT || "dev";
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || "default";

if (!environments[environment]) {
  throw new Error(`Invalid environment: ${environment}. Valid options: dev, staging, prod`);
}

new PaymentProcessingStack(app, "payment-processing", environments[environment], environmentSuffix);

app.synth();
```

## File: cdktf.json

```json
{
  "language": "typescript",
  "app": "npx ts-node lib/main.ts",
  "projectId": "payment-processing-infrastructure",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## File: package.json

```json
{
  "name": "payment-processing-infrastructure",
  "version": "1.0.0",
  "description": "Multi-environment payment processing infrastructure with CDKTF",
  "main": "lib/main.ts",
  "scripts": {
    "build": "tsc",
    "synth": "cdktf synth",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "keywords": [
    "cdktf",
    "terraform",
    "aws",
    "infrastructure"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "@cdktf/provider-aws": "^19.0.0",
    "cdktf": "^0.20.0",
    "constructs": "^10.3.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.0.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "outDir": "dist"
  },
  "include": ["lib/**/*.ts", "test/**/*.ts"],
  "exclude": ["node_modules", "dist", "cdktf.out"]
}
```

## File: lib/README.md

```markdown
# Payment Processing Infrastructure

Multi-environment payment processing infrastructure using CDKTF with TypeScript.

## Prerequisites

- Node.js 18+
- Terraform 1.5+
- AWS CLI configured with appropriate credentials
- CDKTF CLI installed (`npm install -g cdktf-cli`)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure AWS credentials:
   ```bash
   aws configure
   ```

3. Create Secrets Manager secrets for database passwords:
   ```bash
   aws secretsmanager create-secret \
     --name payment-db-password-dev \
     --secret-string "your-dev-password"

   aws secretsmanager create-secret \
     --name payment-db-password-staging \
     --secret-string "your-staging-password"

   aws secretsmanager create-secret \
     --name payment-db-password-prod \
     --secret-string "your-prod-password"
   ```

4. Create S3 bucket and DynamoDB table for remote state:
   ```bash
   aws s3 mb s3://terraform-state-payment-processing --region us-east-1

   aws dynamodb create-table \
     --table-name terraform-state-lock \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST \
     --region us-east-1
   ```

## Deployment

Deploy to development environment:
```bash
export ENVIRONMENT=dev
export ENVIRONMENT_SUFFIX=$(date +%s)
cdktf deploy
```

Deploy to staging environment:
```bash
export ENVIRONMENT=staging
export ENVIRONMENT_SUFFIX=$(date +%s)
cdktf deploy
```

Deploy to production environment:
```bash
export ENVIRONMENT=prod
export ENVIRONMENT_SUFFIX=$(date +%s)
cdktf deploy
```

## Testing

Run unit tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Infrastructure Components

- **VPC**: Isolated network per environment with public and private subnets across 2 AZs
- **RDS PostgreSQL**: Managed database with automated backups
- **Lambda**: Serverless payment processing functions
- **S3**: Transaction log storage with versioning and lifecycle policies
- **API Gateway**: RESTful API endpoints
- **CloudWatch**: Centralized logging with environment-specific retention
- **Secrets Manager**: Secure credential storage

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment}`

## Cleanup

Destroy infrastructure:
```bash
export ENVIRONMENT=dev
cdktf destroy
```
```
