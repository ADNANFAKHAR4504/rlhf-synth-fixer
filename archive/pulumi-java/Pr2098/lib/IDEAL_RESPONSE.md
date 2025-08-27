# Scalable Web Application Infrastructure with Pulumi Java

This implementation creates a scalable web application infrastructure on AWS using Pulumi's Java SDK. The solution addresses all requirements with proper security, high availability, and AWS best practices.

## Project Structure

The project uses Gradle for build management with the following configuration:

```gradle
plugins {
    id 'java'
    id 'application'
}

java {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
}

application {
    mainClass = 'app.Main'
}

dependencies {
    implementation 'com.pulumi:pulumi:0.9.9'
    implementation 'com.pulumi:aws:6.15.0'
    
    // Test dependencies
    testImplementation 'org.junit.jupiter:junit-jupiter:5.8.2'
    testImplementation 'software.amazon.awssdk:ec2:2.20.26'
    testImplementation 'com.fasterxml.jackson.core:jackson-databind:2.14.2'
}

test {
    useJUnitPlatform()
}
```

## Infrastructure Code

The complete infrastructure implementation in `lib/src/main/java/app/Main.java`:

```java
package app;

import com.pulumi.Context;
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

public final class Main {
    
    private Main() {
        // Utility class should not be instantiated
    }
    
    public static void main(String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }

    static void defineInfrastructure(Context ctx) {
        var config = ctx.config();
        var authorizedSshIp = "52.45.0.101";
        
        // Set up AWS provider for us-west-2 region
        var awsProvider = new Provider("aws-provider", ProviderArgs.builder()
            .region("us-west-2")
            .build());
        
        var providerOptions = CustomResourceOptions.builder()
            .provider(awsProvider)
            .build();
        
        // Create VPC with environment suffix to avoid conflicts
        var environmentSuffix = getEnvironmentSuffix();
        
        // Validate the authorized SSH IP
        if (!isValidIpAddress(authorizedSshIp)) {
            throw new IllegalArgumentException("Invalid authorized SSH IP address: " + authorizedSshIp);
        }
        
        var vpc = new Vpc("scalable-web-vpc-" + environmentSuffix, VpcArgs.builder()
            .cidrBlock("10.0.0.0/16")
            .enableDnsHostnames(true)
            .enableDnsSupport(true)
            .tags(Map.of(
                "Name", "scalable-web-vpc-" + environmentSuffix,
                "Environment", environmentSuffix,
                "Project", "TapStack"
            ))
            .build(), providerOptions);
        
        // Use hardcoded availability zones for us-west-2
        String az1 = "us-west-2a";
        String az2 = "us-west-2b";
        
        // Create Internet Gateway
        var internetGateway = new InternetGateway("scalable-web-igw-" + environmentSuffix, 
            InternetGatewayArgs.builder()
                .vpcId(vpc.id())
                .tags(Map.of(
                    "Name", "scalable-web-igw-" + environmentSuffix,
                    "Environment", environmentSuffix
                ))
                .build(), providerOptions);
        
        // Create public subnets in different AZs
        var publicSubnet1 = new Subnet("public-subnet-1-" + environmentSuffix, SubnetArgs.builder()
            .vpcId(vpc.id())
            .cidrBlock("10.0.1.0/24")
            .availabilityZone(az1)
            .mapPublicIpOnLaunch(true)
            .tags(Map.of(
                "Name", "public-subnet-1-" + environmentSuffix,
                "Type", "public",
                "Environment", environmentSuffix
            ))
            .build(), providerOptions);
        
        var publicSubnet2 = new Subnet("public-subnet-2-" + environmentSuffix, SubnetArgs.builder()
            .vpcId(vpc.id())
            .cidrBlock("10.0.2.0/24")
            .availabilityZone(az2)
            .mapPublicIpOnLaunch(true)
            .tags(Map.of(
                "Name", "public-subnet-2-" + environmentSuffix,
                "Type", "public",
                "Environment", environmentSuffix
            ))
            .build(), providerOptions);
        
        // Create private subnets in different AZs
        var privateSubnet1 = new Subnet("private-subnet-1-" + environmentSuffix, SubnetArgs.builder()
            .vpcId(vpc.id())
            .cidrBlock("10.0.3.0/24")
            .availabilityZone(az1)
            .tags(Map.of(
                "Name", "private-subnet-1-" + environmentSuffix,
                "Type", "private",
                "Environment", environmentSuffix
            ))
            .build(), providerOptions);
        
        var privateSubnet2 = new Subnet("private-subnet-2-" + environmentSuffix, SubnetArgs.builder()
            .vpcId(vpc.id())
            .cidrBlock("10.0.4.0/24")
            .availabilityZone(az2)
            .tags(Map.of(
                "Name", "private-subnet-2-" + environmentSuffix,
                "Type", "private",
                "Environment", environmentSuffix
            ))
            .build(), providerOptions);
        
        // Create public route table
        var publicRouteTable = new RouteTable("public-route-table-" + environmentSuffix, 
            RouteTableArgs.builder()
                .vpcId(vpc.id())
                .tags(Map.of(
                    "Name", "public-route-table-" + environmentSuffix,
                    "Environment", environmentSuffix
                ))
                .build(), providerOptions);
        
        // Create route to Internet Gateway for public subnets
        var publicRoute = new Route("public-route-" + environmentSuffix, RouteArgs.builder()
            .routeTableId(publicRouteTable.id())
            .destinationCidrBlock("0.0.0.0/0")
            .gatewayId(internetGateway.id())
            .build(), providerOptions);
        
        // Associate public subnets with public route table
        var publicSubnet1Association = new RouteTableAssociation("public-subnet-1-association-" + environmentSuffix,
            RouteTableAssociationArgs.builder()
                .subnetId(publicSubnet1.id())
                .routeTableId(publicRouteTable.id())
                .build(), providerOptions);
        
        var publicSubnet2Association = new RouteTableAssociation("public-subnet-2-association-" + environmentSuffix,
            RouteTableAssociationArgs.builder()
                .subnetId(publicSubnet2.id())
                .routeTableId(publicRouteTable.id())
                .build(), providerOptions);
        
        // Create private route table (isolated - no internet access)
        var privateRouteTable = new RouteTable("private-route-table-" + environmentSuffix,
            RouteTableArgs.builder()
                .vpcId(vpc.id())
                .tags(Map.of(
                    "Name", "private-route-table-" + environmentSuffix,
                    "Environment", environmentSuffix
                ))
                .build(), providerOptions);
        
        // Associate private subnets with private route table
        var privateSubnet1Association = new RouteTableAssociation("private-subnet-1-association-" + environmentSuffix,
            RouteTableAssociationArgs.builder()
                .subnetId(privateSubnet1.id())
                .routeTableId(privateRouteTable.id())
                .build(), providerOptions);
        
        var privateSubnet2Association = new RouteTableAssociation("private-subnet-2-association-" + environmentSuffix,
            RouteTableAssociationArgs.builder()
                .subnetId(privateSubnet2.id())
                .routeTableId(privateRouteTable.id())
                .build(), providerOptions);
        
        // Create Security Group with restricted SSH access
        var webSecurityGroup = new SecurityGroup("web-security-group-" + environmentSuffix,
            SecurityGroupArgs.builder()
                .name("web-security-group-" + environmentSuffix)
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
                .tags(Map.of(
                    "Name", "web-security-group-" + environmentSuffix,
                    "Environment", environmentSuffix
                ))
                .build(), providerOptions);
        
        // Use Amazon Linux 2023 AMI ID for us-west-2 (more current and maintained)
        String amiId = "ami-0cf2b4e024cdb6960"; // Amazon Linux 2023 AMI
        
        // Create EC2 instance in first public subnet
        var webServer1 = new Instance("web-server-1-" + environmentSuffix, InstanceArgs.builder()
            .instanceType("t3.micro")
            .ami(amiId)
            .subnetId(publicSubnet1.id())
            .vpcSecurityGroupIds(webSecurityGroup.id().applyValue(id -> List.of(id)))
            .userData(getUserData())
            .tags(Map.of(
                "Name", "web-server-1-" + environmentSuffix,
                "Environment", environmentSuffix,
                "AZ", "us-west-2a",
                "Project", "TapStack"
            ))
            .build(), providerOptions);
        
        // Create EC2 instance in second public subnet
        var webServer2 = new Instance("web-server-2-" + environmentSuffix, InstanceArgs.builder()
            .instanceType("t3.micro")
            .ami(amiId)
            .subnetId(publicSubnet2.id())
            .vpcSecurityGroupIds(webSecurityGroup.id().applyValue(id -> List.of(id)))
            .userData(getUserData())
            .tags(Map.of(
                "Name", "web-server-2-" + environmentSuffix,
                "Environment", environmentSuffix,
                "AZ", "us-west-2b",
                "Project", "TapStack"
            ))
            .build(), providerOptions);
        
        // Allocate and attach Elastic IP to first instance
        var eip1 = new Eip("web-server-1-eip-" + environmentSuffix, EipArgs.builder()
            .instance(webServer1.id())
            .domain("vpc")
            .tags(Map.of(
                "Name", "web-server-1-eip-" + environmentSuffix,
                "Environment", environmentSuffix
            ))
            .build(), providerOptions);
        
        // Allocate and attach Elastic IP to second instance
        var eip2 = new Eip("web-server-2-eip-" + environmentSuffix, EipArgs.builder()
            .instance(webServer2.id())
            .domain("vpc")
            .tags(Map.of(
                "Name", "web-server-2-eip-" + environmentSuffix,
                "Environment", environmentSuffix
            ))
            .build(), providerOptions);
        
        // Export important values with environment suffix to avoid conflicts
        ctx.export("VpcId", vpc.id());
        ctx.export("PublicSubnet1Id", publicSubnet1.id());
        ctx.export("PublicSubnet2Id", publicSubnet2.id());
        ctx.export("PrivateSubnet1Id", privateSubnet1.id());
        ctx.export("PrivateSubnet2Id", privateSubnet2.id());
        ctx.export("WebServer1Id", webServer1.id());
        ctx.export("WebServer2Id", webServer2.id());
        ctx.export("WebServer1PublicIp", eip1.publicIp());
        ctx.export("WebServer2PublicIp", eip2.publicIp());
        ctx.export("WebServer1PrivateIp", webServer1.privateIp());
        ctx.export("WebServer2PrivateIp", webServer2.privateIp());
        ctx.export("SecurityGroupId", webSecurityGroup.id());
        ctx.export("InternetGatewayId", internetGateway.id());
        ctx.export("EnvironmentSuffix", Output.of(environmentSuffix));
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
    
    static String getEnvironmentSuffix() {
        String environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (environmentSuffix == null || environmentSuffix.trim().isEmpty()) {
            environmentSuffix = "dev";
        }
        return environmentSuffix;
    }
    
    static boolean isValidIpAddress(String ipAddress) {
        if (ipAddress == null || ipAddress.trim().isEmpty()) {
            return false;
        }
        
        // Basic IP address validation regex
        String ipPattern = "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$";
        return ipAddress.matches(ipPattern);
    }
    
    static boolean isValidCidrBlock(String cidrBlock) {
        if (cidrBlock == null || cidrBlock.trim().isEmpty()) {
            return false;
        }
        
        String[] parts = cidrBlock.split("/");
        if (parts.length != 2) {
            return false;
        }
        
        try {
            // Validate IP part
            if (!isValidIpAddress(parts[0])) {
                return false;
            }
            
            // Validate prefix length
            int prefixLength = Integer.parseInt(parts[1]);
            return prefixLength >= 0 && prefixLength <= 32;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}
```

