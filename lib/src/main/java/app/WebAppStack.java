package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.autoscaling.*;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.targets.InstanceTarget;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.amazon.awscdk.services.xray.CfnSamplingRule;
import software.amazon.awscdk.services.rum.CfnAppMonitor;
import software.amazon.awscdk.services.cloudwatch.Dashboard;
import software.amazon.awscdk.services.cloudwatch.GraphWidget;
import software.amazon.awscdk.services.cloudwatch.Metric;
import software.amazon.awscdk.services.cloudwatch.Unit;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * WebAppStackProps holds configuration for the WebAppStack.
 */
class WebAppStackProps {
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

/**
 * WebAppStack creates the multi-region web application infrastructure.
 * This includes VPC, Auto Scaling Groups, Application Load Balancer, and security groups.
 */
public class WebAppStack extends Stack {
    private final String environmentSuffix;
    private final ApplicationLoadBalancer loadBalancer;
    private final Vpc vpc;
    private final CfnAppMonitor rumAppMonitor;
    private final CfnSamplingRule xraySamplingRule;

    public WebAppStack(final Construct scope, final String id, final WebAppStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        this.environmentSuffix = Optional.ofNullable(props)
                .map(WebAppStackProps::getEnvironmentSuffix)
                .orElse("dev");

        // Create VPC with public and private subnets across multiple AZs
        this.vpc = createVpc();
        
        // Create security groups
        SecurityGroup albSecurityGroup = createAlbSecurityGroup();
        SecurityGroup instanceSecurityGroup = createInstanceSecurityGroup(albSecurityGroup);
        
        // Create Application Load Balancer
        this.loadBalancer = createApplicationLoadBalancer(albSecurityGroup);
        
        // Create IAM role for EC2 instances
        Role instanceRole = createInstanceRole();
        
        // Create Launch Template
        LaunchTemplate launchTemplate = createLaunchTemplate(instanceRole, instanceSecurityGroup);
        
        // Create Auto Scaling Group
        AutoScalingGroup autoScalingGroup = createAutoScalingGroup(launchTemplate);
        
        // Create target group and listener (must be done before scaling policies)
        configureLoadBalancer(autoScalingGroup);
        
        // Configure Auto Scaling policies with latest features
        configureAutoScalingPolicies(autoScalingGroup);
        
        // Configure AWS X-Ray tracing
        this.xraySamplingRule = configureXRayTracing();
        
        // Configure CloudWatch RUM monitoring
        this.rumAppMonitor = configureRealUserMonitoring();
        
        // Create monitoring dashboard
        createMonitoringDashboard();
    }

