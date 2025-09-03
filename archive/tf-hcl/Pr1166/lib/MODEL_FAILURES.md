Flaw - 1

│ Error: creating S3 Bucket (devFinancialServicesct1pvjxd9a): operation error S3: CreateBucket, https response error StatusCode: 400, RequestID: EMM67T8W65SA3B8A, HostID: pHYWYXj51sczmVooiZbZ5Qv8K7EhrE2cBU7y/INBsUNuTMOnDre9wuTuAmvbmOd7fdOBg0yVBZo=, api error InvalidBucketName: The specified bucket is not valid.
│ 
│   with aws_s3_bucket.cloudtrail,
│   on main.tf line 218, in resource "aws_s3_bucket" "cloudtrail":
│  218: resource "aws_s3_bucket" "cloudtrail" {
│ 
╵
╷
│ Error: creating S3 Bucket (devFinancialServicesappu3wt90ee): operation error S3: CreateBucket, https response error StatusCode: 400, RequestID: EMMFJX7TJV9XVPWY, HostID: yWNIDlSf/BlowKNEqH3yPKgm4uhWaMWIVgD/kBo4GMe6EysokhEhF05eszzfykYRghKuNGFC7ss=, api error InvalidBucketName: The specified bucket is not valid.
│ 
│   with aws_s3_bucket.app_data,
│   on main.tf line 314, in resource "aws_s3_bucket" "app_data":
│  314: resource "aws_s3_bucket" "app_data" {

Flaw 2

│   with aws_s3_bucket.cloudtrail,
│   on main.tf line 218, in resource "aws_s3_bucket" "cloudtrail":
│  218: resource "aws_s3_bucket" "cloudtrail" {
│ 
╵
╷
│ Error: creating S3 Bucket (devFinancialServicesappdatau3wt90ee): operation error S3: CreateBucket, https response error StatusCode: 400, RequestID: 7XY5TJ0FBHFZHWCN, HostID: Aemgbe0fhyWgYw6NcJeOtUY24T17qOFJsKtMAk9s/kWjr2DVDP/Z3XyqsbV3kSXVSZo5nyHi5dM=, api error InvalidBucketName: The specified bucket is not valid.
│ 
│   with aws_s3_bucket.app_data,
│   on main.tf line 314, in resource "aws_s3_bucket" "app_data":
│  314: resource "aws_s3_bucket" "app_data" {

Flaw - 3

   with aws_s3_bucket.app_data,
│   on main.tf line 314, in resource "aws_s3_bucket" "app_data":
│  314: resource "aws_s3_bucket" "app_data" {
│ 
╵
╷
│ Error: creating S3 Bucket (devs3-bucket-dev) Lifecycle Configuration
│ 
│   with aws_s3_bucket_lifecycle_configuration.this,
│   on main.tf line 377, in resource "aws_s3_bucket_lifecycle_configuration" "this":
│  377: resource "aws_s3_bucket_lifecycle_configuration" "this" {
│ 
│ operation error S3: PutBucketLifecycleConfiguration, https response error StatusCode: 400, RequestID:
│ TETRTH0TPEF27X8A, HostID:
│ qzA2Cz46Ec9RqbdbP5B5R5KdSH2hLHALDePP70I+1N+Svz8kGXZnK8rXtfF9mii9YanGMDrnlc+g4iIw+GPUAZPmU1yVzoG6Pzfny+kxW/4=, api
│ error InvalidArgument: 'NoncurrentDays' in the NoncurrentVersionExpiration action for filter '(prefix=)' must be
│ greater than 'NoncurrentDays' in the NoncurrentVersionTransition action
