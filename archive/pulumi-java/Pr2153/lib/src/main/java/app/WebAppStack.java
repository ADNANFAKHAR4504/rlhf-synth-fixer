package app;

import com.pulumi.Context;
import com.pulumi.Pulumi;
import com.pulumi.core.Output;
import com.pulumi.aws.AwsFunctions;
import com.pulumi.aws.ec2.Ec2Functions;
import com.pulumi.aws.inputs.GetAvailabilityZonesArgs;
import com.pulumi.aws.ec2.inputs.GetAmiArgs;
import com.pulumi.aws.ec2.inputs.GetAmiFilterArgs;
import com.pulumi.aws.ec2.Vpc;
import com.pulumi.aws.ec2.VpcArgs;
import com.pulumi.aws.ec2.InternetGateway;
import com.pulumi.aws.ec2.InternetGatewayArgs;
import com.pulumi.aws.ec2.Subnet;
import com.pulumi.aws.ec2.SubnetArgs;
import com.pulumi.aws.ec2.RouteTable;
import com.pulumi.aws.ec2.RouteTableArgs;
import com.pulumi.aws.ec2.RouteTableAssociation;
import com.pulumi.aws.ec2.RouteTableAssociationArgs;
import com.pulumi.aws.ec2.SecurityGroup;
import com.pulumi.aws.ec2.SecurityGroupArgs;
import com.pulumi.aws.ec2.LaunchTemplate;
import com.pulumi.aws.ec2.LaunchTemplateArgs;
import com.pulumi.aws.ec2.inputs.RouteTableRouteArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupIngressArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupEgressArgs;
import com.pulumi.aws.ec2.inputs.LaunchTemplateIamInstanceProfileArgs;
import com.pulumi.aws.ec2.inputs.LaunchTemplateTagSpecificationArgs;
import com.pulumi.aws.autoscaling.Group;
import com.pulumi.aws.autoscaling.GroupArgs;
import com.pulumi.aws.autoscaling.inputs.GroupLaunchTemplateArgs;
import com.pulumi.aws.autoscaling.inputs.GroupTagArgs;
import com.pulumi.aws.lb.LoadBalancer;
import com.pulumi.aws.lb.LoadBalancerArgs;
import com.pulumi.aws.lb.TargetGroup;
import com.pulumi.aws.lb.TargetGroupArgs;
import com.pulumi.aws.lb.Listener;
import com.pulumi.aws.lb.ListenerArgs;
import com.pulumi.aws.lb.inputs.TargetGroupHealthCheckArgs;
import com.pulumi.aws.lb.inputs.ListenerDefaultActionArgs;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.RolePolicy;
import com.pulumi.aws.iam.RolePolicyArgs;
import com.pulumi.aws.iam.InstanceProfile;
import com.pulumi.aws.iam.InstanceProfileArgs;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;

import java.util.Arrays;
import java.util.Map;
import java.util.List;

/**
 * Main infrastructure stack for web application deployment.
 * This class defines all AWS resources needed for a scalable web application.
 */
public final class WebAppStack {
    
