Here's the complete Pulumi Java program that creates a minimal AWS network infrastructure in us-east-1:

```java
package app;

import java.util.List;
import java.util.Map;

import com.pulumi.Context;
import com.pulumi.Pulumi;
import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
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
import com.pulumi.resources.CustomResourceOptions;

public class Main {
    public static void main(String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }

    static void defineInfrastructure(Context ctx) {
        var awsUsEast1 = buildAwsProvider("aws-us-east-1", "us-east-1");
        var opts = CustomResourceOptions.builder().provider(awsUsEast1).build();

        var vpc = new Vpc("app-vpc", VpcArgs.builder()
                .cidrBlock("10.0.0.0/16")
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .tags(Map.of(
                        "Name", "app-vpc",
                        "Project", "pulumi-java-minimal-network",
                        "ManagedBy", "pulumi"))
                .build(), opts);

        var igw = new InternetGateway("app-igw", InternetGatewayArgs.builder()
                .vpcId(vpc.id())
                .tags(Map.of("Name", "app-igw"))
                .build(), opts);

        final String az1 = "us-east-1a";
        final String az2 = "us-east-1b";

        var publicSubnet1 = createPublicSubnet(
                "app-public-subnet-a", vpc, "10.0.1.0/24", az1, "app-public-a", opts);
        var publicSubnet2 = createPublicSubnet(
                "app-public-subnet-b", vpc, "10.0.2.0/24", az2, "app-public-b", opts);

        var publicRt = new RouteTable("app-public-rt", RouteTableArgs.builder()
                .vpcId(vpc.id())
                .tags(Map.of("Name", "app-public-rt"))
                .build(), opts);

        var defaultRoute = new Route("app-default-route", RouteArgs.builder()
                .routeTableId(publicRt.id())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(igw.id())
                .build(), opts);

        var rta1 = associate(publicSubnet1, publicRt, "app-rta-public-a", opts);
        var rta2 = associate(publicSubnet2, publicRt, "app-rta-public-b", opts);

        ctx.export("region", Output.of("us-east-1"));
        ctx.export("vpcId", vpc.id());
        ctx.export("vpcCidr", vpc.cidrBlock());
        ctx.export("internetGatewayId", igw.id());
        ctx.export("publicRouteTableId", publicRt.id());
        ctx.export("defaultRouteId", defaultRoute.id());
        ctx.export("publicSubnet1Id", publicSubnet1.id());
        ctx.export("publicSubnet2Id", publicSubnet2.id());
        ctx.export("publicSubnetIds", Output.all(List.of(publicSubnet1.id(), publicSubnet2.id())));
        ctx.export("publicSubnetCidrs", Output.all(List.of(publicSubnet1.cidrBlock(), publicSubnet2.cidrBlock())));
        ctx.export("publicSubnetAzs", Output.all(List.of(
                Output.of(az1),
                Output.of(az2)
        )));
        ctx.export("publicSubnetRouteTableAssociationIds",
                Output.all(List.of(rta1.id(), rta2.id())));
        ctx.export("publicSubnetNameToId", Output.of(Map.of(
                "app-public-a", publicSubnet1.id(),
                "app-public-b", publicSubnet2.id()
        )));
        ctx.export("vpcTags", vpc.tags());
    }

    private static Provider buildAwsProvider(String name, String region) {
        return new Provider(name, ProviderArgs.builder()
                .region(region)
                .build());
    }

    private static Subnet createPublicSubnet(
            String name,
            Vpc vpc,
            String cidr,
            String az,
            String tagName,
            CustomResourceOptions opts
    ) {
        return new Subnet(name, SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock(cidr)
                .availabilityZone(az)
                .mapPublicIpOnLaunch(true)
                .tags(Map.of("Name", tagName))
                .build(), opts);
    }

    private static RouteTableAssociation associate(
            Subnet subnet,
            RouteTable rt,
            String name,
            CustomResourceOptions opts
    ) {
        return new RouteTableAssociation(name, RouteTableAssociationArgs.builder()
                .subnetId(subnet.id())
                .routeTableId(rt.id())
                .build(), opts);
    }
}
```

This implementation:

1. **Creates a VPC** in us-east-1 with CIDR block 10.0.0.0/16, enabling DNS hostname and support
2. **Sets up an Internet Gateway** and attaches it to the VPC
3. **Creates two public subnets** in different availability zones (us-east-1a and us-east-1b) with CIDR blocks 10.0.1.0/24 and 10.0.2.0/24
4. **Enables automatic public IP assignment** by setting `mapPublicIpOnLaunch = true` on both subnets
5. **Creates a route table** with a default route (0.0.0.0/0) pointing to the Internet Gateway
6. **Associates both subnets** to the public route table
7. **Exports comprehensive outputs** including VPC ID, subnet IDs, and other useful information for downstream use

The code follows Pulumi Java best practices with proper resource organization, helper methods for reusable components, and comprehensive tagging for resource management.