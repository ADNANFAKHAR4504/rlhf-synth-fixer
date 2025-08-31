package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.869Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsNielsenConfiguration")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsNielsenConfiguration.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsNielsenConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#distributor_id MedialiveChannel#distributor_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDistributorId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#nielsen_pcm_to_id3_tagging MedialiveChannel#nielsen_pcm_to_id3_tagging}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNielsenPcmToId3Tagging() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsNielsenConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsNielsenConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsNielsenConfiguration> {
        java.lang.String distributorId;
        java.lang.String nielsenPcmToId3Tagging;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsNielsenConfiguration#getDistributorId}
         * @param distributorId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#distributor_id MedialiveChannel#distributor_id}.
         * @return {@code this}
         */
        public Builder distributorId(java.lang.String distributorId) {
            this.distributorId = distributorId;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsNielsenConfiguration#getNielsenPcmToId3Tagging}
         * @param nielsenPcmToId3Tagging Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#nielsen_pcm_to_id3_tagging MedialiveChannel#nielsen_pcm_to_id3_tagging}.
         * @return {@code this}
         */
        public Builder nielsenPcmToId3Tagging(java.lang.String nielsenPcmToId3Tagging) {
            this.nielsenPcmToId3Tagging = nielsenPcmToId3Tagging;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsNielsenConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsNielsenConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsNielsenConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsNielsenConfiguration {
        private final java.lang.String distributorId;
        private final java.lang.String nielsenPcmToId3Tagging;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.distributorId = software.amazon.jsii.Kernel.get(this, "distributorId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nielsenPcmToId3Tagging = software.amazon.jsii.Kernel.get(this, "nielsenPcmToId3Tagging", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.distributorId = builder.distributorId;
            this.nielsenPcmToId3Tagging = builder.nielsenPcmToId3Tagging;
        }

        @Override
        public final java.lang.String getDistributorId() {
            return this.distributorId;
        }

        @Override
        public final java.lang.String getNielsenPcmToId3Tagging() {
            return this.nielsenPcmToId3Tagging;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDistributorId() != null) {
                data.set("distributorId", om.valueToTree(this.getDistributorId()));
            }
            if (this.getNielsenPcmToId3Tagging() != null) {
                data.set("nielsenPcmToId3Tagging", om.valueToTree(this.getNielsenPcmToId3Tagging()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsNielsenConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsNielsenConfiguration.Jsii$Proxy that = (MedialiveChannelEncoderSettingsNielsenConfiguration.Jsii$Proxy) o;

            if (this.distributorId != null ? !this.distributorId.equals(that.distributorId) : that.distributorId != null) return false;
            return this.nielsenPcmToId3Tagging != null ? this.nielsenPcmToId3Tagging.equals(that.nielsenPcmToId3Tagging) : that.nielsenPcmToId3Tagging == null;
        }

        @Override
        public final int hashCode() {
            int result = this.distributorId != null ? this.distributorId.hashCode() : 0;
            result = 31 * result + (this.nielsenPcmToId3Tagging != null ? this.nielsenPcmToId3Tagging.hashCode() : 0);
            return result;
        }
    }
}
