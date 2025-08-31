package imports.aws.ec2_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.077Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2Fleet.Ec2FleetOnDemandOptions")
@software.amazon.jsii.Jsii.Proxy(Ec2FleetOnDemandOptions.Jsii$Proxy.class)
public interface Ec2FleetOnDemandOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#allocation_strategy Ec2Fleet#allocation_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAllocationStrategy() {
        return null;
    }

    /**
     * capacity_reservation_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#capacity_reservation_options Ec2Fleet#capacity_reservation_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetOnDemandOptionsCapacityReservationOptions getCapacityReservationOptions() {
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
     * @return a {@link Builder} of {@link Ec2FleetOnDemandOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2FleetOnDemandOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2FleetOnDemandOptions> {
        java.lang.String allocationStrategy;
        imports.aws.ec2_fleet.Ec2FleetOnDemandOptionsCapacityReservationOptions capacityReservationOptions;
        java.lang.String maxTotalPrice;
        java.lang.Number minTargetCapacity;
        java.lang.Object singleAvailabilityZone;
        java.lang.Object singleInstanceType;

        /**
         * Sets the value of {@link Ec2FleetOnDemandOptions#getAllocationStrategy}
         * @param allocationStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#allocation_strategy Ec2Fleet#allocation_strategy}.
         * @return {@code this}
         */
        public Builder allocationStrategy(java.lang.String allocationStrategy) {
            this.allocationStrategy = allocationStrategy;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetOnDemandOptions#getCapacityReservationOptions}
         * @param capacityReservationOptions capacity_reservation_options block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#capacity_reservation_options Ec2Fleet#capacity_reservation_options}
         * @return {@code this}
         */
        public Builder capacityReservationOptions(imports.aws.ec2_fleet.Ec2FleetOnDemandOptionsCapacityReservationOptions capacityReservationOptions) {
            this.capacityReservationOptions = capacityReservationOptions;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetOnDemandOptions#getMaxTotalPrice}
         * @param maxTotalPrice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max_total_price Ec2Fleet#max_total_price}.
         * @return {@code this}
         */
        public Builder maxTotalPrice(java.lang.String maxTotalPrice) {
            this.maxTotalPrice = maxTotalPrice;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetOnDemandOptions#getMinTargetCapacity}
         * @param minTargetCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min_target_capacity Ec2Fleet#min_target_capacity}.
         * @return {@code this}
         */
        public Builder minTargetCapacity(java.lang.Number minTargetCapacity) {
            this.minTargetCapacity = minTargetCapacity;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetOnDemandOptions#getSingleAvailabilityZone}
         * @param singleAvailabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_availability_zone Ec2Fleet#single_availability_zone}.
         * @return {@code this}
         */
        public Builder singleAvailabilityZone(java.lang.Boolean singleAvailabilityZone) {
            this.singleAvailabilityZone = singleAvailabilityZone;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetOnDemandOptions#getSingleAvailabilityZone}
         * @param singleAvailabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_availability_zone Ec2Fleet#single_availability_zone}.
         * @return {@code this}
         */
        public Builder singleAvailabilityZone(com.hashicorp.cdktf.IResolvable singleAvailabilityZone) {
            this.singleAvailabilityZone = singleAvailabilityZone;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetOnDemandOptions#getSingleInstanceType}
         * @param singleInstanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_instance_type Ec2Fleet#single_instance_type}.
         * @return {@code this}
         */
        public Builder singleInstanceType(java.lang.Boolean singleInstanceType) {
            this.singleInstanceType = singleInstanceType;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetOnDemandOptions#getSingleInstanceType}
         * @param singleInstanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#single_instance_type Ec2Fleet#single_instance_type}.
         * @return {@code this}
         */
        public Builder singleInstanceType(com.hashicorp.cdktf.IResolvable singleInstanceType) {
            this.singleInstanceType = singleInstanceType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Ec2FleetOnDemandOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2FleetOnDemandOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2FleetOnDemandOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2FleetOnDemandOptions {
        private final java.lang.String allocationStrategy;
        private final imports.aws.ec2_fleet.Ec2FleetOnDemandOptionsCapacityReservationOptions capacityReservationOptions;
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
            this.capacityReservationOptions = software.amazon.jsii.Kernel.get(this, "capacityReservationOptions", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetOnDemandOptionsCapacityReservationOptions.class));
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
            this.capacityReservationOptions = builder.capacityReservationOptions;
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
        public final imports.aws.ec2_fleet.Ec2FleetOnDemandOptionsCapacityReservationOptions getCapacityReservationOptions() {
            return this.capacityReservationOptions;
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
            if (this.getCapacityReservationOptions() != null) {
                data.set("capacityReservationOptions", om.valueToTree(this.getCapacityReservationOptions()));
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
            struct.set("fqn", om.valueToTree("aws.ec2Fleet.Ec2FleetOnDemandOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2FleetOnDemandOptions.Jsii$Proxy that = (Ec2FleetOnDemandOptions.Jsii$Proxy) o;

            if (this.allocationStrategy != null ? !this.allocationStrategy.equals(that.allocationStrategy) : that.allocationStrategy != null) return false;
            if (this.capacityReservationOptions != null ? !this.capacityReservationOptions.equals(that.capacityReservationOptions) : that.capacityReservationOptions != null) return false;
            if (this.maxTotalPrice != null ? !this.maxTotalPrice.equals(that.maxTotalPrice) : that.maxTotalPrice != null) return false;
            if (this.minTargetCapacity != null ? !this.minTargetCapacity.equals(that.minTargetCapacity) : that.minTargetCapacity != null) return false;
            if (this.singleAvailabilityZone != null ? !this.singleAvailabilityZone.equals(that.singleAvailabilityZone) : that.singleAvailabilityZone != null) return false;
            return this.singleInstanceType != null ? this.singleInstanceType.equals(that.singleInstanceType) : that.singleInstanceType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.allocationStrategy != null ? this.allocationStrategy.hashCode() : 0;
            result = 31 * result + (this.capacityReservationOptions != null ? this.capacityReservationOptions.hashCode() : 0);
            result = 31 * result + (this.maxTotalPrice != null ? this.maxTotalPrice.hashCode() : 0);
            result = 31 * result + (this.minTargetCapacity != null ? this.minTargetCapacity.hashCode() : 0);
            result = 31 * result + (this.singleAvailabilityZone != null ? this.singleAvailabilityZone.hashCode() : 0);
            result = 31 * result + (this.singleInstanceType != null ? this.singleInstanceType.hashCode() : 0);
            return result;
        }
    }
}
