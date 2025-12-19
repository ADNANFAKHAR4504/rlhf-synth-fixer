I need help setting up a microservices infrastructure on AWS. We're working with a financial services application that has three services: payment-api, fraud-detection, and notification-service. Each one needs to run in containers on ECS Fargate.

The main requirement is to keep things simple and reliable. We've had issues with deployments failing before, so we want to avoid anything too complex. No service mesh, no complicated networking - just the basics that work.

Here's what we need:

1. An ECS cluster running on Fargate. We want to keep it simple, so no Container Insights for now.

2. Three microservices, each running as a single task:
   - payment-api
   - fraud-detection  
   - notification-service
   
   Each service should use 0.25 vCPU and 512MB of memory. They'll run nginx containers for now. We want them in public subnets with public IPs so they can pull images easily.

3. An Application Load Balancer that routes traffic based on paths:
   - /api/payments/* goes to payment-api
   - /api/fraud/* goes to fraud-detection
   - /api/notify/* goes to notification-service

4. We need to use lenient deployment settings to prevent those "NotStabilized" errors we keep seeing. Set minHealthyPercent to 0 and maxHealthyPercent to 200. Also disable circuit breaker rollback.

5. Health checks should be forgiving - we don't want services marked unhealthy too quickly. Use path "/" and accept any status code from 200 to 499.

6. CloudWatch dashboards to monitor CPU, memory, network traffic, and task counts for each service.

7. Each service needs its own IAM roles with least privilege.

8. No container-level health checks - we've seen those cause deployment issues.

The infrastructure should be in us-east-1, across 2 availability zones. We only need public subnets - no NAT gateways or private subnets to keep networking simple.

The stack should output the ALB DNS name, CloudWatch dashboard URL, and cluster name so we can access everything after deployment.

Please use AWS CDK v2 with TypeScript. We need two files: the main entry point and the stack definition.
