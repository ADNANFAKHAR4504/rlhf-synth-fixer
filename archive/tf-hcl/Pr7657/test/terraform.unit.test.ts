// Unit tests for Terraform multi-tier VPC infrastructure
// Tests all infrastructure components for proper configuration

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

// Helper to read terraform files
const readTerraformFile = (filename: string): string => {
  const filePath = path.join(LIB_DIR, filename);
  return fs.readFileSync(filePath, 'utf8');
};

// Helper to check if resource exists in terraform files
const resourceExists = (content: string, resourceType: string, resourceName: string): boolean => {
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"\\s*{`, 'g');
  return regex.test(content);
};

// Helper to count resource occurrences
const countResourceOccurrences = (content: string, resourceType: string): number => {
  const regex = new RegExp(`resource\\s+"${resourceType}"`, 'g');
  const matches = content.match(regex);
  return matches ? matches.length : 0;
};

describe('Terraform Infrastructure - File Structure', () => {
  test('main.tf exists', () => {
    expect(fs.existsSync(path.join(LIB_DIR, 'main.tf'))).toBe(true);
  });

  test('variables.tf exists', () => {
    expect(fs.existsSync(path.join(LIB_DIR, 'variables.tf'))).toBe(true);
  });

  test('outputs.tf exists', () => {
    expect(fs.existsSync(path.join(LIB_DIR, 'outputs.tf'))).toBe(true);
  });

  test('provider.tf exists', () => {
    expect(fs.existsSync(path.join(LIB_DIR, 'provider.tf'))).toBe(true);
  });
});

