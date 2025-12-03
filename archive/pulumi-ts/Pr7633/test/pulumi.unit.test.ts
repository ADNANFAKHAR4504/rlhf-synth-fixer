/**
 * Unit tests for EC2 Compliance Monitoring Infrastructure
 * These tests verify the infrastructure code structure and configuration
 */

describe("EC2 Compliance Monitoring Infrastructure", () => {
    describe("Infrastructure Module", () => {
        it("should have lib/index.ts file", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            expect(fs.existsSync(indexPath)).toBe(true);
        });

        it("should import required Pulumi modules", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("import * as pulumi from");
            expect(content).toContain("import * as aws from");
            expect(content).toContain("@pulumi/pulumi");
            expect(content).toContain("@pulumi/aws");
        });

        it("should use environmentSuffix config", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("config.require");
            expect(content).toContain("environmentSuffix");
        });

        it("should export all required outputs", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("export const reportsBucketName");
            expect(content).toContain("export const reportsBucketArn");
            expect(content).toContain("export const snsTopicArn");
            expect(content).toContain("export const snsTopicName");
            expect(content).toContain("export const lambdaFunctionName");
            expect(content).toContain("export const lambdaFunctionArn");
            expect(content).toContain("export const scheduleRuleName");
            expect(content).toContain("export const glueDatabaseName");
            expect(content).toContain("export const glueCrawlerName");
            expect(content).toContain("export const dashboardName");
            expect(content).toContain("export const athenaWorkgroupName");
        });
    });

    describe("S3 Bucket Configuration", () => {
        it("should create S3 bucket with environmentSuffix", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("aws.s3.Bucket");
            expect(content).toContain("ec2-compliance-reports-${environmentSuffix}");
        });

        it("should enable versioning on S3 bucket", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("versioning");
            expect(content).toContain("enabled: true");
        });

        it("should have lifecycle rules for S3 bucket", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("lifecycleRules");
            expect(content).toContain("noncurrentVersionExpiration");
        });
    });

    describe("SNS Topic Configuration", () => {
        it("should create SNS topic with environmentSuffix", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("aws.sns.Topic");
            expect(content).toContain("ec2-compliance-alerts-${environmentSuffix}");
        });

        it("should have display name for SNS topic", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("displayName");
        });
    });

    describe("Lambda Function Configuration", () => {
        it("should create Lambda function with environmentSuffix", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("aws.lambda.Function");
            expect(content).toContain("ec2-compliance-checker-${environmentSuffix}");
        });

        it("should use Node.js 18.x runtime", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("NodeJS18dX");
        });

        it("should have environment variables configured", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("REPORTS_BUCKET");
            expect(content).toContain("SNS_TOPIC_ARN");
            expect(content).toContain("REQUIRED_TAGS");
            expect(content).toContain("AWS_REGION");
        });

        it("should have proper timeout and memory configuration", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("timeout:");
            expect(content).toContain("memorySize:");
        });
    });

    describe("IAM Configuration", () => {
        it("should create IAM role for Lambda", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("aws.iam.Role");
            expect(content).toContain("ec2-compliance-lambda-role-${environmentSuffix}");
        });

        it("should have EC2 read permissions", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("ec2:DescribeInstances");
            expect(content).toContain("ec2:DescribeTags");
        });

        it("should have S3 write permissions", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("s3:PutObject");
        });

        it("should have SNS publish permissions", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("sns:Publish");
        });

        it("should attach CloudWatch Logs policy", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("AWSLambdaBasicExecutionRole");
        });
    });

    describe("CloudWatch Events Configuration", () => {
        it("should create EventBridge rule with 6-hour schedule", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("aws.cloudwatch.EventRule");
            expect(content).toContain("rate(6 hours)");
        });

        it("should create EventTarget for Lambda", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("aws.cloudwatch.EventTarget");
        });

        it("should create Lambda permission for EventBridge", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("aws.lambda.Permission");
            expect(content).toContain("events.amazonaws.com");
        });
    });

    describe("CloudWatch Dashboard Configuration", () => {
        it("should create CloudWatch Dashboard", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("aws.cloudwatch.Dashboard");
            expect(content).toContain("ec2-compliance-dashboard-${environmentSuffix}");
        });

        it("should have dashboard body configuration", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("dashboardBody");
            expect(content).toContain("widgets");
        });
    });

    describe("Glue Configuration", () => {
        it("should create Glue Database", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("aws.glue.CatalogDatabase");
            expect(content).toContain("ec2_compliance_db_");
        });

        it("should create Glue Crawler", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("aws.glue.Crawler");
            expect(content).toContain("ec2-compliance-crawler-${environmentSuffix}");
        });

        it("should create IAM role for Glue Crawler", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("glue-crawler-role-${environmentSuffix}");
            expect(content).toContain("AWSGlueServiceRole");
        });

        it("should configure S3 target for Glue Crawler", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("s3Targets");
        });
    });

    describe("Athena Configuration", () => {
        it("should create Athena Workgroup", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("aws.athena.Workgroup");
            expect(content).toContain("ec2-compliance-workgroup-${environmentSuffix}");
        });

        it("should configure result output location", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("resultConfiguration");
            expect(content).toContain("outputLocation");
        });
    });

    describe("Resource Dependencies", () => {
        it("should have Lambda depend on IAM policies", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            expect(content).toContain("dependsOn");
        });
    });

    describe("Resource Naming Convention", () => {
        it("should use environmentSuffix in all resource names", () => {
            const fs = require("fs");
            const path = require("path");
            const indexPath = path.join(__dirname, "..", "lib", "index.ts");
            const content = fs.readFileSync(indexPath, "utf8");

            const suffixPattern = /\$\{environmentSuffix\}/g;
            const matches = content.match(suffixPattern);

            // Should have multiple occurrences
            expect(matches).not.toBeNull();
            expect(matches!.length).toBeGreaterThan(10);
        });
    });
});

