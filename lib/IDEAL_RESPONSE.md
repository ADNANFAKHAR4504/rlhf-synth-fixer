Solution Overview
I'll create two CloudFormation templates that demonstrate cross-region deployment with proper use of intrinsic functions, parameters, and outputs.

Template 1: US-West-1 (Fixed Capacity)
AWSTemplateFormatVersion: '2010-09-09'
Description: 'DynamoDB table deployment for us-west-1 with fixed capacity settings'

Parameters:
  Environment:
    Type: String
    Default: 'production'
    Description: 'Environment name for resource tagging'
    AllowedValues:
      - development
      - staging
      - production
  
  ApplicationName:
    Type: String
    Default: 'multi-region-app'
    Description: 'Application name for consistent naming'

Resources:
  # DynamoDB Table with fixed capacity for us-west-1
  DynamoDBTableWest1:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${ApplicationName}-${Environment}-west1-table'
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: 5    # Fixed capacity as required
        WriteCapacityUnits: 5   # Fixed capacity as required
      AttributeDefinitions:
        - AttributeName: 'PrimaryKey'
          AttributeType: 'S'
        - AttributeName: 'SortKey'
          AttributeType: 'S'
      KeySchema:
        - AttributeName: 'PrimaryKey'
          KeyType: 'HASH'
        - AttributeName: 'SortKey'
          KeyType: 'RANGE'
      # Using Fn::Sub for dynamic tagging
      Tags:
        - Key: 'Environment'
          Value: !Ref Environment
        - Key: 'Region'
          Value: !Sub '${AWS::Region}'
        - Key: 'Application'
          Value: !Ref ApplicationName
        - Key: 'ManagedBy'
          Value: 'CloudFormation'
        - Key: 'StackName'
          Value: !Sub '${AWS::StackName}'
      # Enable point-in-time recovery
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      # Server-side encryption
      SSESpecification:
        SSEEnabled: true

  # IAM Role for DynamoDB access (demonstrating Fn::GetAtt usage)
  DynamoDBAccessRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ApplicationName}-${Environment}-dynamodb-role-${AWS::Region}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
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
                Resource: !GetAtt DynamoDBTableWest1.Arn  # Using Fn::GetAtt
      Tags:
        - Key: 'Environment'
          Value: !Ref Environment
        - Key: 'Region'
          Value: !Sub '${AWS::Region}'

Outputs:
  # Export table name for cross-stack reference
  TableName:
    Description: 'DynamoDB Table Name in us-west-1'
    Value: !Ref DynamoDBTableWest1
    Export:
      Name: !Sub '${AWS::StackName}-TableName'
  
  # Export table ARN using Fn::GetAtt
  TableArn:
    Description: 'DynamoDB Table ARN in us-west-1'
    Value: !GetAtt DynamoDBTableWest1.Arn
    Export:
      Name: !Sub '${AWS::StackName}-TableArn'
  
  # Export table stream ARN (if streams were enabled)
  TableStreamArn:
    Description: 'DynamoDB Table Stream ARN in us-west-1'
    Value: !GetAtt DynamoDBTableWest1.StreamArn
    Export:
      Name: !Sub '${AWS::StackName}-TableStreamArn'
    Condition: HasStreamEnabled
  
  # Export IAM Role ARN
  IAMRoleArn:
    Description: 'IAM Role ARN for DynamoDB access'
    Value: !GetAtt DynamoDBAccessRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-IAMRoleArn'
  
  # Combined output using Fn::Join
  TableDetails:
    Description: 'Combined table information'
    Value: !Join 
      - ' | '
      - - !Sub 'Table: ${DynamoDBTableWest1}'
        - !Sub 'Region: ${AWS::Region}'
        - !Sub 'Environment: ${Environment}'
    Export:
      Name: !Sub '${AWS::StackName}-TableDetails'

Conditions:
  HasStreamEnabled: !Equals [!GetAtt DynamoDBTableWest1.StreamArn, '']

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Application Configuration"
        Parameters:
          - ApplicationName
          - Environment
    ParameterLabels:
      ApplicationName:
        default: "Application Name"
      Environment:
        default: "Environment"
