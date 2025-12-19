There were few below issues in the model response-

1. S3 buckets need to follow the lower case in AWS, but model intially provided the wrong bucket name.
Fix - 
```
bucket_names = {
  us_east_1      = "${lower(var.project_name)}-${lower(var.environment)}-bucket-us-east-1"
  eu_west_1      = "${lower(var.project_name)}-${lower(var.environment)}-bucket-eu-west-1"
  ap_southeast_1 = "${lower(var.project_name)}-${lower(var.environment)}-bucket-ap-southeast-1"
}
```

2. Second issue was related to the bucket versioning and below was the fix applied-
```
resource "aws_s3_bucket_replication_configuration" "us_to_eu" {
  depends_on = [
    aws_s3_bucket_versioning.us_east_1,     # Source bucket versioning
    aws_s3_bucket_versioning.eu_west_1      # Destination bucket versioning
  ]
  # ...
}

resource "aws_s3_bucket_replication_configuration" "us_to_ap" {
  depends_on = [
    aws_s3_bucket_versioning.us_east_1,     # Source bucket versioning
    aws_s3_bucket_versioning.ap_southeast_1 # Destination bucket versioning
  ]
  # ...
}
```
