package imports.aws.ecs_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.131Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsService.EcsServiceCapacityProviderStrategy")
@software.amazon.jsii.Jsii.Proxy(EcsServiceCapacityProviderStrategy.Jsii$Proxy.class)
public interface EcsServiceCapacityProviderStrategy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#capacity_provider EcsService#capacity_provider}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCapacityProvider();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#base EcsService#base}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBase() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#weight EcsService#weight}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getWeight() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcsServiceCapacityProviderStrategy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsServiceCapacityProviderStrategy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsServiceCapacityProviderStrategy> {
        java.lang.String capacityProvider;
        java.lang.Number base;
        java.lang.Number weight;

        /**
         * Sets the value of {@link EcsServiceCapacityProviderStrategy#getCapacityProvider}
         * @param capacityProvider Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#capacity_provider EcsService#capacity_provider}. This parameter is required.
         * @return {@code this}
         */
        public Builder capacityProvider(java.lang.String capacityProvider) {
            this.capacityProvider = capacityProvider;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceCapacityProviderStrategy#getBase}
         * @param base Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#base EcsService#base}.
         * @return {@code this}
         */
        public Builder base(java.lang.Number base) {
            this.base = base;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceCapacityProviderStrategy#getWeight}
         * @param weight Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#weight EcsService#weight}.
         * @return {@code this}
         */
        public Builder weight(java.lang.Number weight) {
            this.weight = weight;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsServiceCapacityProviderStrategy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsServiceCapacityProviderStrategy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsServiceCapacityProviderStrategy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsServiceCapacityProviderStrategy {
        private final java.lang.String capacityProvider;
        private final java.lang.Number base;
        private final java.lang.Number weight;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.capacityProvider = software.amazon.jsii.Kernel.get(this, "capacityProvider", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.base = software.amazon.jsii.Kernel.get(this, "base", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.weight = software.amazon.jsii.Kernel.get(this, "weight", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.capacityProvider = java.util.Objects.requireNonNull(builder.capacityProvider, "capacityProvider is required");
            this.base = builder.base;
            this.weight = builder.weight;
        }

        @Override
        public final java.lang.String getCapacityProvider() {
            return this.capacityProvider;
        }

        @Override
        public final java.lang.Number getBase() {
            return this.base;
        }

        @Override
        public final java.lang.Number getWeight() {
            return this.weight;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("capacityProvider", om.valueToTree(this.getCapacityProvider()));
            if (this.getBase() != null) {
                data.set("base", om.valueToTree(this.getBase()));
            }
            if (this.getWeight() != null) {
                data.set("weight", om.valueToTree(this.getWeight()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsService.EcsServiceCapacityProviderStrategy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsServiceCapacityProviderStrategy.Jsii$Proxy that = (EcsServiceCapacityProviderStrategy.Jsii$Proxy) o;

            if (!capacityProvider.equals(that.capacityProvider)) return false;
            if (this.base != null ? !this.base.equals(that.base) : that.base != null) return false;
            return this.weight != null ? this.weight.equals(that.weight) : that.weight == null;
        }

        @Override
        public final int hashCode() {
            int result = this.capacityProvider.hashCode();
            result = 31 * result + (this.base != null ? this.base.hashCode() : 0);
            result = 31 * result + (this.weight != null ? this.weight.hashCode() : 0);
            return result;
        }
    }
}
