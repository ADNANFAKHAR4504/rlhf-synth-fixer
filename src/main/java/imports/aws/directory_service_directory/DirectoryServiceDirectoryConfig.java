package imports.aws.directory_service_directory;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.001Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.directoryServiceDirectory.DirectoryServiceDirectoryConfig")
@software.amazon.jsii.Jsii.Proxy(DirectoryServiceDirectoryConfig.Jsii$Proxy.class)
public interface DirectoryServiceDirectoryConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#name DirectoryServiceDirectory#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#password DirectoryServiceDirectory#password}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPassword();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#alias DirectoryServiceDirectory#alias}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAlias() {
        return null;
    }

    /**
     * connect_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#connect_settings DirectoryServiceDirectory#connect_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.directory_service_directory.DirectoryServiceDirectoryConnectSettings getConnectSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#description DirectoryServiceDirectory#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#desired_number_of_domain_controllers DirectoryServiceDirectory#desired_number_of_domain_controllers}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDesiredNumberOfDomainControllers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#edition DirectoryServiceDirectory#edition}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEdition() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#enable_sso DirectoryServiceDirectory#enable_sso}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableSso() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#id DirectoryServiceDirectory#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#short_name DirectoryServiceDirectory#short_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getShortName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#size DirectoryServiceDirectory#size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#tags DirectoryServiceDirectory#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#tags_all DirectoryServiceDirectory#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#timeouts DirectoryServiceDirectory#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.directory_service_directory.DirectoryServiceDirectoryTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#type DirectoryServiceDirectory#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * vpc_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#vpc_settings DirectoryServiceDirectory#vpc_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.directory_service_directory.DirectoryServiceDirectoryVpcSettings getVpcSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DirectoryServiceDirectoryConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DirectoryServiceDirectoryConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DirectoryServiceDirectoryConfig> {
        java.lang.String name;
        java.lang.String password;
        java.lang.String alias;
        imports.aws.directory_service_directory.DirectoryServiceDirectoryConnectSettings connectSettings;
        java.lang.String description;
        java.lang.Number desiredNumberOfDomainControllers;
        java.lang.String edition;
        java.lang.Object enableSso;
        java.lang.String id;
        java.lang.String shortName;
        java.lang.String size;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.directory_service_directory.DirectoryServiceDirectoryTimeouts timeouts;
        java.lang.String type;
        imports.aws.directory_service_directory.DirectoryServiceDirectoryVpcSettings vpcSettings;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#name DirectoryServiceDirectory#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getPassword}
         * @param password Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#password DirectoryServiceDirectory#password}. This parameter is required.
         * @return {@code this}
         */
        public Builder password(java.lang.String password) {
            this.password = password;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getAlias}
         * @param alias Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#alias DirectoryServiceDirectory#alias}.
         * @return {@code this}
         */
        public Builder alias(java.lang.String alias) {
            this.alias = alias;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getConnectSettings}
         * @param connectSettings connect_settings block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#connect_settings DirectoryServiceDirectory#connect_settings}
         * @return {@code this}
         */
        public Builder connectSettings(imports.aws.directory_service_directory.DirectoryServiceDirectoryConnectSettings connectSettings) {
            this.connectSettings = connectSettings;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#description DirectoryServiceDirectory#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getDesiredNumberOfDomainControllers}
         * @param desiredNumberOfDomainControllers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#desired_number_of_domain_controllers DirectoryServiceDirectory#desired_number_of_domain_controllers}.
         * @return {@code this}
         */
        public Builder desiredNumberOfDomainControllers(java.lang.Number desiredNumberOfDomainControllers) {
            this.desiredNumberOfDomainControllers = desiredNumberOfDomainControllers;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getEdition}
         * @param edition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#edition DirectoryServiceDirectory#edition}.
         * @return {@code this}
         */
        public Builder edition(java.lang.String edition) {
            this.edition = edition;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getEnableSso}
         * @param enableSso Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#enable_sso DirectoryServiceDirectory#enable_sso}.
         * @return {@code this}
         */
        public Builder enableSso(java.lang.Boolean enableSso) {
            this.enableSso = enableSso;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getEnableSso}
         * @param enableSso Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#enable_sso DirectoryServiceDirectory#enable_sso}.
         * @return {@code this}
         */
        public Builder enableSso(com.hashicorp.cdktf.IResolvable enableSso) {
            this.enableSso = enableSso;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#id DirectoryServiceDirectory#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getShortName}
         * @param shortName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#short_name DirectoryServiceDirectory#short_name}.
         * @return {@code this}
         */
        public Builder shortName(java.lang.String shortName) {
            this.shortName = shortName;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getSize}
         * @param size Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#size DirectoryServiceDirectory#size}.
         * @return {@code this}
         */
        public Builder size(java.lang.String size) {
            this.size = size;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#tags DirectoryServiceDirectory#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#tags_all DirectoryServiceDirectory#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#timeouts DirectoryServiceDirectory#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.directory_service_directory.DirectoryServiceDirectoryTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#type DirectoryServiceDirectory#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getVpcSettings}
         * @param vpcSettings vpc_settings block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/directory_service_directory#vpc_settings DirectoryServiceDirectory#vpc_settings}
         * @return {@code this}
         */
        public Builder vpcSettings(imports.aws.directory_service_directory.DirectoryServiceDirectoryVpcSettings vpcSettings) {
            this.vpcSettings = vpcSettings;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getDependsOn}
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
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DirectoryServiceDirectoryConfig#getProvisioners}
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
         * @return a new instance of {@link DirectoryServiceDirectoryConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DirectoryServiceDirectoryConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DirectoryServiceDirectoryConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DirectoryServiceDirectoryConfig {
        private final java.lang.String name;
        private final java.lang.String password;
        private final java.lang.String alias;
        private final imports.aws.directory_service_directory.DirectoryServiceDirectoryConnectSettings connectSettings;
        private final java.lang.String description;
        private final java.lang.Number desiredNumberOfDomainControllers;
        private final java.lang.String edition;
        private final java.lang.Object enableSso;
        private final java.lang.String id;
        private final java.lang.String shortName;
        private final java.lang.String size;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.directory_service_directory.DirectoryServiceDirectoryTimeouts timeouts;
        private final java.lang.String type;
        private final imports.aws.directory_service_directory.DirectoryServiceDirectoryVpcSettings vpcSettings;
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
            this.password = software.amazon.jsii.Kernel.get(this, "password", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.alias = software.amazon.jsii.Kernel.get(this, "alias", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connectSettings = software.amazon.jsii.Kernel.get(this, "connectSettings", software.amazon.jsii.NativeType.forClass(imports.aws.directory_service_directory.DirectoryServiceDirectoryConnectSettings.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.desiredNumberOfDomainControllers = software.amazon.jsii.Kernel.get(this, "desiredNumberOfDomainControllers", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.edition = software.amazon.jsii.Kernel.get(this, "edition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enableSso = software.amazon.jsii.Kernel.get(this, "enableSso", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.shortName = software.amazon.jsii.Kernel.get(this, "shortName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.size = software.amazon.jsii.Kernel.get(this, "size", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.directory_service_directory.DirectoryServiceDirectoryTimeouts.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcSettings = software.amazon.jsii.Kernel.get(this, "vpcSettings", software.amazon.jsii.NativeType.forClass(imports.aws.directory_service_directory.DirectoryServiceDirectoryVpcSettings.class));
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
            this.password = java.util.Objects.requireNonNull(builder.password, "password is required");
            this.alias = builder.alias;
            this.connectSettings = builder.connectSettings;
            this.description = builder.description;
            this.desiredNumberOfDomainControllers = builder.desiredNumberOfDomainControllers;
            this.edition = builder.edition;
            this.enableSso = builder.enableSso;
            this.id = builder.id;
            this.shortName = builder.shortName;
            this.size = builder.size;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.type = builder.type;
            this.vpcSettings = builder.vpcSettings;
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
        public final java.lang.String getPassword() {
            return this.password;
        }

        @Override
        public final java.lang.String getAlias() {
            return this.alias;
        }

        @Override
        public final imports.aws.directory_service_directory.DirectoryServiceDirectoryConnectSettings getConnectSettings() {
            return this.connectSettings;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Number getDesiredNumberOfDomainControllers() {
            return this.desiredNumberOfDomainControllers;
        }

        @Override
        public final java.lang.String getEdition() {
            return this.edition;
        }

        @Override
        public final java.lang.Object getEnableSso() {
            return this.enableSso;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getShortName() {
            return this.shortName;
        }

        @Override
        public final java.lang.String getSize() {
            return this.size;
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
        public final imports.aws.directory_service_directory.DirectoryServiceDirectoryTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final imports.aws.directory_service_directory.DirectoryServiceDirectoryVpcSettings getVpcSettings() {
            return this.vpcSettings;
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
            data.set("password", om.valueToTree(this.getPassword()));
            if (this.getAlias() != null) {
                data.set("alias", om.valueToTree(this.getAlias()));
            }
            if (this.getConnectSettings() != null) {
                data.set("connectSettings", om.valueToTree(this.getConnectSettings()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDesiredNumberOfDomainControllers() != null) {
                data.set("desiredNumberOfDomainControllers", om.valueToTree(this.getDesiredNumberOfDomainControllers()));
            }
            if (this.getEdition() != null) {
                data.set("edition", om.valueToTree(this.getEdition()));
            }
            if (this.getEnableSso() != null) {
                data.set("enableSso", om.valueToTree(this.getEnableSso()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getShortName() != null) {
                data.set("shortName", om.valueToTree(this.getShortName()));
            }
            if (this.getSize() != null) {
                data.set("size", om.valueToTree(this.getSize()));
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
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }
            if (this.getVpcSettings() != null) {
                data.set("vpcSettings", om.valueToTree(this.getVpcSettings()));
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
            struct.set("fqn", om.valueToTree("aws.directoryServiceDirectory.DirectoryServiceDirectoryConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DirectoryServiceDirectoryConfig.Jsii$Proxy that = (DirectoryServiceDirectoryConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!password.equals(that.password)) return false;
            if (this.alias != null ? !this.alias.equals(that.alias) : that.alias != null) return false;
            if (this.connectSettings != null ? !this.connectSettings.equals(that.connectSettings) : that.connectSettings != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.desiredNumberOfDomainControllers != null ? !this.desiredNumberOfDomainControllers.equals(that.desiredNumberOfDomainControllers) : that.desiredNumberOfDomainControllers != null) return false;
            if (this.edition != null ? !this.edition.equals(that.edition) : that.edition != null) return false;
            if (this.enableSso != null ? !this.enableSso.equals(that.enableSso) : that.enableSso != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.shortName != null ? !this.shortName.equals(that.shortName) : that.shortName != null) return false;
            if (this.size != null ? !this.size.equals(that.size) : that.size != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.type != null ? !this.type.equals(that.type) : that.type != null) return false;
            if (this.vpcSettings != null ? !this.vpcSettings.equals(that.vpcSettings) : that.vpcSettings != null) return false;
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
            result = 31 * result + (this.password.hashCode());
            result = 31 * result + (this.alias != null ? this.alias.hashCode() : 0);
            result = 31 * result + (this.connectSettings != null ? this.connectSettings.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.desiredNumberOfDomainControllers != null ? this.desiredNumberOfDomainControllers.hashCode() : 0);
            result = 31 * result + (this.edition != null ? this.edition.hashCode() : 0);
            result = 31 * result + (this.enableSso != null ? this.enableSso.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.shortName != null ? this.shortName.hashCode() : 0);
            result = 31 * result + (this.size != null ? this.size.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            result = 31 * result + (this.vpcSettings != null ? this.vpcSettings.hashCode() : 0);
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
