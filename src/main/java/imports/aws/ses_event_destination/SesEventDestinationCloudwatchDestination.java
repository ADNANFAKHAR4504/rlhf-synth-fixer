package imports.aws.ses_event_destination;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.448Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesEventDestination.SesEventDestinationCloudwatchDestination")
@software.amazon.jsii.Jsii.Proxy(SesEventDestinationCloudwatchDestination.Jsii$Proxy.class)
public interface SesEventDestinationCloudwatchDestination extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#default_value SesEventDestination#default_value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDefaultValue();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#dimension_name SesEventDestination#dimension_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDimensionName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#value_source SesEventDestination#value_source}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getValueSource();

    /**
     * @return a {@link Builder} of {@link SesEventDestinationCloudwatchDestination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SesEventDestinationCloudwatchDestination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SesEventDestinationCloudwatchDestination> {
        java.lang.String defaultValue;
        java.lang.String dimensionName;
        java.lang.String valueSource;

        /**
         * Sets the value of {@link SesEventDestinationCloudwatchDestination#getDefaultValue}
         * @param defaultValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#default_value SesEventDestination#default_value}. This parameter is required.
         * @return {@code this}
         */
        public Builder defaultValue(java.lang.String defaultValue) {
            this.defaultValue = defaultValue;
            return this;
        }

        /**
         * Sets the value of {@link SesEventDestinationCloudwatchDestination#getDimensionName}
         * @param dimensionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#dimension_name SesEventDestination#dimension_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder dimensionName(java.lang.String dimensionName) {
            this.dimensionName = dimensionName;
            return this;
        }

        /**
         * Sets the value of {@link SesEventDestinationCloudwatchDestination#getValueSource}
         * @param valueSource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#value_source SesEventDestination#value_source}. This parameter is required.
         * @return {@code this}
         */
        public Builder valueSource(java.lang.String valueSource) {
            this.valueSource = valueSource;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SesEventDestinationCloudwatchDestination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SesEventDestinationCloudwatchDestination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SesEventDestinationCloudwatchDestination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SesEventDestinationCloudwatchDestination {
        private final java.lang.String defaultValue;
        private final java.lang.String dimensionName;
        private final java.lang.String valueSource;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.defaultValue = software.amazon.jsii.Kernel.get(this, "defaultValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dimensionName = software.amazon.jsii.Kernel.get(this, "dimensionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.valueSource = software.amazon.jsii.Kernel.get(this, "valueSource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.defaultValue = java.util.Objects.requireNonNull(builder.defaultValue, "defaultValue is required");
            this.dimensionName = java.util.Objects.requireNonNull(builder.dimensionName, "dimensionName is required");
            this.valueSource = java.util.Objects.requireNonNull(builder.valueSource, "valueSource is required");
        }

        @Override
        public final java.lang.String getDefaultValue() {
            return this.defaultValue;
        }

        @Override
        public final java.lang.String getDimensionName() {
            return this.dimensionName;
        }

        @Override
        public final java.lang.String getValueSource() {
            return this.valueSource;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("defaultValue", om.valueToTree(this.getDefaultValue()));
            data.set("dimensionName", om.valueToTree(this.getDimensionName()));
            data.set("valueSource", om.valueToTree(this.getValueSource()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sesEventDestination.SesEventDestinationCloudwatchDestination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SesEventDestinationCloudwatchDestination.Jsii$Proxy that = (SesEventDestinationCloudwatchDestination.Jsii$Proxy) o;

            if (!defaultValue.equals(that.defaultValue)) return false;
            if (!dimensionName.equals(that.dimensionName)) return false;
            return this.valueSource.equals(that.valueSource);
        }

        @Override
        public final int hashCode() {
            int result = this.defaultValue.hashCode();
            result = 31 * result + (this.dimensionName.hashCode());
            result = 31 * result + (this.valueSource.hashCode());
            return result;
        }
    }
}
