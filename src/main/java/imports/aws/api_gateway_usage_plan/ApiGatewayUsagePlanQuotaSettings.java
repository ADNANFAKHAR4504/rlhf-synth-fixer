package imports.aws.api_gateway_usage_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.961Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayUsagePlan.ApiGatewayUsagePlanQuotaSettings")
@software.amazon.jsii.Jsii.Proxy(ApiGatewayUsagePlanQuotaSettings.Jsii$Proxy.class)
public interface ApiGatewayUsagePlanQuotaSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_usage_plan#limit ApiGatewayUsagePlan#limit}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getLimit();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_usage_plan#period ApiGatewayUsagePlan#period}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPeriod();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_usage_plan#offset ApiGatewayUsagePlan#offset}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getOffset() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApiGatewayUsagePlanQuotaSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApiGatewayUsagePlanQuotaSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApiGatewayUsagePlanQuotaSettings> {
        java.lang.Number limit;
        java.lang.String period;
        java.lang.Number offset;

        /**
         * Sets the value of {@link ApiGatewayUsagePlanQuotaSettings#getLimit}
         * @param limit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_usage_plan#limit ApiGatewayUsagePlan#limit}. This parameter is required.
         * @return {@code this}
         */
        public Builder limit(java.lang.Number limit) {
            this.limit = limit;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayUsagePlanQuotaSettings#getPeriod}
         * @param period Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_usage_plan#period ApiGatewayUsagePlan#period}. This parameter is required.
         * @return {@code this}
         */
        public Builder period(java.lang.String period) {
            this.period = period;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayUsagePlanQuotaSettings#getOffset}
         * @param offset Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_usage_plan#offset ApiGatewayUsagePlan#offset}.
         * @return {@code this}
         */
        public Builder offset(java.lang.Number offset) {
            this.offset = offset;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ApiGatewayUsagePlanQuotaSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApiGatewayUsagePlanQuotaSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApiGatewayUsagePlanQuotaSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApiGatewayUsagePlanQuotaSettings {
        private final java.lang.Number limit;
        private final java.lang.String period;
        private final java.lang.Number offset;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.limit = software.amazon.jsii.Kernel.get(this, "limit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.period = software.amazon.jsii.Kernel.get(this, "period", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.offset = software.amazon.jsii.Kernel.get(this, "offset", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.limit = java.util.Objects.requireNonNull(builder.limit, "limit is required");
            this.period = java.util.Objects.requireNonNull(builder.period, "period is required");
            this.offset = builder.offset;
        }

        @Override
        public final java.lang.Number getLimit() {
            return this.limit;
        }

        @Override
        public final java.lang.String getPeriod() {
            return this.period;
        }

        @Override
        public final java.lang.Number getOffset() {
            return this.offset;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("limit", om.valueToTree(this.getLimit()));
            data.set("period", om.valueToTree(this.getPeriod()));
            if (this.getOffset() != null) {
                data.set("offset", om.valueToTree(this.getOffset()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apiGatewayUsagePlan.ApiGatewayUsagePlanQuotaSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApiGatewayUsagePlanQuotaSettings.Jsii$Proxy that = (ApiGatewayUsagePlanQuotaSettings.Jsii$Proxy) o;

            if (!limit.equals(that.limit)) return false;
            if (!period.equals(that.period)) return false;
            return this.offset != null ? this.offset.equals(that.offset) : that.offset == null;
        }

        @Override
        public final int hashCode() {
            int result = this.limit.hashCode();
            result = 31 * result + (this.period.hashCode());
            result = 31 * result + (this.offset != null ? this.offset.hashCode() : 0);
            return result;
        }
    }
}
