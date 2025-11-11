Create a fully functional, and complete AWS CloudFormation YAML template to deploy an containerized fintech microservices application on Amazon ECS (Fargate). The goal is to build a productionready highly available environment in one region, spanning 3 Availability Zones.

Infrastructure requirements:

VPC and Networking:

VPC with public subnets for the ALB and private subnets for ECS tasks.

NAT Gateways in each AZ for outbound access.

All ECS tasks use awsvpc network mode and run in private subnets.

ECS Cluster:

Use caapacity providers for Fargate (80%) and Fargate Spot (20%.

Enable Container Insights for monitoring.

ECS Services:

api-service (min 2  max 10 tasks)

worker-service (min 1, max 5 tasks)

scheduler-service (fixed 1 task, optional)

Each service must have its own target group and ALB listener rule (path based: /api/*, /admin/*, /webhooks/*).

Health checks on /health every 30 seconds.

auto scale based on CPU utilization (target 70%).

Internal service discovery via AWS Cloud Map.

Task Definitions:

Fargate launch type only, non-root (UID 1000) containers.

Environment variables from SSM Parameter Store.

Use awslogs driver with service specific log groups in cloudWatch

Resource limits:

API: 1 vCPU, 2GB

Worker: 2 vCPU, 4GB

Scheduler: 0.5 vCPU, 1GB

IAM roels:

Execution role - minimal ECR access.

Task role - restricted S3 + DynamoDB access.

Load Balancer:

Application Load Balancer with HTTPS listener using ACM certificate.

Public subnets for ALB; pathbased routing to each ECS service.

Monitoring and Logging:

Enable Container Insights and CloudWatch Logs for all tasks.

creaet CloudWatch alarms for task failures and high CPU utilization.

Parameters n Outputs:

Parameters for VPC ID, subnet IDs, container image URIs, SSM parameter names, and ACM certificate ARN.

Outputs: ALB DNS name, ECS Cluster name, and service ARNs.

Output a single, production ready cloudFormation YAML template defining all ECS networking IAM scaling monitoring and any other resources and outputs.

Make sure that the script is in a single file and stack