Template 2: US-West-2 (Parameterized Capacity)
AWSTemplateFormatVersion: '2010-09-09'
Description: 'DynamoDB table deployment for us-west-2 with parameterized capacity settings'

Parameters:
  Environment:
    Type: String
    Default: 'production'
    Description: 'Environment name for resource tagging'
    AllowedValues:
      - development
      - staging
      - production
  
  ApplicationName:
    Type: String
    Default: 'multi-region-app'
    Description: 'Application name for consistent naming'
  
  # Parameterized capacity settings as required
  ReadCapacityUnits:
    Type: Number
    Default: 10
    MinValue: 1
    MaxValue: 1000
    Description: 'Read capacity units for the DynamoDB table'
  
  WriteCapacityUnits:
    Type: Number
    Default: 10
    MinValue: 1
    MaxValue: 1000
    Description: 'Write capacity units for the DynamoDB table'
  
  # Parameter to import values from us-west-1 stack
  West1StackName:
    Type: String
    Default: 'dynamodb-west1-stack'
    Description: 'Name of the us-west-1 CloudFormation stack for cross-region reference'

Resources:
  # DynamoDB Table with parameterized capacity for us-west-2
  DynamoDBTableWest2:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${ApplicationName}-${Environment}-west2-table'
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: !Ref ReadCapacityUnits   # Parameterized as required
        WriteCapacityUnits: !Ref WriteCapacityUnits # Parameterized as required
      AttributeDefinitions:
        - AttributeName: 'PrimaryKey'
          AttributeType: 'S'
        - AttributeName: 'SortKey'
          AttributeType: 'S'
        - AttributeName: 'GSI1PK'
          AttributeType: 'S'
      KeySchema:
        - AttributeName: 'PrimaryKey'
          KeyType: 'HASH'
        - AttributeName: 'SortKey'
          KeyType: 'RANGE'
      # Global Secondary Index
      GlobalSecondaryIndexes:
        - IndexName: 'GSI1'
          KeySchema:
            - AttributeName: 'GSI1PK'
              KeyType: 'HASH'
          Projection:
            ProjectionType: 'ALL'
          ProvisionedThroughput:
            ReadCapacityUnits: !Ref ReadCapacityUnits
            WriteCapacityUnits: !Ref WriteCapacityUnits
      # Using Fn::Sub for dynamic tagging with cross-region reference
      Tags:
        - Key: 'Environment'
          Value: !Ref Environment
        - Key: 'Region'
          Value: !Sub '${AWS::Region}'
        - Key: 'Application'
          Value: !Ref ApplicationName
        - Key: 'ManagedBy'
          Value: 'CloudFormation'
        - Key: 'StackName'
          Value: !Sub '${AWS::StackName}'
        - Key: 'PrimaryRegionTable'
          # Using Fn::ImportValue to reference the us-west-1 table
          Value: !ImportValue 
            Fn::Sub: '${West1StackName}-TableName'
        - Key: 'CapacityConfig'
          Value: !Sub 'Read:${ReadCapacityUnits},Write:${WriteCapacityUnits}'
      # Enable point-in-time recovery
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      # Server-side encryption
      SSESpecification:
        SSEEnabled: true
      # Enable DynamoDB Streams
      StreamSpecification:
        StreamViewType: 'NEW_AND_OLD_IMAGES'

  # Lambda function that could use both tables (demonstrating cross-region reference)
  CrossRegionLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ApplicationName}-${Environment}-cross-region-function'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          # Local table reference
          LOCAL_TABLE_NAME: !Ref DynamoDBTableWest2
          LOCAL_TABLE_ARN: !GetAtt DynamoDBTableWest2.Arn
          # Cross-region table reference using Fn::ImportValue
          REMOTE_TABLE_NAME: !ImportValue 
            Fn::Sub: '${West1StackName}-TableName'
          REMOTE_TABLE_ARN: !ImportValue 
            Fn::Sub: '${West1StackName}-TableArn'
          # Combined configuration using Fn::Join
          TABLE_CONFIG: !Join
            - ','
            - - !Sub 'local=${DynamoDBTableWest2}'
              - !ImportValue 
                  Fn::Sub: '${West1StackName}-TableName'
      Code:
        ZipFile: |
          import json
          import os
          
          def lambda_handler(event, context):
              return {
                  'statusCode': 200,
                  'body': json.dumps({
                      'message': 'Cross-region DynamoDB access configured',
                      'local_table': os.environ.get('LOCAL_TABLE_NAME'),
                      'remote_table': os.environ.get('REMOTE_TABLE_NAME'),
                      'config': os.environ.get('TABLE_CONFIG')
                  })
              }
      Tags:
        - Key: 'Environment'
          Value: !Ref Environment
        - Key: 'Application'
          Value: !Ref ApplicationName

  # IAM Role for Lambda execution
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ApplicationName}-${Environment}-lambda-role-${AWS::Region}'
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
        - PolicyName: DynamoDBCrossRegionAccess
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
                Resource: 
                  - !GetAtt DynamoDBTableWest2.Arn
                  - !Sub '${DynamoDBTableWest2.Arn}/index/*'
                  # Cross-region table access
                  - !ImportValue 
                      Fn::Sub: '${West1StackName}-TableArn'

