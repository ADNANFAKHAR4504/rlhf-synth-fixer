import * as pulumi from "@pulumi/pulumi";

// Helper to get output value
async function getOutputValue<T>(output: pulumi.Output<T>): Promise<T> {
    return new Promise((resolve) => {
        output.apply(v => {
            resolve(v);
            return v;
        });
    });
}

// Mock Pulumi runtime
pulumi.runtime.setMocks({
    newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
        const baseState = {
            ...args.inputs,
            id: args.name + "_id",
            arn: `arn:aws:${args.type.split(":")[1]}:us-east-1:123456789012:${args.name}`,
            name: args.name
        };
        return {
            id: args.name + "_id",
            state: baseState
        };
    },
    call: (args: pulumi.runtime.MockCallArgs) => {
        return args.inputs;
    }
}, "compliance-scanner", "dev", true);

// Import the module being tested
import * as app from "../index";

describe("Compliance Scanner Infrastructure", () => {
    describe("Configuration", () => {
        it("should have environment suffix configured", async () => {
            const config = new pulumi.Config();
            const environmentSuffix = config.require("environmentSuffix");
            expect(environmentSuffix).toBeDefined();
        });
    });

    describe("KMS Resources", () => {
        it("should export kmsKeyId", async () => {
            const kmsKeyId = await getOutputValue(app.kmsKeyId);
            expect(kmsKeyId).toBeDefined();
        });

        it("should export kmsKeyArn", async () => {
            const kmsKeyArn = await getOutputValue(app.kmsKeyArn);
            expect(kmsKeyArn).toContain("arn:aws:kms");
        });
    });

    describe("S3 Buckets", () => {
        it("should export complianceReportsBucketName", async () => {
            const bucketName = await getOutputValue(app.complianceReportsBucketName);
            expect(bucketName).toBeDefined();
            expect(bucketName).toContain("synthv1b0b1e4");
        });

        it("should export accessLogsBucketName", async () => {
            const bucketName = await getOutputValue(app.accessLogsBucketName);
            expect(bucketName).toBeDefined();
        });
    });

    describe("DynamoDB Table", () => {
        it("should export scanHistoryTableName", async () => {
            const tableName = await getOutputValue(app.scanHistoryTableName);
            expect(tableName).toBe("compliance-scan-history-synthv1b0b1e4");
        });
    });

    describe("Lambda Functions", () => {
        it("should export scannerLambdaArn", async () => {
            const arn = await getOutputValue(app.scannerLambdaArn);
            expect(arn).toContain("arn:aws:lambda");
        });

        it("should export analysisLambdaArn", async () => {
            const arn = await getOutputValue(app.analysisLambdaArn);
            expect(arn).toContain("arn:aws:lambda");
        });

        it("should export remediationLambdaArn", async () => {
            const arn = await getOutputValue(app.remediationLambdaArn);
            expect(arn).toContain("arn:aws:lambda");
        });

        it("should export securityHubPublisherArn", async () => {
            const arn = await getOutputValue(app.securityHubPublisherArn);
            expect(arn).toContain("arn:aws:lambda");
        });
    });

    describe("SNS Topics", () => {
        it("should export criticalAlertTopicArn", async () => {
            const arn = await getOutputValue(app.criticalAlertTopicArn);
            expect(arn).toContain("arn:aws:sns");
        });

        it("should export highAlertTopicArn", async () => {
            const arn = await getOutputValue(app.highAlertTopicArn);
            expect(arn).toContain("arn:aws:sns");
        });
    });

    describe("Step Functions", () => {
        it("should export stepFunctionArn", async () => {
            const arn = await getOutputValue(app.stepFunctionArn);
            expect(arn).toContain("arn:aws:states");
        });

        it("should export stepFunctionName with environment suffix", async () => {
            const name = await getOutputValue(app.stepFunctionName);
            expect(name).toBe("ComplianceScannerWorkflow-synthv1b0b1e4");
        });
    });

    describe("Parameter Store", () => {
        it("should export parameterStorePrefix", async () => {
            const prefix = await getOutputValue(app.parameterStorePrefix);
            expect(prefix).toBe("/compliance/scanner");
        });
    });

    describe("SSM Automation Documents", () => {
        it("should export automationDocuments array", async () => {
            const docs = await getOutputValue(app.automationDocuments);
            expect(Array.isArray(docs)).toBe(true);
            expect(docs.length).toBe(3);
        });

        it("should have correct document names", async () => {
            const docs = await getOutputValue(app.automationDocuments);
            expect(docs[0]).toContain("RemediateUnencryptedS3Bucket");
            expect(docs[1]).toContain("RemediatePublicRDSInstance");
            expect(docs[2]).toContain("RemediateOverlyPermissiveSecurityGroup");
        });
    });

    describe("CloudWatch Dashboard", () => {
        it("should export dashboardUrl", async () => {
            const url = await getOutputValue(app.dashboardUrl);
            expect(url).toContain("cloudwatch");
            expect(url).toContain("ComplianceScanner-synthv1b0b1e4");
        });
    });
});
