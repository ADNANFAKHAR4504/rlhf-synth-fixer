import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class SecurityStack extends cdk.Stack {
  public readonly encryptionKey: kms.Key;
  public readonly ec2Role: iam.Role;
  public readonly rdsRole: iam.Role;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // Note: IAM roles are global, so we make names unique per stack
    const region = props.env?.region || 'us-east-1';
    const regionSuffix = region.replace(/-/g, '');

    // Create KMS key for encryption
    this.encryptionKey = new kms.Key(
      this,
      `secure-${props.environmentSuffix}-key`,
      {
        keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
        keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
        description: `Encryption key for secure infrastructure ${props.environmentSuffix}`,
        enableKeyRotation: true,
        rotationPeriod: cdk.Duration.days(365),
      }
    );

    this.encryptionKey.addAlias(
      `alias/secure-${props.environmentSuffix}-key-${regionSuffix}`
    );

    this.ec2Role = new iam.Role(
      this,
      `secure-${props.environmentSuffix}-ec2-role`,
      {
        roleName: `secure-${props.environmentSuffix}-ec2-role-${regionSuffix}`,
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'CloudWatchAgentServerPolicy'
          ),
        ],
      }
    );

    // Add specific permissions for CloudWatch metrics and logs
    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudwatch:PutMetricData',
          'logs:PutLogEvents',
          'logs:CreateLogStream',
          'logs:CreateLogGroup',
        ],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'aws:RequestedRegion': [props.env?.region || 'us-east-1'],
          },
        },
      })
    );

    // IAM role for RDS with minimal permissions
    this.rdsRole = new iam.Role(
      this,
      `secure-${props.environmentSuffix}-rds-role`,
      {
        roleName: `secure-${props.environmentSuffix}-rds-role-${regionSuffix}`,
        assumedBy: new iam.ServicePrincipal('rds.amazonaws.com'),
      }
    );

    // Note: Security Hub will be enabled if not already enabled
    // We skip this resource creation as it may already exist in the account
    // In production, Security Hub should be managed at the organization level

    // Apply tags
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('ProjectName', 'secure-infrastructure');
    cdk.Tags.of(this).add('CostCenter', 'security-team');
  }
}
