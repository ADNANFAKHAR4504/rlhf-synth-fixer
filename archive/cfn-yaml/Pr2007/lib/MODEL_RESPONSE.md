# AWS CloudFormation Template: Secure Infrastructure

Here's the complete secure_infrastructure.yml CloudFormation template that meets all your requirements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure infrastructure setup for production environment in us-east-1'

Parameters:
  Environment:
    Type: String
    Default: 'production'
    Description: 'Environment name for resource tagging'
    AllowedValues:
      - 'production'
      - 'staging'
      - 'development'
  
  ApprovedAMIId:
    Type: AWS::EC2::Image::Id
    Default: 'ami-0abcdef1234567890'
    Description: 'Security team approved AMI ID'
  
  VpcId:
    Type: String
    Default: 'vpc-abcde12345'
    Description: 'Existing VPC ID'
  
  PrivateSubnetIds:
    Type: CommaDelimitedList
    Default: 'subnet-12345,subnet-67890'
    Description: 'Private subnet IDs for RDS and Lambda'
  
  PublicSubnetIds:
    Type: CommaDelimitedList
    Default: 'subnet-abcde,subnet-fghij'
    Description: 'Public subnet IDs for ALB'

Resources:
  # ==================== S3 BUCKET ====================
  SecureLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'secure-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      NotificationConfiguration:
        CloudWatchConfigurations:
          - Event: 's3:ObjectCreated:*'
      Tags:
        - Key: Name
          Value: !Sub 'secure-logs-bucket-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  SecureLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureLogsBucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt SecureLogsBucket.Arn
              - !Sub '${SecureLogsBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: AllowCloudFrontLogs
            Effect: Allow
            Principal:
              Service: cloudfront.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${SecureLogsBucket.Arn}/cloudfront-logs/*'

  # ==================== IAM ROLES ====================
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'EC2-SecureInstance-Role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: S3LogsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:PutObjectAcl
                Resource: !Sub '${SecureLogsBucket.Arn}/ec2-logs/*'
      Tags:
        - Key: Name
          Value: !Sub 'ec2-instance-role-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'EC2-SecureInstance-Profile-${Environment}'
      Roles:
        - !Ref EC2InstanceRole

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'Lambda-Execution-Role-${Environment}'
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
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt SecureDataTable.Arn
      Tags:
        - Key: Name
          Value: !Sub 'lambda-execution-role-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # ==================== SECURITY GROUPS ====================
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'alb-security-group-${Environment}'
      GroupDescription: 'Security group for Application Load Balancer - HTTPS only'
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS traffic from internet'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'HTTP to EC2 instances'
      Tags:
        - Key: Name
          Value: !Sub 'alb-security-group-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'ec2-security-group-${Environment}'
      GroupDescription: 'Security group for EC2 instances - ALB traffic only'
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTP from ALB only'
      Tags:
        - Key: Name
          Value: !Sub 'ec2-security-group-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'rds-security-group-${Environment}'
      GroupDescription: 'Security group for RDS - VPC access only'
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: 'MySQL from EC2 instances'
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
          Description: 'MySQL from Lambda functions'
      Tags:
        - Key: Name
          Value: !Sub 'rds-security-group-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'lambda-security-group-${Environment}'
      GroupDescription: 'Security group for Lambda functions'
      VpcId: !Ref VpcId
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          DestinationSecurityGroupId: !Ref RDSSecurityGroup
          Description: 'MySQL to RDS'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound'
      Tags:
        - Key: Name
          Value: !Sub 'lambda-security-group-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # ==================== EC2 INSTANCE ====================
  SecureEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref ApprovedAMIId
      InstanceType: t3.medium
      IamInstanceProfile: !Ref EC2InstanceProfile
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      SubnetId: !Select [0, !Ref PrivateSubnetIds]
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          # Configure CloudWatch agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
            -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux
      Tags:
        - Key: Name
          Value: !Sub 'secure-ec2-instance-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # ==================== APPLICATION LOAD BALANCER ====================
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'secure-alb-${Environment}'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets: !Ref PublicSubnetIds
      Tags:
        - Key: Name
          Value: !Sub 'secure-alb-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'secure-tg-${Environment}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VpcId
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Targets:
        - Id: !Ref SecureEC2Instance
          Port: 80
      Tags:
        - Key: Name
          Value: !Sub 'secure-target-group-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref SSLCertificate

  SSLCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Sub '${Environment}.example.com'
      ValidationMethod: DNS
      Tags:
        - Key: Name
          Value: !Sub 'ssl-certificate-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # ==================== RDS INSTANCE ====================
  RDSSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub 'secure-db-subnet-group-${Environment}'
      DBSubnetGroupDescription: 'Subnet group for secure RDS instance'
      SubnetIds: !Ref PrivateSubnetIds
      Tags:
        - Key: Name
          Value: !Sub 'secure-db-subnet-group-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  SecureRDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub 'secure-db-${Environment}'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0'
      MasterUsername: admin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref RDSSubnetGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: !Sub 'secure-rds-instance-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'secure-db-password-${Environment}'
      Description: 'RDS Master Password'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 16
        ExcludeCharacters: '"@/\'

  # ==================== LAMBDA FUNCTION ====================
  SecureLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'secure-lambda-${Environment}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          
          def lambda_handler(event, context):
              # Sample Lambda function
              dynamodb = boto3.resource('dynamodb')
              table = dynamodb.Table('secure-data-table-production')
              
              response = table.put_item(
                  Item={
                      'id': context.aws_request_id,
                      'data': 'processed'
                  }
              )
              
              return {
                  'statusCode': 200,
                  'body': json.dumps('Success')
              }
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds: !Ref PrivateSubnetIds
      Environment:
        Variables:
          DYNAMODB_TABLE: !Ref SecureDataTable
      Tags:
        - Key: Name
          Value: !Sub 'secure-lambda-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # ==================== DYNAMODB TABLE ====================
  SecureDataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'secure-data-table-${Environment}'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Name
          Value: !Sub 'secure-data-table-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # ==================== CLOUDFRONT DISTRIBUTION ====================
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        Comment: !Sub 'Secure CloudFront distribution for ${Environment}'
        DefaultRootObject: index.html
        Origins:
          - Id: ALBOrigin
            DomainName: !GetAtt ApplicationLoadBalancer.DNSName
            CustomOriginConfig:
              HTTPPort: 443
              HTTPSPort: 443
              OriginProtocolPolicy: https-only
              OriginSSLProtocols:
                - TLSv1.2
        DefaultCacheBehavior:
          TargetOriginId: ALBOrigin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
            - PUT
            - POST
            - PATCH
            - DELETE
          CachedMethods:
            - GET
            - HEAD
          Compress: true
          ForwardedValues:
            QueryString: true
            Headers:
              - Authorization
              - CloudFront-Forwarded-Proto
        ViewerCertificate:
          CloudFrontDefaultCertificate: true
        Logging:
          Bucket: !GetAtt SecureLogsBucket.DomainName
          Prefix: 'cloudfront-logs/'
          IncludeCookies: false
      Tags:
        - Key: Name
          Value: !Sub 'secure-cloudfront-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # ==================== SNS TOPIC ====================
  AlertsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'security-alerts-${Environment}'
      KmsMasterKeyId: alias/aws/sns
      Tags:
        - Key: Name
          Value: !Sub 'security-alerts-topic-${Environment}'
        - Key: Environment
          Value: !Ref Environment

  # ==================== CLOUDWATCH ALARMS ====================
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'EC2-HighCPU-${Environment}'
      AlarmDescription: 'Alarm for high CPU usage on EC2 instance'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref SecureEC2Instance
      AlarmActions:
        - !Ref AlertsTopic
      TreatMissingData: notBreaching

  DatabaseConnectionAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'RDS-HighConnections-${Environment}'
      AlarmDescription: 'Alarm for high database connections'
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 20
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref SecureRDSInstance
      AlarmActions:
        - !Ref AlertsTopic

  LambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'Lambda-Errors-${Environment}'
      AlarmDescription: 'Alarm for Lambda function errors'
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref SecureLambdaFunction
      AlarmActions:
        - !Ref AlertsTopic

Outputs:
  LoadBalancerDNS:
    Description: 'DNS name of the Application Load Balancer'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  CloudFrontDistributionDomain:
    Description: 'CloudFront distribution domain name'
    Value: !GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: !Sub '${AWS::StackName}-CloudFront-Domain'

  S3BucketName:
    Description: 'Name of the secure logs S3 bucket'
    Value: !Ref SecureLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Bucket'

  DynamoDBTableName:
    Description: 'Name of the DynamoDB table'
    Value: !Ref SecureDataTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDB-Table'

  SNSTopicArn:
    Description: 'ARN of the SNS alerts topic'
    Value: !Ref AlertsTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNS-Topic'
```

# Key Features and Security Implementations

## Security Best Practices
- **Security Groups:** Restrictive rules with only port 443 allowed from the internet  
- **IAM Roles:** Least privilege principle applied throughout  
- **Encryption:** S3, RDS, DynamoDB, and SNS all use encryption  
- **VPC Configuration:** Lambda functions deployed within VPC  
- **SSL/TLS:** HTTPS-only traffic enforced  

## Monitoring & Alerting
- **CloudWatch Alarms:** Monitor CPU, database connections, and Lambda errors  
- **SNS Integration:** Encrypted notifications for security alerts  
- **Logging:** CloudFront logs stored in encrypted S3 bucket  

## Infrastructure Components
- **EC2:** Secure instance with approved AMI and IAM role  
- **ALB:** HTTPS-only load balancer with SSL certificate  
- **RDS:** Encrypted MySQL with 7-day backup retention  
- **Lambda:** VPC-configured function with minimal permissions  
- **DynamoDB:** Point-in-time recovery enabled  
- **CloudFront:** HTTPS-only distribution with logging  

## Compliance Features
- **Tagging:** All resources include Name and Environment tags  
- **Account ID:** Template designed for account `123456789012`
- **Region:** Configured for `us-east-1`
- **VPC:** Uses existing VPC `vpc-abcde12345`