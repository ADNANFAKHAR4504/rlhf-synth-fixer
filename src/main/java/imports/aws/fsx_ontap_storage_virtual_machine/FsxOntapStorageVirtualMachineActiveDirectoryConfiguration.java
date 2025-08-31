package imports.aws.fsx_ontap_storage_virtual_machine;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.247Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxOntapStorageVirtualMachine.FsxOntapStorageVirtualMachineActiveDirectoryConfiguration")
@software.amazon.jsii.Jsii.Proxy(FsxOntapStorageVirtualMachineActiveDirectoryConfiguration.Jsii$Proxy.class)
public interface FsxOntapStorageVirtualMachineActiveDirectoryConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine#netbios_name FsxOntapStorageVirtualMachine#netbios_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNetbiosName() {
        return null;
    }

    /**
     * self_managed_active_directory_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine#self_managed_active_directory_configuration FsxOntapStorageVirtualMachine#self_managed_active_directory_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachineActiveDirectoryConfigurationSelfManagedActiveDirectoryConfiguration getSelfManagedActiveDirectoryConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxOntapStorageVirtualMachineActiveDirectoryConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxOntapStorageVirtualMachineActiveDirectoryConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxOntapStorageVirtualMachineActiveDirectoryConfiguration> {
        java.lang.String netbiosName;
        imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachineActiveDirectoryConfigurationSelfManagedActiveDirectoryConfiguration selfManagedActiveDirectoryConfiguration;

        /**
         * Sets the value of {@link FsxOntapStorageVirtualMachineActiveDirectoryConfiguration#getNetbiosName}
         * @param netbiosName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine#netbios_name FsxOntapStorageVirtualMachine#netbios_name}.
         * @return {@code this}
         */
        public Builder netbiosName(java.lang.String netbiosName) {
            this.netbiosName = netbiosName;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapStorageVirtualMachineActiveDirectoryConfiguration#getSelfManagedActiveDirectoryConfiguration}
         * @param selfManagedActiveDirectoryConfiguration self_managed_active_directory_configuration block.
         *                                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_storage_virtual_machine#self_managed_active_directory_configuration FsxOntapStorageVirtualMachine#self_managed_active_directory_configuration}
         * @return {@code this}
         */
        public Builder selfManagedActiveDirectoryConfiguration(imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachineActiveDirectoryConfigurationSelfManagedActiveDirectoryConfiguration selfManagedActiveDirectoryConfiguration) {
            this.selfManagedActiveDirectoryConfiguration = selfManagedActiveDirectoryConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FsxOntapStorageVirtualMachineActiveDirectoryConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxOntapStorageVirtualMachineActiveDirectoryConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxOntapStorageVirtualMachineActiveDirectoryConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxOntapStorageVirtualMachineActiveDirectoryConfiguration {
        private final java.lang.String netbiosName;
        private final imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachineActiveDirectoryConfigurationSelfManagedActiveDirectoryConfiguration selfManagedActiveDirectoryConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.netbiosName = software.amazon.jsii.Kernel.get(this, "netbiosName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.selfManagedActiveDirectoryConfiguration = software.amazon.jsii.Kernel.get(this, "selfManagedActiveDirectoryConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachineActiveDirectoryConfigurationSelfManagedActiveDirectoryConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.netbiosName = builder.netbiosName;
            this.selfManagedActiveDirectoryConfiguration = builder.selfManagedActiveDirectoryConfiguration;
        }

        @Override
        public final java.lang.String getNetbiosName() {
            return this.netbiosName;
        }

        @Override
        public final imports.aws.fsx_ontap_storage_virtual_machine.FsxOntapStorageVirtualMachineActiveDirectoryConfigurationSelfManagedActiveDirectoryConfiguration getSelfManagedActiveDirectoryConfiguration() {
            return this.selfManagedActiveDirectoryConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getNetbiosName() != null) {
                data.set("netbiosName", om.valueToTree(this.getNetbiosName()));
            }
            if (this.getSelfManagedActiveDirectoryConfiguration() != null) {
                data.set("selfManagedActiveDirectoryConfiguration", om.valueToTree(this.getSelfManagedActiveDirectoryConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fsxOntapStorageVirtualMachine.FsxOntapStorageVirtualMachineActiveDirectoryConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxOntapStorageVirtualMachineActiveDirectoryConfiguration.Jsii$Proxy that = (FsxOntapStorageVirtualMachineActiveDirectoryConfiguration.Jsii$Proxy) o;

            if (this.netbiosName != null ? !this.netbiosName.equals(that.netbiosName) : that.netbiosName != null) return false;
            return this.selfManagedActiveDirectoryConfiguration != null ? this.selfManagedActiveDirectoryConfiguration.equals(that.selfManagedActiveDirectoryConfiguration) : that.selfManagedActiveDirectoryConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.netbiosName != null ? this.netbiosName.hashCode() : 0;
            result = 31 * result + (this.selfManagedActiveDirectoryConfiguration != null ? this.selfManagedActiveDirectoryConfiguration.hashCode() : 0);
            return result;
        }
    }
}
