// Unit tests for Terraform infrastructure files
import fs from "fs";
import path from "path";

const libPath = path.resolve(__dirname, "../lib");

describe("Terraform Infrastructure Unit Tests", () => {
  describe("Core Configuration Files", () => {
    test("provider.tf exists and contains AWS provider", () => {
      const providerPath = path.join(libPath, "provider.tf");
      expect(fs.existsSync(providerPath)).toBe(true);

      const content = fs.readFileSync(providerPath, "utf8");
      expect(content).toMatch(/provider\s+"aws"/);
      expect(content).toMatch(/required_providers/);
    });

    test("variables.tf exists and defines required variables", () => {
      const variablesPath = path.join(libPath, "variables.tf");
      expect(fs.existsSync(variablesPath)).toBe(true);

      const content = fs.readFileSync(variablesPath, "utf8");
      expect(content).toMatch(/variable\s+"aws_region"/);
      expect(content).toMatch(/variable\s+"environment_suffix"/);
      expect(content).toMatch(/variable\s+"vpc_cidr"/);
      expect(content).toMatch(/variable\s+"project_name"/);
      expect(content).toMatch(/locals\s*{/);
      expect(content).toMatch(/name_prefix/);
    });

    test("outputs.tf exists and defines infrastructure outputs", () => {
      const outputsPath = path.join(libPath, "outputs.tf");
      expect(fs.existsSync(outputsPath)).toBe(true);

      const content = fs.readFileSync(outputsPath, "utf8");
      expect(content).toMatch(/output\s+"vpc_id"/);
      expect(content).toMatch(/output\s+"alb_dns_name"/);
      expect(content).toMatch(/output\s+"aurora_cluster_endpoint"/);
      expect(content).toMatch(/output\s+"redis_primary_endpoint"/);
      expect(content).toMatch(/output\s+"s3_bucket_name"/);
      expect(content).toMatch(/output\s+"cloudfront_distribution_id"/);
    });

    test("data.tf exists and defines data sources", () => {
      const dataPath = path.join(libPath, "data.tf");
      expect(fs.existsSync(dataPath)).toBe(true);

      const content = fs.readFileSync(dataPath, "utf8");
      expect(content).toMatch(/data\s+"aws_availability_zones"/);
      expect(content).toMatch(/data\s+"aws_ami"/);
      expect(content).toMatch(/data\s+"aws_caller_identity"/);
    });
  });

  describe("VPC and Networking", () => {
    test("vpc.tf exists and defines VPC resources", () => {
      const vpcPath = path.join(libPath, "vpc.tf");
      expect(fs.existsSync(vpcPath)).toBe(true);

      const content = fs.readFileSync(vpcPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(content).toMatch(/resource\s+"aws_internet_gateway"/);
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"database"/);
      expect(content).toMatch(/resource\s+"aws_nat_gateway"/);
      expect(content).toMatch(/resource\s+"aws_eip"/);
    });

    test("VPC uses environment_suffix in naming", () => {
      const vpcPath = path.join(libPath, "vpc.tf");
      const content = fs.readFileSync(vpcPath, "utf8");
      expect(content).toMatch(/local\.name_prefix/);
    });

    test("security_groups.tf defines all required security groups", () => {
      const sgPath = path.join(libPath, "security_groups.tf");
      expect(fs.existsSync(sgPath)).toBe(true);

      const content = fs.readFileSync(sgPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"web"/);
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"redis"/);
      expect(content).toMatch(/resource\s+"aws_security_group"\s+"database"/);
    });
  });

  describe("Compute Resources", () => {
    test("autoscaling.tf defines launch template and ASG", () => {
      const asgPath = path.join(libPath, "autoscaling.tf");
      expect(fs.existsSync(asgPath)).toBe(true);

      const content = fs.readFileSync(asgPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_launch_template"\s+"web"/);
      expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"web"/);
      expect(content).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_up"/);
      expect(content).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_down"/);
    });

    test("user_data.sh script exists", () => {
      const userDataPath = path.join(libPath, "user_data.sh");
      expect(fs.existsSync(userDataPath)).toBe(true);

      const content = fs.readFileSync(userDataPath, "utf8");
      expect(content).toMatch(/redis_endpoint/);
      expect(content).toMatch(/db_endpoint/);
      expect(content).toMatch(/s3_bucket/);
      expect(content).toMatch(/cloudfront_domain/);
    });

    test("iam.tf defines EC2 instance role and policies", () => {
      const iamPath = path.join(libPath, "iam.tf");
      expect(fs.existsSync(iamPath)).toBe(true);

      const content = fs.readFileSync(iamPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"web"/);
      expect(content).toMatch(/resource\s+"aws_iam_instance_profile"\s+"web"/);
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"web_s3_access"/);
    });
  });

  describe("Load Balancer", () => {
    test("alb.tf defines ALB resources", () => {
      const albPath = path.join(libPath, "alb.tf");
      expect(fs.existsSync(albPath)).toBe(true);

      const content = fs.readFileSync(albPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(content).toMatch(/resource\s+"aws_lb_target_group"\s+"web"/);
      expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"http"/);
      expect(content).toMatch(/resource\s+"aws_lb_listener"\s+"https"/);
      expect(content).toMatch(/resource\s+"aws_acm_certificate"/);
    });

    test("ALB has deregistration_delay set to 30 seconds", () => {
      const albPath = path.join(libPath, "alb.tf");
      const content = fs.readFileSync(albPath, "utf8");
      expect(content).toMatch(/deregistration_delay\s*=\s*30/);
    });
  });

  describe("Database", () => {
    test("rds.tf defines Aurora Serverless v2 cluster", () => {
      const rdsPath = path.join(libPath, "rds.tf");
      expect(fs.existsSync(rdsPath)).toBe(true);

      const content = fs.readFileSync(rdsPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"/);
      expect(content).toMatch(/engine\s*=\s*"aurora-postgresql"/);
      expect(content).toMatch(/engine_mode\s*=\s*"provisioned"/);
      expect(content).toMatch(/serverlessv2_scaling_configuration/);
      expect(content).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test("RDS has exactly 2 read replicas", () => {
      const rdsPath = path.join(libPath, "rds.tf");
      const content = fs.readFileSync(rdsPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"aurora_reader"/);
      expect(content).toMatch(/count\s*=\s*2/);
    });

    test("RDS instances use db.serverless class", () => {
      const rdsPath = path.join(libPath, "rds.tf");
      const content = fs.readFileSync(rdsPath, "utf8");
      expect(content).toMatch(/instance_class\s*=\s*"db\.serverless"/);
    });
  });

  describe("Cache", () => {
    test("elasticache.tf defines Redis cluster", () => {
      const cachePath = path.join(libPath, "elasticache.tf");
      expect(fs.existsSync(cachePath)).toBe(true);

      const content = fs.readFileSync(cachePath, "utf8");
      expect(content).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"redis"/);
      expect(content).toMatch(/engine\s*=\s*"redis"/);
      expect(content).toMatch(/automatic_failover_enabled\s*=\s*true/);
    });
  });

  describe("Storage", () => {
    test("s3.tf defines media bucket with proper configuration", () => {
      const s3Path = path.join(libPath, "s3.tf");
      expect(fs.existsSync(s3Path)).toBe(true);

      const content = fs.readFileSync(s3Path, "utf8");
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"media"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
      expect(content).toMatch(/resource\s+"aws_s3_bucket_cors_configuration"/);
    });

    test("S3 bucket name includes environment suffix", () => {
      const s3Path = path.join(libPath, "s3.tf");
      const content = fs.readFileSync(s3Path, "utf8");
      expect(content).toMatch(/local\.name_prefix/);
    });
  });

  describe("CDN", () => {
    test("cloudfront.tf defines CloudFront distribution", () => {
      const cfPath = path.join(libPath, "cloudfront.tf");
      expect(fs.existsSync(cfPath)).toBe(true);

      const content = fs.readFileSync(cfPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"media"/);
      expect(content).toMatch(/resource\s+"aws_cloudfront_origin_access_control"/);
    });

    test("CloudFront has continuous deployment configured", () => {
      const cfPath = path.join(libPath, "cloudfront.tf");
      const content = fs.readFileSync(cfPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_cloudfront_continuous_deployment_policy"/);
      expect(content).toMatch(/continuous_deployment_policy_id/);
      expect(content).toMatch(/staging_distribution_dns_names/);
    });
  });

  describe("Monitoring", () => {
    test("cloudwatch.tf defines dashboard and alarms", () => {
      const cwPath = path.join(libPath, "cloudwatch.tf");
      expect(fs.existsSync(cwPath)).toBe(true);

      const content = fs.readFileSync(cwPath, "utf8");
      expect(content).toMatch(/resource\s+"aws_cloudwatch_dashboard"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
    });
  });

  describe("Resource Naming Convention", () => {
    test("All resource files use local.name_prefix for naming", () => {
      const files = [
        "vpc.tf",
        "alb.tf",
        "autoscaling.tf",
        "rds.tf",
        "elasticache.tf",
        "s3.tf",
        "cloudfront.tf",
        "cloudwatch.tf",
        "iam.tf",
        "security_groups.tf"
      ];

      files.forEach(file => {
        const filePath = path.join(libPath, file);
        const content = fs.readFileSync(filePath, "utf8");
        expect(content).toMatch(/local\.name_prefix/);
      });
    });
  });
});
