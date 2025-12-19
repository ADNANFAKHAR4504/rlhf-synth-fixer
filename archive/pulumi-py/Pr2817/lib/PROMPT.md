# Infrastructure as Code Test Automation Prompts

## Secure Static Website Hosting Solution

You need to build a robust, enterprise-grade static website hosting solution on AWS that can handle production workloads while maintaining the highest security standards. The goal is to create a comprehensive infrastructure that not only serves content efficiently but also protects against various threats and ensures compliance with industry standards.

The solution should provide a secure way to host static websites with global content delivery, implementing multiple layers of security including web application firewalls, geo-blocking capabilities, and comprehensive monitoring. You'll need to set up an S3 bucket for storing website content, configure CloudFront for global distribution, and implement various security measures to protect against common web threats.

The infrastructure must be designed to handle sensitive data and comply with healthcare industry standards, so every component needs to be configured with security best practices in mind. This includes encrypting data both in transit and at rest, implementing proper access controls, and setting up comprehensive logging and monitoring.

Your solution should automatically handle security audits and compliance checks, ensuring that the infrastructure remains secure over time. The system should be able to detect and respond to potential security threats, with automated alerts and monitoring capabilities.

The final infrastructure should be production-ready, cost-optimized, and easily maintainable, with clear documentation and proper tagging for resource management.

## Serverless Application with Lambda and S3 Integration

You need to design and implement a serverless application architecture that automatically processes files as they're uploaded to an S3 bucket. The system should be built for reliability, security, and scalability, handling real-world workloads with proper error handling and monitoring.

The core requirement is to create a Lambda function that springs into action whenever someone uploads a file to a specific S3 bucket. This function needs to run in a secure, isolated environment within your VPC, with access to sensitive configuration data stored securely in AWS Secrets Manager.

The Lambda function should be robust enough to handle various file types and processing scenarios, with adequate memory allocation and timeout settings to ensure it can complete its work without being cut off prematurely. It needs to be written in Python and should include comprehensive error handling to gracefully manage any issues that might arise during execution.

Security is paramount in this design. The Lambda function should only have the minimum permissions necessary to perform its tasks, following the principle of least privilege. All sensitive data should be encrypted and stored securely, with proper access controls in place.

The S3 bucket should be configured with strict access policies, allowing only the Lambda function and authorized users to interact with it. This ensures that your data remains protected while still allowing the automated processing workflow to function correctly.

Monitoring and observability are crucial for maintaining a healthy serverless application. You'll need to set up CloudWatch logging to capture all execution details, and configure alarms to alert you when things go wrong. The system should provide clear visibility into function performance, error rates, and execution patterns.

The entire infrastructure should be defined as code using Pulumi, making it easy to deploy, update, and maintain. All components should be properly connected with the right dependencies, ensuring that resources are created in the correct order and that the system works as intended from the moment it's deployed.

Your solution should be production-ready, with proper error handling, logging, and monitoring capabilities that will help you maintain and troubleshoot the system effectively.

**Expected Output**: Create a single Python file named `tap_stack.py` that contains all the necessary Pulumi code to deploy the complete serverless application infrastructure. This file should be self-contained and ready for deployment with a single `pulumi up` command.
