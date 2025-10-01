package app.constructs;

import com.hashicorp.cdktf.AssetType;
import com.hashicorp.cdktf.TerraformAsset;
import com.hashicorp.cdktf.TerraformAssetConfig;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroup;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroupConfig;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunction;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunctionConfig;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunctionEnvironment;
import com.hashicorp.cdktf.providers.aws.s3_object.S3Object;
import com.hashicorp.cdktf.providers.aws.s3_object.S3ObjectConfig;
import software.constructs.Construct;

import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class LambdaConstruct extends BaseConstruct {
    private final LambdaFunction function;
    private final CloudwatchLogGroup logGroup;

    public LambdaConstruct(final Construct scope, final String id, final String roleArn, final String s3Bucket,
                           final String dynamoTableName) {
        super(scope, id);

        String functionName = resourceName("ApiHandler");

        // Create CloudWatch Log Group
        this.logGroup = new CloudwatchLogGroup(this, "lambda-logs", CloudwatchLogGroupConfig.builder()
                .name("/aws/lambda/" + functionName)
                .retentionInDays(7)
                .tags(getTagsWithName("LambdaLogGroup"))
                .build());

        // Environment variables for Lambda
        Map<String, String> envVars = new HashMap<>();
        envVars.put("DYNAMODB_TABLE", dynamoTableName);
        envVars.put("REGION", getRegion());

        // Package Lambda function
        TerraformAsset lambdaAsset = new TerraformAsset(this, "lambda-code", TerraformAssetConfig.builder()
                .path(Paths.get("").toAbsolutePath().resolve("lib/src/main/java/app/lambda").toString())
                .type(AssetType.ARCHIVE)
                .build());

        // Upload Lambda deployment package to S3
        S3Object lambdaS3Object = new S3Object(this, "lambda-deployment-package", S3ObjectConfig.builder()
                .bucket(s3Bucket)
                .key("lambda-deployments/" + functionName + System.currentTimeMillis() + ".zip")
                .source(lambdaAsset.getPath())
                .sourceHash(lambdaAsset.getAssetHash())
                .tags(getTagsWithName("LambdaDeploymentPackage"))
                .build());

        // Create Lambda function using S3 deployment package
        this.function = new LambdaFunction(this, "api-handler", LambdaFunctionConfig.builder()
                .functionName(functionName)
                .runtime(getLambdaRuntime())
                .handler(getLambdaHandler())
                .s3Bucket(s3Bucket)
                .s3Key(lambdaS3Object.getKey())
                .s3ObjectVersion(lambdaS3Object.getVersionId())
                .role(roleArn)
                .timeout(getLambdaTimeout())
                .memorySize(256)
                .environment(LambdaFunctionEnvironment.builder()
                        .variables(envVars)
                        .build())
                .tags(getTagsWithName("ApiHandler"))
                .dependsOn(List.of(logGroup, lambdaS3Object))
                .build());
    }

    public String getFunctionArn() {
        return function.getArn();
    }

    public String getFunctionInvokeArn() {
        return function.getInvokeArn();
    }

    public String getFunctionName() {
        return function.getFunctionName();
    }

    public String getLogGroupName() {
        return logGroup.getName();
    }
}
