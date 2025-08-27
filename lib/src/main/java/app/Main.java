package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.NestedStack;
import software.amazon.awscdk.NestedStackProps;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Duration;
import software.constructs.Construct;

import java.util.Optional;
import java.util.Arrays;
import java.util.List;
import java.util.Collections;

import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.kms.KeyProps;

import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.BucketObjectOwnership;

import software.amazon.awscdk.services.ec2.IVpc;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.VpcLookupOptions;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.InstanceType;
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceSize;
import software.amazon.awscdk.services.ec2.AmazonLinuxImage;
import software.amazon.awscdk.services.ec2.AmazonLinuxGeneration;
import software.amazon.awscdk.services.ec2.UserData;

import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;

import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancer;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationListener;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationProtocol;
import software.amazon.awscdk.services.elasticloadbalancingv2.AddApplicationTargetsProps;

import software.amazon.awscdk.services.autoscaling.AutoScalingGroup;
import software.amazon.awscdk.services.autoscaling.AutoScalingGroupProps;

import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;

import software.amazon.awscdk.services.dynamodb.Attribute;
import software.amazon.awscdk.services.dynamodb.AttributeType;
import software.amazon.awscdk.services.dynamodb.BillingMode;
import software.amazon.awscdk.services.dynamodb.Table;
import software.amazon.awscdk.services.dynamodb.TableEncryption;

import software.amazon.awscdk.services.rds.Credentials;
import software.amazon.awscdk.services.rds.DatabaseInstance;
import software.amazon.awscdk.services.rds.DatabaseInstanceEngine;
import software.amazon.awscdk.services.rds.MySqlInstanceEngineProps;
import software.amazon.awscdk.services.rds.MysqlEngineVersion;
import software.amazon.awscdk.services.rds.StorageType;
import software.amazon.awscdk.services.rds.DatabaseInstanceReadReplica;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 *
 * This class provides a simple container for stack-specific configuration
 * including environment suffix for resource naming.
 */
