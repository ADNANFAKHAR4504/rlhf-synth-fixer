## lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: CloudFormation template to deploy a Lambda function and grant S3 permission to invoke it. # Updated description to match the unit test expectation

Parameters:
  S3BucketName:
    Type: String
    Description: The name of the S3 bucket that will trigger the Lambda function.
    Default: my-unique-s3-trigger-bucket-12345 # Suggest a unique name to avoid conflicts

  LambdaFunctionName:
    Type: String
    Description: The name of the Lambda function to be created.
    Default: my-s3-event-processor-lambda-12345

  LambdaHandler:
    Type: String
    Description: The handler for the Lambda function (e.g., index.handler).
    Default: index.handler

  LambdaRuntime:
    Type: String
    Description: The runtime for the Lambda function (e.g., nodejs20.x, python3.12).
    Default: nodejs20.x # Using a current Node.js runtime

Resources:

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
        - PolicyName: "LambdaS3AccessAndLogsPolicy" # Policy name used in the integration test
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: "Allow"
                Action:
                  - "logs:CreateLogGroup"
                  - "logs:CreateLogStream"
                  - "logs:PutLogEvents"
                Resource: !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${LambdaFunctionName}:*"
              - Effect: "Allow"
                Action:
                  - "s3:GetObject"
                Resource: !Sub "arn:aws:s3:::${S3BucketName}/*"

  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Ref LambdaFunctionName
      Handler: !Ref LambdaHandler
      Role: !GetAtt LambdaExecutionRole.Arn
      Runtime: !Ref LambdaRuntime
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            console.log("Received event:", JSON.stringify(event, null, 2));

            if (event.Records && event.Records[0] && event.Records[0].s3) {
              const record = event.Records[0];
              const s3Bucket = record.s3.bucket.name;
              const s3Key = record.s3.object.key;
              const eventName = record.eventName;

              console.log(`S3 Event Type: ${eventName}`);
              console.log(`New object created in bucket: ${s3Bucket} with key: ${s3Key}`);
              console.log(`Successfully processed S3 event for key: ${s3Key}`);

              return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Lambda executed successfully', s3Event: true }),
              };
            } else {
              console.log("Event is not an S3 object creation event or is an invalid payload.");
              return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid input: Expected an S3 object creation event.' }),
              };
            }
          };
      Timeout: 30
      MemorySize: 128
      Tags:
        - Key: Project
          Value: S3TriggerLambda
        - Key: Environment
          Value: Development

  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref S3BucketName
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: "s3:ObjectCreated:*"
            Function: !GetAtt LambdaFunction.Arn
      Tags:
        - Key: Project
          Value: S3TriggerLambda
        - Key: Environment
          Value: Development

  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !GetAtt LambdaFunction.Arn
      Principal: s3.amazonaws.com
      SourceArn: !Sub "arn:aws:s3:::${S3BucketName}"

Outputs:
  LambdaFunctionArn:
    Description: Lambda ARN
    Value: !GetAtt LambdaFunction.Arn

  LambdaFunctionName:
    Description: The name of the Lambda function
    Value: !Ref LambdaFunctionName

  LambdaExecutionRoleArn:
    Description: The ARN of the IAM Role assumed by Lambda
    Value: !GetAtt LambdaExecutionRole.Arn

  S3BucketName:
    Description: The name of the S3 bucket # This output exists and references the S3BucketName parameter
    Value: !Ref S3BucketName

  RunTime:
    Description: The runtime of the Lambda function # Corrected description
    Value: !Ref LambdaRuntime # Corrected to LambdaRuntime parameter

  Handler:
    Description: The handler of the Lambda function # Corrected description
    Value: !Ref LambdaHandler # Corrected to LambdaHandler parameter
```
