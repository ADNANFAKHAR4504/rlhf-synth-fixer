package imports.aws.rekognition_stream_processor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.184Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rekognitionStreamProcessor.RekognitionStreamProcessorOutputKinesisDataStream")
@software.amazon.jsii.Jsii.Proxy(RekognitionStreamProcessorOutputKinesisDataStream.Jsii$Proxy.class)
public interface RekognitionStreamProcessorOutputKinesisDataStream extends software.amazon.jsii.JsiiSerializable {

    /**
     * ARN of the output Amazon Kinesis Data Streams stream.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#arn RekognitionStreamProcessor#arn}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RekognitionStreamProcessorOutputKinesisDataStream}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RekognitionStreamProcessorOutputKinesisDataStream}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RekognitionStreamProcessorOutputKinesisDataStream> {
        java.lang.String arn;

        /**
         * Sets the value of {@link RekognitionStreamProcessorOutputKinesisDataStream#getArn}
         * @param arn ARN of the output Amazon Kinesis Data Streams stream.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#arn RekognitionStreamProcessor#arn}
         * @return {@code this}
         */
        public Builder arn(java.lang.String arn) {
            this.arn = arn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RekognitionStreamProcessorOutputKinesisDataStream}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RekognitionStreamProcessorOutputKinesisDataStream build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RekognitionStreamProcessorOutputKinesisDataStream}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RekognitionStreamProcessorOutputKinesisDataStream {
        private final java.lang.String arn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.arn = software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.arn = builder.arn;
        }

        @Override
        public final java.lang.String getArn() {
            return this.arn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getArn() != null) {
                data.set("arn", om.valueToTree(this.getArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rekognitionStreamProcessor.RekognitionStreamProcessorOutputKinesisDataStream"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RekognitionStreamProcessorOutputKinesisDataStream.Jsii$Proxy that = (RekognitionStreamProcessorOutputKinesisDataStream.Jsii$Proxy) o;

            return this.arn != null ? this.arn.equals(that.arn) : that.arn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.arn != null ? this.arn.hashCode() : 0;
            return result;
        }
    }
}
