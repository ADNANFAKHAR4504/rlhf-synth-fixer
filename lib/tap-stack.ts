import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CicdPipelineConstruct } from './constructs/cicd-pipeline-construct';
import { NotificationConstruct } from './constructs/notification-construct';
import { RollbackConstruct } from './constructs/rollback-construct';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  environment: 'dev' | 'staging' | 'prod';
  projectName?: string;
  ownerTag?: string;
  crossAccountRoleArn?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const {
      environmentSuffix,
      environment,
      projectName = 'cicd-pipeline',
      ownerTag = 'devops-team',
      crossAccountRoleArn,
    } = props;

    // Common tags for all resources
    const commonTags = {
      Environment: environment,
      Project: projectName,
      Owner: ownerTag,
    };

    // Create notification construct
    const notificationConstruct = new NotificationConstruct(
      this,
      'NotificationConstruct',
      {
        environmentSuffix,
        environment,
        tags: commonTags,
      }
    );

    // Create CI/CD pipeline construct
    const pipelineConstruct = new CicdPipelineConstruct(
      this,
      'CicdPipelineConstruct',
      {
        environmentSuffix,
        environment,
        projectName,
        crossAccountRoleArn,
        notificationTopic: notificationConstruct.pipelineStateTopic,
        approvalTopic: notificationConstruct.approvalTopic,
        tags: commonTags,
      }
    );

    // Create rollback construct (only for staging and prod)
    if (environment === 'staging' || environment === 'prod') {
      new RollbackConstruct(this, 'RollbackConstruct', {
        environmentSuffix,
        environment,
        pipeline: pipelineConstruct.pipeline,
        notificationTopic: notificationConstruct.pipelineStateTopic,
        tags: commonTags,
      });
    }

    // Apply tags to all resources in the stack
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Outputs
    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipelineConstruct.pipeline.pipelineName,
      description: 'Name of the CodePipeline',
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: pipelineConstruct.artifactBucket.bucketName,
      description: 'Name of the S3 artifact bucket',
    });

    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: notificationConstruct.pipelineStateTopic.topicArn,
      description: 'ARN of the notification SNS topic',
    });
  }
}
