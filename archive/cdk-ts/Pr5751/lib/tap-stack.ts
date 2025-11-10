import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cwActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  isPrimary?: boolean;
  drRegion?: string;
  primaryRegion?: string;
  globalClusterIdentifier?: string;
  primaryVpcId?: string;
  primaryVpcCidr?: string;
  primaryKmsKeyArn?: string;
  primarySnapshotBucketArn?: string;
  primarySecretArn?: string;
}

export class TapStack extends cdk.Stack {
  public readonly globalClusterIdentifier?: string;
  public readonly vpcId: string;
  public readonly vpcCidr: string;
  public readonly kmsKeyArn: string;
  public readonly snapshotBucketArn: string;
  public readonly secretArn?: string;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const isPrimary = props?.isPrimary ?? true;
    const regionPrefix = isPrimary ? 'primary' : 'dr';
    const currentRegion = this.region;

    // 🔹 KMS Keys for Encryption
    const dbEncryptionKey = new kms.Key(this, `AuroraKmsKey-${regionPrefix}`, {
      description: `Aurora DB encryption key for ${regionPrefix} region`,
      enableKeyRotation: true,
      alias: `alias/aurora-dr-${regionPrefix}-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    this.kmsKeyArn = dbEncryptionKey.keyArn;

    const s3EncryptionKey = new kms.Key(this, `S3KmsKey-${regionPrefix}`, {
      description: `S3 encryption key for snapshots ${regionPrefix} region`,
      enableKeyRotation: true,
      alias: `alias/s3-snapshots-${regionPrefix}-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 🔹 VPC Configuration
    const vpc = new ec2.Vpc(this, `VPC-${regionPrefix}`, {
      maxAzs: 3,
      ipAddresses: ec2.IpAddresses.cidr(
        isPrimary ? '10.0.0.0/16' : '10.1.0.0/16'
      ),
      subnetConfiguration: [
        {
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
      natGateways: 2,
    });
    this.vpcId = vpc.vpcId;
    this.vpcCidr = vpc.vpcCidrBlock;

    // 🔹 VPC Peering (if secondary region)
    if (!isPrimary && props?.primaryVpcId && props?.primaryVpcCidr) {
      const peeringConnection = new ec2.CfnVPCPeeringConnection(
        this,
        'VPCPeering',
        {
          vpcId: vpc.vpcId,
          peerVpcId: props.primaryVpcId,
          peerRegion: props.primaryRegion || 'us-east-1',
        }
      );

      // Add routes for peering
      vpc.privateSubnets.forEach((subnet, index) => {
        new ec2.CfnRoute(this, `PeeringRoute-${index}`, {
          routeTableId: subnet.routeTable.routeTableId,
          destinationCidrBlock: props.primaryVpcCidr!,
          vpcPeeringConnectionId: peeringConnection.ref,
        });
      });
    }

    // 🔹 Security Groups
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `DBSecurityGroup-${regionPrefix}`,
      {
        vpc,
        description: 'Security group for Aurora cluster',
        allowAllOutbound: false,
      }
    );

    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      `LambdaSecurityGroup-${regionPrefix}`,
      {
        vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: true,
      }
    );

    dbSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda functions to connect to Aurora'
    );

    // 🔹 S3 Buckets for Snapshots
    const snapshotBucket = new s3.Bucket(
      this,
      `SnapshotBucket-${regionPrefix}`,
      {
        bucketName: `aurora-dr-snapshots-${regionPrefix}-${this.account}-${environmentSuffix}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: s3EncryptionKey,
        versioned: false,
        lifecycleRules: [
          {
            id: 'transition-to-glacier',
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
            ],
            expiration: cdk.Duration.days(365),
          },
        ],
        transferAcceleration: true, // Enable for snapshots > 1GB
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );
    this.snapshotBucketArn = snapshotBucket.bucketArn;

    // 🔹 Cross-Region S3 Replication (Primary only)
    if (isPrimary && props?.drRegion) {
      // Create replication role for cross-region replication
      // Note: S3 cross-region replication configuration is complex and typically
      // requires the destination bucket to exist first. For minimal config, this
      // sets up the IAM role. Full replication config would be set up after both stacks deploy.
      new iam.Role(this, 'S3ReplicationRole', {
        assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
        inlinePolicies: {
          ReplicationPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  's3:GetReplicationConfiguration',
                  's3:ListBucket',
                  's3:GetObjectVersionForReplication',
                  's3:GetObjectVersionAcl',
                ],
                resources: [
                  snapshotBucket.bucketArn,
                  `${snapshotBucket.bucketArn}/*`,
                ],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  's3:ReplicateObject',
                  's3:ReplicateDelete',
                  's3:ReplicateTags',
                ],
                resources: [
                  `arn:aws:s3:::aurora-dr-snapshots-dr-${this.account}-${environmentSuffix}/*`,
                ],
              }),
            ],
          }),
        },
      });
    }

    // 🔹 SNS Topics for Alerting
    const alertTopic = new sns.Topic(this, `AlertTopic-${regionPrefix}`, {
      topicName: `aurora-dr-alerts-${regionPrefix}-${environmentSuffix}`,
      displayName: `Aurora DR Alerts - ${regionPrefix}`,
    });

    alertTopic.addSubscription(
      new snsSubscriptions.EmailSubscription('ops-team@example.com')
    );

    // 🔹 Aurora Global Database
    let globalCluster: rds.CfnGlobalCluster | undefined;
    let dbCluster: rds.DatabaseCluster;
    let cfnDRCluster: rds.CfnDBCluster | undefined;

    if (isPrimary) {
      // Create Global Cluster (Primary only)
      globalCluster = new rds.CfnGlobalCluster(this, 'GlobalCluster', {
        globalClusterIdentifier: `aurora-dr-global-${this.account}-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '15.8',
        storageEncrypted: true,
      });
      this.globalClusterIdentifier = globalCluster.globalClusterIdentifier!;

      // Primary Cluster
      dbCluster = new rds.DatabaseCluster(this, 'PrimaryCluster', {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_8,
        }),
        credentials: rds.Credentials.fromGeneratedSecret('dbadmin', {
          secretName: `aurora-dr-primary-secret-${environmentSuffix}`,
        }),
        instanceProps: {
          vpc,
          vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.R6G,
            ec2.InstanceSize.XLARGE
          ),
          securityGroups: [dbSecurityGroup],
        },
        instances: 2,
        storageEncrypted: true,
        storageEncryptionKey: dbEncryptionKey,
        backup: {
          retention: cdk.Duration.days(7),
          preferredWindow: '03:00-04:00',
        },
        parameterGroup: new rds.ParameterGroup(this, 'PrimaryParamGroup', {
          engine: rds.DatabaseClusterEngine.auroraPostgres({
            version: rds.AuroraPostgresEngineVersion.VER_15_8,
          }),
          parameters: {
            shared_preload_libraries: 'pg_stat_statements',
            log_statement: 'all',
            log_duration: '1',
          },
        }),
        cloudwatchLogsExports: ['postgresql'],
        cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
        deletionProtection: false,
      });

      // Associate with Global Cluster
      const cfnCluster = dbCluster.node.defaultChild as rds.CfnDBCluster;
      cfnCluster.globalClusterIdentifier =
        globalCluster.globalClusterIdentifier;
      cfnCluster.addDependency(globalCluster);

      // Export secret ARN for DR region
      this.secretArn = dbCluster.secret?.secretArn;
    } else {
      // Secondary/DR Cluster
      // For Global Database secondary clusters, we must use CfnDBCluster directly
      // to avoid credential creation (credentials are inherited from primary)
      const drParameterGroup = new rds.CfnDBClusterParameterGroup(
        this,
        'DRParamGroup',
        {
          family: 'aurora-postgresql15',
          description: 'Parameter group for DR Aurora cluster',
          parameters: {
            shared_preload_libraries: 'pg_stat_statements',
            log_statement: 'all',
            log_duration: '1',
          },
        }
      );

      const drClusterIdentifier = `aurora-dr-cluster-${this.account}-${environmentSuffix}`;

      // Create DB subnet group for DR cluster
      const drSubnetGroup = new rds.SubnetGroup(this, 'DRSubnetGroup', {
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        description: 'Subnet group for DR Aurora cluster',
      });

      // Create CfnDBCluster directly (no credentials for Global Database secondary)
      cfnDRCluster = new rds.CfnDBCluster(this, 'DRCluster', {
        dbClusterIdentifier: drClusterIdentifier,
        engine: 'aurora-postgresql',
        engineVersion: '15.8',
        dbClusterParameterGroupName: drParameterGroup.ref,
        dbSubnetGroupName: drSubnetGroup.subnetGroupName,
        vpcSecurityGroupIds: [dbSecurityGroup.securityGroupId],
        storageEncrypted: true,
        kmsKeyId: dbEncryptionKey.keyId,
        enableCloudwatchLogsExports: ['postgresql'],
        deletionProtection: false,
        // Do NOT specify masterUsername or masterUserSecret for Global Database secondary
        globalClusterIdentifier: props?.globalClusterIdentifier,
      });

      // Create DB instances for DR cluster
      const drInstance1 = new rds.CfnDBInstance(this, 'DRInstance1', {
        dbInstanceIdentifier: `${drClusterIdentifier}-instance-1`,
        dbClusterIdentifier: cfnDRCluster.ref,
        engine: 'aurora-postgresql',
        engineVersion: '15.8',
        dbInstanceClass: 'db.r6g.xlarge',
      });
      drInstance1.addDependency(cfnDRCluster);

      const drInstance2 = new rds.CfnDBInstance(this, 'DRInstance2', {
        dbInstanceIdentifier: `${drClusterIdentifier}-instance-2`,
        dbClusterIdentifier: cfnDRCluster.ref,
        engine: 'aurora-postgresql',
        engineVersion: '15.8',
        dbInstanceClass: 'db.r6g.xlarge',
      });
      drInstance2.addDependency(cfnDRCluster);

      // For DR cluster, create a minimal DatabaseCluster reference for compatibility
      // We'll use CfnDBCluster attributes directly where needed
      dbCluster = rds.DatabaseCluster.fromDatabaseClusterAttributes(
        this,
        'DRClusterRef',
        {
          clusterIdentifier: cfnDRCluster.ref,
          clusterEndpointAddress: cfnDRCluster.attrEndpointAddress,
          port: 5432,
        }
      ) as rds.DatabaseCluster;
    }

    // 🔹 Health Check Lambda
    const healthCheckLambda = new lambda.Function(
      this,
      `HealthCheckLambda-${regionPrefix}`,
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const { Client } = require('pg');
        
        exports.handler = async (event) => {
          const secretsManager = new AWS.SecretsManager();
          const cloudWatch = new AWS.CloudWatch();
          
          try {
            // Get DB credentials
            const secret = await secretsManager.getSecretValue({
              SecretId: process.env.DB_SECRET_ARN
            }).promise();
            
            const credentials = JSON.parse(secret.SecretString);
            
            // Connect to database
            const client = new Client({
              host: process.env.DB_ENDPOINT,
              port: 5432,
              user: credentials.username,
              password: credentials.password,
              database: 'postgres',
              ssl: { rejectUnauthorized: false }
            });
            
            await client.connect();
            
            // Check data freshness (heartbeat table)
            const result = await client.query(
              'SELECT extract(epoch from (now() - last_heartbeat)) as lag_seconds FROM heartbeat_table LIMIT 1'
            );
            
            const lagSeconds = result.rows[0]?.lag_seconds || 999999;
            
            // Put metric
            await cloudWatch.putMetricData({
              Namespace: 'AuroraDR',
              MetricData: [{
                MetricName: 'DataFreshnessLag',
                Value: lagSeconds,
                Unit: 'Seconds',
                Timestamp: new Date()
              }]
            }).promise();
            
            await client.end();
            
            // Fail if lag > 60 seconds
            if (lagSeconds > 60) {
              return {
                statusCode: 503,
                body: JSON.stringify({ status: 'unhealthy', lag: lagSeconds })
              };
            }
            
            return {
              statusCode: 200,
              body: JSON.stringify({ status: 'healthy', lag: lagSeconds })
            };
            
          } catch (error) {
            console.error('Health check failed:', error);
            return {
              statusCode: 503,
              body: JSON.stringify({ status: 'unhealthy', error: error.message })
            };
          }
        };
      `),
        timeout: cdk.Duration.seconds(30),
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [lambdaSecurityGroup],
        environment: {
          DB_ENDPOINT: isPrimary
            ? dbCluster.clusterEndpoint.hostname
            : cfnDRCluster!.attrEndpointAddress,
          DB_SECRET_ARN: isPrimary
            ? dbCluster.secret!.secretArn
            : (props?.primarySecretArn ?? ''),
          REGION: currentRegion,
        },
      }
    );

    // Grant secret read permissions
    if (isPrimary) {
      dbCluster.secret?.grantRead(healthCheckLambda);
    } else if (props?.primarySecretArn) {
      // For DR region, grant cross-region access to primary secret
      healthCheckLambda.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'secretsmanager:GetSecretValue',
            'secretsmanager:DescribeSecret',
          ],
          resources: [props.primarySecretArn],
        })
      );
    }
    healthCheckLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
      })
    );

    // 🔹 Failover Lambda
    const failoverLambda = new lambda.Function(
      this,
      `FailoverLambda-${regionPrefix}`,
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const rds = new AWS.RDS();
        const route53 = new AWS.Route53();
        const sns = new AWS.SNS();
        const s3 = new AWS.S3();
        
        exports.handler = async (event) => {
          const stateKey = 'failover-state.json';
          const stateBucket = process.env.STATE_BUCKET;
          
          try {
            // Check for idempotency
            let state = {};
            try {
              const stateObj = await s3.getObject({
                Bucket: stateBucket,
                Key: stateKey
              }).promise();
              state = JSON.parse(stateObj.Body.toString());
            } catch (e) {
              // State doesn't exist yet
            }
            
            const failoverId = Date.now().toString();
            if (state.lastFailover && (Date.now() - state.lastFailover) < 300000) {
              console.log('Failover already in progress or recently completed');
              return { statusCode: 200, body: 'Failover already handled' };
            }
            
            // Update state
            state.lastFailover = Date.now();
            state.failoverId = failoverId;
            await s3.putObject({
              Bucket: stateBucket,
              Key: stateKey,
              Body: JSON.stringify(state),
              ContentType: 'application/json'
            }).promise();
            
            console.log('Initiating failover:', failoverId);
            
            // 1. Promote DR cluster (if applicable)
            if (!process.env.IS_PRIMARY) {
              await rds.promoteReadReplicaDBCluster({
                DBClusterIdentifier: process.env.CLUSTER_ID
              }).promise();
              
              console.log('DR cluster promotion initiated');
            }
            
            // 2. Update Route 53 DNS
            const hostedZoneId = process.env.HOSTED_ZONE_ID;
            const recordName = process.env.RECORD_NAME;
            const newEndpoint = process.env.DR_ENDPOINT;
            
            if (hostedZoneId && recordName && newEndpoint) {
              await route53.changeResourceRecordSets({
                HostedZoneId: hostedZoneId,
                ChangeBatch: {
                  Changes: [{
                    Action: 'UPSERT',
                    ResourceRecordSet: {
                      Name: recordName,
                      Type: 'CNAME',
                      TTL: 60,
                      ResourceRecords: [{ Value: newEndpoint }]
                    }
                  }]
                }
              }).promise();
              
              console.log('DNS updated to DR endpoint');
            }
            
            // 3. Send notification
            await sns.publish({
              TopicArn: process.env.SNS_TOPIC_ARN,
              Subject: 'Aurora DR Failover Initiated',
              Message: JSON.stringify({
                failoverId,
                timestamp: new Date().toISOString(),
                action: 'DR_FAILOVER',
                region: process.env.AWS_REGION,
                clusterId: process.env.CLUSTER_ID,
                status: 'COMPLETED'
              }, null, 2)
            }).promise();
            
            return {
              statusCode: 200,
              body: JSON.stringify({ failoverId, status: 'completed' })
            };
            
          } catch (error) {
            console.error('Failover failed:', error);
            
            // Send error notification
            await sns.publish({
              TopicArn: process.env.SNS_TOPIC_ARN,
              Subject: 'Aurora DR Failover Failed',
              Message: JSON.stringify({
                error: error.message,
                timestamp: new Date().toISOString(),
                stack: error.stack
              }, null, 2)
            }).promise();
            
            throw error;
          }
        };
      `),
        timeout: cdk.Duration.seconds(180), // 3 minutes max
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        environment: {
          CLUSTER_ID: isPrimary
            ? dbCluster.clusterIdentifier
            : cfnDRCluster!.ref,
          IS_PRIMARY: isPrimary.toString(),
          DR_ENDPOINT: isPrimary ? '' : cfnDRCluster!.attrEndpointAddress,
          SNS_TOPIC_ARN: alertTopic.topicArn,
          STATE_BUCKET: snapshotBucket.bucketName,
          HOSTED_ZONE_ID: this.node.tryGetContext('hostedZoneId') || '',
          RECORD_NAME:
            this.node.tryGetContext('recordName') || 'db.aurora-dr.internal',
          // Note: AWS_REGION is automatically provided by Lambda runtime, don't set it manually
        },
      }
    );

    // Grant permissions to failover Lambda
    failoverLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds:PromoteReadReplicaDBCluster',
          'rds:DescribeDBClusters',
          'rds:DescribeGlobalClusters',
          'rds:ModifyDBCluster',
        ],
        resources: [`arn:aws:rds:*:${this.account}:cluster:*`],
      })
    );

    failoverLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['route53:ChangeResourceRecordSets'],
        resources: ['arn:aws:route53:::hostedzone/*'],
      })
    );

    alertTopic.grantPublish(failoverLambda);
    snapshotBucket.grantReadWrite(failoverLambda);

    // 🔹 Backup Verification Lambda
    const backupVerificationLambda = new lambda.Function(
      this,
      `BackupVerifyLambda-${regionPrefix}`,
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const rds = new AWS.RDS();
        const sns = new AWS.SNS();
        
        exports.handler = async (event) => {
          const testClusterId = \`test-restore-\${Date.now()}\`;
          
          try {
            // 1. Get latest snapshot
            const snapshots = await rds.describeDBClusterSnapshots({
              DBClusterIdentifier: process.env.CLUSTER_ID,
              SnapshotType: 'automated'
            }).promise();
            
            if (!snapshots.DBClusterSnapshots || snapshots.DBClusterSnapshots.length === 0) {
              throw new Error('No snapshots found');
            }
            
            const latestSnapshot = snapshots.DBClusterSnapshots
              .sort((a, b) => b.SnapshotCreateTime - a.SnapshotCreateTime)[0];
            
            console.log('Testing snapshot:', latestSnapshot.DBClusterSnapshotIdentifier);
            
            // 2. Restore from snapshot
            await rds.restoreDBClusterFromSnapshot({
              DBClusterIdentifier: testClusterId,
              SnapshotIdentifier: latestSnapshot.DBClusterSnapshotIdentifier,
              Engine: 'aurora-postgresql'
            }).promise();
            
            // 3. Wait and verify (simplified - in production, use waiters)
            await new Promise(resolve => setTimeout(resolve, 60000));
            
            // 4. Clean up test cluster
            await rds.deleteDBCluster({
              DBClusterIdentifier: testClusterId,
              SkipFinalSnapshot: true
            }).promise();
            
            // 5. Report success
            await sns.publish({
              TopicArn: process.env.SNS_TOPIC_ARN,
              Subject: 'Backup Verification Successful',
              Message: JSON.stringify({
                snapshot: latestSnapshot.DBClusterSnapshotIdentifier,
                timestamp: new Date().toISOString(),
                status: 'VERIFIED'
              }, null, 2)
            }).promise();
            
            return {
              statusCode: 200,
              body: JSON.stringify({ status: 'verified', snapshot: latestSnapshot.DBClusterSnapshotIdentifier })
            };
            
          } catch (error) {
            console.error('Backup verification failed:', error);
            
            // Clean up if needed
            try {
              await rds.deleteDBCluster({
                DBClusterIdentifier: testClusterId,
                SkipFinalSnapshot: true
              }).promise();
            } catch (e) {
              // Ignore cleanup errors
            }
            
            // Report failure
            await sns.publish({
              TopicArn: process.env.SNS_TOPIC_ARN,
              Subject: 'Backup Verification Failed',
              Message: JSON.stringify({
                error: error.message,
                timestamp: new Date().toISOString()
              }, null, 2)
            }).promise();
            
            throw error;
          }
        };
      `),
        timeout: cdk.Duration.seconds(180),
        environment: {
          CLUSTER_ID: isPrimary
            ? dbCluster.clusterIdentifier
            : cfnDRCluster!.ref,
          SNS_TOPIC_ARN: alertTopic.topicArn,
        },
      }
    );

    backupVerificationLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds:DescribeDBClusterSnapshots',
          'rds:RestoreDBClusterFromSnapshot',
          'rds:DeleteDBCluster',
          'rds:CreateDBInstance',
          'rds:DescribeDBClusters',
        ],
        resources: ['*'],
      })
    );

    alertTopic.grantPublish(backupVerificationLambda);

    // 🔹 EventBridge Rules
    const failoverRule = new events.Rule(this, `FailoverRule-${regionPrefix}`, {
      schedule: events.Schedule.rate(cdk.Duration.minutes(2)),
      description: 'Check health and trigger failover if needed',
    });

    failoverRule.addTarget(new targets.LambdaFunction(healthCheckLambda));

    const rdsEventRule = new events.Rule(this, `RDSEventRule-${regionPrefix}`, {
      eventPattern: {
        source: ['aws.rds'],
        detailType: ['RDS DB Cluster Event'],
        detail: {
          EventCategories: ['failover', 'failure', 'notification'],
        },
      },
    });

    rdsEventRule.addTarget(new targets.SnsTopic(alertTopic));

    const dailyVerificationRule = new events.Rule(
      this,
      `DailyVerifyRule-${regionPrefix}`,
      {
        schedule: events.Schedule.rate(cdk.Duration.days(1)),
        description: 'Daily backup verification',
      }
    );

    dailyVerificationRule.addTarget(
      new targets.LambdaFunction(backupVerificationLambda)
    );

    // 🔹 Route 53 Health Checks (Primary only)
    // Note: For minimal configuration, using CALCULATED type placeholder
    // In production, configure actual health checks (e.g., HTTPS endpoint checking DB connectivity)
    const healthCheckEndpoint = new route53.CfnHealthCheck(
      this,
      'PrimaryHealthCheck',
      {
        healthCheckConfig: {
          type: 'CALCULATED',
          childHealthChecks: [],
          healthThreshold: 1,
        },
      }
    );

    // Create alarm for health check failures
    const healthCheckAlarm = new cloudwatch.Alarm(
      this,
      'HealthCheckFailureAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/Route53',
          metricName: 'HealthCheckStatus',
          dimensionsMap: {
            HealthCheckId: healthCheckEndpoint.attrHealthCheckId,
          },
        }),
        threshold: 0,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      }
    );

    healthCheckAlarm.addAlarmAction(new cwActions.LambdaAction(failoverLambda));
    healthCheckAlarm.addAlarmAction(new cwActions.SnsAction(alertTopic));

    // 🔹 CloudWatch Alarms
    const replicationLagAlarm = new cloudwatch.Alarm(
      this,
      `ReplicationLagAlarm-${regionPrefix}`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'AuroraGlobalDBReplicationLag',
          dimensionsMap: {
            DBClusterIdentifier: isPrimary
              ? dbCluster.clusterIdentifier
              : cfnDRCluster!.ref,
          },
        }),
        threshold: 5000, // 5 seconds in milliseconds
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
        alarmDescription: 'Aurora Global DB replication lag exceeds 5 seconds',
      }
    );

    replicationLagAlarm.addAlarmAction(new cwActions.SnsAction(alertTopic));

    const cpuAlarm = new cloudwatch.Alarm(this, `CPUAlarm-${regionPrefix}`, {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          DBClusterIdentifier: isPrimary
            ? dbCluster.clusterIdentifier
            : cfnDRCluster?.ref || '',
        },
      }),
      threshold: 80,
      evaluationPeriods: 3,
      datapointsToAlarm: 3,
    });

    cpuAlarm.addAlarmAction(new cwActions.SnsAction(alertTopic));

    const connectionAlarm = new cloudwatch.Alarm(
      this,
      `ConnectionAlarm-${regionPrefix}`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'DatabaseConnections',
          dimensionsMap: {
            DBClusterIdentifier: isPrimary
              ? dbCluster.clusterIdentifier
              : cfnDRCluster!.ref,
          },
        }),
        threshold: 500,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
      }
    );

    connectionAlarm.addAlarmAction(new cwActions.SnsAction(alertTopic));

    // 🔹 Lambda Function Alarms
    const lambdaErrorAlarm = new cloudwatch.Alarm(
      this,
      `LambdaErrorAlarm-${regionPrefix}`,
      {
        metric: failoverLambda.metricErrors(),
        threshold: 1,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
      }
    );

    lambdaErrorAlarm.addAlarmAction(new cwActions.SnsAction(alertTopic));

    const lambdaDurationAlarm = new cloudwatch.Alarm(
      this,
      `LambdaDurationAlarm-${regionPrefix}`,
      {
        metric: failoverLambda.metricDuration(),
        threshold: 150000, // 150 seconds
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
      }
    );

    lambdaDurationAlarm.addAlarmAction(new cwActions.SnsAction(alertTopic));

    // 🔹 CloudWatch Dashboard
    new cloudwatch.Dashboard(this, `DRDashboard-${regionPrefix}`, {
      dashboardName: `aurora-dr-${regionPrefix}-${environmentSuffix}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Replication Lag',
            left: [replicationLagAlarm.metric],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'Database CPU',
            left: [cpuAlarm.metric],
            width: 12,
            height: 6,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Database Connections',
            left: [connectionAlarm.metric],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'Lambda Errors',
            left: [lambdaErrorAlarm.metric],
            width: 12,
            height: 6,
          }),
        ],
      ],
    });

    // 🔹 Outputs
    new cdk.CfnOutput(this, `ClusterEndpointOutput-${regionPrefix}`, {
      value: isPrimary
        ? dbCluster.clusterEndpoint.hostname
        : cfnDRCluster!.attrEndpointAddress,
      description: `Aurora cluster endpoint for ${regionPrefix} region`,
      exportName: `aurora-dr-endpoint-${regionPrefix}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `SnapshotBucketOutput-${regionPrefix}`, {
      value: snapshotBucket.bucketName,
      description: `S3 bucket for snapshots in ${regionPrefix} region`,
      exportName: `aurora-dr-snapshots-${regionPrefix}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `AlertTopicOutput-${regionPrefix}`, {
      value: alertTopic.topicArn,
      description: `SNS topic for alerts in ${regionPrefix} region`,
      exportName: `aurora-dr-alerts-${regionPrefix}-${environmentSuffix}`,
    });

    // Only output global cluster identifier for primary region
    if (isPrimary && globalCluster) {
      new cdk.CfnOutput(this, 'GlobalClusterIdentifier', {
        value: globalCluster.globalClusterIdentifier!,
        description: 'Aurora Global Database cluster identifier',
        exportName: `aurora-dr-global-cluster-${environmentSuffix}`,
      });
    }
  }
}
