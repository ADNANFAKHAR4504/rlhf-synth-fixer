package app.utils;

import com.pulumi.Context;
import com.pulumi.aws.AwsFunctions;
import com.pulumi.aws.inputs.GetAvailabilityZonesArgs;
import com.pulumi.core.Output;
import com.pulumi.deployment.InvokeOptions;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Map;

public class AwsData {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /**
     * Generic helper to call any Pulumi data source and return as JsonNode
     */
    public static Output<JsonNode> invoke(Context ctx, String token, Map<String, Object> args) {
        return ctx.invoke(token, args, InvokeOptions.Empty)
                .applyValue(result -> MAPPER.valueToTree(result));
    }

    /**
     * Example: Get availability zones
     */
    var azs = AwsFunctions.getAvailabilityZones(GetAvailabilityZonesArgs.builder()
            .state("available")
            .build());

    public static Output<JsonNode> getAvailabilityZones(Context ctx, String state) {
        return invoke(ctx,
                "aws:ec2/getAvailabilityZones:getAvailabilityZones",
                Map.of("state", state));
    }
}
