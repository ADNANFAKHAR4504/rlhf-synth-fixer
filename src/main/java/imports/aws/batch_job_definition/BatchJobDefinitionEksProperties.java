package imports.aws.batch_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.130Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobDefinition.BatchJobDefinitionEksProperties")
@software.amazon.jsii.Jsii.Proxy(BatchJobDefinitionEksProperties.Jsii$Proxy.class)
public interface BatchJobDefinitionEksProperties extends software.amazon.jsii.JsiiSerializable {

    /**
     * pod_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#pod_properties BatchJobDefinition#pod_properties}
     */
    @org.jetbrains.annotations.NotNull imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodProperties getPodProperties();

    /**
     * @return a {@link Builder} of {@link BatchJobDefinitionEksProperties}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchJobDefinitionEksProperties}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchJobDefinitionEksProperties> {
        imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodProperties podProperties;

        /**
         * Sets the value of {@link BatchJobDefinitionEksProperties#getPodProperties}
         * @param podProperties pod_properties block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#pod_properties BatchJobDefinition#pod_properties}
         * @return {@code this}
         */
        public Builder podProperties(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodProperties podProperties) {
            this.podProperties = podProperties;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BatchJobDefinitionEksProperties}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchJobDefinitionEksProperties build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchJobDefinitionEksProperties}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchJobDefinitionEksProperties {
        private final imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodProperties podProperties;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.podProperties = software.amazon.jsii.Kernel.get(this, "podProperties", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodProperties.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.podProperties = java.util.Objects.requireNonNull(builder.podProperties, "podProperties is required");
        }

        @Override
        public final imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodProperties getPodProperties() {
            return this.podProperties;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("podProperties", om.valueToTree(this.getPodProperties()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.batchJobDefinition.BatchJobDefinitionEksProperties"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchJobDefinitionEksProperties.Jsii$Proxy that = (BatchJobDefinitionEksProperties.Jsii$Proxy) o;

            return this.podProperties.equals(that.podProperties);
        }

        @Override
        public final int hashCode() {
            int result = this.podProperties.hashCode();
            return result;
        }
    }
}
