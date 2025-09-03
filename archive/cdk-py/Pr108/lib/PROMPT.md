### Prompt

You are an expert **AWS Solutions Architect** specializing in **event-driven** and **serverless** architectures. Your mission is to design an AWS infrastructure using **AWS CDK with Python**, based on the users requirements.

---

### Instructions

* **Understand the Architecture:** Carefully read the task below and understand how each component should interact.
* **Write CDK Code (Python):** Generate a single Python file containing AWS CDK code that provisions the entire architecture.
* **Follow Best Practices:** Ensure the design adheres to AWS best practices for scalability, security, reliability, and cost optimization.
* **Minimize Lambda Usage:** Do **not create Lambda functions unless strictly necessary** for backend logic.
* **Specify AWS Services:** Clearly implement and label each AWS service used to fulfill the architecture.

---

### Output Format

* One **Python file** containing the full AWS CDK app.
* Code should be production-grade and ready to deploy using `cdk deploy`.
* Include basic inline comments explaining key parts of the setup.

---

### Requirements to Implement (Translate to CDK Code):

> Create a **serverless web backend architecture** using **AWS CDK (Python)**. The infrastructure must include the following components:

---

#### 1. **Lambda Functions (Python 3.8)**

* Implement backend logic in Python 3.8.
* Include **unit tests** (only mention testing structure, don't implement tests here).
* Deployment should only proceed if tests pass (assume external CI pipeline).

#### 2. **API Gateway (HTTP API)**

* Front HTTP API that integrates with Lambda functions.
* Must **enable CORS** for static frontend hosted on S3.

#### 3. **S3 Bucket (Static Website Hosting)**

* Host the frontend (React or static HTML).
* Enable **versioning** and **server-side encryption (SSE-S3)**.
* Block all public access, with a note to use **CloudFront** or signed URLs if needed.

#### 4. **DynamoDB Table**

* Store visit logs (timestamp, IP, and path).
* Enable **encryption at rest**.
* Include a **Global Secondary Index** (GSI) for querying by timestamp or path.

#### 5. **IAM Roles and Policies**

* Use **least-privilege IAM roles**:

* Lambda DynamoDB
* API Gateway Lambda
* Lambda CloudWatch Logs

#### 6. **CloudWatch Monitoring**

* Enable logging for Lambda and API Gateway.
* Set up **alarms** for:

* Lambda invocation errors
* Throttling
* High latency

#### 7. **Environment Variables & Secrets**

* Pass configuration securely to Lambda using environment variables.
* Load sensitive information from **Secrets Manager** or **CDK context** (no hardcoded values).

---

### Expected Output

* A **single Python CDK file** that defines all components above.
* Modular and clean code with comments.
* Follows CDK best practices (`constructs`, `Stack`, `SecretValue`, etc.).
* Use CDK-provided L2 constructs where possible (e.g., `aws_s3.Bucket`, `aws_lambda.Function`, etc.).
* Mention the expected structure for `requirements.txt` and `README.md` (no need to include their full content).
* Include brief notes in comments about unit testing strategy (but skip actual tests).

---