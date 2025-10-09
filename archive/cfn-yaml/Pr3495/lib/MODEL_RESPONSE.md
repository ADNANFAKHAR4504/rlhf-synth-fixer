# Report Generation Service Infrastructure

I'll create a comprehensive CloudFormation template for your report generation service. This solution uses Aurora Serverless v2 for quick deployment and includes all the required components.

## Main CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Report Generation Service - Produces 2,800 daily PDF reports with email delivery'

Parameters:
  EnvironmentName:
    Type: String
    Default: 'production'
    Description: 'Environment name for resource naming'

  DatabasePassword:
    Type: String
    NoEcho: true
    MinLength: 8
    Description: 'Master password for RDS PostgreSQL database'

  SenderEmail:
    Type: String
    Description: 'Verified SES sender email address'

Mappings:
  SubnetConfig:
    VPC:
      CIDR: '10.0.0.0/16'
    PrivateSubnetA:
      CIDR: '10.0.1.0/24'
    PrivateSubnetB:
      CIDR: '10.0.2.0/24'
    PublicSubnetA:
      CIDR: '10.0.10.0/24'
    PublicSubnetB:
      CIDR: '10.0.11.0/24'

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-report-vpc'

  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnetA, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-private-subnet-a'

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnetB, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-private-subnet-b'

  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnetA, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-public-subnet-a'

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnetB, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-public-subnet-b'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-igw'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnetA

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-public-rt'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetA
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetB
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-private-rt'

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway

  PrivateSubnetARouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetA
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnetBRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetB
      RouteTableId: !Ref PrivateRouteTable

  # S3 VPC Endpoint for secure access
  S3Endpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      RouteTableIds:
        - !Ref PrivateRouteTable

  # Security Groups
  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-lambda-sg'

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-db-sg'

  # RDS Aurora Serverless v2 PostgreSQL
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for Aurora database
      SubnetIds:
        - !Ref PrivateSubnetA
        - !Ref PrivateSubnetB
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-db-subnet-group'

  DBCluster:
    Type: AWS::RDS::DBCluster
    Properties:
      Engine: aurora-postgresql
      EngineVersion: '15.4'
      EngineMode: provisioned
      DatabaseName: reportdb
      MasterUsername: reportadmin
      MasterUserPassword: !Ref DatabasePassword
      DBSubnetGroupName: !Ref DBSubnetGroup
      VpcSecurityGroupIds:
        - !Ref DatabaseSecurityGroup
      ServerlessV2ScalingConfiguration:
        MinCapacity: 0.5
        MaxCapacity: 2
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - postgresql
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-aurora-cluster'

  DBInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      Engine: aurora-postgresql
      DBInstanceClass: db.serverless
      DBClusterIdentifier: !Ref DBCluster
      PubliclyAccessible: false
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt DBMonitoringRole.Arn

  DBMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole

  # S3 Bucket for PDF Storage
  ReportBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-report-pdfs-${AWS::AccountId}'
      IntelligentTieringConfiguration:
        Id: IntelligentTieringConfig
        Status: Enabled
        Tierings:
          - Days: 90
            AccessTier: ARCHIVE_INSTANT_ACCESS
          - Days: 180
            AccessTier: DEEP_ARCHIVE_ACCESS
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldReports
            Status: Enabled
            ExpirationInDays: 365
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-report-bucket'

  # SNS Topic for Failure Notifications
  FailureNotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${EnvironmentName}-report-failures'
      DisplayName: Report Generation Failures
      KmsMasterKeyId: alias/aws/sns

  # SQS Dead Letter Queue
  ReportDeadLetterQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${EnvironmentName}-report-dlq'
      MessageRetentionPeriod: 1209600
      VisibilityTimeout: 300
      KmsMasterKeyId: alias/aws/sqs

  # Lambda Layer for PDF Libraries
  PDFLibraryLayer:
    Type: AWS::Lambda::LayerVersion
    Properties:
      LayerName: !Sub '${EnvironmentName}-pdf-libraries'
      Description: 'PDF generation libraries including reportlab'
      Content:
        S3Bucket: !Ref LayerBucket
        S3Key: pdf-layer.zip
      CompatibleRuntimes:
        - python3.10

  LayerBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-lambda-layers-${AWS::AccountId}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: ReportGenerationPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetObject
                  - s3:GetObjectVersion
                Resource: !Sub '${ReportBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !GetAtt ReportBucket.Arn
              - Effect: Allow
                Action:
                  - ses:SendEmail
                  - ses:SendRawEmail
                Resource: '*'
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref FailureNotificationTopic
              - Effect: Allow
                Action:
                  - sqs:SendMessage
                  - sqs:GetQueueAttributes
                Resource: !GetAtt ReportDeadLetterQueue.Arn
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                Resource: '*'
              - Effect: Allow
                Action:
                  - rds-db:connect
                Resource: !Sub 'arn:aws:rds-db:${AWS::Region}:${AWS::AccountId}:dbuser:${DBCluster}/*'
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref DatabaseSecret

  # Database Secret
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${EnvironmentName}-db-credentials'
      SecretString: !Sub |
        {
          "username": "reportadmin",
          "password": "${DatabasePassword}",
          "engine": "postgresql",
          "host": "${DBCluster.Endpoint.Address}",
          "port": 5432,
          "dbname": "reportdb"
        }

  # Lambda Function for Report Generation
  ReportGeneratorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${EnvironmentName}-report-generator'
      Runtime: python3.10
      Handler: lambda_function.lambda_handler
      Code:
        S3Bucket: !Ref LayerBucket
        S3Key: lambda-code.zip
      Layers:
        - !Ref PDFLibraryLayer
      Environment:
        Variables:
          BUCKET_NAME: !Ref ReportBucket
          DB_SECRET_ARN: !Ref DatabaseSecret
          SNS_TOPIC_ARN: !Ref FailureNotificationTopic
          SENDER_EMAIL: !Ref SenderEmail
          AWS_LAMBDA_EXTENSIONS_ENABLED: 'true'
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnetA
          - !Ref PrivateSubnetB
      Timeout: 300
      MemorySize: 1024
      ReservedConcurrentExecutions: 100
      DeadLetterConfig:
        TargetArn: !GetAtt ReportDeadLetterQueue.Arn
      Role: !GetAtt LambdaExecutionRole.Arn

  # EventBridge Rule for Daily Execution
  DailyReportSchedule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${EnvironmentName}-daily-report-generation'
      Description: 'Trigger report generation daily at 6 AM'
      ScheduleExpression: 'cron(0 6 * * ? *)'
      State: ENABLED
      Targets:
        - Arn: !GetAtt ReportGeneratorFunction.Arn
          Id: ReportGeneratorTarget
          RetryPolicy:
            MaximumRetryAttempts: 2
            MaximumEventAge: 600

  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ReportGeneratorFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt DailyReportSchedule.Arn

  # CloudWatch Log Group
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ReportGeneratorFunction}'
      RetentionInDays: 30

  # CloudWatch Metrics and Alarms
  ReportGenerationFailureAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-report-generation-failures'
      AlarmDescription: 'Alert when report generation failures exceed threshold'
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ReportGeneratorFunction
      AlarmActions:
        - !Ref FailureNotificationTopic

  ReportGenerationDurationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-report-generation-duration'
      AlarmDescription: 'Alert when report generation takes too long'
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 240000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ReportGeneratorFunction
      AlarmActions:
        - !Ref FailureNotificationTopic

  # Custom Metrics for Report Generation
  ReportMetricsNamespace:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref LambdaLogGroup
      FilterName: !Sub '${EnvironmentName}-report-metrics'
      FilterPattern: '[timestamp, request_id, level = "INFO", metric = "REPORT_GENERATED", count]'
      MetricTransformations:
        - MetricNamespace: ReportGeneration
          MetricName: ReportsGenerated
          MetricValue: '1'
          Unit: Count

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'

  ReportBucketName:
    Description: 'Name of the S3 bucket for reports'
    Value: !Ref ReportBucket
    Export:
      Name: !Sub '${AWS::StackName}-ReportBucket'

  DatabaseEndpoint:
    Description: 'Database cluster endpoint'
    Value: !GetAtt DBCluster.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DBEndpoint'

  LambdaFunctionArn:
    Description: 'ARN of the report generator Lambda function'
    Value: !GetAtt ReportGeneratorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaArn'

  SNSTopicArn:
    Description: 'ARN of the failure notification topic'
    Value: !Ref FailureNotificationTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNSTopic'
```

## Lambda Function Code

```python
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
```

## Lambda Layer Build Script

```bash
#!/bin/bash
# build-layer.sh

# Create layer directory
mkdir -p python/lib/python3.10/site-packages

# Install dependencies
pip install --target python/lib/python3.10/site-packages \
    reportlab \
    psycopg2-binary \
    boto3

# Create layer zip
zip -r pdf-layer.zip python/

# Upload to S3
aws s3 cp pdf-layer.zip s3://${ENVIRONMENT_NAME}-lambda-layers-${ACCOUNT_ID}/

echo "Layer uploaded successfully"
```

## Lambda Code Package Script

```bash
#!/bin/bash
# package-lambda.sh

# Create package directory
mkdir -p lambda-package

# Copy lambda function
cp lambda_function.py lambda-package/

# Create deployment package
cd lambda-package
zip -r ../lambda-code.zip .
cd ..

# Upload to S3
aws s3 cp lambda-code.zip s3://${ENVIRONMENT_NAME}-lambda-layers-${ACCOUNT_ID}/

echo "Lambda code uploaded successfully"
```