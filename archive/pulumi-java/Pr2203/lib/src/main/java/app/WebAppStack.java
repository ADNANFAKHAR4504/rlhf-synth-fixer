package app;

import com.pulumi.aws.dynamodb.Table;
import com.pulumi.aws.dynamodb.TableArgs;
import com.pulumi.aws.dynamodb.inputs.TableAttributeArgs;
import com.pulumi.aws.dynamodb.inputs.TablePointInTimeRecoveryArgs;
import com.pulumi.aws.ec2.Instance;
import com.pulumi.aws.ec2.InstanceArgs;
import com.pulumi.aws.ec2.InternetGateway;
import com.pulumi.aws.ec2.InternetGatewayArgs;
import com.pulumi.aws.ec2.RouteTable;
import com.pulumi.aws.ec2.RouteTableArgs;
import com.pulumi.aws.ec2.RouteTableAssociation;
import com.pulumi.aws.ec2.RouteTableAssociationArgs;
import com.pulumi.aws.ec2.SecurityGroup;
import com.pulumi.aws.ec2.SecurityGroupArgs;
import com.pulumi.aws.ec2.Subnet;
import com.pulumi.aws.ec2.SubnetArgs;
import com.pulumi.aws.ec2.Vpc;
import com.pulumi.aws.ec2.VpcArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupEgressArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupIngressArgs;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;
import com.pulumi.aws.s3.BucketPublicAccessBlock;
import com.pulumi.aws.s3.BucketPublicAccessBlockArgs;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;
import java.util.List;
import java.util.Map;

/**
 * WebApp Infrastructure Stack for AWS Resource Migration Supports migration from us-east-1 to
 * us-west-2 with data integrity and security
 */
public class WebAppStack {

  // ...existing code...

  private final WebAppStackConfig config;
  private final Vpc vpc;
  private final Subnet publicSubnet1;
  private final Subnet publicSubnet2;
  private final SecurityGroup webSecurityGroup;
  private final Instance webInstance;
  private final Bucket dataBucket;
  private final Table dataTable;
  // Expose networking resources for testing
  public final InternetGateway internetGateway;
  public final RouteTable routeTable;
  public final RouteTableAssociation routeTableAssociation1;
  public final RouteTableAssociation routeTableAssociation2;

  public WebAppStack(final String name, final ComponentResourceOptions options) {
    // super() call removed since not extending ComponentResource
    this.config = new WebAppStackConfig();

    // Create VPC and networking resources and assign to fields
    var networkResources = createNetworkResources();
    this.vpc = networkResources.vpc;
    this.publicSubnet1 = networkResources.publicSubnet1;
    this.publicSubnet2 = networkResources.publicSubnet2;
    // Assign networking resources to fields for test visibility
    this.internetGateway = networkResources.internetGateway;
    this.routeTable = networkResources.routeTable;
    this.routeTableAssociation1 = networkResources.routeTableAssociation1;
    this.routeTableAssociation2 = networkResources.routeTableAssociation2;

    // Create security group for EC2 instance in the new VPC
    this.webSecurityGroup = createSecurityGroup(networkResources);

    // Create EC2 instance in the new VPC/subnet
    this.webInstance = createEC2Instance(networkResources);

    // Create S3 bucket with security and versioning
    this.dataBucket = createS3Bucket();

    // Configure S3 bucket security settings
    configureS3BucketSecurity();

    // Create DynamoDB table
    this.dataTable = createDynamoDBTable();
    // Register outputs removed since not extending ComponentResource
  }

