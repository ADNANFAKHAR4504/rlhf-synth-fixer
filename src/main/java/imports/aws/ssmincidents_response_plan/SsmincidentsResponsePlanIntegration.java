package imports.aws.ssmincidents_response_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.517Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanIntegration")
@software.amazon.jsii.Jsii.Proxy(SsmincidentsResponsePlanIntegration.Jsii$Proxy.class)
public interface SsmincidentsResponsePlanIntegration extends software.amazon.jsii.JsiiSerializable {

    /**
     * pagerduty block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#pagerduty SsmincidentsResponsePlan#pagerduty}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPagerduty() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmincidentsResponsePlanIntegration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmincidentsResponsePlanIntegration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmincidentsResponsePlanIntegration> {
        java.lang.Object pagerduty;

        /**
         * Sets the value of {@link SsmincidentsResponsePlanIntegration#getPagerduty}
         * @param pagerduty pagerduty block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#pagerduty SsmincidentsResponsePlan#pagerduty}
         * @return {@code this}
         */
        public Builder pagerduty(com.hashicorp.cdktf.IResolvable pagerduty) {
            this.pagerduty = pagerduty;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanIntegration#getPagerduty}
         * @param pagerduty pagerduty block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#pagerduty SsmincidentsResponsePlan#pagerduty}
         * @return {@code this}
         */
        public Builder pagerduty(java.util.List<? extends imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIntegrationPagerduty> pagerduty) {
            this.pagerduty = pagerduty;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmincidentsResponsePlanIntegration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmincidentsResponsePlanIntegration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmincidentsResponsePlanIntegration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmincidentsResponsePlanIntegration {
        private final java.lang.Object pagerduty;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.pagerduty = software.amazon.jsii.Kernel.get(this, "pagerduty", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.pagerduty = builder.pagerduty;
        }

        @Override
        public final java.lang.Object getPagerduty() {
            return this.pagerduty;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getPagerduty() != null) {
                data.set("pagerduty", om.valueToTree(this.getPagerduty()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanIntegration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmincidentsResponsePlanIntegration.Jsii$Proxy that = (SsmincidentsResponsePlanIntegration.Jsii$Proxy) o;

            return this.pagerduty != null ? this.pagerduty.equals(that.pagerduty) : that.pagerduty == null;
        }

        @Override
        public final int hashCode() {
            int result = this.pagerduty != null ? this.pagerduty.hashCode() : 0;
            return result;
        }
    }
}
