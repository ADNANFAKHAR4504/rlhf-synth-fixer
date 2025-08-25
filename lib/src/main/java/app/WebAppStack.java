package com.pulumi;

import com.pulumi.Context;
import com.pulumi.Pulumi;
import com.pulumi.core.Output;
import com.pulumi.aws.AwsFunctions;
import com.pulumi.aws.ec2.Ec2Functions;
import com.pulumi.aws.inputs.GetAvailabilityZonesArgs;
import com.pulumi.aws.ec2.inputs.GetAmiArgs;
import com.pulumi.aws.ec2.inputs.GetAmiFilterArgs;
import com.pulumi.aws.ec2.*;
import com.pulumi.aws.ec2.inputs.*;
import com.pulumi.aws.autoscaling.Group;
import com.pulumi.aws.autoscaling.GroupArgs;
import com.pulumi.aws.autoscaling.inputs.*;
import com.pulumi.aws.lb.*;
import com.pulumi.aws.lb.inputs.*;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.RolePolicy;
import com.pulumi.aws.iam.RolePolicyArgs;
import com.pulumi.aws.iam.InstanceProfile;
import com.pulumi.aws.iam.InstanceProfileArgs;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;
import com.pulumi.aws.s3.BucketObject;
import com.pulumi.aws.s3.BucketObjectArgs;

import java.util.Arrays;
import java.util.Map;
import java.util.List;

public class WebAppStack {
    public static void main(String[] args) {
        Pulumi.run(WebAppStack::stack);
    }

