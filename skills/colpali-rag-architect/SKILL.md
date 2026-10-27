---
name: colpali-rag-architect
description: Architecture and implementation guide for ColPali multi-vector vision-language RAG pipelines. Use when building retrieval systems over visually rich PDFs, financial tables, scanned invoices, blueprints, scientific papers, or replacing brittle OCR/text-chunking pipelines.
---

# ColPali Multi-Vector Vision-Language RAG Architecture

This skill guides engineers and agents in building multi-vector visual retrieval pipelines using **ColPali** (based on Google PaliGemma & SigLIP) to eliminate OCR errors and preserve spatial layout during document retrieval.

---

## 1. Why Traditional OCR-Based RAG Fails

Traditional RAG destroys document topology:
1. **OCR Extraction (Tesseract / PyPDF):** Strips tables, multi-column layouts, charts, and header hierarchies into flat, unstructured strings.
2. **Dense Semantic Compression:** A dense single-vector embedding (e.g., 1536d) averages entire pages or paragraphs, obscuring granular numbers in financial statements.
3. **Loss of Visual Semantics:** Font weights, colored badges, axis legends, and flowchart arrows are permanently lost.

---

## 2. The ColPali Paradigm: Document-as-Image

Instead of parsing raw text, ColPali renders every PDF page directly into an image:
- **Vision Transformer:** PaliGemma / SigLIP processes image patches (e.g., 1024 visual tokens per page).
- **Multi-Vector Representation:** Every visual patch generates its own 128-dimensional projection vector.
- **Late-Interaction MaxSim:** Query tokens dynamically compute maximum dot-product similarity against every image patch.

$$\text{Score}(Q, D) = \sum_{i=1}^{|Q|} \max_{j=1}^{|D|} (q_i \cdot d_j)$$

Each query token (e.g. `"EBITDA"`, `"Q3"`) matches the exact physical bounding patch containing that cell or axis label on the rendered page.

---

## 3. End-to-End ColPali Pipeline

```
[Document PDF]
      │
      ▼
[Rasterize Pages to Images (pdf2image @ 150-300 DPI)]
      │
      ▼
[ColPali Model (PaliGemma Vision Encoder)]
      │
      ▼
[Page Multi-Vectors: 1024 x 128-dim vectors per page]
      │
      ▼
[Vector Store with Multi-Vector Late Interaction (Qdrant / Vespa / Milvus)]
      │
      ▲ [Query: "What was net revenue in 2024?"]
      │
[Late Interaction MaxSim Search ➔ Returns exact Page Image + Visual Coordinates]
      │
      ▼
[Vision-Language Model (Gemini 1.5 Pro / Claude 3.5 Sonnet / GPT-4o)]
      │
[Precise Visual Answer with Zero OCR Hallucination]
```

---

## 4. Python Implementation Reference

```python
# colpali_retrieval.py
import torch
from pdf2image import convert_from_path
from PIL import Image
from colpali_engine.models import ColPali, ColPaliProcessor

class ColPaliEngine:
    def __init__(self, model_name: str = "vidore/colpali-v1.2"):
        self.device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
        self.model = ColPali.from_pretrained(
            model_name,
            torch_dtype=torch.bfloat16 if self.device != "cpu" else torch.float32,
            device_map=self.device
        ).eval()
        self.processor = ColPaliProcessor.from_pretrained(model_name)

    def embed_pdf_pages(self, pdf_path: str) -> list[torch.Tensor]:
        """Converts PDF pages into rendered PIL images and extracts patch embeddings."""
        images = convert_from_path(pdf_path, dpi=150)
        batch_images = self.processor.process_images(images).to(self.device)
        with torch.no_grad():
            page_embeddings = self.model(**batch_images)
        return list(torch.unbind(page_embeddings.to("cpu")))

    def embed_query(self, query: str) -> torch.Tensor:
        """Embeds query text into multi-token late-interaction vectors."""
        batch_query = self.processor.process_queries([query]).to(self.device)
        with torch.no_grad():
            query_embeddings = self.model(**batch_query)
        return query_embeddings.to("cpu")

    def score_pages(self, query_emb: torch.Tensor, page_embeddings: list[torch.Tensor]) -> list[float]:
        """Calculates ColBERT MaxSim scores across all pages."""
        stacked_pages = torch.stack(page_embeddings).to(self.device)
        scores = self.processor.score_multi_vector(query_emb.to(self.device), stacked_pages)
        return scores[0].tolist()
```

---

## 5. Storage & Vector DB Sizing Rules

1. **Vector Dimension:** ColPali uses **128 dimensions** per patch vector.
2. **Vectors per Page:** Typical resolution creates **~1,024 vectors per page**.
3. **Quantization:** Always apply **Binary Quantization (BQ)** or **Scalar Quantization (SQ)** in vector databases (e.g. Qdrant / Vespa) to reduce RAM consumption by up to 96% with $<2\%$ recall degradation.
4. **When to Choose ColPali:**
   - Balance sheets, 10-K filings, invoices, receipts.
   - Engineering blueprints and architecture diagrams.
   - Academic papers with multi-column layouts, charts, and equations.
   - Complex documents where OCR accuracy drops below 90%.
