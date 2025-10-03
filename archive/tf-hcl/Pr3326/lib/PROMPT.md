You are tasked with designing and deploying a secure, highly-available, and globally distributed web application infrastructure for a media streaming platform using Terraform. The platform must support 25,000 concurrent users with low-latency content delivery and geographic distribution. The infrastructure specification requires:
	•	A VPC in us-east-1 with CIDR block 10.11.0.0/16
	•	Public and private subnets across multiple availability zones
	•	An Application Load Balancer with listener rules for routing
	•	An Auto Scaling Group using m5.large instances, scaling dynamically based on custom CloudWatch metrics
	•	CloudFront distribution with multiple origins (S3 and ALB)
	•	S3 buckets for video storage configured with Intelligent-Tiering and Transfer Acceleration enabled
	•	AWS Elemental MediaConvert for video transcoding
	•	Lambda@Edge for request routing and A/B testing
	•	Amazon Route 53 with latency-based routing policies
	•	AWS WAF with rate limiting rules
	•	AWS Shield Standard for DDoS protection
	•	Amazon CloudWatch with custom metrics, alarms, and logging
	•	AWS Systems Manager for configuration management and parameter storage

Additional requirements:
	•	Implement geo-restriction in CloudFront
	•	Define caching strategies with TTL policies
	•	Ensure all resources are parameterized (no hardcoded values) and managed as Infrastructure as Code