package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.890Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputSpecification")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputSpecification.Jsii$Proxy.class)
public interface MedialiveChannelInputSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#codec MedialiveChannel#codec}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCodec();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_resolution MedialiveChannel#input_resolution}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInputResolution();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#maximum_bitrate MedialiveChannel#maximum_bitrate}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMaximumBitrate();

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputSpecification> {
        java.lang.String codec;
        java.lang.String inputResolution;
        java.lang.String maximumBitrate;

        /**
         * Sets the value of {@link MedialiveChannelInputSpecification#getCodec}
         * @param codec Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#codec MedialiveChannel#codec}. This parameter is required.
         * @return {@code this}
         */
        public Builder codec(java.lang.String codec) {
            this.codec = codec;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputSpecification#getInputResolution}
         * @param inputResolution Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_resolution MedialiveChannel#input_resolution}. This parameter is required.
         * @return {@code this}
         */
        public Builder inputResolution(java.lang.String inputResolution) {
            this.inputResolution = inputResolution;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputSpecification#getMaximumBitrate}
         * @param maximumBitrate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#maximum_bitrate MedialiveChannel#maximum_bitrate}. This parameter is required.
         * @return {@code this}
         */
        public Builder maximumBitrate(java.lang.String maximumBitrate) {
            this.maximumBitrate = maximumBitrate;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputSpecification {
        private final java.lang.String codec;
        private final java.lang.String inputResolution;
        private final java.lang.String maximumBitrate;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.codec = software.amazon.jsii.Kernel.get(this, "codec", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inputResolution = software.amazon.jsii.Kernel.get(this, "inputResolution", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maximumBitrate = software.amazon.jsii.Kernel.get(this, "maximumBitrate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.codec = java.util.Objects.requireNonNull(builder.codec, "codec is required");
            this.inputResolution = java.util.Objects.requireNonNull(builder.inputResolution, "inputResolution is required");
            this.maximumBitrate = java.util.Objects.requireNonNull(builder.maximumBitrate, "maximumBitrate is required");
        }

        @Override
        public final java.lang.String getCodec() {
            return this.codec;
        }

        @Override
        public final java.lang.String getInputResolution() {
            return this.inputResolution;
        }

        @Override
        public final java.lang.String getMaximumBitrate() {
            return this.maximumBitrate;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("codec", om.valueToTree(this.getCodec()));
            data.set("inputResolution", om.valueToTree(this.getInputResolution()));
            data.set("maximumBitrate", om.valueToTree(this.getMaximumBitrate()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputSpecification.Jsii$Proxy that = (MedialiveChannelInputSpecification.Jsii$Proxy) o;

            if (!codec.equals(that.codec)) return false;
            if (!inputResolution.equals(that.inputResolution)) return false;
            return this.maximumBitrate.equals(that.maximumBitrate);
        }

        @Override
        public final int hashCode() {
            int result = this.codec.hashCode();
            result = 31 * result + (this.inputResolution.hashCode());
            result = 31 * result + (this.maximumBitrate.hashCode());
            return result;
        }
    }
}
