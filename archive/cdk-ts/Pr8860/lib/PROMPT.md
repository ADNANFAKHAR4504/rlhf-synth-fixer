I need to build a multi-environment infrastructure that supports both production and development environments across three AWS regions: us-east-1, eu-central-1, and ap-southeast-1.

The infrastructure needs two isolated VPCs per region (production and development). Each VPC has public and private subnets across two Availability Zones, with NAT gateways in public subnets routing outbound traffic from private subnets. EC2 instances run in private subnets and connect to an Application Load Balancer in public subnets that performs health checks and distributes incoming traffic. The ALB connects to Auto Scaling Groups that monitor CloudWatch metrics and automatically adjust instance count based on CPU utilization.

For high availability, Route 53 provides failover DNS routing between regions, monitoring ALB health checks and automatically routing traffic to healthy regions when failures are detected. An S3 bucket in the primary region stores static content and uses Cross-Region Replication to automatically sync objects to buckets in secondary regions.

IAM roles grant least-privilege access, with EC2 instance profiles allowing instances to read from Systems Manager Parameter Store for configuration and write logs to CloudWatch. CloudWatch alarms monitor EC2 CPU and memory metrics, triggering SNS notifications when thresholds are exceeded.

Amazon EventBridge Scheduler triggers Lambda functions on configurable schedules for automated maintenance tasks like backups and scaling operations. The Lambda functions assume IAM roles to perform infrastructure operations and send completion status to EventBridge.

VPC Lattice provides service mesh capabilities, creating service networks that span across VPCs and enable secure service-to-service communication. Application services register with VPC Lattice, which handles authentication, authorization, and traffic routing between services across different VPCs without requiring VPC peering or Transit Gateway.

For future extensibility, IAM roles are configured to support Amazon Bedrock AgentCore for AI workload deployment, allowing agents to access AWS services through the VPC endpoints.

Please provide the complete infrastructure code. Each file should be in its own code block so I can copy and paste them directly.