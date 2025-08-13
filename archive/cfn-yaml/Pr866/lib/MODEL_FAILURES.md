# Model Response Failures

This document summarizes the differences between the IDEAL and MODEL responses, highlighting failures in the model's output. Each failure is categorized and includes relevant code snippets for clarity.

---

## Failure 1: Incorrect Resource Naming

**Description:**
The model used non-compliant or inconsistent resource names compared to the ideal response.

**Example:**
```yaml
# Model Response
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    ...
```
```yaml
# Ideal Response
Resources:
  TapStackS3Bucket:
    Type: AWS::S3::Bucket
    ...
```

---

## Failure 2: Missing or Incorrect Tags

**Description:**
The model omitted required tags or used incorrect tag keys/values on resources.

**Example:**
```yaml
# Model Response
Resources:
  TapStackS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      ...
      Tags: []
```
```yaml
# Ideal Response
Resources:
  TapStackS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      ...
      Tags:
        - Key: Project
          Value: TapStack
        - Key: Environment
          Value: dev
```

---

## Failure 3: Incorrect IAM Policy ARNs

**Description:**
The model used placeholder or incorrect ARNs in IAM policies, which would cause deployment or permission errors.

**Example:**
```yaml
# Model Response
Resources:
  TapStackLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      Policies:
        - PolicyName: LambdaPolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action: s3:GetObject
                Resource: arn:aws:s3:::mybucket/*
```
```yaml
# Ideal Response
Resources:
  TapStackLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      Policies:
        - PolicyName: LambdaPolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action: s3:GetObject
                Resource: arn:aws:s3:::TapStackS3Bucket-<account-id>/*
```

---

## Failure 4: API Gateway StageName and Logging

**Description:**
The model used a non-unique or missing StageName for API Gateway, and/or omitted access log settings.

**Example:**
```yaml
# Model Response
Resources:
  TapStackApiStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      StageName: prod
      ...
```
```yaml
# Ideal Response
Resources:
  TapStackApiStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      StageName: dev
      AccessLogSetting:
        DestinationArn: !GetAtt TapStackLogGroup.Arn
        Format: '{ ... }'
```

---

## Failure 5: Lambda Handler Placement

**Description:**
The model placed the Lambda handler code outside the required directory or referenced it incorrectly in the function configuration.

**Example:**
```yaml
# Model Response
Resources:
  TapStackLambda:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Code:
        S3Bucket: ...
```
```yaml
# Ideal Response
Resources:
  TapStackLambda:
    Type: AWS::Lambda::Function
    Properties:
      Handler: lambda/index.handler
      Code:
        S3Bucket: ...
```

---

## Failure 6: Output ARNs Use Placeholders

**Description:**
The model's outputs used placeholder ARNs instead of dynamically referencing the real AWS account ID or resource names.

**Example:**
```yaml
# Model Response
Outputs:
  LambdaArn:
    Value: arn:aws:lambda:us-east-1:123456789012:function:MyFunction
```
```yaml
# Ideal Response
Outputs:
  LambdaArn:
    Value: !GetAtt TapStackLambda.Arn
```

---

## Failure 7: Missing or Incorrect Resource Properties

**Description:**
The model omitted required properties or used incorrect property values for AWS resources.

**Example:**
```yaml
# Model Response
Resources:
  TapStackS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      # Missing BucketEncryption
```
```yaml
# Ideal Response
Resources:
  TapStackS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
```

---

## Summary Table

| Failure # | Category                          | Description                                      |
|-----------|-----------------------------------|--------------------------------------------------|
| 1         | Resource Naming                   | Non-compliant or inconsistent resource names      |
| 2         | Tagging                           | Missing or incorrect tags                        |
| 3         | IAM Policy ARNs                   | Placeholder or incorrect ARNs in policies        |
| 4         | API Gateway Stage/Logging         | StageName/logging missing or incorrect           |
| 5         | Lambda Handler Placement          | Handler code misplacement or misreference        |
| 6         | Output ARNs                       | Placeholders instead of dynamic references       |
| 7         | Resource Properties               | Missing/incorrect resource properties            |

---

**End of Model Failures Report**
