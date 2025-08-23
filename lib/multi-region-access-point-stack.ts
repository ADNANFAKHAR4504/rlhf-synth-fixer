import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface MultiRegionAccessPointStackProps extends cdk.StackProps {
  readonly buckets: Array<{
    bucket: s3.IBucket;
    region: string;
  }>;
}

export class MultiRegionAccessPointStack extends cdk.Stack {
  public readonly multiRegionAccessPoint: s3.CfnMultiRegionAccessPoint;

  constructor(
    scope: Construct,
    id: string,
    props: MultiRegionAccessPointStackProps
  ) {
    super(scope, id, props);

    // Create Multi-Region Access Point for optimized access
    this.multiRegionAccessPoint = new s3.CfnMultiRegionAccessPoint(
      this,
      'MultiRegionAccessPoint',
      {
        name: `trainr302-mrap-${this.account}`,
        regions: props.buckets.map(bucketInfo => ({
          bucket: bucketInfo.bucket.bucketName,
          bucketAccountId: this.account,
        })),
        publicAccessBlockConfiguration: {
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        },
      }
    );

    // Apply Environment:Production tag
    cdk.Tags.of(this.multiRegionAccessPoint).add('Environment', 'Production');
    cdk.Tags.of(this.multiRegionAccessPoint).add('Project', 'trainr302');

    // Create IAM policy for Multi-Region Access Point
    const mrapPolicy = new iam.Policy(this, 'MultiRegionAccessPointPolicy', {
      policyName: 'trainr302-mrap-policy',
      statements: [
        new iam.PolicyStatement({
          sid: 'AllowMRAPAccess',
          effect: iam.Effect.ALLOW,
          principals: [new iam.AccountRootPrincipal()],
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:ListBucket',
          ],
          resources: [
            this.multiRegionAccessPoint.getAtt('Arn').toString(),
            `${this.multiRegionAccessPoint.getAtt('Arn').toString()}/object/*`,
          ],
        }),
      ],
    });

    // Apply Environment:Production tag to policy
    cdk.Tags.of(mrapPolicy).add('Environment', 'Production');
    cdk.Tags.of(mrapPolicy).add('Project', 'trainr302');

    // Output Multi-Region Access Point information
    new cdk.CfnOutput(this, 'MultiRegionAccessPointArn', {
      value: this.multiRegionAccessPoint.getAtt('Arn').toString(),
      description: 'Multi-Region Access Point ARN',
      exportName: 'MultiRegionAccessPointArn',
    });

    new cdk.CfnOutput(this, 'MultiRegionAccessPointAlias', {
      value: this.multiRegionAccessPoint.getAtt('Alias').toString(),
      description: 'Multi-Region Access Point Alias',
      exportName: 'MultiRegionAccessPointAlias',
    });
  }
}
