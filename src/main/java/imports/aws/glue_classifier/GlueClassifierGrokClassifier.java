package imports.aws.glue_classifier;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.286Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueClassifier.GlueClassifierGrokClassifier")
@software.amazon.jsii.Jsii.Proxy(GlueClassifierGrokClassifier.Jsii$Proxy.class)
public interface GlueClassifierGrokClassifier extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#classification GlueClassifier#classification}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClassification();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#grok_pattern GlueClassifier#grok_pattern}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getGrokPattern();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#custom_patterns GlueClassifier#custom_patterns}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomPatterns() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueClassifierGrokClassifier}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueClassifierGrokClassifier}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueClassifierGrokClassifier> {
        java.lang.String classification;
        java.lang.String grokPattern;
        java.lang.String customPatterns;

        /**
         * Sets the value of {@link GlueClassifierGrokClassifier#getClassification}
         * @param classification Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#classification GlueClassifier#classification}. This parameter is required.
         * @return {@code this}
         */
        public Builder classification(java.lang.String classification) {
            this.classification = classification;
            return this;
        }

        /**
         * Sets the value of {@link GlueClassifierGrokClassifier#getGrokPattern}
         * @param grokPattern Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#grok_pattern GlueClassifier#grok_pattern}. This parameter is required.
         * @return {@code this}
         */
        public Builder grokPattern(java.lang.String grokPattern) {
            this.grokPattern = grokPattern;
            return this;
        }

        /**
         * Sets the value of {@link GlueClassifierGrokClassifier#getCustomPatterns}
         * @param customPatterns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_classifier#custom_patterns GlueClassifier#custom_patterns}.
         * @return {@code this}
         */
        public Builder customPatterns(java.lang.String customPatterns) {
            this.customPatterns = customPatterns;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueClassifierGrokClassifier}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueClassifierGrokClassifier build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueClassifierGrokClassifier}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueClassifierGrokClassifier {
        private final java.lang.String classification;
        private final java.lang.String grokPattern;
        private final java.lang.String customPatterns;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.classification = software.amazon.jsii.Kernel.get(this, "classification", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.grokPattern = software.amazon.jsii.Kernel.get(this, "grokPattern", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customPatterns = software.amazon.jsii.Kernel.get(this, "customPatterns", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.classification = java.util.Objects.requireNonNull(builder.classification, "classification is required");
            this.grokPattern = java.util.Objects.requireNonNull(builder.grokPattern, "grokPattern is required");
            this.customPatterns = builder.customPatterns;
        }

        @Override
        public final java.lang.String getClassification() {
            return this.classification;
        }

        @Override
        public final java.lang.String getGrokPattern() {
            return this.grokPattern;
        }

        @Override
        public final java.lang.String getCustomPatterns() {
            return this.customPatterns;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("classification", om.valueToTree(this.getClassification()));
            data.set("grokPattern", om.valueToTree(this.getGrokPattern()));
            if (this.getCustomPatterns() != null) {
                data.set("customPatterns", om.valueToTree(this.getCustomPatterns()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueClassifier.GlueClassifierGrokClassifier"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueClassifierGrokClassifier.Jsii$Proxy that = (GlueClassifierGrokClassifier.Jsii$Proxy) o;

            if (!classification.equals(that.classification)) return false;
            if (!grokPattern.equals(that.grokPattern)) return false;
            return this.customPatterns != null ? this.customPatterns.equals(that.customPatterns) : that.customPatterns == null;
        }

        @Override
        public final int hashCode() {
            int result = this.classification.hashCode();
            result = 31 * result + (this.grokPattern.hashCode());
            result = 31 * result + (this.customPatterns != null ? this.customPatterns.hashCode() : 0);
            return result;
        }
    }
}
