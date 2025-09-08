package app.constructs;

import software.amazon.awscdk.services.ec2.CfnEIP;
import software.amazon.awscdk.services.ec2.CfnInternetGateway;
import software.amazon.awscdk.services.ec2.CfnNatGateway;
import software.amazon.awscdk.services.ec2.CfnRoute;
import software.amazon.awscdk.services.ec2.CfnRouteTable;
import software.amazon.awscdk.services.ec2.CfnSubnetRouteTableAssociation;
import software.amazon.awscdk.services.ec2.CfnVPCGatewayAttachment;
import software.amazon.awscdk.services.ec2.IpAddresses;
import software.amazon.awscdk.services.ec2.Subnet;
import software.amazon.awscdk.services.ec2.Vpc;
import software.constructs.Construct;

public class VpcConstruct extends Construct {
    private final Vpc vpc;
    private final Subnet publicSubnet;

    private final Subnet privateSubnet;

    public VpcConstruct(final Construct scope, final String id, final String vpcCidr) {
        super(scope, id);

        // Create VPC
        this.vpc = Vpc.Builder.create(this, "Vpc")
                .ipAddresses(IpAddresses.cidr(vpcCidr))
                .maxAzs(1) // Use single AZ for simplicity
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .subnetConfiguration(java.util.List.of())
                .natGateways(0) // We'll create NAT Gateway manually
                .build();

        // Create Internet Gateway (automatically created with VPC, but we reference it)
        CfnInternetGateway igw = CfnInternetGateway.Builder.create(this, "InternetGateway")
                .build();

        CfnVPCGatewayAttachment.Builder.create(this, "VpcGatewayAttachment")
                .vpcId(vpc.getVpcId())
                .internetGatewayId(igw.getRef())
                .build();

        // Get the first availability zone
        String availabilityZone = vpc.getAvailabilityZones().get(0);

        // Create public subnet
        this.publicSubnet = Subnet.Builder.create(this, "PublicSubnet")
                .vpcId(vpc.getVpcId())
                .cidrBlock(calculateSubnetCidr(vpcCidr, 0)) // First subnet
                .availabilityZone(availabilityZone)
                .mapPublicIpOnLaunch(true)
                .build();

        // Create private subnet
        // Second subnet
        this.privateSubnet = Subnet.Builder.create(this, "PrivateSubnet")
                .vpcId(vpc.getVpcId())
                .cidrBlock(calculateSubnetCidr(vpcCidr, 1)) // Second subnet
                .availabilityZone(availabilityZone)
                .mapPublicIpOnLaunch(false)
                .build();

        // Create Elastic IP for NAT Gateway
        CfnEIP natEip = CfnEIP.Builder.create(this, "NatEip")
                .domain("vpc")
                .build();

        // Create NAT Gateway in public subnet
        CfnNatGateway natGateway = CfnNatGateway.Builder.create(this, "NatGateway")
                .subnetId(publicSubnet.getSubnetId())
                .allocationId(natEip.getAttrAllocationId())
                .build();

        // Create route table for public subnet
        CfnRouteTable publicRouteTable = CfnRouteTable.Builder.create(this, "PublicRouteTable")
                .vpcId(vpc.getVpcId())
                .build();

        // Add route to Internet Gateway for public subnet
        CfnRoute.Builder.create(this, "PublicRoute")
                .routeTableId(publicRouteTable.getAttrRouteTableId())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(igw.getAttrInternetGatewayId())
                .build();

        // Associate public subnet with public route table
        CfnSubnetRouteTableAssociation.Builder.create(this, "PublicSubnetRouteTableAssociation")
                .subnetId(publicSubnet.getSubnetId())
                .routeTableId(publicRouteTable.getAttrRouteTableId())
                .build();

        // Create route table for private subnet
        CfnRouteTable privateRouteTable = CfnRouteTable.Builder.create(this, "PrivateRouteTable")
                .vpcId(vpc.getVpcId())
                .build();

        // Add route to NAT Gateway for private subnet
        CfnRoute.Builder.create(this, "PrivateRoute")
                .routeTableId(privateRouteTable.getAttrRouteTableId())
                .destinationCidrBlock("0.0.0.0/0")
                .natGatewayId(natGateway.getAttrNatGatewayId())
                .build();

        // Associate private subnet with private route table
        CfnSubnetRouteTableAssociation.Builder.create(this, "PrivateSubnetRouteTableAssociation")
                .subnetId(privateSubnet.getSubnetId())
                .routeTableId(privateRouteTable.getAttrRouteTableId())
                .build();
    }

    private String calculateSubnetCidr(final String vpcCidr, final int subnetIndex) {
        String[] parts = vpcCidr.split("\\.");
        return parts[0] + "." + parts[1] + "." + subnetIndex + ".0/24";
    }

    public Vpc getVpc() {
        return vpc;
    }

    public Subnet getPublicSubnet() {
        return publicSubnet;
    }

    public Subnet getPrivateSubnet() {
        return privateSubnet;
    }
}
