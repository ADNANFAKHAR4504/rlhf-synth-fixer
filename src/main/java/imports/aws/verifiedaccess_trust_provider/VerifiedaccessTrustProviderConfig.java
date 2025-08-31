package imports.aws.verifiedaccess_trust_provider;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.579Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedaccessTrustProvider.VerifiedaccessTrustProviderConfig")
@software.amazon.jsii.Jsii.Proxy(VerifiedaccessTrustProviderConfig.Jsii$Proxy.class)
public interface VerifiedaccessTrustProviderConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#policy_reference_name VerifiedaccessTrustProvider#policy_reference_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPolicyReferenceName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#trust_provider_type VerifiedaccessTrustProvider#trust_provider_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTrustProviderType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#description VerifiedaccessTrustProvider#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * device_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#device_options VerifiedaccessTrustProvider#device_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderDeviceOptions getDeviceOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#device_trust_provider_type VerifiedaccessTrustProvider#device_trust_provider_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeviceTrustProviderType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#id VerifiedaccessTrustProvider#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * native_application_oidc_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#native_application_oidc_options VerifiedaccessTrustProvider#native_application_oidc_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderNativeApplicationOidcOptions getNativeApplicationOidcOptions() {
        return null;
    }

    /**
     * oidc_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#oidc_options VerifiedaccessTrustProvider#oidc_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderOidcOptions getOidcOptions() {
        return null;
    }

    /**
     * sse_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#sse_specification VerifiedaccessTrustProvider#sse_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderSseSpecification getSseSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#tags VerifiedaccessTrustProvider#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#tags_all VerifiedaccessTrustProvider#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#timeouts VerifiedaccessTrustProvider#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#user_trust_provider_type VerifiedaccessTrustProvider#user_trust_provider_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserTrustProviderType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VerifiedaccessTrustProviderConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedaccessTrustProviderConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedaccessTrustProviderConfig> {
        java.lang.String policyReferenceName;
        java.lang.String trustProviderType;
        java.lang.String description;
        imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderDeviceOptions deviceOptions;
        java.lang.String deviceTrustProviderType;
        java.lang.String id;
        imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderNativeApplicationOidcOptions nativeApplicationOidcOptions;
        imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderOidcOptions oidcOptions;
        imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderSseSpecification sseSpecification;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderTimeouts timeouts;
        java.lang.String userTrustProviderType;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getPolicyReferenceName}
         * @param policyReferenceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#policy_reference_name VerifiedaccessTrustProvider#policy_reference_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder policyReferenceName(java.lang.String policyReferenceName) {
            this.policyReferenceName = policyReferenceName;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getTrustProviderType}
         * @param trustProviderType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#trust_provider_type VerifiedaccessTrustProvider#trust_provider_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder trustProviderType(java.lang.String trustProviderType) {
            this.trustProviderType = trustProviderType;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#description VerifiedaccessTrustProvider#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getDeviceOptions}
         * @param deviceOptions device_options block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#device_options VerifiedaccessTrustProvider#device_options}
         * @return {@code this}
         */
        public Builder deviceOptions(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderDeviceOptions deviceOptions) {
            this.deviceOptions = deviceOptions;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getDeviceTrustProviderType}
         * @param deviceTrustProviderType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#device_trust_provider_type VerifiedaccessTrustProvider#device_trust_provider_type}.
         * @return {@code this}
         */
        public Builder deviceTrustProviderType(java.lang.String deviceTrustProviderType) {
            this.deviceTrustProviderType = deviceTrustProviderType;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#id VerifiedaccessTrustProvider#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getNativeApplicationOidcOptions}
         * @param nativeApplicationOidcOptions native_application_oidc_options block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#native_application_oidc_options VerifiedaccessTrustProvider#native_application_oidc_options}
         * @return {@code this}
         */
        public Builder nativeApplicationOidcOptions(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderNativeApplicationOidcOptions nativeApplicationOidcOptions) {
            this.nativeApplicationOidcOptions = nativeApplicationOidcOptions;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getOidcOptions}
         * @param oidcOptions oidc_options block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#oidc_options VerifiedaccessTrustProvider#oidc_options}
         * @return {@code this}
         */
        public Builder oidcOptions(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderOidcOptions oidcOptions) {
            this.oidcOptions = oidcOptions;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getSseSpecification}
         * @param sseSpecification sse_specification block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#sse_specification VerifiedaccessTrustProvider#sse_specification}
         * @return {@code this}
         */
        public Builder sseSpecification(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderSseSpecification sseSpecification) {
            this.sseSpecification = sseSpecification;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#tags VerifiedaccessTrustProvider#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#tags_all VerifiedaccessTrustProvider#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#timeouts VerifiedaccessTrustProvider#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getUserTrustProviderType}
         * @param userTrustProviderType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#user_trust_provider_type VerifiedaccessTrustProvider#user_trust_provider_type}.
         * @return {@code this}
         */
        public Builder userTrustProviderType(java.lang.String userTrustProviderType) {
            this.userTrustProviderType = userTrustProviderType;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getDependsOn}
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
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderConfig#getProvisioners}
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
         * @return a new instance of {@link VerifiedaccessTrustProviderConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedaccessTrustProviderConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedaccessTrustProviderConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedaccessTrustProviderConfig {
        private final java.lang.String policyReferenceName;
        private final java.lang.String trustProviderType;
        private final java.lang.String description;
        private final imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderDeviceOptions deviceOptions;
        private final java.lang.String deviceTrustProviderType;
        private final java.lang.String id;
        private final imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderNativeApplicationOidcOptions nativeApplicationOidcOptions;
        private final imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderOidcOptions oidcOptions;
        private final imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderSseSpecification sseSpecification;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderTimeouts timeouts;
        private final java.lang.String userTrustProviderType;
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
            this.policyReferenceName = software.amazon.jsii.Kernel.get(this, "policyReferenceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.trustProviderType = software.amazon.jsii.Kernel.get(this, "trustProviderType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deviceOptions = software.amazon.jsii.Kernel.get(this, "deviceOptions", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderDeviceOptions.class));
            this.deviceTrustProviderType = software.amazon.jsii.Kernel.get(this, "deviceTrustProviderType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nativeApplicationOidcOptions = software.amazon.jsii.Kernel.get(this, "nativeApplicationOidcOptions", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderNativeApplicationOidcOptions.class));
            this.oidcOptions = software.amazon.jsii.Kernel.get(this, "oidcOptions", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderOidcOptions.class));
            this.sseSpecification = software.amazon.jsii.Kernel.get(this, "sseSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderSseSpecification.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderTimeouts.class));
            this.userTrustProviderType = software.amazon.jsii.Kernel.get(this, "userTrustProviderType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.policyReferenceName = java.util.Objects.requireNonNull(builder.policyReferenceName, "policyReferenceName is required");
            this.trustProviderType = java.util.Objects.requireNonNull(builder.trustProviderType, "trustProviderType is required");
            this.description = builder.description;
            this.deviceOptions = builder.deviceOptions;
            this.deviceTrustProviderType = builder.deviceTrustProviderType;
            this.id = builder.id;
            this.nativeApplicationOidcOptions = builder.nativeApplicationOidcOptions;
            this.oidcOptions = builder.oidcOptions;
            this.sseSpecification = builder.sseSpecification;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.userTrustProviderType = builder.userTrustProviderType;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getPolicyReferenceName() {
            return this.policyReferenceName;
        }

        @Override
        public final java.lang.String getTrustProviderType() {
            return this.trustProviderType;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderDeviceOptions getDeviceOptions() {
            return this.deviceOptions;
        }

        @Override
        public final java.lang.String getDeviceTrustProviderType() {
            return this.deviceTrustProviderType;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderNativeApplicationOidcOptions getNativeApplicationOidcOptions() {
            return this.nativeApplicationOidcOptions;
        }

        @Override
        public final imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderOidcOptions getOidcOptions() {
            return this.oidcOptions;
        }

        @Override
        public final imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderSseSpecification getSseSpecification() {
            return this.sseSpecification;
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
        public final imports.aws.verifiedaccess_trust_provider.VerifiedaccessTrustProviderTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getUserTrustProviderType() {
            return this.userTrustProviderType;
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

            data.set("policyReferenceName", om.valueToTree(this.getPolicyReferenceName()));
            data.set("trustProviderType", om.valueToTree(this.getTrustProviderType()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDeviceOptions() != null) {
                data.set("deviceOptions", om.valueToTree(this.getDeviceOptions()));
            }
            if (this.getDeviceTrustProviderType() != null) {
                data.set("deviceTrustProviderType", om.valueToTree(this.getDeviceTrustProviderType()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getNativeApplicationOidcOptions() != null) {
                data.set("nativeApplicationOidcOptions", om.valueToTree(this.getNativeApplicationOidcOptions()));
            }
            if (this.getOidcOptions() != null) {
                data.set("oidcOptions", om.valueToTree(this.getOidcOptions()));
            }
            if (this.getSseSpecification() != null) {
                data.set("sseSpecification", om.valueToTree(this.getSseSpecification()));
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
            if (this.getUserTrustProviderType() != null) {
                data.set("userTrustProviderType", om.valueToTree(this.getUserTrustProviderType()));
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
            struct.set("fqn", om.valueToTree("aws.verifiedaccessTrustProvider.VerifiedaccessTrustProviderConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedaccessTrustProviderConfig.Jsii$Proxy that = (VerifiedaccessTrustProviderConfig.Jsii$Proxy) o;

            if (!policyReferenceName.equals(that.policyReferenceName)) return false;
            if (!trustProviderType.equals(that.trustProviderType)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.deviceOptions != null ? !this.deviceOptions.equals(that.deviceOptions) : that.deviceOptions != null) return false;
            if (this.deviceTrustProviderType != null ? !this.deviceTrustProviderType.equals(that.deviceTrustProviderType) : that.deviceTrustProviderType != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.nativeApplicationOidcOptions != null ? !this.nativeApplicationOidcOptions.equals(that.nativeApplicationOidcOptions) : that.nativeApplicationOidcOptions != null) return false;
            if (this.oidcOptions != null ? !this.oidcOptions.equals(that.oidcOptions) : that.oidcOptions != null) return false;
            if (this.sseSpecification != null ? !this.sseSpecification.equals(that.sseSpecification) : that.sseSpecification != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.userTrustProviderType != null ? !this.userTrustProviderType.equals(that.userTrustProviderType) : that.userTrustProviderType != null) return false;
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
            int result = this.policyReferenceName.hashCode();
            result = 31 * result + (this.trustProviderType.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.deviceOptions != null ? this.deviceOptions.hashCode() : 0);
            result = 31 * result + (this.deviceTrustProviderType != null ? this.deviceTrustProviderType.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.nativeApplicationOidcOptions != null ? this.nativeApplicationOidcOptions.hashCode() : 0);
            result = 31 * result + (this.oidcOptions != null ? this.oidcOptions.hashCode() : 0);
            result = 31 * result + (this.sseSpecification != null ? this.sseSpecification.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.userTrustProviderType != null ? this.userTrustProviderType.hashCode() : 0);
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