    private Vpc createVpc() {
        return Vpc.Builder.create(this, "WebAppVpc" + environmentSuffix)
                .maxAzs(3)
                .natGateways(2) // For high availability
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
                                .build()
                ))
                .build();
    }

    private SecurityGroup createAlbSecurityGroup() {
        SecurityGroup sg = SecurityGroup.Builder.create(this, "AlbSecurityGroup" + environmentSuffix)
                .vpc(vpc)
                .description("Security group for Application Load Balancer")
                .allowAllOutbound(true)
                .build();

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

        sg.addIngressRule(Peer.securityGroupId(albSecurityGroup.getSecurityGroupId()), 
                         Port.tcp(80), "Allow HTTP from ALB");

        return sg;
    }

    private ApplicationLoadBalancer createApplicationLoadBalancer(SecurityGroup securityGroup) {
        // Include region in the name to ensure uniqueness across regions
        // Get the actual deployment region, not the stack's region
        String region = Stack.of(this).getRegion();
        String loadBalancerName;
        
        // In production deployment paths we need region-specific naming
        if (this.getNode().getPath().contains("TapStackSecondary")) {
            region = "us-west-2"; // Hardcode region for secondary stack
            loadBalancerName = "WebAppALB-uswe-" + environmentSuffix;
        } else if (this.getNode().getPath().contains("TapStackPrimary")) {
            region = "us-east-1"; // Hardcode region for primary stack
            loadBalancerName = "WebAppALB-usea-" + environmentSuffix;
        } else {
            // For tests and other scenarios, just use the environment suffix without a region code
            // This avoids token evaluation issues in test environments
            loadBalancerName = "WebAppALB-" + environmentSuffix;
        }
        
        return ApplicationLoadBalancer.Builder.create(this, "WebAppALB" + environmentSuffix)
                .vpc(vpc)
                .loadBalancerName(loadBalancerName)
                .internetFacing(true)
                .securityGroup(securityGroup)
                .vpcSubnets(SubnetSelection.builder()
                           .subnetType(SubnetType.PUBLIC)
                           .build())
                .build();
    }

    private Role createInstanceRole() {
        return Role.Builder.create(this, "InstanceRole" + environmentSuffix)
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy"),
                        ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
                        ManagedPolicy.fromAwsManagedPolicyName("AWSXRayDaemonWriteAccess")
                ))
                .build();
    }

    private LaunchTemplate createLaunchTemplate(Role instanceRole, SecurityGroup securityGroup) {
        // Create instance profile
        CfnInstanceProfile instanceProfile = CfnInstanceProfile.Builder.create(this, "InstanceProfile" + environmentSuffix)
                .roles(Collections.singletonList(instanceRole.getRoleName()))
                .build();

        // User data script for web server with X-Ray daemon and RUM integration
        String userData = "#!/bin/bash\n" +
                "yum update -y\n" +
                "yum install -y httpd\n" +
                "systemctl start httpd\n" +
                "systemctl enable httpd\n" +
                "# Install X-Ray daemon\n" +
                "curl https://s3.us-east-2.amazonaws.com/aws-xray-assets.us-east-2/xray-daemon/aws-xray-daemon-3.x.rpm -o /tmp/xray.rpm\n" +
                "yum install -y /tmp/xray.rpm\n" +
                "systemctl start xray\n" +
                "systemctl enable xray\n" +
                "# Create enhanced index.html with RUM integration\n" +
                "REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)\n" +
                "INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)\n" +
                "AZ=$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)\n" +
                "cat > /var/www/html/index.html << 'EOF'\n" +
                "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <title>Multi-Region Web App</title>\n" +
                "    <script>\n" +
                "        (function(n,i,v,r,s,c,x,z){x=window.AwsRumClient={q:[],n:n,i:i,v:v,r:r,c:c};window[n]=function(c,p){x.q.push({c:c,p:p});};z=document.createElement('script');z.async=true;z.src=s;document.head.appendChild(z);})(\n" +
                "            'cwr',\n" +
                "            '" + this.getAccount() + "',\n" +
                "            '1.0.0',\n" +
                "            '" + this.getRegion() + "',\n" +
                "            'https://client.rum.us-east-1.amazonaws.com/1.x/js/cwr.js',\n" +
                "            {\n" +
                "                sessionSampleRate: 1,\n" +
                "                identityPoolId: '',\n" +
                "                endpoint: 'https://dataplane.rum." + this.getRegion() + ".amazonaws.com',\n" +
                "                telemetries: ['performance','errors','http'],\n" +
                "                allowCookies: true,\n" +
                "                enableXRay: true\n" +
                "            }\n" +
                "        );\n" +
                "    </script>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <h1>Web Application - Region: $REGION</h1>\n" +
                "    <p>Instance ID: $INSTANCE_ID</p>\n" +
                "    <p>Availability Zone: $AZ</p>\n" +
                "    <button onclick='testPerformance()'>Test Performance</button>\n" +
                "    <script>\n" +
                "        function testPerformance() {\n" +
                "            cwr('recordPageView', {pageId: 'performance-test'});\n" +
                "            fetch('/health')\n" +
                "                .then(response => response.text())\n" +
                "                .catch(error => cwr('recordError', {message: error.message}));\n" +
                "        }\n" +
                "        window.addEventListener('load', function() {\n" +
                "            cwr('recordPageView', {pageId: 'home'});\n" +
                "        });\n" +
                "    </script>\n" +
                "</body>\n" +
                "</html>\n" +
                "EOF\n" +
                "# Install CloudWatch agent\n" +
                "wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm\n" +
                "rpm -U ./amazon-cloudwatch-agent.rpm\n";

        return LaunchTemplate.Builder.create(this, "LaunchTemplate" + environmentSuffix)
                .machineImage(MachineImage.latestAmazonLinux2())
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                .securityGroup(securityGroup)
                .userData(UserData.forLinux())
                .role(instanceRole)
                .build();
    }

    private AutoScalingGroup createAutoScalingGroup(LaunchTemplate launchTemplate) {
        return AutoScalingGroup.Builder.create(this, "WebAppASG" + environmentSuffix)
                .vpc(vpc)
                .launchTemplate(launchTemplate)
                .minCapacity(2)
                .maxCapacity(10)
                .desiredCapacity(2)
                .vpcSubnets(SubnetSelection.builder()
                           .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                           .build())
                .healthCheck(software.amazon.awscdk.services.autoscaling.HealthCheck.elb(ElbHealthCheckOptions.builder()
                        .grace(software.amazon.awscdk.Duration.minutes(5))
                        .build()))
                .build();
    }

    private void configureAutoScalingPolicies(AutoScalingGroup autoScalingGroup) {
        // Target Tracking Scaling Policy using latest AWS features
        // High resolution metrics for faster scaling response
        autoScalingGroup.scaleOnCpuUtilization("CpuScaling" + environmentSuffix, 
                CpuUtilizationScalingProps.builder()
                        .targetUtilizationPercent(70.0)
                        .cooldown(software.amazon.awscdk.Duration.minutes(2))
                        .build());

        // Request count per target scaling
        autoScalingGroup.scaleOnRequestCount("RequestScaling" + environmentSuffix,
                RequestCountScalingProps.builder()
                        .targetRequestsPerMinute(1000)
                        .build());
    }

    private void configureLoadBalancer(AutoScalingGroup autoScalingGroup) {
        // Create target group with health checks
        // Include region in the target group name to ensure uniqueness across regions
        String targetGroupId;
        if (this.getNode().getPath().contains("TapStackSecondary")) {
            targetGroupId = "WebAppTargetGroup-uswe-" + environmentSuffix;
        } else if (this.getNode().getPath().contains("TapStackPrimary")) {
            targetGroupId = "WebAppTargetGroup-usea-" + environmentSuffix;
        } else {
            // For tests and other scenarios, just use the environment suffix without a region code
            targetGroupId = "WebAppTargetGroup" + environmentSuffix;
        }
        
        ApplicationTargetGroup targetGroup = ApplicationTargetGroup.Builder.create(this, targetGroupId)
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .vpc(vpc)
                .targetType(TargetType.INSTANCE)
                .healthCheck(software.amazon.awscdk.services.elasticloadbalancingv2.HealthCheck.builder()
                        .path("/")
                        .interval(software.amazon.awscdk.Duration.seconds(30))
                        .timeout(software.amazon.awscdk.Duration.seconds(5))
                        .healthyThresholdCount(2)
                        .unhealthyThresholdCount(5)
                        .build())
                .build();

        // Add Auto Scaling Group to target group
        autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

        // Create listener
        loadBalancer.addListener("HttpListener" + environmentSuffix,
                BaseApplicationListenerProps.builder()
                        .port(80)
                        .protocol(ApplicationProtocol.HTTP)
                        .defaultTargetGroups(Collections.singletonList(targetGroup))
                        .build());
    }

    // Getters for cross-stack references
    public ApplicationLoadBalancer getLoadBalancer() {
        return loadBalancer;
    }

    public Vpc getVpc() {
        return vpc;
    }

    private CfnSamplingRule configureXRayTracing() {
        // Include region in the name to ensure uniqueness across regions
        // Get the actual deployment region, not the stack's region
        String region = Stack.of(this).getRegion();
        
        // For the secondary stack in us-west-2, ensure we use "us-west-2" in the name
        // Use shortened region codes to stay within the 32-character name limit
        String regionCode;
        if (this.getNode().getPath().contains("TapStackSecondary")) {
            region = "us-west-2"; // Hardcode region for secondary stack
            regionCode = "usw2"; // Short code for us-west-2
        } else if (this.getNode().getPath().contains("TapStackPrimary")) {
            region = "us-east-1"; // Hardcode region for primary stack
            regionCode = "use1"; // Short code for us-east-1
        } else {
            // Default case - create short code from region
            regionCode = region.replaceAll("-", "").substring(0, Math.min(region.length(), 4));
        }
        
        // Configure X-Ray sampling rule with proper properties structure and shorter region code
        // AWS X-Ray has a 32 character limit for rule names
        CfnSamplingRule.SamplingRuleProperty samplingRule = CfnSamplingRule.SamplingRuleProperty.builder()
                .ruleName("XRaySR-" + regionCode + "-" + environmentSuffix)
                .priority(9000)
                .fixedRate(0.1)
                .reservoirSize(1)
                .serviceName("webapp-" + environmentSuffix)
                .serviceType("*")
                .host("*")
                .httpMethod("*")
                .urlPath("*")
                .version(1)
                .resourceArn("*")  // Required field for X-Ray sampling rule
                .build();
                
        return CfnSamplingRule.Builder.create(this, "XRaySamplingRule" + environmentSuffix)
                .samplingRule(samplingRule)
                .build();
    }

    private CfnAppMonitor configureRealUserMonitoring() {
        // Include region in the name to ensure uniqueness across regions
        // Get the actual deployment region, not the stack's region
        String region = Stack.of(this).getRegion();
        
        // For the secondary stack in us-west-2, ensure we use "us-west-2" in the name
        if (this.getNode().getPath().contains("TapStackSecondary")) {
            region = "us-west-2"; // Hardcode region for secondary stack
        } else if (this.getNode().getPath().contains("TapStackPrimary")) {
            region = "us-east-1"; // Hardcode region for primary stack
        }
        
        return CfnAppMonitor.Builder.create(this, "RUMAppMonitor" + environmentSuffix)
                .name("webapp-rum-" + region + "-" + environmentSuffix)
                .domain("myapp-" + environmentSuffix + "-primary-1.example.org")
                .appMonitorConfiguration(CfnAppMonitor.AppMonitorConfigurationProperty.builder()
                        .allowCookies(true)
                        .enableXRay(true)
                        .sessionSampleRate(1.0)
                        .telemetries(Arrays.asList("errors", "performance", "http"))
                        .build())
                .build();
    }

    private void createMonitoringDashboard() {
        // Determine appropriate dashboard name based on stack path
        String dashboardName;
        String region = Stack.of(this).getRegion();
        
        // For the secondary stack in us-west-2, ensure we use "us-west-2" in the name
        if (this.getNode().getPath().contains("TapStackSecondary")) {
            region = "us-west-2"; // Hardcode region for secondary stack
            dashboardName = "WebApp-" + environmentSuffix + "-" + region;
        } else if (this.getNode().getPath().contains("TapStackPrimary")) {
            region = "us-east-1"; // Hardcode region for primary stack
            // Add suffix '-primary-a' for the primary stack to ensure uniqueness
            dashboardName = "WebApp-" + environmentSuffix + "-" + region + "-primary-a";
        } else {
            // For tests or other environments
            dashboardName = "WebApp-" + environmentSuffix + "-" + this.getRegion();
        }
        
        Dashboard dashboard = Dashboard.Builder.create(this, "MonitoringDashboard" + environmentSuffix)
                .dashboardName(dashboardName)
                .build();

        // X-Ray service map widget
        dashboard.addWidgets(
                GraphWidget.Builder.create()
                        .title("X-Ray Traces")
                        .left(Arrays.asList(
                                Metric.Builder.create()
                                        .namespace("AWS/X-Ray")
                                        .metricName("TracesReceived")
                                        .dimensionsMap(java.util.Map.of("ServiceName", "webapp-" + environmentSuffix))
                                        .build(),
                                Metric.Builder.create()
                                        .namespace("AWS/X-Ray")
                                        .metricName("LatencyHigh")
                                        .dimensionsMap(java.util.Map.of("ServiceName", "webapp-" + environmentSuffix))
                                        .unit(Unit.SECONDS)
                                        .build()
                        ))
                        .width(12)
                        .height(6)
                        .build()
        );

        // RUM metrics widget
        // For the secondary stack in us-west-2, ensure we use "us-west-2" in the name
        // We already set the region above, so no need to do it again
        
        String rumAppName = "webapp-rum-" + region + "-" + environmentSuffix;
        dashboard.addWidgets(
                GraphWidget.Builder.create()
                        .title("Real User Monitoring")
                        .left(Arrays.asList(
                                Metric.Builder.create()
                                        .namespace("AWS/RUM")
                                        .metricName("PageViewCount")
                                        .dimensionsMap(java.util.Map.of("application_name", rumAppName))
                                        .build(),
                                Metric.Builder.create()
                                        .namespace("AWS/RUM")
                                        .metricName("JsErrorCount")
                                        .dimensionsMap(java.util.Map.of("application_name", rumAppName))
                                        .build()
                        ))
                        .right(Arrays.asList(
                                Metric.Builder.create()
                                        .namespace("AWS/RUM")
                                        .metricName("PageLoadTime")
                                        .dimensionsMap(java.util.Map.of("application_name", rumAppName))
                                        .unit(Unit.MILLISECONDS)
                                        .build()
                        ))
                        .width(12)
                        .height(6)
                        .build()
        );

        // ALB metrics widget
        dashboard.addWidgets(
                GraphWidget.Builder.create()
                        .title("Application Load Balancer")
                        .left(Arrays.asList(
                                Metric.Builder.create()
                                        .namespace("AWS/ApplicationELB")
                                        .metricName("RequestCount")
                                        .dimensionsMap(java.util.Map.of("LoadBalancer", loadBalancer.getLoadBalancerFullName()))
                                        .build(),
                                Metric.Builder.create()
                                        .namespace("AWS/ApplicationELB")
                                        .metricName("TargetResponseTime")
                                        .dimensionsMap(java.util.Map.of("LoadBalancer", loadBalancer.getLoadBalancerFullName()))
                                        .unit(Unit.SECONDS)
                                        .build()
                        ))
                        .width(12)
                        .height(6)
                        .build()
        );
    }

    public CfnAppMonitor getRumAppMonitor() {
        return rumAppMonitor;
    }

    public CfnSamplingRule getXraySamplingRule() {
        return xraySamplingRule;
    }
}