package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.877Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * audio_only_hls_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_only_hls_settings MedialiveChannel#audio_only_hls_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings getAudioOnlyHlsSettings() {
        return null;
    }

    /**
     * fmp4_hls_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#fmp4_hls_settings MedialiveChannel#fmp4_hls_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings getFmp4HlsSettings() {
        return null;
    }

    /**
     * frame_capture_hls_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#frame_capture_hls_settings MedialiveChannel#frame_capture_hls_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFrameCaptureHlsSettings getFrameCaptureHlsSettings() {
        return null;
    }

    /**
     * standard_hls_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#standard_hls_settings MedialiveChannel#standard_hls_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettings getStandardHlsSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings> {
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings audioOnlyHlsSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings fmp4HlsSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFrameCaptureHlsSettings frameCaptureHlsSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettings standardHlsSettings;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings#getAudioOnlyHlsSettings}
         * @param audioOnlyHlsSettings audio_only_hls_settings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_only_hls_settings MedialiveChannel#audio_only_hls_settings}
         * @return {@code this}
         */
        public Builder audioOnlyHlsSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings audioOnlyHlsSettings) {
            this.audioOnlyHlsSettings = audioOnlyHlsSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings#getFmp4HlsSettings}
         * @param fmp4HlsSettings fmp4_hls_settings block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#fmp4_hls_settings MedialiveChannel#fmp4_hls_settings}
         * @return {@code this}
         */
        public Builder fmp4HlsSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings fmp4HlsSettings) {
            this.fmp4HlsSettings = fmp4HlsSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings#getFrameCaptureHlsSettings}
         * @param frameCaptureHlsSettings frame_capture_hls_settings block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#frame_capture_hls_settings MedialiveChannel#frame_capture_hls_settings}
         * @return {@code this}
         */
        public Builder frameCaptureHlsSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFrameCaptureHlsSettings frameCaptureHlsSettings) {
            this.frameCaptureHlsSettings = frameCaptureHlsSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings#getStandardHlsSettings}
         * @param standardHlsSettings standard_hls_settings block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#standard_hls_settings MedialiveChannel#standard_hls_settings}
         * @return {@code this}
         */
        public Builder standardHlsSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettings standardHlsSettings) {
            this.standardHlsSettings = standardHlsSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings {
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings audioOnlyHlsSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings fmp4HlsSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFrameCaptureHlsSettings frameCaptureHlsSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettings standardHlsSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.audioOnlyHlsSettings = software.amazon.jsii.Kernel.get(this, "audioOnlyHlsSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings.class));
            this.fmp4HlsSettings = software.amazon.jsii.Kernel.get(this, "fmp4HlsSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings.class));
            this.frameCaptureHlsSettings = software.amazon.jsii.Kernel.get(this, "frameCaptureHlsSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFrameCaptureHlsSettings.class));
            this.standardHlsSettings = software.amazon.jsii.Kernel.get(this, "standardHlsSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.audioOnlyHlsSettings = builder.audioOnlyHlsSettings;
            this.fmp4HlsSettings = builder.fmp4HlsSettings;
            this.frameCaptureHlsSettings = builder.frameCaptureHlsSettings;
            this.standardHlsSettings = builder.standardHlsSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings getAudioOnlyHlsSettings() {
            return this.audioOnlyHlsSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings getFmp4HlsSettings() {
            return this.fmp4HlsSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFrameCaptureHlsSettings getFrameCaptureHlsSettings() {
            return this.frameCaptureHlsSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettings getStandardHlsSettings() {
            return this.standardHlsSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAudioOnlyHlsSettings() != null) {
                data.set("audioOnlyHlsSettings", om.valueToTree(this.getAudioOnlyHlsSettings()));
            }
            if (this.getFmp4HlsSettings() != null) {
                data.set("fmp4HlsSettings", om.valueToTree(this.getFmp4HlsSettings()));
            }
            if (this.getFrameCaptureHlsSettings() != null) {
                data.set("frameCaptureHlsSettings", om.valueToTree(this.getFrameCaptureHlsSettings()));
            }
            if (this.getStandardHlsSettings() != null) {
                data.set("standardHlsSettings", om.valueToTree(this.getStandardHlsSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings.Jsii$Proxy) o;

            if (this.audioOnlyHlsSettings != null ? !this.audioOnlyHlsSettings.equals(that.audioOnlyHlsSettings) : that.audioOnlyHlsSettings != null) return false;
            if (this.fmp4HlsSettings != null ? !this.fmp4HlsSettings.equals(that.fmp4HlsSettings) : that.fmp4HlsSettings != null) return false;
            if (this.frameCaptureHlsSettings != null ? !this.frameCaptureHlsSettings.equals(that.frameCaptureHlsSettings) : that.frameCaptureHlsSettings != null) return false;
            return this.standardHlsSettings != null ? this.standardHlsSettings.equals(that.standardHlsSettings) : that.standardHlsSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.audioOnlyHlsSettings != null ? this.audioOnlyHlsSettings.hashCode() : 0;
            result = 31 * result + (this.fmp4HlsSettings != null ? this.fmp4HlsSettings.hashCode() : 0);
            result = 31 * result + (this.frameCaptureHlsSettings != null ? this.frameCaptureHlsSettings.hashCode() : 0);
            result = 31 * result + (this.standardHlsSettings != null ? this.standardHlsSettings.hashCode() : 0);
            return result;
        }
    }
}
