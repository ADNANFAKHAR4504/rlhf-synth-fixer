import { Stack, StackProps, aws_organizations as org } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { name } from '../naming';

export interface MfaScpProps extends StackProps {
  dept: string;
  envName: string;
  purpose: string;
  orgTargetId: string;
}

export class MfaEnforcementScpStack extends Stack {
  constructor(scope: Construct, id: string, props: MfaScpProps) {
    super(scope, id, props);
    if (!props || typeof props !== 'object') {
      throw new Error('Props are required for MfaEnforcementScpStack');
    }
    if (
      !props.dept ||
      typeof props.dept !== 'string' ||
      props.dept.trim() === ''
    ) {
      throw new Error('dept is required for MfaEnforcementScpStack');
    }
    if (
      !props.envName ||
      typeof props.envName !== 'string' ||
      props.envName.trim() === ''
    ) {
      throw new Error('envName is required for MfaEnforcementScpStack');
    }
    if (
      !props.purpose ||
      typeof props.purpose !== 'string' ||
      props.purpose.trim() === ''
    ) {
      throw new Error('purpose is required for MfaEnforcementScpStack');
    }
    if (
      !props.orgTargetId ||
      typeof props.orgTargetId !== 'string' ||
      props.orgTargetId.trim() === ''
    ) {
      throw new Error('orgTargetId is required for MfaEnforcementScpStack');
    }
    new org.CfnPolicy(this, 'MfaScp', {
      name: name(props.dept, props.envName, `${props.purpose}-mfa-scp`),
      type: 'SERVICE_CONTROL_POLICY',
      targetIds: [props.orgTargetId],
      content: {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'DenyIfNoMFA',
            Effect: 'Deny',
            NotAction: [
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
            Resource: '*',
            Condition: {
              BoolIfExists: { 'aws:MultiFactorAuthPresent': 'false' },
            },
          },
        ],
      },
    });
  }
}
