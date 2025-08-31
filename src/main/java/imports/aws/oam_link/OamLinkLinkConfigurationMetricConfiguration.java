package imports.aws.oam_link;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.981Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.oamLink.OamLinkLinkConfigurationMetricConfiguration")
@software.amazon.jsii.Jsii.Proxy(OamLinkLinkConfigurationMetricConfiguration.Jsii$Proxy.class)
public interface OamLinkLinkConfigurationMetricConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/oam_link#filter OamLink#filter}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFilter();

    /**
     * @return a {@link Builder} of {@link OamLinkLinkConfigurationMetricConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OamLinkLinkConfigurationMetricConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OamLinkLinkConfigurationMetricConfiguration> {
        java.lang.String filter;

        /**
         * Sets the value of {@link OamLinkLinkConfigurationMetricConfiguration#getFilter}
         * @param filter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/oam_link#filter OamLink#filter}. This parameter is required.
         * @return {@code this}
         */
        public Builder filter(java.lang.String filter) {
            this.filter = filter;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OamLinkLinkConfigurationMetricConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OamLinkLinkConfigurationMetricConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OamLinkLinkConfigurationMetricConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OamLinkLinkConfigurationMetricConfiguration {
        private final java.lang.String filter;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.filter = software.amazon.jsii.Kernel.get(this, "filter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.filter = java.util.Objects.requireNonNull(builder.filter, "filter is required");
        }

        @Override
        public final java.lang.String getFilter() {
            return this.filter;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("filter", om.valueToTree(this.getFilter()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.oamLink.OamLinkLinkConfigurationMetricConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OamLinkLinkConfigurationMetricConfiguration.Jsii$Proxy that = (OamLinkLinkConfigurationMetricConfiguration.Jsii$Proxy) o;

            return this.filter.equals(that.filter);
        }

        @Override
        public final int hashCode() {
            int result = this.filter.hashCode();
            return result;
        }
    }
}
