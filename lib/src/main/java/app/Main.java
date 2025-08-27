package app;

import java.util.Arrays;
import java.util.List;
import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.CfnOutputProps;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.autoscaling.AutoScalingGroup;
import software.amazon.awscdk.services.dynamodb.Attribute;
import software.amazon.awscdk.services.dynamodb.AttributeType;
import software.amazon.awscdk.services.dynamodb.Table;
import software.amazon.awscdk.services.dynamodb.TableEncryption;
import software.amazon.awscdk.services.ec2.ISecurityGroup;
import software.amazon.awscdk.services.ec2.IVpc;
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceSize;
import software.amazon.awscdk.services.ec2.InstanceType;
import software.amazon.awscdk.services.ec2.MachineImage;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.VpcProps;
import software.amazon.awscdk.services.elasticloadbalancingv2.AddApplicationTargetGroupsProps;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancer;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationProtocol;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationTargetGroup;
import software.amazon.awscdk.services.elasticloadbalancingv2.BaseApplicationListenerProps;
import software.amazon.awscdk.services.elasticloadbalancingv2.HealthCheck;
import software.amazon.awscdk.services.elasticloadbalancingv2.IApplicationTargetGroup;
import software.amazon.awscdk.services.elasticloadbalancingv2.ListenerAction;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.rds.Credentials;
import software.amazon.awscdk.services.rds.DatabaseInstance;
import software.amazon.awscdk.services.rds.DatabaseInstanceEngine;
import software.amazon.awscdk.services.rds.DatabaseInstanceReadReplica;
import software.amazon.awscdk.services.rds.MySqlInstanceEngineProps;
import software.amazon.awscdk.services.rds.MysqlEngineVersion;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;

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

        String environmentName = app.getNode().tryGetContext("environment") != null
            ? app.getNode().tryGetContext("environment").toString() : "staging";

        String primaryRegion = "us-east-1";
        String secondaryRegion = "us-west-2";

        Environment primaryEnv = Environment.builder()
            .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
            .region(primaryRegion)
            .build();

        Environment secondaryEnv = Environment.builder()
            .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
            .region(secondaryRegion)
            .build();

        PrimaryStack primaryStack = new PrimaryStack(app, "PrimaryStack-" + environmentName,
            StackProps.builder().env(primaryEnv).build(), environmentName, primaryRegion,
            secondaryRegion);

        new SecondaryStack(app, "SecondaryStack-" + environmentName,
            StackProps.builder().env(secondaryEnv).build(), environmentName, secondaryRegion,
            primaryStack);

        app.synth();
    }

    /**
     * Represents the primary stack in the multi-region application.
     */
    public static class PrimaryStack extends Stack {
        private final IVpc vpc;
        private final Bucket logsBucket;
        private final DatabaseInstance rdsInstance;
        private final Table dynamoDbTable;
        private final Key kmsKey;

        /**
         * Constructs a new PrimaryStack.
         */
        public PrimaryStack(final software.constructs.Construct scope, final String id, final StackProps props,
                            final String environmentName, final String region, final String secondaryRegion) {
            super(scope, id, props);

            Tags.of(this).add("Environment", environmentName);
            Tags.of(this).add("Project", "MultiRegionApp");
            Tags.of(this).add("Owner", "DevOps");

            this.kmsKey = Key.Builder.create(this, "KmsKey")
                .description("KMS key for " + environmentName + " in " + region)
                .build();

            this.vpc = new Vpc(this, "Vpc", VpcProps.builder().maxAzs(2).build());

            this.logsBucket = Bucket.Builder.create(this, "LogsBucket")
                .encryption(BucketEncryption.KMS_MANAGED)
                .versioned(true)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .enforceSsl(true)
                .build();

            this.rdsInstance = DatabaseInstance.Builder.create(this, "RdsInstance")
                .engine(DatabaseInstanceEngine.mysql(MySqlInstanceEngineProps.builder()
                    .version(MysqlEngineVersion.VER_8_0).build()))
                .instanceType(InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.SMALL))
                .vpc(this.vpc)
                .multiAz(true)
                .storageEncrypted(true)
                .storageEncryptionKey(this.kmsKey)
                .credentials(Credentials.fromGeneratedSecret("dbadmin"))
                .build();

            this.dynamoDbTable = Table.Builder.create(this, "DynamoDbTable")
                .partitionKey(Attribute.builder().name("id").type(AttributeType.STRING).build())
                .encryption(TableEncryption.AWS_MANAGED)
                .pointInTimeRecoverySpecification(
                    software.amazon.awscdk.services.dynamodb.PointInTimeRecoverySpecification.builder()
                    .pointInTimeRecoveryEnabled(true)
                    .build())
                .replicationRegions(Arrays.asList(secondaryRegion))
                .build();

            createAppLayer(region);
        }

        private void createAppLayer(final String region) {
            final Role ec2Role = createEc2Role();
            final SecurityGroup albSg = createAlbSecurityGroup();
            final SecurityGroup ec2Sg = createEc2SecurityGroup(albSg);
            final ApplicationLoadBalancer alb = createAlb(albSg, region);
            final ApplicationTargetGroup targetGroup = createTargetGroup();

            alb.getListeners().get(0).addTargetGroups("DefaultTargetGroup", AddApplicationTargetGroupsProps.builder()
                .targetGroups(List.of(targetGroup))
                .build());

            createAsg(ec2Sg, ec2Role, targetGroup);
        }

        private Role createEc2Role() {
            Role role = Role.Builder.create(this, "Ec2InstanceRole")
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .build();
            this.logsBucket.grantWrite(role);
            this.kmsKey.grantEncryptDecrypt(role);
            return role;
        }

        private SecurityGroup createAlbSecurityGroup() {
            SecurityGroup sg = SecurityGroup.Builder.create(this, "AlbSg").vpc(this.vpc).description("ALB Security Group").build();
            sg.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "Allow HTTP traffic");
            return sg;
        }

        private SecurityGroup createEc2SecurityGroup(final ISecurityGroup albSg) {
            SecurityGroup sg = SecurityGroup.Builder.create(this, "AppSg").vpc(this.vpc).description("App Security Group").build();
            sg.addIngressRule(albSg, Port.tcp(80), "Allow traffic from ALB");
            return sg;
        }

        private ApplicationLoadBalancer createAlb(final ISecurityGroup albSg, final String region) {
            ApplicationLoadBalancer alb = ApplicationLoadBalancer.Builder.create(this, "Alb")
                .vpc(this.vpc)
                .internetFacing(true)
                .securityGroup(albSg)
                .build();
            
            // Only enable access logging if the stack has a proper environment
            try {
                if (this.getRegion() != null && !this.getRegion().isEmpty()) {
                    alb.logAccessLogs(this.logsBucket);
                }
            } catch (Exception e) {
                // Skip access logging if region is not available (e.g., in tests)
            }
            
            alb.addListener("HttpListener", BaseApplicationListenerProps.builder()
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .defaultAction(ListenerAction.fixedResponse(200))
                .build());
            return alb;
        }

        private ApplicationTargetGroup createTargetGroup() {
            return ApplicationTargetGroup.Builder.create(this, "TargetGroup")
                .vpc(this.vpc)
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .healthCheck(HealthCheck.builder().path("/health").build())
                .build();
        }

        private void createAsg(final ISecurityGroup ec2Sg, final Role ec2Role, final IApplicationTargetGroup targetGroup) {
            AutoScalingGroup asg = AutoScalingGroup.Builder.create(this, "Asg")
                .vpc(this.vpc)
                .instanceType(InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.SMALL))
                .machineImage(MachineImage.latestAmazonLinux())
                .securityGroup(ec2Sg)
                .role(ec2Role)
                .minCapacity(1)
                .maxCapacity(2)
                .build();
            asg.attachToApplicationTargetGroup(targetGroup);
        }

        public IVpc getVpc() {
            return vpc;
        }
        public Bucket getLogsBucket() {
            return logsBucket;
        }
        public DatabaseInstance getRdsInstance() {
            return rdsInstance;
        }
        public Table getDynamoDbTable() {
            return dynamoDbTable;
        }
        public Key getKmsKey() {
            return kmsKey;
        }
    }

    /**
     * Represents the secondary stack in the multi-region application.
     */
    public static class SecondaryStack extends Stack {

        /**
         * Constructs a new SecondaryStack.
         */
        public SecondaryStack(final software.constructs.Construct scope, final String id, final StackProps props,
                              final String environmentName, final String region, final PrimaryStack primaryStack) {
            super(scope, id, props);

            Tags.of(this).add("Environment", environmentName);
            Tags.of(this).add("Project", "MultiRegionApp");
            Tags.of(this).add("Owner", "DevOps");

            final IVpc vpc = new Vpc(this, "Vpc", VpcProps.builder().maxAzs(2).build());

            new CfnOutput(this, "VpcId", CfnOutputProps.builder().value(vpc.getVpcId()).build());

            DatabaseInstanceReadReplica.Builder.create(this, "RdsReadReplica")
                .sourceDatabaseInstance(primaryStack.getRdsInstance())
                .instanceType(InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.SMALL))
                .vpc(vpc)
                .build();

            createAppLayer(vpc, primaryStack.getLogsBucket(), primaryStack.getKmsKey(), region);
        }

        private void createAppLayer(final IVpc vpc, final Bucket logsBucket, final Key kmsKey, final String region) {
            final Role ec2Role = createEc2Role(logsBucket, kmsKey);
            final SecurityGroup albSg = createAlbSecurityGroup(vpc);
            final SecurityGroup ec2Sg = createEc2SecurityGroup(vpc, albSg);
            final ApplicationLoadBalancer alb = createAlb(vpc, albSg, logsBucket, region);
            final ApplicationTargetGroup targetGroup = createTargetGroup(vpc);

            alb.getListeners().get(0).addTargetGroups("DefaultTargetGroup", AddApplicationTargetGroupsProps.builder()
                .targetGroups(List.of(targetGroup))
                .build());

            createAsg(vpc, ec2Sg, ec2Role, targetGroup);
        }

        private Role createEc2Role(final Bucket logsBucket, final Key kmsKey) {
            Role role = Role.Builder.create(this, "Ec2InstanceRole")
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .build();
            logsBucket.grantWrite(role);
            kmsKey.grantEncryptDecrypt(role);
            return role;
        }

        private SecurityGroup createAlbSecurityGroup(final IVpc vpc) {
            SecurityGroup sg = SecurityGroup.Builder.create(this, "AlbSg").vpc(vpc).description("ALB Security Group").build();
            sg.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "Allow HTTP traffic");
            return sg;
        }

        private SecurityGroup createEc2SecurityGroup(final IVpc vpc, final ISecurityGroup albSg) {
            SecurityGroup sg = SecurityGroup.Builder.create(this, "AppSg").vpc(vpc).description("App Security Group").build();
            sg.addIngressRule(albSg, Port.tcp(80), "Allow traffic from ALB");
            return sg;
        }

        private ApplicationLoadBalancer createAlb(final IVpc vpc, final ISecurityGroup albSg, 
                final Bucket logsBucket, final String region) {
            ApplicationLoadBalancer alb = ApplicationLoadBalancer.Builder.create(this, "Alb")
                .vpc(vpc)
                .internetFacing(true)
                .securityGroup(albSg)
                .build();
            
            // Only enable access logging if the stack has a proper environment
            try {
                if (this.getRegion() != null && !this.getRegion().isEmpty()) {
                    alb.logAccessLogs(logsBucket);
                }
            } catch (Exception e) {
                // Skip access logging if region is not available (e.g., in tests)
            }
            
            alb.addListener("HttpListener", BaseApplicationListenerProps.builder()
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .defaultAction(ListenerAction.fixedResponse(200))
                .build());
            return alb;
        }

        private ApplicationTargetGroup createTargetGroup(final IVpc vpc) {
            return ApplicationTargetGroup.Builder.create(this, "TargetGroup")
                .vpc(vpc)
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .healthCheck(HealthCheck.builder().path("/health").build())
                .build();
        }

        private void createAsg(final IVpc vpc, final ISecurityGroup ec2Sg, final Role ec2Role, final IApplicationTargetGroup targetGroup) {
            AutoScalingGroup asg = AutoScalingGroup.Builder.create(this, "Asg")
                .vpc(vpc)
                .instanceType(InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.SMALL))
                .machineImage(MachineImage.latestAmazonLinux())
                .securityGroup(ec2Sg)
                .role(ec2Role)
                .minCapacity(1)
                .maxCapacity(2)
                .build();
            asg.attachToApplicationTargetGroup(targetGroup);
        }
    }
}
