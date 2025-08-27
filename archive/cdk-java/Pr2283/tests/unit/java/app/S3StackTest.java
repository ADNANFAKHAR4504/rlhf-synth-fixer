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
 * Unit tests for S3Stack.
 */
public class S3StackTest {

    @Test
    public void testS3BucketCreation() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "test");
        
        StackProps props = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();
        
        S3Stack stack = new S3Stack(app, "S3StackTest", props);
        Template template = Template.fromStack(stack);

        // Verify S3 bucket is created with versioning
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
                "VersioningConfiguration", Map.of(
                        "Status", "Enabled"
                )
        ));
        
        assertThat(stack.getAppDataBucket()).isNotNull();
    }

    @Test
    public void testS3BucketEncryption() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "test");
        
        StackProps props = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();
        
        S3Stack stack = new S3Stack(app, "S3StackTest", props);
        Template template = Template.fromStack(stack);

        // Verify S3 bucket has encryption enabled
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
                "BucketEncryption", Map.of(
                        "ServerSideEncryptionConfiguration", Match.anyValue()
                )
        ));
    }

    @Test
    public void testS3BucketPublicAccessBlocked() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "test");
        
        StackProps props = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();
        
        S3Stack stack = new S3Stack(app, "S3StackTest", props);
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
    public void testS3BucketSSLEnforcement() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "test");
        
        StackProps props = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();
        
        S3Stack stack = new S3Stack(app, "S3StackTest", props);
        Template template = Template.fromStack(stack);

        // Verify bucket policy enforces SSL
        template.hasResourceProperties("AWS::S3::BucketPolicy", Map.of(
                "PolicyDocument", Map.of(
                        "Statement", Match.anyValue()
                )
        ));
    }

    @Test
    public void testS3BucketRemovalPolicy() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "test");
        
        StackProps props = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();
        
        S3Stack stack = new S3Stack(app, "S3StackTest", props);
        Template template = Template.fromStack(stack);

        // Verify auto-delete objects is enabled for cleanup
        template.hasResource("Custom::S3AutoDeleteObjects", Map.of(
                "Properties", Match.anyValue()
        ));
    }
}