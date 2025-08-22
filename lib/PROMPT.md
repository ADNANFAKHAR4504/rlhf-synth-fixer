I need a CloudFormation YAML template that sets up a small AWS environment in the `us-west-2` region. Please return just the template, no explanation text.  

Here’s what the stack should include:  

- An S3 bucket with versioning turned on. The bucket name should be configurable via a parameter.  
- An EC2 instance that runs inside a specific VPC and subnet (these should be passed in as parameters). The instance type should also be a parameter.  
- Attach an IAM role to the EC2 instance that only grants `s3:ListBucket` permissions.  
- A security group for the instance that only allows inbound SSH from one fixed IP address (this IP should be parameterized).  
- A CloudWatch alarm that triggers if the instance’s CPU usage goes above 70%.  
- A DynamoDB table with a configurable table name, a primary key, and a read capacity of 5.  
- All resources must be tagged with `Project: CloudSetup`.  

Keep the template clean and properly structured, using parameters wherever possible. Name the file `TapStack.yml` and return the contents in one YAML code block.  
