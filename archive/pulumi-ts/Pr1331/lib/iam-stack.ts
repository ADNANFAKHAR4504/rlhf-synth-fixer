import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface IamStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  s3BucketArn?: pulumi.Input<string>;
}

export class IamStack extends pulumi.ComponentResource {
  public readonly instanceRole: aws.iam.Role;
  public readonly instanceProfile: aws.iam.InstanceProfile;

  constructor(
    name: string,
    args: IamStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('webapp:iam:IamStack', name, args, opts);

    // IAM Role for EC2 instances
    this.instanceRole = new aws.iam.Role(
      `${name}-ec2-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          ...args.tags,
          Name: `${name}-ec2-role-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // CloudWatch policy
    const cloudWatchPolicy = new aws.iam.Policy(
      `${name}-cloudwatch-policy`,
      {
        description: 'Policy for CloudWatch access',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'cloudwatch:PutMetricData',
                'cloudwatch:GetMetricStatistics',
                'cloudwatch:ListMetrics',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // S3 policy for log storage
    const s3LogsPolicy = new aws.iam.Policy(
      `${name}-s3-logs-policy`,
      {
        description: 'Policy for S3 logs access',
        policy: pulumi.all([args.s3BucketArn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                Resource: bucketArn ? `${bucketArn}/*` : 'arn:aws:s3:::*/*',
              },
              {
                Effect: 'Allow',
                Action: ['s3:ListBucket'],
                Resource: bucketArn || 'arn:aws:s3:::*',
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Attach policies to role
    new aws.iam.RolePolicyAttachment(
      `${name}-cloudwatch-attach`,
      {
        role: this.instanceRole.name,
        policyArn: cloudWatchPolicy.arn,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `${name}-s3-attach`,
      {
        role: this.instanceRole.name,
        policyArn: s3LogsPolicy.arn,
      },
      { parent: this }
    );

    // Attach AWS managed policy for SSM (Systems Manager)
    new aws.iam.RolePolicyAttachment(
      `${name}-ssm-attach`,
      {
        role: this.instanceRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { parent: this }
    );

    // Instance Profile
    this.instanceProfile = new aws.iam.InstanceProfile(
      `${name}-instance-profile`,
      {
        role: this.instanceRole.name,
        tags: {
          ...args.tags,
          Name: `${name}-instance-profile-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      instanceRoleArn: this.instanceRole.arn,
      instanceProfileName: this.instanceProfile.name,
    });
  }
}
