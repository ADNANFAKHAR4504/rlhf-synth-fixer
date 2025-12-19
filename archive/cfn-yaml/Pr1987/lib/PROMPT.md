# CloudFormation Secure Environment Setup

### Goal
We want a CloudFormation template written in YAML that builds a production-ready environment in `us-east-1`.  
The setup should follow security best practices and meet our internal compliance rules.

---

### What we need
- IAM roles should only have the permissions they actually require. No broad policies.
- EC2 instances:
  - must use encrypted EBS volumes
  - should only launch in controlled subnets
  - network access limited to our internal CIDR: 192.168.0.0/16
- S3 buckets:
  - encryption turned on by default
  - no open/public access
- RDS:
  - placed inside the VPC we define
  - storage encrypted
- Lambda:
  - allocate at least 128 MB memory
  - run inside the VPC
- Security groups:
  - never allow public SSH
  - only allow inbound traffic from 192.168.0.0/16
- CloudWatch/CloudTrail:
  - capture all API calls
  - log data should be encrypted

---

### Tagging and naming
All resources should be tagged with:

```yaml
Environment: Production
