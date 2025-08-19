```
Please write IAC code in cdk python using the data given below:

Contraints:

Ensure all environments are isolated from each other using separate VPCs. | Implement IAM roles and policies to control access to each environment independently. | Configure S3 buckets in each environment with proper versioning and server-side encryption enabled. | All environments should be deployed in the us-east-1 region. | Use cdk python code to create nested stacks to manage dependencies between resources. | Implement an Elastic Load Balancer in each environment with proper health check configuration. | Ensure RDS instances in each environment have automated backups enabled.

Environment:

You are tasked with setting up a consistent multi-environment infrastructure on AWS using cdk python. Your solution must facilitate the use of three separate environments: Development, Staging, and Production. Each environment should be isolated from the others to prevent any cross-environment interference.

Requirements:

1. Each environment must have its own Virtual Private Cloud (VPC).
2. Use IAM roles and policies to restrict access to resources within each environment.
3. Set up S3 buckets for each environment with server-side encryption and versioning enabled.
4. All resources must be deployed in the us-east-1 region.
5. Utilize cdk nested stacks to maintain resource dependencies.
6. Each environment must include an Elastic Load Balancer configured with health checks.
7. Implement RDS instances with automated backups in each environment.

Expected output:

Develop a cdk Python code that fulfills the above requirements. The file should be named 'multi_env_infrastructure.py', and it should deploy successfully in AWS without errors. Validate the setup by ensuring all environments meet the specified constraints and configurations. All resource relationships and dependencies should be correctly represented and managed within the cdk python code.

Proposed Statement:

The target infrastructure environment comprises three distinct environments: Development, Staging, and Production. Each environment should have isolated resources to prevent cross-contamination and should adhere to security best practices while using AWS standards.
```
