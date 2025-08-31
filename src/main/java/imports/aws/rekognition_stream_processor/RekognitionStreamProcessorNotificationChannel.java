package imports.aws.rekognition_stream_processor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.184Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rekognitionStreamProcessor.RekognitionStreamProcessorNotificationChannel")
@software.amazon.jsii.Jsii.Proxy(RekognitionStreamProcessorNotificationChannel.Jsii$Proxy.class)
public interface RekognitionStreamProcessorNotificationChannel extends software.amazon.jsii.JsiiSerializable {

    /**
     * The Amazon Resource Number (ARN) of the Amazon Amazon Simple Notification Service topic to which Amazon Rekognition posts the completion status.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#sns_topic_arn RekognitionStreamProcessor#sns_topic_arn}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnsTopicArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RekognitionStreamProcessorNotificationChannel}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RekognitionStreamProcessorNotificationChannel}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RekognitionStreamProcessorNotificationChannel> {
        java.lang.String snsTopicArn;

        /**
         * Sets the value of {@link RekognitionStreamProcessorNotificationChannel#getSnsTopicArn}
         * @param snsTopicArn The Amazon Resource Number (ARN) of the Amazon Amazon Simple Notification Service topic to which Amazon Rekognition posts the completion status.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#sns_topic_arn RekognitionStreamProcessor#sns_topic_arn}
         * @return {@code this}
         */
        public Builder snsTopicArn(java.lang.String snsTopicArn) {
            this.snsTopicArn = snsTopicArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RekognitionStreamProcessorNotificationChannel}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RekognitionStreamProcessorNotificationChannel build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RekognitionStreamProcessorNotificationChannel}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RekognitionStreamProcessorNotificationChannel {
        private final java.lang.String snsTopicArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.snsTopicArn = software.amazon.jsii.Kernel.get(this, "snsTopicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.snsTopicArn = builder.snsTopicArn;
        }

        @Override
        public final java.lang.String getSnsTopicArn() {
            return this.snsTopicArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSnsTopicArn() != null) {
                data.set("snsTopicArn", om.valueToTree(this.getSnsTopicArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rekognitionStreamProcessor.RekognitionStreamProcessorNotificationChannel"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RekognitionStreamProcessorNotificationChannel.Jsii$Proxy that = (RekognitionStreamProcessorNotificationChannel.Jsii$Proxy) o;

            return this.snsTopicArn != null ? this.snsTopicArn.equals(that.snsTopicArn) : that.snsTopicArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.snsTopicArn != null ? this.snsTopicArn.hashCode() : 0;
            return result;
        }
    }
}
