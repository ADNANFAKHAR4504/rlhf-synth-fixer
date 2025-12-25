got a fintech client that needs to migrate their payment processing setup asap. right now everything is in one availability zone on 10.0.0.0/16 - payment gateway running on t3.large boxes and postgres on db.t3.medium. if that zone dies their whole payment system goes offline which is not acceptable

need to build a new multi-AZ environment on 172.16.0.0/16 so we can migrate them over without any downtime. they process payments 24/7 so cant interrupt anything

they want cloudformation json templates - their ops team doesnt use yaml. theyre super paranoid about PCI compliance and security. also keep bugging me about data transfer costs so lets use vpc endpoints for s3 stuff

thinking we need a vpc in us-east-1 with 3 public subnets and 3 private subnets across different AZs. each private subnet gets its own nat gateway for redundancy - dont want a single nat gateway being a failure point

for security groups need one for the web tier that accepts port 443 from the internet, and another for the database tier that only accepts postgres traffic on port 5432 from the web tier security group. super important - the database sg cannot have 0.0.0.0/0 allowed or the security team will reject it

also need an s3 bucket to store migration logs with versioning and encryption enabled. attach an s3 vpc endpoint to avoid data transfer charges when writing logs

parameterize the cidr blocks and add an environment suffix parameter so we can spin up copies in dev staging and prod without naming collisions

tag everything with Environment Project and Owner tags per company policy

outputs need vpc id all the subnet ids and security group ids because the next step is deploying the actual ec2 instances and rds which will reference these

the flow is: internet -> alb in public subnets -> ec2 instances in private subnets -> rds in private subnets. private subnets route outbound through nat gateways. public subnets route through internet gateway
