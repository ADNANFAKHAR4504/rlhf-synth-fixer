# IDEAL RESPONSE

Here's the complete CloudFormation infrastructure for your healthcare appointment notification system:

## CloudFormation Template - notification-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Healthcare appointment notification system with SMS and email fallback",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming"
    },
    "EmailDomain": {
      "Type": "String",
      "Default": "example.com",
      "Description": "Domain for SES email verification"
    }
  },
  "Resources": {
    "NotificationTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "DisplayName": "AppointmentNotifications",
        "TopicName": {
          "Fn::Sub": "healthcare-appointment-notifications-${EnvironmentSuffix}"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Application",
            "Value": "HealthcareNotifications"
          }
        ]
      }
    },
    "NotificationLogTable": {
      "Type": "AWS::DynamoDB::Table",
      "DeletionPolicy": "Delete",
      "Properties": {
        "TableName": {
          "Fn::Sub": "notification-delivery-logs-${EnvironmentSuffix}"
        },
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
          {
            "AttributeName": "notificationId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "timestamp",
            "AttributeType": "N"
          },
          {
            "AttributeName": "patientId",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "notificationId",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "timestamp",
            "KeyType": "RANGE"
          }
        ],
        "GlobalSecondaryIndexes": [
          {
            "IndexName": "PatientIndex",
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
            "Projection": {
              "ProjectionType": "ALL"
            }
          }
        ],
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Application",
            "Value": "HealthcareNotifications"
          }
        ]
      }
    },
    "NotificationProcessorRole": {
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          "arn:aws:iam::aws:policy/CloudWatchLambdaInsightsExecutionRolePolicy"
        ],
        "Policies": [
          {
            "PolicyName": "NotificationProcessorPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": {
                    "Ref": "NotificationTopic"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:GetItem",
                    "dynamodb:Query"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "NotificationLogTable",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${NotificationLogTable.Arn}/index/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "ses:SendEmail",
                    "ses:SendRawEmail"
                  ],
                  "Resource": "*",
                  "Condition": {
                    "StringLike": {
                      "ses:FromAddress": {
                        "Fn::Sub": "noreply@${EmailDomain}"
                      }
                    }
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudwatch:PutMetricData"
                  ],
                  "Resource": "*",
                  "Condition": {
                    "StringEquals": {
                      "cloudwatch:namespace": "HealthcareNotifications"
                    }
                  }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Application",
            "Value": "HealthcareNotifications"
          }
        ]
      }
    },
    "NotificationProcessorFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "appointment-notification-processor-${EnvironmentSuffix}"
        },
        "Runtime": "python3.10",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "NotificationProcessorRole",
            "Arn"
          ]
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport uuid\nimport time\nfrom datetime import datetime\nfrom botocore.exceptions import ClientError\nfrom typing import Dict, List, Any\nimport os\n\n# Initialize AWS clients\nsns_client = boto3.client('sns', region_name=os.environ.get('AWS_REGION', 'us-west-1'))\ndynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-west-1'))\nses_client = boto3.client('ses', region_name=os.environ.get('AWS_REGION', 'us-west-1'))\ncloudwatch = boto3.client('cloudwatch', region_name=os.environ.get('AWS_REGION', 'us-west-1'))\n\n# Get environment variables\nTABLE_NAME = os.environ.get('NOTIFICATION_TABLE', 'notification-delivery-logs')\nEMAIL_DOMAIN = os.environ.get('EMAIL_DOMAIN', 'example.com')\nSNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')\n\ntable = dynamodb.Table(TABLE_NAME)\n\ndef lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:\n    \"\"\"\n    Main Lambda handler for processing appointment notifications.\n\n    Args:\n        event: Event containing list of appointments to process\n        context: Lambda context object\n\n    Returns:\n        Response with processing results\n    \"\"\"\n    batch_id = str(uuid.uuid4())\n    results = {'success': 0, 'failed': 0, 'fallback': 0}\n\n    # Extract appointments from event\n    appointments = event.get('appointments', [])\n\n    if not appointments:\n        return {\n            'statusCode': 400,\n            'body': json.dumps({'error': 'No appointments provided'})\n        }\n\n    # Process appointments in batches for efficiency\n    batch_size = 50\n    for i in range(0, len(appointments), batch_size):\n        batch = appointments[i:i + batch_size]\n        process_batch(batch, batch_id, results)\n\n    # Publish metrics to CloudWatch\n    publish_metrics(results)\n\n    # Calculate success rate\n    total_processed = results['success'] + results['failed'] + results['fallback']\n    success_rate = ((results['success'] + results['fallback']) / total_processed * 100) if total_processed > 0 else 0\n\n    return {\n        'statusCode': 200,\n        'body': json.dumps({\n            'batchId': batch_id,\n            'processed': len(appointments),\n            'results': results,\n            'successRate': f\"{success_rate:.2f}%\"\n        })\n    }\n\ndef process_batch(appointments: List[Dict[str, Any]], batch_id: str, results: Dict[str, int]) -> None:\n    \"\"\"\n    Process a batch of appointments.\n\n    Args:\n        appointments: List of appointment dictionaries\n        batch_id: Unique identifier for this batch\n        results: Dictionary to track results\n    \"\"\"\n    for appointment in appointments:\n        notification_id = str(uuid.uuid4())\n        timestamp = int(time.time() * 1000)\n\n        try:\n            send_notification(appointment, notification_id, timestamp, results)\n        except Exception as e:\n            print(f\"Error processing appointment {appointment.get('patientId')}: {str(e)}\")\n            results['failed'] += 1\n            log_notification(notification_id, timestamp, appointment, 'FAILED', str(e), batch_id)\n\ndef send_notification(appointment: Dict[str, Any], notification_id: str,\n                     timestamp: int, results: Dict[str, int]) -> None:\n    \"\"\"\n    Send notification via SMS with email fallback.\n\n    Args:\n        appointment: Appointment details\n        notification_id: Unique notification identifier\n        timestamp: Current timestamp\n        results: Results tracker\n    \"\"\"\n    patient_id = appointment.get('patientId')\n    phone_number = appointment.get('phoneNumber')\n    email = appointment.get('email')\n    appointment_time = appointment.get('appointmentTime')\n    doctor_name = appointment.get('doctorName')\n\n    # Validate required fields\n    if not patient_id or not appointment_time:\n        raise ValueError(\"Missing required appointment fields\")\n\n    message = format_notification_message(appointment)\n\n    # Try SMS first\n    sms_sent = False\n    if phone_number and validate_phone_number(phone_number):\n        sms_sent = send_sms(phone_number, message, notification_id, timestamp,\n                           appointment, results)\n\n    # Fallback to email if SMS fails or unavailable\n    if not sms_sent and email and validate_email(email):\n        send_email_notification(email, message, notification_id, timestamp,\n                              appointment, results)\n    elif not sms_sent and not email:\n        # No valid contact method available\n        log_notification(notification_id, timestamp, appointment,\n                        'NO_CONTACT', 'No valid phone or email', '')\n        results['failed'] += 1\n\ndef send_sms(phone_number: str, message: str, notification_id: str,\n            timestamp: int, appointment: Dict[str, Any],\n            results: Dict[str, int]) -> bool:\n    \"\"\"\n    Send SMS notification using SNS.\n\n    Args:\n        phone_number: Recipient phone number\n        message: Message content\n        notification_id: Notification ID\n        timestamp: Timestamp\n        appointment: Appointment details\n        results: Results tracker\n\n    Returns:\n        True if SMS sent successfully, False otherwise\n    \"\"\"\n    try:\n        # Add retry logic with exponential backoff\n        max_retries = 3\n        for attempt in range(max_retries):\n            try:\n                response = sns_client.publish(\n                    PhoneNumber=phone_number,\n                    Message=message,\n                    MessageAttributes={\n                        'AWS.SNS.SMS.SMSType': {\n                            'DataType': 'String',\n                            'StringValue': 'Transactional'\n                        },\n                        'AWS.SNS.SMS.MaxPrice': {\n                            'DataType': 'Number',\n                            'StringValue': '0.50'\n                        }\n                    }\n                )\n\n                log_notification(notification_id, timestamp, appointment,\n                               'SMS_SENT', response['MessageId'], '')\n                results['success'] += 1\n                return True\n\n            except ClientError as e:\n                if attempt < max_retries - 1:\n                    time.sleep(2 ** attempt)  # Exponential backoff\n                else:\n                    raise e\n\n    except ClientError as e:\n        error_code = e.response['Error']['Code']\n        print(f\"SMS send failed for {appointment.get('patientId')}: {error_code} - {str(e)}\")\n        return False\n\n    return False\n\ndef send_email_notification(email: str, message: str, notification_id: str,\n                           timestamp: int, appointment: Dict[str, Any],\n                           results: Dict[str, int]) -> None:\n    \"\"\"\n    Send email notification using SES as fallback.\n\n    Args:\n        email: Recipient email address\n        message: Message content\n        notification_id: Notification ID\n        timestamp: Timestamp\n        appointment: Appointment details\n        results: Results tracker\n    \"\"\"\n    try:\n        response = ses_client.send_email(\n            Source=f'noreply@{EMAIL_DOMAIN}',\n            Destination={'ToAddresses': [email]},\n            Message={\n                'Subject': {\n                    'Data': 'Appointment Reminder',\n                    'Charset': 'UTF-8'\n                },\n                'Body': {\n                    'Text': {\n                        'Data': message,\n                        'Charset': 'UTF-8'\n                    },\n                    'Html': {\n                        'Data': format_html_email(appointment, message),\n                        'Charset': 'UTF-8'\n                    }\n                }\n            }\n        )\n\n        log_notification(notification_id, timestamp, appointment,\n                       'EMAIL_SENT', response['MessageId'], '')\n        results['fallback'] += 1\n\n    except ClientError as e:\n        print(f\"Email send failed for {appointment.get('patientId')}: {str(e)}\")\n        log_notification(notification_id, timestamp, appointment,\n                       'ALL_FAILED', str(e), '')\n        results['failed'] += 1\n\ndef log_notification(notification_id: str, timestamp: int,\n                    appointment: Dict[str, Any], status: str,\n                    message_id: str, batch_id: str) -> None:\n    \"\"\"\n    Log notification attempt to DynamoDB.\n\n    Args:\n        notification_id: Unique notification ID\n        timestamp: Timestamp of attempt\n        appointment: Appointment details\n        status: Delivery status\n        message_id: AWS message ID if successful\n        batch_id: Batch identifier\n    \"\"\"\n    try:\n        table.put_item(\n            Item={\n                'notificationId': notification_id,\n                'timestamp': timestamp,\n                'patientId': appointment.get('patientId', 'unknown'),\n                'status': status,\n                'messageId': message_id,\n                'batchId': batch_id,\n                'appointmentTime': appointment.get('appointmentTime', ''),\n                'doctorName': appointment.get('doctorName', ''),\n                'phoneNumber': appointment.get('phoneNumber', ''),\n                'email': appointment.get('email', ''),\n                'createdAt': datetime.utcnow().isoformat(),\n                'ttl': int(time.time()) + (90 * 24 * 3600)  # 90 days TTL\n            }\n        )\n    except Exception as e:\n        print(f\"Failed to log notification: {str(e)}\")\n\ndef publish_metrics(results: Dict[str, int]) -> None:\n    \"\"\"\n    Publish custom metrics to CloudWatch.\n\n    Args:\n        results: Dictionary containing success/failure counts\n    \"\"\"\n    try:\n        total = sum(results.values())\n        success_rate = ((results['success'] + results['fallback']) / total * 100) if total > 0 else 0\n\n        cloudwatch.put_metric_data(\n            Namespace='HealthcareNotifications',\n            MetricData=[\n                {\n                    'MetricName': 'SuccessfulNotifications',\n                    'Value': results['success'],\n                    'Unit': 'Count',\n                    'Timestamp': datetime.utcnow()\n                },\n                {\n                    'MetricName': 'FailedNotifications',\n                    'Value': results['failed'],\n                    'Unit': 'Count',\n                    'Timestamp': datetime.utcnow()\n                },\n                {\n                    'MetricName': 'FallbackNotifications',\n                    'Value': results['fallback'],\n                    'Unit': 'Count',\n                    'Timestamp': datetime.utcnow()\n                },\n                {\n                    'MetricName': 'DeliverySuccessRate',\n                    'Value': success_rate,\n                    'Unit': 'Percent',\n                    'Timestamp': datetime.utcnow()\n                }\n            ]\n        )\n    except Exception as e:\n        print(f\"Failed to publish metrics: {str(e)}\")\n\ndef format_notification_message(appointment: Dict[str, Any]) -> str:\n    \"\"\"\n    Format the notification message.\n\n    Args:\n        appointment: Appointment details\n\n    Returns:\n        Formatted message string\n    \"\"\"\n    doctor_name = appointment.get('doctorName', 'your doctor')\n    appointment_time = appointment.get('appointmentTime', 'soon')\n    location = appointment.get('location', '')\n\n    message = f\"Reminder: Your appointment with Dr. {doctor_name} is scheduled for {appointment_time}.\"\n\n    if location:\n        message += f\" Location: {location}.\"\n\n    message += \" Reply CONFIRM to confirm or CANCEL to cancel.\"\n\n    return message\n\ndef format_html_email(appointment: Dict[str, Any], text_message: str) -> str:\n    \"\"\"\n    Format HTML email content.\n\n    Args:\n        appointment: Appointment details\n        text_message: Plain text message\n\n    Returns:\n        HTML formatted email\n    \"\"\"\n    return f\"\"\"\n    <html>\n        <body style=\"font-family: Arial, sans-serif; padding: 20px;\">\n            <h2 style=\"color: #333;\">Appointment Reminder</h2>\n            <p style=\"font-size: 16px; color: #555;\">{text_message}</p>\n            <hr style=\"border: 1px solid #eee; margin: 20px 0;\">\n            <p style=\"font-size: 14px; color: #777;\">\n                Patient ID: {appointment.get('patientId', 'N/A')}<br>\n                Appointment ID: {appointment.get('appointmentId', 'N/A')}\n            </p>\n            <p style=\"font-size: 12px; color: #999;\">\n                This is an automated message. Please do not reply to this email.\n            </p>\n        </body>\n    </html>\n    \"\"\"\n\ndef validate_phone_number(phone: str) -> bool:\n    \"\"\"\n    Validate phone number format.\n\n    Args:\n        phone: Phone number string\n\n    Returns:\n        True if valid, False otherwise\n    \"\"\"\n    if not phone:\n        return False\n\n    # Remove common formatting characters\n    cleaned = ''.join(filter(str.isdigit, phone))\n\n    # Check for valid US phone number (10 or 11 digits)\n    return len(cleaned) in [10, 11] and (len(cleaned) != 11 or cleaned[0] == '1')\n\ndef validate_email(email: str) -> bool:\n    \"\"\"\n    Basic email validation.\n\n    Args:\n        email: Email address string\n\n    Returns:\n        True if valid, False otherwise\n    \"\"\"\n    import re\n    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'\n    return bool(re.match(pattern, email))"
        },
        "Environment": {
          "Variables": {
            "NOTIFICATION_TABLE": {
              "Ref": "NotificationLogTable"
            },
            "SNS_TOPIC_ARN": {
              "Ref": "NotificationTopic"
            },
            "EMAIL_DOMAIN": {
              "Ref": "EmailDomain"
            }
          }
        },
        "Timeout": 300,
        "MemorySize": 512,
        "Layers": [
          {
            "Fn::Sub": "arn:aws:lambda:${AWS::Region}:580247275435:layer:LambdaInsightsExtension:38"
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Application",
            "Value": "HealthcareNotifications"
          }
        ]
      }
    },
    "DeliveryFailureAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "notification-delivery-failure-alarm-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when notification failure rate exceeds 5%",
        "MetricName": "FailedNotifications",
        "Namespace": "HealthcareNotifications",
        "Statistic": "Sum",
        "Period": 3600,
        "EvaluationPeriods": 1,
        "Threshold": 115,
        "ComparisonOperator": "GreaterThanThreshold",
        "TreatMissingData": "notBreaching"
      }
    },
    "LambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "lambda-processor-error-alarm-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert on Lambda function errors",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {
              "Ref": "NotificationProcessorFunction"
            }
          }
        ],
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 5,
        "ComparisonOperator": "GreaterThanThreshold",
        "TreatMissingData": "notBreaching"
      }
    },
    "NotificationLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/${NotificationProcessorFunction}"
        },
        "RetentionInDays": 30
      }
    },
    "SNSDeliveryStatusRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "sns.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "SNSDeliveryStatusPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:PutMetricFilter",
                    "logs:PutRetentionPolicy"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    "EventRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "daily-notification-trigger-${EnvironmentSuffix}"
        },
        "Description": "Trigger notification processor daily",
        "ScheduleExpression": "rate(1 day)",
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": [
                "NotificationProcessorFunction",
                "Arn"
              ]
            },
            "Id": "NotificationTarget"
          }
        ]
      }
    },
    "EventRulePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "NotificationProcessorFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": [
            "EventRule",
            "Arn"
          ]
        }
      }
    }
  },
  "Outputs": {
    "NotificationTopicArn": {
      "Description": "ARN of the SNS notification topic",
      "Value": {
        "Ref": "NotificationTopic"
      },
      "Export": {
        "Name": "NotificationTopicArn"
      }
    },
    "LambdaFunctionArn": {
      "Description": "ARN of the notification processor Lambda function",
      "Value": {
        "Fn::GetAtt": [
          "NotificationProcessorFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": "NotificationProcessorArn"
      }
    },
    "DynamoDBTableName": {
      "Description": "Name of the notification log DynamoDB table",
      "Value": {
        "Ref": "NotificationLogTable"
      },
      "Export": {
        "Name": "NotificationLogTableName"
      }
    }
  }
}
```

## Lambda Function - notification_processor.py

```python
import json
import boto3
import uuid
import time
from datetime import datetime
from botocore.exceptions import ClientError
from typing import Dict, List, Any
import os

