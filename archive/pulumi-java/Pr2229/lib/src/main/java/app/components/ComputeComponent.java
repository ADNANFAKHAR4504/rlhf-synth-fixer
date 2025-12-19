package app.components;

import com.pulumi.aws.ec2.Ec2Functions;
import com.pulumi.aws.ec2.Instance;
import com.pulumi.aws.ec2.InstanceArgs;
import com.pulumi.aws.ec2.KeyPair;
import com.pulumi.aws.ec2.KeyPairArgs;
import com.pulumi.aws.ec2.SecurityGroup;
import com.pulumi.aws.ec2.SecurityGroupArgs;
import com.pulumi.aws.ec2.SecurityGroupRule;
import com.pulumi.aws.ec2.SecurityGroupRuleArgs;
import com.pulumi.aws.ec2.inputs.GetAmiArgs;
import com.pulumi.aws.ec2.inputs.GetAmiFilterArgs;
import com.pulumi.aws.ec2.inputs.InstanceRootBlockDeviceArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupEgressArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupIngressArgs;
import com.pulumi.aws.ec2.outputs.GetAmiResult;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

import com.pulumi.tls.PrivateKey;
import com.pulumi.tls.PrivateKeyArgs;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ComputeComponent extends ComponentResource {
    private final SecurityGroup webSecurityGroup;
    private final SecurityGroup appSecurityGroup;
    private final SecurityGroup databaseSecurityGroup;
    private final List<Instance> instances;
    private final KeyPair keyPair;

    public ComputeComponent(final String name, final NetworkingComponent networking,
                            final IamComponent iam, final String region) {
        this(name, networking, iam, region, null);
    }

    public ComputeComponent(final String name, final NetworkingComponent networking,
                            final IamComponent iam, final String region, final ComponentResourceOptions opts) {
        super("custom:infrastructure:ComputeComponent", name, opts);

        var genKey = new PrivateKey("compute-private-key", PrivateKeyArgs.builder()
                .algorithm("RSA")
                .rsaBits(4096)
                .build());

        // Create key pair for secure SSH access
        this.keyPair = new KeyPair(name + "-key-pair", KeyPairArgs.builder()
                .keyName(name + "-secure-key")
                .publicKey(genKey.publicKeyOpenssh())
                .tags(getTags(name + "-key-pair", "KeyPair", Map.of()))
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Create layered security groups
        this.webSecurityGroup = createWebSecurityGroup(name, networking);
        this.appSecurityGroup = createAppSecurityGroup(name, networking);
        this.databaseSecurityGroup = createDatabaseSecurityGroup(name, networking);

        // Create instances with security best practices
        this.instances = createInstances(name, networking, iam, region);
    }

    private SecurityGroup createWebSecurityGroup(final String name, final NetworkingComponent networking) {
        return new SecurityGroup(name + "-web-sg", SecurityGroupArgs.builder()
                .name(name + "-web-tier-sg")
                .description("Security group for web tier with restrictive access")
                .vpcId(networking.getVpcId())
                .ingress(
                        // HTTPS only from internet
                        SecurityGroupIngressArgs.builder()
                                .protocol("tcp")
                                .fromPort(443)
                                .toPort(443)
                                .cidrBlocks("0.0.0.0/0")
                                .description("HTTPS from internet")
                                .build(),
                        // HTTP redirect to HTTPS
                        SecurityGroupIngressArgs.builder()
                                .protocol("tcp")
                                .fromPort(80)
                                .toPort(80)
                                .cidrBlocks("0.0.0.0/0")
                                .description("HTTP redirect to HTTPS")
                                .build(),
                        // SSH from specific admin IP ranges only
                        SecurityGroupIngressArgs.builder()
                                .protocol("tcp")
                                .fromPort(22)
                                .toPort(22)
                                .cidrBlocks("203.0.113.0/24") // Replace with your admin IP range
                                .description("SSH from admin network")
                                .build()
                )
                .egress(
                        // HTTPS outbound for updates and API calls
                        SecurityGroupEgressArgs.builder()
                                .protocol("tcp")
                                .fromPort(443)
                                .toPort(443)
                                .cidrBlocks("0.0.0.0/0")
                                .description("HTTPS outbound")
                                .build(),
                        // HTTP outbound for package updates
                        SecurityGroupEgressArgs.builder()
                                .protocol("tcp")
                                .fromPort(80)
                                .toPort(80)
                                .cidrBlocks("0.0.0.0/0")
                                .description("HTTP outbound for updates")
                                .build(),
                        // DNS outbound
                        SecurityGroupEgressArgs.builder()
                                .protocol("udp")
                                .fromPort(53)
                                .toPort(53)
                                .cidrBlocks("0.0.0.0/0")
                                .description("DNS outbound")
                                .build()
                )
                .tags(getTags(name + "-web-sg", "SecurityGroup", Map.of("Tier", "Web")))
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private SecurityGroup createAppSecurityGroup(final String name, final NetworkingComponent networking) {
        return new SecurityGroup(name + "-app-sg", SecurityGroupArgs.builder()
                .name(name + "-app-tier-sg")
                .description("Security group for application tier")
                .vpcId(networking.getVpcId())
                .tags(getTags(name + "-app-sg", "SecurityGroup", Map.of("Tier", "Application")))
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private SecurityGroup createDatabaseSecurityGroup(final String name, final NetworkingComponent networking) {
        return new SecurityGroup(name + "-db-sg", SecurityGroupArgs.builder()
                .name(name + "-database-tier-sg")
                .description("Security group for database tier")
                .vpcId(networking.getVpcId())
                .tags(getTags(name + "-db-sg", "SecurityGroup", Map.of("Tier", "Database")))
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private List<Instance> createInstances(final String name, final NetworkingComponent networking,
                                           final IamComponent iam, final String region) {
        var instanceList = new ArrayList<Instance>();

        // Get latest Amazon Linux 2023 AMI
        var amiLookup = Ec2Functions.getAmi(GetAmiArgs.builder()
                .mostRecent(true)
                .owners("amazon")
                .filters(GetAmiFilterArgs.builder()
                        .name("name")
                        .values("al2023-ami-*-x86_64")
                        .build())
                .build());

        // Create web server instances in public subnets
        networking.getPublicSubnetIds().applyValue(subnetIds -> {
            for (int i = 0; i < Math.min(2, subnetIds.size()); i++) {
                var webInstance = new Instance(name + "-web-" + (i + 1), InstanceArgs.builder()
                        .ami(amiLookup.applyValue(GetAmiResult::id))
                        .instanceType("t3.micro")
                        .subnetId(subnetIds.get(i))
                        .vpcSecurityGroupIds(webSecurityGroup.id().applyValue(List::of))
                        .iamInstanceProfile(iam.getEc2InstanceProfileName())
                        .keyName(keyPair.keyName())
                        .userData(createWebServerUserData())
                        .monitoring(true) // Enable detailed monitoring
                        .ebsOptimized(true)
                        .rootBlockDevice(InstanceRootBlockDeviceArgs.builder()
                                .volumeType("gp3")
                                .volumeSize(30)
                                .encrypted(true)
                                .deleteOnTermination(true)
                                .tags(getTags(name + "-web-" + (i + 1) + "-root", "EBSVolume", Map.of()))
                                .build())
                        .tags(getTags(name + "-web-" + (i + 1), "Instance", Map.of(
                                "Tier", "Web",
                                "BackupSchedule", "daily",
                                "PatchGroup", "web-servers"
                        )))
                        .build(), CustomResourceOptions.builder().parent(this).build());
                instanceList.add(webInstance);
            }
            return null;
        });

        // Create application server instances in private subnets
        networking.getPrivateSubnetIds().applyValue(subnetIds -> {
            for (int i = 0; i < Math.min(2, subnetIds.size()); i++) {
                var appInstance = new Instance(name + "-app-" + (i + 1), InstanceArgs.builder()
                        .ami(amiLookup.applyValue(GetAmiResult::id))
                        .instanceType("t3.small")
                        .subnetId(subnetIds.get(i))
                        .vpcSecurityGroupIds(webSecurityGroup.id().applyValue(List::of))
                        .iamInstanceProfile(iam.getEc2InstanceProfileName())
                        .keyName(keyPair.keyName())
                        .userData(createAppServerUserData())
                        .monitoring(true)
                        .ebsOptimized(true)
                        .rootBlockDevice(InstanceRootBlockDeviceArgs.builder()
                                .volumeType("gp3")
                                .volumeSize(30)
                                .encrypted(true)
                                .deleteOnTermination(true)
                                .tags(getTags(name + "-app-" + (i + 1) + "-root", "EBSVolume", Map.of()))
                                .build())
                        .tags(getTags(name + "-app-" + (i + 1), "Instance", Map.of(
                                "Tier", "Application",
                                "BackupSchedule", "daily",
                                "PatchGroup", "app-servers"
                        )))
                        .build(), CustomResourceOptions.builder().parent(this).build());
                instanceList.add(appInstance);
            }
            return null;
        });

        // Add security group rules after instances are created
        addSecurityGroupRules();

        return instanceList;
    }

    private void addSecurityGroupRules() {
        // Allow app tier to communicate with web tier
        new SecurityGroupRule("web-to-app", SecurityGroupRuleArgs.builder()
                .type("ingress")
                .fromPort(8080)
                .toPort(8080)
                .protocol("tcp")
                .sourceSecurityGroupId(webSecurityGroup.id())
                .securityGroupId(appSecurityGroup.id())
                .description("Application port from web tier")
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Allow SSH from web tier to app tier
        new SecurityGroupRule("web-to-app-ssh", SecurityGroupRuleArgs.builder()
                .type("ingress")
                .fromPort(22)
                .toPort(22)
                .protocol("tcp")
                .sourceSecurityGroupId(webSecurityGroup.id())
                .securityGroupId(appSecurityGroup.id())
                .description("SSH from web tier")
                .build(), CustomResourceOptions.builder().parent(this).build());

        // App tier outbound rules
        new SecurityGroupRule("app-https-outbound", SecurityGroupRuleArgs.builder()
                .type("egress")
                .fromPort(443)
                .toPort(443)
                .protocol("tcp")
                .cidrBlocks("0.0.0.0/0")
                .securityGroupId(appSecurityGroup.id())
                .description("HTTPS outbound")
                .build(), CustomResourceOptions.builder().parent(this).build());

        new SecurityGroupRule("app-http-outbound", SecurityGroupRuleArgs.builder()
                .type("egress")
                .fromPort(80)
                .toPort(80)
                .protocol("tcp")
                .cidrBlocks("0.0.0.0/0")
                .securityGroupId(appSecurityGroup.id())
                .description("HTTP outbound for updates")
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Database tier rules (for future RDS instances)
        new SecurityGroupRule("app-to-db", SecurityGroupRuleArgs.builder()
                .type("ingress")
                .fromPort(5432)
                .toPort(5432)
                .protocol("tcp")
                .sourceSecurityGroupId(appSecurityGroup.id())
                .securityGroupId(databaseSecurityGroup.id())
                .description("PostgreSQL from app tier")
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    public static String createWebServerUserData() {
        return """
            #!/bin/bash
            yum update -y
            
            # Install CloudWatch agent
            yum install -y amazon-cloudwatch-agent
            
            # Install and configure nginx
            yum install -y nginx
            systemctl enable nginx
            systemctl start nginx
            
            # Configure SSL/TLS (placeholder - use proper certificates in production)
            mkdir -p /etc/nginx/ssl
            
            # Install fail2ban for SSH protection
            yum install -y fail2ban
            systemctl enable fail2ban
            systemctl start fail2ban
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
            {
                "metrics": {
                    "namespace": "SecureInfrastructure/WebTier",
                    "metrics_collected": {
                        "cpu": {
                            "measurement": ["cpu_usage_idle", "cpu_usage_iowait"],
                            "metrics_collection_interval": 60
                        },
                        "disk": {
                            "measurement": ["used_percent"],
                            "metrics_collection_interval": 60,
                            "resources": ["*"]
                        },
                        "mem": {
                            "measurement": ["mem_used_percent"],
                            "metrics_collection_interval": 60
                        }
                    }
                }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
                -a fetch-config -m ec2 \
                -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
            
            # Enable automatic security updates
            yum install -y yum-cron
            systemctl enable yum-cron
            systemctl start yum-cron
            """;
    }

    public static String createAppServerUserData() {
        return """
            #!/bin/bash
            yum update -y
            
            # Install CloudWatch agent
            yum install -y amazon-cloudwatch-agent
            
            # Install Java 17 for application runtime
            yum install -y java-17-amazon-corretto-devel
            
            # Install application dependencies
            yum install -y git
            
            # Configure CloudWatch agent for app tier
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
            {
                "metrics": {
                    "namespace": "SecureInfrastructure/AppTier",
                    "metrics_collected": {
                        "cpu": {
                            "measurement": ["cpu_usage_idle", "cpu_usage_iowait"],
                            "metrics_collection_interval": 60
                        },
                        "disk": {
                            "measurement": ["used_percent"],
                            "metrics_collection_interval": 60,
                            "resources": ["*"]
                        },
                        "mem": {
                            "measurement": ["mem_used_percent"],
                            "metrics_collection_interval": 60
                        }
                    }
                },
                "logs": {
                    "logs_collected": {
                        "files": {
                            "collect_list": [
                                {
                                    "file_path": "/var/log/application.log",
                                    "log_group_name": "secure-infrastructure-app-logs",
                                    "log_stream_name": "{instance_id}"
                                }
                            ]
                        }
                    }
                }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
                -a fetch-config -m ec2 \
                -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
            
            # Enable automatic security updates
            yum install -y yum-cron
            systemctl enable yum-cron
            systemctl start yum-cron
            """;
    }

    public static Map<String, String> getTags(final String name, final String resourceType, final Map<String, String> additional) {
        var baseTags = Map.of(
                "Name", name,
                "ResourceType", resourceType,
                "Environment", "production",
                "ManagedBy", "Pulumi",
                "Project", "SecureInfrastructure",
                "MonitoringEnabled", "true"
        );

        if (additional.isEmpty()) {
            return baseTags;
        }

        var allTags = new java.util.HashMap<>(baseTags);
        allTags.putAll(additional);
        return allTags;
    }

    // Getters
    public Output<List<String>> getInstanceIds() {
        return Output.all(instances.stream().map(Instance::id).toList())
                .applyValue(ArrayList::new);
    }
}
