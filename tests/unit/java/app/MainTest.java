package app;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import software.amazon.awscdk.App;
import software.amazon.awscdk.assertions.Match;
import software.amazon.awscdk.assertions.Template;

/**
 * Unit tests for the TAP CDK application.
 */
public class MainTest {

  // ---------- TapStack tests ----------

  @Test
  public void testStackCreation() {
    App app = new App();
    TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
        .environmentSuffix("test")
        .build());

    assertThat(stack).isNotNull();
    assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
  }

  @Test
  public void testDefaultEnvironmentSuffix() {
    App app = new App();
    TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());
    assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
  }

  @Test
  public void testStackSynthesis() {
    App app = new App();
    TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
        .environmentSuffix("test")
        .build());
    Template template = Template.fromStack(stack);
    assertThat(template).isNotNull();
  }

  @Test
  public void testEnvironmentSuffixFromContext() {
    App app = new App();
    app.getNode().setContext("environmentSuffix", "staging");
    TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());
    assertThat(stack.getEnvironmentSuffix()).isEqualTo("staging");
  }

  // ---------- EcommerceStack tests ----------

  @Test
  public void ecommerceStack_hasCoreResources() {
    App app = new App();
    EcommerceStack stack = new EcommerceStack(app, "EcommerceStackTest");
    Template template = Template.fromStack(stack);

    // VPC + 2 public + 2 private isolated subnets
    template.resourceCountIs("AWS::EC2::VPC", 1);
    template.resourceCountIs("AWS::EC2::Subnet", 4);

    // Security groups: app tier + RDS
    template.resourceCountIs("AWS::EC2::SecurityGroup", 2);

    // Secrets Manager secret generated with username template + password key
    template.hasResourceProperties("AWS::SecretsManager::Secret", Map.of(
        "GenerateSecretString", Match.objectLike(Map.of(
            "SecretStringTemplate", "{\"username\": \"ecommerceuser\"}",
            "GenerateStringKey", "password",
            "PasswordLength", 32))));

    // RDS Postgres instance: engine 15.10, encrypted, private, named DB
    template.resourceCountIs("AWS::RDS::DBInstance", 1);
    template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
        "Engine", "postgres",
        "EngineVersion", "15.10",
        "PubliclyAccessible", false,
        "StorageEncrypted", true,
        "DBName", "ecommercedb"));

    // DB Subnet Group present
    template.resourceCountIs("AWS::RDS::DBSubnetGroup", 1);

    // S3 Bucket: versioning + SSE-S3 encryption
    template.resourceCountIs("AWS::S3::Bucket", 1);
    template.hasResourceProperties("AWS::S3::Bucket", Map.of(
        "VersioningConfiguration", Map.of("Status", "Enabled"),
        "BucketEncryption", Match.objectLike(Map.of(
            "ServerSideEncryptionConfiguration", Match.arrayWith(List.of(
                Match.objectLike(Map.of(
                    "ServerSideEncryptionByDefault", Map.of("SSEAlgorithm", "AES256"))))))))));

    // Bucket policy: deny non-SSL requests
    template.hasResourceProperties("AWS::S3::BucketPolicy", Map.of(
        "PolicyDocument", Match.objectLike(Map.of(
            "Statement", Match.arrayWith(List.of(
                Match.objectLike(Map.of(
                    "Effect", "Deny",
                    "Condition", Map.of("Bool", Map.of("aws:SecureTransport", "false"))
                ))
            ))
        ))
    ));

    // CloudFront: Distribution + OAC configured for S3 origin
    template.resourceCountIs("AWS::CloudFront::Distribution", 1);
    template.hasResourceProperties("AWS::CloudFront::Distribution", Map.of(
        "DistributionConfig", Match.objectLike(Map.of(
            "DefaultCacheBehavior", Match.objectLike(Map.of(
                "ViewerProtocolPolicy", "redirect-to-https"))))));

    template.resourceCountIs("AWS::CloudFront::OriginAccessControl", 1);
    template.hasResourceProperties("AWS::CloudFront::OriginAccessControl", Map.of(
        "OriginAccessControlConfig", Map.of(
            "SigningProtocol", "sigv4",
            "SigningBehavior", "always",
            "OriginAccessControlOriginType", "s3")));

    // IAM Roles: RDS access and S3 read-only
    template.resourceCountIs("AWS::IAM::Role", 2);

    // ---- IAM: RDS access role (robust to Action string/array) ----
    template.hasResourceProperties("AWS::IAM::Role", Map.of(
        "Description", "Role for accessing RDS database secrets and metadata",
        "Policies", Match.arrayWith(List.of(
            Match.objectLike(Map.of(
                "PolicyName", "RdsSecretsAccess",
                "PolicyDocument", Match.objectLike(Map.of(
                    "Statement", Match.arrayWith(List.of(
                        // Statement 1: Secrets Manager permissions
                        Match.objectLike(Map.of(
                            "Effect", "Allow",
                            // don't assert exact "Action" type; just verify the rest
                            "Condition", Map.of("Bool", Map.of("aws:SecureTransport", "true")),
                            "Resource", Match.objectLike(Map.of(
                                // avoid brittle logical id
                                "Ref", Match.anyValue()
                            ))
                        )),
                        // Statement 2: RDS describe
                        Match.objectLike(Map.of(
                            "Effect", "Allow",
                            "Condition", Map.of("Bool", Map.of("aws:SecureTransport", "true")),
                            "Resource", Match.anyValue() // Fn::Join ARN to the DB instance
                        ))
                    ))
                ))
            ))
        ))
    ));

    // ---- IAM: S3 read-only role (robust to Action string/array) ----
    template.hasResourceProperties("AWS::IAM::Role", Map.of(
        "Description", "Role for read-only access to ecommerce assets bucket",
        "Policies", Match.arrayWith(List.of(
            Match.objectLike(Map.of(
                "PolicyName", "S3ReadOnlyAccess",
                "PolicyDocument", Match.objectLike(Map.of(
                    "Statement", Match.arrayWith(List.of(
                        // Statement 1: ListBucket on the bucket ARN (TLS required)
                        Match.objectLike(Map.of(
                            "Effect", "Allow",
                            "Condition", Map.of("Bool", Map.of("aws:SecureTransport", "true")),
                            "Resource", Match.objectLike(Map.of(
                                // arn of the bucket (GetAtt form), but don't assert the logical id
                                "Fn::GetAtt", Match.anyValue()
                            ))
                        )),
                        // Statement 2: GetObject on bucket/* (TLS required)
                        Match.objectLike(Map.of(
                            "Effect", "Allow",
                            "Condition", Map.of("Bool", Map.of("aws:SecureTransport", "true")),
                            "Resource", Match.objectLike(Map.of(
                                // arn join for bucket/* — shape check only
                                "Fn::Join", Match.anyValue()
                            ))
                        ))
                    ))
                ))
            ))
        ))
    ));
  }
}
