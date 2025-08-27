package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.*;
import software.amazon.awscdk.services.autoscaling.*;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.kms.*;
import software.amazon.awscdk.services.rds.*;
import software.amazon.awscdk.services.dynamodb.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.logs.*;
import java.util.*;
import software.amazon.awscdk.CfnOutput;

public class Main {
    public static void main(final String[] args) {
        App app = new App();
        
        String environmentName = app.getNode().tryGetContext("environment") != null ? 
            app.getNode().tryGetContext("environment").toString() : "staging";
        
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

        PrimaryStack primaryStack = new PrimaryStack(app, "PrimaryStack-" + environmentName, StackProps.builder().env(primaryEnv).build(), environmentName, primaryRegion, secondaryRegion);
        SecondaryStack secondaryStack = new SecondaryStack(app, "SecondaryStack-" + environmentName, StackProps.builder().env(secondaryEnv).build(), environmentName, secondaryRegion, primaryStack);

        app.synth();
    }
}

class PrimaryStack extends Stack {
    private final IVpc vpc;
    private final Bucket logsBucket;
    private final DatabaseInstance rdsInstance;
    private final Table dynamoDbTable;
    private final Key kmsKey;

    public IVpc getVpc() { return vpc; }
    public Bucket getLogsBucket() { return logsBucket; }
    public DatabaseInstance getRdsInstance() { return rdsInstance; }
    public Table getDynamoDbTable() { return dynamoDbTable; }
    public Key getKmsKey() { return kmsKey; }

    public PrimaryStack(final software.constructs.Construct scope, final String id, final StackProps props, String environmentName, String region, String secondaryRegion) {
        super(scope, id, props);

        Tags.of(this).add("Environment", environmentName);
        Tags.of(this).add("Project", "MultiRegionApp");
        Tags.of(this).add("Owner", "DevOps");

        this.kmsKey = Key.Builder.create(this, "KmsKey").description("KMS key for " + environmentName + " in " + region).build();

        this.vpc = new Vpc(this, "Vpc", VpcProps.builder().maxAzs(2).build());

        this.logsBucket = Bucket.Builder.create(this, "LogsBucket")
            .encryption(BucketEncryption.KMS_MANAGED)
            .versioned(true)
            .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
            .enforceSsl(true)
            .build();

        this.rdsInstance = DatabaseInstance.Builder.create(this, "RdsInstance")
            .engine(DatabaseInstanceEngine.mysql(MySqlInstanceEngineProps.builder().version(MysqlEngineVersion.VER_8_0).build()))
            .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(software.amazon.awscdk.services.ec2.InstanceClass.BURSTABLE3, software.amazon.awscdk.services.ec2.InstanceSize.SMALL))
            .vpc(this.vpc)
            .multiAz(true)
            .storageEncrypted(true)
            .storageEncryptionKey(this.kmsKey)
            .credentials(Credentials.fromGeneratedSecret("dbadmin"))
            .build();

        this.dynamoDbTable = Table.Builder.create(this, "DynamoDbTable")
            .partitionKey(Attribute.builder().name("id").type(AttributeType.STRING).build())
            .encryption(TableEncryption.CUSTOMER_MANAGED)
            .encryptionKey(this.kmsKey)
            .pointInTimeRecovery(true)
            .replicationRegions(Arrays.asList(secondaryRegion))
            .build();

        createAppLayer(environmentName, region, this.vpc, this.logsBucket, this.kmsKey);
    }

    private void createAppLayer(String environmentName, String region, IVpc vpc, Bucket logsBucket, Key kmsKey) {
        Role ec2Role = createEc2Role(logsBucket, kmsKey);
        SecurityGroup albSg = createAlbSecurityGroup(vpc);
        SecurityGroup ec2Sg = createEc2SecurityGroup(vpc, albSg);
        ApplicationLoadBalancer alb = createAlb(vpc, albSg, logsBucket);
        ApplicationTargetGroup targetGroup = createTargetGroup(vpc);
        alb.getListeners().get(0).addTargetGroups("DefaultTargetGroup", AddApplicationTargetGroupsProps.builder().targetGroups(Arrays.asList(targetGroup)).build());
        createAsg(vpc, ec2Sg, ec2Role, targetGroup);
    }
    
    private Role createEc2Role(Bucket logsBucket, Key kmsKey) {
        Role role = Role.Builder.create(this, "Ec2InstanceRole")
            .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
            .build();
        logsBucket.grantWrite(role);
        kmsKey.grantEncryptDecrypt(role);
        return role;
    }

    private SecurityGroup createAlbSecurityGroup(IVpc vpc) {
        SecurityGroup sg = SecurityGroup.Builder.create(this, "AlbSg").vpc(vpc).description("ALB Security Group").build();
        sg.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "Allow HTTP traffic");
        return sg;
    }

    private SecurityGroup createEc2SecurityGroup(IVpc vpc, ISecurityGroup albSg) {
        SecurityGroup sg = SecurityGroup.Builder.create(this, "AppSg").vpc(vpc).description("App Security Group").build();
        sg.addIngressRule(albSg, Port.tcp(80), "Allow traffic from ALB");
        return sg;
    }

    private ApplicationLoadBalancer createAlb(IVpc vpc, ISecurityGroup albSg, Bucket logsBucket) {
        ApplicationLoadBalancer alb = ApplicationLoadBalancer.Builder.create(this, "Alb").vpc(vpc).internetFacing(true).securityGroup(albSg).build();
        alb.logAccessLogs(logsBucket);
        alb.addListener("HttpListener", BaseApplicationListenerProps.builder().port(80).protocol(ApplicationProtocol.HTTP).defaultAction(ListenerAction.fixedResponse(200)).build());
        return alb;
    }

    private ApplicationTargetGroup createTargetGroup(IVpc vpc) {
        return ApplicationTargetGroup.Builder.create(this, "TargetGroup")
            .vpc(vpc)
            .port(80)
            .protocol(ApplicationProtocol.HTTP)
            .healthCheck(software.amazon.awscdk.services.elasticloadbalancingv2.HealthCheck.builder().path("/health").build())
            .build();
    }

    private void createAsg(IVpc vpc, ISecurityGroup ec2Sg, Role ec2Role, IApplicationTargetGroup targetGroup) {
        AutoScalingGroup asg = AutoScalingGroup.Builder.create(this, "Asg")
            .vpc(vpc)
            .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(software.amazon.awscdk.services.ec2.InstanceClass.BURSTABLE3, software.amazon.awscdk.services.ec2.InstanceSize.SMALL))
            .machineImage(MachineImage.latestAmazonLinux())
            .securityGroup(ec2Sg)
            .role(ec2Role)
            .minCapacity(1)
            .maxCapacity(2)
            .build();
        asg.attachToApplicationTargetGroup(targetGroup);
    }
}

