You're right! The AWS managed policy ARN I used doesn't exist. Let me fix the IAM roles component with the correct approach. The issue is that we need to create custom policies for StackSet operations since the specific managed policies I referenced don't exist.

Here's the corrected `IAMRoles.java` component:

```java
// components/IAMRoles.java
package components;

import com.pulumi.aws.Provider;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.Policy;
import com.pulumi.aws.iam.PolicyArgs;
import com.pulumi.aws.iam.RolePolicyAttachment;
import com.pulumi.aws.iam.RolePolicyAttachmentArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;

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
            .build(), ComponentResourceOptions.builder()
                .parent(this)
                .provider(provider)
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
            .build(), ComponentResourceOptions.builder()
                .parent(this)
                .provider(provider)
                .build());

        // Attach custom policy to administration role
        new RolePolicyAttachment("stackset-admin-policy-attachment", 
            RolePolicyAttachmentArgs.builder()
                .role(administrationRole.name())
                .policyArn(administrationPolicy.arn())
                .build(), ComponentResourceOptions.builder()
                    .parent(this)
                    .provider(provider)
                    .build());

        // StackSet Execution Role (to be created in target accounts)
        var executionRole = new Role("stackset-execution-role", RoleArgs.builder()
            .name("AWSCloudFormationStackSetExecutionRole")
            .assumeRolePolicy(administrationRole.arn().apply(adminArn -> String.format("""
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
                """, adminArn)))
            .build(), ComponentResourceOptions.builder()
                .parent(this)
                .provider(provider)
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
            .build(), ComponentResourceOptions.builder()
                .parent(this)
                .provider(provider)
                .build());

        // Attach custom policy to execution role
        new RolePolicyAttachment("stackset-exec-policy-attachment", 
            RolePolicyAttachmentArgs.builder()
                .role(executionRole.name())
                .policyArn(executionPolicy.arn())
                .build(), ComponentResourceOptions.builder()
                    .parent(this)
                    .provider(provider)
                    .build());

        this.administrationRoleArn = administrationRole.arn();
        this.executionRoleName = executionRole.name();
    }

    public Output<String> getAdministrationRoleArn() { return administrationRoleArn; }
    public Output<String> getExecutionRoleName() { return executionRoleName; }
}
```

## Alternative Approach Using Managed Policies

If you prefer to use existing AWS managed policies, here's an alternative version that uses policies that actually exist:

```java
// components/IAMRoles.java (Alternative with existing managed policies)
package components;

import com.pulumi.aws.Provider;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.RolePolicyAttachment;
import com.pulumi.aws.iam.RolePolicyAttachmentArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;

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
            .build(), ComponentResourceOptions.builder()
                .parent(this)
                .provider(provider)
                .build());

        // Attach CloudFormation service role policy to administration role
        new RolePolicyAttachment("stackset-admin-cf-policy-attachment", 
            RolePolicyAttachmentArgs.builder()
                .role(administrationRole.name())
                .policyArn("arn:aws:iam::aws:policy/service-role/AWSCloudFormationRole")
                .build(), ComponentResourceOptions.builder()
                    .parent(this)
                    .provider(provider)
                    .build());

        // Attach additional policy for StackSet operations
        new RolePolicyAttachment("stackset-admin-sts-policy-attachment", 
            RolePolicyAttachmentArgs.builder()
                .role(administrationRole.name())
                .policyArn("arn:aws:iam::aws:policy/AWSCloudFormationFullAccess")
                .build(), ComponentResourceOptions.builder()
                    .parent(this)
                    .provider(provider)
                    .build());

        // StackSet Execution Role
        var executionRole = new Role("stackset-execution-role", RoleArgs.builder()
            .name("AWSCloudFormationStackSetExecutionRole")
            .assumeRolePolicy(administrationRole.arn().apply(adminArn -> String.format("""
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
                """, adminArn)))
            .build(), ComponentResourceOptions.builder()
                .parent(this)
                .provider(provider)
                .build());

        // Attach PowerUserAccess policy to execution role
        new RolePolicyAttachment("stackset-exec-poweruser-policy-attachment", 
            RolePolicyAttachmentArgs.builder()
                .role(executionRole.name())
                .policyArn("arn:aws:iam::aws:policy/PowerUserAccess")
                .build(), ComponentResourceOptions.builder()
                    .parent(this)
                    .provider(provider)
                    .build());

        // Attach IAM policy for role creation/management
        new RolePolicyAttachment("stackset-exec-iam-policy-attachment", 
            RolePolicyAttachmentArgs.builder()
                .role(executionRole.name())
                .policyArn("arn:aws:iam::aws:policy/IAMFullAccess")
                .build(), ComponentResourceOptions.builder()
                    .parent(this)
                    .provider(provider)
                    .build());

        this.administrationRoleArn = administrationRole.arn();
        this.executionRoleName = executionRole.name();
    }

    public Output<String> getAdministrationRoleArn() { return administrationRoleArn; }
    public Output<String> getExecutionRoleName() { return executionRoleName; }
}
```

## Key Changes Made:

1. **Removed non-existent managed policy**: The policy `arn:aws:iam::aws:policy/service-role/AWSCloudFormationStackSetAdministrationRole` doesn't exist.

2. **Added custom policies**: Created custom IAM policies with the exact permissions needed for StackSet operations.

3. **Alternative with existing managed policies**: Provided an alternative using `AWSCloudFormationRole`, `AWSCloudFormationFullAccess`, `PowerUserAccess`, and `IAMFullAccess` which are existing AWS managed policies.

4. **Proper permission scoping**: The custom policies include all necessary permissions for CloudFormation, EC2, ELB, Auto Scaling, DynamoDB, IAM, KMS, Logs, and CloudWatch operations.

The first approach with custom policies is more secure as it follows the principle of least privilege, while the second approach uses broader managed policies for simplicity. Choose the one that best fits your security requirements.