describe('Terraform Infrastructure - Provider Configuration', () => {
  let providerContent: string;

  beforeAll(() => {
    providerContent = readTerraformFile('provider.tf');
  });

  test('AWS provider is configured', () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
  });

  test('AWS provider region is configured from variable', () => {
    expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
  });

  test('Default tags are configured', () => {
    expect(providerContent).toMatch(/default_tags\s*{/);
  });

  test('Default tags include Environment', () => {
    expect(providerContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
  });

  test('Terraform version is specified', () => {
    expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+\.\d+"/);
  });

  test('AWS provider version is specified', () => {
    expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
  });
});

describe('Terraform Infrastructure - Variables', () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = readTerraformFile('variables.tf');
  });

  test('aws_region variable is defined', () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test('environment_suffix variable is defined', () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
  });

  test('vpc_cidr variable is defined', () => {
    expect(variablesContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
  });

  test('vpc_cidr default is 10.0.0.0/16', () => {
    expect(variablesContent).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
  });

  test('public_subnet_cidrs variable is defined', () => {
    expect(variablesContent).toMatch(/variable\s+"public_subnet_cidrs"\s*{/);
  });

  test('private_subnet_cidrs variable is defined', () => {
    expect(variablesContent).toMatch(/variable\s+"private_subnet_cidrs"\s*{/);
  });

  test('database_subnet_cidrs variable is defined', () => {
    expect(variablesContent).toMatch(/variable\s+"database_subnet_cidrs"\s*{/);
  });
});

describe('Terraform Infrastructure - VPC Resources', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readTerraformFile('main.tf');
  });

  test('VPC resource is defined', () => {
    expect(resourceExists(mainContent, 'aws_vpc', 'main')).toBe(true);
  });

  test('VPC uses variable for CIDR block', () => {
    expect(mainContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
  });

  test('VPC enables DNS hostnames', () => {
    expect(mainContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
  });

  test('VPC enables DNS support', () => {
    expect(mainContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test('VPC is tagged with environment_suffix', () => {
    const vpcSection = mainContent.match(/resource\s+"aws_vpc"\s+"main"\s*{[\s\S]*?^}/m);
    expect(vpcSection).toBeTruthy();
    if (vpcSection) {
      expect(vpcSection[0]).toMatch(/environment_suffix/);
    }
  });
});

describe('Terraform Infrastructure - Internet Gateway', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readTerraformFile('main.tf');
  });

  test('Internet Gateway resource is defined', () => {
    expect(resourceExists(mainContent, 'aws_internet_gateway', 'main')).toBe(true);
  });

  test('Internet Gateway is attached to VPC', () => {
    const igwSection = mainContent.match(/resource\s+"aws_internet_gateway"\s+"main"\s*{[\s\S]*?^}/m);
    expect(igwSection).toBeTruthy();
    if (igwSection) {
      expect(igwSection[0]).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    }
  });
});

describe('Terraform Infrastructure - Subnets', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readTerraformFile('main.tf');
  });

  test('Public subnets are defined with count=3', () => {
    const publicSubnet = mainContent.match(/resource\s+"aws_subnet"\s+"public"\s*{[\s\S]*?^}/m);
    expect(publicSubnet).toBeTruthy();
    if (publicSubnet) {
      expect(publicSubnet[0]).toMatch(/count\s*=\s*3/);
    }
  });

  test('Private subnets are defined with count=3', () => {
    const privateSubnet = mainContent.match(/resource\s+"aws_subnet"\s+"private"\s*{[\s\S]*?^}/m);
    expect(privateSubnet).toBeTruthy();
    if (privateSubnet) {
      expect(privateSubnet[0]).toMatch(/count\s*=\s*3/);
    }
  });

  test('Database subnets are defined with count=3', () => {
    const databaseSubnet = mainContent.match(/resource\s+"aws_subnet"\s+"database"\s*{[\s\S]*?^}/m);
    expect(databaseSubnet).toBeTruthy();
    if (databaseSubnet) {
      expect(databaseSubnet[0]).toMatch(/count\s*=\s*3/);
    }
  });

  test('Public subnets have map_public_ip_on_launch enabled', () => {
    const publicSubnet = mainContent.match(/resource\s+"aws_subnet"\s+"public"\s*{[\s\S]*?^}/m);
    expect(publicSubnet).toBeTruthy();
    if (publicSubnet) {
      expect(publicSubnet[0]).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    }
  });

  test('Public subnets use correct CIDR blocks', () => {
    const publicSubnet = mainContent.match(/resource\s+"aws_subnet"\s+"public"\s*{[\s\S]*?^}/m);
    expect(publicSubnet).toBeTruthy();
    if (publicSubnet) {
      expect(publicSubnet[0]).toMatch(/cidr_block\s*=\s*var\.public_subnet_cidrs\[count\.index\]/);
    }
  });

  test('Private subnets use correct CIDR blocks', () => {
    const privateSubnet = mainContent.match(/resource\s+"aws_subnet"\s+"private"\s*{[\s\S]*?^}/m);
    expect(privateSubnet).toBeTruthy();
    if (privateSubnet) {
      expect(privateSubnet[0]).toMatch(/cidr_block\s*=\s*var\.private_subnet_cidrs\[count\.index\]/);
    }
  });

  test('Database subnets use correct CIDR blocks', () => {
    const databaseSubnet = mainContent.match(/resource\s+"aws_subnet"\s+"database"\s*{[\s\S]*?^}/m);
    expect(databaseSubnet).toBeTruthy();
    if (databaseSubnet) {
      expect(databaseSubnet[0]).toMatch(/cidr_block\s*=\s*var\.database_subnet_cidrs\[count\.index\]/);
    }
  });

  test('Subnets are distributed across availability zones', () => {
    expect(mainContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
  });
});

describe('Terraform Infrastructure - NAT Gateways', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readTerraformFile('main.tf');
  });

  test('Elastic IPs are defined for NAT Gateways', () => {
    expect(resourceExists(mainContent, 'aws_eip', 'nat')).toBe(true);
  });

  test('Two Elastic IPs are created', () => {
    const eipSection = mainContent.match(/resource\s+"aws_eip"\s+"nat"\s*{[\s\S]*?^}/m);
    expect(eipSection).toBeTruthy();
    if (eipSection) {
      expect(eipSection[0]).toMatch(/count\s*=\s*2/);
    }
  });

  test('Elastic IPs are in VPC domain', () => {
    const eipSection = mainContent.match(/resource\s+"aws_eip"\s+"nat"\s*{[\s\S]*?^}/m);
    expect(eipSection).toBeTruthy();
    if (eipSection) {
      expect(eipSection[0]).toMatch(/domain\s*=\s*"vpc"/);
    }
  });

  test('NAT Gateways are defined', () => {
    expect(resourceExists(mainContent, 'aws_nat_gateway', 'main')).toBe(true);
  });

  test('Two NAT Gateways are created', () => {
    const natSection = mainContent.match(/resource\s+"aws_nat_gateway"\s+"main"\s*{[\s\S]*?^}/m);
    expect(natSection).toBeTruthy();
    if (natSection) {
      expect(natSection[0]).toMatch(/count\s*=\s*2/);
    }
  });

  test('NAT Gateways are placed in public subnets', () => {
    const natSection = mainContent.match(/resource\s+"aws_nat_gateway"\s+"main"\s*{[\s\S]*?^}/m);
    expect(natSection).toBeTruthy();
    if (natSection) {
      expect(natSection[0]).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
    }
  });

  test('NAT Gateways use Elastic IPs', () => {
    const natSection = mainContent.match(/resource\s+"aws_nat_gateway"\s+"main"\s*{[\s\S]*?^}/m);
    expect(natSection).toBeTruthy();
    if (natSection) {
      expect(natSection[0]).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
    }
  });

  test('NAT Gateways depend on Internet Gateway', () => {
    const natSection = mainContent.match(/resource\s+"aws_nat_gateway"\s+"main"\s*{[\s\S]*?^}/m);
    expect(natSection).toBeTruthy();
    if (natSection) {
      expect(natSection[0]).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    }
  });
});

