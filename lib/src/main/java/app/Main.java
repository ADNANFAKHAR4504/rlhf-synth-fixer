

import com.pulumi.Context;

import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;


package app;

import com.pulumi.Pulumi;
import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
import com.pulumi.aws.ec2.*;
import com.pulumi.aws.ec2.inputs.SecurityGroupIngressArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupEgressArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.CustomResourceOptions;

import java.util.List;
import java.util.Map;


/**
 * Main class for Java Pulumi infrastructure as code.
 * 
 * This class demonstrates how to create AWS infrastructure using Pulumi's Java SDK.
 * It creates a simple S3 bucket as an example.
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
     * Main entry point for the Pulumi program.
     * 
     * This method defines the infrastructure resources to be created.
     * Pulumi will execute this code to determine what resources to create,
     * update, or delete based on the current state.
     * 
     * @param args Command line arguments (not used in this example)
     */
    public static void main(String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }

    /**
     * Defines the infrastructure resources to be created.
     * 
     * This method is separated from main() to make it easier to test
     * and to follow best practices for Pulumi Java programs.
     * 
     * @param ctx The Pulumi context for exporting outputs
     */
    static void defineInfrastructure(Context ctx) {

        var config = ctx.config();
        var authorizedSshIp = config.require("authorizedSshIp");
        
        // Set up AWS provider for us-west-2 region
        var awsProvider = new Provider("aws-provider", ProviderArgs.builder()
            .region("us-west-2")
            .build());
        
        var providerOptions = CustomResourceOptions.builder()
            .provider(awsProvider)
            .build();
        
        // Create VPC
        var vpc = new Vpc("scalable-web-vpc", VpcArgs.builder()
            .cidrBlock("10.0.0.0/16")
            .enableDnsHostnames(true)
            .enableDnsSupport(true)
            .tags(Map.of(
                "Name", "scalable-web-vpc",
                "Environment", "production"
            ))
            .build(), providerOptions);
        
        // Use hardcoded availability zones for us-west-2
        String az1 = "us-west-2a";
        String az2 = "us-west-2b";
        
        // Create Internet Gateway
        var internetGateway = new InternetGateway("scalable-web-igw", 
            InternetGatewayArgs.builder()
                .vpcId(vpc.id())
                .tags(Map.of("Name", "scalable-web-igw"))
                .build(), providerOptions);
        
        // Create public subnets in different AZs
        var publicSubnet1 = new Subnet("public-subnet-1", SubnetArgs.builder()
            .vpcId(vpc.id())
            .cidrBlock("10.0.1.0/24")
            .availabilityZone(az1)
            .mapPublicIpOnLaunch(true)
            .tags(Map.of(
                "Name", "public-subnet-1",
                "Type", "public"
            ))
            .build(), providerOptions);
        
        var publicSubnet2 = new Subnet("public-subnet-2", SubnetArgs.builder()
            .vpcId(vpc.id())
            .cidrBlock("10.0.2.0/24")
            .availabilityZone(az2)
            .mapPublicIpOnLaunch(true)
            .tags(Map.of(
                "Name", "public-subnet-2",
                "Type", "public"
            ))
            .build(), providerOptions);
        
        // Create private subnets in different AZs
        var privateSubnet1 = new Subnet("private-subnet-1", SubnetArgs.builder()
            .vpcId(vpc.id())
            .cidrBlock("10.0.3.0/24")
            .availabilityZone(az1)
            .tags(Map.of(
                "Name", "private-subnet-1",
                "Type", "private"
            ))
            .build(), providerOptions);
        
        var privateSubnet2 = new Subnet("private-subnet-2", SubnetArgs.builder()
            .vpcId(vpc.id())
            .cidrBlock("10.0.4.0/24")
            .availabilityZone(az2)
            .tags(Map.of(
                "Name", "private-subnet-2",
                "Type", "private"
            ))
            .build(), providerOptions);
        
        // Create public route table
        var publicRouteTable = new RouteTable("public-route-table", 
            RouteTableArgs.builder()
                .vpcId(vpc.id())
                .tags(Map.of("Name", "public-route-table"))
                .build(), providerOptions);
        
        // Create route to Internet Gateway for public subnets
        var publicRoute = new Route("public-route", RouteArgs.builder()
            .routeTableId(publicRouteTable.id())
            .destinationCidrBlock("0.0.0.0/0")
            .gatewayId(internetGateway.id())
            .build(), providerOptions);
        
        // Associate public subnets with public route table
        var publicSubnet1Association = new RouteTableAssociation("public-subnet-1-association",
            RouteTableAssociationArgs.builder()
                .subnetId(publicSubnet1.id())
                .routeTableId(publicRouteTable.id())
                .build(), providerOptions);
        
        var publicSubnet2Association = new RouteTableAssociation("public-subnet-2-association",
            RouteTableAssociationArgs.builder()
                .subnetId(publicSubnet2.id())
                .routeTableId(publicRouteTable.id())
                .build(), providerOptions);
        
        // Create private route table (isolated - no internet access)
        var privateRouteTable = new RouteTable("private-route-table",
            RouteTableArgs.builder()
                .vpcId(vpc.id())
                .tags(Map.of("Name", "private-route-table"))
                .build(), providerOptions);
        
        // Associate private subnets with private route table
        var privateSubnet1Association = new RouteTableAssociation("private-subnet-1-association",
            RouteTableAssociationArgs.builder()
                .subnetId(privateSubnet1.id())
                .routeTableId(privateRouteTable.id())
                .build(), providerOptions);
        
        var privateSubnet2Association = new RouteTableAssociation("private-subnet-2-association",
            RouteTableAssociationArgs.builder()
                .subnetId(privateSubnet2.id())
                .routeTableId(privateRouteTable.id())
                .build(), providerOptions);
        
        // Create Security Group with restricted SSH access
        var webSecurityGroup = new SecurityGroup("web-security-group",
            SecurityGroupArgs.builder()
                .name("web-security-group")
                .description("Security group for web servers with restricted SSH access")
                .vpcId(vpc.id())
                .ingress(List.of(
                    // SSH access only from authorized IP
                    SecurityGroupIngressArgs.builder()
                        .protocol("tcp")
                        .fromPort(22)
                        .toPort(22)
                        .cidrBlocks(List.of(authorizedSshIp + "/32"))
                        .description("SSH access from authorized IP only")
                        .build(),
                    // HTTP access (for web application)
                    SecurityGroupIngressArgs.builder()
                        .protocol("tcp")
                        .fromPort(80)
                        .toPort(80)
                        .cidrBlocks(List.of("0.0.0.0/0"))
                        .description("HTTP access")
                        .build(),
                    // HTTPS access (for web application)
                    SecurityGroupIngressArgs.builder()
                        .protocol("tcp")
                        .fromPort(443)
                        .toPort(443)
                        .cidrBlocks(List.of("0.0.0.0/0"))
                        .description("HTTPS access")
                        .build(),
                    // Allow internal VPC communication
                    SecurityGroupIngressArgs.builder()
                        .protocol("-1")
                        .fromPort(0)
                        .toPort(0)
                        .cidrBlocks(List.of("10.0.0.0/16"))
                        .description("Internal VPC communication")
                        .build()
                ))
                .egress(List.of(
                    // Allow all outbound traffic
                    SecurityGroupEgressArgs.builder()
                        .protocol("-1")
                        .fromPort(0)
                        .toPort(0)
                        .cidrBlocks(List.of("0.0.0.0/0"))
                        .description("All outbound traffic")
                        .build()
                ))
                .tags(Map.of("Name", "web-security-group"))
                .build(), providerOptions);
        
        // Use a known Amazon Linux 2 AMI ID for us-west-2
        String amiId = "ami-0c2d3e23b7e3c7bd4"; // Amazon Linux 2 AMI (HVM) - Kernel 5.10, SSD Volume Type
        
        // Create EC2 instance in first public subnet
        var webServer1 = new Instance("web-server-1", InstanceArgs.builder()
            .instanceType("t3.micro")
            .ami(amiId)
            .subnetId(publicSubnet1.id())
            .vpcSecurityGroupIds(webSecurityGroup.id().applyValue(id -> List.of(id)))
            .userData(getUserData())
            .tags(Map.of(
                "Name", "web-server-1",
                "Environment", "production",
                "AZ", "us-west-2a"
            ))
            .build(), providerOptions);
        
        // Create EC2 instance in second public subnet
        var webServer2 = new Instance("web-server-2", InstanceArgs.builder()
            .instanceType("t3.micro")
            .ami(amiId)
            .subnetId(publicSubnet2.id())
            .vpcSecurityGroupIds(webSecurityGroup.id().applyValue(id -> List.of(id)))
            .userData(getUserData())
            .tags(Map.of(
                "Name", "web-server-2",
                "Environment", "production",
                "AZ", "us-west-2b"
            ))
            .build(), providerOptions);
        
        // Allocate and attach Elastic IP to first instance
        var eip1 = new Eip("web-server-1-eip", EipArgs.builder()
            .instance(webServer1.id())
            .domain("vpc")
            .tags(Map.of("Name", "web-server-1-eip"))
            .build(), providerOptions);
        
        // Allocate and attach Elastic IP to second instance
        var eip2 = new Eip("web-server-2-eip", EipArgs.builder()
            .instance(webServer2.id())
            .domain("vpc")
            .tags(Map.of("Name", "web-server-2-eip"))
            .build(), providerOptions);
        
        // Export important values
        ctx.export("vpcId", vpc.id());
        ctx.export("publicSubnet1Id", publicSubnet1.id());
        ctx.export("publicSubnet2Id", publicSubnet2.id());
        ctx.export("privateSubnet1Id", privateSubnet1.id());
        ctx.export("privateSubnet2Id", privateSubnet2.id());
        ctx.export("webServer1Id", webServer1.id());
        ctx.export("webServer2Id", webServer2.id());
        ctx.export("webServer1PublicIp", eip1.publicIp());
        ctx.export("webServer2PublicIp", eip2.publicIp());
        ctx.export("webServer1PrivateIp", webServer1.privateIp());
        ctx.export("webServer2PrivateIp", webServer2.privateIp());
        ctx.export("securityGroupId", webSecurityGroup.id());
    };     
    private static String getUserData() {
        return """
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            
            # Create a simple web page
            cat > /var/www/html/index.html << 'EOF'
            <!DOCTYPE html>
            <html>
            <head>
                <title>Scalable Web Application</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .info { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
                </style>
            </head>
            <body>
                <h1>Welcome to the Scalable Web Application</h1>
                <div class="info">
                    <h2>Server Information</h2>
                    <p><strong>Hostname:</strong> $(hostname)</p>
                    <p><strong>Instance ID:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
                    <p><strong>Availability Zone:</strong> $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
                    <p><strong>Private IP:</strong> $(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)</p>
                    <p><strong>Public IP:</strong> $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)</p>
                </div>
                <p><em>This server is running in a highly available, scalable infrastructure on AWS.</em></p>
            </body>
            </html>
            EOF
            
            # Set proper permissions
            chown apache:apache /var/www/html/index.html
            chmod 644 /var/www/html/index.html
            """;
        }
}