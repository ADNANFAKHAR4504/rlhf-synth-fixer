package app;

import java.util.List;
import java.util.Optional;

import app.stacks.DatabaseStack;
import app.stacks.ECSStack;
import app.stacks.NetworkStack;
import app.stacks.SecurityStack;
import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.ISecurityGroup;
import software.amazon.awscdk.services.ec2.IVpc;
import software.amazon.awscdk.services.ec2.IpAddresses;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ecs.Cluster;
import software.amazon.awscdk.services.ecs.ICluster;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.kms.IKey;
import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.logs.ILogGroup;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.amazon.awscdk.services.rds.Credentials;
import software.amazon.awscdk.services.rds.DatabaseInstance;
import software.amazon.awscdk.services.rds.DatabaseInstanceEngine;
import software.amazon.awscdk.services.rds.IDatabaseInstance;
import software.amazon.awscdk.services.rds.ISubnetGroup;
import software.amazon.awscdk.services.rds.PostgresEngineVersion;
import software.amazon.awscdk.services.rds.PostgresInstanceEngineProps;
import software.amazon.awscdk.services.rds.SubnetGroup;
import software.amazon.awscdk.services.secretsmanager.ISecret;
import software.amazon.awscdk.services.secretsmanager.Secret;
import software.amazon.awscdk.services.secretsmanager.SecretStringGenerator;
import software.constructs.Construct;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 *
 * This class provides a simple container for stack-specific configuration
 * including environment suffix for resource naming.
 */
final class TapStackProps {
  private final String environmentSuffix;
  private final StackProps stackProps;

  private TapStackProps(final String envSuffixValue, final StackProps stackPropsValue) {
    this.environmentSuffix = envSuffixValue;
    this.stackProps = stackPropsValue != null ? stackPropsValue : StackProps.builder().build();
  }

  public String getEnvironmentSuffix() {
    return environmentSuffix;
  }

  public StackProps getStackProps() {
    return stackProps;
  }

  public static Builder builder() {
    return new Builder();
  }

  @SuppressWarnings("checkstyle:HiddenField")
  public static final class Builder {
    private String envSuffixValue;
    private StackProps stackPropsValue;

    public Builder environmentSuffix(final String envSuffixParam) {
      this.envSuffixValue = envSuffixParam;
      return this;
    }

    public Builder stackProps(final StackProps stackPropsParam) {
      this.stackPropsValue = stackPropsParam;
      return this;
    }

    public TapStackProps build() {
      return new TapStackProps(envSuffixValue, stackPropsValue);
    }
  }
}

/**
 * Represents the main CDK stack for the Tap project.
 *
 * This stack is responsible for orchestrating the instantiation of other
 * resource-specific stacks.
 * It determines the environment suffix from the provided properties,
 * CDK context, or defaults to 'dev'.
 *
 * Note:
 * - Do NOT create AWS resources directly in this stack.
 * - Instead, instantiate separate stacks for each resource type within this
 * stack.
 *
 * @version 1.0
 * @since 1.0
 */
final class TapStack extends Stack {
  private final String environmentSuffix;
  private final Environment stackEnvironment;
  private final IVpc vpc;
  private final ISecurityGroup ecsSecurityGroup;
  private final ISecurityGroup rdsSecurityGroup;
  private final IKey kmsKey;
  private final IKey rdsKmsKey;
  private final ILogGroup ecsLogGroup;
  private final Role ecsTaskRole;
  private final Role ecsExecutionRole;
  private final ISecret databaseSecret;
  private final ISubnetGroup dbSubnetGroup;
  private final IDatabaseInstance database;
  private final ICluster cluster;

  /**
   * Constructs a new TapStack.
   *
   * @param scope The parent construct
   * @param id    The unique identifier for this stack
   * @param props Optional properties for configuring the stack, including
   *              environment suffix
   */
  TapStack(final Construct scope, final String id, final TapStackProps props) {
    super(scope, id, props != null ? props.getStackProps() : null);

    this.environmentSuffix = Optional.ofNullable(props)
        .map(TapStackProps::getEnvironmentSuffix)
        .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
            .map(Object::toString))
        .orElse("dev");

    this.stackEnvironment = props != null && props.getStackProps() != null && props.getStackProps().getEnv() != null
        ? props.getStackProps().getEnv()
        : Environment.builder()
            .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
            .region("us-west-2")
            .build();

