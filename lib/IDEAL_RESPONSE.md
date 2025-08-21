# Ideal Response

The generated CloudFormation template must:

1. **IAM Roles** — Use least privilege policies, only allowing necessary actions (e.g., logging for EC2/Lambda).
2. **EC2 Instances** — Launch within private subnets, with **encrypted EBS volumes**, no public IP, and access restricted to `192.168.0.0/16`.
3. **S3 Buckets** — Configured with **AES-256 SSE** by default and restrictive bucket policies limiting access to the allowed IP range.
4. **RDS Instances** — Encrypted, deployed only within the specified VPC/subnets, and not publicly accessible.
5. **Lambda Functions** — Allocated at least **128MB memory**, attached to the VPC, and minimally privileged IAM roles.
6. **Security Groups** — Must not allow `0.0.0.0/0` for SSH; ingress restricted to `192.168.0.0/16`.
7. **CloudTrail/CloudWatch** — Logging of **all API activity**, stored securely in an encrypted S3 bucket.
8. **Tagging** — All resources tagged with `Environment: Production`.
9. **Naming Conventions** — Use `prod-*` prefixes where applicable.

The template should pass a standard AWS security/compliance audit and be deployable in `us-east-1`.
