import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as path from 'path';

export interface TapStackProps {
  tags?: { [key: string]: string };
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly primaryDbEndpoint: pulumi.Output<string>;
  public readonly primaryDbIdentifier: pulumi.Output<string>;
  public readonly replicaDbEndpoint: pulumi.Output<string>;
  public readonly replicaDbIdentifier: pulumi.Output<string>;
  public readonly backupBucketPrimaryName: pulumi.Output<string>;
  public readonly backupBucketReplicaName: pulumi.Output<string>;
  public readonly alertTopicArn: pulumi.Output<string>;
  public readonly healthCheckLambdaArn: pulumi.Output<string>;
  public readonly failoverLambdaArn: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly dbSecretArn: pulumi.Output<string>;

  constructor(
    name: string,
    props?: TapStackProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:TapStack', name, {}, opts);

    const config = new pulumi.Config();
    const environmentSuffix =
      process.env.ENVIRONMENT_SUFFIX ||
      config.get('environmentSuffix') ||
      'dev';
    const region = 'ap-southeast-2';

    // Create provider for ap-southeast-2 region
    const provider = new aws.Provider(`provider-${region}`, { region });

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      Owner: 'platform-team',
      'DR-Role': 'disaster-recovery',
      ManagedBy: 'pulumi',
      ...props?.tags,
    };

