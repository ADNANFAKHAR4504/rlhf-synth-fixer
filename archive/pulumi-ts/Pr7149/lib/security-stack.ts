import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface SecurityStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class SecurityStack extends pulumi.ComponentResource {
  public readonly rdsKmsKey: aws.kms.Key;
  public readonly s3KmsKey: aws.kms.Key;
  public readonly cloudwatchKmsKey: aws.kms.Key;
  public readonly ecsTaskRole: aws.iam.Role;
  public readonly ecsExecutionRole: aws.iam.Role;

  constructor(
    name: string,
    args: SecurityStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:security:SecurityStack', name, args, opts);

    const { environmentSuffix, tags } = args;
    const currentCallerIdentity = aws.getCallerIdentity();

    // KMS Key for RDS encryption
    this.rdsKmsKey = new aws.kms.Key(
      `payment-rds-kms-${environmentSuffix}`,
      {
        description: `KMS key for RDS encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        deletionWindowInDays: 10,
        policy: pulumi.output(currentCallerIdentity).apply(identity =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${identity.accountId}:root`,
                },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'Allow RDS to use the key',
                Effect: 'Allow',
                Principal: {
                  Service: 'rds.amazonaws.com',
                },
                Action: [
                  'kms:Decrypt',
                  'kms:GenerateDataKey',
                  'kms:CreateGrant',
                  'kms:DescribeKey',
                ],
                Resource: '*',
              },
            ],
          })
        ),
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-rds-kms-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `alias-payment-rds-${environmentSuffix}`,
      {
        name: `alias/payment-rds-${environmentSuffix}`,
        targetKeyId: this.rdsKmsKey.keyId,
      },
      { parent: this }
    );

    // KMS Key for S3 encryption
    this.s3KmsKey = new aws.kms.Key(
      `payment-s3-kms-${environmentSuffix}`,
      {
        description: `KMS key for S3 encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        deletionWindowInDays: 10,
        policy: pulumi.output(currentCallerIdentity).apply(identity =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${identity.accountId}:root`,
                },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'Allow S3 to use the key',
                Effect: 'Allow',
                Principal: {
                  Service: 's3.amazonaws.com',
                },
                Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                Resource: '*',
              },
            ],
          })
        ),
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-s3-kms-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `alias-payment-s3-${environmentSuffix}`,
      {
        name: `alias/payment-s3-${environmentSuffix}`,
        targetKeyId: this.s3KmsKey.keyId,
      },
      { parent: this }
    );

    // KMS Key for CloudWatch Logs encryption
    this.cloudwatchKmsKey = new aws.kms.Key(
      `payment-logs-kms-${environmentSuffix}`,
      {
        description: `KMS key for CloudWatch Logs encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        deletionWindowInDays: 10,
        policy: pulumi.output(currentCallerIdentity).apply(identity =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${identity.accountId}:root`,
                },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'Allow CloudWatch Logs',
                Effect: 'Allow',
                Principal: {
                  Service: 'logs.us-east-1.amazonaws.com',
                },
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:ReEncrypt*',
                  'kms:GenerateDataKey*',
                  'kms:CreateGrant',
                  'kms:DescribeKey',
                ],
                Resource: '*',
                Condition: {
                  ArnLike: {
                    'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:us-east-1:${identity.accountId}:log-group:*`,
                  },
                },
              },
            ],
          })
        ),
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-logs-kms-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `alias-payment-logs-${environmentSuffix}`,
      {
        name: `alias/payment-logs-${environmentSuffix}`,
        targetKeyId: this.cloudwatchKmsKey.keyId,
      },
      { parent: this }
    );

    // ECS Task Execution Role
    this.ecsExecutionRole = new aws.iam.Role(
      `payment-ecs-exec-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-ecs-exec-role-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Attach AWS managed policy for ECS task execution
    new aws.iam.RolePolicyAttachment(
      `payment-ecs-exec-policy-${environmentSuffix}`,
      {
        role: this.ecsExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Additional policy for ECR with VPC endpoints
    const ecsExecutionPolicy = new aws.iam.Policy(
      `payment-ecs-exec-custom-policy-${environmentSuffix}`,
      {
        description:
          'Custom policy for ECS task execution with ECR and CloudWatch',
        policy: pulumi.output(currentCallerIdentity).apply(identity =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['ecr:GetAuthorizationToken'],
                Resource: '*',
                Condition: {
                  StringEquals: {
                    'aws:RequestedRegion': 'us-east-1',
                  },
                },
              },
              {
                Effect: 'Allow',
                Action: [
                  'ecr:BatchCheckLayerAvailability',
                  'ecr:GetDownloadUrlForLayer',
                  'ecr:BatchGetImage',
                ],
                Resource: `arn:aws:ecr:us-east-1:${identity.accountId}:repository/*`,
              },
              {
                Effect: 'Allow',
                Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                Resource: [
                  `arn:aws:logs:us-east-1:${identity.accountId}:log-group:/ecs/payment-app-${environmentSuffix}:*`,
                  `arn:aws:logs:us-east-1:${identity.accountId}:log-group:/audit/payment-app-${environmentSuffix}:*`,
                ],
              },
            ],
          })
        ),
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-ecs-exec-custom-policy-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `payment-ecs-exec-custom-attach-${environmentSuffix}`,
      {
        role: this.ecsExecutionRole.name,
        policyArn: ecsExecutionPolicy.arn,
      },
      { parent: this }
    );

    // ECS Task Role (for application)
    this.ecsTaskRole = new aws.iam.Role(
      `payment-ecs-task-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-ecs-task-role-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Task role policy for S3, RDS, and Secrets Manager access (least privilege)
    const ecsTaskPolicy = new aws.iam.Policy(
      `payment-ecs-task-policy-${environmentSuffix}`,
      {
        description:
          'Policy for ECS tasks to access S3, RDS, and Secrets Manager',
        policy: pulumi
          .all([this.s3KmsKey.arn, currentCallerIdentity])
          .apply(([kmsArn, identity]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
                  Resource: [
                    `arn:aws:s3:::payment-static-${environmentSuffix}`,
                    `arn:aws:s3:::payment-static-${environmentSuffix}/*`,
                  ],
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:PutObject'],
                  Resource: [
                    `arn:aws:s3:::payment-audit-logs-${environmentSuffix}/*`,
                  ],
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                  Resource: [kmsArn],
                },
                {
                  Effect: 'Allow',
                  Action: ['rds:DescribeDBClusters', 'rds:DescribeDBInstances'],
                  Resource: [
                    `arn:aws:rds:us-east-1:*:cluster:payment-cluster-${environmentSuffix}`,
                  ],
                },
                {
                  Effect: 'Allow',
                  Action: ['secretsmanager:GetSecretValue'],
                  Resource: [
                    `arn:aws:secretsmanager:us-east-1:${identity.accountId}:secret:payment-db-master-password-${environmentSuffix}-*`,
                  ],
                },
              ],
            })
          ),
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-ecs-task-policy-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `payment-ecs-task-attach-${environmentSuffix}`,
      {
        role: this.ecsTaskRole.name,
        policyArn: ecsTaskPolicy.arn,
      },
      { parent: this }
    );

    this.registerOutputs({
      rdsKmsKeyId: this.rdsKmsKey.id,
      s3KmsKeyId: this.s3KmsKey.id,
      cloudwatchKmsKeyId: this.cloudwatchKmsKey.id,
      ecsTaskRoleArn: this.ecsTaskRole.arn,
      ecsExecutionRoleArn: this.ecsExecutionRole.arn,
    });
  }
}
