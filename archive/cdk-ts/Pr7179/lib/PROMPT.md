Create an AWS CDK v2 TypeScript application for a production deployment in us-east-1.

Provision a VPC across 3 Availability Zones, with public subnets for the ALB and private subnets for ECS Fargate tasks.

Create an ECS Cluster using Fargate.

Deploy two mandatory microservices: payment-api and fraud-detector (optional: transaction-api).

Each service must run 2 desired tasks on Fargate.

Configure an Application Load Balancer with path-based routing:

/payments → payment-api

/fraud → fraud-detector

/transactions → transaction-api (only if included)

Create ECR repositories for each service with image scanning on push.

Integrate AWS App Mesh with a mesh, virtual nodes, virtual routers, and virtual services for each microservice.

Configure auto-scaling for each service with:

Min tasks: 2

Max tasks: 10

CPU target: 70%

Set up CloudWatch Log Groups for all containers with 30-day retention.

Use AWS Secrets Manager for database URLs and API keys, and inject these secrets into task definitions.

Define security groups that restrict traffic to only necessary inter-service communication.

Implement container health checks with 30-second intervals and an unhealthy threshold of 3.

The final output must be a complete CDK application that deploys the ECS cluster, microservices, ALB, App Mesh, logging, secrets, scaling, and security configurations.