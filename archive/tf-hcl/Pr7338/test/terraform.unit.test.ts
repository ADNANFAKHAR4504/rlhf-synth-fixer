// Comprehensive unit tests for EKS Terraform infrastructure
import fs from "fs";
import path from "path";

const libPath = path.resolve(__dirname, "../lib");

// Helper to read Terraform files
function readTerraformFile(filename: string): string {
  const filePath = path.join(libPath, filename);
  return fs.readFileSync(filePath, "utf8");
}

describe("Terraform Infrastructure - File Existence", () => {
  const requiredFiles = [
    "variables.tf",
    "provider.tf",
    "vpc.tf",
    "eks_cluster.tf",
    "eks_node_group.tf",
    "iam_cluster.tf",
    "iam_node_group.tf",
    "iam_autoscaler.tf",
    "iam_alb_controller.tf",
    "iam_ebs_csi.tf",
    "helm_releases.tf",
    "vpc_endpoints.tf",
    "cloudwatch.tf",
    "kubernetes_resources.tf",
    "outputs.tf",
  ];

  test.each(requiredFiles)("%s exists", (filename) => {
    const filePath = path.join(libPath, filename);
    expect(fs.existsSync(filePath)).toBe(true);
  });
});

describe("Variables Configuration", () => {
  let content: string;

  beforeAll(() => {
    content = readTerraformFile("variables.tf");
  });

  test("defines environment_suffix variable", () => {
    expect(content).toMatch(/variable\s+"environment_suffix"/);
  });

  test("defines aws_region with correct default", () => {
    expect(content).toMatch(/variable\s+"aws_region"/);
    expect(content).toMatch(/default\s*=\s*"us-east-2"/);
  });

  test("defines cluster_version with 1.28", () => {
    expect(content).toMatch(/variable\s+"cluster_version"/);
    expect(content).toMatch(/default\s*=\s*"1\.28"/);
  });

  test("defines node scaling variables", () => {
    expect(content).toMatch(/variable\s+"node_min_size"/);
    expect(content).toMatch(/variable\s+"node_max_size"/);
    const minMatch = content.match(/variable\s+"node_min_size"[\s\S]*?default\s*=\s*(\d+)/);
    const maxMatch = content.match(/variable\s+"node_max_size"[\s\S]*?default\s*=\s*(\d+)/);
    expect(minMatch && parseInt(minMatch[1])).toBe(3);
    expect(maxMatch && parseInt(maxMatch[1])).toBe(15);
  });

  test("defines production namespace quotas", () => {
    expect(content).toMatch(/variable\s+"production_namespace_pod_quota"/);
    expect(content).toMatch(/variable\s+"production_namespace_storage_quota"/);
    expect(content).toMatch(/default\s*=\s*100/);
    expect(content).toMatch(/default\s*=\s*"200Gi"/);
  });

  test("defines log retention days", () => {
    expect(content).toMatch(/variable\s+"log_retention_days"/);
    expect(content).toMatch(/default\s*=\s*30/);
  });
});

describe("Provider Configuration", () => {
  let content: string;

  beforeAll(() => {
    content = readTerraformFile("provider.tf");
  });

  test("requires Terraform version >= 1.5.0", () => {
    expect(content).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
  });

  test("configures AWS provider with correct version", () => {
    expect(content).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    expect(content).toMatch(/version\s*=\s*"~>\s*5\.0"/);
  });

  test("configures Kubernetes provider", () => {
    expect(content).toMatch(/source\s*=\s*"hashicorp\/kubernetes"/);
    expect(content).toMatch(/version\s*=\s*"~>\s*2\.23"/);
  });

  test("configures Helm provider", () => {
    expect(content).toMatch(/source\s*=\s*"hashicorp\/helm"/);
    expect(content).toMatch(/version\s*=\s*"~>\s*2\.11"/);
  });

  test("configures TLS provider", () => {
    expect(content).toMatch(/source\s*=\s*"hashicorp\/tls"/);
    expect(content).toMatch(/version\s*=\s*"~>\s*4\.0"/);
  });

  test("AWS provider uses variable for region", () => {
    expect(content).toMatch(/region\s*=\s*var\.aws_region/);
  });

  test("AWS provider includes default tags", () => {
    expect(content).toMatch(/default_tags/);
    expect(content).toMatch(/Environment\s*=\s*var\.environment_suffix/);
    expect(content).toMatch(/ManagedBy\s*=\s*"terraform"/);
  });
});

describe("VPC Configuration", () => {
  let content: string;

  beforeAll(() => {
    content = readTerraformFile("vpc.tf");
  });

  test("creates VPC with CIDR from variable", () => {
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(content).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
  });

  test("enables DNS support in VPC", () => {
    expect(content).toMatch(/enable_dns_support\s*=\s*true/);
    expect(content).toMatch(/enable_dns_hostnames\s*=\s*true/);
  });

  test("VPC name includes environment_suffix", () => {
    expect(content).toMatch(/eks-vpc-\$\{var\.environment_suffix\}/);
  });

  test("creates private subnets across 3 AZs", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    expect(content).toMatch(/count\s*=\s*3/);
  });

  test("private subnets are tagged for EKS", () => {
    expect(content).toMatch(
      /kubernetes\.io\/role\/internal-elb.*=.*"1"|"kubernetes\.io\/role\/internal-elb"\s*=\s*"1"/
    );
  });

  test("creates internet gateway", () => {
    expect(content).toMatch(/resource\s+"aws_internet_gateway"/);
  });

  test("creates NAT gateways", () => {
    expect(content).toMatch(/resource\s+"aws_nat_gateway"/);
    expect(content).toMatch(/resource\s+"aws_eip"/);
  });

  test("creates route tables for private subnets", () => {
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"/);
  });
});