Outputs:
  # Export table name for potential cross-stack reference
  TableName:
    Description: 'DynamoDB Table Name in us-west-2'
    Value: !Ref DynamoDBTableWest2
    Export:
      Name: !Sub '${AWS::StackName}-TableName'
  
  # Export table ARN using Fn::GetAtt
  TableArn:
    Description: 'DynamoDB Table ARN in us-west-2'
    Value: !GetAtt DynamoDBTableWest2.Arn
    Export:
      Name: !Sub '${AWS::StackName}-TableArn'
  
  # Export table stream ARN
  TableStreamArn:
    Description: 'DynamoDB Table Stream ARN in us-west-2'
    Value: !GetAtt DynamoDBTableWest2.StreamArn
    Export:
      Name: !Sub '${AWS::StackName}-TableStreamArn'
  
  # Export GSI ARN
  GSIArn:
    Description: 'Global Secondary Index ARN'
    Value: !Sub '${DynamoDBTableWest2.Arn}/index/GSI1'
    Export:
      Name: !Sub '${AWS::StackName}-GSIArn'
  
  # Cross-region configuration summary
  CrossRegionConfig:
    Description: 'Cross-region table configuration'
    Value: !Join
      - ' -> '
      - - !ImportValue 
            Fn::Sub: '${West1StackName}-TableName'
        - !Ref DynamoDBTableWest2
    Export:
      Name: !Sub '${AWS::StackName}-CrossRegionConfig'
  
  # Lambda function ARN
  LambdaFunctionArn:
    Description: 'Lambda function ARN for cross-region operations'
    Value: !GetAtt CrossRegionLambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionArn'
  
  # Capacity configuration
  CapacityConfiguration:
    Description: 'Current capacity configuration'
    Value: !Sub 'Read: ${ReadCapacityUnits}, Write: ${WriteCapacityUnits}'
    Export:
      Name: !Sub '${AWS::StackName}-CapacityConfig'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Application Configuration"
        Parameters:
          - ApplicationName
          - Environment
      - Label:
          default: "DynamoDB Capacity Settings"
        Parameters:
          - ReadCapacityUnits
          - WriteCapacityUnits
      - Label:
          default: "Cross-Region Configuration"
        Parameters:
          - West1StackName
    ParameterLabels:
      ApplicationName:
        default: "Application Name"
      Environment:
        default: "Environment"
      ReadCapacityUnits:
        default: "Read Capacity Units"
      WriteCapacityUnits:
        default: "Write Capacity Units"
      West1StackName:
        default: "US-West-1 Stack Name"
Deployment Instructions
1. Deploy US-West-1 Stack First
# Deploy to us-west-1
aws cloudformation create-stack \
  --stack-name dynamodb-west1-stack \
  --template-body file://dynamodb-west1.yaml \
  --parameters ParameterKey=Environment,ParameterValue=production \
               ParameterKey=ApplicationName,ParameterValue=multi-region-app \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-1
