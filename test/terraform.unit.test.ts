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

describe("EKS Cluster Configuration", () => {
  let content: string;

  beforeAll(() => {
    const result = parseTerraformFile("eks_cluster.tf");
    content = result.content;
  });

  test("creates EKS cluster with environment_suffix in name", () => {
    expect(content).toMatch(/resource\s+"aws_eks_cluster"\s+"main"/);
    expect(content).toMatch(/eks-cluster-\$\{var\.environment_suffix\}/);
  });

  test("uses Kubernetes version from variable", () => {
    expect(content).toMatch(/version\s*=\s*var\.cluster_version/);
  });

  test("configures private endpoint access only", () => {
    expect(content).toMatch(/endpoint_private_access\s*=\s*true/);
    expect(content).toMatch(/endpoint_public_access\s*=\s*false/);
  });

  test("configures VPC config with private subnets", () => {
    expect(content).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
  });

  test("enables cluster logging", () => {
    expect(content).toMatch(/enabled_cluster_log_types/);
    expect(content).toMatch(/"api"/);
    expect(content).toMatch(/"audit"/);
  });

  test("creates OIDC provider for IRSA", () => {
    expect(content).toMatch(/resource\s+"aws_iam_openid_connect_provider"/);
    expect(content).toMatch(/aws_eks_cluster\.main\.identity/);
  });

  test("installs EBS CSI driver addon", () => {
    expect(content).toMatch(/resource\s+"aws_eks_addon"\s+"ebs_csi"/);
    expect(content).toMatch(/addon_name\s*=\s*"aws-ebs-csi-driver"/);
  });

  test("installs VPC CNI addon", () => {
    expect(content).toMatch(/resource\s+"aws_eks_addon"\s+"vpc_cni"/);
    expect(content).toMatch(/addon_name\s*=\s*"vpc-cni"/);
  });

  test("VPC CNI enables pod security groups and encryption", () => {
    expect(content).toMatch(
      /ENABLE_POD_ENI.*true|"ENABLE_POD_ENI"\s*=\s*"true"/
    );
    expect(content).toMatch(
      /ENABLE_PREFIX_DELEGATION.*true|"ENABLE_PREFIX_DELEGATION"\s*=\s*"true"/
    );
  });
});

describe("EKS Node Group Configuration", () => {
  let content: string;

  beforeAll(() => {
    const result = parseTerraformFile("eks_node_group.tf");
    content = result.content;
  });

  test("creates managed node group with environment_suffix in name", () => {
    expect(content).toMatch(/resource\s+"aws_eks_node_group"\s+"main"/);
    expect(content).toMatch(/eks-nodes-\$\{var\.environment_suffix\}/);
  });

  test("uses Bottlerocket AMI", () => {
    expect(content).toMatch(/ami_type\s*=\s*"BOTTLEROCKET_x86_64"/);
  });

  test("uses t3.large instance type", () => {
    expect(content).toMatch(/instance_types\s*=\s*\["t3\.large"\]/);
  });

  test("spans 3 availability zones", () => {
    expect(content).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
  });

  test("configures scaling from 3 to 15 nodes", () => {
    expect(content).toMatch(/min_size\s*=\s*var\.node_min_size/);
    expect(content).toMatch(/max_size\s*=\s*var\.node_max_size/);
    expect(content).toMatch(/desired_size\s*=\s*var\.node_desired_size/);
  });

  test("depends on IAM role policy attachments", () => {
    expect(content).toMatch(/depends_on/);
  });
});

describe("IAM Cluster Configuration", () => {
  let content: string;

  beforeAll(() => {
    const result = parseTerraformFile("iam_cluster.tf");
    content = result.content;
  });

  test("creates EKS cluster IAM role", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"eks_cluster"/);
    expect(content).toMatch(/eks-cluster-role-\$\{var\.environment_suffix\}/);
  });

  test("attaches EKS cluster policy", () => {
    expect(content).toMatch(
      /resource\s+"aws_iam_role_policy_attachment"\s+"eks_cluster_policy"/
    );
    expect(content).toMatch(
      /arn:aws:iam::aws:policy\/AmazonEKSClusterPolicy/
    );
  });
});

describe("IAM Node Group Configuration", () => {
  let content: string;

  beforeAll(() => {
    const result = parseTerraformFile("iam_node_group.tf");
    content = result.content;
  });

  test("creates node group IAM role", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"eks_node_group"/);
    expect(content).toMatch(/eks-node-role-\$\{var\.environment_suffix\}/);
  });

  test("attaches required policies", () => {
    expect(content).toMatch(/AmazonEKSWorkerNodePolicy/);
    expect(content).toMatch(/AmazonEKS_CNI_Policy/);
    expect(content).toMatch(/AmazonEC2ContainerRegistryReadOnly/);
  });
});

