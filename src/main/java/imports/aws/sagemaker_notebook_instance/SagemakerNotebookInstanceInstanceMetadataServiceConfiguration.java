package imports.aws.sagemaker_notebook_instance;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.338Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerNotebookInstance.SagemakerNotebookInstanceInstanceMetadataServiceConfiguration")
@software.amazon.jsii.Jsii.Proxy(SagemakerNotebookInstanceInstanceMetadataServiceConfiguration.Jsii$Proxy.class)
public interface SagemakerNotebookInstanceInstanceMetadataServiceConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#minimum_instance_metadata_service_version SagemakerNotebookInstance#minimum_instance_metadata_service_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMinimumInstanceMetadataServiceVersion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerNotebookInstanceInstanceMetadataServiceConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerNotebookInstanceInstanceMetadataServiceConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerNotebookInstanceInstanceMetadataServiceConfiguration> {
        java.lang.String minimumInstanceMetadataServiceVersion;

        /**
         * Sets the value of {@link SagemakerNotebookInstanceInstanceMetadataServiceConfiguration#getMinimumInstanceMetadataServiceVersion}
         * @param minimumInstanceMetadataServiceVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_notebook_instance#minimum_instance_metadata_service_version SagemakerNotebookInstance#minimum_instance_metadata_service_version}.
         * @return {@code this}
         */
        public Builder minimumInstanceMetadataServiceVersion(java.lang.String minimumInstanceMetadataServiceVersion) {
            this.minimumInstanceMetadataServiceVersion = minimumInstanceMetadataServiceVersion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerNotebookInstanceInstanceMetadataServiceConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerNotebookInstanceInstanceMetadataServiceConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerNotebookInstanceInstanceMetadataServiceConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerNotebookInstanceInstanceMetadataServiceConfiguration {
        private final java.lang.String minimumInstanceMetadataServiceVersion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.minimumInstanceMetadataServiceVersion = software.amazon.jsii.Kernel.get(this, "minimumInstanceMetadataServiceVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.minimumInstanceMetadataServiceVersion = builder.minimumInstanceMetadataServiceVersion;
        }

        @Override
        public final java.lang.String getMinimumInstanceMetadataServiceVersion() {
            return this.minimumInstanceMetadataServiceVersion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMinimumInstanceMetadataServiceVersion() != null) {
                data.set("minimumInstanceMetadataServiceVersion", om.valueToTree(this.getMinimumInstanceMetadataServiceVersion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerNotebookInstance.SagemakerNotebookInstanceInstanceMetadataServiceConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerNotebookInstanceInstanceMetadataServiceConfiguration.Jsii$Proxy that = (SagemakerNotebookInstanceInstanceMetadataServiceConfiguration.Jsii$Proxy) o;

            return this.minimumInstanceMetadataServiceVersion != null ? this.minimumInstanceMetadataServiceVersion.equals(that.minimumInstanceMetadataServiceVersion) : that.minimumInstanceMetadataServiceVersion == null;
        }

        @Override
        public final int hashCode() {
            int result = this.minimumInstanceMetadataServiceVersion != null ? this.minimumInstanceMetadataServiceVersion.hashCode() : 0;
            return result;
        }
    }
}
