package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.876Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#output_sdt MedialiveChannel#output_sdt}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOutputSdt() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#rep_interval MedialiveChannel#rep_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRepInterval() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#service_name MedialiveChannel#service_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServiceName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#service_provider_name MedialiveChannel#service_provider_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServiceProviderName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings> {
        java.lang.String outputSdt;
        java.lang.Number repInterval;
        java.lang.String serviceName;
        java.lang.String serviceProviderName;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings#getOutputSdt}
         * @param outputSdt Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#output_sdt MedialiveChannel#output_sdt}.
         * @return {@code this}
         */
        public Builder outputSdt(java.lang.String outputSdt) {
            this.outputSdt = outputSdt;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings#getRepInterval}
         * @param repInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#rep_interval MedialiveChannel#rep_interval}.
         * @return {@code this}
         */
        public Builder repInterval(java.lang.Number repInterval) {
            this.repInterval = repInterval;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings#getServiceName}
         * @param serviceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#service_name MedialiveChannel#service_name}.
         * @return {@code this}
         */
        public Builder serviceName(java.lang.String serviceName) {
            this.serviceName = serviceName;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings#getServiceProviderName}
         * @param serviceProviderName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#service_provider_name MedialiveChannel#service_provider_name}.
         * @return {@code this}
         */
        public Builder serviceProviderName(java.lang.String serviceProviderName) {
            this.serviceProviderName = serviceProviderName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings {
        private final java.lang.String outputSdt;
        private final java.lang.Number repInterval;
        private final java.lang.String serviceName;
        private final java.lang.String serviceProviderName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.outputSdt = software.amazon.jsii.Kernel.get(this, "outputSdt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.repInterval = software.amazon.jsii.Kernel.get(this, "repInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.serviceName = software.amazon.jsii.Kernel.get(this, "serviceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceProviderName = software.amazon.jsii.Kernel.get(this, "serviceProviderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.outputSdt = builder.outputSdt;
            this.repInterval = builder.repInterval;
            this.serviceName = builder.serviceName;
            this.serviceProviderName = builder.serviceProviderName;
        }

        @Override
        public final java.lang.String getOutputSdt() {
            return this.outputSdt;
        }

        @Override
        public final java.lang.Number getRepInterval() {
            return this.repInterval;
        }

        @Override
        public final java.lang.String getServiceName() {
            return this.serviceName;
        }

        @Override
        public final java.lang.String getServiceProviderName() {
            return this.serviceProviderName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getOutputSdt() != null) {
                data.set("outputSdt", om.valueToTree(this.getOutputSdt()));
            }
            if (this.getRepInterval() != null) {
                data.set("repInterval", om.valueToTree(this.getRepInterval()));
            }
            if (this.getServiceName() != null) {
                data.set("serviceName", om.valueToTree(this.getServiceName()));
            }
            if (this.getServiceProviderName() != null) {
                data.set("serviceProviderName", om.valueToTree(this.getServiceProviderName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings.Jsii$Proxy) o;

            if (this.outputSdt != null ? !this.outputSdt.equals(that.outputSdt) : that.outputSdt != null) return false;
            if (this.repInterval != null ? !this.repInterval.equals(that.repInterval) : that.repInterval != null) return false;
            if (this.serviceName != null ? !this.serviceName.equals(that.serviceName) : that.serviceName != null) return false;
            return this.serviceProviderName != null ? this.serviceProviderName.equals(that.serviceProviderName) : that.serviceProviderName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.outputSdt != null ? this.outputSdt.hashCode() : 0;
            result = 31 * result + (this.repInterval != null ? this.repInterval.hashCode() : 0);
            result = 31 * result + (this.serviceName != null ? this.serviceName.hashCode() : 0);
            result = 31 * result + (this.serviceProviderName != null ? this.serviceProviderName.hashCode() : 0);
            return result;
        }
    }
}
