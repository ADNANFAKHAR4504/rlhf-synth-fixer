const {
    EC2Client,
    DescribeInstancesCommand
} = require("@aws-sdk/client-ec2");
const {
    RDSClient,
    DescribeDBInstancesCommand,
    ListTagsForResourceCommand: RDSListTagsCommand
} = require("@aws-sdk/client-rds");
const {
    S3Client,
    ListBucketsCommand,
    GetBucketTaggingCommand,
    PutObjectCommand
} = require("@aws-sdk/client-s3");
const {
    SNSClient,
    PublishCommand
} = require("@aws-sdk/client-sns");

const ec2Client = new EC2Client({});
const rdsClient = new RDSClient({});
const s3Client = new S3Client({});
const snsClient = new SNSClient({});

exports.handler = async (event) => {
    console.log("Starting compliance scan...");

    const requiredTags = (process.env.REQUIRED_TAGS || "").split(",");
    const snsTopicArn = process.env.SNS_TOPIC_ARN;
    const reportsBucket = process.env.REPORTS_BUCKET;

    const violations = [];
    const timestamp = new Date().toISOString();
    const scanId = `scan-${Date.now()}`;

    try {
        // Scan EC2 instances
        console.log("Scanning EC2 instances...");
        const ec2Response = await ec2Client.send(new DescribeInstancesCommand({}));

        for (const reservation of (ec2Response.Reservations || [])) {
            for (const instance of (reservation.Instances || [])) {
                const tags = instance.Tags || [];
                const tagKeys = tags.map(t => t.Key);
                const missingTags = requiredTags.filter(rt => !tagKeys.includes(rt));

                if (missingTags.length > 0) {
                    violations.push({
                        resource_id: instance.InstanceId,
                        resource_type: "EC2",
                        missing_tags: missingTags,
                        last_modified: instance.LaunchTime ? instance.LaunchTime.toISOString() : timestamp,
                    });
                }
            }
        }

        // Scan RDS instances
        console.log("Scanning RDS instances...");
        const rdsResponse = await rdsClient.send(new DescribeDBInstancesCommand({}));

        for (const dbInstance of (rdsResponse.DBInstances || [])) {
            const dbArn = dbInstance.DBInstanceArn;
            const tagsResponse = await rdsClient.send(
                new RDSListTagsCommand({ ResourceName: dbArn })
            );

            const tags = tagsResponse.TagList || [];
            const tagKeys = tags.map(t => t.Key);
            const missingTags = requiredTags.filter(rt => !tagKeys.includes(rt));

            if (missingTags.length > 0) {
                violations.push({
                    resource_id: dbInstance.DBInstanceIdentifier,
                    resource_type: "RDS",
                    missing_tags: missingTags,
                    last_modified: dbInstance.InstanceCreateTime ?
                        dbInstance.InstanceCreateTime.toISOString() : timestamp,
                });
            }
        }

        // Scan S3 buckets
        console.log("Scanning S3 buckets...");
        const bucketsResponse = await s3Client.send(new ListBucketsCommand({}));

        for (const bucket of (bucketsResponse.Buckets || [])) {
            try {
                const tagsResponse = await s3Client.send(
                    new GetBucketTaggingCommand({ Bucket: bucket.Name })
                );

                const tags = tagsResponse.TagSet || [];
                const tagKeys = tags.map(t => t.Key);
                const missingTags = requiredTags.filter(rt => !tagKeys.includes(rt));

                if (missingTags.length > 0) {
                    violations.push({
                        resource_id: bucket.Name,
                        resource_type: "S3",
                        missing_tags: missingTags,
                        last_modified: bucket.CreationDate ?
                            bucket.CreationDate.toISOString() : timestamp,
                    });
                }
            } catch (error) {
                // Bucket might not have tags - consider it non-compliant
                if (error.name === "NoSuchTagSet") {
                    violations.push({
                        resource_id: bucket.Name,
                        resource_type: "S3",
                        missing_tags: requiredTags,
                        last_modified: bucket.CreationDate ?
                            bucket.CreationDate.toISOString() : timestamp,
                    });
                } else {
                    console.error(`Error checking bucket ${bucket.Name}: ${error.message}`);
                }
            }
        }

        // Generate compliance report
        const totalResources = (ec2Response.Reservations?.reduce((acc, r) =>
            acc + (r.Instances?.length || 0), 0) || 0) +
            (rdsResponse.DBInstances?.length || 0) +
            (bucketsResponse.Buckets?.length || 0);

        const report = {
            timestamp,
            scan_id: scanId,
            summary: {
                total_resources: totalResources,
                compliant: totalResources - violations.length,
                non_compliant: violations.length,
            },
            violations,
        };

        // Store report in S3
        console.log("Storing compliance report in S3...");
        const reportKey = `compliance-reports/${scanId}.json`;
        await s3Client.send(new PutObjectCommand({
            Bucket: reportsBucket,
            Key: reportKey,
            Body: JSON.stringify(report, null, 2),
            ContentType: "application/json",
        }));

        // Send SNS alert if violations found
        if (violations.length > 0) {
            console.log(`Found ${violations.length} non-compliant resources. Sending alert...`);

            const message = `Compliance Scan Alert\n\n` +
                `Scan ID: ${scanId}\n` +
                `Timestamp: ${timestamp}\n` +
                `Total Resources: ${totalResources}\n` +
                `Non-Compliant Resources: ${violations.length}\n\n` +
                `Summary:\n` +
                violations.slice(0, 10).map(v =>
                    `- ${v.resource_type}: ${v.resource_id} (missing: ${v.missing_tags.join(", ")})`
                ).join("\n") +
                (violations.length > 10 ? `\n\n... and ${violations.length - 10} more violations` : "") +
                `\n\nFull report available in S3: ${reportsBucket}/${reportKey}`;

            await snsClient.send(new PublishCommand({
                TopicArn: snsTopicArn,
                Subject: `Compliance Alert: ${violations.length} Non-Compliant Resources Found`,
                Message: message,
            }));
        } else {
            console.log("No violations found. All resources are compliant.");
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Compliance scan completed successfully",
                scanId,
                violations: violations.length,
            }),
        };

    } catch (error) {
        console.error("Error during compliance scan:", error);
        throw error;
    }
};