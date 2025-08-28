```java
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

public class Main {
    public static void main(final String[] args) {
        App app = new App();
        
        String environment = app.getNode().tryGetContext("environment") != null ? 
            app.getNode().tryGetContext("environment").toString() : "staging";
        
        Environment usEast1 = Environment.builder()
            .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
            .region("us-east-1")
            .build();
            
        Environment usWest2 = Environment.builder()
            .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
            .region("us-west-2")
            .build();

        MultiRegionStack primaryStack = new MultiRegionStack(app, "MultiRegion-" + environment + "-us-east-1", 
            StackProps.builder()
                .env(usEast1)
                .build(), 
            environment, "us-east-1", true);

        MultiRegionStack secondaryStack = new MultiRegionStack(app, "MultiRegion-" + environment + "-us-west-2", 
            StackProps.builder()
                .env(usWest2)
                .build(), 
            environment, "us-west-2", false);

        app.synth();
    }

    static class MultiRegionStack extends Stack {
        public MultiRegionStack(final software.constructs.Construct scope, final String id, final StackProps props, 
                               String environment, String region, boolean isPrimary) {
            super(scope, id, props);

            Tags.of(this).add("Environment", environment);
            Tags.of(this).add("Project", "MultiRegionApp");
            Tags.of(this).add("Owner", "DevOps");

            IVpc vpc;
            try {
                vpc = Vpc.fromLookup(this, "DefaultVpc", VpcLookupOptions.builder()
                    .isDefault(true)
                    .build());
            } catch (Exception e) {
                vpc = Vpc.Builder.create(this, "CustomVpc")
                    .cidr(region.equals("us-east-1") ? "10.0.0.0/16" : "10.1.0.0/16")
                    .maxAzs(2)
                    .build();
            }

            Key kmsKey = Key.Builder.create(this, "KmsKey-" + environment + "-" + region)
                .description("KMS key for " + environment + " in " + region)
                .build();

            Bucket logsBucket = null;
            if (isPrimary) {
                logsBucket = Bucket.Builder.create(this, "LogsBucket-" + environment + "-" + region)
                    .bucketName("logs-" + environment + "-" + region + "-" + System.currentTimeMillis())
                    .encryption(BucketEncryption.KMS)
                    .encryptionKey(kmsKey)
                    .versioned(true)
                    .build();
            }

            Role ec2Role = Role.Builder.create(this, "Ec2Role-" + environment + "-" + region)
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

            InstanceProfile instanceProfile = InstanceProfile.Builder.create(this, "InstanceProfile-" + environment + "-" + region)
                .role(ec2Role)
                .build();

            SecurityGroup albSg = SecurityGroup.Builder.create(this, "AlbSg-" + environment + "-" + region)
                .vpc(vpc)
                .description("ALB Security Group")
                .build();

            albSg.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "HTTP");
            albSg.addIngressRule(Peer.anyIpv4(), Port.tcp(443), "HTTPS");

            SecurityGroup ec2Sg = SecurityGroup.Builder.create(this, "Ec2Sg-" + environment + "-" + region)
                .vpc(vpc)
                .description("EC2 Security Group")
                .build();

            ec2Sg.addIngressRule(albSg, Port.tcp(80), "HTTP from ALB");

            ApplicationLoadBalancer alb = ApplicationLoadBalancer.Builder.create(this, "Alb-" + environment + "-" + region)
                .vpc(vpc)
                .internetFacing(true)
                .securityGroup(albSg)
                .build();

            if (isPrimary && logsBucket != null) {
                alb.logAccessLogs(logsBucket, "alb-logs");
            }

            ApplicationTargetGroup targetGroup = ApplicationTargetGroup.Builder.create(this, "TargetGroup-" + environment + "-" + region)
                .vpc(vpc)
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .targetType(TargetType.INSTANCE)
                .healthCheck(HealthCheck.builder()
                    .path("/health")
                    .build())
                .build();

            alb.addListener("Listener", BaseApplicationListenerProps.builder()
                .port(80)
                .defaultTargetGroups(Arrays.asList(targetGroup))
                .build());

            LaunchTemplate launchTemplate = LaunchTemplate.Builder.create(this, "LaunchTemplate-" + environment + "-" + region)
                .instanceType(environment.equals("production") ? InstanceType.of(InstanceClass.M5, InstanceSize.LARGE) : 
                             InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                .machineImage(MachineImage.latestAmazonLinux())
                .securityGroup(ec2Sg)
                .role(ec2Role)
                .userData(UserData.forLinux())
                .build();

            AutoScalingGroup asg = AutoScalingGroup.Builder.create(this, "Asg-" + environment + "-" + region)
                .vpc(vpc)
                .launchTemplate(launchTemplate)
                .minCapacity(environment.equals("production") ? 2 : 1)
                .maxCapacity(environment.equals("production") ? 10 : 3)
                .desiredCapacity(environment.equals("production") ? 2 : 1)
                .build();

            asg.attachToApplicationTargetGroup(targetGroup);

            if (isPrimary) {
                DatabaseInstance rds = DatabaseInstance.Builder.create(this, "Rds-" + environment + "-" + region)
                    .engine(DatabaseInstanceEngine.mysql(MySqlInstanceEngineProps.builder()
                        .version(MysqlEngineVersion.VER_8_0)
                        .build()))
                    .instanceType(environment.equals("production") ? 
                                 InstanceType.of(InstanceClass.R5, InstanceSize.LARGE) :
                                 InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                    .vpc(vpc)
                    .multiAz(true)
                    .storageEncrypted(true)
                    .storageEncryptionKey(kmsKey)
                    .databaseName("appdb")
                    .credentials(Credentials.fromGeneratedSecret("admin"))
                    .build();

                Table dynamoTable = Table.Builder.create(this, "DynamoTable-" + environment + "-" + region)
                    .tableName("AppTable-" + environment + "-" + region)
                    .partitionKey(Attribute.builder()
                        .name("id")
                        .type(AttributeType.STRING)
                        .build())
                    .encryption(TableEncryption.CUSTOMER_MANAGED)
                    .encryptionKey(kmsKey)
                    .pointInTimeRecovery(true)
                    .replicationRegions(Arrays.asList("us-west-2"))
                    .build();
            } else {
                Table dynamoTable = Table.Builder.create(this, "DynamoTable-" + environment + "-" + region)
                    .tableName("AppTable-" + environment + "-" + region)
                    .partitionKey(Attribute.builder()
                        .name("id")
                        .type(AttributeType.STRING)
                        .build())
                    .encryption(TableEncryption.CUSTOMER_MANAGED)
                    .encryptionKey(kmsKey)
                    .pointInTimeRecovery(true)
                    .build();
            }

            LogGroup logGroup = LogGroup.Builder.create(this, "LogGroup-" + environment + "-" + region)
                .logGroupName("/aws/ec2/" + environment + "-" + region)
                .retention(RetentionDays.ONE_WEEK)
                .encryptionKey(kmsKey)
                .build();
        }
    }
}
```