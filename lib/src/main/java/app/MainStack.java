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
import com.hashicorp.cdktf.providers.aws.subnet.Subnet;
import software.constructs.Construct;
import com.hashicorp.cdktf.TerraformStack;
import com.hashicorp.cdktf.providers.aws.provider.AwsProvider;

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

        // Get available AZs
        DataAwsAvailabilityZones azs = new DataAwsAvailabilityZones(this, "azs",
                DataAwsAvailabilityZonesConfig.builder()
                        .state("available")
                        .build());

        // Create networking infrastructure
        NetworkingConstruct networking = new NetworkingConstruct(this, "networking", azs);

        // Create Kinesis Data Stream
        KinesisConstruct kinesis = new KinesisConstruct(this, "kinesis");

        // Create S3 storage
        StorageConstruct storage = new StorageConstruct(this, "storage");

        // Create Lambda processor
        LambdaConstruct lambda = new LambdaConstruct(this, "lambda", kinesis.getStream(), storage.getBucket());

        // Create ECS infrastructure
        EcsConstruct ecs = new EcsConstruct(this, "ecs", networking.getVpc(), kinesis.getStream());

        // Output important values for integration testing

        // Kinesis outputs
        new TerraformOutput(this, "kinesis-stream-name", TerraformOutputConfig.builder()
                .value(kinesis.getStream().getName())
                .description("Name of the Kinesis Data Stream")
                .build());

        new TerraformOutput(this, "kinesis-stream-arn", TerraformOutputConfig.builder()
                .value(kinesis.getStream().getArn())
                .description("ARN of the Kinesis Data Stream")
                .build());

        new TerraformOutput(this, "kinesis-shard-count", TerraformOutputConfig.builder()
                .value(kinesis.getStream().getShardCount().toString())
                .description("Number of shards in the Kinesis stream")
                .build());

        // S3 outputs
        new TerraformOutput(this, "s3-bucket-name", TerraformOutputConfig.builder()
                .value(storage.getBucket().getBucket())
                .description("Name of the S3 bucket for log storage")
                .build());

        new TerraformOutput(this, "s3-bucket-arn", TerraformOutputConfig.builder()
                .value(storage.getBucket().getArn())
                .description("ARN of the S3 bucket")
                .build());

        // Lambda outputs
        new TerraformOutput(this, "lambda-function-name", TerraformOutputConfig.builder()
                .value(lambda.getFunction().getFunctionName())
                .description("Name of the Lambda log processor function")
                .build());

        new TerraformOutput(this, "lambda-function-arn", TerraformOutputConfig.builder()
                .value(lambda.getFunction().getArn())
                .description("ARN of the Lambda function")
                .build());

        new TerraformOutput(this, "lambda-role-arn", TerraformOutputConfig.builder()
                .value(lambda.getFunction().getRole())
                .description("IAM role ARN for the Lambda function")
                .build());

        // ECS outputs
        new TerraformOutput(this, "ecs-cluster-name", TerraformOutputConfig.builder()
                .value(ecs.getCluster().getName())
                .description("Name of the ECS cluster")
                .build());

        new TerraformOutput(this, "ecs-cluster-arn", TerraformOutputConfig.builder()
                .value(ecs.getCluster().getArn())
                .description("ARN of the ECS cluster")
                .build());

        new TerraformOutput(this, "ecs-service-name", TerraformOutputConfig.builder()
                .value(ecs.getService().getName())
                .description("Name of the ECS service")
                .build());

        new TerraformOutput(this, "ecs-service-desired-count", TerraformOutputConfig.builder()
                .value(ecs.getService().getDesiredCount().toString())
                .description("Desired count of ECS tasks")
                .build());

        // VPC and Networking outputs
        new TerraformOutput(this, "vpc-id", TerraformOutputConfig.builder()
                .value(networking.getVpc().getId())
                .description("ID of the VPC")
                .build());

        new TerraformOutput(this, "vpc-cidr-block", TerraformOutputConfig.builder()
                .value(networking.getVpc().getCidrBlock())
                .description("CIDR block of the VPC")
                .build());

        new TerraformOutput(this, "public-subnet-ids", TerraformOutputConfig.builder()
                .value(String.join(",", networking.getPublicSubnets().stream()
                        .map(Subnet::getId)
                        .toList()))
                .description("IDs of the public subnets")
                .build());

        new TerraformOutput(this, "private-subnet-ids", TerraformOutputConfig.builder()
                .value(String.join(",", networking.getPrivateSubnets().stream()
                        .map(Subnet::getId)
                        .toList()))
                .description("IDs of the private subnets")
                .build());

        new TerraformOutput(this, "ecs-security-group-id", TerraformOutputConfig.builder()
                .value(networking.getEcsSecurityGroup().getId())
                .description("ID of the ECS security group")
                .build());
    }

    public String getStackId() {
        return stackId;
    }
}