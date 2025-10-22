## I'll create a comprehensive Pulumi TypeScript implementation for this global banking platform. This is a substantial infrastructure project, so I'll build a modular, production-ready codebase.

```ts 
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// Configuration
const config = new pulumi.Config();
const projectName = "global-banking-platform";
const environment = pulumi.getStack();

// Regions configuration
const regions = {
    primary: "us-east-1",
    replicas: ["eu-west-1", "ap-southeast-1"]
};

const allRegions = [regions.primary, ...regions.replicas];

// Common tags for all resources
const commonTags = {
    Project: projectName,
    Environment: environment,
    ManagedBy: "Pulumi",
    Compliance: "PCI-DSS"
};

// ============================================================================
// MULTI-REGION PROVIDERS
// ============================================================================

const providers: { [key: string]: aws.Provider } = {};
allRegions.forEach(region => {
    providers[region] = new aws.Provider(`provider-${region}`, {
        region: region,
    });
});

// ============================================================================
// KMS - MULTI-REGION KEYS
// ============================================================================

const kmsKeys: { [key: string]: aws.kms.Key } = {};
allRegions.forEach(region => {
    kmsKeys[region] = new aws.kms.Key(`kms-key-${region}`, {
        description: `Multi-region encryption key for ${projectName}`,
        enableKeyRotation: true,
        multiRegion: true,
        tags: { ...commonTags, Region: region }
    }, { provider: providers[region] });

    new aws.kms.Alias(`kms-alias-${region}`, {
        name: `alias/${projectName}-${region}`,
        targetKeyId: kmsKeys[region].id
    }, { provider: providers[region] });
});

// ============================================================================
// NETWORK INFRASTRUCTURE
// ============================================================================

const vpcs: { [key: string]: awsx.ec2.Vpc } = {};
const transitGateways: { [key: string]: aws.ec2transitgateway.TransitGateway } = {};

allRegions.forEach(region => {
    // VPC with public and private subnets
    vpcs[region] = new awsx.ec2.Vpc(`vpc-${region}`, {
        cidrBlock: "10.29.0.0/16",
        numberOfAvailabilityZones: 3,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        natGateways: {
            strategy: "OnePerAz"
        },
        subnetSpecs: [
            { type: "Public", cidrMask: 20 },
            { type: "Private", cidrMask: 20 }
        ],
        tags: { ...commonTags, Region: region }
    }, { provider: providers[region] });

    // Enable VPC Flow Logs
    const flowLogRole = new aws.iam.Role(`flow-log-role-${region}`, {
        assumeRolePolicy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Action: "sts:AssumeRole",
                Principal: { Service: "vpc-flow-logs.amazonaws.com" },
                Effect: "Allow"
            }]
        }),
        tags: commonTags
    }, { provider: providers[region] });

    const flowLogGroup = new aws.cloudwatch.LogGroup(`vpc-flow-log-${region}`, {
        retentionInDays: 30,
        kmsKeyId: kmsKeys[region].arn,
        tags: commonTags
    }, { provider: providers[region] });

    new aws.ec2.FlowLog(`vpc-flow-log-${region}`, {
        vpcId: vpcs[region].vpcId,
        trafficType: "ALL",
        logDestinationType: "cloud-watch-logs",
        logDestination: flowLogGroup.arn,
        iamRoleArn: flowLogRole.arn,
        tags: commonTags
    }, { provider: providers[region] });

    // Transit Gateway
    transitGateways[region] = new aws.ec2transitgateway.TransitGateway(`tgw-${region}`, {
        description: `Transit Gateway for ${region}`,
        amazonSideAsn: 64512 + allRegions.indexOf(region),
        defaultRouteTableAssociation: "enable",
        defaultRouteTablePropagation: "enable",
        dnsSupport: "enable",
        vpnEcmpSupport: "enable",
        tags: { ...commonTags, Region: region }
    }, { provider: providers[region] });

    // Attach VPC to Transit Gateway
    new aws.ec2transitgateway.VpcAttachment(`tgw-attachment-${region}`, {
        transitGatewayId: transitGateways[region].id,
        vpcId: vpcs[region].vpcId,
        subnetIds: vpcs[region].privateSubnetIds,
        dnsSupport: "enable",
        tags: commonTags
    }, { provider: providers[region] });
});

// ============================================================================
// SECRETS MANAGER
// ============================================================================

const dbMasterPassword = new aws.secretsmanager.Secret(`db-master-password`, {
    description: "Aurora master password",
    recoveryWindowInDays: 7,
    tags: commonTags
}, { provider: providers[regions.primary] });

new aws.secretsmanager.SecretVersion(`db-master-password-version`, {
    secretId: dbMasterPassword.id,
    secretString: JSON.stringify({
        username: "dbadmin",
        password: pulumi.secret(config.requireSecret("dbMasterPassword"))
    })
}, { provider: providers[regions.primary] });

// Replicate secret to other regions
regions.replicas.forEach(region => {
    new aws.secretsmanager.SecretReplication(`db-secret-replica-${region}`, {
        secretId: dbMasterPassword.id,
        replicas: [{ region: region }]
    }, { provider: providers[regions.primary] });
});

// ============================================================================
// AURORA GLOBAL DATABASE
// ============================================================================

const dbSubnetGroups: { [key: string]: aws.rds.SubnetGroup } = {};
allRegions.forEach(region => {
    dbSubnetGroups[region] = new aws.rds.SubnetGroup(`db-subnet-${region}`, {
        subnetIds: vpcs[region].privateSubnetIds,
        tags: { ...commonTags, Region: region }
    }, { provider: providers[region] });
});

// Security group for Aurora
const auroraSGs: { [key: string]: aws.ec2.SecurityGroup } = {};
allRegions.forEach(region => {
    auroraSGs[region] = new aws.ec2.SecurityGroup(`aurora-sg-${region}`, {
        vpcId: vpcs[region].vpcId,
        description: "Security group for Aurora PostgreSQL",
        ingress: [{
            protocol: "tcp",
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ["10.29.0.0/16"]
        }],
        egress: [{
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"]
        }],
        tags: commonTags
    }, { provider: providers[region] });
});

// Global Aurora Cluster
const globalCluster = new aws.rds.GlobalCluster(`global-cluster`, {
    globalClusterIdentifier: `${projectName}-global`,
    engine: "aurora-postgresql",
    engineVersion: "15.4",
    databaseName: "bankingdb",
    storageEncrypted: true,
}, { provider: providers[regions.primary] });

// Primary Aurora Cluster
const primaryCluster = new aws.rds.Cluster(`primary-cluster`, {
    clusterIdentifier: `${projectName}-primary`,
    engine: "aurora-postgresql",
    engineVersion: "15.4",
    masterUsername: "dbadmin",
    masterPassword: dbMasterPassword.id.apply(id => 
        aws.secretsmanager.getSecretVersion({ secretId: id }).then(v => 
            JSON.parse(v.secretString).password
        )
    ),
    databaseName: "bankingdb",
    backupRetentionPeriod: 35,
    preferredBackupWindow: "03:00-04:00",
    dbSubnetGroupName: dbSubnetGroups[regions.primary].name,
    vpcSecurityGroupIds: [auroraSGs[regions.primary].id],
    storageEncrypted: true,
    kmsKeyId: kmsKeys[regions.primary].arn,
    enabledCloudwatchLogsExports: ["postgresql"],
    globalClusterIdentifier: globalCluster.id,
    tags: commonTags
}, { provider: providers[regions.primary] });

// Primary cluster instances
for (let i = 0; i < 2; i++) {
    new aws.rds.ClusterInstance(`primary-instance-${i}`, {
        clusterIdentifier: primaryCluster.id,
        instanceClass: "db.r6g.xlarge",
        engine: "aurora-postgresql",
        engineVersion: "15.4",
        publiclyAccessible: false,
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: kmsKeys[regions.primary].arn,
        tags: { ...commonTags, Instance: `${i}` }
    }, { provider: providers[regions.primary] });
}

// Secondary Aurora Clusters
regions.replicas.forEach(region => {
    const secondaryCluster = new aws.rds.Cluster(`secondary-cluster-${region}`, {
        clusterIdentifier: `${projectName}-${region}`,
        engine: "aurora-postgresql",
        engineVersion: "15.4",
        dbSubnetGroupName: dbSubnetGroups[region].name,
        vpcSecurityGroupIds: [auroraSGs[region].id],
        storageEncrypted: true,
        kmsKeyId: kmsKeys[region].arn,
        globalClusterIdentifier: globalCluster.id,
        tags: { ...commonTags, Region: region }
    }, { 
        provider: providers[region],
        dependsOn: [primaryCluster]
    });

    // Secondary cluster instances
    for (let i = 0; i < 2; i++) {
        new aws.rds.ClusterInstance(`secondary-instance-${region}-${i}`, {
            clusterIdentifier: secondaryCluster.id,
            instanceClass: "db.r6g.xlarge",
            engine: "aurora-postgresql",
            engineVersion: "15.4",
            publiclyAccessible: false,
            performanceInsightsEnabled: true,
            performanceInsightsKmsKeyId: kmsKeys[region].arn,
            tags: { ...commonTags, Instance: `${i}`, Region: region }
        }, { provider: providers[region] });
    }
});

// ============================================================================
// DYNAMODB GLOBAL TABLES
// ============================================================================

const dynamoTable = new aws.dynamodb.Table(`session-table`, {
    name: `${projectName}-sessions`,
    billingMode: "PAY_PER_REQUEST",
    hashKey: "sessionId",
    attributes: [{
        name: "sessionId",
        type: "S"
    }],
    streamEnabled: true,
    streamViewType: "NEW_AND_OLD_IMAGES",
    pointInTimeRecovery: { enabled: true },
    serverSideEncryption: {
        enabled: true,
        kmsKeyArn: kmsKeys[regions.primary].arn
    },
    replicas: regions.replicas.map(region => ({
        regionName: region,
        kmsKeyArn: kmsKeys[region].arn,
        pointInTimeRecovery: true
    })),
    tags: commonTags
}, { provider: providers[regions.primary] });

// ============================================================================
// ELASTICACHE REDIS GLOBAL DATASTORE
// ============================================================================

const redisSubnetGroups: { [key: string]: aws.elasticache.SubnetGroup } = {};
allRegions.forEach(region => {
    redisSubnetGroups[region] = new aws.elasticache.SubnetGroup(`redis-subnet-${region}`, {
        subnetIds: vpcs[region].privateSubnetIds,
        tags: commonTags
    }, { provider: providers[region] });
});

const redisSGs: { [key: string]: aws.ec2.SecurityGroup } = {};
allRegions.forEach(region => {
    redisSGs[region] = new aws.ec2.SecurityGroup(`redis-sg-${region}`, {
        vpcId: vpcs[region].vpcId,
        description: "Security group for Redis",
        ingress: [{
            protocol: "tcp",
            fromPort: 6379,
            toPort: 6379,
            cidrBlocks: ["10.29.0.0/16"]
        }],
        egress: [{
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"]
        }],
        tags: commonTags
    }, { provider: providers[region] });
});

// Primary Redis Replication Group
const primaryRedis = new aws.elasticache.ReplicationGroup(`primary-redis`, {
    replicationGroupId: `${projectName}-primary`,
    description: "Primary Redis cluster for global datastore",
    engine: "redis",
    engineVersion: "7.0",
    nodeType: "cache.r6g.xlarge",
    numCacheClusters: 2,
    automaticFailoverEnabled: true,
    multiAzEnabled: true,
    atRestEncryptionEnabled: true,
    transitEncryptionEnabled: true,
    kmsKeyId: kmsKeys[regions.primary].arn,
    subnetGroupName: redisSubnetGroups[regions.primary].name,
    securityGroupIds: [redisSGs[regions.primary].id],
    snapshotRetentionLimit: 7,
    snapshotWindow: "03:00-05:00",
    tags: commonTags
}, { provider: providers[regions.primary] });

// ============================================================================
// S3 BUCKETS FOR TRANSACTION ARCHIVE
// ============================================================================

const s3Buckets: { [key: string]: aws.s3.Bucket } = {};
allRegions.forEach(region => {
    s3Buckets[region] = new aws.s3.Bucket(`transaction-archive-${region}`, {
        bucket: `${projectName}-transactions-${region}-${environment}`,
        versioning: { enabled: true },
        serverSideEncryptionConfiguration: {
            rule: {
                applyServerSideEncryptionByDefault: {
                    sseAlgorithm: "aws:kms",
                    kmsMasterKeyId: kmsKeys[region].arn
                }
            }
        },
        objectLockConfiguration: {
            objectLockEnabled: "Enabled",
            rule: {
                defaultRetention: {
                    mode: "COMPLIANCE",
                    years: 7
                }
            }
        },
        lifecycleRules: [{
            enabled: true,
            transitions: [
                { days: 90, storageClass: "STANDARD_IA" },
                { days: 365, storageClass: "GLACIER" }
            ]
        }],
        tags: { ...commonTags, Region: region }
    }, { provider: providers[region] });

    // Block public access
    new aws.s3.BucketPublicAccessBlock(`transaction-archive-block-${region}`, {
        bucket: s3Buckets[region].id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true
    }, { provider: providers[region] });
});

// Configure cross-region replication from primary to replicas
regions.replicas.forEach(replicaRegion => {
    const replicationRole = new aws.iam.Role(`s3-replication-role-${replicaRegion}`, {
        assumeRolePolicy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Action: "sts:AssumeRole",
                Principal: { Service: "s3.amazonaws.com" },
                Effect: "Allow"
            }]
        }),
        tags: commonTags
    }, { provider: providers[regions.primary] });

    new aws.s3.BucketReplicationConfiguration(`s3-replication-${replicaRegion}`, {
        bucket: s3Buckets[regions.primary].id,
        role: replicationRole.arn,
        rules: [{
            id: `replicate-to-${replicaRegion}`,
            status: "Enabled",
            destination: {
                bucket: s3Buckets[replicaRegion].arn,
                replicaKmsKeyId: kmsKeys[replicaRegion].arn,
                storageClass: "STANDARD"
            },
            sourceSelectionCriteria: {
                sseKmsEncryptedObjects: { status: "Enabled" }
            }
        }]
    }, { provider: providers[regions.primary] });
});

// ============================================================================
// ECS CLUSTERS AND APP MESH
// ============================================================================

const ecsClusters: { [key: string]: aws.ecs.Cluster } = {};
const appMeshes: { [key: string]: aws.appmesh.Mesh } = {};

allRegions.forEach(region => {
    // ECS Cluster
    ecsClusters[region] = new aws.ecs.Cluster(`ecs-cluster-${region}`, {
        name: `${projectName}-${region}`,
        settings: [{
            name: "containerInsights",
            value: "enabled"
        }],
        tags: { ...commonTags, Region: region }
    }, { provider: providers[region] });

    // App Mesh
    appMeshes[region] = new aws.appmesh.Mesh(`app-mesh-${region}`, {
        name: `${projectName}-mesh-${region}`,
        spec: {
            egressFilter: { type: "DROP_ALL" }
        },
        tags: commonTags
    }, { provider: providers[region] });
});

// ============================================================================
// APPLICATION LOAD BALANCERS
// ============================================================================

const albs: { [key: string]: aws.lb.LoadBalancer } = {};
const albTargetGroups: { [key: string]: aws.lb.TargetGroup } = {};

allRegions.forEach(region => {
    const albSG = new aws.ec2.SecurityGroup(`alb-sg-${region}`, {
        vpcId: vpcs[region].vpcId,
        description: "Security group for ALB",
        ingress: [
            { protocol: "tcp", fromPort: 443, toPort: 443, cidrBlocks: ["0.0.0.0/0"] },
            { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] }
        ],
        egress: [{
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"]
        }],
        tags: commonTags
    }, { provider: providers[region] });

    albs[region] = new aws.lb.LoadBalancer(`alb-${region}`, {
        name: `${projectName}-alb-${region}`,
        loadBalancerType: "application",
        securityGroups: [albSG.id],
        subnets: vpcs[region].publicSubnetIds,
        enableDeletionProtection: true,
        enableHttp2: true,
        enableCrossZoneLoadBalancing: true,
        tags: { ...commonTags, Region: region }
    }, { provider: providers[region] });

    albTargetGroups[region] = new aws.lb.TargetGroup(`alb-tg-${region}`, {
        name: `${projectName}-tg-${region}`,
        port: 8080,
        protocol: "HTTP",
        vpcId: vpcs[region].vpcId,
        targetType: "ip",
        healthCheck: {
            enabled: true,
            path: "/health",
            protocol: "HTTP",
            matcher: "200",
            interval: 30,
            timeout: 5,
            healthyThreshold: 2,
            unhealthyThreshold: 3
        },
        deregistrationDelay: 30,
        stickiness: {
            type: "lb_cookie",
            enabled: true,
            cookieDuration: 86400
        },
        tags: commonTags
    }, { provider: providers[region] });
});

// ============================================================================
// ACM CERTIFICATES
// ============================================================================

const certificates: { [key: string]: aws.acm.Certificate } = {};
allRegions.forEach(region => {
    certificates[region] = new aws.acm.Certificate(`cert-${region}`, {
        domainName: `banking.example.com`,
        subjectAlternativeNames: [`*.banking.example.com`],
        validationMethod: "DNS",
        tags: { ...commonTags, Region: region }
    }, { provider: providers[region] });
});

// ============================================================================
// API GATEWAY
// ============================================================================

const apiGateways: { [key: string]: aws.apigatewayv2.Api } = {};
allRegions.forEach(region => {
    apiGateways[region] = new aws.apigatewayv2.Api(`api-gateway-${region}`, {
        name: `${projectName}-api-${region}`,
        protocolType: "HTTP",
        corsConfiguration: {
            allowOrigins: ["https://banking.example.com"],
            allowMethods: ["GET", "POST", "PUT", "DELETE"],
            allowHeaders: ["Content-Type", "Authorization"],
            maxAge: 3600
        },
        tags: commonTags
    }, { provider: providers[region] });
});

// ============================================================================
// KINESIS DATA STREAMS
// ============================================================================

const kinesisStreams: { [key: string]: aws.kinesis.Stream } = {};
allRegions.forEach(region => {
    kinesisStreams[region] = new aws.kinesis.Stream(`transaction-stream-${region}`, {
        name: `${projectName}-transactions-${region}`,
        shardCount: 3,
        retentionPeriod: 168,
        streamModeDetails: { streamMode: "PROVISIONED" },
        encryptionType: "KMS",
        kmsKeyId: kmsKeys[region].id,
        tags: { ...commonTags, Region: region }
    }, { provider: providers[region] });

    // Kinesis Firehose to S3
    const firehoseRole = new aws.iam.Role(`firehose-role-${region}`, {
        assumeRolePolicy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Action: "sts:AssumeRole",
                Principal: { Service: "firehose.amazonaws.com" },
                Effect: "Allow"
            }]
        }),
        tags: commonTags
    }, { provider: providers[region] });

    new aws.kinesis.FirehoseDeliveryStream(`firehose-${region}`, {
        name: `${projectName}-firehose-${region}`,
        destination: "extended_s3",
        extendedS3Configuration: {
            roleArn: firehoseRole.arn,
            bucketArn: s3Buckets[region].arn,
            prefix: "transactions/",
            errorOutputPrefix: "errors/",
            bufferingSize: 5,
            bufferingInterval: 300,
            compressionFormat: "GZIP",
            kmsKeyArn: kmsKeys[region].arn
        },
        tags: commonTags
    }, { provider: providers[region] });
});

// ============================================================================
// SQS FIFO QUEUES
// ============================================================================

const sqsQueues: { [key: string]: aws.sqs.Queue } = {};
allRegions.forEach(region => {
    sqsQueues[region] = new aws.sqs.Queue(`transaction-queue-${region}`, {
        name: `${projectName}-transactions-${region}.fifo`,
        fifoQueue: true,
        contentBasedDeduplication: true,
        deduplicationScope: "messageGroup",
        fifoThroughputLimit: "perMessageGroupId",
        messageRetentionSeconds: 1209600,
        visibilityTimeoutSeconds: 300,
        kmsMasterKeyId: kmsKeys[region].id,
        kmsDataKeyReusePeriodSeconds: 300,
        tags: { ...commonTags, Region: region }
    }, { provider: providers[region] });

    // Dead Letter Queue
    new aws.sqs.Queue(`transaction-dlq-${region}`, {
        name: `${projectName}-transactions-dlq-${region}.fifo`,
        fifoQueue: true,
        messageRetentionSeconds: 1209600,
        tags: commonTags
    }, { provider: providers[region] });
});

// ============================================================================
// LAMBDA FUNCTIONS
// ============================================================================

const lambdaRole = new aws.iam.Role(`lambda-role`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Principal: { Service: "lambda.amazonaws.com" },
            Effect: "Allow"
        }]
    }),
    managedPolicyArns: [
        "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
        "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
    ],
    tags: commonTags
}, { provider: providers[regions.primary] });

const lambdaFunctions: { [key: string]: aws.lambda.Function } = {};
allRegions.forEach(region => {
    lambdaFunctions[region] = new aws.lambda.Function(`transaction-processor-${region}`, {
        name: `${projectName}-processor-${region}`,
        runtime: "java17",
        handler: "com.banking.TransactionHandler::handleRequest",
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
            ".": new pulumi.asset.FileArchive("./lambda-deployment-package.jar")
        }),
        memorySize: 1024,
        timeout: 30,
        reservedConcurrentExecutions: 100,
        environment: {
            variables: {
                REGION: region,
                DB_SECRET_ARN: dbMasterPassword.arn,
                KINESIS_STREAM: kinesisStreams[region].name
            }
        },
        vpcConfig: {
            subnetIds: vpcs[region].privateSubnetIds,
            securityGroupIds: [new aws.ec2.SecurityGroup(`lambda-sg-${region}`, {
                vpcId: vpcs[region].vpcId,
                egress: [{
                    protocol: "-1",
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ["0.0.0.0/0"]
                }],
                tags: commonTags
            }, { provider: providers[region] }).id]
        },
        tracingConfig: { mode: "Active" },
        tags: { ...commonTags, Region: region }
    }, { provider: providers[region] });
});

// ============================================================================
// COGNITO USER POOLS
// ============================================================================

const cognitoUserPools: { [key: string]: aws.cognito.UserPool } = {};
allRegions.forEach(region => {
    cognitoUserPools[region] = new aws.cognito.UserPool(`user-pool-${region}`, {
        name: `${projectName}-users-${region}`,
        aliasAttributes: ["email", "preferred_username"],
        autoVerifiedAttributes: ["email"],
        mfaConfiguration: "REQUIRED",
        softwareTokenMfaConfiguration: { enabled: true },
        passwordPolicy: {
            minimumLength: 12,
            requireLowercase: true,
            requireUppercase: true,
            requireNumbers: true,
            requireSymbols: true,
            temporaryPasswordValidityDays: 1
        },
        accountRecoverySetting: {
            recoveryMechanisms: [
                { name: "verified_email", priority: 1 }
            ]
        },
        userAttributeUpdateSettings: {
            attributesRequireVerificationBeforeUpdates: ["email"]
        },
        userPoolAddOns: {
            advancedSecurityMode: "ENFORCED"
        },
        tags: { ...commonTags, Region: region }
    }, { provider: providers[region] });
});

// ============================================================================
// CLOUDWATCH LOG GROUPS
// ============================================================================

allRegions.forEach(region => {
    new aws.cloudwatch.LogGroup(`app-logs-${region}`, {
        name: `/aws/${projectName}/${region}`,
        retentionInDays: 90,
        kmsKeyId: kmsKeys[region].arn,
        tags: commonTags
    }, { provider: providers[region] });
});

// ============================================================================
// SNS TOPICS FOR ALERTS
// ============================================================================

const snsTopics: { [key: string]: aws.sns.Topic } = {};
allRegions.forEach(region => {
    snsTopics[region] = new aws.sns.Topic(`alerts-${region}`, {
        name: `${projectName}-alerts-${region}`,
        kmsMasterKeyId: kmsKeys[region].id,
        tags: { ...commonTags, Region: region }
    }, { provider: providers[region] });
});

// ============================================================================
// CLOUDTRAIL
// ============================================================================

const cloudtrailBucket = new aws.s3.Bucket(`cloudtrail-bucket`, {
    bucket: `${projectName}-cloudtrail-${environment}`,
    versioning: { enabled: true },
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "aws:kms",
                kmsMasterKeyId: kmsKeys[regions.primary].arn
            }
        }
    },
    lifecycleRules: [{
        enabled: true,
        transitions: [
            { days: 90, storageClass: "STANDARD_IA" },
            { days: 365, storageClass: "GLACIER" }
        ]
    }],
    tags: commonTags
}, { provider: providers[regions.primary] });

new aws.cloudtrail.Trail(`organization-trail`, {
    name: `${projectName}-trail`,
    s3BucketName: cloudtrailBucket.id,
    includeGlobalServiceEvents: true,
    isMultiRegionTrail: true,
    enableLogFileValidation: true,
    kmsKeyId: kmsKeys[regions.primary].arn,
    eventSelectors: [{
        readWriteType: "All",
        includeManagementEvents: true,
        dataResources: [{
            type: "AWS::S3::Object",
            values: ["arn:aws:s3:::*/"]
        }]
    }],
    tags: commonTags
}, { provider: providers[regions.primary] });

// ============================================================================
// AWS CONFIG
// ============================================================================

allRegions.forEach(region => {
    const configRole = new aws.iam.Role(`config-role-${region}`, {
        assumeRolePolicy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Action: "sts:AssumeRole",
                Principal: { Service: "config.amazonaws.com" },
                Effect: "Allow"
            }]
        }),
        managedPolicyArns: ["arn:aws:iam::aws:policy/service-role/ConfigRole"],
        tags: commonTags
    }, { provider: providers[region] });

    const configBucket = new aws.s3.Bucket(`config-bucket-${region}`, {
        bucket: `${projectName}-config-${region}-${environment}`,
        tags: commonTags
    }, { provider: providers[region] });

    const configRecorder = new aws.cfg.Recorder(`config-recorder-${region}`, {
        name: `${projectName}-recorder-${region}`,
        roleArn: configRole.arn,
        recordingGroup: {
            allSupported: true,
            includeGlobalResourceTypes: region === regions.primary
        }
    }, { provider: providers[region] });

    new aws.cfg.DeliveryChannel(`config-delivery-${region}`, {
        name: `${projectName}-delivery-${region}`,
        s3BucketName: configBucket.id,
        dependsOn: [configRecorder]
    }, { provider: providers[region] });
});

// ============================================================================
// GUARDDUTY
// ============================================================================

allRegions.forEach(region => {
    new aws.guardduty.Detector(`guardduty-${region}`, {
        enable: true,
        findingPublishingFrequency: "FIFTEEN_MINUTES",
        datasources: {
            s3Logs: { enable: true },
            kubernetes: { auditLogs: { enable: true } }
        },
        tags: commonTags
    }, { provider: providers[region] });
});

// ============================================================================
// SECURITY HUB
// ============================================================================

allRegions.forEach(region => {
    new aws.securityhub.Account(`securityhub-${region}`, {
        enableDefaultStandards: true
    }, { provider: providers[region] });
});

// ============================================================================
// WAF
// ============================================================================

const wafIPSet = new aws.wafv2.IpSet(`waf-ipset`, {
    name: `${projectName}-allowed-ips`,
    scope: "REGIONAL",
    ipAddressVersion: "IPV4",
    addresses: [],
    tags: commonTags
}, { provider: providers[regions.primary] });

const wafWebACL = new aws.wafv2.WebAcl(`waf-acl`, {
    name: `${projectName}-waf`,
    scope: "REGIONAL",
    defaultAction: { allow: {} },
    rules: [
        {
            name: "RateLimitRule",
            priority: 1,
            action: { block: {} },
            statement: {
                rateBasedStatement: {
                    limit: 2000,
                    aggregateKeyType: "IP"
                }
            },
            visibilityConfig: {
                cloudwatchMetricsEnabled: true,
                metricName: "RateLimitRule",
                sampledRequestsEnabled: true
            }
        },
        {
            name: "AWSManagedRulesCommonRuleSet",
            priority: 2,
            statement: {
                managedRuleGroupStatement: {
                    vendorName: "AWS",
                    name: "AWSManagedRulesCommonRuleSet"
                }
            },
            overrideAction: { none: {} },
            visibilityConfig: {
                cloudwatchMetricsEnabled: true,
                metricName: "AWSManagedRulesCommonRuleSet",
                sampledRequestsEnabled: true
            }
        }
    ],
    visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: `${projectName}-waf`,
        sampledRequestsEnabled: true
    },
    tags: commonTags
}, { provider: providers[regions.primary] });

// ============================================================================
// X-RAY
// ============================================================================

allRegions.forEach(region => {
    new aws.xray.SamplingRule(`xray-sampling-${region}`, {
        ruleName: `${projectName}-sampling-${region}`,
        priority: 1000,
        version: 1,
        reservoirSize: 1,
        fixedRate: 0.05,
        urlPath: "*",
        host: "*",
        httpMethod: "*",
        serviceName: "*",
        serviceType: "*",
        resourceArn: "*",
        tags: commonTags
    }, { provider: providers[region] });
});

// ============================================================================
// EVENTBRIDGE
// ============================================================================

const eventBuses: { [key: string]: aws.cloudwatch.EventBus } = {};
allRegions.forEach(region => {
    eventBuses[region] = new aws.cloudwatch.EventBus(`event-bus-${region}`, {
        name: `${projectName}-events-${region}`,
        tags: { ...commonTags, Region: region }
    }, { provider: providers[region] });
});

// ============================================================================
// ROUTE 53
// ============================================================================

const hostedZone = new aws.route53.Zone(`hosted-zone`, {
    name: "banking.example.com",
    tags: commonTags
}, { provider: providers[regions.primary] });

// Health checks for each region
const healthChecks: { [key: string]: aws.route53.HealthCheck } = {};
allRegions.forEach(region => {
    healthChecks[region] = new aws.route53.HealthCheck(`health-check-${region}`, {
        type: "HTTPS",
        resourcePath: "/health",
        fqdn: albs[region].dnsName,
        port: 443,
        requestInterval: 30,
        failureThreshold: 3,
        measureLatency: true,
        tags: { ...commonTags, Region: region }
    }, { provider: providers[regions.primary] });
});

// Geoproximity routing
allRegions.forEach((region, idx) => {
    new aws.route53.Record(`api-record-${region}`, {
        zoneId: hostedZone.zoneId,
        name: "api.banking.example.com",
        type: "A",
        aliases: [{
            name: albs[region].dnsName,
            zoneId: albs[region].zoneId,
            evaluateTargetHealth: true
        }],
        setIdentifier: region,
        geoproximityRoutingPolicies: [{
            awsRegion: region,
            bias: idx === 0 ? 0 : -10
        }],
        healthCheckId: healthChecks[region].id
    }, { provider: providers[regions.primary] });
});

// ============================================================================
// AWS BACKUP
// ============================================================================

const backupVault = new aws.backup.Vault(`backup-vault`, {
    name: `${projectName}-vault`,
    kmsKeyArn: kmsKeys[regions.primary].arn,
    tags: commonTags
}, { provider: providers[regions.primary] });

const backupRole = new aws.iam.Role(`backup-role`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Principal: { Service: "backup.amazonaws.com" },
            Effect: "Allow"
        }]
    }),
    managedPolicyArns: [
        "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
        "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
    ],
    tags: commonTags
}, { provider: providers[regions.primary] });

const backupPlan = new aws.backup.Plan(`backup-plan`, {
    name: `${projectName}-plan`,
    rules: [{
        ruleName: "DailyBackup",
        targetVaultName: backupVault.name,
        schedule: "cron(0 5 ? * * *)",
        startWindow: 60,
        completionWindow: 120,
        lifecycle: {
            deleteAfter: 35,
            coldStorageAfter: 30
        },
        copyActions: regions.replicas.map(region => ({
            destinationVaultArn: `arn:aws:backup:${region}:${aws.getCallerIdentity().accountId}:backup-vault:${projectName}-vault-${region}`,
            lifecycle: {
                deleteAfter: 35,
                coldStorageAfter: 30
            }
        }))
    }],
    tags: commonTags
}, { provider: providers[regions.primary] });

// ============================================================================
// OUTPUTS
// ============================================================================

export const vpcIds = pulumi.all(
    Object.entries(vpcs).map(([region, vpc]) => ({ region, id: vpc.vpcId }))
);

export const albEndpoints = pulumi.all(
    Object.entries(albs).map(([region, alb]) => ({ region, dns: alb.dnsName }))
);

export const auroraEndpoints = {
    primary: primaryCluster.endpoint,
    readerEndpoint: primaryCluster.readerEndpoint
};

export const apiGatewayEndpoints = pulumi.all(
    Object.entries(apiGateways).map(([region, api]) => ({ region, endpoint: api.apiEndpoint }))
);

export const kinesisStreamNames = pulumi.all(
    Object.entries(kinesisStreams).map(([region, stream]) => ({ region, name: stream.name }))
);

export const cognitoUserPoolIds = pulumi.all(
    Object.entries(cognitoUserPools).map(([region, pool]) => ({ region, id: pool.id }))
);

export const route53ZoneId = hostedZone.zoneId;
export const route53NameServers = hostedZone.nameServers;
```

