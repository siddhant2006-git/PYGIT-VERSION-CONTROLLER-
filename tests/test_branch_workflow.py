import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from repository import repository


class BranchWorkflowTests(unittest.TestCase):
    def test_checkout_new_branch_and_merge(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = repository(temp_dir)
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

            result = repo.merge("feature")

            self.assertEqual(result, "feature")
            self.assertEqual(repo.get_current_branch(), "main")

    def test_rebase_feature_branch_onto_main(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = repository(temp_dir)
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
            repo = repository(temp_dir)
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
            repo = repository(temp_dir)
            repo.init()

            result = repo.add_remote("origin", "https://github.com")

            self.assertEqual(result, "origin")
            self.assertEqual(repo.get_remote("origin"), "https://github.com")

    def test_push_uses_upstream_flag_when_requested(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = repository(temp_dir)
            repo.init()

            with patch("subprocess.run") as mock_run:
                repo.push_branch("origin", "main", set_upstream=True)

            self.assertEqual(
                mock_run.call_args.args[0], ["git", "push", "-u", "origin", "main"]
            )


if __name__ == "__main__":
    unittest.main()