describe('Terraform Infrastructure - Route Tables', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readTerraformFile('main.tf');
  });

  test('Public route table is defined', () => {
    expect(resourceExists(mainContent, 'aws_route_table', 'public')).toBe(true);
  });

  test('Public route table has route to Internet Gateway', () => {
    const publicRtSection = mainContent.match(/resource\s+"aws_route_table"\s+"public"\s*{[\s\S]*?^}/m);
    expect(publicRtSection).toBeTruthy();
    if (publicRtSection) {
      expect(publicRtSection[0]).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
      expect(publicRtSection[0]).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
    }
  });

  test('Private route tables are defined with count=3', () => {
    const privateRtSection = mainContent.match(/resource\s+"aws_route_table"\s+"private"\s*{[\s\S]*?^}/m);
    expect(privateRtSection).toBeTruthy();
    if (privateRtSection) {
      expect(privateRtSection[0]).toMatch(/count\s*=\s*3/);
    }
  });

  test('Private route tables have routes to NAT Gateways', () => {
    const privateRtSection = mainContent.match(/resource\s+"aws_route_table"\s+"private"\s*{[\s\S]*?^}/m);
    expect(privateRtSection).toBeTruthy();
    if (privateRtSection) {
      expect(privateRtSection[0]).toMatch(/nat_gateway_id/);
    }
  });

  test('Database route table is defined', () => {
    expect(resourceExists(mainContent, 'aws_route_table', 'database')).toBe(true);
  });

  test('Database route table has no internet route', () => {
    const databaseRtSection = mainContent.match(/resource\s+"aws_route_table"\s+"database"\s*{[\s\S]*?^}/m);
    expect(databaseRtSection).toBeTruthy();
    if (databaseRtSection) {
      // Database route table should not have any route blocks (no internet access)
      expect(databaseRtSection[0]).not.toMatch(/route\s*{/);
    }
  });

  test('Public route table associations exist', () => {
    expect(resourceExists(mainContent, 'aws_route_table_association', 'public')).toBe(true);
  });

  test('Private route table associations exist', () => {
    expect(resourceExists(mainContent, 'aws_route_table_association', 'private')).toBe(true);
  });

  test('Database route table associations exist', () => {
    expect(resourceExists(mainContent, 'aws_route_table_association', 'database')).toBe(true);
  });
});

