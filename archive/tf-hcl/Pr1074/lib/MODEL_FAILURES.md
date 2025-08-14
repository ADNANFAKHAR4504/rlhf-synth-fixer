Auto Scaling Group Issues
Early file:

hcl
Copy
Edit
resource "aws_autoscaling_group" "app" {
  vpc_zone_identifier  = local.azs  #WRONG
}
vpc_zone_identifier must be a list of subnet IDs, not just AZ names. Passing ["us-west-2a", "us-west-2b"] will fail.

In the final file, you had:

hcl
Copy
Edit
vpc_zone_identifier = aws_subnet.private[*].id
This is correct. So early version would cause either a plan/apply failure or empty ASG.

Integration Test Failures for ASG
The early main.tf did not output the ASG name (output "auto_scaling_group_name") at all.

Tests like:

js
Copy
Edit
const asgName = tfOutputs.auto_scaling_group_name?.value;
expect(asgName).toBeDefined();
would fail because tfOutputs.auto_scaling_group_name was missing.

EBS Encryption Gap
Early aws_launch_configuration did not have any block device mappings with:

hcl
Copy
Edit
encrypted = true
So integration/security tests checking all data-at-rest encryption would fail.
In your final main.tf, we added EBS encryption in the aws_launch_template.

IAM Instance Profile Reference
Early file had:

hcl
Copy
Edit
iam_instance_profile = aws_iam_instance_profile.ec2.name
This is fine, but since you were using aws_launch_configuration, any ASG created from it will need to be recreated if you switch to a launch_template later.

RDS Creation Problems
Early file:

hcl
Copy
Edit
resource "aws_db_instance" "main" {
  engine = "mysql"
  # ...
}
Missing:

allocated_storage (required unless using Aurora).

username / password (or Secrets Manager retrieval).

skip_final_snapshot (important for destroy in CI tests).

This would likely fail during apply, not just in tests.

Outputs
Early file only had:

hcl
Copy
Edit
output "alb_dns_name" {
  value = aws_lb.main.dns_name
}
Missing:

rds_endpoint

auto_scaling_group_name

any other outputs the integration tests expect.

Misc Security & Compliance Failures
Early file uses aws_launch_configuration instead of aws_launch_template → cannot set ebs_encryption easily and is considered legacy by AWS.

No explicit S3 bucket versioning enabled (some security tests check for it).

ALB SG allows 0.0.0.0/0 on port 80 — may be flagged by security scans.

Missing ALB HTTPS listener (tests may require HTTPS).
