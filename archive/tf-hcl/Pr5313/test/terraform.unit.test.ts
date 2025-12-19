import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const variablesPath = join(__dirname, '../lib/variables.tf');
const dataPath = join(__dirname, '../lib/data.tf');
const vpcHubPath = join(__dirname, '../lib/vpc-hub.tf');
const vpcUswestPath = join(__dirname, '../lib/vpc-uswest.tf');
const vpcEuropePath = join(__dirname, '../lib/vpc-europe.tf');
const tgwHubPath = join(__dirname, '../lib/tgw-hub.tf');
const tgwSpokesPath = join(__dirname, '../lib/tgw-spokes.tf');
const tgwPeeringPath = join(__dirname, '../lib/tgw-peering.tf');
const routeTablesPath = join(__dirname, '../lib/route-tables.tf');
const route53Path = join(__dirname, '../lib/route53.tf');
const vpcEndpointsPath = join(__dirname, '../lib/vpc-endpoints.tf');
const flowLogsPath = join(__dirname, '../lib/flow-logs.tf');
const securityGroupsPath = join(__dirname, '../lib/security-groups.tf');
const outputsPath = join(__dirname, '../lib/outputs.tf');
const providerPath = join(__dirname, '../lib/provider.tf');

const variablesCode = readFileSync(variablesPath, 'utf-8');
const dataCode = readFileSync(dataPath, 'utf-8');
const vpcHubCode = readFileSync(vpcHubPath, 'utf-8');
const vpcUswestCode = readFileSync(vpcUswestPath, 'utf-8');
const vpcEuropeCode = readFileSync(vpcEuropePath, 'utf-8');
const tgwHubCode = readFileSync(tgwHubPath, 'utf-8');
const tgwSpokesCode = readFileSync(tgwSpokesPath, 'utf-8');
const tgwPeeringCode = readFileSync(tgwPeeringPath, 'utf-8');
const routeTablesCode = readFileSync(routeTablesPath, 'utf-8');
const route53Code = readFileSync(route53Path, 'utf-8');
const vpcEndpointsCode = readFileSync(vpcEndpointsPath, 'utf-8');
const flowLogsCode = readFileSync(flowLogsPath, 'utf-8');
const securityGroupsCode = readFileSync(securityGroupsPath, 'utf-8');
const outputsCode = readFileSync(outputsPath, 'utf-8');

