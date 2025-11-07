### Reasoning Trace
---

Let's break down this complex Terraform configuration task step by step. I need to create a hub-and-spoke network architecture across three AWS regions with various components.

The main components I need to configure include:

1. VPCs (3) in different regions with non-overlapping CIDR blocks
2. Transit Gateway in the hub region
3. Transit Gateway peering attachments
4. Route 53 private hosted zones
5. VPC endpoints for Systems Manager
6. VPC Flow Logs
7. NAT instances with failover
8. Route tables with proper isolation between dev and prod
9. Consistent tagging and naming

Let me start building the configuration step by step:

First, let's define the AWS provider configurations for the three regions:

```terraform
# Provider configuration
provider "aws" {
  region = "us-east-1"
  alias  = "us_east_1"
}

provider "aws" {
  region = "eu-west-1"
  alias  = "eu_west_1"
}

provider "aws" {
  region = "ap-southeast-1"
  alias  = "ap_southeast_1"
}
```

Now, let's define the VPCs in each region with non-overlapping CIDR blocks:

```terraform
# VPCs
resource "aws_vpc" "us_east_1_dev" {
  provider   = aws.us_east_1
  cidr_block = "10.1.0.0/16"
  
  tags = {
    Name        = "us-east-1-dev-vpc-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "hub"
  }
}

resource "aws_vpc" "us_east_1_prod" {
  provider   = aws.us_east_1
  cidr_block = "10.2.0.0/16"
  
  tags = {
    Name        = "us-east-1-prod-vpc-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "hub"
  }
}

resource "aws_vpc" "eu_west_1_dev" {
  provider   = aws.eu_west_1
  cidr_block = "10.3.0.0/16"
  
  tags = {
    Name        = "eu-west-1-dev-vpc-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "eu-west-1"
    Purpose     = "spoke"
  }
}

resource "aws_vpc" "eu_west_1_prod" {
  provider   = aws.eu_west_1
  cidr_block = "10.4.0.0/16"
  
  tags = {
    Name        = "eu-west-1-prod-vpc-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "eu-west-1"
    Purpose     = "spoke"
  }
}

resource "aws_vpc" "ap_southeast_1_dev" {
  provider   = aws.ap_southeast_1
  cidr_block = "10.5.0.0/16"
  
  tags = {
    Name        = "ap-southeast-1-dev-vpc-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "ap-southeast-1"
    Purpose     = "spoke"
  }
}

resource "aws_vpc" "ap_southeast_1_prod" {
  provider   = aws.ap_southeast_1
  cidr_block = "10.6.0.0/16"
  
  tags = {
    Name        = "ap-southeast-1-prod-vpc-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "ap-southeast-1"
    Purpose     = "spoke"
  }
}
```

Wait, I need to re-examine the requirements more carefully. It seems the architecture calls for one VPC per region, with the development (10.1.0.0/16) and production (10.2.0.0/16) environments separated using Transit Gateway route tables, not separate VPCs. Let me revise my approach.

I should create:
1. One VPC in us-east-1 (hub)
2. One VPC in eu-west-1 (spoke)
3. One VPC in ap-southeast-1 (spoke)

Then, use Transit Gateway route tables to segregate traffic between dev (10.1.0.0/16) and prod (10.2.0.0/16) environments.

Let me revise my configuration:

```terraform
# Random string for resource naming
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# VPCs
resource "aws_vpc" "us_east_1" {
  provider   = aws.us_east_1
  cidr_block = "10.0.0.0/15"  # Encompasses both 10.0.0.0/16 and 10.1.0.0/16
  
  tags = {
    Name        = "us-east-1-hub-vpc-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "hub"
  }
}

resource "aws_vpc" "eu_west_1" {
  provider   = aws.eu_west_1
  cidr_block = "10.2.0.0/15"  # Encompasses both 10.2.0.0/16 and 10.3.0.0/16
  
  tags = {
    Name        = "eu-west-1-spoke-vpc-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "spoke"
  }
}

resource "aws_vpc" "ap_southeast_1" {
  provider   = aws.ap_southeast_1
  cidr_block = "10.4.0.0/15"  # Encompasses both 10.4.0.0/16 and 10.5.0.0/16
  
  tags = {
    Name        = "ap-southeast-1-spoke-vpc-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "spoke"
  }
}
```

Hmm, I'm still not entirely clear on how the VPC structure should be laid out given the requirements. Let me re-read more carefully.

The requirements mention:
- Three VPCs in distinct AWS regions (one in each region)
- Transit Gateway with separate route tables for development (10.1.0.0/16) and production (10.2.0.0/16) environments

Ok, I think the most appropriate interpretation is:
1. One VPC in us-east-1 (hub) that contains subnets for both dev and prod
2. One VPC in eu-west-1 (spoke) that contains subnets for both dev and prod
3. One VPC in ap-southeast-1 (spoke) that contains subnets for both dev and prod

And we use Transit Gateway route tables to ensure traffic isolation between dev and prod environments across these VPCs.

Let's revise the configuration again:

```terraform
# Random string for resource naming
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# VPCs
resource "aws_vpc" "us_east_1" {
  provider             = aws.us_east_1
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name        = "us-east-1-vpc-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "hub"
  }
}

resource "aws_vpc" "eu_west_1" {
  provider             = aws.eu_west_1
  cidr_block           = "10.1.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name        = "eu-west-1-vpc-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "spoke"
  }
}

resource "aws_vpc" "ap_southeast_1" {
  provider             = aws.ap_southeast_1
  cidr_block           = "10.2.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name        = "ap-southeast-1-vpc-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "spoke"
  }
}
```

Alright, I've set up the VPCs. Now, let's create subnets in each VPC for both dev and prod environments. I'll create both public and private subnets for each environment in each VPC.

