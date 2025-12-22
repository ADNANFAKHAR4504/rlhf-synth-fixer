# Prompt: 

Generate **single CloudFormation template named `TapStack.yml`** (YAML format) that builds a **brand-new, secure AWS environment** for a critical application. The template must be fully self-contained (no references to any pre-existing resources) and include **Parameters, Mappings (if needed), Resources, and Outputs** in the same file. All variables/values/logic and outputs belong in this one file.

## What to build (must-haves)

1. **VPC & Networking**

   * Create a new VPC for isolation.
   * Two public subnets and two private subnets across distinct AZs.
   * Internet Gateway attached; NAT Gateway for private egress (best practice).
   * Route tables for public/private subnets wired correctly.
   * **Security Groups**:

     * ALB SG: inbound **443 only** (IPv4/IPv6) and egress as needed.
     * App/EC2 SG: no public ingress; only ALB→EC2 traffic on app port (e.g., 8080) from ALB SG; egress as needed.

2. **Application Load Balancer (ALB) with HTTPS**

   * Place ALB in public subnets.
   * **HTTPS listener (443)** only; attach **ACM certificate ARN** provided via a parameter.
   * Target group in private subnets (even if no instances are created, the TG must exist and be valid).

3. **S3 (critical bucket) with strict access & best practices**

   * Create one **application bucket** (critical) with:

     * **Versioning enabled**.
     * **Default encryption (SSE-S3 or SSE-KMS)**.
     * **Block Public Access** (all four settings).
     * **Bucket policy** locked to the specific IAM role created in this template (and/or EC2 service, see IAM rules below).
   * Create a **centralized log bucket** (for ALB and S3 server access logs), also versioned, encrypted, and with BPA on.
   * Enable **server access logging** for the application bucket to the log bucket.
   * Enable **ALB access logging** to the log bucket (use the modern ALB logging to S3 configuration).

4. **IAM (tight S3 access)**

   * Create one IAM **role for EC2** (assume role trust: `ec2.amazonaws.com`) with an **inline IAM policy** that **allows only**:

     * `s3:ListBucket` on the **application bucket ARN** (no wildcards beyond what’s required for List).
     * `s3:GetObject` and `s3:PutObject` on the **application bucket objects ARN**.
   * Keep the IAM policy concise (max **6** statements in total across all inline statements).
   * Also add a **bucket policy** that **restricts access** so only **this role** (and optionally the `ec2.amazonaws.com` service where strictly necessary) can access the bucket—no public, no cross-account.
   * Do **not** reference any existing role outside this stack; the stack creates and uses its own role.

5. **Naming convention & tags**

   * Every resource name must follow: `"<project>-<resource>-<environment>"`.

     * Example: `tapstack-vpc-prod`, `tapstack-alb-prod`, etc.
   * Tag **all resources** with: `Environment`, `Project`, and `Owner`.
   * Use a consistent Tag set at resource level (where supported) to ensure coverage.

6. **Logging & auditability**

   * S3 server access logs → log bucket.
   * ALB access logs → log bucket.
   * (Optional but preferred) Add **CloudTrail** with at least **S3 data events** for the application bucket into the log bucket if possible within the same template—keep it simple and secure.

7. **Parameters (make the stack easy to customize)**

   * `Project` (default e.g., `tapstack`), `Environment` (e.g., `dev|staging|prod`), and `Owner` strings.
   * `BucketName` and `BucketRegion` (for the **application bucket**).
   * `AcmCertificateArn` (for ALB HTTPS).
   * (Optional) `AppPort` (default `8080`) for target group health/ALB→EC2 SG rule.
   * Add helpful `AllowedValues`/`AllowedPattern` and `Description` fields.

8. **Outputs**

   * Output the **application bucket ARN**, **log bucket ARN**.
   * Output the **IAM role name** and **role ARN**.
   * Output the **ALB ARN** and **ALB DNS name**.
   * Output the **VPC ID** and **private/public subnet IDs**.
   * Make output keys stable and descriptive.

9. **Macros**

   * If any complex transformations are helpful (e.g., name templating), you may use **CloudFormation Macros**—but prefer native intrinsics (`Fn::Sub`, `Fn::Join`, `Fn::If`, `Conditions`) first. If a Macro is not strictly necessary, don’t use it.

10. **Quality bar**

    * **Single file**: everything in `TapStack.yml`.
    * **Brand-new stack**: do not import or depend on pre-existing resources (except the ACM cert ARN, which is passed in).
    * **cfn-lint clean**: valid, deployable YAML with no placeholders or TODOs.
    * Minimal inline policies (≤ **6** statements total).
    * Keep the template readable with logical logical names and comments where it actually helps.

## Variable-driven naming

* Derive every resource **Name** from `Project` and `Environment` and a meaningful resource token, e.g.:

  * `!Sub "${Project}-vpc-${Environment}"`
  * `!Sub "${Project}-alb-${Environment}"`
  * `!Sub "${Project}-app-bucket-${Environment}"`
  * Apply the same pattern to all named resources that support a `Name` (or similar) property.

## Deliverable

* Return **only** the YAML content of **`TapStack.yml`** in a single fenced code block.
* No extra commentary before or after.
* The template should **implement exactly** the items above, with sensible defaults, and be ready to deploy as-is.