describe("Lambda Compliance Checker Logic", () => {
    describe("Lambda Handler File", () => {
        it("should exist at lib/lambda/compliance-checker.js", () => {
            const fs = require("fs");
            const path = require("path");
            const lambdaPath = path.join(__dirname, "..", "lib", "lambda", "compliance-checker.js");
            expect(fs.existsSync(lambdaPath)).toBe(true);
        });

        it("should use AWS SDK v3", () => {
            const fs = require("fs");
            const path = require("path");
            const lambdaPath = path.join(__dirname, "..", "lib", "lambda", "compliance-checker.js");
            const content = fs.readFileSync(lambdaPath, "utf8");

            expect(content).toContain("@aws-sdk/client-ec2");
            expect(content).toContain("@aws-sdk/client-s3");
            expect(content).toContain("@aws-sdk/client-sns");
        });

        it("should export handler function", () => {
            const fs = require("fs");
            const path = require("path");
            const lambdaPath = path.join(__dirname, "..", "lib", "lambda", "compliance-checker.js");
            const content = fs.readFileSync(lambdaPath, "utf8");

            expect(content).toContain("exports.handler");
        });

        it("should use environment variables", () => {
            const fs = require("fs");
            const path = require("path");
            const lambdaPath = path.join(__dirname, "..", "lib", "lambda", "compliance-checker.js");
            const content = fs.readFileSync(lambdaPath, "utf8");

            expect(content).toContain("process.env.REPORTS_BUCKET");
            expect(content).toContain("process.env.SNS_TOPIC_ARN");
            expect(content).toContain("process.env.REQUIRED_TAGS");
            expect(content).toContain("process.env.AWS_REGION");
        });

        it("should have getAllInstances function", () => {
            const fs = require("fs");
            const path = require("path");
            const lambdaPath = path.join(__dirname, "..", "lib", "lambda", "compliance-checker.js");
            const content = fs.readFileSync(lambdaPath, "utf8");

            expect(content).toContain("function getAllInstances");
        });

        it("should have checkInstanceCompliance function", () => {
            const fs = require("fs");
            const path = require("path");
            const lambdaPath = path.join(__dirname, "..", "lib", "lambda", "compliance-checker.js");
            const content = fs.readFileSync(lambdaPath, "utf8");

            expect(content).toContain("function checkInstanceCompliance");
        });

        it("should have saveReportToS3 function", () => {
            const fs = require("fs");
            const path = require("path");
            const lambdaPath = path.join(__dirname, "..", "lib", "lambda", "compliance-checker.js");
            const content = fs.readFileSync(lambdaPath, "utf8");

            expect(content).toContain("function saveReportToS3");
        });

        it("should have sendComplianceAlert function", () => {
            const fs = require("fs");
            const path = require("path");
            const lambdaPath = path.join(__dirname, "..", "lib", "lambda", "compliance-checker.js");
            const content = fs.readFileSync(lambdaPath, "utf8");

            expect(content).toContain("function sendComplianceAlert");
        });

        it("should handle pagination for EC2 instances", () => {
            const fs = require("fs");
            const path = require("path");
            const lambdaPath = path.join(__dirname, "..", "lib", "lambda", "compliance-checker.js");
            const content = fs.readFileSync(lambdaPath, "utf8");

            expect(content).toContain("nextToken");
            expect(content).toContain("NextToken");
            expect(content).toContain("do");
            expect(content).toContain("while");
        });

        it("should calculate compliance statistics", () => {
            const fs = require("fs");
            const path = require("path");
            const lambdaPath = path.join(__dirname, "..", "lib", "lambda", "compliance-checker.js");
            const content = fs.readFileSync(lambdaPath, "utf8");

            expect(content).toContain("totalInstances");
            expect(content).toContain("compliantInstances");
            expect(content).toContain("nonCompliantInstances");
            expect(content).toContain("compliancePercentage");
        });

        it("should have error handling", () => {
            const fs = require("fs");
            const path = require("path");
            const lambdaPath = path.join(__dirname, "..", "lib", "lambda", "compliance-checker.js");
            const content = fs.readFileSync(lambdaPath, "utf8");

            expect(content).toContain("try");
            expect(content).toContain("catch");
            expect(content).toContain("console.error");
        });
    });
});

