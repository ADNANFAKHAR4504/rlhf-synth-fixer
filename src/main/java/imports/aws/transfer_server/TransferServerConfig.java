package imports.aws.transfer_server;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.564Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferServer.TransferServerConfig")
@software.amazon.jsii.Jsii.Proxy(TransferServerConfig.Jsii$Proxy.class)
public interface TransferServerConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#certificate TransferServer#certificate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCertificate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#directory_id TransferServer#directory_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDirectoryId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#domain TransferServer#domain}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDomain() {
        return null;
    }

    /**
     * endpoint_details block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#endpoint_details TransferServer#endpoint_details}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.transfer_server.TransferServerEndpointDetails getEndpointDetails() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#endpoint_type TransferServer#endpoint_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEndpointType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#force_destroy TransferServer#force_destroy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getForceDestroy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#function TransferServer#function}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFunction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#host_key TransferServer#host_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHostKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#id TransferServer#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#identity_provider_type TransferServer#identity_provider_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIdentityProviderType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#invocation_role TransferServer#invocation_role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInvocationRole() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#logging_role TransferServer#logging_role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLoggingRole() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#post_authentication_login_banner TransferServer#post_authentication_login_banner}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPostAuthenticationLoginBanner() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#pre_authentication_login_banner TransferServer#pre_authentication_login_banner}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPreAuthenticationLoginBanner() {
        return null;
    }

    /**
     * protocol_details block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#protocol_details TransferServer#protocol_details}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.transfer_server.TransferServerProtocolDetails getProtocolDetails() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#protocols TransferServer#protocols}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getProtocols() {
        return null;
    }

    /**
     * s3_storage_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#s3_storage_options TransferServer#s3_storage_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.transfer_server.TransferServerS3StorageOptions getS3StorageOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#security_policy_name TransferServer#security_policy_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecurityPolicyName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#sftp_authentication_methods TransferServer#sftp_authentication_methods}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSftpAuthenticationMethods() {
        return null;
    }

    /**
     * This is a set of arns of destinations that will receive structured logs from the transfer server.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#structured_log_destinations TransferServer#structured_log_destinations}
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getStructuredLogDestinations() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#tags TransferServer#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#tags_all TransferServer#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#url TransferServer#url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUrl() {
        return null;
    }

    /**
     * workflow_details block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#workflow_details TransferServer#workflow_details}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.transfer_server.TransferServerWorkflowDetails getWorkflowDetails() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TransferServerConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TransferServerConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TransferServerConfig> {
        java.lang.String certificate;
        java.lang.String directoryId;
        java.lang.String domain;
        imports.aws.transfer_server.TransferServerEndpointDetails endpointDetails;
        java.lang.String endpointType;
        java.lang.Object forceDestroy;
        java.lang.String function;
        java.lang.String hostKey;
        java.lang.String id;
        java.lang.String identityProviderType;
        java.lang.String invocationRole;
        java.lang.String loggingRole;
        java.lang.String postAuthenticationLoginBanner;
        java.lang.String preAuthenticationLoginBanner;
        imports.aws.transfer_server.TransferServerProtocolDetails protocolDetails;
        java.util.List<java.lang.String> protocols;
        imports.aws.transfer_server.TransferServerS3StorageOptions s3StorageOptions;
        java.lang.String securityPolicyName;
        java.lang.String sftpAuthenticationMethods;
        java.util.List<java.lang.String> structuredLogDestinations;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String url;
        imports.aws.transfer_server.TransferServerWorkflowDetails workflowDetails;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link TransferServerConfig#getCertificate}
         * @param certificate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#certificate TransferServer#certificate}.
         * @return {@code this}
         */
        public Builder certificate(java.lang.String certificate) {
            this.certificate = certificate;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getDirectoryId}
         * @param directoryId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#directory_id TransferServer#directory_id}.
         * @return {@code this}
         */
        public Builder directoryId(java.lang.String directoryId) {
            this.directoryId = directoryId;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getDomain}
         * @param domain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#domain TransferServer#domain}.
         * @return {@code this}
         */
        public Builder domain(java.lang.String domain) {
            this.domain = domain;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getEndpointDetails}
         * @param endpointDetails endpoint_details block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#endpoint_details TransferServer#endpoint_details}
         * @return {@code this}
         */
        public Builder endpointDetails(imports.aws.transfer_server.TransferServerEndpointDetails endpointDetails) {
            this.endpointDetails = endpointDetails;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getEndpointType}
         * @param endpointType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#endpoint_type TransferServer#endpoint_type}.
         * @return {@code this}
         */
        public Builder endpointType(java.lang.String endpointType) {
            this.endpointType = endpointType;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getForceDestroy}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#force_destroy TransferServer#force_destroy}.
         * @return {@code this}
         */
        public Builder forceDestroy(java.lang.Boolean forceDestroy) {
            this.forceDestroy = forceDestroy;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getForceDestroy}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#force_destroy TransferServer#force_destroy}.
         * @return {@code this}
         */
        public Builder forceDestroy(com.hashicorp.cdktf.IResolvable forceDestroy) {
            this.forceDestroy = forceDestroy;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getFunction}
         * @param function Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#function TransferServer#function}.
         * @return {@code this}
         */
        public Builder function(java.lang.String function) {
            this.function = function;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getHostKey}
         * @param hostKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#host_key TransferServer#host_key}.
         * @return {@code this}
         */
        public Builder hostKey(java.lang.String hostKey) {
            this.hostKey = hostKey;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#id TransferServer#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getIdentityProviderType}
         * @param identityProviderType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#identity_provider_type TransferServer#identity_provider_type}.
         * @return {@code this}
         */
        public Builder identityProviderType(java.lang.String identityProviderType) {
            this.identityProviderType = identityProviderType;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getInvocationRole}
         * @param invocationRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#invocation_role TransferServer#invocation_role}.
         * @return {@code this}
         */
        public Builder invocationRole(java.lang.String invocationRole) {
            this.invocationRole = invocationRole;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getLoggingRole}
         * @param loggingRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#logging_role TransferServer#logging_role}.
         * @return {@code this}
         */
        public Builder loggingRole(java.lang.String loggingRole) {
            this.loggingRole = loggingRole;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getPostAuthenticationLoginBanner}
         * @param postAuthenticationLoginBanner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#post_authentication_login_banner TransferServer#post_authentication_login_banner}.
         * @return {@code this}
         */
        public Builder postAuthenticationLoginBanner(java.lang.String postAuthenticationLoginBanner) {
            this.postAuthenticationLoginBanner = postAuthenticationLoginBanner;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getPreAuthenticationLoginBanner}
         * @param preAuthenticationLoginBanner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#pre_authentication_login_banner TransferServer#pre_authentication_login_banner}.
         * @return {@code this}
         */
        public Builder preAuthenticationLoginBanner(java.lang.String preAuthenticationLoginBanner) {
            this.preAuthenticationLoginBanner = preAuthenticationLoginBanner;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getProtocolDetails}
         * @param protocolDetails protocol_details block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#protocol_details TransferServer#protocol_details}
         * @return {@code this}
         */
        public Builder protocolDetails(imports.aws.transfer_server.TransferServerProtocolDetails protocolDetails) {
            this.protocolDetails = protocolDetails;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getProtocols}
         * @param protocols Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#protocols TransferServer#protocols}.
         * @return {@code this}
         */
        public Builder protocols(java.util.List<java.lang.String> protocols) {
            this.protocols = protocols;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getS3StorageOptions}
         * @param s3StorageOptions s3_storage_options block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#s3_storage_options TransferServer#s3_storage_options}
         * @return {@code this}
         */
        public Builder s3StorageOptions(imports.aws.transfer_server.TransferServerS3StorageOptions s3StorageOptions) {
            this.s3StorageOptions = s3StorageOptions;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getSecurityPolicyName}
         * @param securityPolicyName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#security_policy_name TransferServer#security_policy_name}.
         * @return {@code this}
         */
        public Builder securityPolicyName(java.lang.String securityPolicyName) {
            this.securityPolicyName = securityPolicyName;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getSftpAuthenticationMethods}
         * @param sftpAuthenticationMethods Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#sftp_authentication_methods TransferServer#sftp_authentication_methods}.
         * @return {@code this}
         */
        public Builder sftpAuthenticationMethods(java.lang.String sftpAuthenticationMethods) {
            this.sftpAuthenticationMethods = sftpAuthenticationMethods;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getStructuredLogDestinations}
         * @param structuredLogDestinations This is a set of arns of destinations that will receive structured logs from the transfer server.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#structured_log_destinations TransferServer#structured_log_destinations}
         * @return {@code this}
         */
        public Builder structuredLogDestinations(java.util.List<java.lang.String> structuredLogDestinations) {
            this.structuredLogDestinations = structuredLogDestinations;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#tags TransferServer#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#tags_all TransferServer#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getUrl}
         * @param url Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#url TransferServer#url}.
         * @return {@code this}
         */
        public Builder url(java.lang.String url) {
            this.url = url;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getWorkflowDetails}
         * @param workflowDetails workflow_details block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#workflow_details TransferServer#workflow_details}
         * @return {@code this}
         */
        public Builder workflowDetails(imports.aws.transfer_server.TransferServerWorkflowDetails workflowDetails) {
            this.workflowDetails = workflowDetails;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getDependsOn}
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
         * Sets the value of {@link TransferServerConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerConfig#getProvisioners}
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
         * @return a new instance of {@link TransferServerConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TransferServerConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TransferServerConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TransferServerConfig {
        private final java.lang.String certificate;
        private final java.lang.String directoryId;
        private final java.lang.String domain;
        private final imports.aws.transfer_server.TransferServerEndpointDetails endpointDetails;
        private final java.lang.String endpointType;
        private final java.lang.Object forceDestroy;
        private final java.lang.String function;
        private final java.lang.String hostKey;
        private final java.lang.String id;
        private final java.lang.String identityProviderType;
        private final java.lang.String invocationRole;
        private final java.lang.String loggingRole;
        private final java.lang.String postAuthenticationLoginBanner;
        private final java.lang.String preAuthenticationLoginBanner;
        private final imports.aws.transfer_server.TransferServerProtocolDetails protocolDetails;
        private final java.util.List<java.lang.String> protocols;
        private final imports.aws.transfer_server.TransferServerS3StorageOptions s3StorageOptions;
        private final java.lang.String securityPolicyName;
        private final java.lang.String sftpAuthenticationMethods;
        private final java.util.List<java.lang.String> structuredLogDestinations;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String url;
        private final imports.aws.transfer_server.TransferServerWorkflowDetails workflowDetails;
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
            this.certificate = software.amazon.jsii.Kernel.get(this, "certificate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.directoryId = software.amazon.jsii.Kernel.get(this, "directoryId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domain = software.amazon.jsii.Kernel.get(this, "domain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endpointDetails = software.amazon.jsii.Kernel.get(this, "endpointDetails", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerEndpointDetails.class));
            this.endpointType = software.amazon.jsii.Kernel.get(this, "endpointType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.forceDestroy = software.amazon.jsii.Kernel.get(this, "forceDestroy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.function = software.amazon.jsii.Kernel.get(this, "function", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hostKey = software.amazon.jsii.Kernel.get(this, "hostKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.identityProviderType = software.amazon.jsii.Kernel.get(this, "identityProviderType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.invocationRole = software.amazon.jsii.Kernel.get(this, "invocationRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.loggingRole = software.amazon.jsii.Kernel.get(this, "loggingRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.postAuthenticationLoginBanner = software.amazon.jsii.Kernel.get(this, "postAuthenticationLoginBanner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.preAuthenticationLoginBanner = software.amazon.jsii.Kernel.get(this, "preAuthenticationLoginBanner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.protocolDetails = software.amazon.jsii.Kernel.get(this, "protocolDetails", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerProtocolDetails.class));
            this.protocols = software.amazon.jsii.Kernel.get(this, "protocols", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.s3StorageOptions = software.amazon.jsii.Kernel.get(this, "s3StorageOptions", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerS3StorageOptions.class));
            this.securityPolicyName = software.amazon.jsii.Kernel.get(this, "securityPolicyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sftpAuthenticationMethods = software.amazon.jsii.Kernel.get(this, "sftpAuthenticationMethods", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.structuredLogDestinations = software.amazon.jsii.Kernel.get(this, "structuredLogDestinations", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.url = software.amazon.jsii.Kernel.get(this, "url", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.workflowDetails = software.amazon.jsii.Kernel.get(this, "workflowDetails", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerWorkflowDetails.class));
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
            this.certificate = builder.certificate;
            this.directoryId = builder.directoryId;
            this.domain = builder.domain;
            this.endpointDetails = builder.endpointDetails;
            this.endpointType = builder.endpointType;
            this.forceDestroy = builder.forceDestroy;
            this.function = builder.function;
            this.hostKey = builder.hostKey;
            this.id = builder.id;
            this.identityProviderType = builder.identityProviderType;
            this.invocationRole = builder.invocationRole;
            this.loggingRole = builder.loggingRole;
            this.postAuthenticationLoginBanner = builder.postAuthenticationLoginBanner;
            this.preAuthenticationLoginBanner = builder.preAuthenticationLoginBanner;
            this.protocolDetails = builder.protocolDetails;
            this.protocols = builder.protocols;
            this.s3StorageOptions = builder.s3StorageOptions;
            this.securityPolicyName = builder.securityPolicyName;
            this.sftpAuthenticationMethods = builder.sftpAuthenticationMethods;
            this.structuredLogDestinations = builder.structuredLogDestinations;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.url = builder.url;
            this.workflowDetails = builder.workflowDetails;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getCertificate() {
            return this.certificate;
        }

        @Override
        public final java.lang.String getDirectoryId() {
            return this.directoryId;
        }

        @Override
        public final java.lang.String getDomain() {
            return this.domain;
        }

        @Override
        public final imports.aws.transfer_server.TransferServerEndpointDetails getEndpointDetails() {
            return this.endpointDetails;
        }

        @Override
        public final java.lang.String getEndpointType() {
            return this.endpointType;
        }

        @Override
        public final java.lang.Object getForceDestroy() {
            return this.forceDestroy;
        }

        @Override
        public final java.lang.String getFunction() {
            return this.function;
        }

        @Override
        public final java.lang.String getHostKey() {
            return this.hostKey;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getIdentityProviderType() {
            return this.identityProviderType;
        }

        @Override
        public final java.lang.String getInvocationRole() {
            return this.invocationRole;
        }

        @Override
        public final java.lang.String getLoggingRole() {
            return this.loggingRole;
        }

        @Override
        public final java.lang.String getPostAuthenticationLoginBanner() {
            return this.postAuthenticationLoginBanner;
        }

        @Override
        public final java.lang.String getPreAuthenticationLoginBanner() {
            return this.preAuthenticationLoginBanner;
        }

        @Override
        public final imports.aws.transfer_server.TransferServerProtocolDetails getProtocolDetails() {
            return this.protocolDetails;
        }

        @Override
        public final java.util.List<java.lang.String> getProtocols() {
            return this.protocols;
        }

        @Override
        public final imports.aws.transfer_server.TransferServerS3StorageOptions getS3StorageOptions() {
            return this.s3StorageOptions;
        }

        @Override
        public final java.lang.String getSecurityPolicyName() {
            return this.securityPolicyName;
        }

        @Override
        public final java.lang.String getSftpAuthenticationMethods() {
            return this.sftpAuthenticationMethods;
        }

        @Override
        public final java.util.List<java.lang.String> getStructuredLogDestinations() {
            return this.structuredLogDestinations;
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
        public final java.lang.String getUrl() {
            return this.url;
        }

        @Override
        public final imports.aws.transfer_server.TransferServerWorkflowDetails getWorkflowDetails() {
            return this.workflowDetails;
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

            if (this.getCertificate() != null) {
                data.set("certificate", om.valueToTree(this.getCertificate()));
            }
            if (this.getDirectoryId() != null) {
                data.set("directoryId", om.valueToTree(this.getDirectoryId()));
            }
            if (this.getDomain() != null) {
                data.set("domain", om.valueToTree(this.getDomain()));
            }
            if (this.getEndpointDetails() != null) {
                data.set("endpointDetails", om.valueToTree(this.getEndpointDetails()));
            }
            if (this.getEndpointType() != null) {
                data.set("endpointType", om.valueToTree(this.getEndpointType()));
            }
            if (this.getForceDestroy() != null) {
                data.set("forceDestroy", om.valueToTree(this.getForceDestroy()));
            }
            if (this.getFunction() != null) {
                data.set("function", om.valueToTree(this.getFunction()));
            }
            if (this.getHostKey() != null) {
                data.set("hostKey", om.valueToTree(this.getHostKey()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIdentityProviderType() != null) {
                data.set("identityProviderType", om.valueToTree(this.getIdentityProviderType()));
            }
            if (this.getInvocationRole() != null) {
                data.set("invocationRole", om.valueToTree(this.getInvocationRole()));
            }
            if (this.getLoggingRole() != null) {
                data.set("loggingRole", om.valueToTree(this.getLoggingRole()));
            }
            if (this.getPostAuthenticationLoginBanner() != null) {
                data.set("postAuthenticationLoginBanner", om.valueToTree(this.getPostAuthenticationLoginBanner()));
            }
            if (this.getPreAuthenticationLoginBanner() != null) {
                data.set("preAuthenticationLoginBanner", om.valueToTree(this.getPreAuthenticationLoginBanner()));
            }
            if (this.getProtocolDetails() != null) {
                data.set("protocolDetails", om.valueToTree(this.getProtocolDetails()));
            }
            if (this.getProtocols() != null) {
                data.set("protocols", om.valueToTree(this.getProtocols()));
            }
            if (this.getS3StorageOptions() != null) {
                data.set("s3StorageOptions", om.valueToTree(this.getS3StorageOptions()));
            }
            if (this.getSecurityPolicyName() != null) {
                data.set("securityPolicyName", om.valueToTree(this.getSecurityPolicyName()));
            }
            if (this.getSftpAuthenticationMethods() != null) {
                data.set("sftpAuthenticationMethods", om.valueToTree(this.getSftpAuthenticationMethods()));
            }
            if (this.getStructuredLogDestinations() != null) {
                data.set("structuredLogDestinations", om.valueToTree(this.getStructuredLogDestinations()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getUrl() != null) {
                data.set("url", om.valueToTree(this.getUrl()));
            }
            if (this.getWorkflowDetails() != null) {
                data.set("workflowDetails", om.valueToTree(this.getWorkflowDetails()));
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
            struct.set("fqn", om.valueToTree("aws.transferServer.TransferServerConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TransferServerConfig.Jsii$Proxy that = (TransferServerConfig.Jsii$Proxy) o;

            if (this.certificate != null ? !this.certificate.equals(that.certificate) : that.certificate != null) return false;
            if (this.directoryId != null ? !this.directoryId.equals(that.directoryId) : that.directoryId != null) return false;
            if (this.domain != null ? !this.domain.equals(that.domain) : that.domain != null) return false;
            if (this.endpointDetails != null ? !this.endpointDetails.equals(that.endpointDetails) : that.endpointDetails != null) return false;
            if (this.endpointType != null ? !this.endpointType.equals(that.endpointType) : that.endpointType != null) return false;
            if (this.forceDestroy != null ? !this.forceDestroy.equals(that.forceDestroy) : that.forceDestroy != null) return false;
            if (this.function != null ? !this.function.equals(that.function) : that.function != null) return false;
            if (this.hostKey != null ? !this.hostKey.equals(that.hostKey) : that.hostKey != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.identityProviderType != null ? !this.identityProviderType.equals(that.identityProviderType) : that.identityProviderType != null) return false;
            if (this.invocationRole != null ? !this.invocationRole.equals(that.invocationRole) : that.invocationRole != null) return false;
            if (this.loggingRole != null ? !this.loggingRole.equals(that.loggingRole) : that.loggingRole != null) return false;
            if (this.postAuthenticationLoginBanner != null ? !this.postAuthenticationLoginBanner.equals(that.postAuthenticationLoginBanner) : that.postAuthenticationLoginBanner != null) return false;
            if (this.preAuthenticationLoginBanner != null ? !this.preAuthenticationLoginBanner.equals(that.preAuthenticationLoginBanner) : that.preAuthenticationLoginBanner != null) return false;
            if (this.protocolDetails != null ? !this.protocolDetails.equals(that.protocolDetails) : that.protocolDetails != null) return false;
            if (this.protocols != null ? !this.protocols.equals(that.protocols) : that.protocols != null) return false;
            if (this.s3StorageOptions != null ? !this.s3StorageOptions.equals(that.s3StorageOptions) : that.s3StorageOptions != null) return false;
            if (this.securityPolicyName != null ? !this.securityPolicyName.equals(that.securityPolicyName) : that.securityPolicyName != null) return false;
            if (this.sftpAuthenticationMethods != null ? !this.sftpAuthenticationMethods.equals(that.sftpAuthenticationMethods) : that.sftpAuthenticationMethods != null) return false;
            if (this.structuredLogDestinations != null ? !this.structuredLogDestinations.equals(that.structuredLogDestinations) : that.structuredLogDestinations != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.url != null ? !this.url.equals(that.url) : that.url != null) return false;
            if (this.workflowDetails != null ? !this.workflowDetails.equals(that.workflowDetails) : that.workflowDetails != null) return false;
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
            int result = this.certificate != null ? this.certificate.hashCode() : 0;
            result = 31 * result + (this.directoryId != null ? this.directoryId.hashCode() : 0);
            result = 31 * result + (this.domain != null ? this.domain.hashCode() : 0);
            result = 31 * result + (this.endpointDetails != null ? this.endpointDetails.hashCode() : 0);
            result = 31 * result + (this.endpointType != null ? this.endpointType.hashCode() : 0);
            result = 31 * result + (this.forceDestroy != null ? this.forceDestroy.hashCode() : 0);
            result = 31 * result + (this.function != null ? this.function.hashCode() : 0);
            result = 31 * result + (this.hostKey != null ? this.hostKey.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.identityProviderType != null ? this.identityProviderType.hashCode() : 0);
            result = 31 * result + (this.invocationRole != null ? this.invocationRole.hashCode() : 0);
            result = 31 * result + (this.loggingRole != null ? this.loggingRole.hashCode() : 0);
            result = 31 * result + (this.postAuthenticationLoginBanner != null ? this.postAuthenticationLoginBanner.hashCode() : 0);
            result = 31 * result + (this.preAuthenticationLoginBanner != null ? this.preAuthenticationLoginBanner.hashCode() : 0);
            result = 31 * result + (this.protocolDetails != null ? this.protocolDetails.hashCode() : 0);
            result = 31 * result + (this.protocols != null ? this.protocols.hashCode() : 0);
            result = 31 * result + (this.s3StorageOptions != null ? this.s3StorageOptions.hashCode() : 0);
            result = 31 * result + (this.securityPolicyName != null ? this.securityPolicyName.hashCode() : 0);
            result = 31 * result + (this.sftpAuthenticationMethods != null ? this.sftpAuthenticationMethods.hashCode() : 0);
            result = 31 * result + (this.structuredLogDestinations != null ? this.structuredLogDestinations.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.url != null ? this.url.hashCode() : 0);
            result = 31 * result + (this.workflowDetails != null ? this.workflowDetails.hashCode() : 0);
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
