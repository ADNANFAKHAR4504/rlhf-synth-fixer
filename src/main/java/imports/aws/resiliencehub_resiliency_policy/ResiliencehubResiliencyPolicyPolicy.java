package imports.aws.resiliencehub_resiliency_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.186Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.resiliencehubResiliencyPolicy.ResiliencehubResiliencyPolicyPolicy")
@software.amazon.jsii.Jsii.Proxy(ResiliencehubResiliencyPolicyPolicy.Jsii$Proxy.class)
public interface ResiliencehubResiliencyPolicyPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * az block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#az ResiliencehubResiliencyPolicy#az}
     */
    @org.jetbrains.annotations.NotNull imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyAz getAz();

    /**
     * hardware block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#hardware ResiliencehubResiliencyPolicy#hardware}
     */
    @org.jetbrains.annotations.NotNull imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyHardware getHardware();

    /**
     * software block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#software ResiliencehubResiliencyPolicy#software}
     */
    @org.jetbrains.annotations.NotNull imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicySoftware getSoftwareAttribute();

    /**
     * region block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#region ResiliencehubResiliencyPolicy#region}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyRegion getRegion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ResiliencehubResiliencyPolicyPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ResiliencehubResiliencyPolicyPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ResiliencehubResiliencyPolicyPolicy> {
        imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyAz az;
        imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyHardware hardware;
        imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicySoftware softwareAttribute;
        imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyRegion region;

        /**
         * Sets the value of {@link ResiliencehubResiliencyPolicyPolicy#getAz}
         * @param az az block. This parameter is required.
         *           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#az ResiliencehubResiliencyPolicy#az}
         * @return {@code this}
         */
        public Builder az(imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyAz az) {
            this.az = az;
            return this;
        }

        /**
         * Sets the value of {@link ResiliencehubResiliencyPolicyPolicy#getHardware}
         * @param hardware hardware block. This parameter is required.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#hardware ResiliencehubResiliencyPolicy#hardware}
         * @return {@code this}
         */
        public Builder hardware(imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyHardware hardware) {
            this.hardware = hardware;
            return this;
        }

        /**
         * Sets the value of {@link ResiliencehubResiliencyPolicyPolicy#getSoftwareAttribute}
         * @param softwareAttribute software block. This parameter is required.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#software ResiliencehubResiliencyPolicy#software}
         * @return {@code this}
         */
        public Builder softwareAttribute(imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicySoftware softwareAttribute) {
            this.softwareAttribute = softwareAttribute;
            return this;
        }

        /**
         * Sets the value of {@link ResiliencehubResiliencyPolicyPolicy#getRegion}
         * @param region region block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resiliencehub_resiliency_policy#region ResiliencehubResiliencyPolicy#region}
         * @return {@code this}
         */
        public Builder region(imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyRegion region) {
            this.region = region;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ResiliencehubResiliencyPolicyPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ResiliencehubResiliencyPolicyPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ResiliencehubResiliencyPolicyPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ResiliencehubResiliencyPolicyPolicy {
        private final imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyAz az;
        private final imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyHardware hardware;
        private final imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicySoftware softwareAttribute;
        private final imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyRegion region;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.az = software.amazon.jsii.Kernel.get(this, "az", software.amazon.jsii.NativeType.forClass(imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyAz.class));
            this.hardware = software.amazon.jsii.Kernel.get(this, "hardware", software.amazon.jsii.NativeType.forClass(imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyHardware.class));
            this.softwareAttribute = software.amazon.jsii.Kernel.get(this, "softwareAttribute", software.amazon.jsii.NativeType.forClass(imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicySoftware.class));
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyRegion.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.az = java.util.Objects.requireNonNull(builder.az, "az is required");
            this.hardware = java.util.Objects.requireNonNull(builder.hardware, "hardware is required");
            this.softwareAttribute = java.util.Objects.requireNonNull(builder.softwareAttribute, "softwareAttribute is required");
            this.region = builder.region;
        }

        @Override
        public final imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyAz getAz() {
            return this.az;
        }

        @Override
        public final imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyHardware getHardware() {
            return this.hardware;
        }

        @Override
        public final imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicySoftware getSoftwareAttribute() {
            return this.softwareAttribute;
        }

        @Override
        public final imports.aws.resiliencehub_resiliency_policy.ResiliencehubResiliencyPolicyPolicyRegion getRegion() {
            return this.region;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("az", om.valueToTree(this.getAz()));
            data.set("hardware", om.valueToTree(this.getHardware()));
            data.set("softwareAttribute", om.valueToTree(this.getSoftwareAttribute()));
            if (this.getRegion() != null) {
                data.set("region", om.valueToTree(this.getRegion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.resiliencehubResiliencyPolicy.ResiliencehubResiliencyPolicyPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ResiliencehubResiliencyPolicyPolicy.Jsii$Proxy that = (ResiliencehubResiliencyPolicyPolicy.Jsii$Proxy) o;

            if (!az.equals(that.az)) return false;
            if (!hardware.equals(that.hardware)) return false;
            if (!softwareAttribute.equals(that.softwareAttribute)) return false;
            return this.region != null ? this.region.equals(that.region) : that.region == null;
        }

        @Override
        public final int hashCode() {
            int result = this.az.hashCode();
            result = 31 * result + (this.hardware.hashCode());
            result = 31 * result + (this.softwareAttribute.hashCode());
            result = 31 * result + (this.region != null ? this.region.hashCode() : 0);
            return result;
        }
    }
}
