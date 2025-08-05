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