  /** Create security group with HTTP and SSH access */
  private SecurityGroup createSecurityGroup(final NetworkResources network) {
    return new SecurityGroup(
        config.getResourceName("webapp-security-group"),
        SecurityGroupArgs.builder()
            .vpcId(network.vpc.id())
            .name(config.getResourceName("webapp-security-group"))
            .description("Security group for WebApp EC2 instance")
            .ingress(
                // SSH access
                SecurityGroupIngressArgs.builder()
                    .protocol("tcp")
                    .fromPort(22)
                    .toPort(22)
                    .cidrBlocks(config.getAllowedCidrBlocks())
                    .description("SSH access")
                    .build(),
                // HTTP access
                SecurityGroupIngressArgs.builder()
                    .protocol("tcp")
                    .fromPort(80)
                    .toPort(80)
                    .cidrBlocks(config.getAllowedCidrBlocks())
                    .description("HTTP access")
                    .build(),
                // HTTPS access
                SecurityGroupIngressArgs.builder()
                    .protocol("tcp")
                    .fromPort(443)
                    .toPort(443)
                    .cidrBlocks(config.getAllowedCidrBlocks())
                    .description("HTTPS access")
                    .build())
            .egress(
                SecurityGroupEgressArgs.builder()
                    .protocol("-1")
                    .fromPort(0)
                    .toPort(0)
                    .cidrBlocks("0.0.0.0/0")
                    .description("All outbound traffic")
                    .build())
            .tags(
                Map.of(
                    "Name",
                    config.getResourceName("webapp-security-group"),
                    "Environment",
                    config.getEnvironmentSuffix(),
                    "Purpose",
                    "WebApp-Migration"))
            .build(),
        CustomResourceOptions.builder().build());
  }

  /** Create EC2 instance with security group */
  private Instance createEC2Instance(final NetworkResources network) {
    return new Instance(
        config.getResourceName("webapp-instance"),
        InstanceArgs.builder()
            .instanceType(config.getInstanceType())
            .ami("ami-098db043beb8cbda7") // Amazon Linux 2 AMI (update for target region)
            .subnetId(network.publicSubnet1.id())
            .vpcSecurityGroupIds(webSecurityGroup.id().applyValue(id -> List.of(id)))
            .userData(
                """
          #!/bin/bash
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "<h1>WebApp Migration - Environment: %s</h1>" > /var/www/html/index.html
          """
                    .formatted(config.getEnvironmentSuffix()))
            .tags(
                Map.of(
                    "Name",
                    config.getResourceName("webapp-instance"),
                    "Environment",
                    config.getEnvironmentSuffix(),
                    "Purpose",
                    "WebApp-Migration"))
            .build(),
        CustomResourceOptions.builder()
            // .parent(this) removed
            .dependsOn(webSecurityGroup)
            .build());
  }

  // Helper class to hold network resources

  private static class NetworkResources {

    public final Vpc vpc;
    public final Subnet publicSubnet1;
    public final Subnet publicSubnet2;
    public final InternetGateway internetGateway;
    public final RouteTable routeTable;
    public final RouteTableAssociation routeTableAssociation1;
    public final RouteTableAssociation routeTableAssociation2;

    public NetworkResources(
        final Vpc vpc,
        final Subnet publicSubnet1,
        final Subnet publicSubnet2,
        final InternetGateway internetGateway,
        final RouteTable routeTable,
        final RouteTableAssociation routeTableAssociation1,
        final RouteTableAssociation routeTableAssociation2) {
      this.vpc = vpc;
      this.publicSubnet1 = publicSubnet1;
      this.publicSubnet2 = publicSubnet2;
      this.internetGateway = internetGateway;
      this.routeTable = routeTable;
      this.routeTableAssociation1 = routeTableAssociation1;
      this.routeTableAssociation2 = routeTableAssociation2;
    }
  }

