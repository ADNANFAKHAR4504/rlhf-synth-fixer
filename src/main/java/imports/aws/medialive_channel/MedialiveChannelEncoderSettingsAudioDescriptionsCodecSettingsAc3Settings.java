package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.865Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#bitrate MedialiveChannel#bitrate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBitrate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#bitstream_mode MedialiveChannel#bitstream_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBitstreamMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#coding_mode MedialiveChannel#coding_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCodingMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#dialnorm MedialiveChannel#dialnorm}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDialnorm() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#drc_profile MedialiveChannel#drc_profile}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDrcProfile() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#lfe_filter MedialiveChannel#lfe_filter}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLfeFilter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#metadata_control MedialiveChannel#metadata_control}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMetadataControl() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings> {
        java.lang.Number bitrate;
        java.lang.String bitstreamMode;
        java.lang.String codingMode;
        java.lang.Number dialnorm;
        java.lang.String drcProfile;
        java.lang.String lfeFilter;
        java.lang.String metadataControl;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings#getBitrate}
         * @param bitrate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#bitrate MedialiveChannel#bitrate}.
         * @return {@code this}
         */
        public Builder bitrate(java.lang.Number bitrate) {
            this.bitrate = bitrate;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings#getBitstreamMode}
         * @param bitstreamMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#bitstream_mode MedialiveChannel#bitstream_mode}.
         * @return {@code this}
         */
        public Builder bitstreamMode(java.lang.String bitstreamMode) {
            this.bitstreamMode = bitstreamMode;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings#getCodingMode}
         * @param codingMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#coding_mode MedialiveChannel#coding_mode}.
         * @return {@code this}
         */
        public Builder codingMode(java.lang.String codingMode) {
            this.codingMode = codingMode;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings#getDialnorm}
         * @param dialnorm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#dialnorm MedialiveChannel#dialnorm}.
         * @return {@code this}
         */
        public Builder dialnorm(java.lang.Number dialnorm) {
            this.dialnorm = dialnorm;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings#getDrcProfile}
         * @param drcProfile Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#drc_profile MedialiveChannel#drc_profile}.
         * @return {@code this}
         */
        public Builder drcProfile(java.lang.String drcProfile) {
            this.drcProfile = drcProfile;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings#getLfeFilter}
         * @param lfeFilter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#lfe_filter MedialiveChannel#lfe_filter}.
         * @return {@code this}
         */
        public Builder lfeFilter(java.lang.String lfeFilter) {
            this.lfeFilter = lfeFilter;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings#getMetadataControl}
         * @param metadataControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#metadata_control MedialiveChannel#metadata_control}.
         * @return {@code this}
         */
        public Builder metadataControl(java.lang.String metadataControl) {
            this.metadataControl = metadataControl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings {
        private final java.lang.Number bitrate;
        private final java.lang.String bitstreamMode;
        private final java.lang.String codingMode;
        private final java.lang.Number dialnorm;
        private final java.lang.String drcProfile;
        private final java.lang.String lfeFilter;
        private final java.lang.String metadataControl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bitrate = software.amazon.jsii.Kernel.get(this, "bitrate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.bitstreamMode = software.amazon.jsii.Kernel.get(this, "bitstreamMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.codingMode = software.amazon.jsii.Kernel.get(this, "codingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dialnorm = software.amazon.jsii.Kernel.get(this, "dialnorm", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.drcProfile = software.amazon.jsii.Kernel.get(this, "drcProfile", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lfeFilter = software.amazon.jsii.Kernel.get(this, "lfeFilter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.metadataControl = software.amazon.jsii.Kernel.get(this, "metadataControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bitrate = builder.bitrate;
            this.bitstreamMode = builder.bitstreamMode;
            this.codingMode = builder.codingMode;
            this.dialnorm = builder.dialnorm;
            this.drcProfile = builder.drcProfile;
            this.lfeFilter = builder.lfeFilter;
            this.metadataControl = builder.metadataControl;
        }

        @Override
        public final java.lang.Number getBitrate() {
            return this.bitrate;
        }

        @Override
        public final java.lang.String getBitstreamMode() {
            return this.bitstreamMode;
        }

        @Override
        public final java.lang.String getCodingMode() {
            return this.codingMode;
        }

        @Override
        public final java.lang.Number getDialnorm() {
            return this.dialnorm;
        }

        @Override
        public final java.lang.String getDrcProfile() {
            return this.drcProfile;
        }

        @Override
        public final java.lang.String getLfeFilter() {
            return this.lfeFilter;
        }

        @Override
        public final java.lang.String getMetadataControl() {
            return this.metadataControl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBitrate() != null) {
                data.set("bitrate", om.valueToTree(this.getBitrate()));
            }
            if (this.getBitstreamMode() != null) {
                data.set("bitstreamMode", om.valueToTree(this.getBitstreamMode()));
            }
            if (this.getCodingMode() != null) {
                data.set("codingMode", om.valueToTree(this.getCodingMode()));
            }
            if (this.getDialnorm() != null) {
                data.set("dialnorm", om.valueToTree(this.getDialnorm()));
            }
            if (this.getDrcProfile() != null) {
                data.set("drcProfile", om.valueToTree(this.getDrcProfile()));
            }
            if (this.getLfeFilter() != null) {
                data.set("lfeFilter", om.valueToTree(this.getLfeFilter()));
            }
            if (this.getMetadataControl() != null) {
                data.set("metadataControl", om.valueToTree(this.getMetadataControl()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings.Jsii$Proxy) o;

            if (this.bitrate != null ? !this.bitrate.equals(that.bitrate) : that.bitrate != null) return false;
            if (this.bitstreamMode != null ? !this.bitstreamMode.equals(that.bitstreamMode) : that.bitstreamMode != null) return false;
            if (this.codingMode != null ? !this.codingMode.equals(that.codingMode) : that.codingMode != null) return false;
            if (this.dialnorm != null ? !this.dialnorm.equals(that.dialnorm) : that.dialnorm != null) return false;
            if (this.drcProfile != null ? !this.drcProfile.equals(that.drcProfile) : that.drcProfile != null) return false;
            if (this.lfeFilter != null ? !this.lfeFilter.equals(that.lfeFilter) : that.lfeFilter != null) return false;
            return this.metadataControl != null ? this.metadataControl.equals(that.metadataControl) : that.metadataControl == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bitrate != null ? this.bitrate.hashCode() : 0;
            result = 31 * result + (this.bitstreamMode != null ? this.bitstreamMode.hashCode() : 0);
            result = 31 * result + (this.codingMode != null ? this.codingMode.hashCode() : 0);
            result = 31 * result + (this.dialnorm != null ? this.dialnorm.hashCode() : 0);
            result = 31 * result + (this.drcProfile != null ? this.drcProfile.hashCode() : 0);
            result = 31 * result + (this.lfeFilter != null ? this.lfeFilter.hashCode() : 0);
            result = 31 * result + (this.metadataControl != null ? this.metadataControl.hashCode() : 0);
            return result;
        }
    }
}