```terraform
# Subnets for us-east-1 (hub) region
# Dev environment
resource "aws_subnet" "us_east_1_dev_private_1" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.0.0/20"
  availability_zone = "us-east-1a"
  
  tags = {
    Name        = "us-east-1-dev-private-subnet-1-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "private workload"
  }
}

resource "aws_subnet" "us_east_1_dev_private_2" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.16.0/20"
  availability_zone = "us-east-1b"
  
  tags = {
    Name        = "us-east-1-dev-private-subnet-2-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "private workload"
  }
}

resource "aws_subnet" "us_east_1_dev_public_1" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.32.0/20"
  availability_zone = "us-east-1a"
  
  tags = {
    Name        = "us-east-1-dev-public-subnet-1-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "public"
  }
}

resource "aws_subnet" "us_east_1_dev_public_2" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.48.0/20"
  availability_zone = "us-east-1b"
  
  tags = {
    Name        = "us-east-1-dev-public-subnet-2-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "public"
  }
}

# Prod environment
resource "aws_subnet" "us_east_1_prod_private_1" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.64.0/20"
  availability_zone = "us-east-1a"
  
  tags = {
    Name        = "us-east-1-prod-private-subnet-1-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "private workload"
  }
}

resource "aws_subnet" "us_east_1_prod_private_2" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.80.0/20"
  availability_zone = "us-east-1b"
  
  tags = {
    Name        = "us-east-1-prod-private-subnet-2-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "private workload"
  }
}

resource "aws_subnet" "us_east_1_prod_public_1" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.96.0/20"
  availability_zone = "us-east-1a"
  
  tags = {
    Name        = "us-east-1-prod-public-subnet-1-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "public"
  }
}

resource "aws_subnet" "us_east_1_prod_public_2" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.112.0/20"
  availability_zone = "us-east-1b"
  
  tags = {
    Name        = "us-east-1-prod-public-subnet-2-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "public"
  }
}

# TGW subnets for us-east-1
resource "aws_subnet" "us_east_1_tgw_1" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.128.0/20"
  availability_zone = "us-east-1a"
  
  tags = {
    Name        = "us-east-1-tgw-subnet-1-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "transit gateway"
  }
}

resource "aws_subnet" "us_east_1_tgw_2" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.144.0/20"
  availability_zone = "us-east-1b"
  
  tags = {
    Name        = "us-east-1-tgw-subnet-2-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "transit gateway"
  }
}

# Subnets for eu-west-1 (spoke) region
# Dev environment
resource "aws_subnet" "eu_west_1_dev_private_1" {
  provider          = aws.eu_west_1
  vpc_id            = aws_vpc.eu_west_1.id
  cidr_block        = "10.1.0.0/20"
  availability_zone = "eu-west-1a"
  
  tags = {
    Name        = "eu-west-1-dev-private-subnet-1-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "eu-west-1"
    Purpose     = "private workload"
  }
}

resource "aws_subnet" "eu_west_1_dev_private_2" {
  provider          = aws.eu_west_1
  vpc_id            = aws_vpc.eu_west_1.id
  cidr_block        = "10.1.16.0/20"
  availability_zone = "eu-west-1b"
  
  tags = {
    Name        = "eu-west-1-dev-private-subnet-2-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "eu-west-1"
    Purpose     = "private workload"
  }
}

# Prod environment
resource "aws_subnet" "eu_west_1_prod_private_1" {
  provider          = aws.eu_west_1
  vpc_id            = aws_vpc.eu_west_1.id
  cidr_block        = "10.1.64.0/20"
  availability_zone = "eu-west-1a"
  
  tags = {
    Name        = "eu-west-1-prod-private-subnet-1-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "eu-west-1"
    Purpose     = "private workload"
  }
}

resource "aws_subnet" "eu_west_1_prod_private_2" {
  provider          = aws.eu_west_1
  vpc_id            = aws_vpc.eu_west_1.id
  cidr_block        = "10.1.80.0/20"
  availability_zone = "eu-west-1b"
  
  tags = {
    Name        = "eu-west-1-prod-private-subnet-2-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "eu-west-1"
    Purpose     = "private workload"
  }
}

# TGW subnets for eu-west-1
resource "aws_subnet" "eu_west_1_tgw_1" {
  provider          = aws.eu_west_1
  vpc_id            = aws_vpc.eu_west_1.id
  cidr_block        = "10.1.128.0/20"
  availability_zone = "eu-west-1a"
  
  tags = {
    Name        = "eu-west-1-tgw-subnet-1-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "transit gateway"
  }
}

resource "aws_subnet" "eu_west_1_tgw_2" {
  provider          = aws.eu_west_1
  vpc_id            = aws_vpc.eu_west_1.id
  cidr_block        = "10.1.144.0/20"
  availability_zone = "eu-west-1b"
  
  tags = {
    Name        = "eu-west-1-tgw-subnet-2-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "transit gateway"
  }
}

# Subnets for ap-southeast-1 (spoke) region
# Dev environment
resource "aws_subnet" "ap_southeast_1_dev_private_1" {
  provider          = aws.ap_southeast_1
  vpc_id            = aws_vpc.ap_southeast_1.id
  cidr_block        = "10.2.0.0/20"
  availability_zone = "ap-southeast-1a"
  
  tags = {
    Name        = "ap-southeast-1-dev-private-subnet-1-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "ap-southeast-1"
    Purpose     = "private workload"
  }
}

resource "aws_subnet" "ap_southeast_1_dev_private_2" {
  provider          = aws.ap_southeast_1
  vpc_id            = aws_vpc.ap_southeast_1.id
  cidr_block        = "10.2.16.0/20"
  availability_zone = "ap-southeast-1b"
  
  tags = {
    Name        = "ap-southeast-1-dev-private-subnet-2-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "ap-southeast-1"
    Purpose     = "private workload"
  }
}

# Prod environment
resource "aws_subnet" "ap_southeast_1_prod_private_1" {
  provider          = aws.ap_southeast_1
  vpc_id            = aws_vpc.ap_southeast_1.id
  cidr_block        = "10.2.64.0/20"
  availability_zone = "ap-southeast-1a"
  
  tags = {
    Name        = "ap-southeast-1-prod-private-subnet-1-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "ap-southeast-1"
    Purpose     = "private workload"
  }
}

resource "aws_subnet" "ap_southeast_1_prod_private_2" {
  provider          = aws.ap_southeast_1
  vpc_id            = aws_vpc.ap_southeast_1.id
  cidr_block        = "10.2.80.0/20"
  availability_zone = "ap-southeast-1b"
  
  tags = {
    Name        = "ap-southeast-1-prod-private-subnet-2-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "ap-southeast-1"
    Purpose     = "private workload"
  }
}

# TGW subnets for ap-southeast-1
resource "aws_subnet" "ap_southeast_1_tgw_1" {
  provider          = aws.ap_southeast_1
  vpc_id            = aws_vpc.ap_southeast_1.id
  cidr_block        = "10.2.128.0/20"
  availability_zone = "ap-southeast-1a"
  
  tags = {
    Name        = "ap-southeast-1-tgw-subnet-1-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "transit gateway"
  }
}

resource "aws_subnet" "ap_southeast_1_tgw_2" {
  provider          = aws.ap_southeast_1
  vpc_id            = aws_vpc.ap_southeast_1.id
  cidr_block        = "10.2.144.0/20"
  availability_zone = "ap-southeast-1b"
  
  tags = {
    Name        = "ap-southeast-1-tgw-subnet-2-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "transit gateway"
  }
}
```

Now, I'll create the Transit Gateway in the hub region (us-east-1):

```terraform
# Transit Gateway in hub region (us-east-1)
resource "aws_ec2_transit_gateway" "hub" {
  provider                        = aws.us_east_1
  description                     = "Hub Transit Gateway"
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  
  tags = {
    Name        = "us-east-1-hub-tgw-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "transit"
  }
}
```

Now, I'll create separate route tables in the Transit Gateway for dev and prod environments:

```terraform
# Transit Gateway route tables
resource "aws_ec2_transit_gateway_route_table" "dev" {
  provider           = aws.us_east_1
  transit_gateway_id = aws_ec2_transit_gateway.hub.id
  
  tags = {
    Name        = "us-east-1-dev-tgw-rt-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "transit"
  }
}

resource "aws_ec2_transit_gateway_route_table" "prod" {
  provider           = aws.us_east_1
  transit_gateway_id = aws_ec2_transit_gateway.hub.id
  
  tags = {
    Name        = "us-east-1-prod-tgw-rt-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "transit"
  }
}
```

Now, I'll create the Transit Gateway attachments for each VPC:

```terraform
# Transit Gateway attachments
resource "aws_ec2_transit_gateway_vpc_attachment" "us_east_1" {
  provider                                        = aws.us_east_1
  subnet_ids                                      = [aws_subnet.us_east_1_tgw_1.id, aws_subnet.us_east_1_tgw_2.id]
  transit_gateway_id                              = aws_ec2_transit_gateway.hub.id
  vpc_id                                          = aws_vpc.us_east_1.id
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false
  
  tags = {
    Name        = "us-east-1-vpc-tgw-attachment-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "transit"
  }
}

# Create Transit Gateway peering attachment for eu-west-1
resource "aws_ec2_transit_gateway" "eu_west_1" {
  provider                        = aws.eu_west_1
  description                     = "Spoke Transit Gateway (eu-west-1)"
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  
  tags = {
    Name        = "eu-west-1-spoke-tgw-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "transit"
  }
}

resource "aws_ec2_transit_gateway_peering_attachment" "us_east_1_to_eu_west_1" {
  provider                  = aws.us_east_1
  peer_region              = "eu-west-1"
  peer_transit_gateway_id  = aws_ec2_transit_gateway.eu_west_1.id
  transit_gateway_id       = aws_ec2_transit_gateway.hub.id
  
  tags = {
    Name        = "us-east-1-to-eu-west-1-tgw-peering-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "transit"
  }
}

resource "aws_ec2_transit_gateway_vpc_attachment" "eu_west_1" {
  provider                                        = aws.eu_west_1
  subnet_ids                                      = [aws_subnet.eu_west_1_tgw_1.id, aws_subnet.eu_west_1_tgw_2.id]
  transit_gateway_id                              = aws_ec2_transit_gateway.eu_west_1.id
  vpc_id                                          = aws_vpc.eu_west_1.id
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false
  
  tags = {
    Name        = "eu-west-1-vpc-tgw-attachment-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "transit"
  }
}

# Create Transit Gateway peering attachment for ap-southeast-1
resource "aws_ec2_transit_gateway" "ap_southeast_1" {
  provider                        = aws.ap_southeast_1
  description                     = "Spoke Transit Gateway (ap-southeast-1)"
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  
  tags = {
    Name        = "ap-southeast-1-spoke-tgw-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "transit"
  }
}

resource "aws_ec2_transit_gateway_peering_attachment" "us_east_1_to_ap_southeast_1" {
  provider                  = aws.us_east_1
  peer_region              = "ap-southeast-1"
  peer_transit_gateway_id  = aws_ec2_transit_gateway.ap_southeast_1.id
  transit_gateway_id       = aws_ec2_transit_gateway.hub.id
  
  tags = {
    Name        = "us-east-1-to-ap-southeast-1-tgw-peering-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "transit"
  }
}

resource "aws_ec2_transit_gateway_vpc_attachment" "ap_southeast_1" {
  provider                                        = aws.ap_southeast_1
  subnet_ids                                      = [aws_subnet.ap_southeast_1_tgw_1.id, aws_subnet.ap_southeast_1_tgw_2.id]
  transit_gateway_id                              = aws_ec2_transit_gateway.ap_southeast_1.id
  vpc_id                                          = aws_vpc.ap_southeast_1.id
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false
  
  tags = {
    Name        = "ap-southeast-1-vpc-tgw-attachment-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "transit"
  }
}
```

Now, I need to associate the Transit Gateway VPC attachments with the appropriate route tables (dev or prod). Since we have one VPC per region with both dev and prod subnets, I need to be careful about how I handle this. I think the best approach is to:

1. Create separate route tables in each VPC for dev and prod subnets
2. Associate the appropriate VPC route table with the corresponding Transit Gateway route table

Let me set up the VPC route tables first:

```terraform
# Route tables for us-east-1
resource "aws_route_table" "us_east_1_dev_private" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id
  
  tags = {
    Name        = "us-east-1-dev-private-rt-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "private routes"
  }
}

resource "aws_route_table" "us_east_1_prod_private" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id
  
  tags = {
    Name        = "us-east-1-prod-private-rt-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "private routes"
  }
}

resource "aws_route_table" "us_east_1_dev_public" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id
  
  tags = {
    Name        = "us-east-1-dev-public-rt-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "public routes"
  }
}

resource "aws_route_table" "us_east_1_prod_public" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id
  
  tags = {
    Name        = "us-east-1-prod-public-rt-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "public routes"
  }
}

# Route tables for eu-west-1
resource "aws_route_table" "eu_west_1_dev_private" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.eu_west_1.id
  
  tags = {
    Name        = "eu-west-1-dev-private-rt-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "eu-west-1"
    Purpose     = "private routes"
  }
}

resource "aws_route_table" "eu_west_1_prod_private" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.eu_west_1.id
  
  tags = {
    Name        = "eu-west-1-prod-private-rt-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "eu-west-1"
    Purpose     = "private routes"
  }
}

# Route tables for ap-southeast-1
resource "aws_route_table" "ap_southeast_1_dev_private" {
  provider = aws.ap_southeast_1
  vpc_id   = aws_vpc.ap_southeast_1.id
  
  tags = {
    Name        = "ap-southeast-1-dev-private-rt-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "ap-southeast-1"
    Purpose     = "private routes"
  }
}

resource "aws_route_table" "ap_southeast_1_prod_private" {
  provider = aws.ap_southeast_1
  vpc_id   = aws_vpc.ap_southeast_1.id
  
  tags = {
    Name        = "ap-southeast-1-prod-private-rt-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "ap-southeast-1"
    Purpose     = "private routes"
  }
}
```

Now, let's associate the subnets with their respective route tables:

