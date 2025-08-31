package imports.aws.kms_custom_key_store;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.477Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kmsCustomKeyStore.KmsCustomKeyStoreConfig")
@software.amazon.jsii.Jsii.Proxy(KmsCustomKeyStoreConfig.Jsii$Proxy.class)
public interface KmsCustomKeyStoreConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#custom_key_store_name KmsCustomKeyStore#custom_key_store_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCustomKeyStoreName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#cloud_hsm_cluster_id KmsCustomKeyStore#cloud_hsm_cluster_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCloudHsmClusterId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#custom_key_store_type KmsCustomKeyStore#custom_key_store_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomKeyStoreType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#id KmsCustomKeyStore#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#key_store_password KmsCustomKeyStore#key_store_password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeyStorePassword() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#timeouts KmsCustomKeyStore#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kms_custom_key_store.KmsCustomKeyStoreTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#trust_anchor_certificate KmsCustomKeyStore#trust_anchor_certificate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTrustAnchorCertificate() {
        return null;
    }

    /**
     * xks_proxy_authentication_credential block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_authentication_credential KmsCustomKeyStore#xks_proxy_authentication_credential}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kms_custom_key_store.KmsCustomKeyStoreXksProxyAuthenticationCredential getXksProxyAuthenticationCredential() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_connectivity KmsCustomKeyStore#xks_proxy_connectivity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getXksProxyConnectivity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_uri_endpoint KmsCustomKeyStore#xks_proxy_uri_endpoint}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getXksProxyUriEndpoint() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_uri_path KmsCustomKeyStore#xks_proxy_uri_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getXksProxyUriPath() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_vpc_endpoint_service_name KmsCustomKeyStore#xks_proxy_vpc_endpoint_service_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getXksProxyVpcEndpointServiceName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KmsCustomKeyStoreConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KmsCustomKeyStoreConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KmsCustomKeyStoreConfig> {
        java.lang.String customKeyStoreName;
        java.lang.String cloudHsmClusterId;
        java.lang.String customKeyStoreType;
        java.lang.String id;
        java.lang.String keyStorePassword;
        imports.aws.kms_custom_key_store.KmsCustomKeyStoreTimeouts timeouts;
        java.lang.String trustAnchorCertificate;
        imports.aws.kms_custom_key_store.KmsCustomKeyStoreXksProxyAuthenticationCredential xksProxyAuthenticationCredential;
        java.lang.String xksProxyConnectivity;
        java.lang.String xksProxyUriEndpoint;
        java.lang.String xksProxyUriPath;
        java.lang.String xksProxyVpcEndpointServiceName;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link KmsCustomKeyStoreConfig#getCustomKeyStoreName}
         * @param customKeyStoreName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#custom_key_store_name KmsCustomKeyStore#custom_key_store_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder customKeyStoreName(java.lang.String customKeyStoreName) {
            this.customKeyStoreName = customKeyStoreName;
            return this;
        }

        /**
         * Sets the value of {@link KmsCustomKeyStoreConfig#getCloudHsmClusterId}
         * @param cloudHsmClusterId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#cloud_hsm_cluster_id KmsCustomKeyStore#cloud_hsm_cluster_id}.
         * @return {@code this}
         */
        public Builder cloudHsmClusterId(java.lang.String cloudHsmClusterId) {
            this.cloudHsmClusterId = cloudHsmClusterId;
            return this;
        }

        /**
         * Sets the value of {@link KmsCustomKeyStoreConfig#getCustomKeyStoreType}
         * @param customKeyStoreType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#custom_key_store_type KmsCustomKeyStore#custom_key_store_type}.
         * @return {@code this}
         */
        public Builder customKeyStoreType(java.lang.String customKeyStoreType) {
            this.customKeyStoreType = customKeyStoreType;
            return this;
        }

        /**
         * Sets the value of {@link KmsCustomKeyStoreConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#id KmsCustomKeyStore#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link KmsCustomKeyStoreConfig#getKeyStorePassword}
         * @param keyStorePassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#key_store_password KmsCustomKeyStore#key_store_password}.
         * @return {@code this}
         */
        public Builder keyStorePassword(java.lang.String keyStorePassword) {
            this.keyStorePassword = keyStorePassword;
            return this;
        }

        /**
         * Sets the value of {@link KmsCustomKeyStoreConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#timeouts KmsCustomKeyStore#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.kms_custom_key_store.KmsCustomKeyStoreTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link KmsCustomKeyStoreConfig#getTrustAnchorCertificate}
         * @param trustAnchorCertificate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#trust_anchor_certificate KmsCustomKeyStore#trust_anchor_certificate}.
         * @return {@code this}
         */
        public Builder trustAnchorCertificate(java.lang.String trustAnchorCertificate) {
            this.trustAnchorCertificate = trustAnchorCertificate;
            return this;
        }

        /**
         * Sets the value of {@link KmsCustomKeyStoreConfig#getXksProxyAuthenticationCredential}
         * @param xksProxyAuthenticationCredential xks_proxy_authentication_credential block.
         *                                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_authentication_credential KmsCustomKeyStore#xks_proxy_authentication_credential}
         * @return {@code this}
         */
        public Builder xksProxyAuthenticationCredential(imports.aws.kms_custom_key_store.KmsCustomKeyStoreXksProxyAuthenticationCredential xksProxyAuthenticationCredential) {
            this.xksProxyAuthenticationCredential = xksProxyAuthenticationCredential;
            return this;
        }

        /**
         * Sets the value of {@link KmsCustomKeyStoreConfig#getXksProxyConnectivity}
         * @param xksProxyConnectivity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_connectivity KmsCustomKeyStore#xks_proxy_connectivity}.
         * @return {@code this}
         */
        public Builder xksProxyConnectivity(java.lang.String xksProxyConnectivity) {
            this.xksProxyConnectivity = xksProxyConnectivity;
            return this;
        }

        /**
         * Sets the value of {@link KmsCustomKeyStoreConfig#getXksProxyUriEndpoint}
         * @param xksProxyUriEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_uri_endpoint KmsCustomKeyStore#xks_proxy_uri_endpoint}.
         * @return {@code this}
         */
        public Builder xksProxyUriEndpoint(java.lang.String xksProxyUriEndpoint) {
            this.xksProxyUriEndpoint = xksProxyUriEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link KmsCustomKeyStoreConfig#getXksProxyUriPath}
         * @param xksProxyUriPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_uri_path KmsCustomKeyStore#xks_proxy_uri_path}.
         * @return {@code this}
         */
        public Builder xksProxyUriPath(java.lang.String xksProxyUriPath) {
            this.xksProxyUriPath = xksProxyUriPath;
            return this;
        }

        /**
         * Sets the value of {@link KmsCustomKeyStoreConfig#getXksProxyVpcEndpointServiceName}
         * @param xksProxyVpcEndpointServiceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_vpc_endpoint_service_name KmsCustomKeyStore#xks_proxy_vpc_endpoint_service_name}.
         * @return {@code this}
         */
        public Builder xksProxyVpcEndpointServiceName(java.lang.String xksProxyVpcEndpointServiceName) {
            this.xksProxyVpcEndpointServiceName = xksProxyVpcEndpointServiceName;
            return this;
        }

        /**
         * Sets the value of {@link KmsCustomKeyStoreConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link KmsCustomKeyStoreConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link KmsCustomKeyStoreConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link KmsCustomKeyStoreConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link KmsCustomKeyStoreConfig#getDependsOn}
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
         * Sets the value of {@link KmsCustomKeyStoreConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link KmsCustomKeyStoreConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link KmsCustomKeyStoreConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link KmsCustomKeyStoreConfig#getProvisioners}
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
         * @return a new instance of {@link KmsCustomKeyStoreConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KmsCustomKeyStoreConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KmsCustomKeyStoreConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KmsCustomKeyStoreConfig {
        private final java.lang.String customKeyStoreName;
        private final java.lang.String cloudHsmClusterId;
        private final java.lang.String customKeyStoreType;
        private final java.lang.String id;
        private final java.lang.String keyStorePassword;
        private final imports.aws.kms_custom_key_store.KmsCustomKeyStoreTimeouts timeouts;
        private final java.lang.String trustAnchorCertificate;
        private final imports.aws.kms_custom_key_store.KmsCustomKeyStoreXksProxyAuthenticationCredential xksProxyAuthenticationCredential;
        private final java.lang.String xksProxyConnectivity;
        private final java.lang.String xksProxyUriEndpoint;
        private final java.lang.String xksProxyUriPath;
        private final java.lang.String xksProxyVpcEndpointServiceName;
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
            this.customKeyStoreName = software.amazon.jsii.Kernel.get(this, "customKeyStoreName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cloudHsmClusterId = software.amazon.jsii.Kernel.get(this, "cloudHsmClusterId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customKeyStoreType = software.amazon.jsii.Kernel.get(this, "customKeyStoreType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyStorePassword = software.amazon.jsii.Kernel.get(this, "keyStorePassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.kms_custom_key_store.KmsCustomKeyStoreTimeouts.class));
            this.trustAnchorCertificate = software.amazon.jsii.Kernel.get(this, "trustAnchorCertificate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.xksProxyAuthenticationCredential = software.amazon.jsii.Kernel.get(this, "xksProxyAuthenticationCredential", software.amazon.jsii.NativeType.forClass(imports.aws.kms_custom_key_store.KmsCustomKeyStoreXksProxyAuthenticationCredential.class));
            this.xksProxyConnectivity = software.amazon.jsii.Kernel.get(this, "xksProxyConnectivity", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.xksProxyUriEndpoint = software.amazon.jsii.Kernel.get(this, "xksProxyUriEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.xksProxyUriPath = software.amazon.jsii.Kernel.get(this, "xksProxyUriPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.xksProxyVpcEndpointServiceName = software.amazon.jsii.Kernel.get(this, "xksProxyVpcEndpointServiceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.customKeyStoreName = java.util.Objects.requireNonNull(builder.customKeyStoreName, "customKeyStoreName is required");
            this.cloudHsmClusterId = builder.cloudHsmClusterId;
            this.customKeyStoreType = builder.customKeyStoreType;
            this.id = builder.id;
            this.keyStorePassword = builder.keyStorePassword;
            this.timeouts = builder.timeouts;
            this.trustAnchorCertificate = builder.trustAnchorCertificate;
            this.xksProxyAuthenticationCredential = builder.xksProxyAuthenticationCredential;
            this.xksProxyConnectivity = builder.xksProxyConnectivity;
            this.xksProxyUriEndpoint = builder.xksProxyUriEndpoint;
            this.xksProxyUriPath = builder.xksProxyUriPath;
            this.xksProxyVpcEndpointServiceName = builder.xksProxyVpcEndpointServiceName;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getCustomKeyStoreName() {
            return this.customKeyStoreName;
        }

        @Override
        public final java.lang.String getCloudHsmClusterId() {
            return this.cloudHsmClusterId;
        }

        @Override
        public final java.lang.String getCustomKeyStoreType() {
            return this.customKeyStoreType;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getKeyStorePassword() {
            return this.keyStorePassword;
        }

        @Override
        public final imports.aws.kms_custom_key_store.KmsCustomKeyStoreTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getTrustAnchorCertificate() {
            return this.trustAnchorCertificate;
        }

        @Override
        public final imports.aws.kms_custom_key_store.KmsCustomKeyStoreXksProxyAuthenticationCredential getXksProxyAuthenticationCredential() {
            return this.xksProxyAuthenticationCredential;
        }

        @Override
        public final java.lang.String getXksProxyConnectivity() {
            return this.xksProxyConnectivity;
        }

        @Override
        public final java.lang.String getXksProxyUriEndpoint() {
            return this.xksProxyUriEndpoint;
        }

        @Override
        public final java.lang.String getXksProxyUriPath() {
            return this.xksProxyUriPath;
        }

        @Override
        public final java.lang.String getXksProxyVpcEndpointServiceName() {
            return this.xksProxyVpcEndpointServiceName;
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

            data.set("customKeyStoreName", om.valueToTree(this.getCustomKeyStoreName()));
            if (this.getCloudHsmClusterId() != null) {
                data.set("cloudHsmClusterId", om.valueToTree(this.getCloudHsmClusterId()));
            }
            if (this.getCustomKeyStoreType() != null) {
                data.set("customKeyStoreType", om.valueToTree(this.getCustomKeyStoreType()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKeyStorePassword() != null) {
                data.set("keyStorePassword", om.valueToTree(this.getKeyStorePassword()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getTrustAnchorCertificate() != null) {
                data.set("trustAnchorCertificate", om.valueToTree(this.getTrustAnchorCertificate()));
            }
            if (this.getXksProxyAuthenticationCredential() != null) {
                data.set("xksProxyAuthenticationCredential", om.valueToTree(this.getXksProxyAuthenticationCredential()));
            }
            if (this.getXksProxyConnectivity() != null) {
                data.set("xksProxyConnectivity", om.valueToTree(this.getXksProxyConnectivity()));
            }
            if (this.getXksProxyUriEndpoint() != null) {
                data.set("xksProxyUriEndpoint", om.valueToTree(this.getXksProxyUriEndpoint()));
            }
            if (this.getXksProxyUriPath() != null) {
                data.set("xksProxyUriPath", om.valueToTree(this.getXksProxyUriPath()));
            }
            if (this.getXksProxyVpcEndpointServiceName() != null) {
                data.set("xksProxyVpcEndpointServiceName", om.valueToTree(this.getXksProxyVpcEndpointServiceName()));
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
            struct.set("fqn", om.valueToTree("aws.kmsCustomKeyStore.KmsCustomKeyStoreConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KmsCustomKeyStoreConfig.Jsii$Proxy that = (KmsCustomKeyStoreConfig.Jsii$Proxy) o;

            if (!customKeyStoreName.equals(that.customKeyStoreName)) return false;
            if (this.cloudHsmClusterId != null ? !this.cloudHsmClusterId.equals(that.cloudHsmClusterId) : that.cloudHsmClusterId != null) return false;
            if (this.customKeyStoreType != null ? !this.customKeyStoreType.equals(that.customKeyStoreType) : that.customKeyStoreType != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.keyStorePassword != null ? !this.keyStorePassword.equals(that.keyStorePassword) : that.keyStorePassword != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.trustAnchorCertificate != null ? !this.trustAnchorCertificate.equals(that.trustAnchorCertificate) : that.trustAnchorCertificate != null) return false;
            if (this.xksProxyAuthenticationCredential != null ? !this.xksProxyAuthenticationCredential.equals(that.xksProxyAuthenticationCredential) : that.xksProxyAuthenticationCredential != null) return false;
            if (this.xksProxyConnectivity != null ? !this.xksProxyConnectivity.equals(that.xksProxyConnectivity) : that.xksProxyConnectivity != null) return false;
            if (this.xksProxyUriEndpoint != null ? !this.xksProxyUriEndpoint.equals(that.xksProxyUriEndpoint) : that.xksProxyUriEndpoint != null) return false;
            if (this.xksProxyUriPath != null ? !this.xksProxyUriPath.equals(that.xksProxyUriPath) : that.xksProxyUriPath != null) return false;
            if (this.xksProxyVpcEndpointServiceName != null ? !this.xksProxyVpcEndpointServiceName.equals(that.xksProxyVpcEndpointServiceName) : that.xksProxyVpcEndpointServiceName != null) return false;
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
            int result = this.customKeyStoreName.hashCode();
            result = 31 * result + (this.cloudHsmClusterId != null ? this.cloudHsmClusterId.hashCode() : 0);
            result = 31 * result + (this.customKeyStoreType != null ? this.customKeyStoreType.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.keyStorePassword != null ? this.keyStorePassword.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.trustAnchorCertificate != null ? this.trustAnchorCertificate.hashCode() : 0);
            result = 31 * result + (this.xksProxyAuthenticationCredential != null ? this.xksProxyAuthenticationCredential.hashCode() : 0);
            result = 31 * result + (this.xksProxyConnectivity != null ? this.xksProxyConnectivity.hashCode() : 0);
            result = 31 * result + (this.xksProxyUriEndpoint != null ? this.xksProxyUriEndpoint.hashCode() : 0);
            result = 31 * result + (this.xksProxyUriPath != null ? this.xksProxyUriPath.hashCode() : 0);
            result = 31 * result + (this.xksProxyVpcEndpointServiceName != null ? this.xksProxyVpcEndpointServiceName.hashCode() : 0);
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
