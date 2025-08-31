package imports.aws.launch_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.515Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchTemplate.LaunchTemplateConfig")
@software.amazon.jsii.Jsii.Proxy(LaunchTemplateConfig.Jsii$Proxy.class)
public interface LaunchTemplateConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * block_device_mappings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#block_device_mappings LaunchTemplate#block_device_mappings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBlockDeviceMappings() {
        return null;
    }

    /**
     * capacity_reservation_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#capacity_reservation_specification LaunchTemplate#capacity_reservation_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateCapacityReservationSpecification getCapacityReservationSpecification() {
        return null;
    }

    /**
     * cpu_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#cpu_options LaunchTemplate#cpu_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateCpuOptions getCpuOptions() {
        return null;
    }

    /**
     * credit_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#credit_specification LaunchTemplate#credit_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateCreditSpecification getCreditSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#default_version LaunchTemplate#default_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDefaultVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#description LaunchTemplate#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#disable_api_stop LaunchTemplate#disable_api_stop}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisableApiStop() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#disable_api_termination LaunchTemplate#disable_api_termination}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisableApiTermination() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ebs_optimized LaunchTemplate#ebs_optimized}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEbsOptimized() {
        return null;
    }

    /**
     * elastic_gpu_specifications block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#elastic_gpu_specifications LaunchTemplate#elastic_gpu_specifications}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getElasticGpuSpecifications() {
        return null;
    }

    /**
     * elastic_inference_accelerator block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#elastic_inference_accelerator LaunchTemplate#elastic_inference_accelerator}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateElasticInferenceAccelerator getElasticInferenceAccelerator() {
        return null;
    }

    /**
     * enclave_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#enclave_options LaunchTemplate#enclave_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateEnclaveOptions getEnclaveOptions() {
        return null;
    }

    /**
     * hibernation_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#hibernation_options LaunchTemplate#hibernation_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateHibernationOptions getHibernationOptions() {
        return null;
    }

    /**
     * iam_instance_profile block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#iam_instance_profile LaunchTemplate#iam_instance_profile}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateIamInstanceProfile getIamInstanceProfile() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#id LaunchTemplate#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#image_id LaunchTemplate#image_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getImageId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#instance_initiated_shutdown_behavior LaunchTemplate#instance_initiated_shutdown_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceInitiatedShutdownBehavior() {
        return null;
    }

    /**
     * instance_market_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#instance_market_options LaunchTemplate#instance_market_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateInstanceMarketOptions getInstanceMarketOptions() {
        return null;
    }

    /**
     * instance_requirements block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#instance_requirements LaunchTemplate#instance_requirements}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateInstanceRequirements getInstanceRequirements() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#instance_type LaunchTemplate#instance_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#kernel_id LaunchTemplate#kernel_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKernelId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#key_name LaunchTemplate#key_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeyName() {
        return null;
    }

    /**
     * license_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#license_specification LaunchTemplate#license_specification}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLicenseSpecification() {
        return null;
    }

    /**
     * maintenance_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#maintenance_options LaunchTemplate#maintenance_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateMaintenanceOptions getMaintenanceOptions() {
        return null;
    }

    /**
     * metadata_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#metadata_options LaunchTemplate#metadata_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateMetadataOptions getMetadataOptions() {
        return null;
    }

    /**
     * monitoring block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#monitoring LaunchTemplate#monitoring}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateMonitoring getMonitoring() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#name LaunchTemplate#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#name_prefix LaunchTemplate#name_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamePrefix() {
        return null;
    }

    /**
     * network_interfaces block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#network_interfaces LaunchTemplate#network_interfaces}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNetworkInterfaces() {
        return null;
    }

    /**
     * placement block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#placement LaunchTemplate#placement}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplatePlacement getPlacement() {
        return null;
    }

    /**
     * private_dns_name_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#private_dns_name_options LaunchTemplate#private_dns_name_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplatePrivateDnsNameOptions getPrivateDnsNameOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ram_disk_id LaunchTemplate#ram_disk_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRamDiskId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#security_group_names LaunchTemplate#security_group_names}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupNames() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#tags LaunchTemplate#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#tags_all LaunchTemplate#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * tag_specifications block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#tag_specifications LaunchTemplate#tag_specifications}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTagSpecifications() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#update_default_version LaunchTemplate#update_default_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUpdateDefaultVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#user_data LaunchTemplate#user_data}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserData() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#vpc_security_group_ids LaunchTemplate#vpc_security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcSecurityGroupIds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LaunchTemplateConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LaunchTemplateConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LaunchTemplateConfig> {
        java.lang.Object blockDeviceMappings;
        imports.aws.launch_template.LaunchTemplateCapacityReservationSpecification capacityReservationSpecification;
        imports.aws.launch_template.LaunchTemplateCpuOptions cpuOptions;
        imports.aws.launch_template.LaunchTemplateCreditSpecification creditSpecification;
        java.lang.Number defaultVersion;
        java.lang.String description;
        java.lang.Object disableApiStop;
        java.lang.Object disableApiTermination;
        java.lang.String ebsOptimized;
        java.lang.Object elasticGpuSpecifications;
        imports.aws.launch_template.LaunchTemplateElasticInferenceAccelerator elasticInferenceAccelerator;
        imports.aws.launch_template.LaunchTemplateEnclaveOptions enclaveOptions;
        imports.aws.launch_template.LaunchTemplateHibernationOptions hibernationOptions;
        imports.aws.launch_template.LaunchTemplateIamInstanceProfile iamInstanceProfile;
        java.lang.String id;
        java.lang.String imageId;
        java.lang.String instanceInitiatedShutdownBehavior;
        imports.aws.launch_template.LaunchTemplateInstanceMarketOptions instanceMarketOptions;
        imports.aws.launch_template.LaunchTemplateInstanceRequirements instanceRequirements;
        java.lang.String instanceType;
        java.lang.String kernelId;
        java.lang.String keyName;
        java.lang.Object licenseSpecification;
        imports.aws.launch_template.LaunchTemplateMaintenanceOptions maintenanceOptions;
        imports.aws.launch_template.LaunchTemplateMetadataOptions metadataOptions;
        imports.aws.launch_template.LaunchTemplateMonitoring monitoring;
        java.lang.String name;
        java.lang.String namePrefix;
        java.lang.Object networkInterfaces;
        imports.aws.launch_template.LaunchTemplatePlacement placement;
        imports.aws.launch_template.LaunchTemplatePrivateDnsNameOptions privateDnsNameOptions;
        java.lang.String ramDiskId;
        java.util.List<java.lang.String> securityGroupNames;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object tagSpecifications;
        java.lang.Object updateDefaultVersion;
        java.lang.String userData;
        java.util.List<java.lang.String> vpcSecurityGroupIds;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link LaunchTemplateConfig#getBlockDeviceMappings}
         * @param blockDeviceMappings block_device_mappings block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#block_device_mappings LaunchTemplate#block_device_mappings}
         * @return {@code this}
         */
        public Builder blockDeviceMappings(com.hashicorp.cdktf.IResolvable blockDeviceMappings) {
            this.blockDeviceMappings = blockDeviceMappings;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getBlockDeviceMappings}
         * @param blockDeviceMappings block_device_mappings block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#block_device_mappings LaunchTemplate#block_device_mappings}
         * @return {@code this}
         */
        public Builder blockDeviceMappings(java.util.List<? extends imports.aws.launch_template.LaunchTemplateBlockDeviceMappings> blockDeviceMappings) {
            this.blockDeviceMappings = blockDeviceMappings;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getCapacityReservationSpecification}
         * @param capacityReservationSpecification capacity_reservation_specification block.
         *                                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#capacity_reservation_specification LaunchTemplate#capacity_reservation_specification}
         * @return {@code this}
         */
        public Builder capacityReservationSpecification(imports.aws.launch_template.LaunchTemplateCapacityReservationSpecification capacityReservationSpecification) {
            this.capacityReservationSpecification = capacityReservationSpecification;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getCpuOptions}
         * @param cpuOptions cpu_options block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#cpu_options LaunchTemplate#cpu_options}
         * @return {@code this}
         */
        public Builder cpuOptions(imports.aws.launch_template.LaunchTemplateCpuOptions cpuOptions) {
            this.cpuOptions = cpuOptions;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getCreditSpecification}
         * @param creditSpecification credit_specification block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#credit_specification LaunchTemplate#credit_specification}
         * @return {@code this}
         */
        public Builder creditSpecification(imports.aws.launch_template.LaunchTemplateCreditSpecification creditSpecification) {
            this.creditSpecification = creditSpecification;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getDefaultVersion}
         * @param defaultVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#default_version LaunchTemplate#default_version}.
         * @return {@code this}
         */
        public Builder defaultVersion(java.lang.Number defaultVersion) {
            this.defaultVersion = defaultVersion;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#description LaunchTemplate#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getDisableApiStop}
         * @param disableApiStop Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#disable_api_stop LaunchTemplate#disable_api_stop}.
         * @return {@code this}
         */
        public Builder disableApiStop(java.lang.Boolean disableApiStop) {
            this.disableApiStop = disableApiStop;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getDisableApiStop}
         * @param disableApiStop Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#disable_api_stop LaunchTemplate#disable_api_stop}.
         * @return {@code this}
         */
        public Builder disableApiStop(com.hashicorp.cdktf.IResolvable disableApiStop) {
            this.disableApiStop = disableApiStop;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getDisableApiTermination}
         * @param disableApiTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#disable_api_termination LaunchTemplate#disable_api_termination}.
         * @return {@code this}
         */
        public Builder disableApiTermination(java.lang.Boolean disableApiTermination) {
            this.disableApiTermination = disableApiTermination;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getDisableApiTermination}
         * @param disableApiTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#disable_api_termination LaunchTemplate#disable_api_termination}.
         * @return {@code this}
         */
        public Builder disableApiTermination(com.hashicorp.cdktf.IResolvable disableApiTermination) {
            this.disableApiTermination = disableApiTermination;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getEbsOptimized}
         * @param ebsOptimized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ebs_optimized LaunchTemplate#ebs_optimized}.
         * @return {@code this}
         */
        public Builder ebsOptimized(java.lang.String ebsOptimized) {
            this.ebsOptimized = ebsOptimized;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getElasticGpuSpecifications}
         * @param elasticGpuSpecifications elastic_gpu_specifications block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#elastic_gpu_specifications LaunchTemplate#elastic_gpu_specifications}
         * @return {@code this}
         */
        public Builder elasticGpuSpecifications(com.hashicorp.cdktf.IResolvable elasticGpuSpecifications) {
            this.elasticGpuSpecifications = elasticGpuSpecifications;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getElasticGpuSpecifications}
         * @param elasticGpuSpecifications elastic_gpu_specifications block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#elastic_gpu_specifications LaunchTemplate#elastic_gpu_specifications}
         * @return {@code this}
         */
        public Builder elasticGpuSpecifications(java.util.List<? extends imports.aws.launch_template.LaunchTemplateElasticGpuSpecifications> elasticGpuSpecifications) {
            this.elasticGpuSpecifications = elasticGpuSpecifications;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getElasticInferenceAccelerator}
         * @param elasticInferenceAccelerator elastic_inference_accelerator block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#elastic_inference_accelerator LaunchTemplate#elastic_inference_accelerator}
         * @return {@code this}
         */
        public Builder elasticInferenceAccelerator(imports.aws.launch_template.LaunchTemplateElasticInferenceAccelerator elasticInferenceAccelerator) {
            this.elasticInferenceAccelerator = elasticInferenceAccelerator;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getEnclaveOptions}
         * @param enclaveOptions enclave_options block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#enclave_options LaunchTemplate#enclave_options}
         * @return {@code this}
         */
        public Builder enclaveOptions(imports.aws.launch_template.LaunchTemplateEnclaveOptions enclaveOptions) {
            this.enclaveOptions = enclaveOptions;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getHibernationOptions}
         * @param hibernationOptions hibernation_options block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#hibernation_options LaunchTemplate#hibernation_options}
         * @return {@code this}
         */
        public Builder hibernationOptions(imports.aws.launch_template.LaunchTemplateHibernationOptions hibernationOptions) {
            this.hibernationOptions = hibernationOptions;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getIamInstanceProfile}
         * @param iamInstanceProfile iam_instance_profile block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#iam_instance_profile LaunchTemplate#iam_instance_profile}
         * @return {@code this}
         */
        public Builder iamInstanceProfile(imports.aws.launch_template.LaunchTemplateIamInstanceProfile iamInstanceProfile) {
            this.iamInstanceProfile = iamInstanceProfile;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#id LaunchTemplate#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getImageId}
         * @param imageId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#image_id LaunchTemplate#image_id}.
         * @return {@code this}
         */
        public Builder imageId(java.lang.String imageId) {
            this.imageId = imageId;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getInstanceInitiatedShutdownBehavior}
         * @param instanceInitiatedShutdownBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#instance_initiated_shutdown_behavior LaunchTemplate#instance_initiated_shutdown_behavior}.
         * @return {@code this}
         */
        public Builder instanceInitiatedShutdownBehavior(java.lang.String instanceInitiatedShutdownBehavior) {
            this.instanceInitiatedShutdownBehavior = instanceInitiatedShutdownBehavior;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getInstanceMarketOptions}
         * @param instanceMarketOptions instance_market_options block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#instance_market_options LaunchTemplate#instance_market_options}
         * @return {@code this}
         */
        public Builder instanceMarketOptions(imports.aws.launch_template.LaunchTemplateInstanceMarketOptions instanceMarketOptions) {
            this.instanceMarketOptions = instanceMarketOptions;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getInstanceRequirements}
         * @param instanceRequirements instance_requirements block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#instance_requirements LaunchTemplate#instance_requirements}
         * @return {@code this}
         */
        public Builder instanceRequirements(imports.aws.launch_template.LaunchTemplateInstanceRequirements instanceRequirements) {
            this.instanceRequirements = instanceRequirements;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#instance_type LaunchTemplate#instance_type}.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getKernelId}
         * @param kernelId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#kernel_id LaunchTemplate#kernel_id}.
         * @return {@code this}
         */
        public Builder kernelId(java.lang.String kernelId) {
            this.kernelId = kernelId;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getKeyName}
         * @param keyName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#key_name LaunchTemplate#key_name}.
         * @return {@code this}
         */
        public Builder keyName(java.lang.String keyName) {
            this.keyName = keyName;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getLicenseSpecification}
         * @param licenseSpecification license_specification block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#license_specification LaunchTemplate#license_specification}
         * @return {@code this}
         */
        public Builder licenseSpecification(com.hashicorp.cdktf.IResolvable licenseSpecification) {
            this.licenseSpecification = licenseSpecification;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getLicenseSpecification}
         * @param licenseSpecification license_specification block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#license_specification LaunchTemplate#license_specification}
         * @return {@code this}
         */
        public Builder licenseSpecification(java.util.List<? extends imports.aws.launch_template.LaunchTemplateLicenseSpecification> licenseSpecification) {
            this.licenseSpecification = licenseSpecification;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getMaintenanceOptions}
         * @param maintenanceOptions maintenance_options block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#maintenance_options LaunchTemplate#maintenance_options}
         * @return {@code this}
         */
        public Builder maintenanceOptions(imports.aws.launch_template.LaunchTemplateMaintenanceOptions maintenanceOptions) {
            this.maintenanceOptions = maintenanceOptions;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getMetadataOptions}
         * @param metadataOptions metadata_options block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#metadata_options LaunchTemplate#metadata_options}
         * @return {@code this}
         */
        public Builder metadataOptions(imports.aws.launch_template.LaunchTemplateMetadataOptions metadataOptions) {
            this.metadataOptions = metadataOptions;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getMonitoring}
         * @param monitoring monitoring block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#monitoring LaunchTemplate#monitoring}
         * @return {@code this}
         */
        public Builder monitoring(imports.aws.launch_template.LaunchTemplateMonitoring monitoring) {
            this.monitoring = monitoring;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#name LaunchTemplate#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getNamePrefix}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#name_prefix LaunchTemplate#name_prefix}.
         * @return {@code this}
         */
        public Builder namePrefix(java.lang.String namePrefix) {
            this.namePrefix = namePrefix;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getNetworkInterfaces}
         * @param networkInterfaces network_interfaces block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#network_interfaces LaunchTemplate#network_interfaces}
         * @return {@code this}
         */
        public Builder networkInterfaces(com.hashicorp.cdktf.IResolvable networkInterfaces) {
            this.networkInterfaces = networkInterfaces;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getNetworkInterfaces}
         * @param networkInterfaces network_interfaces block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#network_interfaces LaunchTemplate#network_interfaces}
         * @return {@code this}
         */
        public Builder networkInterfaces(java.util.List<? extends imports.aws.launch_template.LaunchTemplateNetworkInterfaces> networkInterfaces) {
            this.networkInterfaces = networkInterfaces;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getPlacement}
         * @param placement placement block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#placement LaunchTemplate#placement}
         * @return {@code this}
         */
        public Builder placement(imports.aws.launch_template.LaunchTemplatePlacement placement) {
            this.placement = placement;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getPrivateDnsNameOptions}
         * @param privateDnsNameOptions private_dns_name_options block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#private_dns_name_options LaunchTemplate#private_dns_name_options}
         * @return {@code this}
         */
        public Builder privateDnsNameOptions(imports.aws.launch_template.LaunchTemplatePrivateDnsNameOptions privateDnsNameOptions) {
            this.privateDnsNameOptions = privateDnsNameOptions;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getRamDiskId}
         * @param ramDiskId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ram_disk_id LaunchTemplate#ram_disk_id}.
         * @return {@code this}
         */
        public Builder ramDiskId(java.lang.String ramDiskId) {
            this.ramDiskId = ramDiskId;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getSecurityGroupNames}
         * @param securityGroupNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#security_group_names LaunchTemplate#security_group_names}.
         * @return {@code this}
         */
        public Builder securityGroupNames(java.util.List<java.lang.String> securityGroupNames) {
            this.securityGroupNames = securityGroupNames;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#tags LaunchTemplate#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#tags_all LaunchTemplate#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getTagSpecifications}
         * @param tagSpecifications tag_specifications block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#tag_specifications LaunchTemplate#tag_specifications}
         * @return {@code this}
         */
        public Builder tagSpecifications(com.hashicorp.cdktf.IResolvable tagSpecifications) {
            this.tagSpecifications = tagSpecifications;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getTagSpecifications}
         * @param tagSpecifications tag_specifications block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#tag_specifications LaunchTemplate#tag_specifications}
         * @return {@code this}
         */
        public Builder tagSpecifications(java.util.List<? extends imports.aws.launch_template.LaunchTemplateTagSpecifications> tagSpecifications) {
            this.tagSpecifications = tagSpecifications;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getUpdateDefaultVersion}
         * @param updateDefaultVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#update_default_version LaunchTemplate#update_default_version}.
         * @return {@code this}
         */
        public Builder updateDefaultVersion(java.lang.Boolean updateDefaultVersion) {
            this.updateDefaultVersion = updateDefaultVersion;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getUpdateDefaultVersion}
         * @param updateDefaultVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#update_default_version LaunchTemplate#update_default_version}.
         * @return {@code this}
         */
        public Builder updateDefaultVersion(com.hashicorp.cdktf.IResolvable updateDefaultVersion) {
            this.updateDefaultVersion = updateDefaultVersion;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getUserData}
         * @param userData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#user_data LaunchTemplate#user_data}.
         * @return {@code this}
         */
        public Builder userData(java.lang.String userData) {
            this.userData = userData;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getVpcSecurityGroupIds}
         * @param vpcSecurityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#vpc_security_group_ids LaunchTemplate#vpc_security_group_ids}.
         * @return {@code this}
         */
        public Builder vpcSecurityGroupIds(java.util.List<java.lang.String> vpcSecurityGroupIds) {
            this.vpcSecurityGroupIds = vpcSecurityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getDependsOn}
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
         * Sets the value of {@link LaunchTemplateConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateConfig#getProvisioners}
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
         * @return a new instance of {@link LaunchTemplateConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LaunchTemplateConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LaunchTemplateConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LaunchTemplateConfig {
        private final java.lang.Object blockDeviceMappings;
        private final imports.aws.launch_template.LaunchTemplateCapacityReservationSpecification capacityReservationSpecification;
        private final imports.aws.launch_template.LaunchTemplateCpuOptions cpuOptions;
        private final imports.aws.launch_template.LaunchTemplateCreditSpecification creditSpecification;
        private final java.lang.Number defaultVersion;
        private final java.lang.String description;
        private final java.lang.Object disableApiStop;
        private final java.lang.Object disableApiTermination;
        private final java.lang.String ebsOptimized;
        private final java.lang.Object elasticGpuSpecifications;
        private final imports.aws.launch_template.LaunchTemplateElasticInferenceAccelerator elasticInferenceAccelerator;
        private final imports.aws.launch_template.LaunchTemplateEnclaveOptions enclaveOptions;
        private final imports.aws.launch_template.LaunchTemplateHibernationOptions hibernationOptions;
        private final imports.aws.launch_template.LaunchTemplateIamInstanceProfile iamInstanceProfile;
        private final java.lang.String id;
        private final java.lang.String imageId;
        private final java.lang.String instanceInitiatedShutdownBehavior;
        private final imports.aws.launch_template.LaunchTemplateInstanceMarketOptions instanceMarketOptions;
        private final imports.aws.launch_template.LaunchTemplateInstanceRequirements instanceRequirements;
        private final java.lang.String instanceType;
        private final java.lang.String kernelId;
        private final java.lang.String keyName;
        private final java.lang.Object licenseSpecification;
        private final imports.aws.launch_template.LaunchTemplateMaintenanceOptions maintenanceOptions;
        private final imports.aws.launch_template.LaunchTemplateMetadataOptions metadataOptions;
        private final imports.aws.launch_template.LaunchTemplateMonitoring monitoring;
        private final java.lang.String name;
        private final java.lang.String namePrefix;
        private final java.lang.Object networkInterfaces;
        private final imports.aws.launch_template.LaunchTemplatePlacement placement;
        private final imports.aws.launch_template.LaunchTemplatePrivateDnsNameOptions privateDnsNameOptions;
        private final java.lang.String ramDiskId;
        private final java.util.List<java.lang.String> securityGroupNames;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Object tagSpecifications;
        private final java.lang.Object updateDefaultVersion;
        private final java.lang.String userData;
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
            this.blockDeviceMappings = software.amazon.jsii.Kernel.get(this, "blockDeviceMappings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.capacityReservationSpecification = software.amazon.jsii.Kernel.get(this, "capacityReservationSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateCapacityReservationSpecification.class));
            this.cpuOptions = software.amazon.jsii.Kernel.get(this, "cpuOptions", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateCpuOptions.class));
            this.creditSpecification = software.amazon.jsii.Kernel.get(this, "creditSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateCreditSpecification.class));
            this.defaultVersion = software.amazon.jsii.Kernel.get(this, "defaultVersion", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.disableApiStop = software.amazon.jsii.Kernel.get(this, "disableApiStop", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.disableApiTermination = software.amazon.jsii.Kernel.get(this, "disableApiTermination", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ebsOptimized = software.amazon.jsii.Kernel.get(this, "ebsOptimized", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.elasticGpuSpecifications = software.amazon.jsii.Kernel.get(this, "elasticGpuSpecifications", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.elasticInferenceAccelerator = software.amazon.jsii.Kernel.get(this, "elasticInferenceAccelerator", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateElasticInferenceAccelerator.class));
            this.enclaveOptions = software.amazon.jsii.Kernel.get(this, "enclaveOptions", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateEnclaveOptions.class));
            this.hibernationOptions = software.amazon.jsii.Kernel.get(this, "hibernationOptions", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateHibernationOptions.class));
            this.iamInstanceProfile = software.amazon.jsii.Kernel.get(this, "iamInstanceProfile", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateIamInstanceProfile.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.imageId = software.amazon.jsii.Kernel.get(this, "imageId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceInitiatedShutdownBehavior = software.amazon.jsii.Kernel.get(this, "instanceInitiatedShutdownBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceMarketOptions = software.amazon.jsii.Kernel.get(this, "instanceMarketOptions", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateInstanceMarketOptions.class));
            this.instanceRequirements = software.amazon.jsii.Kernel.get(this, "instanceRequirements", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateInstanceRequirements.class));
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kernelId = software.amazon.jsii.Kernel.get(this, "kernelId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyName = software.amazon.jsii.Kernel.get(this, "keyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.licenseSpecification = software.amazon.jsii.Kernel.get(this, "licenseSpecification", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.maintenanceOptions = software.amazon.jsii.Kernel.get(this, "maintenanceOptions", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateMaintenanceOptions.class));
            this.metadataOptions = software.amazon.jsii.Kernel.get(this, "metadataOptions", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateMetadataOptions.class));
            this.monitoring = software.amazon.jsii.Kernel.get(this, "monitoring", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateMonitoring.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.namePrefix = software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.networkInterfaces = software.amazon.jsii.Kernel.get(this, "networkInterfaces", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.placement = software.amazon.jsii.Kernel.get(this, "placement", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplatePlacement.class));
            this.privateDnsNameOptions = software.amazon.jsii.Kernel.get(this, "privateDnsNameOptions", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplatePrivateDnsNameOptions.class));
            this.ramDiskId = software.amazon.jsii.Kernel.get(this, "ramDiskId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityGroupNames = software.amazon.jsii.Kernel.get(this, "securityGroupNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagSpecifications = software.amazon.jsii.Kernel.get(this, "tagSpecifications", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.updateDefaultVersion = software.amazon.jsii.Kernel.get(this, "updateDefaultVersion", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.userData = software.amazon.jsii.Kernel.get(this, "userData", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.blockDeviceMappings = builder.blockDeviceMappings;
            this.capacityReservationSpecification = builder.capacityReservationSpecification;
            this.cpuOptions = builder.cpuOptions;
            this.creditSpecification = builder.creditSpecification;
            this.defaultVersion = builder.defaultVersion;
            this.description = builder.description;
            this.disableApiStop = builder.disableApiStop;
            this.disableApiTermination = builder.disableApiTermination;
            this.ebsOptimized = builder.ebsOptimized;
            this.elasticGpuSpecifications = builder.elasticGpuSpecifications;
            this.elasticInferenceAccelerator = builder.elasticInferenceAccelerator;
            this.enclaveOptions = builder.enclaveOptions;
            this.hibernationOptions = builder.hibernationOptions;
            this.iamInstanceProfile = builder.iamInstanceProfile;
            this.id = builder.id;
            this.imageId = builder.imageId;
            this.instanceInitiatedShutdownBehavior = builder.instanceInitiatedShutdownBehavior;
            this.instanceMarketOptions = builder.instanceMarketOptions;
            this.instanceRequirements = builder.instanceRequirements;
            this.instanceType = builder.instanceType;
            this.kernelId = builder.kernelId;
            this.keyName = builder.keyName;
            this.licenseSpecification = builder.licenseSpecification;
            this.maintenanceOptions = builder.maintenanceOptions;
            this.metadataOptions = builder.metadataOptions;
            this.monitoring = builder.monitoring;
            this.name = builder.name;
            this.namePrefix = builder.namePrefix;
            this.networkInterfaces = builder.networkInterfaces;
            this.placement = builder.placement;
            this.privateDnsNameOptions = builder.privateDnsNameOptions;
            this.ramDiskId = builder.ramDiskId;
            this.securityGroupNames = builder.securityGroupNames;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.tagSpecifications = builder.tagSpecifications;
            this.updateDefaultVersion = builder.updateDefaultVersion;
            this.userData = builder.userData;
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
        public final java.lang.Object getBlockDeviceMappings() {
            return this.blockDeviceMappings;
        }

        @Override
        public final imports.aws.launch_template.LaunchTemplateCapacityReservationSpecification getCapacityReservationSpecification() {
            return this.capacityReservationSpecification;
        }

        @Override
        public final imports.aws.launch_template.LaunchTemplateCpuOptions getCpuOptions() {
            return this.cpuOptions;
        }

        @Override
        public final imports.aws.launch_template.LaunchTemplateCreditSpecification getCreditSpecification() {
            return this.creditSpecification;
        }

        @Override
        public final java.lang.Number getDefaultVersion() {
            return this.defaultVersion;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
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
        public final java.lang.String getEbsOptimized() {
            return this.ebsOptimized;
        }

        @Override
        public final java.lang.Object getElasticGpuSpecifications() {
            return this.elasticGpuSpecifications;
        }

        @Override
        public final imports.aws.launch_template.LaunchTemplateElasticInferenceAccelerator getElasticInferenceAccelerator() {
            return this.elasticInferenceAccelerator;
        }

        @Override
        public final imports.aws.launch_template.LaunchTemplateEnclaveOptions getEnclaveOptions() {
            return this.enclaveOptions;
        }

        @Override
        public final imports.aws.launch_template.LaunchTemplateHibernationOptions getHibernationOptions() {
            return this.hibernationOptions;
        }

        @Override
        public final imports.aws.launch_template.LaunchTemplateIamInstanceProfile getIamInstanceProfile() {
            return this.iamInstanceProfile;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getImageId() {
            return this.imageId;
        }

        @Override
        public final java.lang.String getInstanceInitiatedShutdownBehavior() {
            return this.instanceInitiatedShutdownBehavior;
        }

        @Override
        public final imports.aws.launch_template.LaunchTemplateInstanceMarketOptions getInstanceMarketOptions() {
            return this.instanceMarketOptions;
        }

        @Override
        public final imports.aws.launch_template.LaunchTemplateInstanceRequirements getInstanceRequirements() {
            return this.instanceRequirements;
        }

        @Override
        public final java.lang.String getInstanceType() {
            return this.instanceType;
        }

        @Override
        public final java.lang.String getKernelId() {
            return this.kernelId;
        }

        @Override
        public final java.lang.String getKeyName() {
            return this.keyName;
        }

        @Override
        public final java.lang.Object getLicenseSpecification() {
            return this.licenseSpecification;
        }

        @Override
        public final imports.aws.launch_template.LaunchTemplateMaintenanceOptions getMaintenanceOptions() {
            return this.maintenanceOptions;
        }

        @Override
        public final imports.aws.launch_template.LaunchTemplateMetadataOptions getMetadataOptions() {
            return this.metadataOptions;
        }

        @Override
        public final imports.aws.launch_template.LaunchTemplateMonitoring getMonitoring() {
            return this.monitoring;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getNamePrefix() {
            return this.namePrefix;
        }

        @Override
        public final java.lang.Object getNetworkInterfaces() {
            return this.networkInterfaces;
        }

        @Override
        public final imports.aws.launch_template.LaunchTemplatePlacement getPlacement() {
            return this.placement;
        }

        @Override
        public final imports.aws.launch_template.LaunchTemplatePrivateDnsNameOptions getPrivateDnsNameOptions() {
            return this.privateDnsNameOptions;
        }

        @Override
        public final java.lang.String getRamDiskId() {
            return this.ramDiskId;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupNames() {
            return this.securityGroupNames;
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
        public final java.lang.Object getTagSpecifications() {
            return this.tagSpecifications;
        }

        @Override
        public final java.lang.Object getUpdateDefaultVersion() {
            return this.updateDefaultVersion;
        }

        @Override
        public final java.lang.String getUserData() {
            return this.userData;
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

            if (this.getBlockDeviceMappings() != null) {
                data.set("blockDeviceMappings", om.valueToTree(this.getBlockDeviceMappings()));
            }
            if (this.getCapacityReservationSpecification() != null) {
                data.set("capacityReservationSpecification", om.valueToTree(this.getCapacityReservationSpecification()));
            }
            if (this.getCpuOptions() != null) {
                data.set("cpuOptions", om.valueToTree(this.getCpuOptions()));
            }
            if (this.getCreditSpecification() != null) {
                data.set("creditSpecification", om.valueToTree(this.getCreditSpecification()));
            }
            if (this.getDefaultVersion() != null) {
                data.set("defaultVersion", om.valueToTree(this.getDefaultVersion()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDisableApiStop() != null) {
                data.set("disableApiStop", om.valueToTree(this.getDisableApiStop()));
            }
            if (this.getDisableApiTermination() != null) {
                data.set("disableApiTermination", om.valueToTree(this.getDisableApiTermination()));
            }
            if (this.getEbsOptimized() != null) {
                data.set("ebsOptimized", om.valueToTree(this.getEbsOptimized()));
            }
            if (this.getElasticGpuSpecifications() != null) {
                data.set("elasticGpuSpecifications", om.valueToTree(this.getElasticGpuSpecifications()));
            }
            if (this.getElasticInferenceAccelerator() != null) {
                data.set("elasticInferenceAccelerator", om.valueToTree(this.getElasticInferenceAccelerator()));
            }
            if (this.getEnclaveOptions() != null) {
                data.set("enclaveOptions", om.valueToTree(this.getEnclaveOptions()));
            }
            if (this.getHibernationOptions() != null) {
                data.set("hibernationOptions", om.valueToTree(this.getHibernationOptions()));
            }
            if (this.getIamInstanceProfile() != null) {
                data.set("iamInstanceProfile", om.valueToTree(this.getIamInstanceProfile()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getImageId() != null) {
                data.set("imageId", om.valueToTree(this.getImageId()));
            }
            if (this.getInstanceInitiatedShutdownBehavior() != null) {
                data.set("instanceInitiatedShutdownBehavior", om.valueToTree(this.getInstanceInitiatedShutdownBehavior()));
            }
            if (this.getInstanceMarketOptions() != null) {
                data.set("instanceMarketOptions", om.valueToTree(this.getInstanceMarketOptions()));
            }
            if (this.getInstanceRequirements() != null) {
                data.set("instanceRequirements", om.valueToTree(this.getInstanceRequirements()));
            }
            if (this.getInstanceType() != null) {
                data.set("instanceType", om.valueToTree(this.getInstanceType()));
            }
            if (this.getKernelId() != null) {
                data.set("kernelId", om.valueToTree(this.getKernelId()));
            }
            if (this.getKeyName() != null) {
                data.set("keyName", om.valueToTree(this.getKeyName()));
            }
            if (this.getLicenseSpecification() != null) {
                data.set("licenseSpecification", om.valueToTree(this.getLicenseSpecification()));
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
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getNamePrefix() != null) {
                data.set("namePrefix", om.valueToTree(this.getNamePrefix()));
            }
            if (this.getNetworkInterfaces() != null) {
                data.set("networkInterfaces", om.valueToTree(this.getNetworkInterfaces()));
            }
            if (this.getPlacement() != null) {
                data.set("placement", om.valueToTree(this.getPlacement()));
            }
            if (this.getPrivateDnsNameOptions() != null) {
                data.set("privateDnsNameOptions", om.valueToTree(this.getPrivateDnsNameOptions()));
            }
            if (this.getRamDiskId() != null) {
                data.set("ramDiskId", om.valueToTree(this.getRamDiskId()));
            }
            if (this.getSecurityGroupNames() != null) {
                data.set("securityGroupNames", om.valueToTree(this.getSecurityGroupNames()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTagSpecifications() != null) {
                data.set("tagSpecifications", om.valueToTree(this.getTagSpecifications()));
            }
            if (this.getUpdateDefaultVersion() != null) {
                data.set("updateDefaultVersion", om.valueToTree(this.getUpdateDefaultVersion()));
            }
            if (this.getUserData() != null) {
                data.set("userData", om.valueToTree(this.getUserData()));
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
            struct.set("fqn", om.valueToTree("aws.launchTemplate.LaunchTemplateConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LaunchTemplateConfig.Jsii$Proxy that = (LaunchTemplateConfig.Jsii$Proxy) o;

            if (this.blockDeviceMappings != null ? !this.blockDeviceMappings.equals(that.blockDeviceMappings) : that.blockDeviceMappings != null) return false;
            if (this.capacityReservationSpecification != null ? !this.capacityReservationSpecification.equals(that.capacityReservationSpecification) : that.capacityReservationSpecification != null) return false;
            if (this.cpuOptions != null ? !this.cpuOptions.equals(that.cpuOptions) : that.cpuOptions != null) return false;
            if (this.creditSpecification != null ? !this.creditSpecification.equals(that.creditSpecification) : that.creditSpecification != null) return false;
            if (this.defaultVersion != null ? !this.defaultVersion.equals(that.defaultVersion) : that.defaultVersion != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.disableApiStop != null ? !this.disableApiStop.equals(that.disableApiStop) : that.disableApiStop != null) return false;
            if (this.disableApiTermination != null ? !this.disableApiTermination.equals(that.disableApiTermination) : that.disableApiTermination != null) return false;
            if (this.ebsOptimized != null ? !this.ebsOptimized.equals(that.ebsOptimized) : that.ebsOptimized != null) return false;
            if (this.elasticGpuSpecifications != null ? !this.elasticGpuSpecifications.equals(that.elasticGpuSpecifications) : that.elasticGpuSpecifications != null) return false;
            if (this.elasticInferenceAccelerator != null ? !this.elasticInferenceAccelerator.equals(that.elasticInferenceAccelerator) : that.elasticInferenceAccelerator != null) return false;
            if (this.enclaveOptions != null ? !this.enclaveOptions.equals(that.enclaveOptions) : that.enclaveOptions != null) return false;
            if (this.hibernationOptions != null ? !this.hibernationOptions.equals(that.hibernationOptions) : that.hibernationOptions != null) return false;
            if (this.iamInstanceProfile != null ? !this.iamInstanceProfile.equals(that.iamInstanceProfile) : that.iamInstanceProfile != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.imageId != null ? !this.imageId.equals(that.imageId) : that.imageId != null) return false;
            if (this.instanceInitiatedShutdownBehavior != null ? !this.instanceInitiatedShutdownBehavior.equals(that.instanceInitiatedShutdownBehavior) : that.instanceInitiatedShutdownBehavior != null) return false;
            if (this.instanceMarketOptions != null ? !this.instanceMarketOptions.equals(that.instanceMarketOptions) : that.instanceMarketOptions != null) return false;
            if (this.instanceRequirements != null ? !this.instanceRequirements.equals(that.instanceRequirements) : that.instanceRequirements != null) return false;
            if (this.instanceType != null ? !this.instanceType.equals(that.instanceType) : that.instanceType != null) return false;
            if (this.kernelId != null ? !this.kernelId.equals(that.kernelId) : that.kernelId != null) return false;
            if (this.keyName != null ? !this.keyName.equals(that.keyName) : that.keyName != null) return false;
            if (this.licenseSpecification != null ? !this.licenseSpecification.equals(that.licenseSpecification) : that.licenseSpecification != null) return false;
            if (this.maintenanceOptions != null ? !this.maintenanceOptions.equals(that.maintenanceOptions) : that.maintenanceOptions != null) return false;
            if (this.metadataOptions != null ? !this.metadataOptions.equals(that.metadataOptions) : that.metadataOptions != null) return false;
            if (this.monitoring != null ? !this.monitoring.equals(that.monitoring) : that.monitoring != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.namePrefix != null ? !this.namePrefix.equals(that.namePrefix) : that.namePrefix != null) return false;
            if (this.networkInterfaces != null ? !this.networkInterfaces.equals(that.networkInterfaces) : that.networkInterfaces != null) return false;
            if (this.placement != null ? !this.placement.equals(that.placement) : that.placement != null) return false;
            if (this.privateDnsNameOptions != null ? !this.privateDnsNameOptions.equals(that.privateDnsNameOptions) : that.privateDnsNameOptions != null) return false;
            if (this.ramDiskId != null ? !this.ramDiskId.equals(that.ramDiskId) : that.ramDiskId != null) return false;
            if (this.securityGroupNames != null ? !this.securityGroupNames.equals(that.securityGroupNames) : that.securityGroupNames != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.tagSpecifications != null ? !this.tagSpecifications.equals(that.tagSpecifications) : that.tagSpecifications != null) return false;
            if (this.updateDefaultVersion != null ? !this.updateDefaultVersion.equals(that.updateDefaultVersion) : that.updateDefaultVersion != null) return false;
            if (this.userData != null ? !this.userData.equals(that.userData) : that.userData != null) return false;
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
            int result = this.blockDeviceMappings != null ? this.blockDeviceMappings.hashCode() : 0;
            result = 31 * result + (this.capacityReservationSpecification != null ? this.capacityReservationSpecification.hashCode() : 0);
            result = 31 * result + (this.cpuOptions != null ? this.cpuOptions.hashCode() : 0);
            result = 31 * result + (this.creditSpecification != null ? this.creditSpecification.hashCode() : 0);
            result = 31 * result + (this.defaultVersion != null ? this.defaultVersion.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.disableApiStop != null ? this.disableApiStop.hashCode() : 0);
            result = 31 * result + (this.disableApiTermination != null ? this.disableApiTermination.hashCode() : 0);
            result = 31 * result + (this.ebsOptimized != null ? this.ebsOptimized.hashCode() : 0);
            result = 31 * result + (this.elasticGpuSpecifications != null ? this.elasticGpuSpecifications.hashCode() : 0);
            result = 31 * result + (this.elasticInferenceAccelerator != null ? this.elasticInferenceAccelerator.hashCode() : 0);
            result = 31 * result + (this.enclaveOptions != null ? this.enclaveOptions.hashCode() : 0);
            result = 31 * result + (this.hibernationOptions != null ? this.hibernationOptions.hashCode() : 0);
            result = 31 * result + (this.iamInstanceProfile != null ? this.iamInstanceProfile.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.imageId != null ? this.imageId.hashCode() : 0);
            result = 31 * result + (this.instanceInitiatedShutdownBehavior != null ? this.instanceInitiatedShutdownBehavior.hashCode() : 0);
            result = 31 * result + (this.instanceMarketOptions != null ? this.instanceMarketOptions.hashCode() : 0);
            result = 31 * result + (this.instanceRequirements != null ? this.instanceRequirements.hashCode() : 0);
            result = 31 * result + (this.instanceType != null ? this.instanceType.hashCode() : 0);
            result = 31 * result + (this.kernelId != null ? this.kernelId.hashCode() : 0);
            result = 31 * result + (this.keyName != null ? this.keyName.hashCode() : 0);
            result = 31 * result + (this.licenseSpecification != null ? this.licenseSpecification.hashCode() : 0);
            result = 31 * result + (this.maintenanceOptions != null ? this.maintenanceOptions.hashCode() : 0);
            result = 31 * result + (this.metadataOptions != null ? this.metadataOptions.hashCode() : 0);
            result = 31 * result + (this.monitoring != null ? this.monitoring.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.namePrefix != null ? this.namePrefix.hashCode() : 0);
            result = 31 * result + (this.networkInterfaces != null ? this.networkInterfaces.hashCode() : 0);
            result = 31 * result + (this.placement != null ? this.placement.hashCode() : 0);
            result = 31 * result + (this.privateDnsNameOptions != null ? this.privateDnsNameOptions.hashCode() : 0);
            result = 31 * result + (this.ramDiskId != null ? this.ramDiskId.hashCode() : 0);
            result = 31 * result + (this.securityGroupNames != null ? this.securityGroupNames.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.tagSpecifications != null ? this.tagSpecifications.hashCode() : 0);
            result = 31 * result + (this.updateDefaultVersion != null ? this.updateDefaultVersion.hashCode() : 0);
            result = 31 * result + (this.userData != null ? this.userData.hashCode() : 0);
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
