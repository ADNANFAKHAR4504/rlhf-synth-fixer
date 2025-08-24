package app;

import com.pulumi.aws.Provider;
import com.pulumi.aws.ec2.*;
import com.pulumi.aws.ec2.inputs.SecurityGroupIngressArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupEgressArgs;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;
import com.pulumi.core.Output;

import java.util.*;

/**
 * Networking Infrastructure Component
 * Handles VPC, subnets, security groups, and network-related resources
 */
public class NetworkingInfrastructure extends ComponentResource {

    public static class NetworkingInfrastructureArgs {
        private String region;
        private Boolean isPrimary;
        private String environment;
        private Map<String, String> tags;

        public NetworkingInfrastructureArgs() {}

        public String getRegion() { return region; }
        public NetworkingInfrastructureArgs setRegion(String region) {
            this.region = region;
            return this;
        }

        public Boolean getIsPrimary() { return isPrimary; }
        public NetworkingInfrastructureArgs setIsPrimary(Boolean isPrimary) {
            this.isPrimary = isPrimary;
            return this;
        }

        public String getEnvironment() { return environment; }
        public NetworkingInfrastructureArgs setEnvironment(String environment) {
            this.environment = environment;
            return this;
        }

        public Map<String, String> getTags() { return tags; }
        public NetworkingInfrastructureArgs setTags(Map<String, String> tags) {
            this.tags = tags;
            return this;
        }
    }

    private final String region;
    private final Boolean isPrimary;
    private final String environment;
    private final Map<String, String> tags;
    private final String regionSuffix;
    private final Provider provider;
    private final String vpcCidr;

    // Network Resources
    private final Vpc vpc;
    private final List<Subnet> publicSubnets = new ArrayList<>();
    private final List<Subnet> privateSubnets = new ArrayList<>();
    private final List<NatGateway> natGateways = new ArrayList<>();
    private final List<RouteTable> privateRts = new ArrayList<>();
    private final InternetGateway igw;
    private final RouteTable publicRt;
    private final SecurityGroup albSecurityGroup;
    private final SecurityGroup ebSecurityGroup;

    public NetworkingInfrastructure(String name, NetworkingInfrastructureArgs args,
                                   ComponentResourceOptions opts) {
        super("nova:infrastructure:Networking", name, opts);

        this.region = args.getRegion();
        this.isPrimary = args.getIsPrimary();
        this.environment = args.getEnvironment();
        this.tags = args.getTags();
        this.regionSuffix = args.getRegion().replaceAll("-", "").replaceAll("gov", "");
        this.provider = (opts != null && opts.getProvider() != null && opts.getProvider().isPresent())
            ? (Provider) opts.getProvider().get()
            : null;
        this.vpcCidr = args.getIsPrimary() ? "10.0.0.0/16" : "10.1.0.0/16";

        this.vpc = this.createVpc();
        this.igw = this.createInternetGateway();
        this.albSecurityGroup = this.createAlbSecurityGroup();
        this.ebSecurityGroup = this.createEbSecurityGroup();

        this.createSubnets();
        this.createNatGateways();
        this.publicRt = this.createRouteTablesAndAssociations();

        this.registerOutputs(Map.of(
            "vpcId", this.vpc.id(),
            "vpcCidr", this.vpc.cidrBlock(),
            "publicSubnetIds", getPublicSubnetIds(),
            "privateSubnetIds", getPrivateSubnetIds(),
            "albSecurityGroupId", this.albSecurityGroup.id(),
            "ebSecurityGroupId", this.ebSecurityGroup.id()
        ));
    }

    private Vpc createVpc() {
        Map<String, String> vpcTags = new HashMap<>(this.tags);
        vpcTags.put("Name", String.format("nova-vpc-%s", this.regionSuffix));

        return new Vpc(String.format("vpc-%s", this.regionSuffix), VpcArgs.builder()
                .cidrBlock(this.vpcCidr)
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .tags(vpcTags)
                .build(),
            CustomResourceOptions.builder()
                .parent(this)
                .provider(this.provider)
                .build()
        );
    }

