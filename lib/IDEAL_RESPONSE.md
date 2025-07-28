AWSTemplateFormatVersion: '2010-09-09'
Description: Serverless infrastructure with Lambda, S3, API Gateway, IAM roles, and CloudWatch monitoring.

Parameters:
  LambdaFunctionName:
    Type: String
    Default: Lambda-api-229220-iac
    Description: The name of the Lambda function.
  S3BucketName:
    Type: String
    Default: s3-bucket-229220-iac
    Description: The name of the S3 bucket triggering the Lambda.
    AllowedPattern: '^[a-z0-9][a-z0-9.-]*[a-z0-9]$'
    ConstraintDescription: 'S3 bucket name must be between 3 and 63 characters, contain only lowercase letters, numbers, hyphens, and periods, and must start and end with a lowercase letter or number.'
  ApiGatewayName:
    Type: String
    Default: apigateway-lambda-229220-iac
    Description: The name of the API Gateway.

Resources:

  # S3 Bucket
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref S3BucketName
      Tags:
        - Key: "Environment"
          Value: "Production"
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: "s3:ObjectCreated:*"
            Function: !GetAtt LambdaFunction.Arn

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: "Allow"
            Principal:
              Service: "lambda.amazonaws.com"
            Action: "sts:AssumeRole"
      Policies:
        - PolicyName: "LambdaS3Policy"
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: "Allow"
                Action:
                  - "s3:GetObject"
                  - "s3:PutObject"
                Resource: !Sub "arn:aws:s3:::${S3BucketName}/*"
              - Effect: "Allow"
                Action:
                  - "logs:*"
                Resource: "*"

  # Lambda Function to upload .zip code to S3 (Custom Resource)
  UploadLambdaFunctionCode:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "UploadLambdaCodeFunction-${AWS::StackName}"  # Unique name per stack
      Runtime: nodejs22.x
      Role: !GetAtt LambdaExecutionRole.Arn
      Handler: index.handler
      Code:
        ZipFile: |
          const AWS = require('aws-sdk');
          const s3 = new AWS.S3();
          const fs = require('fs');
          const path = require('path');

          exports.handler = async () => {
            const bucketName = process.env.BUCKET_NAME;
            const filePath = path.join(__dirname, 'lambda-229220.zip');
            const fileContent = fs.readFileSync(filePath);

            try {
              const params = {
                Bucket: bucketName,
                Key: 'lambda-229220.zip',
                Body: fileContent
              };

              const result = await s3.putObject(params).promise();
              console.log("File uploaded successfully", result);
              return { statusCode: 200, body: 'File uploaded successfully' };
            } catch (err) {
              console.log("Error uploading file", err);
              return { statusCode: 500, body: 'Error uploading file' };
            }
          };
      Environment:
        Variables:
          BUCKET_NAME: !Ref S3BucketName
      Timeout: 60
      MemorySize: 128

  # Custom Resource for Lambda Upload (Ensures Lambda Code is uploaded before Lambda is created)
  LambdaUploadCustomResource:
    Type: Custom::UploadLambdaCode
    DependsOn: S3Bucket  # Ensure the S3 bucket is created first
    Properties:
      ServiceToken: !GetAtt UploadLambdaFunctionCode.Arn

  # Lambda Function (Main Lambda)
  LambdaFunction:
    Type: AWS::Lambda::Function
    DependsOn: LambdaUploadCustomResource  # Ensure the custom resource is triggered before Lambda creation
    Properties:
      FunctionName: !Ref LambdaFunctionName
      Runtime: nodejs22.x
      Role: !GetAtt LambdaExecutionRole.Arn
      Handler: index.handler
      Code:
        S3Bucket: !Ref S3BucketName  # Lambda code uploaded to this bucket
        S3Key: lambda-229220.zip  # The S3 object key for the Lambda code
      Environment:
        Variables:
          MY_ENV_VAR: "example-value"  # Add your actual environment variables here
      Timeout: 10  # Lambda function timeout in seconds
      MemorySize: 128  # Lambda function memory size in MB
      Tags:
        - Key: "Environment"
          Value: "Production"
      TracingConfig:
        Mode: Active

  # API Gateway
  ApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Ref ApiGatewayName
      Description: API Gateway for triggering Lambda functions.
      FailOnWarnings: true
      Tags:
        - Key: "Environment"
          Value: "Production"

  # API Gateway Resource (e.g., "/invoke")
  ApiGatewayResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ApiGateway
      ParentId: !GetAtt ApiGateway.RootResourceId
      PathPart: invoke

  # API Gateway Method
  ApiGatewayMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      AuthorizationType: NONE
      HttpMethod: POST
      ResourceId: !Ref ApiGatewayResource
      RestApiId: !Ref ApiGateway
      Integration:
        IntegrationHttpMethod: POST
        Type: AWS_PROXY
        Uri: !Sub "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations"
      MethodResponses:
        - StatusCode: 200

  # API Gateway Deployment
  ApiGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: ApiGatewayMethod
    Properties:
      RestApiId: !Ref ApiGateway
      StageName: prod

  # Lambda Permission to allow API Gateway to invoke Lambda
  LambdaApiGatewayInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref LambdaFunction
      Principal: apigateway.amazonaws.com

  # CloudWatch Log Group for Lambda
  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/lambda/${LambdaFunctionName}"
      RetentionInDays: 7

Outputs:
  ApiEndpoint:
    Description: "API Gateway URL"
    Value: !Sub "https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/prod/invoke"
    
  LambdaFunctionArn:
    Description: "Lambda ARN"
    Value: !GetAtt LambdaFunction.Arn
