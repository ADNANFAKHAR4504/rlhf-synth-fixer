package app.constructs;

import app.config.NetworkConfig;
import com.hashicorp.cdktf.providers.aws.eip.Eip;
import com.hashicorp.cdktf.providers.aws.internet_gateway.InternetGateway;
import com.hashicorp.cdktf.providers.aws.nat_gateway.NatGateway;
import com.hashicorp.cdktf.providers.aws.route.Route;
import com.hashicorp.cdktf.providers.aws.route_table.RouteTable;
import com.hashicorp.cdktf.providers.aws.route_table_association.RouteTableAssociation;
import com.hashicorp.cdktf.providers.aws.subnet.Subnet;
import com.hashicorp.cdktf.providers.aws.vpc.Vpc;
import software.constructs.Construct;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class NetworkConstruct extends Construct {

    private final Vpc vpc;

    private final List<Subnet> publicSubnets;

    private final List<Subnet> privateSubnets;

    private final InternetGateway internetGateway;

    private final NatGateway natGateway;

    public NetworkConstruct(final Construct scope, final String id, final NetworkConfig config,
                            final Map<String, String> tags) {
        super(scope, id);

        // Create VPC
        this.vpc = Vpc.Builder.create(this, "vpc")
                .cidrBlock(config.vpcCidr())
                .enableDnsHostnames(config.enableDnsHostnames())
                .enableDnsSupport(config.enableDnsSupport())
                .tags(mergeTags(tags, Map.of("Name", id + "-vpc")))
                .build();

        // Create Internet Gateway
        this.internetGateway = InternetGateway.Builder.create(this, "igw")
                .vpcId(vpc.getId())
                .tags(mergeTags(tags, Map.of("Name", id + "-igw")))
                .build();

        // Create subnets
        this.publicSubnets = createPublicSubnets(config, tags);
        this.privateSubnets = createPrivateSubnets(config, tags);

        // Create NAT Gateway if enabled
        if (config.enableNatGateway()) {
            Eip natEip = Eip.Builder.create(this, "nat-eip")
                    .domain("vpc")
                    .tags(mergeTags(tags, Map.of("Name", id + "-nat-eip")))
                    .build();

            this.natGateway = NatGateway.Builder.create(this, "nat")
                    .allocationId(natEip.getId())
                    .subnetId(publicSubnets.get(0).getId())
                    .tags(mergeTags(tags, Map.of("Name", id + "-nat")))
                    .build();

            setupPrivateRouting(tags);
        } else {
            this.natGateway = null;
        }

        setupPublicRouting(tags);
    }

    private List<Subnet> createPublicSubnets(final NetworkConfig config, final Map<String, String> tags) {
        List<Subnet> subnets = new ArrayList<>();

        for (int i = 0; i < config.publicSubnetCidrs().size(); i++) {
            Subnet subnet = Subnet.Builder.create(this, "public-subnet-" + i)
                    .vpcId(vpc.getId())
                    .cidrBlock(config.publicSubnetCidrs().get(i))
                    .availabilityZone(config.availabilityZones().get(i))
                    .mapPublicIpOnLaunch(true)
                    .tags(mergeTags(tags, Map.of(
                            "Name", "public-subnet-" + config.availabilityZones().get(i),
                            "Type", "Public"
                    )))
                    .build();
            subnets.add(subnet);
        }

        return subnets;
    }

    private List<Subnet> createPrivateSubnets(final NetworkConfig config, final Map<String, String> tags) {
        List<Subnet> subnets = new ArrayList<>();

        for (int i = 0; i < config.privateSubnetCidrs().size(); i++) {
            Subnet subnet = Subnet.Builder.create(this, "private-subnet-" + i)
                    .vpcId(vpc.getId())
                    .cidrBlock(config.privateSubnetCidrs().get(i))
                    .availabilityZone(config.availabilityZones().get(i))
                    .mapPublicIpOnLaunch(false)
                    .tags(mergeTags(tags, Map.of(
                            "Name", "private-subnet-" + config.availabilityZones().get(i),
                            "Type", "Private"
                    )))
                    .build();
            subnets.add(subnet);
        }

        return subnets;
    }

    private void setupPublicRouting(final Map<String, String> tags) {
        RouteTable publicRouteTable = RouteTable.Builder.create(this, "public-rt")
                .vpcId(vpc.getId())
                .tags(mergeTags(tags, Map.of("Name", "public-route-table")))
                .build();

        Route.Builder.create(this, "public-route")
                .routeTableId(publicRouteTable.getId())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(internetGateway.getId())
                .build();

        for (int i = 0; i < publicSubnets.size(); i++) {
            RouteTableAssociation.Builder.create(this, "public-rta-" + i)
                    .routeTableId(publicRouteTable.getId())
                    .subnetId(publicSubnets.get(i).getId())
                    .build();
        }
    }

    private void setupPrivateRouting(final Map<String, String> tags) {
        RouteTable privateRouteTable = RouteTable.Builder.create(this, "private-rt")
                .vpcId(vpc.getId())
                .tags(mergeTags(tags, Map.of("Name", "private-route-table")))
                .build();

        Route.Builder.create(this, "private-route")
                .routeTableId(privateRouteTable.getId())
                .destinationCidrBlock("0.0.0.0/0")
                .natGatewayId(natGateway.getId())
                .build();

        for (int i = 0; i < privateSubnets.size(); i++) {
            RouteTableAssociation.Builder.create(this, "private-rta-" + i)
                    .routeTableId(privateRouteTable.getId())
                    .subnetId(privateSubnets.get(i).getId())
                    .build();
        }
    }

    private Map<String, String> mergeTags(final Map<String, String> baseTags, final Map<String, String> additionalTags) {
        Map<String, String> merged = new HashMap<>(baseTags);
        merged.putAll(additionalTags);
        return merged;
    }

    // Getters
    public String getVpcId() {
        return vpc.getId();
    }

    public List<String> getPublicSubnetIds() {
        return publicSubnets.stream().map(Subnet::getId).toList();
    }

    public List<String> getPrivateSubnetIds() {
        return privateSubnets.stream().map(Subnet::getId).toList();
    }

    public Vpc getVpc() {
        return vpc;
    }
}
