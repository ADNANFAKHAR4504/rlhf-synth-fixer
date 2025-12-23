hey so we need to migrate our fintech client's payment infrastructure and its kind of urgent. right now everything is running in a single AZ which is obviously not great - they literally have everything on 10.0.0.0/16 with their payment gateway on some t3.large instances and postgres db on db.t3.medium. if that zone goes down they're completely offline which is terrifying for a payment processor

we need to build them a proper multi-AZ setup in 172.16.0.0/16 before we start the migration. cant take anything down during the move obviously since they process transactions 24/7

client wants cloudformation json templates (not yaml) and they're really paranoid about security since they need to stay PCI compliant. also they keep asking about data transfer costs so we should probably use vpc endpoints for s3

here's what i'm thinking:

need a new vpc in us-east-1 with 3 public and 3 private subnets spread across availability zones. each private subnet needs its own nat gateway for redundancy - cant have a single nat be the point of failure

for security groups we need one for the web tier (port 443 from internet) and one for the database tier (port 5432 but ONLY from the web tier sg, not from anywhere else). really important that the db sg doesnt allow connections from 0.0.0.0/0 or security team will lose it

also need an s3 bucket for migration logs with versioning turned on and encryption enabled. should use the s3 vpc endpoint to keep costs down

make sure to parameterize the cidr blocks and add an environment suffix param so we can deploy this to dev/staging/prod without conflicts

oh and tag everything with Environment, Project, and Owner tags - thats in our tagging policy

outputs should include the vpc id, all the subnet ids, and the security group ids since we'll need those for the next phase when we actually deploy the instances

let me know if you need any clarification on the networking setup
