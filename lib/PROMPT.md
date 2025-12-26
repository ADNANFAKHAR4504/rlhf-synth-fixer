Design a production-grade CloudFormation template to deploy a multi-tier web application for a financial services startup. CloudFront distributes content globally by connecting to an Application Load Balancer that routes traffic to ECS Fargate containers running across three Availability Zones. ECS tasks connect to an RDS Aurora MySQL cluster for database operations and retrieve credentials from AWS Secrets Manager at runtime.

The infrastructure uses a custom VPC with public and private subnets. Public subnets host the ALB and NAT Gateways, while private subnets contain the RDS cluster and ECS tasks. The ALB performs health checks every 15 seconds on ECS targets and routes requests based on URL paths to different microservices. CloudFront enforces HTTPS-only access with TLS 1.2 minimum and uses an ACM certificate. S3 stores static assets that CloudFront serves with KMS encryption enabled.

For blue-green deployments, Route53 uses weighted routing to shift traffic between environments. ECS services scale automatically based on CPU and memory metrics sent to CloudWatch. CloudWatch Container Insights collects logs and metrics from both ECS and RDS. The RDS cluster uses SSL/TLS for database connections and has automated backups with point-in-time recovery.

IAM roles restrict each service to its required operations following least privilege. The template outputs the ECS cluster name, ALB DNS name, CloudFront domain, Route53 record set, and RDS endpoint. It supports parameterized environment names for deployment across dev, staging, and prod with consistent naming.

The final CloudFormation YAML template is production-ready and integrates with CI/CD pipelines for automated deployment with zero downtime.
