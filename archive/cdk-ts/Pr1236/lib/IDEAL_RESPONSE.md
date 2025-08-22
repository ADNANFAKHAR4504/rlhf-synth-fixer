# AWS CDK TypeScript Infrastructure

This solution provides AWS infrastructure using CDK TypeScript.

## lib/stacks/compute-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  dataKey: kms.IKey;
  appBucket: s3.IBucket;
  appSecurityGroup?: ec2.ISecurityGroup;
  appInstanceRole?: iam.IRole;
}

export class ComputeStack extends cdk.Stack {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly asg: autoscaling.AutoScalingGroup;
  public readonly instanceRole: iam.Role;
  public readonly appSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Security Groups
    const albSg = new ec2.SecurityGroup(this, 'AlbSg', {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: 'Web ingress 80/443.',
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP');
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS');

    this.appSecurityGroup = new ec2.SecurityGroup(this, 'AppSg', {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: 'App instances behind ALB.',
    });
    this.appSecurityGroup.addIngressRule(
      albSg,
      ec2.Port.tcp(80),
      'ALB to App HTTP'
    );

    // ALB across all public subnets/AZs
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: albSg,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const httpListener = this.alb.addListener('HttpListener', {
      port: 80,
      open: false,
    });
    // No HTTPS listener (no ACM certificate per constraint)

    // IAM Role for EC2 instances (least-privilege)
    this.instanceRole = new iam.Role(this, 'AppInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description:
        'Allows EC2 to access S3 app bucket and SSM; DB access granted in DB stack.',
    });
    this.instanceRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );
    props.appBucket.grantReadWrite(this.instanceRole);

    // User data for simple health endpoint
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'dnf update -y || yum update -y',
      'dnf install -y httpd || yum install -y httpd',
      'echo "OK" > /var/www/html/health',
      'systemctl enable httpd && systemctl start httpd'
    );

    // ASG on private subnets
    this.asg = new autoscaling.AutoScalingGroup(this, 'Asg', {
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      minCapacity: 2,
      desiredCapacity: 2,
      maxCapacity: 6,
      instanceType: new ec2.InstanceType('t3.micro'),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      role: this.instanceRole,
      securityGroup: this.appSecurityGroup,
      associatePublicIpAddress: false,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: autoscaling.BlockDeviceVolume.ebs(20, {
            encrypted: true,
          }),
        },
      ],
      healthChecks: {
        types: ['ELB'],
      },
      userData,
    });

    httpListener.addTargets('AsgTargets', {
      port: 80,
      targets: [this.asg],
      healthCheck: { healthyHttpCodes: '200', path: '/health' },
    });

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: this.alb.loadBalancerDnsName,
    });
  }
}
```

## lib/stacks/core-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export interface CoreStackProps extends cdk.StackProps {
  vpcCidr?: string;
}

export class CoreStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly dataKey: kms.Key;
  public readonly appSecurityGroup: ec2.SecurityGroup;
  public readonly appInstanceRole?: iam.Role;

  constructor(scope: Construct, id: string, props: CoreStackProps = {}) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'AppVpc', {
      ipAddresses: ec2.IpAddresses.cidr(props.vpcCidr || '10.0.0.0/16'),
      maxAzs: 2,
    });

    this.dataKey = new kms.Key(this, 'DataKey', {
      enableKeyRotation: true,
    });

    this.appSecurityGroup = new ec2.SecurityGroup(this, 'AppSg', {
      vpc: this.vpc,
      allowAllOutbound: true,
      description: 'App SG',
    });

    // appInstanceRole will be set from DatabaseStack after creation
  }
}
```

## lib/stacks/database-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  dataKey: kms.IKey;
  appSecurityGroup: ec2.ISecurityGroup;
  appInstanceRole?: iam.IRole;
}

