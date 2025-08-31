package imports.aws.iam_role;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.335Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iamRole.IamRoleConfig")
@software.amazon.jsii.Jsii.Proxy(IamRoleConfig.Jsii$Proxy.class)
public interface IamRoleConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#assume_role_policy IamRole#assume_role_policy}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAssumeRolePolicy();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#description IamRole#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#force_detach_policies IamRole#force_detach_policies}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getForceDetachPolicies() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#id IamRole#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * inline_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#inline_policy IamRole#inline_policy}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInlinePolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#managed_policy_arns IamRole#managed_policy_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getManagedPolicyArns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#max_session_duration IamRole#max_session_duration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxSessionDuration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#name IamRole#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#name_prefix IamRole#name_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamePrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#path IamRole#path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPath() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#permissions_boundary IamRole#permissions_boundary}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPermissionsBoundary() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#tags IamRole#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#tags_all IamRole#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IamRoleConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IamRoleConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IamRoleConfig> {
        java.lang.String assumeRolePolicy;
        java.lang.String description;
        java.lang.Object forceDetachPolicies;
        java.lang.String id;
        java.lang.Object inlinePolicy;
        java.util.List<java.lang.String> managedPolicyArns;
        java.lang.Number maxSessionDuration;
        java.lang.String name;
        java.lang.String namePrefix;
        java.lang.String path;
        java.lang.String permissionsBoundary;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link IamRoleConfig#getAssumeRolePolicy}
         * @param assumeRolePolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#assume_role_policy IamRole#assume_role_policy}. This parameter is required.
         * @return {@code this}
         */
        public Builder assumeRolePolicy(java.lang.String assumeRolePolicy) {
            this.assumeRolePolicy = assumeRolePolicy;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#description IamRole#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getForceDetachPolicies}
         * @param forceDetachPolicies Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#force_detach_policies IamRole#force_detach_policies}.
         * @return {@code this}
         */
        public Builder forceDetachPolicies(java.lang.Boolean forceDetachPolicies) {
            this.forceDetachPolicies = forceDetachPolicies;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getForceDetachPolicies}
         * @param forceDetachPolicies Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#force_detach_policies IamRole#force_detach_policies}.
         * @return {@code this}
         */
        public Builder forceDetachPolicies(com.hashicorp.cdktf.IResolvable forceDetachPolicies) {
            this.forceDetachPolicies = forceDetachPolicies;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#id IamRole#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getInlinePolicy}
         * @param inlinePolicy inline_policy block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#inline_policy IamRole#inline_policy}
         * @return {@code this}
         */
        public Builder inlinePolicy(com.hashicorp.cdktf.IResolvable inlinePolicy) {
            this.inlinePolicy = inlinePolicy;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getInlinePolicy}
         * @param inlinePolicy inline_policy block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#inline_policy IamRole#inline_policy}
         * @return {@code this}
         */
        public Builder inlinePolicy(java.util.List<? extends imports.aws.iam_role.IamRoleInlinePolicy> inlinePolicy) {
            this.inlinePolicy = inlinePolicy;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getManagedPolicyArns}
         * @param managedPolicyArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#managed_policy_arns IamRole#managed_policy_arns}.
         * @return {@code this}
         */
        public Builder managedPolicyArns(java.util.List<java.lang.String> managedPolicyArns) {
            this.managedPolicyArns = managedPolicyArns;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getMaxSessionDuration}
         * @param maxSessionDuration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#max_session_duration IamRole#max_session_duration}.
         * @return {@code this}
         */
        public Builder maxSessionDuration(java.lang.Number maxSessionDuration) {
            this.maxSessionDuration = maxSessionDuration;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#name IamRole#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getNamePrefix}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#name_prefix IamRole#name_prefix}.
         * @return {@code this}
         */
        public Builder namePrefix(java.lang.String namePrefix) {
            this.namePrefix = namePrefix;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getPath}
         * @param path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#path IamRole#path}.
         * @return {@code this}
         */
        public Builder path(java.lang.String path) {
            this.path = path;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getPermissionsBoundary}
         * @param permissionsBoundary Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#permissions_boundary IamRole#permissions_boundary}.
         * @return {@code this}
         */
        public Builder permissionsBoundary(java.lang.String permissionsBoundary) {
            this.permissionsBoundary = permissionsBoundary;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#tags IamRole#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#tags_all IamRole#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getDependsOn}
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
         * Sets the value of {@link IamRoleConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleConfig#getProvisioners}
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
         * @return a new instance of {@link IamRoleConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IamRoleConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IamRoleConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IamRoleConfig {
        private final java.lang.String assumeRolePolicy;
        private final java.lang.String description;
        private final java.lang.Object forceDetachPolicies;
        private final java.lang.String id;
        private final java.lang.Object inlinePolicy;
        private final java.util.List<java.lang.String> managedPolicyArns;
        private final java.lang.Number maxSessionDuration;
        private final java.lang.String name;
        private final java.lang.String namePrefix;
        private final java.lang.String path;
        private final java.lang.String permissionsBoundary;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
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
            this.assumeRolePolicy = software.amazon.jsii.Kernel.get(this, "assumeRolePolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.forceDetachPolicies = software.amazon.jsii.Kernel.get(this, "forceDetachPolicies", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inlinePolicy = software.amazon.jsii.Kernel.get(this, "inlinePolicy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.managedPolicyArns = software.amazon.jsii.Kernel.get(this, "managedPolicyArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.maxSessionDuration = software.amazon.jsii.Kernel.get(this, "maxSessionDuration", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.namePrefix = software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.path = software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.permissionsBoundary = software.amazon.jsii.Kernel.get(this, "permissionsBoundary", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.assumeRolePolicy = java.util.Objects.requireNonNull(builder.assumeRolePolicy, "assumeRolePolicy is required");
            this.description = builder.description;
            this.forceDetachPolicies = builder.forceDetachPolicies;
            this.id = builder.id;
            this.inlinePolicy = builder.inlinePolicy;
            this.managedPolicyArns = builder.managedPolicyArns;
            this.maxSessionDuration = builder.maxSessionDuration;
            this.name = builder.name;
            this.namePrefix = builder.namePrefix;
            this.path = builder.path;
            this.permissionsBoundary = builder.permissionsBoundary;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAssumeRolePolicy() {
            return this.assumeRolePolicy;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getForceDetachPolicies() {
            return this.forceDetachPolicies;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getInlinePolicy() {
            return this.inlinePolicy;
        }

        @Override
        public final java.util.List<java.lang.String> getManagedPolicyArns() {
            return this.managedPolicyArns;
        }

        @Override
        public final java.lang.Number getMaxSessionDuration() {
            return this.maxSessionDuration;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getNamePrefix() {
            return this.namePrefix;
        }

        @Override
        public final java.lang.String getPath() {
            return this.path;
        }

        @Override
        public final java.lang.String getPermissionsBoundary() {
            return this.permissionsBoundary;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
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

            data.set("assumeRolePolicy", om.valueToTree(this.getAssumeRolePolicy()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getForceDetachPolicies() != null) {
                data.set("forceDetachPolicies", om.valueToTree(this.getForceDetachPolicies()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInlinePolicy() != null) {
                data.set("inlinePolicy", om.valueToTree(this.getInlinePolicy()));
            }
            if (this.getManagedPolicyArns() != null) {
                data.set("managedPolicyArns", om.valueToTree(this.getManagedPolicyArns()));
            }
            if (this.getMaxSessionDuration() != null) {
                data.set("maxSessionDuration", om.valueToTree(this.getMaxSessionDuration()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getNamePrefix() != null) {
                data.set("namePrefix", om.valueToTree(this.getNamePrefix()));
            }
            if (this.getPath() != null) {
                data.set("path", om.valueToTree(this.getPath()));
            }
            if (this.getPermissionsBoundary() != null) {
                data.set("permissionsBoundary", om.valueToTree(this.getPermissionsBoundary()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
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
            struct.set("fqn", om.valueToTree("aws.iamRole.IamRoleConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IamRoleConfig.Jsii$Proxy that = (IamRoleConfig.Jsii$Proxy) o;

            if (!assumeRolePolicy.equals(that.assumeRolePolicy)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.forceDetachPolicies != null ? !this.forceDetachPolicies.equals(that.forceDetachPolicies) : that.forceDetachPolicies != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.inlinePolicy != null ? !this.inlinePolicy.equals(that.inlinePolicy) : that.inlinePolicy != null) return false;
            if (this.managedPolicyArns != null ? !this.managedPolicyArns.equals(that.managedPolicyArns) : that.managedPolicyArns != null) return false;
            if (this.maxSessionDuration != null ? !this.maxSessionDuration.equals(that.maxSessionDuration) : that.maxSessionDuration != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.namePrefix != null ? !this.namePrefix.equals(that.namePrefix) : that.namePrefix != null) return false;
            if (this.path != null ? !this.path.equals(that.path) : that.path != null) return false;
            if (this.permissionsBoundary != null ? !this.permissionsBoundary.equals(that.permissionsBoundary) : that.permissionsBoundary != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.assumeRolePolicy.hashCode();
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.forceDetachPolicies != null ? this.forceDetachPolicies.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.inlinePolicy != null ? this.inlinePolicy.hashCode() : 0);
            result = 31 * result + (this.managedPolicyArns != null ? this.managedPolicyArns.hashCode() : 0);
            result = 31 * result + (this.maxSessionDuration != null ? this.maxSessionDuration.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.namePrefix != null ? this.namePrefix.hashCode() : 0);
            result = 31 * result + (this.path != null ? this.path.hashCode() : 0);
            result = 31 * result + (this.permissionsBoundary != null ? this.permissionsBoundary.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
