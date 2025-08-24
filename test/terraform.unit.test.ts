const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

let terraformContent: string;
let providerContent: string;
let variablesContent: string;

beforeAll(() => {
  // Read Terraform files for static analysis (no AWS credentials required)
  const libDir = path.resolve(__dirname, '..', 'lib');
  terraformContent = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf8');
  providerContent = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf8');
  variablesContent = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
});

describe("Terraform Multi-Region Infrastructure", () => {
  test("Terraform version >= 1.0.0", () => {
    expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.0\.0"/);
  });

  test("All VPCs must have DNS support and hostnames enabled", () => {
    const vpcMatches = terraformContent.match(/resource\s+"aws_vpc"\s+"[^"]*"\s*{[^}]*}/g) || [];
    expect(vpcMatches.length).toBeGreaterThan(0);
    
    vpcMatches.forEach(vpc => {
      expect(vpc).toMatch(/enable_dns_support\s*=\s*true/);
      expect(vpc).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });
  });

  test("Each region must have at least 2 public and 2 private subnets", () => {
    // Check for subnet resources with count = 3 (3 subnets created per resource)
    const publicUsEast1Match = terraformContent.match(/resource\s+"aws_subnet"\s+"public_us_east_1"[\s\S]*?count\s*=\s*3/);
    const privateUsEast1Match = terraformContent.match(/resource\s+"aws_subnet"\s+"private_us_east_1"[\s\S]*?count\s*=\s*3/);
    const publicEuCentral1Match = terraformContent.match(/resource\s+"aws_subnet"\s+"public_eu_central_1"[\s\S]*?count\s*=\s*3/);
    const privateEuCentral1Match = terraformContent.match(/resource\s+"aws_subnet"\s+"private_eu_central_1"[\s\S]*?count\s*=\s*3/);
    
    expect(publicUsEast1Match).toBeTruthy();
    expect(privateUsEast1Match).toBeTruthy();
    expect(publicEuCentral1Match).toBeTruthy();
    expect(privateEuCentral1Match).toBeTruthy();
  });

  test("All Security Groups must restrict ingress to allowed CIDRs", () => {
    const sgMatches = terraformContent.match(/resource\s+"aws_security_group"[\s\S]*?(?=resource\s|$)/g) || [];
    
    sgMatches.forEach(sg => {
      // Check for ingress rules with ports 80 or 443
      const ingressRules = sg.match(/ingress\s*{[^}]*}/g) || [];
      ingressRules.forEach(rule => {
        if (rule.match(/from_port\s*=\s*(80|443)/) || rule.match(/to_port\s*=\s*(80|443)/)) {
          // Should not contain open CIDR
          expect(rule).not.toMatch(/cidr_blocks\s*=\s*\[.*"0\.0\.0\.0\/0".*\]/);
        }
      });
    });
  });

  test("All resources must have required tags", () => {
    const required = ["Owner", "Purpose", "Environment", "CostCenter", "Project"];
    
    // Check that common_tags variable contains all required tags
    const commonTagsMatch = variablesContent.match(/variable\s+"common_tags"[\s\S]*?default\s*=\s*{([^}]*)}/);
    expect(commonTagsMatch).toBeTruthy();
    
    if (commonTagsMatch) {
      const tagsContent = commonTagsMatch[1];
      required.forEach(tag => {
        expect(tagsContent).toMatch(new RegExp(tag + '\\s*='));
      });
    }
  });

  test("All data at rest must be encrypted with KMS", () => {
    // Check for KMS keys and encryption configuration
    expect(terraformContent).toMatch(/resource\s+"aws_kms_key"/);
    expect(terraformContent).toMatch(/resource\s+"aws_secretsmanager_secret"/);
    // Verify KMS keys are used for encryption
    expect(terraformContent).toMatch(/kms_key_id/);
  });

  test("IAM roles and policies must exist for security", () => {
    // Check for IAM resources instead of CloudTrail
    expect(terraformContent).toMatch(/resource\s+"aws_iam_role"/);
    expect(terraformContent).toMatch(/resource\s+"aws_iam_policy"/);
    expect(terraformContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"/);
  });

  test("Security groups must exist for network security", () => {
    const sgMatches = terraformContent.match(/resource\s+"aws_security_group"/g) || [];
    expect(sgMatches.length).toBeGreaterThanOrEqual(2); // multiple security groups
  });

  test("NAT gateways and internet gateways must exist for connectivity", () => {
    expect(terraformContent).toMatch(/resource\s+"aws_nat_gateway"/);
    expect(terraformContent).toMatch(/resource\s+"aws_internet_gateway"/);
  });

  test("VPC peering connection must exist", () => {
    expect(terraformContent).toMatch(/resource\s+"aws_vpc_peering_connection"/);
  });

  test("Application Load Balancers must be properly configured", () => {
    // Both regions should have ALBs
    expect(terraformContent).toMatch(/resource\s+"aws_lb"\s+"app_us_east_1"/);
    expect(terraformContent).toMatch(/resource\s+"aws_lb"\s+"app_eu_central_1"/);

    // ALBs should be public
    expect(terraformContent).toMatch(/internal\s*=\s*false/);
    
    // ALBs should have HTTPS listeners
    expect(terraformContent).toMatch(/resource\s+"aws_lb_listener"\s+"https_us_east_1"/);
    expect(terraformContent).toMatch(/resource\s+"aws_lb_listener"\s+"https_eu_central_1"/);
    
    // HTTP should redirect to HTTPS
    expect(terraformContent).toMatch(/type\s*=\s*"redirect"/);
    expect(terraformContent).toMatch(/protocol\s*=\s*"HTTPS"/);
  });

  test("WAF should be properly configured with security rules", () => {
    const wafMatch = terraformContent.match(/resource\s+"aws_wafv2_web_acl"\s+"cloudfront"\s*\{([\s\S]*?)(?=^resource|\Z)/m);
    expect(wafMatch).toBeTruthy();
    
    if (wafMatch) {
      const wafContent = wafMatch[1];
      
      // Check default action
      expect(wafContent).toMatch(/default_action\s*\{\s*allow\s*\{\s*\}\s*\}/);
      
      // Check rate limiting rule exists and has correct configuration
      expect(wafContent).toMatch(/name\s*=\s*"rate-limit"/);
      expect(wafContent).toMatch(/priority\s*=\s*1/);
      expect(wafContent).toMatch(/limit\s*=\s*var\.waf_rate_limit/);
      expect(wafContent).toMatch(/aggregate_key_type\s*=\s*"IP"/);
      
      // Check SQL injection rule exists and has correct configuration  
      expect(wafContent).toMatch(/name\s*=\s*"prevent-sql-injection"/);
      expect(wafContent).toMatch(/priority\s*=\s*2/);
      expect(wafContent).toMatch(/name\s*=\s*"AWSManagedRulesSQLiRuleSet"/);
      expect(wafContent).toMatch(/vendor_name\s*=\s*"AWS"/);
      
      // Check metrics configuration
      expect(wafContent).toMatch(/visibility_config\s*{[^}]*cloudwatch_metrics_enabled\s*=\s*true/);
      expect(wafContent).toMatch(/sampled_requests_enabled\s*=\s*true/);
      expect(wafContent).toMatch(/metric_name\s*=\s*"\${local\.name_prefix}-waf"/);
    }
  });

  test("CloudFront distribution should be properly configured", () => {
    const cfMatch = terraformContent.match(/resource\s+"aws_cloudfront_distribution"\s+"main"\s*\{([\s\S]*?)(?=^resource|\Z)/m);
    expect(cfMatch).toBeTruthy();
    
    if (cfMatch) {
      const cfContent = cfMatch[1];
      
      // Basic configuration
      expect(cfContent).toMatch(/enabled\s*=\s*true/);
      expect(cfContent).toMatch(/is_ipv6_enabled\s*=\s*true/);
      expect(cfContent).toMatch(/http_version\s*=\s*"http2and3"/);
      expect(cfContent).toMatch(/price_class\s*=\s*var\.cloudfront_price_class/);
      
      // Origins configuration
      ["us-east-1", "eu-central-1"].forEach(region => {
        const regionKey = region.replace(/-/g, '_');
        const originMatch = cfContent.match(new RegExp(`origin\\s*{[^}]*domain_name\\s*=\\s*aws_lb\\.app_${regionKey}\\.dns_name[\\s\\S]*?}[\\s\\S]*?}`));
        expect(originMatch).toBeTruthy();
        if (originMatch) {
          const origin = originMatch[0];
          expect(origin).toMatch(/origin_protocol_policy\s*=\s*"https-only"/);
          expect(origin).toMatch(/origin_ssl_protocols\s*=\s*\["TLSv1\.2"\]/);
          expect(origin).toMatch(/http_port\s*=\s*80/);
          expect(origin).toMatch(/https_port\s*=\s*443/);
        }
      });
      
      // Cache behavior configuration
      expect(cfContent).toMatch(/default_cache_behavior/);
      expect(cfContent).toMatch(/allowed_methods\s*=\s*var\.cloudfront_allowed_methods/);
      expect(cfContent).toMatch(/cached_methods\s*=\s*var\.cloudfront_cached_methods/);
      expect(cfContent).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
      expect(cfContent).toMatch(/min_ttl\s*=\s*0/);
      expect(cfContent).toMatch(/default_ttl\s*=\s*3600/);
      expect(cfContent).toMatch(/max_ttl\s*=\s*86400/);
      
      // SSL/TLS configuration
      const viewerCert = cfContent.match(/viewer_certificate\s*{([^}]*)}/);
      expect(viewerCert).toBeTruthy();
      if (viewerCert) {
        const certConfig = viewerCert[1];
        expect(certConfig).toMatch(/acm_certificate_arn\s*=\s*aws_acm_certificate\.main\.arn/);
        expect(certConfig).toMatch(/ssl_support_method\s*=\s*"sni-only"/);
        expect(certConfig).toMatch(/minimum_protocol_version\s*=\s*"TLSv1\.2_2021"/);
      }
      
      // Geo restrictions
      expect(cfContent).toMatch(/restrictions\s*{[^}]*geo_restriction\s*{[^}]*restriction_type\s*=\s*"none"/);
    }
  });

  test("Route53 should support blue-green deployment", () => {
    // Check for required DNS records
    expect(terraformContent).toMatch(/resource\s+"aws_route53_record"\s+"app_blue"/);
    expect(terraformContent).toMatch(/resource\s+"aws_route53_record"\s+"app_green"/);
    expect(terraformContent).toMatch(/resource\s+"aws_route53_record"\s+"app_main"/);
    
    // Check for proper aliases
    expect(terraformContent).toMatch(/name\s*=\s*"blue\.\${var\.domain_name}"/);
    expect(terraformContent).toMatch(/name\s*=\s*"green\.\${var\.domain_name}"/);
    
    // Check for dynamic routing based on active color
    expect(terraformContent).toMatch(/name\s*=\s*var\.blue_green_deployment\.active_color\s*==\s*"blue"\s*\?\s*aws_route53_record\.app_blue\.name/);
  });

  test("Certificates should be properly configured", () => {
    // Check for ACM certificate
    expect(terraformContent).toMatch(/resource\s+"aws_acm_certificate"\s+"main"/);
    expect(terraformContent).toMatch(/validation_method\s*=\s*"DNS"/);
    
    // Check for DNS validation
    expect(terraformContent).toMatch(/resource\s+"aws_route53_record"\s+"cert_validation"/);
    expect(terraformContent).toMatch(/resource\s+"aws_acm_certificate_validation"\s+"main"/);
  });

  test("Required variables should be properly defined", () => {
    // Check environment variable
    expect(variablesContent).toMatch(/variable\s+"environment"\s*{[^}]*type\s*=\s*string/);
    expect(variablesContent).toMatch(/validation\s*{[^}]*contains\(\["dev",\s*"stage",\s*"prod"\]/);

    // Check regions variable
    expect(variablesContent).toMatch(/variable\s+"regions"\s*{[^}]*type\s*=\s*list\(string\)/);
    expect(variablesContent).toMatch(/default\s*=\s*\["us-east-1",\s*"eu-central-1"\]/);

    // Check allowed_ingress_cidrs
    expect(variablesContent).toMatch(/variable\s+"allowed_ingress_cidrs"\s*{[^}]*type\s*=\s*list\(string\)/);
    expect(variablesContent).toMatch(/default\s*=\s*\[\s*"10\.0\.0\.0\/8",\s*"172\.16\.0\.0\/12",\s*"192\.168\.0\.0\/16"\s*\]/);

    // Check blue_green_deployment variable and its active_color validation
    expect(variablesContent).toMatch(/variable\s+"blue_green_deployment"\s*{[^}]*type\s*=\s*object\(\{/);
    expect(variablesContent).toMatch(/validation\s*{[^}]*condition\s*=\s*contains\(\["blue",\s*"green"\],\s*var\.blue_green_deployment\.active_color\)/);
  });

  test("Local values should be correctly configured", () => {
    // Check name_prefix local
    expect(terraformContent).toMatch(/locals\s*{[^}]*name_prefix\s*=\s*"\${var\.environment}-tap-stack"/);

    // Check VPC configuration from variables
    expect(variablesContent).toMatch(/variable\s+"vpc_config"\s*{[^}]*type\s*=\s*map\(object\(\{[^}]*\}\)\)/);
    expect(variablesContent).toMatch(/"us-east-1"\s*=\s*{[^}]*azs\s*=\s*\[\s*"us-east-1a",\s*"us-east-1b",\s*"us-east-1c"\s*\]/);
    expect(variablesContent).toMatch(/"eu-central-1"\s*=\s*{[^}]*azs\s*=\s*\[\s*"eu-central-1a",\s*"eu-central-1b",\s*"eu-central-1c"\s*\]/);
    expect(variablesContent).toMatch(/"us-east-1"\s*=\s*{[^}]*cidr\s*=\s*"10\.0\.0\.0\/16"/);
    expect(variablesContent).toMatch(/"eu-central-1"\s*=\s*{[^}]*cidr\s*=\s*"10\.1\.0\.0\/16"/);
  });

  test("Data sources should be properly configured", () => {
    // Check AWS data sources
    expect(terraformContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{}/);
    expect(terraformContent).toMatch(/data\s+"aws_partition"\s+"current"\s*{}/);

    // Check AMI data sources
    const usEastAmi = terraformContent.match(/data\s+"aws_ami"\s+"amazon_linux_us_east_1"\s*{([^}]*)}/s);
    const euCentralAmi = terraformContent.match(/data\s+"aws_ami"\s+"amazon_linux_eu_central_1"\s*{([^}]*)}/s);

    expect(usEastAmi).toBeTruthy();
    expect(euCentralAmi).toBeTruthy();

    if (usEastAmi && euCentralAmi) {
      // Validate AMI configurations
      [usEastAmi[1], euCentralAmi[1]].forEach(amiConfig => {
        expect(amiConfig).toMatch(/most_recent\s*=\s*true/);
        expect(amiConfig).toMatch(/owners\s*=\s*\[\s*"amazon"\s*\]/);
        expect(amiConfig).toMatch(/filter\s*{[^}]*name\s*=\s*"name"[^}]*values\s*=\s*\[\s*"amzn2-ami-hvm-\*-x86_64-gp2"\s*\]/);
      });
    }
  });

  test("Random resources should be properly configured", () => {
    const randomIdMatch = terraformContent.match(/resource\s+"random_id"\s+"suffix"\s*{([^}]*)}/s);
    expect(randomIdMatch).toBeTruthy();
    
    if (randomIdMatch) {
      expect(randomIdMatch[1]).toMatch(/byte_length\s*=\s*4/);
    }
  });

    test("KMS keys should be properly configured for both regions", () => {
    const regions = ["us_east_1", "eu_central_1"];
    
    regions.forEach(region => {
      const kmsMatch = terraformContent.match(new RegExp(`resource\\s+"aws_kms_key"\\s+"main_${region}"\\s*\\{([\\s\\S]*?)(?=^resource|\\Z)`, 'm'));
      expect(kmsMatch).toBeTruthy();
      
      if (kmsMatch) {
        const kmsConfig = kmsMatch[1];
        expect(kmsConfig).toMatch(/deletion_window_in_days\s*=\s*7/);
        expect(kmsConfig).toMatch(/enable_key_rotation\s*=\s*true/);
        expect(kmsConfig).toMatch(/description\s*=\s*"KMS key for \$\{var\.environment/);
      }      // Check KMS alias
      expect(terraformContent).toMatch(new RegExp(`resource\\s+"aws_kms_alias"\\s+"main_${region}"`));
    });
  });

  test("VPC configurations should be consistent across regions", () => {
    const regions = ["us_east_1", "eu_central_1"];
    
    regions.forEach(region => {
      const vpcMatch = terraformContent.match(new RegExp(`resource\\s+"aws_vpc"\\s+"main_${region}"\\s*{([^}]*)}`));
      expect(vpcMatch).toBeTruthy();
      
      if (vpcMatch) {
        const vpcConfig = vpcMatch[1];
        expect(vpcConfig).toMatch(/enable_dns_hostnames\s*=\s*true/);
        expect(vpcConfig).toMatch(/enable_dns_support\s*=\s*true/);
        expect(vpcConfig).toMatch(/cidr_block\s*=\s*local\.az_config\[/);
      }

      // Check for associated resources
      expect(terraformContent).toMatch(new RegExp(`resource\\s+"aws_internet_gateway"\\s+"main_${region}"`));
      expect(terraformContent).toMatch(new RegExp(`resource\\s+"aws_subnet"\\s+"public_${region}"`));
      expect(terraformContent).toMatch(new RegExp(`resource\\s+"aws_subnet"\\s+"private_${region}"`));
      expect(terraformContent).toMatch(new RegExp(`resource\\s+"aws_route_table"\\s+"public_${region}"`));
      expect(terraformContent).toMatch(new RegExp(`resource\\s+"aws_route_table"\\s+"private_${region}"`));
    });
  });

  test("NAT Gateway configuration should be highly available", () => {
    const regions = ["us_east_1", "eu_central_1"];
    
    regions.forEach(region => {
      // Check EIP configurations
      const eipMatch = terraformContent.match(new RegExp(`resource\\s+"aws_eip"\\s+"nat_${region}"\\s*{([^}]*)}`));
      expect(eipMatch).toBeTruthy();
      
      if (eipMatch) {
        expect(eipMatch[1]).toMatch(/domain\s*=\s*"vpc"/);
      }

      // Check NAT Gateway configurations
      const natMatch = terraformContent.match(new RegExp(`resource\\s+"aws_nat_gateway"\\s+"main_${region}"\\s*{([^}]*)}`));
      expect(natMatch).toBeTruthy();
      
      if (natMatch) {
        const natConfig = natMatch[1];
        expect(natConfig).toMatch(/count\s*=\s*3/);
        expect(natConfig).toMatch(new RegExp(`allocation_id\\s*=\\s*aws_eip\\.nat_${region}\\[count\\.index\\]\\.id`));
        expect(natConfig).toMatch(new RegExp(`subnet_id\\s*=\\s*aws_subnet\\.public_${region}\\[count\\.index\\]\\.id`));
      }
    });
  });

  test("Route tables should have proper routes configured", () => {
    const regions = ["us_east_1", "eu_central_1"];
    
    regions.forEach(region => {
      // Public route table
      const publicRtMatch = terraformContent.match(new RegExp(`resource\\s+"aws_route_table"\\s+"public_${region}"\\s*{([^}]*)}`));
      expect(publicRtMatch).toBeTruthy();
      
      if (publicRtMatch) {
        expect(publicRtMatch[1]).toMatch(/route\s*{[^}]*cidr_block\s*=\s*"0\.0\.0\.0\/0"[^}]*gateway_id\s*=\s*aws_internet_gateway/);
      }

      // Private route table
      const privateRtMatch = terraformContent.match(new RegExp(`resource\\s+"aws_route_table"\\s+"private_${region}"\\s*{([^}]*)}`));
      expect(privateRtMatch).toBeTruthy();
      
      if (privateRtMatch) {
        expect(privateRtMatch[1]).toMatch(/route\s*{[^}]*cidr_block\s*=\s*"0\.0\.0\.0\/0"[^}]*nat_gateway_id\s*=\s*aws_nat_gateway/);
      }
    });
  });

  test("Secrets Manager configuration should be complete and secure", () => {
    const regions = ["us_east_1", "eu_central_1"];
    
    regions.forEach(region => {
      // Check secret configuration
      const secretMatch = terraformContent.match(new RegExp(`resource\\s+"aws_secretsmanager_secret"\\s+"app_secrets_${region}"\\s*\\{([\\s\\S]*?)(?=^resource|\\Z)`, 'm'));
      expect(secretMatch).toBeTruthy();
      
      if (secretMatch) {
        const secretConfig = secretMatch[1];
        expect(secretConfig).toMatch(new RegExp(`kms_key_id\\s*=\\s*aws_kms_key\\.main_${region}\\.arn`));
        expect(secretConfig).toMatch(/recovery_window_in_days\s*=\s*7/);
        expect(secretConfig).toMatch(/name\s*=\s*"\${local\.name_prefix}-app-secrets/);
      }

      // Check secret version configuration
      const secretVersionMatch = terraformContent.match(new RegExp(`resource\\s+"aws_secretsmanager_secret_version"\\s+"app_secrets_${region}"\\s*\\{([\\s\\S]*?)(?=^resource|\\Z)`, 'm'));
      expect(secretVersionMatch).toBeTruthy();
      
      if (secretVersionMatch) {
        const versionConfig = secretVersionMatch[1];
        expect(versionConfig).toMatch(new RegExp(`secret_id\\s*=\\s*aws_secretsmanager_secret\\.app_secrets_${region}\\.id`));
        expect(versionConfig).toMatch(/secret_string\s*=\s*jsonencode\({/);
        // Verify required secret keys
        expect(versionConfig).toMatch(/database_url/);
        expect(versionConfig).toMatch(/api_key/);
        expect(versionConfig).toMatch(/jwt_secret/);
      }
    });
  });

  test("IAM roles and policies should have proper permissions", () => {
    const regions = ["us_east_1", "eu_central_1"];
    
    regions.forEach(region => {
      // Check IAM role configuration
      const roleMatch = terraformContent.match(new RegExp(`resource\\s+"aws_iam_role"\\s+"app_role_${region}"\\s*\\{([\\s\\S]*?)(?=^resource|\\Z)`, 'm'));
      expect(roleMatch).toBeTruthy();
      
      if (roleMatch) {
        const roleConfig = roleMatch[1];
        expect(roleConfig).toMatch(/name_prefix\s*=\s*"\${var\.environment}-app-\${random_id\.suffix\.hex}-"/);
        expect(roleConfig).toMatch(/assume_role_policy\s*=\s*jsonencode\({[^}]*Service\s*=\s*"ec2\.amazonaws\.com"/);
      }

      // Check IAM policy configuration
      const policyMatch = terraformContent.match(new RegExp(`resource\\s+"aws_iam_policy"\\s+"app_secrets_policy_${region}"\\s*\\{([\\s\\S]*?)(?=^resource|\\Z)`, 'm'));
      expect(policyMatch).toBeTruthy();
      
      if (policyMatch) {
        const policyConfig = policyMatch[1];
        expect(policyConfig).toMatch(/name_prefix\s*=\s*"\${local\.name_prefix}-app-secrets-[^"]*-"/);
        expect(policyConfig).toMatch(/policy\s*=\s*jsonencode\(\{[^}]*Action\s*=\s*\[\s*"secretsmanager:GetSecretValue"[^\]]*\]/);
        expect(policyConfig).toMatch(new RegExp(`Resource\\s*=\\s*aws_secretsmanager_secret\\.app_secrets_${region}\\.arn`));
      }

      // Check instance profile
      const profileMatch = terraformContent.match(new RegExp(`resource\\s+"aws_iam_instance_profile"\\s+"app_profile_${region}"\\s*\\{([\\s\\S]*?)(?=^resource|\\Z)`, 'm'));
      expect(profileMatch).toBeTruthy();
      
      if (profileMatch) {
        const profileConfig = profileMatch[1];
        expect(profileConfig).toMatch(/name_prefix\s*=\s*"\${local\.name_prefix}-app-profile-[^"]*-"/);
        expect(profileConfig).toMatch(new RegExp(`role\\s*=\\s*aws_iam_role\\.app_role_${region}\\.name`));
      }
    });
  });

  test("VPC peering should be properly configured with routes", () => {
    // Check peering connection configuration
    const peeringMatch = terraformContent.match(/resource\s+"aws_vpc_peering_connection"\s+"main"\s*{([^}]*)}/);
    expect(peeringMatch).toBeTruthy();
    
    if (peeringMatch) {
      const peeringConfig = peeringMatch[1];
      expect(peeringConfig).toMatch(/vpc_id\s*=\s*aws_vpc\.main_us_east_1\.id/);
      expect(peeringConfig).toMatch(/peer_vpc_id\s*=\s*aws_vpc\.main_eu_central_1\.id/);
      expect(peeringConfig).toMatch(/peer_region\s*=\s*"eu-central-1"/);
      expect(peeringConfig).toMatch(/auto_accept\s*=\s*false/);
    }

    // Check peering accepter configuration
    const accepterMatch = terraformContent.match(/resource\s+"aws_vpc_peering_connection_accepter"\s+"main"\s*{([^}]*)}/);
    expect(accepterMatch).toBeTruthy();
    
    if (accepterMatch) {
      expect(accepterMatch[1]).toMatch(/auto_accept\s*=\s*true/);
    }

    // Check peering routes
    const regions = ["us_east_1", "eu_central_1"];
    regions.forEach(region => {
      const otherRegion = region === "us_east_1" ? "eu_central_1" : "us_east_1";
      const routeMatch = terraformContent.match(new RegExp(`resource\\s+"aws_route"\\s+"${region}_to_${otherRegion}"\\s*{([^}]*)}`));
      expect(routeMatch).toBeTruthy();
      
      if (routeMatch) {
        const routeConfig = routeMatch[1];
        expect(routeConfig).toMatch(/count\s*=\s*3/);
        expect(routeConfig).toMatch(new RegExp(`route_table_id\\s*=\\s*aws_route_table\\.private_${region}\\[count\\.index\\]\\.id`));
        expect(routeConfig).toMatch(/destination_cidr_block\s*=\s*local\.az_config\[[^\]]+\]\.cidr/);
        expect(routeConfig).toMatch(/vpc_peering_connection_id\s*=\s*aws_vpc_peering_connection\.main\.id/);
      }
    });
  });

  test("Security group rules should have proper descriptions", () => {
    const regions = ["us_east_1", "eu_central_1"];
    
    regions.forEach(region => {
      // ALB security group
      const albSgMatch = terraformContent.match(new RegExp(`resource\\s+"aws_security_group"\\s+"alb_${region}"\\s*{([^}]*)}`));
      expect(albSgMatch).toBeTruthy();
      
      if (albSgMatch) {
        const sgConfig = albSgMatch[1];
        expect(terraformContent).toMatch(/description\s*=\s*"HTTPS from allowed CIDRs"/);
        expect(terraformContent).toMatch(/description\s*=\s*"HTTP from allowed CIDRs"/);
      }

      // App security group - check for HTTP from ALB description in ingress rules
      const appSgMatch = terraformContent.match(new RegExp(`resource\\s+"aws_security_group"\\s+"app_${region}"\\s*\\{[\\s\\S]*?(?=^resource|\\Z)`, 'm'));
      expect(appSgMatch).toBeTruthy();
      
      if (appSgMatch) {
        const sgConfig = appSgMatch[0];
        expect(sgConfig).toMatch(/description\s*=\s*"HTTP from ALB"/);
      }
    });
  });

  test("Auto Scaling Groups must be properly configured", () => {
    // Check for ASG resources with extended regex to capture full resource blocks
    const asgBlueMatch = terraformContent.match(/resource\s+"aws_autoscaling_group"\s+"app_blue_us_east_1"\s*{[\s\S]*?(?=^resource\s|^}$|\n}$)/m);
    const asgGreenMatch = terraformContent.match(/resource\s+"aws_autoscaling_group"\s+"app_green_eu_central_1"\s*{[\s\S]*?(?=^resource\s|^}$|\n}$)/m);
    
    expect(asgBlueMatch).toBeTruthy();
    expect(asgGreenMatch).toBeTruthy();
    
    if (asgBlueMatch) {
      expect(asgBlueMatch[0]).toMatch(/health_check_type\s*=\s*"ELB"/);
      expect(asgBlueMatch[0]).toMatch(/target_group_arns\s*=\s*\[aws_lb_target_group\.app_us_east_1\.arn\]/);
    }
    
    if (asgGreenMatch) {
      expect(asgGreenMatch[0]).toMatch(/health_check_type\s*=\s*"ELB"/);
      expect(asgGreenMatch[0]).toMatch(/target_group_arns\s*=\s*\[aws_lb_target_group\.app_eu_central_1\.arn\]/);
    }
  });

  test("Launch Templates must be properly configured with security features", () => {
    // Check for launch template resources
    const ltUsEast1Match = terraformContent.match(/resource\s+"aws_launch_template"\s+"app_us_east_1"\s*{[\s\S]*?(?=resource\s|$)/);
    const ltEuCentral1Match = terraformContent.match(/resource\s+"aws_launch_template"\s+"app_eu_central_1"\s*{[\s\S]*?(?=resource\s|$)/);
    
    expect(ltUsEast1Match).toBeTruthy();
    expect(ltEuCentral1Match).toBeTruthy();
    
    [ltUsEast1Match, ltEuCentral1Match].forEach((ltMatch, index) => {
      if (ltMatch) {
        const ltConfig = ltMatch[0];
        // Check for encrypted EBS volumes
        expect(ltConfig).toMatch(/encrypted\s*=\s*true/);
        // Check for monitoring enabled
        expect(ltConfig).toMatch(/monitoring\s*{[\s\S]*?enabled\s*=\s*true/);
        // Check for IAM instance profile
        expect(ltConfig).toMatch(/iam_instance_profile\s*{/);
        // Check for security group association
        expect(ltConfig).toMatch(/vpc_security_group_ids\s*=\s*\[/);
      }
    });
  });

  test("Auto Scaling Policies and CloudWatch Alarms must be configured", () => {
    // Check for scaling policies
    const scaleUpPolicies = terraformContent.match(/resource\s+"aws_autoscaling_policy"\s+"scale_up_[^"]*"/g) || [];
    const scaleDownPolicies = terraformContent.match(/resource\s+"aws_autoscaling_policy"\s+"scale_down_[^"]*"/g) || [];
    
    expect(scaleUpPolicies.length).toBeGreaterThanOrEqual(2); // One for each region
    expect(scaleDownPolicies.length).toBeGreaterThanOrEqual(2); // One for each region
    
    // Check for CloudWatch alarms
    const highCpuAlarms = terraformContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu_[^"]*"/g) || [];
    const lowCpuAlarms = terraformContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"low_cpu_[^"]*"/g) || [];
    
    expect(highCpuAlarms.length).toBeGreaterThanOrEqual(2); // One for each region
    expect(lowCpuAlarms.length).toBeGreaterThanOrEqual(2); // One for each region
  });

  test("CloudTrail must be properly configured for audit compliance", () => {
    // Check for CloudTrail resource
    const cloudTrailMatch = terraformContent.match(/resource\s+"aws_cloudtrail"\s+"main"\s*{[\s\S]*?(?=resource\s|$)/);
    expect(cloudTrailMatch).toBeTruthy();
    
    if (cloudTrailMatch) {
      const cloudTrailConfig = cloudTrailMatch[0];
      // Check multi-region trail
      expect(cloudTrailConfig).toMatch(/is_multi_region_trail\s*=\s*true/);
      // Check log file validation
      expect(cloudTrailConfig).toMatch(/enable_log_file_validation\s*=\s*true/);
      // Check KMS encryption
      expect(cloudTrailConfig).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main_us_east_1\.arn/);
      // Check S3 bucket
      expect(cloudTrailConfig).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.cloudtrail_logs\.id/);
      // Check CloudWatch integration
      expect(cloudTrailConfig).toMatch(/cloud_watch_logs_group_arn/);
    }
  });

  test("CloudTrail S3 bucket must be properly secured", () => {
    // Check for S3 bucket for CloudTrail
    const s3BucketMatch = terraformContent.match(/resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"\s*{[\s\S]*?(?=resource\s|$)/);
    expect(s3BucketMatch).toBeTruthy();
    
    // Check for S3 encryption
    const s3EncryptionMatch = terraformContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail_logs"/);
    expect(s3EncryptionMatch).toBeTruthy();
    
    // Check for S3 public access block
    const s3PublicBlockMatch = terraformContent.match(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail_logs"/);
    expect(s3PublicBlockMatch).toBeTruthy();
    
    // Check for S3 versioning
    const s3VersioningMatch = terraformContent.match(/resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail_logs"/);
    expect(s3VersioningMatch).toBeTruthy();
  });

  test("ASG variables must be properly defined", () => {
    // Check for ASG-specific variables
    expect(variablesContent).toMatch(/variable\s+"asg_min_size"/);
    expect(variablesContent).toMatch(/variable\s+"asg_max_size"/);
    expect(variablesContent).toMatch(/variable\s+"asg_desired_capacity"/);
    expect(variablesContent).toMatch(/variable\s+"asg_health_check_type"/);
  });
});