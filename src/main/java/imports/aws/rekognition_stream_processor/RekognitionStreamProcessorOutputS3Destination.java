package imports.aws.rekognition_stream_processor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.184Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rekognitionStreamProcessor.RekognitionStreamProcessorOutputS3Destination")
@software.amazon.jsii.Jsii.Proxy(RekognitionStreamProcessorOutputS3Destination.Jsii$Proxy.class)
public interface RekognitionStreamProcessorOutputS3Destination extends software.amazon.jsii.JsiiSerializable {

    /**
     * The name of the Amazon S3 bucket you want to associate with the streaming video project.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#bucket RekognitionStreamProcessor#bucket}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucket() {
        return null;
    }

    /**
     * The prefix value of the location within the bucket that you want the information to be published to.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#key_prefix RekognitionStreamProcessor#key_prefix}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeyPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RekognitionStreamProcessorOutputS3Destination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RekognitionStreamProcessorOutputS3Destination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RekognitionStreamProcessorOutputS3Destination> {
        java.lang.String bucket;
        java.lang.String keyPrefix;

        /**
         * Sets the value of {@link RekognitionStreamProcessorOutputS3Destination#getBucket}
         * @param bucket The name of the Amazon S3 bucket you want to associate with the streaming video project.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#bucket RekognitionStreamProcessor#bucket}
         * @return {@code this}
         */
        public Builder bucket(java.lang.String bucket) {
            this.bucket = bucket;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorOutputS3Destination#getKeyPrefix}
         * @param keyPrefix The prefix value of the location within the bucket that you want the information to be published to.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#key_prefix RekognitionStreamProcessor#key_prefix}
         * @return {@code this}
         */
        public Builder keyPrefix(java.lang.String keyPrefix) {
            this.keyPrefix = keyPrefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RekognitionStreamProcessorOutputS3Destination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RekognitionStreamProcessorOutputS3Destination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RekognitionStreamProcessorOutputS3Destination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RekognitionStreamProcessorOutputS3Destination {
        private final java.lang.String bucket;
        private final java.lang.String keyPrefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucket = software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyPrefix = software.amazon.jsii.Kernel.get(this, "keyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucket = builder.bucket;
            this.keyPrefix = builder.keyPrefix;
        }

        @Override
        public final java.lang.String getBucket() {
            return this.bucket;
        }

        @Override
        public final java.lang.String getKeyPrefix() {
            return this.keyPrefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBucket() != null) {
                data.set("bucket", om.valueToTree(this.getBucket()));
            }
            if (this.getKeyPrefix() != null) {
                data.set("keyPrefix", om.valueToTree(this.getKeyPrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rekognitionStreamProcessor.RekognitionStreamProcessorOutputS3Destination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RekognitionStreamProcessorOutputS3Destination.Jsii$Proxy that = (RekognitionStreamProcessorOutputS3Destination.Jsii$Proxy) o;

            if (this.bucket != null ? !this.bucket.equals(that.bucket) : that.bucket != null) return false;
            return this.keyPrefix != null ? this.keyPrefix.equals(that.keyPrefix) : that.keyPrefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucket != null ? this.bucket.hashCode() : 0;
            result = 31 * result + (this.keyPrefix != null ? this.keyPrefix.hashCode() : 0);
            return result;
        }
    }
}
