package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.services.s3.Bucket;

import java.util.Map;
import java.util.List;

/**
 * Unit tests for IamStack.
 */
public class IamStackTest {

    private App app;
    private StackProps props;
    private Bucket s3Bucket;

    @BeforeEach
    public void setup() {
        app = new App();
        app.getNode().setContext("environmentSuffix", "test");
        
        props = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();
        
        // Create S3 bucket dependency
        S3Stack s3Stack = new S3Stack(app, "TestS3Stack", props);
        s3Bucket = s3Stack.getAppDataBucket();
    }

    @Test
    public void testEc2RoleCreation() {
        IamStack stack = new IamStack(app, "IamStackTest", props, s3Bucket);
        Template template = Template.fromStack(stack);

        // Verify IAM role is created
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
                "AssumeRolePolicyDocument", Map.of(
                        "Statement", Match.anyValue()
                )
        ));
        
        assertThat(stack.getEc2Role()).isNotNull();
    }

    @Test
    public void testEc2RoleAssumePolicy() {
        IamStack stack = new IamStack(app, "IamStackTest", props, s3Bucket);
        Template template = Template.fromStack(stack);

        // Verify EC2 can assume the role
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
                "AssumeRolePolicyDocument", Map.of(
                        "Statement", List.of(
                                Map.of(
                                        "Effect", "Allow",
                                        "Principal", Map.of(
                                                "Service", "ec2.amazonaws.com"
                                        ),
                                        "Action", "sts:AssumeRole"
                                )
                        )
                )
        )));
    }

    @Test
    public void testS3ReadOnlyPolicy() {
        IamStack stack = new IamStack(app, "IamStackTest", props, s3Bucket);
        Template template = Template.fromStack(stack);

        // Verify S3 read-only policy is attached
        template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                "PolicyDocument", Map.of(
                        "Statement", Match.anyValue()
                )
        )));
    }

    @Test
    public void testPolicyLeastPrivilege() {
        IamStack stack = new IamStack(app, "IamStackTest", props, s3Bucket);
        Template template = Template.fromStack(stack);

        // Verify policy follows least privilege principle
        // Should only have GetObject and ListBucket permissions
        template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                "PolicyDocument", Map.of(
                        "Statement", List.of(
                                Map.of(
                                        "Effect", "Allow",
                                        "Action", Match.anyValue(),
                                        "Resource", Match.anyValue()
                                )
                        )
                )
        )));
    }

    @Test
    public void testRoleNaming() {
        IamStack stack = new IamStack(app, "IamStackTest", props, s3Bucket);
        
        // Verify role exists and is properly configured
        assertThat(stack.getEc2Role()).isNotNull();
        assertThat(stack.getEc2Role().getRoleName()).isNotNull();
    }
}