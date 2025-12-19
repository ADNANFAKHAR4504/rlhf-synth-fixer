package app.constructs;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRoleConfig;
import com.hashicorp.cdktf.providers.aws.iam_role_policy.IamRolePolicy;
import com.hashicorp.cdktf.providers.aws.iam_role_policy.IamRolePolicyConfig;
import software.constructs.Construct;

public class IamConstruct extends BaseConstruct {
    private final IamRole lambdaExecutionRole;
    private final ObjectMapper mapper = new ObjectMapper();

    public IamConstruct(final Construct scope, final String id, final String dynamoTableArn, final String s3BucketArn) {
        super(scope, id);

        // Create Lambda execution role
        this.lambdaExecutionRole = new IamRole(this, "lambda-execution-role", IamRoleConfig.builder()
                .name(resourceName("LambdaExecutionRole"))
                .assumeRolePolicy(createAssumeRolePolicy())
                .tags(getTagsWithName("LambdaExecutionRole"))
                .build());

        // Attach CloudWatch Logs policy
        new IamRolePolicy(this, "lambda-logs-policy", IamRolePolicyConfig.builder()
                .name("LambdaLogsPolicy")
                .role(lambdaExecutionRole.getId())
                .policy(createLogsPolicy())
                .build());

        // Attach DynamoDB policy
        new IamRolePolicy(this, "lambda-dynamodb-policy", IamRolePolicyConfig.builder()
                .name(resourceName("LambdaDynamoDBPolicy"))
                .role(lambdaExecutionRole.getId())
                .policy(createDynamoDBPolicy(dynamoTableArn))
                .build());

        // Attach S3 read policy for deployment packages
        new IamRolePolicy(this, "lambda-s3-policy", IamRolePolicyConfig.builder()
                .name(resourceName("LambdaS3Policy"))
                .role(lambdaExecutionRole.getId())
                .policy(createS3Policy(s3BucketArn))
                .build());
    }

    private String createAssumeRolePolicy() {

        ObjectNode policy = mapper.createObjectNode();
        policy.put("Version", "2012-10-17");

        ArrayNode statements = mapper.createArrayNode();
        ObjectNode statement = mapper.createObjectNode();
        statement.put("Effect", "Allow");
        statement.put("Action", "sts:AssumeRole");

        ObjectNode principal = mapper.createObjectNode();
        principal.put("Service", "lambda.amazonaws.com");
        statement.set("Principal", principal);

        statements.add(statement);
        policy.set("Statement", statements);

        return policy.toString();
    }

    private String createLogsPolicy() {
        ObjectNode policy = mapper.createObjectNode();
        policy.put("Version", "2012-10-17");

        ArrayNode statements = mapper.createArrayNode();
        ObjectNode statement = mapper.createObjectNode();
        statement.put("Effect", "Allow");

        ArrayNode actions = mapper.createArrayNode();
        actions.add("logs:CreateLogGroup");
        actions.add("logs:CreateLogStream");
        actions.add("logs:PutLogEvents");
        statement.set("Action", actions);

        statement.put("Resource", "arn:aws:logs:" + getRegion()
                + ":*:log-group:/aws/lambda/" + getPrefix() + "*");

        statements.add(statement);
        policy.set("Statement", statements);

        return policy.toString();
    }

    private String createDynamoDBPolicy(final String tableArn) {
        ObjectNode policy = mapper.createObjectNode();
        policy.put("Version", "2012-10-17");

        ArrayNode statements = mapper.createArrayNode();
        ObjectNode statement = mapper.createObjectNode();
        statement.put("Effect", "Allow");

        ArrayNode actions = mapper.createArrayNode();
        actions.add("dynamodb:GetItem");
        actions.add("dynamodb:PutItem");
        actions.add("dynamodb:UpdateItem");
        actions.add("dynamodb:DeleteItem");
        actions.add("dynamodb:Query");
        actions.add("dynamodb:Scan");
        statement.set("Action", actions);

        ArrayNode resources = mapper.createArrayNode();
        resources.add(tableArn);
        resources.add(tableArn + "/index/*");
        statement.set("Resource", resources);

        statements.add(statement);
        policy.set("Statement", statements);

        return policy.toString();
    }

    private String createS3Policy(final String bucketArn) {
        ObjectNode policy = mapper.createObjectNode();
        policy.put("Version", "2012-10-17");

        ArrayNode statements = mapper.createArrayNode();
        ObjectNode statement = mapper.createObjectNode();
        statement.put("Effect", "Allow");

        ArrayNode actions = mapper.createArrayNode();
        actions.add("s3:GetObject");
        actions.add("s3:GetObjectVersion");
        statement.set("Action", actions);

        statement.put("Resource", bucketArn + "/*");

        statements.add(statement);
        policy.set("Statement", statements);

        return policy.toString();
    }

    public String getLambdaExecutionRoleArn() {
        return lambdaExecutionRole.getArn();
    }
}
