const { ConfigServiceClient, DescribeComplianceByConfigRuleCommand } = require("@aws-sdk/client-config-service");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const configClient = new ConfigServiceClient({ region: process.env.REGION || "us-east-1" });
const s3Client = new S3Client({ region: process.env.REGION || "us-east-1" });

exports.handler = async (event) => {
    console.log("Processing compliance event:", JSON.stringify(event, null, 2));

    try {
        const bucketName = process.env.BUCKET_NAME;
        if (!bucketName) {
            throw new Error("BUCKET_NAME environment variable is not set");
        }

        // Get compliance status for all config rules
        const complianceData = await getComplianceData();

        // Store compliance report in S3
        const timestamp = new Date().toISOString();
        const reportKey = `compliance-reports/processing-${timestamp}.json`;

        await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: reportKey,
            Body: JSON.stringify(complianceData, null, 2),
            ContentType: "application/json"
        }));

        console.log(`Compliance report stored at s3://${bucketName}/${reportKey}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Compliance processing completed",
                reportLocation: reportKey,
                complianceData
            })
        };
    } catch (error) {
        console.error("Error processing compliance:", error);
        throw error;
    }
};

async function getComplianceData() {
    try {
        // This would get compliance for all rules, but for demo we'll return mock data
        const command = new DescribeComplianceByConfigRuleCommand({});
        const response = await configClient.send(command);

        return {
            timestamp: new Date().toISOString(),
            complianceByConfigRule: response.ComplianceByConfigRules || [],
            summary: {
                compliant: response.ComplianceByConfigRules?.filter(r => r.Compliance?.ComplianceType === "COMPLIANT").length || 0,
                nonCompliant: response.ComplianceByConfigRules?.filter(r => r.Compliance?.ComplianceType === "NON_COMPLIANT").length || 0,
                notApplicable: response.ComplianceByConfigRules?.filter(r => r.Compliance?.ComplianceType === "NOT_APPLICABLE").length || 0
            }
        };
    } catch (error) {
        console.error("Error fetching compliance data:", error);
        return {
            timestamp: new Date().toISOString(),
            error: error.message,
            complianceByConfigRule: [],
            summary: {
                compliant: 0,
                nonCompliant: 0,
                notApplicable: 0
            }
        };
    }
}
