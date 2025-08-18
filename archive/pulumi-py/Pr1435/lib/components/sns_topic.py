from typing import Optional
import json
import dataclasses
import pulumi
import pulumi_aws as aws


def _create_topic_policy(topic_arn: str) -> str:
  current = aws.get_caller_identity()

  policy = {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "s3.amazonaws.com"
        },
        "Action": "sns:Publish",
        "Resource": topic_arn,
        "Condition": {
          "StringEquals": {
            "aws:SourceAccount": current.account_id
          }
        }
      }
    ]
  }

  return json.dumps(policy)


@dataclasses.dataclass
class SNSTopicConfig:
  kms_key_id: pulumi.Output[str]
  email_endpoint: Optional[str] = None
  tags: Optional[dict] = None


class SNSTopic(pulumi.ComponentResource):
  def __init__(self, name: str,
               config: SNSTopicConfig,
               opts: Optional[pulumi.ResourceOptions] = None):
    super().__init__("custom:aws:SNSTopic", name, None, opts)

    # Apply default tags
    default_tags = {
      "Name": f"{name}-sns-topic",
      "Component": "SNSTopic",
      "Purpose": "S3 event notifications"
    }
    if config.tags:
      default_tags.update(config.tags)

    # Create SNS topic
    self.topic = aws.sns.Topic(
      f"{name}-topic",
      name=f"{name}-s3-notifications",
      kms_master_key_id=config.kms_key_id,
      tags=default_tags,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Create topic policy to allow S3 to publish to SNS
    self.topic_policy = aws.sns.TopicPolicy(
      f"{name}-topic-policy",
      arn=self.topic.arn,
      policy=self.topic.arn.apply(_create_topic_policy),
      opts=pulumi.ResourceOptions(
        parent=self,
        depends_on=[self.topic]
      )
    )

    # Create email subscription if email is provided
    if config.email_endpoint:
      self.email_subscription = aws.sns.TopicSubscription(
        f"{name}-email-subscription",
        topic_arn=self.topic.arn,
        protocol="email",
        endpoint=config.email_endpoint,
        opts=pulumi.ResourceOptions(parent=self)
      )

    self.register_outputs({
      "topic_arn": self.topic.arn,
      "topic_name": self.topic.name
    })
