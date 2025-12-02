import { IAMClient, ListRolesCommand, GetRoleCommand, ListAttachedRolePoliciesCommand, ListRolePoliciesCommand, GetRolePolicyCommand, GetPolicyCommand, GetPolicyVersionCommand, TagRoleCommand, UntagRoleCommand } from "@aws-sdk/client-iam";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";

const iamClient = new IAMClient({});
const s3Client = new S3Client({});
const cloudwatchClient = new CloudWatchClient({});

const REPORTS_BUCKET = process.env.REPORTS_BUCKET!;
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX!;
const SENSITIVE_SERVICES = ["s3", "dynamodb", "rds"];

interface ComplianceIssue {
    roleName: string;
    issueType: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
    description: string;
    recommendation: string;
}

interface ComplianceReport {
    timestamp: string;
    accountId: string;
    totalRolesScanned: number;
    issues: ComplianceIssue[];
    summary: {
        compliant: number;
        nonCompliant: number;
        needsReview: number;
        wildcardPermissions: number;
        unusedRoles: number;
        inlinePolicies: number;
        crossAccountAccess: number;
    };
}

export const handler = async (event: any): Promise<any> => {
    console.log("Starting IAM compliance scan...");

    const report: ComplianceReport = {
        timestamp: new Date().toISOString(),
        accountId: "",
        totalRolesScanned: 0,
        issues: [],
        summary: {
            compliant: 0,
            nonCompliant: 0,
            needsReview: 0,
            wildcardPermissions: 0,
            unusedRoles: 0,
            inlinePolicies: 0,
            crossAccountAccess: 0,
        },
    };

    try {
        // List all IAM roles
        const roles = await listAllRoles();
        report.totalRolesScanned = roles.length;
        console.log(`Found ${roles.length} roles to scan`);

        // Analyze each role
        for (const role of roles) {
            const roleIssues = await analyzeRole(role);
            report.issues.push(...roleIssues);

            // Update summary counts
            if (roleIssues.length === 0) {
                report.summary.compliant++;
                await tagRole(role.RoleName!, "compliant");
            } else if (roleIssues.some(i => i.severity === "HIGH")) {
                report.summary.nonCompliant++;
                await tagRole(role.RoleName!, "non-compliant");
            } else {
                report.summary.needsReview++;
                await tagRole(role.RoleName!, "needs-review");
            }
        }

        // Calculate summary metrics
        report.summary.wildcardPermissions = report.issues.filter(i => i.issueType === "WILDCARD_PERMISSION").length;
        report.summary.unusedRoles = report.issues.filter(i => i.issueType === "UNUSED_ROLE").length;
        report.summary.inlinePolicies = report.issues.filter(i => i.issueType === "INLINE_POLICY").length;
        report.summary.crossAccountAccess = report.issues.filter(i => i.issueType === "CROSS_ACCOUNT_ACCESS").length;

        // Store report in S3
        await storeReport(report);

        // Send metrics to CloudWatch
        await sendMetrics(report);

        console.log("Compliance scan completed successfully");
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Compliance scan completed",
                summary: report.summary,
            }),
        };
    } catch (error) {
        console.error("Error during compliance scan:", error);
        throw error;
    }
};

async function listAllRoles(): Promise<any[]> {
    const roles: any[] = [];
    let marker: string | undefined;

    do {
        const response = await iamClient.send(new ListRolesCommand({
            Marker: marker,
            MaxItems: 100,
        }));

        if (response.Roles) {
            roles.push(...response.Roles);
        }

        marker = response.Marker;
    } while (marker);

    return roles;
}

async function analyzeRole(role: any): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];
    const roleName = role.RoleName;

    // Check 1: Unused role (last used > 90 days ago)
    if (role.RoleLastUsed?.LastUsedDate) {
        const lastUsed = new Date(role.RoleLastUsed.LastUsedDate);
        const daysSinceLastUse = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceLastUse > 90) {
            issues.push({
                roleName,
                issueType: "UNUSED_ROLE",
                severity: "MEDIUM",
                description: `Role has not been used in ${Math.floor(daysSinceLastUse)} days`,
                recommendation: "Consider removing this role if it's no longer needed",
            });
        }
    }

    // Check 2: Cross-account access
    const assumeRolePolicy = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument));
    for (const statement of assumeRolePolicy.Statement || []) {
        if (statement.Principal?.AWS) {
            const principals = Array.isArray(statement.Principal.AWS)
                ? statement.Principal.AWS
                : [statement.Principal.AWS];

            for (const principal of principals) {
                if (principal.includes(":root") || principal.includes("arn:aws:iam::")) {
                    issues.push({
                        roleName,
                        issueType: "CROSS_ACCOUNT_ACCESS",
                        severity: "HIGH",
                        description: `Role allows cross-account access from: ${principal}`,
                        recommendation: "Verify that this cross-account access is intentional and necessary",
                    });
                }
            }
        }
    }

    // Check 3: Attached managed policies
    const attachedPolicies = await iamClient.send(new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
    }));

    if (attachedPolicies.AttachedPolicies) {
        for (const policy of attachedPolicies.AttachedPolicies) {
            const policyIssues = await analyzePolicyForWildcards(policy.PolicyArn!, roleName);
            issues.push(...policyIssues);
        }
    }

    // Check 4: Inline policies
    const inlinePolicies = await iamClient.send(new ListRolePoliciesCommand({
        RoleName: roleName,
    }));

    if (inlinePolicies.PolicyNames && inlinePolicies.PolicyNames.length > 0) {
        for (const policyName of inlinePolicies.PolicyNames) {
            issues.push({
                roleName,
                issueType: "INLINE_POLICY",
                severity: "MEDIUM",
                description: `Role has inline policy: ${policyName}`,
                recommendation: "Convert inline policies to managed policies for better governance",
            });

            // Also check inline policy for wildcards
            const inlinePolicy = await iamClient.send(new GetRolePolicyCommand({
                RoleName: roleName,
                PolicyName: policyName,
            }));

            if (inlinePolicy.PolicyDocument) {
                const policyDoc = JSON.parse(decodeURIComponent(inlinePolicy.PolicyDocument));
                const wildcardIssues = checkPolicyForWildcards(policyDoc, roleName, policyName);
                issues.push(...wildcardIssues);
            }
        }
    }

    return issues;
}

