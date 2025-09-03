I'll help you create a comprehensive, production-ready AWS infrastructure using CDK TypeScript. Based on your requirements, I'll implement a multi-stack architecture following AWS best practices.

Here's the updated `./lib/tap-stack.ts` file and the supporting infrastructure stacks:

## Main Stack File (`./lib/tap-stack.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkingStack } from './stacks/networking-stack';
import { SecurityStack } from './stacks/security-stack';
import { DatabaseStack } from './stacks/database-stack';
import { ComputeStack } from './stacks/compute-stack';
import { StorageStack } from './stacks/storage-stack';
import { MonitoringStack } from './stacks/monitoring-stack';
import { DnsStack } from './stacks/dns-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  domainName?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const domainName = props?.domainName || this.node.tryGetContext('domainName');

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      Project: 'TAP-Migration',
      ManagedBy: 'CDK',
      CostCenter: 'Engineering'
    };

    // Apply tags to all resources in this stack
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // 1. Networking Stack - VPC, Subnets, NAT Gateway
    const networkingStack = new NetworkingStack(this, 'NetworkingStack', {
      environmentSuffix,
      stackName: `tap-networking-${environmentSuffix}`,
      description: `Networking infrastructure for TAP application - ${environmentSuffix}`,
      env: props?.env,
    });

    // 2. Security Stack - IAM roles, KMS keys, Security Groups
    const securityStack = new SecurityStack(this, 'SecurityStack', {
      vpc: networkingStack.vpc,
      environmentSuffix,
      stackName: `tap-security-${environmentSuffix}`,
      description: `Security infrastructure for TAP application - ${environmentSuffix}`,
      env: props?.env,
    });

    // 3. Database Stack - RDS PostgreSQL with read replicas
    const databaseStack = new DatabaseStack(this, 'DatabaseStack', {
      vpc: networkingStack.vpc,
      databaseSecurityGroup: securityStack.databaseSecurityGroup,
      kmsKey: securityStack.kmsKey,
      environmentSuffix,
      stackName: `tap-database-${environmentSuffix}`,
      description: `Database infrastructure for TAP application - ${environmentSuffix}`,
      env: props?.env,
    });

    // 4. Storage Stack - S3 buckets with lifecycle policies
    const storageStack = new StorageStack(this, 'StorageStack', {
      kmsKey: securityStack.kmsKey,
      environmentSuffix,
      stackName: `tap-storage-${environmentSuffix}`,
      description: `Storage infrastructure for TAP application - ${environmentSuffix}`,
      env: props?.env,
    });

    // 5. Compute Stack - EC2 Auto Scaling Group
    const computeStack = new ComputeStack(this, 'ComputeStack', {
      vpc: networkingStack.vpc,
      applicationSecurityGroup: securityStack.applicationSecurityGroup,
      albSecurityGroup: securityStack.albSecurityGroup,
      ec2Role: securityStack.ec2Role,
      backupBucket: storageStack.backupBucket,
      database: databaseStack.database,
      environmentSuffix,
      stackName: `tap-compute-${environmentSuffix}`,
      description: `Compute infrastructure for TAP application - ${environmentSuffix}`,
      env: props?.env,
    });

    // 6. DNS Stack - Route 53 (only if domain name is provided)
    let dnsStack;
    if (domainName) {
      dnsStack = new DnsStack(this, 'DnsStack', {
        domainName,
        loadBalancer: computeStack.loadBalancer,
        environmentSuffix,
        stackName: `tap-dns-${environmentSuffix}`,
        description: `DNS infrastructure for TAP application - ${environmentSuffix}`,
        env: props?.env,
      });
    }

    // 7. Monitoring Stack - CloudWatch alarms and dashboards
    const monitoringStack = new MonitoringStack(this, 'MonitoringStack', {
      autoScalingGroup: computeStack.autoScalingGroup,
      loadBalancer: computeStack.loadBalancer,
      database: databaseStack.database,
      readReplica: databaseStack.readReplica,
      environmentSuffix,
      stackName: `tap-monitoring-${environmentSuffix}`,
      description: `Monitoring infrastructure for TAP application - ${environmentSuffix}`,
      env: props?.env,
    });

    // Stack dependencies
    securityStack.addDependency(networkingStack);
    databaseStack.addDependency(securityStack);
    storageStack.addDependency(securityStack);
    computeStack.addDependency(databaseStack);
    computeStack.addDependency(storageStack);
    if (dnsStack) {
      dnsStack.addDependency(computeStack);
    }
    monitoringStack.addDependency(computeStack);

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: networkingStack.vpc.vpcId,
      description: 'VPC ID',
      exportName: `tap-vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
      value: computeStack.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
      exportName: `tap-alb-dns-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: databaseStack.database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
      exportName: `tap-db-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: storageStack.backupBucket.bucketName,
      description: 'S3 Backup Bucket Name',
      exportName: `tap-backup-bucket-${environmentSuffix}`,
    });
  }
}
```

