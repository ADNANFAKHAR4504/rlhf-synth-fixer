import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Read all Terraform files
const libPath = join(__dirname, '../lib');
const providerCode = readFileSync(join(libPath, 'provider.tf'), 'utf-8');
const variablesCode = readFileSync(join(libPath, 'variables.tf'), 'utf-8');
const dataCode = readFileSync(join(libPath, 'data.tf'), 'utf-8');
const localsCode = readFileSync(join(libPath, 'locals.tf'), 'utf-8');
const vpcHubCode = readFileSync(join(libPath, 'vpc-hub.tf'), 'utf-8');
const vpcSpokesCode = readFileSync(join(libPath, 'vpc-spokes.tf'), 'utf-8');
const transitGatewayCode = readFileSync(join(libPath, 'transit-gateway.tf'), 'utf-8');
const natGatewaysCode = readFileSync(join(libPath, 'nat-gateways.tf'), 'utf-8');
const route53ResolverCode = readFileSync(join(libPath, 'route53-resolver.tf'), 'utf-8');
const dhcpOptionsCode = readFileSync(join(libPath, 'dhcp-options.tf'), 'utf-8');
const vpcEndpointsCode = readFileSync(join(libPath, 'vpc-endpoints.tf'), 'utf-8');
const flowLogsCode = readFileSync(join(libPath, 'flow-logs.tf'), 'utf-8');
const outputsCode = readFileSync(join(libPath, 'outputs.tf'), 'utf-8');

// Read module files
const vpcModuleMain = readFileSync(join(libPath, 'modules/vpc/main.tf'), 'utf-8');
const vpcModuleVariables = readFileSync(join(libPath, 'modules/vpc/variables.tf'), 'utf-8');
const vpcModuleOutputs = readFileSync(join(libPath, 'modules/vpc/outputs.tf'), 'utf-8');

const spokeVpcModuleMain = readFileSync(join(libPath, 'modules/spoke-vpc/main.tf'), 'utf-8');
const spokeVpcModuleVariables = readFileSync(join(libPath, 'modules/spoke-vpc/variables.tf'), 'utf-8');
const spokeVpcModuleOutputs = readFileSync(join(libPath, 'modules/spoke-vpc/outputs.tf'), 'utf-8');

const tgwModuleMain = readFileSync(join(libPath, 'modules/transit-gateway/main.tf'), 'utf-8');
const tgwModuleVariables = readFileSync(join(libPath, 'modules/transit-gateway/variables.tf'), 'utf-8');
const tgwModuleOutputs = readFileSync(join(libPath, 'modules/transit-gateway/outputs.tf'), 'utf-8');

const vpcEndpointsModuleMain = readFileSync(join(libPath, 'modules/vpc-endpoints/main.tf'), 'utf-8');
const vpcEndpointsModuleVariables = readFileSync(join(libPath, 'modules/vpc-endpoints/variables.tf'), 'utf-8');
const vpcEndpointsModuleOutputs = readFileSync(join(libPath, 'modules/vpc-endpoints/outputs.tf'), 'utf-8');

const flowLogsModuleMain = readFileSync(join(libPath, 'modules/flow-logs/main.tf'), 'utf-8');
const flowLogsModuleVariables = readFileSync(join(libPath, 'modules/flow-logs/variables.tf'), 'utf-8');
const flowLogsModuleOutputs = readFileSync(join(libPath, 'modules/flow-logs/outputs.tf'), 'utf-8');

