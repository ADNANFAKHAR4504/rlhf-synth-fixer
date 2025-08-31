package imports.aws.vpc_ipam_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.601Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpcIpamPool.VpcIpamPoolConfig")
@software.amazon.jsii.Jsii.Proxy(VpcIpamPoolConfig.Jsii$Proxy.class)
public interface VpcIpamPoolConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#address_family VpcIpamPool#address_family}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAddressFamily();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#ipam_scope_id VpcIpamPool#ipam_scope_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIpamScopeId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#allocation_default_netmask_length VpcIpamPool#allocation_default_netmask_length}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAllocationDefaultNetmaskLength() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#allocation_max_netmask_length VpcIpamPool#allocation_max_netmask_length}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAllocationMaxNetmaskLength() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#allocation_min_netmask_length VpcIpamPool#allocation_min_netmask_length}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAllocationMinNetmaskLength() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#allocation_resource_tags VpcIpamPool#allocation_resource_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getAllocationResourceTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#auto_import VpcIpamPool#auto_import}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutoImport() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#aws_service VpcIpamPool#aws_service}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAwsService() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#cascade VpcIpamPool#cascade}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCascade() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#description VpcIpamPool#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#id VpcIpamPool#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#locale VpcIpamPool#locale}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocale() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#public_ip_source VpcIpamPool#public_ip_source}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPublicIpSource() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#publicly_advertisable VpcIpamPool#publicly_advertisable}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPubliclyAdvertisable() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#source_ipam_pool_id VpcIpamPool#source_ipam_pool_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceIpamPoolId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#tags VpcIpamPool#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#tags_all VpcIpamPool#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#timeouts VpcIpamPool#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.vpc_ipam_pool.VpcIpamPoolTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpcIpamPoolConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpcIpamPoolConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpcIpamPoolConfig> {
        java.lang.String addressFamily;
        java.lang.String ipamScopeId;
        java.lang.Number allocationDefaultNetmaskLength;
        java.lang.Number allocationMaxNetmaskLength;
        java.lang.Number allocationMinNetmaskLength;
        java.util.Map<java.lang.String, java.lang.String> allocationResourceTags;
        java.lang.Object autoImport;
        java.lang.String awsService;
        java.lang.Object cascade;
        java.lang.String description;
        java.lang.String id;
        java.lang.String locale;
        java.lang.String publicIpSource;
        java.lang.Object publiclyAdvertisable;
        java.lang.String sourceIpamPoolId;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.vpc_ipam_pool.VpcIpamPoolTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getAddressFamily}
         * @param addressFamily Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#address_family VpcIpamPool#address_family}. This parameter is required.
         * @return {@code this}
         */
        public Builder addressFamily(java.lang.String addressFamily) {
            this.addressFamily = addressFamily;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getIpamScopeId}
         * @param ipamScopeId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#ipam_scope_id VpcIpamPool#ipam_scope_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder ipamScopeId(java.lang.String ipamScopeId) {
            this.ipamScopeId = ipamScopeId;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getAllocationDefaultNetmaskLength}
         * @param allocationDefaultNetmaskLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#allocation_default_netmask_length VpcIpamPool#allocation_default_netmask_length}.
         * @return {@code this}
         */
        public Builder allocationDefaultNetmaskLength(java.lang.Number allocationDefaultNetmaskLength) {
            this.allocationDefaultNetmaskLength = allocationDefaultNetmaskLength;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getAllocationMaxNetmaskLength}
         * @param allocationMaxNetmaskLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#allocation_max_netmask_length VpcIpamPool#allocation_max_netmask_length}.
         * @return {@code this}
         */
        public Builder allocationMaxNetmaskLength(java.lang.Number allocationMaxNetmaskLength) {
            this.allocationMaxNetmaskLength = allocationMaxNetmaskLength;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getAllocationMinNetmaskLength}
         * @param allocationMinNetmaskLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#allocation_min_netmask_length VpcIpamPool#allocation_min_netmask_length}.
         * @return {@code this}
         */
        public Builder allocationMinNetmaskLength(java.lang.Number allocationMinNetmaskLength) {
            this.allocationMinNetmaskLength = allocationMinNetmaskLength;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getAllocationResourceTags}
         * @param allocationResourceTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#allocation_resource_tags VpcIpamPool#allocation_resource_tags}.
         * @return {@code this}
         */
        public Builder allocationResourceTags(java.util.Map<java.lang.String, java.lang.String> allocationResourceTags) {
            this.allocationResourceTags = allocationResourceTags;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getAutoImport}
         * @param autoImport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#auto_import VpcIpamPool#auto_import}.
         * @return {@code this}
         */
        public Builder autoImport(java.lang.Boolean autoImport) {
            this.autoImport = autoImport;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getAutoImport}
         * @param autoImport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#auto_import VpcIpamPool#auto_import}.
         * @return {@code this}
         */
        public Builder autoImport(com.hashicorp.cdktf.IResolvable autoImport) {
            this.autoImport = autoImport;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getAwsService}
         * @param awsService Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#aws_service VpcIpamPool#aws_service}.
         * @return {@code this}
         */
        public Builder awsService(java.lang.String awsService) {
            this.awsService = awsService;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getCascade}
         * @param cascade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#cascade VpcIpamPool#cascade}.
         * @return {@code this}
         */
        public Builder cascade(java.lang.Boolean cascade) {
            this.cascade = cascade;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getCascade}
         * @param cascade Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#cascade VpcIpamPool#cascade}.
         * @return {@code this}
         */
        public Builder cascade(com.hashicorp.cdktf.IResolvable cascade) {
            this.cascade = cascade;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#description VpcIpamPool#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#id VpcIpamPool#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getLocale}
         * @param locale Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#locale VpcIpamPool#locale}.
         * @return {@code this}
         */
        public Builder locale(java.lang.String locale) {
            this.locale = locale;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getPublicIpSource}
         * @param publicIpSource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#public_ip_source VpcIpamPool#public_ip_source}.
         * @return {@code this}
         */
        public Builder publicIpSource(java.lang.String publicIpSource) {
            this.publicIpSource = publicIpSource;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getPubliclyAdvertisable}
         * @param publiclyAdvertisable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#publicly_advertisable VpcIpamPool#publicly_advertisable}.
         * @return {@code this}
         */
        public Builder publiclyAdvertisable(java.lang.Boolean publiclyAdvertisable) {
            this.publiclyAdvertisable = publiclyAdvertisable;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getPubliclyAdvertisable}
         * @param publiclyAdvertisable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#publicly_advertisable VpcIpamPool#publicly_advertisable}.
         * @return {@code this}
         */
        public Builder publiclyAdvertisable(com.hashicorp.cdktf.IResolvable publiclyAdvertisable) {
            this.publiclyAdvertisable = publiclyAdvertisable;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getSourceIpamPoolId}
         * @param sourceIpamPoolId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#source_ipam_pool_id VpcIpamPool#source_ipam_pool_id}.
         * @return {@code this}
         */
        public Builder sourceIpamPoolId(java.lang.String sourceIpamPoolId) {
            this.sourceIpamPoolId = sourceIpamPoolId;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#tags VpcIpamPool#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#tags_all VpcIpamPool#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool#timeouts VpcIpamPool#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.vpc_ipam_pool.VpcIpamPoolTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getDependsOn}
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
         * Sets the value of {@link VpcIpamPoolConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolConfig#getProvisioners}
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
         * @return a new instance of {@link VpcIpamPoolConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpcIpamPoolConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpcIpamPoolConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpcIpamPoolConfig {
        private final java.lang.String addressFamily;
        private final java.lang.String ipamScopeId;
        private final java.lang.Number allocationDefaultNetmaskLength;
        private final java.lang.Number allocationMaxNetmaskLength;
        private final java.lang.Number allocationMinNetmaskLength;
        private final java.util.Map<java.lang.String, java.lang.String> allocationResourceTags;
        private final java.lang.Object autoImport;
        private final java.lang.String awsService;
        private final java.lang.Object cascade;
        private final java.lang.String description;
        private final java.lang.String id;
        private final java.lang.String locale;
        private final java.lang.String publicIpSource;
        private final java.lang.Object publiclyAdvertisable;
        private final java.lang.String sourceIpamPoolId;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.vpc_ipam_pool.VpcIpamPoolTimeouts timeouts;
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
            this.addressFamily = software.amazon.jsii.Kernel.get(this, "addressFamily", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipamScopeId = software.amazon.jsii.Kernel.get(this, "ipamScopeId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.allocationDefaultNetmaskLength = software.amazon.jsii.Kernel.get(this, "allocationDefaultNetmaskLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.allocationMaxNetmaskLength = software.amazon.jsii.Kernel.get(this, "allocationMaxNetmaskLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.allocationMinNetmaskLength = software.amazon.jsii.Kernel.get(this, "allocationMinNetmaskLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.allocationResourceTags = software.amazon.jsii.Kernel.get(this, "allocationResourceTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.autoImport = software.amazon.jsii.Kernel.get(this, "autoImport", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.awsService = software.amazon.jsii.Kernel.get(this, "awsService", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cascade = software.amazon.jsii.Kernel.get(this, "cascade", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.locale = software.amazon.jsii.Kernel.get(this, "locale", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.publicIpSource = software.amazon.jsii.Kernel.get(this, "publicIpSource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.publiclyAdvertisable = software.amazon.jsii.Kernel.get(this, "publiclyAdvertisable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sourceIpamPoolId = software.amazon.jsii.Kernel.get(this, "sourceIpamPoolId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.vpc_ipam_pool.VpcIpamPoolTimeouts.class));
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
            this.addressFamily = java.util.Objects.requireNonNull(builder.addressFamily, "addressFamily is required");
            this.ipamScopeId = java.util.Objects.requireNonNull(builder.ipamScopeId, "ipamScopeId is required");
            this.allocationDefaultNetmaskLength = builder.allocationDefaultNetmaskLength;
            this.allocationMaxNetmaskLength = builder.allocationMaxNetmaskLength;
            this.allocationMinNetmaskLength = builder.allocationMinNetmaskLength;
            this.allocationResourceTags = builder.allocationResourceTags;
            this.autoImport = builder.autoImport;
            this.awsService = builder.awsService;
            this.cascade = builder.cascade;
            this.description = builder.description;
            this.id = builder.id;
            this.locale = builder.locale;
            this.publicIpSource = builder.publicIpSource;
            this.publiclyAdvertisable = builder.publiclyAdvertisable;
            this.sourceIpamPoolId = builder.sourceIpamPoolId;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAddressFamily() {
            return this.addressFamily;
        }

        @Override
        public final java.lang.String getIpamScopeId() {
            return this.ipamScopeId;
        }

        @Override
        public final java.lang.Number getAllocationDefaultNetmaskLength() {
            return this.allocationDefaultNetmaskLength;
        }

        @Override
        public final java.lang.Number getAllocationMaxNetmaskLength() {
            return this.allocationMaxNetmaskLength;
        }

        @Override
        public final java.lang.Number getAllocationMinNetmaskLength() {
            return this.allocationMinNetmaskLength;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getAllocationResourceTags() {
            return this.allocationResourceTags;
        }

        @Override
        public final java.lang.Object getAutoImport() {
            return this.autoImport;
        }

        @Override
        public final java.lang.String getAwsService() {
            return this.awsService;
        }

        @Override
        public final java.lang.Object getCascade() {
            return this.cascade;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getLocale() {
            return this.locale;
        }

        @Override
        public final java.lang.String getPublicIpSource() {
            return this.publicIpSource;
        }

        @Override
        public final java.lang.Object getPubliclyAdvertisable() {
            return this.publiclyAdvertisable;
        }

        @Override
        public final java.lang.String getSourceIpamPoolId() {
            return this.sourceIpamPoolId;
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
        public final imports.aws.vpc_ipam_pool.VpcIpamPoolTimeouts getTimeouts() {
            return this.timeouts;
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

            data.set("addressFamily", om.valueToTree(this.getAddressFamily()));
            data.set("ipamScopeId", om.valueToTree(this.getIpamScopeId()));
            if (this.getAllocationDefaultNetmaskLength() != null) {
                data.set("allocationDefaultNetmaskLength", om.valueToTree(this.getAllocationDefaultNetmaskLength()));
            }
            if (this.getAllocationMaxNetmaskLength() != null) {
                data.set("allocationMaxNetmaskLength", om.valueToTree(this.getAllocationMaxNetmaskLength()));
            }
            if (this.getAllocationMinNetmaskLength() != null) {
                data.set("allocationMinNetmaskLength", om.valueToTree(this.getAllocationMinNetmaskLength()));
            }
            if (this.getAllocationResourceTags() != null) {
                data.set("allocationResourceTags", om.valueToTree(this.getAllocationResourceTags()));
            }
            if (this.getAutoImport() != null) {
                data.set("autoImport", om.valueToTree(this.getAutoImport()));
            }
            if (this.getAwsService() != null) {
                data.set("awsService", om.valueToTree(this.getAwsService()));
            }
            if (this.getCascade() != null) {
                data.set("cascade", om.valueToTree(this.getCascade()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLocale() != null) {
                data.set("locale", om.valueToTree(this.getLocale()));
            }
            if (this.getPublicIpSource() != null) {
                data.set("publicIpSource", om.valueToTree(this.getPublicIpSource()));
            }
            if (this.getPubliclyAdvertisable() != null) {
                data.set("publiclyAdvertisable", om.valueToTree(this.getPubliclyAdvertisable()));
            }
            if (this.getSourceIpamPoolId() != null) {
                data.set("sourceIpamPoolId", om.valueToTree(this.getSourceIpamPoolId()));
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
            struct.set("fqn", om.valueToTree("aws.vpcIpamPool.VpcIpamPoolConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpcIpamPoolConfig.Jsii$Proxy that = (VpcIpamPoolConfig.Jsii$Proxy) o;

            if (!addressFamily.equals(that.addressFamily)) return false;
            if (!ipamScopeId.equals(that.ipamScopeId)) return false;
            if (this.allocationDefaultNetmaskLength != null ? !this.allocationDefaultNetmaskLength.equals(that.allocationDefaultNetmaskLength) : that.allocationDefaultNetmaskLength != null) return false;
            if (this.allocationMaxNetmaskLength != null ? !this.allocationMaxNetmaskLength.equals(that.allocationMaxNetmaskLength) : that.allocationMaxNetmaskLength != null) return false;
            if (this.allocationMinNetmaskLength != null ? !this.allocationMinNetmaskLength.equals(that.allocationMinNetmaskLength) : that.allocationMinNetmaskLength != null) return false;
            if (this.allocationResourceTags != null ? !this.allocationResourceTags.equals(that.allocationResourceTags) : that.allocationResourceTags != null) return false;
            if (this.autoImport != null ? !this.autoImport.equals(that.autoImport) : that.autoImport != null) return false;
            if (this.awsService != null ? !this.awsService.equals(that.awsService) : that.awsService != null) return false;
            if (this.cascade != null ? !this.cascade.equals(that.cascade) : that.cascade != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.locale != null ? !this.locale.equals(that.locale) : that.locale != null) return false;
            if (this.publicIpSource != null ? !this.publicIpSource.equals(that.publicIpSource) : that.publicIpSource != null) return false;
            if (this.publiclyAdvertisable != null ? !this.publiclyAdvertisable.equals(that.publiclyAdvertisable) : that.publiclyAdvertisable != null) return false;
            if (this.sourceIpamPoolId != null ? !this.sourceIpamPoolId.equals(that.sourceIpamPoolId) : that.sourceIpamPoolId != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            int result = this.addressFamily.hashCode();
            result = 31 * result + (this.ipamScopeId.hashCode());
            result = 31 * result + (this.allocationDefaultNetmaskLength != null ? this.allocationDefaultNetmaskLength.hashCode() : 0);
            result = 31 * result + (this.allocationMaxNetmaskLength != null ? this.allocationMaxNetmaskLength.hashCode() : 0);
            result = 31 * result + (this.allocationMinNetmaskLength != null ? this.allocationMinNetmaskLength.hashCode() : 0);
            result = 31 * result + (this.allocationResourceTags != null ? this.allocationResourceTags.hashCode() : 0);
            result = 31 * result + (this.autoImport != null ? this.autoImport.hashCode() : 0);
            result = 31 * result + (this.awsService != null ? this.awsService.hashCode() : 0);
            result = 31 * result + (this.cascade != null ? this.cascade.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.locale != null ? this.locale.hashCode() : 0);
            result = 31 * result + (this.publicIpSource != null ? this.publicIpSource.hashCode() : 0);
            result = 31 * result + (this.publiclyAdvertisable != null ? this.publiclyAdvertisable.hashCode() : 0);
            result = 31 * result + (this.sourceIpamPoolId != null ? this.sourceIpamPoolId.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
