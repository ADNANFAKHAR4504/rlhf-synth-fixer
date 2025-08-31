package imports.aws.emr_managed_scaling_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.205Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrManagedScalingPolicy.EmrManagedScalingPolicyComputeLimits")
@software.amazon.jsii.Jsii.Proxy(EmrManagedScalingPolicyComputeLimits.Jsii$Proxy.class)
public interface EmrManagedScalingPolicyComputeLimits extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_managed_scaling_policy#maximum_capacity_units EmrManagedScalingPolicy#maximum_capacity_units}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaximumCapacityUnits();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_managed_scaling_policy#minimum_capacity_units EmrManagedScalingPolicy#minimum_capacity_units}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMinimumCapacityUnits();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_managed_scaling_policy#unit_type EmrManagedScalingPolicy#unit_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUnitType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_managed_scaling_policy#maximum_core_capacity_units EmrManagedScalingPolicy#maximum_core_capacity_units}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumCoreCapacityUnits() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_managed_scaling_policy#maximum_ondemand_capacity_units EmrManagedScalingPolicy#maximum_ondemand_capacity_units}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumOndemandCapacityUnits() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrManagedScalingPolicyComputeLimits}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrManagedScalingPolicyComputeLimits}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrManagedScalingPolicyComputeLimits> {
        java.lang.Number maximumCapacityUnits;
        java.lang.Number minimumCapacityUnits;
        java.lang.String unitType;
        java.lang.Number maximumCoreCapacityUnits;
        java.lang.Number maximumOndemandCapacityUnits;

        /**
         * Sets the value of {@link EmrManagedScalingPolicyComputeLimits#getMaximumCapacityUnits}
         * @param maximumCapacityUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_managed_scaling_policy#maximum_capacity_units EmrManagedScalingPolicy#maximum_capacity_units}. This parameter is required.
         * @return {@code this}
         */
        public Builder maximumCapacityUnits(java.lang.Number maximumCapacityUnits) {
            this.maximumCapacityUnits = maximumCapacityUnits;
            return this;
        }

        /**
         * Sets the value of {@link EmrManagedScalingPolicyComputeLimits#getMinimumCapacityUnits}
         * @param minimumCapacityUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_managed_scaling_policy#minimum_capacity_units EmrManagedScalingPolicy#minimum_capacity_units}. This parameter is required.
         * @return {@code this}
         */
        public Builder minimumCapacityUnits(java.lang.Number minimumCapacityUnits) {
            this.minimumCapacityUnits = minimumCapacityUnits;
            return this;
        }

        /**
         * Sets the value of {@link EmrManagedScalingPolicyComputeLimits#getUnitType}
         * @param unitType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_managed_scaling_policy#unit_type EmrManagedScalingPolicy#unit_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder unitType(java.lang.String unitType) {
            this.unitType = unitType;
            return this;
        }

        /**
         * Sets the value of {@link EmrManagedScalingPolicyComputeLimits#getMaximumCoreCapacityUnits}
         * @param maximumCoreCapacityUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_managed_scaling_policy#maximum_core_capacity_units EmrManagedScalingPolicy#maximum_core_capacity_units}.
         * @return {@code this}
         */
        public Builder maximumCoreCapacityUnits(java.lang.Number maximumCoreCapacityUnits) {
            this.maximumCoreCapacityUnits = maximumCoreCapacityUnits;
            return this;
        }

        /**
         * Sets the value of {@link EmrManagedScalingPolicyComputeLimits#getMaximumOndemandCapacityUnits}
         * @param maximumOndemandCapacityUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_managed_scaling_policy#maximum_ondemand_capacity_units EmrManagedScalingPolicy#maximum_ondemand_capacity_units}.
         * @return {@code this}
         */
        public Builder maximumOndemandCapacityUnits(java.lang.Number maximumOndemandCapacityUnits) {
            this.maximumOndemandCapacityUnits = maximumOndemandCapacityUnits;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrManagedScalingPolicyComputeLimits}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrManagedScalingPolicyComputeLimits build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrManagedScalingPolicyComputeLimits}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrManagedScalingPolicyComputeLimits {
        private final java.lang.Number maximumCapacityUnits;
        private final java.lang.Number minimumCapacityUnits;
        private final java.lang.String unitType;
        private final java.lang.Number maximumCoreCapacityUnits;
        private final java.lang.Number maximumOndemandCapacityUnits;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maximumCapacityUnits = software.amazon.jsii.Kernel.get(this, "maximumCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minimumCapacityUnits = software.amazon.jsii.Kernel.get(this, "minimumCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.unitType = software.amazon.jsii.Kernel.get(this, "unitType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maximumCoreCapacityUnits = software.amazon.jsii.Kernel.get(this, "maximumCoreCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maximumOndemandCapacityUnits = software.amazon.jsii.Kernel.get(this, "maximumOndemandCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maximumCapacityUnits = java.util.Objects.requireNonNull(builder.maximumCapacityUnits, "maximumCapacityUnits is required");
            this.minimumCapacityUnits = java.util.Objects.requireNonNull(builder.minimumCapacityUnits, "minimumCapacityUnits is required");
            this.unitType = java.util.Objects.requireNonNull(builder.unitType, "unitType is required");
            this.maximumCoreCapacityUnits = builder.maximumCoreCapacityUnits;
            this.maximumOndemandCapacityUnits = builder.maximumOndemandCapacityUnits;
        }

        @Override
        public final java.lang.Number getMaximumCapacityUnits() {
            return this.maximumCapacityUnits;
        }

        @Override
        public final java.lang.Number getMinimumCapacityUnits() {
            return this.minimumCapacityUnits;
        }

        @Override
        public final java.lang.String getUnitType() {
            return this.unitType;
        }

        @Override
        public final java.lang.Number getMaximumCoreCapacityUnits() {
            return this.maximumCoreCapacityUnits;
        }

        @Override
        public final java.lang.Number getMaximumOndemandCapacityUnits() {
            return this.maximumOndemandCapacityUnits;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("maximumCapacityUnits", om.valueToTree(this.getMaximumCapacityUnits()));
            data.set("minimumCapacityUnits", om.valueToTree(this.getMinimumCapacityUnits()));
            data.set("unitType", om.valueToTree(this.getUnitType()));
            if (this.getMaximumCoreCapacityUnits() != null) {
                data.set("maximumCoreCapacityUnits", om.valueToTree(this.getMaximumCoreCapacityUnits()));
            }
            if (this.getMaximumOndemandCapacityUnits() != null) {
                data.set("maximumOndemandCapacityUnits", om.valueToTree(this.getMaximumOndemandCapacityUnits()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrManagedScalingPolicy.EmrManagedScalingPolicyComputeLimits"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrManagedScalingPolicyComputeLimits.Jsii$Proxy that = (EmrManagedScalingPolicyComputeLimits.Jsii$Proxy) o;

            if (!maximumCapacityUnits.equals(that.maximumCapacityUnits)) return false;
            if (!minimumCapacityUnits.equals(that.minimumCapacityUnits)) return false;
            if (!unitType.equals(that.unitType)) return false;
            if (this.maximumCoreCapacityUnits != null ? !this.maximumCoreCapacityUnits.equals(that.maximumCoreCapacityUnits) : that.maximumCoreCapacityUnits != null) return false;
            return this.maximumOndemandCapacityUnits != null ? this.maximumOndemandCapacityUnits.equals(that.maximumOndemandCapacityUnits) : that.maximumOndemandCapacityUnits == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maximumCapacityUnits.hashCode();
            result = 31 * result + (this.minimumCapacityUnits.hashCode());
            result = 31 * result + (this.unitType.hashCode());
            result = 31 * result + (this.maximumCoreCapacityUnits != null ? this.maximumCoreCapacityUnits.hashCode() : 0);
            result = 31 * result + (this.maximumOndemandCapacityUnits != null ? this.maximumOndemandCapacityUnits.hashCode() : 0);
            return result;
        }
    }
}
