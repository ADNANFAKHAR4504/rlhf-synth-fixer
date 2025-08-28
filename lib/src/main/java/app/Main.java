package app;

import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.*;
import software.amazon.awssdk.services.iam.IamClient;
import software.amazon.awssdk.services.iam.model.*;

import java.util.Comparator;

/**
 * Example AWS SDK v2 implementation of TapStack.
 * Creates a VPC, Subnet, Security Group, IAM Role, and an EC2 instance.
 */
public class Main {

    public static void main(String[] args) {
        String envSuffix = System.getenv().getOrDefault("ENVIRONMENT_SUFFIX", "dev");
        Region region = envSuffix.equalsIgnoreCase("east") ? Region.US_EAST_1 : Region.US_WEST_2;

        try (Ec2Client ec2 = Ec2Client.builder()
                        .region(region)
                        .credentialsProvider(DefaultCredentialsProvider.create())
                        .build();
             IamClient iam = IamClient.builder()
                        .region(region)
                        .credentialsProvider(DefaultCredentialsProvider.create())
                        .build()) {

            // --- 1. Create VPC ---
            CreateVpcResponse vpcResponse = ec2.createVpc(CreateVpcRequest.builder()
                    .cidrBlock("10.0.0.0/16")
                    .build());
            String vpcId = vpcResponse.vpc().vpcId();
            System.out.println("✅ Created VPC: " + vpcId);

            ec2.modifyVpcAttribute(ModifyVpcAttributeRequest.builder()
                    .vpcId(vpcId)
                    .enableDnsSupport(AttributeBooleanValue.builder().value(true).build())
                    .build());
            ec2.modifyVpcAttribute(ModifyVpcAttributeRequest.builder()
                    .vpcId(vpcId)
                    .enableDnsHostnames(AttributeBooleanValue.builder().value(true).build())
                    .build());

            // --- 2. Create Subnet ---
            CreateSubnetResponse subnetResponse = ec2.createSubnet(CreateSubnetRequest.builder()
                    .vpcId(vpcId)
                    .cidrBlock("10.0.1.0/24")
                    .availabilityZone(region.toString() + "a")
                    .build());
            String subnetId = subnetResponse.subnet().subnetId();
            System.out.println("✅ Created Subnet: " + subnetId);

            // --- 3. Create Security Group ---
            CreateSecurityGroupResponse sgResponse = ec2.createSecurityGroup(CreateSecurityGroupRequest.builder()
                    .groupName("tap-" + envSuffix + "-sg")
                    .description("Allow SSH from specific IP")
                    .vpcId(vpcId)
                    .build());
            String sgId = sgResponse.groupId();
            System.out.println("✅ Created Security Group: " + sgId);

            ec2.authorizeSecurityGroupIngress(AuthorizeSecurityGroupIngressRequest.builder()
                    .groupId(sgId)
                    .ipPermissions(IpPermission.builder()
                            .ipProtocol("tcp")
                            .fromPort(22)
                            .toPort(22)
                            .ipRanges(IpRange.builder().cidrIp("203.0.113.0/32").build())
                            .build())
                    .build());

            // --- 4. Ensure IAM Role exists ---
            String roleName = "tap-" + envSuffix + "-ec2-role";
            String roleArn;
            try {
                GetRoleResponse getRoleResponse = iam.getRole(GetRoleRequest.builder().roleName(roleName).build());
                roleArn = getRoleResponse.role().arn();
                System.out.println("ℹ️ IAM Role already exists: " + roleArn);
            } catch (NoSuchEntityException e) {
                String assumeRolePolicy = "{\n" +
                        "  \"Version\": \"2012-10-17\",\n" +
                        "  \"Statement\": [\n" +
                        "    {\n" +
                        "      \"Effect\": \"Allow\",\n" +
                        "      \"Principal\": {\"Service\": \"ec2.amazonaws.com\"},\n" +
                        "      \"Action\": \"sts:AssumeRole\"\n" +
                        "    }\n" +
                        "  ]\n" +
                        "}";
                CreateRoleResponse roleResponse = iam.createRole(CreateRoleRequest.builder()
                        .roleName(roleName)
                        .assumeRolePolicyDocument(assumeRolePolicy)
                        .build());
                roleArn = roleResponse.role().arn();
                System.out.println("✅ Created IAM Role: " + roleArn);

                iam.attachRolePolicy(AttachRolePolicyRequest.builder()
                        .roleName(roleName)
                        .policyArn("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore")
                        .build());
            }

            // --- 5. Find latest Amazon Linux 2 AMI ---
            DescribeImagesResponse describeImages = ec2.describeImages(
                    DescribeImagesRequest.builder()
                            .owners("amazon")
                            .filters(
                                    Filter.builder().name("name").values("amzn2-ami-hvm-*-x86_64-gp2").build(),
                                    Filter.builder().name("state").values("available").build()
                            )
                            .build());
            String latestAmi = describeImages.images().stream()
                    .max(Comparator.comparing(Image::creationDate))
                    .orElseThrow(() -> new RuntimeException("No Amazon Linux 2 AMI found"))
                    .imageId();

            // --- 6. Launch EC2 Instance inside same VPC/Subnet with SG ---
            RunInstancesResponse runResponse = ec2.runInstances(RunInstancesRequest.builder()
                    .imageId(latestAmi)
                    .instanceType(InstanceType.T3_MICRO)
                    .maxCount(1)
                    .minCount(1)
                    .subnetId(subnetId)       // ✅ ensures SG and subnet are in same VPC
                    .securityGroupIds(sgId)
                    .build());
            String instanceId = runResponse.instances().get(0).instanceId();
            System.out.println("✅ Launched EC2 Instance: " + instanceId);

            // --- 7. Tag resources (fully qualified Tag to avoid ambiguity) ---
            ec2.createTags(CreateTagsRequest.builder()
                    .resources(instanceId, vpcId, subnetId, sgId)
                    .tags(
                            software.amazon.awssdk.services.ec2.model.Tag.builder()
                                    .key("Environment")
                                    .value(envSuffix)
                                    .build(),
                            software.amazon.awssdk.services.ec2.model.Tag.builder()
                                    .key("CreatedBy")
                                    .value("AWS-SDK")
                                    .build()
                    )
                    .build());

        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("❌ Error provisioning TapStack: " + e.getMessage());
        }
    }
}
