package app;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.BundlingOptions;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.apigatewayv2.WebSocketApi;
import software.amazon.awscdk.services.apigatewayv2.WebSocketStage;
import software.amazon.awscdk.services.autoscaling.AutoScalingGroup;
import software.amazon.awscdk.services.autoscaling.CpuUtilizationScalingProps;
import software.amazon.awscdk.services.autoscaling.NetworkUtilizationScalingProps;
import software.amazon.awscdk.services.cloudfront.AllowedMethods;
import software.amazon.awscdk.services.s3.assets.AssetOptions;
import software.amazon.awscdk.services.cloudfront.BehaviorOptions;
import software.amazon.awscdk.services.cloudfront.CachePolicy;
import software.amazon.awscdk.services.cloudfront.Distribution;
import software.amazon.awscdk.services.cloudfront.OriginAccessIdentity;
import software.amazon.awscdk.services.cloudfront.ViewerProtocolPolicy;
import software.amazon.awscdk.services.cloudfront.origins.S3Origin;
import software.amazon.awscdk.services.cloudwatch.Alarm;
import software.amazon.awscdk.services.cloudwatch.ComparisonOperator;
import software.amazon.awscdk.services.cloudwatch.Metric;
import software.amazon.awscdk.services.cloudwatch.TreatMissingData;
import software.amazon.awscdk.services.cloudwatch.actions.SnsAction;
import software.amazon.awscdk.services.dynamodb.Attribute;
import software.amazon.awscdk.services.dynamodb.AttributeType;
import software.amazon.awscdk.services.dynamodb.BillingMode;
import software.amazon.awscdk.services.dynamodb.GlobalSecondaryIndexProps;
import software.amazon.awscdk.services.dynamodb.ProjectionType;
import software.amazon.awscdk.services.dynamodb.Table;
import software.amazon.awscdk.services.ec2.AmazonLinuxCpuType;
import software.amazon.awscdk.services.ec2.AmazonLinuxGeneration;
import software.amazon.awscdk.services.ec2.AmazonLinuxImage;
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceSize;
import software.amazon.awscdk.services.ec2.InstanceType;
import software.amazon.awscdk.services.ec2.IVpc;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetSelection;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.UserData;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.elasticache.CfnReplicationGroup;
import software.amazon.awscdk.services.elasticache.CfnSubnetGroup;
import software.amazon.awscdk.services.elasticloadbalancingv2.AddApplicationTargetsProps;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationListener;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancer;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationProtocol;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationTargetGroup;
import software.amazon.awscdk.services.elasticloadbalancingv2.HealthCheck;
import software.amazon.awscdk.services.elasticloadbalancingv2.ListenerAction;
import software.amazon.awscdk.services.elasticloadbalancingv2.TargetType;
import software.amazon.awscdk.services.elasticloadbalancingv2.targets.LambdaTarget;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.PolicyDocument;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.amazon.awscdk.services.rds.AuroraPostgresEngineVersion;
import software.amazon.awscdk.services.rds.ClusterInstance;
import software.amazon.awscdk.services.rds.Credentials;
import software.amazon.awscdk.services.rds.DatabaseCluster;
import software.amazon.awscdk.services.rds.DatabaseClusterEngine;
import software.amazon.awscdk.services.rds.IClusterInstance;
import software.amazon.awscdk.services.rds.InstanceUpdateBehaviour;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.LifecycleRule;
import software.amazon.awscdk.services.s3.StorageClass;
import software.amazon.awscdk.services.sagemaker.CfnEndpoint;
import software.amazon.awscdk.services.sagemaker.CfnEndpointConfig;
import software.amazon.awscdk.services.sagemaker.CfnModel;
import software.amazon.awscdk.services.sns.Topic;
import software.constructs.Construct;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 */
final class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;
    private final Integer minInstances;
    private final Integer maxInstances;
    private final Integer auroraReadReplicas;

    private TapStackProps(final String envSuffix, final StackProps props, 
                         final Integer minInst, final Integer maxInst, final Integer readReplicas) {
        this.environmentSuffix = envSuffix;
        this.stackProps = props != null ? props : StackProps.builder().build();
        this.minInstances = minInst != null ? minInst : 100;
        this.maxInstances = maxInst != null ? maxInst : 800;
        this.auroraReadReplicas = readReplicas != null ? readReplicas : 2;
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public StackProps getStackProps() {
        return stackProps;
    }

    public Integer getMinInstances() {
        return minInstances;
    }

    public Integer getMaxInstances() {
        return maxInstances;
    }

    public Integer getAuroraReadReplicas() {
        return auroraReadReplicas;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String environmentSuffix;
        private StackProps stackProps;
        private Integer minInstances;
        private Integer maxInstances;
        private Integer auroraReadReplicas;

        public Builder environmentSuffix(final String suffix) {
            this.environmentSuffix = suffix;
            return this;
        }

        public Builder stackProps(final StackProps props) {
            this.stackProps = props;
            return this;
        }

        public Builder minInstances(final Integer min) {
            this.minInstances = min;
            return this;
        }

        public Builder maxInstances(final Integer max) {
            this.maxInstances = max;
            return this;
        }

        public Builder auroraReadReplicas(final Integer replicas) {
            this.auroraReadReplicas = replicas;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(environmentSuffix, stackProps, minInstances, maxInstances, auroraReadReplicas);
        }
    }
}

/**
 * Configuration object for DatabaseStack to reduce parameter count.
 */
final class DatabaseStackConfig {
    private final IVpc vpc;
    private final SecurityGroup rdsSecurityGroup;
    private final Key kmsKey;
    private final Integer readReplicas;

    DatabaseStackConfig(final IVpc vpcParam, final SecurityGroup rdsSecurityGroupParam, 
                       final Key kmsKeyParam, final Integer readReplicasParam) {
        this.vpc = vpcParam;
        this.rdsSecurityGroup = rdsSecurityGroupParam;
        this.kmsKey = kmsKeyParam;
        this.readReplicas = readReplicasParam;
    }

    public IVpc getVpc() {
        return vpc;
    }

    public SecurityGroup getRdsSecurityGroup() {
        return rdsSecurityGroup;
    }

    public Key getKmsKey() {
        return kmsKey;
    }

    public Integer getReadReplicas() {
        return readReplicas;
    }
}

/**
 * Configuration object for ComputeStack to reduce parameter count.
 */
final class ComputeStackConfig {
    private final IVpc vpc;
    private final SecurityGroup albSecurityGroup;
    private final SecurityGroup ec2SecurityGroup;
    private final Key kmsKey;
    private final Integer minInstances;
    private final Integer maxInstances;
    private final Topic alertTopic;

    ComputeStackConfig(final IVpc vpcParam, final SecurityGroup albSecurityGroupParam,
                      final SecurityGroup ec2SecurityGroupParam, final Key kmsKeyParam,
                      final Integer minInstancesParam, final Integer maxInstancesParam,
                      final Topic alertTopicParam) {
        this.vpc = vpcParam;
        this.albSecurityGroup = albSecurityGroupParam;
        this.ec2SecurityGroup = ec2SecurityGroupParam;
        this.kmsKey = kmsKeyParam;
        this.minInstances = minInstancesParam;
        this.maxInstances = maxInstancesParam;
        this.alertTopic = alertTopicParam;
    }

    public IVpc getVpc() {
        return vpc;
    }

