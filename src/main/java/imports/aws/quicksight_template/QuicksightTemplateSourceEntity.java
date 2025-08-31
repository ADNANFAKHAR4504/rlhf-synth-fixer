package imports.aws.quicksight_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.124Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightTemplate.QuicksightTemplateSourceEntity")
@software.amazon.jsii.Jsii.Proxy(QuicksightTemplateSourceEntity.Jsii$Proxy.class)
public interface QuicksightTemplateSourceEntity extends software.amazon.jsii.JsiiSerializable {

    /**
     * source_analysis block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_template#source_analysis QuicksightTemplate#source_analysis}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceAnalysis getSourceAnalysis() {
        return null;
    }

    /**
     * source_template block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_template#source_template QuicksightTemplate#source_template}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceTemplate getSourceTemplate() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightTemplateSourceEntity}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightTemplateSourceEntity}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightTemplateSourceEntity> {
        imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceAnalysis sourceAnalysis;
        imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceTemplate sourceTemplate;

        /**
         * Sets the value of {@link QuicksightTemplateSourceEntity#getSourceAnalysis}
         * @param sourceAnalysis source_analysis block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_template#source_analysis QuicksightTemplate#source_analysis}
         * @return {@code this}
         */
        public Builder sourceAnalysis(imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceAnalysis sourceAnalysis) {
            this.sourceAnalysis = sourceAnalysis;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightTemplateSourceEntity#getSourceTemplate}
         * @param sourceTemplate source_template block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_template#source_template QuicksightTemplate#source_template}
         * @return {@code this}
         */
        public Builder sourceTemplate(imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceTemplate sourceTemplate) {
            this.sourceTemplate = sourceTemplate;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightTemplateSourceEntity}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightTemplateSourceEntity build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightTemplateSourceEntity}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightTemplateSourceEntity {
        private final imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceAnalysis sourceAnalysis;
        private final imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceTemplate sourceTemplate;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sourceAnalysis = software.amazon.jsii.Kernel.get(this, "sourceAnalysis", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceAnalysis.class));
            this.sourceTemplate = software.amazon.jsii.Kernel.get(this, "sourceTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceTemplate.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sourceAnalysis = builder.sourceAnalysis;
            this.sourceTemplate = builder.sourceTemplate;
        }

        @Override
        public final imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceAnalysis getSourceAnalysis() {
            return this.sourceAnalysis;
        }

        @Override
        public final imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceTemplate getSourceTemplate() {
            return this.sourceTemplate;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSourceAnalysis() != null) {
                data.set("sourceAnalysis", om.valueToTree(this.getSourceAnalysis()));
            }
            if (this.getSourceTemplate() != null) {
                data.set("sourceTemplate", om.valueToTree(this.getSourceTemplate()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightTemplate.QuicksightTemplateSourceEntity"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightTemplateSourceEntity.Jsii$Proxy that = (QuicksightTemplateSourceEntity.Jsii$Proxy) o;

            if (this.sourceAnalysis != null ? !this.sourceAnalysis.equals(that.sourceAnalysis) : that.sourceAnalysis != null) return false;
            return this.sourceTemplate != null ? this.sourceTemplate.equals(that.sourceTemplate) : that.sourceTemplate == null;
        }

        @Override
        public final int hashCode() {
            int result = this.sourceAnalysis != null ? this.sourceAnalysis.hashCode() : 0;
            result = 31 * result + (this.sourceTemplate != null ? this.sourceTemplate.hashCode() : 0);
            return result;
        }
    }
}
