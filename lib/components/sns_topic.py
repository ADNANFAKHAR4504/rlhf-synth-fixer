import pulumi
import pulumi_aws as aws
from typing import Optional
import json


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


class SNSTopic(pulumi.ComponentResource):
  def __init__(self, name: str,
               kms_key_id: pulumi.Output[str],
               email_endpoint: Optional[str] = None,
               opts: Optional[pulumi.ResourceOptions] = None):
    super().__init__("custom:aws:SNSTopic", name, None, opts)

    # Create SNS topic
    self.topic = aws.sns.Topic(
      f"{name}-topic",
      name=f"{name}-s3-notifications",
      kms_master_key_id=kms_key_id,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Create topic policy
    self.topic_policy = aws.sns.TopicPolicy(
      f"{name}-topic-policy",
      arn=self.topic.arn,
      policy=self.topic.arn.apply(lambda arn: _create_topic_policy(arn)),
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Create email subscription if email is provided
    if email_endpoint:
      self.email_subscription = aws.sns.TopicSubscription(
        f"{name}-email-subscription",
        topic_arn=self.topic.arn,
        protocol="email",
        endpoint=email_endpoint,
        opts=pulumi.ResourceOptions(parent=self)
      )

    self.register_outputs({
      "topic_arn": self.topic.arn,
      "topic_name": self.topic.name
    })
