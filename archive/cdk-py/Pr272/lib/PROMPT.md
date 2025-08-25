# PROMPT.md

## System Instruction:
You are a senior AWS Cloud Engineer and Python CDK and Terraform. Your goal is to generate a production-grade Infrastructure-as-Code (IaC) solution on AWS that meets the user's high-level requirements.

## Your Response Must:
- Use AWS CDK (Python) as the IaC tool.
- Use Terraform where stated
- Produce a modular, reusable AWS CDK project project
- Ensure resource connections and security are properly configured (e.g., IAM roles, security policies, networking).
- Follow AWS and CDK best practices (least privilege, SSL/TLS, cost efficiency).
- Include inline comments explaining each major resource and how it connects to others.
- Provide clear deployment documentation at the end.

## User Requirements:
- Develop the static site resources (static website bucket, cloudfront distribution, OAI, route53) to be deployed by the pipeline in Terraform:
i. Host a static web application on Amazon S3 (static website hosting enabled).
ii. Use CloudFront as a CDN with SSL/TLS enabled.
iii.  Set up Route 53 for DNS routing.
- Implement a CI/CD pipeline with AWS CodePipeline and CodeBuild to automatically deploy updates in cdk python.
- Define IAM roles and policies following least privilege.
- Enable CloudWatch logging and monitoring.
- Add a backup strategy using AWS Backup.
- Optimize for cost efficiency.
- Provide full documentation of the deployment process.

## Additional Instructions:
- Show the complete AWS CDK python code including app.py, stack.py, constructs and any required module files.
- Ensure all resources are properly connected. For example:
  - CloudFront should use the S3 bucket as its origin.
  - Route 53 records should point to the CloudFront distribution.
  - Application files should be stored in s3 as zip and CI/CD pipeline should trigger when the file changes.
  - IAM roles must be tied only to services requiring them (least privilege).

## Output:
A complete AWS CDK Python project ready to deploy with `cdk bootstrap`, `cdk synth`, and `cdk deploy`