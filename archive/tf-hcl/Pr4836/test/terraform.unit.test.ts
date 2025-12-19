// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Validates Terraform configuration structure and resources

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Stack: tap_stack.tf - File Existence", () => {
  test("tap_stack.tf file exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  test("tap_stack.tf is not empty", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content.length).toBeGreaterThan(0);
  });
});

describe("Terraform Stack: tap_stack.tf - Terraform Block", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares terraform block", () => {
    expect(content).toMatch(/terraform\s*{/);
  });

  test("specifies required_version >= 1.4.0", () => {
    expect(content).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
  });

  test("declares aws provider in required_providers", () => {
    expect(content).toMatch(/required_providers\s*{[\s\S]*?aws\s*=/);
  });

  test("aws provider source is hashicorp/aws", () => {
    expect(content).toMatch(/source\s*=\s*"hashicorp\/aws"/);
  });

  test("aws provider version is >= 5.0", () => {
    expect(content).toMatch(/version\s*=\s*">=\s*5\.0"/);
  });
});

describe("Terraform Stack: tap_stack.tf - Provider Configuration", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws provider configuration", () => {
    expect(content).toMatch(/provider\s+"aws"\s*{/);
  });

  test("sets region to us-east-1", () => {
    expect(content).toMatch(/region\s*=\s*"us-east-1"/);
  });
});

describe("Terraform Stack: tap_stack.tf - Variables", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares environment_suffix variable", () => {
    expect(content).toMatch(/variable\s+"environment_suffix"\s*{/);
  });
  
  test("environment_suffix variable has string type", () => {
    const envSuffixBlock = content.match(/variable\s+"environment_suffix"\s*{[\s\S]*?}/);
    expect(envSuffixBlock).toBeTruthy();
    expect(envSuffixBlock![0]).toMatch(/type\s*=\s*string/);
  });

  test("declares ami_id variable", () => {
    expect(content).toMatch(/variable\s+"ami_id"\s*{/);
  });

  test("ami_id variable has string type", () => {
    const amiIdBlock = content.match(/variable\s+"ami_id"\s*{[\s\S]*?}/);
    expect(amiIdBlock).toBeTruthy();
    expect(amiIdBlock![0]).toMatch(/type\s*=\s*string/);
  });

  test("declares instance_type variable", () => {
    expect(content).toMatch(/variable\s+"instance_type"\s*{/);
  });

  test("instance_type variable has default t2.micro", () => {
    const instanceTypeBlock = content.match(/variable\s+"instance_type"\s*{[\s\S]*?}/);
    expect(instanceTypeBlock).toBeTruthy();
    expect(instanceTypeBlock![0]).toMatch(/default\s*=\s*"t2\.micro"/);
  });
});

describe("Terraform Stack: tap_stack.tf - Data Sources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_availability_zones data source", () => {
    expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
  });

  test("availability zones data source filters for available state", () => {
    expect(content).toMatch(/state\s*=\s*"available"/);
  });
});

describe("Terraform Stack: tap_stack.tf - S3 Bucket Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_s3_bucket resource", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"app_bucket"/);
  });

  test("S3 bucket has bucket_prefix", () => {
    expect(content).toMatch(/bucket_prefix\s*=\s*"webapp-secure-bucket-\$\{var\.environment_suffix\}-"/);
  });

  test("declares aws_s3_bucket_versioning resource", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"app_bucket_versioning"/);
  });

  test("S3 versioning is enabled", () => {
    expect(content).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("declares aws_s3_bucket_public_access_block resource", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"app_bucket_pab"/);
  });

  test("S3 public access block has all protections enabled", () => {
    const pabBlock = content.match(/resource\s+"aws_s3_bucket_public_access_block"\s+"app_bucket_pab"\s*{[\s\S]*?^}/m);
    expect(pabBlock).toBeTruthy();
    expect(pabBlock![0]).toMatch(/block_public_acls\s*=\s*true/);
    expect(pabBlock![0]).toMatch(/block_public_policy\s*=\s*true/);
    expect(pabBlock![0]).toMatch(/ignore_public_acls\s*=\s*true/);
    expect(pabBlock![0]).toMatch(/restrict_public_buckets\s*=\s*true/);
  });
});

