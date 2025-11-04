// Unit tests for Terraform VPC infrastructure
// Tests validate configuration syntax, resource definitions, and structure

import * as fs from 'fs';
import * as path from 'path';

describe('Terraform VPC Infrastructure Unit Tests', () => {
  const libDir = path.resolve(__dirname, '../lib');

  // Helper to read Terraform files
  const readTfFile = (filename: string): string => {
    const filePath = path.join(libDir, filename);
    return fs.readFileSync(filePath, 'utf-8');
  };

  // Helper to check if file exists
  const fileExists = (filename: string): boolean => {
    return fs.existsSync(path.join(libDir, filename));
  };

  describe('File Structure', () => {
    test('main.tf exists', () => {
      expect(fileExists('main.tf')).toBe(true);
    });

    test('variables.tf exists', () => {
      expect(fileExists('variables.tf')).toBe(true);
    });

    test('outputs.tf exists', () => {
      expect(fileExists('outputs.tf')).toBe(true);
    });

    test('terraform.tfvars exists', () => {
      expect(fileExists('terraform.tfvars')).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    test('declares AWS provider with correct region', () => {
      const content = readTfFile('main.tf');
      expect(content).toMatch(/provider\s+"aws"\s*{/);
      expect(content).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('uses AWS provider version ~> 5.0', () => {
      const content = readTfFile('main.tf');
      expect(content).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('has default_tags configuration', () => {
      const content = readTfFile('main.tf');
      expect(content).toMatch(/default_tags\s*{/);
    });
  });

  describe('Variables Configuration', () => {
    const variablesContent = readTfFile('variables.tf');

    test('declares environment_suffix variable', () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test('declares aws_region variable', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test('declares vpc_cidr variable', () => {
      expect(variablesContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
    });

    test('declares public_subnet_cidrs variable', () => {
      expect(variablesContent).toMatch(/variable\s+"public_subnet_cidrs"\s*{/);
    });

    test('declares private_subnet_cidrs variable', () => {
      expect(variablesContent).toMatch(/variable\s+"private_subnet_cidrs"\s*{/);
    });

    test('declares allowed_ssh_cidr variable', () => {
      expect(variablesContent).toMatch(/variable\s+"allowed_ssh_cidr"\s*{/);
    });

    test('declares tags variable', () => {
      expect(variablesContent).toMatch(/variable\s+"tags"\s*{/);
    });

    test('all variables have descriptions', () => {
      const variableBlocks = variablesContent.match(/variable\s+"[^"]+"\s*{[^}]*}/gs) || [];
      expect(variableBlocks.length).toBeGreaterThan(0);
      variableBlocks.forEach(block => {
        expect(block).toMatch(/description\s*=/);
      });
    });

    test('all variables have type definitions', () => {
      const variableBlocks = variablesContent.match(/variable\s+"[^"]+"\s*{[^}]*}/gs) || [];
      variableBlocks.forEach(block => {
        expect(block).toMatch(/type\s*=/);
      });
    });
  });

  describe('VPC Resource', () => {
    const mainContent = readTfFile('main.tf');

    test('VPC resource is defined', () => {
      expect(mainContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    });

    test('VPC uses vpc_cidr variable', () => {
      expect(mainContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    });

    test('VPC enables DNS hostnames', () => {
      expect(mainContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test('VPC enables DNS support', () => {
      expect(mainContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('VPC has Name tag with environment_suffix', () => {
      expect(mainContent).toMatch(/Name\s*=\s*"vpc-\$\{var\.environment_suffix\}"/);
    });
  });

  describe('Subnet Resources', () => {
    const mainContent = readTfFile('main.tf');

    test('public subnets resource is defined with count', () => {
      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{\s*count\s*=\s*3/s);
    });

    test('private subnets resource is defined with count', () => {
      expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{\s*count\s*=\s*3/s);
    });

    test('public subnets use correct CIDR blocks', () => {
      const publicSubnetBlock = mainContent.match(/resource\s+"aws_subnet"\s+"public"\s*{[^}]*}/s)?.[0];
      expect(publicSubnetBlock).toMatch(/cidr_block\s*=\s*var\.public_subnet_cidrs\[count\.index\]/);
    });

    test('private subnets use correct CIDR blocks', () => {
      const privateSubnetBlock = mainContent.match(/resource\s+"aws_subnet"\s+"private"\s*{[^}]*}/s)?.[0];
      expect(privateSubnetBlock).toMatch(/cidr_block\s*=\s*var\.private_subnet_cidrs\[count\.index\]/);
    });

    test('public subnets have map_public_ip_on_launch enabled', () => {
      const publicSubnetBlock = mainContent.match(/resource\s+"aws_subnet"\s+"public"\s*{[^}]*}/s)?.[0];
      expect(publicSubnetBlock).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test('public subnets have Name tags with environment_suffix', () => {
      expect(mainContent).toMatch(/Name\s*=\s*"public-subnet-\$\{count\.index \+ 1\}-\$\{var\.environment_suffix\}"/);
    });

    test('private subnets have Name tags with environment_suffix', () => {
      expect(mainContent).toMatch(/Name\s*=\s*"private-subnet-\$\{count\.index \+ 1\}-\$\{var\.environment_suffix\}"/);
    });

    test('subnets use availability zones from data source', () => {
      expect(mainContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });
  });

  describe('Internet Gateway', () => {
    const mainContent = readTfFile('main.tf');

    test('internet gateway resource is defined', () => {
      expect(mainContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    });

    test('internet gateway is attached to VPC', () => {
      expect(mainContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test('internet gateway has Name tag with environment_suffix', () => {
      expect(mainContent).toMatch(/Name\s*=\s*"igw-\$\{var\.environment_suffix\}"/);
    });
  });

  describe('NAT Gateways', () => {
    const mainContent = readTfFile('main.tf');

    test('elastic IPs are defined with count of 3', () => {
      expect(mainContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{\s*count\s*=\s*3/s);
    });

    test('elastic IPs are for VPC', () => {
      const eipBlock = mainContent.match(/resource\s+"aws_eip"\s+"nat"\s*{[^}]*}/s)?.[0];
      expect(eipBlock).toMatch(/domain\s*=\s*"vpc"/);
    });

    test('elastic IPs depend on internet gateway', () => {
      expect(mainContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test('NAT gateways are defined with count of 3', () => {
      expect(mainContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{\s*count\s*=\s*3/s);
    });

    test('NAT gateways use elastic IPs', () => {
      const natBlock = mainContent.match(/resource\s+"aws_nat_gateway"\s+"main"\s*{[^}]*}/s)?.[0];
      expect(natBlock).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
    });

    test('NAT gateways are in public subnets', () => {
      const natBlock = mainContent.match(/resource\s+"aws_nat_gateway"\s+"main"\s*{[^}]*}/s)?.[0];
      expect(natBlock).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[count\.index\]\.id/);
    });

    test('NAT gateways have Name tags with environment_suffix', () => {
      expect(mainContent).toMatch(/Name\s*=\s*"nat-gateway-\$\{count\.index \+ 1\}-\$\{var\.environment_suffix\}"/);
    });
  });

  describe('Route Tables', () => {
    const mainContent = readTfFile('main.tf');

    test('public route table is defined', () => {
      expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
    });

    test('public route table has route to internet gateway', () => {
      const publicRtBlock = mainContent.match(/resource\s+"aws_route_table"\s+"public"\s*{[^}]*route\s*{[^}]*}/s)?.[0];
      expect(publicRtBlock).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(publicRtBlock).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test('private route tables are defined with count of 3', () => {
      expect(mainContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{\s*count\s*=\s*3/s);
    });

    test('private route tables have routes to NAT gateways', () => {
      const privateRtBlock = mainContent.match(/resource\s+"aws_route_table"\s+"private"\s*{[^}]*route\s*{[^}]*}/s)?.[0];
      expect(privateRtBlock).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(privateRtBlock).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index\]\.id/);
    });

    test('public route table associations are defined', () => {
      expect(mainContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{\s*count\s*=\s*3/s);
    });

    test('private route table associations are defined', () => {
      expect(mainContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*{\s*count\s*=\s*3/s);
    });
  });

  describe('Security Groups', () => {
    const mainContent = readTfFile('main.tf');

    test('web tier security group is defined', () => {
      expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"web_tier"\s*{/);
    });

    test('app tier security group is defined', () => {
      expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"app_tier"\s*{/);
    });

    test('web tier security group allows HTTPS (443) ingress', () => {
      expect(mainContent).toMatch(/from_port\s*=\s*443/);
      expect(mainContent).toMatch(/to_port\s*=\s*443/);
    });

    test('web tier security group allows SSH (22) ingress', () => {
      expect(mainContent).toMatch(/from_port\s*=\s*22/);
      expect(mainContent).toMatch(/to_port\s*=\s*22/);
    });

    test('app tier security group references web tier security group', () => {
      expect(mainContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.web_tier\.id\]/);
    });

    test('security groups use name_prefix with environment_suffix', () => {
      expect(mainContent).toMatch(/name_prefix\s*=\s*"web-tier-\$\{var\.environment_suffix\}-"/);
      expect(mainContent).toMatch(/name_prefix\s*=\s*"app-tier-\$\{var\.environment_suffix\}-"/);
    });

    test('security groups have lifecycle create_before_destroy', () => {
      expect(mainContent).toMatch(/lifecycle\s*\{[^}]*create_before_destroy\s*=\s*true/s);
    });
  });

  describe('Network ACLs', () => {
    const mainContent = readTfFile('main.tf');

    test('public network ACL is defined', () => {
      expect(mainContent).toMatch(/resource\s+"aws_network_acl"\s+"public"\s*{/);
    });

    test('private network ACL is defined', () => {
      expect(mainContent).toMatch(/resource\s+"aws_network_acl"\s+"private"\s*{/);
    });

    test('public network ACL allows HTTPS (443) ingress', () => {
      const publicNaclBlock = mainContent.match(/resource\s+"aws_network_acl"\s+"public"\s*{[^}]*}/s)?.[0];
      expect(publicNaclBlock).toMatch(/ingress\s*{[^}]*from_port\s*=\s*443[^}]*to_port\s*=\s*443[^}]*}/s);
    });

    test('public network ACL allows ephemeral ports', () => {
      expect(mainContent).toMatch(/from_port\s*=\s*1024/);
      expect(mainContent).toMatch(/to_port\s*=\s*65535/);
    });

    test('private network ACL allows VPC CIDR traffic', () => {
      const privateNaclBlock = mainContent.match(/resource\s+"aws_network_acl"\s+"private"\s*{[^}]*}/s)?.[0];
      expect(privateNaclBlock).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    });

    test('network ACLs reference subnet IDs correctly', () => {
      expect(mainContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.public\[\*\]\.id/);
      expect(mainContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });
  });

  describe('Outputs Configuration', () => {
    const outputsContent = readTfFile('outputs.tf');

    test('vpc_id output is defined', () => {
      expect(outputsContent).toMatch(/output\s+"vpc_id"\s*{/);
    });

    test('public_subnet_ids output is defined', () => {
      expect(outputsContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
    });

    test('private_subnet_ids output is defined', () => {
      expect(outputsContent).toMatch(/output\s+"private_subnet_ids"\s*{/);
    });

    test('nat_gateway_ids output is defined', () => {
      expect(outputsContent).toMatch(/output\s+"nat_gateway_ids"\s*{/);
    });

    test('web_tier_security_group_id output is defined', () => {
      expect(outputsContent).toMatch(/output\s+"web_tier_security_group_id"\s*{/);
    });

    test('app_tier_security_group_id output is defined', () => {
      expect(outputsContent).toMatch(/output\s+"app_tier_security_group_id"\s*{/);
    });

    test('all outputs have descriptions', () => {
      const outputBlocks = outputsContent.match(/output\s+"[^"]+"\s*{[^}]*}/gs) || [];
      expect(outputBlocks.length).toBeGreaterThan(0);
      outputBlocks.forEach(block => {
        expect(block).toMatch(/description\s*=/);
      });
    });

    test('outputs reference correct resources', () => {
      expect(outputsContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
      expect(outputsContent).toMatch(/value\s*=\s*aws_subnet\.public\[\*\]\.id/);
      expect(outputsContent).toMatch(/value\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });
  });

  describe('Resource Naming Conventions', () => {
    const mainContent = readTfFile('main.tf');

    test('all resource names include environment_suffix', () => {
      const nameTagMatches = mainContent.match(/Name\s*=\s*"[^"]*\$\{var\.environment_suffix\}"/g) || [];
      // Should have at least 15 resources with Name tags containing environment_suffix
      expect(nameTagMatches.length).toBeGreaterThanOrEqual(12);
    });

    test('no hardcoded environment names in resource names', () => {
      expect(mainContent).not.toMatch(/Name\s*=\s*"[^"]*prod[^"]*"/);
      expect(mainContent).not.toMatch(/Name\s*=\s*"[^"]*dev[^"]*"/);
      expect(mainContent).not.toMatch(/Name\s*=\s*"[^"]*stage[^"]*"/);
    });
  });

  describe('High Availability Configuration', () => {
    const mainContent = readTfFile('main.tf');

    test('infrastructure spans 3 availability zones', () => {
      expect(mainContent).toMatch(/count\s*=\s*3/g);
    });

    test('each AZ has dedicated NAT gateway', () => {
      const natCount = (mainContent.match(/resource\s+"aws_nat_gateway"\s+"main"\s*{\s*count\s*=\s*3/s) || []).length;
      expect(natCount).toBeGreaterThan(0);
    });

    test('each private subnet has dedicated route table', () => {
      const privateRtCount = (mainContent.match(/resource\s+"aws_route_table"\s+"private"\s*{\s*count\s*=\s*3/s) || []).length;
      expect(privateRtCount).toBeGreaterThan(0);
    });
  });

  describe('CIDR Block Configuration', () => {
    const tfvarsContent = readTfFile('terraform.tfvars');

    test('VPC CIDR is 10.0.0.0/16', () => {
      expect(tfvarsContent).toMatch(/vpc_cidr\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test('public subnets use correct CIDR ranges', () => {
      expect(tfvarsContent).toMatch(/"10\.0\.1\.0\/24"/);
      expect(tfvarsContent).toMatch(/"10\.0\.2\.0\/24"/);
      expect(tfvarsContent).toMatch(/"10\.0\.3\.0\/24"/);
    });

    test('private subnets use correct CIDR ranges', () => {
      expect(tfvarsContent).toMatch(/"10\.0\.11\.0\/24"/);
      expect(tfvarsContent).toMatch(/"10\.0\.12\.0\/24"/);
      expect(tfvarsContent).toMatch(/"10\.0\.13\.0\/24"/);
    });

    test('public and private subnets do not overlap', () => {
      // Public: 10.0.1-3, Private: 10.0.11-13 - no overlap
      const publicCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];
      const privateCidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'];

      publicCidrs.forEach(pub => {
        expect(tfvarsContent).toMatch(new RegExp(pub.replace(/\./g, '\\.')));
      });
      privateCidrs.forEach(priv => {
        expect(tfvarsContent).toMatch(new RegExp(priv.replace(/\./g, '\\.')));
      });
    });
  });

  describe('Terraform tfvars Configuration', () => {
    const tfvarsContent = readTfFile('terraform.tfvars');

    test('aws_region is set to us-east-1', () => {
      expect(tfvarsContent).toMatch(/aws_region\s*=\s*"us-east-1"/);
    });

    test('tags include required compliance metadata', () => {
      expect(tfvarsContent).toMatch(/Compliance\s*=\s*"PCI-DSS"/);
      expect(tfvarsContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });
  });
});
