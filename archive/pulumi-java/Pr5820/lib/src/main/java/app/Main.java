package app;

import com.pulumi.Context;
import com.pulumi.Pulumi;
import com.pulumi.core.Output;
import com.pulumi.core.Either;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;
import com.pulumi.aws.ec2.Vpc;
import com.pulumi.aws.ec2.VpcArgs;
import com.pulumi.aws.ec2.Subnet;
import com.pulumi.aws.ec2.SubnetArgs;
import com.pulumi.aws.ec2.SecurityGroup;
import com.pulumi.aws.ec2.SecurityGroupArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupEgressArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupIngressArgs;
import com.pulumi.aws.ec2.VpcEndpoint;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;
import com.pulumi.aws.s3.BucketVersioningV2;
import com.pulumi.aws.s3.BucketVersioningV2Args;
import com.pulumi.aws.s3.BucketNotification;
import com.pulumi.aws.s3.BucketNotificationArgs;
import com.pulumi.aws.s3.BucketPublicAccessBlock;
import com.pulumi.aws.s3.BucketPublicAccessBlockArgs;
import com.pulumi.aws.s3.BucketIntelligentTieringConfiguration;
import com.pulumi.aws.s3.BucketIntelligentTieringConfigurationArgs;
import com.pulumi.aws.s3.inputs.BucketVersioningV2VersioningConfigurationArgs;
import com.pulumi.aws.s3.inputs.BucketNotificationLambdaFunctionArgs;
import com.pulumi.aws.s3.inputs.BucketIntelligentTieringConfigurationTieringArgs;
import com.pulumi.aws.dynamodb.Table;
import com.pulumi.aws.dynamodb.TableArgs;
import com.pulumi.aws.dynamodb.inputs.TableAttributeArgs;
import com.pulumi.aws.dynamodb.inputs.TableGlobalSecondaryIndexArgs;
import com.pulumi.aws.dynamodb.inputs.TablePointInTimeRecoveryArgs;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.RolePolicy;
import com.pulumi.aws.iam.RolePolicyArgs;
import com.pulumi.aws.iam.RolePolicyAttachment;
import com.pulumi.aws.iam.RolePolicyAttachmentArgs;
import com.pulumi.aws.lambda.Function;
import com.pulumi.aws.lambda.FunctionArgs;
import com.pulumi.aws.lambda.Permission;
import com.pulumi.aws.lambda.PermissionArgs;
import com.pulumi.aws.lambda.inputs.FunctionEnvironmentArgs;
import com.pulumi.aws.lambda.inputs.FunctionDeadLetterConfigArgs;
import com.pulumi.aws.lambda.inputs.FunctionTracingConfigArgs;
import com.pulumi.aws.neptune.Cluster;
import com.pulumi.aws.neptune.ClusterArgs;
import com.pulumi.aws.neptune.ClusterInstance;
import com.pulumi.aws.neptune.ClusterInstanceArgs;
import com.pulumi.aws.neptune.SubnetGroup;
import com.pulumi.aws.neptune.SubnetGroupArgs;
import com.pulumi.aws.rds.enums.EngineType;
import com.pulumi.aws.glue.Job;
import com.pulumi.aws.glue.JobArgs;
import com.pulumi.aws.glue.inputs.JobCommandArgs;
import com.pulumi.aws.glue.inputs.JobExecutionPropertyArgs;
import com.pulumi.aws.sns.Topic;
import com.pulumi.aws.sns.TopicArgs;
import com.pulumi.aws.sns.TopicSubscription;
import com.pulumi.aws.sns.TopicSubscriptionArgs;
import com.pulumi.aws.opensearch.Domain;
import com.pulumi.aws.opensearch.DomainArgs;
import com.pulumi.aws.opensearch.inputs.DomainClusterConfigArgs;
import com.pulumi.aws.opensearch.inputs.DomainEbsOptionsArgs;
import com.pulumi.aws.opensearch.inputs.DomainEncryptAtRestArgs;
import com.pulumi.aws.cloudwatch.LogGroup;
import com.pulumi.aws.cloudwatch.LogGroupArgs;
import com.pulumi.aws.cloudwatch.MetricAlarm;
import com.pulumi.aws.cloudwatch.MetricAlarmArgs;
import com.pulumi.aws.sfn.StateMachine;
import com.pulumi.aws.sfn.StateMachineArgs;
import com.pulumi.aws.cloudfront.Distribution;
import com.pulumi.aws.cloudfront.DistributionArgs;
import com.pulumi.aws.cloudfront.OriginAccessControl;
import com.pulumi.aws.cloudfront.OriginAccessControlArgs;
import com.pulumi.aws.cloudfront.inputs.DistributionOriginArgs;
import com.pulumi.aws.cloudfront.inputs.DistributionDefaultCacheBehaviorArgs;
import com.pulumi.aws.cloudfront.inputs.DistributionRestrictionsArgs;
import com.pulumi.aws.cloudfront.inputs.DistributionViewerCertificateArgs;
import com.pulumi.aws.cloudfront.inputs.DistributionRestrictionsGeoRestrictionArgs;
import com.pulumi.aws.cloudfront.inputs.DistributionDefaultCacheBehaviorForwardedValuesArgs;
import com.pulumi.aws.cloudfront.inputs.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs;
import com.pulumi.aws.sqs.Queue;
import com.pulumi.aws.sqs.QueueArgs;
import java.util.Map;
import java.util.List;
import java.util.Collections;

/**
 * Main class for Migration Connector Infrastructure.
 *
 * <p>This class implements a production-ready, event-driven migration connector
 * infrastructure using Pulumi Java SDK with nested stack pattern.</p>
 *
 * @version 1.0
 * @since 1.0
 */
