I need to create AWS infrastructure using CDK TypeScript for a basic web application setup. The infrastructure should include:

1. An S3 bucket with versioning enabled, tagged with 'Environment=dev' and 'Project=SampleProject'

2. An EC2 instance running Amazon Linux 2, deployed in a public subnet with an Elastic IP address, tagged with 'Environment=dev' and 'Project=SampleProject'

3. A security group allowing SSH (port 22) and HTTP (port 80) access from anywhere, tagged with 'Environment=dev' and 'Project=SampleProject' 

4. Basic VPC infrastructure with a public subnet, internet gateway, and route table

5. Stack outputs showing the S3 bucket name and EC2 instance public IP

Please use the EBS gp3 volume type for the EC2 instance root volume for better performance. Also ensure the security group follows AWS best practices.

Generate the infrastructure code as separate files, with one code block per file.