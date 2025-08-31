package imports.aws.batch_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.131Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts")
@software.amazon.jsii.Jsii.Proxy(BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts.Jsii$Proxy.class)
public interface BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#mount_path BatchJobDefinition#mount_path}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMountPath();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#read_only BatchJobDefinition#read_only}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getReadOnly() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts> {
        java.lang.String mountPath;
        java.lang.String name;
        java.lang.Object readOnly;

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts#getMountPath}
         * @param mountPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#mount_path BatchJobDefinition#mount_path}. This parameter is required.
         * @return {@code this}
         */
        public Builder mountPath(java.lang.String mountPath) {
            this.mountPath = mountPath;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts#getReadOnly}
         * @param readOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#read_only BatchJobDefinition#read_only}.
         * @return {@code this}
         */
        public Builder readOnly(java.lang.Boolean readOnly) {
            this.readOnly = readOnly;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts#getReadOnly}
         * @param readOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#read_only BatchJobDefinition#read_only}.
         * @return {@code this}
         */
        public Builder readOnly(com.hashicorp.cdktf.IResolvable readOnly) {
            this.readOnly = readOnly;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts {
        private final java.lang.String mountPath;
        private final java.lang.String name;
        private final java.lang.Object readOnly;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.mountPath = software.amazon.jsii.Kernel.get(this, "mountPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.readOnly = software.amazon.jsii.Kernel.get(this, "readOnly", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.mountPath = java.util.Objects.requireNonNull(builder.mountPath, "mountPath is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.readOnly = builder.readOnly;
        }

        @Override
        public final java.lang.String getMountPath() {
            return this.mountPath;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getReadOnly() {
            return this.readOnly;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("mountPath", om.valueToTree(this.getMountPath()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getReadOnly() != null) {
                data.set("readOnly", om.valueToTree(this.getReadOnly()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts.Jsii$Proxy that = (BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts.Jsii$Proxy) o;

            if (!mountPath.equals(that.mountPath)) return false;
            if (!name.equals(that.name)) return false;
            return this.readOnly != null ? this.readOnly.equals(that.readOnly) : that.readOnly == null;
        }

        @Override
        public final int hashCode() {
            int result = this.mountPath.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.readOnly != null ? this.readOnly.hashCode() : 0);
            return result;
        }
    }
}
