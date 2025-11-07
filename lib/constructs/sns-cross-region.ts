import { CustomResource, Duration } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface SnsCrossRegionProps {
  readonly topicName: string;
  readonly displayName: string;
  readonly drRegion: string;
  readonly environmentSuffix: string;
  readonly isPrimary?: boolean;
}

export class SnsCrossRegion extends Construct {
  public readonly topic: sns.Topic;

  constructor(scope: Construct, id: string, props: SnsCrossRegionProps) {
    super(scope, id);

    // Create SNS topic
    this.topic = new sns.Topic(this, 'Topic', {
      topicName: props.topicName,
      displayName: props.displayName,
    });

    // Add tags
    const tags = {
      Project: 'iac-rlhf-amazon',
      Environment: props.environmentSuffix,
      Component: 'SNS',
      TopicType: props.isPrimary ? 'Primary' : 'DR',
    };

    Object.entries(tags).forEach(([key, value]) => {
      this.topic.node.addMetadata('aws:cdk:tagging', { [key]: value });
    });

    // If this is the primary topic, set up cross-region subscription
    if (props.isPrimary) {
      this.setupCrossRegionSubscription(props.drRegion);
    }
  }

  private setupCrossRegionSubscription(drRegion: string): void {
    // Create Lambda function to set up cross-region subscription
    const subscriptionSetupFunction = new lambda.Function(
      this,
      'SubscriptionSetup',
      {
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import boto3
import json
import cfnresponse

def handler(event, context):
    try:
        if event['RequestType'] == 'Delete':
            # Don't try to clean up subscriptions on delete
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
            return
            
        topic_arn = event['ResourceProperties']['TopicArn']
        dr_region = event['ResourceProperties']['DRRegion']
        
        # Extract topic name from ARN
        topic_name = topic_arn.split(':')[-1]
        dr_topic_name = topic_name.replace('east-1', 'west-2')  # Adjust naming pattern
        
        # Construct DR topic ARN
        account_id = boto3.client('sts').get_caller_identity()['Account']
        dr_topic_arn = f"arn:aws:sns:{dr_region}:{account_id}:{dr_topic_name}"
        
        # Subscribe DR topic to primary topic
        sns = boto3.client('sns')
        
        response = sns.subscribe(
            TopicArn=topic_arn,
            Protocol='sns',
            Endpoint=dr_topic_arn
        )
        
        subscription_arn = response['SubscriptionArn']
        
        cfnresponse.send(event, context, cfnresponse.SUCCESS, {
            'SubscriptionArn': subscription_arn
        })
    except Exception as e:
        print(f"Error setting up cross-region subscription: {str(e)}")
        # Don't fail the stack for subscription issues
        cfnresponse.send(event, context, cfnresponse.SUCCESS, {
            'Error': str(e)
        })
      `),
        timeout: Duration.minutes(2),
      }
    );

    // Grant SNS permissions
    subscriptionSetupFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'sns:Subscribe',
          'sns:Unsubscribe',
          'sns:ListSubscriptionsByTopic',
          'sts:GetCallerIdentity',
        ],
        resources: ['*'], // SNS cross-region requires broad permissions
      })
    );

    // Create custom resource
    new CustomResource(this, 'CrossRegionSubscription', {
      serviceToken: subscriptionSetupFunction.functionArn,
      properties: {
        TopicArn: this.topic.topicArn,
        DRRegion: drRegion,
      },
    });
  }
}
