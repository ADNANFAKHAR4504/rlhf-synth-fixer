import * as fs from "fs";
import * as path from "path";
import { EC2Client, DescribeVpcsCommand, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";
import { SecretsManagerClient, DescribeSecretCommand } from "@aws-sdk/client-secrets-manager";

// AWS region
const region = "us-east-1";
const ec2 = new EC2Client({ region });
const iam = new IAMClient({ region });
const sm = new SecretsManagerClient({ region });

type TfOutputValue<T> = {
  sensitive: boolean;
  type: any;
  value: T;
};

type StructuredOutputs = {
  vpc_id?: TfOutputValue<string>;
  bastion_ip?: TfOutputValue<string>;
  private_instance_ids?: TfOutputValue<string[]>;
  public_subnet_ids?: TfOutputValue<string[]>;
  private_subnet_ids?: TfOutputValue<string[]>;
  role_name?: TfOutputValue<string>;
  secrets_manager_secret_arn?: TfOutputValue<string>;
};

function readStructuredOutputs() {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Outputs file not found at ${p}`);
  }

  const parsed = JSON.parse(fs.readFileSync(p, "utf8")) as StructuredOutputs;

  if (
    !parsed.vpc_id?.value ||
    !parsed.bastion_ip?.value ||
    !parsed.private_instance_ids?.value ||
    !parsed.role_name?.value ||
    !parsed.secrets_manager_secret_arn?.value
  ) {
    throw new Error("One or more required Terraform outputs are missing in all-outputs.json");
  }

  return {
    vpcId: parsed.vpc_id.value,
    bastionIp: parsed.bastion_ip.value,
    privateInstanceIds: parsed.private_instance_ids.value,
    publicSubnetIds: parsed.public_subnet_ids?.value || [],
    privateSubnetIds: parsed.private_subnet_ids?.value || [],
    roleName: parsed.role_name.value,
    secretArn: parsed.secrets_manager_secret_arn.value,
  };
}

const o = readStructuredOutputs();

describe("Terraform AWS Infrastructure Integration Tests", () => {
  test("VPC exists", async () => {
    const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [o.vpcId] }));
    expect(res.Vpcs?.length).toBe(1);
  });

  test("Bastion host reachable", () => {
    expect(o.bastionIp).toMatch(/\b\d{1,3}(\.\d{1,3}){3}\b/);
  });

  test("Private instances exist", async () => {
    const res = await ec2.send(new DescribeInstancesCommand({ InstanceIds: o.privateInstanceIds }));
    const instanceCount =
      res.Reservations?.reduce((sum, r) => sum + (r.Instances?.length || 0), 0) || 0;
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
