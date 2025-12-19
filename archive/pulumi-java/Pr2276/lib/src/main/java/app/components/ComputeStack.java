package app.components;

import app.config.AppConfig;
import app.utils.TagUtils;
import com.pulumi.aws.ec2.Ec2Functions;
import com.pulumi.aws.ec2.inputs.GetAmiArgs;
import com.pulumi.aws.ec2.Instance;
import com.pulumi.aws.ec2.InstanceArgs;
import com.pulumi.aws.ec2.inputs.GetAmiFilterArgs;
import com.pulumi.aws.ec2.outputs.GetAmiResult;
import com.pulumi.core.Output;
import com.pulumi.deployment.InvokeOptions;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

import java.util.List;
import java.util.Objects;

public class ComputeStack extends ComponentResource {
    private final Output<String> instanceId;
    private final Output<String> publicIp;

    public ComputeStack(final String name,
                        final Output<String> subnetId,
                        final Output<String> securityGroupId,
                        final Output<String> instanceProfileName,
                        final AppConfig config,
                        final ComponentResourceOptions options) {
        super("custom:infrastructure:ComputeStack", name, options);

        // Get the latest Amazon Linux 2 AMI
        var ami = Ec2Functions.getAmi(GetAmiArgs.builder()
                .mostRecent(true)
                .owners("amazon")
                .filters(GetAmiFilterArgs.builder()
                        .name("name")
                        .values(config.getEc2AmiName())
                        .build()).build(),
                InvokeOptions.builder().provider(Objects.requireNonNull(options.getProvider().orElse(null)))
                        .build());

        // User data script to install and configure web server
        String userData = """
                #!/bin/bash
                yum update -y
                yum install -y httpd
                systemctl start httpd
                systemctl enable httpd
                echo "<h1>Welcome to Web Hosting Environment</h1>" > /var/www/html/index.html
                echo "<p>Environment: %s</p>" >> /var/www/html/index.html
                echo "<p>Instance deployed via Pulumi</p>" >> /var/www/html/index.html
                """.formatted(config.getDefaultEnvironment());

        // Create EC2 Instance
        var instance = new Instance(name + "web-server",
                InstanceArgs.builder()
                        .instanceType(config.getEc2InstanceType())
                        .ami(ami.applyValue(GetAmiResult::id))
                        .subnetId(subnetId)
                        .vpcSecurityGroupIds(securityGroupId.applyValue(List::of))
                        .iamInstanceProfile(instanceProfileName)
                        .userData(userData)
                        .associatePublicIpAddress(true)
                        .tags(TagUtils.getTagsWithName("Web-Server", config))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.instanceId = instance.id();
        this.publicIp = instance.publicIp();
    }

    public Output<String> getInstanceId() {
        return instanceId;
    }

    public Output<String> getPublicIp() {
        return publicIp;
    }
}
