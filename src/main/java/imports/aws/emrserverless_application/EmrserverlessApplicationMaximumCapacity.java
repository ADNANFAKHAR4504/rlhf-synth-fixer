package imports.aws.emrserverless_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.210Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrserverlessApplication.EmrserverlessApplicationMaximumCapacity")
@software.amazon.jsii.Jsii.Proxy(EmrserverlessApplicationMaximumCapacity.Jsii$Proxy.class)
public interface EmrserverlessApplicationMaximumCapacity extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#cpu EmrserverlessApplication#cpu}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCpu();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#memory EmrserverlessApplication#memory}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMemory();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#disk EmrserverlessApplication#disk}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDisk() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrserverlessApplicationMaximumCapacity}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrserverlessApplicationMaximumCapacity}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrserverlessApplicationMaximumCapacity> {
        java.lang.String cpu;
        java.lang.String memory;
        java.lang.String disk;

        /**
         * Sets the value of {@link EmrserverlessApplicationMaximumCapacity#getCpu}
         * @param cpu Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#cpu EmrserverlessApplication#cpu}. This parameter is required.
         * @return {@code this}
         */
        public Builder cpu(java.lang.String cpu) {
            this.cpu = cpu;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationMaximumCapacity#getMemory}
         * @param memory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#memory EmrserverlessApplication#memory}. This parameter is required.
         * @return {@code this}
         */
        public Builder memory(java.lang.String memory) {
            this.memory = memory;
            return this;
        }

        /**
         * Sets the value of {@link EmrserverlessApplicationMaximumCapacity#getDisk}
         * @param disk Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#disk EmrserverlessApplication#disk}.
         * @return {@code this}
         */
        public Builder disk(java.lang.String disk) {
            this.disk = disk;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrserverlessApplicationMaximumCapacity}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrserverlessApplicationMaximumCapacity build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrserverlessApplicationMaximumCapacity}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrserverlessApplicationMaximumCapacity {
        private final java.lang.String cpu;
        private final java.lang.String memory;
        private final java.lang.String disk;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cpu = software.amazon.jsii.Kernel.get(this, "cpu", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.memory = software.amazon.jsii.Kernel.get(this, "memory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.disk = software.amazon.jsii.Kernel.get(this, "disk", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cpu = java.util.Objects.requireNonNull(builder.cpu, "cpu is required");
            this.memory = java.util.Objects.requireNonNull(builder.memory, "memory is required");
            this.disk = builder.disk;
        }

        @Override
        public final java.lang.String getCpu() {
            return this.cpu;
        }

        @Override
        public final java.lang.String getMemory() {
            return this.memory;
        }

        @Override
        public final java.lang.String getDisk() {
            return this.disk;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("cpu", om.valueToTree(this.getCpu()));
            data.set("memory", om.valueToTree(this.getMemory()));
            if (this.getDisk() != null) {
                data.set("disk", om.valueToTree(this.getDisk()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrserverlessApplication.EmrserverlessApplicationMaximumCapacity"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrserverlessApplicationMaximumCapacity.Jsii$Proxy that = (EmrserverlessApplicationMaximumCapacity.Jsii$Proxy) o;

            if (!cpu.equals(that.cpu)) return false;
            if (!memory.equals(that.memory)) return false;
            return this.disk != null ? this.disk.equals(that.disk) : that.disk == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cpu.hashCode();
            result = 31 * result + (this.memory.hashCode());
            result = 31 * result + (this.disk != null ? this.disk.hashCode() : 0);
            return result;
        }
    }
}
