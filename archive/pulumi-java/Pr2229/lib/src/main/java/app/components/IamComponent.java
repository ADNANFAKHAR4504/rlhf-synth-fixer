package app.components;

import com.pulumi.aws.iam.Group;
import com.pulumi.aws.iam.GroupArgs;
import com.pulumi.aws.iam.GroupMembership;
import com.pulumi.aws.iam.GroupMembershipArgs;
import com.pulumi.aws.iam.GroupPolicyAttachment;
import com.pulumi.aws.iam.GroupPolicyAttachmentArgs;
import com.pulumi.aws.iam.InstanceProfile;
import com.pulumi.aws.iam.InstanceProfileArgs;
import com.pulumi.aws.iam.Policy;
import com.pulumi.aws.iam.PolicyArgs;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.RolePolicyAttachment;
import com.pulumi.aws.iam.RolePolicyAttachmentArgs;
import com.pulumi.aws.iam.User;
import com.pulumi.aws.iam.UserArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

import java.util.List;
import java.util.Map;

public class IamComponent extends ComponentResource {
    private final Role ec2Role;
    private final Policy ec2Policy;
    private final InstanceProfile ec2InstanceProfile;
    private final User adminUser;
    private final Policy adminPolicy;
    private final Policy mfaEnforcementPolicy;
    private final Group adminGroup;

    public IamComponent(final String name, final String region) {
        this(name, region, null);
    }

    public IamComponent(final String name, final String region, final ComponentResourceOptions opts) {
        super("custom:infrastructure:IamComponent", name, opts);

        // Create EC2 service role with minimal permissions
        this.ec2Role = createEc2Role(name);
        this.ec2Policy = createEc2Policy(name);
        this.ec2InstanceProfile = createInstanceProfile(name);

        // Create admin user with MFA enforcement
        this.adminUser = createAdminUser(name);
        this.adminPolicy = createAdminPolicy(name);
        this.mfaEnforcementPolicy = createMfaEnforcementPolicy(name);
        this.adminGroup = createAdminGroup(name);

        // Attach policies
        attachPolicies(name);
    }

