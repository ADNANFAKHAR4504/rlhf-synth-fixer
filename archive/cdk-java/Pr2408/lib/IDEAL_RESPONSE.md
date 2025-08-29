```java
package app;

import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.CfnOutputProps;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.cloudfront.BehaviorOptions;
import software.amazon.awscdk.services.cloudfront.CachePolicy;
import software.amazon.awscdk.services.cloudfront.CfnOriginAccessControl;
import software.amazon.awscdk.services.cloudfront.CfnOriginAccessControlProps;
import software.amazon.awscdk.services.cloudfront.Distribution;
import software.amazon.awscdk.services.cloudfront.DistributionProps;
import software.amazon.awscdk.services.cloudfront.ViewerProtocolPolicy;
import software.amazon.awscdk.services.cloudfront.origins.S3Origin;
import software.amazon.awscdk.services.ec2.IVpc;
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceSize;
// FIX: use EC2 InstanceType, not RDS InstanceType
import software.amazon.awscdk.services.ec2.InstanceType;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SecurityGroupProps;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetSelection;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.VpcProps;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.PolicyDocument;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.PolicyStatementProps;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.RoleProps;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.rds.Credentials;
import software.amazon.awscdk.services.rds.DatabaseInstance;
import software.amazon.awscdk.services.rds.DatabaseInstanceEngine;
import software.amazon.awscdk.services.rds.DatabaseInstanceProps;
import software.amazon.awscdk.services.rds.PostgresEngineVersion;
import software.amazon.awscdk.services.rds.SubnetGroup;
import software.amazon.awscdk.services.rds.SubnetGroupProps;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.BucketProps;
import software.amazon.awscdk.services.secretsmanager.Secret;
import software.amazon.awscdk.services.secretsmanager.SecretProps;
import software.constructs.Construct;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 *
 * This class provides a simple container for stack-specific configuration
 * including environment suffix for resource naming.
 */
class TapStackProps {
  private final String environmentSuffix;
  private final StackProps stackProps;

  private TapStackProps(String environmentSuffix, StackProps stackProps) {
    this.environmentSuffix = environmentSuffix;
    this.stackProps = stackProps != null ? stackProps : StackProps.builder().build();
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

  public static class Builder {
    private String environmentSuffix;
    private StackProps stackProps;

    public Builder environmentSuffix(String environmentSuffix) {
      this.environmentSuffix = environmentSuffix;
      return this;
    }

    public Builder stackProps(StackProps stackProps) {
      this.stackProps = stackProps;
      return this;
    }

    public TapStackProps build() {
      return new TapStackProps(environmentSuffix, stackProps);
    }
  }
}

/**
 * Represents the main CDK stack for the Tap project.
 *
 * This stack is responsible for orchestrating the instantiation of other
 * resource-specific stacks. It determines the environment suffix from the
 * provided properties, CDK context, or defaults to 'dev'.
 *
 * NOTE:
 * - Do NOT create AWS resources directly in this stack.
 * - Instead, instantiate separate stacks for each resource type within this
 * stack.
 */
class TapStack extends Stack {
  private final String environmentSuffix;

  public TapStack(final Construct scope, final String id, final TapStackProps props) {
    super(scope, id, props != null ? props.getStackProps() : null);

    // Get environment suffix from props, context, or use 'dev' as default
    this.environmentSuffix = Optional.ofNullable(props)
        .map(TapStackProps::getEnvironmentSuffix)
        .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
            .map(Object::toString))
        .orElse("dev");

    // Do not create resources here.
  }

  public String getEnvironmentSuffix() {
    return environmentSuffix;
  }
}

/**
 * Secure e-commerce infrastructure stack (VPC, private RDS, S3 + CloudFront
 * OAC, IAM least-privilege).
 */
class EcommerceStack extends Stack {
  private final Map<String, String> commonTags = Map.of(
      "Project", "Ecommerce",
      "Stack", "ProdLike",
      "Owner", "CDK");

  private IVpc vpc;
  private SecurityGroup appTierSecurityGroup;
  private SecurityGroup rdsSecurityGroup;
  private DatabaseInstance rdsInstance;
  private Secret dbSecret;
  private Bucket s3Bucket;
  private Distribution cloudFrontDistribution;
  private CfnOriginAccessControl originAccessControl;
  private Role rdsAccessRole;
  private Role s3ReadOnlyRole;

  public EcommerceStack(final software.constructs.Construct scope, final String id) {
    this(scope, id, null);
  }

  public EcommerceStack(final software.constructs.Construct scope, final String id, final StackProps props) {
    super(scope, id, props);

    // Apply common tags to all resources in this stack
    commonTags.forEach((key, value) -> Tags.of(this).add(key, value));

    // Create networking infrastructure
    createNetworking();

    // Create security groups
    createSecurityGroups();

    // Create RDS database
    createRdsDatabase();

    // Create S3 bucket and CloudFront distribution
    createS3AndCloudFront();

    // Create IAM roles with least privilege
    createIamRoles();

    // Create outputs
    createOutputs();
  }

  private void createNetworking() {
    // Create VPC with public and private isolated subnets across 2 AZs
    vpc = new Vpc(this, "EcommerceVpc", VpcProps.builder()
        .maxAzs(2)
        .subnetConfiguration(Arrays.asList(
            SubnetConfiguration.builder()
                .name("PublicSubnet")
                .subnetType(SubnetType.PUBLIC)
                .cidrMask(24)
                .build(),
            SubnetConfiguration.builder()
                .name("PrivateIsolatedSubnet")
                .subnetType(SubnetType.PRIVATE_ISOLATED)
                .cidrMask(24)
                .build()))
        .build());
  }

  private void createSecurityGroups() {
    // Create security group for application tier
    appTierSecurityGroup = new SecurityGroup(this, "AppTierSecurityGroup",
        SecurityGroupProps.builder()
            .vpc(vpc)
            .description("Security group for application tier")
            .allowAllOutbound(false)
            .build());

    // Create security group for RDS
    rdsSecurityGroup = new SecurityGroup(this, "RdsSecurityGroup",
        SecurityGroupProps.builder()
            .vpc(vpc)
            .description("Security group for RDS database")
            .allowAllOutbound(false)
            .build());

    // Allow app tier to connect to RDS on PostgreSQL port
    rdsSecurityGroup.addIngressRule(
        appTierSecurityGroup,
        software.amazon.awscdk.services.ec2.Port.tcp(5432),
        "Allow app tier to connect to PostgreSQL");

    // Allow RDS to connect to AWS endpoints for maintenance
    rdsSecurityGroup.addEgressRule(
        software.amazon.awscdk.services.ec2.Peer.anyIpv4(),
        software.amazon.awscdk.services.ec2.Port.tcp(443),
        "Allow HTTPS to AWS endpoints");
  }

  private void createRdsDatabase() {
    // Create DB subnet group for private subnets
    SubnetGroup dbSubnetGroup = new SubnetGroup(this, "DbSubnetGroup",
        SubnetGroupProps.builder()
            .description("Subnet group for RDS database")
            .vpc(vpc)
            .vpcSubnets(SubnetSelection.builder()
                .subnetType(SubnetType.PRIVATE_ISOLATED)
                .build())
            .build());

    // Create secret for database credentials
    dbSecret = new Secret(this, "DbSecret", SecretProps.builder()
        .description("Database credentials for ecommerce application")
        .generateSecretString(software.amazon.awscdk.services.secretsmanager.SecretStringGenerator.builder()
            .secretStringTemplate("{\"username\": \"ecommerceuser\"}")
            .generateStringKey("password")
            .excludeCharacters("\"@/\\")
            .passwordLength(32)
            .build())
        .build());

    // Create RDS PostgreSQL instance
    rdsInstance = new DatabaseInstance(this, "EcommerceDatabase",
        DatabaseInstanceProps.builder()
            .engine(DatabaseInstanceEngine.postgres(
                software.amazon.awscdk.services.rds.PostgresInstanceEngineProps.builder()
                    .version(PostgresEngineVersion.VER_15_10)
                    .build()))
            // FIX: use EC2 InstanceType.of(...)
            .instanceType(InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
            .credentials(Credentials.fromSecret(dbSecret))
            .vpc(vpc)
            .vpcSubnets(SubnetSelection.builder()
                .subnetType(SubnetType.PRIVATE_ISOLATED)
                .build())
            .subnetGroup(dbSubnetGroup)
            .securityGroups(Arrays.asList(rdsSecurityGroup))
            .publiclyAccessible(false)
            .storageEncrypted(true)
            .backupRetention(Duration.days(7))
            .deletionProtection(false) // Set to true for production
            .databaseName("ecommercedb")
            .build());
  }

  private void createS3AndCloudFront() {
    // Create S3 bucket with strict security settings
    s3Bucket = new Bucket(this, "EcommerceAssetsBucket", BucketProps.builder()
        .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
        .encryption(BucketEncryption.S3_MANAGED)
        .versioned(true)
        // REMOVED: .enforceSSL(true) — not available in your CDK version
        .build());

    // Create Origin Access Control for CloudFront
    originAccessControl = new CfnOriginAccessControl(this, "OriginAccessControl",
        CfnOriginAccessControlProps.builder()
            .originAccessControlConfig(CfnOriginAccessControl.OriginAccessControlConfigProperty.builder()
                .name("EcommerceOAC")
                .originAccessControlOriginType("s3")
                .signingBehavior("always")
                .signingProtocol("sigv4")
                .description("Origin Access Control for ecommerce assets bucket")
                .build())
            .build());

    // Create CloudFront distribution
    cloudFrontDistribution = new Distribution(this, "EcommerceDistribution",
        DistributionProps.builder()
            .defaultBehavior(BehaviorOptions.builder()
                .origin(S3Origin.Builder.create(s3Bucket)
                    .build())
                .viewerProtocolPolicy(ViewerProtocolPolicy.REDIRECT_TO_HTTPS)
                .cachePolicy(CachePolicy.CACHING_OPTIMIZED)
                .build())
            .comment("CloudFront distribution for ecommerce assets")
            .build());

    // Update the CloudFront distribution to use OAC
    software.amazon.awscdk.services.cloudfront.CfnDistribution cfnDistribution = (software.amazon.awscdk.services.cloudfront.CfnDistribution) cloudFrontDistribution
        .getNode().getDefaultChild();

    // Update the origin to use OAC
    cfnDistribution.addPropertyOverride("DistributionConfig.Origins.0.OriginAccessControlId",
        originAccessControl.getAttrId());
    cfnDistribution.addPropertyOverride("DistributionConfig.Origins.0.S3OriginConfig.OriginAccessIdentity", "");

    // Create bucket policy that only allows CloudFront OAC access
    PolicyStatement bucketPolicyStatement = new PolicyStatement(PolicyStatementProps.builder()
        .sid("AllowCloudFrontServicePrincipal")
        .effect(Effect.ALLOW)
        .principals(Arrays.asList(new ServicePrincipal("cloudfront.amazonaws.com")))
        .actions(Arrays.asList("s3:GetObject"))
        .resources(Arrays.asList(s3Bucket.getBucketArn() + "/*"))
        .conditions(Map.of(
            "StringEquals", Map.of(
                "AWS:SourceArn", String.format("arn:aws:cloudfront::%s:distribution/%s",
                    this.getAccount(), cloudFrontDistribution.getDistributionId()))))
        .build());

    PolicyStatement denyInsecureConnections = new PolicyStatement(PolicyStatementProps.builder()
        .sid("DenyInsecureConnections")
        .effect(Effect.DENY)
        .principals(Arrays.asList(new software.amazon.awscdk.services.iam.AnyPrincipal()))
        .actions(Arrays.asList("s3:*"))
        .resources(Arrays.asList(
            s3Bucket.getBucketArn(),
            s3Bucket.getBucketArn() + "/*"))
        .conditions(Map.of(
            "Bool", Map.of("aws:SecureTransport", "false")))
        .build());

    s3Bucket.addToResourcePolicy(bucketPolicyStatement);
    s3Bucket.addToResourcePolicy(denyInsecureConnections);
  }

  private void createIamRoles() {
    // Create RDS access role with least privilege
    rdsAccessRole = new Role(this, "RdsAccessRole", RoleProps.builder()
        .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
        .description("Role for accessing RDS database secrets and metadata")
        .inlinePolicies(Map.of(
            "RdsSecretsAccess", PolicyDocument.Builder.create()
                .statements(Arrays.asList(
                    PolicyStatement.Builder.create()
                        .effect(Effect.ALLOW)
                        .actions(Arrays.asList(
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret"))
                        .resources(Arrays.asList(dbSecret.getSecretArn()))
                        .conditions(Map.of(
                            "Bool", Map.of("aws:SecureTransport", "true")))
                        .build(),
                    PolicyStatement.Builder.create()
                        .effect(Effect.ALLOW)
                        .actions(Arrays.asList("rds:DescribeDBInstances"))
                        .resources(Arrays.asList(rdsInstance.getInstanceArn()))
                        .conditions(Map.of(
                            "Bool", Map.of("aws:SecureTransport", "true")))
                        .build()))
                .build()))
        .build());

    // Create S3 read-only role with least privilege
    s3ReadOnlyRole = new Role(this, "S3ReadOnlyRole", RoleProps.builder()
        .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
        .description("Role for read-only access to ecommerce assets bucket")
        .inlinePolicies(Map.of(
            "S3ReadOnlyAccess", PolicyDocument.Builder.create()
                .statements(Arrays.asList(
                    PolicyStatement.Builder.create()
                        .effect(Effect.ALLOW)
                        .actions(Arrays.asList("s3:ListBucket"))
                        .resources(Arrays.asList(s3Bucket.getBucketArn()))
                        .conditions(Map.of(
                            "Bool", Map.of("aws:SecureTransport", "true")))
                        .build(),
                    PolicyStatement.Builder.create()
                        .effect(Effect.ALLOW)
                        .actions(Arrays.asList("s3:GetObject"))
                        .resources(Arrays.asList(s3Bucket.getBucketArn() + "/*"))
                        .conditions(Map.of(
                            "Bool", Map.of("aws:SecureTransport", "true")))
                        .build()))
                .build()))
        .build());
  }

  private void createOutputs() {
    new CfnOutput(this, "VpcId", CfnOutputProps.builder()
        .description("VPC ID")
        .value(vpc.getVpcId())
        .build());

    new CfnOutput(this, "PrivateSubnetIds", CfnOutputProps.builder()
        .description("Private subnet IDs")
        .value(String.join(",", vpc.getPrivateSubnets().stream()
            .map(subnet -> subnet.getSubnetId())
            .toArray(String[]::new)))
        .build());

    new CfnOutput(this, "RdsEndpoint", CfnOutputProps.builder()
        .description("RDS endpoint")
        .value(rdsInstance.getInstanceEndpoint().getHostname())
        .build());

    new CfnOutput(this, "S3BucketName", CfnOutputProps.builder()
        .description("S3 bucket name for assets")
        .value(s3Bucket.getBucketName())
        .build());

    new CfnOutput(this, "CloudFrontDomain", CfnOutputProps.builder()
        .description("CloudFront distribution domain")
        .value(cloudFrontDistribution.getDistributionDomainName())
        .build());

    new CfnOutput(this, "DbSecretArn", CfnOutputProps.builder()
        .description("Database secret ARN")
        .value(dbSecret.getSecretArn())
        .build());

    new CfnOutput(this, "RdsAccessRoleArn", CfnOutputProps.builder()
        .description("RDS access role ARN")
        .value(rdsAccessRole.getRoleArn())
        .build());

    new CfnOutput(this, "S3ReadOnlyRoleArn", CfnOutputProps.builder()
        .description("S3 read-only role ARN")
        .value(s3ReadOnlyRole.getRoleArn())
        .build());
  }

  // Getters for testing
  public IVpc getVpc() {
    return vpc;
  }

  public DatabaseInstance getRdsInstance() {
    return rdsInstance;
  }

  public Bucket getS3Bucket() {
    return s3Bucket;
  }

  public Distribution getCloudFrontDistribution() {
    return cloudFrontDistribution;
  }

  public Role getRdsAccessRole() {
    return rdsAccessRole;
  }

  public Role getS3ReadOnlyRole() {
    return s3ReadOnlyRole;
  }

  public Secret getDbSecret() {
    return dbSecret;
  }

  public SecurityGroup getRdsSecurityGroup() {
    return rdsSecurityGroup;
  }

  public SecurityGroup getAppTierSecurityGroup() {
    return appTierSecurityGroup;
  }
}

/**
 * Main entry point for the TAP CDK Java application.
 */
public final class Main {
  private Main() {
  }

  public static void main(final String[] args) {
    App app = new App();

    // Get environment suffix from context or default to 'dev'
    String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
    if (environmentSuffix == null)
      environmentSuffix = "dev";

    StackProps sharedProps = StackProps.builder()
        .env(Environment.builder()
            .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
            .region(System.getenv("CDK_DEFAULT_REGION"))
            .build())
        .build();

    // Orchestrator (no resources here)
    new TapStack(app, "TapStack" + environmentSuffix,
        TapStackProps.builder()
            .environmentSuffix(environmentSuffix)
            .stackProps(sharedProps)
            .build());

    // E-commerce infra
    new EcommerceStack(app, "EcommerceStack" + environmentSuffix, sharedProps);

    app.synth();
  }
}
```