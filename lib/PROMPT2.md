The goal is to implement the multi-region fault-tolerant infrastructure.  
We need two stacks, one in us-east-1 and one in us-west-2, to achieve redundancy.  

The Java code should set up VPCs, subnets, load balancers, auto scaling groups, RDS with Multi-AZ, S3 logging buckets, IAM roles, and CloudWatch alarms.  
DNS should be managed through Route 53 for failover.  

Tests must be added to confirm that the stacks create the expected resources. The CDK project should compile, build, and deploy without errors in CI/CD.
