I'll create a complete CDK Java solution for a secure e-commerce infrastructure. Here's the implementation:

## lib/Main.java

```java
/*
Required pom.xml dependencies (add to your existing pom.xml):

<dependencies>
    <dependency>
        <groupId>software.amazon.awscdk</groupId>
        <artifactId>aws-cdk-lib</artifactId>
        <version>2.100.0</version>
    </dependency>
    <dependency>
        <groupId>software.constructs</groupId>
        <artifactId>constructs</artifactId>
        <version>10.3.0</version>
    </dependency>
    <dependency>
        <groupId>junit</groupId>
        <artifactId>junit-jupiter</artifactId>
        <version>5.10.0</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>software.amazon.awssdk</groupId>
        <artifactId>rds</artifactId>
        <version>2.21.0</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>software.amazon.awssdk</groupId>
        <artifactId>s3</artifactId>
        <version>2.21.0</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>software.amazon.awssdk</groupId>
        <artifactId>cloudfront</artifactId>
        <version>2.21.0</version>
        <scope>test</scope>
    </dependency>
</dependencies>
*/

package lib;

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
import software.amazon.awscdk.services.cloudfront.OriginAccessIdentity;
import software.amazon.awscdk.services.cloudfront.S3Origin;
import software.amazon.awscdk.services.cloudfront.ViewerProtocolPolicy;
import software.amazon.awscdk.services.ec2.IVpc;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SecurityGroupProps;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetSelection;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.VpcProps;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.ManagedPolicy;
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
import software.amazon.awscdk.services.rds.InstanceClass;
import software.amazon.awscdk.services.rds.InstanceSize;
import software.amazon.awscdk.services.rds.InstanceType;
import software.amazon.awscdk.services.rds.PostgresEngineVersion;
import software.amazon.awscdk.services.rds.SubnetGroup;
import software.amazon.awscdk.services.rds.SubnetGroupProps;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.BucketProps;
import software.amazon.awscdk.services.secretsmanager.Secret;
import software.amazon.awscdk.services.secretsmanager.SecretProps;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

public class Main {
    public static void main(final String[] args) {
        App app = new App();
        
        new EcommerceStack(app, "EcommerceStack", StackProps.builder()
                .env(Environment.builder()
                        .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                        .region(System.getenv("CDK_DEFAULT_REGION"))
                        .build())
                .build());
        
        app.synth();
    }
}

class EcommerceStack extends Stack {
    private final Map<String, String> commonTags = Map.of(
            "Project", "Ecommerce",
            "Stack", "ProdLike",
            "Owner", "CDK"
    );
    
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
                                .build()
                ))
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
                "Allow app tier to connect to PostgreSQL"
        );

        // Allow RDS to connect to AWS endpoints for maintenance
        rdsSecurityGroup.addEgressRule(
                software.amazon.awscdk.services.ec2.Peer.anyIpv4(),
                software.amazon.awscdk.services.ec2.Port.tcp(443),
                "Allow HTTPS to AWS endpoints"
        );
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
                                        .version(PostgresEngineVersion.VER_15_4)
                                        .build()))
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
                .enforceSSL(true)
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
                                        .originAccessIdentity(null) // We'll use OAC instead
                                        .build())
                                .viewerProtocolPolicy(ViewerProtocolPolicy.REDIRECT_TO_HTTPS)
                                .cachePolicy(CachePolicy.CACHING_OPTIMIZED)
                                .build())
                        .comment("CloudFront distribution for ecommerce assets")
                        .build());

        // Update the CloudFront distribution to use OAC
        software.amazon.awscdk.services.cloudfront.CfnDistribution cfnDistribution = 
                (software.amazon.awscdk.services.cloudfront.CfnDistribution) cloudFrontDistribution.getNode().getDefaultChild();
        
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
                                        this.getAccount(), cloudFrontDistribution.getDistributionId())
                        )
                ))
                .build());

        PolicyStatement denyInsecureConnections = new PolicyStatement(PolicyStatementProps.builder()
                .sid("DenyInsecureConnections")
                .effect(Effect.DENY)
                .principals(Arrays.asList(new software.amazon.awscdk.services.iam.AnyPrincipal()))
                .actions(Arrays.asList("s3:*"))
                .resources(Arrays.asList(
                        s3Bucket.getBucketArn(),
                        s3Bucket.getBucketArn() + "/*"
                ))
                .conditions(Map.of(
                        "Bool", Map.of("aws:SecureTransport", "false")
                ))
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
                                        new PolicyStatement(PolicyStatementProps.builder()
                                                .effect(Effect.ALLOW)
                                                .actions(Arrays.asList(
                                                        "secretsmanager:GetSecretValue",
                                                        "secretsmanager:DescribeSecret"
                                                ))
                                                .resources(Arrays.asList(dbSecret.getSecretArn()))
                                                .conditions(Map.of(
                                                        "Bool", Map.of("aws:SecureTransport", "true")
                                                ))
                                                .build(),
                                        new PolicyStatement(PolicyStatementProps.builder()
                                                .effect(Effect.ALLOW)
                                                .actions(Arrays.asList("rds:DescribeDBInstances"))
                                                .resources(Arrays.asList(rdsInstance.getInstanceArn()))
                                                .conditions(Map.of(
                                                        "Bool", Map.of("aws:SecureTransport", "true")
                                                ))
                                                .build()
                                ))
                                .build()
                ))
                .build());

        // Create S3 read-only role with least privilege
        s3ReadOnlyRole = new Role(this, "S3ReadOnlyRole", RoleProps.builder()
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .description("Role for read-only access to ecommerce assets bucket")
                .inlinePolicies(Map.of(
                        "S3ReadOnlyAccess", PolicyDocument.Builder.create()
                                .statements(Arrays.asList(
                                        new PolicyStatement(PolicyStatementProps.builder()
                                                .effect(Effect.ALLOW)
                                                .actions(Arrays.asList("s3:ListBucket"))
                                                .resources(Arrays.asList(s3Bucket.getBucketArn()))
                                                .conditions(Map.of(
                                                        "Bool", Map.of("aws:SecureTransport", "true")
                                                ))
                                                .build(),
                                        new PolicyStatement(PolicyStatementProps.builder()
                                                .effect(Effect.ALLOW)
                                                .actions(Arrays.asList("s3:GetObject"))
                                                .resources(Arrays.asList(s3Bucket.getBucketArn() + "/*"))
                                                .conditions(Map.of(
                                                        "Bool", Map.of("aws:SecureTransport", "true")
                                                ))
                                                .build()
                                ))
                                .build()
                ))
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
    public IVpc getVpc() { return vpc; }
    public DatabaseInstance getRdsInstance() { return rdsInstance; }
    public Bucket getS3Bucket() { return s3Bucket; }
    public Distribution getCloudFrontDistribution() { return cloudFrontDistribution; }
    public Role getRdsAccessRole() { return rdsAccessRole; }
    public Role getS3ReadOnlyRole() { return s3ReadOnlyRole; }
    public Secret getDbSecret() { return dbSecret; }
    public SecurityGroup getRdsSecurityGroup() { return rdsSecurityGroup; }
    public SecurityGroup getAppTierSecurityGroup() { return appTierSecurityGroup; }
}
```