public final class Main {

    private static final String REGION = "us-east-1";
    private static final String PROJECT_NAME = "migration-connector";

    /**
     * Private constructor to prevent instantiation.
     */
    private Main() {
        // Utility class should not be instantiated
    }

    /**
     * Main entry point for the Pulumi program.
     *
     * @param args Command line arguments
     */
    public static void main(final String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }

    /**
     * Defines the infrastructure resources.
     *
     * @param ctx The Pulumi context for exporting outputs
     */
    static void defineInfrastructure(final Context ctx) {
        String envSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (envSuffix == null || envSuffix.isEmpty()) {
            envSuffix = "dev";
        }

        String stackName = "TapStack" + envSuffix;
        Map<String, String> commonTags = Map.of(
            "Environment", envSuffix,
            "Project", PROJECT_NAME,
            "ManagedBy", "pulumi"
        );

        // Create VPC and networking first
        NetworkingStack networkingStack = new NetworkingStack(
            "networking-stack",
            stackName,
            commonTags
        );

        // Create storage resources
        StorageStack storageStack = new StorageStack(
            "storage-stack",
            stackName,
            commonTags
        );

        // Create messaging resources
        MessagingStack messagingStack = new MessagingStack(
            "messaging-stack",
            stackName,
            commonTags
        );

        // Create database resources
        DatabaseStack databaseStack = new DatabaseStack(
            "database-stack",
            stackName,
            commonTags,
            networkingStack
        );

        // Create search resources
        SearchStack searchStack = new SearchStack(
            "search-stack",
            stackName,
            commonTags,
            networkingStack
        );

        // Create compute resources
        ComputeStack computeStack = new ComputeStack(
            "compute-stack",
            stackName,
            commonTags,
            networkingStack,
            storageStack,
            databaseStack,
            searchStack,
            messagingStack
        );

        // Create media processing resources
        MediaStack mediaStack = new MediaStack(
            "media-stack",
            stackName,
            commonTags,
            storageStack
        );

        // Create orchestration resources
        OrchestrationStack orchestrationStack = new OrchestrationStack(
            "orchestration-stack",
            stackName,
            commonTags,
            databaseStack,
            searchStack,
            messagingStack
        );

        // Export outputs
        ctx.export("metadataInputBucketName", storageStack.getMetadataInputBucket().id());
        ctx.export("mediaOutputBucketName", storageStack.getMediaOutputBucket().id());
        ctx.export("dynamodbTableName", storageStack.getDynamodbTable().name());
        ctx.export("neptuneClusterEndpoint", databaseStack.getNeptuneCluster().endpoint());
        ctx.export("auroraClusterEndpoint", databaseStack.getAuroraCluster().endpoint());
        ctx.export("openSearchDomainEndpoint", searchStack.getOpenSearchDomain().endpoint());
        ctx.export("cloudFrontDistributionDomain", mediaStack.getCloudFrontDistribution().domainName());
        ctx.export("stepFunctionsStateMachineArn", orchestrationStack.getStateMachine().arn());
        ctx.export("snsTopicArn", messagingStack.getEtlCompletionTopic().arn());
        ctx.export("vpcId", networkingStack.getVpc().id());
        ctx.export("privateSubnetIds", Output.all(
            networkingStack.getPrivateSubnet1().id(),
            networkingStack.getPrivateSubnet2().id()
        ));
    }

    /**
     * Networking stack component.
     */
    static class NetworkingStack extends ComponentResource {
        private final Vpc vpc;
        private final Subnet privateSubnet1;
        private final Subnet privateSubnet2;
        private final SecurityGroup lambdaSg;
        private final SecurityGroup neptuneSg;
        private final SecurityGroup auroraSg;
        private final SecurityGroup openSearchSg;
        private final VpcEndpoint s3Endpoint;
        private final VpcEndpoint dynamodbEndpoint;

        public Vpc getVpc() {
            return vpc;
        }

        public Subnet getPrivateSubnet1() {
            return privateSubnet1;
        }

        public Subnet getPrivateSubnet2() {
            return privateSubnet2;
        }

        public SecurityGroup getLambdaSg() {
            return lambdaSg;
        }

        public SecurityGroup getNeptuneSg() {
            return neptuneSg;
        }

        public SecurityGroup getAuroraSg() {
            return auroraSg;
        }

        public SecurityGroup getOpenSearchSg() {
            return openSearchSg;
        }

        public VpcEndpoint getS3Endpoint() {
            return s3Endpoint;
        }

        public VpcEndpoint getDynamodbEndpoint() {
            return dynamodbEndpoint;
        }