describe('Terraform Infrastructure - Security Groups', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readTerraformFile('main.tf');
  });

  test('Web security group is defined', () => {
    expect(resourceExists(mainContent, 'aws_security_group', 'web')).toBe(true);
  });

  test('App security group is defined', () => {
    expect(resourceExists(mainContent, 'aws_security_group', 'app')).toBe(true);
  });

  test('Database security group is defined', () => {
    expect(resourceExists(mainContent, 'aws_security_group', 'database')).toBe(true);
  });

  test('Web security group allows HTTP (port 80)', () => {
    const webSgSection = mainContent.match(/resource\s+"aws_security_group"\s+"web"\s*{[\s\S]*?^}/m);
    expect(webSgSection).toBeTruthy();
    if (webSgSection) {
      expect(webSgSection[0]).toMatch(/from_port\s*=\s*80/);
      expect(webSgSection[0]).toMatch(/to_port\s*=\s*80/);
    }
  });

  test('Web security group allows HTTPS (port 443)', () => {
    const webSgSection = mainContent.match(/resource\s+"aws_security_group"\s+"web"\s*{[\s\S]*?^}/m);
    expect(webSgSection).toBeTruthy();
    if (webSgSection) {
      expect(webSgSection[0]).toMatch(/from_port\s*=\s*443/);
      expect(webSgSection[0]).toMatch(/to_port\s*=\s*443/);
    }
  });

  test('App security group allows port 8080', () => {
    const appSgSection = mainContent.match(/resource\s+"aws_security_group"\s+"app"\s*{[\s\S]*?^}/m);
    expect(appSgSection).toBeTruthy();
    if (appSgSection) {
      expect(appSgSection[0]).toMatch(/from_port\s*=\s*8080/);
      expect(appSgSection[0]).toMatch(/to_port\s*=\s*8080/);
    }
  });

  test('Database security group allows port 5432', () => {
    const dbSgSection = mainContent.match(/resource\s+"aws_security_group"\s+"database"\s*{[\s\S]*?^}/m);
    expect(dbSgSection).toBeTruthy();
    if (dbSgSection) {
      expect(dbSgSection[0]).toMatch(/from_port\s*=\s*5432/);
      expect(dbSgSection[0]).toMatch(/to_port\s*=\s*5432/);
    }
  });

  test('Security groups have egress rules', () => {
    expect(mainContent).toMatch(/egress\s*{/);
  });

  test('Security groups have create_before_destroy lifecycle', () => {
    const webSgSection = mainContent.match(/resource\s+"aws_security_group"\s+"web"\s*{[\s\S]*?^}/m);
    expect(webSgSection).toBeTruthy();
    if (webSgSection) {
      expect(webSgSection[0]).toMatch(/create_before_destroy\s*=\s*true/);
    }
  });
});

describe('Terraform Infrastructure - Network ACLs', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readTerraformFile('main.tf');
  });

  test('Public Network ACL is defined', () => {
    expect(resourceExists(mainContent, 'aws_network_acl', 'public')).toBe(true);
  });

  test('Private Network ACL is defined', () => {
    expect(resourceExists(mainContent, 'aws_network_acl', 'private')).toBe(true);
  });

  test('Database Network ACL is defined', () => {
    expect(resourceExists(mainContent, 'aws_network_acl', 'database')).toBe(true);
  });

  test('Public Network ACL allows HTTP traffic', () => {
    const publicNaclSection = mainContent.match(/resource\s+"aws_network_acl"\s+"public"\s*{[\s\S]*?^}/m);
    expect(publicNaclSection).toBeTruthy();
    if (publicNaclSection) {
      expect(publicNaclSection[0]).toMatch(/from_port\s*=\s*80/);
    }
  });

  test('Public Network ACL allows HTTPS traffic', () => {
    const publicNaclSection = mainContent.match(/resource\s+"aws_network_acl"\s+"public"\s*{[\s\S]*?^}/m);
    expect(publicNaclSection).toBeTruthy();
    if (publicNaclSection) {
      expect(publicNaclSection[0]).toMatch(/from_port\s*=\s*443/);
    }
  });

  test('Private Network ACL allows port 8080', () => {
    const privateNaclSection = mainContent.match(/resource\s+"aws_network_acl"\s+"private"\s*{[\s\S]*?^}/m);
    expect(privateNaclSection).toBeTruthy();
    if (privateNaclSection) {
      expect(privateNaclSection[0]).toMatch(/from_port\s*=\s*8080/);
    }
  });

  test('Database Network ACL allows port 5432', () => {
    const databaseNaclSection = mainContent.match(/resource\s+"aws_network_acl"\s+"database"\s*{[\s\S]*?^}/m);
    expect(databaseNaclSection).toBeTruthy();
    if (databaseNaclSection) {
      expect(databaseNaclSection[0]).toMatch(/from_port\s*=\s*5432/);
    }
  });

  test('Network ACLs have both ingress and egress rules', () => {
    expect(mainContent).toMatch(/ingress\s*{/);
    expect(mainContent).toMatch(/egress\s*{/);
  });
});

