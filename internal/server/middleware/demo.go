package middleware

import "net/http"

// DemoPropertyID injects the demo property ID header when it's missing.
// This allows the demo mode to work without the frontend sending the header.
func DemoPropertyID(propertyID string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Header.Get("X-Property-ID") == "" {
				r.Header.Set("X-Property-ID", propertyID)
			}
			next.ServeHTTP(w, r)
		})
	}
}
