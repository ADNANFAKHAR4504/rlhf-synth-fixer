# Task: Cloud Environment Setup - Highly Available Web Application Infrastructure

## Requirements

Your team is tasked with deploying a highly available and scalable web application infrastructure on AWS using **Pulumi with TypeScript**. The requirements are as follows:

1. You must create a new Virtual Private Cloud (VPC) for isolation with CIDR block 10.0.0.0/16.
2. The VPC should support at least 2 public subnets and 2 private subnets spread across two availability zones.
3. Deploy application servers in an Auto Scaling group across the public subnets to ensure redundancy and high availability. Configure Elastic Load Balancing (ELB) to distribute incoming traffic among these servers.
4. Use RDS for database solutions located in the private subnets, ensuring it's not directly accessible from the Internet.
5. Attach necessary IAM roles and policies to all components to comply with security best practices.
6. Implement monitoring using CloudWatch to track application performance and set up alerts for key metrics.
7. Static assets for the application must be hosted on S3, with the buckets designed for public access.
8. Validate the entire architecture by creating a Pulumi TypeScript program.

## Platform & Language

- **Platform**: Pulumi
- **Language**: TypeScript
- **Region**: us-east-1
- **Naming Convention**: prod-<resource_name> for all resource names

## Expected Output

Provide a complete Pulumi TypeScript program that, when deployed, meets the above requirements. Ensure all configurations are correctly defined and that the template can be reused across different environments with minimal changes.

## Constraints

- Use AWS as the cloud service provider
- Deploy all resources in the us-east-1 region
- The VPC must have at least 2 public and 2 private subnets
- Leverage Auto Scaling groups for application servers to ensure high availability
- Implement an Elastic Load Balancer to distribute incoming traffic
- Utilize an RDS instance for database management, ensuring it is deployed in a private subnet
- Ensure all resources have appropriate IAM roles and policies attached
- Implement CloudWatch Logs for monitoring and alerting on application metrics
- Use S3 buckets for static asset storage, ensuring they are publicly accessible

## Context

The setup must use the us-east-1 AWS region. Naming conventions should follow the pattern prod-<resource_name> for all resource names.

AWS CloudFormation allows you to model and set up your Amazon Web Services resources so that you can spend less time managing those resources and more time focusing on your applications that run in AWS.

## Architecture Overview

This task involves deploying an AWS-based web application environment. The infrastructure should be highly available, scalable, and secure, utilizing core AWS services like VPC, EC2, RDS, S3, IAM, and CloudWatch.

## Success Criteria

The Pulumi program should:
1. Create a well-architected, highly available infrastructure
2. Follow AWS best practices for security and scalability
3. Be deployable without errors
4. Include proper resource tagging and organization
5. Implement monitoring and alerting
6. Provide clear outputs for key infrastructure components