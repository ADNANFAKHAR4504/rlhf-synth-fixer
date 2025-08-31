package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.876Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#rep_interval MedialiveChannel#rep_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRepInterval() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettings> {
        java.lang.Number repInterval;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettings#getRepInterval}
         * @param repInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#rep_interval MedialiveChannel#rep_interval}.
         * @return {@code this}
         */
        public Builder repInterval(java.lang.Number repInterval) {
            this.repInterval = repInterval;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettings {
        private final java.lang.Number repInterval;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.repInterval = software.amazon.jsii.Kernel.get(this, "repInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.repInterval = builder.repInterval;
        }

        @Override
        public final java.lang.Number getRepInterval() {
            return this.repInterval;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRepInterval() != null) {
                data.set("repInterval", om.valueToTree(this.getRepInterval()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettings.Jsii$Proxy) o;

            return this.repInterval != null ? this.repInterval.equals(that.repInterval) : that.repInterval == null;
        }

        @Override
        public final int hashCode() {
            int result = this.repInterval != null ? this.repInterval.hashCode() : 0;
            return result;
        }
    }
}
