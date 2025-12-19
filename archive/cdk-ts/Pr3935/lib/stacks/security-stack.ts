import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  tags?: { [key: string]: string };
}

export class SecurityStack extends cdk.NestedStack {
  public readonly kmsKey: kms.Key;
  public readonly ec2InstanceRole: iam.Role;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // Create KMS key for encryption
    this.kmsKey = new kms.Key(this, 'MasterKMSKey', {
      description: `Master KMS key for ${props.environmentSuffix} environment`,
      enableKeyRotation: true,
      alias: `alias/${props.environmentSuffix}-master-key-v4`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Grant CloudTrail permission to use the KMS key
    this.kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Enable CloudTrail to encrypt logs',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['kms:GenerateDataKey*', 'kms:DescribeKey'],
        resources: ['*'],
      })
    );

    // Create IAM role for EC2 instances
    this.ec2InstanceRole = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
      inlinePolicies: {
        KMSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
              resources: [this.kmsKey.keyArn],
            }),
          ],
        }),
        SecretsAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ],
              resources: [
                `arn:aws:secretsmanager:*:*:secret:${props.environmentSuffix}/rds/credentials-v4*`,
              ],
            }),
          ],
        }),
      },
    });

    // Create IAM policy for MFA requirement
    new iam.ManagedPolicy(this, 'RequireMFAPolicy', {
      managedPolicyName: `${props.environmentSuffix}-require-mfa-v4`,
      description: 'Requires MFA for console access',
      document: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'AllowViewAccountInfo',
            effect: iam.Effect.ALLOW,
            actions: [
              'iam:GetAccountPasswordPolicy',
              'iam:ListVirtualMFADevices',
              'iam:ListUsers',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'AllowManageOwnPasswords',
            effect: iam.Effect.ALLOW,
            actions: ['iam:ChangePassword', 'iam:GetUser'],
            resources: ['arn:aws:iam::*:user/${aws:username}'],
          }),
          new iam.PolicyStatement({
            sid: 'AllowManageOwnAccessKeys',
            effect: iam.Effect.ALLOW,
            actions: [
              'iam:CreateAccessKey',
              'iam:DeleteAccessKey',
              'iam:ListAccessKeys',
              'iam:UpdateAccessKey',
            ],
            resources: ['arn:aws:iam::*:user/${aws:username}'],
          }),
          new iam.PolicyStatement({
            sid: 'AllowManageOwnMFA',
            effect: iam.Effect.ALLOW,
            actions: [
              'iam:CreateVirtualMFADevice',
              'iam:DeleteVirtualMFADevice',
              'iam:EnableMFADevice',
              'iam:ListMFADevices',
              'iam:ResyncMFADevice',
              'iam:DeactivateMFADevice',
            ],
            resources: [
              'arn:aws:iam::*:mfa/${aws:username}',
              'arn:aws:iam::*:user/${aws:username}',
            ],
          }),
          new iam.PolicyStatement({
            sid: 'DenyAllExceptListedIfNoMFA',
            effect: iam.Effect.DENY,
            notActions: [
              'iam:CreateVirtualMFADevice',
              'iam:EnableMFADevice',
              'iam:GetUser',
              'iam:ListMFADevices',
              'iam:ListVirtualMFADevices',
              'iam:ResyncMFADevice',
              'sts:GetSessionToken',
            ],
            resources: ['*'],
            conditions: {
              BoolIfExists: {
                'aws:MultiFactorAuthPresent': 'false',
              },
            },
          }),
        ],
      }),
    });
  }
}
