I'll help you create a Pulumi Java program for a basic AWS network setup. Here's the complete `Main.java` file:

```java
package myproject;

import com.pulumi.Pulumi;
import com.pulumi.aws.ec2.InternetGateway;
import com.pulumi.aws.ec2.InternetGatewayArgs;
import com.pulumi.aws.ec2.Route;
import com.pulumi.aws.ec2.RouteArgs;
import com.pulumi.aws.ec2.RouteTable;
import com.pulumi.aws.ec2.RouteTableArgs;
import com.pulumi.aws.ec2.RouteTableAssociation;
import com.pulumi.aws.ec2.RouteTableAssociationArgs;
import com.pulumi.aws.ec2.Subnet;
import com.pulumi.aws.ec2.SubnetArgs;
import com.pulumi.aws.ec2.Vpc;
import com.pulumi.aws.ec2.VpcArgs;
import com.pulumi.core.Output;

import java.util.Map;

public class Main {
    public static void main(String[] args) {
        Pulumi.run(ctx -> {
            // Create VPC with 10.0.0.0/16 CIDR block
            var vpc = new Vpc("main-vpc", VpcArgs.builder()
                .cidrBlock("10.0.0.0/16")
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .tags(Map.of("Name", "main-vpc"))
                .build());

            // Create Internet Gateway
            var igw = new InternetGateway("main-igw", InternetGatewayArgs.builder()
                .vpcId(vpc.id())
                .tags(Map.of("Name", "main-igw"))
                .build());

            // Create first public subnet in us-east-1a
            var publicSubnet1 = new Subnet("public-subnet-1", SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock("10.0.1.0/24")
                .availabilityZone("us-east-1a")
                .mapPublicIpOnLaunch(true)
                .tags(Map.of("Name", "public-subnet-1"))
                .build());

            // Create second public subnet in us-east-1b
            var publicSubnet2 = new Subnet("public-subnet-2", SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock("10.0.2.0/24")
                .availabilityZone("us-east-1b")
                .mapPublicIpOnLaunch(true)
                .tags(Map.of("Name", "public-subnet-2"))
                .build());

            // Create public route table
            var publicRouteTable = new RouteTable("public-route-table", RouteTableArgs.builder()
                .vpcId(vpc.id())
                .tags(Map.of("Name", "public-route-table"))
                .build());

            // Create default route pointing to Internet Gateway
            var defaultRoute = new Route("default-route", RouteArgs.builder()
                .routeTableId(publicRouteTable.id())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(igw.id())
                .build());

            // Associate first subnet with public route table
            var routeTableAssociation1 = new RouteTableAssociation("public-subnet-1-association", 
                RouteTableAssociationArgs.builder()
                    .subnetId(publicSubnet1.id())
                    .routeTableId(publicRouteTable.id())
                    .build());

            // Associate second subnet with public route table
            var routeTableAssociation2 = new RouteTableAssociation("public-subnet-2-association", 
                RouteTableAssociationArgs.builder()
                    .subnetId(publicSubnet2.id())
                    .routeTableId(publicRouteTable.id())
                    .build());

            // Export outputs
            ctx.export("vpcId", vpc.id());
            ctx.export("publicSubnet1Id", publicSubnet1.id());
            ctx.export("publicSubnet2Id", publicSubnet2.id());
            ctx.export("internetGatewayId", igw.id());
            ctx.export("publicRouteTableId", publicRouteTable.id());
        });
    }
}
```

## Key Components Explained

### 1. **VPC Creation**
- Creates a VPC with the `10.0.0.0/16` CIDR block
- Enables DNS hostnames and support for proper name resolution

### 2. **Public Subnets**
- **Subnet 1**: `10.0.1.0/24` in `us-east-1a`
- **Subnet 2**: `10.0.2.0/24` in `us-east-1b`
- Both have `mapPublicIpOnLaunch(true)` to automatically assign public IPs

### 3. **Internet Gateway**
- Attached to the VPC to provide internet access

### 4. **Routing**
- Creates a public route table
- Adds default route `0.0.0.0/0` pointing to the Internet Gateway
- Associates both subnets with this route table

### 5. **Outputs**
- Exports VPC ID and subnet IDs for later reference

## Prerequisites

Make sure your `pom.xml` includes the AWS Pulumi dependency:

```xml
<dependency>
    <groupId>com.pulumi</groupId>
    <artifactId>aws</artifactId>
    <version>6.14.0</version>
</dependency>
```

## Usage

1. **Initialize** your Pulumi project (if not already done):
   ```bash
   pulumi new aws-java
   ```

2. **Set the AWS region**:
   ```bash
   pulumi config set aws:region us-east-1
   ```

3. **Preview the deployment**:
   ```bash
   pulumi preview
   ```

4. **Deploy the infrastructure**:
   ```bash
   pulumi up
   ```

5. **View the outputs**:
   ```bash
   pulumi stack output
   ```

This setup provides a solid foundation for deploying AWS resources that need internet connectivity across multiple availability zones in the us-east-1 region.