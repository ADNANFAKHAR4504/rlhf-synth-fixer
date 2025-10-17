// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Tests verify the structure and configuration of Terraform resources

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Infrastructure - tap_stack.tf", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  // ========================================
  // File Existence Tests
  // ========================================
  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      const exists = fs.existsSync(stackPath);
      if (!exists) {
        console.error(`[unit] Expected stack at: ${stackPath}`);
      }
      expect(exists).toBe(true);
    });

    test("file is not empty", () => {
      expect(content.length).toBeGreaterThan(0);
    });

    test("file contains valid Terraform HCL syntax markers", () => {
      expect(content).toMatch(/terraform\s*{/);
      expect(content).toMatch(/resource\s+"/);
    });
  });

  // ========================================
  // Provider Configuration Tests
  // ========================================
  describe("Provider Configuration", () => {
    test("declares provider 'aws' in tap_stack.tf", () => {
      expect(content).toMatch(/provider\s+"aws"\s*{/);
    });

    test("provider uses aws_region variable", () => {
      expect(content).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("terraform block requires AWS provider version >= 5.0", () => {
      expect(content).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test("terraform version is >= 1.4.0", () => {
      expect(content).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });
  });

  // ========================================
  // Variable Tests
  // ========================================
  describe("Variables", () => {
    test("declares aws_region variable", () => {
      expect(content).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("aws_region has default value us-east-1", () => {
      const awsRegionMatch = content.match(/variable\s+"aws_region"\s*{[^}]*default\s*=\s*"([^"]+)"/s);
      expect(awsRegionMatch).toBeTruthy();
      expect(awsRegionMatch![1]).toBe("us-east-1");
    });

    test("declares vpc_cidr variable", () => {
      expect(content).toMatch(/variable\s+"vpc_cidr"\s*{/);
    });

    test("vpc_cidr has default value 10.0.0.0/16", () => {
      const vpcCidrMatch = content.match(/variable\s+"vpc_cidr"\s*{[^}]*default\s*=\s*"([^"]+)"/s);
      expect(vpcCidrMatch).toBeTruthy();
      expect(vpcCidrMatch![1]).toBe("10.0.0.0/16");
    });

    test("declares office_cidr variable", () => {
      expect(content).toMatch(/variable\s+"office_cidr"\s*{/);
    });

    test("declares s3_backup_bucket variable", () => {
      expect(content).toMatch(/variable\s+"s3_backup_bucket"\s*{/);
    });

    test("declares approved_ami_id variable", () => {
      expect(content).toMatch(/variable\s+"approved_ami_id"\s*{/);
    });
  });

  // ========================================
  // Locals Tests
  // ========================================
  describe("Locals", () => {
    test("declares locals block", () => {
      expect(content).toMatch(/locals\s*{/);
    });

    test("defines azs local with two availability zones", () => {
      expect(content).toMatch(/azs\s*=\s*\[.*var\.aws_region.*a.*var\.aws_region.*b.*\]/s);
    });

    test("defines public_subnet_cidrs local", () => {
      expect(content).toMatch(/public_subnet_cidrs\s*=/);
    });

    test("defines private_subnet_cidrs local", () => {
      expect(content).toMatch(/private_subnet_cidrs\s*=/);
    });

    test("defines common_tags local with required tags", () => {
      expect(content).toMatch(/common_tags\s*=\s*{/);
      expect(content).toMatch(/Environment\s*=\s*"Production"/);
      expect(content).toMatch(/ManagedBy\s*=\s*"Terraform"/);
      expect(content).toMatch(/Owner\s*=\s*"Infrastructure-Team"/);
    });
  });

  // ========================================
  // VPC Tests
  // ========================================
  describe("VPC Configuration", () => {
    test("declares VPC resource named prod_vpc", () => {
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"prod_vpc"\s*{/);
    });

    test("VPC uses vpc_cidr variable", () => {
      const vpcBlock = content.match(/resource\s+"aws_vpc"\s+"prod_vpc"\s*{[^}]*}/s);
      expect(vpcBlock).toBeTruthy();
      expect(vpcBlock![0]).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    });

    test("VPC has DNS hostnames enabled", () => {
      const vpcBlock = content.match(/resource\s+"aws_vpc"\s+"prod_vpc"\s*{[^}]*}/s);
      expect(vpcBlock).toBeTruthy();
      expect(vpcBlock![0]).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test("VPC has DNS support enabled", () => {
      const vpcBlock = content.match(/resource\s+"aws_vpc"\s+"prod_vpc"\s*{[^}]*}/s);
      expect(vpcBlock).toBeTruthy();
      expect(vpcBlock![0]).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("VPC is named 'prod-VPC' with environment suffix", () => {
      const vpcBlock = content.match(/resource\s+"aws_vpc"\s+"prod_vpc"\s*{[\s\S]*?^}/m);
      expect(vpcBlock).toBeTruthy();
      expect(vpcBlock![0]).toMatch(/Name\s*=\s*"prod-VPC-\$\{var\.environment_suffix\}"/);
    });
  });

  // ========================================
  // Internet Gateway Tests
  // ========================================
  describe("Internet Gateway", () => {
    test("declares Internet Gateway resource", () => {
      expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"prod_igw"/);
    });

    test("IGW is attached to VPC", () => {
      const igwBlock = content.match(/resource\s+"aws_internet_gateway"\s+"prod_igw"\s*{[^}]*}/s);
      expect(igwBlock).toBeTruthy();
      expect(igwBlock![0]).toMatch(/vpc_id\s*=\s*aws_vpc\.prod_vpc\.id/);
    });

    test("IGW is named 'prod-IGW' with environment suffix", () => {
      const igwBlock = content.match(/resource\s+"aws_internet_gateway"\s+"prod_igw"\s*{[\s\S]*?^}/m);
      expect(igwBlock).toBeTruthy();
      expect(igwBlock![0]).toMatch(/Name\s*=\s*"prod-IGW-\$\{var\.environment_suffix\}"/);
    });
  });

  // ========================================
  // Subnet Tests
  // ========================================
  describe("Subnets", () => {
    test("declares public subnets resource", () => {
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public_subnets"/);
    });

    test("public subnets use count for multiple AZs", () => {
      const publicSubnetBlock = content.match(/resource\s+"aws_subnet"\s+"public_subnets"\s*{[^}]*count/s);
      expect(publicSubnetBlock).toBeTruthy();
    });

    test("public subnets have map_public_ip_on_launch enabled", () => {
      const publicSubnetBlock = content.match(/resource\s+"aws_subnet"\s+"public_subnets"\s*{[\s\S]*?^}/m);
      expect(publicSubnetBlock).toBeTruthy();
      expect(publicSubnetBlock![0]).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("public subnets are named with pattern 'prod-subnet-public-{az}'", () => {
      const publicSubnetBlock = content.match(/resource\s+"aws_subnet"\s+"public_subnets"\s*{[\s\S]*?^}/m);
      expect(publicSubnetBlock).toBeTruthy();
      expect(publicSubnetBlock![0]).toMatch(/Name\s*=\s*"prod-subnet-public-/);
    });

    test("declares private subnets resource", () => {
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private_subnets"/);
    });

    test("private subnets use count for multiple AZs", () => {
      const privateSubnetBlock = content.match(/resource\s+"aws_subnet"\s+"private_subnets"\s*{[^}]*count/s);
      expect(privateSubnetBlock).toBeTruthy();
    });

    test("private subnets are named with pattern 'prod-subnet-private-{az}'", () => {
      const privateSubnetBlock = content.match(/resource\s+"aws_subnet"\s+"private_subnets"\s*{[\s\S]*?^}/m);
      expect(privateSubnetBlock).toBeTruthy();
      expect(privateSubnetBlock![0]).toMatch(/Name\s*=\s*"prod-subnet-private-/);
    });
  });

  // ========================================
  // NAT Gateway Tests
  // ========================================
  describe("NAT Gateways", () => {
    test("declares Elastic IP resources for NAT", () => {
      expect(content).toMatch(/resource\s+"aws_eip"\s+"nat_eips"/);
    });

    test("EIPs use count for multiple AZs", () => {
      const eipBlock = content.match(/resource\s+"aws_eip"\s+"nat_eips"\s*{[^}]*count/s);
      expect(eipBlock).toBeTruthy();
    });

    test("EIPs have domain set to vpc", () => {
      const eipBlock = content.match(/resource\s+"aws_eip"\s+"nat_eips"\s*{[\s\S]*?^}/m);
      expect(eipBlock).toBeTruthy();
      expect(eipBlock![0]).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("declares NAT Gateway resources", () => {
      expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_gateways"/);
    });

    test("NAT Gateways use count for multiple AZs", () => {
      const natBlock = content.match(/resource\s+"aws_nat_gateway"\s+"nat_gateways"\s*{[^}]*count/s);
      expect(natBlock).toBeTruthy();
    });

    test("NAT Gateways are placed in public subnets", () => {
      const natBlock = content.match(/resource\s+"aws_nat_gateway"\s+"nat_gateways"\s*{[\s\S]*?^}/m);
      expect(natBlock).toBeTruthy();
      expect(natBlock![0]).toMatch(/subnet_id\s*=\s*aws_subnet\.public_subnets\[count\.index\]\.id/);
    });

    test("NAT Gateways depend on Internet Gateway", () => {
      const natBlock = content.match(/resource\s+"aws_nat_gateway"\s+"nat_gateways"\s*{[\s\S]*?^}/m);
      expect(natBlock).toBeTruthy();
      expect(natBlock![0]).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.prod_igw\]/);
    });
  });

  // ========================================
  // Route Table Tests
  // ========================================
  describe("Route Tables", () => {
    test("declares public route table", () => {
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"public_route_table"/);
    });

    test("public route table has route to Internet Gateway", () => {
      const publicRtBlock = content.match(/resource\s+"aws_route_table"\s+"public_route_table"\s*{[\s\S]*?^}/m);
      expect(publicRtBlock).toBeTruthy();
      expect(publicRtBlock![0]).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.prod_igw\.id/);
      expect(publicRtBlock![0]).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
    });

    test("declares public route table associations", () => {
      expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"public_associations"/);
    });

    test("declares private route tables", () => {
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"private_route_tables"/);
    });

    test("private route tables use count for multiple AZs", () => {
      const privateRtBlock = content.match(/resource\s+"aws_route_table"\s+"private_route_tables"\s*{[^}]*count/s);
      expect(privateRtBlock).toBeTruthy();
    });

    test("private route tables have routes to NAT Gateways", () => {
      const privateRtBlock = content.match(/resource\s+"aws_route_table"\s+"private_route_tables"\s*{[\s\S]*?^}/m);
      expect(privateRtBlock).toBeTruthy();
      expect(privateRtBlock![0]).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.nat_gateways\[count\.index\]\.id/);
    });

    test("declares private route table associations", () => {
      expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"private_associations"/);
    });
  });

  // ========================================
  // Security Group Tests
  // ========================================
  describe("Security Groups", () => {
    test("declares web server security group", () => {
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"web_server_sg"/);
    });

    test("web server SG allows SSH from office CIDR", () => {
      const webSgBlock = content.match(/resource\s+"aws_security_group"\s+"web_server_sg"\s*{[\s\S]*?^}/m);
      expect(webSgBlock).toBeTruthy();
      expect(webSgBlock![0]).toMatch(/from_port\s*=\s*22/);
      expect(webSgBlock![0]).toMatch(/to_port\s*=\s*22/);
      expect(webSgBlock![0]).toMatch(/var\.office_cidr/);
    });

    test("web server SG allows HTTP from anywhere", () => {
      const webSgBlock = content.match(/resource\s+"aws_security_group"\s+"web_server_sg"\s*{[\s\S]*?^}/m);
      expect(webSgBlock).toBeTruthy();
      expect(webSgBlock![0]).toMatch(/from_port\s*=\s*80/);
      expect(webSgBlock![0]).toMatch(/to_port\s*=\s*80/);
      expect(webSgBlock![0]).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test("web server SG has egress rule", () => {
      const webSgBlock = content.match(/resource\s+"aws_security_group"\s+"web_server_sg"\s*{[\s\S]*?^}/m);
      expect(webSgBlock).toBeTruthy();
      expect(webSgBlock![0]).toMatch(/egress\s*{/);
    });

    test("declares private instance security group", () => {
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"private_instance_sg"/);
    });

    test("private instance SG restricts outbound to HTTPS only", () => {
      const privateSgBlock = content.match(/resource\s+"aws_security_group"\s+"private_instance_sg"\s*{[\s\S]*?^}/m);
      expect(privateSgBlock).toBeTruthy();
      expect(privateSgBlock![0]).toMatch(/from_port\s*=\s*443/);
      expect(privateSgBlock![0]).toMatch(/to_port\s*=\s*443/);
      expect(privateSgBlock![0]).toMatch(/HTTPS only outbound/i);
    });

    test("private instance SG allows DNS resolution", () => {
      const privateSgBlock = content.match(/resource\s+"aws_security_group"\s+"private_instance_sg"\s*{[\s\S]*?^}/m);
      expect(privateSgBlock).toBeTruthy();
      expect(privateSgBlock![0]).toMatch(/from_port\s*=\s*53/);
      expect(privateSgBlock![0]).toMatch(/DNS/);
    });
  });

  // ========================================
  // IAM Tests
  // ========================================
  describe("IAM Resources", () => {
    test("declares EC2 IAM role", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
    });

    test("EC2 role has EC2 service as principal", () => {
      const ec2RoleBlock = content.match(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{[\s\S]*?^}/m);
      expect(ec2RoleBlock).toBeTruthy();
      expect(ec2RoleBlock![0]).toMatch(/Service.*ec2\.amazonaws\.com/);
    });

    test("declares S3 read-only IAM policy", () => {
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"s3_readonly_policy"/);
    });

    test("S3 policy allows read operations", () => {
      const s3PolicyBlock = content.match(/resource\s+"aws_iam_policy"\s+"s3_readonly_policy"\s*{[\s\S]*?^}/m);
      expect(s3PolicyBlock).toBeTruthy();
      expect(s3PolicyBlock![0]).toMatch(/s3:GetObject/);
      expect(s3PolicyBlock![0]).toMatch(/s3:ListBucket/);
    });

    test("S3 policy references s3_backup_bucket variable", () => {
      const s3PolicyBlock = content.match(/resource\s+"aws_iam_policy"\s+"s3_readonly_policy"\s*{[\s\S]*?^}/m);
      expect(s3PolicyBlock).toBeTruthy();
      expect(s3PolicyBlock![0]).toMatch(/var\.s3_backup_bucket/);
    });

    test("declares IAM role policy attachment", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_s3_attachment"/);
    });

    test("declares EC2 instance profile", () => {
      expect(content).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
    });

    test("instance profile references EC2 role", () => {
      const profileBlock = content.match(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"\s*{[\s\S]*?^}/m);
      expect(profileBlock).toBeTruthy();
      expect(profileBlock![0]).toMatch(/role\s*=\s*aws_iam_role\.ec2_role\.name/);
    });
  });

  // ========================================
  // VPC Flow Logs Tests
  // ========================================
  describe("VPC Flow Logs", () => {
    test("declares CloudWatch log group for VPC flow logs", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"/);
    });

    test("log group has retention period", () => {
      const logGroupBlock = content.match(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"\s*{[\s\S]*?^}/m);
      expect(logGroupBlock).toBeTruthy();
      expect(logGroupBlock![0]).toMatch(/retention_in_days\s*=\s*30/);
    });

    test("declares IAM role for VPC flow logs", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"vpc_flow_log_role"/);
    });

    test("VPC flow log role has vpc-flow-logs service as principal", () => {
      const flowLogRoleBlock = content.match(/resource\s+"aws_iam_role"\s+"vpc_flow_log_role"\s*{[\s\S]*?^}/m);
      expect(flowLogRoleBlock).toBeTruthy();
      expect(flowLogRoleBlock![0]).toMatch(/vpc-flow-logs\.amazonaws\.com/);
    });

    test("declares VPC flow log resource", () => {
      expect(content).toMatch(/resource\s+"aws_flow_log"\s+"vpc_flow_log"/);
    });

    test("VPC flow log captures ALL traffic", () => {
      const flowLogBlock = content.match(/resource\s+"aws_flow_log"\s+"vpc_flow_log"\s*{[\s\S]*?^}/m);
      expect(flowLogBlock).toBeTruthy();
      expect(flowLogBlock![0]).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test("VPC flow log references VPC", () => {
      const flowLogBlock = content.match(/resource\s+"aws_flow_log"\s+"vpc_flow_log"\s*{[\s\S]*?^}/m);
      expect(flowLogBlock).toBeTruthy();
      expect(flowLogBlock![0]).toMatch(/vpc_id\s*=\s*aws_vpc\.prod_vpc\.id/);
    });
  });

  // ========================================
  // CloudWatch Alarm Tests
  // ========================================
  describe("CloudWatch Monitoring", () => {
    test("declares CloudWatch log metric filter", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"ddos_detection"/);
    });

    test("metric filter is for DDoS detection", () => {
      const metricFilterBlock = content.match(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"ddos_detection"\s*{[\s\S]*?^}/m);
      expect(metricFilterBlock).toBeTruthy();
      expect(metricFilterBlock![0]).toMatch(/ddos/i);
    });

    test("declares CloudWatch alarm", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ddos_alarm"/);
    });

    test("alarm monitors for high packet count", () => {
      const alarmBlock = content.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ddos_alarm"\s*{[\s\S]*?^}/m);
      expect(alarmBlock).toBeTruthy();
      expect(alarmBlock![0]).toMatch(/metric_name\s*=\s*"HighPacketCount"/);
    });

    test("alarm has threshold configured", () => {
      const alarmBlock = content.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ddos_alarm"\s*{[\s\S]*?^}/m);
      expect(alarmBlock).toBeTruthy();
      expect(alarmBlock![0]).toMatch(/threshold\s*=\s*"100"/);
    });
  });

  // ========================================
  // VPN Gateway Tests
  // ========================================
  describe("VPN Configuration", () => {
    test("declares VPN Gateway", () => {
      expect(content).toMatch(/resource\s+"aws_vpn_gateway"\s+"prod_vpn_gateway"/);
    });

    test("VPN Gateway is attached to VPC", () => {
      const vpnGwBlock = content.match(/resource\s+"aws_vpn_gateway"\s+"prod_vpn_gateway"\s*{[\s\S]*?^}/m);
      expect(vpnGwBlock).toBeTruthy();
      expect(vpnGwBlock![0]).toMatch(/vpc_id\s*=\s*aws_vpc\.prod_vpc\.id/);
    });

    test("declares VPN gateway route propagation for public route table", () => {
      expect(content).toMatch(/resource\s+"aws_vpn_gateway_route_propagation"\s+"vpn_propagation_public"/);
    });

    test("declares VPN gateway route propagation for private route tables", () => {
      expect(content).toMatch(/resource\s+"aws_vpn_gateway_route_propagation"\s+"vpn_propagation_private"/);
    });

    test("declares Customer Gateway", () => {
      expect(content).toMatch(/resource\s+"aws_customer_gateway"\s+"main"/);
    });

    test("Customer Gateway has BGP ASN", () => {
      const cgwBlock = content.match(/resource\s+"aws_customer_gateway"\s+"main"\s*{[\s\S]*?^}/m);
      expect(cgwBlock).toBeTruthy();
      expect(cgwBlock![0]).toMatch(/bgp_asn\s*=\s*65000/);
    });

    test("declares VPN Connection", () => {
      expect(content).toMatch(/resource\s+"aws_vpn_connection"\s+"main"/);
    });

    test("VPN Connection uses ipsec.1 type", () => {
      const vpnConnBlock = content.match(/resource\s+"aws_vpn_connection"\s+"main"\s*{[\s\S]*?^}/m);
      expect(vpnConnBlock).toBeTruthy();
      expect(vpnConnBlock![0]).toMatch(/type\s*=\s*"ipsec\.1"/);
    });

    test("declares VPN Connection Route", () => {
      expect(content).toMatch(/resource\s+"aws_vpn_connection_route"\s+"office"/);
    });
  });

  // ========================================
  // Outputs Tests
  // ========================================
  describe("Outputs", () => {
    test("declares vpc_id output", () => {
      expect(content).toMatch(/output\s+"vpc_id"\s*{/);
    });

    test("declares public_subnet_ids output", () => {
      expect(content).toMatch(/output\s+"public_subnet_ids"\s*{/);
    });

    test("declares private_subnet_ids output", () => {
      expect(content).toMatch(/output\s+"private_subnet_ids"\s*{/);
    });

    test("declares nat_gateway_ids output", () => {
      expect(content).toMatch(/output\s+"nat_gateway_ids"\s*{/);
    });

    test("declares web_server_sg_id output", () => {
      expect(content).toMatch(/output\s+"web_server_sg_id"\s*{/);
    });

    test("declares private_instance_sg_id output", () => {
      expect(content).toMatch(/output\s+"private_instance_sg_id"\s*{/);
    });

    test("declares ec2_instance_profile_name output", () => {
      expect(content).toMatch(/output\s+"ec2_instance_profile_name"\s*{/);
    });

    test("declares vpn_gateway_id output", () => {
      expect(content).toMatch(/output\s+"vpn_gateway_id"\s*{/);
    });

    test("declares flow_log_id output", () => {
      expect(content).toMatch(/output\s+"flow_log_id"\s*{/);
    });

    test("all outputs have descriptions", () => {
      const outputs = content.match(/output\s+"[^"]+"\s*{[^}]*}/gs);
      expect(outputs).toBeTruthy();
      outputs!.forEach(output => {
        expect(output).toMatch(/description\s*=/);
      });
    });
  });

  // ========================================
  // Compliance and Best Practices Tests
  // ========================================
  describe("Compliance and Best Practices", () => {
    test("resources follow naming convention with 'prod-' prefix", () => {
      expect(content).toMatch(/Name\s*=\s*"prod-/);
    });

    test("all major resources have tags", () => {
      const resources = [
        'aws_vpc',
        'aws_internet_gateway',
        'aws_subnet',
        'aws_nat_gateway',
        'aws_security_group',
        'aws_iam_role',
        'aws_vpn_gateway'
      ];
      
      resources.forEach(resourceType => {
        const resourceMatch = content.match(new RegExp(`resource\\s+"${resourceType}"[\\s\\S]*?tags\\s*=`, 'm'));
        expect(resourceMatch).toBeTruthy();
      });
    });

    test("uses merge function for tags", () => {
      expect(content).toMatch(/merge\s*\(\s*local\.common_tags/);
    });

    test("no hardcoded regions in resource definitions", () => {
      const resourceBlocks = content.match(/resource\s+"[^"]+"\s+"[^"]+"\s*{[\s\S]*?^}/gm);
      expect(resourceBlocks).toBeTruthy();
      
      resourceBlocks!.forEach(block => {
        // Should not have hardcoded regions like us-east-1 except in variable defaults
        if (!block.includes('variable')) {
          const hardcodedRegion = block.match(/=\s*"us-(east|west|central)-\d/);
          if (hardcodedRegion && !block.includes('default')) {
            fail(`Found hardcoded region in resource: ${hardcodedRegion[0]}`);
          }
        }
      });
    });

    test("security groups use principle of least privilege", () => {
      // Web server SG should only allow specific ports
      const webSgBlock = content.match(/resource\s+"aws_security_group"\s+"web_server_sg"\s*{[\s\S]*?^}/m);
      expect(webSgBlock).toBeTruthy();
      // Should have specific port rules, not 0-65535 for ingress from internet
      expect(webSgBlock![0]).toMatch(/from_port\s*=\s*22/);
      expect(webSgBlock![0]).toMatch(/from_port\s*=\s*80/);
      
      // Private SG should restrict outbound
      const privateSgBlock = content.match(/resource\s+"aws_security_group"\s+"private_instance_sg"\s*{[\s\S]*?^}/m);
      expect(privateSgBlock).toBeTruthy();
      expect(privateSgBlock![0]).toMatch(/from_port\s*=\s*443/);
    });

    test("IAM policies use specific actions, not wildcards", () => {
      const s3PolicyBlock = content.match(/resource\s+"aws_iam_policy"\s+"s3_readonly_policy"\s*{[\s\S]*?^}/m);
      expect(s3PolicyBlock).toBeTruthy();
      // Should have specific actions
      expect(s3PolicyBlock![0]).toMatch(/s3:GetObject/);
      expect(s3PolicyBlock![0]).toMatch(/s3:ListBucket/);
      // Should not use s3:* for read-only access
      expect(s3PolicyBlock![0]).not.toMatch(/"s3:\*"/);
    });

    test("uses count for multi-AZ resources", () => {
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public_subnets"\s*{\s*count/s);
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private_subnets"\s*{\s*count/s);
      expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"nat_gateways"\s*{\s*count/s);
    });

    test("NAT Gateways have explicit dependency on Internet Gateway", () => {
      const natBlock = content.match(/resource\s+"aws_nat_gateway"\s+"nat_gateways"\s*{[\s\S]*?^}/m);
      expect(natBlock).toBeTruthy();
      expect(natBlock![0]).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.prod_igw\]/);
    });

    test("VPC Flow Logs are enabled", () => {
      expect(content).toMatch(/resource\s+"aws_flow_log"\s+"vpc_flow_log"/);
    });

    test("CloudWatch monitoring is configured", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
    });
  });

  // ========================================
  // Resource Count Validation
  // ========================================
  describe("Resource Count Validation", () => {
    test("has at least 25 resource blocks", () => {
      const resourceMatches = content.match(/resource\s+"/g);
      expect(resourceMatches).toBeTruthy();
      expect(resourceMatches!.length).toBeGreaterThanOrEqual(25);
    });

    test("has expected number of output blocks", () => {
      const outputMatches = content.match(/output\s+"/g);
      expect(outputMatches).toBeTruthy();
      expect(outputMatches!.length).toBeGreaterThanOrEqual(9);
    });

    test("declares multiple security group rules", () => {
      const ingressMatches = content.match(/ingress\s*{/g);
      const egressMatches = content.match(/egress\s*{/g);
      expect(ingressMatches).toBeTruthy();
      expect(egressMatches).toBeTruthy();
      expect(ingressMatches!.length).toBeGreaterThanOrEqual(3);
      expect(egressMatches!.length).toBeGreaterThanOrEqual(4);
    });
  });
});
