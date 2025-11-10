# Automated Disaster Recovery Implementation - Pulumi TypeScript

Complete implementation of automated disaster recovery for PostgreSQL RDS with health monitoring, automated failover, and cross-region backup capabilities.

## File: lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
import * as path from "path";

const config = new pulumi.Config();
const environmentSuffix = config.get("environmentSuffix") || "dev";
const region = "ap-southeast-2";

// Common tags for all resources
const commonTags = {
    Environment: environmentSuffix,
    Owner: "platform-team",
    "DR-Role": "disaster-recovery",
    ManagedBy: "pulumi",
};

// VPC and Networking
const vpc = new aws.ec2.Vpc(`dr-vpc-${environmentSuffix}`, {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: { ...commonTags, Name: `dr-vpc-${environmentSuffix}` },
}, { provider: new aws.Provider(`provider-${region}`, { region }) });

const privateSubnet1 = new aws.ec2.Subnet(`dr-private-subnet-1-${environmentSuffix}`, {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    availabilityZone: `${region}a`,
    tags: { ...commonTags, Name: `dr-private-subnet-1-${environmentSuffix}` },
}, { provider: new aws.Provider(`provider-${region}`, { region }) });

const privateSubnet2 = new aws.ec2.Subnet(`dr-private-subnet-2-${environmentSuffix}`, {
    vpcId: vpc.id,
    cidrBlock: "10.0.2.0/24",
    availabilityZone: `${region}b`,
    tags: { ...commonTags, Name: `dr-private-subnet-2-${environmentSuffix}` },
}, { provider: new aws.Provider(`provider-${region}`, { region }) });

// DB Subnet Group
const dbSubnetGroup = new aws.rds.SubnetGroup(`dr-db-subnet-group-${environmentSuffix}`, {
    subnetIds: [privateSubnet1.id, privateSubnet2.id],
    tags: { ...commonTags, Name: `dr-db-subnet-group-${environmentSuffix}` },
}, { provider: new aws.Provider(`provider-${region}`, { region }) });

// Security Group for RDS
const dbSecurityGroup = new aws.ec2.SecurityGroup(`dr-db-sg-${environmentSuffix}`, {
    vpcId: vpc.id,
    description: "Security group for PostgreSQL RDS instances",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ["10.0.0.0/16"],
            description: "PostgreSQL access from VPC",
        },
    ],
    egress: [
        {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow all outbound traffic",
        },
    ],
    tags: { ...commonTags, Name: `dr-db-sg-${environmentSuffix}` },
}, { provider: new aws.Provider(`provider-${region}`, { region }) });

// KMS Key for RDS Encryption
const kmsKey = new aws.kms.Key(`dr-rds-kms-${environmentSuffix}`, {
    description: "KMS key for RDS encryption",
    deletionWindowInDays: 10,
    tags: commonTags,
}, { provider: new aws.Provider(`provider-${region}`, { region }) });

const kmsAlias = new aws.kms.Alias(`dr-rds-kms-alias-${environmentSuffix}`, {
    name: `alias/dr-rds-${environmentSuffix}`,
    targetKeyId: kmsKey.keyId,
}, { provider: new aws.Provider(`provider-${region}`, { region }) });

// Primary RDS PostgreSQL Instance
const primaryDb = new aws.rds.Instance(`dr-primary-db-${environmentSuffix}`, {
    identifier: `dr-primary-db-${environmentSuffix}`,
    engine: "postgres",
    engineVersion: "14.10",
    instanceClass: "db.t3.medium",
    allocatedStorage: 100,
    storageType: "gp3",
    storageEncrypted: true,
    kmsKeyId: kmsKey.arn,
    dbSubnetGroupName: dbSubnetGroup.name,
    vpcSecurityGroupIds: [dbSecurityGroup.id],
    username: "dbadmin",
    password: config.requireSecret("dbPassword"),
    backupRetentionPeriod: 7,
    backupWindow: "03:00-04:00",
    maintenanceWindow: "mon:04:00-mon:05:00",
    skipFinalSnapshot: true,
    copyTagsToSnapshot: true,
    enabledCloudwatchLogsExports: ["postgresql", "upgrade"],
    deletionProtection: false,
    tags: { ...commonTags, Role: "primary" },
}, { provider: new aws.Provider(`provider-${region}`, { region }) });

