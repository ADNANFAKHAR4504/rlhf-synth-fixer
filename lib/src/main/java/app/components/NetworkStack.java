package app.components;

import app.config.AppConfig;
import app.utils.TagUtils;
import com.pulumi.aws.AwsFunctions;
import com.pulumi.aws.ec2.InternetGateway;
import com.pulumi.aws.ec2.InternetGatewayArgs;
import com.pulumi.aws.ec2.RouteTable;
import com.pulumi.aws.ec2.RouteTableArgs;
import com.pulumi.aws.ec2.RouteTableAssociation;
import com.pulumi.aws.ec2.RouteTableAssociationArgs;
import com.pulumi.aws.ec2.Subnet;
import com.pulumi.aws.ec2.SubnetArgs;
import com.pulumi.aws.ec2.Vpc;
import com.pulumi.aws.ec2.VpcArgs;
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

    public NetworkStack(String name, AppConfig config, ComponentResourceOptions options) {
        super("custom:infrastructure:NetworkStack", name, options);

        // Get availability zones
        Output<GetAvailabilityZonesResult> availabilityZones = AwsFunctions.getAvailabilityZones(
                GetAvailabilityZonesArgs.builder().build()
        );

        // Create VPC
        var vpc = new Vpc(name + "web-hosting-vpc", VpcArgs.builder()
                .cidrBlock(config.getVpcCidrBlock())
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .tags(TagUtils.getTagsWithName("WebHosting-VPC", config))
                .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.vpcId = vpc.id();

        // Create Internet Gateway
        var internetGateway = new InternetGateway(name + "web-hosting-igw",
                InternetGatewayArgs.builder()
                        .vpcId(vpc.id())
                        .tags(TagUtils.getTagsWithName("WebHosting-IGW", config))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.internetGatewayId = internetGateway.id();

        // Create Public Subnets
        var publicSubnetPrimary = new Subnet(name + "public-subnet-primary",
                SubnetArgs.builder()
                        .vpcId(vpc.id())
                        .cidrBlock(config.getPublicSubnetPrimaryCidr())
                        .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(0)))
                        .mapPublicIpOnLaunch(true)
                        .tags(TagUtils.getTagsWithName("Public-Subnet-Primary", config))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        var publicSubnetSecondary = new Subnet(name + "public-subnet-secondary",
                SubnetArgs.builder()
                        .vpcId(vpc.id())
                        .cidrBlock(config.getPublicSubnetSecondaryCidr())
                        .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(1)))
                        .mapPublicIpOnLaunch(true)
                        .tags(TagUtils.getTagsWithName("Public-Subnet-Secondary", config))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.publicSubnetPrimaryId = publicSubnetPrimary.id();
        this.publicSubnetSecondaryId = publicSubnetSecondary.id();

        // Create Private Subnets
        var privateSubnetPrimary = new Subnet(name + "private-subnet-primary",
                SubnetArgs.builder()
                        .vpcId(vpc.id())
                        .cidrBlock(config.getPrivateSubnetPrimaryCidr())
                        .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(0)))
                        .tags(TagUtils.getTagsWithName("Private-Subnet-Primary", config))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        var privateSubnetSecondary = new Subnet(name + "private-subnet-secondary",
                SubnetArgs.builder()
                        .vpcId(vpc.id())
                        .cidrBlock(config.getPrivateSubnetSecondaryCidr())
                        .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(1)))
                        .tags(TagUtils.getTagsWithName("Private-Subnet-Secondary", config))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.privateSubnetPrimaryId = privateSubnetPrimary.id();
        this.privateSubnetSecondaryId = privateSubnetSecondary.id();

        // Create Route Table for Public Subnets
        var publicRouteTable = new RouteTable(name + "public-route-table",
                RouteTableArgs.builder()
                        .vpcId(vpc.id())
                        .routes(RouteTableRouteArgs.builder()
                                .cidrBlock("0.0.0.0/0")
                                .gatewayId(internetGateway.id())
                                .build())
                        .tags(TagUtils.getTagsWithName("Public-Route-Table", config))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.publicRouteTableId = publicRouteTable.id();

        // Associate Route Table with Public Subnets
        new RouteTableAssociation(name + "public-subnet-primary-association",
                RouteTableAssociationArgs.builder()
                        .subnetId(publicSubnetPrimary.id())
                        .routeTableId(publicRouteTable.id())
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        new RouteTableAssociation(name + "public-subnet-secondary-association",
                RouteTableAssociationArgs.builder()
                        .subnetId(publicSubnetSecondary.id())
                        .routeTableId(publicRouteTable.id())
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());
    }
}
