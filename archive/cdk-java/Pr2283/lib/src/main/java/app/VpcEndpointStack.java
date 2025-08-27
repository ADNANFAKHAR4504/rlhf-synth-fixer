package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.s3.Bucket;
import software.constructs.Construct;

import java.util.Map;

public class VpcEndpointStack extends Stack {

    private final GatewayVpcEndpoint s3Endpoint;

    public VpcEndpointStack(final Construct scope, final String id, final StackProps props,
                          final Vpc vpc, final Bucket s3Bucket) {
        super(scope, id, props);

        // Create VPC endpoint for S3 in this stack
        this.s3Endpoint = GatewayVpcEndpoint.Builder.create(this, "app-vpce-s3")
                .vpc(vpc)
                .service(GatewayVpcEndpointAwsService.S3)
                .subnets(java.util.List.of(
                        SubnetSelection.builder()
                                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                                .build()
                ))
                .build();

        // Create policy for VPC endpoint with enhanced security
        PolicyStatement endpointPolicyStatement = PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .principals(java.util.List.of(new AnyPrincipal()))
                .actions(java.util.List.of(
                        "s3:GetObject",
                        "s3:GetObjectVersion",
                        "s3:PutObject",
                        "s3:ListBucket"
                ))
                .resources(java.util.List.of(
                        s3Bucket.getBucketArn(),
                        s3Bucket.getBucketArn() + "/*"
                ))
                .conditions(Map.of(
                        "StringEquals", Map.of(
                                "aws:PrincipalVpc", vpc.getVpcId()
                        )
                ))
                .build();

        // Apply endpoint policy
        s3Endpoint.addToPolicy(endpointPolicyStatement);

        this.addCommonTags();
    }

    private void addCommonTags() {
        Map<String, String> tags = Map.of(
                "Project", "CloudSecurity",
                "Environment", "Production"
        );
        tags.forEach((key, value) -> this.getNode().addMetadata(key, value));
    }

    public GatewayVpcEndpoint getS3Endpoint() {
        return s3Endpoint;
    }
}