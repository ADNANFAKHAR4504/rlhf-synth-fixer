package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.865Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#bitrate MedialiveChannel#bitrate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBitrate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#coding_mode MedialiveChannel#coding_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCodingMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_type MedialiveChannel#input_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInputType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#profile MedialiveChannel#profile}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProfile() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#rate_control_mode MedialiveChannel#rate_control_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRateControlMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#raw_format MedialiveChannel#raw_format}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRawFormat() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#sample_rate MedialiveChannel#sample_rate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSampleRate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#spec MedialiveChannel#spec}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSpec() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#vbr_quality MedialiveChannel#vbr_quality}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVbrQuality() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings> {
        java.lang.Number bitrate;
        java.lang.String codingMode;
        java.lang.String inputType;
        java.lang.String profile;
        java.lang.String rateControlMode;
        java.lang.String rawFormat;
        java.lang.Number sampleRate;
        java.lang.String spec;
        java.lang.String vbrQuality;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings#getBitrate}
         * @param bitrate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#bitrate MedialiveChannel#bitrate}.
         * @return {@code this}
         */
        public Builder bitrate(java.lang.Number bitrate) {
            this.bitrate = bitrate;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings#getCodingMode}
         * @param codingMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#coding_mode MedialiveChannel#coding_mode}.
         * @return {@code this}
         */
        public Builder codingMode(java.lang.String codingMode) {
            this.codingMode = codingMode;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings#getInputType}
         * @param inputType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_type MedialiveChannel#input_type}.
         * @return {@code this}
         */
        public Builder inputType(java.lang.String inputType) {
            this.inputType = inputType;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings#getProfile}
         * @param profile Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#profile MedialiveChannel#profile}.
         * @return {@code this}
         */
        public Builder profile(java.lang.String profile) {
            this.profile = profile;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings#getRateControlMode}
         * @param rateControlMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#rate_control_mode MedialiveChannel#rate_control_mode}.
         * @return {@code this}
         */
        public Builder rateControlMode(java.lang.String rateControlMode) {
            this.rateControlMode = rateControlMode;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings#getRawFormat}
         * @param rawFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#raw_format MedialiveChannel#raw_format}.
         * @return {@code this}
         */
        public Builder rawFormat(java.lang.String rawFormat) {
            this.rawFormat = rawFormat;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings#getSampleRate}
         * @param sampleRate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#sample_rate MedialiveChannel#sample_rate}.
         * @return {@code this}
         */
        public Builder sampleRate(java.lang.Number sampleRate) {
            this.sampleRate = sampleRate;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings#getSpec}
         * @param spec Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#spec MedialiveChannel#spec}.
         * @return {@code this}
         */
        public Builder spec(java.lang.String spec) {
            this.spec = spec;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings#getVbrQuality}
         * @param vbrQuality Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#vbr_quality MedialiveChannel#vbr_quality}.
         * @return {@code this}
         */
        public Builder vbrQuality(java.lang.String vbrQuality) {
            this.vbrQuality = vbrQuality;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings {
        private final java.lang.Number bitrate;
        private final java.lang.String codingMode;
        private final java.lang.String inputType;
        private final java.lang.String profile;
        private final java.lang.String rateControlMode;
        private final java.lang.String rawFormat;
        private final java.lang.Number sampleRate;
        private final java.lang.String spec;
        private final java.lang.String vbrQuality;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bitrate = software.amazon.jsii.Kernel.get(this, "bitrate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.codingMode = software.amazon.jsii.Kernel.get(this, "codingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inputType = software.amazon.jsii.Kernel.get(this, "inputType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.profile = software.amazon.jsii.Kernel.get(this, "profile", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rateControlMode = software.amazon.jsii.Kernel.get(this, "rateControlMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rawFormat = software.amazon.jsii.Kernel.get(this, "rawFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sampleRate = software.amazon.jsii.Kernel.get(this, "sampleRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.spec = software.amazon.jsii.Kernel.get(this, "spec", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vbrQuality = software.amazon.jsii.Kernel.get(this, "vbrQuality", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bitrate = builder.bitrate;
            this.codingMode = builder.codingMode;
            this.inputType = builder.inputType;
            this.profile = builder.profile;
            this.rateControlMode = builder.rateControlMode;
            this.rawFormat = builder.rawFormat;
            this.sampleRate = builder.sampleRate;
            this.spec = builder.spec;
            this.vbrQuality = builder.vbrQuality;
        }

        @Override
        public final java.lang.Number getBitrate() {
            return this.bitrate;
        }

        @Override
        public final java.lang.String getCodingMode() {
            return this.codingMode;
        }

        @Override
        public final java.lang.String getInputType() {
            return this.inputType;
        }

        @Override
        public final java.lang.String getProfile() {
            return this.profile;
        }

        @Override
        public final java.lang.String getRateControlMode() {
            return this.rateControlMode;
        }

        @Override
        public final java.lang.String getRawFormat() {
            return this.rawFormat;
        }

        @Override
        public final java.lang.Number getSampleRate() {
            return this.sampleRate;
        }

        @Override
        public final java.lang.String getSpec() {
            return this.spec;
        }

        @Override
        public final java.lang.String getVbrQuality() {
            return this.vbrQuality;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBitrate() != null) {
                data.set("bitrate", om.valueToTree(this.getBitrate()));
            }
            if (this.getCodingMode() != null) {
                data.set("codingMode", om.valueToTree(this.getCodingMode()));
            }
            if (this.getInputType() != null) {
                data.set("inputType", om.valueToTree(this.getInputType()));
            }
            if (this.getProfile() != null) {
                data.set("profile", om.valueToTree(this.getProfile()));
            }
            if (this.getRateControlMode() != null) {
                data.set("rateControlMode", om.valueToTree(this.getRateControlMode()));
            }
            if (this.getRawFormat() != null) {
                data.set("rawFormat", om.valueToTree(this.getRawFormat()));
            }
            if (this.getSampleRate() != null) {
                data.set("sampleRate", om.valueToTree(this.getSampleRate()));
            }
            if (this.getSpec() != null) {
                data.set("spec", om.valueToTree(this.getSpec()));
            }
            if (this.getVbrQuality() != null) {
                data.set("vbrQuality", om.valueToTree(this.getVbrQuality()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings.Jsii$Proxy) o;

            if (this.bitrate != null ? !this.bitrate.equals(that.bitrate) : that.bitrate != null) return false;
            if (this.codingMode != null ? !this.codingMode.equals(that.codingMode) : that.codingMode != null) return false;
            if (this.inputType != null ? !this.inputType.equals(that.inputType) : that.inputType != null) return false;
            if (this.profile != null ? !this.profile.equals(that.profile) : that.profile != null) return false;
            if (this.rateControlMode != null ? !this.rateControlMode.equals(that.rateControlMode) : that.rateControlMode != null) return false;
            if (this.rawFormat != null ? !this.rawFormat.equals(that.rawFormat) : that.rawFormat != null) return false;
            if (this.sampleRate != null ? !this.sampleRate.equals(that.sampleRate) : that.sampleRate != null) return false;
            if (this.spec != null ? !this.spec.equals(that.spec) : that.spec != null) return false;
            return this.vbrQuality != null ? this.vbrQuality.equals(that.vbrQuality) : that.vbrQuality == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bitrate != null ? this.bitrate.hashCode() : 0;
            result = 31 * result + (this.codingMode != null ? this.codingMode.hashCode() : 0);
            result = 31 * result + (this.inputType != null ? this.inputType.hashCode() : 0);
            result = 31 * result + (this.profile != null ? this.profile.hashCode() : 0);
            result = 31 * result + (this.rateControlMode != null ? this.rateControlMode.hashCode() : 0);
            result = 31 * result + (this.rawFormat != null ? this.rawFormat.hashCode() : 0);
            result = 31 * result + (this.sampleRate != null ? this.sampleRate.hashCode() : 0);
            result = 31 * result + (this.spec != null ? this.spec.hashCode() : 0);
            result = 31 * result + (this.vbrQuality != null ? this.vbrQuality.hashCode() : 0);
            return result;
        }
    }
}
