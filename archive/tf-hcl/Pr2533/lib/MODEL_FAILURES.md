Model failures are listed as below -

1. Model was unable to generate the full response even in 2 Turns so had to created 3 Turns to get the full response of the problem ststement.
2. Model referred to wrong sns topic in secindary region and missed creating the sns related resources in second regiond and created some errors.
3. Model also got s3 bucket replication issues as it was trying to replicate even before the bucket got created.

```
│ Error: creating S3 Bucket (tap-static-content-primary-9b0ctg1c) Replication Configuration: operation error S3: PutBucketReplication, https response error StatusCode: 400, RequestID: 3F5B9R88E37Q0ANX, HostID: XRxzAe4C7IZTND+FPv4HYJXPGtjgHb0S8uRX8STyHyWo1Dfp4Y8NMYzDlRZ2TPQQA1l0ilTpqOU=, api error InvalidRequest: Destination bucket must have versioning enabled.
│ 
│   with aws_s3_bucket_replication_configuration.primary_to_secondary,
│   on tap_stack.tf line 778, in resource "aws_s3_bucket_replication_configuration" "primary_to_secondary":
│  778: resource "aws_s3_bucket_replication_configuration" "primary_to_secondary" {
│ 
╵
╷
│ Error: creating CloudWatch Metric Alarm
│ 
│   with aws_cloudwatch_metric_alarm.secondary_rds_cpu,
│   on tap_stack.tf line 1393, in resource "aws_cloudwatch_metric_alarm" "secondary_rds_cpu":
│ 1393: resource "aws_cloudwatch_metric_alarm" "secondary_rds_cpu" {
│ 
│ ID: tap-rds-cpu-alarm-secondary
│ Cause: operation error CloudWatch: PutMetricAlarm, , api error
│ ValidationError: Invalid region us-east-2 specified. Only us-west-1 is
│ supported."
```
