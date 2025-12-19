package app;

import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.*;
import software.amazon.awssdk.services.iam.IamClient;
import software.amazon.awssdk.services.iam.model.*;

import java.util.Comparator;

// ✅ CDK imports
import software.amazon.awscdk.App;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;

/**
 * Example AWS SDK v2 implementation of TapStack.
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

            runWithClients(ec2, iam, envSuffix, region);

        } catch (Exception e) {
            System.err.println("❌ Error provisioning TapStack: " + e.getMessage());
        }

        // ✅ Minimal CDK App so `cdk synth` produces a manifest
        App cdkApp = new App();
        new Stack(cdkApp, "TapStack", StackProps.builder().build());
        cdkApp.synth();
    }

    /**
     * Extracted provisioning logic — called by both main() and tests.
     */
    public static void runWithClients(Ec2Client ec2, IamClient iam, String envSuffix, Region region) {
        // --- 1. Create VPC ---
        CreateVpcResponse vpcResponse = ec2.createVpc(CreateVpcRequest.builder()
                .cidrBlock("10.0.0.0/16").build());
        String vpcId = vpcResponse.vpc().vpcId();
        System.out.println("✅ Created VPC: " + vpcId);

        ec2.modifyVpcAttribute(ModifyVpcAttributeRequest.builder()
                .vpcId(vpcId)
                .enableDnsSupport(AttributeBooleanValue.builder().value(true).build())
                .build());

        // --- 2. Create Subnet ---
        CreateSubnetResponse subnetResponse = ec2.createSubnet(CreateSubnetRequest.builder()
                .vpcId(vpcId).cidrBlock("10.0.1.0/24")
                .availabilityZone(region.toString() + "a").build());
        String subnetId = subnetResponse.subnet().subnetId();
        System.out.println("✅ Created Subnet: " + subnetId);

        // --- 3. Create SG ---
        CreateSecurityGroupResponse sgResponse = ec2.createSecurityGroup(CreateSecurityGroupRequest.builder()
                .groupName("tap-" + envSuffix + "-sg")
                .description("Allow SSH from specific IP")
                .vpcId(vpcId).build());
        String sgId = sgResponse.groupId();
        System.out.println("✅ Created Security Group: " + sgId);

        // --- 4. IAM Role ---
        String roleName = "tap-" + envSuffix + "-ec2-role";
        try {
            GetRoleResponse roleResp = iam.getRole(GetRoleRequest.builder().roleName(roleName).build());
            System.out.println("ℹ️ IAM Role already exists: " + roleResp.role().arn());
        } catch (NoSuchEntityException e) {
            CreateRoleResponse roleResponse = iam.createRole(CreateRoleRequest.builder()
                    .roleName(roleName)
                    .assumeRolePolicyDocument("{\"Version\":\"2012-10-17\",\"Statement\":[]}")
                    .build());
            System.out.println("✅ Created IAM Role: " + roleResponse.role().arn());

            iam.attachRolePolicy(AttachRolePolicyRequest.builder()
                    .roleName(roleName)
                    .policyArn("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore")
                    .build());
        }

        // --- 5. Describe Images ---
        DescribeImagesResponse describeImages = ec2.describeImages(
                DescribeImagesRequest.builder()
                        .owners("amazon")
                        .filters(Filter.builder().name("name").values("amzn2-ami-hvm-*-x86_64-gp2").build())
                        .build());
        String latestAmi = describeImages.images().stream()
                .max(Comparator.comparing(Image::creationDate))
                .orElseThrow(() -> new RuntimeException("No AMI found"))
                .imageId();

        // --- 6. Launch Instance ---
        RunInstancesResponse runResponse = ec2.runInstances(RunInstancesRequest.builder()
                .imageId(latestAmi)
                .instanceType(InstanceType.T3_MICRO)
                .maxCount(1).minCount(1)
                .subnetId(subnetId)
                .securityGroupIds(sgId).build());
        System.out.println("✅ Launched EC2 Instance: " + runResponse.instances().get(0).instanceId());
    }
}
