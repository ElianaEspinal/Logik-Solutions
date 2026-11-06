# 💡 Logik Solutions


<p align="center">
  <img width="1536" height="1024" alt="Maqueta responsive de Logik Solutions" src="https://github.com/user-attachments/assets/89045779-874b-4244-9aad-5fcc5b730f25" />

</p>


-->

<p align="center">
  <a href="https://www.linkedin.com/in/eliana-espinal/">
    <img src="https://img.shields.io/badge/LinkedIn-blue?style=for-the-badge&logo=linkedin" />
  </a>
  <a href="mailto:espinaleliana22@gmail.com">
    <img src="https://img.shields.io/badge/Email-white?style=for-the-badge&logo=gmail" />
  </a>
  <a href="https://wa.me/34672930481?text=Hola%20Eliana!%20me%20gustaria%20recibir%20más%20información">
    <img src="https://img.shields.io/badge/WhatsApp-white?style=for-the-badge&logo=whatsapp" />
  </a>
</p>

---

## 🌐 Live Demo
🚧 Coming soon. The website is currently in a staging environment.

---

## 🧠 About the Project

Logik Solutions is an energy consultancy based in Girona (Spain). This project is a complete rebuild of its website: it replaces a WordPress landing page with a hand-coded, bilingual, high-performance site.

The goal is to turn visitors into enquiries (contact form or phone call) through a clear value proposition, fast loading times and strong organic visibility in search engines and AI assistants.

Developed by Eliana Espinal for Logik Solutions.

---

## ✨ Main Features

- 🌍 Bilingual site (Catalan by default, Spanish as second language), with one URL per language and reciprocal `hreflang` tags
- 🏠 Pages by customer type and service: homes, businesses, residential communities, photovoltaic self-consumption, paperwork management and how the service works
- 📝 Blog with SEO-optimised articles, related-article cards and cover images
- 🔍 Technical SEO: structured data (JSON-LD), sitemap, `robots.txt`, canonical URLs and an `llms.txt` file for AI assistants
- 📩 Contact and pre-study forms connected to Formspree, with spam protection
- 🍪 Cookie consent banner with Google Consent Mode: analytics only run after the visitor accepts
- ⚖️ Legal pages: legal notice, privacy policy and cookie policy
- 🔒 Security hardening: security headers, protected files and automated checks
- 📱 Responsive design for mobile and desktop, with optimised WebP images
- ♿ Accessibility-minded: keyboard navigation, visible focus and reduced-motion support

---

## 🖼️ Project Preview



### 🏠 NavBar

<img width="945" height="417" alt="Captura de pantalla 2026-11-06 130500" src="https://github.com/user-attachments/assets/e70b5c9f-62cd-47e4-8bf8-ca6bfdd88a34" />


### 📝 Blog
<img width="862" height="377" alt="Captura de pantalla 2026-11-06 130528" src="https://github.com/user-attachments/assets/79b6d40e-9711-4971-b462-a4ffa4c1cb62" />


### 📩 Contact
<img width="620" height="378" alt="Captura de pantalla 2026-11-06 130611" src="https://github.com/user-attachments/assets/08ab2871-85d3-4c60-962e-434915ee411b" />



---

## 🛠️ Technologies Used

- HTML
- CSS
- JavaScript
- TypeScript
- Astro (static site generation and internationalisation)
- Node.js and npm
- Formspree (form handling)
- Google Tag Manager and Google Analytics 4 (with Consent Mode)
- JSON-LD / Schema.org (structured data)
- Apache `.htaccess` (security headers and redirects)
- Hostinger (hosting)
- Git and GitHub

---

## 🚀 Features

- 🌍 **Bilingual website (Catalan / Spanish)**: Catalan as the default language (`/`) and Spanish at `/es/`, with one URL per language and page, reciprocal `hreflang` (including `x-default`), self-referencing canonicals and no automatic language redirects.
- ⚡ **Static and fast**: built with Astro, with optimized and compressed images, minimal JavaScript and responsive layouts for mobile, tablet and desktop.
- 🎨 **Modern, dynamic UI/UX**: a conversion-focused design with a clear value proposition, one main goal per page (contact form or phone call), short forms and light, accessible visuals.
- 🔎 **Technical and local SEO**: structured data (JSON-LD), automatic sitemap, robots.txt, clean slugs, internal linking and local business markup for Girona.
- 🤖 **LLM-ready content**: `llms.txt`, FAQ sections with matching structured data and clear, citable answers with sources.
- 📝 **Blog engine**: Markdown articles with frontmatter, reciprocal translations, quick-answer summaries, FAQs, source lists and automatic breadcrumbs.
- 📩 **Protected contact forms**: Formspree integration with honeypot, time-based trap, strict validation and a required privacy checkbox.
- 🍪 **Privacy-first tracking**: cookie banner with equal "accept" and "reject" options, Google Consent Mode v2 and GA4 / GTM events that only fire after consent.
- ⚖️ **Legal compliance**: legal notice, privacy policy and cookie policy in both languages, with data managed from a single config file.
- 🔒 **Security hardening**: HTTPS enforcement, security headers via `.htaccess`, Content Security Policy, blocked sensitive files, escaped structured data and `security.txt`.
- 🧪 **Staging and production environments**: `noindex` and password protection in staging, full indexation in production, and builds that fail if unfinished content is left in.
- ✅ **Automated quality checks**: scripts for broken links, text and SEO validation (`check:links`, `check:text`, `check:seo`, `check:security`).
- ♿ **Accessibility**: semantic HTML, keyboard navigation, correct `lang` attributes, descriptive alt text and ARIA labels.
