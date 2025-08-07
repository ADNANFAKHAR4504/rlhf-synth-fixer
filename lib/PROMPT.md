### Optimized Prompt (Final Version)

You are an expert AWS Cloud Solutions Architect specializing in serverless technologies and Infrastructure as Code (IaC).

Your task is to create a complete, production-ready **AWS CloudFormation template in YAML format**. This template will define the serverless backend for a new healthcare application. The architecture must be secure, resilient, and follow AWS best practices.

**Project Context:**
* **Application:** Serverless Healthcare App
* **Problem ID:** `ServerlessHealthcareApp_IaC_Deployment`
* **Project Name:** `Serverless Healthcare Application Deployment`

Adhere strictly to the following requirements:

### 1. General Template Requirements
* **Parameters:** Include a `ProjectName` parameter with a default value of `ServerlessHealthcareApp`. This will be used to prefix all resource names.
* **Resource Naming Convention:** All created resources (the DynamoDB table, Lambda functions, SQS/SNS topics, and IAM roles) **must** be named using the `ProjectName` parameter as a prefix. For example, use `!Sub "${ProjectName}-PatientDataTable"` for the table name.
* **Multi-Region Design:** The template must be deployable without modification in at least three different AWS regions (e.g., `us-east-1`, `eu-west-1`, `ap-southeast-2`). Use pseudo parameters like `AWS::Region` where appropriate.
* **Outputs:** Include an `Outputs` section that exports key resource identifiers like the DynamoDB table name, SQS queue URL, and SNS topic ARN.

---
### 2. AWS Service Configuration

#### **Amazon DynamoDB**
* Define one **DynamoDB table** logically named `PatientDataTable`. The physical name should follow the specified naming convention (e.g., `ServerlessHealthcareApp-PatientDataTable`).
* The table must have a primary key of `PatientID` (String).
* Enable **Point-in-Time Recovery (PITR)** for data protection.
* Enable **Server-Side Encryption (SSE)** using an AWS-managed key (`AWS_KMS`).

#### **AWS Lambda Functions**
Define three distinct Lambda functions. For each function, provide inline Python or Node.js code that is simple but functional (e.g., logs the event and returns a success message).
1.  **`ProcessPatientDataFunction`:**
    * **Purpose:** Ingests and processes new patient records.
    * **Trigger:** This function should be designed to be invoked by an external source, like an API Gateway (though you do not need to define the API Gateway itself).
    * **Action:** Writes an item to the `PatientDataTable` and sends a message to the `AnalyticsTaskQueue`.
2.  **`AnalyticsProcessingFunction`:**
    * **Purpose:** Performs asynchronous analytics on patient data.
    * **Trigger:** Triggered by messages in the **SQS queue** defined below.
3.  **`SendNotificationFunction`:**
    * **Purpose:** Sends notifications when critical patient data is updated.
    * **Trigger:** Triggered by the **SNS topic** defined below.

#### **Amazon SQS & SNS**
* **SQS Queue:** Define an SQS queue logically named `AnalyticsTaskQueue`.
* **SNS Topic:** Define an SNS topic logically named `PatientUpdatesTopic`.

---
### 3. Security: IAM Roles & Least Privilege
This is the most critical requirement. You must implement IAM Roles that strictly adhere to the **principle of least privilege**.
* **Create a unique IAM Role for EACH Lambda function.** Do not use a shared role.
* **`ProcessPatientDataRole`:** Must ONLY have `dynamodb:PutItem` permissions on the `PatientDataTable` and `sqs:SendMessage` permissions on the `AnalyticsTaskQueue`.
* **`AnalyticsProcessingRole`:** Must ONLY have basic permissions to read from the `AnalyticsTaskQueue` (e.g., `sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:GetQueueAttributes`).
* **`SendNotificationRole`:** Must ONLY have `sns:Publish` permissions on the `PatientUpdatesTopic`.
* All roles must have basic Lambda execution permissions to write to CloudWatch Logs.

---
### 4. Final Output Requirements
* The entire output must be a **single CloudFormation template in a YAML code block**.
* The template must be syntactically correct and well-commented to explain complex sections.
* The final template must pass AWS CloudFormation validation and `cfn-lint` checks with **no errors or security warnings**.
