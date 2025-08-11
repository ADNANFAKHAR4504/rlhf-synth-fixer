```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Parameters": {
    "Environment": { "Type": "String", "Default": "dev" },
    "Project": { "Type": "String", "Default": "WebApp" },
    "ReadCapacityUnits": { "Type": "Number", "Default": 5 },
    "WriteCapacityUnits": { "Type": "Number", "Default": 5 }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": { "CidrBlock": "10.0.0.0/16", "Tags": [{ "Key": "Environment", "Value": { "Ref": "Environment" } }, { "Key": "Project", "Value": { "Ref": "Project" } }] }
    },
    "SubnetA": {
      "Type": "AWS::EC2::Subnet",
      "Properties": { "VpcId": { "Ref": "VPC" }, "CidrBlock": "10.0.1.0/24", "Tags": [{ "Key": "Environment", "Value": { "Ref": "Environment" } }, { "Key": "Project", "Value": { "Ref": "Project" } }] }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": { "Version": "2012-10-17", "Statement": [{ "Effect": "Allow", "Principal": { "Service": "lambda.amazonaws.com" }, "Action": "sts:AssumeRole" }] },
        "Policies": [{
          "PolicyName": "LambdaPolicy",
          "PolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [
              { "Effect": "Allow", "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"], "Resource": "arn:aws:logs:*:*:*" },
              { "Effect": "Allow", "Action": ["dynamodb:PutItem", "dynamodb:GetItem"], "Resource": { "Fn::GetAtt": ["DynamoDBTable", "Arn"] } }
            ]
          }
        }]
      }
    },
    "LambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Handler": "index.handler",
        "Role": { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
        "Runtime": "nodejs14.x",
        "Code": { "ZipFile": "exports.handler = async () => { return { statusCode: 200, body: 'Hello!' }; };" },
        "VpcConfig": { "SubnetIds": [{ "Ref": "SubnetA" }] },
        "Tags": [{ "Key": "Environment", "Value": { "Ref": "Environment" } }, { "Key": "Project", "Value": { "Ref": "Project" } }]
      }
    },
    "ApiGateway": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": { "Name": { "Fn::Sub": "${Project}-${Environment}" }, "Tags": [{ "Key": "Environment", "Value": { "Ref": "Environment" } }, { "Key": "Project", "Value": { "Ref": "Project" } }] }
    },
    "Resource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": { "ParentId": { "Fn::GetAtt": ["ApiGateway", "RootResourceId"] }, "RestApiId": { "Ref": "ApiGateway" }, "PathPart": "resource" }
    },
    "Method": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "HttpMethod": "GET",
        "ResourceId": { "Ref": "Resource" },
        "RestApiId": { "Ref": "ApiGateway" },
        "AuthorizationType": "NONE",
        "Integration": { "IntegrationHttpMethod": "POST", "Type": "AWS_PROXY", "Uri": { "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations" } }
      }
    },
    "Deployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "Properties": { "RestApiId": { "Ref": "ApiGateway" }, "StageName": "prod" },
      "DependsOn": ["Method"]
    },
    "DynamoDBTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": { "Fn::Sub": "${Project}-${Environment}" },
        "AttributeDefinitions": [{ "AttributeName": "id", "AttributeType": "S" }],
        "KeySchema": [{ "AttributeName": "id", "KeyType": "HASH" }],
        "ProvisionedThroughput": { "ReadCapacityUnits": { "Ref": "ReadCapacityUnits" }, "WriteCapacityUnits": { "Ref": "WriteCapacityUnits" } },
        "Tags": [{ "Key": "Environment", "Value": { "Ref": "Environment" } }, { "Key": "Project", "Value": { "Ref": "Project" } }]
      }
    },
    "LambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": { "Fn::Sub": "/aws/lambda/${LambdaFunction}" },
        "RetentionInDays": 7
      }
    },
    "LambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Lambda error rate > 1%",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": "300",
        "EvaluationPeriods": "1",
        "Threshold": "1",
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [{ "Name": "FunctionName", "Value": { "Ref": "LambdaFunction" } }],
        "AlarmActions": []
      }
    }
  }
}
```