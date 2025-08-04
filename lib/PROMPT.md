Your mission is to **act as an expert AWS Solution Architect** specializing in **serverless design patterns** and **infrastructure-as-code** using **AWS CloudFormation** in **YAML format**. You are responsible for delivering a scalable, secure, and observable serverless backend architecture suitable for modern cloud-native applications.

---

### **Instructions:**

Design a fully serverless backend infrastructure using **CloudFormation (YAML)** that adheres to AWS best practices for production-grade systems. The deployment must be isolated to the **`us-east-1` region**, follow consistent naming conventions, and include fine-grained IAM permissions aligned with the **principle of least privilege**.

---

### **Here is the task to translate into CloudFormation YAML:**

Create a **single CloudFormation YAML template** that provisions the following:

---

### **1. API Layer (Amazon API Gateway)**

* Define a **REST API** with at least one HTTP method (e.g., `POST` or `GET`).
* Integrate the REST endpoint with a backend **AWS Lambda function**.
* Apply naming like `myApiGateway-dev`.

---

### **2. Compute (AWS Lambda)**

* Deploy a Lambda function named `myLambdaFunction-dev`.
* It should:

  * Be triggered by the API Gateway.
  * Read from and write to a DynamoDB table.
  * Include **CloudWatch Logs** enabled for debugging and monitoring.

---

### **3. Database (Amazon DynamoDB)**

* Create a table named `myDynamoDbTable-dev`.
* Define both:

  * **Partition key** (e.g., `userId` - String)
  * **Sort key** (e.g., `createdAt` - String or Number)
* Use `PAY_PER_REQUEST` billing mode for cost efficiency.

---

### **4. IAM Roles and Policies**

* Create IAM roles for:

  * The **Lambda function** (`lambdaExecutionRole-dev`)
  * Any additional roles required by API Gateway (if applicable).
* Roles must have **least privilege access**, scoped only to:

  * DynamoDB actions like `GetItem`, `PutItem`, `Query`
  * Logging permissions for CloudWatch.

---

### **5. Object Storage (Amazon S3)**

* Define a bucket named `myStorageBucket-dev`.
* Enable **server-side encryption** using `AES256` or `KMS`.
* The bucket may be used for storing function artifacts or logs.

---

### **6. Monitoring and Alerts (Amazon CloudWatch)**

* Configure **CloudWatch metrics and alarms** for the Lambda function:

  * Track `Invocations`, `Errors`, and `Duration`.
  * Add an alarm for high error rates (e.g., more than 5 errors in 5 minutes).

---


---

### ✅ **Expected Output:**

A **single, complete CloudFormation YAML file** that:

* Defines all the above components.
* Follows naming conventions and AWS best practices.