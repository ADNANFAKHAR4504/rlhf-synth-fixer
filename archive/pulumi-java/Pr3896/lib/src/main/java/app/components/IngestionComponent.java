package app.components;

import com.pulumi.core.Output;
import com.pulumi.asset.FileArchive;
import com.pulumi.aws.lambda.Function;
import com.pulumi.aws.lambda.FunctionArgs;
import com.pulumi.aws.lambda.EventSourceMapping;
import com.pulumi.aws.lambda.EventSourceMappingArgs;
import com.pulumi.aws.lambda.inputs.FunctionEnvironmentArgs;

import java.util.Map;

/**
 * Ingestion component for Lambda functions.
 */
public class IngestionComponent {
    private final Function ingestionFunction;
    private final EventSourceMapping eventSourceMapping;

    /**
     * Creates Lambda ingestion infrastructure.
     *
     * @param name component name
     * @param iamComponent IAM component for roles
     * @param storageComponent storage component
     * @param streamingComponent streaming component
     * @param region AWS region
     */
    public IngestionComponent(final String name,
                              final IamComponent iamComponent,
                              final StorageComponent storageComponent,
                              final StreamingComponent streamingComponent,
                              final String region) {

        // Create Lambda function for data ingestion
        this.ingestionFunction = new Function(name + "-processor", FunctionArgs.builder()
            .runtime("python3.11")
            .handler("index.handler")
            .role(iamComponent.getLambdaRoleArn())
            .code(new FileArchive("./lambda"))
            .timeout(60)
            .memorySize(512)
            .environment(FunctionEnvironmentArgs.builder()
                .variables(storageComponent.getDataLakeBucketName().applyValue(bucket -> Map.of(
                    "S3_BUCKET", bucket
                )))
                .build())
            .tags(Map.of(
                "Component", "Ingestion",
                "Purpose", "DataProcessor",
                "Environment", "production",
                "ManagedBy", "pulumi"
            ))
            .build());

        // Create event source mapping with enhanced fan-out
        this.eventSourceMapping = new EventSourceMapping(name + "-esm",
            EventSourceMappingArgs.builder()
                .eventSourceArn(streamingComponent.getStreamArn())
                .functionName(ingestionFunction.arn())
                .startingPosition("LATEST")
                .batchSize(100)
                .maximumBatchingWindowInSeconds(5)
                .parallelizationFactor(10)
                .build());
    }

    public Output<String> getLambdaFunctionArn() {
        return ingestionFunction.arn();
    }

    public Output<String> getLambdaFunctionName() {
        return ingestionFunction.name();
    }
}
