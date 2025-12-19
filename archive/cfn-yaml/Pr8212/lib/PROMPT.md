I need help updating my existing CloudFormation template to build out a complete feedback system in us-east-1. I already have a basic stack with a DynamoDB table, but I need to add several AWS services to make it a production-ready feedback collection and analysis platform.

Here's my current CloudFormation template (lib/TapStack.yml):

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'TAP Stack - Task Assignment Platform CloudFormation Template'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

Resources:
  TurnAroundPromptTable:
    Type: AWS::DynamoDB::Table
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      TableName: !Sub 'TurnAroundPromptTable${EnvironmentSuffix}'
      AttributeDefinitions:
        - AttributeName: 'id'
          AttributeType: 'S'
      KeySchema:
        - AttributeName: 'id'
          KeyType: 'HASH'
      BillingMode: PAY_PER_REQUEST
      DeletionProtectionEnabled: false
      # Tags will be applied at stack level during deployment

Outputs:
  TurnAroundPromptTableName:
    Description: 'Name of the DynamoDB table'
    Value: !Ref TurnAroundPromptTable
    Export:
      Name: !Sub '${AWS::StackName}-TurnAroundPromptTableName'

  TurnAroundPromptTableArn:
    Description: 'ARN of the DynamoDB table'
    Value: !GetAtt TurnAroundPromptTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-TurnAroundPromptTableArn'

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

**IMPORTANT: Please update ONLY this existing template file. Do not create a new stack or provide a separate solution - I need you to modify the TapStack.yml content above.**

Here's what I need you to add to this existing template:

1. **API Gateway**: Set up REST API endpoints for submitting feedback. The API should have proper request validation.

2. **Lambda Function**: Create a Lambda function using Python 3.10 runtime that will process incoming feedback submissions. This function should handle real data processing (not just a hello world example). It needs to validate input, send data to Comprehend for analysis, and store results in DynamoDB.

3. **Amazon Comprehend**: Integrate Comprehend for automated sentiment analysis of the feedback text.

4. **DynamoDB Enhancement**: Update the existing TurnAroundPromptTable or add attributes to support storing feedback responses. Add a Global Secondary Index (GSI) for efficient querying by date or sentiment score.

5. **S3 Bucket**: Create a bucket for storing generated weekly reports.

6. **EventBridge Rule**: Set up a scheduled rule to trigger weekly report generation (every Monday at 9 AM would be ideal).

7. **Lambda for Reports**: Create another Lambda function that generates weekly summary reports by querying DynamoDB, aggregating sentiment data, and uploading reports to S3.

8. **Amazon SES**: Configure SES to send email notifications with the weekly reports.

9. **CloudWatch**: Add CloudWatch alarms and metrics for monitoring the system (e.g., Lambda errors, API Gateway 4xx/5xx errors).

10. **IAM Roles**: Create all necessary IAM roles with appropriate permissions for Lambda functions to access DynamoDB, S3, Comprehend, SES, and CloudWatch.

**Critical Requirements:**
- No hardcoded values like account IDs, ARNs, or specific region names - everything must work across different AWS accounts
- Use the existing EnvironmentSuffix parameter for all resource naming
- Add the tag "iac-rlhf-amazon" to all resources that support tagging
- Make sure Lambda functions demonstrate production-quality use cases with proper error handling and validation
- The template must be deployable in any AWS account without modifications
- Implement proper input validation in the API Gateway and Lambda layers
- Ensure the GSI on DynamoDB supports efficient queries for report generation

Please update the existing CloudFormation template with all these components integrated together as a cohesive feedback system.
