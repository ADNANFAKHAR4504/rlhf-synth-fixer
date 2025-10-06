package app.constructs;

import app.config.ComputeConfig;
import app.config.SecurityConfig;
import com.hashicorp.cdktf.providers.aws.alb.Alb;
import com.hashicorp.cdktf.providers.aws.alb_listener.AlbListener;
import com.hashicorp.cdktf.providers.aws.alb_listener.AlbListenerDefaultAction;
import com.hashicorp.cdktf.providers.aws.alb_listener.AlbListenerDefaultActionRedirect;
import com.hashicorp.cdktf.providers.aws.alb_target_group.AlbTargetGroup;
import com.hashicorp.cdktf.providers.aws.alb_target_group.AlbTargetGroupHealthCheck;
import com.hashicorp.cdktf.providers.aws.autoscaling_group.AutoscalingGroup;
import com.hashicorp.cdktf.providers.aws.autoscaling_group.AutoscalingGroupLaunchTemplate;
import com.hashicorp.cdktf.providers.aws.autoscaling_group.AutoscalingGroupTag;
import com.hashicorp.cdktf.providers.aws.elastic_beanstalk_application.ElasticBeanstalkApplication;
import com.hashicorp.cdktf.providers.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironment;
import com.hashicorp.cdktf.providers.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironmentSetting;
import com.hashicorp.cdktf.providers.aws.iam_instance_profile.IamInstanceProfileConfig;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import com.hashicorp.cdktf.providers.aws.iam_instance_profile.IamInstanceProfile;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.IamRolePolicyAttachment;
import com.hashicorp.cdktf.providers.aws.launch_template.LaunchTemplate;
import com.hashicorp.cdktf.providers.aws.launch_template.LaunchTemplateConfig;
import com.hashicorp.cdktf.providers.aws.launch_template.LaunchTemplateIamInstanceProfile;
import com.hashicorp.cdktf.providers.aws.launch_template.LaunchTemplateMonitoring;
import com.hashicorp.cdktf.providers.aws.launch_template.LaunchTemplateTagSpecifications;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroup;
import com.hashicorp.cdktf.providers.aws.security_group_rule.SecurityGroupRule;
import software.constructs.Construct;

import java.util.Base64;
import java.util.List;
import java.util.Map;

public class ComputeConstruct extends Construct {

    private final Alb alb;

    private final AutoscalingGroup asg;

    private final SecurityGroup albSecurityGroup;

    private final SecurityGroup ec2SecurityGroup;

    private final ElasticBeanstalkApplication ebApp;

    private final ElasticBeanstalkEnvironment ebEnv;

    private final IamInstanceProfile instanceProfile;