```terraform
# Subnet associations for us-east-1
resource "aws_route_table_association" "us_east_1_dev_private_1" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_east_1_dev_private_1.id
  route_table_id = aws_route_table.us_east_1_dev_private.id
}

resource "aws_route_table_association" "us_east_1_dev_private_2" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_east_1_dev_private_2.id
  route_table_id = aws_route_table.us_east_1_dev_private.id
}

resource "aws_route_table_association" "us_east_1_prod_private_1" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_east_1_prod_private_1.id
  route_table_id = aws_route_table.us_east_1_prod_private.id
}

resource "aws_route_table_association" "us_east_1_prod_private_2" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_east_1_prod_private_2.id
  route_table_id = aws_route_table.us_east_1_prod_private.id
}

resource "aws_route_table_association" "us_east_1_dev_public_1" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_east_1_dev_public_1.id
  route_table_id = aws_route_table.us_east_1_dev_public.id
}

resource "aws_route_table_association" "us_east_1_dev_public_2" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_east_1_dev_public_2.id
  route_table_id = aws_route_table.us_east_1_dev_public.id
}

resource "aws_route_table_association" "us_east_1_prod_public_1" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_east_1_prod_public_1.id
  route_table_id = aws_route_table.us_east_1_prod_public.id
}

resource "aws_route_table_association" "us_east_1_prod_public_2" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_east_1_prod_public_2.id
  route_table_id = aws_route_table.us_east_1_prod_public.id
}

# Subnet associations for eu-west-1
resource "aws_route_table_association" "eu_west_1_dev_private_1" {
  provider       = aws.eu_west_1
  subnet_id      = aws_subnet.eu_west_1_dev_private_1.id
  route_table_id = aws_route_table.eu_west_1_dev_private.id
}

resource "aws_route_table_association" "eu_west_1_dev_private_2" {
  provider       = aws.eu_west_1
  subnet_id      = aws_subnet.eu_west_1_dev_private_2.id
  route_table_id = aws_route_table.eu_west_1_dev_private.id
}

resource "aws_route_table_association" "eu_west_1_prod_private_1" {
  provider       = aws.eu_west_1
  subnet_id      = aws_subnet.eu_west_1_prod_private_1.id
  route_table_id = aws_route_table.eu_west_1_prod_private.id
}

resource "aws_route_table_association" "eu_west_1_prod_private_2" {
  provider       = aws.eu_west_1
  subnet_id      = aws_subnet.eu_west_1_prod_private_2.id
  route_table_id = aws_route_table.eu_west_1_prod_private.id
}

# Subnet associations for ap-southeast-1
resource "aws_route_table_association" "ap_southeast_1_dev_private_1" {
  provider       = aws.ap_southeast_1
  subnet_id      = aws_subnet.ap_southeast_1_dev_private_1.id
  route_table_id = aws_route_table.ap_southeast_1_dev_private.id
}

resource "aws_route_table_association" "ap_southeast_1_dev_private_2" {
  provider       = aws.ap_southeast_1
  subnet_id      = aws_subnet.ap_southeast_1_dev_private_2.id
  route_table_id = aws_route_table.ap_southeast_1_dev_private.id
}

resource "aws_route_table_association" "ap_southeast_1_prod_private_1" {
  provider       = aws.ap_southeast_1
  subnet_id      = aws_subnet.ap_southeast_1_prod_private_1.id
  route_table_id = aws_route_table.ap_southeast_1_prod_private.id
}

resource "aws_route_table_association" "ap_southeast_1_prod_private_2" {
  provider       = aws.ap_southeast_1
  subnet_id      = aws_subnet.ap_southeast_1_prod_private_2.id
  route_table_id = aws_route_table.ap_southeast_1_prod_private.id
}
```

Now, let's associate the Transit Gateway VPC attachments with the appropriate Transit Gateway route tables:

```terraform
# Wait for the TGW peering attachments to be accepted
resource "aws_ec2_transit_gateway_peering_attachment_accepter" "eu_west_1" {
  provider                      = aws.eu_west_1
  transit_gateway_attachment_id = aws_ec2_transit_gateway_peering_attachment.us_east_1_to_eu_west_1.id
  
  tags = {
    Name        = "eu-west-1-tgw-peering-accepter-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "transit"
  }
}

resource "aws_ec2_transit_gateway_peering_attachment_accepter" "ap_southeast_1" {
  provider                      = aws.ap_southeast_1
  transit_gateway_attachment_id = aws_ec2_transit_gateway_peering_attachment.us_east_1_to_ap_southeast_1.id
  
  tags = {
    Name        = "ap-southeast-1-tgw-peering-accepter-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "transit"
  }
}

# Associate VPC attachments with Transit Gateway route tables
resource "aws_ec2_transit_gateway_route_table_association" "us_east_1_dev" {
  provider                       = aws.us_east_1
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.us_east_1.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.dev.id
}

resource "aws_ec2_transit_gateway_route_table_association" "us_east_1_prod" {
  provider                       = aws.us_east_1
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.us_east_1.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.prod.id
}

# For eu-west-1, we need to associate the peering attachment with both dev and prod route tables
resource "aws_ec2_transit_gateway_route_table_association" "eu_west_1_peering_dev" {
  provider                       = aws.us_east_1
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_peering_attachment.us_east_1_to_eu_west_1.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.dev.id
}

resource "aws_ec2_transit_gateway_route_table_association" "eu_west_1_peering_prod" {
  provider                       = aws.us_east_1
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_peering_attachment.us_east_1_to_eu_west_1.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.prod.id
}

# For ap-southeast-1, we need to associate the peering attachment with both dev and prod route tables
resource "aws_ec2_transit_gateway_route_table_association" "ap_southeast_1_peering_dev" {
  provider                       = aws.us_east_1
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_peering_attachment.us_east_1_to_ap_southeast_1.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.dev.id
}

resource "aws_ec2_transit_gateway_route_table_association" "ap_southeast_1_peering_prod" {
  provider                       = aws.us_east_1
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_peering_attachment.us_east_1_to_ap_southeast_1.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.prod.id
}
```

Hmm, I need to revise my approach here. We need to properly isolate dev and prod traffic. Let's create route tables in each spoke region as well:

```terraform
# Route tables for the spoke Transit Gateways
resource "aws_ec2_transit_gateway_route_table" "eu_west_1_dev" {
  provider           = aws.eu_west_1
  transit_gateway_id = aws_ec2_transit_gateway.eu_west_1.id
  
  tags = {
    Name        = "eu-west-1-dev-tgw-rt-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "eu-west-1"
    Purpose     = "transit"
  }
}

resource "aws_ec2_transit_gateway_route_table" "eu_west_1_prod" {
  provider           = aws.eu_west_1
  transit_gateway_id = aws_ec2_transit_gateway.eu_west_1.id
  
  tags = {
    Name        = "eu-west-1-prod-tgw-rt-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "eu-west-1"
    Purpose     = "transit"
  }
}

resource "aws_ec2_transit_gateway_route_table" "ap_southeast_1_dev" {
  provider           = aws.ap_southeast_1
  transit_gateway_id = aws_ec2_transit_gateway.ap_southeast_1.id
  
  tags = {
    Name        = "ap-southeast-1-dev-tgw-rt-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "ap-southeast-1"
    Purpose     = "transit"
  }
}

resource "aws_ec2_transit_gateway_route_table" "ap_southeast_1_prod" {
  provider           = aws.ap_southeast_1
  transit_gateway_id = aws_ec2_transit_gateway.ap_southeast_1.id
  
  tags = {
    Name        = "ap-southeast-1-prod-tgw-rt-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "ap-southeast-1"
    Purpose     = "transit"
  }
}
```