describe('Terraform Infrastructure Unit Tests', () => {
  
  describe('Versions and Provider Configuration', () => {
    test('should define Terraform version constraint >= 1.4.0', () => {
      expect(providerCode).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test('should define AWS provider with version >= 5.0', () => {
      expect(providerCode).toMatch(/aws\s*=\s*\{[\s\S]*?version\s*=\s*">=\s*5\.0"/);
    });

    test('should define random provider', () => {
      expect(providerCode).toMatch(/random\s*=\s*\{/);
    });

    test('should configure S3 backend', () => {
      expect(providerCode).toMatch(/backend\s+"s3"\s*\{\s*\}/);
    });

    test('should define AWS provider in provider.tf', () => {
      expect(providerCode).toMatch(/provider\s+"aws"/);
    });
  });

  describe('Variables', () => {
    test('should define region variable with default us-east-1', () => {
      expect(variablesCode).toMatch(/variable\s+"region"[\s\S]*?default\s*=\s*"us-east-1"/);
    });

    test('should define environment_suffix variable with validation', () => {
      expect(variablesCode).toMatch(/variable\s+"environment_suffix"/);
      expect(variablesCode).toMatch(/validation\s*\{/);
    });

    test('should define hub_vpc_cidr variable with default 10.0.0.0/16', () => {
      expect(variablesCode).toMatch(/variable\s+"hub_vpc_cidr"[\s\S]*?default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test('should define production_vpc_cidr variable with default 10.1.0.0/16', () => {
      expect(variablesCode).toMatch(/variable\s+"production_vpc_cidr"[\s\S]*?default\s*=\s*"10\.1\.0\.0\/16"/);
    });

    test('should define development_vpc_cidr variable with default 10.2.0.0/16', () => {
      expect(variablesCode).toMatch(/variable\s+"development_vpc_cidr"[\s\S]*?default\s*=\s*"10\.2\.0\.0\/16"/);
    });

    test('should define availability_zone_count variable with default 3', () => {
      expect(variablesCode).toMatch(/variable\s+"availability_zone_count"[\s\S]*?default\s*=\s*3/);
    });

    test('should define transit_gateway_asn variable with default 64512', () => {
      expect(variablesCode).toMatch(/variable\s+"transit_gateway_asn"[\s\S]*?default\s*=\s*64512/);
    });

    test('should define cost_center variable', () => {
      expect(variablesCode).toMatch(/variable\s+"cost_center"/);
    });

    test('should define project variable', () => {
      expect(variablesCode).toMatch(/variable\s+"project"/);
    });

    test('should define flow_logs_retention_days variable', () => {
      expect(variablesCode).toMatch(/variable\s+"flow_logs_retention_days"/);
    });

    test('should define flow_logs_glacier_transition_days variable', () => {
      expect(variablesCode).toMatch(/variable\s+"flow_logs_glacier_transition_days"/);
    });

    test('should define enable_nat_gateway boolean variable', () => {
      expect(variablesCode).toMatch(/variable\s+"enable_nat_gateway"[\s\S]*?type\s*=\s*bool/);
    });

    test('should define enable_flow_logs boolean variable', () => {
      expect(variablesCode).toMatch(/variable\s+"enable_flow_logs"[\s\S]*?type\s*=\s*bool/);
    });

    test('should define enable_vpc_endpoints boolean variable', () => {
      expect(variablesCode).toMatch(/variable\s+"enable_vpc_endpoints"[\s\S]*?type\s*=\s*bool/);
    });

    test('should define enable_route53_resolver boolean variable', () => {
      expect(variablesCode).toMatch(/variable\s+"enable_route53_resolver"[\s\S]*?type\s*=\s*bool/);
    });
  });

  describe('Data Sources', () => {
    test('should define availability zones data source', () => {
      expect(dataCode).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });

    test('should filter availability zones by opt-in-not-required', () => {
      expect(dataCode).toMatch(/opt-in-not-required/);
    });

    test('should define caller identity data source', () => {
      expect(dataCode).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test('should define partition data source', () => {
      expect(dataCode).toMatch(/data\s+"aws_partition"\s+"current"/);
    });

    test('should define region data source', () => {
      expect(dataCode).toMatch(/data\s+"aws_region"\s+"current"/);
    });
  });

  describe('Locals and Random Resources', () => {
    test('should define random_string resource for unique naming', () => {
      expect(localsCode).toMatch(/resource\s+"random_string"\s+"suffix"/);
    });

    test('should configure random_string with length 8', () => {
      expect(localsCode).toMatch(/length\s*=\s*8/);
    });

    test('should set random_string special to false', () => {
      expect(localsCode).toMatch(/special\s*=\s*false/);
    });

    test('should set random_string upper to false', () => {
      expect(localsCode).toMatch(/upper\s*=\s*false/);
    });

    test('should define selected_azs local variable', () => {
      expect(localsCode).toMatch(/selected_azs\s*=/);
    });

    test('should define name_suffix local variable with conditional logic', () => {
      expect(localsCode).toMatch(/name_suffix\s*=.*environment_suffix.*random_string\.suffix/);
    });

    test('should define common_tags local variable', () => {
      expect(localsCode).toMatch(/common_tags\s*=/);
    });

    test('should define hub_tags local variable', () => {
      expect(localsCode).toMatch(/hub_tags\s*=/);
    });

    test('should define production_tags local variable', () => {
      expect(localsCode).toMatch(/production_tags\s*=/);
    });

    test('should define development_tags local variable', () => {
      expect(localsCode).toMatch(/development_tags\s*=/);
    });
  });

  describe('VPC Module Structure', () => {
    test('should define VPC module in vpc-hub.tf', () => {
      expect(vpcHubCode).toMatch(/module\s+"vpc_hub"/);
    });

    test('should reference vpc module source', () => {
      expect(vpcHubCode).toMatch(/source\s*=\s*"\.\/modules\/vpc"/);
    });

    test('should pass vpc_cidr to hub module', () => {
      expect(vpcHubCode).toMatch(/vpc_cidr.*hub_vpc_cidr/);
    });

    test('should set hub environment to "hub"', () => {
      expect(vpcHubCode).toMatch(/environment\s*=\s*"hub"/);
    });

    test('should enable IGW for hub VPC', () => {
      expect(vpcHubCode).toMatch(/create_igw\s*=\s*true/);
    });

    test('should enable public subnets for hub VPC', () => {
      expect(vpcHubCode).toMatch(/create_public_subnets\s*=\s*true/);
    });
  });

  describe('Spoke VPC Modules', () => {
    test('should define production spoke VPC module', () => {
      expect(vpcSpokesCode).toMatch(/module\s+"vpc_production"/);
    });

    test('should reference spoke-vpc module source for production', () => {
      expect(vpcSpokesCode).toMatch(/source\s*=\s*"\.\/modules\/spoke-vpc"/);
    });

    test('should define development spoke VPC module', () => {
      expect(vpcSpokesCode).toMatch(/module\s+"vpc_development"/);
    });

    test('should pass production_vpc_cidr to production module', () => {
      expect(vpcSpokesCode).toMatch(/vpc_cidr.*production_vpc_cidr/);
    });

    test('should pass development_vpc_cidr to development module', () => {
      expect(vpcSpokesCode).toMatch(/vpc_cidr.*development_vpc_cidr/);
    });

    test('should set production environment to "production"', () => {
      expect(vpcSpokesCode).toMatch(/environment\s*=\s*"production"/);
    });

    test('should set development environment to "development"', () => {
      expect(vpcSpokesCode).toMatch(/environment\s*=\s*"development"/);
    });
  });

  describe('Transit Gateway Configuration', () => {
    test('should define transit_gateway module', () => {
      expect(transitGatewayCode).toMatch(/module\s+"transit_gateway"/);
    });

    test('should reference transit-gateway module source', () => {
      expect(transitGatewayCode).toMatch(/source\s*=\s*"\.\/modules\/transit-gateway"/);
    });

    test('should define vpc_attachments with hub entry', () => {
      expect(transitGatewayCode).toMatch(/vpc_attachments\s*=\s*\{[\s\S]*?hub\s*=/);
    });

    test('should define vpc_attachments with production entry', () => {
      expect(transitGatewayCode).toMatch(/vpc_attachments\s*=\s*\{[\s\S]*?production\s*=/);
    });

    test('should define vpc_attachments with development entry', () => {
      expect(transitGatewayCode).toMatch(/vpc_attachments\s*=\s*\{[\s\S]*?development\s*=/);
    });

    test('should define routes from hub to production', () => {
      expect(transitGatewayCode).toMatch(/resource\s+"aws_route"\s+"hub_to_production"/);
    });

    test('should define routes from hub to development', () => {
      expect(transitGatewayCode).toMatch(/resource\s+"aws_route"\s+"hub_to_development"/);
    });

    test('should define default route for production spoke', () => {
      expect(transitGatewayCode).toMatch(/resource\s+"aws_route"\s+"production_default"/);
    });

    test('should define default route for development spoke', () => {
      expect(transitGatewayCode).toMatch(/resource\s+"aws_route"\s+"development_default"/);
    });

    test('should set destination_cidr_block to 0.0.0.0/0 for spoke default routes', () => {
      const defaultRoutes = transitGatewayCode.match(/resource\s+"aws_route"\s+"(production|development)_default"[\s\S]*?destination_cidr_block\s*=\s*"0\.0\.0\.0\/0"/g);
      expect(defaultRoutes).not.toBeNull();
      expect(defaultRoutes!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('NAT Gateways', () => {
    test('should define EIP resources for NAT gateways', () => {
      expect(natGatewaysCode).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    });

    test('should create EIPs conditionally based on enable_nat_gateway', () => {
      expect(natGatewaysCode).toMatch(/count\s*=.*enable_nat_gateway/);
    });

    test('should define NAT gateway resources', () => {
      expect(natGatewaysCode).toMatch(/resource\s+"aws_nat_gateway"\s+"hub"/);
    });

    test('should create NAT gateways in hub public subnets', () => {
      expect(natGatewaysCode).toMatch(/subnet_id\s*=.*vpc_hub\.public_subnet_ids/);
    });

    test('should define routes from hub private subnets to NAT gateways', () => {
      expect(natGatewaysCode).toMatch(/resource\s+"aws_route"\s+"hub_private_nat"/);
    });

    test('should use naming convention with environment suffix for NAT gateways', () => {
      expect(natGatewaysCode).toMatch(/Name.*hub.*nat.*name_suffix/);
    });
  });

  describe('Route53 Resolver', () => {
    test('should define security group for resolver', () => {
      expect(route53ResolverCode).toMatch(/resource\s+"aws_security_group"\s+"resolver"/);
    });

    test('should allow DNS UDP (port 53) ingress', () => {
      expect(route53ResolverCode).toMatch(/from_port\s*=\s*53[\s\S]*?to_port\s*=\s*53[\s\S]*?protocol\s*=\s*"udp"/);
    });

    test('should allow DNS TCP (port 53) ingress', () => {
      expect(route53ResolverCode).toMatch(/from_port\s*=\s*53[\s\S]*?to_port\s*=\s*53[\s\S]*?protocol\s*=\s*"tcp"/);
    });

    test('should allow ingress from 10.0.0.0/8 CIDR', () => {
      expect(route53ResolverCode).toMatch(/cidr_blocks\s*=\s*\["10\.0\.0\.0\/8"\]/);
    });

    test('should define Route53 resolver inbound endpoint', () => {
      expect(route53ResolverCode).toMatch(/resource\s+"aws_route53_resolver_endpoint"\s+"inbound"/);
    });

    test('should define Route53 resolver outbound endpoint', () => {
      expect(route53ResolverCode).toMatch(/resource\s+"aws_route53_resolver_endpoint"\s+"outbound"/);
    });

    test('should set inbound endpoint direction to INBOUND', () => {
      expect(route53ResolverCode).toMatch(/resource\s+"aws_route53_resolver_endpoint"\s+"inbound"[\s\S]*?direction\s*=\s*"INBOUND"/);
    });

    test('should set outbound endpoint direction to OUTBOUND', () => {
      expect(route53ResolverCode).toMatch(/resource\s+"aws_route53_resolver_endpoint"\s+"outbound"[\s\S]*?direction\s*=\s*"OUTBOUND"/);
    });

    test('should define RAM resource share for resolver rules', () => {
      expect(route53ResolverCode).toMatch(/resource\s+"aws_ram_resource_share"\s+"resolver_rules"/);
    });

    test('should define RAM principal association', () => {
      expect(route53ResolverCode).toMatch(/resource\s+"aws_ram_principal_association"\s+"resolver_rules"/);
    });
  });

  describe('DHCP Options', () => {
    test('should define DHCP options for hub VPC', () => {
      expect(dhcpOptionsCode).toMatch(/resource\s+"aws_vpc_dhcp_options"\s+"hub"/);
    });

    test('should define DHCP options for production VPC', () => {
      expect(dhcpOptionsCode).toMatch(/resource\s+"aws_vpc_dhcp_options"\s+"production"/);
    });

    test('should define DHCP options for development VPC', () => {
      expect(dhcpOptionsCode).toMatch(/resource\s+"aws_vpc_dhcp_options"\s+"development"/);
    });

    test('should set hub domain name to hub.company.internal', () => {
      expect(dhcpOptionsCode).toMatch(/resource\s+"aws_vpc_dhcp_options"\s+"hub"[\s\S]*?domain_name\s*=\s*"hub\.company\.internal"/);
    });

    test('should set production domain name to prod.company.internal', () => {
      expect(dhcpOptionsCode).toMatch(/resource\s+"aws_vpc_dhcp_options"\s+"production"[\s\S]*?domain_name\s*=\s*"prod\.company\.internal"/);
    });

    test('should set development domain name to dev.company.internal', () => {
      expect(dhcpOptionsCode).toMatch(/resource\s+"aws_vpc_dhcp_options"\s+"development"[\s\S]*?domain_name\s*=\s*"dev\.company\.internal"/);
    });

    test('should use AmazonProvidedDNS for domain name servers', () => {
      const amazonDns = dhcpOptionsCode.match(/domain_name_servers\s*=\s*\["AmazonProvidedDNS"\]/g);
      expect(amazonDns).not.toBeNull();
      expect(amazonDns!.length).toBe(3);
    });

    test('should define DHCP options associations for all VPCs', () => {
      expect(dhcpOptionsCode).toMatch(/resource\s+"aws_vpc_dhcp_options_association"\s+"hub"/);
      expect(dhcpOptionsCode).toMatch(/resource\s+"aws_vpc_dhcp_options_association"\s+"production"/);
      expect(dhcpOptionsCode).toMatch(/resource\s+"aws_vpc_dhcp_options_association"\s+"development"/);
    });
  });

  describe('VPC Endpoints', () => {
    test('should define VPC endpoints module for hub', () => {
      expect(vpcEndpointsCode).toMatch(/module\s+"vpc_endpoints_hub"/);
    });

    test('should define VPC endpoints module for production', () => {
      expect(vpcEndpointsCode).toMatch(/module\s+"vpc_endpoints_production"/);
    });

    test('should define VPC endpoints module for development', () => {
      expect(vpcEndpointsCode).toMatch(/module\s+"vpc_endpoints_development"/);
    });

    test('should create endpoints conditionally based on enable_vpc_endpoints', () => {
      expect(vpcEndpointsCode).toMatch(/count\s*=.*enable_vpc_endpoints/);
    });

    test('should reference vpc-endpoints module source', () => {
      expect(vpcEndpointsCode).toMatch(/source\s*=\s*"\.\/modules\/vpc-endpoints"/);
    });
  });

  describe('VPC Flow Logs', () => {
    test('should define flow_logs module', () => {
      expect(flowLogsCode).toMatch(/module\s+"flow_logs"/);
    });

    test('should create flow logs conditionally based on enable_flow_logs', () => {
      expect(flowLogsCode).toMatch(/count\s*=.*enable_flow_logs/);
    });

    test('should reference flow-logs module source', () => {
      expect(flowLogsCode).toMatch(/source\s*=\s*"\.\/modules\/flow-logs"/);
    });

    test('should define vpc_configs with hub entry', () => {
      expect(flowLogsCode).toMatch(/vpc_configs\s*=\s*\{[\s\S]*?hub\s*=/);
    });

    test('should define vpc_configs with production entry', () => {
      expect(flowLogsCode).toMatch(/vpc_configs\s*=\s*\{[\s\S]*?production\s*=/);
    });

    test('should define vpc_configs with development entry', () => {
      expect(flowLogsCode).toMatch(/vpc_configs\s*=\s*\{[\s\S]*?development\s*=/);
    });

    test('should use environment suffix in bucket name', () => {
      expect(flowLogsCode).toMatch(/bucket_name.*name_suffix/);
    });
  });

  describe('Outputs', () => {
    test('should define vpc_ids output', () => {
      expect(outputsCode).toMatch(/output\s+"vpc_ids"/);
    });

    test('should define vpc_cidrs output', () => {
      expect(outputsCode).toMatch(/output\s+"vpc_cidrs"/);
    });

    test('should define subnet_ids output', () => {
      expect(outputsCode).toMatch(/output\s+"subnet_ids"/);
    });

    test('should define transit_gateway_id output', () => {
      expect(outputsCode).toMatch(/output\s+"transit_gateway_id"/);
    });

    test('should define transit_gateway_arn output', () => {
      expect(outputsCode).toMatch(/output\s+"transit_gateway_arn"/);
    });

    test('should define transit_gateway_route_table_ids output', () => {
      expect(outputsCode).toMatch(/output\s+"transit_gateway_route_table_ids"/);
    });

    test('should define nat_gateway_ids output', () => {
      expect(outputsCode).toMatch(/output\s+"nat_gateway_ids"/);
    });

    test('should define nat_gateway_public_ips output', () => {
      expect(outputsCode).toMatch(/output\s+"nat_gateway_public_ips"/);
    });

    test('should define resolver_inbound_endpoint_ips output', () => {
      expect(outputsCode).toMatch(/output\s+"resolver_inbound_endpoint_ips"/);
    });

    test('should define resolver_endpoint_ids output', () => {
      expect(outputsCode).toMatch(/output\s+"resolver_endpoint_ids"/);
    });

    test('should define ssm_endpoint_dns_names output', () => {
      expect(outputsCode).toMatch(/output\s+"ssm_endpoint_dns_names"/);
    });

    test('should define flow_logs_s3_bucket output', () => {
      expect(outputsCode).toMatch(/output\s+"flow_logs_s3_bucket"/);
    });

    test('should define flow_log_ids output', () => {
      expect(outputsCode).toMatch(/output\s+"flow_log_ids"/);
    });

    test('should define environment_suffix output', () => {
      expect(outputsCode).toMatch(/output\s+"environment_suffix"/);
    });

    test('should define availability_zones output', () => {
      expect(outputsCode).toMatch(/output\s+"availability_zones"/);
    });
  });

  describe('VPC Module Implementation', () => {
    test('should create VPC resource in vpc module', () => {
      expect(vpcModuleMain).toMatch(/resource\s+"aws_vpc"\s+"this"/);
    });

    test('should enable DNS hostnames in VPC', () => {
      expect(vpcModuleMain).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('should enable DNS support in VPC', () => {
      expect(vpcModuleMain).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('should create Internet Gateway conditionally', () => {
      expect(vpcModuleMain).toMatch(/resource\s+"aws_internet_gateway"\s+"this"[\s\S]*?count\s*=.*create_igw/);
    });

    test('should create public subnets', () => {
      expect(vpcModuleMain).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    });

    test('should create private subnets', () => {
      expect(vpcModuleMain).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test('should create TGW attachment subnets', () => {
      expect(vpcModuleMain).toMatch(/resource\s+"aws_subnet"\s+"tgw_attachment"/);
    });

    test('should use cidrsubnet for subnet CIDR calculation', () => {
      expect(vpcModuleMain).toMatch(/cidrsubnet/);
    });

    test('should map public IPs on launch for public subnets', () => {
      expect(vpcModuleMain).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test('should create public route table', () => {
      expect(vpcModuleMain).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    });

    test('should create private route tables', () => {
      expect(vpcModuleMain).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    });

    test('should create route table associations', () => {
      expect(vpcModuleMain).toMatch(/resource\s+"aws_route_table_association"/);
    });

    test('should use environment suffix in resource names', () => {
      expect(vpcModuleMain).toMatch(/name_suffix/);
    });
  });

  describe('Spoke VPC Module Implementation', () => {
    test('should create VPC resource in spoke-vpc module', () => {
      expect(spokeVpcModuleMain).toMatch(/resource\s+"aws_vpc"\s+"this"/);
    });

    test('should use smaller public subnets in spoke VPCs', () => {
      expect(spokeVpcModuleMain).toMatch(/cidrsubnet\(var\.vpc_cidr,\s*10/);
    });

    test('should use larger private subnets in spoke VPCs', () => {
      expect(spokeVpcModuleMain).toMatch(/cidrsubnet\(var\.vpc_cidr,\s*6/);
    });

    test('should not create Internet Gateway in spoke VPC', () => {
      expect(spokeVpcModuleMain).not.toMatch(/resource\s+"aws_internet_gateway"/);
    });

    test('should not create NAT Gateway in spoke VPC', () => {
      expect(spokeVpcModuleMain).not.toMatch(/resource\s+"aws_nat_gateway"/);
    });

    test('should create single public route table', () => {
      expect(spokeVpcModuleMain).toMatch(/resource\s+"aws_route_table"\s+"public"[\s\S]*?vpc_id\s*=.*aws_vpc\.this\.id/);
    });

    test('should create single private route table', () => {
      expect(spokeVpcModuleMain).toMatch(/resource\s+"aws_route_table"\s+"private"[\s\S]*?vpc_id\s*=.*aws_vpc\.this\.id/);
    });
  });

  describe('Transit Gateway Module Implementation', () => {
    test('should create Transit Gateway resource', () => {
      expect(tgwModuleMain).toMatch(/resource\s+"aws_ec2_transit_gateway"\s+"this"/);
    });

    test('should disable default route table association', () => {
      expect(tgwModuleMain).toMatch(/default_route_table_association\s*=\s*"disable"/);
    });

    test('should disable default route table propagation', () => {
      expect(tgwModuleMain).toMatch(/default_route_table_propagation\s*=\s*"disable"/);
    });

    test('should enable DNS support', () => {
      expect(tgwModuleMain).toMatch(/dns_support\s*=\s*"enable"/);
    });

    test('should enable VPN ECMP support', () => {
      expect(tgwModuleMain).toMatch(/vpn_ecmp_support\s*=\s*"enable"/);
    });

    test('should create hub route table', () => {
      expect(tgwModuleMain).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table"\s+"hub"/);
    });

    test('should create spoke route table', () => {
      expect(tgwModuleMain).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table"\s+"spoke"/);
    });

    test('should create VPC attachments', () => {
      expect(tgwModuleMain).toMatch(/resource\s+"aws_ec2_transit_gateway_vpc_attachment"\s+"attachments"/);
    });

    test('should use for_each for VPC attachments', () => {
      expect(tgwModuleMain).toMatch(/for_each\s*=.*vpc_attachments/);
    });

    test('should create route table associations', () => {
      expect(tgwModuleMain).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table_association"/);
    });

    test('should create blackhole routes for spoke isolation', () => {
      expect(tgwModuleMain).toMatch(/resource\s+"aws_ec2_transit_gateway_route"\s+"spoke_isolation"[\s\S]*?blackhole\s*=\s*true/);
    });

    test('should create default route for spokes to hub', () => {
      expect(tgwModuleMain).toMatch(/resource\s+"aws_ec2_transit_gateway_route"\s+"spoke_default"[\s\S]*?destination_cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
    });

    test('should create routes from hub to spokes', () => {
      expect(tgwModuleMain).toMatch(/resource\s+"aws_ec2_transit_gateway_route"\s+"hub_to_spoke"/);
    });
  });

  describe('VPC Endpoints Module Implementation', () => {
    test('should create security group for VPC endpoints', () => {
      expect(vpcEndpointsModuleMain).toMatch(/resource\s+"aws_security_group"\s+"vpc_endpoints"/);
    });

    test('should allow HTTPS (port 443) ingress', () => {
      expect(vpcEndpointsModuleMain).toMatch(/from_port\s*=\s*443[\s\S]*?to_port\s*=\s*443/);
    });

    test('should create SSM endpoint', () => {
      expect(vpcEndpointsModuleMain).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssm"/);
    });

    test('should create SSM Messages endpoint', () => {
      expect(vpcEndpointsModuleMain).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssm_messages"/);
    });

    test('should create EC2 Messages endpoint', () => {
      expect(vpcEndpointsModuleMain).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ec2_messages"/);
    });

    test('should set VPC endpoint type to Interface', () => {
      const interfaceTypes = vpcEndpointsModuleMain.match(/vpc_endpoint_type\s*=\s*"Interface"/g);
      expect(interfaceTypes).not.toBeNull();
      expect(interfaceTypes!.length).toBe(3);
    });

    test('should enable private DNS for endpoints', () => {
      const privateDns = vpcEndpointsModuleMain.match(/private_dns_enabled\s*=\s*true/g);
      expect(privateDns).not.toBeNull();
      expect(privateDns!.length).toBe(3);
    });
  });

  describe('Flow Logs Module Implementation', () => {
    test('should create S3 bucket for flow logs', () => {
      expect(flowLogsModuleMain).toMatch(/resource\s+"aws_s3_bucket"\s+"flow_logs"/);
    });

    test('should enable versioning on S3 bucket', () => {
      expect(flowLogsModuleMain).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"flow_logs"/);
    });

    test('should enable server-side encryption', () => {
      expect(flowLogsModuleMain).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"flow_logs"/);
    });

    test('should block public access', () => {
      expect(flowLogsModuleMain).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"flow_logs"/);
    });

    test('should configure lifecycle policy', () => {
      expect(flowLogsModuleMain).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"flow_logs"/);
    });

    test('should transition to GLACIER storage class', () => {
      expect(flowLogsModuleMain).toMatch(/storage_class\s*=\s*"GLACIER"/);
    });

    test('should create IAM policy document for flow logs', () => {
      expect(flowLogsModuleMain).toMatch(/data\s+"aws_iam_policy_document"\s+"flow_logs"/);
    });

    test('should allow vpc-flow-logs service principal', () => {
      expect(flowLogsModuleMain).toMatch(/vpc-flow-logs\.amazonaws\.com/);
    });

    test('should apply bucket policy', () => {
      expect(flowLogsModuleMain).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"flow_logs"/);
    });

    test('should create flow logs', () => {
      expect(flowLogsModuleMain).toMatch(/resource\s+"aws_flow_log"\s+"this"/);
    });

    test('should set log destination type to s3', () => {
      expect(flowLogsModuleMain).toMatch(/log_destination_type\s*=\s*"s3"/);
    });

    test('should capture ALL traffic types', () => {
      expect(flowLogsModuleMain).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test('should set max aggregation interval to 600 seconds', () => {
      expect(flowLogsModuleMain).toMatch(/max_aggregation_interval\s*=\s*600/);
    });
  });

  describe('Tagging Strategy', () => {
    test('should apply common tags to all resources', () => {
      expect(localsCode).toMatch(/common_tags.*ManagedBy.*Terraform/s);
    });

    test('should include Environment tag', () => {
      expect(localsCode).toMatch(/Environment/);
    });

    test('should include Project tag', () => {
      expect(localsCode).toMatch(/Project/);
    });

    test('should include CostCenter tag', () => {
      expect(localsCode).toMatch(/CostCenter/);
    });

    test('should merge environment-specific tags', () => {
      expect(localsCode).toMatch(/merge.*common_tags/);
    });
  });

  describe('Resource Naming Convention', () => {
    test('should use consistent naming pattern with environment suffix', () => {
      const namingPatterns = [
        vpcHubCode,
        vpcSpokesCode,
        transitGatewayCode,
        natGatewaysCode,
        route53ResolverCode,
        dhcpOptionsCode
      ];

      namingPatterns.forEach(code => {
        expect(code).toMatch(/name_suffix/);
      });
    });

    test('should include region in resource names', () => {
      expect(vpcHubCode).toMatch(/region/);
    });

    test('should include environment in resource names', () => {
      expect(vpcHubCode).toMatch(/environment/);
    });
  });

  describe('Module Dependencies', () => {
    test('should define depends_on for Transit Gateway module', () => {
      expect(transitGatewayCode).toMatch(/depends_on\s*=\s*\[[\s\S]*?module\.vpc_hub/);
    });

    test('should define depends_on for routes to Transit Gateway', () => {
      expect(transitGatewayCode).toMatch(/depends_on\s*=\s*\[[\s\S]*?module\.transit_gateway/);
    });

    test('should define depends_on for NAT Gateway routes', () => {
      expect(natGatewaysCode).toMatch(/depends_on.*aws_nat_gateway/);
    });

    test('should define depends_on for flow logs bucket policy', () => {
      expect(flowLogsModuleMain).toMatch(/depends_on.*aws_s3_bucket_policy/);
    });
  });

  describe('Module Outputs', () => {
    test('should output VPC ID from vpc module', () => {
      expect(vpcModuleOutputs).toMatch(/output\s+"vpc_id"/);
    });

    test('should output VPC CIDR from vpc module', () => {
      expect(vpcModuleOutputs).toMatch(/output\s+"vpc_cidr"/);
    });

    test('should output subnet IDs from vpc module', () => {
      expect(vpcModuleOutputs).toMatch(/output\s+"public_subnet_ids"/);
      expect(vpcModuleOutputs).toMatch(/output\s+"private_subnet_ids"/);
      expect(vpcModuleOutputs).toMatch(/output\s+"tgw_attachment_subnet_ids"/);
    });

    test('should output route table IDs from vpc module', () => {
      expect(vpcModuleOutputs).toMatch(/output\s+"public_route_table_id"/);
      expect(vpcModuleOutputs).toMatch(/output\s+"private_route_table_ids"/);
    });

    test('should output Transit Gateway ID from transit-gateway module', () => {
      expect(tgwModuleOutputs).toMatch(/output\s+"transit_gateway_id"/);
    });

    test('should output route table IDs from transit-gateway module', () => {
      expect(tgwModuleOutputs).toMatch(/output\s+"hub_route_table_id"/);
      expect(tgwModuleOutputs).toMatch(/output\s+"spoke_route_table_id"/);
    });

    test('should output VPC attachment IDs from transit-gateway module', () => {
      expect(tgwModuleOutputs).toMatch(/output\s+"vpc_attachment_ids"/);
    });

    test('should output endpoint IDs from vpc-endpoints module', () => {
      expect(vpcEndpointsModuleOutputs).toMatch(/output\s+"ssm_endpoint_id"/);
      expect(vpcEndpointsModuleOutputs).toMatch(/output\s+"ssm_messages_endpoint_id"/);
      expect(vpcEndpointsModuleOutputs).toMatch(/output\s+"ec2_messages_endpoint_id"/);
    });

    test('should output endpoint DNS names from vpc-endpoints module', () => {
      expect(vpcEndpointsModuleOutputs).toMatch(/output\s+"ssm_endpoint_dns"/);
    });

    test('should output S3 bucket ID from flow-logs module', () => {
      expect(flowLogsModuleOutputs).toMatch(/output\s+"s3_bucket_id"/);
    });

    test('should output flow log IDs from flow-logs module', () => {
      expect(flowLogsModuleOutputs).toMatch(/output\s+"flow_log_ids"/);
    });
  });
});

