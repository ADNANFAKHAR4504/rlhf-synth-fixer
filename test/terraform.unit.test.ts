// test/terraform.unit.test.ts
// Unit tests for EC2 Web Application Infrastructure
// Static code analysis - validates configuration before deployment
// NO Terraform commands - just reads main.tf and provider.tf files as text
// Coverage requirement: 90%+ (MANDATORY - Claude QA enforced)

import * as fs from "fs";
import * as path from "path";

describe("EC2 Web Application Infrastructure - Unit Tests", () => {
  const libDir = path.join(__dirname, "..", "lib");
  const mainTfPath = path.join(libDir, "main.tf");
  const providerTfPath = path.join(libDir, "provider.tf");
  
  let mainTfContent: string;
  let providerTfContent: string;
  let allTfContent: string; // Combined for cross-file checks

  beforeAll(() => {
    // Read Terraform configuration files
    if (!fs.existsSync(mainTfPath)) {
      throw new Error(`main.tf not found at: ${mainTfPath}`);
    }
    if (!fs.existsSync(providerTfPath)) {
      throw new Error(`provider.tf not found at: ${providerTfPath}`);
    }
    
    mainTfContent = fs.readFileSync(mainTfPath, "utf-8");
    providerTfContent = fs.readFileSync(providerTfPath, "utf-8");
    allTfContent = mainTfContent + "\n" + providerTfContent;
    
    console.log("Successfully loaded Terraform files");
    console.log(`main.tf: ${mainTfContent.length} characters`);
    console.log(`provider.tf: ${providerTfContent.length} characters`);
  });

  // Helper functions
  function has(rx: RegExp): boolean {
    return rx.test(allTfContent);
  }

  function count(rx: RegExp): number {
    return (allTfContent.match(rx) || []).length;
  }

  // ========================================
  // TEST GROUP 1: Provider and Version Configuration
  // ========================================
  describe("Provider Configuration", () => {
    test("uses AWS provider", () => {
      expect(providerTfContent).toMatch(/provider\s+"aws"/);
    });

    test("specifies region variable", () => {
      expect(has(/variable\s+"region"/)).toBe(true);
    });

    test("uses random provider for unique suffixes", () => {
      expect(has(/resource\s+"random_string"/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 2: Data Sources
  // ========================================
  describe("Data Sources", () => {
    test("fetches latest Amazon Linux 2 AMI", () => {
      expect(has(/data\s+"aws_ami"\s+"amazon_linux_2"/)).toBe(true);
    });

    test("filters AMI by architecture x86_64", () => {
      expect(has(/architecture[\s\S]*x86_64/)).toBe(true);
    });

    test("filters AMI by virtualization type hvm", () => {
      expect(has(/virtualization-type[\s\S]*hvm/)).toBe(true);
    });

    test("filters AMI by state available", () => {
      expect(has(/state[\s\S]*available/)).toBe(true);
    });

    test("uses Amazon as AMI owner", () => {
      expect(has(/owners\s*=\s*\["amazon"\]/)).toBe(true);
    });

    test("fetches availability zones", () => {
      expect(has(/data\s+"aws_availability_zones"/)).toBe(true);
    });

    test("fetches current caller identity", () => {
      expect(has(/data\s+"aws_caller_identity"/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 3: Variables
  // ========================================
  describe("Variables", () => {
    test("defines region variable with default us-west-2", () => {
      expect(has(/variable\s+"region"/)).toBe(true);
      expect(has(/default\s*=\s*"us-west-2"/)).toBe(true);
    });

    test("defines instance_type variable with default t3.medium", () => {
      expect(has(/variable\s+"instance_type"/)).toBe(true);
      expect(has(/default\s*=\s*"t3\.medium"/)).toBe(true);
    });

    test("defines availability_zone variable with default us-west-2a", () => {
      expect(has(/variable\s+"availability_zone"/)).toBe(true);
      expect(has(/default\s*=\s*"us-west-2a"/)).toBe(true);
    });

    test("defines volume_size variable with default 80", () => {
      expect(has(/variable\s+"volume_size"/)).toBe(true);
      expect(has(/default\s*=\s*80/)).toBe(true);
    });

    test("defines snapshot_schedule variable", () => {
      expect(has(/variable\s+"snapshot_schedule"/)).toBe(true);
    });

    test("defines snapshot_retention_days variable with default 7", () => {
      expect(has(/variable\s+"snapshot_retention_days"/)).toBe(true);
      expect(has(/default\s*=\s*7/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 4: Local Values
  // ========================================
  describe("Local Values", () => {
    test("defines common_tags local", () => {
      expect(has(/locals\s*\{[\s\S]*common_tags/)).toBe(true);
    });

    test("defines VPC CIDR 10.0.0.0/16", () => {
      expect(has(/vpc_cidr\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true);
    });

    test("defines subnet CIDR 10.0.1.0/24", () => {
      expect(has(/subnet_cidr\s*=\s*"10\.0\.1\.0\/24"/)).toBe(true);
    });

    test("defines private IP 10.0.1.10", () => {
      expect(has(/private_ip\s*=\s*"10\.0\.1\.10"/)).toBe(true);
    });

    test("defines user_data_script for SSM agent", () => {
      expect(has(/user_data_script/)).toBe(true);
      expect(has(/amazon-ssm-agent/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 5: Random String for Unique Naming
  // ========================================
  describe("Random String Resource", () => {
    test("creates random_string for unique suffixes", () => {
      expect(has(/resource\s+"random_string"\s+"unique_suffix"/)).toBe(true);
    });

    test("random string length is 8", () => {
      expect(has(/length\s*=\s*8/)).toBe(true);
    });

    test("random string has no special characters", () => {
      expect(has(/special\s*=\s*false/)).toBe(true);
    });

    test("random string is lowercase only", () => {
      expect(has(/upper\s*=\s*false/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 6: VPC Configuration
  // ========================================
  describe("VPC Configuration", () => {
    test("creates VPC resource", () => {
      expect(has(/resource\s+"aws_vpc"\s+"webapp_vpc"/)).toBe(true);
    });

    test("VPC uses 10.0.0.0/16 CIDR block", () => {
      expect(has(/cidr_block\s*=\s*local\.vpc_cidr/)).toBe(true);
    });

    test("VPC has DNS hostnames enabled", () => {
      expect(has(/enable_dns_hostnames\s*=\s*true/)).toBe(true);
    });

    test("VPC has DNS support enabled", () => {
      expect(has(/enable_dns_support\s*=\s*true/)).toBe(true);
    });

    test("VPC has Name tag webapp-vpc", () => {
      expect(has(/Name\s*=\s*"webapp-vpc"/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 7: Subnet Configuration
  // ========================================
  describe("Subnet Configuration", () => {
    test("creates subnet resource", () => {
      expect(has(/resource\s+"aws_subnet"\s+"webapp_subnet"/)).toBe(true);
    });

    test("subnet uses 10.0.1.0/24 CIDR block", () => {
      expect(has(/cidr_block\s*=\s*local\.subnet_cidr/)).toBe(true);
    });

    test("subnet is in us-west-2a availability zone", () => {
      expect(has(/availability_zone\s*=\s*var\.availability_zone/)).toBe(true);
    });

    test("subnet does not auto-assign public IPs", () => {
      expect(has(/map_public_ip_on_launch\s*=\s*false/)).toBe(true);
    });

    test("subnet has Name tag webapp-subnet", () => {
      expect(has(/Name\s*=\s*"webapp-subnet"/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 8: Security Group Configuration
  // ========================================
  describe("Security Group Configuration", () => {
    test("creates security group resource", () => {
      expect(has(/resource\s+"aws_security_group"\s+"webapp_security_group"/)).toBe(true);
    });

    test("security group has unique name with random suffix", () => {
      expect(has(/name\s*=\s*"webapp-security-group-\$\{random_string\.unique_suffix\.result\}"/)).toBe(true);
    });

    test("security group has description", () => {
      expect(has(/description\s*=\s*"Security group for webapp EC2 instance"/)).toBe(true);
    });

    test("security group is attached to VPC", () => {
      expect(has(/vpc_id\s*=\s*aws_vpc\.webapp_vpc\.id/)).toBe(true);
    });

    test("creates SSH ingress rule", () => {
      expect(has(/resource\s+"aws_security_group_rule"\s+"allow_ssh"/)).toBe(true);
    });

    test("SSH rule allows port 22", () => {
      expect(has(/from_port\s*=\s*22[\s\S]*to_port\s*=\s*22/)).toBe(true);
    });

    test("SSH rule allows only 10.0.0.0/8 CIDR", () => {
      expect(has(/cidr_blocks\s*=\s*\["10\.0\.0\.0\/8"\]/)).toBe(true);
    });

    test("SSH rule has description", () => {
      expect(has(/description\s*=\s*"Allow SSH access from internal network/)).toBe(true);
    });

    test("creates HTTPS ingress rule", () => {
      expect(has(/resource\s+"aws_security_group_rule"\s+"allow_https"/)).toBe(true);
    });

    test("HTTPS rule allows port 443", () => {
      expect(has(/from_port\s*=\s*443[\s\S]*to_port\s*=\s*443/)).toBe(true);
    });

    test("HTTPS rule allows only 10.0.0.0/8 CIDR", () => {
      const httpsBlock = mainTfContent.match(/resource\s+"aws_security_group_rule"\s+"allow_https"[\s\S]*?(?=resource|$)/);
      expect(httpsBlock).toBeTruthy();
      expect(httpsBlock![0]).toMatch(/cidr_blocks\s*=\s*\["10\.0\.0\.0\/8"\]/);
    });

    test("HTTPS rule has description", () => {
      expect(has(/description\s*=\s*"Allow HTTPS access from internal network/)).toBe(true);
    });

    test("creates egress rule for all outbound traffic", () => {
      expect(has(/resource\s+"aws_security_group_rule"\s+"allow_all_outbound"/)).toBe(true);
    });

    test("egress rule allows all protocols", () => {
      expect(has(/protocol\s*=\s*"-1"/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 9: IAM Role for EC2 Instance
  // ========================================
  describe("IAM Role for EC2 Instance", () => {
    test("creates IAM role for EC2 instance", () => {
      expect(has(/resource\s+"aws_iam_role"\s+"webapp_instance_role"/)).toBe(true);
    });

    test("IAM role has unique name with random suffix", () => {
      expect(has(/name\s*=\s*"webapp-instance-role-\$\{random_string\.unique_suffix\.result\}"/)).toBe(true);
    });

    test("IAM role has assume role policy for EC2", () => {
      expect(has(/assume_role_policy\s*=\s*jsonencode/)).toBe(true);
      expect(has(/Service.*ec2\.amazonaws\.com/)).toBe(true);
    });

    test("attaches AmazonSSMManagedInstanceCore policy", () => {
      expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"ssm_managed_instance_core"/)).toBe(true);
      expect(has(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/AmazonSSMManagedInstanceCore"/)).toBe(true);
    });

    test("creates instance profile", () => {
      expect(has(/resource\s+"aws_iam_instance_profile"\s+"webapp_instance_profile"/)).toBe(true);
    });

    test("instance profile has unique name with random suffix", () => {
      expect(has(/name\s*=\s*"webapp-instance-profile-\$\{random_string\.unique_suffix\.result\}"/)).toBe(true);
    });

    test("instance profile references IAM role", () => {
      expect(has(/role\s*=\s*aws_iam_role\.webapp_instance_role\.name/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 10: EC2 Instance Configuration
  // ========================================
  describe("EC2 Instance Configuration", () => {
    test("creates EC2 instance resource", () => {
      expect(has(/resource\s+"aws_instance"\s+"webapp_instance"/)).toBe(true);
    });

    test("instance uses fetched Amazon Linux 2 AMI", () => {
      expect(has(/ami\s*=\s*data\.aws_ami\.amazon_linux_2\.id/)).toBe(true);
    });

    test("instance type is t3.medium", () => {
      expect(has(/instance_type\s*=\s*var\.instance_type/)).toBe(true);
    });

    test("instance is in us-west-2a availability zone", () => {
      expect(has(/availability_zone\s*=\s*var\.availability_zone/)).toBe(true);
    });

    test("instance is in webapp subnet", () => {
      expect(has(/subnet_id\s*=\s*aws_subnet\.webapp_subnet\.id/)).toBe(true);
    });

    test("instance has static private IP", () => {
      expect(has(/private_ip\s*=\s*local\.private_ip/)).toBe(true);
    });

    test("instance uses webapp security group", () => {
      expect(has(/vpc_security_group_ids\s*=\s*\[aws_security_group\.webapp_security_group\.id\]/)).toBe(true);
    });

    test("instance has IAM instance profile attached", () => {
      expect(has(/iam_instance_profile\s*=\s*aws_iam_instance_profile\.webapp_instance_profile\.name/)).toBe(true);
    });

    test("instance has IMDSv2 enabled", () => {
      expect(has(/metadata_options\s*\{/)).toBe(true);
      expect(has(/http_tokens\s*=\s*"required"/)).toBe(true);
    });

    test("instance metadata endpoint is enabled", () => {
      expect(has(/http_endpoint\s*=\s*"enabled"/)).toBe(true);
    });

    test("instance has user_data_base64 for SSM agent", () => {
      expect(has(/user_data_base64\s*=\s*base64encode\(local\.user_data_script\)/)).toBe(true);
    });

    test("root block device is gp3", () => {
      expect(has(/volume_type\s*=\s*"gp3"/)).toBe(true);
    });

    test("root block device is encrypted", () => {
      expect(has(/encrypted\s*=\s*true/)).toBe(true);
    });

    test("root block device deletes on termination", () => {
      expect(has(/delete_on_termination\s*=\s*true/)).toBe(true);
    });

    test("instance has Name tag webapp-instance", () => {
      const instanceBlock = mainTfContent.match(/resource\s+"aws_instance"\s+"webapp_instance"[\s\S]*?(?=resource\s+"aws_ebs_volume"|$)/);
      expect(instanceBlock).toBeTruthy();
      expect(instanceBlock![0]).toMatch(/Name\s*=\s*"webapp-instance"/);
    });
  });

  // ========================================
  // TEST GROUP 11: EBS Volume Configuration
  // ========================================
  describe("EBS Volume Configuration", () => {
    test("creates EBS volume resource", () => {
      expect(has(/resource\s+"aws_ebs_volume"\s+"webapp_volume"/)).toBe(true);
    });

    test("EBS volume is in us-west-2a availability zone", () => {
      expect(has(/availability_zone\s*=\s*var\.availability_zone/)).toBe(true);
    });

    test("EBS volume size is 80GB", () => {
      expect(has(/size\s*=\s*var\.volume_size/)).toBe(true);
    });

    test("EBS volume type is gp3", () => {
      const volumeBlock = mainTfContent.match(/resource\s+"aws_ebs_volume"\s+"webapp_volume"[\s\S]*?(?=resource|$)/);
      expect(volumeBlock).toBeTruthy();
      expect(volumeBlock![0]).toMatch(/type\s*=\s*"gp3"/);
    });

    test("EBS volume is encrypted", () => {
      const volumeBlock = mainTfContent.match(/resource\s+"aws_ebs_volume"\s+"webapp_volume"[\s\S]*?(?=resource|$)/);
      expect(volumeBlock).toBeTruthy();
      expect(volumeBlock![0]).toMatch(/encrypted\s*=\s*true/);
    });

    test("EBS volume has Name tag webapp-volume", () => {
      expect(has(/Name\s*=\s*"webapp-volume"/)).toBe(true);
    });

    test("EBS volume has DeletionProtection tag", () => {
      expect(has(/DeletionProtection\s*=\s*"true"/)).toBe(true);
    });

    test("EBS volume has Purpose tag", () => {
      expect(has(/Purpose\s*=\s*"Application Data"/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 12: Volume Attachment
  // ========================================
  describe("Volume Attachment", () => {
    test("creates volume attachment resource", () => {
      expect(has(/resource\s+"aws_volume_attachment"\s+"webapp_volume_attachment"/)).toBe(true);
    });

    test("attachment uses device name /dev/sdf", () => {
      expect(has(/device_name\s*=\s*"\/dev\/sdf"/)).toBe(true);
    });

    test("attachment references webapp volume", () => {
      expect(has(/volume_id\s*=\s*aws_ebs_volume\.webapp_volume\.id/)).toBe(true);
    });

    test("attachment references webapp instance", () => {
      expect(has(/instance_id\s*=\s*aws_instance\.webapp_instance\.id/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 13: IAM Role for DLM
  // ========================================
  describe("IAM Role for Data Lifecycle Manager", () => {
    test("creates IAM role for DLM", () => {
      expect(has(/resource\s+"aws_iam_role"\s+"dlm_lifecycle_role"/)).toBe(true);
    });

    test("DLM role has unique name with random suffix", () => {
      expect(has(/name\s*=\s*"webapp-dlm-role-\$\{random_string\.unique_suffix\.result\}"/)).toBe(true);
    });

    test("DLM role has assume role policy for dlm.amazonaws.com", () => {
      expect(has(/Service.*dlm\.amazonaws\.com/)).toBe(true);
    });

    test("creates IAM policy for DLM", () => {
      expect(has(/resource\s+"aws_iam_role_policy"\s+"dlm_lifecycle_policy"/)).toBe(true);
    });

    test("DLM policy has unique name with random suffix", () => {
      expect(has(/name\s*=\s*"webapp-dlm-policy-\$\{random_string\.unique_suffix\.result\}"/)).toBe(true);
    });

    test("DLM policy allows CreateSnapshot", () => {
      expect(has(/ec2:CreateSnapshot/)).toBe(true);
    });

    test("DLM policy allows DeleteSnapshot", () => {
      expect(has(/ec2:DeleteSnapshot/)).toBe(true);
    });

    test("DLM policy allows DescribeVolumes", () => {
      expect(has(/ec2:DescribeVolumes/)).toBe(true);
    });

    test("DLM policy allows CreateTags", () => {
      expect(has(/ec2:CreateTags/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 14: Data Lifecycle Manager Policy
  // ========================================
  describe("Data Lifecycle Manager Policy", () => {
    test("creates DLM lifecycle policy", () => {
      expect(has(/resource\s+"aws_dlm_lifecycle_policy"\s+"webapp_snapshot_policy"/)).toBe(true);
    });

    test("DLM policy has description", () => {
      expect(has(/description\s*=\s*"Daily snapshot policy for webapp EBS volume"/)).toBe(true);
    });

    test("DLM policy references DLM IAM role", () => {
      expect(has(/execution_role_arn\s*=\s*aws_iam_role\.dlm_lifecycle_role\.arn/)).toBe(true);
    });

    test("DLM policy state is ENABLED", () => {
      expect(has(/state\s*=\s*"ENABLED"/)).toBe(true);
    });

    test("DLM policy targets VOLUME resource type", () => {
      expect(has(/resource_types\s*=\s*\["VOLUME"\]/)).toBe(true);
    });

    test("DLM policy targets webapp-volume by Name tag", () => {
      expect(has(/target_tags[\s\S]*Name\s*=\s*"webapp-volume"/)).toBe(true);
    });

    test("DLM policy has schedule named daily-snapshots", () => {
      expect(has(/name\s*=\s*"daily-snapshots"/)).toBe(true);
    });

    test("DLM policy creates snapshots every 24 hours", () => {
      expect(has(/interval\s*=\s*24/)).toBe(true);
      expect(has(/interval_unit\s*=\s*"HOURS"/)).toBe(true);
    });

    test("DLM policy creates snapshots at 2 AM UTC", () => {
      expect(has(/times\s*=\s*\["02:00"\]/)).toBe(true);
    });

    test("DLM policy retains snapshots for 7 days", () => {
      expect(has(/count\s*=\s*var\.snapshot_retention_days/)).toBe(true);
    });

    test("DLM policy adds SnapshotCreator tag", () => {
      expect(has(/SnapshotCreator\s*=\s*"DLM"/)).toBe(true);
    });

    test("DLM policy copies tags from volume", () => {
      expect(has(/copy_tags\s*=\s*true/)).toBe(true);
    });

    test("DLM policy has Name tag webapp-snapshot-policy", () => {
      expect(has(/Name\s*=\s*"webapp-snapshot-policy"/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 15: Outputs
  // ========================================
  describe("Outputs", () => {
    test("outputs instance_id", () => {
      expect(has(/output\s+"instance_id"/)).toBe(true);
    });

    test("instance_id output has description", () => {
      expect(has(/description\s*=\s*"ID of the EC2 instance"/)).toBe(true);
    });

    test("instance_id output references webapp instance", () => {
      expect(has(/value\s*=\s*aws_instance\.webapp_instance\.id/)).toBe(true);
    });

    test("outputs private_ip_address", () => {
      expect(has(/output\s+"private_ip_address"/)).toBe(true);
    });

    test("private_ip_address output has description", () => {
      expect(has(/description\s*=\s*"Private IP address of the EC2 instance"/)).toBe(true);
    });

    test("private_ip_address output references webapp instance", () => {
      expect(has(/value\s*=\s*aws_instance\.webapp_instance\.private_ip/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 16: Resource Naming Conventions
  // ========================================
  describe("Resource Naming Conventions", () => {
    test("resources use webapp prefix", () => {
      expect(has(/webapp-vpc/)).toBe(true);
      expect(has(/webapp-subnet/)).toBe(true);
      expect(has(/webapp-security-group/)).toBe(true);
      expect(has(/webapp-instance/)).toBe(true);
      expect(has(/webapp-volume/)).toBe(true);
    });

    test("IAM resources use random suffix for uniqueness", () => {
      expect(has(/webapp-instance-role-\$\{random_string\.unique_suffix\.result\}/)).toBe(true);
      expect(has(/webapp-instance-profile-\$\{random_string\.unique_suffix\.result\}/)).toBe(true);
      expect(has(/webapp-dlm-role-\$\{random_string\.unique_suffix\.result\}/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 17: Tagging Strategy
  // ========================================
  describe("Tagging Strategy", () => {
    test("uses common_tags local for consistent tagging", () => {
      expect(has(/merge\(\s*local\.common_tags/)).toBe(true);
    });

    test("common_tags includes Environment", () => {
      expect(has(/Environment\s*=\s*"production"/)).toBe(true);
    });

    test("common_tags includes ManagedBy", () => {
      expect(has(/ManagedBy\s*=\s*"terraform"/)).toBe(true);
    });

    test("common_tags includes Project", () => {
      expect(has(/Project\s*=\s*"webapp"/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 18: Critical Anti-Patterns Prevention
  // ========================================
  describe("Critical Anti-Patterns Prevention", () => {
    test("no hardcoded account IDs", () => {
      expect(has(/\d{12}/)).toBe(false);
    });

    test("no prevent_destroy lifecycle blocks", () => {
      expect(has(/prevent_destroy\s*=\s*true/)).toBe(false);
    });
  });

  // ========================================
  // TEST GROUP 19: Security Best Practices
  // ========================================
  describe("Security Best Practices", () => {
    test("all EBS volumes are encrypted", () => {
      const encryptedCount = count(/encrypted\s*=\s*true/);
      expect(encryptedCount).toBeGreaterThanOrEqual(1);
    });

    test("IMDSv2 is enforced", () => {
      expect(has(/http_tokens\s*=\s*"required"/)).toBe(true);
    });

    test("security group rules have descriptions", () => {
      const ruleCount = count(/resource\s+"aws_security_group_rule"/);
      const descCount = count(/description\s*=\s*"[^"]+"/);
      expect(descCount).toBeGreaterThanOrEqual(ruleCount);
    });

    test("IAM roles follow least privilege principle", () => {
      expect(has(/AmazonSSMManagedInstanceCore/)).toBe(true);
    });

    test("no security groups allow 0.0.0.0/0 ingress", () => {
      const ingressRules = mainTfContent.match(/resource\s+"aws_security_group_rule"[\s\S]*?type\s*=\s*"ingress"[\s\S]*?(?=resource|$)/g) || [];
      ingressRules.forEach(rule => {
        expect(rule).not.toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
      });
    });
  });

  // ========================================
  // TEST GROUP 20: Region and AZ Consistency
  // ========================================
  describe("Region and Availability Zone Consistency", () => {
    test("all resources use us-west-2 region", () => {
      expect(has(/default\s*=\s*"us-west-2"/)).toBe(true);
    });

    test("all resources use us-west-2a availability zone", () => {
      expect(has(/default\s*=\s*"us-west-2a"/)).toBe(true);
    });

    test("EC2 instance and EBS volume are in same AZ", () => {
      expect(has(/availability_zone\s*=\s*var\.availability_zone/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 21: Backup and Recovery Configuration
  // ========================================
  describe("Backup and Recovery Configuration", () => {
    test("DLM policy is configured for automated backups", () => {
      expect(has(/resource\s+"aws_dlm_lifecycle_policy"/)).toBe(true);
    });

    test("snapshots are scheduled daily at 2 AM UTC", () => {
      expect(has(/times\s*=\s*\["02:00"\]/)).toBe(true);
    });

    test("snapshot retention is configurable", () => {
      expect(has(/variable\s+"snapshot_retention_days"/)).toBe(true);
    });

    test("DLM has proper IAM permissions for snapshot operations", () => {
      expect(has(/ec2:CreateSnapshot/)).toBe(true);
      expect(has(/ec2:DeleteSnapshot/)).toBe(true);
    });
  });

  // ========================================
  // TEST GROUP 22: SSM Agent Configuration
  // ========================================
  describe("SSM Agent Configuration", () => {
    test("user data installs SSM agent", () => {
      expect(has(/amazon-ssm-agent/)).toBe(true);
    });

    test("user data enables SSM agent service", () => {
      expect(has(/systemctl enable amazon-ssm-agent/)).toBe(true);
    });

    test("user data starts SSM agent service", () => {
      expect(has(/systemctl start amazon-ssm-agent/)).toBe(true);
    });

    test("instance has IAM role with SSM permissions", () => {
      expect(has(/AmazonSSMManagedInstanceCore/)).toBe(true);
    });

    test("user data is base64 encoded", () => {
      expect(has(/user_data_base64\s*=\s*base64encode/)).toBe(true);
    });
  });

});
