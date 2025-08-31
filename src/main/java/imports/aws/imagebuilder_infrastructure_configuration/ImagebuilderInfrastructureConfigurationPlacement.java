package imports.aws.imagebuilder_infrastructure_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.365Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderInfrastructureConfiguration.ImagebuilderInfrastructureConfigurationPlacement")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderInfrastructureConfigurationPlacement.Jsii$Proxy.class)
public interface ImagebuilderInfrastructureConfigurationPlacement extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#availability_zone ImagebuilderInfrastructureConfiguration#availability_zone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZone() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#host_id ImagebuilderInfrastructureConfiguration#host_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHostId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#host_resource_group_arn ImagebuilderInfrastructureConfiguration#host_resource_group_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHostResourceGroupArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#tenancy ImagebuilderInfrastructureConfiguration#tenancy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTenancy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderInfrastructureConfigurationPlacement}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderInfrastructureConfigurationPlacement}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderInfrastructureConfigurationPlacement> {
        java.lang.String availabilityZone;
        java.lang.String hostId;
        java.lang.String hostResourceGroupArn;
        java.lang.String tenancy;

        /**
         * Sets the value of {@link ImagebuilderInfrastructureConfigurationPlacement#getAvailabilityZone}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#availability_zone ImagebuilderInfrastructureConfiguration#availability_zone}.
         * @return {@code this}
         */
        public Builder availabilityZone(java.lang.String availabilityZone) {
            this.availabilityZone = availabilityZone;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderInfrastructureConfigurationPlacement#getHostId}
         * @param hostId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#host_id ImagebuilderInfrastructureConfiguration#host_id}.
         * @return {@code this}
         */
        public Builder hostId(java.lang.String hostId) {
            this.hostId = hostId;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderInfrastructureConfigurationPlacement#getHostResourceGroupArn}
         * @param hostResourceGroupArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#host_resource_group_arn ImagebuilderInfrastructureConfiguration#host_resource_group_arn}.
         * @return {@code this}
         */
        public Builder hostResourceGroupArn(java.lang.String hostResourceGroupArn) {
            this.hostResourceGroupArn = hostResourceGroupArn;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderInfrastructureConfigurationPlacement#getTenancy}
         * @param tenancy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#tenancy ImagebuilderInfrastructureConfiguration#tenancy}.
         * @return {@code this}
         */
        public Builder tenancy(java.lang.String tenancy) {
            this.tenancy = tenancy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderInfrastructureConfigurationPlacement}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderInfrastructureConfigurationPlacement build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderInfrastructureConfigurationPlacement}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderInfrastructureConfigurationPlacement {
        private final java.lang.String availabilityZone;
        private final java.lang.String hostId;
        private final java.lang.String hostResourceGroupArn;
        private final java.lang.String tenancy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.availabilityZone = software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hostId = software.amazon.jsii.Kernel.get(this, "hostId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hostResourceGroupArn = software.amazon.jsii.Kernel.get(this, "hostResourceGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tenancy = software.amazon.jsii.Kernel.get(this, "tenancy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.availabilityZone = builder.availabilityZone;
            this.hostId = builder.hostId;
            this.hostResourceGroupArn = builder.hostResourceGroupArn;
            this.tenancy = builder.tenancy;
        }

        @Override
        public final java.lang.String getAvailabilityZone() {
            return this.availabilityZone;
        }

        @Override
        public final java.lang.String getHostId() {
            return this.hostId;
        }

        @Override
        public final java.lang.String getHostResourceGroupArn() {
            return this.hostResourceGroupArn;
        }

        @Override
        public final java.lang.String getTenancy() {
            return this.tenancy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAvailabilityZone() != null) {
                data.set("availabilityZone", om.valueToTree(this.getAvailabilityZone()));
            }
            if (this.getHostId() != null) {
                data.set("hostId", om.valueToTree(this.getHostId()));
            }
            if (this.getHostResourceGroupArn() != null) {
                data.set("hostResourceGroupArn", om.valueToTree(this.getHostResourceGroupArn()));
            }
            if (this.getTenancy() != null) {
                data.set("tenancy", om.valueToTree(this.getTenancy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderInfrastructureConfiguration.ImagebuilderInfrastructureConfigurationPlacement"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderInfrastructureConfigurationPlacement.Jsii$Proxy that = (ImagebuilderInfrastructureConfigurationPlacement.Jsii$Proxy) o;

            if (this.availabilityZone != null ? !this.availabilityZone.equals(that.availabilityZone) : that.availabilityZone != null) return false;
            if (this.hostId != null ? !this.hostId.equals(that.hostId) : that.hostId != null) return false;
            if (this.hostResourceGroupArn != null ? !this.hostResourceGroupArn.equals(that.hostResourceGroupArn) : that.hostResourceGroupArn != null) return false;
            return this.tenancy != null ? this.tenancy.equals(that.tenancy) : that.tenancy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.availabilityZone != null ? this.availabilityZone.hashCode() : 0;
            result = 31 * result + (this.hostId != null ? this.hostId.hashCode() : 0);
            result = 31 * result + (this.hostResourceGroupArn != null ? this.hostResourceGroupArn.hashCode() : 0);
            result = 31 * result + (this.tenancy != null ? this.tenancy.hashCode() : 0);
            return result;
        }
    }
}
