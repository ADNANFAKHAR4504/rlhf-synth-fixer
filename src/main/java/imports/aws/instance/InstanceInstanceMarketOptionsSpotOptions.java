package imports.aws.instance;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.392Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.instance.InstanceInstanceMarketOptionsSpotOptions")
@software.amazon.jsii.Jsii.Proxy(InstanceInstanceMarketOptionsSpotOptions.Jsii$Proxy.class)
public interface InstanceInstanceMarketOptionsSpotOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#instance_interruption_behavior Instance#instance_interruption_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceInterruptionBehavior() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#max_price Instance#max_price}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMaxPrice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#spot_instance_type Instance#spot_instance_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSpotInstanceType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#valid_until Instance#valid_until}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getValidUntil() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link InstanceInstanceMarketOptionsSpotOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link InstanceInstanceMarketOptionsSpotOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<InstanceInstanceMarketOptionsSpotOptions> {
        java.lang.String instanceInterruptionBehavior;
        java.lang.String maxPrice;
        java.lang.String spotInstanceType;
        java.lang.String validUntil;

        /**
         * Sets the value of {@link InstanceInstanceMarketOptionsSpotOptions#getInstanceInterruptionBehavior}
         * @param instanceInterruptionBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#instance_interruption_behavior Instance#instance_interruption_behavior}.
         * @return {@code this}
         */
        public Builder instanceInterruptionBehavior(java.lang.String instanceInterruptionBehavior) {
            this.instanceInterruptionBehavior = instanceInterruptionBehavior;
            return this;
        }

        /**
         * Sets the value of {@link InstanceInstanceMarketOptionsSpotOptions#getMaxPrice}
         * @param maxPrice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#max_price Instance#max_price}.
         * @return {@code this}
         */
        public Builder maxPrice(java.lang.String maxPrice) {
            this.maxPrice = maxPrice;
            return this;
        }

        /**
         * Sets the value of {@link InstanceInstanceMarketOptionsSpotOptions#getSpotInstanceType}
         * @param spotInstanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#spot_instance_type Instance#spot_instance_type}.
         * @return {@code this}
         */
        public Builder spotInstanceType(java.lang.String spotInstanceType) {
            this.spotInstanceType = spotInstanceType;
            return this;
        }

        /**
         * Sets the value of {@link InstanceInstanceMarketOptionsSpotOptions#getValidUntil}
         * @param validUntil Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#valid_until Instance#valid_until}.
         * @return {@code this}
         */
        public Builder validUntil(java.lang.String validUntil) {
            this.validUntil = validUntil;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link InstanceInstanceMarketOptionsSpotOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public InstanceInstanceMarketOptionsSpotOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link InstanceInstanceMarketOptionsSpotOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements InstanceInstanceMarketOptionsSpotOptions {
        private final java.lang.String instanceInterruptionBehavior;
        private final java.lang.String maxPrice;
        private final java.lang.String spotInstanceType;
        private final java.lang.String validUntil;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.instanceInterruptionBehavior = software.amazon.jsii.Kernel.get(this, "instanceInterruptionBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxPrice = software.amazon.jsii.Kernel.get(this, "maxPrice", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.spotInstanceType = software.amazon.jsii.Kernel.get(this, "spotInstanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.validUntil = software.amazon.jsii.Kernel.get(this, "validUntil", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.instanceInterruptionBehavior = builder.instanceInterruptionBehavior;
            this.maxPrice = builder.maxPrice;
            this.spotInstanceType = builder.spotInstanceType;
            this.validUntil = builder.validUntil;
        }

        @Override
        public final java.lang.String getInstanceInterruptionBehavior() {
            return this.instanceInterruptionBehavior;
        }

        @Override
        public final java.lang.String getMaxPrice() {
            return this.maxPrice;
        }

        @Override
        public final java.lang.String getSpotInstanceType() {
            return this.spotInstanceType;
        }

        @Override
        public final java.lang.String getValidUntil() {
            return this.validUntil;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getInstanceInterruptionBehavior() != null) {
                data.set("instanceInterruptionBehavior", om.valueToTree(this.getInstanceInterruptionBehavior()));
            }
            if (this.getMaxPrice() != null) {
                data.set("maxPrice", om.valueToTree(this.getMaxPrice()));
            }
            if (this.getSpotInstanceType() != null) {
                data.set("spotInstanceType", om.valueToTree(this.getSpotInstanceType()));
            }
            if (this.getValidUntil() != null) {
                data.set("validUntil", om.valueToTree(this.getValidUntil()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.instance.InstanceInstanceMarketOptionsSpotOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            InstanceInstanceMarketOptionsSpotOptions.Jsii$Proxy that = (InstanceInstanceMarketOptionsSpotOptions.Jsii$Proxy) o;

            if (this.instanceInterruptionBehavior != null ? !this.instanceInterruptionBehavior.equals(that.instanceInterruptionBehavior) : that.instanceInterruptionBehavior != null) return false;
            if (this.maxPrice != null ? !this.maxPrice.equals(that.maxPrice) : that.maxPrice != null) return false;
            if (this.spotInstanceType != null ? !this.spotInstanceType.equals(that.spotInstanceType) : that.spotInstanceType != null) return false;
            return this.validUntil != null ? this.validUntil.equals(that.validUntil) : that.validUntil == null;
        }

        @Override
        public final int hashCode() {
            int result = this.instanceInterruptionBehavior != null ? this.instanceInterruptionBehavior.hashCode() : 0;
            result = 31 * result + (this.maxPrice != null ? this.maxPrice.hashCode() : 0);
            result = 31 * result + (this.spotInstanceType != null ? this.spotInstanceType.hashCode() : 0);
            result = 31 * result + (this.validUntil != null ? this.validUntil.hashCode() : 0);
            return result;
        }
    }
}
