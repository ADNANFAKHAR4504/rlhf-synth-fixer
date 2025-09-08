package app.components;

import app.config.AppConfig;
import app.utils.TagUtils;
import com.pulumi.aws.ec2.SecurityGroup;
import com.pulumi.aws.ec2.SecurityGroupArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupEgressArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupIngressArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

import java.util.List;

public class SecurityStack extends ComponentResource {
    private final Output<String> webSecurityGroupId;

    public SecurityStack(final String name, final Output<String> vpcId, final AppConfig config, final ComponentResourceOptions options) {
        super("custom:infrastructure:SecurityStack", name, options);

        // Create Security Group for Web Servers
        var webSecurityGroup = new SecurityGroup(name + "web-security-group",
                SecurityGroupArgs.builder()
                        .name("web-security-group")
                        .description("Security group for web servers")
                        .vpcId(vpcId)
                        .ingress(List.of(
                                SecurityGroupIngressArgs.builder()
                                        .description("HTTP")
                                        .fromPort(80)
                                        .toPort(80)
                                        .protocol("tcp")
                                        .cidrBlocks("0.0.0.0/0")
                                        .build(),
                                SecurityGroupIngressArgs.builder()
                                        .description("HTTPS")
                                        .fromPort(443)
                                        .toPort(443)
                                        .protocol("tcp")
                                        .cidrBlocks("0.0.0.0/0")
                                        .build(),
                                SecurityGroupIngressArgs.builder()
                                        .description("SSH")
                                        .fromPort(22)
                                        .toPort(22)
                                        .protocol("tcp")
                                        .cidrBlocks("0.0.0.0/0")
                                        .build()
                        ))
                        .egress(SecurityGroupEgressArgs.builder()
                                .fromPort(0)
                                .toPort(0)
                                .protocol("-1")
                                .cidrBlocks("0.0.0.0/0")
                                .build())
                        .tags(TagUtils.getTagsWithName("Web-Security-Group", config))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.webSecurityGroupId = webSecurityGroup.id();
    }

    public Output<String> getWebSecurityGroupId() {
        return webSecurityGroupId;
    }
}
