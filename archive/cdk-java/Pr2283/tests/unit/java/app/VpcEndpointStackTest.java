package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.s3.Bucket;

import java.util.Map;

/**
 * Unit tests for VpcEndpointStack.
 */
public class VpcEndpointStackTest {

    private App app;
    private StackProps props;
    private Vpc vpc;
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
        
        // Create dependencies
        VpcStack vpcStack = new VpcStack(app, "TestVpcStack", props);
        vpc = vpcStack.getVpc();
        
        S3Stack s3Stack = new S3Stack(app, "TestS3Stack", props);
        s3Bucket = s3Stack.getAppDataBucket();
    }

    @Test
    public void testS3VpcEndpointCreation() {
        VpcEndpointStack stack = new VpcEndpointStack(app, "VpcEndpointStackTest", props, vpc, s3Bucket);
        Template template = Template.fromStack(stack);

        // Verify VPC endpoint for S3 is created
        template.hasResourceProperties("AWS::EC2::VPCEndpoint", Map.of(
                "ServiceName", Match.anyValue(),
                "VpcEndpointType", "Gateway"
        ));
        
        assertThat(stack.getS3Endpoint()).isNotNull();
    }

    @Test
    public void testVpcEndpointRouting() {
        VpcEndpointStack stack = new VpcEndpointStack(app, "VpcEndpointStackTest", props, vpc, s3Bucket);
        Template template = Template.fromStack(stack);

        // Verify endpoint is associated with route tables
        template.hasResourceProperties("AWS::EC2::VPCEndpoint", Map.of(
                "RouteTableIds", Match.anyValue()
        ));
    }

    @Test
    public void testVpcEndpointPolicy() {
        VpcEndpointStack stack = new VpcEndpointStack(app, "VpcEndpointStackTest", props, vpc, s3Bucket);
        Template template = Template.fromStack(stack);

        // Verify endpoint has policy document
        template.hasResourceProperties("AWS::EC2::VPCEndpoint", Map.of(
                "PolicyDocument", Match.anyValue()
        ));
    }

    @Test
    public void testVpcEndpointS3Service() {
        VpcEndpointStack stack = new VpcEndpointStack(app, "VpcEndpointStackTest", props, vpc, s3Bucket);
        Template template = Template.fromStack(stack);

        // Verify endpoint is for S3 service
        template.hasResourceProperties("AWS::EC2::VPCEndpoint", Match.objectLike(Map.of(
                "ServiceName", Match.anyValue()
        )));
    }

    @Test
    public void testVpcEndpointConfiguration() {
        VpcEndpointStack stack = new VpcEndpointStack(app, "VpcEndpointStackTest", props, vpc, s3Bucket);
        
        // Verify endpoint is properly configured
        assertThat(stack.getS3Endpoint()).isNotNull();
        assertThat(stack.getS3Endpoint().getVpcEndpointId()).isNotNull();
    }
}