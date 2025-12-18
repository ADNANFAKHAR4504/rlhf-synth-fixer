You are an expert AWS Solutions Architect with deep knowledge of serverless design patterns, AWS CDK, and TypeScript. Your mission is to generate a comprehensive AWS CDK TypeScript application that provisions a serverless image processing pipeline.

**Context:**
The infrastructure needs to be deployed in the `us-east-1` region. You will utilize an existing S3 bucket for image storage. This bucket already has versioning enabled. The core of the solution involves an API Gateway triggering a Lambda function, which then processes the images and publishes a notification upon successful completion.

**High-Level Requirements:**
1.  **S3 Bucket Integration:** Use an *existing* S3 bucket for storing images. The bucket's name will be provided. Assume this bucket already has versioning enabled and is correctly configured.
2.  **API Gateway Trigger:** Set up an API Gateway REST API with a `POST` method that serves as the entry point for image processing requests. This API Gateway should directly trigger the Lambda function.
3.  **Lambda Function for Image Processing:**
    * The Lambda function should be written in TypeScript.
    * It will receive image processing requests (e.g., image metadata, S3 key) via the API Gateway.
    * After successful image processing (you can simulate this with a log message for the purpose of this CDK code), the Lambda function must publish a message to an SNS topic.
4.  **IAM Role with Least Privilege:**
    * The Lambda function must have an IAM role created specifically for it.
    * This role's permissions should be strictly limited to what is necessary:
        * Read/write access to the *specified existing* S3 bucket.
        * Permissions to publish messages to the SNS topic.
        * Standard CloudWatch Logs permissions for Lambda execution.
5.  **SNS Topic for Notifications:**
    * An SNS topic should be created.
    * The Lambda function will publish completion notifications to this SNS topic.
    * The SNS topic should be configured to allow the Lambda's IAM role to publish messages.

**Expected Output:**
Generate a complete and deployable AWS CDK TypeScript application within `<typescript_code>` tags.

The code should include:
* A `cdk.json` file.
* A `package.json` file with necessary dependencies.
* The main CDK stack file (`lib/image-processing-stack.ts` or similar).
* The Lambda function's source code (`lambda/imageProcessor.ts` or similar).

**Constraints & Best Practices to Adhere To:**
* **Modularity:** Organize the CDK code logically into constructs and a main stack.
* **Readability:** Ensure the code is clean, well-commented, and easy to understand.
* **Security:** Implement IAM roles with the principle of least privilege. Do not grant broader permissions than absolutely required.
* **Error Handling (CDK Level):** Ensure the CDK code gracefully handles potential issues during synthesis or deployment (e.g., proper error messages if an existing bucket isn't found, though for this prompt, assume it exists).
* **Inter-resource Communication:** Clearly demonstrate how resources are connected and how permissions flow between them (e.g., API Gateway to Lambda, Lambda to S3, Lambda to SNS).
* **Hardcoded Values:** Avoid hardcoding values like the S3 bucket name directly in the Lambda code. Pass them via environment variables or CDK properties.
* **Region:** Explicitly set the deployment region to `us-east-1`.

**Thinking Process (for Claude Sonnet):**
Before generating the code, please outline your thought process. This should include:
1.  **Decomposition:** Break down the request into smaller, manageable CDK components (e.g., S3 integration, API Gateway, Lambda, IAM, SNS).
2.  **Resource Mapping:** Identify the specific AWS CDK constructs required for each component.
3.  **Connection Strategy:** Explain how you will establish connections and permissions between these resources.
4.  **Least Privilege Implementation:** Detail how you will ensure the IAM role adheres to the principle of least privilege.
5.  **File Structure:** Describe the planned file structure for the CDK application.

**User Input (Example - to be filled in by the user later):**
`<user_input>`
<existing_s3_bucket_name>my-existing-image-bucket-12345</existing_s3_bucket_name>
</user_input>`