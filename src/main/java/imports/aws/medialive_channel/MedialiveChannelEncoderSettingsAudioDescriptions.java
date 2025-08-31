package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.864Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptions")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsAudioDescriptions.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsAudioDescriptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_selector_name MedialiveChannel#audio_selector_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAudioSelectorName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#name MedialiveChannel#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * audio_normalization_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_normalization_settings MedialiveChannel#audio_normalization_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings getAudioNormalizationSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_type MedialiveChannel#audio_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAudioType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_type_control MedialiveChannel#audio_type_control}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAudioTypeControl() {
        return null;
    }

    /**
     * audio_watermark_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_watermark_settings MedialiveChannel#audio_watermark_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettings getAudioWatermarkSettings() {
        return null;
    }

    /**
     * codec_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#codec_settings MedialiveChannel#codec_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings getCodecSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#language_code MedialiveChannel#language_code}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLanguageCode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#language_code_control MedialiveChannel#language_code_control}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLanguageCodeControl() {
        return null;
    }

    /**
     * remix_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#remix_settings MedialiveChannel#remix_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings getRemixSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#stream_name MedialiveChannel#stream_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStreamName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsAudioDescriptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsAudioDescriptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsAudioDescriptions> {
        java.lang.String audioSelectorName;
        java.lang.String name;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings audioNormalizationSettings;
        java.lang.String audioType;
        java.lang.String audioTypeControl;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettings audioWatermarkSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings codecSettings;
        java.lang.String languageCode;
        java.lang.String languageCodeControl;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings remixSettings;
        java.lang.String streamName;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptions#getAudioSelectorName}
         * @param audioSelectorName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_selector_name MedialiveChannel#audio_selector_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder audioSelectorName(java.lang.String audioSelectorName) {
            this.audioSelectorName = audioSelectorName;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptions#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#name MedialiveChannel#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptions#getAudioNormalizationSettings}
         * @param audioNormalizationSettings audio_normalization_settings block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_normalization_settings MedialiveChannel#audio_normalization_settings}
         * @return {@code this}
         */
        public Builder audioNormalizationSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings audioNormalizationSettings) {
            this.audioNormalizationSettings = audioNormalizationSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptions#getAudioType}
         * @param audioType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_type MedialiveChannel#audio_type}.
         * @return {@code this}
         */
        public Builder audioType(java.lang.String audioType) {
            this.audioType = audioType;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptions#getAudioTypeControl}
         * @param audioTypeControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_type_control MedialiveChannel#audio_type_control}.
         * @return {@code this}
         */
        public Builder audioTypeControl(java.lang.String audioTypeControl) {
            this.audioTypeControl = audioTypeControl;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptions#getAudioWatermarkSettings}
         * @param audioWatermarkSettings audio_watermark_settings block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_watermark_settings MedialiveChannel#audio_watermark_settings}
         * @return {@code this}
         */
        public Builder audioWatermarkSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettings audioWatermarkSettings) {
            this.audioWatermarkSettings = audioWatermarkSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptions#getCodecSettings}
         * @param codecSettings codec_settings block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#codec_settings MedialiveChannel#codec_settings}
         * @return {@code this}
         */
        public Builder codecSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings codecSettings) {
            this.codecSettings = codecSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptions#getLanguageCode}
         * @param languageCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#language_code MedialiveChannel#language_code}.
         * @return {@code this}
         */
        public Builder languageCode(java.lang.String languageCode) {
            this.languageCode = languageCode;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptions#getLanguageCodeControl}
         * @param languageCodeControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#language_code_control MedialiveChannel#language_code_control}.
         * @return {@code this}
         */
        public Builder languageCodeControl(java.lang.String languageCodeControl) {
            this.languageCodeControl = languageCodeControl;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptions#getRemixSettings}
         * @param remixSettings remix_settings block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#remix_settings MedialiveChannel#remix_settings}
         * @return {@code this}
         */
        public Builder remixSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings remixSettings) {
            this.remixSettings = remixSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptions#getStreamName}
         * @param streamName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#stream_name MedialiveChannel#stream_name}.
         * @return {@code this}
         */
        public Builder streamName(java.lang.String streamName) {
            this.streamName = streamName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsAudioDescriptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsAudioDescriptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsAudioDescriptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsAudioDescriptions {
        private final java.lang.String audioSelectorName;
        private final java.lang.String name;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings audioNormalizationSettings;
        private final java.lang.String audioType;
        private final java.lang.String audioTypeControl;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettings audioWatermarkSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings codecSettings;
        private final java.lang.String languageCode;
        private final java.lang.String languageCodeControl;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings remixSettings;
        private final java.lang.String streamName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.audioSelectorName = software.amazon.jsii.Kernel.get(this, "audioSelectorName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.audioNormalizationSettings = software.amazon.jsii.Kernel.get(this, "audioNormalizationSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings.class));
            this.audioType = software.amazon.jsii.Kernel.get(this, "audioType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.audioTypeControl = software.amazon.jsii.Kernel.get(this, "audioTypeControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.audioWatermarkSettings = software.amazon.jsii.Kernel.get(this, "audioWatermarkSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettings.class));
            this.codecSettings = software.amazon.jsii.Kernel.get(this, "codecSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings.class));
            this.languageCode = software.amazon.jsii.Kernel.get(this, "languageCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.languageCodeControl = software.amazon.jsii.Kernel.get(this, "languageCodeControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.remixSettings = software.amazon.jsii.Kernel.get(this, "remixSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings.class));
            this.streamName = software.amazon.jsii.Kernel.get(this, "streamName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.audioSelectorName = java.util.Objects.requireNonNull(builder.audioSelectorName, "audioSelectorName is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.audioNormalizationSettings = builder.audioNormalizationSettings;
            this.audioType = builder.audioType;
            this.audioTypeControl = builder.audioTypeControl;
            this.audioWatermarkSettings = builder.audioWatermarkSettings;
            this.codecSettings = builder.codecSettings;
            this.languageCode = builder.languageCode;
            this.languageCodeControl = builder.languageCodeControl;
            this.remixSettings = builder.remixSettings;
            this.streamName = builder.streamName;
        }

        @Override
        public final java.lang.String getAudioSelectorName() {
            return this.audioSelectorName;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings getAudioNormalizationSettings() {
            return this.audioNormalizationSettings;
        }

        @Override
        public final java.lang.String getAudioType() {
            return this.audioType;
        }

        @Override
        public final java.lang.String getAudioTypeControl() {
            return this.audioTypeControl;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettings getAudioWatermarkSettings() {
            return this.audioWatermarkSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings getCodecSettings() {
            return this.codecSettings;
        }

        @Override
        public final java.lang.String getLanguageCode() {
            return this.languageCode;
        }

        @Override
        public final java.lang.String getLanguageCodeControl() {
            return this.languageCodeControl;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings getRemixSettings() {
            return this.remixSettings;
        }

        @Override
        public final java.lang.String getStreamName() {
            return this.streamName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("audioSelectorName", om.valueToTree(this.getAudioSelectorName()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getAudioNormalizationSettings() != null) {
                data.set("audioNormalizationSettings", om.valueToTree(this.getAudioNormalizationSettings()));
            }
            if (this.getAudioType() != null) {
                data.set("audioType", om.valueToTree(this.getAudioType()));
            }
            if (this.getAudioTypeControl() != null) {
                data.set("audioTypeControl", om.valueToTree(this.getAudioTypeControl()));
            }
            if (this.getAudioWatermarkSettings() != null) {
                data.set("audioWatermarkSettings", om.valueToTree(this.getAudioWatermarkSettings()));
            }
            if (this.getCodecSettings() != null) {
                data.set("codecSettings", om.valueToTree(this.getCodecSettings()));
            }
            if (this.getLanguageCode() != null) {
                data.set("languageCode", om.valueToTree(this.getLanguageCode()));
            }
            if (this.getLanguageCodeControl() != null) {
                data.set("languageCodeControl", om.valueToTree(this.getLanguageCodeControl()));
            }
            if (this.getRemixSettings() != null) {
                data.set("remixSettings", om.valueToTree(this.getRemixSettings()));
            }
            if (this.getStreamName() != null) {
                data.set("streamName", om.valueToTree(this.getStreamName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsAudioDescriptions.Jsii$Proxy that = (MedialiveChannelEncoderSettingsAudioDescriptions.Jsii$Proxy) o;

            if (!audioSelectorName.equals(that.audioSelectorName)) return false;
            if (!name.equals(that.name)) return false;
            if (this.audioNormalizationSettings != null ? !this.audioNormalizationSettings.equals(that.audioNormalizationSettings) : that.audioNormalizationSettings != null) return false;
            if (this.audioType != null ? !this.audioType.equals(that.audioType) : that.audioType != null) return false;
            if (this.audioTypeControl != null ? !this.audioTypeControl.equals(that.audioTypeControl) : that.audioTypeControl != null) return false;
            if (this.audioWatermarkSettings != null ? !this.audioWatermarkSettings.equals(that.audioWatermarkSettings) : that.audioWatermarkSettings != null) return false;
            if (this.codecSettings != null ? !this.codecSettings.equals(that.codecSettings) : that.codecSettings != null) return false;
            if (this.languageCode != null ? !this.languageCode.equals(that.languageCode) : that.languageCode != null) return false;
            if (this.languageCodeControl != null ? !this.languageCodeControl.equals(that.languageCodeControl) : that.languageCodeControl != null) return false;
            if (this.remixSettings != null ? !this.remixSettings.equals(that.remixSettings) : that.remixSettings != null) return false;
            return this.streamName != null ? this.streamName.equals(that.streamName) : that.streamName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.audioSelectorName.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.audioNormalizationSettings != null ? this.audioNormalizationSettings.hashCode() : 0);
            result = 31 * result + (this.audioType != null ? this.audioType.hashCode() : 0);
            result = 31 * result + (this.audioTypeControl != null ? this.audioTypeControl.hashCode() : 0);
            result = 31 * result + (this.audioWatermarkSettings != null ? this.audioWatermarkSettings.hashCode() : 0);
            result = 31 * result + (this.codecSettings != null ? this.codecSettings.hashCode() : 0);
            result = 31 * result + (this.languageCode != null ? this.languageCode.hashCode() : 0);
            result = 31 * result + (this.languageCodeControl != null ? this.languageCodeControl.hashCode() : 0);
            result = 31 * result + (this.remixSettings != null ? this.remixSettings.hashCode() : 0);
            result = 31 * result + (this.streamName != null ? this.streamName.hashCode() : 0);
            return result;
        }
    }
}
