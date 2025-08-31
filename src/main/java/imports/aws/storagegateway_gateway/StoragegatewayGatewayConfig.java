package imports.aws.storagegateway_gateway;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.532Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.storagegatewayGateway.StoragegatewayGatewayConfig")
@software.amazon.jsii.Jsii.Proxy(StoragegatewayGatewayConfig.Jsii$Proxy.class)
public interface StoragegatewayGatewayConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#gateway_name StoragegatewayGateway#gateway_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getGatewayName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#gateway_timezone StoragegatewayGateway#gateway_timezone}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getGatewayTimezone();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#activation_key StoragegatewayGateway#activation_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getActivationKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#average_download_rate_limit_in_bits_per_sec StoragegatewayGateway#average_download_rate_limit_in_bits_per_sec}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAverageDownloadRateLimitInBitsPerSec() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#average_upload_rate_limit_in_bits_per_sec StoragegatewayGateway#average_upload_rate_limit_in_bits_per_sec}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAverageUploadRateLimitInBitsPerSec() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#cloudwatch_log_group_arn StoragegatewayGateway#cloudwatch_log_group_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCloudwatchLogGroupArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#gateway_ip_address StoragegatewayGateway#gateway_ip_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGatewayIpAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#gateway_type StoragegatewayGateway#gateway_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGatewayType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#gateway_vpc_endpoint StoragegatewayGateway#gateway_vpc_endpoint}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGatewayVpcEndpoint() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#id StoragegatewayGateway#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * maintenance_start_time block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#maintenance_start_time StoragegatewayGateway#maintenance_start_time}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.storagegateway_gateway.StoragegatewayGatewayMaintenanceStartTime getMaintenanceStartTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#medium_changer_type StoragegatewayGateway#medium_changer_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMediumChangerType() {
        return null;
    }

    /**
     * smb_active_directory_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#smb_active_directory_settings StoragegatewayGateway#smb_active_directory_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.storagegateway_gateway.StoragegatewayGatewaySmbActiveDirectorySettings getSmbActiveDirectorySettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#smb_file_share_visibility StoragegatewayGateway#smb_file_share_visibility}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSmbFileShareVisibility() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#smb_guest_password StoragegatewayGateway#smb_guest_password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSmbGuestPassword() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#smb_security_strategy StoragegatewayGateway#smb_security_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSmbSecurityStrategy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#tags StoragegatewayGateway#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#tags_all StoragegatewayGateway#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#tape_drive_type StoragegatewayGateway#tape_drive_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTapeDriveType() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#timeouts StoragegatewayGateway#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.storagegateway_gateway.StoragegatewayGatewayTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link StoragegatewayGatewayConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link StoragegatewayGatewayConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<StoragegatewayGatewayConfig> {
        java.lang.String gatewayName;
        java.lang.String gatewayTimezone;
        java.lang.String activationKey;
        java.lang.Number averageDownloadRateLimitInBitsPerSec;
        java.lang.Number averageUploadRateLimitInBitsPerSec;
        java.lang.String cloudwatchLogGroupArn;
        java.lang.String gatewayIpAddress;
        java.lang.String gatewayType;
        java.lang.String gatewayVpcEndpoint;
        java.lang.String id;
        imports.aws.storagegateway_gateway.StoragegatewayGatewayMaintenanceStartTime maintenanceStartTime;
        java.lang.String mediumChangerType;
        imports.aws.storagegateway_gateway.StoragegatewayGatewaySmbActiveDirectorySettings smbActiveDirectorySettings;
        java.lang.Object smbFileShareVisibility;
        java.lang.String smbGuestPassword;
        java.lang.String smbSecurityStrategy;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String tapeDriveType;
        imports.aws.storagegateway_gateway.StoragegatewayGatewayTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getGatewayName}
         * @param gatewayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#gateway_name StoragegatewayGateway#gateway_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder gatewayName(java.lang.String gatewayName) {
            this.gatewayName = gatewayName;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getGatewayTimezone}
         * @param gatewayTimezone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#gateway_timezone StoragegatewayGateway#gateway_timezone}. This parameter is required.
         * @return {@code this}
         */
        public Builder gatewayTimezone(java.lang.String gatewayTimezone) {
            this.gatewayTimezone = gatewayTimezone;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getActivationKey}
         * @param activationKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#activation_key StoragegatewayGateway#activation_key}.
         * @return {@code this}
         */
        public Builder activationKey(java.lang.String activationKey) {
            this.activationKey = activationKey;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getAverageDownloadRateLimitInBitsPerSec}
         * @param averageDownloadRateLimitInBitsPerSec Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#average_download_rate_limit_in_bits_per_sec StoragegatewayGateway#average_download_rate_limit_in_bits_per_sec}.
         * @return {@code this}
         */
        public Builder averageDownloadRateLimitInBitsPerSec(java.lang.Number averageDownloadRateLimitInBitsPerSec) {
            this.averageDownloadRateLimitInBitsPerSec = averageDownloadRateLimitInBitsPerSec;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getAverageUploadRateLimitInBitsPerSec}
         * @param averageUploadRateLimitInBitsPerSec Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#average_upload_rate_limit_in_bits_per_sec StoragegatewayGateway#average_upload_rate_limit_in_bits_per_sec}.
         * @return {@code this}
         */
        public Builder averageUploadRateLimitInBitsPerSec(java.lang.Number averageUploadRateLimitInBitsPerSec) {
            this.averageUploadRateLimitInBitsPerSec = averageUploadRateLimitInBitsPerSec;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getCloudwatchLogGroupArn}
         * @param cloudwatchLogGroupArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#cloudwatch_log_group_arn StoragegatewayGateway#cloudwatch_log_group_arn}.
         * @return {@code this}
         */
        public Builder cloudwatchLogGroupArn(java.lang.String cloudwatchLogGroupArn) {
            this.cloudwatchLogGroupArn = cloudwatchLogGroupArn;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getGatewayIpAddress}
         * @param gatewayIpAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#gateway_ip_address StoragegatewayGateway#gateway_ip_address}.
         * @return {@code this}
         */
        public Builder gatewayIpAddress(java.lang.String gatewayIpAddress) {
            this.gatewayIpAddress = gatewayIpAddress;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getGatewayType}
         * @param gatewayType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#gateway_type StoragegatewayGateway#gateway_type}.
         * @return {@code this}
         */
        public Builder gatewayType(java.lang.String gatewayType) {
            this.gatewayType = gatewayType;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getGatewayVpcEndpoint}
         * @param gatewayVpcEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#gateway_vpc_endpoint StoragegatewayGateway#gateway_vpc_endpoint}.
         * @return {@code this}
         */
        public Builder gatewayVpcEndpoint(java.lang.String gatewayVpcEndpoint) {
            this.gatewayVpcEndpoint = gatewayVpcEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#id StoragegatewayGateway#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getMaintenanceStartTime}
         * @param maintenanceStartTime maintenance_start_time block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#maintenance_start_time StoragegatewayGateway#maintenance_start_time}
         * @return {@code this}
         */
        public Builder maintenanceStartTime(imports.aws.storagegateway_gateway.StoragegatewayGatewayMaintenanceStartTime maintenanceStartTime) {
            this.maintenanceStartTime = maintenanceStartTime;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getMediumChangerType}
         * @param mediumChangerType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#medium_changer_type StoragegatewayGateway#medium_changer_type}.
         * @return {@code this}
         */
        public Builder mediumChangerType(java.lang.String mediumChangerType) {
            this.mediumChangerType = mediumChangerType;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getSmbActiveDirectorySettings}
         * @param smbActiveDirectorySettings smb_active_directory_settings block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#smb_active_directory_settings StoragegatewayGateway#smb_active_directory_settings}
         * @return {@code this}
         */
        public Builder smbActiveDirectorySettings(imports.aws.storagegateway_gateway.StoragegatewayGatewaySmbActiveDirectorySettings smbActiveDirectorySettings) {
            this.smbActiveDirectorySettings = smbActiveDirectorySettings;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getSmbFileShareVisibility}
         * @param smbFileShareVisibility Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#smb_file_share_visibility StoragegatewayGateway#smb_file_share_visibility}.
         * @return {@code this}
         */
        public Builder smbFileShareVisibility(java.lang.Boolean smbFileShareVisibility) {
            this.smbFileShareVisibility = smbFileShareVisibility;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getSmbFileShareVisibility}
         * @param smbFileShareVisibility Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#smb_file_share_visibility StoragegatewayGateway#smb_file_share_visibility}.
         * @return {@code this}
         */
        public Builder smbFileShareVisibility(com.hashicorp.cdktf.IResolvable smbFileShareVisibility) {
            this.smbFileShareVisibility = smbFileShareVisibility;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getSmbGuestPassword}
         * @param smbGuestPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#smb_guest_password StoragegatewayGateway#smb_guest_password}.
         * @return {@code this}
         */
        public Builder smbGuestPassword(java.lang.String smbGuestPassword) {
            this.smbGuestPassword = smbGuestPassword;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getSmbSecurityStrategy}
         * @param smbSecurityStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#smb_security_strategy StoragegatewayGateway#smb_security_strategy}.
         * @return {@code this}
         */
        public Builder smbSecurityStrategy(java.lang.String smbSecurityStrategy) {
            this.smbSecurityStrategy = smbSecurityStrategy;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#tags StoragegatewayGateway#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#tags_all StoragegatewayGateway#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getTapeDriveType}
         * @param tapeDriveType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#tape_drive_type StoragegatewayGateway#tape_drive_type}.
         * @return {@code this}
         */
        public Builder tapeDriveType(java.lang.String tapeDriveType) {
            this.tapeDriveType = tapeDriveType;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#timeouts StoragegatewayGateway#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.storagegateway_gateway.StoragegatewayGatewayTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getDependsOn}
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
         * Sets the value of {@link StoragegatewayGatewayConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewayConfig#getProvisioners}
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
         * @return a new instance of {@link StoragegatewayGatewayConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public StoragegatewayGatewayConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link StoragegatewayGatewayConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements StoragegatewayGatewayConfig {
        private final java.lang.String gatewayName;
        private final java.lang.String gatewayTimezone;
        private final java.lang.String activationKey;
        private final java.lang.Number averageDownloadRateLimitInBitsPerSec;
        private final java.lang.Number averageUploadRateLimitInBitsPerSec;
        private final java.lang.String cloudwatchLogGroupArn;
        private final java.lang.String gatewayIpAddress;
        private final java.lang.String gatewayType;
        private final java.lang.String gatewayVpcEndpoint;
        private final java.lang.String id;
        private final imports.aws.storagegateway_gateway.StoragegatewayGatewayMaintenanceStartTime maintenanceStartTime;
        private final java.lang.String mediumChangerType;
        private final imports.aws.storagegateway_gateway.StoragegatewayGatewaySmbActiveDirectorySettings smbActiveDirectorySettings;
        private final java.lang.Object smbFileShareVisibility;
        private final java.lang.String smbGuestPassword;
        private final java.lang.String smbSecurityStrategy;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String tapeDriveType;
        private final imports.aws.storagegateway_gateway.StoragegatewayGatewayTimeouts timeouts;
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
            this.gatewayName = software.amazon.jsii.Kernel.get(this, "gatewayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.gatewayTimezone = software.amazon.jsii.Kernel.get(this, "gatewayTimezone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.activationKey = software.amazon.jsii.Kernel.get(this, "activationKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.averageDownloadRateLimitInBitsPerSec = software.amazon.jsii.Kernel.get(this, "averageDownloadRateLimitInBitsPerSec", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.averageUploadRateLimitInBitsPerSec = software.amazon.jsii.Kernel.get(this, "averageUploadRateLimitInBitsPerSec", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.cloudwatchLogGroupArn = software.amazon.jsii.Kernel.get(this, "cloudwatchLogGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.gatewayIpAddress = software.amazon.jsii.Kernel.get(this, "gatewayIpAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.gatewayType = software.amazon.jsii.Kernel.get(this, "gatewayType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.gatewayVpcEndpoint = software.amazon.jsii.Kernel.get(this, "gatewayVpcEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maintenanceStartTime = software.amazon.jsii.Kernel.get(this, "maintenanceStartTime", software.amazon.jsii.NativeType.forClass(imports.aws.storagegateway_gateway.StoragegatewayGatewayMaintenanceStartTime.class));
            this.mediumChangerType = software.amazon.jsii.Kernel.get(this, "mediumChangerType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.smbActiveDirectorySettings = software.amazon.jsii.Kernel.get(this, "smbActiveDirectorySettings", software.amazon.jsii.NativeType.forClass(imports.aws.storagegateway_gateway.StoragegatewayGatewaySmbActiveDirectorySettings.class));
            this.smbFileShareVisibility = software.amazon.jsii.Kernel.get(this, "smbFileShareVisibility", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.smbGuestPassword = software.amazon.jsii.Kernel.get(this, "smbGuestPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.smbSecurityStrategy = software.amazon.jsii.Kernel.get(this, "smbSecurityStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tapeDriveType = software.amazon.jsii.Kernel.get(this, "tapeDriveType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.storagegateway_gateway.StoragegatewayGatewayTimeouts.class));
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
            this.gatewayName = java.util.Objects.requireNonNull(builder.gatewayName, "gatewayName is required");
            this.gatewayTimezone = java.util.Objects.requireNonNull(builder.gatewayTimezone, "gatewayTimezone is required");
            this.activationKey = builder.activationKey;
            this.averageDownloadRateLimitInBitsPerSec = builder.averageDownloadRateLimitInBitsPerSec;
            this.averageUploadRateLimitInBitsPerSec = builder.averageUploadRateLimitInBitsPerSec;
            this.cloudwatchLogGroupArn = builder.cloudwatchLogGroupArn;
            this.gatewayIpAddress = builder.gatewayIpAddress;
            this.gatewayType = builder.gatewayType;
            this.gatewayVpcEndpoint = builder.gatewayVpcEndpoint;
            this.id = builder.id;
            this.maintenanceStartTime = builder.maintenanceStartTime;
            this.mediumChangerType = builder.mediumChangerType;
            this.smbActiveDirectorySettings = builder.smbActiveDirectorySettings;
            this.smbFileShareVisibility = builder.smbFileShareVisibility;
            this.smbGuestPassword = builder.smbGuestPassword;
            this.smbSecurityStrategy = builder.smbSecurityStrategy;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.tapeDriveType = builder.tapeDriveType;
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
        public final java.lang.String getGatewayName() {
            return this.gatewayName;
        }

        @Override
        public final java.lang.String getGatewayTimezone() {
            return this.gatewayTimezone;
        }

        @Override
        public final java.lang.String getActivationKey() {
            return this.activationKey;
        }

        @Override
        public final java.lang.Number getAverageDownloadRateLimitInBitsPerSec() {
            return this.averageDownloadRateLimitInBitsPerSec;
        }

        @Override
        public final java.lang.Number getAverageUploadRateLimitInBitsPerSec() {
            return this.averageUploadRateLimitInBitsPerSec;
        }

        @Override
        public final java.lang.String getCloudwatchLogGroupArn() {
            return this.cloudwatchLogGroupArn;
        }

        @Override
        public final java.lang.String getGatewayIpAddress() {
            return this.gatewayIpAddress;
        }

        @Override
        public final java.lang.String getGatewayType() {
            return this.gatewayType;
        }

        @Override
        public final java.lang.String getGatewayVpcEndpoint() {
            return this.gatewayVpcEndpoint;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.storagegateway_gateway.StoragegatewayGatewayMaintenanceStartTime getMaintenanceStartTime() {
            return this.maintenanceStartTime;
        }

        @Override
        public final java.lang.String getMediumChangerType() {
            return this.mediumChangerType;
        }

        @Override
        public final imports.aws.storagegateway_gateway.StoragegatewayGatewaySmbActiveDirectorySettings getSmbActiveDirectorySettings() {
            return this.smbActiveDirectorySettings;
        }

        @Override
        public final java.lang.Object getSmbFileShareVisibility() {
            return this.smbFileShareVisibility;
        }

        @Override
        public final java.lang.String getSmbGuestPassword() {
            return this.smbGuestPassword;
        }

        @Override
        public final java.lang.String getSmbSecurityStrategy() {
            return this.smbSecurityStrategy;
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
        public final java.lang.String getTapeDriveType() {
            return this.tapeDriveType;
        }

        @Override
        public final imports.aws.storagegateway_gateway.StoragegatewayGatewayTimeouts getTimeouts() {
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

            data.set("gatewayName", om.valueToTree(this.getGatewayName()));
            data.set("gatewayTimezone", om.valueToTree(this.getGatewayTimezone()));
            if (this.getActivationKey() != null) {
                data.set("activationKey", om.valueToTree(this.getActivationKey()));
            }
            if (this.getAverageDownloadRateLimitInBitsPerSec() != null) {
                data.set("averageDownloadRateLimitInBitsPerSec", om.valueToTree(this.getAverageDownloadRateLimitInBitsPerSec()));
            }
            if (this.getAverageUploadRateLimitInBitsPerSec() != null) {
                data.set("averageUploadRateLimitInBitsPerSec", om.valueToTree(this.getAverageUploadRateLimitInBitsPerSec()));
            }
            if (this.getCloudwatchLogGroupArn() != null) {
                data.set("cloudwatchLogGroupArn", om.valueToTree(this.getCloudwatchLogGroupArn()));
            }
            if (this.getGatewayIpAddress() != null) {
                data.set("gatewayIpAddress", om.valueToTree(this.getGatewayIpAddress()));
            }
            if (this.getGatewayType() != null) {
                data.set("gatewayType", om.valueToTree(this.getGatewayType()));
            }
            if (this.getGatewayVpcEndpoint() != null) {
                data.set("gatewayVpcEndpoint", om.valueToTree(this.getGatewayVpcEndpoint()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getMaintenanceStartTime() != null) {
                data.set("maintenanceStartTime", om.valueToTree(this.getMaintenanceStartTime()));
            }
            if (this.getMediumChangerType() != null) {
                data.set("mediumChangerType", om.valueToTree(this.getMediumChangerType()));
            }
            if (this.getSmbActiveDirectorySettings() != null) {
                data.set("smbActiveDirectorySettings", om.valueToTree(this.getSmbActiveDirectorySettings()));
            }
            if (this.getSmbFileShareVisibility() != null) {
                data.set("smbFileShareVisibility", om.valueToTree(this.getSmbFileShareVisibility()));
            }
            if (this.getSmbGuestPassword() != null) {
                data.set("smbGuestPassword", om.valueToTree(this.getSmbGuestPassword()));
            }
            if (this.getSmbSecurityStrategy() != null) {
                data.set("smbSecurityStrategy", om.valueToTree(this.getSmbSecurityStrategy()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTapeDriveType() != null) {
                data.set("tapeDriveType", om.valueToTree(this.getTapeDriveType()));
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
            struct.set("fqn", om.valueToTree("aws.storagegatewayGateway.StoragegatewayGatewayConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            StoragegatewayGatewayConfig.Jsii$Proxy that = (StoragegatewayGatewayConfig.Jsii$Proxy) o;

            if (!gatewayName.equals(that.gatewayName)) return false;
            if (!gatewayTimezone.equals(that.gatewayTimezone)) return false;
            if (this.activationKey != null ? !this.activationKey.equals(that.activationKey) : that.activationKey != null) return false;
            if (this.averageDownloadRateLimitInBitsPerSec != null ? !this.averageDownloadRateLimitInBitsPerSec.equals(that.averageDownloadRateLimitInBitsPerSec) : that.averageDownloadRateLimitInBitsPerSec != null) return false;
            if (this.averageUploadRateLimitInBitsPerSec != null ? !this.averageUploadRateLimitInBitsPerSec.equals(that.averageUploadRateLimitInBitsPerSec) : that.averageUploadRateLimitInBitsPerSec != null) return false;
            if (this.cloudwatchLogGroupArn != null ? !this.cloudwatchLogGroupArn.equals(that.cloudwatchLogGroupArn) : that.cloudwatchLogGroupArn != null) return false;
            if (this.gatewayIpAddress != null ? !this.gatewayIpAddress.equals(that.gatewayIpAddress) : that.gatewayIpAddress != null) return false;
            if (this.gatewayType != null ? !this.gatewayType.equals(that.gatewayType) : that.gatewayType != null) return false;
            if (this.gatewayVpcEndpoint != null ? !this.gatewayVpcEndpoint.equals(that.gatewayVpcEndpoint) : that.gatewayVpcEndpoint != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.maintenanceStartTime != null ? !this.maintenanceStartTime.equals(that.maintenanceStartTime) : that.maintenanceStartTime != null) return false;
            if (this.mediumChangerType != null ? !this.mediumChangerType.equals(that.mediumChangerType) : that.mediumChangerType != null) return false;
            if (this.smbActiveDirectorySettings != null ? !this.smbActiveDirectorySettings.equals(that.smbActiveDirectorySettings) : that.smbActiveDirectorySettings != null) return false;
            if (this.smbFileShareVisibility != null ? !this.smbFileShareVisibility.equals(that.smbFileShareVisibility) : that.smbFileShareVisibility != null) return false;
            if (this.smbGuestPassword != null ? !this.smbGuestPassword.equals(that.smbGuestPassword) : that.smbGuestPassword != null) return false;
            if (this.smbSecurityStrategy != null ? !this.smbSecurityStrategy.equals(that.smbSecurityStrategy) : that.smbSecurityStrategy != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.tapeDriveType != null ? !this.tapeDriveType.equals(that.tapeDriveType) : that.tapeDriveType != null) return false;
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
            int result = this.gatewayName.hashCode();
            result = 31 * result + (this.gatewayTimezone.hashCode());
            result = 31 * result + (this.activationKey != null ? this.activationKey.hashCode() : 0);
            result = 31 * result + (this.averageDownloadRateLimitInBitsPerSec != null ? this.averageDownloadRateLimitInBitsPerSec.hashCode() : 0);
            result = 31 * result + (this.averageUploadRateLimitInBitsPerSec != null ? this.averageUploadRateLimitInBitsPerSec.hashCode() : 0);
            result = 31 * result + (this.cloudwatchLogGroupArn != null ? this.cloudwatchLogGroupArn.hashCode() : 0);
            result = 31 * result + (this.gatewayIpAddress != null ? this.gatewayIpAddress.hashCode() : 0);
            result = 31 * result + (this.gatewayType != null ? this.gatewayType.hashCode() : 0);
            result = 31 * result + (this.gatewayVpcEndpoint != null ? this.gatewayVpcEndpoint.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.maintenanceStartTime != null ? this.maintenanceStartTime.hashCode() : 0);
            result = 31 * result + (this.mediumChangerType != null ? this.mediumChangerType.hashCode() : 0);
            result = 31 * result + (this.smbActiveDirectorySettings != null ? this.smbActiveDirectorySettings.hashCode() : 0);
            result = 31 * result + (this.smbFileShareVisibility != null ? this.smbFileShareVisibility.hashCode() : 0);
            result = 31 * result + (this.smbGuestPassword != null ? this.smbGuestPassword.hashCode() : 0);
            result = 31 * result + (this.smbSecurityStrategy != null ? this.smbSecurityStrategy.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.tapeDriveType != null ? this.tapeDriveType.hashCode() : 0);
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
