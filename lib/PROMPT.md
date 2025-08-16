Create consistent infrastructure for multiple environments in AWS using Terraform in us-west-2 region
Your task is to configure production, staging, and development environments, each isolated in its own VPC, using Terraform's HCL language. 
The main requirements are as follows: \n1. Each environment must be implemented in a separate VPC. \
 \n4. Implement a tagging strategy for resources, which includes tags like 'Environment', 'Owner', and 'Purpose'. 
 \n5. Network ACLs should be defined to prevent cross-environment traffic. 
 \n6. Use different instance types in the environments to optimize costs: t2.micro for dev, t3.medium for staging, and m5.large for production. 
 \n7. Define input variables to control environment details, such as CIDR block sizes. 
 \n8. Consistent IAM roles and policies must be applied across environments to ensure secure access. 
 \n9. And the major requirement is to have only single state file for all the three environments. 
 \n10. cloud watch monitoring and logging resources are not needed as per the task requirement.
 \n11. There is no encryption needed at rest and in transit.
 \n12. Use for for_each function is allowed.
I want to put complete code in tap_stack.tf file which must have all variables declarations, existing values and logic and outputs as well. I already have provider.tf file which has providewr information. 
2. I am using aws_region variable to pass region value in provider.tf file so manage this variable declaration accordingly in tap_stack.tf 
3. I need tap_stack.tf in a way, it should create all modules instead of pointing anything to existing one. I am going to create brand new stack 
4. Terraform logic should match what exactly is needed and with best practices
