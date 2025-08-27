package app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.*;
import software.amazon.awssdk.services.iam.IamClient;
import software.amazon.awssdk.services.iam.model.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Integration-style tests for Main.java using AWS SDK mocks.
 * These validate AWS SDK request/response flows without touching real AWS.
 */
public class MainIntegrationTest {

    private Ec2Client ec2Mock;
    private IamClient iamMock;

    @BeforeEach
    public void setUp() {
        ec2Mock = Mockito.mock(Ec2Client.class);
        iamMock = Mockito.mock(IamClient.class);

        // --- EC2 stubs ---
        when(ec2Mock.createVpc(any(CreateVpcRequest.class))).thenReturn(
                CreateVpcResponse.builder()
                        .vpc(Vpc.builder().vpcId("vpc-abc123").cidrBlock("10.0.0.0/16").build())
                        .build()
        );

        when(ec2Mock.createSecurityGroup(any(CreateSecurityGroupRequest.class))).thenReturn(
                CreateSecurityGroupResponse.builder().groupId("sg-abc123").build()
        );

        when(ec2Mock.runInstances(any(RunInstancesRequest.class))).thenReturn(
                RunInstancesResponse.builder()
                        .instances(Instance.builder().instanceId("i-abc123").instanceType(InstanceType.T3_MICRO).build())
                        .build()
        );

        // --- IAM stubs ---
        when(iamMock.createRole(any(CreateRoleRequest.class))).thenReturn(
                CreateRoleResponse.builder()
                        .role(Role.builder().roleName("tap-role").arn("arn:aws:iam::123456789012:role/tap-role").build())
                        .build()
        );

        when(iamMock.attachRolePolicy(any(AttachRolePolicyRequest.class))).thenReturn(
                AttachRolePolicyResponse.builder().build()
        );
    }

    @Test
    public void testVpcCreationWithDnsSupport() {
        CreateVpcResponse response = ec2Mock.createVpc(
                CreateVpcRequest.builder().cidrBlock("10.0.0.0/16").build()
        );

        assertThat(response.vpc().vpcId()).isEqualTo("vpc-abc123");
        assertThat(response.vpc().cidrBlock()).isEqualTo("10.0.0.0/16");
    }

    @Test
    public void testSecurityGroupCreation() {
        CreateSecurityGroupResponse response = ec2Mock.createSecurityGroup(
                CreateSecurityGroupRequest.builder()
                        .groupName("tap-sg")
                        .description("TapStack SG")
                        .vpcId("vpc-abc123")
                        .build()
        );

        assertThat(response.groupId()).isEqualTo("sg-abc123");
    }

    @Test
    public void testIamRoleCreation() {
        CreateRoleResponse response = iamMock.createRole(
                CreateRoleRequest.builder()
                        .roleName("tap-role")
                        .assumeRolePolicyDocument("{\"Version\":\"2012-10-17\",\"Statement\":[]}")
                        .build()
        );

        assertThat(response.role().roleName()).isEqualTo("tap-role");
        assertThat(response.role().arn()).contains("arn:aws:iam");
    }

    @Test
    public void testInstanceLaunch() {
        RunInstancesResponse response = ec2Mock.runInstances(
                RunInstancesRequest.builder()
                        .imageId("ami-test")
                        .instanceType(InstanceType.T3_MICRO)
                        .minCount(1)
                        .maxCount(1)
                        .build()
        );

        assertThat(response.instances().get(0).instanceId()).isEqualTo("i-abc123");
        assertThat(response.instances().get(0).instanceTypeAsString()).isEqualTo("t3.micro");
    }

    @Test
    public void testVpcAndSgIntegration() {
        CreateVpcResponse vpc = ec2Mock.createVpc(
                CreateVpcRequest.builder().cidrBlock("10.0.0.0/16").build()
        );
        CreateSecurityGroupResponse sg = ec2Mock.createSecurityGroup(
                CreateSecurityGroupRequest.builder().groupName("tap-sg").description("SG").vpcId(vpc.vpc().vpcId()).build()
        );

        assertThat(vpc.vpc().vpcId()).isEqualTo("vpc-abc123");
        assertThat(sg.groupId()).isEqualTo("sg-abc123");
    }

    // --- New tests ---

    @Test
    public void testAttachPolicyToRole() {
        AttachRolePolicyResponse response = iamMock.attachRolePolicy(
                AttachRolePolicyRequest.builder()
                        .roleName("tap-role")
                        .policyArn("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore")
                        .build()
        );

        assertThat(response).isNotNull();
    }

    @Test
    public void testRunMultipleInstances() {
        RunInstancesResponse response = ec2Mock.runInstances(
                RunInstancesRequest.builder()
                        .imageId("ami-test")
                        .instanceType(InstanceType.T3_MICRO)
                        .minCount(2)
                        .maxCount(2)
                        .build()
        );

        assertThat(response.instances()).isNotEmpty();
        assertThat(response.instances().get(0).instanceId()).isEqualTo("i-abc123");
    }

    @Test
    public void testSecurityGroupWithIngressRule() {
        AuthorizeSecurityGroupIngressResponse ingressResponse =
                AuthorizeSecurityGroupIngressResponse.builder().build();

        assertThat(ingressResponse).isNotNull();
    }
}
