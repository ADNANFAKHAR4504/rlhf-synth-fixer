```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure for NovaModel Production Environment'

Parameters:
  DatabaseUsername:
    Type: String
    Default: 'admin'
    Description: 'RDS Database master username'
    MinLength: 1
    MaxLength: 16
    AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'

  DatabasePassword:
    Type: String
    NoEcho: true
    Description: 'RDS Database master password'
    MinLength: 8
    MaxLength: 41
    AllowedPattern: '[a-zA-Z0-9]*'

Resources:
  # ====================================
  # VPC AND NETWORKING RESOURCES
  # ====================================

  # Main VPC
  NovaModelVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-vpc
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # Internet Gateway
  NovaModelIGW:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-igw
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # Attach Internet Gateway to VPC
  NovaModelIGWAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref NovaModelVPC
      InternetGatewayId: !Ref NovaModelIGW

  # Public Subnet 1 (us-east-1a)
  NovaModelPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaModelVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: us-east-1a
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-public-subnet-1
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # Public Subnet 2 (us-east-1b)
  NovaModelPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaModelVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: us-east-1b
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-public-subnet-2
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # Private Subnet 1 (us-east-1a)
  NovaModelPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaModelVPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: us-east-1a
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-private-subnet-1
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # Private Subnet 2 (us-east-1b)
  NovaModelPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaModelVPC
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: us-east-1b
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-private-subnet-2
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # NAT Gateway Elastic IP
  NovaModelNATEIP:
    Type: AWS::EC2::EIP
    DependsOn: NovaModelIGWAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-nat-eip
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # NAT Gateway
  NovaModelNATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NovaModelNATEIP.AllocationId
      SubnetId: !Ref NovaModelPublicSubnet1
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-nat-gateway
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # Public Route Table
  NovaModelPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref NovaModelVPC
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-public-rt
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # Private Route Table
  NovaModelPrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref NovaModelVPC
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-private-rt
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # Public Route to Internet Gateway
  NovaModelPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: NovaModelIGWAttachment
    Properties:
      RouteTableId: !Ref NovaModelPublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref NovaModelIGW

  # Private Route to NAT Gateway
  NovaModelPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref NovaModelPrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NovaModelNATGateway

  # Associate Public Subnets with Public Route Table
  NovaModelPublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref NovaModelPublicSubnet1
      RouteTableId: !Ref NovaModelPublicRouteTable

  NovaModelPublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref NovaModelPublicSubnet2
      RouteTableId: !Ref NovaModelPublicRouteTable

  # Associate Private Subnets with Private Route Table
  NovaModelPrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref NovaModelPrivateSubnet1
      RouteTableId: !Ref NovaModelPrivateRouteTable

  NovaModelPrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref NovaModelPrivateSubnet2
      RouteTableId: !Ref NovaModelPrivateRouteTable

  # ====================================
  # SECURITY GROUPS
  # ====================================

  # Web Server Security Group (allows HTTP/HTTPS from internet)
  NovaModelWebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: novamodel-sec-prod-web-sg
      GroupDescription: Security group for web servers
      VpcId: !Ref NovaModelVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP access from internet
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS access from internet
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: All outbound traffic
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-web-sg
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # Application Security Group (for Lambda functions)
  NovaModelAppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: novamodel-sec-prod-app-sg
      GroupDescription: Security group for application layer (Lambda functions)
      VpcId: !Ref NovaModelVPC
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: All outbound traffic
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-app-sg
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # Database Security Group (allows access only from application layer)
  NovaModelDBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: novamodel-sec-prod-db-sg
      GroupDescription: Security group for RDS database
      VpcId: !Ref NovaModelVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref NovaModelAppSecurityGroup
          Description: MySQL access from application layer
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-db-sg
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # ====================================
  # KMS KEY FOR EBS ENCRYPTION
  # ====================================

  NovaModelEBSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: Customer-managed KMS key for EBS volume encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key for EBS
            Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-ebs-key
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  NovaModelEBSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/novamodel-sec-prod-ebs-key
      TargetKeyId: !Ref NovaModelEBSKMSKey

  # ====================================
  # IAM ROLES AND POLICIES
  # ====================================

  # Lambda Execution Role
  NovaModelLambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: novamodel-sec-prod-lambda-role
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
                  - dynamodb:PutItem
                  - dynamodb:GetItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt NovaModelDynamoDBTable.Arn
      Tags:
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # CloudTrail Service Role
  NovaModelCloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: novamodel-sec-prod-cloudtrail-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: !Sub '${NovaModelCloudTrailLogGroup}:*'
      Tags:
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # ====================================
  # S3 BUCKETS WITH ENCRYPTION
  # ====================================

  # CloudTrail S3 Bucket
  NovaModelCloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'novamodel-sec-prod-cloudtrail-${AWS::AccountId}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-cloudtrail-bucket
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # CloudTrail Bucket Policy
  NovaModelCloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref NovaModelCloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt NovaModelCloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${NovaModelCloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # Application Data S3 Bucket
  NovaModelAppDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'novamodel-sec-prod-app-data-${AWS::AccountId}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-app-data-bucket
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # ====================================
  # DYNAMODB TABLE WITH PITR
  # ====================================

  NovaModelDynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: novamodel-sec-prod-app-table
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-app-table
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # ====================================
  # RDS DATABASE
  # ====================================

  # DB Subnet Group
  NovaModelDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: novamodel-sec-prod-db-subnet-group
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref NovaModelPrivateSubnet1
        - !Ref NovaModelPrivateSubnet2
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-db-subnet-group
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # RDS Instance
  NovaModelRDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: novamodel-sec-prod-db
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.35'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      MasterUsername: !Ref DatabaseUsername
      MasterUserPassword: !Ref DatabasePassword
      VPCSecurityGroups:
        - !Ref NovaModelDBSecurityGroup
      DBSubnetGroupName: !Ref NovaModelDBSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: false
      PubliclyAccessible: false
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-db
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # ====================================
  # LAMBDA FUNCTION
  # ====================================

  NovaModelLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: novamodel-sec-prod-lambda
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt NovaModelLambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3

          def lambda_handler(event, context):
              # Simple Lambda function for demonstration
              dynamodb = boto3.resource('dynamodb')
              table = dynamodb.Table('novamodel-sec-prod-app-table')

              return {
                  'statusCode': 200,
                  'body': json.dumps('Hello from NovaModel Lambda!')
              }
      VpcConfig:
        SecurityGroupIds:
          - !Ref NovaModelAppSecurityGroup
        SubnetIds:
          - !Ref NovaModelPrivateSubnet1
          - !Ref NovaModelPrivateSubnet2
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-lambda
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # ====================================
  # API GATEWAY
  # ====================================

  # API Gateway REST API
  NovaModelAPIGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: novamodel-sec-prod-api
      Description: API Gateway for NovaModel application
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-api
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # API Gateway Resource
  NovaModelAPIResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref NovaModelAPIGateway
      ParentId: !GetAtt NovaModelAPIGateway.RootResourceId
      PathPart: hello

  # API Gateway Method
  NovaModelAPIMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref NovaModelAPIGateway
      ResourceId: !Ref NovaModelAPIResource
      HttpMethod: GET
      AuthorizationType: NONE
      ApiKeyRequired: true
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${NovaModelLambdaFunction.Arn}/invocations'

  # Lambda Permission for API Gateway
  NovaModelLambdaAPIPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref NovaModelLambdaFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub '${NovaModelAPIGateway}/*/GET/hello'

  # API Gateway Deployment
  NovaModelAPIDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: NovaModelAPIMethod
    Properties:
      RestApiId: !Ref NovaModelAPIGateway

  # API Gateway Stage with API Key requirement
  NovaModelAPIStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref NovaModelAPIGateway
      DeploymentId: !Ref NovaModelAPIDeployment
      StageName: prod
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-api-stage
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # API Key
  NovaModelAPIKey:
    Type: AWS::ApiGateway::ApiKey
    Properties:
      Name: novamodel-sec-prod-api-key
      Description: API Key for NovaModel API
      Enabled: true
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-api-key
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # Usage Plan
  NovaModelUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    Properties:
      UsagePlanName: novamodel-sec-prod-usage-plan
      Description: Usage plan for NovaModel API
      ApiStages:
        - ApiId: !Ref NovaModelAPIGateway
          Stage: !Ref NovaModelAPIStage
      Throttle:
        BurstLimit: 100
        RateLimit: 50
      Quota:
        Limit: 1000
        Period: DAY
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-usage-plan
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # Usage Plan Key
  NovaModelUsagePlanKey:
    Type: AWS::ApiGateway::UsagePlanKey
    Properties:
      KeyId: !Ref NovaModelAPIKey
      KeyType: API_KEY
      UsagePlanId: !Ref NovaModelUsagePlan

  # ====================================
  # LOGGING AND MONITORING
  # ====================================

  # CloudFormation Stack Log Group
  NovaModelCloudFormationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/cloudformation/novamodel-sec-prod-stack
      RetentionInDays: 30
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-cf-logs
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # CloudTrail Log Group
  NovaModelCloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/cloudtrail/novamodel-sec-prod-trail
      RetentionInDays: 90
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-cloudtrail-logs
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # CloudTrail
  NovaModelCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: NovaModelCloudTrailBucketPolicy
    Properties:
      TrailName: novamodel-sec-prod-trail
      S3BucketName: !Ref NovaModelCloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub '${NovaModelAppDataBucket}/*'
            - Type: AWS::DynamoDB::Table
              Values:
                - !GetAtt NovaModelDynamoDBTable.Arn
      CloudWatchLogsLogGroupArn: !Sub '${NovaModelCloudTrailLogGroup}:*'
      CloudWatchLogsRoleArn: !GetAtt NovaModelCloudTrailRole.Arn
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-trail
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

# ====================================
# OUTPUTS
# ====================================

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref NovaModelVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref NovaModelPrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref NovaModelPrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  RDSEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt NovaModelRDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDS-Endpoint'

  APIGatewayURL:
    Description: API Gateway URL
    Value: !Sub 'https://${NovaModelAPIGateway}.execute-api.${AWS::Region}.amazonaws.com/prod'
    Export:
      Name: !Sub '${AWS::StackName}-API-URL'

  APIKey:
    Description: API Key for accessing the API
    Value: !Ref NovaModelAPIKey
    Export:
      Name: !Sub '${AWS::StackName}-API-Key'

  DynamoDBTableName:
    Description: DynamoDB Table Name
    Value: !Ref NovaModelDynamoDBTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDB-Table'

  EBSKMSKeyId:
    Description: KMS Key ID for EBS encryption
    Value: !Ref NovaModelEBSKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-EBS-KMS-Key'
```
