package imports.aws.directory_service_radius_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.002Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.directoryServiceRadiusSettings.DirectoryServiceRadiusSettingsConfig")
@software.amazon.jsii.Jsii.Proxy(DirectoryServiceRadiusSettingsConfig.Jsii$Proxy.class)
public interface DirectoryServiceRadiusSettingsConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#authentication_protocol DirectoryServiceRadiusSettings#authentication_protocol}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAuthenticationProtocol();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#directory_id DirectoryServiceRadiusSettings#directory_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDirectoryId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#display_label DirectoryServiceRadiusSettings#display_label}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDisplayLabel();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#radius_port DirectoryServiceRadiusSettings#radius_port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getRadiusPort();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#radius_retries DirectoryServiceRadiusSettings#radius_retries}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getRadiusRetries();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#radius_servers DirectoryServiceRadiusSettings#radius_servers}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRadiusServers();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#radius_timeout DirectoryServiceRadiusSettings#radius_timeout}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getRadiusTimeout();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#shared_secret DirectoryServiceRadiusSettings#shared_secret}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSharedSecret();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#id DirectoryServiceRadiusSettings#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#timeouts DirectoryServiceRadiusSettings#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.directory_service_radius_settings.DirectoryServiceRadiusSettingsTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#use_same_username DirectoryServiceRadiusSettings#use_same_username}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUseSameUsername() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DirectoryServiceRadiusSettingsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DirectoryServiceRadiusSettingsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DirectoryServiceRadiusSettingsConfig> {
        java.lang.String authenticationProtocol;
        java.lang.String directoryId;
        java.lang.String displayLabel;
        java.lang.Number radiusPort;
        java.lang.Number radiusRetries;
        java.util.List<java.lang.String> radiusServers;
        java.lang.Number radiusTimeout;
        java.lang.String sharedSecret;
        java.lang.String id;
        imports.aws.directory_service_radius_settings.DirectoryServiceRadiusSettingsTimeouts timeouts;
        java.lang.Object useSameUsername;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DirectoryServiceRadiusSettingsConfig#getAuthenticationProtocol}
         * @param authenticationProtocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#authentication_protocol DirectoryServiceRadiusSettings#authentication_protocol}. This parameter is required.
         * @return {@code this}
         */
        public Builder authenticationProtocol(java.lang.String authenticationProtocol) {
            this.authenticationProtocol = authenticationProtocol;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceRadiusSettingsConfig#getDirectoryId}
         * @param directoryId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#directory_id DirectoryServiceRadiusSettings#directory_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder directoryId(java.lang.String directoryId) {
            this.directoryId = directoryId;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceRadiusSettingsConfig#getDisplayLabel}
         * @param displayLabel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#display_label DirectoryServiceRadiusSettings#display_label}. This parameter is required.
         * @return {@code this}
         */
        public Builder displayLabel(java.lang.String displayLabel) {
            this.displayLabel = displayLabel;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceRadiusSettingsConfig#getRadiusPort}
         * @param radiusPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#radius_port DirectoryServiceRadiusSettings#radius_port}. This parameter is required.
         * @return {@code this}
         */
        public Builder radiusPort(java.lang.Number radiusPort) {
            this.radiusPort = radiusPort;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceRadiusSettingsConfig#getRadiusRetries}
         * @param radiusRetries Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#radius_retries DirectoryServiceRadiusSettings#radius_retries}. This parameter is required.
         * @return {@code this}
         */
        public Builder radiusRetries(java.lang.Number radiusRetries) {
            this.radiusRetries = radiusRetries;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceRadiusSettingsConfig#getRadiusServers}
         * @param radiusServers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#radius_servers DirectoryServiceRadiusSettings#radius_servers}. This parameter is required.
         * @return {@code this}
         */
        public Builder radiusServers(java.util.List<java.lang.String> radiusServers) {
            this.radiusServers = radiusServers;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceRadiusSettingsConfig#getRadiusTimeout}
         * @param radiusTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#radius_timeout DirectoryServiceRadiusSettings#radius_timeout}. This parameter is required.
         * @return {@code this}
         */
        public Builder radiusTimeout(java.lang.Number radiusTimeout) {
            this.radiusTimeout = radiusTimeout;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceRadiusSettingsConfig#getSharedSecret}
         * @param sharedSecret Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#shared_secret DirectoryServiceRadiusSettings#shared_secret}. This parameter is required.
         * @return {@code this}
         */
        public Builder sharedSecret(java.lang.String sharedSecret) {
            this.sharedSecret = sharedSecret;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceRadiusSettingsConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#id DirectoryServiceRadiusSettings#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceRadiusSettingsConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#timeouts DirectoryServiceRadiusSettings#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.directory_service_radius_settings.DirectoryServiceRadiusSettingsTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceRadiusSettingsConfig#getUseSameUsername}
         * @param useSameUsername Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#use_same_username DirectoryServiceRadiusSettings#use_same_username}.
         * @return {@code this}
         */
        public Builder useSameUsername(java.lang.Boolean useSameUsername) {
            this.useSameUsername = useSameUsername;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceRadiusSettingsConfig#getUseSameUsername}
         * @param useSameUsername Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_radius_settings#use_same_username DirectoryServiceRadiusSettings#use_same_username}.
         * @return {@code this}
         */
        public Builder useSameUsername(com.hashicorp.cdktf.IResolvable useSameUsername) {
            this.useSameUsername = useSameUsername;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceRadiusSettingsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceRadiusSettingsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceRadiusSettingsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceRadiusSettingsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceRadiusSettingsConfig#getDependsOn}
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
         * Sets the value of {@link DirectoryServiceRadiusSettingsConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceRadiusSettingsConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceRadiusSettingsConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceRadiusSettingsConfig#getProvisioners}
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
         * @return a new instance of {@link DirectoryServiceRadiusSettingsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DirectoryServiceRadiusSettingsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DirectoryServiceRadiusSettingsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DirectoryServiceRadiusSettingsConfig {
        private final java.lang.String authenticationProtocol;
        private final java.lang.String directoryId;
        private final java.lang.String displayLabel;
        private final java.lang.Number radiusPort;
        private final java.lang.Number radiusRetries;
        private final java.util.List<java.lang.String> radiusServers;
        private final java.lang.Number radiusTimeout;
        private final java.lang.String sharedSecret;
        private final java.lang.String id;
        private final imports.aws.directory_service_radius_settings.DirectoryServiceRadiusSettingsTimeouts timeouts;
        private final java.lang.Object useSameUsername;
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
            this.authenticationProtocol = software.amazon.jsii.Kernel.get(this, "authenticationProtocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.directoryId = software.amazon.jsii.Kernel.get(this, "directoryId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.displayLabel = software.amazon.jsii.Kernel.get(this, "displayLabel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.radiusPort = software.amazon.jsii.Kernel.get(this, "radiusPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.radiusRetries = software.amazon.jsii.Kernel.get(this, "radiusRetries", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.radiusServers = software.amazon.jsii.Kernel.get(this, "radiusServers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.radiusTimeout = software.amazon.jsii.Kernel.get(this, "radiusTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.sharedSecret = software.amazon.jsii.Kernel.get(this, "sharedSecret", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.directory_service_radius_settings.DirectoryServiceRadiusSettingsTimeouts.class));
            this.useSameUsername = software.amazon.jsii.Kernel.get(this, "useSameUsername", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.authenticationProtocol = java.util.Objects.requireNonNull(builder.authenticationProtocol, "authenticationProtocol is required");
            this.directoryId = java.util.Objects.requireNonNull(builder.directoryId, "directoryId is required");
            this.displayLabel = java.util.Objects.requireNonNull(builder.displayLabel, "displayLabel is required");
            this.radiusPort = java.util.Objects.requireNonNull(builder.radiusPort, "radiusPort is required");
            this.radiusRetries = java.util.Objects.requireNonNull(builder.radiusRetries, "radiusRetries is required");
            this.radiusServers = java.util.Objects.requireNonNull(builder.radiusServers, "radiusServers is required");
            this.radiusTimeout = java.util.Objects.requireNonNull(builder.radiusTimeout, "radiusTimeout is required");
            this.sharedSecret = java.util.Objects.requireNonNull(builder.sharedSecret, "sharedSecret is required");
            this.id = builder.id;
            this.timeouts = builder.timeouts;
            this.useSameUsername = builder.useSameUsername;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAuthenticationProtocol() {
            return this.authenticationProtocol;
        }

        @Override
        public final java.lang.String getDirectoryId() {
            return this.directoryId;
        }

        @Override
        public final java.lang.String getDisplayLabel() {
            return this.displayLabel;
        }

        @Override
        public final java.lang.Number getRadiusPort() {
            return this.radiusPort;
        }

        @Override
        public final java.lang.Number getRadiusRetries() {
            return this.radiusRetries;
        }

        @Override
        public final java.util.List<java.lang.String> getRadiusServers() {
            return this.radiusServers;
        }

        @Override
        public final java.lang.Number getRadiusTimeout() {
            return this.radiusTimeout;
        }

        @Override
        public final java.lang.String getSharedSecret() {
            return this.sharedSecret;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.directory_service_radius_settings.DirectoryServiceRadiusSettingsTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getUseSameUsername() {
            return this.useSameUsername;
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

            data.set("authenticationProtocol", om.valueToTree(this.getAuthenticationProtocol()));
            data.set("directoryId", om.valueToTree(this.getDirectoryId()));
            data.set("displayLabel", om.valueToTree(this.getDisplayLabel()));
            data.set("radiusPort", om.valueToTree(this.getRadiusPort()));
            data.set("radiusRetries", om.valueToTree(this.getRadiusRetries()));
            data.set("radiusServers", om.valueToTree(this.getRadiusServers()));
            data.set("radiusTimeout", om.valueToTree(this.getRadiusTimeout()));
            data.set("sharedSecret", om.valueToTree(this.getSharedSecret()));
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getUseSameUsername() != null) {
                data.set("useSameUsername", om.valueToTree(this.getUseSameUsername()));
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
            struct.set("fqn", om.valueToTree("aws.directoryServiceRadiusSettings.DirectoryServiceRadiusSettingsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DirectoryServiceRadiusSettingsConfig.Jsii$Proxy that = (DirectoryServiceRadiusSettingsConfig.Jsii$Proxy) o;

            if (!authenticationProtocol.equals(that.authenticationProtocol)) return false;
            if (!directoryId.equals(that.directoryId)) return false;
            if (!displayLabel.equals(that.displayLabel)) return false;
            if (!radiusPort.equals(that.radiusPort)) return false;
            if (!radiusRetries.equals(that.radiusRetries)) return false;
            if (!radiusServers.equals(that.radiusServers)) return false;
            if (!radiusTimeout.equals(that.radiusTimeout)) return false;
            if (!sharedSecret.equals(that.sharedSecret)) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.useSameUsername != null ? !this.useSameUsername.equals(that.useSameUsername) : that.useSameUsername != null) return false;
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
            int result = this.authenticationProtocol.hashCode();
            result = 31 * result + (this.directoryId.hashCode());
            result = 31 * result + (this.displayLabel.hashCode());
            result = 31 * result + (this.radiusPort.hashCode());
            result = 31 * result + (this.radiusRetries.hashCode());
            result = 31 * result + (this.radiusServers.hashCode());
            result = 31 * result + (this.radiusTimeout.hashCode());
            result = 31 * result + (this.sharedSecret.hashCode());
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.useSameUsername != null ? this.useSameUsername.hashCode() : 0);
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
