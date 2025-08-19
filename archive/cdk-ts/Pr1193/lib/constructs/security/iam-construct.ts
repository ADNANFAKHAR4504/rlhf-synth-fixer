import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { SecurityConfig } from '../../config/security-config';

/**
 * IAM Construct implementing least privilege access principles
 * Creates roles and policies with minimal required permissions
 */
export class IamConstruct extends Construct {
  public readonly ec2Role: iam.Role;
  public readonly cloudTrailRole: iam.Role;
  public readonly configRole: iam.Role;
  public readonly applicationRole: iam.Role;

  constructor(
    scope: Construct,
    id: string,
    kmsKeys: {
      s3Key: kms.Key;
      secretsKey: kms.Key;
      cloudTrailKey: kms.Key;
    }
  ) {
    super(scope, id);

    // EC2 Instance Role with minimal required permissions
    this.ec2Role = new iam.Role(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-EC2-Role`,
      {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        description: 'IAM role for EC2 instances with least privilege access',

        // Attach AWS managed policies for basic functionality
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'CloudWatchAgentServerPolicy'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonSSMManagedInstanceCore'
          ), // For Systems Manager
        ],

        // Custom inline policy for specific application needs
        inlinePolicies: {
          [`${SecurityConfig.RESOURCE_PREFIX}-EC2-Policy`]:
            new iam.PolicyDocument({
              statements: [
                // Allow reading from specific S3 buckets only
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: ['s3:GetObject', 's3:GetObjectVersion'],
                  resources: [
                    `arn:aws:s3:::${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-*/*`,
                  ],
                }),

                // Allow decryption of application-specific KMS keys
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: [
                    'kms:Decrypt',
                    'kms:GenerateDataKey',
                    'kms:DescribeKey',
                  ],
                  resources: [kmsKeys.s3Key.keyArn, kmsKeys.secretsKey.keyArn],
                }),

                // Allow reading specific secrets
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: [
                    'secretsmanager:GetSecretValue',
                    'secretsmanager:DescribeSecret',
                  ],
                  resources: [
                    `arn:aws:secretsmanager:${SecurityConfig.PRIMARY_REGION}:*:secret:${SecurityConfig.RESOURCE_PREFIX}/*`,
                  ],
                }),
              ],
            }),
        },
      }
    );

    // Application-specific role for Lambda functions or containers
    this.applicationRole = new iam.Role(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-App-Role`,
      {
        assumedBy: new iam.CompositePrincipal(
          new iam.ServicePrincipal('lambda.amazonaws.com'),
          new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
        ),
        description:
          'IAM role for application services with restricted permissions',

        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],

        inlinePolicies: {
          [`${SecurityConfig.RESOURCE_PREFIX}-App-Policy`]:
            new iam.PolicyDocument({
              statements: [
                // Restricted S3 access
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                  resources: [
                    `arn:aws:s3:::${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-app-data/*`,
                  ],
                }),

                // CloudWatch Logs access
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ],
                  resources: [
                    `arn:aws:logs:${SecurityConfig.PRIMARY_REGION}:*:log-group:/aws/lambda/${SecurityConfig.RESOURCE_PREFIX}*`,
                  ],
                }),
              ],
            }),
        },
      }
    );

    // CloudTrail Service Role
    this.cloudTrailRole = new iam.Role(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-CloudTrail-Role`,
      {
        assumedBy: new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
        description: 'IAM role for CloudTrail service',

        inlinePolicies: {
          [`${SecurityConfig.RESOURCE_PREFIX}-CloudTrail-Policy`]:
            new iam.PolicyDocument({
              statements: [
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: [
                    's3:PutObject',
                    's3:GetBucketAcl',
                    's3:PutBucketAcl',
                  ],
                  resources: [
                    `arn:aws:s3:::${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-cloudtrail-logs`,
                    `arn:aws:s3:::${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-cloudtrail-logs/*`,
                  ],
                }),
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: ['kms:GenerateDataKey*', 'kms:DescribeKey'],
                  resources: [kmsKeys.cloudTrailKey.keyArn],
                }),
              ],
            }),
        },
      }
    );

    // AWS Config Service Role
    this.configRole = new iam.Role(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-Config-Role`,
      {
        assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
        description: 'IAM role for AWS Config service',

        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWS_ConfigRole'
          ),
        ],

        inlinePolicies: {
          [`${SecurityConfig.RESOURCE_PREFIX}-Config-Policy`]:
            new iam.PolicyDocument({
              statements: [
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: [
                    's3:GetBucketAcl',
                    's3:ListBucket',
                    's3:GetBucketLocation',
                    's3:PutObject',
                    's3:GetBucketVersioning',
                  ],
                  resources: [
                    `arn:aws:s3:::${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-config-logs`,
                    `arn:aws:s3:::${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-config-logs/*`,
                  ],
                }),
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: [
                    'kms:GenerateDataKey*',
                    'kms:DescribeKey',
                    'kms:Decrypt',
                  ],
                  resources: [kmsKeys.cloudTrailKey.keyArn],
                }),
              ],
            }),
        },
      }
    );

    // Create instance profile for EC2
    new iam.InstanceProfile(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-EC2-InstanceProfile`,
      {
        role: this.ec2Role,
        instanceProfileName: `${SecurityConfig.RESOURCE_PREFIX}-EC2-InstanceProfile`,
      }
    );

    // Apply tags to all IAM resources
    const roles = [
      this.ec2Role,
      this.applicationRole,
      this.cloudTrailRole,
      this.configRole,
    ];
    roles.forEach(role => {
      Object.entries(SecurityConfig.STANDARD_TAGS).forEach(([key, value]) => {
        role.node.addMetadata(key, value);
      });
    });
  }
}
