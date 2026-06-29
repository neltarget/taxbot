"""
GRA TaxBot RAG Pipeline - Data Cleaning Script
Cleans the raw dataset for optimal RAG performance
"""

import pandas as pd
import re
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Optional


def load_dataset(file_path: str) -> pd.DataFrame:
    """Load the CSV dataset."""
    return pd.read_csv(file_path, dtype=str)


def normalize_whitespace(text: str) -> str:
    """Normalize whitespace: collapse multiple spaces, strip leading/trailing."""
    if pd.isna(text):
        return text
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def normalize_number_formatting(text: str) -> str:
    """
    Normalize inconsistent number formatting:
    - GHS 200,000 / GHS200,000 / 200000 GHS -> GHS 200,000
    """
    if pd.isna(text):
        return text

    # Standardize GHS placement: ensure space between GHS and number
    # But NOT for patterns like "Act 2015" or year references
    text = re.sub(r'(?<!\w)GHS(\d)', r'GHS \1', text)

    # Standardize number with GHS suffix: 200000 GHS -> GHS 200,000
    # But NOT for year-like patterns
    text = re.sub(r'(\d[\d,]*)\s*GHS\b', lambda m: f'GHS {m.group(1)}' if not re.match(r'^(19|20)\d{2}$', m.group(1).replace(',', '')) else m.group(0), text)

    # Ensure commas in large numbers (e.g., 200000 -> 200,000)
    # But NOT year numbers (1900-2099) or small numbers
    def add_commas(match):
        num_str = match.group(0).replace(',', '')
        try:
            num = int(num_str)
            # Skip year-like numbers (1900-2099) and numbers less than 1000
            if 1900 <= num <= 2099 or num < 1000:
                return match.group(0)
            return f'{num:,}'
        except ValueError:
            return match.group(0)

    text = re.sub(r'(?<!\d)(\d{4,})(?!\d)', add_commas, text)

    return text


def normalize_rate_formatting(text: str) -> str:
    """
    Normalize rate quoting inconsistencies:
    - 'approximately 22%' -> '21.9%' where referring to total VAT rate
    - Ensure % has no space before it
    """
    if pd.isna(text):
        return text

    # Normalize percentage formatting: ensure no space before %
    text = re.sub(r'(\d+)\s+%', r'\1%', text)
    text = re.sub(r'(\d+\.\d+)\s+%', r'\1%', text)

    return text


def flag_time_sensitive_content(text: str) -> Tuple[str, bool]:
    """
    Flag content that references specific years or 'as amended' phrases.
    Returns (text, is_time_sensitive).
    """
    if pd.isna(text):
        return text, False

    time_patterns = [
        r'\b(20\d{2})\b',  # Years like 2024, 2023
        r'\bas amended\b',
        r'\blatest amendment\b',
        r'\bcurrent\b',
        r'\bverify\b',
        r'\bcheck.*gra\.gov\.gh\b',
    ]

    is_sensitive = False
    for pattern in time_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            is_sensitive = True
            break

    return text, is_sensitive


def preserve_informal_content(text: str) -> Tuple[str, str]:
    """
    Detect and tag informal/pidgin content.
    Returns (text, content_type) where content_type is 'formal' or 'informal'.
    """
    if pd.isna(text):
        return text, 'formal'

    informal_indicators = [
        r'\bcharley\b',
        r'\bchop bar\b',
        r'\bmy guy\b',
        r'\bdey\b',
        r'\bi dey\b',
        r'\bgo\b.*\btrouble\b',
        r'\bdon\'t\b',
        r'\bcan\'t\b',
    ]

    for pattern in informal_indicators:
        if re.search(pattern, text, re.IGNORECASE):
            return text, 'informal'

    return text, 'formal'


def extract_structured_fields(text: str) -> Dict:
    """
    Extract structured metadata from raw_text for better RAG retrieval.
    """
    if pd.isna(text):
        return {}

    fields = {}

    # Extract tax rates mentioned
    rates = re.findall(r'(\d+\.?\d*)%', text)
    if rates:
        fields['tax_rates_mentioned'] = list(set(rates))

    # Extract GHS amounts
    amounts = re.findall(r'GHS\s*([\d,]+\.?\d*)', text)
    if amounts:
        fields['ghs_amounts_mentioned'] = list(set(amounts))

    # Extract deadlines/timeframes
    deadline_patterns = [
        (r'by\s+the\s+(\d+\w*\s+\w+)', 'deadline'),
        (r'within\s+(\d+\s+\w+)', 'timeframe'),
        (r'(\d+\s+\w+\s+of\s+the\s+following\s+\w+)', 'recurring_deadline'),
    ]
    deadlines = []
    for pattern, dtype in deadline_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        deadlines.extend([{'type': dtype, 'value': m} for m in matches])
    if deadlines:
        fields['deadlines'] = deadlines

    # Check for Q&A format
    if re.search(r'^Q:\s', text, re.MULTILINE) or 'Q:' in text:
        fields['is_qa_format'] = True
    else:
        fields['is_qa_format'] = False

    # Check for step-by-step instructions
    if re.search(r'Step\s+\d+:', text):
        fields['has_step_instructions'] = True
    else:
        fields['has_step_instructions'] = False

    return fields


