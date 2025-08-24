I'll help you create a scalable web application infrastructure using Pulumi in Java. Here's a complete implementation that meets all your requirements:

## Project Structure

First, let's set up the Maven dependencies in `pom.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.example</groupId>
    <artifactId>scalable-web-app</artifactId>
    <version>1.0-SNAPSHOT</version>
    
    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <pulumi.version>0.9.9</pulumi.version>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>com.pulumi</groupId>
            <artifactId>pulumi</artifactId>
            <version>${pulumi.version}</version>
        </dependency>
        <dependency>
            <groupId>com.pulumi</groupId>
            <artifactId>aws</artifactId>
            <version>6.15.0</version>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.8.1</version>
                <configuration>
                    <source>11</source>
                    <target>11</target>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

## Main Application Code

```java
package com.example;

import com.pulumi.Pulumi;
import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
import com.pulumi.aws.ec2.*;
import com.pulumi.aws.ec2.inputs.SecurityGroupIngressArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResourceOptions;

import java.util.List;
import java.util.Map;

public class ScalableWebApp {
    
    public static void main(String[] args) {
        Pulumi.run(ctx -> {
            // Get configuration values
            var config = ctx.config();
            var authorizedSshIp = config.require("authorizedSshIp");
            
            // Set up AWS provider for us-west-2 region
            var awsProvider = new Provider("aws-provider", ProviderArgs.builder()
                .region("us-west-2")
                .build());
            
            var providerOptions = ComponentResourceOptions.builder()
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
            var azs = GetAvailabilityZones.invoke(GetAvailabilityZonesArgs.builder()
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
            var amiId = GetAmi.invoke(GetAmiArgs.builder()
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
            cat > /var/www/html/index.html << EOF
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

## Configuration File

Create a `Pulumi.yaml` file:

```yaml
name: scalable-web-app
runtime: java
description: A scalable web application infrastructure on AWS
```

Create a `Pulumi.dev.yaml` file for configuration:

```yaml
config:
  scalable-web-app:authorizedSshIp: "YOUR_IP_ADDRESS_HERE"
```

## Key Features and Best Practices

### 1. **Security**
- Security group restricts SSH access to only the authorized IP address
- Private subnets are completely isolated from the internet
- VPC communication is allowed internally for service-to-service communication
- Proper egress rules for outbound traffic

### 2. **High Availability**
- Resources are distributed across multiple Availability Zones (us-west-2a and us-west-2b)
- Each AZ has both public and private subnets for flexibility
- Load balancing can be easily added later

### 3. **Network Architecture**
- VPC with proper CIDR segmentation (10.0.0.0/16)
- Public subnets (10.0.1.0/24, 10.0.2.0/24) for internet-facing resources
- Private subnets (10.0.3.0/24, 10.0.4.0/24) for backend services
- Internet Gateway with proper routing for public subnet internet access

### 4. **Resource Management**
- Consistent naming conventions
- Comprehensive tagging strategy
- Proper resource dependencies and ordering

## Deployment Instructions

1. **Install Pulumi CLI** and configure AWS credentials
2. **Set the authorized SSH IP**:
   ```bash
   pulumi config set authorizedSshIp "YOUR_PUBLIC_IP"
   ```
3. **Deploy the stack**:
   ```bash
   pulumi up
   ```

## Testing Connectivity

After deployment, you can test:

1. **SSH to instances** (from authorized IP only):
   ```bash
   ssh -i your-key.pem ec2-user@<ELASTIC_IP>
   ```

2. **Test internal communication** between instances using their private IPs

3. **Access web application** via the Elastic IP addresses on port 80

This implementation provides a solid foundation for a scalable web application with proper security, high availability, and network isolation following AWS best practices.