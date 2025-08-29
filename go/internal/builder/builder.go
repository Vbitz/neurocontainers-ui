package builder

import (
	"context"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
)

type Builder interface {
	Run(ctx context.Context, yamlPath string, w io.Writer) (string, error)
}

type PythonBuilder struct {
	ScriptURL string
}

func (b *PythonBuilder) Run(ctx context.Context, yamlPath string, w io.Writer) (string, error) {
	tmpDir, err := os.MkdirTemp("", "builder")
	if err != nil {
		return "", err
	}
	defer os.RemoveAll(tmpDir)

	scriptPath := filepath.Join(tmpDir, "builder.py")
	resp, err := http.Get(b.ScriptURL)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	f, err := os.Create(scriptPath)
	if err != nil {
		return "", err
	}
	if _, err = io.Copy(f, resp.Body); err != nil {
		f.Close()
		return "", err
	}
	f.Close()

	cmd := exec.CommandContext(ctx, "python", scriptPath, yamlPath)
	cmd.Stdout = w
	cmd.Stderr = w
	if err := cmd.Run(); err != nil {
		return "", err
	}
	return filepath.Dir(yamlPath), nil
}
