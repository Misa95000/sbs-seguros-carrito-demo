#!/usr/bin/env python3
import argparse, http.server, socket, socketserver
from pathlib import Path

def local_ip():
    s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
    try:s.connect(("8.8.8.8",80));return s.getsockname()[0]
    except OSError:return "127.0.0.1"
    finally:s.close()
class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):self.send_header("Cache-Control","no-store");super().end_headers()
def main():
    p=argparse.ArgumentParser();p.add_argument("--port",type=int,default=8080);a=p.parse_args();root=Path(__file__).resolve().parent
    print(f"Serving {root}\nComputer: http://localhost:{a.port}\nPhone: http://{local_ip()}:{a.port}")
    with socketserver.TCPServer(("0.0.0.0",a.port),Handler) as h:h.serve_forever()
if __name__=="__main__":main()
