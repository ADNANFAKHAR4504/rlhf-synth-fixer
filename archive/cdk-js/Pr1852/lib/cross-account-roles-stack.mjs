import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as organizations from 'aws-cdk-lib/aws-organizations';

export class CrossAccountRolesStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    
    // Get environment suffix for resource naming
    const environmentSuffix = props.environmentSuffix || props.stageName || 'dev';

    // Cross-account deployment role
    const crossAccountDeploymentRole = new iam.Role(this, 'CrossAccountDeploymentRole', {
      roleName: `CrossAccountDeployRole-${environmentSuffix}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.AccountPrincipal(props.managementAccountId),
        new iam.ServicePrincipal('codebuild.amazonaws.com'),
        new iam.ServicePrincipal('codepipeline.amazonaws.com')
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess')
      ],
      inlinePolicies: {
        CrossAccountDeploymentPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'iam:CreateRole',
                'iam:DeleteRole',
                'iam:AttachRolePolicy',
                'iam:DetachRolePolicy',
                'iam:PutRolePolicy',
                'iam:DeleteRolePolicy',
                'iam:PassRole'
              ],
              resources: [
                `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/cdk-*`,
                `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/*-CrossAccount*`
              ]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'organizations:ListAccounts',
                'organizations:DescribeAccount',
                'organizations:ListAccountsForParent',
                'organizations:ListOrganizationalUnitsForParent'
              ],
              resources: ['*']
            })
          ]
        })
      }
    });

    // CloudFormation execution role
    const cloudFormationExecutionRole = new iam.Role(this, 'CloudFormationExecutionRole', {
      roleName: `CfnExecutionRole-${environmentSuffix}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('cloudformation.amazonaws.com'),
        new iam.AccountPrincipal(props.managementAccountId)
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess')
      ]
    });

    // Governance read-only role for compliance monitoring
    const governanceReadOnlyRole = new iam.Role(this, 'GovernanceReadOnlyRole', {
      roleName: `GovReadOnlyRole-${environmentSuffix}`,
      assumedBy: new iam.OrganizationPrincipal(props.organizationId),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('SecurityAudit')
      ],
      inlinePolicies: {
        ComplianceMonitoring: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'config:GetConfigRule',
                'config:GetComplianceDetailsByConfigRule',
                'config:GetComplianceSummaryByConfigRule',
                'controltower:GetEnabledBaseline',
                'controltower:ListEnabledBaselines'
              ],
              resources: ['*']
            })
          ]
        })
      }
    });

    // Output role ARNs for reference
    new cdk.CfnOutput(this, 'CrossAccountDeploymentRoleArn', {
      value: crossAccountDeploymentRole.roleArn,
      description: 'ARN of the cross-account deployment role',
      exportName: `CrossAccountDeployRoleArn-${environmentSuffix}`
    });

    new cdk.CfnOutput(this, 'CloudFormationExecutionRoleArn', {
      value: cloudFormationExecutionRole.roleArn,
      description: 'ARN of the CloudFormation execution role',
      exportName: `CfnExecutionRoleArn-${environmentSuffix}`
    });
  }
}