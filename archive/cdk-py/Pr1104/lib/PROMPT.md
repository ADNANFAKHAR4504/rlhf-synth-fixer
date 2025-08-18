The prompt below is designed to be used with a large language model to generate infrastructure-as-code. It is a detailed and professional request for a Python script using the AWS Cloud Development Kit (CDK) that provisions a serverless architecture.

***

### **Prompt**

I need you to generate a Python script using the **AWS Cloud Development Kit (CDK)** to deploy a serverless infrastructure. The solution must be structured in a way that supports multiple environments, specifically **development** and **production**.

The script should perform the following tasks and adhere to all specified constraints:

**Core Architecture:**

* **S3 Bucket:** Create an Amazon S3 bucket.
* **AWS Lambda Function:** Create a Python Lambda function that is triggered by the S3 bucket.
* **S3 Event Trigger:** Configure the S3 bucket to trigger the Lambda function **only on `s3:ObjectCreated:*` events.**
* **Lambda Function Logic:** The Lambda function must be able to do the following:
    * Access the S3 event data.
    * Log the name of the newly created object to **Amazon CloudWatch Logs**.
    * Store the processed object metadata in a **DynamoDB** table.
* **DynamoDB Table:** Deploy a DynamoDB table to store the metadata.
    * The table's **partition key** must be named `ObjectID` and be of type **String**.

**Configuration and Best Practices:**

* **Environment-Specific Configuration:** Implement logic to handle separate configurations for `development` and `production` environments. This includes deploying a unique set of S3 buckets, Lambda functions, and DynamoDB tables for each environment. Use **AWS CDK Stacks** to manage these environments.
* **Resource Tagging:** All provisioned resources (S3, Lambda, DynamoDB, and IAM roles) must be tagged with a key `Environment` and the value set to the current stack's environment (e.g., `development` or `production`).
* **Least Privilege IAM:**
    * Create a dedicated **IAM Role** for the Lambda function.
    * This role must be configured with a strict **least privilege** policy. It should only have permissions to:
        * Write logs to its own **CloudWatch Log Group**.
        * Perform `s3:GetObject` and `s3:GetObjectAcl` actions on the specific S3 bucket that triggers it.
        * Perform `dynamodb:PutItem` on the DynamoDB table to store metadata.
* **Output Exports:** Use CDK's stack outputs to export the **S3 bucket name** and the **Lambda function ARN** for each environment.

---

### **Expected Output**

The final output should be a complete and runnable Python script in a file named `app.py`, and a `lambda_handler.py` file for the Lambda function's code.

**`app.py`:**
A Python script that uses the AWS CDK to define and deploy the entire infrastructure as described above. The script should be modular and use constructs effectively.

**`lambda_handler.py`:**
A Python script containing the Lambda function's logic. It will accept the S3 event, extract the object name, log it to CloudWatch, and save metadata to the DynamoDB table. It should be packaged with the CDK stack.