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

import java.util.Map;

/**
 * Unit tests for RdsStack.
 */
public class RdsStackTest {

    private App app;
    private StackProps props;
    private Vpc vpc;
    private SecurityGroup dbSecurityGroup;

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
        dbSecurityGroup = sgStack.getDbSecurityGroup();
    }

    @Test
    public void testRdsInstanceCreation() {
        RdsStack stack = new RdsStack(app, "RdsStackTest", props, vpc, dbSecurityGroup);
        Template template = Template.fromStack(stack);

        // Verify RDS instance is created
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
                "Engine", "mysql",
                "AllocatedStorage", "20"
        ));
        
        assertThat(stack.getDatabase()).isNotNull();
    }

    @Test
    public void testRdsEncryption() {
        RdsStack stack = new RdsStack(app, "RdsStackTest", props, vpc, dbSecurityGroup);
        Template template = Template.fromStack(stack);

        // Verify RDS encryption is enabled
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
                "StorageEncrypted", true
        ));
        
        // Verify KMS key for RDS encryption
        template.hasResourceProperties("AWS::KMS::Key", Map.of(
                "Description", "KMS key for RDS encryption"
        ));
    }

    @Test
    public void testRdsSubnetGroup() {
        RdsStack stack = new RdsStack(app, "RdsStackTest", props, vpc, dbSecurityGroup);
        Template template = Template.fromStack(stack);

        // Verify subnet group for private subnets
        template.hasResourceProperties("AWS::RDS::DBSubnetGroup", Map.of(
                "DBSubnetGroupDescription", "Subnet group for RDS database"
        ));
    }

    @Test
    public void testRdsBackupConfiguration() {
        RdsStack stack = new RdsStack(app, "RdsStackTest", props, vpc, dbSecurityGroup);
        Template template = Template.fromStack(stack);

        // Verify backup retention is configured
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
                "BackupRetentionPeriod", 7
        ));
    }

    @Test
    public void testRdsDeletionProtection() {
        RdsStack stack = new RdsStack(app, "RdsStackTest", props, vpc, dbSecurityGroup);
        Template template = Template.fromStack(stack);

        // Verify deletion protection is disabled for testing
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
                "DeletionProtection", false
        ));
    }

    @Test
    public void testRdsMySQLVersion() {
        RdsStack stack = new RdsStack(app, "RdsStackTest", props, vpc, dbSecurityGroup);
        Template template = Template.fromStack(stack);

        // Verify MySQL version is 5.7 (a widely supported major version)
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
                "EngineVersion", "5.7"
        ));
    }
}