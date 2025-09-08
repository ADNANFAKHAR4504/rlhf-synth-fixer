package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.kms.KeySpec;
import software.amazon.awscdk.services.kms.KeyUsage;
import software.constructs.Construct;

import java.util.Map;

public class Ec2Stack extends Stack {

    private final Instance webServer;
    private final Key ebsKey;

    public Ec2Stack(final Construct scope, final String id, final StackProps props,
                   final Vpc vpc, final SecurityGroup securityGroup, final Role ec2Role) {
        super(scope, id, props);
        
        // Get environment suffix from context
        String environmentSuffix = (String) this.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Create KMS key for EBS encryption
        this.ebsKey = Key.Builder.create(this, "app-key-ebs")
                .description("KMS key for EBS volume encryption")
                .keyUsage(KeyUsage.ENCRYPT_DECRYPT)
                .keySpec(KeySpec.SYMMETRIC_DEFAULT)
                .build();

        // Create EC2 instance in public subnet
        this.webServer = Instance.Builder.create(this, "app-ec2-web")
                .instanceName("app-ec2-web-" + environmentSuffix)
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM))
                .machineImage(MachineImage.latestAmazonLinux2())
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PUBLIC)
                        .build())
                .securityGroup(securityGroup)
                .role(ec2Role)
                .blockDevices(java.util.List.of(
                        BlockDevice.builder()
                                .deviceName("/dev/xvda")
                                .volume(BlockDeviceVolume.ebs(20, EbsDeviceOptions.builder()
                                        .encrypted(true)
                                        .kmsKey(ebsKey)
                                        .volumeType(EbsDeviceVolumeType.GP3)
                                        .build()))
                                .build()
                ))
                .build();

        this.addCommonTags();
    }

    private void addCommonTags() {
        Map<String, String> tags = Map.of(
                "Project", "CloudSecurity",
                "Environment", "Production"
        );
        tags.forEach((key, value) -> this.getNode().addMetadata(key, value));
    }

    public Instance getWebServer() {
        return webServer;
    }

    public Key getEbsKey() {
        return ebsKey;
    }
}