class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;

    private TapStackProps(String environmentSuffix, StackProps stackProps) {
        this.environmentSuffix = environmentSuffix;
        this.stackProps = stackProps != null ? stackProps : StackProps.builder().build();
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public StackProps getStackProps() {
        return stackProps;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String environmentSuffix;
        private StackProps stackProps;

        public Builder environmentSuffix(String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public Builder stackProps(StackProps stackProps) {
            this.stackProps = stackProps;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(environmentSuffix, stackProps);
        }
    }
}

/**
 * Represents the main CDK stack for the Tap project.
 *
 * This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
 * It determines the environment suffix from the provided properties,
 * CDK context, or defaults to 'dev'.
 *
 * Note:
 * - Do NOT create AWS resources directly in this stack.
 * - Instead, instantiate separate stacks for each resource type within this stack.
 *
 * @version 1.0
 * @since 1.0
 */
class TapStack extends Stack {
    private final String environmentSuffix;
    private final String region;

    // Shared resources
    private IVpc vpc;
    private Key kmsKey;
    private Bucket logsBucket;

    // Compute resources
    private SecurityGroup albSecurityGroup;
    private SecurityGroup asgSecurityGroup;
    private ApplicationLoadBalancer alb;
    private AutoScalingGroup asg;

    // Database and storage
    private SecurityGroup rdsSecurityGroup;
    private DatabaseInstance rdsPrimary;
    private DatabaseInstanceReadReplica rdsReplica;
    private Table ddbTable;

    /**
     * Constructs a new TapStack.
     *
     * @param scope The parent construct
     * @param id The unique identifier for this stack
     * @param props Optional properties for configuring the stack, including environment suffix
     */
    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, context, or use 'dev' as default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Resolve region at synth time for conditional logic
        this.region = Stack.of(this).getRegion();

        // Instantiate nested stacks (do not create resources directly here)
        NetworkStack network = new NetworkStack(this, "Network-" + environmentSuffix, NestedStackProps.builder().build());
        this.vpc = network.getVpc();
        this.kmsKey = network.getKmsKey();
        this.logsBucket = network.getLogsBucket();

        ComputeStack compute = new ComputeStack(this, "Compute-" + environmentSuffix,
                this.vpc, this.kmsKey, this.logsBucket,
                NestedStackProps.builder().build());
        this.alb = compute.getAlb();
        this.asg = compute.getAsg();
        this.albSecurityGroup = compute.getAlbSecurityGroup();
        this.asgSecurityGroup = compute.getAsgSecurityGroup();

        DatabaseStack database = new DatabaseStack(this, "Database-" + environmentSuffix,
                this.vpc, this.asgSecurityGroup, this.kmsKey,
                NestedStackProps.builder().build());
        this.rdsPrimary = database.getRdsPrimary();
        this.rdsReplica = database.getRdsReplica();
        this.rdsSecurityGroup = database.getRdsSecurityGroup();

        StorageStack storage = new StorageStack(this, "Storage-" + environmentSuffix,
                this.kmsKey,
                NestedStackProps.builder().build());
        this.ddbTable = storage.getTable();

        // Outputs for CI get-outputs.sh and quick access
        CfnOutput.Builder.create(this, "AlbDnsName")
                .value(this.alb.getLoadBalancerDnsName())
                .exportName("AlbDnsName-" + environmentSuffix + "-" + region)
                .build();

        CfnOutput.Builder.create(this, "LogsBucketName")
                .value(this.logsBucket.getBucketName())
                .exportName("LogsBucket-" + environmentSuffix + "-" + region)
                .build();

        if (this.rdsPrimary != null) {
            CfnOutput.Builder.create(this, "RdsEndpointAddress")
                    .value(this.rdsPrimary.getDbInstanceEndpointAddress())
                    .exportName("RdsEndpoint-" + environmentSuffix + "-" + region)
                    .build();
        }

        if (this.ddbTable != null) {
            CfnOutput.Builder.create(this, "DynamoTableName")
                    .value(this.ddbTable.getTableName())
                    .exportName("DynamoTable-" + environmentSuffix + "-" + region)
                    .build();
        }
    }

    /**
     * Gets the environment suffix used by this stack.
     *
     * @return The environment suffix (e.g., 'dev', 'prod')
     */
    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    // ---------------------- Nested Stacks ----------------------

    /**
     * Network and security baseline: VPC (default or new), KMS key, logs bucket.
     */
    static final class NetworkStack extends NestedStack {
        private IVpc vpc;
        private Key kmsKey;
        private Bucket logsBucket;

        NetworkStack(final Construct scope, final String id, final NestedStackProps props) {
            super(scope, id, props);

            final Stack parent = Stack.of(this);
            final String envSuffix = ((TapStack) parent).environmentSuffix;
            final String region = parent.getRegion();

            // Prefer default VPC, else create a small VPC
            try {
                this.vpc = Vpc.fromLookup(this, "DefaultVpc", VpcLookupOptions.builder().isDefault(true).build());
            } catch (Exception e) {
                // Fallback: minimal VPC with non-overlapping CIDR
                String cidr = region != null && region.startsWith("us-west") ? "10.1.0.0/24" : "10.0.0.0/24";
                this.vpc = Vpc.Builder.create(this, "AppVpc-" + envSuffix)
                        .ipAddresses(software.amazon.awscdk.services.ec2.IpAddresses.cidr(cidr))
                        .natGateways(0)
                        .subnetConfiguration(List.of(
                                SubnetConfiguration.builder().name("public-1").subnetType(SubnetType.PUBLIC).cidrMask(26).build(),
                                SubnetConfiguration.builder().name("public-2").subnetType(SubnetType.PUBLIC).cidrMask(26).build()
                        ))
                        .build();
            }

            // KMS key for encryption everywhere
            this.kmsKey = Key.Builder.create(this, "CentralKey-" + envSuffix)
                    .alias("alias/tap-central-" + envSuffix + "-" + parent.getRegion())
                    .enableKeyRotation(true)
                    .removalPolicy(RemovalPolicy.DESTROY)
                    .build();

            // Centralized logs bucket (per region)
            this.logsBucket = Bucket.Builder.create(this, "AccessLogs-" + envSuffix)
                    .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                    .encryption(BucketEncryption.KMS)
                    .encryptionKey(this.kmsKey)
                    .enforceSsl(true)
                    .objectOwnership(BucketObjectOwnership.BUCKET_OWNER_PREFERRED)
                    .autoDeleteObjects(true)
                    .removalPolicy(RemovalPolicy.DESTROY)
                    .build();

            CfnOutput.Builder.create(this, "VpcId").value(this.vpc.getVpcId()).build();
        }

        IVpc getVpc() { return vpc; }
        Key getKmsKey() { return kmsKey; }
        Bucket getLogsBucket() { return logsBucket; }
    }

    /**
     * Compute + ALB resources behind security groups, with access logs.
     */
    static final class ComputeStack extends NestedStack {
        private final IVpc vpc;
        private final Key kmsKey;
        private final Bucket logsBucket;

        private SecurityGroup albSecurityGroup;
        private SecurityGroup asgSecurityGroup;
        private ApplicationLoadBalancer alb;
        private AutoScalingGroup asg;

        ComputeStack(final Construct scope, final String id, final IVpc vpc, final Key kmsKey, final Bucket logsBucket, final NestedStackProps props) {
            super(scope, id, props);
            this.vpc = vpc;
            this.kmsKey = kmsKey;
            this.logsBucket = logsBucket;

            final Stack parent = Stack.of(this);
            final String envSuffix = ((TapStack) parent).environmentSuffix;

            // Security groups
            this.albSecurityGroup = SecurityGroup.Builder.create(this, "AlbSg-" + envSuffix)
                    .vpc(this.vpc)
                    .allowAllOutbound(true)
                    .description("ALB security group")
                    .build();
            this.albSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "Allow HTTP from anywhere");

            this.asgSecurityGroup = SecurityGroup.Builder.create(this, "AsgSg-" + envSuffix)
                    .vpc(this.vpc)
                    .allowAllOutbound(true)
                    .description("ASG instances security group")
                    .build();
            this.asgSecurityGroup.addIngressRule(this.albSecurityGroup, Port.tcp(80), "Allow ALB to reach instances");

            // IAM role for EC2 with least-privileged managed policies
            Role instanceRole = Role.Builder.create(this, "Ec2Role-" + envSuffix)
                    .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                    .managedPolicies(List.of(
                            ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
                            ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy")
                    ))
                    .build();

            // Basic user data to serve HTTP 80
            UserData userData = UserData.forLinux();
            userData.addCommands(
                    "#!/bin/bash",
                    "set -euxo pipefail",
                    "yum install -y httpd",
                    "systemctl enable httpd",
                    "echo 'hello from asg $(hostname)' > /var/www/html/index.html",
                    "systemctl start httpd"
            );

            int desired = envSuffix.toLowerCase().startsWith("prod") ? 3 : 1;
            int max = envSuffix.toLowerCase().startsWith("prod") ? 6 : 2;

            this.asg = AutoScalingGroup.Builder.create(this, "Asg-" + envSuffix)
                    .vpc(this.vpc)
                    .securityGroup(this.asgSecurityGroup)
                    .instanceType(InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
                    .machineImage(AmazonLinuxImage.Builder.create().generation(AmazonLinuxGeneration.AMAZON_LINUX_2).build())
                    .desiredCapacity(desired)
                    .minCapacity(desired)
                    .maxCapacity(max)
                    .role(instanceRole)
                    .userData(userData)
                    .vpcSubnets(software.amazon.awscdk.services.ec2.SubnetSelection.builder()
                            .subnetType(SubnetType.PUBLIC)
                            .build())
                    .build();

            this.alb = ApplicationLoadBalancer.Builder.create(this, "Alb-" + envSuffix)
                    .vpc(this.vpc)
                    .internetFacing(true)
                    .securityGroup(this.albSecurityGroup)
                    .deletionProtection(false)
                    .build();

            // Enable access logs
            this.alb.logAccessLogs(this.logsBucket);

            ApplicationListener httpListener = this.alb.addListener("HttpListener", software.amazon.awscdk.services.elasticloadbalancingv2.BaseApplicationListenerProps.builder()
                    .port(80)
                    .protocol(ApplicationProtocol.HTTP)
                    .open(true)
                    .build());

            httpListener.addTargets("AsgTargets", AddApplicationTargetsProps.builder()
                    .port(80)
                    .targets(List.of(this.asg))
                    .build());

            // Log group for app
            LogGroup.Builder.create(this, "AppLogGroup-" + envSuffix)
                    .retention(RetentionDays.ONE_WEEK)
                    .removalPolicy(RemovalPolicy.DESTROY)
                    .build();

            CfnOutput.Builder.create(this, "AlbDns").value(this.alb.getLoadBalancerDnsName()).build();
        }

        SecurityGroup getAlbSecurityGroup() { return albSecurityGroup; }
        SecurityGroup getAsgSecurityGroup() { return asgSecurityGroup; }
        ApplicationLoadBalancer getAlb() { return alb; }
        AutoScalingGroup getAsg() { return asg; }
    }

    /**
     * RDS MySQL (Multi-AZ) with one read replica, encrypted with KMS.
     */
    static final class DatabaseStack extends NestedStack {
        private final IVpc vpc;
        private final SecurityGroup appSg;
        private final Key kmsKey;

        private SecurityGroup rdsSecurityGroup;
        private DatabaseInstance rdsPrimary;
        private DatabaseInstanceReadReplica rdsReplica;

        DatabaseStack(final Construct scope, final String id, final IVpc vpc, final SecurityGroup appSg, final Key kmsKey, final NestedStackProps props) {
            super(scope, id, props);
            this.vpc = vpc;
            this.appSg = appSg;
            this.kmsKey = kmsKey;

            final Stack parent = Stack.of(this);
            final String envSuffix = ((TapStack) parent).environmentSuffix;

            // Security group for RDS
            this.rdsSecurityGroup = SecurityGroup.Builder.create(this, "RdsSg-" + envSuffix)
                    .vpc(this.vpc)
                    .allowAllOutbound(true)
                    .description("RDS security group")
                    .build();
            this.rdsSecurityGroup.addIngressRule(this.appSg, Port.tcp(3306), "Allow app ASG");

            this.rdsPrimary = DatabaseInstance.Builder.create(this, "RdsPrimary-" + envSuffix)
                    .engine(DatabaseInstanceEngine.mysql(MySqlInstanceEngineProps.builder().version(MysqlEngineVersion.VER_8_0_35).build()))
                    .vpc(this.vpc)
                    .vpcSubnets(software.amazon.awscdk.services.ec2.SubnetSelection.builder().subnetType(SubnetType.PUBLIC).build())
                    .securityGroups(List.of(this.rdsSecurityGroup))
                    .credentials(Credentials.fromGeneratedSecret("dbadmin"))
                    .publiclyAccessible(true)
                    .multiAz(true)
                    .storageEncrypted(true)
                    .kmsKey(this.kmsKey)
                    .allocatedStorage(20)
                    .backupRetention(Duration.days(3))
                    .deletionProtection(false)
                    .removalPolicy(RemovalPolicy.DESTROY)
                    .instanceType(InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MEDIUM))
                    .storageType(StorageType.GP2)
                    .build();

            // Same-region read replica for demo purposes
            this.rdsReplica = DatabaseInstanceReadReplica.Builder.create(this, "RdsReplica-" + envSuffix)
                    .sourceDatabaseInstance(this.rdsPrimary)
                    .vpc(this.vpc)
                    .vpcSubnets(software.amazon.awscdk.services.ec2.SubnetSelection.builder().subnetType(SubnetType.PUBLIC).build())
                    .securityGroups(List.of(this.rdsSecurityGroup))
                    .instanceType(InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
                    .removalPolicy(RemovalPolicy.DESTROY)
                    .build();

            CfnOutput.Builder.create(this, "RdsEndpoint").value(this.rdsPrimary.getDbInstanceEndpointAddress()).build();
        }

        SecurityGroup getRdsSecurityGroup() { return rdsSecurityGroup; }
        DatabaseInstance getRdsPrimary() { return rdsPrimary; }
        DatabaseInstanceReadReplica getRdsReplica() { return rdsReplica; }
    }

    /**
     * DynamoDB with PITR and optional cross-region replica using Global Tables.
     */
    static final class StorageStack extends NestedStack {
        private final Key kmsKey;
        private Table table;

        StorageStack(final Construct scope, final String id, final Key kmsKey, final NestedStackProps props) {
            super(scope, id, props);
            this.kmsKey = kmsKey;

            final Stack parent = Stack.of(this);
            final String envSuffix = ((TapStack) parent).environmentSuffix;
            final String region = parent.getRegion();

            Table.Builder tbl = Table.Builder.create(this, "AppTable-" + envSuffix)
                    .billingMode(BillingMode.PAY_PER_REQUEST)
                    .partitionKey(Attribute.builder().name("pk").type(AttributeType.STRING).build())
                    .sortKey(Attribute.builder().name("sk").type(AttributeType.STRING).build())
                    .encryption(TableEncryption.AWS_MANAGED)
                    .pointInTimeRecovery(true)
                    .removalPolicy(RemovalPolicy.DESTROY);

            // Create a replica in the other region only from a single primary to avoid duplication
            if ("us-east-1".equals(region)) {
                tbl = tbl.replicationRegions(List.of("us-west-2"));
            }

            this.table = tbl.build();

            CfnOutput.Builder.create(this, "DynamoDbTableName").value(this.table.getTableName()).build();
        }

        Table getTable() { return table; }
    }
}

/**
 * Main entry point for the TAP CDK Java application.
 *
 * This class serves as the entry point for the CDK application and is responsible
 * for initializing the CDK app and instantiating the main TapStack.
 *
 * The application supports environment-specific deployments through the
 * environmentSuffix context parameter.
 *
 * @version 1.0
 * @since 1.0
 */
public final class Main {

    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }

    /**
     * Main entry point for the CDK application.
     *
     * This method creates a CDK App instance and instantiates the TapStack
     * with appropriate configuration based on environment variables and context.
     *
     * @param args Command line arguments (not used in this application)
     */
    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from context or default to 'dev'
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        String account = System.getenv("CDK_DEFAULT_ACCOUNT");

        // Multi-region deployment: us-east-1 and us-west-2
        new TapStack(app, "TapStack" + environmentSuffix + "-us-east-1", TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder().account(account).region("us-east-1").build())
                        .build())
                .build());

        new TapStack(app, "TapStack" + environmentSuffix + "-us-west-2", TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder().account(account).region("us-west-2").build())
                        .build())
                .build());

        // Synthesize the CDK app
        app.synth();
    }
}
