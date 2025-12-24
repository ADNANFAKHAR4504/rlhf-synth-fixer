Hey team,

We're building a production trading dashboard that needs zero-downtime deployments and strict compliance. The app is Django-based and processes real-time market data, so performance and reliability are critical. I'm setting this up with Terraform in HCL with a complete blue-green deployment capability.

The architecture has three tiers that need to connect together securely. The Application Load Balancer sits in public subnets and routes traffic to ECS Fargate containers running in private subnets. Those containers connect to an Aurora PostgreSQL database also in private subnets. We need WAF protecting the ALB from attacks, and Secrets Manager for rotating database credentials that the containers fetch at runtime.

## What we need

Create a VPC across three availability zones in us-east-1 with public and private subnets. The public subnets host the ALB and NAT gateways. The private subnets host the ECS Fargate tasks and RDS Aurora cluster. Route tables send private subnet traffic through NAT gateways for pulling images from ECR.

Deploy an Application Load Balancer that listens on HTTPS and routes requests to two target groups - one for blue environment and one for green. Configure health checks so the ALB only sends traffic to healthy containers. The ALB connects to ECS services through the target groups based on weighted routing rules we can adjust during deployments.

Set up an ECS cluster with Fargate services using awsvpc networking mode. Create separate task definitions for blue and green environments. The tasks run in private subnets and get assigned security groups that allow inbound from the ALB security group on the application port. The ECS service connects to both target groups and we shift traffic between them by adjusting weights.

Deploy Aurora PostgreSQL as a Multi-AZ cluster in private subnets. The database security group allows inbound connections only from the ECS task security group on port 5432. Enable encrypted storage, automated backups, and IAM authentication. The ECS tasks connect to the database using credentials they fetch from Secrets Manager.

Configure Secrets Manager to store database credentials with automatic rotation enabled. Grant the ECS task execution role permission to read the secrets. The containers fetch the credentials at startup using the IAM role instead of hardcoding them. Secrets Manager rotates the credentials by connecting to the RDS cluster through a Lambda function.

The connectivity flow is: Internet → WAF → ALB in Public Subnets → Blue/Green ECS Tasks in Private Subnets → Aurora PostgreSQL in Private Subnets. For outbound: ECS Tasks → NAT Gateways → Internet for ECR image pulls and external API calls. Secrets flow: ECS Tasks → Secrets Manager → Aurora for credential rotation.

Create WAF web ACL with rules blocking SQL injection and XSS attacks, then associate it with the ALB. The WAF inspects requests before they reach the ALB and drops malicious traffic.

Set up Auto Scaling for the ECS services based on CPU and memory metrics. Configure CloudWatch alarms to monitor ECS task health, database performance, and ALB response times. Create an SNS topic that CloudWatch sends alarm notifications to.

Configure security groups carefully - ALB security group allows inbound HTTPS from anywhere, ECS task security group allows inbound from ALB and outbound to RDS and NAT gateway, RDS security group allows inbound only from ECS tasks. No security group rules should use -1 for all ports.

Use environmentSuffix variable in all resource names. Deploy to us-east-1. Make everything destroyable without retain policies. Export the ALB DNS name, ECS cluster name, database endpoint, and security group IDs as outputs.
