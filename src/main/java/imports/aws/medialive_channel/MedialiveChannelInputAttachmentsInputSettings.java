package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.885Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputAttachmentsInputSettings.Jsii$Proxy.class)
public interface MedialiveChannelInputAttachmentsInputSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * audio_selector block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_selector MedialiveChannel#audio_selector}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAudioSelector() {
        return null;
    }

    /**
     * caption_selector block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#caption_selector MedialiveChannel#caption_selector}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCaptionSelector() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#deblock_filter MedialiveChannel#deblock_filter}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeblockFilter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#denoise_filter MedialiveChannel#denoise_filter}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDenoiseFilter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#filter_strength MedialiveChannel#filter_strength}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getFilterStrength() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_filter MedialiveChannel#input_filter}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInputFilter() {
        return null;
    }

    /**
     * network_input_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#network_input_settings MedialiveChannel#network_input_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings getNetworkInputSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#scte35_pid MedialiveChannel#scte35_pid}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getScte35Pid() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#smpte2038_data_preference MedialiveChannel#smpte2038_data_preference}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSmpte2038DataPreference() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#source_end_behavior MedialiveChannel#source_end_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceEndBehavior() {
        return null;
    }

    /**
     * video_selector block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#video_selector MedialiveChannel#video_selector}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsVideoSelector getVideoSelector() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputAttachmentsInputSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputAttachmentsInputSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputAttachmentsInputSettings> {
        java.lang.Object audioSelector;
        java.lang.Object captionSelector;
        java.lang.String deblockFilter;
        java.lang.String denoiseFilter;
        java.lang.Number filterStrength;
        java.lang.String inputFilter;
        imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings networkInputSettings;
        java.lang.Number scte35Pid;
        java.lang.String smpte2038DataPreference;
        java.lang.String sourceEndBehavior;
        imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsVideoSelector videoSelector;

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettings#getAudioSelector}
         * @param audioSelector audio_selector block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_selector MedialiveChannel#audio_selector}
         * @return {@code this}
         */
        public Builder audioSelector(com.hashicorp.cdktf.IResolvable audioSelector) {
            this.audioSelector = audioSelector;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettings#getAudioSelector}
         * @param audioSelector audio_selector block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_selector MedialiveChannel#audio_selector}
         * @return {@code this}
         */
        public Builder audioSelector(java.util.List<? extends imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelector> audioSelector) {
            this.audioSelector = audioSelector;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettings#getCaptionSelector}
         * @param captionSelector caption_selector block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#caption_selector MedialiveChannel#caption_selector}
         * @return {@code this}
         */
        public Builder captionSelector(com.hashicorp.cdktf.IResolvable captionSelector) {
            this.captionSelector = captionSelector;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettings#getCaptionSelector}
         * @param captionSelector caption_selector block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#caption_selector MedialiveChannel#caption_selector}
         * @return {@code this}
         */
        public Builder captionSelector(java.util.List<? extends imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelector> captionSelector) {
            this.captionSelector = captionSelector;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettings#getDeblockFilter}
         * @param deblockFilter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#deblock_filter MedialiveChannel#deblock_filter}.
         * @return {@code this}
         */
        public Builder deblockFilter(java.lang.String deblockFilter) {
            this.deblockFilter = deblockFilter;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettings#getDenoiseFilter}
         * @param denoiseFilter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#denoise_filter MedialiveChannel#denoise_filter}.
         * @return {@code this}
         */
        public Builder denoiseFilter(java.lang.String denoiseFilter) {
            this.denoiseFilter = denoiseFilter;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettings#getFilterStrength}
         * @param filterStrength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#filter_strength MedialiveChannel#filter_strength}.
         * @return {@code this}
         */
        public Builder filterStrength(java.lang.Number filterStrength) {
            this.filterStrength = filterStrength;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettings#getInputFilter}
         * @param inputFilter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_filter MedialiveChannel#input_filter}.
         * @return {@code this}
         */
        public Builder inputFilter(java.lang.String inputFilter) {
            this.inputFilter = inputFilter;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettings#getNetworkInputSettings}
         * @param networkInputSettings network_input_settings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#network_input_settings MedialiveChannel#network_input_settings}
         * @return {@code this}
         */
        public Builder networkInputSettings(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings networkInputSettings) {
            this.networkInputSettings = networkInputSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettings#getScte35Pid}
         * @param scte35Pid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#scte35_pid MedialiveChannel#scte35_pid}.
         * @return {@code this}
         */
        public Builder scte35Pid(java.lang.Number scte35Pid) {
            this.scte35Pid = scte35Pid;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettings#getSmpte2038DataPreference}
         * @param smpte2038DataPreference Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#smpte2038_data_preference MedialiveChannel#smpte2038_data_preference}.
         * @return {@code this}
         */
        public Builder smpte2038DataPreference(java.lang.String smpte2038DataPreference) {
            this.smpte2038DataPreference = smpte2038DataPreference;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettings#getSourceEndBehavior}
         * @param sourceEndBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#source_end_behavior MedialiveChannel#source_end_behavior}.
         * @return {@code this}
         */
        public Builder sourceEndBehavior(java.lang.String sourceEndBehavior) {
            this.sourceEndBehavior = sourceEndBehavior;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettings#getVideoSelector}
         * @param videoSelector video_selector block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#video_selector MedialiveChannel#video_selector}
         * @return {@code this}
         */
        public Builder videoSelector(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsVideoSelector videoSelector) {
            this.videoSelector = videoSelector;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputAttachmentsInputSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputAttachmentsInputSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputAttachmentsInputSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputAttachmentsInputSettings {
        private final java.lang.Object audioSelector;
        private final java.lang.Object captionSelector;
        private final java.lang.String deblockFilter;
        private final java.lang.String denoiseFilter;
        private final java.lang.Number filterStrength;
        private final java.lang.String inputFilter;
        private final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings networkInputSettings;
        private final java.lang.Number scte35Pid;
        private final java.lang.String smpte2038DataPreference;
        private final java.lang.String sourceEndBehavior;
        private final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsVideoSelector videoSelector;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.audioSelector = software.amazon.jsii.Kernel.get(this, "audioSelector", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.captionSelector = software.amazon.jsii.Kernel.get(this, "captionSelector", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.deblockFilter = software.amazon.jsii.Kernel.get(this, "deblockFilter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.denoiseFilter = software.amazon.jsii.Kernel.get(this, "denoiseFilter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.filterStrength = software.amazon.jsii.Kernel.get(this, "filterStrength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.inputFilter = software.amazon.jsii.Kernel.get(this, "inputFilter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.networkInputSettings = software.amazon.jsii.Kernel.get(this, "networkInputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings.class));
            this.scte35Pid = software.amazon.jsii.Kernel.get(this, "scte35Pid", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.smpte2038DataPreference = software.amazon.jsii.Kernel.get(this, "smpte2038DataPreference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceEndBehavior = software.amazon.jsii.Kernel.get(this, "sourceEndBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.videoSelector = software.amazon.jsii.Kernel.get(this, "videoSelector", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsVideoSelector.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.audioSelector = builder.audioSelector;
            this.captionSelector = builder.captionSelector;
            this.deblockFilter = builder.deblockFilter;
            this.denoiseFilter = builder.denoiseFilter;
            this.filterStrength = builder.filterStrength;
            this.inputFilter = builder.inputFilter;
            this.networkInputSettings = builder.networkInputSettings;
            this.scte35Pid = builder.scte35Pid;
            this.smpte2038DataPreference = builder.smpte2038DataPreference;
            this.sourceEndBehavior = builder.sourceEndBehavior;
            this.videoSelector = builder.videoSelector;
        }

        @Override
        public final java.lang.Object getAudioSelector() {
            return this.audioSelector;
        }

        @Override
        public final java.lang.Object getCaptionSelector() {
            return this.captionSelector;
        }

        @Override
        public final java.lang.String getDeblockFilter() {
            return this.deblockFilter;
        }

        @Override
        public final java.lang.String getDenoiseFilter() {
            return this.denoiseFilter;
        }

        @Override
        public final java.lang.Number getFilterStrength() {
            return this.filterStrength;
        }

        @Override
        public final java.lang.String getInputFilter() {
            return this.inputFilter;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings getNetworkInputSettings() {
            return this.networkInputSettings;
        }

        @Override
        public final java.lang.Number getScte35Pid() {
            return this.scte35Pid;
        }

        @Override
        public final java.lang.String getSmpte2038DataPreference() {
            return this.smpte2038DataPreference;
        }

        @Override
        public final java.lang.String getSourceEndBehavior() {
            return this.sourceEndBehavior;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsVideoSelector getVideoSelector() {
            return this.videoSelector;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAudioSelector() != null) {
                data.set("audioSelector", om.valueToTree(this.getAudioSelector()));
            }
            if (this.getCaptionSelector() != null) {
                data.set("captionSelector", om.valueToTree(this.getCaptionSelector()));
            }
            if (this.getDeblockFilter() != null) {
                data.set("deblockFilter", om.valueToTree(this.getDeblockFilter()));
            }
            if (this.getDenoiseFilter() != null) {
                data.set("denoiseFilter", om.valueToTree(this.getDenoiseFilter()));
            }
            if (this.getFilterStrength() != null) {
                data.set("filterStrength", om.valueToTree(this.getFilterStrength()));
            }
            if (this.getInputFilter() != null) {
                data.set("inputFilter", om.valueToTree(this.getInputFilter()));
            }
            if (this.getNetworkInputSettings() != null) {
                data.set("networkInputSettings", om.valueToTree(this.getNetworkInputSettings()));
            }
            if (this.getScte35Pid() != null) {
                data.set("scte35Pid", om.valueToTree(this.getScte35Pid()));
            }
            if (this.getSmpte2038DataPreference() != null) {
                data.set("smpte2038DataPreference", om.valueToTree(this.getSmpte2038DataPreference()));
            }
            if (this.getSourceEndBehavior() != null) {
                data.set("sourceEndBehavior", om.valueToTree(this.getSourceEndBehavior()));
            }
            if (this.getVideoSelector() != null) {
                data.set("videoSelector", om.valueToTree(this.getVideoSelector()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputAttachmentsInputSettings.Jsii$Proxy that = (MedialiveChannelInputAttachmentsInputSettings.Jsii$Proxy) o;

            if (this.audioSelector != null ? !this.audioSelector.equals(that.audioSelector) : that.audioSelector != null) return false;
            if (this.captionSelector != null ? !this.captionSelector.equals(that.captionSelector) : that.captionSelector != null) return false;
            if (this.deblockFilter != null ? !this.deblockFilter.equals(that.deblockFilter) : that.deblockFilter != null) return false;
            if (this.denoiseFilter != null ? !this.denoiseFilter.equals(that.denoiseFilter) : that.denoiseFilter != null) return false;
            if (this.filterStrength != null ? !this.filterStrength.equals(that.filterStrength) : that.filterStrength != null) return false;
            if (this.inputFilter != null ? !this.inputFilter.equals(that.inputFilter) : that.inputFilter != null) return false;
            if (this.networkInputSettings != null ? !this.networkInputSettings.equals(that.networkInputSettings) : that.networkInputSettings != null) return false;
            if (this.scte35Pid != null ? !this.scte35Pid.equals(that.scte35Pid) : that.scte35Pid != null) return false;
            if (this.smpte2038DataPreference != null ? !this.smpte2038DataPreference.equals(that.smpte2038DataPreference) : that.smpte2038DataPreference != null) return false;
            if (this.sourceEndBehavior != null ? !this.sourceEndBehavior.equals(that.sourceEndBehavior) : that.sourceEndBehavior != null) return false;
            return this.videoSelector != null ? this.videoSelector.equals(that.videoSelector) : that.videoSelector == null;
        }

        @Override
        public final int hashCode() {
            int result = this.audioSelector != null ? this.audioSelector.hashCode() : 0;
            result = 31 * result + (this.captionSelector != null ? this.captionSelector.hashCode() : 0);
            result = 31 * result + (this.deblockFilter != null ? this.deblockFilter.hashCode() : 0);
            result = 31 * result + (this.denoiseFilter != null ? this.denoiseFilter.hashCode() : 0);
            result = 31 * result + (this.filterStrength != null ? this.filterStrength.hashCode() : 0);
            result = 31 * result + (this.inputFilter != null ? this.inputFilter.hashCode() : 0);
            result = 31 * result + (this.networkInputSettings != null ? this.networkInputSettings.hashCode() : 0);
            result = 31 * result + (this.scte35Pid != null ? this.scte35Pid.hashCode() : 0);
            result = 31 * result + (this.smpte2038DataPreference != null ? this.smpte2038DataPreference.hashCode() : 0);
            result = 31 * result + (this.sourceEndBehavior != null ? this.sourceEndBehavior.hashCode() : 0);
            result = 31 * result + (this.videoSelector != null ? this.videoSelector.hashCode() : 0);
            return result;
        }
    }
}