describe('Terraform Infrastructure - VPC Flow Logs', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readTerraformFile('main.tf');
  });

  test('CloudWatch Log Group for VPC Flow Logs is defined', () => {
    expect(resourceExists(mainContent, 'aws_cloudwatch_log_group', 'vpc_flow_logs')).toBe(true);
  });

  test('CloudWatch Log Group has retention period', () => {
    const logGroupSection = mainContent.match(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"\s*{[\s\S]*?^}/m);
    expect(logGroupSection).toBeTruthy();
    if (logGroupSection) {
      expect(logGroupSection[0]).toMatch(/retention_in_days\s*=\s*\d+/);
    }
  });

  test('IAM Role for VPC Flow Logs is defined', () => {
    expect(resourceExists(mainContent, 'aws_iam_role', 'vpc_flow_logs')).toBe(true);
  });

  test('IAM Role has assume role policy for VPC Flow Logs service', () => {
    const iamRoleSection = mainContent.match(/resource\s+"aws_iam_role"\s+"vpc_flow_logs"\s*{[\s\S]*?^}/m);
    expect(iamRoleSection).toBeTruthy();
    if (iamRoleSection) {
      expect(iamRoleSection[0]).toMatch(/vpc-flow-logs\.amazonaws\.com/);
    }
  });

  test('IAM Role Policy for VPC Flow Logs is defined', () => {
    expect(resourceExists(mainContent, 'aws_iam_role_policy', 'vpc_flow_logs')).toBe(true);
  });

  test('IAM Role Policy allows CloudWatch Logs actions', () => {
    const iamPolicySection = mainContent.match(/resource\s+"aws_iam_role_policy"\s+"vpc_flow_logs"\s*{[\s\S]*?^}/m);
    expect(iamPolicySection).toBeTruthy();
    if (iamPolicySection) {
      expect(iamPolicySection[0]).toMatch(/logs:CreateLogStream/);
      expect(iamPolicySection[0]).toMatch(/logs:PutLogEvents/);
    }
  });

  test('VPC Flow Log is defined', () => {
    expect(resourceExists(mainContent, 'aws_flow_log', 'main')).toBe(true);
  });

  test('VPC Flow Log captures ALL traffic', () => {
    const flowLogSection = mainContent.match(/resource\s+"aws_flow_log"\s+"main"\s*{[\s\S]*?^}/m);
    expect(flowLogSection).toBeTruthy();
    if (flowLogSection) {
      expect(flowLogSection[0]).toMatch(/traffic_type\s*=\s*"ALL"/);
    }
  });

  test('VPC Flow Log uses CloudWatch as destination', () => {
    const flowLogSection = mainContent.match(/resource\s+"aws_flow_log"\s+"main"\s*{[\s\S]*?^}/m);
    expect(flowLogSection).toBeTruthy();
    if (flowLogSection) {
      expect(flowLogSection[0]).toMatch(/log_destination\s*=\s*aws_cloudwatch_log_group\.vpc_flow_logs\.arn/);
    }
  });
});

