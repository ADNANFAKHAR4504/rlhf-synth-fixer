Hey, we need help setting up infrastructure for a university learning management system. The university needs to deploy their LMS application that's already containerized, and they have strict requirements around student data security because of FERPA compliance.

Here's what we need to build using CDKTF with TypeScript:

The application runs as containers and needs to be deployed on ECS using Fargate. We need a PostgreSQL database to store student records, grades, and course information. All database credentials should be managed through AWS Secrets Manager with automatic rotation every 30 days.

For networking, we'll need a proper VPC setup with public and private subnets. The application should be accessible through an Application Load Balancer that distributes traffic to the ECS tasks running in private subnets.

Security is really important here. The RDS instance must have encryption at rest enabled, and we should use SSL/TLS for database connections. Since this is a production university system, it needs to be highly available.

A few specific requirements:
- Use ECS Fargate for running the containerized LMS application
- Set up RDS PostgreSQL for the database with encryption
- Store database credentials in Secrets Manager with 30-day rotation
- Configure an ALB to handle incoming traffic
- Make sure the RDS instance is not publicly accessible
- Use appropriate CPU and memory allocations for the ECS tasks

The infrastructure should be deployed to us-east-1. Make sure to use the environmentSuffix parameter for naming resources so we can deploy multiple environments. Keep the setup straightforward but production-ready.

Can you generate the infrastructure code with one code block per file?
