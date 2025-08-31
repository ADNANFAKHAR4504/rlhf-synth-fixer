package imports.aws.ec2_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.077Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2Fleet.Ec2FleetSpotOptions")
@software.amazon.jsii.Jsii.Proxy(Ec2FleetSpotOptions.Jsii$Proxy.class)
public interface Ec2FleetSpotOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#allocation_strategy Ec2Fleet#allocation_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAllocationStrategy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_interruption_behavior Ec2Fleet#instance_interruption_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceInterruptionBehavior() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_pools_to_use_count Ec2Fleet#instance_pools_to_use_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getInstancePoolsToUseCount() {
        return null;
    }

    /**
     * maintenance_strategies block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#maintenance_strategies Ec2Fleet#maintenance_strategies}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategies getMaintenanceStrategies() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max_total_price Ec2Fleet#max_total_price}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMaxTotalPrice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min_target_capacity Ec2Fleet#min_target_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinTargetCapacity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_availability_zone Ec2Fleet#single_availability_zone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSingleAvailabilityZone() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_instance_type Ec2Fleet#single_instance_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSingleInstanceType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2FleetSpotOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2FleetSpotOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2FleetSpotOptions> {
        java.lang.String allocationStrategy;
        java.lang.String instanceInterruptionBehavior;
        java.lang.Number instancePoolsToUseCount;
        imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategies maintenanceStrategies;
        java.lang.String maxTotalPrice;
        java.lang.Number minTargetCapacity;
        java.lang.Object singleAvailabilityZone;
        java.lang.Object singleInstanceType;

        /**
         * Sets the value of {@link Ec2FleetSpotOptions#getAllocationStrategy}
         * @param allocationStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#allocation_strategy Ec2Fleet#allocation_strategy}.
         * @return {@code this}
         */
        public Builder allocationStrategy(java.lang.String allocationStrategy) {
            this.allocationStrategy = allocationStrategy;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetSpotOptions#getInstanceInterruptionBehavior}
         * @param instanceInterruptionBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_interruption_behavior Ec2Fleet#instance_interruption_behavior}.
         * @return {@code this}
         */
        public Builder instanceInterruptionBehavior(java.lang.String instanceInterruptionBehavior) {
            this.instanceInterruptionBehavior = instanceInterruptionBehavior;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetSpotOptions#getInstancePoolsToUseCount}
         * @param instancePoolsToUseCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_pools_to_use_count Ec2Fleet#instance_pools_to_use_count}.
         * @return {@code this}
         */
        public Builder instancePoolsToUseCount(java.lang.Number instancePoolsToUseCount) {
            this.instancePoolsToUseCount = instancePoolsToUseCount;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetSpotOptions#getMaintenanceStrategies}
         * @param maintenanceStrategies maintenance_strategies block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#maintenance_strategies Ec2Fleet#maintenance_strategies}
         * @return {@code this}
         */
        public Builder maintenanceStrategies(imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategies maintenanceStrategies) {
            this.maintenanceStrategies = maintenanceStrategies;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetSpotOptions#getMaxTotalPrice}
         * @param maxTotalPrice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max_total_price Ec2Fleet#max_total_price}.
         * @return {@code this}
         */
        public Builder maxTotalPrice(java.lang.String maxTotalPrice) {
            this.maxTotalPrice = maxTotalPrice;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetSpotOptions#getMinTargetCapacity}
         * @param minTargetCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min_target_capacity Ec2Fleet#min_target_capacity}.
         * @return {@code this}
         */
        public Builder minTargetCapacity(java.lang.Number minTargetCapacity) {
            this.minTargetCapacity = minTargetCapacity;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetSpotOptions#getSingleAvailabilityZone}
         * @param singleAvailabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_availability_zone Ec2Fleet#single_availability_zone}.
         * @return {@code this}
         */
        public Builder singleAvailabilityZone(java.lang.Boolean singleAvailabilityZone) {
            this.singleAvailabilityZone = singleAvailabilityZone;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetSpotOptions#getSingleAvailabilityZone}
         * @param singleAvailabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_availability_zone Ec2Fleet#single_availability_zone}.
         * @return {@code this}
         */
        public Builder singleAvailabilityZone(com.hashicorp.cdktf.IResolvable singleAvailabilityZone) {
            this.singleAvailabilityZone = singleAvailabilityZone;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetSpotOptions#getSingleInstanceType}
         * @param singleInstanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_instance_type Ec2Fleet#single_instance_type}.
         * @return {@code this}
         */
        public Builder singleInstanceType(java.lang.Boolean singleInstanceType) {
            this.singleInstanceType = singleInstanceType;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetSpotOptions#getSingleInstanceType}
         * @param singleInstanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_instance_type Ec2Fleet#single_instance_type}.
         * @return {@code this}
         */
        public Builder singleInstanceType(com.hashicorp.cdktf.IResolvable singleInstanceType) {
            this.singleInstanceType = singleInstanceType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Ec2FleetSpotOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2FleetSpotOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2FleetSpotOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2FleetSpotOptions {
        private final java.lang.String allocationStrategy;
        private final java.lang.String instanceInterruptionBehavior;
        private final java.lang.Number instancePoolsToUseCount;
        private final imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategies maintenanceStrategies;
        private final java.lang.String maxTotalPrice;
        private final java.lang.Number minTargetCapacity;
        private final java.lang.Object singleAvailabilityZone;
        private final java.lang.Object singleInstanceType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allocationStrategy = software.amazon.jsii.Kernel.get(this, "allocationStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceInterruptionBehavior = software.amazon.jsii.Kernel.get(this, "instanceInterruptionBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instancePoolsToUseCount = software.amazon.jsii.Kernel.get(this, "instancePoolsToUseCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maintenanceStrategies = software.amazon.jsii.Kernel.get(this, "maintenanceStrategies", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategies.class));
            this.maxTotalPrice = software.amazon.jsii.Kernel.get(this, "maxTotalPrice", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.minTargetCapacity = software.amazon.jsii.Kernel.get(this, "minTargetCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.singleAvailabilityZone = software.amazon.jsii.Kernel.get(this, "singleAvailabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.singleInstanceType = software.amazon.jsii.Kernel.get(this, "singleInstanceType", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allocationStrategy = builder.allocationStrategy;
            this.instanceInterruptionBehavior = builder.instanceInterruptionBehavior;
            this.instancePoolsToUseCount = builder.instancePoolsToUseCount;
            this.maintenanceStrategies = builder.maintenanceStrategies;
            this.maxTotalPrice = builder.maxTotalPrice;
            this.minTargetCapacity = builder.minTargetCapacity;
            this.singleAvailabilityZone = builder.singleAvailabilityZone;
            this.singleInstanceType = builder.singleInstanceType;
        }

        @Override
        public final java.lang.String getAllocationStrategy() {
            return this.allocationStrategy;
        }

        @Override
        public final java.lang.String getInstanceInterruptionBehavior() {
            return this.instanceInterruptionBehavior;
        }

        @Override
        public final java.lang.Number getInstancePoolsToUseCount() {
            return this.instancePoolsToUseCount;
        }

        @Override
        public final imports.aws.ec2_fleet.Ec2FleetSpotOptionsMaintenanceStrategies getMaintenanceStrategies() {
            return this.maintenanceStrategies;
        }

        @Override
        public final java.lang.String getMaxTotalPrice() {
            return this.maxTotalPrice;
        }

        @Override
        public final java.lang.Number getMinTargetCapacity() {
            return this.minTargetCapacity;
        }

        @Override
        public final java.lang.Object getSingleAvailabilityZone() {
            return this.singleAvailabilityZone;
        }

        @Override
        public final java.lang.Object getSingleInstanceType() {
            return this.singleInstanceType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAllocationStrategy() != null) {
                data.set("allocationStrategy", om.valueToTree(this.getAllocationStrategy()));
            }
            if (this.getInstanceInterruptionBehavior() != null) {
                data.set("instanceInterruptionBehavior", om.valueToTree(this.getInstanceInterruptionBehavior()));
            }
            if (this.getInstancePoolsToUseCount() != null) {
                data.set("instancePoolsToUseCount", om.valueToTree(this.getInstancePoolsToUseCount()));
            }
            if (this.getMaintenanceStrategies() != null) {
                data.set("maintenanceStrategies", om.valueToTree(this.getMaintenanceStrategies()));
            }
            if (this.getMaxTotalPrice() != null) {
                data.set("maxTotalPrice", om.valueToTree(this.getMaxTotalPrice()));
            }
            if (this.getMinTargetCapacity() != null) {
                data.set("minTargetCapacity", om.valueToTree(this.getMinTargetCapacity()));
            }
            if (this.getSingleAvailabilityZone() != null) {
                data.set("singleAvailabilityZone", om.valueToTree(this.getSingleAvailabilityZone()));
            }
            if (this.getSingleInstanceType() != null) {
                data.set("singleInstanceType", om.valueToTree(this.getSingleInstanceType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ec2Fleet.Ec2FleetSpotOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2FleetSpotOptions.Jsii$Proxy that = (Ec2FleetSpotOptions.Jsii$Proxy) o;

            if (this.allocationStrategy != null ? !this.allocationStrategy.equals(that.allocationStrategy) : that.allocationStrategy != null) return false;
            if (this.instanceInterruptionBehavior != null ? !this.instanceInterruptionBehavior.equals(that.instanceInterruptionBehavior) : that.instanceInterruptionBehavior != null) return false;
            if (this.instancePoolsToUseCount != null ? !this.instancePoolsToUseCount.equals(that.instancePoolsToUseCount) : that.instancePoolsToUseCount != null) return false;
            if (this.maintenanceStrategies != null ? !this.maintenanceStrategies.equals(that.maintenanceStrategies) : that.maintenanceStrategies != null) return false;
            if (this.maxTotalPrice != null ? !this.maxTotalPrice.equals(that.maxTotalPrice) : that.maxTotalPrice != null) return false;
            if (this.minTargetCapacity != null ? !this.minTargetCapacity.equals(that.minTargetCapacity) : that.minTargetCapacity != null) return false;
            if (this.singleAvailabilityZone != null ? !this.singleAvailabilityZone.equals(that.singleAvailabilityZone) : that.singleAvailabilityZone != null) return false;
            return this.singleInstanceType != null ? this.singleInstanceType.equals(that.singleInstanceType) : that.singleInstanceType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.allocationStrategy != null ? this.allocationStrategy.hashCode() : 0;
            result = 31 * result + (this.instanceInterruptionBehavior != null ? this.instanceInterruptionBehavior.hashCode() : 0);
            result = 31 * result + (this.instancePoolsToUseCount != null ? this.instancePoolsToUseCount.hashCode() : 0);
            result = 31 * result + (this.maintenanceStrategies != null ? this.maintenanceStrategies.hashCode() : 0);
            result = 31 * result + (this.maxTotalPrice != null ? this.maxTotalPrice.hashCode() : 0);
            result = 31 * result + (this.minTargetCapacity != null ? this.minTargetCapacity.hashCode() : 0);
            result = 31 * result + (this.singleAvailabilityZone != null ? this.singleAvailabilityZone.hashCode() : 0);
            result = 31 * result + (this.singleInstanceType != null ? this.singleInstanceType.hashCode() : 0);
            return result;
        }
    }
}
