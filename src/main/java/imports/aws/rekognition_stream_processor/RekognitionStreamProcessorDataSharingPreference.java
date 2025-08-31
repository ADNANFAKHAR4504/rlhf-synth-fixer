package imports.aws.rekognition_stream_processor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.183Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rekognitionStreamProcessor.RekognitionStreamProcessorDataSharingPreference")
@software.amazon.jsii.Jsii.Proxy(RekognitionStreamProcessorDataSharingPreference.Jsii$Proxy.class)
public interface RekognitionStreamProcessorDataSharingPreference extends software.amazon.jsii.JsiiSerializable {

    /**
     * Do you want to share data with Rekognition to improve model performance.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#opt_in RekognitionStreamProcessor#opt_in}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getOptIn();

    /**
     * @return a {@link Builder} of {@link RekognitionStreamProcessorDataSharingPreference}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RekognitionStreamProcessorDataSharingPreference}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RekognitionStreamProcessorDataSharingPreference> {
        java.lang.Object optIn;

        /**
         * Sets the value of {@link RekognitionStreamProcessorDataSharingPreference#getOptIn}
         * @param optIn Do you want to share data with Rekognition to improve model performance. This parameter is required.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#opt_in RekognitionStreamProcessor#opt_in}
         * @return {@code this}
         */
        public Builder optIn(java.lang.Boolean optIn) {
            this.optIn = optIn;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorDataSharingPreference#getOptIn}
         * @param optIn Do you want to share data with Rekognition to improve model performance. This parameter is required.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#opt_in RekognitionStreamProcessor#opt_in}
         * @return {@code this}
         */
        public Builder optIn(com.hashicorp.cdktf.IResolvable optIn) {
            this.optIn = optIn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RekognitionStreamProcessorDataSharingPreference}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RekognitionStreamProcessorDataSharingPreference build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RekognitionStreamProcessorDataSharingPreference}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RekognitionStreamProcessorDataSharingPreference {
        private final java.lang.Object optIn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.optIn = software.amazon.jsii.Kernel.get(this, "optIn", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.optIn = java.util.Objects.requireNonNull(builder.optIn, "optIn is required");
        }

        @Override
        public final java.lang.Object getOptIn() {
            return this.optIn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("optIn", om.valueToTree(this.getOptIn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rekognitionStreamProcessor.RekognitionStreamProcessorDataSharingPreference"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RekognitionStreamProcessorDataSharingPreference.Jsii$Proxy that = (RekognitionStreamProcessorDataSharingPreference.Jsii$Proxy) o;

            return this.optIn.equals(that.optIn);
        }

        @Override
        public final int hashCode() {
            int result = this.optIn.hashCode();
            return result;
        }
    }
}