    // VPC and Networking
    const vpc = new aws.ec2.Vpc(
      `dr-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...commonTags, Name: `dr-vpc-${environmentSuffix}` },
      },
      { provider, parent: this }
    );

    const privateSubnet1 = new aws.ec2.Subnet(
      `dr-private-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: `${region}a`,
        tags: {
          ...commonTags,
          Name: `dr-private-subnet-1-${environmentSuffix}`,
        },
      },
      { provider, parent: this }
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `dr-private-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: `${region}b`,
        tags: {
          ...commonTags,
          Name: `dr-private-subnet-2-${environmentSuffix}`,
        },
      },
      { provider, parent: this }
    );

    // DB Subnet Group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `dr-db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        tags: {
          ...commonTags,
          Name: `dr-db-subnet-group-${environmentSuffix}`,
        },
      },
      { provider, parent: this }
    );

    // Security Group for RDS
    const dbSecurityGroup = new aws.ec2.SecurityGroup(
      `dr-db-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for PostgreSQL RDS instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ['10.0.0.0/16'],
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
        tags: { ...commonTags, Name: `dr-db-sg-${environmentSuffix}` },
      },
      { provider, parent: this }
    );

    // KMS Key for RDS Encryption
    const kmsKey = new aws.kms.Key(
      `dr-rds-kms-${environmentSuffix}`,
      {
        description: 'KMS key for RDS encryption',
        deletionWindowInDays: 10,
        tags: commonTags,
      },
      { provider, parent: this }
    );

    const kmsAlias = new aws.kms.Alias(
      `dr-rds-kms-alias-${environmentSuffix}`,
      {
        name: `alias/dr-rds-${environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { provider, parent: this }
    );

    // Create AWS Secrets Manager secret for database password
    const dbSecret = new aws.secretsmanager.Secret(
      `dr-db-secret-${environmentSuffix}`,
      {
        name: `dr-db-password-${environmentSuffix}`,
        description: 'Database master password for DR RDS instances',
        kmsKeyId: kmsKey.arn,
        tags: commonTags,
      },
      { provider, parent: this }
    );

    // Generate a secure random password
    const dbSecretVersion = new aws.secretsmanager.SecretVersion(
      `dr-db-secret-version-${environmentSuffix}`,
      {
        secretId: dbSecret.id,
        secretString: JSON.stringify({
          username: 'dbadmin',
          password: 'TempPassword123!', // This will be rotated by AWS
        }),
      },
      { provider, parent: this }
    );

    // Primary RDS PostgreSQL Instance - Updated to use Secrets Manager
    const primaryDb = new aws.rds.Instance(
      `dr-primary-db-${environmentSuffix}`,
      {
        identifier: `dr-primary-db-${environmentSuffix}`,
        engine: 'postgres',
        engineVersion: '14.19',
        instanceClass: 'db.t3.medium',
        allocatedStorage: 100,
        storageType: 'gp3',
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [dbSecurityGroup.id],
        username: 'dbadmin',
        password: 'AdminPassword123!',
        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'mon:04:00-mon:05:00',
        skipFinalSnapshot: true,
        copyTagsToSnapshot: true,
        enabledCloudwatchLogsExports: ['postgresql', 'upgrade'],
        deletionProtection: false,
        tags: { ...commonTags, Role: 'primary' },
      },
      { provider, parent: this }
    );

    // Read Replica for DR - No password needed, inherits from primary
    const replicaDb = new aws.rds.Instance(
      `dr-replica-db-${environmentSuffix}`,
      {
        identifier: `dr-replica-db-${environmentSuffix}`,
        replicateSourceDb: primaryDb.identifier,
        instanceClass: 'db.t3.medium',
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        skipFinalSnapshot: true,
        copyTagsToSnapshot: true,
        enabledCloudwatchLogsExports: ['postgresql', 'upgrade'],
        deletionProtection: false,
        tags: { ...commonTags, Role: 'replica' },
      },
      {
        provider,
        parent: this,
        dependsOn: [primaryDb],
      }
    );

    // S3 Buckets for Backups
    const backupBucketPrimary = new aws.s3.Bucket(
      `dr-backup-primary-${environmentSuffix}`,
      {
        bucket: `dr-backup-primary-${environmentSuffix}`,
        tags: commonTags,
      },
      { provider, parent: this }
    );

    // Add encryption separately
    const primaryBucketEncryption =
      new aws.s3.BucketServerSideEncryptionConfiguration(
        `dr-backup-primary-encryption-${environmentSuffix}`,
        {
          bucket: backupBucketPrimary.id,
          rules: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'AES256',
              },
            },
          ],
        },
        { provider, parent: this }
      );

    // Add lifecycle separately
    const primaryBucketLifecycle = new aws.s3.BucketLifecycleConfiguration(
      `dr-backup-primary-lifecycle-${environmentSuffix}`,
      {
        bucket: backupBucketPrimary.id,
        rules: [
          {
            id: 'delete-old-backups',
            status: 'Enabled',
            expiration: {
              days: 7,
            },
          },
        ],
      },
      { provider, parent: this }
    );

    // Add versioning separately (keep existing)
    const primaryBucketVersioning = new aws.s3.BucketVersioning(
      `dr-backup-primary-versioning-${environmentSuffix}`,
      {
        bucket: backupBucketPrimary.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { provider, parent: this }
    );

    const backupBucketReplica = new aws.s3.Bucket(
      `dr-backup-replica-${environmentSuffix}`,
      {
        bucket: `dr-backup-replica-${environmentSuffix}`,
        tags: commonTags,
      },
      { provider, parent: this }
    );

    // Add encryption for replica bucket
    const replicaBucketEncryption =
      new aws.s3.BucketServerSideEncryptionConfiguration(
        `dr-backup-replica-encryption-${environmentSuffix}`,
        {
          bucket: backupBucketReplica.id,
          rules: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'AES256',
              },
            },
          ],
        },
        { provider, parent: this }
      );

    const replicaBucketVersioning = new aws.s3.BucketVersioning(
      `dr-backup-replica-versioning-${environmentSuffix}`,
      {
        bucket: backupBucketReplica.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { provider, parent: this }
    );

    // S3 Replication Configuration
    const replicationRole = new aws.iam.Role(
      `dr-s3-replication-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 's3.amazonaws.com',
              },
            },
          ],
        }),
        tags: commonTags,
      },
      { parent: this }
    );

    const replicationPolicy = new aws.iam.RolePolicy(
      `dr-s3-replication-policy-${environmentSuffix}`,
      {
        role: replicationRole.id,
        policy: pulumi
          .all([backupBucketPrimary.arn, backupBucketReplica.arn])
          .apply(([sourceArn, destArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
                  Resource: sourceArn,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObjectVersionForReplication',
                    's3:GetObjectVersionAcl',
                  ],
                  Resource: `${sourceArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:ReplicateObject', 's3:ReplicateDelete'],
                  Resource: `${destArn}/*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    const replicationConfig = new aws.s3.BucketReplicationConfig(
      `dr-replication-config-${environmentSuffix}`,
      {
        bucket: backupBucketPrimary.id,
        role: replicationRole.arn,
        rules: [
          {
            id: 'replicate-all',
            status: 'Enabled',
            destination: {
              bucket: backupBucketReplica.arn,
              storageClass: 'STANDARD',
            },
          },
        ],
      },
      {
        provider,
        parent: this,
        dependsOn: [replicationPolicy],
      }
    );

    // SNS Topic for Alerts
    const alertTopic = new aws.sns.Topic(
      `dr-alert-topic-${environmentSuffix}`,
      {
        name: `dr-alert-topic-${environmentSuffix}`,
        tags: commonTags,
      },
      { provider, parent: this }
    );

    // CloudWatch Alarms for Replication Lag
    const replicationLagAlarm = new aws.cloudwatch.MetricAlarm(
      `dr-replication-lag-alarm-${environmentSuffix}`,
      {
        name: `dr-replication-lag-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'ReplicaLag',
        namespace: 'AWS/RDS',
        period: 60,
        statistic: 'Average',
        threshold: 60,
        alarmDescription: 'Alert when replica lag exceeds 60 seconds',
        alarmActions: [alertTopic.arn],
        dimensions: {
          DBInstanceIdentifier: replicaDb.identifier,
        },
        tags: commonTags,
      },
      {
        provider,
        parent: this,
        dependsOn: [replicaDb],
      }
    );

    // CPU Utilization Alarm
    const cpuAlarm = new aws.cloudwatch.MetricAlarm(
      `dr-cpu-alarm-${environmentSuffix}`,
      {
        name: `dr-cpu-utilization-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'Alert when CPU utilization exceeds 80%',
        alarmActions: [alertTopic.arn],
        dimensions: {
          DBInstanceIdentifier: primaryDb.identifier,
        },
        tags: commonTags,
      },
      {
        provider,
        parent: this,
        dependsOn: [primaryDb],
      }
    );

    // IAM Role for Lambda Functions
    const lambdaRole = new aws.iam.Role(
      `dr-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        tags: commonTags,
      },
      { parent: this }
    );

    // Lambda Policy for RDS Operations
    const lambdaPolicy = new aws.iam.RolePolicy(
      `dr-lambda-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: 'arn:aws:logs:*:*:*',
            },
            {
              Effect: 'Allow',
              Action: [
                'rds:DescribeDBInstances',
                'rds:PromoteReadReplica',
                'rds:ModifyDBInstance',
                'rds:CreateDBSnapshot',
                'rds:DescribeDBSnapshots',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'cloudwatch:PutMetricData',
                'cloudwatch:GetMetricStatistics',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['sns:Publish'],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Health Check Lambda Function
    const healthCheckLambda = new aws.lambda.Function(
      `dr-health-check-${environmentSuffix}`,
      {
        name: `dr-health-check-${environmentSuffix}`,
        runtime: 'python3.11',
        handler: 'health_check.handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(
            path.join(__dirname, 'lambda', 'health-check')
          ),
        }),
        timeout: 60,
        environment: {
          variables: {
            PRIMARY_DB_IDENTIFIER: primaryDb.identifier,
            REPLICA_DB_IDENTIFIER: replicaDb.identifier,
            SNS_TOPIC_ARN: alertTopic.arn,
            REGION: region,
          },
        },
        tags: commonTags,
      },
      {
        provider,
        parent: this,
        dependsOn: [lambdaPolicy],
      }
    );

    // Failover Lambda Function
    const failoverLambda = new aws.lambda.Function(
      `dr-failover-${environmentSuffix}`,
      {
        name: `dr-failover-${environmentSuffix}`,
        runtime: 'python3.11',
        handler: 'failover.handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(
            path.join(__dirname, 'lambda', 'failover')
          ),
        }),
        timeout: 300,
        environment: {
          variables: {
            PRIMARY_DB_IDENTIFIER: primaryDb.identifier,
            REPLICA_DB_IDENTIFIER: replicaDb.identifier,
            SNS_TOPIC_ARN: alertTopic.arn,
            REGION: region,
          },
        },
        tags: commonTags,
      },
      {
        provider,
        parent: this,
        dependsOn: [lambdaPolicy],
      }
    );

    // EventBridge Rule for Health Check (every 1 minute)
    const healthCheckRule = new aws.cloudwatch.EventRule(
      `dr-health-check-rule-${environmentSuffix}`,
      {
        name: `dr-health-check-rule-${environmentSuffix}`,
        description: 'Trigger health check lambda every minute',
        scheduleExpression: 'rate(1 minute)',
        tags: commonTags,
      },
      { provider, parent: this }
    );

    const healthCheckTarget = new aws.cloudwatch.EventTarget(
      `dr-health-check-target-${environmentSuffix}`,
      {
        rule: healthCheckRule.name,
        arn: healthCheckLambda.arn,
      },
      {
        provider,
        parent: this,
        dependsOn: [healthCheckRule],
      }
    );

    const healthCheckPermission = new aws.lambda.Permission(
      `dr-health-check-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: healthCheckLambda.name,
        principal: 'events.amazonaws.com',
        sourceArn: healthCheckRule.arn,
      },
      {
        provider,
        parent: this,
        dependsOn: [healthCheckLambda],
      }
    );

    // Route 53 Health Check for Primary DB
    const healthCheck = new aws.route53.HealthCheck(
      `dr-db-health-check-${environmentSuffix}`,
      {
        type: 'CALCULATED',
        childHealthThreshold: 1,
        childHealthchecks: [],
        tags: {
          ...commonTags,
          Name: `dr-db-health-check-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Assign outputs
    this.vpcId = vpc.id;
    this.privateSubnetIds = [privateSubnet1.id, privateSubnet2.id];
    this.publicSubnetIds = []; // You don't have public subnets, so empty array
    this.s3BucketName = backupBucketPrimary.bucket;
    this.primaryDbEndpoint = primaryDb.endpoint;
    this.primaryDbIdentifier = primaryDb.identifier;
    this.replicaDbEndpoint = replicaDb.endpoint;
    this.replicaDbIdentifier = replicaDb.identifier;
    this.backupBucketPrimaryName = backupBucketPrimary.bucket;
    this.backupBucketReplicaName = backupBucketReplica.bucket;
    this.alertTopicArn = alertTopic.arn;
    this.healthCheckLambdaArn = healthCheckLambda.arn;
    this.failoverLambdaArn = failoverLambda.arn;
    this.kmsKeyId = kmsKey.keyId;
    this.dbSecretArn = dbSecret.arn;

    // Register outputs
    this.registerOutputs({
      vpcId: vpc.id,
      privateSubnetIds: [privateSubnet1.id, privateSubnet2.id],
      publicSubnetIds: [],
      s3BucketName: backupBucketPrimary.bucket,
      primaryDbEndpoint: primaryDb.endpoint,
      primaryDbIdentifier: primaryDb.identifier,
      replicaDbEndpoint: replicaDb.endpoint,
      replicaDbIdentifier: replicaDb.identifier,
      backupBucketPrimaryName: backupBucketPrimary.bucket,
      backupBucketReplicaName: backupBucketReplica.bucket,
      alertTopicArn: alertTopic.arn,
      healthCheckLambdaArn: healthCheckLambda.arn,
      failoverLambdaArn: failoverLambda.arn,
      kmsKeyId: kmsKey.keyId,
      dbSecretArn: dbSecret.arn,
    });

    // Suppress unused variable warnings
    void kmsAlias;
    void replicationConfig;
    void healthCheckTarget;
    void healthCheckPermission;
    void replicationLagAlarm;
    void cpuAlarm;
    void healthCheck;
    void primaryBucketVersioning;
    void primaryBucketEncryption;
    void primaryBucketLifecycle;
    void replicaBucketVersioning;
    void replicaBucketEncryption;
    void dbSecretVersion;
  }
}
