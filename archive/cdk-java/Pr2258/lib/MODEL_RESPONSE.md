# AWS CDK Java Infrastructure for High Availability Web Application

I'll help you create a highly available web application infrastructure using AWS CDK Java. This solution includes VPC, Auto Scaling Groups, Application Load Balancer with HTTPS, S3 for logging, and implements the latest AWS features for enhanced reliability.

## WebAppStack.java

```java
package app;

import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.CfnOutputProps;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.autoscaling.AutoScalingGroup;
import software.amazon.awscdk.services.autoscaling.CpuUtilizationScalingPolicy;
import software.amazon.awscdk.services.autoscaling.HealthCheck;
import software.amazon.awscdk.services.certificatemanager.Certificate;
import software.amazon.awscdk.services.certificatemanager.CertificateValidation;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.targets.InstanceIdTarget;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.LifecycleConfiguration;
import software.amazon.awscdk.services.s3.StorageClass;
import software.constructs.Construct;
import software.amazon.awscdk.Stack;

import java.util.List;
import java.util.Map;

/**
 * Stack for deploying a highly available web application with Auto Scaling,
 * Application Load Balancer, and S3 logging infrastructure.
 */
public class WebAppStack extends Stack {
    
    private final Vpc vpc;
    private final ApplicationLoadBalancer alb;
    private final AutoScalingGroup autoScalingGroup;
    private final Bucket logsBucket;
    private final String environmentSuffix;

    public WebAppStack(final Construct scope, final String id, final WebAppStackProps props) {
        super(scope, id, props.getStackProps());
        
        this.environmentSuffix = props.getEnvironmentSuffix();
        
        // Create VPC with public and private subnets
        this.vpc = createVpc();
        
        // Create S3 bucket for logs
        this.logsBucket = createLogsBucket();
        
        // Create security groups
        SecurityGroup albSecurityGroup = createAlbSecurityGroup();
        SecurityGroup instanceSecurityGroup = createInstanceSecurityGroup(albSecurityGroup);
        
        // Create IAM role for EC2 instances
        Role instanceRole = createInstanceRole();
        
        // Create launch template
        LaunchTemplate launchTemplate = createLaunchTemplate(instanceSecurityGroup, instanceRole);
        
        // Create Auto Scaling Group
        this.autoScalingGroup = createAutoScalingGroup(launchTemplate);
        
        // Create Application Load Balancer
        this.alb = createApplicationLoadBalancer(albSecurityGroup);
        
        // Create certificate and configure HTTPS
        configureSslAndTargetGroups();
        
        // Apply tags to all resources
        applyTags();
        
        // Create outputs
        createOutputs();
    }
    
    private Vpc createVpc() {
        return Vpc.Builder.create(this, "WebAppVpc" + environmentSuffix)
            .maxAzs(3)
            .cidr("10.0.0.0/16")
            .natGateways(2) // For high availability
            .subnetConfiguration(List.of(
                SubnetConfiguration.builder()
                    .name("Public")
                    .subnetType(SubnetType.PUBLIC)
                    .cidrMask(24)
                    .build(),
                SubnetConfiguration.builder()
                    .name("Private")
                    .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                    .cidrMask(24)
                    .build()
            ))
            .build();
    }
    
    private Bucket createLogsBucket() {
        return Bucket.Builder.create(this, "WebAppLogsBucket" + environmentSuffix)
            .bucketName("webapp-logs-" + environmentSuffix.toLowerCase() + "-" + this.getAccount())
            .versioned(true)
            .encryption(BucketEncryption.S3_MANAGED)
            .lifecycleRules(List.of(
                LifecycleConfiguration.builder()
                    .id("LogsLifecycle")
                    .enabled(true)
                    .transitions(List.of(
                        LifecycleConfiguration.Transition.builder()
                            .storageClass(StorageClass.GLACIER)
                            .transitionAfter(Duration.days(30))
                            .build()
                    ))
                    .expiration(Duration.days(365))
                    .build()
            ))
            .removalPolicy(RemovalPolicy.RETAIN)
            .build();
    }
    
    private SecurityGroup createAlbSecurityGroup() {
        SecurityGroup sg = SecurityGroup.Builder.create(this, "AlbSecurityGroup" + environmentSuffix)
            .vpc(vpc)
            .description("Security group for Application Load Balancer")
            .allowAllOutbound(true)
            .build();
            
        // Allow HTTP and HTTPS traffic from anywhere
        sg.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "Allow HTTP traffic");
        sg.addIngressRule(Peer.anyIpv4(), Port.tcp(443), "Allow HTTPS traffic");
        
        return sg;
    }
    
    private SecurityGroup createInstanceSecurityGroup(SecurityGroup albSecurityGroup) {
        SecurityGroup sg = SecurityGroup.Builder.create(this, "InstanceSecurityGroup" + environmentSuffix)
            .vpc(vpc)
            .description("Security group for EC2 instances")
            .allowAllOutbound(true)
            .build();
            
        // Allow traffic from ALB only
        sg.addIngressRule(Peer.securityGroupId(albSecurityGroup.getSecurityGroupId()), 
                         Port.tcp(80), "Allow HTTP from ALB");
        
        return sg;
    }
    
    private Role createInstanceRole() {
        return Role.Builder.create(this, "InstanceRole" + environmentSuffix)
            .assumedBy(ServicePrincipal.Builder.create("ec2.amazonaws.com").build())
            .managedPolicies(List.of(
                ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy"),
                ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
            ))
            .build();
    }
    
    private LaunchTemplate createLaunchTemplate(SecurityGroup securityGroup, Role instanceRole) {
        InstanceProfile instanceProfile = InstanceProfile.Builder.create(this, "InstanceProfile" + environmentSuffix)
            .role(instanceRole)
            .build();
            
        // User data script to install and configure web server
        String userData = "#!/bin/bash\n" +
            "yum update -y\n" +
            "yum install -y httpd\n" +
            "systemctl start httpd\n" +
            "systemctl enable httpd\n" +
            "echo '<h1>Hello from Web Server</h1>' > /var/www/html/index.html\n" +
            "# Configure CloudWatch agent for log shipping\n" +
            "yum install -y amazon-cloudwatch-agent\n";
            
        return LaunchTemplate.Builder.create(this, "WebAppLaunchTemplate" + environmentSuffix)
            .launchTemplateName("webapp-template-" + environmentSuffix.toLowerCase())
            .machineImage(MachineImage.latestAmazonLinux2())
            .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
            .securityGroup(securityGroup)
            .iamInstanceProfile(instanceProfile)
            .userData(UserData.custom(userData))
            .build();
    }
    
    private AutoScalingGroup createAutoScalingGroup(LaunchTemplate launchTemplate) {
        AutoScalingGroup asg = AutoScalingGroup.Builder.create(this, "WebAppAsg" + environmentSuffix)
            .vpc(vpc)
            .launchTemplate(launchTemplate)
            .minCapacity(2)
            .maxCapacity(6)
            .desiredCapacity(2)
            .vpcSubnets(SubnetSelection.builder()
                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                .build())
            .healthCheck(HealthCheck.elb(Duration.minutes(5)))
            .build();
            
        // Configure CPU-based scaling policies
        CpuUtilizationScalingPolicy.Builder.create(this, "ScaleUpPolicy" + environmentSuffix)
            .autoScalingGroup(asg)
            .targetUtilization(70)
            .scaleInCooldown(Duration.minutes(5))
            .scaleOutCooldown(Duration.minutes(3))
            .build();
            
        return asg;
    }
    
    private ApplicationLoadBalancer createApplicationLoadBalancer(SecurityGroup securityGroup) {
        return ApplicationLoadBalancer.Builder.create(this, "WebAppAlb" + environmentSuffix)
            .vpc(vpc)
            .internetFacing(true)
            .securityGroup(securityGroup)
            .vpcSubnets(SubnetSelection.builder()
                .subnetType(SubnetType.PUBLIC)
                .build())
            .build();
    }
    
    private void configureSslAndTargetGroups() {
        // Create target group
        ApplicationTargetGroup targetGroup = ApplicationTargetGroup.Builder.create(this, "WebAppTargetGroup" + environmentSuffix)
            .port(80)
            .protocol(ApplicationProtocol.HTTP)
            .targetType(TargetType.INSTANCE)
            .vpc(vpc)
            .healthCheck(HealthCheck.builder()
                .enabled(true)
                .path("/")
                .protocol(software.amazon.awscdk.services.elasticloadbalancingv2.Protocol.HTTP)
                .healthyHttpCodes("200")
                .interval(Duration.seconds(30))
                .timeout(Duration.seconds(10))
                .healthyThresholdCount(2)
                .unhealthyThresholdCount(3)
                .build())
            .build();
            
        // Attach Auto Scaling Group to target group
        autoScalingGroup.attachToApplicationTargetGroup(targetGroup);
        
        // Create certificate for HTTPS
        Certificate certificate = Certificate.Builder.create(this, "WebAppCertificate" + environmentSuffix)
            .domainName("*.example.com") // Replace with your domain
            .validation(CertificateValidation.fromDns())
            .build();
            
        // Create HTTPS listener
        ApplicationListener httpsListener = alb.addListener("HttpsListener" + environmentSuffix,
            BaseApplicationListenerProps.builder()
                .port(443)
                .protocol(ApplicationProtocol.HTTPS)
                .certificates(List.of(certificate))
                .defaultTargetGroups(List.of(targetGroup))
                .build());
                
        // Create HTTP listener that redirects to HTTPS
        alb.addListener("HttpListener" + environmentSuffix,
            BaseApplicationListenerProps.builder()
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .defaultAction(ListenerAction.redirect(RedirectOptions.builder()
                    .protocol("HTTPS")
                    .port("443")
                    .permanent(true)
                    .build()))
                .build());
    }
    
    private void applyTags() {
        Tags.of(this).add("Environment", "Production");
        Tags.of(this).add("App", "WebApp");
    }
    
    private void createOutputs() {
        CfnOutput.Builder.create(this, "LoadBalancerDns" + environmentSuffix)
            .value(alb.getLoadBalancerDnsName())
            .description("DNS name of the load balancer")
            .build();
            
        CfnOutput.Builder.create(this, "LogsBucketName" + environmentSuffix)
            .value(logsBucket.getBucketName())
            .description("Name of the S3 logs bucket")
            .build();
    }
    
    // Getters
    public Vpc getVpc() { return vpc; }
    public ApplicationLoadBalancer getApplicationLoadBalancer() { return alb; }
    public AutoScalingGroup getAutoScalingGroup() { return autoScalingGroup; }
    public Bucket getLogsBucket() { return logsBucket; }
}
```

