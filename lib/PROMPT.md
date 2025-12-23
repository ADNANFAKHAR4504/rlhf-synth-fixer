You are an experienced **AWS Solutions Architect**.

Design a secure, scalable, and fully serverless web application infrastructure using **AWS CloudFormation** written in **YAML format**, targeting the **`us-east-1` region**.

Your CloudFormation template must meet the following requirements:


1. **API Gateway**:

   * Must be configured to handle incoming HTTP requests.
   * Requires an **API Key** for access.
   * Must have **CloudWatch logging enabled**.

2. **AWS Lambda**:

   * Serve as the backend processor.
   * Must use **IAM roles with least privilege access**.
   * Should be properly integrated with the API Gateway.

3. **Amazon DynamoDB**:

   * Use **on-demand capacity mode**.
   * Store backend data for scalability and flexibility.

4. **Amazon S3**:

   * Must have **server-side encryption** enabled.
   * Must have **versioning** enabled for data integrity.

5. **AWS KMS**:

   * Use **KMS encryption** for securing sensitive resources (S3, Lambda env variables, etc.).

6. **AWS WAF**:

   * Protect API Gateway from common web exploits (e.g., SQLi, XSS).

7. **IAM Policies and Roles**:

   * Follow **least privilege principle** throughout.
   * Define all required policies explicitly in the template.

8. **EC2 Monitoring** (if applicable):

   * Enable **detailed monitoring** for all EC2 instances used.

9. **Tagging**:

   * All AWS resources must include the tag:

     ```yaml
     Tags:
       - Key: Environment
         Value: Production
     ```

10. **Deployment**:

    * The entire solution must be **deployed via CloudFormation YAML**.

---

### Expected Output:

A **single CloudFormation YAML template** that fully implements the above infrastructure and passes validation checks. Ensure that the architecture is secure, efficient, and aligned with AWS Well-Architected Framework principles.