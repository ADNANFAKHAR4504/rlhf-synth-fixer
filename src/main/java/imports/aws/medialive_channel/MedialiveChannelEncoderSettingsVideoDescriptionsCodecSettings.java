package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.882Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * frame_capture_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#frame_capture_settings MedialiveChannel#frame_capture_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings getFrameCaptureSettings() {
        return null;
    }

    /**
     * h264_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#h264_settings MedialiveChannel#h264_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264Settings getH264Settings() {
        return null;
    }

    /**
     * h265_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#h265_settings MedialiveChannel#h265_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings getH265Settings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings> {
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings frameCaptureSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264Settings h264Settings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings h265Settings;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings#getFrameCaptureSettings}
         * @param frameCaptureSettings frame_capture_settings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#frame_capture_settings MedialiveChannel#frame_capture_settings}
         * @return {@code this}
         */
        public Builder frameCaptureSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings frameCaptureSettings) {
            this.frameCaptureSettings = frameCaptureSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings#getH264Settings}
         * @param h264Settings h264_settings block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#h264_settings MedialiveChannel#h264_settings}
         * @return {@code this}
         */
        public Builder h264Settings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264Settings h264Settings) {
            this.h264Settings = h264Settings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings#getH265Settings}
         * @param h265Settings h265_settings block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#h265_settings MedialiveChannel#h265_settings}
         * @return {@code this}
         */
        public Builder h265Settings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings h265Settings) {
            this.h265Settings = h265Settings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings {
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings frameCaptureSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264Settings h264Settings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings h265Settings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.frameCaptureSettings = software.amazon.jsii.Kernel.get(this, "frameCaptureSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings.class));
            this.h264Settings = software.amazon.jsii.Kernel.get(this, "h264Settings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264Settings.class));
            this.h265Settings = software.amazon.jsii.Kernel.get(this, "h265Settings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.frameCaptureSettings = builder.frameCaptureSettings;
            this.h264Settings = builder.h264Settings;
            this.h265Settings = builder.h265Settings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsFrameCaptureSettings getFrameCaptureSettings() {
            return this.frameCaptureSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH264Settings getH264Settings() {
            return this.h264Settings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings getH265Settings() {
            return this.h265Settings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFrameCaptureSettings() != null) {
                data.set("frameCaptureSettings", om.valueToTree(this.getFrameCaptureSettings()));
            }
            if (this.getH264Settings() != null) {
                data.set("h264Settings", om.valueToTree(this.getH264Settings()));
            }
            if (this.getH265Settings() != null) {
                data.set("h265Settings", om.valueToTree(this.getH265Settings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings.Jsii$Proxy) o;

            if (this.frameCaptureSettings != null ? !this.frameCaptureSettings.equals(that.frameCaptureSettings) : that.frameCaptureSettings != null) return false;
            if (this.h264Settings != null ? !this.h264Settings.equals(that.h264Settings) : that.h264Settings != null) return false;
            return this.h265Settings != null ? this.h265Settings.equals(that.h265Settings) : that.h265Settings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.frameCaptureSettings != null ? this.frameCaptureSettings.hashCode() : 0;
            result = 31 * result + (this.h264Settings != null ? this.h264Settings.hashCode() : 0);
            result = 31 * result + (this.h265Settings != null ? this.h265Settings.hashCode() : 0);
            return result;
        }
    }
}
