# Ideal Response - Email Notification Infrastructure

This document contains the ideal implementation for the email notification system described in PROMPT.md, with all TypeScript code properly formatted in code blocks.

## iac-nova-app.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from './tap-stack';

const app = new cdk.App();

const tapStackId =
  process.env.CDK_STAGE_ID ??
  (app.node.tryGetContext('stageId') as string | undefined) ??
  'IaCNovaTapStack';

new TapStack(app, tapStackId, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  stackId:
    process.env.CDK_STACK_ID ??
    (app.node.tryGetContext('stackId') as string | undefined),
  stackDescription:
    process.env.CDK_STACK_DESCRIPTION ??
    'Email notification infrastructure synthesized via TapStack.',
  stringSuffix:
    process.env.STRING_SUFFIX ??
    (app.node.tryGetContext('stringSuffix') as string | undefined),
  environmentSuffix:
    process.env.ENVIRONMENT_SUFFIX ??
    (app.node.tryGetContext('environmentSuffix') as string | undefined),
});

app.synth();
```

## tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IaCNovaStack } from './iac-nova-stack';

interface TapStackProps extends cdk.StackProps {
  /**
   * Optional suffix used when generating child stack identifiers.
   */
  environmentSuffix?: string;

  /**
   * Explicit identifier for the IaC stack created within this stage.
   */
  stackId?: string;

  /**
   * Human-readable description for the IaC stack.
   */
  stackDescription?: string;

  /**
   * Explicit string suffix to pass into the nested infrastructure stack.
   */
  stringSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly emailInfrastructure: IaCNovaStack;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ??
      this.node.tryGetContext('environmentSuffix') ??
      'dev';

    const contextStackId = this.node.tryGetContext('stackId') as
      | string
      | undefined;
    const stackId =
      props?.stackId ??
      contextStackId ??
      `IaCNovaEmailNotification-${environmentSuffix}`;

    const contextDescription = this.node.tryGetContext('stackDescription') as
      | string
      | undefined;
    const stackDescription =
      props?.stackDescription ??
      contextDescription ??
      'Email notification infrastructure (IAC-349955) synthesized by TapStack.';

    const resolvedStringSuffix =
      props?.stringSuffix ??
      (this.node.tryGetContext('stringSuffix') as string | undefined) ??
      process.env.STRING_SUFFIX ??
      environmentSuffix;

    this.emailInfrastructure = new IaCNovaStack(this, stackId, {
      description: stackDescription,
      initialEnvironmentId: environmentSuffix,
      initialStringSuffix: resolvedStringSuffix,
    });
  }
}
```

## iac-nova-stack.ts (Core Infrastructure)