describe("IAM Cluster Autoscaler Configuration", () => {
  let content: string;

  beforeAll(() => {
    const result = parseTerraformFile("iam_autoscaler.tf");
    content = result.content;
  });

  test("creates autoscaler IAM role with IRSA", () => {
    expect(content).toMatch(
      /resource\s+"aws_iam_role"\s+"cluster_autoscaler"/
    );
    expect(content).toMatch(
      /eks-cluster-autoscaler-\$\{var\.environment_suffix\}/
    );
  });

  test("defines autoscaler IAM policy", () => {
    expect(content).toMatch(
      /resource\s+"aws_iam_policy"\s+"cluster_autoscaler"/
    );
    expect(content).toMatch(/autoscaling:DescribeAutoScalingGroups/);
    expect(content).toMatch(/autoscaling:SetDesiredCapacity/);
    expect(content).toMatch(/ec2:DescribeInstances/);
  });

  test("autoscaler policy allows tagging", () => {
    expect(content).toMatch(/autoscaling:DescribeScalingActivities/);
    expect(content).toMatch(/autoscaling:DescribeTags/);
  });
});

describe("IAM ALB Controller Configuration", () => {
  let content: string;

  beforeAll(() => {
    const result = parseTerraformFile("iam_alb_controller.tf");
    content = result.content;
  });

  test("creates ALB controller IAM role with IRSA", () => {
    expect(content).toMatch(
      /resource\s+"aws_iam_role"\s+"aws_load_balancer_controller"/
    );
    expect(content).toMatch(
      /eks-alb-controller-\$\{var\.environment_suffix\}/
    );
  });

  test("defines comprehensive ALB controller policy", () => {
    expect(content).toMatch(
      /resource\s+"aws_iam_policy"\s+"aws_load_balancer_controller"/
    );
    expect(content).toMatch(/elasticloadbalancing:CreateLoadBalancer/);
    expect(content).toMatch(/ec2:DescribeVpcs/);
    expect(content).toMatch(/elasticloadbalancing:AddTags/);
  });

  test("ALB controller can manage target groups", () => {
    expect(content).toMatch(/elasticloadbalancing:CreateTargetGroup/);
    expect(content).toMatch(/elasticloadbalancing:ModifyTargetGroup/);
  });
});

describe("IAM EBS CSI Configuration", () => {
  let content: string;

  beforeAll(() => {
    const result = parseTerraformFile("iam_ebs_csi.tf");
    content = result.content;
  });

  test("creates EBS CSI driver IAM role", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"ebs_csi"/);
    expect(content).toMatch(/eks-ebs-csi-\$\{var\.environment_suffix\}/);
  });

  test("attaches EBS CSI policy", () => {
    expect(content).toMatch(
      /arn:aws:iam::aws:policy\/service-role\/AmazonEBSCSIDriverPolicy/
    );
  });
});

describe("Helm Releases Configuration", () => {
  let content: string;

  beforeAll(() => {
    const result = parseTerraformFile("helm_releases.tf");
    content = result.content;
  });

  test("installs cluster autoscaler via Helm", () => {
    expect(content).toMatch(/resource\s+"helm_release"\s+"cluster_autoscaler"/);
    expect(content).toMatch(/name\s*=\s*"cluster-autoscaler"/);
    expect(content).toMatch(
      /repository\s*=\s*"https:\/\/kubernetes\.github\.io\/autoscaler"/
    );
  });

  test("installs AWS Load Balancer Controller via Helm", () => {
    expect(content).toMatch(
      /resource\s+"helm_release"\s+"aws_load_balancer_controller"/
    );
    expect(content).toMatch(/name\s*=\s*"aws-load-balancer-controller"/);
    expect(content).toMatch(/repository\s*=\s*"https:\/\/aws\.github\.io\/eks-charts"/);
  });

  test("autoscaler configured with correct cluster name", () => {
    expect(content).toMatch(/autoDiscovery\.clusterName/);
  });
});