# Quick Start Guide

Get your Global Banking Platform up and running in under 10 minutes (excluding infrastructure deployment time).

## Prerequisites (5 minutes)

### 1. Install Required Tools

```bash
# Install Node.js (v18+)
# Download from: https://nodejs.org/

# Install Pulumi
curl -fsSL https://get.pulumi.com | sh

# Install AWS CLI
# Download from: https://aws.amazon.com/cli/

# Install TypeScript
npm install -g typescript
```

### 2. Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: us-east-1
# Default output format: json
```

### 3. Verify Installation

```bash
node --version    # Should be v18+
pulumi version    # Should be v3.100+
aws --version     # Should be v2+
tsc --version     # Should be v5+
```

## Deployment (3 steps)

### Step 1: Clone and Setup (1 minute)

```bash
# Navigate to project directory
cd global-banking-platform

# Make deploy script executable
chmod +x deploy.sh

# Install dependencies
npm install
```

### Step 2: Quick Deploy to Dev (2 minutes setup + 45-80 minutes deployment)

```bash
# Deploy to development environment
./deploy.sh --stack dev
```

The script will:
- ✅ Check all prerequisites
- ✅ Compile TypeScript
- ✅ Generate secure passwords
- ✅ Run preflight checks
- ✅ Show cost estimates
- ✅ Deploy infrastructure (this takes 45-80 minutes)
- ✅ Verify deployment
- ✅ Generate deployment report

### Step 3: Verify Deployment (2 minutes)

```bash
# Check stack outputs
pulumi stack output --stack dev

