I'll design and implement a highly available, scalable web application infrastructure using AWS CDK with Java. This solution will follow AWS best practices for security, scalability, and high availability.

## Project Structure

```
web-app-infrastructure/
├── pom.xml
├── cdk.json
└── src/main/java/com/webapp/
    ├── WebAppInfrastructureApp.java
    ├── WebAppInfrastructureStack.java
    └── constructs/
        ├── NetworkConstruct.java
        ├── SecurityConstruct.java
        ├── ComputeConstruct.java
        └── StorageConstruct.java
```

## 1. Maven Configuration (pom.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd"
         xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.webapp</groupId>
    <artifactId>web-app-infrastructure</artifactId>
    <version>0.1</version>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <cdk.version>2.110.1</cdk.version>
        <junit.version>5.7.1</junit.version>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
    </properties>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <release>11</release>
                </configuration>
            </plugin>
        </plugins>
    </build>

    <dependencies>
        <!-- AWS CDK -->
        <dependency>
            <groupId>software.amazon.awscdk</groupId>
            <artifactId>aws-cdk-lib</artifactId>
            <version>${cdk.version}</version>
        </dependency>

        <!-- Constructs -->
        <dependency>
            <groupId>software.constructs</groupId>
            <artifactId>constructs</artifactId>
            <version>10.3.0</version>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>${junit.version}</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

## 2. CDK Configuration (cdk.json)

```json
{
  "app": "mvn -e -q compile exec:java",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "target",
      "pom.xml",
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
    "@aws-cdk-containers/ecs-service-extensions:enableLogging": true,
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
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
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
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-lambda:useLatestRuntimeVersion": true
  }
}
```

## 3. Main Application Class

```java
package com.webapp;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;

/**
 * Main CDK application entry point.
 * Initializes the web application infrastructure stack.
 */
public class WebAppInfrastructureApp {
    public static void main(final String[] args) {
        App app = new App();

        // Define the target environment - us-west-2 region as required
        Environment env = Environment.builder()
                .region("us-west-2")
                .build();

        // Create the main infrastructure stack
        new WebAppInfrastructureStack(app, "WebAppInfrastructureStack", StackProps.builder()
                .env(env)
                .description("Highly available, scalable web application infrastructure")
                .build());

        app.synth();
    }
}
```

## 4. Network Infrastructure Construct

```java
package com.webapp.constructs;

import software.amazon.awscdk.services.ec2.*;
import software.constructs.Construct;

/**
 * Network construct that creates a VPC with public and private subnets
 * across multiple availability zones for high availability.
 */
public class NetworkConstruct extends Construct {
    
    private final Vpc vpc;
    
    public NetworkConstruct(final Construct scope, final String id) {
        super(scope, id);
        
        // Create VPC with public and private subnets across multiple AZs
        // This ensures high availability by distributing resources across AZs
        this.vpc = Vpc.Builder.create(this, "WebAppVpc")
                .ipAddresses(IpAddresses.cidr("10.0.0.0/16"))
                .maxAzs(3) // Use 3 AZs for high availability
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .subnetConfiguration(java.util.List.of(
                        // Public subnets for load balancer and NAT gateways
                        SubnetConfiguration.builder()
                                .name("PublicSubnet")
                                .subnetType(SubnetType.PUBLIC)
                                .cidrMask(24)
                                .build(),
                        // Private subnets for application servers
                        SubnetConfiguration.builder()
                                .name("PrivateSubnet")
                                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                                .cidrMask(24)
                                .build()
                ))
                .natGateways(3) // One NAT gateway per AZ for high availability
                .build();
        
        // Add VPC Flow Logs for security monitoring
        FlowLog.Builder.create(this, "VpcFlowLog")
                .resourceType(FlowLogResourceType.fromVpc(vpc))
                .trafficType(FlowLogTrafficType.ALL)
                .build();
    }
    
    public Vpc getVpc() {
        return vpc;
    }
}
```

## 5. Security Construct

