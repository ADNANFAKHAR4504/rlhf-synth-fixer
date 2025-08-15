## AWS Cloud Migration
You are an expert in Terraform and AWS, to perform an environment migration for a critical business application to AWS. The infrastructure should meet the following specifications: 
1. The setup should be performed in both `us-west-2` and `us-east-2` regions.
2. All resources must be configured for high availability with failover capabilities.
3. Networking should be established through VPCs, with segregated public and private subnets.
4. Use AWS Secrets Manager for managing environment secrets.
5. Data transmissions must use TLS for encryption in transit.
6. Tag resources with 'Environment:Production' and 'Project:Migration'.
7. Ensure automated backups are configured for databases using Amazon RDS with a retention period of 7 days.
8. Implement IAM roles to restrict access to least privileges necessary.
9. Configure CloudWatch for monitoring and alerting.
10. Make sure that no credentials or sensitive information are hardcoded.
11. All the code has to be in a single file called `tap_stack.tf` in the `lib` directory.
12. Ensure rollback capabilities using Terraform in case of deployment failure.
13. We should expect AWS aliases for the regions to be provided in a `provider.tf` file (The `provider.tf` will be provided).