    public SecurityGroup getAlbSecurityGroup() {
        return albSecurityGroup;
    }

    public SecurityGroup getEc2SecurityGroup() {
        return ec2SecurityGroup;
    }

    public Key getKmsKey() {
        return kmsKey;
    }

    public Integer getMinInstances() {
        return minInstances;
    }

    public Integer getMaxInstances() {
        return maxInstances;
    }

    public Topic getAlertTopic() {
        return alertTopic;
    }
}

/**
 * Security Infrastructure Stack with KMS for encryption
 */
class SecurityStack extends Stack {
    private final Key kmsKey;
    private final Topic alertTopic;

    SecurityStack(final Construct scope, final String id, final String environmentSuffix, final StackProps props) {
        super(scope, id, props);

        // Create KMS Key for encryption
        this.kmsKey = Key.Builder.create(this, "SocialPlatformKmsKey")
                .description("KMS key for social platform infrastructure encryption - " + environmentSuffix)
                .enableKeyRotation(true)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // Create SNS topic for alerts
        this.alertTopic = Topic.Builder.create(this, "AlertTopic")
                .topicName("social-platform-" + environmentSuffix + "-alerts")
                .displayName("Social Platform Infrastructure Alerts")
                .masterKey(kmsKey)
                .build();

        Tags.of(this).add("project", "social-platform");
        Tags.of(this).add("environment", environmentSuffix);
    }

    public Key getKmsKey() {
        return kmsKey;
    }

    public Topic getAlertTopic() {
        return alertTopic;
    }
}

/**
 * Network Infrastructure Stack with VPC and Security Groups
 */
class NetworkStack extends Stack {
    private final Vpc vpc;
    private final SecurityGroup albSecurityGroup;
    private final SecurityGroup ec2SecurityGroup;
    private final SecurityGroup rdsSecurityGroup;
    private final SecurityGroup elasticacheSecurityGroup;

    NetworkStack(final Construct scope, final String id, final String environmentSuffix, final StackProps props) {
        super(scope, id, props);

        // Create VPC with public and private subnets across 3 AZs
        this.vpc = Vpc.Builder.create(this, "SocialPlatformVpc")
                .vpcName("social-platform-" + environmentSuffix + "-vpc")
                .maxAzs(3)
                .natGateways(3)
                .subnetConfiguration(Arrays.asList(
                        SubnetConfiguration.builder()
                                .name("Public")
                                .subnetType(SubnetType.PUBLIC)
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .name("Private")
                                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .name("Isolated")
                                .subnetType(SubnetType.PRIVATE_ISOLATED)
                                .cidrMask(24)
                                .build()
                ))
                .build();

        // ALB Security Group
        this.albSecurityGroup = SecurityGroup.Builder.create(this, "AlbSecurityGroup")
                .vpc(vpc)
                .description("Security group for Application Load Balancer")
                .allowAllOutbound(true)
                .build();
        albSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "Allow HTTP");
        albSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(443), "Allow HTTPS");

        // EC2 Security Group
        this.ec2SecurityGroup = SecurityGroup.Builder.create(this, "Ec2SecurityGroup")
                .vpc(vpc)
                .description("Security group for EC2 instances")
                .allowAllOutbound(true)
                .build();
        ec2SecurityGroup.addIngressRule(albSecurityGroup, Port.tcp(8080), "Allow traffic from ALB");

        // RDS Security Group
        this.rdsSecurityGroup = SecurityGroup.Builder.create(this, "RdsSecurityGroup")
                .vpc(vpc)
                .description("Security group for Aurora PostgreSQL")
                .allowAllOutbound(false)
                .build();
        rdsSecurityGroup.addIngressRule(ec2SecurityGroup, Port.tcp(5432), "Allow PostgreSQL from EC2");

        // ElastiCache Security Group
        this.elasticacheSecurityGroup = SecurityGroup.Builder.create(this, "ElasticacheSecurityGroup")
                .vpc(vpc)
                .description("Security group for ElastiCache Redis")
                .allowAllOutbound(false)
                .build();
        elasticacheSecurityGroup.addIngressRule(ec2SecurityGroup, Port.tcp(6379), "Allow Redis from EC2");

        Tags.of(this).add("project", "social-platform");
        Tags.of(this).add("environment", environmentSuffix);
    }

    public Vpc getVpc() {
        return vpc;
    }

    public SecurityGroup getAlbSecurityGroup() {
        return albSecurityGroup;
    }

    public SecurityGroup getEc2SecurityGroup() {
        return ec2SecurityGroup;
    }

    public SecurityGroup getRdsSecurityGroup() {
        return rdsSecurityGroup;
    }

    public SecurityGroup getElasticacheSecurityGroup() {
        return elasticacheSecurityGroup;
    }
}

/**
 * Database Stack with Aurora PostgreSQL and DynamoDB
 */
class DatabaseStack extends Stack {
    private final DatabaseCluster auroraCluster;
    private final Table userGraphTable;
    private final Table postTable;

    DatabaseStack(final Construct scope, final String id, final String environmentSuffix,
                  final DatabaseStackConfig config, final StackProps props) {
        super(scope, id, props);

        // Create Aurora PostgreSQL Cluster with read replicas
        this.auroraCluster = createAuroraCluster(environmentSuffix, config.getVpc(), 
                config.getRdsSecurityGroup(), config.getKmsKey(), config.getReadReplicas());

        // Create DynamoDB table for user graph
        this.userGraphTable = createUserGraphTable(environmentSuffix, config.getKmsKey());

        // Create DynamoDB table for posts
        this.postTable = createPostTable(environmentSuffix, config.getKmsKey());

        Tags.of(this).add("project", "social-platform");
        Tags.of(this).add("environment", environmentSuffix);
    }