## Networking Stack (`./lib/stacks/networking-stack.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkingStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class NetworkingStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Create VPC with public and private subnets across 2 AZs
    this.vpc = new ec2.Vpc(this, 'TapVpc', {
      vpcName: `tap-vpc-${environmentSuffix}`,
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `tap-public-subnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `tap-private-subnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: 2, // One NAT Gateway per AZ for high availability
    });

    // Add VPC Flow Logs for security monitoring
    new ec2.FlowLog(this, 'TapVpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
      flowLogName: `tap-vpc-flow-log-${environmentSuffix}`,
    });

    // Output VPC information
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
    });
  }
}
```

## Security Stack (`./lib/stacks/security-stack.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  environmentSuffix: string;
}

export class SecurityStack extends cdk.Stack {
  public readonly kmsKey: kms.Key;
  public readonly ec2Role: iam.Role;
  public readonly applicationSecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    const { vpc, environmentSuffix } = props;

    // KMS Key for encryption at rest
    this.kmsKey = new kms.Key(this, 'TapKmsKey', {
      alias: `tap-encryption-key-${environmentSuffix}`,
      description: `TAP application encryption key - ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // IAM Role for EC2 instances
    this.ec2Role = new iam.Role(this, 'TapEc2Role', {
      roleName: `tap-ec2-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
      inlinePolicies: {
        S3BackupPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              resources: [
                `arn:aws:s3:::tap-backup-${environmentSuffix}`,
                `arn:aws:s3:::tap-backup-${environmentSuffix}/*`,
              ],
            }),
          ],
        }),
        KmsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:GenerateDataKey',
                'kms:ReEncrypt*',
              ],
              resources: [this.kmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    // Security Group for Application Load Balancer
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'TapAlbSecurityGroup', {
      vpc,
      securityGroupName: `tap-alb-sg-${environmentSuffix}`,
      description: 'Security group for TAP Application Load Balancer',
      allowAllOutbound: false,
    });

    // Allow HTTP and HTTPS traffic from internet
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Security Group for EC2 instances
    this.applicationSecurityGroup = new ec2.SecurityGroup(this, 'TapApplicationSecurityGroup', {
      vpc,
      securityGroupName: `tap-app-sg-${environmentSuffix}`,
      description: 'Security group for TAP application EC2 instances',
      allowAllOutbound: true,
    });

    // Allow traffic from ALB to application instances
    this.applicationSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from ALB to application'
    );

    // Allow SSH access for maintenance (restrict to specific IP ranges in production)
    this.applicationSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(), // In production, replace with specific IP ranges
      ec2.Port.tcp(22),
      'Allow SSH access for maintenance'
    );

    // Security Group for RDS Database
    this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'TapDatabaseSecurityGroup', {
      vpc,
      securityGroupName: `tap-db-sg-${environmentSuffix}`,
      description: 'Security group for TAP RDS database',
      allowAllOutbound: false,
    });

    // Allow database access from application instances
    this.databaseSecurityGroup.addIngressRule(
      this.applicationSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from application instances'
    );

    // Allow ALB to communicate with application instances
    this.albSecurityGroup.addEgressRule(
      this.applicationSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow ALB to communicate with application instances'
    );

    // Outputs
    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: this.kmsKey.keyId,
      description: 'KMS Key ID',
    });

    new cdk.CfnOutput(this, 'Ec2RoleArn', {
      value: this.ec2Role.roleArn,
      description: 'EC2 IAM Role ARN',
    });
  }
}
```

## Database Stack (`./lib/stacks/database-stack.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  databaseSecurityGroup: ec2.SecurityGroup;
  kmsKey: kms.Key;
  environmentSuffix: string;
}

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;
  public readonly readReplica: rds.DatabaseInstanceReadReplica;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { vpc, databaseSecurityGroup, kmsKey, environmentSuffix } = props;

    // DB Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'TapDbSubnetGroup', {
      description: `TAP database subnet group - ${environmentSuffix}`,
      vpc,
      subnetGroupName: `tap-db-subnet-group-${environmentSuffix}`,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Parameter Group for PostgreSQL optimization
    const parameterGroup = new rds.ParameterGroup(this, 'TapDbParameterGroup', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      description: `TAP PostgreSQL parameter group - ${environmentSuffix}`,
      parameters: {
        'shared_preload_libraries': 'pg_stat_statements',
        'log_statement': 'all',
        'log_min_duration_statement': '1000',
        'log_checkpoints': '1',
        'log_connections': '1',
        'log_disconnections': '1',
      },
    });

    // Main RDS Database Instance
    this.database = new rds.DatabaseInstance(this, 'TapDatabase', {
      instanceIdentifier: `tap-db-${environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [databaseSecurityGroup],
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      multiAz: true, // High availability
      allocatedStorage: 100,
      maxAllocatedStorage: 1000, // Enable storage autoscaling
      storageType: rds.StorageType.GP2,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: environmentSuffix === 'prod',
      deleteAutomatedBackups: false,
      parameterGroup,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: kmsKey,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      monitoringInterval: cdk.Duration.seconds(60),
      credentials: rds.Credentials.fromGeneratedSecret('tapuser', {
        secretName: `tap-db-credentials-${environmentSuffix}`,
        description: `TAP database credentials - ${environmentSuffix}`,
        encryptionKey: kmsKey,
      }),
      databaseName: 'tapdb',
      removalPolicy: environmentSuffix === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Read Replica for read scaling
    this.readReplica = new rds.DatabaseInstanceReadReplica(this, 'TapDatabaseReadReplica', {
      sourceDatabaseInstance: this.database,
      instanceIdentifier: `tap-db-read-replica-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      vpc,
      securityGroups: [databaseSecurityGroup],
      deleteAutomatedBackups: false,
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: kmsKey,
      monitoringInterval: cdk.Duration.seconds(60),
      removalPolicy: environmentSuffix === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Outputs
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'ReadReplicaEndpoint', {
      value: this.readReplica.instanceEndpoint.hostname,
      description: 'RDS Read Replica Endpoint',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.database.secret?.secretArn || '',
      description: 'Database credentials secret ARN',
    });
  }
}
```

## Storage Stack (`./lib/stacks/storage-stack.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.StackProps {
  kmsKey: kms.Key;
  environmentSuffix: string;
}

