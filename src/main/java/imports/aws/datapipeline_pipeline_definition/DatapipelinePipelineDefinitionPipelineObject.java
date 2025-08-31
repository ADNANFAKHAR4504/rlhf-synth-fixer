package imports.aws.datapipeline_pipeline_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.940Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datapipelinePipelineDefinition.DatapipelinePipelineDefinitionPipelineObject")
@software.amazon.jsii.Jsii.Proxy(DatapipelinePipelineDefinitionPipelineObject.Jsii$Proxy.class)
public interface DatapipelinePipelineDefinitionPipelineObject extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#id DatapipelinePipelineDefinition#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#name DatapipelinePipelineDefinition#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * field block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#field DatapipelinePipelineDefinition#field}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getField() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatapipelinePipelineDefinitionPipelineObject}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatapipelinePipelineDefinitionPipelineObject}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatapipelinePipelineDefinitionPipelineObject> {
        java.lang.String id;
        java.lang.String name;
        java.lang.Object field;

        /**
         * Sets the value of {@link DatapipelinePipelineDefinitionPipelineObject#getId}
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
         * Sets the value of {@link DatapipelinePipelineDefinitionPipelineObject#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#name DatapipelinePipelineDefinition#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link DatapipelinePipelineDefinitionPipelineObject#getField}
         * @param field field block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#field DatapipelinePipelineDefinition#field}
         * @return {@code this}
         */
        public Builder field(com.hashicorp.cdktf.IResolvable field) {
            this.field = field;
            return this;
        }

        /**
         * Sets the value of {@link DatapipelinePipelineDefinitionPipelineObject#getField}
         * @param field field block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#field DatapipelinePipelineDefinition#field}
         * @return {@code this}
         */
        public Builder field(java.util.List<? extends imports.aws.datapipeline_pipeline_definition.DatapipelinePipelineDefinitionPipelineObjectField> field) {
            this.field = field;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatapipelinePipelineDefinitionPipelineObject}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatapipelinePipelineDefinitionPipelineObject build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatapipelinePipelineDefinitionPipelineObject}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatapipelinePipelineDefinitionPipelineObject {
        private final java.lang.String id;
        private final java.lang.String name;
        private final java.lang.Object field;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.field = software.amazon.jsii.Kernel.get(this, "field", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.id = java.util.Objects.requireNonNull(builder.id, "id is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.field = builder.field;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getField() {
            return this.field;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("id", om.valueToTree(this.getId()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getField() != null) {
                data.set("field", om.valueToTree(this.getField()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datapipelinePipelineDefinition.DatapipelinePipelineDefinitionPipelineObject"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatapipelinePipelineDefinitionPipelineObject.Jsii$Proxy that = (DatapipelinePipelineDefinitionPipelineObject.Jsii$Proxy) o;

            if (!id.equals(that.id)) return false;
            if (!name.equals(that.name)) return false;
            return this.field != null ? this.field.equals(that.field) : that.field == null;
        }

        @Override
        public final int hashCode() {
            int result = this.id.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.field != null ? this.field.hashCode() : 0);
            return result;
        }
    }
}
