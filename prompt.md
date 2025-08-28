Subject: Help with a new AWS CDK Go project for Production

Hey,

Hope you're having a good week.

I'm starting to spec out a new AWS environment for our production services, and I'd love to get your help building it out with the Go CDK. The main goal is to create a really solid, secure baseline that we can build on top of.

Here's a rundown of what I'm thinking:

We're standardizing on `us-east-1` for this, so everything should land there. And to keep our billing and resource management sane, could you make sure every resource gets tagged with `Environment: Production` and `Department: IT`? That's a big one for us.

For the network, a basic VPC with public and private subnets across two AZs should be perfect for availability. Nothing too fancy.

Inside the VPC, we'll need a web-facing EC2 instance (a `t3.micro` is fine for now) in a public subnet. My main concern here is security, so could you make sure its security group is locked down to only allow HTTPS traffic from the outside world? We should also give it a basic IAM role, just to follow the principle of least privilege from the start, even if it doesn't have any specific permissions yet.

On the backend, we'll need a PostgreSQL RDS instance. To keep it safe, it should be tucked away in the private subnets. A non-negotiable for us is that the database **must have encryption at rest enabled**.

The most critical piece is the connection between the web server and the database. I want to make sure that the EC2 instance is the _only_ thing that can communicate with the database. Could you set up the security group rules so that the database only accepts traffic from the web server's security group on the postgres port? That's super important.

Lastly, for our audit trail, we need CloudTrail running to log all API calls.

The dream output here is a single, clean `main.go` file with the complete CDK stack. Something that's well-commented and easy for the rest of the team to understand and deploy.

Let me know what you think. Really appreciate your expertise on this!

Best,
[Your Name]
