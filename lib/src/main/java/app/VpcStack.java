package app;

import app.InfrastructureConfig;
import app.TagUtils;
import com.pulumi.aws.ec2.*;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;
import java.util.List;

public class VpcStack extends ComponentResource {
    private final Vpc vpc;
    private final Subnet privateSubnetA;
    private final Subnet privateSubnetB;
    private final Subnet publicSubnetA;
    private final Subnet publicSubnetB;
    private final InternetGateway igw;
    private final NatGateway natGatewayA;
    private final NatGateway natGatewayB;
    private final RouteTable privateRouteTableA;
    private final RouteTable privateRouteTableB;
    private final RouteTable publicRouteTable;
    
    public VpcStack(String name, InfrastructureConfig config) {
        super("custom:networking:VpcStack", name, ComponentResourceOptions.builder().build());
        
        var tags = TagUtils.getStandardTags(config, "networking");
        
        // VPC
        this.vpc = new Vpc(config.getResourceName("vpc", "main"), VpcArgs.builder()
            .cidrBlock("10.0.0.0/16")
            .enableDnsHostnames(true)
            .enableDnsSupport(true)
            .tags(TagUtils.getStandardTags(config, "networking", "vpc"))
            .build(), CustomResourceOptions.builder().parent(this).build());
        
        // Internet Gateway
        this.igw = new InternetGateway(config.getResourceName("igw", "main"), InternetGatewayArgs.builder()
            .vpcId(vpc.id())
            .tags(TagUtils.getStandardTags(config, "networking", "igw"))
            .build(), CustomResourceOptions.builder().parent(this).build());
        
        // Public Subnets
        this.publicSubnetA = new Subnet(config.getResourceName("subnet", "public-a"), SubnetArgs.builder()
            .vpcId(vpc.id())
            .cidrBlock("10.0.1.0/24")
            .availabilityZone("us-east-1a")
            .mapPublicIpOnLaunch(true)
            .tags(TagUtils.getStandardTags(config, "networking", "public-subnet"))
            .build(), CustomResourceOptions.builder().parent(this).build());
            
        this.publicSubnetB = new Subnet(config.getResourceName("subnet", "public-b"), SubnetArgs.builder()
            .vpcId(vpc.id())
            .cidrBlock("10.0.2.0/24")
            .availabilityZone("us-east-1b")
            .mapPublicIpOnLaunch(true)
            .tags(TagUtils.getStandardTags(config, "networking", "public-subnet"))
            .build(), CustomResourceOptions.builder().parent(this).build());
        
        // Elastic IPs for NAT Gateways
        var eipA = new Eip(config.getResourceName("eip", "nat-a"), EipArgs.builder()
            .domain("vpc")
            .tags(TagUtils.getStandardTags(config, "networking", "eip"))
            .build(), CustomResourceOptions.builder().parent(this).build());
            
        var eipB = new Eip(config.getResourceName("eip", "nat-b"), EipArgs.builder()
            .domain("vpc")
            .tags(TagUtils.getStandardTags(config, "networking", "eip"))
            .build(), CustomResourceOptions.builder().parent(this).build());
        
        // NAT Gateways
        this.natGatewayA = new NatGateway(config.getResourceName("nat", "a"), NatGatewayArgs.builder()
            .allocationId(eipA.id())
            .subnetId(publicSubnetA.id())
            .tags(TagUtils.getStandardTags(config, "networking", "nat"))
            .build(), CustomResourceOptions.builder().parent(this).build());
            
        this.natGatewayB = new NatGateway(config.getResourceName("nat", "b"), NatGatewayArgs.builder()
            .allocationId(eipB.id())
            .subnetId(publicSubnetB.id())
            .tags(TagUtils.getStandardTags(config, "networking", "nat"))
            .build(), CustomResourceOptions.builder().parent(this).build());
        
        // Private Subnets
        this.privateSubnetA = new Subnet(config.getResourceName("subnet", "private-a"), SubnetArgs.builder()
            .vpcId(vpc.id())
            .cidrBlock("10.0.10.0/24")
            .availabilityZone("us-east-1a")
            .tags(TagUtils.getStandardTags(config, "networking", "private-subnet"))
            .build(), CustomResourceOptions.builder().parent(this).build());
            
        this.privateSubnetB = new Subnet(config.getResourceName("subnet", "private-b"), SubnetArgs.builder()
            .vpcId(vpc.id())
            .cidrBlock("10.0.11.0/24")
            .availabilityZone("us-east-1b")
            .tags(TagUtils.getStandardTags(config, "networking", "private-subnet"))
            .build(), CustomResourceOptions.builder().parent(this).build());
        
        // Route Tables
        this.publicRouteTable = new RouteTable(config.getResourceName("rt", "public"), RouteTableArgs.builder()
            .vpcId(vpc.id())
            .tags(TagUtils.getStandardTags(config, "networking", "route-table"))
            .build(), CustomResourceOptions.builder().parent(this).build());
            
        this.privateRouteTableA = new RouteTable(config.getResourceName("rt", "private-a"), RouteTableArgs.builder()
            .vpcId(vpc.id())
            .tags(TagUtils.getStandardTags(config, "networking", "route-table"))
            .build(), CustomResourceOptions.builder().parent(this).build());
            
        this.privateRouteTableB = new RouteTable(config.getResourceName("rt", "private-b"), RouteTableArgs.builder()
            .vpcId(vpc.id())
            .tags(TagUtils.getStandardTags(config, "networking", "route-table"))
            .build(), CustomResourceOptions.builder().parent(this).build());
        
        // Routes
        new Route(config.getResourceName("route", "public-igw"), RouteArgs.builder()
            .routeTableId(publicRouteTable.id())
            .destinationCidrBlock("0.0.0.0/0")
            .gatewayId(igw.id())
            .build(), CustomResourceOptions.builder().parent(this).build());
            
        new Route(config.getResourceName("route", "private-a-nat"), RouteArgs.builder()
            .routeTableId(privateRouteTableA.id())
            .destinationCidrBlock("0.0.0.0/0")
            .natGatewayId(natGatewayA.id())
            .build(), CustomResourceOptions.builder().parent(this).build());
            
        new Route(config.getResourceName("route", "private-b-nat"), RouteArgs.builder()
            .routeTableId(privateRouteTableB.id())
            .destinationCidrBlock("0.0.0.0/0")
            .natGatewayId(natGatewayB.id())
            .build(), CustomResourceOptions.builder().parent(this).build());
        
        // Route Table Associations
        new RouteTableAssociation(config.getResourceName("rta", "public-a"), RouteTableAssociationArgs.builder()
            .subnetId(publicSubnetA.id())
            .routeTableId(publicRouteTable.id())
            .build(), CustomResourceOptions.builder().parent(this).build());
            
        new RouteTableAssociation(config.getResourceName("rta", "public-b"), RouteTableAssociationArgs.builder()
            .subnetId(publicSubnetB.id())
            .routeTableId(publicRouteTable.id())
            .build(), CustomResourceOptions.builder().parent(this).build());
            
        new RouteTableAssociation(config.getResourceName("rta", "private-a"), RouteTableAssociationArgs.builder()
            .subnetId(privateSubnetA.id())
            .routeTableId(privateRouteTableA.id())
            .build(), CustomResourceOptions.builder().parent(this).build());
            
        new RouteTableAssociation(config.getResourceName("rta", "private-b"), RouteTableAssociationArgs.builder()
            .subnetId(privateSubnetB.id())
            .routeTableId(privateRouteTableB.id())
            .build(), CustomResourceOptions.builder().parent(this).build());
    }
    
    // Getters
    public Vpc getVpc() { return vpc; }
    public Subnet getPrivateSubnetA() { return privateSubnetA; }
    public Subnet getPrivateSubnetB() { return privateSubnetB; }
    public Subnet getPublicSubnetA() { return publicSubnetA; }
    public Subnet getPublicSubnetB() { return publicSubnetB; }
    public List<Subnet> getPrivateSubnets() { return List.of(privateSubnetA, privateSubnetB); }
    public List<Subnet> getPublicSubnets() { return List.of(publicSubnetA, publicSubnetB); }
}