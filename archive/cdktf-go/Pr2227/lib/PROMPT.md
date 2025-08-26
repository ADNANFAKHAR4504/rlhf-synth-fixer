We need to put together a secure AWS setup using CDKTF + Go. The idea is to have one template, SecureInfrastructure, that we can roll out and know it hits all of our security requirements without any gaps. Everything has to be locked down to match SOC 2 and GDPR expectations, so no sloppy shortcuts and all code should follow monolithic architecture and one main file.

Here’s what I want this stack to handle:

- Every S3 bucket created needs server-side encryption turned on. Data at rest has to be protected by default.
- IAM users should be required to use MFA. We can’t allow login without it.
- IAM roles and policies need to follow least privilege. No blanket `*` permissions, just enough for the role to function.
- Networking should run inside a VPC. Load balancers live in the public subnet, while the actual app servers (EC2s) stay tucked away in private subnets.
- Security groups should be tight — no open '0.0.0.0/0' inbound rules hanging around. Only approved ranges should be allowed.
- All of this has to be built with compliance in mind (SOC 2, GDPR). So think about naming, tagging, and making sure services are deployed in a way that lines up with audit expectations.

The final deliverable is a CDKTF + Go template named SecureInfrastructure.yaml. It should deploy cleanly, validate without errors, and actually enforce all the above when we spin it up. Naming should follow a simple pattern like '[ResourceType]-[Project]-[Environment]' to keep things consistent across environments.