describe("Terraform Stack: tap_stack.tf - IAM Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_iam_role for EC2", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ec2_s3_role"/);
  });

  test("IAM role has assume_role_policy for EC2", () => {
    const roleBlock = content.match(/resource\s+"aws_iam_role"\s+"ec2_s3_role"\s*{[\s\S]*?assume_role_policy\s*=\s*jsonencode\(/);
    expect(roleBlock).toBeTruthy();
    expect(content).toMatch(/Service\s*=\s*"ec2\.amazonaws\.com"/);
  });

  test("declares aws_iam_policy for S3 access", () => {
    expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"s3_bucket_policy"/);
  });

  test("IAM policy includes S3 actions", () => {
    expect(content).toMatch(/s3:GetObject/);
    expect(content).toMatch(/s3:PutObject/);
    expect(content).toMatch(/s3:DeleteObject/);
    expect(content).toMatch(/s3:ListBucket/);
  });

  test("declares aws_iam_role_policy_attachment", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2_s3_policy_attachment"/);
  });

  test("declares aws_iam_instance_profile", () => {
    expect(content).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
  });
});

describe("Terraform Stack: tap_stack.tf - VPC and Networking", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_vpc resource", () => {
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
  });

  test("VPC has CIDR block 10.0.0.0/16", () => {
    expect(content).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
  });

  test("VPC enables DNS hostnames and support", () => {
    const vpcBlock = content.match(/resource\s+"aws_vpc"\s+"main"\s*{[\s\S]*?^}/m);
    expect(vpcBlock).toBeTruthy();
    expect(vpcBlock![0]).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(vpcBlock![0]).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("declares internet gateway", () => {
    expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
  });

  test("declares NAT gateway", () => {
    expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
  });

  test("declares Elastic IP for NAT gateway", () => {
    expect(content).toMatch(/resource\s+"aws_eip"\s+"nat"/);
  });
});

describe("Terraform Stack: tap_stack.tf - Subnets", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares public subnet 1", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public_1"/);
  });

  test("public subnet 1 has CIDR 10.0.1.0/24", () => {
    const subnet1Block = content.match(/resource\s+"aws_subnet"\s+"public_1"\s*{[\s\S]*?^}/m);
    expect(subnet1Block).toBeTruthy();
    expect(subnet1Block![0]).toMatch(/cidr_block\s*=\s*"10\.0\.1\.0\/24"/);
  });

  test("declares public subnet 2", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public_2"/);
  });

  test("public subnet 2 has CIDR 10.0.2.0/24", () => {
    const subnet2Block = content.match(/resource\s+"aws_subnet"\s+"public_2"\s*{[\s\S]*?^}/m);
    expect(subnet2Block).toBeTruthy();
    expect(subnet2Block![0]).toMatch(/cidr_block\s*=\s*"10\.0\.2\.0\/24"/);
  });

  test("declares private subnet 1", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private_1"/);
  });

  test("private subnet 1 has CIDR 10.0.11.0/24", () => {
    const subnet1Block = content.match(/resource\s+"aws_subnet"\s+"private_1"\s*{[\s\S]*?^}/m);
    expect(subnet1Block).toBeTruthy();
    expect(subnet1Block![0]).toMatch(/cidr_block\s*=\s*"10\.0\.11\.0\/24"/);
  });

  test("declares private subnet 2", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private_2"/);
  });

  test("private subnet 2 has CIDR 10.0.12.0/24", () => {
    const subnet2Block = content.match(/resource\s+"aws_subnet"\s+"private_2"\s*{[\s\S]*?^}/m);
    expect(subnet2Block).toBeTruthy();
    expect(subnet2Block![0]).toMatch(/cidr_block\s*=\s*"10\.0\.12\.0\/24"/);
  });

  test("public subnets have map_public_ip_on_launch enabled", () => {
    const publicSubnets = content.match(/resource\s+"aws_subnet"\s+"public_[12]"\s*{[\s\S]*?^}/gm);
    expect(publicSubnets).toBeTruthy();
    publicSubnets!.forEach(subnet => {
      expect(subnet).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });
  });
});

