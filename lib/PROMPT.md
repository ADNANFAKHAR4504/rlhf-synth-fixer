You are a Senior Security Automation Engineer specializing in Pulumi with Python. Your task is to develop a highly professional and secure-by-design Pulumi program for a production web application on AWS. This is a hard-level task that requires a deep understanding of AWS security best practices and advanced Pulumi features.

## Prompt

Your mission is to create a complete and production-ready Pulumi program in Python that establishes a robust security foundation for a web application. The solution must demonstrate advanced techniques beyond simple resource creation, including dynamic policy generation, secure secret management, and a modular architecture.

Your program must include:

### 1. Dynamic Security Group Policy

- Automate VPC Discovery: Dynamically fetch the default VPC ID for the us-west-2 region rather than hardcoding it. This makes the code portable and resilient to changes.
- Parameterize Ingress Rules: The program must accept a list of allowed IP CIDR blocks from the Pulumi configuration.
- Advanced Egress Control: Instead of a simple allow all egress rule, implement an egress rule that allows traffic only to a specific set of ports (such as 80 and 443) and to a pre-defined set of trusted external services or IP ranges. This demonstrates a principle of least privilege.
- Modular Rule Creation: Use a loop or a list comprehension to dynamically create the ingress and egress rules for the security group, making the code clean and scalable.

### 2. Enforced Access Key Rotation with Policy Logic

- Conditional IAM Policy: Construct a single, complex IAM policy document using a Python dictionary and json.dumps. The policy should explicitly deny access to all actions if the aws:CurrentTime is greater than aws:UserCreationTime plus 90 days. This is a more robust, condition-based enforcement than a simple policy statement.
- Resource Management: Create an aws.iam.User and an aws.iam.AccessKey resource. The AccessKey should have its rotation enforced by the policy attached to the user.
- Output Management: The program must not output the plaintext access key ID or secret. Instead, it must only output the ARN of the IAM user and a clear statement indicating that the access key secret is securely managed and should be retrieved via a separate, secure process (for example, using Pulumi's config.require_secret).

### 3. Advanced KMS-based Secret Management

- Key Policy: Create an aws.kms.Key and attach a key policy (aws.iam.KeyPolicy) that restricts key usage to specific IAM principals (for example, the IAM user created in the previous step). This is a critical security best practice.
- Cross-Resource Dependency: Demonstrate how the KMS key and the IAM user are linked. The KMS key policy should reference the ARN of the IAM user, showcasing a dependency between resources.
- Encrypted Configuration: Utilize pulumi.Config to store a sensitive value (for example, a dummy database password). The program should then show how to read and use this encrypted value to create an aws.kms.Ciphertext resource, ensuring the secret is never exposed in plaintext in the code or state file.

## Expected Output

The expected output is a well-structured and fully commented __main__.py file within a Pulumi project. The code must be runnable, and the Pulumi plan and apply outputs should clearly show:

- The creation of a single security group with multiple ingress and egress rules
- The creation of a single IAM user with an attached policy that includes the time-based denial condition
- The creation of a KMS key with an explicit key policy
- The use of a secret from the Pulumi configuration that is encrypted via KMS
- The final pulumi.export statements should only output non-sensitive information like ARNs and resource IDs, and the encrypted ciphertext value (not the plaintext). The output for the IAM access key should be explicitly withheld for security.

## Requirements Breakdown

- Technology Stack: Pulumi with Python
- Cloud Provider: AWS
- Region: All resources in us-west-2
- Architectural Pattern: Modular and dynamic infrastructure as code
- Security Principles: Principle of Least Privilege, separation of duties, secure secret management, and automated policy enforcement
- Verifiability: The code's logic and the final outputs must clearly demonstrate that all security requirements are met without manual intervention. This includes the complex IAM policy logic and the dynamic, data-driven creation of security group rules.
