package events

import (
	"fmt"
	"log"
	"sync"
)

type Event interface{}

type Handler func(event Event)

type Bus struct {
	mu       sync.RWMutex
	handlers map[string][]Handler
}

func NewBus() *Bus {
	return &Bus{handlers: make(map[string][]Handler)}
}

func (b *Bus) Subscribe(eventType string, handler Handler) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.handlers[eventType] = append(b.handlers[eventType], handler)
}

func (b *Bus) Publish(event Event) {
	b.mu.RLock()
	defer b.mu.RUnlock()

	eventType := fmt.Sprintf("%T", event)
	for _, handler := range b.handlers[eventType] {
		go func(h Handler) {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("Event handler panic: %v", r)
				}
			}()
			h(event)
		}(handler)
	}
}

// Event types

type ReservationCreated struct {
	ReservationID interface{}
	PropertyID    interface{}
	GuestID       interface{}
}

type ReservationConfirmed struct {
	ReservationID interface{}
	PropertyID    interface{}
}

type ReservationCancelled struct {
	ReservationID interface{}
	PropertyID    interface{}
	Reason        string
}

type CheckInCompleted struct {
	StayID  interface{}
	RoomID  interface{}
	GuestID interface{}
}

type CheckOutCompleted struct {
	StayID interface{}
	RoomID interface{}
}

type PaymentReceived struct {
	PaymentID interface{}
	FolioID   interface{}
	Amount    float64
}

type StockLevelLow struct {
	ProductID interface{}
	StoreID   interface{}
	Current   float64
	Reorder   float64
}
