package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.113Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetRefreshProperties")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetRefreshProperties.Jsii$Proxy.class)
public interface QuicksightDataSetRefreshProperties extends software.amazon.jsii.JsiiSerializable {

    /**
     * refresh_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#refresh_configuration QuicksightDataSet#refresh_configuration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfiguration getRefreshConfiguration();

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetRefreshProperties}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetRefreshProperties}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetRefreshProperties> {
        imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfiguration refreshConfiguration;

        /**
         * Sets the value of {@link QuicksightDataSetRefreshProperties#getRefreshConfiguration}
         * @param refreshConfiguration refresh_configuration block. This parameter is required.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#refresh_configuration QuicksightDataSet#refresh_configuration}
         * @return {@code this}
         */
        public Builder refreshConfiguration(imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfiguration refreshConfiguration) {
            this.refreshConfiguration = refreshConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetRefreshProperties}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetRefreshProperties build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetRefreshProperties}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetRefreshProperties {
        private final imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfiguration refreshConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.refreshConfiguration = software.amazon.jsii.Kernel.get(this, "refreshConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.refreshConfiguration = java.util.Objects.requireNonNull(builder.refreshConfiguration, "refreshConfiguration is required");
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfiguration getRefreshConfiguration() {
            return this.refreshConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("refreshConfiguration", om.valueToTree(this.getRefreshConfiguration()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetRefreshProperties"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetRefreshProperties.Jsii$Proxy that = (QuicksightDataSetRefreshProperties.Jsii$Proxy) o;

            return this.refreshConfiguration.equals(that.refreshConfiguration);
        }

        @Override
        public final int hashCode() {
            int result = this.refreshConfiguration.hashCode();
            return result;
        }
    }
}
