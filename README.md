# 💡 Logik Solutions

<!-- Add a banner image at docs/images/banner.png and uncomment the next block
<p align="center">
  <img src="docs/images/banner.png" alt="Logik Solutions website preview" />
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

<!-- Add screenshots to docs/images/ and uncomment the lines below

### 🏠 Home
![Home](docs/images/home.png)

### 📝 Blog
![Blog](docs/images/blog.png)

### 📩 Contact
![Contact](docs/images/contact.png)
-->

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

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Quality checks:

```bash
npm run check:links
npm run check:text
npm run check:seo
npm run check:security
```

The build behaves differently depending on the `SITE_ENV` variable (`staging` or `production`). See `.env.example` for the required variables.

---

## 📄 Documentation

Internal documentation (project context, tracking, blog guidelines, deployment and security) is in the `docs/` folder.
