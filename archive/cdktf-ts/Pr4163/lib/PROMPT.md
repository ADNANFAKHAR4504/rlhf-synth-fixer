Generate a production-ready AWS CDKTF TypeScript project that provisions a multi-AZ AWS infrastructure in us-east-1 region. Output ONLY TWO FILES: lib/tap-stack.ts and lib/modules.ts. Build a highly available and secure AWS environment using AWS CDKTF (TypeScript) with CloudFormation underneath.  

Architecture components: VPC, Subnets, Internet Gateway, NAT Gateway, Route Tables, Application Load Balancer (ALB), Auto Scaling Group (ASG), EC2 instances, IAM roles, Security Groups, SQS, Lambda (inline), CloudWatch Alarms, and SSM Parameter Store.  

REQUIREMENTS:  

VPC and Networking: 

Create a VPC with CIDR block 10.0.0.0/16.  
Include two public and two private subnets across different AZs.  
Attach an Internet Gateway and NAT Gateway for connectivity.  
Configure route tables for both public and private subnets.  

Compute and Scaling  :

Deploy an Auto Scaling Group (ASG) with at least 2 EC2 instances in private subnets.  
Use an IAM Role that grants S3 read-only access to EC2 instances.  
Associate the ALB with public subnets to route HTTP traffic to private EC2 instances.  
The Application Load Balancer (ALB) must forward traffic to EC2 instances in the ASG.  

Security : 

Create a Security Group for the ALB that allows inbound HTTP (port 80) from anywhere.  
Create a Security Group for EC2 instances that allows inbound traffic only from the ALB SG.  
Ensure least-privilege IAM roles for all components.  

Asynchronous Processing:  

Create an SQS queue for handling asynchronous tasks.  
Deploy a Lambda function (with inline TypeScript code) that processes messages from the SQS queue.  
Grant Lambda minimal IAM permissions to poll SQS messages.  

Monitoring and Management:

Configure CloudWatch Alarms to monitor EC2 CPU usage.  
Create CloudWatch Log Groups for Lambda and ALB access logs.  
Store any environment variables in AWS SSM Parameter Store (not Secrets Manager).  