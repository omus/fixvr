import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "docs",
  cleanUrls: true,

  title: "FixVR",
  description: "The Valve Index blank-EDID bug was fixed at its source in ddcutil 3.0.2. fixvr is now a legacy fallback for systems that can't update.",

  head: [
    ['meta', { property: 'og:title', content: 'FixVR' }],
    ['meta', { property: 'og:description', content: 'The Valve Index wedge was fixed upstream in ddcutil 3.0.2. fixvr is now a legacy fallback for systems that cannot update.' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://fixvr.miguvt.com' }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['meta', { name: 'twitter:title', content: 'FixVR' }],
    ['meta', { name: 'twitter:description', content: 'The Valve Index wedge was fixed upstream in ddcutil 3.0.2. fixvr is now a legacy fallback.' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔧</text></svg>' }],
  ],

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Root Cause', link: '/root-cause' },
      { text: 'Installation', link: '/install' },
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'The real root cause', link: '/root-cause' },
          { text: 'Installation', link: '/install' },
        ]
      }
    ],

    editLink: {
      pattern: 'https://github.com/MiguVT/fixvr/edit/main/webpage/docs/:path',
      text: 'Edit this page on GitHub'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/miguvt/fixvr' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026-present FixVR contributors'
    }
  }
})
