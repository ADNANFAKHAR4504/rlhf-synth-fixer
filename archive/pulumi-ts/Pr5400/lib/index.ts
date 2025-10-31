import * as pulumi from '@pulumi/pulumi';
import { DataPipelineEnvironment } from './environment-component';

const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  pulumi.getStack();
const environment = pulumi.getStack();
const awsRegion = 'us-east-1';

// Create the environment infrastructure
const pipelineEnv = new DataPipelineEnvironment(
  `data-pipeline-${environment}`,
  {
    environment: environment,
    environmentSuffix: environmentSuffix,
    region: awsRegion,
    tags: {
      Environment: environment,
      Project: 'MultiEnvDataPipeline',
      ManagedBy: 'Pulumi',
    },
  }
);

// Export outputs
export const bucketName = pipelineEnv.bucket.id;
export const bucketArn = pipelineEnv.bucket.arn;
export const tableName = pipelineEnv.table.name;
export const tableArn = pipelineEnv.table.arn;
export const successTopicArn = pipelineEnv.successTopic.arn;
export const failureTopicArn = pipelineEnv.failureTopic.arn;
export const dlqUrl = pipelineEnv.dlq.url;
export const dlqArn = pipelineEnv.dlq.arn;

// Production-specific exports (only defined if prod stack)
export const replicationFunctionArn = pipelineEnv.replicationFunction?.arn;
export const replicationFunctionName = pipelineEnv.replicationFunction?.name;
export const eventRuleArn = pipelineEnv.eventRule?.arn;
export const eventRuleName = pipelineEnv.eventRule?.name;
