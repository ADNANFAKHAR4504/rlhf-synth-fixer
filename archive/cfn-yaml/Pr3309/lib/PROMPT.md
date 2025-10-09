A startup expects around 3,000 daily users and needs a reliable yet cost-efficient web infrastructure. The system should balance incoming traffic, keep uptime high, and include basic monitoring.

Build the setup using CloudFormation with the following:

    •	VPC (10.0.0.0/16) for networking
    •	Application Load Balancer handling HTTP (port 80)
    •	EC2 t3.micro instances for compute
    •	Security Groups allowing HTTP and SSH
    •	S3 bucket for serving static assets
    •	CloudWatch for monitoring instance health
