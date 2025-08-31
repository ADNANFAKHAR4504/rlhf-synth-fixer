package imports.aws.launch_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.515Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchTemplate.LaunchTemplateCapacityReservationSpecificationCapacityReservationTarget")
@software.amazon.jsii.Jsii.Proxy(LaunchTemplateCapacityReservationSpecificationCapacityReservationTarget.Jsii$Proxy.class)
public interface LaunchTemplateCapacityReservationSpecificationCapacityReservationTarget extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#capacity_reservation_id LaunchTemplate#capacity_reservation_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCapacityReservationId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#capacity_reservation_resource_group_arn LaunchTemplate#capacity_reservation_resource_group_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCapacityReservationResourceGroupArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LaunchTemplateCapacityReservationSpecificationCapacityReservationTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LaunchTemplateCapacityReservationSpecificationCapacityReservationTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LaunchTemplateCapacityReservationSpecificationCapacityReservationTarget> {
        java.lang.String capacityReservationId;
        java.lang.String capacityReservationResourceGroupArn;

        /**
         * Sets the value of {@link LaunchTemplateCapacityReservationSpecificationCapacityReservationTarget#getCapacityReservationId}
         * @param capacityReservationId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#capacity_reservation_id LaunchTemplate#capacity_reservation_id}.
         * @return {@code this}
         */
        public Builder capacityReservationId(java.lang.String capacityReservationId) {
            this.capacityReservationId = capacityReservationId;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateCapacityReservationSpecificationCapacityReservationTarget#getCapacityReservationResourceGroupArn}
         * @param capacityReservationResourceGroupArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#capacity_reservation_resource_group_arn LaunchTemplate#capacity_reservation_resource_group_arn}.
         * @return {@code this}
         */
        public Builder capacityReservationResourceGroupArn(java.lang.String capacityReservationResourceGroupArn) {
            this.capacityReservationResourceGroupArn = capacityReservationResourceGroupArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LaunchTemplateCapacityReservationSpecificationCapacityReservationTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LaunchTemplateCapacityReservationSpecificationCapacityReservationTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LaunchTemplateCapacityReservationSpecificationCapacityReservationTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LaunchTemplateCapacityReservationSpecificationCapacityReservationTarget {
        private final java.lang.String capacityReservationId;
        private final java.lang.String capacityReservationResourceGroupArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.capacityReservationId = software.amazon.jsii.Kernel.get(this, "capacityReservationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.capacityReservationResourceGroupArn = software.amazon.jsii.Kernel.get(this, "capacityReservationResourceGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.capacityReservationId = builder.capacityReservationId;
            this.capacityReservationResourceGroupArn = builder.capacityReservationResourceGroupArn;
        }

        @Override
        public final java.lang.String getCapacityReservationId() {
            return this.capacityReservationId;
        }

        @Override
        public final java.lang.String getCapacityReservationResourceGroupArn() {
            return this.capacityReservationResourceGroupArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCapacityReservationId() != null) {
                data.set("capacityReservationId", om.valueToTree(this.getCapacityReservationId()));
            }
            if (this.getCapacityReservationResourceGroupArn() != null) {
                data.set("capacityReservationResourceGroupArn", om.valueToTree(this.getCapacityReservationResourceGroupArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.launchTemplate.LaunchTemplateCapacityReservationSpecificationCapacityReservationTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LaunchTemplateCapacityReservationSpecificationCapacityReservationTarget.Jsii$Proxy that = (LaunchTemplateCapacityReservationSpecificationCapacityReservationTarget.Jsii$Proxy) o;

            if (this.capacityReservationId != null ? !this.capacityReservationId.equals(that.capacityReservationId) : that.capacityReservationId != null) return false;
            return this.capacityReservationResourceGroupArn != null ? this.capacityReservationResourceGroupArn.equals(that.capacityReservationResourceGroupArn) : that.capacityReservationResourceGroupArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.capacityReservationId != null ? this.capacityReservationId.hashCode() : 0;
            result = 31 * result + (this.capacityReservationResourceGroupArn != null ? this.capacityReservationResourceGroupArn.hashCode() : 0);
            return result;
        }
    }
}
