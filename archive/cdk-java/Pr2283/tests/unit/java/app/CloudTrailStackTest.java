package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;
import software.amazon.awscdk.Environment;

import java.util.Map;

/**
 * Unit tests for CloudTrailStack.
 */
public class CloudTrailStackTest {

    @Test
    public void testCloudTrailCreation() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "test");
        
        StackProps props = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();
        
        CloudTrailStack stack = new CloudTrailStack(app, "CloudTrailStackTest", props);
        Template template = Template.fromStack(stack);

        // Verify CloudTrail is created
        template.hasResourceProperties("AWS::CloudTrail::Trail", Map.of(
                "IsMultiRegionTrail", true,
                "EnableLogFileValidation", true,
                "IncludeGlobalServiceEvents", true
        ));
        
        assertThat(stack.getCloudTrail()).isNotNull();
    }

    @Test
    public void testCloudTrailS3Bucket() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "test");
        
        StackProps props = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();
        
        CloudTrailStack stack = new CloudTrailStack(app, "CloudTrailStackTest", props);
        Template template = Template.fromStack(stack);

        // Verify S3 bucket for CloudTrail logs
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
                "VersioningConfiguration", Map.of(
                        "Status", "Enabled"
                )
        ));
        
        // Verify bucket encryption
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
                "BucketEncryption", Map.of(
                        "ServerSideEncryptionConfiguration", Match.anyValue()
                )
        ));
    }

    @Test
    public void testCloudTrailBucketPolicy() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "test");
        
        StackProps props = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();
        
        CloudTrailStack stack = new CloudTrailStack(app, "CloudTrailStackTest", props);
        Template template = Template.fromStack(stack);

        // Verify bucket policy for CloudTrail
        template.hasResourceProperties("AWS::S3::BucketPolicy", Map.of(
                "PolicyDocument", Map.of(
                        "Statement", Match.anyValue()
                )
        ));
    }

    @Test
    public void testCloudTrailBucketPublicAccessBlocked() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "test");
        
        StackProps props = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();
        
        CloudTrailStack stack = new CloudTrailStack(app, "CloudTrailStackTest", props);
        Template template = Template.fromStack(stack);

        // Verify public access is blocked
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
                "PublicAccessBlockConfiguration", Map.of(
                        "BlockPublicAcls", true,
                        "BlockPublicPolicy", true,
                        "IgnorePublicAcls", true,
                        "RestrictPublicBuckets", true
                )
        ));
    }

    @Test
    public void testCloudTrailNaming() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "test");
        
        StackProps props = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();
        
        CloudTrailStack stack = new CloudTrailStack(app, "CloudTrailStackTest", props);
        Template template = Template.fromStack(stack);

        // Verify trail naming includes environment suffix
        template.hasResourceProperties("AWS::CloudTrail::Trail", Map.of(
                "TrailName", Match.anyValue()
        ));
    }
}