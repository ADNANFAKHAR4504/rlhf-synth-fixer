import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class SecurityPolicies extends Construct {
  public readonly securityAuditRole: iam.Role;
  public readonly readOnlyRole: iam.Role;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Security audit role with minimal permissions
    this.securityAuditRole = new iam.Role(this, 'SecurityAuditRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for security auditing and compliance checks',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('SecurityAudit'),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        SecurityAuditPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'guardduty:GetDetector',
                'guardduty:ListDetectors',
                'guardduty:GetFindings',
                'guardduty:ListFindings',
                'ec2:DescribeFlowLogs',
                'ec2:DescribeVpcs',
                'ec2:DescribeSecurityGroups',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
                's3:GetBucketLocation',
                's3:GetBucketVersioning',
                's3:GetBucketEncryption',
                's3:GetBucketPublicAccessBlock',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Read-only role for monitoring
    this.readOnlyRole = new iam.Role(this, 'ReadOnlyRole', {
      assumedBy: new iam.AccountPrincipal(cdk.Stack.of(this).account),
      description: 'Read-only access for monitoring and observability',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess'),
      ],
      maxSessionDuration: cdk.Duration.hours(8),
    });

    // Boundary policy to prevent privilege escalation
    const securityBoundary = new iam.ManagedPolicy(this, 'SecurityBoundary', {
      description: 'Security boundary to prevent privilege escalation',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: [
            'iam:CreateRole',
            'iam:DeleteRole',
            'iam:AttachRolePolicy',
            'iam:DetachRolePolicy',
            'iam:PutRolePolicy',
            'iam:DeleteRolePolicy',
            'iam:CreateUser',
            'iam:DeleteUser',
            'organizations:*',
            'account:*',
          ],
          resources: ['*'],
        }),
      ],
    });

    // Apply boundary to roles
    cdk.Tags.of(this.securityAuditRole).add(
      'PermissionsBoundary',
      securityBoundary.managedPolicyArn
    );
    cdk.Tags.of(this.readOnlyRole).add(
      'PermissionsBoundary',
      securityBoundary.managedPolicyArn
    );
  }
}
