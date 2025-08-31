package imports.aws.quicksight_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.124Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightTemplate.QuicksightTemplateSourceEntitySourceAnalysis")
@software.amazon.jsii.Jsii.Proxy(QuicksightTemplateSourceEntitySourceAnalysis.Jsii$Proxy.class)
public interface QuicksightTemplateSourceEntitySourceAnalysis extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_template#arn QuicksightTemplate#arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getArn();

    /**
     * data_set_references block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_template#data_set_references QuicksightTemplate#data_set_references}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getDataSetReferences();

    /**
     * @return a {@link Builder} of {@link QuicksightTemplateSourceEntitySourceAnalysis}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightTemplateSourceEntitySourceAnalysis}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightTemplateSourceEntitySourceAnalysis> {
        java.lang.String arn;
        java.lang.Object dataSetReferences;

        /**
         * Sets the value of {@link QuicksightTemplateSourceEntitySourceAnalysis#getArn}
         * @param arn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_template#arn QuicksightTemplate#arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder arn(java.lang.String arn) {
            this.arn = arn;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightTemplateSourceEntitySourceAnalysis#getDataSetReferences}
         * @param dataSetReferences data_set_references block. This parameter is required.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_template#data_set_references QuicksightTemplate#data_set_references}
         * @return {@code this}
         */
        public Builder dataSetReferences(com.hashicorp.cdktf.IResolvable dataSetReferences) {
            this.dataSetReferences = dataSetReferences;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightTemplateSourceEntitySourceAnalysis#getDataSetReferences}
         * @param dataSetReferences data_set_references block. This parameter is required.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_template#data_set_references QuicksightTemplate#data_set_references}
         * @return {@code this}
         */
        public Builder dataSetReferences(java.util.List<? extends imports.aws.quicksight_template.QuicksightTemplateSourceEntitySourceAnalysisDataSetReferences> dataSetReferences) {
            this.dataSetReferences = dataSetReferences;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightTemplateSourceEntitySourceAnalysis}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightTemplateSourceEntitySourceAnalysis build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightTemplateSourceEntitySourceAnalysis}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightTemplateSourceEntitySourceAnalysis {
        private final java.lang.String arn;
        private final java.lang.Object dataSetReferences;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.arn = software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataSetReferences = software.amazon.jsii.Kernel.get(this, "dataSetReferences", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.arn = java.util.Objects.requireNonNull(builder.arn, "arn is required");
            this.dataSetReferences = java.util.Objects.requireNonNull(builder.dataSetReferences, "dataSetReferences is required");
        }

        @Override
        public final java.lang.String getArn() {
            return this.arn;
        }

        @Override
        public final java.lang.Object getDataSetReferences() {
            return this.dataSetReferences;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("arn", om.valueToTree(this.getArn()));
            data.set("dataSetReferences", om.valueToTree(this.getDataSetReferences()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightTemplate.QuicksightTemplateSourceEntitySourceAnalysis"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightTemplateSourceEntitySourceAnalysis.Jsii$Proxy that = (QuicksightTemplateSourceEntitySourceAnalysis.Jsii$Proxy) o;

            if (!arn.equals(that.arn)) return false;
            return this.dataSetReferences.equals(that.dataSetReferences);
        }

        @Override
        public final int hashCode() {
            int result = this.arn.hashCode();
            result = 31 * result + (this.dataSetReferences.hashCode());
            return result;
        }
    }
}
