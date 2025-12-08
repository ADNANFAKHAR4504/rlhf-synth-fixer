const { ConfigServiceClient, DescribeComplianceByResourceCommand } = require("@aws-sdk/client-config-service");
const { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } = require("@aws-sdk/client-s3");

const configClient = new ConfigServiceClient({ region: process.env.REGION || "us-east-1" });
const s3Client = new S3Client({ region: process.env.REGION || "us-east-1" });

exports.handler = async (event) => {
    console.log("Aggregating compliance data:", JSON.stringify(event, null, 2));

    try {
        const bucketName = process.env.BUCKET_NAME;
        if (!bucketName) {
            throw new Error("BUCKET_NAME environment variable is not set");
        }

        // Aggregate compliance data across all resources
        const aggregatedData = await aggregateComplianceData();

        // Store aggregated report in S3
        const timestamp = new Date().toISOString();
        const reportKey = `compliance-reports/aggregation-${timestamp}.json`;

        await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: reportKey,
            Body: JSON.stringify(aggregatedData, null, 2),
            ContentType: "application/json"
        }));

        console.log(`Aggregated report stored at s3://${bucketName}/${reportKey}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Compliance aggregation completed",
                reportLocation: reportKey,
                aggregatedData
            })
        };
    } catch (error) {
        console.error("Error aggregating compliance:", error);
        throw error;
    }
};

async function aggregateComplianceData() {
    try {
        const resourceTypes = [
            "AWS::EC2::Instance",
            "AWS::S3::Bucket",
            "AWS::RDS::DBInstance",
            "AWS::EC2::Volume"
        ];

        const aggregation = {
            timestamp: new Date().toISOString(),
            byResourceType: {},
            overall: {
                totalResources: 0,
                compliant: 0,
                nonCompliant: 0,
                notApplicable: 0
            }
        };

        for (const resourceType of resourceTypes) {
            try {
                const command = new DescribeComplianceByResourceCommand({
                    ResourceType: resourceType,
                    Limit: 100
                });
                const response = await configClient.send(command);

                const complianceResults = response.ComplianceByResources || [];
                aggregation.byResourceType[resourceType] = {
                    total: complianceResults.length,
                    compliant: complianceResults.filter(r => r.Compliance?.ComplianceType === "COMPLIANT").length,
                    nonCompliant: complianceResults.filter(r => r.Compliance?.ComplianceType === "NON_COMPLIANT").length,
                    notApplicable: complianceResults.filter(r => r.Compliance?.ComplianceType === "NOT_APPLICABLE").length
                };

                aggregation.overall.totalResources += complianceResults.length;
                aggregation.overall.compliant += aggregation.byResourceType[resourceType].compliant;
                aggregation.overall.nonCompliant += aggregation.byResourceType[resourceType].nonCompliant;
                aggregation.overall.notApplicable += aggregation.byResourceType[resourceType].notApplicable;
            } catch (error) {
                console.error(`Error fetching compliance for ${resourceType}:`, error);
                aggregation.byResourceType[resourceType] = {
                    total: 0,
                    compliant: 0,
                    nonCompliant: 0,
                    notApplicable: 0,
                    error: error.message
                };
            }
        }

        return aggregation;
    } catch (error) {
        console.error("Error in aggregation:", error);
        return {
            timestamp: new Date().toISOString(),
            error: error.message,
            byResourceType: {},
            overall: {
                totalResources: 0,
                compliant: 0,
                nonCompliant: 0,
                notApplicable: 0
            }
        };
    }
}