describe("Terraform Stack: tap_stack.tf - Route Tables", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares public route table", () => {
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"/);
  });

  test("public route table has route to internet gateway", () => {
    const publicRTBlock = content.match(/resource\s+"aws_route_table"\s+"public"\s*{[\s\S]*?^}/m);
    expect(publicRTBlock).toBeTruthy();
    expect(publicRTBlock![0]).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
  });

  test("declares private route table", () => {
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"/);
  });

  test("private route table has route to NAT gateway", () => {
    const privateRTBlock = content.match(/resource\s+"aws_route_table"\s+"private"\s*{[\s\S]*?^}/m);
    expect(privateRTBlock).toBeTruthy();
    expect(privateRTBlock![0]).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.main\.id/);
  });

  test("declares route table associations for public subnets", () => {
    expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"public_1"/);
    expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"public_2"/);
  });

  test("declares route table associations for private subnets", () => {
    expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"private_1"/);
    expect(content).toMatch(/resource\s+"aws_route_table_association"\s+"private_2"/);
  });
});

describe("Terraform Stack: tap_stack.tf - Security Groups", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares security group for web servers", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"web_sg"/);
  });

  test("security group allows HTTP ingress on port 80", () => {
    const sgBlock = content.match(/resource\s+"aws_security_group"\s+"web_sg"\s*{[\s\S]*?^}/m);
    expect(sgBlock).toBeTruthy();
    expect(sgBlock![0]).toMatch(/ingress\s*{[\s\S]*?from_port\s*=\s*80/);
    expect(sgBlock![0]).toMatch(/to_port\s*=\s*80/);
    expect(sgBlock![0]).toMatch(/protocol\s*=\s*"tcp"/);
  });

  test("security group allows all egress traffic", () => {
    const sgBlock = content.match(/resource\s+"aws_security_group"\s+"web_sg"\s*{[\s\S]*?^}/m);
    expect(sgBlock).toBeTruthy();
    expect(sgBlock![0]).toMatch(/egress\s*{/);
  });
});

describe("Terraform Stack: tap_stack.tf - EC2 and Auto Scaling", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares launch template", () => {
    expect(content).toMatch(/resource\s+"aws_launch_template"\s+"web_lt"/);
  });

  test("launch template uses ami_id variable", () => {
    const ltBlock = content.match(/resource\s+"aws_launch_template"\s+"web_lt"\s*{[\s\S]*?^}/m);
    expect(ltBlock).toBeTruthy();
    expect(ltBlock![0]).toMatch(/image_id\s*=\s*var\.ami_id/);
  });

  test("launch template uses instance_type variable", () => {
    const ltBlock = content.match(/resource\s+"aws_launch_template"\s+"web_lt"\s*{[\s\S]*?^}/m);
    expect(ltBlock).toBeTruthy();
    expect(ltBlock![0]).toMatch(/instance_type\s*=\s*var\.instance_type/);
  });

  test("launch template has user_data script", () => {
    expect(content).toMatch(/user_data\s*=\s*base64encode/);
  });

  test("declares auto scaling group", () => {
    expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"web_asg"/);
  });

  test("auto scaling group has min_size 2", () => {
    const asgBlock = content.match(/resource\s+"aws_autoscaling_group"\s+"web_asg"\s*{[\s\S]*?^}/m);
    expect(asgBlock).toBeTruthy();
    expect(asgBlock![0]).toMatch(/min_size\s*=\s*2/);
  });

  test("auto scaling group has desired_capacity 2", () => {
    const asgBlock = content.match(/resource\s+"aws_autoscaling_group"\s+"web_asg"\s*{[\s\S]*?^}/m);
    expect(asgBlock).toBeTruthy();
    expect(asgBlock![0]).toMatch(/desired_capacity\s*=\s*2/);
  });

  test("declares EC2 instance 1", () => {
    expect(content).toMatch(/resource\s+"aws_instance"\s+"web_1"/);
  });

  test("declares EC2 instance 2", () => {
    expect(content).toMatch(/resource\s+"aws_instance"\s+"web_2"/);
  });

  test("declares Elastic IP for instance 1", () => {
    expect(content).toMatch(/resource\s+"aws_eip"\s+"web_1_eip"/);
  });

  test("declares Elastic IP for instance 2", () => {
    expect(content).toMatch(/resource\s+"aws_eip"\s+"web_2_eip"/);
  });
});