```java
package com.webapp.constructs;

import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.*;
import software.constructs.Construct;

/**
 * Security construct that creates IAM roles and security groups
 * following the principle of least privilege.
 */
public class SecurityConstruct extends Construct {
    
    private final Role ec2Role;
    private final InstanceProfile ec2InstanceProfile;
    private final SecurityGroup albSecurityGroup;
    private final SecurityGroup ec2SecurityGroup;
    
    public SecurityConstruct(final Construct scope, final String id, final Vpc vpc) {
        super(scope, id);
        
        // Create IAM role for EC2 instances with minimal required permissions
        this.ec2Role = Role.Builder.create(this, "EC2Role")
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .description("IAM role for web application EC2 instances")
                .managedPolicies(java.util.List.of(
                        // Required for SSM Session Manager (secure access without SSH)
                        ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
                        // Required for CloudWatch agent
                        ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy")
                ))
                .build();
        
        // Add inline policy for S3 access (read-only for static assets)
        this.ec2Role.addToPolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(java.util.List.of(
                        "s3:GetObject",
                        "s3:ListBucket"
                ))
                .resources(java.util.List.of(
                        "arn:aws:s3:::webapp-static-assets-*",
                        "arn:aws:s3:::webapp-static-assets-*/*"
                ))
                .build());
        
        // Create instance profile for EC2 instances
        this.ec2InstanceProfile = InstanceProfile.Builder.create(this, "EC2InstanceProfile")
                .role(ec2Role)
                .build();
        
        // Security group for Application Load Balancer
        // Only allows HTTP and HTTPS traffic from the internet
        this.albSecurityGroup = SecurityGroup.Builder.create(this, "ALBSecurityGroup")
                .vpc(vpc)
                .description("Security group for Application Load Balancer")
                .allowAllOutbound(false) // Explicitly control outbound traffic
                .build();
        
        // Allow HTTP traffic from internet
        albSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(80),
                "Allow HTTP traffic from internet"
        );
        
        // Allow HTTPS traffic from internet
        albSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(443),
                "Allow HTTPS traffic from internet"
        );
        
        // Security group for EC2 instances
        // Only allows traffic from the load balancer
        this.ec2SecurityGroup = SecurityGroup.Builder.create(this, "EC2SecurityGroup")
                .vpc(vpc)
                .description("Security group for web application EC2 instances")
                .allowAllOutbound(true) // Allow outbound for updates and external API calls
                .build();
        
        // Allow HTTP traffic only from ALB
        ec2SecurityGroup.addIngressRule(
                Peer.securityGroupId(albSecurityGroup.getSecurityGroupId()),
                Port.tcp(8080),
                "Allow HTTP traffic from ALB"
        );
        
        // Add egress rule for ALB to communicate with EC2 instances
        albSecurityGroup.addEgressRule(
                Peer.securityGroupId(ec2SecurityGroup.getSecurityGroupId()),
                Port.tcp(8080),
                "Allow ALB to communicate with EC2 instances"
        );
    }
    
    public Role getEc2Role() {
        return ec2Role;
    }
    
    public InstanceProfile getEc2InstanceProfile() {
        return ec2InstanceProfile;
    }
    
    public SecurityGroup getAlbSecurityGroup() {
        return albSecurityGroup;
    }
    
    public SecurityGroup getEc2SecurityGroup() {
        return ec2SecurityGroup;
    }
}
```

## 6. Storage Construct

