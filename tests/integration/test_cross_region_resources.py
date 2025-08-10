"""Integration tests for cross-region resources"""

import json
import os
import time
import unittest

import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Import utility function for flat outputs
from tests.utils import load_flat_outputs

# Load CloudFormation outputs
flat_outputs = load_flat_outputs()


@mark.describe("Cross-Region Resources Integration Tests")
class TestCrossRegionResources(unittest.TestCase):
  """Integration test cases for cross-region resources"""

  def setUp(self):
    """Set up AWS clients for both regions"""
    self.environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
    self.eu_west_session = boto3.Session(region_name='eu-west-1')
    self.eu_central_session = boto3.Session(region_name='eu-central-1')

    # Initialize S3 clients
    self.eu_west_s3 = self.eu_west_session.client('s3')
    self.eu_central_s3 = self.eu_central_session.client('s3')

    # Initialize Lambda clients
    self.eu_west_lambda = self.eu_west_session.client('lambda')
    self.eu_central_lambda = self.eu_central_session.client('lambda')

    # Initialize SNS clients
    self.eu_west_sns = self.eu_west_session.client('sns')
    self.eu_central_sns = self.eu_central_session.client('sns')

  def _get_output_value(self, stack_name, output_key):
    """Helper method to get CloudFormation output values"""
    return flat_outputs.get(f"{stack_name}.{output_key}")

  def _get_bucket_name(self, region, bucket_type='SSE-S3'):
    """Helper method to get S3 bucket name for a region"""
    stack_name = f"MultiRegionStack-{region.upper()}-{self.environment_suffix}"
    output_key = 'S3BucketSSES3Name' if bucket_type == 'SSE-S3' else 'S3BucketSSEKMSName'
    return self._get_output_value(stack_name, output_key)

  def _get_sns_topic_arn(self, region):
    """Helper method to get SNS topic ARN for a region"""
    stack_name = f"MultiRegionStack-{region.upper()}-{self.environment_suffix}"
    return self._get_output_value(stack_name, 'SNSTopicArn')

  @mark.it("Cross-region data transfer between S3 buckets")
  def test_cross_region_s3_transfer(self):
    """Test cross-region data transfer between S3 buckets"""
    eu_west_bucket = self._get_bucket_name('eu-west')
    eu_central_bucket = self._get_bucket_name('eu-central')

    if not eu_west_bucket or not eu_central_bucket:
      self.skipTest("S3 buckets not found in one or both regions")

    # Create a test object in the EU West bucket
    test_data = {"source": "eu-west", "timestamp": str(time.time())}
    test_key = f"cross-region-test-{int(time.time())}.json"

    # Put object in EU West bucket
    self.eu_west_s3.put_object(
        Bucket=eu_west_bucket,
        Key=test_key,
        Body=json.dumps(test_data),
        ContentType='application/json'
    )

    # Use the S3 copy operation to copy the object to EU Central
    self.eu_central_s3.copy_object(
        Bucket=eu_central_bucket,
        Key=test_key,
        CopySource={
            'Bucket': eu_west_bucket,
            'Key': test_key
        }
    )

    # Verify the object exists in EU Central
    response = self.eu_central_s3.get_object(
        Bucket=eu_central_bucket,
        Key=test_key
    )

    # Get object content
    content = json.loads(response['Body'].read().decode('utf-8'))

    # Verify content matches test data
    self.assertEqual(content, test_data)

    # Clean up test objects
    self.eu_west_s3.delete_object(
        Bucket=eu_west_bucket,
        Key=test_key
    )

    self.eu_central_s3.delete_object(
        Bucket=eu_central_bucket,
        Key=test_key
    )

  @mark.it("SNS cross-region subscription")
  def test_sns_cross_region_subscription(self):
    """Test SNS cross-region subscription capabilities"""
    eu_west_topic_arn = self._get_sns_topic_arn('eu-west')
    eu_central_topic_arn = self._get_sns_topic_arn('eu-central')

    if not eu_west_topic_arn or not eu_central_topic_arn:
      self.skipTest("SNS topics not found in one or both regions")

    # Create an SQS queue in EU Central to subscribe to the EU West topic
    sqs = self.eu_central_session.client('sqs')
    queue_name = f"cross-region-test-{self.environment_suffix}-{int(time.time())}"

    # Create queue
    queue_response = sqs.create_queue(
        QueueName=queue_name,
        Attributes={
            'MessageRetentionPeriod': '60'  # 1 minute retention
        }
    )
    queue_url = queue_response['QueueUrl']

    try:
      # Get queue ARN
      queue_attrs = sqs.get_queue_attributes(
          QueueUrl=queue_url,
          AttributeNames=['QueueArn']
      )
      queue_arn = queue_attrs['Attributes']['QueueArn']

      # Create a policy that allows the SNS topic to send messages to the queue
      policy = {
          "Version": "2012-10-17",
          "Statement": [{
              "Effect": "Allow",
              "Principal": "*",
              "Action": "sqs:SendMessage",
              "Resource": queue_arn,
              "Condition": {
                  "ArnEquals": {
                      "aws:SourceArn": eu_west_topic_arn
                  }
              }
          }]
      }

      # Apply the policy to the queue
      sqs.set_queue_attributes(
          QueueUrl=queue_url,
          Attributes={
              'Policy': json.dumps(policy)
          }
      )

      # Subscribe the queue to the SNS topic
      # Store subscription ARN but we don't need to use it
      subscription_arn = self.eu_west_sns.subscribe(
          TopicArn=eu_west_topic_arn,
          Protocol='sqs',
          Endpoint=queue_arn
      ).get('SubscriptionArn')

      # Wait for subscription to be confirmed
      time.sleep(5)

      # Publish a message to the SNS topic
      test_message = {
          "default": json.dumps({
              "message": "Cross-region test message",
              "timestamp": str(time.time())
          })
      }

      # Store message ID for potential future use
      message_id = self.eu_west_sns.publish(
          TopicArn=eu_west_topic_arn,
          Message=json.dumps(test_message),
          MessageStructure='json'
      ).get('MessageId')

      # Wait for message to be delivered
      time.sleep(10)

      # Check if message was received
      receive_response = sqs.receive_message(
          QueueUrl=queue_url,
          MaxNumberOfMessages=1,
          WaitTimeSeconds=5
      )

      # Verify that a message was received
      self.assertIn('Messages', receive_response,
                    "No message received from cross-region SNS topic")

      # Clean up by deleting the message
      if 'Messages' in receive_response:
        for message in receive_response['Messages']:
          sqs.delete_message(
              QueueUrl=queue_url,
              ReceiptHandle=message['ReceiptHandle']
          )

    finally:
      # Clean up the SQS queue
      sqs.delete_queue(QueueUrl=queue_url)


if __name__ == '__main__':
  unittest.main()