## WebAppStackProps.java

```java
package app;

import software.amazon.awscdk.StackProps;

/**
 * Properties for the WebAppStack.
 */
public class WebAppStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;

    private WebAppStackProps(String environmentSuffix, StackProps stackProps) {
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

        public WebAppStackProps build() {
            return new WebAppStackProps(environmentSuffix, stackProps);
        }
    }
}
```

## Updated TapStack in Main.java

```java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.constructs.Construct;

import java.util.Optional;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
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
 * Main orchestrating stack that creates the WebApp infrastructure.
 */
class TapStack extends Stack {
    private final String environmentSuffix;
    private final WebAppStack webAppStack;

    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, context, or use 'dev' as default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Create the WebApp stack
        this.webAppStack = new WebAppStack(
            this,
            "WebAppStack" + environmentSuffix,
            WebAppStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                    .env(Environment.builder()
                        .region("us-west-2") // Force us-west-2 region
                        .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                        .build())
                    .build())
                .build()
        );
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }
    
    public WebAppStack getWebAppStack() {
        return webAppStack;
    }
}

/**
 * Main entry point for the CDK application.
 */
public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from context or default to 'dev'
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Create the main TAP stack with WebApp infrastructure
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region("us-west-2") // Force us-west-2 region
                                .build())
                        .build())
                .build());

        // Synthesize the CDK app
        app.synth();
    }
}
```

## cdk.json

```json
{
  "app": "gradle run",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "build",
      ".gradle",
      "src/test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-kms:applyImportedAliasPermissionsToPrincipal": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```

This infrastructure code creates a complete highly available web application deployment with:

1. **VPC with Multi-AZ Setup**: Public and private subnets across 3 availability zones
2. **Auto Scaling Group**: Min 2, max 6 instances with CPU-based scaling
3. **Application Load Balancer**: HTTPS with automatic HTTP to HTTPS redirection
4. **S3 Bucket**: For logs with lifecycle policies (Glacier after 30 days, delete after 365 days)
5. **Security Groups**: Least privilege access with ALB-to-instance communication
6. **IAM Roles**: Proper permissions for EC2 instances and CloudWatch
7. **SSL Certificate**: Amazon Certificate Manager integration
8. **Tags**: Environment and App tags applied consistently
9. **Regional Deployment**: Fixed to us-west-2 region

The solution follows AWS best practices and is production-ready with proper health checks, security configurations, and monitoring capabilities.