## Pulumi Configuration

The project includes a `Pulumi.yaml` file:

```yaml
name: tap-stack
runtime: java
description: A scalable web application infrastructure using Pulumi Java SDK
```

## Key Features Implemented

### 1. **AWS Provider Configuration**
- Configured for `us-west-2` region as required
- Uses custom provider for consistent regional deployment

### 2. **VPC Architecture**
- VPC with CIDR block `10.0.0.0/16` as specified
- DNS hostnames and DNS support enabled for proper name resolution

### 3. **Multi-AZ Subnet Design**
- **Public Subnets**: `10.0.1.0/24` (us-west-2a), `10.0.2.0/24` (us-west-2b)
- **Private Subnets**: `10.0.3.0/24` (us-west-2a), `10.0.4.0/24` (us-west-2b)
- Each AZ contains both public and private subnets for high availability

### 4. **Internet Gateway and Routing**
- Internet Gateway attached to VPC
- Public route table with `0.0.0.0/0` route to Internet Gateway
- Private route table with no internet access (isolated)
- Proper subnet associations to respective route tables

### 5. **EC2 Instances**
- Two `t3.micro` instances deployed in different public subnets (us-west-2a and us-west-2b)
- Amazon Linux 2023 AMI for enhanced security and performance
- User data script installs and configures Apache web server
- Comprehensive server information display on web page

