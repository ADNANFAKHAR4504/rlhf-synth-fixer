import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

jest.setTimeout(180_000);

type Region = "us-east-1" | "us-west-2";
const REGIONS: Region[] = ["us-east-1", "us-west-2"];

type AllOutputs = {
  ec2_public_ips?: { value?: { use1?: string; usw2?: string } };
  s3_bucket_names?: {
    value?: {
      audit_use1?: string;
      audit_usw2?: string;
      main_use1?: string;
      main_usw2?: string;
    };
  };
  vpc_ids?: { value?: { use1?: string; usw2?: string } };
  secrets_manager_arns?: { value?: { use1?: string; usw2?: string } };
  rds_ids?: { value?: { use1?: string; usw2?: string } };
  rds_id_use1?: { value?: string } | string;
  rds_id_usw2?: { value?: string } | string;
};

const outputsPath = path.resolve(__dirname, "../cfn-outputs/all-outputs.json");

let OUT: AllOutputs = {};
beforeAll(() => {
  if (fs.existsSync(outputsPath)) {
    try {
      OUT = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
    } catch (e) {
      throw new Error(
        `Failed to parse all-outputs.json at ${outputsPath}. Error: ${(e as Error).message}`
      );
    }
  } else {
    throw new Error(`Outputs file not found at ${outputsPath}.`);
  }
});

// AWS clients
const s3 = (r: Region) => new AWS.S3({ region: r });
const ec2 = (r: Region) => new AWS.EC2({ region: r });
const rds = (r: Region) => new AWS.RDS({ region: r });
const iam = () => new AWS.IAM();

// Output mappers
const appBucketName = (r: Region) =>
  r === "us-east-1" ? OUT.s3_bucket_names?.value?.main_use1 : OUT.s3_bucket_names?.value?.main_usw2;

const auditBucketName = (r: Region) =>
  r === "us-east-1" ? OUT.s3_bucket_names?.value?.audit_use1 : OUT.s3_bucket_names?.value?.audit_usw2;

const vpcIdFor = (r: Region) =>
  r === "us-east-1" ? OUT.vpc_ids?.value?.use1 : OUT.vpc_ids?.value?.usw2;

const publicIpFor = (r: Region) =>
  r === "us-east-1" ? OUT.ec2_public_ips?.value?.use1 : OUT.ec2_public_ips?.value?.usw2;

const secretArnFor = (r: Region) =>
  r === "us-east-1" ? OUT.secrets_manager_arns?.value?.use1 : OUT.secrets_manager_arns?.value?.usw2;

function rdsIdFor(r: Region): string | undefined {
  const preferred = r === "us-east-1" ? OUT.rds_ids?.value?.use1 : OUT.rds_ids?.value?.usw2;
  if (preferred) return preferred;
  if (r === "us-east-1") {
    const v = OUT.rds_id_use1 as any;
    return typeof v === "string" ? v : v?.value;
  }
  const v = OUT.rds_id_usw2 as any;
  return typeof v === "string" ? v : v?.value;
}

// Helpers
const toArray = <T>(x: T | T[] | undefined) => (Array.isArray(x) ? x : x ? [x] : []);

// Find EC2 instance by its public IP (from outputs)
async function findInstanceIdByPublicIp(region: Region): Promise<string> {
  const ip = publicIpFor(region);
  if (!ip) {
    throw new Error(
      `Missing EC2 public IP for ${region} in outputs (ec2_public_ips.value.use1/usw2).`
    );
  }

  const res = await ec2(region).describeInstances({
    Filters: [{ Name: "network-interface.addresses.association.public-ip", Values: [ip.trim()] }],
    MaxResults: 1000,
  }).promise();

  const inst =
    res.Reservations?.flatMap((r) => r.Instances || [])?.find((i) => i.PublicIpAddress === ip) ||
    null;

  if (!inst?.InstanceId) {
    throw new Error(
      `EC2 instance not found by public IP in ${region}. Looked for: ${ip}.`
    );
  }
  return inst.InstanceId;
}

