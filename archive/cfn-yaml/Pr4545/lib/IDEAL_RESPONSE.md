```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure and Highly Available Production Environment'

Parameters:
  EnvironmentSuffix:
    Description: Environment suffix for resource naming
    Type: String
    Default: dev

Resources:
  # ==================== EC2 Key Pair ====================
  EC2KeyPair:
    Type: AWS::EC2::KeyPair
    DeletionPolicy: Delete
    Properties:
      KeyName: !Sub '${EnvironmentSuffix}-ec2-keypair'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ==================== Secrets Manager ====================
  DbSecret:
    Type: AWS::SecretsManager::Secret
    DeletionPolicy: Delete
    Properties:
      Name: !Sub '${EnvironmentSuffix}-db-credentials'
      Description: RDS database credentials
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: password
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ==================== KMS Keys ====================
  KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for encrypting production resources
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow services to use the key
            Effect: Allow
            Principal:
              Service:
                - s3.amazonaws.com
                - dynamodb.amazonaws.com
                - rds.amazonaws.com
                - cloudtrail.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  KMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${EnvironmentSuffix}-kms-key'
      TargetKeyId: !Ref KMSKey

  # ==================== VPC and Networking ====================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-VPC'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-Public-Subnet-1'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-Public-Subnet-2'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.10.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-Private-Subnet-1'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.20.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-Private-Subnet-2'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-IGW'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

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
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-NAT-EIP'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-NAT-Gateway'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-Public-Route-Table'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-Private-Route-Table'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

  PublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # ==================== Security Groups ====================
  ApplicationLoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ALB - allows HTTP and HTTPS
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-ALB-SG'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances - allows traffic from ALB and SSH from VPC
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ApplicationLoadBalancerSecurityGroup
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ApplicationLoadBalancerSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/16
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-EC2-SG'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-RDS-SG'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ==================== IAM Roles and Policies ====================
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  EC2RolePolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: EC2LeastPrivilegePolicy
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: S3Access
            Effect: Allow
            Action:
              - 's3:GetObject'
              - 's3:PutObject'
              - 's3:DeleteObject'
              - 's3:ListBucket'
            Resource:
              - !GetAtt S3Bucket.Arn
              - !Sub '${S3Bucket.Arn}/*'
          - Sid: DynamoDBAccess
            Effect: Allow
            Action:
              - 'dynamodb:GetItem'
              - 'dynamodb:PutItem'
              - 'dynamodb:Query'
              - 'dynamodb:Scan'
              - 'dynamodb:UpdateItem'
              - 'dynamodb:DeleteItem'
              - 'dynamodb:BatchGetItem'
              - 'dynamodb:BatchWriteItem'
            Resource: !GetAtt DynamoDBTable.Arn
          - Sid: KMSAccess
            Effect: Allow
            Action:
              - 'kms:Decrypt'
              - 'kms:Encrypt'
              - 'kms:GenerateDataKey'
            Resource: !GetAtt KMSKey.Arn
          - Sid: CloudWatchLogs
            Effect: Allow
            Action:
              - 'logs:CreateLogGroup'
              - 'logs:CreateLogStream'
              - 'logs:PutLogEvents'
            Resource: '*'
          - Sid: SecretsManagerAccess
            Effect: Allow
            Action:
              - 'secretsmanager:GetSecretValue'
            Resource: !Ref DbSecret
      Roles:
        - !Ref EC2Role

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  DynamoDBAutoScaleRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: application-autoscaling.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: DynamoDBAutoScalingPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'dynamodb:DescribeTable'
                  - 'dynamodb:UpdateTable'
                Resource: !GetAtt DynamoDBTable.Arn
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricAlarm'
                  - 'cloudwatch:DescribeAlarms'
                  - 'cloudwatch:GetMetricStatistics'
                  - 'cloudwatch:SetAlarmState'
                  - 'cloudwatch:DeleteAlarms'
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ==================== Application Load Balancer ====================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${EnvironmentSuffix}-ALB'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ApplicationLoadBalancerSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${EnvironmentSuffix}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      Targets:
        - Id: !Ref EC2Instance
          Port: 80
      HealthCheckEnabled: true
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # ==================== EC2 Instance ====================
  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      InstanceType: t3.micro
      SubnetId: !Ref PrivateSubnet1
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      KeyName: !Ref EC2KeyPair
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 30
            VolumeType: gp3
            Encrypted: true
            KmsKeyId: !Ref KMSKey
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y python3 python3-pip mysql jq
          pip3 install pymysql boto3 cryptography
          
          # Get RDS endpoint and credentials
          RDS_ENDPOINT="${RDSInstance.Endpoint.Address}"
          SECRET_ARN="${DbSecret}"
          REGION="${AWS::Region}"
          DYNAMODB_TABLE="${DynamoDBTable}"
          
          # Create Python server script
          cat > /home/ec2-user/server.py << 'EOFPYTHON'
          #!/usr/bin/env python3
          import pymysql
          import json
          import boto3
          from http.server import HTTPServer, BaseHTTPRequestHandler
          import os
          import time
          from datetime import datetime
          
          def test_rds_connection():
              try:
                  # Get credentials from Secrets Manager
                  client = boto3.client('secretsmanager', region_name=os.environ.get('AWS_REGION'))
                  secret_value = client.get_secret_value(SecretId=os.environ.get('SECRET_ARN'))
                  secret = json.loads(secret_value['SecretString'])
                  
                  # Test connection
                  connection = pymysql.connect(
                      host=os.environ.get('RDS_ENDPOINT'),
                      user=secret['username'],
                      password=secret['password'],
                      connect_timeout=5
                  )
                  
                  # Get MySQL version
                  with connection.cursor() as cursor:
                      cursor.execute("SELECT VERSION()")
                      version = cursor.fetchone()[0]
                  
                  connection.close()
                  
                  return {
                      'status': 'SUCCESS',
                      'message': 'Connected to RDS successfully',
                      'mysql_version': version,
                      'endpoint': os.environ.get('RDS_ENDPOINT')
                  }
              except Exception as e:
                  return {
                      'status': 'FAILED',
                      'message': str(e),
                      'endpoint': os.environ.get('RDS_ENDPOINT')
                  }
          
          def test_dynamodb_connection():
              try:
                  # Create DynamoDB client
                  dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION'))
                  table = dynamodb.Table(os.environ.get('DYNAMODB_TABLE'))
                  
                  # Test write - put a test item
                  test_id = f"health-check-{int(time.time())}"
                  test_item = {
                      'id': test_id,
                      'timestamp': int(time.time()),
                      'test_data': 'Connection test',
                      'datetime': datetime.utcnow().isoformat()
                  }
                  table.put_item(Item=test_item)
                  
                  # Test read - get the item back
                  response = table.get_item(Key={'id': test_id, 'timestamp': test_item['timestamp']})
                  
                  # Test delete - clean up test item
                  table.delete_item(Key={'id': test_id, 'timestamp': test_item['timestamp']})
                  
                  return {
                      'status': 'SUCCESS',
                      'message': 'Connected to DynamoDB successfully - Write/Read/Delete operations completed',
                      'table_name': os.environ.get('DYNAMODB_TABLE'),
                      'test_item_id': test_id
                  }
              except Exception as e:
                  return {
                      'status': 'FAILED',
                      'message': str(e),
                      'table_name': os.environ.get('DYNAMODB_TABLE')
                  }
          
          class RequestHandler(BaseHTTPRequestHandler):
              def do_GET(self):
                  rds_result = test_rds_connection()
                  dynamodb_result = test_dynamodb_connection()
                  
                  self.send_response(200)
                  self.send_header('Content-type', 'text/html')
                  self.end_headers()
                  
                  html = f"""
                  <!DOCTYPE html>
                  <html>
                  <head>
                      <title>${EnvironmentSuffix} Environment</title>
                      <style>
                          body {{ font-family: Arial, sans-serif; margin: 40px; }}
                          .success {{ color: green; font-weight: bold; }}
                          .failed {{ color: red; font-weight: bold; }}
                          .info {{ background: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }}
                      </style>
                  </head>
                  <body>
                      <h1>${EnvironmentSuffix} Environment - Secure Instance</h1>
                      
                      <h2>RDS Connection Test</h2>
                      <div class="info">
                          <p><strong>Status:</strong> <span class="{rds_result['status'].lower()}">{rds_result['status']}</span></p>
                          <p><strong>Message:</strong> {rds_result['message']}</p>
                          <p><strong>Endpoint:</strong> {rds_result.get('endpoint', 'N/A')}</p>
                          {f"<p><strong>MySQL Version:</strong> {rds_result.get('mysql_version', 'N/A')}</p>" if rds_result['status'] == 'SUCCESS' else ''}
                      </div>
                      
                      <h2>DynamoDB Connection Test</h2>
                      <div class="info">
                          <p><strong>Status:</strong> <span class="{dynamodb_result['status'].lower()}">{dynamodb_result['status']}</span></p>
                          <p><strong>Message:</strong> {dynamodb_result['message']}</p>
                          <p><strong>Table Name:</strong> {dynamodb_result.get('table_name', 'N/A')}</p>
                          {f"<p><strong>Test Item ID:</strong> {dynamodb_result.get('test_item_id', 'N/A')}</p>" if dynamodb_result['status'] == 'SUCCESS' else ''}
                      </div>
                  </body>
                  </html>
                  """
                  
                  self.wfile.write(html.encode())
              
              def log_message(self, format, *args):
                  pass
          
          if __name__ == '__main__':
              server = HTTPServer(('0.0.0.0', 80), RequestHandler)
              print('Server started on port 80')
              server.serve_forever()
          EOFPYTHON
          
          # Set environment variables and run server
          export RDS_ENDPOINT="$RDS_ENDPOINT"
          export SECRET_ARN="$SECRET_ARN"
          export AWS_REGION="$REGION"
          export DYNAMODB_TABLE="$DYNAMODB_TABLE"
          
          # Make script executable and run
          chmod +x /home/ec2-user/server.py
          nohup python3 /home/ec2-user/server.py > /var/log/server.log 2>&1 &
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-EC2-Instance'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ==================== S3 Bucket ====================
  S3Bucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub '${EnvironmentSuffix}-secure-bucket-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3Bucket
      PolicyDocument:
        Statement:
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${S3Bucket.Arn}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'

  # ==================== DynamoDB Table ====================
  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${EnvironmentSuffix}-Table'
      BillingMode: PROVISIONED
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: N
      KeySchema:
        - AttributeName: id
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE
      ProvisionedThroughput:
        ReadCapacityUnits: 5
        WriteCapacityUnits: 5
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
        KMSMasterKeyId: !Ref KMSKey
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # DynamoDB Auto Scaling
  DynamoDBTableWriteCapacityScalableTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 100
      MinCapacity: 5
      ResourceId: !Sub 'table/${DynamoDBTable}'
      RoleARN: !GetAtt DynamoDBAutoScaleRole.Arn
      ScalableDimension: dynamodb:table:WriteCapacityUnits
      ServiceNamespace: dynamodb

  DynamoDBTableWriteScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub '${EnvironmentSuffix}-Table-Write-AutoScaling'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref DynamoDBTableWriteCapacityScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70.0
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBWriteCapacityUtilization

  DynamoDBTableReadCapacityScalableTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 100
      MinCapacity: 5
      ResourceId: !Sub 'table/${DynamoDBTable}'
      RoleARN: !GetAtt DynamoDBAutoScaleRole.Arn
      ScalableDimension: dynamodb:table:ReadCapacityUnits
      ServiceNamespace: dynamodb

  DynamoDBTableReadScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub '${EnvironmentSuffix}-Table-Read-AutoScaling'
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref DynamoDBTableReadCapacityScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70.0
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBReadCapacityUtilization

  # ==================== RDS ====================
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub '${EnvironmentSuffix}-db-instance'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.4.6'
      MasterUsername: !Sub '{{resolve:secretsmanager:${DbSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DbSecret}:SecretString:password}}'
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      MultiAZ: true
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      BackupRetentionPeriod: 0
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      DeleteAutomatedBackups: true
      EnableCloudwatchLogsExports:
        - error
        - general
        - slowquery
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ==================== CloudTrail ====================
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Delete
    Properties:
      BucketName: !Sub '${EnvironmentSuffix}-cloudtrail-logs-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref KMSKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${EnvironmentSuffix}-CloudTrail'
      S3BucketName: !Ref CloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - IncludeManagementEvents: true
          ReadWriteType: All
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${S3Bucket.Arn}/*'
            - Type: 'AWS::DynamoDB::Table'
              Values:
                - !GetAtt DynamoDBTable.Arn
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ==================== CloudWatch Alarms ====================
  EC2CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentSuffix}-EC2-High-CPU'
      AlarmDescription: Alert when EC2 CPU exceeds 80%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref EC2Instance

  RDSStorageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentSuffix}-RDS-Low-Storage'
      AlarmDescription: Alert when RDS free storage is low
      MetricName: FreeStorageSpace
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 2147483648  # 2GB in bytes
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref RDSInstance

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  ALBDNSName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  S3BucketName:
    Description: S3 Bucket Name
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'

  DynamoDBTableName:
    Description: DynamoDB Table Name
    Value: !Ref DynamoDBTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDB-Table'

  RDSEndpoint:
    Description: RDS Instance Endpoint
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  EC2InstanceId:
    Description: EC2 Instance ID
    Value: !Ref EC2Instance
    Export:
      Name: !Sub '${AWS::StackName}-EC2-Instance'

  CloudTrailName:
    Description: CloudTrail Name
    Value: !Ref CloudTrail
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail'
```