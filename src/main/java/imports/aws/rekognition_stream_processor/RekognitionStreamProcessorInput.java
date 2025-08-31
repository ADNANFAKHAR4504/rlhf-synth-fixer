package imports.aws.rekognition_stream_processor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.184Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rekognitionStreamProcessor.RekognitionStreamProcessorInput")
@software.amazon.jsii.Jsii.Proxy(RekognitionStreamProcessorInput.Jsii$Proxy.class)
public interface RekognitionStreamProcessorInput extends software.amazon.jsii.JsiiSerializable {

    /**
     * kinesis_video_stream block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#kinesis_video_stream RekognitionStreamProcessor#kinesis_video_stream}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getKinesisVideoStream() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RekognitionStreamProcessorInput}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RekognitionStreamProcessorInput}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RekognitionStreamProcessorInput> {
        java.lang.Object kinesisVideoStream;

        /**
         * Sets the value of {@link RekognitionStreamProcessorInput#getKinesisVideoStream}
         * @param kinesisVideoStream kinesis_video_stream block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#kinesis_video_stream RekognitionStreamProcessor#kinesis_video_stream}
         * @return {@code this}
         */
        public Builder kinesisVideoStream(com.hashicorp.cdktf.IResolvable kinesisVideoStream) {
            this.kinesisVideoStream = kinesisVideoStream;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorInput#getKinesisVideoStream}
         * @param kinesisVideoStream kinesis_video_stream block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#kinesis_video_stream RekognitionStreamProcessor#kinesis_video_stream}
         * @return {@code this}
         */
        public Builder kinesisVideoStream(java.util.List<? extends imports.aws.rekognition_stream_processor.RekognitionStreamProcessorInputKinesisVideoStream> kinesisVideoStream) {
            this.kinesisVideoStream = kinesisVideoStream;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RekognitionStreamProcessorInput}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RekognitionStreamProcessorInput build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RekognitionStreamProcessorInput}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RekognitionStreamProcessorInput {
        private final java.lang.Object kinesisVideoStream;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.kinesisVideoStream = software.amazon.jsii.Kernel.get(this, "kinesisVideoStream", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.kinesisVideoStream = builder.kinesisVideoStream;
        }

        @Override
        public final java.lang.Object getKinesisVideoStream() {
            return this.kinesisVideoStream;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getKinesisVideoStream() != null) {
                data.set("kinesisVideoStream", om.valueToTree(this.getKinesisVideoStream()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rekognitionStreamProcessor.RekognitionStreamProcessorInput"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RekognitionStreamProcessorInput.Jsii$Proxy that = (RekognitionStreamProcessorInput.Jsii$Proxy) o;

            return this.kinesisVideoStream != null ? this.kinesisVideoStream.equals(that.kinesisVideoStream) : that.kinesisVideoStream == null;
        }

        @Override
        public final int hashCode() {
            int result = this.kinesisVideoStream != null ? this.kinesisVideoStream.hashCode() : 0;
            return result;
        }
    }
}
