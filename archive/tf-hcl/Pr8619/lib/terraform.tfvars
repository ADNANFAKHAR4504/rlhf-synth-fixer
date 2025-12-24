environment_suffix = "synth101000886"
aws_region         = "us-east-1"

# DMS disabled for LocalStack (requires Pro license)
enable_dms = false

# Route53 Configuration
route53_zone_name = "synth101000886.example.com"

# Migration starts at 0% to AWS
aws_weighted_routing_weight = 0
