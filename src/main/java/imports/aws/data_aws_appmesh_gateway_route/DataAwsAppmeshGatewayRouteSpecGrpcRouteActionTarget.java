package imports.aws.data_aws_appmesh_gateway_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.425Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsAppmeshGatewayRoute.DataAwsAppmeshGatewayRouteSpecGrpcRouteActionTarget")
@software.amazon.jsii.Jsii.Proxy(DataAwsAppmeshGatewayRouteSpecGrpcRouteActionTarget.Jsii$Proxy.class)
public interface DataAwsAppmeshGatewayRouteSpecGrpcRouteActionTarget extends software.amazon.jsii.JsiiSerializable {

    /**
     * @return a {@link Builder} of {@link DataAwsAppmeshGatewayRouteSpecGrpcRouteActionTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsAppmeshGatewayRouteSpecGrpcRouteActionTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsAppmeshGatewayRouteSpecGrpcRouteActionTarget> {

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsAppmeshGatewayRouteSpecGrpcRouteActionTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsAppmeshGatewayRouteSpecGrpcRouteActionTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsAppmeshGatewayRouteSpecGrpcRouteActionTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsAppmeshGatewayRouteSpecGrpcRouteActionTarget {

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();


            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsAppmeshGatewayRoute.DataAwsAppmeshGatewayRouteSpecGrpcRouteActionTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }
    }
}
