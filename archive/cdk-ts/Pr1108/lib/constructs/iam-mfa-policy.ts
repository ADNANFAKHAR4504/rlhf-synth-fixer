import { aws_iam as iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class MfaManagedPolicy extends Construct {
  public readonly policy: iam.ManagedPolicy;
  constructor(scope: Construct, id: string) {
    super(scope, id);
    this.policy = new iam.ManagedPolicy(this, 'MfaRequired', {
      description: 'Deny if MFA not present (fallback when no SCP)',
      statements: [
        new iam.PolicyStatement({
          sid: 'DenyAllIfNoMFA',
          effect: iam.Effect.DENY,
          notActions: [
            'iam:CreateVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:ListMFADevices',
            'iam:ListVirtualMFADevices',
            'iam:ListUsers',
            'iam:ListAccountAliases',
            'iam:GetAccountSummary',
            'sts:GetSessionToken',
            'sts:AssumeRole',
          ],
          resources: ['*'],
          conditions: {
            BoolIfExists: { 'aws:MultiFactorAuthPresent': 'false' },
          },
        }),
      ],
    });
  }
}