```java
package com.webapp.constructs;

import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.cloudfront.*;
import software.amazon.awscdk.services.cloudfront.origins.S3Origin;
import software.constructs.Construct;

/**
 * Storage construct that creates S3 bucket for static assets
 * with CloudFront distribution for global content delivery.
 */
public class StorageConstruct extends Construct {
    
    private final Bucket staticAssetsBucket;
    private final Distribution cloudFrontDistribution;
    
    public StorageConstruct(final Construct scope, final String id) {
        super(scope, id);
        
        // Create S3 bucket for static assets with security best practices
        this.staticAssetsBucket = Bucket.Builder.create(this, "StaticAssetsBucket")
                .bucketName(null) // Let CDK generate unique name
                .versioned(true) // Enable versioning for data protection
                .encryption(BucketEncryption.S3_MANAGED) // Server-side encryption
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL) // Block all public access
                .removalPolicy(RemovalPolicy.DESTROY) // For demo purposes only
                .autoDeleteObjects(true) // For demo purposes only
                .enforceSSL(true) // Require SSL for all requests
                .build();
        
        // Create Origin Access Control for CloudFront
        CfnOriginAccessControl oac = CfnOriginAccessControl.Builder.create(this, "OAC")
                .originAccessControlConfig(CfnOriginAccessControl.OriginAccessControlConfigProperty.builder()
                        .name("WebApp-OAC")
                        .originAccessControlOriginType("s3")
                        .signingBehavior("always")
                        .signingProtocol("sigv4")
                        .build())
                .build();
        
        // Create CloudFront distribution for global content delivery
        this.cloudFrontDistribution = Distribution.Builder.create(this, "StaticAssetsDistribution")
                .defaultBehavior(BehaviorOptions.builder()
                        .origin(new S3Origin(staticAssetsBucket))
                        .viewerProtocolPolicy(ViewerProtocolPolicy.REDIRECT_TO_HTTPS)
                        .cachePolicy(CachePolicy.CACHING_OPTIMIZED)
                        .compress(true)
                        .build())
                .priceClass(PriceClass.PRICE_CLASS_100) // Use only North America and Europe edge locations
                .enableIpv6(true)
                .comment("CloudFront distribution for web app static assets")
                .build();
        
        // Add bucket policy to allow CloudFront access
        staticAssetsBucket.addToResourcePolicy(
                software.amazon.awscdk.services.iam.PolicyStatement.Builder.create()
                        .effect(software.amazon.awscdk.services.iam.Effect.ALLOW)
                        .principals(java.util.List.of(
                                new software.amazon.awscdk.services.iam.ServicePrincipal("cloudfront.amazonaws.com")
                        ))
                        .actions(java.util.List.of("s3:GetObject"))
                        .resources(java.util.List.of(staticAssetsBucket.arnForObjects("*")))
                        .conditions(java.util.Map.of(
                                "StringEquals", java.util.Map.of(
                                        "AWS:SourceArn", cloudFrontDistribution.getDistributionArn()
                                )
                        ))
                        .build()
        );
    }
    
    public Bucket getStaticAssetsBucket() {
        return staticAssetsBucket;
    }
    
    public Distribution getCloudFrontDistribution() {
        return cloudFrontDistribution;
    }
}
```

## 7. Compute Construct

