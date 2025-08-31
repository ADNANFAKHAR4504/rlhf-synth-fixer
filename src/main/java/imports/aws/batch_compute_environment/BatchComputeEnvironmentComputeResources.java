package imports.aws.batch_compute_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.128Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchComputeEnvironment.BatchComputeEnvironmentComputeResources")
@software.amazon.jsii.Jsii.Proxy(BatchComputeEnvironmentComputeResources.Jsii$Proxy.class)
public interface BatchComputeEnvironmentComputeResources extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#max_vcpus BatchComputeEnvironment#max_vcpus}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxVcpus();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#subnets BatchComputeEnvironment#subnets}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnets();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#type BatchComputeEnvironment#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#allocation_strategy BatchComputeEnvironment#allocation_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAllocationStrategy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#bid_percentage BatchComputeEnvironment#bid_percentage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBidPercentage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#desired_vcpus BatchComputeEnvironment#desired_vcpus}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDesiredVcpus() {
        return null;
    }

    /**
     * ec2_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#ec2_configuration BatchComputeEnvironment#ec2_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEc2Configuration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#ec2_key_pair BatchComputeEnvironment#ec2_key_pair}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEc2KeyPair() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#image_id BatchComputeEnvironment#image_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getImageId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#instance_role BatchComputeEnvironment#instance_role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceRole() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#instance_type BatchComputeEnvironment#instance_type}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInstanceType() {
        return null;
    }

    /**
     * launch_template block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#launch_template BatchComputeEnvironment#launch_template}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResourcesLaunchTemplate getLaunchTemplate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#min_vcpus BatchComputeEnvironment#min_vcpus}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinVcpus() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#placement_group BatchComputeEnvironment#placement_group}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPlacementGroup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#security_group_ids BatchComputeEnvironment#security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#spot_iam_fleet_role BatchComputeEnvironment#spot_iam_fleet_role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSpotIamFleetRole() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#tags BatchComputeEnvironment#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BatchComputeEnvironmentComputeResources}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchComputeEnvironmentComputeResources}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchComputeEnvironmentComputeResources> {
        java.lang.Number maxVcpus;
        java.util.List<java.lang.String> subnets;
        java.lang.String type;
        java.lang.String allocationStrategy;
        java.lang.Number bidPercentage;
        java.lang.Number desiredVcpus;
        java.lang.Object ec2Configuration;
        java.lang.String ec2KeyPair;
        java.lang.String imageId;
        java.lang.String instanceRole;
        java.util.List<java.lang.String> instanceType;
        imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResourcesLaunchTemplate launchTemplate;
        java.lang.Number minVcpus;
        java.lang.String placementGroup;
        java.util.List<java.lang.String> securityGroupIds;
        java.lang.String spotIamFleetRole;
        java.util.Map<java.lang.String, java.lang.String> tags;

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResources#getMaxVcpus}
         * @param maxVcpus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#max_vcpus BatchComputeEnvironment#max_vcpus}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxVcpus(java.lang.Number maxVcpus) {
            this.maxVcpus = maxVcpus;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResources#getSubnets}
         * @param subnets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#subnets BatchComputeEnvironment#subnets}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnets(java.util.List<java.lang.String> subnets) {
            this.subnets = subnets;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResources#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#type BatchComputeEnvironment#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResources#getAllocationStrategy}
         * @param allocationStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#allocation_strategy BatchComputeEnvironment#allocation_strategy}.
         * @return {@code this}
         */
        public Builder allocationStrategy(java.lang.String allocationStrategy) {
            this.allocationStrategy = allocationStrategy;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResources#getBidPercentage}
         * @param bidPercentage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#bid_percentage BatchComputeEnvironment#bid_percentage}.
         * @return {@code this}
         */
        public Builder bidPercentage(java.lang.Number bidPercentage) {
            this.bidPercentage = bidPercentage;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResources#getDesiredVcpus}
         * @param desiredVcpus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#desired_vcpus BatchComputeEnvironment#desired_vcpus}.
         * @return {@code this}
         */
        public Builder desiredVcpus(java.lang.Number desiredVcpus) {
            this.desiredVcpus = desiredVcpus;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResources#getEc2Configuration}
         * @param ec2Configuration ec2_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#ec2_configuration BatchComputeEnvironment#ec2_configuration}
         * @return {@code this}
         */
        public Builder ec2Configuration(com.hashicorp.cdktf.IResolvable ec2Configuration) {
            this.ec2Configuration = ec2Configuration;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResources#getEc2Configuration}
         * @param ec2Configuration ec2_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#ec2_configuration BatchComputeEnvironment#ec2_configuration}
         * @return {@code this}
         */
        public Builder ec2Configuration(java.util.List<? extends imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResourcesEc2Configuration> ec2Configuration) {
            this.ec2Configuration = ec2Configuration;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResources#getEc2KeyPair}
         * @param ec2KeyPair Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#ec2_key_pair BatchComputeEnvironment#ec2_key_pair}.
         * @return {@code this}
         */
        public Builder ec2KeyPair(java.lang.String ec2KeyPair) {
            this.ec2KeyPair = ec2KeyPair;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResources#getImageId}
         * @param imageId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#image_id BatchComputeEnvironment#image_id}.
         * @return {@code this}
         */
        public Builder imageId(java.lang.String imageId) {
            this.imageId = imageId;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResources#getInstanceRole}
         * @param instanceRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#instance_role BatchComputeEnvironment#instance_role}.
         * @return {@code this}
         */
        public Builder instanceRole(java.lang.String instanceRole) {
            this.instanceRole = instanceRole;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResources#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#instance_type BatchComputeEnvironment#instance_type}.
         * @return {@code this}
         */
        public Builder instanceType(java.util.List<java.lang.String> instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResources#getLaunchTemplate}
         * @param launchTemplate launch_template block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#launch_template BatchComputeEnvironment#launch_template}
         * @return {@code this}
         */
        public Builder launchTemplate(imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResourcesLaunchTemplate launchTemplate) {
            this.launchTemplate = launchTemplate;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResources#getMinVcpus}
         * @param minVcpus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#min_vcpus BatchComputeEnvironment#min_vcpus}.
         * @return {@code this}
         */
        public Builder minVcpus(java.lang.Number minVcpus) {
            this.minVcpus = minVcpus;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResources#getPlacementGroup}
         * @param placementGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#placement_group BatchComputeEnvironment#placement_group}.
         * @return {@code this}
         */
        public Builder placementGroup(java.lang.String placementGroup) {
            this.placementGroup = placementGroup;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResources#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#security_group_ids BatchComputeEnvironment#security_group_ids}.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResources#getSpotIamFleetRole}
         * @param spotIamFleetRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#spot_iam_fleet_role BatchComputeEnvironment#spot_iam_fleet_role}.
         * @return {@code this}
         */
        public Builder spotIamFleetRole(java.lang.String spotIamFleetRole) {
            this.spotIamFleetRole = spotIamFleetRole;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResources#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#tags BatchComputeEnvironment#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BatchComputeEnvironmentComputeResources}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchComputeEnvironmentComputeResources build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchComputeEnvironmentComputeResources}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchComputeEnvironmentComputeResources {
        private final java.lang.Number maxVcpus;
        private final java.util.List<java.lang.String> subnets;
        private final java.lang.String type;
        private final java.lang.String allocationStrategy;
        private final java.lang.Number bidPercentage;
        private final java.lang.Number desiredVcpus;
        private final java.lang.Object ec2Configuration;
        private final java.lang.String ec2KeyPair;
        private final java.lang.String imageId;
        private final java.lang.String instanceRole;
        private final java.util.List<java.lang.String> instanceType;
        private final imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResourcesLaunchTemplate launchTemplate;
        private final java.lang.Number minVcpus;
        private final java.lang.String placementGroup;
        private final java.util.List<java.lang.String> securityGroupIds;
        private final java.lang.String spotIamFleetRole;
        private final java.util.Map<java.lang.String, java.lang.String> tags;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxVcpus = software.amazon.jsii.Kernel.get(this, "maxVcpus", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.subnets = software.amazon.jsii.Kernel.get(this, "subnets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.allocationStrategy = software.amazon.jsii.Kernel.get(this, "allocationStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bidPercentage = software.amazon.jsii.Kernel.get(this, "bidPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.desiredVcpus = software.amazon.jsii.Kernel.get(this, "desiredVcpus", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.ec2Configuration = software.amazon.jsii.Kernel.get(this, "ec2Configuration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ec2KeyPair = software.amazon.jsii.Kernel.get(this, "ec2KeyPair", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.imageId = software.amazon.jsii.Kernel.get(this, "imageId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceRole = software.amazon.jsii.Kernel.get(this, "instanceRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.launchTemplate = software.amazon.jsii.Kernel.get(this, "launchTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResourcesLaunchTemplate.class));
            this.minVcpus = software.amazon.jsii.Kernel.get(this, "minVcpus", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.placementGroup = software.amazon.jsii.Kernel.get(this, "placementGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.spotIamFleetRole = software.amazon.jsii.Kernel.get(this, "spotIamFleetRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxVcpus = java.util.Objects.requireNonNull(builder.maxVcpus, "maxVcpus is required");
            this.subnets = java.util.Objects.requireNonNull(builder.subnets, "subnets is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.allocationStrategy = builder.allocationStrategy;
            this.bidPercentage = builder.bidPercentage;
            this.desiredVcpus = builder.desiredVcpus;
            this.ec2Configuration = builder.ec2Configuration;
            this.ec2KeyPair = builder.ec2KeyPair;
            this.imageId = builder.imageId;
            this.instanceRole = builder.instanceRole;
            this.instanceType = builder.instanceType;
            this.launchTemplate = builder.launchTemplate;
            this.minVcpus = builder.minVcpus;
            this.placementGroup = builder.placementGroup;
            this.securityGroupIds = builder.securityGroupIds;
            this.spotIamFleetRole = builder.spotIamFleetRole;
            this.tags = builder.tags;
        }

        @Override
        public final java.lang.Number getMaxVcpus() {
            return this.maxVcpus;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnets() {
            return this.subnets;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getAllocationStrategy() {
            return this.allocationStrategy;
        }

        @Override
        public final java.lang.Number getBidPercentage() {
            return this.bidPercentage;
        }

        @Override
        public final java.lang.Number getDesiredVcpus() {
            return this.desiredVcpus;
        }

        @Override
        public final java.lang.Object getEc2Configuration() {
            return this.ec2Configuration;
        }

        @Override
        public final java.lang.String getEc2KeyPair() {
            return this.ec2KeyPair;
        }

        @Override
        public final java.lang.String getImageId() {
            return this.imageId;
        }

        @Override
        public final java.lang.String getInstanceRole() {
            return this.instanceRole;
        }

        @Override
        public final java.util.List<java.lang.String> getInstanceType() {
            return this.instanceType;
        }

        @Override
        public final imports.aws.batch_compute_environment.BatchComputeEnvironmentComputeResourcesLaunchTemplate getLaunchTemplate() {
            return this.launchTemplate;
        }

        @Override
        public final java.lang.Number getMinVcpus() {
            return this.minVcpus;
        }

        @Override
        public final java.lang.String getPlacementGroup() {
            return this.placementGroup;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
        }

        @Override
        public final java.lang.String getSpotIamFleetRole() {
            return this.spotIamFleetRole;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("maxVcpus", om.valueToTree(this.getMaxVcpus()));
            data.set("subnets", om.valueToTree(this.getSubnets()));
            data.set("type", om.valueToTree(this.getType()));
            if (this.getAllocationStrategy() != null) {
                data.set("allocationStrategy", om.valueToTree(this.getAllocationStrategy()));
            }
            if (this.getBidPercentage() != null) {
                data.set("bidPercentage", om.valueToTree(this.getBidPercentage()));
            }
            if (this.getDesiredVcpus() != null) {
                data.set("desiredVcpus", om.valueToTree(this.getDesiredVcpus()));
            }
            if (this.getEc2Configuration() != null) {
                data.set("ec2Configuration", om.valueToTree(this.getEc2Configuration()));
            }
            if (this.getEc2KeyPair() != null) {
                data.set("ec2KeyPair", om.valueToTree(this.getEc2KeyPair()));
            }
            if (this.getImageId() != null) {
                data.set("imageId", om.valueToTree(this.getImageId()));
            }
            if (this.getInstanceRole() != null) {
                data.set("instanceRole", om.valueToTree(this.getInstanceRole()));
            }
            if (this.getInstanceType() != null) {
                data.set("instanceType", om.valueToTree(this.getInstanceType()));
            }
            if (this.getLaunchTemplate() != null) {
                data.set("launchTemplate", om.valueToTree(this.getLaunchTemplate()));
            }
            if (this.getMinVcpus() != null) {
                data.set("minVcpus", om.valueToTree(this.getMinVcpus()));
            }
            if (this.getPlacementGroup() != null) {
                data.set("placementGroup", om.valueToTree(this.getPlacementGroup()));
            }
            if (this.getSecurityGroupIds() != null) {
                data.set("securityGroupIds", om.valueToTree(this.getSecurityGroupIds()));
            }
            if (this.getSpotIamFleetRole() != null) {
                data.set("spotIamFleetRole", om.valueToTree(this.getSpotIamFleetRole()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.batchComputeEnvironment.BatchComputeEnvironmentComputeResources"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchComputeEnvironmentComputeResources.Jsii$Proxy that = (BatchComputeEnvironmentComputeResources.Jsii$Proxy) o;

            if (!maxVcpus.equals(that.maxVcpus)) return false;
            if (!subnets.equals(that.subnets)) return false;
            if (!type.equals(that.type)) return false;
            if (this.allocationStrategy != null ? !this.allocationStrategy.equals(that.allocationStrategy) : that.allocationStrategy != null) return false;
            if (this.bidPercentage != null ? !this.bidPercentage.equals(that.bidPercentage) : that.bidPercentage != null) return false;
            if (this.desiredVcpus != null ? !this.desiredVcpus.equals(that.desiredVcpus) : that.desiredVcpus != null) return false;
            if (this.ec2Configuration != null ? !this.ec2Configuration.equals(that.ec2Configuration) : that.ec2Configuration != null) return false;
            if (this.ec2KeyPair != null ? !this.ec2KeyPair.equals(that.ec2KeyPair) : that.ec2KeyPair != null) return false;
            if (this.imageId != null ? !this.imageId.equals(that.imageId) : that.imageId != null) return false;
            if (this.instanceRole != null ? !this.instanceRole.equals(that.instanceRole) : that.instanceRole != null) return false;
            if (this.instanceType != null ? !this.instanceType.equals(that.instanceType) : that.instanceType != null) return false;
            if (this.launchTemplate != null ? !this.launchTemplate.equals(that.launchTemplate) : that.launchTemplate != null) return false;
            if (this.minVcpus != null ? !this.minVcpus.equals(that.minVcpus) : that.minVcpus != null) return false;
            if (this.placementGroup != null ? !this.placementGroup.equals(that.placementGroup) : that.placementGroup != null) return false;
            if (this.securityGroupIds != null ? !this.securityGroupIds.equals(that.securityGroupIds) : that.securityGroupIds != null) return false;
            if (this.spotIamFleetRole != null ? !this.spotIamFleetRole.equals(that.spotIamFleetRole) : that.spotIamFleetRole != null) return false;
            return this.tags != null ? this.tags.equals(that.tags) : that.tags == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maxVcpus.hashCode();
            result = 31 * result + (this.subnets.hashCode());
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.allocationStrategy != null ? this.allocationStrategy.hashCode() : 0);
            result = 31 * result + (this.bidPercentage != null ? this.bidPercentage.hashCode() : 0);
            result = 31 * result + (this.desiredVcpus != null ? this.desiredVcpus.hashCode() : 0);
            result = 31 * result + (this.ec2Configuration != null ? this.ec2Configuration.hashCode() : 0);
            result = 31 * result + (this.ec2KeyPair != null ? this.ec2KeyPair.hashCode() : 0);
            result = 31 * result + (this.imageId != null ? this.imageId.hashCode() : 0);
            result = 31 * result + (this.instanceRole != null ? this.instanceRole.hashCode() : 0);
            result = 31 * result + (this.instanceType != null ? this.instanceType.hashCode() : 0);
            result = 31 * result + (this.launchTemplate != null ? this.launchTemplate.hashCode() : 0);
            result = 31 * result + (this.minVcpus != null ? this.minVcpus.hashCode() : 0);
            result = 31 * result + (this.placementGroup != null ? this.placementGroup.hashCode() : 0);
            result = 31 * result + (this.securityGroupIds != null ? this.securityGroupIds.hashCode() : 0);
            result = 31 * result + (this.spotIamFleetRole != null ? this.spotIamFleetRole.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            return result;
        }
    }
}
