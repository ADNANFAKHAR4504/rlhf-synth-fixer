package app.components;

import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
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
import app.config.DeploymentConfig;
import com.pulumi.resources.CustomResourceOptions;

import java.util.ArrayList;
import java.util.List;

public class CrossAccountRoleSetup extends ComponentResource {
    private final List<Output<String>> executionRoleArns;

    public static class CrossAccountRoleSetupArgs {
        private DeploymentConfig config;
        private Output<String> administrationRoleArn;

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final CrossAccountRoleSetupArgs args = new CrossAccountRoleSetupArgs();

            public Builder config(DeploymentConfig config) {
                args.config = config;
                return this;
            }

            public Builder administrationRoleArn(Output<String> arn) {
                args.administrationRoleArn = arn;
                return this;
            }

            public CrossAccountRoleSetupArgs build() {
                return args;
            }
        }
    }

    public CrossAccountRoleSetup(String name, CrossAccountRoleSetupArgs args, ComponentResourceOptions options) {
        super("custom:aws:CrossAccountRoleSetup", name, options);

        this.executionRoleArns = new ArrayList<>();

        // Create execution roles in each target account
        for (String accountId : args.config.getTargetAccounts()) {
            // Create provider for target account (assumes cross-account access is configured)
            var targetProvider = new Provider("provider-" + accountId, ProviderArgs.builder()
                    .region(args.config.getManagementRegion())
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create execution role in target account
            var executionRole = new Role("execution-role-" + accountId, RoleArgs.builder()
                    .name("AWSCloudFormationStackSetExecutionRole-" + accountId)
                    .assumeRolePolicy(args.administrationRoleArn.applyValue(adminArn -> Either.ofLeft(String.format("""
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
                    .build(), CustomResourceOptions.builder().parent(this).provider(targetProvider)
                    .build());

            // Create execution policy
            var executionPolicy = new Policy("execution-policy-" + accountId, PolicyArgs.builder()
                    .name("StackSetExecutionPolicy-" + accountId)
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
                    .build(), CustomResourceOptions.builder().parent(this).provider(targetProvider)
                    .build());

            // Attach policy to execution role
            new RolePolicyAttachment("execution-policy-attachment-" + accountId,
                    RolePolicyAttachmentArgs.builder()
                            .role(executionRole.name())
                            .policyArn(executionPolicy.arn())
                            .build(), CustomResourceOptions.builder().parent(this).provider(targetProvider)
                    .build());

            executionRoleArns.add(executionRole.arn());
        }
    }

    public List<Output<String>> getExecutionRoleArns() {
        return executionRoleArns;
    }
}
