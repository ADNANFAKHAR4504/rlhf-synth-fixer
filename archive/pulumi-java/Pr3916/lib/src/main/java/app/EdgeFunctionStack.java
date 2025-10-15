package app;

import com.pulumi.Context;
import com.pulumi.asset.StringAsset;
import com.pulumi.asset.AssetArchive;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.RolePolicyAttachment;
import com.pulumi.aws.iam.RolePolicyAttachmentArgs;
import com.pulumi.aws.lambda.Function;
import com.pulumi.aws.lambda.FunctionArgs;
import com.pulumi.core.Output;

import java.util.Map;

/**
 * Lambda@Edge function stack for A/B testing.
 */
public class EdgeFunctionStack {
    private final Function edgeFunction;

    public EdgeFunctionStack(final Context ctx) {
        // Create IAM role for Lambda@Edge
        var lambdaRole = new Role("lambda-edge-role",
            RoleArgs.builder()
                .assumeRolePolicy("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Principal": {
                                    "Service": [
                                        "lambda.amazonaws.com",
                                        "edgelambda.amazonaws.com"
                                    ]
                                },
                                "Action": "sts:AssumeRole"
                            }
                        ]
                    }
                    """)
                .build());

        // Attach basic execution role
        var roleAttachment = new RolePolicyAttachment("lambda-edge-policy",
            RolePolicyAttachmentArgs.builder()
                .role(lambdaRole.name())
                .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")
                .build());

        // Create Lambda@Edge function for A/B testing
        String functionCode = """
            exports.handler = async (event) => {
                const request = event.Records[0].cf.request;
                const headers = request.headers;

                // A/B testing logic - route 50% to version A, 50% to version B
                const randomValue = Math.random();

                if (randomValue < 0.5) {
                    headers['x-experiment-variant'] = [{ key: 'X-Experiment-Variant', value: 'A' }];
                } else {
                    headers['x-experiment-variant'] = [{ key: 'X-Experiment-Variant', value: 'B' }];
                }

                return request;
            };
            """;

        this.edgeFunction = new Function("ab-testing-edge-function",
            FunctionArgs.builder()
                .runtime("nodejs20.x")
                .handler("index.handler")
                .role(lambdaRole.arn())
                .code(new AssetArchive(Map.of("index.js", new StringAsset(functionCode))))
                .publish(true)
                .tags(Map.of(
                    "Name", "ABTestingEdgeFunction",
                    "Environment", "production"
                ))
                .build());
    }

    public Function getEdgeFunction() {
        return edgeFunction;
    }

    public Output<String> getQualifiedArn() {
        return edgeFunction.qualifiedArn();
    }
}
