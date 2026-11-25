"""Local static server for How Cars Work with Cache-Control: no-store.

Usage:
    python serve.py         # serves http://127.0.0.1:9081/
    python serve.py 8080    # custom port
"""
import functools
import http.server
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent


class NoStoreHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 9081
    handler = functools.partial(NoStoreHandler, directory=str(ROOT))
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as httpd:
        print(f"Serving {ROOT} at http://127.0.0.1:{port}/ (no-store)")
        httpd.serve_forever()
