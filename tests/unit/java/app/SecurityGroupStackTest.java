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
import java.util.HashMap;

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

        // Get the entire CloudFormation template
        Map<String, Object> cfnTemplate = template.toJSON();
        Map<String, Object> resources = (Map<String, Object>) cfnTemplate.get("Resources");
        
        // Find the web security group
        boolean foundHttpsRule1 = false;
        boolean foundHttpsRule2 = false;
        
        for (Map.Entry<String, Object> entry : resources.entrySet()) {
            Map<String, Object> resource = (Map<String, Object>) entry.getValue();
            if ("AWS::EC2::SecurityGroup".equals(resource.get("Type"))) {
                Map<String, Object> properties = (Map<String, Object>) resource.get("Properties");
                if ("app-sg-web".equals(properties.get("GroupName"))) {
                    List<Map<String, Object>> ingressRules = (List<Map<String, Object>>) properties.get("SecurityGroupIngress");
                    
                    for (Map<String, Object> rule : ingressRules) {
                        if ("tcp".equals(rule.get("IpProtocol")) && 
                            Integer.valueOf(443).equals(rule.get("FromPort")) &&
                            Integer.valueOf(443).equals(rule.get("ToPort"))) {
                                
                            if ("10.0.0.0/16".equals(rule.get("CidrIp"))) {
                                foundHttpsRule1 = true;
                            }
                            
                            if ("192.168.1.0/24".equals(rule.get("CidrIp"))) {
                                foundHttpsRule2 = true;
                            }
                        }
                    }
                }
            }
        }
        
        // Assert we found both HTTPS rules
        assertThat(foundHttpsRule1).as("HTTPS rule for CIDR 10.0.0.0/16 was not found").isTrue();
        assertThat(foundHttpsRule2).as("HTTPS rule for CIDR 192.168.1.0/24 was not found").isTrue();
    }

    @Test
    public void testDatabaseSecurityGroupRules() {
        SecurityGroupStack stack = new SecurityGroupStack(app, "SecurityGroupStackTest", props, vpc);
        Template template = Template.fromStack(stack);

        // Get the entire CloudFormation template
        Map<String, Object> cfnTemplate = template.toJSON();
        Map<String, Object> resources = (Map<String, Object>) cfnTemplate.get("Resources");
        
        // Find the database security group
        boolean foundMySqlRule = false;
        
        for (Map.Entry<String, Object> entry : resources.entrySet()) {
            Map<String, Object> resource = (Map<String, Object>) entry.getValue();
            if ("AWS::EC2::SecurityGroup".equals(resource.get("Type"))) {
                Map<String, Object> properties = (Map<String, Object>) resource.get("Properties");
                if ("app-sg-database".equals(properties.get("GroupName"))) {
                    List<Map<String, Object>> ingressRules = (List<Map<String, Object>>) properties.get("SecurityGroupIngress");
                    
                    for (Map<String, Object> rule : ingressRules) {
                        if ("tcp".equals(rule.get("IpProtocol")) && 
                            Integer.valueOf(3306).equals(rule.get("FromPort")) &&
                            Integer.valueOf(3306).equals(rule.get("ToPort"))) {
                            
                            foundMySqlRule = true;
                            break;
                        }
                    }
                }
            }
        }
        
        // Assert we found the MySQL rule
        assertThat(foundMySqlRule).as("MySQL rule on port 3306 was not found").isTrue();
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
                if ("AWS::EC2::SecurityGroup".equals(resource.get("Type"))) {
                    Map<String, Object> properties = (Map<String, Object>) resource.get("Properties");
                    if (properties.containsKey("SecurityGroupIngress")) {
                        List<Map<String, Object>> ingressRules = (List<Map<String, Object>>) properties.get("SecurityGroupIngress");
                        for (Map<String, Object> rule : ingressRules) {
                            if ("0.0.0.0/0".equals(rule.get("CidrIp"))) {
                                hasUnrestrictedAccess = true;
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        assertThat(hasUnrestrictedAccess).isFalse();
    }
}