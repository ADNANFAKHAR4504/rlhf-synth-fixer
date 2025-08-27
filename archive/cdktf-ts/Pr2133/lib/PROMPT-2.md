Now that we have the baseline infrastructure, we need to add a secure way for our developers to access the database in the private subnet for debugging and maintenance.

Please add a bastion host (a small EC2 instance) to the public subnet. This host should be the only machine allowed to connect to the RDS instance's PostgreSQL port (5432).

Make sure the bastion host's security group is configured correctly to allow SSH access from our corporate IP, and that the RDS security group is updated to only allow inbound traffic from the bastion host.
