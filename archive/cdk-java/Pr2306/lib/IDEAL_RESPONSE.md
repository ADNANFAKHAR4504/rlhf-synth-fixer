```java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.CfnOutputProps;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.constructs.Construct;
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
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.PolicyDocument;
import software.amazon.awscdk.services.iam.PolicyStatement;

import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.kms.KeySpec;
import software.amazon.awscdk.services.kms.KeyUsage;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.LifecycleRule;

import software.amazon.awscdk.services.sns.Topic;
import software.amazon.awscdk.services.wafv2.CfnWebACL;
import software.amazon.awscdk.services.wafv2.CfnWebACL.RuleProperty;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Main extends App {
    private static final List<String> REGIONS = Arrays.asList("us-east-1", "us-east-2", "eu-west-1");
    private static final Map<String, String> CIDR_BLOCKS = new HashMap<String, String>() {{
        put("us-east-1", "10.0.0.0/16");
        put("us-east-2", "10.1.0.0/16");
        put("us-west-2", "10.2.0.0/16");
        put("eu-west-1", "10.3.0.0/16");
    }};

    public static void main(final String[] args) {
        App app = new App();
        
        // Get context values
        String environment = (String) app.getNode().tryGetContext("environment");
        String costCenter = (String) app.getNode().tryGetContext("costCenter");
        String projectName = (String) app.getNode().tryGetContext("projectName");
        
        if (environment == null) environment = "development";
        if (costCenter == null) costCenter = "tap";
        if (projectName == null) projectName = "tap-project";
        
        // Create pipeline stack
        new TapPipelineStack(app, "TapPipelineStack", StackProps.builder()
            .env(Environment.builder()
                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                .region(System.getenv("CDK_DEFAULT_REGION"))
                .build())
            .build(), environment, costCenter, projectName);
        
        app.synth();
    }

    public static class TapPipelineStack extends Stack {
        public TapPipelineStack(final Construct scope, final String id, final StackProps props, 
                              String environment, String costCenter, String projectName) {
            super(scope, id, props);
            
            // Create S3 bucket for pipeline source (more suitable for testing/demo)
            // Note: For production use, configure with actual GitHub repo via environment variables
            Bucket sourceBucket = Bucket.Builder.create(this, "PipelineSourceBucket")
                .bucketName(String.format("%s-%s-pipeline-source-%s", projectName, environment, 
                    System.getenv("CDK_DEFAULT_ACCOUNT")))
                .versioned(true)
                .blockPublicAccess(software.amazon.awscdk.services.s3.BlockPublicAccess.BLOCK_ALL)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();
            
            CodePipeline pipeline = CodePipeline.Builder.create(this, "Pipeline")
                .pipelineName(String.format("%s-%s-pipeline", projectName, environment))
                .crossAccountKeys(true)
                .dockerEnabledForSynth(true)
                .synth(ShellStep.Builder.create("Synth")
                    .input(CodePipelineSource.s3(sourceBucket, "source.zip"))
                    .commands(Arrays.asList(
                        "npm ci",
                        "npm run build",
                        "npx cdk synth"
                    ))
                    .build())
                .build();
            
            // Create stages for each region
            for (String region : REGIONS) {
                TapStage stage = new TapStage(this, String.format("Deploy-%s", region), 
                    software.amazon.awscdk.StageProps.builder()
                        .env(Environment.builder()
                            .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                            .region(region)
                            .build())
                        .build(), 
                    environment, costCenter, projectName, region);
                
                pipeline.addStage(stage);
            }
            
            // Create cross-region networking stack with Lambda
            new CrossRegionNetworkingStack(this, "CrossRegionNetworkingStack", 
                StackProps.builder()
                    .env(Environment.builder()
                        .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                        .region(System.getenv("CDK_DEFAULT_REGION"))
                        .build())
                    .build(), 
                environment, projectName);
        }
    }

    public static class TapStage extends software.amazon.awscdk.Stage {
        public TapStage(final Construct scope, final String id, final software.amazon.awscdk.StageProps props, 
                       String environment, String costCenter, String projectName, String region) {
            super(scope, id, props);
            
            new TapStack(this, String.format("TapStack-%s-%s", region, environment), 
                StackProps.builder()
                    .env(props.getEnv())
                    .build(), 
                environment, costCenter, projectName, region);
        }
    }

    public static class TapStack extends Stack {
        private Vpc vpc;
        private Key kmsKey;
        private Bucket s3Bucket;
        private Bucket logsBucket;
        private BackupVault backupVault;
        
        public TapStack(final Construct scope, final String id, final StackProps props, 
                       String environment, String costCenter, String projectName, String region) {
            super(scope, id, props);
            
            // Create VPC
            createVpc(environment, projectName, region);
            
            // Create KMS key
            createKmsKey(environment, projectName, region);
            
            // Create S3 bucket
            createS3Bucket(environment, projectName, region);
            
            // Create backup resources
            createBackupResources(environment, projectName, region);
            
            // Create monitoring and alerting
            createMonitoringAndAlerting(environment, projectName, region);
            
            // Create IAM resources
            createIamResources(environment, projectName, region);
            
            // Create CloudTrail
            createCloudTrail(kmsKey, projectName, environment, region);
            
            // Create WAF
            createWaf(environment, projectName, region);
            
            // Create outputs
            createOutputs(environment, projectName, region);
            
            // Add tags
            Tags.of(this).add("Environment", environment);
            Tags.of(this).add("Project", projectName);
            Tags.of(this).add("CostCenter", costCenter);
            Tags.of(this).add("Region", region);
        }
        
        private void createVpc(String environment, String projectName, String region) {
            String cidrBlock = CIDR_BLOCKS.get(region);
            if (cidrBlock == null) {
                throw new IllegalArgumentException("No CIDR block defined for region: " + region);
            }
            
            vpc = Vpc.Builder.create(this, "VPC")
                .vpcName(String.format("%s-%s-%s-vpc", projectName, environment, region))
                .ipAddresses(IpAddresses.cidr(cidrBlock))
                .maxAzs(2)
                .subnetConfiguration(Arrays.asList(
                    software.amazon.awscdk.services.ec2.SubnetConfiguration.builder()
                        .name("Public")
                        .subnetType(SubnetType.PUBLIC)
                        .cidrMask(24)
                        .build(),
                    software.amazon.awscdk.services.ec2.SubnetConfiguration.builder()
                        .name("Private")
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .cidrMask(24)
                        .build()
                ))
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .build();
            
            // Export VPC ID for cross-region peering
            new CfnOutput(this, "VpcIdExport", CfnOutputProps.builder()
                .value(vpc.getVpcId())
                .exportName(String.format("%s-%s-%s-vpc-id", projectName, environment, region))
                .description("VPC ID for cross-region peering")
                .build());
        }
        
        private void createKmsKey(String environment, String projectName, String region) {
            kmsKey = Key.Builder.create(this, "KMSKey")
                .keySpec(KeySpec.SYMMETRIC_DEFAULT)
                .keyUsage(KeyUsage.ENCRYPT_DECRYPT)
                .enableKeyRotation(true)
                .description(String.format("KMS key for %s %s in %s", projectName, environment, region))
                .alias(String.format("%s-%s-%s-key", projectName, environment, region))
                .build();
        }
        
        private void createS3Bucket(String environment, String projectName, String region) {
            // Data bucket
            s3Bucket = Bucket.Builder.create(this, "DataS3Bucket")
                .bucketName(String.format("%s-%s-%s-%s-data", projectName, environment, region, 
                    System.getenv("CDK_DEFAULT_ACCOUNT")))
                .encryption(BucketEncryption.S3_MANAGED)
                .versioned(true)
                .blockPublicAccess(software.amazon.awscdk.services.s3.BlockPublicAccess.BLOCK_ALL)
                .removalPolicy(RemovalPolicy.DESTROY)
                .lifecycleRules(Arrays.asList(
                    LifecycleRule.builder()
                        .id("TransitionToIA")
                        .enabled(true)
                        .expiration(Duration.days(365))
                        .build()
                ))
                .build();
                
            // Logs bucket
            logsBucket = Bucket.Builder.create(this, "LogsS3Bucket")
                .bucketName(String.format("%s-%s-%s-%s-logs", projectName, environment, region, 
                    System.getenv("CDK_DEFAULT_ACCOUNT")))
                .encryption(BucketEncryption.S3_MANAGED)
                .versioned(true)
                .blockPublicAccess(software.amazon.awscdk.services.s3.BlockPublicAccess.BLOCK_ALL)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();
        }
        
        private void createBackupResources(String environment, String projectName, String region) {
            // Create backup vault
            backupVault = BackupVault.Builder.create(this, "BackupVault")
                .backupVaultName(String.format("%s-%s-%s-vault", projectName, environment, region))
                .encryptionKey(kmsKey)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();
            
            // Create backup plan with rules using the high-level CDK approach
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
                        .deleteAfter(Duration.days(120)) // Must be at least 90 days after moveToColdStorage
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
        
        private void createMonitoringAndAlerting(String environment, String projectName, String region) {
            // Create SNS topic
            Topic snsTopic = Topic.Builder.create(this, "SNSTopic")
                .topicName(String.format("%s-%s-%s-alerts", projectName, environment, region))
                .build();
            
            // Create CloudWatch alarm for unauthorized API calls
            Alarm alarm = Alarm.Builder.create(this, "UnauthorizedAPICallsAlarm")
                .alarmName(String.format("%s-unauthorized-api-calls", projectName))
                .metric(Metric.Builder.create()
                    .namespace("AWS/CloudTrail")
                    .metricName("UnauthorizedAPICalls")
                    .dimensionsMap(Map.of("Region", region))
                    .build())
                .threshold(1)
                .evaluationPeriods(1)
                .comparisonOperator(ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD)
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build();
            
            // Add alarm to SNS topic
            alarm.addAlarmAction(new software.amazon.awscdk.services.cloudwatch.actions.SnsAction(snsTopic));
        }
        
        private void createIamResources(String environment, String projectName, String region) {
            // Create MFA enforcement policy
            ManagedPolicy.Builder.create(this, "MFAPolicy")
                .managedPolicyName(String.format("%s-mfa-enforcement-policy", projectName))
                .document(PolicyDocument.Builder.create()
                    .statements(Arrays.asList(
                        PolicyStatement.Builder.create()
                            .effect(Effect.DENY)
                            .actions(Arrays.asList("*"))
                            .resources(Arrays.asList("*"))
                            .conditions(Map.of(
                                "StringNotEquals", Map.of(
                                    "aws:MultiFactorAuthPresent", "true"
                                )
                            ))
                            .build()
                    ))
                    .build())
                .build();
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
        
        private void createWaf(String environment, String projectName, String region) {
            // Create WAF Web ACL
            CfnWebACL.Builder.create(this, "WebACL")
                .name(String.format("%s-%s-%s-webacl", projectName, environment, region))
                .defaultAction(CfnWebACL.DefaultActionProperty.builder()
                    .allow(CfnWebACL.AllowActionProperty.builder().build())
                    .build())
                .scope("REGIONAL")
                .visibilityConfig(CfnWebACL.VisibilityConfigProperty.builder()
                    .cloudWatchMetricsEnabled(true)
                    .metricName(String.format("%s-%s-%s-webacl-metric", projectName, environment, region))
                    .sampledRequestsEnabled(true)
                    .build())
                .rules(Arrays.asList(
                    RuleProperty.builder()
                        .name("RateLimitRule")
                        .priority(1)
                        .statement(CfnWebACL.StatementProperty.builder()
                            .rateBasedStatement(CfnWebACL.RateBasedStatementProperty.builder()
                                .limit(2000)
                                .aggregateKeyType("IP")
                                .build())
                            .build())
                        .action(CfnWebACL.RuleActionProperty.builder()
                            .block(CfnWebACL.BlockActionProperty.builder().build())
                            .build())
                        .visibilityConfig(CfnWebACL.VisibilityConfigProperty.builder()
                            .cloudWatchMetricsEnabled(true)
                            .metricName("RateLimitRule")
                            .sampledRequestsEnabled(true)
                            .build())
                        .build()
                ))
                .build();
        }
        
        private void createOutputs(String environment, String projectName, String region) {
            new CfnOutput(this, "VpcId", CfnOutputProps.builder()
                .value(vpc.getVpcId())
                .description("VPC ID")
                .exportName(String.format("%s-%s-%s-vpc-id", projectName, environment, region))
                .build());
            
            new CfnOutput(this, "S3Bucket0Name", CfnOutputProps.builder()
                .value(s3Bucket.getBucketName())
                .description("S3 Data Bucket Name")
                .build());
                
            new CfnOutput(this, "S3Bucket1Name", CfnOutputProps.builder()
                .value(logsBucket.getBucketName())
                .description("S3 Logs Bucket Name")
                .build());
            
            new CfnOutput(this, "KmsKeyId", CfnOutputProps.builder()
                .value(kmsKey.getKeyId())
                .description("KMS Key ID")
                .build());
        }
    }

    public static class CrossRegionNetworkingStack extends Stack {
        private Function vpcPeeringFunction;
        
        public CrossRegionNetworkingStack(final Construct scope, final String id, final StackProps props,
                                        String environment, String projectName) {
            super(scope, id, props);
            
            // Create Lambda function for VPC peering
            createVpcPeeringLambda(environment, projectName);
            
            // Create CloudWatch Events rule to trigger Lambda after stack deployment
            createTriggerRule(environment, projectName);
        }
        
        private void createVpcPeeringLambda(String environment, String projectName) {
            // Lambda function code as a string
            String lambdaCode = "import boto3\\n" +
                "import json\\n" +
                "import time\\n" +
                "from botocore.exceptions import ClientError\\n\\n" +
                "def lambda_handler(event, context):\\n" +
                "    # Get VPC IDs from CloudFormation exports across regions\\n" +
                "    regions = ['us-east-1', 'us-east-2', 'eu-west-1']\\n" +
                "    vpc_ids = {}\\n\\n" +
                "    for region in regions:\\n" +
                "        try:\\n" +
                "            cfn = boto3.client('cloudformation', region_name=region)\\n" +
                "            response = cfn.describe_stacks()\\n\\n" +
                "            for stack in response['Stacks']:\\n" +
                "                if stack['StackName'].startswith(f'tap-project-{environment}'):\\n" +
                "                    for output in stack.get('Outputs', []):\\n" +
                "                        if output['OutputKey'] == 'VpcId':\\n" +
                "                            vpc_ids[region] = output['OutputValue']\\n" +
                "                            break\\n" +
                "        except Exception as e:\\n" +
                "            print(f\"Error getting VPC ID for {region}: {e}\")\\n\\n" +
                "    # Create VPC peering connections between all regions\\n" +
                "    ec2 = boto3.client('ec2')\\n\\n" +
                "    for i, region1 in enumerate(regions):\\n" +
                "        for region2 in regions[i+1:]:\\n" +
                "            if region1 in vpc_ids and region2 in vpc_ids:\\n" +
                "                try:\\n" +
                "                    # Check if peering connection already exists\\n" +
                "                    existing_peerings = ec2.describe_vpc_peering_connections(\\n" +
                "                        Filters=[\\n" +
                "                            {'Name': 'requester-vpc-id', 'Values': [vpc_ids[region1]]},\\n" +
                "                            {'Name': 'accepter-vpc-id', 'Values': [vpc_ids[region2]]}\\n" +
                "                        ]\\n" +
                "                    )\\n\\n" +
                "                    if not existing_peerings['VpcPeeringConnections']:\\n" +
                "                        # Create peering connection\\n" +
                "                        peering = ec2.create_vpc_peering_connection(\\n" +
                "                            VpcId=vpc_ids[region1],\\n" +
                "                            PeerVpcId=vpc_ids[region2],\\n" +
                "                            PeerRegion=region2\\n" +
                "                        )\\n\\n" +
                "                        # Accept the peering connection\\n" +
                "                        ec2_peer = boto3.client('ec2', region_name=region2)\\n" +
                "                        ec2_peer.accept_vpc_peering_connection(\\n" +
                "                            VpcPeeringConnectionId=peering['VpcPeeringConnection']['VpcPeeringConnectionId']\\n" +
                "                        )\\n\\n" +
                "                        print(f\"Created VPC peering between {region1} and {region2}\")\\n" +
                "                    else:\\n" +
                "                        print(f\"VPC peering already exists between {region1} and {region2}\")\\n\\n" +
                "                except Exception as e:\\n" +
                "                    print(f\"Error creating VPC peering between {region1} and {region2}: {e}\")\\n\\n" +
                "    return {\\n" +
                "        'statusCode': 200,\\n" +
                "        'body': json.dumps('VPC peering setup completed')\\n" +
                "    }";
            
            vpcPeeringFunction = Function.Builder.create(this, "VpcPeeringFunction")
                .functionName(String.format("%s-%s-vpc-peering", projectName, environment))
                .runtime(Runtime.PYTHON_3_9)
                .handler("index.lambda_handler")
                .code(Code.fromInline(lambdaCode))
                .timeout(Duration.minutes(5))
                .memorySize(256)
                .build();
            
            // Add IAM permissions for Lambda
            vpcPeeringFunction.addToRolePolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(Arrays.asList(
                    "ec2:CreateVpcPeeringConnection",
                    "ec2:AcceptVpcPeeringConnection",
                    "ec2:DescribeVpcPeeringConnections",
                    "cloudformation:DescribeStacks"
                ))
                .resources(Arrays.asList("*"))
                .build());
        }
        
        private void createTriggerRule(String environment, String projectName) {
            // Create CloudWatch Events rule to trigger Lambda after stack deployment
            software.amazon.awscdk.services.events.Rule.Builder.create(this, "VpcPeeringTrigger")
                .ruleName(String.format("%s-%s-vpc-peering-trigger", projectName, environment))
                .description("Trigger VPC peering setup after stack deployment")
                .eventPattern(software.amazon.awscdk.services.events.EventPattern.builder()
                    .source(Arrays.asList("aws.cloudformation"))
                    .detailType(Arrays.asList("CloudFormation Stack Status Change"))
                    .detail(Map.of(
                        "status-details", Map.of(
                            "status", Arrays.asList("CREATE_COMPLETE", "UPDATE_COMPLETE")
                        )
                    ))
                    .build())
                .targets(Arrays.asList(
                    new software.amazon.awscdk.services.events.targets.LambdaFunction(vpcPeeringFunction)
                ))
                .build();
        }
    }
}
```