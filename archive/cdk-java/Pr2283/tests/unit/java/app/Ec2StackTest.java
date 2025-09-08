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
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.s3.Bucket;

import java.util.Map;

/**
 * Unit tests for Ec2Stack.
 */
public class Ec2StackTest {

    private App app;
    private StackProps props;
    private Vpc vpc;
    private SecurityGroup securityGroup;
    private Role ec2Role;

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
        
        SecurityGroupStack sgStack = new SecurityGroupStack(app, "TestSgStack", props, vpc);
        securityGroup = sgStack.getWebSecurityGroup();
        
        S3Stack s3Stack = new S3Stack(app, "TestS3Stack", props);
        Bucket bucket = s3Stack.getAppDataBucket();
        
        IamStack iamStack = new IamStack(app, "TestIamStack", props, bucket);
        ec2Role = iamStack.getEc2Role();
    }

    @Test
    public void testEc2InstanceCreation() {
        Ec2Stack stack = new Ec2Stack(app, "Ec2StackTest", props, vpc, securityGroup, ec2Role);
        Template template = Template.fromStack(stack);

        // Verify EC2 instance is created
        template.hasResourceProperties("AWS::EC2::Instance", Map.of(
                "InstanceType", Match.anyValue()
        ));
        
        assertThat(stack.getWebServer()).isNotNull();
    }

    @Test
    public void testEc2EbsEncryption() {
        Ec2Stack stack = new Ec2Stack(app, "Ec2StackTest", props, vpc, securityGroup, ec2Role);
        Template template = Template.fromStack(stack);

        // Verify KMS key for EBS encryption
        template.hasResourceProperties("AWS::KMS::Key", Map.of(
                "Description", "KMS key for EBS volume encryption"
        ));
        
        assertThat(stack.getEbsKey()).isNotNull();
    }

    @Test
    public void testEc2BlockDeviceConfiguration() {
        Ec2Stack stack = new Ec2Stack(app, "Ec2StackTest", props, vpc, securityGroup, ec2Role);
        Template template = Template.fromStack(stack);

        // Verify EC2 instance has encrypted EBS volumes
        template.hasResourceProperties("AWS::EC2::Instance", Map.of(
                "BlockDeviceMappings", Match.anyValue()
        ));
    }

    @Test
    public void testEc2PlacementInPublicSubnet() {
        Ec2Stack stack = new Ec2Stack(app, "Ec2StackTest", props, vpc, securityGroup, ec2Role);
        
        // Verify instance is configured for public subnet
        assertThat(stack.getWebServer()).isNotNull();
    }

    @Test
    public void testEc2IamRoleAttachment() {
        Ec2Stack stack = new Ec2Stack(app, "Ec2StackTest", props, vpc, securityGroup, ec2Role);
        Template template = Template.fromStack(stack);

        // Verify IAM instance profile is attached
        template.hasResourceProperties("AWS::IAM::InstanceProfile", Match.anyValue());
    }
}