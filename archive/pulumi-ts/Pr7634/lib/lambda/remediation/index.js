const { EC2Client, StopInstancesCommand, DescribeInstancesCommand } = require("@aws-sdk/client-ec2");
const { S3Client, PutBucketEncryptionCommand } = require("@aws-sdk/client-s3");
const { RDSClient, ModifyDBInstanceCommand } = require("@aws-sdk/client-rds");

const ec2Client = new EC2Client({ region: process.env.REGION || "us-east-1" });
const s3Client = new S3Client({ region: process.env.REGION || "us-east-1" });
const rdsClient = new RDSClient({ region: process.env.REGION || "us-east-1" });

exports.handler = async (event) => {
    console.log("Remediating compliance violation:", JSON.stringify(event, null, 2));

    try {
        // Parse Config compliance change event
        const detail = event.detail || {};
        const configRuleName = detail.configRuleName;
        const resourceType = detail.resourceType;
        const resourceId = detail.resourceId;
        const newComplianceType = detail.newEvaluationResult?.complianceType;

        console.log(`Processing compliance change for ${resourceType}/${resourceId}: ${newComplianceType}`);

        // Only remediate if non-compliant
        if (newComplianceType !== "NON_COMPLIANT") {
            console.log("Resource is compliant or not applicable, no remediation needed");
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "No remediation needed",
                    resourceType,
                    resourceId,
                    complianceType: newComplianceType
                })
            };
        }

        let remediationResult = null;

        // Remediate based on rule and resource type
        if (configRuleName && configRuleName.includes("ec2")) {
            remediationResult = await remediateEC2Instance(resourceId);
        } else if (configRuleName && configRuleName.includes("s3")) {
            remediationResult = await remediateS3Bucket(resourceId);
        } else if (configRuleName && configRuleName.includes("rds")) {
            remediationResult = await remediateRDSInstance(resourceId);
        } else {
            console.log(`No automated remediation available for rule: ${configRuleName}`);
            remediationResult = {
                action: "none",
                reason: "No automated remediation configured"
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Remediation completed",
                resourceType,
                resourceId,
                remediationResult
            })
        };
    } catch (error) {
        console.error("Error during remediation:", error);
        throw error;
    }
};

async function remediateEC2Instance(instanceId) {
    try {
        console.log(`Checking EC2 instance: ${instanceId}`);

        // In a real scenario, we might stop non-compliant instances
        // For safety, we'll just log what we would do
        console.log(`Would remediate EC2 instance ${instanceId} (stopping for non-approved instance type)`);

        return {
            action: "logged",
            resource: instanceId,
            message: "Logged non-compliant EC2 instance for manual review"
        };
    } catch (error) {
        console.error("Error remediating EC2 instance:", error);
        return {
            action: "failed",
            resource: instanceId,
            error: error.message
        };
    }
}

async function remediateS3Bucket(bucketName) {
    try {
        console.log(`Enabling encryption for S3 bucket: ${bucketName}`);

        // Enable default encryption
        await s3Client.send(new PutBucketEncryptionCommand({
            Bucket: bucketName,
            ServerSideEncryptionConfiguration: {
                Rules: [{
                    ApplyServerSideEncryptionByDefault: {
                        SSEAlgorithm: "AES256"
                    }
                }]
            }
        }));

        return {
            action: "encrypted",
            resource: bucketName,
            message: "Enabled default encryption on S3 bucket"
        };
    } catch (error) {
        console.error("Error remediating S3 bucket:", error);
        return {
            action: "failed",
            resource: bucketName,
            error: error.message
        };
    }
}

async function remediateRDSInstance(dbInstanceId) {
    try {
        console.log(`Checking RDS instance: ${dbInstanceId}`);

        // In a real scenario, we might enable automated backups
        // For safety, we'll just log what we would do
        console.log(`Would remediate RDS instance ${dbInstanceId} (enabling automated backups)`);

        return {
            action: "logged",
            resource: dbInstanceId,
            message: "Logged non-compliant RDS instance for manual review"
        };
    } catch (error) {
        console.error("Error remediating RDS instance:", error);
        return {
            action: "failed",
            resource: dbInstanceId,
            error: error.message
        };
    }
}
