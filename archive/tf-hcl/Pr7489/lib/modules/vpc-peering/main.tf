terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.primary, aws.dr]
    }
  }
}

variable "environment_suffix" { type = string }
variable "primary_vpc_id" { type = string }
variable "dr_vpc_id" { type = string }
variable "primary_vpc_cidr" { type = string }
variable "dr_vpc_cidr" { type = string }
variable "primary_route_table_ids" { type = list(string) }
variable "dr_route_table_ids" { type = list(string) }
variable "primary_region" { type = string }
variable "dr_region" { type = string }

resource "aws_vpc_peering_connection" "peer" {
  provider    = aws.primary
  vpc_id      = var.primary_vpc_id
  peer_vpc_id = var.dr_vpc_id
  peer_region = var.dr_region
  auto_accept = false

  tags = {
    Name = "transaction-vpc-peering-${var.environment_suffix}"
  }
}

resource "aws_vpc_peering_connection_accepter" "peer" {
  provider                  = aws.dr
  vpc_peering_connection_id = aws_vpc_peering_connection.peer.id
  auto_accept               = true

  tags = {
    Name = "transaction-vpc-peering-accepter-${var.environment_suffix}"
  }
}

resource "aws_route" "primary_to_dr" {
  provider                  = aws.primary
  count                     = length(var.primary_route_table_ids)
  route_table_id            = var.primary_route_table_ids[count.index]
  destination_cidr_block    = var.dr_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.peer.id
}

resource "aws_route" "dr_to_primary" {
  provider                  = aws.dr
  count                     = length(var.dr_route_table_ids)
  route_table_id            = var.dr_route_table_ids[count.index]
  destination_cidr_block    = var.primary_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.peer.id
}

output "peering_connection_id" { value = aws_vpc_peering_connection.peer.id }