class SecondaryStack extends Stack {
    public SecondaryStack(final software.constructs.Construct scope, final String id, final StackProps props, String environmentName, String region, PrimaryStack primaryStack) {
        super(scope, id, props);

        Tags.of(this).add("Environment", environmentName);
        Tags.of(this).add("Project", "MultiRegionApp");
        Tags.of(this).add("Owner", "DevOps");

        IVpc vpc = new Vpc(this, "Vpc", VpcProps.builder().maxAzs(2).build());

        CfnVPCPeeringConnection.Builder.create(this, "VpcPeering")
            .vpcId(vpc.getVpcId())
            .peerVpcId(primaryStack.getVpc().getVpcId())
            .peerRegion(primaryStack.getRegion())
            .build();

        DatabaseInstanceReadReplica.Builder.create(this, "RdsReadReplica")
            .sourceDatabaseInstance(primaryStack.getRdsInstance())
            .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(software.amazon.awscdk.services.ec2.InstanceClass.BURSTABLE3, software.amazon.awscdk.services.ec2.InstanceSize.SMALL))
            .vpc(vpc)
            .build();

        createAppLayer(environmentName, region, vpc, primaryStack.getLogsBucket(), primaryStack.getKmsKey());
    }

    private void createAppLayer(String environmentName, String region, IVpc vpc, Bucket logsBucket, Key kmsKey) {
        Role ec2Role = createEc2Role(logsBucket, kmsKey);
        SecurityGroup albSg = createAlbSecurityGroup(vpc);
        SecurityGroup ec2Sg = createEc2SecurityGroup(vpc, albSg);
        ApplicationLoadBalancer alb = createAlb(vpc, albSg, logsBucket);
        ApplicationTargetGroup targetGroup = createTargetGroup(vpc);
        alb.getListeners().get(0).addTargetGroups("DefaultTargetGroup", AddApplicationTargetGroupsProps.builder().targetGroups(Arrays.asList(targetGroup)).build());
        createAsg(vpc, ec2Sg, ec2Role, targetGroup);
    }
    
    private Role createEc2Role(Bucket logsBucket, Key kmsKey) {
        Role role = Role.Builder.create(this, "Ec2InstanceRole")
            .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
            .build();
        logsBucket.grantWrite(role);
        kmsKey.grantEncryptDecrypt(role);
        return role;
    }

    private SecurityGroup createAlbSecurityGroup(IVpc vpc) {
        SecurityGroup sg = SecurityGroup.Builder.create(this, "AlbSg").vpc(vpc).description("ALB Security Group").build();
        sg.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "Allow HTTP traffic");
        return sg;
    }

    private SecurityGroup createEc2SecurityGroup(IVpc vpc, ISecurityGroup albSg) {
        SecurityGroup sg = SecurityGroup.Builder.create(this, "AppSg").vpc(vpc).description("App Security Group").build();
        sg.addIngressRule(albSg, Port.tcp(80), "Allow traffic from ALB");
        return sg;
    }

    private ApplicationLoadBalancer createAlb(IVpc vpc, ISecurityGroup albSg, Bucket logsBucket) {
        ApplicationLoadBalancer alb = ApplicationLoadBalancer.Builder.create(this, "Alb").vpc(vpc).internetFacing(true).securityGroup(albSg).build();
        alb.logAccessLogs(logsBucket);
        alb.addListener("HttpListener", BaseApplicationListenerProps.builder().port(80).protocol(ApplicationProtocol.HTTP).defaultAction(ListenerAction.fixedResponse(200)).build());
        return alb;
    }

    private ApplicationTargetGroup createTargetGroup(IVpc vpc) {
        return ApplicationTargetGroup.Builder.create(this, "TargetGroup")
            .vpc(vpc)
            .port(80)
            .protocol(ApplicationProtocol.HTTP)
            .healthCheck(software.amazon.awscdk.services.elasticloadbalancingv2.HealthCheck.builder().path("/health").build())
            .build();
    }

    private void createAsg(IVpc vpc, ISecurityGroup ec2Sg, Role ec2Role, IApplicationTargetGroup targetGroup) {
        AutoScalingGroup asg = AutoScalingGroup.Builder.create(this, "Asg")
            .vpc(vpc)
            .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(software.amazon.awscdk.services.ec2.InstanceClass.BURSTABLE3, software.amazon.awscdk.services.ec2.InstanceSize.SMALL))
            .machineImage(MachineImage.latestAmazonLinux())
            .securityGroup(ec2Sg)
            .role(ec2Role)
            .minCapacity(1)
            .maxCapacity(2)
            .build();
        asg.attachToApplicationTargetGroup(targetGroup);
    }
}
