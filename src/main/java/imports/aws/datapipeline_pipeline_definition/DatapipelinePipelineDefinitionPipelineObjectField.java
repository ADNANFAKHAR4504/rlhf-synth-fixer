package imports.aws.datapipeline_pipeline_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.940Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datapipelinePipelineDefinition.DatapipelinePipelineDefinitionPipelineObjectField")
@software.amazon.jsii.Jsii.Proxy(DatapipelinePipelineDefinitionPipelineObjectField.Jsii$Proxy.class)
public interface DatapipelinePipelineDefinitionPipelineObjectField extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#key DatapipelinePipelineDefinition#key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#ref_value DatapipelinePipelineDefinition#ref_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRefValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#string_value DatapipelinePipelineDefinition#string_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStringValue() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatapipelinePipelineDefinitionPipelineObjectField}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatapipelinePipelineDefinitionPipelineObjectField}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatapipelinePipelineDefinitionPipelineObjectField> {
        java.lang.String key;
        java.lang.String refValue;
        java.lang.String stringValue;

        /**
         * Sets the value of {@link DatapipelinePipelineDefinitionPipelineObjectField#getKey}
         * @param key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#key DatapipelinePipelineDefinition#key}. This parameter is required.
         * @return {@code this}
         */
        public Builder key(java.lang.String key) {
            this.key = key;
            return this;
        }

        /**
         * Sets the value of {@link DatapipelinePipelineDefinitionPipelineObjectField#getRefValue}
         * @param refValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#ref_value DatapipelinePipelineDefinition#ref_value}.
         * @return {@code this}
         */
        public Builder refValue(java.lang.String refValue) {
            this.refValue = refValue;
            return this;
        }

        /**
         * Sets the value of {@link DatapipelinePipelineDefinitionPipelineObjectField#getStringValue}
         * @param stringValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datapipeline_pipeline_definition#string_value DatapipelinePipelineDefinition#string_value}.
         * @return {@code this}
         */
        public Builder stringValue(java.lang.String stringValue) {
            this.stringValue = stringValue;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatapipelinePipelineDefinitionPipelineObjectField}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatapipelinePipelineDefinitionPipelineObjectField build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatapipelinePipelineDefinitionPipelineObjectField}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatapipelinePipelineDefinitionPipelineObjectField {
        private final java.lang.String key;
        private final java.lang.String refValue;
        private final java.lang.String stringValue;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.key = software.amazon.jsii.Kernel.get(this, "key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.refValue = software.amazon.jsii.Kernel.get(this, "refValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.stringValue = software.amazon.jsii.Kernel.get(this, "stringValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.key = java.util.Objects.requireNonNull(builder.key, "key is required");
            this.refValue = builder.refValue;
            this.stringValue = builder.stringValue;
        }

        @Override
        public final java.lang.String getKey() {
            return this.key;
        }

        @Override
        public final java.lang.String getRefValue() {
            return this.refValue;
        }

        @Override
        public final java.lang.String getStringValue() {
            return this.stringValue;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("key", om.valueToTree(this.getKey()));
            if (this.getRefValue() != null) {
                data.set("refValue", om.valueToTree(this.getRefValue()));
            }
            if (this.getStringValue() != null) {
                data.set("stringValue", om.valueToTree(this.getStringValue()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datapipelinePipelineDefinition.DatapipelinePipelineDefinitionPipelineObjectField"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatapipelinePipelineDefinitionPipelineObjectField.Jsii$Proxy that = (DatapipelinePipelineDefinitionPipelineObjectField.Jsii$Proxy) o;

            if (!key.equals(that.key)) return false;
            if (this.refValue != null ? !this.refValue.equals(that.refValue) : that.refValue != null) return false;
            return this.stringValue != null ? this.stringValue.equals(that.stringValue) : that.stringValue == null;
        }

        @Override
        public final int hashCode() {
            int result = this.key.hashCode();
            result = 31 * result + (this.refValue != null ? this.refValue.hashCode() : 0);
            result = 31 * result + (this.stringValue != null ? this.stringValue.hashCode() : 0);
            return result;
        }
    }
}
