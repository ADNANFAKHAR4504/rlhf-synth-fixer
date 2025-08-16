import * as fs from 'fs';
import * as path from 'path';

describe('Terraform main.tf Unit Tests (AWS, no vpc_id required)', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  const mainTfPath = path.join(libPath, 'main.tf');
  let mainTfContent = '';

  beforeAll(() => {
    expect(fs.existsSync(mainTfPath)).toBe(true);
    mainTfContent = fs.readFileSync(mainTfPath, 'utf8');
  });

  describe('VPC and Networking', () => {
    test('creates prod VPC with DNS enabled and proper Name tag', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_vpc"\s+"prod_vpc"/);
      expect(mainTfContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(mainTfContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(mainTfContent).toMatch(/enable_dns_support\s*=\s*true/);
      expect(mainTfContent).toMatch(/tags\s*=\s*merge\([\s\S]*Name\s*=\s*"prod-vpc\$\{local\.env_suffix\}"/);
    });

    test('creates Internet Gateway attached to VPC', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"prod_igw"/);
      expect(mainTfContent).toMatch(/vpc_id\s*=\s*aws_vpc\.prod_vpc\.id/);
      expect(mainTfContent).toMatch(/Name\s*=\s*"prod-igw\$\{local\.env_suffix\}"/);
    });

    test('creates public and private subnets across AZs', () => {
      expect(mainTfContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);

      // Public
      expect(mainTfContent).toMatch(/resource\s+"aws_subnet"\s+"prod_public_subnets"/);
      expect(mainTfContent).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
      expect(mainTfContent).toMatch(/cidr_block\s*=\s*var\.public_subnet_cidrs\[count\.index\]/);
      expect(mainTfContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
      expect(mainTfContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
      expect(mainTfContent).toMatch(/Name\s*=\s*"prod-public-subnet-\$\{count\.index \+ 1\}\$\{local\.env_suffix\}"/);

      // Private
      expect(mainTfContent).toMatch(/resource\s+"aws_subnet"\s+"prod_private_subnets"/);
      expect(mainTfContent).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
      expect(mainTfContent).toMatch(/cidr_block\s*=\s*var\.private_subnet_cidrs\[count\.index\]/);
      expect(mainTfContent).toMatch(/Name\s*=\s*"prod-private-subnet-\$\{count\.index \+ 1\}\$\{local\.env_suffix\}"/);
    });

    test('allocates EIPs and creates NAT Gateways per public subnet', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_eip"\s+"prod_nat_eips"[\s\S]*count\s*=\s*length\(var\.public_subnet_cidrs\)/);
      expect(mainTfContent).toMatch(/domain\s*=\s*"vpc"/);

      expect(mainTfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"prod_nat_gateways"[\s\S]*count\s*=\s*length\(var\.public_subnet_cidrs\)/);
      expect(mainTfContent).toMatch(/allocation_id\s*=\s*aws_eip\.prod_nat_eips\[count\.index\]\.id/);
      expect(mainTfContent).toMatch(/subnet_id\s*=\s*aws_subnet\.prod_public_subnets\[count\.index\]\.id/);
    });

    test('creates route tables and associations', () => {
      // Public RT with IGW route
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table"\s+"prod_public_rt"/);
      expect(mainTfContent).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.prod_igw\.id/);

      // Private RTs with NAT routes (per private subnet)
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table"\s+"prod_private_rt"[\s\S]*count\s*=\s*length\(var\.private_subnet_cidrs\)/);
      expect(mainTfContent).toMatch(/nat_gateway_id\s*=\s*aws_nat_gateway\.prod_nat_gateways\[count\.index\]\.id/);

      // Associations
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table_association"\s+"prod_public_rta"[\s\S]*count\s*=\s*length\(var\.public_subnet_cidrs\)/);
      expect(mainTfContent).toMatch(/resource\s+"aws_route_table_association"\s+"prod_private_rta"[\s\S]*count\s*=\s*length\(var\.private_subnet_cidrs\)/);
    });
  });

  describe('Security Groups', () => {
    test('ALB SG allows HTTP from world and all egress', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_security_group"\s+"prod_alb_sg"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"prod-alb-sg\$\{local\.env_suffix\}"/);
      expect(mainTfContent).toMatch(/ingress[\s\S]*from_port\s*=\s*80[\s\S]*to_port\s*=\s*80[\s\S]*cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/);
      expect(mainTfContent).toMatch(/egress[\s\S]*from_port\s*=\s*0[\s\S]*to_port\s*=\s*0[\s\S]*cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/);
    });

    test('EC2 SG allows HTTP only from ALB SG, SSH only from VPC CIDR, and all egress', () => {
      const ec2Sg = mainTfContent.match(/resource\s+"aws_security_group"\s+"prod_ec2_sg"[\s\S]*?\n}/);
      expect(ec2Sg).toBeTruthy();
      if (ec2Sg) {
        expect(ec2Sg[0]).toMatch(/ingress[\s\S]*"HTTP from ALB"[\s\S]*from_port\s*=\s*80[\s\S]*security_groups\s*=\s*\[\s*aws_security_group\.prod_alb_sg\.id\s*\]/);
        expect(ec2Sg[0]).toMatch(/description\s*=\s*"SSH from VPC"[\s\S]*from_port\s*=\s*22[\s\S]*cidr_blocks\s*=\s*\[\s*var\.vpc_cidr\s*\]/);
        expect(ec2Sg[0]).toMatch(/egress[\s\S]*from_port\s*=\s*0[\s\S]*to_port\s*=\s*0[\s\S]*cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\]/);
      }
    });
  });

  describe('ALB and Target Group', () => {
    test('ALB configured in public subnets with SG', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_lb"\s+"prod_alb"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"prod-alb\$\{local\.env_suffix\}"/);
      expect(mainTfContent).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(mainTfContent).toMatch(/internal\s*=\s*false/);
      expect(mainTfContent).toMatch(/enable_deletion_protection\s*=\s*false/);
      expect(mainTfContent).toMatch(/security_groups\s*=\s*\[\s*aws_security_group\.prod_alb_sg\.id\s*\]/);
      expect(mainTfContent).toMatch(/subnets?\s*=\s*aws_subnet\.prod_public_subnets\[\*\]\.id/);
    });

    test('Target group and HTTP listener forward to TG', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_lb_target_group"\s+"prod_tg"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"prod-tg\$\{local\.env_suffix\}"/);
      expect(mainTfContent).toMatch(/port\s*=\s*80/);
      expect(mainTfContent).toMatch(/protocol\s*=\s*"HTTP"/);
      expect(mainTfContent).toMatch(/health_check[\s\S]*enabled\s*=\s*true[\s\S]*path\s*=\s*"\//);
      expect(mainTfContent).toMatch(/resource\s+"aws_lb_listener"\s+"prod_alb_listener_http"[\s\S]*protocol\s*=\s*"HTTP"[\s\S]*default_action[\s\S]*type\s*=\s*"forward"[\s\S]*target_group_arn\s*=\s*aws_lb_target_group\.prod_tg\.arn/);
    });
  });

  describe('Auto Scaling', () => {
    test('Launch template uses EC2 SG and user_data', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_launch_template"\s+"prod_launch_template"/);
      expect(mainTfContent).toMatch(/name_prefix\s*=\s*"prod-launch-template\$\{local\.env_suffix\}-"/);
      expect(mainTfContent).toMatch(/instance_type\s*=\s*var\.instance_type/);
      expect(mainTfContent).toMatch(/user_data\s*=\s*base64encode/);
      expect(mainTfContent).toMatch(/vpc_security_group_ids\s*=\s*\[\s*aws_security_group\.prod_ec2_sg\.id\s*\]/);
      expect(mainTfContent).toMatch(/tag_specifications/);
    });

    test('ASG references launch template and private subnets with HA settings', () => {
      const asg = mainTfContent.match(/resource\s+"aws_autoscaling_group"\s+"prod_asg"[\s\S]*?\n}/);
      expect(asg).toBeTruthy();
      if (asg) {
        expect(asg[0]).toMatch(/name\s*=\s*"prod-asg\$\{local\.env_suffix\}"/);
        expect(asg[0]).toMatch(/launch_template[\s\S]*(id|name)\s*=\s*aws_launch_template\.prod_launch_template\.(id|name)/);
        expect(asg[0]).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.prod_private_subnets\[\*\]\.id/);
        expect(asg[0]).toMatch(/health_check_type\s*=\s*"ELB"/);
        expect(asg[0]).toMatch(/health_check_grace_period\s*=\s*300/);
        expect(asg[0]).toMatch(/min_size\s*=\s*var\.min_size/);
        expect(asg[0]).toMatch(/max_size\s*=\s*var\.max_size/);
        expect(asg[0]).toMatch(/desired_capacity\s*=\s*var\.desired_capacity/);
        expect(asg[0]).toMatch(/propagate_at_launch\s*=\s*true/);
      }
    });
  });

  describe('S3 Buckets and Hardening', () => {
    test('random suffix and two buckets with versioning', () => {
      expect(mainTfContent).toMatch(/resource\s+"random_string"\s+"bucket_suffix"[\s\S]*length\s*=\s*8[\s\S]*special\s*=\s*false[\s\S]*upper\s*=\s*false/);

      // Data bucket
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"prod_data_bucket"[\s\S]*bucket\s*=\s*"prod-app-data\$\{local\.env_suffix\}-\$\{random_string\.bucket_suffix\.result\}"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"prod_data_bucket_versioning"[\s\S]*status\s*=\s*"Enabled"/);

      // Logs bucket
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"prod_logs_bucket"[\s\S]*bucket\s*=\s*"prod-logs\$\{local\.env_suffix\}-\$\{random_string\.bucket_suffix\.result\}"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"prod_logs_bucket_versioning"[\s\S]*status\s*=\s*"Enabled"/);
    });

    test('public access blocks and encryption on both buckets', () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"prod_data_bucket_pab"[\s\S]*block_public_acls\s*=\s*true[\s\S]*block_public_policy\s*=\s*true[\s\S]*ignore_public_acls\s*=\s*true[\s\S]*restrict_public_buckets\s*=\s*true/);
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"prod_logs_bucket_pab"/);

      const encBlocks = mainTfContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"prod_(data|logs)_bucket_encryption"[\s\S]*?\n}/g) || [];
      expect(encBlocks.length).toBeGreaterThanOrEqual(2);
      encBlocks.forEach(b => {
        expect(b).toMatch(/apply_server_side_encryption_by_default[\s\S]*sse_algorithm\s*=\s*"AES256"/);
      });
    });
  });

  describe('Naming and tagging patterns', () => {
    test('uses prod- prefix and environment suffix in Name tags', () => {
      const nameTags = mainTfContent.match(/Name\s*=\s*"prod-[^"]*?\$\{local\.env_suffix\}"/g) || [];
      expect(nameTags.length).toBeGreaterThan(10);
    });

    test('uses common tags merged into resource tags', () => {
      const merges = mainTfContent.match(/tags\s*=\s*merge\(/g) || [];
      expect(merges.length).toBeGreaterThan(10);
      // Ensure reference exists
      expect(mainTfContent).toContain('local.common_tags');
    });
  });

  describe('No vpc_id runtime dependency', () => {
    test('does not require var.vpc_id anywhere', () => {
      expect(mainTfContent).not.toMatch(/\bvar\.vpc_id\b/);
      expect(mainTfContent).toMatch(/resource\s+"aws_vpc"\s+"prod_vpc"/);
    });
  });
});