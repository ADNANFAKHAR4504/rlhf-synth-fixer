so the payments team wants us to set up the network for their new payment gateway thing and they're being super particular about security since its PCI compliance stuff. need to use cloudformation json (not yaml - ops team requirement)

basically need a vpc in 10.0.0.0/16 across 3 AZs in us-east-1. they want a 3-tier setup - public subnets for load balancers, private subnets for app servers that need to hit external apis, and completely isolated subnets for the database layer that should have ZERO internet access

subnet breakdown they gave me:
- public: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
- private: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
- isolated: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24

need nat gateways in all 3 AZs for redundancy - they're paranoid about single points of failure. each private subnet should route through its own AZ's nat gateway

the security team is requiring vpc flow logs with cloudwatch integration (7 day retention) and network ACLs with explicit deny defaults. also want an s3 gateway endpoint attached to the private and isolated route tables to avoid data transfer costs

make sure to add an environmentSuffix param so we can deploy this to different envs and tag everything with Environment=Production and Project=PaymentGateway for their cost tracking

outputs should export the vpc id, all the subnet ids, route table ids, and nat gateway ids since other teams will need to reference them

oh and the isolated subnets routing - make absolutely sure those route tables dont have ANY internet routes. compliance will reject this if the db tier can reach the internet
