package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.876Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * container_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#container_settings MedialiveChannel#container_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettings getContainerSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#extension MedialiveChannel#extension}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExtension() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#name_modifier MedialiveChannel#name_modifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNameModifier() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings> {
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettings containerSettings;
        java.lang.String extension;
        java.lang.String nameModifier;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings#getContainerSettings}
         * @param containerSettings container_settings block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#container_settings MedialiveChannel#container_settings}
         * @return {@code this}
         */
        public Builder containerSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettings containerSettings) {
            this.containerSettings = containerSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings#getExtension}
         * @param extension Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#extension MedialiveChannel#extension}.
         * @return {@code this}
         */
        public Builder extension(java.lang.String extension) {
            this.extension = extension;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings#getNameModifier}
         * @param nameModifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#name_modifier MedialiveChannel#name_modifier}.
         * @return {@code this}
         */
        public Builder nameModifier(java.lang.String nameModifier) {
            this.nameModifier = nameModifier;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings {
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettings containerSettings;
        private final java.lang.String extension;
        private final java.lang.String nameModifier;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.containerSettings = software.amazon.jsii.Kernel.get(this, "containerSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettings.class));
            this.extension = software.amazon.jsii.Kernel.get(this, "extension", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nameModifier = software.amazon.jsii.Kernel.get(this, "nameModifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.containerSettings = builder.containerSettings;
            this.extension = builder.extension;
            this.nameModifier = builder.nameModifier;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettings getContainerSettings() {
            return this.containerSettings;
        }

        @Override
        public final java.lang.String getExtension() {
            return this.extension;
        }

        @Override
        public final java.lang.String getNameModifier() {
            return this.nameModifier;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getContainerSettings() != null) {
                data.set("containerSettings", om.valueToTree(this.getContainerSettings()));
            }
            if (this.getExtension() != null) {
                data.set("extension", om.valueToTree(this.getExtension()));
            }
            if (this.getNameModifier() != null) {
                data.set("nameModifier", om.valueToTree(this.getNameModifier()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings.Jsii$Proxy) o;

            if (this.containerSettings != null ? !this.containerSettings.equals(that.containerSettings) : that.containerSettings != null) return false;
            if (this.extension != null ? !this.extension.equals(that.extension) : that.extension != null) return false;
            return this.nameModifier != null ? this.nameModifier.equals(that.nameModifier) : that.nameModifier == null;
        }

        @Override
        public final int hashCode() {
            int result = this.containerSettings != null ? this.containerSettings.hashCode() : 0;
            result = 31 * result + (this.extension != null ? this.extension.hashCode() : 0);
            result = 31 * result + (this.nameModifier != null ? this.nameModifier.hashCode() : 0);
            return result;
        }
    }
}
