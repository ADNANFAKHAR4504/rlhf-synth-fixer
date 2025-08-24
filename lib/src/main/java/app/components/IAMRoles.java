package app.components;

import com.pulumi.aws.Provider;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
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
        super("custom:aws:IAMRoles", name, ComponentResourceOptions.builder().provider(provider)
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
                .build(), CustomResourceOptions.builder().parent(this).provider(provider).build());

        // Attach policy to administration role
        new RolePolicyAttachment("stackset-admin-policy-attachment",
                RolePolicyAttachmentArgs.builder()
                        .role(administrationRole.name())
                        .policyArn("arn:aws:iam::aws:policy/service-role/AWSCloudFormationStackSetAdministrationRole")
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .provider(provider)
                .build());

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

        // Attach comprehensive policy to execution role
        new RolePolicyAttachment("stackset-exec-policy-attachment",
                RolePolicyAttachmentArgs.builder()
                        .role(executionRole.name())
                        .policyArn("arn:aws:iam::aws:policy/PowerUserAccess")
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .provider(provider)
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
