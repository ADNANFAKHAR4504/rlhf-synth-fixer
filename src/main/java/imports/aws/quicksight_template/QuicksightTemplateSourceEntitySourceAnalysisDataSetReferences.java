package imports.aws.quicksight_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.124Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightTemplate.QuicksightTemplateSourceEntitySourceAnalysisDataSetReferences")
@software.amazon.jsii.Jsii.Proxy(QuicksightTemplateSourceEntitySourceAnalysisDataSetReferences.Jsii$Proxy.class)
public interface QuicksightTemplateSourceEntitySourceAnalysisDataSetReferences extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_template#data_set_arn QuicksightTemplate#data_set_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDataSetArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_template#data_set_placeholder QuicksightTemplate#data_set_placeholder}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDataSetPlaceholder();

    /**
     * @return a {@link Builder} of {@link QuicksightTemplateSourceEntitySourceAnalysisDataSetReferences}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightTemplateSourceEntitySourceAnalysisDataSetReferences}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightTemplateSourceEntitySourceAnalysisDataSetReferences> {
        java.lang.String dataSetArn;
        java.lang.String dataSetPlaceholder;

        /**
         * Sets the value of {@link QuicksightTemplateSourceEntitySourceAnalysisDataSetReferences#getDataSetArn}
         * @param dataSetArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_template#data_set_arn QuicksightTemplate#data_set_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataSetArn(java.lang.String dataSetArn) {
            this.dataSetArn = dataSetArn;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightTemplateSourceEntitySourceAnalysisDataSetReferences#getDataSetPlaceholder}
         * @param dataSetPlaceholder Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_template#data_set_placeholder QuicksightTemplate#data_set_placeholder}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataSetPlaceholder(java.lang.String dataSetPlaceholder) {
            this.dataSetPlaceholder = dataSetPlaceholder;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightTemplateSourceEntitySourceAnalysisDataSetReferences}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightTemplateSourceEntitySourceAnalysisDataSetReferences build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightTemplateSourceEntitySourceAnalysisDataSetReferences}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightTemplateSourceEntitySourceAnalysisDataSetReferences {
        private final java.lang.String dataSetArn;
        private final java.lang.String dataSetPlaceholder;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dataSetArn = software.amazon.jsii.Kernel.get(this, "dataSetArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataSetPlaceholder = software.amazon.jsii.Kernel.get(this, "dataSetPlaceholder", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dataSetArn = java.util.Objects.requireNonNull(builder.dataSetArn, "dataSetArn is required");
            this.dataSetPlaceholder = java.util.Objects.requireNonNull(builder.dataSetPlaceholder, "dataSetPlaceholder is required");
        }

        @Override
        public final java.lang.String getDataSetArn() {
            return this.dataSetArn;
        }

        @Override
        public final java.lang.String getDataSetPlaceholder() {
            return this.dataSetPlaceholder;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("dataSetArn", om.valueToTree(this.getDataSetArn()));
            data.set("dataSetPlaceholder", om.valueToTree(this.getDataSetPlaceholder()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightTemplate.QuicksightTemplateSourceEntitySourceAnalysisDataSetReferences"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightTemplateSourceEntitySourceAnalysisDataSetReferences.Jsii$Proxy that = (QuicksightTemplateSourceEntitySourceAnalysisDataSetReferences.Jsii$Proxy) o;

            if (!dataSetArn.equals(that.dataSetArn)) return false;
            return this.dataSetPlaceholder.equals(that.dataSetPlaceholder);
        }

        @Override
        public final int hashCode() {
            int result = this.dataSetArn.hashCode();
            result = 31 * result + (this.dataSetPlaceholder.hashCode());
            return result;
        }
    }
}
