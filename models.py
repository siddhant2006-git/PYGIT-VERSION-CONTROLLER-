from __future__ import annotations

import hashlib  # For creating the unique hash of objects
import zlib  # For compressing and decompressing data


class Gitobject:
    "blob, tree, and commit."

    def __init__(self, obj_type: str, content: bytes):
      # init constructor which are store the data formation
        self.type = obj_type
        self.content = content

    def hash(self) -> str:
      # encode -convert text into specfic  formate .
        header = f"{self.type} {len(self.content)}\0".encode()
        return hashlib.sha1(header + self.content).hexdigest()

# self.type -A string indicate like blob, tree , commit .
# len(self.content)- it is used to count the number of bytes in the content .
    def serialize(self) -> bytes:
        # compress the big data convert into small data .
        header = f"{self.type} {len(self.content)}\0".encode()
        return zlib.compress(header + self.content)

    @classmethod
    def deserialize(cls, data: bytes) -> "Gitobject":
        # Read compressed data and convert it back into an object
        # decompress - small data convert into orginal data 
        # decode - bytes convert into string .
        # cls - call the constructor from the gitobject .
        # decode - it is used to convert bytes to string change .
        decompress = zlib.decompress(data)
        null_id = decompress.find(b"\0")
        header = decompress[:null_id]
        content = decompress[null_id + 1 :]
        obj_type, _ = header.split(b" ", 1)
        return cls(obj_type.decode(), content)


class Blob(Gitobject):
    "represent on repository file"

    def __init__(self, content: bytes):
        # super-to access the property of parent .
        super().__init__("blob", content)

# tree - inheritace can use to access to parent from to child.
class Tree(Gitobject):
    "represent from the repo.py file ."

    def __init__(self, entries: list[tuple[str, str, str]] | None = None):
        # Store the list of entries, or use an empty list if none is given
        self.entries = entries or []
        content = self._serialize_entries()
        super().__init__("tree", content)

    def _serialize_entries(self) -> bytes:
        # Convert tree entries into a byte format that can be stored
        content = b""
        for name, mode, obj_hash in sorted(
            self.entries, key=lambda entry: (entry[1], entry[0])
        ):
            content += f"{mode} {name}\0".encode()
            content += bytes.fromhex(obj_hash)

        return content

    def add_entries(self, name: str, mode: str, obj_hash: str):
        # Add one file or folder entry to the tree
        self.entries.append((name, mode, obj_hash))

    @classmethod
    def from_content(cls, content: bytes) -> "Tree":
        # Rebuild a tree object from stored byte data
        tree = cls([])
        i = 0
        while i < len(content):
            null_index = content.find(b"\0", i)
            if null_index == -1:
                break
            mode_name = content[i:null_index].decode()
            mode, name = mode_name.split(" ", 1)
            obj_hash = content[null_index + 1 : null_index + 21].hex()
            tree.entries.append((name, mode, obj_hash))
            i = null_index + 21
        return tree
