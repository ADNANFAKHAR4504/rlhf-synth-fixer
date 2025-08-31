package imports.aws.batch_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.132Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesVolumes")
@software.amazon.jsii.Jsii.Proxy(BatchJobDefinitionEksPropertiesPodPropertiesVolumes.Jsii$Proxy.class)
public interface BatchJobDefinitionEksPropertiesPodPropertiesVolumes extends software.amazon.jsii.JsiiSerializable {

    /**
     * empty_dir block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#empty_dir BatchJobDefinition#empty_dir}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir getEmptyDir() {
        return null;
    }

    /**
     * host_path block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#host_path BatchJobDefinition#host_path}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath getHostPath() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * secret block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#secret BatchJobDefinition#secret}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret getSecret() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BatchJobDefinitionEksPropertiesPodPropertiesVolumes}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchJobDefinitionEksPropertiesPodPropertiesVolumes}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchJobDefinitionEksPropertiesPodPropertiesVolumes> {
        imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir emptyDir;
        imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath hostPath;
        java.lang.String name;
        imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret secret;

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesVolumes#getEmptyDir}
         * @param emptyDir empty_dir block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#empty_dir BatchJobDefinition#empty_dir}
         * @return {@code this}
         */
        public Builder emptyDir(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir emptyDir) {
            this.emptyDir = emptyDir;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesVolumes#getHostPath}
         * @param hostPath host_path block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#host_path BatchJobDefinition#host_path}
         * @return {@code this}
         */
        public Builder hostPath(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath hostPath) {
            this.hostPath = hostPath;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesVolumes#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesVolumes#getSecret}
         * @param secret secret block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#secret BatchJobDefinition#secret}
         * @return {@code this}
         */
        public Builder secret(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret secret) {
            this.secret = secret;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BatchJobDefinitionEksPropertiesPodPropertiesVolumes}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchJobDefinitionEksPropertiesPodPropertiesVolumes build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchJobDefinitionEksPropertiesPodPropertiesVolumes}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchJobDefinitionEksPropertiesPodPropertiesVolumes {
        private final imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir emptyDir;
        private final imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath hostPath;
        private final java.lang.String name;
        private final imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret secret;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.emptyDir = software.amazon.jsii.Kernel.get(this, "emptyDir", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir.class));
            this.hostPath = software.amazon.jsii.Kernel.get(this, "hostPath", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secret = software.amazon.jsii.Kernel.get(this, "secret", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.emptyDir = builder.emptyDir;
            this.hostPath = builder.hostPath;
            this.name = builder.name;
            this.secret = builder.secret;
        }

        @Override
        public final imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir getEmptyDir() {
            return this.emptyDir;
        }

        @Override
        public final imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath getHostPath() {
            return this.hostPath;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret getSecret() {
            return this.secret;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEmptyDir() != null) {
                data.set("emptyDir", om.valueToTree(this.getEmptyDir()));
            }
            if (this.getHostPath() != null) {
                data.set("hostPath", om.valueToTree(this.getHostPath()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getSecret() != null) {
                data.set("secret", om.valueToTree(this.getSecret()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesVolumes"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchJobDefinitionEksPropertiesPodPropertiesVolumes.Jsii$Proxy that = (BatchJobDefinitionEksPropertiesPodPropertiesVolumes.Jsii$Proxy) o;

            if (this.emptyDir != null ? !this.emptyDir.equals(that.emptyDir) : that.emptyDir != null) return false;
            if (this.hostPath != null ? !this.hostPath.equals(that.hostPath) : that.hostPath != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            return this.secret != null ? this.secret.equals(that.secret) : that.secret == null;
        }

        @Override
        public final int hashCode() {
            int result = this.emptyDir != null ? this.emptyDir.hashCode() : 0;
            result = 31 * result + (this.hostPath != null ? this.hostPath.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.secret != null ? this.secret.hashCode() : 0);
            return result;
        }
    }
}
