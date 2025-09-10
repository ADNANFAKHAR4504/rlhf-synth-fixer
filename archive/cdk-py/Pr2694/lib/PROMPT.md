I’m building an infrastructure project and I want the whole setup defined using the **AWS CDK with Python**.  
The folder structure is straightforward: in the root I have a `tap.py` entry file, and in a `lib` directory I’ll keep the main stack definition inside `tap_stack.py`.  

The goal is to create a **secure and resilient AWS infrastructure** that follows best practices for both **security** and **high availability**. Here’s what I need:  

- A **VPC** with both public and private subnets.  
- An **S3 bucket** for storage, configured with **server-side encryption** enabled.  
- An **IAM role** with the principle of least privilege, granting **read-only access to the S3 bucket**.  
- A **security group** that allows **only HTTP (80) and HTTPS (443)** traffic.  
- An **Amazon RDS MySQL 8.0 instance**, deployed in private subnets with **Multi-AZ enabled**, a **7+ day backup retention period**, and configured to **delete automatically when the stack is destroyed**.  
- One or more **AWS Lambda functions** running on Python, deployed inside the VPC with proper security group access.  
- Use **AWS Systems Manager Parameter Store** to securely store the RDS connection strings.  

Everything must run in the **us-east-1** region, and the design should be parameterized where possible for flexibility. All resources should align with AWS security best practices.  

At the end, I expect to get a **Python CDK script** (`tap.py` and `lib/tap_stack.py`) that I can deploy with `cdk deploy`, and it should stand up the complete infrastructure exactly as described above.  