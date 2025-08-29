package main

import (
	"bufio"
	"context"
	"github.com/creack/pty"
	"github.com/gorilla/websocket"
	"github.com/neurodesk/neurocontainers-ui/internal/builder"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
)

var upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}

func main() {
	http.HandleFunc("/ws", handleWS)
	log.Println("serving on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handleWS(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer c.Close()

	specURL := r.URL.Query().Get("spec")
	if specURL == "" {
		c.WriteMessage(websocket.TextMessage, []byte("spec query param required\n"))
		return
	}

	specPath, err := downloadFile(r.Context(), specURL)
	if err != nil {
		c.WriteMessage(websocket.TextMessage, []byte("download failed: "+err.Error()+"\n"))
		return
	}
	defer os.Remove(specPath)

	b := &builder.PythonBuilder{ScriptURL: "https://raw.githubusercontent.com/NeuroDesk/neurocontainers/main/builder/build.py"}
	pr, pw := io.Pipe()
	done := make(chan struct{})
	go func() {
		scanner := bufio.NewScanner(pr)
		for scanner.Scan() {
			c.WriteMessage(websocket.TextMessage, append(scanner.Bytes(), '\n'))
		}
		close(done)
	}()
	buildDir, err := b.Run(r.Context(), specPath, pw)
	pw.Close()
	<-done
	if err != nil {
		c.WriteMessage(websocket.TextMessage, []byte("builder error: "+err.Error()+"\n"))
		return
	}

	buildCmd := exec.CommandContext(r.Context(), "docker", "build", "-t", "built-image", buildDir)
	buildCmd.Stdout = wsWriter{c}
	buildCmd.Stderr = wsWriter{c}
	if err := buildCmd.Run(); err != nil {
		c.WriteMessage(websocket.TextMessage, []byte("docker build error: "+err.Error()+"\n"))
		return
	}

	cmd := exec.CommandContext(r.Context(), "docker", "run", "-it", "--rm", "built-image", "/bin/bash")
	f, err := pty.Start(cmd)
	if err != nil {
		c.WriteMessage(websocket.TextMessage, []byte("terminal start failed: "+err.Error()+"\n"))
		return
	}
	go func() {
		for {
			_, msg, err := c.ReadMessage()
			if err != nil {
				return
			}
			f.Write(msg)
		}
	}()
	io.Copy(wsWriter{c}, f)
}

type wsWriter struct{ *websocket.Conn }

func (w wsWriter) Write(p []byte) (int, error) {
	err := w.Conn.WriteMessage(websocket.BinaryMessage, p)
	if err != nil {
		return 0, err
	}
	return len(p), nil
}

func downloadFile(ctx context.Context, url string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	f, err := os.CreateTemp("", "spec-*.yaml")
	if err != nil {
		return "", err
	}
	defer f.Close()
	if _, err = io.Copy(f, resp.Body); err != nil {
		os.Remove(f.Name())
		return "", err
	}
	return f.Name(), nil
}
