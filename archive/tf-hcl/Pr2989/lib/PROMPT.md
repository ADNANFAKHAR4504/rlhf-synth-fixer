Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in two different regions us-east-2 and us-west-1. So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary and 10.1.0.0/16 for the secondary region. Please make us-east-2 primary and us-west-1 as secondary.
2. VPCs should have  private and  public subnets in each VPC for each region. Also  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements.Implement high availability with at least three availability zones, automatic failover, and robust redundancy plans.
3. Define IAM roles and policies ensuring that the principle of least privilege is applied. Use managed IAM policies wherever possible and custom policies only when necessary.
4. Give Byte size 4 suffix with each resource so that stack dont get error of "resource already exists".
5.  Define and apply S3 bucket policies to enforce encryption and restrict public access. 
6.  Implement multi-factor authentication (MFA) for users accessing sensitive resources.
7.  Implement Individual RDS in each region but with multiple AZ support for respective regions. Use  random master user name of length 8 without special characters and it should start with alphabet.  and master random password of length 16 with special characters. Make sure not to use any special characters which aws doesn't allow for RDS.  Also snapshot or deletion protection is not needed for RDS. Use AWS secrete manager to store these username and password in each regions respectively. Ensure that all RDS instances are set to not be publicly accessible. Configure RDS instances for automatic minor version upgrades to maintain database efficiency and security. Configure Multi-AZ deployments for RDS instances to ensure high availability.
8. Encrypt data at rest for RDS instances using AWS Key Management Service (KMS). 
9. Create resource-based policies to grant specific access from Lambda functions to DynamoDB
10. Set up CloudWatch alarms for monitoring any unauthorized API activity. 
11. Integrate AWS Shield for basic DDoS protection on exposed endpoints
12. Ensure CloudTrail logging is enabled to audit API calls and any changes in the environment. 
13. Deploy a Web Application Firewall (WAF) with rules against common attacks. 
14. Securely manage sensitive configuration data using AWS Parameter Store or Secrets Manager to store RDS username and password.
15. Enable GuardDuty for ongoing security threat detection and notifications
16.  Use AWS Config to document the deployed resources and ensure compliance with security standards. 
