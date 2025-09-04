package app;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudformation.CloudFormationClient;
import software.amazon.awssdk.services.cloudformation.model.DescribeStacksRequest;
import software.amazon.awssdk.services.cloudformation.model.DescribeStacksResponse;
import software.amazon.awssdk.services.cloudformation.model.Output;
import software.amazon.awssdk.services.cloudformation.model.Stack;
import software.amazon.awssdk.services.cloudformation.model.StackStatus;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.DescribeInstancesRequest;
import software.amazon.awssdk.services.ec2.model.DescribeInstancesResponse;
import software.amazon.awssdk.services.ec2.model.DescribeSecurityGroupsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeSecurityGroupsResponse;
import software.amazon.awssdk.services.ec2.model.DescribeSubnetsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeSubnetsResponse;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsResponse;
import software.amazon.awssdk.services.ec2.model.Instance;
import software.amazon.awssdk.services.ec2.model.InstanceStateName;
import software.amazon.awssdk.services.ec2.model.InstanceType;
import software.amazon.awssdk.services.ec2.model.IpPermission;
import software.amazon.awssdk.services.ec2.model.SecurityGroup;
import software.amazon.awssdk.services.ec2.model.Subnet;
import software.amazon.awssdk.services.ec2.model.Vpc;
import software.amazon.awssdk.services.ec2.model.VpcState;
import software.amazon.awssdk.services.iam.IamClient;
import software.amazon.awssdk.services.iam.model.GetRoleRequest;
import software.amazon.awssdk.services.iam.model.GetRoleResponse;
import software.amazon.awssdk.services.iam.model.ListAttachedRolePoliciesRequest;
import software.amazon.awssdk.services.iam.model.ListAttachedRolePoliciesResponse;

