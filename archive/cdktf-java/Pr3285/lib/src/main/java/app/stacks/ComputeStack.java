package app.stacks;

import app.config.ComputeStackConfig;
import com.hashicorp.cdktf.AssetType;
import com.hashicorp.cdktf.TerraformAsset;
import com.hashicorp.cdktf.TerraformAssetConfig;
import com.hashicorp.cdktf.providers.aws.cloudwatch_event_rule.CloudwatchEventRule;
import com.hashicorp.cdktf.providers.aws.cloudwatch_event_target.CloudwatchEventTarget;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import com.hashicorp.cdktf.providers.aws.iam_role_policy.IamRolePolicy;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.IamRolePolicyAttachment;
import com.hashicorp.cdktf.providers.aws.kms_key.KmsKey;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunction;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunctionEnvironment;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunctionDeadLetterConfig;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunctionTracingConfig;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunctionVpcConfig;
import com.hashicorp.cdktf.providers.aws.lambda_permission.LambdaPermission;
import software.constructs.Construct;

import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ComputeStack {

    private final LambdaFunction lambdaFunction;

    private final IamRole lambdaRole;

    private final StorageStack storage;

    private final NetworkStack network;

    private final MonitoringStack monitoring;

    public ComputeStack(final Construct scope, final String id, final ComputeStackConfig config) {

        this.storage = config.storage();
        this.network = config.network();
        this.monitoring = config.monitoring();

        // Create KMS key for Lambda environment variables
        KmsKey lambdaKmsKey = KmsKey.Builder.create(scope, id + "-lambda-kms-key")
                .description("KMS key for Lambda environment variables")
                .enableKeyRotation(true)
                .tags(Map.of("Name", "lambda-encryption-key"))
                .build();

        // Create IAM role for Lambda with least privilege
        String assumeRolePolicy = """
                {
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }]
                }
                """;

        this.lambdaRole = IamRole.Builder.create(scope, id + "-lambda-role")
                .name("serverless-lambda-role")
                .assumeRolePolicy(assumeRolePolicy)
                .tags(Map.of("Name", "lambda-execution-role"))
                .build();

        // Attach VPC execution policy
        IamRolePolicyAttachment.Builder.create(scope, id + "-lambda-vpc-policy")
                .role(lambdaRole.getName())
                .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole")
                .build();

        // Custom policy for S3, DynamoDB, and SNS access
        String customPolicy = createLambdaCustomPolicy(lambdaKmsKey);

        IamRolePolicy.Builder.create(scope, id + "-lambda-custom-policy")
                .name("serverless-lambda-custom-policy")
                .role(lambdaRole.getId())
                .policy(customPolicy)
                .build();

        this.lambdaFunction = createLambdaFunction(scope, id, lambdaKmsKey);

        // Create CloudWatch Event Rule for scheduled execution
        CloudwatchEventRule scheduledRule = CloudwatchEventRule.Builder.create(scope, id + "-scheduled-rule")
                .name("lambda-daily-trigger")
                .description("Trigger Lambda every 24 hours")
                .scheduleExpression("rate(24 hours)")
                .tags(Map.of("Name", "daily-trigger"))
                .build();

        // Add Lambda as target
        CloudwatchEventTarget.Builder.create(scope, id + "-scheduled-target")
                .rule(scheduledRule.getName())
                .targetId("lambda-target")
                .arn(lambdaFunction.getArn())
                .build();

        createLambdaPermission(scheduledRule, scope, id);
    }

    private String createLambdaCustomPolicy(final KmsKey lambdaKmsKey) {
        return String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "s3:GetObject",
                                        "s3:ListBucket"
                                    ],
                                    "Resource": [
                                        "%s",
                                        "%s/*"
                                    ]
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "dynamodb:GetItem",
                                        "dynamodb:PutItem",
                                        "dynamodb:Query",
                                        "dynamodb:UpdateItem",
                                        "dynamodb:DeleteItem",
                                        "dynamodb:BatchGetItem",
                                        "dynamodb:BatchWriteItem"
                                    ],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "sns:Publish"
                                    ],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "sqs:SendMessage"
                                    ],
                                    "Resource": "%s"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "kms:Decrypt",
                                        "kms:DescribeKey",
                                        "kms:GenerateDataKey"
                                    ],
                                    "Resource": [
                                        "%s",
                                        "%s",
                                        "%s"
                                    ]
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "logs:CreateLogGroup",
                                        "logs:CreateLogStream",
                                        "logs:PutLogEvents"
                                    ],
                                    "Resource": "arn:aws:logs:us-west-2:*:*"
                                }
                            ]
                        }
                        """,
                storage.getS3Bucket().getArn(),
                storage.getS3Bucket().getArn(),
                storage.getDynamoTable().getArn(),
                monitoring.getSnsTopic().getArn(),
                monitoring.getDeadLetterQueue().getArn(),
                storage.getS3KmsKey().getArn(),
                storage.getDynamoKmsKey().getArn(),
                lambdaKmsKey.getArn()
        );
    }

    private LambdaFunction createLambdaFunction(final Construct scope, final String id, final KmsKey lambdaKmsKey) {

        // Package Lambda function
        TerraformAsset lambdaAsset = new TerraformAsset(scope, "lambda-code", TerraformAssetConfig.builder()
                .path(Paths.get("").toAbsolutePath().resolve("lib/src/main/java/app/lambda").toString())
                .type(AssetType.ARCHIVE)
                .build());

        // Environment variables
        Map<String, String> envVars = new HashMap<>();
        envVars.put("S3_BUCKET_NAME", storage.getS3Bucket().getBucket());
        envVars.put("DYNAMODB_TABLE_NAME", storage.getDynamoTable().getName());
        envVars.put("SNS_TOPIC_ARN", monitoring.getSnsTopic().getArn());
        envVars.put("REGION", "us-west-2");

        // Create Lambda function
        return LambdaFunction.Builder.create(scope, id + "-function")
                .functionName("serverless-processor")
                .runtime("python3.8")
                .handler("handler.lambda_handler")
                .filename(lambdaAsset.getPath())
                .sourceCodeHash(lambdaAsset.getAssetHash())
                .role(lambdaRole.getArn())
                .timeout(60)
                .memorySize(512)
                .environment(LambdaFunctionEnvironment.builder()
                        .variables(envVars)
                        .build())
                .vpcConfig(LambdaFunctionVpcConfig.builder()
                        .subnetIds(Arrays.asList(
                                network.getPrivateSubnetA().getId(),
                                network.getPrivateSubnetB().getId()
                        ))
                        .securityGroupIds(List.of(
                                network.getLambdaSecurityGroup().getId()
                        ))
                        .build())
                .kmsKeyArn(lambdaKmsKey.getArn())
                .tracingConfig(LambdaFunctionTracingConfig.builder()
                        .mode("Active")
                        .build())
                .deadLetterConfig(LambdaFunctionDeadLetterConfig.builder()
                        .targetArn(monitoring.getDeadLetterQueue().getArn())
                        .build())
                .reservedConcurrentExecutions(100)
                .tags(Map.of(
                        "Name", "serverless-processor",
                        "Type", "Compute"
                ))
                .build();
    }

    private void createLambdaPermission(final CloudwatchEventRule scheduledRule, final Construct scope, final String id) {

        // Grant permission for EventBridge to invoke Lambda
        LambdaPermission.Builder.create(scope, id + "-eventbridge-permission")
                .statementId("AllowExecutionFromEventBridge")
                .action("lambda:InvokeFunction")
                .functionName(lambdaFunction.getFunctionName())
                .principal("events.amazonaws.com")
                .sourceArn(scheduledRule.getArn())
                .build();
    }

    // Getters
    public LambdaFunction getLambdaFunction() {
        return lambdaFunction;
    }

    public IamRole getLambdaRole() {
        return lambdaRole;
    }
}
