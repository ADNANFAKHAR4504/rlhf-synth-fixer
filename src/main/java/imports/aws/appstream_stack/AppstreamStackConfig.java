package imports.aws.appstream_stack;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.062Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appstreamStack.AppstreamStackConfig")
@software.amazon.jsii.Jsii.Proxy(AppstreamStackConfig.Jsii$Proxy.class)
public interface AppstreamStackConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#name AppstreamStack#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * access_endpoints block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#access_endpoints AppstreamStack#access_endpoints}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAccessEndpoints() {
        return null;
    }

    /**
     * application_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#application_settings AppstreamStack#application_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appstream_stack.AppstreamStackApplicationSettings getApplicationSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#description AppstreamStack#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#display_name AppstreamStack#display_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDisplayName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#embed_host_domains AppstreamStack#embed_host_domains}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEmbedHostDomains() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#feedback_url AppstreamStack#feedback_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFeedbackUrl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#id AppstreamStack#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#redirect_url AppstreamStack#redirect_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRedirectUrl() {
        return null;
    }

    /**
     * storage_connectors block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#storage_connectors AppstreamStack#storage_connectors}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStorageConnectors() {
        return null;
    }

    /**
     * streaming_experience_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#streaming_experience_settings AppstreamStack#streaming_experience_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appstream_stack.AppstreamStackStreamingExperienceSettings getStreamingExperienceSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#tags AppstreamStack#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#tags_all AppstreamStack#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * user_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#user_settings AppstreamStack#user_settings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUserSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppstreamStackConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppstreamStackConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppstreamStackConfig> {
        java.lang.String name;
        java.lang.Object accessEndpoints;
        imports.aws.appstream_stack.AppstreamStackApplicationSettings applicationSettings;
        java.lang.String description;
        java.lang.String displayName;
        java.util.List<java.lang.String> embedHostDomains;
        java.lang.String feedbackUrl;
        java.lang.String id;
        java.lang.String redirectUrl;
        java.lang.Object storageConnectors;
        imports.aws.appstream_stack.AppstreamStackStreamingExperienceSettings streamingExperienceSettings;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object userSettings;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link AppstreamStackConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#name AppstreamStack#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getAccessEndpoints}
         * @param accessEndpoints access_endpoints block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#access_endpoints AppstreamStack#access_endpoints}
         * @return {@code this}
         */
        public Builder accessEndpoints(com.hashicorp.cdktf.IResolvable accessEndpoints) {
            this.accessEndpoints = accessEndpoints;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getAccessEndpoints}
         * @param accessEndpoints access_endpoints block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#access_endpoints AppstreamStack#access_endpoints}
         * @return {@code this}
         */
        public Builder accessEndpoints(java.util.List<? extends imports.aws.appstream_stack.AppstreamStackAccessEndpoints> accessEndpoints) {
            this.accessEndpoints = accessEndpoints;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getApplicationSettings}
         * @param applicationSettings application_settings block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#application_settings AppstreamStack#application_settings}
         * @return {@code this}
         */
        public Builder applicationSettings(imports.aws.appstream_stack.AppstreamStackApplicationSettings applicationSettings) {
            this.applicationSettings = applicationSettings;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#description AppstreamStack#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getDisplayName}
         * @param displayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#display_name AppstreamStack#display_name}.
         * @return {@code this}
         */
        public Builder displayName(java.lang.String displayName) {
            this.displayName = displayName;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getEmbedHostDomains}
         * @param embedHostDomains Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#embed_host_domains AppstreamStack#embed_host_domains}.
         * @return {@code this}
         */
        public Builder embedHostDomains(java.util.List<java.lang.String> embedHostDomains) {
            this.embedHostDomains = embedHostDomains;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getFeedbackUrl}
         * @param feedbackUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#feedback_url AppstreamStack#feedback_url}.
         * @return {@code this}
         */
        public Builder feedbackUrl(java.lang.String feedbackUrl) {
            this.feedbackUrl = feedbackUrl;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#id AppstreamStack#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getRedirectUrl}
         * @param redirectUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#redirect_url AppstreamStack#redirect_url}.
         * @return {@code this}
         */
        public Builder redirectUrl(java.lang.String redirectUrl) {
            this.redirectUrl = redirectUrl;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getStorageConnectors}
         * @param storageConnectors storage_connectors block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#storage_connectors AppstreamStack#storage_connectors}
         * @return {@code this}
         */
        public Builder storageConnectors(com.hashicorp.cdktf.IResolvable storageConnectors) {
            this.storageConnectors = storageConnectors;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getStorageConnectors}
         * @param storageConnectors storage_connectors block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#storage_connectors AppstreamStack#storage_connectors}
         * @return {@code this}
         */
        public Builder storageConnectors(java.util.List<? extends imports.aws.appstream_stack.AppstreamStackStorageConnectors> storageConnectors) {
            this.storageConnectors = storageConnectors;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getStreamingExperienceSettings}
         * @param streamingExperienceSettings streaming_experience_settings block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#streaming_experience_settings AppstreamStack#streaming_experience_settings}
         * @return {@code this}
         */
        public Builder streamingExperienceSettings(imports.aws.appstream_stack.AppstreamStackStreamingExperienceSettings streamingExperienceSettings) {
            this.streamingExperienceSettings = streamingExperienceSettings;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#tags AppstreamStack#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#tags_all AppstreamStack#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getUserSettings}
         * @param userSettings user_settings block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#user_settings AppstreamStack#user_settings}
         * @return {@code this}
         */
        public Builder userSettings(com.hashicorp.cdktf.IResolvable userSettings) {
            this.userSettings = userSettings;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getUserSettings}
         * @param userSettings user_settings block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#user_settings AppstreamStack#user_settings}
         * @return {@code this}
         */
        public Builder userSettings(java.util.List<? extends imports.aws.appstream_stack.AppstreamStackUserSettings> userSettings) {
            this.userSettings = userSettings;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getDependsOn}
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
         * Sets the value of {@link AppstreamStackConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackConfig#getProvisioners}
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
         * @return a new instance of {@link AppstreamStackConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppstreamStackConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppstreamStackConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppstreamStackConfig {
        private final java.lang.String name;
        private final java.lang.Object accessEndpoints;
        private final imports.aws.appstream_stack.AppstreamStackApplicationSettings applicationSettings;
        private final java.lang.String description;
        private final java.lang.String displayName;
        private final java.util.List<java.lang.String> embedHostDomains;
        private final java.lang.String feedbackUrl;
        private final java.lang.String id;
        private final java.lang.String redirectUrl;
        private final java.lang.Object storageConnectors;
        private final imports.aws.appstream_stack.AppstreamStackStreamingExperienceSettings streamingExperienceSettings;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Object userSettings;
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
            this.accessEndpoints = software.amazon.jsii.Kernel.get(this, "accessEndpoints", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.applicationSettings = software.amazon.jsii.Kernel.get(this, "applicationSettings", software.amazon.jsii.NativeType.forClass(imports.aws.appstream_stack.AppstreamStackApplicationSettings.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.displayName = software.amazon.jsii.Kernel.get(this, "displayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.embedHostDomains = software.amazon.jsii.Kernel.get(this, "embedHostDomains", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.feedbackUrl = software.amazon.jsii.Kernel.get(this, "feedbackUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.redirectUrl = software.amazon.jsii.Kernel.get(this, "redirectUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.storageConnectors = software.amazon.jsii.Kernel.get(this, "storageConnectors", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.streamingExperienceSettings = software.amazon.jsii.Kernel.get(this, "streamingExperienceSettings", software.amazon.jsii.NativeType.forClass(imports.aws.appstream_stack.AppstreamStackStreamingExperienceSettings.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.userSettings = software.amazon.jsii.Kernel.get(this, "userSettings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.accessEndpoints = builder.accessEndpoints;
            this.applicationSettings = builder.applicationSettings;
            this.description = builder.description;
            this.displayName = builder.displayName;
            this.embedHostDomains = builder.embedHostDomains;
            this.feedbackUrl = builder.feedbackUrl;
            this.id = builder.id;
            this.redirectUrl = builder.redirectUrl;
            this.storageConnectors = builder.storageConnectors;
            this.streamingExperienceSettings = builder.streamingExperienceSettings;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.userSettings = builder.userSettings;
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
        public final java.lang.Object getAccessEndpoints() {
            return this.accessEndpoints;
        }

        @Override
        public final imports.aws.appstream_stack.AppstreamStackApplicationSettings getApplicationSettings() {
            return this.applicationSettings;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getDisplayName() {
            return this.displayName;
        }

        @Override
        public final java.util.List<java.lang.String> getEmbedHostDomains() {
            return this.embedHostDomains;
        }

        @Override
        public final java.lang.String getFeedbackUrl() {
            return this.feedbackUrl;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getRedirectUrl() {
            return this.redirectUrl;
        }

        @Override
        public final java.lang.Object getStorageConnectors() {
            return this.storageConnectors;
        }

        @Override
        public final imports.aws.appstream_stack.AppstreamStackStreamingExperienceSettings getStreamingExperienceSettings() {
            return this.streamingExperienceSettings;
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
        public final java.lang.Object getUserSettings() {
            return this.userSettings;
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
            if (this.getAccessEndpoints() != null) {
                data.set("accessEndpoints", om.valueToTree(this.getAccessEndpoints()));
            }
            if (this.getApplicationSettings() != null) {
                data.set("applicationSettings", om.valueToTree(this.getApplicationSettings()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDisplayName() != null) {
                data.set("displayName", om.valueToTree(this.getDisplayName()));
            }
            if (this.getEmbedHostDomains() != null) {
                data.set("embedHostDomains", om.valueToTree(this.getEmbedHostDomains()));
            }
            if (this.getFeedbackUrl() != null) {
                data.set("feedbackUrl", om.valueToTree(this.getFeedbackUrl()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getRedirectUrl() != null) {
                data.set("redirectUrl", om.valueToTree(this.getRedirectUrl()));
            }
            if (this.getStorageConnectors() != null) {
                data.set("storageConnectors", om.valueToTree(this.getStorageConnectors()));
            }
            if (this.getStreamingExperienceSettings() != null) {
                data.set("streamingExperienceSettings", om.valueToTree(this.getStreamingExperienceSettings()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getUserSettings() != null) {
                data.set("userSettings", om.valueToTree(this.getUserSettings()));
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
            struct.set("fqn", om.valueToTree("aws.appstreamStack.AppstreamStackConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppstreamStackConfig.Jsii$Proxy that = (AppstreamStackConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.accessEndpoints != null ? !this.accessEndpoints.equals(that.accessEndpoints) : that.accessEndpoints != null) return false;
            if (this.applicationSettings != null ? !this.applicationSettings.equals(that.applicationSettings) : that.applicationSettings != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.displayName != null ? !this.displayName.equals(that.displayName) : that.displayName != null) return false;
            if (this.embedHostDomains != null ? !this.embedHostDomains.equals(that.embedHostDomains) : that.embedHostDomains != null) return false;
            if (this.feedbackUrl != null ? !this.feedbackUrl.equals(that.feedbackUrl) : that.feedbackUrl != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.redirectUrl != null ? !this.redirectUrl.equals(that.redirectUrl) : that.redirectUrl != null) return false;
            if (this.storageConnectors != null ? !this.storageConnectors.equals(that.storageConnectors) : that.storageConnectors != null) return false;
            if (this.streamingExperienceSettings != null ? !this.streamingExperienceSettings.equals(that.streamingExperienceSettings) : that.streamingExperienceSettings != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.userSettings != null ? !this.userSettings.equals(that.userSettings) : that.userSettings != null) return false;
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
            result = 31 * result + (this.accessEndpoints != null ? this.accessEndpoints.hashCode() : 0);
            result = 31 * result + (this.applicationSettings != null ? this.applicationSettings.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.displayName != null ? this.displayName.hashCode() : 0);
            result = 31 * result + (this.embedHostDomains != null ? this.embedHostDomains.hashCode() : 0);
            result = 31 * result + (this.feedbackUrl != null ? this.feedbackUrl.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.redirectUrl != null ? this.redirectUrl.hashCode() : 0);
            result = 31 * result + (this.storageConnectors != null ? this.storageConnectors.hashCode() : 0);
            result = 31 * result + (this.streamingExperienceSettings != null ? this.streamingExperienceSettings.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.userSettings != null ? this.userSettings.hashCode() : 0);
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