    public static void stack(Context ctx) {
        // Get environment suffix from environment variable
        String environmentSuffix = WebAppStackConfig.getEnvironmentSuffix();
        
        // Define tags for all resources
        Map<String, String> tags = WebAppStackConfig.createTags(environmentSuffix);

        // Create VPC
        var vpc = new Vpc(WebAppStackConfig.generateResourceName("webapp-vpc", environmentSuffix), VpcArgs.builder()
            .cidrBlock(WebAppStackConfig.VPC_CIDR)
            .enableDnsHostnames(true)
            .enableDnsSupport(true)
            .tags(tags)
            .build());

        // Create Internet Gateway
        var igw = new InternetGateway("webapp-igw-" + environmentSuffix, InternetGatewayArgs.builder()
            .vpcId(vpc.id())
            .tags(tags)
            .build());

        // Get availability zones
        var azs = AwsFunctions.getAvailabilityZones(GetAvailabilityZonesArgs.builder()
            .state("available")
            .build());

        // Create public subnets
        var publicSubnet1 = new Subnet("webapp-public-subnet-1-" + environmentSuffix, SubnetArgs.builder()
            .vpcId(vpc.id())
            .cidrBlock(WebAppStackConfig.SUBNET1_CIDR)
            .availabilityZone(azs.applyValue(zones -> zones.names().get(0)))
            .mapPublicIpOnLaunch(true)
            .tags(tags)
            .build());

        var publicSubnet2 = new Subnet("webapp-public-subnet-2-" + environmentSuffix, SubnetArgs.builder()
            .vpcId(vpc.id())
            .cidrBlock(WebAppStackConfig.SUBNET2_CIDR)
            .availabilityZone(azs.applyValue(zones -> zones.names().get(1)))
            .mapPublicIpOnLaunch(true)
            .tags(tags)
            .build());

        // Create route table for public subnets
        var publicRouteTable = new RouteTable("webapp-public-rt-" + environmentSuffix, RouteTableArgs.builder()
            .vpcId(vpc.id())
            .routes(RouteTableRouteArgs.builder()
                .cidrBlock("0.0.0.0/0")
                .gatewayId(igw.id())
                .build())
            .tags(tags)
            .build());

        // Associate route table with public subnets
        var publicRtAssoc1 = new RouteTableAssociation("webapp-public-rt-assoc-1-" + environmentSuffix,
            RouteTableAssociationArgs.builder()
                .subnetId(publicSubnet1.id())
                .routeTableId(publicRouteTable.id())
                .build());

        var publicRtAssoc2 = new RouteTableAssociation("webapp-public-rt-assoc-2-" + environmentSuffix,
            RouteTableAssociationArgs.builder()
                .subnetId(publicSubnet2.id())
                .routeTableId(publicRouteTable.id())
                .build());

        // Create security group for ALB
        var albSecurityGroup = new SecurityGroup("webapp-alb-sg-" + environmentSuffix, SecurityGroupArgs.builder()
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
        var instanceSecurityGroup = new SecurityGroup("webapp-instance-sg-" + environmentSuffix, SecurityGroupArgs.builder()
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
        var instanceRole = new Role("webapp-instance-role-" + environmentSuffix, RoleArgs.builder()
            .assumeRolePolicy("{" +
                "\"Version\": \"2012-10-17\"," +
                "\"Statement\": [{" +
                    "\"Action\": \"sts:AssumeRole\"," +
                    "\"Principal\": {" +
                        "\"Service\": \"ec2.amazonaws.com\"" +
                    "}," +
                    "\"Effect\": \"Allow\"" +
                "}]" +
            "}")
            .tags(tags)
            .build());

        // Attach policy to allow S3 access
        var s3Policy = new RolePolicy("webapp-s3-policy-" + environmentSuffix, RolePolicyArgs.builder()
            .role(instanceRole.id())
            .policy("{" +
                "\"Version\": \"2012-10-17\"," +
                "\"Statement\": [{" +
                    "\"Effect\": \"Allow\"," +
                    "\"Action\": [" +
                        "\"s3:GetObject\"," +
                        "\"s3:ListBucket\"" +
                    "]," +
                    "\"Resource\": \"*\"" +
                "}]" +
            "}")
            .build());

        // Create instance profile
        var instanceProfile = new InstanceProfile("webapp-instance-profile-" + environmentSuffix,
            InstanceProfileArgs.builder()
                .role(instanceRole.name())
                .build());

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
        final String bucketName = "webapp-code-bucket-" + environmentSuffix.toLowerCase();
        
        // User data script to install web server
        String userData = "#!/bin/bash\n" +
            "yum update -y\n" +
            "yum install -y httpd\n" +
            "systemctl start httpd\n" +
            "systemctl enable httpd\n" +
            "\n" +
            "# Create a simple HTML page\n" +
            "cat > /var/www/html/index.html <<EOF\n" +
            "<!DOCTYPE html>\n" +
            "<html>\n" +
            "<head>\n" +
            "    <title>Web Application</title>\n" +
            "</head>\n" +
            "<body>\n" +
            "    <h1>Welcome to the Web Application</h1>\n" +
            "    <p>Instance ID: $(ec2-metadata --instance-id | cut -d \" \" -f 2)</p>\n" +
            "    <p>Availability Zone: $(ec2-metadata --availability-zone | cut -d \" \" -f 2)</p>\n" +
            "</body>\n" +
            "</html>\n" +
            "EOF\n" +
            "\n" +
            "# Download application code from S3 if available\n" +
            "aws s3 cp s3://" + bucketName + "/app.tar.gz /tmp/app.tar.gz 2>/dev/null || true\n" +
            "if [ -f /tmp/app.tar.gz ]; then\n" +
            "    tar -xzf /tmp/app.tar.gz -C /var/www/html/\n" +
            "fi\n";

        // Create launch template
        var launchTemplate = new LaunchTemplate("webapp-launch-template-" + environmentSuffix,
            LaunchTemplateArgs.builder()
                .namePrefix("webapp-" + environmentSuffix + "-")
                .imageId(ami.applyValue(a -> a.id()))
                .instanceType(WebAppStackConfig.INSTANCE_TYPE)
                .iamInstanceProfile(LaunchTemplateIamInstanceProfileArgs.builder()
                    .arn(instanceProfile.arn())
                    .build())
                .vpcSecurityGroupIds(instanceSecurityGroup.id().applyValue(id -> List.of(id)))
                .userData(java.util.Base64.getEncoder().encodeToString(userData.getBytes()))
                .tagSpecifications(LaunchTemplateTagSpecificationArgs.builder()
                    .resourceType("instance")
                    .tags(tags)
                    .build())
                .build());

        // Create Application Load Balancer
        var alb = new LoadBalancer("webapp-alb-" + environmentSuffix, LoadBalancerArgs.builder()
            .loadBalancerType(WebAppStackConfig.LOAD_BALANCER_TYPE)
            .securityGroups(albSecurityGroup.id().applyValue(id -> List.of(id)))
            .subnets(Output.all(publicSubnet1.id(), publicSubnet2.id()).applyValue(ids -> Arrays.asList(ids.toArray(new String[0]))))
            .enableDeletionProtection(false)
            .tags(tags)
            .build());

        // Create target group
        var targetGroup = new TargetGroup("webapp-tg-" + environmentSuffix, TargetGroupArgs.builder()
            .port(80)
            .protocol("HTTP")
            .vpcId(vpc.id())
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
        var httpListener = new Listener("webapp-http-listener-" + environmentSuffix, ListenerArgs.builder()
            .loadBalancerArn(alb.arn())
            .port(80)
            .protocol("HTTP")
            .defaultActions(ListenerDefaultActionArgs.builder()
                .type("forward")
                .targetGroupArn(targetGroup.arn())
                .build())
            .build());

        // Create listener for HTTPS (using HTTP for now as we don't have a certificate)
        var httpsListener = new Listener("webapp-https-listener-" + environmentSuffix, ListenerArgs.builder()
            .loadBalancerArn(alb.arn())
            .port(443)
            .protocol("HTTP")  // Using HTTP for port 443 as we don't have SSL certificate
            .defaultActions(ListenerDefaultActionArgs.builder()
                .type("forward")
                .targetGroupArn(targetGroup.arn())
                .build())
            .build());

        // Create Auto Scaling Group
        var asg = new Group("webapp-asg-" + environmentSuffix, GroupArgs.builder()
            .minSize(2)
            .maxSize(4)
            .desiredCapacity(2)
            .vpcZoneIdentifiers(Output.all(publicSubnet1.id(), publicSubnet2.id()).applyValue(ids -> Arrays.asList(ids.toArray(new String[0]))))
            .targetGroupArns(targetGroup.arn().applyValue(arn -> List.of(arn)))
            .launchTemplate(GroupLaunchTemplateArgs.builder()
                .id(launchTemplate.id())
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

        // Create S3 bucket for application code
        var codeBucket = new Bucket(bucketName, BucketArgs.builder()
            .bucket(bucketName)
            .acl("private")
            .tags(tags)
            .build());

        // Export the ALB DNS name and application URL
        ctx.export("loadBalancerDnsName", alb.dnsName());
        ctx.export("applicationUrl", Output.format("http://%s", alb.dnsName()));
        ctx.export("applicationUrlHttps", Output.format("http://%s:443", alb.dnsName()));
        ctx.export("vpcId", vpc.id());
        ctx.export("publicSubnet1Id", publicSubnet1.id());
        ctx.export("publicSubnet2Id", publicSubnet2.id());
        ctx.export("autoScalingGroupName", asg.name());
        ctx.export("targetGroupArn", targetGroup.arn());
        ctx.export("codeBucketName", codeBucket.bucket());
    }
}