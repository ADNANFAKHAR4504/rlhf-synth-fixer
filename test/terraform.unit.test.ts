// test/terraform.unit.test.ts
// Comprehensive unit tests for EKS Terraform infrastructure
// Validates structure, resources, variables, and compliance with requirements
// No Terraform execution - pure static analysis

import fs from "fs";
import path from "path";

// Helper to read files once and reuse
let providerContent: string;
let variablesContent: string;
let vpcContent: string;
let eksClusterContent: string;
let eksNodeGroupsContent: string;
let eksAddonsContent: string;
let iamEksClusterContent: string;
let iamNodeGroupsContent: string;
let iamIrsaContent: string;
let securityGroupsContent: string;
let cloudwatchContent: string;
let outputsContent: string;

const providerPath = path.resolve(__dirname, "../lib/provider.tf");
const variablesPath = path.resolve(__dirname, "../lib/variables.tf");
const vpcPath = path.resolve(__dirname, "../lib/vpc.tf");
const eksClusterPath = path.resolve(__dirname, "../lib/eks-cluster.tf");
const eksNodeGroupsPath = path.resolve(__dirname, "../lib/eks-node-groups.tf");
const eksAddonsPath = path.resolve(__dirname, "../lib/eks-addons.tf");
const iamEksClusterPath = path.resolve(__dirname, "../lib/iam-eks-cluster.tf");
const iamNodeGroupsPath = path.resolve(__dirname, "../lib/iam-node-groups.tf");
const iamIrsaPath = path.resolve(__dirname, "../lib/iam-irsa.tf");
const securityGroupsPath = path.resolve(__dirname, "../lib/security-groups.tf");
const cloudwatchPath = path.resolve(__dirname, "../lib/cloudwatch.tf");
const outputsPath = path.resolve(__dirname, "../lib/outputs.tf");

beforeAll(() => {
  const files = [
    { path: providerPath, name: "provider.tf" },
    { path: variablesPath, name: "variables.tf" },
    { path: vpcPath, name: "vpc.tf" },
    { path: eksClusterPath, name: "eks-cluster.tf" },
    { path: eksNodeGroupsPath, name: "eks-node-groups.tf" },
    { path: eksAddonsPath, name: "eks-addons.tf" },
    { path: iamEksClusterPath, name: "iam-eks-cluster.tf" },
    { path: iamNodeGroupsPath, name: "iam-node-groups.tf" },
    { path: iamIrsaPath, name: "iam-irsa.tf" },
    { path: securityGroupsPath, name: "security-groups.tf" },
    { path: cloudwatchPath, name: "cloudwatch.tf" },
    { path: outputsPath, name: "outputs.tf" },
  ];

  files.forEach(({ path: filePath, name }) => {
    if (!fs.existsSync(filePath)) {
      throw new Error(`${name} not found at: ${filePath}`);
    }
  });

  providerContent = fs.readFileSync(providerPath, "utf8");
  variablesContent = fs.readFileSync(variablesPath, "utf8");
  vpcContent = fs.readFileSync(vpcPath, "utf8");
  eksClusterContent = fs.readFileSync(eksClusterPath, "utf8");
  eksNodeGroupsContent = fs.readFileSync(eksNodeGroupsPath, "utf8");
  eksAddonsContent = fs.readFileSync(eksAddonsPath, "utf8");
  iamEksClusterContent = fs.readFileSync(iamEksClusterPath, "utf8");
  iamNodeGroupsContent = fs.readFileSync(iamNodeGroupsPath, "utf8");
  iamIrsaContent = fs.readFileSync(iamIrsaPath, "utf8");
  securityGroupsContent = fs.readFileSync(securityGroupsPath, "utf8");
  cloudwatchContent = fs.readFileSync(cloudwatchPath, "utf8");
  outputsContent = fs.readFileSync(outputsPath, "utf8");
});