describe('Terraform Infrastructure - Outputs', () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = readTerraformFile('outputs.tf');
  });

  test('VPC ID output is defined', () => {
    expect(outputsContent).toMatch(/output\s+"vpc_id"\s*{/);
  });

  test('Public subnet IDs output is defined', () => {
    expect(outputsContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
  });

  test('Private subnet IDs output is defined', () => {
    expect(outputsContent).toMatch(/output\s+"private_subnet_ids"\s*{/);
  });

  test('Database subnet IDs output is defined', () => {
    expect(outputsContent).toMatch(/output\s+"database_subnet_ids"\s*{/);
  });

  test('NAT Gateway IPs output is defined', () => {
    expect(outputsContent).toMatch(/output\s+"nat_gateway_public_ips"\s*{/);
  });

  test('Internet Gateway ID output is defined', () => {
    expect(outputsContent).toMatch(/output\s+"internet_gateway_id"\s*{/);
  });

  test('Security Group IDs outputs are defined', () => {
    expect(outputsContent).toMatch(/output\s+"web_security_group_id"\s*{/);
    expect(outputsContent).toMatch(/output\s+"app_security_group_id"\s*{/);
    expect(outputsContent).toMatch(/output\s+"database_security_group_id"\s*{/);
  });

  test('VPC Flow Log outputs are defined', () => {
    expect(outputsContent).toMatch(/output\s+"vpc_flow_log_id"\s*{/);
    expect(outputsContent).toMatch(/output\s+"vpc_flow_log_cloudwatch_log_group"\s*{/);
  });

  test('Subnet IDs by tier output is defined', () => {
    expect(outputsContent).toMatch(/output\s+"subnet_ids_by_tier"\s*{/);
  });

  test('Security Group IDs by tier output is defined', () => {
    expect(outputsContent).toMatch(/output\s+"security_group_ids_by_tier"\s*{/);
  });

  test('Outputs have descriptions', () => {
    const outputs = outputsContent.match(/output\s+"[^"]+"\s*{[^}]+}/g);
    expect(outputs).toBeTruthy();
    if (outputs) {
      outputs.forEach(output => {
        expect(output).toMatch(/description\s*=/);
      });
    }
  });
});

describe('Terraform Infrastructure - Resource Tagging', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readTerraformFile('main.tf');
  });

  test('VPC is tagged', () => {
    const vpcSection = mainContent.match(/resource\s+"aws_vpc"\s+"main"\s*{[\s\S]*?^}/m);
    expect(vpcSection).toBeTruthy();
    if (vpcSection) {
      expect(vpcSection[0]).toMatch(/tags\s*=\s*{/);
    }
  });

  test('Resources include environment_suffix in tags', () => {
    expect(mainContent).toMatch(/environment_suffix/);
  });

  test('Resources include Project tag', () => {
    expect(mainContent).toMatch(/Project\s*=\s*"payment-processing"/);
  });

  test('Internet Gateway is tagged', () => {
    const igwSection = mainContent.match(/resource\s+"aws_internet_gateway"\s+"main"\s*{[\s\S]*?^}/m);
    expect(igwSection).toBeTruthy();
    if (igwSection) {
      expect(igwSection[0]).toMatch(/tags\s*=\s*{/);
    }
  });

  test('NAT Gateways are tagged', () => {
    const natSection = mainContent.match(/resource\s+"aws_nat_gateway"\s+"main"\s*{[\s\S]*?^}/m);
    expect(natSection).toBeTruthy();
    if (natSection) {
      expect(natSection[0]).toMatch(/tags\s*=\s*{/);
    }
  });

  test('Security Groups are tagged', () => {
    const webSgSection = mainContent.match(/resource\s+"aws_security_group"\s+"web"\s*{[\s\S]*?^}/m);
    expect(webSgSection).toBeTruthy();
    if (webSgSection) {
      expect(webSgSection[0]).toMatch(/tags\s*=\s*{/);
    }
  });
});

describe('Terraform Infrastructure - Data Sources', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readTerraformFile('main.tf');
  });

  test('Availability zones data source is defined', () => {
    expect(mainContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
  });

  test('Availability zones data source filters for available zones', () => {
    const azDataSection = mainContent.match(/data\s+"aws_availability_zones"\s+"available"\s*{[\s\S]*?^}/m);
    expect(azDataSection).toBeTruthy();
    if (azDataSection) {
      expect(azDataSection[0]).toMatch(/state\s*=\s*"available"/);
    }
  });
});

describe('Terraform Infrastructure - Resource Counts', () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = readTerraformFile('main.tf');
  });

  test('Exactly 1 VPC is defined', () => {
    expect(countResourceOccurrences(mainContent, 'aws_vpc')).toBe(1);
  });

  test('Exactly 1 Internet Gateway is defined', () => {
    expect(countResourceOccurrences(mainContent, 'aws_internet_gateway')).toBe(1);
  });

  test('Exactly 3 subnet types are defined', () => {
    const subnetMatches = mainContent.match(/resource\s+"aws_subnet"/g);
    expect(subnetMatches).toBeTruthy();
    if (subnetMatches) {
      expect(subnetMatches.length).toBe(3); // public, private, database
    }
  });

  test('Exactly 3 security groups are defined', () => {
    expect(countResourceOccurrences(mainContent, 'aws_security_group')).toBe(3);
  });

  test('Exactly 3 Network ACLs are defined', () => {
    expect(countResourceOccurrences(mainContent, 'aws_network_acl')).toBe(3);
  });

  test('VPC Flow Logs components are defined', () => {
    expect(countResourceOccurrences(mainContent, 'aws_cloudwatch_log_group')).toBeGreaterThanOrEqual(1);
    expect(countResourceOccurrences(mainContent, 'aws_iam_role')).toBeGreaterThanOrEqual(1);
    expect(countResourceOccurrences(mainContent, 'aws_flow_log')).toBeGreaterThanOrEqual(1);
  });
});
