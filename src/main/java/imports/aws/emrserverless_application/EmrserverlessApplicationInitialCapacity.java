package imports.aws.emrserverless_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.209Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrserverlessApplication.EmrserverlessApplicationInitialCapacity")
@software.amazon.jsii.Jsii.Proxy(EmrserverlessApplicationInitialCapacity.Jsii$Proxy.class)
public interface EmrserverlessApplicationInitialCapacity extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#initial_capacity_type EmrserverlessApplication#initial_capacity_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInitialCapacityType();

    /**
     * initial_capacity_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#initial_capacity_config EmrserverlessApplication#initial_capacity_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfig getInitialCapacityConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrserverlessApplicationInitialCapacity}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrserverlessApplicationInitialCapacity}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrserverlessApplicationInitialCapacity> {
        java.lang.String initialCapacityType;
        imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfig initialCapacityConfig;

        /**
         * Sets the value of {@link EmrserverlessApplicationInitialCapacity#getInitialCapacityType}
         * @param initialCapacityType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#initial_capacity_type EmrserverlessApplication#initial_capacity_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder initialCapacityType(java.lang.String initialCapacityType) {
            this.initialCapacityType = initialCapacityType;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationInitialCapacity#getInitialCapacityConfig}
         * @param initialCapacityConfig initial_capacity_config block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#initial_capacity_config EmrserverlessApplication#initial_capacity_config}
         * @return {@code this}
         */
        public Builder initialCapacityConfig(imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfig initialCapacityConfig) {
            this.initialCapacityConfig = initialCapacityConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrserverlessApplicationInitialCapacity}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrserverlessApplicationInitialCapacity build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrserverlessApplicationInitialCapacity}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrserverlessApplicationInitialCapacity {
        private final java.lang.String initialCapacityType;
        private final imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfig initialCapacityConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.initialCapacityType = software.amazon.jsii.Kernel.get(this, "initialCapacityType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.initialCapacityConfig = software.amazon.jsii.Kernel.get(this, "initialCapacityConfig", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.initialCapacityType = java.util.Objects.requireNonNull(builder.initialCapacityType, "initialCapacityType is required");
            this.initialCapacityConfig = builder.initialCapacityConfig;
        }

        @Override
        public final java.lang.String getInitialCapacityType() {
            return this.initialCapacityType;
        }

        @Override
        public final imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityInitialCapacityConfig getInitialCapacityConfig() {
            return this.initialCapacityConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("initialCapacityType", om.valueToTree(this.getInitialCapacityType()));
            if (this.getInitialCapacityConfig() != null) {
                data.set("initialCapacityConfig", om.valueToTree(this.getInitialCapacityConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrserverlessApplication.EmrserverlessApplicationInitialCapacity"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrserverlessApplicationInitialCapacity.Jsii$Proxy that = (EmrserverlessApplicationInitialCapacity.Jsii$Proxy) o;

            if (!initialCapacityType.equals(that.initialCapacityType)) return false;
            return this.initialCapacityConfig != null ? this.initialCapacityConfig.equals(that.initialCapacityConfig) : that.initialCapacityConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.initialCapacityType.hashCode();
            result = 31 * result + (this.initialCapacityConfig != null ? this.initialCapacityConfig.hashCode() : 0);
            return result;
        }
    }
}
