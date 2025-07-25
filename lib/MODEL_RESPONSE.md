AWSTemplateFormatVersion: '2010-09-09'
Description: Serverless RESTful API for User Management

Parameters:
Stage:
Type: String
AllowedValues: - dev - test - prod
Default: dev

Resources:
UsersTable:
Type: AWS::DynamoDB::Table
Properties:
TableName: !Sub UsersTable-${Stage}
AttributeDefinitions: - AttributeName: UserId
AttributeType: S
KeySchema: - AttributeName: UserId
KeyType: HASH
BillingMode: PAY_PER_REQUEST

ApiGatewayRestApi:
Type: AWS::ApiGateway::RestApi
Properties:
Name: !Sub UserManagementApi-${Stage}
Description: RESTful API for managing users

ApiGatewayResourceUsers:
Type: AWS::ApiGateway::Resource
Properties:
ParentId: !GetAtt ApiGatewayRestApi.RootResourceId
RestApiId: !Ref ApiGatewayRestApi
PathPart: users

CreateUserMethod:
Type: AWS::ApiGateway::Method
Properties:
RestApiId: !Ref ApiGatewayRestApi
ResourceId: !Ref ApiGatewayResourceUsers
HttpMethod: POST
AuthorizationType: NONE
Integration:
IntegrationHttpMethod: POST
Type: AWS_PROXY
Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${CreateUserFunction.Arn}/invocations

GetUserMethod:
Type: AWS::ApiGateway::Method
Properties:
RestApiId: !Ref ApiGatewayRestApi
ResourceId: !Ref ApiGatewayResourceUsers
HttpMethod: GET
AuthorizationType: NONE
RequestParameters:
method.request.path.userid: true
Integration:
IntegrationHttpMethod: POST
Type: AWS_PROXY
Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${GetUserFunction.Arn}/invocations

DeleteUserMethod:
Type: AWS::ApiGateway::Method
Properties:
RestApiId: !Ref ApiGatewayRestApi
ResourceId: !Ref ApiGatewayResourceUsers
HttpMethod: DELETE
AuthorizationType: NONE
RequestParameters:
method.request.path.userid: true
Integration:
IntegrationHttpMethod: POST
Type: AWS_PROXY
Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${DeleteUserFunction.Arn}/invocations

CreateUserFunction:
Type: AWS::Lambda::Function
Properties:
FunctionName: !Sub CreateUserFunction-${Stage}
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          dynamodb = boto3.resource('dynamodb')
          table = dynamodb.Table('UsersTable-' + '${Stage}')
def handler(event, context):
user_id = event['body-json']['UserId']
table.put_item(Item={'UserId': user_id})
return {'statusCode': 200, 'body': json.dumps({'message': 'User created'})}

GetUserFunction:
Type: AWS::Lambda::Function
Properties:
FunctionName: !Sub GetUserFunction-${Stage}
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          dynamodb = boto3.resource('dynamodb')
          table = dynamodb.Table('UsersTable-' + '${Stage}')
def handler(event, context):
user_id = event['pathParameters']['userid']
response = table.get_item(Key={'UserId': user_id})
return {'statusCode': 200, 'body': json.dumps(response.get('Item', {}))}

DeleteUserFunction:
Type: AWS::Lambda::Function
Properties:
FunctionName: !Sub DeleteUserFunction-${Stage}
      Runtime: python3.9
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          dynamodb = boto3.resource('dynamodb')
          table = dynamodb.Table('UsersTable-' + '${Stage}')
def handler(event, context):
user_id = event['pathParameters']['userid']
table.delete_item(Key={'UserId': user_id})
return {'statusCode': 200, 'body': json.dumps({'message': 'User deleted'})}

LambdaExecutionRole:
Type: AWS::IAM::Role
Properties:
RoleName: !Sub LambdaExecutionRole-${Stage}
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: !Sub LambdaDynamoDBPolicy-${Stage}
PolicyDocument:
Version: '2012-10-17'
Statement: - Effect: Allow
Action: - dynamodb:PutItem - dynamodb:GetItem - dynamodb:DeleteItem
Resource: !Sub arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/UsersTable-${Stage}

Outputs:
ApiUrl:
Value: !Sub "https://${ApiGatewayRestApi}.execute-api.${AWS::Region}.amazonaws.com/${Stage}"