    private DatabaseCluster createAuroraCluster(final String environmentSuffix, final IVpc vpc,
                                                final SecurityGroup securityGroup, final Key kmsKey,
                                                final Integer readReplicas) {
        // Create writer instance
        IClusterInstance writerInstance = ClusterInstance.provisioned("writer", 
                software.amazon.awscdk.services.rds.ProvisionedClusterInstanceProps.builder()
                        .instanceType(InstanceType.of(InstanceClass.MEMORY6_GRAVITON, InstanceSize.LARGE))
                        .build());

        // Create reader instances
        List<IClusterInstance> readers = new java.util.ArrayList<>();
        for (int i = 0; i < readReplicas; i++) {
            readers.add(ClusterInstance.provisioned("reader" + i,
                    software.amazon.awscdk.services.rds.ProvisionedClusterInstanceProps.builder()
                            .instanceType(InstanceType.of(InstanceClass.MEMORY6_GRAVITON, InstanceSize.LARGE))
                            .build()));
        }

        return DatabaseCluster.Builder.create(this, "AuroraCluster")
                .engine(DatabaseClusterEngine.auroraPostgres(
                        software.amazon.awscdk.services.rds.AuroraPostgresClusterEngineProps.builder()
                                .version(AuroraPostgresEngineVersion.VER_15_4)
                                .build()))
                .writer(writerInstance)
                .readers(readers)
                .credentials(Credentials.fromGeneratedSecret("postgres"))
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_ISOLATED)
                        .build())
                .securityGroups(Arrays.asList(securityGroup))
                .storageEncrypted(true)
                .storageEncryptionKey(kmsKey)
                .backup(software.amazon.awscdk.services.rds.BackupProps.builder()
                        .retention(Duration.days(7))
                        .preferredWindow("03:00-04:00")
                        .build())
                .cloudwatchLogsExports(Arrays.asList("postgresql"))
                .cloudwatchLogsRetention(RetentionDays.ONE_MONTH)
                .monitoringInterval(Duration.seconds(60))
                .enablePerformanceInsights(true)
                .instanceUpdateBehaviour(InstanceUpdateBehaviour.ROLLING)
                .removalPolicy(RemovalPolicy.SNAPSHOT)
                .build();
    }

    private Table createUserGraphTable(final String environmentSuffix, final Key kmsKey) {
        Table table = Table.Builder.create(this, "UserGraphTable")
                .tableName("social-platform-" + environmentSuffix + "-user-graph")
                .partitionKey(Attribute.builder()
                        .name("userId")
                        .type(AttributeType.STRING)
                        .build())
                .sortKey(Attribute.builder()
                        .name("friendId")
                        .type(AttributeType.STRING)
                        .build())
                .billingMode(BillingMode.PAY_PER_REQUEST)
                .encryption(software.amazon.awscdk.services.dynamodb.TableEncryption.CUSTOMER_MANAGED)
                .encryptionKey(kmsKey)
                .pointInTimeRecovery(true)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // Add GSI for reverse lookup
        table.addGlobalSecondaryIndex(GlobalSecondaryIndexProps.builder()
                .indexName("FriendUserIndex")
                .partitionKey(Attribute.builder()
                        .name("friendId")
                        .type(AttributeType.STRING)
                        .build())
                .sortKey(Attribute.builder()
                        .name("userId")
                        .type(AttributeType.STRING)
                        .build())
                .projectionType(ProjectionType.ALL)
                .build());

        // Add GSI for connection timestamp queries
        table.addGlobalSecondaryIndex(GlobalSecondaryIndexProps.builder()
                .indexName("UserConnectionTimeIndex")
                .partitionKey(Attribute.builder()
                        .name("userId")
                        .type(AttributeType.STRING)
                        .build())
                .sortKey(Attribute.builder()
                        .name("connectionTimestamp")
                        .type(AttributeType.NUMBER)
                        .build())
                .projectionType(ProjectionType.ALL)
                .build());

        return table;
    }

    private Table createPostTable(final String environmentSuffix, final Key kmsKey) {
        Table table = Table.Builder.create(this, "PostTable")
                .tableName("social-platform-" + environmentSuffix + "-posts")
                .partitionKey(Attribute.builder()
                        .name("postId")
                        .type(AttributeType.STRING)
                        .build())
                .billingMode(BillingMode.PAY_PER_REQUEST)
                .encryption(software.amazon.awscdk.services.dynamodb.TableEncryption.CUSTOMER_MANAGED)
                .encryptionKey(kmsKey)
                .pointInTimeRecovery(true)
                .stream(software.amazon.awscdk.services.dynamodb.StreamViewType.NEW_AND_OLD_IMAGES)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // Add GSI for user posts
        table.addGlobalSecondaryIndex(GlobalSecondaryIndexProps.builder()
                .indexName("UserPostsIndex")
                .partitionKey(Attribute.builder()
                        .name("userId")
                        .type(AttributeType.STRING)
                        .build())
                .sortKey(Attribute.builder()
                        .name("timestamp")
                        .type(AttributeType.NUMBER)
                        .build())
                .projectionType(ProjectionType.ALL)
                .build());

        // Add GSI for viral content detection
        table.addGlobalSecondaryIndex(GlobalSecondaryIndexProps.builder()
                .indexName("ViralContentIndex")
                .partitionKey(Attribute.builder()
                        .name("viralScore")
                        .type(AttributeType.NUMBER)
                        .build())
                .sortKey(Attribute.builder()
                        .name("timestamp")
                        .type(AttributeType.NUMBER)
                        .build())
                .projectionType(ProjectionType.ALL)
                .build());

        return table;
    }

    public DatabaseCluster getAuroraCluster() {
        return auroraCluster;
    }

    public Table getUserGraphTable() {
        return userGraphTable;
    }

    public Table getPostTable() {
        return postTable;
    }
}

/**
 * Cache Stack with ElastiCache Redis
 */
class CacheStack extends Stack {
    private final CfnReplicationGroup redisCluster;

    CacheStack(final Construct scope, final String id, final String environmentSuffix,
               final IVpc vpc, final SecurityGroup redisSecurityGroup, final StackProps props) {
        super(scope, id, props);

        // Create subnet group for Redis
        CfnSubnetGroup subnetGroup = CfnSubnetGroup.Builder.create(this, "RedisSubnetGroup")
                .description("Subnet group for Redis cluster")
                .subnetIds(vpc.selectSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_ISOLATED)
                        .build()).getSubnetIds())
                .cacheSubnetGroupName("social-platform-redis-" + environmentSuffix)
                .build();

        // Create Redis Replication Group
        this.redisCluster = CfnReplicationGroup.Builder.create(this, "RedisCluster")
                .replicationGroupDescription("Redis cluster for social platform caching")
                .engine("redis")
                .engineVersion("7.0")
                .cacheNodeType("cache.r6g.xlarge")
                .numCacheClusters(3)
                .automaticFailoverEnabled(true)
                .multiAzEnabled(true)
                .cacheSubnetGroupName(subnetGroup.getCacheSubnetGroupName())
                .securityGroupIds(List.of(redisSecurityGroup.getSecurityGroupId()))
                .atRestEncryptionEnabled(true)
                .transitEncryptionEnabled(true)
                .snapshotRetentionLimit(7)
                .snapshotWindow("03:00-05:00")
                .preferredMaintenanceWindow("mon:05:00-mon:07:00")
                .build();

        redisCluster.addDependency(subnetGroup);

        Tags.of(this).add("project", "social-platform");
        Tags.of(this).add("environment", environmentSuffix);
    }

    public CfnReplicationGroup getRedisCluster() {
        return redisCluster;
    }
}

/**
 * Storage Stack with S3 and CloudFront
 */
class StorageStack extends Stack {
    private final Bucket mediaBucket;
    private final Bucket backupBucket;
    private final Distribution cloudFrontDistribution;