    public ComputeConstruct(final Construct scope, final String id, final ComputeConfig config,
                            final SecurityConfig securityConfig, final String vpcId, final List<String> publicSubnetIds,
                            final List<String> privateSubnetIds) {
        super(scope, id);

        // Create security groups
        this.albSecurityGroup = createAlbSecurityGroup(vpcId);
        this.ec2SecurityGroup = createEc2SecurityGroup(vpcId, securityConfig);

        // Create IAM role for EC2 instances
        IamRole ec2Role = createEc2Role();

        this.instanceProfile = new IamInstanceProfile(this, "ec2-instance-profile",
                IamInstanceProfileConfig.builder()
                        .name("ec2-instance-profile")
                        .role(ec2Role.getName())
                        .build());

        // Create ALB
        this.alb = Alb.Builder.create(this, "alb")
                .name("web-app-alb")
                .internal(false)
                .loadBalancerType("application")
                .securityGroups(List.of(albSecurityGroup.getId()))
                .subnets(publicSubnetIds)
                .enableHttp2(true)
                .enableDeletionProtection(true)
                .tags(Map.of("Name", "Web App ALB"))
                .build();

        // Create Target Group
        AlbTargetGroup targetGroup = AlbTargetGroup.Builder.create(this, "target-group")
                .name("web-app-tg")
                .port(80)
                .protocol("HTTP")
                .vpcId(vpcId)
                .targetType("instance")
                .healthCheck(AlbTargetGroupHealthCheck.builder()
                        .enabled(true)
                        .path("/health")
                        .interval(30)
                        .timeout(5)
                        .healthyThreshold(2)
                        .unhealthyThreshold(2)
                        .build())
                .deregistrationDelay("30")
                .build();

        // Create HTTP Listener (redirects to HTTPS)
        AlbListener.Builder.create(this, "alb-http-listener")
                .loadBalancerArn(alb.getArn())
                .port(80)
                .protocol("HTTP")
                .defaultAction(List.of(AlbListenerDefaultAction.builder()
                        .type("redirect")
                        .redirect(AlbListenerDefaultActionRedirect.builder()
                                .port("443")
                                .protocol("HTTPS")
                                .statusCode("HTTP_301")
                                .build())
                        .build()))
                .build();

        // Create HTTPS Listener
        AlbListener.Builder.create(this, "alb-https-listener")
                .loadBalancerArn(alb.getArn())
                .port(443)
                .protocol("HTTPS")
                .sslPolicy("ELBSecurityPolicy-TLS-1-2-2017-01")
                .certificateArn(securityConfig.sslCertificateArn())
                .defaultAction(List.of(AlbListenerDefaultAction.builder()
                        .type("forward")
                        .targetGroupArn(targetGroup.getArn())
                        .build()))
                .build();

        // Create Launch Template
        LaunchTemplate launchTemplate = new LaunchTemplate(this, "launch-template",
                LaunchTemplateConfig.builder()
                        .name("web-app-lt")
                        .imageId(config.amiId())
                        .instanceType(config.instanceType())
                        .vpcSecurityGroupIds(List.of(ec2SecurityGroup.getId()))
                        .iamInstanceProfile(LaunchTemplateIamInstanceProfile.builder()
                                .arn(instanceProfile.getArn())
                                .build())
                        .monitoring(LaunchTemplateMonitoring.builder()
                                .enabled(true)
                                .build())
                        .userData(getEc2UserData())
                        .tagSpecifications(List.of(
                                LaunchTemplateTagSpecifications.builder()
                                        .resourceType("instance")
                                        .tags(Map.of(
                                                "Name", "Web App Instance",
                                                "Environment", "Production"
                                        ))
                                        .build()
                        ))
                        .build());

        // Create Auto Scaling Group
        this.asg = AutoscalingGroup.Builder.create(this, "asg")
                .name("web-app-asg")
                .minSize(config.minSize())
                .maxSize(config.maxSize())
                .desiredCapacity(config.desiredCapacity())
                .vpcZoneIdentifier(privateSubnetIds)
                .targetGroupArns(List.of(targetGroup.getArn()))
                .healthCheckType("ELB")
                .healthCheckGracePeriod(config.healthCheckGracePeriod())
                .launchTemplate(AutoscalingGroupLaunchTemplate.builder()
                        .id(launchTemplate.getId())
                        .version("$Latest")
                        .build())
                .enabledMetrics(List.of("GroupMinSize", "GroupMaxSize", "GroupDesiredCapacity",
                        "GroupInServiceInstances", "GroupTotalInstances"))
                .tag(List.of(
                        AutoscalingGroupTag.builder()
                                .key("Name")
                                .value("Web App ASG Instance")
                                .propagateAtLaunch(true)
                                .build()
                ))
                .build();

        // Setup Elastic Beanstalk
        this.ebApp = setupElasticBeanstalkApplication(config);

        // Setup Elastic Beanstalk Environment
        this.ebEnv = setupElasticBeanstalkEnvironment(config, vpcId, privateSubnetIds);
    }

    private SecurityGroup createAlbSecurityGroup(final String vpcId) {
        SecurityGroup sg = SecurityGroup.Builder.create(this, "alb-sg")
                .name("alb-security-group")
                .description("Security group for ALB")
                .vpcId(vpcId)
                .tags(Map.of("Name", "ALB Security Group"))
                .build();

        // Allow HTTP
        SecurityGroupRule.Builder.create(this, "alb-http-rule")
                .type("ingress")
                .fromPort(80)
                .toPort(80)
                .protocol("tcp")
                .cidrBlocks(List.of("0.0.0.0/0"))
                .securityGroupId(sg.getId())
                .build();

        // Allow HTTPS
        SecurityGroupRule.Builder.create(this, "alb-https-rule")
                .type("ingress")
                .fromPort(443)
                .toPort(443)
                .protocol("tcp")
                .cidrBlocks(List.of("0.0.0.0/0"))
                .securityGroupId(sg.getId())
                .build();

        return sg;
    }

