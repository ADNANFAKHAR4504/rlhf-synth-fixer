import { Construct } from 'constructs';
import {
  Role,
  ServicePrincipal,
  PolicyStatement,
  Effect,
  ManagedPolicy,
  PolicyDocument,
} from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { TaggingUtils } from '../utils/tagging';

export interface IamConstructProps {
  environment: string;
  service: string;
  owner: string;
  project: string;
  kmsKeys: {
    dataKey: Key;
    logKey: Key;
    databaseKey: Key;
  };
}

/**
 * IAM Construct for role and policy management
 * Implements least-privilege access controls and security best practices
 */
export class IamConstruct extends Construct {
  public lambdaExecutionRole: Role;
  public ec2InstanceRole: Role;
  public rdsRole: Role;
  public cloudTrailRole: Role;
  public mfaEnforcementPolicy: ManagedPolicy;

  constructor(scope: Construct, id: string, props: IamConstructProps) {
    super(scope, id);

    // Create MFA enforcement policy for root account
    this.createMfaEnforcementPolicy(props);

    // Create service roles with minimal required permissions
    this.createServiceRoles(props);

    // Apply standard tags to all IAM resources
    this.applyTags(props);
  }

  /**
   * Create MFA enforcement policy for root account and sensitive operations
   */
  private createMfaEnforcementPolicy(props: IamConstructProps): void {
    this.mfaEnforcementPolicy = new ManagedPolicy(
      this,
      'MfaEnforcementPolicy',
      {
        description: 'Policy to enforce MFA for sensitive operations',
        statements: [
          // Deny all actions if MFA is not present
          new PolicyStatement({
            effect: Effect.DENY,
            actions: ['*'],
            resources: ['*'],
            conditions: {
              BoolIfExists: {
                'aws:MultiFactorAuthPresent': 'false',
              },
            },
          }),
          // Allow specific actions only with MFA
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              'iam:CreateAccessKey',
              'iam:DeleteAccessKey',
              'iam:UpdateAccessKey',
              'iam:CreateLoginProfile',
              'iam:DeleteLoginProfile',
              'iam:UpdateLoginProfile',
              'iam:AttachUserPolicy',
              'iam:DetachUserPolicy',
              'iam:PutUserPolicy',
              'iam:DeleteUserPolicy',
              'iam:CreateUser',
              'iam:DeleteUser',
              'iam:UpdateUser',
              'iam:CreateRole',
              'iam:DeleteRole',
              'iam:UpdateRole',
              'iam:AttachRolePolicy',
              'iam:DetachRolePolicy',
              'iam:PutRolePolicy',
              'iam:DeleteRolePolicy',
              'kms:CreateKey',
              'kms:DeleteKey',
              'kms:DisableKey',
              'kms:EnableKey',
              'kms:PutKeyPolicy',
              'kms:DeleteAlias',
              'kms:CreateAlias',
              'kms:UpdateAlias',
              'organizations:*',
              'account:*',
            ],
            resources: ['*'],
            conditions: {
              Bool: {
                'aws:MultiFactorAuthPresent': 'true',
              },
              NumericLessThan: {
                'aws:MultiFactorAuthAge': '3600', // 1 hour
              },
            },
          }),
        ],
      }
    );

    // Apply tags to MFA policy
    TaggingUtils.applyStandardTags(
      this.mfaEnforcementPolicy,
      props.environment,
      props.service,
      props.owner,
      props.project,
      { ResourceType: 'IAM-Policy-MFA' }
    );
  }

  /**
   * Create service roles with minimal required permissions
   */
  private createServiceRoles(props: IamConstructProps): void {
    // Lambda execution role with VPC and KMS permissions
    this.lambdaExecutionRole = new Role(this, 'LambdaExecutionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for Lambda functions with VPC access',
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
      inlinePolicies: {
        KMSAccess: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:GenerateDataKey',
              ],
              resources: [
                props.kmsKeys.dataKey.keyArn,
                props.kmsKeys.logKey.keyArn,
              ],
            }),
          ],
        }),
        SecretsManagerAccess: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ['secretsmanager:GetSecretValue'],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'secretsmanager:ResourceTag/Environment': props.environment,
                },
              },
            }),
          ],
        }),
        CloudWatchLogs: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [
                `arn:aws:logs:*:*:log-group:/aws/lambda/${props.environment}-*`,
              ],
            }),
          ],
        }),
      },
    });

    // EC2 instance role for application servers
    this.ec2InstanceRole = new Role(this, 'EC2InstanceRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for EC2 instances running application workloads',
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
      inlinePolicies: {
        S3Access: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [
                `arn:aws:s3:::${props.environment}-${props.service}-*/*`,
              ],
            }),
          ],
        }),
        KMSAccess: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
              resources: [props.kmsKeys.dataKey.keyArn],
            }),
          ],
        }),
        // Security hardening: Disable unused ports and services
        SecurityHardening: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.DENY,
              actions: [
                'ec2:AuthorizeSecurityGroupIngress',
                'ec2:RevokeSecurityGroupIngress',
              ],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'ec2:FromPort': [
                    '21',
                    '23',
                    '25',
                    '110',
                    '143',
                    '993',
                    '995',
                  ], // FTP, Telnet, SMTP, POP3, IMAP
                },
              },
            }),
          ],
        }),
      },
    });

    // RDS enhanced monitoring role
    this.rdsRole = new Role(this, 'RDSRole', {
      assumedBy: new ServicePrincipal('monitoring.rds.amazonaws.com'),
      description: 'Role for RDS enhanced monitoring',
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonRDSEnhancedMonitoringRole'
        ),
      ],
    });

    // CloudTrail role for logging to CloudWatch
    this.cloudTrailRole = new Role(this, 'CloudTrailRole', {
      assumedBy: new ServicePrincipal('cloudtrail.amazonaws.com'),
      description: 'Role for CloudTrail to write logs to CloudWatch',
      inlinePolicies: {
        CloudWatchLogsPolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'logs:PutLogEvents',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });
  }

  /**
   * Apply standard tags to all IAM resources
   */
  private applyTags(props: IamConstructProps): void {
    const roles = [
      { role: this.lambdaExecutionRole, type: 'Lambda' },
      { role: this.ec2InstanceRole, type: 'EC2' },
      { role: this.rdsRole, type: 'RDS' },
      { role: this.cloudTrailRole, type: 'CloudTrail' },
    ];

    roles.forEach(({ role, type }) => {
      TaggingUtils.applyStandardTags(
        role,
        props.environment,
        props.service,
        props.owner,
        props.project,
        { ResourceType: `IAM-Role-${type}` }
      );
    });
  }

  /**
   * Create a managed policy for cross-account access (if needed)
   */
  public createCrossAccountPolicy(trustedAccountIds: string[]): ManagedPolicy {
    return new ManagedPolicy(this, 'CrossAccountPolicy', {
      description: 'Policy for secure cross-account access',
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['sts:AssumeRole'],
          resources: trustedAccountIds.map(
            accountId => `arn:aws:iam::${accountId}:role/*`
          ),
          conditions: {
            Bool: {
              'aws:MultiFactorAuthPresent': 'true',
            },
            NumericLessThan: {
              'aws:MultiFactorAuthAge': '3600', // 1 hour
            },
          },
        }),
      ],
    });
  }
}