```java
package com.webapp.constructs;

import software.amazon.awscdk.Duration;
import software.amazon.awscdk.services.autoscaling.*;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.targets.AutoScalingTarget;
import software.amazon.awscdk.services.iam.InstanceProfile;
import software.constructs.Construct;

/**
 * Compute construct that creates Auto Scaling Group with EC2 instances
 * and Application Load Balancer for high availability and scalability.
 */
public class ComputeConstruct extends Construct {
    
    private final AutoScalingGroup autoScalingGroup;
    private final ApplicationLoadBalancer applicationLoadBalancer;
    
    public ComputeConstruct(final Construct scope, final String id, 
                          final Vpc vpc, 
                          final SecurityGroup albSecurityGroup,
                          final SecurityGroup ec2SecurityGroup,
                          final InstanceProfile instanceProfile,
                          final String staticAssetsBucketName) {
        super(scope, id);
        
        // User data script to install and configure the web application
        UserData userData = UserData.forLinux();
        userData.addCommands(
                // Update system packages
                "yum update -y",
                
                // Install required packages
                "yum install -y java-11-amazon-corretto-headless",
                "yum install -y amazon-cloudwatch-agent",
                
                // Install SSM agent for secure access
                "yum install -y amazon-ssm-agent",
                "systemctl enable amazon-ssm-agent",
                "systemctl start amazon-ssm-agent",
                
                // Create application directory
                "mkdir -p /opt/webapp",
                "cd /opt/webapp",
                
                // Create a simple Java web application (for demo purposes)
                "cat > WebApp.java << 'EOF'",
                "import com.sun.net.httpserver.*;",
                "import java.io.*;",
                "import java.net.*;",
                "import java.util.concurrent.*;",
                "",
                "public class WebApp {",
                "    public static void main(String[] args) throws Exception {",
                "        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);",
                "        server.createContext(\"/\", new RootHandler());",
                "        server.createContext(\"/health\", new HealthHandler());",
                "        server.setExecutor(Executors.newFixedThreadPool(10));",
                "        server.start();",
                "        System.out.println(\"Server started on port 8080\");",
                "    }",
                "",
                "    static class RootHandler implements HttpHandler {",
                "        public void handle(HttpExchange exchange) throws IOException {",
                "            String response = \"<html><body><h1>Web Application</h1>\" +",
                "                            \"<p>Instance ID: \" + System.getenv(\"INSTANCE_ID\") + \"</p>\" +",
                "                            \"<p>Static assets served from CloudFront</p>\" +",
                "                            \"<p>Bucket: " + staticAssetsBucketName + "</p></body></html>\";",
                "            exchange.sendResponseHeaders(200, response.length());",
                "            OutputStream os = exchange.getResponseBody();",
                "            os.write(response.getBytes());",
                "            os.close();",
                "        }",
                "    }",
                "",
                "    static class HealthHandler implements HttpHandler {",
                "        public void handle(HttpExchange exchange) throws IOException {",
                "            String response = \"OK\";",
                "            exchange.sendResponseHeaders(200, response.length());",
                "            OutputStream os = exchange.getResponseBody();",
                "            os.write(response.getBytes());",
                "            os.close();",
                "        }",
                "    }",
                "}",
                "EOF",
                
                // Compile and run the application
                "javac WebApp.java",
                
                // Create systemd service
                "cat > /etc/systemd/system/webapp.service << 'EOF'",
                "[Unit]",
                "Description=Web Application",
                "After=network.target",
                "",
                "[Service]",
                "Type=simple",
                "User=ec2-user",
                "WorkingDirectory=/opt/webapp",
                "Environment=INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)",
                "ExecStart=/usr/bin/java WebApp",
                "Restart=always",
                "RestartSec=10",
                "",
                "[Install]",
                "WantedBy=multi-user.target",
                "EOF",
                
                // Enable and start the service
                "systemctl daemon-reload",
                "systemctl enable webapp",
                "systemctl start webapp",
                
                // Configure CloudWatch agent
                "cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'",
                "{",
                "    \"metrics\": {",
                "        \"namespace\": \"WebApp/EC2\",",
                "        \"metrics_collected\": {",
                "            \"cpu\": {",
                "                \"measurement\": [\"cpu_usage_idle\", \"cpu_usage_iowait\", \"cpu_usage_user\", \"cpu_usage_system\"],",
                "                \"metrics_collection_interval\": 60",
                "            },",
                "            \"disk\": {",
                "                \"measurement\": [\"used_percent\"],",
                "                \"metrics_collection_interval\": 60,",
                "                \"resources\": [\"*\"]",
                "            },",
                "            \"mem\": {",
                "                \"measurement\": [\"mem_used_percent\"],",
                "                \"metrics_collection_interval\": 60",
                "            }",
                "        }",
                "    },",
                "    \"logs\": {",
                "        \"logs_collected\": {",
                "            \"files\": {",
                "                \"collect_list\": [",
                "                    {",
                "                        \"file_path\": \"/var/log/messages\",",
                "                        \"log_group_name\": \"/aws/ec2/webapp\",",
                "                        \"log_stream_name\": \"{instance_id}/messages\"",
                "                    }",
                "                ]",
                "            }",
                "        }",
                "    }",
                "}",
                "EOF",
                
                // Start CloudWatch agent
                "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json"
        );
        
        // Create launch template for Auto Scaling Group
        LaunchTemplate launchTemplate = LaunchTemplate.Builder.create(this, "WebAppLaunchTemplate")
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                .machineImage(MachineImage.latestAmazonLinux2())
                .userData(userData)
                .securityGroup(ec2SecurityGroup)
                .role(instanceProfile.getRole())
                .requireImdsv2(true) // Require IMDSv2 for enhanced security
                .build();
        
        // Create Auto Scaling Group for high availability and scalability
        this.autoScalingGroup = AutoScalingGroup.Builder.create(this, "WebAppAutoScalingGroup")
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build())
                .launchTemplate(launchTemplate)
                .minCapacity(2) // Minimum 2 instances for high availability
                .maxCapacity(10) // Maximum 10 instances for cost control
                .desiredCapacity(2) // Start with 2 instances
                .healthCheckType(HealthCheckType.ELB) // Use ELB health checks
                .healthCheckGracePeriod(Duration.minutes(5))
                .build();
        
        // Configure auto scaling policies based on CPU utilization
        autoScalingGroup.scaleOnCpuUtilization("CpuScaling", CpuUtilizationScalingProps.builder()
                .targetUtilizationPercent(70) // Scale when CPU > 70%
                .scaleInCooldown(Duration.minutes(5))
                .scaleOutCooldown(Duration.minutes(3))
                .build());
        
        // Create Application Load Balancer in public subnets
        this.applicationLoadBalancer = ApplicationLoadBalancer.Builder.create(this, "WebAppALB")
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PUBLIC)
                        .build())
                .internetFacing(true)
                .securityGroup(albSecurityGroup)
                .build();
        
        // Create target group for the Auto Scaling Group
        ApplicationTargetGroup targetGroup = ApplicationTargetGroup.Builder.create(this, "WebAppTargetGroup")
                .vpc(vpc)
                .port(8080)
                .protocol(ApplicationProtocol.HTTP)
                .targets(java.util.List.of(new AutoScalingTarget(autoScalingGroup)))
                .healthCheckPath("/health")
                .healthCheckIntervalDuration(Duration.seconds(30))
                .healthCheckTimeoutDuration(Duration.seconds(5))
                .healthyThresholdCount(2)
                .unhealthyThresholdCount(3)
                .build();
        
        // Add listener to the load balancer
        applicationLoadBalancer.addListener("WebAppListener", ApplicationListenerProps.builder()
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .defaultTargetGroups(java.util.List.of(targetGroup))
                .build());
    }
    
    public AutoScalingGroup getAutoScalingGroup() {
        return autoScalingGroup;
    }
    
    public ApplicationLoadBalancer getApplicationLoadBalancer() {
        return applicationLoadBalancer;
    }
}
```

