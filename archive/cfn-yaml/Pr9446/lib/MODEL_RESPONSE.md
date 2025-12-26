```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Automated daily backup solution for EC2 instance using EventBridge, Lambda, SSM, and S3. The solution creates a secure, event-driven backup workflow that compresses application data and stores it in an encrypted S3 bucket without requiring additional ports or SSH access.'

Parameters:
  InstanceId:
    Type: AWS::EC2::Instance::Id
    Description: 'Existing EC2 instance ID to backup'

  BackupSchedule:
    Type: String
    Default: 'cron(0 2 * * ? *)'
    Description: 'Backup schedule in cron format (default: daily at 2 AM UTC)'

  ApplicationDataPath:
    Type: String
    Default: '/var/www/html'
    Description: 'Path to application data to backup'

Resources:
  # S3 Bucket for storing backups
  BackupBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-ec2-backups-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldBackups
            Status: Enabled
            ExpirationInDays: 30
            NoncurrentVersionExpirationInDays: 7
      LoggingConfiguration:
        DestinationBucketName: !Ref AccessLogsBucket
        LogFilePrefix: 'backup-access-logs/'
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: 's3:ObjectCreated:*'
            CloudWatchConfiguration:
              LogGroupName: !Ref BackupLogGroup

  # S3 Bucket for access logs
  AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-access-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  # CloudWatch Log Group for backup operations
  BackupLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/backup/${AWS::StackName}'
      RetentionInDays: 14

  # IAM Role for Lambda function
  BackupLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-backup-lambda-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: SSMSendCommandPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ssm:SendCommand
                  - ssm:GetCommandInvocation
                  - ssm:DescribeInstanceInformation
                Resource:
                  - !Sub 'arn:aws:ec2:${AWS::Region}:${AWS::AccountId}:instance/${InstanceId}'
                  - !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:document/${BackupSSMDocument}'
                  - !Sub 'arn:aws:ssm:${AWS::Region}:*:*'
                Condition:
                  StringEquals:
                    'ssm:ResourceTag/BackupEnabled': 'true'
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub '${BackupLogGroup}:*'

  # IAM Role for EC2 instance
  EC2BackupRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-ec2-backup-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: S3BackupPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:PutObjectAcl
                Resource: !Sub '${BackupBucket}/*'
              - Effect: Allow
                Action:
                  - s3:ListBucket
                Resource: !Ref BackupBucket

  # Instance Profile for EC2
  EC2BackupInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${AWS::StackName}-ec2-backup-profile'
      Roles:
        - !Ref EC2BackupRole

  # SSM Document for backup commands
  BackupSSMDocument:
    Type: AWS::SSM::Document
    Properties:
      DocumentType: Command
      DocumentFormat: YAML
      Name: !Sub '${AWS::StackName}-backup-document'
      Content:
        schemaVersion: '2.2'
        description: 'Backup application data and upload to S3'
        parameters:
          bucketName:
            type: String
            description: 'S3 bucket name for backups'
          dataPath:
            type: String
            description: 'Path to application data'
            default: '/var/www/html'
        mainSteps:
          - action: 'aws:runShellScript'
            name: 'backupApplicationData'
            inputs:
              timeoutSeconds: '3600'
              runCommand:
                - '#!/bin/bash'
                - 'set -e'
                - 'TIMESTAMP=$(date +%Y%m%d_%H%M%S)'
                - 'HOSTNAME=$(hostname)'
                - 'BACKUP_FILE="/tmp/backup_${HOSTNAME}_${TIMESTAMP}.tar.gz"'
                - 'DATA_PATH="{{ dataPath }}"'
                - 'BUCKET_NAME="{{ bucketName }}"'
                - ''
                - 'echo "Starting backup process at $(date)"'
                - 'echo "Backing up data from: $DATA_PATH"'
                - 'echo "Backup file: $BACKUP_FILE"'
                - ''
                - '# Create compressed archive of application data'
                - 'if [ -d "$DATA_PATH" ]; then'
                - '  tar -czf "$BACKUP_FILE" -C "$(dirname "$DATA_PATH")" "$(basename "$DATA_PATH")" 2>/dev/null || {'
                - '    echo "Error: Failed to create backup archive"'
                - '    exit 1'
                - '  }'
                - 'else'
                - '  echo "Error: Data path $DATA_PATH does not exist"'
                - '  exit 1'
                - 'fi'
                - ''
                - '# Verify backup file was created'
                - 'if [ ! -f "$BACKUP_FILE" ]; then'
                - '  echo "Error: Backup file was not created"'
                - '  exit 1'
                - 'fi'
                - ''
                - 'BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)'
                - 'echo "Backup archive created successfully. Size: $BACKUP_SIZE"'
                - ''
                - '# Upload to S3'
                - 'S3_KEY="backups/${HOSTNAME}/${TIMESTAMP}/backup_${HOSTNAME}_${TIMESTAMP}.tar.gz"'
                - 'echo "Uploading to s3://${BUCKET_NAME}/${S3_KEY}"'
                - ''
                - 'aws s3 cp "$BACKUP_FILE" "s3://${BUCKET_NAME}/${S3_KEY}" --region us-east-1 || {'
                - '  echo "Error: Failed to upload backup to S3"'
                - '  rm -f "$BACKUP_FILE"'
                - '  exit 1'
                - '}'
                - ''
                - '# Clean up local backup file'
                - 'rm -f "$BACKUP_FILE"'
                - 'echo "Backup completed successfully at $(date)"'
                - 'echo "Backup stored at: s3://${BUCKET_NAME}/${S3_KEY}"'

  # Lambda function for backup orchestration
  BackupLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-backup-orchestrator'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt BackupLambdaRole.Arn
      Timeout: 300
      Environment:
        Variables:
          INSTANCE_ID: !Ref InstanceId
          BUCKET_NAME: !Ref BackupBucket
          SSM_DOCUMENT_NAME: !Ref BackupSSMDocument
          DATA_PATH: !Ref ApplicationDataPath
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import logging
          from datetime import datetime

          # Configure logging
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          def lambda_handler(event, context):
              """
              Lambda function to orchestrate EC2 backup using SSM Run Command.
              This function is triggered by EventBridge on a daily schedule.
              """
              
              ssm_client = boto3.client('ssm')
              
              instance_id = os.environ['INSTANCE_ID']
              bucket_name = os.environ['BUCKET_NAME']
              document_name = os.environ['SSM_DOCUMENT_NAME']
              data_path = os.environ['DATA_PATH']
              
              logger.info(f"Starting backup process for instance: {instance_id}")
              
              try:
                  # Check if instance is available for SSM
                  response = ssm_client.describe_instance_information(
                      Filters=[
                          {
                              'Key': 'InstanceIds',
                              'Values': [instance_id]
                          }
                      ]
                  )
                  
                  if not response['InstanceInformationList']:
                      raise Exception(f"Instance {instance_id} is not available for SSM")
                  
                  instance_info = response['InstanceInformationList'][0]
                  if instance_info['PingStatus'] != 'Online':
                      raise Exception(f"Instance {instance_id} is not online. Status: {instance_info['PingStatus']}")
                  
                  # Send backup command to EC2 instance
                  command_response = ssm_client.send_command(
                      InstanceIds=[instance_id],
                      DocumentName=document_name,
                      Parameters={
                          'bucketName': [bucket_name],
                          'dataPath': [data_path]
                      },
                      Comment=f'Automated backup initiated at {datetime.utcnow().isoformat()}',
                      TimeoutSeconds=3600
                  )
                  
                  command_id = command_response['Command']['CommandId']
                  logger.info(f"Backup command sent successfully. Command ID: {command_id}")
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Backup command sent successfully',
                          'commandId': command_id,
                          'instanceId': instance_id,
                          'timestamp': datetime.utcnow().isoformat()
                      })
                  }
                  
              except Exception as e:
                  logger.error(f"Error initiating backup: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': json.dumps({
                          'error': str(e),
                          'instanceId': instance_id,
                          'timestamp': datetime.utcnow().isoformat()
                      })
                  }

  # EventBridge Rule for daily backup schedule
  BackupScheduleRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${AWS::StackName}-daily-backup-schedule'
      Description: 'Daily trigger for automated EC2 backup process'
      ScheduleExpression: !Ref BackupSchedule
      State: ENABLED
      Targets:
        - Arn: !GetAtt BackupLambdaFunction.Arn
          Id: 'BackupLambdaTarget'
          Input: !Sub |
            {
              "source": "aws.events",
              "detail-type": "Scheduled Event",
              "detail": {
                "instance-id": "${InstanceId}",
                "backup-type": "daily-automated"
              }
            }

  # Permission for EventBridge to invoke Lambda
  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref BackupLambdaFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt BackupScheduleRule.Arn

  # Tag the EC2 instance for backup eligibility
  EC2BackupTag:
    Type: AWS::EC2::Tag
    Properties:
      ResourceId: !Ref InstanceId
      ResourceType: 'instance'
      Key: 'BackupEnabled'
      Value: 'true'

  # Attach IAM role to existing EC2 instance
  EC2InstanceProfileAssociation:
    Type: AWS::EC2::AssociateIamInstanceProfile
    Properties:
      InstanceId: !Ref InstanceId
      IamInstanceProfile: !Ref EC2BackupInstanceProfile

Outputs:
  BackupBucketName:
    Description: 'Name of the S3 bucket storing backups'
    Value: !Ref BackupBucket
    Export:
      Name: !Sub '${AWS::StackName}-backup-bucket'

  BackupBucketArn:
    Description: 'ARN of the S3 backup bucket'
    Value: !GetAtt BackupBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-backup-bucket-arn'

  LambdaFunctionArn:
    Description: 'ARN of the backup orchestration Lambda function'
    Value: !GetAtt BackupLambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-lambda-function-arn'

  SSMDocumentName:
    Description: 'Name of the SSM document for backup operations'
    Value: !Ref BackupSSMDocument
    Export:
      Name: !Sub '${AWS::StackName}-ssm-document'

  BackupSchedule:
    Description: 'Backup schedule expression'
    Value: !Ref BackupSchedule
    Export:
      Name: !Sub '${AWS::StackName}-backup-schedule'

  LogGroupName:
    Description: 'CloudWatch Log Group for backup operations'
    Value: !Ref BackupLogGroup
    Export:
      Name: !Sub '${AWS::StackName}-log-group'
```
