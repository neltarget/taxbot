"""
GRA TaxBot RAG Pipeline - Text Chunking Module
Splits cleaned text into optimal chunks for embedding and retrieval
"""

import ast
import pandas as pd
import re
import hashlib
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from pathlib import Path


@dataclass
class ChunkConfig:
    """Configuration for text chunking."""
    chunk_size: int = 512          # Target chunk size in characters
    chunk_overlap: int = 100       # Overlap between consecutive chunks
    min_chunk_size: int = 100      # Minimum chunk size (discard smaller)
    max_chunk_size: int = 1000     # Maximum chunk size (split if larger)
    respect_sentences: bool = True # Try to split at sentence boundaries
    respect_paragraphs: bool = True # Try to split at paragraph boundaries


@dataclass
class Chunk:
    """Represents a single text chunk with metadata."""
    chunk_id: str
    parent_id: str
    text: str
    chunk_index: int
    total_chunks: int
    source: str
    category: str
    content_type: str
    is_time_sensitive: bool
    start_char: int
    end_char: int
    char_count: int
    word_count: int
    metadata: Dict = field(default_factory=dict)


def generate_chunk_id(parent_id: str, chunk_index: int, text: str) -> str:
    """Generate a unique chunk ID based on content hash."""
    hash_input = f"{parent_id}_{chunk_index}_{text[:50]}"
    return hashlib.md5(hash_input.encode()).hexdigest()[:12]


def split_into_sentences(text: str) -> List[str]:
    """
    Split text into sentences while preserving abbreviations and decimal numbers.
    """
    # Pattern to handle common abbreviations and decimal numbers
    # This prevents splitting on periods in "e.g.", "i.e.", "5.5%", etc.
    sentence_endings = re.compile(
        r'(?<=[.!?])\s+(?=[A-Z"\'])'  # Standard sentence endings
        r'|(?<=[.!?])(?=\s*$)'  # End of text
    )

    # First, protect decimal numbers and common abbreviations
    protected = text
    protected = re.sub(r'(\d)\.(\d)', r'\1<<DOT>>\2', protected)
    protected = re.sub(r'\be\.g\.\s', 'e.g.<<SPACE>>', protected)
    protected = re.sub(r'\bi\.e\.\s', 'i.e.<<SPACE>>', protected)
    protected = re.sub(r'\bvs\.\s', 'vs.<<SPACE>>', protected)

    # Split on sentence boundaries
    sentences = sentence_endings.split(protected)

    # Restore protected characters
    sentences = [s.replace('<<DOT>>', '.').replace('<<SPACE>>', ' ') for s in sentences]

    # Filter empty sentences
    return [s.strip() for s in sentences if s.strip()]


def split_into_paragraphs(text: str) -> List[str]:
    """Split text into paragraphs based on double newlines or logical breaks."""
    # Split on double newlines
    paragraphs = re.split(r'\n\s*\n', text)

    # If no double newlines, try single newlines with indentation
    if len(paragraphs) == 1:
        paragraphs = re.split(r'\n(?=\s)', text)

    return [p.strip() for p in paragraphs if p.strip()]


def find_split_points(text: str, target_pos: int) -> int:
    """
    Find the best position to split text near target_pos.
    Prioritizes: sentence boundary > word boundary > character boundary.
    """
    if target_pos >= len(text):
        return len(text)

    # Look for sentence boundary near target position
    search_range = min(50, target_pos)

    # Search backwards for sentence ending
    for i in range(target_pos, max(target_pos - search_range, 0), -1):
        if i < len(text) and text[i] in '.!?' and i + 1 < len(text):
            if text[i + 1] == ' ':
                return i + 1

    # Search forwards for sentence beginning
    for i in range(target_pos, min(target_pos + search_range, len(text))):
        if text[i] == ' ' and i + 1 < len(text) and text[i + 1].isupper():
            return i + 1

    # Fall back to word boundary
    for i in range(target_pos, max(target_pos - search_range, 0), -1):
        if text[i] == ' ':
            return i + 1

    # Fall back to character boundary
    return target_pos


