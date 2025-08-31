package imports.aws.spot_instance_request;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.488Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.spotInstanceRequest.SpotInstanceRequestCpuOptions")
@software.amazon.jsii.Jsii.Proxy(SpotInstanceRequestCpuOptions.Jsii$Proxy.class)
public interface SpotInstanceRequestCpuOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#amd_sev_snp SpotInstanceRequest#amd_sev_snp}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAmdSevSnp() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#core_count SpotInstanceRequest#core_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCoreCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#threads_per_core SpotInstanceRequest#threads_per_core}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getThreadsPerCore() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SpotInstanceRequestCpuOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SpotInstanceRequestCpuOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SpotInstanceRequestCpuOptions> {
        java.lang.String amdSevSnp;
        java.lang.Number coreCount;
        java.lang.Number threadsPerCore;

        /**
         * Sets the value of {@link SpotInstanceRequestCpuOptions#getAmdSevSnp}
         * @param amdSevSnp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#amd_sev_snp SpotInstanceRequest#amd_sev_snp}.
         * @return {@code this}
         */
        public Builder amdSevSnp(java.lang.String amdSevSnp) {
            this.amdSevSnp = amdSevSnp;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestCpuOptions#getCoreCount}
         * @param coreCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#core_count SpotInstanceRequest#core_count}.
         * @return {@code this}
         */
        public Builder coreCount(java.lang.Number coreCount) {
            this.coreCount = coreCount;
            return this;
        }

        /**
         * Sets the value of {@link SpotInstanceRequestCpuOptions#getThreadsPerCore}
         * @param threadsPerCore Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#threads_per_core SpotInstanceRequest#threads_per_core}.
         * @return {@code this}
         */
        public Builder threadsPerCore(java.lang.Number threadsPerCore) {
            this.threadsPerCore = threadsPerCore;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SpotInstanceRequestCpuOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SpotInstanceRequestCpuOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SpotInstanceRequestCpuOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SpotInstanceRequestCpuOptions {
        private final java.lang.String amdSevSnp;
        private final java.lang.Number coreCount;
        private final java.lang.Number threadsPerCore;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.amdSevSnp = software.amazon.jsii.Kernel.get(this, "amdSevSnp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.coreCount = software.amazon.jsii.Kernel.get(this, "coreCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.threadsPerCore = software.amazon.jsii.Kernel.get(this, "threadsPerCore", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.amdSevSnp = builder.amdSevSnp;
            this.coreCount = builder.coreCount;
            this.threadsPerCore = builder.threadsPerCore;
        }

        @Override
        public final java.lang.String getAmdSevSnp() {
            return this.amdSevSnp;
        }

        @Override
        public final java.lang.Number getCoreCount() {
            return this.coreCount;
        }

        @Override
        public final java.lang.Number getThreadsPerCore() {
            return this.threadsPerCore;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAmdSevSnp() != null) {
                data.set("amdSevSnp", om.valueToTree(this.getAmdSevSnp()));
            }
            if (this.getCoreCount() != null) {
                data.set("coreCount", om.valueToTree(this.getCoreCount()));
            }
            if (this.getThreadsPerCore() != null) {
                data.set("threadsPerCore", om.valueToTree(this.getThreadsPerCore()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.spotInstanceRequest.SpotInstanceRequestCpuOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SpotInstanceRequestCpuOptions.Jsii$Proxy that = (SpotInstanceRequestCpuOptions.Jsii$Proxy) o;

            if (this.amdSevSnp != null ? !this.amdSevSnp.equals(that.amdSevSnp) : that.amdSevSnp != null) return false;
            if (this.coreCount != null ? !this.coreCount.equals(that.coreCount) : that.coreCount != null) return false;
            return this.threadsPerCore != null ? this.threadsPerCore.equals(that.threadsPerCore) : that.threadsPerCore == null;
        }

        @Override
        public final int hashCode() {
            int result = this.amdSevSnp != null ? this.amdSevSnp.hashCode() : 0;
            result = 31 * result + (this.coreCount != null ? this.coreCount.hashCode() : 0);
            result = 31 * result + (this.threadsPerCore != null ? this.threadsPerCore.hashCode() : 0);
            return result;
        }
    }
}
