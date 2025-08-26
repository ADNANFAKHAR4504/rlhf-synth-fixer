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
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.LifecycleRule;
import software.amazon.awscdk.services.sns.Topic;
import software.amazon.awscdk.services.sns.subscriptions.EmailSubscription;
import software.amazon.awscdk.services.events.Rule;
import software.amazon.awscdk.services.events.Schedule;
import software.amazon.awscdk.services.events.targets.LambdaFunction;
import software.constructs.Construct;

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
        
        // Create VPC peering orchestrator stack
        createVpcPeeringOrchestratorStack(app, environment, costCenter, projectName);
        
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
    
    // NEW: VPC Peering Orchestrator Stack with Lambda
    private static void createVpcPeeringOrchestratorStack(App app, String environment, String costCenter, String projectName) {
        VpcPeeringOrchestratorStack orchestratorStack = new VpcPeeringOrchestratorStack(app, "VpcPeeringOrchestratorStack", 
            StackProps.builder()
                .env(Environment.builder()
                    .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                    .region("us-east-2") // Primary region for orchestrator
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
    
    // NEW: VPC Peering Orchestrator Stack with Lambda
    public static class VpcPeeringOrchestratorStack extends Stack {
        
        public VpcPeeringOrchestratorStack(final Construct scope, final String id, final StackProps props, 
                                          String environment, String costCenter, String projectName) {
            super(scope, id, props);
            
            // Apply standard tags
            applyStandardTags(this, environment, costCenter, projectName);
            
            // Create Lambda function for VPC peering orchestration
            createVpcPeeringOrchestrator(environment, projectName);
        }
        
        private void createVpcPeeringOrchestrator(String environment, String projectName) {
            // Create IAM role for Lambda
            Role lambdaRole = Role.Builder.create(this, "VpcPeeringOrchestratorRole")
                .roleName(String.format("%s-%s-vpc-peering-orchestrator-role", projectName, environment))
                .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                    ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
                    ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2FullAccess")
                ))
                .inlinePolicies(Map.of(
                    "CrossRegionVpcPeeringPolicy", PolicyDocument.Builder.create()
                        .statements(Arrays.asList(
                            PolicyStatement.Builder.create()
                                .effect(Effect.ALLOW)
                                .actions(Arrays.asList(
                                    "ec2:CreateVpcPeeringConnection",
                                    "ec2:AcceptVpcPeeringConnection",
                                    "ec2:DescribeVpcPeeringConnections",
                                    "ec2:DescribeVpcs",
                                    "ec2:CreateTags",
                                    "cloudformation:DescribeStacks",
                                    "cloudformation:ListExports"
                                ))
                                .resources(Arrays.asList("*"))
                                .build()
                        ))
                        .build()
                ))
                .build();
            
            // Create Lambda function
            Function vpcPeeringOrchestrator = Function.Builder.create(this, "VpcPeeringOrchestrator")
                .functionName(String.format("%s-%s-vpc-peering-orchestrator", projectName, environment))
                .runtime(Runtime.PYTHON_3_9)
                .handler("index.handler")
                .code(Code.fromInline(createLambdaCode(environment, projectName)))
                .role(lambdaRole)
                .timeout(Duration.minutes(5))
                .memorySize(256)
                .environment(Map.of(
                    "ENVIRONMENT", environment,
                    "PROJECT_NAME", projectName,
                    "REGIONS", String.join(",", REGIONS)
                ))
                .build();
            
            // Create EventBridge rule to trigger Lambda after deployment
            Rule.Builder.create(this, "VpcPeeringOrchestratorRule")
                .ruleName(String.format("%s-%s-vpc-peering-orchestrator-rule", projectName, environment))
                .description("Trigger VPC peering orchestration after stack deployment")
                .schedule(Schedule.rate(Duration.minutes(5))) // Run every 5 minutes to check for new VPCs
                .targets(Arrays.asList(new LambdaFunction(vpcPeeringOrchestrator)))
                .build();
        }
        
        private String createLambdaCode(String environment, String projectName) {
            return String.format("""
import json
import boto3
import os
import time
from typing import Dict, List, Optional

def handler(event, context):
    print("Starting VPC Peering Orchestration")
    
    environment = os.environ['ENVIRONMENT']
    project_name = os.environ['PROJECT_NAME']
    regions = os.environ['REGIONS'].split(',')
    
    # Get VPC IDs from CloudFormation exports
    vpc_ids = get_vpc_ids_from_exports(regions, project_name, environment)
    
    if not vpc_ids:
        print("No VPCs found in exports yet. Will retry later.")
        return {
            'statusCode': 200,
            'body': json.dumps('No VPCs found - will retry later')
        }
    
    # Create VPC peering connections
    create_vpc_peering_connections(vpc_ids, environment, project_name)
    
    return {
        'statusCode': 200,
        'body': json.dumps('VPC peering orchestration completed')
    }

def get_vpc_ids_from_exports(regions: List[str], project_name: str, environment: str) -> Dict[str, str]:
    """Get VPC IDs from CloudFormation exports across regions."""
    vpc_ids = {}
    cloudformation = boto3.client('cloudformation')
    
    for region in regions:
        try:
            cloudformation_region = boto3.client('cloudformation', region_name=region)
            response = cloudformation_region.list_exports()
            
            export_name = f"{project_name}-{environment}-{region}-vpc-id"
            
            for export in response['Exports']:
                if export['Name'] == export_name:
                    vpc_ids[region] = export['Value']
                    print(f"Found VPC ID for {region}: {export['Value']}")
                    break
            else:
                print(f"VPC export not found for {region}: {export_name}")
                
        except Exception as e:
            print(f"Error getting exports for {region}: {str(e)}")
    
    return vpc_ids

def create_vpc_peering_connections(vpc_ids: Dict[str, str], environment: str, project_name: str):
    """Create VPC peering connections between all regions."""
    if len(vpc_ids) < 2:
        print("Need at least 2 VPCs to create peering connections")
        return
    
    regions = list(vpc_ids.keys())
    ec2_clients = {}
    
    # Create EC2 clients for each region
    for region in regions:
        ec2_clients[region] = boto3.client('ec2', region_name=region)
    
    # Create peering connections between all region pairs
    for i, region1 in enumerate(regions):
        for region2 in regions[i+1:]:
            try:
                print(f"Creating VPC peering between {region1} and {region2}")
                
                # Create peering connection from region1 to region2
                response = ec2_clients[region1].create_vpc_peering_connection(
                    VpcId=vpc_ids[region1],
                    PeerVpcId=vpc_ids[region2],
                    PeerRegion=region2,
                    TagSpecifications=[{
                        'ResourceType': 'vpc-peering-connection',
                        'Tags': [
                            {'Key': 'Name', 'Value': f"{project_name}-{environment}-peering-{region1}-to-{region2}"},
                            {'Key': 'Environment', 'Value': environment},
                            {'Key': 'Project', 'Value': project_name},
                            {'Key': 'ManagedBy', 'Value': 'CDK-Lambda'}
                        ]
                    }]
                )
                
                peering_connection_id = response['VpcPeeringConnection']['VpcPeeringConnectionId']
                print(f"Created peering connection: {peering_connection_id}")
                
                # Accept the peering connection in the target region
                ec2_clients[region2].accept_vpc_peering_connection(
                    VpcPeeringConnectionId=peering_connection_id
                )
                print(f"Accepted peering connection: {peering_connection_id}")
                
                # Wait a moment before creating the next connection
                time.sleep(2)
                
            except Exception as e:
                print(f"Error creating peering between {region1} and {region2}: {str(e)}")
                
                # Check if peering already exists
                try:
                    existing_peerings = ec2_clients[region1].describe_vpc_peering_connections(
                        Filters=[
                            {'Name': 'requester-vpc-info.vpc-id', 'Values': [vpc_ids[region1]]},
                            {'Name': 'accepter-vpc-info.vpc-id', 'Values': [vpc_ids[region2]]}
                        ]
                    )
                    
                    if existing_peerings['VpcPeeringConnections']:
                        print(f"Peering connection already exists between {region1} and {region2}")
                        
                except Exception as check_error:
                    print(f"Error checking existing peering: {str(check_error)}")

def check_existing_peerings(vpc_ids: Dict[str, str]) -> bool:
    """Check if VPC peering connections already exist."""
    if len(vpc_ids) < 2:
        return False
    
    regions = list(vpc_ids.keys())
    ec2_clients = {}
    
    for region in regions:
        ec2_clients[region] = boto3.client('ec2', region_name=region)
    
    # Check if peering exists between first two regions
    try:
        existing_peerings = ec2_clients[regions[0]].describe_vpc_peering_connections(
            Filters=[
                {'Name': 'requester-vpc-info.vpc-id', 'Values': [vpc_ids[regions[0]]]},
                {'Name': 'accepter-vpc-info.vpc-id', 'Values': [vpc_ids[regions[1]]]}
            ]
        )
        
        return len(existing_peerings['VpcPeeringConnections']) > 0
        
    except Exception as e:
        print(f"Error checking existing peerings: {str(e)}")
        return False
""");
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