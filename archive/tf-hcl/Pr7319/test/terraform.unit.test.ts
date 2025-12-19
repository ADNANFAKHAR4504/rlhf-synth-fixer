// Unit tests for EKS Terraform infrastructure
// Tests validate file structure, variable definitions, and resource configurations

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");

describe("Terraform EKS Infrastructure - File Structure", () => {
  const requiredFiles = [
    "variables.tf",
    "provider.tf",
    "env_vars.tf",
    "data.tf",
    "iam.tf",
    "security_groups.tf",
    "vpc_endpoints.tf",
    "eks_cluster.tf",
    "eks_node_group.tf",
    "kubernetes.tf",
    "helm.tf",
    "outputs.tf"
  ];

  test.each(requiredFiles)("%s exists", (filename) => {
    const filePath = path.join(LIB_DIR, filename);
    expect(fs.existsSync(filePath)).toBe(true);
  });
});

describe("Terraform EKS Infrastructure - Environment Variables", () => {
  let envVarsContent: string;

  beforeAll(() => {
    envVarsContent = fs.readFileSync(path.join(LIB_DIR, "env_vars.tf"), "utf8");
  });

  test("defines external data source for ENVIRONMENT_SUFFIX", () => {
    expect(envVarsContent).toMatch(/data\s+"external"\s+"environment"\s*{/);
    expect(envVarsContent).toMatch(/ENVIRONMENT_SUFFIX/);
  });

  test("defines local.environment_suffix", () => {
    expect(envVarsContent).toMatch(/locals\s*{/);
    expect(envVarsContent).toMatch(/environment_suffix\s*=/);
  });

  test("includes validation for environment_suffix length", () => {
    expect(envVarsContent).toMatch(/null_resource.*validate_environment_suffix/);
    expect(envVarsContent).toMatch(/length\(local\.environment_suffix\)/);
  });
});

describe("Terraform EKS Infrastructure - Variables", () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = fs.readFileSync(path.join(LIB_DIR, "variables.tf"), "utf8");
  });

  test("defines environment_suffix variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
  });

  test("defines region variable with default us-east-2", () => {
    expect(variablesContent).toMatch(/variable\s+"region"\s*{/);
    expect(variablesContent).toMatch(/default\s*=\s*"us-east-2"/);
  });

  test("defines cluster_version variable with default 1.28", () => {
    expect(variablesContent).toMatch(/variable\s+"cluster_version"\s*{/);
    expect(variablesContent).toMatch(/default\s*=\s*"1\.28"/);
  });

  test("defines vpc_id variable", () => {
    expect(variablesContent).toMatch(/variable\s+"vpc_id"\s*{/);
  });

  test("defines private_subnet_ids variable with validation for 3 subnets", () => {
    expect(variablesContent).toMatch(/variable\s+"private_subnet_ids"\s*{/);
    expect(variablesContent).toMatch(/length\(var\.private_subnet_ids\)\s*==\s*(0\s*\|\|\s*length\(var\.private_subnet_ids\)\s*==\s*)?3/);
  });

  test("defines node configuration variables", () => {
    expect(variablesContent).toMatch(/variable\s+"node_instance_type"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"node_min_size"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"node_max_size"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"node_desired_size"\s*{/);
  });

  test("defines production namespace quota variables", () => {
    expect(variablesContent).toMatch(/variable\s+"production_namespace_pod_limit"\s*{/);
    expect(variablesContent).toMatch(/variable\s+"production_namespace_storage_limit"\s*{/);
  });
});

describe("Terraform EKS Infrastructure - Provider Configuration", () => {
  let providerContent: string;

  beforeAll(() => {
    providerContent = fs.readFileSync(path.join(LIB_DIR, "provider.tf"), "utf8");
  });

  test("requires Terraform version >= 1.5.0", () => {
    expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
  });

  test("declares AWS provider", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
  });

  test("declares Kubernetes provider", () => {
    expect(providerContent).toMatch(/provider\s+"kubernetes"\s*{/);
  });

  test("declares Helm provider", () => {
    expect(providerContent).toMatch(/provider\s+"helm"\s*{/);
  });

  test("declares null provider in required_providers", () => {
    expect(providerContent).toMatch(/null\s*=\s*{/);
    expect(providerContent).toMatch(/hashicorp\/null/);
  });

  test("configures AWS provider with region from variable", () => {
    expect(providerContent).toMatch(/region\s*=\s*var\.region/);
  });
});

describe("Terraform EKS Infrastructure - Data Sources", () => {
  let dataContent: string;

  beforeAll(() => {
    dataContent = fs.readFileSync(path.join(LIB_DIR, "data.tf"), "utf8");
  });

  test("fetches current AWS account information", () => {
    expect(dataContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
  });

  test("fetches AWS partition information", () => {
    expect(dataContent).toMatch(/data\s+"aws_partition"\s+"current"\s*{/);
  });

  test("fetches VPC information", () => {
    expect(dataContent).toMatch(/data\s+"aws_vpc"\s+"selected"\s*{/);
    expect(dataContent).toMatch(/id\s*=\s*aws_vpc\.main\.id/);
  });

  test("fetches Bottlerocket AMI for EKS", () => {
    expect(dataContent).toMatch(/data\s+"aws_ami"\s+"bottlerocket"\s*{/);
    expect(dataContent).toMatch(/bottlerocket-aws-k8s/);
  });

  test("fetches TLS certificate for OIDC", () => {
    expect(dataContent).toMatch(/data\s+"tls_certificate"\s+"cluster"\s*{/);
  });
});

describe("Terraform EKS Infrastructure - IAM Roles", () => {
  let iamContent: string;

  beforeAll(() => {
    iamContent = fs.readFileSync(path.join(LIB_DIR, "iam.tf"), "utf8");
  });

  test("creates EKS cluster IAM role", () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"cluster"\s*{/);
  });

  test("creates EKS node IAM role", () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"node_group"\s*{/);
  });

  test("creates cluster autoscaler IRSA role", () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"cluster_autoscaler"\s*{/);
  });

  test("creates Load Balancer Controller IRSA role", () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"lb_controller"\s*{/);
  });

  test("creates EBS CSI driver IRSA role", () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"ebs_csi_driver"\s*{/);
  });

  test("all IAM roles include environment_suffix in names", () => {
    const roleMatches = iamContent.match(/name\s*=\s*"[^"]+"/g) || [];
    roleMatches.forEach((match) => {
      if (match.includes("name =")) {
        expect(match).toMatch(/\$\{local\.environment_suffix\}/);
      }
    });
  });
});

describe("Terraform EKS Infrastructure - Security Groups", () => {
  let sgContent: string;

  beforeAll(() => {
    sgContent = fs.readFileSync(path.join(LIB_DIR, "security_groups.tf"), "utf8");
  });

  test("creates cluster security group", () => {
    expect(sgContent).toMatch(/resource\s+"aws_security_group"\s+"cluster"\s*{/);
  });

  test("creates node security group", () => {
    expect(sgContent).toMatch(/resource\s+"aws_security_group"\s+"nodes"\s*{/);
  });

  test("security groups include environment_suffix in names", () => {
    expect(sgContent).toMatch(/eks-cluster-sg-\$\{local\.environment_suffix\}/);
    expect(sgContent).toMatch(/eks-nodes-sg-\$\{local\.environment_suffix\}/);
  });

  test("configures security group rules for node-to-node communication", () => {
    expect(sgContent).toMatch(/resource\s+"aws_security_group_rule"/);
  });
});

describe("Terraform EKS Infrastructure - VPC Endpoints", () => {
  let vpcEndpointsContent: string;

  beforeAll(() => {
    vpcEndpointsContent = fs.readFileSync(path.join(LIB_DIR, "vpc_endpoints.tf"), "utf8");
  });

  test("creates S3 VPC endpoint", () => {
    expect(vpcEndpointsContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"\s*{/);
    expect(vpcEndpointsContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.\$\{var\.region\}\.s3"/);
  });

  test("creates ECR API VPC endpoint", () => {
    expect(vpcEndpointsContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ecr_api"\s*{/);
    expect(vpcEndpointsContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.\$\{var\.region\}\.ecr\.api"/);
  });

  test("creates ECR DKR VPC endpoint", () => {
    expect(vpcEndpointsContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ecr_dkr"\s*{/);
    expect(vpcEndpointsContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.\$\{var\.region\}\.ecr\.dkr"/);
  });

  test("VPC endpoints include environment_suffix in Name tags", () => {
    expect(vpcEndpointsContent).toMatch(/Name\s*=\s*"[^"]*\$\{local\.environment_suffix\}"/);
  });
});

describe("Terraform EKS Infrastructure - EKS Cluster", () => {
  let eksClusterContent: string;

  beforeAll(() => {
    eksClusterContent = fs.readFileSync(path.join(LIB_DIR, "eks_cluster.tf"), "utf8");
  });

  test("creates EKS cluster resource", () => {
    expect(eksClusterContent).toMatch(/resource\s+"aws_eks_cluster"\s+"main"\s*{/);
  });

  test("cluster name includes environment_suffix", () => {
    expect(eksClusterContent).toMatch(/name\s*=\s*"eks-cluster-\$\{local\.environment_suffix\}"/);
  });

  test("configures cluster version from variable", () => {
    expect(eksClusterContent).toMatch(/version\s*=\s*var\.cluster_version/);
  });

  test("enables private endpoint access only", () => {
    expect(eksClusterContent).toMatch(/endpoint_private_access\s*=\s*true/);
    expect(eksClusterContent).toMatch(/endpoint_public_access\s*=\s*false/);
  });

  test("enables cluster logging", () => {
    expect(eksClusterContent).toMatch(/enabled_cluster_log_types\s*=/);
  });

  test("creates EBS CSI driver addon", () => {
    expect(eksClusterContent).toMatch(/resource\s+"aws_eks_addon"\s+"ebs_csi_driver"\s*{/);
  });

  test("creates CloudWatch log group with retention", () => {
    expect(eksClusterContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"cluster"\s*{/);
    expect(eksClusterContent).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
  });
});

describe("Terraform EKS Infrastructure - EKS Node Group", () => {
  let nodeGroupContent: string;

  beforeAll(() => {
    nodeGroupContent = fs.readFileSync(path.join(LIB_DIR, "eks_node_group.tf"), "utf8");
  });

  test("creates EKS node group resource", () => {
    expect(nodeGroupContent).toMatch(/resource\s+"aws_eks_node_group"\s+"main"\s*{/);
  });

  test("node group name includes environment_suffix", () => {
    expect(nodeGroupContent).toMatch(/node_group_name\s*=\s*"managed-nodes-\$\{local\.environment_suffix\}"/);
  });

  test("uses Bottlerocket AMI", () => {
    expect(nodeGroupContent).toMatch(/ami_type\s*=\s*"BOTTLEROCKET_x86_64"/);
  });

  test("configures node group scaling from variables", () => {
    expect(nodeGroupContent).toMatch(/min_size\s*=\s*var\.node_min_size/);
    expect(nodeGroupContent).toMatch(/max_size\s*=\s*var\.node_max_size/);
    expect(nodeGroupContent).toMatch(/desired_size\s*=\s*var\.node_desired_size/);
  });

  test("uses instance type from variable", () => {
    expect(nodeGroupContent).toMatch(/instance_types\s*=\s*\[var\.node_instance_type\]/);
  });

  test("creates launch template with user data", () => {
    expect(nodeGroupContent).toMatch(/resource\s+"aws_launch_template"\s+"nodes"\s*{/);
  });
});

describe("Terraform EKS Infrastructure - Kubernetes Resources", () => {
  let k8sContent: string;

  beforeAll(() => {
    k8sContent = fs.readFileSync(path.join(LIB_DIR, "kubernetes.tf"), "utf8");
  });

  test("creates production namespace", () => {
    expect(k8sContent).toMatch(/resource\s+"kubernetes_namespace"\s+"production"\s*{/);
  });

  test("creates resource quota for production namespace", () => {
    expect(k8sContent).toMatch(/resource\s+"kubernetes_resource_quota"\s+"production"\s*{/);
  });

  test("configures pod limit from variable", () => {
    expect(k8sContent).toMatch(/"pods"\s*=\s*var\.production_namespace_pod_limit/);
  });

  test("configures storage limit from variable", () => {
    expect(k8sContent).toMatch(/"requests\.storage"\s*=\s*var\.production_namespace_storage_limit/);
  });

  test("creates service account for cluster autoscaler", () => {
    expect(k8sContent).toMatch(/resource\s+"kubernetes_service_account"\s+"cluster_autoscaler"\s*{/);
  });

  test("creates cluster autoscaler deployment", () => {
    expect(k8sContent).toMatch(/resource\s+"kubernetes_deployment"\s+"cluster_autoscaler"\s*{/);
  });

  test("cluster autoscaler annotations include IRSA role ARN", () => {
    expect(k8sContent).toMatch(/eks\.amazonaws\.com\/role-arn/);
  });
});

describe("Terraform EKS Infrastructure - Helm Releases", () => {
  let helmContent: string;

  beforeAll(() => {
    helmContent = fs.readFileSync(path.join(LIB_DIR, "helm.tf"), "utf8");
  });

  test("creates AWS Load Balancer Controller Helm release", () => {
    expect(helmContent).toMatch(/resource\s+"helm_release"\s+"lb_controller"\s*{/);
  });

  test("configures Load Balancer Controller with cluster name", () => {
    expect(helmContent).toMatch(/name\s*=\s*"clusterName"/);
    expect(helmContent).toMatch(/value\s*=\s*aws_eks_cluster\.main\.name/);
  });

  test("configures Load Balancer Controller with VPC ID", () => {
    expect(helmContent).toMatch(/name\s*=\s*"vpcId"/);
    expect(helmContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
  });
});

describe("Terraform EKS Infrastructure - IAM OIDC Provider", () => {
  let iamContent: string;

  beforeAll(() => {
    iamContent = fs.readFileSync(path.join(LIB_DIR, "iam.tf"), "utf8");
  });

  test("creates OIDC identity provider", () => {
    expect(iamContent).toMatch(/resource\s+"aws_iam_openid_connect_provider"\s+"cluster"\s*{/);
  });

  test("OIDC provider references EKS cluster", () => {
    expect(iamContent).toMatch(/client_id_list\s*=\s*\["sts\.amazonaws\.com"\]/);
  });
});

describe("Terraform EKS Infrastructure - Outputs", () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = fs.readFileSync(path.join(LIB_DIR, "outputs.tf"), "utf8");
  });

  test("outputs cluster ID", () => {
    expect(outputsContent).toMatch(/output\s+"cluster_id"\s*{/);
  });

  test("outputs cluster endpoint", () => {
    expect(outputsContent).toMatch(/output\s+"cluster_endpoint"\s*{/);
  });

  test("outputs cluster OIDC issuer URL", () => {
    expect(outputsContent).toMatch(/output\s+"cluster_oidc_issuer_url"\s*{/);
  });

  test("outputs OIDC provider ARN", () => {
    expect(outputsContent).toMatch(/output\s+"oidc_provider_arn"\s*{/);
  });

  test("outputs cluster name", () => {
    expect(outputsContent).toMatch(/output\s+"cluster_name"\s*{/);
  });

  test("outputs kubeconfig update command", () => {
    expect(outputsContent).toMatch(/output\s+"kubeconfig_update_command"\s*{/);
  });
});

describe("Terraform EKS Infrastructure - Resource Naming", () => {
  const filesToCheck = [
    "iam.tf",
    "security_groups.tf",
    "eks_cluster.tf",
    "eks_node_group.tf"
  ];

  test.each(filesToCheck)("%s uses environment_suffix in resource names", (filename) => {
    const content = fs.readFileSync(path.join(LIB_DIR, filename), "utf8");
    const nameMatches = content.match(/name\s*=\s*"[^"]+\$\{local\.environment_suffix\}[^"]*"/g);
    expect(nameMatches).toBeTruthy();
    expect(nameMatches!.length).toBeGreaterThan(0);
  });
});

describe("Terraform EKS Infrastructure - No Retain Policies", () => {
  const allTfFiles = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));

  test.each(allTfFiles)("%s has no RETAIN policies", (filename) => {
    const content = fs.readFileSync(path.join(LIB_DIR, filename), "utf8");
    expect(content.toLowerCase()).not.toMatch(/prevent_destroy\s*=\s*true/);
    expect(content.toLowerCase()).not.toMatch(/deletion_protection\s*=\s*true/);
  });
});
