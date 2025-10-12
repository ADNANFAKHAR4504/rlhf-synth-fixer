package app;

import app.constructs.StorageConstruct;
import app.constructs.KinesisConstruct;
import app.constructs.NetworkingConstruct;
import app.constructs.LambdaConstruct;
import app.constructs.EcsConstruct;
import com.hashicorp.cdktf.TerraformOutput;
import com.hashicorp.cdktf.TerraformOutputConfig;
import com.hashicorp.cdktf.providers.aws.data_aws_availability_zones.DataAwsAvailabilityZones;
import com.hashicorp.cdktf.providers.aws.data_aws_availability_zones.DataAwsAvailabilityZonesConfig;
import com.hashicorp.cdktf.providers.aws.provider.AwsProviderConfig;
import software.constructs.Construct;
import com.hashicorp.cdktf.TerraformStack;
import com.hashicorp.cdktf.providers.aws.provider.AwsProvider;

import java.util.List;

/**
 * CDKTF Java template stack demonstrating basic AWS infrastructure.
 */
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

        // Configure AWS Provider
        new AwsProvider(this, "aws", AwsProviderConfig.builder()
                .region("us-east-1")
                .build());

        // Create networking infrastructure
        NetworkingConstruct networking = new NetworkingConstruct(this, "networking");

        // Create Kinesis Data Stream
        KinesisConstruct kinesis = new KinesisConstruct(this, "kinesis");

        // Create S3 storage
        StorageConstruct storage = new StorageConstruct(this, "storage");

        // Create Lambda processor
        LambdaConstruct lambda = new LambdaConstruct(this, "lambda", kinesis.getStream(), storage.getBucket());

        // Create ECS infrastructure
        EcsConstruct ecs = new EcsConstruct(this, "ecs", networking.getVpc(), kinesis.getStream());

        // Output important values
        new TerraformOutput(this, "kinesis-stream-name", TerraformOutputConfig.builder()
                .value(kinesis.getStream().getName())
                .description("Name of the Kinesis Data Stream")
                .build());

        new TerraformOutput(this, "ecs-cluster-name", TerraformOutputConfig.builder()
                .value(ecs.getCluster().getName())
                .description("Name of the ECS cluster")
                .build());

        new TerraformOutput(this, "s3-bucket-name", TerraformOutputConfig.builder()
                .value(storage.getBucket().getBucket())
                .description("Name of the S3 bucket for log storage")
                .build());
    }

    public String getStackId() {
        return stackId;
    }
}