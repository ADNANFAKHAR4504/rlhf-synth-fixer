Below is the prompt that was used to generate the model
```
Role: You are an expert AWS Cloud Engineer specializing in security and Infrastructure as Code (IaC). You are proficient in creating secure, scalable, and production-ready AWS environments using CloudFormation.

Objective: Generate a single, complete, and well-commented CloudFormation template in YAML format to deploy and secure a multi-tier web application. The infrastructure must be provisioned in the us-west-2 region and named according to the project IaC-AWS-Nova-Model-Breaking.

Your template must be built with a security-first approach and satisfy all the requirements detailed below.

Core Infrastructure & Security Requirements
Your CloudFormation template must provision resources that meet the following 11 security mandates:

VPC and Network Isolation:

Create a dedicated VPC (10.0.0.0/16).

Establish a multi-tier subnet architecture across two Availability Zones for high availability:

Public Subnets: For internet-facing resources like the Application Load Balancer.

Private App Subnets: For EC2 instances hosting the application tier.

Private Data Subnets: For the RDS database instance.

Configure NAT Gateways in the public subnets to allow outbound internet access from private subnets.

IAM Role for Tag-Based S3 Access:

Create an S3 bucket for application data.

Define an IAM Role for the application's EC2 instances.

This role's IAM policy must grant s3:GetObject and s3:PutObject permissions only if the requesting EC2 instance has the specific tag: {'Key': 'S3Access', 'Value': 'Approved'}.

Application and Database Security Groups:

Web Security Group: Attached to EC2 instances. It must only allow inbound traffic on port 443 from the Application Load Balancer and inbound SSH traffic on port 22 from a predefined CIDR block (use a parameter for this IP).

Database Security Group: Attached to the RDS instance. It must only allow inbound traffic on the database port (e.g., 3306) exclusively from the Web Security Group.

Data Encryption in Transit (SSL/TLS):

Provision an RDS for MySQL database instance.

Create an RDS Parameter Group that enforces SSL/TLS connections by setting the require_secure_transport parameter to ON. Associate this parameter group with the RDS instance.

AWS WAF Integration:

Provision an Application Load Balancer (ALB).

Create an AWS WAFv2 WebACL.

Associate the WebACL with the ALB.

Configure the WebACL to use the following AWS Managed Rule Groups to protect against the OWASP Top 10: AWSManagedRulesCommonRuleSet and AWSManagedRulesSQLiRuleSet.

API Gateway Logging:

Provision a sample REST API Gateway.

Enable and configure access and execution logging for the API Gateway stage, directing all logs to a dedicated Log Group.

Automated Security Patching via Lambda:

Create an IAM Role for a Lambda function granting it ssm:SendCommand permissions.

Define a Lambda function that uses this role to execute the AWS-RunPatchBaseline SSM document on all EC2 instances tagged with {'Key': 'PatchGroup', 'Value': 'WebApp'}.

Create an Amazon EventBridge (Events) rule to trigger this Lambda function on a weekly schedule (e.g., cron(0 2 ? * SUN *)).

Secure Credential Management:

Implement AWS Secrets Manager to store the RDS database credentials (username and password).

The IAM instance profile for the EC2 instances must have a policy granting secretsmanager:GetSecretValue permission to retrieve this specific secret.

Ensure the trail logs management and data events and securely stores these logs in a dedicated, non-public S3 bucket with logging enabled.

Real-time Monitoring and Alarms:

Configure the alarm to send a notification to an SNS topic.

Expected Output Format
Generate a single, complete CloudFormation template in YAML.

The template must be thoroughly commented. Add comments (#) to explain the purpose of each parameter, resource, and logical section.

At the very end of the YAML file, include a commented-out section titled --- # VERIFICATION STEPS. In this block, provide the specific AWS CLI commands a user would run to verify that each of the 11 security requirements has been correctly implemented post-deployment. This serves as the "test" to prove the configurations are active.
```