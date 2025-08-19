### AWS stack to create a comprehensive security environment
You are an AWS professional. Design a CDK Stack to create a comprehensive security environment for a new AWS-based application deployment. 
The security settings must adhere to the following requirements: 
1. All IAM roles must include trust policies for allowed principals. 
2. Encrypt all EBS volumes and RDS instances using AWS KMS. 
3. Ensure public S3 buckets have policies restricting public 'PUT' actions. 
4. Implement MFA for all IAM users and ensure access keys are rotated regularly (Every 90 days). 
5. Use AWS WAF for Load Balancer protection against web threats. 
6. Assign read-only S3 permissions to EC2 instance profiles. 
7. Encrypt CloudTrail logs and securely store them. 
8. Allow message reception by SNS only from authorised AWS services. 
9. Security groups must strictly limit inbound connections, only allowing SSH from specified IPs. 
10. 10. Global GuardDuty enablement across all regions.
11. Allow only necessary ingress traffic, specifically restrict SSH access to known IPs.
12. The stack should be deployable in us-west-2 and us-east-2 regions, with resources named according to the pattern 'prod-<resource_name>' for production and 'dev-<resource_name>' for development environments.

The expected output is a CDK stack with the class name TapStack and a file named tap-stack.ts