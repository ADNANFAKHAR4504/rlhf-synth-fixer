package imports.aws.workspaces_workspace;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.688Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspacesWorkspace.WorkspacesWorkspaceConfig")
@software.amazon.jsii.Jsii.Proxy(WorkspacesWorkspaceConfig.Jsii$Proxy.class)
public interface WorkspacesWorkspaceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#bundle_id WorkspacesWorkspace#bundle_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBundleId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#directory_id WorkspacesWorkspace#directory_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDirectoryId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#user_name WorkspacesWorkspace#user_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUserName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#id WorkspacesWorkspace#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#root_volume_encryption_enabled WorkspacesWorkspace#root_volume_encryption_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRootVolumeEncryptionEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#tags WorkspacesWorkspace#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#tags_all WorkspacesWorkspace#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#timeouts WorkspacesWorkspace#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.workspaces_workspace.WorkspacesWorkspaceTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#user_volume_encryption_enabled WorkspacesWorkspace#user_volume_encryption_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUserVolumeEncryptionEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#volume_encryption_key WorkspacesWorkspace#volume_encryption_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVolumeEncryptionKey() {
        return null;
    }

    /**
     * workspace_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#workspace_properties WorkspacesWorkspace#workspace_properties}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.workspaces_workspace.WorkspacesWorkspaceWorkspaceProperties getWorkspaceProperties() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link WorkspacesWorkspaceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WorkspacesWorkspaceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WorkspacesWorkspaceConfig> {
        java.lang.String bundleId;
        java.lang.String directoryId;
        java.lang.String userName;
        java.lang.String id;
        java.lang.Object rootVolumeEncryptionEnabled;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.workspaces_workspace.WorkspacesWorkspaceTimeouts timeouts;
        java.lang.Object userVolumeEncryptionEnabled;
        java.lang.String volumeEncryptionKey;
        imports.aws.workspaces_workspace.WorkspacesWorkspaceWorkspaceProperties workspaceProperties;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link WorkspacesWorkspaceConfig#getBundleId}
         * @param bundleId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#bundle_id WorkspacesWorkspace#bundle_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder bundleId(java.lang.String bundleId) {
            this.bundleId = bundleId;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesWorkspaceConfig#getDirectoryId}
         * @param directoryId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#directory_id WorkspacesWorkspace#directory_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder directoryId(java.lang.String directoryId) {
            this.directoryId = directoryId;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesWorkspaceConfig#getUserName}
         * @param userName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#user_name WorkspacesWorkspace#user_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder userName(java.lang.String userName) {
            this.userName = userName;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesWorkspaceConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#id WorkspacesWorkspace#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesWorkspaceConfig#getRootVolumeEncryptionEnabled}
         * @param rootVolumeEncryptionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#root_volume_encryption_enabled WorkspacesWorkspace#root_volume_encryption_enabled}.
         * @return {@code this}
         */
        public Builder rootVolumeEncryptionEnabled(java.lang.Boolean rootVolumeEncryptionEnabled) {
            this.rootVolumeEncryptionEnabled = rootVolumeEncryptionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesWorkspaceConfig#getRootVolumeEncryptionEnabled}
         * @param rootVolumeEncryptionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#root_volume_encryption_enabled WorkspacesWorkspace#root_volume_encryption_enabled}.
         * @return {@code this}
         */
        public Builder rootVolumeEncryptionEnabled(com.hashicorp.cdktf.IResolvable rootVolumeEncryptionEnabled) {
            this.rootVolumeEncryptionEnabled = rootVolumeEncryptionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesWorkspaceConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#tags WorkspacesWorkspace#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesWorkspaceConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#tags_all WorkspacesWorkspace#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesWorkspaceConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#timeouts WorkspacesWorkspace#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.workspaces_workspace.WorkspacesWorkspaceTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesWorkspaceConfig#getUserVolumeEncryptionEnabled}
         * @param userVolumeEncryptionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#user_volume_encryption_enabled WorkspacesWorkspace#user_volume_encryption_enabled}.
         * @return {@code this}
         */
        public Builder userVolumeEncryptionEnabled(java.lang.Boolean userVolumeEncryptionEnabled) {
            this.userVolumeEncryptionEnabled = userVolumeEncryptionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesWorkspaceConfig#getUserVolumeEncryptionEnabled}
         * @param userVolumeEncryptionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#user_volume_encryption_enabled WorkspacesWorkspace#user_volume_encryption_enabled}.
         * @return {@code this}
         */
        public Builder userVolumeEncryptionEnabled(com.hashicorp.cdktf.IResolvable userVolumeEncryptionEnabled) {
            this.userVolumeEncryptionEnabled = userVolumeEncryptionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesWorkspaceConfig#getVolumeEncryptionKey}
         * @param volumeEncryptionKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#volume_encryption_key WorkspacesWorkspace#volume_encryption_key}.
         * @return {@code this}
         */
        public Builder volumeEncryptionKey(java.lang.String volumeEncryptionKey) {
            this.volumeEncryptionKey = volumeEncryptionKey;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesWorkspaceConfig#getWorkspaceProperties}
         * @param workspaceProperties workspace_properties block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_workspace#workspace_properties WorkspacesWorkspace#workspace_properties}
         * @return {@code this}
         */
        public Builder workspaceProperties(imports.aws.workspaces_workspace.WorkspacesWorkspaceWorkspaceProperties workspaceProperties) {
            this.workspaceProperties = workspaceProperties;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesWorkspaceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesWorkspaceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesWorkspaceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesWorkspaceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesWorkspaceConfig#getDependsOn}
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
         * Sets the value of {@link WorkspacesWorkspaceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesWorkspaceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesWorkspaceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesWorkspaceConfig#getProvisioners}
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
         * @return a new instance of {@link WorkspacesWorkspaceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WorkspacesWorkspaceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WorkspacesWorkspaceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WorkspacesWorkspaceConfig {
        private final java.lang.String bundleId;
        private final java.lang.String directoryId;
        private final java.lang.String userName;
        private final java.lang.String id;
        private final java.lang.Object rootVolumeEncryptionEnabled;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.workspaces_workspace.WorkspacesWorkspaceTimeouts timeouts;
        private final java.lang.Object userVolumeEncryptionEnabled;
        private final java.lang.String volumeEncryptionKey;
        private final imports.aws.workspaces_workspace.WorkspacesWorkspaceWorkspaceProperties workspaceProperties;
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
            this.bundleId = software.amazon.jsii.Kernel.get(this, "bundleId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.directoryId = software.amazon.jsii.Kernel.get(this, "directoryId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userName = software.amazon.jsii.Kernel.get(this, "userName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rootVolumeEncryptionEnabled = software.amazon.jsii.Kernel.get(this, "rootVolumeEncryptionEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_workspace.WorkspacesWorkspaceTimeouts.class));
            this.userVolumeEncryptionEnabled = software.amazon.jsii.Kernel.get(this, "userVolumeEncryptionEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.volumeEncryptionKey = software.amazon.jsii.Kernel.get(this, "volumeEncryptionKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.workspaceProperties = software.amazon.jsii.Kernel.get(this, "workspaceProperties", software.amazon.jsii.NativeType.forClass(imports.aws.workspaces_workspace.WorkspacesWorkspaceWorkspaceProperties.class));
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
            this.bundleId = java.util.Objects.requireNonNull(builder.bundleId, "bundleId is required");
            this.directoryId = java.util.Objects.requireNonNull(builder.directoryId, "directoryId is required");
            this.userName = java.util.Objects.requireNonNull(builder.userName, "userName is required");
            this.id = builder.id;
            this.rootVolumeEncryptionEnabled = builder.rootVolumeEncryptionEnabled;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.userVolumeEncryptionEnabled = builder.userVolumeEncryptionEnabled;
            this.volumeEncryptionKey = builder.volumeEncryptionKey;
            this.workspaceProperties = builder.workspaceProperties;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getBundleId() {
            return this.bundleId;
        }

        @Override
        public final java.lang.String getDirectoryId() {
            return this.directoryId;
        }

        @Override
        public final java.lang.String getUserName() {
            return this.userName;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getRootVolumeEncryptionEnabled() {
            return this.rootVolumeEncryptionEnabled;
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
        public final imports.aws.workspaces_workspace.WorkspacesWorkspaceTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getUserVolumeEncryptionEnabled() {
            return this.userVolumeEncryptionEnabled;
        }

        @Override
        public final java.lang.String getVolumeEncryptionKey() {
            return this.volumeEncryptionKey;
        }

        @Override
        public final imports.aws.workspaces_workspace.WorkspacesWorkspaceWorkspaceProperties getWorkspaceProperties() {
            return this.workspaceProperties;
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

            data.set("bundleId", om.valueToTree(this.getBundleId()));
            data.set("directoryId", om.valueToTree(this.getDirectoryId()));
            data.set("userName", om.valueToTree(this.getUserName()));
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getRootVolumeEncryptionEnabled() != null) {
                data.set("rootVolumeEncryptionEnabled", om.valueToTree(this.getRootVolumeEncryptionEnabled()));
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
            if (this.getUserVolumeEncryptionEnabled() != null) {
                data.set("userVolumeEncryptionEnabled", om.valueToTree(this.getUserVolumeEncryptionEnabled()));
            }
            if (this.getVolumeEncryptionKey() != null) {
                data.set("volumeEncryptionKey", om.valueToTree(this.getVolumeEncryptionKey()));
            }
            if (this.getWorkspaceProperties() != null) {
                data.set("workspaceProperties", om.valueToTree(this.getWorkspaceProperties()));
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
            struct.set("fqn", om.valueToTree("aws.workspacesWorkspace.WorkspacesWorkspaceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WorkspacesWorkspaceConfig.Jsii$Proxy that = (WorkspacesWorkspaceConfig.Jsii$Proxy) o;

            if (!bundleId.equals(that.bundleId)) return false;
            if (!directoryId.equals(that.directoryId)) return false;
            if (!userName.equals(that.userName)) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.rootVolumeEncryptionEnabled != null ? !this.rootVolumeEncryptionEnabled.equals(that.rootVolumeEncryptionEnabled) : that.rootVolumeEncryptionEnabled != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.userVolumeEncryptionEnabled != null ? !this.userVolumeEncryptionEnabled.equals(that.userVolumeEncryptionEnabled) : that.userVolumeEncryptionEnabled != null) return false;
            if (this.volumeEncryptionKey != null ? !this.volumeEncryptionKey.equals(that.volumeEncryptionKey) : that.volumeEncryptionKey != null) return false;
            if (this.workspaceProperties != null ? !this.workspaceProperties.equals(that.workspaceProperties) : that.workspaceProperties != null) return false;
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
            int result = this.bundleId.hashCode();
            result = 31 * result + (this.directoryId.hashCode());
            result = 31 * result + (this.userName.hashCode());
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.rootVolumeEncryptionEnabled != null ? this.rootVolumeEncryptionEnabled.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.userVolumeEncryptionEnabled != null ? this.userVolumeEncryptionEnabled.hashCode() : 0);
            result = 31 * result + (this.volumeEncryptionKey != null ? this.volumeEncryptionKey.hashCode() : 0);
            result = 31 * result + (this.workspaceProperties != null ? this.workspaceProperties.hashCode() : 0);
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
