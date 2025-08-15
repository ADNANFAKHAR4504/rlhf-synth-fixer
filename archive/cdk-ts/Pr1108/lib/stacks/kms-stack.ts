import {
  Stack,
  StackProps,
  aws_iam as iam,
  aws_kms as kms,
  aws_ssm as ssm,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DataKmsKey } from '../constructs/kms-key';

export interface BaseProps extends StackProps {
  dept: string;
  envName: string;
  purpose: string;
  regionOverride?: string;
}

export class KmsStack extends Stack {
  public readonly key: kms.Key;
  constructor(scope: Construct, id: string, props: BaseProps) {
    super(scope, id, props);

    const alias = `alias/${props.dept}-${props.envName}-${props.purpose}-data`;
    this.key = new DataKmsKey(this, 'DataKey', { alias }).key;

    // allow S3 and RDS via service in this account/region
    this.key.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowUseViaS3',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
        ],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'kms:CallerAccount': this.account,
            'kms:ViaService': `s3.${this.region}.amazonaws.com`,
          },
        },
      })
    );
    this.key.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowUseViaRds',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('rds.amazonaws.com')],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
        ],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'kms:CallerAccount': this.account,
            'kms:ViaService': `rds.${this.region}.amazonaws.com`,
          },
        },
      })
    );

    // publish key arn to SSM for consumers
    const region = props.regionOverride ?? this.region;
    new ssm.StringParameter(this, 'KmsArnParam', {
      parameterName: `/${props.dept}-${props.envName}-${props.purpose}/kms/key-arn/${region}`,
      stringValue: this.key.keyArn,
    });
  }
}
