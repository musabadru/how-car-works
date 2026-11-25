"""Static server for a Inkworks page that never lets the browser cache modules.

    python3 serve.py            # http://localhost:9081/
    python3 serve.py 9000       # another port

Plain `python3 -m http.server` lets browsers heuristically cache ES modules, so
after an edit a reload can mix fresh and stale files. `no-store` prevents that.
"""
import functools, http.server, pathlib, sys

ROOT = pathlib.Path(__file__).parent


class NoStore(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def log_message(self, fmt, *args):  # quiet
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 9081
    handler = functools.partial(NoStore, directory=str(ROOT))
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as httpd:
        print(f"serving {ROOT} on http://localhost:{port}/ (no-store)")
        httpd.serve_forever()
