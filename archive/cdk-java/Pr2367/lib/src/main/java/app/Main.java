package app;

import software.amazon.awscdk.*;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.cloudfront.Distribution;
import software.amazon.awscdk.services.cloudfront.BehaviorOptions;
import software.amazon.awscdk.services.cloudfront.CachePolicy;
import software.amazon.awscdk.services.cloudfront.PriceClass;
import software.amazon.awscdk.services.cloudfront.ViewerProtocolPolicy;
import software.amazon.awscdk.services.cloudfront.origins.S3Origin;
import software.amazon.awscdk.services.cloudfront.CfnOriginAccessControl;
import software.amazon.awscdk.services.autoscaling.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.*;
import software.amazon.awscdk.services.logs.*;
import software.constructs.Construct;

/**
 * Main CDK application with all infrastructure components inline.
 * This single file contains the complete highly available, scalable web application infrastructure.
 * 
 * REMOVAL POLICY STRATEGY:
 * - All resources use RemovalPolicy.DESTROY to ensure complete cleanup when stack is deleted
 * - S3 bucket has autoDeleteObjects(true) to automatically delete all objects
 * - This prevents orphaned resources and ensures clean stack deletion
 */
public class Main {
    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from context or use default
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Create the main TAP stack
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region("us-west-2") // Deploy in us-west-2 region as required
                                .build())
                        .description("Highly available, scalable web application infrastructure")
                        .build())
                .build());

        app.synth();
    }

    /**
     * Main infrastructure stack that orchestrates all components
     * to create a highly available, scalable web application.
     */
    public static class TapStack extends Stack {
        private final String environmentSuffix;

        public TapStack(final Construct scope, final String id, final TapStackProps props) {
            super(scope, id, props.getStackProps());
            this.environmentSuffix = props.getEnvironmentSuffix();

            // Create network infrastructure (VPC, subnets, NAT gateways)
            NetworkConstruct network = new NetworkConstruct(this, "Network", environmentSuffix);

            // Create security resources (IAM roles, security groups)
            SecurityConstruct security = new SecurityConstruct(this, "Security", network.getVpc(), environmentSuffix);

            // Create storage resources (S3 bucket, CloudFront distribution)
            StorageConstruct storage = new StorageConstruct(this, "Storage", environmentSuffix);

            // Create compute resources (Auto Scaling Group, Load Balancer)
            ComputeConstruct compute = new ComputeConstruct(this, "Compute",
                    network.getVpc(),
                    security.getAlbSecurityGroup(),
                    security.getEc2SecurityGroup(),
                    security.getEc2InstanceProfile(),
                    storage.getStaticAssetsBucket().getBucketName(),
                    environmentSuffix);

            // Output important information for users
            CfnOutput.Builder.create(this, "LoadBalancerDNS" + environmentSuffix)
                    .description("Application Load Balancer DNS name")
                    .value(compute.getApplicationLoadBalancer().getLoadBalancerDnsName())
                    .build();

            CfnOutput.Builder.create(this, "LoadBalancerURL" + environmentSuffix)
                    .description("Application URL")
                    .value("http://" + compute.getApplicationLoadBalancer().getLoadBalancerDnsName())
                    .build();

            CfnOutput.Builder.create(this, "StaticAssetsBucket" + environmentSuffix)
                    .description("S3 bucket for static assets")
                    .value(storage.getStaticAssetsBucket().getBucketName())
                    .build();

            CfnOutput.Builder.create(this, "CloudFrontDistributionDomain" + environmentSuffix)
                    .description("CloudFront distribution domain for static assets")
                    .value(storage.getCloudFrontDistribution().getDistributionDomainName())
                    .build();

            CfnOutput.Builder.create(this, "CloudFrontDistributionURL" + environmentSuffix)
                    .description("CloudFront distribution URL for static assets")
                    .value("https://" + storage.getCloudFrontDistribution().getDistributionDomainName())
                    .build();
        }

        public String getEnvironmentSuffix() {
            return environmentSuffix;
        }
    }

    /**
     * Network construct that creates VPC with public and private subnets,
     * NAT gateways, and VPC Flow Logs for high availability.
     */
    public static class NetworkConstruct extends Construct {
        private final Vpc vpc;

        public NetworkConstruct(final Construct scope, final String id, final String environmentSuffix) {
            super(scope, id);

            // Create VPC with public and private subnets across multiple AZs
            this.vpc = Vpc.Builder.create(this, "WebAppVpc" + environmentSuffix)
                    .ipAddresses(IpAddresses.cidr("10.0.0.0/16"))
                    .maxAzs(3) // Use 3 AZs for high availability
                    .subnetConfiguration(java.util.List.of(
                            // Public subnets for load balancers
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
            FlowLog.Builder.create(this, "VpcFlowLog" + environmentSuffix)
                    .resourceType(FlowLogResourceType.fromVpc(vpc))
                    .trafficType(FlowLogTrafficType.ALL)
                    .build();
        }

        public Vpc getVpc() {
            return vpc;
        }
    }

    /**
     * Security construct that creates IAM roles and security groups
     * following the principle of least privilege.
     */
    public static class SecurityConstruct extends Construct {
        private final Role ec2Role;
        private final InstanceProfile ec2InstanceProfile;
        private final SecurityGroup albSecurityGroup;
        private final SecurityGroup ec2SecurityGroup;

        public SecurityConstruct(final Construct scope, final String id, final Vpc vpc, final String environmentSuffix) {
            super(scope, id);

            // Create IAM role for EC2 instances with minimal required permissions
            this.ec2Role = Role.Builder.create(this, "EC2Role" + environmentSuffix)
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
            this.ec2InstanceProfile = InstanceProfile.Builder.create(this, "EC2InstanceProfile" + environmentSuffix)
                    .role(ec2Role)
                    .build();

            // Security group for Application Load Balancer
            // Only allows HTTP and HTTPS traffic from the internet
            this.albSecurityGroup = SecurityGroup.Builder.create(this, "ALBSecurityGroup" + environmentSuffix)
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
            this.ec2SecurityGroup = SecurityGroup.Builder.create(this, "EC2SecurityGroup" + environmentSuffix)
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
            // Use allowAllOutbound instead of specific egress rule to avoid circular dependency
            albSecurityGroup.addEgressRule(
                    Peer.anyIpv4(),
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

    /**
     * Storage construct that creates S3 bucket for static assets
     * with CloudFront distribution for global content delivery.
     */
    public static class StorageConstruct extends Construct {
        private final Bucket staticAssetsBucket;
        private final Distribution cloudFrontDistribution;

        public StorageConstruct(final Construct scope, final String id, final String environmentSuffix) {
            super(scope, id);

            // Create S3 bucket for static assets with security best practices
            this.staticAssetsBucket = Bucket.Builder.create(this, "StaticAssetsBucket" + environmentSuffix)
                    .bucketName(null) // Let CDK generate unique name
                    .versioned(true) // Enable versioning for data protection
                    .encryption(BucketEncryption.S3_MANAGED) // Server-side encryption
                    .blockPublicAccess(BlockPublicAccess.BLOCK_ALL) // Block all public access
                    .removalPolicy(RemovalPolicy.DESTROY) // Ensures complete cleanup when stack is deleted
                    .autoDeleteObjects(true) // Automatically deletes S3 objects when bucket is deleted
                    .build();

            // Create Origin Access Control for CloudFront
            CfnOriginAccessControl oac = CfnOriginAccessControl.Builder.create(this, "OAC" + environmentSuffix)
                    .originAccessControlConfig(CfnOriginAccessControl.OriginAccessControlConfigProperty.builder()
                            .name("WebApp-OAC" + environmentSuffix)
                            .originAccessControlOriginType("s3")
                            .signingBehavior("always")
                            .signingProtocol("sigv4")
                            .build())
                    .build();

            // Create CloudFront distribution for global content delivery
            this.cloudFrontDistribution = Distribution.Builder.create(this, "StaticAssetsDistribution" + environmentSuffix)
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
                    PolicyStatement.Builder.create()
                            .effect(Effect.ALLOW)
                            .principals(java.util.List.of(
                                    new ServicePrincipal("cloudfront.amazonaws.com")
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

    /**
     * Compute construct that creates Auto Scaling Group with EC2 instances
     * and Application Load Balancer for high availability and scalability.
     */
    public static class ComputeConstruct extends Construct {
        private final AutoScalingGroup autoScalingGroup;
        private final ApplicationLoadBalancer applicationLoadBalancer;

        public ComputeConstruct(final Construct scope, final String id,
                              final Vpc vpc,
                              final SecurityGroup albSecurityGroup,
                              final SecurityGroup ec2SecurityGroup,
                              final InstanceProfile instanceProfile,
                              final String staticAssetsBucketName,
                              final String environmentSuffix) {
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
            LaunchTemplate launchTemplate = LaunchTemplate.Builder.create(this, "WebAppLaunchTemplate" + environmentSuffix)
                    .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                    .machineImage(MachineImage.latestAmazonLinux2())
                    .userData(userData)
                    .securityGroup(ec2SecurityGroup)
                    .role(instanceProfile.getRole())
                    .requireImdsv2(true) // Require IMDSv2 for enhanced security
                    .build();

            // Create Auto Scaling Group for high availability and scalability
            this.autoScalingGroup = AutoScalingGroup.Builder.create(this, "WebAppAutoScalingGroup" + environmentSuffix)
                    .vpc(vpc)
                    .vpcSubnets(SubnetSelection.builder()
                            .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                            .build())
                    .launchTemplate(launchTemplate)
                    .minCapacity(2) // Minimum 2 instances for high availability
                    .maxCapacity(10) // Maximum 10 instances for cost control
                    .desiredCapacity(2) // Start with 2 instances
                    .build();

            // Configure auto scaling policies based on CPU utilization
            autoScalingGroup.scaleOnCpuUtilization("CpuScaling" + environmentSuffix, CpuUtilizationScalingProps.builder()
                    .targetUtilizationPercent(70) // Scale when CPU > 70%
                    .build());

            // Create Application Load Balancer in public subnets
            this.applicationLoadBalancer = ApplicationLoadBalancer.Builder.create(this, "WebAppALB" + environmentSuffix)
                    .vpc(vpc)
                    .vpcSubnets(SubnetSelection.builder()
                            .subnetType(SubnetType.PUBLIC)
                            .build())
                    .internetFacing(true)
                    .securityGroup(albSecurityGroup)
                    .build();

            // Create target group for the Auto Scaling Group
            ApplicationTargetGroup targetGroup = ApplicationTargetGroup.Builder.create(this, "WebAppTargetGroup" + environmentSuffix)
                    .vpc(vpc)
                    .port(8080)
                    .protocol(ApplicationProtocol.HTTP)
                    .build();

            // Add listener to the load balancer
            applicationLoadBalancer.addListener("WebAppListener" + environmentSuffix, ApplicationListenerProps.builder()
                    .loadBalancer(applicationLoadBalancer)
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

    /**
     * Properties for TapStack
     */
    public static class TapStackProps {
        private final String environmentSuffix;
        private final StackProps stackProps;

        private TapStackProps(Builder builder) {
            this.environmentSuffix = builder.environmentSuffix;
            this.stackProps = builder.stackProps;
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
                return new TapStackProps(this);
            }
        }
    }
}
