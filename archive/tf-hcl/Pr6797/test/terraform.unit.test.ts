// test/terraform.unit.test.ts
// Unit tests for EKS Terraform infrastructure
// Validates file structure and configuration without deployment

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const MAIN_TF = path.join(LIB_DIR, "main.tf");
const OUTPUTS_TF = path.join(LIB_DIR, "outputs.tf");
const VARIABLES_TF = path.join(LIB_DIR, "variables.tf");
const PROVIDER_TF = path.join(LIB_DIR, "provider.tf");

describe("Terraform EKS Infrastructure - File Structure", () => {
  test("main.tf exists", () => {
    expect(fs.existsSync(MAIN_TF)).toBe(true);
  });

  test("outputs.tf exists", () => {
    expect(fs.existsSync(OUTPUTS_TF)).toBe(true);
  });

  test("variables.tf exists", () => {
    expect(fs.existsSync(VARIABLES_TF)).toBe(true);
  });

  test("provider.tf exists", () => {
    expect(fs.existsSync(PROVIDER_TF)).toBe(true);
  });
});

describe("Terraform EKS Infrastructure - Required Variables", () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = fs.readFileSync(VARIABLES_TF, "utf8");
  });

  test("declares environment_suffix variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
  });

  test("declares aws_region variable", () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("environment_suffix has description", () => {
    expect(variablesContent).toMatch(/environment_suffix[\s\S]*description/);
  });

  test("aws_region has description", () => {
    expect(variablesContent).toMatch(/aws_region[\s\S]*description/);
  });
});

describe("Terraform EKS Infrastructure - Resource Naming", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, "utf8");
  });

  test("EKS cluster name includes environment_suffix", () => {
    expect(mainContent).toMatch(/name\s*=\s*"payment-eks-\$\{var\.environment_suffix\}"/);
  });

  test("VPC name includes environment_suffix", () => {
    expect(mainContent).toMatch(/Name\s*=\s*"payment-vpc-\$\{var\.environment_suffix\}"/);
  });

  test("security groups include environment_suffix", () => {
    expect(mainContent).toMatch(/payment-eks-cluster-sg-\$\{var\.environment_suffix\}/);
    expect(mainContent).toMatch(/payment-eks-nodes-sg-\$\{var\.environment_suffix\}/);
  });

  test("IAM roles include environment_suffix", () => {
    expect(mainContent).toMatch(/payment-eks-cluster-role-\$\{var\.environment_suffix\}/);
    expect(mainContent).toMatch(/payment-eks-node-group-role-\$\{var\.environment_suffix\}/);
  });

  test("KMS key includes environment_suffix", () => {
    expect(mainContent).toMatch(/payment-eks-kms-\$\{var\.environment_suffix\}/);
  });

  test("NAT Gateway includes environment_suffix", () => {
    expect(mainContent).toMatch(/payment-nat-\$\{var\.environment_suffix\}/);
  });
});

describe("Terraform EKS Infrastructure - EKS Cluster Configuration", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, "utf8");
  });

  test("declares aws_eks_cluster resource", () => {
    expect(mainContent).toMatch(/resource\s+"aws_eks_cluster"\s+"main"\s*{/);
  });

  test("enables control plane logging", () => {
    expect(mainContent).toMatch(/enabled_cluster_log_types/);
    expect(mainContent).toMatch(/"api"/);
    expect(mainContent).toMatch(/"audit"/);
    expect(mainContent).toMatch(/"authenticator"/);
    expect(mainContent).toMatch(/"controllerManager"/);
    expect(mainContent).toMatch(/"scheduler"/);
  });

  test("configures encryption with KMS", () => {
    expect(mainContent).toMatch(/encryption_config\s*{/);
    expect(mainContent).toMatch(/key_arn\s*=\s*aws_kms_key\.eks\.arn/);
  });

  test("enables private endpoint access", () => {
    expect(mainContent).toMatch(/endpoint_private_access\s*=\s*true/);
  });

  test("enables public endpoint access", () => {
    expect(mainContent).toMatch(/endpoint_public_access\s*=\s*true/);
  });

  test("specifies Kubernetes version", () => {
    expect(mainContent).toMatch(/version\s*=\s*"1\.\d+"/);
  });
});

