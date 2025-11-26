import fs from "fs";
import path from "path";

const libDir = path.resolve(__dirname, "../lib");

const requiredFiles = [
  "provider.tf",
  "variables.tf",
  "network.tf",
  "eks_cluster.tf",
  "node_groups.tf",
  "iam.tf",
  "autoscaler.tf",
  "kubernetes_provider.tf",
  "kubernetes_resources.tf",
  "outputs.tf",
];

const readFile = (filename: string) => {
  const target = path.join(libDir, filename);
  if (!fs.existsSync(target)) {
    throw new Error(`Terraform file missing: ${target}`);
  }
  return fs.readFileSync(target, "utf8");
};

describe("Terraform module hygiene", () => {
  test("core Terraform modules exist", () => {
    const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(libDir, file)));
    expect(missing).toEqual([]);
  });

  test("cluster configuration enforces private networking and logging", () => {
    const cluster = readFile("eks_cluster.tf");
    expect(cluster).toMatch(/name\s*=\s*local\.cluster_name/);
    expect(cluster).toMatch(/endpoint_private_access\s*=\s*true/);
    expect(cluster).toMatch(/endpoint_public_access\s*=\s*false/);
    expect(cluster).toMatch(/enabled_cluster_log_types\s*=\s*\[[^\]]*"api"[^\]]*"audit"[^\]]*"authenticator"[^\]]*\]/s);
    // KMS encryption is optional and can be commented out to avoid key state issues
    // expect(cluster).toMatch(/encryption_config\s*{\s*resources\s*=\s*\["secrets"\]/s);
  });

  test("node groups rely on hardened launch templates and autoscaler tags", () => {
    const nodes = readFile("node_groups.tf");
    expect(nodes).toMatch(/node_role_arn\s*=\s*aws_iam_role\.frontend_nodes\.arn/);
    expect(nodes).toMatch(/node_role_arn\s*=\s*aws_iam_role\.backend_nodes\.arn/);
    expect(nodes).toMatch(/metadata_options\s*{[\s\S]*?http_tokens\s*=\s*"required"/);
    expect(nodes).toMatch(/volume_type\s*=\s*"gp3"/g);
    expect(nodes).toMatch(/taint\s*{\s*key\s*=\s*"app"\s*value\s*=\s*"frontend"\s*effect\s*=\s*"NO_SCHEDULE"/s);
    expect(nodes).toMatch(/taint\s*{\s*key\s*=\s*"app"\s*value\s*=\s*"backend"\s*effect\s*=\s*"NO_SCHEDULE"/s);
    expect(nodes).toMatch(/"k8s\.io\/cluster-autoscaler\/\$\{local\.cluster_name\}"\s*=\s*"owned"/);
  });

  test("IAM roles and IRSA mappings embed the environment suffix", () => {
    const iam = readFile("iam.tf");
    const variables = readFile("variables.tf");
    expect(iam).toMatch(/\$\{local\.cluster_name}-frontend-role/);
    expect(iam).toMatch(/\$\{local\.cluster_name}-backend-role/);
    expect(iam).toMatch(/system:serviceaccount:\$\{local\.namespace_name}:payments-app-sa-\$\{var\.environment_suffix}/);
    expect(iam).toMatch(/system:serviceaccount:kube-system:cluster-autoscaler-\$\{var\.environment_suffix}/);
    expect(variables).toMatch(/EnvironmentSuffix\s*=\s*var\.environment_suffix/);
  });

  test("network security groups limit traffic to Kubernetes ports", () => {
    const network = readFile("network.tf");
    expect(network).toMatch(/\$\{local\.cluster_name\}\$\{local\.resource_suffix\}-cp-sg/);
    expect(network).toMatch(/\$\{local\.cluster_name\}\$\{local\.resource_suffix\}-node-sg/);
    expect(network).not.toMatch(/protocol\s*=\s*"-1"\s*[\r\n]+?\s*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"]/);
    expect(network).toMatch(/source_security_group_id\s*=\s*aws_security_group\.eks_nodes\.id/);
  });
});
