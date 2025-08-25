package app;

import com.pulumi.aws.dynamodb.Table;
import com.pulumi.aws.dynamodb.TableArgs;
import com.pulumi.aws.dynamodb.inputs.TableAttributeArgs;
import com.pulumi.aws.dynamodb.inputs.TablePointInTimeRecoveryArgs;
import com.pulumi.aws.ec2.Instance;
import com.pulumi.aws.ec2.InstanceArgs;
import com.pulumi.aws.ec2.SecurityGroup;
import com.pulumi.aws.ec2.SecurityGroupArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupEgressArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupIngressArgs;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;
import com.pulumi.aws.s3.BucketPublicAccessBlock;
import com.pulumi.aws.s3.BucketPublicAccessBlockArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;
import java.util.List;
import java.util.Map;

/**
 * WebApp Infrastructure Stack for AWS Resource Migration
 * Supports migration from us-east-1 to us-west-2 with data integrity and security
 */
public class WebAppStack extends ComponentResource {

  private final WebAppStackConfig config;
  private final SecurityGroup webSecurityGroup;
  private final Instance webInstance;
  private final Bucket dataBucket;
  private final Table dataTable;

  public WebAppStack(String name, ComponentResourceOptions options) {
    super("webapp:infrastructure:WebAppStack", name, options);
    this.config = new WebAppStackConfig();

    // Create security group for EC2 instance
    this.webSecurityGroup = createSecurityGroup();

    // Create EC2 instance
    this.webInstance = createEC2Instance();

    // Create S3 bucket with security and versioning
    this.dataBucket = createS3Bucket();

    // Configure S3 bucket security settings
    configureS3BucketSecurity();

    // Create DynamoDB table
    this.dataTable = createDynamoDBTable();

    // Register outputs
    registerOutputs();
  }

  /**
   * Create security group with HTTP and SSH access
   */
  private SecurityGroup createSecurityGroup() {
    return new SecurityGroup(
      config.getResourceName("webapp-security-group"),
      SecurityGroupArgs
        .builder()
        .name(config.getResourceName("webapp-security-group"))
        .description("Security group for WebApp EC2 instance")
        .ingress(
          // SSH access
          SecurityGroupIngressArgs
            .builder()
            .protocol("tcp")
            .fromPort(22)
            .toPort(22)
            .cidrBlocks(config.getAllowedCidrBlocks())
            .description("SSH access")
            .build(),
          // HTTP access
          SecurityGroupIngressArgs
            .builder()
            .protocol("tcp")
            .fromPort(80)
            .toPort(80)
            .cidrBlocks(config.getAllowedCidrBlocks())
            .description("HTTP access")
            .build(),
          // HTTPS access
          SecurityGroupIngressArgs
            .builder()
            .protocol("tcp")
            .fromPort(443)
            .toPort(443)
            .cidrBlocks(config.getAllowedCidrBlocks())
            .description("HTTPS access")
            .build()
        )
        .egress(
          SecurityGroupEgressArgs
            .builder()
            .protocol("-1")
            .fromPort(0)
            .toPort(0)
            .cidrBlocks("0.0.0.0/0")
            .description("All outbound traffic")
            .build()
        )
        .tags(
          Map.of(
            "Name",
            config.getResourceName("webapp-security-group"),
            "Environment",
            config.getEnvironmentSuffix(),
            "Purpose",
            "WebApp-Migration"
          )
        )
        .build(),
      CustomResourceOptions.builder().parent(this).build()
    );
  }

  /**
   * Create EC2 instance with security group
   */
  private Instance createEC2Instance() {
    return new Instance(
      config.getResourceName("webapp-instance"),
      InstanceArgs
        .builder()
        .instanceType(config.getInstanceType())
        .ami("ami-0c02fb55956c7d316") // Amazon Linux 2 AMI (update for target region)
        .vpcSecurityGroupIds(
          webSecurityGroup.id().applyValue(id -> List.of(id))
        )
        .userData(
          """
                    #!/bin/bash
                    yum update -y
                    yum install -y httpd
                    systemctl start httpd
                    systemctl enable httpd
                    echo "<h1>WebApp Migration - Environment: %s</h1>" > /var/www/html/index.html
                    """.formatted(
              config.getEnvironmentSuffix()
            )
        )
        .tags(
          Map.of(
            "Name",
            config.getResourceName("webapp-instance"),
            "Environment",
            config.getEnvironmentSuffix(),
            "Purpose",
            "WebApp-Migration"
          )
        )
        .build(),
      CustomResourceOptions
        .builder()
        .parent(this)
        .dependsOn(webSecurityGroup)
        .build()
    );
  }

  /**
   * Create S3 bucket with versioning
   */
  private Bucket createS3Bucket() {
    return new Bucket(
      config.getResourceName("webapp-data-bucket"),
      BucketArgs
        .builder()
        .bucket(config.getResourceName("webapp-data-bucket"))
        .tags(
          Map.of(
            "Name",
            config.getResourceName("webapp-data-bucket"),
            "Environment",
            config.getEnvironmentSuffix(),
            "Purpose",
            "WebApp-Migration"
          )
        )
        .build(),
      CustomResourceOptions.builder().parent(this).build()
    );
  }

  /**
   * Configure S3 bucket security settings
   */
  private void configureS3BucketSecurity() {
    // Block public access
    new BucketPublicAccessBlock(
      config.getResourceName("webapp-bucket-public-access-block"),
      BucketPublicAccessBlockArgs
        .builder()
        .bucket(dataBucket.id())
        .blockPublicAcls(true)
        .blockPublicPolicy(true)
        .ignorePublicAcls(true)
        .restrictPublicBuckets(true)
        .build(),
      CustomResourceOptions.builder().parent(this).dependsOn(dataBucket).build()
    );
  }

  /**
   * Create DynamoDB table with point-in-time recovery
   */
  private Table createDynamoDBTable() {
    return new Table(
      config.getResourceName("webapp-data-table"),
      TableArgs
        .builder()
        .name(config.getResourceName("webapp-data-table"))
        .billingMode("PAY_PER_REQUEST")
        .hashKey("id")
        .attributes(TableAttributeArgs.builder().name("id").type("S").build())
        .pointInTimeRecovery(
          TablePointInTimeRecoveryArgs.builder().enabled(true).build()
        )
        .tags(
          Map.of(
            "Name",
            config.getResourceName("webapp-data-table"),
            "Environment",
            config.getEnvironmentSuffix(),
            "Purpose",
            "WebApp-Migration"
          )
        )
        .build(),
      CustomResourceOptions.builder().parent(this).build()
    );
  }

  /**
   * Register stack outputs
   */
  private void registerOutputs() {
    this.registerOutputs(
        Map.of(
          "instanceId",
          webInstance.id(),
          "instancePublicIp",
          webInstance.publicIp(),
          "securityGroupId",
          webSecurityGroup.id(),
          "bucketName",
          dataBucket.bucket(),
          "bucketArn",
          dataBucket.arn(),
          "dynamoTableName",
          dataTable.name(),
          "dynamoTableArn",
          dataTable.arn(),
          "region",
          Output.of(config.getAwsRegion()),
          "environment",
          Output.of(config.getEnvironmentSuffix())
        )
      );
  }

  // Getters for accessing resources
  public SecurityGroup getWebSecurityGroup() {
    return webSecurityGroup;
  }

  public Instance getWebInstance() {
    return webInstance;
  }

  public Bucket getDataBucket() {
    return dataBucket;
  }

  public Table getDataTable() {
    return dataTable;
  }

  public WebAppStackConfig getConfig() {
    return config;
  }
}