    private SecurityGroup createEc2SecurityGroup(final String vpcId, final SecurityConfig securityConfig) {
        SecurityGroup sg = SecurityGroup.Builder.create(this, "ec2-sg")
                .name("ec2-security-group")
                .description("Security group for EC2 instances")
                .vpcId(vpcId)
                .tags(Map.of("Name", "EC2 Security Group"))
                .build();

        // Allow traffic from ALB
        SecurityGroupRule.Builder.create(this, "ec2-alb-rule")
                .type("ingress")
                .fromPort(80)
                .toPort(80)
                .protocol("tcp")
                .sourceSecurityGroupId(albSecurityGroup.getId())
                .securityGroupId(sg.getId())
                .build();

        // Allow SSH from specific IP ranges
        for (String ipRange : securityConfig.allowedSshIpRanges()) {
            SecurityGroupRule.Builder.create(this, "ec2-ssh-rule-" + ipRange
                            .replace(".", "-").replace("/", "-"))
                    .type("ingress")
                    .fromPort(22)
                    .toPort(22)
                    .protocol("tcp")
                    .cidrBlocks(List.of(ipRange))
                    .securityGroupId(sg.getId())
                    .build();
        }

        // Allow all outbound traffic
        SecurityGroupRule.Builder.create(this, "ec2-egress-rule")
                .type("egress")
                .fromPort(0)
                .toPort(65535)
                .protocol("-1")
                .cidrBlocks(List.of("0.0.0.0/0"))
                .securityGroupId(sg.getId())
                .build();

        return sg;
    }

    private IamRole createEc2Role() {
        String assumeRolePolicy = """
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "ec2.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                }
                """;

        IamRole role = IamRole.Builder.create(this, "ec2-role")
                .name("ec2-instance-role")
                .assumeRolePolicy(assumeRolePolicy)
                .build();

        // Attach necessary managed policies
        IamRolePolicyAttachment.Builder.create(this, "ssm-policy")
                .role(role.getName())
                .policyArn("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore")
                .build();

        IamRolePolicyAttachment.Builder.create(this, "cloudwatch-policy")
                .role(role.getName())
                .policyArn("arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy")
                .build();

        return role;
    }

    private String getEc2UserData() {
        String script = """
                #!/bin/bash
                yum update -y
                yum install -y amazon-cloudwatch-agent

                # Install web server
                yum install -y nginx
                systemctl start nginx
                systemctl enable nginx

                # Create health check endpoint
                echo "OK" > /usr/share/nginx/html/health
                """;
        return Base64.getEncoder().encodeToString(script.getBytes());
    }

    private ElasticBeanstalkApplication setupElasticBeanstalkApplication(final ComputeConfig config) {
        return ElasticBeanstalkApplication.Builder.create(this, "eb-app")
                .name(config.applicationName())
                .description("Web application deployed via Elastic Beanstalk")
                .build();
    }

    private ElasticBeanstalkEnvironment setupElasticBeanstalkEnvironment(final ComputeConfig config, final String vpcId,
                                                                         final List<String> subnetIds) {
        List<ElasticBeanstalkEnvironmentSetting> settings = List.of(
                // VPC settings
                ElasticBeanstalkEnvironmentSetting.builder()
                        .namespace("aws:ec2:vpc")
                        .name("VPCId")
                        .value(vpcId)
                        .build(),
                ElasticBeanstalkEnvironmentSetting.builder()
                        .namespace("aws:ec2:vpc")
                        .name("Subnets")
                        .value(String.join(",", subnetIds))
                        .build(),
                // IAM Instance Profile
                ElasticBeanstalkEnvironmentSetting.builder()
                        .namespace("aws:autoscaling:launchconfiguration")
                        .name("IamInstanceProfile")
                        .value(instanceProfile.getName())
                        .build(),
                // Instance type settings
                ElasticBeanstalkEnvironmentSetting.builder()
                        .namespace("aws:autoscaling:launchconfiguration")
                        .name("InstanceType")
                        .value(config.instanceType())
                        .build(),
                // Auto Scaling settings
                ElasticBeanstalkEnvironmentSetting.builder()
                        .namespace("aws:autoscaling:asg")
                        .name("MinSize")
                        .value(String.valueOf(config.minSize()))
                        .build(),
                ElasticBeanstalkEnvironmentSetting.builder()
                        .namespace("aws:autoscaling:asg")
                        .name("MaxSize")
                        .value(String.valueOf(config.maxSize()))
                        .build()
        );

        return ElasticBeanstalkEnvironment.Builder.create(this, "eb-env")
                .name(config.environmentName())
                .application(ebApp.getName())
                .solutionStackName("64bit Amazon Linux 2023 v4.7.2 running Python 3.11")
                .tier("WebServer")
                .setting(settings)
                .build();
    }

    // Getters
    public Alb getAlb() {
        return alb;
    }

    public AutoscalingGroup getAsg() {
        return asg;
    }

    public SecurityGroup getAlbSecurityGroup() {
        return albSecurityGroup;
    }

    public SecurityGroup getEc2SecurityGroup() {
        return ec2SecurityGroup;
    }

    public ElasticBeanstalkApplication getEbApp() {
        return ebApp;
    }

    public ElasticBeanstalkEnvironment getEbEnv() {
        return ebEnv;
    }
}
