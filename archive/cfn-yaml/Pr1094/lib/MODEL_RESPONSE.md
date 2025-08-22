Here's a complete CloudFormation template for your NovaModel secure production infrastructure:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'NovaModel secure production infrastructure with comprehensive security controls'

Parameters:
  DBUsername:
    Type: String
    Default: 'novaadmin'
    Description: 'Database master username'
  DBPassword:
    Type: String
    NoEcho: true
    MinLength: 8
    Description: 'Database master password (minimum 8 characters)'

Resources:
  # ==================== VPC AND NETWORKING ====================

  NovaModelVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
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

  # Internet Gateway for public subnets
  InternetGateway:
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

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref NovaModelVPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets (2 AZs for HA)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaModelVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
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

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaModelVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
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

  # Private Subnets (Database and Lambda placement)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaModelVPC
      CidrBlock: '10.0.3.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-private-subnet-1
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref NovaModelVPC
      CidrBlock: '10.0.4.0/24'
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-private-subnet-2
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # NAT Gateway for private subnet internet access
  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt EIPForNAT.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-nat-gw
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  EIPForNAT:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
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

  # Route Tables
  PublicRouteTable:
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

  PrivateRouteTable:
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

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway

  # Route Table Associations
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

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

  # ==================== SECURITY GROUPS ====================

  # Web tier security group - only 80/443 from internet
  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: novamodel-sec-prod-web-sg
      GroupDescription: 'Security group for web tier - HTTP/HTTPS only'
      VpcId: !Ref NovaModelVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP from internet'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS from internet'
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-web-sg
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # Lambda security group for VPC access
  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: novamodel-sec-prod-lambda-sg
      GroupDescription: 'Security group for Lambda functions in VPC'
      VpcId: !Ref NovaModelVPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS outbound for AWS services'
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-lambda-sg
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # Database security group - only from application tier
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: novamodel-sec-prod-db-sg
      GroupDescription: 'Security group for RDS database - access from app tier only'
      VpcId: !Ref NovaModelVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
          Description: 'MySQL from Lambda functions'
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-db-sg
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # ==================== KMS KEY FOR EBS ENCRYPTION ====================

  EBSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'Customer-managed KMS key for EBS volume encryption'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow EBS service
            Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey*
              - kms:ReEncrypt*
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

  EBSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/novamodel-sec-prod-ebs-key
      TargetKeyId: !Ref EBSKMSKey

  # ==================== IAM ROLES (LEAST PRIVILEGE) ====================

  # Lambda execution role with minimal permissions
  LambdaExecutionRole:
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
                Resource: !GetAtt NovaModelTable.Arn
      Tags:
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # CloudTrail service role
  CloudTrailRole:
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
                  - s3:PutObject
                  - s3:GetBucketAcl
                Resource:
                  - !Sub '${CloudTrailBucket}/*'
                  - !Ref CloudTrailBucket
      Tags:
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # ==================== S3 BUCKETS WITH ENCRYPTION ====================

  # Application data bucket with AES-256 encryption
  AppDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'novamodel-sec-prod-app-data-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-app-data-bucket
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # CloudTrail logs bucket with encryption
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'novamodel-sec-prod-cloudtrail-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-cloudtrail-bucket
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # ==================== RDS DATABASE IN PRIVATE SUBNETS ====================

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: novamodel-sec-prod-db-subnet-group
      DBSubnetGroupDescription: 'Subnet group for NovaModel RDS database'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-db-subnet-group
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  NovaModelDatabase:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: novamodel-sec-prod-db
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0'
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: false
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-db
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # ==================== DYNAMODB WITH PITR ====================

  NovaModelTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: novamodel-sec-prod-table
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
          Value: novamodel-sec-prod-table
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # ==================== LAMBDA FUNCTION IN VPC ====================

  NovaModelFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: novamodel-sec-prod-function
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          def lambda_handler(event, context):
              return {
                  'statusCode': 200,
                  'body': json.dumps('Hello from NovaModel Lambda!')
              }
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-function
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  # ==================== API GATEWAY WITH API KEY ====================

  NovaModelAPI:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: novamodel-sec-prod-api
      Description: 'NovaModel production API'
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-api
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  APIDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: APIMethod
    Properties:
      RestApiId: !Ref NovaModelAPI
      StageName: prod

  APIStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref NovaModelAPI
      DeploymentId: !Ref APIDeployment
      StageName: prod
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          DataTraceEnabled: false
          LoggingLevel: ERROR
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-api-stage
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  APIResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref NovaModelAPI
      ParentId: !GetAtt NovaModelAPI.RootResourceId
      PathPart: 'nova'

  APIMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref NovaModelAPI
      ResourceId: !Ref APIResource
      HttpMethod: GET
      AuthorizationType: NONE
      ApiKeyRequired: true
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${NovaModelFunction.Arn}/invocations'

  # API Key for secure access
  APIKey:
    Type: AWS::ApiGateway::ApiKey
    Properties:
      Name: novamodel-sec-prod-api-key
      Description: 'API key for NovaModel production API'
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

  APIUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    Properties:
      UsagePlanName: novamodel-sec-prod-usage-plan
      Description: 'Usage plan for NovaModel production API'
      ApiStages:
        - ApiId: !Ref NovaModelAPI
          Stage: !Ref APIStage
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-usage-plan
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

  APIUsagePlanKey:
    Type: AWS::ApiGateway::UsagePlanKey
    Properties:
      KeyId: !Ref APIKey
      KeyType: API_KEY
      UsagePlanId: !Ref APIUsagePlan

  # Lambda permission for API Gateway
  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref NovaModelFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${NovaModelAPI}/*/*'

  # ==================== CLOUDTRAIL FOR COMPREHENSIVE LOGGING ====================

  NovaModelCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: novamodel-sec-prod-cloudtrail
      S3BucketName: !Ref CloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values: ['arn:aws:s3:::*/*']
            - Type: 'AWS::S3::Bucket'
              Values: ['arn:aws:s3:::*']
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-cloudtrail
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

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
            Action: s3:GetBucketAcl
            Resource: !Ref CloudTrailBucket
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CloudTrailBucket}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # ==================== CLOUDWATCH LOG GROUPS ====================

  # CloudFormation lifecycle log group
  CFNLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/cloudformation/novamodel-sec-prod-stack
      RetentionInDays: 30
      Tags:
        - Key: Name
          Value: novamodel-sec-prod-cfn-logs
        - Key: Project
          Value: NovaModelBreaking
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: DevSecOpsTeam

