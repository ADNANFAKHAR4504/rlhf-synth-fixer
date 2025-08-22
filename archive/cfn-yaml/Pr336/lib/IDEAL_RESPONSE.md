# CloudFormation Infrastructure Solution

This solution implements the infrastructure requirements using AWS CloudFormation.

## Template Structure

The infrastructure is defined in the following CloudFormation template:

### Main Template (TapStack.yml)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure Serverless Application Infrastructure with API Gateway, Lambda, and DynamoDB'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Suffix for the environment (e.g., dev, prod)
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: Must contain only alphanumeric characters.
    Default: 'dev'
  
  ApplicationName:
    Type: String
    Default: 'serverless-app'
    Description: 'Application name for resource naming'

Resources:
  # ============================================================================
  # VPC INFRASTRUCTURE
  # ============================================================================
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-igw-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-public-subnet-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-private-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.3.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-private-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-nat-eip-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-nat-gateway-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-public-rt-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-private-rt-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet2

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Lambda function'
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS outbound for AWS API calls'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP outbound for package downloads'
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-lambda-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DynamoDBVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.dynamodb'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable

  # ============================================================================
  # DYNAMODB TABLE
  # ============================================================================
  
  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${ApplicationName}-table-${EnvironmentSuffix}'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      SSESpecification:
        SSEEnabled: true
        SSEType: KMS
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-table-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ============================================================================
  # IAM ROLES AND POLICIES
  # ============================================================================
  
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
                Resource: !GetAtt DynamoDBTable.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-lambda-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  APIGatewayRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: LambdaInvokePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - lambda:InvokeFunction
                Resource: !GetAtt LambdaFunction.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-apigateway-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # ============================================================================
  # LAMBDA FUNCTION
  # ============================================================================
  
  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ApplicationName}-function-${EnvironmentSuffix}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          DYNAMODB_TABLE: !Ref DynamoDBTable
          ENVIRONMENT: !Ref EnvironmentSuffix
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          import uuid

          dynamodb = boto3.resource('dynamodb')
          table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

          def lambda_handler(event, context):
              try:
                  http_method = event['httpMethod']
                  
                  if http_method == 'GET':
                      # Read operation
                      response = table.scan()
                      return {
                          'statusCode': 200,
                          'headers': {
                              'Content-Type': 'application/json',
                              'Access-Control-Allow-Origin': '*'
                          },
                          'body': json.dumps({
                              'message': 'Data retrieved successfully',
                              'data': response.get('Items', []),
                              'count': response.get('Count', 0)
                          })
                      }
                  
                  elif http_method == 'POST':
                      # Write operation
                      body = json.loads(event['body']) if event.get('body') else {}
                      
                      item = {
                          'id': str(uuid.uuid4()),
                          'data': body.get('data', 'default data'),
                          'timestamp': datetime.utcnow().isoformat(),
                          'environment': os.environ['ENVIRONMENT']
                      }
                      
                      table.put_item(Item=item)
                      
                      return {
                          'statusCode': 201,
                          'headers': {
                              'Content-Type': 'application/json',
                              'Access-Control-Allow-Origin': '*'
                          },
                          'body': json.dumps({
                              'message': 'Data created successfully',
                              'item': item
                          })
                      }
                  
                  else:
                      return {
                          'statusCode': 405,
                          'headers': {
                              'Content-Type': 'application/json',
                              'Access-Control-Allow-Origin': '*'
                          },
                          'body': json.dumps({'error': 'Method not allowed'})
                      }
                      
              except Exception as e:
                  return {
                      'statusCode': 500,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({'error': str(e)})
                  }
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-function-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  LambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref LambdaFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${RestApi}/${EnvironmentSuffix}/*'

  # ============================================================================
  # API GATEWAY
  # ============================================================================
  
  RestApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${ApplicationName}-api-${EnvironmentSuffix}'
      Description: 'Secure REST API for serverless application'
      EndpointConfiguration:
        Types:
          - REGIONAL
      Policy:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action: execute-api:Invoke
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-api-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  ApiResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref RestApi
      ParentId: !GetAtt RestApi.RootResourceId
      PathPart: 'data'

  GetMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestApi
      ResourceId: !Ref ApiResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations'
        Credentials: !GetAtt APIGatewayRole.Arn
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: Empty
          ResponseParameters:
            method.response.header.Access-Control-Allow-Origin: false

  PostMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestApi
      ResourceId: !Ref ApiResource
      HttpMethod: POST
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations'
        Credentials: !GetAtt APIGatewayRole.Arn
      MethodResponses:
        - StatusCode: 201
          ResponseModels:
            application/json: Empty
          ResponseParameters:
            method.response.header.Access-Control-Allow-Origin: false

  OptionsMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref RestApi
      ResourceId: !Ref ApiResource
      HttpMethod: OPTIONS
      AuthorizationType: NONE
      Integration:
        Type: MOCK
        IntegrationResponses:
          - StatusCode: 200
            ResponseParameters:
              method.response.header.Access-Control-Allow-Headers: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
              method.response.header.Access-Control-Allow-Methods: "'GET,POST,OPTIONS'"
              method.response.header.Access-Control-Allow-Origin: "'*'"
        RequestTemplates:
          application/json: '{"statusCode": 200}'
      MethodResponses:
        - StatusCode: 200
          ResponseParameters:
            method.response.header.Access-Control-Allow-Headers: false
            method.response.header.Access-Control-Allow-Methods: false
            method.response.header.Access-Control-Allow-Origin: false

  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - GetMethod
      - PostMethod
      - OptionsMethod
    Properties:
      RestApiId: !Ref RestApi

  ApiStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref RestApi
      DeploymentId: !Ref ApiDeployment
      StageName: !Ref EnvironmentSuffix
      Description: !Sub 'Stage for ${EnvironmentSuffix} environment'
      MethodSettings:
        - ResourcePath: '/*'
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true
      Tags:
        - Key: Name
          Value: !Sub '${ApplicationName}-api-stage-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix

# ============================================================================
# OUTPUTS
# ============================================================================

Outputs:
  ApiGatewayUrl:
    Description: 'API Gateway endpoint URL'
    Value: !Sub 'https://${RestApi}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}/data'
    Export:
      Name: !Sub '${ApplicationName}-api-url-${EnvironmentSuffix}'

  DynamoDBTableName:
    Description: 'DynamoDB table name'
    Value: !Ref DynamoDBTable
    Export:
      Name: !Sub '${ApplicationName}-table-name-${EnvironmentSuffix}'

  LambdaFunctionName:
    Description: 'Lambda function name'
    Value: !Ref LambdaFunction
    Export:
      Name: !Sub '${ApplicationName}-function-name-${EnvironmentSuffix}'

  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${ApplicationName}-vpc-id-${EnvironmentSuffix}'

  PrivateSubnetIds:
    Description: 'Private subnet IDs'
    Value: !Sub '${PrivateSubnet1},${PrivateSubnet2}'
    Export:
      Name: !Sub '${ApplicationName}-private-subnets-${EnvironmentSuffix}'
```

## Key Features

- Infrastructure as Code using CloudFormation YAML
- Parameterized configuration for flexibility
- Resource outputs for integration
- Environment suffix support for multi-environment deployments

## Deployment

The template can be deployed using AWS CLI or through the CI/CD pipeline:

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
```
