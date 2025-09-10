Generate a single AWS CloudFormation template in strict JSON that implements the following secure, production-ready infrastructure in region us-west-2.

Requirements (must satisfy all):
1. VPC with CIDR 10.0.0.0/16 and at least **two public** and **two private** subnets across multiple AZs.
2. Internet Gateway attached to the VPC and a NAT Gateway (with Elastic IP) in a public subnet to enable private subnet egress.
3. Route tables and associations configured so public subnets route 0.0.0.0/0 to the Internet Gateway and private subnets route 0.0.0.0/0 to the NAT Gateway.
4. Security Groups:
   - EC2/ELB security group that allows **HTTPS (443)** from 0.0.0.0/0 and **SSH (22)** only from a ParameterStore-managed CIDR parameter (Parameter Store name: /prod/ssh/cidr).
   - RDS security group only allows the EC2/ELB security group (or specific private subnet CIDRs).
5. Launch an EC2 instance in one of the **public** subnets (use Amazon Linux 2 AMI as a Parameter). Attach an IAM instance profile granting minimal permissions (only what’s needed to read particular SSM Parameters and write CloudWatch logs).
6. Deploy an RDS instance (MySQL or PostgreSQL — choose one as a Parameter) in a **private** subnet group, with `StorageEncrypted: true` and using a **customer-managed KMS key** created in the template. Set Multi-AZ = true if feasible in the template constraints.
7. CloudTrail:
   - Create an S3 bucket for CloudTrail logs.
   - Enable CloudTrail trail with `IsMultiRegionTrail: false` (region-constrained to us-west-2) and configure the trail to use a KMS key for encryption (use same or separate KMS key — create resources accordingly).
   - Ensure S3 bucket policies block public access and only allow CloudTrail + account principals to put objects, and allow KMS decrypt via key policy.
8. IAM:
   - Create IAM roles/policies with least privilege for EC2 (instance role), Lambda (secret rotation), and CloudFormation execution as needed.
   - Enforce that IAM users must use MFA — represent this by an IAM policy/document that denies actions when MFA is not present (document the assumption).
   - All IAM policies must default-deny non-essential actions.
9. Parameter Store / Secrets:
   - Use SSM Parameter Store for sensitive environment parameters (e.g., DB password stored as SecureString using the KMS key).
   - Add SSM parameters for `/prod/ssh/cidr`, `/prod/db/password` (SecureString), `/prod/db/username`.
10. Elastic Load Balancer:
    - Create an Application Load Balancer in public subnets with a target group for the EC2 instance(s).
    - Create listener for HTTPS (443) and attach a certificate ARN as a Parameter (the template may accept a Parameter for ACM certificate ARN).
11. Tagging: Add `Environment: Production` tag to **all** resources that support tags.
12. Lambda rotation:
    - Include an AWS::Lambda::Function resource (inline ZipFile Python) that rotates the SecureString parameter in Parameter Store on a schedule (AWS::Events::Rule). The function must assume an IAM role limited to `ssm:PutParameter`/`ssm:GetParameter` for the specific parameter path and write CloudWatch logs.
13. Outputs: Provide meaningful Outputs: VpcId, PublicSubnetIds, PrivateSubnetIds, LoadBalancerDNS, RDS Endpoint, S3BucketForTrail.
14. Validation: Template must be compatible with `cfn-lint`. Add a `ValidationSummary` at the end (see system prompt).

Constraints:
- Use CloudFormation JSON syntax only.
- Region: us-west-2.
- All names, tags, and Parameter names must match above when applicable.
- Use Parameters for any deploy-time specifics (AMI ID, InstanceType, DB engine choice, DB instance class, Certificate ARN, AllowedSSH CIDR default).
- Minimize use of long arbitrary strings — prefer Parameters with safe defaults.
- Where secrets are required, use SSM SecureString and KMS encryption.
- Include reasonable Conditions and mappings where helpful (e.g. AZ mapping).

Expected output:
- A single self-contained JSON CloudFormation template that can be fed to `aws cloudformation validate-template` and then checked with `cfn-lint`.
- After the JSON template output, append a compact JSON object `"ValidationSummary"` containing:
  - `cfnLintCommand`: suggested cfn-lint CLI command (with profile/region placeholders).
  - `majorSecurityConsiderations` (array of up to 6 items).
  - `howToRunUnitChecks` (array of steps for running cfn-lint and basic checks).
Do not include any extra prose outside the JSON template and the required `ValidationSummary` JSON object. If any requirement cannot be implemented in pure CloudFormation (e.g., enforcing MFA for IAM users creates operational constraints), implement the closest possible policy document and clearly encode it in the template.