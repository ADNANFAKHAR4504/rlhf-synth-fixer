**Prompt – Performance-Optimized Serverless Infrastructure**

> You are an **AWS Solutions Architect** specializing in **high-performance serverless systems**.
> Create a **production-ready AWS CloudFormation YAML template** that provisions a **serverless application** in the **us-west-2** region.
>
> **Architecture Flow:**
>
> * **API Gateway** receives incoming HTTP requests and invokes **Lambda** function
> * **Lambda** processes the requests and reads/writes data to **S3** bucket
> * **CloudWatch** captures logs and metrics from both API Gateway and Lambda
> * **IAM roles** grant Lambda permissions to access S3 with least privilege
>
> **Performance & Scalability Requirements:**
>
> 1. The system must reliably handle **≥ 1,000 requests per second**.
> 2. Configure **API Gateway** with **high throughput limits** (burst and rate settings) and enable **stage caching** where appropriate.
> 3. Pre-provision **Lambda provisioned concurrency** to avoid cold starts and ensure consistent latency under peak load.
> 4. Use **Lambda reserved concurrency** where necessary to prevent resource exhaustion and maintain stability.
> 5. Architect for **multi-AZ high availability** and **fault tolerance**.
>
> **Security & Compliance:**

> 6. Implement **IAM roles and policies** following **principle of least privilege** for all services.
> 7. All S3 buckets must have **Server-Side Encryption (SSE)** enabled (AES-256 or AWS KMS).
> 8. Enable **access logging** for API Gateway and S3.
> 9. Enforce **HTTPS (TLS 1.2 or higher)** for all API endpoints.
>
> **Monitoring & Observability:**

> 10. Enable **CloudWatch Logs & Metrics** for Lambda and API Gateway.
> 11. Add **CloudWatch Alarms** for high error rates, throttling, or latency spikes.
>
> **Output Specifications:**
>
> * Provide a **single, fully functional CloudFormation YAML** that, when deployed, provisions all required resources.
> * Include **inline comments** explaining the purpose of each major resource and key configuration.
> * Ensure **logical naming conventions** for resources to support maintainability.
> * Optimize for **security, scalability, and cost-effectiveness** without sacrificing performance.