    /**
     * Private constructor to prevent instantiation.
     */
    private WebAppStack() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }

    /**
     * Main entry point for the Pulumi program.
     * @param args command line arguments (not used)
     */
    public static void main(final String[] args) {
        Pulumi.run(WebAppStack::stack);
    }

    /**
     * Define the complete infrastructure stack.
     * @param ctx Pulumi execution context
     */
    public static void stack(final Context ctx) {
        String environmentSuffix = WebAppStackConfig.getEnvironmentSuffix();
        Map<String, String> tags = WebAppStackConfig.createTags(environmentSuffix);

        // Create networking resources
        NetworkResources network = createNetworkResources(environmentSuffix, tags);
        
        // Create security resources
        SecurityResources security = createSecurityResources(environmentSuffix, tags, network.vpc);
        
        // Create compute resources
        ComputeResources compute = createComputeResources(environmentSuffix, tags, network, security);
        
        // Create load balancer resources
        LoadBalancerResources loadBalancer = createLoadBalancerResources(environmentSuffix, tags, network, security);
        
        // Create auto scaling resources
        createAutoScalingResources(environmentSuffix, tags, network, security, compute, loadBalancer);
        
        // Create storage resources
        StorageResources storage = createStorageResources(environmentSuffix, tags);

        // Export stack outputs
        createStackOutputs(ctx, network, security, compute, loadBalancer, storage);
    }

    /**
     * Create networking resources (VPC, subnets, IGW, route tables).
     */
    private static NetworkResources createNetworkResources(final String environmentSuffix, 
                                                         final Map<String, String> tags) {
        // Create VPC
        var vpc = new Vpc(WebAppStackConfig.generateResourceName("webapp-vpc", environmentSuffix), 
            VpcArgs.builder()
                .cidrBlock(WebAppStackConfig.VPC_CIDR)
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .tags(tags)
                .build());

        // Create Internet Gateway
        var igw = new InternetGateway("webapp-igw-" + environmentSuffix, 
            InternetGatewayArgs.builder()
                .vpcId(vpc.id())
                .tags(tags)
                .build());

        // Get availability zones
        var azs = AwsFunctions.getAvailabilityZones(GetAvailabilityZonesArgs.builder()
            .state("available")
            .build());

        // Create public subnets
        var publicSubnet1 = new Subnet("webapp-public-subnet-1-" + environmentSuffix, 
            SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock(WebAppStackConfig.SUBNET1_CIDR)
                .availabilityZone(azs.applyValue(zones -> zones.names().get(0)))
                .mapPublicIpOnLaunch(true)
                .tags(tags)
                .build());

        var publicSubnet2 = new Subnet("webapp-public-subnet-2-" + environmentSuffix, 
            SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock(WebAppStackConfig.SUBNET2_CIDR)
                .availabilityZone(azs.applyValue(zones -> zones.names().get(1)))
                .mapPublicIpOnLaunch(true)
                .tags(tags)
                .build());

        // Create route table for public subnets
        var publicRouteTable = new RouteTable("webapp-public-rt-" + environmentSuffix, 
            RouteTableArgs.builder()
                .vpcId(vpc.id())
                .routes(RouteTableRouteArgs.builder()
                    .cidrBlock("0.0.0.0/0")
                    .gatewayId(igw.id())
                    .build())
                .tags(tags)
                .build());

        // Associate route table with public subnets
        new RouteTableAssociation("webapp-public-rt-assoc-1-" + environmentSuffix,
            RouteTableAssociationArgs.builder()
                .subnetId(publicSubnet1.id())
                .routeTableId(publicRouteTable.id())
                .build());

        new RouteTableAssociation("webapp-public-rt-assoc-2-" + environmentSuffix,
            RouteTableAssociationArgs.builder()
                .subnetId(publicSubnet2.id())
                .routeTableId(publicRouteTable.id())
                .build());

        return new NetworkResources(vpc, publicSubnet1, publicSubnet2, igw, publicRouteTable);
    }

    /**
     * Create security resources (security groups, IAM roles).
     */
    private static SecurityResources createSecurityResources(final String environmentSuffix,
                                                           final Map<String, String> tags,
                                                           final Vpc vpc) {
        // Create security group for ALB
        var albSecurityGroup = new SecurityGroup("webapp-alb-sg-" + environmentSuffix, 
            SecurityGroupArgs.builder()
                .vpcId(vpc.id())
                .description("Security group for Application Load Balancer")
                .ingress(
                    SecurityGroupIngressArgs.builder()
                        .protocol("tcp")
                        .fromPort(WebAppStackConfig.HTTP_PORT)
                        .toPort(WebAppStackConfig.HTTP_PORT)
                        .cidrBlocks("0.0.0.0/0")
                        .description("Allow HTTP from anywhere")
                        .build(),
                    SecurityGroupIngressArgs.builder()
                        .protocol("tcp")
                        .fromPort(WebAppStackConfig.HTTPS_PORT)
                        .toPort(WebAppStackConfig.HTTPS_PORT)
                        .cidrBlocks("0.0.0.0/0")
                        .description("Allow HTTPS from anywhere")
                        .build()
                )
                .egress(SecurityGroupEgressArgs.builder()
                    .protocol("-1")
                    .fromPort(0)
                    .toPort(0)
                    .cidrBlocks("0.0.0.0/0")
                    .description("Allow all outbound traffic")
                    .build())
                .tags(tags)
                .build());

        // Create security group for EC2 instances
        var instanceSecurityGroup = new SecurityGroup("webapp-instance-sg-" + environmentSuffix, 
            SecurityGroupArgs.builder()
                .vpcId(vpc.id())
                .description("Security group for EC2 instances")
                .ingress(
                    SecurityGroupIngressArgs.builder()
                        .protocol("tcp")
                        .fromPort(WebAppStackConfig.HTTP_PORT)
                        .toPort(WebAppStackConfig.HTTP_PORT)
                        .securityGroups(albSecurityGroup.id().applyValue(id -> List.of(id)))
                        .description("Allow HTTP from ALB")
                        .build(),
                    SecurityGroupIngressArgs.builder()
                        .protocol("tcp")
                        .fromPort(WebAppStackConfig.HTTPS_PORT)
                        .toPort(WebAppStackConfig.HTTPS_PORT)
                        .securityGroups(albSecurityGroup.id().applyValue(id -> List.of(id)))
                        .description("Allow HTTPS from ALB")
                        .build()
                )
                .egress(SecurityGroupEgressArgs.builder()
                    .protocol("-1")
                    .fromPort(0)
                    .toPort(0)
                    .cidrBlocks("0.0.0.0/0")
                    .description("Allow all outbound traffic")
                    .build())
                .tags(tags)
                .build());

        // Create IAM role for EC2 instances
        var instanceRole = new Role("webapp-instance-role-" + environmentSuffix, 
            RoleArgs.builder()
                .assumeRolePolicy(WebAppStackConfig.createAssumeRolePolicy())
                .tags(tags)
                .build());

        // Attach policy to allow S3 access
        new RolePolicy("webapp-s3-policy-" + environmentSuffix, 
            RolePolicyArgs.builder()
                .role(instanceRole.id())
                .policy(WebAppStackConfig.createS3AccessPolicy())
                .build());

        // Create instance profile
        var instanceProfile = new InstanceProfile("webapp-instance-profile-" + environmentSuffix,
            InstanceProfileArgs.builder()
                .role(instanceRole.name())
                .build());

        return new SecurityResources(albSecurityGroup, instanceSecurityGroup, instanceRole, instanceProfile);
    }

    /**
     * Create compute resources (AMI lookup, launch template).
     */
    private static ComputeResources createComputeResources(final String environmentSuffix,
                                                         final Map<String, String> tags,
                                                         final NetworkResources network,
                                                         final SecurityResources security) {
        // Get latest Amazon Linux 2 AMI
        var ami = Ec2Functions.getAmi(GetAmiArgs.builder()
            .mostRecent(true)
            .owners("amazon")
            .filters(
                GetAmiFilterArgs.builder()
                    .name("name")
                    .values("amzn2-ami-hvm-*-x86_64-gp2")
                    .build(),
                GetAmiFilterArgs.builder()
                    .name("virtualization-type")
                    .values("hvm")
                    .build()
            )
            .build());

        // Define bucket name early for user data
        final String bucketName = WebAppStackConfig.generateBucketName(environmentSuffix);
        
        // User data script to install web server
        String userData = WebAppStackConfig.createUserDataScript(bucketName);

        // Create launch template
        var launchTemplate = new LaunchTemplate("webapp-launch-template-" + environmentSuffix,
            LaunchTemplateArgs.builder()
                .namePrefix(WebAppStackConfig.generateLaunchTemplatePrefix(environmentSuffix))
                .imageId(ami.applyValue(a -> a.id()))
                .instanceType(WebAppStackConfig.INSTANCE_TYPE)
                .iamInstanceProfile(LaunchTemplateIamInstanceProfileArgs.builder()
                    .arn(security.instanceProfile.arn())
                    .build())
                .vpcSecurityGroupIds(security.instanceSecurityGroup.id().applyValue(id -> List.of(id)))
                .userData(java.util.Base64.getEncoder().encodeToString(userData.getBytes()))
                .tagSpecifications(LaunchTemplateTagSpecificationArgs.builder()
                    .resourceType("instance")
                    .tags(tags)
                    .build())
                .build());

        return new ComputeResources(ami, launchTemplate, userData, bucketName);
    }

    /**
     * Create load balancer resources (ALB, target group, listeners).
     */
    private static LoadBalancerResources createLoadBalancerResources(final String environmentSuffix,
                                                                   final Map<String, String> tags,
                                                                   final NetworkResources network,
                                                                   final SecurityResources security) {
        // Create Application Load Balancer
        var alb = new LoadBalancer("webapp-alb-" + environmentSuffix, 
            LoadBalancerArgs.builder()
                .loadBalancerType(WebAppStackConfig.LOAD_BALANCER_TYPE)
                .securityGroups(security.albSecurityGroup.id().applyValue(id -> List.of(id)))
                .subnets(Output.all(network.publicSubnet1.id(), network.publicSubnet2.id())
                    .applyValue(ids -> Arrays.asList(ids.toArray(new String[0]))))
                .enableDeletionProtection(false)
                .tags(tags)
                .build());

        // Create target group
        var targetGroup = new TargetGroup("webapp-tg-" + environmentSuffix, 
            TargetGroupArgs.builder()
                .port(80)
                .protocol("HTTP")
                .vpcId(network.vpc.id())
                .targetType("instance")
                .healthCheck(TargetGroupHealthCheckArgs.builder()
                    .enabled(true)
                    .interval(30)
                    .path("/")
                    .protocol("HTTP")
                    .timeout(5)
                    .healthyThreshold(2)
                    .unhealthyThreshold(2)
                    .build())
                .tags(tags)
                .build());

        // Create listener for HTTP
        var httpListener = new Listener("webapp-http-listener-" + environmentSuffix, 
            ListenerArgs.builder()
                .loadBalancerArn(alb.arn())
                .port(80)
                .protocol("HTTP")
                .defaultActions(ListenerDefaultActionArgs.builder()
                    .type("forward")
                    .targetGroupArn(targetGroup.arn())
                    .build())
                .build());

        // Create listener for HTTPS (using HTTP for now as we don't have a certificate)
        var httpsListener = new Listener("webapp-https-listener-" + environmentSuffix, 
            ListenerArgs.builder()
                .loadBalancerArn(alb.arn())
                .port(443)
                .protocol("HTTP")  // Using HTTP for port 443 as we don't have SSL certificate
                .defaultActions(ListenerDefaultActionArgs.builder()
                    .type("forward")
                    .targetGroupArn(targetGroup.arn())
                    .build())
                .build());

        return new LoadBalancerResources(alb, targetGroup, httpListener, httpsListener);
    }

    /**
     * Create auto scaling resources.
     */
    private static void createAutoScalingResources(final String environmentSuffix,
                                                  final Map<String, String> tags,
                                                  final NetworkResources network,
                                                  final SecurityResources security,
                                                  final ComputeResources compute,
                                                  final LoadBalancerResources loadBalancer) {
        // Create Auto Scaling Group
        new Group("webapp-asg-" + environmentSuffix, 
            GroupArgs.builder()
                .minSize(2)
                .maxSize(4)
                .desiredCapacity(2)
                .vpcZoneIdentifiers(Output.all(network.publicSubnet1.id(), network.publicSubnet2.id())
                    .applyValue(ids -> Arrays.asList(ids.toArray(new String[0]))))
                .targetGroupArns(loadBalancer.targetGroup.arn().applyValue(arn -> List.of(arn)))
                .launchTemplate(GroupLaunchTemplateArgs.builder()
                    .id(compute.launchTemplate.id())
                    .version("$Latest")
                    .build())
                .healthCheckType("ELB")
                .healthCheckGracePeriod(300)
                .tags(GroupTagArgs.builder()
                    .key("Environment")
                    .value("Production")
                    .propagateAtLaunch(true)
                    .build())
                .build());
    }

    /**
     * Create storage resources (S3 bucket).
     */
    private static StorageResources createStorageResources(final String environmentSuffix,
                                                         final Map<String, String> tags) {
        String bucketName = WebAppStackConfig.generateBucketName(environmentSuffix);
        
        // Create S3 bucket for application code
        var codeBucket = new Bucket(bucketName, 
            BucketArgs.builder()
                .bucket(bucketName)
                .acl("private")
                .tags(tags)
                .build());

        return new StorageResources(codeBucket, bucketName);
    }

    /**
     * Create stack outputs for integration with other systems.
     */
    private static void createStackOutputs(final Context ctx,
                                         final NetworkResources network,
                                         final SecurityResources security,
                                         final ComputeResources compute,
                                         final LoadBalancerResources loadBalancer,
                                         final StorageResources storage) {
        // Export the ALB DNS name and application URL
        ctx.export("loadBalancerDnsName", loadBalancer.alb.dnsName());
        ctx.export("applicationUrl", Output.format("http://%s", loadBalancer.alb.dnsName()));
        ctx.export("applicationUrlHttps", Output.format("http://%s:443", loadBalancer.alb.dnsName()));
        ctx.export("vpcId", network.vpc.id());
        ctx.export("publicSubnet1Id", network.publicSubnet1.id());
        ctx.export("publicSubnet2Id", network.publicSubnet2.id());
        ctx.export("autoScalingGroupName", Output.of("webapp-asg-" + WebAppStackConfig.getEnvironmentSuffix()));
        ctx.export("targetGroupArn", loadBalancer.targetGroup.arn());
        ctx.export("codeBucketName", storage.codeBucket.bucket());
    }

    /**
     * Network resources container.
     */
    private static final class NetworkResources {
        final Vpc vpc;
        final Subnet publicSubnet1;
        final Subnet publicSubnet2;
        final InternetGateway igw;
        final RouteTable publicRouteTable;

        NetworkResources(final Vpc vpc, final Subnet publicSubnet1, final Subnet publicSubnet2,
                        final InternetGateway igw, final RouteTable publicRouteTable) {
            this.vpc = vpc;
            this.publicSubnet1 = publicSubnet1;
            this.publicSubnet2 = publicSubnet2;
            this.igw = igw;
            this.publicRouteTable = publicRouteTable;
        }
    }

    /**
     * Security resources container.
     */
    private static final class SecurityResources {
        final SecurityGroup albSecurityGroup;
        final SecurityGroup instanceSecurityGroup;
        final Role instanceRole;
        final InstanceProfile instanceProfile;

        SecurityResources(final SecurityGroup albSecurityGroup, final SecurityGroup instanceSecurityGroup,
                         final Role instanceRole, final InstanceProfile instanceProfile) {
            this.albSecurityGroup = albSecurityGroup;
            this.instanceSecurityGroup = instanceSecurityGroup;
            this.instanceRole = instanceRole;
            this.instanceProfile = instanceProfile;
        }
    }

    /**
     * Compute resources container.
     */
    private static final class ComputeResources {
        final Output<?> ami;
        final LaunchTemplate launchTemplate;
        final String userData;
        final String bucketName;

        ComputeResources(final Output<?> ami,
                        final LaunchTemplate launchTemplate,
                        final String userData,
                        final String bucketName) {
            this.ami = ami;
            this.launchTemplate = launchTemplate;
            this.userData = userData;
            this.bucketName = bucketName;
        }
    }

    /**
     * Load balancer resources container.
     */
    private static final class LoadBalancerResources {
        final LoadBalancer alb;
        final TargetGroup targetGroup;
        final Listener httpListener;
        final Listener httpsListener;

        LoadBalancerResources(final LoadBalancer alb, final TargetGroup targetGroup,
                             final Listener httpListener, final Listener httpsListener) {
            this.alb = alb;
            this.targetGroup = targetGroup;
            this.httpListener = httpListener;
            this.httpsListener = httpsListener;
        }
    }

    /**
     * Storage resources container.
     */
    private static final class StorageResources {
        final Bucket codeBucket;
        final String bucketName;

        StorageResources(final Bucket codeBucket, final String bucketName) {
            this.codeBucket = codeBucket;
            this.bucketName = bucketName;
        }
    }
}