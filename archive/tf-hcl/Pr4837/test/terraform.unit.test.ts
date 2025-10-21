// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Tests verify the structure and configuration of Terraform resources for web application infrastructure

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Web Application Infrastructure - tap_stack.tf", () => {
  let content: string;
  let providerContent: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
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

    test("provider.tf exists", () => {
      const exists = fs.existsSync(providerPath);
      if (!exists) {
        console.error(`[unit] Expected provider config at: ${providerPath}`);
      }
      expect(exists).toBe(true);
    });

    test("tap_stack.tf is not empty", () => {
      expect(content.length).toBeGreaterThan(0);
    });

    test("provider.tf is not empty", () => {
      expect(providerContent.length).toBeGreaterThan(0);
    });

    test("tap_stack.tf contains valid Terraform HCL syntax markers", () => {
      expect(content).toMatch(/resource\s+"/);
      expect(content).toMatch(/variable\s+"/);
    });

    test("provider.tf contains valid Terraform HCL syntax markers", () => {
      expect(providerContent).toMatch(/terraform\s*{/);
      expect(providerContent).toMatch(/provider\s+"/);
    });
  });

  // ========================================
  // Provider Configuration Tests (from provider.tf)
  // ========================================
  describe("Provider Configuration", () => {
    test("declares terraform block with required version >= 1.4.0", () => {
      expect(providerContent).toMatch(/terraform\s*{[\s\S]*?required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test("declares provider 'aws' in provider.tf", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("provider uses aws_region variable", () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("terraform block requires AWS provider version >= 5.0", () => {
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test("AWS provider source is hashicorp/aws", () => {
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    });

    test("has S3 backend configuration", () => {
      expect(providerContent).toMatch(/backend\s+"s3"/);
    });
  });

  // ========================================
  // Data Sources Tests
  // ========================================
  describe("Data Sources", () => {
    test("declares aws_ami data source for Amazon Linux", () => {
      expect(content).toMatch(/data\s+"aws_ami"\s+"amazon_linux"\s*{/);
    });

    test("AMI data source filters for Amazon Linux 2", () => {
      const amiBlock = content.match(/data\s+"aws_ami"\s+"amazon_linux"\s*{[\s\S]*?^}/m);
      expect(amiBlock).toBeTruthy();
      expect(amiBlock![0]).toMatch(/amzn2-ami-hvm-.*-x86_64-gp2/);
      expect(amiBlock![0]).toMatch(/most_recent\s*=\s*true/);
      expect(amiBlock![0]).toMatch(/owners\s*=\s*\["amazon"\]/);
    });

    test("declares aws_availability_zones data source", () => {
      expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
    });

    test("availability zones filter for available state", () => {
      const azBlock = content.match(/data\s+"aws_availability_zones"\s+"available"\s*{[\s\S]*?}/);
      expect(azBlock).toBeTruthy();
      expect(azBlock![0]).toMatch(/state\s*=\s*"available"/);
    });
  });

  // ========================================
  // Variable Tests
  // ========================================
  describe("Variables", () => {
    test("declares aws_region variable with default us-east-1", () => {
      expect(content).toMatch(/variable\s+"aws_region"\s*{/);
      const awsRegionMatch = content.match(/variable\s+"aws_region"\s*{[^}]*default\s*=\s*"([^"]+)"/s);
      expect(awsRegionMatch).toBeTruthy();
      expect(awsRegionMatch![1]).toBe("us-east-1");
    });

    test("declares vpc_cidr variable with default 10.0.0.0/16", () => {
      expect(content).toMatch(/variable\s+"vpc_cidr"\s*{/);
      const vpcCidrMatch = content.match(/variable\s+"vpc_cidr"\s*{[^}]*default\s*=\s*"([^"]+)"/s);
      expect(vpcCidrMatch).toBeTruthy();
      expect(vpcCidrMatch![1]).toBe("10.0.0.0/16");
    });

    test("declares environment_suffix variable", () => {
      expect(content).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares instance_type variable with default t3.micro", () => {
      expect(content).toMatch(/variable\s+"instance_type"\s*{/);
      const instanceTypeMatch = content.match(/variable\s+"instance_type"\s*{[^}]*default\s*=\s*"([^"]+)"/s);
      expect(instanceTypeMatch).toBeTruthy();
      expect(instanceTypeMatch![1]).toBe("t3.micro");
    });

    test("declares Auto Scaling Group size variables", () => {
      expect(content).toMatch(/variable\s+"min_size"\s*{/);
      expect(content).toMatch(/variable\s+"max_size"\s*{/);
      expect(content).toMatch(/variable\s+"desired_capacity"\s*{/);
    });

    test("declares database configuration variables", () => {
      expect(content).toMatch(/variable\s+"db_instance_class"\s*{/);
      expect(content).toMatch(/variable\s+"db_name"\s*{/);
      expect(content).toMatch(/variable\s+"db_username"\s*{/);
    });

    test("declares SSL configuration variables", () => {
      expect(content).toMatch(/variable\s+"enable_https"\s*{/);
      expect(content).toMatch(/variable\s+"ssl_certificate_arn"\s*{/);
      expect(content).toMatch(/variable\s+"domain_name"\s*{/);
    });

    test("HTTPS is disabled by default", () => {
      const httpsMatch = content.match(/variable\s+"enable_https"\s*{[^}]*default\s*=\s*(false|true)/s);
      expect(httpsMatch).toBeTruthy();
      expect(httpsMatch![1]).toBe("false");
    });
  });

  // ========================================
  // Locals Tests
  // ========================================
  describe("Locals", () => {
    test("declares locals block", () => {
      expect(content).toMatch(/locals\s*{/);
    });

    test("defines azs using dynamic availability zones", () => {
      expect(content).toMatch(/azs\s*=\s*slice\(data\.aws_availability_zones\.available\.names,\s*0,\s*2\)/);
    });

    test("defines public_subnet_cidrs local", () => {
      expect(content).toMatch(/public_subnet_cidrs\s*=\s*\[.*10\.0\.1\.0\/24.*10\.0\.2\.0\/24.*\]/);
    });

    test("defines private_subnet_cidrs local", () => {
      expect(content).toMatch(/private_subnet_cidrs\s*=\s*\[.*10\.0\.10\.0\/24.*10\.0\.11\.0\/24.*\]/);
    });

    test("defines common_tags local with required tags", () => {
      expect(content).toMatch(/common_tags\s*=\s*{/);
      expect(content).toMatch(/Project\s*=\s*"WebAppDeployment"/);
      expect(content).toMatch(/Environment\s*=\s*"Production"/);
      expect(content).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });

    test("defines certificate_arn local for SSL handling", () => {
      expect(content).toMatch(/certificate_arn\s*=/);
    });
  });

  // ========================================
  // Security Resources Tests (Passwords & Secrets)
  // ========================================
  describe("Secrets Management", () => {
    test("declares random_password resource for database", () => {
      expect(content).toMatch(/resource\s+"random_password"\s+"db_password"\s*{/);
    });

    test("random password has appropriate length and complexity", () => {
      const passwordBlock = content.match(/resource\s+"random_password"\s+"db_password"\s*{[\s\S]*?^}/m);
      expect(passwordBlock).toBeTruthy();
      expect(passwordBlock![0]).toMatch(/length\s*=\s*16/);
      expect(passwordBlock![0]).toMatch(/special\s*=\s*true/);
    });

    test("declares secrets manager secret for database password", () => {
      expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"db_password"\s*{/);
    });

    test("declares secrets manager secret version", () => {
      expect(content).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"db_password"\s*{/);
    });
  });

  // ========================================
  // VPC Tests
  // ========================================
  describe("VPC Configuration", () => {
    test("declares VPC resource named main", () => {
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    });

    test("VPC uses vpc_cidr variable", () => {
      const vpcBlock = content.match(/resource\s+"aws_vpc"\s+"main"\s*{[^}]*}/s);
      expect(vpcBlock).toBeTruthy();
      expect(vpcBlock![0]).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    });

    test("VPC has DNS hostnames and support enabled", () => {
      const vpcBlock = content.match(/resource\s+"aws_vpc"\s+"main"\s*{[^}]*}/s);
      expect(vpcBlock).toBeTruthy();
      expect(vpcBlock![0]).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(vpcBlock![0]).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("VPC is named with webapp prefix and environment suffix", () => {
      const vpcBlock = content.match(/resource\s+"aws_vpc"\s+"main"\s*{[\s\S]*?^}/m);
      expect(vpcBlock).toBeTruthy();
      expect(vpcBlock![0]).toMatch(/Name\s*=\s*"webapp-vpc\$\{var\.environment_suffix\}"/);
    });
  });

  // ========================================
  // Internet Gateway Tests
  // ========================================
  describe("Internet Gateway", () => {
    test("declares Internet Gateway resource", () => {
      expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test("IGW is attached to VPC", () => {
      const igwBlock = content.match(/resource\s+"aws_internet_gateway"\s+"main"\s*{[^}]*}/s);
      expect(igwBlock).toBeTruthy();
      expect(igwBlock![0]).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("IGW uses consistent naming pattern", () => {
      const igwBlock = content.match(/resource\s+"aws_internet_gateway"\s+"main"\s*{[\s\S]*?^}/m);
      expect(igwBlock).toBeTruthy();
      expect(igwBlock![0]).toMatch(/Name\s*=\s*"webapp-igw\$\{var\.environment_suffix\}"/);
    });
  });

  // ========================================
  // Subnet Tests
  // ========================================
  describe("Subnets", () => {
    test("declares public subnets resource", () => {
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    });

    test("public subnets use count for multiple AZs", () => {
      const publicSubnetBlock = content.match(/resource\s+"aws_subnet"\s+"public"\s*{[^}]*count/s);
      expect(publicSubnetBlock).toBeTruthy();
      expect(publicSubnetBlock![0]).toMatch(/count\s*=\s*length\(local\.azs\)/);
    });

    test("public subnets have map_public_ip_on_launch enabled", () => {
      const publicSubnetBlock = content.match(/resource\s+"aws_subnet"\s+"public"\s*{[\s\S]*?^}/m);
      expect(publicSubnetBlock).toBeTruthy();
      expect(publicSubnetBlock![0]).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("public subnets use dynamic availability zones", () => {
      const publicSubnetBlock = content.match(/resource\s+"aws_subnet"\s+"public"\s*{[\s\S]*?^}/m);
      expect(publicSubnetBlock).toBeTruthy();
      expect(publicSubnetBlock![0]).toMatch(/availability_zone\s*=\s*local\.azs\[count\.index\]/);
    });

    test("declares private subnets resource", () => {
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test("private subnets use count for multiple AZs", () => {
      const privateSubnetBlock = content.match(/resource\s+"aws_subnet"\s+"private"\s*{[^}]*count/s);
      expect(privateSubnetBlock).toBeTruthy();
      expect(privateSubnetBlock![0]).toMatch(/count\s*=\s*length\(local\.azs\)/);
    });

    test("private subnets do not have map_public_ip_on_launch", () => {
      const privateSubnetBlock = content.match(/resource\s+"aws_subnet"\s+"private"\s*{[\s\S]*?^}/m);
      expect(privateSubnetBlock).toBeTruthy();
      expect(privateSubnetBlock![0]).not.toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });
  });

  // ========================================
  // NAT Gateway Tests
  // ========================================
  describe("NAT Gateway", () => {
    test("declares Elastic IP resource for NAT", () => {
      expect(content).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    });

    test("EIP has domain set to vpc", () => {
      const eipBlock = content.match(/resource\s+"aws_eip"\s+"nat"\s*{[\s\S]*?^}/m);
      expect(eipBlock).toBeTruthy();
      expect(eipBlock![0]).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("EIP depends on Internet Gateway", () => {
      const eipBlock = content.match(/resource\s+"aws_eip"\s+"nat"\s*{[\s\S]*?^}/m);
      expect(eipBlock).toBeTruthy();
      expect(eipBlock![0]).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test("declares NAT Gateway resource", () => {
      expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    });

    test("NAT Gateway is placed in first public subnet", () => {
      const natBlock = content.match(/resource\s+"aws_nat_gateway"\s+"main"\s*{[\s\S]*?^}/m);
      expect(natBlock).toBeTruthy();
      expect(natBlock![0]).toMatch(/subnet_id\s*=\s*aws_subnet\.public\[0\]\.id/);
    });

    test("NAT Gateway uses the EIP allocation", () => {
      const natBlock = content.match(/resource\s+"aws_nat_gateway"\s+"main"\s*{[\s\S]*?^}/m);
      expect(natBlock).toBeTruthy();
      expect(natBlock![0]).toMatch(/allocation_id\s*=\s*aws_eip\.nat\.id/);
    });
  });

  // ========================================
  // Route Table Tests
  // ========================================
  describe("Route Tables", () => {
    test("declares public route table", () => {
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"/);
    });

    test("public route table has route to Internet Gateway", () => {
      const publicRtBlock = content.match(/resource\s+"aws_route_table"\s+"public"\s*{[\s\S]*?^}/m);
      expect(publicRtBlock).toBeTruthy();
      expect(publicRtBlock![0]).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
      expect(publicRtBlock![0]).toMatch(/cidr_block\s*=\s*"0\.0\.0\.0\/0"/);
    });

    test("declares public route table associations", () => {
      expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
    });

    test("public route table associations use count", () => {
      const publicAssocBlock = content.match(/resource\s+"aws_route_table_association"\s+"public"\s*{[^}]*count/s);
      expect(publicAssocBlock).toBeTruthy();
      expect(publicAssocBlock![0]).toMatch(/count\s*=\s*length\(aws_subnet\.public\)/);
    });

    test("declares private route table", () => {
      expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    });

    test("private route table has route to NAT Gateway", () => {
      const privateRtBlock = content.match(/resource\s+"aws_route_table"\s+"private"\s*{[\s\S]*?^}/m);
      expect(privateRtBlock).toBeTruthy();
      expect(privateRtBlock![0]).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\.id/);
    });

    test("declares private route table associations", () => {
      expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  // ========================================
  // Security Group Tests
  // ========================================
  describe("Security Groups", () => {
    test("declares ALB security group", () => {
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
    });

    test("ALB security group allows HTTP from anywhere", () => {
      const albSgBlock = content.match(/resource\s+"aws_security_group"\s+"alb"\s*{[\s\S]*?^}/m);
      expect(albSgBlock).toBeTruthy();
      expect(albSgBlock![0]).toMatch(/from_port\s*=\s*80/);
      expect(albSgBlock![0]).toMatch(/to_port\s*=\s*80/);
      expect(albSgBlock![0]).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test("ALB security group has conditional HTTPS rule", () => {
      const albSgBlock = content.match(/resource\s+"aws_security_group"\s+"alb"\s*{[\s\S]*?^}/m);
      expect(albSgBlock).toBeTruthy();
      expect(albSgBlock![0]).toMatch(/dynamic\s+"ingress"/);
      expect(albSgBlock![0]).toMatch(/for_each\s*=\s*var\.enable_https/);
    });

    test("ALB security group allows outbound to private subnets", () => {
      const albSgBlock = content.match(/resource\s+"aws_security_group"\s+"alb"\s*{[\s\S]*?^}/m);
      expect(albSgBlock).toBeTruthy();
      expect(albSgBlock![0]).toMatch(/cidr_blocks\s*=\s*local\.private_subnet_cidrs/);
    });

    test("declares web server security group", () => {
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"web"/);
    });

    test("web server SG allows HTTP from public subnets", () => {
      const webSgBlock = content.match(/resource\s+"aws_security_group"\s+"web"\s*{[\s\S]*?^}/m);
      expect(webSgBlock).toBeTruthy();
      expect(webSgBlock![0]).toMatch(/from_port\s*=\s*80/);
      expect(webSgBlock![0]).toMatch(/cidr_blocks\s*=\s*local\.public_subnet_cidrs/);
    });

    test("web server SG allows SSH from VPC", () => {
      const webSgBlock = content.match(/resource\s+"aws_security_group"\s+"web"\s*{[\s\S]*?^}/m);
      expect(webSgBlock).toBeTruthy();
      expect(webSgBlock![0]).toMatch(/from_port\s*=\s*22/);
      expect(webSgBlock![0]).toMatch(/to_port\s*=\s*22/);
      expect(webSgBlock![0]).toMatch(/var\.vpc_cidr/);
    });

    test("declares RDS security group", () => {
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
    });

    test("RDS security group allows MySQL from web servers", () => {
      const rdsSgBlock = content.match(/resource\s+"aws_security_group"\s+"rds"\s*{[\s\S]*?^}/m);
      expect(rdsSgBlock).toBeTruthy();
      expect(rdsSgBlock![0]).toMatch(/from_port\s*=\s*3306/);
      expect(rdsSgBlock![0]).toMatch(/to_port\s*=\s*3306/);
    });

    test("declares separate security group rules to avoid circular dependency", () => {
      expect(content).toMatch(/resource\s+"aws_security_group_rule"\s+"alb_to_web"/);
      expect(content).toMatch(/resource\s+"aws_security_group_rule"\s+"web_from_alb"/);
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

    test("declares CloudWatch IAM policy", () => {
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"cloudwatch_policy"/);
    });

    test("CloudWatch policy allows monitoring actions", () => {
      const cwPolicyBlock = content.match(/resource\s+"aws_iam_policy"\s+"cloudwatch_policy"\s*{[\s\S]*?^}/m);
      expect(cwPolicyBlock).toBeTruthy();
      expect(cwPolicyBlock![0]).toMatch(/cloudwatch:PutMetricData/);
      expect(cwPolicyBlock![0]).toMatch(/logs:PutLogEvents/);
    });

    test("declares Secrets Manager IAM policy", () => {
      expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"secrets_policy"/);
    });

    test("declares IAM role policy attachments", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_cloudwatch_attachment"/);
      expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_secrets_attachment"/);
      expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_ssm_attachment"/);
    });

    test("declares EC2 instance profile", () => {
      expect(content).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
    });
  });

  // ========================================
  // Application Load Balancer Tests
  // ========================================
  describe("Application Load Balancer", () => {
    test("declares ALB resource", () => {
      expect(content).toMatch(/resource\s+"aws_lb"\s+"main"/);
    });

    test("ALB is application type and internet-facing", () => {
      const albBlock = content.match(/resource\s+"aws_lb"\s+"main"\s*{[\s\S]*?^}/m);
      expect(albBlock).toBeTruthy();
      expect(albBlock![0]).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(albBlock![0]).toMatch(/internal\s*=\s*false/);
    });

    test("ALB uses public subnets", () => {
      const albBlock = content.match(/resource\s+"aws_lb"\s+"main"\s*{[\s\S]*?^}/m);
      expect(albBlock).toBeTruthy();
      expect(albBlock![0]).toMatch(/subnets\s*=\s*aws_subnet\.public\[\*\]\.id/);
    });

    test("declares ALB target group", () => {
      expect(content).toMatch(/resource\s+"aws_lb_target_group"\s+"web"/);
    });

    test("target group has health check configuration", () => {
      const tgBlock = content.match(/resource\s+"aws_lb_target_group"\s+"web"\s*{[\s\S]*?^}/m);
      expect(tgBlock).toBeTruthy();
      expect(tgBlock![0]).toMatch(/health_check\s*{/);
      expect(tgBlock![0]).toMatch(/enabled\s*=\s*true/);
      expect(tgBlock![0]).toMatch(/healthy_threshold\s*=\s*2/);
    });

    test("declares HTTP listener", () => {
      expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
    });

    test("HTTP listener behavior is conditional", () => {
      const httpListenerBlock = content.match(/resource\s+"aws_lb_listener"\s+"http"\s*{[\s\S]*?^}/m);
      expect(httpListenerBlock).toBeTruthy();
      expect(httpListenerBlock![0]).toMatch(/var\.enable_https\s*&&\s*local\.certificate_arn/);
    });

    test("declares conditional HTTPS listener", () => {
      expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"https"/);
    });

    test("HTTPS listener is conditional", () => {
      const httpsListenerBlock = content.match(/resource\s+"aws_lb_listener"\s+"https"\s*{[\s\S]*?^}/m);
      expect(httpsListenerBlock).toBeTruthy();
      expect(httpsListenerBlock![0]).toMatch(/count\s*=\s*var\.enable_https\s*&&\s*local\.certificate_arn/);
    });
  });

  // ========================================
  // SSL Certificate Tests
  // ========================================
  describe("SSL Certificate Management", () => {
    test("declares conditional ACM certificate", () => {
      expect(content).toMatch(/resource\s+"aws_acm_certificate"\s+"main"/);
    });

    test("ACM certificate creation is conditional", () => {
      const certBlock = content.match(/resource\s+"aws_acm_certificate"\s+"main"\s*{[\s\S]*?^}/m);
      expect(certBlock).toBeTruthy();
      expect(certBlock![0]).toMatch(/count\s*=\s*var\.enable_https\s*&&\s*var\.ssl_certificate_arn\s*==\s*""\s*&&\s*var\.domain_name\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });

    test("certificate uses DNS validation", () => {
      const certBlock = content.match(/resource\s+"aws_acm_certificate"\s+"main"\s*{[\s\S]*?^}/m);
      expect(certBlock).toBeTruthy();
      expect(certBlock![0]).toMatch(/validation_method\s*=\s*"DNS"/);
    });

    test("certificate domain uses variable", () => {
      const certBlock = content.match(/resource\s+"aws_acm_certificate"\s+"main"\s*{[\s\S]*?^}/m);
      expect(certBlock).toBeTruthy();
      expect(certBlock![0]).toMatch(/domain_name\s*=\s*var\.domain_name/);
    });
  });

  // ========================================
  // Auto Scaling Group Tests
  // ========================================
  describe("Auto Scaling Group", () => {
    test("declares launch template", () => {
      expect(content).toMatch(/resource\s+"aws_launch_template"\s+"web"/);
    });

    test("launch template uses dynamic AMI", () => {
      const ltBlock = content.match(/resource\s+"aws_launch_template"\s+"web"\s*{[\s\S]*?^}/m);
      expect(ltBlock).toBeTruthy();
      expect(ltBlock![0]).toMatch(/image_id\s*=\s*data\.aws_ami\.amazon_linux\.id/);
    });

    test("launch template uses instance profile", () => {
      const ltBlock = content.match(/resource\s+"aws_launch_template"\s+"web"\s*{[\s\S]*?^}/m);
      expect(ltBlock).toBeTruthy();
      expect(ltBlock![0]).toMatch(/iam_instance_profile/);
      expect(ltBlock![0]).toMatch(/aws_iam_instance_profile\.ec2_profile\.name/);
    });

    test("launch template includes user data", () => {
      const ltBlock = content.match(/resource\s+"aws_launch_template"\s+"web"\s*{[\s\S]*?^}/m);
      expect(ltBlock).toBeTruthy();
      expect(ltBlock![0]).toMatch(/user_data\s*=\s*local\.user_data/);
    });

    test("declares Auto Scaling Group", () => {
      expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"web"/);
    });

    test("ASG uses private subnets", () => {
      const asgBlock = content.match(/resource\s+"aws_autoscaling_group"\s+"web"\s*{[\s\S]*?^}/m);
      expect(asgBlock).toBeTruthy();
      expect(asgBlock![0]).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });

    test("ASG is attached to target group", () => {
      const asgBlock = content.match(/resource\s+"aws_autoscaling_group"\s+"web"\s*{[\s\S]*?^}/m);
      expect(asgBlock).toBeTruthy();
      expect(asgBlock![0]).toMatch(/target_group_arns\s*=\s*\[aws_lb_target_group\.web\.arn\]/);
    });

    test("ASG uses ELB health checks", () => {
      const asgBlock = content.match(/resource\s+"aws_autoscaling_group"\s+"web"\s*{[\s\S]*?^}/m);
      expect(asgBlock).toBeTruthy();
      expect(asgBlock![0]).toMatch(/health_check_type\s*=\s*"ELB"/);
    });

    test("declares scaling policies", () => {
      expect(content).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_up"/);
      expect(content).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_down"/);
    });
  });

  // ========================================
  // RDS Database Tests
  // ========================================
  describe("RDS Database", () => {
    test("declares DB subnet group", () => {
      expect(content).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
    });

    test("DB subnet group uses private subnets", () => {
      const dbSubnetBlock = content.match(/resource\s+"aws_db_subnet_group"\s+"main"\s*{[\s\S]*?^}/m);
      expect(dbSubnetBlock).toBeTruthy();
      expect(dbSubnetBlock![0]).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });

    test("declares DB parameter group", () => {
      expect(content).toMatch(/resource\s+"aws_db_parameter_group"\s+"main"/);
    });

    test("DB parameter group is for MySQL 8.0", () => {
      const dbParamBlock = content.match(/resource\s+"aws_db_parameter_group"\s+"main"\s*{[\s\S]*?^}/m);
      expect(dbParamBlock).toBeTruthy();
      expect(dbParamBlock![0]).toMatch(/family\s*=\s*"mysql8\.0"/);
    });

    test("declares RDS instance", () => {
      expect(content).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
    });

    test("RDS instance uses MySQL 8.0", () => {
      const rdsBlock = content.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
      expect(rdsBlock).toBeTruthy();
      expect(rdsBlock![0]).toMatch(/engine\s*=\s*"mysql"/);
      expect(rdsBlock![0]).toMatch(/engine_version\s*=\s*"8\.0"/);
    });

    test("RDS instance is in private subnets", () => {
      const rdsBlock = content.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
      expect(rdsBlock).toBeTruthy();
      expect(rdsBlock![0]).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);
      expect(rdsBlock![0]).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test("RDS instance uses random password", () => {
      const rdsBlock = content.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
      expect(rdsBlock).toBeTruthy();
      expect(rdsBlock![0]).toMatch(/password\s*=\s*random_password\.db_password\.result/);
    });

    test("RDS instance has backup configuration", () => {
      const rdsBlock = content.match(/resource\s+"aws_db_instance"\s+"main"\s*{[\s\S]*?^}/m);
      expect(rdsBlock).toBeTruthy();
      expect(rdsBlock![0]).toMatch(/backup_retention_period\s*=\s*7/);
      expect(rdsBlock![0]).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("declares RDS monitoring role", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"rds_monitoring"/);
    });
  });

  // ========================================
  // CloudWatch Monitoring Tests
  // ========================================
  describe("CloudWatch Monitoring", () => {
    test("declares CloudWatch log groups", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"httpd_access"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"httpd_error"/);
    });

    test("log groups have appropriate retention", () => {
      const accessLogBlock = content.match(/resource\s+"aws_cloudwatch_log_group"\s+"httpd_access"\s*{[\s\S]*?^}/m);
      expect(accessLogBlock).toBeTruthy();
      expect(accessLogBlock![0]).toMatch(/retention_in_days\s*=\s*14/);
    });

    test("declares CloudWatch alarms for Auto Scaling", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"low_cpu"/);
    });

    test("CPU alarms trigger scaling policies", () => {
      const highCpuBlock = content.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"\s*{[\s\S]*?^}/m);
      expect(highCpuBlock).toBeTruthy();
      expect(highCpuBlock![0]).toMatch(/alarm_actions\s*=\s*\[aws_autoscaling_policy\.scale_up\.arn\]/);
    });

    test("declares ALB health monitoring", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"alb_unhealthy_targets"/);
    });

    test("declares RDS monitoring alarms", () => {
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_cpu"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"rds_connections"/);
    });
  });

  // ========================================
  // Output Tests
  // ========================================
  describe("Outputs", () => {
    test("declares VPC outputs", () => {
      expect(content).toMatch(/output\s+"vpc_id"/);
      expect(content).toMatch(/output\s+"public_subnet_ids"/);
      expect(content).toMatch(/output\s+"private_subnet_ids"/);
    });

    test("declares load balancer outputs", () => {
      expect(content).toMatch(/output\s+"load_balancer_dns"/);
      expect(content).toMatch(/output\s+"load_balancer_zone_id"/);
    });

    test("declares database outputs", () => {
      expect(content).toMatch(/output\s+"database_endpoint"/);
      expect(content).toMatch(/output\s+"database_port"/);
      expect(content).toMatch(/output\s+"secret_arn"/);
    });

    test("database outputs are marked as sensitive", () => {
      const dbEndpointBlock = content.match(/output\s+"database_endpoint"\s*{[\s\S]*?^}/m);
      expect(dbEndpointBlock).toBeTruthy();
      expect(dbEndpointBlock![0]).toMatch(/sensitive\s*=\s*true/);
    });

    test("declares application URL output", () => {
      expect(content).toMatch(/output\s+"application_url"/);
    });

    test("application URL is conditional based on HTTPS", () => {
      const appUrlBlock = content.match(/output\s+"application_url"\s*{[\s\S]*?^}/m);
      expect(appUrlBlock).toBeTruthy();
      expect(appUrlBlock![0]).toMatch(/var\.enable_https\s*&&\s*local\.certificate_arn/);
    });

    test("declares Auto Scaling Group outputs", () => {
      expect(content).toMatch(/output\s+"autoscaling_group_name"/);
      expect(content).toMatch(/output\s+"autoscaling_group_arn"/);
    });
  });

  // ========================================
  // Best Practices Tests
  // ========================================
  describe("Terraform Best Practices", () => {
    test("no hardcoded regions in resource configurations", () => {
      // Check for hardcoded regions but exclude variable defaults
      const resourceBlocks = content.match(/resource\s+"[^"]+"\s+"[^"]+"\s*{[\s\S]*?^}/gm) || [];
      resourceBlocks.forEach(block => {
        if (!block.includes('variable')) {
          const hardcodedRegion = block.match(/=\s*"us-(east|west|central)-\d/);
          if (hardcodedRegion && !block.includes('default')) {
            fail(`Found hardcoded region in resource: ${hardcodedRegion[0]}`);
          }
        }
      });
    });

    test("uses dynamic availability zones", () => {
      expect(content).toMatch(/data\.aws_availability_zones\.available/);
      expect(content).not.toMatch(/"us-east-1a"/);
      expect(content).not.toMatch(/"us-west-2a"/);
    });

    test("uses consistent tagging with merge function", () => {
      const taggedResources = content.match(/tags\s*=\s*merge\(local\.common_tags/g);
      expect(taggedResources).toBeTruthy();
      expect(taggedResources!.length).toBeGreaterThan(10);
    });

    test("security groups use principle of least privilege", () => {
      // Web server SG should only allow specific ports
      const webSgBlock = content.match(/resource\s+"aws_security_group"\s+"web"\s*{[\s\S]*?^}/m);
      expect(webSgBlock).toBeTruthy();
      expect(webSgBlock![0]).toMatch(/from_port\s*=\s*22/);
      expect(webSgBlock![0]).toMatch(/from_port\s*=\s*80/);

      // RDS SG should only allow MySQL port
      const rdsSgBlock = content.match(/resource\s+"aws_security_group"\s+"rds"\s*{[\s\S]*?^}/m);
      expect(rdsSgBlock).toBeTruthy();
      expect(rdsSgBlock![0]).toMatch(/from_port\s*=\s*3306/);
    });

    test("IAM policies use specific actions, not wildcards", () => {
      const cwPolicyBlock = content.match(/resource\s+"aws_iam_policy"\s+"cloudwatch_policy"\s*{[\s\S]*?^}/m);
      expect(cwPolicyBlock).toBeTruthy();
      expect(cwPolicyBlock![0]).toMatch(/cloudwatch:PutMetricData/);
      expect(cwPolicyBlock![0]).toMatch(/logs:PutLogEvents/);
      // Should not use wildcard permissions
      expect(cwPolicyBlock![0]).not.toMatch(/"cloudwatch:\*"/);
    });

    test("uses locals for repeated values", () => {
      expect(content).toMatch(/local\.azs/);
      expect(content).toMatch(/local\.public_subnet_cidrs/);
      expect(content).toMatch(/local\.private_subnet_cidrs/);
      expect(content).toMatch(/local\.common_tags/);
    });

    test("conditional resources use proper terraform syntax", () => {
      expect(content).toMatch(/count\s*=.*\?\s*1\s*:\s*0/);
      expect(content).toMatch(/for_each\s*=.*\?\s*\[/);
    });

    test("database password is managed securely", () => {
      expect(content).toMatch(/random_password/);
      expect(content).toMatch(/aws_secretsmanager_secret/);
      expect(content).not.toMatch(/password\s*=\s*".*"/); // No hardcoded passwords
    });
  });

  // ========================================
  // Resource Count Validation
  // ========================================
  describe("Resource Count Validation", () => {
    test("has comprehensive resource coverage", () => {
      const resourceMatches = content.match(/resource\s+"/g);
      expect(resourceMatches).toBeTruthy();
      expect(resourceMatches!.length).toBeGreaterThanOrEqual(35);
    });

    test("has appropriate number of output blocks", () => {
      const outputMatches = content.match(/output\s+"/g);
      expect(outputMatches).toBeTruthy();
      expect(outputMatches!.length).toBeGreaterThanOrEqual(10);
    });

    test("has sufficient security group rules", () => {
      const ingressMatches = content.match(/ingress\s*{/g);
      const egressMatches = content.match(/egress\s*{/g);
      expect(ingressMatches).toBeTruthy();
      expect(egressMatches).toBeTruthy();
      expect(ingressMatches!.length).toBeGreaterThanOrEqual(4);
      expect(egressMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test("includes monitoring alarms", () => {
      const alarmMatches = content.match(/aws_cloudwatch_metric_alarm/g);
      expect(alarmMatches).toBeTruthy();
      expect(alarmMatches!.length).toBeGreaterThanOrEqual(5);
    });

    test("includes IAM policy attachments", () => {
      const attachmentMatches = content.match(/aws_iam_role_policy_attachment/g);
      expect(attachmentMatches).toBeTruthy();
      expect(attachmentMatches!.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ========================================
  // Integration Validation
  // ========================================
  describe("Component Integration", () => {
    test("ALB is properly integrated with Auto Scaling Group", () => {
      expect(content).toMatch(/target_group_arns\s*=\s*\[aws_lb_target_group\.web\.arn\]/);
    });

    test("RDS is properly secured in private subnets", () => {
      expect(content).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.main\.name/);
      expect(content).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.rds\.id\]/);
    });

    test("EC2 instances have proper IAM permissions", () => {
      expect(content).toMatch(/iam_instance_profile/);
      expect(content).toMatch(/aws_iam_instance_profile\.ec2_profile\.name/);
    });

    test("CloudWatch alarms are connected to scaling policies", () => {
      expect(content).toMatch(/alarm_actions\s*=\s*\[aws_autoscaling_policy\.scale_up\.arn\]/);
      expect(content).toMatch(/alarm_actions\s*=\s*\[aws_autoscaling_policy\.scale_down\.arn\]/);
    });

    test("NAT Gateway has proper dependencies", () => {
      expect(content).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });
  });
});