## 8. Main Infrastructure Stack

```java
package com.webapp;

import com.webapp.constructs.*;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.constructs.Construct;

/**
 * Main infrastructure stack that orchestrates all constructs
 * to create a highly available, scalable web application.
 */
public class WebAppInfrastructureStack extends Stack {
    
    public WebAppInfrastructureStack(final Construct scope, final String id) {
        this(scope, id, null);
    }
    
    public WebAppInfrastructureStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);
        
        // Create network infrastructure (VPC, subnets, NAT gateways)
        NetworkConstruct network = new NetworkConstruct(this, "Network");
        
        // Create security resources (IAM roles, security groups)
        SecurityConstruct security = new SecurityConstruct(this, "Security", network.getVpc());
        
        // Create storage resources (S3 bucket, CloudFront distribution)
        StorageConstruct storage = new StorageConstruct(this, "Storage");
        
        // Create compute resources (Auto Scaling Group, Load Balancer)
        ComputeConstruct compute = new ComputeConstruct(this, "Compute",
                network.getVpc(),
                security.getAlbSecurityGroup(),
                security.getEc2SecurityGroup(),
                security.getEc2InstanceProfile(),
                storage.getStaticAssetsBucket().getBucketName());
        
        // Output important information for users
        CfnOutput.Builder.create(this, "LoadBalancerDNS")
                .description("Application Load Balancer DNS name")
                .value(compute.getApplicationLoadBalancer().getLoadBalancerDnsName())
                .build();
        
        CfnOutput.Builder.create(this, "LoadBalancerURL")
                .description("Application URL")
                .value("http://" + compute.getApplicationLoadBalancer().getLoadBalancerDnsName())
                .build();
        
        CfnOutput.Builder.create(this, "StaticAssetsBucket")
                .description("S3 bucket for static assets")
                .value(storage.getStaticAssetsBucket().getBucketName())
                .build();
        
        CfnOutput.Builder.create(this, "CloudFrontDistributionDomain")
                .description("CloudFront distribution domain for static assets")
                .value(storage.getCloudFrontDistribution().getDistributionDomainName())
                .build();
        
        CfnOutput.Builder.create(this, "CloudFrontDistributionURL")
                .description("CloudFront distribution URL for static assets")
                .value("https://" + storage.getCloudFrontDistribution().getDistributionDomainName())
                .build();
    }
}
```

## Deployment Instructions

### Prerequisites

1. **Install AWS CDK CLI**:
   ```bash
   npm install -g aws-cdk
   ```

2. **Configure AWS credentials**:
   ```bash
   aws configure
   ```

3. **Install Java 11 or later** and **Maven**.

### Deployment Steps

1. **Clone and navigate to the project directory**:
   ```bash
   mkdir web-app-infrastructure && cd web-app-infrastructure
   ```

2. **Initialize the project** with the provided files.

3. **Bootstrap CDK** (first time only):
   ```bash
   cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
   ```

4. **Deploy the infrastructure**:
   ```bash
   cdk deploy
   ```

5. **Access the application**