package app.constructs;

import com.hashicorp.cdktf.providers.aws.data_aws_availability_zones.DataAwsAvailabilityZones;
import com.hashicorp.cdktf.providers.aws.eip.Eip;
import com.hashicorp.cdktf.providers.aws.eip.EipConfig;
import com.hashicorp.cdktf.providers.aws.internet_gateway.InternetGateway;
import com.hashicorp.cdktf.providers.aws.internet_gateway.InternetGatewayConfig;
import com.hashicorp.cdktf.providers.aws.nat_gateway.NatGateway;
import com.hashicorp.cdktf.providers.aws.nat_gateway.NatGatewayConfig;
import com.hashicorp.cdktf.providers.aws.route.Route;
import com.hashicorp.cdktf.providers.aws.route.RouteConfig;
import com.hashicorp.cdktf.providers.aws.route_table.RouteTable;
import com.hashicorp.cdktf.providers.aws.route_table.RouteTableConfig;
import com.hashicorp.cdktf.providers.aws.route_table_association.RouteTableAssociation;
import com.hashicorp.cdktf.providers.aws.route_table_association.RouteTableAssociationConfig;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroup;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroupConfig;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroupEgress;
import com.hashicorp.cdktf.providers.aws.subnet.Subnet;
import com.hashicorp.cdktf.providers.aws.subnet.SubnetConfig;
import com.hashicorp.cdktf.providers.aws.vpc.Vpc;
import com.hashicorp.cdktf.providers.aws.vpc.VpcConfig;
import software.constructs.Construct;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class NetworkingConstruct extends BaseConstruct {

    private final Vpc vpc;

    private final List<Subnet> publicSubnets;

    private final List<Subnet> privateSubnets;

    private final SecurityGroup ecsSecurityGroup;

    public NetworkingConstruct(final Construct scope, final String id, final DataAwsAvailabilityZones azs) {
        super(scope, id);

        // Create VPC
        this.vpc = new Vpc(this, "vpc", VpcConfig.builder()
                .cidrBlock(getVpcCidrBlock())
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-vpc")))
                .build());

        // Create Internet Gateway
        InternetGateway igw = new InternetGateway(this, "igw", InternetGatewayConfig.builder()
                .vpcId(vpc.getId())
                .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-igw")))
                .build());

        // Create public and private subnets in 2 AZs for high availability
        this.publicSubnets = new ArrayList<>();
        this.privateSubnets = new ArrayList<>();

        for (int i = 0; i < 2; i++) {
            String azName = azs.getNames().get(i);

            // Public subnet
            Subnet publicSubnet = new Subnet(this, "public-subnet-" + i, SubnetConfig.builder()
                    .vpcId(vpc.getId())
                    .cidrBlock("10.0." + (i * 2) + ".0/24")
                    .availabilityZone(azName)
                    .mapPublicIpOnLaunch(true)
                    .tags(mergeTags(Map.of(
                            "Name", getResourcePrefix() + "-public-subnet-" + (i + 1),
                            "Type", "Public"
                    )))
                    .build());

            publicSubnets.add(publicSubnet);

            // Private subnet
            Subnet privateSubnet = new Subnet(this, "private-subnet-" + i, SubnetConfig.builder()
                    .vpcId(vpc.getId())
                    .cidrBlock("10.0." + ((i * 2) + 1) + ".0/24")
                    .availabilityZone(azName)
                    .tags(mergeTags(Map.of(
                            "Name", getResourcePrefix() + "-private-subnet-" + (i + 1),
                            "Type", "Private"
                    )))
                    .build());

            privateSubnets.add(privateSubnet);
        }

        // Create NAT Gateways for private subnets
        for (int i = 0; i < publicSubnets.size(); i++) {
            Eip natEip = new Eip(this, "nat-eip-" + i, EipConfig.builder()
                    .domain("vpc")
                    .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-nat-eip-" + (i + 1))))
                    .build());

            NatGateway natGw = new NatGateway(this, "nat-gw-" + i, NatGatewayConfig.builder()
                    .allocationId(natEip.getId())
                    .subnetId(publicSubnets.get(i).getId())
                    .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-nat-gw-" + (i + 1))))
                    .build());

            // Route table for private subnet
            RouteTable privateRt = new RouteTable(this, "private-rt-" + i, RouteTableConfig.builder()
                    .vpcId(vpc.getId())
                    .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-private-rt-" + (i + 1))))
                    .build());

            new Route(this, "private-route-" + i, RouteConfig.builder()
                    .routeTableId(privateRt.getId())
                    .destinationCidrBlock("0.0.0.0/0")
                    .natGatewayId(natGw.getId())
                    .build());

            new RouteTableAssociation(this, "private-rta-" + i, RouteTableAssociationConfig.builder()
                    .subnetId(privateSubnets.get(i).getId())
                    .routeTableId(privateRt.getId())
                    .build());
        }

        // Public route table
        RouteTable publicRt = new RouteTable(this, "public-rt", RouteTableConfig.builder()
                .vpcId(vpc.getId())
                .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-public-rt")))
                .build());

        new Route(this, "public-route", RouteConfig.builder()
                .routeTableId(publicRt.getId())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(igw.getId())
                .build());

        for (int i = 0; i < publicSubnets.size(); i++) {
            new RouteTableAssociation(this, "public-rta-" + i, RouteTableAssociationConfig.builder()
                    .subnetId(publicSubnets.get(i).getId())
                    .routeTableId(publicRt.getId())
                    .build());
        }

        // ECS Security Group
        this.ecsSecurityGroup = new SecurityGroup(this, "ecs-sg", SecurityGroupConfig.builder()
                .name(getResourcePrefix() + "-ecs-sg")
                .description("Security group for ECS tasks")
                .vpcId(vpc.getId())
                .egress(List.of(SecurityGroupEgress.builder()
                        .fromPort(0)
                        .toPort(0)
                        .protocol("-1")
                        .cidrBlocks(List.of("0.0.0.0/0"))
                        .build()))
                .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-ecs-sg")))
                .build());
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

    public SecurityGroup getEcsSecurityGroup() {
        return ecsSecurityGroup;
    }
}
