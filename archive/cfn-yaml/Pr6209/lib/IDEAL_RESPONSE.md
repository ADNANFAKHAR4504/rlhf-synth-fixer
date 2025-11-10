```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure Financial Data Processing Infrastructure - PCI-DSS Compliant'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments (e.g., PR number from CI/CD)'
    Default: "pr8888"
    AllowedPattern: '^[a-zA-Z0-9\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'

Resources:
  # VPC Configuration - No Internet Access
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc"
        - Key: DataClassification
          Value: Confidential
        - Key: ComplianceScope
          Value: PCI-DSS

  # Private Subnet 1
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1"
        - Key: DataClassification
          Value: Confidential
        - Key: ComplianceScope
          Value: PCI-DSS

  # Private Subnet 2
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-2"
        - Key: DataClassification
          Value: Confidential
        - Key: ComplianceScope
          Value: PCI-DSS

  # Route Table for Private Subnets
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-rt"
        - Key: DataClassification
          Value: Confidential
        - Key: ComplianceScope
          Value: PCI-DSS

  # Associate Private Subnets with Route Table
  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # Security Group for VPC Endpoints - Only HTTPS (443)
  VPCEndpointSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpce-sg"
      GroupDescription: Security group for VPC endpoints - HTTPS only
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: "HTTPS outbound for AWS services"
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpce-sg"
        - Key: DataClassification
          Value: Confidential
        - Key: ComplianceScope
          Value: PCI-DSS

  # Security Group for Lambda Function
  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-sg"
      GroupDescription: Security group for Lambda function
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-sg"
        - Key: DataClassification
          Value: Confidential
        - Key: ComplianceScope
          Value: PCI-DSS

  # Separate ingress rule for VPC Endpoints to accept traffic from Lambda
  VPCEndpointIngressRule:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref VPCEndpointSecurityGroup
      IpProtocol: tcp
      FromPort: 443
      ToPort: 443
      SourceSecurityGroupId: !Ref LambdaSecurityGroup

  # Separate egress rule for Lambda to communicate with VPC Endpoints
  LambdaEgressRule:
    Type: AWS::EC2::SecurityGroupEgress
    Properties:
      GroupId: !Ref LambdaSecurityGroup
      IpProtocol: tcp
      FromPort: 443
      ToPort: 443
      DestinationSecurityGroupId: !Ref VPCEndpointSecurityGroup

  # S3 VPC Endpoint
  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.s3'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - s3:GetObject
              - s3:ListBucket
            Resource:
              - !Sub "${FinancialDataBucket.Arn}"
              - !Sub "${FinancialDataBucket.Arn}/*"

  # DynamoDB VPC Endpoint
  DynamoDBVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.dynamodb'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - dynamodb:PutItem
              - dynamodb:GetItem
              - dynamodb:Query
              - dynamodb:UpdateItem
            Resource:
              - !GetAtt ProcessingMetadataTable.Arn
              - !Sub "${ProcessingMetadataTable.Arn}/index/*"

  # Customer-Managed KMS Key for Lambda Environment Variables
  LambdaKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for encrypting Lambda environment variables
      KeyPolicy:
        Version: '2012-10-17'
        Id: key-policy-1
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow Lambda to use the key
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition:
              StringEquals:
                'kms:ViaService': !Sub 'lambda.${AWS::Region}.amazonaws.com'
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-kms"
        - Key: DataClassification
          Value: Confidential
        - Key: ComplianceScope
          Value: PCI-DSS

  # KMS Key Alias
  LambdaKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub "alias/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-key"
      TargetKeyId: !Ref LambdaKMSKey

  # S3 Bucket for Financial Data - SSE-S3 with Bucket Key
  FinancialDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}-financial-data"
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
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-financial-data"
        - Key: DataClassification
          Value: Confidential
        - Key: ComplianceScope
          Value: PCI-DSS

  # S3 Bucket Policy - Enforce HTTPS Only
  FinancialDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref FinancialDataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt FinancialDataBucket.Arn
              - !Sub "${FinancialDataBucket.Arn}/*"
            Condition:
              Bool:
                'aws:SecureTransport': 'false'
          - Sid: AllowLambdaReadAccess
            Effect: Allow
            Principal:
              AWS: !GetAtt LambdaExecutionRole.Arn
            Action:
              - 's3:GetObject'
              - 's3:ListBucket'
            Resource:
              - !GetAtt FinancialDataBucket.Arn
              - !Sub "${FinancialDataBucket.Arn}/*"
            Condition:
              Bool:
                'aws:SecureTransport': 'true'

  # DynamoDB Table for Processing Metadata
  ProcessingMetadataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-metadata"
      AttributeDefinitions:
        - AttributeName: TransactionId
          AttributeType: S
        - AttributeName: Timestamp
          AttributeType: S
      KeySchema:
        - AttributeName: TransactionId
          KeyType: HASH
        - AttributeName: Timestamp
          KeyType: RANGE
      BillingMode: PAY_PER_REQUEST
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-metadata"
        - Key: DataClassification
          Value: Confidential
        - Key: ComplianceScope
          Value: PCI-DSS

  # CloudWatch Log Group for Lambda
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/lambda/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-processor"
      RetentionInDays: 90
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-logs"
        - Key: DataClassification
          Value: Confidential
        - Key: ComplianceScope
          Value: PCI-DSS

  # Lambda Execution Role - Least Privilege
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-role"
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: S3ReadOnlyAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !GetAtt FinancialDataBucket.Arn
                  - !Sub "${FinancialDataBucket.Arn}/*"
        - PolicyName: DynamoDBWriteAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:GetItem
                  - dynamodb:Query
                Resource:
                  - !GetAtt ProcessingMetadataTable.Arn
                  - !Sub "${ProcessingMetadataTable.Arn}/index/*"
        - PolicyName: CloudWatchLogsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt LambdaLogGroup.Arn
        - PolicyName: KMSDecryptAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:DescribeKey
                Resource: !GetAtt LambdaKMSKey.Arn
                Condition:
                  StringEquals:
                    'kms:ViaService': !Sub 'lambda.${AWS::Region}.amazonaws.com'
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda-role"
        - Key: DataClassification
          Value: Confidential
        - Key: ComplianceScope
          Value: PCI-DSS

  # Lambda Function for Data Processing
  DataProcessorLambda:
    Type: AWS::Lambda::Function
    DependsOn: LambdaLogGroup
    Properties:
      FunctionName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-processor"
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          import datetime
          
          def lambda_handler(event, context):
              # Initialize AWS clients
              s3_client = boto3.client('s3')
              dynamodb_client = boto3.client('dynamodb')
              
              # Process financial data from S3
              bucket_name = os.environ['BUCKET_NAME']
              table_name = os.environ['TABLE_NAME']
              
              # Example processing logic
              transaction_id = context.request_id
              timestamp = datetime.datetime.utcnow().isoformat()
              
              # Write metadata to DynamoDB
              try:
                  dynamodb_client.put_item(
                      TableName=table_name,
                      Item={
                          'TransactionId': {'S': transaction_id},
                          'Timestamp': {'S': timestamp},
                          'Status': {'S': 'Processed'},
                          'DataClassification': {'S': 'Confidential'}
                      }
                  )
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps('Processing completed successfully')
                  }
              except Exception as e:
                  print(f"Error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': json.dumps('Processing failed')
                  }
      Environment:
        Variables:
          BUCKET_NAME: !Ref FinancialDataBucket
          TABLE_NAME: !Ref ProcessingMetadataTable
      KmsKeyArn: !GetAtt LambdaKMSKey.Arn
      Timeout: 300
      MemorySize: 512
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-processor"
        - Key: DataClassification
          Value: Confidential
        - Key: ComplianceScope
          Value: PCI-DSS

Outputs:
  # VPC and Network Resources
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-VPC-ID"

  VPCCidr:
    Description: VPC CIDR Block
    Value: !GetAtt VPC.CidrBlock
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-VPC-CIDR"

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Private-Subnet-1-ID"

  PrivateSubnet1AvailabilityZone:
    Description: Private Subnet 1 Availability Zone
    Value: !GetAtt PrivateSubnet1.AvailabilityZone
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Private-Subnet-1-AZ"

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Private-Subnet-2-ID"

  PrivateSubnet2AvailabilityZone:
    Description: Private Subnet 2 Availability Zone
    Value: !GetAtt PrivateSubnet2.AvailabilityZone
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Private-Subnet-2-AZ"

  PrivateRouteTableId:
    Description: Private Route Table ID
    Value: !Ref PrivateRouteTable
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Private-RouteTable-ID"

  # Security Groups
  VPCEndpointSecurityGroupId:
    Description: VPC Endpoint Security Group ID
    Value: !Ref VPCEndpointSecurityGroup
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-VPCE-SG-ID"

  LambdaSecurityGroupId:
    Description: Lambda Security Group ID
    Value: !Ref LambdaSecurityGroup
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Lambda-SG-ID"

  # VPC Endpoints
  S3VPCEndpointId:
    Description: S3 VPC Endpoint ID
    Value: !Ref S3VPCEndpoint
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-S3-VPCE-ID"

  DynamoDBVPCEndpointId:
    Description: DynamoDB VPC Endpoint ID
    Value: !Ref DynamoDBVPCEndpoint
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-DynamoDB-VPCE-ID"

  # KMS Resources
  LambdaKMSKeyId:
    Description: KMS Key ID for Lambda Environment Variables
    Value: !Ref LambdaKMSKey
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Lambda-KMS-Key-ID"

  LambdaKMSKeyArn:
    Description: KMS Key ARN for Lambda Environment Variables
    Value: !GetAtt LambdaKMSKey.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Lambda-KMS-Key-ARN"

  LambdaKMSKeyAlias:
    Description: KMS Key Alias for Lambda Environment Variables
    Value: !Ref LambdaKMSKeyAlias
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Lambda-KMS-Key-Alias"

  # S3 Resources
  FinancialDataBucketName:
    Description: Financial Data S3 Bucket Name
    Value: !Ref FinancialDataBucket
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-S3-Bucket-Name"

  FinancialDataBucketArn:
    Description: Financial Data S3 Bucket ARN
    Value: !GetAtt FinancialDataBucket.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-S3-Bucket-ARN"

  FinancialDataBucketDomainName:
    Description: Financial Data S3 Bucket Domain Name
    Value: !GetAtt FinancialDataBucket.DomainName
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-S3-Bucket-Domain"

  FinancialDataBucketWebsiteURL:
    Description: Financial Data S3 Bucket Website URL
    Value: !GetAtt FinancialDataBucket.WebsiteURL
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-S3-Bucket-Website-URL"

  # DynamoDB Resources
  ProcessingMetadataTableName:
    Description: Processing Metadata Table Name
    Value: !Ref ProcessingMetadataTable
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-DynamoDB-Table-Name"

  ProcessingMetadataTableArn:
    Description: Processing Metadata Table ARN
    Value: !GetAtt ProcessingMetadataTable.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-DynamoDB-Table-ARN"

  # Lambda Resources
  DataProcessorLambdaFunctionName:
    Description: Data Processor Lambda Function Name
    Value: !Ref DataProcessorLambda
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Lambda-Function-Name"

  DataProcessorLambdaFunctionArn:
    Description: Data Processor Lambda Function ARN
    Value: !GetAtt DataProcessorLambda.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Lambda-Function-ARN"

  # IAM Resources
  LambdaExecutionRoleArn:
    Description: Lambda Execution Role ARN
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Lambda-Execution-Role-ARN"

  LambdaExecutionRoleName:
    Description: Lambda Execution Role Name
    Value: !Ref LambdaExecutionRole
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Lambda-Execution-Role-Name"

  # CloudWatch Logs
  LambdaLogGroupName:
    Description: Lambda Log Group Name
    Value: !Ref LambdaLogGroup
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Lambda-Log-Group-Name"

  LambdaLogGroupArn:
    Description: Lambda Log Group ARN
    Value: !GetAtt LambdaLogGroup.Arn
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Lambda-Log-Group-ARN"

  # Environment Information
  Environment:
    Description: Environment suffix for this deployment
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Environment-Suffix"

  StackName:
    Description: CloudFormation Stack Name
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Stack-Name"

  Region:
    Description: AWS Region where resources are deployed
    Value: !Ref AWS::Region
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-Region"