    private List<String> getAvailabilityZones() {
        Map<String, List<String>> regionAzMap = new HashMap<>();
        regionAzMap.put("us-east-1", Arrays.asList("us-east-1a", "us-east-1b"));
        regionAzMap.put("us-east-2", Arrays.asList("us-east-2a", "us-east-2b"));
        regionAzMap.put("us-west-1", Arrays.asList("us-west-1a", "us-west-1c"));
        regionAzMap.put("us-west-2", Arrays.asList("us-west-2a", "us-west-2b"));
        regionAzMap.put("us-gov-east-1", Arrays.asList("us-gov-east-1a", "us-gov-east-1b"));
        regionAzMap.put("us-gov-west-1", Arrays.asList("us-gov-west-1a", "us-gov-west-1b"));
        regionAzMap.put("eu-west-1", Arrays.asList("eu-west-1a", "eu-west-1b"));
        regionAzMap.put("eu-central-1", Arrays.asList("eu-central-1a", "eu-central-1b"));
        regionAzMap.put("ap-southeast-1", Arrays.asList("ap-southeast-1a", "ap-southeast-1b"));
        regionAzMap.put("ap-northeast-1", Arrays.asList("ap-northeast-1a", "ap-northeast-1c"));

        List<String> availableAzs = regionAzMap.get(this.region);
        if (availableAzs != null) {
            return availableAzs;
        }
        return Arrays.asList(this.region + "a", this.region + "c");
    }

    private void createSubnets() {
        List<String> availableAzs = this.getAvailabilityZones();
        int numAzsToUse = Math.min(2, availableAzs.size());
        int base = this.isPrimary ? 0 : 1;
        int publicBase = 100;
        int privateBase = 120;

        for (int i = 0; i < numAzsToUse; i++) {
            String azName = availableAzs.get(i);
            String publicCidr = String.format("10.%d.%d.0/24", base, publicBase + i);
            String privateCidr = String.format("10.%d.%d.0/24", base, privateBase + i);

            Map<String, String> publicSubnetTags = new HashMap<>(this.tags);
            publicSubnetTags.put("Name", String.format("nova-public-%d-%s", i, this.regionSuffix));

            Subnet publicSubnet = new Subnet(
                String.format("public-subnet-%d-%s", i, this.regionSuffix),
                SubnetArgs.builder()
                    .vpcId(this.vpc.id())
                    .cidrBlock(publicCidr)
                    .availabilityZone(azName)
                    .mapPublicIpOnLaunch(true)
                    .tags(publicSubnetTags)
                    .build(),
                CustomResourceOptions.builder()
                    .parent(this)
                    .provider(this.provider)
                    .deleteBeforeReplace(true)
                    .build()
            );
            this.publicSubnets.add(publicSubnet);

            Map<String, String> privateSubnetTags = new HashMap<>(this.tags);
            privateSubnetTags.put("Name", String.format("nova-private-%d-%s", i, this.regionSuffix));

            Subnet privateSubnet = new Subnet(
                String.format("private-subnet-%d-%s", i, this.regionSuffix),
                SubnetArgs.builder()
                    .vpcId(this.vpc.id())
                    .cidrBlock(privateCidr)
                    .availabilityZone(azName)
                    .tags(privateSubnetTags)
                    .build(),
                CustomResourceOptions.builder()
                    .parent(this)
                    .provider(this.provider)
                    .deleteBeforeReplace(true)
                    .build()
            );
            this.privateSubnets.add(privateSubnet);
        }
    }

    private InternetGateway createInternetGateway() {
        Map<String, String> igwTags = new HashMap<>(this.tags);
        igwTags.put("Name", String.format("nova-igw-%s", this.regionSuffix));

        return new InternetGateway(String.format("igw-%s", this.regionSuffix),
            InternetGatewayArgs.builder()
                .vpcId(this.vpc.id())
                .tags(igwTags)
                .build(),
            CustomResourceOptions.builder()
                .parent(this)
                .provider(this.provider)
                .build()
        );
    }

