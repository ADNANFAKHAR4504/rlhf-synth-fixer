We’re designing a production-grade AWS CDK (TypeScript) application for a fintech startup deploying a high-performance payment processing web platform. The system needs to sustain up to 50,000 concurrent users, so every component must emphasize scalability, security, and availability.

The infrastructure should center around an ECS Fargate-based architecture running both the frontend (React + nginx) and backend (Node.js) services as separate ECS services, each defined in distinct task definitions. These services should automatically scale between 3 and 20 tasks based on CPU and memory utilization, ensuring consistent responsiveness under varying loads. All containers must reference versioned images only (no “latest” tags) and enable AWS X-Ray for distributed tracing.

A multi-AZ VPC spanning three availability zones will serve as the foundation. It should contain public subnets for the Application Load Balancer (ALB) and private subnets for ECS tasks and the Aurora PostgreSQL database. NAT Gateways will provide outbound internet access for private workloads.

The Application Load Balancer should manage path-based routing — all traffic under /api/\* goes to the backend, while / routes to the frontend. The ALB will terminate SSL/TLS using an ACM certificate associated with a custom domain, and health checks should occur every 30 seconds, marking targets unhealthy after three consecutive failures.

For data persistence, deploy an Aurora PostgreSQL cluster with encryption at rest via a customer-managed KMS key, configured for multi-AZ redundancy and read replicas. Enable automated backups every six hours and generate database credentials dynamically via AWS Secrets Manager, which ECS tasks will access securely through IAM roles granted with least privilege.

Static assets will be hosted on S3, served globally through CloudFront, which must use Origin Access Identity (OAI) to securely access the private S3 bucket. The CloudFront distribution will be linked to the same custom domain used by the ALB.

Add CloudWatch alarms to proactively monitor system health and performance:

ECS CPU utilization > 80%

RDS connections > 90%

ALB target health failures

Every resource in the stack should include the standard tags:
Environment, Project, and CostCenter.

In summary, create a single CDK application in TypeScript (AWS CDK v2) that deploys this complete infrastructure — ECS Fargate, ALB, Aurora PostgreSQL, S3 + CloudFront, IAM roles, and CloudWatch monitoring — ensuring all security, compliance, and scalability constraints are met.

Expected Output:
A fully functional CDK application that provisions this infrastructure, ready for production deployment with correct networking, IAM, security, and scaling configurations.
