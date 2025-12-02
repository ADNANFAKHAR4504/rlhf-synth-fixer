const { ConfigServiceClient, PutEvaluationsCommand } = require("@aws-sdk/client-config-service");
const { EC2Client, DescribeInstancesCommand } = require("@aws-sdk/client-ec2");

const configClient = new ConfigServiceClient({});
const ec2Client = new EC2Client({});

const REQUIRED_TAGS = ["Environment", "Owner", "CostCenter"];

exports.handler = async (event) => {
    console.log("Event received:", JSON.stringify(event, null, 2));

    const configurationItem = JSON.parse(event.configurationItem || "{}");
    const invokingEvent = JSON.parse(event.invokingEvent || "{}");
    const token = event.resultToken;

    let compliance = "NON_COMPLIANT";
    let annotation = "Resource does not have required tags";

    try {
        if (configurationItem.resourceType === "AWS::EC2::Instance") {
            const instanceId = configurationItem.resourceId;

            const response = await ec2Client.send(
                new DescribeInstancesCommand({
                    InstanceIds: [instanceId],
                })
            );

            if (response.Reservations && response.Reservations.length > 0) {
                const instance = response.Reservations[0].Instances[0];
                const tags = instance.Tags || [];
                const tagKeys = tags.map((tag) => tag.Key);

                const missingTags = REQUIRED_TAGS.filter(
                    (requiredTag) => !tagKeys.includes(requiredTag)
                );

                if (missingTags.length === 0) {
                    compliance = "COMPLIANT";
                    annotation = "All required tags are present";
                } else {
                    annotation = `Missing required tags: ${missingTags.join(", ")}`;
                }
            }
        }
    } catch (error) {
        console.error("Error evaluating compliance:", error);
        annotation = `Error: ${error.message}`;
    }

    const evaluation = {
        ComplianceResourceType: configurationItem.resourceType,
        ComplianceResourceId: configurationItem.resourceId,
        ComplianceType: compliance,
        Annotation: annotation,
        OrderingTimestamp: new Date(configurationItem.configurationItemCaptureTime),
    };

    const putEvaluationsCommand = new PutEvaluationsCommand({
        Evaluations: [evaluation],
        ResultToken: token,
    });

    await configClient.send(putEvaluationsCommand);

    return {
        statusCode: 200,
        body: JSON.stringify({ compliance, annotation }),
    };
};