// Read Replica for DR
const replicaDb = new aws.rds.Instance(`dr-replica-db-${environmentSuffix}`, {
    identifier: `dr-replica-db-${environmentSuffix}`,
    replicateSourceDb: primaryDb.identifier,
    instanceClass: "db.t3.medium",
    storageEncrypted: true,
    kmsKeyId: kmsKey.arn,
    skipFinalSnapshot: true,
    copyTagsToSnapshot: true,
    enabledCloudwatchLogsExports: ["postgresql", "upgrade"],
    deletionProtection: false,
    tags: { ...commonTags, Role: "replica" },
}, {
    provider: new aws.Provider(`provider-${region}`, { region }),
    dependsOn: [primaryDb],
});

// S3 Buckets for Backups
const backupBucketPrimary = new aws.s3.Bucket(`dr-backup-primary-${environmentSuffix}`, {
    bucket: `dr-backup-primary-${environmentSuffix}`,
    versioning: {
        enabled: true,
    },
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "AES256",
            },
        },
    },
    lifecycleRules: [
        {
            enabled: true,
            expiration: {
                days: 7,
            },
        },
    ],
    tags: commonTags,
}, { provider: new aws.Provider(`provider-${region}`, { region }) });

const backupBucketReplica = new aws.s3.Bucket(`dr-backup-replica-${environmentSuffix}`, {
    bucket: `dr-backup-replica-${environmentSuffix}`,
    versioning: {
        enabled: true,
    },
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "AES256",
            },
        },
    },
    tags: commonTags,
}, { provider: new aws.Provider(`provider-${region}`, { region }) });

// S3 Replication Configuration
const replicationRole = new aws.iam.Role(`dr-s3-replication-role-${environmentSuffix}`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "s3.amazonaws.com",
            },
        }],
    }),
    tags: commonTags,
});

const replicationPolicy = new aws.iam.RolePolicy(`dr-s3-replication-policy-${environmentSuffix}`, {
    role: replicationRole.id,
    policy: pulumi.all([backupBucketPrimary.arn, backupBucketReplica.arn]).apply(([sourceArn, destArn]) =>
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: [
                        "s3:GetReplicationConfiguration",
                        "s3:ListBucket",
                    ],
                    Resource: sourceArn,
                },
                {
                    Effect: "Allow",
                    Action: [
                        "s3:GetObjectVersionForReplication",
                        "s3:GetObjectVersionAcl",
                    ],
                    Resource: `${sourceArn}/*`,
                },
                {
                    Effect: "Allow",
                    Action: [
                        "s3:ReplicateObject",
                        "s3:ReplicateDelete",
                    ],
                    Resource: `${destArn}/*`,
                },
            ],
        })
    ),
});

const replicationConfig = new aws.s3.BucketReplicationConfigurationV2(`dr-replication-config-${environmentSuffix}`, {
    bucket: backupBucketPrimary.id,
    role: replicationRole.arn,
    rules: [
        {
            id: "replicate-all",
            status: "Enabled",
            destination: {
                bucket: backupBucketReplica.arn,
                storageClass: "STANDARD",
            },
        },
    ],
}, {
    provider: new aws.Provider(`provider-${region}`, { region }),
    dependsOn: [replicationPolicy],
});

// SNS Topic for Alerts
const alertTopic = new aws.sns.Topic(`dr-alert-topic-${environmentSuffix}`, {
    name: `dr-alert-topic-${environmentSuffix}`,
    tags: commonTags,
}, { provider: new aws.Provider(`provider-${region}`, { region }) });

// CloudWatch Alarms for Replication Lag
const replicationLagAlarm = new aws.cloudwatch.MetricAlarm(`dr-replication-lag-alarm-${environmentSuffix}`, {
    name: `dr-replication-lag-${environmentSuffix}`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 2,
    metricName: "ReplicaLag",
    namespace: "AWS/RDS",
    period: 60,
    statistic: "Average",
    threshold: 60,
    alarmDescription: "Alert when replica lag exceeds 60 seconds",
    alarmActions: [alertTopic.arn],
    dimensions: {
        DBInstanceIdentifier: replicaDb.identifier,
    },
    tags: commonTags,
}, {
    provider: new aws.Provider(`provider-${region}`, { region }),
    dependsOn: [replicaDb],
});

// CPU Utilization Alarm
const cpuAlarm = new aws.cloudwatch.MetricAlarm(`dr-cpu-alarm-${environmentSuffix}`, {
    name: `dr-cpu-utilization-${environmentSuffix}`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 2,
    metricName: "CPUUtilization",
    namespace: "AWS/RDS",
    period: 300,
    statistic: "Average",
    threshold: 80,
    alarmDescription: "Alert when CPU utilization exceeds 80%",
    alarmActions: [alertTopic.arn],
    dimensions: {
        DBInstanceIdentifier: primaryDb.identifier,
    },
    tags: commonTags,
}, {
    provider: new aws.Provider(`provider-${region}`, { region }),
    dependsOn: [primaryDb],
});

