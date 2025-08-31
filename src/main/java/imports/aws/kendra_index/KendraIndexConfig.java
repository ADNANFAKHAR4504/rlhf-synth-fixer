package imports.aws.kendra_index;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.434Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraIndex.KendraIndexConfig")
@software.amazon.jsii.Jsii.Proxy(KendraIndexConfig.Jsii$Proxy.class)
public interface KendraIndexConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#name KendraIndex#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#role_arn KendraIndex#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * capacity_units block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#capacity_units KendraIndex#capacity_units}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexCapacityUnits getCapacityUnits() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#description KendraIndex#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * document_metadata_configuration_updates block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#document_metadata_configuration_updates KendraIndex#document_metadata_configuration_updates}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDocumentMetadataConfigurationUpdates() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#edition KendraIndex#edition}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEdition() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#id KendraIndex#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * server_side_encryption_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#server_side_encryption_configuration KendraIndex#server_side_encryption_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexServerSideEncryptionConfiguration getServerSideEncryptionConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#tags KendraIndex#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#tags_all KendraIndex#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#timeouts KendraIndex#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#user_context_policy KendraIndex#user_context_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserContextPolicy() {
        return null;
    }

    /**
     * user_group_resolution_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#user_group_resolution_configuration KendraIndex#user_group_resolution_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexUserGroupResolutionConfiguration getUserGroupResolutionConfiguration() {
        return null;
    }

    /**
     * user_token_configurations block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#user_token_configurations KendraIndex#user_token_configurations}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexUserTokenConfigurations getUserTokenConfigurations() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraIndexConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraIndexConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraIndexConfig> {
        java.lang.String name;
        java.lang.String roleArn;
        imports.aws.kendra_index.KendraIndexCapacityUnits capacityUnits;
        java.lang.String description;
        java.lang.Object documentMetadataConfigurationUpdates;
        java.lang.String edition;
        java.lang.String id;
        imports.aws.kendra_index.KendraIndexServerSideEncryptionConfiguration serverSideEncryptionConfiguration;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.kendra_index.KendraIndexTimeouts timeouts;
        java.lang.String userContextPolicy;
        imports.aws.kendra_index.KendraIndexUserGroupResolutionConfiguration userGroupResolutionConfiguration;
        imports.aws.kendra_index.KendraIndexUserTokenConfigurations userTokenConfigurations;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link KendraIndexConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#name KendraIndex#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#role_arn KendraIndex#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getCapacityUnits}
         * @param capacityUnits capacity_units block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#capacity_units KendraIndex#capacity_units}
         * @return {@code this}
         */
        public Builder capacityUnits(imports.aws.kendra_index.KendraIndexCapacityUnits capacityUnits) {
            this.capacityUnits = capacityUnits;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#description KendraIndex#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getDocumentMetadataConfigurationUpdates}
         * @param documentMetadataConfigurationUpdates document_metadata_configuration_updates block.
         *                                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#document_metadata_configuration_updates KendraIndex#document_metadata_configuration_updates}
         * @return {@code this}
         */
        public Builder documentMetadataConfigurationUpdates(com.hashicorp.cdktf.IResolvable documentMetadataConfigurationUpdates) {
            this.documentMetadataConfigurationUpdates = documentMetadataConfigurationUpdates;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getDocumentMetadataConfigurationUpdates}
         * @param documentMetadataConfigurationUpdates document_metadata_configuration_updates block.
         *                                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#document_metadata_configuration_updates KendraIndex#document_metadata_configuration_updates}
         * @return {@code this}
         */
        public Builder documentMetadataConfigurationUpdates(java.util.List<? extends imports.aws.kendra_index.KendraIndexDocumentMetadataConfigurationUpdates> documentMetadataConfigurationUpdates) {
            this.documentMetadataConfigurationUpdates = documentMetadataConfigurationUpdates;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getEdition}
         * @param edition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#edition KendraIndex#edition}.
         * @return {@code this}
         */
        public Builder edition(java.lang.String edition) {
            this.edition = edition;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#id KendraIndex#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getServerSideEncryptionConfiguration}
         * @param serverSideEncryptionConfiguration server_side_encryption_configuration block.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#server_side_encryption_configuration KendraIndex#server_side_encryption_configuration}
         * @return {@code this}
         */
        public Builder serverSideEncryptionConfiguration(imports.aws.kendra_index.KendraIndexServerSideEncryptionConfiguration serverSideEncryptionConfiguration) {
            this.serverSideEncryptionConfiguration = serverSideEncryptionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#tags KendraIndex#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#tags_all KendraIndex#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#timeouts KendraIndex#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.kendra_index.KendraIndexTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getUserContextPolicy}
         * @param userContextPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#user_context_policy KendraIndex#user_context_policy}.
         * @return {@code this}
         */
        public Builder userContextPolicy(java.lang.String userContextPolicy) {
            this.userContextPolicy = userContextPolicy;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getUserGroupResolutionConfiguration}
         * @param userGroupResolutionConfiguration user_group_resolution_configuration block.
         *                                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#user_group_resolution_configuration KendraIndex#user_group_resolution_configuration}
         * @return {@code this}
         */
        public Builder userGroupResolutionConfiguration(imports.aws.kendra_index.KendraIndexUserGroupResolutionConfiguration userGroupResolutionConfiguration) {
            this.userGroupResolutionConfiguration = userGroupResolutionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getUserTokenConfigurations}
         * @param userTokenConfigurations user_token_configurations block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#user_token_configurations KendraIndex#user_token_configurations}
         * @return {@code this}
         */
        public Builder userTokenConfigurations(imports.aws.kendra_index.KendraIndexUserTokenConfigurations userTokenConfigurations) {
            this.userTokenConfigurations = userTokenConfigurations;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getDependsOn}
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
         * Sets the value of {@link KendraIndexConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexConfig#getProvisioners}
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
         * @return a new instance of {@link KendraIndexConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraIndexConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraIndexConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraIndexConfig {
        private final java.lang.String name;
        private final java.lang.String roleArn;
        private final imports.aws.kendra_index.KendraIndexCapacityUnits capacityUnits;
        private final java.lang.String description;
        private final java.lang.Object documentMetadataConfigurationUpdates;
        private final java.lang.String edition;
        private final java.lang.String id;
        private final imports.aws.kendra_index.KendraIndexServerSideEncryptionConfiguration serverSideEncryptionConfiguration;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.kendra_index.KendraIndexTimeouts timeouts;
        private final java.lang.String userContextPolicy;
        private final imports.aws.kendra_index.KendraIndexUserGroupResolutionConfiguration userGroupResolutionConfiguration;
        private final imports.aws.kendra_index.KendraIndexUserTokenConfigurations userTokenConfigurations;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.capacityUnits = software.amazon.jsii.Kernel.get(this, "capacityUnits", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_index.KendraIndexCapacityUnits.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.documentMetadataConfigurationUpdates = software.amazon.jsii.Kernel.get(this, "documentMetadataConfigurationUpdates", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.edition = software.amazon.jsii.Kernel.get(this, "edition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serverSideEncryptionConfiguration = software.amazon.jsii.Kernel.get(this, "serverSideEncryptionConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_index.KendraIndexServerSideEncryptionConfiguration.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_index.KendraIndexTimeouts.class));
            this.userContextPolicy = software.amazon.jsii.Kernel.get(this, "userContextPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userGroupResolutionConfiguration = software.amazon.jsii.Kernel.get(this, "userGroupResolutionConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_index.KendraIndexUserGroupResolutionConfiguration.class));
            this.userTokenConfigurations = software.amazon.jsii.Kernel.get(this, "userTokenConfigurations", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_index.KendraIndexUserTokenConfigurations.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.capacityUnits = builder.capacityUnits;
            this.description = builder.description;
            this.documentMetadataConfigurationUpdates = builder.documentMetadataConfigurationUpdates;
            this.edition = builder.edition;
            this.id = builder.id;
            this.serverSideEncryptionConfiguration = builder.serverSideEncryptionConfiguration;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.userContextPolicy = builder.userContextPolicy;
            this.userGroupResolutionConfiguration = builder.userGroupResolutionConfiguration;
            this.userTokenConfigurations = builder.userTokenConfigurations;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final imports.aws.kendra_index.KendraIndexCapacityUnits getCapacityUnits() {
            return this.capacityUnits;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getDocumentMetadataConfigurationUpdates() {
            return this.documentMetadataConfigurationUpdates;
        }

        @Override
        public final java.lang.String getEdition() {
            return this.edition;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.kendra_index.KendraIndexServerSideEncryptionConfiguration getServerSideEncryptionConfiguration() {
            return this.serverSideEncryptionConfiguration;
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
        public final imports.aws.kendra_index.KendraIndexTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getUserContextPolicy() {
            return this.userContextPolicy;
        }

        @Override
        public final imports.aws.kendra_index.KendraIndexUserGroupResolutionConfiguration getUserGroupResolutionConfiguration() {
            return this.userGroupResolutionConfiguration;
        }

        @Override
        public final imports.aws.kendra_index.KendraIndexUserTokenConfigurations getUserTokenConfigurations() {
            return this.userTokenConfigurations;
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

            data.set("name", om.valueToTree(this.getName()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getCapacityUnits() != null) {
                data.set("capacityUnits", om.valueToTree(this.getCapacityUnits()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDocumentMetadataConfigurationUpdates() != null) {
                data.set("documentMetadataConfigurationUpdates", om.valueToTree(this.getDocumentMetadataConfigurationUpdates()));
            }
            if (this.getEdition() != null) {
                data.set("edition", om.valueToTree(this.getEdition()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getServerSideEncryptionConfiguration() != null) {
                data.set("serverSideEncryptionConfiguration", om.valueToTree(this.getServerSideEncryptionConfiguration()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getUserContextPolicy() != null) {
                data.set("userContextPolicy", om.valueToTree(this.getUserContextPolicy()));
            }
            if (this.getUserGroupResolutionConfiguration() != null) {
                data.set("userGroupResolutionConfiguration", om.valueToTree(this.getUserGroupResolutionConfiguration()));
            }
            if (this.getUserTokenConfigurations() != null) {
                data.set("userTokenConfigurations", om.valueToTree(this.getUserTokenConfigurations()));
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
            struct.set("fqn", om.valueToTree("aws.kendraIndex.KendraIndexConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraIndexConfig.Jsii$Proxy that = (KendraIndexConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (this.capacityUnits != null ? !this.capacityUnits.equals(that.capacityUnits) : that.capacityUnits != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.documentMetadataConfigurationUpdates != null ? !this.documentMetadataConfigurationUpdates.equals(that.documentMetadataConfigurationUpdates) : that.documentMetadataConfigurationUpdates != null) return false;
            if (this.edition != null ? !this.edition.equals(that.edition) : that.edition != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.serverSideEncryptionConfiguration != null ? !this.serverSideEncryptionConfiguration.equals(that.serverSideEncryptionConfiguration) : that.serverSideEncryptionConfiguration != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.userContextPolicy != null ? !this.userContextPolicy.equals(that.userContextPolicy) : that.userContextPolicy != null) return false;
            if (this.userGroupResolutionConfiguration != null ? !this.userGroupResolutionConfiguration.equals(that.userGroupResolutionConfiguration) : that.userGroupResolutionConfiguration != null) return false;
            if (this.userTokenConfigurations != null ? !this.userTokenConfigurations.equals(that.userTokenConfigurations) : that.userTokenConfigurations != null) return false;
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
            int result = this.name.hashCode();
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.capacityUnits != null ? this.capacityUnits.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.documentMetadataConfigurationUpdates != null ? this.documentMetadataConfigurationUpdates.hashCode() : 0);
            result = 31 * result + (this.edition != null ? this.edition.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.serverSideEncryptionConfiguration != null ? this.serverSideEncryptionConfiguration.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.userContextPolicy != null ? this.userContextPolicy.hashCode() : 0);
            result = 31 * result + (this.userGroupResolutionConfiguration != null ? this.userGroupResolutionConfiguration.hashCode() : 0);
            result = 31 * result + (this.userTokenConfigurations != null ? this.userTokenConfigurations.hashCode() : 0);
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
