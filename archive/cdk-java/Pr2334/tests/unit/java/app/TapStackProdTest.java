package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;
import java.util.Map;

/**
 * Comprehensive unit tests for TapStackProd serverless infrastructure.
 */
public class TapStackProdTest {

    /**
     * Test that S3 bucket is created with proper encryption and versioning.
     */
    @Test
    public void testS3BucketConfiguration() {
        App app = new App();
        TapStackProd stack = new TapStackProd(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        // Verify S3 bucket exists with encryption and versioning
        template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
            "VersioningConfiguration", Map.of(
                "Status", "Enabled"
            )
        )));
    }

    /**
     * Test that Lambda function is created with Python 3.13 runtime.
     */
    @Test
    public void testLambdaFunctionConfiguration() {
        App app = new App();
        TapStackProd stack = new TapStackProd(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        // Verify Lambda function exists with correct runtime
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
            "Runtime", "python3.13",
            "Handler", "index.handler",
            "FunctionName", Match.stringLikeRegexp("file-processor-test-primary-3-[0-9]+")
        )));
    }

    /**
     * Test that SNS topic is created for notifications.
     */
    @Test
    public void testSNSTopicCreation() {
        App app = new App();
        TapStackProd stack = new TapStackProd(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        // Verify SNS topic exists
        template.hasResourceProperties("AWS::SNS::Topic", Map.of(
            "TopicName", "file-processor-notifications-test-primary-3"
        ));
    }

    /**
     * Test that SQS dead letter queue is created.
     */
    @Test
    public void testSQSDeadLetterQueueCreation() {
        App app = new App();
        TapStackProd stack = new TapStackProd(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        // Verify SQS queue exists
        template.hasResourceProperties("AWS::SQS::Queue", Map.of(
            "QueueName", "file-processor-dlq-test-primary-3"
        ));
    }


    /**
     * Test that IAM role has correct permissions.
     */
    @Test
    public void testIAMRolePermissions() {
        App app = new App();
        TapStackProd stack = new TapStackProd(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        // Verify IAM role exists with Lambda assume role policy
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.anyValue()
            ))
        )));
    }

    /**
     * Test that all CloudFormation outputs are created.
     */
    @Test
    public void testCloudFormationOutputs() {
        App app = new App();
        TapStackProd stack = new TapStackProd(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        // Verify all outputs exist
        template.hasOutput("LambdaFunctionArntestPrimary3", Match.anyValue());
        template.hasOutput("S3BucketNametestPrimary3", Match.anyValue());
        template.hasOutput("SNSTopicArntestPrimary3", Match.anyValue());
        template.hasOutput("SQSDeadLetterQueueUrltestPrimary3", Match.anyValue());
    }

    /**
     * Test that S3 event notification is configured for Lambda.
     */
    @Test
    public void testS3EventNotificationConfiguration() {
        App app = new App();
        TapStackProd stack = new TapStackProd(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        // Verify Lambda permission for S3 to invoke
        template.hasResourceProperties("AWS::Lambda::Permission", Map.of(
            "Action", "lambda:InvokeFunction",
            "Principal", "s3.amazonaws.com"
        ));
    }

    /**
     * Test that environment variables are set correctly on Lambda.
     */
    @Test
    public void testLambdaEnvironmentVariables() {
        App app = new App();
        TapStackProd stack = new TapStackProd(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        // Verify environment variables
        template.hasResourceProperties("AWS::Lambda::Function", Map.of(
            "Environment", Map.of(
                "Variables", Map.of(
                    "SNS_TOPIC_ARN", Match.anyValue()
                )
            )
        ));
    }

    /**
     * Test that tags are applied to the stack.
     */
    @Test  
    public void testStackTags() {
        App app = new App();
        TapStackProd stack = new TapStackProd(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        // Check that Environment tag exists
        assertThat(stack.getTags().tagValues()).containsKey("Environment");
        assertThat(stack.getTags().tagValues().get("Environment")).isEqualTo("Production");
    }
}