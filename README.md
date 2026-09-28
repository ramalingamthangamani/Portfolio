# ⚡ Ramalingam T — AI / ML & Deep Learning Engineer Portfolio

[![Live Demo](https://img.shields.io/badge/Live_Portfolio-Vercel_App-B8F7E4?style=for-the-badge&logo=vercel&logoColor=25272C)](https://ramalingamportfolio.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-25272C?style=for-the-badge&logo=github&logoColor=B8F7E4)](https://github.com/ramalingamthangamani/My_portfolio)
[![License](https://img.shields.io/badge/License-MIT-B8F7E4?style=for-the-badge&color=25272C)](LICENSE)

Welcome to the official portfolio repository of **Ramalingam T**, AI/ML & Deep Learning Engineer. This project showcases production-grade web architecture, hardware-accelerated interactive canvas visualizers, custom scroll engines, and an end-to-end overview of research & engineering applications in **Edge AI, Multimodal NLP, Computer Vision, and Agentic Systems**.

---

## 🔬 Core Focus Areas

- **Edge AI & Real-Time Inference**: Low-latency model execution on constrained edge devices and wearable hardware.
- **Multimodal NLP & Agentic Systems**: Autonomous decision pipelines, LLM prompt inspection, and offline voice intelligence.
- **Computer Vision & Automated Video Pipelines**: Object detection, automated clipping, and signal processing for sports analytics & healthcare.
- **Spatial / XR Human-Computer Interaction**: Blending real-time sensor streams with 3D/VR environments in Unity & Blender.

---

## 🚀 Key Projects Highlighted

| Project | Description | Core Stack |
| :--- | :--- | :--- |
| **IWI — Intelligent Wearable Interface** | Real-time gesture recognition glove translating human hand motion into text/speech via low-latency edge ML. | `Edge ML` · `Sensors` · `Gesture AI` |
| **Thozhan — Offline Voice AI** | Privacy-first desktop assistant combining Whisper & SpeechBrain for biometric authentication & Tanglish voice intent parsing. | `Whisper` · `SpeechBrain` · `Offline NLP` |
| **AI Prescription Parser** | Converts handwritten/digital medical prescriptions into structured health records (EHR) using OCR & NLP. | `OCR` · `NLP` · `Healthcare Automation` |
| **PortInspector** | Cross-platform CLI for real-time network port monitoring — scan open ports, identify services and diagnose connectivity and process-level issues. | `CLI` · `Networking` · `Cross-Platform` |
| **Agentic System Analyzer** | Diagnostic evaluation platform inspecting API latency, prompt efficiency, and computational bottlenecks in LLM pipelines. | `LLMOps` · `Pipeline Analysis` · `Optimization` |
| **Social Radar** | Real-time trend aggregator monitoring social streams for emerging keyword detection and live sentiment scoring. | `Sentiment Analysis` · `Real-Time Data Viz` |

---

## 🛠 Technical Stack & Tools

- **Artificial Intelligence & Data Science**: Transformers, Multimodal AI Systems, Edge AI, PyTorch/TensorFlow, Model Optimization, OpenCV, MLOps.
- **Languages**: Python, Java, SQL, JavaScript (ES6+), C++.
- **3D & XR Development**: Unity 3D, Blender, VR/Spatial HCI.
- **Tools & Infrastructure**: GitHub Actions CI/CD, Google Colab, n8n Automation, Roboflow, Figma.

---

## 🎨 Design System & Visual Architecture

- **Palette**: Paper (`#EFECE6`) and Ink (`#0E0E10`) editorial system with a single Klein-blue signal accent (`#2B2BF5`); dark "chapters" for Selected Work and Contact.
- **Typography**: Geist (display & body), Geist Mono (metadata), Instrument Serif italic (accents).
- **Hero Signal Field**: Canvas dot-matrix interference field that bends around the cursor and ripples on click/tap.
- **Live Project Visuals**: Each project has its own generative canvas — hand-landmark gestures (IWI), radial voice waveform (Thozhan), OCR scan-to-record (Prescription Parser), port-grid scan with a live service log (PortInspector), congested pipeline graph (Agentic Analyzer), radar sweep (Social Radar). Canvases only animate while on screen.
- **Motion**: GSAP + ScrollTrigger (pinned horizontal project gallery, word-mask reveals, scroll-inked manifesto) with Lenis smooth scroll; custom blend-mode cursor, magnetic buttons, hover image previews.
- **Resilience & Accessibility**: Content is fully readable if the CDN scripts fail; `prefers-reduced-motion` disables smooth scroll, pinning and animation; skip link, focus styles, semantic landmarks.
- **Production SEO**: Schema.org `Person` JSON-LD, canonical URL, OpenGraph/Twitter cards (`assets/img/og.jpg`), `robots.txt`, `sitemap.xml`.

---

## 📁 Repository Structure

```text
.
├── index.html                  # Single-page portfolio
├── assets/
│   ├── css/main.css            # Design system & layout
│   ├── js/main.js              # Loader, scroll motion, cursor, navigation
│   ├── js/visuals.js           # Hero signal field + per-project canvas visuals
│   └── img/                    # Optimised WebP photography, portrait, OG card
├── resume/
│   └── Ramalingam_T_Resume.pdf # Downloadable résumé
├── portfolio images/           # Original full-resolution event photos (source files)
├── Ramalingam T.png            # Original portrait (source file)
├── .github/workflows/deploy.yml
├── robots.txt
└── sitemap.xml
```

---

## 🌐 Live Production & Local Setup

### Live Production Deployment
- **Vercel Live App**: [https://ramalingamportfolio.vercel.app/](https://ramalingamportfolio.vercel.app/)
- **GitHub Repository**: [https://github.com/ramalingamthangamani/My_portfolio](https://github.com/ramalingamthangamani/My_portfolio)

### Run Locally
Simply open `index.html` in any modern web browser or serve via a local static server:

```bash
# Using Python builtin HTTP server
python -m http.server 8000
```
Navigate to `http://localhost:8000`.

### Continuous Deployment (Vercel & GitHub Actions)
- **Vercel**: Automatic continuous deployment from `main` branch.
- **GitHub Pages**: Automated via `.github/workflows/deploy.yml`.

---

## 📬 Contact & Professional Links

- **Email**: [ramalingamthangamani2023@gmail.com](mailto:ramalingamthangamani2023@gmail.com)
- **LinkedIn**: [linkedin.com/in/ramalingam05](https://www.linkedin.com/in/ramalingam05)
- **GitHub**: [github.com/ramalingamthangamani](https://github.com/ramalingamthangamani)
- **Figma Portfolio**: [Figma Interactive Prototype](https://www.figma.com/proto/o5HJb6UHcOmvJiHmUWKDx4)

---

*© 2026 Ramalingam T. All rights reserved.*