describe('Terraform Multi-Region Infrastructure Unit Tests', () => {

  describe('File Structure', () => {
    test('should have all required Terraform files', () => {
      expect(existsSync(variablesPath)).toBe(true);
      expect(existsSync(dataPath)).toBe(true);
      expect(existsSync(vpcHubPath)).toBe(true);
      expect(existsSync(vpcUswestPath)).toBe(true);
      expect(existsSync(vpcEuropePath)).toBe(true);
      expect(existsSync(tgwHubPath)).toBe(true);
      expect(existsSync(tgwSpokesPath)).toBe(true);
      expect(existsSync(tgwPeeringPath)).toBe(true);
      expect(existsSync(routeTablesPath)).toBe(true);
      expect(existsSync(route53Path)).toBe(true);
      expect(existsSync(vpcEndpointsPath)).toBe(true);
      expect(existsSync(flowLogsPath)).toBe(true);
      expect(existsSync(securityGroupsPath)).toBe(true);
      expect(existsSync(outputsPath)).toBe(true);
    });

    test('should have provider configuration file', () => {
      expect(existsSync(providerPath)).toBe(true);
    });

    test('should have VPC module', () => {
      const vpcModulePath = join(__dirname, '../lib/modules/vpc/main.tf');
      expect(existsSync(vpcModulePath)).toBe(true);
    });

    test('should have Transit Gateway module', () => {
      const tgwModulePath = join(__dirname, '../lib/modules/transit-gateway/main.tf');
      expect(existsSync(tgwModulePath)).toBe(true);
    });

    test('should have Transit Gateway Peering module', () => {
      const tgwPeeringModulePath = join(__dirname, '../lib/modules/transit-gateway-peering/main.tf');
      expect(existsSync(tgwPeeringModulePath)).toBe(true);
    });

    test('should have VPC Endpoints module', () => {
      const endpointsModulePath = join(__dirname, '../lib/modules/vpc-endpoints/main.tf');
      expect(existsSync(endpointsModulePath)).toBe(true);
    });

    test('should have Route53 Zone module', () => {
      const route53ModulePath = join(__dirname, '../lib/modules/route53-zone/main.tf');
      expect(existsSync(route53ModulePath)).toBe(true);
    });

    test('should have Flow Logs module', () => {
      const flowLogsModulePath = join(__dirname, '../lib/modules/flow-logs/main.tf');
      expect(existsSync(flowLogsModulePath)).toBe(true);
    });
  });

  describe('Variables Configuration', () => {
    test('should define aws_region variable with default us-east-1', () => {
      expect(variablesCode).toMatch(/variable\s+"aws_region"\s+\{/);
      expect(variablesCode).toMatch(/default\s*=\s*"us-east-1"/);
    });

    test('should define environment variable with validation', () => {
      expect(variablesCode).toMatch(/variable\s+"environment"\s+\{/);
      expect(variablesCode).toMatch(/validation\s+\{/);
      expect(variablesCode).toMatch(/production|staging|development/);
    });

    test('should define environment_suffix variable', () => {
      expect(variablesCode).toMatch(/variable\s+"environment_suffix"\s+\{/);
      expect(variablesCode).toMatch(/default\s*=\s*""/);
    });

    test('should define project_name variable', () => {
      expect(variablesCode).toMatch(/variable\s+"project_name"\s+\{/);
      expect(variablesCode).toMatch(/default\s*=\s*"trading-platform"/);
    });

    test('should define cost_center variable', () => {
      expect(variablesCode).toMatch(/variable\s+"cost_center"\s+\{/);
    });

    test('should define hub_vpc_cidr variable with 10.0.0.0/16', () => {
      expect(variablesCode).toMatch(/variable\s+"hub_vpc_cidr"\s+\{/);
      expect(variablesCode).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test('should define hub_public_subnet_cidrs variable', () => {
      expect(variablesCode).toMatch(/variable\s+"hub_public_subnet_cidrs"\s+\{/);
      expect(variablesCode).toMatch(/10\.0\.1\.0\/24/);
    });

    test('should define hub_private_subnet_cidrs variable', () => {
      expect(variablesCode).toMatch(/variable\s+"hub_private_subnet_cidrs"\s+\{/);
      expect(variablesCode).toMatch(/10\.0\.11\.0\/24/);
    });

    test('should define uswest_vpc_cidr variable with 10.1.0.0/16', () => {
      expect(variablesCode).toMatch(/variable\s+"uswest_vpc_cidr"\s+\{/);
      expect(variablesCode).toMatch(/default\s*=\s*"10\.1\.0\.0\/16"/);
    });

    test('should define uswest_public_subnet_cidrs variable', () => {
      expect(variablesCode).toMatch(/variable\s+"uswest_public_subnet_cidrs"\s+\{/);
      expect(variablesCode).toMatch(/10\.1\.1\.0\/24/);
    });

    test('should define uswest_private_subnet_cidrs variable', () => {
      expect(variablesCode).toMatch(/variable\s+"uswest_private_subnet_cidrs"\s+\{/);
      expect(variablesCode).toMatch(/10\.1\.11\.0\/24/);
    });

    test('should define europe_vpc_cidr variable with 10.2.0.0/16', () => {
      expect(variablesCode).toMatch(/variable\s+"europe_vpc_cidr"\s+\{/);
      expect(variablesCode).toMatch(/default\s*=\s*"10\.2\.0\.0\/16"/);
    });

    test('should define europe_public_subnet_cidrs variable', () => {
      expect(variablesCode).toMatch(/variable\s+"europe_public_subnet_cidrs"\s+\{/);
      expect(variablesCode).toMatch(/10\.2\.1\.0\/24/);
    });

    test('should define europe_private_subnet_cidrs variable', () => {
      expect(variablesCode).toMatch(/variable\s+"europe_private_subnet_cidrs"\s+\{/);
      expect(variablesCode).toMatch(/10\.2\.11\.0\/24/);
    });

    test('should define hub_tgw_asn variable with default 64512', () => {
      expect(variablesCode).toMatch(/variable\s+"hub_tgw_asn"\s+\{/);
      expect(variablesCode).toMatch(/default\s*=\s*64512/);
    });

    test('should define uswest_tgw_asn variable with default 64513', () => {
      expect(variablesCode).toMatch(/variable\s+"uswest_tgw_asn"\s+\{/);
      expect(variablesCode).toMatch(/default\s*=\s*64513/);
    });

    test('should define europe_tgw_asn variable with default 64514', () => {
      expect(variablesCode).toMatch(/variable\s+"europe_tgw_asn"\s+\{/);
      expect(variablesCode).toMatch(/default\s*=\s*64514/);
    });

    test('should define route53_domain_name variable', () => {
      expect(variablesCode).toMatch(/variable\s+"route53_domain_name"\s+\{/);
      expect(variablesCode).toMatch(/default\s*=\s*"trading\.internal"/);
    });

    test('should define flow_logs_retention_days variable with validation', () => {
      expect(variablesCode).toMatch(/variable\s+"flow_logs_retention_days"\s+\{/);
      expect(variablesCode).toMatch(/validation\s+\{/);
      expect(variablesCode).toMatch(/default\s*=\s*7/);
    });

    test('should define az_count variable with validation for 2-3 AZs', () => {
      expect(variablesCode).toMatch(/variable\s+"az_count"\s+\{/);
      expect(variablesCode).toMatch(/validation\s+\{/);
      expect(variablesCode).toMatch(/default\s*=\s*3/);
    });
  });

  describe('Data Sources', () => {
    test('should define aws_caller_identity data source', () => {
      expect(dataCode).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(dataCode).toMatch(/provider\s*=\s*aws\.hub/);
    });

    test('should define aws_availability_zones for hub region', () => {
      expect(dataCode).toMatch(/data\s+"aws_availability_zones"\s+"hub"/);
      expect(dataCode).toMatch(/provider\s*=\s*aws\.hub/);
      expect(dataCode).toMatch(/state\s*=\s*"available"/);
    });

    test('should define aws_availability_zones for uswest region', () => {
      expect(dataCode).toMatch(/data\s+"aws_availability_zones"\s+"uswest"/);
      expect(dataCode).toMatch(/provider\s*=\s*aws\.us_west/);
    });

    test('should define aws_availability_zones for europe region', () => {
      expect(dataCode).toMatch(/data\s+"aws_availability_zones"\s+"europe"/);
      expect(dataCode).toMatch(/provider\s*=\s*aws\.europe/);
    });
  });

  describe('Random Resources and Locals', () => {
    test('should define random_string for environment_suffix', () => {
      expect(dataCode).toMatch(/resource\s+"random_string"\s+"environment_suffix"/);
      expect(dataCode).toMatch(/count\s*=\s*var\.environment_suffix\s*==\s*""\s*\?\s*1\s*:\s*0/);
      expect(dataCode).toMatch(/length\s*=\s*8/);
      expect(dataCode).toMatch(/special\s*=\s*false/);
      expect(dataCode).toMatch(/upper\s*=\s*false/);
    });

    test('should define env_suffix in locals', () => {
      expect(dataCode).toMatch(/locals\s+\{[\s\S]*?env_suffix\s*=/);
      expect(dataCode).toMatch(/var\.environment_suffix\s*!=\s*""\s*\?/);
    });

    test('should define hub_azs in locals', () => {
      expect(dataCode).toMatch(/hub_azs\s*=\s*slice\(data\.aws_availability_zones\.hub\.names/);
    });

    test('should define uswest_azs in locals', () => {
      expect(dataCode).toMatch(/uswest_azs\s*=\s*slice\(data\.aws_availability_zones\.uswest\.names/);
    });

    test('should define europe_azs in locals', () => {
      expect(dataCode).toMatch(/europe_azs\s*=\s*slice\(data\.aws_availability_zones\.europe\.names/);
    });

    test('should define common_tags in locals', () => {
      expect(dataCode).toMatch(/common_tags\s*=\s*\{/);
      expect(dataCode).toMatch(/Project/);
      expect(dataCode).toMatch(/CostCenter/);
      expect(dataCode).toMatch(/ManagedBy/);
    });
  });

  describe('Hub VPC Module', () => {
    test('should declare hub_vpc module', () => {
      expect(vpcHubCode).toMatch(/module\s+"hub_vpc"\s+\{/);
      expect(vpcHubCode).toMatch(/source\s*=\s*"\.\/modules\/vpc"/);
    });

    test('should use aws.hub provider', () => {
      expect(vpcHubCode).toMatch(/providers\s*=\s*\{[\s\S]*?aws\s*=\s*aws\.hub/);
    });

    test('should pass hub_vpc_cidr to module', () => {
      expect(vpcHubCode).toMatch(/vpc_cidr\s*=\s*var\.hub_vpc_cidr/);
    });

    test('should pass us-east-1 region to module', () => {
      expect(vpcHubCode).toMatch(/region\s*=\s*"us-east-1"/);
    });

    test('should pass hub_azs to module', () => {
      expect(vpcHubCode).toMatch(/availability_zones\s*=\s*local\.hub_azs/);
    });

    test('should pass hub public subnet CIDRs to module', () => {
      expect(vpcHubCode).toMatch(/public_subnet_cidrs\s*=\s*var\.hub_public_subnet_cidrs/);
    });

    test('should pass hub private subnet CIDRs to module', () => {
      expect(vpcHubCode).toMatch(/private_subnet_cidrs\s*=\s*var\.hub_private_subnet_cidrs/);
    });

    test('should use environment_suffix from locals', () => {
      expect(vpcHubCode).toMatch(/environment_suffix\s*=\s*local\.env_suffix/);
    });

    test('should name VPC as hub-vpc', () => {
      expect(vpcHubCode).toMatch(/vpc_name\s*=\s*"hub-vpc"/);
    });
  });

  describe('US West Spoke VPC Module', () => {
    test('should declare uswest_vpc module', () => {
      expect(vpcUswestCode).toMatch(/module\s+"uswest_vpc"\s+\{/);
      expect(vpcUswestCode).toMatch(/source\s*=\s*"\.\/modules\/vpc"/);
    });

    test('should use aws.us_west provider', () => {
      expect(vpcUswestCode).toMatch(/providers\s*=\s*\{[\s\S]*?aws\s*=\s*aws\.us_west/);
    });

    test('should pass uswest_vpc_cidr to module', () => {
      expect(vpcUswestCode).toMatch(/vpc_cidr\s*=\s*var\.uswest_vpc_cidr/);
    });

    test('should pass us-west-2 region to module', () => {
      expect(vpcUswestCode).toMatch(/region\s*=\s*"us-west-2"/);
    });

    test('should pass uswest_azs to module', () => {
      expect(vpcUswestCode).toMatch(/availability_zones\s*=\s*local\.uswest_azs/);
    });

    test('should name VPC as uswest-spoke-vpc', () => {
      expect(vpcUswestCode).toMatch(/vpc_name\s*=\s*"uswest-spoke-vpc"/);
    });
  });

  describe('Europe Spoke VPC Module', () => {
    test('should declare europe_vpc module', () => {
      expect(vpcEuropeCode).toMatch(/module\s+"europe_vpc"\s+\{/);
      expect(vpcEuropeCode).toMatch(/source\s*=\s*"\.\/modules\/vpc"/);
    });

    test('should use aws.europe provider', () => {
      expect(vpcEuropeCode).toMatch(/providers\s*=\s*\{[\s\S]*?aws\s*=\s*aws\.europe/);
    });

    test('should pass europe_vpc_cidr to module', () => {
      expect(vpcEuropeCode).toMatch(/vpc_cidr\s*=\s*var\.europe_vpc_cidr/);
    });

    test('should pass eu-west-1 region to module', () => {
      expect(vpcEuropeCode).toMatch(/region\s*=\s*"eu-west-1"/);
    });

    test('should pass europe_azs to module', () => {
      expect(vpcEuropeCode).toMatch(/availability_zones\s*=\s*local\.europe_azs/);
    });

    test('should name VPC as europe-spoke-vpc', () => {
      expect(vpcEuropeCode).toMatch(/vpc_name\s*=\s*"europe-spoke-vpc"/);
    });
  });

  describe('Hub Transit Gateway', () => {
    test('should declare hub_tgw module', () => {
      expect(tgwHubCode).toMatch(/module\s+"hub_tgw"\s+\{/);
      expect(tgwHubCode).toMatch(/source\s*=\s*"\.\/modules\/transit-gateway"/);
    });

    test('should use aws.hub provider', () => {
      expect(tgwHubCode).toMatch(/providers\s*=\s*\{[\s\S]*?aws\s*=\s*aws\.hub/);
    });

    test('should pass hub ASN to module', () => {
      expect(tgwHubCode).toMatch(/amazon_side_asn\s*=\s*var\.hub_tgw_asn/);
    });

    test('should name TGW as hub-tgw', () => {
      expect(tgwHubCode).toMatch(/tgw_name\s*=\s*"hub-tgw"/);
    });

    test('should create hub VPC attachment', () => {
      expect(tgwHubCode).toMatch(/resource\s+"aws_ec2_transit_gateway_vpc_attachment"\s+"hub"/);
      expect(tgwHubCode).toMatch(/subnet_ids\s*=\s*module\.hub_vpc\.private_subnet_ids/);
      expect(tgwHubCode).toMatch(/transit_gateway_id\s*=\s*module\.hub_tgw\.transit_gateway_id/);
      expect(tgwHubCode).toMatch(/vpc_id\s*=\s*module\.hub_vpc\.vpc_id/);
    });

    test('should enable DNS support on hub attachment', () => {
      expect(tgwHubCode).toMatch(/dns_support\s*=\s*"enable"/);
    });

    test('should disable default route table association', () => {
      expect(tgwHubCode).toMatch(/transit_gateway_default_route_table_association\s*=\s*false/);
      expect(tgwHubCode).toMatch(/transit_gateway_default_route_table_propagation\s*=\s*false/);
    });

    test('should associate hub attachment with production route table', () => {
      expect(tgwHubCode).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table_association"\s+"hub_production"/);
      expect(tgwHubCode).toMatch(/transit_gateway_route_table_id\s*=\s*module\.hub_tgw\.production_route_table_id/);
    });

    test('should use environment_suffix in hub attachment name', () => {
      expect(tgwHubCode).toMatch(/Name\s*=\s*"hub-vpc-attachment-\$\{local\.env_suffix\}"/);
    });
  });

  describe('Spoke Transit Gateways', () => {
    test('should declare uswest_tgw module', () => {
      expect(tgwSpokesCode).toMatch(/module\s+"uswest_tgw"\s+\{/);
      expect(tgwSpokesCode).toMatch(/source\s*=\s*"\.\/modules\/transit-gateway"/);
    });

    test('should use aws.us_west provider for uswest_tgw', () => {
      expect(tgwSpokesCode).toMatch(/providers\s*=\s*\{[\s\S]*?aws\s*=\s*aws\.us_west/);
    });

    test('should pass uswest ASN to module', () => {
      expect(tgwSpokesCode).toMatch(/amazon_side_asn\s*=\s*var\.uswest_tgw_asn/);
    });

    test('should create uswest VPC attachment', () => {
      expect(tgwSpokesCode).toMatch(/resource\s+"aws_ec2_transit_gateway_vpc_attachment"\s+"uswest"/);
      expect(tgwSpokesCode).toMatch(/subnet_ids\s*=\s*module\.uswest_vpc\.private_subnet_ids/);
    });

    test('should declare europe_tgw module', () => {
      expect(tgwSpokesCode).toMatch(/module\s+"europe_tgw"\s+\{/);
    });

    test('should use aws.europe provider for europe_tgw', () => {
      expect(tgwSpokesCode).toMatch(/providers\s*=\s*\{[\s\S]*?aws\s*=\s*aws\.europe/);
    });

    test('should pass europe ASN to module', () => {
      expect(tgwSpokesCode).toMatch(/amazon_side_asn\s*=\s*var\.europe_tgw_asn/);
    });

    test('should create europe VPC attachment', () => {
      expect(tgwSpokesCode).toMatch(/resource\s+"aws_ec2_transit_gateway_vpc_attachment"\s+"europe"/);
      expect(tgwSpokesCode).toMatch(/subnet_ids\s*=\s*module\.europe_vpc\.private_subnet_ids/);
    });

    test('should use environment_suffix in spoke attachment names', () => {
      expect(tgwSpokesCode).toMatch(/uswest-spoke-vpc-attachment-\$\{local\.env_suffix\}/);
      expect(tgwSpokesCode).toMatch(/europe-spoke-vpc-attachment-\$\{local\.env_suffix\}/);
    });
  });

  describe('Transit Gateway Peering', () => {
    test('should declare hub_to_uswest_peering module', () => {
      expect(tgwPeeringCode).toMatch(/module\s+"hub_to_uswest_peering"\s+\{/);
      expect(tgwPeeringCode).toMatch(/source\s*=\s*"\.\/modules\/transit-gateway-peering"/);
    });

    test('should peer hub to uswest with correct parameters', () => {
      expect(tgwPeeringCode).toMatch(/local_tgw_id\s*=\s*module\.hub_tgw\.transit_gateway_id/);
      expect(tgwPeeringCode).toMatch(/peer_tgw_id\s*=\s*module\.uswest_tgw\.transit_gateway_id/);
      expect(tgwPeeringCode).toMatch(/peer_region\s*=\s*"us-west-2"/);
    });

    test('should create uswest peering accepter', () => {
      expect(tgwPeeringCode).toMatch(/resource\s+"aws_ec2_transit_gateway_peering_attachment_accepter"\s+"uswest"/);
      expect(tgwPeeringCode).toMatch(/provider\s*=\s*aws\.us_west/);
    });

    test('should declare hub_to_europe_peering module', () => {
      expect(tgwPeeringCode).toMatch(/module\s+"hub_to_europe_peering"\s+\{/);
    });

    test('should peer hub to europe with correct parameters', () => {
      expect(tgwPeeringCode).toMatch(/peer_tgw_id\s*=\s*module\.europe_tgw\.transit_gateway_id/);
      expect(tgwPeeringCode).toMatch(/peer_region\s*=\s*"eu-west-1"/);
    });

    test('should create europe peering accepter', () => {
      expect(tgwPeeringCode).toMatch(/resource\s+"aws_ec2_transit_gateway_peering_attachment_accepter"\s+"europe"/);
      expect(tgwPeeringCode).toMatch(/provider\s*=\s*aws\.europe/);
    });

    test('should associate hub peerings with production route table', () => {
      expect(tgwPeeringCode).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table_association"\s+"hub_uswest_peering"/);
      expect(tgwPeeringCode).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table_association"\s+"hub_europe_peering"/);
    });

    test('should associate spoke peerings with their route tables', () => {
      expect(tgwPeeringCode).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table_association"\s+"uswest_hub_peering"/);
      expect(tgwPeeringCode).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table_association"\s+"europe_hub_peering"/);
    });

    test('should use environment_suffix in peering names', () => {
      expect(tgwPeeringCode).toMatch(/uswest-accepts-hub-peering-\$\{local\.env_suffix\}/);
      expect(tgwPeeringCode).toMatch(/europe-accepts-hub-peering-\$\{local\.env_suffix\}/);
    });
  });

  describe('Route Tables Configuration', () => {
    test('should create route from hub to uswest in TGW route table', () => {
      expect(routeTablesCode).toMatch(/resource\s+"aws_ec2_transit_gateway_route"\s+"hub_to_uswest"/);
      expect(routeTablesCode).toMatch(/destination_cidr_block\s*=\s*var\.uswest_vpc_cidr/);
    });

    test('should create route from hub to europe in TGW route table', () => {
      expect(routeTablesCode).toMatch(/resource\s+"aws_ec2_transit_gateway_route"\s+"hub_to_europe"/);
      expect(routeTablesCode).toMatch(/destination_cidr_block\s*=\s*var\.europe_vpc_cidr/);
    });

    test('should create route from uswest to hub in TGW route table', () => {
      expect(routeTablesCode).toMatch(/resource\s+"aws_ec2_transit_gateway_route"\s+"uswest_to_hub"/);
      expect(routeTablesCode).toMatch(/destination_cidr_block\s*=\s*var\.hub_vpc_cidr/);
    });

    test('should create route from uswest to europe through hub', () => {
      expect(routeTablesCode).toMatch(/resource\s+"aws_ec2_transit_gateway_route"\s+"uswest_to_europe"/);
      expect(routeTablesCode).toMatch(/destination_cidr_block\s*=\s*var\.europe_vpc_cidr/);
    });

    test('should create route from europe to hub in TGW route table', () => {
      expect(routeTablesCode).toMatch(/resource\s+"aws_ec2_transit_gateway_route"\s+"europe_to_hub"/);
      expect(routeTablesCode).toMatch(/destination_cidr_block\s*=\s*var\.hub_vpc_cidr/);
    });

    test('should create route from europe to uswest through hub', () => {
      expect(routeTablesCode).toMatch(/resource\s+"aws_ec2_transit_gateway_route"\s+"europe_to_uswest"/);
      expect(routeTablesCode).toMatch(/destination_cidr_block\s*=\s*var\.uswest_vpc_cidr/);
    });

    test('should create VPC route from hub public to uswest', () => {
      expect(routeTablesCode).toMatch(/resource\s+"aws_route"\s+"hub_public_to_uswest"/);
      expect(routeTablesCode).toMatch(/route_table_id\s*=\s*module\.hub_vpc\.public_route_table_id/);
    });

    test('should create VPC route from hub public to europe', () => {
      expect(routeTablesCode).toMatch(/resource\s+"aws_route"\s+"hub_public_to_europe"/);
      expect(routeTablesCode).toMatch(/route_table_id\s*=\s*module\.hub_vpc\.public_route_table_id/);
    });

    test('should create VPC routes from hub private subnets to uswest', () => {
      expect(routeTablesCode).toMatch(/resource\s+"aws_route"\s+"hub_private_to_uswest"/);
      expect(routeTablesCode).toMatch(/count\s*=\s*length\(module\.hub_vpc\.private_route_table_ids\)/);
    });

    test('should create VPC routes from hub private subnets to europe', () => {
      expect(routeTablesCode).toMatch(/resource\s+"aws_route"\s+"hub_private_to_europe"/);
    });

    test('should create VPC routes from uswest to hub and europe', () => {
      expect(routeTablesCode).toMatch(/resource\s+"aws_route"\s+"uswest_public_to_hub"/);
      expect(routeTablesCode).toMatch(/resource\s+"aws_route"\s+"uswest_public_to_europe"/);
    });

    test('should create VPC routes from europe to hub and uswest', () => {
      expect(routeTablesCode).toMatch(/resource\s+"aws_route"\s+"europe_public_to_hub"/);
      expect(routeTablesCode).toMatch(/resource\s+"aws_route"\s+"europe_public_to_uswest"/);
    });

    test('should use correct providers for each route', () => {
      const hubRoutes = routeTablesCode.match(/provider\s*=\s*aws\.hub/g);
      const uswestRoutes = routeTablesCode.match(/provider\s*=\s*aws\.us_west/g);
      const europeRoutes = routeTablesCode.match(/provider\s*=\s*aws\.europe/g);

      expect(hubRoutes?.length).toBeGreaterThan(0);
      expect(uswestRoutes?.length).toBeGreaterThan(0);
      expect(europeRoutes?.length).toBeGreaterThan(0);
    });
  });

  describe('Route53 Private Hosted Zone', () => {
    test('should declare route53_zone module', () => {
      expect(route53Code).toMatch(/module\s+"route53_zone"\s+\{/);
      expect(route53Code).toMatch(/source\s*=\s*"\.\/modules\/route53-zone"/);
    });

    test('should pass domain_name variable', () => {
      expect(route53Code).toMatch(/domain_name\s*=\s*var\.route53_domain_name/);
    });

    test('should associate with hub VPC', () => {
      expect(route53Code).toMatch(/primary_vpc_id\s*=\s*module\.hub_vpc\.vpc_id/);
    });

    test('should create VPC association authorization for uswest', () => {
      expect(route53Code).toMatch(/resource\s+"aws_route53_vpc_association_authorization"\s+"uswest"/);
      expect(route53Code).toMatch(/vpc_id\s*=\s*module\.uswest_vpc\.vpc_id/);
    });

    test('should create VPC association for uswest', () => {
      expect(route53Code).toMatch(/resource\s+"aws_route53_zone_association"\s+"uswest"/);
      expect(route53Code).toMatch(/provider\s*=\s*aws\.us_west/);
    });

    test('should create VPC association authorization for europe', () => {
      expect(route53Code).toMatch(/resource\s+"aws_route53_vpc_association_authorization"\s+"europe"/);
      expect(route53Code).toMatch(/vpc_id\s*=\s*module\.europe_vpc\.vpc_id/);
    });

    test('should create VPC association for europe', () => {
      expect(route53Code).toMatch(/resource\s+"aws_route53_zone_association"\s+"europe"/);
      expect(route53Code).toMatch(/provider\s*=\s*aws\.europe/);
    });
  });

  describe('VPC Endpoints', () => {
    test('should declare hub_vpc_endpoints module', () => {
      expect(vpcEndpointsCode).toMatch(/module\s+"hub_vpc_endpoints"\s+\{/);
      expect(vpcEndpointsCode).toMatch(/source\s*=\s*"\.\/modules\/vpc-endpoints"/);
    });

    test('should deploy endpoints in hub private subnets', () => {
      expect(vpcEndpointsCode).toMatch(/subnet_ids\s*=\s*module\.hub_vpc\.private_subnet_ids/);
    });

    test('should declare uswest_vpc_endpoints module', () => {
      expect(vpcEndpointsCode).toMatch(/module\s+"uswest_vpc_endpoints"\s+\{/);
    });

    test('should use correct provider for uswest endpoints', () => {
      expect(vpcEndpointsCode).toMatch(/providers\s*=\s*\{[\s\S]*?aws\s*=\s*aws\.us_west/);
    });

    test('should declare europe_vpc_endpoints module', () => {
      expect(vpcEndpointsCode).toMatch(/module\s+"europe_vpc_endpoints"\s+\{/);
    });

    test('should use correct provider for europe endpoints', () => {
      expect(vpcEndpointsCode).toMatch(/providers\s*=\s*\{[\s\S]*?aws\s*=\s*aws\.europe/);
    });

    test('should pass correct VPC CIDRs to endpoints', () => {
      expect(vpcEndpointsCode).toMatch(/vpc_cidr\s*=\s*var\.hub_vpc_cidr/);
      expect(vpcEndpointsCode).toMatch(/vpc_cidr\s*=\s*var\.uswest_vpc_cidr/);
      expect(vpcEndpointsCode).toMatch(/vpc_cidr\s*=\s*var\.europe_vpc_cidr/);
    });

    test('should use environment_suffix for endpoint naming', () => {
      expect(vpcEndpointsCode).toMatch(/environment_suffix\s*=\s*local\.env_suffix/);
    });

    test('should set correct regions for endpoints', () => {
      expect(vpcEndpointsCode).toMatch(/region\s*=\s*"us-east-1"/);
      expect(vpcEndpointsCode).toMatch(/region\s*=\s*"us-west-2"/);
      expect(vpcEndpointsCode).toMatch(/region\s*=\s*"eu-west-1"/);
    });
  });

  describe('VPC Flow Logs', () => {
    test('should create S3 bucket for flow logs', () => {
      expect(flowLogsCode).toMatch(/resource\s+"aws_s3_bucket"\s+"flow_logs"/);
      expect(flowLogsCode).toMatch(/bucket\s*=\s*"shared-us-east-1-s3-flowlogs-\$\{local\.env_suffix\}"/);
    });

    test('should block public access on flow logs bucket', () => {
      expect(flowLogsCode).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"flow_logs"/);
      expect(flowLogsCode).toMatch(/block_public_acls\s*=\s*true/);
      expect(flowLogsCode).toMatch(/block_public_policy\s*=\s*true/);
    });

    test('should enable versioning on flow logs bucket', () => {
      expect(flowLogsCode).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"flow_logs"/);
      expect(flowLogsCode).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('should enable encryption on flow logs bucket', () => {
      expect(flowLogsCode).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"flow_logs"/);
      expect(flowLogsCode).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test('should configure lifecycle policy for flow logs', () => {
      expect(flowLogsCode).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"flow_logs"/);
      expect(flowLogsCode).toMatch(/expiration\s*\{[\s\S]*?days\s*=\s*var\.flow_logs_retention_days/);
    });

    test('should configure bucket policy for flow logs', () => {
      expect(flowLogsCode).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"flow_logs"/);
      expect(flowLogsCode).toMatch(/AWSLogDeliveryWrite/);
      expect(flowLogsCode).toMatch(/AWSLogDeliveryAclCheck/);
    });

    test('should declare hub_flow_logs module', () => {
      expect(flowLogsCode).toMatch(/module\s+"hub_flow_logs"\s+\{/);
      expect(flowLogsCode).toMatch(/log_prefix\s*=\s*"us-east-1\/hub"/);
    });

    test('should declare uswest_flow_logs module', () => {
      expect(flowLogsCode).toMatch(/module\s+"uswest_flow_logs"\s+\{/);
      expect(flowLogsCode).toMatch(/log_prefix\s*=\s*"us-west-2\/spoke"/);
    });

    test('should declare europe_flow_logs module', () => {
      expect(flowLogsCode).toMatch(/module\s+"europe_flow_logs"\s+\{/);
      expect(flowLogsCode).toMatch(/log_prefix\s*=\s*"eu-west-1\/spoke"/);
    });

    test('should use environment_suffix in flow log names', () => {
      expect(flowLogsCode).toMatch(/environment_suffix\s*=\s*local\.env_suffix/);
    });
  });

  describe('Security Groups', () => {
    test('should create hub application security group', () => {
      expect(securityGroupsCode).toMatch(/resource\s+"aws_security_group"\s+"hub_application"/);
      expect(securityGroupsCode).toMatch(/name\s*=\s*"hub-application-sg-\$\{local\.env_suffix\}"/);
    });

    test('should allow ingress from uswest to hub', () => {
      expect(securityGroupsCode).toMatch(/resource\s+"aws_vpc_security_group_ingress_rule"\s+"hub_app_from_uswest"/);
      expect(securityGroupsCode).toMatch(/cidr_ipv4\s*=\s*var\.uswest_vpc_cidr/);
    });

    test('should allow ingress from europe to hub', () => {
      expect(securityGroupsCode).toMatch(/resource\s+"aws_vpc_security_group_ingress_rule"\s+"hub_app_from_europe"/);
      expect(securityGroupsCode).toMatch(/cidr_ipv4\s*=\s*var\.europe_vpc_cidr/);
    });

    test('should create uswest application security group', () => {
      expect(securityGroupsCode).toMatch(/resource\s+"aws_security_group"\s+"uswest_application"/);
      expect(securityGroupsCode).toMatch(/name\s*=\s*"uswest-application-sg-\$\{local\.env_suffix\}"/);
    });

    test('should allow ingress from hub to uswest', () => {
      expect(securityGroupsCode).toMatch(/resource\s+"aws_vpc_security_group_ingress_rule"\s+"uswest_app_from_hub"/);
      expect(securityGroupsCode).toMatch(/cidr_ipv4\s*=\s*var\.hub_vpc_cidr/);
    });

    test('should create europe application security group', () => {
      expect(securityGroupsCode).toMatch(/resource\s+"aws_security_group"\s+"europe_application"/);
      expect(securityGroupsCode).toMatch(/name\s*=\s*"europe-application-sg-\$\{local\.env_suffix\}"/);
    });

    test('should allow cross-region traffic between all VPCs', () => {
      const ingressRules = securityGroupsCode.match(/aws_vpc_security_group_ingress_rule/g);
      expect(ingressRules?.length).toBeGreaterThanOrEqual(9);
    });

    test('should allow all egress traffic from security groups', () => {
      expect(securityGroupsCode).toMatch(/resource\s+"aws_vpc_security_group_egress_rule"\s+"hub_app_egress"/);
      expect(securityGroupsCode).toMatch(/resource\s+"aws_vpc_security_group_egress_rule"\s+"uswest_app_egress"/);
      expect(securityGroupsCode).toMatch(/resource\s+"aws_vpc_security_group_egress_rule"\s+"europe_app_egress"/);
    });

    test('should use correct providers for security groups', () => {
      expect(securityGroupsCode).toMatch(/provider\s*=\s*aws\.hub/);
      expect(securityGroupsCode).toMatch(/provider\s*=\s*aws\.us_west/);
      expect(securityGroupsCode).toMatch(/provider\s*=\s*aws\.europe/);
    });
  });

  describe('Outputs', () => {
    test('should output environment_suffix', () => {
      expect(outputsCode).toMatch(/output\s+"environment_suffix"\s+\{/);
      expect(outputsCode).toMatch(/value\s*=\s*local\.env_suffix/);
    });

    test('should output all VPC IDs', () => {
      expect(outputsCode).toMatch(/output\s+"hub_vpc_id"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"uswest_vpc_id"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"europe_vpc_id"\s+\{/);
    });

    test('should output all VPC CIDRs', () => {
      expect(outputsCode).toMatch(/output\s+"hub_vpc_cidr"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"uswest_vpc_cidr"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"europe_vpc_cidr"\s+\{/);
    });

    test('should output all subnet IDs', () => {
      expect(outputsCode).toMatch(/output\s+"hub_public_subnet_ids"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"hub_private_subnet_ids"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"uswest_public_subnet_ids"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"uswest_private_subnet_ids"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"europe_public_subnet_ids"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"europe_private_subnet_ids"\s+\{/);
    });

    test('should output all Transit Gateway IDs', () => {
      expect(outputsCode).toMatch(/output\s+"hub_tgw_id"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"uswest_tgw_id"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"europe_tgw_id"\s+\{/);
    });

    test('should output all Transit Gateway ARNs', () => {
      expect(outputsCode).toMatch(/output\s+"hub_tgw_arn"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"uswest_tgw_arn"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"europe_tgw_arn"\s+\{/);
    });

    test('should output peering attachment IDs', () => {
      expect(outputsCode).toMatch(/output\s+"hub_to_uswest_peering_id"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"hub_to_europe_peering_id"\s+\{/);
    });

    test('should output Route53 zone details', () => {
      expect(outputsCode).toMatch(/output\s+"route53_zone_id"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"route53_zone_name"\s+\{/);
    });

    test('should output flow logs bucket details', () => {
      expect(outputsCode).toMatch(/output\s+"flow_logs_bucket_name"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"flow_logs_bucket_arn"\s+\{/);
    });

    test('should output VPC endpoint IDs', () => {
      expect(outputsCode).toMatch(/output\s+"hub_ssm_endpoint_id"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"uswest_ssm_endpoint_id"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"europe_ssm_endpoint_id"\s+\{/);
    });

    test('should output NAT Gateway IDs for all regions', () => {
      expect(outputsCode).toMatch(/output\s+"hub_nat_gateway_ids"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"uswest_nat_gateway_ids"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"europe_nat_gateway_ids"\s+\{/);
    });

    test('should output flow log IDs for all VPCs', () => {
      expect(outputsCode).toMatch(/output\s+"hub_flow_log_id"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"uswest_flow_log_id"\s+\{/);
      expect(outputsCode).toMatch(/output\s+"europe_flow_log_id"\s+\{/);
    });
  });

  describe('environment_suffix Usage', () => {
    test('should use env_suffix in hub VPC resources', () => {
      expect(vpcHubCode).toMatch(/environment_suffix\s*=\s*local\.env_suffix/);
    });

    test('should use env_suffix in spoke VPC resources', () => {
      expect(vpcUswestCode).toMatch(/environment_suffix\s*=\s*local\.env_suffix/);
      expect(vpcEuropeCode).toMatch(/environment_suffix\s*=\s*local\.env_suffix/);
    });

    test('should use env_suffix in Transit Gateway resources', () => {
      expect(tgwHubCode).toMatch(/environment_suffix\s*=\s*local\.env_suffix/);
      expect(tgwHubCode).toMatch(/\$\{local\.env_suffix\}/);
    });

    test('should use env_suffix in peering resources', () => {
      expect(tgwPeeringCode).toMatch(/environment_suffix\s*=\s*local\.env_suffix/);
      expect(tgwPeeringCode).toMatch(/\$\{local\.env_suffix\}/);
    });

    test('should use env_suffix in flow logs bucket', () => {
      expect(flowLogsCode).toMatch(/shared-us-east-1-s3-flowlogs-\$\{local\.env_suffix\}/);
    });

    test('should use env_suffix in security group names', () => {
      expect(securityGroupsCode).toMatch(/hub-application-sg-\$\{local\.env_suffix\}/);
      expect(securityGroupsCode).toMatch(/uswest-application-sg-\$\{local\.env_suffix\}/);
      expect(securityGroupsCode).toMatch(/europe-application-sg-\$\{local\.env_suffix\}/);
    });
  });
});