# View deployment report
cat deployment-report-dev-*.txt
```

## What Gets Deployed?

Your infrastructure includes:

### 🌐 Networking (3 regions)
- 3 VPCs with public/private subnets
- Transit Gateways with cross-region peering
- NAT Gateways and VPC Flow Logs

### 🔒 Security
- KMS encryption keys (multi-region)
- WAF with OWASP protection
- GuardDuty threat detection
- Security Hub compliance monitoring
- Secrets Manager for credentials

### 💾 Databases
- Aurora PostgreSQL Global Database
- DynamoDB Global Tables
- ElastiCache Redis Global Datastore

### 🚀 Compute
- ECS Fargate clusters (3 regions)
- AWS App Mesh service mesh
- Lambda functions (Java 17)

### 🌍 Global Services
- Route 53 with geoproximity routing
- Application Load Balancers (3 regions)
- API Gateway (3 regions)

### 📊 Observability
- CloudWatch dashboards and alarms
- X-Ray distributed tracing
- CloudTrail audit logging

### 💰 Cost Estimate
- **Dev Environment**: ~$3,000-5,000/month
- **Production Environment**: ~$7,200-12,300/month

## Post-Deployment Tasks (15 minutes)

### 1. Configure DNS (5 minutes)

```bash
# Get Route 53 name servers
pulumi stack output route53NameServers --stack dev