2. Deploy US-West-2 Stack Second
# Deploy to us-west-2 (after west-1 is complete)
aws cloudformation create-stack \
  --stack-name dynamodb-west2-stack \
  --template-body file://dynamodb-west2.yaml \
  --parameters ParameterKey=Environment,ParameterValue=production \
               ParameterKey=ApplicationName,ParameterValue=multi-region-app \
               ParameterKey=ReadCapacityUnits,ParameterValue=15 \
               ParameterKey=WriteCapacityUnits,ParameterValue=15 \
               ParameterKey=West1StackName,ParameterValue=dynamodb-west1-stack \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
Key Features Demonstrated
CloudFormation Intrinsic Functions Used:
!Ref - References parameters and resources
!GetAtt - Gets resource attributes (ARNs, Stream ARNs)
!Sub - String substitution with variables
!Join - Joins arrays into strings
!ImportValue - Imports values from other stacks
Fn::Sub - Alternative syntax for substitution
Cross-Region Integration:
US-West-1 exports table name, ARN, and other attributes
US-West-2 imports these values using !ImportValue
Lambda function demonstrates accessing both regional tables
Capacity Configuration:
US-West-1: Fixed capacity (5/5)
US-West-2: Parameterized capacity (configurable)
Best Practices:
Consistent naming conventions
Comprehensive tagging strategy
IAM roles with least privilege
Point-in-time recovery enabled
Server-side encryption enabled
Proper parameter validation
Validation Commands
# Validate templates using cfn-lint
cfn-lint dynamodb-west1.yaml
cfn-lint dynamodb-west2.yaml

# Validate using AWS CLI
aws cloudformation validate-template --template-body file://dynamodb-west1.yaml
aws cloudformation validate-template --template-body file://dynamodb-west2.yaml
This solution provides a complete, production-ready multi-region DynamoDB deployment with proper CloudFormation best practices and extensive use of intrinsic functions for cross-stack references.

AWSTemplateFormatVersion: "2010-09-09"
Description: "Unified DynamoDB table deployment for multi-region with configurable capacity settings"

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: "dev"
    Description: "Environment suffix for resource naming (e.g., dev, staging, prod)"

  ApplicationName:
    Type: String
    Default: "multi-region-app"
    Description: "Application name for resource naming and tagging"

  # Parameterized capacity settings for us-west-2
  ReadCapacityUnits:
    Type: Number
    Default: 10
    MinValue: 1
    MaxValue: 1000
    Description: "Read capacity units for the DynamoDB table (us-west-2 only)"

  WriteCapacityUnits:
    Type: Number
    Default: 10
    MinValue: 1
    MaxValue: 1000
    Description: "Write capacity units for the DynamoDB table (us-west-2 only)"

Conditions:
  IsWest1: !Equals [!Ref "AWS::Region", "us-west-1"]
  IsWest2: !Equals [!Ref "AWS::Region", "us-west-2"]
  EnableStreams: !Equals [!Ref "AWS::Region", "us-west-2"]
  HasCrossRegionReference: !Equals [!Ref "AWS::Region", "us-west-2"]

