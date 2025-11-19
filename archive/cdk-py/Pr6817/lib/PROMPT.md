# Infrastructure Requirements

## Task Description
Create a CDK Python program to deploy a containerized microservices architecture for a trading analytics platform. The configuration must: 1. Define an ECS cluster with capacity providers for both Fargate and Fargate Spot. 2. Create three microservices (data-ingestion, analytics-engine, api-gateway) each with its own ECS service definition. 3. Configure AWS App Mesh with virtual nodes for each service and virtual routers for traffic distribution. 4. Set up ECR repositories with image scanning on push and lifecycle policies to retain only the last 10 images. 5. Implement auto-scaling for each service with target tracking policies on CPU and memory metrics. 6. Create an Application Load Balancer with path-based routing to the api-gateway service. 7. Configure AWS Cloud Map namespace for service discovery within the VPC. 8. Define IAM task execution and task roles with least-privilege permissions. 9. Set up CloudWatch Log Groups with metric filters for error tracking. 10. Create Secrets Manager secrets for database endpoints and rotate them every 90 days. 11. Configure App Mesh retry policies with exponential backoff for resilience. 12. Implement health checks for both ALB target groups and ECS service definitions. Expected output: A fully functional CDK stack that deploys the complete container orchestration infrastructure with all services running in Fargate, accessible through the ALB, with service mesh traffic management and comprehensive monitoring.

## Scenario
A financial services company needs to deploy a microservices-based trading analytics platform. The system processes real-time market data through multiple containerized services that must communicate securely and scale independently based on load.

## Environment Details
Multi-AZ container orchestration environment in us-east-1 region using Amazon ECS with AWS Fargate for serverless container execution. Infrastructure includes App Mesh service mesh for traffic management, ECR for container registry, CloudWatch for monitoring, and Secrets Manager for credentials. VPC spans 3 AZs with private subnets for ECS tasks and public subnets for ALB. NAT Gateways provide outbound internet access. Requires AWS CDK 2.x with Python 3.9+, Docker for local testing, and AWS CLI configured with appropriate permissions.

## Technical Constraints
- Container images must be stored in private ECR repositories with vulnerability scanning enabled
- Implement blue-green deployment strategy using ECS deployment configuration
- Use AWS Service Discovery for internal service name resolution
- Service-to-service communication must use AWS App Mesh with mTLS encryption
- ECS services must use Fargate Spot instances for cost optimization
- Container logs must be sent to CloudWatch Logs with 30-day retention
- Implement circuit breaker pattern using App Mesh retry policies
- Deploy across 3 availability zones for high availability
- Use AWS Secrets Manager for database credentials and API keys
- Each microservice must have its own auto-scaling policy based on custom CloudWatch metrics
