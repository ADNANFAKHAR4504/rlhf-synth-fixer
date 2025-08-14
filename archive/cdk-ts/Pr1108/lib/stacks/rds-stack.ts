import {
  Stack,
  StackProps,
  aws_kms as kms,
  aws_rds as rds,
  aws_ssm as ssm,
} from 'aws-cdk-lib';
import type { IVpc } from 'aws-cdk-lib/aws-ec2';
import type { IKey } from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
import { PostgresRds } from '../constructs/rds-postgres';

export interface RdsProps extends StackProps {
  dept: string;
  envName: string;
  purpose: string;
  vpc: IVpc;
  kmsKey?: IKey;
  regionOverride?: string;
}

export class RdsStack extends Stack {
  public readonly instance: rds.DatabaseInstance;
  constructor(scope: Construct, id: string, props: RdsProps) {
    super(scope, id, props);

    let key: kms.IKey;
    if (props.kmsKey) {
      key = props.kmsKey;
    } else {
      const keyArn = ssm.StringParameter.valueForStringParameter(
        this,
        `/${props.dept}-${props.envName}-${props.purpose}/kms/key-arn/${this.region}`
      );
      key = kms.Key.fromKeyArn(this, 'DataKey', keyArn);
    }

    this.instance = new PostgresRds(this, 'Pg', {
      vpc: props.vpc,
      kmsKey: key,
      idSuffix: `${props.dept}-${props.envName}-${props.purpose}-${this.region}`,
    }).instance;

    const region = props.regionOverride ?? this.region;
    new ssm.StringParameter(this, 'DbArnParam', {
      parameterName: `/${props.dept}-${props.envName}-${props.purpose}/rds/db-arn/${region}`,
      stringValue: this.instance.instanceArn,
    });
  }
}
