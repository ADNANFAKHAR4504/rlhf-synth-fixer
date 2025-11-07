// Comprehensive Unit Tests for Hub-and-Spoke Network Infrastructure
// Tests validate Terraform configuration structure without executing terraform commands

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

// Helper function to read file content
function readFile(filename: string): string {
  const filePath = path.join(LIB_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

// Helper function to check if file exists
function fileExists(filename: string): boolean {
  return fs.existsSync(path.join(LIB_DIR, filename));
}

describe('Terraform Configuration Files', () => {
  const requiredFiles = [
    'provider.tf',
    'variables.tf',
    'main.tf',
    'vpc-spokes.tf',
    'transit-gateway.tf',
    'flow-logs.tf',
    'route53.tf',
    'endpoints.tf',
    'outputs.tf',
    'terraform.tfvars',
  ];

  test.each(requiredFiles)('%s exists', (filename) => {
    expect(fileExists(filename)).toBe(true);
  });
});

describe('Provider Configuration', () => {
  let providerContent: string;

  beforeAll(() => {
    providerContent = readFile('provider.tf');
  });

  test('contains terraform block with required version', () => {
    expect(providerContent).toMatch(/terraform\s*{/);
    expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
  });

  test('contains AWS provider configuration', () => {
    expect(providerContent).toMatch(/required_providers\s*{[\s\S]*aws[\s\S]*}/);
    expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
  });

  test('contains S3 backend configuration', () => {
    expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
  });

  test('contains primary AWS provider', () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?region\s*=\s*var\.aws_region/);
  });

  test('contains aliased providers for multi-region', () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"hub"/);
    expect(providerContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"us_west"/);
    expect(providerContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"eu_west"/);
  });

  test('aliased providers reference correct variables', () => {
    expect(providerContent).toMatch(/alias\s*=\s*"hub"[\s\S]*?region\s*=\s*var\.hub_region/);
    expect(providerContent).toMatch(/alias\s*=\s*"us_west"[\s\S]*?region\s*=\s*var\.spoke_regions\["ap-northeast-1"\]/);
    expect(providerContent).toMatch(/alias\s*=\s*"eu_west"[\s\S]*?region\s*=\s*var\.spoke_regions\["ap-southeast-2"\]/);
  });
});