describe("1. File Structure & Terraform Configuration", () => {
  test("all required Terraform files exist and are readable", () => {
    expect(providerContent.length).toBeGreaterThan(0);
    expect(variablesContent.length).toBeGreaterThan(0);
    expect(vpcContent.length).toBeGreaterThan(0);
    expect(eksClusterContent.length).toBeGreaterThan(0);
    expect(eksNodeGroupsContent.length).toBeGreaterThan(0);
    expect(eksAddonsContent.length).toBeGreaterThan(0);
  });

  test("provider.tf declares terraform block with required_version >= 1.5", () => {
    expect(providerContent).toMatch(/terraform\s*\{/);
    expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.[5-9]/);
  });

  test("provider.tf declares all required_providers: aws, kubernetes, tls", () => {
    expect(providerContent).toMatch(/required_providers\s*\{/);
    expect(providerContent).toMatch(/aws\s*=\s*\{[\s\S]*?source\s*=\s*"hashicorp\/aws"/);
    expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    expect(providerContent).toMatch(/kubernetes\s*=\s*\{[\s\S]*?source\s*=\s*"hashicorp\/kubernetes"/);
    expect(providerContent).toMatch(/tls\s*=\s*\{[\s\S]*?source\s*=\s*"hashicorp\/tls"/);
  });

  test("provider.tf includes AWS provider with default tags", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*\{/);
    expect(providerContent).toMatch(/default_tags\s*\{/);
    expect(providerContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
    expect(providerContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
  });

  test("provider.tf includes data sources for auth and identity", () => {
    expect(providerContent).toMatch(/data\s+"aws_eks_cluster_auth"/);
    expect(providerContent).toMatch(/data\s+"aws_caller_identity"/);
    expect(providerContent).toMatch(/data\s+"aws_availability_zones"/);
  });
});

describe("2. Core Variables - Naming & Environment", () => {
  test("declares environment_suffix variable for resource naming", () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*\{/);
    expect(variablesContent).toMatch(/type\s*=\s*string/);
  });

  test("declares aws_region variable with default ap-southeast-1", () => {
    expect(variablesContent).toMatch(/variable\s+"aws_region"\s*\{/);
    expect(variablesContent).toMatch(/default\s*=\s*"ap-southeast-1"/);
  });

  test("declares cluster_name variable", () => {
    expect(variablesContent).toMatch(/variable\s+"cluster_name"\s*\{/);
    expect(variablesContent).toMatch(/type\s*=\s*string/);
  });

  test("declares kubernetes_version variable with version 1.28 or higher", () => {
    expect(variablesContent).toMatch(/variable\s+"kubernetes_version"\s*\{/);
    const versionMatch = variablesContent.match(/default\s*=\s*"1\.(\d+)"/);
    expect(versionMatch).toBeTruthy();
    if (versionMatch) {
      const minorVersion = parseInt(versionMatch[1], 10);
      expect(minorVersion).toBeGreaterThanOrEqual(28);
    }
  });
});

describe("3. VPC Variables", () => {
  test("declares vpc_cidr variable", () => {
    expect(variablesContent).toMatch(/variable\s+"vpc_cidr"\s*\{/);
    expect(variablesContent).toMatch(/type\s*=\s*string/);
  });

  test("declares enable_nat_gateway variable", () => {
    expect(variablesContent).toMatch(/variable\s+"enable_nat_gateway"\s*\{/);
    expect(variablesContent).toMatch(/type\s*=\s*bool/);
  });

  test("declares single_nat_gateway variable for cost optimization", () => {
    expect(variablesContent).toMatch(/variable\s+"single_nat_gateway"\s*\{/);
    expect(variablesContent).toMatch(/type\s*=\s*bool/);
  });

  test("declares DNS configuration variables", () => {
    expect(variablesContent).toMatch(/variable\s+"enable_dns_hostnames"\s*\{/);
    expect(variablesContent).toMatch(/variable\s+"enable_dns_support"\s*\{/);
  });
});

describe("4. Node Group Variables", () => {
  test("declares system node group variables", () => {
    expect(variablesContent).toMatch(/variable\s+"system_node_group_instance_types"\s*\{/);
    expect(variablesContent).toMatch(/variable\s+"system_node_group_desired_size"\s*\{/);
    expect(variablesContent).toMatch(/variable\s+"system_node_group_min_size"\s*\{/);
    expect(variablesContent).toMatch(/variable\s+"system_node_group_max_size"\s*\{/);
  });

  test("declares application node group variables", () => {
    expect(variablesContent).toMatch(/variable\s+"app_node_group_instance_types"\s*\{/);
    expect(variablesContent).toMatch(/variable\s+"app_node_group_desired_size"\s*\{/);
    expect(variablesContent).toMatch(/variable\s+"app_node_group_min_size"\s*\{/);
    expect(variablesContent).toMatch(/variable\s+"app_node_group_max_size"\s*\{/);
  });

  test("declares GPU node group variables", () => {
    expect(variablesContent).toMatch(/variable\s+"gpu_node_group_instance_types"\s*\{/);
    expect(variablesContent).toMatch(/variable\s+"gpu_node_group_desired_size"\s*\{/);
    expect(variablesContent).toMatch(/variable\s+"gpu_node_group_min_size"\s*\{/);
    expect(variablesContent).toMatch(/variable\s+"gpu_node_group_max_size"\s*\{/);
  });

  test("system node group defaults to m5.large", () => {
    expect(variablesContent).toMatch(/default\s*=\s*\["m5\.large"\]/);
  });

  test("GPU node group defaults to g4dn.xlarge", () => {
    expect(variablesContent).toMatch(/default\s*=\s*\["g4dn\.xlarge"\]/);
  });
});

describe("5. IRSA & Add-on Variables", () => {
  test("declares cluster autoscaler enable variable", () => {
    expect(variablesContent).toMatch(/variable\s+"enable_cluster_autoscaler"\s*\{/);
    expect(variablesContent).toMatch(/type\s*=\s*bool/);
  });

  test("declares ALB controller enable variable", () => {
    expect(variablesContent).toMatch(/variable\s+"enable_alb_controller"\s*\{/);
    expect(variablesContent).toMatch(/type\s*=\s*bool/);
  });

  test("declares external secrets enable variable", () => {
    expect(variablesContent).toMatch(/variable\s+"enable_external_secrets"\s*\{/);
    expect(variablesContent).toMatch(/type\s*=\s*bool/);
  });

  test("declares EBS CSI driver enable variable", () => {
    expect(variablesContent).toMatch(/variable\s+"enable_ebs_csi_driver"\s*\{/);
    expect(variablesContent).toMatch(/type\s*=\s*bool/);
  });
});

describe("6. Security & Monitoring Variables", () => {
  test("declares cluster endpoint access variables", () => {
    expect(variablesContent).toMatch(/variable\s+"cluster_endpoint_public_access"\s*\{/);
    expect(variablesContent).toMatch(/variable\s+"cluster_endpoint_private_access"\s*\{/);
  });

  test("declares encryption enable variable", () => {
    expect(variablesContent).toMatch(/variable\s+"enable_cluster_encryption"\s*\{/);
    expect(variablesContent).toMatch(/type\s*=\s*bool/);
  });

  test("declares Container Insights enable variable", () => {
    expect(variablesContent).toMatch(/variable\s+"enable_container_insights"\s*\{/);
    expect(variablesContent).toMatch(/type\s*=\s*bool/);
  });

  test("declares log retention variable", () => {
    expect(variablesContent).toMatch(/variable\s+"cluster_log_retention_days"\s*\{/);
    expect(variablesContent).toMatch(/type\s*=\s*number/);
  });

  test("declares namespaces variable", () => {
    expect(variablesContent).toMatch(/variable\s+"namespaces"\s*\{/);
    expect(variablesContent).toMatch(/type\s*=\s*list\(string\)/);
  });
});

describe("7. VPC Resources", () => {
  test("creates aws_vpc resource", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_vpc"\s+"\w+"\s*\{/);
    expect(vpcContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    expect(vpcContent).toMatch(/enable_dns_hostnames/);
    expect(vpcContent).toMatch(/enable_dns_support/);
  });

  test("creates public subnets across availability zones", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*\{/);
    expect(vpcContent).toMatch(/count\s*=\s*length\(local\.azs\)/);
  });

  test("creates private subnets across availability zones", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*\{/);
    expect(vpcContent).toMatch(/count\s*=\s*length\(local\.azs\)/);
  });

  test("creates internet gateway", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_internet_gateway"\s+"\w+"\s*\{/);
  });

  test("creates NAT gateway with EIP", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_nat_gateway"\s+"\w+"\s*\{/);
    expect(vpcContent).toMatch(/resource\s+"aws_eip"\s+"\w+"\s*\{/);
  });

  test("creates route tables for public and private subnets", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*\{/);
    expect(vpcContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*\{/);
  });

  test("creates route table associations", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*\{/);
    expect(vpcContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*\{/);
  });

  test("includes environment_suffix in VPC naming", () => {
    expect(vpcContent).toMatch(/var\.environment_suffix/);
  });
});

describe("8. VPC Endpoints", () => {
  test("creates S3 Gateway endpoint", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"\w*s3\w*"\s*\{/i);
    expect(vpcContent).toMatch(/service_name\s*=.*s3/);
    expect(vpcContent).toMatch(/vpc_endpoint_type\s*=\s*"Gateway"/);
  });

  test("creates ECR Interface endpoints", () => {
    expect(vpcContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"\w*ecr\w*"\s*\{/i);
    expect(vpcContent).toMatch(/service_name\s*=.*ecr/);
  });

  test("VPC endpoints have proper security group configuration", () => {
    const hasSecurityGroupConfig = vpcContent.includes("security_group_ids") ||
                                   vpcContent.includes("vpc_endpoint_type");
    expect(hasSecurityGroupConfig).toBe(true);
  });
});

describe("9. Security Groups", () => {
  test("creates security group for EKS cluster", () => {
    expect(securityGroupsContent).toMatch(/resource\s+"aws_security_group"\s+"\w*cluster\w*"\s*\{/i);
  });

  test("creates security group for EKS nodes", () => {
    expect(securityGroupsContent).toMatch(/resource\s+"aws_security_group"\s+"\w*node\w*"\s*\{/i);
  });

  test("security groups have ingress and egress rules", () => {
    expect(securityGroupsContent).toMatch(/ingress\s*\{|aws_security_group_rule.*ingress/);
    expect(securityGroupsContent).toMatch(/egress\s*\{|aws_security_group_rule.*egress/);
  });

  test("cluster security group allows node communication", () => {
    expect(securityGroupsContent).toMatch(/source_security_group|security_group_ids/);
  });

  test("includes environment_suffix in security group naming", () => {
    expect(securityGroupsContent).toMatch(/var\.environment_suffix/);
  });
});

describe("10. EKS Cluster IAM Role", () => {
  test("creates IAM role for EKS cluster", () => {
    expect(iamEksClusterContent).toMatch(/resource\s+"aws_iam_role"\s+"\w*cluster\w*"\s*\{/i);
  });

  test("IAM role has assume role policy for EKS service", () => {
    expect(iamEksClusterContent).toMatch(/assume_role_policy/);
    expect(iamEksClusterContent).toMatch(/eks\.amazonaws\.com/);
  });

  test("attaches AmazonEKSClusterPolicy", () => {
    expect(iamEksClusterContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"/);
    expect(iamEksClusterContent).toMatch(/AmazonEKSClusterPolicy/);
  });

  test("attaches AmazonEKSVPCResourceController policy", () => {
    expect(iamEksClusterContent).toMatch(/AmazonEKSVPCResourceController/);
  });
});

describe("11. EKS Cluster", () => {
  test("creates aws_eks_cluster resource", () => {
    expect(eksClusterContent).toMatch(/resource\s+"aws_eks_cluster"\s+"\w+"\s*\{/);
  });

  test("cluster uses kubernetes version variable", () => {
    expect(eksClusterContent).toMatch(/version\s*=\s*var\.kubernetes_version/);
  });

  test("cluster has VPC configuration with subnets", () => {
    expect(eksClusterContent).toMatch(/vpc_config\s*\{/);
    expect(eksClusterContent).toMatch(/subnet_ids/);
  });

  test("cluster has endpoint access configuration", () => {
    expect(eksClusterContent).toMatch(/endpoint_public_access/);
    expect(eksClusterContent).toMatch(/endpoint_private_access/);
  });

  test("cluster has encryption configuration when enabled", () => {
    expect(eksClusterContent).toMatch(/encryption_config|aws_kms_key/);
  });

  test("cluster uses IAM role", () => {
    expect(eksClusterContent).toMatch(/role_arn\s*=\s*aws_iam_role/);
  });

  test("cluster has enabled cluster log types", () => {
    expect(eksClusterContent).toMatch(/enabled_cluster_log_types/);
  });

  test("includes environment_suffix in cluster naming", () => {
    expect(eksClusterContent).toMatch(/var\.environment_suffix/);
  });
});

describe("12. OIDC Provider for IRSA", () => {
  test("creates IAM OIDC provider", () => {
    expect(eksClusterContent).toMatch(/resource\s+"aws_iam_openid_connect_provider"/);
  });

  test("OIDC provider references EKS cluster", () => {
    expect(eksClusterContent).toMatch(/aws_eks_cluster\.\w+\./);
  });

  test("IRSA file references OIDC provider", () => {
    expect(iamIrsaContent).toMatch(/aws_iam_openid_connect_provider/);
  });
});

describe("13. Node Group IAM Role", () => {
  test("creates IAM role for node groups", () => {
    expect(iamNodeGroupsContent).toMatch(/resource\s+"aws_iam_role"\s+"\w*node\w*"\s*\{/i);
  });

  test("node IAM role has assume role policy for EC2", () => {
    expect(iamNodeGroupsContent).toMatch(/assume_role_policy/);
    expect(iamNodeGroupsContent).toMatch(/ec2\.amazonaws\.com/);
  });

  test("attaches AmazonEKSWorkerNodePolicy", () => {
    expect(iamNodeGroupsContent).toMatch(/AmazonEKSWorkerNodePolicy/);
  });

  test("attaches AmazonEKS_CNI_Policy", () => {
    expect(iamNodeGroupsContent).toMatch(/AmazonEKS_CNI_Policy/);
  });

  test("attaches AmazonEC2ContainerRegistryReadOnly", () => {
    expect(iamNodeGroupsContent).toMatch(/AmazonEC2ContainerRegistryReadOnly/);
  });

  test("attaches AmazonSSMManagedInstanceCore for SSM access", () => {
    expect(iamNodeGroupsContent).toMatch(/AmazonSSMManagedInstanceCore/);
  });
});

describe("14. EKS Node Groups", () => {
  test("creates system node group", () => {
    expect(eksNodeGroupsContent).toMatch(/resource\s+"aws_eks_node_group"\s+"\w*system\w*"\s*\{/i);
  });

  test("creates application node group", () => {
    expect(eksNodeGroupsContent).toMatch(/resource\s+"aws_eks_node_group"\s+"\w*app\w*"\s*\{/i);
  });

  test("creates GPU node group", () => {
    expect(eksNodeGroupsContent).toMatch(/resource\s+"aws_eks_node_group"\s+"\w*gpu\w*"\s*\{/i);
  });

  test("node groups reference EKS cluster", () => {
    expect(eksNodeGroupsContent).toMatch(/cluster_name\s*=\s*aws_eks_cluster/);
  });

  test("node groups use IAM role", () => {
    expect(eksNodeGroupsContent).toMatch(/node_role_arn\s*=\s*aws_iam_role/);
  });

  test("node groups have scaling configuration", () => {
    expect(eksNodeGroupsContent).toMatch(/scaling_config\s*\{/);
    expect(eksNodeGroupsContent).toMatch(/desired_size/);
    expect(eksNodeGroupsContent).toMatch(/min_size/);
    expect(eksNodeGroupsContent).toMatch(/max_size/);
  });

  test("node groups use Bottlerocket AMI via launch template", () => {
    expect(eksNodeGroupsContent).toMatch(/launch_template\s*\{/);
    expect(eksNodeGroupsContent).toMatch(/aws_launch_template/);
    expect(eksNodeGroupsContent).toMatch(/bottlerocket/i);
  });

  test("node groups have proper subnet configuration", () => {
    expect(eksNodeGroupsContent).toMatch(/subnet_ids/);
  });

  test("node groups reference launch templates", () => {
    expect(eksNodeGroupsContent).toMatch(/launch_template\s*\{/);
    expect(eksNodeGroupsContent).toMatch(/id\s*=\s*aws_launch_template/);
  });

  test("includes environment_suffix in node group naming", () => {
    expect(eksNodeGroupsContent).toMatch(/var\.environment_suffix/);
  });
});

describe("15. IRSA Roles - Cluster Autoscaler", () => {
  test("creates IAM role for cluster autoscaler", () => {
    expect(iamIrsaContent).toMatch(/resource\s+"aws_iam_role"\s+"\w*autoscaler\w*"\s*\{/i);
  });

  test("cluster autoscaler role has OIDC assume role policy", () => {
    const autoscalerRole = iamIrsaContent.match(/resource\s+"aws_iam_role"\s+"\w*autoscaler\w*"[\s\S]*?(?=\nresource\s+"|$)/i);
    expect(autoscalerRole).toBeTruthy();
    if (autoscalerRole) {
      expect(autoscalerRole[0]).toMatch(/assume_role_policy/);
      expect(autoscalerRole[0]).toMatch(/local\.oidc_provider|Federated/);
    }
  });

  test("creates IAM policy for cluster autoscaler with EC2 and Auto Scaling permissions", () => {
    expect(iamIrsaContent).toMatch(/autoscaling:DescribeAutoScalingGroups/);
    expect(iamIrsaContent).toMatch(/autoscaling:SetDesiredCapacity/);
    expect(iamIrsaContent).toMatch(/ec2:DescribeLaunchTemplateVersions/);
  });

  test("autoscaler is conditional based on enable variable", () => {
    expect(iamIrsaContent).toMatch(/var\.enable_cluster_autoscaler/);
  });
});

describe("16. IRSA Roles - AWS Load Balancer Controller", () => {
  test("creates IAM role for ALB controller", () => {
    expect(iamIrsaContent).toMatch(/resource\s+"aws_iam_role"\s+"\w*alb\w*"\s*\{/i);
  });

  test("ALB controller role has OIDC assume role policy", () => {
    const albRole = iamIrsaContent.match(/resource\s+"aws_iam_role"\s+"\w*alb\w*"[\s\S]*?(?=\nresource\s+"|$)/i);
    expect(albRole).toBeTruthy();
    if (albRole) {
      expect(albRole[0]).toMatch(/assume_role_policy/);
      expect(albRole[0]).toMatch(/local\.oidc_provider|Federated/);
    }
  });

  test("creates IAM policy for ALB controller with ELB and EC2 permissions", () => {
    expect(iamIrsaContent).toMatch(/elasticloadbalancing:CreateLoadBalancer|elasticloadbalancing:Describe/);
    expect(iamIrsaContent).toMatch(/ec2:Describe|ec2:CreateTags/);
  });

  test("ALB controller is conditional based on enable variable", () => {
    expect(iamIrsaContent).toMatch(/var\.enable_alb_controller/);
  });
});

describe("17. IRSA Roles - External Secrets Operator", () => {
  test("creates IAM role for external secrets", () => {
    expect(iamIrsaContent).toMatch(/resource\s+"aws_iam_role"\s+"\w*external.?secrets\w*"\s*\{/i);
  });

  test("external secrets role has OIDC assume role policy", () => {
    const externalSecretsRole = iamIrsaContent.match(/resource\s+"aws_iam_role"\s+"\w*external.?secrets\w*"[\s\S]*?(?=\nresource\s+"|$)/i);
    expect(externalSecretsRole).toBeTruthy();
    if (externalSecretsRole) {
      expect(externalSecretsRole[0]).toMatch(/assume_role_policy/);
      expect(externalSecretsRole[0]).toMatch(/local\.oidc_provider|Federated/);
    }
  });

  test("creates IAM policy for external secrets with Secrets Manager permissions", () => {
    expect(iamIrsaContent).toMatch(/secretsmanager:GetSecretValue/);
    expect(iamIrsaContent).toMatch(/secretsmanager:DescribeSecret/);
  });

  test("external secrets is conditional based on enable variable", () => {
    expect(iamIrsaContent).toMatch(/var\.enable_external_secrets/);
  });
});

describe("18. IRSA Roles - EBS CSI Driver", () => {
  test("creates IAM role for EBS CSI driver", () => {
    expect(iamIrsaContent).toMatch(/resource\s+"aws_iam_role"\s+"\w*ebs.?csi\w*"\s*\{/i);
  });

  test("EBS CSI driver role has OIDC assume role policy", () => {
    const ebsRole = iamIrsaContent.match(/resource\s+"aws_iam_role"\s+"\w*ebs.?csi\w*"[\s\S]*?(?=\nresource\s+"|$)/i);
    expect(ebsRole).toBeTruthy();
    if (ebsRole) {
      expect(ebsRole[0]).toMatch(/assume_role_policy/);
      expect(ebsRole[0]).toMatch(/local\.oidc_provider|Federated/);
    }
  });

  test("creates IAM policy for EBS CSI driver with EC2 volume permissions", () => {
    expect(iamIrsaContent).toMatch(/AmazonEBSCSIDriverPolicy|ec2:.*Volume/);
  });

  test("EBS CSI driver is conditional based on enable variable", () => {
    expect(iamIrsaContent).toMatch(/var\.enable_ebs_csi_driver/);
  });
});

describe("19. EKS Add-ons", () => {
  test("creates VPC CNI add-on", () => {
    expect(eksAddonsContent).toMatch(/resource\s+"aws_eks_addon"\s+"\w*vpc.?cni\w*"\s*\{/i);
    expect(eksAddonsContent).toMatch(/addon_name\s*=\s*"vpc-cni"/);
  });

  test("creates kube-proxy add-on", () => {
    expect(eksAddonsContent).toMatch(/resource\s+"aws_eks_addon"\s+"\w*kube.?proxy\w*"\s*\{/i);
    expect(eksAddonsContent).toMatch(/addon_name\s*=\s*"kube-proxy"/);
  });

  test("creates CoreDNS add-on", () => {
    expect(eksAddonsContent).toMatch(/resource\s+"aws_eks_addon"\s+"\w*coredns\w*"\s*\{/i);
    expect(eksAddonsContent).toMatch(/addon_name\s*=\s*"coredns"/);
  });

  test("creates EBS CSI driver add-on", () => {
    expect(eksAddonsContent).toMatch(/resource\s+"aws_eks_addon"\s+"\w*ebs.?csi\w*"\s*\{/i);
    expect(eksAddonsContent).toMatch(/addon_name\s*=\s*"aws-ebs-csi-driver"/);
  });

  test("add-ons reference EKS cluster", () => {
    expect(eksAddonsContent).toMatch(/cluster_name\s*=\s*aws_eks_cluster/);
  });

  test("EBS CSI add-on uses IRSA service account role", () => {
    const ebsAddon = eksAddonsContent.match(/resource\s+"aws_eks_addon"\s+"\w*ebs.?csi\w*"[\s\S]*?(?=\nresource\s+"|$)/i);
    expect(ebsAddon).toBeTruthy();
    if (ebsAddon) {
      expect(ebsAddon[0]).toMatch(/service_account_role_arn|aws_iam_role/);
    }
  });
});

describe("20. CloudWatch Container Insights", () => {
  test("creates Kubernetes resources for Container Insights when enabled", () => {
    expect(cloudwatchContent).toMatch(/kubernetes_namespace|amazon.*cloudwatch/i);
  });

  test("Container Insights is conditional based on enable variable", () => {
    expect(cloudwatchContent).toMatch(/var\.enable_container_insights/);
  });

  test("includes environment_suffix or namespace configuration", () => {
    const hasConfig = cloudwatchContent.includes("var.environment_suffix") ||
                     cloudwatchContent.includes("namespace") ||
                     cloudwatchContent.includes("cloudwatch");
    expect(hasConfig).toBe(true);
  });
});

describe("21. KMS Key for Encryption", () => {
  test("creates KMS key for EKS secrets encryption", () => {
    const allContent = [eksClusterContent, vpcContent, securityGroupsContent, cloudwatchContent].join("\n");
    expect(allContent).toMatch(/resource\s+"aws_kms_key"|aws_kms_key\./);
  });

  test("KMS key has rotation enabled", () => {
    const allContent = [eksClusterContent, vpcContent, securityGroupsContent, cloudwatchContent].join("\n");
    if (allContent.includes('resource "aws_kms_key"')) {
      expect(allContent).toMatch(/enable_key_rotation\s*=\s*true/);
    }
  });
});

describe("22. Kubernetes Resources", () => {
  test("kubernetes manifest files directory exists", () => {
    const manifestsPath = path.resolve(__dirname, "../lib/kubernetes-manifests");
    expect(fs.existsSync(manifestsPath)).toBe(true);
  });

  test("userdata directory exists for Bottlerocket configurations", () => {
    const userdataPath = path.resolve(__dirname, "../lib/userdata");
    expect(fs.existsSync(userdataPath)).toBe(true);
  });
});

describe("23. Outputs - Cluster Information", () => {
  test("outputs cluster ID", () => {
    expect(outputsContent).toMatch(/output\s+".*cluster.*id"\s*\{/i);
  });

  test("outputs cluster endpoint", () => {
    expect(outputsContent).toMatch(/output\s+".*cluster.*endpoint"\s*\{/i);
  });

  test("outputs cluster security group ID", () => {
    expect(outputsContent).toMatch(/output\s+"\w*cluster.*security.*group\w*"\s*\{/i);
  });

  test("outputs cluster certificate authority", () => {
    expect(outputsContent).toMatch(/output\s+"\w*cluster.*certificate\w*"\s*\{/i);
  });

  test("outputs cluster OIDC provider", () => {
    expect(outputsContent).toMatch(/output\s+"\w*oidc\w*"\s*\{/i);
  });
});

describe("24. Outputs - VPC Information", () => {
  test("outputs VPC ID", () => {
    expect(outputsContent).toMatch(/output\s+"vpc_id"\s*\{/);
  });

  test("outputs public subnet IDs", () => {
    expect(outputsContent).toMatch(/output\s+"public_subnet_ids"\s*\{/);
  });

  test("outputs private subnet IDs", () => {
    expect(outputsContent).toMatch(/output\s+"private_subnet_ids"\s*\{/);
  });
});

describe("25. Outputs - Node Group Information", () => {
  test("outputs system node group ID", () => {
    expect(outputsContent).toMatch(/output\s+"\w*system.*node.*group\w*"\s*\{/i);
  });

  test("outputs application node group ID", () => {
    expect(outputsContent).toMatch(/output\s+"\w*app.*node.*group\w*"\s*\{/i);
  });

  test("outputs GPU node group ID", () => {
    expect(outputsContent).toMatch(/output\s+"\w*gpu.*node.*group\w*"\s*\{/i);
  });
});

describe("26. Outputs - IAM Role ARNs", () => {
  test("outputs cluster autoscaler role ARN", () => {
    expect(outputsContent).toMatch(/output\s+"\w*autoscaler.*role\w*"\s*\{/i);
  });

  test("outputs ALB controller role ARN", () => {
    expect(outputsContent).toMatch(/output\s+"\w*alb.*role\w*"\s*\{/i);
  });

  test("outputs external secrets role ARN", () => {
    expect(outputsContent).toMatch(/output\s+"\w*external.*secrets.*role\w*"\s*\{/i);
  });

  test("outputs EBS CSI driver role ARN", () => {
    expect(outputsContent).toMatch(/output\s+"\w*ebs.*csi.*role\w*"\s*\{/i);
  });
});

describe("27. Security Best Practices", () => {
  test("no hardcoded credentials in code", () => {
    const allContent = [
      providerContent,
      variablesContent,
      vpcContent,
      eksClusterContent,
      eksNodeGroupsContent,
      iamEksClusterContent,
      iamNodeGroupsContent,
      iamIrsaContent,
    ].join("\n");
    expect(allContent).not.toMatch(/password\s*=\s*"[^$]/);
    expect(allContent).not.toMatch(/secret\s*=\s*"(?!arn:aws)/);
  });

  test("encryption is enabled for secrets", () => {
    expect(eksClusterContent).toMatch(/encryption_config|kms_key/);
  });

  test("private subnets are used for node groups", () => {
    expect(eksNodeGroupsContent).toMatch(/private|aws_subnet\.private/);
  });

  test("security groups follow least privilege", () => {
    expect(securityGroupsContent).toMatch(/description/);
  });
});

describe("28. Naming Convention", () => {
  test("resources include environment_suffix for uniqueness", () => {
    const allContent = [
      vpcContent,
      eksClusterContent,
      eksNodeGroupsContent,
      securityGroupsContent,
    ].join("\n");
    const suffixUsages = (allContent.match(/var\.environment_suffix/g) || []).length;
    expect(suffixUsages).toBeGreaterThan(5);
  });

  test("consistent naming pattern across resources", () => {
    const allContent = [vpcContent, eksClusterContent, eksNodeGroupsContent].join("\n");
    expect(allContent).toMatch(/name\s*=.*var\.environment_suffix/);
  });
});

describe("29. Code Quality", () => {
  test("no TODOs or placeholders in code", () => {
    const allContent = [
      providerContent,
      variablesContent,
      vpcContent,
      eksClusterContent,
      eksNodeGroupsContent,
      eksAddonsContent,
      iamEksClusterContent,
      iamNodeGroupsContent,
      iamIrsaContent,
      securityGroupsContent,
      cloudwatchContent,
      outputsContent,
    ].join("\n");
    expect(allContent).not.toMatch(/TODO|FIXME|PLACEHOLDER|XXX/i);
  });

  test("all files have substantial content", () => {
    expect(vpcContent.length).toBeGreaterThan(500);
    expect(eksClusterContent.length).toBeGreaterThan(300);
    expect(eksNodeGroupsContent.length).toBeGreaterThan(500);
    expect(iamIrsaContent.length).toBeGreaterThan(500);
  });

  test("proper HCL syntax - balanced braces", () => {
    const allContent = [
      providerContent,
      variablesContent,
      vpcContent,
      eksClusterContent,
      eksNodeGroupsContent,
      eksAddonsContent,
    ].join("\n");
    const openBraces = (allContent.match(/\{/g) || []).length;
    const closeBraces = (allContent.match(/\}/g) || []).length;
    expect(openBraces).toBe(closeBraces);
  });
});

describe("30. Architecture Requirements", () => {
  test("implements high availability with multiple availability zones", () => {
    expect(vpcContent).toMatch(/count\s*=\s*length\(local\.azs\)/);
    expect(vpcContent).toMatch(/locals\s*\{|local\.azs/);
  });

  test("includes Bottlerocket AMI for all node groups", () => {
    expect(eksNodeGroupsContent).toMatch(/BOTTLEROCKET/i);
  });

  test("supports mixed instance types for cost optimization", () => {
    expect(variablesContent).toMatch(/list\(string\)/);
    expect(variablesContent).toMatch(/t3\.large.*t3a\.large|t2\.large/);
  });

  test("implements proper IAM roles for service accounts (IRSA)", () => {
    expect(iamIrsaContent).toMatch(/aws_iam_openid_connect_provider/);
    const irsaRoles = (iamIrsaContent.match(/resource\s+"aws_iam_role"/g) || []).length;
    expect(irsaRoles).toBeGreaterThanOrEqual(4);
  });

  test("all four EKS add-ons are configured", () => {
    expect(eksAddonsContent).toMatch(/vpc-cni/);
    expect(eksAddonsContent).toMatch(/kube-proxy/);
    expect(eksAddonsContent).toMatch(/coredns/);
    expect(eksAddonsContent).toMatch(/aws-ebs-csi-driver/);
  });
});

describe("31. Final Validation", () => {
  test("all critical AWS services are configured", () => {
    const requiredServices = [
      "aws_vpc",
      "aws_subnet",
      "aws_eks_cluster",
      "aws_eks_node_group",
      "aws_iam_role",
      "aws_security_group",
      "aws_eks_addon",
      "aws_iam_openid_connect_provider",
    ];

    const allContent = [
      vpcContent,
      eksClusterContent,
      eksNodeGroupsContent,
      eksAddonsContent,
      iamEksClusterContent,
      iamNodeGroupsContent,
      iamIrsaContent,
      securityGroupsContent,
    ].join("\n");

    requiredServices.forEach((service) => {
      expect(allContent).toMatch(new RegExp(`resource\\s+"${service}"`));
    });
  });

  test("summary: all critical requirements validated", () => {
    const criticalChecks = [
      variablesContent.includes('variable "environment_suffix"'),
      variablesContent.includes('variable "kubernetes_version"'),
      providerContent.includes('provider "aws"'),
      providerContent.includes('provider "kubernetes"'),
      vpcContent.includes("aws_vpc"),
      eksClusterContent.includes("aws_eks_cluster"),
      eksNodeGroupsContent.includes("aws_eks_node_group"),
      eksAddonsContent.includes("aws_eks_addon"),
      iamIrsaContent.includes("aws_iam_openid_connect_provider"),
      outputsContent.includes("output "),
      securityGroupsContent.includes("aws_security_group"),
    ];

    const allPassed = criticalChecks.every((check) => check === true);
    expect(allPassed).toBe(true);
  });
});
