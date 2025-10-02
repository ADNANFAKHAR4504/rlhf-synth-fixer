package app.stacks;

import app.config.ComputeStackConfig;
import com.hashicorp.cdktf.TerraformOutput;
import com.hashicorp.cdktf.TerraformOutputConfig;
import com.hashicorp.cdktf.providers.aws.provider.AwsProviderDefaultTags;
import software.constructs.Construct;
import com.hashicorp.cdktf.TerraformStack;
import com.hashicorp.cdktf.providers.aws.provider.AwsProvider;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MainStack extends TerraformStack {

    /**
     * Creates a new MainStack with basic AWS resources.
     * 
     * @param scope The construct scope
     * @param id The construct ID
     */

    private final String stackId;

    public MainStack(final Construct scope, final String id) {
        super(scope, id);
        this.stackId = id;

        // Configure AWS Provider with default tags
        Map<String, String> defaultTags = new HashMap<>();
        defaultTags.put("Environment", "Production");
        defaultTags.put("ManagedBy", "CDKTerraform");
        defaultTags.put("Project", "ServerlessInfrastructure");
        defaultTags.put("CostCenter", "Engineering");

        // Configure AWS Provider
        AwsProvider.Builder.create(this, "aws")
                .region("us-west-2")
                .defaultTags(List.of(AwsProviderDefaultTags.builder()
                        .tags(defaultTags)
                        .build()))
                .build();

        // NetworkStack
        NetworkStack networkStack = new NetworkStack(this, "network");

        // StorageStack
        StorageStack storageStack = new StorageStack(this, "storage");

        // MonitoringStack
        MonitoringStack monitoringStack = new MonitoringStack(this, "monitoring");

        // ComputeStack
        ComputeStack computeStack = new ComputeStack(this, "compute",
                new ComputeStackConfig(networkStack, storageStack, monitoringStack));

        // ApiStack
        ApiStack apiStack = new ApiStack(this, "api", computeStack, monitoringStack);

        // Network Stack Outputs
        new TerraformOutput(this, "vpcId", TerraformOutputConfig.builder()
                .value(networkStack.getVpc().getId())
                .build());

        new TerraformOutput(this, "vpcCidr", TerraformOutputConfig.builder()
                .value(networkStack.getVpc().getCidrBlock())
                .build());

        new TerraformOutput(this, "privateSubnetAId", TerraformOutputConfig.builder()
                .value(networkStack.getPrivateSubnetA().getId())
                .build());

        new TerraformOutput(this, "privateSubnetBId", TerraformOutputConfig.builder()
                .value(networkStack.getPrivateSubnetB().getId())
                .build());

        new TerraformOutput(this, "lambdaSecurityGroupId", TerraformOutputConfig.builder()
                .value(networkStack.getLambdaSecurityGroup().getId())
                .build());

        new TerraformOutput(this, "s3EndpointId", TerraformOutputConfig.builder()
                .value(networkStack.getS3Endpoint().getId())
                .build());

        // Storage Stack Outputs
        new TerraformOutput(this, "s3BucketName", TerraformOutputConfig.builder()
                .value(storageStack.getS3Bucket().getBucket())
                .build());

        new TerraformOutput(this, "s3BucketArn", TerraformOutputConfig.builder()
                .value(storageStack.getS3Bucket().getArn())
                .build());

        new TerraformOutput(this, "dynamoTableName", TerraformOutputConfig.builder()
                .value(storageStack.getDynamoTable().getName())
                .build());

        new TerraformOutput(this, "dynamoTableArn", TerraformOutputConfig.builder()
                .value(storageStack.getDynamoTable().getArn())
                .build());

        new TerraformOutput(this, "s3KmsKeyId", TerraformOutputConfig.builder()
                .value(storageStack.getS3KmsKey().getKeyId())
                .build());

        new TerraformOutput(this, "s3KmsKeyArn", TerraformOutputConfig.builder()
                .value(storageStack.getS3KmsKey().getArn())
                .build());

        new TerraformOutput(this, "dynamoKmsKeyId", TerraformOutputConfig.builder()
                .value(storageStack.getDynamoKmsKey().getKeyId())
                .build());

        new TerraformOutput(this, "dynamoKmsKeyArn", TerraformOutputConfig.builder()
                .value(storageStack.getDynamoKmsKey().getArn())
                .build());

        // Compute Stack Outputs
        new TerraformOutput(this, "lambdaFunctionName", TerraformOutputConfig.builder()
                .value(computeStack.getLambdaFunction().getFunctionName())
                .build());

        new TerraformOutput(this, "lambdaFunctionArn", TerraformOutputConfig.builder()
                .value(computeStack.getLambdaFunction().getArn())
                .build());

        new TerraformOutput(this, "lambdaRoleArn", TerraformOutputConfig.builder()
                .value(computeStack.getLambdaRole().getArn())
                .build());

        // API Stack Outputs
        new TerraformOutput(this, "apiGatewayId", TerraformOutputConfig.builder()
                .value(apiStack.getApi().getId())
                .build());

        new TerraformOutput(this, "apiGatewayArn", TerraformOutputConfig.builder()
                .value(apiStack.getApi().getArn())
                .build());

        new TerraformOutput(this, "apiStageUrl", TerraformOutputConfig.builder()
                .value(apiStack.getStage().getInvokeUrl())
                .build());

        // Monitoring Stack Outputs
        new TerraformOutput(this, "snsTopicArn", TerraformOutputConfig.builder()
                .value(monitoringStack.getSnsTopic().getArn())
                .build());

        new TerraformOutput(this, "lambdaLogGroupName", TerraformOutputConfig.builder()
                .value(monitoringStack.getLambdaLogGroup().getName())
                .build());

        new TerraformOutput(this, "apiLogGroupName", TerraformOutputConfig.builder()
                .value(monitoringStack.getApiLogGroup().getName())
                .build());

        new TerraformOutput(this, "deadLetterQueueUrl", TerraformOutputConfig.builder()
                .value(monitoringStack.getDeadLetterQueue().getUrl())
                .build());

        new TerraformOutput(this, "logsKmsKeyId", TerraformOutputConfig.builder()
                .value(monitoringStack.getLogsKmsKey().getKeyId())
                .build());

        new TerraformOutput(this, "logsKmsKeyArn", TerraformOutputConfig.builder()
                .value(monitoringStack.getLogsKmsKey().getArn())
                .build());
    }

    public String getStackId() {
        return stackId;
    }
}