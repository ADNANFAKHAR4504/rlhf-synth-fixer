package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.pipelines.CodePipeline;
import software.amazon.awscdk.pipelines.CodePipelineSource;
import software.amazon.awscdk.pipelines.ShellStep;
import software.amazon.awscdk.pipelines.StageDeployment;
import software.amazon.awscdk.services.backup.BackupPlan;
import software.amazon.awscdk.services.backup.BackupPlanRule;
import software.amazon.awscdk.services.backup.BackupResource;
import software.amazon.awscdk.services.backup.BackupSelection;
import software.amazon.awscdk.services.backup.BackupVault;
import software.amazon.awscdk.services.cloudtrail.Trail;
import software.amazon.awscdk.services.cloudwatch.Alarm;
import software.amazon.awscdk.services.cloudwatch.ComparisonOperator;
import software.amazon.awscdk.services.cloudwatch.Metric;
import software.amazon.awscdk.services.cloudwatch.TreatMissingData;
import software.amazon.awscdk.services.ec2.CfnVPCPeeringConnection;
import software.amazon.awscdk.services.ec2.IpAddresses;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.PolicyDocument;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.kms.KeySpec;
import software.amazon.awscdk.services.kms.KeyUsage;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.LifecycleRule;
import software.amazon.awscdk.services.sns.Topic;
import software.amazon.awscdk.services.sns.subscriptions.EmailSubscription;
import software.constructs.Construct;
import software.amazon.awscdk.Fn;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Main {
    
    // Configuration constants
    private static final List<String> REGIONS = Arrays.asList("us-east-2", "us-west-2", "eu-west-1");
    private static final List<String> ENVIRONMENTS = Arrays.asList("development", "staging", "production");
    private static final Map<String, String> CIDR_BLOCKS = new HashMap<String, String>() {{
        put("us-east-1", "10.0.0.0/16");
        put("us-east-2", "10.1.0.0/16");
        put("us-west-2", "10.2.0.0/16");
        put("eu-west-1", "10.3.0.0/16");
    }};
    
    public static void main(final String[] args) {
        App app = new App();
        
        // Get context values with defaults
        String environment = app.getNode().tryGetContext("environment") != null ? 
            (String) app.getNode().tryGetContext("environment") : "development";
        String costCenter = app.getNode().tryGetContext("costCenter") != null ? 
            (String) app.getNode().tryGetContext("costCenter") : "default";
        String projectName = app.getNode().tryGetContext("projectName") != null ? 
            (String) app.getNode().tryGetContext("projectName") : "tap-project";
        
        // Create pipeline stack for CI/CD
        createPipelineStack(app, environment, costCenter, projectName);
        
        // Create main infrastructure stacks for each region
        for (String region : REGIONS) {
            createTapStack(app, region, environment, costCenter, projectName);
        }
        
        // Create cross-region networking stack for VPC peering
        createCrossRegionNetworkingStack(app, environment, costCenter, projectName);
        
        app.synth();
    }
    
    private static void createPipelineStack(App app, String environment, String costCenter, String projectName) {
        Stack pipelineStack = new Stack(app, "TapPipelineStack", StackProps.builder()
            .env(Environment.builder()
                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                .region("us-east-2") // Primary region for pipeline
                .build())
            .build());
        
        // Apply tags
        applyStandardTags(pipelineStack, environment, costCenter, projectName);
        
        // Create CodePipeline for multi-region deployment
        CodePipeline pipeline = CodePipeline.Builder.create(pipelineStack, "Pipeline")
            .pipelineName(String.format("%s-pipeline-%s", projectName, environment))
            .synth(ShellStep.Builder.create("Synth")
                .input(CodePipelineSource.gitHub("your-org/your-repo", "main"))
                .commands(Arrays.asList(
                    "npm install -g aws-cdk",
                    "mvn compile",
                    "cdk synth"
                ))
                .build())
            .crossAccountKeys(true)
            .build();
        
        // Add stages for each region
        for (String region : REGIONS) {
            TapStage stage = new TapStage(pipelineStack, String.format("Deploy-%s", region), 
                software.amazon.awscdk.StageProps.builder()
                    .env(Environment.builder()
                        .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                        .region(region)
                        .build())
                    .build(), 
                environment, costCenter, projectName, region);
            
            StageDeployment stageDeployment = pipeline.addStage(stage);
            
            // Add post-deployment validation
            stageDeployment.addPost(ShellStep.Builder.create(String.format("Validate-%s", region))
                .commands(Arrays.asList(
                    "aws cloudformation describe-stacks --region " + region,
                    "echo 'Deployment validation completed for " + region + "'"
                ))
                .build());
        }
    }
    
    private static void createTapStack(App app, String region, String environment, String costCenter, String projectName) {
        TapStack stack = new TapStack(app, String.format("TapStack-%s-%s", region, environment), 
            StackProps.builder()
                .env(Environment.builder()
                    .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                    .region(region)
                    .build())
                .build(), 
            environment, costCenter, projectName, region);
    }
    
    // NEW: Cross-region networking stack for VPC peering
    private static void createCrossRegionNetworkingStack(App app, String environment, String costCenter, String projectName) {
        CrossRegionNetworkingStack networkingStack = new CrossRegionNetworkingStack(app, "CrossRegionNetworkingStack", 
            StackProps.builder()
                .env(Environment.builder()
                    .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                    .region("us-east-2") // Primary region for networking
                    .build())
                .build(), 
            environment, costCenter, projectName);
    }
    
    private static void applyStandardTags(Construct construct, String environment, String costCenter, String projectName) {
        Tags.of(construct).add("Environment", environment);
        Tags.of(construct).add("CostCenter", costCenter);
        Tags.of(construct).add("Project", projectName);
        Tags.of(construct).add("ManagedBy", "CDK");
    }
    
    // Stage class for pipeline deployment
    public static class TapStage extends software.amazon.awscdk.Stage {
        public TapStage(final Construct scope, final String id, final software.amazon.awscdk.StageProps props, 
                       String environment, String costCenter, String projectName, String region) {
            super(scope, id, props);
            
            new TapStack(this, "TapStack", StackProps.builder().build(), 
                environment, costCenter, projectName, region);
        }
    }
    
    // NEW: Cross-region networking stack
    public static class CrossRegionNetworkingStack extends Stack {
        
        public CrossRegionNetworkingStack(final Construct scope, final String id, final StackProps props, 
                                        String environment, String costCenter, String projectName) {
            super(scope, id, props);
            
            // Apply standard tags
            applyStandardTags(this, environment, costCenter, projectName);
            
            // Create VPC peering connections between regions
            // This stack will run after all individual region stacks are deployed
            createCrossRegionVpcPeering(environment, projectName);
        }
        
        private void createCrossRegionVpcPeering(String environment, String projectName) {
            // Create VPC peering connections between all regions
            for (int i = 0; i < REGIONS.size(); i++) {
                for (int j = i + 1; j < REGIONS.size(); j++) {
                    String region1 = REGIONS.get(i);
                    String region2 = REGIONS.get(j);
                    
                    // Create peering connection from region1 to region2
                    CfnVPCPeeringConnection.Builder.create(this, 
                            String.format("Peering%sTo%s", region1.replace("-", ""), region2.replace("-", "")))
                        .vpcId(Fn.importValue(String.format("%s-%s-%s-vpc-id", projectName, environment, region1)))
                        .peerRegion(region2)
                        .peerVpcId(Fn.importValue(String.format("%s-%s-%s-vpc-id", projectName, environment, region2)))
                        .tags(Arrays.asList(
                            software.amazon.awscdk.CfnTag.builder()
                                .key("Name")
                                .value(String.format("%s-%s-peering-%s-to-%s", projectName, environment, region1, region2))
                                .build(),
                            software.amazon.awscdk.CfnTag.builder()
                                .key("Environment")
                                .value(environment)
                                .build(),
                            software.amazon.awscdk.CfnTag.builder()
                                .key("Project")
                                .value(projectName)
                                .build()
                        ))
                        .build();
                }
            }
        }
    }
    
    // Main infrastructure stack
    public static class TapStack extends Stack {
        
        public TapStack(final Construct scope, final String id, final StackProps props, 
                       String environment, String costCenter, String projectName, String region) {
            super(scope, id, props);
            
            // Apply standard tags
            applyStandardTags(this, environment, costCenter, projectName);
            
            // Create KMS key for encryption
            Key kmsKey = createKmsKey(projectName, environment, region);
            
            // Create VPC with dynamic CIDR
            Vpc vpc = createVpc(projectName, environment, region);
            
            // Create S3 buckets with encryption and versioning
            List<Bucket> buckets = createS3Buckets(kmsKey, projectName, environment, region);
            
            // Create IAM roles and policies
            createIamResources(projectName, environment);
            
            // Create backup resources
            createBackupResources(kmsKey, projectName, environment, region);
            
            // Create CloudWatch monitoring
            createCloudWatchMonitoring(buckets, projectName, environment, region);
            
            // Create CloudTrail for auditing
            createCloudTrail(kmsKey, projectName, environment, region);
            
            // Output important resource information
            createOutputs(vpc, kmsKey, buckets);
        }
        
        private Key createKmsKey(String projectName, String environment, String region) {
            return Key.Builder.create(this, "KmsKey")
                .alias(String.format("alias/%s-%s-%s-key", projectName, environment, region))
                .description(String.format("KMS key for %s in %s environment", projectName, environment))
                .keyUsage(KeyUsage.ENCRYPT_DECRYPT)
                .keySpec(KeySpec.SYMMETRIC_DEFAULT)
                .removalPolicy(RemovalPolicy.DESTROY) // Use RETAIN for production
                .build();
        }
        
        private Vpc createVpc(String projectName, String environment, String region) {
            String cidr = CIDR_BLOCKS.get(region);
            
            return Vpc.Builder.create(this, "Vpc")
                .vpcName(String.format("%s-%s-%s-vpc", projectName, environment, region))
                .ipAddresses(IpAddresses.cidr(cidr))
                .maxAzs(3)
                .subnetConfiguration(Arrays.asList(
                    SubnetConfiguration.builder()
                        .name("PublicSubnet")
                        .subnetType(SubnetType.PUBLIC)
                        .cidrMask(24)
                        .build(),
                    SubnetConfiguration.builder()
                        .name("PrivateSubnet")
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .cidrMask(24)
                        .build(),
                    SubnetConfiguration.builder()
                        .name("IsolatedSubnet")
                        .subnetType(SubnetType.PRIVATE_ISOLATED)
                        .cidrMask(24)
                        .build()))
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .build();
        }
        
        private List<Bucket> createS3Buckets(Key kmsKey, String projectName, String environment, String region) {
            // Data bucket
            Bucket dataBucket = Bucket.Builder.create(this, "DataBucket")
                .bucketName(String.format("%s-%s-%s-data-%s", projectName, environment, region, 
                    System.currentTimeMillis() / 1000)) // Ensure uniqueness
                .encryption(BucketEncryption.KMS)
                .encryptionKey(kmsKey)
                .versioned(true)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .lifecycleRules(Arrays.asList(
                    LifecycleRule.builder()
                        .id("TransitionToIA")
                        .enabled(true)
                        .expiration(Duration.days(365))
                        .build()
                ))
                .removalPolicy(RemovalPolicy.DESTROY) // Use RETAIN for production
                .build();
            
            // Logs bucket
            Bucket logsBucket = Bucket.Builder.create(this, "LogsBucket")
                .bucketName(String.format("%s-%s-%s-logs-%s", projectName, environment, region, 
                    System.currentTimeMillis() / 1000))
                .encryption(BucketEncryption.KMS)
                .encryptionKey(kmsKey)
                .versioned(true)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();
            
            return Arrays.asList(dataBucket, logsBucket);
        }
        
        private void createIamResources(String projectName, String environment) {
            // Create managed policy for backup operations
            ManagedPolicy backupPolicy = ManagedPolicy.Builder.create(this, "BackupPolicy")
                .managedPolicyName(String.format("%s-%s-backup-policy", projectName, environment))
                .description("Policy for AWS Backup operations")
                .document(PolicyDocument.Builder.create()
                    .statements(Arrays.asList(
                        PolicyStatement.Builder.create()
                            .effect(Effect.ALLOW)
                            .actions(Arrays.asList(
                                "backup:*",
                                "backup-storage:*"
                            ))
                            .resources(Arrays.asList("*"))
                            .build()
                    ))
                    .build())
                .build();
            
            // Create backup service role
            Role backupRole = Role.Builder.create(this, "BackupRole")
                .roleName(String.format("%s-%s-backup-role", projectName, environment))
                .assumedBy(new ServicePrincipal("backup.amazonaws.com"))
                .managedPolicies(Arrays.asList(backupPolicy))
                .build();
        }
        
        private void createBackupResources(Key kmsKey, String projectName, String environment, String region) {
            // Create backup vault
            BackupVault backupVault = BackupVault.Builder.create(this, "BackupVault")
                .backupVaultName(String.format("%s-%s-%s-vault", projectName, environment, region))
                .encryptionKey(kmsKey)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();
            
            // Create backup plan
            BackupPlan backupPlan = BackupPlan.Builder.create(this, "BackupPlan")
                .backupPlanName(String.format("%s-%s-%s-plan", projectName, environment, region))
                .backupVault(backupVault)
                .backupPlanRules(Arrays.asList(
                    BackupPlanRule.Builder.create()
                        .ruleName("DailyBackup")
                        .scheduleExpression(software.amazon.awscdk.services.events.Schedule.cron(
                            software.amazon.awscdk.services.events.CronOptions.builder()
                                .hour("2")
                                .minute("0")
                                .build()))
                        .deleteAfter(Duration.days(120)) // Fixed: Must be at least 90 days after moveToColdStorage
                        .moveToColdStorageAfter(Duration.days(7))
                        .build()
                ))
                .build();
            
            // Create backup selection
            BackupSelection.Builder.create(this, "BackupSelection")
                .backupPlan(backupPlan)
                .resources(Arrays.asList(
                    BackupResource.fromTag("Environment", environment),
                    BackupResource.fromTag("Project", projectName)
                ))
                .build();
        }
        
        private void createCloudWatchMonitoring(List<Bucket> buckets, String projectName, String environment, String region) {
            // Create SNS topic for alerts
            Topic alertTopic = Topic.Builder.create(this, "AlertTopic")
                .topicName(String.format("%s-%s-%s-alerts", projectName, environment, region))
                .build();
            
            // Add email subscription (configure email via context)
            String alertEmail = (String) this.getNode().tryGetContext("alertEmail");
            if (alertEmail != null) {
                alertTopic.addSubscription(new EmailSubscription(alertEmail));
            }
            
            // Create CloudWatch alarms for S3 buckets
            for (int i = 0; i < buckets.size(); i++) {
                Bucket bucket = buckets.get(i);
                
                Alarm.Builder.create(this, String.format("S3BucketSizeAlarm%d", i))
                    .alarmName(String.format("%s-%s-bucket-size-alarm-%d", projectName, environment, i))
                    .alarmDescription(String.format("Alarm for S3 bucket size: %s", bucket.getBucketName()))
                    .metric(Metric.Builder.create()
                        .namespace("AWS/S3")
                        .metricName("BucketSizeBytes")
                        .dimensionsMap(Map.of(
                            "BucketName", bucket.getBucketName(),
                            "StorageType", "StandardStorage"
                        ))
                        .statistic("Average")
                        .period(Duration.hours(24))
                        .build())
                    .threshold(1000000000.0) // 1GB threshold
                    .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                    .evaluationPeriods(1)
                    .treatMissingData(TreatMissingData.NOT_BREACHING)
                    .build();
            }
        }
        
        private void createCloudTrail(Key kmsKey, String projectName, String environment, String region) {
            // Create CloudTrail for auditing
            Trail.Builder.create(this, "CloudTrail")
                .trailName(String.format("%s-%s-%s-trail", projectName, environment, region))
                .includeGlobalServiceEvents(true)
                .isMultiRegionTrail(false) // Region-specific trail
                .enableFileValidation(true)
                .build();
        }
        
        private void createOutputs(Vpc vpc, Key kmsKey, List<Bucket> buckets) {
            CfnOutput.Builder.create(this, "VpcId")
                .value(vpc.getVpcId())
                .description("VPC ID")
                .exportName(String.format("%s-%s-%s-vpc-id", 
                    (String) this.getNode().tryGetContext("projectName") != null ? 
                        (String) this.getNode().tryGetContext("projectName") : "tap-project",
                    (String) this.getNode().tryGetContext("environment") != null ? 
                        (String) this.getNode().tryGetContext("environment") : "development",
                    (String) this.getNode().tryGetContext("region") != null ? 
                        (String) this.getNode().tryGetContext("region") : "unknown"))
                .build();
            
            CfnOutput.Builder.create(this, "KmsKeyId")
                .value(kmsKey.getKeyId())
                .description("KMS Key ID")
                .exportName(String.format("%s-kms-key-id", this.getStackName()))
                .build();
            
            for (int i = 0; i < buckets.size(); i++) {
                CfnOutput.Builder.create(this, String.format("S3Bucket%dName", i))
                    .value(buckets.get(i).getBucketName())
                    .description(String.format("S3 Bucket %d Name", i))
                    .exportName(String.format("%s-s3-bucket-%d-name", this.getStackName(), i))
                    .build();
            }
        }
    }
}