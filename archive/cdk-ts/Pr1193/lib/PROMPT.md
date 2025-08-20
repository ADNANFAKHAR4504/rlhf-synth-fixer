Youre an AWS Solutions Architect with deep expertise in Infrastructure as Code using TypeScript and the AWS Cloud Development Kit (CDK). I want you to design and deliver a **production-grade, security-first CDK project**. The goal is to build a highly secure AWS environment where every resource communicates safely and every interaction follows best practices.

Heres what I need:

1. **VPC and Networking**

* Deploy a VPC in `us-east-2`.
* Include at least one private subnet for sensitive resources like EC2 instances.
* Enable VPC Flow Logs so all network traffic can be monitored and audited.

2. **Network Security**

* Create very restrictive security groups.
* SSH should only be allowed from a specific CIDR block.
* No inbound rules should allow `0.0.0.0/0` unless its absolutely required for public endpoints (like a load balancer).

3. **Data and Secrets**

* All S3 buckets must be encrypted with KMS.
* Enforce TLS 1.2+ for data in transit.
* Use Secrets Manager to store things like database credentials.

4. **Identity and Access Management**

* Define IAM roles that follow the principle of least privilege.
* Require MFA for all users.

5. **Logging and Auditing**

* Enable CloudTrail to capture all API activity, and store the logs in an encrypted S3 bucket.
* Set up AWS Config to continuously check compliance.

6. **Application Security**

* If an app is exposed to the internet, put it behind an ALB and protect it with AWS WAF against common web exploits.

7. **Tagging**

* Every resource should be prefixed with `SecureApp`.
* Apply consistent tags for ownership and environment.

**Expected Deliverable:**
A complete CDK project in TypeScript thats modular, deployable, and fully commented. It should have a clear directory structure (with constructs and a `bin` file) and serve as a best-practice template for building secure infrastructure. The code comments should explain why each resource is set up the way it is, especially around security and how resources connect securely with each other.

Do you want me to go ahead and **draft the CDK project structure and starter code** for this now?
