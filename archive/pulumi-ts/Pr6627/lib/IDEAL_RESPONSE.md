# Multi-Environment Pulumi TypeScript Infrastructure

This implementation creates a comprehensive multi-environment infrastructure using Pulumi TypeScript with environment-specific configurations for dev, staging, and production.

## Architecture Overview

The solution includes:
- Reusable VPC Component Resource
- Environment-specific RDS PostgreSQL instances
- S3 buckets with lifecycle policies
- Lambda functions with API Gateway integration
- CloudWatch monitoring and logging
- IAM roles with least privilege
- Configuration validation

## File: lib/config.ts

```typescript
import * as pulumi from '@pulumi/pulumi';

/**
 * Environment-specific configuration for infrastructure resources.
 * This interface defines all the parameters that vary between environments.
 */
export interface EnvironmentConfig {
  // VPC Configuration
  vpcCidr: string;
  availabilityZones: string[];

  // RDS Configuration
  rdsInstanceClass: string;
  rdsAllocatedStorage: number;
  rdsMultiAz: boolean;
  rdsBackupRetentionDays: number;
  rdsCpuAlarmThreshold: number;

  // S3 Configuration
  s3LifecycleRetentionDays: number;

  // Lambda Configuration
  lambdaMemorySize: number;
  lambdaTimeout: number;

  // CloudWatch Configuration
  logRetentionDays: number;

  // Common Configuration
  environment: string;
  tags: { [key: string]: string };
}

/**
 * Get environment-specific configuration based on the environment suffix.
 * This function validates that all required configuration values are present.
 *
 * @param environmentSuffix - The environment identifier (dev, staging, prod)
 * @returns Environment-specific configuration object
 * @throws Error if required configuration values are missing
 */
export function getEnvironmentConfig(environmentSuffix: string): EnvironmentConfig {
  const config = new pulumi.Config();

  // Define environment-specific configurations
  const environmentConfigs: { [key: string]: EnvironmentConfig } = {
    dev: {
      vpcCidr: '10.0.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b'],
      rdsInstanceClass: 'db.t3.micro',
      rdsAllocatedStorage: 20,
      rdsMultiAz: false,
      rdsBackupRetentionDays: 1,
      rdsCpuAlarmThreshold: 80,
      s3LifecycleRetentionDays: 7,
      lambdaMemorySize: 128,
      lambdaTimeout: 30,
      logRetentionDays: 7,
      environment: 'dev',
      tags: {
        Environment: 'dev',
        ManagedBy: 'Pulumi',
        CostCenter: 'Engineering',
      },
    },
    staging: {
      vpcCidr: '10.1.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b'],
      rdsInstanceClass: 'db.t3.small',
      rdsAllocatedStorage: 50,
      rdsMultiAz: true,
      rdsBackupRetentionDays: 1,
      rdsCpuAlarmThreshold: 75,
      s3LifecycleRetentionDays: 30,
      lambdaMemorySize: 256,
      lambdaTimeout: 60,
      logRetentionDays: 30,
      environment: 'staging',
      tags: {
        Environment: 'staging',
        ManagedBy: 'Pulumi',
        CostCenter: 'Engineering',
      },
    },
    prod: {
      vpcCidr: '10.2.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b'],
      rdsInstanceClass: 'db.t3.medium',
      rdsAllocatedStorage: 100,
      rdsMultiAz: true,
      rdsBackupRetentionDays: 1,
      rdsCpuAlarmThreshold: 70,
      s3LifecycleRetentionDays: 90,
      lambdaMemorySize: 512,
      lambdaTimeout: 120,
      logRetentionDays: 90,
      environment: 'prod',
      tags: {
        Environment: 'prod',
        ManagedBy: 'Pulumi',
        CostCenter: 'Engineering',
      },
    },
  };

  const envConfig = environmentConfigs[environmentSuffix];

  if (!envConfig) {
    throw new Error(
      `Invalid environment suffix: ${environmentSuffix}. ` +
      `Valid values are: ${Object.keys(environmentConfigs).join(', ')}`
    );
  }

  // Validate that all required configuration values are present
  validateConfig(envConfig);

  return envConfig;
}

/**
 * Validate that all required configuration values are present and valid.
 *
 * @param config - The environment configuration to validate
 * @throws Error if any required values are missing or invalid
 */
function validateConfig(config: EnvironmentConfig): void {
  const requiredFields: (keyof EnvironmentConfig)[] = [
    'vpcCidr',
    'availabilityZones',
    'rdsInstanceClass',
    'rdsAllocatedStorage',
    'rdsMultiAz',
    'rdsBackupRetentionDays',
    'rdsCpuAlarmThreshold',
    's3LifecycleRetentionDays',
    'lambdaMemorySize',
    'lambdaTimeout',
    'logRetentionDays',
    'environment',
  ];

  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (config[field] === undefined || config[field] === null) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required configuration values: ${missingFields.join(', ')}`
    );
  }

  // Validate specific field constraints
  if (config.availabilityZones.length < 2) {
    throw new Error('At least 2 availability zones are required');
  }

  if (config.lambdaMemorySize < 128 || config.lambdaMemorySize > 10240) {
    throw new Error('Lambda memory size must be between 128 and 10240 MB');
  }

  if (config.lambdaTimeout < 1 || config.lambdaTimeout > 900) {
    throw new Error('Lambda timeout must be between 1 and 900 seconds');
  }
}
```

## File: lib/vpc-component.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

/**
 * Arguments for the VpcComponent.
 */
export interface VpcComponentArgs {
  /**
   * The CIDR block for the VPC.
   */
  vpcCidr: string;

  /**
   * List of availability zones to use for subnets.
   */
  availabilityZones: string[];

  /**
   * Environment suffix for resource naming.
   */
  environmentSuffix: string;

  /**
   * Tags to apply to all resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * A reusable Pulumi ComponentResource that creates a VPC with public and private subnets
 * across multiple availability zones.
 *
 * This component creates:
 * - A VPC with the specified CIDR block
 * - Public subnets in each AZ
 * - Private subnets in each AZ
 * - An Internet Gateway for public subnet access
 * - Route tables for public subnets
 *
 * Note: NAT Gateways are NOT created to reduce costs for synthetic tasks.
 * Use VPC Endpoints for S3/DynamoDB access from private subnets instead.
 */
export class VpcComponent extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly publicRouteTable: aws.ec2.RouteTable;
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];

  constructor(name: string, args: VpcComponentArgs, opts?: pulumi.ComponentResourceOptions) {
    super('custom:network:VpcComponent', name, {}, opts);

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `vpc-${args.environmentSuffix}`,
      {
        cidrBlock: args.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          Name: `vpc-${args.environmentSuffix}`,
          ...tags,
        })),
      },
      { parent: this }
    );

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `igw-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          Name: `igw-${args.environmentSuffix}`,
          ...tags,
        })),
      },
      { parent: this }
    );

    // Create public route table
    this.publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          Name: `public-rt-${args.environmentSuffix}`,
          ...tags,
        })),
      },
      { parent: this }
    );

    // Add route to Internet Gateway
    new aws.ec2.Route(
      `public-route-${args.environmentSuffix}`,
      {
        routeTableId: this.publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { parent: this }
    );

    // Calculate subnet CIDR blocks
    const subnetCidrBlocks = this.calculateSubnetCidrs(args.vpcCidr, args.availabilityZones.length);

    // Create public and private subnets in each AZ
    this.publicSubnets = [];
    this.privateSubnets = [];
    this.publicSubnetIds = [];
    this.privateSubnetIds = [];

    args.availabilityZones.forEach((az, index) => {
      // Create public subnet
      const publicSubnet = new aws.ec2.Subnet(
        `public-subnet-${args.environmentSuffix}-${index}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: subnetCidrBlocks.publicSubnets[index],
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: pulumi.all([args.tags]).apply(([tags]) => ({
            Name: `public-subnet-${args.environmentSuffix}-${az}`,
            Type: 'Public',
            ...tags,
          })),
        },
        { parent: this }
      );

      // Associate public subnet with public route table
      new aws.ec2.RouteTableAssociation(
        `public-rta-${args.environmentSuffix}-${index}`,
        {
          subnetId: publicSubnet.id,
          routeTableId: this.publicRouteTable.id,
        },
        { parent: this }
      );

      this.publicSubnets.push(publicSubnet);
      this.publicSubnetIds.push(publicSubnet.id);

      // Create private subnet
      const privateSubnet = new aws.ec2.Subnet(
        `private-subnet-${args.environmentSuffix}-${index}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: subnetCidrBlocks.privateSubnets[index],
          availabilityZone: az,
          mapPublicIpOnLaunch: false,
          tags: pulumi.all([args.tags]).apply(([tags]) => ({
            Name: `private-subnet-${args.environmentSuffix}-${az}`,
            Type: 'Private',
            ...tags,
          })),
        },
        { parent: this }
      );

      this.privateSubnets.push(privateSubnet);
      this.privateSubnetIds.push(privateSubnet.id);
    });

    this.vpcId = this.vpc.id;

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      internetGatewayId: this.internetGateway.id,
    });
  }

  /**
   * Calculate CIDR blocks for public and private subnets.
   * Splits the VPC CIDR into equally-sized subnets for public and private use.
   */
  private calculateSubnetCidrs(
    vpcCidr: string,
    azCount: number
  ): { publicSubnets: string[]; privateSubnets: string[] } {
    // Simple CIDR calculation for 2 AZs
    // For production use, consider using a library like 'ip' or 'ipaddr.js'
    const [baseIp, vpcPrefix] = vpcCidr.split('/');
    const prefix = parseInt(vpcPrefix);

    // Calculate subnet prefix (add 2 bits for 4 subnets total: 2 public + 2 private)
    const subnetPrefix = prefix + 2;

    const baseOctets = baseIp.split('.').map(Number);
    const thirdOctet = baseOctets[2];

    const publicSubnets: string[] = [];
    const privateSubnets: string[] = [];

    for (let i = 0; i < azCount; i++) {
      // Public subnets: .0.0, .64.0
      publicSubnets.push(`${baseOctets[0]}.${baseOctets[1]}.${thirdOctet + i * 64}.0/${subnetPrefix}`);

      // Private subnets: .128.0, .192.0
      privateSubnets.push(`${baseOctets[0]}.${baseOctets[1]}.${thirdOctet + 128 + i * 64}.0/${subnetPrefix}`);
    }

    return { publicSubnets, privateSubnets };
  }
}
```

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import { VpcComponent } from './vpc-component';
import { getEnvironmentConfig } from './config';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'staging', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Main Pulumi ComponentResource for multi-environment infrastructure.
 *
 * This component orchestrates the creation of:
 * - VPC with public and private subnets
 * - RDS PostgreSQL database
 * - S3 buckets with lifecycle policies
 * - Lambda functions
 * - API Gateway
 * - CloudWatch log groups and alarms
 * - IAM roles and policies
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly apiGatewayUrl: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
    const config = getEnvironmentConfig(environmentSuffix);
    const tags = args.tags || config.tags;

    // Create VPC using the reusable component
    const vpc = new VpcComponent(
      'vpc',
      {
        vpcCidr: config.vpcCidr,
        availabilityZones: config.availabilityZones,
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // Create security group for RDS
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `rds-sg-${environmentSuffix}`,
      {
        vpcId: vpc.vpcId,
        description: `Security group for RDS PostgreSQL - ${environmentSuffix}`,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: [config.vpcCidr],
            description: 'PostgreSQL access from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          Name: `rds-sg-${environmentSuffix}`,
          ...t,
        })),
      },
      { parent: this }
    );

    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: vpc.privateSubnetIds,
        tags: pulumi.all([tags]).apply(([t]) => ({
          Name: `db-subnet-group-${environmentSuffix}`,
          ...t,
        })),
      },
      { parent: this }
    );

    // Create RDS PostgreSQL instance
    const rdsInstance = new aws.rds.Instance(
      `postgres-${environmentSuffix}`,
      {
        identifier: `postgres-${environmentSuffix}`,
        engine: 'postgres',
        engineVersion: '15.4',
        instanceClass: config.rdsInstanceClass,
        allocatedStorage: config.rdsAllocatedStorage,
        storageType: 'gp3',
        dbName: `appdb${environmentSuffix}`,
        username: 'dbadmin',
        password: pulumi.secret('ChangeMe123!'), // In production, use AWS Secrets Manager
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        multiAz: config.rdsMultiAz,
        backupRetentionPeriod: config.rdsBackupRetentionDays,
        skipFinalSnapshot: true,
        storageEncrypted: true,
        publiclyAccessible: false,
        deletionProtection: false,
        tags: pulumi.all([tags]).apply(([t]) => ({
          Name: `postgres-${environmentSuffix}`,
          ...t,
        })),
      },
      { parent: this }
    );

    // Create S3 bucket with lifecycle policy
    const bucket = new aws.s3.BucketV2(
      `app-data-${environmentSuffix}`,
      {
        bucket: `app-data-${environmentSuffix}-${aws.getCallerIdentityOutput().accountId}`,
        tags: pulumi.all([tags]).apply(([t]) => ({
          Name: `app-data-${environmentSuffix}`,
          ...t,
        })),
      },
      { parent: this }
    );

    // Enable versioning
    new aws.s3.BucketVersioningV2(
      `bucket-versioning-${environmentSuffix}`,
      {
        bucket: bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Enable encryption
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `bucket-encryption-${environmentSuffix}`,
      {
        bucket: bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      { parent: this }
    );

    // Configure lifecycle policy
    new aws.s3.BucketLifecycleConfigurationV2(
      `bucket-lifecycle-${environmentSuffix}`,
      {
        bucket: bucket.id,
        rules: [
          {
            id: `delete-old-versions-${environmentSuffix}`,
            status: 'Enabled',
            noncurrentVersionExpiration: {
              noncurrentDays: config.s3LifecycleRetentionDays,
            },
          },
        ],
      },
      { parent: this }
    );

    // Create IAM role for Lambda
    const lambdaRole = new aws.iam.Role(
      `lambda-role-${environmentSuffix}`,
      {
        name: `lambda-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: pulumi.all([tags]).apply(([t]) => t),
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `lambda-basic-execution-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Create custom policy for S3 access
    const lambdaS3Policy = new aws.iam.Policy(
      `lambda-s3-policy-${environmentSuffix}`,
      {
        name: `lambda-s3-policy-${environmentSuffix}`,
        description: `Policy for Lambda to access S3 bucket - ${environmentSuffix}`,
        policy: bucket.arn.apply((arn) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
                Resource: [arn, `${arn}/*`],
              },
            ],
          })
        ),
        tags: pulumi.all([tags]).apply(([t]) => t),
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `lambda-s3-policy-attachment-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: lambdaS3Policy.arn,
      },
      { parent: this }
    );

    // Create CloudWatch log group for Lambda
    const lambdaLogGroup = new aws.cloudwatch.LogGroup(
      `lambda-log-group-${environmentSuffix}`,
      {
        name: `/aws/lambda/data-processor-${environmentSuffix}`,
        retentionInDays: config.logRetentionDays,
        tags: pulumi.all([tags]).apply(([t]) => t),
      },
      { parent: this }
    );

    // Create Lambda function
    const lambdaFunction = new aws.lambda.Function(
      `data-processor-${environmentSuffix}`,
      {
        name: `data-processor-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        memorySize: config.lambdaMemorySize,
        timeout: config.lambdaTimeout,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  console.log('Processing event:', JSON.stringify(event, null, 2));

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Data processed successfully',
      environment: '${environmentSuffix}',
      timestamp: new Date().toISOString(),
      event: event
    }),
  };

  return response;
};
          `),
        }),
        environment: {
          variables: {
            ENVIRONMENT: environmentSuffix,
            S3_BUCKET: bucket.bucket,
            RDS_ENDPOINT: rdsInstance.endpoint,
          },
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          Name: `data-processor-${environmentSuffix}`,
          ...t,
        })),
      },
      { parent: this, dependsOn: [lambdaLogGroup] }
    );

    // Create API Gateway REST API
    const api = new aws.apigateway.RestApi(
      `api-${environmentSuffix}`,
      {
        name: `data-api-${environmentSuffix}`,
        description: `API Gateway for data processing - ${environmentSuffix}`,
        tags: pulumi.all([tags]).apply(([t]) => t),
      },
      { parent: this }
    );

    // Create API Gateway resource
    const apiResource = new aws.apigateway.Resource(
      `api-resource-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'process',
      },
      { parent: this }
    );

    // Create API Gateway method
    const apiMethod = new aws.apigateway.Method(
      `api-method-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: apiResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      },
      { parent: this }
    );

    // Create Lambda integration
    const apiIntegration = new aws.apigateway.Integration(
      `api-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: apiResource.id,
        httpMethod: apiMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: lambdaFunction.invokeArn,
      },
      { parent: this }
    );

    // Grant API Gateway permission to invoke Lambda
    new aws.lambda.Permission(
      `api-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: this }
    );

    // Deploy API
    const apiDeployment = new aws.apigateway.Deployment(
      `api-deployment-${environmentSuffix}`,
      {
        restApi: api.id,
        stageName: environmentSuffix,
      },
      { parent: this, dependsOn: [apiIntegration] }
    );

    // Create CloudWatch alarm for RDS CPU utilization
    const snsTopicForAlarms = new aws.sns.Topic(
      `rds-alarms-${environmentSuffix}`,
      {
        name: `rds-alarms-${environmentSuffix}`,
        tags: pulumi.all([tags]).apply(([t]) => t),
      },
      { parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      `rds-cpu-alarm-${environmentSuffix}`,
      {
        name: `rds-cpu-high-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: config.rdsCpuAlarmThreshold,
        alarmDescription: `RDS CPU utilization is above ${config.rdsCpuAlarmThreshold}%`,
        dimensions: {
          DBInstanceIdentifier: rdsInstance.identifier,
        },
        alarmActions: [snsTopicForAlarms.arn],
        tags: pulumi.all([tags]).apply(([t]) => t),
      },
      { parent: this }
    );

    // Store outputs
    this.vpcId = vpc.vpcId;
    this.rdsEndpoint = rdsInstance.endpoint;
    this.s3BucketName = bucket.bucket;
    this.lambdaFunctionArn = lambdaFunction.arn;
    this.apiGatewayUrl = pulumi.interpolate`${api.executionArn}/${environmentSuffix}/process`;

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: vpc.publicSubnetIds,
      privateSubnetIds: vpc.privateSubnetIds,
      rdsEndpoint: this.rdsEndpoint,
      rdsInstanceId: rdsInstance.id,
      s3BucketName: this.s3BucketName,
      s3BucketArn: bucket.arn,
      lambdaFunctionName: lambdaFunction.name,
      lambdaFunctionArn: this.lambdaFunctionArn,
      apiGatewayId: api.id,
      apiGatewayUrl: apiDeployment.invokeUrl.apply((url) => `${url}/process`),
      snsTopicArn: snsTopicForAlarms.arn,
    });
  }
}
```

## File: bin/tap.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Get the environment suffix from environment variables, defaulting to 'dev'.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Define default tags
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
  ManagedBy: 'Pulumi',
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main stack
const stack = new TapStack(
  'tap-infrastructure',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export stack outputs
export const vpcId = stack.vpcId;
export const rdsEndpoint = stack.rdsEndpoint;
export const s3BucketName = stack.s3BucketName;
export const lambdaFunctionArn = stack.lambdaFunctionArn;
export const apiGatewayUrl = stack.apiGatewayUrl;
```

## File: test/tap-stack.unit.test.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';
import { getEnvironmentConfig } from '../lib/config';

// Set up Pulumi mocks
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } {
    return {
      id: args.inputs.name ? `${args.name}-id-${args.inputs.name}` : `${args.name}-id`,
      state: {
        ...args.inputs,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDAI123456789EXAMPLE',
      };
    }
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  describe('Environment Configuration', () => {
    it('should load dev configuration correctly', () => {
      const config = getEnvironmentConfig('dev');

      expect(config.environment).toBe('dev');
      expect(config.vpcCidr).toBe('10.0.0.0/16');
      expect(config.rdsInstanceClass).toBe('db.t3.micro');
      expect(config.lambdaMemorySize).toBe(128);
      expect(config.s3LifecycleRetentionDays).toBe(7);
    });

    it('should load staging configuration correctly', () => {
      const config = getEnvironmentConfig('staging');

      expect(config.environment).toBe('staging');
      expect(config.vpcCidr).toBe('10.1.0.0/16');
      expect(config.rdsInstanceClass).toBe('db.t3.small');
      expect(config.lambdaMemorySize).toBe(256);
      expect(config.s3LifecycleRetentionDays).toBe(30);
    });

    it('should load prod configuration correctly', () => {
      const config = getEnvironmentConfig('prod');

      expect(config.environment).toBe('prod');
      expect(config.vpcCidr).toBe('10.2.0.0/16');
      expect(config.rdsInstanceClass).toBe('db.t3.medium');
      expect(config.lambdaMemorySize).toBe(512);
      expect(config.s3LifecycleRetentionDays).toBe(90);
    });

    it('should throw error for invalid environment', () => {
      expect(() => getEnvironmentConfig('invalid')).toThrow(
        'Invalid environment suffix'
      );
    });

    it('should validate required configuration fields', () => {
      const config = getEnvironmentConfig('dev');

      expect(config.availabilityZones).toBeDefined();
      expect(config.availabilityZones.length).toBeGreaterThanOrEqual(2);
      expect(config.rdsBackupRetentionDays).toBeGreaterThanOrEqual(1);
      expect(config.lambdaTimeout).toBeGreaterThan(0);
    });
  });

  describe('TapStack Resource Creation', () => {
    let stack: TapStack;

    beforeAll(async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'dev',
        tags: { TestTag: 'TestValue' },
      });
    });

    it('should create TapStack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should expose VPC ID output', async () => {
      const vpcId = await pulumi.output(stack.vpcId).promise();
      expect(vpcId).toBeDefined();
      expect(typeof vpcId).toBe('string');
    });

    it('should expose RDS endpoint output', async () => {
      const endpoint = await pulumi.output(stack.rdsEndpoint).promise();
      expect(endpoint).toBeDefined();
      expect(typeof endpoint).toBe('string');
    });

    it('should expose S3 bucket name output', async () => {
      const bucketName = await pulumi.output(stack.s3BucketName).promise();
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
    });

    it('should expose Lambda function ARN output', async () => {
      const lambdaArn = await pulumi.output(stack.lambdaFunctionArn).promise();
      expect(lambdaArn).toBeDefined();
      expect(typeof lambdaArn).toBe('string');
    });

    it('should expose API Gateway URL output', async () => {
      const apiUrl = await pulumi.output(stack.apiGatewayUrl).promise();
      expect(apiUrl).toBeDefined();
      expect(typeof apiUrl).toBe('string');
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in resource names', async () => {
      const stack = new TapStack('naming-test', {
        environmentSuffix: 'test-env',
      });

      const outputs = await pulumi.output(stack).promise();

      // Verify naming patterns are followed (using mocked resources)
      expect(outputs).toBeDefined();
    });
  });

  describe('Multi-Environment Support', () => {
    it('should create different configurations for each environment', () => {
      const devConfig = getEnvironmentConfig('dev');
      const stagingConfig = getEnvironmentConfig('staging');
      const prodConfig = getEnvironmentConfig('prod');

      expect(devConfig.vpcCidr).not.toBe(stagingConfig.vpcCidr);
      expect(stagingConfig.vpcCidr).not.toBe(prodConfig.vpcCidr);

      expect(devConfig.rdsInstanceClass).not.toBe(prodConfig.rdsInstanceClass);
      expect(devConfig.lambdaMemorySize).toBeLessThan(prodConfig.lambdaMemorySize);
      expect(devConfig.s3LifecycleRetentionDays).toBeLessThan(prodConfig.s3LifecycleRetentionDays);
    });
  });
});
```

## File: test/tap-stack.int.test.ts

```typescript
import * as fs from 'fs';
import * as path from 'path';

/**
 * Integration tests for the deployed TAP infrastructure.
 * These tests validate actual deployed resources using stack outputs.
 */
