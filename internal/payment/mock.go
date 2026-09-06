package payment

import (
	"context"
	"fmt"
	"math/rand"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// Mock Payment Provider
// Simulates Paystack/Stripe for demo mode.
// Always succeeds. Useful for testing without real credentials.
// ═══════════════════════════════════════════════════════════════

type MockProvider struct{}

func NewMockProvider() *MockProvider {
	return &MockProvider{}
}

func (m *MockProvider) Name() string { return "mock" }

func (m *MockProvider) Initialize(ctx context.Context, req InitializeRequest) (*InitializeResponse, error) {
	ref := req.Reference
	if ref == "" {
		ref = fmt.Sprintf("MOCK-%d", time.Now().UnixNano())
	}

	return &InitializeResponse{
		Reference:        ref,
		AuthorizationURL: fmt.Sprintf("https://checkout.mockpay.com/%s", ref),
		AccessCode:       "mock_access_" + ref,
		Status:           "pending",
	}, nil
}

func (m *MockProvider) Verify(ctx context.Context, reference string) (*VerificationResult, error) {
	// 90% success rate for mock
	status := "success"
	if rand.Float64() < 0.1 {
		status = "failed"
	}

	return &VerificationResult{
		Reference:     reference,
		Status:        status,
		Amount:        50000,
		Currency:      "NGN",
		Channel:       "card",
		GatewayRef:    fmt.Sprintf("mock-gw-%d", time.Now().UnixNano()),
		PaidAt:        time.Now(),
		CustomerEmail: "demo@guestart.com",
		Metadata:      map[string]string{"mock": "true"},
	}, nil
}

func (m *MockProvider) Refund(ctx context.Context, req RefundRequest) (*RefundResult, error) {
	return &RefundResult{
		RefundRef: fmt.Sprintf("MOCK-REF-%d", time.Now().UnixNano()),
		Status:    "success",
		Amount:    req.Amount,
	}, nil
}

func (m *MockProvider) VerifyWebhookSignature(payload []byte, signature string) bool {
	return true // Mock always passes
}
