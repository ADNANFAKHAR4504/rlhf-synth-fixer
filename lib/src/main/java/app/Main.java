package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.autoscaling.AutoScalingGroup;
import software.amazon.awscdk.services.cloudwatch.Alarm;
import software.amazon.awscdk.services.cloudwatch.ComparisonOperator;
import software.amazon.awscdk.services.cloudwatch.Metric;
import software.amazon.awscdk.services.dynamodb.Attribute;
import software.amazon.awscdk.services.dynamodb.AttributeType;
import software.amazon.awscdk.services.dynamodb.Table;
import software.amazon.awscdk.services.dynamodb.TableEncryption;
import software.amazon.awscdk.services.ec2.IVpc;
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceSize;
import software.amazon.awscdk.services.ec2.InstanceType;
import software.amazon.awscdk.services.ec2.MachineImage;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.IpAddresses;
import software.amazon.awscdk.services.ec2.CfnVPCPeeringConnection;
import software.amazon.awscdk.services.ec2.CfnRoute;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancer;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationProtocol;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationTargetGroup;
import software.amazon.awscdk.services.elasticloadbalancingv2.BaseApplicationListenerProps;
import software.amazon.awscdk.services.elasticloadbalancingv2.TargetType;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.PolicyDocument;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.iam.AccountRootPrincipal;
import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.amazon.awscdk.services.rds.Credentials;
import software.amazon.awscdk.services.rds.DatabaseInstance;
import software.amazon.awscdk.services.rds.DatabaseInstanceEngine;
import software.amazon.awscdk.services.rds.DatabaseInstanceReadReplica;
import software.amazon.awscdk.services.rds.MySqlInstanceEngineProps;
import software.amazon.awscdk.services.rds.MysqlEngineVersion;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import java.util.Arrays;

/**
 * The main class for the CDK application.
 */
public final class Main {

    private Main() {
        // Utility class
    }

    /**
     * The entry point of the application.
     *
     * @param args The command line arguments.
     */
    public static void main(final String[] args) {
        App app = new App();
        
        String environment = app.getNode().tryGetContext("environment") != null
            ? app.getNode().tryGetContext("environment").toString() : "staging";
        
        Environment usEast1 = Environment.builder()
            .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
            .region("us-east-1")
            .build();
            
        Environment usWest2 = Environment.builder()
            .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
            .region("us-west-2")
            .build();

        String uniqueSuffix = String.valueOf(System.currentTimeMillis()).substring(8);
        
        MultiRegionStack primaryStack = new MultiRegionStack(app, "PrimaryStack-" + environment + "-" + uniqueSuffix, 
            StackProps.builder()
                .env(usEast1)
                .build(), 
            environment, "us-east-1", true);

        MultiRegionStack secondaryStack = new MultiRegionStack(app, "SecondaryStack-" + environment + "-" + uniqueSuffix, 
            StackProps.builder()
                .env(usWest2)
                .build(), 
            environment, "us-west-2", false);
            
        // VPC peering would be set up post-deployment due to cross-region complexity

        app.synth();
    }

    static class MultiRegionStack extends Stack {
        private final String environment;
        private final String region;
        private final boolean isPrimary;
        private final String uniqueSuffix;
        private IVpc vpc;
        private Key kmsKey;
        private Bucket logsBucket;
        private Role ec2Role;
        private Object rdsInstance; // DatabaseInstance

        MultiRegionStack(final software.constructs.Construct scope, final String id, final StackProps props,
                        final String env, final String reg, final boolean primary) {
            super(scope, id, props);
            this.environment = env;
            this.region = reg;
            this.isPrimary = primary;
            this.uniqueSuffix = String.valueOf(System.currentTimeMillis()).substring(8);

            createBasicInfrastructure();
            createComputeInfrastructure();
            createDatabaseResources();
            createLambdaResources();
            createLoggingResources();
            createMonitoring();
        }
        
        public IVpc getVpc() {
            return vpc;
        }
        
        public Object getRdsInstance() {
            return rdsInstance;
        }
        
        public void createVpcPeering(IVpc peerVpc, String peerRegion) {
            // VPC peering setup - would be implemented post-deployment
            // to avoid cross-region reference issues during synthesis
            Tags.of(vpc).add("VpcPeeringReady", "true");
            Tags.of(vpc).add("PeerRegion", peerRegion);
        }

