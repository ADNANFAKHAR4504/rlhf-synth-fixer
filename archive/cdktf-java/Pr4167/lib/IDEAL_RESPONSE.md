```java
package app;

import com.hashicorp.cdktf.S3Backend;
import com.hashicorp.cdktf.S3BackendConfig;

import com.hashicorp.cdktf.App;


public final class Main {

    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        final App app = new App();

        MainStack stack = new MainStack(app, "log-analytics-platform");

        /*
         * Configures S3 backend for remote Terraform state storage.
         */
        new S3Backend(stack, S3BackendConfig.builder()
                .bucket(System.getenv("TERRAFORM_STATE_BUCKET"))
                .key("prs/" + System.getenv("ENVIRONMENT_SUFFIX") + "/" + stack.getStackId() + ".tfstate")
                .region(System.getenv("TERRAFORM_STATE_BUCKET_REGION"))
                .encrypt(true)
                .build());

        app.synth();
    }
}
```

```java
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
```

```java
package app.config;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public record Config(String environment, String vpcCidrBlock, List<String> publicSubnetCidrs,
                     List<String> privateSubnetCidrs, String containerImage, Integer kinesisShards,
                     Integer lambdaMemory, String projectName, Map<String, String> tags) {
    public static Config defaultConfig() {
        return new Config("development", "10.0.0.0/16", List.of("10.0.0.0/24", "10.0.2.0/24"),
                List.of("10.0.1.0/24", "10.0.3.0/24"), "nginx:latest", 10, 512, "log-analytics",
                Map.of(
                        "Environment", "development",
                        "ManagedBy", "CDK For Terraform",
                        "Project", "Log Analytics",
                        "CreatedAt", new Date().toString()
                )
        );
    }

    public Map<String, String> mergeWithTags(final Map<String, String> additionalTags) {
        var merged = new HashMap<>(this.tags);
        merged.putAll(additionalTags);
        return Map.copyOf(merged);
    }
}
```

```java
package app.constructs;

import app.config.Config;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class BaseConstruct extends Construct {

    private final Config config;

    public BaseConstruct(final Construct scope, final String id) {
        super(scope, id);
        this.config = Config.defaultConfig();
    }

    protected Map<String, String> mergeTags(final Map<String, String> additionalTags) {
        return config.mergeWithTags(additionalTags);
    }

    protected String getEnvironment() {
        return config.environment();
    }

    protected String projectName() {
        return config.projectName();
    }

    protected String getVpcCidrBlock() {
        return config.vpcCidrBlock();
    }

    protected List<String> getPublicSubnetCidrs() {
        return config.publicSubnetCidrs();
    }

    protected List<String> getPrivateSubnetCidrs() {
        return config.privateSubnetCidrs();
    }

    protected String getContainerImage() {
        return config.containerImage();
    }

    protected Integer getLambdaMemory() {
        return config.lambdaMemory();
    }

    protected Integer getKinesisShards() {
        return config.kinesisShards();
    }

    protected String getResourcePrefix() {
        return String.format("%s-%s", config.projectName(), config.environment());
    }

    protected Map<String, String> getTags() {
        return config.tags();
    }
}
```

