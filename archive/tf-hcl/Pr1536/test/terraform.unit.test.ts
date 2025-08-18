// Unit tests for Terraform Infrastructure
import fs from "fs";
import path from "path";

// Helper function to parse HCL-like content
function parseHCLContent(content: string): {
  resources: string[];
  variables: string[];
  outputs: string[];
  data: string[];
} {
  const resources: string[] = [];
  const variables: string[] = [];
  const outputs: string[] = [];
  const data: string[] = [];

  // Match resource blocks
  const resourceMatches = content.match(/resource\s+"([^"]+)"\s+"([^"]+)"/g);
  if (resourceMatches) {
    resourceMatches.forEach(match => {
      const parts = match.match(/resource\s+"([^"]+)"\s+"([^"]+)"/);
      if (parts) {
        resources.push(`${parts[1]}.${parts[2]}`);
      }
    });
  }

  // Match variable blocks
  const varMatches = content.match(/variable\s+"([^"]+)"/g);
  if (varMatches) {
    varMatches.forEach(match => {
      const parts = match.match(/variable\s+"([^"]+)"/);
      if (parts) {
        variables.push(parts[1]);
      }
    });
  }

  // Match output blocks
  const outputMatches = content.match(/output\s+"([^"]+)"/g);
  if (outputMatches) {
    outputMatches.forEach(match => {
      const parts = match.match(/output\s+"([^"]+)"/);
      if (parts) {
        outputs.push(parts[1]);
      }
    });
  }

  // Match data blocks
  const dataMatches = content.match(/data\s+"([^"]+)"\s+"([^"]+)"/g);
  if (dataMatches) {
    dataMatches.forEach(match => {
      const parts = match.match(/data\s+"([^"]+)"\s+"([^"]+)"/);
      if (parts) {
        data.push(`${parts[1]}.${parts[2]}`);
      }
    });
  }

  return { resources, variables, outputs, data };
}