    StorageStack(final Construct scope, final String id, final String environmentSuffix,
                 final Key kmsKey, final StackProps props) {
        super(scope, id, props);

        // Create S3 bucket for media storage
        this.mediaBucket = Bucket.Builder.create(this, "MediaBucket")
                .bucketName("social-platform-media-" + environmentSuffix + "-" + this.getAccount())
                .encryption(BucketEncryption.S3_MANAGED)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .versioned(true)
                .lifecycleRules(List.of(
                        LifecycleRule.builder()
                                .transitions(List.of(
                                        software.amazon.awscdk.services.s3.Transition.builder()
                                                .storageClass(StorageClass.INTELLIGENT_TIERING)
                                                .transitionAfter(Duration.days(30))
                                                .build(),
                                        software.amazon.awscdk.services.s3.Transition.builder()
                                                .storageClass(StorageClass.GLACIER)
                                                .transitionAfter(Duration.days(90))
                                                .build()
                                ))
                                .build()
                ))
                .removalPolicy(RemovalPolicy.RETAIN)
                .build();

        // Create S3 bucket for backups
        this.backupBucket = Bucket.Builder.create(this, "BackupBucket")
                .bucketName("social-platform-backups-" + environmentSuffix + "-" + this.getAccount())
                .encryption(BucketEncryption.S3_MANAGED)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .versioned(true)
                .lifecycleRules(List.of(
                        LifecycleRule.builder()
                                .expiration(Duration.days(90))
                                .build()
                ))
                .removalPolicy(RemovalPolicy.RETAIN)
                .build();

        // Create CloudFront OAI
        OriginAccessIdentity oai = OriginAccessIdentity.Builder.create(this, "OAI")
                .comment("OAI for social platform media bucket")
                .build();

        mediaBucket.grantRead(oai);

        // Create CloudFront distribution
        this.cloudFrontDistribution = Distribution.Builder.create(this, "MediaDistribution")
                .defaultBehavior(BehaviorOptions.builder()
                        .origin(S3Origin.Builder.create(mediaBucket)
                                .originAccessIdentity(oai)
                                .build())
                        .viewerProtocolPolicy(ViewerProtocolPolicy.REDIRECT_TO_HTTPS)
                        .allowedMethods(AllowedMethods.ALLOW_GET_HEAD_OPTIONS)
                        .cachePolicy(CachePolicy.CACHING_OPTIMIZED)
                        .build())
                .comment("CloudFront distribution for social platform media - " + environmentSuffix)
                .build();

        Tags.of(this).add("project", "social-platform");
        Tags.of(this).add("environment", environmentSuffix);
    }

    public Bucket getMediaBucket() {
        return mediaBucket;
    }

    public Bucket getBackupBucket() {
        return backupBucket;
    }

    public Distribution getCloudFrontDistribution() {
        return cloudFrontDistribution;
    }
}

/**
 * Compute Stack with ALB and EC2 Auto Scaling
 *
 * (unchanged)
 */
class ComputeStack extends Stack {
    private final ApplicationLoadBalancer alb;
    private final AutoScalingGroup autoScalingGroup;
    private final Function routingFunction;

    ComputeStack(final Construct scope, final String id, final String environmentSuffix,
                 final ComputeStackConfig config, final StackProps props) {
        super(scope, id, props);

        // Create Application Load Balancer
        this.alb = ApplicationLoadBalancer.Builder.create(this, "ApplicationLoadBalancer")
                .vpc(config.getVpc())
                .internetFacing(true)
                .securityGroup(config.getAlbSecurityGroup())
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PUBLIC)
                        .build())
                .loadBalancerName("social-platform-" + environmentSuffix + "-alb")
                .build();

        // Create Lambda function for routing
        this.routingFunction = createRoutingFunction(environmentSuffix, config.getKmsKey());

        // Create EC2 Auto Scaling Group
        this.autoScalingGroup = createAutoScalingGroup(environmentSuffix, config.getVpc(), 
                config.getEc2SecurityGroup(), config.getMinInstances(), config.getMaxInstances());

        // Configure ALB listener with Lambda and EC2 targets
        configureAlbListener();

        // Setup monitoring
        setupMonitoring(config.getAlertTopic());

        Tags.of(this).add("project", "social-platform");
        Tags.of(this).add("environment", environmentSuffix);
    }

    private Function createRoutingFunction(final String environmentSuffix, final Key kmsKey) {
        Role lambdaRole = Role.Builder.create(this, "RoutingFunctionRole")
                .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
                ))
                .inlinePolicies(Map.of("KMSPolicy", PolicyDocument.Builder.create()
                        .statements(Arrays.asList(
                                PolicyStatement.Builder.create()
                                        .effect(Effect.ALLOW)
                                        .actions(Arrays.asList("kms:Decrypt", "kms:GenerateDataKey"))
                                        .resources(Arrays.asList(kmsKey.getKeyArn()))
                                        .build()
                        ))
                        .build()))
                .build();

        return Function.Builder.create(this, "RoutingFunction")
                .functionName("social-platform-" + environmentSuffix + "-routing")
                .runtime(Runtime.JAVA_17)
                .handler("com.social.platform.routing.RoutingHandler::handleRequest")
                .code(Code.fromAsset("lib/src/lambda/src", AssetOptions.builder()
                    .bundling(BundlingOptions.builder()
                        .image(Runtime.JAVA_17.getBundlingImage())
                        .command(Arrays.asList(
                                "/bin/sh", "-c",
                                "mvn clean package && " 
                                + "cp /asset-input/target/lambda-functions.jar "
                                + "/asset-output/routing.jar"
                        ))
                        .build())
                    .build()))
                .memorySize(512)
                .timeout(Duration.seconds(30))
                .role(lambdaRole)
                .environment(Map.of(
                        "ENVIRONMENT", environmentSuffix
                ))
                .logRetention(RetentionDays.ONE_MONTH)
                .build();
    }

    private AutoScalingGroup createAutoScalingGroup(final String environmentSuffix, final IVpc vpc,
                                                     final SecurityGroup securityGroup,
                                                     final Integer minInstances, final Integer maxInstances) {
        UserData userData = UserData.forLinux();
        userData.addCommands(
                "#!/bin/bash",
                "yum update -y",
                "yum install -y java-17-amazon-corretto docker",
                "systemctl start docker",
                "systemctl enable docker",
                "usermod -a -G docker ec2-user",
                "# Pull and run application container",
                "docker pull social-platform-app:latest || true",
                "docker run -d -p 8080:8080 --name social-app social-platform-app:latest || true"
        );

        AutoScalingGroup asg = AutoScalingGroup.Builder.create(this, "AutoScalingGroup")
                .vpc(vpc)
                .instanceType(InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.LARGE))
                .machineImage(AmazonLinuxImage.Builder.create()
                        .generation(AmazonLinuxGeneration.AMAZON_LINUX_2023)
                        .cpuType(AmazonLinuxCpuType.X86_64)
                        .build())
                .minCapacity(minInstances)
                .maxCapacity(maxInstances)
                .desiredCapacity(minInstances)
                .securityGroup(securityGroup)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build())
                .userData(userData)
                .healthCheck(software.amazon.awscdk.services.autoscaling.HealthCheck.elb(
                        software.amazon.awscdk.services.autoscaling.ElbHealthCheckOptions.builder()
                                .grace(Duration.minutes(5))
                                .build()))
                .updatePolicy(software.amazon.awscdk.services.autoscaling.UpdatePolicy.rollingUpdate(
                        software.amazon.awscdk.services.autoscaling.RollingUpdateOptions.builder()
                                .maxBatchSize(10)
                                .minInstancesInService(minInstances)
                                .pauseTime(Duration.minutes(5))
                                .build()))
                .build();

        // Add CPU-based scaling
        asg.scaleOnCpuUtilization("CpuScaling", CpuUtilizationScalingProps.builder()
                .targetUtilizationPercent(70)
                .cooldown(Duration.minutes(3))
                .build());

        // Add network-based scaling
        asg.scaleOnIncomingBytes("NetworkInScaling", NetworkUtilizationScalingProps.builder()
                .targetBytesPerSecond(10 * 1024 * 1024) // 10 MB/s
                .cooldown(Duration.minutes(3))
                .build());

        return asg;
    }

    private void configureAlbListener() {
        // Create target group for EC2 instances
        ApplicationTargetGroup ec2TargetGroup = ApplicationTargetGroup.Builder.create(this, "Ec2TargetGroup")
                .vpc(alb.getVpc())
                .port(8080)
                .protocol(ApplicationProtocol.HTTP)
                .targetType(TargetType.INSTANCE)
                .healthCheck(HealthCheck.builder()
                        .enabled(true)
                        .path("/health")
                        .interval(Duration.seconds(30))
                        .timeout(Duration.seconds(5))
                        .healthyThresholdCount(2)
                        .unhealthyThresholdCount(3)
                        .build())
                .deregistrationDelay(Duration.seconds(30))
                .targets(Arrays.asList(autoScalingGroup))
                .build();

        // Create listener
        ApplicationListener listener = alb.addListener("HttpListener",
                software.amazon.awscdk.services.elasticloadbalancingv2.BaseApplicationListenerProps.builder()
                        .port(80)
                        .protocol(ApplicationProtocol.HTTP)
                        .defaultAction(ListenerAction.forward(Arrays.asList(ec2TargetGroup)))
                        .build());

        // Add Lambda target for specific routing patterns
        listener.addTargets("LambdaTarget",
                AddApplicationTargetsProps.builder()
                        .targets(Arrays.asList(new LambdaTarget(routingFunction)))
                        .priority(10)
                        .conditions(Arrays.asList(
                                software.amazon.awscdk.services.elasticloadbalancingv2.ListenerCondition.pathPatterns(
                                        Arrays.asList("/api/route/*"))
                        ))
                        .build());
    }

    private void setupMonitoring(final Topic alertTopic) {
        // ALB Target 5XX errors alarm
        Metric target5xxMetric = Metric.Builder.create()
                .namespace("AWS/ApplicationELB")
                .metricName("HTTPCode_Target_5XX_Count")
                .dimensionsMap(Map.of("LoadBalancer", alb.getLoadBalancerFullName()))
                .statistic("Sum")
                .period(Duration.minutes(1))
                .build();

        Alarm target5xxAlarm = Alarm.Builder.create(this, "Target5xxAlarm")
                .alarmName("SocialPlatform-ALB-Target5xx")
                .metric(target5xxMetric)
                .threshold(100.0)
                .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                .evaluationPeriods(2)
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build();

        target5xxAlarm.addAlarmAction(new SnsAction(alertTopic));

        // ASG Unhealthy instances alarm
        Metric unhealthyHostMetric = Metric.Builder.create()
                .namespace("AWS/ApplicationELB")
                .metricName("UnHealthyHostCount")
                .dimensionsMap(Map.of(
                        "LoadBalancer", alb.getLoadBalancerFullName(),
                        "TargetGroup", "app/" + alb.getLoadBalancerName() + "/*"
                ))
                .statistic("Average")
                .period(Duration.minutes(1))
                .build();

        Alarm unhealthyHostAlarm = Alarm.Builder.create(this, "UnhealthyHostAlarm")
                .alarmName("SocialPlatform-UnhealthyHosts")
                .metric(unhealthyHostMetric)
                .threshold(5.0)
                .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                .evaluationPeriods(3)
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build();

        unhealthyHostAlarm.addAlarmAction(new SnsAction(alertTopic));
    }

    public ApplicationLoadBalancer getAlb() {
        return alb;
    }

    public AutoScalingGroup getAutoScalingGroup() {
        return autoScalingGroup;
    }

    public Function getRoutingFunction() {
        return routingFunction;
    }
}

