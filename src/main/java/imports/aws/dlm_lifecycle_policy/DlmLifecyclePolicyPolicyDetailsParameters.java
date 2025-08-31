package imports.aws.dlm_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.005Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsParameters")
@software.amazon.jsii.Jsii.Proxy(DlmLifecyclePolicyPolicyDetailsParameters.Jsii$Proxy.class)
public interface DlmLifecyclePolicyPolicyDetailsParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#exclude_boot_volume DlmLifecyclePolicy#exclude_boot_volume}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getExcludeBootVolume() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#no_reboot DlmLifecyclePolicy#no_reboot}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNoReboot() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DlmLifecyclePolicyPolicyDetailsParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DlmLifecyclePolicyPolicyDetailsParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DlmLifecyclePolicyPolicyDetailsParameters> {
        java.lang.Object excludeBootVolume;
        java.lang.Object noReboot;

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsParameters#getExcludeBootVolume}
         * @param excludeBootVolume Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#exclude_boot_volume DlmLifecyclePolicy#exclude_boot_volume}.
         * @return {@code this}
         */
        public Builder excludeBootVolume(java.lang.Boolean excludeBootVolume) {
            this.excludeBootVolume = excludeBootVolume;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsParameters#getExcludeBootVolume}
         * @param excludeBootVolume Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#exclude_boot_volume DlmLifecyclePolicy#exclude_boot_volume}.
         * @return {@code this}
         */
        public Builder excludeBootVolume(com.hashicorp.cdktf.IResolvable excludeBootVolume) {
            this.excludeBootVolume = excludeBootVolume;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsParameters#getNoReboot}
         * @param noReboot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#no_reboot DlmLifecyclePolicy#no_reboot}.
         * @return {@code this}
         */
        public Builder noReboot(java.lang.Boolean noReboot) {
            this.noReboot = noReboot;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsParameters#getNoReboot}
         * @param noReboot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#no_reboot DlmLifecyclePolicy#no_reboot}.
         * @return {@code this}
         */
        public Builder noReboot(com.hashicorp.cdktf.IResolvable noReboot) {
            this.noReboot = noReboot;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DlmLifecyclePolicyPolicyDetailsParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DlmLifecyclePolicyPolicyDetailsParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DlmLifecyclePolicyPolicyDetailsParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DlmLifecyclePolicyPolicyDetailsParameters {
        private final java.lang.Object excludeBootVolume;
        private final java.lang.Object noReboot;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.excludeBootVolume = software.amazon.jsii.Kernel.get(this, "excludeBootVolume", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.noReboot = software.amazon.jsii.Kernel.get(this, "noReboot", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.excludeBootVolume = builder.excludeBootVolume;
            this.noReboot = builder.noReboot;
        }

        @Override
        public final java.lang.Object getExcludeBootVolume() {
            return this.excludeBootVolume;
        }

        @Override
        public final java.lang.Object getNoReboot() {
            return this.noReboot;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getExcludeBootVolume() != null) {
                data.set("excludeBootVolume", om.valueToTree(this.getExcludeBootVolume()));
            }
            if (this.getNoReboot() != null) {
                data.set("noReboot", om.valueToTree(this.getNoReboot()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DlmLifecyclePolicyPolicyDetailsParameters.Jsii$Proxy that = (DlmLifecyclePolicyPolicyDetailsParameters.Jsii$Proxy) o;

            if (this.excludeBootVolume != null ? !this.excludeBootVolume.equals(that.excludeBootVolume) : that.excludeBootVolume != null) return false;
            return this.noReboot != null ? this.noReboot.equals(that.noReboot) : that.noReboot == null;
        }

        @Override
        public final int hashCode() {
            int result = this.excludeBootVolume != null ? this.excludeBootVolume.hashCode() : 0;
            result = 31 * result + (this.noReboot != null ? this.noReboot.hashCode() : 0);
            return result;
        }
    }
}
