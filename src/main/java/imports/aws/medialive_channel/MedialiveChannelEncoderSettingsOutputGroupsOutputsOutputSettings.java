package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.876Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * archive_output_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#archive_output_settings MedialiveChannel#archive_output_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings getArchiveOutputSettings() {
        return null;
    }

    /**
     * frame_capture_output_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#frame_capture_output_settings MedialiveChannel#frame_capture_output_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsFrameCaptureOutputSettings getFrameCaptureOutputSettings() {
        return null;
    }

    /**
     * hls_output_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#hls_output_settings MedialiveChannel#hls_output_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings getHlsOutputSettings() {
        return null;
    }

    /**
     * media_package_output_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#media_package_output_settings MedialiveChannel#media_package_output_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMediaPackageOutputSettings getMediaPackageOutputSettings() {
        return null;
    }

    /**
     * ms_smooth_output_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#ms_smooth_output_settings MedialiveChannel#ms_smooth_output_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings getMsSmoothOutputSettings() {
        return null;
    }

    /**
     * multiplex_output_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#multiplex_output_settings MedialiveChannel#multiplex_output_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettings getMultiplexOutputSettings() {
        return null;
    }

    /**
     * rtmp_output_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#rtmp_output_settings MedialiveChannel#rtmp_output_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings getRtmpOutputSettings() {
        return null;
    }

    /**
     * udp_output_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#udp_output_settings MedialiveChannel#udp_output_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettings getUdpOutputSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings> {
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings archiveOutputSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsFrameCaptureOutputSettings frameCaptureOutputSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings hlsOutputSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMediaPackageOutputSettings mediaPackageOutputSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings msSmoothOutputSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettings multiplexOutputSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings rtmpOutputSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettings udpOutputSettings;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings#getArchiveOutputSettings}
         * @param archiveOutputSettings archive_output_settings block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#archive_output_settings MedialiveChannel#archive_output_settings}
         * @return {@code this}
         */
        public Builder archiveOutputSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings archiveOutputSettings) {
            this.archiveOutputSettings = archiveOutputSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings#getFrameCaptureOutputSettings}
         * @param frameCaptureOutputSettings frame_capture_output_settings block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#frame_capture_output_settings MedialiveChannel#frame_capture_output_settings}
         * @return {@code this}
         */
        public Builder frameCaptureOutputSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsFrameCaptureOutputSettings frameCaptureOutputSettings) {
            this.frameCaptureOutputSettings = frameCaptureOutputSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings#getHlsOutputSettings}
         * @param hlsOutputSettings hls_output_settings block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#hls_output_settings MedialiveChannel#hls_output_settings}
         * @return {@code this}
         */
        public Builder hlsOutputSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings hlsOutputSettings) {
            this.hlsOutputSettings = hlsOutputSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings#getMediaPackageOutputSettings}
         * @param mediaPackageOutputSettings media_package_output_settings block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#media_package_output_settings MedialiveChannel#media_package_output_settings}
         * @return {@code this}
         */
        public Builder mediaPackageOutputSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMediaPackageOutputSettings mediaPackageOutputSettings) {
            this.mediaPackageOutputSettings = mediaPackageOutputSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings#getMsSmoothOutputSettings}
         * @param msSmoothOutputSettings ms_smooth_output_settings block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#ms_smooth_output_settings MedialiveChannel#ms_smooth_output_settings}
         * @return {@code this}
         */
        public Builder msSmoothOutputSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings msSmoothOutputSettings) {
            this.msSmoothOutputSettings = msSmoothOutputSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings#getMultiplexOutputSettings}
         * @param multiplexOutputSettings multiplex_output_settings block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#multiplex_output_settings MedialiveChannel#multiplex_output_settings}
         * @return {@code this}
         */
        public Builder multiplexOutputSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettings multiplexOutputSettings) {
            this.multiplexOutputSettings = multiplexOutputSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings#getRtmpOutputSettings}
         * @param rtmpOutputSettings rtmp_output_settings block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#rtmp_output_settings MedialiveChannel#rtmp_output_settings}
         * @return {@code this}
         */
        public Builder rtmpOutputSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings rtmpOutputSettings) {
            this.rtmpOutputSettings = rtmpOutputSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings#getUdpOutputSettings}
         * @param udpOutputSettings udp_output_settings block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#udp_output_settings MedialiveChannel#udp_output_settings}
         * @return {@code this}
         */
        public Builder udpOutputSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettings udpOutputSettings) {
            this.udpOutputSettings = udpOutputSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings {
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings archiveOutputSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsFrameCaptureOutputSettings frameCaptureOutputSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings hlsOutputSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMediaPackageOutputSettings mediaPackageOutputSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings msSmoothOutputSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettings multiplexOutputSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings rtmpOutputSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettings udpOutputSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.archiveOutputSettings = software.amazon.jsii.Kernel.get(this, "archiveOutputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings.class));
            this.frameCaptureOutputSettings = software.amazon.jsii.Kernel.get(this, "frameCaptureOutputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsFrameCaptureOutputSettings.class));
            this.hlsOutputSettings = software.amazon.jsii.Kernel.get(this, "hlsOutputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings.class));
            this.mediaPackageOutputSettings = software.amazon.jsii.Kernel.get(this, "mediaPackageOutputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMediaPackageOutputSettings.class));
            this.msSmoothOutputSettings = software.amazon.jsii.Kernel.get(this, "msSmoothOutputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings.class));
            this.multiplexOutputSettings = software.amazon.jsii.Kernel.get(this, "multiplexOutputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettings.class));
            this.rtmpOutputSettings = software.amazon.jsii.Kernel.get(this, "rtmpOutputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings.class));
            this.udpOutputSettings = software.amazon.jsii.Kernel.get(this, "udpOutputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.archiveOutputSettings = builder.archiveOutputSettings;
            this.frameCaptureOutputSettings = builder.frameCaptureOutputSettings;
            this.hlsOutputSettings = builder.hlsOutputSettings;
            this.mediaPackageOutputSettings = builder.mediaPackageOutputSettings;
            this.msSmoothOutputSettings = builder.msSmoothOutputSettings;
            this.multiplexOutputSettings = builder.multiplexOutputSettings;
            this.rtmpOutputSettings = builder.rtmpOutputSettings;
            this.udpOutputSettings = builder.udpOutputSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettings getArchiveOutputSettings() {
            return this.archiveOutputSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsFrameCaptureOutputSettings getFrameCaptureOutputSettings() {
            return this.frameCaptureOutputSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings getHlsOutputSettings() {
            return this.hlsOutputSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMediaPackageOutputSettings getMediaPackageOutputSettings() {
            return this.mediaPackageOutputSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings getMsSmoothOutputSettings() {
            return this.msSmoothOutputSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettings getMultiplexOutputSettings() {
            return this.multiplexOutputSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings getRtmpOutputSettings() {
            return this.rtmpOutputSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettings getUdpOutputSettings() {
            return this.udpOutputSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getArchiveOutputSettings() != null) {
                data.set("archiveOutputSettings", om.valueToTree(this.getArchiveOutputSettings()));
            }
            if (this.getFrameCaptureOutputSettings() != null) {
                data.set("frameCaptureOutputSettings", om.valueToTree(this.getFrameCaptureOutputSettings()));
            }
            if (this.getHlsOutputSettings() != null) {
                data.set("hlsOutputSettings", om.valueToTree(this.getHlsOutputSettings()));
            }
            if (this.getMediaPackageOutputSettings() != null) {
                data.set("mediaPackageOutputSettings", om.valueToTree(this.getMediaPackageOutputSettings()));
            }
            if (this.getMsSmoothOutputSettings() != null) {
                data.set("msSmoothOutputSettings", om.valueToTree(this.getMsSmoothOutputSettings()));
            }
            if (this.getMultiplexOutputSettings() != null) {
                data.set("multiplexOutputSettings", om.valueToTree(this.getMultiplexOutputSettings()));
            }
            if (this.getRtmpOutputSettings() != null) {
                data.set("rtmpOutputSettings", om.valueToTree(this.getRtmpOutputSettings()));
            }
            if (this.getUdpOutputSettings() != null) {
                data.set("udpOutputSettings", om.valueToTree(this.getUdpOutputSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettings.Jsii$Proxy) o;

            if (this.archiveOutputSettings != null ? !this.archiveOutputSettings.equals(that.archiveOutputSettings) : that.archiveOutputSettings != null) return false;
            if (this.frameCaptureOutputSettings != null ? !this.frameCaptureOutputSettings.equals(that.frameCaptureOutputSettings) : that.frameCaptureOutputSettings != null) return false;
            if (this.hlsOutputSettings != null ? !this.hlsOutputSettings.equals(that.hlsOutputSettings) : that.hlsOutputSettings != null) return false;
            if (this.mediaPackageOutputSettings != null ? !this.mediaPackageOutputSettings.equals(that.mediaPackageOutputSettings) : that.mediaPackageOutputSettings != null) return false;
            if (this.msSmoothOutputSettings != null ? !this.msSmoothOutputSettings.equals(that.msSmoothOutputSettings) : that.msSmoothOutputSettings != null) return false;
            if (this.multiplexOutputSettings != null ? !this.multiplexOutputSettings.equals(that.multiplexOutputSettings) : that.multiplexOutputSettings != null) return false;
            if (this.rtmpOutputSettings != null ? !this.rtmpOutputSettings.equals(that.rtmpOutputSettings) : that.rtmpOutputSettings != null) return false;
            return this.udpOutputSettings != null ? this.udpOutputSettings.equals(that.udpOutputSettings) : that.udpOutputSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.archiveOutputSettings != null ? this.archiveOutputSettings.hashCode() : 0;
            result = 31 * result + (this.frameCaptureOutputSettings != null ? this.frameCaptureOutputSettings.hashCode() : 0);
            result = 31 * result + (this.hlsOutputSettings != null ? this.hlsOutputSettings.hashCode() : 0);
            result = 31 * result + (this.mediaPackageOutputSettings != null ? this.mediaPackageOutputSettings.hashCode() : 0);
            result = 31 * result + (this.msSmoothOutputSettings != null ? this.msSmoothOutputSettings.hashCode() : 0);
            result = 31 * result + (this.multiplexOutputSettings != null ? this.multiplexOutputSettings.hashCode() : 0);
            result = 31 * result + (this.rtmpOutputSettings != null ? this.rtmpOutputSettings.hashCode() : 0);
            result = 31 * result + (this.udpOutputSettings != null ? this.udpOutputSettings.hashCode() : 0);
            return result;
        }
    }
}
