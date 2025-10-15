package app.constructs;

import com.hashicorp.cdktf.AssetType;
import com.hashicorp.cdktf.TerraformAsset;
import com.hashicorp.cdktf.TerraformAssetConfig;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroup;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroupConfig;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRoleConfig;
import com.hashicorp.cdktf.providers.aws.iam_role_policy.IamRolePolicy;
import com.hashicorp.cdktf.providers.aws.iam_role_policy.IamRolePolicyConfig;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.IamRolePolicyAttachment;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.IamRolePolicyAttachmentConfig;
import com.hashicorp.cdktf.providers.aws.kinesis_stream.KinesisStream;
import com.hashicorp.cdktf.providers.aws.lambda_event_source_mapping.LambdaEventSourceMapping;
import com.hashicorp.cdktf.providers.aws.lambda_event_source_mapping.LambdaEventSourceMappingConfig;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunction;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunctionConfig;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunctionEnvironment;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunctionTracingConfig;
import com.hashicorp.cdktf.providers.aws.s3_bucket.S3Bucket;
import software.constructs.Construct;

import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

public class LambdaConstruct extends BaseConstruct {

    private final LambdaFunction function;

    public LambdaConstruct(final Construct scope, final String id, final KinesisStream kinesisStream,
                           final S3Bucket s3Bucket) {
        super(scope, id);

        // IAM role for Lambda
        IamRole lambdaRole = new IamRole(this, "lambda-role", IamRoleConfig.builder()
                .name(getResourcePrefix() + "-lambda-role")
                .assumeRolePolicy("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Action": "sts:AssumeRole",
                                "Principal": {"Service": "lambda.amazonaws.com"},
                                "Effect": "Allow"
                            }]
                        }
                        """)
                .build());

        // Attach necessary policies
        new IamRolePolicyAttachment(this, "lambda-basic-execution",
                IamRolePolicyAttachmentConfig.builder()
                        .role(lambdaRole.getName())
                        .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")
                        .build());

        new IamRolePolicyAttachment(this, "lambda-kinesis-execution",
                IamRolePolicyAttachmentConfig.builder()
                        .role(lambdaRole.getName())
                        .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaKinesisExecutionRole")
                        .build());

        // Custom policy for S3 and CloudWatch access
        new IamRolePolicy(this, "lambda-s3-cloudwatch-policy", IamRolePolicyConfig.builder()
                .name("s3-cloudwatch-access")
                .role(lambdaRole.getId())
                .policy(String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": ["s3:PutObject", "s3:PutObjectAcl"],
                                    "Resource": "%s/*"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": ["cloudwatch:PutMetricData"],
                                    "Resource": "*",
                                    "Condition": {
                                        "StringEquals": {
                                            "cloudwatch:namespace": "LogAnalytics"
                                        }
                                    }
                                }
                            ]
                        }
                        """, s3Bucket.getArn()))
                .build());

        // CloudWatch log group
        CloudwatchLogGroup logGroup = new CloudwatchLogGroup(this, "lambda-logs",
                CloudwatchLogGroupConfig.builder()
                        .name("/aws/lambda/" + getResourcePrefix() + "-processor")
                        .retentionInDays(7)
                        .build());

        // Package Lambda function
        TerraformAsset lambdaAsset = new TerraformAsset(this, "lambda-code", TerraformAssetConfig.builder()
                .path(Paths.get("").toAbsolutePath().resolve("lib/src/main/resources/lambda").toString())
                .type(AssetType.ARCHIVE)
                .build());

        // Lambda function
        this.function = new LambdaFunction(this, "log-processor", LambdaFunctionConfig.builder()
                .functionName(getResourcePrefix() + "-log-processor")
                .filename(lambdaAsset.getPath())
                .handler("log_processor.handler")
                .runtime("python3.9")
                .role(lambdaRole.getArn())
                .memorySize(getLambdaMemory())
                .timeout(60)
                .reservedConcurrentExecutions(100)
                .environment(LambdaFunctionEnvironment.builder()
                        .variables(Map.of(
                                "S3_BUCKET", s3Bucket.getBucket(),
                                "ENVIRONMENT", getEnvironment()
                        ))
                        .build())
                .tracingConfig(LambdaFunctionTracingConfig.builder()
                        .mode("Active")
                        .build())
                .dependsOn(List.of(lambdaRole, logGroup))
                .build());

        // Event source mapping from Kinesis
        new LambdaEventSourceMapping(this, "kinesis-trigger",
                LambdaEventSourceMappingConfig.builder()
                        .eventSourceArn(kinesisStream.getArn())
                        .functionName(function.getArn())
                        .startingPosition("LATEST")
                        .parallelizationFactor(10)
                        .maximumBatchingWindowInSeconds(5)
                        .batchSize(100)
                        .maximumRecordAgeInSeconds(3600)
                        .bisectBatchOnFunctionError(true)
                        .maximumRetryAttempts(3)
                        .build());
    }

    public LambdaFunction getFunction() {
        return function;
    }
}
