# Kaan Bilge CV

One-page CV tailored to quantitative trading and research internships. Older CV directories are preserved.

## Files

- `Kaan_Bilge_CV.tex`: editable source; works with Tectonic, XeLaTeX or pdfLaTeX.
- `Kaan_Bilge_CV.txt`: plain-text export of the current PDF, with typographic ligatures normalized.
- `../../output/pdf/Kaan_Bilge_CV.pdf`: compiled application copy.

The requested text file was absent on 28 September 2026. This revision used the existing LaTeX source and created the text export.

Compile from the repository root:

```powershell
New-Item -ItemType Directory -Force -Path output/pdf | Out-Null
& ./.local/cv-tools/tectonic-0.17.0/tectonic.exe --outdir output/pdf cv/kaan_bilge_cv/Kaan_Bilge_CV.tex
```

Tectonic 0.17.0 is stored in the ignored `.local/cv-tools` directory. The previous setup downloaded it from the official release and checked its SHA-256 against the release metadata. A standard LaTeX installation can also compile the source.

## Tailoring decisions - 28 September 2026

- Lead with education and mathematics honours. Move programming and numerical libraries above experience.
- Add the verified Zhautykov mathematics rank and field size. Do not invent denominators for the other honours.
- Preserve HALKBANK's actual role title and experimental evaluation work; expand RAG on first use. No named metric or improvement is inferred.
- Describe Mercor as mathematics problem authorship for LLM training, without implying ownership of model training or measured model improvement.
- Replace Progressive and Puzzleminer with Thesis, already present in the portfolio and implemented in a neighbouring repository. Retain one concise Wizard Battle bullet for additional programming evidence.
- Keep Thesis in development. Valuation software supports financial-analysis and engineering claims; it does not establish profitable trading or predictive accuracy.
- Keep ACM as a role title. "Oversaw" would add unverified responsibilities, while "served" could imply that the appointment has ended.
- Omit Docker exposure and mobile frameworks from the targeted skills list; add SQLite and Next.js, supported by Thesis. No proficiency level or SQL expertise is inferred.
- Preserve email, GitHub and LinkedIn. No phone number appears in the source, despite the automated feedback reporting one.

## Evidence and reconciliation

These notes do not appear on the PDF.

- **GPA:** the previous reconciliation records Kaan's confirmation of 3.70/4.00 on 27 September 2026, superseding 3.81 in v2.
- **ABC count:** the previous reconciliation records Kaan's confirmation of 40+, superseding 30+ in codex_cv and 50+ in v2. This means authored and reviewed, not 40+ authored alone.
- **Graduation:** the previous reconciliation records Kaan's confirmation of expected graduation in 2028; no month was supplied.
- **HALKBANK:** dates are 15 June-10 July 2026, abbreviated to Jun-Jul. Earlier reconciliation describes an autonomous experimental evaluator: an orchestrator scored a separate RAG agent and assessed retrieval and embedding effectiveness for bank documents. Dataset size, named metrics, production deployment and measured gains are unconfirmed.
- **Mercor:** both older sources support 50+ original mathematics problems for AI training. The current source also describes an LLM training dataset.
- **Zhautykov:** the [official 2024 results](https://izho.kz/contest/results-izho-2024/), checked on 28 September 2026, list Kaan Bilge under mathematics, team code `1TUR12`, with 29 points and Gold. The mathematics table contains 286 contestant rows; 11 scores exceed 29 and no other contestant has 29. Thus 12th of 286 is calculated from published scores, not copied from an explicit rank column. There are 26 mathematics gold medallists. The denominator excludes physics and computer science.
- **Other honours:** the national olympiad year and YKS top-30 claim remain as supplied. Exact YKS category/rank and the appropriate cohort size are unconfirmed. No percentile is calculated against all YKS registrants. The national olympiad field size and gold-medal count are also unconfirmed.
- **Thesis:** `src/content.js` identifies it as Kaan's stock-research project. Its repository at `../thesis` supplies the README, `docs/analyst.md`, `src/analyst/calculations.ts` and `src/lib/validation.ts`. These show FCFF/FCFE valuation, P/E and EV multiples, discount-rate/terminal-growth sensitivity grids, and source-date checks. Files were inspected read-only; no analysis was run or investment result inferred.
- **Status and links:** Thesis and Wizard Battle remain in development. No unverified project URL was added. Contact links were preserved.

## Next improvements requiring real evidence

1. **HALKBANK:** add the actual evaluation method, test-question/document count or volume, measures used, and a defensible comparison or finding. Negative or inconclusive results can be informative. Do not label the work Recall@k, MRR, nDCG or faithfulness evaluation unless those methods were used.
2. **Honours:** confirm the exact YKS score category/rank and national olympiad edition. Use denominators that match the award or ranking.
3. **Statistics:** add completed or explicitly in-progress probability/statistics coursework or research if supported; none is inferred from medals.
4. **Research project:** future work should test a clear hypothesis with reproducible experiments. For a strategy study, document chronological held-out evaluation, baselines, sample dates, transaction costs, turnover and leakage controls. Report Sharpe, returns and drawdown only when actually measured and appropriate. This is a future suggestion, not a current CV claim.

## Interpreting the automated feedback

The score is an editorial heuristic, not an estimate of interview or offer probability. Counts of problems, students and cities describe scope, not measured performance improvement. Concision and evaluation detail are useful targets; a trading backtest is not universally required.

Primary employer pages checked on 28 September 2026:

- [Jane Street trading internship](https://www.janestreet.com/join-jane-street/internships/trading/): the curriculum assumes no prior finance, trading or markets knowledge.
- [Jane Street quantitative researcher internship](https://www.janestreet.com/join-jane-street/position/8498547002/): projects involve data, experimental design, models and trading signals.
- [Optiver quantitative research internship, 2027 start](https://www.optiver.com/join-us/jobs/quantitative-research-and-machine-learning/amsterdam/quantitative-research-internship-2027-start/): emphasises mathematics, probability/statistics, programming and independent research; this particular role lists 2028 graduation.

Editorial assessment: the existing evidence supports a mathematics-led trading application. For research applications, probability/statistics and empirical work remain useful additions. For quant development, tailor bullets to implementation, testing and measured engineering performance once those details are available.

## Verification

Compiled with Tectonic and rendered with Poppler for visual review. Verified one A4 page, selectable text in reading order, contact-link annotations and text within page bounds. The text export comes from the final PDF with Unicode ligatures normalized. No website source or deployment was changed.
