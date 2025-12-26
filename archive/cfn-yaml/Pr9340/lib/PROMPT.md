Prompt is below:

```
You are an expert AWS Cloud Solutions Architect specializing in Infrastructure as Code using CloudFormation.
Your task is to generate a single, complete, and robust CloudFormation YAML template to provision a scalable and highly available AWS environment for a web application.
The template must define and configure the following AWS resources in the us-east-1 region:

Parameters:
Create input parameters for EnvironmentName, OwnerName, and ProjectName to be used for resource tagging. This makes the template reusable.

S3 Bucket for WebAppAssets:
Purpose: To store static web assets like images, CSS, and JavaScript files that are served through the web application.
Constraint: Must have server-side encryption enabled using an AWS Key Management Service managed key with SSE-KMS.
Integration: The EC2 web server needs access to retrieve assets from this bucket.

EC2 Instance for WebAppServer:
Purpose: To host the main web application that connects to the RDS database and retrieves assets from S3.
Instance Type: t2.micro.
Constraint: Must use the latest Amazon Machine Image for Amazon Linux 2. Use an SSM Parameter /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2 to dynamically fetch the latest AMI ID.
Integration: This server connects to the RDS database for data persistence and accesses the S3 bucket for static assets.

RDS DB Instance for WebAppDatabase:
Purpose: A relational database for application data that the EC2 web server connects to for storing and retrieving data.
Engine: MySQL.
Instance Class: db.t3.micro.
Storage: 20 GB of General Purpose SSD gp2.
Constraint: Must be configured as a Multi-AZ deployment to ensure high availability.
Integration: The database accepts connections from the EC2 web application server.

Resource Tagging - Global Requirement:
Constraint: Every resource created by this stack must be tagged with the following keys, using the values from the input parameters:
Environment
Owner
Project

Output Format Requirements:
- The entire response must be a single, valid YAML file named TapStack.yml.
- The response should contain only the YAML code block. Do not include any introductory text, explanations, or concluding remarks.
- Ensure the template is syntactically correct and will deploy successfully.
```
