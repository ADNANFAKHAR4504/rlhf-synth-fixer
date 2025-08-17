# Model Failures Documentation


## Error Categories

### 1. Missing Resource References

#### Error 1.1: Undeclared S3 Bucket Resources

**Problem:** AWS Config delivery channels referenced S3 buckets that were not declared in the Terraform configuration.

```bash
Error: Reference to undeclared resource

  on tap_stack.tf line 764, in resource "aws_config_delivery_channel" "delivery_channel_us_west":
 764:   s3_bucket_name = aws_s3_bucket.config_bucket_us_west.bucket

A managed resource "aws_s3_bucket" "config_bucket_us_west" has not been declared in the root module.
```

```bash
Error: Reference to undeclared resource

  on tap_stack.tf line 770, in resource "aws_config_delivery_channel" "delivery_channel_eu_central":
 770:   s3_bucket_name = aws_s3_bucket.config_bucket_eu_central.bucket

A managed resource "aws_s3_bucket" "config_bucket_eu_central" has not been declared in the root module.
```

**Impact:** 
- Terraform configuration validation failed
- AWS Config setup incomplete for both regions


### 2. IAM Policy Configuration Errors

#### Error 2.1: Incorrect AWS Managed Policy ARN

**Problem:** The IAM policy ARN for AWS Config service role was incorrect.

```bash
Error: attaching IAM Policy (arn:aws:iam::aws:policy/service-role/ConfigRole) to IAM Role (AWSConfigRole-default): operation error IAM: AttachRolePolicy, https response error StatusCode: 404, RequestID: 8041766f-c775-4bc1-ba24-a917a5fc4ebf, NoSuchEntity: Policy arn:aws:iam::aws:policy/service-role/ConfigRole does not exist or is not attachable.

  with aws_iam_role_policy_attachment.config_role_policy,
  on tap_stack.tf line 754, in resource "aws_iam_role_policy_attachment" "config_role_policy":
 754: resource "aws_iam_role_policy_attachment" "config_role_policy" {
```

**Impact:**
- IAM role creation failed
- AWS Config service could not assume the required role

### 3. Resource Dependency and Ordering Issues

#### Error 3.1: Configuration Recorder Unavailable for Delivery Channel

**Problem:** AWS Config delivery channels were being created before the required configuration recorder and S3 permissions were in place.

```bash
Error: putting ConfigService Delivery Channel (SecurityDeliveryChannel-default-us-west-1): operation error Config Service: PutDeliveryChannel, https response error StatusCode: 400, RequestID: ee33d7f6-8127-47d6-80be-d602afb5c03a, NoAvailableConfigurationRecorderException: Configuration recorder is not available to put delivery channel.

  with aws_config_delivery_channel.delivery_channel_us_west,
  on tap_stack.tf line 974, in resource "aws_config_delivery_channel" "delivery_channel_us_west":
 974: resource "aws_config_delivery_channel" "delivery_channel_us_west" {
```

```bash
Error: putting ConfigService Delivery Channel (SecurityDeliveryChannel-default-eu-central-1): operation error Config Service: PutDeliveryChannel, https response error StatusCode: 400, RequestID: bbb8578e-b295-4cdc-9ca5-d193fc7c6bbf, NoAvailableConfigurationRecorderException: Configuration recorder is not available to put delivery channel.

  with aws_config_delivery_channel.delivery_channel_eu_central,
  on tap_stack.tf line 980, in resource "aws_config_delivery_channel" "delivery_channel_eu_central":
 980: resource "aws_config_delivery_channel" "delivery_channel_eu_central" {
```

**Impact:**
- AWS Config service deployment failed
- Compliance monitoring not functional

**Root Cause:**
AWS Config has strict service limits:
- **1 Configuration Recorder per region** (maximum)
- **1 Delivery Channel per region** (maximum)

The error occurred because there were already existing AWS Config resources in the `eu-central-1` region, preventing the creation of new ones.
