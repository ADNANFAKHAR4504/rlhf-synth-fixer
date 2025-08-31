package imports.aws.vpclattice_target_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.629Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeTargetGroup.VpclatticeTargetGroupConfigA")
@software.amazon.jsii.Jsii.Proxy(VpclatticeTargetGroupConfigA.Jsii$Proxy.class)
public interface VpclatticeTargetGroupConfigA extends software.amazon.jsii.JsiiSerializable {

    /**
     * health_check block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#health_check VpclatticeTargetGroup#health_check}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.vpclattice_target_group.VpclatticeTargetGroupConfigHealthCheck getHealthCheck() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#ip_address_type VpclatticeTargetGroup#ip_address_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpAddressType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#lambda_event_structure_version VpclatticeTargetGroup#lambda_event_structure_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLambdaEventStructureVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#port VpclatticeTargetGroup#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#protocol VpclatticeTargetGroup#protocol}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProtocol() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#protocol_version VpclatticeTargetGroup#protocol_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProtocolVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#vpc_identifier VpclatticeTargetGroup#vpc_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVpcIdentifier() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpclatticeTargetGroupConfigA}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpclatticeTargetGroupConfigA}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpclatticeTargetGroupConfigA> {
        imports.aws.vpclattice_target_group.VpclatticeTargetGroupConfigHealthCheck healthCheck;
        java.lang.String ipAddressType;
        java.lang.String lambdaEventStructureVersion;
        java.lang.Number port;
        java.lang.String protocol;
        java.lang.String protocolVersion;
        java.lang.String vpcIdentifier;

        /**
         * Sets the value of {@link VpclatticeTargetGroupConfigA#getHealthCheck}
         * @param healthCheck health_check block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#health_check VpclatticeTargetGroup#health_check}
         * @return {@code this}
         */
        public Builder healthCheck(imports.aws.vpclattice_target_group.VpclatticeTargetGroupConfigHealthCheck healthCheck) {
            this.healthCheck = healthCheck;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeTargetGroupConfigA#getIpAddressType}
         * @param ipAddressType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#ip_address_type VpclatticeTargetGroup#ip_address_type}.
         * @return {@code this}
         */
        public Builder ipAddressType(java.lang.String ipAddressType) {
            this.ipAddressType = ipAddressType;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeTargetGroupConfigA#getLambdaEventStructureVersion}
         * @param lambdaEventStructureVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#lambda_event_structure_version VpclatticeTargetGroup#lambda_event_structure_version}.
         * @return {@code this}
         */
        public Builder lambdaEventStructureVersion(java.lang.String lambdaEventStructureVersion) {
            this.lambdaEventStructureVersion = lambdaEventStructureVersion;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeTargetGroupConfigA#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#port VpclatticeTargetGroup#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeTargetGroupConfigA#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#protocol VpclatticeTargetGroup#protocol}.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeTargetGroupConfigA#getProtocolVersion}
         * @param protocolVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#protocol_version VpclatticeTargetGroup#protocol_version}.
         * @return {@code this}
         */
        public Builder protocolVersion(java.lang.String protocolVersion) {
            this.protocolVersion = protocolVersion;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeTargetGroupConfigA#getVpcIdentifier}
         * @param vpcIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#vpc_identifier VpclatticeTargetGroup#vpc_identifier}.
         * @return {@code this}
         */
        public Builder vpcIdentifier(java.lang.String vpcIdentifier) {
            this.vpcIdentifier = vpcIdentifier;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpclatticeTargetGroupConfigA}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpclatticeTargetGroupConfigA build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpclatticeTargetGroupConfigA}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpclatticeTargetGroupConfigA {
        private final imports.aws.vpclattice_target_group.VpclatticeTargetGroupConfigHealthCheck healthCheck;
        private final java.lang.String ipAddressType;
        private final java.lang.String lambdaEventStructureVersion;
        private final java.lang.Number port;
        private final java.lang.String protocol;
        private final java.lang.String protocolVersion;
        private final java.lang.String vpcIdentifier;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.healthCheck = software.amazon.jsii.Kernel.get(this, "healthCheck", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_target_group.VpclatticeTargetGroupConfigHealthCheck.class));
            this.ipAddressType = software.amazon.jsii.Kernel.get(this, "ipAddressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lambdaEventStructureVersion = software.amazon.jsii.Kernel.get(this, "lambdaEventStructureVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.protocolVersion = software.amazon.jsii.Kernel.get(this, "protocolVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcIdentifier = software.amazon.jsii.Kernel.get(this, "vpcIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.healthCheck = builder.healthCheck;
            this.ipAddressType = builder.ipAddressType;
            this.lambdaEventStructureVersion = builder.lambdaEventStructureVersion;
            this.port = builder.port;
            this.protocol = builder.protocol;
            this.protocolVersion = builder.protocolVersion;
            this.vpcIdentifier = builder.vpcIdentifier;
        }

        @Override
        public final imports.aws.vpclattice_target_group.VpclatticeTargetGroupConfigHealthCheck getHealthCheck() {
            return this.healthCheck;
        }

        @Override
        public final java.lang.String getIpAddressType() {
            return this.ipAddressType;
        }

        @Override
        public final java.lang.String getLambdaEventStructureVersion() {
            return this.lambdaEventStructureVersion;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        public final java.lang.String getProtocol() {
            return this.protocol;
        }

        @Override
        public final java.lang.String getProtocolVersion() {
            return this.protocolVersion;
        }

        @Override
        public final java.lang.String getVpcIdentifier() {
            return this.vpcIdentifier;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHealthCheck() != null) {
                data.set("healthCheck", om.valueToTree(this.getHealthCheck()));
            }
            if (this.getIpAddressType() != null) {
                data.set("ipAddressType", om.valueToTree(this.getIpAddressType()));
            }
            if (this.getLambdaEventStructureVersion() != null) {
                data.set("lambdaEventStructureVersion", om.valueToTree(this.getLambdaEventStructureVersion()));
            }
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }
            if (this.getProtocol() != null) {
                data.set("protocol", om.valueToTree(this.getProtocol()));
            }
            if (this.getProtocolVersion() != null) {
                data.set("protocolVersion", om.valueToTree(this.getProtocolVersion()));
            }
            if (this.getVpcIdentifier() != null) {
                data.set("vpcIdentifier", om.valueToTree(this.getVpcIdentifier()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpclatticeTargetGroup.VpclatticeTargetGroupConfigA"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpclatticeTargetGroupConfigA.Jsii$Proxy that = (VpclatticeTargetGroupConfigA.Jsii$Proxy) o;

            if (this.healthCheck != null ? !this.healthCheck.equals(that.healthCheck) : that.healthCheck != null) return false;
            if (this.ipAddressType != null ? !this.ipAddressType.equals(that.ipAddressType) : that.ipAddressType != null) return false;
            if (this.lambdaEventStructureVersion != null ? !this.lambdaEventStructureVersion.equals(that.lambdaEventStructureVersion) : that.lambdaEventStructureVersion != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.protocol != null ? !this.protocol.equals(that.protocol) : that.protocol != null) return false;
            if (this.protocolVersion != null ? !this.protocolVersion.equals(that.protocolVersion) : that.protocolVersion != null) return false;
            return this.vpcIdentifier != null ? this.vpcIdentifier.equals(that.vpcIdentifier) : that.vpcIdentifier == null;
        }

        @Override
        public final int hashCode() {
            int result = this.healthCheck != null ? this.healthCheck.hashCode() : 0;
            result = 31 * result + (this.ipAddressType != null ? this.ipAddressType.hashCode() : 0);
            result = 31 * result + (this.lambdaEventStructureVersion != null ? this.lambdaEventStructureVersion.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.protocol != null ? this.protocol.hashCode() : 0);
            result = 31 * result + (this.protocolVersion != null ? this.protocolVersion.hashCode() : 0);
            result = 31 * result + (this.vpcIdentifier != null ? this.vpcIdentifier.hashCode() : 0);
            return result;
        }
    }
}
