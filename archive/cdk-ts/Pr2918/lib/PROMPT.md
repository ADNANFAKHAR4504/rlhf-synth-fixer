### Purpose
Create a secure, production-ready AWS CDK v2 TypeScript stack deployable to `us-west-2` that adheres to strict security and compliance requirements.

### Inputs
- environment: Production
- allowedIpRanges: ["203.0.113.0/24"]   # CIDRs for HTTPS/SSH access
- certArn: "arn:aws:acm:us-west-2:123456789012:certificate/abc123"
- kmsAlias: "alias/gocxm-prod"

### Constraints
- Region: us-west-2
- All resources tagged: Environment=Production, Security=High
- IAM roles: least privilege only
- All sensitive data encrypted with AWS KMS
- EC2 instances in private/isolated subnets, no public IPs
- Bastion host in public subnet; SSH restricted to allowedIpRanges
- ALB/HTTPS only, security group restricts ingress to allowedIpRanges
- API Gateway logging enabled; logs retained for 90 days
- WAF in front of ALB
- AWS Shield enabled for DDoS protection
- S3 buckets with SSE-KMS encryption
- AWS Config enabled for compliance tracking
- CloudWatch/EventBridge security alerts via SNS
- GuardDuty enabled for continuous monitoring

### Outputs
- A single TypeScript file: `lib/<project-name>-stack.ts` (CDK v2)
- Inline comments for each security-relevant resource
- A validation checklist appended at the end

### Tone
Concise, production-ready, and security-first.  
All code must include comments explaining security rationale.

### Validation Checklist
- [ ] Stack deployed in `us-west-2`
- [ ] All resources tagged correctly
- [ ] IAM policies least privilege
- [ ] KMS key created and used (S3, Config, etc.)
- [ ] EC2 instances private/isolated (no public IPs)
- [ ] Bastion host restricted to whitelisted IPs
- [ ] API Gateway logs active (90-day retention)
- [ ] WAF associated with ALB
- [ ] GuardDuty enabled
- [ ] AWS Shield protection applied to ALB
- [ ] AWS Config active with delivery channel
- [ ] Security alerts routed to SNS