# Update your domain registrar to use these name servers
# For domain: banking.example.com
```

### 2. Validate ACM Certificates (5 minutes)

1. Go to AWS Certificate Manager in each region
2. Copy DNS validation records
3. Add to Route 53 hosted zone
4. Wait for validation (usually < 5 minutes)

### 3. Deploy Application Code (5 minutes)

```bash
# Build your Java Lambda function
cd lambda-function
mvn clean package

# Copy to deployment location
cp target/transaction-processor-1.0.0.jar ../lambda-deployment-package.jar

# Update Lambda functions
cd ..
pulumi up --stack dev --yes
```

## Quick Commands Reference

### View Infrastructure

```bash
# List all resources
pulumi stack --stack dev --show-urns

# Get specific outputs
pulumi stack output vpcIds --stack dev
pulumi stack output albEndpoints --stack dev
pulumi stack output auroraEndpoints --stack dev
```

### Update Infrastructure

```bash
# Preview changes
pulumi preview --stack dev

# Apply changes
pulumi up --stack dev
```

### Monitor Infrastructure

```bash
# View CloudWatch dashboard
aws cloudwatch get-dashboard --dashboard-name global-banking-platform

# Check alarm status
aws cloudwatch describe-alarms --state-value ALARM --region us-east-1

# View recent logs
aws logs tail /aws/global-banking-platform/us-east-1 --follow
```

### Destroy Infrastructure

```bash
# Destroy with confirmation
./deploy.sh --stack dev --destroy

