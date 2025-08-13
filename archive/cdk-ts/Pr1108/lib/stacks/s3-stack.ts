import {
  Stack,
  StackProps,
  aws_kms as kms,
  aws_s3 as s3,
  aws_ssm as ssm,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecureBucket } from '../constructs/secure-bucket';

export interface BaseProps extends StackProps {
  dept: string;
  envName: string;
  purpose: string;
  regionOverride?: string;
  accountOverride?: string;
}

export class S3Stack extends Stack {
  public readonly bucket: s3.Bucket;
  constructor(scope: Construct, id: string, props: BaseProps) {
    super(scope, id, props);
    if (!props || typeof props !== 'object') {
      throw new Error('Props are required for S3Stack');
    }
    if (
      !props.dept ||
      typeof props.dept !== 'string' ||
      props.dept.trim() === ''
    ) {
      throw new Error('dept is required for S3Stack');
    }
    if (
      !props.envName ||
      typeof props.envName !== 'string' ||
      props.envName.trim() === ''
    ) {
      throw new Error('envName is required for S3Stack');
    }
    if (
      !props.purpose ||
      typeof props.purpose !== 'string' ||
      props.purpose.trim() === ''
    ) {
      throw new Error('purpose is required for S3Stack');
    }
    const region = props.regionOverride ?? this.region;
    const account = props.accountOverride ?? this.account;
    const keyArn = ssm.StringParameter.valueForStringParameter(
      this,
      `/${props.dept}-${props.envName}-${props.purpose}/kms/key-arn/${region}`
    );
    if (!keyArn || typeof keyArn !== 'string' || keyArn.trim() === '') {
      throw new Error(
        'encryptionKey (keyArn) is required for SecureBucket in S3Stack'
      );
    }
    const key = kms.Key.fromKeyArn(this, 'DataKey', keyArn);
    const bucketName =
      `${props.dept}-${props.envName}-${props.purpose}-${account}-${region}`.toLowerCase();
    this.bucket = new SecureBucket(this, 'SecureBucket', {
      encryptionKey: key,
      bucketName,
    }).bucket;
    // publish bucket identifiers (optional)
    new ssm.StringParameter(this, 'BucketArnParam', {
      parameterName: `/${props.dept}-${props.envName}-${props.purpose}/s3/bucket-arn/${region}`,
      stringValue: this.bucket.bucketArn,
    });
    new ssm.StringParameter(this, 'BucketNameParam', {
      parameterName: `/${props.dept}-${props.envName}-${props.purpose}/s3/bucket-name/${region}`,
      stringValue: this.bucket.bucketName,
    });
  }
}