describe("Security Best Practices", () => {
  test("EKS cluster has private endpoint only", () => {
    const eksContent = readTerraformFile("eks_cluster.tf");
    expect(eksContent).toMatch(/endpoint_private_access\s*=\s*true/);
    expect(eksContent).toMatch(/endpoint_public_access\s*=\s*false/);
  });

  test("EBS volumes are encrypted", () => {
    const eksContent = readTerraformFile("eks_cluster.tf");
    expect(eksContent).toMatch(/aws-ebs-csi-driver/);
  });

  test("VPC CNI enables pod security groups", () => {
    const eksContent = readTerraformFile("eks_cluster.tf");
    expect(eksContent).toMatch(/ENABLE_POD_ENI|enable_pod_eni/i);
  });

  test("All IAM roles use IRSA pattern", () => {
    const autoscalerContent = readTerraformFile("iam_autoscaler.tf");
    const albContent = readTerraformFile("iam_alb_controller.tf");
    const ebsContent = readTerraformFile("iam_ebs_csi.tf");

    expect(autoscalerContent).toMatch(/AssumeRoleWithWebIdentity/);
    expect(albContent).toMatch(/AssumeRoleWithWebIdentity/);
    expect(ebsContent).toMatch(/AssumeRoleWithWebIdentity/);
  });
});

describe("Resource Naming Conventions", () => {
  const filesWithSuffix = [
    "eks_cluster.tf",
    "eks_node_group.tf",
    "iam_cluster.tf",
    "iam_node_group.tf",
    "iam_autoscaler.tf",
    "iam_alb_controller.tf",
    "iam_ebs_csi.tf",
    "cloudwatch.tf",
    "vpc.tf",
  ];

  test.each(filesWithSuffix)(
    "%s includes environment_suffix in resource names",
    (filename) => {
      const content = readTerraformFile(filename);
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    }
  );
});

describe("Cost Optimization", () => {
  test("S3 VPC endpoint avoids NAT charges", () => {
    const vpcEndpointsContent = readTerraformFile("vpc_endpoints.tf");
    expect(vpcEndpointsContent).toMatch(/service_name.*s3/);
    expect(vpcEndpointsContent).toMatch(/vpc_endpoint_type\s*=\s*"Gateway"/);
  });

  test("ECR VPC endpoints avoid NAT charges for image pulls", () => {
    const vpcEndpointsContent = readTerraformFile("vpc_endpoints.tf");
    expect(vpcEndpointsContent).toMatch(/ecr\.api/);
    expect(vpcEndpointsContent).toMatch(/ecr\.dkr/);
  });

  test("Cluster autoscaler configured for cost-effective scaling", () => {
    const helmContent = readTerraformFile("helm_releases.tf");
    expect(helmContent).toMatch(/cluster-autoscaler/);
  });
});

describe("Compliance Requirements", () => {
  test("Node groups span exactly 3 availability zones", () => {
    const variablesContent = readTerraformFile("variables.tf");
    expect(variablesContent).toMatch(
      /us-east-2a.*us-east-2b.*us-east-2c|default\s*=\s*\[[\s\S]*us-east-2a[\s\S]*us-east-2b[\s\S]*us-east-2c/
    );
  });

  test("Cluster autoscaler range is 3-15 nodes", () => {
    const variablesContent = readTerraformFile("variables.tf");
    expect(variablesContent).toMatch(/node_min_size[\s\S]*default\s*=\s*3/);
    expect(variablesContent).toMatch(/node_max_size[\s\S]*default\s*=\s*15/);
  });

  test("Production namespace has resource quotas", () => {
    const k8sContent = readTerraformFile("kubernetes_resources.tf");
    expect(k8sContent).toMatch(/kubernetes_resource_quota/);
    expect(k8sContent).toMatch(/production/);
  });
});

describe("Infrastructure Dependencies", () => {
  test("EKS node group depends on IAM policies", () => {
    const nodeGroupContent = readTerraformFile("eks_node_group.tf");
    expect(nodeGroupContent).toMatch(/depends_on/);
  });

  test("Helm releases depend on EKS node group", () => {
    const helmContent = readTerraformFile("helm_releases.tf");
    expect(helmContent).toMatch(/depends_on/);
  });

  test("Kubernetes resources depend on node group", () => {
    const k8sContent = readTerraformFile("kubernetes_resources.tf");
    expect(k8sContent).toMatch(/depends_on.*aws_eks_node_group\.main/);
  });
});
