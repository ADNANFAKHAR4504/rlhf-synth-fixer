We need to build an automated **HIPAA compliance and remediation engine** for our new Electronic Health Record (EHR) platform. This system will be deployed in our `prod` environment, and we'll be using the **AWS CDK with TypeScript** to define the infrastructure.

The core of the platform is an S3 bucket (`phi-data-bucket`) that stores millions of sensitive patient records (PHI). Our security and compliance teams need a system that not only logs every single access to this data but also automatically detects and _instantly responds_ to any unauthorized access.

Here's the end-to-end workflow we need to build in our CDK application:

## 1. Log Ingestion and Dual Delivery

The entire process kicks off the moment a user accesses a file in the `phi-data-bucket`.

- **S3 Access Logs** must be enabled and configured to stream (within 15 min latency) to a **Kinesis Firehose** delivery stream.
- This Firehose stream must do two things simultaneously:
  1.  **Long-Term Archive:** Deliver the raw, gzipped logs to a separate, immutable S3 archive bucket. This bucket must be configured with **S3 Vault Lock** for our compliance records.
  2.  **Real-Time Analytics:** Stream the logs (within 5 min) to an **Amazon OpenSearch Service** cluster for the security team's real-time monitoring dashboards.

## 2. Real-Time Access Validation

- The Kinesis Firehose stream will also be the trigger for our "Validator" **Lambda function**.
- This Lambda's job is to parse the incoming log in real-time ("who accessed what file?").
- It must then immediately query a **DynamoDB table**. This table is our "Authorization Store," and it maps our 12,000+ users to the specific data access policies they are entitled to.

## 3. Automated Incident Response Workflow

If the Validator Lambda determines the access was **unauthorized** (the user is not in the DynamoDB table or doesn't have rights to that file), it must immediately trigger an **AWS Step Functions** workflow to handle the security incident.

This Step Functions workflow must orchestrate the following:

1.  **Deep Audit Query:** The first step is to run an **Amazon Athena** query against our 90-day CloudTrail log archive. This will find out what _else_ this user has been doing recently.
2.  **Data Classification:** In parallel, the workflow must start an **Amazon Macie** job to classify the _exact_ data that was accessed (e.g., patient name vs. full social security and medical history).
3.  **Remediation:** Based on the findings, the workflow must do two things immediately:
    - Trigger an **SNS topic** to alert the on-call security team (within 60 seconds).
    - Invoke a "Remediation" **Lambda function**. This function's role must grant it permission to attach an "explicit-deny-all" IAM policy to the user, locking them out of the system.
4.  **Final Report:** The final step of the workflow is to generate a complete, tamper-proof incident report and store it in the S3 Vault Lock bucket for our auditors.

Implement using AWS CDK TypeScript with separate modular stack file secuirty_event.ts in lib/ for all components, instantiated in lib/tap-stack.ts. The CDK code must define all these interconnected resources, including the least-privilege IAM roles for each service to communicate.
