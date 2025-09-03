import { aws_iam as iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface ApiLambdaRoleProps {
  bucketArnForObjects: string; // e.g., bucket.arnForObjects('*')
  kmsKeyArn: string;
}

export class ApiLambdaRole extends Construct {
  public readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: ApiLambdaRoleProps) {
    super(scope, id);

    if (!props || !props.bucketArnForObjects) {
      throw new Error('ApiLambdaRole: "bucketArnForObjects" prop is required');
    }
    if (!props.kmsKeyArn) {
      throw new Error('ApiLambdaRole: "kmsKeyArn" prop is required');
    }

    this.role = new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Least-privilege role for API Lambda',
    });

    // CloudWatch Logs
    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      })
    );

    // Object-level S3 access, no ListBucket
    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [props.bucketArnForObjects],
      })
    );

    // KMS limited to specific key
    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:GenerateDataKey',
          'kms:DescribeKey',
        ],
        resources: [props.kmsKeyArn],
      })
    );
  }
}
