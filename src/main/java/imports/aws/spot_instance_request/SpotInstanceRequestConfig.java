package imports.aws.spot_instance_request;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.488Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.spotInstanceRequest.SpotInstanceRequestConfig")
@software.amazon.jsii.Jsii.Proxy(SpotInstanceRequestConfig.Jsii$Proxy.class)
public interface SpotInstanceRequestConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ami SpotInstanceRequest#ami}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAmi() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#associate_public_ip_address SpotInstanceRequest#associate_public_ip_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAssociatePublicIpAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#availability_zone SpotInstanceRequest#availability_zone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZone() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#block_duration_minutes SpotInstanceRequest#block_duration_minutes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBlockDurationMinutes() {
        return null;
    }

    /**
     * capacity_reservation_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#capacity_reservation_specification SpotInstanceRequest#capacity_reservation_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestCapacityReservationSpecification getCapacityReservationSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#cpu_core_count SpotInstanceRequest#cpu_core_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCpuCoreCount() {
        return null;
    }

    /**
     * cpu_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#cpu_options SpotInstanceRequest#cpu_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestCpuOptions getCpuOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#cpu_threads_per_core SpotInstanceRequest#cpu_threads_per_core}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCpuThreadsPerCore() {
        return null;
    }

    /**
     * credit_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#credit_specification SpotInstanceRequest#credit_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestCreditSpecification getCreditSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#disable_api_stop SpotInstanceRequest#disable_api_stop}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisableApiStop() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#disable_api_termination SpotInstanceRequest#disable_api_termination}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisableApiTermination() {
        return null;
    }

    /**
     * ebs_block_device block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ebs_block_device SpotInstanceRequest#ebs_block_device}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEbsBlockDevice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ebs_optimized SpotInstanceRequest#ebs_optimized}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEbsOptimized() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#enable_primary_ipv6 SpotInstanceRequest#enable_primary_ipv6}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnablePrimaryIpv6() {
        return null;
    }

    /**
     * enclave_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#enclave_options SpotInstanceRequest#enclave_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestEnclaveOptions getEnclaveOptions() {
        return null;
    }

    /**
     * ephemeral_block_device block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ephemeral_block_device SpotInstanceRequest#ephemeral_block_device}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEphemeralBlockDevice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#get_password_data SpotInstanceRequest#get_password_data}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFetchPasswordData() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#hibernation SpotInstanceRequest#hibernation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHibernation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#host_id SpotInstanceRequest#host_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHostId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#host_resource_group_arn SpotInstanceRequest#host_resource_group_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHostResourceGroupArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#iam_instance_profile SpotInstanceRequest#iam_instance_profile}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIamInstanceProfile() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#id SpotInstanceRequest#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#instance_initiated_shutdown_behavior SpotInstanceRequest#instance_initiated_shutdown_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceInitiatedShutdownBehavior() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#instance_interruption_behavior SpotInstanceRequest#instance_interruption_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceInterruptionBehavior() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#instance_type SpotInstanceRequest#instance_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ipv6_address_count SpotInstanceRequest#ipv6_address_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIpv6AddressCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ipv6_addresses SpotInstanceRequest#ipv6_addresses}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpv6Addresses() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#key_name SpotInstanceRequest#key_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeyName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#launch_group SpotInstanceRequest#launch_group}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLaunchGroup() {
        return null;
    }

    /**
     * launch_template block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#launch_template SpotInstanceRequest#launch_template}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestLaunchTemplate getLaunchTemplate() {
        return null;
    }

    /**
     * maintenance_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#maintenance_options SpotInstanceRequest#maintenance_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestMaintenanceOptions getMaintenanceOptions() {
        return null;
    }

    /**
     * metadata_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#metadata_options SpotInstanceRequest#metadata_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestMetadataOptions getMetadataOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#monitoring SpotInstanceRequest#monitoring}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMonitoring() {
        return null;
    }

    /**
     * network_interface block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#network_interface SpotInstanceRequest#network_interface}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNetworkInterface() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#placement_group SpotInstanceRequest#placement_group}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPlacementGroup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#placement_partition_number SpotInstanceRequest#placement_partition_number}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPlacementPartitionNumber() {
        return null;
    }

    /**
     * private_dns_name_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#private_dns_name_options SpotInstanceRequest#private_dns_name_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestPrivateDnsNameOptions getPrivateDnsNameOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#private_ip SpotInstanceRequest#private_ip}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrivateIp() {
        return null;
    }

    /**
     * root_block_device block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#root_block_device SpotInstanceRequest#root_block_device}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestRootBlockDevice getRootBlockDevice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#secondary_private_ips SpotInstanceRequest#secondary_private_ips}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecondaryPrivateIps() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#security_groups SpotInstanceRequest#security_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#source_dest_check SpotInstanceRequest#source_dest_check}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSourceDestCheck() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#spot_price SpotInstanceRequest#spot_price}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSpotPrice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#spot_type SpotInstanceRequest#spot_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSpotType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#subnet_id SpotInstanceRequest#subnet_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubnetId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#tags SpotInstanceRequest#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#tags_all SpotInstanceRequest#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#tenancy SpotInstanceRequest#tenancy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTenancy() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#timeouts SpotInstanceRequest#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#user_data SpotInstanceRequest#user_data}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserData() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#user_data_base64 SpotInstanceRequest#user_data_base64}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserDataBase64() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#user_data_replace_on_change SpotInstanceRequest#user_data_replace_on_change}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUserDataReplaceOnChange() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#valid_from SpotInstanceRequest#valid_from}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getValidFrom() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#valid_until SpotInstanceRequest#valid_until}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getValidUntil() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#volume_tags SpotInstanceRequest#volume_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getVolumeTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#vpc_security_group_ids SpotInstanceRequest#vpc_security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcSecurityGroupIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#wait_for_fulfillment SpotInstanceRequest#wait_for_fulfillment}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getWaitForFulfillment() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SpotInstanceRequestConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SpotInstanceRequestConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SpotInstanceRequestConfig> {
        java.lang.String ami;
        java.lang.Object associatePublicIpAddress;
        java.lang.String availabilityZone;
        java.lang.Number blockDurationMinutes;
        imports.aws.spot_instance_request.SpotInstanceRequestCapacityReservationSpecification capacityReservationSpecification;
        java.lang.Number cpuCoreCount;
        imports.aws.spot_instance_request.SpotInstanceRequestCpuOptions cpuOptions;
        java.lang.Number cpuThreadsPerCore;
        imports.aws.spot_instance_request.SpotInstanceRequestCreditSpecification creditSpecification;
        java.lang.Object disableApiStop;
        java.lang.Object disableApiTermination;
        java.lang.Object ebsBlockDevice;
        java.lang.Object ebsOptimized;
        java.lang.Object enablePrimaryIpv6;
        imports.aws.spot_instance_request.SpotInstanceRequestEnclaveOptions enclaveOptions;
        java.lang.Object ephemeralBlockDevice;
        java.lang.Object fetchPasswordData;
        java.lang.Object hibernation;
        java.lang.String hostId;
        java.lang.String hostResourceGroupArn;
        java.lang.String iamInstanceProfile;
        java.lang.String id;
        java.lang.String instanceInitiatedShutdownBehavior;
        java.lang.String instanceInterruptionBehavior;
        java.lang.String instanceType;
        java.lang.Number ipv6AddressCount;
        java.util.List<java.lang.String> ipv6Addresses;
        java.lang.String keyName;
        java.lang.String launchGroup;
        imports.aws.spot_instance_request.SpotInstanceRequestLaunchTemplate launchTemplate;
        imports.aws.spot_instance_request.SpotInstanceRequestMaintenanceOptions maintenanceOptions;
        imports.aws.spot_instance_request.SpotInstanceRequestMetadataOptions metadataOptions;
        java.lang.Object monitoring;
        java.lang.Object networkInterface;
        java.lang.String placementGroup;
        java.lang.Number placementPartitionNumber;
        imports.aws.spot_instance_request.SpotInstanceRequestPrivateDnsNameOptions privateDnsNameOptions;
        java.lang.String privateIp;
        imports.aws.spot_instance_request.SpotInstanceRequestRootBlockDevice rootBlockDevice;
        java.util.List<java.lang.String> secondaryPrivateIps;
        java.util.List<java.lang.String> securityGroups;
        java.lang.Object sourceDestCheck;
        java.lang.String spotPrice;
        java.lang.String spotType;
        java.lang.String subnetId;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String tenancy;
        imports.aws.spot_instance_request.SpotInstanceRequestTimeouts timeouts;
        java.lang.String userData;
        java.lang.String userDataBase64;
        java.lang.Object userDataReplaceOnChange;
        java.lang.String validFrom;
        java.lang.String validUntil;
        java.util.Map<java.lang.String, java.lang.String> volumeTags;
        java.util.List<java.lang.String> vpcSecurityGroupIds;
        java.lang.Object waitForFulfillment;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getAmi}
         * @param ami Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ami SpotInstanceRequest#ami}.
         * @return {@code this}
         */
        public Builder ami(java.lang.String ami) {
            this.ami = ami;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getAssociatePublicIpAddress}
         * @param associatePublicIpAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#associate_public_ip_address SpotInstanceRequest#associate_public_ip_address}.
         * @return {@code this}
         */
        public Builder associatePublicIpAddress(java.lang.Boolean associatePublicIpAddress) {
            this.associatePublicIpAddress = associatePublicIpAddress;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getAssociatePublicIpAddress}
         * @param associatePublicIpAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#associate_public_ip_address SpotInstanceRequest#associate_public_ip_address}.
         * @return {@code this}
         */
        public Builder associatePublicIpAddress(com.hashicorp.cdktf.IResolvable associatePublicIpAddress) {
            this.associatePublicIpAddress = associatePublicIpAddress;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getAvailabilityZone}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#availability_zone SpotInstanceRequest#availability_zone}.
         * @return {@code this}
         */
        public Builder availabilityZone(java.lang.String availabilityZone) {
            this.availabilityZone = availabilityZone;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getBlockDurationMinutes}
         * @param blockDurationMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#block_duration_minutes SpotInstanceRequest#block_duration_minutes}.
         * @return {@code this}
         */
        public Builder blockDurationMinutes(java.lang.Number blockDurationMinutes) {
            this.blockDurationMinutes = blockDurationMinutes;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getCapacityReservationSpecification}
         * @param capacityReservationSpecification capacity_reservation_specification block.
         *                                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#capacity_reservation_specification SpotInstanceRequest#capacity_reservation_specification}
         * @return {@code this}
         */
        public Builder capacityReservationSpecification(imports.aws.spot_instance_request.SpotInstanceRequestCapacityReservationSpecification capacityReservationSpecification) {
            this.capacityReservationSpecification = capacityReservationSpecification;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getCpuCoreCount}
         * @param cpuCoreCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#cpu_core_count SpotInstanceRequest#cpu_core_count}.
         * @return {@code this}
         */
        public Builder cpuCoreCount(java.lang.Number cpuCoreCount) {
            this.cpuCoreCount = cpuCoreCount;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getCpuOptions}
         * @param cpuOptions cpu_options block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#cpu_options SpotInstanceRequest#cpu_options}
         * @return {@code this}
         */
        public Builder cpuOptions(imports.aws.spot_instance_request.SpotInstanceRequestCpuOptions cpuOptions) {
            this.cpuOptions = cpuOptions;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getCpuThreadsPerCore}
         * @param cpuThreadsPerCore Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#cpu_threads_per_core SpotInstanceRequest#cpu_threads_per_core}.
         * @return {@code this}
         */
        public Builder cpuThreadsPerCore(java.lang.Number cpuThreadsPerCore) {
            this.cpuThreadsPerCore = cpuThreadsPerCore;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getCreditSpecification}
         * @param creditSpecification credit_specification block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#credit_specification SpotInstanceRequest#credit_specification}
         * @return {@code this}
         */
        public Builder creditSpecification(imports.aws.spot_instance_request.SpotInstanceRequestCreditSpecification creditSpecification) {
            this.creditSpecification = creditSpecification;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getDisableApiStop}
         * @param disableApiStop Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#disable_api_stop SpotInstanceRequest#disable_api_stop}.
         * @return {@code this}
         */
        public Builder disableApiStop(java.lang.Boolean disableApiStop) {
            this.disableApiStop = disableApiStop;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getDisableApiStop}
         * @param disableApiStop Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#disable_api_stop SpotInstanceRequest#disable_api_stop}.
         * @return {@code this}
         */
        public Builder disableApiStop(com.hashicorp.cdktf.IResolvable disableApiStop) {
            this.disableApiStop = disableApiStop;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getDisableApiTermination}
         * @param disableApiTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#disable_api_termination SpotInstanceRequest#disable_api_termination}.
         * @return {@code this}
         */
        public Builder disableApiTermination(java.lang.Boolean disableApiTermination) {
            this.disableApiTermination = disableApiTermination;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getDisableApiTermination}
         * @param disableApiTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#disable_api_termination SpotInstanceRequest#disable_api_termination}.
         * @return {@code this}
         */
        public Builder disableApiTermination(com.hashicorp.cdktf.IResolvable disableApiTermination) {
            this.disableApiTermination = disableApiTermination;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getEbsBlockDevice}
         * @param ebsBlockDevice ebs_block_device block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ebs_block_device SpotInstanceRequest#ebs_block_device}
         * @return {@code this}
         */
        public Builder ebsBlockDevice(com.hashicorp.cdktf.IResolvable ebsBlockDevice) {
            this.ebsBlockDevice = ebsBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getEbsBlockDevice}
         * @param ebsBlockDevice ebs_block_device block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ebs_block_device SpotInstanceRequest#ebs_block_device}
         * @return {@code this}
         */
        public Builder ebsBlockDevice(java.util.List<? extends imports.aws.spot_instance_request.SpotInstanceRequestEbsBlockDevice> ebsBlockDevice) {
            this.ebsBlockDevice = ebsBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getEbsOptimized}
         * @param ebsOptimized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ebs_optimized SpotInstanceRequest#ebs_optimized}.
         * @return {@code this}
         */
        public Builder ebsOptimized(java.lang.Boolean ebsOptimized) {
            this.ebsOptimized = ebsOptimized;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getEbsOptimized}
         * @param ebsOptimized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ebs_optimized SpotInstanceRequest#ebs_optimized}.
         * @return {@code this}
         */
        public Builder ebsOptimized(com.hashicorp.cdktf.IResolvable ebsOptimized) {
            this.ebsOptimized = ebsOptimized;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getEnablePrimaryIpv6}
         * @param enablePrimaryIpv6 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#enable_primary_ipv6 SpotInstanceRequest#enable_primary_ipv6}.
         * @return {@code this}
         */
        public Builder enablePrimaryIpv6(java.lang.Boolean enablePrimaryIpv6) {
            this.enablePrimaryIpv6 = enablePrimaryIpv6;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getEnablePrimaryIpv6}
         * @param enablePrimaryIpv6 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#enable_primary_ipv6 SpotInstanceRequest#enable_primary_ipv6}.
         * @return {@code this}
         */
        public Builder enablePrimaryIpv6(com.hashicorp.cdktf.IResolvable enablePrimaryIpv6) {
            this.enablePrimaryIpv6 = enablePrimaryIpv6;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getEnclaveOptions}
         * @param enclaveOptions enclave_options block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#enclave_options SpotInstanceRequest#enclave_options}
         * @return {@code this}
         */
        public Builder enclaveOptions(imports.aws.spot_instance_request.SpotInstanceRequestEnclaveOptions enclaveOptions) {
            this.enclaveOptions = enclaveOptions;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getEphemeralBlockDevice}
         * @param ephemeralBlockDevice ephemeral_block_device block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ephemeral_block_device SpotInstanceRequest#ephemeral_block_device}
         * @return {@code this}
         */
        public Builder ephemeralBlockDevice(com.hashicorp.cdktf.IResolvable ephemeralBlockDevice) {
            this.ephemeralBlockDevice = ephemeralBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getEphemeralBlockDevice}
         * @param ephemeralBlockDevice ephemeral_block_device block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ephemeral_block_device SpotInstanceRequest#ephemeral_block_device}
         * @return {@code this}
         */
        public Builder ephemeralBlockDevice(java.util.List<? extends imports.aws.spot_instance_request.SpotInstanceRequestEphemeralBlockDevice> ephemeralBlockDevice) {
            this.ephemeralBlockDevice = ephemeralBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getFetchPasswordData}
         * @param fetchPasswordData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#get_password_data SpotInstanceRequest#get_password_data}.
         * @return {@code this}
         */
        public Builder fetchPasswordData(java.lang.Boolean fetchPasswordData) {
            this.fetchPasswordData = fetchPasswordData;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getFetchPasswordData}
         * @param fetchPasswordData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#get_password_data SpotInstanceRequest#get_password_data}.
         * @return {@code this}
         */
        public Builder fetchPasswordData(com.hashicorp.cdktf.IResolvable fetchPasswordData) {
            this.fetchPasswordData = fetchPasswordData;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getHibernation}
         * @param hibernation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#hibernation SpotInstanceRequest#hibernation}.
         * @return {@code this}
         */
        public Builder hibernation(java.lang.Boolean hibernation) {
            this.hibernation = hibernation;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getHibernation}
         * @param hibernation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#hibernation SpotInstanceRequest#hibernation}.
         * @return {@code this}
         */
        public Builder hibernation(com.hashicorp.cdktf.IResolvable hibernation) {
            this.hibernation = hibernation;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getHostId}
         * @param hostId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#host_id SpotInstanceRequest#host_id}.
         * @return {@code this}
         */
        public Builder hostId(java.lang.String hostId) {
            this.hostId = hostId;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getHostResourceGroupArn}
         * @param hostResourceGroupArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#host_resource_group_arn SpotInstanceRequest#host_resource_group_arn}.
         * @return {@code this}
         */
        public Builder hostResourceGroupArn(java.lang.String hostResourceGroupArn) {
            this.hostResourceGroupArn = hostResourceGroupArn;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getIamInstanceProfile}
         * @param iamInstanceProfile Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#iam_instance_profile SpotInstanceRequest#iam_instance_profile}.
         * @return {@code this}
         */
        public Builder iamInstanceProfile(java.lang.String iamInstanceProfile) {
            this.iamInstanceProfile = iamInstanceProfile;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#id SpotInstanceRequest#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getInstanceInitiatedShutdownBehavior}
         * @param instanceInitiatedShutdownBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#instance_initiated_shutdown_behavior SpotInstanceRequest#instance_initiated_shutdown_behavior}.
         * @return {@code this}
         */
        public Builder instanceInitiatedShutdownBehavior(java.lang.String instanceInitiatedShutdownBehavior) {
            this.instanceInitiatedShutdownBehavior = instanceInitiatedShutdownBehavior;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getInstanceInterruptionBehavior}
         * @param instanceInterruptionBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#instance_interruption_behavior SpotInstanceRequest#instance_interruption_behavior}.
         * @return {@code this}
         */
        public Builder instanceInterruptionBehavior(java.lang.String instanceInterruptionBehavior) {
            this.instanceInterruptionBehavior = instanceInterruptionBehavior;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#instance_type SpotInstanceRequest#instance_type}.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getIpv6AddressCount}
         * @param ipv6AddressCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ipv6_address_count SpotInstanceRequest#ipv6_address_count}.
         * @return {@code this}
         */
        public Builder ipv6AddressCount(java.lang.Number ipv6AddressCount) {
            this.ipv6AddressCount = ipv6AddressCount;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getIpv6Addresses}
         * @param ipv6Addresses Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ipv6_addresses SpotInstanceRequest#ipv6_addresses}.
         * @return {@code this}
         */
        public Builder ipv6Addresses(java.util.List<java.lang.String> ipv6Addresses) {
            this.ipv6Addresses = ipv6Addresses;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getKeyName}
         * @param keyName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#key_name SpotInstanceRequest#key_name}.
         * @return {@code this}
         */
        public Builder keyName(java.lang.String keyName) {
            this.keyName = keyName;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getLaunchGroup}
         * @param launchGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#launch_group SpotInstanceRequest#launch_group}.
         * @return {@code this}
         */
        public Builder launchGroup(java.lang.String launchGroup) {
            this.launchGroup = launchGroup;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getLaunchTemplate}
         * @param launchTemplate launch_template block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#launch_template SpotInstanceRequest#launch_template}
         * @return {@code this}
         */
        public Builder launchTemplate(imports.aws.spot_instance_request.SpotInstanceRequestLaunchTemplate launchTemplate) {
            this.launchTemplate = launchTemplate;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getMaintenanceOptions}
         * @param maintenanceOptions maintenance_options block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#maintenance_options SpotInstanceRequest#maintenance_options}
         * @return {@code this}
         */
        public Builder maintenanceOptions(imports.aws.spot_instance_request.SpotInstanceRequestMaintenanceOptions maintenanceOptions) {
            this.maintenanceOptions = maintenanceOptions;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getMetadataOptions}
         * @param metadataOptions metadata_options block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#metadata_options SpotInstanceRequest#metadata_options}
         * @return {@code this}
         */
        public Builder metadataOptions(imports.aws.spot_instance_request.SpotInstanceRequestMetadataOptions metadataOptions) {
            this.metadataOptions = metadataOptions;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getMonitoring}
         * @param monitoring Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#monitoring SpotInstanceRequest#monitoring}.
         * @return {@code this}
         */
        public Builder monitoring(java.lang.Boolean monitoring) {
            this.monitoring = monitoring;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getMonitoring}
         * @param monitoring Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#monitoring SpotInstanceRequest#monitoring}.
         * @return {@code this}
         */
        public Builder monitoring(com.hashicorp.cdktf.IResolvable monitoring) {
            this.monitoring = monitoring;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getNetworkInterface}
         * @param networkInterface network_interface block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#network_interface SpotInstanceRequest#network_interface}
         * @return {@code this}
         */
        public Builder networkInterface(com.hashicorp.cdktf.IResolvable networkInterface) {
            this.networkInterface = networkInterface;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getNetworkInterface}
         * @param networkInterface network_interface block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#network_interface SpotInstanceRequest#network_interface}
         * @return {@code this}
         */
        public Builder networkInterface(java.util.List<? extends imports.aws.spot_instance_request.SpotInstanceRequestNetworkInterface> networkInterface) {
            this.networkInterface = networkInterface;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getPlacementGroup}
         * @param placementGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#placement_group SpotInstanceRequest#placement_group}.
         * @return {@code this}
         */
        public Builder placementGroup(java.lang.String placementGroup) {
            this.placementGroup = placementGroup;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getPlacementPartitionNumber}
         * @param placementPartitionNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#placement_partition_number SpotInstanceRequest#placement_partition_number}.
         * @return {@code this}
         */
        public Builder placementPartitionNumber(java.lang.Number placementPartitionNumber) {
            this.placementPartitionNumber = placementPartitionNumber;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getPrivateDnsNameOptions}
         * @param privateDnsNameOptions private_dns_name_options block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#private_dns_name_options SpotInstanceRequest#private_dns_name_options}
         * @return {@code this}
         */
        public Builder privateDnsNameOptions(imports.aws.spot_instance_request.SpotInstanceRequestPrivateDnsNameOptions privateDnsNameOptions) {
            this.privateDnsNameOptions = privateDnsNameOptions;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getPrivateIp}
         * @param privateIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#private_ip SpotInstanceRequest#private_ip}.
         * @return {@code this}
         */
        public Builder privateIp(java.lang.String privateIp) {
            this.privateIp = privateIp;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getRootBlockDevice}
         * @param rootBlockDevice root_block_device block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#root_block_device SpotInstanceRequest#root_block_device}
         * @return {@code this}
         */
        public Builder rootBlockDevice(imports.aws.spot_instance_request.SpotInstanceRequestRootBlockDevice rootBlockDevice) {
            this.rootBlockDevice = rootBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getSecondaryPrivateIps}
         * @param secondaryPrivateIps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#secondary_private_ips SpotInstanceRequest#secondary_private_ips}.
         * @return {@code this}
         */
        public Builder secondaryPrivateIps(java.util.List<java.lang.String> secondaryPrivateIps) {
            this.secondaryPrivateIps = secondaryPrivateIps;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getSecurityGroups}
         * @param securityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#security_groups SpotInstanceRequest#security_groups}.
         * @return {@code this}
         */
        public Builder securityGroups(java.util.List<java.lang.String> securityGroups) {
            this.securityGroups = securityGroups;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getSourceDestCheck}
         * @param sourceDestCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#source_dest_check SpotInstanceRequest#source_dest_check}.
         * @return {@code this}
         */
        public Builder sourceDestCheck(java.lang.Boolean sourceDestCheck) {
            this.sourceDestCheck = sourceDestCheck;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getSourceDestCheck}
         * @param sourceDestCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#source_dest_check SpotInstanceRequest#source_dest_check}.
         * @return {@code this}
         */
        public Builder sourceDestCheck(com.hashicorp.cdktf.IResolvable sourceDestCheck) {
            this.sourceDestCheck = sourceDestCheck;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getSpotPrice}
         * @param spotPrice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#spot_price SpotInstanceRequest#spot_price}.
         * @return {@code this}
         */
        public Builder spotPrice(java.lang.String spotPrice) {
            this.spotPrice = spotPrice;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getSpotType}
         * @param spotType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#spot_type SpotInstanceRequest#spot_type}.
         * @return {@code this}
         */
        public Builder spotType(java.lang.String spotType) {
            this.spotType = spotType;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getSubnetId}
         * @param subnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#subnet_id SpotInstanceRequest#subnet_id}.
         * @return {@code this}
         */
        public Builder subnetId(java.lang.String subnetId) {
            this.subnetId = subnetId;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#tags SpotInstanceRequest#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#tags_all SpotInstanceRequest#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getTenancy}
         * @param tenancy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#tenancy SpotInstanceRequest#tenancy}.
         * @return {@code this}
         */
        public Builder tenancy(java.lang.String tenancy) {
            this.tenancy = tenancy;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#timeouts SpotInstanceRequest#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.spot_instance_request.SpotInstanceRequestTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getUserData}
         * @param userData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#user_data SpotInstanceRequest#user_data}.
         * @return {@code this}
         */
        public Builder userData(java.lang.String userData) {
            this.userData = userData;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getUserDataBase64}
         * @param userDataBase64 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#user_data_base64 SpotInstanceRequest#user_data_base64}.
         * @return {@code this}
         */
        public Builder userDataBase64(java.lang.String userDataBase64) {
            this.userDataBase64 = userDataBase64;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getUserDataReplaceOnChange}
         * @param userDataReplaceOnChange Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#user_data_replace_on_change SpotInstanceRequest#user_data_replace_on_change}.
         * @return {@code this}
         */
        public Builder userDataReplaceOnChange(java.lang.Boolean userDataReplaceOnChange) {
            this.userDataReplaceOnChange = userDataReplaceOnChange;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getUserDataReplaceOnChange}
         * @param userDataReplaceOnChange Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#user_data_replace_on_change SpotInstanceRequest#user_data_replace_on_change}.
         * @return {@code this}
         */
        public Builder userDataReplaceOnChange(com.hashicorp.cdktf.IResolvable userDataReplaceOnChange) {
            this.userDataReplaceOnChange = userDataReplaceOnChange;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getValidFrom}
         * @param validFrom Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#valid_from SpotInstanceRequest#valid_from}.
         * @return {@code this}
         */
        public Builder validFrom(java.lang.String validFrom) {
            this.validFrom = validFrom;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getValidUntil}
         * @param validUntil Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#valid_until SpotInstanceRequest#valid_until}.
         * @return {@code this}
         */
        public Builder validUntil(java.lang.String validUntil) {
            this.validUntil = validUntil;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getVolumeTags}
         * @param volumeTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#volume_tags SpotInstanceRequest#volume_tags}.
         * @return {@code this}
         */
        public Builder volumeTags(java.util.Map<java.lang.String, java.lang.String> volumeTags) {
            this.volumeTags = volumeTags;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getVpcSecurityGroupIds}
         * @param vpcSecurityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#vpc_security_group_ids SpotInstanceRequest#vpc_security_group_ids}.
         * @return {@code this}
         */
        public Builder vpcSecurityGroupIds(java.util.List<java.lang.String> vpcSecurityGroupIds) {
            this.vpcSecurityGroupIds = vpcSecurityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getWaitForFulfillment}
         * @param waitForFulfillment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#wait_for_fulfillment SpotInstanceRequest#wait_for_fulfillment}.
         * @return {@code this}
         */
        public Builder waitForFulfillment(java.lang.Boolean waitForFulfillment) {
            this.waitForFulfillment = waitForFulfillment;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getWaitForFulfillment}
         * @param waitForFulfillment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#wait_for_fulfillment SpotInstanceRequest#wait_for_fulfillment}.
         * @return {@code this}
         */
        public Builder waitForFulfillment(com.hashicorp.cdktf.IResolvable waitForFulfillment) {
            this.waitForFulfillment = waitForFulfillment;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getDependsOn}
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
         * Sets the value of {@link SpotInstanceRequestConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestConfig#getProvisioners}
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
         * @return a new instance of {@link SpotInstanceRequestConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SpotInstanceRequestConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SpotInstanceRequestConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SpotInstanceRequestConfig {
        private final java.lang.String ami;
        private final java.lang.Object associatePublicIpAddress;
        private final java.lang.String availabilityZone;
        private final java.lang.Number blockDurationMinutes;
        private final imports.aws.spot_instance_request.SpotInstanceRequestCapacityReservationSpecification capacityReservationSpecification;
        private final java.lang.Number cpuCoreCount;
        private final imports.aws.spot_instance_request.SpotInstanceRequestCpuOptions cpuOptions;
        private final java.lang.Number cpuThreadsPerCore;
        private final imports.aws.spot_instance_request.SpotInstanceRequestCreditSpecification creditSpecification;
        private final java.lang.Object disableApiStop;
        private final java.lang.Object disableApiTermination;
        private final java.lang.Object ebsBlockDevice;
        private final java.lang.Object ebsOptimized;
        private final java.lang.Object enablePrimaryIpv6;
        private final imports.aws.spot_instance_request.SpotInstanceRequestEnclaveOptions enclaveOptions;
        private final java.lang.Object ephemeralBlockDevice;
        private final java.lang.Object fetchPasswordData;
        private final java.lang.Object hibernation;
        private final java.lang.String hostId;
        private final java.lang.String hostResourceGroupArn;
        private final java.lang.String iamInstanceProfile;
        private final java.lang.String id;
        private final java.lang.String instanceInitiatedShutdownBehavior;
        private final java.lang.String instanceInterruptionBehavior;
        private final java.lang.String instanceType;
        private final java.lang.Number ipv6AddressCount;
        private final java.util.List<java.lang.String> ipv6Addresses;
        private final java.lang.String keyName;
        private final java.lang.String launchGroup;
        private final imports.aws.spot_instance_request.SpotInstanceRequestLaunchTemplate launchTemplate;
        private final imports.aws.spot_instance_request.SpotInstanceRequestMaintenanceOptions maintenanceOptions;
        private final imports.aws.spot_instance_request.SpotInstanceRequestMetadataOptions metadataOptions;
        private final java.lang.Object monitoring;
        private final java.lang.Object networkInterface;
        private final java.lang.String placementGroup;
        private final java.lang.Number placementPartitionNumber;
        private final imports.aws.spot_instance_request.SpotInstanceRequestPrivateDnsNameOptions privateDnsNameOptions;
        private final java.lang.String privateIp;
        private final imports.aws.spot_instance_request.SpotInstanceRequestRootBlockDevice rootBlockDevice;
        private final java.util.List<java.lang.String> secondaryPrivateIps;
        private final java.util.List<java.lang.String> securityGroups;
        private final java.lang.Object sourceDestCheck;
        private final java.lang.String spotPrice;
        private final java.lang.String spotType;
        private final java.lang.String subnetId;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String tenancy;
        private final imports.aws.spot_instance_request.SpotInstanceRequestTimeouts timeouts;
        private final java.lang.String userData;
        private final java.lang.String userDataBase64;
        private final java.lang.Object userDataReplaceOnChange;
        private final java.lang.String validFrom;
        private final java.lang.String validUntil;
        private final java.util.Map<java.lang.String, java.lang.String> volumeTags;
        private final java.util.List<java.lang.String> vpcSecurityGroupIds;
        private final java.lang.Object waitForFulfillment;
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
            this.blockDurationMinutes = software.amazon.jsii.Kernel.get(this, "blockDurationMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.capacityReservationSpecification = software.amazon.jsii.Kernel.get(this, "capacityReservationSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestCapacityReservationSpecification.class));
            this.cpuCoreCount = software.amazon.jsii.Kernel.get(this, "cpuCoreCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.cpuOptions = software.amazon.jsii.Kernel.get(this, "cpuOptions", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestCpuOptions.class));
            this.cpuThreadsPerCore = software.amazon.jsii.Kernel.get(this, "cpuThreadsPerCore", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.creditSpecification = software.amazon.jsii.Kernel.get(this, "creditSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestCreditSpecification.class));
            this.disableApiStop = software.amazon.jsii.Kernel.get(this, "disableApiStop", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.disableApiTermination = software.amazon.jsii.Kernel.get(this, "disableApiTermination", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ebsBlockDevice = software.amazon.jsii.Kernel.get(this, "ebsBlockDevice", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ebsOptimized = software.amazon.jsii.Kernel.get(this, "ebsOptimized", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enablePrimaryIpv6 = software.amazon.jsii.Kernel.get(this, "enablePrimaryIpv6", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enclaveOptions = software.amazon.jsii.Kernel.get(this, "enclaveOptions", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestEnclaveOptions.class));
            this.ephemeralBlockDevice = software.amazon.jsii.Kernel.get(this, "ephemeralBlockDevice", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.fetchPasswordData = software.amazon.jsii.Kernel.get(this, "fetchPasswordData", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.hibernation = software.amazon.jsii.Kernel.get(this, "hibernation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.hostId = software.amazon.jsii.Kernel.get(this, "hostId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hostResourceGroupArn = software.amazon.jsii.Kernel.get(this, "hostResourceGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iamInstanceProfile = software.amazon.jsii.Kernel.get(this, "iamInstanceProfile", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceInitiatedShutdownBehavior = software.amazon.jsii.Kernel.get(this, "instanceInitiatedShutdownBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceInterruptionBehavior = software.amazon.jsii.Kernel.get(this, "instanceInterruptionBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv6AddressCount = software.amazon.jsii.Kernel.get(this, "ipv6AddressCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.ipv6Addresses = software.amazon.jsii.Kernel.get(this, "ipv6Addresses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.keyName = software.amazon.jsii.Kernel.get(this, "keyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.launchGroup = software.amazon.jsii.Kernel.get(this, "launchGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.launchTemplate = software.amazon.jsii.Kernel.get(this, "launchTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestLaunchTemplate.class));
            this.maintenanceOptions = software.amazon.jsii.Kernel.get(this, "maintenanceOptions", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestMaintenanceOptions.class));
            this.metadataOptions = software.amazon.jsii.Kernel.get(this, "metadataOptions", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestMetadataOptions.class));
            this.monitoring = software.amazon.jsii.Kernel.get(this, "monitoring", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.networkInterface = software.amazon.jsii.Kernel.get(this, "networkInterface", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.placementGroup = software.amazon.jsii.Kernel.get(this, "placementGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.placementPartitionNumber = software.amazon.jsii.Kernel.get(this, "placementPartitionNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.privateDnsNameOptions = software.amazon.jsii.Kernel.get(this, "privateDnsNameOptions", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestPrivateDnsNameOptions.class));
            this.privateIp = software.amazon.jsii.Kernel.get(this, "privateIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rootBlockDevice = software.amazon.jsii.Kernel.get(this, "rootBlockDevice", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestRootBlockDevice.class));
            this.secondaryPrivateIps = software.amazon.jsii.Kernel.get(this, "secondaryPrivateIps", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.securityGroups = software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.sourceDestCheck = software.amazon.jsii.Kernel.get(this, "sourceDestCheck", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.spotPrice = software.amazon.jsii.Kernel.get(this, "spotPrice", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.spotType = software.amazon.jsii.Kernel.get(this, "spotType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subnetId = software.amazon.jsii.Kernel.get(this, "subnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tenancy = software.amazon.jsii.Kernel.get(this, "tenancy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestTimeouts.class));
            this.userData = software.amazon.jsii.Kernel.get(this, "userData", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userDataBase64 = software.amazon.jsii.Kernel.get(this, "userDataBase64", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userDataReplaceOnChange = software.amazon.jsii.Kernel.get(this, "userDataReplaceOnChange", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.validFrom = software.amazon.jsii.Kernel.get(this, "validFrom", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.validUntil = software.amazon.jsii.Kernel.get(this, "validUntil", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.volumeTags = software.amazon.jsii.Kernel.get(this, "volumeTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vpcSecurityGroupIds = software.amazon.jsii.Kernel.get(this, "vpcSecurityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.waitForFulfillment = software.amazon.jsii.Kernel.get(this, "waitForFulfillment", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.blockDurationMinutes = builder.blockDurationMinutes;
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
            this.instanceInterruptionBehavior = builder.instanceInterruptionBehavior;
            this.instanceType = builder.instanceType;
            this.ipv6AddressCount = builder.ipv6AddressCount;
            this.ipv6Addresses = builder.ipv6Addresses;
            this.keyName = builder.keyName;
            this.launchGroup = builder.launchGroup;
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
            this.spotPrice = builder.spotPrice;
            this.spotType = builder.spotType;
            this.subnetId = builder.subnetId;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.tenancy = builder.tenancy;
            this.timeouts = builder.timeouts;
            this.userData = builder.userData;
            this.userDataBase64 = builder.userDataBase64;
            this.userDataReplaceOnChange = builder.userDataReplaceOnChange;
            this.validFrom = builder.validFrom;
            this.validUntil = builder.validUntil;
            this.volumeTags = builder.volumeTags;
            this.vpcSecurityGroupIds = builder.vpcSecurityGroupIds;
            this.waitForFulfillment = builder.waitForFulfillment;
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
        public final java.lang.Number getBlockDurationMinutes() {
            return this.blockDurationMinutes;
        }

        @Override
        public final imports.aws.spot_instance_request.SpotInstanceRequestCapacityReservationSpecification getCapacityReservationSpecification() {
            return this.capacityReservationSpecification;
        }

        @Override
        public final java.lang.Number getCpuCoreCount() {
            return this.cpuCoreCount;
        }

        @Override
        public final imports.aws.spot_instance_request.SpotInstanceRequestCpuOptions getCpuOptions() {
            return this.cpuOptions;
        }

        @Override
        public final java.lang.Number getCpuThreadsPerCore() {
            return this.cpuThreadsPerCore;
        }

        @Override
        public final imports.aws.spot_instance_request.SpotInstanceRequestCreditSpecification getCreditSpecification() {
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
        public final imports.aws.spot_instance_request.SpotInstanceRequestEnclaveOptions getEnclaveOptions() {
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
        public final java.lang.String getInstanceInterruptionBehavior() {
            return this.instanceInterruptionBehavior;
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
        public final java.lang.String getLaunchGroup() {
            return this.launchGroup;
        }

        @Override
        public final imports.aws.spot_instance_request.SpotInstanceRequestLaunchTemplate getLaunchTemplate() {
            return this.launchTemplate;
        }

        @Override
        public final imports.aws.spot_instance_request.SpotInstanceRequestMaintenanceOptions getMaintenanceOptions() {
            return this.maintenanceOptions;
        }

        @Override
        public final imports.aws.spot_instance_request.SpotInstanceRequestMetadataOptions getMetadataOptions() {
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
        public final imports.aws.spot_instance_request.SpotInstanceRequestPrivateDnsNameOptions getPrivateDnsNameOptions() {
            return this.privateDnsNameOptions;
        }

        @Override
        public final java.lang.String getPrivateIp() {
            return this.privateIp;
        }

        @Override
        public final imports.aws.spot_instance_request.SpotInstanceRequestRootBlockDevice getRootBlockDevice() {
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
        public final java.lang.String getSpotPrice() {
            return this.spotPrice;
        }

        @Override
        public final java.lang.String getSpotType() {
            return this.spotType;
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
        public final imports.aws.spot_instance_request.SpotInstanceRequestTimeouts getTimeouts() {
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
        public final java.lang.String getValidFrom() {
            return this.validFrom;
        }

        @Override
        public final java.lang.String getValidUntil() {
            return this.validUntil;
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
        public final java.lang.Object getWaitForFulfillment() {
            return this.waitForFulfillment;
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
            if (this.getBlockDurationMinutes() != null) {
                data.set("blockDurationMinutes", om.valueToTree(this.getBlockDurationMinutes()));
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
            if (this.getInstanceInterruptionBehavior() != null) {
                data.set("instanceInterruptionBehavior", om.valueToTree(this.getInstanceInterruptionBehavior()));
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
            if (this.getLaunchGroup() != null) {
                data.set("launchGroup", om.valueToTree(this.getLaunchGroup()));
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
            if (this.getSpotPrice() != null) {
                data.set("spotPrice", om.valueToTree(this.getSpotPrice()));
            }
            if (this.getSpotType() != null) {
                data.set("spotType", om.valueToTree(this.getSpotType()));
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
            if (this.getValidFrom() != null) {
                data.set("validFrom", om.valueToTree(this.getValidFrom()));
            }
            if (this.getValidUntil() != null) {
                data.set("validUntil", om.valueToTree(this.getValidUntil()));
            }
            if (this.getVolumeTags() != null) {
                data.set("volumeTags", om.valueToTree(this.getVolumeTags()));
            }
            if (this.getVpcSecurityGroupIds() != null) {
                data.set("vpcSecurityGroupIds", om.valueToTree(this.getVpcSecurityGroupIds()));
            }
            if (this.getWaitForFulfillment() != null) {
                data.set("waitForFulfillment", om.valueToTree(this.getWaitForFulfillment()));
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
            struct.set("fqn", om.valueToTree("aws.spotInstanceRequest.SpotInstanceRequestConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SpotInstanceRequestConfig.Jsii$Proxy that = (SpotInstanceRequestConfig.Jsii$Proxy) o;

            if (this.ami != null ? !this.ami.equals(that.ami) : that.ami != null) return false;
            if (this.associatePublicIpAddress != null ? !this.associatePublicIpAddress.equals(that.associatePublicIpAddress) : that.associatePublicIpAddress != null) return false;
            if (this.availabilityZone != null ? !this.availabilityZone.equals(that.availabilityZone) : that.availabilityZone != null) return false;
            if (this.blockDurationMinutes != null ? !this.blockDurationMinutes.equals(that.blockDurationMinutes) : that.blockDurationMinutes != null) return false;
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
            if (this.instanceInterruptionBehavior != null ? !this.instanceInterruptionBehavior.equals(that.instanceInterruptionBehavior) : that.instanceInterruptionBehavior != null) return false;
            if (this.instanceType != null ? !this.instanceType.equals(that.instanceType) : that.instanceType != null) return false;
            if (this.ipv6AddressCount != null ? !this.ipv6AddressCount.equals(that.ipv6AddressCount) : that.ipv6AddressCount != null) return false;
            if (this.ipv6Addresses != null ? !this.ipv6Addresses.equals(that.ipv6Addresses) : that.ipv6Addresses != null) return false;
            if (this.keyName != null ? !this.keyName.equals(that.keyName) : that.keyName != null) return false;
            if (this.launchGroup != null ? !this.launchGroup.equals(that.launchGroup) : that.launchGroup != null) return false;
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
            if (this.spotPrice != null ? !this.spotPrice.equals(that.spotPrice) : that.spotPrice != null) return false;
            if (this.spotType != null ? !this.spotType.equals(that.spotType) : that.spotType != null) return false;
            if (this.subnetId != null ? !this.subnetId.equals(that.subnetId) : that.subnetId != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.tenancy != null ? !this.tenancy.equals(that.tenancy) : that.tenancy != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.userData != null ? !this.userData.equals(that.userData) : that.userData != null) return false;
            if (this.userDataBase64 != null ? !this.userDataBase64.equals(that.userDataBase64) : that.userDataBase64 != null) return false;
            if (this.userDataReplaceOnChange != null ? !this.userDataReplaceOnChange.equals(that.userDataReplaceOnChange) : that.userDataReplaceOnChange != null) return false;
            if (this.validFrom != null ? !this.validFrom.equals(that.validFrom) : that.validFrom != null) return false;
            if (this.validUntil != null ? !this.validUntil.equals(that.validUntil) : that.validUntil != null) return false;
            if (this.volumeTags != null ? !this.volumeTags.equals(that.volumeTags) : that.volumeTags != null) return false;
            if (this.vpcSecurityGroupIds != null ? !this.vpcSecurityGroupIds.equals(that.vpcSecurityGroupIds) : that.vpcSecurityGroupIds != null) return false;
            if (this.waitForFulfillment != null ? !this.waitForFulfillment.equals(that.waitForFulfillment) : that.waitForFulfillment != null) return false;
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
            result = 31 * result + (this.blockDurationMinutes != null ? this.blockDurationMinutes.hashCode() : 0);
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
            result = 31 * result + (this.instanceInterruptionBehavior != null ? this.instanceInterruptionBehavior.hashCode() : 0);
            result = 31 * result + (this.instanceType != null ? this.instanceType.hashCode() : 0);
            result = 31 * result + (this.ipv6AddressCount != null ? this.ipv6AddressCount.hashCode() : 0);
            result = 31 * result + (this.ipv6Addresses != null ? this.ipv6Addresses.hashCode() : 0);
            result = 31 * result + (this.keyName != null ? this.keyName.hashCode() : 0);
            result = 31 * result + (this.launchGroup != null ? this.launchGroup.hashCode() : 0);
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
            result = 31 * result + (this.spotPrice != null ? this.spotPrice.hashCode() : 0);
            result = 31 * result + (this.spotType != null ? this.spotType.hashCode() : 0);
            result = 31 * result + (this.subnetId != null ? this.subnetId.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.tenancy != null ? this.tenancy.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.userData != null ? this.userData.hashCode() : 0);
            result = 31 * result + (this.userDataBase64 != null ? this.userDataBase64.hashCode() : 0);
            result = 31 * result + (this.userDataReplaceOnChange != null ? this.userDataReplaceOnChange.hashCode() : 0);
            result = 31 * result + (this.validFrom != null ? this.validFrom.hashCode() : 0);
            result = 31 * result + (this.validUntil != null ? this.validUntil.hashCode() : 0);
            result = 31 * result + (this.volumeTags != null ? this.volumeTags.hashCode() : 0);
            result = 31 * result + (this.vpcSecurityGroupIds != null ? this.vpcSecurityGroupIds.hashCode() : 0);
            result = 31 * result + (this.waitForFulfillment != null ? this.waitForFulfillment.hashCode() : 0);
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
