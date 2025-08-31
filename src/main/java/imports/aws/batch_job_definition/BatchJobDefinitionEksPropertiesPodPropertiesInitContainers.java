package imports.aws.batch_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.131Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainers")
@software.amazon.jsii.Jsii.Proxy(BatchJobDefinitionEksPropertiesPodPropertiesInitContainers.Jsii$Proxy.class)
public interface BatchJobDefinitionEksPropertiesPodPropertiesInitContainers extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#image BatchJobDefinition#image}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getImage();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#args BatchJobDefinition#args}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getArgs() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#command BatchJobDefinition#command}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCommand() {
        return null;
    }

    /**
     * env block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#env BatchJobDefinition#env}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnv() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#image_pull_policy BatchJobDefinition#image_pull_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getImagePullPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * resources block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#resources BatchJobDefinition#resources}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources getResources() {
        return null;
    }

    /**
     * security_context block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#security_context BatchJobDefinition#security_context}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext getSecurityContext() {
        return null;
    }

    /**
     * volume_mounts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#volume_mounts BatchJobDefinition#volume_mounts}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVolumeMounts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainers}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainers}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchJobDefinitionEksPropertiesPodPropertiesInitContainers> {
        java.lang.String image;
        java.util.List<java.lang.String> args;
        java.util.List<java.lang.String> command;
        java.lang.Object env;
        java.lang.String imagePullPolicy;
        java.lang.String name;
        imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources resources;
        imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext securityContext;
        java.lang.Object volumeMounts;

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainers#getImage}
         * @param image Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#image BatchJobDefinition#image}. This parameter is required.
         * @return {@code this}
         */
        public Builder image(java.lang.String image) {
            this.image = image;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainers#getArgs}
         * @param args Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#args BatchJobDefinition#args}.
         * @return {@code this}
         */
        public Builder args(java.util.List<java.lang.String> args) {
            this.args = args;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainers#getCommand}
         * @param command Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#command BatchJobDefinition#command}.
         * @return {@code this}
         */
        public Builder command(java.util.List<java.lang.String> command) {
            this.command = command;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainers#getEnv}
         * @param env env block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#env BatchJobDefinition#env}
         * @return {@code this}
         */
        public Builder env(com.hashicorp.cdktf.IResolvable env) {
            this.env = env;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainers#getEnv}
         * @param env env block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#env BatchJobDefinition#env}
         * @return {@code this}
         */
        public Builder env(java.util.List<? extends imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv> env) {
            this.env = env;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainers#getImagePullPolicy}
         * @param imagePullPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#image_pull_policy BatchJobDefinition#image_pull_policy}.
         * @return {@code this}
         */
        public Builder imagePullPolicy(java.lang.String imagePullPolicy) {
            this.imagePullPolicy = imagePullPolicy;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainers#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainers#getResources}
         * @param resources resources block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#resources BatchJobDefinition#resources}
         * @return {@code this}
         */
        public Builder resources(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources resources) {
            this.resources = resources;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainers#getSecurityContext}
         * @param securityContext security_context block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#security_context BatchJobDefinition#security_context}
         * @return {@code this}
         */
        public Builder securityContext(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext securityContext) {
            this.securityContext = securityContext;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainers#getVolumeMounts}
         * @param volumeMounts volume_mounts block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#volume_mounts BatchJobDefinition#volume_mounts}
         * @return {@code this}
         */
        public Builder volumeMounts(com.hashicorp.cdktf.IResolvable volumeMounts) {
            this.volumeMounts = volumeMounts;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainers#getVolumeMounts}
         * @param volumeMounts volume_mounts block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#volume_mounts BatchJobDefinition#volume_mounts}
         * @return {@code this}
         */
        public Builder volumeMounts(java.util.List<? extends imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts> volumeMounts) {
            this.volumeMounts = volumeMounts;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainers}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchJobDefinitionEksPropertiesPodPropertiesInitContainers build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchJobDefinitionEksPropertiesPodPropertiesInitContainers}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchJobDefinitionEksPropertiesPodPropertiesInitContainers {
        private final java.lang.String image;
        private final java.util.List<java.lang.String> args;
        private final java.util.List<java.lang.String> command;
        private final java.lang.Object env;
        private final java.lang.String imagePullPolicy;
        private final java.lang.String name;
        private final imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources resources;
        private final imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext securityContext;
        private final java.lang.Object volumeMounts;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.image = software.amazon.jsii.Kernel.get(this, "image", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.args = software.amazon.jsii.Kernel.get(this, "args", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.command = software.amazon.jsii.Kernel.get(this, "command", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.env = software.amazon.jsii.Kernel.get(this, "env", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.imagePullPolicy = software.amazon.jsii.Kernel.get(this, "imagePullPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resources = software.amazon.jsii.Kernel.get(this, "resources", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources.class));
            this.securityContext = software.amazon.jsii.Kernel.get(this, "securityContext", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext.class));
            this.volumeMounts = software.amazon.jsii.Kernel.get(this, "volumeMounts", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.image = java.util.Objects.requireNonNull(builder.image, "image is required");
            this.args = builder.args;
            this.command = builder.command;
            this.env = builder.env;
            this.imagePullPolicy = builder.imagePullPolicy;
            this.name = builder.name;
            this.resources = builder.resources;
            this.securityContext = builder.securityContext;
            this.volumeMounts = builder.volumeMounts;
        }

        @Override
        public final java.lang.String getImage() {
            return this.image;
        }

        @Override
        public final java.util.List<java.lang.String> getArgs() {
            return this.args;
        }

        @Override
        public final java.util.List<java.lang.String> getCommand() {
            return this.command;
        }

        @Override
        public final java.lang.Object getEnv() {
            return this.env;
        }

        @Override
        public final java.lang.String getImagePullPolicy() {
            return this.imagePullPolicy;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources getResources() {
            return this.resources;
        }

        @Override
        public final imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext getSecurityContext() {
            return this.securityContext;
        }

        @Override
        public final java.lang.Object getVolumeMounts() {
            return this.volumeMounts;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("image", om.valueToTree(this.getImage()));
            if (this.getArgs() != null) {
                data.set("args", om.valueToTree(this.getArgs()));
            }
            if (this.getCommand() != null) {
                data.set("command", om.valueToTree(this.getCommand()));
            }
            if (this.getEnv() != null) {
                data.set("env", om.valueToTree(this.getEnv()));
            }
            if (this.getImagePullPolicy() != null) {
                data.set("imagePullPolicy", om.valueToTree(this.getImagePullPolicy()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getResources() != null) {
                data.set("resources", om.valueToTree(this.getResources()));
            }
            if (this.getSecurityContext() != null) {
                data.set("securityContext", om.valueToTree(this.getSecurityContext()));
            }
            if (this.getVolumeMounts() != null) {
                data.set("volumeMounts", om.valueToTree(this.getVolumeMounts()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainers"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchJobDefinitionEksPropertiesPodPropertiesInitContainers.Jsii$Proxy that = (BatchJobDefinitionEksPropertiesPodPropertiesInitContainers.Jsii$Proxy) o;

            if (!image.equals(that.image)) return false;
            if (this.args != null ? !this.args.equals(that.args) : that.args != null) return false;
            if (this.command != null ? !this.command.equals(that.command) : that.command != null) return false;
            if (this.env != null ? !this.env.equals(that.env) : that.env != null) return false;
            if (this.imagePullPolicy != null ? !this.imagePullPolicy.equals(that.imagePullPolicy) : that.imagePullPolicy != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.resources != null ? !this.resources.equals(that.resources) : that.resources != null) return false;
            if (this.securityContext != null ? !this.securityContext.equals(that.securityContext) : that.securityContext != null) return false;
            return this.volumeMounts != null ? this.volumeMounts.equals(that.volumeMounts) : that.volumeMounts == null;
        }

        @Override
        public final int hashCode() {
            int result = this.image.hashCode();
            result = 31 * result + (this.args != null ? this.args.hashCode() : 0);
            result = 31 * result + (this.command != null ? this.command.hashCode() : 0);
            result = 31 * result + (this.env != null ? this.env.hashCode() : 0);
            result = 31 * result + (this.imagePullPolicy != null ? this.imagePullPolicy.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.resources != null ? this.resources.hashCode() : 0);
            result = 31 * result + (this.securityContext != null ? this.securityContext.hashCode() : 0);
            result = 31 * result + (this.volumeMounts != null ? this.volumeMounts.hashCode() : 0);
            return result;
        }
    }
}