/**
 * Real-Time Stack with WebSocket API and Lambda functions
 */
class RealTimeStack extends Stack {
    private final WebSocketApi webSocketApi;
    private final Function connectFunction;
    private final Function disconnectFunction;
    private final Function messageFunction;
    private final Function notificationFunction;

    RealTimeStack(final Construct scope, final String id, final String environmentSuffix,
                  final Key kmsKey, final Topic alertTopic, final StackProps props) {
        super(scope, id, props);

        // Create Lambda functions for WebSocket
        this.connectFunction = createWebSocketFunction("Connect", environmentSuffix, kmsKey);
        this.disconnectFunction = createWebSocketFunction("Disconnect", environmentSuffix, kmsKey);
        this.messageFunction = createWebSocketFunction("Message", environmentSuffix, kmsKey);
        this.notificationFunction = createNotificationFunction(environmentSuffix, kmsKey);

        // Create WebSocket API
        this.webSocketApi = WebSocketApi.Builder.create(this, "WebSocketApi")
                .apiName("social-platform-" + environmentSuffix + "-websocket")
                .description("WebSocket API for real-time social platform updates")
                .build();

        // Grant invoke permissions to Lambda functions
        connectFunction.grantInvoke(new ServicePrincipal("apigateway.amazonaws.com"));
        disconnectFunction.grantInvoke(new ServicePrincipal("apigateway.amazonaws.com"));
        messageFunction.grantInvoke(new ServicePrincipal("apigateway.amazonaws.com"));

        // Create integrations using CfnIntegration (stable API)
        software.amazon.awscdk.services.apigatewayv2.CfnIntegration connectIntegration = 
                software.amazon.awscdk.services.apigatewayv2.CfnIntegration.Builder.create(this, "ConnectIntegration")
                .apiId(webSocketApi.getApiId())
                .integrationType("AWS_PROXY")
                .integrationUri("arn:aws:apigateway:" + this.getRegion() 
                               + ":lambda:path/2015-03-31/functions/" 
                               + connectFunction.getFunctionArn() + "/invocations")
                .build();

        software.amazon.awscdk.services.apigatewayv2.CfnIntegration disconnectIntegration = 
                software.amazon.awscdk.services.apigatewayv2.CfnIntegration.Builder.create(this, "DisconnectIntegration")
                .apiId(webSocketApi.getApiId())
                .integrationType("AWS_PROXY")
                .integrationUri("arn:aws:apigateway:" + this.getRegion() 
                               + ":lambda:path/2015-03-31/functions/" 
                               + disconnectFunction.getFunctionArn() + "/invocations")
                .build();

        software.amazon.awscdk.services.apigatewayv2.CfnIntegration messageIntegration = 
                software.amazon.awscdk.services.apigatewayv2.CfnIntegration.Builder.create(this, "MessageIntegration")
                .apiId(webSocketApi.getApiId())
                .integrationType("AWS_PROXY")
                .integrationUri("arn:aws:apigateway:" + this.getRegion() 
                               + ":lambda:path/2015-03-31/functions/" 
                               + messageFunction.getFunctionArn() + "/invocations")
                .build();

        // Create routes
        software.amazon.awscdk.services.apigatewayv2.CfnRoute.Builder.create(this, "ConnectRoute")
                .apiId(webSocketApi.getApiId())
                .routeKey("$connect")
                .target("integrations/" + connectIntegration.getRef())
                .build();

        software.amazon.awscdk.services.apigatewayv2.CfnRoute.Builder.create(this, "DisconnectRoute")
                .apiId(webSocketApi.getApiId())
                .routeKey("$disconnect")
                .target("integrations/" + disconnectIntegration.getRef())
                .build();

        software.amazon.awscdk.services.apigatewayv2.CfnRoute.Builder.create(this, "MessageRoute")
                .apiId(webSocketApi.getApiId())
                .routeKey("$default")
                .target("integrations/" + messageIntegration.getRef())
                .build();

        // Create WebSocket stage
        WebSocketStage stage = WebSocketStage.Builder.create(this, "WebSocketStage")
                .webSocketApi(webSocketApi)
                .stageName("prod")
                .autoDeploy(true)
                .build();

        // Setup monitoring
        setupWebSocketMonitoring(alertTopic);

        Tags.of(this).add("project", "social-platform");
        Tags.of(this).add("environment", environmentSuffix);
    }