    private void createNatGateways() {
        for (int i = 0; i < this.publicSubnets.size(); i++) {
            Subnet publicSubnet = this.publicSubnets.get(i);

            Map<String, String> eipTags = new HashMap<>(this.tags);
            eipTags.put("Name", String.format("nova-nat-eip-%d-%s", i, this.regionSuffix));

            Eip eip = new Eip(String.format("nat-eip-%d-%s", i, this.regionSuffix),
                EipArgs.builder()
                    .domain("vpc")
                    .tags(eipTags)
                    .build(),
                CustomResourceOptions.builder()
                    .parent(this)
                    .provider(this.provider)
                    .deleteBeforeReplace(true)
                    .build()
            );

            Map<String, String> natGwTags = new HashMap<>(this.tags);
            natGwTags.put("Name", String.format("nova-nat-gw-%d-%s", i, this.regionSuffix));

            NatGateway natGw = new NatGateway(String.format("nat-gw-%d-%s", i, this.regionSuffix),
                NatGatewayArgs.builder()
                    .allocationId(eip.id())
                    .subnetId(publicSubnet.id())
                    .tags(natGwTags)
                    .build(),
                CustomResourceOptions.builder()
                    .parent(this)
                    .provider(this.provider)
                    .deleteBeforeReplace(true)
                    .build()
            );
            this.natGateways.add(natGw);
        }
    }

    private RouteTable createRouteTablesAndAssociations() {
        Map<String, String> publicRtTags = new HashMap<>(this.tags);
        publicRtTags.put("Name", String.format("nova-public-rt-%s", this.regionSuffix));

        RouteTable publicRt = new RouteTable(String.format("public-rt-%s", this.regionSuffix),
            RouteTableArgs.builder()
                .vpcId(this.vpc.id())
                .tags(publicRtTags)
                .build(),
            CustomResourceOptions.builder()
                .parent(this)
                .provider(this.provider)
                .build()
        );

        new Route(String.format("public-route-%s", this.regionSuffix),
            RouteArgs.builder()
                .routeTableId(publicRt.id())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(this.igw.id())
                .build(),
            CustomResourceOptions.builder()
                .parent(this)
                .provider(this.provider)
                .build()
        );

        for (int i = 0; i < this.publicSubnets.size(); i++) {
            Subnet subnet = this.publicSubnets.get(i);
            new RouteTableAssociation(String.format("public-rt-assoc-%d-%s", i, this.regionSuffix),
                RouteTableAssociationArgs.builder()
                    .subnetId(subnet.id())
                    .routeTableId(publicRt.id())
                    .build(),
                CustomResourceOptions.builder()
                    .parent(this)
                    .provider(this.provider)
                    .build()
            );
        }

        int routeTableCount = Math.min(this.privateSubnets.size(), this.natGateways.size());
        for (int i = 0; i < routeTableCount; i++) {
            Subnet subnet = this.privateSubnets.get(i);
            NatGateway natGw = this.natGateways.get(i);

            Map<String, String> privateRtTags = new HashMap<>(this.tags);
            privateRtTags.put("Name", String.format("nova-private-rt-%d-%s", i, this.regionSuffix));

            RouteTable privateRt = new RouteTable(String.format("private-rt-%d-%s", i, this.regionSuffix),
                RouteTableArgs.builder()
                    .vpcId(this.vpc.id())
                    .tags(privateRtTags)
                    .build(),
                CustomResourceOptions.builder()
                    .parent(this)
                    .provider(this.provider)
                    .build()
            );
            this.privateRts.add(privateRt);

            new Route(String.format("private-route-%d-%s", i, this.regionSuffix),
                RouteArgs.builder()
                    .routeTableId(privateRt.id())
                    .destinationCidrBlock("0.0.0.0/0")
                    .natGatewayId(natGw.id())
                    .build(),
                CustomResourceOptions.builder()
                    .parent(this)
                    .provider(this.provider)
                    .build()
            );

            new RouteTableAssociation(String.format("private-rt-assoc-%d-%s", i, this.regionSuffix),
                RouteTableAssociationArgs.builder()
                    .subnetId(subnet.id())
                    .routeTableId(privateRt.id())
                    .build(),
                CustomResourceOptions.builder()
                    .parent(this)
                    .provider(this.provider)
                    .build()
            );
        }
        return publicRt;
    }