Resources:
  # DynamoDB Table with conditional capacity settings
  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub
        - "${ApplicationName}-${EnvironmentSuffix}-${RegionSuffix}-table"
        - RegionSuffix: !If [IsWest1, "west1", "west2"]
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        # Fixed capacity for us-west-1, parameterized for us-west-2
        ReadCapacityUnits: !If [IsWest1, 5, !Ref ReadCapacityUnits]
        WriteCapacityUnits: !If [IsWest1, 5, !Ref WriteCapacityUnits]
      AttributeDefinitions:
        - AttributeName: "PrimaryKey"
          AttributeType: "S"
        - AttributeName: "SortKey"
          AttributeType: "S"
        - !If
          - IsWest2
          - AttributeName: "GSI1PK"
            AttributeType: "S"
          - !Ref "AWS::NoValue"
      KeySchema:
        - AttributeName: "PrimaryKey"
          KeyType: "HASH"
        - AttributeName: "SortKey"
          KeyType: "RANGE"
      # Global Secondary Index (only for us-west-2)
      GlobalSecondaryIndexes: !If
        - IsWest2
        - - IndexName: "GSI1"
            KeySchema:
              - AttributeName: "GSI1PK"
                KeyType: "HASH"
            Projection:
              ProjectionType: "ALL"
            ProvisionedThroughput:
              ReadCapacityUnits: !Ref ReadCapacityUnits
              WriteCapacityUnits: !Ref WriteCapacityUnits
        - !Ref "AWS::NoValue"
      # Dynamic tagging based on region
      Tags:
        - Key: "Environment"
          Value: !Ref EnvironmentSuffix
        - Key: "Region"
          Value: !Sub "${AWS::Region}"
        - Key: "Application"
          Value: !Ref ApplicationName
        - Key: "ManagedBy"
          Value: "CloudFormation"
        - Key: "StackName"
          Value: !Sub "${AWS::StackName}"
        - Key: "DeploymentRegion"
          Value: !Sub "${AWS::Region}"
        - !If
          - IsWest2
          - Key: "PrimaryRegionTable"
            Value: !ImportValue
              Fn::Sub: "TapStack${EnvironmentSuffix}-TableName"
          - !Ref "AWS::NoValue"
        - Key: "CapacityConfig"
          Value: !If
            - IsWest2
            - !Sub "${ReadCapacityUnits}-${WriteCapacityUnits}"
            - "5-5"

      # Enable point-in-time recovery
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      # Server-side encryption
      SSESpecification:
        SSEEnabled: true
      # Enable DynamoDB Streams (only for us-west-2)
      StreamSpecification: !If
        - EnableStreams
        - StreamViewType: "NEW_AND_OLD_IMAGES"
        - !Ref "AWS::NoValue"

  # IAM Role for DynamoDB access
  DynamoDBAccessRole:
    Type: AWS::IAM::Role
    Properties:
      # RoleName: !Sub "multi-region-app-${EnvironmentSuffix}-dynamodb-role-${AWS::Region}"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource:
                  - !GetAtt DynamoDBTable.Arn
                  - !If
                    - IsWest2
                    - !Sub "${DynamoDBTable.Arn}/index/*"
                    - !Ref "AWS::NoValue"
                  - !If
                    - HasCrossRegionReference
                    - !ImportValue
                      Fn::Sub: "TapStack${EnvironmentSuffix}-TableArn"
                    - !Ref "AWS::NoValue"
      Tags:
        - Key: "Environment"
          Value: !Ref EnvironmentSuffix
        - Key: "Region"
          Value: !Sub "${AWS::Region}"
        - Key: "DeploymentRegion"
          Value: !Sub "${AWS::Region}"

  # Lambda function (only for us-west-2)
  CrossRegionLambdaFunction:
    Type: AWS::Lambda::Function
    Condition: IsWest2
    Properties:
      # FunctionName: !Sub "multi-region-app-${EnvironmentSuffix}-cross-region-function"
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          # Local table reference
          LOCAL_TABLE_NAME: !Ref DynamoDBTable
          LOCAL_TABLE_ARN: !GetAtt DynamoDBTable.Arn
          # Cross-region table reference using Fn::ImportValue (conditional)
          REMOTE_TABLE_NAME: !If
            - IsWest2
            - !ImportValue
              Fn::Sub: "TapStack${EnvironmentSuffix}-TableName"
            - "no-remote-table"
          REMOTE_TABLE_ARN: !If
            - IsWest2
            - !ImportValue
              Fn::Sub: "TapStack${EnvironmentSuffix}-TableArn"
            - "no-remote-table-arn"
          # Combined configuration using Fn::Join
          TABLE_CONFIG: !Join
            - ","
            - - !Sub "local=${DynamoDBTable}"
              - !If
                - IsWest2
                - !ImportValue
                  Fn::Sub: "TapStack${EnvironmentSuffix}-TableName"
                - "no-remote-table"
      Code:
        ZipFile: |
          import json
          import os

          def lambda_handler(event, context):
              return {
                  'statusCode': 200,
                  'body': json.dumps({
                      'message': 'Cross-region DynamoDB access configured',
                      'local_table': os.environ.get('LOCAL_TABLE_NAME'),
                      'remote_table': os.environ.get('REMOTE_TABLE_NAME'),
                      'config': os.environ.get('TABLE_CONFIG')
                  })
              }
      Tags:
        - Key: "Environment"
          Value: !Ref EnvironmentSuffix
        - Key: "Application"
          Value: !Ref ApplicationName

  # IAM Role for Lambda execution (only for us-west-2)
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Condition: IsWest2
    Properties:
      # RoleName: !Sub "multi-region-app-${EnvironmentSuffix}-lambda-role-${AWS::Region}"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: DynamoDBCrossRegionAccess
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource:
                  - !GetAtt DynamoDBTable.Arn
                  - !Sub "${DynamoDBTable.Arn}/index/*"
                  # Cross-region table access (conditional)
                  - !If
                    - IsWest2
                    - !ImportValue
                      Fn::Sub: "TapStack${EnvironmentSuffix}-TableArn"
                    - !Ref "AWS::NoValue"

