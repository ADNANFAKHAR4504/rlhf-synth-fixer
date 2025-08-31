package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.864Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * output_groups block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#output_groups MedialiveChannel#output_groups}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getOutputGroups();

    /**
     * timecode_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timecode_config MedialiveChannel#timecode_config}
     */
    @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsTimecodeConfig getTimecodeConfig();

    /**
     * audio_descriptions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_descriptions MedialiveChannel#audio_descriptions}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAudioDescriptions() {
        return null;
    }

    /**
     * avail_blanking block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#avail_blanking MedialiveChannel#avail_blanking}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAvailBlanking getAvailBlanking() {
        return null;
    }

    /**
     * caption_descriptions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#caption_descriptions MedialiveChannel#caption_descriptions}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCaptionDescriptions() {
        return null;
    }

    /**
     * global_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#global_configuration MedialiveChannel#global_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfiguration getGlobalConfiguration() {
        return null;
    }

    /**
     * motion_graphics_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#motion_graphics_configuration MedialiveChannel#motion_graphics_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfiguration getMotionGraphicsConfiguration() {
        return null;
    }

    /**
     * nielsen_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#nielsen_configuration MedialiveChannel#nielsen_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsNielsenConfiguration getNielsenConfiguration() {
        return null;
    }

    /**
     * video_descriptions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#video_descriptions MedialiveChannel#video_descriptions}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVideoDescriptions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettings> {
        java.lang.Object outputGroups;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsTimecodeConfig timecodeConfig;
        java.lang.Object audioDescriptions;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAvailBlanking availBlanking;
        java.lang.Object captionDescriptions;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfiguration globalConfiguration;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfiguration motionGraphicsConfiguration;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsNielsenConfiguration nielsenConfiguration;
        java.lang.Object videoDescriptions;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettings#getOutputGroups}
         * @param outputGroups output_groups block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#output_groups MedialiveChannel#output_groups}
         * @return {@code this}
         */
        public Builder outputGroups(com.hashicorp.cdktf.IResolvable outputGroups) {
            this.outputGroups = outputGroups;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettings#getOutputGroups}
         * @param outputGroups output_groups block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#output_groups MedialiveChannel#output_groups}
         * @return {@code this}
         */
        public Builder outputGroups(java.util.List<? extends imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroups> outputGroups) {
            this.outputGroups = outputGroups;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettings#getTimecodeConfig}
         * @param timecodeConfig timecode_config block. This parameter is required.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timecode_config MedialiveChannel#timecode_config}
         * @return {@code this}
         */
        public Builder timecodeConfig(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsTimecodeConfig timecodeConfig) {
            this.timecodeConfig = timecodeConfig;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettings#getAudioDescriptions}
         * @param audioDescriptions audio_descriptions block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_descriptions MedialiveChannel#audio_descriptions}
         * @return {@code this}
         */
        public Builder audioDescriptions(com.hashicorp.cdktf.IResolvable audioDescriptions) {
            this.audioDescriptions = audioDescriptions;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettings#getAudioDescriptions}
         * @param audioDescriptions audio_descriptions block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_descriptions MedialiveChannel#audio_descriptions}
         * @return {@code this}
         */
        public Builder audioDescriptions(java.util.List<? extends imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptions> audioDescriptions) {
            this.audioDescriptions = audioDescriptions;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettings#getAvailBlanking}
         * @param availBlanking avail_blanking block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#avail_blanking MedialiveChannel#avail_blanking}
         * @return {@code this}
         */
        public Builder availBlanking(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAvailBlanking availBlanking) {
            this.availBlanking = availBlanking;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettings#getCaptionDescriptions}
         * @param captionDescriptions caption_descriptions block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#caption_descriptions MedialiveChannel#caption_descriptions}
         * @return {@code this}
         */
        public Builder captionDescriptions(com.hashicorp.cdktf.IResolvable captionDescriptions) {
            this.captionDescriptions = captionDescriptions;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettings#getCaptionDescriptions}
         * @param captionDescriptions caption_descriptions block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#caption_descriptions MedialiveChannel#caption_descriptions}
         * @return {@code this}
         */
        public Builder captionDescriptions(java.util.List<? extends imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptions> captionDescriptions) {
            this.captionDescriptions = captionDescriptions;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettings#getGlobalConfiguration}
         * @param globalConfiguration global_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#global_configuration MedialiveChannel#global_configuration}
         * @return {@code this}
         */
        public Builder globalConfiguration(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfiguration globalConfiguration) {
            this.globalConfiguration = globalConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettings#getMotionGraphicsConfiguration}
         * @param motionGraphicsConfiguration motion_graphics_configuration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#motion_graphics_configuration MedialiveChannel#motion_graphics_configuration}
         * @return {@code this}
         */
        public Builder motionGraphicsConfiguration(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfiguration motionGraphicsConfiguration) {
            this.motionGraphicsConfiguration = motionGraphicsConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettings#getNielsenConfiguration}
         * @param nielsenConfiguration nielsen_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#nielsen_configuration MedialiveChannel#nielsen_configuration}
         * @return {@code this}
         */
        public Builder nielsenConfiguration(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsNielsenConfiguration nielsenConfiguration) {
            this.nielsenConfiguration = nielsenConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettings#getVideoDescriptions}
         * @param videoDescriptions video_descriptions block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#video_descriptions MedialiveChannel#video_descriptions}
         * @return {@code this}
         */
        public Builder videoDescriptions(com.hashicorp.cdktf.IResolvable videoDescriptions) {
            this.videoDescriptions = videoDescriptions;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettings#getVideoDescriptions}
         * @param videoDescriptions video_descriptions block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#video_descriptions MedialiveChannel#video_descriptions}
         * @return {@code this}
         */
        public Builder videoDescriptions(java.util.List<? extends imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptions> videoDescriptions) {
            this.videoDescriptions = videoDescriptions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettings {
        private final java.lang.Object outputGroups;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsTimecodeConfig timecodeConfig;
        private final java.lang.Object audioDescriptions;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAvailBlanking availBlanking;
        private final java.lang.Object captionDescriptions;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfiguration globalConfiguration;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfiguration motionGraphicsConfiguration;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsNielsenConfiguration nielsenConfiguration;
        private final java.lang.Object videoDescriptions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.outputGroups = software.amazon.jsii.Kernel.get(this, "outputGroups", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timecodeConfig = software.amazon.jsii.Kernel.get(this, "timecodeConfig", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsTimecodeConfig.class));
            this.audioDescriptions = software.amazon.jsii.Kernel.get(this, "audioDescriptions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.availBlanking = software.amazon.jsii.Kernel.get(this, "availBlanking", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAvailBlanking.class));
            this.captionDescriptions = software.amazon.jsii.Kernel.get(this, "captionDescriptions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.globalConfiguration = software.amazon.jsii.Kernel.get(this, "globalConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfiguration.class));
            this.motionGraphicsConfiguration = software.amazon.jsii.Kernel.get(this, "motionGraphicsConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfiguration.class));
            this.nielsenConfiguration = software.amazon.jsii.Kernel.get(this, "nielsenConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsNielsenConfiguration.class));
            this.videoDescriptions = software.amazon.jsii.Kernel.get(this, "videoDescriptions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.outputGroups = java.util.Objects.requireNonNull(builder.outputGroups, "outputGroups is required");
            this.timecodeConfig = java.util.Objects.requireNonNull(builder.timecodeConfig, "timecodeConfig is required");
            this.audioDescriptions = builder.audioDescriptions;
            this.availBlanking = builder.availBlanking;
            this.captionDescriptions = builder.captionDescriptions;
            this.globalConfiguration = builder.globalConfiguration;
            this.motionGraphicsConfiguration = builder.motionGraphicsConfiguration;
            this.nielsenConfiguration = builder.nielsenConfiguration;
            this.videoDescriptions = builder.videoDescriptions;
        }

        @Override
        public final java.lang.Object getOutputGroups() {
            return this.outputGroups;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsTimecodeConfig getTimecodeConfig() {
            return this.timecodeConfig;
        }

        @Override
        public final java.lang.Object getAudioDescriptions() {
            return this.audioDescriptions;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAvailBlanking getAvailBlanking() {
            return this.availBlanking;
        }

        @Override
        public final java.lang.Object getCaptionDescriptions() {
            return this.captionDescriptions;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfiguration getGlobalConfiguration() {
            return this.globalConfiguration;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfiguration getMotionGraphicsConfiguration() {
            return this.motionGraphicsConfiguration;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsNielsenConfiguration getNielsenConfiguration() {
            return this.nielsenConfiguration;
        }

        @Override
        public final java.lang.Object getVideoDescriptions() {
            return this.videoDescriptions;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("outputGroups", om.valueToTree(this.getOutputGroups()));
            data.set("timecodeConfig", om.valueToTree(this.getTimecodeConfig()));
            if (this.getAudioDescriptions() != null) {
                data.set("audioDescriptions", om.valueToTree(this.getAudioDescriptions()));
            }
            if (this.getAvailBlanking() != null) {
                data.set("availBlanking", om.valueToTree(this.getAvailBlanking()));
            }
            if (this.getCaptionDescriptions() != null) {
                data.set("captionDescriptions", om.valueToTree(this.getCaptionDescriptions()));
            }
            if (this.getGlobalConfiguration() != null) {
                data.set("globalConfiguration", om.valueToTree(this.getGlobalConfiguration()));
            }
            if (this.getMotionGraphicsConfiguration() != null) {
                data.set("motionGraphicsConfiguration", om.valueToTree(this.getMotionGraphicsConfiguration()));
            }
            if (this.getNielsenConfiguration() != null) {
                data.set("nielsenConfiguration", om.valueToTree(this.getNielsenConfiguration()));
            }
            if (this.getVideoDescriptions() != null) {
                data.set("videoDescriptions", om.valueToTree(this.getVideoDescriptions()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettings.Jsii$Proxy) o;

            if (!outputGroups.equals(that.outputGroups)) return false;
            if (!timecodeConfig.equals(that.timecodeConfig)) return false;
            if (this.audioDescriptions != null ? !this.audioDescriptions.equals(that.audioDescriptions) : that.audioDescriptions != null) return false;
            if (this.availBlanking != null ? !this.availBlanking.equals(that.availBlanking) : that.availBlanking != null) return false;
            if (this.captionDescriptions != null ? !this.captionDescriptions.equals(that.captionDescriptions) : that.captionDescriptions != null) return false;
            if (this.globalConfiguration != null ? !this.globalConfiguration.equals(that.globalConfiguration) : that.globalConfiguration != null) return false;
            if (this.motionGraphicsConfiguration != null ? !this.motionGraphicsConfiguration.equals(that.motionGraphicsConfiguration) : that.motionGraphicsConfiguration != null) return false;
            if (this.nielsenConfiguration != null ? !this.nielsenConfiguration.equals(that.nielsenConfiguration) : that.nielsenConfiguration != null) return false;
            return this.videoDescriptions != null ? this.videoDescriptions.equals(that.videoDescriptions) : that.videoDescriptions == null;
        }

        @Override
        public final int hashCode() {
            int result = this.outputGroups.hashCode();
            result = 31 * result + (this.timecodeConfig.hashCode());
            result = 31 * result + (this.audioDescriptions != null ? this.audioDescriptions.hashCode() : 0);
            result = 31 * result + (this.availBlanking != null ? this.availBlanking.hashCode() : 0);
            result = 31 * result + (this.captionDescriptions != null ? this.captionDescriptions.hashCode() : 0);
            result = 31 * result + (this.globalConfiguration != null ? this.globalConfiguration.hashCode() : 0);
            result = 31 * result + (this.motionGraphicsConfiguration != null ? this.motionGraphicsConfiguration.hashCode() : 0);
            result = 31 * result + (this.nielsenConfiguration != null ? this.nielsenConfiguration.hashCode() : 0);
            result = 31 * result + (this.videoDescriptions != null ? this.videoDescriptions.hashCode() : 0);
            return result;
        }
    }
}
