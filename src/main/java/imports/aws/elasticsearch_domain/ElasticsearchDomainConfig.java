package imports.aws.elasticsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.180Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticsearchDomain.ElasticsearchDomainConfig")
@software.amazon.jsii.Jsii.Proxy(ElasticsearchDomainConfig.Jsii$Proxy.class)
public interface ElasticsearchDomainConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#domain_name ElasticsearchDomain#domain_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomainName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#access_policies ElasticsearchDomain#access_policies}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccessPolicies() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#advanced_options ElasticsearchDomain#advanced_options}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getAdvancedOptions() {
        return null;
    }

    /**
     * advanced_security_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#advanced_security_options ElasticsearchDomain#advanced_security_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptions getAdvancedSecurityOptions() {
        return null;
    }

    /**
     * auto_tune_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#auto_tune_options ElasticsearchDomain#auto_tune_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptions getAutoTuneOptions() {
        return null;
    }

    /**
     * cluster_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#cluster_config ElasticsearchDomain#cluster_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfig getClusterConfig() {
        return null;
    }

    /**
     * cognito_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#cognito_options ElasticsearchDomain#cognito_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainCognitoOptions getCognitoOptions() {
        return null;
    }

    /**
     * domain_endpoint_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#domain_endpoint_options ElasticsearchDomain#domain_endpoint_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainDomainEndpointOptions getDomainEndpointOptions() {
        return null;
    }

    /**
     * ebs_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#ebs_options ElasticsearchDomain#ebs_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainEbsOptions getEbsOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#elasticsearch_version ElasticsearchDomain#elasticsearch_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getElasticsearchVersion() {
        return null;
    }

    /**
     * encrypt_at_rest block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#encrypt_at_rest ElasticsearchDomain#encrypt_at_rest}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainEncryptAtRest getEncryptAtRest() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#id ElasticsearchDomain#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * log_publishing_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#log_publishing_options ElasticsearchDomain#log_publishing_options}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLogPublishingOptions() {
        return null;
    }

    /**
     * node_to_node_encryption block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#node_to_node_encryption ElasticsearchDomain#node_to_node_encryption}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainNodeToNodeEncryption getNodeToNodeEncryption() {
        return null;
    }

    /**
     * snapshot_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#snapshot_options ElasticsearchDomain#snapshot_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainSnapshotOptions getSnapshotOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#tags ElasticsearchDomain#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#tags_all ElasticsearchDomain#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#timeouts ElasticsearchDomain#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainTimeouts getTimeouts() {
        return null;
    }

    /**
     * vpc_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#vpc_options ElasticsearchDomain#vpc_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainVpcOptions getVpcOptions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElasticsearchDomainConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElasticsearchDomainConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElasticsearchDomainConfig> {
        java.lang.String domainName;
        java.lang.String accessPolicies;
        java.util.Map<java.lang.String, java.lang.String> advancedOptions;
        imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptions advancedSecurityOptions;
        imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptions autoTuneOptions;
        imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfig clusterConfig;
        imports.aws.elasticsearch_domain.ElasticsearchDomainCognitoOptions cognitoOptions;
        imports.aws.elasticsearch_domain.ElasticsearchDomainDomainEndpointOptions domainEndpointOptions;
        imports.aws.elasticsearch_domain.ElasticsearchDomainEbsOptions ebsOptions;
        java.lang.String elasticsearchVersion;
        imports.aws.elasticsearch_domain.ElasticsearchDomainEncryptAtRest encryptAtRest;
        java.lang.String id;
        java.lang.Object logPublishingOptions;
        imports.aws.elasticsearch_domain.ElasticsearchDomainNodeToNodeEncryption nodeToNodeEncryption;
        imports.aws.elasticsearch_domain.ElasticsearchDomainSnapshotOptions snapshotOptions;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.elasticsearch_domain.ElasticsearchDomainTimeouts timeouts;
        imports.aws.elasticsearch_domain.ElasticsearchDomainVpcOptions vpcOptions;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getDomainName}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#domain_name ElasticsearchDomain#domain_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder domainName(java.lang.String domainName) {
            this.domainName = domainName;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getAccessPolicies}
         * @param accessPolicies Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#access_policies ElasticsearchDomain#access_policies}.
         * @return {@code this}
         */
        public Builder accessPolicies(java.lang.String accessPolicies) {
            this.accessPolicies = accessPolicies;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getAdvancedOptions}
         * @param advancedOptions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#advanced_options ElasticsearchDomain#advanced_options}.
         * @return {@code this}
         */
        public Builder advancedOptions(java.util.Map<java.lang.String, java.lang.String> advancedOptions) {
            this.advancedOptions = advancedOptions;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getAdvancedSecurityOptions}
         * @param advancedSecurityOptions advanced_security_options block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#advanced_security_options ElasticsearchDomain#advanced_security_options}
         * @return {@code this}
         */
        public Builder advancedSecurityOptions(imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptions advancedSecurityOptions) {
            this.advancedSecurityOptions = advancedSecurityOptions;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getAutoTuneOptions}
         * @param autoTuneOptions auto_tune_options block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#auto_tune_options ElasticsearchDomain#auto_tune_options}
         * @return {@code this}
         */
        public Builder autoTuneOptions(imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptions autoTuneOptions) {
            this.autoTuneOptions = autoTuneOptions;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getClusterConfig}
         * @param clusterConfig cluster_config block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#cluster_config ElasticsearchDomain#cluster_config}
         * @return {@code this}
         */
        public Builder clusterConfig(imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfig clusterConfig) {
            this.clusterConfig = clusterConfig;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getCognitoOptions}
         * @param cognitoOptions cognito_options block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#cognito_options ElasticsearchDomain#cognito_options}
         * @return {@code this}
         */
        public Builder cognitoOptions(imports.aws.elasticsearch_domain.ElasticsearchDomainCognitoOptions cognitoOptions) {
            this.cognitoOptions = cognitoOptions;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getDomainEndpointOptions}
         * @param domainEndpointOptions domain_endpoint_options block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#domain_endpoint_options ElasticsearchDomain#domain_endpoint_options}
         * @return {@code this}
         */
        public Builder domainEndpointOptions(imports.aws.elasticsearch_domain.ElasticsearchDomainDomainEndpointOptions domainEndpointOptions) {
            this.domainEndpointOptions = domainEndpointOptions;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getEbsOptions}
         * @param ebsOptions ebs_options block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#ebs_options ElasticsearchDomain#ebs_options}
         * @return {@code this}
         */
        public Builder ebsOptions(imports.aws.elasticsearch_domain.ElasticsearchDomainEbsOptions ebsOptions) {
            this.ebsOptions = ebsOptions;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getElasticsearchVersion}
         * @param elasticsearchVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#elasticsearch_version ElasticsearchDomain#elasticsearch_version}.
         * @return {@code this}
         */
        public Builder elasticsearchVersion(java.lang.String elasticsearchVersion) {
            this.elasticsearchVersion = elasticsearchVersion;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getEncryptAtRest}
         * @param encryptAtRest encrypt_at_rest block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#encrypt_at_rest ElasticsearchDomain#encrypt_at_rest}
         * @return {@code this}
         */
        public Builder encryptAtRest(imports.aws.elasticsearch_domain.ElasticsearchDomainEncryptAtRest encryptAtRest) {
            this.encryptAtRest = encryptAtRest;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#id ElasticsearchDomain#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getLogPublishingOptions}
         * @param logPublishingOptions log_publishing_options block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#log_publishing_options ElasticsearchDomain#log_publishing_options}
         * @return {@code this}
         */
        public Builder logPublishingOptions(com.hashicorp.cdktf.IResolvable logPublishingOptions) {
            this.logPublishingOptions = logPublishingOptions;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getLogPublishingOptions}
         * @param logPublishingOptions log_publishing_options block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#log_publishing_options ElasticsearchDomain#log_publishing_options}
         * @return {@code this}
         */
        public Builder logPublishingOptions(java.util.List<? extends imports.aws.elasticsearch_domain.ElasticsearchDomainLogPublishingOptions> logPublishingOptions) {
            this.logPublishingOptions = logPublishingOptions;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getNodeToNodeEncryption}
         * @param nodeToNodeEncryption node_to_node_encryption block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#node_to_node_encryption ElasticsearchDomain#node_to_node_encryption}
         * @return {@code this}
         */
        public Builder nodeToNodeEncryption(imports.aws.elasticsearch_domain.ElasticsearchDomainNodeToNodeEncryption nodeToNodeEncryption) {
            this.nodeToNodeEncryption = nodeToNodeEncryption;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getSnapshotOptions}
         * @param snapshotOptions snapshot_options block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#snapshot_options ElasticsearchDomain#snapshot_options}
         * @return {@code this}
         */
        public Builder snapshotOptions(imports.aws.elasticsearch_domain.ElasticsearchDomainSnapshotOptions snapshotOptions) {
            this.snapshotOptions = snapshotOptions;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#tags ElasticsearchDomain#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#tags_all ElasticsearchDomain#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#timeouts ElasticsearchDomain#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.elasticsearch_domain.ElasticsearchDomainTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getVpcOptions}
         * @param vpcOptions vpc_options block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#vpc_options ElasticsearchDomain#vpc_options}
         * @return {@code this}
         */
        public Builder vpcOptions(imports.aws.elasticsearch_domain.ElasticsearchDomainVpcOptions vpcOptions) {
            this.vpcOptions = vpcOptions;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getDependsOn}
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
         * Sets the value of {@link ElasticsearchDomainConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainConfig#getProvisioners}
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
         * @return a new instance of {@link ElasticsearchDomainConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElasticsearchDomainConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElasticsearchDomainConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElasticsearchDomainConfig {
        private final java.lang.String domainName;
        private final java.lang.String accessPolicies;
        private final java.util.Map<java.lang.String, java.lang.String> advancedOptions;
        private final imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptions advancedSecurityOptions;
        private final imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptions autoTuneOptions;
        private final imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfig clusterConfig;
        private final imports.aws.elasticsearch_domain.ElasticsearchDomainCognitoOptions cognitoOptions;
        private final imports.aws.elasticsearch_domain.ElasticsearchDomainDomainEndpointOptions domainEndpointOptions;
        private final imports.aws.elasticsearch_domain.ElasticsearchDomainEbsOptions ebsOptions;
        private final java.lang.String elasticsearchVersion;
        private final imports.aws.elasticsearch_domain.ElasticsearchDomainEncryptAtRest encryptAtRest;
        private final java.lang.String id;
        private final java.lang.Object logPublishingOptions;
        private final imports.aws.elasticsearch_domain.ElasticsearchDomainNodeToNodeEncryption nodeToNodeEncryption;
        private final imports.aws.elasticsearch_domain.ElasticsearchDomainSnapshotOptions snapshotOptions;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.elasticsearch_domain.ElasticsearchDomainTimeouts timeouts;
        private final imports.aws.elasticsearch_domain.ElasticsearchDomainVpcOptions vpcOptions;
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
            this.domainName = software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accessPolicies = software.amazon.jsii.Kernel.get(this, "accessPolicies", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.advancedOptions = software.amazon.jsii.Kernel.get(this, "advancedOptions", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.advancedSecurityOptions = software.amazon.jsii.Kernel.get(this, "advancedSecurityOptions", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptions.class));
            this.autoTuneOptions = software.amazon.jsii.Kernel.get(this, "autoTuneOptions", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptions.class));
            this.clusterConfig = software.amazon.jsii.Kernel.get(this, "clusterConfig", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfig.class));
            this.cognitoOptions = software.amazon.jsii.Kernel.get(this, "cognitoOptions", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainCognitoOptions.class));
            this.domainEndpointOptions = software.amazon.jsii.Kernel.get(this, "domainEndpointOptions", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainDomainEndpointOptions.class));
            this.ebsOptions = software.amazon.jsii.Kernel.get(this, "ebsOptions", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainEbsOptions.class));
            this.elasticsearchVersion = software.amazon.jsii.Kernel.get(this, "elasticsearchVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encryptAtRest = software.amazon.jsii.Kernel.get(this, "encryptAtRest", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainEncryptAtRest.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logPublishingOptions = software.amazon.jsii.Kernel.get(this, "logPublishingOptions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.nodeToNodeEncryption = software.amazon.jsii.Kernel.get(this, "nodeToNodeEncryption", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainNodeToNodeEncryption.class));
            this.snapshotOptions = software.amazon.jsii.Kernel.get(this, "snapshotOptions", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainSnapshotOptions.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainTimeouts.class));
            this.vpcOptions = software.amazon.jsii.Kernel.get(this, "vpcOptions", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainVpcOptions.class));
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
            this.domainName = java.util.Objects.requireNonNull(builder.domainName, "domainName is required");
            this.accessPolicies = builder.accessPolicies;
            this.advancedOptions = builder.advancedOptions;
            this.advancedSecurityOptions = builder.advancedSecurityOptions;
            this.autoTuneOptions = builder.autoTuneOptions;
            this.clusterConfig = builder.clusterConfig;
            this.cognitoOptions = builder.cognitoOptions;
            this.domainEndpointOptions = builder.domainEndpointOptions;
            this.ebsOptions = builder.ebsOptions;
            this.elasticsearchVersion = builder.elasticsearchVersion;
            this.encryptAtRest = builder.encryptAtRest;
            this.id = builder.id;
            this.logPublishingOptions = builder.logPublishingOptions;
            this.nodeToNodeEncryption = builder.nodeToNodeEncryption;
            this.snapshotOptions = builder.snapshotOptions;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.vpcOptions = builder.vpcOptions;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDomainName() {
            return this.domainName;
        }

        @Override
        public final java.lang.String getAccessPolicies() {
            return this.accessPolicies;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getAdvancedOptions() {
            return this.advancedOptions;
        }

        @Override
        public final imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptions getAdvancedSecurityOptions() {
            return this.advancedSecurityOptions;
        }

        @Override
        public final imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptions getAutoTuneOptions() {
            return this.autoTuneOptions;
        }

        @Override
        public final imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfig getClusterConfig() {
            return this.clusterConfig;
        }

        @Override
        public final imports.aws.elasticsearch_domain.ElasticsearchDomainCognitoOptions getCognitoOptions() {
            return this.cognitoOptions;
        }

        @Override
        public final imports.aws.elasticsearch_domain.ElasticsearchDomainDomainEndpointOptions getDomainEndpointOptions() {
            return this.domainEndpointOptions;
        }

        @Override
        public final imports.aws.elasticsearch_domain.ElasticsearchDomainEbsOptions getEbsOptions() {
            return this.ebsOptions;
        }

        @Override
        public final java.lang.String getElasticsearchVersion() {
            return this.elasticsearchVersion;
        }

        @Override
        public final imports.aws.elasticsearch_domain.ElasticsearchDomainEncryptAtRest getEncryptAtRest() {
            return this.encryptAtRest;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getLogPublishingOptions() {
            return this.logPublishingOptions;
        }

        @Override
        public final imports.aws.elasticsearch_domain.ElasticsearchDomainNodeToNodeEncryption getNodeToNodeEncryption() {
            return this.nodeToNodeEncryption;
        }

        @Override
        public final imports.aws.elasticsearch_domain.ElasticsearchDomainSnapshotOptions getSnapshotOptions() {
            return this.snapshotOptions;
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
        public final imports.aws.elasticsearch_domain.ElasticsearchDomainTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final imports.aws.elasticsearch_domain.ElasticsearchDomainVpcOptions getVpcOptions() {
            return this.vpcOptions;
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

            data.set("domainName", om.valueToTree(this.getDomainName()));
            if (this.getAccessPolicies() != null) {
                data.set("accessPolicies", om.valueToTree(this.getAccessPolicies()));
            }
            if (this.getAdvancedOptions() != null) {
                data.set("advancedOptions", om.valueToTree(this.getAdvancedOptions()));
            }
            if (this.getAdvancedSecurityOptions() != null) {
                data.set("advancedSecurityOptions", om.valueToTree(this.getAdvancedSecurityOptions()));
            }
            if (this.getAutoTuneOptions() != null) {
                data.set("autoTuneOptions", om.valueToTree(this.getAutoTuneOptions()));
            }
            if (this.getClusterConfig() != null) {
                data.set("clusterConfig", om.valueToTree(this.getClusterConfig()));
            }
            if (this.getCognitoOptions() != null) {
                data.set("cognitoOptions", om.valueToTree(this.getCognitoOptions()));
            }
            if (this.getDomainEndpointOptions() != null) {
                data.set("domainEndpointOptions", om.valueToTree(this.getDomainEndpointOptions()));
            }
            if (this.getEbsOptions() != null) {
                data.set("ebsOptions", om.valueToTree(this.getEbsOptions()));
            }
            if (this.getElasticsearchVersion() != null) {
                data.set("elasticsearchVersion", om.valueToTree(this.getElasticsearchVersion()));
            }
            if (this.getEncryptAtRest() != null) {
                data.set("encryptAtRest", om.valueToTree(this.getEncryptAtRest()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLogPublishingOptions() != null) {
                data.set("logPublishingOptions", om.valueToTree(this.getLogPublishingOptions()));
            }
            if (this.getNodeToNodeEncryption() != null) {
                data.set("nodeToNodeEncryption", om.valueToTree(this.getNodeToNodeEncryption()));
            }
            if (this.getSnapshotOptions() != null) {
                data.set("snapshotOptions", om.valueToTree(this.getSnapshotOptions()));
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
            if (this.getVpcOptions() != null) {
                data.set("vpcOptions", om.valueToTree(this.getVpcOptions()));
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
            struct.set("fqn", om.valueToTree("aws.elasticsearchDomain.ElasticsearchDomainConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElasticsearchDomainConfig.Jsii$Proxy that = (ElasticsearchDomainConfig.Jsii$Proxy) o;

            if (!domainName.equals(that.domainName)) return false;
            if (this.accessPolicies != null ? !this.accessPolicies.equals(that.accessPolicies) : that.accessPolicies != null) return false;
            if (this.advancedOptions != null ? !this.advancedOptions.equals(that.advancedOptions) : that.advancedOptions != null) return false;
            if (this.advancedSecurityOptions != null ? !this.advancedSecurityOptions.equals(that.advancedSecurityOptions) : that.advancedSecurityOptions != null) return false;
            if (this.autoTuneOptions != null ? !this.autoTuneOptions.equals(that.autoTuneOptions) : that.autoTuneOptions != null) return false;
            if (this.clusterConfig != null ? !this.clusterConfig.equals(that.clusterConfig) : that.clusterConfig != null) return false;
            if (this.cognitoOptions != null ? !this.cognitoOptions.equals(that.cognitoOptions) : that.cognitoOptions != null) return false;
            if (this.domainEndpointOptions != null ? !this.domainEndpointOptions.equals(that.domainEndpointOptions) : that.domainEndpointOptions != null) return false;
            if (this.ebsOptions != null ? !this.ebsOptions.equals(that.ebsOptions) : that.ebsOptions != null) return false;
            if (this.elasticsearchVersion != null ? !this.elasticsearchVersion.equals(that.elasticsearchVersion) : that.elasticsearchVersion != null) return false;
            if (this.encryptAtRest != null ? !this.encryptAtRest.equals(that.encryptAtRest) : that.encryptAtRest != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.logPublishingOptions != null ? !this.logPublishingOptions.equals(that.logPublishingOptions) : that.logPublishingOptions != null) return false;
            if (this.nodeToNodeEncryption != null ? !this.nodeToNodeEncryption.equals(that.nodeToNodeEncryption) : that.nodeToNodeEncryption != null) return false;
            if (this.snapshotOptions != null ? !this.snapshotOptions.equals(that.snapshotOptions) : that.snapshotOptions != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.vpcOptions != null ? !this.vpcOptions.equals(that.vpcOptions) : that.vpcOptions != null) return false;
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
            int result = this.domainName.hashCode();
            result = 31 * result + (this.accessPolicies != null ? this.accessPolicies.hashCode() : 0);
            result = 31 * result + (this.advancedOptions != null ? this.advancedOptions.hashCode() : 0);
            result = 31 * result + (this.advancedSecurityOptions != null ? this.advancedSecurityOptions.hashCode() : 0);
            result = 31 * result + (this.autoTuneOptions != null ? this.autoTuneOptions.hashCode() : 0);
            result = 31 * result + (this.clusterConfig != null ? this.clusterConfig.hashCode() : 0);
            result = 31 * result + (this.cognitoOptions != null ? this.cognitoOptions.hashCode() : 0);
            result = 31 * result + (this.domainEndpointOptions != null ? this.domainEndpointOptions.hashCode() : 0);
            result = 31 * result + (this.ebsOptions != null ? this.ebsOptions.hashCode() : 0);
            result = 31 * result + (this.elasticsearchVersion != null ? this.elasticsearchVersion.hashCode() : 0);
            result = 31 * result + (this.encryptAtRest != null ? this.encryptAtRest.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.logPublishingOptions != null ? this.logPublishingOptions.hashCode() : 0);
            result = 31 * result + (this.nodeToNodeEncryption != null ? this.nodeToNodeEncryption.hashCode() : 0);
            result = 31 * result + (this.snapshotOptions != null ? this.snapshotOptions.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.vpcOptions != null ? this.vpcOptions.hashCode() : 0);
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
