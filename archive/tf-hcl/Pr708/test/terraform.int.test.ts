// tests/live-s3-from-outputs.test.ts
// Live verification using Terraform structured outputs (cfn-outputs/all-outputs.json)
// No Terraform CLI; requires AWS creds with read on S3.

import {
  GetBucketAclCommand,
  GetBucketLocationCommand,
  GetBucketPolicyStatusCommand,
  GetBucketTaggingCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";

type TfOutputValue<T> = {
  sensitive: boolean;
  type: any;
  value: T;
};

type StructuredOutputs = {
  bucket_name?: TfOutputValue<string>;
  bucket_tags?: TfOutputValue<Record<string, string>>;
};

function readStructuredOutputs() {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Outputs file not found at ${p}`);
  }
  const out = JSON.parse(fs.readFileSync(p, "utf8")) as StructuredOutputs;

  if (!out.bucket_name?.value) {
    throw new Error("bucket_name.value missing in cfn-outputs/all-outputs.json");
  }
  const bucket = out.bucket_name.value;
  const tags = out.bucket_tags?.value ?? {};

  return { bucket, expectedTags: tags };
}

function normalizeRegion(v?: string): string {
  // S3 returns null/"" for us-east-1
  if (!v || v === "") return "us-east-1";
  return v;
}

async function retry<T>(fn: () => Promise<T>, attempts = 8, baseMs = 800): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const wait = baseMs * Math.pow(1.7, i) + Math.floor(Math.random() * 200);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

const { bucket: BUCKET_NAME, expectedTags: EXPECTED_TAGS } = readStructuredOutputs();
const s3 = new S3Client({
  region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
});

describe("LIVE: S3 verification from Terraform structured outputs", () => {
  test("bucket exists (HeadBucket)", async () => {
    await expect(retry(() => s3.send(new HeadBucketCommand({ Bucket: BUCKET_NAME })))).resolves.toBeTruthy();
  });

  test("bucket region is discoverable", async () => {
    const out = await retry(() => s3.send(new GetBucketLocationCommand({ Bucket: BUCKET_NAME })));
    const region = normalizeRegion(out.LocationConstraint as string | undefined);
    expect(region).toBeTruthy();
  });

  test("versioning is Enabled", async () => {
    const vr = await retry(() => s3.send(new GetBucketVersioningCommand({ Bucket: BUCKET_NAME })));
    expect(vr.Status).toBe("Enabled");
  });

  test("public access block fully enabled", async () => {
    const pab = await retry(() => s3.send(new GetPublicAccessBlockCommand({ Bucket: BUCKET_NAME })));
    const c = pab.PublicAccessBlockConfiguration!;
    expect(c.BlockPublicAcls).toBe(true);
    expect(c.IgnorePublicAcls).toBe(true);
    expect(c.BlockPublicPolicy).toBe(true);
    expect(c.RestrictPublicBuckets).toBe(true);
  });

  test("bucket is not public by policy", async () => {
    try {
      const ps = await s3.send(new GetBucketPolicyStatusCommand({ Bucket: BUCKET_NAME }));
      expect(ps.PolicyStatus?.IsPublic).toBe(false);
    } catch (err: any) {
      const code = err?.name || err?.Code || err?.code;
      if (code === "NoSuchBucketPolicy" || code === "NoSuchBucket" || code === "NotFound") {
        expect(true).toBe(true);
      } else {
        throw err;
      }
    }
  });

  test("ACLs do not grant AllUsers/AuthUsers", async () => {
    const acl = await s3.send(new GetBucketAclCommand({ Bucket: BUCKET_NAME }));
    const hasPublic = (acl.Grants || []).some((g) => {
      const uri = g.Grantee?.URI || "";
      return uri.includes("AllUsers") || uri.includes("AuthenticatedUsers");
    });
    expect(hasPublic).toBe(false);
  });

  test("expected tags are present", async () => {
    // If no tags exist, AWS throws NoSuchTagSet
    try {
      const tg = await s3.send(new GetBucketTaggingCommand({ Bucket: BUCKET_NAME }));
      const actual: Record<string, string> = {};
      for (const t of tg.TagSet || []) {
        if (t.Key && typeof t.Value === "string") actual[t.Key] = t.Value;
      }
      for (const [k, v] of Object.entries(EXPECTED_TAGS)) {
        expect(actual[k]).toBe(v);
      }
    } catch (err: any) {
      const code = err?.name || err?.Code || err?.code;
      if (code === "NoSuchTagSet") {
        throw new Error(`Bucket has no tags; expected at least: ${JSON.stringify(EXPECTED_TAGS)}`);
      }
      throw err;
    }
  });
});
