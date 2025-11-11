# ECS Fargate Microservices Architecture

Hey! We need to build out a containerized microservices infrastructure using **Pulumi with TypeScript**.

## Background

A streaming analytics company needs to containerize their real-time data processing pipeline. The pipeline consists of multiple microservices that consume from Kinesis Data Streams alternatives and must handle variable workloads throughout the day. They've chosen ECS Fargate for its serverless container management capabilities.

## Infrastructure Requirements

Create a Pulumi TypeScript program to deploy a containerized microservices architecture on AWS ECS Fargate. The configuration must:

1. Create a VPC with 2 public and 2 private subnets across 2 AZs with NAT gateways
2. Set up an ECS cluster with Fargate capacity providers
3. Deploy 3 microservices (api-service, worker-service, scheduler-service) as separate ECS services
4. Configure an Application Load Balancer with path-based routing (/api/*, /worker/*, /scheduler/*)
5. Create ECR repositories for each service with lifecycle rules to keep only the last 10 images
6. Define task definitions with 512 CPU units and 1GB memory for each service
7. Implement auto-scaling policies triggered at 70% CPU utilization
8. Set up CloudWatch log groups with 7-day retention for container logs
9. Create IAM roles with least-privilege permissions for task execution
10. Configure security groups allowing only necessary traffic between components
11. Output the ALB DNS name and ECR repository URLs

## Technical Details

Production-grade container orchestration infrastructure in eu-central-1  using ECS Fargate for serverless container management, Application Load Balancer for traffic distribution, ECR for container registry, and CloudWatch for monitoring. Requires Pulumi CLI 3.x with TypeScript, Node.js 16+, Docker installed for local builds. VPC spans 2 availability zones with public subnets for ALB and private subnets for ECS tasks. NAT gateways enable outbound internet access for containers. RDS PostgreSQL in private subnet for persistent storage.

## Special Requirements

- Use ECS Fargate launch type exclusively - no EC2 instances
- Implement auto-scaling based on CPU utilization with min 2 and max 10 tasks
- Configure health checks with 30-second intervals and 3 retry attempts
- Use Application Load Balancer with path-based routing for different services
- Store container images in ECR with lifecycle policies for cost optimization
- Implement CloudWatch Container Insights for monitoring
- Use AWS Secrets Manager for database credentials and API keys

## Expected Output

A fully functional ECS Fargate cluster running three containerized services accessible through an Application Load Balancer. The infrastructure should handle traffic spikes through auto-scaling and provide detailed monitoring through CloudWatch Container Insights.