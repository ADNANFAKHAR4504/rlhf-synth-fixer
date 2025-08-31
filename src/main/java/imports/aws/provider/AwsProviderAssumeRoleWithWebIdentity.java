package imports.aws.provider;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.084Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.provider.AwsProviderAssumeRoleWithWebIdentity")
@software.amazon.jsii.Jsii.Proxy(AwsProviderAssumeRoleWithWebIdentity.Jsii$Proxy.class)
public interface AwsProviderAssumeRoleWithWebIdentity extends software.amazon.jsii.JsiiSerializable {

    /**
     * The duration, between 15 minutes and 12 hours, of the role session.
     * <p>
     * Valid time units are ns, us (or µs), ms, s, h, or m.
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#duration AwsProvider#duration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDuration() {
        return null;
    }

    /**
     * IAM Policy JSON describing further restricting permissions for the IAM Role being assumed.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#policy AwsProvider#policy}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPolicy() {
        return null;
    }

    /**
     * Amazon Resource Names (ARNs) of IAM Policies describing further restricting permissions for the IAM Role being assumed.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#policy_arns AwsProvider#policy_arns}
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPolicyArns() {
        return null;
    }

    /**
     * Amazon Resource Name (ARN) of an IAM Role to assume prior to making API calls.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#role_arn AwsProvider#role_arn}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleArn() {
        return null;
    }

    /**
     * An identifier for the assumed role session.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#session_name AwsProvider#session_name}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSessionName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#web_identity_token AwsProvider#web_identity_token}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWebIdentityToken() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#web_identity_token_file AwsProvider#web_identity_token_file}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWebIdentityTokenFile() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AwsProviderAssumeRoleWithWebIdentity}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AwsProviderAssumeRoleWithWebIdentity}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AwsProviderAssumeRoleWithWebIdentity> {
        java.lang.String duration;
        java.lang.String policy;
        java.util.List<java.lang.String> policyArns;
        java.lang.String roleArn;
        java.lang.String sessionName;
        java.lang.String webIdentityToken;
        java.lang.String webIdentityTokenFile;

        /**
         * Sets the value of {@link AwsProviderAssumeRoleWithWebIdentity#getDuration}
         * @param duration The duration, between 15 minutes and 12 hours, of the role session.
         *                 Valid time units are ns, us (or µs), ms, s, h, or m.
         *                 
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#duration AwsProvider#duration}
         * @return {@code this}
         */
        public Builder duration(java.lang.String duration) {
            this.duration = duration;
            return this;
        }

        /**
         * Sets the value of {@link AwsProviderAssumeRoleWithWebIdentity#getPolicy}
         * @param policy IAM Policy JSON describing further restricting permissions for the IAM Role being assumed.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#policy AwsProvider#policy}
         * @return {@code this}
         */
        public Builder policy(java.lang.String policy) {
            this.policy = policy;
            return this;
        }

        /**
         * Sets the value of {@link AwsProviderAssumeRoleWithWebIdentity#getPolicyArns}
         * @param policyArns Amazon Resource Names (ARNs) of IAM Policies describing further restricting permissions for the IAM Role being assumed.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#policy_arns AwsProvider#policy_arns}
         * @return {@code this}
         */
        public Builder policyArns(java.util.List<java.lang.String> policyArns) {
            this.policyArns = policyArns;
            return this;
        }

        /**
         * Sets the value of {@link AwsProviderAssumeRoleWithWebIdentity#getRoleArn}
         * @param roleArn Amazon Resource Name (ARN) of an IAM Role to assume prior to making API calls.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#role_arn AwsProvider#role_arn}
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link AwsProviderAssumeRoleWithWebIdentity#getSessionName}
         * @param sessionName An identifier for the assumed role session.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#session_name AwsProvider#session_name}
         * @return {@code this}
         */
        public Builder sessionName(java.lang.String sessionName) {
            this.sessionName = sessionName;
            return this;
        }

        /**
         * Sets the value of {@link AwsProviderAssumeRoleWithWebIdentity#getWebIdentityToken}
         * @param webIdentityToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#web_identity_token AwsProvider#web_identity_token}.
         * @return {@code this}
         */
        public Builder webIdentityToken(java.lang.String webIdentityToken) {
            this.webIdentityToken = webIdentityToken;
            return this;
        }

