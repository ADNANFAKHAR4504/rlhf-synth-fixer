package imports.aws.iot_indexing_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.402Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotIndexingConfiguration.IotIndexingConfigurationThingIndexingConfiguration")
@software.amazon.jsii.Jsii.Proxy(IotIndexingConfigurationThingIndexingConfiguration.Jsii$Proxy.class)
public interface IotIndexingConfigurationThingIndexingConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#thing_indexing_mode IotIndexingConfiguration#thing_indexing_mode}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getThingIndexingMode();

    /**
     * custom_field block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#custom_field IotIndexingConfiguration#custom_field}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCustomField() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#device_defender_indexing_mode IotIndexingConfiguration#device_defender_indexing_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeviceDefenderIndexingMode() {
        return null;
    }

    /**
     * filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#filter IotIndexingConfiguration#filter}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationFilter getFilter() {
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
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#named_shadow_indexing_mode IotIndexingConfiguration#named_shadow_indexing_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamedShadowIndexingMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#thing_connectivity_indexing_mode IotIndexingConfiguration#thing_connectivity_indexing_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getThingConnectivityIndexingMode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IotIndexingConfigurationThingIndexingConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IotIndexingConfigurationThingIndexingConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IotIndexingConfigurationThingIndexingConfiguration> {
        java.lang.String thingIndexingMode;
        java.lang.Object customField;
        java.lang.String deviceDefenderIndexingMode;
        imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationFilter filter;
        java.lang.Object managedField;
        java.lang.String namedShadowIndexingMode;
        java.lang.String thingConnectivityIndexingMode;

        /**
         * Sets the value of {@link IotIndexingConfigurationThingIndexingConfiguration#getThingIndexingMode}
         * @param thingIndexingMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#thing_indexing_mode IotIndexingConfiguration#thing_indexing_mode}. This parameter is required.
         * @return {@code this}
         */
        public Builder thingIndexingMode(java.lang.String thingIndexingMode) {
            this.thingIndexingMode = thingIndexingMode;
            return this;
        }

        /**
         * Sets the value of {@link IotIndexingConfigurationThingIndexingConfiguration#getCustomField}
         * @param customField custom_field block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#custom_field IotIndexingConfiguration#custom_field}
         * @return {@code this}
         */
        public Builder customField(com.hashicorp.cdktf.IResolvable customField) {
            this.customField = customField;
            return this;
        }

        /**
         * Sets the value of {@link IotIndexingConfigurationThingIndexingConfiguration#getCustomField}
         * @param customField custom_field block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#custom_field IotIndexingConfiguration#custom_field}
         * @return {@code this}
         */
        public Builder customField(java.util.List<? extends imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationCustomField> customField) {
            this.customField = customField;
            return this;
        }

        /**
         * Sets the value of {@link IotIndexingConfigurationThingIndexingConfiguration#getDeviceDefenderIndexingMode}
         * @param deviceDefenderIndexingMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#device_defender_indexing_mode IotIndexingConfiguration#device_defender_indexing_mode}.
         * @return {@code this}
         */
        public Builder deviceDefenderIndexingMode(java.lang.String deviceDefenderIndexingMode) {
            this.deviceDefenderIndexingMode = deviceDefenderIndexingMode;
            return this;
        }

        /**
         * Sets the value of {@link IotIndexingConfigurationThingIndexingConfiguration#getFilter}
         * @param filter filter block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#filter IotIndexingConfiguration#filter}
         * @return {@code this}
         */
        public Builder filter(imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationFilter filter) {
            this.filter = filter;
            return this;
        }

        /**
         * Sets the value of {@link IotIndexingConfigurationThingIndexingConfiguration#getManagedField}
         * @param managedField managed_field block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#managed_field IotIndexingConfiguration#managed_field}
         * @return {@code this}
         */
        public Builder managedField(com.hashicorp.cdktf.IResolvable managedField) {
            this.managedField = managedField;
            return this;
        }

        /**
         * Sets the value of {@link IotIndexingConfigurationThingIndexingConfiguration#getManagedField}
         * @param managedField managed_field block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#managed_field IotIndexingConfiguration#managed_field}
         * @return {@code this}
         */
        public Builder managedField(java.util.List<? extends imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationManagedField> managedField) {
            this.managedField = managedField;
            return this;
        }

        /**
         * Sets the value of {@link IotIndexingConfigurationThingIndexingConfiguration#getNamedShadowIndexingMode}
         * @param namedShadowIndexingMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#named_shadow_indexing_mode IotIndexingConfiguration#named_shadow_indexing_mode}.
         * @return {@code this}
         */
        public Builder namedShadowIndexingMode(java.lang.String namedShadowIndexingMode) {
            this.namedShadowIndexingMode = namedShadowIndexingMode;
            return this;
        }

        /**
         * Sets the value of {@link IotIndexingConfigurationThingIndexingConfiguration#getThingConnectivityIndexingMode}
         * @param thingConnectivityIndexingMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#thing_connectivity_indexing_mode IotIndexingConfiguration#thing_connectivity_indexing_mode}.
         * @return {@code this}
         */
        public Builder thingConnectivityIndexingMode(java.lang.String thingConnectivityIndexingMode) {
            this.thingConnectivityIndexingMode = thingConnectivityIndexingMode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IotIndexingConfigurationThingIndexingConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IotIndexingConfigurationThingIndexingConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IotIndexingConfigurationThingIndexingConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IotIndexingConfigurationThingIndexingConfiguration {
        private final java.lang.String thingIndexingMode;
        private final java.lang.Object customField;
        private final java.lang.String deviceDefenderIndexingMode;
        private final imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationFilter filter;
        private final java.lang.Object managedField;
        private final java.lang.String namedShadowIndexingMode;
        private final java.lang.String thingConnectivityIndexingMode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.thingIndexingMode = software.amazon.jsii.Kernel.get(this, "thingIndexingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customField = software.amazon.jsii.Kernel.get(this, "customField", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.deviceDefenderIndexingMode = software.amazon.jsii.Kernel.get(this, "deviceDefenderIndexingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.filter = software.amazon.jsii.Kernel.get(this, "filter", software.amazon.jsii.NativeType.forClass(imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationFilter.class));
            this.managedField = software.amazon.jsii.Kernel.get(this, "managedField", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.namedShadowIndexingMode = software.amazon.jsii.Kernel.get(this, "namedShadowIndexingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.thingConnectivityIndexingMode = software.amazon.jsii.Kernel.get(this, "thingConnectivityIndexingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.thingIndexingMode = java.util.Objects.requireNonNull(builder.thingIndexingMode, "thingIndexingMode is required");
            this.customField = builder.customField;
            this.deviceDefenderIndexingMode = builder.deviceDefenderIndexingMode;
            this.filter = builder.filter;
            this.managedField = builder.managedField;
            this.namedShadowIndexingMode = builder.namedShadowIndexingMode;
            this.thingConnectivityIndexingMode = builder.thingConnectivityIndexingMode;
        }

        @Override
        public final java.lang.String getThingIndexingMode() {
            return this.thingIndexingMode;
        }

        @Override
        public final java.lang.Object getCustomField() {
            return this.customField;
        }

        @Override
        public final java.lang.String getDeviceDefenderIndexingMode() {
            return this.deviceDefenderIndexingMode;
        }

        @Override
        public final imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationFilter getFilter() {
            return this.filter;
        }

        @Override
        public final java.lang.Object getManagedField() {
            return this.managedField;
        }

        @Override
        public final java.lang.String getNamedShadowIndexingMode() {
            return this.namedShadowIndexingMode;
        }

        @Override
        public final java.lang.String getThingConnectivityIndexingMode() {
            return this.thingConnectivityIndexingMode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("thingIndexingMode", om.valueToTree(this.getThingIndexingMode()));
            if (this.getCustomField() != null) {
                data.set("customField", om.valueToTree(this.getCustomField()));
            }
            if (this.getDeviceDefenderIndexingMode() != null) {
                data.set("deviceDefenderIndexingMode", om.valueToTree(this.getDeviceDefenderIndexingMode()));
            }
            if (this.getFilter() != null) {
                data.set("filter", om.valueToTree(this.getFilter()));
            }
            if (this.getManagedField() != null) {
                data.set("managedField", om.valueToTree(this.getManagedField()));
            }
            if (this.getNamedShadowIndexingMode() != null) {
                data.set("namedShadowIndexingMode", om.valueToTree(this.getNamedShadowIndexingMode()));
            }
            if (this.getThingConnectivityIndexingMode() != null) {
                data.set("thingConnectivityIndexingMode", om.valueToTree(this.getThingConnectivityIndexingMode()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.iotIndexingConfiguration.IotIndexingConfigurationThingIndexingConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IotIndexingConfigurationThingIndexingConfiguration.Jsii$Proxy that = (IotIndexingConfigurationThingIndexingConfiguration.Jsii$Proxy) o;

            if (!thingIndexingMode.equals(that.thingIndexingMode)) return false;
            if (this.customField != null ? !this.customField.equals(that.customField) : that.customField != null) return false;
            if (this.deviceDefenderIndexingMode != null ? !this.deviceDefenderIndexingMode.equals(that.deviceDefenderIndexingMode) : that.deviceDefenderIndexingMode != null) return false;
            if (this.filter != null ? !this.filter.equals(that.filter) : that.filter != null) return false;
            if (this.managedField != null ? !this.managedField.equals(that.managedField) : that.managedField != null) return false;
            if (this.namedShadowIndexingMode != null ? !this.namedShadowIndexingMode.equals(that.namedShadowIndexingMode) : that.namedShadowIndexingMode != null) return false;
            return this.thingConnectivityIndexingMode != null ? this.thingConnectivityIndexingMode.equals(that.thingConnectivityIndexingMode) : that.thingConnectivityIndexingMode == null;
        }

        @Override
        public final int hashCode() {
            int result = this.thingIndexingMode.hashCode();
            result = 31 * result + (this.customField != null ? this.customField.hashCode() : 0);
            result = 31 * result + (this.deviceDefenderIndexingMode != null ? this.deviceDefenderIndexingMode.hashCode() : 0);
            result = 31 * result + (this.filter != null ? this.filter.hashCode() : 0);
            result = 31 * result + (this.managedField != null ? this.managedField.hashCode() : 0);
            result = 31 * result + (this.namedShadowIndexingMode != null ? this.namedShadowIndexingMode.hashCode() : 0);
            result = 31 * result + (this.thingConnectivityIndexingMode != null ? this.thingConnectivityIndexingMode.hashCode() : 0);
            return result;
        }
    }
}
