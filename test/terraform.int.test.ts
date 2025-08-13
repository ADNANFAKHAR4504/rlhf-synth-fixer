import { execSync } from "child_process";
import { EC2Client, DescribeVpcsCommand, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";
import { SecretsManagerClient, DescribeSecretCommand } from "@aws-sdk/client-secrets-manager";

jest.setTimeout(300000); // 5 min timeout

const region = "us-east-1";
const ec2 = new EC2Client({ region });
const iam = new IAMClient({ region });
const sm = new SecretsManagerClient({ region });

function runTerraformCommand(command: string) {
  console.log(`Running terraform ${command}...`);
  execSync(`terraform ${command}`, { stdio: "inherit" });
}

function readStructuredOutputs() {
  const output = execSync("terraform output -json").toString();
  const parsed = JSON.parse(output);
  return {
    vpcId: parsed.vpc_id.value,
    bastionIp: parsed.bastion_ip.value,
    privateInstanceIds: parsed.private_instance_ids.value,
    publicSubnetIds: parsed.public_subnet_ids.value,
    privateSubnetIds: parsed.private_subnet_ids.value,
    roleName: parsed.role_name.value,
    secretArn: parsed.secrets_manager_secret_arn.value, // Correct mapping here
  };
}

describe("Terraform AWS Infrastructure Integration Tests", () => {
  let o: ReturnType<typeof readStructuredOutputs>;

  beforeAll(() => {
    runTerraformCommand("init");
    runTerraformCommand("apply -auto-approve");
    o = readStructuredOutputs();
  });

  afterAll(() => {
    runTerraformCommand("destroy -auto-approve");
  });

  test("VPC exists", async () => {
    const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [o.vpcId] }));
    expect(res.Vpcs?.length).toBe(1);
  });

  test("Bastion host reachable", () => {
    expect(o.bastionIp).toMatch(/\b\d{1,3}(\.\d{1,3}){3}\b/);
  });

  test("Private instances exist", async () => {
    const res = await ec2.send(new DescribeInstancesCommand({ InstanceIds: o.privateInstanceIds }));
    const instanceCount = res.Reservations?.reduce((sum, r) => sum + (r.Instances?.length || 0), 0) || 0;
    expect(instanceCount).toBeGreaterThan(0);
  });

  test("IAM role exists", async () => {
    const res = await iam.send(new GetRoleCommand({ RoleName: o.roleName }));
    expect(res.Role?.RoleName).toBe(o.roleName);
  });

  test("Secrets Manager secret exists", async () => {
    const res = await sm.send(new DescribeSecretCommand({ SecretId: o.secretArn }));
    expect(res.ARN).toBe(o.secretArn);
  });
});
