- **Incorrect Lambda permission SourceArn**: Used a non-ARN value for API Gateway permission.
  - Model:
```yaml
SourceArn: !Sub "${RestApi}/*/POST/api"
```
  - Correct:
```yaml
SourceArn: !Sub "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${RestApi}/*/POST/api"
```

- **Wrong S3 BucketPolicy Resource ARN**: Referenced bucket path without `arn:aws:s3:::` prefix.
  - Model:
```yaml
Resource: !Sub "${WebsiteS3Bucket}/*"
```
  - Correct:
```yaml
Resource: !Sub "arn:aws:s3:::${WebsiteS3Bucket}/*"
```

- **Incomplete KMS Key policy for S3 encryption**: Missing allow statement enabling S3 to use the CMK via service.
  - Required statement added in ideal:
```json
{
  "Sid": "Allow use of the key for S3 via service",
  "Effect": "Allow",
  "Principal": { "AWS": { "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root" } },
  "Action": [
    "kms:Encrypt",
    "kms:Decrypt",
    "kms:ReEncrypt*",
    "kms:GenerateDataKey*",
    "kms:DescribeKey"
  ],
  "Resource": "*",
  "Condition": {
    "StringEquals": {
      "kms:ViaService": { "Fn::Sub": "s3.${AWS::Region}.amazonaws.com" },
      "kms:CallerAccount": { "Fn::Sub": "${AWS::AccountId}" }
    }
  }
}
```

- **Outdated Lambda runtimes**: Used unsupported Node.js runtime.
  - Model:
```yaml
Runtime: nodejs16.x
```
  - Correct:
```yaml
Runtime: nodejs22.x
```

- **Missing tags on CloudWatch Log Groups**: Log groups lacked `Environment` and `Application` tags.
  - Corrective pattern (example):
```yaml
Tags:
  - Key: Environment
    Value: !Ref Environment
  - Key: Application
    Value: !Ref ApplicationName
```

- **Over-specified S3 BucketName (risk of name conflicts)**: Explicitly set `BucketName`; ideal omits to avoid global name collisions.
  - Model:
```yaml
BucketName: !Sub "${ApplicationName}-${Environment}-website-${AWS::AccountId}"
```
  - Correct: Omit `BucketName` and let CloudFormation/AWS assign a unique name.

- **Least-privilege gaps in IAM role policies**:
  - API Gateway role used a broad managed policy (`AmazonAPIGatewayPushToCloudWatchLogs`); ideal defines a minimal inline policy with only required `logs:*` actions.
  - Lambda roles relied on managed basic execution; ideal explicitly scopes required log actions inline. Prefer least-privilege inline policies where feasible.

- **Missing `EnvironmentSuffix` parameter and output**: Ideal template introduces `EnvironmentSuffix` for safer namespacing and exports; model omitted it.

- **Minor: Unused SDK code in inline Lambda**: Model's inline code imports `aws-sdk`/`DocumentClient` without using it; ideal removes unused code.