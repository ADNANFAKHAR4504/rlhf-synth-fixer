import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { commonTags } from '../../config/tags';

export interface SecureIAMRoleArgs {
  roleName?: string;
  assumeRolePolicy: pulumi.Input<string>;
  policies?: pulumi.Input<string>[];
  managedPolicyArns?: string[];
  requireMFA?: boolean;
  tags?: Record<string, string>;
}

export class SecureIAMRole extends pulumi.ComponentResource {
  public readonly role: aws.iam.Role;
  public readonly policies: aws.iam.RolePolicy[];

  constructor(
    name: string,
    args: SecureIAMRoleArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:security:SecureIAMRole', name, {}, opts);

    // Create IAM role
    this.role = new aws.iam.Role(
      `${name}-role`,
      {
        name: args.roleName,
        assumeRolePolicy: args.assumeRolePolicy,
        tags: { ...commonTags, ...args.tags },
      },
      { parent: this }
    );

    // Attach managed policies
    if (args.managedPolicyArns) {
      args.managedPolicyArns.forEach((policyArn, index) => {
        new aws.iam.RolePolicyAttachment(
          `${name}-managed-policy-${index}`,
          {
            role: this.role.name,
            policyArn: policyArn,
          },
          { parent: this }
        );
      });
    }

    // Attach inline policies
    this.policies = [];
    if (args.policies) {
      args.policies.forEach((policy, index) => {
        const rolePolicy = new aws.iam.RolePolicy(
          `${name}-policy-${index}`,
          {
            role: this.role.id,
            policy: policy,
          },
          { parent: this }
        );
        this.policies.push(rolePolicy);
      });
    }

    this.registerOutputs({
      roleArn: this.role.arn,
      roleName: this.role.name,
    });
  }
}

// MFA-enforced policy for sensitive operations
export function createMFAEnforcedPolicy(): string {
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'AllowViewAccountInfo',
        Effect: 'Allow',
        Action: [
          'iam:GetAccountPasswordPolicy',
          'iam:ListVirtualMFADevices',
          'iam:GetAccountSummary',
        ],
        Resource: '*',
      },
      {
        Sid: 'AllowManageOwnPasswords',
        Effect: 'Allow',
        Action: ['iam:ChangePassword', 'iam:GetUser'],
        Resource: 'arn:aws:iam::*:user/${aws:username}',
      },
      {
        Sid: 'AllowManageOwnMFA',
        Effect: 'Allow',
        Action: [
          'iam:CreateVirtualMFADevice',
          'iam:DeleteVirtualMFADevice',
          'iam:EnableMFADevice',
          'iam:ListMFADevices',
          'iam:ResyncMFADevice',
        ],
        Resource: [
          'arn:aws:iam::*:mfa/${aws:username}',
          'arn:aws:iam::*:user/${aws:username}',
        ],
      },
      {
        Sid: 'DenyAllExceptListedIfNoMFA',
        Effect: 'Deny',
        NotAction: [
          'iam:CreateVirtualMFADevice',
          'iam:EnableMFADevice',
          'iam:GetUser',
          'iam:ListMFADevices',
          'iam:ListVirtualMFADevices',
          'iam:ResyncMFADevice',
          'sts:GetSessionToken',
        ],
        Resource: '*',
        Condition: {
          BoolIfExists: {
            'aws:MultiFactorAuthPresent': 'false',
          },
        },
      },
    ],
  });
}

// S3 access policy with least privilege
export function createS3AccessPolicy(
  bucketArn: pulumi.Input<string>
): pulumi.Output<string> {
  return pulumi.interpolate`{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ],
        "Resource": "${bucketArn}/*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:ListBucket"
        ],
        "Resource": "${bucketArn}"
      }
    ]
  }`;
}
