# Web Application Infrastructure Project

I need to build a web application infrastructure that can handle production traffic and scale automatically. The system should be deployed in the us-west-2 region and follow AWS best practices.

## What I'm Building

A web application that needs:
- A VPC with public and private subnets for security
- EC2 instances running in private subnets behind a load balancer
- S3 storage for static files like images, CSS, and JavaScript
- Automatic scaling when traffic increases
- High availability across multiple availability zones

## Technical Requirements

The infrastructure must include:

1. **Network Setup**: VPC with public subnets for the load balancer and private subnets for the application servers
2. **Storage**: S3 bucket for static assets with proper security settings
3. **Compute**: EC2 instances in private subnets that can scale up and down based on demand
4. **Load Balancing**: Application Load Balancer in public subnets to distribute traffic
5. **Security**: IAM roles instead of hardcoded credentials, restrictive security groups
6. **Monitoring**: Basic monitoring and logging setup

## Deployment Details

- **Region**: us-west-2 (required)
- **Technology**: AWS CDK with Java
- **Architecture**: Multi-tier with load balancer, application servers, and storage
- **Scaling**: Auto-scaling based on CPU usage or other metrics

## Expected Deliverable

A working CDK application that:
- Deploys all the required infrastructure
- Connects components properly (load balancer to EC2, S3 for static files)
- Includes proper security configurations
- Can be deployed with `cdk deploy`
- Has clear documentation and comments explaining the design choices

The goal is to create a production-ready infrastructure that follows AWS best practices and can handle real-world traffic patterns.