    private SecurityGroup createAlbSecurityGroup() {
        Map<String, String> albSgTags = new HashMap<>(this.tags);
        albSgTags.put("Name", String.format("nova-alb-sg-%s", this.regionSuffix));

        return new SecurityGroup(String.format("alb-sg-%s", this.regionSuffix),
            SecurityGroupArgs.builder()
                .description("Security group for Application Load Balancer")
                .vpcId(this.vpc.id())
                .ingress(Arrays.asList(
                    SecurityGroupIngressArgs.builder()
                        .protocol("tcp")
                        .fromPort(80)
                        .toPort(80)
                        .cidrBlocks(Arrays.asList("0.0.0.0/0"))
                        .description("HTTP from anywhere")
                        .build(),
                    SecurityGroupIngressArgs.builder()
                        .protocol("tcp")
                        .fromPort(443)
                        .toPort(443)
                        .cidrBlocks(Arrays.asList("0.0.0.0/0"))
                        .description("HTTPS from anywhere")
                        .build()
                ))
                .egress(Arrays.asList(
                    SecurityGroupEgressArgs.builder()
                        .protocol("-1")
                        .fromPort(0)
                        .toPort(0)
                        .cidrBlocks(Arrays.asList("0.0.0.0/0"))
                        .description("All outbound traffic")
                        .build()
                ))
                .tags(albSgTags)
                .build(),
            CustomResourceOptions.builder()
                .parent(this)
                .provider(this.provider)
                .build()
        );
    }

    private SecurityGroup createEbSecurityGroup() {
        Map<String, String> ebSgTags = new HashMap<>(this.tags);
        ebSgTags.put("Name", String.format("nova-eb-sg-%s", this.regionSuffix));

        return new SecurityGroup(String.format("eb-sg-%s", this.regionSuffix),
            SecurityGroupArgs.builder()
                .description("Security group for Elastic Beanstalk instances")
                .vpcId(this.vpc.id())
                .ingress(Arrays.asList(
                    SecurityGroupIngressArgs.builder()
                        .protocol("tcp")
                        .fromPort(80)
                        .toPort(80)
                        .securityGroups(
                            Output.all(this.albSecurityGroup.id()).apply(list -> Output.of(List.of((String) list.get(0))))
                        )
                        .description("HTTP from ALB")
                        .build(),
                    SecurityGroupIngressArgs.builder()
                        .protocol("tcp")
                        .fromPort(22)
                        .toPort(22)
                        .cidrBlocks(Arrays.asList(this.vpcCidr))
                        .description("SSH from VPC")
                        .build()
                ))
                .egress(Arrays.asList(
                    SecurityGroupEgressArgs.builder()
                        .protocol("-1")
                        .fromPort(0)
                        .toPort(0)
                        .cidrBlocks(Arrays.asList("0.0.0.0/0"))
                        .description("All outbound traffic")
                        .build()
                ))
                .tags(ebSgTags)
                .build(),
            CustomResourceOptions.builder()
                .parent(this)
                .provider(this.provider)
                .build()
        );
    }

    public Output<String> getVpcId() {
        return this.vpc.id();
    }

    public Output<List<String>> getPublicSubnetIds() {
        Output<String>[] ids = this.publicSubnets.stream().map(Subnet::id).toArray(Output[]::new);
        return Output.all(Arrays.asList(ids)).apply(list -> Output.of(
            list.stream().map(o -> (String) o).toList()
        ));
    }
    public Output<List<String>> getPrivateSubnetIds() {
        Output<String>[] ids = this.privateSubnets.stream().map(Subnet::id).toArray(Output[]::new);
        return Output.all(Arrays.asList(ids)).apply(list -> Output.of(
            list.stream().map(o -> (String) o).toList()
        ));
    }

    public Output<String> getAlbSecurityGroupId() {
        return this.albSecurityGroup.id();
    }

    public Output<String> getEbSecurityGroupId() {
        return this.ebSecurityGroup.id();
    }

    public Vpc getVpc() { return this.vpc; }
    public List<Subnet> getPublicSubnets() { return this.publicSubnets; }
    public List<Subnet> getPrivateSubnets() { return this.privateSubnets; }
    public List<NatGateway> getNatGateways() { return this.natGateways; }
    public InternetGateway getIgw() { return this.igw; }
    public RouteTable getPublicRt() { return this.publicRt; }
    public SecurityGroup getAlbSecurityGroup() { return this.albSecurityGroup; }
    public SecurityGroup getEbSecurityGroup() { return this.ebSecurityGroup; }
}