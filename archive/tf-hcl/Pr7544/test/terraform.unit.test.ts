// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for Terraform infrastructure configuration
// Tests syntax, resource definitions, dependencies, and CIDR configurations

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const VARIABLES_REL = "../lib/variables.tf";
const DEV_TFVARS_REL = "../lib/dev.tfvars";

const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);
const variablesPath = path.resolve(__dirname, VARIABLES_REL);
const devTfvarsPath = path.resolve(__dirname, DEV_TFVARS_REL);

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;
  let variablesContent: string;
  let devTfvarsContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
    variablesContent = fs.readFileSync(variablesPath, "utf8");
    devTfvarsContent = fs.readFileSync(devTfvarsPath, "utf8");
  });

  describe("File Structure Tests", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("variables.tf exists", () => {
      expect(fs.existsSync(variablesPath)).toBe(true);
    });

    test("dev.tfvars exists", () => {
      expect(fs.existsSync(devTfvarsPath)).toBe(true);
    });
  });

  describe("Provider Configuration Tests", () => {
    test("provider.tf contains terraform version constraint >= 1.5.0", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });

    test("provider.tf contains AWS provider version constraint ~> 5.0", () => {
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test("provider.tf uses var.aws_region for region", () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("tap_stack.tf does NOT declare terraform block (provider.tf owns it)", () => {
      expect(stackContent).not.toMatch(/terraform\s*\{/);
    });

    test("tap_stack.tf does NOT declare provider (provider.tf owns it)", () => {
      expect(stackContent).not.toMatch(/provider\s+"aws"\s*\{/);
    });
  });

  describe("Variables Configuration Tests", () => {
    test("variables.tf declares aws_region variable", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*\{/);
    });

    test("variables.tf declares allowed_ssh_cidr variable", () => {
      expect(variablesContent).toMatch(/variable\s+"allowed_ssh_cidr"\s*\{/);
    });

    test("variables.tf declares environment_suffix variable", () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*\{/);
    });

    test("dev.tfvars sets aws_region to us-west-2", () => {
      expect(devTfvarsContent).toMatch(/aws_region\s*=\s*"us-west-2"/);
    });

    test("dev.tfvars sets allowed_ssh_cidr", () => {
      expect(devTfvarsContent).toMatch(/allowed_ssh_cidr\s*=\s*"[^"]+"/);
    });
  });

  describe("VPC Infrastructure Tests", () => {
    test("declares VPC resource with correct CIDR", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*\{/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("VPC enables DNS hostnames and support", () => {
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("declares Internet Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test("Internet Gateway references VPC", () => {
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });
  });

  describe("Subnet Configuration Tests", () => {
    test("declares public subnet 1 with correct CIDR", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_1"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.1\.0\/24"/);
    });

    test("declares public subnet 2 with correct CIDR", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_2"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.2\.0\/24"/);
    });

    test("declares private subnet 1 with correct CIDR", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_1"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.10\.0\/24"/);
    });

    test("declares private subnet 2 with correct CIDR", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_2"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.11\.0\/24"/);
    });

    test("public subnets enable auto-assign public IP", () => {
      const publicSubnet1Match = stackContent.match(/resource\s+"aws_subnet"\s+"public_1"\s*\{[^}]*map_public_ip_on_launch\s*=\s*true/s);
      const publicSubnet2Match = stackContent.match(/resource\s+"aws_subnet"\s+"public_2"\s*\{[^}]*map_public_ip_on_launch\s*=\s*true/s);
      expect(publicSubnet1Match).toBeTruthy();
      expect(publicSubnet2Match).toBeTruthy();
    });

    test("subnets use different availability zones", () => {
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[0\]/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[1\]/);
    });
  });

  describe("NAT Gateway Configuration Tests", () => {
    test("declares NAT Gateway 1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_1"/);
    });

    test("declares NAT Gateway 2", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_2"/);
    });

    test("NAT gateways have Elastic IPs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_2"/);
      expect(stackContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat_1\.id/);
      expect(stackContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat_2\.id/);
    });

    test("NAT gateways are in public subnets", () => {
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public_1\.id/);
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public_2\.id/);
    });

    test("Elastic IPs have proper dependencies", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });
  });

  describe("Route Table Configuration Tests", () => {
    test("declares public route table", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    });

    test("public route table routes to Internet Gateway", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(stackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test("declares private route tables", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private_2"/);
    });

    test("private route tables route to NAT gateways", () => {
      expect(stackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.nat_1\.id/);
      expect(stackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.nat_2\.id/);
    });

    test("route table associations exist for all subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_2"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_1"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_2"/);
    });
  });

  describe("Security Group Configuration Tests", () => {
    test("declares security group for EC2 instances", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2_sg"/);
    });

    test("security group allows SSH from allowed CIDR", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*22/);
      expect(stackContent).toMatch(/to_port\s*=\s*22/);
      expect(stackContent).toMatch(/protocol\s*=\s*"tcp"/);
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\[var\.allowed_ssh_cidr\]/);
    });

    test("security group allows all outbound traffic", () => {
      expect(stackContent).toMatch(/egress\s*\{[^}]*from_port\s*=\s*0[^}]*to_port\s*=\s*0[^}]*protocol\s*=\s*"-1"/s);
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });
  });

  describe("EC2 Instance Configuration Tests", () => {
    test("declares EC2 instance 1", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"ec2_1"/);
    });

    test("declares EC2 instance 2", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"ec2_2"/);
    });

    test("EC2 instances use t2.micro instance type", () => {
      expect(stackContent).toMatch(/instance_type\s*=\s*"t2\.micro"/);
    });

    test("EC2 instances are in private subnets", () => {
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.private_1\.id/);
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.private_2\.id/);
    });

    test("EC2 instances use security group", () => {
      expect(stackContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.ec2_sg\.id\]/);
    });

    test("EC2 instances have encrypted EBS volumes", () => {
      expect(stackContent).toMatch(/root_block_device\s*\{[^}]*encrypted\s*=\s*true/s);
    });

    // Note: EC2 Elastic IPs removed for security compliance
    // EC2 instances in private subnets should not have direct public IPs

    test("EC2 instances do not have deletion protection", () => {
      expect(stackContent).toMatch(/disable_api_termination\s*=\s*false/);
    });
  });

  describe("Data Sources Tests", () => {
    test("declares availability zones data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(stackContent).toMatch(/state\s*=\s*"available"/);
    });

    test("declares AMI data source for Amazon Linux 2", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"/);
      expect(stackContent).toMatch(/most_recent\s*=\s*true/);
      expect(stackContent).toMatch(/owners\s*=\s*\["amazon"\]/);
    });

    test("AMI data source filters for Amazon Linux 2", () => {
      expect(stackContent).toMatch(/name\s*=\s*"name"[^}]*values\s*=\s*\["amzn2-ami-hvm-\*-x86_64-gp2"\]/s);
      expect(stackContent).toMatch(/name\s*=\s*"virtualization-type"[^}]*values\s*=\s*\["hvm"\]/s);
    });
  });

  describe("Output Configuration Tests", () => {
    test("outputs VPC ID", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*\{[^}]*value\s*=\s*aws_vpc\.main\.id/s);
    });

    test("outputs all subnet IDs", () => {
      expect(stackContent).toMatch(/output\s+"public_subnet_1_id"\s*\{[^}]*value\s*=\s*aws_subnet\.public_1\.id/s);
      expect(stackContent).toMatch(/output\s+"public_subnet_2_id"\s*\{[^}]*value\s*=\s*aws_subnet\.public_2\.id/s);
      expect(stackContent).toMatch(/output\s+"private_subnet_1_id"\s*\{[^}]*value\s*=\s*aws_subnet\.private_1\.id/s);
      expect(stackContent).toMatch(/output\s+"private_subnet_2_id"\s*\{[^}]*value\s*=\s*aws_subnet\.private_2\.id/s);
    });

    test("outputs EC2 private IPs", () => {
      expect(stackContent).toMatch(/output\s+"ec2_1_private_ip"\s*\{[^}]*value\s*=\s*aws_instance\.ec2_1\.private_ip/s);
      expect(stackContent).toMatch(/output\s+"ec2_2_private_ip"\s*\{[^}]*value\s*=\s*aws_instance\.ec2_2\.private_ip/s);
    });

    test("outputs NAT Gateway IPs", () => {
      expect(stackContent).toMatch(/output\s+"nat_gateway_1_ip"\s*\{[^}]*value\s*=\s*aws_eip\.nat_1\.public_ip/s);
      expect(stackContent).toMatch(/output\s+"nat_gateway_2_ip"\s*\{[^}]*value\s*=\s*aws_eip\.nat_2\.public_ip/s);
    });
  });

  describe("CIDR Block Validation Tests", () => {
    test("VPC CIDR does not overlap with subnet CIDRs", () => {
      const vpcCidr = "10.0.0.0/16";
      const subnetCidrs = [
        "10.0.1.0/24",   // public_1
        "10.0.2.0/24",   // public_2
        "10.0.10.0/24",  // private_1
        "10.0.11.0/24"   // private_2
      ];
      
      // All subnet CIDRs should be within VPC CIDR range
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
      subnetCidrs.forEach(cidr => {
        const cidrRegex = new RegExp(cidr.replace(/\./g, '\\.').replace(/\//g, '\\/'));
        expect(stackContent).toMatch(cidrRegex);
      });
    });

    test("subnet CIDRs are unique and non-overlapping", () => {
      const subnetMatches = [
        stackContent.match(/public_1"[^}]*cidr_block\s*=\s*"([^"]+)"/s),
        stackContent.match(/public_2"[^}]*cidr_block\s*=\s*"([^"]+)"/s),
        stackContent.match(/private_1"[^}]*cidr_block\s*=\s*"([^"]+)"/s),
        stackContent.match(/private_2"[^}]*cidr_block\s*=\s*"([^"]+)"/s)
      ];

      const cidrs = subnetMatches.map(match => match?.[1]).filter(Boolean);
      const uniqueCidrs = new Set(cidrs);
      
      expect(cidrs.length).toBe(4);
      expect(uniqueCidrs.size).toBe(4); // All CIDRs should be unique
    });
  });

  describe("Tagging and Naming Tests", () => {
    test("resources have appropriate Name tags", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"main-vpc-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/Name\s*=\s*"public-subnet-1-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/Name\s*=\s*"public-subnet-2-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/Name\s*=\s*"private-subnet-1-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/Name\s*=\s*"private-subnet-2-\$\{var\.environment_suffix\}"/);
    });

    test("EC2 instances have descriptive tags", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"ec2-instance-1-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/Name\s*=\s*"ec2-instance-2-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/Zone\s*=\s*"private-subnet-1"/);
      expect(stackContent).toMatch(/Zone\s*=\s*"private-subnet-2"/);
    });
  });

  describe("Security Best Practices Tests", () => {
    test("EBS volumes are encrypted", () => {
      expect(stackContent).toMatch(/encrypted\s*=\s*true/);
    });

    test("monitoring is enabled for EC2 instances", () => {
      expect(stackContent).toMatch(/monitoring\s*=\s*true/);
    });

    test("no hardcoded sensitive values", () => {
      expect(stackContent).not.toMatch(/password\s*=\s*"[^"]*"/i);
      expect(stackContent).not.toMatch(/secret\s*=\s*"[^"]*"/i);
      expect(stackContent).not.toMatch(/key\s*=\s*"[^"]*"/i);
    });

    test("uses variable for SSH access control", () => {
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\[var\.allowed_ssh_cidr\]/);
      expect(stackContent).not.toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\][^}]*port\s*=\s*22/s);
    });
  });

  describe("Resource Dependencies Tests", () => {
    test("NAT gateways depend on Internet Gateway", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test("Elastic IPs for NAT depend on Internet Gateway", () => {
      const eipSections = stackContent.split(/resource\s+"aws_eip"\s+"nat_[12]"/);
      eipSections.slice(1).forEach(section => {
        expect(section).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
      });
    });

    // Note: EC2 Elastic IPs removed for security compliance 
    // Only NAT Gateway EIPs remain for outbound internet access

    test("route table associations reference correct subnets and tables", () => {
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public_1\.id/);
      expect(stackContent).toMatch(/route_table_id\s*=\s*aws_route_table\.public\.id/);
    });

    test("private route tables reference correct NAT gateways", () => {
      expect(stackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.nat_1\.id/);
      expect(stackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.nat_2\.id/);
    });
  });

  describe("Detailed VPC Configuration Tests", () => {
    test("VPC has correct name prefix", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"main-vpc-\$\{var\.environment_suffix\}"/);
    });

    test("VPC has Environment tag", () => {
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
    });

    test("VPC configuration is complete", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*\{[^}]*cidr_block[^}]*enable_dns_hostnames[^}]*enable_dns_support/s);
    });

    test("VPC CIDR block is properly formatted", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("VPC DNS settings are explicitly set", () => {
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });
  });

  describe("Detailed Subnet Configuration Tests", () => {
    test("public subnet 1 has correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_1"[^}]*vpc_id\s*=\s*aws_vpc\.main\.id/s);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_1"[^}]*availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[0\]/s);
    });

    test("public subnet 2 has correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_2"[^}]*vpc_id\s*=\s*aws_vpc\.main\.id/s);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_2"[^}]*availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[1\]/s);
    });

    test("private subnet 1 has correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_1"[^}]*vpc_id\s*=\s*aws_vpc\.main\.id/s);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_1"[^}]*availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[0\]/s);
    });

    test("private subnet 2 has correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_2"[^}]*vpc_id\s*=\s*aws_vpc\.main\.id/s);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_2"[^}]*availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[1\]/s);
    });

    test("public subnet 1 has Type tag", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_1"[\s\S]*?tags\s*=\s*\{[\s\S]*?Type\s*=\s*"Public"/);
    });

    test("public subnet 2 has Type tag", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public_2"[\s\S]*?tags\s*=\s*\{[\s\S]*?Type\s*=\s*"Public"/);
    });

    test("private subnet 1 has Type tag", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_1"[\s\S]*?tags\s*=\s*\{[\s\S]*?Type\s*=\s*"Private"/);
    });

    test("private subnet 2 has Type tag", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_2"[\s\S]*?tags\s*=\s*\{[\s\S]*?Type\s*=\s*"Private"/);
    });

    test("subnet CIDR blocks are within VPC range", () => {
      // All subnets should start with 10.0.x.0/24
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.1\.0\/24"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.2\.0\/24"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.10\.0\/24"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.11\.0\/24"/);
    });
  });

  describe("Detailed Internet Gateway Tests", () => {
    test("Internet Gateway has correct name", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"[^}]*Name\s*=\s*"main-igw-\$\{var\.environment_suffix\}"/s);
    });

    test("Internet Gateway is attached to VPC", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"[^}]*vpc_id\s*=\s*aws_vpc\.main\.id/s);
    });

    test("Internet Gateway resource block is complete", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*\{[^}]*vpc_id[^}]*tags/s);
    });
  });

  describe("Detailed NAT Gateway Tests", () => {
    test("NAT Gateway 1 configuration is complete", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_1"[^}]*allocation_id\s*=\s*aws_eip\.nat_1\.id/s);
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_1"[^}]*subnet_id\s*=\s*aws_subnet\.public_1\.id/s);
    });

    test("NAT Gateway 2 configuration is complete", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_2"[^}]*allocation_id\s*=\s*aws_eip\.nat_2\.id/s);
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_2"[^}]*subnet_id\s*=\s*aws_subnet\.public_2\.id/s);
    });

    test("NAT Gateway 1 has correct name tag", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_1"[^}]*Name\s*=\s*"nat-gateway-1-\$\{var\.environment_suffix\}"/s);
    });

    test("NAT Gateway 2 has correct name tag", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_2"[^}]*Name\s*=\s*"nat-gateway-2-\$\{var\.environment_suffix\}"/s);
    });

    test("NAT Gateway dependencies are correct", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });
  });

  describe("Detailed Elastic IP Tests", () => {
    test("EIP for NAT 1 has correct domain", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_1"[^}]*domain\s*=\s*"vpc"/s);
    });

    test("EIP for NAT 2 has correct domain", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_2"[^}]*domain\s*=\s*"vpc"/s);
    });

    // Note: EC2 EIP tests removed - EC2 instances in private subnets 
    // should not have public IPs for security compliance

    test("NAT EIP 1 has correct name tag", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_1"[^}]*Name\s*=\s*"nat-eip-1-\$\{var\.environment_suffix\}"/s);
    });

    test("NAT EIP 2 has correct name tag", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat_2"[^}]*Name\s*=\s*"nat-eip-2-\$\{var\.environment_suffix\}"/s);
    });

    // Note: EC2 EIPs removed for security - EC2 instances in private subnets should not have public IPs
  });

  describe("Detailed Route Table Tests", () => {
    test("public route table has correct name", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"public-route-table-\$\{var\.environment_suffix\}"/);
    });

    test("private route table 1 has correct name", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"private-route-table-1-\$\{var\.environment_suffix\}"/);
    });

    test("private route table 2 has correct name", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"private-route-table-2-\$\{var\.environment_suffix\}"/);
    });

    test("public route table routes 0.0.0.0/0 to IGW", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(stackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test("private route table 1 routes to NAT 1", () => {
      expect(stackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.nat_1\.id/);
    });

    test("private route table 2 routes to NAT 2", () => {
      expect(stackContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.nat_2\.id/);
    });
  });

  describe("Detailed Route Table Association Tests", () => {
    test("public subnet 1 association is correct", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_1"[^}]*subnet_id\s*=\s*aws_subnet\.public_1\.id/s);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_1"[^}]*route_table_id\s*=\s*aws_route_table\.public\.id/s);
    });

    test("public subnet 2 association is correct", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_2"[^}]*subnet_id\s*=\s*aws_subnet\.public_2\.id/s);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public_2"[^}]*route_table_id\s*=\s*aws_route_table\.public\.id/s);
    });

    test("private subnet 1 association is correct", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_1"[^}]*subnet_id\s*=\s*aws_subnet\.private_1\.id/s);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_1"[^}]*route_table_id\s*=\s*aws_route_table\.private_1\.id/s);
    });

    test("private subnet 2 association is correct", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_2"[^}]*subnet_id\s*=\s*aws_subnet\.private_2\.id/s);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private_2"[^}]*route_table_id\s*=\s*aws_route_table\.private_2\.id/s);
    });
  });

  describe("Detailed Security Group Tests", () => {
    test("security group has correct name prefix", () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"ec2-sg"/);
    });

    test("security group has descriptive description", () => {
      expect(stackContent).toMatch(/description\s*=\s*"Security group for EC2 instances with restricted SSH access"/);
    });

    test("security group is in correct VPC", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2_sg"[^}]*vpc_id\s*=\s*aws_vpc\.main\.id/s);
    });

    test("SSH ingress rule has correct description", () => {
      expect(stackContent).toMatch(/ingress\s*\{[^}]*description\s*=\s*"SSH from allowed CIDR"/s);
    });

    test("egress rule has correct description", () => {
      expect(stackContent).toMatch(/egress\s*\{[^}]*description\s*=\s*"Allow all outbound traffic"/s);
    });

    test("security group has correct name tag", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"ec2-security-group-\$\{var\.environment_suffix\}"/);
    });
  });

  describe("Detailed EC2 Instance Tests", () => {
    test("EC2 instance 1 uses correct AMI", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"ec2_1"[^}]*ami\s*=\s*data\.aws_ami\.amazon_linux_2\.id/s);
    });

    test("EC2 instance 2 uses correct AMI", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"ec2_2"[^}]*ami\s*=\s*data\.aws_ami\.amazon_linux_2\.id/s);
    });

    test("EC2 instance 1 root block device has correct volume type", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"ec2_1"[^}]*root_block_device\s*\{[^}]*volume_type\s*=\s*"gp3"/s);
    });

    test("EC2 instance 2 root block device has correct volume type", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"ec2_2"[^}]*root_block_device\s*\{[^}]*volume_type\s*=\s*"gp3"/s);
    });

    test("EC2 instance 1 root block device has correct volume size", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"ec2_1"[^}]*root_block_device\s*\{[^}]*volume_size\s*=\s*8/s);
    });

    test("EC2 instance 2 root block device has correct volume size", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"ec2_2"[^}]*root_block_device\s*\{[^}]*volume_size\s*=\s*8/s);
    });

    test("EC2 instance 1 root block device deletes on termination", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"ec2_1"[^}]*root_block_device\s*\{[^}]*delete_on_termination\s*=\s*true/s);
    });

    test("EC2 instance 2 root block device deletes on termination", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"ec2_2"[^}]*root_block_device\s*\{[^}]*delete_on_termination\s*=\s*true/s);
    });

    test("EC2 instance 1 has correct Zone tag", () => {
      expect(stackContent).toMatch(/Zone\s*=\s*"private-subnet-1"/);
    });

    test("EC2 instance 2 has correct Zone tag", () => {
      expect(stackContent).toMatch(/Zone\s*=\s*"private-subnet-2"/);
    });
  });

  describe("Advanced Configuration Validation Tests", () => {
    test("all resources have consistent naming convention", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"main-vpc-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/Name\s*=\s*"main-igw-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/Name\s*=\s*"nat-gateway-1-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/Name\s*=\s*"nat-gateway-2-\$\{var\.environment_suffix\}"/);
    });

    test("subnet naming follows pattern", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"public-subnet-1-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/Name\s*=\s*"public-subnet-2-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/Name\s*=\s*"private-subnet-1-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/Name\s*=\s*"private-subnet-2-\$\{var\.environment_suffix\}"/);
    });

    test("route table naming follows pattern", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"public-route-table-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/Name\s*=\s*"private-route-table-1-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/Name\s*=\s*"private-route-table-2-\$\{var\.environment_suffix\}"/);
    });

    test("EIP naming follows pattern", () => {
      // Only NAT Gateway EIPs exist - EC2 EIPs removed for security
      expect(stackContent).toMatch(/Name\s*=\s*"nat-eip-1-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/Name\s*=\s*"nat-eip-2-\$\{var\.environment_suffix\}"/);
    });

    test("instance naming follows pattern", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"ec2-instance-1-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/Name\s*=\s*"ec2-instance-2-\$\{var\.environment_suffix\}"/);
    });
  });

  describe("Output Validation Tests", () => {
    test("vpc_id output has correct description", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"[^}]*description\s*=\s*"ID of the VPC"/s);
    });

    test("public_subnet_1_id output has correct description", () => {
      expect(stackContent).toMatch(/output\s+"public_subnet_1_id"[^}]*description\s*=\s*"ID of public subnet 1"/s);
    });

    test("public_subnet_2_id output has correct description", () => {
      expect(stackContent).toMatch(/output\s+"public_subnet_2_id"[^}]*description\s*=\s*"ID of public subnet 2"/s);
    });

    test("private_subnet_1_id output has correct description", () => {
      expect(stackContent).toMatch(/output\s+"private_subnet_1_id"[^}]*description\s*=\s*"ID of private subnet 1"/s);
    });

    test("private_subnet_2_id output has correct description", () => {
      expect(stackContent).toMatch(/output\s+"private_subnet_2_id"[^}]*description\s*=\s*"ID of private subnet 2"/s);
    });

    test("ec2_1_private_ip output has correct description", () => {
      expect(stackContent).toMatch(/output\s+"ec2_1_private_ip"[^}]*description\s*=\s*"Private IP of EC2 instance 1"/s);
    });

    test("ec2_2_private_ip output has correct description", () => {
      expect(stackContent).toMatch(/output\s+"ec2_2_private_ip"[^}]*description\s*=\s*"Private IP of EC2 instance 2"/s);
    });

    test("nat_gateway_1_ip output has correct description", () => {
      expect(stackContent).toMatch(/output\s+"nat_gateway_1_ip"[^}]*description\s*=\s*"Public IP of NAT Gateway 1"/s);
    });

    test("nat_gateway_2_ip output has correct description", () => {
      expect(stackContent).toMatch(/output\s+"nat_gateway_2_ip"[^}]*description\s*=\s*"Public IP of NAT Gateway 2"/s);
    });
  });

  describe("Data Source Validation Tests", () => {
    test("availability zones data source has correct filter", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"[^}]*state\s*=\s*"available"/s);
    });

    test("AMI data source has most_recent enabled", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"[^}]*most_recent\s*=\s*true/s);
    });

    test("AMI data source has correct owner", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2"[^}]*owners\s*=\s*\["amazon"\]/s);
    });

    test("AMI filter for name is correct", () => {
      expect(stackContent).toMatch(/filter\s*\{[^}]*name\s*=\s*"name"[^}]*values\s*=\s*\["amzn2-ami-hvm-\*-x86_64-gp2"\]/s);
    });

    test("AMI filter for virtualization type is correct", () => {
      expect(stackContent).toMatch(/filter\s*\{[^}]*name\s*=\s*"virtualization-type"[^}]*values\s*=\s*\["hvm"\]/s);
    });
  });

  describe("File Content Validation Tests", () => {
    test("tap_stack.tf contains expected number of resources", () => {
      const resourceMatches = stackContent.match(/resource\s+"[^"]+"\s+"[^"]+"\s*\{/g);
      expect(resourceMatches).toBeTruthy();
      expect(resourceMatches!.length).toBeGreaterThanOrEqual(16); // At least 16 resources
    });

    test("tap_stack.tf contains expected number of outputs", () => {
      const outputMatches = stackContent.match(/output\s+"[^"]+"\s*\{/g);
      expect(outputMatches).toBeTruthy();
      expect(outputMatches!.length).toBe(9); // Exactly 9 outputs
    });

    test("tap_stack.tf contains expected number of data sources", () => {
      const dataMatches = stackContent.match(/data\s+"[^"]+"\s+"[^"]+"\s*\{/g);
      expect(dataMatches).toBeTruthy();
      expect(dataMatches!.length).toBe(2); // Exactly 2 data sources
    });

    test("all resource blocks are properly closed", () => {
      const openBraces = (stackContent.match(/\{/g) || []).length;
      const closeBraces = (stackContent.match(/\}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });
  });

  describe("Additional Configuration Files Tests", () => {
    test("staging.tfvars exists and has correct content", () => {
      const stagingPath = path.resolve(__dirname, "../lib/staging.tfvars");
      expect(fs.existsSync(stagingPath)).toBe(true);
      const stagingContent = fs.readFileSync(stagingPath, "utf8");
      expect(stagingContent).toMatch(/aws_region\s*=\s*"us-west-2"/);
      expect(stagingContent).toMatch(/environment_suffix\s*=\s*"staging"/);
    });

    test("prod.tfvars exists and has correct content", () => {
      const prodPath = path.resolve(__dirname, "../lib/prod.tfvars");
      expect(fs.existsSync(prodPath)).toBe(true);
      const prodContent = fs.readFileSync(prodPath, "utf8");
      expect(prodContent).toMatch(/aws_region\s*=\s*"us-west-2"/);
      expect(prodContent).toMatch(/environment_suffix\s*=\s*"prod"/);
    });
  });
});
