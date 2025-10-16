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

    const environmentIdParam = new cdk.CfnParameter(this, 'EnvironmentId', {
      type: 'String',
      description:
        'Lowercase identifier for the deployment environment (used in resource names).',
      default: environmentIdDefault,
    });

    const stringSuffixParam = new cdk.CfnParameter(this, 'StringSuffix', {
      type: 'String',
      description:
        'Unique suffix appended to resource names to prevent collisions.',
      default: defaultStringSuffix,
    });

    const vpcCidrParam = new cdk.CfnParameter(this, 'VpcCidr', {
      type: 'String',
      description: 'CIDR block for the workload VPC.',
      default: defaultVpcCidr,
    });

    const defaultMaxAzs = 2;
    const maxAzsParam = new cdk.CfnParameter(this, 'MaxAzs', {
      type: 'Number',
      description: 'Number of availability zones to span.',
      default: defaultMaxAzs,
      minValue: 2,
      maxValue: 3,
    });

    const defaultNatGatewayCount = 1;
    const natGatewayCountParam = new cdk.CfnParameter(this, 'NatGatewayCount', {
      type: 'Number',
      description: 'Number of NAT gateways to provision for the VPC.',
      default: defaultNatGatewayCount,
      minValue: 1,
      maxValue: 2,
    });

    const defaultLambdaMemory = 512;
    const lambdaMemoryParam = new cdk.CfnParameter(this, 'LambdaMemorySize', {
      type: 'Number',
      description: 'Memory size for the Lambda function (MB).',
      default: defaultLambdaMemory,
      minValue: 128,
      maxValue: 10240,
    });

    const defaultLambdaTimeout = 60;
    const lambdaTimeoutParam = new cdk.CfnParameter(
      this,
      'LambdaTimeoutSeconds',
      {
        type: 'Number',
        description: 'Timeout for the Lambda function in seconds.',
        default: defaultLambdaTimeout,
        minValue: 10,
        maxValue: 900,
      }
    );

    const rdsInstanceTypeParam = new cdk.CfnParameter(this, 'RdsInstanceType', {
      type: 'String',
      description: 'Instance type for the RDS MySQL instance, e.g., t3.medium.',
      default: 't3.medium',
    });

    const rdsAllocatedStorageParam = new cdk.CfnParameter(
      this,
      'RdsAllocatedStorageGb',
      {
        type: 'Number',
        description: 'Allocated storage for the RDS instance in GiB.',
        default: 100,
        minValue: 20,
        maxValue: 16384,
      }
    );

    const rdsBackupRetentionParam = new cdk.CfnParameter(
      this,
      'RdsBackupRetentionDays',
      {
        type: 'Number',
        description: 'Number of days to retain automated RDS backups.',
        default: 7,
        minValue: 1,
        maxValue: 35,
      }
    );

    const rdsDatabaseNameParam = new cdk.CfnParameter(this, 'RdsDatabaseName', {
      type: 'String',
      description: 'Database name for the MySQL instance.',
      default: 'emailservice',
    });

    const defaultDbUsername = 'notificationadmin';
    const rdsMasterUsernameParam = new cdk.CfnParameter(
      this,
      'RdsMasterUsername',
      {
        type: 'String',
        description:
          'Username stored in the generated Secrets Manager secret when no external credentials ARN is supplied.',
        default: defaultDbUsername,
        minLength: 4,
        maxLength: 30,
      }
    );

    const rdsCredentialsSecretArnParam = new cdk.CfnParameter(
      this,
      'RdsCredentialsSecretArn',
      {
        type: 'String',
        description:
          'ARN of an AWS Secrets Manager secret containing the username and password for the RDS instance. The secret must include the keys username and password.',
        default: '',
      }
    );

    const emailEventPrefixParam = new cdk.CfnParameter(
      this,
      'EmailEventPrefix',
      {
        type: 'String',
        description:
          'Optional S3 object prefix that identifies email event payloads the Lambda should process.',
        default: 'email-events/',
      }
    );

    let environmentIdValue = environmentIdParam.valueAsString;
    if (cdk.Token.isUnresolved(environmentIdValue)) {
      environmentIdValue =
        (this.node.tryGetContext('environmentId') as string | undefined) ??
        process.env.ENVIRONMENT_ID ??
        environmentIdDefault;
    }

    let stringSuffixValue = stringSuffixParam.valueAsString;
    if (cdk.Token.isUnresolved(stringSuffixValue)) {
      stringSuffixValue =
        (this.node.tryGetContext('stringSuffix') as string | undefined) ??
        process.env.STRING_SUFFIX ??
        defaultStringSuffix;
    }

    this.environmentIdToken = environmentIdValue;
    this.stringSuffixToken = stringSuffixValue;

    const dbMasterUsername = this.resolveStringParameter(
      rdsMasterUsernameParam,
      {
        contextKey: 'rdsMasterUsername',
        envKey: 'RDS_MASTER_USERNAME',
        defaultValue: defaultDbUsername,
      }
    );

    const formatResourceName = (purpose: string, lowercase = false): string =>
      this.formatResourceName(purpose, lowercase);

    const applyCommonTags = (resource: IConstruct, name?: string): void => {
      if (name) {
        cdk.Tags.of(resource).add('Name', name);
      }
      cdk.Tags.of(resource).add('Environment', 'Development');
      cdk.Tags.of(resource).add('iac-rlhf-amazon', 'true');
    };

    const lambdaRuntimeValue =
      process.env.LAMBDA_RUNTIME ??
      (this.node.tryGetContext('lambdaRuntime') as string | undefined) ??
      'NODEJS_20_X';
    const lambdaRuntime = this.resolveRuntime(lambdaRuntimeValue);
    const lambdaCodePath = this.resolveLambdaCodePath();

    const maxAzsValue = this.resolveNumberParameter(maxAzsParam, {
      contextKey: 'maxAzs',
      envKey: 'MAX_AZS',
      defaultValue: defaultMaxAzs,
    });

    const natGatewayCountValue = this.resolveNumberParameter(
      natGatewayCountParam,
      {
        contextKey: 'natGatewayCount',
        envKey: 'NAT_GATEWAY_COUNT',
        defaultValue: defaultNatGatewayCount,
      }
    );

    const lambdaMemoryValue = this.resolveNumberParameter(lambdaMemoryParam, {
      contextKey: 'lambdaMemorySize',
      envKey: 'LAMBDA_MEMORY_SIZE',
      defaultValue: defaultLambdaMemory,
    });

    const lambdaTimeoutValue = this.resolveNumberParameter(lambdaTimeoutParam, {
      contextKey: 'lambdaTimeoutSeconds',
      envKey: 'LAMBDA_TIMEOUT_SECONDS',
      defaultValue: defaultLambdaTimeout,
    });

    const vpcCidrValue = this.resolveStringParameter(vpcCidrParam, {
      contextKey: 'vpcCidr',
      envKey: 'VPC_CIDR',
      defaultValue: defaultVpcCidr,
    });

    this.vpc = new ec2.Vpc(this, 'NotificationVpc', {
      ipAddresses: ec2.IpAddresses.cidr(vpcCidrValue),
      maxAzs: maxAzsValue,
      natGatewayProvider: ec2.NatProvider.gateway(),
      natGateways: natGatewayCountValue,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-app',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'private-db',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    applyCommonTags(this.vpc, formatResourceName('vpc'));

    this.vpc.publicSubnets.forEach((subnet, index) => {
      applyCommonTags(
        subnet,
        formatResourceName(`public-subnet-${String.fromCharCode(97 + index)}`)
      );
    });

    this.vpc.privateSubnets.forEach((subnet, index) => {
      applyCommonTags(
        subnet,
        formatResourceName(`private-subnet-${String.fromCharCode(97 + index)}`)
      );
    });

    this.vpc.isolatedSubnets.forEach((subnet, index) => {
      applyCommonTags(
        subnet,
        formatResourceName(`database-subnet-${String.fromCharCode(97 + index)}`)
      );
    });

    this.vpc.node
      .findAll()
      .filter(
        (child): child is ec2.CfnNatGateway =>
          child instanceof ec2.CfnNatGateway
      )
      .forEach((natGateway, index) => {
        applyCommonTags(
          natGateway,
          formatResourceName(`nat-gateway-${index + 1}`)
        );
      });

    this.sharedSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: formatResourceName('app-sg'),
      description:
        'Application security group - restricts ingress to HTTP and SSH only.',
      allowAllOutbound: true,
    });
    this.sharedSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP access'
    );

    // SSH access - restrict to VPC CIDR for better security
    const sshCidr =
      process.env.SSH_CIDR ||
      this.resolveStringParameter(
        new cdk.CfnParameter(this, 'SshCidr', {
          type: 'String',
          description: 'CIDR block for SSH access',
          default: '10.0.0.0/16',
        }),
        {
          contextKey: 'sshCidr',
          envKey: 'SSH_CIDR',
          defaultValue: '10.0.0.0/16',
        }
      );

    this.sharedSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(sshCidr),
      ec2.Port.tcp(22),
      'SSH access - restricted to VPC'
    );
    applyCommonTags(this.sharedSecurityGroup, formatResourceName('app-sg'));

    this.rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: formatResourceName('rds-sg'),
      description:
        'Controls database connectivity for the email notification service.',
      allowAllOutbound: false,
    });
    applyCommonTags(this.rdsSecurityGroup, formatResourceName('rds-sg'));

    this.rdsSecurityGroup.addIngressRule(
      this.sharedSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow database traffic from application security group'
    );

    this.emailEventsBucket = new s3.Bucket(this, 'EmailEventsBucket', {
      bucketName:
        `app-email-events-${this.stringSuffixToken}-${Date.now().toString().slice(-6)}`.toLowerCase(),
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
    });
    applyCommonTags(
      this.emailEventsBucket,
      formatResourceName('email-events', true)
    );

    const lambdaRole = new iam.Role(this, 'EmailProcessorRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: formatResourceName('lambda-role'),
      description: 'IAM role for the email event processor Lambda function.',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });
    applyCommonTags(lambdaRole, formatResourceName('lambda-role'));

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [
          `arn:${cdk.Aws.PARTITION}:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/lambda/${formatResourceName(
            'email-processor'
          )}:*`,
        ],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ec2:DescribeNetworkInterfaces',
          'ec2:DescribeSecurityGroups',
          'ec2:DescribeSubnets',
          'ec2:DescribeVpcs',
        ],
        resources: ['*'], // Required for describe actions
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ec2:CreateNetworkInterface', 'ec2:DeleteNetworkInterface'],
        resources: [
          `arn:${cdk.Aws.PARTITION}:ec2:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:subnet/*`,
          `arn:${cdk.Aws.PARTITION}:ec2:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:security-group/*`,
          `arn:${cdk.Aws.PARTITION}:ec2:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:network-interface/*`,
        ],
      })
    );

    const rdsCredentialsSecretArn = this.resolveOptionalStringParameter(
      rdsCredentialsSecretArnParam,
      {
        contextKey: 'rdsCredentialsSecretArn',
        envKey: 'RDS_CREDENTIALS_SECRET_ARN',
      }
    );

    const rdsCredentialsSecret =
      rdsCredentialsSecretArn !== undefined && rdsCredentialsSecretArn !== ''
        ? secretsmanager.Secret.fromSecretCompleteArn(
            this,
            'ImportedRdsCredentialsSecret',
            rdsCredentialsSecretArn
          )
        : this.createManagedDatabaseSecret(
            formatResourceName('db-credentials', true),
            dbMasterUsername
          );
    if (rdsCredentialsSecret instanceof secretsmanager.Secret) {
      applyCommonTags(
        rdsCredentialsSecret,
        formatResourceName('db-credentials', true)
      );
    }

    const lambdaSecurityGroup = this.sharedSecurityGroup;

    this.emailProcessorFunction = new lambda.Function(
      this,
      'EmailProcessorFunction',
      {
        runtime: lambdaRuntime,
        code: lambda.Code.fromAsset(path.resolve(lambdaCodePath)),
        handler: this.selectLambdaHandler(lambdaRuntime),
        memorySize: lambdaMemoryValue,
        timeout: cdk.Duration.seconds(lambdaTimeoutValue),
        role: lambdaRole,
        functionName: formatResourceName('email-processor'),
        description:
          'Processes stored email delivery events from S3, normalizes metadata, and writes tracking data into the RDS backend.',
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [lambdaSecurityGroup],
        environment: {
          EMAIL_EVENTS_BUCKET: this.emailEventsBucket.bucketName,
          EMAIL_EVENT_PREFIX: emailEventPrefixParam.valueAsString,
          RDS_SECRET_ARN: rdsCredentialsSecret.secretArn,
          RDS_DATABASE_NAME: rdsDatabaseNameParam.valueAsString,
        },
      }
    );
    applyCommonTags(this.emailProcessorFunction, formatResourceName('lambda'));

    this.emailEventsBucket.grantRead(this.emailProcessorFunction);
    rdsCredentialsSecret.grantRead(this.emailProcessorFunction);

    this.emailEventsBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.emailProcessorFunction),
      { prefix: emailEventPrefixParam.valueAsString }
    );

    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      'NotificationDbSubnetGroup',
      {
        description:
          'Subnet group for the email notification relational store.',
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        subnetGroupName: `app-db-subnet-group-${this.stringSuffixToken}-${Date.now().toString().slice(-6)}`,
      }
    );
    applyCommonTags(dbSubnetGroup, formatResourceName('db-subnet-group'));

    this.databaseInstance = new rds.DatabaseInstance(
      this,
      'EmailNotificationDatabase',
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        instanceType: new ec2.InstanceType(rdsInstanceTypeParam.valueAsString),
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        multiAz: true,
        allocatedStorage: rdsAllocatedStorageParam.valueAsNumber,
        databaseName: rdsDatabaseNameParam.valueAsString,
        credentials: rds.Credentials.fromSecret(rdsCredentialsSecret),
        securityGroups: [this.rdsSecurityGroup],
        backupRetention: cdk.Duration.days(
          rdsBackupRetentionParam.valueAsNumber
        ),
        cloudwatchLogsExports: ['error', 'slowquery'],
        removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
        deletionProtection: false,
        subnetGroup: dbSubnetGroup,
        storageEncrypted: true,
        publiclyAccessible: false,
        preferredMaintenanceWindow: 'Sun:01:00-Sun:03:00',
      }
    );
    applyCommonTags(this.databaseInstance, formatResourceName('rds-instance'));

    this.emailProcessorFunction.connections.allowTo(
      this.databaseInstance,
      ec2.Port.tcp(3306),
      'Lambda to RDS connectivity'
    );

    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      exportName: formatResourceName('vpc-id'),
      description: 'Identifier for the provisioned VPC.',
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: this.sharedSecurityGroup.securityGroupId,
      exportName: formatResourceName('sg-id'),
      description: 'Security group that restricts ingress to HTTP and SSH.',
    });

    this.vpc.publicSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PublicSubnet${index + 1}Id`, {
        value: subnet.subnetId,
        exportName: formatResourceName(`public-subnet-${index + 1}-id`),
        description: `Public subnet ${index + 1} ID.`,
      });
    });

    this.vpc.privateSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PrivateSubnet${index + 1}Id`, {
        value: subnet.subnetId,
        exportName: formatResourceName(`private-subnet-${index + 1}-id`),
        description: `Private subnet ${index + 1} ID.`,
      });
    });

    new cdk.CfnOutput(this, 'EmailEventsBucketName', {
      value: this.emailEventsBucket.bucketName,
      exportName: formatResourceName('email-events-bucket-name'),
      description: 'S3 bucket that stores email delivery event payloads.',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.emailProcessorFunction.functionName,
      exportName: formatResourceName('lambda-name'),
      description:
        'Name of the Lambda function that processes email delivery events.',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.databaseInstance.instanceEndpoint.hostname,
      exportName: formatResourceName('rds-endpoint'),
      description: 'Endpoint for the RDS MySQL instance.',
    });

    new cdk.CfnOutput(this, 'DatabaseCredentialsSecretArn', {
      value: rdsCredentialsSecret.secretArn,
      exportName: formatResourceName('db-credentials-secret-arn'),
      description: 'Secrets Manager ARN containing the database credentials.',
    });
  }

  private createManagedDatabaseSecret(
    secretName: string,
    username: string
  ): secretsmanager.Secret {
    return new secretsmanager.Secret(this, 'GeneratedRdsCredentialsSecret', {
      secretName,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username }),
        generateStringKey: 'password',
        excludeCharacters: '"@\\/`',
        passwordLength: 24,
      },
    });
  }

  public formatResourceName(purpose: string, lowercase = false): string {
    const suffix = `${this.environmentIdToken}-${this.stringSuffixToken}`;
    const composed = `app-${purpose}-${suffix}`;
    return lowercase ? composed.toLowerCase() : composed;
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
        throw new Error(
          `Unsupported Lambda runtime: ${value}. Supported: NODEJS_18_X, NODEJS_20_X, PYTHON_3_11, PYTHON_3_12`
        );
    }
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
    const paramValue = parameter.valueAsString;
    if (!cdk.Token.isUnresolved(paramValue) && paramValue !== '') {
      return paramValue;
    }

    const contextValue = this.node.tryGetContext(options.contextKey) as
      | string
      | undefined;
    const envValue = process.env[options.envKey];
    const candidate = contextValue ?? envValue ?? options.defaultValue;

    if (candidate === undefined || candidate === '') {
      if (options.required) {
        throw new Error(
          `Unable to resolve string parameter for ${parameter.logicalId}. Provide a value via context key "${options.contextKey}" or environment variable "${options.envKey}".`
        );
      }
      return '';
    }

    return candidate;
  }

  private resolveOptionalStringParameter(
    parameter: cdk.CfnParameter,
    options: { contextKey: string; envKey: string }
  ): string | undefined {
    const paramValue = parameter.valueAsString;
    if (!cdk.Token.isUnresolved(paramValue) && paramValue !== '') {
      return paramValue;
    }

    const contextValue = this.node.tryGetContext(options.contextKey) as
      | string
      | undefined;
    if (contextValue && contextValue !== '') {
      return contextValue;
    }

    const envValue = process.env[options.envKey];
    if (envValue && envValue !== '') {
      return envValue;
    }

    return undefined;
  }

  private resolveNumberParameter(
    parameter: cdk.CfnParameter,
    options: { contextKey: string; envKey: string; defaultValue: number }
  ): number {
    const paramValue = parameter.valueAsNumber as unknown as number;
    if (!cdk.Token.isUnresolved(paramValue)) {
      return paramValue;
    }

    const contextValue = this.node.tryGetContext(options.contextKey) as
      | string
      | number
      | undefined;
    const envValue = process.env[options.envKey];

    const candidate =
      typeof contextValue === 'number'
        ? contextValue
        : contextValue !== undefined
          ? Number(contextValue)
          : envValue !== undefined
            ? Number(envValue)
            : options.defaultValue;

    if (!Number.isFinite(candidate)) {
      throw new Error(
        `Unable to resolve numeric parameter for ${parameter.logicalId}. Provide a valid number via context key "${options.contextKey}", environment variable "${options.envKey}", or adjust the default.`
      );
    }

    return candidate;
  }

  private resolveLambdaCodePath(): string {
    const fromEnv = process.env.LAMBDA_CODE_PATH;
    const fromContext = this.node.tryGetContext('lambdaCodePath');

    const selected = fromEnv ?? fromContext ?? 'lambda';

    return selected.startsWith('.') ? path.resolve(selected) : selected;
  }

  private selectLambdaHandler(runtime: lambda.Runtime): string {
    if (
      runtime === lambda.Runtime.PYTHON_3_11 ||
      runtime === lambda.Runtime.PYTHON_3_12
    ) {
      return 'app.handler';
    }

    return 'index.handler';
  }
}
