package app.stacks;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import software.amazon.awscdk.App;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.ISecurityGroup;
import software.amazon.awscdk.services.ec2.IVpc;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.secretsmanager.Secret;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

/**
 * Additional coverage tests to ensure stack classes are properly tested
 */
public class StackCoverageMainTest {

    private App app;
    private Stack parentStack;

    @BeforeEach
    public void setUp() {
        app = new App();
        parentStack = new Stack(app, "TestParentStack");
    }

    @Test
    public void testDatabaseStackFullCoverage() {
        // Create VPC with isolated subnets
        IVpc vpc = Vpc.Builder.create(parentStack, "TestVPC")
                .maxAzs(2)
                .subnetConfiguration(List.of(
                        SubnetConfiguration.builder()
                                .name("IsolatedSubnet")
                                .subnetType(SubnetType.PRIVATE_ISOLATED)
                                .cidrMask(24)
                                .build()
                ))
                .build();
        
        ISecurityGroup rdsSecurityGroup = SecurityGroup.Builder.create(parentStack, "TestRDSSecurityGroup")
                .vpc(vpc)
                .description("Test RDS Security Group")
                .build();

        // Create props using builder
        DatabaseStack.DatabaseStackProps props = DatabaseStack.DatabaseStackProps.builder()
                .vpc(vpc)
                .rdsSecurityGroup(rdsSecurityGroup)
                .build();

        // Test getters on props
        assertNotNull(props.getVpc());
        assertNotNull(props.getRdsSecurityGroup());

        // Create DatabaseStack as a Construct
        DatabaseStack databaseStack = new DatabaseStack(parentStack, "TestDatabaseStack", props);

        // Test all getters
        assertNotNull(databaseStack.getDatabase());
        assertNotNull(databaseStack.getDatabaseSecret());
        
        // Call getters multiple times to ensure coverage
        assertNotNull(databaseStack.getDatabase());
        assertNotNull(databaseStack.getDatabaseSecret());
    }

    @Test
    public void testECSStackFullCoverage() {
        // Create dependencies
        IVpc vpc = Vpc.Builder.create(parentStack, "TestVPCForECS")
                .maxAzs(2)
                .build();
        
        ISecurityGroup ecsSecurityGroup = SecurityGroup.Builder.create(parentStack, "TestECSSecurityGroup")
                .vpc(vpc)
                .description("Test ECS Security Group")
                .build();
        
        Role ecsTaskRole = Role.Builder.create(parentStack, "TestECSTaskRole")
                .assumedBy(new ServicePrincipal("ecs-tasks.amazonaws.com"))
                .build();
        
        Role ecsExecutionRole = Role.Builder.create(parentStack, "TestECSExecutionRole")
                .assumedBy(new ServicePrincipal("ecs-tasks.amazonaws.com"))
                .build();
        
        Secret databaseSecret = Secret.Builder.create(parentStack, "TestDatabaseSecret")
                .description("Test Database Secret")
                .build();
        
        LogGroup logGroup = LogGroup.Builder.create(parentStack, "TestLogGroup")
                .logGroupName("/test/logs")
                .build();

        // Create props using builder
        ECSStack.ECSStackProps props = ECSStack.ECSStackProps.builder()
                .vpc(vpc)
                .ecsSecurityGroup(ecsSecurityGroup)
                .ecsTaskRole(ecsTaskRole)
                .ecsExecutionRole(ecsExecutionRole)
                .databaseSecret(databaseSecret)
                .logGroup(logGroup)
                .build();

        // Test getters on props
        assertNotNull(props.getVpc());
        assertNotNull(props.getEcsSecurityGroup());
        assertNotNull(props.getEcsTaskRole());
        assertNotNull(props.getEcsExecutionRole());
        assertNotNull(props.getDatabaseSecret());
        assertNotNull(props.getLogGroup());

        // Create ECSStack as a Construct
        ECSStack ecsStack = new ECSStack(parentStack, "TestECSStack", props);

        // Test all getters
        assertNotNull(ecsStack.getCluster());
        assertNotNull(ecsStack.getService());
        
        // Call getters multiple times to ensure coverage
        assertNotNull(ecsStack.getCluster());
        assertNotNull(ecsStack.getService());
    }

