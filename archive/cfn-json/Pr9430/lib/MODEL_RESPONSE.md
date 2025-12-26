# Healthcare Appointment Reminder System Infrastructure

Here's the complete infrastructure code for your healthcare appointment reminder system:

## CloudFormation Template (template.json)

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Healthcare appointment reminder system with SMS notifications",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming",
      "AllowedPattern": "^[a-zA-Z0-9]+$"
    },
    "SenderEmail": {
      "Type": "String",
      "Description": "Verified SES email for fallback notifications",
      "Default": "noreply@healthcare.example.com"
    }
  },
  "Resources": {
    "AppointmentReminderTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "appointment-reminders-${EnvironmentSuffix}"
        },
        "DisplayName": "Healthcare Appointment Reminders",
        "KmsMasterKeyId": "alias/aws/sns"
      }
    },
    "DeliveryLogsTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "sms-delivery-logs-${EnvironmentSuffix}"
        },
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
          {
            "AttributeName": "patientId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "timestamp",
            "AttributeType": "N"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "patientId",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "timestamp",
            "KeyType": "RANGE"
          }
        ],
        "TimeToLiveSpecification": {
          "AttributeName": "ttl",
          "Enabled": true
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "NotificationHandlerRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "NotificationHandlerPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish",
                    "sns:SetSMSAttributes",
                    "sns:GetSMSAttributes"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["DeliveryLogsTable", "Arn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "ses:SendEmail",
                    "ses:SendTemplatedEmail"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudwatch:PutMetricData"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    "NotificationHandlerFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "appointment-notification-handler-${EnvironmentSuffix}"
        },
        "Runtime": "python3.9",
        "Handler": "notification_handler.lambda_handler",
        "Code": {
          "ZipFile": {
            "Fn::Sub": |
              import json
              import boto3
              import os
              import time
              from datetime import datetime, timedelta
              from decimal import Decimal

              sns = boto3.client('sns', region_name='us-west-1')
              dynamodb = boto3.resource('dynamodb', region_name='us-west-1')
              ses = boto3.client('ses', region_name='us-west-1')
              cloudwatch = boto3.client('cloudwatch', region_name='us-west-1')

              table = dynamodb.Table('${DeliveryLogsTable}')

              def lambda_handler(event, context):
                  results = {'successful': 0, 'failed': 0, 'fallback': 0}

                  # Process batch of appointments
                  appointments = event.get('appointments', [])

                  for appointment in appointments:
                      success = send_notification(appointment)
                      if success:
                          results['successful'] += 1
                      else:
                          results['failed'] += 1

                  # Send metrics to CloudWatch
                  send_metrics(results)

                  return {
                      'statusCode': 200,
                      'body': json.dumps(results)
                  }

              def send_notification(appointment):
                  patient_id = appointment.get('patient_id')
                  phone = appointment.get('phone_number')
                  message = appointment.get('message')

                  for attempt in range(3):
                      try:
                          # Send SMS
                          response = sns.publish(
                              PhoneNumber=phone,
                              Message=message,
                              MessageAttributes={
                                  'AWS.SNS.SMS.SMSType': {
                                      'DataType': 'String',
                                      'StringValue': 'Transactional'
                                  }
                              }
                          )

                          # Log successful delivery
                          log_delivery(patient_id, phone, message, 'SUCCESS', attempt + 1)
                          return True

                      except Exception as e:
                          print(f"SMS attempt {attempt + 1} failed: {str(e)}")

                          if attempt == 2:
                              # Final attempt failed, try email fallback
                              send_email_fallback(appointment)
                              log_delivery(patient_id, phone, message, 'FAILED_WITH_FALLBACK', attempt + 1)
                              return False

                          # Wait before retry
                          time.sleep(2 ** attempt)

                  return False

              def log_delivery(patient_id, phone, message, status, retry_count):
                  timestamp = int(datetime.now().timestamp())
                  ttl = int((datetime.now() + timedelta(days=90)).timestamp())

                  table.put_item(
                      Item={
                          'patientId': patient_id,
                          'timestamp': timestamp,
                          'phoneNumber': phone,
                          'messageContent': message,
                          'deliveryStatus': status,
                          'retryCount': retry_count,
                          'ttl': ttl
                      }
                  )

              def send_email_fallback(appointment):
                  try:
                      ses.send_email(
                          Source=os.environ['SENDER_EMAIL'],
                          Destination={'ToAddresses': [appointment.get('email', '')]},
                          Message={
                              'Subject': {'Data': 'Appointment Reminder'},
                              'Body': {'Text': {'Data': appointment.get('message', '')}}
                          }
                      )
                  except Exception as e:
                      print(f"Email fallback failed: {str(e)}")

              def send_metrics(results):
                  cloudwatch.put_metric_data(
                      Namespace='AppointmentReminders',
                      MetricData=[
                          {
                              'MetricName': 'SuccessfulSMS',
                              'Value': results['successful'],
                              'Unit': 'Count'
                          },
                          {
                              'MetricName': 'FailedSMS',
                              'Value': results['failed'],
                              'Unit': 'Count'
                          }
                      ]
                  )
        },
        "Role": {
          "Fn::GetAtt": ["NotificationHandlerRole", "Arn"]
        },
        "Environment": {
          "Variables": {
            "TABLE_NAME": {
              "Ref": "DeliveryLogsTable"
            },
            "SENDER_EMAIL": {
              "Ref": "SenderEmail"
            },
            "TOPIC_ARN": {
              "Ref": "AppointmentReminderTopic"
            }
          }
        },
        "Timeout": 300,
        "MemorySize": 512,
        "ReservedConcurrentExecutions": 10
      }
    },
    "NotificationLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/appointment-notification-handler-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "FailureRateAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "sms-failure-rate-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when SMS failure rate exceeds 5%",
        "MetricName": "FailedSMS",
        "Namespace": "AppointmentReminders",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 0.05,
        "ComparisonOperator": "GreaterThanThreshold",
        "TreatMissingData": "notBreaching"
      }
    },
    "DeliveryMetricQueryAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "sms-delivery-metrics-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Monitor individual SMS delivery metrics",
        "Metrics": [
          {
            "Id": "m1",
            "MetricStat": {
              "Metric": {
                "Namespace": "AppointmentReminders",
                "MetricName": "SuccessfulSMS"
              },
              "Period": 300,
              "Stat": "Sum"
            },
            "ReturnData": false
          },
          {
            "Id": "m2",
            "MetricStat": {
              "Metric": {
                "Namespace": "AppointmentReminders",
                "MetricName": "FailedSMS"
              },
              "Period": 300,
              "Stat": "Sum"
            },
            "ReturnData": false
          },
          {
            "Id": "e1",
            "Expression": "m2/(m1+m2)*100",
            "Label": "Failure Rate Percentage",
            "ReturnData": true
          }
        ],
        "EvaluationPeriods": 2,
        "Threshold": 5,
        "ComparisonOperator": "GreaterThanThreshold",
        "TreatMissingData": "notBreaching"
      }
    },
    "SESEmailTemplate": {
      "Type": "AWS::SES::Template",
      "Properties": {
        "Template": {
          "TemplateName": {
            "Fn::Sub": "appointment-reminder-${EnvironmentSuffix}"
          },
          "SubjectPart": "Appointment Reminder - {{appointment_date}}",
          "TextPart": "Dear {{patient_name}},\n\nThis is a reminder for your appointment on {{appointment_date}} at {{appointment_time}}.\n\nLocation: {{location}}\n\nPlease arrive 15 minutes early.\n\nThank you,\nHealthcare Team",
          "HtmlPart": "<html><body><h2>Appointment Reminder</h2><p>Dear {{patient_name}},</p><p>This is a reminder for your appointment on <b>{{appointment_date}}</b> at <b>{{appointment_time}}</b>.</p><p>Location: {{location}}</p><p>Please arrive 15 minutes early.</p><p>Thank you,<br>Healthcare Team</p></body></html>"
        }
      }
    }
  },
  "Outputs": {
    "LambdaFunctionArn": {
      "Value": {
        "Fn::GetAtt": ["NotificationHandlerFunction", "Arn"]
      },
      "Description": "ARN of the notification handler Lambda function"
    },
    "DynamoDBTableName": {
      "Value": {
        "Ref": "DeliveryLogsTable"
      },
      "Description": "Name of the DynamoDB delivery logs table"
    },
    "SNSTopicArn": {
      "Value": {
        "Ref": "AppointmentReminderTopic"
      },
      "Description": "ARN of the SNS topic for SMS notifications"
    }
  }
}
```

## Lambda Function Code (notification_handler.py)

```python
import json
import boto3
import os
import time
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Any