### 6. **Elastic IP Configuration**
- Each EC2 instance has a dedicated Elastic IP address
- EIPs are properly associated with instances
- VPC domain configuration for optimal routing

### 7. **Security Group Configuration**
- SSH access restricted to authorized IP address only (`52.45.0.101/32`)
- HTTP (port 80) and HTTPS (port 443) access from anywhere for web traffic
- Internal VPC communication allowed (`10.0.0.0/16`)
- All outbound traffic permitted for updates and internet access

### 8. **Environment Isolation**
- All resources use `ENVIRONMENT_SUFFIX` for naming to prevent conflicts
- Consistent tagging strategy for resource management
- Project tags for organizational purposes

### 9. **Testable Methods**
- `getEnvironmentSuffix()` method for dynamic environment configuration
- `isValidIpAddress()` for IP address validation
- `isValidCidrBlock()` for CIDR block validation
- Methods are package-private for unit testing

### 10. **Stack Outputs**
- Comprehensive exports including VPC ID, subnet IDs, instance IDs
- Public and private IP addresses exported
- Security group and Internet Gateway IDs available
- Environment suffix exported for reference

## Security Best Practices

1. **Principle of Least Privilege**: SSH access restricted to single authorized IP
2. **Network Segmentation**: Private subnets have no internet access
3. **Input Validation**: IP address and CIDR block validation methods
4. **Resource Isolation**: Environment suffix prevents resource name conflicts
5. **Comprehensive Tagging**: All resources properly tagged for management

## High Availability Design

1. **Multi-AZ Deployment**: Resources distributed across two availability zones
2. **Redundant Infrastructure**: Two instances in separate subnets
3. **Elastic IP Addresses**: Consistent public IP addresses for each instance
4. **Load Balancer Ready**: Architecture supports adding ALB/NLB later

This implementation provides a production-ready foundation for a scalable web application with proper security controls, high availability, and AWS best practices.