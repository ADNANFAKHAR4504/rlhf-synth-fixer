package app.components;

import com.pulumi.aws.Provider;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.Policy;
import com.pulumi.aws.iam.PolicyArgs;
import com.pulumi.aws.iam.RolePolicyAttachment;
import com.pulumi.aws.iam.RolePolicyAttachmentArgs;
import com.pulumi.core.Either;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

public class IAMRoles extends ComponentResource {
    private final Output<String> administrationRoleArn;
    private final Output<String> executionRoleName;

    public IAMRoles(String name, Provider provider) {
        super("custom:aws:IAMRoles", name, ComponentResourceOptions.builder()
                .provider(provider)
                .build());

        // StackSet Administration Role
        var administrationRole = new Role("stackset-administration-role", RoleArgs.builder()
                .name("AWSCloudFormationStackSetAdministrationRole")
                .assumeRolePolicy("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Principal": {
                                        "Service": "cloudformation.amazonaws.com"
                                    },
                                    "Action": "sts:AssumeRole"
                                }
                            ]
                        }
                        """)
                .build(), CustomResourceOptions.builder().parent(this).provider(provider)
                .build());

        // Create custom policy for StackSet administration
        var administrationPolicy = new Policy("stackset-administration-policy", PolicyArgs.builder()
                .name("StackSetAdministrationPolicy")
                .description("Policy for CloudFormation StackSet administration")
                .policy("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "sts:AssumeRole"
                                    ],
                                    "Resource": [
                                        "arn:aws:iam::*:role/AWSCloudFormationStackSetExecutionRole"
                                    ]
                                }
                            ]
                        }
                        """)
                .build(), CustomResourceOptions.builder().parent(this).provider(provider).build());

        // Attach custom policy to administration role
        new RolePolicyAttachment("stackset-admin-policy-attachment",
                RolePolicyAttachmentArgs.builder()
                        .role(administrationRole.name())
                        .policyArn(administrationPolicy.arn())
                        .build(), CustomResourceOptions.builder().parent(this).provider(provider).build());

        // StackSet Execution Role (to be created in target accounts)
        var executionRole = new Role("stackset-execution-role", RoleArgs.builder()
                .name("AWSCloudFormationStackSetExecutionRole")
                .assumeRolePolicy(administrationRole.arn().applyValue(adminArn -> Either.ofLeft(String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Principal": {
                                        "AWS": "%s"
                                    },
                                    "Action": "sts:AssumeRole"
                                }
                            ]
                        }
                        """, adminArn))))
                .build(), CustomResourceOptions.builder().parent(this).provider(provider)
                .build());

        // Create custom policy for StackSet execution
        var executionPolicy = new Policy("stackset-execution-policy", PolicyArgs.builder()
                .name("StackSetExecutionPolicy")
                .description("Policy for CloudFormation StackSet execution")
                .policy("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "cloudformation:*",
                                        "ec2:*",
                                        "elasticloadbalancing:*",
                                        "autoscaling:*",
                                        "dynamodb:*",
                                        "iam:CreateRole",
                                        "iam:DeleteRole",
                                        "iam:GetRole",
                                        "iam:PassRole",
                                        "iam:CreateInstanceProfile",
                                        "iam:DeleteInstanceProfile",
                                        "iam:AddRoleToInstanceProfile",
                                        "iam:RemoveRoleFromInstanceProfile",
                                        "iam:AttachRolePolicy",
                                        "iam:DetachRolePolicy",
                                        "iam:PutRolePolicy",
                                        "iam:DeleteRolePolicy",
                                        "iam:GetRolePolicy",
                                        "iam:ListRolePolicies",
                                        "iam:ListAttachedRolePolicies",
                                        "kms:*",
                                        "logs:*",
                                        "cloudwatch:*"
                                    ],
                                    "Resource": "*"
                                }
                            ]
                        }
                        """)
                .build(), CustomResourceOptions.builder().parent(this).provider(provider).build());

        // Attach custom policy to execution role
        new RolePolicyAttachment("stackset-exec-policy-attachment",
                RolePolicyAttachmentArgs.builder()
                        .role(executionRole.name())
                        .policyArn(executionPolicy.arn())
                        .build(), CustomResourceOptions.builder().parent(this).provider(provider)
                .build());

        this.administrationRoleArn = administrationRole.arn();
        this.executionRoleName = executionRole.name();
    }

    public Output<String> getAdministrationRoleArn() {
        return administrationRoleArn;
    }

    public Output<String> getExecutionRoleName() {
        return executionRoleName;
    }
}