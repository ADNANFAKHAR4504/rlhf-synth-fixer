import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface NotificationConstructProps {
  environmentSuffix: string;
  environment: string;
  tags: { [key: string]: string };
}

export class NotificationConstruct extends Construct {
  public readonly pipelineStateTopic: sns.Topic;
  public readonly approvalTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: NotificationConstructProps) {
    super(scope, id);

    const { environmentSuffix, environment, tags } = props;

    // Create SNS topic for pipeline state changes
    this.pipelineStateTopic = new sns.Topic(
      this,
      `PipelineStateTopic-${environmentSuffix}`,
      {
        topicName: `pipeline-state-${environment}-${environmentSuffix}`,
        displayName: `Pipeline State Notifications - ${environment}`,
      }
    );

    // Create SNS topic for approval notifications
    this.approvalTopic = new sns.Topic(
      this,
      `ApprovalTopic-${environmentSuffix}`,
      {
        topicName: `pipeline-approval-${environment}-${environmentSuffix}`,
        displayName: `Pipeline Approval Notifications - ${environment}`,
      }
    );

    // Apply tags
    [this.pipelineStateTopic, this.approvalTopic].forEach(topic => {
      Object.entries(tags).forEach(([key, value]) => {
        cdk.Tags.of(topic).add(key, value);
      });
    });

    // Outputs
    new cdk.CfnOutput(this, 'PipelineStateTopicArn', {
      value: this.pipelineStateTopic.topicArn,
      description: 'ARN of the pipeline state notification topic',
    });

    new cdk.CfnOutput(this, 'ApprovalTopicArn', {
      value: this.approvalTopic.topicArn,
      description: 'ARN of the approval notification topic',
    });
  }
}