export class DatabaseStack extends cdk.Stack {
  public readonly dbInstance: rds.DatabaseInstance;
  public readonly appInstanceRole: iam.Role;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Create IAM role for app instances here
    this.appInstanceRole = new iam.Role(this, 'AppInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'App EC2 role',
    });

    // Use shared resources from CoreStack
    const dbSg = new ec2.SecurityGroup(this, 'DbSg', {
      vpc: props.vpc,
      allowAllOutbound: true,
    });
    dbSg.addIngressRule(
      props.appSecurityGroup,
      ec2.Port.tcp(5432),
      'App to DB'
    );

    const dbCredentials = rds.Credentials.fromGeneratedSecret('postgres'); // in Secrets Manager

    this.dbInstance = new rds.DatabaseInstance(this, 'Db', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [dbSg],
      credentials: dbCredentials,
      allocatedStorage: 100,
      multiAz: true,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      storageEncrypted: true,
      storageEncryptionKey: props.dataKey,
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
      deletionProtection: true,
      iamAuthentication: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      performanceInsightEncryptionKey: props.dataKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Grant read access to secret and connect permission to appInstanceRole
    const secret = this.dbInstance.secret as secretsmanager.ISecret;
    if (secret && this.appInstanceRole) {
      secret.grantRead(this.appInstanceRole);
      this.dbInstance.grantConnect(this.appInstanceRole, 'postgres');
    }

    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: this.dbInstance.instanceEndpoint.hostname,
    });
  }
}
```

## lib/stacks/kms-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export class KmsStack extends cdk.Stack {
  /** KMS key for data-at-rest (S3, EBS, RDS, PI). */
  public readonly dataKey: kms.Key;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.dataKey = new kms.Key(this, 'DataKmsKey', {
      alias: 'alias/secure-data',
      enableKeyRotation: true,
      description: 'KMS key for encrypting application data at rest.',
    });
  }
}
```

## lib/stacks/monitoring-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.StackProps {
  alb: elbv2.ApplicationLoadBalancer;
  asg: autoscaling.AutoScalingGroup;
  dbInstance: rds.DatabaseInstance;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // ALB 5XX surge alarm
    const alb5xxMetric = props.alb.metrics.httpCodeTarget(
      elbv2.HttpCodeTarget.TARGET_5XX_COUNT,
      { period: Duration.minutes(1) }
    );

    new cw.Alarm(this, 'Alb5xxAlarm', {
      metric: alb5xxMetric,
      threshold: 5,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });

    // ASG CPU high
    const asgCpu = new cw.Metric({
      namespace: 'AWS/AutoScaling',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: props.asg.autoScalingGroupName,
      },
      statistic: 'Average',
      period: Duration.minutes(1),
    });

    new cw.Alarm(this, 'AsgHighCpu', {
      metric: asgCpu,
      threshold: 80,
      evaluationPeriods: 3,
    });

    // RDS free storage low
    const freeStorage = props.dbInstance.metricFreeStorageSpace({
      period: Duration.minutes(5),
    });

    new cw.Alarm(this, 'DbFreeStorageLow', {
      metric: freeStorage,
      threshold: 10 * 1024 * 1024 * 1024, // 10 GiB
      evaluationPeriods: 1,
      comparisonOperator: cw.ComparisonOperator.LESS_THAN_THRESHOLD,
    });
  }
}
```

## lib/stacks/network-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const azCount = cdk.Stack.of(this).availabilityZones.length; // dynamic, region-agnostic

    this.vpc = new ec2.Vpc(this, 'Vpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      natGateways: Math.min(2, Math.max(1, azCount)),
      maxAzs: azCount,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 }, // >=256 IPs
        {
          name: 'private-egress',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    new cdk.CfnOutput(this, 'VpcId', { value: this.vpc.vpcId });
  }
}
```

## lib/stacks/storage-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface StorageStackProps extends cdk.StackProps {
  dataKey: kms.IKey;
}

export class StorageStack extends cdk.Stack {
  /** Dedicated access logs bucket (SSE-S3 due to service constraints) */
  public readonly logsBucket: s3.Bucket;
  /** Application data bucket (KMS, versioning, access logging enabled) */
  public readonly appBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    if (!props || !props.dataKey) {
      throw new Error('StorageStack: dataKey prop is required');
    }
    super(scope, id, props);

    this.logsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.appBucket = new s3.Bucket(this, 'AppBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.dataKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      serverAccessLogsBucket: this.logsBucket,
      serverAccessLogsPrefix: 's3-access-logs/',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    new cdk.CfnOutput(this, 'AppBucketName', {
      value: this.appBucket.bucketName,
    });
  }
}
```

