from __future__ import annotations

import hashlib
import zlib


class Gitobject:
    """Represents a Git object (blob, tree, or commit)."""

    def __init__(self, obj_type: str, content: bytes):
        self.type = obj_type
        self.content = content

    def hash(self) -> str:
        header = f"{self.type} {len(self.content)}\0".encode()
        return hashlib.sha256(header + self.content).hexdigest()

    def serialize(self) -> bytes:
        header = f"{self.type} {len(self.content)}\0".encode()
        return zlib.compress(header + self.content)

    @classmethod
    def deserialize(cls, data: bytes) -> Gitobject:
        decompress = zlib.decompress(data)
        null_id = decompress.find(b"\0")
        header = decompress[:null_id]
        content = decompress[null_id + 1 :]
        obj_type, _ = header.split(b" ", 1)
        return cls(obj_type.decode(), content)


class Blob(Gitobject):
    """Represents a file in the repository."""

    def __init__(self, content: bytes):
        super().__init__("blob", content)


class Tree(Gitobject):
    """Represents a directory in the repository."""

    def __init__(self, entries: list[tuple[str, str, str]] | None = None):
        self.entries = entries or []
        content = self._serialize_entries()
        super().__init__("tree", content)

    def _serialize_entries(self) -> bytes:
        content = b""
        for name, mode, obj_hash in sorted(
            self.entries, key=lambda entry: (entry[1], entry[0])
        ):
            content += f"{mode} {name}\0".encode()
            content += bytes.fromhex(obj_hash)

        return content

    def add_entries(self, name: str, mode: str, obj_hash: str):
        self.entries.append((name, mode, obj_hash))

    @classmethod
    def from_content(cls, content: bytes) -> Tree:
        tree = cls([])
        i = 0
        while i < len(content):
            null_index = content.find(b"\0", i)
            if null_index == -1:
                break
            mode_name = content[i:null_index].decode()
            mode, name = mode_name.split(" ", 1)
            # SHA-256 hashes are 32 bytes (64 hex characters)
            hash_end = null_index + 33
            if hash_end > len(content):
                raise ValueError("Corrupted tree object: hash extends beyond content")
            obj_hash = content[null_index + 1 : hash_end].hex()
            tree.entries.append((name, mode, obj_hash))
            i = hash_end
        return tree
