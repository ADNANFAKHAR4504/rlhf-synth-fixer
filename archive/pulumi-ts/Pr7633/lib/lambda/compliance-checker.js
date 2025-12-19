const { EC2Client, DescribeInstancesCommand } = require("@aws-sdk/client-ec2");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const ec2Client = new EC2Client({ region: process.env.AWS_REGION });
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

const REPORTS_BUCKET = process.env.REPORTS_BUCKET;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const REQUIRED_TAGS = process.env.REQUIRED_TAGS.split(",");

exports.handler = async (event) => {
    console.log("Starting EC2 tag compliance check...");
    console.log("Required tags:", REQUIRED_TAGS);

    try {
        // Get all EC2 instances
        const instances = await getAllInstances();
        console.log(`Found ${instances.length} EC2 instances`);

        // Check compliance for each instance
        const results = instances.map(instance => checkInstanceCompliance(instance));

        // Calculate statistics
        const totalInstances = results.length;
        const compliantInstances = results.filter(r => r.isCompliant).length;
        const nonCompliantInstances = totalInstances - compliantInstances;

        // Create compliance report
        const report = {
            timestamp: new Date().toISOString(),
            region: process.env.AWS_REGION,
            summary: {
                totalInstances,
                compliantInstances,
                nonCompliantInstances,
                compliancePercentage: totalInstances > 0
                    ? ((compliantInstances / totalInstances) * 100).toFixed(2)
                    : 100,
            },
            requiredTags: REQUIRED_TAGS,
            instances: results,
        };

        console.log("Compliance summary:", report.summary);

        // Save report to S3
        await saveReportToS3(report);

        // Send SNS alert if non-compliant instances found
        if (nonCompliantInstances > 0) {
            await sendComplianceAlert(report);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Compliance check completed successfully",
                summary: report.summary,
            }),
        };
    } catch (error) {
        console.error("Error during compliance check:", error);
        throw error;
    }
};

async function getAllInstances() {
    const instances = [];
    let nextToken = undefined;

    do {
        const command = new DescribeInstancesCommand({
            MaxResults: 100,
            NextToken: nextToken,
        });

        const response = await ec2Client.send(command);

        for (const reservation of response.Reservations || []) {
            for (const instance of reservation.Instances || []) {
                instances.push(instance);
            }
        }

        nextToken = response.NextToken;
    } while (nextToken);

    return instances;
}

function checkInstanceCompliance(instance) {
    const instanceId = instance.InstanceId;
    const instanceState = instance.State.Name;
    const tags = instance.Tags || [];
    const tagMap = {};

    tags.forEach(tag => {
        tagMap[tag.Key] = tag.Value;
    });

    const missingTags = [];
    const presentTags = [];

    REQUIRED_TAGS.forEach(requiredTag => {
        if (tagMap[requiredTag]) {
            presentTags.push({
                key: requiredTag,
                value: tagMap[requiredTag],
            });
        } else {
            missingTags.push(requiredTag);
        }
    });

    const isCompliant = missingTags.length === 0;

    return {
        instanceId,
        instanceState,
        instanceType: instance.InstanceType,
        launchTime: instance.LaunchTime,
        isCompliant,
        missingTags,
        presentTags,
        allTags: tags.map(t => ({ key: t.Key, value: t.Value })),
    };
}

async function saveReportToS3(report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const key = `compliance-reports/${timestamp}-compliance-report.json`;

    console.log(`Saving report to S3: s3://${REPORTS_BUCKET}/${key}`);

    const command = new PutObjectCommand({
        Bucket: REPORTS_BUCKET,
        Key: key,
        Body: JSON.stringify(report, null, 2),
        ContentType: "application/json",
    });

    await s3Client.send(command);
    console.log("Report saved successfully");
}

async function sendComplianceAlert(report) {
    const { summary, instances } = report;
    const nonCompliantInstances = instances.filter(i => !i.isCompliant);

    const message = `EC2 Tag Compliance Alert

Summary:
- Total Instances: ${summary.totalInstances}
- Compliant: ${summary.compliantInstances}
- Non-Compliant: ${summary.nonCompliantInstances}
- Compliance Rate: ${summary.compliancePercentage}%

Non-Compliant Instances (showing first 10):
${nonCompliantInstances.slice(0, 10).map(inst =>
    `  - ${inst.instanceId} (${inst.instanceType}): Missing tags: ${inst.missingTags.join(", ")}`
).join("\n")}

${nonCompliantInstances.length > 10 ? `\n... and ${nonCompliantInstances.length - 10} more` : ""}

Timestamp: ${report.timestamp}
Region: ${report.region}
`;

    console.log("Sending SNS alert...");

    const command = new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Subject: `EC2 Tag Compliance Alert - ${summary.nonCompliantInstances} Non-Compliant Instances`,
        Message: message,
    });

    await snsClient.send(command);
    console.log("Alert sent successfully");
}