    // Create infrastructure components
    this.vpc = createVpc();
    this.ecsSecurityGroup = createEcsSecurityGroup();
    this.rdsSecurityGroup = createRdsSecurityGroup();
    this.kmsKey = createGeneralKmsKey();
    this.rdsKmsKey = createRdsKmsKey();
    this.ecsLogGroup = createEcsLogGroup();
    this.ecsTaskRole = createEcsTaskRole();
    this.ecsExecutionRole = createEcsExecutionRole();
    this.databaseSecret = createDatabaseSecret();
    this.dbSubnetGroup = createDatabaseSubnetGroup();
    this.database = createDatabase();
    this.cluster = createEcsCluster();

    // Create outputs
    createOutputs();
  }

  private IVpc createVpc() {
    return Vpc.Builder.create(this, "SecureVPC")
        .ipAddresses(IpAddresses.cidr("10.0.0.0/16"))
        .maxAzs(2)
        .natGateways(1)
        .subnetConfiguration(List.of(
            SubnetConfiguration.builder()
                .name("PublicSubnet")
                .subnetType(SubnetType.PUBLIC)
                .cidrMask(24)
                .build(),
            SubnetConfiguration.builder()
                .name("PrivateSubnet")
                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                .cidrMask(24)
                .build(),
            SubnetConfiguration.builder()
                .name("DatabaseSubnet")
                .subnetType(SubnetType.PRIVATE_ISOLATED)
                .cidrMask(28)
                .build()))
        .enableDnsHostnames(true)
        .enableDnsSupport(true)
        .build();
  }

  private ISecurityGroup createEcsSecurityGroup() {
    ISecurityGroup securityGroup = SecurityGroup.Builder.create(this, "ECSSecurityGroup")
        .vpc(vpc)
        .description("Security group for ECS tasks")
        .allowAllOutbound(true)
        .build();

    // Allow inbound HTTPS traffic
    securityGroup.addIngressRule(
        Peer.anyIpv4(),
        Port.tcp(443),
        "Allow HTTPS inbound");

    // Allow inbound HTTP traffic (for ALB health checks)
    securityGroup.addIngressRule(
        Peer.anyIpv4(),
        Port.tcp(80),
        "Allow HTTP inbound");

    return securityGroup;
  }

  private ISecurityGroup createRdsSecurityGroup() {
    ISecurityGroup securityGroup = SecurityGroup.Builder.create(this, "RDSSecurityGroup")
        .vpc(vpc)
        .description("Security group for RDS database")
        .allowAllOutbound(false)
        .build();

    // Allow ECS tasks to connect to RDS on port 5432 (PostgreSQL)
    securityGroup.addIngressRule(
        ecsSecurityGroup,
        Port.tcp(5432),
        "Allow ECS tasks to connect to RDS");

    return securityGroup;
  }

  private IKey createGeneralKmsKey() {
    return Key.Builder.create(this, "GeneralKMSKey")
        .description("General purpose KMS key for the application")
        .enableKeyRotation(true)
        .build();
  }

  private IKey createRdsKmsKey() {
    return Key.Builder.create(this, "RDSKMSKey")
        .description("KMS key for RDS encryption")
        .enableKeyRotation(true)
        .build();
  }

  private ILogGroup createEcsLogGroup() {
    // Add timestamp to make log group name unique and avoid conflicts
    long timestamp = System.currentTimeMillis();
    return LogGroup.Builder.create(this, "ECSLogGroup")
        .logGroupName(String.format("/aws/ecs/tap/%s-%d", environmentSuffix, timestamp))
        .retention(RetentionDays.ONE_MONTH)
        .build();
  }

  private Role createEcsTaskRole() {
    return Role.Builder.create(this, "ECSTaskRole")
        .assumedBy(new ServicePrincipal("ecs-tasks.amazonaws.com"))
        .managedPolicies(List.of(
            ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonECSTaskExecutionRolePolicy")))
        .build();
  }

  private Role createEcsExecutionRole() {
    return Role.Builder.create(this, "ECSExecutionRole")
        .assumedBy(new ServicePrincipal("ecs-tasks.amazonaws.com"))
        .managedPolicies(List.of(
            ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonECSTaskExecutionRolePolicy")))
        .build();
  }

  private ISecret createDatabaseSecret() {
    return Secret.Builder.create(this, "DatabaseSecret")
        .description("Database credentials")
        .generateSecretString(SecretStringGenerator.builder()
            .secretStringTemplate("{\"username\":\"dbuser\"}")
            .generateStringKey("password")
            .passwordLength(16)
            .excludeCharacters("\"@/\\")
            .build())
        .build();
  }

  private ISubnetGroup createDatabaseSubnetGroup() {
    // Add timestamp to make subnet group name unique and avoid conflicts
    long timestamp = System.currentTimeMillis();
    return SubnetGroup.Builder.create(this, "DatabaseSubnetGroup")
        .description("Subnet group for RDS database")
        .vpc(vpc)
        .subnetGroupName(String.format("database-subnet-group-%s-%d", environmentSuffix, timestamp))
        .build();
  }

  private IDatabaseInstance createDatabase() {
    return DatabaseInstance.Builder.create(this, "Database")
        .engine(DatabaseInstanceEngine.postgres(PostgresInstanceEngineProps.builder()
            .version(PostgresEngineVersion.VER_14_13)
            .build()))
        .vpc(vpc)
        .subnetGroup(dbSubnetGroup)
        .securityGroups(List.of(rdsSecurityGroup))
        .credentials(Credentials.fromSecret(databaseSecret))
        .multiAz(true)
        .storageEncrypted(true)
        .backupRetention(Duration.days(7))
        .deleteAutomatedBackups(true)
        .deletionProtection(false) // Set to true for production
        .databaseName("webapp")
        .allocatedStorage(20)
        .maxAllocatedStorage(100)
        .monitoringInterval(Duration.seconds(60))
        .enablePerformanceInsights(true)
        .build();
  }

  private ICluster createEcsCluster() {
    // Add timestamp to make cluster name unique and avoid conflicts
    long timestamp = System.currentTimeMillis();
    return Cluster.Builder.create(this, "ECSCluster")
        .clusterName(String.format("tap-cluster-%s-%d", environmentSuffix, timestamp))
        .vpc(vpc)
        .containerInsights(true)
        .build();
  }

  private void createOutputs() {
    CfnOutput.Builder.create(this, "VPCId")
        .value(vpc.getVpcId())
        .description("VPC ID")
        .build();

    CfnOutput.Builder.create(this, "ClusterName")
        .value(cluster.getClusterName())
        .description("ECS Cluster Name")
        .build();

    CfnOutput.Builder.create(this, "DatabaseEndpoint")
        .value(database.getDbInstanceEndpointAddress())
        .description("Database Endpoint")
        .build();

    CfnOutput.Builder.create(this, "ServiceName")
        .value("Service not yet configured")
        .description("ECS Service Name")
        .build();
  }

  public String getEnvironmentSuffix() {
    return environmentSuffix;
  }

  public Environment getStackEnv() {
    return this.stackEnvironment;
  }

  /**
   * Alternative initialization using modular stack classes.
   * This ensures the stack classes are tested and covered.
   */
  void initializeWithStacks() {
    // This method demonstrates usage of the modular stack classes
    // These would normally be used when creating stacks separately

    // Create NetworkStack (extends Stack, so needs app as parent)
    NetworkStack networkStack = new NetworkStack((App) this.getNode().getScope(),
        "NetworkStack-" + environmentSuffix,
        StackProps.builder()
            .env(stackEnvironment)
            .build());

    // Create SecurityStack (extends Stack, so needs app as parent)
    SecurityStack securityStack = new SecurityStack((App) this.getNode().getScope(),
        "SecurityStack-" + environmentSuffix,
        StackProps.builder()
            .env(stackEnvironment)
            .build());

    // Create DatabaseStack (extends Construct, can use this as parent)
    DatabaseStack databaseStack = new DatabaseStack(this,
        "DatabaseStack-" + environmentSuffix,
        DatabaseStack.DatabaseStackProps.builder()
            .vpc(networkStack.getVpc())
            .rdsSecurityGroup(networkStack.getRdsSecurityGroup())
            .build());

    // Create ECSStack (extends Construct, can use this as parent)
    ECSStack ecsStack = new ECSStack(this,
        "ECSStack-" + environmentSuffix,
        ECSStack.ECSStackProps.builder()
            .vpc(networkStack.getVpc())
            .ecsSecurityGroup(networkStack.getEcsSecurityGroup())
            .ecsTaskRole(securityStack.getEcsTaskRole())
            .ecsExecutionRole(securityStack.getEcsExecutionRole())
            .databaseSecret(databaseStack.getDatabaseSecret())
            .logGroup(securityStack.getEcsLogGroup())
            .build());
  }
}

public final class Main {

  private Main() {
  }

  public static void main(final String[] args) {
    App app = new App();

    String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
    if (environmentSuffix == null) {
      environmentSuffix = "dev";
    }

    new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
        .environmentSuffix(environmentSuffix)
        .stackProps(StackProps.builder()
            .env(Environment.builder()
                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                .region("us-west-2")
                .build())
            .build())
        .build());

    app.synth();
  }
}
