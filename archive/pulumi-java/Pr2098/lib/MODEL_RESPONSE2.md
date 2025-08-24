I see the issues with the code. Let me fix the compilation errors by correcting the imports, resource options, and data source usage. Here's the corrected version:

## Fixed Main Application Code

```java
package app;

import com.pulumi.Pulumi;
import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
import com.pulumi.aws.ec2.*;
import com.pulumi.aws.ec2.inputs.SecurityGroupIngressArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupEgressArgs;
import com.pulumi.aws.ec2.inputs.GetAvailabilityZonesArgs;
import com.pulumi.aws.ec2.inputs.GetAmiArgs;
import com.pulumi.aws.ec2.inputs.GetAmiFilterArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.CustomResourceOptions;

import java.util.List;
import java.util.Map;

public class Main {
    
    public static void main(String[] args) {
        Pulumi.run(ctx -> {
            // Get configuration values
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
            
            // Get availability zones
            var azs = com.pulumi.aws.ec2.Ec2Functions.getAvailabilityZones(GetAvailabilityZonesArgs.builder()
                .state("available")
                .build());
            
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
                .availabilityZone(azs.applyValue(zones -> zones.names().get(0)))
                .mapPublicIpOnLaunch(true)
                .tags(Map.of(
                    "Name", "public-subnet-1",
                    "Type", "public"
                ))
                .build(), providerOptions);
            
            var publicSubnet2 = new Subnet("public-subnet-2", SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock("10.0.2.0/24")
                .availabilityZone(azs.applyValue(zones -> zones.names().get(1)))
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
                .availabilityZone(azs.applyValue(zones -> zones.names().get(0)))
                .tags(Map.of(
                    "Name", "private-subnet-1",
                    "Type", "private"
                ))
                .build(), providerOptions);
            
            var privateSubnet2 = new Subnet("private-subnet-2", SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock("10.0.4.0/24")
                .availabilityZone(azs.applyValue(zones -> zones.names().get(1)))
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
            
            // Get the latest Amazon Linux 2 AMI
            var amiId = com.pulumi.aws.ec2.Ec2Functions.getAmi(GetAmiArgs.builder()
                .mostRecent(true)
                .owners(List.of("amazon"))
                .filters(List.of(
                    GetAmiFilterArgs.builder()
                        .name("name")
                        .values(List.of("amzn2-ami-hvm-*-x86_64-gp2"))
                        .build(),
                    GetAmiFilterArgs.builder()
                        .name("virtualization-type")
                        .values(List.of("hvm"))
                        .build()
                ))
                .build()).applyValue(ami -> ami.id());
            
            // Create EC2 instance in first public subnet
            var webServer1 = new Instance("web-server-1", InstanceArgs.builder()
                .instanceType("t3.micro")
                .ami(amiId)
                .subnetId(publicSubnet1.id())
                .vpcSecurityGroupIds(List.of(webSecurityGroup.id()))
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
                .vpcSecurityGroupIds(List.of(webSecurityGroup.id()))
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
        });
    }
    
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
            </head>
            <body>
                <h1>Welcome to the Scalable Web Application</h1>
                <p>Server: $(hostname)</p>
                <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
                <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
                <p>Private IP: $(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)</p>
                <p>Public IP: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)</p>
            </body>
            </html>
            EOF
            
            # Set proper permissions
            chown apache:apache /var/www/html/index.html
            chmod 644 /var/www/html/index.html
            """;
    }
}
```

## Updated build.gradle (if using Gradle)

```gradle
plugins {
    id 'java'
    id 'application'
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'com.pulumi:pulumi:0.9.9'
    implementation 'com.pulumi:aws:6.15.0'
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(11)
    }
}

application {
    mainClass = 'app.Main'
}
```

## Key Changes Made:

### 1. **Fixed Resource Options**
- Changed `ComponentResourceOptions` to `CustomResourceOptions`
- Updated import statement accordingly

### 2. **Fixed Data Source Imports and Usage**
- Changed `GetAvailabilityZones.invoke()` to `com.pulumi.aws.ec2.Ec2Functions.getAvailabilityZones()`
- Changed `GetAmi.invoke()` to `com.pulumi.aws.ec2.Ec2Functions.getAmi()`
- Added proper import statements for the input argument classes

### 3. **Fixed Package Declaration**
- Changed package from `com.example` to `app` to match the error message path

### 4. **Fixed User Data String**
- Changed the heredoc delimiter from `EOF` to `'EOF'` to prevent shell variable expansion issues

### 5. **Added Missing Imports**
- Added `SecurityGroupEgressArgs` import
- Added proper data source input argument imports

## Alternative Approach (Hardcoded AZs)

If you want to avoid the data source complexity, you can hardcode the availability zones:

```java
// Instead of using data source, hardcode AZs for us-west-2
String az1 = "us-west-2a";
String az2 = "us-west-2b";

// Then use these directly in subnet creation:
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
```

And for the AMI, you can use a known AMI ID:

```java
// Use a known Amazon Linux 2 AMI ID for us-west-2
String amiId = "ami-0c2d3e23b7e3c7bd4"; // Amazon Linux 2 AMI (HVM) - Kernel 5.10, SSD Volume Type
```

This approach eliminates the data source calls and should compile without issues. The code should now compile successfully and deploy the infrastructure as specified.