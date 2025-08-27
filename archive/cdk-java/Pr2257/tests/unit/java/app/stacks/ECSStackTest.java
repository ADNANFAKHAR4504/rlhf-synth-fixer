package app.stacks;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import software.amazon.awscdk.App;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.services.ec2.ISecurityGroup;
import software.amazon.awscdk.services.ec2.IVpc;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ecs.ICluster;
import software.amazon.awscdk.services.ecs.IFargateService;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.logs.ILogGroup;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.secretsmanager.ISecret;
import software.amazon.awscdk.services.secretsmanager.Secret;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

/**
 * Unit tests for ECSStack
 */
public class ECSStackTest {

    private App app;
    private Stack stack;
    private IVpc vpc;
    private ISecurityGroup ecsSecurityGroup;
    private Role ecsTaskRole;
    private Role ecsExecutionRole;
    private ISecret databaseSecret;
    private ILogGroup logGroup;

    @BeforeEach
    public void setUp() {
        app = new App();
        stack = new Stack(app, "TestStack");
        
        // Create a mock VPC for testing
        vpc = Vpc.Builder.create(stack, "TestVPC")
                .maxAzs(1)
                .build();
        
        // Create a mock security group for testing
        ecsSecurityGroup = SecurityGroup.Builder.create(stack, "TestECSSecurityGroup")
                .vpc(vpc)
                .description("Test ECS Security Group")
                .build();
        
        // Create mock roles for testing
        ecsTaskRole = Role.Builder.create(stack, "TestECSTaskRole")
                .assumedBy(new ServicePrincipal("ecs-tasks.amazonaws.com"))
                .build();
        
        ecsExecutionRole = Role.Builder.create(stack, "TestECSExecutionRole")
                .assumedBy(new ServicePrincipal("ecs-tasks.amazonaws.com"))
                .build();
        
        // Create mock secret for testing
        databaseSecret = Secret.Builder.create(stack, "TestDatabaseSecret")
                .description("Test Database Secret")
                .build();
        
        // Create mock log group for testing
        logGroup = LogGroup.Builder.create(stack, "TestLogGroup")
                .logGroupName("/test/logs")
                .build();
    }

    @Test
    public void testECSStackCreation() {
        // Create ECSStackProps
        ECSStack.ECSStackProps props = ECSStack.ECSStackProps.builder()
                .vpc(vpc)
                .ecsSecurityGroup(ecsSecurityGroup)
                .ecsTaskRole(ecsTaskRole)
                .ecsExecutionRole(ecsExecutionRole)
                .databaseSecret(databaseSecret)
                .logGroup(logGroup)
                .build();

        // Create ECSStack
        ECSStack ecsStack = new ECSStack(stack, "TestECSStack", props);

        // Verify the stack was created
        assertNotNull(ecsStack);
        assertNotNull(ecsStack.getCluster());
        assertNotNull(ecsStack.getService());
    }

    @Test
    public void testECSStackPropsBuilder() {
        // Test the builder pattern
        ECSStack.ECSStackProps props = ECSStack.ECSStackProps.builder()
                .vpc(vpc)
                .ecsSecurityGroup(ecsSecurityGroup)
                .ecsTaskRole(ecsTaskRole)
                .ecsExecutionRole(ecsExecutionRole)
                .databaseSecret(databaseSecret)
                .logGroup(logGroup)
                .build();

        assertNotNull(props);
        assertEquals(vpc, props.getVpc());
        assertEquals(ecsSecurityGroup, props.getEcsSecurityGroup());
        assertEquals(ecsTaskRole, props.getEcsTaskRole());
        assertEquals(ecsExecutionRole, props.getEcsExecutionRole());
        assertEquals(databaseSecret, props.getDatabaseSecret());
        assertEquals(logGroup, props.getLogGroup());
    }

    @Test
    public void testECSStackProperties() {
        ECSStack.ECSStackProps props = ECSStack.ECSStackProps.builder()
                .vpc(vpc)
                .ecsSecurityGroup(ecsSecurityGroup)
                .ecsTaskRole(ecsTaskRole)
                .ecsExecutionRole(ecsExecutionRole)
                .databaseSecret(databaseSecret)
                .logGroup(logGroup)
                .build();

        ECSStack ecsStack = new ECSStack(stack, "TestECSStack", props);

        ICluster cluster = ecsStack.getCluster();
        IFargateService service = ecsStack.getService();

        assertNotNull(cluster);
        assertNotNull(service);
        
        // Verify that the cluster and service are different objects
        assertNotEquals(cluster, service);
    }

    @Test
    public void testECSStackWithEnvironmentSuffix() {
        // Set environment variable
        System.setProperty("ENVIRONMENT_SUFFIX", "test");
        
        ECSStack.ECSStackProps props = ECSStack.ECSStackProps.builder()
                .vpc(vpc)
                .ecsSecurityGroup(ecsSecurityGroup)
                .ecsTaskRole(ecsTaskRole)
                .ecsExecutionRole(ecsExecutionRole)
                .databaseSecret(databaseSecret)
                .logGroup(logGroup)
                .build();

        ECSStack ecsStack = new ECSStack(stack, "TestECSStack", props);

        assertNotNull(ecsStack);
        assertNotNull(ecsStack.getCluster());
        assertNotNull(ecsStack.getService());
        
        // Clean up
        System.clearProperty("ENVIRONMENT_SUFFIX");
    }

    @Test
    public void testECSStackPropsBuilderWithNullValues() {
        // Test builder with null values (should handle gracefully)
        ECSStack.ECSStackProps props = ECSStack.ECSStackProps.builder()
                .vpc(null)
                .ecsSecurityGroup(null)
                .ecsTaskRole(null)
                .ecsExecutionRole(null)
                .databaseSecret(null)
                .logGroup(null)
                .build();

        assertNotNull(props);
        // The actual validation would happen during stack creation
    }

    @Test
    public void testECSStackWithDifferentIds() {
        ECSStack.ECSStackProps props = ECSStack.ECSStackProps.builder()
                .vpc(vpc)
                .ecsSecurityGroup(ecsSecurityGroup)
                .ecsTaskRole(ecsTaskRole)
                .ecsExecutionRole(ecsExecutionRole)
                .databaseSecret(databaseSecret)
                .logGroup(logGroup)
                .build();

        ECSStack ecsStack1 = new ECSStack(stack, "TestECSStack1", props);
        ECSStack ecsStack2 = new ECSStack(stack, "TestECSStack2", props);

        assertNotNull(ecsStack1);
        assertNotNull(ecsStack2);
        assertNotEquals(ecsStack1, ecsStack2);
    }
}
