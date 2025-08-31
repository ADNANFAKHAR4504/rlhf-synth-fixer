package imports.aws.m2_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.845Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.m2Environment.M2EnvironmentStorageConfiguration")
@software.amazon.jsii.Jsii.Proxy(M2EnvironmentStorageConfiguration.Jsii$Proxy.class)
public interface M2EnvironmentStorageConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * efs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_environment#efs M2Environment#efs}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEfs() {
        return null;
    }

    /**
     * fsx block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_environment#fsx M2Environment#fsx}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFsx() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link M2EnvironmentStorageConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link M2EnvironmentStorageConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<M2EnvironmentStorageConfiguration> {
        java.lang.Object efs;
        java.lang.Object fsx;

        /**
         * Sets the value of {@link M2EnvironmentStorageConfiguration#getEfs}
         * @param efs efs block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_environment#efs M2Environment#efs}
         * @return {@code this}
         */
        public Builder efs(com.hashicorp.cdktf.IResolvable efs) {
            this.efs = efs;
            return this;
        }

        /**
         * Sets the value of {@link M2EnvironmentStorageConfiguration#getEfs}
         * @param efs efs block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_environment#efs M2Environment#efs}
         * @return {@code this}
         */
        public Builder efs(java.util.List<? extends imports.aws.m2_environment.M2EnvironmentStorageConfigurationEfs> efs) {
            this.efs = efs;
            return this;
        }

        /**
         * Sets the value of {@link M2EnvironmentStorageConfiguration#getFsx}
         * @param fsx fsx block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_environment#fsx M2Environment#fsx}
         * @return {@code this}
         */
        public Builder fsx(com.hashicorp.cdktf.IResolvable fsx) {
            this.fsx = fsx;
            return this;
        }

        /**
         * Sets the value of {@link M2EnvironmentStorageConfiguration#getFsx}
         * @param fsx fsx block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_environment#fsx M2Environment#fsx}
         * @return {@code this}
         */
        public Builder fsx(java.util.List<? extends imports.aws.m2_environment.M2EnvironmentStorageConfigurationFsx> fsx) {
            this.fsx = fsx;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link M2EnvironmentStorageConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public M2EnvironmentStorageConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link M2EnvironmentStorageConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements M2EnvironmentStorageConfiguration {
        private final java.lang.Object efs;
        private final java.lang.Object fsx;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.efs = software.amazon.jsii.Kernel.get(this, "efs", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.fsx = software.amazon.jsii.Kernel.get(this, "fsx", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.efs = builder.efs;
            this.fsx = builder.fsx;
        }

        @Override
        public final java.lang.Object getEfs() {
            return this.efs;
        }

        @Override
        public final java.lang.Object getFsx() {
            return this.fsx;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEfs() != null) {
                data.set("efs", om.valueToTree(this.getEfs()));
            }
            if (this.getFsx() != null) {
                data.set("fsx", om.valueToTree(this.getFsx()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.m2Environment.M2EnvironmentStorageConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            M2EnvironmentStorageConfiguration.Jsii$Proxy that = (M2EnvironmentStorageConfiguration.Jsii$Proxy) o;

            if (this.efs != null ? !this.efs.equals(that.efs) : that.efs != null) return false;
            return this.fsx != null ? this.fsx.equals(that.fsx) : that.fsx == null;
        }

        @Override
        public final int hashCode() {
            int result = this.efs != null ? this.efs.hashCode() : 0;
            result = 31 * result + (this.fsx != null ? this.fsx.hashCode() : 0);
            return result;
        }
    }
}