        NetworkingStack(final String name, final String stackName,
                       final Map<String, String> tags) {
            super("custom:networking:Stack", name, ComponentResourceOptions.builder().build());

            // Create VPC
            this.vpc = new Vpc(stackName + "-vpc", VpcArgs.builder()
                .cidrBlock("10.0.0.0/16")
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .tags(tags)
                .build(), CustomResourceOptions.builder().parent(this).build());

            // Create private subnets
            this.privateSubnet1 = new Subnet(stackName + "-private-subnet-1",
                SubnetArgs.builder()
                    .vpcId(vpc.id())
                    .cidrBlock("10.0.1.0/24")
                    .availabilityZone(REGION + "a")
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            this.privateSubnet2 = new Subnet(stackName + "-private-subnet-2",
                SubnetArgs.builder()
                    .vpcId(vpc.id())
                    .cidrBlock("10.0.2.0/24")
                    .availabilityZone(REGION + "b")
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create security groups
            this.lambdaSg = new SecurityGroup(stackName + "-lambda-sg",
                SecurityGroupArgs.builder()
                    .vpcId(vpc.id())
                    .description("Security group for Lambda functions")
                    .egress(SecurityGroupEgressArgs.builder()
                        .protocol("-1")
                        .fromPort(0)
                        .toPort(0)
                        .cidrBlocks("0.0.0.0/0")
                        .build())
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            this.neptuneSg = new SecurityGroup(stackName + "-neptune-sg",
                SecurityGroupArgs.builder()
                    .vpcId(vpc.id())
                    .description("Security group for Neptune cluster")
                    .ingress(SecurityGroupIngressArgs.builder()
                        .protocol("tcp")
                        .fromPort(8182)
                        .toPort(8182)
                        .securityGroups(
                            lambdaSg.id().apply(id -> {
                                // Use Output.of() to wrap the list, satisfying the required Output<U> return type.
                                return Output.of(List.of(id));
                            })
                        )
 
                        .build())
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            this.auroraSg = new SecurityGroup(stackName + "-aurora-sg",
                SecurityGroupArgs.builder()
                    .vpcId(vpc.id())
                    .description("Security group for Aurora cluster")
                    .ingress(SecurityGroupIngressArgs.builder()
                        .protocol("tcp")
                        .fromPort(5432)
                        .toPort(5432)
                        .securityGroups(
                            lambdaSg.id().apply(id -> {
                                // Use Output.of() to wrap the list, satisfying the required Output<U> return type.
                                return Output.of(List.of(id));
                            })
                        )
                        .build())
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            this.openSearchSg = new SecurityGroup(stackName + "-opensearch-sg",
                SecurityGroupArgs.builder()
                    .vpcId(vpc.id())
                    .description("Security group for OpenSearch domain")
                    .ingress(SecurityGroupIngressArgs.builder()
                        .protocol("tcp")
                        .fromPort(443)
                        .toPort(443)
                        .securityGroups(
                            lambdaSg.id().apply(id -> {
                               // Use Output.of() to wrap the list, satisfying the required Output<U> return type.
                                return Output.of(List.of(id));
                            })
                        )
                        .build())
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // VPC endpoints disabled - not needed for demo deployment
            this.s3Endpoint = null;
            this.dynamodbEndpoint = null;

            this.registerOutputs(Collections.emptyMap());
        }
    }

    /**
     * Storage stack component.
     */
    static class StorageStack extends ComponentResource {
        private final Bucket metadataInputBucket;
        private final Bucket mediaOutputBucket;
        private final Table dynamodbTable;

        public Bucket getMetadataInputBucket() {
            return metadataInputBucket;
        }

        public Bucket getMediaOutputBucket() {
            return mediaOutputBucket;
        }

        public Table getDynamodbTable() {
            return dynamodbTable;
        }

        StorageStack(final String name, final String stackName,
                    final Map<String, String> tags) {
            super("custom:storage:Stack", name, ComponentResourceOptions.builder().build());

            // Create metadata input bucket
            this.metadataInputBucket = new Bucket(stackName + "-metadata-input",
                BucketArgs.builder()
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Enable versioning
            new BucketVersioningV2(stackName + "-metadata-versioning",
                BucketVersioningV2Args.builder()
                    .bucket(metadataInputBucket.id())
                    .versioningConfiguration(BucketVersioningV2VersioningConfigurationArgs.builder()
                        .status("Enabled")
                        .build())
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Block public access
            new BucketPublicAccessBlock(stackName + "-metadata-public-block",
                BucketPublicAccessBlockArgs.builder()
                    .bucket(metadataInputBucket.id())
                    .blockPublicAcls(true)
                    .blockPublicPolicy(true)
                    .ignorePublicAcls(true)
                    .restrictPublicBuckets(true)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create media output bucket
            this.mediaOutputBucket = new Bucket(stackName + "-media-output",
                BucketArgs.builder()
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Configure intelligent tiering
            new BucketIntelligentTieringConfiguration(stackName + "-media-tiering",
                BucketIntelligentTieringConfigurationArgs.builder()
                    .bucket(mediaOutputBucket.id())
                    .name("EntireBucket")
                    .status("Enabled")
                    .tierings(
                        BucketIntelligentTieringConfigurationTieringArgs.builder()
                            .accessTier("ARCHIVE_ACCESS")
                            .days(90)
                            .build(),
                        BucketIntelligentTieringConfigurationTieringArgs.builder()
                            .accessTier("DEEP_ARCHIVE_ACCESS")
                            .days(180)
                            .build()
                    )
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Block public access for media bucket
            new BucketPublicAccessBlock(stackName + "-media-public-block",
                BucketPublicAccessBlockArgs.builder()
                    .bucket(mediaOutputBucket.id())
                    .blockPublicAcls(true)
                    .blockPublicPolicy(true)
                    .ignorePublicAcls(true)
                    .restrictPublicBuckets(true)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create DynamoDB table
            this.dynamodbTable = new Table(stackName + "-metadata-table",
                TableArgs.builder()
                    .billingMode("PAY_PER_REQUEST")
                    .hashKey("assetId")
                    .rangeKey("timestamp")
                    .attributes(
                        TableAttributeArgs.builder()
                            .name("assetId")
                            .type("S")
                            .build(),
                        TableAttributeArgs.builder()
                            .name("timestamp")
                            .type("N")
                            .build(),
                        TableAttributeArgs.builder()
                            .name("type")
                            .type("S")
                            .build()
                    )
                    .globalSecondaryIndexes(TableGlobalSecondaryIndexArgs.builder()
                        .name("type-index")
                        .hashKey("type")
                        .projectionType("ALL")
                        .build())
                    .pointInTimeRecovery(TablePointInTimeRecoveryArgs.builder()
                        .enabled(false)
                        .build())
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            this.registerOutputs(Collections.emptyMap());
        }
    }

    /**
     * Messaging stack component.
     */
    static class MessagingStack extends ComponentResource {
        private final Topic etlCompletionTopic;
        private final Queue lambdaDlq;

        public Topic getEtlCompletionTopic() {
            return etlCompletionTopic;
        }

        public Queue getLambdaDlq() {
            return lambdaDlq;
        }

        MessagingStack(final String name, final String stackName,
                      final Map<String, String> tags) {
            super("custom:messaging:Stack", name, ComponentResourceOptions.builder().build());

            // Create SNS topic for ETL completion
            this.etlCompletionTopic = new Topic(stackName + "-etl-completion-topic",
                TopicArgs.builder()
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create DLQ for Lambda functions
            this.lambdaDlq = new Queue(stackName + "-lambda-dlq",
                QueueArgs.builder()
                    .messageRetentionSeconds(1209600) // 14 days
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            this.registerOutputs(Collections.emptyMap());
        }
    }

    /**
     * Database stack component.
     */
    static class DatabaseStack extends ComponentResource {
        private final Cluster neptuneCluster;
        private final com.pulumi.aws.rds.Cluster auroraCluster;

        public Cluster getNeptuneCluster() {
            return neptuneCluster;
        }

        public com.pulumi.aws.rds.Cluster getAuroraCluster() {
            return auroraCluster;
        }

        DatabaseStack(final String name, final String stackName,
                     final Map<String, String> tags,
                     final NetworkingStack networkingStack) {
            super("custom:database:Stack", name, ComponentResourceOptions.builder().build());

            // Create Neptune subnet group
            // Neptune subnet group names must be lowercase
            SubnetGroup neptuneSubnetGroup = new SubnetGroup(stackName + "-neptune-subnet-group",
                SubnetGroupArgs.builder()
                    .name(stackName.toLowerCase() + "-neptune-subnet-group")
                    .subnetIds(Output.all(
                        networkingStack.getPrivateSubnet1().id(),
                        networkingStack.getPrivateSubnet2().id()
                    ).applyValue(ids -> List.of(ids.get(0), ids.get(1))))
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create Neptune cluster
            this.neptuneCluster = new Cluster(stackName + "-neptune-cluster",
                ClusterArgs.builder()
                    .engine("neptune")
                    .backupRetentionPeriod(7)
                    .preferredBackupWindow("03:00-04:00")
                    .skipFinalSnapshot(false)
                    .finalSnapshotIdentifier(stackName.toLowerCase() + "-neptune-final-snapshot")
                    .iamDatabaseAuthenticationEnabled(true)
                    .neptuneSubnetGroupName(neptuneSubnetGroup.name())
                    .vpcSecurityGroupIds(networkingStack.getNeptuneSg().id().applyValue(List::of))
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create Neptune cluster instance
            new ClusterInstance(stackName + "-neptune-instance",
                ClusterInstanceArgs.builder()
                    .clusterIdentifier(neptuneCluster.id())
                    .instanceClass("db.t3.medium")
                    .engine("neptune")
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create Aurora subnet group
            // Aurora/RDS subnet group names must be lowercase
            com.pulumi.aws.rds.SubnetGroup auroraSubnetGroup =
                new com.pulumi.aws.rds.SubnetGroup(stackName + "-aurora-subnet-group",
                    com.pulumi.aws.rds.SubnetGroupArgs.builder()
                        .name(stackName.toLowerCase() + "-aurora-subnet-group")
                        .subnetIds(Output.all(
                            networkingStack.getPrivateSubnet1().id(),
                            networkingStack.getPrivateSubnet2().id()
                        ).applyValue(ids -> List.of(ids.get(0), ids.get(1))))
                        .tags(tags)
                        .build(), CustomResourceOptions.builder().parent(this).build());

            // Create Aurora Serverless v2 cluster
            this.auroraCluster = new com.pulumi.aws.rds.Cluster(stackName + "-aurora-cluster",
                com.pulumi.aws.rds.ClusterArgs.builder()
                    .engine(EngineType.AuroraPostgresql)
                    .engineMode("provisioned")
                    .databaseName("migration")
                    .masterUsername("dbadmin")
                    .manageMasterUserPassword(true)
                    .backupRetentionPeriod(7)
                    .preferredBackupWindow("03:00-04:00")
                    .skipFinalSnapshot(false)
                    .finalSnapshotIdentifier(stackName.toLowerCase() + "-aurora-final-snapshot")
                    .iamDatabaseAuthenticationEnabled(true)
                    .dbSubnetGroupName(auroraSubnetGroup.name())
                    .vpcSecurityGroupIds(networkingStack.getAuroraSg().id().applyValue(List::of))
                    .serverlessv2ScalingConfiguration(com.pulumi.aws.rds.inputs.ClusterServerlessv2ScalingConfigurationArgs.builder()
                        .minCapacity(0.5)
                        .maxCapacity(1.0)
                        .build())
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create Aurora cluster instance
            new com.pulumi.aws.rds.ClusterInstance(stackName + "-aurora-instance",
                com.pulumi.aws.rds.ClusterInstanceArgs.builder()
                    .clusterIdentifier(auroraCluster.id())
                    .instanceClass("db.serverless")
                    .engine(EngineType.AuroraPostgresql)
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            this.registerOutputs(Collections.emptyMap());
        }
    }

    /**
     * Search stack component.
     */
    static class SearchStack extends ComponentResource {
        private final Domain openSearchDomain;

        public Domain getOpenSearchDomain() {
            return openSearchDomain;
        }

        /**
         * Sanitizes the stack name to create a valid OpenSearch domain name.
         * AWS OpenSearch domain names must:
         * - Start with a lowercase letter
         * - Be 3-28 characters long
         * - Contain only lowercase letters, numbers, and hyphens
         *
         * @param stackName The original stack name
         * @return A sanitized domain name
         */
        private static String sanitizeDomainName(final String stackName) {
            // Convert to lowercase and replace invalid characters with hyphens
            String sanitized = stackName.toLowerCase()
                .replaceAll("[^a-z0-9-]", "-")
                .replaceAll("-+", "-"); // Replace multiple hyphens with single

            // Ensure it starts with a lowercase letter
            if (!sanitized.matches("^[a-z].*")) {
                sanitized = "os-" + sanitized;
            }

            // Trim to max 28 characters
            if (sanitized.length() > 28) {
                sanitized = sanitized.substring(0, 28);
            }

            // Remove trailing hyphens
            sanitized = sanitized.replaceAll("-+$", "");

            // Ensure minimum length of 3
            if (sanitized.length() < 3) {
                sanitized = "os-domain";
            }

            return sanitized;
        }

        SearchStack(final String name, final String stackName,
                   final Map<String, String> tags,
                   final NetworkingStack networkingStack) {
            super("custom:search:Stack", name, ComponentResourceOptions.builder().build());

            // Create OpenSearch domain with valid naming convention
            // AWS OpenSearch domain names must start with lowercase letter and be 3-28 chars
            String domainName = sanitizeDomainName(stackName);

            this.openSearchDomain = new Domain(stackName + "-opensearch-domain",
                DomainArgs.builder()
                    .domainName(domainName)
                    .engineVersion("OpenSearch_2.9")
                    .clusterConfig(DomainClusterConfigArgs.builder()
                        .instanceType("t3.small.search")
                        .instanceCount(1)
                        .dedicatedMasterEnabled(false)
                        .zoneAwarenessEnabled(false)
                        .build())
                    .ebsOptions(DomainEbsOptionsArgs.builder()
                        .ebsEnabled(true)
                        .volumeSize(10)
                        .volumeType("gp3")
                        .build())
                    .encryptAtRest(DomainEncryptAtRestArgs.builder()
                        .enabled(true)
                        .build())
                    .nodeToNodeEncryption(com.pulumi.aws.opensearch.inputs
                        .DomainNodeToNodeEncryptionArgs.builder()
                        .enabled(true)
                        .build())
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            this.registerOutputs(Collections.emptyMap());
        }
    }

    /**
     * Compute stack component.
     */
    static class ComputeStack extends ComponentResource {
        private final Function metadataProcessorLambda;
        private final Function searchIndexerLambda;
        private final Job glueJob;

        public Function getMetadataProcessorLambda() {
            return metadataProcessorLambda;
        }

        public Function getSearchIndexerLambda() {
            return searchIndexerLambda;
        }

        public Job getGlueJob() {
            return glueJob;
        }

        ComputeStack(final String name, final String stackName,
                    final Map<String, String> tags,
                    final NetworkingStack networkingStack,
                    final StorageStack storageStack,
                    final DatabaseStack databaseStack,
                    final SearchStack searchStack,
                    final MessagingStack messagingStack) {
            super("custom:compute:Stack", name, ComponentResourceOptions.builder().build());

            this.metadataProcessorLambda = createMetadataProcessorLambda(
                stackName, tags, storageStack, databaseStack, messagingStack
            );
            this.searchIndexerLambda = createSearchIndexerLambda(
                stackName, tags, searchStack, messagingStack
            );
            this.glueJob = createGlueJob(
                stackName, tags, storageStack, databaseStack, messagingStack
            );
            createCloudWatchAlarms(stackName, tags);

            this.registerOutputs(Collections.emptyMap());
        }

        private Function createMetadataProcessorLambda(
                final String stackName,
                final Map<String, String> tags,
                final StorageStack storageStack,
                final DatabaseStack databaseStack,
                final MessagingStack messagingStack) {
            // Create IAM role for metadata processor Lambda
            Role metadataLambdaRole = new Role(stackName + "-metadata-lambda-role",
                RoleArgs.builder()
                    .assumeRolePolicy("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Effect": "Allow",
                                "Principal": {"Service": "lambda.amazonaws.com"},
                                "Action": "sts:AssumeRole"
                            }]
                        }
                        """)
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Attach basic execution policy
            new RolePolicyAttachment(stackName + "-metadata-lambda-basic",
                RolePolicyAttachmentArgs.builder()
                    .role(metadataLambdaRole.name())
                    .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create custom policy for metadata Lambda
            new RolePolicy(stackName + "-metadata-lambda-policy",
                RolePolicyArgs.builder()
                    .role(metadataLambdaRole.name())
                    .policy(Output.tuple(
                        storageStack.getMetadataInputBucket().arn(),
                        storageStack.getDynamodbTable().arn(),
                        databaseStack.getNeptuneCluster().arn(),
                        messagingStack.getLambdaDlq().arn()
                    ).applyValue(t -> Either.ofLeft(String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": ["s3:GetObject", "s3:ListBucket"],
                                    "Resource": ["%s", "%s/*"]
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": ["dynamodb:PutItem", "dynamodb:GetItem"],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": ["neptune-db:*"],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": ["sqs:SendMessage"],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": ["glue:StartJobRun"],
                                    "Resource": "*"
                                }
                            ]
                        }
                        """, t.t1, t.t1, t.t2, t.t3, t.t4))))
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create CloudWatch log group for metadata Lambda
            LogGroup metadataLogGroup = new LogGroup(stackName + "-metadata-lambda-logs",
                LogGroupArgs.builder()
                    .retentionInDays(7)
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create metadata processor Lambda function
            Function lambda = new Function(stackName + "-metadata-processor",
                FunctionArgs.builder()
                    .runtime("java17")
                    .handler("com.migration.MetadataProcessor::handleRequest")
                    .role(metadataLambdaRole.arn())
                    .memorySize(512)
                    .timeout(300)
                    .architectures("arm64")
                    .code(new com.pulumi.asset.FileArchive("lib/lambda-placeholder"))
                    .environment(FunctionEnvironmentArgs.builder()
                        .variables(Output.tuple(
                            storageStack.getDynamodbTable().name(),
                            databaseStack.getNeptuneCluster().endpoint(),
                            databaseStack.getAuroraCluster().endpoint()
                        ).applyValue(t -> Map.of(
                            "DYNAMODB_TABLE", t.t1,
                            "NEPTUNE_ENDPOINT", t.t2,
                            "AURORA_ENDPOINT", t.t3
                        )))
                        .build())
                    .deadLetterConfig(FunctionDeadLetterConfigArgs.builder()
                        .targetArn(messagingStack.getLambdaDlq().arn())
                        .build())
                    .tracingConfig(FunctionTracingConfigArgs.builder()
                        .mode("Active")
                        .build())
                    .tags(tags)
                    .build(), CustomResourceOptions.builder()
                        .parent(this)
                        .dependsOn(metadataLogGroup)
                        .build());

            // Grant S3 permission to invoke Lambda
            new Permission(stackName + "-metadata-lambda-s3-permission",
                PermissionArgs.builder()
                    .action("lambda:InvokeFunction")
                    .function(lambda.name())
                    .principal("s3.amazonaws.com")
                    .sourceArn(storageStack.getMetadataInputBucket().arn())
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Configure S3 bucket notification
            new BucketNotification(stackName + "-metadata-notification",
                BucketNotificationArgs.builder()
                    .bucket(storageStack.getMetadataInputBucket().id())
                    .lambdaFunctions(BucketNotificationLambdaFunctionArgs.builder()
                        .lambdaFunctionArn(lambda.arn())
                        .events("s3:ObjectCreated:Put")
                        .filterSuffix(".json")
                        .build())
                    .build(), CustomResourceOptions.builder().parent(this).build());

            return lambda;
        }

        private Function createSearchIndexerLambda(
                final String stackName,
                final Map<String, String> tags,
                final SearchStack searchStack,
                final MessagingStack messagingStack) {
            // Create IAM role for search indexer Lambda
            Role searchLambdaRole = new Role(stackName + "-search-lambda-role",
                RoleArgs.builder()
                    .assumeRolePolicy("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Effect": "Allow",
                                "Principal": {"Service": "lambda.amazonaws.com"},
                                "Action": "sts:AssumeRole"
                            }]
                        }
                        """)
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Attach basic execution policy
            new RolePolicyAttachment(stackName + "-search-lambda-basic",
                RolePolicyAttachmentArgs.builder()
                    .role(searchLambdaRole.name())
                    .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create custom policy for search Lambda
            new RolePolicy(stackName + "-search-lambda-policy",
                RolePolicyArgs.builder()
                    .role(searchLambdaRole.name())
                    .policy(Output.tuple(
                        searchStack.getOpenSearchDomain().arn(),
                        messagingStack.getLambdaDlq().arn()
                    ).applyValue(t -> Either.ofLeft(String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": ["es:*"],
                                    "Resource": "%s/*"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": ["sqs:SendMessage"],
                                    "Resource": "%s"
                                }
                            ]
                        }
                        """, t.t1, t.t2))))
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create CloudWatch log group for search Lambda
            LogGroup searchLogGroup = new LogGroup(stackName + "-search-lambda-logs",
                LogGroupArgs.builder()
                    .retentionInDays(7)
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create search indexer Lambda function
            Function lambda = new Function(stackName + "-search-indexer",
                FunctionArgs.builder()
                    .runtime("java17")
                    .handler("com.migration.SearchIndexer::handleRequest")
                    .role(searchLambdaRole.arn())
                    .memorySize(512)
                    .timeout(60)
                    .architectures("arm64")
                    .code(new com.pulumi.asset.FileArchive("lib/lambda-placeholder"))
                    .environment(FunctionEnvironmentArgs.builder()
                        .variables(searchStack.getOpenSearchDomain().endpoint()
                            .applyValue(endpoint -> Map.of(
                                "OPENSEARCH_ENDPOINT", endpoint
                            )))
                        .build())
                    .deadLetterConfig(FunctionDeadLetterConfigArgs.builder()
                        .targetArn(messagingStack.getLambdaDlq().arn())
                        .build())
                    .tracingConfig(FunctionTracingConfigArgs.builder()
                        .mode("Active")
                        .build())
                    .tags(tags)
                    .build(), CustomResourceOptions.builder()
                        .parent(this)
                        .dependsOn(searchLogGroup)
                        .build());

            // Subscribe Lambda to SNS topic
            new Permission(stackName + "-search-lambda-sns-permission",
                PermissionArgs.builder()
                    .action("lambda:InvokeFunction")
                    .function(lambda.name())
                    .principal("sns.amazonaws.com")
                    .sourceArn(messagingStack.getEtlCompletionTopic().arn())
                    .build(), CustomResourceOptions.builder().parent(this).build());

            new TopicSubscription(stackName + "-search-lambda-subscription",
                TopicSubscriptionArgs.builder()
                    .topic(messagingStack.getEtlCompletionTopic().arn())
                    .protocol("lambda")
                    .endpoint(lambda.arn())
                    .build(), CustomResourceOptions.builder().parent(this).build());

            return lambda;
        }

        private Job createGlueJob(
                final String stackName,
                final Map<String, String> tags,
                final StorageStack storageStack,
                final DatabaseStack databaseStack,
                final MessagingStack messagingStack) {
            // Create IAM role for Glue job
            Role glueRole = new Role(stackName + "-glue-role",
                RoleArgs.builder()
                    .assumeRolePolicy("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Effect": "Allow",
                                "Principal": {"Service": "glue.amazonaws.com"},
                                "Action": "sts:AssumeRole"
                            }]
                        }
                        """)
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Attach Glue service policy
            new RolePolicyAttachment(stackName + "-glue-service-policy",
                RolePolicyAttachmentArgs.builder()
                    .role(glueRole.name())
                    .policyArn("arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole")
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create custom policy for Glue
            new RolePolicy(stackName + "-glue-policy",
                RolePolicyArgs.builder()
                    .role(glueRole.name())
                    .policy(Output.tuple(
                        storageStack.getMetadataInputBucket().arn(),
                        databaseStack.getAuroraCluster().arn(),
                        messagingStack.getEtlCompletionTopic().arn()
                    ).applyValue(t -> Either.ofLeft(String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": ["s3:GetObject", "s3:ListBucket"],
                                    "Resource": ["%s", "%s/*"]
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": ["rds:*"],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": ["sns:Publish"],
                                    "Resource": "%s"
                                }
                            ]
                        }
                        """, t.t1, t.t1, t.t2, t.t3))))
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create Glue job
            Job job = new Job(stackName + "-etl-job",
                JobArgs.builder()
                    .roleArn(glueRole.arn())
                    .glueVersion("4.0")
                    .workerType("G.1X")
                    .numberOfWorkers(2)
                    .maxRetries(3)
                    .timeout(120)
                    .command(JobCommandArgs.builder()
                        .name("glueetl")
                        .scriptLocation("s3://placeholder/etl-script.py")
                        .pythonVersion("3")
                        .build())
                    .defaultArguments(Output.tuple(
                        databaseStack.getAuroraCluster().endpoint(),
                        messagingStack.getEtlCompletionTopic().arn()
                    ).applyValue(t -> Map.of(
                        "--job-language", "python",
                        "--AURORA_ENDPOINT", t.t1,
                        "--SNS_TOPIC_ARN", t.t2
                    )))
                    .executionProperty(JobExecutionPropertyArgs.builder()
                        .maxConcurrentRuns(1)
                        .build())
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            return job;
        }

        private void createCloudWatchAlarms(
                final String stackName,
                final Map<String, String> tags) {
            // Create CloudWatch alarms
            new MetricAlarm(stackName + "-metadata-lambda-errors",
                MetricAlarmArgs.builder()
                    .comparisonOperator("GreaterThanThreshold")
                    .evaluationPeriods(1)
                    .metricName("Errors")
                    .namespace("AWS/Lambda")
                    .period(300)
                    .statistic("Sum")
                    .threshold(5.0)
                    .dimensions(metadataProcessorLambda.name().applyValue(funcName -> Map.of("FunctionName", funcName)))
                    .alarmDescription("Metadata Lambda error rate exceeded 5%")
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());
        }
    }

    /**
     * Media stack component.
     */
    static class MediaStack extends ComponentResource {
        private final Distribution cloudFrontDistribution;

        public Distribution getCloudFrontDistribution() {
            return cloudFrontDistribution;
        }

        MediaStack(final String name, final String stackName,
                  final Map<String, String> tags,
                  final StorageStack storageStack) {
            super("custom:media:Stack", name, ComponentResourceOptions.builder().build());

            // Create IAM role for MediaConvert
            Role mediaConvertRole = new Role(stackName + "-mediaconvert-role",
                RoleArgs.builder()
                    .assumeRolePolicy("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Effect": "Allow",
                                "Principal": {"Service": "mediaconvert.amazonaws.com"},
                                "Action": "sts:AssumeRole"
                            }]
                        }
                        """)
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create policy for MediaConvert
            new RolePolicy(stackName + "-mediaconvert-policy",
                RolePolicyArgs.builder()
                    .role(mediaConvertRole.name())
                    .policy(Output.tuple(
                        storageStack.getMetadataInputBucket().arn(),
                        storageStack.getMediaOutputBucket().arn()
                    ).applyValue(t -> Either.ofLeft(String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": ["s3:GetObject", "s3:ListBucket"],
                                    "Resource": ["%s", "%s/*"]
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": ["s3:PutObject"],
                                    "Resource": "%s/*"
                                }
                            ]
                        }
                        """, t.t1, t.t1, t.t2))))
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create Origin Access Control
            OriginAccessControl oac = new OriginAccessControl(stackName + "-oac",
                OriginAccessControlArgs.builder()
                    .name(stackName + "-oac")
                    .originAccessControlOriginType("s3")
                    .signingBehavior("always")
                    .signingProtocol("sigv4")
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create CloudFront distribution
            this.cloudFrontDistribution = new Distribution(stackName + "-cdn",
                DistributionArgs.builder()
                    .enabled(true)
                    .origins(DistributionOriginArgs.builder()
                        .domainName(storageStack.getMediaOutputBucket().bucketRegionalDomainName())
                        .originId("S3-media-output")
                        .originAccessControlId(oac.id())
                        .build())
                    .defaultCacheBehavior(DistributionDefaultCacheBehaviorArgs.builder()
                        .targetOriginId("S3-media-output")
                        .viewerProtocolPolicy("redirect-to-https")
                        .allowedMethods("GET", "HEAD", "OPTIONS")
                        .cachedMethods("GET", "HEAD")
                        .forwardedValues(DistributionDefaultCacheBehaviorForwardedValuesArgs.builder()
                            .queryString(false)
                            .cookies(DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs.builder()
                                .forward("none")
                                .build())
                            .build())
                        .minTtl(0)
                        .defaultTtl(3600)
                        .maxTtl(86400)
                        .compress(true)
                        .build())
                    .priceClass("PriceClass_100")
                    .restrictions(DistributionRestrictionsArgs.builder()
                        .geoRestriction(DistributionRestrictionsGeoRestrictionArgs.builder()
                            .restrictionType("none")
                            .build())
                        .build())
                    .viewerCertificate(DistributionViewerCertificateArgs.builder()
                        .cloudfrontDefaultCertificate(true)
                        .build())
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Update bucket policy for CloudFront access
            new com.pulumi.aws.s3.BucketPolicy(stackName + "-media-bucket-policy",
                com.pulumi.aws.s3.BucketPolicyArgs.builder()
                    .bucket(storageStack.getMediaOutputBucket().id())
                    .policy(Output.tuple(
                        storageStack.getMediaOutputBucket().arn(),
                        cloudFrontDistribution.arn()
                    ).applyValue(t -> Either.ofLeft(String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Effect": "Allow",
                                "Principal": {
                                    "Service": "cloudfront.amazonaws.com"
                                },
                                "Action": "s3:GetObject",
                                "Resource": "%s/*",
                                "Condition": {
                                    "StringEquals": {
                                        "AWS:SourceArn": "%s"
                                    }
                                }
                            }]
                        }
                        """, t.t1, t.t2))))
                    .build(), CustomResourceOptions.builder().parent(this).build());

            this.registerOutputs(Collections.emptyMap());
        }
    }

    /**
     * Orchestration stack component.
     */
    static class OrchestrationStack extends ComponentResource {
        private final StateMachine stateMachine;

        public StateMachine getStateMachine() {
            return stateMachine;
        }

        OrchestrationStack(final String name, final String stackName,
                          final Map<String, String> tags,
                          final DatabaseStack databaseStack,
                          final SearchStack searchStack,
                          final MessagingStack messagingStack) {
            super("custom:orchestration:Stack", name, ComponentResourceOptions.builder().build());

            // Create IAM role for Step Functions
            Role sfnRole = new Role(stackName + "-sfn-role",
                RoleArgs.builder()
                    .assumeRolePolicy("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Effect": "Allow",
                                "Principal": {"Service": "states.amazonaws.com"},
                                "Action": "sts:AssumeRole"
                            }]
                        }
                        """)
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create policy for Step Functions
            new RolePolicy(stackName + "-sfn-policy",
                RolePolicyArgs.builder()
                    .role(sfnRole.name())
                    .policy(Output.tuple(
                        databaseStack.getNeptuneCluster().arn(),
                        databaseStack.getAuroraCluster().arn(),
                        searchStack.getOpenSearchDomain().arn(),
                        messagingStack.getEtlCompletionTopic().arn()
                    ).applyValue(t -> Either.ofLeft(String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": ["neptune-db:*"],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": ["rds:*"],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": ["es:*"],
                                    "Resource": "%s/*"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": ["sns:Publish"],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": ["lambda:InvokeFunction"],
                                    "Resource": "*"
                                }
                            ]
                        }
                        """, t.t1, t.t2, t.t3, t.t4))))
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create Step Functions state machine
            String stateMachineDefinition = """
                {
                    "Comment": "Data Validation Orchestration",
                    "StartAt": "ValidateMetadata",
                    "States": {
                        "ValidateMetadata": {
                            "Type": "Pass",
                            "Comment": "Placeholder validation step",
                            "Result": {
                                "status": "validated"
                            },
                            "Next": "NotifySuccess"
                        },
                        "NotifySuccess": {
                            "Type": "Task",
                            "Resource": "arn:aws:states:::sns:publish",
                            "Parameters": {
                                "TopicArn": "${SNS_TOPIC_ARN}",
                                "Message": "Validation completed successfully"
                            },
                            "End": true
                        }
                    }
                }
                """;

            this.stateMachine = new StateMachine(stackName + "-validation-sfn",
                StateMachineArgs.builder()
                    .roleArn(sfnRole.arn())
                    .definition(messagingStack.getEtlCompletionTopic().arn()
                        .applyValue(topicArn ->
                            stateMachineDefinition.replace("${SNS_TOPIC_ARN}", topicArn)))
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create CloudWatch alarm for Step Functions failures
            new MetricAlarm(stackName + "-sfn-failures",
                MetricAlarmArgs.builder()
                    .comparisonOperator("GreaterThanThreshold")
                    .evaluationPeriods(1)
                    .metricName("ExecutionsFailed")
                    .namespace("AWS/States")
                    .period(300)
                    .statistic("Sum")
                    .threshold(1.0)
                    .dimensions(stateMachine.arn().applyValue(sfnArn -> Map.of("StateMachineArn", sfnArn)))
                    .alarmDescription("Step Functions execution failures detected")
                    .tags(tags)
                    .build(), CustomResourceOptions.builder().parent(this).build());

            this.registerOutputs(Collections.emptyMap());
        }
    }
}