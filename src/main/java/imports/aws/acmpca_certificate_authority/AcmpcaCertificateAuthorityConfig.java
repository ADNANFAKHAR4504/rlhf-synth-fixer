package imports.aws.acmpca_certificate_authority;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.896Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.acmpcaCertificateAuthority.AcmpcaCertificateAuthorityConfig")
@software.amazon.jsii.Jsii.Proxy(AcmpcaCertificateAuthorityConfig.Jsii$Proxy.class)
public interface AcmpcaCertificateAuthorityConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * certificate_authority_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#certificate_authority_configuration AcmpcaCertificateAuthority#certificate_authority_configuration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfiguration getCertificateAuthorityConfiguration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#enabled AcmpcaCertificateAuthority#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#id AcmpcaCertificateAuthority#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#key_storage_security_standard AcmpcaCertificateAuthority#key_storage_security_standard}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeyStorageSecurityStandard() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#permanent_deletion_time_in_days AcmpcaCertificateAuthority#permanent_deletion_time_in_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPermanentDeletionTimeInDays() {
        return null;
    }

    /**
     * revocation_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#revocation_configuration AcmpcaCertificateAuthority#revocation_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfiguration getRevocationConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#tags AcmpcaCertificateAuthority#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#tags_all AcmpcaCertificateAuthority#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#timeouts AcmpcaCertificateAuthority#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#type AcmpcaCertificateAuthority#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#usage_mode AcmpcaCertificateAuthority#usage_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUsageMode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AcmpcaCertificateAuthorityConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AcmpcaCertificateAuthorityConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AcmpcaCertificateAuthorityConfig> {
        imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfiguration certificateAuthorityConfiguration;
        java.lang.Object enabled;
        java.lang.String id;
        java.lang.String keyStorageSecurityStandard;
        java.lang.Number permanentDeletionTimeInDays;
        imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfiguration revocationConfiguration;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityTimeouts timeouts;
        java.lang.String type;
        java.lang.String usageMode;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityConfig#getCertificateAuthorityConfiguration}
         * @param certificateAuthorityConfiguration certificate_authority_configuration block. This parameter is required.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#certificate_authority_configuration AcmpcaCertificateAuthority#certificate_authority_configuration}
         * @return {@code this}
         */
        public Builder certificateAuthorityConfiguration(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfiguration certificateAuthorityConfiguration) {
            this.certificateAuthorityConfiguration = certificateAuthorityConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#enabled AcmpcaCertificateAuthority#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#enabled AcmpcaCertificateAuthority#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#id AcmpcaCertificateAuthority#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityConfig#getKeyStorageSecurityStandard}
         * @param keyStorageSecurityStandard Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#key_storage_security_standard AcmpcaCertificateAuthority#key_storage_security_standard}.
         * @return {@code this}
         */
        public Builder keyStorageSecurityStandard(java.lang.String keyStorageSecurityStandard) {
            this.keyStorageSecurityStandard = keyStorageSecurityStandard;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityConfig#getPermanentDeletionTimeInDays}
         * @param permanentDeletionTimeInDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#permanent_deletion_time_in_days AcmpcaCertificateAuthority#permanent_deletion_time_in_days}.
         * @return {@code this}
         */
        public Builder permanentDeletionTimeInDays(java.lang.Number permanentDeletionTimeInDays) {
            this.permanentDeletionTimeInDays = permanentDeletionTimeInDays;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityConfig#getRevocationConfiguration}
         * @param revocationConfiguration revocation_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#revocation_configuration AcmpcaCertificateAuthority#revocation_configuration}
         * @return {@code this}
         */
        public Builder revocationConfiguration(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfiguration revocationConfiguration) {
            this.revocationConfiguration = revocationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#tags AcmpcaCertificateAuthority#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#tags_all AcmpcaCertificateAuthority#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#timeouts AcmpcaCertificateAuthority#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#type AcmpcaCertificateAuthority#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityConfig#getUsageMode}
         * @param usageMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acmpca_certificate_authority#usage_mode AcmpcaCertificateAuthority#usage_mode}.
         * @return {@code this}
         */
        public Builder usageMode(java.lang.String usageMode) {
            this.usageMode = usageMode;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityConfig#getDependsOn}
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
         * Sets the value of {@link AcmpcaCertificateAuthorityConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link AcmpcaCertificateAuthorityConfig#getProvisioners}
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
         * @return a new instance of {@link AcmpcaCertificateAuthorityConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AcmpcaCertificateAuthorityConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AcmpcaCertificateAuthorityConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AcmpcaCertificateAuthorityConfig {
        private final imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfiguration certificateAuthorityConfiguration;
        private final java.lang.Object enabled;
        private final java.lang.String id;
        private final java.lang.String keyStorageSecurityStandard;
        private final java.lang.Number permanentDeletionTimeInDays;
        private final imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfiguration revocationConfiguration;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityTimeouts timeouts;
        private final java.lang.String type;
        private final java.lang.String usageMode;
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
            this.certificateAuthorityConfiguration = software.amazon.jsii.Kernel.get(this, "certificateAuthorityConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfiguration.class));
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyStorageSecurityStandard = software.amazon.jsii.Kernel.get(this, "keyStorageSecurityStandard", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.permanentDeletionTimeInDays = software.amazon.jsii.Kernel.get(this, "permanentDeletionTimeInDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.revocationConfiguration = software.amazon.jsii.Kernel.get(this, "revocationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfiguration.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityTimeouts.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.usageMode = software.amazon.jsii.Kernel.get(this, "usageMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.certificateAuthorityConfiguration = java.util.Objects.requireNonNull(builder.certificateAuthorityConfiguration, "certificateAuthorityConfiguration is required");
            this.enabled = builder.enabled;
            this.id = builder.id;
            this.keyStorageSecurityStandard = builder.keyStorageSecurityStandard;
            this.permanentDeletionTimeInDays = builder.permanentDeletionTimeInDays;
            this.revocationConfiguration = builder.revocationConfiguration;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.type = builder.type;
            this.usageMode = builder.usageMode;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityCertificateAuthorityConfiguration getCertificateAuthorityConfiguration() {
            return this.certificateAuthorityConfiguration;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getKeyStorageSecurityStandard() {
            return this.keyStorageSecurityStandard;
        }

        @Override
        public final java.lang.Number getPermanentDeletionTimeInDays() {
            return this.permanentDeletionTimeInDays;
        }

        @Override
        public final imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityRevocationConfiguration getRevocationConfiguration() {
            return this.revocationConfiguration;
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
        public final imports.aws.acmpca_certificate_authority.AcmpcaCertificateAuthorityTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getUsageMode() {
            return this.usageMode;
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

            data.set("certificateAuthorityConfiguration", om.valueToTree(this.getCertificateAuthorityConfiguration()));
            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKeyStorageSecurityStandard() != null) {
                data.set("keyStorageSecurityStandard", om.valueToTree(this.getKeyStorageSecurityStandard()));
            }
            if (this.getPermanentDeletionTimeInDays() != null) {
                data.set("permanentDeletionTimeInDays", om.valueToTree(this.getPermanentDeletionTimeInDays()));
            }
            if (this.getRevocationConfiguration() != null) {
                data.set("revocationConfiguration", om.valueToTree(this.getRevocationConfiguration()));
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
            if (this.getUsageMode() != null) {
                data.set("usageMode", om.valueToTree(this.getUsageMode()));
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
            struct.set("fqn", om.valueToTree("aws.acmpcaCertificateAuthority.AcmpcaCertificateAuthorityConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AcmpcaCertificateAuthorityConfig.Jsii$Proxy that = (AcmpcaCertificateAuthorityConfig.Jsii$Proxy) o;

            if (!certificateAuthorityConfiguration.equals(that.certificateAuthorityConfiguration)) return false;
            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.keyStorageSecurityStandard != null ? !this.keyStorageSecurityStandard.equals(that.keyStorageSecurityStandard) : that.keyStorageSecurityStandard != null) return false;
            if (this.permanentDeletionTimeInDays != null ? !this.permanentDeletionTimeInDays.equals(that.permanentDeletionTimeInDays) : that.permanentDeletionTimeInDays != null) return false;
            if (this.revocationConfiguration != null ? !this.revocationConfiguration.equals(that.revocationConfiguration) : that.revocationConfiguration != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.type != null ? !this.type.equals(that.type) : that.type != null) return false;
            if (this.usageMode != null ? !this.usageMode.equals(that.usageMode) : that.usageMode != null) return false;
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
            int result = this.certificateAuthorityConfiguration.hashCode();
            result = 31 * result + (this.enabled != null ? this.enabled.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.keyStorageSecurityStandard != null ? this.keyStorageSecurityStandard.hashCode() : 0);
            result = 31 * result + (this.permanentDeletionTimeInDays != null ? this.permanentDeletionTimeInDays.hashCode() : 0);
            result = 31 * result + (this.revocationConfiguration != null ? this.revocationConfiguration.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            result = 31 * result + (this.usageMode != null ? this.usageMode.hashCode() : 0);
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
