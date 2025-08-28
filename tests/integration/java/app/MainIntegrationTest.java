package app;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

// JSON (policy parsing)
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;

import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
// CFN
import software.amazon.awssdk.services.cloudformation.CloudFormationClient;
import software.amazon.awssdk.services.cloudformation.model.DescribeStacksRequest;
import software.amazon.awssdk.services.cloudformation.model.Stack;
// CloudFront
import software.amazon.awssdk.services.cloudfront.CloudFrontClient;
import software.amazon.awssdk.services.cloudfront.model.*;
// EC2/VPC
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.DescribeSecurityGroupsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeSecurityGroupsResponse;
import software.amazon.awssdk.services.ec2.model.DescribeSubnetsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeSubnetsResponse;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsResponse;
// IAM
import software.amazon.awssdk.services.iam.IamClient;
import software.amazon.awssdk.services.iam.model.GetRolePolicyRequest;
import software.amazon.awssdk.services.iam.model.GetRolePolicyResponse;
import software.amazon.awssdk.services.iam.model.GetRoleRequest;
import software.amazon.awssdk.services.iam.model.ListRolePoliciesRequest;
import software.amazon.awssdk.services.iam.model.ListRolePoliciesResponse;
import software.amazon.awssdk.services.iam.model.Role;
// RDS
import software.amazon.awssdk.services.rds.RdsClient;
import software.amazon.awssdk.services.rds.model.DBInstance;
import software.amazon.awssdk.services.rds.model.DescribeDbInstancesResponse;
// S3
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetBucketEncryptionRequest;
import software.amazon.awssdk.services.s3.model.GetBucketEncryptionResponse;
import software.amazon.awssdk.services.s3.model.GetBucketPolicyRequest;
import software.amazon.awssdk.services.s3.model.GetBucketPolicyResponse;
import software.amazon.awssdk.services.s3.model.GetBucketVersioningRequest;
import software.amazon.awssdk.services.s3.model.GetBucketVersioningResponse;
import software.amazon.awssdk.services.s3.model.GetPublicAccessBlockRequest;
import software.amazon.awssdk.services.s3.model.GetPublicAccessBlockResponse;
// Secrets Manager
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.DescribeSecretRequest;
import software.amazon.awssdk.services.secretsmanager.model.DescribeSecretResponse;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class MainIntegrationTest {

    // ---- Config via env vars / system properties ----
    private static final String ENV_SUFFIX = System.getenv().getOrDefault("ENV_SUFFIX", "dev");
    private static final String STACK_NAME = System.getenv().getOrDefault("STACK_NAME", "EcommerceStack" + ENV_SUFFIX);
    private static final String REGION_STR = Optional.ofNullable(System.getenv("AWS_REGION"))
            .orElse(Optional.ofNullable(System.getenv("CDK_DEFAULT_REGION")).orElse("us-east-1"));
    private static final String EXPECTED_PG_VERSION = System.getenv().getOrDefault("EXPECTED_PG_VERSION", "15.10");

    // ---- AWS clients ----
    private static CloudFormationClient cfn;
    private static Ec2Client ec2;
    private static RdsClient rds;
    private static S3Client s3;
    private static CloudFrontClient cf;
    private static IamClient iam;
    private static SecretsManagerClient secrets;

    // ---- Outputs ----
    private static Map<String, String> outputs;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @BeforeAll
    static void setup() {
        Region region = Region.of(REGION_STR);
        DefaultCredentialsProvider creds = DefaultCredentialsProvider.create();

        cfn = CloudFormationClient.builder().region(region).credentialsProvider(creds).build();
        ec2 = Ec2Client.builder().region(region).credentialsProvider(creds).build();
        rds = RdsClient.builder().region(region).credentialsProvider(creds).build();
        s3  = S3Client.builder().region(region).credentialsProvider(creds).build();
        cf  = CloudFrontClient.builder().credentialsProvider(creds).build(); // global
        iam = IamClient.builder().region(region).credentialsProvider(creds).build();
        secrets = SecretsManagerClient.builder().region(region).credentialsProvider(creds).build();

        outputs = loadStackOutputs(STACK_NAME);
        assertThat(outputs)
            .withFailMessage("No outputs found for stack '%s' in region %s", STACK_NAME, REGION_STR)
            .isNotEmpty();
    }

    private static Map<String, String> loadStackOutputs(String stackName) {
        Stack stack = cfn.describeStacks(DescribeStacksRequest.builder().stackName(stackName).build())
                .stacks().stream().findFirst()
                .orElseThrow(() -> new AssertionError("Stack not found: " + stackName));

        Map<String, String> out = new HashMap<>();
        stack.outputs().forEach(o -> out.put(o.outputKey(), o.outputValue()));
        return out;
    }

    // -------------- VPC & Subnets --------------

    @Test @Order(1)
    void vpcAndSubnetsExist() {
        String vpcId = outputs.get("VpcId");
        assertThat(vpcId).isNotBlank();

        DescribeVpcsResponse vpcs = ec2.describeVpcs(DescribeVpcsRequest.builder()
                .vpcIds(vpcId).build());
        assertThat(vpcs.vpcs()).hasSize(1);

        String privateSubnetIdsCsv = outputs.get("PrivateSubnetIds");
        assertThat(privateSubnetIdsCsv).isNotBlank();
        List<String> subnetIds = Arrays.stream(privateSubnetIdsCsv.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList());
        assertThat(subnetIds).hasSize(2);

        DescribeSubnetsResponse subnets = ec2.describeSubnets(DescribeSubnetsRequest.builder()
                .subnetIds(subnetIds).build());
        assertThat(subnets.subnets()).hasSize(2);
        // Ensure they’re isolated/private (no mapPublicIpOnLaunch, route check is heavier)
        subnets.subnets().forEach(sn ->
            assertThat(Boolean.TRUE.equals(sn.mapPublicIpOnLaunch())).isFalse()
        );
    }

    // -------------- RDS --------------

    @Test @Order(2)
    void rdsInstanceMatchesOutputAndProps() {
        String endpoint = outputs.get("RdsEndpoint");
        assertThat(endpoint).isNotBlank();

        // Find DB by endpoint
        DescribeDbInstancesResponse all = rds.describeDBInstances();
        DBInstance db = all.dbInstances().stream()
                .filter(i -> i.endpoint() != null && endpoint.equalsIgnoreCase(i.endpoint().address()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("No RDS instance with endpoint " + endpoint));

        assertThat(db.engine()).isEqualTo("postgres");
        // EngineVersion can include a build suffix; accept prefix match against EXPECTED_PG_VERSION
        assertThat(db.engineVersion()).startsWith(EXPECTED_PG_VERSION);
        assertThat(Boolean.TRUE.equals(db.storageEncrypted())).isTrue();
        assertThat(Boolean.TRUE.equals(db.publiclyAccessible())).isFalse();
        assertThat(db.dbName()).isEqualTo("ecommercedb");
    }

    // -------------- Secrets Manager --------------

    @Test @Order(3)
    void secretExists() {
        String secretArn = outputs.get("DbSecretArn");
        assertThat(secretArn).isNotBlank();

        DescribeSecretResponse resp = secrets.describeSecret(
                DescribeSecretRequest.builder().secretId(secretArn).build());
        assertThat(resp.arn()).isEqualTo(secretArn);
        assertThat(resp.name()).isNotBlank();
    }

    // -------------- S3 Bucket --------------

    @Test @Order(4)
    void s3BucketHasVersioningEncryptionPolicyAndPAB() {
        String bucket = outputs.get("S3BucketName");
        assertThat(bucket).isNotBlank();

        // Versioning
        GetBucketVersioningResponse ver = s3.getBucketVersioning(GetBucketVersioningRequest.builder()
                .bucket(bucket).build());
        assertThat(ver.statusAsString()).isEqualTo("Enabled");

        // Encryption (SSE-S3)
        GetBucketEncryptionResponse enc = s3.getBucketEncryption(GetBucketEncryptionRequest.builder()
                .bucket(bucket).build());
        String alg = enc.serverSideEncryptionConfiguration().rules().get(0)
                .applyServerSideEncryptionByDefault().sseAlgorithmAsString();
        assertThat(alg).isEqualTo("AES256");

        // Policy includes Deny on aws:SecureTransport = false
        GetBucketPolicyResponse pol = s3.getBucketPolicy(GetBucketPolicyRequest.builder()
                .bucket(bucket).build());
        String doc = pol.policy();
        assertThat(doc).isNotBlank();
        assertThat(doc).contains("aws:SecureTransport").contains("\"Effect\":\"Deny\"");

        // Public Access Block (bucket-level)
        GetPublicAccessBlockResponse pab = s3.getPublicAccessBlock(
                GetPublicAccessBlockRequest.builder().bucket(bucket).build());
        assertThat(pab.publicAccessBlockConfiguration().blockPublicAcls()).isTrue();
        assertThat(pab.publicAccessBlockConfiguration().blockPublicPolicy()).isTrue();
        assertThat(pab.publicAccessBlockConfiguration().ignorePublicAcls()).isTrue();
        assertThat(pab.publicAccessBlockConfiguration().restrictPublicBuckets()).isTrue();
    }

    // -------------- CloudFront + OAC --------------

    @Test @Order(5)
    void cloudFrontDistributionForcesHttpsAndUsesOac() {
        String domain = outputs.get("CloudFrontDomain");
        assertThat(domain).isNotBlank();

        // Find distribution by domain name (summary is in the global CF data plane)
        DistributionSummary summary = findDistributionByDomain(domain);
        assertThat(summary).withFailMessage("CloudFront distribution not found for domain: %s", domain).isNotNull();

        String distId = summary.id();
        GetDistributionResponse dist = cf.getDistribution(GetDistributionRequest.builder().id(distId).build());

        // HTTPS redirect
        String viewerPolicy = dist.distribution().distributionConfig()
                .defaultCacheBehavior().viewerProtocolPolicyAsString();
        assertThat(viewerPolicy).isEqualTo("redirect-to-https");

        // OAC attached to S3 origin
        Origins origins = dist.distribution().distributionConfig().origins();
        assertThat(origins.items()).isNotEmpty();
        boolean hasOacOnS3 = origins.items().stream().anyMatch(o ->
                (o.domainName() != null && o.domainName().toLowerCase().contains(".s3."))
                        && o.originAccessControlId() != null && !o.originAccessControlId().isEmpty());
        assertThat(hasOacOnS3).isTrue();
    }

    private DistributionSummary findDistributionByDomain(String domain) {
        String marker = null;
        do {
            ListDistributionsResponse page = cf.listDistributions(
                    ListDistributionsRequest.builder().marker(marker).build());
            if (page.distributionList() != null && page.distributionList().items() != null) {
                Optional<DistributionSummary> match = page.distributionList().items().stream()
                        .filter(d -> domain.equalsIgnoreCase(d.domainName()))
                        .findFirst();
                if (match.isPresent()) return match.get();
            }
            marker = (page.distributionList() != null && page.distributionList().isTruncated())
                    ? page.distributionList().nextMarker() : null;
        } while (marker != null);
        return null;
    }

    // -------------- IAM Roles --------------

    @Test @Order(6)
    void iamRolesExistAndHaveExpectedPolicies() throws Exception {
        String rdsRoleArn = outputs.get("RdsAccessRoleArn");
        String s3RoleArn  = outputs.get("S3ReadOnlyRoleArn");
        assertThat(rdsRoleArn).isNotBlank();
        assertThat(s3RoleArn).isNotBlank();

        String rdsRoleName = rdsRoleArn.substring(rdsRoleArn.lastIndexOf("/") + 1);
        String s3RoleName  = s3RoleArn.substring(s3RoleArn.lastIndexOf("/") + 1);

        Role rdsRole = iam.getRole(GetRoleRequest.builder().roleName(rdsRoleName).build()).role();
        Role s3Role  = iam.getRole(GetRoleRequest.builder().roleName(s3RoleName).build()).role();

        // Trust policy includes EC2
        assertThat(URLDecoder.decode(rdsRole.assumeRolePolicyDocument(), StandardCharsets.UTF_8))
                .contains("ec2.amazonaws.com");
        assertThat(URLDecoder.decode(s3Role.assumeRolePolicyDocument(), StandardCharsets.UTF_8))
                .contains("ec2.amazonaws.com");

        // Inline policies: check expected actions exist
        // RDS role
        ListRolePoliciesResponse rdsPols = iam.listRolePolicies(ListRolePoliciesRequest.builder()
                .roleName(rdsRoleName).build());
        assertThat(rdsPols.policyNames()).isNotEmpty();
        boolean rdsHasSmAndRds = inlinePolicyHasActions(rdsRoleName,
                Set.of("secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret", "rds:DescribeDBInstances"));
        assertThat(rdsHasSmAndRds).isTrue();

        // S3 read-only role
        ListRolePoliciesResponse s3Pols = iam.listRolePolicies(ListRolePoliciesRequest.builder()
                .roleName(s3RoleName).build());
        assertThat(s3Pols.policyNames()).isNotEmpty();
        boolean s3HasListAndGet = inlinePolicyHasActions(s3RoleName,
                Set.of("s3:ListBucket", "s3:GetObject"));
        assertThat(s3HasListAndGet).isTrue();
    }

    private boolean inlinePolicyHasActions(String roleName, Set<String> required) throws Exception {
        ListRolePoliciesResponse namesResp = iam.listRolePolicies(ListRolePoliciesRequest.builder()
                .roleName(roleName).build());

        for (String polName : namesResp.policyNames()) {
            GetRolePolicyResponse pol = iam.getRolePolicy(GetRolePolicyRequest.builder()
                    .roleName(roleName).policyName(polName).build());
            String json = URLDecoder.decode(pol.policyDocument(), StandardCharsets.UTF_8);
            JsonNode root = MAPPER.readTree(json);
            JsonNode stmt = root.get("Statement");
            if (stmt == null) continue;
            List<String> actions = new ArrayList<>();
            if (stmt.isArray()) {
                for (JsonNode s : (ArrayNode) stmt) {
                    JsonNode a = s.get("Action");
                    if (a == null) continue;
                    if (a.isArray()) {
                        a.forEach(x -> actions.add(x.asText()));
                    } else {
                        actions.add(a.asText());
                    }
                }
            }
            if (actions.containsAll(required)) return true;
        }
        return false;
    }

    // -------------- Security Groups (by tags in VPC) --------------

    @Test @Order(7)
    void securityGroupsTaggedExistInVpc() {
        String vpcId = outputs.get("VpcId");
        DescribeSecurityGroupsResponse sgs = ec2.describeSecurityGroups(DescribeSecurityGroupsRequest.builder()
                .filters(
                        Filter.builder().name("vpc-id").values(vpcId).build(),
                        Filter.builder().name("tag:Project").values("Ecommerce").build(),
                        Filter.builder().name("tag:Stack").values("ProdLike").build()
                ).build());
        // app-tier + rds SG (at least 2)
        assertThat(sgs.securityGroups().size()).isGreaterThanOrEqualTo(2);
    }
}
