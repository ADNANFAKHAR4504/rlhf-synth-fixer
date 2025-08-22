The code you provided is failing in deploy stage with these errors -

```bash

Diagnostics:
  aws:s3:Bucket (alb-access-logs):
    warning: urn:pulumi:TapStackpr2075::TapStack::tap:stack:TapStack$tap:infrastructure:InfrastructureStack$aws:s3/bucket:Bucket::alb-access-logs verification warning: server_side_encryption_configuration is deprecated. Use the aws_s3_bucket_server_side_encryption_configuration resource instead.
    error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating S3 Bucket (TapStack-pr2075-alb-logs-TapStackpr2075): operation error S3: CreateBucket, https response error StatusCode: 400, RequestID: FYY3KESE70R0AWJJ, HostID: xfKm2jxUwSwWHZ2pjwZGGas4dwJ9TD6UTOaVMeUGR926a84PaEA2oDDdmhk6AaKxdj0ncrZLNvY=, api error InvalidBucketName: The specified bucket is not valid.: provider=aws@7.5.0
    error: 1 error occurred:
    	* creating S3 Bucket (TapStack-pr2075-alb-logs-TapStackpr2075): operation error S3: CreateBucket, https response error StatusCode: 400, RequestID: FYY3KESE70R0AWJJ, HostID: xfKm2jxUwSwWHZ2pjwZGGas4dwJ9TD6UTOaVMeUGR926a84PaEA2oDDdmhk6AaKxdj0ncrZLNvY=, api error InvalidBucketName: The specified bucket is not valid.
  aws:cloudwatch:LogGroup (TapStack-pr2075-main-log-group):
    error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating CloudWatch Logs Log Group (/aws/ec2/TapStack-pr2075): operation error CloudWatch Logs: CreateLogGroup, https response error StatusCode: 400, RequestID: 7b954618-4ca9-4960-96a7-57ee079efb2c, api error AccessDeniedException: The specified KMS key does not exist or is not allowed to be used with Arn 'arn:aws:logs:us-east-1:***:log-group:/aws/ec2/TapStack-pr2075': provider=aws@7.5.0
    error: 1 error occurred:
    	* creating CloudWatch Logs Log Group (/aws/ec2/TapStack-pr2075): operation error CloudWatch Logs: CreateLogGroup, https response error StatusCode: 400, RequestID: 7b954618-4ca9-4960-96a7-57ee079efb2c, api error AccessDeniedException: The specified KMS key does not exist or is not allowed to be used with Arn 'arn:aws:logs:us-east-1:***:log-group:/aws/ec2/TapStack-pr2075'
  pulumi:pulumi:Stack (TapStack-TapStackpr2075):
    error: update failed
  aws:s3:Bucket (TapStack-pr2075-cloudfront-logs-TapStackpr2075):
    warning: urn:pulumi:TapStackpr2075::TapStack::tap:stack:TapStack$tap:infrastructure:InfrastructureStack$aws:s3/bucket:Bucket::TapStack-pr2075-cloudfront-logs-TapStackpr2075 verification warning: server_side_encryption_configuration is deprecated. Use the aws_s3_bucket_server_side_encryption_configuration resource instead.
    error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating S3 Bucket (TapStack-pr2075-cloudfront-logs-TapStackpr2075): operation error S3: CreateBucket, https response error StatusCode: 400, RequestID: FYY51QBPVV6S6RZG, HostID: EVCjR2x5iN/88lNeO8gvkhOTZJ7dx4SSvLwEPr0+ySTohUNHsBeehSflUrOtdU7oGBn+BmgGBsM14y067QdwnE1cXnXkzCnzwYKc3KJPzPw=, api error InvalidBucketName: The specified bucket is not valid.: provider=aws@7.5.0
    error: 1 error occurred:
    	* creating S3 Bucket (TapStack-pr2075-cloudfront-logs-TapStackpr2075): operation error S3: CreateBucket, https response error StatusCode: 400, RequestID: FYY51QBPVV6S6RZG, HostID: EVCjR2x5iN/88lNeO8gvkhOTZJ7dx4SSvLwEPr0+ySTohUNHsBeehSflUrOtdU7oGBn+BmgGBsM14y067QdwnE1cXnXkzCnzwYKc3KJPzPw=, api error InvalidBucketName: The specified bucket is not valid.

```