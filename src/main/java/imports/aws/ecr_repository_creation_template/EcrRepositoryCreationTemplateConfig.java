package imports.aws.ecr_repository_creation_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.122Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecrRepositoryCreationTemplate.EcrRepositoryCreationTemplateConfig")
@software.amazon.jsii.Jsii.Proxy(EcrRepositoryCreationTemplateConfig.Jsii$Proxy.class)
public interface EcrRepositoryCreationTemplateConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#applied_for EcrRepositoryCreationTemplate#applied_for}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAppliedFor();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#prefix EcrRepositoryCreationTemplate#prefix}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPrefix();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#custom_role_arn EcrRepositoryCreationTemplate#custom_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#description EcrRepositoryCreationTemplate#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * encryption_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#encryption_configuration EcrRepositoryCreationTemplate#encryption_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEncryptionConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#id EcrRepositoryCreationTemplate#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#image_tag_mutability EcrRepositoryCreationTemplate#image_tag_mutability}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getImageTagMutability() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#lifecycle_policy EcrRepositoryCreationTemplate#lifecycle_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLifecyclePolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#repository_policy EcrRepositoryCreationTemplate#repository_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRepositoryPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#resource_tags EcrRepositoryCreationTemplate#resource_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getResourceTags() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcrRepositoryCreationTemplateConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcrRepositoryCreationTemplateConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcrRepositoryCreationTemplateConfig> {
        java.util.List<java.lang.String> appliedFor;
        java.lang.String prefix;
        java.lang.String customRoleArn;
        java.lang.String description;
        java.lang.Object encryptionConfiguration;
        java.lang.String id;
        java.lang.String imageTagMutability;
        java.lang.String lifecyclePolicy;
        java.lang.String repositoryPolicy;
        java.util.Map<java.lang.String, java.lang.String> resourceTags;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link EcrRepositoryCreationTemplateConfig#getAppliedFor}
         * @param appliedFor Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#applied_for EcrRepositoryCreationTemplate#applied_for}. This parameter is required.
         * @return {@code this}
         */
        public Builder appliedFor(java.util.List<java.lang.String> appliedFor) {
            this.appliedFor = appliedFor;
            return this;
        }

        /**
         * Sets the value of {@link EcrRepositoryCreationTemplateConfig#getPrefix}
         * @param prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#prefix EcrRepositoryCreationTemplate#prefix}. This parameter is required.
         * @return {@code this}
         */
        public Builder prefix(java.lang.String prefix) {
            this.prefix = prefix;
            return this;
        }

        /**
         * Sets the value of {@link EcrRepositoryCreationTemplateConfig#getCustomRoleArn}
         * @param customRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#custom_role_arn EcrRepositoryCreationTemplate#custom_role_arn}.
         * @return {@code this}
         */
        public Builder customRoleArn(java.lang.String customRoleArn) {
            this.customRoleArn = customRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link EcrRepositoryCreationTemplateConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#description EcrRepositoryCreationTemplate#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link EcrRepositoryCreationTemplateConfig#getEncryptionConfiguration}
         * @param encryptionConfiguration encryption_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#encryption_configuration EcrRepositoryCreationTemplate#encryption_configuration}
         * @return {@code this}
         */
        public Builder encryptionConfiguration(com.hashicorp.cdktf.IResolvable encryptionConfiguration) {
            this.encryptionConfiguration = encryptionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link EcrRepositoryCreationTemplateConfig#getEncryptionConfiguration}
         * @param encryptionConfiguration encryption_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#encryption_configuration EcrRepositoryCreationTemplate#encryption_configuration}
         * @return {@code this}
         */
        public Builder encryptionConfiguration(java.util.List<? extends imports.aws.ecr_repository_creation_template.EcrRepositoryCreationTemplateEncryptionConfiguration> encryptionConfiguration) {
            this.encryptionConfiguration = encryptionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link EcrRepositoryCreationTemplateConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#id EcrRepositoryCreationTemplate#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link EcrRepositoryCreationTemplateConfig#getImageTagMutability}
         * @param imageTagMutability Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#image_tag_mutability EcrRepositoryCreationTemplate#image_tag_mutability}.
         * @return {@code this}
         */
        public Builder imageTagMutability(java.lang.String imageTagMutability) {
            this.imageTagMutability = imageTagMutability;
            return this;
        }

        /**
         * Sets the value of {@link EcrRepositoryCreationTemplateConfig#getLifecyclePolicy}
         * @param lifecyclePolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#lifecycle_policy EcrRepositoryCreationTemplate#lifecycle_policy}.
         * @return {@code this}
         */
        public Builder lifecyclePolicy(java.lang.String lifecyclePolicy) {
            this.lifecyclePolicy = lifecyclePolicy;
            return this;
        }

        /**
         * Sets the value of {@link EcrRepositoryCreationTemplateConfig#getRepositoryPolicy}
         * @param repositoryPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#repository_policy EcrRepositoryCreationTemplate#repository_policy}.
         * @return {@code this}
         */
        public Builder repositoryPolicy(java.lang.String repositoryPolicy) {
            this.repositoryPolicy = repositoryPolicy;
            return this;
        }

        /**
         * Sets the value of {@link EcrRepositoryCreationTemplateConfig#getResourceTags}
         * @param resourceTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#resource_tags EcrRepositoryCreationTemplate#resource_tags}.
         * @return {@code this}
         */
        public Builder resourceTags(java.util.Map<java.lang.String, java.lang.String> resourceTags) {
            this.resourceTags = resourceTags;
            return this;
        }

        /**
         * Sets the value of {@link EcrRepositoryCreationTemplateConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EcrRepositoryCreationTemplateConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EcrRepositoryCreationTemplateConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EcrRepositoryCreationTemplateConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EcrRepositoryCreationTemplateConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link EcrRepositoryCreationTemplateConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link EcrRepositoryCreationTemplateConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link EcrRepositoryCreationTemplateConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link EcrRepositoryCreationTemplateConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcrRepositoryCreationTemplateConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcrRepositoryCreationTemplateConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcrRepositoryCreationTemplateConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcrRepositoryCreationTemplateConfig {
        private final java.util.List<java.lang.String> appliedFor;
        private final java.lang.String prefix;
        private final java.lang.String customRoleArn;
        private final java.lang.String description;
        private final java.lang.Object encryptionConfiguration;
        private final java.lang.String id;
        private final java.lang.String imageTagMutability;
        private final java.lang.String lifecyclePolicy;
        private final java.lang.String repositoryPolicy;
        private final java.util.Map<java.lang.String, java.lang.String> resourceTags;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.appliedFor = software.amazon.jsii.Kernel.get(this, "appliedFor", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.prefix = software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customRoleArn = software.amazon.jsii.Kernel.get(this, "customRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encryptionConfiguration = software.amazon.jsii.Kernel.get(this, "encryptionConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.imageTagMutability = software.amazon.jsii.Kernel.get(this, "imageTagMutability", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lifecyclePolicy = software.amazon.jsii.Kernel.get(this, "lifecyclePolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.repositoryPolicy = software.amazon.jsii.Kernel.get(this, "repositoryPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceTags = software.amazon.jsii.Kernel.get(this, "resourceTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.appliedFor = java.util.Objects.requireNonNull(builder.appliedFor, "appliedFor is required");
            this.prefix = java.util.Objects.requireNonNull(builder.prefix, "prefix is required");
            this.customRoleArn = builder.customRoleArn;
            this.description = builder.description;
            this.encryptionConfiguration = builder.encryptionConfiguration;
            this.id = builder.id;
            this.imageTagMutability = builder.imageTagMutability;
            this.lifecyclePolicy = builder.lifecyclePolicy;
            this.repositoryPolicy = builder.repositoryPolicy;
            this.resourceTags = builder.resourceTags;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.util.List<java.lang.String> getAppliedFor() {
            return this.appliedFor;
        }

        @Override
        public final java.lang.String getPrefix() {
            return this.prefix;
        }

        @Override
        public final java.lang.String getCustomRoleArn() {
            return this.customRoleArn;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getEncryptionConfiguration() {
            return this.encryptionConfiguration;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getImageTagMutability() {
            return this.imageTagMutability;
        }

        @Override
        public final java.lang.String getLifecyclePolicy() {
            return this.lifecyclePolicy;
        }

        @Override
        public final java.lang.String getRepositoryPolicy() {
            return this.repositoryPolicy;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getResourceTags() {
            return this.resourceTags;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("appliedFor", om.valueToTree(this.getAppliedFor()));
            data.set("prefix", om.valueToTree(this.getPrefix()));
            if (this.getCustomRoleArn() != null) {
                data.set("customRoleArn", om.valueToTree(this.getCustomRoleArn()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getEncryptionConfiguration() != null) {
                data.set("encryptionConfiguration", om.valueToTree(this.getEncryptionConfiguration()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getImageTagMutability() != null) {
                data.set("imageTagMutability", om.valueToTree(this.getImageTagMutability()));
            }
            if (this.getLifecyclePolicy() != null) {
                data.set("lifecyclePolicy", om.valueToTree(this.getLifecyclePolicy()));
            }
            if (this.getRepositoryPolicy() != null) {
                data.set("repositoryPolicy", om.valueToTree(this.getRepositoryPolicy()));
            }
            if (this.getResourceTags() != null) {
                data.set("resourceTags", om.valueToTree(this.getResourceTags()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecrRepositoryCreationTemplate.EcrRepositoryCreationTemplateConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcrRepositoryCreationTemplateConfig.Jsii$Proxy that = (EcrRepositoryCreationTemplateConfig.Jsii$Proxy) o;

            if (!appliedFor.equals(that.appliedFor)) return false;
            if (!prefix.equals(that.prefix)) return false;
            if (this.customRoleArn != null ? !this.customRoleArn.equals(that.customRoleArn) : that.customRoleArn != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.encryptionConfiguration != null ? !this.encryptionConfiguration.equals(that.encryptionConfiguration) : that.encryptionConfiguration != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.imageTagMutability != null ? !this.imageTagMutability.equals(that.imageTagMutability) : that.imageTagMutability != null) return false;
            if (this.lifecyclePolicy != null ? !this.lifecyclePolicy.equals(that.lifecyclePolicy) : that.lifecyclePolicy != null) return false;
            if (this.repositoryPolicy != null ? !this.repositoryPolicy.equals(that.repositoryPolicy) : that.repositoryPolicy != null) return false;
            if (this.resourceTags != null ? !this.resourceTags.equals(that.resourceTags) : that.resourceTags != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.appliedFor.hashCode();
            result = 31 * result + (this.prefix.hashCode());
            result = 31 * result + (this.customRoleArn != null ? this.customRoleArn.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.encryptionConfiguration != null ? this.encryptionConfiguration.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.imageTagMutability != null ? this.imageTagMutability.hashCode() : 0);
            result = 31 * result + (this.lifecyclePolicy != null ? this.lifecyclePolicy.hashCode() : 0);
            result = 31 * result + (this.repositoryPolicy != null ? this.repositoryPolicy.hashCode() : 0);
            result = 31 * result + (this.resourceTags != null ? this.resourceTags.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