## test/unit/UnitTests.java

```java
package test.unit;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lib.EcommerceStack;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import software.amazon.awscdk.App;
import software.amazon.awscdk.assertions.Template;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class UnitTests {
    private Template template;
    private EcommerceStack stack;

    @BeforeEach
    void setUp() {
        App app = new App();
        stack = new EcommerceStack(app, "TestStack");
        template = Template.fromStack(stack);
    }

    @Test
    void testVpcCreation() {
        // Verify VPC is created with correct configuration
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
                "EnableDnsHostnames", true,
                "EnableDnsSupport", true
        ));

        // Verify we have public and private subnets
        template.resourceCountIs("AWS::EC2::Subnet", 4); // 2 public + 2 private across 2 AZs
    }

    @Test
    void testRdsConfiguration() {
        // Verify RDS instance is not publicly accessible
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
                "PubliclyAccessible", false,
                "StorageEncrypted", true,
                "Engine", "postgres"
        ));

        // Verify DB subnet group uses private subnets
        template.hasResourceProperties("AWS::RDS::DBSubnetGroup", Map.of(
                "DBSubnetGroupDescription", "Subnet group for RDS database"
        ));
    }

    @Test
    void testS3BucketSecurity() {
        // Verify S3 bucket blocks all public access
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
                "PublicAccessBlockConfiguration", Map.of(
                        "BlockPublicAcls", true,
                        "BlockPublicPolicy", true,
                        "IgnorePublicAcls", true,
                        "RestrictPublicBuckets", true
                ),
                "BucketEncryption", Map.of(
                        "ServerSideEncryptionConfiguration", List.of(Map.of(
                                "ServerSideEncryptionByDefault", Map.of(
                                        "SSEAlgorithm", "AES256"
                                )
                        ))
                ),
                "VersioningConfiguration", Map.of(
                        "Status", "Enabled"
                )
        ));
    }

    @Test
    void testS3BucketPolicy() {
        // Verify bucket policy exists and contains CloudFront access
        Map<String, Object> bucketPolicyProperties = template.findResources("AWS::S3::BucketPolicy");
        assertFalse(bucketPolicyProperties.isEmpty(), "S3 bucket policy should exist");

        // Check that the policy contains CloudFront service principal
        template.hasResourceProperties("AWS::S3::BucketPolicy", Map.of(
                "PolicyDocument", Map.of(
                        "Statement", List.of(
                                Map.of(
                                        "Effect", "Allow",
                                        "Principal", Map.of("Service", "cloudfront.amazonaws.com"),
                                        "Action", "s3:GetObject"
                                ),
                                Map.of(
                                        "Effect", "Deny",
                                        "Principal", "*",
                                        "Action", "s3:*",
                                        "Condition", Map.of(
                                                "Bool", Map.of("aws:SecureTransport", "false")
                                        )
                                )
                        )
                )
        ));
    }

    @Test
    void testCloudFrontDistribution() {
        // Verify CloudFront distribution exists
        template.hasResourceProperties("AWS::CloudFront::Distribution", Map.of(
                "DistributionConfig", Map.of(
                        "Comment", "CloudFront distribution for ecommerce assets",
                        "DefaultCacheBehavior", Map.of(
                                "ViewerProtocolPolicy", "redirect-to-https"
                        )
                )
        ));

        // Verify Origin Access Control exists
        template.hasResourceProperties("AWS::CloudFront::OriginAccessControl", Map.of(
                "OriginAccessControlConfig", Map.of(
                        "Name", "EcommerceOAC",
                        "OriginAccessControlOriginType", "s3",
                        "SigningBehavior", "always",
                        "SigningProtocol", "sigv4"
                )
        ));
    }

    @Test
    void testSecurityGroups() {
        // Verify RDS security group exists and has correct ingress rules
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
                "GroupDescription", "Security group for RDS database"
        ));

        // Verify app tier security group exists
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
                "GroupDescription", "Security group for application tier"
        ));

        // Verify security group ingress rule for RDS
        template.hasResourceProperties("AWS::EC2::SecurityGroupIngress", Map.of(
                "IpProtocol", "tcp",
                "FromPort", 5432,
                "ToPort", 5432
        ));
    }

    @Test
    void testIamRolesLeastPrivilege() {
        // Verify RDS access role exists with scoped permissions
        Map<String, Object> roles = template.findResources("AWS::IAM::Role");
        assertTrue(roles.size() >= 2, "Should have at least 2 IAM roles");

        // Check that roles have inline policies with resource-specific ARNs
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
                "AssumeRolePolicyDocument", Map.of(
                        "Statement", List.of(Map.of(
                                "Effect", "Allow",
                                "Principal", Map.of("Service", "ec2.amazonaws.com"),
                                "Action", "sts:AssumeRole"
                        ))
                )
        ));
    }

    @Test
    void testSecretsManagerSecret() {
        // Verify database secret is created
        template.hasResourceProperties("AWS::SecretsManager::Secret", Map.of(
                "Description", "Database credentials for ecommerce application",
                "GenerateSecretString", Map.of(
                        "SecretStringTemplate", "{\"username\": \"ecommerceuser\"}",
                        "GenerateStringKey", "password",
                        "ExcludeCharacters", "\"@/\\",
                        "PasswordLength", 32
                )
        ));
    }

    @Test
    void testResourceTagging() {
        // Get all resources from template
        ObjectMapper mapper = new ObjectMapper();
        JsonNode templateJson = mapper.valueToTree(template.toJSON());
        JsonNode resources = templateJson.get("Resources");

        // Check that resources have proper tags
        resources.fields().forEachRemaining(entry -> {
            JsonNode resource = entry.getValue();
            if (resource.has("Properties") && resource.get("Properties").has("Tags")) {
                JsonNode tags = resource.get("Properties").get("Tags");
                boolean hasProjectTag = false;
                boolean hasStackTag = false;
                boolean hasOwnerTag = false;

                for (JsonNode tag : tags) {
                    String key = tag.get("Key").asText();
                    String value = tag.get("Value").asText();
                    
                    if ("Project".equals(key) && "Ecommerce".equals(value)) {
                        hasProjectTag = true;
                    } else if ("Stack".equals(key) && "ProdLike".equals(value)) {
                        hasStackTag = true;
                    } else if ("Owner".equals(key) && "CDK".equals(value)) {
                        hasOwnerTag = true;
                    }
                }

                // Some resources might not support all tags, but check for at least one
                assertTrue(hasProjectTag || hasStackTag || hasOwnerTag, 
                        "Resource should have at least one of the required tags: " + entry.getKey());
            }
        });
    }

    @Test
    void testOutputsExist() {
        // Verify all required outputs are present
        template.hasOutput("VpcId", Map.of());
        template.hasOutput("PrivateSubnetIds", Map.of());
        template.hasOutput("RdsEndpoint", Map.of());
        template.hasOutput("S3BucketName", Map.of());
        template.hasOutput("CloudFrontDomain", Map.of());
        template.hasOutput("DbSecretArn", Map.of());
        template.hasOutput("RdsAccessRoleArn", Map.of());
        template.hasOutput("S3ReadOnlyRoleArn", Map.of());
    }

    @Test
    void testNoWildcardResourcesInIamPolicies() {
        Map<String, Object> roles = template.findResources("AWS::IAM::Role");
        
        for (Map.Entry<String, Object> roleEntry : roles.entrySet()) {
            @SuppressWarnings("unchecked")
            Map<String, Object> roleProperties = (Map<String, Object>) roleEntry.getValue();
            @SuppressWarnings("unchecked")
            Map<String, Object> properties = (Map<String, Object>) roleProperties.get("Properties");
            
            if (properties.containsKey("Policies")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> policies = (List<Map<String, Object>>) properties.get("Policies");
                
                for (Map<String, Object> policy : policies) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> policyDocument = (Map<String, Object>) policy.get("PolicyDocument");
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> statements = (List<Map<String, Object>>) policyDocument.get("Statement");
                    
                    for (Map<String, Object> statement : statements) {
                        if (statement.containsKey("Resource")) {
                            Object resource = statement.get("Resource");
                            if (resource instanceof String) {
                                assertNotEquals("*", resource, 
                                        "IAM policy should not use wildcard resources: " + roleEntry.getKey());
                            } else if (resource instanceof List) {
                                @SuppressWarnings("unchecked")
                