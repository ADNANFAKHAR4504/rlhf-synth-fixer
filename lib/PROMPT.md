##  **Task Overview (As a Solution Architect)**

You are tasked with designing and implementing a **production-ready, event-driven serverless architecture** using **AWS CDK with Python** in **AWS `us-east-1` region**. This infrastructure should enable **automatic processing, notification, and tracking** whenever new objects are added to an S3 bucket.

---

##  **Architecture Requirements and Responsibilities**

### 1. **S3 Bucket with Encryption**

* **Trigger:** When an object is uploaded to the bucket.
* **Requirement:** S3 must use **AES-256 encryption** (i.e., server-side encryption using S3-managed keys).
* **Tagging:** All resources, including the bucket, must be tagged.

### 2. **Lambda Function (Python)**

* **Language:** Python (code written in Python).
* **Triggers:**

  * Triggered automatically by **S3 object creation events**.
  * Also triggered **via HTTP using API Gateway**.
* **Constraints:**

  * Timeout must be ** 30 seconds**, set using **environment variables**.
  * Logs output to **CloudWatch Logs**.
  * **IAM Role** must permit:

    * Reading from S3
    * Writing to DynamoDB
    * Publishing to SNS

### 3. **SNS Topic**

* **Purpose:** Send **email notifications** when the Lambda is triggered by S3 changes.
* **Subscription:** An email address will be subscribed to the topic.

### 4. **API Gateway**

* Provides an **HTTP endpoint** to invoke the Lambda function directly.
* Must use **REST API**, not WebSocket.

### 5. **DynamoDB Table**

* **Purpose:** Store **metadata** of the processed S3 objects (e.g., file name, size, timestamp).
* Must include:

  * A **partition key** (e.g., `objectKey`)
  * A **sort key** (e.g., `uploadTime`)

### 6. **IAM Roles & Permissions**

* Use **least-privilege principle**:

  * Lambda execution role with scoped-down permissions
  * SNS publish permission
  * DynamoDB write permission
  * API Gateway invoke permission (if needed)

---

##  **Expected Output**

* A **aws cdk Python script** (typically `__main__.py`) that:

  * Defines all the above AWS resources
  * Applies naming and tagging conventions

---