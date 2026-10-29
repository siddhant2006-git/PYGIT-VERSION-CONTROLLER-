import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from fastapi.testclient import TestClient

from pygitbackend import server
from pygitbackend.api import app


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repos_dir = Path(self.temp_dir.name) / "repos"
        self.repos_dir.mkdir()
        self.repos_dir_patch = patch.object(server, "REPOS_DIR", self.repos_dir)
        self.repos_dir_patch.start()
        self.client = TestClient(app)

    def tearDown(self):
        self.repos_dir_patch.stop()
        self.temp_dir.cleanup()

    def test_api_module_exposes_fastapi_app(self):
        self.assertIs(app, server.app)

    def test_get_missing_repository_does_not_create_it(self):
        response = self.client.get("/api/repositories/missing")

        self.assertEqual(response.status_code, 404)
        self.assertFalse((self.repos_dir / "missing").exists())

    def test_create_respects_initial_branch_and_supports_commit(self):
        response = self.client.post(
            "/api/repositories",
            json={
                "name": "demo",
                "initialize_readme": False,
                "initial_branch": "develop",
            },
        )

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["current_branch"], "develop")
        branches_response = self.client.get("/api/repositories/demo/branches")
        self.assertEqual(branches_response.status_code, 200, branches_response.text)
        self.assertEqual(
            [branch["name"] for branch in branches_response.json()],
            ["develop"],
        )

        (self.repos_dir / "demo" / "hello.txt").write_text(
            "hello", encoding="utf-8"
        )
        add_response = self.client.post(
            "/api/repositories/demo/add", json={"files": ["hello.txt"]}
        )
        self.assertEqual(add_response.status_code, 200, add_response.text)

        commit_response = self.client.post(
            "/api/repositories/demo/commit",
            json={"message": "Add greeting"},
        )
        self.assertEqual(commit_response.status_code, 200, commit_response.text)
        self.assertTrue(commit_response.json()["hash"])

        files_response = self.client.get(
            "/api/repositories/demo/files", params={"branch": "develop"}
        )
        self.assertEqual(files_response.status_code, 200, files_response.text)
        self.assertEqual(files_response.json()[0]["path"], "hello.txt")

    def test_create_rejects_invalid_initial_branch_before_creating_directory(self):
        response = self.client.post(
            "/api/repositories",
            json={"name": "invalid-branch", "initial_branch": "../main"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse((self.repos_dir / "invalid-branch").exists())

    def test_merge_and_rebase_endpoints_use_repository_operations(self):
        self.client.post(
            "/api/repositories",
            json={"name": "workflow", "initialize_readme": False},
        )
        create_branch = self.client.post(
            "/api/repositories/workflow/branches", json={"name": "feature"}
        )
        self.assertEqual(create_branch.status_code, 200, create_branch.text)

        (self.repos_dir / "workflow" / "feature.txt").write_text(
            "feature", encoding="utf-8"
        )
        add_response = self.client.post(
            "/api/repositories/workflow/add", json={"files": ["feature.txt"]}
        )
        self.assertEqual(add_response.status_code, 200, add_response.text)
        commit_response = self.client.post(
            "/api/repositories/workflow/commit",
            json={"message": "Feature commit"},
        )
        self.assertEqual(commit_response.status_code, 200, commit_response.text)
        checkout_response = self.client.post(
            "/api/repositories/workflow/checkout", json={"branch": "main"}
        )
        self.assertEqual(checkout_response.status_code, 200, checkout_response.text)

        merge_response = self.client.post(
            "/api/repositories/workflow/merge", json={"name": "feature"}
        )
        self.assertEqual(merge_response.status_code, 200, merge_response.text)
        self.assertEqual(merge_response.json()["branch"], "feature")

        rebase_response = self.client.post(
            "/api/repositories/workflow/rebase", json={"name": "feature"}
        )
        self.assertEqual(rebase_response.status_code, 200, rebase_response.text)
        self.assertEqual(rebase_response.json()["current_branch"], "main")


if __name__ == "__main__":
    unittest.main()
