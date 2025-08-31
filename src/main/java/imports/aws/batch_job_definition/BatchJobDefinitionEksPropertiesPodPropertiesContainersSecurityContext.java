package imports.aws.batch_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.130Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext")
@software.amazon.jsii.Jsii.Proxy(BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext.Jsii$Proxy.class)
public interface BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#privileged BatchJobDefinition#privileged}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPrivileged() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#read_only_root_file_system BatchJobDefinition#read_only_root_file_system}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getReadOnlyRootFileSystem() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_group BatchJobDefinition#run_as_group}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRunAsGroup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_non_root BatchJobDefinition#run_as_non_root}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRunAsNonRoot() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_user BatchJobDefinition#run_as_user}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRunAsUser() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext> {
        java.lang.Object privileged;
        java.lang.Object readOnlyRootFileSystem;
        java.lang.Number runAsGroup;
        java.lang.Object runAsNonRoot;
        java.lang.Number runAsUser;

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext#getPrivileged}
         * @param privileged Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#privileged BatchJobDefinition#privileged}.
         * @return {@code this}
         */
        public Builder privileged(java.lang.Boolean privileged) {
            this.privileged = privileged;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext#getPrivileged}
         * @param privileged Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#privileged BatchJobDefinition#privileged}.
         * @return {@code this}
         */
        public Builder privileged(com.hashicorp.cdktf.IResolvable privileged) {
            this.privileged = privileged;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext#getReadOnlyRootFileSystem}
         * @param readOnlyRootFileSystem Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#read_only_root_file_system BatchJobDefinition#read_only_root_file_system}.
         * @return {@code this}
         */
        public Builder readOnlyRootFileSystem(java.lang.Boolean readOnlyRootFileSystem) {
            this.readOnlyRootFileSystem = readOnlyRootFileSystem;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext#getReadOnlyRootFileSystem}
         * @param readOnlyRootFileSystem Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#read_only_root_file_system BatchJobDefinition#read_only_root_file_system}.
         * @return {@code this}
         */
        public Builder readOnlyRootFileSystem(com.hashicorp.cdktf.IResolvable readOnlyRootFileSystem) {
            this.readOnlyRootFileSystem = readOnlyRootFileSystem;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext#getRunAsGroup}
         * @param runAsGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_group BatchJobDefinition#run_as_group}.
         * @return {@code this}
         */
        public Builder runAsGroup(java.lang.Number runAsGroup) {
            this.runAsGroup = runAsGroup;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext#getRunAsNonRoot}
         * @param runAsNonRoot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_non_root BatchJobDefinition#run_as_non_root}.
         * @return {@code this}
         */
        public Builder runAsNonRoot(java.lang.Boolean runAsNonRoot) {
            this.runAsNonRoot = runAsNonRoot;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext#getRunAsNonRoot}
         * @param runAsNonRoot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_non_root BatchJobDefinition#run_as_non_root}.
         * @return {@code this}
         */
        public Builder runAsNonRoot(com.hashicorp.cdktf.IResolvable runAsNonRoot) {
            this.runAsNonRoot = runAsNonRoot;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext#getRunAsUser}
         * @param runAsUser Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_user BatchJobDefinition#run_as_user}.
         * @return {@code this}
         */
        public Builder runAsUser(java.lang.Number runAsUser) {
            this.runAsUser = runAsUser;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext {
        private final java.lang.Object privileged;
        private final java.lang.Object readOnlyRootFileSystem;
        private final java.lang.Number runAsGroup;
        private final java.lang.Object runAsNonRoot;
        private final java.lang.Number runAsUser;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.privileged = software.amazon.jsii.Kernel.get(this, "privileged", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.readOnlyRootFileSystem = software.amazon.jsii.Kernel.get(this, "readOnlyRootFileSystem", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.runAsGroup = software.amazon.jsii.Kernel.get(this, "runAsGroup", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.runAsNonRoot = software.amazon.jsii.Kernel.get(this, "runAsNonRoot", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.runAsUser = software.amazon.jsii.Kernel.get(this, "runAsUser", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.privileged = builder.privileged;
            this.readOnlyRootFileSystem = builder.readOnlyRootFileSystem;
            this.runAsGroup = builder.runAsGroup;
            this.runAsNonRoot = builder.runAsNonRoot;
            this.runAsUser = builder.runAsUser;
        }

        @Override
        public final java.lang.Object getPrivileged() {
            return this.privileged;
        }

        @Override
        public final java.lang.Object getReadOnlyRootFileSystem() {
            return this.readOnlyRootFileSystem;
        }

        @Override
        public final java.lang.Number getRunAsGroup() {
            return this.runAsGroup;
        }

        @Override
        public final java.lang.Object getRunAsNonRoot() {
            return this.runAsNonRoot;
        }

        @Override
        public final java.lang.Number getRunAsUser() {
            return this.runAsUser;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getPrivileged() != null) {
                data.set("privileged", om.valueToTree(this.getPrivileged()));
            }
            if (this.getReadOnlyRootFileSystem() != null) {
                data.set("readOnlyRootFileSystem", om.valueToTree(this.getReadOnlyRootFileSystem()));
            }
            if (this.getRunAsGroup() != null) {
                data.set("runAsGroup", om.valueToTree(this.getRunAsGroup()));
            }
            if (this.getRunAsNonRoot() != null) {
                data.set("runAsNonRoot", om.valueToTree(this.getRunAsNonRoot()));
            }
            if (this.getRunAsUser() != null) {
                data.set("runAsUser", om.valueToTree(this.getRunAsUser()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext.Jsii$Proxy that = (BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext.Jsii$Proxy) o;

            if (this.privileged != null ? !this.privileged.equals(that.privileged) : that.privileged != null) return false;
            if (this.readOnlyRootFileSystem != null ? !this.readOnlyRootFileSystem.equals(that.readOnlyRootFileSystem) : that.readOnlyRootFileSystem != null) return false;
            if (this.runAsGroup != null ? !this.runAsGroup.equals(that.runAsGroup) : that.runAsGroup != null) return false;
            if (this.runAsNonRoot != null ? !this.runAsNonRoot.equals(that.runAsNonRoot) : that.runAsNonRoot != null) return false;
            return this.runAsUser != null ? this.runAsUser.equals(that.runAsUser) : that.runAsUser == null;
        }

        @Override
        public final int hashCode() {
            int result = this.privileged != null ? this.privileged.hashCode() : 0;
            result = 31 * result + (this.readOnlyRootFileSystem != null ? this.readOnlyRootFileSystem.hashCode() : 0);
            result = 31 * result + (this.runAsGroup != null ? this.runAsGroup.hashCode() : 0);
            result = 31 * result + (this.runAsNonRoot != null ? this.runAsNonRoot.hashCode() : 0);
            result = 31 * result + (this.runAsUser != null ? this.runAsUser.hashCode() : 0);
            return result;
        }
    }
}
