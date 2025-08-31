package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.864Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#algorithm MedialiveChannel#algorithm}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAlgorithm() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#algorithm_control MedialiveChannel#algorithm_control}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAlgorithmControl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#target_lkfs MedialiveChannel#target_lkfs}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTargetLkfs() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings> {
        java.lang.String algorithm;
        java.lang.String algorithmControl;
        java.lang.Number targetLkfs;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings#getAlgorithm}
         * @param algorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#algorithm MedialiveChannel#algorithm}.
         * @return {@code this}
         */
        public Builder algorithm(java.lang.String algorithm) {
            this.algorithm = algorithm;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings#getAlgorithmControl}
         * @param algorithmControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#algorithm_control MedialiveChannel#algorithm_control}.
         * @return {@code this}
         */
        public Builder algorithmControl(java.lang.String algorithmControl) {
            this.algorithmControl = algorithmControl;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings#getTargetLkfs}
         * @param targetLkfs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#target_lkfs MedialiveChannel#target_lkfs}.
         * @return {@code this}
         */
        public Builder targetLkfs(java.lang.Number targetLkfs) {
            this.targetLkfs = targetLkfs;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings {
        private final java.lang.String algorithm;
        private final java.lang.String algorithmControl;
        private final java.lang.Number targetLkfs;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.algorithm = software.amazon.jsii.Kernel.get(this, "algorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.algorithmControl = software.amazon.jsii.Kernel.get(this, "algorithmControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetLkfs = software.amazon.jsii.Kernel.get(this, "targetLkfs", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.algorithm = builder.algorithm;
            this.algorithmControl = builder.algorithmControl;
            this.targetLkfs = builder.targetLkfs;
        }

        @Override
        public final java.lang.String getAlgorithm() {
            return this.algorithm;
        }

        @Override
        public final java.lang.String getAlgorithmControl() {
            return this.algorithmControl;
        }

        @Override
        public final java.lang.Number getTargetLkfs() {
            return this.targetLkfs;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAlgorithm() != null) {
                data.set("algorithm", om.valueToTree(this.getAlgorithm()));
            }
            if (this.getAlgorithmControl() != null) {
                data.set("algorithmControl", om.valueToTree(this.getAlgorithmControl()));
            }
            if (this.getTargetLkfs() != null) {
                data.set("targetLkfs", om.valueToTree(this.getTargetLkfs()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsAudioDescriptionsAudioNormalizationSettings.Jsii$Proxy) o;

            if (this.algorithm != null ? !this.algorithm.equals(that.algorithm) : that.algorithm != null) return false;
            if (this.algorithmControl != null ? !this.algorithmControl.equals(that.algorithmControl) : that.algorithmControl != null) return false;
            return this.targetLkfs != null ? this.targetLkfs.equals(that.targetLkfs) : that.targetLkfs == null;
        }

        @Override
        public final int hashCode() {
            int result = this.algorithm != null ? this.algorithm.hashCode() : 0;
            result = 31 * result + (this.algorithmControl != null ? this.algorithmControl.hashCode() : 0);
            result = 31 * result + (this.targetLkfs != null ? this.targetLkfs.hashCode() : 0);
            return result;
        }
    }
}