import java.io.File;
import java.nio.file.Files;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Comprehensive integration tests for deployed AWS CDK infrastructure.
 *
 * These tests validate that the actual AWS infrastructure matches the CDK specifications
 * and that all resources are properly configured and functional across both regions.
 *
 * Prerequisites:
 * - AWS credentials configured (AWS CLI, IAM roles, or environment variables)
 * - CDK stacks deployed to AWS in both us-east-1 and us-west-2
 * - Stack outputs available in cfn-outputs/flat-outputs.json
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class MainIntegrationTest {

    private static final String ENVIRONMENT_SUFFIX = System.getenv("ENVIRONMENT_SUFFIX") != null 
        ? System.getenv("ENVIRONMENT_SUFFIX") : "dev";
    private static final String STACK_NAME_US_EAST_1 = "TapStack-" + ENVIRONMENT_SUFFIX + "-us-east-1";
    private static final String STACK_NAME_US_WEST_2 = "TapStack-" + ENVIRONMENT_SUFFIX + "-us-west-2";
    
    private static CloudFormationClient cloudFormationClientUsEast1;
    private static CloudFormationClient cloudFormationClientUsWest2;
    private static Ec2Client ec2ClientUsEast1;
    private static Ec2Client ec2ClientUsWest2;
    private static IamClient iamClientUsEast1;
    
    private static Map<String, String> stackOutputs;
    private static final Region regionUsEast1 = Region.US_EAST_1;
    private static final Region regionUsWest2 = Region.US_WEST_2;

    @BeforeAll
    static void setUp() {
        try {
            // Initialize AWS SDK clients for both regions
            DefaultCredentialsProvider credentialsProvider = DefaultCredentialsProvider.create();
            
            cloudFormationClientUsEast1 = CloudFormationClient.builder()
                .region(regionUsEast1)
                .credentialsProvider(credentialsProvider)
                .build();
                
            cloudFormationClientUsWest2 = CloudFormationClient.builder()
                .region(regionUsWest2)
                .credentialsProvider(credentialsProvider)
                .build();
                
            ec2ClientUsEast1 = Ec2Client.builder()
                .region(regionUsEast1)
                .credentialsProvider(credentialsProvider)
                .build();
                
            ec2ClientUsWest2 = Ec2Client.builder()
                .region(regionUsWest2)
                .credentialsProvider(credentialsProvider)
                .build();
                
            iamClientUsEast1 = IamClient.builder()
                .region(regionUsEast1)
                .credentialsProvider(credentialsProvider)
                .build();

            // Load stack outputs
            loadStackOutputs();
            
        } catch (Exception e) {
            System.err.println("Failed to initialize AWS clients or load stack outputs: " + e.getMessage());
            fail("Setup failed: " + e.getMessage());
        }
    }

    private static void loadStackOutputs() {
        try {
            // First try to load from flat-outputs.json file
            File flatOutputsFile = new File("cfn-outputs/flat-outputs.json");
            if (flatOutputsFile.exists()) {
                String content = Files.readString(flatOutputsFile.toPath());
                ObjectMapper mapper = new ObjectMapper();
                stackOutputs = mapper.readValue(content, new TypeReference<Map<String, String>>(){});
                System.out.println("Loaded stack outputs from flat-outputs.json: " + stackOutputs.keySet());
                
                // If the file is empty or contains no relevant outputs, fall back to CloudFormation
                if (stackOutputs.isEmpty()) {
                    System.out.println("flat-outputs.json is empty, falling back to CloudFormation...");
                } else {
                    return; // Only return early if we have actual data
                }
            }

            // Fallback: Query CloudFormation directly for stack outputs from both regions
            if (!flatOutputsFile.exists()) {
                System.out.println("flat-outputs.json not found, querying CloudFormation directly...");
            } else {
                System.out.println("Querying CloudFormation directly...");
            }
            stackOutputs = new HashMap<>();
            
            // Load outputs from us-east-1
            try {
                DescribeStacksRequest requestUsEast1 = DescribeStacksRequest.builder()
                    .stackName(STACK_NAME_US_EAST_1)
                    .build();
                DescribeStacksResponse responseUsEast1 = cloudFormationClientUsEast1.describeStacks(requestUsEast1);
                
                if (!responseUsEast1.stacks().isEmpty()) {
                    Stack stackUsEast1 = responseUsEast1.stacks().get(0);
                    Map<String, String> usEast1Outputs = stackUsEast1.outputs().stream()
                        .collect(Collectors.toMap(Output::exportName, Output::outputValue));
                    stackOutputs.putAll(usEast1Outputs);
                    System.out.println("Loaded US-East-1 outputs: " + usEast1Outputs.keySet());
                }
            } catch (Exception e) {
                System.err.println("Failed to load US-East-1 stack outputs: " + e.getMessage());
            }
            
            // Load outputs from us-west-2
            try {
                DescribeStacksRequest requestUsWest2 = DescribeStacksRequest.builder()
                    .stackName(STACK_NAME_US_WEST_2)
                    .build();
                DescribeStacksResponse responseUsWest2 = cloudFormationClientUsWest2.describeStacks(requestUsWest2);
                
                if (!responseUsWest2.stacks().isEmpty()) {
                    Stack stackUsWest2 = responseUsWest2.stacks().get(0);
                    Map<String, String> usWest2Outputs = stackUsWest2.outputs().stream()
                        .collect(Collectors.toMap(Output::exportName, Output::outputValue));
                    stackOutputs.putAll(usWest2Outputs);
                    System.out.println("Loaded US-West-2 outputs: " + usWest2Outputs.keySet());
                }
            } catch (Exception e) {
                System.err.println("Failed to load US-West-2 stack outputs: " + e.getMessage());
            }
            
        } catch (Exception e) {
            System.err.println("Failed to load stack outputs: " + e.getMessage());
            stackOutputs = new HashMap<>(); // Initialize empty map to avoid null pointer exceptions
        }
    }

    @Test
    @Order(1)
    public void testStacksExistInBothRegions() {
        try {
            // Test US-East-1 stack
            DescribeStacksRequest requestUsEast1 = DescribeStacksRequest.builder()
                .stackName(STACK_NAME_US_EAST_1)
                .build();
            DescribeStacksResponse responseUsEast1 = cloudFormationClientUsEast1.describeStacks(requestUsEast1);
            
            assertThat(responseUsEast1.stacks()).isNotEmpty();
            Stack stackUsEast1 = responseUsEast1.stacks().get(0);
            assertThat(stackUsEast1.stackName()).isEqualTo(STACK_NAME_US_EAST_1);
            assertThat(stackUsEast1.stackStatus()).isIn(
                StackStatus.CREATE_COMPLETE,
                StackStatus.UPDATE_COMPLETE
            );
            System.out.println("✅ Stack " + STACK_NAME_US_EAST_1 + " exists and is in " + stackUsEast1.stackStatus() + " state");
            
            // Test US-West-2 stack
            DescribeStacksRequest requestUsWest2 = DescribeStacksRequest.builder()
                .stackName(STACK_NAME_US_WEST_2)
                .build();
            DescribeStacksResponse responseUsWest2 = cloudFormationClientUsWest2.describeStacks(requestUsWest2);
            
            assertThat(responseUsWest2.stacks()).isNotEmpty();
            Stack stackUsWest2 = responseUsWest2.stacks().get(0);
            assertThat(stackUsWest2.stackName()).isEqualTo(STACK_NAME_US_WEST_2);
            assertThat(stackUsWest2.stackStatus()).isIn(
                StackStatus.CREATE_COMPLETE,
                StackStatus.UPDATE_COMPLETE
            );
            System.out.println("✅ Stack " + STACK_NAME_US_WEST_2 + " exists and is in " + stackUsWest2.stackStatus() + " state");
            
        } catch (Exception e) {
            fail("Stack validation failed: " + e.getMessage());
        }
    }

    @Test
    @Order(2)
    public void testVpcConfigurationUsEast1() {
        try {
            // Get VPC ID from outputs
            String vpcId = stackOutputs.get("us-east-1-vpcId");
            assertThat(vpcId).isNotNull().withFailMessage("us-east-1-vpcId not found in stack outputs");
            System.out.println("Testing US-East-1 VPC: " + vpcId);
            
            // Verify VPC exists and has correct configuration
            DescribeVpcsRequest request = DescribeVpcsRequest.builder()
                .vpcIds(vpcId)
                .build();
            DescribeVpcsResponse response = ec2ClientUsEast1.describeVpcs(request);
            
            assertThat(response.vpcs()).hasSize(1);
            Vpc vpc = response.vpcs().get(0);
            assertThat(vpc.vpcId()).isEqualTo(vpcId);
            assertThat(vpc.cidrBlock()).isEqualTo("10.0.0.0/16");
            assertThat(vpc.state()).isEqualTo(VpcState.AVAILABLE);
            System.out.println("✅ US-East-1 VPC configuration verified: " + vpc.cidrBlock());
            
            // Verify subnets
            String publicSubnetId = stackOutputs.get("us-east-1-vpcPublicSubnetId");
            String privateSubnetId = stackOutputs.get("us-east-1-vpcPrivateSubnetId");
            
            assertThat(publicSubnetId).isNotNull().withFailMessage("us-east-1-vpcPublicSubnetId not found");
            assertThat(privateSubnetId).isNotNull().withFailMessage("us-east-1-vpcPrivateSubnetId not found");
            
            DescribeSubnetsRequest subnetsRequest = DescribeSubnetsRequest.builder()
                .subnetIds(publicSubnetId, privateSubnetId)
                .build();
            DescribeSubnetsResponse subnetsResponse = ec2ClientUsEast1.describeSubnets(subnetsRequest);
            
            assertThat(subnetsResponse.subnets()).hasSize(2);
            
            Subnet publicSubnet = subnetsResponse.subnets().stream()
                .filter(s -> s.subnetId().equals(publicSubnetId))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Public subnet not found"));
                
            Subnet privateSubnet = subnetsResponse.subnets().stream()
                .filter(s -> s.subnetId().equals(privateSubnetId))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Private subnet not found"));
            
            assertThat(publicSubnet.mapPublicIpOnLaunch()).isTrue();
            assertThat(privateSubnet.mapPublicIpOnLaunch()).isFalse();
            System.out.println("✅ US-East-1 subnets configuration verified");
            
        } catch (Exception e) {
            fail("US-East-1 VPC validation failed: " + e.getMessage());
        }
    }

    @Test
    @Order(3)
    public void testVpcConfigurationUsWest2() {
        try {
            // Get VPC ID from outputs
            String vpcId = stackOutputs.get("us-west-2-vpcId");
            assertThat(vpcId).isNotNull().withFailMessage("us-west-2-vpcId not found in stack outputs");
            System.out.println("Testing US-West-2 VPC: " + vpcId);
            
            // Verify VPC exists and has correct configuration
            DescribeVpcsRequest request = DescribeVpcsRequest.builder()
                .vpcIds(vpcId)
                .build();
            DescribeVpcsResponse response = ec2ClientUsWest2.describeVpcs(request);
            
            assertThat(response.vpcs()).hasSize(1);
            Vpc vpc = response.vpcs().get(0);
            assertThat(vpc.vpcId()).isEqualTo(vpcId);
            assertThat(vpc.cidrBlock()).isEqualTo("192.168.0.0/16");
            assertThat(vpc.state()).isEqualTo(VpcState.AVAILABLE);
            System.out.println("✅ US-West-2 VPC configuration verified: " + vpc.cidrBlock());
            
            // Verify subnets
            String publicSubnetId = stackOutputs.get("us-west-2-vpcPublicSubnetId");
            String privateSubnetId = stackOutputs.get("us-west-2-vpcPrivateSubnetId");
            
            assertThat(publicSubnetId).isNotNull().withFailMessage("us-west-2-vpcPublicSubnetId not found");
            assertThat(privateSubnetId).isNotNull().withFailMessage("us-west-2-vpcPrivateSubnetId not found");
            
            DescribeSubnetsRequest subnetsRequest = DescribeSubnetsRequest.builder()
                .subnetIds(publicSubnetId, privateSubnetId)
                .build();
            DescribeSubnetsResponse subnetsResponse = ec2ClientUsWest2.describeSubnets(subnetsRequest);
            
            assertThat(subnetsResponse.subnets()).hasSize(2);
            System.out.println("✅ US-West-2 subnets configuration verified");
            
        } catch (Exception e) {
            fail("US-West-2 VPC validation failed: " + e.getMessage());
        }
    }

    @Test
    @Order(4)
    public void testSecurityGroupsConfiguration() {
        try {
            // Test US-East-1 Security Group
            String securityGroupIdUsEast1 = stackOutputs.get("us-east-1-securityGroupId");
            assertThat(securityGroupIdUsEast1).isNotNull().withFailMessage("us-east-1-securityGroupId not found");
            
            DescribeSecurityGroupsRequest requestUsEast1 = DescribeSecurityGroupsRequest.builder()
                .groupIds(securityGroupIdUsEast1)
                .build();
            DescribeSecurityGroupsResponse responseUsEast1 = ec2ClientUsEast1.describeSecurityGroups(requestUsEast1);
            
            assertThat(responseUsEast1.securityGroups()).hasSize(1);
            SecurityGroup sgUsEast1 = responseUsEast1.securityGroups().get(0);
            
            // Verify HTTP and HTTPS rules
            List<IpPermission> ingressRules = sgUsEast1.ipPermissions();
            boolean hasHttpRule = ingressRules.stream()
                .anyMatch(rule -> rule.fromPort() == 80 && rule.toPort() == 80 && "tcp".equals(rule.ipProtocol()));
            boolean hasHttpsRule = ingressRules.stream()
                .anyMatch(rule -> rule.fromPort() == 443 && rule.toPort() == 443 && "tcp".equals(rule.ipProtocol()));
                
            assertThat(hasHttpRule).isTrue().withFailMessage("HTTP rule not found in US-East-1 security group");
            assertThat(hasHttpsRule).isTrue().withFailMessage("HTTPS rule not found in US-East-1 security group");
            System.out.println("✅ US-East-1 Security Group HTTP/HTTPS rules verified");
            
            // Test US-West-2 Security Group
            String securityGroupIdUsWest2 = stackOutputs.get("us-west-2-securityGroupId");
            assertThat(securityGroupIdUsWest2).isNotNull().withFailMessage("us-west-2-securityGroupId not found");
            
            DescribeSecurityGroupsRequest requestUsWest2 = DescribeSecurityGroupsRequest.builder()
                .groupIds(securityGroupIdUsWest2)
                .build();
            DescribeSecurityGroupsResponse responseUsWest2 = ec2ClientUsWest2.describeSecurityGroups(requestUsWest2);
            
            assertThat(responseUsWest2.securityGroups()).hasSize(1);
            SecurityGroup sgUsWest2 = responseUsWest2.securityGroups().get(0);
            
            // Verify HTTP and HTTPS rules
            List<IpPermission> ingressRulesUsWest2 = sgUsWest2.ipPermissions();
            boolean hasHttpRuleUsWest2 = ingressRulesUsWest2.stream()
                .anyMatch(rule -> rule.fromPort() == 80 && rule.toPort() == 80 && "tcp".equals(rule.ipProtocol()));
            boolean hasHttpsRuleUsWest2 = ingressRulesUsWest2.stream()
                .anyMatch(rule -> rule.fromPort() == 443 && rule.toPort() == 443 && "tcp".equals(rule.ipProtocol()));
                
            assertThat(hasHttpRuleUsWest2).isTrue().withFailMessage("HTTP rule not found in US-West-2 security group");
            assertThat(hasHttpsRuleUsWest2).isTrue().withFailMessage("HTTPS rule not found in US-West-2 security group");
            System.out.println("✅ US-West-2 Security Group HTTP/HTTPS rules verified");
            
        } catch (Exception e) {
            fail("Security Groups validation failed: " + e.getMessage());
        }
    }

    @Test
    @Order(5)
    public void testEc2InstanceConfiguration() {
        try {
            // EC2 instance should only exist in US-East-1
            String ec2InstanceId = stackOutputs.get("us-east-1-ec2InstanceId");
            assertThat(ec2InstanceId).isNotNull().withFailMessage("us-east-1-ec2InstanceId not found in stack outputs");
            System.out.println("Testing EC2 instance: " + ec2InstanceId);
            
            DescribeInstancesRequest request = DescribeInstancesRequest.builder()
                .instanceIds(ec2InstanceId)
                .build();
            DescribeInstancesResponse response = ec2ClientUsEast1.describeInstances(request);
            
            assertThat(response.reservations()).isNotEmpty();
            assertThat(response.reservations().get(0).instances()).hasSize(1);
            
            Instance instance = response.reservations().get(0).instances().get(0);
            assertThat(instance.instanceId()).isEqualTo(ec2InstanceId);
            assertThat(instance.instanceType()).isEqualTo(InstanceType.T3_MICRO);
            assertThat(instance.state().name()).isIn(InstanceStateName.RUNNING, InstanceStateName.PENDING, InstanceStateName.STOPPED);
            System.out.println("✅ EC2 instance configuration verified: " + instance.instanceType() + " in state " + instance.state().name());
            
            // Verify instance is in the correct VPC and subnet
            String expectedVpcId = stackOutputs.get("us-east-1-vpcId");
            String expectedSubnetId = stackOutputs.get("us-east-1-vpcPublicSubnetId");
            
            assertThat(instance.vpcId()).isEqualTo(expectedVpcId);
            assertThat(instance.subnetId()).isEqualTo(expectedSubnetId);
            System.out.println("✅ EC2 instance VPC and subnet placement verified");
            
        } catch (Exception e) {
            fail("EC2 instance validation failed: " + e.getMessage());
        }
    }

    @Test
    @Order(6)
    public void testIamRoleConfiguration() {
        try {
            // Test EC2 instance role
            String ec2InstanceRoleArn = stackOutputs.get("us-east-1-ec2InstanceRoleArn");
            assertThat(ec2InstanceRoleArn).isNotNull().withFailMessage("us-east-1-ec2InstanceRoleArn not found in stack outputs");
            System.out.println("Testing IAM role: " + ec2InstanceRoleArn);
            
            // Extract role name from ARN
            String roleName = ec2InstanceRoleArn.substring(ec2InstanceRoleArn.lastIndexOf("/") + 1);
            
            GetRoleRequest request = GetRoleRequest.builder()
                .roleName(roleName)
                .build();
            GetRoleResponse response = iamClientUsEast1.getRole(request);
            
            assertThat(response.role().arn()).isEqualTo(ec2InstanceRoleArn);
            assertThat(response.role().assumeRolePolicyDocument()).contains("ec2.amazonaws.com");
            System.out.println("✅ IAM role configuration verified: " + roleName);
            
            // Verify attached managed policies
            ListAttachedRolePoliciesRequest policiesRequest = ListAttachedRolePoliciesRequest.builder()
                .roleName(roleName)
                .build();
            ListAttachedRolePoliciesResponse policiesResponse = iamClientUsEast1.listAttachedRolePolicies(policiesRequest);
            
            boolean hasSSMPolicy = policiesResponse.attachedPolicies().stream()
                .anyMatch(policy -> policy.policyArn().contains("AmazonSSMManagedInstanceCore"));
            boolean hasCloudWatchPolicy = policiesResponse.attachedPolicies().stream()
                .anyMatch(policy -> policy.policyArn().contains("CloudWatchAgentServerPolicy"));
                
            assertThat(hasSSMPolicy).isTrue().withFailMessage("SSM managed policy not attached");
            assertThat(hasCloudWatchPolicy).isTrue().withFailMessage("CloudWatch managed policy not attached");
            System.out.println("✅ IAM role managed policies verified");
            
        } catch (Exception e) {
            fail("IAM role validation failed: " + e.getMessage());
        }
    }

    @Test
    @Order(7)
    public void testResourceNamingAndTagging() {
        try {
            // Verify stack naming conventions
            assertThat(STACK_NAME_US_EAST_1).matches("TapStack-.*-us-east-1");
            assertThat(STACK_NAME_US_WEST_2).matches("TapStack-.*-us-west-2");
            System.out.println("✅ Stack naming conventions verified");
            
            // Verify resource outputs follow expected patterns
            String vpcIdUsEast1 = stackOutputs.get("us-east-1-vpcId");
            String vpcIdUsWest2 = stackOutputs.get("us-west-2-vpcId");
            String ec2InstanceId = stackOutputs.get("us-east-1-ec2InstanceId");
            
            if (vpcIdUsEast1 != null) {
                assertThat(vpcIdUsEast1).startsWith("vpc-");
                System.out.println("✅ VPC ID format verified: " + vpcIdUsEast1);
            }
            
            if (vpcIdUsWest2 != null) {
                assertThat(vpcIdUsWest2).startsWith("vpc-");
                System.out.println("✅ VPC ID format verified: " + vpcIdUsWest2);
            }
            
            if (ec2InstanceId != null) {
                assertThat(ec2InstanceId).startsWith("i-");
                System.out.println("✅ EC2 Instance ID format verified: " + ec2InstanceId);
            }
            
        } catch (Exception e) {
            fail("Resource naming validation failed: " + e.getMessage());
        }
    }

    @Test
    @Order(8)
    public void testStackOutputsCompleteness() {
        try {
            // Verify all expected outputs are present for US-East-1
            List<String> expectedUsEast1Outputs = Arrays.asList(
                "us-east-1-vpcId",
                "us-east-1-vpcPublicSubnetId",
                "us-east-1-vpcPrivateSubnetId",
                "us-east-1-securityGroupId",
                "us-east-1-ec2InstanceId",
                "us-east-1-ec2InstanceRoleArn"
            );
            
            for (String expectedOutput : expectedUsEast1Outputs) {
                assertThat(stackOutputs).containsKey(expectedOutput)
                    .withFailMessage("Expected US-East-1 output not found: " + expectedOutput);
                assertThat(stackOutputs.get(expectedOutput)).isNotNull()
                    .withFailMessage("US-East-1 output value is null: " + expectedOutput);
            }
            System.out.println("✅ All US-East-1 outputs present and non-null");
            
            // Verify all expected outputs are present for US-West-2
            List<String> expectedUsWest2Outputs = Arrays.asList(
                "us-west-2-vpcId",
                "us-west-2-vpcPublicSubnetId", 
                "us-west-2-vpcPrivateSubnetId",
                "us-west-2-securityGroupId"
            );
            
            for (String expectedOutput : expectedUsWest2Outputs) {
                assertThat(stackOutputs).containsKey(expectedOutput)
                    .withFailMessage("Expected US-West-2 output not found: " + expectedOutput);
                assertThat(stackOutputs.get(expectedOutput)).isNotNull()
                    .withFailMessage("US-West-2 output value is null: " + expectedOutput);
            }
            System.out.println("✅ All US-West-2 outputs present and non-null");
            
            // Verify US-West-2 should NOT have EC2-related outputs
            assertThat(stackOutputs).doesNotContainKey("us-west-2-ec2InstanceId")
                .withFailMessage("US-West-2 should not have EC2 instance");
            assertThat(stackOutputs).doesNotContainKey("us-west-2-ec2InstanceRoleArn")
                .withFailMessage("US-West-2 should not have EC2 IAM role");
            System.out.println("✅ US-West-2 correctly excludes EC2-related outputs");
            
        } catch (Exception e) {
            fail("Stack outputs completeness validation failed: " + e.getMessage());
        }
    }

    @Test
    @Order(9) 
    public void testRegionalResourceIsolation() {
        try {
            // Verify resources are properly isolated between regions
            String vpcIdUsEast1 = stackOutputs.get("us-east-1-vpcId");
            String vpcIdUsWest2 = stackOutputs.get("us-west-2-vpcId");
            
            assertThat(vpcIdUsEast1).isNotEqualTo(vpcIdUsWest2)
                .withFailMessage("VPC IDs should be different between regions");
            System.out.println("✅ Regional VPC isolation verified");
            
            // Verify different CIDR blocks
            DescribeVpcsRequest requestUsEast1 = DescribeVpcsRequest.builder()
                .vpcIds(vpcIdUsEast1)
                .build();
            DescribeVpcsResponse responseUsEast1 = ec2ClientUsEast1.describeVpcs(requestUsEast1);
            
            DescribeVpcsRequest requestUsWest2 = DescribeVpcsRequest.builder()
                .vpcIds(vpcIdUsWest2)
                .build();
            DescribeVpcsResponse responseUsWest2 = ec2ClientUsWest2.describeVpcs(requestUsWest2);
            
            String cidrUsEast1 = responseUsEast1.vpcs().get(0).cidrBlock();
            String cidrUsWest2 = responseUsWest2.vpcs().get(0).cidrBlock();
            
            assertThat(cidrUsEast1).isNotEqualTo(cidrUsWest2)
                .withFailMessage("CIDR blocks should be different between regions");
            assertThat(cidrUsEast1).isEqualTo("10.0.0.0/16");
            assertThat(cidrUsWest2).isEqualTo("192.168.0.0/16");
            System.out.println("✅ Regional CIDR isolation verified: " + cidrUsEast1 + " vs " + cidrUsWest2);
            
        } catch (Exception e) {
            fail("Regional resource isolation validation failed: " + e.getMessage());
        }
    }
}