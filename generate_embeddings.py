"""
GRA TaxBot RAG Pipeline - Embedding Generation Module
Generates vector embeddings for chunked text and saves to JSON
"""

import pandas as pd
import json
import numpy as np
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass


@dataclass
class EmbeddingConfig:
    """Configuration for embedding generation."""
    model_name: str = "all-MiniLM-L6-v2"  # Sentence-transformers model
    batch_size: int = 32                     # Batch size for processing
    normalize: bool = True                   # L2 normalize embeddings
    device: str = "cpu"                      # cpu or cuda


def load_chunks(input_path: str) -> pd.DataFrame:
    """Load the chunked dataset."""
    return pd.read_csv(input_path, dtype=str)


def generate_embeddings(
    texts: List[str],
    config: EmbeddingConfig
) -> np.ndarray:
    """
    Generate embeddings for a list of texts using sentence-transformers.
    """
    from sentence_transformers import SentenceTransformer

    print(f"Loading model: {config.model_name}")
    model = SentenceTransformer(config.model_name, device=config.device)

    print(f"Generating embeddings for {len(texts)} chunks...")
    embeddings = model.encode(
        texts,
        batch_size=config.batch_size,
        show_progress_bar=True,
        normalize_embeddings=config.normalize
    )

    print(f"Embedding dimension: {embeddings.shape[1]}")
    return embeddings


def save_embedded_chunks(
    chunks_df: pd.DataFrame,
    embeddings: np.ndarray,
    output_path: str
) -> None:
    """
    Save chunks with embeddings to a JSON file.
    Format optimized for vector store loading.
    """
    embedded_chunks = []

    for idx, row in chunks_df.iterrows():
        chunk_data = {
            "chunk_id": row['chunk_id'],
            "parent_id": row['parent_id'],
            "text": row['text'],
            "embedding": embeddings[idx].tolist(),
            "metadata": {
                "source": row['source'],
                "category": row['category'],
                "content_type": row['content_type'],
                "is_time_sensitive": str(row['is_time_sensitive']) == 'True',
                "chunk_index": int(row['chunk_index']),
                "total_chunks": int(row['total_chunks']),
                "char_count": int(row['char_count']),
                "word_count": int(row['word_count']),
            }
        }
        embedded_chunks.append(chunk_data)

    # Create output structure
    output_data = {
        "model_name": "all-MiniLM-L6-v2",
        "embedding_dimension": embeddings.shape[1],
        "total_chunks": len(embedded_chunks),
        "chunks": embedded_chunks
    }

    # Save to JSON
    output_dir = Path(output_path).parent
    output_dir.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"Saved {len(embedded_chunks)} embedded chunks to: {output_path}")


def main():
    """Main execution function."""
    # Configuration
    config = EmbeddingConfig(
        model_name="all-MiniLM-L6-v2",
        batch_size=32,
        normalize=True,
        device="cpu"
    )

    INPUT_PATH = str(Path(__file__).parent / 'data' / 'chunked_dataset.csv')
    OUTPUT_PATH = str(Path(__file__).parent / 'data' / 'embedded_chunks.json')

    # Load chunks
    print("Loading chunked dataset...")
    chunks_df = load_chunks(INPUT_PATH)
    print(f"Loaded {len(chunks_df)} chunks")

    # Generate embeddings
    texts = chunks_df['text'].tolist()
    embeddings = generate_embeddings(texts, config)

    # Save to JSON
    save_embedded_chunks(chunks_df, embeddings, OUTPUT_PATH)

    # Print summary
    print(f"\n{'='*50}")
    print("EMBEDDING GENERATION COMPLETE")
    print(f"{'='*50}")
    print(f"Total chunks embedded: {len(chunks_df)}")
    print(f"Embedding model: {config.model_name}")
    print(f"Embedding dimension: {embeddings.shape[1]}")
    print(f"Output file: {OUTPUT_PATH}")

    # Estimate file size
    import os
    file_size = os.path.getsize(OUTPUT_PATH)
    print(f"File size: {file_size / (1024*1024):.2f} MB")


if __name__ == '__main__':
    main()
