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

import java.util.Map;
import java.util.List;

/**
 * Unit tests for SecurityGroupStack.
 */
public class SecurityGroupStackTest {

    private Vpc vpc;
    private App app;
    private StackProps props;

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
        
        // Create a VPC for testing
        VpcStack vpcStack = new VpcStack(app, "TestVpcStack", props);
        vpc = vpcStack.getVpc();
    }

    @Test
    public void testSecurityGroupsCreated() {
        SecurityGroupStack stack = new SecurityGroupStack(app, "SecurityGroupStackTest", props, vpc);
        Template template = Template.fromStack(stack);

        // Verify security groups are created
        template.resourceCountIs("AWS::EC2::SecurityGroup", 2);
        assertThat(stack.getWebSecurityGroup()).isNotNull();
        assertThat(stack.getDbSecurityGroup()).isNotNull();
    }

    @Test
    public void testWebSecurityGroupRules() {
        SecurityGroupStack stack = new SecurityGroupStack(app, "SecurityGroupStackTest", props, vpc);
        Template template = Template.fromStack(stack);

        // Verify HTTPS ingress rules for specific IP ranges
        template.hasResourceProperties("AWS::EC2::SecurityGroupIngress", Map.of(
                "IpProtocol", "tcp",
                "FromPort", 443,
                "ToPort", 443,
                "CidrIp", "10.0.0.0/16"
        ));

        template.hasResourceProperties("AWS::EC2::SecurityGroupIngress", Map.of(
                "IpProtocol", "tcp",
                "FromPort", 443,
                "ToPort", 443,
                "CidrIp", "192.168.1.0/24"
        ));
    }

    @Test
    public void testDatabaseSecurityGroupRules() {
        SecurityGroupStack stack = new SecurityGroupStack(app, "SecurityGroupStackTest", props, vpc);
        Template template = Template.fromStack(stack);

        // Verify MySQL port access from web security group
        template.hasResourceProperties("AWS::EC2::SecurityGroupIngress", Map.of(
                "IpProtocol", "tcp",
                "FromPort", 3306,
                "ToPort", 3306
        ));
    }

    @Test
    public void testSecurityGroupDescriptions() {
        SecurityGroupStack stack = new SecurityGroupStack(app, "SecurityGroupStackTest", props, vpc);
        Template template = Template.fromStack(stack);

        // Verify security groups have proper descriptions
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
                "GroupDescription", Match.anyValue()
        ));
    }

    @Test
    public void testNoUnrestrictedInboundRules() {
        SecurityGroupStack stack = new SecurityGroupStack(app, "SecurityGroupStackTest", props, vpc);
        Template template = Template.fromStack(stack);

        // Ensure no security group allows unrestricted access (0.0.0.0/0)
        Map<String, Object> cfnTemplate = template.toJSON();
        
        // This is a negative test - we should NOT find any 0.0.0.0/0 rules
        boolean hasUnrestrictedAccess = false;
        if (cfnTemplate.containsKey("Resources")) {
            Map<String, Object> resources = (Map<String, Object>) cfnTemplate.get("Resources");
            for (Map.Entry<String, Object> entry : resources.entrySet()) {
                Map<String, Object> resource = (Map<String, Object>) entry.getValue();
                if ("AWS::EC2::SecurityGroupIngress".equals(resource.get("Type"))) {
                    Map<String, Object> properties = (Map<String, Object>) resource.get("Properties");
                    if ("0.0.0.0/0".equals(properties.get("CidrIp"))) {
                        hasUnrestrictedAccess = true;
                        break;
                    }
                }
            }
        }
        
        assertThat(hasUnrestrictedAccess).isFalse();
    }
}