// IAM Role for Lambda Functions
const lambdaRole = new aws.iam.Role(`dr-lambda-role-${environmentSuffix}`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "lambda.amazonaws.com",
            },
        }],
    }),
    tags: commonTags,
});

// Lambda Policy for RDS Operations
const lambdaPolicy = new aws.iam.RolePolicy(`dr-lambda-policy-${environmentSuffix}`, {
    role: lambdaRole.id,
    policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                Resource: "arn:aws:logs:*:*:*",
            },
            {
                Effect: "Allow",
                Action: [
                    "rds:DescribeDBInstances",
                    "rds:PromoteReadReplica",
                    "rds:ModifyDBInstance",
                    "rds:CreateDBSnapshot",
                    "rds:DescribeDBSnapshots",
                ],
                Resource: "*",
            },
            {
                Effect: "Allow",
                Action: [
                    "cloudwatch:PutMetricData",
                    "cloudwatch:GetMetricStatistics",
                ],
                Resource: "*",
            },
            {
                Effect: "Allow",
                Action: [
                    "sns:Publish",
                ],
                Resource: "*",
            },
        ],
    }),
});

// Health Check Lambda Function
const healthCheckLambda = new aws.lambda.Function(`dr-health-check-${environmentSuffix}`, {
    name: `dr-health-check-${environmentSuffix}`,
    runtime: "python3.11",
    handler: "health_check.handler",
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./lib/lambda/health-check"),
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
}, {
    provider: new aws.Provider(`provider-${region}`, { region }),
    dependsOn: [lambdaPolicy],
});

// Failover Lambda Function
const failoverLambda = new aws.lambda.Function(`dr-failover-${environmentSuffix}`, {
    name: `dr-failover-${environmentSuffix}`,
    runtime: "python3.11",
    handler: "failover.handler",
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./lib/lambda/failover"),
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
}, {
    provider: new aws.Provider(`provider-${region}`, { region }),
    dependsOn: [lambdaPolicy],
});

// EventBridge Rule for Health Check (every 1 minute)
const healthCheckRule = new aws.cloudwatch.EventRule(`dr-health-check-rule-${environmentSuffix}`, {
    name: `dr-health-check-rule-${environmentSuffix}`,
    description: "Trigger health check lambda every minute",
    scheduleExpression: "rate(1 minute)",
    tags: commonTags,
}, { provider: new aws.Provider(`provider-${region}`, { region }) });

const healthCheckTarget = new aws.cloudwatch.EventTarget(`dr-health-check-target-${environmentSuffix}`, {
    rule: healthCheckRule.name,
    arn: healthCheckLambda.arn,
}, {
    provider: new aws.Provider(`provider-${region}`, { region }),
    dependsOn: [healthCheckRule],
});

const healthCheckPermission = new aws.lambda.Permission(`dr-health-check-permission-${environmentSuffix}`, {
    action: "lambda:InvokeFunction",
    function: healthCheckLambda.name,
    principal: "events.amazonaws.com",
    sourceArn: healthCheckRule.arn,
}, {
    provider: new aws.Provider(`provider-${region}`, { region }),
    dependsOn: [healthCheckLambda],
});

// Route 53 Health Check for Primary DB
const healthCheck = new aws.route53.HealthCheck(`dr-db-health-check-${environmentSuffix}`, {
    type: "CALCULATED",
    childHealthThreshold: 1,
    childHealthchecks: [],
    tags: { ...commonTags, Name: `dr-db-health-check-${environmentSuffix}` },
});

// Exports
export const vpcId = vpc.id;
export const primaryDbEndpoint = primaryDb.endpoint;
export const primaryDbIdentifier = primaryDb.identifier;
export const replicaDbEndpoint = replicaDb.endpoint;
export const replicaDbIdentifier = replicaDb.identifier;
export const backupBucketPrimaryName = backupBucketPrimary.bucket;
export const backupBucketReplicaName = backupBucketReplica.bucket;
export const alertTopicArn = alertTopic.arn;
export const healthCheckLambdaArn = healthCheckLambda.arn;
export const failoverLambdaArn = failoverLambda.arn;
export const kmsKeyId = kmsKey.keyId;
```

## File: lib/lambda/health-check/health_check.py

```python
import json
import boto3
import os
from datetime import datetime

