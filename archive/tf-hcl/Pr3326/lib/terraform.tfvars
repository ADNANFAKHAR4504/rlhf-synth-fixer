# terraform.tfvars
aws_region = "us-east-1"
vpc_cidr_block = "10.11.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
public_subnet_cidrs = ["10.11.0.0/24", "10.11.1.0/24", "10.11.2.0/24"]
private_subnet_cidrs = ["10.11.10.0/24", "10.11.11.0/24", "10.11.12.0/24"]
instance_type = "m5.large"
asg_min_size = 2
asg_max_size = 10
asg_desired_capacity = 4
domain_name = "example-streaming.com"
s3_bucket_name = "example-streaming-videos"
geo_restrictions = {
  restriction_type = "whitelist"
  locations        = ["US", "CA", "GB", "DE"]
}
ttl_settings = {
  min_ttl     = 0
  default_ttl = 3600
  max_ttl     = 86400
}
waf_rate_limits = [
  {
    name        = "AverageRateLimit"
    priority    = 1
    limit       = 2000
    metric_name = "AverageRateLimit"
  }
]
regions = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]