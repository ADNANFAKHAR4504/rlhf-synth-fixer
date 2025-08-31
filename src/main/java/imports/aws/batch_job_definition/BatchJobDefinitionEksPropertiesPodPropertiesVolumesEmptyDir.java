package imports.aws.batch_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.132Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir")
@software.amazon.jsii.Jsii.Proxy(BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir.Jsii$Proxy.class)
public interface BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#size_limit BatchJobDefinition#size_limit}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSizeLimit();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#medium BatchJobDefinition#medium}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMedium() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir> {
        java.lang.String sizeLimit;
        java.lang.String medium;

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir#getSizeLimit}
         * @param sizeLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#size_limit BatchJobDefinition#size_limit}. This parameter is required.
         * @return {@code this}
         */
        public Builder sizeLimit(java.lang.String sizeLimit) {
            this.sizeLimit = sizeLimit;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir#getMedium}
         * @param medium Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#medium BatchJobDefinition#medium}.
         * @return {@code this}
         */
        public Builder medium(java.lang.String medium) {
            this.medium = medium;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir {
        private final java.lang.String sizeLimit;
        private final java.lang.String medium;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sizeLimit = software.amazon.jsii.Kernel.get(this, "sizeLimit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.medium = software.amazon.jsii.Kernel.get(this, "medium", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sizeLimit = java.util.Objects.requireNonNull(builder.sizeLimit, "sizeLimit is required");
            this.medium = builder.medium;
        }

        @Override
        public final java.lang.String getSizeLimit() {
            return this.sizeLimit;
        }

        @Override
        public final java.lang.String getMedium() {
            return this.medium;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("sizeLimit", om.valueToTree(this.getSizeLimit()));
            if (this.getMedium() != null) {
                data.set("medium", om.valueToTree(this.getMedium()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir.Jsii$Proxy that = (BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir.Jsii$Proxy) o;

            if (!sizeLimit.equals(that.sizeLimit)) return false;
            return this.medium != null ? this.medium.equals(that.medium) : that.medium == null;
        }

        @Override
        public final int hashCode() {
            int result = this.sizeLimit.hashCode();
            result = 31 * result + (this.medium != null ? this.medium.hashCode() : 0);
            return result;
        }
    }
}
