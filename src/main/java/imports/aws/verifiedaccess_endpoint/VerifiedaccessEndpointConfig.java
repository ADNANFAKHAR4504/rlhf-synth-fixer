package imports.aws.verifiedaccess_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.572Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedaccessEndpoint.VerifiedaccessEndpointConfig")
@software.amazon.jsii.Jsii.Proxy(VerifiedaccessEndpointConfig.Jsii$Proxy.class)
public interface VerifiedaccessEndpointConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#attachment_type VerifiedaccessEndpoint#attachment_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAttachmentType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#endpoint_type VerifiedaccessEndpoint#endpoint_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEndpointType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#verified_access_group_id VerifiedaccessEndpoint#verified_access_group_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVerifiedAccessGroupId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#application_domain VerifiedaccessEndpoint#application_domain}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getApplicationDomain() {
        return null;
    }

    /**
     * cidr_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#cidr_options VerifiedaccessEndpoint#cidr_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointCidrOptions getCidrOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#description VerifiedaccessEndpoint#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#domain_certificate_arn VerifiedaccessEndpoint#domain_certificate_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDomainCertificateArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#endpoint_domain_prefix VerifiedaccessEndpoint#endpoint_domain_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEndpointDomainPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#id VerifiedaccessEndpoint#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * load_balancer_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#load_balancer_options VerifiedaccessEndpoint#load_balancer_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointLoadBalancerOptions getLoadBalancerOptions() {
        return null;
    }

    /**
     * network_interface_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#network_interface_options VerifiedaccessEndpoint#network_interface_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointNetworkInterfaceOptions getNetworkInterfaceOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#policy_document VerifiedaccessEndpoint#policy_document}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPolicyDocument() {
        return null;
    }

    /**
     * rds_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#rds_options VerifiedaccessEndpoint#rds_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointRdsOptions getRdsOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#security_group_ids VerifiedaccessEndpoint#security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIds() {
        return null;
    }

    /**
     * sse_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#sse_specification VerifiedaccessEndpoint#sse_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointSseSpecification getSseSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#tags VerifiedaccessEndpoint#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#tags_all VerifiedaccessEndpoint#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#timeouts VerifiedaccessEndpoint#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VerifiedaccessEndpointConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedaccessEndpointConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedaccessEndpointConfig> {
        java.lang.String attachmentType;
        java.lang.String endpointType;
        java.lang.String verifiedAccessGroupId;
        java.lang.String applicationDomain;
        imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointCidrOptions cidrOptions;
        java.lang.String description;
        java.lang.String domainCertificateArn;
        java.lang.String endpointDomainPrefix;
        java.lang.String id;
        imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointLoadBalancerOptions loadBalancerOptions;
        imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointNetworkInterfaceOptions networkInterfaceOptions;
        java.lang.String policyDocument;
        imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointRdsOptions rdsOptions;
        java.util.List<java.lang.String> securityGroupIds;
        imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointSseSpecification sseSpecification;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getAttachmentType}
         * @param attachmentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#attachment_type VerifiedaccessEndpoint#attachment_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder attachmentType(java.lang.String attachmentType) {
            this.attachmentType = attachmentType;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getEndpointType}
         * @param endpointType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#endpoint_type VerifiedaccessEndpoint#endpoint_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder endpointType(java.lang.String endpointType) {
            this.endpointType = endpointType;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getVerifiedAccessGroupId}
         * @param verifiedAccessGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#verified_access_group_id VerifiedaccessEndpoint#verified_access_group_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder verifiedAccessGroupId(java.lang.String verifiedAccessGroupId) {
            this.verifiedAccessGroupId = verifiedAccessGroupId;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getApplicationDomain}
         * @param applicationDomain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#application_domain VerifiedaccessEndpoint#application_domain}.
         * @return {@code this}
         */
        public Builder applicationDomain(java.lang.String applicationDomain) {
            this.applicationDomain = applicationDomain;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getCidrOptions}
         * @param cidrOptions cidr_options block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#cidr_options VerifiedaccessEndpoint#cidr_options}
         * @return {@code this}
         */
        public Builder cidrOptions(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointCidrOptions cidrOptions) {
            this.cidrOptions = cidrOptions;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#description VerifiedaccessEndpoint#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getDomainCertificateArn}
         * @param domainCertificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#domain_certificate_arn VerifiedaccessEndpoint#domain_certificate_arn}.
         * @return {@code this}
         */
        public Builder domainCertificateArn(java.lang.String domainCertificateArn) {
            this.domainCertificateArn = domainCertificateArn;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getEndpointDomainPrefix}
         * @param endpointDomainPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#endpoint_domain_prefix VerifiedaccessEndpoint#endpoint_domain_prefix}.
         * @return {@code this}
         */
        public Builder endpointDomainPrefix(java.lang.String endpointDomainPrefix) {
            this.endpointDomainPrefix = endpointDomainPrefix;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#id VerifiedaccessEndpoint#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getLoadBalancerOptions}
         * @param loadBalancerOptions load_balancer_options block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#load_balancer_options VerifiedaccessEndpoint#load_balancer_options}
         * @return {@code this}
         */
        public Builder loadBalancerOptions(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointLoadBalancerOptions loadBalancerOptions) {
            this.loadBalancerOptions = loadBalancerOptions;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getNetworkInterfaceOptions}
         * @param networkInterfaceOptions network_interface_options block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#network_interface_options VerifiedaccessEndpoint#network_interface_options}
         * @return {@code this}
         */
        public Builder networkInterfaceOptions(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointNetworkInterfaceOptions networkInterfaceOptions) {
            this.networkInterfaceOptions = networkInterfaceOptions;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getPolicyDocument}
         * @param policyDocument Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#policy_document VerifiedaccessEndpoint#policy_document}.
         * @return {@code this}
         */
        public Builder policyDocument(java.lang.String policyDocument) {
            this.policyDocument = policyDocument;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getRdsOptions}
         * @param rdsOptions rds_options block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#rds_options VerifiedaccessEndpoint#rds_options}
         * @return {@code this}
         */
        public Builder rdsOptions(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointRdsOptions rdsOptions) {
            this.rdsOptions = rdsOptions;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#security_group_ids VerifiedaccessEndpoint#security_group_ids}.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getSseSpecification}
         * @param sseSpecification sse_specification block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#sse_specification VerifiedaccessEndpoint#sse_specification}
         * @return {@code this}
         */
        public Builder sseSpecification(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointSseSpecification sseSpecification) {
            this.sseSpecification = sseSpecification;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#tags VerifiedaccessEndpoint#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#tags_all VerifiedaccessEndpoint#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#timeouts VerifiedaccessEndpoint#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getDependsOn}
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
         * Sets the value of {@link VerifiedaccessEndpointConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointConfig#getProvisioners}
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
         * @return a new instance of {@link VerifiedaccessEndpointConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedaccessEndpointConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedaccessEndpointConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedaccessEndpointConfig {
        private final java.lang.String attachmentType;
        private final java.lang.String endpointType;
        private final java.lang.String verifiedAccessGroupId;
        private final java.lang.String applicationDomain;
        private final imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointCidrOptions cidrOptions;
        private final java.lang.String description;
        private final java.lang.String domainCertificateArn;
        private final java.lang.String endpointDomainPrefix;
        private final java.lang.String id;
        private final imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointLoadBalancerOptions loadBalancerOptions;
        private final imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointNetworkInterfaceOptions networkInterfaceOptions;
        private final java.lang.String policyDocument;
        private final imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointRdsOptions rdsOptions;
        private final java.util.List<java.lang.String> securityGroupIds;
        private final imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointSseSpecification sseSpecification;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointTimeouts timeouts;
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
            this.attachmentType = software.amazon.jsii.Kernel.get(this, "attachmentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endpointType = software.amazon.jsii.Kernel.get(this, "endpointType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.verifiedAccessGroupId = software.amazon.jsii.Kernel.get(this, "verifiedAccessGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.applicationDomain = software.amazon.jsii.Kernel.get(this, "applicationDomain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cidrOptions = software.amazon.jsii.Kernel.get(this, "cidrOptions", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointCidrOptions.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domainCertificateArn = software.amazon.jsii.Kernel.get(this, "domainCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endpointDomainPrefix = software.amazon.jsii.Kernel.get(this, "endpointDomainPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.loadBalancerOptions = software.amazon.jsii.Kernel.get(this, "loadBalancerOptions", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointLoadBalancerOptions.class));
            this.networkInterfaceOptions = software.amazon.jsii.Kernel.get(this, "networkInterfaceOptions", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointNetworkInterfaceOptions.class));
            this.policyDocument = software.amazon.jsii.Kernel.get(this, "policyDocument", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rdsOptions = software.amazon.jsii.Kernel.get(this, "rdsOptions", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointRdsOptions.class));
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.sseSpecification = software.amazon.jsii.Kernel.get(this, "sseSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointSseSpecification.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointTimeouts.class));
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
            this.attachmentType = java.util.Objects.requireNonNull(builder.attachmentType, "attachmentType is required");
            this.endpointType = java.util.Objects.requireNonNull(builder.endpointType, "endpointType is required");
            this.verifiedAccessGroupId = java.util.Objects.requireNonNull(builder.verifiedAccessGroupId, "verifiedAccessGroupId is required");
            this.applicationDomain = builder.applicationDomain;
            this.cidrOptions = builder.cidrOptions;
            this.description = builder.description;
            this.domainCertificateArn = builder.domainCertificateArn;
            this.endpointDomainPrefix = builder.endpointDomainPrefix;
            this.id = builder.id;
            this.loadBalancerOptions = builder.loadBalancerOptions;
            this.networkInterfaceOptions = builder.networkInterfaceOptions;
            this.policyDocument = builder.policyDocument;
            this.rdsOptions = builder.rdsOptions;
            this.securityGroupIds = builder.securityGroupIds;
            this.sseSpecification = builder.sseSpecification;
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
        public final java.lang.String getAttachmentType() {
            return this.attachmentType;
        }

        @Override
        public final java.lang.String getEndpointType() {
            return this.endpointType;
        }

        @Override
        public final java.lang.String getVerifiedAccessGroupId() {
            return this.verifiedAccessGroupId;
        }

        @Override
        public final java.lang.String getApplicationDomain() {
            return this.applicationDomain;
        }

        @Override
        public final imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointCidrOptions getCidrOptions() {
            return this.cidrOptions;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getDomainCertificateArn() {
            return this.domainCertificateArn;
        }

        @Override
        public final java.lang.String getEndpointDomainPrefix() {
            return this.endpointDomainPrefix;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointLoadBalancerOptions getLoadBalancerOptions() {
            return this.loadBalancerOptions;
        }

        @Override
        public final imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointNetworkInterfaceOptions getNetworkInterfaceOptions() {
            return this.networkInterfaceOptions;
        }

        @Override
        public final java.lang.String getPolicyDocument() {
            return this.policyDocument;
        }

        @Override
        public final imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointRdsOptions getRdsOptions() {
            return this.rdsOptions;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
        }

        @Override
        public final imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointSseSpecification getSseSpecification() {
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
        public final imports.aws.verifiedaccess_endpoint.VerifiedaccessEndpointTimeouts getTimeouts() {
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

            data.set("attachmentType", om.valueToTree(this.getAttachmentType()));
            data.set("endpointType", om.valueToTree(this.getEndpointType()));
            data.set("verifiedAccessGroupId", om.valueToTree(this.getVerifiedAccessGroupId()));
            if (this.getApplicationDomain() != null) {
                data.set("applicationDomain", om.valueToTree(this.getApplicationDomain()));
            }
            if (this.getCidrOptions() != null) {
                data.set("cidrOptions", om.valueToTree(this.getCidrOptions()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDomainCertificateArn() != null) {
                data.set("domainCertificateArn", om.valueToTree(this.getDomainCertificateArn()));
            }
            if (this.getEndpointDomainPrefix() != null) {
                data.set("endpointDomainPrefix", om.valueToTree(this.getEndpointDomainPrefix()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLoadBalancerOptions() != null) {
                data.set("loadBalancerOptions", om.valueToTree(this.getLoadBalancerOptions()));
            }
            if (this.getNetworkInterfaceOptions() != null) {
                data.set("networkInterfaceOptions", om.valueToTree(this.getNetworkInterfaceOptions()));
            }
            if (this.getPolicyDocument() != null) {
                data.set("policyDocument", om.valueToTree(this.getPolicyDocument()));
            }
            if (this.getRdsOptions() != null) {
                data.set("rdsOptions", om.valueToTree(this.getRdsOptions()));
            }
            if (this.getSecurityGroupIds() != null) {
                data.set("securityGroupIds", om.valueToTree(this.getSecurityGroupIds()));
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
            struct.set("fqn", om.valueToTree("aws.verifiedaccessEndpoint.VerifiedaccessEndpointConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedaccessEndpointConfig.Jsii$Proxy that = (VerifiedaccessEndpointConfig.Jsii$Proxy) o;

            if (!attachmentType.equals(that.attachmentType)) return false;
            if (!endpointType.equals(that.endpointType)) return false;
            if (!verifiedAccessGroupId.equals(that.verifiedAccessGroupId)) return false;
            if (this.applicationDomain != null ? !this.applicationDomain.equals(that.applicationDomain) : that.applicationDomain != null) return false;
            if (this.cidrOptions != null ? !this.cidrOptions.equals(that.cidrOptions) : that.cidrOptions != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.domainCertificateArn != null ? !this.domainCertificateArn.equals(that.domainCertificateArn) : that.domainCertificateArn != null) return false;
            if (this.endpointDomainPrefix != null ? !this.endpointDomainPrefix.equals(that.endpointDomainPrefix) : that.endpointDomainPrefix != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.loadBalancerOptions != null ? !this.loadBalancerOptions.equals(that.loadBalancerOptions) : that.loadBalancerOptions != null) return false;
            if (this.networkInterfaceOptions != null ? !this.networkInterfaceOptions.equals(that.networkInterfaceOptions) : that.networkInterfaceOptions != null) return false;
            if (this.policyDocument != null ? !this.policyDocument.equals(that.policyDocument) : that.policyDocument != null) return false;
            if (this.rdsOptions != null ? !this.rdsOptions.equals(that.rdsOptions) : that.rdsOptions != null) return false;
            if (this.securityGroupIds != null ? !this.securityGroupIds.equals(that.securityGroupIds) : that.securityGroupIds != null) return false;
            if (this.sseSpecification != null ? !this.sseSpecification.equals(that.sseSpecification) : that.sseSpecification != null) return false;
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
            int result = this.attachmentType.hashCode();
            result = 31 * result + (this.endpointType.hashCode());
            result = 31 * result + (this.verifiedAccessGroupId.hashCode());
            result = 31 * result + (this.applicationDomain != null ? this.applicationDomain.hashCode() : 0);
            result = 31 * result + (this.cidrOptions != null ? this.cidrOptions.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.domainCertificateArn != null ? this.domainCertificateArn.hashCode() : 0);
            result = 31 * result + (this.endpointDomainPrefix != null ? this.endpointDomainPrefix.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.loadBalancerOptions != null ? this.loadBalancerOptions.hashCode() : 0);
            result = 31 * result + (this.networkInterfaceOptions != null ? this.networkInterfaceOptions.hashCode() : 0);
            result = 31 * result + (this.policyDocument != null ? this.policyDocument.hashCode() : 0);
            result = 31 * result + (this.rdsOptions != null ? this.rdsOptions.hashCode() : 0);
            result = 31 * result + (this.securityGroupIds != null ? this.securityGroupIds.hashCode() : 0);
            result = 31 * result + (this.sseSpecification != null ? this.sseSpecification.hashCode() : 0);
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
