import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface IamStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class IamStack extends pulumi.ComponentResource {
  public readonly instanceRole: pulumi.Output<string>;
  public readonly instanceProfile: pulumi.Output<string>;

  constructor(name: string, args: IamStackArgs, opts?: ResourceOptions) {
    super('tap:stack:IamStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // EC2 instance role with least privilege
    const instanceRole = new aws.iam.Role(
      `tap-instance-role-${environmentSuffix}`,
      {
        name: `tap-instance-role-${environmentSuffix}`,
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
        tags,
      },
      { parent: this }
    );

    // Policy for CloudWatch Logs
    const logsPolicy = new aws.iam.Policy(
      `tap-logs-policy-${environmentSuffix}`,
      {
        name: `tap-logs-policy-${environmentSuffix}`,
        description: 'Allow EC2 instances to write to CloudWatch Logs',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              Resource: 'arn:aws:logs:*:*:*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Policy for specific S3 bucket access
    const s3Policy = new aws.iam.Policy(
      `tap-s3-policy-${environmentSuffix}`,
      {
        name: `tap-s3-policy-${environmentSuffix}`,
        description: 'Allow access to specific S3 buckets only',
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject"
          ],
          "Resource": [
            "arn:aws:s3:::tap-static-content-${environmentSuffix}-*/*"
          ]
        }, {
          "Effect": "Allow",
          "Action": [
            "s3:ListBucket"
          ],
          "Resource": [
            "arn:aws:s3:::tap-static-content-${environmentSuffix}-*"
          ]
        }]
      }`,
      },
      { parent: this }
    );

    // Attach policies to role
    new aws.iam.RolePolicyAttachment(
      `tap-instance-logs-attachment-${environmentSuffix}`,
      {
        role: instanceRole.name,
        policyArn: logsPolicy.arn,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `tap-instance-s3-attachment-${environmentSuffix}`,
      {
        role: instanceRole.name,
        policyArn: s3Policy.arn,
      },
      { parent: this }
    );

    // Instance profile
    const instanceProfile = new aws.iam.InstanceProfile(
      `tap-instance-profile-${environmentSuffix}`,
      {
        name: `tap-instance-profile-${environmentSuffix}`,
        role: instanceRole.name,
        tags,
      },
      { parent: this }
    );

    this.instanceRole = instanceRole.arn;
    this.instanceProfile = instanceProfile.name;

    this.registerOutputs({
      instanceRole: this.instanceRole,
      instanceProfile: this.instanceProfile,
    });
  }
}
