I'm working on a CloudFormation template for a high availability web application that needs to be really robust. We're targeting us-east-1 and need something that can handle zone failures gracefully.

What I'm looking to build:

The networking foundation should be a new VPC spread across multiple AZs with the usual public/private subnet setup for proper isolation. For the web layer, I want an Auto Scaling Group that can spin up EC2 instances across different zones based on CPU metrics - nothing too fancy, just solid autoscaling.

Database-wise, we need a Multi-AZ RDS setup so we get automatic failover if something goes wrong. The storage piece is an S3 bucket with cross-region replication turned on for extra redundancy, and it needs to be encrypted with KMS.

For DNS, I'm planning to use Route 53 with health checks and failover routing so traffic automatically goes to healthy endpoints when there are issues.

Security requirements include WAF protection for web traffic filtering and IAM roles that follow least privilege - no overly broad permissions.

The whole thing needs to survive an entire AZ going down, which is why I'm focusing on multi-AZ deployment. I'd also like to integrate Systems Manager for some automation around failover scenarios.

Monitoring is important too - CloudWatch alarms and dashboards to keep an eye on CPU utilization, instance health, and other critical metrics that would indicate problems.

Looking for a complete CloudFormation YAML template that covers all this. The architecture should be solid enough for production use and handle the common failure scenarios we might see in AWS.
