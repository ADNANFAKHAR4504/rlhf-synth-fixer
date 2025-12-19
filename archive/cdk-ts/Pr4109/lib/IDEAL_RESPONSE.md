
## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as config from 'aws-cdk-lib/aws-config';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { DatabaseConstruct } from './constructs/database';
import { NetworkingConstruct } from './constructs/networking';
import { SecurityConstruct } from './constructs/security';

export interface TapStackProps extends cdk.StackProps {
  allowedSshIpRange: string;
  environment: 'dev' | 'staging' | 'prod';
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Create KMS key for encryption
    const kmsKey = new kms.Key(this, 'TapKmsKey', {
      description: 'KMS key for TAP infrastructure encryption',
      enableKeyRotation: true,
      alias: `alias/tap-${props.environment}-key`,
    });

    // Grant CloudWatch Logs permission to use the KMS key
    kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Allow CloudWatch Logs to use the key',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`),
        ],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:CreateGrant',
          'kms:DescribeKey',
        ],
        resources: ['*'],
        conditions: {
          ArnLike: {
            'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:log-group:*`,
          },
        },
      })
    );

    // Apply tags to all resources
    cdk.Tags.of(this).add('Environment', props.environment);
    cdk.Tags.of(this).add('Project', 'TAP');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('CostCenter', 'Infrastructure');

    // Create VPC with public/private subnets across multiple AZs
    const networking = new NetworkingConstruct(this, 'Networking', {
      environment: props.environment,
    });

    // Create security groups and ACM certificate
    const security = new SecurityConstruct(this, 'Security', {
      vpc: networking.vpc,
      allowedSshIpRange: props.allowedSshIpRange,
      environment: props.environment,
    });

    // Create encrypted S3 bucket
    const dataBucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: `tap-${props.environment}-data-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create IAM role for Lambda with least privilege
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for TAP Lambda functions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    // Grant specific permissions to Lambda role
    dataBucket.grantRead(lambdaRole);
    kmsKey.grantDecrypt(lambdaRole);

    // Create CloudWatch log group for Lambda
    const logGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/tap-${props.environment}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create encrypted RDS database
    const database = new DatabaseConstruct(this, 'Database', {
      vpc: networking.vpc,
      securityGroup: security.databaseSecurityGroup,
      kmsKey: kmsKey,
      environment: props.environment,
    });

    // Grant Lambda access to database secret
    database.cluster.secret!.grantRead(lambdaRole);

    // Create Lambda function with CloudWatch logs enabled
    const exampleFunction = new lambda.Function(this, 'ExampleFunction', {
      functionName: `tap-${props.environment}-example`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Event received:', JSON.stringify(event));
          console.log('Database endpoint:', process.env.DB_ENDPOINT);
          console.log('Database name:', process.env.DB_NAME);
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Success' })
          };
        };
      `),
      role: lambdaRole,
      vpc: networking.vpc,
      vpcSubnets: {
        subnets: networking.privateSubnets,
      },
      securityGroups: [security.lambdaSecurityGroup],
      environment: {
        BUCKET_NAME: dataBucket.bucketName,
        ENVIRONMENT: props.environment,
        DB_ENDPOINT: database.cluster.clusterEndpoint.hostname,
        DB_PORT: database.cluster.clusterEndpoint.port.toString(),
        DB_NAME: `tap_${props.environment}`,
        DB_SECRET_ARN: database.cluster.secret!.secretArn,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: logGroup,
      tracing: lambda.Tracing.ACTIVE,
    });

    // Create S3 bucket for AWS Config
    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      bucketName: `tap-config-${this.stackName.toLowerCase()}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // IAM role for AWS Config
    const configRole = new iam.Role(this, 'ConfigRole', {
      roleName: `tap-config-role-${this.stackName}`,
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWS_ConfigRole'
        ),
      ],
    });

    // Grant Config service access to the S3 bucket and KMS key
    configBucket.grantReadWrite(configRole);
    kmsKey.grantEncryptDecrypt(configRole);

    // AWS Config Configuration Recorder
    const configRecorder = new config.CfnConfigurationRecorder(
      this,
      'ConfigRecorder',
      {
        name: `tap-config-recorder-${this.stackName}`,
        roleArn: configRole.roleArn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      }
    );

    // AWS Config Delivery Channel
    const configDeliveryChannel = new config.CfnDeliveryChannel(
      this,
      'ConfigDeliveryChannel',
      {
        name: `tap-config-delivery-${this.stackName}`,
        s3BucketName: configBucket.bucketName,
        s3KmsKeyArn: kmsKey.keyArn,
      }
    );

    // Create SNS topic for compliance alerts
    const complianceTopic = new sns.Topic(this, 'ComplianceTopic', {
      topicName: `tap-compliance-alerts-${this.stackName}`,
      masterKey: kmsKey,
    });

    // Configure AWS Config rules
    this.setupAwsConfigRules(
      complianceTopic,
      configRecorder,
      configDeliveryChannel
    );

    // Output important values
    new cdk.CfnOutput(this, 'VpcId', {
      value: networking.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: dataBucket.bucketName,
      description: 'Data bucket name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.cluster.clusterEndpoint.hostname,
      description: 'Database endpoint',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: exampleFunction.functionArn,
      description: 'Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: exampleFunction.functionName,
      description: 'Lambda function name',
    });

    new cdk.CfnOutput(this, 'ConfigBucketName', {
      value: configBucket.bucketName,
      description: 'AWS Config bucket name',
    });
  }

  private setupAwsConfigRules(
    complianceTopic: sns.Topic,
    configRecorder: config.CfnConfigurationRecorder,
    configDeliveryChannel: config.CfnDeliveryChannel
  ): void {
    // S3 bucket encryption rule
    const s3EncryptionRule = new config.ManagedRule(
      this,
      'S3BucketEncryptionRule',
      {
        configRuleName: `s3-encryption-${this.stackName}`,
        identifier:
          config.ManagedRuleIdentifiers
            .S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
        description:
          'Checks that S3 buckets have server-side encryption enabled',
      }
    );
    const s3EncryptionCfnRule = s3EncryptionRule.node
      .defaultChild as config.CfnConfigRule;
    s3EncryptionCfnRule.addDependency(configRecorder);
    s3EncryptionCfnRule.addDependency(configDeliveryChannel);

    // RDS encryption rule
    const rdsEncryptionRule = new config.ManagedRule(
      this,
      'RDSEncryptionRule',
      {
        configRuleName: `rds-encryption-${this.stackName}`,
        identifier: config.ManagedRuleIdentifiers.RDS_STORAGE_ENCRYPTED,
        description:
          'Checks that RDS instances have encryption at rest enabled',
      }
    );
    const rdsEncryptionCfnRule = rdsEncryptionRule.node
      .defaultChild as config.CfnConfigRule;
    rdsEncryptionCfnRule.addDependency(configRecorder);
    rdsEncryptionCfnRule.addDependency(configDeliveryChannel);

    // Security group SSH rule
    const sshRule = new config.CfnConfigRule(this, 'RestrictedSSHRule', {
      configRuleName: `restricted-ssh-${this.stackName}`,
      source: {
        owner: 'AWS',
        sourceIdentifier: 'INCOMING_SSH_DISABLED',
      },
      description:
        'Checks that security groups do not allow unrestricted SSH access',
    });
    sshRule.addDependency(configRecorder);
    sshRule.addDependency(configDeliveryChannel);

    // Lambda VPC rule
    const lambdaVpcRule = new config.ManagedRule(this, 'LambdaVPCRule', {
      configRuleName: `lambda-vpc-${this.stackName}`,
      identifier: config.ManagedRuleIdentifiers.LAMBDA_INSIDE_VPC,
      description: 'Checks that Lambda functions are deployed inside VPC',
    });
    const lambdaVpcCfnRule = lambdaVpcRule.node
      .defaultChild as config.CfnConfigRule;
    lambdaVpcCfnRule.addDependency(configRecorder);
    lambdaVpcCfnRule.addDependency(configDeliveryChannel);

    // CloudWatch alarm for non-compliant resources
    const nonCompliantMetric = new cloudwatch.Metric({
      namespace: 'AWS/Config',
      metricName: 'ComplianceByConfigRule',
      dimensionsMap: {
        ComplianceType: 'NON_COMPLIANT',
      },
      statistic: 'Sum',
    });

    new cloudwatch.Alarm(this, 'NonComplianceAlarm', {
      alarmName: `tap-non-compliance-${this.stackName}`,
      metric: nonCompliantMetric,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription:
        'Alert when resources are non-compliant with Config rules',
    }).addAlarmAction(new cloudwatchActions.SnsAction(complianceTopic));
  }
}
```

