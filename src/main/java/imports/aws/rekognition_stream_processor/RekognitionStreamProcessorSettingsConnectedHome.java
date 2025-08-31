package imports.aws.rekognition_stream_processor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.185Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rekognitionStreamProcessor.RekognitionStreamProcessorSettingsConnectedHome")
@software.amazon.jsii.Jsii.Proxy(RekognitionStreamProcessorSettingsConnectedHome.Jsii$Proxy.class)
public interface RekognitionStreamProcessorSettingsConnectedHome extends software.amazon.jsii.JsiiSerializable {

    /**
     * Specifies what you want to detect in the video, such as people, packages, or pets.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#labels RekognitionStreamProcessor#labels}
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLabels() {
        return null;
    }

    /**
     * The minimum confidence required to label an object in the video.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#min_confidence RekognitionStreamProcessor#min_confidence}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinConfidence() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RekognitionStreamProcessorSettingsConnectedHome}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RekognitionStreamProcessorSettingsConnectedHome}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RekognitionStreamProcessorSettingsConnectedHome> {
        java.util.List<java.lang.String> labels;
        java.lang.Number minConfidence;

        /**
         * Sets the value of {@link RekognitionStreamProcessorSettingsConnectedHome#getLabels}
         * @param labels Specifies what you want to detect in the video, such as people, packages, or pets.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#labels RekognitionStreamProcessor#labels}
         * @return {@code this}
         */
        public Builder labels(java.util.List<java.lang.String> labels) {
            this.labels = labels;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorSettingsConnectedHome#getMinConfidence}
         * @param minConfidence The minimum confidence required to label an object in the video.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#min_confidence RekognitionStreamProcessor#min_confidence}
         * @return {@code this}
         */
        public Builder minConfidence(java.lang.Number minConfidence) {
            this.minConfidence = minConfidence;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RekognitionStreamProcessorSettingsConnectedHome}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RekognitionStreamProcessorSettingsConnectedHome build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RekognitionStreamProcessorSettingsConnectedHome}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RekognitionStreamProcessorSettingsConnectedHome {
        private final java.util.List<java.lang.String> labels;
        private final java.lang.Number minConfidence;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.labels = software.amazon.jsii.Kernel.get(this, "labels", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.minConfidence = software.amazon.jsii.Kernel.get(this, "minConfidence", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.labels = builder.labels;
            this.minConfidence = builder.minConfidence;
        }

        @Override
        public final java.util.List<java.lang.String> getLabels() {
            return this.labels;
        }

        @Override
        public final java.lang.Number getMinConfidence() {
            return this.minConfidence;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getLabels() != null) {
                data.set("labels", om.valueToTree(this.getLabels()));
            }
            if (this.getMinConfidence() != null) {
                data.set("minConfidence", om.valueToTree(this.getMinConfidence()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rekognitionStreamProcessor.RekognitionStreamProcessorSettingsConnectedHome"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RekognitionStreamProcessorSettingsConnectedHome.Jsii$Proxy that = (RekognitionStreamProcessorSettingsConnectedHome.Jsii$Proxy) o;

            if (this.labels != null ? !this.labels.equals(that.labels) : that.labels != null) return false;
            return this.minConfidence != null ? this.minConfidence.equals(that.minConfidence) : that.minConfidence == null;
        }

        @Override
        public final int hashCode() {
            int result = this.labels != null ? this.labels.hashCode() : 0;
            result = 31 * result + (this.minConfidence != null ? this.minConfidence.hashCode() : 0);
            return result;
        }
    }
}
