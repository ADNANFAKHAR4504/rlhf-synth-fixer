**Task:** Security Compliance Automation in a Multi-Account AWS Environment

**Objective:** Develop a comprehensive solution using **AWS CDK with Python** to automate the implementation of critical security policies across a multi-account AWS environment. The solution must be modular, reusable, and easy to deploy across different stages (development, staging, production).

**Requirements:**

1.  **S3 Bucket Encryption:** Implement a mechanism to enforce a policy that all new and existing Amazon S3 buckets are configured with **server-side encryption at rest**. The solution should preferably use a bucket policy to prevent unencrypted uploads and enforce a specific encryption method (e.g., SSE-S3 or SSE-KMS).

2.  **IAM Least Privilege Configuration:** Create CDK constructs for IAM roles that strictly adhere to the **principle of least privilege**. The roles should be defined with minimal necessary permissions, avoiding broad access policies. The solution should demonstrate how to create and attach these granular policies to specific roles.

3.  **Centralized Logging with CloudWatch:** Configure a centralized logging system to capture all security-related configuration events. All changes to S3 bucket policies, IAM roles, and other security-critical resources must be logged to a designated **Amazon CloudWatch Logs** log group. The solution should include a mechanism for aggregating these logs from multiple accounts into a central security account.

4.  **Modularity and Reusability:** The solution must be designed as a **reusable CDK construct or stack** that can be easily instantiated and deployed to different AWS accounts and regions. The configuration should be parameterized to allow for environment-specific settings (e.g., dev vs. prod).

5.  **Documentation and Testing:** The final codebase must be **well-documented** with clear comments explaining the purpose of each component. Include **unit tests** using a framework like `pytest` to validate that the CDK stacks and resources are configured correctly according to the security requirements.

**Expected Output:** A complete, runnable AWS CDK project written in Python, including the following:
* A `cdk.json` file.
* A `app.py` or similar entry point.
* Separate Python files or classes for the S3, IAM, and Logging constructs.
* A `tests/` directory containing unit tests.
* A `README.md` file explaining how to deploy and test the solution.

**Note:** The solution must exclusively use **AWS CDK with Python**. No other Infrastructure as Code (IaC) tool is permitted.