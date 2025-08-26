package app.components;

import app.config.AppConfig;
import app.utils.TagUtils;
import com.pulumi.aws.AwsFunctions;
import com.pulumi.aws.ec2.*;
import com.pulumi.aws.ec2.inputs.RouteTableRouteArgs;
import com.pulumi.aws.inputs.GetAvailabilityZonesArgs;
import com.pulumi.aws.outputs.GetAvailabilityZonesResult;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

public class NetworkStack extends ComponentResource {
    public final Output<String> vpcId;
    public final Output<String> publicSubnetPrimaryId;
    public final Output<String> publicSubnetSecondaryId;
    public final Output<String> privateSubnetPrimaryId;
    public final Output<String> privateSubnetSecondaryId;
    public final Output<String> internetGatewayId;
    public final Output<String> publicRouteTableId;

    public NetworkStack(String name, ComponentResourceOptions options) {
        super("custom:infrastructure:NetworkStack", name, options);

        // Get availability zones
        Output<GetAvailabilityZonesResult> availabilityZones = AwsFunctions.getAvailabilityZones(
                GetAvailabilityZonesArgs.builder().build()
        );

        // Create VPC
        var vpc = new Vpc("web-hosting-vpc", VpcArgs.builder()
                .cidrBlock(AppConfig.getVpcCidrBlock())
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .tags(TagUtils.getTagsWithName("WebHosting-VPC"))
                .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.vpcId = vpc.id();

        // Create Internet Gateway
        var internetGateway = new InternetGateway("web-hosting-igw",
                InternetGatewayArgs.builder()
                        .vpcId(vpc.id())
                        .tags(TagUtils.getTagsWithName("WebHosting-IGW"))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.internetGatewayId = internetGateway.id();

        // Create Public Subnets
        var publicSubnetPrimary = new Subnet("public-subnet-primary",
                SubnetArgs.builder()
                        .vpcId(vpc.id())
                        .cidrBlock(AppConfig.getPublicSubnetPrimaryCidr())
                        .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(0)))
                        .mapPublicIpOnLaunch(true)
                        .tags(TagUtils.getTagsWithName("Public-Subnet-Primary"))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        var publicSubnetSecondary = new Subnet("public-subnet-secondary",
                SubnetArgs.builder()
                        .vpcId(vpc.id())
                        .cidrBlock(AppConfig.getPublicSubnetSecondaryCidr())
                        .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(1)))
                        .mapPublicIpOnLaunch(true)
                        .tags(TagUtils.getTagsWithName("Public-Subnet-Secondary"))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.publicSubnetPrimaryId = publicSubnetPrimary.id();
        this.publicSubnetSecondaryId = publicSubnetSecondary.id();

        // Create Private Subnets
        var privateSubnetPrimary = new Subnet("private-subnet-primary",
                SubnetArgs.builder()
                        .vpcId(vpc.id())
                        .cidrBlock(AppConfig.getPrivateSubnetPrimaryCidr())
                        .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(0)))
                        .tags(TagUtils.getTagsWithName("Private-Subnet-Primary"))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        var privateSubnetSecondary = new Subnet("private-subnet-secondary",
                SubnetArgs.builder()
                        .vpcId(vpc.id())
                        .cidrBlock(AppConfig.getPrivateSubnetSecondaryCidr())
                        .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(1)))
                        .tags(TagUtils.getTagsWithName("Private-Subnet-Secondary"))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.privateSubnetPrimaryId = privateSubnetPrimary.id();
        this.privateSubnetSecondaryId = privateSubnetSecondary.id();

        // Create Route Table for Public Subnets
        var publicRouteTable = new RouteTable("public-route-table",
                RouteTableArgs.builder()
                        .vpcId(vpc.id())
                        .routes(RouteTableRouteArgs.builder()
                                .cidrBlock("0.0.0.0/0")
                                .gatewayId(internetGateway.id())
                                .build())
                        .tags(TagUtils.getTagsWithName("Public-Route-Table"))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.publicRouteTableId = publicRouteTable.id();

        // Associate Route Table with Public Subnets
        new RouteTableAssociation("public-subnet-primary-association",
                RouteTableAssociationArgs.builder()
                        .subnetId(publicSubnetPrimary.id())
                        .routeTableId(publicRouteTable.id())
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        new RouteTableAssociation("public-subnet-secondary-association",
                RouteTableAssociationArgs.builder()
                        .subnetId(publicSubnetSecondary.id())
                        .routeTableId(publicRouteTable.id())
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());
    }
}