# Initialize AWS clients
sns_client = boto3.client('sns', region_name=os.environ.get('AWS_REGION', 'us-west-1'))
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'us-west-1'))
ses_client = boto3.client('ses', region_name=os.environ.get('AWS_REGION', 'us-west-1'))
cloudwatch = boto3.client('cloudwatch', region_name=os.environ.get('AWS_REGION', 'us-west-1'))

# Get environment variables
TABLE_NAME = os.environ.get('NOTIFICATION_TABLE', 'notification-delivery-logs')
EMAIL_DOMAIN = os.environ.get('EMAIL_DOMAIN', 'example.com')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')

table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for processing appointment notifications.

    Args:
        event: Event containing list of appointments to process
        context: Lambda context object

    Returns:
        Response with processing results
    """
    batch_id = str(uuid.uuid4())
    results = {'success': 0, 'failed': 0, 'fallback': 0}

    # Extract appointments from event
    appointments = event.get('appointments', [])

    if not appointments:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'No appointments provided'})
        }

    # Process appointments in batches for efficiency
    batch_size = 50
    for i in range(0, len(appointments), batch_size):
        batch = appointments[i:i + batch_size]
        process_batch(batch, batch_id, results)

    # Publish metrics to CloudWatch
    publish_metrics(results)

    # Calculate success rate
    total_processed = results['success'] + results['failed'] + results['fallback']
    success_rate = ((results['success'] + results['fallback']) / total_processed * 100) if total_processed > 0 else 0

    return {
        'statusCode': 200,
        'body': json.dumps({
            'batchId': batch_id,
            'processed': len(appointments),
            'results': results,
            'successRate': f"{success_rate:.2f}%"
        })
    }

def process_batch(appointments: List[Dict[str, Any]], batch_id: str, results: Dict[str, int]) -> None:
    """
    Process a batch of appointments.

    Args:
        appointments: List of appointment dictionaries
        batch_id: Unique identifier for this batch
        results: Dictionary to track results
    """
    for appointment in appointments:
        notification_id = str(uuid.uuid4())
        timestamp = int(time.time() * 1000)

        try:
            send_notification(appointment, notification_id, timestamp, results)
        except Exception as e:
            print(f"Error processing appointment {appointment.get('patientId')}: {str(e)}")
            results['failed'] += 1
            log_notification(notification_id, timestamp, appointment, 'FAILED', str(e), batch_id)

def send_notification(appointment: Dict[str, Any], notification_id: str,
                     timestamp: int, results: Dict[str, int]) -> None:
    """
    Send notification via SMS with email fallback.

    Args:
        appointment: Appointment details
        notification_id: Unique notification identifier
        timestamp: Current timestamp
        results: Results tracker
    """
    patient_id = appointment.get('patientId')
    phone_number = appointment.get('phoneNumber')
    email = appointment.get('email')
    appointment_time = appointment.get('appointmentTime')
    doctor_name = appointment.get('doctorName')

    # Validate required fields
    if not patient_id or not appointment_time:
        raise ValueError("Missing required appointment fields")

    message = format_notification_message(appointment)

    # Try SMS first
    sms_sent = False
    if phone_number and validate_phone_number(phone_number):
        sms_sent = send_sms(phone_number, message, notification_id, timestamp,
                           appointment, results)

    # Fallback to email if SMS fails or unavailable
    if not sms_sent and email and validate_email(email):
        send_email_notification(email, message, notification_id, timestamp,
                              appointment, results)
    elif not sms_sent and not email:
        # No valid contact method available
        log_notification(notification_id, timestamp, appointment,
                        'NO_CONTACT', 'No valid phone or email', '')
        results['failed'] += 1

def send_sms(phone_number: str, message: str, notification_id: str,
            timestamp: int, appointment: Dict[str, Any],
            results: Dict[str, int]) -> bool:
    """
    Send SMS notification using SNS.

    Args:
        phone_number: Recipient phone number
        message: Message content
        notification_id: Notification ID
        timestamp: Timestamp
        appointment: Appointment details
        results: Results tracker

    Returns:
        True if SMS sent successfully, False otherwise
    """
    try:
        # Add retry logic with exponential backoff
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = sns_client.publish(
                    PhoneNumber=phone_number,
                    Message=message,
                    MessageAttributes={
                        'AWS.SNS.SMS.SMSType': {
                            'DataType': 'String',
                            'StringValue': 'Transactional'
                        },
                        'AWS.SNS.SMS.MaxPrice': {
                            'DataType': 'Number',
                            'StringValue': '0.50'
                        }
                    }
                )

                log_notification(notification_id, timestamp, appointment,
                               'SMS_SENT', response['MessageId'], '')
                results['success'] += 1
                return True

            except ClientError as e:
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    raise e

    except ClientError as e:
        error_code = e.response['Error']['Code']
        print(f"SMS send failed for {appointment.get('patientId')}: {error_code} - {str(e)}")
        return False

    return False

def send_email_notification(email: str, message: str, notification_id: str,
                           timestamp: int, appointment: Dict[str, Any],
                           results: Dict[str, int]) -> None:
    """
    Send email notification using SES as fallback.

    Args:
        email: Recipient email address
        message: Message content
        notification_id: Notification ID
        timestamp: Timestamp
        appointment: Appointment details
        results: Results tracker
    """
    try:
        response = ses_client.send_email(
            Source=f'noreply@{EMAIL_DOMAIN}',
            Destination={'ToAddresses': [email]},
            Message={
                'Subject': {
                    'Data': 'Appointment Reminder',
                    'Charset': 'UTF-8'
                },
                'Body': {
                    'Text': {
                        'Data': message,
                        'Charset': 'UTF-8'
                    },
                    'Html': {
                        'Data': format_html_email(appointment, message),
                        'Charset': 'UTF-8'
                    }
                }
            }
        )

        log_notification(notification_id, timestamp, appointment,
                       'EMAIL_SENT', response['MessageId'], '')
        results['fallback'] += 1

    except ClientError as e:
        print(f"Email send failed for {appointment.get('patientId')}: {str(e)}")
        log_notification(notification_id, timestamp, appointment,
                       'ALL_FAILED', str(e), '')
        results['failed'] += 1

def log_notification(notification_id: str, timestamp: int,
                    appointment: Dict[str, Any], status: str,
                    message_id: str, batch_id: str) -> None:
    """
    Log notification attempt to DynamoDB.

    Args:
        notification_id: Unique notification ID
        timestamp: Timestamp of attempt
        appointment: Appointment details
        status: Delivery status
        message_id: AWS message ID if successful
        batch_id: Batch identifier
    """
    try:
        table.put_item(
            Item={
                'notificationId': notification_id,
                'timestamp': timestamp,
                'patientId': appointment.get('patientId', 'unknown'),
                'status': status,
                'messageId': message_id,
                'batchId': batch_id,
                'appointmentTime': appointment.get('appointmentTime', ''),
                'doctorName': appointment.get('doctorName', ''),
                'phoneNumber': appointment.get('phoneNumber', ''),
                'email': appointment.get('email', ''),
                'createdAt': datetime.utcnow().isoformat(),
                'ttl': int(time.time()) + (90 * 24 * 3600)  # 90 days TTL
            }
        )
    except Exception as e:
        print(f"Failed to log notification: {str(e)}")

def publish_metrics(results: Dict[str, int]) -> None:
    """
    Publish custom metrics to CloudWatch.

    Args:
        results: Dictionary containing success/failure counts
    """
    try:
        total = sum(results.values())
        success_rate = ((results['success'] + results['fallback']) / total * 100) if total > 0 else 0

        cloudwatch.put_metric_data(
            Namespace='HealthcareNotifications',
            MetricData=[
                {
                    'MetricName': 'SuccessfulNotifications',
                    'Value': results['success'],
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'FailedNotifications',
                    'Value': results['failed'],
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'FallbackNotifications',
                    'Value': results['fallback'],
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'DeliverySuccessRate',
                    'Value': success_rate,
                    'Unit': 'Percent',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
    except Exception as e:
        print(f"Failed to publish metrics: {str(e)}")

def format_notification_message(appointment: Dict[str, Any]) -> str:
    """
    Format the notification message.

    Args:
        appointment: Appointment details

    Returns:
        Formatted message string
    """
    doctor_name = appointment.get('doctorName', 'your doctor')
    appointment_time = appointment.get('appointmentTime', 'soon')
    location = appointment.get('location', '')

    message = f"Reminder: Your appointment with Dr. {doctor_name} is scheduled for {appointment_time}."

    if location:
        message += f" Location: {location}."

    message += " Reply CONFIRM to confirm or CANCEL to cancel."

    return message

def format_html_email(appointment: Dict[str, Any], text_message: str) -> str:
    """
    Format HTML email content.

    Args:
        appointment: Appointment details
        text_message: Plain text message

    Returns:
        HTML formatted email
    """
    return f"""
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #333;">Appointment Reminder</h2>
            <p style="font-size: 16px; color: #555;">{text_message}</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 14px; color: #777;">
                Patient ID: {appointment.get('patientId', 'N/A')}<br>
                Appointment ID: {appointment.get('appointmentId', 'N/A')}
            </p>
            <p style="font-size: 12px; color: #999;">
                This is an automated message. Please do not reply to this email.
            </p>
        </body>
    </html>
    """

def validate_phone_number(phone: str) -> bool:
    """
    Validate phone number format.

    Args:
        phone: Phone number string

    Returns:
        True if valid, False otherwise
    """
    if not phone:
        return False

    # Remove common formatting characters
    cleaned = ''.join(filter(str.isdigit, phone))

    # Check for valid US phone number (10 or 11 digits)
    return len(cleaned) in [10, 11] and (len(cleaned) != 11 or cleaned[0] == '1')

def validate_email(email: str) -> bool:
    """
    Basic email validation.

    Args:
        email: Email address string

    Returns:
        True if valid, False otherwise
    """
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))
```
