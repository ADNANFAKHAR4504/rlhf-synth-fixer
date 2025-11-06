// test/terraform.unit.test.ts
// Unit tests for Terraform EKS Fargate infrastructure
// Tests file structure, syntax, naming conventions, and resource configurations

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || "test";

// Helper function to read Terraform file content
function readTerraformFile(filename: string): string {
  const filePath = path.join(LIB_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return "";
  }
  return fs.readFileSync(filePath, "utf-8");
}

// Helper function to check if file exists
function fileExists(filename: string): boolean {
  return fs.existsSync(path.join(LIB_DIR, filename));
}

// Helper function to extract resource blocks
function extractResources(content: string, resourceType: string): string[] {
  const regex = new RegExp(
    `resource\\s+"${resourceType}"\\s+"[^"]+"\\s*{[^}]*}`,
    "gs"
  );
  const matches = content.match(regex);
  return matches || [];
}

describe("Terraform EKS Fargate Infrastructure - Unit Tests", () => {
  describe("Suite 1: File Structure and Existence", () => {
    test("should have main.tf file", () => {
      expect(fileExists("main.tf")).toBe(true);
    });

    test("should have variables.tf file", () => {
      expect(fileExists("variables.tf")).toBe(true);
    });

    test("should have outputs.tf file", () => {
      expect(fileExists("outputs.tf")).toBe(true);
    });

    test("should have eks-cluster.tf file", () => {
      expect(fileExists("eks-cluster.tf")).toBe(true);
    });

    test("should have fargate.tf file", () => {
      expect(fileExists("fargate.tf")).toBe(true);
    });

    test("should have eks-addons.tf file", () => {
      expect(fileExists("eks-addons.tf")).toBe(true);
    });

    test("should have load-balancer-controller.tf file", () => {
      expect(fileExists("load-balancer-controller.tf")).toBe(true);
    });
  });

  describe("Suite 2: Variables Validation", () => {
    test("should define environment_suffix variable", () => {
      const content = readTerraformFile("variables.tf");
      expect(content).toMatch(/variable\s+"environment_suffix"\s*{/);
      expect(content).toMatch(/description\s*=\s*"Unique suffix/);
      expect(content).toMatch(/type\s*=\s*string/);
    });

    test("should define region variable", () => {
      const content = readTerraformFile("variables.tf");
      expect(content).toMatch(/variable\s+"region"\s*{/);
      expect(content).toMatch(/description\s*=\s*"AWS region/);
    });

    test("should define cluster_version variable", () => {
      const content = readTerraformFile("variables.tf");
      expect(content).toMatch(/variable\s+"cluster_version"\s*{/);
      expect(content).toMatch(/description\s*=\s*"Kubernetes version/);
    });

    test("should define cluster_name variable", () => {
      const content = readTerraformFile("variables.tf");
      expect(content).toMatch(/variable\s+"cluster_name"\s*{/);
    });

    test("should define vpc_cidr variable", () => {
      const content = readTerraformFile("variables.tf");
      expect(content).toMatch(/variable\s+"vpc_cidr"\s*{/);
      expect(content).toMatch(/description\s*=\s*"CIDR block/);
    });

    test("should define availability_zones variable", () => {
      const content = readTerraformFile("variables.tf");
      expect(content).toMatch(/variable\s+"availability_zones"\s*{/);
      expect(content).toMatch(/type\s*=\s*list\(string\)/);
    });
  });

  describe("Suite 3: VPC and Networking Resources", () => {
    test("should define VPC resource with correct configuration", () => {
      const content = readTerraformFile("main.tf");
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(content).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      expect(content).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(content).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("should define VPC with environment_suffix in tags", () => {
      const content = readTerraformFile("main.tf");
      expect(content).toMatch(
        /Name\s*=\s*"[^"]*-\$\{var\.environment_suffix\}"/
      );
    });

    test("should define Internet Gateway", () => {
      const content = readTerraformFile("main.tf");
      expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
      expect(content).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    // test("should define public subnets", () => {
    //   const content = readTerraformFile("main.tf");
    //   expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
    //   expect(content).toMatch(/count\s*=\s*2/);
    //   expect(content).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    // });

    // test("should define private subnets for application", () => {
    //   const content = readTerraformFile("main.tf");
    //   expect(content).toMatch(
    //     /resource\s+"aws_subnet"\s+"private_app"\s*{/
    //   );
    //   expect(content).toMatch(/count\s*=\s*2/);
    // });

    // test("should define private subnets for database", () => {
    //   const content = readTerraformFile("main.tf");
    //   expect(content).toMatch(/resource\s+"aws_subnet"\s+"private_db"\s*{/);
    //   expect(content).toMatch(/count\s*=\s*2/);
    // });

    // test("should define NAT Gateway", () => {
    //   const content = readTerraformFile("main.tf");
    //   expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
    //   expect(content).toMatch(/count\s*=\s*1/);
    // });

    // test("should define route tables for public subnets", () => {
    //   const content = readTerraformFile("main.tf");
    //   expect(content).toMatch(
    //     /resource\s+"aws_route_table"\s+"public"\s*{/
    //   );
    //   expect(content).toMatch(/gateway_id\s*=\s*aws_internet_gateway\.main\.id/);
    // });

    // test("should define route tables for private subnets", () => {
    //   const content = readTerraformFile("main.tf");
    //   expect(content).toMatch(
    //     /resource\s+"aws_route_table"\s+"private_app"\s*{/
    //   );
    //   expect(content).toMatch(
    //     /resource\s+"aws_route_table"\s+"private_db"\s*{/
    //   );
    // });
  });

  describe("Suite 4: EKS Cluster Resources", () => {
    test("should define EKS cluster IAM role", () => {
      const content = readTerraformFile("eks-cluster.tf");
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"eks_cluster"\s*{/);
      expect(content).toMatch(/eks-cluster-role-\$\{var\.environment_suffix\}/);
      expect(content).toMatch(/Service\s*=\s*"eks\.amazonaws\.com"/);
    });

    test("should attach required EKS cluster policies", () => {
      const content = readTerraformFile("eks-cluster.tf");
      expect(content).toMatch(/AmazonEKSClusterPolicy/);
      expect(content).toMatch(/AmazonEKSVPCResourceController/);
    });

    test("should define EKS cluster security group", () => {
      const content = readTerraformFile("eks-cluster.tf");
      expect(content).toMatch(
        /resource\s+"aws_security_group"\s+"eks_cluster"\s*{/
      );
      expect(content).toMatch(/eks-cluster-sg-\$\{var\.environment_suffix\}/);
      expect(content).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("should define CloudWatch log group for EKS", () => {
      const content = readTerraformFile("eks-cluster.tf");
      expect(content).toMatch(
        /resource\s+"aws_cloudwatch_log_group"\s+"eks_cluster"\s*{/
      );
      expect(content).toMatch(/\/aws\/eks/);
      expect(content).toMatch(/retention_in_days/);
    });

    test("should define EKS cluster resource", () => {
      const content = readTerraformFile("eks-cluster.tf");
      expect(content).toMatch(/resource\s+"aws_eks_cluster"\s+"main"\s*{/);
      expect(content).toMatch(/role_arn\s*=\s*aws_iam_role\.eks_cluster\.arn/);
      expect(content).toMatch(/version\s*=\s*var\.cluster_version/);
    });

    test("should configure EKS cluster VPC config", () => {
      const content = readTerraformFile("eks-cluster.tf");
      expect(content).toMatch(/vpc_config\s*{/);
      expect(content).toMatch(/subnet_ids/);
      expect(content).toMatch(/endpoint_private_access/);
      expect(content).toMatch(/endpoint_public_access/);
      expect(content).toMatch(/security_group_ids/);
    });

    test("should enable cluster logging", () => {
      const content = readTerraformFile("eks-cluster.tf");
      expect(content).toMatch(/enabled_cluster_log_types/);
    });

    test("should define OIDC provider for IRSA", () => {
      const content = readTerraformFile("eks-cluster.tf");
      expect(content).toMatch(
        /resource\s+"aws_iam_openid_connect_provider"\s+"eks"\s*{/
      );
      expect(content).toMatch(/data\s+"tls_certificate"\s+"eks"\s*{/);
    });
  });

  describe("Suite 5: Fargate Resources", () => {
    test("should define Fargate pod execution IAM role", () => {
      const content = readTerraformFile("fargate.tf");
      expect(content).toMatch(
        /resource\s+"aws_iam_role"\s+"fargate_pod_execution"\s*{/
      );
      expect(content).toMatch(/eks-fargate-pod-execution-role/);
      expect(content).toMatch(/Service\s*=\s*"eks-fargate-pods\.amazonaws\.com"/);
    });

    test("should attach Fargate pod execution policy", () => {
      const content = readTerraformFile("fargate.tf");
      expect(content).toMatch(/AmazonEKSFargatePodExecutionRolePolicy/);
    });

    test("should define CloudWatch Logs policy for Fargate", () => {
      const content = readTerraformFile("fargate.tf");
      expect(content).toMatch(/fargate_cloudwatch_logs/);
      expect(content).toMatch(/logs:CreateLogStream/);
      expect(content).toMatch(/logs:PutLogEvents/);
    });

    test("should define ECR access policy for Fargate", () => {
      const content = readTerraformFile("fargate.tf");
      expect(content).toMatch(/fargate_ecr_access/);
      expect(content).toMatch(/ecr:GetAuthorizationToken/);
    });

    test("should define Fargate profile", () => {
      const content = readTerraformFile("fargate.tf");
      expect(content).toMatch(/resource\s+"aws_eks_fargate_profile"\s+/);
      expect(content).toMatch(/cluster_name\s*=\s*aws_eks_cluster\.main\.name/);
    });

    test("should configure Fargate profile with selectors", () => {
      const content = readTerraformFile("fargate.tf");
      expect(content).toMatch(/selector\s*{/);
      expect(content).toMatch(/namespace/);
    });
  });

  describe("Suite 6: EKS Addons", () => {
    test("should define EKS addons file", () => {
      const content = readTerraformFile("eks-addons.tf");
      expect(content.length).toBeGreaterThan(0);
    });

    test("should define VPC CNI addon", () => {
      const content = readTerraformFile("eks-addons.tf");
      expect(content).toMatch(/resource\s+"aws_eks_addon"\s+"vpc_cni"\s*{/);
      expect(content).toMatch(/addon_name\s*=\s*"vpc-cni"/);
    });

    test("should define CoreDNS addon", () => {
      const content = readTerraformFile("eks-addons.tf");
      expect(content).toMatch(/resource\s+"aws_eks_addon"\s+"coredns"\s*{/);
      expect(content).toMatch(/addon_name\s*=\s*"coredns"/);
    });

    test("should define kube-proxy addon", () => {
      const content = readTerraformFile("eks-addons.tf");
      expect(content).toMatch(/resource\s+"aws_eks_addon"\s+"kube_proxy"\s*{/);
      expect(content).toMatch(/addon_name\s*=\s*"kube-proxy"/);
    });
  });

  describe("Suite 7: Load Balancer Controller", () => {
    // test("should define load balancer controller IAM role", () => {
    //   const content = readTerraformFile("load-balancer-controller.tf");
    //   expect(content).toMatch(/resource\s+"aws_iam_role"\s+"alb_controller"\s*{/);
    // });

    // test("should define load balancer controller service account", () => {
    //   const content = readTerraformFile("load-balancer-controller.tf");
    //   expect(content).toMatch(/resource\s+"aws_eks_fargate_profile"/);
    // });

    test("should configure IRSA for load balancer controller", () => {
      const content = readTerraformFile("load-balancer-controller.tf");
      expect(content).toMatch(/aws_iam_openid_connect_provider\.eks/);
    });
  });

  // describe("Suite 8: Outputs Validation", () => {
  //   test("should define VPC ID output", () => {
  //     const content = readTerraformFile("outputs.tf");
  //     expect(content).toMatch(/output\s+"vpc_id"\s*{/);
  //     expect(content).toMatch(/aws_vpc\.main\.id/);
  //   });

  //   test("should define subnet outputs", () => {
  //     const content = readTerraformFile("outputs.tf");
  //     expect(content).toMatch(/output\s+"public_subnet_ids"\s*{/);
  //     expect(content).toMatch(/output\s+"private_app_subnet_ids"\s*{/);
  //     expect(content).toMatch(/output\s+"private_db_subnet_ids"\s*{/);
  //   });

  //   test("should define EKS cluster output", () => {
  //     const content = readTerraformFile("outputs.tf");
  //     expect(content).toMatch(/output\s+"cluster_name"\s*{/);
  //     expect(content).toMatch(/output\s+"cluster_endpoint"\s*{/);
  //     expect(content).toMatch(/output\s+"cluster_arn"\s*{/);
  //   });

  //   test("should define Fargate profile output", () => {
  //     const content = readTerraformFile("outputs.tf");
  //     expect(content).toMatch(/output\s+"fargate_profile_name"\s*{/);
  //   });
  // });

  describe("Suite 9: Naming Conventions", () => {
    test("should use environment_suffix in resource names", () => {
      const files = [
        "main.tf",
        "eks-cluster.tf",
        "fargate.tf",
        "load-balancer-controller.tf",
      ];

      files.forEach((file) => {
        const content = readTerraformFile(file);
        if (content.length > 0) {
          // Check for common resource naming patterns with environment_suffix
          const hasEnvironmentSuffix =
            content.includes("${var.environment_suffix}") ||
            content.includes("var.environment_suffix");
          expect(hasEnvironmentSuffix).toBe(true);
        }
      });
    });

    test("should use consistent naming pattern for EKS resources", () => {
      const content = readTerraformFile("eks-cluster.tf");
      expect(content).toMatch(/eks-cluster-role-\$\{var\.environment_suffix\}/);
      expect(content).toMatch(/eks-cluster-sg-\$\{var\.environment_suffix\}/);
    });
  });

  describe("Suite 10: Security and Compliance", () => {
    test("should configure VPC with DNS support", () => {
      const content = readTerraformFile("main.tf");
      expect(content).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(content).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("should configure EKS cluster with private endpoint access", () => {
      const content = readTerraformFile("eks-cluster.tf");
      expect(content).toMatch(/endpoint_private_access\s*=\s*true/);
    });

    test("should enable EKS cluster logging", () => {
      const content = readTerraformFile("eks-cluster.tf");
      expect(content).toMatch(/enabled_cluster_log_types/);
      expect(content).toMatch(/api/);
      expect(content).toMatch(/audit/);
    });

    test("should configure CloudWatch log retention", () => {
      const content = readTerraformFile("eks-cluster.tf");
      expect(content).toMatch(/retention_in_days/);
    });

    test("should use security groups for network isolation", () => {
      const content = readTerraformFile("eks-cluster.tf");
      expect(content).toMatch(/security_group_ids/);
    });
  });

  describe("Suite 11: Resource Dependencies", () => {
    test("should have proper VPC dependencies", () => {
      const content = readTerraformFile("main.tf");
      expect(content).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("should have proper EKS cluster dependencies", () => {
      const content = readTerraformFile("eks-cluster.tf");
      expect(content).toMatch(/depends_on/);
      expect(content).toMatch(/aws_iam_role_policy_attachment/);
    });

    test("should have proper Fargate profile dependencies", () => {
      const content = readTerraformFile("fargate.tf");
      expect(content).toMatch(/cluster_name\s*=\s*aws_eks_cluster\.main\.name/);
    });
  });

  describe("Suite 12: Tagging Strategy", () => {
    test("should include Name tag in resources", () => {
      const files = ["main.tf", "eks-cluster.tf", "fargate.tf"];
      files.forEach((file) => {
        const content = readTerraformFile(file);
        if (content.length > 0) {
          const hasNameTag = content.match(/tags\s*=\s*{[^}]*Name[^}]*}/);
          expect(hasNameTag).toBeTruthy();
        }
      });
    });

    test("should include Environment tag", () => {
      const content = readTerraformFile("main.tf");
      expect(content).toMatch(/Environment\s*=\s*var\.environment_suffix/);
    });
  });

  describe("Suite 13: Code Quality", () => {
    test("should not have hardcoded credentials", () => {
      const files = [
        "main.tf",
        "eks-cluster.tf",
        "fargate.tf",
        "eks-addons.tf",
        "load-balancer-controller.tf",
      ];

      files.forEach((file) => {
        const content = readTerraformFile(file);
        expect(content).not.toMatch(/password\s*=\s*"[^"]+"/);
        expect(content).not.toMatch(/secret\s*=\s*"[^"]+"/);
        expect(content).not.toMatch(/access_key\s*=\s*"[^"]+"/);
      });
    });

    test("should use variables instead of hardcoded values", () => {
      const content = readTerraformFile("main.tf");
      expect(content).toMatch(/var\.vpc_cidr/);
      expect(content).toMatch(/var\.environment_suffix/);
    });

    test("should have proper resource organization", () => {
      const mainContent = readTerraformFile("main.tf");
      const eksContent = readTerraformFile("eks-cluster.tf");
      const fargateContent = readTerraformFile("fargate.tf");

      // VPC resources should be in main.tf
      expect(mainContent).toMatch(/aws_vpc/);
      expect(mainContent).toMatch(/aws_subnet/);

      // EKS resources should be in eks-cluster.tf
      expect(eksContent).toMatch(/aws_eks_cluster/);

      // Fargate resources should be in fargate.tf
      expect(fargateContent).toMatch(/aws_eks_fargate_profile/);
    });
  });
});