Outputs:
  VPCId:
    Description: 'VPC ID for NovaModel infrastructure'
    Value: !Ref NovaModelVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  DatabaseEndpoint:
    Description: 'RDS database endpoint'
    Value: !GetAtt NovaModelDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'

  APIGatewayURL:
    Description: 'API Gateway URL'
    Value: !Sub 'https://${NovaModelAPI}.execute-api.${AWS::Region}.amazonaws.com/prod'
    Export:
      Name: !Sub '${AWS::StackName}-API-URL'

  APIKeyId:
    Description: 'API Key ID for accessing the API'
    Value: !Ref APIKey
    Export:
      Name: !Sub '${AWS::StackName}-API-Key-ID'

  KMSKeyId:
    Description: 'KMS Key ID for EBS encryption'
    Value: !Ref EBSKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-ID'
```

## Key Features & Security Highlights

### 🏗️ **Infrastructure Design**
- **High Availability**: Resources deployed across 2 AZs with public/private subnet architecture
- **Network Isolation**: Database and Lambda functions isolated in private subnets
- **Secure Routing**: NAT Gateway provides controlled internet access for private resources

### 🔐 **Security Controls**
- **Least Privilege IAM**: All roles have minimal required permissions
- **Network Security**: Security groups follow zero-trust principles
- **Encryption**: AES-256 for S3, encryption-at-rest for RDS and DynamoDB
- **Customer-Managed KMS**: Dedicated key for EBS volume encryption

### 📊 **Comprehensive Logging**
- **CloudTrail**: Captures all management and data events account-wide
- **CloudWatch Logs**: Dedicated log groups for stack lifecycle events
- **Audit Trail**: All actions logged to encrypted S3 bucket

### 🚀 **Deployment Ready**
- **Consistent Naming**: All resources follow `novamodel-sec-prod-<type>` convention
- **Complete Tagging**: Every resource tagged with Project, Environment, and Owner
- **Parameter-Driven**: Database credentials configurable via parameters
- **Export Values**: Key outputs exported for cross-stack references

### 📝 **Usage Notes**
1. **Deploy with**: `aws cloudformation create-stack --stack-name novamodel-prod --template-body file://template.yaml --parameters ParameterKey=DBPassword,ParameterValue=YourSecurePassword123 --capabilities CAPABILITY_NAMED_IAM`
2. **API Access**: Use the output API Key ID to access the API Gateway endpoints
3. **Database Access**: Only Lambda functions can access RDS via security group rules
4. **Monitoring**: CloudTrail logs available in the dedicated S3 bucket for compliance

This template creates a production-ready, secure infrastructure that meets all your requirements while maintaining AWS best practices for security and compliance.
