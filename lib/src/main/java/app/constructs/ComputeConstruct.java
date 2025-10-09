package app.constructs;

import app.config.SecurityConfig;
import com.hashicorp.cdktf.providers.aws.autoscaling_group.AutoscalingGroup;
import com.hashicorp.cdktf.providers.aws.autoscaling_group.AutoscalingGroupLaunchTemplate;
import com.hashicorp.cdktf.providers.aws.autoscaling_group.AutoscalingGroupTag;
import com.hashicorp.cdktf.providers.aws.instance.Instance;
import com.hashicorp.cdktf.providers.aws.instance.InstanceRootBlockDevice;
import com.hashicorp.cdktf.providers.aws.launch_template.*;
import software.constructs.Construct;

import java.util.*;

public class ComputeConstruct extends Construct {

    private final LaunchTemplate launchTemplate;

    private final AutoscalingGroup autoScalingGroup;

    private final List<Instance> instances;

    public ComputeConstruct(final Construct scope, final String id, final SecurityConfig config, final List<String> subnetIds,
                            final  SecurityConstruct security, final String targetGroupArn,
                            final Map<String, String> tags) {
        super(scope, id);

        this.instances = new ArrayList<>();

        String securityGroupId = security.getInstanceSecurityGroupId();
        String instanceProfileArn = security.getInstanceProfileArn();
        String kmsKeyId = security.getKmsKeyId();

        // Create launch template for blue-green deployment
        this.launchTemplate = createLaunchTemplate(config, securityGroupId, instanceProfileArn, kmsKeyId, tags);

        // Create Auto Scaling Group
        this.autoScalingGroup = createAutoScalingGroup(subnetIds, targetGroupArn, tags);

        // Create initial instances for migration
        createMigrationInstances(config, subnetIds, securityGroupId, instanceProfileArn, kmsKeyId, tags);
    }

    private LaunchTemplate createLaunchTemplate(final SecurityConfig config, final String securityGroupId,
                                                final String instanceProfileArn, final String kmsKeyId,
                                                final Map<String, String> tags) {

        String userData = Base64.getEncoder().encodeToString("""
                #!/bin/bash
                # Install CloudWatch agent
                wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
                rpm -U ./amazon-cloudwatch-agent.rpm
                            
                # Configure CloudWatch agent
                cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json << EOF
                {
                    "metrics": {
                        "namespace": "VPCMigration",
                        "metrics_collected": {
                            "cpu": {
                                "measurement": [
                                    {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
                                    "cpu_usage_iowait"
                                ],
                                "metrics_collection_interval": 60
                            },
                            "disk": {
                                "measurement": [
                                    {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
                                ],
                                "metrics_collection_interval": 60,
                                "resources": ["*"]
                            },
                            "mem": {
                                "measurement": [
                                    {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
                                ],
                                "metrics_collection_interval": 60
                            }
                        }
                    }
                }
                EOF
                            
                # Start CloudWatch agent
                /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\
                    -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
                """.getBytes());

        LaunchTemplateConfig.Builder builder = LaunchTemplateConfig.builder()
                .name(id + "-launch-template")
                .description("Launch template for migrated instances")
                .imageId(config.amiId())
                .instanceType(config.instanceType())
                .userData(userData)
                .vpcSecurityGroupIds(List.of(securityGroupId))
                .iamInstanceProfile(LaunchTemplateIamInstanceProfile.builder()
                        .arn(instanceProfileArn)
                        .build())
                .monitoring(LaunchTemplateMonitoring.builder()
                        .enabled(true)
                        .build())
                .tagSpecifications(List.of(
                        LaunchTemplateTagSpecifications.builder()
                                .resourceType("instance")
                                .tags(mergeTags(tags, Map.of("Name", "migrated-instance")))
                                .build(),
                        LaunchTemplateTagSpecifications.builder()
                                .resourceType("volume")
                                .tags(mergeTags(tags, Map.of("Name", "migrated-volume")))
                                .build()
                ))
                .tags(tags);

        if (config.enableEncryption()) {
            builder.blockDeviceMappings(List.of(
                    LaunchTemplateBlockDeviceMappings.builder()
                            .deviceName("/dev/xvda")
                            .ebs(LaunchTemplateBlockDeviceMappingsEbs.builder()
                                    .encrypted("true")
                                    .kmsKeyId(kmsKeyId)
                                    .volumeSize(30)
                                    .volumeType("gp3")
                                    .deleteOnTermination("true")
                                    .build())
                            .build()
            ));
        }

        return new LaunchTemplate(this, "launch-template", builder.build());
    }

    private AutoscalingGroup createAutoScalingGroup(final List<String> subnetIds, final String targetGroupArn,
                                                    final Map<String, String> tags) {

        List<AutoscalingGroupTag> asgTags = tags.entrySet().stream()
                .map(entry -> AutoscalingGroupTag.builder()
                        .key(entry.getKey())
                        .value(entry.getValue())
                        .propagateAtLaunch(true)
                        .build())
                .toList();

        return AutoscalingGroup.Builder.create(this, "asg")
                .name(id + "-asg")
                .minSize(2)
                .maxSize(6)
                .desiredCapacity(2)
                .healthCheckType("ELB")
                .healthCheckGracePeriod(300)
                .vpcZoneIdentifier(subnetIds)
                .targetGroupArns(List.of(targetGroupArn))
                .launchTemplate(AutoscalingGroupLaunchTemplate.builder()
                        .id(launchTemplate.getId())
                        .version("$Latest")
                        .build())
                .tag(asgTags)
                .build();
    }

    private void createMigrationInstances(final SecurityConfig config, final List<String> subnetIds,
                                          final String securityGroupId, final String instanceProfileArn,
                                          final String kmsKeyId, final Map<String, String> tags) {

        // Create instances for immediate migration (blue-green approach)
        for (int i = 0; i < Math.min(2, subnetIds.size()); i++) {
            Instance instance = Instance.Builder.create(this, "migration-instance-" + i)
                    .ami(config.amiId())
                    .instanceType(config.instanceType())
                    .subnetId(subnetIds.get(i))
                    .vpcSecurityGroupIds(List.of(securityGroupId))
                    .iamInstanceProfile(instanceProfileArn.split("/")[1]) // Extract name from ARN
                    .monitoring(true)
                    .rootBlockDevice(InstanceRootBlockDevice.builder()
                            .encrypted(config.enableEncryption())
                            .kmsKeyId(config.enableEncryption() ? kmsKeyId : null)
                            .volumeSize(30)
                            .volumeType("gp3")
                            .build())
                    .tags(mergeTags(tags, Map.of(
                            "Name", "migration-instance-" + i,
                            "Type", "Migration"
                    )))
                    .build();

            instances.add(instance);
        }
    }

    private Map<String, String> mergeTags(final Map<String, String> baseTags, final Map<String, String> additionalTags) {
        Map<String, String> merged = new HashMap<>(baseTags);
        merged.putAll(additionalTags);
        return merged;
    }

    // Getters
    public List<String> getInstanceIds() {
        return instances.stream().map(Instance::getId).toList();
    }

    public String getAutoScalingGroupName() {
        return autoScalingGroup.getName();
    }
}
