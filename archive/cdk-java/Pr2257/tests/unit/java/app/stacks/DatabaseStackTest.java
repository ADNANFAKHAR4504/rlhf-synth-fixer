package app.stacks;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import software.amazon.awscdk.App;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.services.ec2.ISecurityGroup;
import software.amazon.awscdk.services.ec2.IVpc;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.rds.IDatabaseInstance;
import software.amazon.awscdk.services.secretsmanager.ISecret;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

/**
 * Unit tests for DatabaseStack
 */
public class DatabaseStackTest {

    private App app;
    private Stack stack;
    private IVpc vpc;
    private ISecurityGroup rdsSecurityGroup;

    @BeforeEach
    public void setUp() {
        app = new App();
        stack = new Stack(app, "TestStack");
        
        // Create a mock VPC with isolated subnets for testing
        vpc = Vpc.Builder.create(stack, "TestVPC")
                .maxAzs(1)
                .subnetConfiguration(List.of(
                        SubnetConfiguration.builder()
                                .name("IsolatedSubnet")
                                .subnetType(SubnetType.PRIVATE_ISOLATED)
                                .cidrMask(24)
                                .build()
                ))
                .build();
        
        // Create a mock security group for testing
        rdsSecurityGroup = SecurityGroup.Builder.create(stack, "TestRDSSecurityGroup")
                .vpc(vpc)
                .description("Test RDS Security Group")
                .build();
    }

    @Test
    public void testDatabaseStackCreation() {
        // Create DatabaseStackProps
        DatabaseStack.DatabaseStackProps props = DatabaseStack.DatabaseStackProps.builder()
                .vpc(vpc)
                .rdsSecurityGroup(rdsSecurityGroup)
                .build();

        // Create DatabaseStack
        DatabaseStack databaseStack = new DatabaseStack(stack, "TestDatabaseStack", props);

        // Verify the stack was created
        assertNotNull(databaseStack);
        assertNotNull(databaseStack.getDatabase());
        assertNotNull(databaseStack.getDatabaseSecret());
    }

    @Test
    public void testDatabaseStackPropsBuilder() {
        // Test the builder pattern
        DatabaseStack.DatabaseStackProps props = DatabaseStack.DatabaseStackProps.builder()
                .vpc(vpc)
                .rdsSecurityGroup(rdsSecurityGroup)
                .build();

        assertNotNull(props);
        assertEquals(vpc, props.getVpc());
        assertEquals(rdsSecurityGroup, props.getRdsSecurityGroup());
    }

    @Test
    public void testDatabaseStackProperties() {
        DatabaseStack.DatabaseStackProps props = DatabaseStack.DatabaseStackProps.builder()
                .vpc(vpc)
                .rdsSecurityGroup(rdsSecurityGroup)
                .build();

        DatabaseStack databaseStack = new DatabaseStack(stack, "TestDatabaseStack", props);

        IDatabaseInstance database = databaseStack.getDatabase();
        ISecret databaseSecret = databaseStack.getDatabaseSecret();

        assertNotNull(database);
        assertNotNull(databaseSecret);
        
        // Verify that the database and secret are different objects
        assertNotEquals(database, databaseSecret);
    }

    @Test
    public void testDatabaseStackWithEnvironmentSuffix() {
        // Set environment variable
        System.setProperty("ENVIRONMENT_SUFFIX", "test");
        
        DatabaseStack.DatabaseStackProps props = DatabaseStack.DatabaseStackProps.builder()
                .vpc(vpc)
                .rdsSecurityGroup(rdsSecurityGroup)
                .build();

        DatabaseStack databaseStack = new DatabaseStack(stack, "TestDatabaseStack", props);

        assertNotNull(databaseStack);
        assertNotNull(databaseStack.getDatabase());
        assertNotNull(databaseStack.getDatabaseSecret());
        
        // Clean up
        System.clearProperty("ENVIRONMENT_SUFFIX");
    }

    @Test
    public void testDatabaseStackPropsBuilderWithNullValues() {
        // Test builder with null values (should handle gracefully)
        DatabaseStack.DatabaseStackProps props = DatabaseStack.DatabaseStackProps.builder()
                .vpc(null)
                .rdsSecurityGroup(null)
                .build();

        assertNotNull(props);
        // The actual validation would happen during stack creation
    }
}
