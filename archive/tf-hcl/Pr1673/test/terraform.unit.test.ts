// tests/unit/terraform.unit.test.ts
// Unit tests for Terraform infrastructure code

import fs from "fs";
import path from "path";
import { TerraformConfig } from "../lib/terraform-config";

const tapStackPath = path.resolve(__dirname, "../lib/tap_stack.tf");
const providerPath = path.resolve(__dirname, "../lib/provider.tf");

describe("Terraform Infrastructure Unit Tests", () => {
  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(tapStackPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });
  });

  describe("Provider Configuration", () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(providerPath, "utf8");
    });

    test("provider.tf declares AWS provider", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("provider.tf sets region to us-west-2", () => {
      expect(providerContent).toMatch(/region\s*=\s*"us-west-2"/);
    });

    test("provider.tf configures S3 backend", () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{}/);
    });

    test("provider.tf requires Terraform version >= 1.0", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.0"/);
    });

    test("provider.tf uses AWS provider version ~> 5.0", () => {
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test("provider.tf includes default tags", () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
      expect(providerContent).toMatch(/Environment\s*=\s*"development"/);
      expect(providerContent).toMatch(/Project\s*=\s*"ec2-infrastructure"/);
    });
  });

  describe("Infrastructure Resources", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(tapStackPath, "utf8");
    });

    test("declares environment_suffix variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("creates VPC resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates Internet Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("creates public subnet", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.1\.0\/24"/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*"us-west-2a"/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates route table with internet gateway route", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(stackContent).toMatch(/route\s*{/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
      expect(stackContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    });

    test("creates route table association", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\.id/);
      expect(stackContent).toMatch(/route_table_id\s*=\s*aws_route_table\.public\.id/);
    });

    test("uses data source for Amazon Linux 2023 AMI", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_2023"\s*{/);
      expect(stackContent).toMatch(/most_recent\s*=\s*true/);
      expect(stackContent).toMatch(/owners\s*=\s*\["amazon"\]/);
      expect(stackContent).toMatch(/values\s*=\s*\["al2023-ami-\*-x86_64"\]/);
    });

    test("creates security group with correct rules", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"web_security_group"\s*{/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
      
      // Check for HTTP ingress rule
      expect(stackContent).toMatch(/ingress\s*{[\s\S]*?description\s*=\s*"HTTP"[\s\S]*?from_port\s*=\s*80[\s\S]*?to_port\s*=\s*80[\s\S]*?protocol\s*=\s*"tcp"/);
      
      // Check for SSH ingress rule
      expect(stackContent).toMatch(/ingress\s*{[\s\S]*?description\s*=\s*"SSH"[\s\S]*?from_port\s*=\s*22[\s\S]*?to_port\s*=\s*22[\s\S]*?protocol\s*=\s*"tcp"/);
      
      // Check for egress rule
      expect(stackContent).toMatch(/egress\s*{[\s\S]*?from_port\s*=\s*0[\s\S]*?to_port\s*=\s*0[\s\S]*?protocol\s*=\s*"-1"/);
    });

    test("creates EC2 instance with correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_instance"\s+"web_server"\s*{/);
      expect(stackContent).toMatch(/ami\s*=\s*data\.aws_ami\.amazon_linux_2023\.id/);
      expect(stackContent).toMatch(/instance_type\s*=\s*"t3\.micro"/);
      expect(stackContent).toMatch(/subnet_id\s*=\s*aws_subnet\.public\.id/);
      expect(stackContent).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.web_security_group\.id\]/);
    });

    test("configures IMDSv2 for EC2 instance", () => {
      expect(stackContent).toMatch(/metadata_options\s*{/);
      expect(stackContent).toMatch(/http_endpoint\s*=\s*"enabled"/);
      expect(stackContent).toMatch(/http_tokens\s*=\s*"required"/);
      expect(stackContent).toMatch(/http_put_response_hop_limit\s*=\s*1/);
    });

    test("configures root block device correctly", () => {
      expect(stackContent).toMatch(/root_block_device\s*{/);
      expect(stackContent).toMatch(/volume_type\s*=\s*"gp3"/);
      expect(stackContent).toMatch(/volume_size\s*=\s*20/);
      expect(stackContent).toMatch(/iops\s*=\s*3000/);
      expect(stackContent).toMatch(/encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/delete_on_termination\s*=\s*true/);
    });

    test("uses environment_suffix in resource names", () => {
      // Check VPC name
      expect(stackContent).toMatch(/Name\s*=\s*"vpc-\$\{var\.environment_suffix\}"/);
      
      // Check IGW name
      expect(stackContent).toMatch(/Name\s*=\s*"igw-\$\{var\.environment_suffix\}"/);
      
      // Check subnet name
      expect(stackContent).toMatch(/Name\s*=\s*"subnet-public-\$\{var\.environment_suffix\}"/);
      
      // Check security group name
      expect(stackContent).toMatch(/name\s*=\s*"web-sg-\$\{var\.environment_suffix\}"/);
      
      // Check EC2 instance name
      expect(stackContent).toMatch(/Name\s*=\s*"web-server-\$\{var\.environment_suffix\}"/);
    });

    test("declares all required outputs", () => {
      expect(stackContent).toMatch(/output\s+"instance_id"\s*{/);
      expect(stackContent).toMatch(/output\s+"instance_public_ip"\s*{/);
      expect(stackContent).toMatch(/output\s+"instance_public_dns"\s*{/);
      expect(stackContent).toMatch(/output\s+"security_group_id"\s*{/);
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
      expect(stackContent).toMatch(/output\s+"subnet_id"\s*{/);
    });

    test("outputs reference correct resource attributes", () => {
      expect(stackContent).toMatch(/value\s*=\s*aws_instance\.web_server\.id/);
      expect(stackContent).toMatch(/value\s*=\s*aws_instance\.web_server\.public_ip/);
      expect(stackContent).toMatch(/value\s*=\s*aws_instance\.web_server\.public_dns/);
      expect(stackContent).toMatch(/value\s*=\s*aws_security_group\.web_security_group\.id/);
      expect(stackContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
      expect(stackContent).toMatch(/value\s*=\s*aws_subnet\.public\.id/);
    });
  });

  describe("Code Quality", () => {
    let stackContent: string;
    let providerContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(tapStackPath, "utf8");
      providerContent = fs.readFileSync(providerPath, "utf8");
    });

    test("no hardcoded credentials in files", () => {
      const combinedContent = stackContent + providerContent;
      expect(combinedContent).not.toMatch(/aws_access_key_id/i);
      expect(combinedContent).not.toMatch(/aws_secret_access_key/i);
      expect(combinedContent).not.toMatch(/AKIA[A-Z0-9]{16}/); // AWS Access Key pattern
    });

    test("provider.tf does not contain resource definitions", () => {
      expect(providerContent).not.toMatch(/resource\s+"/);
    });

    test("tap_stack.tf does not contain provider configuration", () => {
      expect(stackContent).not.toMatch(/^\s*provider\s+"aws"\s*{/m);
    });

    test("all taggable resources have proper tags", () => {
      // Extract all resource blocks with their full content
      const resourcePattern = /resource\s+"(aws_[^"]+)"\s+"[^"]+"\s*{[\s\S]*?^}/gm;
      const resources = [];
      let match;
      
      while ((match = resourcePattern.exec(stackContent)) !== null) {
        resources.push({ type: match[1], content: match[0] });
      }
      
      // List of resource types that should have tags
      const taggableResources = ['aws_vpc', 'aws_subnet', 'aws_security_group', 
                                  'aws_instance', 'aws_internet_gateway', 'aws_route_table'];
      
      resources.forEach(resource => {
        if (taggableResources.includes(resource.type)) {
          expect(resource.content).toMatch(/tags\s*=/);
        }
      });
    });
  });
});

describe("Terraform Config TypeScript Implementation", () => {
  let config: TerraformConfig;

  beforeEach(() => {
    config = new TerraformConfig();
  });

  describe("Resource Configuration", () => {
    test("creates all required resources", () => {
      const resources = config.getResources();
      expect(resources.length).toBe(7); // VPC, IGW, Subnet, RT, RT Association, SG, Instance
      
      const resourceTypes = resources.map(r => r.type);
      expect(resourceTypes).toContain('aws_vpc');
      expect(resourceTypes).toContain('aws_internet_gateway');
      expect(resourceTypes).toContain('aws_subnet');
      expect(resourceTypes).toContain('aws_route_table');
      expect(resourceTypes).toContain('aws_route_table_association');
      expect(resourceTypes).toContain('aws_security_group');
      expect(resourceTypes).toContain('aws_instance');
    });

    test("VPC configuration is correct", () => {
      const vpc = config.getResourceByType('aws_vpc')[0];
      expect(vpc).toBeDefined();
      expect(vpc.properties.cidr_block).toBe("10.0.0.0/16");
      expect(vpc.properties.enable_dns_hostnames).toBe(true);
      expect(vpc.properties.enable_dns_support).toBe(true);
    });

    test("Security group has correct rules", () => {
      const sg = config.getResourceByName('web_security_group');
      expect(sg).toBeDefined();
      expect(sg!.properties.ingress).toHaveLength(2);
      
      const httpRule = sg!.properties.ingress.find((r: any) => r.from_port === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.protocol).toBe('tcp');
      
      const sshRule = sg!.properties.ingress.find((r: any) => r.from_port === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.protocol).toBe('tcp');
    });

    test("EC2 instance configuration is correct", () => {
      const instance = config.getResourceByName('web_server');
      expect(instance).toBeDefined();
      expect(instance!.properties.instance_type).toBe('t3.micro');
      
      const rootDevice = instance!.properties.root_block_device;
      expect(rootDevice.volume_type).toBe('gp3');
      expect(rootDevice.volume_size).toBe(20);
      expect(rootDevice.iops).toBe(3000);
      expect(rootDevice.encrypted).toBe(true);
      expect(rootDevice.delete_on_termination).toBe(true);
    });

    test("IMDSv2 is properly configured", () => {
      const instance = config.getResourceByName('web_server');
      const metadata = instance!.properties.metadata_options;
      
      expect(metadata.http_endpoint).toBe('enabled');
      expect(metadata.http_tokens).toBe('required');
      expect(metadata.http_put_response_hop_limit).toBe(1);
    });
  });

  describe("Output Configuration", () => {
    test("creates all required outputs", () => {
      const outputs = config.getOutputs();
      expect(outputs.length).toBe(6);
      
      const outputNames = outputs.map(o => o.name);
      expect(outputNames).toContain('instance_id');
      expect(outputNames).toContain('instance_public_ip');
      expect(outputNames).toContain('instance_public_dns');
      expect(outputNames).toContain('security_group_id');
      expect(outputNames).toContain('vpc_id');
      expect(outputNames).toContain('subnet_id');
    });

    test("outputs have correct references", () => {
      const outputs = config.getOutputs();
      
      const instanceId = outputs.find(o => o.name === 'instance_id');
      expect(instanceId!.value).toBe('aws_instance.web_server.id');
      
      const vpcId = outputs.find(o => o.name === 'vpc_id');
      expect(vpcId!.value).toBe('aws_vpc.main.id');
    });
  });

  describe("Variable Configuration", () => {
    test("defines environment_suffix variable", () => {
      const variables = config.getVariables();
      expect(variables.environment_suffix).toBeDefined();
      expect(variables.environment_suffix.type).toBe('string');
      expect(variables.environment_suffix.default).toBe('dev');
    });
  });

  describe("Configuration Validation", () => {
    test("validates complete configuration", () => {
      expect(config.validateConfiguration()).toBe(true);
    });

    test("validates environment suffix usage", () => {
      expect(config.hasEnvironmentSuffix()).toBe(true);
    });

    test("fails validation with missing resources", () => {
      const emptyConfig = new TerraformConfig();
      // Clear resources to test validation
      (emptyConfig as any).resources = [];
      expect(emptyConfig.validateConfiguration()).toBe(false);
    });
  });

  describe("Provider Configuration", () => {
    test("returns correct provider config", () => {
      const providerConfig = config.getProviderConfig();
      
      expect(providerConfig.terraform).toBeDefined();
      expect(providerConfig.terraform.required_version).toBe('>= 1.0');
      expect(providerConfig.terraform.backend).toBe('s3');
      
      expect(providerConfig.provider.aws).toBeDefined();
      expect(providerConfig.provider.aws.region).toBe('us-west-2');
      expect(providerConfig.provider.aws.default_tags.tags.Environment).toBe('development');
    });
  });

  describe("File Loading", () => {
    test("can load and parse Terraform file", () => {
      const testConfig = new TerraformConfig();
      testConfig.loadFromFile(tapStackPath);
      
      const resources = testConfig.getResources();
      expect(resources.length).toBeGreaterThan(0);
    });
  });
});