package imports.aws.comprehend_entity_recognizer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.365Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.comprehendEntityRecognizer.ComprehendEntityRecognizerInputDataConfigAnnotations")
@software.amazon.jsii.Jsii.Proxy(ComprehendEntityRecognizerInputDataConfigAnnotations.Jsii$Proxy.class)
public interface ComprehendEntityRecognizerInputDataConfigAnnotations extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#s3_uri ComprehendEntityRecognizer#s3_uri}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3Uri();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#test_s3_uri ComprehendEntityRecognizer#test_s3_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTestS3Uri() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ComprehendEntityRecognizerInputDataConfigAnnotations}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ComprehendEntityRecognizerInputDataConfigAnnotations}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ComprehendEntityRecognizerInputDataConfigAnnotations> {
        java.lang.String s3Uri;
        java.lang.String testS3Uri;

        /**
         * Sets the value of {@link ComprehendEntityRecognizerInputDataConfigAnnotations#getS3Uri}
         * @param s3Uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#s3_uri ComprehendEntityRecognizer#s3_uri}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3Uri(java.lang.String s3Uri) {
            this.s3Uri = s3Uri;
            return this;
        }

        /**
         * Sets the value of {@link ComprehendEntityRecognizerInputDataConfigAnnotations#getTestS3Uri}
         * @param testS3Uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/comprehend_entity_recognizer#test_s3_uri ComprehendEntityRecognizer#test_s3_uri}.
         * @return {@code this}
         */
        public Builder testS3Uri(java.lang.String testS3Uri) {
            this.testS3Uri = testS3Uri;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ComprehendEntityRecognizerInputDataConfigAnnotations}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ComprehendEntityRecognizerInputDataConfigAnnotations build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ComprehendEntityRecognizerInputDataConfigAnnotations}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ComprehendEntityRecognizerInputDataConfigAnnotations {
        private final java.lang.String s3Uri;
        private final java.lang.String testS3Uri;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3Uri = software.amazon.jsii.Kernel.get(this, "s3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.testS3Uri = software.amazon.jsii.Kernel.get(this, "testS3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3Uri = java.util.Objects.requireNonNull(builder.s3Uri, "s3Uri is required");
            this.testS3Uri = builder.testS3Uri;
        }

        @Override
        public final java.lang.String getS3Uri() {
            return this.s3Uri;
        }

        @Override
        public final java.lang.String getTestS3Uri() {
            return this.testS3Uri;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("s3Uri", om.valueToTree(this.getS3Uri()));
            if (this.getTestS3Uri() != null) {
                data.set("testS3Uri", om.valueToTree(this.getTestS3Uri()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.comprehendEntityRecognizer.ComprehendEntityRecognizerInputDataConfigAnnotations"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ComprehendEntityRecognizerInputDataConfigAnnotations.Jsii$Proxy that = (ComprehendEntityRecognizerInputDataConfigAnnotations.Jsii$Proxy) o;

            if (!s3Uri.equals(that.s3Uri)) return false;
            return this.testS3Uri != null ? this.testS3Uri.equals(that.testS3Uri) : that.testS3Uri == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3Uri.hashCode();
            result = 31 * result + (this.testS3Uri != null ? this.testS3Uri.hashCode() : 0);
            return result;
        }
    }
}
