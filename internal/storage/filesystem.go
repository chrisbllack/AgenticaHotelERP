package storage

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"
)

type Storage struct {
	basePath string
}

func New(basePath string) *Storage {
	os.MkdirAll(basePath, 0755)
	return &Storage{basePath: basePath}
}

func (s *Storage) Save(filename string, data io.Reader) (string, error) {
	dir := filepath.Join(s.basePath, time.Now().Format("2006/01"))
	os.MkdirAll(dir, 0755)

	path := filepath.Join(dir, filename)
	file, err := os.Create(path)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer file.Close()

	if _, err := io.Copy(file, data); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	return path, nil
}

func (s *Storage) GetPath(filename string) string {
	return filepath.Join(s.basePath, filename)
}