describe("Terraform Infrastructure Unit Tests", () => {
  const libPath = path.resolve(__dirname, "../lib");
  const providerPath = path.join(libPath, "provider.tf");
  const variablesPath = path.join(libPath, "variables.tf");
  const tapStackPath = path.join(libPath, "tap_stack.tf");
  const outputsPath = path.join(libPath, "outputs.tf");

  describe("File Structure", () => {
    test("provider.tf exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("variables.tf exists", () => {
      expect(fs.existsSync(variablesPath)).toBe(true);
    });

    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(tapStackPath)).toBe(true);
    });

    test("outputs.tf exists", () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
    });
  });

  describe("Provider Configuration", () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(providerPath, "utf8");
    });

    test("declares AWS provider", () => {
      expect(providerContent).toMatch(/aws\s*=\s*{/);
    });

    test("declares TLS provider", () => {
      expect(providerContent).toMatch(/tls\s*=\s*{/);
    });

    test("specifies Terraform version requirement", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*".*"/);
    });

    test("configures S3 backend", () => {
      expect(providerContent).toMatch(/backend\s+"s3"/);
    });

    test("AWS provider version constraint", () => {
      expect(providerContent).toMatch(/version\s*=\s*">= 5\.0"/);
    });

    test("TLS provider version constraint", () => {
      expect(providerContent).toMatch(/version\s*=\s*">= 4\.0"/);
    });
  });

  describe("Variables Configuration", () => {
    let variablesContent: string;
    let parsed: ReturnType<typeof parseHCLContent>;

    beforeAll(() => {
      variablesContent = fs.readFileSync(variablesPath, "utf8");
      parsed = parseHCLContent(variablesContent);
    });

    test("declares required variables", () => {
      const requiredVars = [
        "aws_region",
        "project_name",
        "environment",
        "vpc_cidr",
        "key_pair_name",
        "instance_type",
        "allowed_ssh_cidr",
        "environment_suffix"
      ];
      requiredVars.forEach(varName => {
        expect(parsed.variables).toContain(varName);
      });
    });

    test("aws_region has correct default", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"[\s\S]*?default\s*=\s*"us-east-1"/);
    });

    test("instance_type has correct default", () => {
      expect(variablesContent).toMatch(/variable\s+"instance_type"[\s\S]*?default\s*=\s*"t3\.medium"/);
    });

    test("vpc_cidr has correct default", () => {
      expect(variablesContent).toMatch(/variable\s+"vpc_cidr"[\s\S]*?default\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("environment_suffix variable exists", () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"/);
    });

    test("variables have descriptions", () => {
      const varBlocks = variablesContent.match(/variable\s+"[^"]+"\s*{[^}]+}/g) || [];
      varBlocks.forEach(block => {
        expect(block).toMatch(/description\s*=/);
      });
    });

    test("variables have types defined", () => {
      const varBlocks = variablesContent.match(/variable\s+"[^"]+"\s*{[^}]+}/g) || [];
      varBlocks.forEach(block => {
        expect(block).toMatch(/type\s*=/);
      });
    });
  });

  describe("Infrastructure Resources", () => {
    let tapStackContent: string;
    let parsed: ReturnType<typeof parseHCLContent>;

    beforeAll(() => {
      tapStackContent = fs.readFileSync(tapStackPath, "utf8");
      parsed = parseHCLContent(tapStackContent);
    });

    describe("VPC Configuration", () => {
      test("creates VPC resource", () => {
        expect(parsed.resources).toContain("aws_vpc.main");
      });

      test("VPC has DNS support enabled", () => {
        expect(tapStackContent).toMatch(/enable_dns_support\s*=\s*true/);
      });

      test("VPC has DNS hostnames enabled", () => {
        expect(tapStackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      });

      test("creates Internet Gateway", () => {
        expect(parsed.resources).toContain("aws_internet_gateway.main");
      });

      test("creates NAT Gateway", () => {
        expect(parsed.resources).toContain("aws_nat_gateway.main");
      });

      test("creates Elastic IP for NAT", () => {
        expect(parsed.resources).toContain("aws_eip.nat");
      });
    });

    describe("Subnet Configuration", () => {
      test("creates public subnets", () => {
        expect(parsed.resources).toContain("aws_subnet.public");
      });

      test("creates private subnet", () => {
        expect(parsed.resources).toContain("aws_subnet.private");
      });

      test("public subnets have map_public_ip_on_launch", () => {
        expect(tapStackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      });

      test("subnets span multiple AZs", () => {
        expect(tapStackContent).toMatch(/count\s*=\s*2/);
      });

      test("uses data source for availability zones", () => {
        expect(parsed.data).toContain("aws_availability_zones.available");
      });
    });

    describe("Route Tables", () => {
      test("creates public route table", () => {
        expect(parsed.resources).toContain("aws_route_table.public");
      });

      test("creates private route table", () => {
        expect(parsed.resources).toContain("aws_route_table.private");
      });

      test("creates route table associations for public subnets", () => {
        expect(parsed.resources).toContain("aws_route_table_association.public");
      });

      test("creates route table association for private subnet", () => {
        expect(parsed.resources).toContain("aws_route_table_association.private");
      });
    });

    describe("EC2 Configuration", () => {
      test("creates EC2 instances in public subnets", () => {
        expect(parsed.resources).toContain("aws_instance.public");
      });

      test("creates EC2 instance in private subnet", () => {
        expect(parsed.resources).toContain("aws_instance.private");
      });

      test("uses t3.medium instance type", () => {
        expect(tapStackContent).toMatch(/instance_type\s*=\s*var\.instance_type/);
      });

      test("uses data source for AMI", () => {
        expect(parsed.data).toContain("aws_ami.amazon_linux");
      });

      test("EC2 instances have encrypted root volumes", () => {
        expect(tapStackContent).toMatch(/encrypted\s*=\s*true/);
      });

      test("EC2 instances use gp3 volumes", () => {
        expect(tapStackContent).toMatch(/volume_type\s*=\s*"gp3"/);
      });
    });

    describe("Security Configuration", () => {
      test("creates security group for EC2", () => {
        expect(parsed.resources).toContain("aws_security_group.ec2");
      });

      test("security group allows SSH (port 22)", () => {
        expect(tapStackContent).toMatch(/from_port\s*=\s*22/);
      });

      test("security group allows HTTP (port 80)", () => {
        expect(tapStackContent).toMatch(/from_port\s*=\s*80/);
      });

      test("security group allows HTTPS (port 443)", () => {
        expect(tapStackContent).toMatch(/from_port\s*=\s*443/);
      });

      test("creates TLS private key", () => {
        expect(parsed.resources).toContain("tls_private_key.main");
      });

      test("creates AWS key pair", () => {
        expect(parsed.resources).toContain("aws_key_pair.main");
      });

      test("TLS key uses RSA algorithm", () => {
        expect(tapStackContent).toMatch(/algorithm\s*=\s*"RSA"/);
      });

      test("TLS key has 4096 bits", () => {
        expect(tapStackContent).toMatch(/rsa_bits\s*=\s*4096/);
      });
    });

    describe("Resource Naming", () => {
      test("resources use environment_suffix in names", () => {
        const namePatterns = [
          /\$\{var\.project_name\}-\$\{var\.environment_suffix\}/,
        ];
        namePatterns.forEach(pattern => {
          expect(tapStackContent).toMatch(pattern);
        });
      });
    });

    describe("Resource Dependencies", () => {
      test("NAT Gateway depends on Internet Gateway", () => {
        const natBlock = tapStackContent.match(/resource\s+"aws_nat_gateway"\s+"main"[\s\S]*?depends_on[\s\S]*?\]/);
        expect(natBlock).toBeTruthy();
        if (natBlock) {
          expect(natBlock[0]).toMatch(/aws_internet_gateway\.main/);
        }
      });

      test("EIP depends on Internet Gateway", () => {
        const eipBlock = tapStackContent.match(/resource\s+"aws_eip"\s+"nat"[\s\S]*?depends_on[\s\S]*?\]/);
        expect(eipBlock).toBeTruthy();
        if (eipBlock) {
          expect(eipBlock[0]).toMatch(/aws_internet_gateway\.main/);
        }
      });
    });
  });

  describe("Outputs Configuration", () => {
    let outputsContent: string;
    let parsed: ReturnType<typeof parseHCLContent>;

    beforeAll(() => {
      outputsContent = fs.readFileSync(outputsPath, "utf8");
      parsed = parseHCLContent(outputsContent);
    });

    test("outputs VPC ID", () => {
      expect(parsed.outputs).toContain("vpc_id");
    });

    test("outputs public subnet IDs", () => {
      expect(parsed.outputs).toContain("public_subnet_ids");
    });

    test("outputs private subnet ID", () => {
      expect(parsed.outputs).toContain("private_subnet_id");
    });

    test("outputs EC2 instance IDs", () => {
      expect(parsed.outputs).toContain("public_instance_ids");
      expect(parsed.outputs).toContain("private_instance_id");
    });

    test("outputs public IP addresses", () => {
      expect(parsed.outputs).toContain("public_instance_public_ips");
    });

    test("outputs private IP addresses", () => {
      expect(parsed.outputs).toContain("public_instance_private_ips");
      expect(parsed.outputs).toContain("private_instance_private_ip");
    });

    test("outputs security group ID", () => {
      expect(parsed.outputs).toContain("security_group_id");
    });

    test("outputs NAT Gateway ID", () => {
      expect(parsed.outputs).toContain("nat_gateway_id");
    });

    test("outputs Internet Gateway ID", () => {
      expect(parsed.outputs).toContain("internet_gateway_id");
    });

    test("outputs SSH connection commands", () => {
      expect(parsed.outputs).toContain("ssh_connection_commands");
    });

    test("outputs private key PEM", () => {
      expect(parsed.outputs).toContain("private_key_pem");
    });

    test("private key output is marked sensitive", () => {
      expect(outputsContent).toMatch(/output\s+"private_key_pem"[\s\S]*?sensitive\s*=\s*true/);
    });

    test("outputs have descriptions", () => {
      const outputBlocks = outputsContent.match(/output\s+"[^"]+"\s*{[^}]+}/g) || [];
      outputBlocks.forEach(block => {
        expect(block).toMatch(/description\s*=/);
      });
    });
  });

  describe("Best Practices", () => {
    let allContent: string;

    beforeAll(() => {
      allContent = [
        fs.readFileSync(providerPath, "utf8"),
        fs.readFileSync(variablesPath, "utf8"),
        fs.readFileSync(tapStackPath, "utf8"),
        fs.readFileSync(outputsPath, "utf8")
      ].join("\n");
    });

    test("no hardcoded credentials", () => {
      expect(allContent).not.toMatch(/aws_access_key/);
      expect(allContent).not.toMatch(/aws_secret_key/);
    });

    test("uses variables for configuration", () => {
      expect(allContent).toMatch(/var\./);
    });

    test("resources are tagged", () => {
      expect(allContent).toMatch(/tags\s*=\s*{/);
    });

    test("tags include Environment", () => {
      expect(allContent).toMatch(/Environment\s*=\s*var\.environment/);
    });

    test("tags include ManagedBy", () => {
      expect(allContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
    });

    test("security groups use name_prefix for uniqueness", () => {
      expect(allContent).toMatch(/name_prefix\s*=/);
    });

    test("lifecycle rules for security groups", () => {
      expect(allContent).toMatch(/lifecycle\s*{[\s\S]*?create_before_destroy\s*=\s*true/);
    });
  });
});