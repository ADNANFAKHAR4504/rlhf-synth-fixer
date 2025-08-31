package imports.aws.securitylake_data_lake;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.420Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securitylakeDataLake.SecuritylakeDataLakeConfigurationLifecycleConfigurationTransition")
@software.amazon.jsii.Jsii.Proxy(SecuritylakeDataLakeConfigurationLifecycleConfigurationTransition.Jsii$Proxy.class)
public interface SecuritylakeDataLakeConfigurationLifecycleConfigurationTransition extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#days SecuritylakeDataLake#days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDays() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#storage_class SecuritylakeDataLake#storage_class}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStorageClass() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecuritylakeDataLakeConfigurationLifecycleConfigurationTransition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecuritylakeDataLakeConfigurationLifecycleConfigurationTransition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecuritylakeDataLakeConfigurationLifecycleConfigurationTransition> {
        java.lang.Number days;
        java.lang.String storageClass;

        /**
         * Sets the value of {@link SecuritylakeDataLakeConfigurationLifecycleConfigurationTransition#getDays}
         * @param days Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#days SecuritylakeDataLake#days}.
         * @return {@code this}
         */
        public Builder days(java.lang.Number days) {
            this.days = days;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeDataLakeConfigurationLifecycleConfigurationTransition#getStorageClass}
         * @param storageClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_data_lake#storage_class SecuritylakeDataLake#storage_class}.
         * @return {@code this}
         */
        public Builder storageClass(java.lang.String storageClass) {
            this.storageClass = storageClass;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecuritylakeDataLakeConfigurationLifecycleConfigurationTransition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecuritylakeDataLakeConfigurationLifecycleConfigurationTransition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecuritylakeDataLakeConfigurationLifecycleConfigurationTransition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecuritylakeDataLakeConfigurationLifecycleConfigurationTransition {
        private final java.lang.Number days;
        private final java.lang.String storageClass;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.days = software.amazon.jsii.Kernel.get(this, "days", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.storageClass = software.amazon.jsii.Kernel.get(this, "storageClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.days = builder.days;
            this.storageClass = builder.storageClass;
        }

        @Override
        public final java.lang.Number getDays() {
            return this.days;
        }

        @Override
        public final java.lang.String getStorageClass() {
            return this.storageClass;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDays() != null) {
                data.set("days", om.valueToTree(this.getDays()));
            }
            if (this.getStorageClass() != null) {
                data.set("storageClass", om.valueToTree(this.getStorageClass()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securitylakeDataLake.SecuritylakeDataLakeConfigurationLifecycleConfigurationTransition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecuritylakeDataLakeConfigurationLifecycleConfigurationTransition.Jsii$Proxy that = (SecuritylakeDataLakeConfigurationLifecycleConfigurationTransition.Jsii$Proxy) o;

            if (this.days != null ? !this.days.equals(that.days) : that.days != null) return false;
            return this.storageClass != null ? this.storageClass.equals(that.storageClass) : that.storageClass == null;
        }

        @Override
        public final int hashCode() {
            int result = this.days != null ? this.days.hashCode() : 0;
            result = 31 * result + (this.storageClass != null ? this.storageClass.hashCode() : 0);
            return result;
        }
    }
}
