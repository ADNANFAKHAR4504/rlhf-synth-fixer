You are required to develop an AWS CloudFormation template in YAML that defines multiple IAM roles with strict security configurations.

The template must satisfy the following requirements:

    1.	All IAM roles must enforce the use of multi-factor authentication (MFA) whenever access is requested.
    2.	IAM policies should avoid granting administrative privileges unless absolutely necessary. In cases where administrative access is required, the justification must be documented in comments within the template.

The environment consists of IAM roles for a web application, database access, and a CI/CD pipeline, among others.

Expected Output:
Deliver a valid CloudFormation YAML template that creates the required IAM roles while meeting all security requirements. The template should be deployable in AWS without errors and must comply with AWS security best practices and validation checks.
