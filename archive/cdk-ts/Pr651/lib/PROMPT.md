I need to create AWS CDK TypeScript infrastructure code that meets comprehensive security requirements across two regions. The solution needs to be production-ready and deployable without manual modifications.

Requirements:
1. Deploy infrastructure across us-west-1 and us-east-1 regions for high availability
2. Tag all resources with 'Environment' and 'Project' tags
3. Create IAM roles following least privilege principle
4. Set up EC2 instances with SSH access restricted to IP range '203.0.113.0/24' only
5. Enable encryption at rest for databases using AWS KMS
6. Ensure no security groups allow unrestricted access on SSH port 22
7. Implement AWS CloudTrail for API logging across both regions
8. Store CloudTrail logs in S3 buckets with access logging enabled
9. Deploy AWS WAF with rules protecting against SQL injection attacks

Additional requirements:
- Use Amazon Inspector code security capabilities for vulnerability scanning
- Implement AWS Security Hub with resource tagging standards
- The infrastructure should include a web application component that needs WAF protection
- Include a database that requires encryption
- All code must pass 'cdk synth' validation and be deployable with 'cdk deploy'

Please provide complete infrastructure code with one code block per file that can be directly copied and deployed.