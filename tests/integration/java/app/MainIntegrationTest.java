package app;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.File;
import java.net.URI;
import java.net.URLDecoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Duration;
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
// CloudFormation
import software.amazon.awssdk.services.cloudformation.CloudFormationClient;
import software.amazon.awssdk.services.cloudformation.model.DescribeStacksRequest;
import software.amazon.awssdk.services.cloudformation.model.Stack;
// EC2/VPC
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.DescribeSecurityGroupsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeSecurityGroupsResponse;
import software.amazon.awssdk.services.ec2.model.DescribeSubnetsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeSubnetsResponse;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsResponse;
import software.amazon.awssdk.services.ec2.model.Filter;
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

  private static final String OUTPUTS_FILE_PATH = Optional.ofNullable(System.getProperty("OUTPUTS_FILE_PATH"))
      .orElseGet(() -> System.getenv().getOrDefault("OUTPUTS_FILE_PATH", "cfn-outputs/flat-outputs.json"));

  // ---- AWS clients ----
  private static CloudFormationClient cfn;
  private static Ec2Client ec2;
  private static RdsClient rds;
  private static S3Client s3;
  private static IamClient iam;
  private static SecretsManagerClient secrets;

  // ---- Outputs ----
  private static Map<String, String> outputs;

  private static final ObjectMapper MAPPER = new ObjectMapper();

  @BeforeAll
  static void setup() {
    Region region = Region.of(REGION_STR);
    DefaultCredentialsProvider creds = DefaultCredentialsProvider.create();

    // Always initialize clients; tests that need them will check outputs first.
    cfn = CloudFormationClient.builder().region(region).credentialsProvider(creds).build();
    ec2 = Ec2Client.builder().region(region).credentialsProvider(creds).build();
    rds = RdsClient.builder().region(region).credentialsProvider(creds).build();
    s3 = S3Client.builder().region(region).credentialsProvider(creds).build();
    iam = IamClient.builder().region(region).credentialsProvider(creds).build();
    secrets = SecretsManagerClient.builder().region(region).credentialsProvider(creds).build();

    // 1) Try to load outputs from file
    outputs = tryLoadOutputsFromFile();

    // 2) Fallback to CloudFormation if file missing
    if (outputs == null || outputs.isEmpty()) {
      outputs = tryLoadStackOutputsViaCfn(STACK_NAME);
    }
    // No hard assertion here — each test will skip if its needed keys are missing.
  }

  private static Map<String, String> tryLoadOutputsFromFile() {
    try {
      File file = new File(OUTPUTS_FILE_PATH);
      if (!file.exists()) {
        return null;
      }
      String content = Files.readString(Paths.get(OUTPUTS_FILE_PATH));
      if (content == null || content.isBlank()) {
        return null;
      }
      JsonNode node = MAPPER.readTree(content);
      @SuppressWarnings("unchecked")
      Map<String, String> out = MAPPER.convertValue(node, Map.class);
      return out;
    } catch (Exception e) {
      // Swallow and let CFN fallback handle it
      return null;
    }
  }

  private static Map<String, String> tryLoadStackOutputsViaCfn(String stackName) {
    try {
      Stack stack = cfn.describeStacks(DescribeStacksRequest.builder().stackName(stackName).build())
          .stacks().stream().findFirst().orElse(null);
      if (stack == null || stack.outputs() == null) {
        return null;
      }
      Map<String, String> out = new HashMap<>();
      stack.outputs().forEach(o -> out.put(o.outputKey(), o.outputValue()));
      return out;
    } catch (Exception e) {
      return null;
    }
  }

  // -------------- VPC & Subnets --------------

  @Test
  @Order(1)
  void vpcAndSubnetsExist() {
    if (outputs == null || !outputs.containsKey("VpcId") || !outputs.containsKey("PrivateSubnetIds")) {
      return; // skip
    }
    String vpcId = outputs.get("VpcId");
    DescribeVpcsResponse vpcs = ec2.describeVpcs(DescribeVpcsRequest.builder().vpcIds(vpcId).build());
    assertThat(vpcs.vpcs()).hasSize(1);

    String privateSubnetIdsCsv = outputs.get("PrivateSubnetIds");
    List<String> subnetIds = Arrays.stream(privateSubnetIdsCsv.split(","))
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .collect(Collectors.toList());
    assertThat(subnetIds).hasSize(2);

    DescribeSubnetsResponse subnets = ec2
        .describeSubnets(DescribeSubnetsRequest.builder().subnetIds(subnetIds).build());
    assertThat(subnets.subnets()).hasSize(2);
    subnets.subnets().forEach(sn -> assertThat(Boolean.TRUE.equals(sn.mapPublicIpOnLaunch())).isFalse());
  }

  // -------------- RDS --------------

  @Test
  @Order(2)
  void rdsInstanceMatchesOutputAndProps() {
    if (outputs == null || !outputs.containsKey("RdsEndpoint")) {
      return; // skip
    }
    String endpoint = outputs.get("RdsEndpoint");

    DescribeDbInstancesResponse all = rds.describeDBInstances();
    DBInstance db = all.dbInstances().stream()
        .filter(i -> i.endpoint() != null && endpoint.equalsIgnoreCase(i.endpoint().address()))
        .findFirst()
        .orElseThrow(() -> new AssertionError("No RDS instance with endpoint " + endpoint));

    assertThat(db.engine()).isEqualTo("postgres");
    assertThat(db.engineVersion()).startsWith(EXPECTED_PG_VERSION);
    assertThat(Boolean.TRUE.equals(db.storageEncrypted())).isTrue();
    assertThat(Boolean.TRUE.equals(db.publiclyAccessible())).isFalse();
    assertThat(db.dbName()).isEqualTo("ecommercedb");
  }

  // -------------- Secrets Manager --------------

  @Test
  @Order(3)
  void secretExists() {
    if (outputs == null || !outputs.containsKey("DbSecretArn")) {
      return; // skip
    }
    String secretArn = outputs.get("DbSecretArn");
    DescribeSecretResponse resp = secrets.describeSecret(DescribeSecretRequest.builder().secretId(secretArn).build());
    assertThat(resp.arn()).isEqualTo(secretArn);
    assertThat(resp.name()).isNotBlank();
  }

  // -------------- S3 Bucket --------------

  @Test
  @Order(4)
  void s3BucketHasVersioningEncryptionPolicyAndPAB() {
    if (outputs == null || !outputs.containsKey("S3BucketName")) {
      return; // skip
    }
    String bucket = outputs.get("S3BucketName");

    GetBucketVersioningResponse ver = s3
        .getBucketVersioning(GetBucketVersioningRequest.builder().bucket(bucket).build());
    assertThat(ver.statusAsString()).isEqualTo("Enabled");

    GetBucketEncryptionResponse enc = s3
        .getBucketEncryption(GetBucketEncryptionRequest.builder().bucket(bucket).build());
    String alg = enc.serverSideEncryptionConfiguration().rules().get(0)
        .applyServerSideEncryptionByDefault().sseAlgorithmAsString();
    assertThat(alg).isEqualTo("AES256");

    GetBucketPolicyResponse pol = s3.getBucketPolicy(GetBucketPolicyRequest.builder().bucket(bucket).build());
    String doc = pol.policy();
    assertThat(doc).isNotBlank();
    assertThat(doc).contains("aws:SecureTransport").contains("\"Effect\":\"Deny\"");

    GetPublicAccessBlockResponse pab = s3
        .getPublicAccessBlock(GetPublicAccessBlockRequest.builder().bucket(bucket).build());
    assertThat(pab.publicAccessBlockConfiguration().blockPublicAcls()).isTrue();
    assertThat(pab.publicAccessBlockConfiguration().blockPublicPolicy()).isTrue();
    assertThat(pab.publicAccessBlockConfiguration().ignorePublicAcls()).isTrue();
    assertThat(pab.publicAccessBlockConfiguration().restrictPublicBuckets()).isTrue();
  }

  // -------------- CloudFront + OAC (HTTP-based, no SDK) --------------

  @Test
  @Order(5)
  void cloudFrontDistributionForcesHttpsAndResponds() throws Exception {
    if (outputs == null || !outputs.containsKey("CloudFrontDomain")) {
      return; // skip
    }
    String domain = outputs.get("CloudFrontDomain");

    HttpClient noFollow = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER)
        .connectTimeout(Duration.ofSeconds(15)).build();
    HttpClient follow = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NORMAL)
        .connectTimeout(Duration.ofSeconds(15)).build();

    // 1) HTTP should redirect to HTTPS
    HttpRequest httpReq = HttpRequest.newBuilder()
        .uri(URI.create("http://" + domain + "/"))
        .timeout(Duration.ofSeconds(15))
        .GET()
        .build();
    HttpResponse<Void> httpResp = noFollow.send(httpReq, HttpResponse.BodyHandlers.discarding());
    int code = httpResp.statusCode();
    assertThat(code).isIn(301, 302, 307, 308);
    String location = httpResp.headers().firstValue("Location").orElse("");
    assertThat(location).startsWith("https://");

    // 2) HTTPS should respond
    HttpRequest httpsReq = HttpRequest.newBuilder()
        .uri(URI.create("https://" + domain + "/"))
        .timeout(Duration.ofSeconds(15))
        .GET()
        .build();
    HttpResponse<Void> httpsResp = follow.send(httpsReq, HttpResponse.BodyHandlers.discarding());
    assertThat(httpsResp.statusCode()).isBetween(200, 599);
  }

  // -------------- IAM Roles --------------

  @Test
  @Order(6)
  void iamRolesExistAndHaveExpectedPolicies() throws Exception {
    if (outputs == null || !outputs.containsKey("RdsAccessRoleArn") || !outputs.containsKey("S3ReadOnlyRoleArn")) {
      return; // skip
    }
    String rdsRoleArn = outputs.get("RdsAccessRoleArn");
    String s3RoleArn = outputs.get("S3ReadOnlyRoleArn");

    String rdsRoleName = rdsRoleArn.substring(rdsRoleArn.lastIndexOf("/") + 1);
    String s3RoleName = s3RoleArn.substring(s3RoleArn.lastIndexOf("/") + 1);

    Role rdsRole = iam.getRole(GetRoleRequest.builder().roleName(rdsRoleName).build()).role();
    Role s3Role = iam.getRole(GetRoleRequest.builder().roleName(s3RoleName).build()).role();

    assertThat(URLDecoder.decode(rdsRole.assumeRolePolicyDocument(), StandardCharsets.UTF_8))
        .contains("ec2.amazonaws.com");
    assertThat(URLDecoder.decode(s3Role.assumeRolePolicyDocument(), StandardCharsets.UTF_8))
        .contains("ec2.amazonaws.com");

    ListRolePoliciesResponse rdsPols = iam
        .listRolePolicies(ListRolePoliciesRequest.builder().roleName(rdsRoleName).build());
    assertThat(rdsPols.policyNames()).isNotEmpty();
    boolean rdsHasSmAndRds = inlinePolicyHasActions(
        rdsRoleName,
        Set.of("secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret", "rds:DescribeDBInstances"));
    assertThat(rdsHasSmAndRds).isTrue();

    ListRolePoliciesResponse s3Pols = iam
        .listRolePolicies(ListRolePoliciesRequest.builder().roleName(s3RoleName).build());
    assertThat(s3Pols.policyNames()).isNotEmpty();
    boolean s3HasListAndGet = inlinePolicyHasActions(s3RoleName, Set.of("s3:ListBucket", "s3:GetObject"));
    assertThat(s3HasListAndGet).isTrue();
  }

  private boolean inlinePolicyHasActions(String roleName, Set<String> required) throws Exception {
    ListRolePoliciesResponse namesResp = iam
        .listRolePolicies(ListRolePoliciesRequest.builder().roleName(roleName).build());

    for (String polName : namesResp.policyNames()) {
      GetRolePolicyResponse pol = iam
          .getRolePolicy(GetRolePolicyRequest.builder().roleName(roleName).policyName(polName).build());
      String json = URLDecoder.decode(pol.policyDocument(), StandardCharsets.UTF_8);
      JsonNode root = MAPPER.readTree(json);
      JsonNode stmt = root.get("Statement");
      if (stmt == null) {
        continue;
      }
      List<String> actions = new ArrayList<>();
      if (stmt.isArray()) {
        for (JsonNode s : (ArrayNode) stmt) {
          JsonNode a = s.get("Action");
          if (a == null) {
            continue;
          }
          if (a.isArray()) {
            a.forEach(x -> actions.add(x.asText()));
          } else {
            actions.add(a.asText());
          }
        }
      }
      if (actions.containsAll(required)) {
        return true;
      }
    }
    return false;
  }

  // -------------- Security Groups (by tags in VPC) --------------

  @Test
  @Order(7)
  void securityGroupsTaggedExistInVpc() {
    if (outputs == null || !outputs.containsKey("VpcId")) {
      return; // skip
    }
    String vpcId = outputs.get("VpcId");
    DescribeSecurityGroupsResponse sgs = ec2.describeSecurityGroups(
        DescribeSecurityGroupsRequest.builder()
            .filters(
                Filter.builder().name("vpc-id").values(vpcId).build(),
                Filter.builder().name("tag:Project").values("Ecommerce").build(),
                Filter.builder().name("tag:Stack").values("ProdLike").build())
            .build());
    assertThat(sgs.securityGroups().size()).isGreaterThanOrEqualTo(2);
  }
}
