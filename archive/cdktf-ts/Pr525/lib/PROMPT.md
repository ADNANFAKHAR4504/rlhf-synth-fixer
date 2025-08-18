You are an expert DevOps/SRE engineer skilled in CDKTF (Cloud Development Kit for Terraform) and AWS infrastructure design. I need you to generate idiomatic, syntactically correct, production-ready CDKTF code using TypeScript for the following task:

---

**Objective:**

Create a modular CDKTF configuration to provision a secure and well-tagged AWS infrastructure in `us-east-1`. The environment must fulfill the following requirements:

1. **Networking:**
   - Create a Virtual Private Cloud (VPC) spanning 3 different subnets across 3 Availability Zones in `us-east-1`.
   - Include both public and private subnets.
   - Set up a **NAT Gateway** to enable outbound internet access from private subnets while keeping them inaccessible from the public internet.

2. **Security:**
   - Define **Security Groups**:
     - Allow ingress on port `80` (HTTP) and port `22` (SSH) only from a specific range of IPs (e.g., `203.0.113.0/24`).
   - Ensure all other ports are restricted by default.

3. **IAM & Access:**
   - Define an **IAM role** and instance profile for EC2 instances.
   - Allow the EC2 instances to securely access S3 buckets **without hardcoding credentials**.

4. **Modularity:**
   - Use separate CDKTF **constructs** for each major component:
     - `NetworkingConstruct` (VPC, subnets, NAT gateway)
     - `SecurityConstruct` (security groups)
     - `IamConstruct` (IAM roles and policies)
     - `ComputeConstruct` (optional EC2 instance for testing)

5. **Tagging & Governance:**
   - Apply consistent tags to **all resources**, such as:
     - `Project = "MyProject"`
     - `Environment = "Dev"`
     - `Owner = "Akshat Jain"`

---

**Expected Output Structure:**

- A main TypeScript file (e.g., `main.ts` or `stack.ts`) with the primary stack class
- Separate TypeScript files for each construct:
  - `networking-construct.ts`
  - `security-construct.ts`
  - `iam-construct.ts`
  - `compute-construct.ts` (optional)
- Code should be clean, readable, and follow CDKTF TypeScript best practices.

---

**Deliverables:**
- CDKTF TypeScript files ready to be used with `cdktf synth`, `cdktf plan`, and `cdktf deploy`.
- All configuration properties clearly defined with proper TypeScript interfaces and defaults where appropriate.
- No hardcoded secrets or credentials.
- Use `@cdktf/provider-aws` for AWS resources.
- Assume the AWS provider is configured via `~/.aws/credentials` or environment variables.

Please generate the complete CDKTF configuration accordingly.
