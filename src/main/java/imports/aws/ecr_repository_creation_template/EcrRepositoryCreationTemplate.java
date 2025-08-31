package imports.aws.ecr_repository_creation_template;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template aws_ecr_repository_creation_template}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.121Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecrRepositoryCreationTemplate.EcrRepositoryCreationTemplate")
public class EcrRepositoryCreationTemplate extends com.hashicorp.cdktf.TerraformResource {

    protected EcrRepositoryCreationTemplate(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EcrRepositoryCreationTemplate(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.ecr_repository_creation_template.EcrRepositoryCreationTemplate.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template aws_ecr_repository_creation_template} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public EcrRepositoryCreationTemplate(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.ecr_repository_creation_template.EcrRepositoryCreationTemplateConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a EcrRepositoryCreationTemplate resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EcrRepositoryCreationTemplate to import. This parameter is required.
     * @param importFromId The id of the existing EcrRepositoryCreationTemplate that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the EcrRepositoryCreationTemplate to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ecr_repository_creation_template.EcrRepositoryCreationTemplate.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a EcrRepositoryCreationTemplate resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EcrRepositoryCreationTemplate to import. This parameter is required.
     * @param importFromId The id of the existing EcrRepositoryCreationTemplate that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ecr_repository_creation_template.EcrRepositoryCreationTemplate.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putEncryptionConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ecr_repository_creation_template.EcrRepositoryCreationTemplateEncryptionConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ecr_repository_creation_template.EcrRepositoryCreationTemplateEncryptionConfiguration> __cast_cd4240 = (java.util.List<imports.aws.ecr_repository_creation_template.EcrRepositoryCreationTemplateEncryptionConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ecr_repository_creation_template.EcrRepositoryCreationTemplateEncryptionConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEncryptionConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCustomRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetCustomRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEncryptionConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetEncryptionConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImageTagMutability() {
        software.amazon.jsii.Kernel.call(this, "resetImageTagMutability", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLifecyclePolicy() {
        software.amazon.jsii.Kernel.call(this, "resetLifecyclePolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRepositoryPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetRepositoryPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceTags() {
        software.amazon.jsii.Kernel.call(this, "resetResourceTags", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull imports.aws.ecr_repository_creation_template.EcrRepositoryCreationTemplateEncryptionConfigurationList getEncryptionConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "encryptionConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.ecr_repository_creation_template.EcrRepositoryCreationTemplateEncryptionConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRegistryId() {
        return software.amazon.jsii.Kernel.get(this, "registryId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAppliedForInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "appliedForInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "customRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEncryptionConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptionConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImageTagMutabilityInput() {
        return software.amazon.jsii.Kernel.get(this, "imageTagMutabilityInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLifecyclePolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "lifecyclePolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "prefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRepositoryPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "repositoryPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getResourceTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "resourceTagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAppliedFor() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "appliedFor", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAppliedFor(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "appliedFor", java.util.Objects.requireNonNull(value, "appliedFor is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "customRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customRoleArn", java.util.Objects.requireNonNull(value, "customRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImageTagMutability() {
        return software.amazon.jsii.Kernel.get(this, "imageTagMutability", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImageTagMutability(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "imageTagMutability", java.util.Objects.requireNonNull(value, "imageTagMutability is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLifecyclePolicy() {
        return software.amazon.jsii.Kernel.get(this, "lifecyclePolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLifecyclePolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lifecyclePolicy", java.util.Objects.requireNonNull(value, "lifecyclePolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrefix() {
        return software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "prefix", java.util.Objects.requireNonNull(value, "prefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRepositoryPolicy() {
        return software.amazon.jsii.Kernel.get(this, "repositoryPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRepositoryPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "repositoryPolicy", java.util.Objects.requireNonNull(value, "repositoryPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getResourceTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "resourceTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setResourceTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "resourceTags", java.util.Objects.requireNonNull(value, "resourceTags is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.ecr_repository_creation_template.EcrRepositoryCreationTemplate}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.ecr_repository_creation_template.EcrRepositoryCreationTemplate> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.ecr_repository_creation_template.EcrRepositoryCreationTemplateConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.ecr_repository_creation_template.EcrRepositoryCreationTemplateConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#applied_for EcrRepositoryCreationTemplate#applied_for}.
         * <p>
         * @return {@code this}
         * @param appliedFor Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#applied_for EcrRepositoryCreationTemplate#applied_for}. This parameter is required.
         */
        public Builder appliedFor(final java.util.List<java.lang.String> appliedFor) {
            this.config.appliedFor(appliedFor);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#prefix EcrRepositoryCreationTemplate#prefix}.
         * <p>
         * @return {@code this}
         * @param prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#prefix EcrRepositoryCreationTemplate#prefix}. This parameter is required.
         */
        public Builder prefix(final java.lang.String prefix) {
            this.config.prefix(prefix);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#custom_role_arn EcrRepositoryCreationTemplate#custom_role_arn}.
         * <p>
         * @return {@code this}
         * @param customRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#custom_role_arn EcrRepositoryCreationTemplate#custom_role_arn}. This parameter is required.
         */
        public Builder customRoleArn(final java.lang.String customRoleArn) {
            this.config.customRoleArn(customRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#description EcrRepositoryCreationTemplate#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#description EcrRepositoryCreationTemplate#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * encryption_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#encryption_configuration EcrRepositoryCreationTemplate#encryption_configuration}
         * <p>
         * @return {@code this}
         * @param encryptionConfiguration encryption_configuration block. This parameter is required.
         */
        public Builder encryptionConfiguration(final com.hashicorp.cdktf.IResolvable encryptionConfiguration) {
            this.config.encryptionConfiguration(encryptionConfiguration);
            return this;
        }
        /**
         * encryption_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#encryption_configuration EcrRepositoryCreationTemplate#encryption_configuration}
         * <p>
         * @return {@code this}
         * @param encryptionConfiguration encryption_configuration block. This parameter is required.
         */
        public Builder encryptionConfiguration(final java.util.List<? extends imports.aws.ecr_repository_creation_template.EcrRepositoryCreationTemplateEncryptionConfiguration> encryptionConfiguration) {
            this.config.encryptionConfiguration(encryptionConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#id EcrRepositoryCreationTemplate#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#id EcrRepositoryCreationTemplate#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#image_tag_mutability EcrRepositoryCreationTemplate#image_tag_mutability}.
         * <p>
         * @return {@code this}
         * @param imageTagMutability Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#image_tag_mutability EcrRepositoryCreationTemplate#image_tag_mutability}. This parameter is required.
         */
        public Builder imageTagMutability(final java.lang.String imageTagMutability) {
            this.config.imageTagMutability(imageTagMutability);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#lifecycle_policy EcrRepositoryCreationTemplate#lifecycle_policy}.
         * <p>
         * @return {@code this}
         * @param lifecyclePolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#lifecycle_policy EcrRepositoryCreationTemplate#lifecycle_policy}. This parameter is required.
         */
        public Builder lifecyclePolicy(final java.lang.String lifecyclePolicy) {
            this.config.lifecyclePolicy(lifecyclePolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#repository_policy EcrRepositoryCreationTemplate#repository_policy}.
         * <p>
         * @return {@code this}
         * @param repositoryPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#repository_policy EcrRepositoryCreationTemplate#repository_policy}. This parameter is required.
         */
        public Builder repositoryPolicy(final java.lang.String repositoryPolicy) {
            this.config.repositoryPolicy(repositoryPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#resource_tags EcrRepositoryCreationTemplate#resource_tags}.
         * <p>
         * @return {@code this}
         * @param resourceTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_repository_creation_template#resource_tags EcrRepositoryCreationTemplate#resource_tags}. This parameter is required.
         */
        public Builder resourceTags(final java.util.Map<java.lang.String, java.lang.String> resourceTags) {
            this.config.resourceTags(resourceTags);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.ecr_repository_creation_template.EcrRepositoryCreationTemplate}.
         */
        @Override
        public imports.aws.ecr_repository_creation_template.EcrRepositoryCreationTemplate build() {
            return new imports.aws.ecr_repository_creation_template.EcrRepositoryCreationTemplate(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
