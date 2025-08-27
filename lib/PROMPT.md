Subject: Quick question about a new AWS setup (CDK Go)

Hey,

Hope you're having a good week.

I'm mapping out the infrastructure for a new project and was hoping to get your expertise. We're planning to use the Go CDK to stand up a new production environment, and the goal is to get a secure and scalable foundation in place from day one.

Here are the key things we need:

- **Region & Tagging:** Everything needs to be in `us-east-1`. Also, can we make sure every single resource gets tagged with `Environment: Production` and `Department: IT`? This is a huge help for our cost allocation.

- **Networking:** A standard VPC with public and private subnets across two AZs should be perfect. No need for anything overly complex right now.

- **Web Server:** We'll need an EC2 instance (a `t3.micro` is fine to start) in one of the public subnets. The big thing here is locking it down. Can you make sure its security group only allows inbound HTTPS traffic from the internet? It should also have a basic IAM role attached, just so we're following best practices from the get-go.

- **Database:** For the database, let's go with a PostgreSQL RDS instance. It absolutely needs to be in the private subnets, and it's critical that **encryption at rest is enabled**. This is a hard requirement for us.

- **Connectivity:** This is the most important part. The web server needs to be the _only_ thing that can talk to the database. Could you wire up the security groups so the RDS instance only allows traffic from the EC2's security group on the PostgreSQL port?

- **Auditing:** Lastly, we need CloudTrail enabled to keep an eye on all API activity.

The ideal deliverable would be a single, clean `main.go` file that defines the whole stack. If you could add some comments to explain the key parts, that would be amazing for the rest of the team.

Thanks a bunch for your help on this!

Cheers,
[Your Name]
