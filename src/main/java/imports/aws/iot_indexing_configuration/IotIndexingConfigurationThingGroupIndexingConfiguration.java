package imports.aws.iot_indexing_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.402Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotIndexingConfiguration.IotIndexingConfigurationThingGroupIndexingConfiguration")
@software.amazon.jsii.Jsii.Proxy(IotIndexingConfigurationThingGroupIndexingConfiguration.Jsii$Proxy.class)
public interface IotIndexingConfigurationThingGroupIndexingConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#thing_group_indexing_mode IotIndexingConfiguration#thing_group_indexing_mode}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getThingGroupIndexingMode();

    /**
     * custom_field block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#custom_field IotIndexingConfiguration#custom_field}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCustomField() {
        return null;
    }

    /**
     * managed_field block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#managed_field IotIndexingConfiguration#managed_field}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getManagedField() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IotIndexingConfigurationThingGroupIndexingConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IotIndexingConfigurationThingGroupIndexingConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IotIndexingConfigurationThingGroupIndexingConfiguration> {
        java.lang.String thingGroupIndexingMode;
        java.lang.Object customField;
        java.lang.Object managedField;

        /**
         * Sets the value of {@link IotIndexingConfigurationThingGroupIndexingConfiguration#getThingGroupIndexingMode}
         * @param thingGroupIndexingMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#thing_group_indexing_mode IotIndexingConfiguration#thing_group_indexing_mode}. This parameter is required.
         * @return {@code this}
         */
        public Builder thingGroupIndexingMode(java.lang.String thingGroupIndexingMode) {
            this.thingGroupIndexingMode = thingGroupIndexingMode;
            return this;
        }

        /**
         * Sets the value of {@link IotIndexingConfigurationThingGroupIndexingConfiguration#getCustomField}
         * @param customField custom_field block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#custom_field IotIndexingConfiguration#custom_field}
         * @return {@code this}
         */
        public Builder customField(com.hashicorp.cdktf.IResolvable customField) {
            this.customField = customField;
            return this;
        }

        /**
         * Sets the value of {@link IotIndexingConfigurationThingGroupIndexingConfiguration#getCustomField}
         * @param customField custom_field block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#custom_field IotIndexingConfiguration#custom_field}
         * @return {@code this}
         */
        public Builder customField(java.util.List<? extends imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfigurationCustomField> customField) {
            this.customField = customField;
            return this;
        }

        /**
         * Sets the value of {@link IotIndexingConfigurationThingGroupIndexingConfiguration#getManagedField}
         * @param managedField managed_field block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#managed_field IotIndexingConfiguration#managed_field}
         * @return {@code this}
         */
        public Builder managedField(com.hashicorp.cdktf.IResolvable managedField) {
            this.managedField = managedField;
            return this;
        }

        /**
         * Sets the value of {@link IotIndexingConfigurationThingGroupIndexingConfiguration#getManagedField}
         * @param managedField managed_field block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#managed_field IotIndexingConfiguration#managed_field}
         * @return {@code this}
         */
        public Builder managedField(java.util.List<? extends imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfigurationManagedField> managedField) {
            this.managedField = managedField;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IotIndexingConfigurationThingGroupIndexingConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IotIndexingConfigurationThingGroupIndexingConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IotIndexingConfigurationThingGroupIndexingConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IotIndexingConfigurationThingGroupIndexingConfiguration {
        private final java.lang.String thingGroupIndexingMode;
        private final java.lang.Object customField;
        private final java.lang.Object managedField;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.thingGroupIndexingMode = software.amazon.jsii.Kernel.get(this, "thingGroupIndexingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customField = software.amazon.jsii.Kernel.get(this, "customField", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.managedField = software.amazon.jsii.Kernel.get(this, "managedField", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.thingGroupIndexingMode = java.util.Objects.requireNonNull(builder.thingGroupIndexingMode, "thingGroupIndexingMode is required");
            this.customField = builder.customField;
            this.managedField = builder.managedField;
        }

        @Override
        public final java.lang.String getThingGroupIndexingMode() {
            return this.thingGroupIndexingMode;
        }

        @Override
        public final java.lang.Object getCustomField() {
            return this.customField;
        }

        @Override
        public final java.lang.Object getManagedField() {
            return this.managedField;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("thingGroupIndexingMode", om.valueToTree(this.getThingGroupIndexingMode()));
            if (this.getCustomField() != null) {
                data.set("customField", om.valueToTree(this.getCustomField()));
            }
            if (this.getManagedField() != null) {
                data.set("managedField", om.valueToTree(this.getManagedField()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.iotIndexingConfiguration.IotIndexingConfigurationThingGroupIndexingConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IotIndexingConfigurationThingGroupIndexingConfiguration.Jsii$Proxy that = (IotIndexingConfigurationThingGroupIndexingConfiguration.Jsii$Proxy) o;

            if (!thingGroupIndexingMode.equals(that.thingGroupIndexingMode)) return false;
            if (this.customField != null ? !this.customField.equals(that.customField) : that.customField != null) return false;
            return this.managedField != null ? this.managedField.equals(that.managedField) : that.managedField == null;
        }

        @Override
        public final int hashCode() {
            int result = this.thingGroupIndexingMode.hashCode();
            result = 31 * result + (this.customField != null ? this.customField.hashCode() : 0);
            result = 31 * result + (this.managedField != null ? this.managedField.hashCode() : 0);
            return result;
        }
    }
}
