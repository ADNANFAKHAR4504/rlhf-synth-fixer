package imports.aws.sesv2_configuration_set_event_destination;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.457Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSetEventDestination.Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfiguration")
@software.amazon.jsii.Jsii.Proxy(Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfiguration.Jsii$Proxy.class)
public interface Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#default_dimension_value Sesv2ConfigurationSetEventDestination#default_dimension_value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDefaultDimensionValue();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#dimension_name Sesv2ConfigurationSetEventDestination#dimension_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDimensionName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#dimension_value_source Sesv2ConfigurationSetEventDestination#dimension_value_source}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDimensionValueSource();

    /**
     * @return a {@link Builder} of {@link Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfiguration> {
        java.lang.String defaultDimensionValue;
        java.lang.String dimensionName;
        java.lang.String dimensionValueSource;

        /**
         * Sets the value of {@link Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfiguration#getDefaultDimensionValue}
         * @param defaultDimensionValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#default_dimension_value Sesv2ConfigurationSetEventDestination#default_dimension_value}. This parameter is required.
         * @return {@code this}
         */
        public Builder defaultDimensionValue(java.lang.String defaultDimensionValue) {
            this.defaultDimensionValue = defaultDimensionValue;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfiguration#getDimensionName}
         * @param dimensionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#dimension_name Sesv2ConfigurationSetEventDestination#dimension_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder dimensionName(java.lang.String dimensionName) {
            this.dimensionName = dimensionName;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfiguration#getDimensionValueSource}
         * @param dimensionValueSource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#dimension_value_source Sesv2ConfigurationSetEventDestination#dimension_value_source}. This parameter is required.
         * @return {@code this}
         */
        public Builder dimensionValueSource(java.lang.String dimensionValueSource) {
            this.dimensionValueSource = dimensionValueSource;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfiguration {
        private final java.lang.String defaultDimensionValue;
        private final java.lang.String dimensionName;
        private final java.lang.String dimensionValueSource;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.defaultDimensionValue = software.amazon.jsii.Kernel.get(this, "defaultDimensionValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dimensionName = software.amazon.jsii.Kernel.get(this, "dimensionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dimensionValueSource = software.amazon.jsii.Kernel.get(this, "dimensionValueSource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.defaultDimensionValue = java.util.Objects.requireNonNull(builder.defaultDimensionValue, "defaultDimensionValue is required");
            this.dimensionName = java.util.Objects.requireNonNull(builder.dimensionName, "dimensionName is required");
            this.dimensionValueSource = java.util.Objects.requireNonNull(builder.dimensionValueSource, "dimensionValueSource is required");
        }

        @Override
        public final java.lang.String getDefaultDimensionValue() {
            return this.defaultDimensionValue;
        }

        @Override
        public final java.lang.String getDimensionName() {
            return this.dimensionName;
        }

        @Override
        public final java.lang.String getDimensionValueSource() {
            return this.dimensionValueSource;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("defaultDimensionValue", om.valueToTree(this.getDefaultDimensionValue()));
            data.set("dimensionName", om.valueToTree(this.getDimensionName()));
            data.set("dimensionValueSource", om.valueToTree(this.getDimensionValueSource()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sesv2ConfigurationSetEventDestination.Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfiguration.Jsii$Proxy that = (Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfiguration.Jsii$Proxy) o;

            if (!defaultDimensionValue.equals(that.defaultDimensionValue)) return false;
            if (!dimensionName.equals(that.dimensionName)) return false;
            return this.dimensionValueSource.equals(that.dimensionValueSource);
        }

        @Override
        public final int hashCode() {
            int result = this.defaultDimensionValue.hashCode();
            result = 31 * result + (this.dimensionName.hashCode());
            result = 31 * result + (this.dimensionValueSource.hashCode());
            return result;
        }
    }
}
