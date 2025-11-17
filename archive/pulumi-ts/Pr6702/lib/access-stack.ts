import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface AccessStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string>[];
  kmsKeyArn: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class AccessStack extends pulumi.ComponentResource {
  public readonly sessionManagerRoleArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: AccessStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:access:AccessStack', name, args, opts);

    const { environmentSuffix, kmsKeyArn, tags } = args;

    // Get current AWS account
    const current = aws.getCallerIdentity({});

    // S3 bucket for Session Manager logs
    const sessionLogsBucket = new aws.s3.Bucket(
      `session-logs-bucket-${environmentSuffix}`,
      {
        bucket: pulumi
          .output(current)
          .apply(c => `session-logs-${environmentSuffix}-${c.accountId}`),
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKeyArn,
            },
            bucketKeyEnabled: true,
          },
        },
        lifecycleRules: [
          {
            id: 'delete-old-sessions',
            enabled: true,
            expiration: {
              days: 90,
            },
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `session-logs-bucket-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Block public access to session logs bucket
    new aws.s3.BucketPublicAccessBlock(
      `session-logs-bucket-pab-${environmentSuffix}`,
      {
        bucket: sessionLogsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // CloudWatch Log Group for Session Manager
    const sessionLogGroup = new aws.cloudwatch.LogGroup(
      `session-log-group-${environmentSuffix}`,
      {
        name: `/aws/ssm/session/${environmentSuffix}`,
        retentionInDays: 90,
        kmsKeyId: kmsKeyArn,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `session-log-group-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // IAM Role for EC2 instances using Session Manager
    const sessionManagerRole = new aws.iam.Role(
      `session-manager-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `session-manager-role-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Attach SSM managed policy
    new aws.iam.RolePolicyAttachment(
      `session-manager-policy-${environmentSuffix}`,
      {
        role: sessionManagerRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { parent: this }
    );

    // Inline policy for Session Manager logging
    new aws.iam.RolePolicy(
      `session-manager-logging-policy-${environmentSuffix}`,
      {
        role: sessionManagerRole.id,
        policy: pulumi
          .all([sessionLogsBucket.arn, sessionLogGroup.arn, kmsKeyArn])
          .apply(([bucketArn, logGroupArn, kmsArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:PutObject', 's3:PutObjectAcl'],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                    'logs:DescribeLogStreams',
                  ],
                  Resource: `${logGroupArn}:*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                  Resource: kmsArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Instance profile for EC2
    new aws.iam.InstanceProfile(
      `session-manager-profile-${environmentSuffix}`,
      {
        role: sessionManagerRole.name,
        name: `session-manager-profile-${environmentSuffix}`,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `session-manager-profile-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // SSM Document for Session Manager preferences
    new aws.ssm.Document(
      `session-preferences-${environmentSuffix}`,
      {
        name: `SSM-SessionManagerRunShell-${environmentSuffix}`,
        documentType: 'Session',
        documentFormat: 'JSON',
        content: pulumi
          .all([sessionLogsBucket.bucket, sessionLogGroup.name, kmsKeyArn])
          .apply(([bucket, logGroup, kmsArn]) =>
            JSON.stringify({
              schemaVersion: '1.0',
              description:
                'Document to hold regional settings for Session Manager',
              sessionType: 'Standard_Stream',
              inputs: {
                s3BucketName: bucket,
                s3KeyPrefix: 'sessions/',
                s3EncryptionEnabled: true,
                cloudWatchLogGroupName: logGroup,
                cloudWatchEncryptionEnabled: true,
                kmsKeyId: kmsArn,
                runAsEnabled: false,
                runAsDefaultUser: '',
              },
            })
          ),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `session-preferences-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Export outputs
    this.sessionManagerRoleArn = sessionManagerRole.arn;

    this.registerOutputs({
      sessionManagerRoleArn: this.sessionManagerRoleArn,
    });
  }
}
