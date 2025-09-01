# Ideal Response

The model should output a **complete and valid CloudFormation template in JSON** that:

1. **Networking**

   - Defines a VPC with CIDR `10.0.0.0/16`.
   - Creates one **public subnet** (`10.0.1.0/24`) and one **private subnet** (`10.0.2.0/24`).
   - Attaches an Internet Gateway to the VPC.
   - Configures a public route table that routes `0.0.0.0/0` to the Internet Gateway and associates it with the public subnet.
   - Configures a private route table that does **not** allow internet access and associates it with the private subnet.

2. **S3 Logging Bucket**

   - Creates an encrypted S3 bucket with **SSE-KMS** enabled.
   - Applies a **bucket policy** restricting access only to trusted CIDR ranges passed as parameters.

3. **IAM Roles**

   - Creates an IAM role and instance profile for EC2 with **read-only S3 access** to the logging bucket.

4. **CloudTrail**

   - Provisions a CloudTrail trail that sends logs to the S3 bucket.

5. **Security**

   - Creates a Security Group that only allows **SSH (22)** from trusted IP ranges passed as parameters.
   - Uses **KMS CMK** (created or referenced) for encryption and includes a proper key policy.

6. **Best Practices**

   - Tags all resources with `Environment=Production` and meaningful `Name` tags.
   - Avoids hard-coded credentials.
   - Ensures CloudFormation rollback on failure is compatible.

7. **Outputs**

   - Exposes VPC ID, Public Subnet ID, Private Subnet ID, and Security Group ID as CloudFormation outputs.

8. **Format & Validity**
   - The response must be a **strictly valid JSON CloudFormation template**, passing `aws cloudformation validate-template`.
   - Parameters should be used for **trusted IP CIDRs**, **bucket name prefix**, and optionally **KMS alias**.
