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

/**
 * Pulumi Java program: Minimal AWS network in us-east-1
 *
 * What this stack does
 * --------------------
 * 1. Creates an AWS provider explicitly pinned to "us-east-1".
 * 2. Provisions a VPC (10.0.0.0/16) with DNS support/hostnames enabled.
 * 3. Creates two *public* subnets in different Availability Zones and
 *    enables automatic public IP assignment for instances launched there.
 * 4. Attaches an Internet Gateway (IGW) to the VPC.
 * 5. Creates a route table with a default route (0.0.0.0/0) via the IGW
 *    and associates it to both public subnets.
 * 6. Exports detailed, human‑useful outputs for downstream stacks.
 *
 * Notes
 * -----
 * - This is intentionally minimal; no NAT Gateways or private subnets.
 * - AZs are fixed to us-east-1a and us-east-1b for deterministic previews.
 */
public class Main {
    /**
     * Entrypoint for Pulumi execution.
     * Pulumi will call this and hand in a Context to register resources and exports.
     */
    public static void main(String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }

    /**
     * Defines all cloud resources and stack outputs.
     *
     * @param ctx Pulumi Context used to register resources and exports
     */
    static void defineInfrastructure(Context ctx) {
        // ------------------------------------------------------------------
        // 0) Provider: pin everything to us-east-1 for this stack 
        // ------------------------------------------------------------------
        var awsUsEast1 = buildAwsProvider("aws-us-east-1", "us-east-1");
        var opts = CustomResourceOptions.builder().provider(awsUsEast1).build();

        // ------------------------------------------------------------------
        // 1) VPC
        // ------------------------------------------------------------------
        var vpc = new Vpc("app-vpc", VpcArgs.builder()
                .cidrBlock("10.0.0.0/16")
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .tags(Map.of(
                        "Name", "app-vpc",
                        "Project", "pulumi-java-minimal-network",
                        "ManagedBy", "pulumi"))
                .build(), opts);

        // ------------------------------------------------------------------
        // 2) Internet Gateway
        // ------------------------------------------------------------------
        var igw = new InternetGateway("app-igw", InternetGatewayArgs.builder()
                .vpcId(vpc.id())
                .tags(Map.of("Name", "app-igw"))
                .build(), opts);

        // ------------------------------------------------------------------
        // 3) Public Subnets (two AZs for HA) with auto-assign public IPs
        // ------------------------------------------------------------------
        final String az1 = "us-east-1a";
        final String az2 = "us-east-1b";

        var publicSubnet1 = createPublicSubnet(
                "app-public-subnet-a", vpc, "10.0.1.0/24", az1, "app-public-a", opts);
        var publicSubnet2 = createPublicSubnet(
                "app-public-subnet-b", vpc, "10.0.2.0/24", az2, "app-public-b", opts);

        // ------------------------------------------------------------------
        // 4) Public Route Table + default route via IGW
        // ------------------------------------------------------------------
        var publicRt = new RouteTable("app-public-rt", RouteTableArgs.builder()
                .vpcId(vpc.id())
                .tags(Map.of("Name", "app-public-rt"))
                .build(), opts);

        var defaultRoute = new Route("app-default-route", RouteArgs.builder()
                .routeTableId(publicRt.id())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(igw.id())
                .build(), opts);

        // ------------------------------------------------------------------
        // 5) Associate both public subnets to the route table
        // ------------------------------------------------------------------
        var rta1 = associate(publicSubnet1, publicRt, "app-rta-public-a", opts);
        var rta2 = associate(publicSubnet2, publicRt, "app-rta-public-b", opts);

        // ------------------------------------------------------------------
        // 6) Rich Outputs for downstream use / debugging convenience
        // ------------------------------------------------------------------
        // Basic IDs
        ctx.export("region", Output.of("us-east-1"));
        ctx.export("vpcId", vpc.id());
        ctx.export("vpcCidr", vpc.cidrBlock());
        ctx.export("internetGatewayId", igw.id());
        ctx.export("publicRouteTableId", publicRt.id());
        ctx.export("defaultRouteId", defaultRoute.id());

        // Subnet identifiers
        ctx.export("publicSubnet1Id", publicSubnet1.id());
        ctx.export("publicSubnet2Id", publicSubnet2.id());
        ctx.export("publicSubnetIds", Output.all(List.of(publicSubnet1.id(), publicSubnet2.id())));

        // Subnet CIDRs
        ctx.export("publicSubnetCidrs", Output.all(List.of(publicSubnet1.cidrBlock(), publicSubnet2.cidrBlock())));

        // Subnet AZs (use explicit strings for clarity)
        ctx.export("publicSubnetAzs", Output.all(List.of(
                Output.of(az1),
                Output.of(az2)
        )));

        // Route table associations -> useful when scripting lookups
        ctx.export("publicSubnetRouteTableAssociationIds",
                Output.all(List.of(rta1.id(), rta2.id())));

        // Convenience map of subnet name -> id (JSON-ish structure)
        ctx.export("publicSubnetNameToId", Output.of(Map.of(
                "app-public-a", publicSubnet1.id(),
                "app-public-b", publicSubnet2.id()
        )));

        // VPC tag map as an output (handy for policy/testing)
        ctx.export("vpcTags", vpc.tags());
    }

    /**
     * Helper: Create an AWS provider pinned to a region.
     *
     * @param name   Logical Pulumi name for the provider
     * @param region AWS region (e.g., "us-east-1")
     * @return a Provider resource
     */
    private static Provider buildAwsProvider(String name, String region) {
        return new Provider(name, ProviderArgs.builder()
                .region(region)
                .build());
    }

    /**
     * Helper: Create a public subnet with mapPublicIpOnLaunch=true.
     *
     * @param name      Logical name for the subnet resource
     * @param vpc       Parent VPC resource
     * @param cidr      Subnet CIDR block (e.g., 10.0.1.0/24)
     * @param az        Availability Zone (e.g., us-east-1a)
     * @param tagName   Value for the Name tag
     * @param opts      Custom resource options (e.g., provider)
     * @return the created Subnet resource
     */
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

    /**
     * Helper: Associate a subnet to a route table.
     *
     * @param subnet   Subnet to associate
     * @param rt       Route table
     * @param name     Logical name for the association
     * @param opts     Custom resource options (e.g., provider)
     * @return the created RouteTableAssociation resource
     */
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
