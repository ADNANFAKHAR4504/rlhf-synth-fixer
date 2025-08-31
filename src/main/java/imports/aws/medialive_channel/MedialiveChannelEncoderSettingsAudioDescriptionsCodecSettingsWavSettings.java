package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.866Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#bit_depth MedialiveChannel#bit_depth}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBitDepth() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#coding_mode MedialiveChannel#coding_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCodingMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#sample_rate MedialiveChannel#sample_rate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSampleRate() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings> {
        java.lang.Number bitDepth;
        java.lang.String codingMode;
        java.lang.Number sampleRate;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings#getBitDepth}
         * @param bitDepth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#bit_depth MedialiveChannel#bit_depth}.
         * @return {@code this}
         */
        public Builder bitDepth(java.lang.Number bitDepth) {
            this.bitDepth = bitDepth;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings#getCodingMode}
         * @param codingMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#coding_mode MedialiveChannel#coding_mode}.
         * @return {@code this}
         */
        public Builder codingMode(java.lang.String codingMode) {
            this.codingMode = codingMode;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings#getSampleRate}
         * @param sampleRate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#sample_rate MedialiveChannel#sample_rate}.
         * @return {@code this}
         */
        public Builder sampleRate(java.lang.Number sampleRate) {
            this.sampleRate = sampleRate;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings {
        private final java.lang.Number bitDepth;
        private final java.lang.String codingMode;
        private final java.lang.Number sampleRate;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bitDepth = software.amazon.jsii.Kernel.get(this, "bitDepth", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.codingMode = software.amazon.jsii.Kernel.get(this, "codingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sampleRate = software.amazon.jsii.Kernel.get(this, "sampleRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bitDepth = builder.bitDepth;
            this.codingMode = builder.codingMode;
            this.sampleRate = builder.sampleRate;
        }

        @Override
        public final java.lang.Number getBitDepth() {
            return this.bitDepth;
        }

        @Override
        public final java.lang.String getCodingMode() {
            return this.codingMode;
        }

        @Override
        public final java.lang.Number getSampleRate() {
            return this.sampleRate;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBitDepth() != null) {
                data.set("bitDepth", om.valueToTree(this.getBitDepth()));
            }
            if (this.getCodingMode() != null) {
                data.set("codingMode", om.valueToTree(this.getCodingMode()));
            }
            if (this.getSampleRate() != null) {
                data.set("sampleRate", om.valueToTree(this.getSampleRate()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings.Jsii$Proxy) o;

            if (this.bitDepth != null ? !this.bitDepth.equals(that.bitDepth) : that.bitDepth != null) return false;
            if (this.codingMode != null ? !this.codingMode.equals(that.codingMode) : that.codingMode != null) return false;
            return this.sampleRate != null ? this.sampleRate.equals(that.sampleRate) : that.sampleRate == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bitDepth != null ? this.bitDepth.hashCode() : 0;
            result = 31 * result + (this.codingMode != null ? this.codingMode.hashCode() : 0);
            result = 31 * result + (this.sampleRate != null ? this.sampleRate.hashCode() : 0);
            return result;
        }
    }
}