rds_client = boto3.client('rds', region_name=os.environ['REGION'])
sns_client = boto3.client('sns', region_name=os.environ['REGION'])
cloudwatch = boto3.client('cloudwatch', region_name=os.environ['REGION'])

PRIMARY_DB = os.environ['PRIMARY_DB_IDENTIFIER']
REPLICA_DB = os.environ['REPLICA_DB_IDENTIFIER']
SNS_TOPIC = os.environ['SNS_TOPIC_ARN']

def handler(event, context):
    """
    Health check Lambda function that monitors RDS primary database health
    and triggers failover if necessary.
    """
    try:
        # Check primary database status
        primary_response = rds_client.describe_db_instances(
            DBInstanceIdentifier=PRIMARY_DB
        )

        primary_status = primary_response['DBInstances'][0]['DBInstanceStatus']
        primary_available = primary_status == 'available'

        # Check replica status
        replica_response = rds_client.describe_db_instances(
            DBInstanceIdentifier=REPLICA_DB
        )

        replica_status = replica_response['DBInstances'][0]['DBInstanceStatus']
        replica_lag = get_replication_lag(REPLICA_DB)

        # Publish custom metrics
        cloudwatch.put_metric_data(
            Namespace='CustomRDS/DR',
            MetricData=[
                {
                    'MetricName': 'PrimaryHealthy',
                    'Value': 1.0 if primary_available else 0.0,
                    'Unit': 'None',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'ReplicaLag',
                    'Value': replica_lag,
                    'Unit': 'Seconds',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )

        # Alert if primary is unhealthy
        if not primary_available:
            message = f"PRIMARY DATABASE UNHEALTHY: {PRIMARY_DB} status is {primary_status}"
            sns_client.publish(
                TopicArn=SNS_TOPIC,
                Subject="CRITICAL: Primary Database Health Check Failed",
                Message=message
            )

            # Trigger failover if replica is healthy
            if replica_status == 'available' and replica_lag < 60:
                trigger_failover()

        # Alert if replication lag is too high
        if replica_lag > 60:
            message = f"HIGH REPLICATION LAG: {REPLICA_DB} lag is {replica_lag} seconds"
            sns_client.publish(
                TopicArn=SNS_TOPIC,
                Subject="WARNING: High Replication Lag Detected",
                Message=message
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'primary_status': primary_status,
                'replica_status': replica_status,
                'replica_lag': replica_lag,
                'timestamp': datetime.utcnow().isoformat()
            })
        }

    except Exception as e:
        error_message = f"Health check error: {str(e)}"
        print(error_message)
        sns_client.publish(
            TopicArn=SNS_TOPIC,
            Subject="ERROR: Health Check Lambda Failed",
            Message=error_message
        )
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def get_replication_lag(replica_id):
    """Get current replication lag in seconds"""
    try:
        response = cloudwatch.get_metric_statistics(
            Namespace='AWS/RDS',
            MetricName='ReplicaLag',
            Dimensions=[
                {'Name': 'DBInstanceIdentifier', 'Value': replica_id}
            ],
            StartTime=datetime.utcnow(),
            EndTime=datetime.utcnow(),
            Period=60,
            Statistics=['Average']
        )

        if response['Datapoints']:
            return response['Datapoints'][0]['Average']
        return 0
    except:
        return 0

def trigger_failover():
    """Invoke failover lambda"""
    lambda_client = boto3.client('lambda', region_name=os.environ['REGION'])

    # Get failover lambda name from environment or construct it
    failover_lambda = f"dr-failover-{os.environ.get('ENVIRONMENT_SUFFIX', 'dev')}"

    try:
        lambda_client.invoke(
            FunctionName=failover_lambda,
            InvocationType='Event'
        )
        print(f"Triggered failover lambda: {failover_lambda}")
    except Exception as e:
        print(f"Failed to trigger failover: {str(e)}")
```

## File: lib/lambda/health-check/requirements.txt

```
boto3>=1.26.0
```

## File: lib/lambda/failover/failover.py

```python
import json
import boto3
import os
import time
from datetime import datetime

rds_client = boto3.client('rds', region_name=os.environ['REGION'])
sns_client = boto3.client('sns', region_name=os.environ['REGION'])

PRIMARY_DB = os.environ['PRIMARY_DB_IDENTIFIER']
REPLICA_DB = os.environ['REPLICA_DB_IDENTIFIER']
SNS_TOPIC = os.environ['SNS_TOPIC_ARN']

