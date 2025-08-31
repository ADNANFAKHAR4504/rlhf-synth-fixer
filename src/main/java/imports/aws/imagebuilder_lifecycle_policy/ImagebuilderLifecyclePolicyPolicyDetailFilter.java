package imports.aws.imagebuilder_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.367Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderLifecyclePolicy.ImagebuilderLifecyclePolicyPolicyDetailFilter")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderLifecyclePolicyPolicyDetailFilter.Jsii$Proxy.class)
public interface ImagebuilderLifecyclePolicyPolicyDetailFilter extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#type ImagebuilderLifecyclePolicy#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#value ImagebuilderLifecyclePolicy#value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getValue();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#retain_at_least ImagebuilderLifecyclePolicy#retain_at_least}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRetainAtLeast() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#unit ImagebuilderLifecyclePolicy#unit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUnit() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderLifecyclePolicyPolicyDetailFilter}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderLifecyclePolicyPolicyDetailFilter}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderLifecyclePolicyPolicyDetailFilter> {
        java.lang.String type;
        java.lang.Number value;
        java.lang.Number retainAtLeast;
        java.lang.String unit;

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetailFilter#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#type ImagebuilderLifecyclePolicy#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetailFilter#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#value ImagebuilderLifecyclePolicy#value}. This parameter is required.
         * @return {@code this}
         */
        public Builder value(java.lang.Number value) {
            this.value = value;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetailFilter#getRetainAtLeast}
         * @param retainAtLeast Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#retain_at_least ImagebuilderLifecyclePolicy#retain_at_least}.
         * @return {@code this}
         */
        public Builder retainAtLeast(java.lang.Number retainAtLeast) {
            this.retainAtLeast = retainAtLeast;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetailFilter#getUnit}
         * @param unit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#unit ImagebuilderLifecyclePolicy#unit}.
         * @return {@code this}
         */
        public Builder unit(java.lang.String unit) {
            this.unit = unit;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderLifecyclePolicyPolicyDetailFilter}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderLifecyclePolicyPolicyDetailFilter build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderLifecyclePolicyPolicyDetailFilter}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderLifecyclePolicyPolicyDetailFilter {
        private final java.lang.String type;
        private final java.lang.Number value;
        private final java.lang.Number retainAtLeast;
        private final java.lang.String unit;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.retainAtLeast = software.amazon.jsii.Kernel.get(this, "retainAtLeast", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.unit = software.amazon.jsii.Kernel.get(this, "unit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.value = java.util.Objects.requireNonNull(builder.value, "value is required");
            this.retainAtLeast = builder.retainAtLeast;
            this.unit = builder.unit;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.Number getValue() {
            return this.value;
        }

        @Override
        public final java.lang.Number getRetainAtLeast() {
            return this.retainAtLeast;
        }

        @Override
        public final java.lang.String getUnit() {
            return this.unit;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            data.set("value", om.valueToTree(this.getValue()));
            if (this.getRetainAtLeast() != null) {
                data.set("retainAtLeast", om.valueToTree(this.getRetainAtLeast()));
            }
            if (this.getUnit() != null) {
                data.set("unit", om.valueToTree(this.getUnit()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderLifecyclePolicy.ImagebuilderLifecyclePolicyPolicyDetailFilter"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderLifecyclePolicyPolicyDetailFilter.Jsii$Proxy that = (ImagebuilderLifecyclePolicyPolicyDetailFilter.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            if (!value.equals(that.value)) return false;
            if (this.retainAtLeast != null ? !this.retainAtLeast.equals(that.retainAtLeast) : that.retainAtLeast != null) return false;
            return this.unit != null ? this.unit.equals(that.unit) : that.unit == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.value.hashCode());
            result = 31 * result + (this.retainAtLeast != null ? this.retainAtLeast.hashCode() : 0);
            result = 31 * result + (this.unit != null ? this.unit.hashCode() : 0);
            return result;
        }
    }
}