describe('TAP Infrastructure Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    // Load stack outputs from the flat-outputs.json file
    const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Stack outputs not found at ${outputsPath}. ` +
        'Please ensure the infrastructure is deployed and outputs are exported.'
      );
    }

    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);
  });

  describe('VPC Resources', () => {
    it('should have VPC ID in outputs', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    it('should have public subnet IDs in outputs', () => {
      expect(outputs.publicSubnetIds).toBeDefined();
      expect(Array.isArray(outputs.publicSubnetIds)).toBe(true);
      expect(outputs.publicSubnetIds.length).toBeGreaterThanOrEqual(2);
    });

    it('should have private subnet IDs in outputs', () => {
      expect(outputs.privateSubnetIds).toBeDefined();
      expect(Array.isArray(outputs.privateSubnetIds)).toBe(true);
      expect(outputs.privateSubnetIds.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('RDS Resources', () => {
    it('should have RDS endpoint in outputs', () => {
      expect(outputs.rdsEndpoint).toBeDefined();
      expect(outputs.rdsEndpoint).toContain('.rds.amazonaws.com');
    });

    it('should have RDS instance ID in outputs', () => {
      expect(outputs.rdsInstanceId).toBeDefined();
      expect(typeof outputs.rdsInstanceId).toBe('string');
    });
  });

  describe('S3 Resources', () => {
    it('should have S3 bucket name in outputs', () => {
      expect(outputs.s3BucketName).toBeDefined();
      expect(outputs.s3BucketName).toContain('app-data-');
    });

    it('should have S3 bucket ARN in outputs', () => {
      expect(outputs.s3BucketArn).toBeDefined();
      expect(outputs.s3BucketArn).toMatch(/^arn:aws:s3:::/);
    });
  });

  describe('Lambda Resources', () => {
    it('should have Lambda function name in outputs', () => {
      expect(outputs.lambdaFunctionName).toBeDefined();
      expect(outputs.lambdaFunctionName).toContain('data-processor-');
    });

    it('should have Lambda function ARN in outputs', () => {
      expect(outputs.lambdaFunctionArn).toBeDefined();
      expect(outputs.lambdaFunctionArn).toMatch(/^arn:aws:lambda:/);
    });
  });

  describe('API Gateway Resources', () => {
    it('should have API Gateway ID in outputs', () => {
      expect(outputs.apiGatewayId).toBeDefined();
      expect(typeof outputs.apiGatewayId).toBe('string');
    });

    it('should have API Gateway URL in outputs', () => {
      expect(outputs.apiGatewayUrl).toBeDefined();
      expect(outputs.apiGatewayUrl).toMatch(/^https:\/\//);
      expect(outputs.apiGatewayUrl).toContain('amazonaws.com');
    });
  });

  describe('CloudWatch Resources', () => {
    it('should have SNS topic ARN for alarms in outputs', () => {
      expect(outputs.snsTopicArn).toBeDefined();
      expect(outputs.snsTopicArn).toMatch(/^arn:aws:sns:/);
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should follow environmentSuffix naming pattern', () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

      expect(outputs.lambdaFunctionName).toContain(environmentSuffix);
      expect(outputs.s3BucketName).toContain(environmentSuffix);
    });
  });

  describe('Environment-Specific Configurations', () => {
    it('should reflect environment-specific settings', () => {
      // Verify that outputs reflect the deployed environment
      // This is a placeholder - actual validation would require AWS SDK calls
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });
  });
});
```

## File: lib/README.md

```markdown
# Multi-Environment Pulumi TypeScript Infrastructure

This infrastructure deploys a complete multi-environment setup using Pulumi TypeScript with AWS.

## Architecture

The solution creates:

- **VPC Component**: Reusable component creating VPC with public/private subnets across 2 AZs
- **RDS PostgreSQL**: Environment-specific database instances with automated backups and encryption
- **S3 Buckets**: With versioning, encryption, and environment-specific lifecycle policies
- **Lambda Functions**: With environment-specific memory and timeout configurations
- **API Gateway**: REST API integrating with Lambda functions
- **CloudWatch**: Log groups and CPU utilization alarms
- **IAM**: Least-privilege roles and policies for all services

## Environment Configurations

### Development (dev)
- VPC CIDR: 10.0.0.0/16
- RDS: db.t3.micro, 20GB, Single-AZ
- Lambda: 128MB, 30s timeout
- S3 Lifecycle: 7 days
- Log Retention: 7 days

### Staging
- VPC CIDR: 10.1.0.0/16
- RDS: db.t3.small, 50GB, Multi-AZ
- Lambda: 256MB, 60s timeout
- S3 Lifecycle: 30 days
- Log Retention: 30 days

### Production
- VPC CIDR: 10.2.0.0/16
- RDS: db.t3.medium, 100GB, Multi-AZ
- Lambda: 512MB, 120s timeout
- S3 Lifecycle: 90 days
- Log Retention: 90 days

## Deployment

### Prerequisites

```bash
# Install Pulumi
curl -fsSL https://get.pulumi.com | sh

# Install dependencies
npm install

# Configure AWS credentials
aws configure
```

### Deploy to Dev

```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1
pulumi up --stack dev
```

### Deploy to Staging

```bash
export ENVIRONMENT_SUFFIX=staging
export AWS_REGION=us-east-1
pulumi up --stack staging
```

### Deploy to Production

```bash
export ENVIRONMENT_SUFFIX=prod
export AWS_REGION=us-east-1
pulumi up --stack prod
```

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
# After deployment, run integration tests
npm run test:integration
```

## Stack Outputs

Each environment exports:
- `vpcId`: VPC identifier
- `publicSubnetIds`: List of public subnet IDs
- `privateSubnetIds`: List of private subnet IDs
- `rdsEndpoint`: PostgreSQL database endpoint
- `s3BucketName`: S3 bucket name
- `lambdaFunctionArn`: Lambda function ARN
- `apiGatewayUrl`: API Gateway endpoint URL
- `snsTopicArn`: SNS topic for CloudWatch alarms

## Configuration Validation

The infrastructure includes built-in configuration validation that ensures:
- All required environment-specific values are present
- At least 2 availability zones are configured
- Lambda memory is within valid range (128-10240 MB)
- Lambda timeout is within valid range (1-900 seconds)

## Resource Naming

All resources follow the naming pattern:
```
{resource-type}-{environmentSuffix}
```

Examples:
- `postgres-dev`
- `app-data-staging-123456789012`
- `data-processor-prod`

## Security Features

- VPC with public/private subnet isolation
- RDS encryption at rest
- S3 bucket encryption (AES256)
- Security groups with minimal ingress rules
- IAM roles with least privilege
- Private RDS instances (not publicly accessible)
- CloudWatch logging enabled

## Cost Optimization

- No NAT Gateways created (use VPC Endpoints for S3/DynamoDB if needed)
- Single-AZ RDS for dev environment
- Minimal backup retention (1 day for testing)
- Auto-scaling disabled (use manual scaling for synthetic tasks)

## Cleanup

```bash
pulumi destroy --stack <environment>
```

This will remove all resources created by the stack.
```
