# MODEL_FAILURES.md

## Overview

This document analyzes the model-generated CloudFormation template (`MODEL_RESPONSE.md`) against the **requirements in `PROMPT.md`** and the **ideal solution (`IDEAL_RESPONSE.md`)**. Each failure is described with the reason for the discrepancy and the relevant code snippet.



## 1. AWS Config Recorder

**Failure:**
The model attempted to create a new `AWS::Config::ConfigurationRecorder` unconditionally, causing deployment failures when a recorder already exists.

**Reason:**

* The prompt required dynamic handling for existing resources.
* No condition was applied to check if the Config recorder already exists.

**Snippet from MODEL_RESPONSE.md:**

```yaml
ConfigRecorder:
  Type: AWS::Config::ConfigurationRecorder
  Properties:
    Name: !Sub '${CompanyPrefix}-config-recorder'
    RoleARN: !GetAtt ConfigRole.Arn
    RecordingGroup:
      AllSupported: true
      IncludeGlobalResourceTypes: true
```

**Correction in IDEAL_RESPONSE.md:**

* Added a condition (`CreateConfigRecorder`) to only create the recorder if it does not already exist.
* Included a parameter `UseExistingConfigRecorder` to allow the stack to reference an existing recorder.



## 2. IAM Role for AWS Config

**Failure:**
The model referenced a managed policy `arn:aws:iam::aws:policy/service-role/AWSConfigRole` that does not exist.

**Reason:**

* Incorrect ARN caused `404 NotFound` error during deployment.
* Violates the requirement for robust, production-ready IAM configuration.

**Snippet from MODEL_RESPONSE.md:**

```yaml
ConfigRole:
  Type: AWS::IAM::Role
  Properties:
    AssumeRolePolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Principal:
            Service: config.amazonaws.com
          Action: sts:AssumeRole
    ManagedPolicyArns:
      - arn:aws:iam::aws:policy/service-role/AWSConfigRole
```

**Correction in IDEAL_RESPONSE.md:**

* Use a valid managed policy (`AWSConfigRole`) that exists.
* Ensure role creation fails gracefully or references an existing role if present.



## 3. Security Group Rules

**Failure:**
The model allowed overly permissive inbound access in security groups.

**Reason:**

* Requirement explicitly states that unrestricted access is not allowed.
* Some ingress rules in the model did not restrict ports or IP ranges.

**Snippet from MODEL_RESPONSE.md:**

```yaml
EC2SecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Default SG
    VpcId: !Ref VPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 0
        ToPort: 65535
        CidrIp: 0.0.0.0/0
```

**Correction in IDEAL_RESPONSE.md:**

* Restricted SSH access to a specific CIDR block.
* All other ports follow least-privilege principles.



## 4. S3 Bucket Policies

**Failure:**
The model did not enforce HTTPS-only access for S3 buckets.

**Reason:**

* This violates the security requirement: all S3 bucket policies must deny HTTP requests.

**Snippet from MODEL_RESPONSE.md:**

```yaml
MyS3Bucket:
  Type: AWS::S3::Bucket
```

**Correction in IDEAL_RESPONSE.md:**

* Added bucket policy explicitly denying HTTP:

```yaml
BucketPolicy:
  Type: AWS::S3::BucketPolicy
  Properties:
    Bucket: !Ref MyS3Bucket
    PolicyDocument:
      Statement:
        - Effect: Deny
          Principal: '*'
          Action: s3:*
          Resource: !Sub '${MyS3Bucket.Arn}/*'
          Condition:
            Bool:
              aws:SecureTransport: false
```



## 5. Lambda Runtime Version

**Failure:**
The model did not enforce the use of the latest Lambda runtime versions.

**Reason:**

* Security requirement mandates that Lambda functions always use the latest runtime.

**Snippet from MODEL_RESPONSE.md:**

```yaml
MyLambdaFunction:
  Type: AWS::Lambda::Function
  Properties:
    Runtime: nodejs12.x
```

**Correction in IDEAL_RESPONSE.md:**

* Updated runtime to `nodejs18.x` (latest stable).
* Could include a dynamic reference to always pick the latest supported runtime.



## 6. CloudTrail Configuration

**Failure:**
The model created CloudTrail without multi-region logging enabled.

**Reason:**

* Enterprise security requires all API calls across regions to be logged.

**Snippet from MODEL_RESPONSE.md:**

```yaml
MyCloudTrail:
  Type: AWS::CloudTrail::Trail
  Properties:
    S3BucketName: !Ref MyS3Bucket
    IsLogging: true
```

**Correction in IDEAL_RESPONSE.md:**

* Enabled `IsMultiRegionTrail: true` to capture logs from all regions.

