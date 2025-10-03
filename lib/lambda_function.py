import os
import json
import boto3
import psycopg2
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import base64
import logging
import traceback
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
ses_client = boto3.client('ses')
sns_client = boto3.client('sns')
secretsmanager_client = boto3.client('secretsmanager')
cloudwatch_client = boto3.client('cloudwatch')

def get_database_connection():
    """Get database connection using credentials from Secrets Manager"""
    secret_arn = os.environ['DB_SECRET_ARN']

    try:
        response = secretsmanager_client.get_secret_value(SecretId=secret_arn)
        secret = json.loads(response['SecretString'])

        connection = psycopg2.connect(
            host=secret['host'],
            port=secret['port'],
            database=secret['dbname'],
            user=secret['username'],
            password=secret['password']
        )
        return connection
    except Exception as e:
        logger.error(f"Failed to connect to database: {str(e)}")
        raise

def generate_pdf_report(report_data, report_id):
    """Generate PDF report from data"""
    pdf_filename = f"/tmp/report_{report_id}.pdf"

    c = canvas.Canvas(pdf_filename, pagesize=letter)
    width, height = letter

    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, f"Report #{report_id}")

    # Date
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 70, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Content
    y_position = height - 100
    for key, value in report_data.items():
        if y_position < 100:
            c.showPage()
            y_position = height - 50
        c.drawString(50, y_position, f"{key}: {value}")
        y_position -= 20

    c.save()
    return pdf_filename

def upload_to_s3(file_path, report_id):
    """Upload PDF to S3 and return presigned URL"""
    bucket_name = os.environ['BUCKET_NAME']
    key = f"reports/{datetime.now().strftime('%Y/%m/%d')}/report_{report_id}.pdf"

    try:
        with open(file_path, 'rb') as f:
            s3_client.put_object(
                Bucket=bucket_name,
                Key=key,
                Body=f,
                ContentType='application/pdf',
                ServerSideEncryption='AES256',
                Metadata={
                    'report_id': str(report_id),
                    'generated_at': datetime.now().isoformat()
                }
            )

        # Generate presigned URL with 7-day expiration
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket_name, 'Key': key},
            ExpiresIn=604800  # 7 days in seconds
        )

        return presigned_url
    except Exception as e:
        logger.error(f"Failed to upload to S3: {str(e)}")
        raise

def send_email_with_attachment(recipient_email, report_id, presigned_url):
    """Send email with report attachment link"""
    sender_email = os.environ['SENDER_EMAIL']

    msg = MIMEMultipart()
    msg['Subject'] = f'Daily Report #{report_id}'
    msg['From'] = sender_email
    msg['To'] = recipient_email

    # Email body
    body = f"""
    Your daily report #{report_id} has been generated successfully.

    You can download the report from the following link (valid for 7 days):
    {presigned_url}

    Best regards,
    Report Generation Service
    """

    msg.attach(MIMEText(body, 'plain'))

    try:
        response = ses_client.send_raw_email(
            Source=sender_email,
            Destinations=[recipient_email],
            RawMessage={'Data': msg.as_string()}
        )
        return response['MessageId']
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        raise

def publish_metrics(success_count, failure_count, duration):
    """Publish custom CloudWatch metrics"""
    try:
        cloudwatch_client.put_metric_data(
            Namespace='ReportGeneration',
            MetricData=[
                {
                    'MetricName': 'SuccessfulReports',
                    'Value': success_count,
                    'Unit': 'Count',
                    'Timestamp': datetime.now()
                },
                {
                    'MetricName': 'FailedReports',
                    'Value': failure_count,
                    'Unit': 'Count',
                    'Timestamp': datetime.now()
                },
                {
                    'MetricName': 'ProcessingDuration',
                    'Value': duration,
                    'Unit': 'Seconds',
                    'Timestamp': datetime.now()
                }
            ]
        )
    except Exception as e:
        logger.error(f"Failed to publish metrics: {str(e)}")

def lambda_handler(event, context):
    """Main Lambda handler"""
    start_time = datetime.now()
    success_count = 0
    failure_count = 0
    failed_reports = []

    try:
        # Get database connection
        connection = get_database_connection()
        cursor = connection.cursor()

        # Query for reports to generate
        cursor.execute("""
            SELECT report_id, recipient_email, query_sql, parameters
            FROM report_configurations
            WHERE is_active = true
            ORDER BY priority DESC, report_id
            LIMIT 2800
        """)

        reports = cursor.fetchall()

        for report in reports:
            try:
                report_id, recipient_email, query_sql, parameters = report

                # Execute report query
                cursor.execute(query_sql, parameters if parameters else ())
                report_data = dict(zip([desc[0] for desc in cursor.description], cursor.fetchone()))

                # Generate PDF
                pdf_file = generate_pdf_report(report_data, report_id)

                # Upload to S3
                presigned_url = upload_to_s3(pdf_file, report_id)

                # Send email
                send_email_with_attachment(recipient_email, report_id, presigned_url)

                # Clean up temp file
                os.remove(pdf_file)

                success_count += 1
                logger.info(f"REPORT_GENERATED {report_id}")

            except Exception as e:
                failure_count += 1
                failed_reports.append(report_id)
                logger.error(f"Failed to generate report {report_id}: {str(e)}")
                continue

        cursor.close()
        connection.close()

        # Calculate duration
        duration = (datetime.now() - start_time).total_seconds()

        # Publish metrics
        publish_metrics(success_count, failure_count, duration)

        # Send failure notification if needed
        if failure_count > 0:
            sns_client.publish(
                TopicArn=os.environ['SNS_TOPIC_ARN'],
                Subject='Report Generation Failures',
                Message=f"Failed to generate {failure_count} reports. Failed IDs: {failed_reports[:10]}"
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'success_count': success_count,
                'failure_count': failure_count,
                'duration': duration
            })
        }

    except Exception as e:
        logger.error(f"Critical error in report generation: {str(e)}\n{traceback.format_exc()}")

        # Send critical failure notification
        sns_client.publish(
            TopicArn=os.environ['SNS_TOPIC_ARN'],
            Subject='Critical Report Generation Failure',
            Message=f"Report generation job failed completely: {str(e)}"
        )

        raise