package imports.aws.opsworks_instance;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.017Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opsworksInstance.OpsworksInstanceConfig")
@software.amazon.jsii.Jsii.Proxy(OpsworksInstanceConfig.Jsii$Proxy.class)
public interface OpsworksInstanceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#layer_ids OpsworksInstance#layer_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getLayerIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#stack_id OpsworksInstance#stack_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStackId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#agent_version OpsworksInstance#agent_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAgentVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ami_id OpsworksInstance#ami_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAmiId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#architecture OpsworksInstance#architecture}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getArchitecture() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#auto_scaling_type OpsworksInstance#auto_scaling_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAutoScalingType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#availability_zone OpsworksInstance#availability_zone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZone() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#created_at OpsworksInstance#created_at}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCreatedAt() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#delete_ebs OpsworksInstance#delete_ebs}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeleteEbs() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#delete_eip OpsworksInstance#delete_eip}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeleteEip() {
        return null;
    }

    /**
     * ebs_block_device block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ebs_block_device OpsworksInstance#ebs_block_device}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEbsBlockDevice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ebs_optimized OpsworksInstance#ebs_optimized}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEbsOptimized() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ecs_cluster_arn OpsworksInstance#ecs_cluster_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEcsClusterArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#elastic_ip OpsworksInstance#elastic_ip}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getElasticIp() {
        return null;
    }

    /**
     * ephemeral_block_device block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ephemeral_block_device OpsworksInstance#ephemeral_block_device}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEphemeralBlockDevice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#hostname OpsworksInstance#hostname}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHostname() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#id OpsworksInstance#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#infrastructure_class OpsworksInstance#infrastructure_class}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInfrastructureClass() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#install_updates_on_boot OpsworksInstance#install_updates_on_boot}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInstallUpdatesOnBoot() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#instance_profile_arn OpsworksInstance#instance_profile_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceProfileArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#instance_type OpsworksInstance#instance_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#os OpsworksInstance#os}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOs() {
        return null;
    }

    /**
     * root_block_device block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#root_block_device OpsworksInstance#root_block_device}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRootBlockDevice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#root_device_type OpsworksInstance#root_device_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRootDeviceType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#security_group_ids OpsworksInstance#security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ssh_key_name OpsworksInstance#ssh_key_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSshKeyName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#state OpsworksInstance#state}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getState() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#status OpsworksInstance#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#subnet_id OpsworksInstance#subnet_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubnetId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#tenancy OpsworksInstance#tenancy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTenancy() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#timeouts OpsworksInstance#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.opsworks_instance.OpsworksInstanceTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#virtualization_type OpsworksInstance#virtualization_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVirtualizationType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OpsworksInstanceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpsworksInstanceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpsworksInstanceConfig> {
        java.util.List<java.lang.String> layerIds;
        java.lang.String stackId;
        java.lang.String agentVersion;
        java.lang.String amiId;
        java.lang.String architecture;
        java.lang.String autoScalingType;
        java.lang.String availabilityZone;
        java.lang.String createdAt;
        java.lang.Object deleteEbs;
        java.lang.Object deleteEip;
        java.lang.Object ebsBlockDevice;
        java.lang.Object ebsOptimized;
        java.lang.String ecsClusterArn;
        java.lang.String elasticIp;
        java.lang.Object ephemeralBlockDevice;
        java.lang.String hostname;
        java.lang.String id;
        java.lang.String infrastructureClass;
        java.lang.Object installUpdatesOnBoot;
        java.lang.String instanceProfileArn;
        java.lang.String instanceType;
        java.lang.String os;
        java.lang.Object rootBlockDevice;
        java.lang.String rootDeviceType;
        java.util.List<java.lang.String> securityGroupIds;
        java.lang.String sshKeyName;
        java.lang.String state;
        java.lang.String status;
        java.lang.String subnetId;
        java.lang.String tenancy;
        imports.aws.opsworks_instance.OpsworksInstanceTimeouts timeouts;
        java.lang.String virtualizationType;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getLayerIds}
         * @param layerIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#layer_ids OpsworksInstance#layer_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder layerIds(java.util.List<java.lang.String> layerIds) {
            this.layerIds = layerIds;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getStackId}
         * @param stackId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#stack_id OpsworksInstance#stack_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder stackId(java.lang.String stackId) {
            this.stackId = stackId;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getAgentVersion}
         * @param agentVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#agent_version OpsworksInstance#agent_version}.
         * @return {@code this}
         */
        public Builder agentVersion(java.lang.String agentVersion) {
            this.agentVersion = agentVersion;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getAmiId}
         * @param amiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ami_id OpsworksInstance#ami_id}.
         * @return {@code this}
         */
        public Builder amiId(java.lang.String amiId) {
            this.amiId = amiId;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getArchitecture}
         * @param architecture Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#architecture OpsworksInstance#architecture}.
         * @return {@code this}
         */
        public Builder architecture(java.lang.String architecture) {
            this.architecture = architecture;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getAutoScalingType}
         * @param autoScalingType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#auto_scaling_type OpsworksInstance#auto_scaling_type}.
         * @return {@code this}
         */
        public Builder autoScalingType(java.lang.String autoScalingType) {
            this.autoScalingType = autoScalingType;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getAvailabilityZone}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#availability_zone OpsworksInstance#availability_zone}.
         * @return {@code this}
         */
        public Builder availabilityZone(java.lang.String availabilityZone) {
            this.availabilityZone = availabilityZone;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getCreatedAt}
         * @param createdAt Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#created_at OpsworksInstance#created_at}.
         * @return {@code this}
         */
        public Builder createdAt(java.lang.String createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getDeleteEbs}
         * @param deleteEbs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#delete_ebs OpsworksInstance#delete_ebs}.
         * @return {@code this}
         */
        public Builder deleteEbs(java.lang.Boolean deleteEbs) {
            this.deleteEbs = deleteEbs;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getDeleteEbs}
         * @param deleteEbs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#delete_ebs OpsworksInstance#delete_ebs}.
         * @return {@code this}
         */
        public Builder deleteEbs(com.hashicorp.cdktf.IResolvable deleteEbs) {
            this.deleteEbs = deleteEbs;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getDeleteEip}
         * @param deleteEip Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#delete_eip OpsworksInstance#delete_eip}.
         * @return {@code this}
         */
        public Builder deleteEip(java.lang.Boolean deleteEip) {
            this.deleteEip = deleteEip;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getDeleteEip}
         * @param deleteEip Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#delete_eip OpsworksInstance#delete_eip}.
         * @return {@code this}
         */
        public Builder deleteEip(com.hashicorp.cdktf.IResolvable deleteEip) {
            this.deleteEip = deleteEip;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getEbsBlockDevice}
         * @param ebsBlockDevice ebs_block_device block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ebs_block_device OpsworksInstance#ebs_block_device}
         * @return {@code this}
         */
        public Builder ebsBlockDevice(com.hashicorp.cdktf.IResolvable ebsBlockDevice) {
            this.ebsBlockDevice = ebsBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getEbsBlockDevice}
         * @param ebsBlockDevice ebs_block_device block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ebs_block_device OpsworksInstance#ebs_block_device}
         * @return {@code this}
         */
        public Builder ebsBlockDevice(java.util.List<? extends imports.aws.opsworks_instance.OpsworksInstanceEbsBlockDevice> ebsBlockDevice) {
            this.ebsBlockDevice = ebsBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getEbsOptimized}
         * @param ebsOptimized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ebs_optimized OpsworksInstance#ebs_optimized}.
         * @return {@code this}
         */
        public Builder ebsOptimized(java.lang.Boolean ebsOptimized) {
            this.ebsOptimized = ebsOptimized;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getEbsOptimized}
         * @param ebsOptimized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ebs_optimized OpsworksInstance#ebs_optimized}.
         * @return {@code this}
         */
        public Builder ebsOptimized(com.hashicorp.cdktf.IResolvable ebsOptimized) {
            this.ebsOptimized = ebsOptimized;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getEcsClusterArn}
         * @param ecsClusterArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ecs_cluster_arn OpsworksInstance#ecs_cluster_arn}.
         * @return {@code this}
         */
        public Builder ecsClusterArn(java.lang.String ecsClusterArn) {
            this.ecsClusterArn = ecsClusterArn;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getElasticIp}
         * @param elasticIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#elastic_ip OpsworksInstance#elastic_ip}.
         * @return {@code this}
         */
        public Builder elasticIp(java.lang.String elasticIp) {
            this.elasticIp = elasticIp;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getEphemeralBlockDevice}
         * @param ephemeralBlockDevice ephemeral_block_device block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ephemeral_block_device OpsworksInstance#ephemeral_block_device}
         * @return {@code this}
         */
        public Builder ephemeralBlockDevice(com.hashicorp.cdktf.IResolvable ephemeralBlockDevice) {
            this.ephemeralBlockDevice = ephemeralBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getEphemeralBlockDevice}
         * @param ephemeralBlockDevice ephemeral_block_device block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ephemeral_block_device OpsworksInstance#ephemeral_block_device}
         * @return {@code this}
         */
        public Builder ephemeralBlockDevice(java.util.List<? extends imports.aws.opsworks_instance.OpsworksInstanceEphemeralBlockDevice> ephemeralBlockDevice) {
            this.ephemeralBlockDevice = ephemeralBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getHostname}
         * @param hostname Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#hostname OpsworksInstance#hostname}.
         * @return {@code this}
         */
        public Builder hostname(java.lang.String hostname) {
            this.hostname = hostname;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#id OpsworksInstance#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getInfrastructureClass}
         * @param infrastructureClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#infrastructure_class OpsworksInstance#infrastructure_class}.
         * @return {@code this}
         */
        public Builder infrastructureClass(java.lang.String infrastructureClass) {
            this.infrastructureClass = infrastructureClass;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getInstallUpdatesOnBoot}
         * @param installUpdatesOnBoot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#install_updates_on_boot OpsworksInstance#install_updates_on_boot}.
         * @return {@code this}
         */
        public Builder installUpdatesOnBoot(java.lang.Boolean installUpdatesOnBoot) {
            this.installUpdatesOnBoot = installUpdatesOnBoot;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getInstallUpdatesOnBoot}
         * @param installUpdatesOnBoot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#install_updates_on_boot OpsworksInstance#install_updates_on_boot}.
         * @return {@code this}
         */
        public Builder installUpdatesOnBoot(com.hashicorp.cdktf.IResolvable installUpdatesOnBoot) {
            this.installUpdatesOnBoot = installUpdatesOnBoot;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getInstanceProfileArn}
         * @param instanceProfileArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#instance_profile_arn OpsworksInstance#instance_profile_arn}.
         * @return {@code this}
         */
        public Builder instanceProfileArn(java.lang.String instanceProfileArn) {
            this.instanceProfileArn = instanceProfileArn;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#instance_type OpsworksInstance#instance_type}.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getOs}
         * @param os Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#os OpsworksInstance#os}.
         * @return {@code this}
         */
        public Builder os(java.lang.String os) {
            this.os = os;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getRootBlockDevice}
         * @param rootBlockDevice root_block_device block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#root_block_device OpsworksInstance#root_block_device}
         * @return {@code this}
         */
        public Builder rootBlockDevice(com.hashicorp.cdktf.IResolvable rootBlockDevice) {
            this.rootBlockDevice = rootBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getRootBlockDevice}
         * @param rootBlockDevice root_block_device block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#root_block_device OpsworksInstance#root_block_device}
         * @return {@code this}
         */
        public Builder rootBlockDevice(java.util.List<? extends imports.aws.opsworks_instance.OpsworksInstanceRootBlockDevice> rootBlockDevice) {
            this.rootBlockDevice = rootBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getRootDeviceType}
         * @param rootDeviceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#root_device_type OpsworksInstance#root_device_type}.
         * @return {@code this}
         */
        public Builder rootDeviceType(java.lang.String rootDeviceType) {
            this.rootDeviceType = rootDeviceType;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#security_group_ids OpsworksInstance#security_group_ids}.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getSshKeyName}
         * @param sshKeyName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ssh_key_name OpsworksInstance#ssh_key_name}.
         * @return {@code this}
         */
        public Builder sshKeyName(java.lang.String sshKeyName) {
            this.sshKeyName = sshKeyName;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getState}
         * @param state Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#state OpsworksInstance#state}.
         * @return {@code this}
         */
        public Builder state(java.lang.String state) {
            this.state = state;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#status OpsworksInstance#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getSubnetId}
         * @param subnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#subnet_id OpsworksInstance#subnet_id}.
         * @return {@code this}
         */
        public Builder subnetId(java.lang.String subnetId) {
            this.subnetId = subnetId;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getTenancy}
         * @param tenancy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#tenancy OpsworksInstance#tenancy}.
         * @return {@code this}
         */
        public Builder tenancy(java.lang.String tenancy) {
            this.tenancy = tenancy;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#timeouts OpsworksInstance#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.opsworks_instance.OpsworksInstanceTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getVirtualizationType}
         * @param virtualizationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#virtualization_type OpsworksInstance#virtualization_type}.
         * @return {@code this}
         */
        public Builder virtualizationType(java.lang.String virtualizationType) {
            this.virtualizationType = virtualizationType;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getDependsOn}
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
         * Sets the value of {@link OpsworksInstanceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksInstanceConfig#getProvisioners}
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
         * @return a new instance of {@link OpsworksInstanceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpsworksInstanceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpsworksInstanceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpsworksInstanceConfig {
        private final java.util.List<java.lang.String> layerIds;
        private final java.lang.String stackId;
        private final java.lang.String agentVersion;
        private final java.lang.String amiId;
        private final java.lang.String architecture;
        private final java.lang.String autoScalingType;
        private final java.lang.String availabilityZone;
        private final java.lang.String createdAt;
        private final java.lang.Object deleteEbs;
        private final java.lang.Object deleteEip;
        private final java.lang.Object ebsBlockDevice;
        private final java.lang.Object ebsOptimized;
        private final java.lang.String ecsClusterArn;
        private final java.lang.String elasticIp;
        private final java.lang.Object ephemeralBlockDevice;
        private final java.lang.String hostname;
        private final java.lang.String id;
        private final java.lang.String infrastructureClass;
        private final java.lang.Object installUpdatesOnBoot;
        private final java.lang.String instanceProfileArn;
        private final java.lang.String instanceType;
        private final java.lang.String os;
        private final java.lang.Object rootBlockDevice;
        private final java.lang.String rootDeviceType;
        private final java.util.List<java.lang.String> securityGroupIds;
        private final java.lang.String sshKeyName;
        private final java.lang.String state;
        private final java.lang.String status;
        private final java.lang.String subnetId;
        private final java.lang.String tenancy;
        private final imports.aws.opsworks_instance.OpsworksInstanceTimeouts timeouts;
        private final java.lang.String virtualizationType;
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
            this.layerIds = software.amazon.jsii.Kernel.get(this, "layerIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.stackId = software.amazon.jsii.Kernel.get(this, "stackId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.agentVersion = software.amazon.jsii.Kernel.get(this, "agentVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.amiId = software.amazon.jsii.Kernel.get(this, "amiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.architecture = software.amazon.jsii.Kernel.get(this, "architecture", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.autoScalingType = software.amazon.jsii.Kernel.get(this, "autoScalingType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.availabilityZone = software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.createdAt = software.amazon.jsii.Kernel.get(this, "createdAt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deleteEbs = software.amazon.jsii.Kernel.get(this, "deleteEbs", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.deleteEip = software.amazon.jsii.Kernel.get(this, "deleteEip", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ebsBlockDevice = software.amazon.jsii.Kernel.get(this, "ebsBlockDevice", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ebsOptimized = software.amazon.jsii.Kernel.get(this, "ebsOptimized", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ecsClusterArn = software.amazon.jsii.Kernel.get(this, "ecsClusterArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.elasticIp = software.amazon.jsii.Kernel.get(this, "elasticIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ephemeralBlockDevice = software.amazon.jsii.Kernel.get(this, "ephemeralBlockDevice", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.hostname = software.amazon.jsii.Kernel.get(this, "hostname", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.infrastructureClass = software.amazon.jsii.Kernel.get(this, "infrastructureClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.installUpdatesOnBoot = software.amazon.jsii.Kernel.get(this, "installUpdatesOnBoot", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.instanceProfileArn = software.amazon.jsii.Kernel.get(this, "instanceProfileArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.os = software.amazon.jsii.Kernel.get(this, "os", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rootBlockDevice = software.amazon.jsii.Kernel.get(this, "rootBlockDevice", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.rootDeviceType = software.amazon.jsii.Kernel.get(this, "rootDeviceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.sshKeyName = software.amazon.jsii.Kernel.get(this, "sshKeyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.state = software.amazon.jsii.Kernel.get(this, "state", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subnetId = software.amazon.jsii.Kernel.get(this, "subnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tenancy = software.amazon.jsii.Kernel.get(this, "tenancy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_instance.OpsworksInstanceTimeouts.class));
            this.virtualizationType = software.amazon.jsii.Kernel.get(this, "virtualizationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.layerIds = java.util.Objects.requireNonNull(builder.layerIds, "layerIds is required");
            this.stackId = java.util.Objects.requireNonNull(builder.stackId, "stackId is required");
            this.agentVersion = builder.agentVersion;
            this.amiId = builder.amiId;
            this.architecture = builder.architecture;
            this.autoScalingType = builder.autoScalingType;
            this.availabilityZone = builder.availabilityZone;
            this.createdAt = builder.createdAt;
            this.deleteEbs = builder.deleteEbs;
            this.deleteEip = builder.deleteEip;
            this.ebsBlockDevice = builder.ebsBlockDevice;
            this.ebsOptimized = builder.ebsOptimized;
            this.ecsClusterArn = builder.ecsClusterArn;
            this.elasticIp = builder.elasticIp;
            this.ephemeralBlockDevice = builder.ephemeralBlockDevice;
            this.hostname = builder.hostname;
            this.id = builder.id;
            this.infrastructureClass = builder.infrastructureClass;
            this.installUpdatesOnBoot = builder.installUpdatesOnBoot;
            this.instanceProfileArn = builder.instanceProfileArn;
            this.instanceType = builder.instanceType;
            this.os = builder.os;
            this.rootBlockDevice = builder.rootBlockDevice;
            this.rootDeviceType = builder.rootDeviceType;
            this.securityGroupIds = builder.securityGroupIds;
            this.sshKeyName = builder.sshKeyName;
            this.state = builder.state;
            this.status = builder.status;
            this.subnetId = builder.subnetId;
            this.tenancy = builder.tenancy;
            this.timeouts = builder.timeouts;
            this.virtualizationType = builder.virtualizationType;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.util.List<java.lang.String> getLayerIds() {
            return this.layerIds;
        }

        @Override
        public final java.lang.String getStackId() {
            return this.stackId;
        }

        @Override
        public final java.lang.String getAgentVersion() {
            return this.agentVersion;
        }

        @Override
        public final java.lang.String getAmiId() {
            return this.amiId;
        }

        @Override
        public final java.lang.String getArchitecture() {
            return this.architecture;
        }

        @Override
        public final java.lang.String getAutoScalingType() {
            return this.autoScalingType;
        }

        @Override
        public final java.lang.String getAvailabilityZone() {
            return this.availabilityZone;
        }

        @Override
        public final java.lang.String getCreatedAt() {
            return this.createdAt;
        }

        @Override
        public final java.lang.Object getDeleteEbs() {
            return this.deleteEbs;
        }

        @Override
        public final java.lang.Object getDeleteEip() {
            return this.deleteEip;
        }

        @Override
        public final java.lang.Object getEbsBlockDevice() {
            return this.ebsBlockDevice;
        }

        @Override
        public final java.lang.Object getEbsOptimized() {
            return this.ebsOptimized;
        }

        @Override
        public final java.lang.String getEcsClusterArn() {
            return this.ecsClusterArn;
        }

        @Override
        public final java.lang.String getElasticIp() {
            return this.elasticIp;
        }

        @Override
        public final java.lang.Object getEphemeralBlockDevice() {
            return this.ephemeralBlockDevice;
        }

        @Override
        public final java.lang.String getHostname() {
            return this.hostname;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getInfrastructureClass() {
            return this.infrastructureClass;
        }

        @Override
        public final java.lang.Object getInstallUpdatesOnBoot() {
            return this.installUpdatesOnBoot;
        }

        @Override
        public final java.lang.String getInstanceProfileArn() {
            return this.instanceProfileArn;
        }

        @Override
        public final java.lang.String getInstanceType() {
            return this.instanceType;
        }

        @Override
        public final java.lang.String getOs() {
            return this.os;
        }

        @Override
        public final java.lang.Object getRootBlockDevice() {
            return this.rootBlockDevice;
        }

        @Override
        public final java.lang.String getRootDeviceType() {
            return this.rootDeviceType;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
        }

        @Override
        public final java.lang.String getSshKeyName() {
            return this.sshKeyName;
        }

        @Override
        public final java.lang.String getState() {
            return this.state;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        public final java.lang.String getSubnetId() {
            return this.subnetId;
        }

        @Override
        public final java.lang.String getTenancy() {
            return this.tenancy;
        }

        @Override
        public final imports.aws.opsworks_instance.OpsworksInstanceTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getVirtualizationType() {
            return this.virtualizationType;
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

            data.set("layerIds", om.valueToTree(this.getLayerIds()));
            data.set("stackId", om.valueToTree(this.getStackId()));
            if (this.getAgentVersion() != null) {
                data.set("agentVersion", om.valueToTree(this.getAgentVersion()));
            }
            if (this.getAmiId() != null) {
                data.set("amiId", om.valueToTree(this.getAmiId()));
            }
            if (this.getArchitecture() != null) {
                data.set("architecture", om.valueToTree(this.getArchitecture()));
            }
            if (this.getAutoScalingType() != null) {
                data.set("autoScalingType", om.valueToTree(this.getAutoScalingType()));
            }
            if (this.getAvailabilityZone() != null) {
                data.set("availabilityZone", om.valueToTree(this.getAvailabilityZone()));
            }
            if (this.getCreatedAt() != null) {
                data.set("createdAt", om.valueToTree(this.getCreatedAt()));
            }
            if (this.getDeleteEbs() != null) {
                data.set("deleteEbs", om.valueToTree(this.getDeleteEbs()));
            }
            if (this.getDeleteEip() != null) {
                data.set("deleteEip", om.valueToTree(this.getDeleteEip()));
            }
            if (this.getEbsBlockDevice() != null) {
                data.set("ebsBlockDevice", om.valueToTree(this.getEbsBlockDevice()));
            }
            if (this.getEbsOptimized() != null) {
                data.set("ebsOptimized", om.valueToTree(this.getEbsOptimized()));
            }
            if (this.getEcsClusterArn() != null) {
                data.set("ecsClusterArn", om.valueToTree(this.getEcsClusterArn()));
            }
            if (this.getElasticIp() != null) {
                data.set("elasticIp", om.valueToTree(this.getElasticIp()));
            }
            if (this.getEphemeralBlockDevice() != null) {
                data.set("ephemeralBlockDevice", om.valueToTree(this.getEphemeralBlockDevice()));
            }
            if (this.getHostname() != null) {
                data.set("hostname", om.valueToTree(this.getHostname()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInfrastructureClass() != null) {
                data.set("infrastructureClass", om.valueToTree(this.getInfrastructureClass()));
            }
            if (this.getInstallUpdatesOnBoot() != null) {
                data.set("installUpdatesOnBoot", om.valueToTree(this.getInstallUpdatesOnBoot()));
            }
            if (this.getInstanceProfileArn() != null) {
                data.set("instanceProfileArn", om.valueToTree(this.getInstanceProfileArn()));
            }
            if (this.getInstanceType() != null) {
                data.set("instanceType", om.valueToTree(this.getInstanceType()));
            }
            if (this.getOs() != null) {
                data.set("os", om.valueToTree(this.getOs()));
            }
            if (this.getRootBlockDevice() != null) {
                data.set("rootBlockDevice", om.valueToTree(this.getRootBlockDevice()));
            }
            if (this.getRootDeviceType() != null) {
                data.set("rootDeviceType", om.valueToTree(this.getRootDeviceType()));
            }
            if (this.getSecurityGroupIds() != null) {
                data.set("securityGroupIds", om.valueToTree(this.getSecurityGroupIds()));
            }
            if (this.getSshKeyName() != null) {
                data.set("sshKeyName", om.valueToTree(this.getSshKeyName()));
            }
            if (this.getState() != null) {
                data.set("state", om.valueToTree(this.getState()));
            }
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
            }
            if (this.getSubnetId() != null) {
                data.set("subnetId", om.valueToTree(this.getSubnetId()));
            }
            if (this.getTenancy() != null) {
                data.set("tenancy", om.valueToTree(this.getTenancy()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getVirtualizationType() != null) {
                data.set("virtualizationType", om.valueToTree(this.getVirtualizationType()));
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
            struct.set("fqn", om.valueToTree("aws.opsworksInstance.OpsworksInstanceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpsworksInstanceConfig.Jsii$Proxy that = (OpsworksInstanceConfig.Jsii$Proxy) o;

            if (!layerIds.equals(that.layerIds)) return false;
            if (!stackId.equals(that.stackId)) return false;
            if (this.agentVersion != null ? !this.agentVersion.equals(that.agentVersion) : that.agentVersion != null) return false;
            if (this.amiId != null ? !this.amiId.equals(that.amiId) : that.amiId != null) return false;
            if (this.architecture != null ? !this.architecture.equals(that.architecture) : that.architecture != null) return false;
            if (this.autoScalingType != null ? !this.autoScalingType.equals(that.autoScalingType) : that.autoScalingType != null) return false;
            if (this.availabilityZone != null ? !this.availabilityZone.equals(that.availabilityZone) : that.availabilityZone != null) return false;
            if (this.createdAt != null ? !this.createdAt.equals(that.createdAt) : that.createdAt != null) return false;
            if (this.deleteEbs != null ? !this.deleteEbs.equals(that.deleteEbs) : that.deleteEbs != null) return false;
            if (this.deleteEip != null ? !this.deleteEip.equals(that.deleteEip) : that.deleteEip != null) return false;
            if (this.ebsBlockDevice != null ? !this.ebsBlockDevice.equals(that.ebsBlockDevice) : that.ebsBlockDevice != null) return false;
            if (this.ebsOptimized != null ? !this.ebsOptimized.equals(that.ebsOptimized) : that.ebsOptimized != null) return false;
            if (this.ecsClusterArn != null ? !this.ecsClusterArn.equals(that.ecsClusterArn) : that.ecsClusterArn != null) return false;
            if (this.elasticIp != null ? !this.elasticIp.equals(that.elasticIp) : that.elasticIp != null) return false;
            if (this.ephemeralBlockDevice != null ? !this.ephemeralBlockDevice.equals(that.ephemeralBlockDevice) : that.ephemeralBlockDevice != null) return false;
            if (this.hostname != null ? !this.hostname.equals(that.hostname) : that.hostname != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.infrastructureClass != null ? !this.infrastructureClass.equals(that.infrastructureClass) : that.infrastructureClass != null) return false;
            if (this.installUpdatesOnBoot != null ? !this.installUpdatesOnBoot.equals(that.installUpdatesOnBoot) : that.installUpdatesOnBoot != null) return false;
            if (this.instanceProfileArn != null ? !this.instanceProfileArn.equals(that.instanceProfileArn) : that.instanceProfileArn != null) return false;
            if (this.instanceType != null ? !this.instanceType.equals(that.instanceType) : that.instanceType != null) return false;
            if (this.os != null ? !this.os.equals(that.os) : that.os != null) return false;
            if (this.rootBlockDevice != null ? !this.rootBlockDevice.equals(that.rootBlockDevice) : that.rootBlockDevice != null) return false;
            if (this.rootDeviceType != null ? !this.rootDeviceType.equals(that.rootDeviceType) : that.rootDeviceType != null) return false;
            if (this.securityGroupIds != null ? !this.securityGroupIds.equals(that.securityGroupIds) : that.securityGroupIds != null) return false;
            if (this.sshKeyName != null ? !this.sshKeyName.equals(that.sshKeyName) : that.sshKeyName != null) return false;
            if (this.state != null ? !this.state.equals(that.state) : that.state != null) return false;
            if (this.status != null ? !this.status.equals(that.status) : that.status != null) return false;
            if (this.subnetId != null ? !this.subnetId.equals(that.subnetId) : that.subnetId != null) return false;
            if (this.tenancy != null ? !this.tenancy.equals(that.tenancy) : that.tenancy != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.virtualizationType != null ? !this.virtualizationType.equals(that.virtualizationType) : that.virtualizationType != null) return false;
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
            int result = this.layerIds.hashCode();
            result = 31 * result + (this.stackId.hashCode());
            result = 31 * result + (this.agentVersion != null ? this.agentVersion.hashCode() : 0);
            result = 31 * result + (this.amiId != null ? this.amiId.hashCode() : 0);
            result = 31 * result + (this.architecture != null ? this.architecture.hashCode() : 0);
            result = 31 * result + (this.autoScalingType != null ? this.autoScalingType.hashCode() : 0);
            result = 31 * result + (this.availabilityZone != null ? this.availabilityZone.hashCode() : 0);
            result = 31 * result + (this.createdAt != null ? this.createdAt.hashCode() : 0);
            result = 31 * result + (this.deleteEbs != null ? this.deleteEbs.hashCode() : 0);
            result = 31 * result + (this.deleteEip != null ? this.deleteEip.hashCode() : 0);
            result = 31 * result + (this.ebsBlockDevice != null ? this.ebsBlockDevice.hashCode() : 0);
            result = 31 * result + (this.ebsOptimized != null ? this.ebsOptimized.hashCode() : 0);
            result = 31 * result + (this.ecsClusterArn != null ? this.ecsClusterArn.hashCode() : 0);
            result = 31 * result + (this.elasticIp != null ? this.elasticIp.hashCode() : 0);
            result = 31 * result + (this.ephemeralBlockDevice != null ? this.ephemeralBlockDevice.hashCode() : 0);
            result = 31 * result + (this.hostname != null ? this.hostname.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.infrastructureClass != null ? this.infrastructureClass.hashCode() : 0);
            result = 31 * result + (this.installUpdatesOnBoot != null ? this.installUpdatesOnBoot.hashCode() : 0);
            result = 31 * result + (this.instanceProfileArn != null ? this.instanceProfileArn.hashCode() : 0);
            result = 31 * result + (this.instanceType != null ? this.instanceType.hashCode() : 0);
            result = 31 * result + (this.os != null ? this.os.hashCode() : 0);
            result = 31 * result + (this.rootBlockDevice != null ? this.rootBlockDevice.hashCode() : 0);
            result = 31 * result + (this.rootDeviceType != null ? this.rootDeviceType.hashCode() : 0);
            result = 31 * result + (this.securityGroupIds != null ? this.securityGroupIds.hashCode() : 0);
            result = 31 * result + (this.sshKeyName != null ? this.sshKeyName.hashCode() : 0);
            result = 31 * result + (this.state != null ? this.state.hashCode() : 0);
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
            result = 31 * result + (this.subnetId != null ? this.subnetId.hashCode() : 0);
            result = 31 * result + (this.tenancy != null ? this.tenancy.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.virtualizationType != null ? this.virtualizationType.hashCode() : 0);
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
