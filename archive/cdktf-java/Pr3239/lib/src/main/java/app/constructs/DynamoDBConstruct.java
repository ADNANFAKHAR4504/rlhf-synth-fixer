package app.constructs;

import com.hashicorp.cdktf.providers.aws.dynamodb_table.DynamodbTable;
import com.hashicorp.cdktf.providers.aws.dynamodb_table.DynamodbTableAttribute;
import com.hashicorp.cdktf.providers.aws.dynamodb_table.DynamodbTableConfig;
import software.constructs.Construct;

import java.util.List;

public class DynamoDBConstruct extends BaseConstruct {
    private final DynamodbTable table;

    public DynamoDBConstruct(final Construct scope, final String id) {
        super(scope, id);

        // Create DynamoDB table with pay-per-request billing
        this.table = new DynamodbTable(this, "app-table", DynamodbTableConfig.builder()
                .name(resourceName("AppTable"))
                .billingMode("PAY_PER_REQUEST")
                .hashKey("id")
                .attribute(List.of(DynamodbTableAttribute.builder()
                        .name("id")
                        .type("S")
                        .build())
                )
                .tags(getTagsWithName("AppTable"))
                .build());
    }

    public String getTableArn() {
        return table.getArn();
    }

    public String getTableName() {
        return table.getName();
    }
}
