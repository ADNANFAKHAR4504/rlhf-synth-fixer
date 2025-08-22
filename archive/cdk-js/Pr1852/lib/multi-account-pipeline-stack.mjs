import * as cdk from 'aws-cdk-lib';
import * as pipelines from 'aws-cdk-lib/pipelines';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as iam from 'aws-cdk-lib/aws-iam';
import { SharedInfrastructureStack } from './shared-infrastructure-stack.mjs';
import { CrossAccountRolesStack } from './cross-account-roles-stack.mjs';

export class MultiAccountPipelineStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    
    // Get environment suffix for resource naming
    const environmentSuffix = props.environmentSuffix || 'dev';

    const repo = new codecommit.Repository(this, 'InfraRepository', {
      repositoryName: `multi-account-infra-${environmentSuffix}`,
      description: 'Repository for multi-account infrastructure deployments'
    });

    const pipeline = new pipelines.CodePipeline(this, 'MultiAccountPipeline', {
      pipelineName: `MultiAccountPipeline-${environmentSuffix}`,
      synth: new pipelines.ShellStep('Synth', {
        input: pipelines.CodePipelineSource.codeCommit(repo, 'main'),
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth'
        ]
      }),
      codeBuildDefaults: {
        buildEnvironment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          computeType: codebuild.ComputeType.SMALL,
          environmentVariables: {
            CDK_DEFAULT_REGION: { value: 'us-east-1' },
            CDK_DEFAULT_ACCOUNT: { value: props.managementAccountId }
          }
        }
      },
      crossAccountKeys: true,
      enableKeyRotation: true
    });

    // Development Environment Wave
    const devWave = pipeline.addWave('Development');
    
    if (props.targetAccounts?.development) {
      props.targetAccounts.development.forEach((accountConfig, index) => {
      const devStage = new MultiAccountStage(this, `Dev-${accountConfig.accountId}`, {
        env: {
          account: accountConfig.accountId,
          region: accountConfig.region
        },
        stageName: 'development',
        accountConfig,
        environmentSuffix
      });
      devWave.addStage(devStage);
      });
    }

    // Staging Environment Wave  
    const stagingWave = pipeline.addWave('Staging');
    
    if (props.targetAccounts?.staging) {
      props.targetAccounts.staging.forEach((accountConfig, index) => {
      const stagingStage = new MultiAccountStage(this, `Staging-${accountConfig.accountId}`, {
        env: {
          account: accountConfig.accountId,
          region: accountConfig.region
        },
        stageName: 'staging',
        accountConfig,
        environmentSuffix
      });
      stagingWave.addStage(stagingStage);
      });
    }

    // Production Environment Wave
    const prodWave = pipeline.addWave('Production');
    
    if (props.targetAccounts?.production) {
      props.targetAccounts.production.forEach((accountConfig, index) => {
      const prodStage = new MultiAccountStage(this, `Prod-${accountConfig.accountId}`, {
        env: {
          account: accountConfig.accountId,
          region: accountConfig.region
        },
        stageName: 'production',
        accountConfig,
        environmentSuffix
      });
      
      // Add manual approval for production deployments
      prodWave.addStage(prodStage, {
        pre: [
          new pipelines.ManualApprovalStep(`ApproveProduction-${accountConfig.accountId}`, {
            comment: `Approve deployment to production account ${accountConfig.accountId}`
          })
        ]
      });
    });
    }

    // Build the pipeline
    pipeline.buildPipeline();
  }
}

class MultiAccountStage extends cdk.Stage {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Deploy cross-account roles first
    new CrossAccountRolesStack(this, 'CrossAccountRoles', {
      managementAccountId: props.accountConfig.managementAccountId || process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
      organizationId: props.accountConfig.organizationId || 'o-example123',
      stageName: props.stageName,
      environmentSuffix: props.environmentSuffix,
      env: props.env
    });

    // Deploy shared infrastructure
    new SharedInfrastructureStack(this, 'SharedInfrastructure', {
      stageName: props.stageName,
      accountConfig: props.accountConfig,
      environmentSuffix: props.environmentSuffix,
      env: props.env
    });
  }
}