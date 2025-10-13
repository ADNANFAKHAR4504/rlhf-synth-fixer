package app.constructs;

import app.config.AppConfig;
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
import java.util.List;
import java.util.Map;

public class NetworkConstruct extends BaseConstruct {

    private final Vpc vpc;

    private final List<Subnet> publicSubnets;

    private final List<Subnet> privateSubnets;

    public NetworkConstruct(final Construct scope, final String id, final NetworkConfig config) {
        super(scope, id);

        AppConfig appConfig = getAppConfig();

        // Create VPC
        this.vpc = Vpc.Builder.create(this, "vpc")
                .cidrBlock(config.vpcCidr())
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .tags(appConfig.tags())
                .build();

        // Create Internet Gateway
        InternetGateway igw = InternetGateway.Builder.create(this, "igw")
                .vpcId(vpc.getId())
                .tags(appConfig.tags())
                .build();

        // Create subnets
        this.publicSubnets = new ArrayList<>();
        this.privateSubnets = new ArrayList<>();

        // Public subnets
        for (int i = 0; i < config.publicSubnetCidrs().size(); i++) {
            Subnet subnet = Subnet.Builder.create(this, "public-subnet-" + i)
                    .vpcId(vpc.getId())
                    .cidrBlock(config.publicSubnetCidrs().get(i))
                    .availabilityZone(config.availabilityZones().get(i))
                    .mapPublicIpOnLaunch(true)
                    .tags(mergeTags(Map.of("Name", String.format("%s-public-subnet-%d", appConfig.appName(), i))))
                    .build();
            publicSubnets.add(subnet);
        }

        // Private subnets
        List<NatGateway> natGateways = new ArrayList<>();
        if (config.enableNatGateway()) {
            // Create NAT Gateways for each AZ
            for (int i = 0; i < config.availabilityZones().size(); i++) {
                Eip eip = Eip.Builder.create(this, "nat-eip-" + i)
                        .domain("vpc")
                        .tags(appConfig.tags())
                        .build();

                NatGateway natGateway = NatGateway.Builder.create(this, "nat-gateway-" + i)
                        .allocationId(eip.getId())
                        .subnetId(publicSubnets.get(i).getId())
                        .tags(appConfig.tags())
                        .build();
                natGateways.add(natGateway);
            }
        }

        for (int i = 0; i < config.privateSubnetCidrs().size(); i++) {
            Subnet subnet = Subnet.Builder.create(this, "private-subnet-" + i)
                    .vpcId(vpc.getId())
                    .cidrBlock(config.privateSubnetCidrs().get(i))
                    .availabilityZone(config.availabilityZones().get(i))
                    .tags(mergeTags(Map.of("Name", String.format("%s-private-subnet-%d", appConfig.appName(), i))))
                    .build();
            privateSubnets.add(subnet);
        }

        // Route tables
        RouteTable publicRouteTable = RouteTable.Builder.create(this, "public-rt")
                .vpcId(vpc.getId())
                .tags(appConfig.tags())
                .build();

        Route.Builder.create(this, "public-route")
                .routeTableId(publicRouteTable.getId())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(igw.getId())
                .build();

        // Associate public subnets with public route table
        for (int i = 0; i < publicSubnets.size(); i++) {
            RouteTableAssociation.Builder.create(this, "public-rta-" + i)
                    .subnetId(publicSubnets.get(i).getId())
                    .routeTableId(publicRouteTable.getId())
                    .build();
        }

        // Private route tables (one per AZ for HA)
        if (config.enableNatGateway()) {
            for (int i = 0; i < privateSubnets.size(); i++) {
                RouteTable privateRouteTable = RouteTable.Builder.create(this, "private-rt-" + i)
                        .vpcId(vpc.getId())
                        .tags(appConfig.tags())
                        .build();

                Route.Builder.create(this, "private-route-" + i)
                        .routeTableId(privateRouteTable.getId())
                        .destinationCidrBlock("0.0.0.0/0")
                        .natGatewayId(natGateways.get(i).getId())
                        .build();

                RouteTableAssociation.Builder.create(this, "private-rta-" + i)
                        .subnetId(privateSubnets.get(i).getId())
                        .routeTableId(privateRouteTable.getId())
                        .build();
            }
        }
    }

    // Getters
    public Vpc getVpc() {
        return vpc;
    }

    public List<Subnet> getPublicSubnets() {
        return publicSubnets;
    }

    public List<Subnet> getPrivateSubnets() {
        return privateSubnets;
    }
}
