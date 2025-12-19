Can you help in fixing the below errors, with minimal code changes  and provide the fixed code snippet
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
