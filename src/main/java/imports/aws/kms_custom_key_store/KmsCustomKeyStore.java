package imports.aws.kms_custom_key_store;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store aws_kms_custom_key_store}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.476Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kmsCustomKeyStore.KmsCustomKeyStore")
public class KmsCustomKeyStore extends com.hashicorp.cdktf.TerraformResource {

    protected KmsCustomKeyStore(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KmsCustomKeyStore(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.kms_custom_key_store.KmsCustomKeyStore.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store aws_kms_custom_key_store} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public KmsCustomKeyStore(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.kms_custom_key_store.KmsCustomKeyStoreConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a KmsCustomKeyStore resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the KmsCustomKeyStore to import. This parameter is required.
     * @param importFromId The id of the existing KmsCustomKeyStore that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the KmsCustomKeyStore to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.kms_custom_key_store.KmsCustomKeyStore.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a KmsCustomKeyStore resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the KmsCustomKeyStore to import. This parameter is required.
     * @param importFromId The id of the existing KmsCustomKeyStore that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.kms_custom_key_store.KmsCustomKeyStore.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.kms_custom_key_store.KmsCustomKeyStoreTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putXksProxyAuthenticationCredential(final @org.jetbrains.annotations.NotNull imports.aws.kms_custom_key_store.KmsCustomKeyStoreXksProxyAuthenticationCredential value) {
        software.amazon.jsii.Kernel.call(this, "putXksProxyAuthenticationCredential", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCloudHsmClusterId() {
        software.amazon.jsii.Kernel.call(this, "resetCloudHsmClusterId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomKeyStoreType() {
        software.amazon.jsii.Kernel.call(this, "resetCustomKeyStoreType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeyStorePassword() {
        software.amazon.jsii.Kernel.call(this, "resetKeyStorePassword", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTrustAnchorCertificate() {
        software.amazon.jsii.Kernel.call(this, "resetTrustAnchorCertificate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetXksProxyAuthenticationCredential() {
        software.amazon.jsii.Kernel.call(this, "resetXksProxyAuthenticationCredential", software.amazon.jsii.NativeType.VOID);
    }

    public void resetXksProxyConnectivity() {
        software.amazon.jsii.Kernel.call(this, "resetXksProxyConnectivity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetXksProxyUriEndpoint() {
        software.amazon.jsii.Kernel.call(this, "resetXksProxyUriEndpoint", software.amazon.jsii.NativeType.VOID);
    }

    public void resetXksProxyUriPath() {
        software.amazon.jsii.Kernel.call(this, "resetXksProxyUriPath", software.amazon.jsii.NativeType.VOID);
    }

    public void resetXksProxyVpcEndpointServiceName() {
        software.amazon.jsii.Kernel.call(this, "resetXksProxyVpcEndpointServiceName", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.kms_custom_key_store.KmsCustomKeyStoreTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.kms_custom_key_store.KmsCustomKeyStoreTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kms_custom_key_store.KmsCustomKeyStoreXksProxyAuthenticationCredentialOutputReference getXksProxyAuthenticationCredential() {
        return software.amazon.jsii.Kernel.get(this, "xksProxyAuthenticationCredential", software.amazon.jsii.NativeType.forClass(imports.aws.kms_custom_key_store.KmsCustomKeyStoreXksProxyAuthenticationCredentialOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCloudHsmClusterIdInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudHsmClusterIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomKeyStoreNameInput() {
        return software.amazon.jsii.Kernel.get(this, "customKeyStoreNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomKeyStoreTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "customKeyStoreTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyStorePasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "keyStorePasswordInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTrustAnchorCertificateInput() {
        return software.amazon.jsii.Kernel.get(this, "trustAnchorCertificateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kms_custom_key_store.KmsCustomKeyStoreXksProxyAuthenticationCredential getXksProxyAuthenticationCredentialInput() {
        return software.amazon.jsii.Kernel.get(this, "xksProxyAuthenticationCredentialInput", software.amazon.jsii.NativeType.forClass(imports.aws.kms_custom_key_store.KmsCustomKeyStoreXksProxyAuthenticationCredential.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getXksProxyConnectivityInput() {
        return software.amazon.jsii.Kernel.get(this, "xksProxyConnectivityInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getXksProxyUriEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "xksProxyUriEndpointInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getXksProxyUriPathInput() {
        return software.amazon.jsii.Kernel.get(this, "xksProxyUriPathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getXksProxyVpcEndpointServiceNameInput() {
        return software.amazon.jsii.Kernel.get(this, "xksProxyVpcEndpointServiceNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCloudHsmClusterId() {
        return software.amazon.jsii.Kernel.get(this, "cloudHsmClusterId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCloudHsmClusterId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cloudHsmClusterId", java.util.Objects.requireNonNull(value, "cloudHsmClusterId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomKeyStoreName() {
        return software.amazon.jsii.Kernel.get(this, "customKeyStoreName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomKeyStoreName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customKeyStoreName", java.util.Objects.requireNonNull(value, "customKeyStoreName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomKeyStoreType() {
        return software.amazon.jsii.Kernel.get(this, "customKeyStoreType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomKeyStoreType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customKeyStoreType", java.util.Objects.requireNonNull(value, "customKeyStoreType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyStorePassword() {
        return software.amazon.jsii.Kernel.get(this, "keyStorePassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyStorePassword(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyStorePassword", java.util.Objects.requireNonNull(value, "keyStorePassword is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTrustAnchorCertificate() {
        return software.amazon.jsii.Kernel.get(this, "trustAnchorCertificate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTrustAnchorCertificate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "trustAnchorCertificate", java.util.Objects.requireNonNull(value, "trustAnchorCertificate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getXksProxyConnectivity() {
        return software.amazon.jsii.Kernel.get(this, "xksProxyConnectivity", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setXksProxyConnectivity(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "xksProxyConnectivity", java.util.Objects.requireNonNull(value, "xksProxyConnectivity is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getXksProxyUriEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "xksProxyUriEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setXksProxyUriEndpoint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "xksProxyUriEndpoint", java.util.Objects.requireNonNull(value, "xksProxyUriEndpoint is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getXksProxyUriPath() {
        return software.amazon.jsii.Kernel.get(this, "xksProxyUriPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setXksProxyUriPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "xksProxyUriPath", java.util.Objects.requireNonNull(value, "xksProxyUriPath is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getXksProxyVpcEndpointServiceName() {
        return software.amazon.jsii.Kernel.get(this, "xksProxyVpcEndpointServiceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setXksProxyVpcEndpointServiceName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "xksProxyVpcEndpointServiceName", java.util.Objects.requireNonNull(value, "xksProxyVpcEndpointServiceName is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.kms_custom_key_store.KmsCustomKeyStore}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.kms_custom_key_store.KmsCustomKeyStore> {
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
        private final imports.aws.kms_custom_key_store.KmsCustomKeyStoreConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.kms_custom_key_store.KmsCustomKeyStoreConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#custom_key_store_name KmsCustomKeyStore#custom_key_store_name}.
         * <p>
         * @return {@code this}
         * @param customKeyStoreName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#custom_key_store_name KmsCustomKeyStore#custom_key_store_name}. This parameter is required.
         */
        public Builder customKeyStoreName(final java.lang.String customKeyStoreName) {
            this.config.customKeyStoreName(customKeyStoreName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#cloud_hsm_cluster_id KmsCustomKeyStore#cloud_hsm_cluster_id}.
         * <p>
         * @return {@code this}
         * @param cloudHsmClusterId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#cloud_hsm_cluster_id KmsCustomKeyStore#cloud_hsm_cluster_id}. This parameter is required.
         */
        public Builder cloudHsmClusterId(final java.lang.String cloudHsmClusterId) {
            this.config.cloudHsmClusterId(cloudHsmClusterId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#custom_key_store_type KmsCustomKeyStore#custom_key_store_type}.
         * <p>
         * @return {@code this}
         * @param customKeyStoreType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#custom_key_store_type KmsCustomKeyStore#custom_key_store_type}. This parameter is required.
         */
        public Builder customKeyStoreType(final java.lang.String customKeyStoreType) {
            this.config.customKeyStoreType(customKeyStoreType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#id KmsCustomKeyStore#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#id KmsCustomKeyStore#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#key_store_password KmsCustomKeyStore#key_store_password}.
         * <p>
         * @return {@code this}
         * @param keyStorePassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#key_store_password KmsCustomKeyStore#key_store_password}. This parameter is required.
         */
        public Builder keyStorePassword(final java.lang.String keyStorePassword) {
            this.config.keyStorePassword(keyStorePassword);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#timeouts KmsCustomKeyStore#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.kms_custom_key_store.KmsCustomKeyStoreTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#trust_anchor_certificate KmsCustomKeyStore#trust_anchor_certificate}.
         * <p>
         * @return {@code this}
         * @param trustAnchorCertificate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#trust_anchor_certificate KmsCustomKeyStore#trust_anchor_certificate}. This parameter is required.
         */
        public Builder trustAnchorCertificate(final java.lang.String trustAnchorCertificate) {
            this.config.trustAnchorCertificate(trustAnchorCertificate);
            return this;
        }

        /**
         * xks_proxy_authentication_credential block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_authentication_credential KmsCustomKeyStore#xks_proxy_authentication_credential}
         * <p>
         * @return {@code this}
         * @param xksProxyAuthenticationCredential xks_proxy_authentication_credential block. This parameter is required.
         */
        public Builder xksProxyAuthenticationCredential(final imports.aws.kms_custom_key_store.KmsCustomKeyStoreXksProxyAuthenticationCredential xksProxyAuthenticationCredential) {
            this.config.xksProxyAuthenticationCredential(xksProxyAuthenticationCredential);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_connectivity KmsCustomKeyStore#xks_proxy_connectivity}.
         * <p>
         * @return {@code this}
         * @param xksProxyConnectivity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_connectivity KmsCustomKeyStore#xks_proxy_connectivity}. This parameter is required.
         */
        public Builder xksProxyConnectivity(final java.lang.String xksProxyConnectivity) {
            this.config.xksProxyConnectivity(xksProxyConnectivity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_uri_endpoint KmsCustomKeyStore#xks_proxy_uri_endpoint}.
         * <p>
         * @return {@code this}
         * @param xksProxyUriEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_uri_endpoint KmsCustomKeyStore#xks_proxy_uri_endpoint}. This parameter is required.
         */
        public Builder xksProxyUriEndpoint(final java.lang.String xksProxyUriEndpoint) {
            this.config.xksProxyUriEndpoint(xksProxyUriEndpoint);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_uri_path KmsCustomKeyStore#xks_proxy_uri_path}.
         * <p>
         * @return {@code this}
         * @param xksProxyUriPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_uri_path KmsCustomKeyStore#xks_proxy_uri_path}. This parameter is required.
         */
        public Builder xksProxyUriPath(final java.lang.String xksProxyUriPath) {
            this.config.xksProxyUriPath(xksProxyUriPath);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_vpc_endpoint_service_name KmsCustomKeyStore#xks_proxy_vpc_endpoint_service_name}.
         * <p>
         * @return {@code this}
         * @param xksProxyVpcEndpointServiceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_vpc_endpoint_service_name KmsCustomKeyStore#xks_proxy_vpc_endpoint_service_name}. This parameter is required.
         */
        public Builder xksProxyVpcEndpointServiceName(final java.lang.String xksProxyVpcEndpointServiceName) {
            this.config.xksProxyVpcEndpointServiceName(xksProxyVpcEndpointServiceName);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.kms_custom_key_store.KmsCustomKeyStore}.
         */
        @Override
        public imports.aws.kms_custom_key_store.KmsCustomKeyStore build() {
            return new imports.aws.kms_custom_key_store.KmsCustomKeyStore(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