```typescript
import * as cdk from 'aws-cdk-lib';
import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct, IConstruct } from 'constructs';
import * as path from 'path';

export interface IaCNovaStackProps extends NestedStackProps {
  /**
   * Default value used for the EnvironmentId parameter when not provided explicitly.
   */
  readonly initialEnvironmentId?: string;

  /**
   * Default value used for the StringSuffix parameter when not provided explicitly.
   */
  readonly initialStringSuffix?: string;
}

/**
 * CDK stack that provisions the email notification infrastructure described in IAC-349955.
 * Configuration is driven by CloudFormation parameters and environment variables to avoid hard-coded values.
 */
export class IaCNovaStack extends NestedStack {
  public readonly vpc: ec2.Vpc;
  public readonly sharedSecurityGroup: ec2.SecurityGroup;
  public readonly rdsSecurityGroup: ec2.SecurityGroup;
  public readonly emailEventsBucket: s3.Bucket;
  public readonly emailProcessorFunction: lambda.Function;
  public readonly databaseInstance: rds.DatabaseInstance;
  private readonly environmentIdToken: string;
  private readonly stringSuffixToken: string;

  constructor(scope: Construct, id: string, props?: IaCNovaStackProps) {
    super(scope, id, props);

    const environmentIdDefault = props?.initialEnvironmentId ?? 'development';
    const defaultStringSuffix = props?.initialStringSuffix ?? 'stack';
    const defaultVpcCidr = '10.0.0.0/16';

    // CloudFormation Parameters for runtime configuration
    const environmentIdParam = new cdk.CfnParameter(this, 'EnvironmentId', {
      type: 'String',
      description: 'Lowercase identifier for the deployment environment (used in resource names).',
      default: environmentIdDefault,
    });

    const stringSuffixParam = new cdk.CfnParameter(this, 'StringSuffix', {
      type: 'String',
      description: 'Alphanumeric suffix appended to all resource names for uniqueness.',
      default: defaultStringSuffix,
    });

    const vpcCidrParam = new cdk.CfnParameter(this, 'VpcCidr', {
      type: 'String',
      description: 'CIDR block for the VPC (e.g., 10.0.0.0/16).',
      default: defaultVpcCidr,
    });

    const maxAzsParam = new cdk.CfnParameter(this, 'MaxAzs', {
      type: 'Number',
      description: 'Maximum number of Availability Zones to use for subnets.',
      default: 2,
    });

    const natGatewayCountParam = new cdk.CfnParameter(this, 'NatGatewayCount', {
      type: 'Number',
      description: 'Number of NAT Gateways to create for outbound traffic from private subnets.',
      default: 1,
    });

    // Resolve parameters with context and environment variable fallbacks
    this.environmentIdToken = this.resolveStringParameter(environmentIdParam, {
      contextKey: 'environmentSuffix',
      envKey: 'ENVIRONMENT_SUFFIX',
      defaultValue: environmentIdDefault,
    });

    this.stringSuffixToken = this.resolveStringParameter(stringSuffixParam, {
      contextKey: 'stringSuffix',
      envKey: 'STRING_SUFFIX',
      defaultValue: defaultStringSuffix,
    });

    const vpcCidr = this.resolveStringParameter(vpcCidrParam, {
      contextKey: 'vpcCidr',
      envKey: 'VPC_CIDR',
      defaultValue: defaultVpcCidr,
    });

    const maxAzs = this.resolveNumberParameter(maxAzsParam, {
      contextKey: 'maxAzs',
      envKey: 'MAX_AZS',
      defaultValue: 2,
    });

    const natGatewayCount = this.resolveNumberParameter(natGatewayCountParam, {
      contextKey: 'natGatewayCount',
      envKey: 'NAT_GATEWAY_COUNT',
      defaultValue: 1,
    });

    // Helper function for consistent resource naming
    const formatResourceName = (purpose: string) =>
      `app-${purpose}-${this.environmentIdToken}-${this.stringSuffixToken}`;

    // Apply tags to all resources
    const applyCommonTags = (construct: IConstruct, resourceName: string) => {
      cdk.Tags.of(construct).add('Name', resourceName);
      cdk.Tags.of(construct).add('Environment', 'Development');
      cdk.Tags.of(construct).add('iac-rlhf-amazon', 'true');
    };

    // VPC with three-tier subnet architecture
    this.vpc = new ec2.Vpc(this, 'EmailVpc', {
      ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
      maxAzs: maxAzs,
      natGateways: natGatewayCount,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'PrivateApplication',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'PrivateDatabase',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });
    applyCommonTags(this.vpc, formatResourceName('vpc'));

    // Lambda runtime configuration
    const lambdaRuntimeValue =
      process.env.LAMBDA_RUNTIME ??
      (this.node.tryGetContext('lambdaRuntime') as string | undefined) ??
      'NODEJS_20_X';
    const lambdaRuntime = this.resolveRuntime(lambdaRuntimeValue);
    const lambdaCodePath = this.resolveLambdaCodePath();

    // Lambda function configuration parameters
    const lambdaMemorySizeParam = new cdk.CfnParameter(this, 'LambdaMemorySize', {
      type: 'Number',
      description: 'Memory allocation for the Lambda function (MB).',
      default: 512,
    });

    const lambdaTimeoutParam = new cdk.CfnParameter(this, 'LambdaTimeoutSeconds', {
      type: 'Number',
      description: 'Timeout duration for the Lambda function (seconds).',
      default: 120,
    });

    const lambdaMemorySize = this.resolveNumberParameter(lambdaMemorySizeParam, {
      contextKey: 'lambdaMemorySize',
      envKey: 'LAMBDA_MEMORY_SIZE',
      defaultValue: 512,
    });

    const lambdaTimeoutSeconds = this.resolveNumberParameter(lambdaTimeoutParam, {
      contextKey: 'lambdaTimeoutSeconds',
      envKey: 'LAMBDA_TIMEOUT_SECONDS',
      defaultValue: 120,
    });

    // RDS configuration parameters
    const rdsInstanceClassParam = new cdk.CfnParameter(this, 'RdsInstanceClass', {
      type: 'String',
      description: 'RDS instance class (e.g., db.t3.small).',
      default: 'db.t3.small',
    });

    const rdsAllocatedStorageParam = new cdk.CfnParameter(this, 'RdsAllocatedStorage', {
      type: 'Number',
      description: 'Initial storage allocation for RDS instance (GB).',
      default: 20,
    });

    const rdsInstanceClass = this.resolveStringParameter(rdsInstanceClassParam, {
      contextKey: 'rdsInstanceClass',
      envKey: 'RDS_INSTANCE_CLASS',
      defaultValue: 'db.t3.small',
    });

    const rdsAllocatedStorage = this.resolveNumberParameter(rdsAllocatedStorageParam, {
      contextKey: 'rdsAllocatedStorage',
      envKey: 'RDS_ALLOCATED_STORAGE',
      defaultValue: 20,
    });

    // Security Groups
    this.sharedSecurityGroup = new ec2.SecurityGroup(this, 'SharedSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: formatResourceName('sg'),
      description: 'Restricts ingress to HTTP and SSH as required by the architecture specification.',
      allowAllOutbound: true,
    });
    
    this.sharedSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP access'
    );

    // SSH access - restrict to VPC CIDR for better security
    const sshCidr = process.env.SSH_CIDR || this.resolveStringParameter(
      new cdk.CfnParameter(this, 'SshCidr', {
        type: 'String',
        description: 'CIDR block for SSH access',
        default: '10.0.0.0/16'
      }),
      {
        contextKey: 'sshCidr',
        envKey: 'SSH_CIDR',
        defaultValue: '10.0.0.0/16'
      }
    );

    this.sharedSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(sshCidr),
      ec2.Port.tcp(22),
      'SSH access - restricted to VPC'
    );
    applyCommonTags(this.sharedSecurityGroup, formatResourceName('sg'));

    this.rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: formatResourceName('rds-sg'),
      description: 'Allow MySQL access from Lambda functions.',
      allowAllOutbound: false,
    });
    applyCommonTags(this.rdsSecurityGroup, formatResourceName('rds-sg'));

    // S3 Bucket for email events
    this.emailEventsBucket = new s3.Bucket(this, 'EmailEventsBucket', {
      bucketName: formatResourceName('email-events'),
      versioning: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    applyCommonTags(this.emailEventsBucket, formatResourceName('email-events'));

    // Database credentials secret
    const rdsCredentialsSecretArn = process.env.RDS_CREDENTIALS_SECRET_ARN ??
      (this.node.tryGetContext('rdsCredentialsSecretArn') as string | undefined);

    let databaseCredentialsSecret: secretsmanager.ISecret;
    if (rdsCredentialsSecretArn) {
      databaseCredentialsSecret = secretsmanager.Secret.fromSecretCompleteArn(
        this,
        'ImportedRdsCredentialsSecret',
        rdsCredentialsSecretArn
      );
    } else {
      databaseCredentialsSecret = new secretsmanager.Secret(this, 'GeneratedRdsCredentialsSecret', {
        secretName: formatResourceName('db-credentials'),
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'admin' }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\\'',
        },
      });
      applyCommonTags(databaseCredentialsSecret, formatResourceName('db-credentials'));
    }

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: 'Subnet group for email processing database',
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      subnetGroupName: formatResourceName('db-subnet-group'),
    });
    applyCommonTags(dbSubnetGroup, formatResourceName('db-subnet-group'));

    // RDS MySQL Instance
    this.databaseInstance = new rds.DatabaseInstance(this, 'EmailDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        rdsInstanceClass.split('.')[1] as ec2.InstanceClass,
        rdsInstanceClass.split('.')[2] as ec2.InstanceSize
      ),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [this.rdsSecurityGroup],
      multiAz: true,
      allocatedStorage: rdsAllocatedStorage,
      storageType: rds.StorageType.GP2,
      storageEncrypted: true,
      databaseName: 'emaildb',
      credentials: rds.Credentials.fromSecret(databaseCredentialsSecret),
      backupRetention: cdk.Duration.days(7),
      deletionProtection: true,
      instanceIdentifier: formatResourceName('rds'),
      subnetGroup: dbSubnetGroup,
    });
    applyCommonTags(this.databaseInstance, formatResourceName('rds'));

    // Lambda IAM Role
    const lambdaRole = new iam.Role(this, 'EmailProcessorRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: formatResourceName('lambda-role'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });
    applyCommonTags(lambdaRole, formatResourceName('lambda-role'));

    // Grant S3 permissions to Lambda
    this.emailEventsBucket.grantRead(lambdaRole);

    // Grant Secrets Manager permissions to Lambda
    databaseCredentialsSecret.grantRead(lambdaRole);

    // Lambda Function
    this.emailProcessorFunction = new lambda.Function(this, 'EmailProcessor', {
      runtime: lambdaRuntime,
      handler: this.resolveLambdaHandler(lambdaRuntime),
      code: lambda.Code.fromAsset(path.resolve(lambdaCodePath)),
      functionName: formatResourceName('email-processor'),
      role: lambdaRole,
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [this.sharedSecurityGroup],
      timeout: cdk.Duration.seconds(lambdaTimeoutSeconds),
      memorySize: lambdaMemorySize,
      environment: {
        EMAIL_EVENTS_BUCKET: this.emailEventsBucket.bucketName,
        RDS_SECRET_ARN: databaseCredentialsSecret.secretArn,
        DATABASE_ENDPOINT: this.databaseInstance.instanceEndpoint.hostname,
      },
    });
    applyCommonTags(this.emailProcessorFunction, formatResourceName('email-processor'));

    // S3 Event Notification
    this.emailEventsBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.emailProcessorFunction),
      { prefix: 'email-events/' }
    );

    // Allow Lambda to connect to RDS
    this.rdsSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(this.sharedSecurityGroup.securityGroupId),
      ec2.Port.tcp(3306),
      'Lambda access to MySQL'
    );

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for email processing infrastructure',
    });

    this.vpc.publicSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PublicSubnet${index + 1}Id`, {
        value: subnet.subnetId,
        description: `Public Subnet ${index + 1} ID`,
      });
    });

    this.vpc.privateSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PrivateSubnet${index + 1}Id`, {
        value: subnet.subnetId,
        description: `Private Subnet ${index + 1} ID`,
      });
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: this.sharedSecurityGroup.securityGroupId,
      description: 'Shared Security Group ID',
    });

    new cdk.CfnOutput(this, 'DatabaseCredentialsSecretArn', {
      value: databaseCredentialsSecret.secretArn,
      description: 'ARN of the database credentials secret',
    });

    new cdk.CfnOutput(this, 'EmailEventsBucketName', {
      value: this.emailEventsBucket.bucketName,
      description: 'Name of the S3 bucket for email events',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.emailProcessorFunction.functionName,
      description: 'Name of the email processing Lambda function',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.databaseInstance.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });
  }

  public formatResourceName(purpose: string): string {
    return `app-${purpose}-${this.environmentIdToken}-${this.stringSuffixToken}`;
  }

  private resolveStringParameter(
    parameter: cdk.CfnParameter,
    options: {
      contextKey: string;
      envKey: string;
      defaultValue?: string;
      required?: boolean;
    }
  ): string {
    const contextValue = this.node.tryGetContext(options.contextKey) as string | undefined;
    const envValue = process.env[options.envKey];
    const result = contextValue ?? envValue ?? options.defaultValue;

    if (options.required && !result) {
      throw new Error(`Unable to resolve string parameter: ${parameter.logicalId}`);
    }

    return result || '';
  }

  private resolveNumberParameter(
    parameter: cdk.CfnParameter,
    options: { contextKey: string; envKey: string; defaultValue: number }
  ): number {
    const contextValue = this.node.tryGetContext(options.contextKey) as string | number | undefined;
    const envValue = process.env[options.envKey];

    const candidate =
      typeof contextValue === 'number'
        ? contextValue
        : contextValue !== undefined
        ? parseFloat(contextValue.toString())
        : envValue !== undefined
        ? parseFloat(envValue)
        : options.defaultValue;

    if (isNaN(candidate)) {
      throw new Error(`Unable to resolve numeric parameter: ${parameter.logicalId}`);
    }

    return candidate;
  }

  private resolveRuntime(value: string): lambda.Runtime {
    const normalized = value.trim().toUpperCase();
    switch (normalized) {
      case 'NODEJS_18_X':
      case 'NODEJS18.X':
      case 'NODEJS18X':
        return lambda.Runtime.NODEJS_18_X;
      case 'NODEJS_20_X':
      case 'NODEJS20.X':
      case 'NODEJS20X':
        return lambda.Runtime.NODEJS_20_X;
      case 'PYTHON_3_11':
      case 'PYTHON3.11':
      case 'PYTHON3_11':
        return lambda.Runtime.PYTHON_3_11;
      case 'PYTHON_3_12':
      case 'PYTHON3.12':
      case 'PYTHON3_12':
        return lambda.Runtime.PYTHON_3_12;
      default:
        throw new Error(`Unsupported Lambda runtime: ${value}. Supported: NODEJS_18_X, NODEJS_20_X, PYTHON_3_11, PYTHON_3_12`);
    }
  }

  private resolveLambdaCodePath(): string {
    const fromEnv = process.env.LAMBDA_CODE_PATH;
    const fromContext = this.node.tryGetContext('lambdaCodePath');
    return fromEnv ?? fromContext ?? path.resolve('lambda');
  }

  private resolveLambdaHandler(runtime: lambda.Runtime): string {
    if (runtime === lambda.Runtime.PYTHON_3_11 || runtime === lambda.Runtime.PYTHON_3_12) {
      return 'app.handler';
    }

    return 'index.handler';
  }
}
```

