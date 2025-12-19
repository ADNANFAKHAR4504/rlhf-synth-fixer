We need a CDK project in TypeScript to build a highly secure, fully serverless **Global Payments Gateway** for our bank. The system must be compliant with financial regulations and survive a complete regional outage in our primary region, `us-east-1`, by automatically failing over to our secondary region, `us-east-2`.

---

## The Serverless Banking Application

The application's infrastructure must be secure from the edge to the database.

1.  **Secure Frontend:** The user-facing website will be a static application hosted in an **S3 bucket** and served through **CloudFront**. The site must display its current operational region (e.g., **"Active Region: us-east-1"**).

2.  **Authenticated API Backend:** The backend will be an **API Gateway** that exposes a `/transfer` endpoint. The Lambda function containing the business logic will be placed within a **VPC** and the API Gateway will communicate with it privately using a **VPC Link**.

---

## The Resilient & Secure Infrastructure

- **Database:** The single source of truth for all transactions will be a **DynamoDB Global Table**. This provides active-active replication between `us-east-1` and `us-east-2`, ensuring zero data loss (RPO < 1s).

- **Application Tier:** A reusable `RegionalStack` class in CDK will define the serverless infrastructure for each region: the S3 bucket, API Gateway with its private integration, and the VPC-enabled Lambda function.

- **Global Traffic & Edge Security:** A separate `GlobalStack` will use **Route 53** with a failover routing policy. It will constantly run health checks against the `us-east-1` API Gateway. If these checks fail, Route 53 will automatically redirect all traffic to the application in `us-east-2`. The CloudFront distribution will use this Route 53 record as its origin.

---

## Security and Compliance Mandates

This is the most critical part of the design. Your CDK application must implement these specific security controls:

- **Web Application Firewall:** The CloudFront distribution must be protected by an **AWS WAF** Web ACL using managed rule sets like the AWS Managed Rules Core rule set and the Amazon IP reputation list to block malicious traffic at the edge.

[Image of an AWS WAF architecture diagram]

- **API Authorization:** The `/transfer` endpoint on the API Gateway must be protected by a **Lambda Authorizer**. This authorizer will be responsible for validating an authorization token (e.g., a JWT) on every incoming request before it can reach the processing Lambda.

- **Data Encryption:** The DynamoDB Global Table must be encrypted with a **customer-managed KMS key**, giving us full control and auditability over the data encryption keys.

- **Least Privilege:** The Lambda function's IAM role must be strictly scoped, with no wildcards. It should only have permissions to write to the specific DynamoDB table and retrieve secrets from Secrets Manager.

---

## The Automated Failover and Test Plan

The integration test will validate both the failover and the security controls:

1.  Access the global application URL and see the "Active Region: us-east-1" message.
2.  Attempt to `POST` a transaction to the `/transfer` endpoint **without** a valid authorization token. The request **must be rejected by the Lambda Authorizer** with a `401 Unauthorized` error.
3.  `POST` a new transaction **with** a valid token. The request should succeed.
4.  Query the DynamoDB table in both regions to confirm the new transaction was instantly replicated.
5.  Refresh the global application URL. It should now show the **"Active Region: us-east-2"** message.
6.  The transaction record from step 3 **must be present** in the `us-east-2` DynamoDB table, proving our zero-data-loss and security requirements were met.

---

Implement using AWS CDK TypeScript with separate modular stack files in lib/ for each component, instantiated in lib/tap-stack.ts.