```java
package app.constructs;

import com.hashicorp.cdktf.providers.aws.s3_bucket.S3Bucket;
import com.hashicorp.cdktf.providers.aws.s3_bucket.S3BucketConfig;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfiguration;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationConfig;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRule;
import com.hashicorp.cdktf.providers.aws.s3_bucket_lifecycle_configuration.S3BucketLifecycleConfigurationRuleTransition;
import com.hashicorp.cdktf.providers.aws.s3_bucket_public_access_block.S3BucketPublicAccessBlock;
import com.hashicorp.cdktf.providers.aws.s3_bucket_public_access_block.S3BucketPublicAccessBlockConfig;
import com.hashicorp.cdktf.providers.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationAConfig;
import com.hashicorp.cdktf.providers.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRuleA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_server_side_encryption_configuration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningA;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningAConfig;
import com.hashicorp.cdktf.providers.aws.s3_bucket_versioning.S3BucketVersioningVersioningConfiguration;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class StorageConstruct extends BaseConstruct {

    private final S3Bucket bucket;

    public StorageConstruct(final Construct scope, final String id) {
        super(scope, id);

        // S3 bucket for long-term storage
        this.bucket = new S3Bucket(this, "log-bucket", S3BucketConfig.builder()
                .bucket(getResourcePrefix() + "-logs-" + System.currentTimeMillis())
                .tags(mergeTags(Map.of(
                        "Name", getResourcePrefix() + "-logs",
                        "Purpose", "Long-term log storage"
                )))
                .build());

        // Bucket versioning
        new S3BucketVersioningA(this, "bucket-versioning", S3BucketVersioningAConfig.builder()
                .bucket(bucket.getId())
                .versioningConfiguration(S3BucketVersioningVersioningConfiguration.builder()
                        .status("Enabled")
                        .build())
                .build());

        // Server-side encryption
        new S3BucketServerSideEncryptionConfigurationA(this, "bucket-encryption",
                S3BucketServerSideEncryptionConfigurationAConfig.builder()
                        .bucket(bucket.getId())
                        .rule(List.of(S3BucketServerSideEncryptionConfigurationRuleA.builder()
                                .applyServerSideEncryptionByDefault(
                                        S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA.builder()
                                                .sseAlgorithm("AES256")
                                                .build())
                                .build()))
                        .build());

        // Lifecycle rules for cost optimization
        new S3BucketLifecycleConfiguration(this, "bucket-lifecycle",
                S3BucketLifecycleConfigurationConfig.builder()
                        .bucket(bucket.getId())
                        .rule(List.of(S3BucketLifecycleConfigurationRule.builder()
                                .id("archive-old-logs")
                                .status("Enabled")
                                .transition(List.of(
                                        S3BucketLifecycleConfigurationRuleTransition.builder()
                                                .days(30)
                                                .storageClass("STANDARD_IA")
                                                .build(),
                                        S3BucketLifecycleConfigurationRuleTransition.builder()
                                                .days(90)
                                                .storageClass("GLACIER")
                                                .build()
                                ))
                                .build()))
                        .build());

        // Block public access
        new S3BucketPublicAccessBlock(this, "bucket-pab", S3BucketPublicAccessBlockConfig.builder()
                .bucket(bucket.getId())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build());
    }

    public S3Bucket getBucket() {
        return bucket;
    }
}
```

```java
package app.constructs;

import com.hashicorp.cdktf.providers.aws.kinesis_stream.KinesisStream;
import com.hashicorp.cdktf.providers.aws.kinesis_stream.KinesisStreamConfig;
import com.hashicorp.cdktf.providers.aws.kinesis_stream.KinesisStreamStreamModeDetails;
import software.constructs.Construct;

import java.util.Map;

public class KinesisConstruct extends BaseConstruct {

    private final KinesisStream stream;

    public KinesisConstruct(final Construct scope, final String id) {
        super(scope, id);

        this.stream = new KinesisStream(this, "log-stream", KinesisStreamConfig.builder()
                .name(getResourcePrefix() + "-log-stream")
                .shardCount(getKinesisShards())
                .retentionPeriod(24)
                .encryptionType("KMS")
                .kmsKeyId("alias/aws/kinesis")
                .shardLevelMetrics(java.util.List.of(
                        "IncomingBytes",
                        "IncomingRecords",
                        "OutgoingBytes",
                        "OutgoingRecords"
                ))
                .streamModeDetails(KinesisStreamStreamModeDetails.builder()
                        .streamMode("PROVISIONED")
                        .build())
                .tags(mergeTags(Map.of(
                        "Name", getResourcePrefix() + "-log-stream",
                        "Purpose", "Real-time log ingestion"
                )))
                .build());
    }

    public KinesisStream getStream() {
        return stream;
    }
}
```

