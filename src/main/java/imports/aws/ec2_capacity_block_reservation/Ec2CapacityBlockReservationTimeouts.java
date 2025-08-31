package imports.aws.ec2_capacity_block_reservation;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.066Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2CapacityBlockReservation.Ec2CapacityBlockReservationTimeouts")
@software.amazon.jsii.Jsii.Proxy(Ec2CapacityBlockReservationTimeouts.Jsii$Proxy.class)
public interface Ec2CapacityBlockReservationTimeouts extends software.amazon.jsii.JsiiSerializable {

    /**
     * A string that can be <a href="https://pkg.go.dev/time#ParseDuration">parsed as a duration</a> consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours).
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_block_reservation#create Ec2CapacityBlockReservation#create}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCreate() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2CapacityBlockReservationTimeouts}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2CapacityBlockReservationTimeouts}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2CapacityBlockReservationTimeouts> {
        java.lang.String create;

        /**
         * Sets the value of {@link Ec2CapacityBlockReservationTimeouts#getCreate}
         * @param create A string that can be <a href="https://pkg.go.dev/time#ParseDuration">parsed as a duration</a> consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours).
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_capacity_block_reservation#create Ec2CapacityBlockReservation#create}
         * @return {@code this}
         */
        public Builder create(java.lang.String create) {
            this.create = create;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Ec2CapacityBlockReservationTimeouts}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2CapacityBlockReservationTimeouts build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2CapacityBlockReservationTimeouts}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2CapacityBlockReservationTimeouts {
        private final java.lang.String create;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.create = software.amazon.jsii.Kernel.get(this, "create", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.create = builder.create;
        }

        @Override
        public final java.lang.String getCreate() {
            return this.create;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCreate() != null) {
                data.set("create", om.valueToTree(this.getCreate()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ec2CapacityBlockReservation.Ec2CapacityBlockReservationTimeouts"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2CapacityBlockReservationTimeouts.Jsii$Proxy that = (Ec2CapacityBlockReservationTimeouts.Jsii$Proxy) o;

            return this.create != null ? this.create.equals(that.create) : that.create == null;
        }

        @Override
        public final int hashCode() {
            int result = this.create != null ? this.create.hashCode() : 0;
            return result;
        }
    }
}