Now I need to configure the route propagation and blackhole routes to prevent traffic crossover:

```terraform
# Blackhole routes to prevent dev-prod traffic crossover
resource "aws_ec2_transit_gateway_route" "dev_to_prod_blackhole" {
  provider                       = aws.us_east_1
  destination_cidr_block         = "10.2.0.0/16"  # Prod CIDR
  blackhole                      = true
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.dev.id
}

resource "aws_ec2_transit_gateway_route" "prod_to_dev_blackhole" {
  provider                       = aws.us_east_1
  destination_cidr_block         = "10.1.0.0/16"  # Dev CIDR
  blackhole                      = true
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.prod.id
}
```

Wait, I realize I've been misinterpreting the CIDR block requirements. Let me re-read the requirements more carefully.

The requirements state:
- Transit Gateway with separate route tables for development (10.1.0.0/16) and production (10.2.0.0/16) environments.

This suggests that:
1. The development environment should use the CIDR block 10.1.0.0/16
2. The production environment should use the CIDR block 10.2.0.0/16

Let me revise my VPC and subnet configuration to align with this interpretation:

```terraform
# VPCs
resource "aws_vpc" "us_east_1_dev" {
  provider             = aws.us_east_1
  cidr_block           = "10.1.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name        = "us-east-1-dev-vpc-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "hub"
  }
}

resource "aws_vpc" "us_east_1_prod" {
  provider             = aws.us_east_1
  cidr_block           = "10.2.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name        = "us-east-1-prod-vpc-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "hub"
  }
}

resource "aws_vpc" "eu_west_1_dev" {
  provider             = aws.eu_west_1
  cidr_block           = "10.3.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name        = "eu-west-1-dev-vpc-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "eu-west-1"
    Purpose     = "spoke"
  }
}

resource "aws_vpc" "eu_west_1_prod" {
  provider             = aws.eu_west_1
  cidr_block           = "10.4.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name        = "eu-west-1-prod-vpc-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "eu-west-1"
    Purpose     = "spoke"
  }
}

resource "aws_vpc" "ap_southeast_1_dev" {
  provider             = aws.ap_southeast_1
  cidr_block           = "10.5.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name        = "ap-southeast-1-dev-vpc-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "ap-southeast-1"
    Purpose     = "spoke"
  }
}

resource "aws_vpc" "ap_southeast_1_prod" {
  provider             = aws.ap_southeast_1
  cidr_block           = "10.6.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name        = "ap-southeast-1-prod-vpc-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "ap-southeast-1"
    Purpose     = "spoke"
  }
}
```

On second thought, the requirements also mention "Three VPCs in distinct AWS regions" which suggests one VPC per region. This is actually conflicting with the separate CIDR blocks for dev and prod.

Let me try to reinterpret this. I think what is meant is that we have 3 VPCs (one per region), but we need to separate the traffic for dev and prod within these VPCs using Transit Gateway route tables.

So, let's go back to our original VPC configuration with one VPC per region, but make sure the subnet CIDRs align with the dev/prod CIDR blocks:

```terraform
# VPCs
resource "aws_vpc" "us_east_1" {
  provider             = aws.us_east_1
  cidr_block           = "10.0.0.0/15"  # Encompasses both 10.0.0.0/16 and 10.1.0.0/16
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name        = "us-east-1-vpc-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "hub"
  }
}

resource "aws_vpc" "eu_west_1" {
  provider             = aws.eu_west_1
  cidr_block           = "10.2.0.0/15"  # Encompasses both 10.2.0.0/16 and 10.3.0.0/16
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name        = "eu-west-1-vpc-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "spoke"
  }
}

resource "aws_vpc" "ap_southeast_1" {
  provider             = aws.ap_southeast_1
  cidr_block           = "10.4.0.0/15"  # Encompasses both 10.4.0.0/16 and 10.5.0.0/16
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name        = "ap-southeast-1-vpc-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "spoke"
  }
}
```

Ok, I've confused myself by trying to reinterpret the requirements. Let me take a step back and re-read the requirements more carefully.

The requirement states:
- Three VPCs in distinct AWS regions
- Transit Gateway with separate route tables for development (10.1.0.0/16) and production (10.2.0.0/16) environments

I think what this means is:
1. We have 3 VPCs, one in each region
2. Each VPC needs to support both development and production environments
3. The development environment across all regions uses the CIDR block 10.1.0.0/16
4. The production environment across all regions uses the CIDR block 10.2.0.0/16
5. The Transit Gateway route tables are used to isolate traffic between these environments

Let's revise our approach again. Actually, I read it the first time and was on the right track. I think my confusion stemmed from the fact that normally, you would have separate VPCs for dev and prod, but here we're using a single VPC per region and relying on Transit Gateway route tables to isolate traffic.

Let's continue with our original approach.

I'm going to configure NAT instances in the hub region for outbound Internet access:

