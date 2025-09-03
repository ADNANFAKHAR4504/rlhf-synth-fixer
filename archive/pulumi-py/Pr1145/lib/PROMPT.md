# Infrastructure as Code - AWS Nova Model Breaking

## **Problem Statement**

Develop a professional Python script using **Pulumi** to provision a secure, production-ready infrastructure for a new web application. The infrastructure must be deployed in a single AWS region and comply with a set of stringent security, logging, and tagging requirements.

All code must be contained in a single Python file named **`tap_stack.py`**.

---

## **Requirements and Constraints**

The Pulumi Python script must satisfy all of the following requirements:

1. **Region:** All resources must be deployed exclusively within the **`us-east-1`** AWS region.
2. **IAM Policy:** Every newly created resource must be associated with a "default" IAM policy to enforce least-privilege access. This policy should be defined within the Pulumi program.
3. **Logging:** Enable access and object change logging for all deployed AWS S3 buckets. The logs should be stored in a separate, dedicated S3 bucket.
4. **Database Security:** Any database resources provisioned must be private and inaccessible from the public internet.
5. **Encryption:** Utilize AWS Key Management Service (KMS) to encrypt all sensitive data and resources at rest. This includes, but is not limited to, S3 buckets, databases, and any other relevant storage resources.
6. **Tagging:** Apply a standardized tag to all resources with the key-value pair of **`environment=production`** for easy identification, cost tracking, and automation.

---

## **Expected Output**

The final deliverable is a complete, well-documented **Pulumi** script in `tap_stack.py` that defines and provisions the required infrastructure. The script should be organized, follow best practices for Infrastructure as Code (IaC), and be ready for deployment.

Upon successful execution of the Pulumi deployment, the following should be verified:

- All resources are deployed in the **`us-east-1`** region.
- The "default" IAM policy is correctly applied to all resources.
- S3 bucket logging is configured and directs logs to the specified logging bucket.
- Database resources are private and have no public endpoints.
- KMS is used for encrypting sensitive resources.
- All resources are tagged with **`environment=production`**.

The script should be structured logically, with clear comments explaining the purpose of each resource and the rationale behind security configurations.
