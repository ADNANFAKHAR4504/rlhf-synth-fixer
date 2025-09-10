Design and implement a secure, production-ready web application infrastructure on AWS using CloudFormation with the AWS Cloud Development Kit (CDK) in TypeScript. The infrastructure must follow AWS best practices for security, compliance, and high availability while supporting automated deployments.

The entire solution must be defined within a single CDK stack file to ensure simplicity, maintainability, and easier deployment.

The environment should include:

    1.	IAM Roles and Policies – Apply the principle of least privilege for all services and ensure EC2 instances use instance profiles for secure access.
    2.	Networking – Build a VPC with at least two public and two private subnets spread across multiple availability zones. Configure security groups to allow only inbound HTTP (port 80) and HTTPS (port 443) traffic from defined IP ranges.
    3.	Compute and Scaling – Deploy an Auto Scaling Group with a minimum of two EC2 instances and a maximum of six, fronted by an Elastic Load Balancer (ELB) for distributing inbound traffic. Enable detailed monitoring on EC2 instances.
    4.	Database – Configure Amazon RDS with multi-AZ deployments for high availability. Ensure automated backups are enabled, and that data is encrypted at rest and in transit.
    5.	Storage and Logging – Ensure all S3 buckets are private with server-side encryption enabled. Enable CloudTrail for auditing account activities, VPC Flow Logs for network visibility, and ELB access logs for traffic analysis. Centralize all logs for easier monitoring and compliance.
    6.	Security Controls – Integrate AWS WAF to protect against common attacks such as SQL injection and XSS. Use AWS KMS to manage encryption keys across all resources.
    7.	Monitoring and Compliance – Use CloudWatch for detailed monitoring and alarms (e.g., CPU utilization). Configure AWS Config rules to continuously evaluate resource compliance, and implement a Lambda function to automatically remediate non-compliant resources.
    8.	Encryption – Enforce TLS 1.2 or higher for all data in transit.
    9.	Automation and Validation – The CDK stack must support automated creation and updates without manual intervention and should pass all defined tests in the deployment pipeline.

Expected Output:
A complete single TypeScript CDK stack file that defines a CloudFormation stack meeting these requirements. The solution must be secure, scalable, and replicable in any AWS account and region, with clear documentation for deployment and troubleshooting.
