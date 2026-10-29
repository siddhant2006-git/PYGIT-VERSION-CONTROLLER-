import asyncio
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.parse import urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from pygitbackend import server
from pygitbackend.api import app


class ApiResponse:
    def __init__(self, status_code: int, body: bytes):
        self.status_code = status_code
        self.text = body.decode("utf-8")

    def json(self):
        return json.loads(self.text)


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repos_dir = Path(self.temp_dir.name) / "repos"
        self.repos_dir.mkdir()
        self.repos_dir_patch = patch.object(server, "REPOS_DIR", self.repos_dir)
        self.repos_dir_patch.start()

    def tearDown(self):
        self.repos_dir_patch.stop()
        self.temp_dir.cleanup()

    def request(self, method: str, url: str, payload=None):
        parsed_url = urlsplit(url)
        body = json.dumps(payload).encode("utf-8") if payload is not None else b""
        headers = [(b"host", b"testserver")]
        if payload is not None:
            headers.append((b"content-type", b"application/json"))
        scope = {
            "type": "http",
            "asgi": {"version": "3.0", "spec_version": "2.3"},
            "http_version": "1.1",
            "method": method,
            "scheme": "http",
            "path": parsed_url.path,
            "raw_path": parsed_url.path.encode("ascii"),
            "query_string": parsed_url.query.encode("ascii"),
            "root_path": "",
            "headers": headers,
            "client": ("127.0.0.1", 12345),
            "server": ("testserver", 80),
        }
        response_start = {}
        response_body = bytearray()
        request_sent = False

        async def receive():
            nonlocal request_sent
            if request_sent:
                return {"type": "http.disconnect"}
            request_sent = True
            return {"type": "http.request", "body": body, "more_body": False}

        async def send(message):
            if message["type"] == "http.response.start":
                response_start.update(message)
            elif message["type"] == "http.response.body":
                response_body.extend(message.get("body", b""))

        asyncio.run(app(scope, receive, send))
        return ApiResponse(response_start["status"], bytes(response_body))

    def test_api_module_exposes_fastapi_app(self):
        self.assertIs(app, server.app)

    def test_get_missing_repository_does_not_create_it(self):
        response = self.request("GET", "/api/repositories/missing")

        self.assertEqual(response.status_code, 404)
        self.assertFalse((self.repos_dir / "missing").exists())

    def test_create_respects_initial_branch_and_supports_commit(self):
        response = self.request(
            "POST",
            "/api/repositories",
            {
                "name": "demo",
                "initialize_readme": False,
                "initial_branch": "develop",
            },
        )

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["current_branch"], "develop")
        branches_response = self.request("GET", "/api/repositories/demo/branches")
        self.assertEqual(branches_response.status_code, 200, branches_response.text)
        self.assertEqual(
            [branch["name"] for branch in branches_response.json()],
            ["develop"],
        )

        (self.repos_dir / "demo" / "hello.txt").write_text(
            "hello", encoding="utf-8"
        )
        add_response = self.request(
            "POST", "/api/repositories/demo/add", {"files": ["hello.txt"]}
        )
        self.assertEqual(add_response.status_code, 200, add_response.text)

        commit_response = self.request(
            "POST",
            "/api/repositories/demo/commit",
            {"message": "Add greeting"},
        )
        self.assertEqual(commit_response.status_code, 200, commit_response.text)
        self.assertTrue(commit_response.json()["hash"])

        files_response = self.request(
            "GET", "/api/repositories/demo/files?branch=develop"
        )
        self.assertEqual(files_response.status_code, 200, files_response.text)
        self.assertEqual(files_response.json()[0]["path"], "hello.txt")

    def test_create_rejects_invalid_initial_branch_before_creating_directory(self):
        response = self.request(
            "POST",
            "/api/repositories",
            {"name": "invalid-branch", "initial_branch": "../main"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse((self.repos_dir / "invalid-branch").exists())

    def test_merge_and_rebase_endpoints_use_repository_operations(self):
        create_response = self.request(
            "POST",
            "/api/repositories",
            {"name": "workflow", "initialize_readme": False},
        )
        self.assertEqual(create_response.status_code, 200, create_response.text)
        create_branch = self.request(
            "POST", "/api/repositories/workflow/branches", {"name": "feature"}
        )
        self.assertEqual(create_branch.status_code, 200, create_branch.text)

        (self.repos_dir / "workflow" / "feature.txt").write_text(
            "feature", encoding="utf-8"
        )
        add_response = self.request(
            "POST", "/api/repositories/workflow/add", {"files": ["feature.txt"]}
        )
        self.assertEqual(add_response.status_code, 200, add_response.text)
        commit_response = self.request(
            "POST",
            "/api/repositories/workflow/commit",
            {"message": "Feature commit"},
        )
        self.assertEqual(commit_response.status_code, 200, commit_response.text)
        checkout_response = self.request(
            "POST", "/api/repositories/workflow/checkout", {"branch": "main"}
        )
        self.assertEqual(checkout_response.status_code, 200, checkout_response.text)

        merge_response = self.request(
            "POST", "/api/repositories/workflow/merge", {"name": "feature"}
        )
        self.assertEqual(merge_response.status_code, 200, merge_response.text)
        self.assertEqual(merge_response.json()["branch"], "feature")

        rebase_response = self.request(
            "POST", "/api/repositories/workflow/rebase", {"name": "feature"}
        )
        self.assertEqual(rebase_response.status_code, 200, rebase_response.text)
        self.assertEqual(rebase_response.json()["current_branch"], "main")


if __name__ == "__main__":
    unittest.main()