    private Function createWebSocketFunction(final String functionType, final String environmentSuffix, 
                                             final Key kmsKey) {
        Role lambdaRole = Role.Builder.create(this, functionType + "FunctionRole")
                .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
                ))
                .inlinePolicies(Map.of(
                        "KMSPolicy", PolicyDocument.Builder.create()
                                .statements(Arrays.asList(
                                        PolicyStatement.Builder.create()
                                                .effect(Effect.ALLOW)
                                                .actions(Arrays.asList("kms:Decrypt", "kms:GenerateDataKey"))
                                                .resources(Arrays.asList(kmsKey.getKeyArn()))
                                                .build()
                                ))
                                .build(),
                        "ExecuteApiPolicy", PolicyDocument.Builder.create()
                                .statements(Arrays.asList(
                                        PolicyStatement.Builder.create()
                                                .effect(Effect.ALLOW)
                                                .actions(Arrays.asList("execute-api:ManageConnections"))
                                                .resources(Arrays.asList("*"))
                                                .build()
                                ))
                                .build()
                ))
                .build();

        return Function.Builder.create(this, functionType + "Function")
                .functionName("social-platform-" + environmentSuffix + "-ws-" + functionType.toLowerCase())
                .runtime(Runtime.JAVA_17)
                .handler("com.social.platform.websocket." + functionType + "Handler::handleRequest")
                .code(Code.fromAsset("lib/src/lambda/src", AssetOptions.builder()
                        .bundling(BundlingOptions.builder()
                                .image(Runtime.JAVA_17.getBundlingImage())
                                .command(Arrays.asList(
                                        "/bin/sh", "-c",
                                        "mvn clean package && "  
                                        + "cp /asset-input/target/lambda-functions.jar "
                                        + "/asset-output/" + functionType.toLowerCase() + ".jar"
                                ))
                                .build())
                        .build()))
                .memorySize(512)
                .timeout(Duration.seconds(30))
                .role(lambdaRole)
                .environment(Map.of(
                        "ENVIRONMENT", environmentSuffix
                ))
                .logRetention(RetentionDays.ONE_MONTH)
                .build();
    }

    private Function createNotificationFunction(final String environmentSuffix, final Key kmsKey) {
        Role lambdaRole = Role.Builder.create(this, "NotificationFunctionRole")
                .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
                ))
                .inlinePolicies(Map.of("KMSPolicy", PolicyDocument.Builder.create()
                        .statements(Arrays.asList(
                                PolicyStatement.Builder.create()
                                        .effect(Effect.ALLOW)
                                        .actions(Arrays.asList("kms:Decrypt", "kms:GenerateDataKey"))
                                        .resources(Arrays.asList(kmsKey.getKeyArn()))
                                        .build()
                        ))
                        .build()))
                .build();

        return Function.Builder.create(this, "NotificationFunction")
                .functionName("social-platform-" + environmentSuffix + "-notification")
                .runtime(Runtime.JAVA_17)
                .handler("com.social.platform.notification.NotificationHandler::handleRequest")
                .code(Code.fromAsset("lib/src/lambda/src", AssetOptions.builder()
                        .bundling(BundlingOptions.builder()
                                .image(Runtime.JAVA_17.getBundlingImage())
                                .command(Arrays.asList(
                                        "/bin/sh", "-c",
                                        "mvn clean package && " 
                                        + "cp /asset-input/target/lambda-functions.jar " 
                                        + "/asset-output/notification.jar"
                                ))
                                .build())
                        .build()))
                .memorySize(1024)
                .timeout(Duration.seconds(60))
                .role(lambdaRole)
                .environment(Map.of(
                        "ENVIRONMENT", environmentSuffix
                ))
                .logRetention(RetentionDays.ONE_MONTH)
                .build();
    }

    private void setupWebSocketMonitoring(final Topic alertTopic) {
        // Monitor connect function errors
        createFunctionErrorAlarm(connectFunction, "Connect", alertTopic);
        createFunctionErrorAlarm(disconnectFunction, "Disconnect", alertTopic);
        createFunctionErrorAlarm(messageFunction, "Message", alertTopic);
        createFunctionErrorAlarm(notificationFunction, "Notification", alertTopic);
    }

    private void createFunctionErrorAlarm(final Function function, final String functionName, 
                                          final Topic alertTopic) {
        Metric errorMetric = Metric.Builder.create()
                .namespace("AWS/Lambda")
                .metricName("Errors")
                .dimensionsMap(Map.of("FunctionName", function.getFunctionName()))
                .statistic("Sum")
                .period(Duration.minutes(5))
                .build();

        Alarm errorAlarm = Alarm.Builder.create(this, functionName + "ErrorAlarm")
                .alarmName("SocialPlatform-WebSocket-" + functionName + "-Errors")
                .metric(errorMetric)
                .threshold(10.0)
                .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                .evaluationPeriods(2)
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build();

        errorAlarm.addAlarmAction(new SnsAction(alertTopic));
    }

    public WebSocketApi getWebSocketApi() {
        return webSocketApi;
    }

    public Function getConnectFunction() {
        return connectFunction;
    }

    public Function getDisconnectFunction() {
        return disconnectFunction;
    }

    public Function getMessageFunction() {
        return messageFunction;
    }

    public Function getNotificationFunction() {
        return notificationFunction;
    }
}

/**
 * Machine Learning Stack with SageMaker endpoints for feed ranking
 *
 * This version:
 * - accepts modelS3Uri (may be null)
 * - if modelS3Uri is null, constructs a likely S3 URI using the account token and environmentSuffix:
 *     s3://social-platform-sagemaker-{account}-{environmentSuffix}/model.tar.gz
 * - grants the SageMaker role s3:GetObject and s3:ListBucket on the model bucket (and keeps sample bucket ARNs)
 */
class MLStack extends Stack {
    private final CfnModel feedRankingModel;
    private final CfnEndpointConfig feedRankingEndpointConfig;
    private final CfnEndpoint feedRankingEndpoint;
    private final CfnModel viralDetectionModel;
    private final CfnEndpointConfig viralDetectionEndpointConfig;
    private final CfnEndpoint viralDetectionEndpoint;

