package imports.aws.batch_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.132Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret")
@software.amazon.jsii.Jsii.Proxy(BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret.Jsii$Proxy.class)
public interface BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#secret_name BatchJobDefinition#secret_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSecretName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#optional BatchJobDefinition#optional}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOptional() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret> {
        java.lang.String secretName;
        java.lang.Object optional;

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret#getSecretName}
         * @param secretName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#secret_name BatchJobDefinition#secret_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder secretName(java.lang.String secretName) {
            this.secretName = secretName;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret#getOptional}
         * @param optional Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#optional BatchJobDefinition#optional}.
         * @return {@code this}
         */
        public Builder optional(java.lang.Boolean optional) {
            this.optional = optional;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret#getOptional}
         * @param optional Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#optional BatchJobDefinition#optional}.
         * @return {@code this}
         */
        public Builder optional(com.hashicorp.cdktf.IResolvable optional) {
            this.optional = optional;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret {
        private final java.lang.String secretName;
        private final java.lang.Object optional;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.secretName = software.amazon.jsii.Kernel.get(this, "secretName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.optional = software.amazon.jsii.Kernel.get(this, "optional", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.secretName = java.util.Objects.requireNonNull(builder.secretName, "secretName is required");
            this.optional = builder.optional;
        }

        @Override
        public final java.lang.String getSecretName() {
            return this.secretName;
        }

        @Override
        public final java.lang.Object getOptional() {
            return this.optional;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("secretName", om.valueToTree(this.getSecretName()));
            if (this.getOptional() != null) {
                data.set("optional", om.valueToTree(this.getOptional()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret.Jsii$Proxy that = (BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret.Jsii$Proxy) o;

            if (!secretName.equals(that.secretName)) return false;
            return this.optional != null ? this.optional.equals(that.optional) : that.optional == null;
        }

        @Override
        public final int hashCode() {
            int result = this.secretName.hashCode();
            result = 31 * result + (this.optional != null ? this.optional.hashCode() : 0);
            return result;
        }
    }
}