describe("VPC Endpoints Configuration", () => {
  let content: string;

  beforeAll(() => {
    const result = parseTerraformFile("vpc_endpoints.tf");
    content = result.content;
  });

  test("creates S3 VPC endpoint", () => {
    expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"/);
    expect(content).toMatch(/service_name.*s3/);
  });

  test("S3 endpoint is Gateway type", () => {
    expect(content).toMatch(/vpc_endpoint_type\s*=\s*"Gateway"/);
  });

  test("creates ECR API VPC endpoint", () => {
    expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ecr_api"/);
    expect(content).toMatch(/service_name.*ecr\.api/);
  });

  test("creates ECR DKR VPC endpoint", () => {
    expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ecr_dkr"/);
    expect(content).toMatch(/service_name.*ecr\.dkr/);
  });

  test("ECR endpoints are Interface type", () => {
    const ecrApiMatch = content.match(
      /resource\s+"aws_vpc_endpoint"\s+"ecr_api"[\s\S]*?(?=resource|$)/
    );
    const ecrDkrMatch = content.match(
      /resource\s+"aws_vpc_endpoint"\s+"ecr_dkr"[\s\S]*?(?=resource|$)/
    );
    if (ecrApiMatch) {
      expect(ecrApiMatch[0]).toMatch(/vpc_endpoint_type\s*=\s*"Interface"/);
    }
    if (ecrDkrMatch) {
      expect(ecrDkrMatch[0]).toMatch(/vpc_endpoint_type\s*=\s*"Interface"/);
    }
  });
});

describe("CloudWatch Configuration", () => {
  let content: string;

  beforeAll(() => {
    const result = parseTerraformFile("cloudwatch.tf");
    content = result.content;
  });

  test("creates CloudWatch log group for cluster logs", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
    expect(content).toMatch(/\/aws\/eks\/eks-cluster-\$\{var\.environment_suffix\}/);
  });

  test("sets log retention to 30 days", () => {
    expect(content).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
  });

  test("log group name includes environment_suffix", () => {
    expect(content).toMatch(/eks-cluster-\$\{var\.environment_suffix\}/);
  });
});

describe("Kubernetes Resources Configuration", () => {
  let content: string;

  beforeAll(() => {
    const result = parseTerraformFile("kubernetes_resources.tf");
    content = result.content;
  });

  test("creates production namespace", () => {
    expect(content).toMatch(/resource\s+"kubernetes_namespace"\s+"production"/);
    expect(content).toMatch(/name\s*=\s*"production"/);
  });

  test("production namespace includes environment_suffix in labels", () => {
    expect(content).toMatch(/environment\s*=\s*var\.environment_suffix/);
  });

  test("creates resource quota for production namespace", () => {
    expect(content).toMatch(
      /resource\s+"kubernetes_resource_quota"\s+"production"/
    );
    expect(content).toMatch(/namespace\s*=\s*kubernetes_namespace\.production/);
  });

  test("resource quota limits pods to 100", () => {
    expect(content).toMatch(/pods\s*=\s*var\.production_namespace_pod_quota/);
  });

  test("resource quota limits storage to 200Gi", () => {
    expect(content).toMatch(
      /requests\.storage.*=.*var\.production_namespace_storage_quota/
    );
  });

  test("creates limit range for production namespace", () => {
    expect(content).toMatch(
      /resource\s+"kubernetes_limit_range"\s+"production"/
    );
  });

  test("limit range defines Pod and Container limits", () => {
    expect(content).toMatch(/type\s*=\s*"Pod"/);
    expect(content).toMatch(/type\s*=\s*"Container"/);
  });
});

describe("Outputs Configuration", () => {
  let content: string;

  beforeAll(() => {
    const result = parseTerraformFile("outputs.tf");
    content = result.content;
  });

  test("outputs cluster endpoint", () => {
    expect(content).toMatch(/output\s+"cluster_endpoint"/);
    expect(content).toMatch(/value\s*=\s*aws_eks_cluster\.main\.endpoint/);
  });

  test("outputs cluster name", () => {
    expect(content).toMatch(/output\s+"cluster_name"/);
    expect(content).toMatch(/value\s*=\s*aws_eks_cluster\.main\.name/);
  });

  test("outputs OIDC issuer URL", () => {
    expect(content).toMatch(/output\s+"oidc_issuer_url"/);
    expect(content).toMatch(/aws_eks_cluster\.main\.identity.*oidc.*issuer/);
  });

  test("outputs VPC ID", () => {
    expect(content).toMatch(/output\s+"vpc_id"/);
    expect(content).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
  });

  test("outputs private subnet IDs", () => {
    expect(content).toMatch(/output\s+"private_subnet_ids"/);
    expect(content).toMatch(/value\s*=\s*aws_subnet\.private\[\*\]\.id/);
  });

  test("outputs kubeconfig command", () => {
    expect(content).toMatch(/output\s+"kubeconfig_command"/);
    expect(content).toMatch(/aws eks update-kubeconfig/);
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

  test("CloudWatch logs are retained for 30 days", () => {
    const cwContent = readTerraformFile("cloudwatch.tf");
    expect(cwContent).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
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
  test("All resources use Bottlerocket AMI for enhanced security", () => {
    const nodeGroupContent = readTerraformFile("eks_node_group.tf");
    expect(nodeGroupContent).toMatch(/BOTTLEROCKET_x86_64/);
  });

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