# Initialize AWS clients
sns = boto3.client('sns', region_name='us-west-1')
dynamodb = boto3.resource('dynamodb', region_name='us-west-1')
ses = boto3.client('ses', region_name='us-west-1')
cloudwatch = boto3.client('cloudwatch', region_name='us-west-1')

# Get environment variables
TABLE_NAME = os.environ.get('TABLE_NAME', 'sms-delivery-logs-dev')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@healthcare.example.com')
TOPIC_ARN = os.environ.get('TOPIC_ARN', '')

# Initialize DynamoDB table
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for processing appointment notifications.

    Args:
        event: Contains list of appointments to process
        context: Lambda context object

    Returns:
        Response with status code and processing results
    """
    print(f"Processing batch of {len(event.get('appointments', []))} appointments")

    results = {
        'successful': 0,
        'failed': 0,
        'fallback': 0,
        'errors': []
    }

    # Validate input
    if 'appointments' not in event:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'No appointments provided'})
        }

    appointments = event['appointments']

    # Process each appointment
    for appointment in appointments:
        try:
            if validate_appointment(appointment):
                success = send_notification(appointment)
                if success:
                    results['successful'] += 1
                else:
                    results['failed'] += 1
            else:
                results['errors'].append(f"Invalid appointment data: {appointment.get('patient_id', 'unknown')}")
        except Exception as e:
            print(f"Error processing appointment: {str(e)}")
            results['errors'].append(str(e))
            results['failed'] += 1

    # Send metrics to CloudWatch
    send_metrics(results)

    # Log summary
    print(f"Processing complete: {results}")

    return {
        'statusCode': 200,
        'body': json.dumps(results)
    }

def validate_appointment(appointment: Dict[str, Any]) -> bool:
    """
    Validate appointment data has required fields.

    Args:
        appointment: Appointment dictionary

    Returns:
        Boolean indicating if appointment is valid
    """
    required_fields = ['patient_id', 'phone_number', 'message']
    for field in required_fields:
        if field not in appointment or not appointment[field]:
            print(f"Missing required field: {field}")
            return False

    # Validate phone number format (basic check)
    phone = appointment['phone_number']
    if not phone.startswith('+') or len(phone) < 10:
        print(f"Invalid phone number format: {phone}")
        return False

    return True

def send_notification(appointment: Dict[str, Any]) -> bool:
    """
    Send SMS notification with retry logic and email fallback.

    Args:
        appointment: Appointment details

    Returns:
        Boolean indicating success
    """
    patient_id = appointment['patient_id']
    phone = appointment['phone_number']
    message = appointment['message']

    # Try sending SMS up to 3 times
    for attempt in range(3):
        try:
            # Configure SMS attributes for AWS End User Messaging
            sms_attributes = {
                'AWS.SNS.SMS.SMSType': {
                    'DataType': 'String',
                    'StringValue': 'Transactional'
                },
                'AWS.SNS.SMS.MaxPrice': {
                    'DataType': 'Number',
                    'StringValue': '0.50'
                }
            }

            # Send SMS via SNS
            response = sns.publish(
                PhoneNumber=phone,
                Message=message,
                MessageAttributes=sms_attributes
            )

            # Log successful delivery
            message_id = response.get('MessageId', 'unknown')
            log_delivery(
                patient_id=patient_id,
                phone=phone,
                message=message,
                status='SUCCESS',
                retry_count=attempt + 1,
                message_id=message_id
            )

            print(f"SMS sent successfully to {phone} (MessageId: {message_id})")
            return True

        except Exception as e:
            print(f"SMS attempt {attempt + 1} failed for {phone}: {str(e)}")

            # If this is the final attempt, try email fallback
            if attempt == 2:
                if 'email' in appointment and appointment['email']:
                    fallback_success = send_email_fallback(appointment)
                    status = 'FAILED_WITH_EMAIL_FALLBACK' if fallback_success else 'FAILED'
                else:
                    status = 'FAILED_NO_FALLBACK'

                log_delivery(
                    patient_id=patient_id,
                    phone=phone,
                    message=message,
                    status=status,
                    retry_count=attempt + 1,
                    error=str(e)
                )
                return False

            # Exponential backoff before retry
            time.sleep(2 ** attempt)

    return False

def send_email_fallback(appointment: Dict[str, Any]) -> bool:
    """
    Send email as fallback when SMS fails.

    Args:
        appointment: Appointment details including email

    Returns:
        Boolean indicating success
    """
    try:
        email = appointment.get('email', '')
        if not email:
            print("No email address provided for fallback")
            return False

        # Send email using SES
        response = ses.send_email(
            Source=SENDER_EMAIL,
            Destination={
                'ToAddresses': [email]
            },
            Message={
                'Subject': {
                    'Data': 'Appointment Reminder',
                    'Charset': 'UTF-8'
                },
                'Body': {
                    'Text': {
                        'Data': appointment['message'],
                        'Charset': 'UTF-8'
                    },
                    'Html': {
                        'Data': f"<html><body><p>{appointment['message']}</p></body></html>",
                        'Charset': 'UTF-8'
                    }
                }
            }
        )

        print(f"Email fallback sent to {email}")
        return True

    except Exception as e:
        print(f"Email fallback failed: {str(e)}")
        return False

def log_delivery(patient_id: str, phone: str, message: str, status: str,
                 retry_count: int, message_id: str = None, error: str = None):
    """
    Log delivery attempt to DynamoDB.

    Args:
        patient_id: Patient identifier
        phone: Phone number
        message: Message content
        status: Delivery status
        retry_count: Number of attempts
        message_id: SNS message ID if successful
        error: Error message if failed
    """
    timestamp = int(datetime.now().timestamp())
    ttl = int((datetime.now() + timedelta(days=90)).timestamp())

    item = {
        'patientId': patient_id,
        'timestamp': timestamp,
        'phoneNumber': phone,
        'messageContent': message[:500],  # Truncate long messages
        'deliveryStatus': status,
        'retryCount': retry_count,
        'ttl': ttl,
        'createdAt': datetime.now().isoformat()
    }

    if message_id:
        item['messageId'] = message_id
    if error:
        item['errorMessage'] = error[:500]  # Truncate long errors

    try:
        table.put_item(Item=item)
        print(f"Logged delivery: {status} for patient {patient_id}")
    except Exception as e:
        print(f"Failed to log delivery: {str(e)}")

def send_metrics(results: Dict[str, int]):
    """
    Send metrics to CloudWatch for monitoring.

    Args:
        results: Dictionary with success/failure counts
    """
    try:
        # Calculate failure rate
        total = results['successful'] + results['failed']
        failure_rate = (results['failed'] / total * 100) if total > 0 else 0

        # Send metrics to CloudWatch
        cloudwatch.put_metric_data(
            Namespace='AppointmentReminders',
            MetricData=[
                {
                    'MetricName': 'SuccessfulSMS',
                    'Value': results['successful'],
                    'Unit': 'Count',
                    'Timestamp': datetime.now()
                },
                {
                    'MetricName': 'FailedSMS',
                    'Value': results['failed'],
                    'Unit': 'Count',
                    'Timestamp': datetime.now()
                },
                {
                    'MetricName': 'FailureRate',
                    'Value': failure_rate,
                    'Unit': 'Percent',
                    'Timestamp': datetime.now()
                },
                {
                    'MetricName': 'EmailFallbacks',
                    'Value': results.get('fallback', 0),
                    'Unit': 'Count',
                    'Timestamp': datetime.now()
                }
            ]
        )
        print(f"Metrics sent to CloudWatch: {results}")
    except Exception as e:
        print(f"Failed to send metrics: {str(e)}")
```

## Unit Tests (test_notification_handler.py)

```python
import unittest
from unittest.mock import Mock, patch, MagicMock
import json
import os
from datetime import datetime

# Set environment variables before importing handler
os.environ['TABLE_NAME'] = 'test-sms-delivery-logs'
os.environ['SENDER_EMAIL'] = 'test@example.com'
os.environ['TOPIC_ARN'] = 'arn:aws:sns:us-west-1:123456789:test-topic'

# Import after setting env vars
import notification_handler

class TestNotificationHandler(unittest.TestCase):

    def setUp(self):
        """Set up test fixtures."""
        self.sample_appointment = {
            'patient_id': 'P12345',
            'phone_number': '+12025551234',
            'message': 'Reminder: You have an appointment tomorrow at 2:00 PM',
            'email': 'patient@example.com'
        }

        self.sample_event = {
            'appointments': [self.sample_appointment]
        }

    @patch('notification_handler.sns')
    @patch('notification_handler.table')
    @patch('notification_handler.cloudwatch')
    def test_lambda_handler_success(self, mock_cloudwatch, mock_table, mock_sns):
        """Test successful SMS notification."""
        # Mock SNS publish response
        mock_sns.publish.return_value = {
            'MessageId': 'test-message-id-123'
        }

        # Mock DynamoDB put_item
        mock_table.put_item.return_value = {}

        # Mock CloudWatch put_metric_data
        mock_cloudwatch.put_metric_data.return_value = {}

        # Call handler
        result = notification_handler.lambda_handler(self.sample_event, None)

        # Assert response
        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['successful'], 1)
        self.assertEqual(body['failed'], 0)

        # Verify SNS was called
        mock_sns.publish.assert_called_once()
        call_args = mock_sns.publish.call_args
        self.assertEqual(call_args[1]['PhoneNumber'], '+12025551234')

        # Verify DynamoDB logging
        mock_table.put_item.assert_called_once()

        # Verify CloudWatch metrics
        mock_cloudwatch.put_metric_data.assert_called_once()

    @patch('notification_handler.sns')
    @patch('notification_handler.ses')
    @patch('notification_handler.table')
    @patch('notification_handler.cloudwatch')
    def test_lambda_handler_with_fallback(self, mock_cloudwatch, mock_table, mock_ses, mock_sns):
        """Test SMS failure with email fallback."""
        # Mock SNS to fail
        mock_sns.publish.side_effect = Exception("SMS delivery failed")

        # Mock SES send_email success
        mock_ses.send_email.return_value = {
            'MessageId': 'email-message-id-123'
        }

        # Mock DynamoDB and CloudWatch
        mock_table.put_item.return_value = {}
        mock_cloudwatch.put_metric_data.return_value = {}

        # Call handler
        result = notification_handler.lambda_handler(self.sample_event, None)

        # Assert response
        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['successful'], 0)
        self.assertEqual(body['failed'], 1)

        # Verify SNS was attempted 3 times
        self.assertEqual(mock_sns.publish.call_count, 3)

        # Verify email fallback was called
        mock_ses.send_email.assert_called_once()

        # Verify DynamoDB logging
        mock_table.put_item.assert_called()

    def test_validate_appointment_valid(self):
        """Test appointment validation with valid data."""
        result = notification_handler.validate_appointment(self.sample_appointment)
        self.assertTrue(result)

    def test_validate_appointment_missing_field(self):
        """Test appointment validation with missing required field."""
        invalid_appointment = {
            'patient_id': 'P12345',
            'message': 'Test message'
            # Missing phone_number
        }
        result = notification_handler.validate_appointment(invalid_appointment)
        self.assertFalse(result)

    def test_validate_appointment_invalid_phone(self):
        """Test appointment validation with invalid phone format."""
        invalid_appointment = {
            'patient_id': 'P12345',
            'phone_number': '1234567',  # Invalid format
            'message': 'Test message'
        }
        result = notification_handler.validate_appointment(invalid_appointment)
        self.assertFalse(result)

    @patch('notification_handler.sns')
    @patch('notification_handler.table')
    def test_send_notification_success(self, mock_table, mock_sns):
        """Test successful notification sending."""
        # Mock SNS publish
        mock_sns.publish.return_value = {
            'MessageId': 'test-message-id'
        }
        mock_table.put_item.return_value = {}

        # Send notification
        result = notification_handler.send_notification(self.sample_appointment)

        # Assert success
        self.assertTrue(result)
        mock_sns.publish.assert_called_once()
        mock_table.put_item.assert_called_once()

    @patch('notification_handler.sns')
    @patch('notification_handler.table')
    def test_send_notification_retry_logic(self, mock_table, mock_sns):
        """Test retry logic for failed SMS."""
        # Mock SNS to fail twice then succeed
        mock_sns.publish.side_effect = [
            Exception("First attempt failed"),
            Exception("Second attempt failed"),
            {'MessageId': 'success-message-id'}
        ]
        mock_table.put_item.return_value = {}

        # Send notification
        result = notification_handler.send_notification(self.sample_appointment)

        # Assert success after retries
        self.assertTrue(result)
        self.assertEqual(mock_sns.publish.call_count, 3)

    @patch('notification_handler.ses')
    def test_send_email_fallback_success(self, mock_ses):
        """Test successful email fallback."""
        # Mock SES send_email
        mock_ses.send_email.return_value = {
            'MessageId': 'email-message-id'
        }

        # Send email
        result = notification_handler.send_email_fallback(self.sample_appointment)

        # Assert success
        self.assertTrue(result)
        mock_ses.send_email.assert_called_once()

    @patch('notification_handler.ses')
    def test_send_email_fallback_no_email(self, mock_ses):
        """Test email fallback with no email address."""
        appointment_no_email = {
            'patient_id': 'P12345',
            'phone_number': '+12025551234',
            'message': 'Test message'
            # No email field
        }

        # Send email
        result = notification_handler.send_email_fallback(appointment_no_email)

        # Assert failure
        self.assertFalse(result)
        mock_ses.send_email.assert_not_called()

    @patch('notification_handler.table')
    def test_log_delivery(self, mock_table):
        """Test delivery logging to DynamoDB."""
        mock_table.put_item.return_value = {}

        # Log delivery
        notification_handler.log_delivery(
            patient_id='P12345',
            phone='+12025551234',
            message='Test message',
            status='SUCCESS',
            retry_count=1,
            message_id='msg-123'
        )

        # Verify put_item was called
        mock_table.put_item.assert_called_once()
        call_args = mock_table.put_item.call_args
        item = call_args[1]['Item']

        # Assert item structure
        self.assertEqual(item['patientId'], 'P12345')
        self.assertEqual(item['deliveryStatus'], 'SUCCESS')
        self.assertEqual(item['retryCount'], 1)
        self.assertEqual(item['messageId'], 'msg-123')
        self.assertIn('timestamp', item)
        self.assertIn('ttl', item)

    @patch('notification_handler.cloudwatch')
    def test_send_metrics(self, mock_cloudwatch):
        """Test sending metrics to CloudWatch."""
        mock_cloudwatch.put_metric_data.return_value = {}

        results = {
            'successful': 10,
            'failed': 2,
            'fallback': 1
        }

        # Send metrics
        notification_handler.send_metrics(results)

        # Verify put_metric_data was called
        mock_cloudwatch.put_metric_data.assert_called_once()
        call_args = mock_cloudwatch.put_metric_data.call_args

        # Assert namespace and metrics
        self.assertEqual(call_args[1]['Namespace'], 'AppointmentReminders')
        metrics = call_args[1]['MetricData']
        self.assertEqual(len(metrics), 4)

        # Check metric values
        metric_names = [m['MetricName'] for m in metrics]
        self.assertIn('SuccessfulSMS', metric_names)
        self.assertIn('FailedSMS', metric_names)
        self.assertIn('FailureRate', metric_names)
        self.assertIn('EmailFallbacks', metric_names)

    def test_lambda_handler_no_appointments(self):
        """Test handler with no appointments in event."""
        event = {}

        result = notification_handler.lambda_handler(event, None)

        self.assertEqual(result['statusCode'], 400)
        body = json.loads(result['body'])
        self.assertIn('error', body)

    @patch('notification_handler.sns')
    @patch('notification_handler.table')
    @patch('notification_handler.cloudwatch')
    def test_lambda_handler_batch_processing(self, mock_cloudwatch, mock_table, mock_sns):
        """Test processing multiple appointments in batch."""
        # Create batch event
        batch_event = {
            'appointments': [
                {
                    'patient_id': f'P{i}',
                    'phone_number': f'+1202555{i:04d}',
                    'message': f'Appointment reminder {i}',
                    'email': f'patient{i}@example.com'
                }
                for i in range(5)
            ]
        }

        # Mock successful SNS publish
        mock_sns.publish.return_value = {'MessageId': 'test-id'}
        mock_table.put_item.return_value = {}
        mock_cloudwatch.put_metric_data.return_value = {}

        # Call handler
        result = notification_handler.lambda_handler(batch_event, None)

        # Assert all processed successfully
        self.assertEqual(result['statusCode'], 200)
        body = json.loads(result['body'])
        self.assertEqual(body['successful'], 5)
        self.assertEqual(body['failed'], 0)

        # Verify SNS called 5 times
        self.assertEqual(mock_sns.publish.call_count, 5)

if __name__ == '__main__':
    unittest.main()
```