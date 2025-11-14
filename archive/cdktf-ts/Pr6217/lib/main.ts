import { Construct } from 'constructs';
import {
  App,
  TerraformStack,
  TerraformOutput,
  S3Backend,
  Fn,
  TerraformAsset,
  AssetType,
} from 'cdktf';
import * as path from 'path';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

interface EnvironmentConfig {
  environment: string;
  vpcCidr: string;
  rdsInstanceClass: string;
  lambdaMemory: number;
  logRetentionDays: number;
}

class PaymentProcessingStack extends TerraformStack {
  constructor(
    scope: Construct,
    id: string,
    config: EnvironmentConfig,
    environmentSuffix: string
  ) {
    super(scope, id);

    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: 'us-east-1',
    });

    // Backend configuration using shared state bucket with environment-specific keys
    // The state bucket should be provided via TERRAFORM_STATE_BUCKET environment variable
    const stateBucket =
      process.env.TERRAFORM_STATE_BUCKET || 'iac-rlhf-tf-states';
    const stateBucketRegion =
      process.env.TERRAFORM_STATE_BUCKET_REGION || 'us-east-1';

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/payment-processing-${config.environment}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, 'available', {
      state: 'available',
    });

    // VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `payment-vpc-${config.environment}-${environmentSuffix}`,
        Environment: config.environment,
        Project: 'PaymentProcessing',
        ManagedBy: 'Terraform',
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-igw-${config.environment}-${environmentSuffix}`,
        Environment: config.environment,
        Project: 'PaymentProcessing',
        ManagedBy: 'Terraform',
      },
    });

    // Public Subnets
    const publicSubnet1 = new Subnet(this, 'public_subnet_1', {
      vpcId: vpc.id,
      cidrBlock: `${config.vpcCidr.split('/')[0].split('.').slice(0, 2).join('.')}.1.0/24`,
      availabilityZone: Fn.element(azs.names, 0),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `payment-public-subnet-1-${config.environment}-${environmentSuffix}`,
        Environment: config.environment,
        Project: 'PaymentProcessing',
        ManagedBy: 'Terraform',
      },
    });

    const publicSubnet2 = new Subnet(this, 'public_subnet_2', {
      vpcId: vpc.id,
      cidrBlock: `${config.vpcCidr.split('/')[0].split('.').slice(0, 2).join('.')}.2.0/24`,
      availabilityZone: Fn.element(azs.names, 1),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `payment-public-subnet-2-${config.environment}-${environmentSuffix}`,
        Environment: config.environment,
        Project: 'PaymentProcessing',
        ManagedBy: 'Terraform',
      },
    });

    // Private Subnets
    const privateSubnet1 = new Subnet(this, 'private_subnet_1', {
      vpcId: vpc.id,
      cidrBlock: `${config.vpcCidr.split('/')[0].split('.').slice(0, 2).join('.')}.11.0/24`,
      availabilityZone: Fn.element(azs.names, 0),
      tags: {
        Name: `payment-private-subnet-1-${config.environment}-${environmentSuffix}`,
        Environment: config.environment,
        Project: 'PaymentProcessing',
        ManagedBy: 'Terraform',
      },
    });

    const privateSubnet2 = new Subnet(this, 'private_subnet_2', {
      vpcId: vpc.id,
      cidrBlock: `${config.vpcCidr.split('/')[0].split('.').slice(0, 2).join('.')}.12.0/24`,
      availabilityZone: Fn.element(azs.names, 1),
      tags: {
        Name: `payment-private-subnet-2-${config.environment}-${environmentSuffix}`,
        Environment: config.environment,
        Project: 'PaymentProcessing',
        ManagedBy: 'Terraform',
      },
    });

    // Route Table for Public Subnets
    const publicRouteTable = new RouteTable(this, 'public_route_table', {
      vpcId: vpc.id,
      route: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: igw.id,
        },
      ],
      tags: {
        Name: `payment-public-rt-${config.environment}-${environmentSuffix}`,
        Environment: config.environment,
        Project: 'PaymentProcessing',
        ManagedBy: 'Terraform',
      },
    });

    new RouteTableAssociation(this, 'public_rt_assoc_1', {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'public_rt_assoc_2', {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    });

    // Security Group for RDS
    const rdsSecurityGroup = new SecurityGroup(this, 'rds_sg', {
      name: `payment-rds-sg-${config.environment}-${environmentSuffix}`,
      description: 'Security group for RDS PostgreSQL instance',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          cidrBlocks: [config.vpcCidr],
          description: 'PostgreSQL access from VPC',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: {
        Name: `payment-rds-sg-${config.environment}-${environmentSuffix}`,
        Environment: config.environment,
        Project: 'PaymentProcessing',
        ManagedBy: 'Terraform',
      },
    });

    // Security Group for Lambda
    const lambdaSecurityGroup = new SecurityGroup(this, 'lambda_sg', {
      name: `payment-lambda-sg-${config.environment}-${environmentSuffix}`,
      description: 'Security group for Lambda functions',
      vpcId: vpc.id,
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: {
        Name: `payment-lambda-sg-${config.environment}-${environmentSuffix}`,
        Environment: config.environment,
        Project: 'PaymentProcessing',
        ManagedBy: 'Terraform',
      },
    });

    // DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db_subnet_group', {
      name: `payment-db-subnet-group-${config.environment}-${environmentSuffix}`,
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      tags: {
        Name: `payment-db-subnet-group-${config.environment}-${environmentSuffix}`,
        Environment: config.environment,
        Project: 'PaymentProcessing',
        ManagedBy: 'Terraform',
      },
    });

    // Database credentials - using environment variables for CI/CD compatibility
    // In production, these should be managed via TF_VAR_db_username and TF_VAR_db_password
    const dbUsername = process.env.TF_VAR_db_username || 'dbadmin';
    const dbPassword = process.env.TF_VAR_db_password || 'TempPassword123!';

    // FIX 3: RDS instance identifier now includes environmentSuffix
    // FIX 4: Added multiAz, publiclyAccessible, and storageEncrypted properties
    const rdsInstance = new DbInstance(this, 'rds_instance', {
      identifier: `payment-db-${config.environment}-${environmentSuffix}`,
      engine: 'postgres',
      engineVersion: '14.19',
      instanceClass: config.rdsInstanceClass,
      allocatedStorage: 20,
      storageType: 'gp2',
      dbName: 'paymentdb',
      username: dbUsername,
      password: dbPassword,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      backupRetentionPeriod: 7,
      skipFinalSnapshot: true,
      multiAz: false,
      publiclyAccessible: false,
      storageEncrypted: true,
      tags: {
        Name: `payment-db-${config.environment}-${environmentSuffix}`,
        Environment: config.environment,
        Project: 'PaymentProcessing',
        ManagedBy: 'Terraform',
      },
    });

    // FIX 5: S3 bucket name now includes environmentSuffix
    const transactionLogsBucket = new S3Bucket(
      this,
      'transaction_logs_bucket',
      {
        bucket: `payment-transaction-logs-${config.environment}-${environmentSuffix}`,
        tags: {
          Name: `payment-transaction-logs-${config.environment}-${environmentSuffix}`,
          Environment: config.environment,
          Project: 'PaymentProcessing',
          ManagedBy: 'Terraform',
        },
      }
    );

    // Enable versioning on S3 bucket
    new S3BucketVersioningA(this, 'transaction_logs_versioning', {
      bucket: transactionLogsBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // S3 Lifecycle Policy
    new S3BucketLifecycleConfiguration(this, 'transaction_logs_lifecycle', {
      bucket: transactionLogsBucket.id,
      rule: [
        {
          id: 'archive-old-logs',
          status: 'Enabled',
          transition: [
            {
              days:
                config.environment === 'prod'
                  ? 90
                  : config.environment === 'staging'
                    ? 60
                    : 30,
              storageClass: 'GLACIER',
            },
          ],
        },
      ],
    });

    // IAM Role for Lambda
    const lambdaRole = new IamRole(this, 'lambda_role', {
      name: `payment-lambda-role-${config.environment}-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Effect: 'Allow',
          },
        ],
      }),
      tags: {
        Name: `payment-lambda-role-${config.environment}-${environmentSuffix}`,
        Environment: config.environment,
        Project: 'PaymentProcessing',
        ManagedBy: 'Terraform',
      },
    });

    // Attach basic execution policy
    new IamRolePolicyAttachment(this, 'lambda_basic_execution', {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    // Attach VPC execution policy
    new IamRolePolicyAttachment(this, 'lambda_vpc_execution', {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    });

    // FIX 6: Added IAM policy for Lambda S3 access
    const lambdaS3Policy = new IamPolicy(this, 'lambda_s3_policy', {
      name: `payment-lambda-s3-policy-${config.environment}-${environmentSuffix}`,
      description: 'Allows Lambda to write transaction logs to S3',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:PutObjectAcl'],
            Resource: `${transactionLogsBucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['s3:ListBucket'],
            Resource: transactionLogsBucket.arn,
          },
        ],
      }),
      tags: {
        Name: `payment-lambda-s3-policy-${config.environment}-${environmentSuffix}`,
        Environment: config.environment,
        Project: 'PaymentProcessing',
        ManagedBy: 'Terraform',
      },
    });

    new IamRolePolicyAttachment(this, 'lambda_s3_policy_attachment', {
      role: lambdaRole.name,
      policyArn: lambdaS3Policy.arn,
    });

    // CloudWatch Log Group for Lambda
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const lambdaLogGroup = new CloudwatchLogGroup(this, 'lambda_log_group', {
      name: `/aws/lambda/payment-processor-${config.environment}-${environmentSuffix}`,
      retentionInDays: config.logRetentionDays,
      tags: {
        Name: `/aws/lambda/payment-processor-${config.environment}-${environmentSuffix}`,
        Environment: config.environment,
        Project: 'PaymentProcessing',
        ManagedBy: 'Terraform',
      },
    });

    // FIX 7: Lambda function name now includes environmentSuffix
    // FIX 8: Using proper Lambda deployment package with TerraformAsset
    const lambdaAsset = new TerraformAsset(this, 'lambda_asset', {
      path: path.resolve(__dirname, 'lambda-deployment.zip'),
      type: AssetType.FILE,
    });

    const paymentProcessorLambda = new LambdaFunction(
      this,
      'payment_processor',
      {
        functionName: `payment-processor-${config.environment}-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
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
            DB_NAME: 'paymentdb',
            DB_USER: 'dbadmin',
            S3_BUCKET: transactionLogsBucket.bucket,
          },
        },
        filename: lambdaAsset.path,
        sourceCodeHash: lambdaAsset.assetHash,
        tags: {
          Name: `payment-processor-${config.environment}-${environmentSuffix}`,
          Environment: config.environment,
          Project: 'PaymentProcessing',
          ManagedBy: 'Terraform',
        },
      }
    );

    // API Gateway REST API
    const api = new ApiGatewayRestApi(this, 'payment_api', {
      name: `payment-api-${config.environment}-${environmentSuffix}`,
      description: 'Payment Processing API',
      tags: {
        Name: `payment-api-${config.environment}-${environmentSuffix}`,
        Environment: config.environment,
        Project: 'PaymentProcessing',
        ManagedBy: 'Terraform',
      },
    });

    // API Gateway Resource
    const paymentsResource = new ApiGatewayResource(this, 'payments_resource', {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: 'payments',
    });

    // API Gateway Method
    const paymentsPostMethod = new ApiGatewayMethod(
      this,
      'payments_post_method',
      {
        restApiId: api.id,
        resourceId: paymentsResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      }
    );

    // API Gateway Integration
    const paymentsIntegration = new ApiGatewayIntegration(
      this,
      'payments_integration',
      {
        restApiId: api.id,
        resourceId: paymentsResource.id,
        httpMethod: paymentsPostMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: paymentProcessorLambda.invokeArn,
      }
    );

    // FIX 9: Added Lambda permission for API Gateway to invoke Lambda
    new LambdaPermission(this, 'api_gateway_lambda_permission', {
      statementId: 'AllowAPIGatewayInvoke',
      action: 'lambda:InvokeFunction',
      functionName: paymentProcessorLambda.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    // FIX 10: API Gateway Deployment now has explicit dependencies and triggers
    const deployment = new ApiGatewayDeployment(this, 'api_deployment', {
      restApiId: api.id,
      triggers: {
        redeployment: Date.now().toString(),
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
      dependsOn: [paymentsPostMethod, paymentsIntegration],
    });

    // API Gateway Stage
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const stage = new ApiGatewayStage(this, 'api_stage', {
      deploymentId: deployment.id,
      restApiId: api.id,
      stageName: config.environment,
      tags: {
        Name: `payment-api-stage-${config.environment}-${environmentSuffix}`,
        Environment: config.environment,
        Project: 'PaymentProcessing',
        ManagedBy: 'Terraform',
      },
    });

    // Outputs
    new TerraformOutput(this, 'vpc_id', {
      value: vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'rds_endpoint', {
      value: rdsInstance.endpoint,
      description: 'RDS endpoint connection string',
    });

    new TerraformOutput(this, 'api_gateway_url', {
      value: `https://${api.id}.execute-api.us-east-1.amazonaws.com/${config.environment}`,
      description: 'API Gateway endpoint URL',
    });

    new TerraformOutput(this, 'lambda_function_name', {
      value: paymentProcessorLambda.functionName,
      description: 'Lambda function name',
    });

    new TerraformOutput(this, 's3_bucket_name', {
      value: transactionLogsBucket.bucket,
      description: 'S3 bucket name for transaction logs',
    });
  }
}

const app = new App();

// Environment configurations
const environments: { [key: string]: EnvironmentConfig } = {
  dev: {
    environment: 'dev',
    vpcCidr: '10.1.0.0/16',
    rdsInstanceClass: 'db.t3.micro',
    lambdaMemory: 128,
    logRetentionDays: 7,
  },
  staging: {
    environment: 'staging',
    vpcCidr: '10.2.0.0/16',
    rdsInstanceClass: 'db.t3.small',
    lambdaMemory: 256,
    logRetentionDays: 14,
  },
  prod: {
    environment: 'prod',
    vpcCidr: '10.3.0.0/16',
    rdsInstanceClass: 'db.t3.medium',
    lambdaMemory: 512,
    logRetentionDays: 30,
  },
};

// Get environment from environment variable or default to dev
const environment = process.env.ENVIRONMENT || 'dev';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'default';

if (!environments[environment]) {
  throw new Error(
    `Invalid environment: ${environment}. Valid options: dev, staging, prod`
  );
}

new PaymentProcessingStack(
  app,
  'payment-processing',
  environments[environment],
  environmentSuffix
);

app.synth();
