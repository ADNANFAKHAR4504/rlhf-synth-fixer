package imports.aws.instance;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.388Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.instance.InstanceConfig")
@software.amazon.jsii.Jsii.Proxy(InstanceConfig.Jsii$Proxy.class)
public interface InstanceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ami Instance#ami}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAmi() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#associate_public_ip_address Instance#associate_public_ip_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAssociatePublicIpAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#availability_zone Instance#availability_zone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZone() {
        return null;
    }

    /**
     * capacity_reservation_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#capacity_reservation_specification Instance#capacity_reservation_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceCapacityReservationSpecification getCapacityReservationSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#cpu_core_count Instance#cpu_core_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCpuCoreCount() {
        return null;
    }

    /**
     * cpu_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#cpu_options Instance#cpu_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceCpuOptions getCpuOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#cpu_threads_per_core Instance#cpu_threads_per_core}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCpuThreadsPerCore() {
        return null;
    }

    /**
     * credit_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#credit_specification Instance#credit_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceCreditSpecification getCreditSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#disable_api_stop Instance#disable_api_stop}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisableApiStop() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#disable_api_termination Instance#disable_api_termination}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisableApiTermination() {
        return null;
    }

    /**
     * ebs_block_device block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ebs_block_device Instance#ebs_block_device}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEbsBlockDevice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ebs_optimized Instance#ebs_optimized}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEbsOptimized() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#enable_primary_ipv6 Instance#enable_primary_ipv6}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnablePrimaryIpv6() {
        return null;
    }

    /**
     * enclave_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#enclave_options Instance#enclave_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceEnclaveOptions getEnclaveOptions() {
        return null;
    }

    /**
     * ephemeral_block_device block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ephemeral_block_device Instance#ephemeral_block_device}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEphemeralBlockDevice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#get_password_data Instance#get_password_data}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFetchPasswordData() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#hibernation Instance#hibernation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHibernation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#host_id Instance#host_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHostId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#host_resource_group_arn Instance#host_resource_group_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHostResourceGroupArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#iam_instance_profile Instance#iam_instance_profile}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIamInstanceProfile() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#id Instance#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#instance_initiated_shutdown_behavior Instance#instance_initiated_shutdown_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceInitiatedShutdownBehavior() {
        return null;
    }

    /**
     * instance_market_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#instance_market_options Instance#instance_market_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceInstanceMarketOptions getInstanceMarketOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#instance_type Instance#instance_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ipv6_address_count Instance#ipv6_address_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIpv6AddressCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ipv6_addresses Instance#ipv6_addresses}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpv6Addresses() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#key_name Instance#key_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeyName() {
        return null;
    }

    /**
     * launch_template block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#launch_template Instance#launch_template}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceLaunchTemplate getLaunchTemplate() {
        return null;
    }

    /**
     * maintenance_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#maintenance_options Instance#maintenance_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceMaintenanceOptions getMaintenanceOptions() {
        return null;
    }

    /**
     * metadata_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#metadata_options Instance#metadata_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceMetadataOptions getMetadataOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#monitoring Instance#monitoring}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMonitoring() {
        return null;
    }

    /**
     * network_interface block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#network_interface Instance#network_interface}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNetworkInterface() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#placement_group Instance#placement_group}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPlacementGroup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#placement_partition_number Instance#placement_partition_number}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPlacementPartitionNumber() {
        return null;
    }

    /**
     * private_dns_name_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#private_dns_name_options Instance#private_dns_name_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.instance.InstancePrivateDnsNameOptions getPrivateDnsNameOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#private_ip Instance#private_ip}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrivateIp() {
        return null;
    }

    /**
     * root_block_device block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#root_block_device Instance#root_block_device}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceRootBlockDevice getRootBlockDevice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#secondary_private_ips Instance#secondary_private_ips}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecondaryPrivateIps() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#security_groups Instance#security_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#source_dest_check Instance#source_dest_check}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSourceDestCheck() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#subnet_id Instance#subnet_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubnetId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#tags Instance#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#tags_all Instance#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#tenancy Instance#tenancy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTenancy() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#timeouts Instance#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#user_data Instance#user_data}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserData() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#user_data_base64 Instance#user_data_base64}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserDataBase64() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#user_data_replace_on_change Instance#user_data_replace_on_change}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUserDataReplaceOnChange() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#volume_tags Instance#volume_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getVolumeTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#vpc_security_group_ids Instance#vpc_security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcSecurityGroupIds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link InstanceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link InstanceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<InstanceConfig> {
        java.lang.String ami;
        java.lang.Object associatePublicIpAddress;
        java.lang.String availabilityZone;
        imports.aws.instance.InstanceCapacityReservationSpecification capacityReservationSpecification;
        java.lang.Number cpuCoreCount;
        imports.aws.instance.InstanceCpuOptions cpuOptions;
        java.lang.Number cpuThreadsPerCore;
        imports.aws.instance.InstanceCreditSpecification creditSpecification;
        java.lang.Object disableApiStop;
        java.lang.Object disableApiTermination;
        java.lang.Object ebsBlockDevice;
        java.lang.Object ebsOptimized;
        java.lang.Object enablePrimaryIpv6;
        imports.aws.instance.InstanceEnclaveOptions enclaveOptions;
        java.lang.Object ephemeralBlockDevice;
        java.lang.Object fetchPasswordData;
        java.lang.Object hibernation;
        java.lang.String hostId;
        java.lang.String hostResourceGroupArn;
        java.lang.String iamInstanceProfile;
        java.lang.String id;
        java.lang.String instanceInitiatedShutdownBehavior;
        imports.aws.instance.InstanceInstanceMarketOptions instanceMarketOptions;
        java.lang.String instanceType;
        java.lang.Number ipv6AddressCount;
        java.util.List<java.lang.String> ipv6Addresses;
        java.lang.String keyName;
        imports.aws.instance.InstanceLaunchTemplate launchTemplate;
        imports.aws.instance.InstanceMaintenanceOptions maintenanceOptions;
        imports.aws.instance.InstanceMetadataOptions metadataOptions;
        java.lang.Object monitoring;
        java.lang.Object networkInterface;
        java.lang.String placementGroup;
        java.lang.Number placementPartitionNumber;
        imports.aws.instance.InstancePrivateDnsNameOptions privateDnsNameOptions;
        java.lang.String privateIp;
        imports.aws.instance.InstanceRootBlockDevice rootBlockDevice;
        java.util.List<java.lang.String> secondaryPrivateIps;
        java.util.List<java.lang.String> securityGroups;
        java.lang.Object sourceDestCheck;
        java.lang.String subnetId;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String tenancy;
        imports.aws.instance.InstanceTimeouts timeouts;
        java.lang.String userData;
        java.lang.String userDataBase64;
        java.lang.Object userDataReplaceOnChange;
        java.util.Map<java.lang.String, java.lang.String> volumeTags;
        java.util.List<java.lang.String> vpcSecurityGroupIds;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link InstanceConfig#getAmi}
         * @param ami Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ami Instance#ami}.
         * @return {@code this}
         */
        public Builder ami(java.lang.String ami) {
            this.ami = ami;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getAssociatePublicIpAddress}
         * @param associatePublicIpAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#associate_public_ip_address Instance#associate_public_ip_address}.
         * @return {@code this}
         */
        public Builder associatePublicIpAddress(java.lang.Boolean associatePublicIpAddress) {
            this.associatePublicIpAddress = associatePublicIpAddress;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getAssociatePublicIpAddress}
         * @param associatePublicIpAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#associate_public_ip_address Instance#associate_public_ip_address}.
         * @return {@code this}
         */
        public Builder associatePublicIpAddress(com.hashicorp.cdktf.IResolvable associatePublicIpAddress) {
            this.associatePublicIpAddress = associatePublicIpAddress;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getAvailabilityZone}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#availability_zone Instance#availability_zone}.
         * @return {@code this}
         */
        public Builder availabilityZone(java.lang.String availabilityZone) {
            this.availabilityZone = availabilityZone;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getCapacityReservationSpecification}
         * @param capacityReservationSpecification capacity_reservation_specification block.
         *                                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#capacity_reservation_specification Instance#capacity_reservation_specification}
         * @return {@code this}
         */
        public Builder capacityReservationSpecification(imports.aws.instance.InstanceCapacityReservationSpecification capacityReservationSpecification) {
            this.capacityReservationSpecification = capacityReservationSpecification;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getCpuCoreCount}
         * @param cpuCoreCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#cpu_core_count Instance#cpu_core_count}.
         * @return {@code this}
         */
        public Builder cpuCoreCount(java.lang.Number cpuCoreCount) {
            this.cpuCoreCount = cpuCoreCount;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getCpuOptions}
         * @param cpuOptions cpu_options block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#cpu_options Instance#cpu_options}
         * @return {@code this}
         */
        public Builder cpuOptions(imports.aws.instance.InstanceCpuOptions cpuOptions) {
            this.cpuOptions = cpuOptions;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getCpuThreadsPerCore}
         * @param cpuThreadsPerCore Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#cpu_threads_per_core Instance#cpu_threads_per_core}.
         * @return {@code this}
         */
        public Builder cpuThreadsPerCore(java.lang.Number cpuThreadsPerCore) {
            this.cpuThreadsPerCore = cpuThreadsPerCore;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getCreditSpecification}
         * @param creditSpecification credit_specification block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#credit_specification Instance#credit_specification}
         * @return {@code this}
         */
        public Builder creditSpecification(imports.aws.instance.InstanceCreditSpecification creditSpecification) {
            this.creditSpecification = creditSpecification;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getDisableApiStop}
         * @param disableApiStop Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#disable_api_stop Instance#disable_api_stop}.
         * @return {@code this}
         */
        public Builder disableApiStop(java.lang.Boolean disableApiStop) {
            this.disableApiStop = disableApiStop;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getDisableApiStop}
         * @param disableApiStop Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#disable_api_stop Instance#disable_api_stop}.
         * @return {@code this}
         */
        public Builder disableApiStop(com.hashicorp.cdktf.IResolvable disableApiStop) {
            this.disableApiStop = disableApiStop;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getDisableApiTermination}
         * @param disableApiTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#disable_api_termination Instance#disable_api_termination}.
         * @return {@code this}
         */
        public Builder disableApiTermination(java.lang.Boolean disableApiTermination) {
            this.disableApiTermination = disableApiTermination;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getDisableApiTermination}
         * @param disableApiTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#disable_api_termination Instance#disable_api_termination}.
         * @return {@code this}
         */
        public Builder disableApiTermination(com.hashicorp.cdktf.IResolvable disableApiTermination) {
            this.disableApiTermination = disableApiTermination;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getEbsBlockDevice}
         * @param ebsBlockDevice ebs_block_device block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ebs_block_device Instance#ebs_block_device}
         * @return {@code this}
         */
        public Builder ebsBlockDevice(com.hashicorp.cdktf.IResolvable ebsBlockDevice) {
            this.ebsBlockDevice = ebsBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getEbsBlockDevice}
         * @param ebsBlockDevice ebs_block_device block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ebs_block_device Instance#ebs_block_device}
         * @return {@code this}
         */
        public Builder ebsBlockDevice(java.util.List<? extends imports.aws.instance.InstanceEbsBlockDevice> ebsBlockDevice) {
            this.ebsBlockDevice = ebsBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getEbsOptimized}
         * @param ebsOptimized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ebs_optimized Instance#ebs_optimized}.
         * @return {@code this}
         */
        public Builder ebsOptimized(java.lang.Boolean ebsOptimized) {
            this.ebsOptimized = ebsOptimized;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getEbsOptimized}
         * @param ebsOptimized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ebs_optimized Instance#ebs_optimized}.
         * @return {@code this}
         */
        public Builder ebsOptimized(com.hashicorp.cdktf.IResolvable ebsOptimized) {
            this.ebsOptimized = ebsOptimized;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getEnablePrimaryIpv6}
         * @param enablePrimaryIpv6 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#enable_primary_ipv6 Instance#enable_primary_ipv6}.
         * @return {@code this}
         */
        public Builder enablePrimaryIpv6(java.lang.Boolean enablePrimaryIpv6) {
            this.enablePrimaryIpv6 = enablePrimaryIpv6;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getEnablePrimaryIpv6}
         * @param enablePrimaryIpv6 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#enable_primary_ipv6 Instance#enable_primary_ipv6}.
         * @return {@code this}
         */
        public Builder enablePrimaryIpv6(com.hashicorp.cdktf.IResolvable enablePrimaryIpv6) {
            this.enablePrimaryIpv6 = enablePrimaryIpv6;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getEnclaveOptions}
         * @param enclaveOptions enclave_options block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#enclave_options Instance#enclave_options}
         * @return {@code this}
         */
        public Builder enclaveOptions(imports.aws.instance.InstanceEnclaveOptions enclaveOptions) {
            this.enclaveOptions = enclaveOptions;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getEphemeralBlockDevice}
         * @param ephemeralBlockDevice ephemeral_block_device block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ephemeral_block_device Instance#ephemeral_block_device}
         * @return {@code this}
         */
        public Builder ephemeralBlockDevice(com.hashicorp.cdktf.IResolvable ephemeralBlockDevice) {
            this.ephemeralBlockDevice = ephemeralBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getEphemeralBlockDevice}
         * @param ephemeralBlockDevice ephemeral_block_device block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ephemeral_block_device Instance#ephemeral_block_device}
         * @return {@code this}
         */
        public Builder ephemeralBlockDevice(java.util.List<? extends imports.aws.instance.InstanceEphemeralBlockDevice> ephemeralBlockDevice) {
            this.ephemeralBlockDevice = ephemeralBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getFetchPasswordData}
         * @param fetchPasswordData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#get_password_data Instance#get_password_data}.
         * @return {@code this}
         */
        public Builder fetchPasswordData(java.lang.Boolean fetchPasswordData) {
            this.fetchPasswordData = fetchPasswordData;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getFetchPasswordData}
         * @param fetchPasswordData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#get_password_data Instance#get_password_data}.
         * @return {@code this}
         */
        public Builder fetchPasswordData(com.hashicorp.cdktf.IResolvable fetchPasswordData) {
            this.fetchPasswordData = fetchPasswordData;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getHibernation}
         * @param hibernation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#hibernation Instance#hibernation}.
         * @return {@code this}
         */
        public Builder hibernation(java.lang.Boolean hibernation) {
            this.hibernation = hibernation;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getHibernation}
         * @param hibernation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#hibernation Instance#hibernation}.
         * @return {@code this}
         */
        public Builder hibernation(com.hashicorp.cdktf.IResolvable hibernation) {
            this.hibernation = hibernation;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getHostId}
         * @param hostId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#host_id Instance#host_id}.
         * @return {@code this}
         */
        public Builder hostId(java.lang.String hostId) {
            this.hostId = hostId;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getHostResourceGroupArn}
         * @param hostResourceGroupArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#host_resource_group_arn Instance#host_resource_group_arn}.
         * @return {@code this}
         */
        public Builder hostResourceGroupArn(java.lang.String hostResourceGroupArn) {
            this.hostResourceGroupArn = hostResourceGroupArn;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getIamInstanceProfile}
         * @param iamInstanceProfile Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#iam_instance_profile Instance#iam_instance_profile}.
         * @return {@code this}
         */
        public Builder iamInstanceProfile(java.lang.String iamInstanceProfile) {
            this.iamInstanceProfile = iamInstanceProfile;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#id Instance#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getInstanceInitiatedShutdownBehavior}
         * @param instanceInitiatedShutdownBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#instance_initiated_shutdown_behavior Instance#instance_initiated_shutdown_behavior}.
         * @return {@code this}
         */
        public Builder instanceInitiatedShutdownBehavior(java.lang.String instanceInitiatedShutdownBehavior) {
            this.instanceInitiatedShutdownBehavior = instanceInitiatedShutdownBehavior;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getInstanceMarketOptions}
         * @param instanceMarketOptions instance_market_options block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#instance_market_options Instance#instance_market_options}
         * @return {@code this}
         */
        public Builder instanceMarketOptions(imports.aws.instance.InstanceInstanceMarketOptions instanceMarketOptions) {
            this.instanceMarketOptions = instanceMarketOptions;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#instance_type Instance#instance_type}.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getIpv6AddressCount}
         * @param ipv6AddressCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ipv6_address_count Instance#ipv6_address_count}.
         * @return {@code this}
         */
        public Builder ipv6AddressCount(java.lang.Number ipv6AddressCount) {
            this.ipv6AddressCount = ipv6AddressCount;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getIpv6Addresses}
         * @param ipv6Addresses Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ipv6_addresses Instance#ipv6_addresses}.
         * @return {@code this}
         */
        public Builder ipv6Addresses(java.util.List<java.lang.String> ipv6Addresses) {
            this.ipv6Addresses = ipv6Addresses;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getKeyName}
         * @param keyName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#key_name Instance#key_name}.
         * @return {@code this}
         */
        public Builder keyName(java.lang.String keyName) {
            this.keyName = keyName;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getLaunchTemplate}
         * @param launchTemplate launch_template block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#launch_template Instance#launch_template}
         * @return {@code this}
         */
        public Builder launchTemplate(imports.aws.instance.InstanceLaunchTemplate launchTemplate) {
            this.launchTemplate = launchTemplate;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getMaintenanceOptions}
         * @param maintenanceOptions maintenance_options block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#maintenance_options Instance#maintenance_options}
         * @return {@code this}
         */
        public Builder maintenanceOptions(imports.aws.instance.InstanceMaintenanceOptions maintenanceOptions) {
            this.maintenanceOptions = maintenanceOptions;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getMetadataOptions}
         * @param metadataOptions metadata_options block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#metadata_options Instance#metadata_options}
         * @return {@code this}
         */
        public Builder metadataOptions(imports.aws.instance.InstanceMetadataOptions metadataOptions) {
            this.metadataOptions = metadataOptions;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getMonitoring}
         * @param monitoring Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#monitoring Instance#monitoring}.
         * @return {@code this}
         */
        public Builder monitoring(java.lang.Boolean monitoring) {
            this.monitoring = monitoring;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getMonitoring}
         * @param monitoring Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#monitoring Instance#monitoring}.
         * @return {@code this}
         */
        public Builder monitoring(com.hashicorp.cdktf.IResolvable monitoring) {
            this.monitoring = monitoring;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getNetworkInterface}
         * @param networkInterface network_interface block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#network_interface Instance#network_interface}
         * @return {@code this}
         */
        public Builder networkInterface(com.hashicorp.cdktf.IResolvable networkInterface) {
            this.networkInterface = networkInterface;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getNetworkInterface}
         * @param networkInterface network_interface block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#network_interface Instance#network_interface}
         * @return {@code this}
         */
        public Builder networkInterface(java.util.List<? extends imports.aws.instance.InstanceNetworkInterface> networkInterface) {
            this.networkInterface = networkInterface;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getPlacementGroup}
         * @param placementGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#placement_group Instance#placement_group}.
         * @return {@code this}
         */
        public Builder placementGroup(java.lang.String placementGroup) {
            this.placementGroup = placementGroup;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getPlacementPartitionNumber}
         * @param placementPartitionNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#placement_partition_number Instance#placement_partition_number}.
         * @return {@code this}
         */
        public Builder placementPartitionNumber(java.lang.Number placementPartitionNumber) {
            this.placementPartitionNumber = placementPartitionNumber;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getPrivateDnsNameOptions}
         * @param privateDnsNameOptions private_dns_name_options block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#private_dns_name_options Instance#private_dns_name_options}
         * @return {@code this}
         */
        public Builder privateDnsNameOptions(imports.aws.instance.InstancePrivateDnsNameOptions privateDnsNameOptions) {
            this.privateDnsNameOptions = privateDnsNameOptions;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getPrivateIp}
         * @param privateIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#private_ip Instance#private_ip}.
         * @return {@code this}
         */
        public Builder privateIp(java.lang.String privateIp) {
            this.privateIp = privateIp;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getRootBlockDevice}
         * @param rootBlockDevice root_block_device block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#root_block_device Instance#root_block_device}
         * @return {@code this}
         */
        public Builder rootBlockDevice(imports.aws.instance.InstanceRootBlockDevice rootBlockDevice) {
            this.rootBlockDevice = rootBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getSecondaryPrivateIps}
         * @param secondaryPrivateIps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#secondary_private_ips Instance#secondary_private_ips}.
         * @return {@code this}
         */
        public Builder secondaryPrivateIps(java.util.List<java.lang.String> secondaryPrivateIps) {
            this.secondaryPrivateIps = secondaryPrivateIps;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getSecurityGroups}
         * @param securityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#security_groups Instance#security_groups}.
         * @return {@code this}
         */
        public Builder securityGroups(java.util.List<java.lang.String> securityGroups) {
            this.securityGroups = securityGroups;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getSourceDestCheck}
         * @param sourceDestCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#source_dest_check Instance#source_dest_check}.
         * @return {@code this}
         */
        public Builder sourceDestCheck(java.lang.Boolean sourceDestCheck) {
            this.sourceDestCheck = sourceDestCheck;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getSourceDestCheck}
         * @param sourceDestCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#source_dest_check Instance#source_dest_check}.
         * @return {@code this}
         */
        public Builder sourceDestCheck(com.hashicorp.cdktf.IResolvable sourceDestCheck) {
            this.sourceDestCheck = sourceDestCheck;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getSubnetId}
         * @param subnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#subnet_id Instance#subnet_id}.
         * @return {@code this}
         */
        public Builder subnetId(java.lang.String subnetId) {
            this.subnetId = subnetId;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#tags Instance#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#tags_all Instance#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getTenancy}
         * @param tenancy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#tenancy Instance#tenancy}.
         * @return {@code this}
         */
        public Builder tenancy(java.lang.String tenancy) {
            this.tenancy = tenancy;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#timeouts Instance#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.instance.InstanceTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getUserData}
         * @param userData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#user_data Instance#user_data}.
         * @return {@code this}
         */
        public Builder userData(java.lang.String userData) {
            this.userData = userData;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getUserDataBase64}
         * @param userDataBase64 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#user_data_base64 Instance#user_data_base64}.
         * @return {@code this}
         */
        public Builder userDataBase64(java.lang.String userDataBase64) {
            this.userDataBase64 = userDataBase64;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getUserDataReplaceOnChange}
         * @param userDataReplaceOnChange Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#user_data_replace_on_change Instance#user_data_replace_on_change}.
         * @return {@code this}
         */
        public Builder userDataReplaceOnChange(java.lang.Boolean userDataReplaceOnChange) {
            this.userDataReplaceOnChange = userDataReplaceOnChange;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getUserDataReplaceOnChange}
         * @param userDataReplaceOnChange Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#user_data_replace_on_change Instance#user_data_replace_on_change}.
         * @return {@code this}
         */
        public Builder userDataReplaceOnChange(com.hashicorp.cdktf.IResolvable userDataReplaceOnChange) {
            this.userDataReplaceOnChange = userDataReplaceOnChange;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getVolumeTags}
         * @param volumeTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#volume_tags Instance#volume_tags}.
         * @return {@code this}
         */
        public Builder volumeTags(java.util.Map<java.lang.String, java.lang.String> volumeTags) {
            this.volumeTags = volumeTags;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getVpcSecurityGroupIds}
         * @param vpcSecurityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#vpc_security_group_ids Instance#vpc_security_group_ids}.
         * @return {@code this}
         */
        public Builder vpcSecurityGroupIds(java.util.List<java.lang.String> vpcSecurityGroupIds) {
            this.vpcSecurityGroupIds = vpcSecurityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getDependsOn}
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
         * Sets the value of {@link InstanceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link InstanceConfig#getProvisioners}
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
         * @return a new instance of {@link InstanceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public InstanceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link InstanceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements InstanceConfig {
        private final java.lang.String ami;
        private final java.lang.Object associatePublicIpAddress;
        private final java.lang.String availabilityZone;
        private final imports.aws.instance.InstanceCapacityReservationSpecification capacityReservationSpecification;
        private final java.lang.Number cpuCoreCount;
        private final imports.aws.instance.InstanceCpuOptions cpuOptions;
        private final java.lang.Number cpuThreadsPerCore;
        private final imports.aws.instance.InstanceCreditSpecification creditSpecification;
        private final java.lang.Object disableApiStop;
        private final java.lang.Object disableApiTermination;
        private final java.lang.Object ebsBlockDevice;
        private final java.lang.Object ebsOptimized;
        private final java.lang.Object enablePrimaryIpv6;
        private final imports.aws.instance.InstanceEnclaveOptions enclaveOptions;
        private final java.lang.Object ephemeralBlockDevice;
        private final java.lang.Object fetchPasswordData;
        private final java.lang.Object hibernation;
        private final java.lang.String hostId;
        private final java.lang.String hostResourceGroupArn;
        private final java.lang.String iamInstanceProfile;
        private final java.lang.String id;
        private final java.lang.String instanceInitiatedShutdownBehavior;
        private final imports.aws.instance.InstanceInstanceMarketOptions instanceMarketOptions;
        private final java.lang.String instanceType;
        private final java.lang.Number ipv6AddressCount;
        private final java.util.List<java.lang.String> ipv6Addresses;
        private final java.lang.String keyName;
        private final imports.aws.instance.InstanceLaunchTemplate launchTemplate;
        private final imports.aws.instance.InstanceMaintenanceOptions maintenanceOptions;
        private final imports.aws.instance.InstanceMetadataOptions metadataOptions;
        private final java.lang.Object monitoring;
        private final java.lang.Object networkInterface;
        private final java.lang.String placementGroup;
        private final java.lang.Number placementPartitionNumber;
        private final imports.aws.instance.InstancePrivateDnsNameOptions privateDnsNameOptions;
        private final java.lang.String privateIp;
        private final imports.aws.instance.InstanceRootBlockDevice rootBlockDevice;
        private final java.util.List<java.lang.String> secondaryPrivateIps;
        private final java.util.List<java.lang.String> securityGroups;
        private final java.lang.Object sourceDestCheck;
        private final java.lang.String subnetId;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String tenancy;
        private final imports.aws.instance.InstanceTimeouts timeouts;
        private final java.lang.String userData;
        private final java.lang.String userDataBase64;
        private final java.lang.Object userDataReplaceOnChange;
        private final java.util.Map<java.lang.String, java.lang.String> volumeTags;
        private final java.util.List<java.lang.String> vpcSecurityGroupIds;
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
            this.ami = software.amazon.jsii.Kernel.get(this, "ami", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.associatePublicIpAddress = software.amazon.jsii.Kernel.get(this, "associatePublicIpAddress", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.availabilityZone = software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.capacityReservationSpecification = software.amazon.jsii.Kernel.get(this, "capacityReservationSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceCapacityReservationSpecification.class));
            this.cpuCoreCount = software.amazon.jsii.Kernel.get(this, "cpuCoreCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.cpuOptions = software.amazon.jsii.Kernel.get(this, "cpuOptions", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceCpuOptions.class));
            this.cpuThreadsPerCore = software.amazon.jsii.Kernel.get(this, "cpuThreadsPerCore", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.creditSpecification = software.amazon.jsii.Kernel.get(this, "creditSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceCreditSpecification.class));
            this.disableApiStop = software.amazon.jsii.Kernel.get(this, "disableApiStop", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.disableApiTermination = software.amazon.jsii.Kernel.get(this, "disableApiTermination", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ebsBlockDevice = software.amazon.jsii.Kernel.get(this, "ebsBlockDevice", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ebsOptimized = software.amazon.jsii.Kernel.get(this, "ebsOptimized", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enablePrimaryIpv6 = software.amazon.jsii.Kernel.get(this, "enablePrimaryIpv6", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enclaveOptions = software.amazon.jsii.Kernel.get(this, "enclaveOptions", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceEnclaveOptions.class));
            this.ephemeralBlockDevice = software.amazon.jsii.Kernel.get(this, "ephemeralBlockDevice", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.fetchPasswordData = software.amazon.jsii.Kernel.get(this, "fetchPasswordData", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.hibernation = software.amazon.jsii.Kernel.get(this, "hibernation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.hostId = software.amazon.jsii.Kernel.get(this, "hostId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hostResourceGroupArn = software.amazon.jsii.Kernel.get(this, "hostResourceGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iamInstanceProfile = software.amazon.jsii.Kernel.get(this, "iamInstanceProfile", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceInitiatedShutdownBehavior = software.amazon.jsii.Kernel.get(this, "instanceInitiatedShutdownBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceMarketOptions = software.amazon.jsii.Kernel.get(this, "instanceMarketOptions", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceInstanceMarketOptions.class));
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv6AddressCount = software.amazon.jsii.Kernel.get(this, "ipv6AddressCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.ipv6Addresses = software.amazon.jsii.Kernel.get(this, "ipv6Addresses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.keyName = software.amazon.jsii.Kernel.get(this, "keyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.launchTemplate = software.amazon.jsii.Kernel.get(this, "launchTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceLaunchTemplate.class));
            this.maintenanceOptions = software.amazon.jsii.Kernel.get(this, "maintenanceOptions", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceMaintenanceOptions.class));
            this.metadataOptions = software.amazon.jsii.Kernel.get(this, "metadataOptions", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceMetadataOptions.class));
            this.monitoring = software.amazon.jsii.Kernel.get(this, "monitoring", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.networkInterface = software.amazon.jsii.Kernel.get(this, "networkInterface", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.placementGroup = software.amazon.jsii.Kernel.get(this, "placementGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.placementPartitionNumber = software.amazon.jsii.Kernel.get(this, "placementPartitionNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.privateDnsNameOptions = software.amazon.jsii.Kernel.get(this, "privateDnsNameOptions", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstancePrivateDnsNameOptions.class));
            this.privateIp = software.amazon.jsii.Kernel.get(this, "privateIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rootBlockDevice = software.amazon.jsii.Kernel.get(this, "rootBlockDevice", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceRootBlockDevice.class));
            this.secondaryPrivateIps = software.amazon.jsii.Kernel.get(this, "secondaryPrivateIps", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.securityGroups = software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.sourceDestCheck = software.amazon.jsii.Kernel.get(this, "sourceDestCheck", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.subnetId = software.amazon.jsii.Kernel.get(this, "subnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tenancy = software.amazon.jsii.Kernel.get(this, "tenancy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceTimeouts.class));
            this.userData = software.amazon.jsii.Kernel.get(this, "userData", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userDataBase64 = software.amazon.jsii.Kernel.get(this, "userDataBase64", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userDataReplaceOnChange = software.amazon.jsii.Kernel.get(this, "userDataReplaceOnChange", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.volumeTags = software.amazon.jsii.Kernel.get(this, "volumeTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vpcSecurityGroupIds = software.amazon.jsii.Kernel.get(this, "vpcSecurityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.ami = builder.ami;
            this.associatePublicIpAddress = builder.associatePublicIpAddress;
            this.availabilityZone = builder.availabilityZone;
            this.capacityReservationSpecification = builder.capacityReservationSpecification;
            this.cpuCoreCount = builder.cpuCoreCount;
            this.cpuOptions = builder.cpuOptions;
            this.cpuThreadsPerCore = builder.cpuThreadsPerCore;
            this.creditSpecification = builder.creditSpecification;
            this.disableApiStop = builder.disableApiStop;
            this.disableApiTermination = builder.disableApiTermination;
            this.ebsBlockDevice = builder.ebsBlockDevice;
            this.ebsOptimized = builder.ebsOptimized;
            this.enablePrimaryIpv6 = builder.enablePrimaryIpv6;
            this.enclaveOptions = builder.enclaveOptions;
            this.ephemeralBlockDevice = builder.ephemeralBlockDevice;
            this.fetchPasswordData = builder.fetchPasswordData;
            this.hibernation = builder.hibernation;
            this.hostId = builder.hostId;
            this.hostResourceGroupArn = builder.hostResourceGroupArn;
            this.iamInstanceProfile = builder.iamInstanceProfile;
            this.id = builder.id;
            this.instanceInitiatedShutdownBehavior = builder.instanceInitiatedShutdownBehavior;
            this.instanceMarketOptions = builder.instanceMarketOptions;
            this.instanceType = builder.instanceType;
            this.ipv6AddressCount = builder.ipv6AddressCount;
            this.ipv6Addresses = builder.ipv6Addresses;
            this.keyName = builder.keyName;
            this.launchTemplate = builder.launchTemplate;
            this.maintenanceOptions = builder.maintenanceOptions;
            this.metadataOptions = builder.metadataOptions;
            this.monitoring = builder.monitoring;
            this.networkInterface = builder.networkInterface;
            this.placementGroup = builder.placementGroup;
            this.placementPartitionNumber = builder.placementPartitionNumber;
            this.privateDnsNameOptions = builder.privateDnsNameOptions;
            this.privateIp = builder.privateIp;
            this.rootBlockDevice = builder.rootBlockDevice;
            this.secondaryPrivateIps = builder.secondaryPrivateIps;
            this.securityGroups = builder.securityGroups;
            this.sourceDestCheck = builder.sourceDestCheck;
            this.subnetId = builder.subnetId;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.tenancy = builder.tenancy;
            this.timeouts = builder.timeouts;
            this.userData = builder.userData;
            this.userDataBase64 = builder.userDataBase64;
            this.userDataReplaceOnChange = builder.userDataReplaceOnChange;
            this.volumeTags = builder.volumeTags;
            this.vpcSecurityGroupIds = builder.vpcSecurityGroupIds;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAmi() {
            return this.ami;
        }

        @Override
        public final java.lang.Object getAssociatePublicIpAddress() {
            return this.associatePublicIpAddress;
        }

        @Override
        public final java.lang.String getAvailabilityZone() {
            return this.availabilityZone;
        }

        @Override
        public final imports.aws.instance.InstanceCapacityReservationSpecification getCapacityReservationSpecification() {
            return this.capacityReservationSpecification;
        }

        @Override
        public final java.lang.Number getCpuCoreCount() {
            return this.cpuCoreCount;
        }

        @Override
        public final imports.aws.instance.InstanceCpuOptions getCpuOptions() {
            return this.cpuOptions;
        }

        @Override
        public final java.lang.Number getCpuThreadsPerCore() {
            return this.cpuThreadsPerCore;
        }

        @Override
        public final imports.aws.instance.InstanceCreditSpecification getCreditSpecification() {
            return this.creditSpecification;
        }

        @Override
        public final java.lang.Object getDisableApiStop() {
            return this.disableApiStop;
        }

        @Override
        public final java.lang.Object getDisableApiTermination() {
            return this.disableApiTermination;
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
        public final java.lang.Object getEnablePrimaryIpv6() {
            return this.enablePrimaryIpv6;
        }

        @Override
        public final imports.aws.instance.InstanceEnclaveOptions getEnclaveOptions() {
            return this.enclaveOptions;
        }

        @Override
        public final java.lang.Object getEphemeralBlockDevice() {
            return this.ephemeralBlockDevice;
        }

        @Override
        public final java.lang.Object getFetchPasswordData() {
            return this.fetchPasswordData;
        }

        @Override
        public final java.lang.Object getHibernation() {
            return this.hibernation;
        }

        @Override
        public final java.lang.String getHostId() {
            return this.hostId;
        }

        @Override
        public final java.lang.String getHostResourceGroupArn() {
            return this.hostResourceGroupArn;
        }

        @Override
        public final java.lang.String getIamInstanceProfile() {
            return this.iamInstanceProfile;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getInstanceInitiatedShutdownBehavior() {
            return this.instanceInitiatedShutdownBehavior;
        }

        @Override
        public final imports.aws.instance.InstanceInstanceMarketOptions getInstanceMarketOptions() {
            return this.instanceMarketOptions;
        }

        @Override
        public final java.lang.String getInstanceType() {
            return this.instanceType;
        }

        @Override
        public final java.lang.Number getIpv6AddressCount() {
            return this.ipv6AddressCount;
        }

        @Override
        public final java.util.List<java.lang.String> getIpv6Addresses() {
            return this.ipv6Addresses;
        }

        @Override
        public final java.lang.String getKeyName() {
            return this.keyName;
        }

        @Override
        public final imports.aws.instance.InstanceLaunchTemplate getLaunchTemplate() {
            return this.launchTemplate;
        }

        @Override
        public final imports.aws.instance.InstanceMaintenanceOptions getMaintenanceOptions() {
            return this.maintenanceOptions;
        }

        @Override
        public final imports.aws.instance.InstanceMetadataOptions getMetadataOptions() {
            return this.metadataOptions;
        }

        @Override
        public final java.lang.Object getMonitoring() {
            return this.monitoring;
        }

        @Override
        public final java.lang.Object getNetworkInterface() {
            return this.networkInterface;
        }

        @Override
        public final java.lang.String getPlacementGroup() {
            return this.placementGroup;
        }

        @Override
        public final java.lang.Number getPlacementPartitionNumber() {
            return this.placementPartitionNumber;
        }

        @Override
        public final imports.aws.instance.InstancePrivateDnsNameOptions getPrivateDnsNameOptions() {
            return this.privateDnsNameOptions;
        }

        @Override
        public final java.lang.String getPrivateIp() {
            return this.privateIp;
        }

        @Override
        public final imports.aws.instance.InstanceRootBlockDevice getRootBlockDevice() {
            return this.rootBlockDevice;
        }

        @Override
        public final java.util.List<java.lang.String> getSecondaryPrivateIps() {
            return this.secondaryPrivateIps;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroups() {
            return this.securityGroups;
        }

        @Override
        public final java.lang.Object getSourceDestCheck() {
            return this.sourceDestCheck;
        }

        @Override
        public final java.lang.String getSubnetId() {
            return this.subnetId;
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
        public final java.lang.String getTenancy() {
            return this.tenancy;
        }

        @Override
        public final imports.aws.instance.InstanceTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getUserData() {
            return this.userData;
        }

        @Override
        public final java.lang.String getUserDataBase64() {
            return this.userDataBase64;
        }

        @Override
        public final java.lang.Object getUserDataReplaceOnChange() {
            return this.userDataReplaceOnChange;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getVolumeTags() {
            return this.volumeTags;
        }

        @Override
        public final java.util.List<java.lang.String> getVpcSecurityGroupIds() {
            return this.vpcSecurityGroupIds;
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

            if (this.getAmi() != null) {
                data.set("ami", om.valueToTree(this.getAmi()));
            }
            if (this.getAssociatePublicIpAddress() != null) {
                data.set("associatePublicIpAddress", om.valueToTree(this.getAssociatePublicIpAddress()));
            }
            if (this.getAvailabilityZone() != null) {
                data.set("availabilityZone", om.valueToTree(this.getAvailabilityZone()));
            }
            if (this.getCapacityReservationSpecification() != null) {
                data.set("capacityReservationSpecification", om.valueToTree(this.getCapacityReservationSpecification()));
            }
            if (this.getCpuCoreCount() != null) {
                data.set("cpuCoreCount", om.valueToTree(this.getCpuCoreCount()));
            }
            if (this.getCpuOptions() != null) {
                data.set("cpuOptions", om.valueToTree(this.getCpuOptions()));
            }
            if (this.getCpuThreadsPerCore() != null) {
                data.set("cpuThreadsPerCore", om.valueToTree(this.getCpuThreadsPerCore()));
            }
            if (this.getCreditSpecification() != null) {
                data.set("creditSpecification", om.valueToTree(this.getCreditSpecification()));
            }
            if (this.getDisableApiStop() != null) {
                data.set("disableApiStop", om.valueToTree(this.getDisableApiStop()));
            }
            if (this.getDisableApiTermination() != null) {
                data.set("disableApiTermination", om.valueToTree(this.getDisableApiTermination()));
            }
            if (this.getEbsBlockDevice() != null) {
                data.set("ebsBlockDevice", om.valueToTree(this.getEbsBlockDevice()));
            }
            if (this.getEbsOptimized() != null) {
                data.set("ebsOptimized", om.valueToTree(this.getEbsOptimized()));
            }
            if (this.getEnablePrimaryIpv6() != null) {
                data.set("enablePrimaryIpv6", om.valueToTree(this.getEnablePrimaryIpv6()));
            }
            if (this.getEnclaveOptions() != null) {
                data.set("enclaveOptions", om.valueToTree(this.getEnclaveOptions()));
            }
            if (this.getEphemeralBlockDevice() != null) {
                data.set("ephemeralBlockDevice", om.valueToTree(this.getEphemeralBlockDevice()));
            }
            if (this.getFetchPasswordData() != null) {
                data.set("fetchPasswordData", om.valueToTree(this.getFetchPasswordData()));
            }
            if (this.getHibernation() != null) {
                data.set("hibernation", om.valueToTree(this.getHibernation()));
            }
            if (this.getHostId() != null) {
                data.set("hostId", om.valueToTree(this.getHostId()));
            }
            if (this.getHostResourceGroupArn() != null) {
                data.set("hostResourceGroupArn", om.valueToTree(this.getHostResourceGroupArn()));
            }
            if (this.getIamInstanceProfile() != null) {
                data.set("iamInstanceProfile", om.valueToTree(this.getIamInstanceProfile()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInstanceInitiatedShutdownBehavior() != null) {
                data.set("instanceInitiatedShutdownBehavior", om.valueToTree(this.getInstanceInitiatedShutdownBehavior()));
            }
            if (this.getInstanceMarketOptions() != null) {
                data.set("instanceMarketOptions", om.valueToTree(this.getInstanceMarketOptions()));
            }
            if (this.getInstanceType() != null) {
                data.set("instanceType", om.valueToTree(this.getInstanceType()));
            }
            if (this.getIpv6AddressCount() != null) {
                data.set("ipv6AddressCount", om.valueToTree(this.getIpv6AddressCount()));
            }
            if (this.getIpv6Addresses() != null) {
                data.set("ipv6Addresses", om.valueToTree(this.getIpv6Addresses()));
            }
            if (this.getKeyName() != null) {
                data.set("keyName", om.valueToTree(this.getKeyName()));
            }
            if (this.getLaunchTemplate() != null) {
                data.set("launchTemplate", om.valueToTree(this.getLaunchTemplate()));
            }
            if (this.getMaintenanceOptions() != null) {
                data.set("maintenanceOptions", om.valueToTree(this.getMaintenanceOptions()));
            }
            if (this.getMetadataOptions() != null) {
                data.set("metadataOptions", om.valueToTree(this.getMetadataOptions()));
            }
            if (this.getMonitoring() != null) {
                data.set("monitoring", om.valueToTree(this.getMonitoring()));
            }
            if (this.getNetworkInterface() != null) {
                data.set("networkInterface", om.valueToTree(this.getNetworkInterface()));
            }
            if (this.getPlacementGroup() != null) {
                data.set("placementGroup", om.valueToTree(this.getPlacementGroup()));
            }
            if (this.getPlacementPartitionNumber() != null) {
                data.set("placementPartitionNumber", om.valueToTree(this.getPlacementPartitionNumber()));
            }
            if (this.getPrivateDnsNameOptions() != null) {
                data.set("privateDnsNameOptions", om.valueToTree(this.getPrivateDnsNameOptions()));
            }
            if (this.getPrivateIp() != null) {
                data.set("privateIp", om.valueToTree(this.getPrivateIp()));
            }
            if (this.getRootBlockDevice() != null) {
                data.set("rootBlockDevice", om.valueToTree(this.getRootBlockDevice()));
            }
            if (this.getSecondaryPrivateIps() != null) {
                data.set("secondaryPrivateIps", om.valueToTree(this.getSecondaryPrivateIps()));
            }
            if (this.getSecurityGroups() != null) {
                data.set("securityGroups", om.valueToTree(this.getSecurityGroups()));
            }
            if (this.getSourceDestCheck() != null) {
                data.set("sourceDestCheck", om.valueToTree(this.getSourceDestCheck()));
            }
            if (this.getSubnetId() != null) {
                data.set("subnetId", om.valueToTree(this.getSubnetId()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTenancy() != null) {
                data.set("tenancy", om.valueToTree(this.getTenancy()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getUserData() != null) {
                data.set("userData", om.valueToTree(this.getUserData()));
            }
            if (this.getUserDataBase64() != null) {
                data.set("userDataBase64", om.valueToTree(this.getUserDataBase64()));
            }
            if (this.getUserDataReplaceOnChange() != null) {
                data.set("userDataReplaceOnChange", om.valueToTree(this.getUserDataReplaceOnChange()));
            }
            if (this.getVolumeTags() != null) {
                data.set("volumeTags", om.valueToTree(this.getVolumeTags()));
            }
            if (this.getVpcSecurityGroupIds() != null) {
                data.set("vpcSecurityGroupIds", om.valueToTree(this.getVpcSecurityGroupIds()));
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
            struct.set("fqn", om.valueToTree("aws.instance.InstanceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            InstanceConfig.Jsii$Proxy that = (InstanceConfig.Jsii$Proxy) o;

            if (this.ami != null ? !this.ami.equals(that.ami) : that.ami != null) return false;
            if (this.associatePublicIpAddress != null ? !this.associatePublicIpAddress.equals(that.associatePublicIpAddress) : that.associatePublicIpAddress != null) return false;
            if (this.availabilityZone != null ? !this.availabilityZone.equals(that.availabilityZone) : that.availabilityZone != null) return false;
            if (this.capacityReservationSpecification != null ? !this.capacityReservationSpecification.equals(that.capacityReservationSpecification) : that.capacityReservationSpecification != null) return false;
            if (this.cpuCoreCount != null ? !this.cpuCoreCount.equals(that.cpuCoreCount) : that.cpuCoreCount != null) return false;
            if (this.cpuOptions != null ? !this.cpuOptions.equals(that.cpuOptions) : that.cpuOptions != null) return false;
            if (this.cpuThreadsPerCore != null ? !this.cpuThreadsPerCore.equals(that.cpuThreadsPerCore) : that.cpuThreadsPerCore != null) return false;
            if (this.creditSpecification != null ? !this.creditSpecification.equals(that.creditSpecification) : that.creditSpecification != null) return false;
            if (this.disableApiStop != null ? !this.disableApiStop.equals(that.disableApiStop) : that.disableApiStop != null) return false;
            if (this.disableApiTermination != null ? !this.disableApiTermination.equals(that.disableApiTermination) : that.disableApiTermination != null) return false;
            if (this.ebsBlockDevice != null ? !this.ebsBlockDevice.equals(that.ebsBlockDevice) : that.ebsBlockDevice != null) return false;
            if (this.ebsOptimized != null ? !this.ebsOptimized.equals(that.ebsOptimized) : that.ebsOptimized != null) return false;
            if (this.enablePrimaryIpv6 != null ? !this.enablePrimaryIpv6.equals(that.enablePrimaryIpv6) : that.enablePrimaryIpv6 != null) return false;
            if (this.enclaveOptions != null ? !this.enclaveOptions.equals(that.enclaveOptions) : that.enclaveOptions != null) return false;
            if (this.ephemeralBlockDevice != null ? !this.ephemeralBlockDevice.equals(that.ephemeralBlockDevice) : that.ephemeralBlockDevice != null) return false;
            if (this.fetchPasswordData != null ? !this.fetchPasswordData.equals(that.fetchPasswordData) : that.fetchPasswordData != null) return false;
            if (this.hibernation != null ? !this.hibernation.equals(that.hibernation) : that.hibernation != null) return false;
            if (this.hostId != null ? !this.hostId.equals(that.hostId) : that.hostId != null) return false;
            if (this.hostResourceGroupArn != null ? !this.hostResourceGroupArn.equals(that.hostResourceGroupArn) : that.hostResourceGroupArn != null) return false;
            if (this.iamInstanceProfile != null ? !this.iamInstanceProfile.equals(that.iamInstanceProfile) : that.iamInstanceProfile != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.instanceInitiatedShutdownBehavior != null ? !this.instanceInitiatedShutdownBehavior.equals(that.instanceInitiatedShutdownBehavior) : that.instanceInitiatedShutdownBehavior != null) return false;
            if (this.instanceMarketOptions != null ? !this.instanceMarketOptions.equals(that.instanceMarketOptions) : that.instanceMarketOptions != null) return false;
            if (this.instanceType != null ? !this.instanceType.equals(that.instanceType) : that.instanceType != null) return false;
            if (this.ipv6AddressCount != null ? !this.ipv6AddressCount.equals(that.ipv6AddressCount) : that.ipv6AddressCount != null) return false;
            if (this.ipv6Addresses != null ? !this.ipv6Addresses.equals(that.ipv6Addresses) : that.ipv6Addresses != null) return false;
            if (this.keyName != null ? !this.keyName.equals(that.keyName) : that.keyName != null) return false;
            if (this.launchTemplate != null ? !this.launchTemplate.equals(that.launchTemplate) : that.launchTemplate != null) return false;
            if (this.maintenanceOptions != null ? !this.maintenanceOptions.equals(that.maintenanceOptions) : that.maintenanceOptions != null) return false;
            if (this.metadataOptions != null ? !this.metadataOptions.equals(that.metadataOptions) : that.metadataOptions != null) return false;
            if (this.monitoring != null ? !this.monitoring.equals(that.monitoring) : that.monitoring != null) return false;
            if (this.networkInterface != null ? !this.networkInterface.equals(that.networkInterface) : that.networkInterface != null) return false;
            if (this.placementGroup != null ? !this.placementGroup.equals(that.placementGroup) : that.placementGroup != null) return false;
            if (this.placementPartitionNumber != null ? !this.placementPartitionNumber.equals(that.placementPartitionNumber) : that.placementPartitionNumber != null) return false;
            if (this.privateDnsNameOptions != null ? !this.privateDnsNameOptions.equals(that.privateDnsNameOptions) : that.privateDnsNameOptions != null) return false;
            if (this.privateIp != null ? !this.privateIp.equals(that.privateIp) : that.privateIp != null) return false;
            if (this.rootBlockDevice != null ? !this.rootBlockDevice.equals(that.rootBlockDevice) : that.rootBlockDevice != null) return false;
            if (this.secondaryPrivateIps != null ? !this.secondaryPrivateIps.equals(that.secondaryPrivateIps) : that.secondaryPrivateIps != null) return false;
            if (this.securityGroups != null ? !this.securityGroups.equals(that.securityGroups) : that.securityGroups != null) return false;
            if (this.sourceDestCheck != null ? !this.sourceDestCheck.equals(that.sourceDestCheck) : that.sourceDestCheck != null) return false;
            if (this.subnetId != null ? !this.subnetId.equals(that.subnetId) : that.subnetId != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.tenancy != null ? !this.tenancy.equals(that.tenancy) : that.tenancy != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.userData != null ? !this.userData.equals(that.userData) : that.userData != null) return false;
            if (this.userDataBase64 != null ? !this.userDataBase64.equals(that.userDataBase64) : that.userDataBase64 != null) return false;
            if (this.userDataReplaceOnChange != null ? !this.userDataReplaceOnChange.equals(that.userDataReplaceOnChange) : that.userDataReplaceOnChange != null) return false;
            if (this.volumeTags != null ? !this.volumeTags.equals(that.volumeTags) : that.volumeTags != null) return false;
            if (this.vpcSecurityGroupIds != null ? !this.vpcSecurityGroupIds.equals(that.vpcSecurityGroupIds) : that.vpcSecurityGroupIds != null) return false;
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
            int result = this.ami != null ? this.ami.hashCode() : 0;
            result = 31 * result + (this.associatePublicIpAddress != null ? this.associatePublicIpAddress.hashCode() : 0);
            result = 31 * result + (this.availabilityZone != null ? this.availabilityZone.hashCode() : 0);
            result = 31 * result + (this.capacityReservationSpecification != null ? this.capacityReservationSpecification.hashCode() : 0);
            result = 31 * result + (this.cpuCoreCount != null ? this.cpuCoreCount.hashCode() : 0);
            result = 31 * result + (this.cpuOptions != null ? this.cpuOptions.hashCode() : 0);
            result = 31 * result + (this.cpuThreadsPerCore != null ? this.cpuThreadsPerCore.hashCode() : 0);
            result = 31 * result + (this.creditSpecification != null ? this.creditSpecification.hashCode() : 0);
            result = 31 * result + (this.disableApiStop != null ? this.disableApiStop.hashCode() : 0);
            result = 31 * result + (this.disableApiTermination != null ? this.disableApiTermination.hashCode() : 0);
            result = 31 * result + (this.ebsBlockDevice != null ? this.ebsBlockDevice.hashCode() : 0);
            result = 31 * result + (this.ebsOptimized != null ? this.ebsOptimized.hashCode() : 0);
            result = 31 * result + (this.enablePrimaryIpv6 != null ? this.enablePrimaryIpv6.hashCode() : 0);
            result = 31 * result + (this.enclaveOptions != null ? this.enclaveOptions.hashCode() : 0);
            result = 31 * result + (this.ephemeralBlockDevice != null ? this.ephemeralBlockDevice.hashCode() : 0);
            result = 31 * result + (this.fetchPasswordData != null ? this.fetchPasswordData.hashCode() : 0);
            result = 31 * result + (this.hibernation != null ? this.hibernation.hashCode() : 0);
            result = 31 * result + (this.hostId != null ? this.hostId.hashCode() : 0);
            result = 31 * result + (this.hostResourceGroupArn != null ? this.hostResourceGroupArn.hashCode() : 0);
            result = 31 * result + (this.iamInstanceProfile != null ? this.iamInstanceProfile.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.instanceInitiatedShutdownBehavior != null ? this.instanceInitiatedShutdownBehavior.hashCode() : 0);
            result = 31 * result + (this.instanceMarketOptions != null ? this.instanceMarketOptions.hashCode() : 0);
            result = 31 * result + (this.instanceType != null ? this.instanceType.hashCode() : 0);
            result = 31 * result + (this.ipv6AddressCount != null ? this.ipv6AddressCount.hashCode() : 0);
            result = 31 * result + (this.ipv6Addresses != null ? this.ipv6Addresses.hashCode() : 0);
            result = 31 * result + (this.keyName != null ? this.keyName.hashCode() : 0);
            result = 31 * result + (this.launchTemplate != null ? this.launchTemplate.hashCode() : 0);
            result = 31 * result + (this.maintenanceOptions != null ? this.maintenanceOptions.hashCode() : 0);
            result = 31 * result + (this.metadataOptions != null ? this.metadataOptions.hashCode() : 0);
            result = 31 * result + (this.monitoring != null ? this.monitoring.hashCode() : 0);
            result = 31 * result + (this.networkInterface != null ? this.networkInterface.hashCode() : 0);
            result = 31 * result + (this.placementGroup != null ? this.placementGroup.hashCode() : 0);
            result = 31 * result + (this.placementPartitionNumber != null ? this.placementPartitionNumber.hashCode() : 0);
            result = 31 * result + (this.privateDnsNameOptions != null ? this.privateDnsNameOptions.hashCode() : 0);
            result = 31 * result + (this.privateIp != null ? this.privateIp.hashCode() : 0);
            result = 31 * result + (this.rootBlockDevice != null ? this.rootBlockDevice.hashCode() : 0);
            result = 31 * result + (this.secondaryPrivateIps != null ? this.secondaryPrivateIps.hashCode() : 0);
            result = 31 * result + (this.securityGroups != null ? this.securityGroups.hashCode() : 0);
            result = 31 * result + (this.sourceDestCheck != null ? this.sourceDestCheck.hashCode() : 0);
            result = 31 * result + (this.subnetId != null ? this.subnetId.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.tenancy != null ? this.tenancy.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.userData != null ? this.userData.hashCode() : 0);
            result = 31 * result + (this.userDataBase64 != null ? this.userDataBase64.hashCode() : 0);
            result = 31 * result + (this.userDataReplaceOnChange != null ? this.userDataReplaceOnChange.hashCode() : 0);
            result = 31 * result + (this.volumeTags != null ? this.volumeTags.hashCode() : 0);
            result = 31 * result + (this.vpcSecurityGroupIds != null ? this.vpcSecurityGroupIds.hashCode() : 0);
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
