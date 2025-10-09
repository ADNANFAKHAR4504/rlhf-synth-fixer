const fs = require('fs');
const path = require('path');

describe('Lambda Function Unit Tests', () => {
  let lambdaCode: string;

  beforeAll(() => {
    const lambdaPath = path.join(__dirname, '..', 'lib', 'notification_processor.py');
    lambdaCode = fs.readFileSync(lambdaPath, 'utf8');
  });

  describe('Lambda Code Structure', () => {
    test('should import required AWS SDK libraries', () => {
      expect(lambdaCode).toContain('import boto3');
      expect(lambdaCode).toContain('import json');
      expect(lambdaCode).toContain('import uuid');
      expect(lambdaCode).toContain('from botocore.exceptions import ClientError');
    });

    test('should initialize AWS clients', () => {
      expect(lambdaCode).toContain("sns_client = boto3.client('sns'");
      expect(lambdaCode).toContain("dynamodb = boto3.resource('dynamodb'");
      expect(lambdaCode).toContain("ses_client = boto3.client('ses'");
      expect(lambdaCode).toContain("cloudwatch = boto3.client('cloudwatch'");
    });

    test('should use environment variables', () => {
      expect(lambdaCode).toContain("os.environ.get('NOTIFICATION_TABLE'");
      expect(lambdaCode).toContain("os.environ.get('EMAIL_DOMAIN'");
      expect(lambdaCode).toContain("os.environ.get('SNS_TOPIC_ARN')");
      expect(lambdaCode).toContain("os.environ.get('AWS_REGION'");
    });

    test('should define lambda_handler function', () => {
      expect(lambdaCode).toContain('def lambda_handler(event');
      expect(lambdaCode).toMatch(/def lambda_handler\(event.*context.*\)/);
    });
  });

  describe('Core Functions', () => {
    test('should have process_batch function', () => {
      expect(lambdaCode).toContain('def process_batch(');
      expect(lambdaCode).toMatch(/def process_batch\(appointments.*batch_id.*results/);
    });

    test('should have send_notification function', () => {
      expect(lambdaCode).toContain('def send_notification(');
      expect(lambdaCode).toMatch(/def send_notification\(appointment.*notification_id/);
    });

    test('should have send_sms function', () => {
      expect(lambdaCode).toContain('def send_sms(');
      expect(lambdaCode).toMatch(/def send_sms\(phone_number.*message/);
    });

    test('should have send_email_notification function', () => {
      expect(lambdaCode).toContain('def send_email_notification(');
      expect(lambdaCode).toMatch(/def send_email_notification\(email.*message/);
    });

    test('should have log_notification function', () => {
      expect(lambdaCode).toContain('def log_notification(');
      expect(lambdaCode).toMatch(/def log_notification\(notification_id.*timestamp/);
    });

    test('should have publish_metrics function', () => {
      expect(lambdaCode).toContain('def publish_metrics(');
      expect(lambdaCode).toContain('cloudwatch.put_metric_data');
    });

    test('should have format_notification_message function', () => {
      expect(lambdaCode).toContain('def format_notification_message(');
    });

    test('should have format_html_email function', () => {
      expect(lambdaCode).toContain('def format_html_email(');
    });

    test('should have validate_phone_number function', () => {
      expect(lambdaCode).toContain('def validate_phone_number(');
    });

    test('should have validate_email function', () => {
      expect(lambdaCode).toContain('def validate_email(');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing appointments', () => {
      expect(lambdaCode).toContain("'No appointments provided'");
      expect(lambdaCode).toContain("'statusCode': 400");
    });

    test('should have try-except blocks for error handling', () => {
      expect(lambdaCode).toMatch(/try:[\s\S]*except.*Exception/);
      expect(lambdaCode).toMatch(/except ClientError/);
    });

    test('should log errors', () => {
      expect(lambdaCode).toContain('print(f"Error processing appointment');
      expect(lambdaCode).toContain('print(f"SMS send failed');
      expect(lambdaCode).toContain('print(f"Email send failed');
      expect(lambdaCode).toContain('print(f"Failed to log notification');
    });
  });

  describe('Batch Processing', () => {
    test('should process appointments in batches', () => {
      expect(lambdaCode).toContain('batch_size = 50');
      expect(lambdaCode).toContain('for i in range(0, len(appointments), batch_size)');
      expect(lambdaCode).toContain('batch = appointments[i:i + batch_size]');
    });

    test('should generate batch ID', () => {
      expect(lambdaCode).toContain('batch_id = str(uuid.uuid4())');
    });
  });

  describe('SMS Functionality', () => {
    test('should publish to SNS for SMS', () => {
      expect(lambdaCode).toContain('sns_client.publish(');
      expect(lambdaCode).toContain('PhoneNumber=phone_number');
      expect(lambdaCode).toContain("'AWS.SNS.SMS.SMSType'");
      expect(lambdaCode).toContain("'StringValue': 'Transactional'");
    });

    test('should set SMS max price', () => {
      expect(lambdaCode).toContain("'AWS.SNS.SMS.MaxPrice'");
      expect(lambdaCode).toContain("'StringValue': '0.50'");
    });

    test('should implement retry logic for SMS', () => {
      expect(lambdaCode).toContain('max_retries = 3');
      expect(lambdaCode).toContain('for attempt in range(max_retries)');
      expect(lambdaCode).toContain('time.sleep(2 ** attempt)');
    });
  });

  describe('Email Functionality', () => {
    test('should send email using SES', () => {
      expect(lambdaCode).toContain('ses_client.send_email(');
      expect(lambdaCode).toContain("Source=f'noreply@{EMAIL_DOMAIN}'");
      expect(lambdaCode).toContain("'ToAddresses': [email]");
    });

    test('should send both text and HTML email', () => {
      expect(lambdaCode).toContain("'Text': {");
      expect(lambdaCode).toContain("'Html': {");
    });

    test('should format HTML email', () => {
      expect(lambdaCode).toContain('<html>');
      expect(lambdaCode).toContain('<h2');
      expect(lambdaCode).toContain('Appointment Reminder</h2>');
    });
  });

  describe('DynamoDB Operations', () => {
    test('should put items to DynamoDB', () => {
      expect(lambdaCode).toContain('table.put_item(');
      expect(lambdaCode).toContain("'notificationId': notification_id");
      expect(lambdaCode).toContain("'timestamp': timestamp");
      expect(lambdaCode).toContain("'patientId':");
      expect(lambdaCode).toContain("'status':");
    });

    test('should include TTL for DynamoDB items', () => {
      expect(lambdaCode).toContain("'ttl':");
      expect(lambdaCode).toContain('90 * 24 * 3600');
    });
  });

  describe('CloudWatch Metrics', () => {
    test('should publish success metrics', () => {
      expect(lambdaCode).toContain("'MetricName': 'SuccessfulNotifications'");
      expect(lambdaCode).toContain("'Value': results['success']");
    });

    test('should publish failure metrics', () => {
      expect(lambdaCode).toContain("'MetricName': 'FailedNotifications'");
      expect(lambdaCode).toContain("'Value': results['failed']");
    });

    test('should publish fallback metrics', () => {
      expect(lambdaCode).toContain("'MetricName': 'FallbackNotifications'");
      expect(lambdaCode).toContain("'Value': results['fallback']");
    });

    test('should publish delivery success rate', () => {
      expect(lambdaCode).toContain("'MetricName': 'DeliverySuccessRate'");
      expect(lambdaCode).toContain("'Unit': 'Percent'");
    });

    test('should use correct CloudWatch namespace', () => {
      expect(lambdaCode).toContain("Namespace='HealthcareNotifications'");
    });
  });

  describe('Validation Functions', () => {
    test('should validate phone numbers', () => {
      expect(lambdaCode).toContain('validate_phone_number');
      expect(lambdaCode).toContain('filter(str.isdigit, phone)');
      expect(lambdaCode).toContain('len(cleaned) in [10, 11]');
    });

    test('should validate email addresses', () => {
      expect(lambdaCode).toContain('validate_email');
      expect(lambdaCode).toContain('import re');
      expect(lambdaCode).toMatch(/\@.*\\\./);
    });
  });

  describe('Message Formatting', () => {
    test('should format appointment reminder message', () => {
      expect(lambdaCode).toContain('Reminder: Your appointment with Dr.');
      expect(lambdaCode).toContain('Reply CONFIRM to confirm or CANCEL to cancel');
    });

    test('should include location if available', () => {
      expect(lambdaCode).toContain("appointment.get('location'");
      expect(lambdaCode).toContain('Location:');
    });

    test('should handle missing doctor name', () => {
      expect(lambdaCode).toContain("appointment.get('doctorName', 'your doctor')");
    });
  });

  describe('Return Values', () => {
    test('should return statusCode and body', () => {
      expect(lambdaCode).toContain("'statusCode': 200");
      expect(lambdaCode).toContain("'body': json.dumps");
    });

    test('should return batch ID', () => {
      expect(lambdaCode).toContain("'batchId': batch_id");
    });

    test('should return processed count', () => {
      expect(lambdaCode).toContain("'processed': len(appointments)");
    });

    test('should return results object', () => {
      expect(lambdaCode).toContain("'results': results");
    });

    test('should calculate and return success rate', () => {
      expect(lambdaCode).toContain('success_rate');
      expect(lambdaCode).toContain("'successRate':");
    });
  });

  describe('Required Field Validation', () => {
    test('should validate required appointment fields', () => {
      expect(lambdaCode).toContain('if not patient_id or not appointment_time');
      expect(lambdaCode).toContain('Missing required appointment fields');
    });

    test('should handle no contact method scenario', () => {
      expect(lambdaCode).toContain('NO_CONTACT');
      expect(lambdaCode).toContain('No valid phone or email');
    });
  });

  describe('Type Hints', () => {
    test('should use type hints for better code quality', () => {
      expect(lambdaCode).toContain('Dict[str, Any]');
      expect(lambdaCode).toContain('List[Dict[str, Any]]');
      expect(lambdaCode).toContain('-> Dict[str, Any]:');
      expect(lambdaCode).toContain('-> None:');
      expect(lambdaCode).toContain('-> bool:');
      expect(lambdaCode).toContain('-> str:');
    });
  });
});