import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { SecurityConfig } from '../../config/security-config';

/**
 * MFA Construct for enforcing multi-factor authentication
 * Ensures all IAM users have MFA enabled for enhanced security
 */
export class MfaConstruct extends Construct {
  public readonly mfaPolicy: iam.ManagedPolicy;
  public readonly userGroup: iam.Group;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // IAM Group for users requiring MFA
    this.userGroup = new iam.Group(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-Users-Group`,
      {
        groupName: `${SecurityConfig.RESOURCE_PREFIX}-Users`,
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess'),
        ],
      }
    );

    // MFA Enforcement Policy
    this.mfaPolicy = new iam.ManagedPolicy(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-MFA-Policy`,
      {
        managedPolicyName: `${SecurityConfig.RESOURCE_PREFIX}-MFA-Enforcement`,
        description: 'Enforces MFA for all IAM users',
        statements: [
          // Deny access without MFA
          new iam.PolicyStatement({
            sid: 'DenyAccessWithoutMFA',
            effect: iam.Effect.DENY,
            notActions: [
              'iam:CreateVirtualMFADevice',
              'iam:EnableMFADevice',
              'iam:GetUser',
              'iam:ListMFADevices',
              'iam:ListVirtualMFADevices',
              'iam:ResyncMFADevice',
              'iam:ChangePassword',
              'iam:GetAccountPasswordPolicy',
              'iam:GetAccountSummary',
              'sts:GetSessionToken',
            ],
            resources: ['*'],
            conditions: {
              BoolIfExists: {
                'aws:MultiFactorAuthPresent': 'false',
              },
            },
          }),
          // Allow MFA device management
          new iam.PolicyStatement({
            sid: 'AllowMFADeviceManagement',
            effect: iam.Effect.ALLOW,
            actions: [
              'iam:CreateVirtualMFADevice',
              'iam:EnableMFADevice',
              'iam:ResyncMFADevice',
              'iam:DeactivateMFADevice',
              'iam:DeleteVirtualMFADevice',
              'iam:ListMFADevices',
              'iam:ListVirtualMFADevices',
            ],
            resources: [
              `arn:aws:iam::${cdk.Stack.of(this).account}:mfa/*`,
              `arn:aws:iam::${cdk.Stack.of(this).account}:user/*`,
            ],
          }),
          // Allow password changes
          new iam.PolicyStatement({
            sid: 'AllowPasswordChanges',
            effect: iam.Effect.ALLOW,
            actions: ['iam:ChangePassword', 'iam:GetAccountPasswordPolicy'],
            resources: [`arn:aws:iam::${cdk.Stack.of(this).account}:user/*`],
          }),
          // Allow session token generation
          new iam.PolicyStatement({
            sid: 'AllowSessionTokenGeneration',
            effect: iam.Effect.ALLOW,
            actions: ['sts:GetSessionToken'],
            resources: ['*'],
            conditions: {
              Bool: {
                'aws:MultiFactorAuthPresent': 'true',
              },
            },
          }),
        ],
      }
    );

    // Attach MFA policy to user group
    this.userGroup.addManagedPolicy(this.mfaPolicy);

    // Create IAM users with MFA requirement
    const adminUser = new iam.User(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-Admin-User`,
      {
        userName: `${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-admin`,
        groups: [this.userGroup],
        password: cdk.SecretValue.unsafePlainText('ChangeMe123!@#'), // Should be changed on first login
        passwordResetRequired: true,
      }
    );

    const developerUser = new iam.User(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-Developer-User`,
      {
        userName: `${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-developer`,
        groups: [this.userGroup],
        password: cdk.SecretValue.unsafePlainText('ChangeMe123!@#'), // Should be changed on first login
        passwordResetRequired: true,
      }
    );

    // Output instructions for MFA setup
    new cdk.CfnOutput(this, 'MFAInstructions', {
      value: 'Users must enable MFA devices before accessing AWS resources',
      description: 'MFA Setup Instructions',
      exportName: `${SecurityConfig.RESOURCE_PREFIX}-MFA-Instructions`,
    });

    new cdk.CfnOutput(this, 'AdminUser', {
      value: adminUser.userName,
      description: 'Admin username',
      exportName: `${SecurityConfig.RESOURCE_PREFIX}-Admin-User`,
    });

    new cdk.CfnOutput(this, 'DeveloperUser', {
      value: developerUser.userName,
      description: 'Developer username',
      exportName: `${SecurityConfig.RESOURCE_PREFIX}-Developer-User`,
    });
  }
}
