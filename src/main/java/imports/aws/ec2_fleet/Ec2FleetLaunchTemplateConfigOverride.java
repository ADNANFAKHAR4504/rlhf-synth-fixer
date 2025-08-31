package imports.aws.ec2_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.076Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverride")
@software.amazon.jsii.Jsii.Proxy(Ec2FleetLaunchTemplateConfigOverride.Jsii$Proxy.class)
public interface Ec2FleetLaunchTemplateConfigOverride extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#availability_zone Ec2Fleet#availability_zone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZone() {
        return null;
    }

    /**
     * instance_requirements block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_requirements Ec2Fleet#instance_requirements}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements getInstanceRequirements() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_type Ec2Fleet#instance_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max_price Ec2Fleet#max_price}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMaxPrice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#priority Ec2Fleet#priority}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPriority() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#subnet_id Ec2Fleet#subnet_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubnetId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#weighted_capacity Ec2Fleet#weighted_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getWeightedCapacity() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2FleetLaunchTemplateConfigOverride}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2FleetLaunchTemplateConfigOverride}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2FleetLaunchTemplateConfigOverride> {
        java.lang.String availabilityZone;
        imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements instanceRequirements;
        java.lang.String instanceType;
        java.lang.String maxPrice;
        java.lang.Number priority;
        java.lang.String subnetId;
        java.lang.Number weightedCapacity;

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverride#getAvailabilityZone}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#availability_zone Ec2Fleet#availability_zone}.
         * @return {@code this}
         */
        public Builder availabilityZone(java.lang.String availabilityZone) {
            this.availabilityZone = availabilityZone;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverride#getInstanceRequirements}
         * @param instanceRequirements instance_requirements block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_requirements Ec2Fleet#instance_requirements}
         * @return {@code this}
         */
        public Builder instanceRequirements(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements instanceRequirements) {
            this.instanceRequirements = instanceRequirements;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverride#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_type Ec2Fleet#instance_type}.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverride#getMaxPrice}
         * @param maxPrice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max_price Ec2Fleet#max_price}.
         * @return {@code this}
         */
        public Builder maxPrice(java.lang.String maxPrice) {
            this.maxPrice = maxPrice;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverride#getPriority}
         * @param priority Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#priority Ec2Fleet#priority}.
         * @return {@code this}
         */
        public Builder priority(java.lang.Number priority) {
            this.priority = priority;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverride#getSubnetId}
         * @param subnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#subnet_id Ec2Fleet#subnet_id}.
         * @return {@code this}
         */
        public Builder subnetId(java.lang.String subnetId) {
            this.subnetId = subnetId;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverride#getWeightedCapacity}
         * @param weightedCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#weighted_capacity Ec2Fleet#weighted_capacity}.
         * @return {@code this}
         */
        public Builder weightedCapacity(java.lang.Number weightedCapacity) {
            this.weightedCapacity = weightedCapacity;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Ec2FleetLaunchTemplateConfigOverride}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2FleetLaunchTemplateConfigOverride build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2FleetLaunchTemplateConfigOverride}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2FleetLaunchTemplateConfigOverride {
        private final java.lang.String availabilityZone;
        private final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements instanceRequirements;
        private final java.lang.String instanceType;
        private final java.lang.String maxPrice;
        private final java.lang.Number priority;
        private final java.lang.String subnetId;
        private final java.lang.Number weightedCapacity;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.availabilityZone = software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceRequirements = software.amazon.jsii.Kernel.get(this, "instanceRequirements", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements.class));
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxPrice = software.amazon.jsii.Kernel.get(this, "maxPrice", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.priority = software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.subnetId = software.amazon.jsii.Kernel.get(this, "subnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.weightedCapacity = software.amazon.jsii.Kernel.get(this, "weightedCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.availabilityZone = builder.availabilityZone;
            this.instanceRequirements = builder.instanceRequirements;
            this.instanceType = builder.instanceType;
            this.maxPrice = builder.maxPrice;
            this.priority = builder.priority;
            this.subnetId = builder.subnetId;
            this.weightedCapacity = builder.weightedCapacity;
        }

        @Override
        public final java.lang.String getAvailabilityZone() {
            return this.availabilityZone;
        }

        @Override
        public final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements getInstanceRequirements() {
            return this.instanceRequirements;
        }

        @Override
        public final java.lang.String getInstanceType() {
            return this.instanceType;
        }

        @Override
        public final java.lang.String getMaxPrice() {
            return this.maxPrice;
        }

        @Override
        public final java.lang.Number getPriority() {
            return this.priority;
        }

        @Override
        public final java.lang.String getSubnetId() {
            return this.subnetId;
        }

        @Override
        public final java.lang.Number getWeightedCapacity() {
            return this.weightedCapacity;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAvailabilityZone() != null) {
                data.set("availabilityZone", om.valueToTree(this.getAvailabilityZone()));
            }
            if (this.getInstanceRequirements() != null) {
                data.set("instanceRequirements", om.valueToTree(this.getInstanceRequirements()));
            }
            if (this.getInstanceType() != null) {
                data.set("instanceType", om.valueToTree(this.getInstanceType()));
            }
            if (this.getMaxPrice() != null) {
                data.set("maxPrice", om.valueToTree(this.getMaxPrice()));
            }
            if (this.getPriority() != null) {
                data.set("priority", om.valueToTree(this.getPriority()));
            }
            if (this.getSubnetId() != null) {
                data.set("subnetId", om.valueToTree(this.getSubnetId()));
            }
            if (this.getWeightedCapacity() != null) {
                data.set("weightedCapacity", om.valueToTree(this.getWeightedCapacity()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverride"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2FleetLaunchTemplateConfigOverride.Jsii$Proxy that = (Ec2FleetLaunchTemplateConfigOverride.Jsii$Proxy) o;

            if (this.availabilityZone != null ? !this.availabilityZone.equals(that.availabilityZone) : that.availabilityZone != null) return false;
            if (this.instanceRequirements != null ? !this.instanceRequirements.equals(that.instanceRequirements) : that.instanceRequirements != null) return false;
            if (this.instanceType != null ? !this.instanceType.equals(that.instanceType) : that.instanceType != null) return false;
            if (this.maxPrice != null ? !this.maxPrice.equals(that.maxPrice) : that.maxPrice != null) return false;
            if (this.priority != null ? !this.priority.equals(that.priority) : that.priority != null) return false;
            if (this.subnetId != null ? !this.subnetId.equals(that.subnetId) : that.subnetId != null) return false;
            return this.weightedCapacity != null ? this.weightedCapacity.equals(that.weightedCapacity) : that.weightedCapacity == null;
        }

        @Override
        public final int hashCode() {
            int result = this.availabilityZone != null ? this.availabilityZone.hashCode() : 0;
            result = 31 * result + (this.instanceRequirements != null ? this.instanceRequirements.hashCode() : 0);
            result = 31 * result + (this.instanceType != null ? this.instanceType.hashCode() : 0);
            result = 31 * result + (this.maxPrice != null ? this.maxPrice.hashCode() : 0);
            result = 31 * result + (this.priority != null ? this.priority.hashCode() : 0);
            result = 31 * result + (this.subnetId != null ? this.subnetId.hashCode() : 0);
            result = 31 * result + (this.weightedCapacity != null ? this.weightedCapacity.hashCode() : 0);
            return result;
        }
    }
}
