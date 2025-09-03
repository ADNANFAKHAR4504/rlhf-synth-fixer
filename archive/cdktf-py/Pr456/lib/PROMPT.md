**Role:** You are a senior AWS Cloud Architect and Infrastructure-as-Code (IaC) specialist.

**Objective:** Design and implement a secure, scalable serverless architecture using **cdktf-py**. This architecture should include an **AWS Lambda function** (written in Python), an **Amazon API Gateway HTTP endpoint**, and **AWS Secrets Manager** to manage sensitive configuration.

---

### **Infrastructure Requirements**

#### 1. **Lambda Function**

- Use a **Python runtime** (e.g., `python3.12`).
- Define a **dummy handler** that logs the incoming request payload to **Amazon CloudWatch Logs**.
- Do **not hardcode environment variables**the function must **dynamically retrieve configuration data** (e.g., `API_KEY`) from **AWS Secrets Manager** during execution.

#### 2. **Secrets Manager**

- Create a **secret** in AWS Secrets Manager to store environment variables (e.g., `API_KEY`).
- The secret must be referenced **securely** at runtime by the Lambda function.
- Attach an **IAM policy** to the Lambda's execution role that grants **read-only access** to this specific secret.

#### 3. **API Gateway (HTTP API)**

- Set up an **Amazon API Gateway (HTTP API v2)** to expose a **public HTTP endpoint** that triggers the Lambda.
- Use **Lambda Proxy Integration** to forward the entire request to the function.
- Secure the endpoint using **IAM-based authorization** (sigV4) so that only **authenticated IAM users or roles** can invoke it.

#### 4. **IAM Roles and Policies**

- Define a **Lambda execution role** with:
- Permissions to log to CloudWatch.
- Permissions to retrieve the secret from Secrets Manager.

- Define an **IAM role or policy** to control who can access the API Gateway endpoint using signed IAM credentials.
- Use **least privilege** access principles throughout.

#### 5. **Deployment Region**

- All AWS resources must be explicitly deployed to the **`us-east-1`** region.

---

### **Expected Output**

- Provide **complete, production-ready cdktf-py ** for provisioning all resources.
- Include **comments and logical resource naming** for readability and maintainability.

After deployment:

- The **API Gateway** endpoint should trigger the Lambda securely.
- The **Lambda function** should log the full event payload to **CloudWatch Logs**.
- The Lambda must **dynamically fetch** its configuration values from **Secrets Manager**.
- Unauthorized or unsigned requests to the endpoint must be **denied**.
