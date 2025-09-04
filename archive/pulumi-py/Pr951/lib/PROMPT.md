## Problem ID
Security_Configuration_as_Code_Pulumi_Python_9x2jv81nq7kf

## Project Name
IaC - AWS Nova Model Breaking

## Environment
Develop a **secure** and **scalable** cloud infrastructure on **AWS** using **Pulumi in Python** for a **critical production environment**.

---

### Tasks
1. **VPC Setup**  
   - Create a VPC with **at least two subnets** in **different availability zones**.

2. **Security Group**  
   - Allow **only HTTP (port 80)** and **HTTPS (port 443)** inbound traffic.

3. **EC2 Instances**  
   - Deploy **multiple EC2 instances**.  
   - Each instance must have a **unique IAM role**.  
   - Leverage **managed services** to reduce operational overhead.

4. **API Gateway Logging**  
   - Configure **all API Gateway requests** to log to **CloudWatch**.

5. **Encryption**  
   - Integrate **KMS** for encrypting sensitive data stored or processed.

6. **Health Monitoring**  
   - Deploy a **Lambda function** that performs a **health check** every 5 minutes.

7. **Stack Management**  
   - Use **Pulumi's configuration management** for **environment-specific** configurations.

8. **Code Quality**  
   - Ensure **PEP8 compliance**.  
   - Use **type annotations** in all Python code.

9. **Resource Tagging**  
   - Tag all resources with:  
     ```
     Environment: Production
     ```

---

### Constraints
- **Region**: All resources must be created in `us-east-1`.
- VPC must have **two subnets** in **different availability zones**.
- Security group must allow **only HTTP and HTTPS** traffic.
- Each EC2 must have a **unique IAM role**.
- Use Pulumi's config for managing variables.
- All resources must be **tagged with 'Environment: Production'**.
- Prefer **managed services** for lower operational overhead.
- Implement **CloudWatch logging** for API Gateway.
- Use **KMS encryption** for sensitive data.
- Include at least one **serverless Lambda** function.
- Code must be in **Python** with **type annotations**.
- Follow **PEP8 style guide**.
- Use Pulumi's **stack management** for multiple environments.

---

### Problem Difficulty
**Expert**

---

### Proposed Statement
This task involves building AWS infrastructure exclusively in the `us-east-1` region. All resources must be designed for **security**, **operational efficiency**, and **maintainability**. Naming conventions should promote clarity and immediate understanding. All resources should be tagged for visibility across AWS services. The resulting Pulumi program must **provision the infrastructure flawlessly** upon deployment, passing all configuration and compliance checks.
