Certainly! Here's a rewritten version of your original prompt that is more precise, action-oriented, and well-scoped for generating a correct AWS CloudFormation template: 

---

**Prompt:**

Generate an **AWS CloudFormation YAML template** to configure a **serverless infrastructure** in an AWS account **where an existing S3 bucket and CloudWatch Log Group are already present**.

The template should deploy an **AWS Lambda function** that is automatically triggered whenever a new **plain text file** is created in the specified **existing S3 bucket**. The Lambda function must:

* Be triggered on the event type `'s3:ObjectCreated:*'` for the bucket.
* Read the contents of the newly added object (assume text format).
* Log specific details from the file to the **existing CloudWatch Log Group**.

**Requirements:**

1. Define:

   * A Lambda function (with inline or external code placeholder).
   * An IAM Role with:

     * Permissions to read objects from the existing S3 bucket.
     * Permissions to write logs to the existing CloudWatch Log Group.
   * S3 event permission allowing the S3 bucket to invoke the Lambda function.

2. The existing S3 bucket and CloudWatch Log Group names should be passed in as **template parameters**, and the template should reference them accordingly.

3. Ensure:

   * The template is **fully self-contained** and **passes AWS CloudFormation validation**.
   * No attempt is made to create the existing resources again.
   * All required permissions and resource relationships are correctly defined.

**Constraints:**

* Do not create the S3 bucket or CloudWatch Log Group in the template.
* Ensure only one event trigger for the S3 bucket is configured.
* The Lambda function must log meaningful details (e.g., filename, content) to CloudWatch.

---

Would you like me to generate the CloudFormation YAML template as well?