    MLStack(final Construct scope, final String id, final String environmentSuffix,
            final Key kmsKey, final String modelS3Uri, final StackProps props) {
        super(scope, id, props);

        // Determine effective model S3 URI. If user supplied modelS3Uri use it,
        // otherwise build a likely path using the account token and environmentSuffix.
        final String effectiveModelS3Uri;
        if (modelS3Uri != null && !modelS3Uri.isEmpty()) {
            effectiveModelS3Uri = modelS3Uri;
        } else {
            // this.getAccount() returns a Token that CDK will resolve at deploy time.
            effectiveModelS3Uri = "s3://social-platform-sagemaker-" + this.getAccount() + "-" + environmentSuffix + "/model.tar.gz";
        }

        // Parse bucket name from effectiveModelS3Uri (if the uri was passed in)
        String bucketFromUri = null;
        if (effectiveModelS3Uri != null && effectiveModelS3Uri.startsWith("s3://")) {
            String withoutPrefix = effectiveModelS3Uri.substring("s3://".length());
            int slashIndex = withoutPrefix.indexOf('/');
            bucketFromUri = slashIndex == -1 ? withoutPrefix : withoutPrefix.substring(0, slashIndex);
        }

        // Build S3 ARNs for the inline policy
        List<String> s3Resources = new ArrayList<>();
        // keep access to sample bucket as well (harmless)
        s3Resources.add("arn:aws:s3:::sagemaker-sample-files");
        s3Resources.add("arn:aws:s3:::sagemaker-sample-files/*");
        if (bucketFromUri != null && !bucketFromUri.isEmpty()) {
            s3Resources.add("arn:aws:s3:::" + bucketFromUri);
            s3Resources.add("arn:aws:s3:::" + bucketFromUri + "/*");
        }

        // Create IAM role for SageMaker and grant S3 read/list for the bucket(s)
        Role sagemakerRole = Role.Builder.create(this, "SageMakerRole")
                .assumedBy(new ServicePrincipal("sagemaker.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("AmazonSageMakerFullAccess")
                ))
                .inlinePolicies(Map.of("SageMakerS3Access", PolicyDocument.Builder.create()
                        .statements(Arrays.asList(
                                PolicyStatement.Builder.create()
                                        .effect(Effect.ALLOW)
                                        .actions(Arrays.asList("s3:GetObject", "s3:ListBucket"))
                                        .resources(s3Resources)
                                        .build()
                        ))
                        .build()))
                .build();

        // Create models and endpoints using the effectiveModelS3Uri
        this.feedRankingModel = createSageMakerModel("FeedRanking", environmentSuffix, sagemakerRole, effectiveModelS3Uri);
        this.feedRankingEndpointConfig = createEndpointConfig("FeedRanking", environmentSuffix, feedRankingModel);
        this.feedRankingEndpoint = createEndpoint("FeedRanking", environmentSuffix, feedRankingEndpointConfig);

        this.viralDetectionModel = createSageMakerModel("ViralDetection", environmentSuffix, sagemakerRole, effectiveModelS3Uri);
        this.viralDetectionEndpointConfig = createEndpointConfig("ViralDetection", environmentSuffix, viralDetectionModel);
        this.viralDetectionEndpoint = createEndpoint("ViralDetection", environmentSuffix, viralDetectionEndpointConfig);

        Tags.of(this).add("project", "social-platform");
        Tags.of(this).add("environment", environmentSuffix);
    }

    private CfnModel createSageMakerModel(final String modelType, final String environmentSuffix, 
                                          final Role sagemakerRole, final String modelS3Uri) {
        return CfnModel.Builder.create(this, modelType + "Model")
                .modelName("social-platform-" + environmentSuffix + "-" + modelType.toLowerCase())
                .executionRoleArn(sagemakerRole.getRoleArn())
                .primaryContainer(CfnModel.ContainerDefinitionProperty.builder()
                        .image("763104351884.dkr.ecr.us-west-2.amazonaws.com/pytorch-inference:2.0.0-cpu-py310")
                        .modelDataUrl(modelS3Uri)
                        .environment(Map.of(
                                "SAGEMAKER_PROGRAM", "inference.py",
                                "SAGEMAKER_SUBMIT_DIRECTORY", "/opt/ml/model/code"
                        ))
                        .build())
                .build();
    }

    private CfnEndpointConfig createEndpointConfig(final String modelType, final String environmentSuffix,
                                                    final CfnModel model) {
        CfnEndpointConfig config = CfnEndpointConfig.Builder.create(this, modelType + "EndpointConfig")
                .endpointConfigName("social-platform-" + environmentSuffix + "-"
                                   + modelType.toLowerCase() + "-config")
                .productionVariants(Arrays.asList(
                        CfnEndpointConfig.ProductionVariantProperty.builder()
                                .variantName("AllTraffic")
                                .modelName(model.getModelName())
                                .initialInstanceCount(1)
                                .instanceType("ml.m5.xlarge")
                                .initialVariantWeight(1.0)
                                .build()
                ))
                .build();
        config.addDependency(model);
        return config;
    }

    private CfnEndpoint createEndpoint(final String modelType, final String environmentSuffix,
                                       final CfnEndpointConfig endpointConfig) {
        CfnEndpoint endpoint = CfnEndpoint.Builder.create(this, modelType + "Endpoint")
                .endpointName("social-platform-" + environmentSuffix + "-"
                             + modelType.toLowerCase() + "-endpoint")
                .endpointConfigName(endpointConfig.getEndpointConfigName())
                .build();
        endpoint.addDependency(endpointConfig);
        return endpoint;
    }

    public CfnEndpoint getFeedRankingEndpoint() {
        return feedRankingEndpoint;
    }

    public CfnEndpoint getViralDetectionEndpoint() {
        return viralDetectionEndpoint;
    }
}

/**
 * Main TapStack that orchestrates all infrastructure stacks
 *
 * TapStack now accepts modelS3Uri and forwards it to the MLStack.
 */
class TapStack extends Stack {
    private final SecurityStack securityStack;
    private final NetworkStack networkStack;
    private final DatabaseStack databaseStack;
    private final CacheStack cacheStack;
    private final StorageStack storageStack;
    private final ComputeStack computeStack;
    private final RealTimeStack realTimeStack;
    private final MLStack mlStack;
    private final String environmentSuffix;

