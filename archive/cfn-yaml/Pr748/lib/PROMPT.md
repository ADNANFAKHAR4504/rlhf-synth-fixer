
You are tasked with developing a secure serverless infrastructure for an AWS Lambda application deployed inside a dedicated VPC. The deployment should meet the following security and logging requirements:

Logging Requirements:

Enable logging for every Lambda invocation.

Store the logs in Amazon CloudWatch Logs with a retention period of 15 days.

Persist the logs in an existing S3 bucket: lambda-logs-bucket.

IAM Security Requirements:

Review and refine IAM roles associated with the Lambda functions.

Ensure least privilege principle: IAM roles should not provide more permissions than required for their specific task.

Deployment Environment:

Deploy in the us-east-1 AWS region.

Use a pre-existing VPC with ID: vpc-123abcde.

Use the existing S3 bucket: lambda-logs-bucket.

Constraints Set CloudWatch Log retention to exactly 15 days.

Use only necessary permissions in IAM policies attached to Lambda roles.

Do not create unnecessary resources outside the scope of this security-focused setup.

Expected Output A single YAML file containing the complete CloudFormation template.

The template must:

Define all necessary resources to meet the requirements.

Reference the existing VPC and S3 bucket.

Include proper metadata, log groups, IAM roles/policies, and Lambda function definition.

Add inline comments to explain critical sections.

Provide deployment verification steps that confirm:

Logging to CloudWatch and S3 is working as intended.

IAM permissions are properly scoped and do not allow excessive access.
=======
## **System Instruction**

You are a senior AWS Cloud Engineer and Pulumi expert with advanced Python development skills. Your goal is to design and deliver **a production-grade, serverless infrastructure** using Pulumi and Python. You must adhere to AWS security, IAM, and operational excellence best practices.

---

## **User Requirements**

1. **Infrastructure as Code (IaC)**  
   - All resources must be defined in **Pulumi using Python**.  
   - The Pulumi project must be **modular, reusable, and well-structured**.  

2. **Serverless Application Design**  
   - Provision an **AWS Lambda function** capable of connecting securely to an **AWS RDS instance**.  
   - Trigger the Lambda function from an **API Gateway** endpoint.  
   - Ensure secure VPC networking between the Lambda and RDS instance (private subnets, security group rules).  

3. **IAM & Security**  
   - Create a dedicated **IAM role for Lambda execution** with **least privilege permissions**.  
   - The role must allow:  
     - Access to RDS (read-only or required privileges).  
     - Access to logs for observability.  
   - Apply **secure networking** and **encryption (TLS/SSL)** where applicable.  

4. **Error Handling & Logging**  
   - Implement **comprehensive error handling** inside the Lambda function.  
   - Use structured logging and integrate with **CloudWatch Logs**.  

5. **Testing & Validation**  
   - Implement **automated tests** to confirm:  
     - API Gateway endpoint responds successfully.  
     - Lambda retrieves data from RDS correctly.  
     - Failure scenarios are handled gracefully.  

6. **Documentation**  
   - Provide detailed **deployment documentation**, covering:  
     - Pulumi project structure.  
     - Environment variables and configuration management.  
     - Step-by-step commands (`pulumi up`, `pulumi destroy`, etc.).  

---

## **Output Requirements**

- Deliver **Pulumi Python code** with inline comments describing resource connections.  
- Show how the Lambda function, API Gateway, and RDS instance are linked securely.  
- Include **test code** for API Gateway and Lambda functionality.  
- Include **clear deployment documentation** suitable for DevOps teams managing multi-environment setups.  

---

## **Additional Notes**

- Use Pulumi configuration or environment variables for sensitive data like database credentials.  
- Implement proper state management with Pulumi (e.g., Pulumi Service backend or S3 backend).  
- Ensure the infrastructure can be deployed repeatedly in different AWS accounts/environments without modification.  

---