describe("Terraform EKS Infrastructure - VPC Configuration", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, "utf8");
  });

  test("declares VPC resource", () => {
    expect(mainContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
  });

  test("enables DNS hostnames", () => {
    expect(mainContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
  });

  test("enables DNS support", () => {
    expect(mainContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("declares public subnets", () => {
    expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
  });

  test("declares private subnets", () => {
    expect(mainContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
  });

  test("public subnets have EKS elb tag", () => {
    expect(mainContent).toMatch(/"kubernetes\.io\/role\/elb"\s*=\s*"1"/);
  });

  test("private subnets have EKS internal-elb tag", () => {
    expect(mainContent).toMatch(/"kubernetes\.io\/role\/internal-elb"\s*=\s*"1"/);
  });

  test("subnets have cluster tag", () => {
    expect(mainContent).toMatch(/"kubernetes\.io\/cluster\/payment-eks-\$\{var\.environment_suffix\}"\s*=\s*"shared"/);
  });

  test("declares Internet Gateway", () => {
    expect(mainContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
  });

  test("declares NAT Gateway", () => {
    expect(mainContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
  });

  test("declares VPC Flow Logs", () => {
    expect(mainContent).toMatch(/resource\s+"aws_flow_log"\s+"main"\s*{/);
  });
});

describe("Terraform EKS Infrastructure - Security Groups", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, "utf8");
  });

  test("declares cluster security group", () => {
    expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"eks_cluster"\s*{/);
  });

  test("declares node security group", () => {
    expect(mainContent).toMatch(/resource\s+"aws_security_group"\s+"eks_nodes"\s*{/);
  });

  test("cluster security group has description", () => {
    const clusterSgMatch = mainContent.match(/resource\s+"aws_security_group"\s+"eks_cluster"\s*{[\s\S]*?description\s*=\s*"([^"]+)"/);
    expect(clusterSgMatch).toBeTruthy();
    expect(clusterSgMatch![1]).toContain("EKS cluster");
  });

  test("node security group allows node-to-node communication", () => {
    expect(mainContent).toMatch(/self\s*=\s*true/);
  });

  test("security group rule allows cluster to node communication", () => {
    expect(mainContent).toMatch(/resource\s+"aws_security_group_rule"\s+"cluster_to_node"/);
  });
});

describe("Terraform EKS Infrastructure - IAM Configuration", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, "utf8");
  });

  test("declares EKS cluster IAM role", () => {
    expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"eks_cluster"\s*{/);
  });

  test("declares node group IAM role", () => {
    expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"eks_node_group"\s*{/);
  });

  test("attaches AmazonEKSClusterPolicy", () => {
    expect(mainContent).toMatch(/AmazonEKSClusterPolicy/);
  });

  test("attaches AmazonEKSVPCResourceController", () => {
    expect(mainContent).toMatch(/AmazonEKSVPCResourceController/);
  });

  test("attaches AmazonEKSWorkerNodePolicy", () => {
    expect(mainContent).toMatch(/AmazonEKSWorkerNodePolicy/);
  });

  test("attaches AmazonEKS_CNI_Policy", () => {
    expect(mainContent).toMatch(/AmazonEKS_CNI_Policy/);
  });

  test("attaches AmazonEC2ContainerRegistryReadOnly", () => {
    expect(mainContent).toMatch(/AmazonEC2ContainerRegistryReadOnly/);
  });

  test("cluster role has assume role policy for eks.amazonaws.com", () => {
    const roleMatch = mainContent.match(/resource\s+"aws_iam_role"\s+"eks_cluster"[\s\S]*?assume_role_policy\s*=\s*jsonencode\(([\s\S]*?)\)/);
    expect(roleMatch).toBeTruthy();
    expect(roleMatch![1]).toContain("eks.amazonaws.com");
  });

  test("node role has assume role policy for ec2.amazonaws.com", () => {
    const roleMatch = mainContent.match(/resource\s+"aws_iam_role"\s+"eks_node_group"[\s\S]*?assume_role_policy\s*=\s*jsonencode\(([\s\S]*?)\)/);
    expect(roleMatch).toBeTruthy();
    expect(roleMatch![1]).toContain("ec2.amazonaws.com");
  });
});

