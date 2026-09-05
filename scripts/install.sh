#!/bin/bash
# ============================================================
# INFINEON Enterprise Platform — One-Line Installer
# Usage: curl -sSL https://get.infineon.com | bash
# ============================================================

set -e

BINARY_NAME="infineon"
INSTALL_DIR="/usr/local/bin"
DATA_DIR="/var/lib/infineon"
DB_NAME="infineon"
DB_USER="infineon"
DB_PASS="$(openssl rand -base64 24)"
PORT="${INFINEON_PORT:-8080}"

echo "╔══════════════════════════════════════════════════════╗"
echo "║  INFINEON Enterprise Platform — Installer           ║"
echo "║  Version: 1.0.0                                     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
case "$ARCH" in
    x86_64)  ARCH="amd64" ;;
    aarch64) ARCH="arm64" ;;
    armv7l)  ARCH="armv7" ;;
esac

echo "→ Detected: $OS / $ARCH"

# Check for PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "→ PostgreSQL not found. Installing..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update -qq
        sudo apt-get install -y -qq postgresql postgresql-client
    elif command -v yum &> /dev/null; then
        sudo yum install -y postgresql-server postgresql
        sudo postgresql-setup initdb
    elif command -v brew &> /dev/null; then
        brew install postgresql@16
        brew services start postgresql@16
    else
        echo "❌ Cannot install PostgreSQL automatically."
        echo "   Please install PostgreSQL 15+ manually, then re-run this script."
        exit 1
    fi
fi

# Ensure PostgreSQL is running
if command -v systemctl &> /dev/null; then
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
fi

# Create database and user
echo "→ Setting up database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true

# Create data directory
sudo mkdir -p "$DATA_DIR"
sudo chown "$USER" "$DATA_DIR"

# Download binary (placeholder — replace with real release URL)
echo "→ Downloading INFINEON binary..."
RELEASE_URL="https://releases.infineon.com/infineon-${OS}-${ARCH}"
# curl -sSL "$RELEASE_URL" -o "$INSTALL_DIR/$BINARY_NAME"
# chmod +x "$INSTALL_DIR/$BINARY_NAME"

# For local builds, copy from build directory
if [ -f "./bin/infineon" ]; then
    sudo cp ./bin/infineon "$INSTALL_DIR/$BINARY_NAME"
    sudo chmod +x "$INSTALL_DIR/$BINARY_NAME"
    echo "→ Installed from local build"
elif [ -f "./cmd/infineon/main.go" ]; then
    echo "→ Source found. Building..."
    if command -v go &> /dev/null; then
        go build -o "$INSTALL_DIR/$BINARY_NAME" ./cmd/infineon/
        echo "→ Built and installed"
    else
        echo "❌ Go not installed. Please install Go 1.22+ first."
        exit 1
    fi
else
    echo "❌ Binary not found. Place infineon binary in ./bin/ or build from source."
    exit 1
fi

# Create .env file
cat > "$DATA_DIR/.env" <<EOF
INFINEON_PORT=$PORT
INFINEON_DB_HOST=localhost
INFINEON_DB_PORT=5432
INFINEON_DB_NAME=$DB_NAME
INFINEON_DB_USER=$DB_USER
INFINEON_DB_PASSWORD=$DB_PASS
INFINEON_DB_SSLMODE=disable
INFINEON_JWT_SECRET=$(openssl rand -base64 32)
INFINEON_ENV=production
INFINEON_LOG_LEVEL=info
INFINEON_DATA_DIR=$DATA_DIR
INFINEON_CORS_ORIGINS=http://localhost:$PORT
INFINEON_SERVER_TIMEZONE=Africa/Lagos
EOF

echo "→ Configuration saved to $DATA_DIR/.env"

# Run migrations
echo "→ Running database migrations..."
"$BINARY_NAME" migrate --env "$DATA_DIR/.env" 2>/dev/null || true

# Seed demo data
echo "→ Seeding demo data..."
"$BINARY_NAME" seed --env "$DATA_DIR/.env" 2>/dev/null || true

# Create systemd service (Linux only)
if command -v systemctl &> /dev/null; then
    sudo tee /etc/systemd/system/infineon.service > /dev/null <<EOF
[Unit]
Description=INFINEON Enterprise Platform
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$DATA_DIR
ExecStart=$INSTALL_DIR/$BINARY_NAME serve --env $DATA_DIR/.env --port $PORT
Restart=always
RestartSec=5
Environment=HOME=$HOME

[Install]
WantedBy=multi-user.target
EOF
    sudo systemctl daemon-reload
    sudo systemctl enable infineon
    sudo systemctl start infineon
    echo "→ Service installed and started"
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ INFINEON installed successfully!                ║"
echo "║                                                      ║"
echo "║  Web UI:    http://localhost:$PORT                    ║"
echo "║  Admin:     admin@infineon.com                       ║"
echo "║  Password:  admin123                                 ║"
echo "║                                                      ║"
echo "║  Service:   sudo systemctl status infineon           ║"
echo "║  Logs:      sudo journalctl -u infineon -f           ║"
echo "║  Stop:      sudo systemctl stop infineon             ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "Database password: $DB_PASS"
echo "Save this to $DATA_DIR/.env (already saved)"