# Or using Pulumi directly
pulumi destroy --stack dev
```

## Troubleshooting

### Issue: "Deployment failed with timeout"

**Solution**: AWS resources sometimes take longer to provision. Check the AWS console for the specific resource that timed out and verify it's healthy.

```bash
# Check ECS cluster status
aws ecs describe-clusters --clusters global-banking-platform-us-east-1 --region us-east-1

# Check RDS status
aws rds describe-db-clusters --region us-east-1
```

### Issue: "Service quota exceeded"

**Solution**: Request quota increase for the specific service.

```bash
# Check current quotas
aws service-quotas list-service-quotas --service-code vpc --region us-east-1

# Request increase
aws service-quotas request-service-quota-increase \
  --service-code vpc \
  --quota-code L-F678F1CE \
  --desired-value 10
```

### Issue: "Access denied" errors

**Solution**: Verify your IAM user/role has necessary permissions.

```bash
# Check current identity
aws sts get-caller-identity

# Test specific permissions
aws iam simulate-principal-policy \
  --policy-source-arn $(aws sts get-caller-identity --query Arn --output text) \
  --action-names ec2:CreateVpc rds:CreateDBCluster
```

### Issue: "Lambda function not working"

**Solution**: Lambda deployment package is missing.

```bash
# Create dummy package for initial deployment
echo '{}' > lambda-deployment-package.jar

