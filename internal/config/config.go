package config

import (
	"fmt"
	"os"
)

type Config struct {
	Port        string
	Mode        string // on-premise, cloud, hybrid
	DatabaseURL string
	CloudURL    string // for hybrid/cloud sync
	JWTSecret   string
	LicenseFile string
	LogLevel    string
	BackupDir   string

	// Payment Integration
	PaymentProvider       string // paystack, stripe, mock
	PaystackSecretKey     string
	PaystackWebhookSecret string
	StripeSecretKey       string
	StripeWebhookSecret   string
}

func Load() (*Config, error) {
	cfg := &Config{
		Port:        getEnv("INFINEON_PORT", "8080"),
		Mode:        getEnv("INFINEON_MODE", "on-premise"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://infineon:infineon@localhost:5432/infineon?sslmode=disable"),
		CloudURL:    getEnv("INFINEON_CLOUD_URL", ""),
		JWTSecret:   getEnv("INFINEON_JWT_SECRET", "change-me-in-production"),
		LicenseFile: getEnv("INFINEON_LICENSE_FILE", ""),
		LogLevel:    getEnv("INFINEON_LOG_LEVEL", "info"),
		BackupDir:   getEnv("INFINEON_BACKUP_DIR", "/var/lib/infineon/backups"),

		// Payment (default to mock for demo mode)
		PaymentProvider:       getEnv("INFINEON_PAYMENT_PROVIDER", "mock"),
		PaystackSecretKey:     getEnv("PAYSTACK_SECRET_KEY", ""),
		PaystackWebhookSecret: getEnv("PAYSTACK_WEBHOOK_SECRET", ""),
		StripeSecretKey:       getEnv("STRIPE_SECRET_KEY", ""),
		StripeWebhookSecret:   getEnv("STRIPE_WEBHOOK_SECRET", ""),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