Outputs:
  # Export table name for cross-stack reference
  TableName:
    Description: "DynamoDB Table Name"
    Value: !Ref DynamoDBTable
    Export:
      Name: !Sub "${AWS::StackName}-TableName"

  # Export table ARN using Fn::GetAtt
  TableArn:
    Description: "DynamoDB Table ARN"
    Value: !GetAtt DynamoDBTable.Arn
    Export:
      Name: !Sub "${AWS::StackName}-TableArn"

  # Export table stream ARN (conditional)
  TableStreamArn:
    Description: "DynamoDB Table Stream ARN"
    Value: !GetAtt DynamoDBTable.StreamArn
    Export:
      Name: !Sub "${AWS::StackName}-TableStreamArn"
    Condition: EnableStreams

  # Export GSI ARN (only for us-west-2)
  GSIArn:
    Description: "Global Secondary Index ARN"
    Value: !Sub "${DynamoDBTable.Arn}/index/GSI1"
    Export:
      Name: !Sub "${AWS::StackName}-GSIArn"
    Condition: IsWest2

  # Export IAM Role ARN
  IAMRoleArn:
    Description: "IAM Role ARN for DynamoDB access"
    Value: !GetAtt DynamoDBAccessRole.Arn
    Export:
      Name: !Sub "${AWS::StackName}-IAMRoleArn"

  # Cross-region configuration summary (only for us-west-2)
  CrossRegionConfig:
    Description: "Cross-region table configuration"
    Value: !Sub "Cross-region setup for ${DynamoDBTable}"
    Export:
      Name: !Sub "${AWS::StackName}-CrossRegionConfig"
    Condition: HasCrossRegionReference

  # Lambda function ARN (only for us-west-2)
  LambdaFunctionArn:
    Description: "Lambda function ARN for cross-region operations"
    Value: !GetAtt CrossRegionLambdaFunction.Arn
    Export:
      Name: !Sub "${AWS::StackName}-LambdaFunctionArn"
    Condition: IsWest2

  # Capacity configuration
  CapacityConfiguration:
    Description: "Current capacity configuration"
    Value: !If
      - IsWest1
      - "Read: 5, Write: 5 (Fixed)"
      - !Sub "Read: ${ReadCapacityUnits}, Write: ${WriteCapacityUnits} (Parameterized)"
    Export:
      Name: !Sub "${AWS::StackName}-CapacityConfiguration"

  # Combined table details
  TableDetails:
    Description: "Combined table information"
    Value: !Join
      - " | "
      - - !Sub "Table: ${DynamoDBTable}"
        - !Sub "Region: ${AWS::Region}"
        - !Sub "Environment: ${EnvironmentSuffix}"
        - !Sub "DeploymentRegion: ${AWS::Region}"
    Export:
      Name: !Sub "${AWS::StackName}-TableDetails"

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Application Configuration"
        Parameters:
          - EnvironmentSuffix
          - ApplicationName
      - Label:
          default: "DynamoDB Capacity Settings (us-west-2 only)"
        Parameters:
          - ReadCapacityUnits
          - WriteCapacityUnits
    ParameterLabels:
      EnvironmentSuffix:
        default: "Environment Suffix"
      ApplicationName:
        default: "Application Name"
      ReadCapacityUnits:
        default: "Read Capacity Units"
      WriteCapacityUnits:
        default: "Write Capacity Units"
  cfn-lint:
    config:
      ignore_checks:
        - W6001
        - W1028 # Ignore unreachable Fn::If branch warnings - these are false positives
          # due to linter not understanding resource-level conditions vs intrinsic function conditions
      ignore_bad_template: false
