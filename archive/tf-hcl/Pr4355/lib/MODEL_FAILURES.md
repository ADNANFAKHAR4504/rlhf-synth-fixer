1. Generated response by the model had missing CloudFront Origin Access Identity resource which caused deployment to require manual variable input breaking the Infrastructure as Code principle.

2. Model used deprecated aws_s3_bucket_acl resource for S3 log delivery permissions which is not supported in AWS Provider 5.x causing API errors during deployment.

```
│ Error: creating S3 Bucket (media-assets-logs) ACL: operation error S3: PutBucketAcl, 
│ https response error StatusCode: 400, RequestID: H7HNAQF5SXS52XM6, 
│ api error AccessControlListNotSupported: The bucket does not allow ACLs
│ 
│   with aws_s3_bucket_acl.logs,
│   on main.tf line 83, in resource "aws_s3_bucket_acl" "logs":
│   83: resource "aws_s3_bucket_acl" "logs" {
│ 
```

3. Model added default_tags configuration with timestamp() function in provider block causing inconsistent plan errors during terraform apply.

```
│ Error: Provider produced inconsistent final plan
│ 
│ When expanding the plan for aws_s3_bucket.dev to include new values learned so far during apply, 
│ provider "registry.terraform.io/hashicorp/aws" produced an invalid new value for .tags_all: 
│ new element "CreatedDate" has appeared.
│ 
│   with aws_s3_bucket.dev,
│   on provider.tf line 10, in provider "aws":
│   10: provider "aws" {
│ 
```

4. Model used hardcoded bucket names without random suffixes causing global S3 naming conflicts when bucket names already exist.

```
│ Error: creating S3 Bucket (media-assets-dev): operation error S3: CreateBucket, 
│ https response error StatusCode: 409, RequestID: 79TAAKV18FD8T035, 
│ BucketAlreadyExists: 
│ 
│   with aws_s3_bucket.dev,
│   on main.tf line 112, in resource "aws_s3_bucket" "dev":
│   112: resource "aws_s3_bucket" "dev" {
│ 
```

5. Model omitted required filter block in lifecycle configuration rules causing deprecation warnings that will become errors in future provider versions.

```
│ Warning: Invalid Attribute Combination
│ 
│   with aws_s3_bucket_lifecycle_configuration.logs,
│   on main.tf line 78, in resource "aws_s3_bucket_lifecycle_configuration" "logs":
│   78: resource "aws_s3_bucket_lifecycle_configuration" "logs" {
│ 
│ No attribute specified when one (and only one) of [rule.filter,rule.prefix] is required
│ 
│ This will be an error in a future version of the provider
│ 
```

6. Model defined cloudfront_oai_arn as a variable expecting external input but never created the actual CloudFront Origin Access Identity resource causing deployment to fail without manual AWS Console intervention.
```