describe("Terraform Stack: tap_stack.tf - Load Balancer", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares application load balancer", () => {
    expect(content).toMatch(/resource\s+"aws_lb"\s+"web_lb"/);
  });

  test("load balancer is not internal", () => {
    const lbBlock = content.match(/resource\s+"aws_lb"\s+"web_lb"\s*{[\s\S]*?^}/m);
    expect(lbBlock).toBeTruthy();
    expect(lbBlock![0]).toMatch(/internal\s*=\s*false/);
  });

  test("load balancer type is application", () => {
    const lbBlock = content.match(/resource\s+"aws_lb"\s+"web_lb"\s*{[\s\S]*?^}/m);
    expect(lbBlock).toBeTruthy();
    expect(lbBlock![0]).toMatch(/load_balancer_type\s*=\s*"application"/);
  });

  test("declares target group", () => {
    expect(content).toMatch(/resource\s+"aws_lb_target_group"\s+"web_tg"/);
  });

  test("target group uses HTTP protocol on port 80", () => {
    const tgBlock = content.match(/resource\s+"aws_lb_target_group"\s+"web_tg"\s*{[\s\S]*?^}/m);
    expect(tgBlock).toBeTruthy();
    expect(tgBlock![0]).toMatch(/port\s*=\s*80/);
    expect(tgBlock![0]).toMatch(/protocol\s*=\s*"HTTP"/);
  });

  test("target group has health check configuration", () => {
    expect(content).toMatch(/health_check\s*{/);
  });

  test("declares load balancer listener", () => {
    expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"web_listener"/);
  });

  test("listener forwards to target group", () => {
    const listenerBlock = content.match(/resource\s+"aws_lb_listener"\s+"web_listener"\s*{[\s\S]*?^}/m);
    expect(listenerBlock).toBeTruthy();
    expect(listenerBlock![0]).toMatch(/type\s*=\s*"forward"/);
  });
});

describe("Terraform Stack: tap_stack.tf - Outputs", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares load_balancer_dns output", () => {
    expect(content).toMatch(/output\s+"load_balancer_dns"/);
  });

  test("load_balancer_dns output returns ALB DNS name", () => {
    const outputBlock = content.match(/output\s+"load_balancer_dns"\s*{[\s\S]*?^}/m);
    expect(outputBlock).toBeTruthy();
    expect(outputBlock![0]).toMatch(/value\s*=\s*aws_lb\.web_lb\.dns_name/);
  });

  test("declares s3_bucket_name output", () => {
    expect(content).toMatch(/output\s+"s3_bucket_name"/);
  });

  test("s3_bucket_name output returns bucket id", () => {
    const outputBlock = content.match(/output\s+"s3_bucket_name"\s*{[\s\S]*?^}/m);
    expect(outputBlock).toBeTruthy();
    expect(outputBlock![0]).toMatch(/value\s*=\s*aws_s3_bucket\.app_bucket\.id/);
  });

  test("declares instance_1_public_ip output", () => {
    expect(content).toMatch(/output\s+"instance_1_public_ip"/);
  });

  test("declares instance_2_public_ip output", () => {
    expect(content).toMatch(/output\s+"instance_2_public_ip"/);
  });
});

describe("Terraform Stack: tap_stack.tf - Best Practices", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("does not contain any DeletionPolicy or Retain policy", () => {
    expect(content).not.toMatch(/DeletionPolicy/i);
    expect(content).not.toMatch(/Retain/i);
  });

  test("resources have appropriate tags", () => {
    const tagMatches = content.match(/tags\s*=\s*{/g);
    expect(tagMatches).toBeTruthy();
    expect(tagMatches!.length).toBeGreaterThan(5);
  });

  test("uses security best practices (block public S3 access)", () => {
    expect(content).toMatch(/block_public_acls\s*=\s*true/);
    expect(content).toMatch(/block_public_policy\s*=\s*true/);
  });

  test("implements high availability (multi-AZ deployment)", () => {
    expect(content).toMatch(/availability_zone.*names\[0\]/);
    expect(content).toMatch(/availability_zone.*names\[1\]/);
  });

  test("all resources are in a single file", () => {
    // Verify we're testing the consolidated file
    expect(stackPath).toContain("tap_stack.tf");
    expect(content).toMatch(/terraform\s*{/);
    expect(content).toMatch(/provider\s+"aws"/);
    expect(content).toMatch(/resource\s+"aws_vpc"/);
  });
});
