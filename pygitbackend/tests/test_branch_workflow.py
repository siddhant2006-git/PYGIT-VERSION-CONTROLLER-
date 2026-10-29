import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

try:
    from pygitbackend.exceptions import BranchError, RemoteError
    from pygitbackend.repository import Repository
except ModuleNotFoundError:
    from exceptions import BranchError, RemoteError
    from repository import Repository


class BranchWorkflowTests(unittest.TestCase):
    def test_fast_forward_merge(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = Repository(temp_dir)
            repo.init()

            Path(temp_dir, "file.txt").write_text("hello", encoding="utf-8")
            repo.add_path("file.txt")
            repo.commit("first commit")

            repo.branch("feature")
            Path(temp_dir, "file.txt").write_text("hello world", encoding="utf-8")
            repo.add_path("file.txt")
            repo.commit("feature commit")

            repo.checkout("main")
            result = repo.merge("feature")

            self.assertEqual(result, "feature")
            self.assertEqual(repo.get_current_branch(), "main")

    def test_diverged_merge_raises_error(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = Repository(temp_dir)
            repo.init()

            Path(temp_dir, "file.txt").write_text("hello", encoding="utf-8")
            repo.add_path("file.txt")
            repo.commit("first commit")

            repo.branch("feature")
            Path(temp_dir, "file.txt").write_text("hello world", encoding="utf-8")
            repo.add_path("file.txt")
            repo.commit("feature commit")

            repo.checkout("main")
            Path(temp_dir, "file.txt").write_text("hello main", encoding="utf-8")
            repo.add_path("file.txt")
            repo.commit("main commit")

            with self.assertRaises(BranchError):
                repo.merge("feature")

    def test_rebase_feature_branch_onto_main(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = Repository(temp_dir)
            repo.init()

            Path(temp_dir, "file.txt").write_text("hello", encoding="utf-8")
            repo.add_path("file.txt")
            repo.commit("first commit")

            repo.branch("feature")
            Path(temp_dir, "file.txt").write_text("hello feature", encoding="utf-8")
            repo.add_path("file.txt")
            repo.commit("feature commit")

            repo.checkout("main")
            Path(temp_dir, "file.txt").write_text("hello main", encoding="utf-8")
            repo.add_path("file.txt")
            repo.commit("main commit")

            repo.checkout("feature")
            result = repo.rebase("main")

            self.assertEqual(result, "feature")
            self.assertEqual(repo.get_current_branch(), "feature")
            self.assertNotEqual(repo.get_head_commit_hash(), repo._read_ref("main"))

    def test_rename_current_branch(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = Repository(temp_dir)
            repo.init()
            repo.branch("feature")

            result = repo.rename_branch("main", force=True)

            self.assertEqual(result, "main")
            self.assertEqual(repo.get_current_branch(), "main")
            self.assertTrue(
                (Path(temp_dir, ".pygit", "refs", "heads", "main")).exists()
            )

    def test_add_remote(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = Repository(temp_dir)
            repo.init()

            result = repo.add_remote("origin", "https://github.com")

            self.assertEqual(result, "origin")
            self.assertEqual(repo.get_remote("origin"), "https://github.com")

    def test_push_uses_upstream_flag_when_requested(self):
        with tempfile.TemporaryDirectory() as temp_dir, tempfile.TemporaryDirectory() as remote_dir:
            repo = Repository(temp_dir)
            repo.init()
            remote_repo = Repository(remote_dir)
            remote_repo.init()

            Path(temp_dir, "file.txt").write_text("push me", encoding="utf-8")
            repo.add_path("file.txt")
            commit_hash = repo.commit("Initial commit")
            repo.add_remote("origin", remote_dir)

            result = repo.push_branch("origin", "main", set_upstream=True)

            self.assertTrue(result["success"])
            self.assertEqual(result["branch"], "main")
            self.assertEqual(result["remote"], "origin")
            self.assertGreater(result["objects_pushed"], 0)
            self.assertEqual(remote_repo._read_ref("main"), commit_hash)
            self.assertEqual(repo.get_upstream("main"), "origin")
            self.assertEqual(
                remote_repo.read_blob("main", "file.txt"), b"push me"
            )

    def test_push_reports_common_origin_typo(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = Repository(temp_dir)
            repo.init()

            with self.assertRaisesRegex(RemoteError, "Did you mean 'origin'\\?"):
                repo.push_branch("orgin", "main")


if __name__ == "__main__":
    unittest.main()
