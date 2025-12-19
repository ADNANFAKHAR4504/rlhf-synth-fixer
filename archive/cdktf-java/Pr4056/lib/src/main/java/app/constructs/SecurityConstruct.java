package app.constructs;

import app.config.SecurityConfig;
import com.hashicorp.cdktf.providers.aws.iam_instance_profile.IamInstanceProfile;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.IamRolePolicyAttachment;
import com.hashicorp.cdktf.providers.aws.data_aws_caller_identity.DataAwsCallerIdentity;
import com.hashicorp.cdktf.providers.aws.kms_alias.KmsAlias;
import com.hashicorp.cdktf.providers.aws.kms_alias.KmsAliasConfig;
import com.hashicorp.cdktf.providers.aws.kms_key.KmsKey;
import com.hashicorp.cdktf.providers.aws.kms_key.KmsKeyConfig;
import com.hashicorp.cdktf.providers.aws.security_group.SecurityGroup;
import com.hashicorp.cdktf.providers.aws.security_group_rule.SecurityGroupRule;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class SecurityConstruct extends BaseConstruct {

    private final SecurityGroup instanceSecurityGroup;

    private final SecurityGroup albSecurityGroup;

    private final IamRole instanceRole;

    private final IamInstanceProfile instanceProfile;

    private final KmsKey kmsKey;

    public SecurityConstruct(final Construct scope, final String id, final String vpcId) {
        super(scope, id);

        SecurityConfig securityConfig = getSecurityConfig();

        // Get current AWS account ID for KMS policy
        DataAwsCallerIdentity currentIdentity = new DataAwsCallerIdentity(this, "current");

        // Create KMS Key for encryption with proper policy for Auto Scaling
        String kmsPolicy = String.format("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "Enable IAM User Permissions",
                            "Effect": "Allow",
                            "Principal": {
                                "AWS": "arn:aws:iam::%s:root"
                            },
                            "Action": "kms:*",
                            "Resource": "*"
                        },
                        {
                            "Sid": "Allow Auto Scaling to use the key",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "autoscaling.amazonaws.com"
                            },
                            "Action": [
                                "kms:Decrypt",
                                "kms:Encrypt",
                                "kms:ReEncrypt*",
                                "kms:GenerateDataKey*",
                                "kms:CreateGrant",
                                "kms:DescribeKey"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Sid": "Allow EC2 service to use the key",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "ec2.amazonaws.com"
                            },
                            "Action": [
                                "kms:Decrypt",
                                "kms:Encrypt",
                                "kms:ReEncrypt*",
                                "kms:GenerateDataKey*",
                                "kms:CreateGrant",
                                "kms:DescribeKey"
                            ],
                            "Resource": "*"
                        }
                    ]
                }
                """, currentIdentity.getAccountId());

        this.kmsKey = new KmsKey(this, "kms-key", KmsKeyConfig.builder()
                .description("KMS key for VPC migration encryption")
                .enableKeyRotation(true)
                .policy(kmsPolicy)
                .tags(mergeTags(Map.of("Name", id + "-kms-key")))
                .build());

        new KmsAlias(this, "kms-alias", KmsAliasConfig.builder()
                .name(securityConfig.kmsKeyAlias())
                .targetKeyId(kmsKey.getId())
                .build());

        // Create instance security group
        this.instanceSecurityGroup = createInstanceSecurityGroup(securityConfig, vpcId);

        // Create ALB security group
        this.albSecurityGroup = createAlbSecurityGroup(securityConfig, vpcId);

        // Create IAM role for instances
        this.instanceRole = createInstanceRole(getTags());

        // Create instance profile
        this.instanceProfile = IamInstanceProfile.Builder.create(this, "instance-profile")
                .role(instanceRole.getName())
                .name(id + "-instance-profile")
                .tags(getTags())
                .build();

        // Attach necessary policies
        attachPolicies();
    }

    private SecurityGroup createInstanceSecurityGroup(final SecurityConfig config, final String vpcId) {
        SecurityGroup securityGroup = SecurityGroup.Builder.create(this, "instance-sg")
                .name("instance-security-group")
                .description("Security group for EC2 instances")
                .vpcId(vpcId)
                .tags(mergeTags(Map.of("Name", "instance-sg")))
                .build();

        // SSH access from specific IP
        if (!config.allowedSshIp().equals("0.0.0.0/32")) {
            SecurityGroupRule.Builder.create(this, "ssh-rule")
                    .type("ingress")
                    .fromPort(config.sshPort())
                    .toPort(config.sshPort())
                    .protocol("tcp")
                    .cidrBlocks(List.of(config.allowedSshIp()))
                    .securityGroupId(securityGroup.getId())
                    .description("SSH access from specific IP")
                    .build();
        }

        // Egress rule - allow all outbound
        SecurityGroupRule.Builder.create(this, "egress-rule")
                .type("egress")
                .fromPort(0)
                .toPort(65535)
                .protocol("-1")
                .cidrBlocks(List.of("0.0.0.0/0"))
                .securityGroupId(securityGroup.getId())
                .description("Allow all outbound traffic")
                .build();

        return securityGroup;
    }

    private SecurityGroup createAlbSecurityGroup(final SecurityConfig config, final String vpcId) {
        SecurityGroup securityGroup = SecurityGroup.Builder.create(this, "alb-sg")
                .name("alb-security-group")
                .description("Security group for Application Load Balancer")
                .vpcId(vpcId)
                .tags(mergeTags(Map.of("Name", "alb-sg")))
                .build();

        // HTTP ingress
        SecurityGroupRule.Builder.create(this, "alb-http-rule")
                .type("ingress")
                .fromPort(config.httpPort())
                .toPort(config.httpPort())
                .protocol("tcp")
                .cidrBlocks(List.of("0.0.0.0/0"))
                .securityGroupId(securityGroup.getId())
                .description("HTTP access")
                .build();

        // HTTPS ingress
        SecurityGroupRule.Builder.create(this, "alb-https-rule")
                .type("ingress")
                .fromPort(config.httpsPort())
                .toPort(config.httpsPort())
                .protocol("tcp")
                .cidrBlocks(List.of("0.0.0.0/0"))
                .securityGroupId(securityGroup.getId())
                .description("HTTPS access")
                .build();

        // Egress rule
        SecurityGroupRule.Builder.create(this, "alb-egress-rule")
                .type("egress")
                .fromPort(0)
                .toPort(65535)
                .protocol("-1")
                .cidrBlocks(List.of("0.0.0.0/0"))
                .securityGroupId(securityGroup.getId())
                .description("Allow all outbound traffic")
                .build();

        return securityGroup;
    }

    private IamRole createInstanceRole(final Map<String, String> tags) {
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

        return IamRole.Builder.create(this, "instance-role")
                .name("ec2-instance-role")
                .assumeRolePolicy(assumeRolePolicy)
                .tags(tags)
                .build();
    }

    private void attachPolicies() {
        // CloudWatch Logs policy
        IamRolePolicyAttachment.Builder.create(this, "cloudwatch-policy")
                .role(instanceRole.getName())
                .policyArn("arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy")
                .build();

        // SSM policy for management
        IamRolePolicyAttachment.Builder.create(this, "ssm-policy")
                .role(instanceRole.getName())
                .policyArn("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore")
                .build();
    }

    // Allow ALB to communicate with instances
    public void allowAlbToInstances(final int port) {
        SecurityGroupRule.Builder.create(this, "alb-to-instance-rule")
                .type("ingress")
                .fromPort(port)
                .toPort(port)
                .protocol("tcp")
                .sourceSecurityGroupId(albSecurityGroup.getId())
                .securityGroupId(instanceSecurityGroup.getId())
                .description("Allow ALB to communicate with instances")
                .build();
    }

    // Getters
    public String getInstanceSecurityGroupId() {
        return instanceSecurityGroup.getId();
    }

    public String getAlbSecurityGroupId() {
        return albSecurityGroup.getId();
    }

    public String getInstanceProfileArn() {
        return instanceProfile.getArn();
    }

    public String getInstanceProfileName() {
        return instanceProfile.getName();
    }

    public String getKmsKeyId() {
        return kmsKey.getId();
    }

    public String getKmsKeyArn() {
        return kmsKey.getArn();
    }
}
