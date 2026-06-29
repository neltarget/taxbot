"""
GRA TaxBot RAG Pipeline - ChromaDB Vector Database Setup
Creates and populates ChromaDB with embedded chunks
"""

import json
import chromadb
from chromadb.utils import embedding_functions
from pathlib import Path
from typing import List, Dict, Optional


# Resolve paths relative to this script
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / 'data'
CHROMA_DB_PATH = str(DATA_DIR / 'chroma_db')
EMBEDDINGS_PATH = str(DATA_DIR / 'embedded_chunks.json')

# Embedding model must match generate_embeddings.py
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# Similarity threshold — chunks with distance above this are discarded
# Cosine distance: 0 = identical, 2 = opposite. Lower is better.
DEFAULT_SIMILARITY_THRESHOLD = 0.5


class TaxBotVectorDB:
    """ChromaDB wrapper for TaxBot RAG pipeline."""

    def __init__(
        self,
        persist_directory: str = CHROMA_DB_PATH,
        collection_name: str = "tax_chunks",
    ):
        self.persist_directory = persist_directory
        self.collection_name = collection_name

        # Use the SAME embedding function for storage and queries
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=EMBEDDING_MODEL
        )

        self.client = chromadb.PersistentClient(path=persist_directory)

        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )

        print(f"ChromaDB initialized at: {persist_directory}")
        print(f"Collection: {collection_name}")
        print(f"Embedding model: {EMBEDDING_MODEL}")
        print(f"Current documents: {self.collection.count()}")

    def load_embedded_chunks(self, json_path: str) -> List[Dict]:
        """Load embedded chunks from JSON file."""
        print(f"Loading embedded chunks from: {json_path}")
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        chunks = data['chunks']
        print(f"Loaded {len(chunks)} chunks")
        return chunks

    def add_chunks(self, chunks: List[Dict], batch_size: int = 100) -> None:
        """Add chunks to ChromaDB in batches."""
        total_chunks = len(chunks)
        print(f"Adding {total_chunks} chunks to ChromaDB...")

        for i in range(0, total_chunks, batch_size):
            batch = chunks[i:i + batch_size]

            ids = [c['chunk_id'] for c in batch]
            documents = [c['text'] for c in batch]
            metadatas = [
                {
                    'source': c['metadata']['source'],
                    'category': c['metadata']['category'],
                    'content_type': c['metadata']['content_type'],
                    'is_time_sensitive': str(c['metadata']['is_time_sensitive']),
                    'parent_id': c['parent_id'],
                    'chunk_index': c['metadata']['chunk_index'],
                    'total_chunks': c['metadata']['total_chunks'],
                }
                for c in batch
            ]

            # ChromaDB will embed documents using the collection's embedding function
            self.collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas,
            )

            print(f"  Added batch {i // batch_size + 1}: {len(batch)} chunks")

        print(f"Total documents in collection: {self.collection.count()}")

    def query(
        self,
        query_text: str,
        n_results: int = 5,
        where: Optional[Dict] = None,
        similarity_threshold: float = DEFAULT_SIMILARITY_THRESHOLD,
    ) -> Dict:
        """
        Query the vector database with similarity filtering.

        Args:
            query_text: The search query
            n_results: Max number of results to return
            where: Metadata filter (e.g., {"category": "paye"})
            similarity_threshold: Max cosine distance allowed (lower = stricter)

        Returns:
            Filtered query results
        """
        # Fetch more candidates than needed so we can filter
        fetch_n = min(n_results * 3, self.collection.count())

        query_params = {
            'query_texts': [query_text],
            'n_results': fetch_n,
        }

        if where:
            query_params['where'] = where

        results = self.collection.query(**query_params)

        # Filter by similarity threshold
        if results['distances'] and results['distances'][0]:
            filtered = {
                'ids': [[]],
                'documents': [[]],
                'metadatas': [[]],
                'distances': [[]],
            }
            for idx, distance in enumerate(results['distances'][0]):
                if distance <= similarity_threshold:
                    filtered['ids'][0].append(results['ids'][0][idx])
                    filtered['documents'][0].append(results['documents'][0][idx])
                    filtered['metadatas'][0].append(results['metadatas'][0][idx])
                    filtered['distances'][0].append(distance)
            results = filtered

        # Trim to requested count
        results['ids'][0] = results['ids'][0][:n_results]
        results['documents'][0] = results['documents'][0][:n_results]
        results['metadatas'][0] = results['metadatas'][0][:n_results]
        results['distances'][0] = results['distances'][0][:n_results]

        return results

    def get_collection_stats(self) -> Dict:
        """Get statistics about the collection."""
        count = self.collection.count()
        sample = self.collection.peek(limit=5)
        return {
            'total_documents': count,
            'collection_name': self.collection_name,
            'persist_directory': self.persist_directory,
            'embedding_model': EMBEDDING_MODEL,
            'sample_metadata_keys': list(sample['metadatas'][0].keys()) if sample['metadatas'] else [],
        }

    def delete_collection(self) -> None:
        """Delete the collection (for re-initialization)."""
        self.client.delete_collection(self.collection_name)
        print(f"Deleted collection: {self.collection_name}")


def rebuild():
    """Delete existing collection and rebuild from embedded_chunks.json."""
    vector_db = TaxBotVectorDB()
    vector_db.delete_collection()

    # Re-create by re-initializing
    vector_db = TaxBotVectorDB()
    chunks = vector_db.load_embedded_chunks(EMBEDDINGS_PATH)
    vector_db.add_chunks(chunks)

    stats = vector_db.get_collection_stats()
    print(f"\n{'='*50}")
    print("CHROMADB REBUILD COMPLETE")
    print(f"{'='*50}")
    for key, value in stats.items():
        print(f"  {key}: {value}")

    return vector_db


def main():
    """Main execution function — load chunks into ChromaDB."""
    vector_db = TaxBotVectorDB()
    chunks = vector_db.load_embedded_chunks(EMBEDDINGS_PATH)
    vector_db.add_chunks(chunks)

    stats = vector_db.get_collection_stats()
    print(f"\n{'='*50}")
    print("CHROMADB SETUP COMPLETE")
    print(f"{'='*50}")
    for key, value in stats.items():
        print(f"  {key}: {value}")

    # Example query
    print(f"\n{'='*50}")
    print("EXAMPLE QUERY")
    print(f"{'='*50}")

    results = vector_db.query(
        query_text="What is the PAYE tax rate in Ghana?",
        n_results=3,
    )

    print(f"\nQuery: 'What is the PAYE tax rate in Ghana?'")
    print(f"\nTop 3 results:")

    for i, (doc, metadata, distance) in enumerate(zip(
        results['documents'][0],
        results['metadatas'][0],
        results['distances'][0]
    )):
        print(f"\n--- Result {i+1} (Distance: {distance:.4f}) ---")
        print(f"Category: {metadata['category']}")
        print(f"Source: {metadata['source']}")
        print(f"Text preview: {doc[:200]}...")


if __name__ == '__main__':
    main()
