package app.stacks;

import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroup;
import com.hashicorp.cdktf.providers.aws.security_group_rule.SecurityGroupRule;
import com.hashicorp.cdktf.providers.aws.subnet.Subnet;
import com.hashicorp.cdktf.providers.aws.vpc.Vpc;
import com.hashicorp.cdktf.providers.aws.vpc_endpoint.VpcEndpoint;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class NetworkStack {

    private final Vpc vpc;

    private final Subnet privateSubnetA;

    private final Subnet privateSubnetB;

    private final SecurityGroup lambdaSecurityGroup;

    private final VpcEndpoint s3Endpoint;

    public NetworkStack(final Construct scope, final String id) {

        // Create VPC with private subnets only for Lambda
        this.vpc = Vpc.Builder.create(scope, id + "-vpc")
                .cidrBlock("10.0.0.0/16")
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .tags(Map.of(
                        "Name", "serverless-vpc",
                        "Type", "Private"
                ))
                .build();

        // Create private subnets for Lambda
        this.privateSubnetA = Subnet.Builder.create(scope, id + "-private-subnet-a")
                .vpcId(vpc.getId())
                .cidrBlock("10.0.1.0/24")
                .availabilityZone("us-west-2a")
                .mapPublicIpOnLaunch(false)
                .tags(Map.of("Name", "private-subnet-a"))
                .build();

        this.privateSubnetB = Subnet.Builder.create(scope, id + "-private-subnet-b")
                .vpcId(vpc.getId())
                .cidrBlock("10.0.2.0/24")
                .availabilityZone("us-west-2b")
                .mapPublicIpOnLaunch(false)
                .tags(Map.of("Name", "private-subnet-b"))
                .build();

        // Create VPC Endpoint for S3
        this.s3Endpoint = VpcEndpoint.Builder.create(scope, id + "-s3-endpoint")
                .vpcId(vpc.getId())
                .serviceName("com.amazonaws.us-west-2.s3")
                .vpcEndpointType("Gateway")
                .routeTableIds(List.of(
                        vpc.getMainRouteTableId()
                ))
                .tags(Map.of("Name", "s3-vpc-endpoint"))
                .build();

        // Create Security Group for Lambda
        this.lambdaSecurityGroup = SecurityGroup.Builder.create(scope, id + "-lambda-sg")
                .vpcId(vpc.getId())
                .name("lambda-security-group")
                .description("Security group for Lambda function")
                .tags(Map.of("Name", "lambda-sg"))
                .build();

        // Allow outbound HTTPS traffic
        SecurityGroupRule.Builder.create(scope, id + "-lambda-sg-egress")
                .type("egress")
                .fromPort(443)
                .toPort(443)
                .protocol("tcp")
                .cidrBlocks(List.of("0.0.0.0/0"))
                .securityGroupId(lambdaSecurityGroup.getId())
                .build();
    }

    // Getters
    public Vpc getVpc() {
        return vpc;
    }

    public Subnet getPrivateSubnetA() {
        return privateSubnetA;
    }

    public Subnet getPrivateSubnetB() {
        return privateSubnetB;
    }

    public SecurityGroup getLambdaSecurityGroup() {
        return lambdaSecurityGroup;
    }

    public VpcEndpoint getS3Endpoint() {
        return s3Endpoint;
    }
}
