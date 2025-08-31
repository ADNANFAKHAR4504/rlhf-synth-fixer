package imports.aws.storagegateway_nfs_file_share;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.533Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.storagegatewayNfsFileShare.StoragegatewayNfsFileShareConfig")
@software.amazon.jsii.Jsii.Proxy(StoragegatewayNfsFileShareConfig.Jsii$Proxy.class)
public interface StoragegatewayNfsFileShareConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#client_list StoragegatewayNfsFileShare#client_list}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getClientList();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#gateway_arn StoragegatewayNfsFileShare#gateway_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getGatewayArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#location_arn StoragegatewayNfsFileShare#location_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLocationArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#role_arn StoragegatewayNfsFileShare#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#audit_destination_arn StoragegatewayNfsFileShare#audit_destination_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuditDestinationArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#bucket_region StoragegatewayNfsFileShare#bucket_region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketRegion() {
        return null;
    }

    /**
     * cache_attributes block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#cache_attributes StoragegatewayNfsFileShare#cache_attributes}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareCacheAttributes getCacheAttributes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#default_storage_class StoragegatewayNfsFileShare#default_storage_class}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultStorageClass() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#file_share_name StoragegatewayNfsFileShare#file_share_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFileShareName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#guess_mime_type_enabled StoragegatewayNfsFileShare#guess_mime_type_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getGuessMimeTypeEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#id StoragegatewayNfsFileShare#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#kms_encrypted StoragegatewayNfsFileShare#kms_encrypted}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getKmsEncrypted() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#kms_key_arn StoragegatewayNfsFileShare#kms_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArn() {
        return null;
    }

    /**
     * nfs_file_share_defaults block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#nfs_file_share_defaults StoragegatewayNfsFileShare#nfs_file_share_defaults}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareNfsFileShareDefaults getNfsFileShareDefaults() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#notification_policy StoragegatewayNfsFileShare#notification_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNotificationPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#object_acl StoragegatewayNfsFileShare#object_acl}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getObjectAcl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#read_only StoragegatewayNfsFileShare#read_only}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getReadOnly() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#requester_pays StoragegatewayNfsFileShare#requester_pays}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRequesterPays() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#squash StoragegatewayNfsFileShare#squash}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSquash() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#tags StoragegatewayNfsFileShare#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#tags_all StoragegatewayNfsFileShare#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#timeouts StoragegatewayNfsFileShare#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#vpc_endpoint_dns_name StoragegatewayNfsFileShare#vpc_endpoint_dns_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVpcEndpointDnsName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link StoragegatewayNfsFileShareConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link StoragegatewayNfsFileShareConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<StoragegatewayNfsFileShareConfig> {
        java.util.List<java.lang.String> clientList;
        java.lang.String gatewayArn;
        java.lang.String locationArn;
        java.lang.String roleArn;
        java.lang.String auditDestinationArn;
        java.lang.String bucketRegion;
        imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareCacheAttributes cacheAttributes;
        java.lang.String defaultStorageClass;
        java.lang.String fileShareName;
        java.lang.Object guessMimeTypeEnabled;
        java.lang.String id;
        java.lang.Object kmsEncrypted;
        java.lang.String kmsKeyArn;
        imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareNfsFileShareDefaults nfsFileShareDefaults;
        java.lang.String notificationPolicy;
        java.lang.String objectAcl;
        java.lang.Object readOnly;
        java.lang.Object requesterPays;
        java.lang.String squash;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareTimeouts timeouts;
        java.lang.String vpcEndpointDnsName;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getClientList}
         * @param clientList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#client_list StoragegatewayNfsFileShare#client_list}. This parameter is required.
         * @return {@code this}
         */
        public Builder clientList(java.util.List<java.lang.String> clientList) {
            this.clientList = clientList;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getGatewayArn}
         * @param gatewayArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#gateway_arn StoragegatewayNfsFileShare#gateway_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder gatewayArn(java.lang.String gatewayArn) {
            this.gatewayArn = gatewayArn;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getLocationArn}
         * @param locationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#location_arn StoragegatewayNfsFileShare#location_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder locationArn(java.lang.String locationArn) {
            this.locationArn = locationArn;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#role_arn StoragegatewayNfsFileShare#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getAuditDestinationArn}
         * @param auditDestinationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#audit_destination_arn StoragegatewayNfsFileShare#audit_destination_arn}.
         * @return {@code this}
         */
        public Builder auditDestinationArn(java.lang.String auditDestinationArn) {
            this.auditDestinationArn = auditDestinationArn;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getBucketRegion}
         * @param bucketRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#bucket_region StoragegatewayNfsFileShare#bucket_region}.
         * @return {@code this}
         */
        public Builder bucketRegion(java.lang.String bucketRegion) {
            this.bucketRegion = bucketRegion;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getCacheAttributes}
         * @param cacheAttributes cache_attributes block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#cache_attributes StoragegatewayNfsFileShare#cache_attributes}
         * @return {@code this}
         */
        public Builder cacheAttributes(imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareCacheAttributes cacheAttributes) {
            this.cacheAttributes = cacheAttributes;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getDefaultStorageClass}
         * @param defaultStorageClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#default_storage_class StoragegatewayNfsFileShare#default_storage_class}.
         * @return {@code this}
         */
        public Builder defaultStorageClass(java.lang.String defaultStorageClass) {
            this.defaultStorageClass = defaultStorageClass;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getFileShareName}
         * @param fileShareName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#file_share_name StoragegatewayNfsFileShare#file_share_name}.
         * @return {@code this}
         */
        public Builder fileShareName(java.lang.String fileShareName) {
            this.fileShareName = fileShareName;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getGuessMimeTypeEnabled}
         * @param guessMimeTypeEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#guess_mime_type_enabled StoragegatewayNfsFileShare#guess_mime_type_enabled}.
         * @return {@code this}
         */
        public Builder guessMimeTypeEnabled(java.lang.Boolean guessMimeTypeEnabled) {
            this.guessMimeTypeEnabled = guessMimeTypeEnabled;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getGuessMimeTypeEnabled}
         * @param guessMimeTypeEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#guess_mime_type_enabled StoragegatewayNfsFileShare#guess_mime_type_enabled}.
         * @return {@code this}
         */
        public Builder guessMimeTypeEnabled(com.hashicorp.cdktf.IResolvable guessMimeTypeEnabled) {
            this.guessMimeTypeEnabled = guessMimeTypeEnabled;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#id StoragegatewayNfsFileShare#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getKmsEncrypted}
         * @param kmsEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#kms_encrypted StoragegatewayNfsFileShare#kms_encrypted}.
         * @return {@code this}
         */
        public Builder kmsEncrypted(java.lang.Boolean kmsEncrypted) {
            this.kmsEncrypted = kmsEncrypted;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getKmsEncrypted}
         * @param kmsEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#kms_encrypted StoragegatewayNfsFileShare#kms_encrypted}.
         * @return {@code this}
         */
        public Builder kmsEncrypted(com.hashicorp.cdktf.IResolvable kmsEncrypted) {
            this.kmsEncrypted = kmsEncrypted;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getKmsKeyArn}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#kms_key_arn StoragegatewayNfsFileShare#kms_key_arn}.
         * @return {@code this}
         */
        public Builder kmsKeyArn(java.lang.String kmsKeyArn) {
            this.kmsKeyArn = kmsKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getNfsFileShareDefaults}
         * @param nfsFileShareDefaults nfs_file_share_defaults block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#nfs_file_share_defaults StoragegatewayNfsFileShare#nfs_file_share_defaults}
         * @return {@code this}
         */
        public Builder nfsFileShareDefaults(imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareNfsFileShareDefaults nfsFileShareDefaults) {
            this.nfsFileShareDefaults = nfsFileShareDefaults;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getNotificationPolicy}
         * @param notificationPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#notification_policy StoragegatewayNfsFileShare#notification_policy}.
         * @return {@code this}
         */
        public Builder notificationPolicy(java.lang.String notificationPolicy) {
            this.notificationPolicy = notificationPolicy;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getObjectAcl}
         * @param objectAcl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#object_acl StoragegatewayNfsFileShare#object_acl}.
         * @return {@code this}
         */
        public Builder objectAcl(java.lang.String objectAcl) {
            this.objectAcl = objectAcl;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getReadOnly}
         * @param readOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#read_only StoragegatewayNfsFileShare#read_only}.
         * @return {@code this}
         */
        public Builder readOnly(java.lang.Boolean readOnly) {
            this.readOnly = readOnly;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getReadOnly}
         * @param readOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#read_only StoragegatewayNfsFileShare#read_only}.
         * @return {@code this}
         */
        public Builder readOnly(com.hashicorp.cdktf.IResolvable readOnly) {
            this.readOnly = readOnly;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getRequesterPays}
         * @param requesterPays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#requester_pays StoragegatewayNfsFileShare#requester_pays}.
         * @return {@code this}
         */
        public Builder requesterPays(java.lang.Boolean requesterPays) {
            this.requesterPays = requesterPays;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getRequesterPays}
         * @param requesterPays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#requester_pays StoragegatewayNfsFileShare#requester_pays}.
         * @return {@code this}
         */
        public Builder requesterPays(com.hashicorp.cdktf.IResolvable requesterPays) {
            this.requesterPays = requesterPays;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getSquash}
         * @param squash Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#squash StoragegatewayNfsFileShare#squash}.
         * @return {@code this}
         */
        public Builder squash(java.lang.String squash) {
            this.squash = squash;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#tags StoragegatewayNfsFileShare#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#tags_all StoragegatewayNfsFileShare#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#timeouts StoragegatewayNfsFileShare#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getVpcEndpointDnsName}
         * @param vpcEndpointDnsName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_nfs_file_share#vpc_endpoint_dns_name StoragegatewayNfsFileShare#vpc_endpoint_dns_name}.
         * @return {@code this}
         */
        public Builder vpcEndpointDnsName(java.lang.String vpcEndpointDnsName) {
            this.vpcEndpointDnsName = vpcEndpointDnsName;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getDependsOn}
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
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayNfsFileShareConfig#getProvisioners}
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
         * @return a new instance of {@link StoragegatewayNfsFileShareConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public StoragegatewayNfsFileShareConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link StoragegatewayNfsFileShareConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements StoragegatewayNfsFileShareConfig {
        private final java.util.List<java.lang.String> clientList;
        private final java.lang.String gatewayArn;
        private final java.lang.String locationArn;
        private final java.lang.String roleArn;
        private final java.lang.String auditDestinationArn;
        private final java.lang.String bucketRegion;
        private final imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareCacheAttributes cacheAttributes;
        private final java.lang.String defaultStorageClass;
        private final java.lang.String fileShareName;
        private final java.lang.Object guessMimeTypeEnabled;
        private final java.lang.String id;
        private final java.lang.Object kmsEncrypted;
        private final java.lang.String kmsKeyArn;
        private final imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareNfsFileShareDefaults nfsFileShareDefaults;
        private final java.lang.String notificationPolicy;
        private final java.lang.String objectAcl;
        private final java.lang.Object readOnly;
        private final java.lang.Object requesterPays;
        private final java.lang.String squash;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareTimeouts timeouts;
        private final java.lang.String vpcEndpointDnsName;
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
            this.clientList = software.amazon.jsii.Kernel.get(this, "clientList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.gatewayArn = software.amazon.jsii.Kernel.get(this, "gatewayArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.locationArn = software.amazon.jsii.Kernel.get(this, "locationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.auditDestinationArn = software.amazon.jsii.Kernel.get(this, "auditDestinationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bucketRegion = software.amazon.jsii.Kernel.get(this, "bucketRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cacheAttributes = software.amazon.jsii.Kernel.get(this, "cacheAttributes", software.amazon.jsii.NativeType.forClass(imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareCacheAttributes.class));
            this.defaultStorageClass = software.amazon.jsii.Kernel.get(this, "defaultStorageClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fileShareName = software.amazon.jsii.Kernel.get(this, "fileShareName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.guessMimeTypeEnabled = software.amazon.jsii.Kernel.get(this, "guessMimeTypeEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsEncrypted = software.amazon.jsii.Kernel.get(this, "kmsEncrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.kmsKeyArn = software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nfsFileShareDefaults = software.amazon.jsii.Kernel.get(this, "nfsFileShareDefaults", software.amazon.jsii.NativeType.forClass(imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareNfsFileShareDefaults.class));
            this.notificationPolicy = software.amazon.jsii.Kernel.get(this, "notificationPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.objectAcl = software.amazon.jsii.Kernel.get(this, "objectAcl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.readOnly = software.amazon.jsii.Kernel.get(this, "readOnly", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.requesterPays = software.amazon.jsii.Kernel.get(this, "requesterPays", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.squash = software.amazon.jsii.Kernel.get(this, "squash", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareTimeouts.class));
            this.vpcEndpointDnsName = software.amazon.jsii.Kernel.get(this, "vpcEndpointDnsName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.clientList = java.util.Objects.requireNonNull(builder.clientList, "clientList is required");
            this.gatewayArn = java.util.Objects.requireNonNull(builder.gatewayArn, "gatewayArn is required");
            this.locationArn = java.util.Objects.requireNonNull(builder.locationArn, "locationArn is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.auditDestinationArn = builder.auditDestinationArn;
            this.bucketRegion = builder.bucketRegion;
            this.cacheAttributes = builder.cacheAttributes;
            this.defaultStorageClass = builder.defaultStorageClass;
            this.fileShareName = builder.fileShareName;
            this.guessMimeTypeEnabled = builder.guessMimeTypeEnabled;
            this.id = builder.id;
            this.kmsEncrypted = builder.kmsEncrypted;
            this.kmsKeyArn = builder.kmsKeyArn;
            this.nfsFileShareDefaults = builder.nfsFileShareDefaults;
            this.notificationPolicy = builder.notificationPolicy;
            this.objectAcl = builder.objectAcl;
            this.readOnly = builder.readOnly;
            this.requesterPays = builder.requesterPays;
            this.squash = builder.squash;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.vpcEndpointDnsName = builder.vpcEndpointDnsName;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.util.List<java.lang.String> getClientList() {
            return this.clientList;
        }

        @Override
        public final java.lang.String getGatewayArn() {
            return this.gatewayArn;
        }

        @Override
        public final java.lang.String getLocationArn() {
            return this.locationArn;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.String getAuditDestinationArn() {
            return this.auditDestinationArn;
        }

        @Override
        public final java.lang.String getBucketRegion() {
            return this.bucketRegion;
        }

        @Override
        public final imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareCacheAttributes getCacheAttributes() {
            return this.cacheAttributes;
        }

        @Override
        public final java.lang.String getDefaultStorageClass() {
            return this.defaultStorageClass;
        }

        @Override
        public final java.lang.String getFileShareName() {
            return this.fileShareName;
        }

        @Override
        public final java.lang.Object getGuessMimeTypeEnabled() {
            return this.guessMimeTypeEnabled;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getKmsEncrypted() {
            return this.kmsEncrypted;
        }

        @Override
        public final java.lang.String getKmsKeyArn() {
            return this.kmsKeyArn;
        }

        @Override
        public final imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareNfsFileShareDefaults getNfsFileShareDefaults() {
            return this.nfsFileShareDefaults;
        }

        @Override
        public final java.lang.String getNotificationPolicy() {
            return this.notificationPolicy;
        }

        @Override
        public final java.lang.String getObjectAcl() {
            return this.objectAcl;
        }

        @Override
        public final java.lang.Object getReadOnly() {
            return this.readOnly;
        }

        @Override
        public final java.lang.Object getRequesterPays() {
            return this.requesterPays;
        }

        @Override
        public final java.lang.String getSquash() {
            return this.squash;
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
        public final imports.aws.storagegateway_nfs_file_share.StoragegatewayNfsFileShareTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getVpcEndpointDnsName() {
            return this.vpcEndpointDnsName;
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

            data.set("clientList", om.valueToTree(this.getClientList()));
            data.set("gatewayArn", om.valueToTree(this.getGatewayArn()));
            data.set("locationArn", om.valueToTree(this.getLocationArn()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getAuditDestinationArn() != null) {
                data.set("auditDestinationArn", om.valueToTree(this.getAuditDestinationArn()));
            }
            if (this.getBucketRegion() != null) {
                data.set("bucketRegion", om.valueToTree(this.getBucketRegion()));
            }
            if (this.getCacheAttributes() != null) {
                data.set("cacheAttributes", om.valueToTree(this.getCacheAttributes()));
            }
            if (this.getDefaultStorageClass() != null) {
                data.set("defaultStorageClass", om.valueToTree(this.getDefaultStorageClass()));
            }
            if (this.getFileShareName() != null) {
                data.set("fileShareName", om.valueToTree(this.getFileShareName()));
            }
            if (this.getGuessMimeTypeEnabled() != null) {
                data.set("guessMimeTypeEnabled", om.valueToTree(this.getGuessMimeTypeEnabled()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsEncrypted() != null) {
                data.set("kmsEncrypted", om.valueToTree(this.getKmsEncrypted()));
            }
            if (this.getKmsKeyArn() != null) {
                data.set("kmsKeyArn", om.valueToTree(this.getKmsKeyArn()));
            }
            if (this.getNfsFileShareDefaults() != null) {
                data.set("nfsFileShareDefaults", om.valueToTree(this.getNfsFileShareDefaults()));
            }
            if (this.getNotificationPolicy() != null) {
                data.set("notificationPolicy", om.valueToTree(this.getNotificationPolicy()));
            }
            if (this.getObjectAcl() != null) {
                data.set("objectAcl", om.valueToTree(this.getObjectAcl()));
            }
            if (this.getReadOnly() != null) {
                data.set("readOnly", om.valueToTree(this.getReadOnly()));
            }
            if (this.getRequesterPays() != null) {
                data.set("requesterPays", om.valueToTree(this.getRequesterPays()));
            }
            if (this.getSquash() != null) {
                data.set("squash", om.valueToTree(this.getSquash()));
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
            if (this.getVpcEndpointDnsName() != null) {
                data.set("vpcEndpointDnsName", om.valueToTree(this.getVpcEndpointDnsName()));
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
            struct.set("fqn", om.valueToTree("aws.storagegatewayNfsFileShare.StoragegatewayNfsFileShareConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            StoragegatewayNfsFileShareConfig.Jsii$Proxy that = (StoragegatewayNfsFileShareConfig.Jsii$Proxy) o;

            if (!clientList.equals(that.clientList)) return false;
            if (!gatewayArn.equals(that.gatewayArn)) return false;
            if (!locationArn.equals(that.locationArn)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (this.auditDestinationArn != null ? !this.auditDestinationArn.equals(that.auditDestinationArn) : that.auditDestinationArn != null) return false;
            if (this.bucketRegion != null ? !this.bucketRegion.equals(that.bucketRegion) : that.bucketRegion != null) return false;
            if (this.cacheAttributes != null ? !this.cacheAttributes.equals(that.cacheAttributes) : that.cacheAttributes != null) return false;
            if (this.defaultStorageClass != null ? !this.defaultStorageClass.equals(that.defaultStorageClass) : that.defaultStorageClass != null) return false;
            if (this.fileShareName != null ? !this.fileShareName.equals(that.fileShareName) : that.fileShareName != null) return false;
            if (this.guessMimeTypeEnabled != null ? !this.guessMimeTypeEnabled.equals(that.guessMimeTypeEnabled) : that.guessMimeTypeEnabled != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsEncrypted != null ? !this.kmsEncrypted.equals(that.kmsEncrypted) : that.kmsEncrypted != null) return false;
            if (this.kmsKeyArn != null ? !this.kmsKeyArn.equals(that.kmsKeyArn) : that.kmsKeyArn != null) return false;
            if (this.nfsFileShareDefaults != null ? !this.nfsFileShareDefaults.equals(that.nfsFileShareDefaults) : that.nfsFileShareDefaults != null) return false;
            if (this.notificationPolicy != null ? !this.notificationPolicy.equals(that.notificationPolicy) : that.notificationPolicy != null) return false;
            if (this.objectAcl != null ? !this.objectAcl.equals(that.objectAcl) : that.objectAcl != null) return false;
            if (this.readOnly != null ? !this.readOnly.equals(that.readOnly) : that.readOnly != null) return false;
            if (this.requesterPays != null ? !this.requesterPays.equals(that.requesterPays) : that.requesterPays != null) return false;
            if (this.squash != null ? !this.squash.equals(that.squash) : that.squash != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.vpcEndpointDnsName != null ? !this.vpcEndpointDnsName.equals(that.vpcEndpointDnsName) : that.vpcEndpointDnsName != null) return false;
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
            int result = this.clientList.hashCode();
            result = 31 * result + (this.gatewayArn.hashCode());
            result = 31 * result + (this.locationArn.hashCode());
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.auditDestinationArn != null ? this.auditDestinationArn.hashCode() : 0);
            result = 31 * result + (this.bucketRegion != null ? this.bucketRegion.hashCode() : 0);
            result = 31 * result + (this.cacheAttributes != null ? this.cacheAttributes.hashCode() : 0);
            result = 31 * result + (this.defaultStorageClass != null ? this.defaultStorageClass.hashCode() : 0);
            result = 31 * result + (this.fileShareName != null ? this.fileShareName.hashCode() : 0);
            result = 31 * result + (this.guessMimeTypeEnabled != null ? this.guessMimeTypeEnabled.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsEncrypted != null ? this.kmsEncrypted.hashCode() : 0);
            result = 31 * result + (this.kmsKeyArn != null ? this.kmsKeyArn.hashCode() : 0);
            result = 31 * result + (this.nfsFileShareDefaults != null ? this.nfsFileShareDefaults.hashCode() : 0);
            result = 31 * result + (this.notificationPolicy != null ? this.notificationPolicy.hashCode() : 0);
            result = 31 * result + (this.objectAcl != null ? this.objectAcl.hashCode() : 0);
            result = 31 * result + (this.readOnly != null ? this.readOnly.hashCode() : 0);
            result = 31 * result + (this.requesterPays != null ? this.requesterPays.hashCode() : 0);
            result = 31 * result + (this.squash != null ? this.squash.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.vpcEndpointDnsName != null ? this.vpcEndpointDnsName.hashCode() : 0);
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
