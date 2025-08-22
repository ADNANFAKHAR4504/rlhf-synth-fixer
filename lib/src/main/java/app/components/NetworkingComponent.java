package app.components;

import com.pulumi.aws.ec2.*;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class NetworkingComponent extends ComponentResource {
    private final Vpc vpc;
    private final List<Subnet> publicSubnets;
    private final List<Subnet> privateSubnets;

    public NetworkingComponent(String name, String region) {
        this(name, region, null);
    }

    public NetworkingComponent(String name, String region, ComponentResourceOptions opts) {
        super("custom:infrastructure:NetworkingComponent", name, opts);

        // Create VPC with DNS support and IPv6
        this.vpc = new Vpc(name + "-vpc", VpcArgs.builder()
                .cidrBlock("10.0.0.0/16")
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .assignGeneratedIpv6CidrBlock(true)
                .tags(getTags(name + "-vpc", "VPC", Map.of("Tier", "Network")))
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Create Internet Gateway
        InternetGateway internetGateway = new InternetGateway(name + "-igw", InternetGatewayArgs.builder()
                .vpcId(vpc.id())
                .tags(getTags(name + "-igw", "InternetGateway", Map.of()))
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Create public subnets across multiple AZs for high availability
        this.publicSubnets = createSubnets(name, "public",
                List.of("10.0.1.0/24", "10.0.2.0/24"),
                List.of("a", "b"), region, true);

        // Create private subnets across multiple AZs
        this.privateSubnets = createSubnets(name, "private",
                List.of("10.0.10.0/24", "10.0.20.0/24"),
                List.of("a", "b"), region, false);

        // Create and configure public route table
        RouteTable publicRouteTable = new RouteTable(name + "-public-rt", RouteTableArgs.builder()
                .vpcId(vpc.id())
                .tags(getTags(name + "-public-rt", "RouteTable", Map.of("Type", "Public")))
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Add route to Internet Gateway for public subnets
        new Route(name + "-public-route", RouteArgs.builder()
                .routeTableId(publicRouteTable.id())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(internetGateway.id())
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Associate public subnets with public route table
        associateSubnetsWithRouteTable(name, "public", publicSubnets, publicRouteTable);

        // Create private route table (no internet access by default)
        RouteTable privateRouteTable = new RouteTable(name + "-private-rt", RouteTableArgs.builder()
                .vpcId(vpc.id())
                .tags(getTags(name + "-private-rt", "RouteTable", Map.of("Type", "Private")))
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Associate private subnets with private route table
        associateSubnetsWithRouteTable(name, "private", privateSubnets, privateRouteTable);

        // Create VPC Flow Logs for security monitoring
        createVpcFlowLogs(name);
    }

    private List<Subnet> createSubnets(String baseName, String type,
                                       List<String> cidrs, List<String> azSuffixes,
                                       String region, boolean mapPublicIp) {
        var subnets = new ArrayList<Subnet>();

        for (int i = 0; i < cidrs.size(); i++) {
            var subnetName = "%s-%s-subnet-%d".formatted(baseName, type, i + 1);
            var subnet = new Subnet(subnetName, SubnetArgs.builder()
                    .vpcId(vpc.id())
                    .cidrBlock(cidrs.get(i))
                    .availabilityZone(region + azSuffixes.get(i))
                    .mapPublicIpOnLaunch(mapPublicIp)
                    .tags(getTags(subnetName, "Subnet", Map.of(
                            "Type", type,
                            "AZ", region + azSuffixes.get(i)
                    )))
                    .build(), CustomResourceOptions.builder().parent(this).build());
            subnets.add(subnet);
        }

        return subnets;
    }

    private void associateSubnetsWithRouteTable(String baseName, String type,
                                                List<Subnet> subnets, RouteTable routeTable) {
        for (int i = 0; i < subnets.size(); i++) {
            new RouteTableAssociation("%s-%s-rta-%d".formatted(baseName, type, i + 1),
                    RouteTableAssociationArgs.builder()
                            .subnetId(subnets.get(i).id())
                            .routeTableId(routeTable.id())
                            .build(), CustomResourceOptions.builder().parent(this).build());
        }
    }

    private void createVpcFlowLogs(String name) {
        // VPC Flow Logs for network monitoring (would require CloudWatch Log Group)
        // Implementation depends on logging strategy
    }

    private Map<String, String> getTags(String name, String resourceType, Map<String, String> additional) {
        var baseTags = Map.of(
                "Name", name,
                "ResourceType", resourceType,
                "Environment", "production",
                "ManagedBy", "Pulumi",
                "Project", "SecureInfrastructure"
        );

        if (additional.isEmpty()) {
            return baseTags;
        }

        var allTags = new java.util.HashMap<>(baseTags);
        allTags.putAll(additional);
        return allTags;
    }

    public Output<String> getVpcId() { return vpc.id(); }

    public Output<List<String>> getPublicSubnetIds() {
        return Output.all(publicSubnets.stream().map(Subnet::id).toList())
                .applyValue(ArrayList::new);
    }

    public Output<List<String>> getPrivateSubnetIds() {
        return Output.all(privateSubnets.stream().map(Subnet::id).toList())
                .applyValue(ArrayList::new);
    }
}