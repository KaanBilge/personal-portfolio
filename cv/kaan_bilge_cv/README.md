# Kaan Bilge CV

One-page CV for quantitative and AI/ML internship applications. The original CVs remain unchanged.

## Files

- `Kaan_Bilge_CV.tex`: editable source; works with Tectonic, XeLaTeX or pdfLaTeX.
- `../../output/pdf/Kaan_Bilge_CV.pdf`: compiled application copy.

Compile from the repository root with:

```powershell
New-Item -ItemType Directory -Force -Path output/pdf | Out-Null
& ./.local/cv-tools/tectonic-0.17.0/tectonic.exe --outdir output/pdf cv/kaan_bilge_cv/Kaan_Bilge_CV.tex
```

Tectonic 0.17.0 is stored locally in the ignored `.local/cv-tools` directory. It was downloaded from the official Tectonic release and its SHA-256 was checked against the release metadata. A standard LaTeX installation can compile this source without the portable tool.

## Content decisions

- Education and olympiad medals lead. Experience, working software, teaching and contest organisation provide evidence of applied skills.
- Removed the generic summary and repeated references to AI-assisted development. Retained the internship's supplied role title and the actual technical work.
- Preserved in-development and prototype status. Did not invent deployment, users, performance gains, model benchmarks or financial research experience.
- Kept the published Puzzleminer prototype alongside two ongoing projects. Project claims come from the supplied CVs.
- Removed high school, personal travel, general club membership, planned releases and the list of coding assistants to make room for relevant evidence.
- An application to Claude Code Campus Ambassador is not an appointment or award, so it is not listed.

## Source reconciliation

These notes are editorial and do not appear on the PDF.

- **GPA:** Kaan confirmed 3.70/4.00 in this conversation on 27 September 2026. This supersedes the conflicting 3.81 in v2.
- **ABC problem count:** Kaan confirmed 40+ in this conversation, superseding 30+ in codex_cv and 50+ in v2. The claim remains authored and reviewed, rather than 40+ authored alone.
- **Expected graduation:** Kaan confirmed 2028 in this conversation; no month was supplied or inferred.
- **HALKBANK:** dates are 15 June-10 July 2026, abbreviated to Jun-Jul. Kaan described an autonomous, experimental system for the bank's large documents: an orchestrator agent scored and judged a separate RAG agent's performance and assessed retrieval and embedding effectiveness. The bullets preserve its experimental status. No numerical result, production deployment or unmentioned framework is claimed.
- **Mercor:** both sources support 50+ original mathematics problems. Neither source establishes benchmark improvements or model-training ownership.
- **Skills:** TypeScript, React Native and Expo are supported by Progressive. Docker is explicitly labelled internship exposure; the generic OCR exposure is omitted. No PyTorch, TensorFlow, SQL, probability/statistics coursework or trading experience has been inferred.
- **Links:** GitHub profile and Puzzleminer returned HTTP 200 on 27 September 2026. The Wizard Battle and Progressive repository URLs from `src/content.js` each returned HTTP 404 on unauthenticated HEAD and GET requests. They are therefore not linked in the CV. Their visibility/URLs should be addressed during the website update; no repository visibility was changed.

The portfolio and deployment are the next stage; neither is changed by this CV revision.

## Verification

Compiled with Tectonic, rendered with Poppler and visually reviewed. The PDF is one A4 page, uses embedded fonts, has selectable text in the correct reading order and contains working PDF link annotations. Confirmed figures and dates were checked in the extracted text. All text lies within the page bounds.