describe("Configuration Files", () => {
    describe("Pulumi.yaml", () => {
        it("should exist", () => {
            const fs = require("fs");
            const path = require("path");
            const yamlPath = path.join(__dirname, "..", "Pulumi.yaml");
            expect(fs.existsSync(yamlPath)).toBe(true);
        });

        it("should have correct project name", () => {
            const fs = require("fs");
            const path = require("path");
            const yamlPath = path.join(__dirname, "..", "Pulumi.yaml");
            const content = fs.readFileSync(yamlPath, "utf8");

            expect(content).toContain("name: ec2-compliance-monitoring");
        });

        it("should use nodejs runtime", () => {
            const fs = require("fs");
            const path = require("path");
            const yamlPath = path.join(__dirname, "..", "Pulumi.yaml");
            const content = fs.readFileSync(yamlPath, "utf8");

            expect(content).toContain("runtime: nodejs");
        });

        it("should define environmentSuffix config", () => {
            const fs = require("fs");
            const path = require("path");
            const yamlPath = path.join(__dirname, "..", "Pulumi.yaml");
            const content = fs.readFileSync(yamlPath, "utf8");

            expect(content).toContain("environmentSuffix");
        });
    });

    describe("metadata.json", () => {
        it("should exist", () => {
            const fs = require("fs");
            const path = require("path");
            const metadataPath = path.join(__dirname, "..", "metadata.json");
            expect(fs.existsSync(metadataPath)).toBe(true);
        });

        it("should have correct structure", () => {
            const fs = require("fs");
            const path = require("path");
            const metadataPath = path.join(__dirname, "..", "metadata.json");
            const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));

            expect(metadata.platform).toBe("pulumi");
            expect(metadata.language).toBe("ts");
            expect(metadata.complexity).toBe("hard");
            expect(metadata.po_id).toBe("j8g3q9u5");
            expect(metadata.team).toBe("synth");
            expect(Array.isArray(metadata.aws_services)).toBe(true);
        });
    });
});

describe("Documentation Files", () => {
    describe("PROMPT.md", () => {
        it("should exist in lib/ directory", () => {
            const fs = require("fs");
            const path = require("path");
            const promptPath = path.join(__dirname, "..", "lib", "PROMPT.md");
            expect(fs.existsSync(promptPath)).toBe(true);
        });

        it("should mention Pulumi with TypeScript", () => {
            const fs = require("fs");
            const path = require("path");
            const promptPath = path.join(__dirname, "..", "lib", "PROMPT.md");
            const content = fs.readFileSync(promptPath, "utf8");

            expect(content).toContain("Pulumi with TypeScript");
        });

        it("should mention environmentSuffix requirement", () => {
            const fs = require("fs");
            const path = require("path");
            const promptPath = path.join(__dirname, "..", "lib", "PROMPT.md");
            const content = fs.readFileSync(promptPath, "utf8");

            expect(content).toContain("environmentSuffix");
        });

        it("should mention all required AWS services", () => {
            const fs = require("fs");
            const path = require("path");
            const promptPath = path.join(__dirname, "..", "lib", "PROMPT.md");
            const content = fs.readFileSync(promptPath, "utf8");

            expect(content).toContain("Lambda");
            expect(content).toContain("S3");
            expect(content).toContain("SNS");
            expect(content).toContain("CloudWatch");
            expect(content).toContain("Glue");
            expect(content).toContain("Athena");
        });
    });

    describe("MODEL_RESPONSE.md", () => {
        it("should exist in lib/ directory", () => {
            const fs = require("fs");
            const path = require("path");
            const responsePath = path.join(__dirname, "..", "lib", "MODEL_RESPONSE.md");
            expect(fs.existsSync(responsePath)).toBe(true);
        });

        it("should contain code blocks", () => {
            const fs = require("fs");
            const path = require("path");
            const responsePath = path.join(__dirname, "..", "lib", "MODEL_RESPONSE.md");
            const content = fs.readFileSync(responsePath, "utf8");

            expect(content).toContain("```typescript");
            expect(content).toContain("```javascript");
        });
    });

    describe("IDEAL_RESPONSE.md", () => {
        it("should exist in lib/ directory", () => {
            const fs = require("fs");
            const path = require("path");
            const idealPath = path.join(__dirname, "..", "lib", "IDEAL_RESPONSE.md");
            expect(fs.existsSync(idealPath)).toBe(true);
        });
    });

    describe("MODEL_FAILURES.md", () => {
        it("should exist in lib/ directory", () => {
            const fs = require("fs");
            const path = require("path");
            const failuresPath = path.join(__dirname, "..", "lib", "MODEL_FAILURES.md");
            expect(fs.existsSync(failuresPath)).toBe(true);
        });

        it("should document training quality", () => {
            const fs = require("fs");
            const path = require("path");
            const failuresPath = path.join(__dirname, "..", "lib", "MODEL_FAILURES.md");
            const content = fs.readFileSync(failuresPath, "utf8");

            expect(content).toContain("Training Quality");
        });
    });
});
