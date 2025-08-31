package imports.aws.ec2_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.075Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2Fleet.Ec2FleetFleetInstanceSet")
@software.amazon.jsii.Jsii.Proxy(Ec2FleetFleetInstanceSet.Jsii$Proxy.class)
public interface Ec2FleetFleetInstanceSet extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_ids Ec2Fleet#instance_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInstanceIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_type Ec2Fleet#instance_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#lifecycle Ec2Fleet#lifecycle}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLifecycle() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#platform Ec2Fleet#platform}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPlatform() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2FleetFleetInstanceSet}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2FleetFleetInstanceSet}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2FleetFleetInstanceSet> {
        java.util.List<java.lang.String> instanceIds;
        java.lang.String instanceType;
        java.lang.String lifecycle;
        java.lang.String platform;

        /**
         * Sets the value of {@link Ec2FleetFleetInstanceSet#getInstanceIds}
         * @param instanceIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_ids Ec2Fleet#instance_ids}.
         * @return {@code this}
         */
        public Builder instanceIds(java.util.List<java.lang.String> instanceIds) {
            this.instanceIds = instanceIds;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetFleetInstanceSet#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_type Ec2Fleet#instance_type}.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetFleetInstanceSet#getLifecycle}
         * @param lifecycle Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#lifecycle Ec2Fleet#lifecycle}.
         * @return {@code this}
         */
        public Builder lifecycle(java.lang.String lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetFleetInstanceSet#getPlatform}
         * @param platform Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#platform Ec2Fleet#platform}.
         * @return {@code this}
         */
        public Builder platform(java.lang.String platform) {
            this.platform = platform;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Ec2FleetFleetInstanceSet}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2FleetFleetInstanceSet build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2FleetFleetInstanceSet}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2FleetFleetInstanceSet {
        private final java.util.List<java.lang.String> instanceIds;
        private final java.lang.String instanceType;
        private final java.lang.String lifecycle;
        private final java.lang.String platform;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.instanceIds = software.amazon.jsii.Kernel.get(this, "instanceIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.platform = software.amazon.jsii.Kernel.get(this, "platform", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.instanceIds = builder.instanceIds;
            this.instanceType = builder.instanceType;
            this.lifecycle = builder.lifecycle;
            this.platform = builder.platform;
        }

        @Override
        public final java.util.List<java.lang.String> getInstanceIds() {
            return this.instanceIds;
        }

        @Override
        public final java.lang.String getInstanceType() {
            return this.instanceType;
        }

        @Override
        public final java.lang.String getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final java.lang.String getPlatform() {
            return this.platform;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getInstanceIds() != null) {
                data.set("instanceIds", om.valueToTree(this.getInstanceIds()));
            }
            if (this.getInstanceType() != null) {
                data.set("instanceType", om.valueToTree(this.getInstanceType()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getPlatform() != null) {
                data.set("platform", om.valueToTree(this.getPlatform()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ec2Fleet.Ec2FleetFleetInstanceSet"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2FleetFleetInstanceSet.Jsii$Proxy that = (Ec2FleetFleetInstanceSet.Jsii$Proxy) o;

            if (this.instanceIds != null ? !this.instanceIds.equals(that.instanceIds) : that.instanceIds != null) return false;
            if (this.instanceType != null ? !this.instanceType.equals(that.instanceType) : that.instanceType != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            return this.platform != null ? this.platform.equals(that.platform) : that.platform == null;
        }

        @Override
        public final int hashCode() {
            int result = this.instanceIds != null ? this.instanceIds.hashCode() : 0;
            result = 31 * result + (this.instanceType != null ? this.instanceType.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.platform != null ? this.platform.hashCode() : 0);
            return result;
        }
    }
}