def chunk_text_recursive(
    text: str,
    config: ChunkConfig,
    current_depth: int = 0,
    max_depth: int = 3
) -> List[str]:
    """
    Recursively chunk text, splitting on paragraph boundaries first,
    then sentence boundaries, then word boundaries.
    """
    if len(text) <= config.max_chunk_size:
        return [text] if len(text) >= config.min_chunk_size else []

    if current_depth >= max_depth:
        # Force split at max_chunk_size
        chunks = []
        pos = 0
        while pos < len(text):
            end = min(pos + config.max_chunk_size, len(text))
            if end < len(text):
                end = find_split_points(text, end)
            chunk = text[pos:end].strip()
            if chunk and len(chunk) >= config.min_chunk_size:
                chunks.append(chunk)
            pos = end - config.chunk_overlap if end < len(text) else len(text)
        return chunks

    # Try splitting by paragraphs
    if config.respect_paragraphs:
        paragraphs = split_into_paragraphs(text)
        if len(paragraphs) > 1:
            result = []
            current_chunk = ""
            for para in paragraphs:
                if len(current_chunk) + len(para) + 1 <= config.chunk_size:
                    current_chunk = f"{current_chunk}\n\n{para}" if current_chunk else para
                else:
                    if current_chunk:
                        result.append(current_chunk)
                    current_chunk = para

            if current_chunk:
                result.append(current_chunk)

            # Recursively chunk any oversized chunks
            final_result = []
            for chunk in result:
                if len(chunk) > config.max_chunk_size:
                    final_result.extend(
                        chunk_text_recursive(chunk, config, current_depth + 1, max_depth)
                    )
                elif len(chunk) >= config.min_chunk_size:
                    final_result.append(chunk)

            return final_result

    # Try splitting by sentences
    if config.respect_sentences:
        sentences = split_into_sentences(text)
        if len(sentences) > 1:
            chunks = []
            current_chunk = ""
            for sentence in sentences:
                if len(current_chunk) + len(sentence) + 1 <= config.chunk_size:
                    current_chunk = f"{current_chunk} {sentence}" if current_chunk else sentence
                else:
                    if current_chunk:
                        chunks.append(current_chunk)
                    current_chunk = sentence

            if current_chunk:
                chunks.append(current_chunk)

            return [c for c in chunks if len(c) >= config.min_chunk_size]

    # Force split at character level
    chunks = []
    pos = 0
    while pos < len(text):
        end = find_split_points(text, pos + config.chunk_size)
        chunk = text[pos:end].strip()
        if chunk and len(chunk) >= config.min_chunk_size:
            chunks.append(chunk)
        pos = end - config.chunk_overlap if end < len(text) else len(text)

    return chunks


def chunk_qa_pairs(text: str, config: ChunkConfig) -> List[str]:
    """
    Specialized chunking for Q&A format content.
    Keeps Q&A pairs together when possible.
    """
    # Split on Q: markers
    qa_pattern = re.compile(r'(Q:\s)', re.IGNORECASE)
    parts = qa_pattern.split(text)

    # Reconstruct Q&A pairs
    qa_pairs = []
    i = 0
    while i < len(parts):
        if re.match(r'Q:\s', parts[i], re.IGNORECASE):
            if i + 1 < len(parts):
                qa_pairs.append(f"{parts[i]}{parts[i + 1]}")
                i += 2
            else:
                qa_pairs.append(parts[i])
                i += 1
        else:
            if parts[i].strip():
                qa_pairs.append(parts[i])
            i += 1

    # Chunk Q&A pairs, keeping them together when possible
    chunks = []
    current_chunk = ""

    for qa in qa_pairs:
        if len(current_chunk) + len(qa) + 1 <= config.chunk_size:
            current_chunk = f"{current_chunk}\n\n{qa}" if current_chunk else qa
        else:
            if current_chunk:
                chunks.append(current_chunk)
            # If single QA is too large, chunk it recursively
            if len(qa) > config.max_chunk_size:
                sub_chunks = chunk_text_recursive(qa, config)
                chunks.extend(sub_chunks)
            else:
                current_chunk = qa

    if current_chunk and len(current_chunk) >= config.min_chunk_size:
        chunks.append(current_chunk)

    return chunks


