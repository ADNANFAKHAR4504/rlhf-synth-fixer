package imports.aws.sesv2_configuration_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.456Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSet.Sesv2ConfigurationSetVdmOptionsDashboardOptions")
@software.amazon.jsii.Jsii.Proxy(Sesv2ConfigurationSetVdmOptionsDashboardOptions.Jsii$Proxy.class)
public interface Sesv2ConfigurationSetVdmOptionsDashboardOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#engagement_metrics Sesv2ConfigurationSet#engagement_metrics}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEngagementMetrics() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Sesv2ConfigurationSetVdmOptionsDashboardOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Sesv2ConfigurationSetVdmOptionsDashboardOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Sesv2ConfigurationSetVdmOptionsDashboardOptions> {
        java.lang.String engagementMetrics;

        /**
         * Sets the value of {@link Sesv2ConfigurationSetVdmOptionsDashboardOptions#getEngagementMetrics}
         * @param engagementMetrics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#engagement_metrics Sesv2ConfigurationSet#engagement_metrics}.
         * @return {@code this}
         */
        public Builder engagementMetrics(java.lang.String engagementMetrics) {
            this.engagementMetrics = engagementMetrics;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Sesv2ConfigurationSetVdmOptionsDashboardOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Sesv2ConfigurationSetVdmOptionsDashboardOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Sesv2ConfigurationSetVdmOptionsDashboardOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Sesv2ConfigurationSetVdmOptionsDashboardOptions {
        private final java.lang.String engagementMetrics;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.engagementMetrics = software.amazon.jsii.Kernel.get(this, "engagementMetrics", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.engagementMetrics = builder.engagementMetrics;
        }

        @Override
        public final java.lang.String getEngagementMetrics() {
            return this.engagementMetrics;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEngagementMetrics() != null) {
                data.set("engagementMetrics", om.valueToTree(this.getEngagementMetrics()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sesv2ConfigurationSet.Sesv2ConfigurationSetVdmOptionsDashboardOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Sesv2ConfigurationSetVdmOptionsDashboardOptions.Jsii$Proxy that = (Sesv2ConfigurationSetVdmOptionsDashboardOptions.Jsii$Proxy) o;

            return this.engagementMetrics != null ? this.engagementMetrics.equals(that.engagementMetrics) : that.engagementMetrics == null;
        }

        @Override
        public final int hashCode() {
            int result = this.engagementMetrics != null ? this.engagementMetrics.hashCode() : 0;
            return result;
        }
    }
}