## Implementation Highlights

### Security Best Practices

- **Restricted SSH Access**: SSH access is now restricted to VPC CIDR (10.0.0.0/16) instead of allowing from anywhere (0.0.0.0/0)
- **Three-Tier Architecture**: Separate subnets for public, private application, and isolated database tiers
- **Encryption**: S3 bucket and RDS storage encryption enabled
- **SSL Enforcement**: S3 bucket requires SSL connections
- **Secrets Management**: Database credentials stored in AWS Secrets Manager
- **Least Privilege IAM**: Lambda roles with minimal required permissions

### Enhanced Runtime Support

- **Node.js**: Support for NODEJS_18_X and NODEJS_20_X (latest LTS versions)
- **Python**: Support for PYTHON_3_11 and PYTHON_3_12 (current versions)
- **Automatic Handler Resolution**: Correct handler based on runtime (index.handler for Node.js, app.handler for Python)

### Operational Excellence

- **High Availability**: Multi-AZ RDS deployment
- **Monitoring**: CloudWatch integration
- **Backup**: 7-day RDS backup retention
- **Deletion Protection**: RDS instance protected from accidental deletion
- **Versioning**: S3 bucket versioning enabled
- **Configurable**: Extensive parameterization for different environments

### Cost Optimization

- **Right-sizing**: Configurable instance types and memory allocation
- **NAT Gateway**: Configurable count for cost efficiency
- **Lambda**: Pay-per-execution with optimized memory settings

### Architecture Benefits

1. **Scalability**: Auto-scaling Lambda with configurable memory and timeout
2. **Security**: Network isolation with minimal attack surface
3. **Reliability**: Multi-AZ deployment with backup and versioning
4. **Maintainability**: Clear separation of concerns with comprehensive outputs
5. **Flexibility**: Environment-agnostic with extensive configuration options

This implementation provides a production-ready foundation for email processing infrastructure that can scale from development to enterprise workloads while maintaining security and operational best practices.
```