export class StorageStack extends cdk.Stack {
  public readonly backupBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const { kmsKey, environmentSuffix } = props;

    // S3 Bucket for application backups
    this.backupBucket = new s3.Bucket(this, 'TapBackupBucket', {
      bucketName: `tap-backup-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: environmentSuffix === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          id: 'backup-lifecycle-rule',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
            {
              storageClass: s3.StorageClass.DEEP_ARCHIVE,
              transitionAfter: cdk.Duration.days(365),
            },
          ],
          expiration: cdk.Duration.days(2555), // 7 years retention
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
      ],
    });

    // Enable S3 access logging
    const accessLogsBucket = new s3.Bucket(this, 'TapAccessLogsBucket', {
      bucketName: `tap-access-logs-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          id: 'access-logs-lifecycle',
          enabled: true,
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    this.backupBucket.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: cdk.aws_iam.Effect.DENY,
        principals: [new cdk.aws_iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [
          this.backupBucket.bucketArn,
          `${this.backupBucket.bucketArn}/*`,
        ],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: this.backupBucket.bucketName,
      description: 'S3 Backup Bucket Name',
    });

    new cdk.CfnOutput(this, 'BackupBucketArn', {
      value: this.backupBucket.bucketArn,
      description: 'S3 Backup Bucket ARN',
    });
  }
}
```

## Compute Stack (`./lib/stacks/compute-stack.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  applicationSecurityGroup: ec2.SecurityGroup;
  albSecurityGroup: ec2.SecurityGroup;
  ec2Role: iam.Role;
  backupBucket: s3.Bucket;
  database: rds.DatabaseInstance;
  environmentSuffix: string;
}

export class ComputeStack extends cdk.Stack {
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const {
      vpc,
      applicationSecurityGroup,
      albSecurityGroup,
      ec2Role,
      backupBucket,
      database,
      environmentSuffix,
    } = props;

    // User Data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y postgresql15',
      
      // Install CloudWatch agent
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux',
      
      // Create application directory
      'mkdir -p /opt/tap-app',
      'chown ec2-user:ec2-user /opt/tap-app',
      
      // Set environment variables
      `echo "export DB_HOST=${database.instanceEndpoint.hostname}" >> /etc/environment`,
      `echo "export DB_NAME=tapdb" >> /etc/environment`,
      `echo "export BACKUP_BUCKET=${backupBucket.bucketName}" >> /etc/environment`,
      `echo "export ENVIRONMENT=${environmentSuffix}" >> /etc/environment`,
      
      // Start services
      'systemctl enable amazon-cloudwatch-agent',
      'systemctl start amazon-cloudwatch-agent'
    );

    // Launch Template for Auto Scaling Group
    const launchTemplate = new ec2.LaunchTemplate(this, 'TapLaunchTemplate', {
      launchTemplateName: `tap-launch-template-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      userData,
      role: ec2Role,
      securityGroup: applicationSecurityGroup,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: true,
            deleteOnTermination: true,
          }),
        },
      ],
      requireImdsv2: true, // Enforce IMDSv2 for security
    });

    // Auto Scaling Group
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'TapAutoScalingGroup', {
      autoScalingGroupName: `tap-asg-${environmentSuffix}`,
      vpc,
      launchTemplate,
      minCapacity: 2,
      maxCapacity: 10,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.seconds(300),
      }),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
        maxBatchSize: 1,
        minInstancesInService: 1,
        pauseTime: cdk.Duration.minutes(5),
      }),
    });

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'TapLoadBalancer', {
      loadBalancerName: `tap-alb-${environmentSuffix}`,
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TapTargetGroup', {
      targetGroupName: `tap-tg-${environmentSuffix}`,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      vpc,
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        path: '/health',
        protocol: elbv2.Protocol.HTTP,
        timeout: cdk.Duration.seconds(5),
        unhealthyThresholdCount: 2,
        healthyThresholdCount: 2,
      },
      targets: [this.autoScalingGroup],
    });

    // ALB Listener
    const listener = this.loadBalancer.addListener('TapListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Auto Scaling Policies
    const scaleUpPolicy = this.autoScalingGroup.scaleOnMet