package imports.aws.api_gateway_usage_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.960Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayUsagePlan.ApiGatewayUsagePlanApiStages")
@software.amazon.jsii.Jsii.Proxy(ApiGatewayUsagePlanApiStages.Jsii$Proxy.class)
public interface ApiGatewayUsagePlanApiStages extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_usage_plan#api_id ApiGatewayUsagePlan#api_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getApiId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_usage_plan#stage ApiGatewayUsagePlan#stage}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStage();

    /**
     * throttle block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_usage_plan#throttle ApiGatewayUsagePlan#throttle}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getThrottle() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApiGatewayUsagePlanApiStages}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApiGatewayUsagePlanApiStages}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApiGatewayUsagePlanApiStages> {
        java.lang.String apiId;
        java.lang.String stage;
        java.lang.Object throttle;

        /**
         * Sets the value of {@link ApiGatewayUsagePlanApiStages#getApiId}
         * @param apiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_usage_plan#api_id ApiGatewayUsagePlan#api_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder apiId(java.lang.String apiId) {
            this.apiId = apiId;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayUsagePlanApiStages#getStage}
         * @param stage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_usage_plan#stage ApiGatewayUsagePlan#stage}. This parameter is required.
         * @return {@code this}
         */
        public Builder stage(java.lang.String stage) {
            this.stage = stage;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayUsagePlanApiStages#getThrottle}
         * @param throttle throttle block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_usage_plan#throttle ApiGatewayUsagePlan#throttle}
         * @return {@code this}
         */
        public Builder throttle(com.hashicorp.cdktf.IResolvable throttle) {
            this.throttle = throttle;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayUsagePlanApiStages#getThrottle}
         * @param throttle throttle block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_usage_plan#throttle ApiGatewayUsagePlan#throttle}
         * @return {@code this}
         */
        public Builder throttle(java.util.List<? extends imports.aws.api_gateway_usage_plan.ApiGatewayUsagePlanApiStagesThrottle> throttle) {
            this.throttle = throttle;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ApiGatewayUsagePlanApiStages}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApiGatewayUsagePlanApiStages build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApiGatewayUsagePlanApiStages}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApiGatewayUsagePlanApiStages {
        private final java.lang.String apiId;
        private final java.lang.String stage;
        private final java.lang.Object throttle;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.apiId = software.amazon.jsii.Kernel.get(this, "apiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.stage = software.amazon.jsii.Kernel.get(this, "stage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.throttle = software.amazon.jsii.Kernel.get(this, "throttle", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.apiId = java.util.Objects.requireNonNull(builder.apiId, "apiId is required");
            this.stage = java.util.Objects.requireNonNull(builder.stage, "stage is required");
            this.throttle = builder.throttle;
        }

        @Override
        public final java.lang.String getApiId() {
            return this.apiId;
        }

        @Override
        public final java.lang.String getStage() {
            return this.stage;
        }

        @Override
        public final java.lang.Object getThrottle() {
            return this.throttle;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("apiId", om.valueToTree(this.getApiId()));
            data.set("stage", om.valueToTree(this.getStage()));
            if (this.getThrottle() != null) {
                data.set("throttle", om.valueToTree(this.getThrottle()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apiGatewayUsagePlan.ApiGatewayUsagePlanApiStages"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApiGatewayUsagePlanApiStages.Jsii$Proxy that = (ApiGatewayUsagePlanApiStages.Jsii$Proxy) o;

            if (!apiId.equals(that.apiId)) return false;
            if (!stage.equals(that.stage)) return false;
            return this.throttle != null ? this.throttle.equals(that.throttle) : that.throttle == null;
        }

        @Override
        public final int hashCode() {
            int result = this.apiId.hashCode();
            result = 31 * result + (this.stage.hashCode());
            result = 31 * result + (this.throttle != null ? this.throttle.hashCode() : 0);
            return result;
        }
    }
}
