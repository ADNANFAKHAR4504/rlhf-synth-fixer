package app.constructs;

import com.hashicorp.cdktf.Fn;
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
        // Using Fn.element() to access AZ names from the token list
        this.publicSubnets = new ArrayList<>();
        this.privateSubnets = new ArrayList<>();

        // AZ 1 - Public Subnet
        Subnet publicSubnet0 = new Subnet(this, "public-subnet-0", SubnetConfig.builder()
                .vpcId(vpc.getId())
                .cidrBlock(getPublicSubnetCidrs().get(0))
                .availabilityZone((String) Fn.element(azs.getNames(), 0))
                .mapPublicIpOnLaunch(true)
                .tags(mergeTags(Map.of(
                        "Name", getResourcePrefix() + "-public-subnet-1",
                        "Type", "Public"
                )))
                .build());
        publicSubnets.add(publicSubnet0);

        // AZ 1 - Private Subnet
        Subnet privateSubnet0 = new Subnet(this, "private-subnet-0", SubnetConfig.builder()
                .vpcId(vpc.getId())
                .cidrBlock(getPrivateSubnetCidrs().get(0))
                .availabilityZone((String) Fn.element(azs.getNames(), 0))
                .tags(mergeTags(Map.of(
                        "Name", getResourcePrefix() + "-private-subnet-1",
                        "Type", "Private"
                )))
                .build());
        privateSubnets.add(privateSubnet0);

        // AZ 2 - Public Subnet
        Subnet publicSubnet1 = new Subnet(this, "public-subnet-1", SubnetConfig.builder()
                .vpcId(vpc.getId())
                .cidrBlock(getPublicSubnetCidrs().get(1))
                .availabilityZone((String) Fn.element(azs.getNames(), 1))
                .mapPublicIpOnLaunch(true)
                .tags(mergeTags(Map.of(
                        "Name", getResourcePrefix() + "-public-subnet-2",
                        "Type", "Public"
                )))
                .build());
        publicSubnets.add(publicSubnet1);

        // AZ 2 - Private Subnet
        Subnet privateSubnet1 = new Subnet(this, "private-subnet-1", SubnetConfig.builder()
                .vpcId(vpc.getId())
                .cidrBlock(getPrivateSubnetCidrs().get(1))
                .availabilityZone((String) Fn.element(azs.getNames(), 1))
                .tags(mergeTags(Map.of(
                        "Name", getResourcePrefix() + "-private-subnet-2",
                        "Type", "Private"
                )))
                .build());
        privateSubnets.add(privateSubnet1);

        // NAT Gateway for AZ 1
        Eip natEip0 = new Eip(this, "nat-eip-0", EipConfig.builder()
                .domain("vpc")
                .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-nat-eip-1")))
                .build());

        NatGateway natGw0 = new NatGateway(this, "nat-gw-0", NatGatewayConfig.builder()
                .allocationId(natEip0.getId())
                .subnetId(publicSubnet0.getId())
                .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-nat-gw-1")))
                .build());

        // Route table for AZ 1 private subnet
        RouteTable privateRt0 = new RouteTable(this, "private-rt-0", RouteTableConfig.builder()
                .vpcId(vpc.getId())
                .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-private-rt-1")))
                .build());

        new Route(this, "private-route-0", RouteConfig.builder()
                .routeTableId(privateRt0.getId())
                .destinationCidrBlock("0.0.0.0/0")
                .natGatewayId(natGw0.getId())
                .build());

        new RouteTableAssociation(this, "private-rta-0", RouteTableAssociationConfig.builder()
                .subnetId(privateSubnet0.getId())
                .routeTableId(privateRt0.getId())
                .build());

        // NAT Gateway for AZ 2
        Eip natEip1 = new Eip(this, "nat-eip-1", EipConfig.builder()
                .domain("vpc")
                .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-nat-eip-2")))
                .build());

        NatGateway natGw1 = new NatGateway(this, "nat-gw-1", NatGatewayConfig.builder()
                .allocationId(natEip1.getId())
                .subnetId(publicSubnet1.getId())
                .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-nat-gw-2")))
                .build());

        // Route table for AZ 2 private subnet
        RouteTable privateRt1 = new RouteTable(this, "private-rt-1", RouteTableConfig.builder()
                .vpcId(vpc.getId())
                .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-private-rt-2")))
                .build());

        new Route(this, "private-route-1", RouteConfig.builder()
                .routeTableId(privateRt1.getId())
                .destinationCidrBlock("0.0.0.0/0")
                .natGatewayId(natGw1.getId())
                .build());

        new RouteTableAssociation(this, "private-rta-1", RouteTableAssociationConfig.builder()
                .subnetId(privateSubnet1.getId())
                .routeTableId(privateRt1.getId())
                .build());

        // Public route table (shared by both AZs)
        RouteTable publicRt = new RouteTable(this, "public-rt", RouteTableConfig.builder()
                .vpcId(vpc.getId())
                .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-public-rt")))
                .build());

        new Route(this, "public-route", RouteConfig.builder()
                .routeTableId(publicRt.getId())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(igw.getId())
                .build());

        // Associate public subnets with public route table
        new RouteTableAssociation(this, "public-rta-0", RouteTableAssociationConfig.builder()
                .subnetId(publicSubnet0.getId())
                .routeTableId(publicRt.getId())
                .build());

        new RouteTableAssociation(this, "public-rta-1", RouteTableAssociationConfig.builder()
                .subnetId(publicSubnet1.getId())
                .routeTableId(publicRt.getId())
                .build());

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
