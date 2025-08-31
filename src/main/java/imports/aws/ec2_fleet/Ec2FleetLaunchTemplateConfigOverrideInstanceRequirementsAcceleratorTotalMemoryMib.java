package imports.aws.ec2_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.076Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib")
@software.amazon.jsii.Jsii.Proxy(Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib.Jsii$Proxy.class)
public interface Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMax() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMin() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib> {
        java.lang.Number max;
        java.lang.Number min;

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib#getMax}
         * @param max Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max Ec2Fleet#max}.
         * @return {@code this}
         */
        public Builder max(java.lang.Number max) {
            this.max = max;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib#getMin}
         * @param min Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#min Ec2Fleet#min}.
         * @return {@code this}
         */
        public Builder min(java.lang.Number min) {
            this.min = min;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib {
        private final java.lang.Number max;
        private final java.lang.Number min;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.max = software.amazon.jsii.Kernel.get(this, "max", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.min = software.amazon.jsii.Kernel.get(this, "min", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.max = builder.max;
            this.min = builder.min;
        }

        @Override
        public final java.lang.Number getMax() {
            return this.max;
        }

        @Override
        public final java.lang.Number getMin() {
            return this.min;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMax() != null) {
                data.set("max", om.valueToTree(this.getMax()));
            }
            if (this.getMin() != null) {
                data.set("min", om.valueToTree(this.getMin()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib.Jsii$Proxy that = (Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib.Jsii$Proxy) o;

            if (this.max != null ? !this.max.equals(that.max) : that.max != null) return false;
            return this.min != null ? this.min.equals(that.min) : that.min == null;
        }

        @Override
        public final int hashCode() {
            int result = this.max != null ? this.max.hashCode() : 0;
            result = 31 * result + (this.min != null ? this.min.hashCode() : 0);
            return result;
        }
    }
}
