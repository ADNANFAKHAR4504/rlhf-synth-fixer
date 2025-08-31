package imports.aws.quicksight_analysis;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.098Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightAnalysis.QuicksightAnalysisSourceEntity")
@software.amazon.jsii.Jsii.Proxy(QuicksightAnalysisSourceEntity.Jsii$Proxy.class)
public interface QuicksightAnalysisSourceEntity extends software.amazon.jsii.JsiiSerializable {

    /**
     * source_template block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#source_template QuicksightAnalysis#source_template}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntitySourceTemplate getSourceTemplate() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightAnalysisSourceEntity}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightAnalysisSourceEntity}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightAnalysisSourceEntity> {
        imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntitySourceTemplate sourceTemplate;

        /**
         * Sets the value of {@link QuicksightAnalysisSourceEntity#getSourceTemplate}
         * @param sourceTemplate source_template block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#source_template QuicksightAnalysis#source_template}
         * @return {@code this}
         */
        public Builder sourceTemplate(imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntitySourceTemplate sourceTemplate) {
            this.sourceTemplate = sourceTemplate;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightAnalysisSourceEntity}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightAnalysisSourceEntity build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightAnalysisSourceEntity}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightAnalysisSourceEntity {
        private final imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntitySourceTemplate sourceTemplate;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sourceTemplate = software.amazon.jsii.Kernel.get(this, "sourceTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntitySourceTemplate.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sourceTemplate = builder.sourceTemplate;
        }

        @Override
        public final imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntitySourceTemplate getSourceTemplate() {
            return this.sourceTemplate;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSourceTemplate() != null) {
                data.set("sourceTemplate", om.valueToTree(this.getSourceTemplate()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightAnalysis.QuicksightAnalysisSourceEntity"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightAnalysisSourceEntity.Jsii$Proxy that = (QuicksightAnalysisSourceEntity.Jsii$Proxy) o;

            return this.sourceTemplate != null ? this.sourceTemplate.equals(that.sourceTemplate) : that.sourceTemplate == null;
        }

        @Override
        public final int hashCode() {
            int result = this.sourceTemplate != null ? this.sourceTemplate.hashCode() : 0;
            return result;
        }
    }
}