describe('Variables Configuration', () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = readFile('variables.tf');
  });

  test('contains aws_region variable', () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*string/);
  });

  test('contains enable_route53 variable with default false', () => {
    expect(variablesContent).toMatch(/variable\s+"enable_route53"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*bool/);
    expect(variablesContent).toMatch(/default\s*=\s*false/);
  });

  test('contains hub_region variable', () => {
    expect(variablesContent).toMatch(/variable\s+"hub_region"\s*{/);
  });

  test('contains spoke_regions variable', () => {
    expect(variablesContent).toMatch(/variable\s+"spoke_regions"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*map\(string\)/);
  });

  test('contains hub_vpc_cidr variable with validation', () => {
    expect(variablesContent).toMatch(/variable\s+"hub_vpc_cidr"\s*{/);
    expect(variablesContent).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
    expect(variablesContent).toMatch(/validation\s*{/);
  });

  test('contains spoke_vpc_cidrs variable with validation', () => {
    expect(variablesContent).toMatch(/variable\s+"spoke_vpc_cidrs"\s*{/);
    expect(variablesContent).toMatch(/type\s*=\s*map\(string\)/);
    expect(variablesContent).toMatch(/"ap-northeast-1"\s*=\s*"10\.1\.0\.0\/16"/);
    expect(variablesContent).toMatch(/"ap-southeast-2"\s*=\s*"10\.2\.0\.0\/16"/);
    expect(variablesContent).toMatch(/validation\s*{/);
  });

  test('contains common_tags variable', () => {
    expect(variablesContent).toMatch(/variable\s+"common_tags"\s*{/);
    expect(variablesContent).toMatch(/Environment/);
    expect(variablesContent).toMatch(/CostCenter/);
    expect(variablesContent).toMatch(/Owner/);
  });
});

describe('Main Configuration - No Provider Blocks', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFile('main.tf');
  });

  test('does NOT contain terraform block (should be in provider.tf)', () => {
    expect(mainContent).not.toMatch(/^terraform\s*{/m);
  });

  test('does NOT contain provider blocks (should be in provider.tf)', () => {
    expect(mainContent).not.toMatch(/^provider\s+"aws"\s*{/m);
  });
});

describe('VPC Configuration', () => {
  let mainContent: string;
  let spokesContent: string;

  beforeAll(() => {
    mainContent = readFile('main.tf');
    spokesContent = readFile('vpc-spokes.tf');
  });

  test('hub VPC module configured correctly', () => {
    expect(mainContent).toMatch(/module\s+"hub_vpc"\s*{/);
    expect(mainContent).toMatch(/source\s*=\s*"\.\/modules\/vpc"/);
    expect(mainContent).toMatch(/vpc_cidr\s*=\s*var\.hub_vpc_cidr/);
    expect(mainContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(mainContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test('spoke VPCs configured correctly', () => {
    expect(spokesContent).toMatch(/module\s+"us_west_spoke_vpc"\s*{/);
    expect(spokesContent).toMatch(/module\s+"eu_west_spoke_vpc"\s*{/);
    expect(spokesContent).toMatch(/source\s*=\s*"\.\/modules\/vpc"/);
  });

  test('data sources for availability zones', () => {
    expect(mainContent).toMatch(/data\s+"aws_availability_zones"\s+"hub"\s*{/);
    expect(spokesContent).toMatch(/data\s+"aws_availability_zones"\s+"us_west"\s*{/);
    expect(spokesContent).toMatch(/data\s+"aws_availability_zones"\s+"eu_west"\s*{/);
  });
});

describe('S3 Bucket Security', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readFile('main.tf');
  });

  test('S3 bucket for flow logs exists', () => {
    expect(mainContent).toMatch(/resource\s+"aws_s3_bucket"\s+"flow_logs"\s*{/);
  });

  test('S3 bucket has encryption enabled', () => {
    expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"flow_logs"\s*{/);
    expect(mainContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
  });

  test('S3 bucket has versioning enabled', () => {
    expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"flow_logs"\s*{/);
    expect(mainContent).toMatch(/status\s*=\s*"Enabled"/);
  });

  test('S3 bucket has public access blocked', () => {
    expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"flow_logs"\s*{/);
    expect(mainContent).toMatch(/block_public_acls\s*=\s*true/);
    expect(mainContent).toMatch(/block_public_policy\s*=\s*true/);
    expect(mainContent).toMatch(/ignore_public_acls\s*=\s*true/);
    expect(mainContent).toMatch(/restrict_public_buckets\s*=\s*true/);
  });

  test('S3 bucket has lifecycle configuration', () => {
    expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"flow_logs"\s*{/);
  });
});

describe('VPC Flow Logs', () => {
  let flowLogsContent: string;

  beforeAll(() => {
    flowLogsContent = readFile('flow-logs.tf');
  });

  test('flow logs configured for all VPCs', () => {
    expect(flowLogsContent).toMatch(/resource\s+"aws_flow_log"\s+"hub"\s*{/);
    expect(flowLogsContent).toMatch(/resource\s+"aws_flow_log"\s+"us_west_spoke"\s*{/);
    expect(flowLogsContent).toMatch(/resource\s+"aws_flow_log"\s+"eu_west_spoke"\s*{/);
  });

  test('flow logs use Parquet format', () => {
    const matches = flowLogsContent.match(/file_format\s*=\s*"parquet"/g);
    expect(matches).toHaveLength(3); // One for each VPC
  });

  test('flow logs use correct aggregation interval', () => {
    expect(flowLogsContent).toMatch(/max_aggregation_interval\s*=\s*60/);
  });

  test('flow logs destination is S3', () => {
    const matches = flowLogsContent.match(/log_destination_type\s*=\s*"s3"/g);
    expect(matches).toHaveLength(3);
  });

  test('IAM role for flow logs uses least privilege', () => {
    expect(flowLogsContent).toMatch(/resource\s+"aws_iam_role"\s+"flow_logs"\s*{/);
    expect(flowLogsContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"flow_logs"\s*{/);
    // Check that policy doesn't use wildcards inappropriately
    expect(flowLogsContent).toMatch(/"s3:PutObject"/);
    expect(flowLogsContent).not.toMatch(/"Action":\s*"\*"/);
  });
});

describe('Transit Gateway Configuration', () => {
  let tgwContent: string;

  beforeAll(() => {
    tgwContent = readFile('transit-gateway.tf');
  });

  test('hub transit gateway configured', () => {
    expect(tgwContent).toMatch(/resource\s+"aws_ec2_transit_gateway"\s+"hub"\s*{/);
  });

  test('transit gateway has DNS support enabled', () => {
    const matches = tgwContent.match(/dns_support\s*=\s*"enable"/g);
    expect(matches!.length).toBeGreaterThanOrEqual(3); // Hub and spoke TGWs
  });

  test('transit gateway has default route table disabled', () => {
    expect(tgwContent).toMatch(/default_route_table_association\s*=\s*"disable"/);
    expect(tgwContent).toMatch(/default_route_table_propagation\s*=\s*"disable"/);
  });

  test('cross-region peering attachments configured', () => {
    expect(tgwContent).toMatch(/resource\s+"aws_ec2_transit_gateway_peering_attachment"\s+"us_west"\s*{/);
    expect(tgwContent).toMatch(/resource\s+"aws_ec2_transit_gateway_peering_attachment"\s+"eu_west"\s*{/);
  });

  test('peering attachment accepters configured', () => {
    expect(tgwContent).toMatch(/resource\s+"aws_ec2_transit_gateway_peering_attachment_accepter"\s+"us_west"\s*{/);
    expect(tgwContent).toMatch(/resource\s+"aws_ec2_transit_gateway_peering_attachment_accepter"\s+"eu_west"\s*{/);
  });

  test('separate route tables for hub and spokes', () => {
    expect(tgwContent).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table"\s+"hub"\s*{/);
    expect(tgwContent).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table"\s+"us_west_spoke"\s*{/);
    expect(tgwContent).toMatch(/resource\s+"aws_ec2_transit_gateway_route_table"\s+"eu_west_spoke"\s*{/);
  });

  test('blackhole routes for unused RFC1918 ranges', () => {
    expect(tgwContent).toMatch(/rfc1918_ranges\s*=\s*\[/);
    expect(tgwContent).toMatch(/"172\.16\.0\.0\/12"/);
    expect(tgwContent).toMatch(/"192\.168\.0\.0\/16"/);
    expect(tgwContent).toMatch(/blackhole\s*=\s*true/);
  });

  test('spoke-to-spoke routes go through hub', () => {
    // US-West to EU-West through hub
    expect(tgwContent).toMatch(/resource\s+"aws_ec2_transit_gateway_route"\s+"us_west_to_eu_west"\s*{/);
    // EU-West to US-West through hub
    expect(tgwContent).toMatch(/resource\s+"aws_ec2_transit_gateway_route"\s+"eu_west_to_us_west"\s*{/);
  });
});

describe('Route53 Configuration', () => {
  let route53Content: string;

  beforeAll(() => {
    route53Content = readFile('route53.tf');
  });

  test('Route53 resources are conditional', () => {
    const countMatches = route53Content.match(/count\s*=\s*var\.enable_route53\s*\?\s*1\s*:\s*0/g);
    expect(countMatches!.length).toBeGreaterThanOrEqual(3); // Zone, associations, and records
  });

  test('private hosted zone configured', () => {
    expect(route53Content).toMatch(/resource\s+"aws_route53_zone"\s+"private"\s*{/);
  });

  test('zone associations for spoke VPCs', () => {
    expect(route53Content).toMatch(/resource\s+"aws_route53_zone_association"\s+"us_west_spoke"\s*{/);
    expect(route53Content).toMatch(/resource\s+"aws_route53_zone_association"\s+"eu_west_spoke"\s*{/);
  });
});

describe('Systems Manager Endpoints', () => {
  let endpointsContent: string;

  beforeAll(() => {
    endpointsContent = readFile('endpoints.tf');
  });

  test('SSM endpoints defined for all VPCs', () => {
    expect(endpointsContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssm_hub"\s*{/);
    expect(endpointsContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssm_us_west"\s*{/);
    expect(endpointsContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ssm_eu_west"\s*{/);
  });

  test('SSM endpoints include required services', () => {
    expect(endpointsContent).toMatch(/ssm_endpoints\s*=\s*\["ssm",\s*"ssmmessages",\s*"ec2messages"\]/);
  });

  test('security groups configured for endpoints', () => {
    expect(endpointsContent).toMatch(/module\s+"endpoints_sg_hub"\s*{/);
    expect(endpointsContent).toMatch(/module\s+"endpoints_sg_us_west"\s*{/);
    expect(endpointsContent).toMatch(/module\s+"endpoints_sg_eu_west"\s*{/);
    expect(endpointsContent).toMatch(/source\s*=\s*"\.\/modules\/sg"/);
  });

  test('endpoints use private DNS', () => {
    const matches = endpointsContent.match(/private_dns_enabled\s*=\s*true/g);
    expect(matches!.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Outputs Configuration', () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = readFile('outputs.tf');
  });

  test('VPC outputs defined', () => {
    expect(outputsContent).toMatch(/output\s+"hub_vpc_id"\s*{/);
    expect(outputsContent).toMatch(/output\s+"us_west_spoke_vpc_id"\s*{/);
    expect(outputsContent).toMatch(/output\s+"eu_west_spoke_vpc_id"\s*{/);
  });

  test('Transit Gateway outputs defined', () => {
    expect(outputsContent).toMatch(/output\s+"hub_transit_gateway_id"\s*{/);
    expect(outputsContent).toMatch(/output\s+"transit_gateway_route_table_ids"\s*{/);
  });

  test('Route53 outputs are conditional', () => {
    expect(outputsContent).toMatch(/output\s+"private_hosted_zone_id"\s*{/);
    expect(outputsContent).toMatch(/var\.enable_route53\s*\?/);
  });

  test('Flow Logs outputs defined', () => {
    expect(outputsContent).toMatch(/output\s+"flow_logs_s3_bucket"\s*{/);
  });

  test('SSM endpoint outputs defined', () => {
    expect(outputsContent).toMatch(/output\s+"ssm_endpoint_ids"\s*{/);
  });
});

describe('Tagging Standards', () => {
  let mainContent: string;
  let spokesContent: string;
  let tgwContent: string;

  beforeAll(() => {
    mainContent = readFile('main.tf');
    spokesContent = readFile('vpc-spokes.tf');
    tgwContent = readFile('transit-gateway.tf');
  });

  test('resources use common_tags', () => {
    expect(mainContent).toMatch(/var\.common_tags/);
    expect(spokesContent).toMatch(/var\.common_tags/);
    expect(tgwContent).toMatch(/var\.common_tags/);
  });

  test('required tag keys are present in defaults', () => {
    const variablesContent = readFile('variables.tf');
    expect(variablesContent).toMatch(/Environment/);
    expect(variablesContent).toMatch(/CostCenter/);
    expect(variablesContent).toMatch(/Owner/);
  });
});

describe('Module Structure', () => {
  test('VPC module exists', () => {
    const modulePath = path.join(LIB_DIR, 'modules', 'vpc', 'main.tf');
    expect(fs.existsSync(modulePath)).toBe(true);
  });

  test('Security Group module exists', () => {
    const modulePath = path.join(LIB_DIR, 'modules', 'sg', 'main.tf');
    expect(fs.existsSync(modulePath)).toBe(true);
  });
});

describe('Terraform Variables File', () => {
  let tfvarsContent: string;

  beforeAll(() => {
    tfvarsContent = readFile('terraform.tfvars');
  });

  test('contains aws_region value', () => {
    expect(tfvarsContent).toMatch(/aws_region\s*=\s*"eu-west-3"/);
  });

  test('contains enable_route53 set to false', () => {
    expect(tfvarsContent).toMatch(/enable_route53\s*=\s*false/);
  });

  test('contains hub and spoke region values', () => {
    expect(tfvarsContent).toMatch(/hub_region\s*=\s*"eu-west-3"/);
    expect(tfvarsContent).toMatch(/"ap-northeast-1"\s*=\s*"ap-northeast-1"/);
    expect(tfvarsContent).toMatch(/"ap-southeast-2"\s*=\s*"ap-southeast-2"/);
  });

  test('contains CIDR values', () => {
    expect(tfvarsContent).toMatch(/hub_vpc_cidr\s*=\s*"10\.0\.0\.0\/16"/);
    expect(tfvarsContent).toMatch(/"ap-northeast-1"\s*=\s*"10\.1\.0\.0\/16"/);
    expect(tfvarsContent).toMatch(/"ap-southeast-2"\s*=\s*"10\.2\.0\.0\/16"/);
  });
});
