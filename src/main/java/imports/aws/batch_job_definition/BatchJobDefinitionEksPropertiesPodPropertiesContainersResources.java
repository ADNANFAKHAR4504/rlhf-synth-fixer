package imports.aws.batch_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.130Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesContainersResources")
@software.amazon.jsii.Jsii.Proxy(BatchJobDefinitionEksPropertiesPodPropertiesContainersResources.Jsii$Proxy.class)
public interface BatchJobDefinitionEksPropertiesPodPropertiesContainersResources extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#limits BatchJobDefinition#limits}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getLimits() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#requests BatchJobDefinition#requests}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getRequests() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BatchJobDefinitionEksPropertiesPodPropertiesContainersResources}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchJobDefinitionEksPropertiesPodPropertiesContainersResources}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchJobDefinitionEksPropertiesPodPropertiesContainersResources> {
        java.util.Map<java.lang.String, java.lang.String> limits;
        java.util.Map<java.lang.String, java.lang.String> requests;

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesContainersResources#getLimits}
         * @param limits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#limits BatchJobDefinition#limits}.
         * @return {@code this}
         */
        public Builder limits(java.util.Map<java.lang.String, java.lang.String> limits) {
            this.limits = limits;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesContainersResources#getRequests}
         * @param requests Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#requests BatchJobDefinition#requests}.
         * @return {@code this}
         */
        public Builder requests(java.util.Map<java.lang.String, java.lang.String> requests) {
            this.requests = requests;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BatchJobDefinitionEksPropertiesPodPropertiesContainersResources}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchJobDefinitionEksPropertiesPodPropertiesContainersResources build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchJobDefinitionEksPropertiesPodPropertiesContainersResources}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchJobDefinitionEksPropertiesPodPropertiesContainersResources {
        private final java.util.Map<java.lang.String, java.lang.String> limits;
        private final java.util.Map<java.lang.String, java.lang.String> requests;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.limits = software.amazon.jsii.Kernel.get(this, "limits", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.requests = software.amazon.jsii.Kernel.get(this, "requests", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.limits = builder.limits;
            this.requests = builder.requests;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getLimits() {
            return this.limits;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getRequests() {
            return this.requests;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getLimits() != null) {
                data.set("limits", om.valueToTree(this.getLimits()));
            }
            if (this.getRequests() != null) {
                data.set("requests", om.valueToTree(this.getRequests()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesContainersResources"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchJobDefinitionEksPropertiesPodPropertiesContainersResources.Jsii$Proxy that = (BatchJobDefinitionEksPropertiesPodPropertiesContainersResources.Jsii$Proxy) o;

            if (this.limits != null ? !this.limits.equals(that.limits) : that.limits != null) return false;
            return this.requests != null ? this.requests.equals(that.requests) : that.requests == null;
        }

        @Override
        public final int hashCode() {
            int result = this.limits != null ? this.limits.hashCode() : 0;
            result = 31 * result + (this.requests != null ? this.requests.hashCode() : 0);
            return result;
        }
    }
}