def chunk_step_instructions(text: str, config: ChunkConfig) -> List[str]:
    """
    Specialized chunking for step-by-step instructions.
    Keeps steps together when possible.
    """
    # Split on Step markers
    step_pattern = re.compile(r'(Step\s+\d+:)', re.IGNORECASE)
    parts = step_pattern.split(text)

    # Reconstruct steps
    steps = []
    i = 0
    while i < len(parts):
        if re.match(r'Step\s+\d+:', parts[i], re.IGNORECASE):
            if i + 1 < len(parts):
                steps.append(f"{parts[i]}{parts[i + 1]}")
                i += 2
            else:
                steps.append(parts[i])
                i += 1
        else:
            if parts[i].strip():
                steps.append(parts[i])
            i += 1

    # Group steps into chunks
    chunks = []
    current_chunk = ""

    for step in steps:
        if len(current_chunk) + len(step) + 1 <= config.chunk_size:
            current_chunk = f"{current_chunk}\n{step}" if current_chunk else step
        else:
            if current_chunk:
                chunks.append(current_chunk)
            if len(step) > config.max_chunk_size:
                sub_chunks = chunk_text_recursive(step, config)
                chunks.extend(sub_chunks)
            else:
                current_chunk = step

    if current_chunk and len(current_chunk) >= config.min_chunk_size:
        chunks.append(current_chunk)

    return chunks


def create_chunks_from_record(
    record: pd.Series,
    config: ChunkConfig
) -> List[Chunk]:
    """
    Create chunks from a single dataset record.
    Uses specialized chunking strategies based on content type.
    """
    text = record['text']
    if pd.isna(text) or len(text.strip()) < config.min_chunk_size:
        return []

    # Parse structured fields
    structured_fields = {}
    if pd.notna(record.get('structured_fields')):
        try:
            structured_fields = ast.literal_eval(record['structured_fields'])
        except (ValueError, SyntaxError):
            pass

    # Select chunking strategy based on content
    is_qa = structured_fields.get('is_qa_format', False)
    has_steps = structured_fields.get('has_step_instructions', False)

    if is_qa:
        raw_chunks = chunk_qa_pairs(text, config)
    elif has_steps:
        raw_chunks = chunk_step_instructions(text, config)
    else:
        raw_chunks = chunk_text_recursive(text, config)

    # Create Chunk objects with metadata
    chunks = []
    current_pos = 0

    for i, chunk_text in enumerate(raw_chunks):
        # Find the position of this chunk in the original text
        start_pos = text.find(chunk_text[:50], current_pos)
        if start_pos == -1:
            start_pos = current_pos
        end_pos = start_pos + len(chunk_text)
        current_pos = start_pos

        chunk = Chunk(
            chunk_id=generate_chunk_id(record['id'], i, chunk_text),
            parent_id=record['id'],
            text=chunk_text,
            chunk_index=i,
            total_chunks=len(raw_chunks),
            source=record.get('source', ''),
            category=record.get('category', ''),
            content_type=record.get('content_type', 'formal'),
            is_time_sensitive=record.get('is_time_sensitive', False),
            start_char=start_pos,
            end_char=end_pos,
            char_count=len(chunk_text),
            word_count=len(chunk_text.split()),
            metadata={
                'has_step_instructions': has_steps,
                'is_qa_format': is_qa,
            }
        )
        chunks.append(chunk)

    return chunks


