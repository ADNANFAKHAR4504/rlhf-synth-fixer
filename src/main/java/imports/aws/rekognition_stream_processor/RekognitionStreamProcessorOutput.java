package imports.aws.rekognition_stream_processor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.184Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rekognitionStreamProcessor.RekognitionStreamProcessorOutput")
@software.amazon.jsii.Jsii.Proxy(RekognitionStreamProcessorOutput.Jsii$Proxy.class)
public interface RekognitionStreamProcessorOutput extends software.amazon.jsii.JsiiSerializable {

    /**
     * kinesis_data_stream block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#kinesis_data_stream RekognitionStreamProcessor#kinesis_data_stream}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getKinesisDataStream() {
        return null;
    }

    /**
     * s3_destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#s3_destination RekognitionStreamProcessor#s3_destination}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getS3Destination() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RekognitionStreamProcessorOutput}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RekognitionStreamProcessorOutput}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RekognitionStreamProcessorOutput> {
        java.lang.Object kinesisDataStream;
        java.lang.Object s3Destination;

        /**
         * Sets the value of {@link RekognitionStreamProcessorOutput#getKinesisDataStream}
         * @param kinesisDataStream kinesis_data_stream block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#kinesis_data_stream RekognitionStreamProcessor#kinesis_data_stream}
         * @return {@code this}
         */
        public Builder kinesisDataStream(com.hashicorp.cdktf.IResolvable kinesisDataStream) {
            this.kinesisDataStream = kinesisDataStream;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorOutput#getKinesisDataStream}
         * @param kinesisDataStream kinesis_data_stream block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#kinesis_data_stream RekognitionStreamProcessor#kinesis_data_stream}
         * @return {@code this}
         */
        public Builder kinesisDataStream(java.util.List<? extends imports.aws.rekognition_stream_processor.RekognitionStreamProcessorOutputKinesisDataStream> kinesisDataStream) {
            this.kinesisDataStream = kinesisDataStream;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorOutput#getS3Destination}
         * @param s3Destination s3_destination block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#s3_destination RekognitionStreamProcessor#s3_destination}
         * @return {@code this}
         */
        public Builder s3Destination(com.hashicorp.cdktf.IResolvable s3Destination) {
            this.s3Destination = s3Destination;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorOutput#getS3Destination}
         * @param s3Destination s3_destination block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#s3_destination RekognitionStreamProcessor#s3_destination}
         * @return {@code this}
         */
        public Builder s3Destination(java.util.List<? extends imports.aws.rekognition_stream_processor.RekognitionStreamProcessorOutputS3Destination> s3Destination) {
            this.s3Destination = s3Destination;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RekognitionStreamProcessorOutput}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RekognitionStreamProcessorOutput build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RekognitionStreamProcessorOutput}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RekognitionStreamProcessorOutput {
        private final java.lang.Object kinesisDataStream;
        private final java.lang.Object s3Destination;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.kinesisDataStream = software.amazon.jsii.Kernel.get(this, "kinesisDataStream", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.s3Destination = software.amazon.jsii.Kernel.get(this, "s3Destination", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.kinesisDataStream = builder.kinesisDataStream;
            this.s3Destination = builder.s3Destination;
        }

        @Override
        public final java.lang.Object getKinesisDataStream() {
            return this.kinesisDataStream;
        }

        @Override
        public final java.lang.Object getS3Destination() {
            return this.s3Destination;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getKinesisDataStream() != null) {
                data.set("kinesisDataStream", om.valueToTree(this.getKinesisDataStream()));
            }
            if (this.getS3Destination() != null) {
                data.set("s3Destination", om.valueToTree(this.getS3Destination()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rekognitionStreamProcessor.RekognitionStreamProcessorOutput"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RekognitionStreamProcessorOutput.Jsii$Proxy that = (RekognitionStreamProcessorOutput.Jsii$Proxy) o;

            if (this.kinesisDataStream != null ? !this.kinesisDataStream.equals(that.kinesisDataStream) : that.kinesisDataStream != null) return false;
            return this.s3Destination != null ? this.s3Destination.equals(that.s3Destination) : that.s3Destination == null;
        }

        @Override
        public final int hashCode() {
            int result = this.kinesisDataStream != null ? this.kinesisDataStream.hashCode() : 0;
            result = 31 * result + (this.s3Destination != null ? this.s3Destination.hashCode() : 0);
            return result;
        }
    }
}