describe("Integration — Multi-Env / Multi-Region using all-outputs.json (exact RDS by ID)", () => {
  describe("S3 — Versioning, Logging, and Public List", () => {
    REGIONS.forEach((region) => {
      test(`S3 app bucket in ${region}: versioning enabled`, async () => {
        const bucket = appBucketName(region);
        expect(bucket).toBeTruthy();

        const ver = await s3(region).getBucketVersioning({ Bucket: bucket! }).promise();
        expect(ver.Status).toBe("Enabled");
      });

      test(`S3 app bucket in ${region}: logging to audit bucket`, async () => {
        const bucket = appBucketName(region);
        const audit = auditBucketName(region);
        expect(bucket && audit).toBeTruthy();

        const log = await s3(region).getBucketLogging({ Bucket: bucket! }).promise();
        expect(log.LoggingEnabled?.TargetBucket).toBe(audit);
      });

      test(`S3 app bucket in ${region}: bucket policy allows public ListBucket`, async () => {
        const bucket = appBucketName(region);
        expect(bucket).toBeTruthy();

        try {
          const pol = await s3(region).getBucketPolicy({ Bucket: bucket! }).promise();
          const doc = JSON.parse(pol.Policy || "{}");
          const hasListAllow = toArray(doc.Statement).some((st: any) => {
            const effect = st.Effect === "Allow";
            const actions = toArray(st.Action);
            const principalStar = st.Principal === "*" || st.Principal?.AWS === "*";
            const resources = toArray(st.Resource);
            return (
              effect &&
              principalStar &&
              actions.includes("s3:ListBucket") &&
              resources.includes(`arn:aws:s3:::${bucket}`)
            );
          });

          expect(hasListAllow).toBe(true);
        } catch (err: any) {
          if (err.code === "NoSuchBucketPolicy") {
            throw new Error(
              `Bucket policy not set for ${bucket} in ${region} (public ListBucket required).`
            );
          }
          throw err;
        }
      });
    });
  });

  describe("RDS — exact DB by ID, class, deletion protection, monitoring & VPC", () => {
    REGIONS.forEach((region) => {
      test(`RDS in ${region}: class db.m5.large, deletion protection, monitoring`, async () => {
        const dbId = rdsIdFor(region);
        expect(dbId).toBeTruthy();

        const db = await getDbArnByInternalId(region, dbId!)
        expect(db).toBeTruthy();

        expect(db?.DBInstanceClass).toBe("db.m5.large");
        expect(db?.DeletionProtection).toBe(true);
        const mon = db?.MonitoringInterval ?? 0;
        expect(mon).toBeGreaterThan(0);
        expect(db?.DBInstanceStatus).toBe("available");
      });

      test(`RDS in ${region}: inside expected VPC from outputs`, async () => {
        const dbId = rdsIdFor(region);
        const vpcId = vpcIdFor(region);
        expect(dbId).toBeTruthy();
        expect(vpcId).toBeTruthy();

        const dbRes = await getDbArnByInternalId(region, dbId!)

        expect(dbRes?.DBSubnetGroup?.VpcId).toBe(vpcId);
      });

      test(`RDS in ${region}: secret ARN region matches (if provided)`, async () => {
        const arn = secretArnFor(region);
        if (!arn) {
          console.warn(`Skip: secrets_manager_arns missing for ${region}`);
          return;
        }
        expect(arn.includes(`secretsmanager:${region}:`)).toBe(true);
      });
    });
  });

  describe("EC2 — instance type and SG rules (SSH restricted + HTTP allowed)", () => {
    REGIONS.forEach((region) => {
      test(`EC2 in ${region}: type t2.micro`, async () => {
        const instanceId = await findInstanceIdByPublicIp(region);
        const res = await ec2(region).describeInstances({ InstanceIds: [instanceId] }).promise();
        const inst = res.Reservations?.[0]?.Instances?.[0];

        expect(inst?.InstanceType).toBe("t2.micro");
      });

      test(`EC2 SG in ${region}: SSH (22) restricted & HTTP (80) allowed`, async () => {
        const instanceId = await findInstanceIdByPublicIp(region);
        const res = await ec2(region).describeInstances({ InstanceIds: [instanceId] }).promise();
        const inst = res.Reservations?.[0]?.Instances?.[0];
        const sgIds = (inst?.SecurityGroups || []).map((g) => g.GroupId!).filter(Boolean);

        expect(sgIds.length).toBeGreaterThan(0);

        const sgs = await ec2(region).describeSecurityGroups({ GroupIds: sgIds }).promise();
        const ingress = (sgs.SecurityGroups || []).flatMap((g) => g.IpPermissions || []);

        const sshRules = ingress.filter((p) => p.FromPort === 22 && p.ToPort === 22);
        expect(sshRules.length).toBeGreaterThan(0);

        const sshCidrs = sshRules.flatMap((p) => p.IpRanges || []).map((r) => r.CidrIp).filter(Boolean) as string[];
        expect(sshCidrs.length).toBeGreaterThan(0);
        sshCidrs.forEach((cidr) =>
          expect(cidr).not.toBe("0.0.0.0/0")
        );

        const httpRules = ingress.filter((p) => p.FromPort === 80 && p.ToPort === 80);
        expect(httpRules.length).toBeGreaterThan(0);
      });
    });
  });

  describe("IAM — EC2 role has S3 access to app bucket", () => {
    REGIONS.forEach((region) => {
      test(`IAM in ${region}: instance role allows s3:ListBucket & s3:GetObject on app bucket`, async () => {
        const bucket = appBucketName(region);
        expect(bucket).toBeTruthy();

        const instanceId = await findInstanceIdByPublicIp(region);
        const bucketArn = `arn:aws:s3:::${bucket}`;
        const objectArn = `arn:aws:s3:::${bucket}/*`;

        const res = await ec2(region).describeInstances({ InstanceIds: [instanceId] }).promise();
        const inst = res.Reservations?.[0]?.Instances?.[0];
        const profileArn = inst?.IamInstanceProfile?.Arn;
        expect(profileArn).toBeTruthy();

        const profileName = profileArn!.split("/").pop()!;
        const profile = await iam().getInstanceProfile({ InstanceProfileName: profileName }).promise();
        const roleName = profile.InstanceProfile?.Roles?.[0]?.RoleName!;
        expect(roleName).toBeTruthy();

        const inline = await iam().listRolePolicies({ RoleName: roleName }).promise();
        const inlineDocs = await Promise.all(
          (inline.PolicyNames || []).map(async (pn) => {
            const pol = await iam().getRolePolicy({ RoleName: roleName, PolicyName: pn }).promise();
            return JSON.parse(decodeURIComponent(pol.PolicyDocument || "{}"));
          })
        );

        const attached = await iam().listAttachedRolePolicies({ RoleName: roleName }).promise();
        const attachedDocs = await Promise.all(
          (attached.AttachedPolicies || []).map(async (ap) => {
            const polMeta = await iam().getPolicy({ PolicyArn: ap.PolicyArn! }).promise();
            const defaultVer = polMeta.Policy?.DefaultVersionId;
            if (!defaultVer) return {};
            const ver = await iam().getPolicyVersion({
              PolicyArn: ap.PolicyArn!,
              VersionId: defaultVer,
            }).promise();
            return JSON.parse(decodeURIComponent(ver.PolicyVersion?.Document || "{}"));
          })
        );

        const docs = [...inlineDocs, ...attachedDocs];
        const allows = (action: string, resource: string) =>
          docs.some((doc: any) =>
            toArray(doc.Statement).some((st: any) => {
              const effect = st.Effect === "Allow";
              const actions = toArray(st.Action);
              const resources = toArray(st.Resource);
              return effect && actions.includes(action) && resources.includes(resource);
            })
          );

        expect(allows("s3:ListBucket", bucketArn)).toBe(true);
        expect(allows("s3:GetObject", objectArn)).toBe(true);
      });
    });
  });

  describe("Tagging — Environment & Project", () => {
    REGIONS.forEach((region) => {
      test(`S3 in ${region}: Environment & Project tags present on app bucket`, async () => {
        const bucket = appBucketName(region);
        expect(bucket).toBeTruthy();

        const tags = await s3(region)
          .getBucketTagging({ Bucket: bucket! })
          .promise()
          .catch((e) => {
            if (e.code === "NoSuchTagSet" || e.code === "NoSuchTagSetError") return { TagSet: [] as any[] };
            throw e;
          });

        const tagMap = Object.fromEntries((tags.TagSet || []).map((t: any) => [t.Key, t.Value]));
        expect(tagMap.Environment).toBeTruthy();
        expect(tagMap.Project).toBeTruthy();
      });

      test(`EC2 & RDS in ${region}: Environment & Project tags present`, async () => {
        // EC2
        const instanceId = await findInstanceIdByPublicIp(region);
        const ec2Res = await ec2(region).describeInstances({ InstanceIds: [instanceId] }).promise();
        const inst = ec2Res.Reservations?.[0]?.Instances?.[0];
        const ec2TagMap = Object.fromEntries((inst?.Tags || []).map((t) => [t.Key, t.Value]));
        expect(ec2TagMap.Environment).toBeTruthy();
        expect(ec2TagMap.Project).toBeTruthy();

        // RDS
        const dbId = rdsIdFor(region);
        expect(dbId).toBeTruthy();

        const dbRes = await getDbArnByInternalId(region, dbId!)
        const arn = dbRes.DBInstanceArn!
        const rdsTags = await rds(region).listTagsForResource({ ResourceName: arn }).promise();
        const rdsTagMap = Object.fromEntries((rdsTags.TagList || []).map((t) => [t.Key, t.Value]));
        expect(rdsTagMap.Environment).toBeTruthy();
        expect(rdsTagMap.Project).toBeTruthy();
      });
    });
  });
});

export async function getDbArnByInternalId(region: Region, internalId: string): Promise<AWS.RDS.DBInstance> {
  const client = rds(region);
  let Marker: string | undefined;
  const MaxRecords = 100;

  do {
    const page = await client
      .describeDBInstances({ Marker, MaxRecords })
      .promise();

    const match = (page.DBInstances || []).find(
      (db) => db.DbiResourceId === internalId
    );

    if (match?.DBInstanceArn) {
      return match;
    }

    Marker = page.Marker;
  } while (Marker);

  throw new Error(`DBID ${internalId} not found in ${region}`);
}