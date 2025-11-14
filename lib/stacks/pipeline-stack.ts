import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as pipelines from 'aws-cdk-lib/pipelines';
import { EnvironmentConfigurations } from '../config/environment-config';
import { TradingPlatformStage } from './trading-platform-stage';

export interface PipelineStackProps extends cdk.StackProps {
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    // Define the pipeline using modern CodePipeline API
    const pipeline = new pipelines.CodePipeline(
      this,
      'TradingPlatformPipeline',
      {
        pipelineName: 'trading-platform-pipeline',
        synth: new pipelines.ShellStep('Synth', {
          input: pipelines.CodePipelineSource.gitHub(
            `${props.githubOwner}/${props.githubRepo}`,
            props.githubBranch,
            {
              authentication: cdk.SecretValue.secretsManager('github-token'),
            }
          ),
          commands: [
            'npm ci',
            'cd lib/lambda/order-processing && npm ci && cd ../../..',
            'npm run build',
            'npx cdk synth',
          ],
        }),
      }
    );

    // Add development stage
    pipeline.addStage(
      new TradingPlatformStage(this, 'Dev', {
        env: EnvironmentConfigurations.DEV.env,
        environmentConfig: EnvironmentConfigurations.DEV,
      })
    );

    // Add validation step after dev deployment (commented out - requires live outputs)
    // devStage.addPost(
    //   new pipelines.ShellStep('ValidateDev', {
    //     commands: ['curl -f $API_ENDPOINT/health || exit 1'],
    //   })
    // );

    // Add staging stage with manual approval
    const stagingStage = pipeline.addStage(
      new TradingPlatformStage(this, 'Staging', {
        env: EnvironmentConfigurations.STAGING.env,
        environmentConfig: EnvironmentConfigurations.STAGING,
      })
    );

    stagingStage.addPre(
      new pipelines.ManualApprovalStep('PromoteToProduction')
    );

    // Add production stage
    pipeline.addStage(
      new TradingPlatformStage(this, 'Prod', {
        env: EnvironmentConfigurations.PROD.env,
        environmentConfig: EnvironmentConfigurations.PROD,
      })
    );

    // Add post-deployment validation for production (commented out - requires live outputs)
    // prodStage.addPost(
    //   new pipelines.ShellStep('ValidateProduction', {
    //     commands: [
    //       'curl -f $API_ENDPOINT/health || exit 1',
    //       'npm run smoke-tests || exit 1',
    //     ],
    //   })
    // );
  }
}
