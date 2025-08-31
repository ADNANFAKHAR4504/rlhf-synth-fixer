package imports.aws.acm_certificate;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.891Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.acmCertificate.AcmCertificateConfig")
@software.amazon.jsii.Jsii.Proxy(AcmCertificateConfig.Jsii$Proxy.class)
public interface AcmCertificateConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#certificate_authority_arn AcmCertificate#certificate_authority_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCertificateAuthorityArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#certificate_body AcmCertificate#certificate_body}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCertificateBody() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#certificate_chain AcmCertificate#certificate_chain}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCertificateChain() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#domain_name AcmCertificate#domain_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDomainName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#early_renewal_duration AcmCertificate#early_renewal_duration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEarlyRenewalDuration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#id AcmCertificate#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#key_algorithm AcmCertificate#key_algorithm}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeyAlgorithm() {
        return null;
    }

    /**
     * options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#options AcmCertificate#options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.acm_certificate.AcmCertificateOptions getOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#private_key AcmCertificate#private_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrivateKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#subject_alternative_names AcmCertificate#subject_alternative_names}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubjectAlternativeNames() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#tags AcmCertificate#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#tags_all AcmCertificate#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#validation_method AcmCertificate#validation_method}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getValidationMethod() {
        return null;
    }

    /**
     * validation_option block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#validation_option AcmCertificate#validation_option}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getValidationOption() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AcmCertificateConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AcmCertificateConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AcmCertificateConfig> {
        java.lang.String certificateAuthorityArn;
        java.lang.String certificateBody;
        java.lang.String certificateChain;
        java.lang.String domainName;
        java.lang.String earlyRenewalDuration;
        java.lang.String id;
        java.lang.String keyAlgorithm;
        imports.aws.acm_certificate.AcmCertificateOptions options;
        java.lang.String privateKey;
        java.util.List<java.lang.String> subjectAlternativeNames;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String validationMethod;
        java.lang.Object validationOption;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link AcmCertificateConfig#getCertificateAuthorityArn}
         * @param certificateAuthorityArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#certificate_authority_arn AcmCertificate#certificate_authority_arn}.
         * @return {@code this}
         */
        public Builder certificateAuthorityArn(java.lang.String certificateAuthorityArn) {
            this.certificateAuthorityArn = certificateAuthorityArn;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getCertificateBody}
         * @param certificateBody Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#certificate_body AcmCertificate#certificate_body}.
         * @return {@code this}
         */
        public Builder certificateBody(java.lang.String certificateBody) {
            this.certificateBody = certificateBody;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getCertificateChain}
         * @param certificateChain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#certificate_chain AcmCertificate#certificate_chain}.
         * @return {@code this}
         */
        public Builder certificateChain(java.lang.String certificateChain) {
            this.certificateChain = certificateChain;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getDomainName}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#domain_name AcmCertificate#domain_name}.
         * @return {@code this}
         */
        public Builder domainName(java.lang.String domainName) {
            this.domainName = domainName;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getEarlyRenewalDuration}
         * @param earlyRenewalDuration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#early_renewal_duration AcmCertificate#early_renewal_duration}.
         * @return {@code this}
         */
        public Builder earlyRenewalDuration(java.lang.String earlyRenewalDuration) {
            this.earlyRenewalDuration = earlyRenewalDuration;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#id AcmCertificate#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getKeyAlgorithm}
         * @param keyAlgorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#key_algorithm AcmCertificate#key_algorithm}.
         * @return {@code this}
         */
        public Builder keyAlgorithm(java.lang.String keyAlgorithm) {
            this.keyAlgorithm = keyAlgorithm;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getOptions}
         * @param options options block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#options AcmCertificate#options}
         * @return {@code this}
         */
        public Builder options(imports.aws.acm_certificate.AcmCertificateOptions options) {
            this.options = options;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getPrivateKey}
         * @param privateKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#private_key AcmCertificate#private_key}.
         * @return {@code this}
         */
        public Builder privateKey(java.lang.String privateKey) {
            this.privateKey = privateKey;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getSubjectAlternativeNames}
         * @param subjectAlternativeNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#subject_alternative_names AcmCertificate#subject_alternative_names}.
         * @return {@code this}
         */
        public Builder subjectAlternativeNames(java.util.List<java.lang.String> subjectAlternativeNames) {
            this.subjectAlternativeNames = subjectAlternativeNames;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#tags AcmCertificate#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#tags_all AcmCertificate#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getValidationMethod}
         * @param validationMethod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#validation_method AcmCertificate#validation_method}.
         * @return {@code this}
         */
        public Builder validationMethod(java.lang.String validationMethod) {
            this.validationMethod = validationMethod;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getValidationOption}
         * @param validationOption validation_option block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#validation_option AcmCertificate#validation_option}
         * @return {@code this}
         */
        public Builder validationOption(com.hashicorp.cdktf.IResolvable validationOption) {
            this.validationOption = validationOption;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getValidationOption}
         * @param validationOption validation_option block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/acm_certificate#validation_option AcmCertificate#validation_option}
         * @return {@code this}
         */
        public Builder validationOption(java.util.List<? extends imports.aws.acm_certificate.AcmCertificateValidationOption> validationOption) {
            this.validationOption = validationOption;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getDependsOn}
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
         * Sets the value of {@link AcmCertificateConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link AcmCertificateConfig#getProvisioners}
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
         * @return a new instance of {@link AcmCertificateConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AcmCertificateConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AcmCertificateConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AcmCertificateConfig {
        private final java.lang.String certificateAuthorityArn;
        private final java.lang.String certificateBody;
        private final java.lang.String certificateChain;
        private final java.lang.String domainName;
        private final java.lang.String earlyRenewalDuration;
        private final java.lang.String id;
        private final java.lang.String keyAlgorithm;
        private final imports.aws.acm_certificate.AcmCertificateOptions options;
        private final java.lang.String privateKey;
        private final java.util.List<java.lang.String> subjectAlternativeNames;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String validationMethod;
        private final java.lang.Object validationOption;
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
            this.certificateAuthorityArn = software.amazon.jsii.Kernel.get(this, "certificateAuthorityArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.certificateBody = software.amazon.jsii.Kernel.get(this, "certificateBody", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.certificateChain = software.amazon.jsii.Kernel.get(this, "certificateChain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domainName = software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.earlyRenewalDuration = software.amazon.jsii.Kernel.get(this, "earlyRenewalDuration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyAlgorithm = software.amazon.jsii.Kernel.get(this, "keyAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.options = software.amazon.jsii.Kernel.get(this, "options", software.amazon.jsii.NativeType.forClass(imports.aws.acm_certificate.AcmCertificateOptions.class));
            this.privateKey = software.amazon.jsii.Kernel.get(this, "privateKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subjectAlternativeNames = software.amazon.jsii.Kernel.get(this, "subjectAlternativeNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.validationMethod = software.amazon.jsii.Kernel.get(this, "validationMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.validationOption = software.amazon.jsii.Kernel.get(this, "validationOption", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.certificateAuthorityArn = builder.certificateAuthorityArn;
            this.certificateBody = builder.certificateBody;
            this.certificateChain = builder.certificateChain;
            this.domainName = builder.domainName;
            this.earlyRenewalDuration = builder.earlyRenewalDuration;
            this.id = builder.id;
            this.keyAlgorithm = builder.keyAlgorithm;
            this.options = builder.options;
            this.privateKey = builder.privateKey;
            this.subjectAlternativeNames = builder.subjectAlternativeNames;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.validationMethod = builder.validationMethod;
            this.validationOption = builder.validationOption;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getCertificateAuthorityArn() {
            return this.certificateAuthorityArn;
        }

        @Override
        public final java.lang.String getCertificateBody() {
            return this.certificateBody;
        }

        @Override
        public final java.lang.String getCertificateChain() {
            return this.certificateChain;
        }

        @Override
        public final java.lang.String getDomainName() {
            return this.domainName;
        }

        @Override
        public final java.lang.String getEarlyRenewalDuration() {
            return this.earlyRenewalDuration;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getKeyAlgorithm() {
            return this.keyAlgorithm;
        }

        @Override
        public final imports.aws.acm_certificate.AcmCertificateOptions getOptions() {
            return this.options;
        }

        @Override
        public final java.lang.String getPrivateKey() {
            return this.privateKey;
        }

        @Override
        public final java.util.List<java.lang.String> getSubjectAlternativeNames() {
            return this.subjectAlternativeNames;
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
        public final java.lang.String getValidationMethod() {
            return this.validationMethod;
        }

        @Override
        public final java.lang.Object getValidationOption() {
            return this.validationOption;
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

            if (this.getCertificateAuthorityArn() != null) {
                data.set("certificateAuthorityArn", om.valueToTree(this.getCertificateAuthorityArn()));
            }
            if (this.getCertificateBody() != null) {
                data.set("certificateBody", om.valueToTree(this.getCertificateBody()));
            }
            if (this.getCertificateChain() != null) {
                data.set("certificateChain", om.valueToTree(this.getCertificateChain()));
            }
            if (this.getDomainName() != null) {
                data.set("domainName", om.valueToTree(this.getDomainName()));
            }
            if (this.getEarlyRenewalDuration() != null) {
                data.set("earlyRenewalDuration", om.valueToTree(this.getEarlyRenewalDuration()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKeyAlgorithm() != null) {
                data.set("keyAlgorithm", om.valueToTree(this.getKeyAlgorithm()));
            }
            if (this.getOptions() != null) {
                data.set("options", om.valueToTree(this.getOptions()));
            }
            if (this.getPrivateKey() != null) {
                data.set("privateKey", om.valueToTree(this.getPrivateKey()));
            }
            if (this.getSubjectAlternativeNames() != null) {
                data.set("subjectAlternativeNames", om.valueToTree(this.getSubjectAlternativeNames()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getValidationMethod() != null) {
                data.set("validationMethod", om.valueToTree(this.getValidationMethod()));
            }
            if (this.getValidationOption() != null) {
                data.set("validationOption", om.valueToTree(this.getValidationOption()));
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
            struct.set("fqn", om.valueToTree("aws.acmCertificate.AcmCertificateConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AcmCertificateConfig.Jsii$Proxy that = (AcmCertificateConfig.Jsii$Proxy) o;

            if (this.certificateAuthorityArn != null ? !this.certificateAuthorityArn.equals(that.certificateAuthorityArn) : that.certificateAuthorityArn != null) return false;
            if (this.certificateBody != null ? !this.certificateBody.equals(that.certificateBody) : that.certificateBody != null) return false;
            if (this.certificateChain != null ? !this.certificateChain.equals(that.certificateChain) : that.certificateChain != null) return false;
            if (this.domainName != null ? !this.domainName.equals(that.domainName) : that.domainName != null) return false;
            if (this.earlyRenewalDuration != null ? !this.earlyRenewalDuration.equals(that.earlyRenewalDuration) : that.earlyRenewalDuration != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.keyAlgorithm != null ? !this.keyAlgorithm.equals(that.keyAlgorithm) : that.keyAlgorithm != null) return false;
            if (this.options != null ? !this.options.equals(that.options) : that.options != null) return false;
            if (this.privateKey != null ? !this.privateKey.equals(that.privateKey) : that.privateKey != null) return false;
            if (this.subjectAlternativeNames != null ? !this.subjectAlternativeNames.equals(that.subjectAlternativeNames) : that.subjectAlternativeNames != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.validationMethod != null ? !this.validationMethod.equals(that.validationMethod) : that.validationMethod != null) return false;
            if (this.validationOption != null ? !this.validationOption.equals(that.validationOption) : that.validationOption != null) return false;
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
            int result = this.certificateAuthorityArn != null ? this.certificateAuthorityArn.hashCode() : 0;
            result = 31 * result + (this.certificateBody != null ? this.certificateBody.hashCode() : 0);
            result = 31 * result + (this.certificateChain != null ? this.certificateChain.hashCode() : 0);
            result = 31 * result + (this.domainName != null ? this.domainName.hashCode() : 0);
            result = 31 * result + (this.earlyRenewalDuration != null ? this.earlyRenewalDuration.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.keyAlgorithm != null ? this.keyAlgorithm.hashCode() : 0);
            result = 31 * result + (this.options != null ? this.options.hashCode() : 0);
            result = 31 * result + (this.privateKey != null ? this.privateKey.hashCode() : 0);
            result = 31 * result + (this.subjectAlternativeNames != null ? this.subjectAlternativeNames.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.validationMethod != null ? this.validationMethod.hashCode() : 0);
            result = 31 * result + (this.validationOption != null ? this.validationOption.hashCode() : 0);
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
