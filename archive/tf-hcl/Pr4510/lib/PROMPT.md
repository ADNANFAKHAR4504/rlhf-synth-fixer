### Prompt

You are an expert AWS cloud and Terraform engineer specializing in serverless and ML infrastructure automation.  
Your task is to generate a **complete and deployable Terraform script** in a single file named **`tap_stack.tf`** that provisions a **highly available serverless ML model inference pipeline** for a **fintech company**.  

All code must include:  
- **Variable declarations** (with default values where applicable)  
- **Existing values**  
- **Terraform logic**  
- **Outputs**  

I already have a `provider.tf` file that passes the `aws_region` variable to the AWS provider configuration.  
Ensure the Terraform code properly references this `aws_region` variable throughout.  

This must be a **brand new stack** — create all resources and modules from scratch (no references to existing modules or external configurations).  
The Terraform logic must align exactly with the described infrastructure and follow **AWS and Terraform best practices** for scalability, security, and maintainability.  

---

### Business Use Case

A **fintech company** needs to deploy multiple **machine learning models** for **real-time fraud detection**.  
- The platform must handle **real-time inference requests** from thousands of concurrent users.  
- Support **model versioning** for **A/B testing** across different API stages.  
- Maintain **sub-100ms response latency** even during **traffic spikes** (e.g., peak trading hours).  
- Follow **strict security and compliance policies**.  

---

### Required Architecture & Components

#### 1. **AWS Lambda (Container-based Model Inference)**
- Deploy Lambda functions using **container images stored in ECR**.  
- Each Lambda function represents a model version (e.g., `fraud-detector-v1`, `fraud-detector-v2`).  
- Configure **provisioned concurrency** and **auto-scaling** for real-time inference workloads.  
- Allow Lambda to mount EFS for model access at runtime.  
- Define **environment variables** for runtime configuration and version metadata.  

#### 2. **Amazon EFS (Model Storage)**
- Store ML model files in an encrypted EFS volume.  
- Mount the EFS filesystem to all Lambda functions for fast, consistent model access.  
- Ensure encryption at rest using **AWS KMS CMK**.  
- Restrict network access using Security Groups and VPC configuration.  

#### 3. **Amazon API Gateway**
- Serve as the **entry point** for inference requests.  
- Create multiple **stages** (e.g., `/v1`, `/v2`) for **model version management** and A/B testing.  
- Enable **API keys** and **usage plans** for request throttling.  
- Integrate with Lambda using **Lambda proxy integration**.  
- Enable **access logging** to CloudWatch and **WAF** for security.  

#### 4. **AWS ECR (Container Registry)**
- Host Docker images containing packaged ML models and dependencies.  
- Enable lifecycle policies for image cleanup.  
- Enforce repository-level encryption and scan images for vulnerabilities.  

#### 5. **Monitoring & Observability**
- Enable **CloudWatch metrics** and **alarms** for Lambda concurrency, error rates, and latency.  
- Log API Gateway access patterns for analytics.  
- Enable **X-Ray tracing** for distributed request performance tracking.  

#### 6. **Auto-Scaling and Concurrency Management**
- Configure Lambda **provisioned concurrency** and **reserved concurrency limits**.  
- Create **CloudWatch Alarms** to trigger scaling actions.  
- Use **Application Auto Scaling** with predefined metrics for dynamic scaling during traffic surges.  

#### 7. **AWS IAM**
- Apply **least privilege access policies** for all components (Lambda, API Gateway, EFS, ECR, CloudWatch).  
- Create IAM roles for:  
  - Lambda execution  
  - EFS access  
  - API Gateway logging  
  - CloudWatch monitoring  

#### 8. **Security Controls**
- Encrypt all data at rest using **AWS KMS CMKs**.  
- Enforce **TLS 1.2+** for API Gateway endpoints.  
- Enable **WAF** for API Gateway to mitigate DDoS or injection attacks.  
- Store no sensitive credentials in plain text — use **Parameter Store** or **Secrets Manager**.  

#### 9. **CI/CD Integration (Optional Enhancement)**
- The Terraform configuration should allow integration with AWS SAM or CodePipeline for future automated deployments.  

#### 10. **Tagging**
- Every resource must include tags:  
  - `Environment`  
  - `Owner`  
  - `Project`  
  - `Version`  

---

### Deliverable

Produce a **fully deployable Terraform script (`tap_stack.tf`)** that:  
- Declares all variables, logic, and outputs.  
- Creates all resources from scratch (ECR, EFS, Lambda, API Gateway, CloudWatch, IAM).  
- Implements a **secure, scalable, and high-performance ML inference pipeline**.  
- Supports **model versioning**, **auto-scaling**, and **real-time monitoring**.  
- Adheres to **AWS security and Terraform best practices** for **serverless architectures**.