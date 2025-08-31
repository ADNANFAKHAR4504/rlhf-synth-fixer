package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.869Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * archive_group_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#archive_group_settings MedialiveChannel#archive_group_settings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getArchiveGroupSettings() {
        return null;
    }

    /**
     * frame_capture_group_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#frame_capture_group_settings MedialiveChannel#frame_capture_group_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettings getFrameCaptureGroupSettings() {
        return null;
    }

    /**
     * hls_group_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#hls_group_settings MedialiveChannel#hls_group_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettings getHlsGroupSettings() {
        return null;
    }

    /**
     * media_package_group_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#media_package_group_settings MedialiveChannel#media_package_group_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMediaPackageGroupSettings getMediaPackageGroupSettings() {
        return null;
    }

    /**
     * ms_smooth_group_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#ms_smooth_group_settings MedialiveChannel#ms_smooth_group_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMsSmoothGroupSettings getMsSmoothGroupSettings() {
        return null;
    }

    /**
     * multiplex_group_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#multiplex_group_settings MedialiveChannel#multiplex_group_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMultiplexGroupSettings getMultiplexGroupSettings() {
        return null;
    }

    /**
     * rtmp_group_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#rtmp_group_settings MedialiveChannel#rtmp_group_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings getRtmpGroupSettings() {
        return null;
    }

    /**
     * udp_group_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#udp_group_settings MedialiveChannel#udp_group_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings getUdpGroupSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings> {
        java.lang.Object archiveGroupSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettings frameCaptureGroupSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettings hlsGroupSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMediaPackageGroupSettings mediaPackageGroupSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMsSmoothGroupSettings msSmoothGroupSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMultiplexGroupSettings multiplexGroupSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings rtmpGroupSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings udpGroupSettings;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings#getArchiveGroupSettings}
         * @param archiveGroupSettings archive_group_settings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#archive_group_settings MedialiveChannel#archive_group_settings}
         * @return {@code this}
         */
        public Builder archiveGroupSettings(com.hashicorp.cdktf.IResolvable archiveGroupSettings) {
            this.archiveGroupSettings = archiveGroupSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings#getArchiveGroupSettings}
         * @param archiveGroupSettings archive_group_settings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#archive_group_settings MedialiveChannel#archive_group_settings}
         * @return {@code this}
         */
        public Builder archiveGroupSettings(java.util.List<? extends imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettings> archiveGroupSettings) {
            this.archiveGroupSettings = archiveGroupSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings#getFrameCaptureGroupSettings}
         * @param frameCaptureGroupSettings frame_capture_group_settings block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#frame_capture_group_settings MedialiveChannel#frame_capture_group_settings}
         * @return {@code this}
         */
        public Builder frameCaptureGroupSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettings frameCaptureGroupSettings) {
            this.frameCaptureGroupSettings = frameCaptureGroupSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings#getHlsGroupSettings}
         * @param hlsGroupSettings hls_group_settings block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#hls_group_settings MedialiveChannel#hls_group_settings}
         * @return {@code this}
         */
        public Builder hlsGroupSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettings hlsGroupSettings) {
            this.hlsGroupSettings = hlsGroupSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings#getMediaPackageGroupSettings}
         * @param mediaPackageGroupSettings media_package_group_settings block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#media_package_group_settings MedialiveChannel#media_package_group_settings}
         * @return {@code this}
         */
        public Builder mediaPackageGroupSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMediaPackageGroupSettings mediaPackageGroupSettings) {
            this.mediaPackageGroupSettings = mediaPackageGroupSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings#getMsSmoothGroupSettings}
         * @param msSmoothGroupSettings ms_smooth_group_settings block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#ms_smooth_group_settings MedialiveChannel#ms_smooth_group_settings}
         * @return {@code this}
         */
        public Builder msSmoothGroupSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMsSmoothGroupSettings msSmoothGroupSettings) {
            this.msSmoothGroupSettings = msSmoothGroupSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings#getMultiplexGroupSettings}
         * @param multiplexGroupSettings multiplex_group_settings block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#multiplex_group_settings MedialiveChannel#multiplex_group_settings}
         * @return {@code this}
         */
        public Builder multiplexGroupSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMultiplexGroupSettings multiplexGroupSettings) {
            this.multiplexGroupSettings = multiplexGroupSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings#getRtmpGroupSettings}
         * @param rtmpGroupSettings rtmp_group_settings block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#rtmp_group_settings MedialiveChannel#rtmp_group_settings}
         * @return {@code this}
         */
        public Builder rtmpGroupSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings rtmpGroupSettings) {
            this.rtmpGroupSettings = rtmpGroupSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings#getUdpGroupSettings}
         * @param udpGroupSettings udp_group_settings block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#udp_group_settings MedialiveChannel#udp_group_settings}
         * @return {@code this}
         */
        public Builder udpGroupSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings udpGroupSettings) {
            this.udpGroupSettings = udpGroupSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings {
        private final java.lang.Object archiveGroupSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettings frameCaptureGroupSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettings hlsGroupSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMediaPackageGroupSettings mediaPackageGroupSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMsSmoothGroupSettings msSmoothGroupSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMultiplexGroupSettings multiplexGroupSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings rtmpGroupSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings udpGroupSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.archiveGroupSettings = software.amazon.jsii.Kernel.get(this, "archiveGroupSettings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.frameCaptureGroupSettings = software.amazon.jsii.Kernel.get(this, "frameCaptureGroupSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettings.class));
            this.hlsGroupSettings = software.amazon.jsii.Kernel.get(this, "hlsGroupSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettings.class));
            this.mediaPackageGroupSettings = software.amazon.jsii.Kernel.get(this, "mediaPackageGroupSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMediaPackageGroupSettings.class));
            this.msSmoothGroupSettings = software.amazon.jsii.Kernel.get(this, "msSmoothGroupSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMsSmoothGroupSettings.class));
            this.multiplexGroupSettings = software.amazon.jsii.Kernel.get(this, "multiplexGroupSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMultiplexGroupSettings.class));
            this.rtmpGroupSettings = software.amazon.jsii.Kernel.get(this, "rtmpGroupSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings.class));
            this.udpGroupSettings = software.amazon.jsii.Kernel.get(this, "udpGroupSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.archiveGroupSettings = builder.archiveGroupSettings;
            this.frameCaptureGroupSettings = builder.frameCaptureGroupSettings;
            this.hlsGroupSettings = builder.hlsGroupSettings;
            this.mediaPackageGroupSettings = builder.mediaPackageGroupSettings;
            this.msSmoothGroupSettings = builder.msSmoothGroupSettings;
            this.multiplexGroupSettings = builder.multiplexGroupSettings;
            this.rtmpGroupSettings = builder.rtmpGroupSettings;
            this.udpGroupSettings = builder.udpGroupSettings;
        }

        @Override
        public final java.lang.Object getArchiveGroupSettings() {
            return this.archiveGroupSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsFrameCaptureGroupSettings getFrameCaptureGroupSettings() {
            return this.frameCaptureGroupSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettings getHlsGroupSettings() {
            return this.hlsGroupSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMediaPackageGroupSettings getMediaPackageGroupSettings() {
            return this.mediaPackageGroupSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMsSmoothGroupSettings getMsSmoothGroupSettings() {
            return this.msSmoothGroupSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsMultiplexGroupSettings getMultiplexGroupSettings() {
            return this.multiplexGroupSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings getRtmpGroupSettings() {
            return this.rtmpGroupSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings getUdpGroupSettings() {
            return this.udpGroupSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getArchiveGroupSettings() != null) {
                data.set("archiveGroupSettings", om.valueToTree(this.getArchiveGroupSettings()));
            }
            if (this.getFrameCaptureGroupSettings() != null) {
                data.set("frameCaptureGroupSettings", om.valueToTree(this.getFrameCaptureGroupSettings()));
            }
            if (this.getHlsGroupSettings() != null) {
                data.set("hlsGroupSettings", om.valueToTree(this.getHlsGroupSettings()));
            }
            if (this.getMediaPackageGroupSettings() != null) {
                data.set("mediaPackageGroupSettings", om.valueToTree(this.getMediaPackageGroupSettings()));
            }
            if (this.getMsSmoothGroupSettings() != null) {
                data.set("msSmoothGroupSettings", om.valueToTree(this.getMsSmoothGroupSettings()));
            }
            if (this.getMultiplexGroupSettings() != null) {
                data.set("multiplexGroupSettings", om.valueToTree(this.getMultiplexGroupSettings()));
            }
            if (this.getRtmpGroupSettings() != null) {
                data.set("rtmpGroupSettings", om.valueToTree(this.getRtmpGroupSettings()));
            }
            if (this.getUdpGroupSettings() != null) {
                data.set("udpGroupSettings", om.valueToTree(this.getUdpGroupSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings.Jsii$Proxy) o;

            if (this.archiveGroupSettings != null ? !this.archiveGroupSettings.equals(that.archiveGroupSettings) : that.archiveGroupSettings != null) return false;
            if (this.frameCaptureGroupSettings != null ? !this.frameCaptureGroupSettings.equals(that.frameCaptureGroupSettings) : that.frameCaptureGroupSettings != null) return false;
            if (this.hlsGroupSettings != null ? !this.hlsGroupSettings.equals(that.hlsGroupSettings) : that.hlsGroupSettings != null) return false;
            if (this.mediaPackageGroupSettings != null ? !this.mediaPackageGroupSettings.equals(that.mediaPackageGroupSettings) : that.mediaPackageGroupSettings != null) return false;
            if (this.msSmoothGroupSettings != null ? !this.msSmoothGroupSettings.equals(that.msSmoothGroupSettings) : that.msSmoothGroupSettings != null) return false;
            if (this.multiplexGroupSettings != null ? !this.multiplexGroupSettings.equals(that.multiplexGroupSettings) : that.multiplexGroupSettings != null) return false;
            if (this.rtmpGroupSettings != null ? !this.rtmpGroupSettings.equals(that.rtmpGroupSettings) : that.rtmpGroupSettings != null) return false;
            return this.udpGroupSettings != null ? this.udpGroupSettings.equals(that.udpGroupSettings) : that.udpGroupSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.archiveGroupSettings != null ? this.archiveGroupSettings.hashCode() : 0;
            result = 31 * result + (this.frameCaptureGroupSettings != null ? this.frameCaptureGroupSettings.hashCode() : 0);
            result = 31 * result + (this.hlsGroupSettings != null ? this.hlsGroupSettings.hashCode() : 0);
            result = 31 * result + (this.mediaPackageGroupSettings != null ? this.mediaPackageGroupSettings.hashCode() : 0);
            result = 31 * result + (this.msSmoothGroupSettings != null ? this.msSmoothGroupSettings.hashCode() : 0);
            result = 31 * result + (this.multiplexGroupSettings != null ? this.multiplexGroupSettings.hashCode() : 0);
            result = 31 * result + (this.rtmpGroupSettings != null ? this.rtmpGroupSettings.hashCode() : 0);
            result = 31 * result + (this.udpGroupSettings != null ? this.udpGroupSettings.hashCode() : 0);
            return result;
        }
    }
}