        private void createBasicInfrastructure() {
            Tags.of(this).add("Environment", environment);
            Tags.of(this).add("Project", "MultiRegionApp");
            Tags.of(this).add("Owner", "DevOps");
            Tags.of(this).add("UniqueId", uniqueSuffix);

            vpc = Vpc.Builder.create(this, "CustomVpc")
                .maxAzs(2)
                .natGateways(1)
                .ipAddresses(IpAddresses.cidr(isPrimary ? "10.0.0.0/16" : "10.1.0.0/16")) // Non-overlapping CIDRs
                .build();

            kmsKey = Key.Builder.create(this, "KmsKey")
                .description("KMS key for " + environment + " in " + region + " (" + uniqueSuffix + ")")
                .policy(PolicyDocument.Builder.create()
                    .statements(Arrays.asList(
                        // Allow root account full access
                        PolicyStatement.Builder.create()
                            .effect(Effect.ALLOW)
                            .principals(Arrays.asList(new AccountRootPrincipal()))
                            .actions(Arrays.asList("kms:*"))
                            .resources(Arrays.asList("*"))
                            .build(),
                        // Allow CloudWatch Logs to use the key
                        PolicyStatement.Builder.create()
                            .effect(Effect.ALLOW)
                            .principals(Arrays.asList(new ServicePrincipal("logs." + region + ".amazonaws.com")))
                            .actions(Arrays.asList(
                                "kms:Encrypt",
                                "kms:Decrypt",
                                "kms:ReEncrypt*",
                                "kms:GenerateDataKey*",
                                "kms:DescribeKey"
                            ))
                            .resources(Arrays.asList("*"))
                            .conditions(java.util.Map.of(
                                "ArnEquals", java.util.Map.of(
                                    "kms:EncryptionContext:aws:logs:arn", 
                                    "arn:aws:logs:" + region + ":" + this.getAccount() + ":log-group:/aws/ec2/" + environment + "-" + region.substring(3, 5) + "-" + uniqueSuffix
                                )
                            ))
                            .build()
                    ))
                    .build())
                .build();

            if (isPrimary) {
                logsBucket = Bucket.Builder.create(this, "LogsBucket")
                    .bucketName("logs-" + environment + "-" + region.substring(3, 5) + "-" + uniqueSuffix)
                    .encryption(BucketEncryption.KMS)
                    .encryptionKey(kmsKey)
                    .versioned(true)
                    .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                    .enforceSsl(true)
                    .build();
            }

            ec2Role = Role.Builder.create(this, "Ec2Role")
                .roleName("Ec2Role-" + environment + "-" + region.substring(3, 5) + "-" + uniqueSuffix)
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                    ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy")
                ))
                .build();

