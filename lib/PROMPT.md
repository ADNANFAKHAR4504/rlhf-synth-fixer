got a new fintech client launching their payment processing platform and they need the network setup to be PCI compliant from day one. networking team already gave us 10.0.0.0/16 to work with and wants us to use cloudformation json (their standard)

need to build a classic 3-tier architecture across 3 AZs in us-east-1. public subnets for load balancers, private subnets for app servers, and database subnets that are completely isolated from the internet

subnet breakdown:
public - 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
private - 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
database - 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24

nat gateways need to be in each AZ (3 total) with elastic IPs so private subnets can reach the internet for updates but db subnets should have zero internet connectivity. each nat needs to be in its own public subnet and private subnets should route through the nat in their same AZ to avoid cross-az data transfer charges

for routing the public subnets go through the internet gateway obviously. private subnets route to their az's nat gateway. database subnets dont get any internet routes at all - if they can reach the internet the PCI audit will fail

need network ACLs set up with default deny and only allow http/https from internet to public tier, app traffic from public to private, and db traffic from private to database. explicit allow rules only

vpc flow logs are required for their security monitoring - send them to cloudwatch logs with 7 day retention

add parameters for Environment Project and CostCenter tags plus an EnvironmentSuffix param for unique resource names. tag everything consistently

outputs need vpc id all the subnet ids grouped by tier and the nat gateway ids so other stacks can reference them

make sure dns support and hostnames are enabled on the vpc. also no retain policies on anything - they want to be able to tear this down cleanly if needed