## lib/constructs/networking.ts

```typescript
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkingConstructProps {
  environment: string;
}

export class NetworkingConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly privateSubnets: ec2.ISubnet[];
  public readonly publicSubnets: ec2.ISubnet[];

  constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
    super(scope, id);

    // Create VPC with public and private subnets across multiple AZs
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `tap-${props.environment}-vpc`,
      maxAzs: 3,
      natGateways: 2,
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
        {
          cidrMask: 24,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Enable VPC Flow Logs
    this.vpc.addFlowLog('VpcFlowLog', {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    this.privateSubnets = this.vpc.privateSubnets;
    this.publicSubnets = this.vpc.publicSubnets;

    // Add VPC endpoints for AWS services
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    this.vpc.addGatewayEndpoint('DynamoDbEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    this.vpc.addInterfaceEndpoint('LambdaEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.LAMBDA,
      subnets: {
        subnets: this.privateSubnets,
      },
    });
  }
}
```

## lib/constructs/security.ts

```typescript
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface SecurityConstructProps {
  vpc: ec2.Vpc;
  allowedSshIpRange: string;
  environment: string;
}

export class SecurityConstruct extends Construct {
  public readonly bastionSecurityGroup: ec2.SecurityGroup;
  public readonly webSecurityGroup: ec2.SecurityGroup;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;
  public readonly certificate?: acm.Certificate;

  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    // Bastion host security group with restricted SSH access
    this.bastionSecurityGroup = new ec2.SecurityGroup(
      this,
      'BastionSecurityGroup',
      {
        vpc: props.vpc,
        description: 'Security group for bastion hosts',
        allowAllOutbound: false,
      }
    );

    this.bastionSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.allowedSshIpRange),
      ec2.Port.tcp(22),
      'Allow SSH from specified IP range only'
    );

    this.bastionSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for updates'
    );

    // Web server security group
    this.webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for web servers',
    });

    this.webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from anywhere'
    );

    // Lambda security group
    this.lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc: props.vpc,
        description: 'Security group for Lambda functions',
      }
    );

    // Database security group
    this.databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc: props.vpc,
        description: 'Security group for RDS databases',
        allowAllOutbound: false,
      }
    );

    this.databaseSecurityGroup.addIngressRule(
      this.lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda functions to connect to database'
    );

    this.databaseSecurityGroup.addIngressRule(
      this.bastionSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow bastion host to connect to database'
    );
  }
}
```

