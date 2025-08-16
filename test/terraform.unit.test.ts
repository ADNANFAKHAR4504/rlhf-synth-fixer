// Unit tests for Multi-Region HA Terraform Infrastructure
import fs from "fs";
import path from "path";

const libPath = path.resolve(__dirname, "../lib");

// Helper function to parse Terraform files
function parseTerraformFile(filename: string): any {
  const filePath = path.join(libPath, filename);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, "utf8");
  try {
    // Simple parsing for testing purposes
    return content;
  } catch (e) {
    return content;
  }
}

describe("Terraform Infrastructure Files", () => {
  describe("File Existence", () => {
    const requiredFiles = [
      "provider.tf",
      "variables.tf",
      "locals.tf",
      "vpc.tf",
      "alb.tf",
      "auto-scaling.tf",
      "rds.tf",
      "route53.tf",
      "arc.tf",
      "sns.tf",
      "security-groups.tf",
      "iam.tf",
      "outputs.tf",
      "data.tf"
    ];

    requiredFiles.forEach(file => {
      test(`${file} exists`, () => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe("Provider Configuration", () => {
    let providerContent: string;

    beforeAll(() => {
      providerContent = parseTerraformFile("provider.tf");
    });

    test("should have terraform version constraint", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*"[^"]+"/);
    });

    test("should have AWS provider with version constraint", () => {
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/version\s*=\s*"[^"]+"/);
    });

    test("should have primary AWS provider alias", () => {
      expect(providerContent).toMatch(/alias\s*=\s*"primary"/);
    });

    test("should have secondary AWS provider alias", () => {
      expect(providerContent).toMatch(/alias\s*=\s*"secondary"/);
    });

    test("should have ARC AWS provider alias", () => {
      expect(providerContent).toMatch(/alias\s*=\s*"arc"/);
    });

    test("should have S3 backend configuration", () => {
      expect(providerContent).toMatch(/backend\s+"s3"/);
    });
  });

  describe("Variables Configuration", () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = parseTerraformFile("variables.tf");
    });

    const requiredVariables = [
      "aws_region_primary",
      "aws_region_secondary",
      "project_name",
      "environment_suffix",
      "instance_type",
      "db_instance_class",
      "min_size",
      "max_size",
      "desired_capacity"
    ];

    requiredVariables.forEach(variable => {
      test(`should have ${variable} variable`, () => {
        expect(variablesContent).toMatch(new RegExp(`variable\\s+"${variable}"\\s*{`));
      });
    });

    test("should have default values for critical variables", () => {
      expect(variablesContent).toMatch(/aws_region_primary[^}]*default\s*=\s*"us-west-2"/s);
      expect(variablesContent).toMatch(/aws_region_secondary[^}]*default\s*=\s*"us-east-1"/s);
    });
  });

  describe("Locals Configuration", () => {
    let localsContent: string;

    beforeAll(() => {
      localsContent = parseTerraformFile("locals.tf");
    });

    test("should have environment_suffix local", () => {
      expect(localsContent).toMatch(/environment_suffix\s*=/);
    });

    test("should have resource_prefix local", () => {
      expect(localsContent).toMatch(/resource_prefix\s*=/);
    });

    test("should use coalesce for environment suffix", () => {
      expect(localsContent).toMatch(/coalesce\(/);
    });

    test("should have common_tags local", () => {
      expect(localsContent).toMatch(/common_tags\s*=/);
    });
  });

  describe("VPC Configuration", () => {
    let vpcContent: string;

    beforeAll(() => {
      vpcContent = parseTerraformFile("vpc.tf");
    });

    test("should have primary VPC resource", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_vpc"\s+"primary"/);
    });

    test("should have secondary VPC resource", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_vpc"\s+"secondary"/);
    });

    test("should have correct CIDR blocks", () => {
      expect(vpcContent).toMatch(/10\.0\.0\.0\/16/);
      expect(vpcContent).toMatch(/10\.1\.0\.0\/16/);
    });

    test("should have DNS enabled for VPCs", () => {
      expect(vpcContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(vpcContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("should have NAT gateways limited to 1 per region", () => {
      expect(vpcContent).toMatch(/count\s*=\s*1\s*#.*EIP limit/);
    });

    test("should have public and private subnets", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"primary_public"/);
      expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"primary_private"/);
      expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"secondary_public"/);
      expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"secondary_private"/);
    });

    test("should have internet gateways", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_internet_gateway"\s+"primary"/);
      expect(vpcContent).toMatch(/resource\s+"aws_internet_gateway"\s+"secondary"/);
    });

    test("should have route tables", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_route_table"\s+"primary_public"/);
      expect(vpcContent).toMatch(/resource\s+"aws_route_table"\s+"primary_private"/);
    });

    test("should have route table associations", () => {
      expect(vpcContent).toMatch(/resource\s+"aws_route_table_association"\s+"primary_public"/);
      expect(vpcContent).toMatch(/resource\s+"aws_route_table_association"\s+"primary_private"/);
    });
  });

  describe("ALB Configuration", () => {
    let albContent: string;

    beforeAll(() => {
      albContent = parseTerraformFile("alb.tf");
    });

    test("should have primary ALB resource", () => {
      expect(albContent).toMatch(/resource\s+"aws_lb"\s+"primary"/);
    });

    test("should have secondary ALB resource", () => {
      expect(albContent).toMatch(/resource\s+"aws_lb"\s+"secondary"/);
    });

    test("should use substr for name length limit", () => {
      expect(albContent).toMatch(/substr\([^,]+,\s*0,\s*32\)/);
    });

    test("should have target groups", () => {
      expect(albContent).toMatch(/resource\s+"aws_lb_target_group"\s+"primary"/);
      expect(albContent).toMatch(/resource\s+"aws_lb_target_group"\s+"secondary"/);
    });

    test("should have health check configuration", () => {
      expect(albContent).toMatch(/health_check\s*{/);
      expect(albContent).toMatch(/healthy_threshold/);
      expect(albContent).toMatch(/unhealthy_threshold/);
    });

    test("should have listeners", () => {
      expect(albContent).toMatch(/resource\s+"aws_lb_listener"\s+"primary"/);
      expect(albContent).toMatch(/resource\s+"aws_lb_listener"\s+"secondary"/);
    });

    test("should enable cross-zone load balancing", () => {
      expect(albContent).toMatch(/enable_cross_zone_load_balancing\s*=\s*true/);
    });
  });

  describe("Auto Scaling Configuration", () => {
    let autoScalingContent: string;

    beforeAll(() => {
      autoScalingContent = parseTerraformFile("auto-scaling.tf");
    });

    test("should have launch templates", () => {
      expect(autoScalingContent).toMatch(/resource\s+"aws_launch_template"\s+"primary"/);
      expect(autoScalingContent).toMatch(/resource\s+"aws_launch_template"\s+"secondary"/);
    });

    test("should have auto scaling groups", () => {
      expect(autoScalingContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"primary"/);
      expect(autoScalingContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"secondary"/);
    });

    test("should not have availability_zones parameter", () => {
      expect(autoScalingContent).not.toMatch(/^\s*availability_zones\s*=/m);
    });

    test("should have vpc_zone_identifier", () => {
      expect(autoScalingContent).toMatch(/vpc_zone_identifier/);
    });

    test("should have health check configuration", () => {
      expect(autoScalingContent).toMatch(/health_check_type\s*=\s*"ELB"/);
      expect(autoScalingContent).toMatch(/health_check_grace_period/);
    });

    test("should have scaling policies", () => {
      expect(autoScalingContent).toMatch(/resource\s+"aws_autoscaling_policy"/);
    });
  });

  describe("RDS Configuration", () => {
    let rdsContent: string;

    beforeAll(() => {
      rdsContent = parseTerraformFile("rds.tf");
    });

    test("should have primary DB instance", () => {
      expect(rdsContent).toMatch(/resource\s+"aws_db_instance"\s+"primary"/);
    });

    test("should have Multi-AZ enabled", () => {
      expect(rdsContent).toMatch(/multi_az\s*=\s*true/);
    });

    test("should have Performance Insights disabled for t3.micro", () => {
      expect(rdsContent).toMatch(/performance_insights_enabled\s*=\s*false/);
    });

    test("should have backup configuration", () => {
      expect(rdsContent).toMatch(/backup_retention_period/);
      expect(rdsContent).toMatch(/backup_window/);
    });

    test("should have encryption enabled", () => {
      expect(rdsContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("should have monitoring configuration", () => {
      expect(rdsContent).toMatch(/monitoring_interval/);
      expect(rdsContent).toMatch(/monitoring_role_arn/);
    });

    test("should have DB subnet groups", () => {
      expect(rdsContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"primary"/);
      expect(rdsContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"secondary"/);
    });
  });

  describe("Route53 Configuration", () => {
    let route53Content: string;

    beforeAll(() => {
      route53Content = parseTerraformFile("route53.tf");
    });

    test("should have hosted zone", () => {
      expect(route53Content).toMatch(/resource\s+"aws_route53_zone"\s+"main"/);
    });

    test("should use internal.local domain", () => {
      expect(route53Content).toMatch(/\.internal\.local/);
    });

    test("should have health checks", () => {
      expect(route53Content).toMatch(/resource\s+"aws_route53_health_check"\s+"primary_alb"/);
      expect(route53Content).toMatch(/resource\s+"aws_route53_health_check"\s+"secondary_alb"/);
    });

    test("should have weighted routing policy", () => {
      expect(route53Content).toMatch(/weighted_routing_policy/);
    });
  });

  describe("ARC Configuration", () => {
    let arcContent: string;

    beforeAll(() => {
      arcContent = parseTerraformFile("arc.tf");
    });

    test("should have recovery control cluster", () => {
      expect(arcContent).toMatch(/resource\s+"aws_route53recoverycontrolconfig_cluster"\s+"main"/);
    });

    test("should have control panel", () => {
      expect(arcContent).toMatch(/resource\s+"aws_route53recoverycontrolconfig_control_panel"\s+"main"/);
    });

    test("should have routing controls", () => {
      expect(arcContent).toMatch(/resource\s+"aws_route53recoverycontrolconfig_routing_control"\s+"primary"/);
      expect(arcContent).toMatch(/resource\s+"aws_route53recoverycontrolconfig_routing_control"\s+"secondary"/);
    });

    test("should have safety rules", () => {
      expect(arcContent).toMatch(/resource\s+"aws_route53recoverycontrolconfig_safety_rule"\s+"assertion"/);
    });

    test("should have recovery group with cell ARNs", () => {
      expect(arcContent).toMatch(/aws_route53recoveryreadiness_cell\.primary\.arn/);
      expect(arcContent).toMatch(/aws_route53recoveryreadiness_cell\.secondary\.arn/);
    });
  });

  describe("Security Groups", () => {
    let sgContent: string;

    beforeAll(() => {
      sgContent = parseTerraformFile("security-groups.tf");
    });

    test("should have ALB security groups", () => {
      expect(sgContent).toMatch(/resource\s+"aws_security_group"\s+"primary_alb"/);
      expect(sgContent).toMatch(/resource\s+"aws_security_group"\s+"secondary_alb"/);
    });

    test("should have EC2 security groups", () => {
      expect(sgContent).toMatch(/resource\s+"aws_security_group"\s+"primary_ec2"/);
      expect(sgContent).toMatch(/resource\s+"aws_security_group"\s+"secondary_ec2"/);
    });

    test("should have RDS security groups", () => {
      expect(sgContent).toMatch(/resource\s+"aws_security_group"\s+"primary_rds"/);
      expect(sgContent).toMatch(/resource\s+"aws_security_group"\s+"secondary_rds"/);
    });

    test("should have appropriate ingress rules", () => {
      expect(sgContent).toMatch(/ingress\s*{/);
      expect(sgContent).toMatch(/from_port/);
      expect(sgContent).toMatch(/to_port/);
    });

    test("should have egress rules", () => {
      expect(sgContent).toMatch(/egress\s*{/);
    });
  });

  describe("IAM Configuration", () => {
    let iamContent: string;

    beforeAll(() => {
      iamContent = parseTerraformFile("iam.tf");
    });

    test("should have EC2 IAM role", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
    });

    test("should have RDS monitoring role", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_enhanced_monitoring"/);
    });

    test("should have instance profiles", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
    });

    test("should have appropriate policies", () => {
      expect(iamContent).toMatch(/aws_iam_role_policy_attachment/);
    });
  });

  describe("SNS Configuration", () => {
    let snsContent: string;

    beforeAll(() => {
      snsContent = parseTerraformFile("sns.tf");
    });

    test("should have SNS topic for alerts", () => {
      expect(snsContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
    });

    test("should have CloudWatch alarms", () => {
      expect(snsContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
    });

    test("should have alarm actions", () => {
      expect(snsContent).toMatch(/alarm_actions/);
    });
  });

  describe("Outputs Configuration", () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = parseTerraformFile("outputs.tf");
    });

    const requiredOutputs = [
      "primary_alb_dns",
      "secondary_alb_dns",
      "primary_vpc_id",
      "secondary_vpc_id",
      "primary_rds_endpoint",
      "route53_zone_id"
    ];

    requiredOutputs.forEach(output => {
      test(`should have ${output} output`, () => {
        expect(outputsContent).toMatch(new RegExp(`output\\s+"${output}"\\s*{`));
      });
    });

    test("outputs should have descriptions", () => {
      expect(outputsContent).toMatch(/description\s*=/);
    });

    test("outputs should have values", () => {
      expect(outputsContent).toMatch(/value\s*=/);
    });
  });

  describe("Data Sources", () => {
    let dataContent: string;

    beforeAll(() => {
      dataContent = parseTerraformFile("data.tf");
    });

    test("should have availability zones data sources", () => {
      expect(dataContent).toMatch(/data\s+"aws_availability_zones"\s+"primary"/);
      expect(dataContent).toMatch(/data\s+"aws_availability_zones"\s+"secondary"/);
    });

    test("should have AMI data sources", () => {
      expect(dataContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_primary"/);
      expect(dataContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux_secondary"/);
    });
  });

  describe("Resource Naming Convention", () => {
    const files = ["vpc.tf", "alb.tf", "auto-scaling.tf", "rds.tf"];
    
    files.forEach(file => {
      test(`${file} should use resource_prefix for naming`, () => {
        const content = parseTerraformFile(file);
        expect(content).toMatch(/\$\{local\.resource_prefix\}/);
      });
    });
  });

  describe("Multi-Region Support", () => {
    test("should have resources in both regions", () => {
      const vpcContent = parseTerraformFile("vpc.tf");
      const albContent = parseTerraformFile("alb.tf");
      
      expect(vpcContent).toMatch(/provider\s*=\s*aws\.primary/);
      expect(vpcContent).toMatch(/provider\s*=\s*aws\.secondary/);
      expect(albContent).toMatch(/provider\s*=\s*aws\.primary/);
      expect(albContent).toMatch(/provider\s*=\s*aws\.secondary/);
    });
  });

  describe("High Availability Features", () => {
    test("should have multi-AZ configuration", () => {
      const rdsContent = parseTerraformFile("rds.tf");
      expect(rdsContent).toMatch(/multi_az\s*=\s*true/);
    });

    test("should have auto-scaling configuration", () => {
      const asContent = parseTerraformFile("auto-scaling.tf");
      expect(asContent).toMatch(/min_size/);
      expect(asContent).toMatch(/max_size/);
      expect(asContent).toMatch(/desired_capacity/);
    });

    test("should have health checks", () => {
      const albContent = parseTerraformFile("alb.tf");
      const route53Content = parseTerraformFile("route53.tf");
      
      expect(albContent).toMatch(/health_check/);
      expect(route53Content).toMatch(/aws_route53_health_check/);
    });
  });

  describe("Security Best Practices", () => {
    test("should have encryption enabled for RDS", () => {
      const rdsContent = parseTerraformFile("rds.tf");
      expect(rdsContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("should use random password for RDS", () => {
      const rdsContent = parseTerraformFile("rds.tf");
      expect(rdsContent).toMatch(/resource\s+"random_password"\s+"db_password"/);
    });

    test("should have private subnets for compute resources", () => {
      const asContent = parseTerraformFile("auto-scaling.tf");
      expect(asContent).toMatch(/aws_subnet\.primary_private/);
    });

    test("should not have deletion protection enabled", () => {
      const albContent = parseTerraformFile("alb.tf");
      expect(albContent).toMatch(/enable_deletion_protection\s*=\s*false/);
    });
  });

  describe("Tagging Strategy", () => {
    test("should use common tags", () => {
      const vpcContent = parseTerraformFile("vpc.tf");
      const albContent = parseTerraformFile("alb.tf");
      
      expect(vpcContent).toMatch(/merge\(local\.common_tags/);
      expect(albContent).toMatch(/local\.common_tags/);
    });

    test("should include environment suffix in tags", () => {
      const localsContent = parseTerraformFile("locals.tf");
      expect(localsContent).toMatch(/EnvironmentSuffix/);
    });
  });
});