```terraform
# Security group for NAT instances
resource "aws_security_group" "nat_sg" {
  provider    = aws.us_east_1
  name        = "us-east-1-nat-sg-${random_string.suffix.result}"
  description = "Security group for NAT instances"
  vpc_id      = aws_vpc.us_east_1.id
  
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.0.0/15", "10.2.0.0/15", "10.4.0.0/15"]  # All VPC CIDRs
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name        = "us-east-1-nat-sg-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "nat"
  }
}

# Internet Gateway for the hub VPC
resource "aws_internet_gateway" "us_east_1" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id
  
  tags = {
    Name        = "us-east-1-igw-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "internet access"
  }
}

# Route to Internet Gateway for public subnets
resource "aws_route" "us_east_1_dev_public_to_igw" {
  provider               = aws.us_east_1
  route_table_id         = aws_route_table.us_east_1_dev_public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.us_east_1.id
}

resource "aws_route" "us_east_1_prod_public_to_igw" {
  provider               = aws.us_east_1
  route_table_id         = aws_route_table.us_east_1_prod_public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.us_east_1.id
}

# NAT instances
data "aws_ami" "amazon_linux_2" {
  provider    = aws.us_east_1
  most_recent = true
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
  
  filter {
    name   = "owner-alias"
    values = ["amazon"]
  }
}

resource "aws_instance" "nat_dev_1" {
  provider                    = aws.us_east_1
  ami                         = data.aws_ami.amazon_linux_2.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.us_east_1_dev_public_1.id
  vpc_security_group_ids      = [aws_security_group.nat_sg.id]
  associate_public_ip_address = true
  source_dest_check           = false
  
  user_data = <<-EOF
              #!/bin/bash
              sysctl -w net.ipv4.ip_forward=1
              iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
              EOF
  
  tags = {
    Name        = "us-east-1-dev-nat-1-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "nat"
  }
}

resource "aws_instance" "nat_dev_2" {
  provider                    = aws.us_east_1
  ami                         = data.aws_ami.amazon_linux_2.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.us_east_1_dev_public_2.id
  vpc_security_group_ids      = [aws_security_group.nat_sg.id]
  associate_public_ip_address = true
  source_dest_check           = false
  
  user_data = <<-EOF
              #!/bin/bash
              sysctl -w net.ipv4.ip_forward=1
              iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
              EOF
  
  tags = {
    Name        = "us-east-1-dev-nat-2-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "nat"
  }
}

resource "aws_instance" "nat_prod_1" {
  provider                    = aws.us_east_1
  ami                         = data.aws_ami.amazon_linux_2.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.us_east_1_prod_public_1.id
  vpc_security_group_ids      = [aws_security_group.nat_sg.id]
  associate_public_ip_address = true
  source_dest_check           = false
  
  user_data = <<-EOF
              #!/bin/bash
              sysctl -w net.ipv4.ip_forward=1
              iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
              EOF
  
  tags = {
    Name        = "us-east-1-prod-nat-1-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "nat"
  }
}

resource "aws_instance" "nat_prod_2" {
  provider                    = aws.us_east_1
  ami                         = data.aws_ami.amazon_linux_2.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.us_east_1_prod_public_2.id
  vpc_security_group_ids      = [aws_security_group.nat_sg.id]
  associate_public_ip_address = true
  source_dest_check           = false
  
  user_data = <<-EOF
              #!/bin/bash
              sysctl -w net.ipv4.ip_forward=1
              iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
              EOF
  
  tags = {
    Name        = "us-east-1-prod-nat-2-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "nat"
  }
}

# Routes to NAT instances
resource "aws_route" "us_east_1_dev_private_to_nat_1" {
  provider               = aws.us_east_1
  route_table_id         = aws_route_table.us_east_1_dev_private.id
  destination_cidr_block = "0.0.0.0/0"
  instance_id            = aws_instance.nat_dev_1.id
}

# We'll create a health check for NAT failover
resource "aws_cloudwatch_metric_alarm" "nat_dev_1_status" {
  provider            = aws.us_east_1
  alarm_name          = "us-east-1-dev-nat-1-status-${random_string.suffix.result}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Maximum"
  threshold           = "1"
  alarm_description   = "This metric checks if NAT instance 1 is healthy"
  
  dimensions = {
    InstanceId = aws_instance.nat_dev_1.id
  }
  
  alarm_actions = [aws_sns_topic.nat_failover.arn]
}

resource "aws_sns_topic" "nat_failover" {
  provider = aws.us_east_1
  name     = "us-east-1-nat-failover-${random_string.suffix.result}"
}

resource "aws_lambda_function" "nat_failover" {
  provider      = aws.us_east_1
  function_name = "us-east-1-nat-failover-${random_string.suffix.result}"
  role          = aws_iam_role.nat_failover.arn
  handler       = "index.handler"
  runtime       = "python3.9"
  timeout       = 60
  
  environment {
    variables = {
      DEV_NAT_1_ID = aws_instance.nat_dev_1.id
      DEV_NAT_2_ID = aws_instance.nat_dev_2.id
      PROD_NAT_1_ID = aws_instance.nat_prod_1.id
      PROD_NAT_2_ID = aws_instance.nat_prod_2.id
      DEV_ROUTE_TABLE_ID = aws_route_table.us_east_1_dev_private.id
      PROD_ROUTE_TABLE_ID = aws_route_table.us_east_1_prod_private.id
    }
  }
  
  filename = "nat_failover.zip"
  source_code_hash = filebase64sha256("nat_failover.zip")
  
  tags = {
    Name        = "us-east-1-nat-failover-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "nat failover"
  }
}

resource "aws_iam_role" "nat_failover" {
  provider = aws.us_east_1
  name     = "us-east-1-nat-failover-${random_string.suffix.result}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name        = "us-east-1-nat-failover-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "nat failover"
  }
}

resource "aws_iam_role_policy" "nat_failover" {
  provider = aws.us_east_1
  name     = "us-east-1-nat-failover-policy-${random_string.suffix.result}"
  role     = aws_iam_role.nat_failover.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeRouteTables",
          "ec2:ReplaceRoute"
        ]
        Effect = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}
```

There's a lot more to configure, but I'm now concerned about focusing on what is specifically required. Let me re-read the requirements and make sure I'm covering all the necessary components.

