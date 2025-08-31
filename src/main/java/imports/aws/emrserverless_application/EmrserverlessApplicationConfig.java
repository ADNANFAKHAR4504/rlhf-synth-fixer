package imports.aws.emrserverless_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.209Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrserverlessApplication.EmrserverlessApplicationConfig")
@software.amazon.jsii.Jsii.Proxy(EmrserverlessApplicationConfig.Jsii$Proxy.class)
public interface EmrserverlessApplicationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#name EmrserverlessApplication#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#release_label EmrserverlessApplication#release_label}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getReleaseLabel();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#type EmrserverlessApplication#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#architecture EmrserverlessApplication#architecture}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getArchitecture() {
        return null;
    }

    /**
     * auto_start_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#auto_start_configuration EmrserverlessApplication#auto_start_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emrserverless_application.EmrserverlessApplicationAutoStartConfiguration getAutoStartConfiguration() {
        return null;
    }

    /**
     * auto_stop_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#auto_stop_configuration EmrserverlessApplication#auto_stop_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emrserverless_application.EmrserverlessApplicationAutoStopConfiguration getAutoStopConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#id EmrserverlessApplication#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * image_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#image_configuration EmrserverlessApplication#image_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emrserverless_application.EmrserverlessApplicationImageConfiguration getImageConfiguration() {
        return null;
    }

    /**
     * initial_capacity block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#initial_capacity EmrserverlessApplication#initial_capacity}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInitialCapacity() {
        return null;
    }

    /**
     * interactive_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#interactive_configuration EmrserverlessApplication#interactive_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emrserverless_application.EmrserverlessApplicationInteractiveConfiguration getInteractiveConfiguration() {
        return null;
    }

    /**
     * maximum_capacity block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#maximum_capacity EmrserverlessApplication#maximum_capacity}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emrserverless_application.EmrserverlessApplicationMaximumCapacity getMaximumCapacity() {
        return null;
    }

    /**
     * network_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#network_configuration EmrserverlessApplication#network_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emrserverless_application.EmrserverlessApplicationNetworkConfiguration getNetworkConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#tags EmrserverlessApplication#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#tags_all EmrserverlessApplication#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrserverlessApplicationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrserverlessApplicationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrserverlessApplicationConfig> {
        java.lang.String name;
        java.lang.String releaseLabel;
        java.lang.String type;
        java.lang.String architecture;
        imports.aws.emrserverless_application.EmrserverlessApplicationAutoStartConfiguration autoStartConfiguration;
        imports.aws.emrserverless_application.EmrserverlessApplicationAutoStopConfiguration autoStopConfiguration;
        java.lang.String id;
        imports.aws.emrserverless_application.EmrserverlessApplicationImageConfiguration imageConfiguration;
        java.lang.Object initialCapacity;
        imports.aws.emrserverless_application.EmrserverlessApplicationInteractiveConfiguration interactiveConfiguration;
        imports.aws.emrserverless_application.EmrserverlessApplicationMaximumCapacity maximumCapacity;
        imports.aws.emrserverless_application.EmrserverlessApplicationNetworkConfiguration networkConfiguration;
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
         * Sets the value of {@link EmrserverlessApplicationConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#name EmrserverlessApplication#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getReleaseLabel}
         * @param releaseLabel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#release_label EmrserverlessApplication#release_label}. This parameter is required.
         * @return {@code this}
         */
        public Builder releaseLabel(java.lang.String releaseLabel) {
            this.releaseLabel = releaseLabel;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#type EmrserverlessApplication#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getArchitecture}
         * @param architecture Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#architecture EmrserverlessApplication#architecture}.
         * @return {@code this}
         */
        public Builder architecture(java.lang.String architecture) {
            this.architecture = architecture;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getAutoStartConfiguration}
         * @param autoStartConfiguration auto_start_configuration block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#auto_start_configuration EmrserverlessApplication#auto_start_configuration}
         * @return {@code this}
         */
        public Builder autoStartConfiguration(imports.aws.emrserverless_application.EmrserverlessApplicationAutoStartConfiguration autoStartConfiguration) {
            this.autoStartConfiguration = autoStartConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getAutoStopConfiguration}
         * @param autoStopConfiguration auto_stop_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#auto_stop_configuration EmrserverlessApplication#auto_stop_configuration}
         * @return {@code this}
         */
        public Builder autoStopConfiguration(imports.aws.emrserverless_application.EmrserverlessApplicationAutoStopConfiguration autoStopConfiguration) {
            this.autoStopConfiguration = autoStopConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#id EmrserverlessApplication#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getImageConfiguration}
         * @param imageConfiguration image_configuration block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#image_configuration EmrserverlessApplication#image_configuration}
         * @return {@code this}
         */
        public Builder imageConfiguration(imports.aws.emrserverless_application.EmrserverlessApplicationImageConfiguration imageConfiguration) {
            this.imageConfiguration = imageConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getInitialCapacity}
         * @param initialCapacity initial_capacity block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#initial_capacity EmrserverlessApplication#initial_capacity}
         * @return {@code this}
         */
        public Builder initialCapacity(com.hashicorp.cdktf.IResolvable initialCapacity) {
            this.initialCapacity = initialCapacity;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getInitialCapacity}
         * @param initialCapacity initial_capacity block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#initial_capacity EmrserverlessApplication#initial_capacity}
         * @return {@code this}
         */
        public Builder initialCapacity(java.util.List<? extends imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacity> initialCapacity) {
            this.initialCapacity = initialCapacity;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getInteractiveConfiguration}
         * @param interactiveConfiguration interactive_configuration block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#interactive_configuration EmrserverlessApplication#interactive_configuration}
         * @return {@code this}
         */
        public Builder interactiveConfiguration(imports.aws.emrserverless_application.EmrserverlessApplicationInteractiveConfiguration interactiveConfiguration) {
            this.interactiveConfiguration = interactiveConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getMaximumCapacity}
         * @param maximumCapacity maximum_capacity block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#maximum_capacity EmrserverlessApplication#maximum_capacity}
         * @return {@code this}
         */
        public Builder maximumCapacity(imports.aws.emrserverless_application.EmrserverlessApplicationMaximumCapacity maximumCapacity) {
            this.maximumCapacity = maximumCapacity;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getNetworkConfiguration}
         * @param networkConfiguration network_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#network_configuration EmrserverlessApplication#network_configuration}
         * @return {@code this}
         */
        public Builder networkConfiguration(imports.aws.emrserverless_application.EmrserverlessApplicationNetworkConfiguration networkConfiguration) {
            this.networkConfiguration = networkConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#tags EmrserverlessApplication#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#tags_all EmrserverlessApplication#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getDependsOn}
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
         * Sets the value of {@link EmrserverlessApplicationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationConfig#getProvisioners}
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
         * @return a new instance of {@link EmrserverlessApplicationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrserverlessApplicationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrserverlessApplicationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrserverlessApplicationConfig {
        private final java.lang.String name;
        private final java.lang.String releaseLabel;
        private final java.lang.String type;
        private final java.lang.String architecture;
        private final imports.aws.emrserverless_application.EmrserverlessApplicationAutoStartConfiguration autoStartConfiguration;
        private final imports.aws.emrserverless_application.EmrserverlessApplicationAutoStopConfiguration autoStopConfiguration;
        private final java.lang.String id;
        private final imports.aws.emrserverless_application.EmrserverlessApplicationImageConfiguration imageConfiguration;
        private final java.lang.Object initialCapacity;
        private final imports.aws.emrserverless_application.EmrserverlessApplicationInteractiveConfiguration interactiveConfiguration;
        private final imports.aws.emrserverless_application.EmrserverlessApplicationMaximumCapacity maximumCapacity;
        private final imports.aws.emrserverless_application.EmrserverlessApplicationNetworkConfiguration networkConfiguration;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.releaseLabel = software.amazon.jsii.Kernel.get(this, "releaseLabel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.architecture = software.amazon.jsii.Kernel.get(this, "architecture", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.autoStartConfiguration = software.amazon.jsii.Kernel.get(this, "autoStartConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationAutoStartConfiguration.class));
            this.autoStopConfiguration = software.amazon.jsii.Kernel.get(this, "autoStopConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationAutoStopConfiguration.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.imageConfiguration = software.amazon.jsii.Kernel.get(this, "imageConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationImageConfiguration.class));
            this.initialCapacity = software.amazon.jsii.Kernel.get(this, "initialCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.interactiveConfiguration = software.amazon.jsii.Kernel.get(this, "interactiveConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationInteractiveConfiguration.class));
            this.maximumCapacity = software.amazon.jsii.Kernel.get(this, "maximumCapacity", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationMaximumCapacity.class));
            this.networkConfiguration = software.amazon.jsii.Kernel.get(this, "networkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationNetworkConfiguration.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.releaseLabel = java.util.Objects.requireNonNull(builder.releaseLabel, "releaseLabel is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.architecture = builder.architecture;
            this.autoStartConfiguration = builder.autoStartConfiguration;
            this.autoStopConfiguration = builder.autoStopConfiguration;
            this.id = builder.id;
            this.imageConfiguration = builder.imageConfiguration;
            this.initialCapacity = builder.initialCapacity;
            this.interactiveConfiguration = builder.interactiveConfiguration;
            this.maximumCapacity = builder.maximumCapacity;
            this.networkConfiguration = builder.networkConfiguration;
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
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getReleaseLabel() {
            return this.releaseLabel;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getArchitecture() {
            return this.architecture;
        }

        @Override
        public final imports.aws.emrserverless_application.EmrserverlessApplicationAutoStartConfiguration getAutoStartConfiguration() {
            return this.autoStartConfiguration;
        }

        @Override
        public final imports.aws.emrserverless_application.EmrserverlessApplicationAutoStopConfiguration getAutoStopConfiguration() {
            return this.autoStopConfiguration;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.emrserverless_application.EmrserverlessApplicationImageConfiguration getImageConfiguration() {
            return this.imageConfiguration;
        }

        @Override
        public final java.lang.Object getInitialCapacity() {
            return this.initialCapacity;
        }

        @Override
        public final imports.aws.emrserverless_application.EmrserverlessApplicationInteractiveConfiguration getInteractiveConfiguration() {
            return this.interactiveConfiguration;
        }

        @Override
        public final imports.aws.emrserverless_application.EmrserverlessApplicationMaximumCapacity getMaximumCapacity() {
            return this.maximumCapacity;
        }

        @Override
        public final imports.aws.emrserverless_application.EmrserverlessApplicationNetworkConfiguration getNetworkConfiguration() {
            return this.networkConfiguration;
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

            data.set("name", om.valueToTree(this.getName()));
            data.set("releaseLabel", om.valueToTree(this.getReleaseLabel()));
            data.set("type", om.valueToTree(this.getType()));
            if (this.getArchitecture() != null) {
                data.set("architecture", om.valueToTree(this.getArchitecture()));
            }
            if (this.getAutoStartConfiguration() != null) {
                data.set("autoStartConfiguration", om.valueToTree(this.getAutoStartConfiguration()));
            }
            if (this.getAutoStopConfiguration() != null) {
                data.set("autoStopConfiguration", om.valueToTree(this.getAutoStopConfiguration()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getImageConfiguration() != null) {
                data.set("imageConfiguration", om.valueToTree(this.getImageConfiguration()));
            }
            if (this.getInitialCapacity() != null) {
                data.set("initialCapacity", om.valueToTree(this.getInitialCapacity()));
            }
            if (this.getInteractiveConfiguration() != null) {
                data.set("interactiveConfiguration", om.valueToTree(this.getInteractiveConfiguration()));
            }
            if (this.getMaximumCapacity() != null) {
                data.set("maximumCapacity", om.valueToTree(this.getMaximumCapacity()));
            }
            if (this.getNetworkConfiguration() != null) {
                data.set("networkConfiguration", om.valueToTree(this.getNetworkConfiguration()));
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
            struct.set("fqn", om.valueToTree("aws.emrserverlessApplication.EmrserverlessApplicationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrserverlessApplicationConfig.Jsii$Proxy that = (EmrserverlessApplicationConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!releaseLabel.equals(that.releaseLabel)) return false;
            if (!type.equals(that.type)) return false;
            if (this.architecture != null ? !this.architecture.equals(that.architecture) : that.architecture != null) return false;
            if (this.autoStartConfiguration != null ? !this.autoStartConfiguration.equals(that.autoStartConfiguration) : that.autoStartConfiguration != null) return false;
            if (this.autoStopConfiguration != null ? !this.autoStopConfiguration.equals(that.autoStopConfiguration) : that.autoStopConfiguration != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.imageConfiguration != null ? !this.imageConfiguration.equals(that.imageConfiguration) : that.imageConfiguration != null) return false;
            if (this.initialCapacity != null ? !this.initialCapacity.equals(that.initialCapacity) : that.initialCapacity != null) return false;
            if (this.interactiveConfiguration != null ? !this.interactiveConfiguration.equals(that.interactiveConfiguration) : that.interactiveConfiguration != null) return false;
            if (this.maximumCapacity != null ? !this.maximumCapacity.equals(that.maximumCapacity) : that.maximumCapacity != null) return false;
            if (this.networkConfiguration != null ? !this.networkConfiguration.equals(that.networkConfiguration) : that.networkConfiguration != null) return false;
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
            int result = this.name.hashCode();
            result = 31 * result + (this.releaseLabel.hashCode());
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.architecture != null ? this.architecture.hashCode() : 0);
            result = 31 * result + (this.autoStartConfiguration != null ? this.autoStartConfiguration.hashCode() : 0);
            result = 31 * result + (this.autoStopConfiguration != null ? this.autoStopConfiguration.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.imageConfiguration != null ? this.imageConfiguration.hashCode() : 0);
            result = 31 * result + (this.initialCapacity != null ? this.initialCapacity.hashCode() : 0);
            result = 31 * result + (this.interactiveConfiguration != null ? this.interactiveConfiguration.hashCode() : 0);
            result = 31 * result + (this.maximumCapacity != null ? this.maximumCapacity.hashCode() : 0);
            result = 31 * result + (this.networkConfiguration != null ? this.networkConfiguration.hashCode() : 0);
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
