Prompt is
```
I'm starting a new project and I need to build out our core infrastructure on AWS. I was hoping you could help me by writing a CloudFormation template in YAML to get everything set up.

The main goal is to create a fully operational and secure environment that spans three different AWS regions: us-east-1, us-west-2, and eu-west-1.

Here are the key things we need in each of those regions:

First, for the networking, each region needs its own VPC. We have specific CIDR blocks picked out: 10.0.0.0/16 for us-east-1, 10.1.0.0/16 for us-west-2, and 10.2.0.0/16 for eu-west-1. Inside each VPC, I want to have a standard setup with both public and private subnets, and these should be spread across two availability zones to make sure we're resilient.

For the application itself, we'll need an internet-facing Application Load Balancer in each region to distribute traffic. It's crucial that this ALB handles HTTPS termination to keep things secure. The EC2 instances, which will run our app, should be placed safely in the private subnets. We'll also need them to be part of an Auto Scaling Group so they can handle load spikes automatically.

We'll also need a place for logs and other data, so could you please add an S3 bucket in each region? Just make sure that versioning is enabled on those buckets right from the start.

Finally, let's talk about security. The EC2 instances will need an IAM role, and it should be set up with the absolute minimum permissions they need to function (least privilege). We're planning to use AWS Secrets Manager to handle our database credentials, so the IAM role will need permission to access that. You don't have to create the RDS database in this template, but please make sure you add the necessary security group rules so the EC2 instances can connect to it later.

Could you wrap all of that up into a single, clean CloudFormation YAML file that's ready for deployment? I just need the final code, no extra explanations needed.
```