# AWS CloudFormation Automated EC2 Backup Solution

## Problem Statement

You are an expert AWS Solutions Architect and a senior developer specializing in Infrastructure as Code (IaC). Your task is to design a complete, automated backup solution for an EC2 instance, generating a single CloudFormation YAML file.

Develop a CloudFormation template for a daily, automated backup solution for a web application running on an EC2 instance. The goal is to back up application data from the EC2 instance to a secure S3 bucket without opening extra ports on the instance or managing SSH keys for the backup process.

The solution must consist of the following integrated components:

1. **EC2 Instance**: An existing web server that generates application data to be backed up. It runs in a VPC and already has a security group allowing HTTPS traffic.
2. **S3 Bucket for Backups**: A secure, private S3 bucket to store the daily backup archives. It must have encryption and access logging enabled.
3. **Automated Trigger**: A daily schedule that kicks off the backup process automatically.
4. **Orchestration**: A serverless function that orchestrates the backup. This function should not directly access the EC2 instance's filesystem. Instead, it will securely instruct the instance to perform the backup itself.

## Constraints

- **Framework:** AWS CloudFormation
- **Language:** YAML
- **Region:** us-east-1
- **Deployment:** Infrastructure as Code with event-driven automation
- **Security:** No additional ports, secure communication via AWS Systems Manager

## Architecture Requirements

Carefully analyze the requirements in the Problem Statement and adhere to all Constraints. The core of this task is to connect these services using a modern, event-driven, and secure pattern.

### 1. Architectural Outline

Before writing code, provide a summary of the proposed architecture inside a `<thinking>` block. **Crucially, explain the end-to-end workflow**:

- An **Amazon EventBridge (CloudWatch Events) Rule** triggers on a daily schedule
- The rule invokes the **AWS Lambda function**
- The Lambda function uses the **AWS Systems Manager (SSM) Run Command** to execute a script on the EC2 instance
- The script on the EC2 instance creates a compressed archive of application data and uploads it directly to the **S3 backup bucket**

### 2. Infrastructure as Code Implementation

Based on this architecture, generate a **single, self-contained CloudFormation template** in YAML.

### 3. Resource Connectivity (Critical)

- **EventBridge to Lambda**: The EventBridge Rule must be configured to target the Lambda function. The Lambda function needs resource-based permissions to be invoked by EventBridge
- **Lambda to SSM**: The Lambda function's IAM Role needs `ssm:SendCommand` permissions. Scope this permission to only allow commands to be run on EC2 instances with a specific tag (e.g., `Backup: Enabled`)
- **SSM to EC2**: The EC2 instance's IAM Role is critical. It needs the `AmazonSSMManagedInstanceCore` policy to be managed by Systems Manager
- **EC2 to S3**: The EC2 instance's IAM Role must also have `s3:PutObject` permissions, restricted to the specific S3 backup bucket

### 4. Security Best Practices

- The S3 backup bucket must have `PublicAccessBlockConfiguration` enabled and server-side encryption configured
- The EC2 security group should **only** allow HTTPS (port 443) as specified. Do not add any ports for the backup process; SSM handles communication securely over its agent
- All IAM Roles must follow the principle of least privilege. The policies should be specific to the resources they interact with (e.g., specify the ARN of the S3 bucket and the Lambda function)

## Expected Output

### Template Requirements

- The entire solution **must** be contained within a single YAML file
- Include a `Description` for the template explaining the automated backup workflow
- Create the `AWS::Events::Rule` with a daily schedule (e.g., `rate(1 day)` or a cron expression)
- For the Lambda function's code, `ZipFile` with inline placeholder code is acceptable. The code's comments should explain that its purpose is to call the SSM `SendCommand` API
- Clearly define both the Lambda's IAM Role and the EC2 instance's IAM Role with the specific permissions outlined in the architecture requirements
- Use `Outputs` to export the name of the S3 backup bucket

## Success Criteria

1. CloudFormation template synthesizes without errors
2. Deployment succeeds in us-east-1 region
3. All security requirements are implemented (encryption, least privilege IAM, no additional ports)
4. Event-driven architecture functions correctly (EventBridge → Lambda → SSM → EC2 → S3)
5. Resources can be destroyed cleanly
6. No security best practices violations
7. Backup process executes successfully on schedule

## Deliverables

- **Complete CloudFormation YAML template** with all required AWS resources
- **Event-driven backup architecture** demonstrating EventBridge to Lambda to SSM to EC2 flow
- **IAM policies** configured with least privilege access
- **Secure S3 bucket** with encryption and access controls
- **Working example** of automated EC2 backup solution
