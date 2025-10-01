package app;

import app.config.Config;
import app.constructs.S3Construct;
import app.constructs.IamConstruct;
import app.constructs.LambdaConstruct;
import app.constructs.DynamoDBConstruct;
import app.constructs.ApiGatewayConstruct;
import app.constructs.MonitoringConstruct;
import com.hashicorp.cdktf.TerraformOutput;
import com.hashicorp.cdktf.TerraformOutputConfig;
import com.hashicorp.cdktf.providers.aws.provider.AwsProvider;
import com.hashicorp.cdktf.providers.aws.provider.AwsProviderConfig;
import software.constructs.Construct;
import com.hashicorp.cdktf.TerraformStack;

/**
 * CDKTF Java template stack demonstrating basic AWS infrastructure.
 * 
 * This stack creates a simple S3 bucket with proper tagging for
 * cost tracking and resource management.
 */
public class MainStack extends TerraformStack {

    /**
     * Creates a new MainStack with basic AWS resources.
     * 
     * @param scope The construct scope
     * @param id The construct ID
     */

    private final String stackId;
    private S3Construct s3;
    private DynamoDBConstruct dynamodb;

    public MainStack(final Construct scope, final String id) {
        super(scope, id);
        this.stackId = id;

        // Configure AWS Provider
        new AwsProvider(this, "aws", AwsProviderConfig.builder().region(Config.REGION).build());

        // Create resources and Lambda
        LambdaConstruct lambda = createLambdaWithDependencies();

        // Create API Gateway
        ApiGatewayConstruct apiGateway = new ApiGatewayConstruct(this, "api", lambda.getFunctionArn(),
                lambda.getFunctionInvokeArn());

        // Setup monitoring and alerting
        MonitoringConstruct monitoring = new MonitoringConstruct(this, "monitoring", lambda.getFunctionName(),
                lambda.getLogGroupName(), apiGateway.getApiName());

        // Stack Outputs
        new TerraformOutput(this, "lambdaFunctionArn", TerraformOutputConfig.builder()
                .value(lambda.getFunctionArn())
                .description("ARN of the Lambda function")
                .build());

        new TerraformOutput(this, "lambdaFunctionName", TerraformOutputConfig.builder()
                .value(lambda.getFunctionName())
                .description("Name of the Lambda function")
                .build());

        new TerraformOutput(this, "apiGatewayUrl", TerraformOutputConfig.builder()
                .value("https://" + apiGateway.getApiId() + ".execute-api." + Config.REGION + ".amazonaws.com/prod")
                .description("API Gateway endpoint URL")
                .build());

        new TerraformOutput(this, "dynamoDbTableName", TerraformOutputConfig.builder()
                .value(dynamodb.getTableName())
                .description("DynamoDB table name")
                .build());

        new TerraformOutput(this, "dynamoDbTableArn", TerraformOutputConfig.builder()
                .value(dynamodb.getTableArn())
                .description("DynamoDB table ARN")
                .build());

        new TerraformOutput(this, "s3BucketName", TerraformOutputConfig.builder()
                .value(s3.getBucketName())
                .description("S3 bucket name")
                .build());

        new TerraformOutput(this, "s3BucketArn", TerraformOutputConfig.builder()
                .value(s3.getBucketArn())
                .description("S3 bucket ARN")
                .build());

        new TerraformOutput(this, "apiGatewayId", TerraformOutputConfig.builder()
                .value(apiGateway.getApiId())
                .description("API Gateway ID")
                .build());

        new TerraformOutput(this, "apiGatewayName", TerraformOutputConfig.builder()
                .value(apiGateway.getApiName())
                .description("API Gateway name")
                .build());

        new TerraformOutput(this, "lambdaLogGroupName", TerraformOutputConfig.builder()
                .value(lambda.getLogGroupName())
                .description("Lambda CloudWatch Log Group name")
                .build());

        new TerraformOutput(this, "stackId", TerraformOutputConfig.builder()
                .value(this.stackId)
                .description("Stack ID")
                .build());

    }

    private LambdaConstruct createLambdaWithDependencies() {

        s3 = new S3Construct(this, "s3");

        // Create DynamoDB table
        dynamodb = new DynamoDBConstruct(this, "dynamodb");

        // Create IAM roles and policies
        IamConstruct iam = new IamConstruct(this, "iam", dynamodb.getTableArn(), s3.getBucketArn());

        // Create Lambda functions
        return new LambdaConstruct(this, "lambda", iam.getLambdaExecutionRoleArn(), s3.getBucketName(),
                dynamodb.getTableName());
    }

    public String getStackId() {
        return stackId;
    }
}