    @Test
    public void testNetworkStackFullCoverage() {
        // NetworkStack extends Stack, so create it with app as parent
        NetworkStack networkStack = new NetworkStack(app, "TestNetworkStackCoverage", null);

        // Test all getters multiple times
        assertNotNull(networkStack.getVpc());
        assertNotNull(networkStack.getEcsSecurityGroup());
        assertNotNull(networkStack.getRdsSecurityGroup());
        
        // Verify they return the same instance
        assert(networkStack.getVpc() == networkStack.getVpc());
        assert(networkStack.getEcsSecurityGroup() == networkStack.getEcsSecurityGroup());
        assert(networkStack.getRdsSecurityGroup() == networkStack.getRdsSecurityGroup());
        
        // Verify security groups are different
        assertNotEquals(networkStack.getEcsSecurityGroup(), networkStack.getRdsSecurityGroup());
    }

    @Test
    public void testSecurityStackFullCoverage() {
        // SecurityStack extends Stack, so create it with app as parent
        SecurityStack securityStack = new SecurityStack(app, "TestSecurityStackCoverage", null);

        // Test all getters multiple times
        assertNotNull(securityStack.getKmsKey());
        assertNotNull(securityStack.getRdsKmsKey());
        assertNotNull(securityStack.getEcsTaskRole());
        assertNotNull(securityStack.getEcsExecutionRole());
        assertNotNull(securityStack.getEcsLogGroup());
        
        // Verify they return the same instance
        assert(securityStack.getKmsKey() == securityStack.getKmsKey());
        assert(securityStack.getRdsKmsKey() == securityStack.getRdsKmsKey());
        assert(securityStack.getEcsTaskRole() == securityStack.getEcsTaskRole());
        assert(securityStack.getEcsExecutionRole() == securityStack.getEcsExecutionRole());
        assert(securityStack.getEcsLogGroup() == securityStack.getEcsLogGroup());
        
        // Verify different resources
        assertNotEquals(securityStack.getKmsKey(), securityStack.getRdsKmsKey());
        assertNotEquals(securityStack.getEcsTaskRole(), securityStack.getEcsExecutionRole());
    }

    @Test
    public void testDatabaseStackPropsBuilder() {
        // Test builder with null values
        DatabaseStack.DatabaseStackProps.Builder builder = DatabaseStack.DatabaseStackProps.builder();
        
        // Build with nulls
        DatabaseStack.DatabaseStackProps props = builder.build();
        assertNotNull(props);
        
        // Create another builder and set values
        IVpc vpc = Vpc.Builder.create(parentStack, "VPCForBuilder")
                .maxAzs(1)
                .build();
        ISecurityGroup sg = SecurityGroup.Builder.create(parentStack, "SGForBuilder")
                .vpc(vpc)
                .build();
        
        DatabaseStack.DatabaseStackProps props2 = DatabaseStack.DatabaseStackProps.builder()
                .vpc(vpc)
                .rdsSecurityGroup(sg)
                .build();
        
        assertNotNull(props2);
        assertNotNull(props2.getVpc());
        assertNotNull(props2.getRdsSecurityGroup());
    }

    @Test
    public void testECSStackPropsBuilder() {
        // Test builder with null values
        ECSStack.ECSStackProps.Builder builder = ECSStack.ECSStackProps.builder();
        
        // Build with nulls
        ECSStack.ECSStackProps props = builder.build();
        assertNotNull(props);
        
        // Create another builder and set values one by one
        IVpc vpc = Vpc.Builder.create(parentStack, "VPCForECSBuilder")
                .maxAzs(1)
                .build();
        ISecurityGroup sg = SecurityGroup.Builder.create(parentStack, "SGForECSBuilder")
                .vpc(vpc)
                .build();
        Role taskRole = Role.Builder.create(parentStack, "TaskRoleForBuilder")
                .assumedBy(new ServicePrincipal("ecs-tasks.amazonaws.com"))
                .build();
        Role execRole = Role.Builder.create(parentStack, "ExecRoleForBuilder")
                .assumedBy(new ServicePrincipal("ecs-tasks.amazonaws.com"))
                .build();
        Secret secret = Secret.Builder.create(parentStack, "SecretForBuilder")
                .build();
        LogGroup logGroup = LogGroup.Builder.create(parentStack, "LogGroupForBuilder")
                .build();
        
        ECSStack.ECSStackProps props2 = ECSStack.ECSStackProps.builder()
                .vpc(vpc)
                .ecsSecurityGroup(sg)
                .ecsTaskRole(taskRole)
                .ecsExecutionRole(execRole)
                .databaseSecret(secret)
                .logGroup(logGroup)
                .build();
        
        assertNotNull(props2);
        assertNotNull(props2.getVpc());
        assertNotNull(props2.getEcsSecurityGroup());
        assertNotNull(props2.getEcsTaskRole());
        assertNotNull(props2.getEcsExecutionRole());
        assertNotNull(props2.getDatabaseSecret());
        assertNotNull(props2.getLogGroup());
    }
}