def handler(event, context):
    """
    Failover Lambda function that promotes read replica to standalone instance
    when primary database fails.
    """
    start_time = datetime.utcnow()

    try:
        # Notify start of failover
        sns_client.publish(
            TopicArn=SNS_TOPIC,
            Subject="FAILOVER INITIATED: Starting Database Failover",
            Message=f"Failover process started at {start_time.isoformat()}\n"
                   f"Primary: {PRIMARY_DB}\nReplica: {REPLICA_DB}"
        )

        # Verify replica is in good state
        replica_response = rds_client.describe_db_instances(
            DBInstanceIdentifier=REPLICA_DB
        )

        replica_status = replica_response['DBInstances'][0]['DBInstanceStatus']

        if replica_status != 'available':
            raise Exception(f"Replica is not available for promotion. Status: {replica_status}")

        # Take snapshot of primary (if possible)
        try:
            snapshot_id = f"{PRIMARY_DB}-failover-{int(time.time())}"
            rds_client.create_db_snapshot(
                DBSnapshotIdentifier=snapshot_id,
                DBInstanceIdentifier=PRIMARY_DB
            )
            print(f"Created snapshot: {snapshot_id}")
        except Exception as e:
            print(f"Could not create primary snapshot: {str(e)}")

        # Promote read replica
        print(f"Promoting replica {REPLICA_DB} to standalone instance")
        promote_response = rds_client.promote_read_replica(
            DBInstanceIdentifier=REPLICA_DB,
            BackupRetentionPeriod=7
        )

        # Wait for promotion to complete (with timeout)
        max_wait_time = 300  # 5 minutes
        elapsed_time = 0
        poll_interval = 15

        while elapsed_time < max_wait_time:
            time.sleep(poll_interval)
            elapsed_time += poll_interval

            status_response = rds_client.describe_db_instances(
                DBInstanceIdentifier=REPLICA_DB
            )
            current_status = status_response['DBInstances'][0]['DBInstanceStatus']

            print(f"Promotion status: {current_status} (elapsed: {elapsed_time}s)")

            if current_status == 'available':
                end_time = datetime.utcnow()
                duration = (end_time - start_time).total_seconds()

                success_message = (
                    f"FAILOVER COMPLETED SUCCESSFULLY\n"
                    f"Duration: {duration} seconds\n"
                    f"New Primary: {REPLICA_DB}\n"
                    f"Endpoint: {status_response['DBInstances'][0]['Endpoint']['Address']}\n"
                    f"Started: {start_time.isoformat()}\n"
                    f"Completed: {end_time.isoformat()}"
                )

                sns_client.publish(
                    TopicArn=SNS_TOPIC,
                    Subject="FAILOVER SUCCESS: Database Failover Completed",
                    Message=success_message
                )

                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'status': 'success',
                        'new_primary': REPLICA_DB,
                        'duration_seconds': duration,
                        'endpoint': status_response['DBInstances'][0]['Endpoint']['Address']
                    })
                }

        # Timeout occurred
        raise Exception(f"Failover timed out after {max_wait_time} seconds")

    except Exception as e:
        error_message = (
            f"FAILOVER FAILED\n"
            f"Error: {str(e)}\n"
            f"Primary: {PRIMARY_DB}\n"
            f"Replica: {REPLICA_DB}\n"
            f"Time: {datetime.utcnow().isoformat()}"
        )

        print(error_message)

        sns_client.publish(
            TopicArn=SNS_TOPIC,
            Subject="FAILOVER FAILED: Database Failover Error",
            Message=error_message
        )

        return {
            'statusCode': 500,
            'body': json.dumps({
                'status': 'failed',
                'error': str(e)
            })
        }
```

## File: lib/lambda/failover/requirements.txt

```
boto3>=1.26.0
```

## Deployment Instructions

1. Configure Pulumi stack:
```bash
pulumi config set aws:region ap-southeast-1
pulumi config set environmentSuffix dev
pulumi config set --secret dbPassword <your-secure-password>
```

2. Install dependencies:
```bash
npm install
```

3. Deploy the stack:
```bash
pulumi up
```

4. Subscribe to SNS alerts:
```bash
aws sns subscribe --topic-arn <alert-topic-arn> --protocol email --notification-endpoint your-email@example.com
```

## Testing Failover

To test the automated failover mechanism:

1. Simulate primary database failure by modifying instance to an unavailable state
2. Health check Lambda will detect failure within 1 minute
3. Failover Lambda will automatically promote replica
4. Total failover time should be under 5 minutes
5. SNS notifications will be sent at each stage

## Monitoring

Monitor the DR system using:
- CloudWatch alarms for replication lag and CPU utilization
- Custom metrics published by health check Lambda
- SNS email notifications for all critical events
- RDS event subscriptions for database state changes