## lib/constructs/database.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DatabaseConstructProps {
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
  kmsKey: kms.Key;
  environment: string;
}

export class DatabaseConstruct extends Construct {
  public readonly cluster: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    // Create secret for database credentials
    const databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `tap-${props.environment}-db-credentials`,
      description: 'RDS database master credentials',
      encryptionKey: props.kmsKey,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
    });

    // Create Aurora PostgreSQL cluster with encryption
    this.cluster = new rds.DatabaseCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_14_6,
      }),
      credentials: rds.Credentials.fromSecret(databaseSecret),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [props.securityGroup],
      writer: rds.ClusterInstance.provisioned('WriterInstance', {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T4G,
          ec2.InstanceSize.MEDIUM
        ),
      }),
      readers: [
        rds.ClusterInstance.provisioned('ReaderInstance', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T4G,
            ec2.InstanceSize.MEDIUM
          ),
        }),
      ],
      storageEncrypted: true,
      storageEncryptionKey: props.kmsKey,
      backup: {
        retention: cdk.Duration.days(30),
        preferredWindow: '03:00-04:00',
      },
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: props.environment === 'prod',
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.ONE_MONTH,
      defaultDatabaseName: `tap_${props.environment}`,
    });

    new rds.CfnDBClusterParameterGroup(this, 'ClusterParameterGroup', {
      family: 'aurora-postgresql14',
      description: 'Custom parameter group for TAP database',
      parameters: {
        log_statement: 'all',
        log_min_duration_statement: '100',
        shared_preload_libraries: 'pg_stat_statements',
      },
    });
  }
}
```