The requirements call for:
- Route 53 private hosted zones for DNS resolution
- Systems Manager VPC endpoints
- VPC Flow Logs with S3 storage
- NAT instances (which we've configured)
- Transit Gateway blackhole routes (which we've configured)
- Consistent tagging (which we've done)
- Resource naming format (which we've done)

Let me configure the remaining components:

1. Route 53 private hosted zones:

```terraform
# Route 53 private hosted zones
resource "aws_route53_zone" "dev_internal" {
  provider = aws.us_east_1
  name     = "dev.internal"
  
  vpc {
    vpc_id = aws_vpc.us_east_1.id
  }
  
  tags = {
    Name        = "us-east-1-dev-zone-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "dns"
  }
}

resource "aws_route53_zone" "prod_internal" {
  provider = aws.us_east_1
  name     = "prod.internal"
  
  vpc {
    vpc_id = aws_vpc.us_east_1.id
  }
  
  tags = {
    Name        = "us-east-1-prod-zone-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "dns"
  }
}

# Associate the hosted zones with other VPCs
resource "aws_route53_zone_association" "dev_eu_west_1" {
  provider    = aws.us_east_1
  zone_id     = aws_route53_zone.dev_internal.id
  vpc_id      = aws_vpc.eu_west_1.id
  vpc_region  = "eu-west-1"
}

resource "aws_route53_zone_association" "dev_ap_southeast_1" {
  provider    = aws.us_east_1
  zone_id     = aws_route53_zone.dev_internal.id
  vpc_id      = aws_vpc.ap_southeast_1.id
  vpc_region  = "ap-southeast-1"
}

resource "aws_route53_zone_association" "prod_eu_west_1" {
  provider    = aws.us_east_1
  zone_id     = aws_route53_zone.prod_internal.id
  vpc_id      = aws_vpc.eu_west_1.id
  vpc_region  = "eu-west-1"
}

resource "aws_route53_zone_association" "prod_ap_southeast_1" {
  provider    = aws.us_east_1
  zone_id     = aws_route53_zone.prod_internal.id
  vpc_id      = aws_vpc.ap_southeast_1.id
  vpc_region  = "ap-southeast-1"
}
```

2. Systems Manager VPC endpoints:

```terraform
# Systems Manager VPC endpoints for us-east-1
resource "aws_security_group" "ssm_endpoint_sg_us_east_1" {
  provider    = aws.us_east_1
  name        = "us-east-1-ssm-endpoint-sg-${random_string.suffix.result}"
  description = "Security group for SSM endpoints"
  vpc_id      = aws_vpc.us_east_1.id
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.us_east_1.cidr_block]
  }
  
  tags = {
    Name        = "us-east-1-ssm-endpoint-sg-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "vpc endpoint"
  }
}

resource "aws_vpc_endpoint" "ssm_us_east_1" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  service_name      = "com.amazonaws.us-east-1.ssm"
  vpc_endpoint_type = "Interface"
  subnet_ids        = [aws_subnet.us_east_1_dev_private_1.id, aws_subnet.us_east_1_prod_private_1.id]
  security_group_ids = [aws_security_group.ssm_endpoint_sg_us_east_1.id]
  private_dns_enabled = true
  
  tags = {
    Name        = "us-east-1-ssm-endpoint-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "vpc endpoint"
  }
}

resource "aws_vpc_endpoint" "ssmmessages_us_east_1" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  service_name      = "com.amazonaws.us-east-1.ssmmessages"
  vpc_endpoint_type = "Interface"
  subnet_ids        = [aws_subnet.us_east_1_dev_private_1.id, aws_subnet.us_east_1_prod_private_1.id]
  security_group_ids = [aws_security_group.ssm_endpoint_sg_us_east_1.id]
  private_dns_enabled = true
  
  tags = {
    Name        = "us-east-1-ssmmessages-endpoint-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "vpc endpoint"
  }
}

resource "aws_vpc_endpoint" "ec2messages_us_east_1" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  service_name      = "com.amazonaws.us-east-1.ec2messages"
  vpc_endpoint_type = "Interface"
  subnet_ids        = [aws_subnet.us_east_1_dev_private_1.id, aws_subnet.us_east_1_prod_private_1.id]
  security_group_ids = [aws_security_group.ssm_endpoint_sg_us_east_1.id]
  private_dns_enabled = true
  
  tags = {
    Name        = "us-east-1-ec2messages-endpoint-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "vpc endpoint"
  }
}

# Systems Manager VPC endpoints for eu-west-1
resource "aws_security_group" "ssm_endpoint_sg_eu_west_1" {
  provider    = aws.eu_west_1
  name        = "eu-west-1-ssm-endpoint-sg-${random_string.suffix.result}"
  description = "Security group for SSM endpoints"
  vpc_id      = aws_vpc.eu_west_1.id
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.eu_west_1.cidr_block]
  }
  
  tags = {
    Name        = "eu-west-1-ssm-endpoint-sg-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "vpc endpoint"
  }
}

resource "aws_vpc_endpoint" "ssm_eu_west_1" {
  provider          = aws.eu_west_1
  vpc_id            = aws_vpc.eu_west_1.id
  service_name      = "com.amazonaws.eu-west-1.ssm"
  vpc_endpoint_type = "Interface"
  subnet_ids        = [aws_subnet.eu_west_1_dev_private_1.id, aws_subnet.eu_west_1_prod_private_1.id]
  security_group_ids = [aws_security_group.ssm_endpoint_sg_eu_west_1.id]
  private_dns_enabled = true
  
  tags = {
    Name        = "eu-west-1-ssm-endpoint-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "vpc endpoint"
  }
}

resource "aws_vpc_endpoint" "ssmmessages_eu_west_1" {
  provider          = aws.eu_west_1
  vpc_id            = aws_vpc.eu_west_1.id
  service_name      = "com.amazonaws.eu-west-1.ssmmessages"
  vpc_endpoint_type = "Interface"
  subnet_ids        = [aws_subnet.eu_west_1_dev_private_1.id, aws_subnet.eu_west_1_prod_private_1.id]
  security_group_ids = [aws_security_group.ssm_endpoint_sg_eu_west_1.id]
  private_dns_enabled = true
  
  tags = {
    Name        = "eu-west-1-ssmmessages-endpoint-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "vpc endpoint"
  }
}

resource "aws_vpc_endpoint" "ec2messages_eu_west_1" {
  provider          = aws.eu_west_1
  vpc_id            = aws_vpc.eu_west_1.id
  service_name      = "com.amazonaws.eu-west-1.ec2messages"
  vpc_endpoint_type = "Interface"
  subnet_ids        = [aws_subnet.eu_west_1_dev_private_1.id, aws_subnet.eu_west_1_prod_private_1.id]
  security_group_ids = [aws_security_group.ssm_endpoint_sg_eu_west_1.id]
  private_dns_enabled = true
  
  tags = {
    Name        = "eu-west-1-ec2messages-endpoint-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "vpc endpoint"
  }
}

# Systems Manager VPC endpoints for ap-southeast-1
resource "aws_security_group" "ssm_endpoint_sg_ap_southeast_1" {
  provider    = aws.ap_southeast_1
  name        = "ap-southeast-1-ssm-endpoint-sg-${random_string.suffix.result}"
  description = "Security group for SSM endpoints"
  vpc_id      = aws_vpc.ap_southeast_1.id
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.ap_southeast_1.cidr_block]
  }
  
  tags = {
    Name        = "ap-southeast-1-ssm-endpoint-sg-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "vpc endpoint"
  }
}

resource "aws_vpc_endpoint" "ssm_ap_southeast_1" {
  provider          = aws.ap_southeast_1
  vpc_id            = aws_vpc.ap_southeast_1.id
  service_name      = "com.amazonaws.ap-southeast-1.ssm"
  vpc_endpoint_type = "Interface"
  subnet_ids        = [aws_subnet.ap_southeast_1_dev_private_1.id, aws_subnet.ap_southeast_1_prod_private_1.id]
  security_group_ids = [aws_security_group.ssm_endpoint_sg_ap_southeast_1.id]
  private_dns_enabled = true
  
  tags = {
    Name        = "ap-southeast-1-ssm-endpoint-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "vpc endpoint"
  }
}

resource "aws_vpc_endpoint" "ssmmessages_ap_southeast_1" {
  provider          = aws.ap_southeast_1
  vpc_id            = aws_vpc.ap_southeast_1.id
  service_name      = "com.amazonaws.ap-southeast-1.ssmmessages"
  vpc_endpoint_type = "Interface"
  subnet_ids        = [aws_subnet.ap_southeast_1_dev_private_1.id, aws_subnet.ap_southeast_1_prod_private_1.id]
  security_group_ids = [aws_security_group.ssm_endpoint_sg_ap_southeast_1.id]
  private_dns_enabled = true
  
  tags = {
    Name        = "ap-southeast-1-ssmmessages-endpoint-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "vpc endpoint"
  }
}

resource "aws_vpc_endpoint" "ec2messages_ap_southeast_1" {
  provider          = aws.ap_southeast_1
  vpc_id            = aws_vpc.ap_southeast_1.id
  service_name      = "com.amazonaws.ap-southeast-1.ec2messages"
  vpc_endpoint_type = "Interface"
  subnet_ids        = [aws_subnet.ap_southeast_1_dev_private_1.id, aws_subnet.ap_southeast_1_prod_private_1.id]
  security_group_ids = [aws_security_group.ssm_endpoint_sg_ap_southeast_1.id]
  private_dns_enabled = true
  
  tags = {
    Name        = "ap-southeast-1-ec2messages-endpoint-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "vpc endpoint"
  }
}
```

3. VPC Flow Logs with S3 storage:

```terraform
# S3 bucket for flow logs
resource "aws_s3_bucket" "flow_logs" {
  provider = aws.us_east_1
  bucket   = "global-vpc-flow-logs-${random_string.suffix.result}"
  
  tags = {
    Name        = "global-vpc-flow-logs-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "flow logs"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "flow_logs" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.flow_logs.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "flow_logs" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.flow_logs.id
  
  rule {
    id     = "transition-to-glacier"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "GLACIER"
    }
    
    expiration {
      days = 365
    }
  }
}

# VPC Flow Logs for us-east-1
resource "aws_flow_log" "us_east_1" {
  provider           = aws.us_east_1
  log_destination      = aws_s3_bucket.flow_logs.arn
  log_destination_type = "s3"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.us_east_1.id
  destination_options {
    file_format                = "parquet"
    per_hour_partition       = false
    hive_compatible_partitions = false
  }
  max_aggregation_interval = 300  # 5 minutes
  
  tags = {
    Name        = "us-east-1-vpc-flow-log-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "flow log"
  }
}

# VPC Flow Logs for eu-west-1
resource "aws_flow_log" "eu_west_1" {
  provider           = aws.eu_west_1
  log_destination      = aws_s3_bucket.flow_logs.arn
  log_destination_type = "s3"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.eu_west_1.id
  destination_options {
    file_format                = "parquet"
    per_hour_partition       = false
    hive_compatible_partitions = false
  }
  max_aggregation_interval = 300  # 5 minutes
  
  tags = {
    Name        = "eu-west-1-vpc-flow-log-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "flow log"
  }
}

# VPC Flow Logs for ap-southeast-1
resource "aws_flow_log" "ap_southeast_1" {
  provider           = aws.ap_southeast_1
  log_destination      = aws_s3_bucket.flow_logs.arn
  log_destination_type = "s3"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.ap_southeast_1.id
  destination_options {
    file_format                = "parquet"
    per_hour_partition       = false
    hive_compatible_partitions = false
  }
  max_aggregation_interval = 300  # 5 minutes
  
  tags = {
    Name        = "ap-southeast-1-vpc-flow-log-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "flow log"
  }
}
```

Let me review to make sure I've covered all the requirements:

1. ✅ Three VPCs in distinct AWS regions with non-overlapping CIDR blocks
2. ✅ AWS Transit Gateway in the hub region
3. ✅ Transit Gateway peering attachments
4. ✅ Route 53 private hosted zones for DNS resolution
5. ✅ Systems Manager VPC endpoints for secure management access
6. ✅ Flow Logs for all VPCs stored in S3 with Parquet format and 5-minute aggregation
7. ✅ NAT instances in the hub region with failover
8. ✅ Transit Gateway blackhole routes to prevent dev-prod traffic crossover
9. ✅ Consistent tagging on all resources
10. ✅ Resource naming following the specified format

I believe I've addressed all the requirements. Let me put everything together into a single Terraform configuration file.

Let me combine my logic flows and ensure my thinking is correct:

1. We need separate VPCs for dev and prod in each region
2. We need a Transit Gateway in each region 
3. Transit Gateway peering between hub and spoke regions
4. Route 53 private hosted zones for dev and prod
5. Systems Manager VPC endpoints in each VPC
6. NAT instances for outbound internet access
7. VPC Flow Logs stored in S3

Our Terraform configuration should cover all these aspects. Let's put it all together.

Wait, I think there's something still ambiguous:
"Three VPCs in distinct AWS regions — us-east-1 (hub), eu-west-1, and ap-southeast-1 (spokes)"

This suggests one VPC per region, but then it mentions:
"Transit Gateway in the hub region to enable cross-region communication with separate route tables for development (10.1.0.0/16) and production (10.2.0.0/16) environments."

The more I read it, the more I think we need separate VPCs for dev and prod in each region. However, given that the first bullet point specifically says "Three VPCs", I'm going to interpret it as one VPC per region, with internal segregation between dev and prod environments using Transit Gateway route tables and VPC route tables.

OK, I think I've been overthinking this. Let's follow the clearest interpretation and provide the best solution.
### Answer 
---

```terraform
provider "aws" {
  region = "us-east-1"
  alias  = "us_east_1"
}

provider "aws" {
  region = "eu-west-1"
  alias  = "eu_west_1"
}

provider "aws" {
  region = "ap-southeast-1"
  alias  = "ap_southeast_1"
}

resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# VPCs with non-overlapping CIDR blocks
resource "aws_vpc" "us_east_1" {
  provider             = aws.us_east_1
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "us-east-1-vpc-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "hub"
  }
}

resource "aws_vpc" "eu_west_1" {
  provider             = aws.eu_west_1
  cidr_block           = "10.100.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "eu-west-1-vpc-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "spoke"
  }
}

resource "aws_vpc" "ap_southeast_1" {
  provider             = aws.ap_southeast_1
  cidr_block           = "10.200.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "ap-southeast-1-vpc-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "spoke"
  }
}

# Development Subnets
resource "aws_subnet" "us_east_1_dev_private_1" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.0.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name        = "us-east-1-dev-private-subnet-1-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "workload"
  }
}

resource "aws_subnet" "us_east_1_dev_private_2" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name        = "us-east-1-dev-private-subnet-2-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "workload"
  }
}

resource "aws_subnet" "us_east_1_dev_public_1" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.100.0/24"
  availability_zone = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name        = "us-east-1-dev-public-subnet-1-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "public"
  }
}

resource "aws_subnet" "us_east_1_dev_public_2" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.101.0/24"
  availability_zone = "us-east-1b"
  map_public_ip_on_launch = true

  tags = {
    Name        = "us-east-1-dev-public-subnet-2-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "public"
  }
}

# Production Subnets
resource "aws_subnet" "us_east_1_prod_private_1" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.50.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name        = "us-east-1-prod-private-subnet-1-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "workload"
  }
}

resource "aws_subnet" "us_east_1_prod_private_2" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.51.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name        = "us-east-1-prod-private-subnet-2-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "workload"
  }
}

resource "aws_subnet" "us_east_1_prod_public_1" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.150.0/24"
  availability_zone = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name        = "us-east-1-prod-public-subnet-1-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "public"
  }
}

resource "aws_subnet" "us_east_1_prod_public_2" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.151.0/24"
  availability_zone = "us-east-1b"
  map_public_ip_on_launch = true

  tags = {
    Name        = "us-east-1-prod-public-subnet-2-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "public"
  }
}

# Transit Gateway attachment subnets
resource "aws_subnet" "us_east_1_tgw_1" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.200.0/28"
  availability_zone = "us-east-1a"

  tags = {
    Name        = "us-east-1-tgw