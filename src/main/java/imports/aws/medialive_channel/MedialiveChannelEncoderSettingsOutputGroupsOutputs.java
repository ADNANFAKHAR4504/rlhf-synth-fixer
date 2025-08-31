package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.875Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputs")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputs.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputs extends software.amazon.jsii.JsiiSerializable {

    /**
     * output_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#output_settings MedialiveChannel#output_settings}
     */
    @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings getOutputSettings();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_description_names MedialiveChannel#audio_description_names}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAudioDescriptionNames() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#caption_description_names MedialiveChannel#caption_description_names}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCaptionDescriptionNames() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#output_name MedialiveChannel#output_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOutputName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#video_description_name MedialiveChannel#video_description_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVideoDescriptionName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputs}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputs}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputs> {
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings outputSettings;
        java.util.List<java.lang.String> audioDescriptionNames;
        java.util.List<java.lang.String> captionDescriptionNames;
        java.lang.String outputName;
        java.lang.String videoDescriptionName;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputs#getOutputSettings}
         * @param outputSettings output_settings block. This parameter is required.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#output_settings MedialiveChannel#output_settings}
         * @return {@code this}
         */
        public Builder outputSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings outputSettings) {
            this.outputSettings = outputSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputs#getAudioDescriptionNames}
         * @param audioDescriptionNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_description_names MedialiveChannel#audio_description_names}.
         * @return {@code this}
         */
        public Builder audioDescriptionNames(java.util.List<java.lang.String> audioDescriptionNames) {
            this.audioDescriptionNames = audioDescriptionNames;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputs#getCaptionDescriptionNames}
         * @param captionDescriptionNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#caption_description_names MedialiveChannel#caption_description_names}.
         * @return {@code this}
         */
        public Builder captionDescriptionNames(java.util.List<java.lang.String> captionDescriptionNames) {
            this.captionDescriptionNames = captionDescriptionNames;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputs#getOutputName}
         * @param outputName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#output_name MedialiveChannel#output_name}.
         * @return {@code this}
         */
        public Builder outputName(java.lang.String outputName) {
            this.outputName = outputName;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputs#getVideoDescriptionName}
         * @param videoDescriptionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#video_description_name MedialiveChannel#video_description_name}.
         * @return {@code this}
         */
        public Builder videoDescriptionName(java.lang.String videoDescriptionName) {
            this.videoDescriptionName = videoDescriptionName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputs}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputs build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputs}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputs {
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings outputSettings;
        private final java.util.List<java.lang.String> audioDescriptionNames;
        private final java.util.List<java.lang.String> captionDescriptionNames;
        private final java.lang.String outputName;
        private final java.lang.String videoDescriptionName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.outputSettings = software.amazon.jsii.Kernel.get(this, "outputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings.class));
            this.audioDescriptionNames = software.amazon.jsii.Kernel.get(this, "audioDescriptionNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.captionDescriptionNames = software.amazon.jsii.Kernel.get(this, "captionDescriptionNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.outputName = software.amazon.jsii.Kernel.get(this, "outputName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.videoDescriptionName = software.amazon.jsii.Kernel.get(this, "videoDescriptionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.outputSettings = java.util.Objects.requireNonNull(builder.outputSettings, "outputSettings is required");
            this.audioDescriptionNames = builder.audioDescriptionNames;
            this.captionDescriptionNames = builder.captionDescriptionNames;
            this.outputName = builder.outputName;
            this.videoDescriptionName = builder.videoDescriptionName;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings getOutputSettings() {
            return this.outputSettings;
        }

        @Override
        public final java.util.List<java.lang.String> getAudioDescriptionNames() {
            return this.audioDescriptionNames;
        }

        @Override
        public final java.util.List<java.lang.String> getCaptionDescriptionNames() {
            return this.captionDescriptionNames;
        }

        @Override
        public final java.lang.String getOutputName() {
            return this.outputName;
        }

        @Override
        public final java.lang.String getVideoDescriptionName() {
            return this.videoDescriptionName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("outputSettings", om.valueToTree(this.getOutputSettings()));
            if (this.getAudioDescriptionNames() != null) {
                data.set("audioDescriptionNames", om.valueToTree(this.getAudioDescriptionNames()));
            }
            if (this.getCaptionDescriptionNames() != null) {
                data.set("captionDescriptionNames", om.valueToTree(this.getCaptionDescriptionNames()));
            }
            if (this.getOutputName() != null) {
                data.set("outputName", om.valueToTree(this.getOutputName()));
            }
            if (this.getVideoDescriptionName() != null) {
                data.set("videoDescriptionName", om.valueToTree(this.getVideoDescriptionName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputs"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputs.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputs.Jsii$Proxy) o;

            if (!outputSettings.equals(that.outputSettings)) return false;
            if (this.audioDescriptionNames != null ? !this.audioDescriptionNames.equals(that.audioDescriptionNames) : that.audioDescriptionNames != null) return false;
            if (this.captionDescriptionNames != null ? !this.captionDescriptionNames.equals(that.captionDescriptionNames) : that.captionDescriptionNames != null) return false;
            if (this.outputName != null ? !this.outputName.equals(that.outputName) : that.outputName != null) return false;
            return this.videoDescriptionName != null ? this.videoDescriptionName.equals(that.videoDescriptionName) : that.videoDescriptionName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.outputSettings.hashCode();
            result = 31 * result + (this.audioDescriptionNames != null ? this.audioDescriptionNames.hashCode() : 0);
            result = 31 * result + (this.captionDescriptionNames != null ? this.captionDescriptionNames.hashCode() : 0);
            result = 31 * result + (this.outputName != null ? this.outputName.hashCode() : 0);
            result = 31 * result + (this.videoDescriptionName != null ? this.videoDescriptionName.hashCode() : 0);
            return result;
        }
    }
}
