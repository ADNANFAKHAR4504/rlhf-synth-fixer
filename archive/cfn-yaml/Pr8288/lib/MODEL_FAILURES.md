Key problems at a glance

Uses Parameters (AllowedSSHIp, InstanceType) despite the “no parameters at deploy” rule.

Broken NLB access model: attempts to use an SG to gate NLB traffic; Network Load Balancers don’t use security groups → targets won’t receive traffic.

Weak/useless region guard: stack still deploys outside us-east-1.

Incorrect S3 policy ARNs in IAM: references bucket names instead of ARNs.

Over-opinionated KMS: introduces a CMK and static alias; increases failure surface and collision risk vs. AWS-managed encryption used in the ideal.

Name collisions likely (secure-nlb, secure-tg, alias/secure-infrastructure).

Blocking / Schema & Deployability Issues
A) Violates “no parameters” requirement

Where: Parameters: AllowedSSHIp, InstanceType.

Impact: Contradicts the explicit constraint. Defaults don’t fix the policy requirement to have no parameters at all.

Fix: Remove the entire Parameters section. Hardcode SSH CIDR (203.0.113.10/32), use t2.micro, and keep everything self-contained (as in the ideal).

B) NLB traffic won’t reach targets

Where: NLBSecurityGroup + PrivateInstanceSecurityGroup uses SourceSecurityGroupId: !Ref NLBSecurityGroup for port 8080.

Impact: NLBs don’t attach security groups; traffic arrives with the client source IP, not an SG. That rule won’t match → targets stay unhealthy.

Fix: Allow the application port on the instances from an appropriate CIDR (commonly 0.0.0.0/0 for internet-facing NLBs) or from VPC CIDR if fronted differently. (The ideal allows 0.0.0.0/0 for port 80 and explains why.)

C) Region guard doesn’t guard

Where: Conditions: IsUSEast1 + RegionCheck (AWS::CloudFormation::WaitConditionHandle) with the condition.

Impact: If not in us-east-1, other resources still create; the handle does nothing. No hard fail.

Fix: Either apply the condition to every resource (as the ideal does) or add a small “hard-fail” construct (e.g., a Mappings check with an invalid reference when IsUSEast1 is false). Keep it simple: condition every resource.

D) IAM policy resources for S3 are wrong

Where: In EC2LeastPrivilegePolicy:

Resource: !Sub "${SecureS3Bucket}/*"

Resource: !Ref SecureS3Bucket


Impact: Those resolve to bucket names, not ARNs → policy doesn’t authorize correctly.

Fix:

- "arn:${AWS::Partition}:s3:::${SecureS3Bucket}"
- "arn:${AWS::Partition}:s3:::${SecureS3Bucket}/*"

Security & Compliance Deviations

Excess CMK usage & alias collisions
Introduces a customer-managed KMS key and alias/secure-infrastructure. This increases operational overhead and can fail if alias already exists. The ideal uses service-managed encryption for logs and SSE-S3 for the bucket (meeting requirements).
Fix: Remove CMK/alias unless strictly required; rely on AWS-managed encryption paths.

Overly permissive SG on NLB path but ineffective
A “NLB SG” is defined but can’t be attached to the NLB (invalid concept). The private instance rule referencing that SG is ineffective.
Fix: Delete NLBSecurityGroup. Permit the application port on instances as explained above; keep SSH locked to the single IP.

Architecture / Functional Gaps vs. Ideal

NLB health checks will fail due to SG issue → the target group will be unhealthy and traffic will not flow.

Region scoping is inconsistent (only the handle has the condition). The ideal conditions all resources.

Idempotency & Naming Risks

Fixed names: secure-nlb, secure-tg, and KMS alias alias/secure-infrastructure can collide across stacks/accounts.
Fix: Omit names or suffix with ${AWS::StackName} to avoid AlreadyExists errors.

Best-Practice Notes

The ideal sticks to parameter-free, predictable AZ selection (!GetAZs/!Select), avoids unnecessary KMS, and explains why private instances expose the app port broadly for an internet-facing NLB (which preserves client IP).

If stricter exposure is required, document and constrain via NACLs or segment routing, but SG-to-NLB matching is not a thing.

Outputs & Testing

Outputs are generally fine, but they rely on parameters . Once parameters are removed, keep tests purely descriptive 

Quick Fix Patch List

Delete Parameters:; hardcode 203.0.113.10/32 and t2.micro.

Delete NLBSecurityGroup and the SourceSecurityGroupId rule; instead allow instance app port 8080 from 0.0.0.0/0 .

Condition every resource with IsUSEast1 

Fix S3 IAM policy ARNs to use bucket ARNs, not names.

Remove CMK and alias (use service-managed encryption and SSE-S3 like the ideal) or add full service principals and collision-safe aliasing.

Make names collision-safe: drop explicit names or append ${AWS::StackName}