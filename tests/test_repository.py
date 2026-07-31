import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from exceptions import BranchError, FileError, RemoteError, RepositoryError
from models import Blob, Gitobject, Tree
from repository import Repository, validate_branch_name, validate_path


class TestRepositoryInit(unittest.TestCase):
    def test_init_creates_directory_structure(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = Repository(temp_dir)
            repo.init()

            self.assertTrue((Path(temp_dir) / ".pygit").exists())
            self.assertTrue((Path(temp_dir) / ".pygit" / "objects").exists())
            self.assertTrue((Path(temp_dir) / ".pygit" / "refs" / "heads").exists())
            self.assertTrue((Path(temp_dir) / ".pygit" / "HEAD").exists())
            self.assertTrue((Path(temp_dir) / ".pygit" / "index").exists())

    def test_init_creates_main_branch(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = Repository(temp_dir)
            repo.init()

            self.assertEqual(repo.get_current_branch(), "main")


class TestRepositoryAddAndCommit(unittest.TestCase):
    def test_add_file_and_commit(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = Repository(temp_dir)
            repo.init()

            test_file = Path(temp_dir) / "test.txt"
            test_file.write_text("hello world", encoding="utf-8")

            repo.add_path("test.txt")

            index = repo.load_index()
            self.assertIn("test.txt", index)

            commit_hash = repo.commit("Initial commit")
            self.assertTrue(len(commit_hash) > 0)
            self.assertEqual(repo.get_head_commit_hash(), commit_hash)

    def test_add_nonexistent_file_raises_error(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = Repository(temp_dir)
            repo.init()

            with self.assertRaises(FileError):
                repo.add_path("nonexistent.txt")

    def test_add_directory(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = Repository(temp_dir)
            repo.init()

            sub_dir = Path(temp_dir) / "src"
            sub_dir.mkdir()
            (sub_dir / "main.py").write_text("print('hello')", encoding="utf-8")

            repo.add_path("src")
            index = repo.load_index()
            self.assertIn("src/main.py", index)


class TestRepositoryStatus(unittest.TestCase):
    def test_status_output(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = Repository(temp_dir)
            repo.init()

            (Path(temp_dir) / "untracked.txt").write_text("untracked", encoding="utf-8")
            (Path(temp_dir) / "staged.txt").write_text("staged", encoding="utf-8")
            repo.add_path("staged.txt")

            status_text = repo.status()
            self.assertIn("On branch main", status_text)
            self.assertIn("staged: staged.txt", status_text)
            self.assertIn("untracked.txt", status_text)


class TestValidationAndSecurity(unittest.TestCase):
    def test_invalid_branch_name(self):
        with self.assertRaises(BranchError):
            validate_branch_name("")
        with self.assertRaises(BranchError):
            validate_branch_name(".hidden")
        with self.assertRaises(BranchError):
            validate_branch_name("branch.lock")
        with self.assertRaises(BranchError):
            validate_branch_name("bad name!")

    def test_path_traversal_prevented(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            base = Path(temp_dir)
            with self.assertRaises(FileError):
                validate_path("../../etc/passwd", base)


class TestObjectStoreAndIntegrity(unittest.TestCase):
    def test_sha256_hash_and_integrity(self):
        blob = Blob(b"test content")
        # SHA-256 hex string should be 64 characters long
        self.assertEqual(len(blob.hash()), 64)

        serialized = blob.serialize()
        deserialized = Gitobject.deserialize(serialized)
        self.assertEqual(deserialized.type, "blob")
        self.assertEqual(deserialized.content, b"test content")

    def test_read_corrupted_object_raises(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            repo = Repository(temp_dir)
            repo.init()

            blob = Blob(b"test data")
            h = repo.store_object(blob)

            # Corrupt file contents on disk
            obj_file = repo.object_dir / h[:2] / h[2:]
            obj_file.write_bytes(b"corrupted data")

            with self.assertRaises(Exception):
                repo.read_object(h)


if __name__ == "__main__":
    unittest.main()
