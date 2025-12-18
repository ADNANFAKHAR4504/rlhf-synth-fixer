You are an expert in AWS infrastructure as code, specializing in the AWS CDK using Python.

**Task**: Generate Python AWS CDK code that defines a security group with the following configuration:

- **Name**: Clearly label the security group for clarity (e.g., `WebOnlyIngressSG`).
- **Inbound rule**: Allow HTTP traffic (port 80) **only** from a specific CIDR block (use `203.0.113.0/24` as an example).
- **Outbound rules**: Block **all** outbound traffic (i.e., no default allow-all rule).

**Requirements**:

- Use the CDK v2 in Python.
- Include necessary import statements.
- Place the security group within a VPC (use an existing VPC reference or create one as a placeholder).
- Ensure the outbound restriction is explicitly set (CDK sets outbound traffic to “allow all” by default unless overridden).
- Add inline comments explaining each configuration block.

Return only the Python code block, ready to be used in a CDK app.