  // Create VPC, subnets, IGW, route table, and associations
  private NetworkResources createNetworkResources() {
    var vpc =
        new Vpc(
            config.getResourceName("webapp-vpc"),
            VpcArgs.builder()
                .cidrBlock("10.0.0.0/16")
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .tags(
                    Map.of(
                        "Name",
                        config.getResourceName("webapp-vpc"),
                        "Environment",
                        config.getEnvironmentSuffix(),
                        "Purpose",
                        "WebApp-Migration"))
                .build());

    var igw =
        new InternetGateway(
            config.getResourceName("webapp-igw"),
            InternetGatewayArgs.builder()
                .vpcId(vpc.id())
                .tags(
                    Map.of(
                        "Name",
                        config.getResourceName("webapp-igw"),
                        "Environment",
                        config.getEnvironmentSuffix(),
                        "Purpose",
                        "WebApp-Migration"))
                .build());

    var publicSubnet1 =
        new Subnet(
            config.getResourceName("webapp-public-subnet-1"),
            SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock("10.0.1.0/24")
                .mapPublicIpOnLaunch(true)
                .tags(
                    Map.of(
                        "Name",
                        config.getResourceName("webapp-public-subnet-1"),
                        "Environment",
                        config.getEnvironmentSuffix(),
                        "Purpose",
                        "WebApp-Migration"))
                .build());

    var publicSubnet2 =
        new Subnet(
            config.getResourceName("webapp-public-subnet-2"),
            SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock("10.0.2.0/24")
                .mapPublicIpOnLaunch(true)
                .tags(
                    Map.of(
                        "Name",
                        config.getResourceName("webapp-public-subnet-2"),
                        "Environment",
                        config.getEnvironmentSuffix(),
                        "Purpose",
                        "WebApp-Migration"))
                .build());

    var publicRouteTable =
        new RouteTable(
            config.getResourceName("webapp-public-rt"),
            RouteTableArgs.builder()
                .vpcId(vpc.id())
                .routes(
                    List.of(
                        com.pulumi.aws.ec2.inputs.RouteTableRouteArgs.builder()
                            .cidrBlock("0.0.0.0/0")
                            .gatewayId(igw.id())
                            .build()))
                .tags(
                    Map.of(
                        "Name",
                        config.getResourceName("webapp-public-rt"),
                        "Environment",
                        config.getEnvironmentSuffix(),
                        "Purpose",
                        "WebApp-Migration"))
                .build());

    var assoc1 =
        new RouteTableAssociation(
            config.getResourceName("webapp-public-rt-assoc-1"),
            RouteTableAssociationArgs.builder()
                .subnetId(publicSubnet1.id())
                .routeTableId(publicRouteTable.id())
                .build());

    var assoc2 =
        new RouteTableAssociation(
            config.getResourceName("webapp-public-rt-assoc-2"),
            RouteTableAssociationArgs.builder()
                .subnetId(publicSubnet2.id())
                .routeTableId(publicRouteTable.id())
                .build());

    return new NetworkResources(
        vpc, publicSubnet1, publicSubnet2, igw, publicRouteTable, assoc1, assoc2);
  }

  /** Create S3 bucket with versioning */
  private Bucket createS3Bucket() {
    return new Bucket(
        config.getResourceName("webapp-data-bucket"),
        BucketArgs.builder()
            .bucket(config.getResourceName("webapp-data-bucket"))
            .tags(
                Map.of(
                    "Name",
                    config.getResourceName("webapp-data-bucket"),
                    "Environment",
                    config.getEnvironmentSuffix(),
                    "Purpose",
                    "WebApp-Migration"))
            .build(),
        CustomResourceOptions.builder().build());
  }

  /** Configure S3 bucket security settings */
  private void configureS3BucketSecurity() {
    // Block public access
    new BucketPublicAccessBlock(
        config.getResourceName("webapp-bucket-public-access-block"),
        BucketPublicAccessBlockArgs.builder()
            .bucket(dataBucket.id())
            .blockPublicAcls(true)
            .blockPublicPolicy(true)
            .ignorePublicAcls(true)
            .restrictPublicBuckets(true)
            .build(),
        CustomResourceOptions.builder().dependsOn(dataBucket).build());
  }

  /** Create DynamoDB table with point-in-time recovery */
  private Table createDynamoDBTable() {
    return new Table(
        config.getResourceName("webapp-data-table"),
        TableArgs.builder()
            .name(config.getResourceName("webapp-data-table"))
            .billingMode("PAY_PER_REQUEST")
            .hashKey("id")
            .attributes(TableAttributeArgs.builder().name("id").type("S").build())
            .pointInTimeRecovery(TablePointInTimeRecoveryArgs.builder().enabled(true).build())
            .tags(
                Map.of(
                    "Name",
                    config.getResourceName("webapp-data-table"),
                    "Environment",
                    config.getEnvironmentSuffix(),
                    "Purpose",
                    "WebApp-Migration"))
            .build(),
        CustomResourceOptions.builder().build());
  }

  /** Register stack outputs */
  // registerOutputs() removed since not extending ComponentResource

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

    public Vpc getVpc() {
        return vpc;
    }

    public Subnet getPublicSubnet1() {
        return publicSubnet1;
    }

    public Subnet getPublicSubnet2() {
        return publicSubnet2;
    }
}
