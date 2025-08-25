The response seems to be incomplete, as I am getting an error with RetentionInDays

The stack deployed successfully, but it only created the basic networking infrastructure (VPC, subnets, security groups,
NAT gateways, etc.). None of the resources that depend on the AMI mappings were created - I notice there are no EC2 instances, Launch
Templates, Auto Scaling Groups, Load Balancers, RDS instances, etc.

This happened because I provided a simplified version of the template that only included the core networking components. The full template
with all the compute resources (EC2, RDS, ALB, etc.) that depend on the AMI mappings wasn't included in the deployment.

The invalid AMI IDs would have caused failures if we tried to create resources that depend on them, like Launch Templates or EC2
instances. Should I update the template with valid AMI IDs and redeploy the complete infrastructure?
