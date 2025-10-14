### `lib/tap-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as config from 'aws-cdk-lib/aws-config';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { NetworkingConstruct } from './constructs/networking';
import { SecurityConstruct } from './constructs/security';
import { DatabaseConstruct } from './constructs/database';

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
      lifecycleRules: [{
        id: 'delete-old-versions',
        noncurrentVersionExpiration: cdk.Duration.days(90),
        abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
      }],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create IAM role for Lambda with least privilege
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for TAP Lambda functions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });

    // Grant specific permissions to Lambda role
    dataBucket.grantRead(lambdaRole);
    kmsKey.grantDecrypt(lambdaRole);

    // Create CloudWatch log group for Lambda
    const logGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/tap-${props.environment}`,
      retention: logs.RetentionDays.THIRTY_DAYS,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Lambda function with CloudWatch logs enabled
    const exampleFunction = new lambda.Function(this, 'ExampleFunction', {
      functionName: `tap-${props.environment}-example`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Event received:', JSON.stringify(event));
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
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: logGroup,
      tracing: lambda.Tracing.ACTIVE,
    });

    // Create encrypted RDS database
    const database = new DatabaseConstruct(this, 'Database', {
      vpc: networking.vpc,
      securityGroup: security.databaseSecurityGroup,
      kmsKey: kmsKey,
      environment: props.environment,
    });

    // Create SNS topic for compliance alerts
    const complianceTopic = new sns.Topic(this, 'ComplianceTopic', {
      topicName: `tap-${props.environment}-compliance-alerts`,
      masterKey: kmsKey,
    });

    // Configure AWS Config rules
    this.setupAwsConfigRules(complianceTopic);

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
  }

  private setupAwsConfigRules(complianceTopic: sns.Topic): void {
    // S3 bucket encryption rule
    new config.ManagedRule(this, 'S3BucketEncryptionRule', {
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
      description: 'Checks that S3 buckets have server-side encryption enabled',
    });

    // RDS encryption rule
    new config.ManagedRule(this, 'RDSEncryptionRule', {
      identifier: config.ManagedRuleIdentifiers.RDS_STORAGE_ENCRYPTED,
      description: 'Checks that RDS instances have encryption at rest enabled',
    });

    // Security group SSH rule
    new config.ManagedRule(this, 'RestrictedSSHRule', {
      identifier: config.ManagedRuleIdentifiers.INCOMING_SSH_DISABLED,
      description: 'Checks that security groups do not allow unrestricted SSH access',
    });

    // Lambda VPC rule
    new config.ManagedRule(this, 'LambdaVPCRule', {
      identifier: config.ManagedRuleIdentifiers.LAMBDA_INSIDE_VPC,
      description: 'Checks that Lambda functions are deployed inside VPC',
    });

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
      metric: nonCompliantMetric,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when resources are non-compliant with Config rules',
    }).addAlarmAction(new cloudwatchActions.SnsAction(complianceTopic));
  }
}
```

### `lib/constructs/networking.ts`

```typescript
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';

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
      maxAzs: 3, // Use 3 AZs for high availability
      natGateways: 2, // Deploy NAT gateways in 2 AZs for redundancy
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

    // Add interface endpoints for other services
    this.vpc.addInterfaceEndpoint('LambdaEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.LAMBDA,
      subnets: {
        subnets: this.privateSubnets,
      },
    });
  }
}
```

### `lib/constructs/security.ts`

```typescript
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';

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
    this.bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for bastion hosts',
      allowAllOutbound: false,
    });

    // Only allow SSH from specified IP range
    this.bastionSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.allowedSshIpRange),
      ec2.Port.tcp(22),
      'Allow SSH from specified IP range only'
    );

    // Allow outbound HTTPS for updates
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
    this.lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for Lambda functions',
    });

    // Database security group
    this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for RDS databases',
      allowAllOutbound: false,
    });

    // Allow Lambda to connect to database
    this.databaseSecurityGroup.addIngressRule(
      this.lambdaSecurityGroup,
      ec2.Port.tcp(5432), // PostgreSQL port
      'Allow Lambda functions to connect to database'
    );

    // Allow bastion to connect to database for maintenance
    this.databaseSecurityGroup.addIngressRule(
      this.bastionSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow bastion host to connect to database'
    );

    // Create ACM certificate if domain is provided
    // Note: This requires a Route 53 hosted zone
    // Uncomment and configure if you have a domain
    /*
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'example.com',
    });

    this.certificate = new acm.Certificate(this, 'Certificate', {
      domainName: `${props.environment}.example.com`,
      subjectAlternativeNames: [`*.${props.environment}.example.com`],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });
    */
  }
}
```

### `lib/constructs/database.ts`

```typescript
import { Construct } from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

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
      instances: 2, // Multi-AZ deployment for high availability
      instanceProps: {
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [props.securityGroup],
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T4G,
          ec2.InstanceSize.MEDIUM
        ),
      },
      storageEncrypted: true,
      storageEncryptionKey: props.kmsKey,
      backup: {
        retention: cdk.Duration.days(30),
        preferredWindow: '03:00-04:00',
      },
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: true,
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.THIRTY_DAYS,
      defaultDatabaseName: `tap_${props.environment}`,
    });

    // Enable automated backups to another region for disaster recovery
    new rds.CfnDBClusterParameterGroup(this, 'ClusterParameterGroup', {
      family: 'aurora-postgresql14',
      description: 'Custom parameter group for TAP database',
      parameters: {
        'log_statement': 'all',
        'log_min_duration_statement': '100', // Log slow queries
        'shared_preload_libraries': 'pg_stat_statements',
      },
    });
  }
}
```

### `bin/app.ts`

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment from context
const environment = app.node.tryGetContext('environment') || 'dev';
const allowedSshIpRange = app.node.tryGetContext('allowedSshIpRange') || '10.0.0.0/8';

new TapStack(app, `TapStack-${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  allowedSshIpRange: allowedSshIpRange,
  environment: environment,
  description: `TAP infrastructure stack for ${environment} environment`,
});

app.synth();
```

### `package.json`

```json
{
  "name": "tap-infrastructure",
  "version": "1.0.0",
  "description": "Secure and highly available AWS infrastructure using CDK",
  "main": "app.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "cdk": "cdk",
    "deploy:dev": "npm run build && cdk deploy --context environment=dev",
    "deploy:staging": "npm run build && cdk deploy --context environment=staging",
    "deploy:prod": "npm run build && cdk deploy --context environment=prod --require-approval broadening",
    "diff": "npm run build && cdk diff",
    "synth": "npm run build && cdk synth"
  },
  "devDependencies": {
    "@types/node": "20.5.0",
    "aws-cdk": "2.100.0",
    "ts-node": "^10.9.1",
    "typescript": "~5.1.6"
  },
  "dependencies": {
    "aws-cdk-lib": "2.100.0",
    "constructs": "^10.2.69",
    "source-map-support": "^0.5.21"
  }
}
```

### `cdk.json`

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/app.ts",
  "context": {
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/aws-kms:defaultKeyPolicies": true,
    "@aws-cdk/aws-s3:grantWriteWithoutAcl": true,
    "@aws-cdk/aws-ecs-patterns:removeDefaultDesiredCount": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true
  }
}
```

### `tsconfig.json`

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
    "noImplicitThis": true,
    "alwaysStrict": true,
    "esModuleInterop": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "skipLibCheck": true,
    "typeRoots": ["./node_modules/@types"]
  },
  "exclude": ["node_modules", "cdk.out"]
}
```