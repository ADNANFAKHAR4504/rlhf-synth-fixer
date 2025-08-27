package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;
import java.util.Map;
import java.util.Arrays;

/**
 * Unit tests for the Main CDK application.
 * 
 * These tests verify the basic structure and configuration of the TapStack
 * without requiring actual AWS resources to be created.
 */
public class MainTest {

    /**
     * Test that the TapStack can be instantiated successfully with default properties.
     */
    @Test
    public void testStackCreation() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        // Verify stack was created
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
    }

    /**
     * Test that the TapStack uses 'dev' as default environment suffix when none is provided.
     */
    @Test
    public void testDefaultEnvironmentSuffix() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());

        // Verify default environment suffix
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }

    /**
     * Test that the TapStack synthesizes without errors.
     */
    @Test
    public void testStackSynthesis() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        // Create template from the stack
        Template template = Template.fromStack(stack);

        // Verify template can be created (basic synthesis test)
        assertThat(template).isNotNull();
    }

    /**
     * Test that the TapStack respects environment suffix from CDK context.
     */
    @Test
    public void testEnvironmentSuffixFromContext() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "staging");
        
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());

        // Verify environment suffix from context is used
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("staging");
    }

    /**
     * Test that S3 bucket is created with correct configuration.
     */
    @Test
    public void testS3BucketCreation() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify S3 bucket exists with versioning enabled
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
            "VersioningConfiguration", Map.of(
                "Status", "Enabled"
            )
        ));
    }

    /**
     * Test that RDS database is created with correct configuration.
     */
    @Test
    public void testRDSCreation() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify RDS instance exists with correct settings
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
            "Engine", "mysql",
            "DBInstanceClass", "db.t3.micro",
            "StorageType", "gp2",
            "AllocatedStorage", "20",
            "BackupRetentionPeriod", 7
        ));
    }

    /**
     * Test that Lambda function is created with correct runtime.
     */
    @Test
    public void testLambdaCreation() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Lambda function exists with Python runtime
        template.hasResourceProperties("AWS::Lambda::Function", Map.of(
            "Runtime", "python3.11",
            "Handler", "lambda_function.lambda_handler",
            "Timeout", 300
        ));
    }

    /**
     * Test that EventBridge rule is created for scheduled tasks.
     */
    @Test
    public void testEventBridgeRuleCreation() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify EventBridge rule exists with correct schedule
        template.hasResourceProperties("AWS::Events::Rule", Map.of(
            "ScheduleExpression", "rate(1 hour)",
            "Description", "Hourly background processing for startup application"
        ));
    }

    /**
     * Test that VPC is created with correct configuration.
     */
    @Test
    public void testVPCCreation() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify VPC exists
        template.resourceCountIs("AWS::EC2::VPC", 1);
        
        // Verify subnets are created (both public and private)
        template.hasResource("AWS::EC2::Subnet", Match.anyValue());
    }

    /**
     * Test that IAM role is created for Lambda function.
     */
    @Test
    public void testIAMRoleCreation() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify IAM role exists for Lambda
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(Arrays.asList(
                    Map.of(
                        "Action", "sts:AssumeRole",
                        "Effect", "Allow",
                        "Principal", Map.of("Service", "lambda.amazonaws.com")
                    )
                ))
            ))
        ));
    }

    /**
     * Test that stack outputs are created.
     */
    @Test
    public void testStackOutputs() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify outputs exist
        template.hasOutput("S3BucketNametest", Match.anyValue());
        template.hasOutput("DatabaseEndpointtest", Match.anyValue());
        template.hasOutput("LambdaFunctionNametest", Match.anyValue());
        template.hasOutput("ScheduleNametest", Match.anyValue());
    }

    /**
     * Test TapStackProps builder functionality.
     */
    @Test
    public void testTapStackPropsBuilder() {
        TapStackProps props = TapStackProps.builder()
            .environmentSuffix("production")
            .build();
        
        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("production");
        assertThat(props.getStackProps()).isNotNull();
    }
}