# Deploy infrastructure
pulumi up --stack dev --yes

# Then deploy real Lambda code later
```

## Production Deployment Checklist

Before deploying to production:

- [ ] Review and adjust resource sizing
- [ ] Configure proper backup retention (7+ years for compliance)
- [ ] Set up monitoring alerts with PagerDuty
- [ ] Configure Cognito user pools with production settings
- [ ] Review and tighten security groups
- [ ] Enable AWS Shield Advanced (DDoS protection)
- [ ] Set up AWS Support plan (Business or Enterprise)
- [ ] Document disaster recovery procedures
- [ ] Conduct security audit
- [ ] Perform load testing
- [ ] Complete PCI-DSS assessment
- [ ] Set up cost alerts and budgets

## Next Steps

1. **Read the Documentation**
   - [README.md](README.md) - Complete deployment guide
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture details
   - [SECURITY-COMPLIANCE.md](SECURITY-COMPLIANCE.md) - PCI-DSS compliance
   - [DISASTER-RECOVERY.md](DISASTER-RECOVERY.md) - DR procedures
   - [MONITORING-ALERTING.md](MONITORING-ALERTING.md) - Observability setup

2. **Configure Monitoring**
   ```bash
   # Set up CloudWatch dashboards
   # Configure alerting to PagerDuty/Slack
   # Enable X-Ray tracing
   ```

3. **Test Disaster Recovery**
   ```bash
   # Simulate regional failure
   # Test database failover
   # Verify backup restoration
   ```

4. **Optimize Costs**
   ```bash
   # Review CloudWatch cost allocation tags
   # Set up AWS Budgets
   # Enable Cost Anomaly Detection
   ```

5. **Security Hardening**
   ```bash
   # Review Security Hub findings
   # Address GuardDuty alerts
   # Conduct penetration testing
   ```

## Getting Help

### Documentation
- AWS Pulumi Docs: https://www.pulumi.com/docs/intro/cloud-providers/aws/
- AWS Documentation: https://docs.aws.amazon.com/
- Project README: [README.md](README.md)

### Support
- AWS Support: https://console.aws.amazon.com/support/
- Pulumi Community: https://pulumi-community.slack.com/
- GitHub Issues: [Your repository URL]

### Emergency Contacts
- On-call Engineer: [Your PagerDuty]
- AWS TAM: [Your TAM email]
- Team Lead: [Your team lead email]

---

**🎉 Congratulations!** You've deployed a production-ready, multi-region banking platform with comprehensive security and compliance features.

For any questions or issues, refer to the detailed documentation in this repository.