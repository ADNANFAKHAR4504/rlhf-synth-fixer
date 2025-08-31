package imports.aws.datapipeline_pipeline_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.940Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datapipelinePipelineDefinition.DatapipelinePipelineDefinitionParameterObject")
@software.amazon.jsii.Jsii.Proxy(DatapipelinePipelineDefinitionParameterObject.Jsii$Proxy.class)
public interface DatapipelinePipelineDefinitionParameterObject extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#id DatapipelinePipelineDefinition#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getId();

    /**
     * attribute block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#attribute DatapipelinePipelineDefinition#attribute}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAttribute() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatapipelinePipelineDefinitionParameterObject}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatapipelinePipelineDefinitionParameterObject}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatapipelinePipelineDefinitionParameterObject> {
        java.lang.String id;
        java.lang.Object attribute;

        /**
         * Sets the value of {@link DatapipelinePipelineDefinitionParameterObject#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#id DatapipelinePipelineDefinition#id}. This parameter is required.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DatapipelinePipelineDefinitionParameterObject#getAttribute}
         * @param attribute attribute block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#attribute DatapipelinePipelineDefinition#attribute}
         * @return {@code this}
         */
        public Builder attribute(com.hashicorp.cdktf.IResolvable attribute) {
            this.attribute = attribute;
            return this;
        }

        /**
         * Sets the value of {@link DatapipelinePipelineDefinitionParameterObject#getAttribute}
         * @param attribute attribute block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#attribute DatapipelinePipelineDefinition#attribute}
         * @return {@code this}
         */
        public Builder attribute(java.util.List<? extends imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionParameterObjectAttribute> attribute) {
            this.attribute = attribute;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatapipelinePipelineDefinitionParameterObject}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatapipelinePipelineDefinitionParameterObject build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatapipelinePipelineDefinitionParameterObject}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatapipelinePipelineDefinitionParameterObject {
        private final java.lang.String id;
        private final java.lang.Object attribute;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.attribute = software.amazon.jsii.Kernel.get(this, "attribute", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.id = java.util.Objects.requireNonNull(builder.id, "id is required");
            this.attribute = builder.attribute;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getAttribute() {
            return this.attribute;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("id", om.valueToTree(this.getId()));
            if (this.getAttribute() != null) {
                data.set("attribute", om.valueToTree(this.getAttribute()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datapipelinePipelineDefinition.DatapipelinePipelineDefinitionParameterObject"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatapipelinePipelineDefinitionParameterObject.Jsii$Proxy that = (DatapipelinePipelineDefinitionParameterObject.Jsii$Proxy) o;

            if (!id.equals(that.id)) return false;
            return this.attribute != null ? this.attribute.equals(that.attribute) : that.attribute == null;
        }

        @Override
        public final int hashCode() {
            int result = this.id.hashCode();
            result = 31 * result + (this.attribute != null ? this.attribute.hashCode() : 0);
            return result;
        }
    }
}
