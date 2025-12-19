package app.constructs;

import software.constructs.Construct;
import com.hashicorp.cdktf.providers.aws.vpc.Vpc;
import com.hashicorp.cdktf.providers.aws.subnet.Subnet;
import com.hashicorp.cdktf.providers.aws.internet_gateway.InternetGateway;
import com.hashicorp.cdktf.providers.aws.nat_gateway.NatGateway;
import com.hashicorp.cdktf.providers.aws.eip.Eip;
import com.hashicorp.cdktf.providers.aws.route_table.RouteTable;
import com.hashicorp.cdktf.providers.aws.route_table_association.RouteTableAssociation;
import com.hashicorp.cdktf.providers.aws.route.Route;
import com.hashicorp.cdktf.providers.aws.flow_log.FlowLog;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroup;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import com.hashicorp.cdktf.providers.aws.iam_role_policy.IamRolePolicy;
import app.config.NetworkConfig;
import app.config.SecurityConfig;

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
                            final SecurityConfig securityConfig) {
        super(scope, id);

        // Create VPC
        this.vpc = Vpc.Builder.create(this, "vpc")
                .cidrBlock(config.vpcCidr())
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .tags(config.tags())
                .build();

        // Create Internet Gateway
        this.internetGateway = InternetGateway.Builder.create(this, "igw")
                .vpcId(vpc.getId())
                .tags(config.tags())
                .build();

        // Create Public Subnets
        this.publicSubnets = new ArrayList<>();
        for (int i = 0; i < config.publicSubnetCidrs().size(); i++) {
            Subnet subnet = Subnet.Builder.create(this, "public-subnet-" + i)
                    .vpcId(vpc.getId())
                    .cidrBlock(config.publicSubnetCidrs().get(i))
                    .availabilityZone(config.availabilityZones().get(i))
                    .mapPublicIpOnLaunch(true)
                    .tags(merge(config.tags(), Map.of("Name", "Public Subnet " + (i + 1))))
                    .build();
            publicSubnets.add(subnet);
        }

        // Create Private Subnets
        this.privateSubnets = new ArrayList<>();
        for (int i = 0; i < config.privateSubnetCidrs().size(); i++) {
            Subnet subnet = Subnet.Builder.create(this, "private-subnet-" + i)
                    .vpcId(vpc.getId())
                    .cidrBlock(config.privateSubnetCidrs().get(i))
                    .availabilityZone(config.availabilityZones().get(i))
                    .tags(merge(config.tags(), Map.of("Name", "Private Subnet " + (i + 1))))
                    .build();
            privateSubnets.add(subnet);
        }

        // Create Elastic IP for NAT Gateway
        Eip natEip = Eip.Builder.create(this, "nat-eip")
                .domain("vpc")
                .tags(config.tags())
                .build();

        // Create NAT Gateway (in first public subnet)
        this.natGateway = NatGateway.Builder.create(this, "nat-gateway")
                .allocationId(natEip.getId())
                .subnetId(publicSubnets.get(0).getId())
                .tags(config.tags())
                .build();

        // Configure routing
        configureRouting(config);

        // Setup VPC Flow Logs if enabled
        if (securityConfig.enableFlowLogs()) {
            setupVpcFlowLogs(config);
        }
    }

    private void configureRouting(final NetworkConfig config) {
        RouteTable publicRouteTable = RouteTable.Builder.create(this, "public-rt")
                .vpcId(vpc.getId())
                .tags(merge(config.tags(), Map.of("Name", "Public Route Table")))
                .build();

        Route.Builder.create(this, "public-route")
                .routeTableId(publicRouteTable.getId())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(internetGateway.getId())
                .build();

        // Associate all public subnets
        for (int i = 0; i < publicSubnets.size(); i++) {
            RouteTableAssociation.Builder.create(this, "public-rta-" + i)
                    .subnetId(publicSubnets.get(i).getId())
                    .routeTableId(publicRouteTable.getId())
                    .build();
        }

        // Private Route Table
        RouteTable privateRouteTable = RouteTable.Builder.create(this, "private-rt")
                .vpcId(vpc.getId())
                .tags(merge(config.tags(), Map.of("Name", "Private Route Table")))
                .build();

        Route.Builder.create(this, "private-route")
                .routeTableId(privateRouteTable.getId())
                .destinationCidrBlock("0.0.0.0/0")
                .natGatewayId(natGateway.getId())
                .build();

        // Associate all private subnets
        for (int i = 0; i < privateSubnets.size(); i++) {
            RouteTableAssociation.Builder.create(this, "private-rta-" + i)
                    .subnetId(privateSubnets.get(i).getId())
                    .routeTableId(privateRouteTable.getId())
                    .build();
        }
    }

    private void setupVpcFlowLogs(final NetworkConfig config) {
        CloudwatchLogGroup logGroup = CloudwatchLogGroup.Builder.create(this, "vpc-flow-logs")
                .name("/aws/vpc/flowlogs")
                .retentionInDays(7)
                .tags(config.tags())
                .build();

        String flowLogPolicy = """
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "vpc-flow-logs.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                }
                """;

        IamRole flowLogRole = IamRole.Builder.create(this, "flow-log-role")
                .name("vpc-flow-log-role")
                .assumeRolePolicy(flowLogPolicy)
                .build();

        String flowLogPolicyDocument = """
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": "*"
                        }
                    ]
                }
                """;

        IamRolePolicy.Builder.create(this, "flow-log-policy")
                .role(flowLogRole.getId())
                .policy(flowLogPolicyDocument)
                .build();

        FlowLog.Builder.create(this, "vpc-flow-log")
                .vpcId(vpc.getId())
                .trafficType("ALL")
                .logDestinationType("cloud-watch-logs")
                .logDestination(logGroup.getArn())
                .iamRoleArn(flowLogRole.getArn())
                .tags(config.tags())
                .build();
    }

    private Map<String, String> merge(final Map<String, String> map1, final Map<String, String> map2) {
        Map<String, String> result = new HashMap<>(map1);
        result.putAll(map2);
        return result;
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

    // For backward compatibility - returns first subnet
    public Subnet getPublicSubnet() {
        return publicSubnets.get(0);
    }

    public Subnet getPrivateSubnet() {
        return privateSubnets.get(0);
    }

    public InternetGateway getInternetGateway() {
        return internetGateway;
    }

    public NatGateway getNatGateway() {
        return natGateway;
    }
}