def detect_missing_values(text: str) -> bool:
    """Detect if text appears truncated or has missing values."""
    if pd.isna(text):
        return True

    # Check if text ends abruptly
    if text.endswith(('--', '..', 'etc', 'e.g.')):
        return True

    # Check for incomplete sentences (ends with preposition or conjunction)
    if re.search(r'(?:and|or|but|the|of|in|for)\s*$', text, re.IGNORECASE):
        return True

    return False


def normalize_category(category: str) -> str:
    """Normalize category tagging to consistent format."""
    if pd.isna(category):
        return 'unknown'

    # Convert to lowercase and replace spaces with underscores
    category = category.lower().strip()
    category = re.sub(r'\s+', '_', category)

    # Standardize known categories
    category_map = {
        'paye': 'paye',
        'paye_tax': 'paye',
        'vat': 'vat',
        'value_added_tax': 'vat',
        'income_tax': 'income_tax',
        'corporate_tax': 'corporate_tax',
        'cit': 'corporate_tax',
        'withholding_tax': 'withholding_tax',
        'wht': 'withholding_tax',
        'tin_registration': 'tin_registration',
        'tin': 'tin_registration',
        'personal_reliefs': 'personal_relief',
        'personal_relief': 'personal_relief',
        'capital_gains_tax': 'capital_gains_tax',
        'cgtd': 'capital_gains_tax',
        'self_employed': 'self_employment',
        'self_employment': 'self_employment',
        'sme': 'sme',
        'small_medium_enterprise': 'sme',
        'ngo_tax': 'ngo_tax',
        'real_estate': 'real_estate',
        'sector_specific': 'sector_specific',
        'filing_deadlines': 'filing_deadline',
        'filing_deadline': 'filing_deadline',
        'filing_process': 'filing_process',
        'compliance': 'compliance',
        'penalties': 'penalties',
        'penalty': 'penalties',
        'double_taxation': 'double_taxation',
        'dta': 'double_taxation',
        'appeals': 'appeals',
        'transfer_pricing': 'transfer_pricing',
        'tp': 'transfer_pricing',
        'digital_economy': 'digital_economy',
        'levies': 'levies',
        'import_customs': 'customs',
        'customs': 'customs',
        'excise_duty': 'excise_duty',
        'payment_methods': 'payment',
        'payment': 'payment',
        'glossary': 'glossary',
        'legal_references': 'legal_reference',
        'legal_reference': 'legal_reference',
        'general_tax_education': 'tax_education',
        'tax_education': 'tax_education',
        'faq_conversational': 'faq',
        'faq': 'faq',
        'estate_tax': 'estate_tax',
        'amnesty': 'amnesty',
        'refunds': 'refunds',
        'refund': 'refunds',
        'gra_services': 'gra_services',
        'tax_planning': 'tax_planning',
        'enforcement': 'enforcement',
        'metadata_raw_notes': 'metadata',
    }

    return category_map.get(category, category)


def normalize_source(source: str) -> str:
    """Normalize source attribution format."""
    if pd.isna(source):
        return 'unknown'

    # Remove extra whitespace and standardize
    source = source.strip()
    source = re.sub(r'\s+', '_', source)

    # Standardize GRA prefix
    if not source.startswith('GRA_'):
        source = 'GRA_' + source

    return source


def deduplicate_chunks(df: pd.DataFrame) -> pd.DataFrame:
    """
    Flag potential duplicate chunks based on content similarity.
    Does not remove but adds a flag for review.
    """
    df['potential_duplicate'] = False
    df['duplicate_group'] = None

    # Group by category for comparison
    categories = df['category'].unique()

    group_id = 0
    for cat in categories:
        cat_df = df[df['category'] == cat]
        if len(cat_df) <= 1:
            continue

        # Simple dedup based on first 200 chars similarity
        seen = {}
        for idx, row in cat_df.iterrows():
            content_prefix = str(row['raw_text'])[:200].lower()
            content_prefix = normalize_whitespace(content_prefix)

            if content_prefix in seen:
                df.at[idx, 'potential_duplicate'] = True
                df.at[idx, 'duplicate_group'] = seen[content_prefix]
            else:
                seen[content_prefix] = group_id

        group_id += 1

    return df


