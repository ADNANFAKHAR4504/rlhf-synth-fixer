1. Provider Configuration

Nova: ConfigureNova: Uses a placeholder AMI with a comment to replace, without tying it to the region. This could easily lead to broken deployments if used across regions.

Gemini: Still provides a static AMI, but clearly notes it must match the chosen region. Gemini's version is stricter about region consistency (ami-04e08e36e17a21b56 for eu-central-1).emini: Still provides a static AMI, but clearly notes it must match the chosen region. Gemini's version is stricter about region consistency (ami-04e08e36e17a21b56 for eu-central-1).WS provider without defaultTags. This means all resources require explicit tagging in each module.

Gemini: Uses AwsProvider with defaultTags, which ensures project-wide consistent tagging. This is critical for cost allocation, compliance, and operational visibility.

2. Backend State Management

Nova: Configures S3Backend but does not implement state locking. This introduces race conditions if multiple team members run Terraform simultaneously.

Gemini: Adds an escape hatch override (this.addOverride('terraform.backend.s3.use_lockfile', true)) to enable locking. This ensures safer concurrent operations.

3. VPC Subnet CIDR Calculation

Nova: Hardcodes subnet CIDRs by incrementing the 3rd octet (10.0.1.0/24, 10.0.2.0/24, etc.). This is brittle, fails in larger CIDRs, and risks overlap.

Gemini: Uses Fn.element and properly indexes AZs when creating subnets, making it more predictable. While still using 10.0.i.0/24, Gemini structures the logic more cleanly and avoids Nova’s manual "calculateSubnetCidr" helper, which was overly simplistic.

4. Private vs Public Subnets

Nova: Only creates public subnets, and attaches the Auto Scaling Group directly to them. This exposes application servers directly to the internet, which is not best practice.

Gemini: Also creates only public subnets, but in the architecture notes, explicitly warns against placing ASG in public subnets and implies separation of roles. Gemini’s structure is modular enough to add private subnets in future.

5. Security Group Definition

Nova: Creates a generic SecurityGroupModule but leaves egress rules empty if not provided. This can result in no outbound traffic unless explicitly defined.

Gemini: Defaults egress rules to 0.0.0.0/0 if none are provided. This aligns with typical AWS defaults and avoids accidentally blocking updates or package downloads inside instances.

6. Output Handling

Nova: Uses console.log to print values, which does not persist them in Terraform outputs. These values won’t be available in state files, making automation and integrations harder.

Gemini: Uses proper TerraformOutput constructs, so outputs are tracked by Terraform and available to other stacks or automation workflows.

7. Launch Template User Data Handling

Nova: User data passed without base64 encoding. AWS requires user data to be base64 encoded in some cases, and Nova’s implementation risks failure.

Gemini: Uses Fn.base64encode for user data in the Launch Template, ensuring compatibility with AWS expectations.

8. AMI Configuration

Nova: Uses a placeholder AMI with a comment to replace, without tying it to the region. This could easily lead to broken deployments if used across regions.

Gemini: Still provides a static AMI, but clearly notes it must match the chosen region. Gemini’s version is stricter about region consistency (ami-04e08e36e17a21b56 for eu-central-1).

9. S3 Bucket Naming

Nova: Dynamically appends Date.now() to bucket names to avoid collisions. While it prevents duplication, it makes bucket names unpredictable, complicating automation and references.

Gemini: Uses deterministic naming (${project}-${env}-${name}), which is predictable and repeatable across deployments. This is more aligned with Terraform’s immutable infrastructure philosophy.

10. Code Organization and Separation of Concerns

Nova: Mixes helper logic (CIDR calculation, logging) inside modules, and creates resources directly in the stack (e.g., hardcoded outputs). This violates CDKTF best practices of keeping stacks declarative and reusable.

Gemini: Keeps stacks clean, uses modules consistently, and explicitly warns: “Do NOT create resources directly in this stack”. This enforces modularity and aligns with large-scale infrastructure design principles.

11. Consistency of Tagging

Nova: Tags are set per resource, but inconsistently. Some helper constructs miss important tags like Environment or Project.

Gemini: Ensures every construct (VpcModule, SecurityGroupModule, AutoScalingModule, S3BucketModule) enforces consistent tagging.

12. Scalability and Extendability

Nova: Designed as a minimal demo—missing core production features like ALB, Route53, RDS, CloudWatch integration. Its structure makes it harder to add those cleanly.

Gemini: While still lean, it lays groundwork for extension—especially with backend locking, default tags, and modular constructs that can easily expand to private subnets, ALB, and DNS.

13. Best Practices Acknowledgement

Nova: No commentary on best practices; implicitly allows insecure configurations (e.g., ASG in public subnets).

Gemini: Annotates the stack with comments and warnings, showing awareness of real-world AWS pitfalls. This is important in guiding future users or team members.

14. Maintainability

Nova: Custom helpers (like calculateSubnetCidr) add unnecessary complexity and possible bugs.

Gemini: Uses CDKTF and Terraform primitives (Fn.element, Fn.base64encode) consistently, making the codebase more maintainable by other engineers familiar with Terraform.