async function analyzePolicyForWildcards(policyArn: string, roleName: string): Promise<ComplianceIssue[]> {
    try {
        const policy = await iamClient.send(new GetPolicyCommand({
            PolicyArn: policyArn,
        }));

        if (!policy.Policy?.DefaultVersionId) {
            return [];
        }

        const policyVersion = await iamClient.send(new GetPolicyVersionCommand({
            PolicyArn: policyArn,
            VersionId: policy.Policy.DefaultVersionId,
        }));

        if (!policyVersion.PolicyVersion?.Document) {
            return [];
        }

        const policyDoc = JSON.parse(decodeURIComponent(policyVersion.PolicyVersion.Document));
        return checkPolicyForWildcards(policyDoc, roleName, policyArn);
    } catch (error) {
        console.error(`Error analyzing policy ${policyArn}:`, error);
        return [];
    }
}

function checkPolicyForWildcards(policyDoc: any, roleName: string, policyIdentifier: string): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];

    for (const statement of policyDoc.Statement || []) {
        if (statement.Effect !== "Allow") continue;

        const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];

        for (const action of actions) {
            if (typeof action !== "string") continue;

            for (const service of SENSITIVE_SERVICES) {
                if (action === `${service}:*` || action === "*") {
                    issues.push({
                        roleName,
                        issueType: "WILDCARD_PERMISSION",
                        severity: "HIGH",
                        description: `Policy ${policyIdentifier} grants wildcard permissions on ${service}: ${action}`,
                        recommendation: `Replace wildcard with specific actions for ${service}`,
                    });
                }
            }
        }
    }

    return issues;
}

async function tagRole(roleName: string, complianceStatus: string): Promise<void> {
    try {
        // Remove existing compliance tags
        await iamClient.send(new UntagRoleCommand({
            RoleName: roleName,
            TagKeys: ["ComplianceStatus"],
        })).catch(() => {});

        // Add new compliance tag
        await iamClient.send(new TagRoleCommand({
            RoleName: roleName,
            Tags: [
                {
                    Key: "ComplianceStatus",
                    Value: complianceStatus,
                },
                {
                    Key: "LastScanned",
                    Value: new Date().toISOString(),
                },
            ],
        }));
    } catch (error) {
        console.error(`Error tagging role ${roleName}:`, error);
    }
}

async function storeReport(report: ComplianceReport): Promise<void> {
    const key = `compliance-reports/${new Date().toISOString().split('T')[0]}/report-${Date.now()}.json`;

    await s3Client.send(new PutObjectCommand({
        Bucket: REPORTS_BUCKET,
        Key: key,
        Body: JSON.stringify(report, null, 2),
        ContentType: "application/json",
        ServerSideEncryption: "AES256",
    }));

    console.log(`Report stored in S3: ${key}`);
}

async function sendMetrics(report: ComplianceReport): Promise<void> {
    const metrics = [
        { MetricName: "TotalRolesScanned", Value: report.totalRolesScanned },
        { MetricName: "CompliantRoles", Value: report.summary.compliant },
        { MetricName: "NonCompliantRoles", Value: report.summary.nonCompliant },
        { MetricName: "NeedsReviewRoles", Value: report.summary.needsReview },
        { MetricName: "WildcardPermissionsFound", Value: report.summary.wildcardPermissions },
        { MetricName: "UnusedRoles", Value: report.summary.unusedRoles },
        { MetricName: "InlinePolicies", Value: report.summary.inlinePolicies },
        { MetricName: "CrossAccountAccess", Value: report.summary.crossAccountAccess },
    ];

    await cloudwatchClient.send(new PutMetricDataCommand({
        Namespace: "IAMCompliance",
        MetricData: metrics.map(m => ({
            MetricName: m.MetricName,
            Value: m.Value,
            Unit: "Count",
            Timestamp: new Date(),
        })),
    }));

    console.log("Metrics sent to CloudWatch");
}
