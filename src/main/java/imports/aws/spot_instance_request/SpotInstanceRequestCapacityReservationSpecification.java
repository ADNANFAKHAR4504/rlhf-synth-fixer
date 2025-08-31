package imports.aws.spot_instance_request;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.487Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.spotInstanceRequest.SpotInstanceRequestCapacityReservationSpecification")
@software.amazon.jsii.Jsii.Proxy(SpotInstanceRequestCapacityReservationSpecification.Jsii$Proxy.class)
public interface SpotInstanceRequestCapacityReservationSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#capacity_reservation_preference SpotInstanceRequest#capacity_reservation_preference}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCapacityReservationPreference() {
        return null;
    }

    /**
     * capacity_reservation_target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#capacity_reservation_target SpotInstanceRequest#capacity_reservation_target}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestCapacityReservationSpecificationCapacityReservationTarget getCapacityReservationTarget() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SpotInstanceRequestCapacityReservationSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SpotInstanceRequestCapacityReservationSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SpotInstanceRequestCapacityReservationSpecification> {
        java.lang.String capacityReservationPreference;
        imports.aws.spot_instance_request.SpotInstanceRequestCapacityReservationSpecificationCapacityReservationTarget capacityReservationTarget;

        /**
         * Sets the value of {@link SpotInstanceRequestCapacityReservationSpecification#getCapacityReservationPreference}
         * @param capacityReservationPreference Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#capacity_reservation_preference SpotInstanceRequest#capacity_reservation_preference}.
         * @return {@code this}
         */
        public Builder capacityReservationPreference(java.lang.String capacityReservationPreference) {
            this.capacityReservationPreference = capacityReservationPreference;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestCapacityReservationSpecification#getCapacityReservationTarget}
         * @param capacityReservationTarget capacity_reservation_target block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#capacity_reservation_target SpotInstanceRequest#capacity_reservation_target}
         * @return {@code this}
         */
        public Builder capacityReservationTarget(imports.aws.spot_instance_request.SpotInstanceRequestCapacityReservationSpecificationCapacityReservationTarget capacityReservationTarget) {
            this.capacityReservationTarget = capacityReservationTarget;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SpotInstanceRequestCapacityReservationSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SpotInstanceRequestCapacityReservationSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SpotInstanceRequestCapacityReservationSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SpotInstanceRequestCapacityReservationSpecification {
        private final java.lang.String capacityReservationPreference;
        private final imports.aws.spot_instance_request.SpotInstanceRequestCapacityReservationSpecificationCapacityReservationTarget capacityReservationTarget;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.capacityReservationPreference = software.amazon.jsii.Kernel.get(this, "capacityReservationPreference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.capacityReservationTarget = software.amazon.jsii.Kernel.get(this, "capacityReservationTarget", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestCapacityReservationSpecificationCapacityReservationTarget.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.capacityReservationPreference = builder.capacityReservationPreference;
            this.capacityReservationTarget = builder.capacityReservationTarget;
        }

        @Override
        public final java.lang.String getCapacityReservationPreference() {
            return this.capacityReservationPreference;
        }

        @Override
        public final imports.aws.spot_instance_request.SpotInstanceRequestCapacityReservationSpecificationCapacityReservationTarget getCapacityReservationTarget() {
            return this.capacityReservationTarget;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCapacityReservationPreference() != null) {
                data.set("capacityReservationPreference", om.valueToTree(this.getCapacityReservationPreference()));
            }
            if (this.getCapacityReservationTarget() != null) {
                data.set("capacityReservationTarget", om.valueToTree(this.getCapacityReservationTarget()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.spotInstanceRequest.SpotInstanceRequestCapacityReservationSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SpotInstanceRequestCapacityReservationSpecification.Jsii$Proxy that = (SpotInstanceRequestCapacityReservationSpecification.Jsii$Proxy) o;

            if (this.capacityReservationPreference != null ? !this.capacityReservationPreference.equals(that.capacityReservationPreference) : that.capacityReservationPreference != null) return false;
            return this.capacityReservationTarget != null ? this.capacityReservationTarget.equals(that.capacityReservationTarget) : that.capacityReservationTarget == null;
        }

        @Override
        public final int hashCode() {
            int result = this.capacityReservationPreference != null ? this.capacityReservationPreference.hashCode() : 0;
            result = 31 * result + (this.capacityReservationTarget != null ? this.capacityReservationTarget.hashCode() : 0);
            return result;
        }
    }
}
