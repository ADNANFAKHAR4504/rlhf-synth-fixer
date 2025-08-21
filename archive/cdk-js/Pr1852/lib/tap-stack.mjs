import * as cdk from 'aws-cdk-lib';
import { MultiAccountPipelineStack } from './multi-account-pipeline-stack.mjs';
import { DriftDetectionStack } from './drift-detection.mjs';
import { SharedInfrastructureStack } from './shared-infrastructure-stack.mjs';
import { CrossAccountRolesStack } from './cross-account-roles-stack.mjs';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Default account configuration for demo purposes
    const defaultAccountConfig = {
      department: 'IT',
      project: 'MultiAccountInfrastructure',
      environment: environmentSuffix,
      owner: 'InfrastructureTeam',
      costCenter: 'IT-OPS',
      complianceRequired: 'true',
      backupRequired: 'false',
      monitoringLevel: 'standard'
    };

    // For single-account deployment, create shared infrastructure directly
    if (!props?.multiAccountMode) {
      new SharedInfrastructureStack(this, 'SharedInfrastructure', {
        stageName: environmentSuffix,
        environmentSuffix: environmentSuffix,
        accountConfig: defaultAccountConfig,
        env: props?.env
      });
      
      // Commented out due to AWS IAM quota limits (1001 roles max reached)
      // new CrossAccountRolesStack(this, 'CrossAccountRoles', {
      //   managementAccountId: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
      //   organizationId: process.env.AWS_ORGANIZATION_ID || 'o-example123',
      //   stageName: environmentSuffix,
      //   environmentSuffix: environmentSuffix,
      //   env: props?.env
      // });

      // Commented out due to AWS IAM quota limits and Lambda deployment issues
      // new DriftDetectionStack(this, 'DriftDetection', {
      //   targetAccounts: [process.env.CDK_DEFAULT_ACCOUNT || '123456789012'],
      //   targetRegions: [process.env.CDK_DEFAULT_REGION || 'us-east-1'],
      //   crossAccountRoleTemplate: `arn:aws:iam::{account}:role/CrossAccountDeployRole-${environmentSuffix}`,
      //   environmentSuffix: environmentSuffix,
      //   env: props?.env
      // });
    } else {
      // For multi-account deployment, create the pipeline
      new MultiAccountPipelineStack(this, 'MultiAccountPipeline', {
        managementAccountId: props.managementAccountId || process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
        targetAccounts: props.targetAccounts || {
          development: [
            {
              accountId: '111111111111',
              region: 'us-east-1',
              ...defaultAccountConfig,
              environment: 'development'
            }
          ],
          staging: [
            {
              accountId: '222222222222', 
              region: 'us-east-1',
              ...defaultAccountConfig,
              environment: 'staging'
            }
          ],
          production: [
            {
              accountId: '333333333333',
              region: 'us-east-1', 
              ...defaultAccountConfig,
              environment: 'production'
            }
          ]
        },
        env: props?.env
      });
    }
  }
}

export { TapStack };
