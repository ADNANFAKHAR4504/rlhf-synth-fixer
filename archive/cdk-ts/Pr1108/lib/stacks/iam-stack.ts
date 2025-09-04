import { Stack, StackProps, aws_iam as iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MfaManagedPolicy } from '../constructs/iam-mfa-policy';
import { name } from '../naming';

export interface IamProps extends StackProps {
  dept: string;
  envName: string;
  purpose: string;
}

export class IamStack extends Stack {
  public readonly roleDev: iam.Role;
  public readonly roleProd: iam.Role;

  constructor(scope: Construct, id: string, props: IamProps) {
    super(scope, id, props);
    if (!props || typeof props !== 'object') {
      throw new Error('Props are required for IamStack');
    }
    if (
      !props.dept ||
      typeof props.dept !== 'string' ||
      props.dept.trim() === ''
    ) {
      throw new Error('dept is required for IamStack');
    }
    if (
      !props.envName ||
      typeof props.envName !== 'string' ||
      props.envName.trim() === ''
    ) {
      throw new Error('envName is required for IamStack');
    }
    if (
      !props.purpose ||
      typeof props.purpose !== 'string' ||
      props.purpose.trim() === ''
    ) {
      throw new Error('purpose is required for IamStack');
    }
    // Minimal roles (no wildcards). Add fine-grained policies later if desired by reading SSM ARNs.
    this.roleDev = new iam.Role(this, 'DevRole', {
      roleName: name(props.dept, 'dev', `${props.purpose}-app-role`),
      assumedBy: new iam.AccountPrincipal(this.account),
    });
    this.roleProd = new iam.Role(this, 'ProdRole', {
      roleName: name(props.dept, 'prod', `${props.purpose}-app-role`),
      assumedBy: new iam.AccountPrincipal(this.account),
    });
    // Attach MFA fallback managed policy (SCP recommended if using Organizations)
    const mfaPolicy = new MfaManagedPolicy(this, 'MfaFallback').policy;
    this.roleDev.addManagedPolicy(mfaPolicy);
    this.roleProd.addManagedPolicy(mfaPolicy);
  }
}