    TapStack(final Construct scope, final String id, final TapStackProps props, final String modelS3Uri) {
        super(scope, id, props != null ? props.getStackProps() : null);

        this.environmentSuffix = props != null ? props.getEnvironmentSuffix() : "dev";
        Integer minInstances = props != null ? props.getMinInstances() : 100;
        Integer maxInstances = props != null ? props.getMaxInstances() : 800;
        Integer auroraReadReplicas = props != null ? props.getAuroraReadReplicas() : 2;

        // Create security stack
        this.securityStack = new SecurityStack(
                this,
                "Security",
                environmentSuffix,
                StackProps.builder()
                        .env(props != null && props.getStackProps() != null ? props.getStackProps().getEnv() : null)
                        .description("Security Stack for social platform: " + environmentSuffix)
                        .build());

        // Create network stack
        this.networkStack = new NetworkStack(
                this,
                "Network",
                environmentSuffix,
                StackProps.builder()
                        .env(props != null && props.getStackProps() != null ? props.getStackProps().getEnv() : null)
                        .description("Network Stack for social platform: " + environmentSuffix)
                        .build());

        // Create database stack with config object
        DatabaseStackConfig dbConfig = new DatabaseStackConfig(
                networkStack.getVpc(),
                networkStack.getRdsSecurityGroup(),
                securityStack.getKmsKey(),
                auroraReadReplicas
        );

        this.databaseStack = new DatabaseStack(
                this,
                "Database",
                environmentSuffix,
                dbConfig,
                StackProps.builder()
                        .env(props != null && props.getStackProps() != null ? props.getStackProps().getEnv() : null)
                        .description("Database Stack for social platform: " + environmentSuffix)
                        .build());

        // Create cache stack
        this.cacheStack = new CacheStack(
                this,
                "Cache",
                environmentSuffix,
                networkStack.getVpc(),
                networkStack.getElasticacheSecurityGroup(),
                StackProps.builder()
                        .env(props != null && props.getStackProps() != null ? props.getStackProps().getEnv() : null)
                        .description("Cache Stack for social platform: " + environmentSuffix)
                        .build());

        // Create storage stack
        this.storageStack = new StorageStack(
                this,
                "Storage",
                environmentSuffix,
                securityStack.getKmsKey(),
                StackProps.builder()
                        .env(props != null && props.getStackProps() != null ? props.getStackProps().getEnv() : null)
                        .description("Storage Stack for social platform: " + environmentSuffix)
                        .build());

        // Create compute stack with config object
        ComputeStackConfig computeConfig = new ComputeStackConfig(
                networkStack.getVpc(),
                networkStack.getAlbSecurityGroup(),
                networkStack.getEc2SecurityGroup(),
                securityStack.getKmsKey(),
                minInstances,
                maxInstances,
                securityStack.getAlertTopic()
        );

        this.computeStack = new ComputeStack(
                this,
                "Compute",
                environmentSuffix,
                computeConfig,
                StackProps.builder()
                        .env(props != null && props.getStackProps() != null ? props.getStackProps().getEnv() : null)
                        .description("Compute Stack for social platform: " + environmentSuffix)
                        .build());

        // Create real-time stack
        this.realTimeStack = new RealTimeStack(
                this,
                "RealTime",
                environmentSuffix,
                securityStack.getKmsKey(),
                securityStack.getAlertTopic(),
                StackProps.builder()
                        .env(props != null && props.getStackProps() != null ? props.getStackProps().getEnv() : null)
                        .description("Real-Time Stack for social platform: " + environmentSuffix)
                        .build());

        // Create ML stack (pass modelS3Uri)
        this.mlStack = new MLStack(
                this,
                "ML",
                environmentSuffix,
                securityStack.getKmsKey(),
                modelS3Uri,
                StackProps.builder()
                        .env(props != null && props.getStackProps() != null ? props.getStackProps().getEnv() : null)
                        .description("Machine Learning Stack for social platform: " + environmentSuffix)
                        .build());

        // Add dependencies
        networkStack.addDependency(securityStack);
        databaseStack.addDependency(networkStack);
        cacheStack.addDependency(networkStack);
        // storageStack.addDependency(securityStack);
        computeStack.addDependency(networkStack);
        realTimeStack.addDependency(securityStack);
        mlStack.addDependency(securityStack);

        // Create outputs
        createOutputs();

        // Add tags to all resources
        Tags.of(this).add("project", "social-platform");
        Tags.of(this).add("environment", environmentSuffix);
        Tags.of(this).add("managed-by", "cdk");
    }

    private void createOutputs() {
        CfnOutput.Builder.create(this, "AlbDnsName")
                .value(computeStack.getAlb().getLoadBalancerDnsName())
                .description("Application Load Balancer DNS Name")
                .exportName("SocialPlatform-AlbDns-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "WebSocketApiUrl")
                .value(realTimeStack.getWebSocketApi().getApiEndpoint())
                .description("WebSocket API URL")
                .exportName("SocialPlatform-WebSocketUrl-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "CloudFrontDomain")
                .value(storageStack.getCloudFrontDistribution().getDistributionDomainName())
                .description("CloudFront Distribution Domain")
                .exportName("SocialPlatform-CloudFrontDomain-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "MediaBucketName")
                .value(storageStack.getMediaBucket().getBucketName())
                .description("S3 Media Bucket Name")
                .exportName("SocialPlatform-MediaBucket-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "AuroraClusterEndpoint")
                .value(databaseStack.getAuroraCluster().getClusterEndpoint().getHostname())
                .description("Aurora Cluster Write Endpoint")
                .exportName("SocialPlatform-AuroraEndpoint-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "AuroraReaderEndpoint")
                .value(databaseStack.getAuroraCluster().getClusterReadEndpoint().getHostname())
                .description("Aurora Cluster Read Endpoint")
                .exportName("SocialPlatform-AuroraReaderEndpoint-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "UserGraphTableName")
                .value(databaseStack.getUserGraphTable().getTableName())
                .description("DynamoDB User Graph Table")
                .exportName("SocialPlatform-UserGraphTable-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "PostTableName")
                .value(databaseStack.getPostTable().getTableName())
                .description("DynamoDB Post Table")
                .exportName("SocialPlatform-PostTable-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "RedisEndpoint")
                .value(cacheStack.getRedisCluster().getAttrPrimaryEndPointAddress())
                .description("ElastiCache Redis Configuration Endpoint")
                .exportName("SocialPlatform-RedisEndpoint-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "FeedRankingEndpoint")
                .value(mlStack.getFeedRankingEndpoint().getEndpointName())
                .description("SageMaker Feed Ranking Endpoint")
                .exportName("SocialPlatform-FeedRankingEndpoint-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "ViralDetectionEndpoint")
                .value(mlStack.getViralDetectionEndpoint().getEndpointName())
                .description("SageMaker Viral Detection Endpoint")
                .exportName("SocialPlatform-ViralDetectionEndpoint-" + environmentSuffix)
                .build();
    }

    public SecurityStack getSecurityStack() {
        return securityStack;
    }

    public NetworkStack getNetworkStack() {
        return networkStack;
    }

    public DatabaseStack getDatabaseStack() {
        return databaseStack;
    }

    public CacheStack getCacheStack() {
        return cacheStack;
    }

    public StorageStack getStorageStack() {
        return storageStack;
    }

    public ComputeStack getComputeStack() {
        return computeStack;
    }

    public RealTimeStack getRealTimeStack() {
        return realTimeStack;
    }

    public MLStack getMlStack() {
        return mlStack;
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }
}

/**
 * Main entry point for the Social Platform CDK Java application
 *
 * Usage:
 * - Optionally set MODEL_S3_URI to a full S3 URI (s3://bucket/key). If set, MLStack will use it.
 * - If MODEL_S3_URI is not set, MLStack will construct a likely S3 URI using the account token
 *   and environmentSuffix, e.g. s3://social-platform-sagemaker-<account>-dev/model.tar.gz
 */
public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from environment variable, context, or default
        String environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (environmentSuffix == null || environmentSuffix.isEmpty()) {
            environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        }
        if (environmentSuffix == null || environmentSuffix.isEmpty()) {
            environmentSuffix = "dev";
        }

        // Get scaling configuration from environment
        String minInstancesEnv = System.getenv("MIN_INSTANCES");
        Integer minInstances = (minInstancesEnv != null && !minInstancesEnv.isEmpty())
                ? Integer.parseInt(minInstancesEnv) : 100;

        String maxInstancesEnv = System.getenv("MAX_INSTANCES");
        Integer maxInstances = (maxInstancesEnv != null && !maxInstancesEnv.isEmpty())
                ? Integer.parseInt(maxInstancesEnv) : 800;

        String auroraReplicasEnv = System.getenv("AURORA_READ_REPLICAS");
        Integer auroraReadReplicas = (auroraReplicasEnv != null && !auroraReplicasEnv.isEmpty())
                ? Integer.parseInt(auroraReplicasEnv) : 9;

        // Read optional model S3 URI from env. If you uploaded the model, set:
        // export MODEL_S3_URI="your model s3 uri in the object. 
        //example MODEL_S3_URI='s3://social-platform-sagemaker-342597974367-dev/model.tar.gz'"
        String modelS3Uri = System.getenv("MODEL_S3_URI");

        // Create the main Social Platform stack (pass modelS3Uri)
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .minInstances(minInstances)
                .maxInstances(maxInstances)
                .auroraReadReplicas(auroraReadReplicas)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region("us-west-2")
                                .build())
                        .build())
                .build(), modelS3Uri);

        app.synth();
    }
}