    private Role createEc2Role(final String name) {
        return new Role(name + "-ec2-role", RoleArgs.builder()
                .name(name + "-ec2-role")
                .assumeRolePolicy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "ec2.amazonaws.com"
                            },
                            "Condition": {
                                "StringEquals": {
                                    "aws:RequestedRegion": ["us-west-2", "us-east-1"]
                                }
                            }
                        }
                    ]
                }
                """)
                .tags(getTags(name + "-ec2-role", "IAMRole", Map.of("Purpose", "EC2Instance")))
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private Policy createEc2Policy(final String name) {
        return new Policy(name + "-ec2-policy", PolicyArgs.builder()
                .name(name + "-ec2-policy")
                .description("Minimal permissions for EC2 instances with logging and monitoring")
                .policy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                                "logs:DescribeLogStreams",
                                "logs:DescribeLogGroups"
                            ],
                            "Resource": "arn:aws:logs:*:*:*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "ssm:UpdateInstanceInformation",
                                "ssm:SendCommand",
                                "ssm:ListCommandInvocations",
                                "ssm:DescribeInstanceInformation",
                                "ssm:GetParameter",
                                "ssm:GetParameters"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "cloudwatch:PutMetricData",
                                "cloudwatch:GetMetricStatistics",
                                "cloudwatch:ListMetrics"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "ec2:DescribeVolumes",
                                "ec2:DescribeInstances",
                                "ec2:DescribeTags"
                            ],
                            "Resource": "*"
                        }
                    ]
                }
                """)
                .tags(getTags(name + "-ec2-policy", "IAMPolicy", Map.of("Purpose", "EC2MinimalAccess")))
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private InstanceProfile createInstanceProfile(final String name) {
        return new InstanceProfile(name + "-ec2-instance-profile",
                InstanceProfileArgs.builder()
                        .name(name + "-ec2-instance-profile")
                        .role(ec2Role.name())
                        .tags(getTags(name + "-ec2-instance-profile", "IAMInstanceProfile", Map.of()))
                        .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private User createAdminUser(final String name) {
        return new User(name + "-admin-user", UserArgs.builder()
                .name(name + "-admin-user")
                .path("/administrators/")
                .forceDestroy(false)
                .tags(getTags(name + "-admin-user", "IAMUser", Map.of(
                        "Role", "Administrator",
                        "MFARequired", "true",
                        "AccessLevel", "Full"
                )))
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private Policy createMfaEnforcementPolicy(final String name) {
        return new Policy(name + "-mfa-enforcement", PolicyArgs.builder()
                .name(name + "-mfa-enforcement-policy")
                .description("Enforce MFA for all actions except MFA management")
                .policy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "AllowViewAccountInfo",
                            "Effect": "Allow",
                            "Action": [
                                "iam:GetAccountPasswordPolicy",
                                "iam:ListVirtualMFADevices",
                                "iam:GetUser",
                                "iam:ListMFADevices"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Sid": "AllowManageOwnPasswords",
                            "Effect": "Allow",
                            "Action": [
                                "iam:ChangePassword",
                                "iam:GetUser"
                            ],
                            "Resource": "arn:aws:iam::*:user/${aws:username}"
                        },
                        {
                            "Sid": "AllowManageOwnMFA",
                            "Effect": "Allow",
                            "Action": [
                                "iam:CreateVirtualMFADevice",
                                "iam:DeleteVirtualMFADevice",
                                "iam:EnableMFADevice",
                                "iam:ResyncMFADevice"
                            ],
                            "Resource": [
                                "arn:aws:iam::*:mfa/${aws:username}",
                                "arn:aws:iam::*:user/${aws:username}"
                            ]
                        },
                        {
                            "Sid": "DenyAllExceptUnlessSignedInWithMFA",
                            "Effect": "Deny",
                            "NotAction": [
                                "iam:CreateVirtualMFADevice",
                                "iam:EnableMFADevice",
                                "iam:GetUser",
                                "iam:ListMFADevices",
                                "iam:ListVirtualMFADevices",
                                "iam:ResyncMFADevice",
                                "sts:GetSessionToken"
                            ],
                            "Resource": "*",
                            "Condition": {
                                "BoolIfExists": {
                                    "aws:MultiFactorAuthPresent": "false"
                                }
                            }
                        }
                    ]
                }
                """)
                .tags(getTags(name + "-mfa-enforcement", "IAMPolicy", Map.of("Purpose", "MFAEnforcement")))
                .build(),  CustomResourceOptions.builder().parent(this).build());
    }

    private Policy createAdminPolicy(final String name) {
        return new Policy(name + "-admin-policy", PolicyArgs.builder()
                .name(name + "-admin-policy")
                .description("Administrative access with regional restrictions and MFA requirements")
                .policy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": "*",
                            "Resource": "*",
                            "Condition": {
                                "Bool": {
                                    "aws:MultiFactorAuthPresent": "true"
                                },
                                "NumericLessThan": {
                                    "aws:MultiFactorAuthAge": "3600"
                                },
                                "StringEquals": {
                                    "aws:RequestedRegion": ["us-west-2", "us-east-1"]
                                }
                            }
                        },
                        {
                            "Effect": "Deny",
                            "Action": [
                                "account:CloseAccount",
                                "account:DeleteAlternateContact",
                                "organizations:LeaveOrganization"
                            ],
                            "Resource": "*"
                        }
                    ]
                }
                """)
                .tags(getTags(name + "-admin-policy", "IAMPolicy", Map.of("Purpose", "AdministrativeAccess")))
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private Group createAdminGroup(final String name) {
        return new Group(name + "-admin-group", GroupArgs.builder()
                .name(name + "-administrators")
                .path("/administrators/")
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private void attachPolicies(final String name) {
        // Attach EC2 policy to EC2 role
        new RolePolicyAttachment(name + "-ec2-policy-attachment", RolePolicyAttachmentArgs.builder()
                .role(ec2Role.name())
                .policyArn(ec2Policy.arn())
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Attach AWS managed policy for Systems Manager to EC2 role
        new RolePolicyAttachment(name + "-ec2-ssm-policy-attachment", RolePolicyAttachmentArgs.builder()
                .role(ec2Role.name())
                .policyArn("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore")
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Attach AWS managed policy for CloudWatch agent to EC2 role
        new RolePolicyAttachment(name + "-ec2-cloudwatch-policy-attachment", RolePolicyAttachmentArgs.builder()
                .role(ec2Role.name())
                .policyArn("arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy")
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Attach MFA enforcement policy to admin group
        new GroupPolicyAttachment(name + "-mfa-policy-attachment", GroupPolicyAttachmentArgs.builder()
                .group(adminGroup.name())
                .policyArn(mfaEnforcementPolicy.arn())
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Attach admin policy to admin group
        new GroupPolicyAttachment(name + "-admin-policy-attachment", GroupPolicyAttachmentArgs.builder()
                .group(adminGroup.name())
                .policyArn(adminPolicy.arn())
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Add admin user to admin group
        new GroupMembership(name + "-admin-group-membership", GroupMembershipArgs.builder()
                .name(name + "-admin-group-membership")
                .users(adminUser.name().applyValue(List::of))
                .group(adminGroup.name())
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private Map<String, String> getTags(final String name, final String resourceType, final Map<String, String> additional) {
        return buildResourceTags(name, resourceType, additional);
    }

    public static Map<String, String> buildResourceTags(final String name, 
                                                        final String resourceType, 
                                                        final Map<String, String> additional) {
        var baseTags = Map.of(
                "Name", name,
                "ResourceType", resourceType,
                "Environment", "production",
                "ManagedBy", "Pulumi",
                "Project", "SecureInfrastructure",
                "ComplianceRequired", "true"
        );

        if (additional.isEmpty()) {
            return baseTags;
        }

        var allTags = new java.util.HashMap<>(baseTags);
        allTags.putAll(additional);
        return allTags;
    }

    // Getters
    public Output<String> getEc2InstanceProfileName() {
        return ec2InstanceProfile.name();
    }
}