def chunk_dataset(
    input_path: str,
    output_path: str,
    config: Optional[ChunkConfig] = None
) -> pd.DataFrame:
    """
    Chunk the entire cleaned dataset and save results.
    """
    if config is None:
        config = ChunkConfig()

    print(f"Loading cleaned dataset from: {input_path}")
    df = pd.read_csv(input_path, dtype=str)
    print(f"Loaded {len(df)} records")

    all_chunks = []

    for idx, record in df.iterrows():
        chunks = create_chunks_from_record(record, config)
        all_chunks.extend(chunks)

    print(f"Created {len(all_chunks)} chunks from {len(df)} records")

    # Convert to DataFrame
    chunk_records = []
    for chunk in all_chunks:
        chunk_records.append({
            'chunk_id': chunk.chunk_id,
            'parent_id': chunk.parent_id,
            'text': chunk.text,
            'chunk_index': chunk.chunk_index,
            'total_chunks': chunk.total_chunks,
            'source': chunk.source,
            'category': chunk.category,
            'content_type': chunk.content_type,
            'is_time_sensitive': chunk.is_time_sensitive,
            'start_char': chunk.start_char,
            'end_char': chunk.end_char,
            'char_count': chunk.char_count,
            'word_count': chunk.word_count,
        })

    chunk_df = pd.DataFrame(chunk_records)

    # Save chunked dataset
    output_dir = Path(output_path).parent
    output_dir.mkdir(parents=True, exist_ok=True)

    chunk_df.to_csv(output_path, index=False, encoding='utf-8')
    print(f"Chunked dataset saved to: {output_path}")

    # Print statistics
    print(f"\n{'='*50}")
    print("CHUNKING STATISTICS")
    print(f"{'='*50}")
    print(f"Total chunks: {len(chunk_df)}")
    print(f"Average chunk size (chars): {chunk_df['char_count'].mean():.0f}")
    print(f"Average chunk size (words): {chunk_df['word_count'].mean():.0f}")
    print(f"Min chunk size: {chunk_df['char_count'].min()}")
    print(f"Max chunk size: {chunk_df['char_count'].max()}")
    print(f"Median chunk size: {chunk_df['char_count'].median():.0f}")

    # Chunks per category
    print(f"\nChunks per category:")
    for cat, count in chunk_df['category'].value_counts().head(10).items():
        print(f"  {cat}: {count}")

    return chunk_df


def validate_chunks(chunk_df: pd.DataFrame) -> Dict:
    """Validate chunk quality and return metrics."""
    metrics = {
        'total_chunks': len(chunk_df),
        'avg_char_count': chunk_df['char_count'].mean(),
        'avg_word_count': chunk_df['word_count'].mean(),
        'chunks_under_100_chars': (chunk_df['char_count'] < 100).sum(),
        'chunks_over_1000_chars': (chunk_df['char_count'] > 1000).sum(),
        'unique_sources': chunk_df['source'].nunique(),
        'unique_categories': chunk_df['category'].nunique(),
        'time_sensitive_chunks': chunk_df['is_time_sensitive'].sum(),
    }
    return metrics


if __name__ == '__main__':
    # Configuration - adjust these values based on your embedding model
    config = ChunkConfig(
        chunk_size=512,       # 512 chars works well for most embedding models
        chunk_overlap=100,    # 100 char overlap for context continuity
        min_chunk_size=100,   # Discard chunks smaller than this
        max_chunk_size=1000,  # Force split chunks larger than this
        respect_sentences=True,
        respect_paragraphs=True,
    )

    INPUT_PATH = str(Path(__file__).parent / 'data' / 'cleaned_dataset.csv')
    OUTPUT_PATH = str(Path(__file__).parent / 'data' / 'chunked_dataset.csv')

    # Run chunking
    chunk_df = chunk_dataset(INPUT_PATH, OUTPUT_PATH, config)

    # Validate
    metrics = validate_chunks(chunk_df)
    print(f"\nValidation Metrics:")
    for key, value in metrics.items():
        print(f"  {key}: {value}")