```java
package app.constructs;

import com.hashicorp.cdktf.Fn;
import com.hashicorp.cdktf.providers.aws.data_aws_availability_zones.DataAwsAvailabilityZones;
import com.hashicorp.cdktf.providers.aws.eip.Eip;
import com.hashicorp.cdktf.providers.aws.eip.EipConfig;
import com.hashicorp.cdktf.providers.aws.internet_gateway.InternetGateway;
import com.hashicorp.cdktf.providers.aws.internet_gateway.InternetGatewayConfig;
import com.hashicorp.cdktf.providers.aws.nat_gateway.NatGateway;
import com.hashicorp.cdktf.providers.aws.nat_gateway.NatGatewayConfig;
import com.hashicorp.cdktf.providers.aws.route.Route;
import com.hashicorp.cdktf.providers.aws.route.RouteConfig;
import com.hashicorp.cdktf.providers.aws.route_table.RouteTable;
import com.hashicorp.cdktf.providers.aws.route_table.RouteTableConfig;
import com.hashicorp.cdktf.providers.aws.route_table_association.RouteTableAssociation;
import com.hashicorp.cdktf.providers.aws.route_table_association.RouteTableAssociationConfig;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroup;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroupConfig;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroupEgress;
import com.hashicorp.cdktf.providers.aws.subnet.Subnet;
import com.hashicorp.cdktf.providers.aws.subnet.SubnetConfig;
import com.hashicorp.cdktf.providers.aws.vpc.Vpc;
import com.hashicorp.cdktf.providers.aws.vpc.VpcConfig;
import software.constructs.Construct;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class NetworkingConstruct extends BaseConstruct {

    private final Vpc vpc;

    private final List<Subnet> publicSubnets;

    private final List<Subnet> privateSubnets;

    private final SecurityGroup ecsSecurityGroup;

    public NetworkingConstruct(final Construct scope, final String id, final DataAwsAvailabilityZones azs) {
        super(scope, id);

        // Create VPC
        this.vpc = new Vpc(this, "vpc", VpcConfig.builder()
                .cidrBlock(getVpcCidrBlock())
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-vpc")))
                .build());

        // Create Internet Gateway
        InternetGateway igw = new InternetGateway(this, "igw", InternetGatewayConfig.builder()
                .vpcId(vpc.getId())
                .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-igw")))
                .build());

        // Create public and private subnets in 2 AZs for high availability
        // Using Fn.element() to access AZ names from the token list
        this.publicSubnets = new ArrayList<>();
        this.privateSubnets = new ArrayList<>();

        // AZ 1 - Public Subnet
        Subnet publicSubnet0 = new Subnet(this, "public-subnet-0", SubnetConfig.builder()
                .vpcId(vpc.getId())
                .cidrBlock(getPublicSubnetCidrs().get(0))
                .availabilityZone((String) Fn.element(azs.getNames(), 0))
                .mapPublicIpOnLaunch(true)
                .tags(mergeTags(Map.of(
                        "Name", getResourcePrefix() + "-public-subnet-1",
                        "Type", "Public"
                )))
                .build());
        publicSubnets.add(publicSubnet0);

        // AZ 1 - Private Subnet
        Subnet privateSubnet0 = new Subnet(this, "private-subnet-0", SubnetConfig.builder()
                .vpcId(vpc.getId())
                .cidrBlock(getPrivateSubnetCidrs().get(0))
                .availabilityZone((String) Fn.element(azs.getNames(), 0))
                .tags(mergeTags(Map.of(
                        "Name", getResourcePrefix() + "-private-subnet-1",
                        "Type", "Private"
                )))
                .build());
        privateSubnets.add(privateSubnet0);

        // AZ 2 - Public Subnet
        Subnet publicSubnet1 = new Subnet(this, "public-subnet-1", SubnetConfig.builder()
                .vpcId(vpc.getId())
                .cidrBlock(getPublicSubnetCidrs().get(1))
                .availabilityZone((String) Fn.element(azs.getNames(), 1))
                .mapPublicIpOnLaunch(true)
                .tags(mergeTags(Map.of(
                        "Name", getResourcePrefix() + "-public-subnet-2",
                        "Type", "Public"
                )))
                .build());
        publicSubnets.add(publicSubnet1);

        // AZ 2 - Private Subnet
        Subnet privateSubnet1 = new Subnet(this, "private-subnet-1", SubnetConfig.builder()
                .vpcId(vpc.getId())
                .cidrBlock(getPrivateSubnetCidrs().get(1))
                .availabilityZone((String) Fn.element(azs.getNames(), 1))
                .tags(mergeTags(Map.of(
                        "Name", getResourcePrefix() + "-private-subnet-2",
                        "Type", "Private"
                )))
                .build());
        privateSubnets.add(privateSubnet1);

        // NAT Gateway for AZ 1
        Eip natEip0 = new Eip(this, "nat-eip-0", EipConfig.builder()
                .domain("vpc")
                .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-nat-eip-1")))
                .build());

        NatGateway natGw0 = new NatGateway(this, "nat-gw-0", NatGatewayConfig.builder()
                .allocationId(natEip0.getId())
                .subnetId(publicSubnet0.getId())
                .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-nat-gw-1")))
                .build());

        // Route table for AZ 1 private subnet
        RouteTable privateRt0 = new RouteTable(this, "private-rt-0", RouteTableConfig.builder()
                .vpcId(vpc.getId())
                .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-private-rt-1")))
                .build());

        new Route(this, "private-route-0", RouteConfig.builder()
                .routeTableId(privateRt0.getId())
                .destinationCidrBlock("0.0.0.0/0")
                .natGatewayId(natGw0.getId())
                .build());

        new RouteTableAssociation(this, "private-rta-0", RouteTableAssociationConfig.builder()
                .subnetId(privateSubnet0.getId())
                .routeTableId(privateRt0.getId())
                .build());

        // NAT Gateway for AZ 2
        Eip natEip1 = new Eip(this, "nat-eip-1", EipConfig.builder()
                .domain("vpc")
                .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-nat-eip-2")))
                .build());

        NatGateway natGw1 = new NatGateway(this, "nat-gw-1", NatGatewayConfig.builder()
                .allocationId(natEip1.getId())
                .subnetId(publicSubnet1.getId())
                .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-nat-gw-2")))
                .build());

        // Route table for AZ 2 private subnet
        RouteTable privateRt1 = new RouteTable(this, "private-rt-1", RouteTableConfig.builder()
                .vpcId(vpc.getId())
                .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-private-rt-2")))
                .build());

        new Route(this, "private-route-1", RouteConfig.builder()
                .routeTableId(privateRt1.getId())
                .destinationCidrBlock("0.0.0.0/0")
                .natGatewayId(natGw1.getId())
                .build());

        new RouteTableAssociation(this, "private-rta-1", RouteTableAssociationConfig.builder()
                .subnetId(privateSubnet1.getId())
                .routeTableId(privateRt1.getId())
                .build());

        // Public route table (shared by both AZs)
        RouteTable publicRt = new RouteTable(this, "public-rt", RouteTableConfig.builder()
                .vpcId(vpc.getId())
                .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-public-rt")))
                .build());

        new Route(this, "public-route", RouteConfig.builder()
                .routeTableId(publicRt.getId())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(igw.getId())
                .build());

        // Associate public subnets with public route table
        new RouteTableAssociation(this, "public-rta-0", RouteTableAssociationConfig.builder()
                .subnetId(publicSubnet0.getId())
                .routeTableId(publicRt.getId())
                .build());

        new RouteTableAssociation(this, "public-rta-1", RouteTableAssociationConfig.builder()
                .subnetId(publicSubnet1.getId())
                .routeTableId(publicRt.getId())
                .build());

        // ECS Security Group
        this.ecsSecurityGroup = new SecurityGroup(this, "ecs-sg", SecurityGroupConfig.builder()
                .name(getResourcePrefix() + "-ecs-sg")
                .description("Security group for ECS tasks")
                .vpcId(vpc.getId())
                .egress(List.of(SecurityGroupEgress.builder()
                        .fromPort(0)
                        .toPort(0)
                        .protocol("-1")
                        .cidrBlocks(List.of("0.0.0.0/0"))
                        .build()))
                .tags(mergeTags(Map.of("Name", getResourcePrefix() + "-ecs-sg")))
                .build());
    }

    // Getters
    public Vpc getVpc() {
        return vpc;
    }

    public List<Subnet> getPublicSubnets() {
        return publicSubnets;
    }

    public List<Subnet> getPrivateSubnets() {
        return privateSubnets;
    }

    public SecurityGroup getEcsSecurityGroup() {
        return ecsSecurityGroup;
    }
}
```

