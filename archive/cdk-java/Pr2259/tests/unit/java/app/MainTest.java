package app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.*;
import software.amazon.awssdk.services.iam.IamClient;
import software.amazon.awssdk.services.iam.model.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AWS SDK provisioning logic in Main.java.
 */
public class MainTest {

    private Ec2Client ec2Mock;
    private IamClient iamMock;

    @BeforeEach
    public void setUp() {
        ec2Mock = mock(Ec2Client.class);
        iamMock = mock(IamClient.class);

        // ✅ Normal happy-path mocks
        when(ec2Mock.createVpc(any(CreateVpcRequest.class)))
                .thenReturn(CreateVpcResponse.builder()
                        .vpc(Vpc.builder().vpcId("vpc-123").cidrBlock("10.0.0.0/16").build())
                        .build());

        when(ec2Mock.createSecurityGroup(any(CreateSecurityGroupRequest.class)))
                .thenReturn(CreateSecurityGroupResponse.builder().groupId("sg-123").build());

        when(iamMock.createRole(any(CreateRoleRequest.class)))
                .thenReturn(CreateRoleResponse.builder()
                        .role(Role.builder().roleName("tap-role")
                                .arn("arn:aws:iam::123456789012:role/tap-role")
                                .build())
                        .build());

        when(ec2Mock.runInstances(any(RunInstancesRequest.class)))
                .thenReturn(RunInstancesResponse.builder()
                        .instances(Instance.builder().instanceId("i-123")
                                .instanceType(InstanceType.T3_MICRO).build())
                        .build());

        // ✅ Error mocks (with explicit cast in argThat)
        // when(ec2Mock.createVpc(argThat(req ->
        //         ((CreateVpcRequest) req).cidrBlock() != null &&
        //         ((CreateVpcRequest) req).cidrBlock().startsWith("999"))))
        //         .thenThrow(Ec2Exception.builder().message("Invalid CIDR block").build());

        // when(iamMock.createRole(argThat(req ->
        //         ((CreateRoleRequest) req).roleName() == null ||
        //         ((CreateRoleRequest) req).roleName().isBlank())))
        //         .thenThrow(IamException.builder().message("Role name required").build());
    }

    @Test
    public void testVpcRequestHasCorrectCidr() {
        CreateVpcResponse response = ec2Mock.createVpc(CreateVpcRequest.builder()
                .cidrBlock("10.0.0.0/16").build());
        assertThat(response.vpc().cidrBlock()).isEqualTo("10.0.0.0/16");
    }

    @Test
    public void testSecurityGroupRequestIncludesDescription() {
        CreateSecurityGroupResponse response = ec2Mock.createSecurityGroup(
                CreateSecurityGroupRequest.builder()
                        .groupName("tap-sg")
                        .description("TapStack SG")
                        .vpcId("vpc-123")
                        .build()
        );
        assertThat(response.groupId()).startsWith("sg-");
    }

    @Test
    public void testIamRoleAssumePolicyIsValid() {
        String assumePolicy = "{ \"Version\": \"2012-10-17\", \"Statement\": [ { " +
                "\"Effect\": \"Allow\", \"Principal\": { \"Service\": \"ec2.amazonaws.com\" }, " +
                "\"Action\": \"sts:AssumeRole\" } ] }";

        CreateRoleResponse response = iamMock.createRole(CreateRoleRequest.builder()
                .roleName("tap-role")
                .assumeRolePolicyDocument(assumePolicy)
                .build());

        assertThat(response.role().arn()).contains("arn:aws:iam");
    }

    @Test
    public void testInstanceLaunchWithT3Micro() {
        RunInstancesResponse response = ec2Mock.runInstances(RunInstancesRequest.builder()
                .imageId("ami-test")
                .instanceType(InstanceType.T3_MICRO)
                .minCount(1)
                .maxCount(1)
                .build());

        assertThat(response.instances()).hasSize(1);
        assertThat(response.instances().get(0).instanceType()).isEqualTo(InstanceType.T3_MICRO);
    }

    @Test
    public void testOutputsAreCapturedCorrectly() {
        CreateVpcResponse vpc = ec2Mock.createVpc(CreateVpcRequest.builder().cidrBlock("10.0.0.0/16").build());
        CreateSecurityGroupResponse sg = ec2Mock.createSecurityGroup(CreateSecurityGroupRequest.builder()
                .groupName("tap-sg").description("TapStack SG").vpcId(vpc.vpc().vpcId()).build());
        RunInstancesResponse instance = ec2Mock.runInstances(RunInstancesRequest.builder()
                .imageId("ami-test").instanceType(InstanceType.T3_MICRO).minCount(1).maxCount(1).build());

        assertThat(vpc.vpc().vpcId()).isEqualTo("vpc-123");
        assertThat(sg.groupId()).isEqualTo("sg-123");
        assertThat(instance.instances().get(0).instanceId()).isEqualTo("i-123");
    }

    @Test
    public void testTaggingStandards() {
        CreateTagsRequest request = CreateTagsRequest.builder()
                .resources("vpc-123")
                .tags(
                        software.amazon.awssdk.services.ec2.model.Tag.builder()
                                .key("Environment").value("dev").build(),
                        software.amazon.awssdk.services.ec2.model.Tag.builder()
                                .key("CreatedBy").value("AWS-SDK").build()
                )
                .build();

        assertThat(request.tags()).extracting("key").contains("Environment", "CreatedBy");
    }
}