describe("Terraform EKS Infrastructure - Node Group Configuration", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, "utf8");
  });

  test("declares EKS node group", () => {
    expect(mainContent).toMatch(/resource\s+"aws_eks_node_group"\s+"main"\s*{/);
  });

  test("uses private subnets", () => {
    expect(mainContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
  });

  test("configures scaling", () => {
    expect(mainContent).toMatch(/scaling_config\s*{/);
    expect(mainContent).toMatch(/desired_size/);
    expect(mainContent).toMatch(/max_size/);
    expect(mainContent).toMatch(/min_size/);
  });

  test("specifies instance types", () => {
    expect(mainContent).toMatch(/instance_types\s*=\s*\[/);
  });

  test("specifies disk size", () => {
    expect(mainContent).toMatch(/disk_size\s*=\s*\d+/);
  });

  test("uses ON_DEMAND capacity", () => {
    expect(mainContent).toMatch(/capacity_type\s*=\s*"ON_DEMAND"/);
  });
});

describe("Terraform EKS Infrastructure - KMS Encryption", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, "utf8");
  });

  test("declares KMS key", () => {
    expect(mainContent).toMatch(/resource\s+"aws_kms_key"\s+"eks"\s*{/);
  });

  test("KMS key has description", () => {
    expect(mainContent).toMatch(/description\s*=\s*".*encryption/);
  });

  test("enables key rotation", () => {
    expect(mainContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("declares KMS alias", () => {
    expect(mainContent).toMatch(/resource\s+"aws_kms_alias"\s+"eks"\s*{/);
  });
});

describe("Terraform EKS Infrastructure - CloudWatch Logging", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, "utf8");
  });

  test("declares CloudWatch log group for EKS", () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"eks"\s*{/);
  });

  test("declares CloudWatch log group for VPC flow logs", () => {
    expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_log"\s*{/);
  });

  test("log groups have retention period", () => {
    expect(mainContent).toMatch(/retention_in_days/);
  });
});

describe("Terraform EKS Infrastructure - Outputs", () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = fs.readFileSync(OUTPUTS_TF, "utf8");
  });

  test("exports cluster_id", () => {
    expect(outputsContent).toMatch(/output\s+"cluster_id"\s*{/);
  });

  test("exports cluster_name", () => {
    expect(outputsContent).toMatch(/output\s+"cluster_name"\s*{/);
  });

  test("exports cluster_endpoint", () => {
    expect(outputsContent).toMatch(/output\s+"cluster_endpoint"\s*{/);
  });

  test("exports vpc_id", () => {
    expect(outputsContent).toMatch(/output\s+"vpc_id"\s*{/);
  });

  test("exports public_subnet_ids", () => {
    expect(outputsContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
  });

  test("exports private_subnet_ids", () => {
    expect(outputsContent).toMatch(/output\s+"private_subnet_ids"\s*{/);
  });

  test("exports kms_key_arn", () => {
    expect(outputsContent).toMatch(/output\s+"kms_key_arn"\s*{/);
  });

  test("exports node_group_id", () => {
    expect(outputsContent).toMatch(/output\s+"node_group_id"\s*{/);
  });

  test("exports kubeconfig_command", () => {
    expect(outputsContent).toMatch(/output\s+"kubeconfig_command"\s*{/);
  });

  test("cluster_certificate_authority_data is marked sensitive", () => {
    expect(outputsContent).toMatch(/output\s+"cluster_certificate_authority_data"[\s\S]*?sensitive\s*=\s*true/);
  });
});

describe("Terraform EKS Infrastructure - Lifecycle Policies", () => {
  let mainContent: string;

  beforeAll(() => {
    mainContent = fs.readFileSync(MAIN_TF, "utf8");
  });

  test("does NOT contain prevent_destroy lifecycle blocks", () => {
    expect(mainContent).not.toMatch(/prevent_destroy\s*=\s*true/);
  });

  test("does NOT contain deletion protection", () => {
    expect(mainContent).not.toMatch(/deletion_protection\s*=\s*true/);
  });
});

describe("Terraform EKS Infrastructure - Provider Configuration", () => {
  let providerContent: string;

  beforeAll(() => {
    providerContent = fs.readFileSync(PROVIDER_TF, "utf8");
  });

  test("declares AWS provider", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
  });

  test("provider uses variable for region", () => {
    expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
  });

  test("provider has default tags", () => {
    expect(providerContent).toMatch(/default_tags\s*{/);
  });

  test("does NOT declare provider in main.tf", () => {
    const mainContent = fs.readFileSync(MAIN_TF, "utf8");
    expect(mainContent).not.toMatch(/provider\s+"aws"\s*{/);
  });
});