```java
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
```

```java
package app.constructs;

import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroup;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroupConfig;
import com.hashicorp.cdktf.providers.aws.ecs_cluster.EcsCluster;
import com.hashicorp.cdktf.providers.aws.ecs_cluster.EcsClusterConfig;
import com.hashicorp.cdktf.providers.aws.ecs_cluster.EcsClusterSetting;
import com.hashicorp.cdktf.providers.aws.ecs_service.EcsService;
import com.hashicorp.cdktf.providers.aws.ecs_service.EcsServiceConfig;
import com.hashicorp.cdktf.providers.aws.ecs_service.EcsServiceDeploymentCircuitBreaker;
import com.hashicorp.cdktf.providers.aws.ecs_service.EcsServiceNetworkConfiguration;
import com.hashicorp.cdktf.providers.aws.ecs_task_definition.EcsTaskDefinition;
import com.hashicorp.cdktf.providers.aws.ecs_task_definition.EcsTaskDefinitionConfig;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRoleConfig;
import com.hashicorp.cdktf.providers.aws.iam_role_policy.IamRolePolicy;
import com.hashicorp.cdktf.providers.aws.iam_role_policy.IamRolePolicyConfig;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.IamRolePolicyAttachment;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.IamRolePolicyAttachmentConfig;
import com.hashicorp.cdktf.providers.aws.kinesis_stream.KinesisStream;
import com.hashicorp.cdktf.providers.aws.subnet.Subnet;
import com.hashicorp.cdktf.providers.aws.vpc.Vpc;
import software.constructs.Construct;

import java.util.List;

public class EcsConstruct extends BaseConstruct {

    private final EcsCluster cluster;

    private final EcsService service;

    public EcsConstruct(final Construct scope, final String id, final Vpc vpc, final KinesisStream kinesisStream) {
        super(scope, id);

        // ECS Cluster
        this.cluster = new EcsCluster(this, "ecs-cluster", EcsClusterConfig.builder()
                .name(getResourcePrefix() + "-cluster")
                .setting(List.of(EcsClusterSetting.builder()
                        .name("containerInsights")
                        .value("enabled")
                        .build()))
                .build());

        // Task execution role
        IamRole taskExecutionRole = new IamRole(this, "task-execution-role",
                IamRoleConfig.builder()
                        .name(getResourcePrefix() + "-ecs-task-execution-role")
                        .assumeRolePolicy("""
                                {
                                    "Version": "2012-10-17",
                                    "Statement": [{
                                        "Action": "sts:AssumeRole",
                                        "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                                        "Effect": "Allow"
                                    }]
                                }
                                """)
                        .build());

        new IamRolePolicyAttachment(this, "task-execution-policy",
                IamRolePolicyAttachmentConfig.builder()
                        .role(taskExecutionRole.getName())
                        .policyArn("arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy")
                        .build());

        // Task role
        IamRole taskRole = new IamRole(this, "task-role", IamRoleConfig.builder()
                .name(getResourcePrefix() + "-ecs-task-role")
                .assumeRolePolicy("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Action": "sts:AssumeRole",
                                "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                                "Effect": "Allow"
                            }]
                        }
                        """)
                .build());

        // Kinesis access policy for task
        new IamRolePolicy(this, "task-kinesis-policy", IamRolePolicyConfig.builder()
                .name("kinesis-access")
                .role(taskRole.getId())
                .policy(String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Effect": "Allow",
                                "Action": [
                                    "kinesis:DescribeStream",
                                    "kinesis:GetShardIterator",
                                    "kinesis:GetRecords",
                                    "kinesis:ListShards",
                                    "kinesis:PutRecord",
                                    "kinesis:PutRecords"
                                ],
                                "Resource": "%s"
                            }]
                        }
                        """, kinesisStream.getArn()))
                .build());

        // CloudWatch log group for ECS
        CloudwatchLogGroup logGroup = new CloudwatchLogGroup(this, "ecs-logs",
                CloudwatchLogGroupConfig.builder()
                        .name("/ecs/" + getResourcePrefix() + "-log-processor")
                        .retentionInDays(7)
                        .build());

        // Task definition
        EcsTaskDefinition taskDefinition = new EcsTaskDefinition(this, "task-def",
                EcsTaskDefinitionConfig.builder()
                        .family(getResourcePrefix() + "-log-processor")
                        .requiresCompatibilities(List.of("FARGATE"))
                        .networkMode("awsvpc")
                        .cpu("1024")
                        .memory("2048")
                        .executionRoleArn(taskExecutionRole.getArn())
                        .taskRoleArn(taskRole.getArn())
                        .containerDefinitions(String.format("""
                                        [
                                            {
                                                "name": "log-processor",
                                                "image": "%s",
                                                "essential": true,
                                                "environment": [
                                                    {"name": "KINESIS_STREAM", "value": "%s"},
                                                    {"name": "ENVIRONMENT", "value": "%s"}
                                                ],
                                                "logConfiguration": {
                                                    "logDriver": "awslogs",
                                                    "options": {
                                                        "awslogs-group": "%s",
                                                        "awslogs-region": "us-east-1",
                                                        "awslogs-stream-prefix": "ecs"
                                                    }
                                                },
                                                "healthCheck": {
                                                    "command": ["CMD-SHELL", "echo healthy"],
                                                    "interval": 30,
                                                    "timeout": 5,
                                                    "retries": 3,
                                                    "startPeriod": 60
                                                }
                                            }
                                        ]
                                        """,
                                getContainerImage(),
                                kinesisStream.getName(),
                                getEnvironment(),
                                logGroup.getName()))
                        .build());

        // ECS Service
        NetworkingConstruct networking = (NetworkingConstruct) scope.getNode().tryFindChild("networking");

        assert networking != null;
        this.service = new EcsService(this, "ecs-service", EcsServiceConfig.builder()
                .name(getResourcePrefix() + "-log-processor-service")
                .cluster(cluster.getId())
                .taskDefinition(taskDefinition.getArn())
                .desiredCount(2) // Multi-AZ deployment
                .launchType("FARGATE")
                .platformVersion("LATEST")
                .networkConfiguration(EcsServiceNetworkConfiguration.builder()
                        .subnets(networking.getPrivateSubnets().stream()
                                .map(Subnet::getId)
                                .toList())
                        .securityGroups(List.of(networking.getEcsSecurityGroup().getId()))
                        .assignPublicIp(false)
                        .build())
                .deploymentMaximumPercent(200)
                .deploymentMinimumHealthyPercent(100)
                .deploymentCircuitBreaker(EcsServiceDeploymentCircuitBreaker.builder()
                        .enable(true)
                        .rollback(true)
                        .build())
                .enableEcsManagedTags(true)
                .propagateTags("TASK_DEFINITION")
                .build());
    }

    public EcsCluster getCluster() {
        return cluster;
    }

    public EcsService getService() {
        return service;
    }
}
```
