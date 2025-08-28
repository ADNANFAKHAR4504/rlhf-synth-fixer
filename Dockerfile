# Use Ubuntu 24.04 as base image
FROM ubuntu:24.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    libssl-dev \
    zlib1g-dev \
    libbz2-dev \
    libreadline-dev \
    libsqlite3-dev \
    libncurses5-dev \
    libncursesw5-dev \
    xz-utils \
    tk-dev \
    libffi-dev \
    liblzma-dev \
    unzip \
    jq \
    bc \
    && rm -rf /var/lib/apt/lists/*

# Install AWS CLI (arch-aware)
RUN arch=$(uname -m) && \
    if [ "$arch" = "x86_64" ]; then \
      curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"; \
    elif [ "$arch" = "aarch64" ]; then \
      curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"; \
    else \
      echo "Unsupported architecture: $arch" && exit 1; \
    fi && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm -rf awscliv2.zip aws/

# Install Terraform 1.12.2
RUN curl -fsSL https://releases.hashicorp.com/terraform/1.12.2/terraform_1.12.2_linux_amd64.zip -o terraform.zip && \
    unzip terraform.zip && \
    mv terraform /usr/local/bin/ && \
    chmod +x /usr/local/bin/terraform && \
    rm terraform.zip

# Install Pulumi 3.109.0
RUN curl -fsSL https://get.pulumi.com/releases/sdk/pulumi-v3.109.0-linux-x64.tar.gz -o pulumi.tar.gz && \
    tar -xzf pulumi.tar.gz && \
    mv pulumi/* /usr/local/bin/ && \
    rm -rf pulumi.tar.gz pulumi/

# Install pyenv
RUN curl https://pyenv.run | bash

# Add pyenv to PATH
ENV PATH="/root/.pyenv/bin:$PATH"
ENV PYENV_ROOT="/root/.pyenv"

# Install Python 3.12.11 using pyenv
RUN eval "$(pyenv init --path)" && \
    eval "$(pyenv init -)" && \
    pyenv install 3.12.11 && \
    pyenv global 3.12.11

# Set Python 3.12.11 as default
ENV PATH="/root/.pyenv/versions/3.12.11/bin:$PATH"

# Install nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Add nvm to PATH
ENV NVM_DIR="/root/.nvm"
ENV PATH="$NVM_DIR:$PATH"

# Install Node.js 22.17.0 using nvm
RUN . "$NVM_DIR/nvm.sh" && \
    nvm install 22.17.0 && \
    nvm use 22.17.0 && \
    nvm alias default 22.17.0

# Set Node.js 22.17.0 as default
ENV PATH="/root/.nvm/versions/node/v22.17.0/bin:$PATH"

# Install pipenv 2025.0.4
RUN python -m pip install --upgrade pip && \
    pip install pipenv==2025.0.4

# Initialize pyenv and nvm in shell profile for faster container startup
RUN echo 'export PATH="/root/.pyenv/bin:$PATH"' >> /root/.bashrc && \
    echo 'export PYENV_ROOT="/root/.pyenv"' >> /root/.bashrc && \
    echo 'export PATH="/root/.pyenv/versions/3.12.11/bin:$PATH"' >> /root/.bashrc && \
    echo 'export NVM_DIR="/root/.nvm"' >> /root/.bashrc && \
    echo 'export PATH="$NVM_DIR:$PATH"' >> /root/.bashrc && \
    echo 'export PATH="/root/.nvm/versions/node/v22.17.0/bin:$PATH"' >> /root/.bashrc && \
    echo 'eval "$(pyenv init --path)"' >> /root/.bashrc && \
    echo 'eval "$(pyenv init -)"' >> /root/.bashrc && \
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> /root/.bashrc

# Copy dockerEntryPoint.sh script
COPY dockerEntryPoint.sh /dockerEntryPoint.sh
RUN chmod +x /dockerEntryPoint.sh

# Set working directory
WORKDIR /app

# Copy application code
COPY . .
RUN chmod -R +x scripts

# Run setup.sh to prepare the environment
RUN ./scripts/setup.sh

# Set entrypoint    
ENTRYPOINT ["/dockerEntryPoint.sh"]
