environment_suffix = "synth101000886"
aws_region         = "us-east-1"

# DMS Configuration - using placeholder for testing
dms_source_endpoint = "placeholder-onprem-db.example.com"

# Route53 Configuration
route53_zone_name = "synth101000886.example.com"

# Migration starts at 0% to AWS
aws_weighted_routing_weight = 0