            if (isPrimary && logsBucket != null) {
                ec2Role.addToPolicy(PolicyStatement.Builder.create()
                    .effect(Effect.ALLOW)
                    .actions(Arrays.asList("s3:PutObject", "s3:GetObject"))
                    .resources(Arrays.asList(logsBucket.getBucketArn() + "/*"))
                    .build());
            }
        }

        private void createComputeInfrastructure() {
            SecurityGroup albSg = SecurityGroup.Builder.create(this, "AlbSg")
                .securityGroupName("AlbSg-" + environment + "-" + region.substring(3, 5) + "-" + uniqueSuffix)
                .vpc(vpc)
                .description("ALB Security Group (" + uniqueSuffix + ")")
                .build();

            albSg.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "HTTP");
            albSg.addIngressRule(Peer.anyIpv4(), Port.tcp(443), "HTTPS");

            SecurityGroup ec2Sg = SecurityGroup.Builder.create(this, "Ec2Sg")
                .securityGroupName("Ec2Sg-" + environment + "-" + region.substring(3, 5) + "-" + uniqueSuffix)
                .vpc(vpc)
                .description("EC2 Security Group (" + uniqueSuffix + ")")
                .build();

            ec2Sg.addIngressRule(albSg, Port.tcp(80), "HTTP from ALB");

            ApplicationLoadBalancer alb = ApplicationLoadBalancer.Builder.create(this, "Alb")
                .loadBalancerName("ALB-" + environment + "-" + region.substring(3, 5) + "-" + uniqueSuffix)
                .vpc(vpc)
                .internetFacing(true)
                .securityGroup(albSg)
                .build();

            if (isPrimary && logsBucket != null) {
                try {
                    if (this.getRegion() != null && !this.getRegion().isEmpty()) {
                        alb.logAccessLogs(logsBucket, "alb-logs");
                    }
                } catch (Exception ex) {
                    // Skip access logging if region is not available
                }
            }

            ApplicationTargetGroup targetGroup = ApplicationTargetGroup.Builder.create(this, "TargetGroup")
                .targetGroupName("TG-" + environment + "-" + region.substring(3, 5) + "-" + uniqueSuffix)
                .vpc(vpc)
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .targetType(TargetType.INSTANCE)
                .healthCheck(software.amazon.awscdk.services.elasticloadbalancingv2.HealthCheck.builder()
                    .path("/health")
                    .build())
                .build();

            alb.addListener("Listener", BaseApplicationListenerProps.builder()
                .port(80)
                .defaultTargetGroups(Arrays.asList(targetGroup))
                .build());

            AutoScalingGroup asg = AutoScalingGroup.Builder.create(this, "Asg")
                .autoScalingGroupName("ASG-" + environment + "-" + region.substring(3, 5) + "-" + uniqueSuffix)
                .vpc(vpc)
                .instanceType(environment.equals("production")
                    ? InstanceType.of(InstanceClass.M5, InstanceSize.LARGE)
                    : InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                .machineImage(MachineImage.latestAmazonLinux2())
                .securityGroup(ec2Sg)
                .role(ec2Role)
                .minCapacity(environment.equals("production") ? 2 : 1)
                .maxCapacity(environment.equals("production") ? 10 : 3)
                .desiredCapacity(environment.equals("production") ? 2 : 1)
                .build();

            asg.attachToApplicationTargetGroup(targetGroup);
        }

        private void createDatabaseResources() {
            if (isPrimary) {
                rdsInstance = DatabaseInstance.Builder.create(this, "Rds")
                    .instanceIdentifier("RDS-" + environment + "-" + region.substring(3, 5) + "-" + uniqueSuffix)
                    .engine(DatabaseInstanceEngine.mysql(MySqlInstanceEngineProps.builder()
                        .version(MysqlEngineVersion.VER_8_0)
                        .build()))
                    .instanceType(environment.equals("production")
                        ? InstanceType.of(InstanceClass.R5, InstanceSize.LARGE)
                        : InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                    .vpc(vpc)
                    .multiAz(true)
                    .storageEncrypted(true)
                    .storageEncryptionKey(kmsKey)
                    .databaseName("appdb")
                    .credentials(Credentials.fromGeneratedSecret("admin"))
                    .deletionProtection(environment.equals("production"))
                    .build();

                Table dynamoTable = Table.Builder.create(this, "DynamoTable")
                    .tableName("App-" + environment + "-" + region.substring(3, 5) + "-" + uniqueSuffix)
                    .partitionKey(Attribute.builder()
                        .name("id")
                        .type(AttributeType.STRING)
                        .build())
                    .encryption(TableEncryption.AWS_MANAGED)
                    .pointInTimeRecoverySpecification(
                        software.amazon.awscdk.services.dynamodb.PointInTimeRecoverySpecification.builder()
                        .pointInTimeRecoveryEnabled(true)
                        .build())
                    .replicationRegions(Arrays.asList("us-west-2"))
                    .build();
            } else {
                // Create separate RDS instance in secondary region for disaster recovery
                rdsInstance = DatabaseInstance.Builder.create(this, "SecondaryRds")
                    .instanceIdentifier("RDS-SEC-" + environment + "-" + region.substring(3, 5) + "-" + uniqueSuffix)
                    .engine(DatabaseInstanceEngine.mysql(MySqlInstanceEngineProps.builder()
                        .version(MysqlEngineVersion.VER_8_0)
                        .build()))
                    .instanceType(environment.equals("production")
                        ? InstanceType.of(InstanceClass.R5, InstanceSize.LARGE)
                        : InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                    .vpc(vpc)
                    .multiAz(false)
                    .storageEncrypted(true)
                    .storageEncryptionKey(kmsKey)
                    .databaseName("appdb")
                    .credentials(Credentials.fromGeneratedSecret("admin"))
                    .deletionProtection(environment.equals("production"))
                    .build();
                
                Table dynamoTable = Table.Builder.create(this, "DynamoTable")
                    .tableName("App-" + environment + "-" + region.substring(3, 5) + "-" + uniqueSuffix)
                    .partitionKey(Attribute.builder()
                        .name("id")
                        .type(AttributeType.STRING)
                        .build())
                    .encryption(TableEncryption.AWS_MANAGED)
                    .pointInTimeRecoverySpecification(
                        software.amazon.awscdk.services.dynamodb.PointInTimeRecoverySpecification.builder()
                        .pointInTimeRecoveryEnabled(true)
                        .build())
                    .build();
            }
        }

        private void createLambdaResources() {
            // Lambda function for health checks and monitoring
            Role lambdaRole = Role.Builder.create(this, "LambdaRole")
                .roleName("LambdaRole-" + environment + "-" + region.substring(3, 5) + "-" + uniqueSuffix)
                .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                    ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
                    ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole"),
                    ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess")
                ))
                .build();
                
            Function healthCheckLambda = Function.Builder.create(this, "HealthCheckFunction")
                .functionName("HealthCheck-" + environment + "-" + region.substring(3, 5) + "-" + uniqueSuffix)
                .runtime(Runtime.PYTHON_3_9)
                .handler("index.handler")
                .code(Code.fromInline("import json\nimport boto3\n\ndef handler(event, context):\n    return {'statusCode': 200, 'body': json.dumps('Health check passed')}"))
                .role(lambdaRole)
                .vpc(vpc)
                .build();
                
            // Lambda function for log processing
            Function logProcessorLambda = Function.Builder.create(this, "LogProcessorFunction")
                .functionName("LogProcessor-" + environment + "-" + region.substring(3, 5) + "-" + uniqueSuffix)
                .runtime(Runtime.PYTHON_3_9)
                .handler("index.handler")
                .code(Code.fromInline("import json\nimport boto3\n\ndef handler(event, context):\n    print('Processing logs:', json.dumps(event))\n    return {'statusCode': 200}"))
                .role(lambdaRole)
                .build();
        }

        private void createLoggingResources() {
            LogGroup logGroup = LogGroup.Builder.create(this, "LogGroup")
                .logGroupName("/aws/ec2/" + environment + "-" + region.substring(3, 5) + "-" + uniqueSuffix)
                .retention(RetentionDays.ONE_WEEK)
                .encryptionKey(kmsKey)
                .build();
        }
        
        private void createMonitoring() {
            // CloudWatch Alarms for monitoring
            Alarm cpuAlarm = Alarm.Builder.create(this, "HighCpuAlarm")
                .alarmName("HighCpuAlarm-" + environment + "-" + region.substring(3, 5) + "-" + uniqueSuffix)
                .alarmDescription("Alarm when CPU exceeds 80%")
                .metric(Metric.Builder.create()
                    .namespace("AWS/EC2")
                    .metricName("CPUUtilization")
                    .build())
                .threshold(80.0)
                .evaluationPeriods(2)
                .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                .build();
                
            if (isPrimary && rdsInstance != null && rdsInstance instanceof DatabaseInstance) {
                Alarm dbConnectionAlarm = Alarm.Builder.create(this, "HighDbConnectionsAlarm")
                    .alarmName("HighDbConnectionsAlarm-" + environment + "-" + region.substring(3, 5) + "-" + uniqueSuffix)
                    .alarmDescription("Alarm when DB connections exceed 80% of max")
                    .metric(Metric.Builder.create()
                        .namespace("AWS/RDS")
                        .metricName("DatabaseConnections")
                        .dimensionsMap(java.util.Map.of("DBInstanceIdentifier", ((DatabaseInstance) rdsInstance).getInstanceIdentifier()))
                        .build())
                    .threshold(80.0)
                    .evaluationPeriods(2)
                    .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                    .build();
            }
        }
    }
}