        /**
         * Sets the value of {@link AwsProviderAssumeRoleWithWebIdentity#getWebIdentityTokenFile}
         * @param webIdentityTokenFile Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#web_identity_token_file AwsProvider#web_identity_token_file}.
         * @return {@code this}
         */
        public Builder webIdentityTokenFile(java.lang.String webIdentityTokenFile) {
            this.webIdentityTokenFile = webIdentityTokenFile;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AwsProviderAssumeRoleWithWebIdentity}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AwsProviderAssumeRoleWithWebIdentity build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AwsProviderAssumeRoleWithWebIdentity}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AwsProviderAssumeRoleWithWebIdentity {
        private final java.lang.String duration;
        private final java.lang.String policy;
        private final java.util.List<java.lang.String> policyArns;
        private final java.lang.String roleArn;
        private final java.lang.String sessionName;
        private final java.lang.String webIdentityToken;
        private final java.lang.String webIdentityTokenFile;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.duration = software.amazon.jsii.Kernel.get(this, "duration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.policy = software.amazon.jsii.Kernel.get(this, "policy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.policyArns = software.amazon.jsii.Kernel.get(this, "policyArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sessionName = software.amazon.jsii.Kernel.get(this, "sessionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.webIdentityToken = software.amazon.jsii.Kernel.get(this, "webIdentityToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.webIdentityTokenFile = software.amazon.jsii.Kernel.get(this, "webIdentityTokenFile", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.duration = builder.duration;
            this.policy = builder.policy;
            this.policyArns = builder.policyArns;
            this.roleArn = builder.roleArn;
            this.sessionName = builder.sessionName;
            this.webIdentityToken = builder.webIdentityToken;
            this.webIdentityTokenFile = builder.webIdentityTokenFile;
        }

        @Override
        public final java.lang.String getDuration() {
            return this.duration;
        }

        @Override
        public final java.lang.String getPolicy() {
            return this.policy;
        }

        @Override
        public final java.util.List<java.lang.String> getPolicyArns() {
            return this.policyArns;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.String getSessionName() {
            return this.sessionName;
        }

        @Override
        public final java.lang.String getWebIdentityToken() {
            return this.webIdentityToken;
        }

        @Override
        public final java.lang.String getWebIdentityTokenFile() {
            return this.webIdentityTokenFile;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDuration() != null) {
                data.set("duration", om.valueToTree(this.getDuration()));
            }
            if (this.getPolicy() != null) {
                data.set("policy", om.valueToTree(this.getPolicy()));
            }
            if (this.getPolicyArns() != null) {
                data.set("policyArns", om.valueToTree(this.getPolicyArns()));
            }
            if (this.getRoleArn() != null) {
                data.set("roleArn", om.valueToTree(this.getRoleArn()));
            }
            if (this.getSessionName() != null) {
                data.set("sessionName", om.valueToTree(this.getSessionName()));
            }
            if (this.getWebIdentityToken() != null) {
                data.set("webIdentityToken", om.valueToTree(this.getWebIdentityToken()));
            }
            if (this.getWebIdentityTokenFile() != null) {
                data.set("webIdentityTokenFile", om.valueToTree(this.getWebIdentityTokenFile()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.provider.AwsProviderAssumeRoleWithWebIdentity"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AwsProviderAssumeRoleWithWebIdentity.Jsii$Proxy that = (AwsProviderAssumeRoleWithWebIdentity.Jsii$Proxy) o;

            if (this.duration != null ? !this.duration.equals(that.duration) : that.duration != null) return false;
            if (this.policy != null ? !this.policy.equals(that.policy) : that.policy != null) return false;
            if (this.policyArns != null ? !this.policyArns.equals(that.policyArns) : that.policyArns != null) return false;
            if (this.roleArn != null ? !this.roleArn.equals(that.roleArn) : that.roleArn != null) return false;
            if (this.sessionName != null ? !this.sessionName.equals(that.sessionName) : that.sessionName != null) return false;
            if (this.webIdentityToken != null ? !this.webIdentityToken.equals(that.webIdentityToken) : that.webIdentityToken != null) return false;
            return this.webIdentityTokenFile != null ? this.webIdentityTokenFile.equals(that.webIdentityTokenFile) : that.webIdentityTokenFile == null;
        }

        @Override
        public final int hashCode() {
            int result = this.duration != null ? this.duration.hashCode() : 0;
            result = 31 * result + (this.policy != null ? this.policy.hashCode() : 0);
            result = 31 * result + (this.policyArns != null ? this.policyArns.hashCode() : 0);
            result = 31 * result + (this.roleArn != null ? this.roleArn.hashCode() : 0);
            result = 31 * result + (this.sessionName != null ? this.sessionName.hashCode() : 0);
            result = 31 * result + (this.webIdentityToken != null ? this.webIdentityToken.hashCode() : 0);
            result = 31 * result + (this.webIdentityTokenFile != null ? this.webIdentityTokenFile.hashCode() : 0);
            return result;
        }
    }
}
