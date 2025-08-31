package imports.aws.ec2_capacity_reservation;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.066Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2CapacityReservation.Ec2CapacityReservationConfig")
@software.amazon.jsii.Jsii.Proxy(Ec2CapacityReservationConfig.Jsii$Proxy.class)
public interface Ec2CapacityReservationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#availability_zone Ec2CapacityReservation#availability_zone}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAvailabilityZone();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#instance_count Ec2CapacityReservation#instance_count}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getInstanceCount();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#instance_platform Ec2CapacityReservation#instance_platform}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInstancePlatform();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#instance_type Ec2CapacityReservation#instance_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInstanceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#ebs_optimized Ec2CapacityReservation#ebs_optimized}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEbsOptimized() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#end_date Ec2CapacityReservation#end_date}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEndDate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#end_date_type Ec2CapacityReservation#end_date_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEndDateType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#ephemeral_storage Ec2CapacityReservation#ephemeral_storage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEphemeralStorage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#id Ec2CapacityReservation#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#instance_match_criteria Ec2CapacityReservation#instance_match_criteria}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceMatchCriteria() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#outpost_arn Ec2CapacityReservation#outpost_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOutpostArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#placement_group_arn Ec2CapacityReservation#placement_group_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPlacementGroupArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#tags Ec2CapacityReservation#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#tags_all Ec2CapacityReservation#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#tenancy Ec2CapacityReservation#tenancy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTenancy() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#timeouts Ec2CapacityReservation#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_capacity_reservation.Ec2CapacityReservationTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2CapacityReservationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2CapacityReservationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2CapacityReservationConfig> {
        java.lang.String availabilityZone;
        java.lang.Number instanceCount;
        java.lang.String instancePlatform;
        java.lang.String instanceType;
        java.lang.Object ebsOptimized;
        java.lang.String endDate;
        java.lang.String endDateType;
        java.lang.Object ephemeralStorage;
        java.lang.String id;
        java.lang.String instanceMatchCriteria;
        java.lang.String outpostArn;
        java.lang.String placementGroupArn;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String tenancy;
        imports.aws.ec2_capacity_reservation.Ec2CapacityReservationTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getAvailabilityZone}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#availability_zone Ec2CapacityReservation#availability_zone}. This parameter is required.
         * @return {@code this}
         */
        public Builder availabilityZone(java.lang.String availabilityZone) {
            this.availabilityZone = availabilityZone;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getInstanceCount}
         * @param instanceCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#instance_count Ec2CapacityReservation#instance_count}. This parameter is required.
         * @return {@code this}
         */
        public Builder instanceCount(java.lang.Number instanceCount) {
            this.instanceCount = instanceCount;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getInstancePlatform}
         * @param instancePlatform Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#instance_platform Ec2CapacityReservation#instance_platform}. This parameter is required.
         * @return {@code this}
         */
        public Builder instancePlatform(java.lang.String instancePlatform) {
            this.instancePlatform = instancePlatform;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#instance_type Ec2CapacityReservation#instance_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getEbsOptimized}
         * @param ebsOptimized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#ebs_optimized Ec2CapacityReservation#ebs_optimized}.
         * @return {@code this}
         */
        public Builder ebsOptimized(java.lang.Boolean ebsOptimized) {
            this.ebsOptimized = ebsOptimized;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getEbsOptimized}
         * @param ebsOptimized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#ebs_optimized Ec2CapacityReservation#ebs_optimized}.
         * @return {@code this}
         */
        public Builder ebsOptimized(com.hashicorp.cdktf.IResolvable ebsOptimized) {
            this.ebsOptimized = ebsOptimized;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getEndDate}
         * @param endDate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#end_date Ec2CapacityReservation#end_date}.
         * @return {@code this}
         */
        public Builder endDate(java.lang.String endDate) {
            this.endDate = endDate;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getEndDateType}
         * @param endDateType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#end_date_type Ec2CapacityReservation#end_date_type}.
         * @return {@code this}
         */
        public Builder endDateType(java.lang.String endDateType) {
            this.endDateType = endDateType;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getEphemeralStorage}
         * @param ephemeralStorage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#ephemeral_storage Ec2CapacityReservation#ephemeral_storage}.
         * @return {@code this}
         */
        public Builder ephemeralStorage(java.lang.Boolean ephemeralStorage) {
            this.ephemeralStorage = ephemeralStorage;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getEphemeralStorage}
         * @param ephemeralStorage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#ephemeral_storage Ec2CapacityReservation#ephemeral_storage}.
         * @return {@code this}
         */
        public Builder ephemeralStorage(com.hashicorp.cdktf.IResolvable ephemeralStorage) {
            this.ephemeralStorage = ephemeralStorage;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#id Ec2CapacityReservation#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getInstanceMatchCriteria}
         * @param instanceMatchCriteria Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#instance_match_criteria Ec2CapacityReservation#instance_match_criteria}.
         * @return {@code this}
         */
        public Builder instanceMatchCriteria(java.lang.String instanceMatchCriteria) {
            this.instanceMatchCriteria = instanceMatchCriteria;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getOutpostArn}
         * @param outpostArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#outpost_arn Ec2CapacityReservation#outpost_arn}.
         * @return {@code this}
         */
        public Builder outpostArn(java.lang.String outpostArn) {
            this.outpostArn = outpostArn;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getPlacementGroupArn}
         * @param placementGroupArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#placement_group_arn Ec2CapacityReservation#placement_group_arn}.
         * @return {@code this}
         */
        public Builder placementGroupArn(java.lang.String placementGroupArn) {
            this.placementGroupArn = placementGroupArn;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#tags Ec2CapacityReservation#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#tags_all Ec2CapacityReservation#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getTenancy}
         * @param tenancy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#tenancy Ec2CapacityReservation#tenancy}.
         * @return {@code this}
         */
        public Builder tenancy(java.lang.String tenancy) {
            this.tenancy = tenancy;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_reservation#timeouts Ec2CapacityReservation#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.ec2_capacity_reservation.Ec2CapacityReservationTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getDependsOn}
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
         * Sets the value of {@link Ec2CapacityReservationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Ec2CapacityReservationConfig#getProvisioners}
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
         * @return a new instance of {@link Ec2CapacityReservationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2CapacityReservationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2CapacityReservationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2CapacityReservationConfig {
        private final java.lang.String availabilityZone;
        private final java.lang.Number instanceCount;
        private final java.lang.String instancePlatform;
        private final java.lang.String instanceType;
        private final java.lang.Object ebsOptimized;
        private final java.lang.String endDate;
        private final java.lang.String endDateType;
        private final java.lang.Object ephemeralStorage;
        private final java.lang.String id;
        private final java.lang.String instanceMatchCriteria;
        private final java.lang.String outpostArn;
        private final java.lang.String placementGroupArn;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String tenancy;
        private final imports.aws.ec2_capacity_reservation.Ec2CapacityReservationTimeouts timeouts;
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
            this.availabilityZone = software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceCount = software.amazon.jsii.Kernel.get(this, "instanceCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.instancePlatform = software.amazon.jsii.Kernel.get(this, "instancePlatform", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ebsOptimized = software.amazon.jsii.Kernel.get(this, "ebsOptimized", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.endDate = software.amazon.jsii.Kernel.get(this, "endDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endDateType = software.amazon.jsii.Kernel.get(this, "endDateType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ephemeralStorage = software.amazon.jsii.Kernel.get(this, "ephemeralStorage", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceMatchCriteria = software.amazon.jsii.Kernel.get(this, "instanceMatchCriteria", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.outpostArn = software.amazon.jsii.Kernel.get(this, "outpostArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.placementGroupArn = software.amazon.jsii.Kernel.get(this, "placementGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tenancy = software.amazon.jsii.Kernel.get(this, "tenancy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_capacity_reservation.Ec2CapacityReservationTimeouts.class));
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
            this.availabilityZone = java.util.Objects.requireNonNull(builder.availabilityZone, "availabilityZone is required");
            this.instanceCount = java.util.Objects.requireNonNull(builder.instanceCount, "instanceCount is required");
            this.instancePlatform = java.util.Objects.requireNonNull(builder.instancePlatform, "instancePlatform is required");
            this.instanceType = java.util.Objects.requireNonNull(builder.instanceType, "instanceType is required");
            this.ebsOptimized = builder.ebsOptimized;
            this.endDate = builder.endDate;
            this.endDateType = builder.endDateType;
            this.ephemeralStorage = builder.ephemeralStorage;
            this.id = builder.id;
            this.instanceMatchCriteria = builder.instanceMatchCriteria;
            this.outpostArn = builder.outpostArn;
            this.placementGroupArn = builder.placementGroupArn;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.tenancy = builder.tenancy;
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
        public final java.lang.String getAvailabilityZone() {
            return this.availabilityZone;
        }

        @Override
        public final java.lang.Number getInstanceCount() {
            return this.instanceCount;
        }

        @Override
        public final java.lang.String getInstancePlatform() {
            return this.instancePlatform;
        }

        @Override
        public final java.lang.String getInstanceType() {
            return this.instanceType;
        }

        @Override
        public final java.lang.Object getEbsOptimized() {
            return this.ebsOptimized;
        }

        @Override
        public final java.lang.String getEndDate() {
            return this.endDate;
        }

        @Override
        public final java.lang.String getEndDateType() {
            return this.endDateType;
        }

        @Override
        public final java.lang.Object getEphemeralStorage() {
            return this.ephemeralStorage;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getInstanceMatchCriteria() {
            return this.instanceMatchCriteria;
        }

        @Override
        public final java.lang.String getOutpostArn() {
            return this.outpostArn;
        }

        @Override
        public final java.lang.String getPlacementGroupArn() {
            return this.placementGroupArn;
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
        public final imports.aws.ec2_capacity_reservation.Ec2CapacityReservationTimeouts getTimeouts() {
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

            data.set("availabilityZone", om.valueToTree(this.getAvailabilityZone()));
            data.set("instanceCount", om.valueToTree(this.getInstanceCount()));
            data.set("instancePlatform", om.valueToTree(this.getInstancePlatform()));
            data.set("instanceType", om.valueToTree(this.getInstanceType()));
            if (this.getEbsOptimized() != null) {
                data.set("ebsOptimized", om.valueToTree(this.getEbsOptimized()));
            }
            if (this.getEndDate() != null) {
                data.set("endDate", om.valueToTree(this.getEndDate()));
            }
            if (this.getEndDateType() != null) {
                data.set("endDateType", om.valueToTree(this.getEndDateType()));
            }
            if (this.getEphemeralStorage() != null) {
                data.set("ephemeralStorage", om.valueToTree(this.getEphemeralStorage()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInstanceMatchCriteria() != null) {
                data.set("instanceMatchCriteria", om.valueToTree(this.getInstanceMatchCriteria()));
            }
            if (this.getOutpostArn() != null) {
                data.set("outpostArn", om.valueToTree(this.getOutpostArn()));
            }
            if (this.getPlacementGroupArn() != null) {
                data.set("placementGroupArn", om.valueToTree(this.getPlacementGroupArn()));
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
            struct.set("fqn", om.valueToTree("aws.ec2CapacityReservation.Ec2CapacityReservationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2CapacityReservationConfig.Jsii$Proxy that = (Ec2CapacityReservationConfig.Jsii$Proxy) o;

            if (!availabilityZone.equals(that.availabilityZone)) return false;
            if (!instanceCount.equals(that.instanceCount)) return false;
            if (!instancePlatform.equals(that.instancePlatform)) return false;
            if (!instanceType.equals(that.instanceType)) return false;
            if (this.ebsOptimized != null ? !this.ebsOptimized.equals(that.ebsOptimized) : that.ebsOptimized != null) return false;
            if (this.endDate != null ? !this.endDate.equals(that.endDate) : that.endDate != null) return false;
            if (this.endDateType != null ? !this.endDateType.equals(that.endDateType) : that.endDateType != null) return false;
            if (this.ephemeralStorage != null ? !this.ephemeralStorage.equals(that.ephemeralStorage) : that.ephemeralStorage != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.instanceMatchCriteria != null ? !this.instanceMatchCriteria.equals(that.instanceMatchCriteria) : that.instanceMatchCriteria != null) return false;
            if (this.outpostArn != null ? !this.outpostArn.equals(that.outpostArn) : that.outpostArn != null) return false;
            if (this.placementGroupArn != null ? !this.placementGroupArn.equals(that.placementGroupArn) : that.placementGroupArn != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.tenancy != null ? !this.tenancy.equals(that.tenancy) : that.tenancy != null) return false;
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
            int result = this.availabilityZone.hashCode();
            result = 31 * result + (this.instanceCount.hashCode());
            result = 31 * result + (this.instancePlatform.hashCode());
            result = 31 * result + (this.instanceType.hashCode());
            result = 31 * result + (this.ebsOptimized != null ? this.ebsOptimized.hashCode() : 0);
            result = 31 * result + (this.endDate != null ? this.endDate.hashCode() : 0);
            result = 31 * result + (this.endDateType != null ? this.endDateType.hashCode() : 0);
            result = 31 * result + (this.ephemeralStorage != null ? this.ephemeralStorage.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.instanceMatchCriteria != null ? this.instanceMatchCriteria.hashCode() : 0);
            result = 31 * result + (this.outpostArn != null ? this.outpostArn.hashCode() : 0);
            result = 31 * result + (this.placementGroupArn != null ? this.placementGroupArn.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.tenancy != null ? this.tenancy.hashCode() : 0);
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