def clean_dataset(input_path: str, output_path: str) -> pd.DataFrame:
    """
    Main cleaning pipeline for the GRA TaxBot dataset.
    """
    print(f"Loading dataset from: {input_path}")
    df = load_dataset(input_path)
    print(f"Loaded {len(df)} records")

    # Exclude internal metadata notes — these are data quality notes, not tax knowledge
    metadata_mask = df['category'].str.lower().str.contains('metadata', na=False)
    excluded_count = metadata_mask.sum()
    df = df[~metadata_mask].reset_index(drop=True)
    if excluded_count > 0:
        print(f"Excluded {excluded_count} internal metadata record(s)")

    # Initialize new columns
    df['cleaned_text'] = ''
    df['content_type'] = 'formal'
    df['is_time_sensitive'] = False
    df['has_missing_values'] = False
    df['structured_fields'] = None

    # Apply cleaning transformations
    for idx, row in df.iterrows():
        text = row['raw_text']

        # Step 1: Normalize whitespace
        cleaned = normalize_whitespace(text)

        # Step 2: Normalize number formatting
        cleaned = normalize_number_formatting(cleaned)

        # Step 3: Normalize rate formatting
        cleaned = normalize_rate_formatting(cleaned)

        # Step 4: Flag time-sensitive content
        cleaned, is_sensitive = flag_time_sensitive_content(cleaned)
        df.at[idx, 'is_time_sensitive'] = is_sensitive

        # Step 5: Preserve and tag informal content
        cleaned, content_type = preserve_informal_content(cleaned)
        df.at[idx, 'content_type'] = content_type

        # Step 6: Detect missing values
        has_missing = detect_missing_values(cleaned)
        df.at[idx, 'has_missing_values'] = has_missing

        # Step 7: Extract structured fields
        structured = extract_structured_fields(cleaned)
        df.at[idx, 'structured_fields'] = str(structured) if structured else None

        # Store cleaned text
        df.at[idx, 'cleaned_text'] = cleaned

    # Step 8: Normalize category and source
    df['category'] = df['category'].apply(normalize_category)
    df['source'] = df['source'].apply(normalize_source)

    # Step 9: Flag potential duplicates
    df = deduplicate_chunks(df)

    # Step 10: Add metadata for RAG
    df['chunk_id'] = df['id']
    df['text_length'] = df['cleaned_text'].apply(lambda x: len(str(x)) if pd.notna(x) else 0)
    df['word_count'] = df['cleaned_text'].apply(lambda x: len(str(x).split()) if pd.notna(x) else 0)

    # Drop original raw_text column and keep cleaned version
    df = df.drop(columns=['raw_text'])
    df = df.rename(columns={'cleaned_text': 'text'})

    # Save cleaned dataset
    output_dir = Path(output_path).parent
    output_dir.mkdir(parents=True, exist_ok=True)

    df.to_csv(output_path, index=False, encoding='utf-8')
    print(f"Cleaned dataset saved to: {output_path}")
    print(f"Total records: {len(df)}")
    print(f"\nCleaning Summary:")
    print(f"  - Time-sensitive records: {df['is_time_sensitive'].sum()}")
    print(f"  - Informal content records: {(df['content_type'] == 'informal').sum()}")
    print(f"  - Records with missing values: {df['has_missing_values'].sum()}")
    print(f"  - Potential duplicates flagged: {df['potential_duplicate'].sum()}")
    print(f"  - Categories: {df['category'].nunique()}")
    print(f"  - Unique sources: {df['source'].nunique()}")

    return df


def validate_cleaned_data(df: pd.DataFrame) -> Dict:
    """Validate the cleaned dataset and return quality metrics."""
    metrics = {
        'total_records': len(df),
        'records_with_text': df['text'].notna().sum(),
        'avg_text_length': df['text'].str.len().mean(),
        'avg_word_count': df['word_count'].mean(),
        'category_distribution': df['category'].value_counts().to_dict(),
        'source_distribution': df['source'].value_counts().to_dict(),
        'time_sensitive_ratio': df['is_time_sensitive'].mean(),
        'informal_content_ratio': (df['content_type'] == 'informal').mean(),
        'missing_values_ratio': df['has_missing_values'].mean(),
        'duplicate_ratio': df['potential_duplicate'].mean(),
    }

    return metrics


if __name__ == '__main__':
    import sys

    # Configuration — accept input path as CLI arg or use default
    DEFAULT_INPUT = str(Path(__file__).parent.parent / 'Notes-rem' / 'gra_taxbot_raw_dataset_MASTER.csv')
    INPUT_PATH = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_INPUT
    OUTPUT_PATH = str(Path(__file__).parent / 'data' / 'cleaned_dataset.csv')

    # Run cleaning pipeline
    cleaned_df = clean_dataset(INPUT_PATH, OUTPUT_PATH)

    # Validate and print metrics
    metrics = validate_cleaned_data(cleaned_df)
    print(f"\n{'='*50}")
    print("DATA QUALITY METRICS")
    print(f"{'='*50}")
    for key, value in metrics.items():
        if isinstance(value, dict):
            print(f"\n{key}:")
            for k, v in value.items():
                print(f"  {k}: {v}")
        else:
            print(f"{key}: {value}")
