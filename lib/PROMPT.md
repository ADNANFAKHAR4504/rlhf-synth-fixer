Hey team, we need to build a production-grade containerized web app on AWS using CDKTF with TypeScript. The app needs to be super robust and secure, running in us-east-1.

Here's what we're looking for - split the code into two files: modules.ts for reusable components and taps-stack.ts for the main stack. 

For the architecture, we want:

ECS Fargate to run our containers with auto-scaling across multiple AZs

Application Load Balancer to handle traffic distribution

Private PostgreSQL RDS instance with multi-AZ setup for the database

Proper security with Secrets Manager for DB creds, least-privilege IAM roles

Everything encrypted in transit and at rest

Route 53 for DNS management

S3 bucket for static assets

CloudWatch for comprehensive logging and monitoring

Just give us the complete TypeScript code for both files - ready to deploy!