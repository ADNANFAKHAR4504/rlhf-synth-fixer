package imports.aws.sesv2_configuration_set_event_destination;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.457Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSetEventDestination.Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination")
@software.amazon.jsii.Jsii.Proxy(Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination.Jsii$Proxy.class)
public interface Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination extends software.amazon.jsii.JsiiSerializable {

    /**
     * dimension_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#dimension_configuration Sesv2ConfigurationSetEventDestination#dimension_configuration}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getDimensionConfiguration();

    /**
     * @return a {@link Builder} of {@link Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination> {
        java.lang.Object dimensionConfiguration;

        /**
         * Sets the value of {@link Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination#getDimensionConfiguration}
         * @param dimensionConfiguration dimension_configuration block. This parameter is required.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#dimension_configuration Sesv2ConfigurationSetEventDestination#dimension_configuration}
         * @return {@code this}
         */
        public Builder dimensionConfiguration(com.hashicorp.cdktf.IResolvable dimensionConfiguration) {
            this.dimensionConfiguration = dimensionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination#getDimensionConfiguration}
         * @param dimensionConfiguration dimension_configuration block. This parameter is required.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#dimension_configuration Sesv2ConfigurationSetEventDestination#dimension_configuration}
         * @return {@code this}
         */
        public Builder dimensionConfiguration(java.util.List<? extends imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfiguration> dimensionConfiguration) {
            this.dimensionConfiguration = dimensionConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination {
        private final java.lang.Object dimensionConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dimensionConfiguration = software.amazon.jsii.Kernel.get(this, "dimensionConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dimensionConfiguration = java.util.Objects.requireNonNull(builder.dimensionConfiguration, "dimensionConfiguration is required");
        }

        @Override
        public final java.lang.Object getDimensionConfiguration() {
            return this.dimensionConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("dimensionConfiguration", om.valueToTree(this.getDimensionConfiguration()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sesv2ConfigurationSetEventDestination.Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination.Jsii$Proxy that = (Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination.Jsii$Proxy) o;

            return this.dimensionConfiguration.equals(that.dimensionConfiguration);
        }

        @Override
        public final int hashCode() {
            int result = this.dimensionConfiguration.hashCode();
            return result;
        }
    }
}
