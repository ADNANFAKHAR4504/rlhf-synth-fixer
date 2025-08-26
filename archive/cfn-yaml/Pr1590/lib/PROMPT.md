
---

We need to set up secure AWS infrastructure using CloudFormation YAML templates. This has to meet our security and compliance standards.

Key requirements:
1. Deploy everything in us-east-1 region
2. Use AWS KMS for RDS database encryption keys
3. Enable CloudTrail for all management events
4. IAM role should follow least privilege principle
5. S3 buckets need server-side encryption and logging
6. Tag all resources with Environment for auditing

The CloudFormation template should deploy cleanly and meet all these security requirements.

---

