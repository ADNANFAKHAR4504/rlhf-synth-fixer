package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.883Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * color_space_passthrough_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#color_space_passthrough_settings MedialiveChannel#color_space_passthrough_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsColorSpacePassthroughSettings getColorSpacePassthroughSettings() {
        return null;
    }

    /**
     * dolby_vision81_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#dolby_vision81_settings MedialiveChannel#dolby_vision81_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsDolbyVision81Settings getDolbyVision81Settings() {
        return null;
    }

    /**
     * hdr10_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#hdr10_settings MedialiveChannel#hdr10_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings getHdr10Settings() {
        return null;
    }

    /**
     * rec601_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#rec601_settings MedialiveChannel#rec601_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec601Settings getRec601Settings() {
        return null;
    }

    /**
     * rec709_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#rec709_settings MedialiveChannel#rec709_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec709Settings getRec709Settings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings> {
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsColorSpacePassthroughSettings colorSpacePassthroughSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsDolbyVision81Settings dolbyVision81Settings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings hdr10Settings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec601Settings rec601Settings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec709Settings rec709Settings;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings#getColorSpacePassthroughSettings}
         * @param colorSpacePassthroughSettings color_space_passthrough_settings block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#color_space_passthrough_settings MedialiveChannel#color_space_passthrough_settings}
         * @return {@code this}
         */
        public Builder colorSpacePassthroughSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsColorSpacePassthroughSettings colorSpacePassthroughSettings) {
            this.colorSpacePassthroughSettings = colorSpacePassthroughSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings#getDolbyVision81Settings}
         * @param dolbyVision81Settings dolby_vision81_settings block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#dolby_vision81_settings MedialiveChannel#dolby_vision81_settings}
         * @return {@code this}
         */
        public Builder dolbyVision81Settings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsDolbyVision81Settings dolbyVision81Settings) {
            this.dolbyVision81Settings = dolbyVision81Settings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings#getHdr10Settings}
         * @param hdr10Settings hdr10_settings block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#hdr10_settings MedialiveChannel#hdr10_settings}
         * @return {@code this}
         */
        public Builder hdr10Settings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings hdr10Settings) {
            this.hdr10Settings = hdr10Settings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings#getRec601Settings}
         * @param rec601Settings rec601_settings block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#rec601_settings MedialiveChannel#rec601_settings}
         * @return {@code this}
         */
        public Builder rec601Settings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec601Settings rec601Settings) {
            this.rec601Settings = rec601Settings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings#getRec709Settings}
         * @param rec709Settings rec709_settings block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#rec709_settings MedialiveChannel#rec709_settings}
         * @return {@code this}
         */
        public Builder rec709Settings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec709Settings rec709Settings) {
            this.rec709Settings = rec709Settings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings {
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsColorSpacePassthroughSettings colorSpacePassthroughSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsDolbyVision81Settings dolbyVision81Settings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings hdr10Settings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec601Settings rec601Settings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec709Settings rec709Settings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.colorSpacePassthroughSettings = software.amazon.jsii.Kernel.get(this, "colorSpacePassthroughSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsColorSpacePassthroughSettings.class));
            this.dolbyVision81Settings = software.amazon.jsii.Kernel.get(this, "dolbyVision81Settings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsDolbyVision81Settings.class));
            this.hdr10Settings = software.amazon.jsii.Kernel.get(this, "hdr10Settings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings.class));
            this.rec601Settings = software.amazon.jsii.Kernel.get(this, "rec601Settings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec601Settings.class));
            this.rec709Settings = software.amazon.jsii.Kernel.get(this, "rec709Settings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec709Settings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.colorSpacePassthroughSettings = builder.colorSpacePassthroughSettings;
            this.dolbyVision81Settings = builder.dolbyVision81Settings;
            this.hdr10Settings = builder.hdr10Settings;
            this.rec601Settings = builder.rec601Settings;
            this.rec709Settings = builder.rec709Settings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsColorSpacePassthroughSettings getColorSpacePassthroughSettings() {
            return this.colorSpacePassthroughSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsDolbyVision81Settings getDolbyVision81Settings() {
            return this.dolbyVision81Settings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings getHdr10Settings() {
            return this.hdr10Settings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec601Settings getRec601Settings() {
            return this.rec601Settings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsRec709Settings getRec709Settings() {
            return this.rec709Settings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getColorSpacePassthroughSettings() != null) {
                data.set("colorSpacePassthroughSettings", om.valueToTree(this.getColorSpacePassthroughSettings()));
            }
            if (this.getDolbyVision81Settings() != null) {
                data.set("dolbyVision81Settings", om.valueToTree(this.getDolbyVision81Settings()));
            }
            if (this.getHdr10Settings() != null) {
                data.set("hdr10Settings", om.valueToTree(this.getHdr10Settings()));
            }
            if (this.getRec601Settings() != null) {
                data.set("rec601Settings", om.valueToTree(this.getRec601Settings()));
            }
            if (this.getRec709Settings() != null) {
                data.set("rec709Settings", om.valueToTree(this.getRec709Settings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings.Jsii$Proxy) o;

            if (this.colorSpacePassthroughSettings != null ? !this.colorSpacePassthroughSettings.equals(that.colorSpacePassthroughSettings) : that.colorSpacePassthroughSettings != null) return false;
            if (this.dolbyVision81Settings != null ? !this.dolbyVision81Settings.equals(that.dolbyVision81Settings) : that.dolbyVision81Settings != null) return false;
            if (this.hdr10Settings != null ? !this.hdr10Settings.equals(that.hdr10Settings) : that.hdr10Settings != null) return false;
            if (this.rec601Settings != null ? !this.rec601Settings.equals(that.rec601Settings) : that.rec601Settings != null) return false;
            return this.rec709Settings != null ? this.rec709Settings.equals(that.rec709Settings) : that.rec709Settings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.colorSpacePassthroughSettings != null ? this.colorSpacePassthroughSettings.hashCode() : 0;
            result = 31 * result + (this.dolbyVision81Settings != null ? this.dolbyVision81Settings.hashCode() : 0);
            result = 31 * result + (this.hdr10Settings != null ? this.hdr10Settings.hashCode() : 0);
            result = 31 * result + (this.rec601Settings != null ? this.rec601Settings.hashCode() : 0);
            result = 31 * result + (this.rec709Settings != null ? this.rec709Settings.hashCode() : 0);
            return result;
        }
    }
}
