package imports.aws.api_gateway_usage_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.961Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayUsagePlan.ApiGatewayUsagePlanThrottleSettings")
@software.amazon.jsii.Jsii.Proxy(ApiGatewayUsagePlanThrottleSettings.Jsii$Proxy.class)
public interface ApiGatewayUsagePlanThrottleSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_usage_plan#burst_limit ApiGatewayUsagePlan#burst_limit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBurstLimit() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_usage_plan#rate_limit ApiGatewayUsagePlan#rate_limit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRateLimit() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApiGatewayUsagePlanThrottleSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApiGatewayUsagePlanThrottleSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApiGatewayUsagePlanThrottleSettings> {
        java.lang.Number burstLimit;
        java.lang.Number rateLimit;

        /**
         * Sets the value of {@link ApiGatewayUsagePlanThrottleSettings#getBurstLimit}
         * @param burstLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_usage_plan#burst_limit ApiGatewayUsagePlan#burst_limit}.
         * @return {@code this}
         */
        public Builder burstLimit(java.lang.Number burstLimit) {
            this.burstLimit = burstLimit;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayUsagePlanThrottleSettings#getRateLimit}
         * @param rateLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_usage_plan#rate_limit ApiGatewayUsagePlan#rate_limit}.
         * @return {@code this}
         */
        public Builder rateLimit(java.lang.Number rateLimit) {
            this.rateLimit = rateLimit;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ApiGatewayUsagePlanThrottleSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApiGatewayUsagePlanThrottleSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApiGatewayUsagePlanThrottleSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApiGatewayUsagePlanThrottleSettings {
        private final java.lang.Number burstLimit;
        private final java.lang.Number rateLimit;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.burstLimit = software.amazon.jsii.Kernel.get(this, "burstLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.rateLimit = software.amazon.jsii.Kernel.get(this, "rateLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.burstLimit = builder.burstLimit;
            this.rateLimit = builder.rateLimit;
        }

        @Override
        public final java.lang.Number getBurstLimit() {
            return this.burstLimit;
        }

        @Override
        public final java.lang.Number getRateLimit() {
            return this.rateLimit;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBurstLimit() != null) {
                data.set("burstLimit", om.valueToTree(this.getBurstLimit()));
            }
            if (this.getRateLimit() != null) {
                data.set("rateLimit", om.valueToTree(this.getRateLimit()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apiGatewayUsagePlan.ApiGatewayUsagePlanThrottleSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApiGatewayUsagePlanThrottleSettings.Jsii$Proxy that = (ApiGatewayUsagePlanThrottleSettings.Jsii$Proxy) o;

            if (this.burstLimit != null ? !this.burstLimit.equals(that.burstLimit) : that.burstLimit != null) return false;
            return this.rateLimit != null ? this.rateLimit.equals(that.rateLimit) : that.rateLimit == null;
        }

        @Override
        public final int hashCode() {
            int result = this.burstLimit != null ? this.burstLimit.hashCode() : 0;
            result = 31 * result + (this.rateLimit != null ? this.rateLimit.hashCode() : 0);
            return result;
        }
    }
}
