package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.091Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget")
@software.amazon.jsii.Jsii.Proxy(AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget.Jsii$Proxy.class)
public interface AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_ids AutoscalingGroup#capacity_reservation_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCapacityReservationIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_resource_group_arns AutoscalingGroup#capacity_reservation_resource_group_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCapacityReservationResourceGroupArns() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget> {
        java.util.List<java.lang.String> capacityReservationIds;
        java.util.List<java.lang.String> capacityReservationResourceGroupArns;

        /**
         * Sets the value of {@link AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget#getCapacityReservationIds}
         * @param capacityReservationIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_ids AutoscalingGroup#capacity_reservation_ids}.
         * @return {@code this}
         */
        public Builder capacityReservationIds(java.util.List<java.lang.String> capacityReservationIds) {
            this.capacityReservationIds = capacityReservationIds;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget#getCapacityReservationResourceGroupArns}
         * @param capacityReservationResourceGroupArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#capacity_reservation_resource_group_arns AutoscalingGroup#capacity_reservation_resource_group_arns}.
         * @return {@code this}
         */
        public Builder capacityReservationResourceGroupArns(java.util.List<java.lang.String> capacityReservationResourceGroupArns) {
            this.capacityReservationResourceGroupArns = capacityReservationResourceGroupArns;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget {
        private final java.util.List<java.lang.String> capacityReservationIds;
        private final java.util.List<java.lang.String> capacityReservationResourceGroupArns;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.capacityReservationIds = software.amazon.jsii.Kernel.get(this, "capacityReservationIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.capacityReservationResourceGroupArns = software.amazon.jsii.Kernel.get(this, "capacityReservationResourceGroupArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.capacityReservationIds = builder.capacityReservationIds;
            this.capacityReservationResourceGroupArns = builder.capacityReservationResourceGroupArns;
        }

        @Override
        public final java.util.List<java.lang.String> getCapacityReservationIds() {
            return this.capacityReservationIds;
        }

        @Override
        public final java.util.List<java.lang.String> getCapacityReservationResourceGroupArns() {
            return this.capacityReservationResourceGroupArns;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCapacityReservationIds() != null) {
                data.set("capacityReservationIds", om.valueToTree(this.getCapacityReservationIds()));
            }
            if (this.getCapacityReservationResourceGroupArns() != null) {
                data.set("capacityReservationResourceGroupArns", om.valueToTree(this.getCapacityReservationResourceGroupArns()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingGroup.AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget.Jsii$Proxy that = (AutoscalingGroupCapacityReservationSpecificationCapacityReservationTarget.Jsii$Proxy) o;

            if (this.capacityReservationIds != null ? !this.capacityReservationIds.equals(that.capacityReservationIds) : that.capacityReservationIds != null) return false;
            return this.capacityReservationResourceGroupArns != null ? this.capacityReservationResourceGroupArns.equals(that.capacityReservationResourceGroupArns) : that.capacityReservationResourceGroupArns == null;
        }

        @Override
        public final int hashCode() {
            int result = this.capacityReservationIds != null ? this.capacityReservationIds.hashCode() : 0;
            result = 31 * result + (this.capacityReservationResourceGroupArns != null ? this.capacityReservationResourceGroupArns.hashCode() : 0);
            return result;
        }
    }
}
